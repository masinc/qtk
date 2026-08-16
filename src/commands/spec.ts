// qtk spec コマンド群

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { formatId, nextId, parseId } from "../models/id";
import { slugify, uniqueSlug } from "../models/slug";
import type { Config } from "../models/types";
import { outputJson } from "../output/json";
import { renderTable } from "../output/table";
import { type ParsedRecord, parseMarkdown, updateFrontmatter } from "../store/markdown";
import { recordPath, writeRecord } from "../store/repository";
import { nowIso } from "./context";

export interface SpecFile {
  record: ParsedRecord;
  slug: string;
}

export async function listSpecFiles(storeDir: string): Promise<SpecFile[]> {
  const dir = join(storeDir, "specs");
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  const result: SpecFile[] = [];
  for (const f of files) {
    const content = await Bun.file(join(dir, f)).text();
    const record = parseMarkdown(content);
    if (record.frontmatter.id !== undefined) {
      result.push({ record, slug: f.replace(/^\d{4}-/, "").replace(/\.md$/, "") });
    }
  }
  return result;
}

export async function findSpec(storeDir: string, id: number): Promise<SpecFile | null> {
  const files = await listSpecFiles(storeDir);
  return files.find((f) => f.record.frontmatter.id === id) ?? null;
}

export interface CreateSpecOptions {
  title: string;
  specType?: string;
  description?: string;
  parentIssue?: number | null;
}

export async function createSpec(
  storeDir: string,
  config: Config,
  options: CreateSpecOptions,
): Promise<{ id: number; path: string }> {
  const id = await nextId(storeDir, config);
  const existing = new Set(readdirSync(join(storeDir, "specs")).filter((f) => f.endsWith(".md")));
  const slug = uniqueSlug(slugify(options.title), existing);

  const frontmatter: Record<string, unknown> = {
    id,
    type: "spec",
    title: options.title,
    description: options.description ?? "",
    status: "new",
    tags: [],
    assignees: [],
    created_at: nowIso(),
    updated_at: nowIso(),
    spec_type: options.specType ?? "specification",
    parent_issue: options.parentIssue ?? null,
  };

  const body = `## Problem Statement (問題の記述)

（解決すべき問題を明確に記述する）

## Solution (解決策)

（採用する解決策を記述する）

## User Stories (ユーザーストーリー)

- ユーザーとして、〜したい。

## Implementation Decisions (実装の決定)

（実装上の重要な決定事項）

## Testing Decisions (テストの決定)

（テスト方針・戦略）

## Out of Scope (対象外)

（この仕様の対象外）

## Further Notes (その他のメモ)

（補足情報）
`;

  await writeRecord(storeDir, "spec", id, slug, { frontmatter, body });
  return { id, path: recordPath(storeDir, "spec", id, slug) };
}

export interface ListSpecOptions {
  specType?: string;
  json?: boolean;
}

export async function listSpecs(
  storeDir: string,
  config: Config,
  options: ListSpecOptions,
): Promise<void> {
  const files = await listSpecFiles(storeDir);
  let records = files.map((f) => f.record);

  if (options.specType) {
    records = records.filter((r) => r.frontmatter.spec_type === options.specType);
  }

  if (options.json) {
    outputJson(records.map((r) => r.frontmatter));
    return;
  }

  const rows = records.map((r) => [
    formatId(r.frontmatter.id as number, config),
    String(r.frontmatter.title ?? ""),
    String(r.frontmatter.spec_type ?? ""),
  ]);
  console.log(renderTable(["ID", "タイトル", "種別"], rows));
}

export interface ShowSpecOptions {
  json?: boolean;
}

export async function showSpec(
  storeDir: string,
  config: Config,
  id: number,
  options: ShowSpecOptions = {},
): Promise<void> {
  const found = await findSpec(storeDir, id);
  if (!found)
    throw new Error(`spec #${String(id).padStart(config.idDigits, "0")} が見つかりません`);

  const record = found.record;
  if (options.json) {
    outputJson({ ...record.frontmatter, body: record.body });
    return;
  }

  const fm = record.frontmatter;
  console.log(`#${String(id).padStart(config.idDigits, "0")} ${fm.title}`);
  console.log(`種別: ${fm.spec_type}`);
  console.log("");
  console.log(record.body);
}

export interface UpdateSpecOptions {
  content?: string;
  plain?: boolean;
}

export async function updateSpec(
  storeDir: string,
  config: Config,
  id: number,
  options: UpdateSpecOptions,
): Promise<void> {
  const found = await findSpec(storeDir, id);
  if (!found)
    throw new Error(`spec #${String(id).padStart(config.idDigits, "0")} が見つかりません`);

  const updates: Record<string, unknown> = { updated_at: nowIso() };
  const updated = updateFrontmatter(found.record, updates);
  const body = options.content ?? found.record.body;
  await writeRecord(storeDir, "spec", id, found.slug, { ...updated, body });
}

export function parseSpecId(input: string): number | null {
  return parseId(input);
}
