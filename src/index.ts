import { env } from "cloudflare:workers";
import { swagger } from "@elysiajs/swagger";
import { Elysia, t } from "elysia";

const app = new Elysia({
	aot: false,
})
	.use(
		swagger({
			path: "/reference",
			documentation: {
				info: {
					version: "v1",
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
					},
				},
			},
		}),
	)
	.post(
		"/api/vote",
		async ({ body }) => {
			return body;
		},
		{
			body: t.Object({
				votes: t.Array(
					t.Object({
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
					}),
				),
			}),
			detail: {
				description: "Submit votes from a student",
			},
			response: {},
		},
	)
	.get("/api/eligibility", () => {}, {
		response: t.Object({
			eligible: t.Boolean({
				description: "Whether the student is eligible to vote or not",
				title: "Eligibility",
				examples: [true, false],
			}),
		}),
		detail: {
			description: "Check if the current student is eligible to vote",
		},
	});

export default app;
