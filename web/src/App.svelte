<script lang="ts">
import { onMount } from "svelte";
import type { Issue } from "./lib/types";
import { issueStore } from "./stores/issues.svelte";
import Board from "./components/Board.svelte";
import CreateModal from "./components/CreateModal.svelte";
import DetailModal from "./components/DetailModal.svelte";
import Toast from "./components/Toast.svelte";

let _createOpen = $state(false);
let _detailOpen = $state(false);
let _detailIssue = $state<Issue | null>(null);
let _toastMessage = $state("");
let _toastError = $state(false);
let toastTimer: ReturnType<typeof setTimeout> | undefined;

function showToast(message: string, isError = false) {
  _toastMessage = message;
  _toastError = isError;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    _toastMessage = "";
  }, 2500);
}

function _openDetail(id: number) {
  const issue = issueStore.issues.find((i) => i.id === id);
  if (!issue) return;
  _detailIssue = issue;
  _detailOpen = true;
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
    <button class="btn btn-primary" onclick={() => (_createOpen = true)}>
      + 新規チケット
    </button>
  </div>
</header>

<main class="p-6 max-w-[1400px] mx-auto">
  <Board
    onselect={_openDetail}
    onerror={(m) => showToast(m, true)}
  />
</main>

<CreateModal
  open={_createOpen}
  onclose={() => (_createOpen = false)}
  onsuccess={(m) => showToast(m)}
  onerror={(m) => showToast(m, true)}
/>

<DetailModal
  issue={_detailIssue}
  open={_detailOpen}
  onclose={() => (_detailOpen = false)}
  onsuccess={(m) => showToast(m)}
  onerror={(m) => showToast(m, true)}
/>

<Toast message={_toastMessage} isError={_toastError} />
