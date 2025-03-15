import { Hono } from "hono";
import { electionRoutes } from "./routes/example.route";

const app = new Hono();

app.route("/example", electionRoutes);

export default app;
