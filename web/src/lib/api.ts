import type { App } from "@backend/hono-app";
import { hc } from "hono/client";

export const api = hc<App>("/");
