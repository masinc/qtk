// qtk issue コマンド群
import { join } from "node:path";
import { existsSync, readdirSync } from "node:fs";
import { parseMarkdown, updateFrontmatter, type ParsedRecord } from "../store/markdown";
import { writeRecord, listRecords, archiveRecord, recordPath } from "../store/repository";
import { nextId, formatId, parseId } from "../models/id";
import { slugify, uniqueSlug } from "../models/slug";
import { filterRecords } from "../query/filter";
import { getReadyIssues, getBlockedIssues } from "../query/dependencies";
import { outputJson } from "../output/json";
import { renderTable } from "../output/table";
import { withFileLock } from "../store/lock";
import { nowIso } from "./context";
import type { Config } from "../models/types";

export interface IssueFile {
  record: ParsedRecord;
  slug: string;
}

export async function listIssueFiles(storeDir: string): Promise<IssueFile[]> {
  const dir = join(storeDir, "issues");
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  const result: IssueFile[] = [];
  for (const f of files) {
    const content = await Bun.file(join(dir, f)).text();
    const record = parseMarkdown(content);
    if (record.frontmatter.id !== undefined) {
      result.push({ record, slug: f.replace(/^\d{4}-/, "").replace(/\.md$/, "") });
    }
  }
  return result;
}

export async function findIssue(storeDir: string, id: number): Promise<IssueFile | null> {
  const files = await listIssueFiles(storeDir);
  return files.find((f) => f.record.frontmatter.id === id) ?? null;
}

export interface CreateIssueOptions {
  title: string;
  description?: string;
  acceptanceCriteria?: string[];
  tags?: string[];
  assignees?: string[];
  dependencies?: number[];
}

export async function createIssue(
  storeDir: string,
  config: Config,
  options: CreateIssueOptions,
): Promise<{ id: number; path: string }> {
  const id = await nextId(storeDir, config);
  const existing = new Set(
    readdirSync(join(storeDir, "issues")).filter((f) => f.endsWith(".md")),
  );
  const slug = uniqueSlug(slugify(options.title), existing);

  const frontmatter: Record<string, unknown> = {
    id,
    type: "issue",
    title: options.title,
    description: options.description ?? "",
    status: config.defaultStatus,
    tags: options.tags ?? [],
    assignees: options.assignees ?? [],
    created_at: nowIso(),
    updated_at: nowIso(),
    dependencies: options.dependencies ?? [],
    acceptance_criteria: options.acceptanceCriteria ?? [],
    definition_of_done: [],
    plan: "",
    comments: [],
    final_summary: "",
  };

  const body = `## 説明

${options.description ?? ""}

## 受け入れ基準

${(options.acceptanceCriteria ?? []).map((ac) => `- [ ] ${ac}`).join("\n")}

## コメント

<!-- CLI の --comment で追記される -->
`;

  await writeRecord(storeDir, "issue", id, slug, { frontmatter, body });
  return { id, path: recordPath(storeDir, "issue", id, slug) };
}

export interface ListIssueOptions {
  status?: string;
  assignee?: string;
  tag?: string;
  ready?: boolean;
  blocked?: boolean;
  stale?: boolean;
  keyword?: string;
  limit?: number;
  json?: boolean;
}

