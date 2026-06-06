<script lang="ts">
  import { tick } from 'svelte';
  import { folders, selectedFolder, createFolder, deleteFolder, renameFolder } from '$lib/stores/folders';
  import type { FolderEntry } from '$lib/stores/folders';
  import { runAfterModalDismiss, waitForNextPaint } from '$lib/utils/confirmedAction';
  import { resolveFolderRenameRequest } from '$lib/utils/renameFolder';
  import { moveTarget } from '$lib/stores/move';
  import ConfirmModal from './ConfirmModal.svelte';

  interface TreeNode {
    name: string;
    path: string;
    children: TreeNode[];
  }

  let tree = $state<TreeNode[]>([]);
  let expandedPaths = $state<Set<string>>(new Set());
  let showNewFolderInput = $state(false);
  let newFolderName = $state('');
  let newFolderInput: HTMLInputElement | undefined = $state();
  let confirmDelete = $state<{ path: string; name: string } | null>(null);
  let renameState = $state<{ path: string; originalName: string } | null>(null);
  let renameValue = $state('');
  let renameInput = $state<HTMLInputElement | undefined>();

  $effect(() => {
    if (renameState && renameInput) {
      renameInput.focus();
      renameInput.select();
    }
  });

  $effect(() => {
    const list = $folders;
    tree = buildTree(list);
  });

  $effect(() => {
    if (showNewFolderInput && newFolderInput) {
      newFolderInput.focus();
    }
  });

  function buildTree(list: FolderEntry[]): TreeNode[] {
    const roots: TreeNode[] = [];
    const map = new Map<string, TreeNode>();
    const sorted = [...list].sort((a, b) => a.path.length - b.path.length);

    for (const f of sorted) {
      const node: TreeNode = {
        name: f.name,
        path: f.path,
        children: [],
      };
      map.set(f.path, node);

      const parentPath = getParentPath(f.path);
      if (parentPath && map.has(parentPath)) {
        map.get(parentPath)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  function getParentPath(path: string): string | null {
    const parts = path.replace(/\\/g, '/').split('/');
    if (parts.length <= 1) return null;
    return parts.slice(0, -1).join('/');
  }

  function toggleExpand(path: string) {
    const next = new Set(expandedPaths);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    expandedPaths = next;
  }

  function selectFolder(path: string | null) {
    selectedFolder.set(path);
  }

  function folderBtnClass(path: string | null, isActive: boolean): string {
    const base = 'flex w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-left text-xs transition-colors';
    if (isActive) {
      return `${base} bg-quiet-sidebar-item-active text-quiet-text font-medium`;
    }
    return `${base} text-quiet-muted hover:bg-quiet-sidebar-item-hover hover:text-quiet-text`;
  }

  async function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    const parentPath = $selectedFolder ?? undefined;
    await createFolder(name, parentPath);
    newFolderName = '';
    showNewFolderInput = false;
    if (parentPath) {
      const next = new Set(expandedPaths);
      next.add(parentPath);
      expandedPaths = next;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleCreateFolder();
    } else if (event.key === 'Escape') {
      showNewFolderInput = false;
      newFolderName = '';
    }
  }

  function handleDeleteFolder(e: MouseEvent, entry: { path: string; name: string }) {
    e.stopPropagation();
    renameState = null;
    confirmDelete = { path: entry.path, name: entry.name };
  }

  function startRename(path: string, currentName: string, e: Event) {
    e.stopPropagation();
    renameState = { path, originalName: currentName };
    renameValue = currentName;
  }

  async function handleRename(oldPath: string) {
    if (!renameState) return;
    const cleanName = resolveFolderRenameRequest({
      currentName: renameState.originalName,
      requestedName: renameValue,
      isSubmitting: false,
    });
    if (!cleanName) {
      renameState = null;
      return;
    }
    const path = renameState.path;
    renameState = null;
    await renameFolder(path, cleanName);
  }

  function handleRenameKeydown(event: KeyboardEvent, oldPath: string) {
    if (event.key === 'Enter') {
      handleRename(oldPath);
    } else if (event.key === 'Escape') {
      renameState = null;
    }
  }

  function confirmDeleteFolder() {
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
        await deleteFolder(path);
      },
    });
  }

</script>

<div class="flex items-center justify-between px-2 pt-3 pb-1">
  <span class="px-1 text-[10px] font-medium uppercase tracking-wider text-quiet-faded">Folders</span>
  <button
    class="rounded px-1.5 py-0.5 text-xs text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text"
    onclick={() => { showNewFolderInput = true; newFolderName = ''; }}
  >+</button>
