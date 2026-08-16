import { expect, test } from "bun:test";
import { parseMarkdown, serializeMarkdown, updateFrontmatter } from "../../src/store/markdown";

const sample = `---
id: 1
type: issue
title: "認証機能を追加"
custom_priority: "high"
tags:
  - backend
  - auth
created_at: "2026-08-13T23:33:00Z"
---

## 説明

ユーザー認証機能を実装する。`;

test("parseMarkdown: frontmatter と body を分離する", () => {
  const parsed = parseMarkdown(sample);
  expect(parsed.frontmatter.id).toBe(1);
  expect(parsed.frontmatter.title).toBe("認証機能を追加");
  expect(parsed.frontmatter.tags).toEqual(["backend", "auth"]);
  expect(parsed.body).toContain("## 説明");
});

test("parseMarkdown: frontmatter なしは body 全体を返す", () => {
  const parsed = parseMarkdown("# タイトル\n\n本文");
  expect(parsed.frontmatter).toEqual({});
  expect(parsed.body).toBe("# タイトル\n\n本文");
});

test("parseMarkdown: 空 frontmatter を処理する", () => {
  const parsed = parseMarkdown("---\n---\n\n本文のみ");
  expect(parsed.frontmatter).toEqual({});
  expect(parsed.body).toContain("本文のみ");
});

test("serializeMarkdown: 往復で未知フィールドが保持される", () => {
  const parsed = parseMarkdown(sample);
  const updated = updateFrontmatter(parsed, { title: "認証機能を追加 (更新)" });
  const serialized = serializeMarkdown(updated);
  const reparsed = parseMarkdown(serialized);

  expect(reparsed.frontmatter.custom_priority).toBe("high");
  expect(reparsed.frontmatter.title).toBe("認証機能を追加 (更新)");
  expect(reparsed.frontmatter.tags).toEqual(["backend", "auth"]);
  expect(reparsed.body).toContain("## 説明");
});

test("serializeMarkdown: 日本語タイトルが保持される", () => {
  const parsed = parseMarkdown(`---
title: "ユーザー管理機能を追加する"
---
本文`);
  const serialized = serializeMarkdown(parsed);
  const reparsed = parseMarkdown(serialized);
  expect(reparsed.frontmatter.title).toBe("ユーザー管理機能を追加する");
});

test("updateFrontmatter: 既知フィールド更新 + 未知フィールド保持", () => {
  const parsed = parseMarkdown(sample);
  const updated = updateFrontmatter(parsed, { status: "in-progress" });
  expect(updated.frontmatter.status).toBe("in-progress");
  expect(updated.frontmatter.custom_priority).toBe("high");
  expect(updated.frontmatter.id).toBe(1);
});
