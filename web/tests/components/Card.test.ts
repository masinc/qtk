import { render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import Card from "../../src/components/Card.svelte";
import type { Issue } from "../../src/lib/types";

const issue: Issue = {
  id: 1,
  idLabel: "#0001",
  title: "テストチケット",
  description: "",
  status: "new",
  tags: ["web", "api"],
  claimed_by: "agent",
  body: "",
};

describe("Card", () => {
  it("issue の idLabel / title / tags / claimed_by を表示する", () => {
    render(Card, { issue, onselect: vi.fn() });
    expect(screen.getByText("#0001")).toBeInTheDocument();
    expect(screen.getByText("テストチケット")).toBeInTheDocument();
    expect(screen.getByText("web")).toBeInTheDocument();
    expect(screen.getByText("api")).toBeInTheDocument();
    expect(screen.getByText("👤 agent")).toBeInTheDocument();
  });

  it("クリックで onselect が呼ばれる", async () => {
    const onselect = vi.fn();
    render(Card, { issue, onselect });
    const button = screen.getByRole("button");
    await button.click();
    expect(onselect).toHaveBeenCalledWith(1);
  });

  it("claimed_by が null なら表示しない", () => {
    render(Card, {
      issue: { ...issue, claimed_by: null },
      onselect: vi.fn(),
    });
    expect(screen.queryByText(/👤/)).not.toBeInTheDocument();
  });
});
