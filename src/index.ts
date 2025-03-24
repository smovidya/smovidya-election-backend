import { env } from "cloudflare:workers";

import { Elysia } from "elysia";

const app = new Elysia()
	.get("/", "Hello Elysia")
	.get("/user/:id", ({ params: { id } }) => id)
	.post("/form", ({ body }) => body);

export default app;
