<script lang="ts">
  import { onMount } from 'svelte';
  import { tick } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { selectedFolder } from '$lib/stores/folders';
  import { searchQuery, searchResultCount, searchResults, searchScope } from '$lib/stores/ui';
  import { notes, currentNote, loadNote, deleteNote, type NoteEntry } from '$lib/stores/notes';
  import { showError } from '$lib/stores/errors';
  import { runAfterModalDismiss, waitForNextPaint } from '$lib/utils/confirmedAction';
  import { buildRenamedNotePath, resolveRenameRequest } from '$lib/utils/noteRename';
  import { moveTarget } from '$lib/stores/move';
  import ConfirmModal from './ConfirmModal.svelte';

  let noteEntries = $state<NoteEntry[]>([]);
  let requestId = 0;
  let renamingPath = $state<string | null>(null);
  let renameValue = $state('');
  let renameInput = $state<HTMLInputElement | undefined>();
  let renamePending = $state(false);
  let confirmDelete = $state<{ path: string; name: string } | null>(null);
  let notesDir = $state('');
  let notesDirResolved = $state(false);

  onMount(() => {
    void resolveNotesDir();
  });

  $effect(() => {
    $selectedFolder;
    $notes;
    $searchQuery;
    $searchScope;
    loadNoteList();
  });

  $effect(() => {
    if (renamingPath && renameInput) {
      renameInput.focus();
      renameInput.select();
    }
  });

  async function loadNoteList() {
    const currentRequest = ++requestId;
    try {
      const query = $searchQuery;
      if (query) {
        const entries = await invoke<NoteEntry[]>('search_notes', { query, scope: $searchScope, scope_path: $selectedFolder });
        if (currentRequest !== requestId) return;
        noteEntries = entries;
        searchResultCount.set(entries.length);
        searchResults.set(entries);
      } else {
        if (!notesDir && !notesDirResolved) {
          await resolveNotesDir();
          if (currentRequest !== requestId) return;
        }
        const entries = getLocalFolderEntries();
        if (currentRequest !== requestId) return;
        noteEntries = entries;
        searchResultCount.set(0);
        searchResults.set([]);
      }
    } catch (e) {
      showError(`Failed to load notes: ${e}`);
    }
  }

  async function resolveNotesDir() {
    try {
      const dir = await invoke<string>('get_notes_dir');
      notesDir = normalizePath(dir).replace(/\/+$/, '');
      notesDirResolved = true;
    } catch (e) {
      notesDirResolved = true;
      showError(`Failed to resolve notes directory: ${e}`);
    }
  }

  function normalizePath(path: string): string {
    return path.replace(/\\/g, '/').toLowerCase();
  }

  function getLocalFolderEntries(): NoteEntry[] {
    const folder = normalizePath($selectedFolder ?? '').replace(/^\/+|\/+$/g, '');

    const entries = $notes.filter((entry) => {
      const notePath = normalizePath(entry.path);
      if (notesDir && notePath.startsWith(`${notesDir}/`)) {
        const relative = notePath.slice(notesDir.length + 1);
        const slashIndex = relative.lastIndexOf('/');
        const parent = slashIndex === -1 ? '' : relative.slice(0, slashIndex);
        return parent === folder;
      }
      return false;
    });

    return [...entries].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }

  async function openNote(path: string) {
    renamingPath = null;
    await loadNote(path);
  }

  function handleDeleteSidebar(entry: NoteEntry) {
    confirmDelete = { path: entry.path, name: entry.name };
  }

  function confirmDeleteNote() {
    if (!confirmDelete) return;
    const { path } = confirmDelete;
    void runAfterModalDismiss({
      close: () => {
        confirmDelete = null;
      },
      waitForDismissal: async () => {
        await tick();
        await waitForNextPaint();
      },
      action: async () => {
        await deleteNote(path);
      },
    });
  }

  function noteBtnClass(isActive: boolean): string {
    const base = 'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs transition-colors';
    if (isActive) {
      return `${base} bg-quiet-sidebar-item-active text-quiet-text font-medium`;
    }
    return `${base} text-quiet-muted hover:bg-quiet-sidebar-item-hover hover:text-quiet-text`;
  }

  function startRename(path: string, currentName: string, e: Event) {
    e.stopPropagation();
    renamingPath = path;
    renameValue = currentName;
  }

  async function handleRename(oldPath: string) {
    const currentName = noteEntries.find(n => n.path === oldPath)?.name;
    if (!currentName) {
      renamingPath = null;
      return;
    }

    const cleanName = resolveRenameRequest({
      currentName,
      requestedName: renameValue,
      isSubmitting: renamePending,
    });
    if (!cleanName) {
      if (!renamePending) {
        renamingPath = null;
      }
      return;
    }

    const newPath = buildRenamedNotePath(oldPath, cleanName);
    renamePending = true;
    try {
      await invoke('rename_note', { oldPath, newName: cleanName });
      noteEntries = noteEntries.map(n => n.path === oldPath ? { ...n, name: cleanName, path: newPath } : n);
      notes.update(ns => ns.map(n => n.path === oldPath ? { ...n, name: cleanName, path: newPath } : n));
      currentNote.update(n => n && n.path === oldPath ? { ...n, name: cleanName, path: newPath } : n);
    } catch (e) {
      showError(`Failed to rename note: ${e}`);
    } finally {
      renamePending = false;
      renamingPath = null;
    }
  }

  function handleRenameKeydown(event: KeyboardEvent, oldPath: string) {
    if (event.key === 'Enter') {
      handleRename(oldPath);
    } else if (event.key === 'Escape') {
      renamingPath = null;
    }
  }