export async function listIssues(
  storeDir: string,
  config: Config,
  options: ListIssueOptions,
): Promise<void> {
  const files = await listIssueFiles(storeDir);
  let records = files.map((f) => f.record);

  if (options.ready) records = getReadyIssues(records);
  if (options.blocked) records = getBlockedIssues(records);
  if (options.stale) records = records.filter(isStaleClaim);

  records = filterRecords(records, {
    status: options.status,
    tag: options.tag,
    assignee: options.assignee,
    keyword: options.keyword,
    limit: options.limit,
  });

  if (options.json) {
    outputJson(
      records.map((r) => ({
        ...r.frontmatter,
        dependencies: r.frontmatter.dependencies ?? [],
      })),
    );
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

export interface ShowIssueOptions {
  json?: boolean;
}

export async function showIssue(
  storeDir: string,
  config: Config,
  id: number,
  options: ShowIssueOptions = {},
): Promise<void> {
  const found = await findIssue(storeDir, id);
  if (!found) throw new Error(`issue #${String(id).padStart(config.idDigits, "0")} が見つかりません`);

  const record = found.record;
  if (options.json) {
    outputJson({ ...record.frontmatter, body: record.body });
    return;
  }

  const fm = record.frontmatter;
  console.log(`#${String(id).padStart(config.idDigits, "0")} ${fm.title}`);
  console.log(`ステータス: ${fm.status}`);
  if (fm.tags) console.log(`タグ: ${(fm.tags as string[]).join(", ")}`);
  if (fm.assignees) console.log(`担当: ${(fm.assignees as string[]).join(", ")}`);
  if (fm.dependencies) console.log(`依存: ${(fm.dependencies as number[]).map((d) => `#${String(d).padStart(config.idDigits, "0")}`).join(", ")}`);
  console.log("");
  console.log(record.body);
}

export interface EditIssueOptions {
  description?: string;
  acceptanceCriteria?: string[];
  addAc?: number;
  plan?: string;
  notes?: string;
  comment?: string;
  commentAuthor?: string;
  tags?: string[];
  addTags?: string[];
  removeTags?: string[];
  clearTags?: boolean;
  assignees?: string[];
  dependencies?: number[];
  status?: string;
  finalSummary?: string;
}

export async function editIssue(
  storeDir: string,
  config: Config,
  id: number,
  options: EditIssueOptions,
): Promise<void> {
  const found = await findIssue(storeDir, id);
  if (!found) throw new Error(`issue #${String(id).padStart(config.idDigits, "0")} が見つかりません`);

  const updates: Record<string, unknown> = { updated_at: nowIso() };

  if (options.description !== undefined) updates.description = options.description;
  if (options.acceptanceCriteria !== undefined) updates.acceptance_criteria = options.acceptanceCriteria;
  if (options.plan !== undefined) updates.plan = options.plan;
  if (options.notes !== undefined) updates.notes = options.notes;
  if (options.finalSummary !== undefined) updates.final_summary = options.finalSummary;
  if (options.status !== undefined) updates.status = options.status;
  if (options.assignees !== undefined) updates.assignees = options.assignees;
  if (options.dependencies !== undefined) updates.dependencies = options.dependencies;

  // タグ操作
  const currentTags = (found.record.frontmatter.tags as string[] | undefined) ?? [];
  if (options.clearTags) {
    updates.tags = [];
  } else if (options.tags !== undefined) {
    updates.tags = options.tags;
  } else if (options.addTags || options.removeTags) {
    let tags = [...currentTags];
    for (const t of options.addTags ?? []) if (!tags.includes(t)) tags.push(t);
    for (const t of options.removeTags ?? []) tags = tags.filter((x) => x !== t);
    updates.tags = tags;
  }

  // コメント追記
  if (options.comment) {
    const comments = (found.record.frontmatter.comments as unknown[] | undefined) ?? [];
    comments.push({
      author: options.commentAuthor ?? "@unknown",
      created_at: nowIso(),
      body: options.comment,
    });
    updates.comments = comments;
  }

  const updated = updateFrontmatter(found.record, updates);
  await writeRecord(storeDir, "issue", id, found.slug, updated);
}

export async function archiveIssue(
  storeDir: string,
  config: Config,
  id: number,
): Promise<void> {
  const found = await findIssue(storeDir, id);
  if (!found) throw new Error(`issue #${String(id).padStart(config.idDigits, "0")} が見つかりません`);
  archiveRecord(storeDir, "issue", id, found.slug);
}

export interface ClaimOptions {
  as?: string;
}

export async function claimIssue(
  storeDir: string,
  config: Config,
  id: number,
  options: ClaimOptions = {},
): Promise<void> {
  const lockPath = join(storeDir, ".meta", "claim.lock");
  await withFileLock(lockPath, async () => {
    const found = await findIssue(storeDir, id);
    if (!found) throw new Error(`issue #${String(id).padStart(config.idDigits, "0")} が見つかりません`);

    const fm = found.record.frontmatter;
    const claimedBy = fm.claimed_by as string | null | undefined;
    const leaseExpiresAt = fm.lease_expires_at as string | null | undefined;

    // 既存クレームが lease 有効ならエラー
    if (claimedBy && leaseExpiresAt && new Date(leaseExpiresAt) > new Date()) {
      throw new Error(
        `issue #${String(id).padStart(config.idDigits, "0")} は ${claimedBy} がクレーム中です (lease: ${leaseExpiresAt})`,
      );
    }

    const leaseMinutes = config.claimLeaseMinutes ?? 30;
    const leaseExpires = new Date(Date.now() + leaseMinutes * 60 * 1000).toISOString();
    const claimer = options.as ?? "unknown";

    const updated = updateFrontmatter(found.record, {
      claimed_by: claimer,
      claimed_at: nowIso(),
      lease_expires_at: leaseExpires,
      status: "in-progress",
      updated_at: nowIso(),
    });
    await writeRecord(storeDir, "issue", id, found.slug, updated);
  });
}

export function isStaleClaim(record: ParsedRecord): boolean {
  const claimedBy = record.frontmatter.claimed_by as string | null | undefined;
  const leaseExpiresAt = record.frontmatter.lease_expires_at as string | null | undefined;
  if (!claimedBy || !leaseExpiresAt) return false;
  return new Date(leaseExpiresAt) <= new Date();
}

export function parseIssueId(input: string): number | null {
  return parseId(input);
}
