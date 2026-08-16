// リポジトリ操作 (Markdown ファイル CRUD)

import { existsSync, mkdirSync, readdirSync, renameSync } from "node:fs";
import { join } from "node:path";
import type { RecordType } from "../models/types";
import { type ParsedRecord, parseMarkdown, serializeMarkdown } from "./markdown";

export const TYPE_DIRS: Record<RecordType, string> = {
  issue: "issues",
  adr: "adrs",
  spec: "specs",
  plan: "plans",
};

export function typeDir(type: RecordType): string {
  return TYPE_DIRS[type];
}

export function recordPath(storeDir: string, type: RecordType, id: number, slug: string): string {
  return join(storeDir, typeDir(type), `${String(id).padStart(4, "0")}-${slug}.md`);
}

export function ensureStoreDirs(storeDir: string): void {
  for (const dir of ["issues", "adrs", "specs", "plans", "archive", ".meta"]) {
    mkdirSync(join(storeDir, dir), { recursive: true });
  }
}

export async function readRecord(
  storeDir: string,
  type: RecordType,
  id: number,
  slug: string,
): Promise<ParsedRecord | null> {
  const path = recordPath(storeDir, type, id, slug);
  if (!existsSync(path)) return null;
  const content = await Bun.file(path).text();
  return parseMarkdown(content);
}

export async function writeRecord(
  storeDir: string,
  type: RecordType,
  id: number,
  slug: string,
  record: ParsedRecord,
): Promise<void> {
  const path = recordPath(storeDir, type, id, slug);
  mkdirSync(join(storeDir, typeDir(type)), { recursive: true });
  await Bun.write(path, serializeMarkdown(record));
}

export async function listRecords(storeDir: string, type: RecordType): Promise<ParsedRecord[]> {
  const dir = join(storeDir, typeDir(type));
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  const records: ParsedRecord[] = [];
  for (const f of files) {
    const content = await Bun.file(join(dir, f)).text();
    const parsed = parseMarkdown(content);
    if (parsed.frontmatter.id !== undefined) records.push(parsed);
  }
  return records;
}

export function archiveRecord(
  storeDir: string,
  type: RecordType,
  id: number,
  slug: string,
): boolean {
  const src = recordPath(storeDir, type, id, slug);
  if (!existsSync(src)) return false;
  const dst = join(storeDir, "archive", `${type}-${String(id).padStart(4, "0")}-${slug}.md`);
  mkdirSync(join(storeDir, "archive"), { recursive: true });
  renameSync(src, dst);
  return true;
}
