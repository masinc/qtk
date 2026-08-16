<script lang="ts">
  import { dndzone, type DndEvent } from "svelte-dnd-action";
  import Card from "./Card.svelte";
  import type { Column, Issue, IssueStatus } from "../lib/types";

  interface Props {
    column: Column;
    onmove: (id: number, status: IssueStatus) => void;
    onselect: (id: number) => void;
  }

  let { column, onmove, onselect }: Props = $props();

  let items = $state<Issue[]>([]);

  $effect(() => {
    items = column.items;
  });

  const STATUS_BADGE: Record<IssueStatus, string> = {
    new: "badge-info",
    "in-progress": "badge-warning",
    paused: "badge-error",
    done: "badge-success",
  };

  function handleConsider(e: CustomEvent<DndEvent<Issue>>) {
    items = e.detail.items;
  }

  function handleFinalize(e: CustomEvent<DndEvent<Issue>>) {
    items = e.detail.items;
    const moved = items.find((i) => !column.items.some((c) => c.id === i.id));
    if (moved) onmove(moved.id, column.status);
  }
</script>

<div class="bg-base-200 rounded-box p-3 flex flex-col gap-2 min-h-64">
  <div class="flex items-center justify-between px-1">
    <span class="badge {STATUS_BADGE[column.status]}">{column.label}</span>
    <span class="text-xs text-base-content/50">{items.length}</span>
  </div>
  <div
    class="flex flex-col gap-2 flex-1"
    use:dndzone={{ items, flipDurationMs: 100 }}
    onconsider={handleConsider}
    onfinalize={handleFinalize}
    aria-label={column.label}
  >
    {#each items as item (item.id)}
      <Card issue={item} onselect={onselect} />
    {/each}
  </div>
</div>
