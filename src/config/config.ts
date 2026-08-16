// 設定管理 (.qtk/config.yaml の読み書き)

import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { YAML } from "bun";
import type { Config } from "../models/types";

export const DEFAULT_CONFIG: Config = {
  version: "1.0",
  idDigits: 4,
  defaultStatus: "new",
  statuses: ["new", "in-progress", "paused", "done"],
  adrStatuses: ["proposed", "accepted", "deprecated", "superseded"],
  planStatuses: ["drafting", "ready", "in-progress", "completed", "superseded", "abandoned"],
  claimLeaseMinutes: 30,
};

export function configPath(storeDir: string): string {
  return join(storeDir, "config.yaml");
}

export function findStoreDir(startDir: string = process.cwd()): string | null {
  let dir = startDir;
  for (;;) {
    if (existsSync(join(dir, ".qtk", "config.yaml"))) return join(dir, ".qtk");
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export async function loadConfig(storeDir: string): Promise<Config> {
  const path = configPath(storeDir);
  if (!existsSync(path)) return { ...DEFAULT_CONFIG };
  try {
    const raw = await Bun.file(path).text();
    const parsed = YAML.parse(raw) as Partial<Config>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (err) {
    throw new Error(
      `config.yaml のパースに失敗しました: ${path}\n${(err as Error).message}\n修正するか、ファイルを削除してデフォルト設定で再起動してください。`,
    );
  }
}

export async function writeConfig(storeDir: string, config: Config): Promise<void> {
  mkdirSync(storeDir, { recursive: true });
  const yaml = YAML.stringify(config, null, 2);
  await Bun.write(configPath(storeDir), yaml ?? "");
}
