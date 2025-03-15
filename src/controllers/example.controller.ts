import type { Context } from "hono";
import { electionService } from "../services/example.service";

export const electionController = {
	getCandidates: async (c: Context) => {
		const candidates = await electionService.getCandidates();
		return c.json(
			{
				data: candidates,
			},
			201,
		);
	},

	submitVote: async (c: Context) => {
		const voteData = await c.req.json();
		const result = await electionService.processVote(voteData);
		return c.json(result, 201);
	},

	getResults: async (c: Context) => {
		const results = await electionService.calculateResults();
		return c.json(
			{
				...results,
			},
			200,
		);
	},
};
