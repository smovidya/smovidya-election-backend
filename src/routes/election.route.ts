import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { electionModel } from "../models/election.model";
import {
	type QueryEligibilityResponse,
	queryEligibilityResponseErrorSchema,
	queryEligibilityResponseOkSchema,
	queryEligibilitySchema,
	type SubmitVoteResponse,
	submitVoteResponseErrorSchema,
	submitVoteResponseOkSchema,
	submitVoteSchema,
} from "../schemas/election.schema";
import { authService } from "../services/auth.service";
import { jsonContent } from "../utils/api";
import { electionService } from "../services/election.service";

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
			const authResult = await authService.authenticate(googleIdToken);

			if (authResult.isErr()) {
				return c.json(
					{
						success: false,
						code: authResult.error,
						message: "Unauthorized",
					} satisfies SubmitVoteResponse,
					401,
				);
			}

			const { studentId } = authResult.value;

			const voteResult = await electionModel.addVotes({
				voterId: studentId,
				votes,
			});

			if (voteResult.isErr()) {
				return c.json(
					{
						success: false,
						code: voteResult.error,
						message: "Internal Error",
					} satisfies SubmitVoteResponse,
					500,
				);
			}

			return c.json(
				{
					success: true,
					message: "Vote submitted successfully",
				} satisfies SubmitVoteResponse,
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
					} satisfies SubmitVoteResponse,
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
				500: jsonContent(queryEligibilityResponseErrorSchema, "Internal Error"),
			},
		}),
		async (c) => {
			const { googleIdToken } = c.req.valid("param");
			const authResult = await authService.authenticate(googleIdToken);

			if (authResult.isErr()) {
				return c.json(
					{
						success: false,
						code: authResult.error,
						message: "Unauthorized",
					} satisfies QueryEligibilityResponse,
					401,
				);
			}

			const { studentId } = authResult.value;
			const isVotedResult = await electionService.isVoted({
				voterId: studentId,
			});

			if (isVotedResult.isErr()) {
				return c.json(
					{
						success: false,
						code: isVotedResult.error,
						message: "Internal Error",
					} satisfies QueryEligibilityResponse,
					500,
				);
			}

			return c.json(
				{
					success: true,
					eligible: isVotedResult.value.isVoted,
				} satisfies QueryEligibilityResponse,
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
					} satisfies QueryEligibilityResponse,
					400,
				);
			}
		},
	);
