// Phase 3 統合テスト (Web UI API・ADR 移行)
import { test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initStore } from "../../src/commands/init";
import { loadConfig } from "../../src/config/config";
import { migrateAdr } from "../../src/commands/migrate-adr";
import { handleApi } from "../../src/web/api";
import { createIssue, findIssue } from "../../src/commands/issue";

let storeDir: string;
let config: Awaited<ReturnType<typeof loadConfig>>;

beforeAll(async () => {
  storeDir = join(tmpdir(), `qtk-e2e-p3-${Date.now()}`);
  mkdirSync(storeDir, { recursive: true });
  await initStore({ dir: storeDir, defaults: true });
  config = await loadConfig(storeDir);
});

afterAll(() => {
  rmSync(storeDir, { recursive: true, force: true });
});

test("E2E: Web API — GET /api/issues", async () => {
  await createIssue(storeDir, config, { title: "API テスト", tags: ["web"] });
  const res = await handleApi({ storeDir, config }, new Request("http://127.0.0.1/api/issues"));
  expect(res.status).toBe(200);
  const data = (await res.json()) as { issues: { id: number; title: string; idLabel: string }[] };
  expect(data.issues.length).toBe(1);
  expect(data.issues[0]?.title).toBe("API テスト");
  expect(data.issues[0]?.idLabel).toBe("#0001");
});

test("E2E: Web API — POST /api/issues (作成)", async () => {
  const res = await handleApi(
    { storeDir, config },
    new Request("http://127.0.0.1/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "API 作成", description: "説明", tags: ["api"] }),
    }),
  );
  expect(res.status).toBe(201);
  const data = (await res.json()) as { id: number };
  expect(data.id).toBe(2);
  const found = await findIssue(storeDir, 2);
  expect(found?.record.frontmatter.title).toBe("API 作成");
});

test("E2E: Web API — POST /api/issues/:id/edit (ステータス更新)", async () => {
  const res = await handleApi(
    { storeDir, config },
    new Request("http://127.0.0.1/api/issues/2/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    }),
  );
  expect(res.status).toBe(200);
  const found = await findIssue(storeDir, 2);
  expect(found?.record.frontmatter.status).toBe("done");
});

test("E2E: Web API — POST /api/issues/:id/claim", async () => {
  const res = await handleApi(
    { storeDir, config },
    new Request("http://127.0.0.1/api/issues/1/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ as: "agent-web" }),
    }),
  );
  expect(res.status).toBe(200);
  const found = await findIssue(storeDir, 1);
  expect(found?.record.frontmatter.claimed_by).toBe("agent-web");
});

test("E2E: Web API — 404 とエラーハンドリング", async () => {
  const res = await handleApi({ storeDir, config }, new Request("http://127.0.0.1/api/unknown"));
  expect(res.status).toBe(404);
});

test("E2E: migrate-adr — Python 形式から qtk 形式に変換", async () => {
  // Python 製 ADR CLI 形式のサンプルを作成
  const sourceDir = join(tmpdir(), `qtk-adr-src-${Date.now()}`);
  mkdirSync(sourceDir, { recursive: true });
  writeFileSync(
    join(sourceDir, "0001-db-selection.md"),
    `---
title: "データベース選定"
description: "DB を選定する"
status: "accepted"
date: "2026-01-15"
deciders:
  - "@alice"
tags:
  - architecture
  - database
---

## Context

DB 選定の背景。

## Decision

PostgreSQL を採用。

## Consequences

運用コストが増える。
`,
  );
  writeFileSync(
    join(sourceDir, "0002-auth-design.md"),
    `---
title: "認証設計"
description: "認証方式の設計"
status: "proposed"
date: "2026-02-01"
deciders:
  - "@bob"
tags:
  - security
supersedes: 1
---

## Context

認証設計の背景。

## Decision

JWT を採用。

## Consequences

トークン管理が必要。
`,
  );

  try {
    const result = await migrateAdr(config, {
      sourceDir,
      storeDir,
      dryRun: false,
    });
    expect(result.migrated).toBe(2);
    expect(result.errors.length).toBe(0);

    // 変換結果を確認
    const { listAdrFiles } = await import("../../src/commands/adr");
    const files = await listAdrFiles(storeDir);
    expect(files.length).toBe(2);

    // supersedes 参照が新しい ID に更新されているか
    const auth = files.find((f) => f.record.frontmatter.title === "認証設計");
    expect(auth?.record.frontmatter.supersedes).toBeDefined();
    expect(auth?.record.frontmatter.created_at).toBeDefined();
    expect(auth?.record.frontmatter.tags).toContain("security");
  } finally {
    rmSync(sourceDir, { recursive: true, force: true });
  }
});

test("E2E: migrate-adr — dry-run はファイルを変更しない", async () => {
  const sourceDir = join(tmpdir(), `qtk-adr-dry-${Date.now()}`);
  mkdirSync(sourceDir, { recursive: true });
  writeFileSync(
    join(sourceDir, "0001-test.md"),
    `---
title: "テスト ADR"
status: "proposed"
date: "2026-03-01"
---

## Context

テスト。
`,
  );

  try {
    const before = (await import("../../src/commands/adr")).listAdrFiles(storeDir);
    const result = await migrateAdr(config, {
      sourceDir,
      storeDir,
      dryRun: true,
    });
    expect(result.migrated).toBe(1);
    const after = await (await import("../../src/commands/adr")).listAdrFiles(storeDir);
    expect(after.length).toBe((await before).length);
  } finally {
    rmSync(sourceDir, { recursive: true, force: true });
  }
});
