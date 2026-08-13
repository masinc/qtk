// qtk migrate-adr コマンド (Python 製 ADR CLI からの移行)
import { join } from "node:path";
import { existsSync, readdirSync, mkdirSync } from "node:fs";
import { parseMarkdown, serializeMarkdown } from "../store/markdown";
import { nextId, formatId } from "../models/id";
import { slugify, uniqueSlug } from "../models/slug";
import { nowIso } from "./context";
import type { Config } from "../models/types";

export interface MigrateAdrOptions {
  sourceDir: string;
  storeDir: string;
  dryRun?: boolean;
}

export interface MigrationResult {
  migrated: number;
  skipped: number;
  errors: { file: string; message: string }[];
  idMap: Record<number, number>;
}

export async function migrateAdr(
  config: Config,
  options: MigrateAdrOptions,
): Promise<MigrationResult> {
  const { sourceDir, storeDir, dryRun = false } = options;
  const result: MigrationResult = { migrated: 0, skipped: 0, errors: [], idMap: {} };

  if (!existsSync(sourceDir)) {
    throw new Error(`ソースディレクトリが存在しません: ${sourceDir}`);
  }

  const files = readdirSync(sourceDir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  // 既存の qtk ADR の slug を収集 (衝突回避)
  const adrDir = join(storeDir, "adrs");
  const existingSlugs = new Set<string>();
  if (existsSync(adrDir)) {
    for (const f of readdirSync(adrDir).filter((f) => f.endsWith(".md"))) {
      existingSlugs.add(f.replace(/^\d{4}-/, "").replace(/\.md$/, ""));
    }
  }

  for (const file of files) {
    const filePath = join(sourceDir, file);
    try {
      const content = await Bun.file(filePath).text();
      const parsed = parseMarkdown(content);
      const fm = parsed.frontmatter;

      // 元の番号 (ファイル名 NNNN-slug.md から)
      const originalId = parseInt(file.match(/^(\d+)/)?.[1] ?? "0", 10);

      // 新しい ID を採番 (共通採番)
      const newId = await nextId(storeDir, config);
      result.idMap[originalId] = newId;

      // frontmatter 変換
      const newFrontmatter: Record<string, unknown> = {
        id: newId,
        type: "adr",
        title: fm.title ?? "untitled",
        description: fm.description ?? "",
        status: fm.status ?? "proposed",
        tags: Array.isArray(fm.tags) ? fm.tags : [],
        assignees: [],
        created_at: fm.created_at ?? fm.date ?? nowIso(),
        updated_at: fm.updated_at ?? fm.date ?? nowIso(),
        deciders: Array.isArray(fm.deciders) ? fm.deciders : [],
        supersedes: null,
        superseded_by: null,
      };

      // supersedes / superseded_by は後で解決 (2パス目)
      if (fm.supersedes !== null && fm.supersedes !== undefined) {
        newFrontmatter.supersedes = fm.supersedes;
      }
      if (fm.superseded_by !== null && fm.superseded_by !== undefined) {
        newFrontmatter.superseded_by = fm.superseded_by;
      }

      const slug = uniqueSlug(slugify(String(fm.title ?? "untitled")), existingSlugs);
      existingSlugs.add(slug);

      if (dryRun) {
        console.log(`[dry-run] ${file} → ${formatId(newId, config)} (${slug}.md)`);
      } else {
        mkdirSync(adrDir, { recursive: true });
        const record = {
          frontmatter: newFrontmatter,
          body: parsed.body,
        };
        await Bun.write(
          join(adrDir, `${String(newId).padStart(config.idDigits, "0")}-${slug}.md`),
          serializeMarkdown(record),
        );
        console.log(`[migrated] ${file} → ${formatId(newId, config)} (${slug}.md)`);
      }
      result.migrated++;
    } catch (err) {
      result.errors.push({ file, message: (err as Error).message });
      result.skipped++;
    }
  }

  // 2パス目: supersedes / superseded_by の参照を新しい ID に更新
  if (!dryRun && result.migrated > 0) {
    const adrFiles = readdirSync(adrDir).filter((f) => f.endsWith(".md"));
    for (const f of adrFiles) {
      const path = join(adrDir, f);
      const content = await Bun.file(path).text();
      const parsed = parseMarkdown(content);
      const fm = parsed.frontmatter;
      const updates: Record<string, unknown> = {};

      if (fm.supersedes !== null && fm.supersedes !== undefined) {
        const oldRef = fm.supersedes as number;
        updates.supersedes = result.idMap[oldRef] ?? oldRef;
      }
      if (fm.superseded_by !== null && fm.superseded_by !== undefined) {
        const oldRef = fm.superseded_by as number;
        updates.superseded_by = result.idMap[oldRef] ?? oldRef;
      }

      if (Object.keys(updates).length > 0) {
        const updated = {
          frontmatter: { ...fm, ...updates },
          body: parsed.body,
        };
        await Bun.write(path, serializeMarkdown(updated));
      }
    }
  }

  return result;
}
