import { expect, test } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { newAdr } from "../../src/commands/adr";
import { createIssue } from "../../src/commands/issue";
import { archivePlan, createPlan, editPlan, findPlan } from "../../src/commands/plan";
import { searchAll } from "../../src/commands/search";
import { createSpec, findSpec, updateSpec } from "../../src/commands/spec";
import { collectTags } from "../../src/commands/tags";
import { DEFAULT_CONFIG } from "../../src/config/config";
import { ensureStoreDirs } from "../../src/store/repository";

const makeStore = (suffix: string) => {
  const dir = join(tmpdir(), `qtk-misc-${Date.now()}-${suffix}`);
  mkdirSync(dir, { recursive: true });
  ensureStoreDirs(dir);
  return dir;
};

test("createSpec: 仕様を作成しテンプレートを生成する", async () => {
  const dir = makeStore("spec");
  try {
    const { id } = await createSpec(dir, DEFAULT_CONFIG, {
      title: "認証機能の仕様",
      specType: "specification",
    });
    const found = await findSpec(dir, id);
    expect(found?.record.frontmatter.spec_type).toBe("specification");
    expect(found?.record.body).toContain("## Problem Statement");
    expect(found?.record.body).toContain("## Solution");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("updateSpec: 本文を更新できる", async () => {
  const dir = makeStore("spec-update");
  try {
    const { id } = await createSpec(dir, DEFAULT_CONFIG, { title: "テスト" });
    await updateSpec(dir, DEFAULT_CONFIG, id, { content: "新しい本文" });
    const found = await findSpec(dir, id);
    expect(found?.record.body.trim()).toBe("新しい本文");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("createPlan: 計画を作成しテンプレートを生成する", async () => {
  const dir = makeStore("plan");
  try {
    const { id } = await createPlan(dir, DEFAULT_CONFIG, {
      title: "qtk ツール構築",
      generatedBy: "claude",
      relatedIssues: [1],
    });
    const found = await findPlan(dir, id);
    expect(found?.record.frontmatter.plan_status).toBe("drafting");
    expect(found?.record.frontmatter.generated_by).toBe("claude");
    expect(found?.record.frontmatter.related_issues).toEqual([1]);
    expect(found?.record.body).toContain("## Context");
    expect(found?.record.body).toContain("## Goals");
    expect(found?.record.body).toContain("## Design");
    expect(found?.record.body).toContain("## Tasks");
    expect(found?.record.body).toContain("## Risks");
    expect(found?.record.body).toContain("## References");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("editPlan: ステータスと supersedes を更新できる", async () => {
  const dir = makeStore("plan-edit");
  try {
    const old = await createPlan(dir, DEFAULT_CONFIG, { title: "旧計画" });
    const fresh = await createPlan(dir, DEFAULT_CONFIG, { title: "新計画" });
    await editPlan(dir, DEFAULT_CONFIG, fresh.id, { status: "in-progress", supersedes: old.id });

    const oldFound = await findPlan(dir, old.id);
    expect(oldFound?.record.frontmatter.plan_status).toBe("superseded");
    expect(oldFound?.record.frontmatter.superseded_by).toBe(fresh.id);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("archivePlan: アーカイブに移動する", async () => {
  const dir = makeStore("plan-archive");
  try {
    const { id } = await createPlan(dir, DEFAULT_CONFIG, { title: "テスト" });
    await archivePlan(dir, DEFAULT_CONFIG, id);
    expect(await findPlan(dir, id)).toBeNull();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("collectTags: 全種別からタグを収集する", async () => {
  const dir = makeStore("tags");
  try {
    await createIssue(dir, DEFAULT_CONFIG, { title: "A", tags: ["backend"] });
    await newAdr(dir, DEFAULT_CONFIG, { title: "B", tags: ["architecture"] });
    await createSpec(dir, DEFAULT_CONFIG, { title: "C" });
    await createPlan(dir, DEFAULT_CONFIG, { title: "D" });

    const tags = await collectTags(dir);
    expect(tags.some((t) => t.tag === "backend")).toBe(true);
    expect(tags.some((t) => t.tag === "architecture")).toBe(true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("searchAll: 横断検索が動作する", async () => {
  const dir = makeStore("search");
  try {
    await createIssue(dir, DEFAULT_CONFIG, { title: "認証機能を追加" });
    await newAdr(dir, DEFAULT_CONFIG, { title: "データベース選定" });
    await createPlan(dir, DEFAULT_CONFIG, { title: "認証機能の設計" });

    const results = await searchAll(dir, DEFAULT_CONFIG, { keyword: "認証" });
    expect(results.length).toBe(2);
    expect(results.some((r) => r.type === "issue")).toBe(true);
    expect(results.some((r) => r.type === "plan")).toBe(true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
