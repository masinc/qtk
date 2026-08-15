// qtk web コマンド (ローカル Web UI / Kanban)
import { join } from "node:path";
import { existsSync } from "node:fs";
import { resolveContext } from "./context";
import { handleApi } from "../web/api";

const STATIC_DIR_CANDIDATES = [
  join(import.meta.dir, "web", "static"),
  join(import.meta.dir, "..", "web", "static"),
];
const STATIC_DIR =
  STATIC_DIR_CANDIDATES.find((d) => existsSync(d)) ??
  join(import.meta.dir, "web", "static");

export interface WebOptions {
  port?: number;
  noOpen?: boolean;
  dir?: string;
}

export async function startWeb(options: WebOptions = {}): Promise<void> {
  const ctx = await resolveContext(options.dir);
  const port = options.port ?? 0;
  const host = "127.0.0.1";

  const server = Bun.serve({
    hostname: host,
    port,
    async fetch(req) {
      const url = new URL(req.url);

      // API ルート
      if (url.pathname.startsWith("/api/")) {
        return handleApi(ctx, req);
      }

      // 静的ファイル
      const path = url.pathname === "/" ? "/index.html" : url.pathname;
      const filePath = join(STATIC_DIR, path);
      if (existsSync(filePath)) {
        const file = Bun.file(filePath);
        return new Response(file, {
          headers: { "Content-Type": contentType(filePath) },
        });
      }

      return new Response("Not Found", { status: 404 });
    },
  });

  const url = `http://${host}:${server.port}`;
  console.log(`qtk web UI: ${url}`);
  console.log(`ストア: ${ctx.storeDir}`);
  console.log("Ctrl+C で停止");

  if (!options.noOpen) {
    // デフォルトブラウザで開く (Windows)
    const { spawn } = await import("node:child_process");
    spawn("cmd", ["/c", "start", url], { detached: true, stdio: "ignore" }).unref();
  }

  // サーバーを維持
  await new Promise(() => {});
}

function contentType(path: string): string {
  if (path.endsWith(".html")) return "text/html; charset=utf-8";
  if (path.endsWith(".css")) return "text/css; charset=utf-8";
  if (path.endsWith(".js")) return "text/javascript; charset=utf-8";
  return "application/octet-stream";
}
