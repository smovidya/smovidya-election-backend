import { env } from "cloudflare:workers";
import { err, ok, type Result, ResultAsync } from "neverthrow";
import type { CandidateId, ElectionResult, Position, Vote } from "./schema";

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

	private parseDbCandidateId(
		dbCandidateId: string,
	): Result<CandidateId, "fail-parsing-candidate-id"> {
		if (dbCandidateId === "no-vote") return ok("no-vote");
		if (dbCandidateId === "disapprove") return ok("disapprove");
		const numId = Number.parseInt(dbCandidateId, 10);
		if (Number.isNaN(numId)) {
			return err("fail-parsing-candidate-id");
		}

		return ok(numId);
	}

	async getAllVotes() {
		// this wont explode right?
		const query = await env.DB.prepare("SELECT * FROM votes").all();

		if (query.error) {
			console.error(query.error);
			return err("internal-error");
		}

		return ok(
			query.results as {
				voterId: string;
				position: Vote["position"];
				candidateId: Vote["candidateId"];
			}[],
		);
	}

	async getTotalVotesCount() {
		const prepared = env.DB.prepare("SELECT COUNT(*) as total FROM votes");

		const result = await ResultAsync.fromPromise(prepared.first(), (e) => e);

		if (result.isErr()) {
			console.error(result.error);
			return err("internal-error");
		}

		return ok((result.value?.total as number) || 0);
	}

	async getVoteCountsByCandidate() {
		const prepared = env.DB.prepare(
			"SELECT position, candidateId, COUNT(*) as count FROM votes GROUP BY position, candidateId",
		);

		const query = await prepared.all();

		if (query.error) {
			console.error(query.error);
			return err("internal-error");
		}

		const counts = query.results as {
			position: Position;
			candidateId: string;
			count: number;
		}[];

		const mapped = [] as {
			position: Position;
			candidateId: CandidateId;
			count: number;
		}[];

		for (const { candidateId, count, position } of counts) {
			const parsed = this.parseDbCandidateId(candidateId);
			if (parsed.isErr()) {
				return err("internal-error");
			}
			mapped.push({
				candidateId: parsed.value,
				count,
				position,
			});
		}

		return ok(mapped);
	}

	async getCachedElectionResult() {
		// cloudflare say this wont throw and i trust them
		return (await env.KV.get(
			"election-result",
			"json",
		)) as ElectionResult | null;
	}

	async setCachedElectionResult(electionResult: ElectionResult) {
		// this one will throw if we put the value more than once in 1 second.
		const promise = env.KV.put(
			"election-result",
			JSON.stringify(electionResult),
			{
				expirationTtl: 300, // seconds
			},
		);

		return ResultAsync.fromPromise(promise, () => "internal-error" as const);
	}
}
