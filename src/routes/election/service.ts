import { err, ok } from "neverthrow";
import { electionInfo } from "../../lib/constants";
import { ElectionModel } from "./model";
import { type Static, t } from "elysia";
import type { Vote } from "./schema";
import { assert } from "../../lib/function";

export const ElectionPeriodError = t.UnionEnum([
	"election-not-started",
	"election-ended",
	"election-not-ended",
	"announcement-not-started",
]);
export type ElectionPeriodError = Static<typeof ElectionPeriodError>;

export const VoteError = t.UnionEnum([
	// typescript hate spreading
	ElectionPeriodError.enum[0],
	ElectionPeriodError.enum[1],
	ElectionPeriodError.enum[2],
	"voted-already",
]);
export type VoteError = Static<typeof VoteError>;

assert(
	ElectionPeriodError.enum.length === VoteError.enum.length,
	"These two enums should be eqaul in lenght",
);

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
	announcementPeriodChecker() {
		const now = new Date();
		if (now < electionInfo.voteEnd) {
			return err("election-not-ended");
		}

		if (now < electionInfo.resultAnnouncement) {
			return err("announcement-not-started");
		}

		return ok();
	}

	async addVotes({ voterId, votes }: { voterId: string; votes: Vote[] }) {
		return await this.model.addVotes({ voterId, votes });
	}

	async isVoted({ voterId }: { voterId: string }) {
		return await this.model.isVoted({ voterId });
	}

	async currentVoterCount() {
		return await this.model.currentVoterCount();
	}
}
