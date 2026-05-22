<script lang="ts">
  import { onMount } from 'svelte';
  import { folders, selectedFolder, loadFolders } from '$lib/stores/folders';
  import type { FolderEntry } from '$lib/stores/folders';

  interface TreeNode {
    name: string;
    path: string;
    children: TreeNode[];
    expanded: boolean;
  }

  let tree = $state<TreeNode[]>([]);
  let expandedPaths = $state<Set<string>>(new Set());

  onMount(() => {
    loadFolders();
  });

  $effect(() => {
    const list = $folders;
    tree = buildTree(list);
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
        expanded: expandedPaths.has(f.path),
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
    if (expandedPaths.has(path)) {
      expandedPaths.delete(path);
    } else {
      expandedPaths.add(path);
    }
    expandedPaths = new Set(expandedPaths);
    tree = buildTree($folders);
  }

  function selectFolder(path: string | null) {
    selectedFolder.set(path);
  }

  function folderBtnClass(path: string | null, isActive: boolean): string {
    const base = 'flex w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-left text-xs transition-colors';
    if (isActive) {
      return `${base} bg-quiet-active text-quiet-text font-medium`;
    }
    return `${base} text-quiet-muted hover:bg-quiet-hover hover:text-quiet-text`;
  }
</script>

{#snippet treeNode(node: TreeNode, depth: number = 0)}
  <div>
    <button
      class={folderBtnClass(node.path, $selectedFolder === node.path)}
      style="padding-left: {12 + depth * 12}px"
      onclick={() => selectFolder(node.path)}
    >
      {#if node.children.length > 0}
        <span
          class="inline-flex h-3.5 w-3.5 shrink-0 cursor-pointer items-center justify-center transition-transform {node.expanded ? 'rotate-90' : ''}"
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
      <span class="truncate">{node.name}</span>
    </button>
    {#if node.expanded && node.children.length > 0}
      {#each node.children as child}
        {@render treeNode(child, depth + 1)}
      {/each}
    {/if}
  </div>
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
