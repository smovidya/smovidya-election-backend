import { env } from "cloudflare:workers";
import Elysia from "elysia";

// this wont do anything to the response
export const currentTime = () =>
	new Elysia({
		name: "current-time",
		aot: false,
	}).derive({ as: "scoped" }, ({ headers }) => {
		const now = new Date();
		if (
			env.ENVIRONMENT === "dev" &&
			headers.authorization?.startsWith("Basic ")
		) {
			const [_, rawToken] = headers.authorization.split(" ");

			if (rawToken) {
				const token = Buffer.from(rawToken, "base64").toString("utf-8");
				const [__, ...time] = token.split(":"); // js is shit

				console.log("[DEV] Mock time:", time.join(":") || "now");

				// early return???
				if (time) {
					return {
						currentTime: new Date(time.join(":")),
					};
				}
			}
		}

		return {
			currentTime: now,
		};
	});
