import { z } from "zod";

export const CandidateSchema = z.object({
	id: z.number().positive(),
	name: z.string().min(2),
	party: z.string().min(2),
});

export const VoteSchema = z.object({
	userId: z.string().min(3),
	candidateId: z.number().positive(),
});

export type Candidate = z.infer<typeof CandidateSchema>;
export type Vote = z.infer<typeof VoteSchema>;
