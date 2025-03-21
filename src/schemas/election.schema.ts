import { z } from "@hono/zod-openapi";

export const voteSchema = z
	.object({
		candidateId: z.string().openapi({
			description:
				'The student ID of the candidate or "no-vote" (cast no vote when multiple candidate) or "disapprove (when there is only one candidate)',
			examples: ["1234567823", "no-vote", "disapprove"],
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

export const submitVoteResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
});

export type Vote = z.infer<typeof voteSchema>;
export type SubmitVote = z.infer<typeof submitVoteSchema>;
