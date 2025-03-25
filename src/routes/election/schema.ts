import { type Static, t } from "elysia";
import { electionInfo } from "../../lib/constants";

export const Vote = t.Object({
	candidateId: t.Union(
		[
			t.Number({
				description: "Student ID of the candidate",
				title: "Student ID",
			}),
			t.Literal("no-vote", {
				title: "No Vote",
				description:
					"Cast no vote when multiple candidate or not express opinion on one candidate",
			}),
			t.Literal("disapprove", {
				title: "Disapprove",
				description: "Not approve when there is only one candidate",
			}),
		],
		{
			description:
				'The student ID of the candidate or "no-vote" (cast no vote when multiple candidate) or "disapprove (when there is only one candidate)',
			examples: [1234567823, "no-vote", "disapprove"],
		},
	),
	position: t.Union([
		...electionInfo.positions.map((position) =>
			t.Literal(position.const, {
				description: position.description,
			}),
		),
	]),
});
export type Vote = Static<typeof Vote>;