</div>

{#if showNewFolderInput}
  <div class="px-3 pb-2">
    <input
      bind:this={newFolderInput}
      type="text"
      placeholder="Folder name..."
      bind:value={newFolderName}
      onkeydown={handleKeydown}
      class="w-full rounded-md border border-quiet-border bg-quiet-surface px-2.5 py-1.5 text-xs text-quiet-text placeholder-quiet-faded outline-none transition-colors focus:border-quiet-accent/50"
    />
  </div>
{/if}

{#snippet treeNode(node: TreeNode, depth: number = 0)}
  <div class="group relative flex items-center">
    <button
      class={folderBtnClass(node.path, $selectedFolder === node.path)}
      style="padding-left: {12 + depth * 12}px"
      onclick={() => { if (!renameState) selectFolder(node.path); }}
    >
      {#if node.children.length > 0}
        <span
          class="inline-flex h-3.5 w-3.5 shrink-0 cursor-pointer items-center justify-center transition-transform {expandedPaths.has(node.path) ? 'rotate-90' : ''}"
          onclick={(e) => { e.stopPropagation(); toggleExpand(node.path); }}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); toggleExpand(node.path); } }}
          role="button"
          tabindex="0"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" class="h-3 w-3">
            <path d="M6 4l4 4-4 4" />
          </svg>
        </span>
      {:else}
        <span class="inline-flex w-3.5 shrink-0"></span>
      {/if}
      <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
        <path d="M.5 3.5a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.672a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-7.5Z"/>
      </svg>
      {#if renameState?.path === node.path}
        <input
          bind:this={renameInput}
          type="text"
          bind:value={renameValue}
          onkeydown={(e) => handleRenameKeydown(e, node.path)}
          onblur={() => handleRename(node.path)}
          onclick={(e) => e.stopPropagation()}
          class="min-w-0 flex-1 rounded border border-quiet-border bg-quiet-surface px-1.5 py-0.5 text-xs text-quiet-text outline-none transition-colors focus:border-quiet-accent/50"
        />
      {:else}
        <span class="truncate pr-14">{node.name}</span>
      {/if}
    </button>
    {#if renameState?.path !== node.path}
      <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 transition-all group-hover:opacity-100">
        <button
          class="rounded p-1 text-quiet-faded hover:bg-quiet-hover hover:text-quiet-text"
          onclick={(e) => startRename(node.path, node.name, e)}
          title="Rename folder"
        >
          <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25a1.75 1.75 0 0 1 .445-.758l8.61-8.61Z"/>
          </svg>
        </button>
        <button
          class="rounded p-1 text-quiet-faded hover:bg-quiet-hover hover:text-quiet-text"
          onclick={(e) => { e.stopPropagation(); moveTarget.set({ type: 'folder', path: node.path, name: node.name }); }}
          title="Move folder"
        >
          <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 3h7a2 2 0 0 1 2 2v1M4 3l2-2M4 3l2 2M13 10v1a2 2 0 0 1-2 2H4M13 10l2 2M13 10l-2 2M1 8h7"/>
          </svg>
        </button>
        <button
          class="rounded p-1 text-quiet-faded hover:bg-quiet-hover hover:text-quiet-danger"
          onclick={(e) => handleDeleteFolder(e, node)}
          title="Delete folder"
        >
          <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M3 4h10M5 4v10a1 1 0 001 1h4a1 1 0 001-1V4M6.5 4V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5V4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    {/if}
  </div>
  {#if expandedPaths.has(node.path) && node.children.length > 0}
    {#each node.children as child}
      {@render treeNode(child, depth + 1)}
    {/each}
  {/if}
{/snippet}

{#if tree.length === 0}
  <div class="px-3 py-2 text-xs text-quiet-faded">No folders</div>
{:else}
  <div class="space-y-px">
    <button
      class={folderBtnClass(null, $selectedFolder === null)}
      onclick={() => selectFolder(null)}
    >
      <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
        <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h2.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12H13.5A1.5 1.5 0 0 1 15 4v9.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5V2.5Z"/>
      </svg>
      All Notes
    </button>
    {#each tree as node}
      {@render treeNode(node)}
    {/each}
  </div>
{/if}

<ConfirmModal
  open={confirmDelete !== null}
  title="Delete folder"
  message={confirmDelete ? `Delete "${confirmDelete.name}" and all its notes?` : ''}
  confirmLabel="Delete"
  onconfirm={confirmDeleteFolder}
  oncancel={() => (confirmDelete = null)}
/>
