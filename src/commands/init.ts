// qtk init コマンド

import { existsSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_CONFIG, writeConfig } from "../config/config";
import { ensureStoreDirs } from "../store/repository";

export interface InitOptions {
  dir?: string;
  defaults?: boolean;
}

export async function initStore(options: InitOptions = {}): Promise<string> {
  const storeDir = options.dir ?? join(process.cwd(), ".qtk");

  if (existsSync(join(storeDir, "config.yaml"))) {
    throw new Error(`既に初期化されています: ${storeDir}`);
  }

  ensureStoreDirs(storeDir);
  await writeConfig(storeDir, DEFAULT_CONFIG);

  const gitignorePath = join(storeDir, ".gitignore");
  if (!existsSync(gitignorePath)) {
    await Bun.write(gitignorePath, "*.lock\n");
  }

  return storeDir;
}
