import { test, expect } from "bun:test";
import { buildGraph, filterGraphByPlan } from "../../src/query/graph";
import { detectCycles } from "../../src/query/dependencies";
import { parseMarkdown } from "../../src/store/markdown";

const makeRecord = (id: number, deps: number[] = []) =>
  parseMarkdown(`---
id: ${id}
type: issue
title: "チケット${id}"
status: "new"
dependencies: ${JSON.stringify(deps)}
---
本文${id}`);

test("buildGraph: ノードとエッジを構築する", () => {
  const records = [makeRecord(1, [2]), makeRecord(2), makeRecord(3, [1])];
  const graph = buildGraph(records);
  expect(graph.nodes.length).toBe(3);
  expect(graph.edges).toContainEqual({ from: 1, to: 2 });
  expect(graph.edges).toContainEqual({ from: 3, to: 1 });
});

test("buildGraph: 存在しない依存はエッジに含めない", () => {
  const records = [makeRecord(1, [999])];
  const graph = buildGraph(records);
  expect(graph.edges.length).toBe(0);
});

test("filterGraphByPlan: plan 関連 ID でフィルタする", () => {
  const records = [makeRecord(1, [2]), makeRecord(2), makeRecord(3)];
  const graph = buildGraph(records);
  const filtered = filterGraphByPlan(graph, [1, 2]);
  expect(filtered.nodes.map((n) => n.id).sort()).toEqual([1, 2]);
  expect(filtered.edges).toContainEqual({ from: 1, to: 2 });
});

test("detectCycles: cycle なし", () => {
  const records = [makeRecord(1, [2]), makeRecord(2, [3]), makeRecord(3)];
  expect(detectCycles(records)).toEqual([]);
});

test("detectCycles: 単一 cycle を検出する", () => {
  const records = [makeRecord(1, [2]), makeRecord(2, [1])];
  const cycles = detectCycles(records);
  expect(cycles.length).toBe(1);
  expect(cycles[0]!.sort()).toEqual([1, 2]);
});

test("detectCycles: 複数 cycle を検出する", () => {
  const records = [
    makeRecord(1, [2]),
    makeRecord(2, [1]),
    makeRecord(3, [4]),
    makeRecord(4, [3]),
  ];
  const cycles = detectCycles(records);
  expect(cycles.length).toBe(2);
});

test("detectCycles: 自己ループを検出する", () => {
  const records = [makeRecord(1, [1])];
  const cycles = detectCycles(records);
  expect(cycles.length).toBe(1);
  expect(cycles[0]).toEqual([1]);
});
