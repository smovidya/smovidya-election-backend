import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";

// Routes
import { electionRoutes } from "./routes/election.route";

const app = new Hono<{ Bindings: Env }>();

app.route("/api", electionRoutes).get("/spec", swaggerUI({ url: "/api" }));

export default app;
