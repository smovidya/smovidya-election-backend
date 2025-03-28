import Elysia, { error, t } from "elysia";
import { AuthForbiddenError, AuthUnauthorizedError, auth } from "$lib/auth";
import { electionInfo } from "$lib/constants";
import { apiError, apiInternalError, apiOk, mergeUnionEnum } from "$lib/schema";
import { currentTime } from "$lib/time";
import { ElectionResult, Vote } from "./schema";
import { ElectionPeriodError, ElectionService, VoteError } from "./service";

export const electionRoutes = new Elysia({ aot: false })
	.use(currentTime())
	.decorate("election", new ElectionService())
	.group("", (app) =>
		app.use(auth()).guard(
			{
				beforeHandle({ user, error }) {
					if (user.isErr()) {
						const statusCode =
							user.error === "missing-authorization" ||
							user.error === "invalid-token"
								? 401
								: 403;

						return error(statusCode, {
							success: false,
							error: user.error,
						});
					}
				},
			},
			(app) =>
				app
					// this is probably elysia and/or typescript issue
					.resolve(({ user }) => ({ user: user._unsafeUnwrap() }))
					.post(
						"/api/vote",
						async ({
							body: { votes },
							election,
							user: { studentId },
							error,
							currentTime,
						}) => {
							const votingPeriodChecker = election.votingPeriodChecker({
								currentTime,
							});

							if (votingPeriodChecker.isErr()) {
								return error(403, {
									success: false,
									error: votingPeriodChecker.error,
								});
							}

							const isVoted = await election.isVoted({ voterId: studentId });

							if (isVoted.isErr()) {
								return error(500, {
									success: false,
									error: isVoted.error,
								});
							}

							if (isVoted.value.isVoted) {
								return error(403, {
									success: false,
									error: "voted-already",
								});
							}

							const voteResult = await election.addVotes({
								voterId: studentId,
								votes,
							});

							if (voteResult.isErr()) {
								return error(500, {
									success: false,
									error: voteResult.error,
								});
							}

							return {
								success: true,
							};
						},
						{
							body: t.Object({
								votes: t.Array(Vote, {
									description: "Votes to be submitted",
									maxItems: electionInfo.positions.length,
									minItems: electionInfo.positions.length,
									uniqueItems: true,
									examples: [
										[
											// Create a random vote for each position :P
											...electionInfo.positions.map((position, i) => ({
												candidateId:
													i === 5 && Math.random() > 0.5
														? "disapprove"
														: i % 3 === 0
															? "no-vote"
															: 6030000023 + i * 100,
												position: position.const,
											})),
										],
									],
								}),
							}),
							detail: {
								description: "Submit votes from a student",
							},
							response: {
								200: apiOk(undefined, {
									description: "Vote submission result",
								}),
								401: apiError(AuthUnauthorizedError, {
									description: "Unauthorized",
								}),
								403: apiError(mergeUnionEnum(VoteError, AuthForbiddenError), {
									description: "Forbidden to vote",
								}),
								500: apiInternalError(),
							},
						},
					)
					.get(
						"/api/eligibility",
						async ({ election, user: { studentId }, error, auth }) => {
							const verifyRightToVote = await auth.verifyRight(studentId);

							if (verifyRightToVote.isErr()) {
								return error(403, {
									success: false,
									error: verifyRightToVote.error,
								});
							}

							const isVoted = await election.isVoted({ voterId: studentId });

							if (isVoted.isErr()) {
								return error(500, {
									success: false,
									error: isVoted.error,
								});
							}

							return {
								success: true,
								eligible: !isVoted.value.isVoted,
								reason: isVoted.value.isVoted ? "voted-already" : undefined,
							};
						},
						{
							response: {
								200: apiOk(
									t.Object({
										eligible: t.Boolean({
											description:
												"Whether the student is eligible to vote or not",
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
									{
										description: "Eligibility check result",
									},
								),
								401: apiError(AuthUnauthorizedError, {
									description: "Unauthorized",
								}),
								403: apiError(AuthForbiddenError, {
									description: "Forbidden to access",
								}),
								500: apiInternalError(),
							},
							detail: {
								description: "Check if the current student is eligible to vote",
							},
						},
					)
					.get(
						"/api/me",
						({ user: { studentId }, currentTime }) => ({
							success: true,
							studentId,
							currentTime,
						}),
						{
							detail: {
								description:
									"Get the current student ID and the current date/time specified by the token",
							},
							response: {
								200: apiOk(
									t.Object({
										studentId: t.String({
											description: "The user's student ID",
										}),
										currentTime: t.Date({
											description: "Current timestamp",
										}),
									}),
									{
										description: "Current user information",
									},
								),
								401: apiError(AuthUnauthorizedError, {
									description: "Unauthorized",
								}),
								403: apiError(AuthForbiddenError, {
									description: "Forbidden to access",
								}),
							},
						},
					),
		),
	)
	.get(
		"/api/voter-count",
		async ({ election, error, currentTime }) => {
			const count = await election.currentVoterCount();

			if (count.isErr()) {
				return error(500, {
					success: false,
					error: count.error,
				});
			}

			return {
				success: true,
				count: count.value.count,
				asOf: new Date(currentTime),
			};
		},
		{
			detail: {
				description: "Get the current number of voters who have voted",
			},
			response: {
				200: apiOk(
					t.Object({
						count: t.Number({
							description: "The current number of voters who have voted",
							title: "Voter Count",
						}),
						asOf: t.Date({
							description: "The date/time when the count is taken",
							title: "As of",
						}),
					}),
					{
						description: "Current voter count",
					},
				),
				500: apiInternalError(),
			},
		},
	)
	.get(
		"/api/election-result",
		async ({ election, currentTime }) => {
			const availabilty = election.announcementPeriodChecker({ currentTime });

			if (availabilty.isErr()) {
				return error(403, {
					success: false,
					error: availabilty.error,
				});
			}
			const result = await election.getElectionResults();
			if (result.isErr()) {
				return error(500, {
					success: false,
					error: result.error,
				});
			}

			return {
				success: true,
				result,
			};
		},
		{
			detail: {
				description: "Get the election result after the election period",
			},
			response: {
				200: apiOk(
					t.Object({
						result: ElectionResult,
					}),
					{
						description: "Election result (after the election period)",
					},
				),
				403: apiError(ElectionPeriodError, {
					description: "Forbidden to access",
				}),
				500: apiInternalError(),
			},
		},
	);
