// T02 スパイク検証: proper-lockfile の bun + Windows 動作テスト
import { test, expect } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const lockFile = (suffix: string) => {
  const dir = join(tmpdir(), `qtk-spike-lock-${Date.now()}-${suffix}`);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "counter.json");
  writeFileSync(file, "{}");
  return { dir, file };
};

test("proper-lockfile: ロック取得・解放が bun で動作する", async () => {
  const { dir, file } = lockFile("basic");
  try {
    const lockfile = await import("proper-lockfile");
    const release = await lockfile.lock(file, { retries: 3 });
    expect(release).toBeFunction();
    await release();
    rmSync(dir, { recursive: true, force: true });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("proper-lockfile: ロック中は再取得できない", async () => {
  const { dir, file } = lockFile("contend");
  try {
    const lockfile = await import("proper-lockfile");
    const release = await lockfile.lock(file);
    try {
      const lockfile2 = await import("proper-lockfile");
      await expect(lockfile2.lock(file, { retries: 0 })).rejects.toThrow();
    } finally {
      await release();
    }
    const release2 = await lockfile.lock(file);
    await release2();
    rmSync(dir, { recursive: true, force: true });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("proper-lockfile: 並列採番で ID が重複しない (bun + Windows で動作確認)", async () => {
  const { dir, file } = lockFile("parallel");
  try {
    const lockfile = await import("proper-lockfile");
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

    const nextId = async () => {
      const release = await lockfile.lock(file, {
        retries: {
          retries: 10,
          minTimeout: 50,
          maxTimeout: 200,
          retryableError: (err: unknown) =>
            (err as { code?: string })?.code === "ELOCKED",
        } as never,
        stale: 5000,
        update: 2000,
      });
      try {
        const counter = await readCounter();
        const next = counter.maxId + 1;
        await writeCounter({ maxId: next });
        return next;
      } finally {
        await release();
      }
    };

    const ids = await Promise.all(Array.from({ length: 10 }, () => nextId()));
    expect(new Set(ids).size).toBe(10);
    rmSync(dir, { recursive: true, force: true });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}, { timeout: 30000 });
