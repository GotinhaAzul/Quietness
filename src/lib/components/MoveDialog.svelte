<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { tick } from 'svelte';
  import { moveTarget, type MoveTarget } from '$lib/stores/move';
  import { moveNote } from '$lib/stores/notes';
  import { folders, moveFolder, renameFolder } from '$lib/stores/folders';
  import { showError } from '$lib/stores/errors';

  let { open = false }: { open?: boolean } = $props();

  let notesDir = $state('');
  let selectedDest = $state<string | null>(null);
  let moving = $state(false);
  let target = $state<MoveTarget | null>(null);
  let currentFolder = $state<string | null>(null);

  $effect(() => {
    if (open && $moveTarget) {
      target = $moveTarget;
      selectedDest = null;
      moving = false;
      resolveCurrentFolder($moveTarget);
    } else {
      target = null;
    }
  });

  async function resolveCurrentFolder(t: MoveTarget) {
    try {
      const dir = await invoke<string>('get_notes_dir');
      const baseDir = dir.replace(/\\/g, '/');
      notesDir = baseDir;

      if (t.type === 'note') {
        const rel = t.path.replace(/\\/g, '/').slice(baseDir.length).replace(/^\//, '');
        const parts = rel.split('/');
        parts.pop();
        currentFolder = parts.join('/') || null;
      } else {
        currentFolder = t.path;
      }
    } catch (e) {
      currentFolder = null;
    }
  }

  function folderBtnClass(path: string | null, isSelected: boolean): string {
    const base = 'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs transition-colors';
    if (isSelected) {
      return `${base} bg-quiet-active text-quiet-text font-medium`;
    }
    return `${base} text-quiet-muted hover:bg-quiet-hover hover:text-quiet-text`;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeDialog();
    }
  }

  function closeDialog() {
    moveTarget.set(null);
  }

  function isFolderDisabled(folderPath: string | null): boolean {
    if (!target) return false;
    if (target.type === 'folder' && folderPath !== null) {
      const cleanTarget = target.path.replace(/\\/g, '/').replace(/\/+$/, '');
      const cleanFolder = folderPath.replace(/\\/g, '/').replace(/\/+$/, '');
      if (cleanTarget === cleanFolder) return true;
      if (cleanFolder.startsWith(cleanTarget + '/')) return true;
    }
    if (target.type === 'note' && currentFolder !== null && folderPath === currentFolder) return true;
    return false;
  }

  function getFolderLabel(folderPath: string | null): string {
    if (folderPath === null) return 'All Notes (root)';
    const parts = folderPath.split('/');
    return parts[parts.length - 1];
  }

  async function handleMove() {
    if (!target || selectedDest === undefined || moving) return;
    moving = true;
    try {
      if (target.type === 'note') {
        const dest = selectedDest === null ? '' : selectedDest;
        const result = await moveNote(target.path, dest);
        if (result !== null) {
          closeDialog();
        }
      } else if (target.type === 'folder') {
        const dest = selectedDest === null ? '' : selectedDest;
        await moveFolder(target.path, dest);
        closeDialog();
      }
    } catch (e) {
      showError(`Failed to move ${target.type}: ${e}`);
    } finally {
      moving = false;
    }
  }
</script>

{#if open && target}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
    role="dialog"
    aria-modal="true"
    aria-label="Move {target.type}"
    onclick={(e) => { if (e.target === e.currentTarget) closeDialog(); }}
    onkeydown={handleKeydown}
    tabindex="0"
  >
    <div
      class="mx-4 flex w-[360px] max-w-full flex-col rounded-xl border border-quiet-border bg-[var(--q-bg)] shadow-xl"
      style="max-height: 70vh;"
    >
      <div class="flex items-center justify-between border-b border-quiet-border/60 px-5 py-3">
        <h3 class="text-sm font-semibold text-quiet-text">
          Move "{target.name}"
        </h3>
        <button
          class="rounded-md p-1 text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text"
          onclick={closeDialog}
          aria-label="Close"
        >
          <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-3 py-3">
        <p class="mb-2 px-2 text-[10px] font-medium uppercase tracking-wider text-quiet-faded">Destination</p>
        <div class="space-y-px">
          <button
            class={folderBtnClass(null, selectedDest === null)}
            onclick={() => (selectedDest = null)}
            disabled={isFolderDisabled(null)}
          >
            <svg class="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h2.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12H13.5A1.5 1.5 0 0 1 15 4v9.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5V2.5Z"/>
            </svg>
            All Notes (root)
          </button>
          {#each $folders as folder}
            {@const disabled = isFolderDisabled(folder.path)}
            <button
              class={folderBtnClass(folder.path, selectedDest === folder.path)}
              onclick={() => { if (!disabled) selectedDest = folder.path; }}
              disabled={disabled}
              style={disabled ? 'opacity: 0.4; cursor: not-allowed;' : ''}
            >
              <svg class="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path d="M.5 3.5a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.672a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-7.5Z"/>
              </svg>
              {folder.name}
            </button>
          {/each}
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 border-t border-quiet-border/60 px-5 py-3">
        <button
          class="rounded-md px-3.5 py-1.5 text-xs font-medium text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text"
          onclick={closeDialog}
        >
          Cancel
        </button>
        <button
          class="rounded-md bg-quiet-accent px-3.5 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          onclick={handleMove}
          disabled={selectedDest === null || moving}
        >
          {moving ? 'Moving...' : 'Move'}
        </button>
      </div>
    </div>
  </div>
{/if}