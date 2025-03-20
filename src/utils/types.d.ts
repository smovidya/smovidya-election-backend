import type { Context } from "hono";

export type ControllerContext = Context<{ Bindings: Env }>;
