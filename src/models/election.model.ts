import type { Vote } from "../schemas/election.schema";
import type { ControllerContext } from "../utils/types";

// TODO: Implement when database is available
export const electionModel = {
	addVotes: async (
		c: ControllerContext,
		{ voterId, votes }: { voterId: string; votes: Vote[] },
	) => {
		const voteStatements = votes.map((vote) => {
			// if voter is already voted, update
			return c.env.DB.prepare(
				"INSERT INTO votes (voter_id, candidate_id, position) VALUES (?, ?, ?)",
			).bind(voterId, vote.candidateId, vote.position);
		});

		const result = await c.env.DB.batch(voteStatements);
	},
};
