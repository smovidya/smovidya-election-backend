import { env } from "cloudflare:workers";
import type { Vote } from "../schemas/election.schema";

// TODO: Implement when database is available
export const electionModel = {
	addVotes: async ({ voterId, votes }: { voterId: string; votes: Vote[] }) => {
		const voteStatements = votes.map((vote) => {
			// if voter is already voted, update
			return env.DB.prepare(
				"INSERT INTO votes (voter_id, candidate_id, position) VALUES (?, ?, ?)",
			).bind(voterId, vote.candidateId, vote.position);
		});

		const result = await env.DB.batch(voteStatements);
	},
};
