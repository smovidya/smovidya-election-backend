import { type ElysiaSwaggerConfig, swagger } from "@elysiajs/swagger";
import { env } from "cloudflare:workers";
import { Elysia } from "elysia";
import { devRoutes } from "./routes/dev/route";
import { electionRoutes } from "./routes/election/route";

const swaggerOptions = (): ElysiaSwaggerConfig<"/reference"> => {
	return {
		path: "/reference",
		exclude: ["/dev"],
		documentation: {
			info: {
				version: "2568",
				title: "SMO Vidya Election API",
				contact: {
					name: "SMO Vidya Election Backend Team",
					url: "https://github.com/smovidya/smovidya-election-backend",
				},
			},
			security: [{ bearerAuth: [] }],
			components: {
				securitySchemes: {
					bearer: {
						type: "http",
						scheme: "bearer",
						bearerFormat: "JWT",
						description: "Google ID Token from Firebase Authentication",
					},
					...(env.ENVIRONMENT === "dev" && {
						basic: {
							type: "http",
							scheme: "basic",
							description:
								"[TEST MODE ONLY] Basic Auth where `username` is mock student ID and `password` (optional) is mock current date/time in that parsable by JS's Date()",
						},
					}),
				},
			},
		},
	};
};

const app = new Elysia({
	aot: false,
})
	.use(swagger(swaggerOptions()))
	.use(electionRoutes);

if (env.ENVIRONMENT === "dev") {
	app.mount("/dev", devRoutes);
}

export default app;
