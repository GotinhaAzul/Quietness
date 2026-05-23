<script lang="ts">
  let { open = false, title = 'Confirm', message = '', confirmLabel = 'Delete', onconfirm, oncancel }: {
    open?: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    onconfirm?: () => void;
    oncancel?: () => void;
  } = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      oncancel?.();
    }
  }
</script>

{#if open}
  <div
    class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
  >
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <div
      class="pointer-events-auto absolute inset-0 bg-black/30"
      role="presentation"
      onclick={oncancel}
    ></div>
    <div
      class="pointer-events-auto relative mx-4 flex w-[320px] max-w-full flex-col rounded-xl border border-quiet-border bg-[var(--q-bg)] shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabindex="0"
      onkeydown={handleKeydown}
    >
      <div class="px-5 py-4">
        <h3 class="text-sm font-semibold text-quiet-text">{title}</h3>
        <p class="mt-1.5 text-xs text-quiet-muted">{message}</p>
      </div>
      <div class="flex items-center justify-end gap-2 border-t border-quiet-border/60 px-5 py-3">
        <button
          class="rounded-md px-3.5 py-1.5 text-xs font-medium text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text"
          onclick={oncancel}
        >
          Cancel
        </button>
        <button
          class="rounded-md bg-quiet-danger px-3.5 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          onclick={onconfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
{/if}
