import { expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  configPath,
  DEFAULT_CONFIG,
  findStoreDir,
  loadConfig,
  writeConfig,
} from "../../src/config/config";

const makeStore = (suffix: string) => {
  const dir = join(tmpdir(), `qtk-config-${Date.now()}-${suffix}`);
  mkdirSync(dir, { recursive: true });
  return dir;
};

test("loadConfig: デフォルト値が返る", async () => {
  const dir = makeStore("default");
  try {
    const config = await loadConfig(dir);
    expect(config.idDigits).toBe(4);
    expect(config.defaultStatus).toBe("new");
    expect(config.statuses).toEqual(["new", "in-progress", "paused", "done"]);
    expect(config.adrStatuses).toEqual(["proposed", "accepted", "deprecated", "superseded"]);
    expect(config.planStatuses).toContain("drafting");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("writeConfig / loadConfig: 往復で設定が保持される", async () => {
  const dir = makeStore("roundtrip");
  try {
    const custom = { ...DEFAULT_CONFIG, idDigits: 6, defaultStatus: "in-progress" };
    await writeConfig(dir, custom);
    const loaded = await loadConfig(dir);
    expect(loaded.idDigits).toBe(6);
    expect(loaded.defaultStatus).toBe("in-progress");
    expect(existsSync(configPath(dir))).toBe(true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("findStoreDir: 親ディレクトリを探索する", async () => {
  const root = makeStore("find");
  try {
    const qtkDir = join(root, ".qtk");
    mkdirSync(qtkDir, { recursive: true });
    await writeConfig(qtkDir, DEFAULT_CONFIG);
    const nested = join(root, "a", "b", "c");
    mkdirSync(nested, { recursive: true });
    expect(findStoreDir(nested)).toBe(qtkDir);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("findStoreDir: 見つからない場合は null", () => {
  const dir = makeStore("none");
  try {
    expect(findStoreDir(dir)).toBeNull();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
