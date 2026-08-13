// qtk search コマンド (横断検索)
import { listIssueFiles } from "./issue";
import { listAdrFiles } from "./adr";
import { listSpecFiles } from "./spec";
import { listPlanFiles } from "./plan";
import { filterRecords } from "../query/filter";
import { outputJson } from "../output/json";
import { renderTable } from "../output/table";
import { formatId } from "../models/id";
import type { Config } from "../models/types";
import type { ParsedRecord } from "../store/markdown";

export interface SearchOptions {
  keyword: string;
  type?: string;
  status?: string;
  tag?: string;
  limit?: number;
  json?: boolean;
}

export interface SearchResult {
  type: string;
  id: number;
  title: string;
  status: string;
  description: string;
}

export async function searchAll(
  storeDir: string,
  config: Config,
  options: SearchOptions,
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  const collect = async (
    type: string,
    files: { record: ParsedRecord }[],
  ) => {
    let records = files.map((f) => f.record);
    records = filterRecords(records, {
      status: options.status,
      tag: options.tag,
      keyword: options.keyword,
      limit: options.limit,
    });
    for (const r of records) {
      results.push({
        type,
        id: r.frontmatter.id as number,
        title: String(r.frontmatter.title ?? ""),
        status: String(r.frontmatter.status ?? r.frontmatter.plan_status ?? ""),
        description: String(r.frontmatter.description ?? ""),
      });
    }
  };

  if (!options.type || options.type === "issue") {
    await collect("issue", await listIssueFiles(storeDir));
  }
  if (!options.type || options.type === "adr") {
    await collect("adr", await listAdrFiles(storeDir));
  }
  if (!options.type || options.type === "spec") {
    await collect("spec", await listSpecFiles(storeDir));
  }
  if (!options.type || options.type === "plan") {
    await collect("plan", await listPlanFiles(storeDir));
  }

  return results;
}

export async function search(
  storeDir: string,
  config: Config,
  options: SearchOptions,
): Promise<void> {
  const results = await searchAll(storeDir, config, options);

  if (options.json) {
    outputJson(results);
    return;
  }

  const rows = results.map((r) => [
    formatId(r.id, config),
    r.type,
    r.title,
    r.status,
  ]);
  console.log(renderTable(["ID", "種別", "タイトル", "ステータス"], rows));
}
