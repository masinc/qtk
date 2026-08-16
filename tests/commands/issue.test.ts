import { expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  archiveIssue,
  createIssue,
  editIssue,
  findIssue,
  listIssueFiles,
} from "../../src/commands/issue";
import { DEFAULT_CONFIG } from "../../src/config/config";
import { ensureStoreDirs } from "../../src/store/repository";

const makeStore = (suffix: string) => {
  const dir = join(tmpdir(), `qtk-issue-${Date.now()}-${suffix}`);
  mkdirSync(dir, { recursive: true });
  ensureStoreDirs(dir);
  return dir;
};

test("createIssue: チケットを作成し ID を採番する", async () => {
  const dir = makeStore("create");
  try {
    const { id } = await createIssue(dir, DEFAULT_CONFIG, {
      title: "認証機能を追加",
      description: "ユーザー認証を実装",
      acceptanceCriteria: ["ログイン画面がある"],
      tags: ["backend"],
    });
    expect(id).toBe(1);

    const found = await findIssue(dir, id);
    expect(found?.record.frontmatter.title).toBe("認証機能を追加");
    expect(found?.record.frontmatter.status).toBe("new");
    expect(found?.record.frontmatter.tags).toEqual(["backend"]);
    expect(found?.record.body).toContain("## 説明");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("createIssue: 連番で採番される", async () => {
  const dir = makeStore("seq");
  try {
    const a = await createIssue(dir, DEFAULT_CONFIG, { title: "A" });
    const b = await createIssue(dir, DEFAULT_CONFIG, { title: "B" });
    expect(a.id).toBe(1);
    expect(b.id).toBe(2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("editIssue: ステータス・タグ・コメントを更新できる", async () => {
  const dir = makeStore("edit");
  try {
    const { id } = await createIssue(dir, DEFAULT_CONFIG, { title: "テスト", tags: ["a"] });
    await editIssue(dir, DEFAULT_CONFIG, id, {
      status: "in-progress",
      addTags: ["b"],
      comment: "進捗コメント",
      commentAuthor: "@alice",
    });

    const found = await findIssue(dir, id);
    expect(found?.record.frontmatter.status).toBe("in-progress");
    expect(found?.record.frontmatter.tags).toEqual(["a", "b"]);
    const comments = found?.record.frontmatter.comments as { author: string; body: string }[];
    expect(comments[0]?.author).toBe("@alice");
    expect(comments[0]?.body).toBe("進捗コメント");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("editIssue: カスタム frontmatter が消失しない", async () => {
  const dir = makeStore("preserve");
  try {
    const { id } = await createIssue(dir, DEFAULT_CONFIG, { title: "テスト" });
    const found1 = await findIssue(dir, id);
    const customContent = `---
id: ${id}
type: issue
title: "テスト"
description: ""
status: "new"
tags: []
assignees: []
created_at: "2026-08-13T23:33:00Z"
updated_at: "2026-08-13T23:33:00Z"
dependencies: []
acceptance_criteria: []
definition_of_done: []
plan: ""
comments: []
final_summary: ""
custom_field: "keep-me"
---

本文`;
    await Bun.write(join(dir, "issues", `0001-${found1?.slug}.md`), customContent);

    await editIssue(dir, DEFAULT_CONFIG, id, { status: "done" });
    const found2 = await findIssue(dir, id);
    expect(found2?.record.frontmatter.custom_field).toBe("keep-me");
    expect(found2?.record.frontmatter.status).toBe("done");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("archiveIssue: アーカイブに移動する", async () => {
  const dir = makeStore("archive");
  try {
    const { id } = await createIssue(dir, DEFAULT_CONFIG, { title: "テスト" });
    await archiveIssue(dir, DEFAULT_CONFIG, id);
    expect(await findIssue(dir, id)).toBeNull();
    expect(existsSync(join(dir, "archive"))).toBe(true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("listIssueFiles: 一覧を取得する", async () => {
  const dir = makeStore("list");
  try {
    await createIssue(dir, DEFAULT_CONFIG, { title: "A" });
    await createIssue(dir, DEFAULT_CONFIG, { title: "B" });
    const files = await listIssueFiles(dir);
    expect(files.length).toBe(2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
