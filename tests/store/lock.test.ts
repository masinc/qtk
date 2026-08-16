import { expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isLocked, withFileLock } from "../../src/store/lock";

const lockFile = (suffix: string) => {
  const dir = join(tmpdir(), `qtk-lock-${Date.now()}-${suffix}`);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "counter.json");
  writeFileSync(file, "{}");
  return { dir, file };
};

test("withFileLock: ロック取得・解放が動作する", async () => {
  const { dir, file } = lockFile("basic");
  try {
    const result = await withFileLock(file, async () => "done");
    expect(result).toBe("done");
    expect(await isLocked(file)).toBe(false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("withFileLock: ロック中は再取得できない", async () => {
  const { dir, file } = lockFile("contend");
  try {
    const release = await withFileLock(file, async () => {
      expect(await isLocked(file)).toBe(true);
      return "locked";
    });
    expect(release).toBe("locked");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test(
  "withFileLock: 並列実行で ID が重複しない",
  async () => {
    const { dir, file } = lockFile("parallel");
    try {
      const counterPath = join(dir, "counter.json");
      const readCounter = async () => {
        try {
          const raw = await Bun.file(counterPath).text();
          const parsed = JSON.parse(raw) as { maxId?: number };
          return { maxId: parsed.maxId ?? 0 };
        } catch {
          return { maxId: 0 };
        }
      };
      const writeCounter = async (c: { maxId: number }) =>
        await Bun.write(counterPath, JSON.stringify(c));

      const nextId = async () =>
        withFileLock(file, async () => {
          const counter = await readCounter();
          const next = counter.maxId + 1;
          await writeCounter({ maxId: next });
          return next;
        });

      const ids = await Promise.all(Array.from({ length: 10 }, () => nextId()));
      expect(new Set(ids).size).toBe(10);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
  { timeout: 30000 },
);
