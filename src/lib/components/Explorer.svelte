<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { folders, selectedFolder, createFolder, deleteFolder, renameFolder } from '$lib/stores/folders';
  import type { FolderEntry } from '$lib/stores/folders';
  import { notes, currentNote, loadNote, deleteNote } from '$lib/stores/notes';
  import type { NoteEntry } from '$lib/stores/notes';
  import { searchQuery, searchScope, searchResultCount, showNewNoteInput, showNewFolderInput } from '$lib/stores/ui';
  import type { SearchScope } from '$lib/stores/ui';
  import { showError } from '$lib/stores/errors';
  import { runAfterModalDismiss, waitForNextPaint } from '$lib/utils/confirmedAction';
  import { resolveRenameRequest, buildRenamedNotePath } from '$lib/utils/noteRename';
  import { resolveFolderRenameRequest } from '$lib/utils/renameFolder';
  import { buildExplorerTree, notesDirNeedsRefresh, getNoteRelativeFolder } from '$lib/utils/explorerTree';
  import type { ExplorerNode, ExplorerFolderNode, ExplorerNoteNode } from '$lib/types/explorer';
  import { moveTarget } from '$lib/stores/move';
  import ConfirmModal from './ConfirmModal.svelte';

  let notesDir = $state('');
  let notesDirResolved = $state(false);
  let tree = $state<ExplorerNode[]>([]);
  let expandedPaths = $state<Set<string>>(new Set());

  let activeMenu = $state<string | null>(null);
  let searchResults = $state<NoteEntry[]>([]);
  let searchRequestId = 0;

  let renamingNotePath = $state<string | null>(null);
  let renameNoteValue = $state('');
  let renameNoteInput = $state<HTMLInputElement | undefined>();
  let renameNotePending = $state(false);

  let renamingFolderPath = $state<string | null>(null);
  let renamingFolderOrigName = $state('');
  let renameFolderValue = $state('');
  let renameFolderInput = $state<HTMLInputElement | undefined>();

  let confirmDeleteNote = $state<{ path: string; name: string } | null>(null);
  let confirmDeleteFolder = $state<{ path: string; name: string } | null>(null);

  let newNoteName = $state('');
  let newNoteInput = $state<HTMLInputElement | undefined>();
  let newFolderName = $state('');
  let newFolderInput = $state<HTMLInputElement | undefined>();

  async function resolveNotesDir() {
    try {
      const dir = await invoke<string>('get_notes_dir');
      notesDir = dir.replace(/\\/g, '/').replace(/\/+$/, '');
      notesDirResolved = true;
    } catch (e) {
      notesDirResolved = true;
      showError(`Failed to resolve notes directory: ${e}`);
    }
  }

  onMount(() => {
    void resolveNotesDir();
    const closeMenu = () => { activeMenu = null; };
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  });

  $effect(() => {
    $notes;
    if (notesDir && $notes.length > 0 && notesDirNeedsRefresh(notesDir, $notes)) {
      resolveNotesDir();
      return;
    }
    tree = buildExplorerTree($folders, $notes, notesDir);
  });

  $effect(() => {
    if ($showNewNoteInput && newNoteInput) {
      newNoteInput.focus();
    }
  });

  $effect(() => {
    if ($showNewFolderInput && newFolderInput) {
      newFolderInput.focus();
    }
  });

  $effect(() => {
    if (renamingNotePath && renameNoteInput) {
      renameNoteInput.focus();
      renameNoteInput.select();
    }
  });

  $effect(() => {
    if (renamingFolderPath && renameFolderInput) {
      renameFolderInput.focus();
      renameFolderInput.select();
    }
  });

  $effect(() => {
    const q = $searchQuery;
    if (!q) {
      searchRequestId++;
      searchResults = [];
      searchResultCount.set(0);
      return;
    }
    const id = ++searchRequestId;
    const scope = $searchScope;
    let scopePath: string | undefined;
    if (scope === 'current-note') scopePath = $currentNote?.path;
    else if (scope === 'current-folder') scopePath = $selectedFolder ?? undefined;
    void (async () => {
      try {
        const entries = await invoke<NoteEntry[]>('search_notes', { query: q, scope, scopePath });
        if (id !== searchRequestId) return;
        searchResults = entries;
        searchResultCount.set(entries.length);
      } catch (e) {
        if (id !== searchRequestId) return;
        searchResults = [];
        searchResultCount.set(0);
      }
    })();
  });

  function toggleExpand(path: string) {
    const next = new Set(expandedPaths);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    expandedPaths = next;
  }

  function expandAncestors(folderPath: string) {
    const parts = folderPath.split('/');
    const next = new Set(expandedPaths);
    let acc = '';
    for (const part of parts) {
      acc = acc ? `${acc}/${part}` : part;
      next.add(acc);
    }
    expandedPaths = next;
  }

  function selectFolder(path: string | null) {
    selectedFolder.set(path);
  }

  function handleFolderClick(path: string) {
    if (renamingFolderPath) return;
    selectFolder(path);
    toggleExpand(path);
  }

  async function openNote(path: string, folderPath: string | null) {
    renamingNotePath = null;
    if (folderPath) {
      selectFolder(folderPath);
      expandAncestors(folderPath);
    } else {
      selectFolder(null);
    }
    await loadNote(path);
  }

  async function openSearchResult(notePath: string) {
    const folderPath = getNoteRelativeFolder(notePath, notesDir);
    searchQuery.set('');
    searchScope.set('all');
    if (folderPath) {
      selectedFolder.set(folderPath);
      expandAncestors(folderPath);
    } else {
      selectedFolder.set(null);
    }
    await loadNote(notePath);
  }

  async function handleCreateNote() {
    const name = newNoteName.trim();
    if (!name) return;
    const folder = $selectedFolder ?? '';
    const { createNote } = await import('$lib/stores/notes');
    await createNote(name, folder);
    newNoteName = '';
    showNewNoteInput.set(false);
    if ($selectedFolder) {
      const next = new Set(expandedPaths);
      next.add($selectedFolder);
      expandedPaths = next;
    }
  }

  async function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    const parentPath = $selectedFolder ?? undefined;
    await createFolder(name, parentPath);
    newFolderName = '';
    showNewFolderInput.set(false);
    if (parentPath) {
      const next = new Set(expandedPaths);
      next.add(parentPath);
      expandedPaths = next;
    }
  }

  function handleNoteKeydown(event: KeyboardEvent, handler: () => void) {
    if (event.key === 'Enter') {
      handler();
    } else if (event.key === 'Escape') {
      renamingNotePath = null;
      renameNoteValue = '';
    }
  }

  function handleFolderKeydown(event: KeyboardEvent, handler: () => void) {
    if (event.key === 'Enter') {
      handler();
    } else if (event.key === 'Escape') {
      renamingFolderPath = null;
      renameFolderValue = '';
    }
  }

  function startRenameNote(path: string, currentName: string, e: Event) {
    e.stopPropagation();
    renamingNotePath = path;
    renameNoteValue = currentName;
  }

  async function handleRenameNote(oldPath: string) {
    const currentName = renameNoteValue;
    const cleanName = resolveRenameRequest({
      currentName: currentName,
      requestedName: renameNoteValue,
      isSubmitting: renameNotePending,
    });
    if (!cleanName) {
      if (!renameNotePending) renamingNotePath = null;
      return;
    }
    const newPath = buildRenamedNotePath(oldPath, cleanName);
    renameNotePending = true;
    try {
      await invoke('rename_note', { oldPath, newName: cleanName });
      notes.update(ns => ns.map(n => n.path === oldPath ? { ...n, name: cleanName, path: newPath } : n));
      currentNote.update(n => n && n.path === oldPath ? { ...n, name: cleanName, path: newPath } : n);
    } catch (e) {
      showError(`Failed to rename note: ${e}`);
    } finally {
      renameNotePending = false;
      renamingNotePath = null;
    }
  }

  function startRenameFolder(path: string, currentName: string, e: Event) {
    e.stopPropagation();
    renamingFolderPath = path;
    renamingFolderOrigName = currentName;
    renameFolderValue = currentName;
  }

  async function handleRenameFolder(oldPath: string) {
    const cleanName = resolveFolderRenameRequest({
      currentName: renamingFolderOrigName,
      requestedName: renameFolderValue,
      isSubmitting: false,
    });
    if (!cleanName) {
      renamingFolderPath = null;
      return;
    }
    renamingFolderPath = null;
    await renameFolder(oldPath, cleanName);
  }

  function confirmDeleteNoteAction(path: string, name: string) {
    confirmDeleteNote = { path, name };
  }

  function confirmDeleteFolderAction(path: string, name: string) {
    confirmDeleteFolder = { path, name };
  }

  function executeDeleteNote() {
    if (!confirmDeleteNote) return;
    const { path } = confirmDeleteNote;
    void runAfterModalDismiss({
      close: () => { confirmDeleteNote = null; },
      waitForDismissal: async () => { await tick(); await waitForNextPaint(); },
      action: async () => { await deleteNote(path); },
    });
  }

  function executeDeleteFolder() {
    if (!confirmDeleteFolder) return;
    const { path } = confirmDeleteFolder;
    void runAfterModalDismiss({
      close: () => { confirmDeleteFolder = null; },
      waitForDismissal: async () => { await tick(); await waitForNextPaint(); },
      action: async () => { await deleteFolder(path); },
    });
  }

  function folderBtnClass(path: string | null, isActive: boolean): string {
    const base = 'flex w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-left text-xs transition-colors';
    if (isActive) return `${base} quiet-sidebar-row-active font-medium`;
    return `${base} quiet-sidebar-row`;
  }

  function noteBtnClass(isActive: boolean): string {
    const base = 'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs transition-colors';
    if (isActive) return `${base} quiet-sidebar-row-active font-medium`;
    return `${base} quiet-sidebar-row`;
  }
