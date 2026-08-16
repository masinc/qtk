import { expect, test } from "bun:test";
import { filterRecords } from "../../src/query/filter";
import { parseMarkdown } from "../../src/store/markdown";

const makeRecord = (id: number, overrides: Record<string, unknown> = {}) =>
  parseMarkdown(`---
id: ${id}
type: issue
title: "チケット${id}"
description: "説明${id}"
status: "new"
tags:
  - backend
assignees:
  - alice
${Object.entries(overrides)
  .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
  .join("\n")}
---
本文${id}`);

const records = [
  makeRecord(1, { status: "new", tags: ["backend"], assignees: ["alice"] }),
  makeRecord(2, { status: "in-progress", tags: ["frontend"], assignees: ["bob"] }),
  makeRecord(3, { status: "done", tags: ["backend", "urgent"], assignees: ["alice"] }),
];

test("filterRecords: status でフィルタ", () => {
  const result = filterRecords(records, { status: "done" });
  expect(result.length).toBe(1);
  expect(result[0]?.frontmatter.id).toBe(3);
});

test("filterRecords: tag でフィルタ", () => {
  const result = filterRecords(records, { tag: "backend" });
  expect(result.length).toBe(2);
});

test("filterRecords: assignee でフィルタ", () => {
  const result = filterRecords(records, { assignee: "bob" });
  expect(result.length).toBe(1);
  expect(result[0]?.frontmatter.id).toBe(2);
});

test("filterRecords: キーワードでフィルタ (日本語)", () => {
  const result = filterRecords(records, { keyword: "チケット2" });
  expect(result.length).toBe(1);
  expect(result[0]?.frontmatter.id).toBe(2);
});

test("filterRecords: limit で件数制限", () => {
  const result = filterRecords(records, { limit: 2 });
  expect(result.length).toBe(2);
});
