import { Hono } from "hono";
import { electionController } from "../controllers/election.controller";
import { describeRoute } from "hono-openapi";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
	submitVoteResponseSchema,
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
			params: submitVoteSchema,
		},
		responses: {
			200: {
				content: {
					"application/json": {
						schema: submitVoteResponseSchema,
					},
				},
				description: "Success",
			},
			400: {
				description: "Bad Request",
				content: {
					"application/json": {
						schema: submitVoteResponseSchema,
					},
				},
			},
			401: {
				description: "Unauthorized",
				content: {
					"application/json": {
						schema: submitVoteResponseSchema,
					},
				},
			},
		},
	}),
	electionController.submitVote,
);
