<script lang="ts">
import type { Issue } from "../lib/types";

interface Props {
  issue: Issue;
  onselect: (id: number) => void;
}

let { issue, onselect }: Props = $props();
</script>

<button
  type="button"
  class="card card-border bg-base-100 w-full text-left cursor-pointer hover:shadow-md transition-shadow"
  onclick={() => onselect(issue.id)}
  aria-label={issue.title}
>
  <div class="card-body p-3 gap-1">
    <div class="text-xs font-semibold text-base-content/50">{issue.idLabel}</div>
    <div class="text-sm">{issue.title}</div>
    {#if issue.tags?.length}
      <div class="flex flex-wrap gap-1">
        {#each issue.tags as tag}
          <span class="badge badge-sm badge-soft badge-primary">{tag}</span>
        {/each}
      </div>
    {/if}
    {#if issue.claimed_by}
      <div class="text-xs text-base-content/50">👤 {issue.claimed_by}</div>
    {/if}
  </div>
</button>
