import { err, ok } from "neverthrow";
import { z } from "zod";
import { electionInfo } from "../constants";
import { electionModel } from "../models/election.model";

export const electionErrorSchema = z.enum([
	"election-not-started",
	"election-ended",
	"election-not-ended",
	"announcement-not-started",
]);

export type ElectionError = z.output<typeof electionErrorSchema>;

export const electionService = {
	isInVotingPeriod() {
		const now = new Date();
		if (now < electionInfo.voteStart) {
			return err("election-not-started");
		}

		if (now >= electionInfo.voteEnd) {
			return err("election-ended");
		}

		return ok();
	},
	isInAnnouncementPeriod() {
		const now = new Date();
		if (now < electionInfo.voteEnd) {
			return err("election-not-ended");
		}

		if (now < electionInfo.resultAnnouncement) {
			return err("announcement-not-started");
		}

		return ok();
	},
	isVoted: (query: { voterId: string }) => electionModel.isVoted(query),
};
