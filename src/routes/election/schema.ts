import { type Static, t } from "elysia";
import { electionInfo } from "$lib/constants";

export const Position = t.Union([
	...electionInfo.positions.map((position) =>
		t.Literal(position.const, {
			description: position.description,
		}),
	),
]);
export type Position = Static<typeof Position>;

// const c = t.Union([t.Literal("sd"), t.Literal("as")]);

// export type Position = (typeof electionInfo.positions)[number];

export const CandidateId = t.Union(
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
);
export type CandidateId = Static<typeof CandidateId>;

export const Vote = t.Object({
	candidateId: CandidateId,
	position: Position,
});
export type Vote = Static<typeof Vote>;

// const a = t.Record(Position, t.Number());
// const b: Static<typeof a> = {};

export const ElectionResult = t.Object({
	totalVotes: t.Number({
		description: "Total votes casted",
		examples: [123456],
	}),
	votesByPosition: t.Record(Position, t.Record(CandidateId, t.Number()), {
		description:
			"A record of position and a record of candidate (including `no-vote` and `disapprove`) and their vote count",
		examples: [
			{
				president: {
					"no-vote": 530,
					disapprove: 490,
					6734444444: 1,
					6735555555: 1,
				},
				"vice-president": {
					"no-vote": 12,
					disapprove: 34,
					6736666666: 56,
					6737777777: 78,
				},
			},
		],
	}),
});
// typescript cant infer each case of Position as a literal so we need to create this manually
export type ElectionResult = {
	totalVotes: number;
	votesByPosition: Record<Position, Record<CandidateId, number>>;
};
