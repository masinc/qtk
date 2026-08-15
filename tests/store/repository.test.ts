import { test, expect } from "bun:test";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  ensureStoreDirs,
  readRecord,
  writeRecord,
  listRecords,
  archiveRecord,
  recordPath,
} from "../../src/store/repository";
import { parseMarkdown } from "../../src/store/markdown";

const makeStore = (suffix: string) => {
  const dir = join(tmpdir(), `qtk-repo-${Date.now()}-${suffix}`);
  mkdirSync(dir, { recursive: true });
  ensureStoreDirs(dir);
  return dir;
};

test("ensureStoreDirs: サブディレクトリを作成する", () => {
  const dir = makeStore("dirs");
  try {
    for (const d of ["issues", "adrs", "specs", "plans", "archive", ".meta"]) {
      expect(existsSync(join(dir, d))).toBe(true);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("writeRecord / readRecord: 作成・読み取りが動作する", async () => {
  const dir = makeStore("crud");
  try {
    const record = parseMarkdown(`---
id: 1
type: issue
title: "テスト"
---
本文`);
    await writeRecord(dir, "issue", 1, "test", record);
    const read = await readRecord(dir, "issue", 1, "test");
    expect(read?.frontmatter.title).toBe("テスト");
    expect(read?.body).toContain("本文");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("listRecords: 一覧取得が動作する", async () => {
  const dir = makeStore("list");
  try {
    for (let i = 1; i <= 3; i++) {
      const record = parseMarkdown(`---
id: ${i}
type: issue
title: "チケット${i}"
---
本文${i}`);
      await writeRecord(dir, "issue", i, `ticket-${i}`, record);
    }
    const records = await listRecords(dir, "issue");
    expect(records.length).toBe(3);
    expect(records.map((r) => r.frontmatter.id as number).sort()).toEqual([1, 2, 3]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("archiveRecord: アーカイブ移動が動作する", async () => {
  const dir = makeStore("archive");
  try {
    const record = parseMarkdown(`---
id: 1
type: issue
title: "テスト"
---
本文`);
    await writeRecord(dir, "issue", 1, "test", record);
    const result = archiveRecord(dir, "issue", 1, "test");
    expect(result).toBe(true);
    expect(existsSync(recordPath(dir, "issue", 1, "test"))).toBe(false);
    expect(existsSync(join(dir, "archive", "issue-0001-test.md"))).toBe(true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
