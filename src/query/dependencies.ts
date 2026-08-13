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

// ─── cycle 検出 (Tarjan の SCC アルゴリズム) ───

export function detectCycles(records: ParsedRecord[]): number[][] {
  const byId = new Map<number, ParsedRecord>();
  for (const r of records) {
    const id = r.frontmatter.id;
    if (typeof id === "number") byId.set(id, r);
  }

  const index = new Map<number, number>();
  const lowlink = new Map<number, number>();
  const onStack = new Set<number>();
  const stack: number[] = [];
  let counter = 0;
  const sccs: number[][] = [];

  const strongConnect = (v: number) => {
    index.set(v, counter);
    lowlink.set(v, counter);
    counter++;
    stack.push(v);
    onStack.add(v);

    const record = byId.get(v);
    const deps = record ? getDependencies(record) : [];
    for (const w of deps) {
      if (!byId.has(w)) continue;
      if (!index.has(w)) {
        strongConnect(w);
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.has(w)) {
        lowlink.set(v, Math.min(lowlink.get(v)!, index.get(w)!));
      }
    }

    if (lowlink.get(v) === index.get(v)) {
      const scc: number[] = [];
      let w: number;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);
      // 自己ループ (v → v) も cycle として扱う
      if (scc.length > 1 || (scc.length === 1 && getDependencies(byId.get(scc[0]!) ?? { frontmatter: {}, body: "" }).includes(scc[0]!))) {
        sccs.push(scc);
      }
    }
  };

  for (const id of byId.keys()) {
    if (!index.has(id)) strongConnect(id);
  }

  return sccs;
}
