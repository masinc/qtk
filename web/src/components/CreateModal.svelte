<script lang="ts">
  import { issueStore } from "../stores/issues.svelte";

  interface Props {
    open: boolean;
    onclose: () => void;
    onsuccess: (message: string) => void;
    onerror: (message: string) => void;
  }

  let { open, onclose, onsuccess, onerror }: Props = $props();

  let title = $state("");
  let description = $state("");
  let tags = $state("");
  let submitting = $state(false);
  let dialog: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (open) {
      dialog?.showModal();
    } else {
      dialog?.close();
    }
  });

  function reset() {
    title = "";
    description = "";
    tags = "";
  }

  async function submit() {
    const trimmed = title.trim();
    if (!trimmed) {
      onerror("タイトルは必須です");
      return;
    }
    submitting = true;
    try {
      await issueStore.create({
        title: trimmed,
        description: description.trim() || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      reset();
      onclose();
      onsuccess("チケットを作成しました");
    } catch (err) {
      onerror((err as Error).message);
    } finally {
      submitting = false;
    }
  }
</script>

<dialog bind:this={dialog} class="modal" onclose={onclose}>
  <div class="modal-box">
    <h3 class="text-lg font-bold">新規チケット作成</h3>
    <form class="mt-4 flex flex-col gap-3" onsubmit={(e) => { e.preventDefault(); submit(); }}>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">タイトル</legend>
        <input
          type="text"
          class="input w-full"
          placeholder="チケットのタイトル"
          bind:value={title}
        />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">説明</legend>
        <textarea
          class="textarea w-full"
          placeholder="チケットの説明"
          bind:value={description}
        ></textarea>
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">タグ (カンマ区切り)</legend>
        <input
          type="text"
          class="input w-full"
          placeholder="backend, auth"
          bind:value={tags}
        />
      </fieldset>
      <div class="modal-action">
        <button type="button" class="btn" onclick={onclose}>キャンセル</button>
        <button type="submit" class="btn btn-primary" disabled={submitting}>
          {submitting ? "作成中..." : "作成"}
        </button>
      </div>
    </form>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
