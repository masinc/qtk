<script lang="ts">
interface Props {
  message: string;
  isError?: boolean;
}

let { message, isError = false }: Props = $props();
</script>

{#if message}
  <div class="toast toast-center toast-bottom z-50">
    <div class="alert {isError ? 'alert-error' : 'alert-success'}">
      <span>{message}</span>
    </div>
  </div>
{/if}
