// T02 スパイク検証: Bun.YAML の frontmatter 往復テスト

import { expect, test } from "bun:test";
import { YAML } from "bun";

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

test("Bun.YAML: parse -> update -> serialize -> re-parse で未知フィールドが保持される", () => {
  const parts = sample.split("\n---\n");
  const head = parts[0];
  if (head === undefined) throw new Error("sample の frontmatter が取得できない");
  const fm = YAML.parse(head) as Record<string, unknown>;
  expect(fm.custom_priority).toBe("high");

  const updated = { ...fm, title: "認証機能を追加 (更新)" };
  const serialized = YAML.stringify(updated, null, 2);
  const reparsed = YAML.parse(serialized) as Record<string, unknown>;

  expect(reparsed.custom_priority).toBe("high");
  expect(reparsed.title).toBe("認証機能を追加 (更新)");
  expect(reparsed.tags).toEqual(["backend", "auth"]);
});

test("Bun.YAML: 日本語タイトルが保持される", () => {
  const fm = YAML.parse(`title: "ユーザー管理機能を追加する"`) as Record<string, unknown>;
  const serialized = YAML.stringify(fm, null, 2);
  const reparsed = YAML.parse(serialized) as Record<string, unknown>;
  expect(reparsed.title).toBe("ユーザー管理機能を追加する");
});

test("Bun.YAML: 空 frontmatter / frontmatter なし", () => {
  const empty = YAML.parse("{}");
  expect(empty).toEqual({});
  const serialized = YAML.stringify(empty, null, 2);
  expect(serialized.trim()).toBe("{}");
});
