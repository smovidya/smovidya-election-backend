import { Hono } from "hono";
import { electionController } from "../controllers/example.controller";

export const electionRoutes = new Hono()
	.get("/candidates", electionController.getCandidates)
	.post("/vote", electionController.submitVote)
	.get("/results", electionController.getResults);
