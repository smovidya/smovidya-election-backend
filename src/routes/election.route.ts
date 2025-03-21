import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
	submitVoteResponseErrorSchema,
	submitVoteResponseOkSchema,
	submitVoteSchema,
} from "../schemas/election.schema";
import { authService } from "../services/auth.service";

// export const electionRoutes = new Hono<{ Bindings: Env }>()
// 	.post("/vote", electionController.submitVote)
// 	.get("/candidates", electionController.getCandidates)
// 	.get("/results", electionController.getResults);

export const electionRoutes = new OpenAPIHono<{ Bindings: Env }>().openapi(
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
		},
	}),
	async (c) => {
		const { googleIdToken, votes } = c.req.valid("json");
		const result = await authService.getStudentId(googleIdToken);

		if (!result.isOk()) {
			return c.json(
				{
					success: false,
					code: result.error,
					message: "TODO: better error message",
				} as const,
				401,
			);
		}

		const voterStudentId = result.value;

		// TODO: Implement vote submission

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
);
