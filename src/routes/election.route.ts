import { Hono } from "hono";
import { electionController } from "../controllers/election.controller";

export const electionRoutes = new Hono<{ Bindings: Env }>()
	.get("/candidates", electionController.getCandidates)
	.post("/vote", electionController.submitVote)
	.get("/results", electionController.getResults);
