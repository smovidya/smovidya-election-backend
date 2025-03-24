import { env } from "cloudflare:workers";
import type { Vote } from "../schemas/election.schema";
import { err, ok, ResultAsync } from "neverthrow";

/**
 * The electionModel provides methods to interact with the election database.
 *
 * @property {Function} addVotes - Adds votes to the database.
 * @property {Function} isVoted - Checks if a voter has already voted.
 */
export const electionModel = {
	addVotes: async ({ voterId, votes }: { voterId: string; votes: Vote[] }) => {
		const voteStatements = votes.map((vote) =>
			env.DB.prepare(
				"INSERT INTO votes (voterId, candidateId, position) VALUES (?, ?, ?)",
			).bind(voterId, vote.candidateId, vote.position),
		);

		const result = await ResultAsync.fromPromise(
			env.DB.batch(voteStatements),
			() => [],
		);

		if (result.isErr()) return err("internal-error");

		return result.value.every((r) => r.success) ? ok() : err("internal-error");
	},
	isVoted: async ({ voterId }: { voterId: string }) => {
		const prepared = env.DB.prepare(
			"SELECT * FROM votes WHERE voterId = ?",
		).bind(voterId);

		const result = await ResultAsync.fromPromise(prepared.all(), () => []);

		if (result.isErr()) {
			console.error(result.error);
			return err("internal-error");
		}

		return ok({ isVoted: result.value.results.length > 0 });
	},
};

export class ElectionModel {
	async addVotes({ voterId, votes }: { voterId: string; votes: Vote[] }) {
		const voteStatements = votes.map((vote) =>
			env.DB.prepare(
				"INSERT INTO votes (voterId, candidateId, position) VALUES (?, ?, ?)",
			).bind(voterId, vote.candidateId, vote.position),
		);

		const result = await ResultAsync.fromPromise(
			env.DB.batch(voteStatements),
			() => [],
		);

		if (result.isErr()) return err("internal-error");

		return result.value.every((r) => r.success) ? ok() : err("internal-error");
	}

	async isVoted({ voterId }: { voterId: string }) {
		const prepared = env.DB.prepare(
			"SELECT * FROM votes WHERE voterId = ?",
		).bind(voterId);

		const result = await ResultAsync.fromPromise(prepared.all(), () => []);

		if (result.isErr()) {
			console.error(result.error);
			return err("internal-error");
		}

		return ok({ isVoted: result.value.results.length > 0 });
	}
}