</script>

{#if noteEntries.length === 0}
  <div class="px-3 py-2 text-xs text-quiet-faded">No notes</div>
{:else}
  <div class="space-y-px">
    {#each noteEntries as entry (entry.path)}
      <div class="group relative flex items-center">
        {#if renamingPath === entry.path}
          <input
            bind:this={renameInput}
            type="text"
            bind:value={renameValue}
            onkeydown={(e) => handleRenameKeydown(e, entry.path)}
            onblur={() => handleRename(entry.path)}
            class="w-full rounded-md border border-quiet-border bg-quiet-surface px-2.5 py-1.5 text-xs text-quiet-text outline-none transition-colors focus:border-quiet-accent/50"
          />
        {:else}
          <button
            class={noteBtnClass($currentNote?.path === entry.path)}
            onclick={() => openNote(entry.path)}
          >
            <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 1.75C2 .784 2.784 0 3.75 0h5.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 12.25 16h-8.5A1.75 1.75 0 0 1 2 14.25V1.75Z"/>
            </svg>
            <span class="truncate pr-14">{entry.name}</span>
          </button>
          <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 transition-all group-hover:opacity-100">
            <button
              class="rounded p-1 text-quiet-faded hover:bg-quiet-hover hover:text-quiet-text"
              onclick={(e) => startRename(entry.path, entry.name, e)}
              title="Rename note"
            >
              <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25a1.75 1.75 0 0 1 .445-.758l8.61-8.61Z"/>
              </svg>
            </button>
            <button
              class="rounded p-1 text-quiet-faded hover:bg-quiet-hover hover:text-quiet-text"
              onclick={(e) => { e.stopPropagation(); moveTarget.set({ type: 'note', path: entry.path, name: entry.name }); }}
              title="Move note"
            >
              <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 3h7a2 2 0 0 1 2 2v1M4 3l2-2M4 3l2 2M13 10v1a2 2 0 0 1-2 2H4M13 10l2 2M13 10l-2 2M1 8h7"/>
              </svg>
            </button>
            <button
              class="rounded p-1 text-quiet-faded hover:bg-quiet-hover hover:text-quiet-danger"
              onclick={(e) => { e.stopPropagation(); handleDeleteSidebar(entry); }}
              title="Delete note"
            >
              <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <path d="M3 4h10M5 4v10a1 1 0 001 1h4a1 1 0 001-1V4M6.5 4V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5V4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<ConfirmModal
  open={confirmDelete !== null}
  title="Delete note"
  message={confirmDelete ? `Delete "${confirmDelete.name}"?` : ''}
  confirmLabel="Delete"
  onconfirm={confirmDeleteNote}
  oncancel={() => (confirmDelete = null)}
/>
