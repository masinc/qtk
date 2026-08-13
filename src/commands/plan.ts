// qtk plan コマンド群
import { join } from "node:path";
import { existsSync, readdirSync } from "node:fs";
import { parseMarkdown, updateFrontmatter, type ParsedRecord } from "../store/markdown";
import { writeRecord, archiveRecord, recordPath } from "../store/repository";
import { nextId, formatId, parseId } from "../models/id";
import { slugify, uniqueSlug } from "../models/slug";
import { filterRecords } from "../query/filter";
import { outputJson } from "../output/json";
import { renderTable } from "../output/table";
import { nowIso } from "./context";
import type { Config } from "../models/types";

export interface PlanFile {
  record: ParsedRecord;
  slug: string;
}

export async function listPlanFiles(storeDir: string): Promise<PlanFile[]> {
  const dir = join(storeDir, "plans");
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  const result: PlanFile[] = [];
  for (const f of files) {
    const content = await Bun.file(join(dir, f)).text();
    const record = parseMarkdown(content);
    if (record.frontmatter.id !== undefined) {
      result.push({ record, slug: f.replace(/^\d{4}-/, "").replace(/\.md$/, "") });
    }
  }
  return result;
}

export async function findPlan(storeDir: string, id: number): Promise<PlanFile | null> {
  const files = await listPlanFiles(storeDir);
  return files.find((f) => f.record.frontmatter.id === id) ?? null;
}

export interface CreatePlanOptions {
  title: string;
  description?: string;
  relatedIssues?: number[];
  relatedAdrs?: number[];
  generatedBy?: string;
  status?: string;
}

export async function createPlan(
  storeDir: string,
  config: Config,
  options: CreatePlanOptions,
): Promise<{ id: number; path: string }> {
  const id = await nextId(storeDir, config);
  const existing = new Set(
    readdirSync(join(storeDir, "plans")).filter((f) => f.endsWith(".md")),
  );
  const slug = uniqueSlug(slugify(options.title), existing);

  const frontmatter: Record<string, unknown> = {
    id,
    type: "plan",
    title: options.title,
    description: options.description ?? "",
    plan_status: options.status ?? "drafting",
    tags: [],
    assignees: [],
    created_at: nowIso(),
    updated_at: nowIso(),
    related_issues: options.relatedIssues ?? [],
    related_adrs: options.relatedAdrs ?? [],
    supersedes: null,
    superseded_by: null,
    generated_at: nowIso(),
    generated_by: options.generatedBy ?? "unknown",
  };

  const body = `## Context (背景・現状・制約)

（計画の背景・動機・現状のコード/アーキテクチャ・制約事項）

## Goals (目的・ゴール・非ゴール・受け入れ基準)

（何を実現するか・なぜ実現するか・非ゴール・Done の定義）

## Design (設計方針・アーキテクチャ・データモデル)

（実現方法・アーキテクチャ・主要モジュール・インターフェース・既存コードとの統合方針）

## Tasks (タスク一覧)

（番号付きタスク一覧・依存関係・優先度）

## Risks (リスク・懸念・緩和策)

（技術的リスク・スケジュールリスク・緩和策）

## References (参考リンク・関連ファイル)

（関連ドキュメント・参考コード・調査結果）
`;

  await writeRecord(storeDir, "plan", id, slug, { frontmatter, body });
  return { id, path: recordPath(storeDir, "plan", id, slug) };
}

export interface ListPlanOptions {
  status?: string;
  relatedIssue?: number;
  json?: boolean;
}

export async function listPlans(
  storeDir: string,
  config: Config,
  options: ListPlanOptions,
): Promise<void> {
  const files = await listPlanFiles(storeDir);
  let records = files.map((f) => f.record);

  if (options.status) {
    records = records.filter((r) => r.frontmatter.plan_status === options.status);
  }
  if (options.relatedIssue) {
    records = records.filter((r) => {
      const related = r.frontmatter.related_issues as number[] | undefined;
      return Array.isArray(related) && related.includes(options.relatedIssue!);
    });
  }

  if (options.json) {
    outputJson(records.map((r) => r.frontmatter));
    return;
  }

  const rows = records.map((r) => [
    formatId(r.frontmatter.id as number, config),
    String(r.frontmatter.title ?? ""),
    String(r.frontmatter.plan_status ?? ""),
    String(r.frontmatter.generated_by ?? ""),
  ]);
  console.log(renderTable(["ID", "タイトル", "ステータス", "生成者"], rows));
}

export interface ShowPlanOptions {
  json?: boolean;
}

export async function showPlan(
  storeDir: string,
  config: Config,
  id: number,
  options: ShowPlanOptions = {},
): Promise<void> {
  const found = await findPlan(storeDir, id);
  if (!found) throw new Error(`plan #${String(id).padStart(config.idDigits, "0")} が見つかりません`);

  const record = found.record;
  if (options.json) {
    outputJson({ ...record.frontmatter, body: record.body });
    return;
  }

  const fm = record.frontmatter;
  console.log(`#${String(id).padStart(config.idDigits, "0")} ${fm.title}`);
  console.log(`ステータス: ${fm.plan_status}`);
  if (fm.related_issues) console.log(`関連 issue: ${(fm.related_issues as number[]).map((d) => `#${String(d).padStart(config.idDigits, "0")}`).join(", ")}`);
  if (fm.related_adrs) console.log(`関連 ADR: ${(fm.related_adrs as number[]).map((d) => `#${String(d).padStart(config.idDigits, "0")}`).join(", ")}`);
  if (fm.generated_by) console.log(`生成者: ${fm.generated_by}`);
  console.log("");
  console.log(record.body);
}

export interface EditPlanOptions {
  status?: string;
  relatedIssues?: number[];
  relatedAdrs?: number[];
  supersedes?: number | null;
  title?: string;
  description?: string;
}

export async function editPlan(
  storeDir: string,
  config: Config,
  id: number,
  options: EditPlanOptions,
): Promise<void> {
  const found = await findPlan(storeDir, id);
  if (!found) throw new Error(`plan #${String(id).padStart(config.idDigits, "0")} が見つかりません`);

  const updates: Record<string, unknown> = { updated_at: nowIso() };

  if (options.status !== undefined) updates.plan_status = options.status;
  if (options.title !== undefined) updates.title = options.title;
  if (options.description !== undefined) updates.description = options.description;
  if (options.relatedIssues !== undefined) updates.related_issues = options.relatedIssues;
  if (options.relatedAdrs !== undefined) updates.related_adrs = options.relatedAdrs;
  if (options.supersedes !== undefined) updates.supersedes = options.supersedes;

  const updated = updateFrontmatter(found.record, updates);
  await writeRecord(storeDir, "plan", id, found.slug, updated);

  // supersedes 指定時は旧 plan を自動更新 (双方向参照整合性)
  if (options.supersedes !== undefined && options.supersedes !== null) {
    const old = await findPlan(storeDir, options.supersedes);
    if (old) {
      const oldUpdated = updateFrontmatter(old.record, {
        superseded_by: id,
        plan_status: "superseded",
        updated_at: nowIso(),
      });
      await writeRecord(storeDir, "plan", options.supersedes, old.slug, oldUpdated);
    }
  }
}

export async function archivePlan(
  storeDir: string,
  config: Config,
  id: number,
): Promise<void> {
  const found = await findPlan(storeDir, id);
  if (!found) throw new Error(`plan #${String(id).padStart(config.idDigits, "0")} が見つかりません`);
  archiveRecord(storeDir, "plan", id, found.slug);
}

export function parsePlanId(input: string): number | null {
  return parseId(input);
}
