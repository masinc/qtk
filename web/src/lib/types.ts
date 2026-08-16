export type IssueStatus = "new" | "in-progress" | "paused" | "done";

export interface Issue {
  id: number;
  idLabel: string;
  title: string;
  description: string;
  status: IssueStatus;
  tags: string[];
  claimed_by: string | null;
  body: string;
  [key: string]: unknown;
}

export interface Column {
  status: IssueStatus;
  label: string;
  items: Issue[];
}

export const COLUMN_LABELS: Record<IssueStatus, string> = {
  new: "New",
  "in-progress": "In Progress",
  paused: "Paused",
  done: "Done",
};

export const COLUMN_STATUSES: IssueStatus[] = [
  "new",
  "in-progress",
  "paused",
  "done",
];
