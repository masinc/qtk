<script lang="ts">
import type { Issue, IssueStatus } from "../lib/types";
import { issueStore } from "../stores/issues.svelte";

interface Props {
  issue: Issue | null;
  open: boolean;
  onclose: () => void;
  onsuccess: (message: string) => void;
  onerror: (message: string) => void;
}

let { issue, open, onclose, onsuccess, onerror }: Props = $props();

let status = $state<IssueStatus>("new");
let description = $state("");
let comment = $state("");
let _submitting = $state(false);
let dialog: HTMLDialogElement | undefined = $state();

$effect(() => {
  if (open && issue) {
    status = issue.status;
    description = issue.description ?? "";
    comment = "";
    dialog?.showModal();
  } else {
    dialog?.close();
  }
});

async function _submit() {
  if (!issue) return;
  _submitting = true;
  try {
    await issueStore.edit(issue.id, {
      status,
      description,
      comment: comment.trim() || undefined,
    });
    onclose();
    onsuccess("保存しました");
  } catch (err) {
    onerror((err as Error).message);
  } finally {
    _submitting = false;
  }
}
</script>

<dialog bind:this={dialog} class="modal" onclose={onclose}>
  <div class="modal-box">
    {#if issue}
      <h3 class="text-lg font-bold">{issue.idLabel} {issue.title}</h3>
      <form class="mt-4 flex flex-col gap-3" onsubmit={(e) => { e.preventDefault(); _submit(); }}>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">ステータス</legend>
          <select class="select w-full" bind:value={status}>
            <option value="new">new</option>
            <option value="in-progress">in-progress</option>
            <option value="paused">paused</option>
            <option value="done">done</option>
          </select>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">説明</legend>
          <textarea class="textarea w-full" bind:value={description}></textarea>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">コメント追加</legend>
          <textarea
            class="textarea w-full"
            placeholder="コメントを入力"
            bind:value={comment}
          ></textarea>
        </fieldset>
        <div class="modal-action">
          <button type="button" class="btn" onclick={onclose}>閉じる</button>
          <button type="submit" class="btn btn-primary" disabled={_submitting}>
            {_submitting ? "保存中..." : "保存"}
          </button>
        </div>
      </form>
    {/if}
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
