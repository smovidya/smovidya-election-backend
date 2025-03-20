import type { ControllerContext } from "../utils/types";
import { electionService } from "../services/example.service";

export const electionController = {
	getCandidates: async (c: ControllerContext) => {
		const candidates = await electionService.getCandidates();
		c.env.DB;
		return c.json(
			{
				data: candidates,
			},
			201,
		);
	},

	submitVote: async (c: ControllerContext) => {
		const voteData = await c.req.json();
		const result = await electionService.processVote(voteData);
		return c.json(result, 201);
	},

	getResults: async (c: ControllerContext) => {
		const results = await electionService.calculateResults();
		return c.json(
			{
				...results,
			},
			200,
		);
	},
};
