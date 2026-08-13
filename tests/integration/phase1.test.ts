// Phase 1 統合テスト (E2E シナリオ)
import { test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initStore } from "../../src/commands/init";
import { loadConfig } from "../../src/config/config";
import {
  createIssue,
  listIssues,
  showIssue,
  editIssue,
  findIssue,
} from "../../src/commands/issue";
import { newAdr, editAdr, validateAdrs, findAdr } from "../../src/commands/adr";
import { createPlan, findPlan, editPlan } from "../../src/commands/plan";
import { createSpec, findSpec } from "../../src/commands/spec";
import { collectTags } from "../../src/commands/tags";
import { searchAll } from "../../src/commands/search";
import { getReadyIssues, getBlockedIssues } from "../../src/query/dependencies";
import { listIssueFiles } from "../../src/commands/issue";

let storeDir: string;
let config: Awaited<ReturnType<typeof loadConfig>>;

beforeAll(async () => {
  storeDir = join(tmpdir(), `qtk-e2e-${Date.now()}`);
  mkdirSync(storeDir, { recursive: true });
  await initStore({ dir: storeDir, defaults: true });
  config = await loadConfig(storeDir);
});

afterAll(() => {
  rmSync(storeDir, { recursive: true, force: true });
});

test("E2E: init → issue create (5件) → dep 設定 → ready/blocked 一覧", async () => {
  // 5 件作成
  const issues = [];
  for (let i = 1; i <= 5; i++) {
    const { id } = await createIssue(storeDir, config, {
      title: `チケット${i}`,
      description: `説明${i}`,
      tags: i % 2 === 0 ? ["backend"] : ["frontend"],
    });
    issues.push(id);
  }
  expect(issues).toEqual([1, 2, 3, 4, 5]);

  // 依存設定: #2 は #1 に依存、#3 は #1, #2 に依存
  await editIssue(storeDir, config, 2, { dependencies: [1] });
  await editIssue(storeDir, config, 3, { dependencies: [1, 2] });

  const files = await listIssueFiles(storeDir);
  const records = files.map((f) => f.record);

  // ready: 依存なし or 依存先 done
  const ready = getReadyIssues(records);
  const readyIds = ready.map((r) => r.frontmatter.id);
  expect(readyIds).toContain(1);
  expect(readyIds).toContain(4);
  expect(readyIds).toContain(5);
  expect(readyIds).not.toContain(2);
  expect(readyIds).not.toContain(3);

  // blocked: 未完了依存あり
  const blocked = getBlockedIssues(records);
  const blockedIds = blocked.map((r) => r.frontmatter.id);
  expect(blockedIds).toContain(2);
  expect(blockedIds).toContain(3);

  // #1 を done にすると #2 が ready になる
  await editIssue(storeDir, config, 1, { status: "done" });
  const files2 = await listIssueFiles(storeDir);
  const ready2 = getReadyIssues(files2.map((f) => f.record));
  expect(ready2.map((r) => r.frontmatter.id)).toContain(2);
});

test("E2E: 状態遷移 (new → in-progress → paused → done)", async () => {
  const { id } = await createIssue(storeDir, config, { title: "状態遷移テスト" });
  const found1 = await findIssue(storeDir, id);
  expect(found1?.record.frontmatter.status).toBe("new");

  await editIssue(storeDir, config, id, { status: "in-progress" });
  const found2 = await findIssue(storeDir, id);
  expect(found2?.record.frontmatter.status).toBe("in-progress");

  await editIssue(storeDir, config, id, { status: "paused" });
  const found3 = await findIssue(storeDir, id);
  expect(found3?.record.frontmatter.status).toBe("paused");

  await editIssue(storeDir, config, id, { status: "done" });
  const found4 = await findIssue(storeDir, id);
  expect(found4?.record.frontmatter.status).toBe("done");
});

test("E2E: adr new → edit (status/tag/supersedes) → validate", async () => {
  const old = await newAdr(storeDir, config, {
    title: "旧設計",
    tags: ["architecture"],
  });
  const fresh = await newAdr(storeDir, config, {
    title: "新設計",
    supersedes: old.id,
  });

  const oldFound = await findAdr(storeDir, old.id);
  expect(oldFound?.record.frontmatter.status).toBe("superseded");

  await editAdr(storeDir, config, fresh.id, {
    status: "accepted",
    addTags: ["database"],
  });
  const freshFound = await findAdr(storeDir, fresh.id);
  expect(freshFound?.record.frontmatter.status).toBe("accepted");
  expect(freshFound?.record.frontmatter.tags).toContain("database");

  const issues = await validateAdrs(storeDir);
  expect(issues.length).toBe(0);
});

test("E2E: plan create → edit (status/supersedes)", async () => {
  const old = await createPlan(storeDir, config, { title: "旧計画", generatedBy: "agent-a" });
  const fresh = await createPlan(storeDir, config, { title: "新計画", generatedBy: "agent-b" });

  await editPlan(storeDir, config, fresh.id, {
    status: "in-progress",
    supersedes: old.id,
  });

  const oldFound = await findPlan(storeDir, old.id);
  expect(oldFound?.record.frontmatter.plan_status).toBe("superseded");
  expect(oldFound?.record.frontmatter.superseded_by).toBe(fresh.id);

  const freshFound = await findPlan(storeDir, fresh.id);
  expect(freshFound?.record.frontmatter.plan_status).toBe("in-progress");
  expect(freshFound?.record.frontmatter.generated_by).toBe("agent-b");
});

test("E2E: spec create → テンプレート確認", async () => {
  const { id } = await createSpec(storeDir, config, {
    title: "認証機能の仕様",
    specType: "specification",
  });
  const found = await findSpec(storeDir, id);
  expect(found?.record.body).toContain("## Problem Statement");
  expect(found?.record.body).toContain("## Solution");
  expect(found?.record.body).toContain("## User Stories");
});

test("E2E: search → tags 横断検索とタグ収集", async () => {
  const results = await searchAll(storeDir, config, { keyword: "チケット" });
  expect(results.length).toBeGreaterThan(0);

  const tags = await collectTags(storeDir);
  expect(tags.some((t) => t.tag === "backend")).toBe(true);
  expect(tags.some((t) => t.tag === "frontend")).toBe(true);
  expect(tags.some((t) => t.tag === "architecture")).toBe(true);
});

test("E2E: 日本語が正常に動作する", async () => {
  const { id } = await createIssue(storeDir, config, {
    title: "日本語タイトルテスト",
    description: "日本語の説明文",
    tags: ["日本語タグ"],
  });
  const found = await findIssue(storeDir, id);
  expect(found?.record.frontmatter.title).toBe("日本語タイトルテスト");
  expect(found?.record.frontmatter.description).toBe("日本語の説明文");
  expect(found?.record.frontmatter.tags).toEqual(["日本語タグ"]);

  const results = await searchAll(storeDir, config, { keyword: "日本語" });
  expect(results.length).toBeGreaterThan(0);
});
