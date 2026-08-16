import { api } from "../lib/api";
import {
  COLUMN_LABELS,
  COLUMN_STATUSES,
  type Column,
  type Issue,
  type IssueStatus,
} from "../lib/types";

class IssueStore {
  issues = $state<Issue[]>([]);
  loading = $state(false);

  columns = $derived<Column[]>(
    COLUMN_STATUSES.map((status) => ({
      status,
      label: COLUMN_LABELS[status],
      items: this.issues.filter((i) => i.status === status),
    })),
  );

  async load(): Promise<void> {
    this.loading = true;
    try {
      const res = await api.api.issues.$get();
      if (!res.ok) throw new Error(await errorMessage(res));
      const data = await res.json();
      this.issues = data.issues as Issue[];
    } finally {
      this.loading = false;
    }
  }

  async create(input: { title: string; description?: string; tags?: string[] }): Promise<void> {
    const res = await api.api.issues.$post({ json: input });
    if (!res.ok) throw new Error(await errorMessage(res));
    await this.load();
  }

  async updateStatus(id: number, status: IssueStatus): Promise<void> {
    const res = await api.api.issues[":id"].edit.$post({
      param: { id: String(id) },
      json: { status },
    });
    if (!res.ok) throw new Error(await errorMessage(res));
    await this.load();
  }

  async edit(
    id: number,
    input: { status?: IssueStatus; description?: string; comment?: string },
  ): Promise<void> {
    const res = await api.api.issues[":id"].edit.$post({
      param: { id: String(id) },
      json: input,
    });
    if (!res.ok) throw new Error(await errorMessage(res));
    await this.load();
  }
}

async function errorMessage(res: { json(): Promise<unknown>; status: number }): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return body.error ?? `HTTP ${res.status}`;
}

export const issueStore = new IssueStore();
