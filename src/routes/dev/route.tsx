import { html, Html } from "@elysiajs/html";
import Elysia from "elysia";
import { Page } from "./page";

export const devRoutes = new Elysia({ aot: false })
	.use(html())
	.get("/", ({ set }) => {
		// does disabling aot cause this
		set.headers["content-type"] = "text/html;charset=UTF-8";
		return <Page />;
	});
