// コマンド共通ヘルパー
import { findStoreDir, loadConfig } from "../config/config";
import type { Config } from "../models/types";

export interface CommandContext {
  storeDir: string;
  config: Config;
}

export async function resolveContext(dir?: string): Promise<CommandContext> {
  const storeDir = dir ?? findStoreDir() ?? "./qtk";
  const config = await loadConfig(storeDir);
  return { storeDir, config };
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
