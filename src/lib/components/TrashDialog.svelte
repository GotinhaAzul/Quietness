<script lang="ts">
  import ConfirmModal from './ConfirmModal.svelte';
  import {
    permanentlyDeleteTrashEntry,
    restoreTrashEntry,
    trashEntries,
    trashLoading,
    type TrashEntry,
  } from '$lib/stores/trash';
  import { reconcileIntegrity } from '$lib/stores/integrity';

  let { open = false, onclose }: { open?: boolean; onclose?: () => void } = $props();

  let pendingDelete = $state<TrashEntry | null>(null);
  let busyTrashName = $state<string | null>(null);

  $effect(() => {
    if (open) {
      void reconcileIntegrity('trash-opened');
    } else {
      pendingDelete = null;
      busyTrashName = null;
    }
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onclose?.();
    }
  }

  function formatDate(value: string): string {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})$/);
    if (!match) return value;
    const [, year, month, day, hour, minute] = match;
    return `${month}/${day}/${year} ${hour}:${minute}`;
  }

  async function handleRestore(entry: TrashEntry) {
    if (busyTrashName) return;
    busyTrashName = entry.trashName;
    await restoreTrashEntry(entry.trashName);
    busyTrashName = null;
  }

  async function confirmPermanentDelete() {
    if (!pendingDelete || busyTrashName) return;
    const trashName = pendingDelete.trashName;
    busyTrashName = trashName;
    pendingDelete = null;
    await permanentlyDeleteTrashEntry(trashName);
    busyTrashName = null;
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
    role="dialog"
    aria-modal="true"
    aria-label="Trash"
    onclick={(e) => { if (e.target === e.currentTarget) onclose?.(); }}
    onkeydown={handleKeydown}
    tabindex="0"
  >
    <div
      class="mx-4 flex w-[560px] max-w-full flex-col rounded-xl border border-quiet-border bg-[var(--q-bg)] shadow-xl"
      style="max-height: 76vh;"
    >
      <div class="flex items-center justify-between border-b border-quiet-border/60 px-5 py-3">
        <div>
          <h3 class="text-sm font-semibold text-quiet-text">Trash</h3>
          <p class="mt-0.5 text-[11px] text-quiet-faded">Restore items or remove them permanently.</p>
        </div>
        <button
          class="rounded-md p-1 text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text"
          onclick={onclose}
          aria-label="Close"
        >
          <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {#if $trashLoading}
          <div class="px-2 py-8 text-center text-xs text-quiet-faded">Loading trash...</div>
        {:else if $trashEntries.length === 0}
          <div class="px-2 py-8 text-center text-xs text-quiet-faded">Trash is empty.</div>
        {:else}
          <div class="space-y-1">
            {#each $trashEntries as entry (entry.trashName)}
              <div class="flex min-w-0 items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-quiet-hover/70">
                <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-quiet-surface text-quiet-muted">
                  {#if entry.isFolder}
                    <svg class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M.5 3.5a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.672a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-7.5Z"/>
                    </svg>
                  {:else}
                    <svg class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M3 1.5A1.5 1.5 0 0 1 4.5 0h5.25L13 3.25V14.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 14.5v-13Z"/>
                    </svg>
                  {/if}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="truncate text-xs font-medium text-quiet-text">{entry.originalName}</div>
                  <div class="truncate text-[10px] text-quiet-faded">
                    {entry.originalPath} · {formatDate(entry.trashedAt)}
                  </div>
                </div>
                <div class="flex shrink-0 items-center gap-1">
                  <button
                    class="rounded-md px-2.5 py-1 text-[11px] font-medium text-quiet-muted transition-colors hover:bg-quiet-active hover:text-quiet-text disabled:opacity-50"
                    onclick={() => handleRestore(entry)}
                    disabled={busyTrashName !== null}
                  >
                    Restore
                  </button>
                  <button
                    class="rounded-md px-2.5 py-1 text-[11px] font-medium text-quiet-danger/80 transition-colors hover:bg-quiet-danger-bg hover:text-quiet-danger disabled:opacity-50"
                    onclick={() => (pendingDelete = entry)}
                    disabled={busyTrashName !== null}
                  >
                    Delete
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<ConfirmModal
  open={pendingDelete !== null}
  title="Delete forever"
  message={pendingDelete ? `Permanently delete "${pendingDelete.originalName}"? This cannot be undone.` : ''}
  confirmLabel="Delete forever"
  onconfirm={confirmPermanentDelete}
  oncancel={() => (pendingDelete = null)}
/>
