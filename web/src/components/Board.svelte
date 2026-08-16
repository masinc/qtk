<script lang="ts">
  import Column from "./Column.svelte";
  import { issueStore } from "../stores/issues.svelte";
  import type { IssueStatus } from "../lib/types";

  interface Props {
    onselect: (id: number) => void;
    onerror: (message: string) => void;
  }

  let { onselect, onerror }: Props = $props();

  async function handleMove(id: number, status: IssueStatus) {
    try {
      await issueStore.updateStatus(id, status);
    } catch (err) {
      onerror((err as Error).message);
    }
  }
</script>

{#if issueStore.loading}
  <div class="flex justify-center p-12">
    <span class="loading loading-spinner loading-lg"></span>
  </div>
{:else}
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
    {#each issueStore.columns as column (column.status)}
      <Column column={column} onmove={handleMove} onselect={onselect} />
    {/each}
  </div>
{/if}
