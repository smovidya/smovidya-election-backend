import { err, ok } from "neverthrow";
import { electionInfo } from "../constants";
import { ElectionModel } from "../models/election.model";
import { type Static, t } from "elysia";

export const ElectionError = t.UnionEnum([
	"election-not-started",
	"election-ended",
	"election-not-ended",
	"announcement-not-started",
]);
export type ElectionError = Static<typeof ElectionError>;

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
