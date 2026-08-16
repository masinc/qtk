// qtk adr コマンド群

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { formatId, nextId, parseId } from "../models/id";
import { slugify, uniqueSlug } from "../models/slug";
import type { Config } from "../models/types";
import { outputJson } from "../output/json";
import { renderTable } from "../output/table";
import { filterRecords } from "../query/filter";
import { type ParsedRecord, parseMarkdown, updateFrontmatter } from "../store/markdown";
import { recordPath, writeRecord } from "../store/repository";
import { nowIso } from "./context";

export interface AdrFile {
  record: ParsedRecord;
  slug: string;
}

export async function listAdrFiles(storeDir: string): Promise<AdrFile[]> {
  const dir = join(storeDir, "adrs");
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  const result: AdrFile[] = [];
  for (const f of files) {
    const content = await Bun.file(join(dir, f)).text();
    const record = parseMarkdown(content);
    if (record.frontmatter.id !== undefined) {
      result.push({ record, slug: f.replace(/^\d{4}-/, "").replace(/\.md$/, "") });
    }
  }
  return result;
}

export async function findAdr(storeDir: string, id: number): Promise<AdrFile | null> {
  const files = await listAdrFiles(storeDir);
  return files.find((f) => f.record.frontmatter.id === id) ?? null;
}

export interface NewAdrOptions {
  title: string;
  description?: string;
  tags?: string[];
  status?: string;
  supersedes?: number | null;
  deciders?: string[];
}

export async function newAdr(
  storeDir: string,
  config: Config,
  options: NewAdrOptions,
): Promise<{ id: number; path: string }> {
  const id = await nextId(storeDir, config);
  const existing = new Set(readdirSync(join(storeDir, "adrs")).filter((f) => f.endsWith(".md")));
  const slug = uniqueSlug(slugify(options.title), existing);

  const frontmatter: Record<string, unknown> = {
    id,
    type: "adr",
    title: options.title,
    description: options.description ?? "",
    status: options.status ?? "proposed",
    tags: options.tags ?? [],
    assignees: [],
    created_at: nowIso(),
    updated_at: nowIso(),
    deciders: options.deciders ?? [],
    supersedes: options.supersedes ?? null,
    superseded_by: null,
  };

  const body = `## Context

（この決定が必要な背景・技術的制約・ビジネス要件）

## Decision

（採用するアーキテクチャ上の決定とその理由）

## Consequences

（この決定によって生じる影響。ポジティブ・ネガティブ・リスクの両面）
`;

  await writeRecord(storeDir, "adr", id, slug, { frontmatter, body });

  // supersedes 指定時は旧 ADR を自動更新
  if (options.supersedes !== undefined && options.supersedes !== null) {
    const old = await findAdr(storeDir, options.supersedes);
    if (old) {
      const updated = updateFrontmatter(old.record, {
        superseded_by: id,
        status: "superseded",
        updated_at: nowIso(),
      });
      await writeRecord(storeDir, "adr", options.supersedes, old.slug, updated);
    }
  }

  return { id, path: recordPath(storeDir, "adr", id, slug) };
}

export interface ListAdrOptions {
  tag?: string;
  status?: string;
  json?: boolean;
}

export async function listAdrs(
  storeDir: string,
  config: Config,
  options: ListAdrOptions,
): Promise<void> {
  const files = await listAdrFiles(storeDir);
  let records = files.map((f) => f.record);

  records = filterRecords(records, {
    status: options.status,
    tag: options.tag,
  });

  if (options.json) {
    outputJson(records.map((r) => r.frontmatter));
    return;
  }

  const rows = records.map((r) => [
    formatId(r.frontmatter.id as number, config),
    String(r.frontmatter.title ?? ""),
    String(r.frontmatter.status ?? ""),
    (r.frontmatter.tags as string[] | undefined)?.join(",") ?? "",
  ]);
  console.log(renderTable(["ID", "タイトル", "ステータス", "タグ"], rows));
}

export interface ShowAdrOptions {
  json?: boolean;
}

export async function showAdr(
  storeDir: string,
  config: Config,
  id: number,
  options: ShowAdrOptions = {},
): Promise<void> {
  const found = await findAdr(storeDir, id);
  if (!found) throw new Error(`adr #${String(id).padStart(config.idDigits, "0")} が見つかりません`);

  const record = found.record;
  if (options.json) {
    outputJson({ ...record.frontmatter, body: record.body });
    return;
  }

  const fm = record.frontmatter;
  console.log(`#${String(id).padStart(config.idDigits, "0")} ${fm.title}`);
  console.log(`ステータス: ${fm.status}`);
  if (fm.tags) console.log(`タグ: ${(fm.tags as string[]).join(", ")}`);
  if (fm.deciders) console.log(`決定者: ${(fm.deciders as string[]).join(", ")}`);
  if (fm.supersedes)
    console.log(`置き換え元: #${String(fm.supersedes as number).padStart(config.idDigits, "0")}`);
  if (fm.superseded_by)
    console.log(
      `置き換え先: #${String(fm.superseded_by as number).padStart(config.idDigits, "0")}`,
    );
  console.log("");
  console.log(record.body);
}