</script>

<div class="flex flex-col">
  <div class="flex items-center justify-between px-2 pt-3 pb-1">
    <span class="px-1 text-[10px] font-medium uppercase tracking-wider text-quiet-faded">Explorer</span>
    <div class="flex gap-1">
      <button
        class="rounded px-1.5 py-0.5 text-xs text-quiet-faded transition-colors hover:bg-quiet-sidebar-item-hover hover:text-quiet-text"
        onclick={() => { showNewNoteInput.set(true); newNoteName = ''; }}
        title="New note"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M8 3v10M3 8h10"/>
        </svg>
      </button>
      <button
        class="rounded px-1.5 py-0.5 text-xs text-quiet-faded transition-colors hover:bg-quiet-sidebar-item-hover hover:text-quiet-text"
        onclick={() => { showNewFolderInput.set(true); newFolderName = ''; }}
        title="New folder"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 4.5A1.5 1.5 0 013.5 3h2.88a1.5 1.5 0 011.06.44l1.12 1.12a1.5 1.5 0 001.06.44h2.88A1.5 1.5 0 0114 6.5V11a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 11V4.5Z"/>
          <path d="M8 7.5v4M6 9.5h4"/>
        </svg>
      </button>
    </div>
  </div>

  {#if $showNewNoteInput}
    <div class="px-3 pb-2">
      <input
        bind:this={newNoteInput}
        type="text"
        placeholder="Note name..."
        bind:value={newNoteName}
        onkeydown={(e) => handleNoteKeydown(e, handleCreateNote)}
        class="w-full rounded-md border border-quiet-border bg-quiet-surface px-2.5 py-1.5 text-xs text-quiet-text placeholder-quiet-faded outline-none transition-colors focus:border-quiet-accent/50"
      />
    </div>
  {/if}

  {#if $showNewFolderInput}
    <div class="px-3 pb-2">
      <input
        bind:this={newFolderInput}
        type="text"
        placeholder="Folder name..."
        bind:value={newFolderName}
        onkeydown={(e) => handleFolderKeydown(e, handleCreateFolder)}
        class="w-full rounded-md border border-quiet-border bg-quiet-surface px-2.5 py-1.5 text-xs text-quiet-text placeholder-quiet-faded outline-none transition-colors focus:border-quiet-accent/50"
      />
    </div>
  {/if}

  {#if $searchQuery}
    <div class="space-y-px px-3 pb-2" aria-live="polite" aria-atomic="true">
      {#if searchResults.length === 0}
        <div class="py-2 text-xs text-quiet-faded">No notes found</div>
      {:else}
        {#each searchResults as entry (entry.path)}
          <div class="group relative flex items-center">
            <button
              role="treeitem"
              aria-selected={$currentNote?.path === entry.path}
              class={noteBtnClass($currentNote?.path === entry.path)}
              onclick={() => openSearchResult(entry.path)}
            >
              <span class="quiet-sidebar-icon quiet-sidebar-icon-note"></span>
              <span class="truncate">{entry.name}</span>
            </button>
            <div class="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-all group-hover:opacity-100">
              {#if activeMenu === entry.path}
                <div class="flex items-center gap-0.5">
                  <button
                    class="rounded p-1 text-quiet-faded hover:bg-quiet-sidebar-item-hover hover:text-quiet-text"
                    onclick={(e) => startRenameNote(entry.path, entry.name, e)}
                    title="Rename note"
                  >
                    <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25a1.75 1.75 0 0 1 .445-.758l8.61-8.61Z"/>
                    </svg>
                  </button>
                  <button
                    class="rounded p-1 text-quiet-faded hover:bg-quiet-sidebar-item-hover hover:text-quiet-text"
                    onclick={(e) => { e.stopPropagation(); moveTarget.set({ type: 'note', path: entry.path, name: entry.name }); }}
                    title="Move note"
                  >
                    <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M4 3h7a2 2 0 0 1 2 2v1M4 3l2-2M4 3l2 2M13 10v1a2 2 0 0 1-2 2H4M13 10l2 2M13 10l-2 2M1 8h7"/>
                    </svg>
                  </button>
                  <button
                    class="rounded p-1 text-quiet-faded hover:bg-quiet-sidebar-item-hover hover:text-quiet-danger"
                    onclick={(e) => { e.stopPropagation(); confirmDeleteNoteAction(entry.path, entry.name); }}
                    title="Delete note"
                  >
                    <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                      <path d="M3 4h10M5 4v10a1 1 0 001 1h4a1 1 0 001-1V4M6.5 4V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5V4" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
              {:else}
                <button
                  class="rounded px-1.5 py-0.5 text-xs text-quiet-faded hover:bg-quiet-sidebar-item-hover hover:text-quiet-text"
                  onclick={(e) => { e.stopPropagation(); activeMenu = entry.path; }}
                  title="Actions"
                >⋯</button>
              {/if}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {:else}
    {#if !notesDirResolved}
      <div class="px-3 py-2 text-xs text-quiet-faded"></div>
    {:else if tree.length === 0}
      <div class="px-3 py-2 text-xs text-quiet-faded">No notes or folders yet</div>
    {:else}
      <div class="space-y-px px-3 pb-2" role="tree" aria-label="Notes and folders">
        <button
          class={folderBtnClass(null, $selectedFolder === null)}
          role="treeitem"
          aria-selected={$selectedFolder === null}
          onclick={() => selectFolder(null)}
        >
          <span class="quiet-sidebar-icon"></span>
          All Notes
        </button>

        {#snippet noteItem(node: ExplorerNoteNode, depth: number)}
          <div class="group relative flex items-center">
            {#if renamingNotePath === node.path}
              <input
                bind:this={renameNoteInput}
                type="text"
                bind:value={renameNoteValue}
                onkeydown={(e) => handleNoteKeydown(e, () => handleRenameNote(node.path))}
                onblur={() => handleRenameNote(node.path)}
                onclick={(e) => e.stopPropagation()}
                class="w-full rounded-md border border-quiet-border bg-quiet-surface px-2.5 py-1.5 text-xs text-quiet-text outline-none transition-colors focus:border-quiet-accent/50"
                style="margin-left: {12 + depth * 12}px"
              />
            {:else}
              <button
                role="treeitem"
                aria-selected={$currentNote?.path === node.path}
                class={noteBtnClass($currentNote?.path === node.path)}
                style="padding-left: {12 + depth * 12}px"
                onclick={() => openNote(node.path, node.folderPath)}
              >
                <span class="quiet-sidebar-icon quiet-sidebar-icon-note"></span>
                <span class="truncate">{node.name}</span>
              </button>
              <div class="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-all group-hover:opacity-100">
                {#if activeMenu === node.path}
                  <div class="flex items-center gap-0.5">
                    <button
                      class="rounded p-1 text-quiet-faded hover:bg-quiet-sidebar-item-hover hover:text-quiet-text"
                      onclick={(e) => startRenameNote(node.path, node.name, e)}
                      title="Rename note"
                    >
                      <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25a1.75 1.75 0 0 1 .445-.758l8.61-8.61Z"/>
                      </svg>
                    </button>
                    <button
                      class="rounded p-1 text-quiet-faded hover:bg-quiet-sidebar-item-hover hover:text-quiet-text"
                      onclick={(e) => { e.stopPropagation(); moveTarget.set({ type: 'note', path: node.path, name: node.name }); }}
                      title="Move note"
                    >
                      <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 3h7a2 2 0 0 1 2 2v1M4 3l2-2M4 3l2 2M13 10v1a2 2 0 0 1-2 2H4M13 10l2 2M13 10l-2 2M1 8h7"/>
                      </svg>
                    </button>
                    <button
                      class="rounded p-1 text-quiet-faded hover:bg-quiet-sidebar-item-hover hover:text-quiet-danger"
                      onclick={(e) => { e.stopPropagation(); confirmDeleteNoteAction(node.path, node.name); }}
                      title="Delete note"
                    >
                      <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                        <path d="M3 4h10M5 4v10a1 1 0 001 1h4a1 1 0 001-1V4M6.5 4V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5V4" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                  </div>
                {:else}
                  <button
                    class="rounded px-1.5 py-0.5 text-xs text-quiet-faded hover:bg-quiet-sidebar-item-hover hover:text-quiet-text"
                    onclick={(e) => { e.stopPropagation(); activeMenu = node.path; }}
                    title="Actions"
                  >⋯</button>
                {/if}
              </div>
            {/if}
          </div>
        {/snippet}

        {#snippet folderNode(node: ExplorerFolderNode, depth: number)}
          <div class="group relative flex items-center">
            <button
              role="treeitem"
              aria-selected={$selectedFolder === node.path}
              class={folderBtnClass(node.path, $selectedFolder === node.path)}
              style="padding-left: {12 + depth * 12}px"
              onclick={() => handleFolderClick(node.path)}
            >
              {#if node.children.length > 0}
                <span
                  class="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center transition-transform {expandedPaths.has(node.path) ? 'rotate-90' : ''}"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" class="h-3 w-3">
                    <path d="M6 4l4 4-4 4" />
                  </svg>
                </span>
              {:else}
                <span class="inline-flex w-3.5 shrink-0"></span>
              {/if}
              <span class="quiet-sidebar-icon"></span>
              {#if renamingFolderPath === node.path}
                <input
                  bind:this={renameFolderInput}
                  type="text"
                  bind:value={renameFolderValue}
                  onkeydown={(e) => handleFolderKeydown(e, () => handleRenameFolder(node.path))}
                  onblur={() => handleRenameFolder(node.path)}
                  onclick={(e) => e.stopPropagation()}
                  class="min-w-0 flex-1 rounded border border-quiet-border bg-quiet-surface px-1.5 py-0.5 text-xs text-quiet-text outline-none transition-colors focus:border-quiet-accent/50"
                />
              {:else}
                <span class="truncate pr-14">{node.name}</span>
              {/if}
            </button>
            {#if renamingFolderPath !== node.path}
              <div class="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-all group-hover:opacity-100">
                {#if activeMenu === node.path}
                  <div class="flex items-center gap-0.5">
                    <button
                      class="rounded p-1 text-quiet-faded hover:bg-quiet-sidebar-item-hover hover:text-quiet-text"
                      onclick={(e) => startRenameFolder(node.path, node.name, e)}
                      title="Rename folder"
                    >
                      <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25a1.75 1.75 0 0 1 .445-.758l8.61-8.61Z"/>
                      </svg>
                    </button>
                    <button
                      class="rounded p-1 text-quiet-faded hover:bg-quiet-sidebar-item-hover hover:text-quiet-text"
                      onclick={(e) => { e.stopPropagation(); moveTarget.set({ type: 'folder', path: node.path, name: node.name }); }}
                      title="Move folder"
                    >
                      <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 3h7a2 2 0 0 1 2 2v1M4 3l2-2M4 3l2 2M13 10v1a2 2 0 0 1-2 2H4M13 10l2 2M13 10l-2 2M1 8h7"/>
                      </svg>
                    </button>
                    <button
                      class="rounded p-1 text-quiet-faded hover:bg-quiet-sidebar-item-hover hover:text-quiet-danger"
                      onclick={(e) => { e.stopPropagation(); confirmDeleteFolderAction(node.path, node.name); }}
                      title="Delete folder"
                    >
                      <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                        <path d="M3 4h10M5 4v10a1 1 0 001 1h4a1 1 0 001-1V4M6.5 4V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5V4" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                  </div>
                {:else}
                  <button
                    class="rounded px-1.5 py-0.5 text-xs text-quiet-faded hover:bg-quiet-sidebar-item-hover hover:text-quiet-text"
                    onclick={(e) => { e.stopPropagation(); activeMenu = node.path; }}
                    title="Actions"
                  >⋯</button>
                {/if}
              </div>
            {/if}
          </div>
          {#if expandedPaths.has(node.path) && node.children.length > 0}
            {#each node.children as child}
              {#if child.type === 'folder'}
                {@render folderNode(child, depth + 1)}
              {:else}
                {@render noteItem(child, depth + 1)}
              {/if}
            {/each}
          {/if}
        {/snippet}

        {#each tree as node}
          {#if node.type === 'folder'}
            {@render folderNode(node, 0)}
          {:else}
            {@render noteItem(node, 0)}
          {/if}
        {/each}
      </div>
    {/if}
  {/if}
</div>

<ConfirmModal
  open={confirmDeleteNote !== null}
  title="Delete note"
  message={confirmDeleteNote ? `Delete "${confirmDeleteNote.name}"?` : ''}
  confirmLabel="Delete"
  onconfirm={executeDeleteNote}
  oncancel={() => (confirmDeleteNote = null)}
/>

<ConfirmModal
  open={confirmDeleteFolder !== null}
  title="Delete folder"
  message={confirmDeleteFolder ? `Delete "${confirmDeleteFolder.name}" and all its notes?` : ''}
  confirmLabel="Delete"
  onconfirm={executeDeleteFolder}
  oncancel={() => (confirmDeleteFolder = null)}
/>
