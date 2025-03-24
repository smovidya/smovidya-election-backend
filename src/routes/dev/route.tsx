import { Hono } from "hono";
import { Page } from "./page";

export const devRoutes = new Hono().get("", (c) => {
	return c.html(<Page />);
});
