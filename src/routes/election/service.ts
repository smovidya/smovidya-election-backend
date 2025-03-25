import { type Static, t } from "elysia";
import { err, ok } from "neverthrow";
import { electionInfo } from "../../lib/constants";
import { ElectionModel } from "./model";
import type { ElectionResult, Vote } from "./schema";

export const ElectionPeriodError = t.UnionEnum([
	"election-not-started",
	"election-not-ended",
	"announcement-not-started",
]);
export type ElectionPeriodError = Static<typeof ElectionPeriodError>;

// typescript hate spreading
export const VoteError = t.UnionEnum([
	"election-not-started",
	"election-ended",
	"voted-already",
]);
export type VoteError = Static<typeof VoteError>;

export class ElectionService {
	constructor(private model = new ElectionModel()) {}

	votingPeriodChecker({ currentTime }: { currentTime?: Date }) {
		const now = currentTime || new Date();
		if (now < electionInfo.voteStart) {
			return err("election-not-started");
		}

		if (now >= electionInfo.voteEnd) {
			return err("election-ended");
		}

		return ok();
	}

	announcementPeriodChecker({ currentTime }: { currentTime?: Date }) {
		const now = currentTime || new Date();
		if (now < electionInfo.voteStart) {
			return err("election-not-started");
		}

		if (now < electionInfo.voteEnd) {
			return err("election-not-ended");
		}

		if (now < electionInfo.resultAnnouncement) {
			return err("announcement-not-started");
		}

		return ok();
	}

	// async vote({
	// 	voterId,
	// 	votes,
	// 	currentTime,
	// }: { voterId: string; votes: Vote[]; currentTime: Date }) {}

	async addVotes({ voterId, votes }: { voterId: string; votes: Vote[] }) {
		return await this.model.addVotes({ voterId, votes });
	}

	async isVoted({ voterId }: { voterId: string }) {
		return await this.model.isVoted({ voterId });
	}

	async currentVoterCount() {
		return await this.model.currentVoterCount();
	}

	async getElectionResults() {
		const cached = await this.model.getCachedElectionResult();
		if (cached) {
			return ok(cached);
		}

		const defaultVoteCount = () => ({
			"no-vote": 0,
			disapprove: 0,
		});

		// Initialize result object with default values
		const result: ElectionResult = {
			totalVotes: 0,
			votesByPosition: {
				president: defaultVoteCount(),
				"public-service": defaultVoteCount(),
				academic: defaultVoteCount(),
				"student-relations": defaultVoteCount(),
				"vice-president-1": defaultVoteCount(),
				"vice-president-2": defaultVoteCount(),
				art: defaultVoteCount(),
				sport: defaultVoteCount(),
				secretary: defaultVoteCount(),
				treasurer: defaultVoteCount(),
			},
		};

		// Get total votes count
		const totalVotesResult = await this.model.getTotalVotesCount();
		if (totalVotesResult.isErr()) {
			return err(totalVotesResult.error);
		}
		result.totalVotes = totalVotesResult.value;

		// Get vote counts by position and candidate
		const voteCountsResult = await this.model.getVoteCountsByCandidate();
		if (voteCountsResult.isErr()) {
			return err(voteCountsResult.error);
		}

		// Populate the results from SQL query
		for (const voteCount of voteCountsResult.value) {
			const { position, candidateId, count } = voteCount;
			result.votesByPosition[position][candidateId] = count;
		}

		const task = await this.model.setCachedElectionResult(result);
		if (task.isErr()) {
			return err(task.error);
		}

		return ok(result);
	}
}
