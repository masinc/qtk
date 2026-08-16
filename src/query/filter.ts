// フィルタ (status / tag / assignee / キーワード)
import type { ParsedRecord } from "../store/markdown";

export interface FilterOptions {
  status?: string;
  tag?: string;
  assignee?: string;
  keyword?: string;
  limit?: number;
}

export function filterRecords(records: ParsedRecord[], options: FilterOptions): ParsedRecord[] {
  let result = records;

  if (options.status) {
    result = result.filter((r) => r.frontmatter.status === options.status);
  }

  if (options.tag) {
    result = result.filter((r) => {
      const tags = r.frontmatter.tags;
      return Array.isArray(tags) && tags.includes(options.tag);
    });
  }

  if (options.assignee) {
    result = result.filter((r) => {
      const assignees = r.frontmatter.assignees;
      return Array.isArray(assignees) && assignees.includes(options.assignee);
    });
  }

  if (options.keyword) {
    const kw = options.keyword.toLowerCase();
    result = result.filter((r) => {
      const title = String(r.frontmatter.title ?? "").toLowerCase();
      const description = String(r.frontmatter.description ?? "").toLowerCase();
      const body = r.body.toLowerCase();
      return title.includes(kw) || description.includes(kw) || body.includes(kw);
    });
  }

  if (options.limit && options.limit > 0) {
    result = result.slice(0, options.limit);
  }

  return result;
}
