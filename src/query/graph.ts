// 依存グラフ構築
import type { ParsedRecord } from "../store/markdown";
import { getDependencies } from "./dependencies";

export interface GraphNode {
  id: number;
  title: string;
  status: string;
}

export interface GraphEdge {
  from: number;
  to: number;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildGraph(records: ParsedRecord[]): Graph {
  const nodes: GraphNode[] = records.map((r) => ({
    id: r.frontmatter.id as number,
    title: String(r.frontmatter.title ?? ""),
    status: String(r.frontmatter.status ?? ""),
  }));

  const idSet = new Set(nodes.map((n) => n.id));
  const edges: GraphEdge[] = [];
  for (const r of records) {
    const from = r.frontmatter.id as number;
    for (const to of getDependencies(r)) {
      if (idSet.has(to)) {
        edges.push({ from, to });
      }
    }
  }

  return { nodes, edges };
}

export function filterGraphByPlan(graph: Graph, planRelatedIds: number[]): Graph {
  const idSet = new Set(planRelatedIds);
  return {
    nodes: graph.nodes.filter((n) => idSet.has(n.id)),
    edges: graph.edges.filter((e) => idSet.has(e.from) && idSet.has(e.to)),
  };
}
