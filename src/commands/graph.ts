// qtk graph コマンド (依存グラフ表示)
import { listIssueFiles } from "./issue";
import { listPlanFiles } from "./plan";
import { buildGraph, filterGraphByPlan, type Graph } from "../query/graph";
import { detectCycles } from "../query/dependencies";
import { outputJson } from "../output/json";
import { formatId } from "../models/id";
import type { Config } from "../models/types";

export interface GraphOptions {
  planId?: number;
  cycles?: boolean;
  format?: "text" | "dot" | "json";
}

export async function graph(
  storeDir: string,
  config: Config,
  options: GraphOptions,
): Promise<void> {
  const files = await listIssueFiles(storeDir);
  let records = files.map((f) => f.record);

  let graph: Graph = buildGraph(records);

  // plan でフィルタ
  if (options.planId !== undefined) {
    const plans = await listPlanFiles(storeDir);
    const plan = plans.find((p) => p.record.frontmatter.id === options.planId);
    if (!plan) throw new Error(`plan #${String(options.planId).padStart(config.idDigits, "0")} が見つかりません`);
    const related = (plan.record.frontmatter.related_issues as number[] | undefined) ?? [];
    graph = filterGraphByPlan(graph, related);
  }

  const cycles = detectCycles(records);

  if (options.format === "json") {
    outputJson({
      graph,
      cycles,
    });
    return;
  }

  if (options.format === "dot") {
    console.log(renderDot(graph));
    return;
  }

  // text (デフォルト)
  console.log(renderText(graph, config));
  if (options.cycles) {
    if (cycles.length === 0) {
      console.log("\n循環依存はありません");
    } else {
      console.log("\n循環依存を検出:");
      for (const cycle of cycles) {
        console.log(
          `  ${cycle.map((id) => formatId(id, config)).join(" → ")} → ${formatId(cycle[0]!, config)}`,
        );
      }
    }
  }
}

function renderText(graph: Graph, config: Config): string {
  const lines: string[] = [];
  for (const node of graph.nodes) {
    const deps = graph.edges.filter((e) => e.from === node.id);
    if (deps.length === 0) {
      lines.push(`${formatId(node.id, config)} ${node.title} [${node.status}]`);
    } else {
      lines.push(
        `${formatId(node.id, config)} ${node.title} [${node.status}] → ${deps
          .map((d) => formatId(d.to, config))
          .join(", ")}`,
      );
    }
  }
  return lines.join("\n");
}

function renderDot(graph: Graph): string {
  const lines: string[] = ["digraph qtk {"];
  for (const node of graph.nodes) {
    lines.push(`  ${node.id} [label="${node.id}: ${node.title.replace(/"/g, '\\"')}"];`);
  }
  for (const edge of graph.edges) {
    lines.push(`  ${edge.from} -> ${edge.to};`);
  }
  lines.push("}");
  return lines.join("\n");
}
