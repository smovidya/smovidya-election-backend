import Elysia, { t } from "elysia";
import { ElectionService } from "./service";
import { auth } from "../../lib/auth";
import { Vote } from "./schema";

export const electionRoutes = new Elysia({ aot: false })
	.use(auth())
	.decorate("election", new ElectionService())
	.guard(
		{
			async beforeHandle({ studentId, error, auth }) {
				if (!studentId) {
					return error(403, {
						error: "missing-authorization",
					});
				}

				const rightsCheck = await auth.verifyRight(studentId);
				if (rightsCheck.isErr()) {
					return error(403, {
						error: rightsCheck.error,
					});
				}

				// pass
			},
		},
		(app) =>
			app
				.post(
					"/api/vote",
					async ({
						body: { votes },
						election,
						studentId,
						error,
						currentTime,
					}) => {
						const votingPeriodChecker = election.votingPeriodChecker({
							currentTime,
						});

						if (votingPeriodChecker.isErr()) {
							return error(403, {
								error: votingPeriodChecker.error,
							});
						}

						const isVoted = await election.isVoted({ voterId: studentId });

						if (isVoted.isErr()) {
							return error(500, {
								error: isVoted.error,
							});
						}

						if (isVoted.value.isVoted) {
							return error(403, {
								error: "voted-already",
							});
						}

						const voteResult = await election.addVotes({
							voterId: studentId,
							votes,
						});

						if (voteResult.isErr()) {
							return error(500, {
								error: voteResult.error,
							});
						}

						return {
							success: true,
						};
					},
					{
						body: t.Object({
							votes: t.Array(Vote),
						}),
						detail: {
							description: "Submit votes from a student",
						},
						response: {
							200: t.Object(
								{
									success: t.Boolean({
										description: "Whether the vote is successfully submitted",
										title: "Success",
									}),
								},
								{
									description: "Vote submission result",
								},
							),
							403: t.Object(
								{
									error: t.UnionEnum([
										"election-not-started",
										"election-ended",
										"voted-already",
									]),
								},
								{
									description: "Forbidden to vote",
								},
							),
							500: t.Object(
								{
									error: t.UnionEnum(["internal-error"]),
								},
								{
									description: "Internal server error",
								},
							),
						},
					},
				)
				.get(
					"/api/eligibility",
					async ({ election, studentId, error }) => {
						const isVoted = await election.isVoted({ voterId: studentId });

						if (isVoted.isErr()) {
							return error(500, {
								error: isVoted.error,
							});
						}

						return {
							eligible: !isVoted.value.isVoted,
							reason: isVoted.value.isVoted ? "voted-already" : undefined,
						};
					},
					{
						response: {
							200: t.Object({
								eligible: t.Boolean({
									description: "Whether the student is eligible to vote or not",
									title: "Eligibility",
									examples: [true, false],
								}),
								reason: t.Optional(
									t.String({
										description:
											"The reason why the student is not eligible to vote",
										title: "Reason",
									}),
								),
							}),
							401: t.Object({
								error: t.String({
									description: "Missing authorization",
									title: "Error",
								}),
							}),
							500: t.Object({
								error: t.String({
									description: "The error message",
									title: "Error",
								}),
							}),
						},
						detail: {
							description: "Check if the current student is eligible to vote",
						},
					},
				)
				.get(
					"/api/me",
					({ studentId, currentTime }) => ({
						studentId,
						currentTime,
					}),
					{
						detail: {
							description:
								"Get the current student ID and the current date/time specified by the token",
						},
					},
				),
	)
	.get(
		"/api/voter-count",
		async ({ election, error, currentTime }) => {
			const count = await election.currentVoterCount();

			if (count.isErr()) {
				return error(500, {
					error: count.error,
				});
			}

			return {
				count: count.value.count,
				asOf: new Date(currentTime),
			};
		},
		{
			detail: {
				description: "Get the current number of voters who have voted",
			},
			response: {
				200: t.Object({
					count: t.Number({
						description: "The current number of voters who have voted",
						title: "Voter Count",
					}),
					asOf: t.Date({
						description: "The date/time when the count is taken",
						title: "As of",
					}),
				}),
				500: t.Object({
					error: t.String({
						description: "Internal server error",
						title: "Error",
					}),
				}),
			},
		},
	);
