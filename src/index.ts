import { env } from "cloudflare:workers";
import { type ElysiaSwaggerConfig, swagger } from "@elysiajs/swagger";
import { Elysia, t } from "elysia";
import { ElectionService } from "./services/election.service";
import { AuthService } from "./services/auth.service";
import { html } from "@elysiajs/html";
import { devRoutes } from "./routes/dev/route";
import { electionInfo } from "./constants";
import { Vote } from "./schemas/election.schema";

const swaggerOptions = (): ElysiaSwaggerConfig<"/reference"> => {
	return {
		path: "/reference",
		exclude: ["/dev"],
		documentation: {
			info: {
				version: "2568",
				title: "SMO Vidya Election API",
				contact: {
					name: "SMO Vidya Election Backend Team",
					url: "https://github.com/smovidya/smovidya-election-backend",
				},
			},
			security: [{ bearerAuth: [] }],
			components: {
				securitySchemes: {
					bearer: {
						type: "http",
						scheme: "bearer",
						bearerFormat: "JWT",
						description: "Google ID Token from Firebase Authentication",
					},
					...(env.ENVIRONMENT === "dev" && {
						basic: {
							type: "http",
							scheme: "basic",
							description:
								"[TEST MODE ONLY] Basic Auth where `username` is mock student ID and `password` (optional) is mock current date/time in that parsable by JS's Date()",
						},
					}),
				},
			},
		},
	};
};

const app = new Elysia({
	aot: false,
})
	.use(swagger(swaggerOptions()))
	.use(html())
	.decorate("auth", new AuthService())
	.decorate("election", new ElectionService())
	.derive(async ({ headers, auth, error }) => {
		if (
			env.ENVIRONMENT === "dev" &&
			headers.authorization?.startsWith("Basic ")
		) {
			console.log("[DEV] Using mock auth");
			const [_, rawToken] = headers.authorization.split(" ");
			const token = atob(rawToken);
			const [studentId, ...time] = token.split(":");

			console.log("[DEV] Mock student ID:", studentId);
			console.log("[DEV] Mock time:", time.join(":"));
			return {
				studentId,
				currentTime: time ? new Date(time.join(":")) : new Date(),
			};
		}

		const [_, idToken] = headers.authorization?.split(" ") ?? [];

		if (!idToken) {
			return error(401, {
				error: "missing-authorization",
			});
		}

		const authResult = await auth.authenticate(idToken);

		if (authResult.isErr()) {
			return error(401, {
				error: authResult.error,
			});
		}

		return {
			studentId: authResult.value.studentId,
			currentTime: new Date(),
		};
	})
	.post(
		"/api/vote",
		async ({ body: { votes }, election, studentId, error, currentTime }) => {
			const votingPeriodChecker = election.votingPeriodChecker({ currentTime });

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
							description: "The reason why the student is not eligible to vote",
							title: "Reason",
						}),
					),
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

// TODO: migrate to ElysiaJS
if (env.ENVIRONMENT === "dev") {
	app.mount("/dev", devRoutes.fetch);
}

export default app;
