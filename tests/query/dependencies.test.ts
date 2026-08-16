import { expect, test } from "bun:test";
import { getBlockedIssues, getDependencies, getReadyIssues } from "../../src/query/dependencies";
import { parseMarkdown } from "../../src/store/markdown";

const makeRecord = (id: number, deps: number[] = [], status = "new") =>
  parseMarkdown(`---
id: ${id}
type: issue
title: "チケット${id}"
status: "${status}"
dependencies: ${JSON.stringify(deps)}
---
本文${id}`);

test("getDependencies: 依存配列を取得する", () => {
  const r = makeRecord(1, [2, 3]);
  expect(getDependencies(r)).toEqual([2, 3]);
});

test("getReadyIssues: 依存なしは ready", () => {
  const records = [makeRecord(1), makeRecord(2)];
  const ready = getReadyIssues(records);
  expect(ready.length).toBe(2);
});

test("getReadyIssues: 依存先が done なら ready", () => {
  const records = [makeRecord(1, [2]), makeRecord(2, [], "done")];
  const ready = getReadyIssues(records);
  expect(ready.map((r) => r.frontmatter.id)).toContain(1);
});

test("getReadyIssues: 依存先が未完了なら not ready", () => {
  const records = [makeRecord(1, [2]), makeRecord(2, [], "new")];
  const ready = getReadyIssues(records);
  expect(ready.map((r) => r.frontmatter.id)).not.toContain(1);
});

test("getBlockedIssues: 未完了依存があると blocked", () => {
  const records = [makeRecord(1, [2]), makeRecord(2, [], "new")];
  const blocked = getBlockedIssues(records);
  expect(blocked.map((r) => r.frontmatter.id)).toContain(1);
});

test("getBlockedIssues: 依存先が done なら not blocked", () => {
  const records = [makeRecord(1, [2]), makeRecord(2, [], "done")];
  const blocked = getBlockedIssues(records);
  expect(blocked.map((r) => r.frontmatter.id)).not.toContain(1);
});
