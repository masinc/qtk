// Phase 2 統合テスト (claim/lease・グラフ・cycle 検出)
import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { graph } from "../../src/commands/graph";
import { initStore } from "../../src/commands/init";
import { claimIssue, createIssue, findIssue, isStaleClaim } from "../../src/commands/issue";
import { createPlan } from "../../src/commands/plan";
import { loadConfig } from "../../src/config/config";
import { detectCycles } from "../../src/query/dependencies";
import { buildGraph } from "../../src/query/graph";

let storeDir: string;
let config: Awaited<ReturnType<typeof loadConfig>>;

beforeAll(async () => {
  storeDir = join(tmpdir(), `qtk-e2e-p2-${Date.now()}`);
  mkdirSync(storeDir, { recursive: true });
  await initStore({ dir: storeDir, defaults: true });
  config = await loadConfig(storeDir);
});

afterAll(() => {
  rmSync(storeDir, { recursive: true, force: true });
});

test("E2E: claim → 並列クレーム衝突 → stale 検出", async () => {
  const { id } = await createIssue(storeDir, config, { title: "クレームテスト" });

  // クレーム
  await claimIssue(storeDir, config, id, { as: "agent-a" });
  const found1 = await findIssue(storeDir, id);
  expect(found1?.record.frontmatter.claimed_by).toBe("agent-a");
  expect(found1?.record.frontmatter.status).toBe("in-progress");

  // 並列クレーム衝突 (lease 有効なので失敗)
  const results = await Promise.allSettled([
    claimIssue(storeDir, config, id, { as: "agent-b" }),
    claimIssue(storeDir, config, id, { as: "agent-c" }),
  ]);
  expect(results.filter((r) => r.status === "fulfilled").length).toBe(0);

  // lease を過去に書き換えて stale 検出
  const found2 = await findIssue(storeDir, id);
  const past = new Date(Date.now() - 1000).toISOString();
  const content = await Bun.file(join(storeDir, "issues", `0001-${found2?.slug}.md`)).text();
  await Bun.write(
    join(storeDir, "issues", `0001-${found2?.slug}.md`),
    content.replace(/lease_expires_at:.*/, `lease_expires_at: "${past}"`),
  );
  const found3 = await findIssue(storeDir, id);
  if (!found3) throw new Error("issue が見つからない");
  expect(isStaleClaim(found3.record)).toBe(true);

  // stale なら再クレームできる
  await claimIssue(storeDir, config, id, { as: "agent-b" });
  const found4 = await findIssue(storeDir, id);
  expect(found4?.record.frontmatter.claimed_by).toBe("agent-b");
});

test("E2E: graph 表示 → cycle 検出", async () => {
  const { editIssue, listIssueFiles } = await import("../../src/commands/issue");

  // 依存チェーン: 2 → 3 → 4 (作成後に editIssue で依存設定)
  const a = await createIssue(storeDir, config, { title: "A" });
  const b = await createIssue(storeDir, config, { title: "B" });
  const c = await createIssue(storeDir, config, { title: "C" });
  expect(a.id).toBe(2);
  expect(b.id).toBe(3);
  expect(c.id).toBe(4);
  await editIssue(storeDir, config, 2, { dependencies: [3] });
  await editIssue(storeDir, config, 3, { dependencies: [4] });

  // cycle: 5 → 6 → 5
  const d = await createIssue(storeDir, config, { title: "D" });
  const e = await createIssue(storeDir, config, { title: "E" });
  expect(d.id).toBe(5);
  expect(e.id).toBe(6);
  await editIssue(storeDir, config, 5, { dependencies: [6] });
  await editIssue(storeDir, config, 6, { dependencies: [5] });

  const files = await listIssueFiles(storeDir);
  const records = files.map((f) => f.record);

  // グラフ構築
  const g = buildGraph(records);
  expect(g.nodes.length).toBe(6);
  expect(g.edges).toContainEqual({ from: 2, to: 3 });
  expect(g.edges).toContainEqual({ from: 3, to: 4 });

  // cycle 検出
  const cycles = detectCycles(records);
  expect(cycles.length).toBe(1);
  expect(cycles[0]?.sort()).toEqual([5, 6]);

  // graph コマンド (text)
  await graph(storeDir, config, { format: "text" });

  // graph コマンド (dot)
  await graph(storeDir, config, { format: "dot" });

  // graph コマンド (json)
  await graph(storeDir, config, { format: "json" });
});

test("E2E: graph --plan で plan 関連 issue のみ表示", async () => {
  const plan = await createPlan(storeDir, config, {
    title: "テスト計画",
    relatedIssues: [2, 3],
  });

  const { listIssueFiles } = await import("../../src/commands/issue");
  const files = await listIssueFiles(storeDir);
  const records = files.map((f) => f.record);
  const g = buildGraph(records);

  const { filterGraphByPlan } = await import("../../src/query/graph");
  const filtered = filterGraphByPlan(g, [2, 3]);
  expect(filtered.nodes.map((n) => n.id).sort()).toEqual([2, 3]);
  expect(plan.id).toBeGreaterThan(0);
});