export interface EditAdrOptions {
  status?: string;
  tags?: string[];
  addTags?: string[];
  removeTags?: string[];
  supersedes?: number | null;
  supersededBy?: number | null;
  title?: string;
  description?: string;
}

export async function editAdr(
  storeDir: string,
  config: Config,
  id: number,
  options: EditAdrOptions,
): Promise<void> {
  const found = await findAdr(storeDir, id);
  if (!found) throw new Error(`adr #${String(id).padStart(config.idDigits, "0")} が見つかりません`);

  const updates: Record<string, unknown> = { updated_at: nowIso() };

  if (options.status !== undefined) updates.status = options.status;
  if (options.title !== undefined) updates.title = options.title;
  if (options.description !== undefined) updates.description = options.description;
  if (options.supersedes !== undefined) updates.supersedes = options.supersedes;
  if (options.supersededBy !== undefined) updates.superseded_by = options.supersededBy;

  // タグ操作
  const currentTags = (found.record.frontmatter.tags as string[] | undefined) ?? [];
  if (options.tags !== undefined) {
    updates.tags = options.tags;
  } else if (options.addTags || options.removeTags) {
    let tags = [...currentTags];
    for (const t of options.addTags ?? []) if (!tags.includes(t)) tags.push(t);
    for (const t of options.removeTags ?? []) tags = tags.filter((x) => x !== t);
    updates.tags = tags;
  }

  const updated = updateFrontmatter(found.record, updates);
  await writeRecord(storeDir, "adr", id, found.slug, updated);

  // supersedes 指定時は旧 ADR を自動更新 (双方向参照整合性)
  if (options.supersedes !== undefined && options.supersedes !== null) {
    const old = await findAdr(storeDir, options.supersedes);
    if (old) {
      const oldUpdated = updateFrontmatter(old.record, {
        superseded_by: id,
        status: "superseded",
        updated_at: nowIso(),
      });
      await writeRecord(storeDir, "adr", options.supersedes, old.slug, oldUpdated);
    }
  }
}

export async function adrTags(storeDir: string, json: boolean = false): Promise<void> {
  const files = await listAdrFiles(storeDir);
  const counts = new Map<string, number>();
  for (const f of files) {
    const tags = f.record.frontmatter.tags as string[] | undefined;
    for (const t of tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }

  if (json) {
    outputJson([...counts.entries()].map(([tag, count]) => ({ tag, count })));
    return;
  }

  const rows = [...counts.entries()].map(([tag, count]) => [tag, String(count)]);
  console.log(renderTable(["タグ", "使用数"], rows));
}

export interface ValidationIssue {
  id: number;
  field: string;
  message: string;
}

export async function validateAdrs(storeDir: string): Promise<ValidationIssue[]> {
  const files = await listAdrFiles(storeDir);
  const issues: ValidationIssue[] = [];
  const validStatuses = ["proposed", "accepted", "deprecated", "superseded"];
  const ids = new Set(files.map((f) => f.record.frontmatter.id as number));

  for (const f of files) {
    const fm = f.record.frontmatter;
    const id = fm.id as number;

    if (!fm.title) issues.push({ id, field: "title", message: "title がありません" });
    if (!fm.status) issues.push({ id, field: "status", message: "status がありません" });
    if (fm.status && !validStatuses.includes(fm.status as string)) {
      issues.push({ id, field: "status", message: `status が不正: ${fm.status}` });
    }

    const tags = fm.tags as string[] | undefined;
    for (const t of tags ?? []) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t) || t.length < 2 || t.length > 30) {
        issues.push({ id, field: "tags", message: `タグ形式が不正: ${t}` });
      }
    }

    if (fm.supersedes !== null && fm.supersedes !== undefined) {
      const ref = fm.supersedes as number;
      if (!ids.has(ref)) {
        issues.push({ id, field: "supersedes", message: `参照先が存在しない: #${ref}` });
      }
    }
    if (fm.superseded_by !== null && fm.superseded_by !== undefined) {
      const ref = fm.superseded_by as number;
      if (!ids.has(ref)) {
        issues.push({ id, field: "superseded_by", message: `参照先が存在しない: #${ref}` });
      }
    }
  }

  return issues;
}

export function parseAdrId(input: string): number | null {
  return parseId(input);
}
