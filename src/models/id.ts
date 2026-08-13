// ID 採番 (共通採番・ファイルロック付き原子性)
import { join } from "node:path";
import { withFileLock } from "../store/lock";
import type { Config } from "./types";

export interface Counter {
  maxId: number;
}

export async function readCounter(storeDir: string): Promise<Counter> {
  const path = join(storeDir, ".qtk", "counter.json");
  try {
    const raw = await Bun.file(path).text();
    const parsed = JSON.parse(raw) as { maxId?: number };
    return { maxId: parsed.maxId ?? 0 };
  } catch {
    return { maxId: 0 };
  }
}

export async function writeCounter(storeDir: string, counter: Counter): Promise<void> {
  const path = join(storeDir, ".qtk", "counter.json");
  await Bun.write(path, JSON.stringify(counter));
}

export async function nextId(storeDir: string, config: Config): Promise<number> {
  const lockPath = join(storeDir, ".qtk", "counter.lock");
  return withFileLock(lockPath, async () => {
    const counter = await readCounter(storeDir);
    const next = counter.maxId + 1;
    await writeCounter(storeDir, { maxId: next });
    return next;
  });
}

export function formatId(id: number, config: Config): string {
  return `#${String(id).padStart(config.idDigits, "0")}`;
}

export function parseId(input: string): number | null {
  const match = input.match(/^#?(\d+)$/);
  if (!match) return null;
  return parseInt(match[1]!, 10);
}
