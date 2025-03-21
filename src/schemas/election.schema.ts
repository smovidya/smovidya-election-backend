import { z } from "@hono/zod-openapi";
import { authErrorSchema } from "../services/auth.service";

export const voteSchema = z
	.object({
		candidateId: z
			.number()
			.or(z.enum(["no-vote", "disapprove"]))
			.openapi({
				description:
					'The student ID of the candidate or "no-vote" (cast no vote when multiple candidate) or "disapprove (when there is only one candidate)',
				examples: [1234567823, "no-vote", "disapprove"],
			}),
		position: z.string().openapi({
			description: "The position the candidate is running for",
			examples: [
				"President",
				"Vice President",
				"Secretary",
				"Treasurer",
				"Auditor",
				"P.R.O.",
			],
		}),
	})
	.openapi("Vote");

export const submitVoteSchema = z.object({
	googleIdToken: z.string().openapi({
		description:
			"The Google ID token of the voter from Firebase Authentication",
		examples: ["eyJhbGciOi...ZjY4NzUxZjIwZjI4"],
	}),
	votes: z.array(voteSchema),
});

export const submitVoteResponseOkSchema = z.object({
	success: z.literal(true),
	message: z.string(),
});

export const submitVoteErrorSchema = z.enum([
	"invalid-body",
	...authErrorSchema.options,
]);
export const submitVoteResponseErrorSchema = z.object({
	success: z.literal(false),
	code: submitVoteErrorSchema,
	message: z.string(),
});

export const submitVoteResponseSchema = z.discriminatedUnion("success", [
	submitVoteResponseOkSchema,
	submitVoteResponseErrorSchema,
]);

export type Vote = z.infer<typeof voteSchema>;
export type SubmitVote = z.infer<typeof submitVoteSchema>;
export type SubmitVoteResponse = z.infer<typeof submitVoteResponseSchema>;
