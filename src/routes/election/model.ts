import { env } from "cloudflare:workers";
import { err, ok, ResultAsync } from "neverthrow";
import type { Vote } from "./schema";

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

	async currentVoterCount() {
		// TODO: Maybe add some cache here (;ater)
		const prepared = env.DB.prepare(
			"SELECT COUNT(DISTINCT voterId) FROM votes",
		);

		const result = await ResultAsync.fromPromise(prepared.first(), (e) => e);

		if (result.isErr()) {
			console.error(result.error);
			return err("internal-error");
		}

		return ok({
			count: (result.value?.["COUNT(DISTINCT voterId)"] as number) || 0,
		});
	}
}
