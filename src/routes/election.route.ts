import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { electionModel } from "../models/election.model";
import {
	queryEligibilityResponseErrorSchema,
	queryEligibilityResponseOkSchema,
	queryEligibilitySchema,
	submitVoteResponseErrorSchema,
	submitVoteResponseOkSchema,
	submitVoteSchema,
} from "../schemas/election.schema";
import { authService } from "../services/auth.service";
import { eligibilityService } from "../services/eligibility.service";
import { jsonContent } from "../utils/api";

export const electionRoutes = new OpenAPIHono<{ Bindings: Env }>()
	.openapi(
		createRoute({
			method: "post",
			path: "/vote",
			request: {
				body: jsonContent(submitVoteSchema),
			},
			responses: {
				200: jsonContent(submitVoteResponseOkSchema, "Success"),
				400: jsonContent(submitVoteResponseErrorSchema, "Bad Request"),
				401: jsonContent(submitVoteResponseErrorSchema, "Unauthorized"),
				403: jsonContent(submitVoteResponseErrorSchema, "Forbidden"),
				500: jsonContent(
					submitVoteResponseErrorSchema,
					"Internal Server Error",
				),
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
				// a bit of type information is lost.
				// TODO: i will think about this later.
				// in an ideal case we would have something like
				// 200 -> { ok: true, ... }
				// 401 -> { ok: false, code: "A" | "B" }
				// 402 -> { ok: false, code: "C" }
				// 403 -> { ok: false, code: "A" | "B" | "D" }
				// but we got
				// 401 -> { ok: false, code: "A" | "B" | "C" | "D" }
				// 402 -> { ok: false, code: "A" | "B" | "C" | "D" }
				// 403 -> { ok: false, code: "A" | "B" | "C" | "D" }
				// also, it look like c.json first params' generic is not const for some fucking reason
				// we should try elysia

				200: jsonContent(queryEligibilityResponseOkSchema, "Success"),
				400: jsonContent(queryEligibilityResponseErrorSchema, "Bad Request"),
				401: jsonContent(queryEligibilityResponseErrorSchema, "Unauthorized"),
				403: jsonContent(queryEligibilityResponseErrorSchema, "Forbidden"),
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
