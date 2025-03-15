type Candidate = {
	id: number;
	name: string;
	party: string;
};

type Vote = {
	userId: string;
	candidateId: number;
};

// Mock Data
const candidates: Candidate[] = [
	{ id: 1, name: "John Doe", party: "Green Party" },
	{ id: 2, name: "Jane Smith", party: "Tech Party" },
	{ id: 3, name: "Bob Johnson", party: "Future Party" },
];

const votes: Vote[] = [
	{ userId: "user-001", candidateId: 1 },
	{ userId: "user-002", candidateId: 2 },
];

export const electionService = {
	getCandidates: async () => candidates,

	processVote: async (voteData: Vote) => {
		votes.push(voteData);
		return { success: true, message: "Vote recorded", voteId: Date.now() };
	},

	calculateResults: async () => {
		const result: Record<number, number> = {};

        for (const vote of votes) {
            result[vote.candidateId] = (result[vote.candidateId] || 0) + 1;
        }

		return result;
	},
};
