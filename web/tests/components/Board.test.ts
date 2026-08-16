import { render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Board from "../../src/components/Board.svelte";
import type { Issue } from "../../src/lib/types";
import { issueStore } from "../../src/stores/issues.svelte";

const issues: Issue[] = [
  {
    id: 1,
    idLabel: "#0001",
    title: "new のチケット",
    description: "",
    status: "new",
    tags: [],
    claimed_by: null,
    body: "",
  },
  {
    id: 2,
    idLabel: "#0002",
    title: "done のチケット",
    description: "",
    status: "done",
    tags: [],
    claimed_by: null,
    body: "",
  },
];

describe("Board", () => {
  beforeEach(() => {
    issueStore.issues = issues;
    issueStore.loading = false;
  });

  it("4カラムのヘッダーを表示する", () => {
    render(Board, { onselect: vi.fn(), onerror: vi.fn() });
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Paused")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("issues をステータスごとのカラムに振り分ける", () => {
    render(Board, { onselect: vi.fn(), onerror: vi.fn() });
    expect(screen.getByText("new のチケット")).toBeInTheDocument();
    expect(screen.getByText("done のチケット")).toBeInTheDocument();
  });

  it("loading 中はスピナーを表示する", () => {
    issueStore.loading = true;
    render(Board, { onselect: vi.fn(), onerror: vi.fn() });
    expect(screen.queryByText("New")).not.toBeInTheDocument();
  });
});
