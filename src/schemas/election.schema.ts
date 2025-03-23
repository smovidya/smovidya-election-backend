import { z } from "@hono/zod-openapi";
import { authErrorSchema } from "../services/auth.service";
import { eligibilityErrorSchema } from "../services/eligibility.service";
import { createErrorResponseSchema } from "../utils/api";

const item = (value: string, description: string) => ({
	const: value,
	description,
});

export const positionSchema = z
	.enum([
		"president",
		"vice-president-1",
		"vice-president-2",
		"secretary",
		"treasurer",
		"student-relations",
		"academic",
		"public-service",
		"art",
		"sport",
	])
	.openapi({
		description: "The position the candidate is running for",
		oneOf: [
			item("president", "นายกสโมสร"),
			item("vice-president-1", "อุปนายกคนที่ 1"),
			item("vice-president-2", "อุปนายกคนที่ 2"),
			item("secretary", "เลขานุการ"),
			item("treasurer", "เหรัญญิก"),
			item("student-relations", "ประธานฝ่ายนิสิตสัมพันธ์"),
			item("academic", "ประธานฝ่ายวิชาการ"),
			item("public-service", "ประธานฝ่ายพัฒนาสังคมและบำเพ็ญประโยชน์"),
			item("art", "ประธานฝ่ายศิลปะและวัฒนธรรม"),
			item("sport", "ประธานฝ่ายกีฬา"),
		],
	});

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
		position: positionSchema,
	})
	.openapi("Vote");

export const googleIdTokenSchema = z
	.string()
	.openapi({
		description:
			"The Google ID token of the voter from Firebase Authentication",
		examples: ["eyJhbGciOi...ZjY4NzUxZjIwZjI4"],
	})
	.openapi("GoogleIdToken");

export const submitVoteSchema = z.object({
	googleIdToken: googleIdTokenSchema,
	votes: z.array(voteSchema),
});

export const submitVoteResponseOkSchema = z.object({
	success: z.literal(true),
	message: z.string(),
});

export const submitVoteErrorSchema = z.enum([
	"invalid-body",
	...authErrorSchema.options,
	...eligibilityErrorSchema.options,
]);

export const submitVoteResponseErrorSchema = createErrorResponseSchema(
	submitVoteErrorSchema,
);

export const submitVoteResponseSchema = z.discriminatedUnion("success", [
	submitVoteResponseOkSchema,
	submitVoteResponseErrorSchema,
]);

export const queryEligibilitySchema = z.object({
	googleIdToken: googleIdTokenSchema.openapi({
		param: {
			name: "googleIdToken",
			in: "path",
		},
	}),
});

export const queryEligibilityResponseOkSchema = z.object({
	success: z.literal(true),
	eligible: z.boolean().openapi({
		description: "Whether the voter is eligible to vote",
	}),
});

export const queryEligibilityErrorSchema = z.enum([
	"invalid-body",
	...authErrorSchema.options,
	...eligibilityErrorSchema.options,
]);

export const queryEligibilityResponseErrorSchema = createErrorResponseSchema(
	queryEligibilityErrorSchema,
);

export const queryEligibilityResponseSchema = z.discriminatedUnion("success", [
	queryEligibilityResponseOkSchema,
	queryEligibilityResponseErrorSchema,
]);

export type Position = z.infer<typeof positionSchema>;
export type Vote = z.infer<typeof voteSchema>;
export type SubmitVote = z.infer<typeof submitVoteSchema>;
export type SubmitVoteResponse = z.infer<typeof submitVoteResponseSchema>;
