<script lang="ts">
  import { onMount } from "svelte";
  import Board from "./components/Board.svelte";
  import CreateModal from "./components/CreateModal.svelte";
  import DetailModal from "./components/DetailModal.svelte";
  import Toast from "./components/Toast.svelte";
  import { issueStore } from "./stores/issues.svelte";
  import type { Issue } from "./lib/types";

  let createOpen = $state(false);
  let detailOpen = $state(false);
  let detailIssue = $state<Issue | null>(null);
  let toastMessage = $state("");
  let toastError = $state(false);
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  function showToast(message: string, isError = false) {
    toastMessage = message;
    toastError = isError;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastMessage = "";
    }, 2500);
  }

  function openDetail(id: number) {
    const issue = issueStore.issues.find((i) => i.id === id);
    if (!issue) return;
    detailIssue = issue;
    detailOpen = true;
  }

  onMount(() => {
    issueStore.load().catch((err) => showToast((err as Error).message, true));
  });
</script>

<header class="navbar bg-base-100 border-b border-base-300">
  <div class="navbar-start">
    <h1 class="text-xl font-bold">qtk Kanban</h1>
  </div>
  <div class="navbar-end">
    <button class="btn btn-primary" onclick={() => (createOpen = true)}>
      + 新規チケット
    </button>
  </div>
</header>

<main class="p-6 max-w-[1400px] mx-auto">
  <Board
    onselect={openDetail}
    onerror={(m) => showToast(m, true)}
  />
</main>

<CreateModal
  open={createOpen}
  onclose={() => (createOpen = false)}
  onsuccess={(m) => showToast(m)}
  onerror={(m) => showToast(m, true)}
/>

<DetailModal
  issue={detailIssue}
  open={detailOpen}
  onclose={() => (detailOpen = false)}
  onsuccess={(m) => showToast(m)}
  onerror={(m) => showToast(m, true)}
/>

<Toast message={toastMessage} isError={toastError} />
