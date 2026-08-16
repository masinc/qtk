// Web UI API (Hono アプリのラッパー)
import { createApp, type WebContext } from "./hono-app";

export type { WebContext } from "./hono-app";
export { createApp } from "./hono-app";

export async function handleApi(
  ctx: WebContext,
  req: Request,
): Promise<Response> {
  return createApp(ctx).request(req);
}
