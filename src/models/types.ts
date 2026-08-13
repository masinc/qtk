// データモデル・型定義
// 未知フィールドを許容するため、全レコードはインデックスシグネチャを持つ

export type RecordType = "issue" | "adr" | "spec" | "plan";

export interface BaseRecord {
  id: number;
  type: RecordType;
  title: string;
  description: string;
  status: string;
  tags: string[];
  assignees: string[];
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface Comment {
  author: string;
  created_at: string;
  body: string;
}

export interface Issue extends BaseRecord {
  type: "issue";
  status: "new" | "in-progress" | "paused" | "done";
  dependencies: number[];
  acceptance_criteria: string[];
  definition_of_done: string[];
  plan: string;
  comments: Comment[];
  final_summary: string;
  // Phase 2:
  claimed_by: string | null;
  claimed_at: string | null;
  lease_expires_at: string | null;
}

export interface ADR extends BaseRecord {
  type: "adr";
  status: "proposed" | "accepted" | "deprecated" | "superseded";
  deciders: string[];
  supersedes: number | null;
  superseded_by: number | null;
}

export interface Spec extends BaseRecord {
  type: "spec";
  spec_type: "readme" | "guide" | "specification" | "other";
  parent_issue: number | null;
}

export interface Plan extends BaseRecord {
  type: "plan";
  plan_status: "drafting" | "ready" | "in-progress" | "completed" | "superseded" | "abandoned";
  related_issues: number[];
  related_adrs: number[];
  supersedes: number | null;
  superseded_by: number | null;
  generated_at: string;
  generated_by: string;
}

export type Record = Issue | ADR | Spec | Plan;

export interface JsonEnvelope<T> {
  schemaVersion: string;
  data: T;
}

export interface Config {
  version: string;
  idDigits: number;
  defaultStatus: string;
  statuses: string[];
  adrStatuses: string[];
  planStatuses: string[];
  claimLeaseMinutes: number;
  [key: string]: unknown;
}
