import { render, screen, waitFor } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import CreateModal from "../../src/components/CreateModal.svelte";
import { issueStore } from "../../src/stores/issues.svelte";

describe("CreateModal", () => {
  it("open でフォームを表示する", () => {
    render(CreateModal, {
      open: true,
      onclose: vi.fn(),
      onsuccess: vi.fn(),
      onerror: vi.fn(),
    });
    expect(screen.getByText("新規チケット作成")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("チケットのタイトル")).toBeInTheDocument();
  });

  it("title が空なら onerror が呼ばれる", async () => {
    const onerror = vi.fn();
    render(CreateModal, {
      open: true,
      onclose: vi.fn(),
      onsuccess: vi.fn(),
      onerror,
    });
    const submit = screen.getByRole("button", { name: "作成" });
    await submit.click();
    expect(onerror).toHaveBeenCalledWith("タイトルは必須です");
  });

  it("title 入力で create が呼ばれ onsuccess が発火する", async () => {
    const createSpy = vi.spyOn(issueStore, "create").mockResolvedValue();
    const onsuccess = vi.fn();
    const onclose = vi.fn();
    render(CreateModal, {
      open: true,
      onclose,
      onsuccess,
      onerror: vi.fn(),
    });
    const input = screen.getByPlaceholderText("チケットのタイトル");
    await input.setAttribute("value", "新しいチケット");
    await input.dispatchEvent(new Event("input", { bubbles: true }));
    const submit = screen.getByRole("button", { name: "作成" });
    await submit.click();
    expect(createSpy).toHaveBeenCalledWith({
      title: "新しいチケット",
      description: undefined,
      tags: [],
    });
    await waitFor(() => {
      expect(onsuccess).toHaveBeenCalledWith("チケットを作成しました");
    });
    expect(onclose).toHaveBeenCalled();
    createSpy.mockRestore();
  });
});
