import type { ControllerContext } from "../utils/types";
import { authService } from "../services/auth.service";
import { electionService } from '../services/example.service';

export const electionController = {
	getCandidates: async (c: ControllerContext) => {
		const candidates = await electionService.getCandidates();
		return c.json(
			{
				data: candidates,
			},
			201,
		);
	},

	submitVote: async (c: ControllerContext) => {
		const { googleIdToken } = c.req.valid('param')
		const result = await authService.getStudentId(googleIdToken)

		if (!result.ok) {
			return c.json({
				success: false,
				message: result.error,
			}, 401)
		}

		const voterStudentId = result.value;

		// TODO: Implement vote submission

		return c.json({
			success: true,
			message: "Vote submitted successfully",
		}, 200)
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
