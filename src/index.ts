import { env } from "cloudflare:workers";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";

// Routes
import { devRoutes } from "./routes/dev.route";
import { electionRoutes } from "./routes/election.route";

const app = new OpenAPIHono<{ Bindings: Env }>();

app
	.route("/api", electionRoutes)
	.doc("/spec.json", {
		openapi: "3.0.0",
		info: {
			version: "v1",
			title: "SMO Vidya Election API",
			contact: {
				name: "SMO Vidya Election Backend Team",
				url: "https://github.com/smovidya/smovidya-election-backend",
			},
		},
	})
	.get("/swagger", swaggerUI({ url: "/spec.json" }))
	.get(
		"/reference",
		apiReference({
			url: "/spec.json",
		}),
	);

if (env.ENVIRONMENT === "dev") {
	app.route("/dev", devRoutes);
}

export default app;
