// 依存計算 (ready / blocked)
import type { ParsedRecord } from "../store/markdown";

export function getDependencies(record: ParsedRecord): number[] {
  const deps = record.frontmatter.dependencies;
  return Array.isArray(deps) ? (deps as number[]) : [];
}

export function isDone(record: ParsedRecord): boolean {
  return record.frontmatter.status === "done";
}

export function getReadyIssues(records: ParsedRecord[]): ParsedRecord[] {
  const byId = new Map<number, ParsedRecord>();
  for (const r of records) {
    const id = r.frontmatter.id;
    if (typeof id === "number") byId.set(id, r);
  }

  return records.filter((r) => {
    const deps = getDependencies(r);
    if (deps.length === 0) return true;
    return deps.every((depId) => {
      const dep = byId.get(depId);
      return dep ? isDone(dep) : true;
    });
  });
}

export function getBlockedIssues(records: ParsedRecord[]): ParsedRecord[] {
  const byId = new Map<number, ParsedRecord>();
  for (const r of records) {
    const id = r.frontmatter.id;
    if (typeof id === "number") byId.set(id, r);
  }

  return records.filter((r) => {
    const deps = getDependencies(r);
    if (deps.length === 0) return false;
    return deps.some((depId) => {
      const dep = byId.get(depId);
      return dep ? !isDone(dep) : false;
    });
  });
}
