import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
	queryEligibilityResponseErrorSchema,
	queryEligibilityResponseOkSchema,
	queryEligibilitySchema,
	submitVoteResponseErrorSchema,
	submitVoteResponseOkSchema,
	submitVoteSchema,
} from "../schemas/election.schema";
import { authErrorSchema, authService } from "../services/auth.service";
import {
	eligibilityErrorSchema,
	eligibilityService,
} from "../services/eligibility.service";
import { electionModel } from "../models/election.model";

export const electionRoutes = new OpenAPIHono<{ Bindings: Env }>()
	.openapi(
		createRoute({
			method: "post",
			path: "/vote",
			request: {
				body: {
					content: {
						"application/json": {
							schema: submitVoteSchema,
						},
					},
				},
			},
			responses: {
				200: {
					content: {
						"application/json": {
							schema: submitVoteResponseOkSchema,
						},
					},
					description: "Success",
				},
				400: {
					description: "Bad Request",
					content: {
						"application/json": {
							schema: submitVoteResponseErrorSchema,
						},
					},
				},
				401: {
					description: "Unauthorized",
					content: {
						"application/json": {
							schema: submitVoteResponseErrorSchema,
						},
					},
				},
				403: {
					description: "Forbidden",
					content: {
						"application/json": {
							schema: submitVoteResponseErrorSchema,
						},
					},
				},
				500: {
					description: "Internal Server Error",
					content: {
						"application/json": {
							schema: submitVoteResponseErrorSchema,
						},
					},
				},
			},
		}),
		async (c) => {
			const { googleIdToken, votes } = c.req.valid("json");
			const authResult = await authService.getStudentId(googleIdToken);

			if (!authResult.isOk()) {
				return c.json(
					{
						success: false,
						code: authResult.error,
						message: "Unauthorized",
					} as const,
					401,
				);
			}

			const voterStudentId = authResult.value;

			const isEligible = await eligibilityService.isEligible({
				voterId: voterStudentId,
			});

			if (isEligible.isErr()) {
				return c.json(
					{
						success: false,
						code: isEligible.error,
						message: "Ineligible",
					} as const,
					403,
				);
			}

			const voteResult = await electionModel.addVotes({
				voterId: voterStudentId,
				votes,
			});

			if (voteResult.isErr()) {
				return c.json(
					{
						success: false,
						code: voteResult.error,
						message: "Internal Error",
					} as const,
					500,
				);
			}

			return c.json(
				{
					success: true,
					message: "Vote submitted successfully",
				} as const,
				200,
			);
		},
		// see https://github.com/honojs/middleware/tree/main/packages/zod-openapi#handling-validation-errors
		(result, c) => {
			if (!result.success) {
				return c.json(
					{
						success: false,
						code: "invalid-body",
						message: "Validation Error",
					} as const,
					400,
				);
			}
		},
	)
	.openapi(
		createRoute({
			method: "get",
			path: "/eligibility/{googleIdToken}",
			request: {
				params: queryEligibilitySchema,
			},
			responses: {
				200: {
					description: "Success",
					content: {
						"application/json": {
							schema: queryEligibilityResponseOkSchema,
						},
					},
				},
				400: {
					description: "Bad Request",
					content: {
						"application/json": {
							schema: queryEligibilityResponseErrorSchema,
						},
					},
				},
				401: {
					description: "Unauthorized",
					content: {
						"application/json": {
							schema: z.object({
								success: z.literal(false),
								code: z.enum([...authErrorSchema.options]),
								message: z.string(),
							}),
						},
					},
				},
				403: {
					description: "Forbidden",
					content: {
						"application/json": {
							schema: z.object({
								success: z.literal(false),
								code: z.enum([...eligibilityErrorSchema.options]),
								message: z.string(),
							}),
						},
					},
				},
			},
		}),
		async (c) => {
			const { googleIdToken } = c.req.valid("param");
			const authResult = await authService.getStudentId(googleIdToken);

			if (!authResult.isOk()) {
				return c.json(
					{
						success: false,
						code: authResult.error,
						message: "Unauthorized",
					} as const,
					401,
				);
			}

			const voterStudentId = authResult.value;

			const isEligible = await eligibilityService.isEligible({
				voterId: voterStudentId,
			});

			if (isEligible.isErr()) {
				return c.json(
					{
						success: false,
						code: isEligible.error,
						message: "Ineligible",
					} as const,
					403,
				);
			}

			return c.json(
				{
					success: true,
					eligible: true,
				} as const,
				200,
			);
		},
		(result, c) => {
			if (!result.success) {
				return c.json(
					{
						success: false,
						code: "invalid-body",
						message: "Validation Error",
					} as const,
					400,
				);
			}
		},
	);
