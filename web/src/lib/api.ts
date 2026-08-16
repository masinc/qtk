import { hc } from "hono/client";
import type { App } from "@backend/hono-app";

export const api = hc<App>("/");
