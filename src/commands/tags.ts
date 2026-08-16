// qtk tags コマンド (全種別からタグを動的収集)

import { outputJson } from "../output/json";
import { renderTable } from "../output/table";
import { listAdrFiles } from "./adr";
import { listIssueFiles } from "./issue";
import { listPlanFiles } from "./plan";
import { listSpecFiles } from "./spec";

export interface TagCount {
  tag: string;
  count: number;
}

export async function collectTags(storeDir: string): Promise<TagCount[]> {
  const counts = new Map<string, number>();
  const allFiles = [
    ...(await listIssueFiles(storeDir)),
    ...(await listAdrFiles(storeDir)),
    ...(await listSpecFiles(storeDir)),
    ...(await listPlanFiles(storeDir)),
  ];
  for (const f of allFiles) {
    const tags = f.record.frontmatter.tags as string[] | undefined;
    for (const t of tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function listTags(storeDir: string, json: boolean = false): Promise<void> {
  const tags = await collectTags(storeDir);
  if (json) {
    outputJson(tags);
    return;
  }
  const rows = tags.map((t) => [t.tag, String(t.count)]);
  console.log(renderTable(["タグ", "使用数"], rows));
}
