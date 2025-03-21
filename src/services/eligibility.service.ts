import { err, ok } from "neverthrow";
import { electionModel } from "../models/election.model";
import { z } from "zod";

export const eligibilityErrorSchema = z.enum([
	"invalid-student-id",
	"ineligible-not-science-student",
	"ineligible-already-voted",
	"internal-error",
]);

export type EligibilityError = z.output<typeof eligibilityErrorSchema>;

export const eligibilityService = {
	async isEligible({ voterId }: { voterId: string }) {
		if (voterId.length !== 10) {
			return err("invalid-student-id");
		}

		// xxxxxxxx23 for science students
		if (!/^\d{8}23$/.test(voterId)) {
			return err("ineligible-not-science-student");
		}

		const isVoted = await electionModel.isVoted({ voterId });

		if (isVoted.isErr()) {
			return err("internal-error");
		}

		if (isVoted.value.isVoted) {
			return err("ineligible-already-voted");
		}

		return ok();
	},
};
