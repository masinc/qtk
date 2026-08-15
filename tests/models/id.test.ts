import { test, expect } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { nextId, formatId, parseId, readCounter } from "../../src/models/id";
import type { Config } from "../../src/models/types";

const makeStore = (suffix: string) => {
  const dir = join(tmpdir(), `qtk-id-${Date.now()}-${suffix}`);
  mkdirSync(dir, { recursive: true });
  mkdirSync(join(dir, ".meta"), { recursive: true });
  return dir;
};

const config: Config = {
  version: "1.0",
  idDigits: 4,
  defaultStatus: "new",
  statuses: ["new", "in-progress", "paused", "done"],
  adrStatuses: ["proposed", "accepted", "deprecated", "superseded"],
  planStatuses: ["drafting", "ready", "in-progress", "completed", "superseded", "abandoned"],
  claimLeaseMinutes: 30,
};

test("nextId: 連番で採番される", async () => {
  const dir = makeStore("seq");
  try {
    expect(await nextId(dir, config)).toBe(1);
    expect(await nextId(dir, config)).toBe(2);
    expect(await nextId(dir, config)).toBe(3);
    const counter = await readCounter(dir);
    expect(counter.maxId).toBe(3);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("nextId: 並列呼び出しで ID が重複しない", async () => {
  const dir = makeStore("parallel");
  try {
    const ids = await Promise.all(Array.from({ length: 20 }, () => nextId(dir, config)));
    expect(new Set(ids).size).toBe(20);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}, { timeout: 30000 });

test("formatId: 桁数設定でゼロ埋めされる", () => {
  expect(formatId(1, config)).toBe("#0001");
  expect(formatId(42, config)).toBe("#0042");
  expect(formatId(12345, config)).toBe("#12345");
});

test("parseId: # 付き・なし両方パースできる", () => {
  expect(parseId("#0001")).toBe(1);
  expect(parseId("0001")).toBe(1);
  expect(parseId("42")).toBe(42);
  expect(parseId("abc")).toBeNull();
  expect(parseId("")).toBeNull();
});
