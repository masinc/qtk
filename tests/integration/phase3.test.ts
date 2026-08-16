// Phase 3 統合テスト (Web UI API)
import { test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initStore } from "../../src/commands/init";
import { loadConfig } from "../../src/config/config";
import { createApp } from "../../src/web/hono-app";
import { createIssue, findIssue } from "../../src/commands/issue";

let storeDir: string;
let config: Awaited<ReturnType<typeof loadConfig>>;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  storeDir = join(tmpdir(), `qtk-e2e-p3-${Date.now()}`);
  mkdirSync(storeDir, { recursive: true });
  await initStore({ dir: storeDir, defaults: true });
  config = await loadConfig(storeDir);
  app = createApp({ storeDir, config });
});

afterAll(() => {
  rmSync(storeDir, { recursive: true, force: true });
});

test("E2E: Web API — GET /api/issues", async () => {
  await createIssue(storeDir, config, { title: "API テスト", tags: ["web"] });
  const res = await app.request("http://127.0.0.1/api/issues");
  expect(res.status).toBe(200);
  const data = (await res.json()) as { issues: { id: number; title: string; idLabel: string }[] };
  expect(data.issues.length).toBe(1);
  expect(data.issues[0]?.title).toBe("API テスト");
  expect(data.issues[0]?.idLabel).toBe("#0001");
});

test("E2E: Web API — POST /api/issues (作成)", async () => {
  const res = await app.request("http://127.0.0.1/api/issues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "API 作成", description: "説明", tags: ["api"] }),
  });
  expect(res.status).toBe(201);
  const data = (await res.json()) as { id: number };
  expect(data.id).toBe(2);
  const found = await findIssue(storeDir, 2);
  expect(found?.record.frontmatter.title).toBe("API 作成");
});

test("E2E: Web API — POST /api/issues/:id/edit (ステータス更新)", async () => {
  const res = await app.request("http://127.0.0.1/api/issues/2/edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "done" }),
  });
  expect(res.status).toBe(200);
  const found = await findIssue(storeDir, 2);
  expect(found?.record.frontmatter.status).toBe("done");
});

test("E2E: Web API — POST /api/issues/:id/claim", async () => {
  const res = await app.request("http://127.0.0.1/api/issues/1/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ as: "agent-web" }),
  });
  expect(res.status).toBe(200);
  const found = await findIssue(storeDir, 1);
  expect(found?.record.frontmatter.claimed_by).toBe("agent-web");
});

test("E2E: Web API — 404 とエラーハンドリング", async () => {
  const res = await app.request("http://127.0.0.1/api/unknown");
  expect(res.status).toBe(404);
});
