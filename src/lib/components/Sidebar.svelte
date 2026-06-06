<script lang="ts">
  import FolderTree from './FolderTree.svelte';
  import NoteList from './NoteList.svelte';
  import SearchBar from './SearchBar.svelte';
  import TrashDialog from './TrashDialog.svelte';
  import { createNote } from '$lib/stores/notes';
  import { selectedFolder } from '$lib/stores/folders';
  import { sidebarCollapsed, showNewNoteInput } from '$lib/stores/ui';
  let newNoteName = $state('');
  let newNoteInput: HTMLInputElement | undefined = $state();
  let showTrash = $state(false);

  $effect(() => {
    if ($showNewNoteInput && newNoteInput) {
      newNoteInput.focus();
    }
  });

  async function handleCreateNote() {
    const name = newNoteName.trim();
    if (!name) return;
    const folder = $selectedFolder ?? '';
    await createNote(name, folder);
    newNoteName = '';
    showNewNoteInput.set(false);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleCreateNote();
    } else if (event.key === 'Escape') {
      showNewNoteInput.set(false);
      newNoteName = '';
    }
  }
</script>

<aside class="flex shrink-0 flex-col border-r border-quiet-border/70 bg-quiet-sidebar-bg transition-all duration-150 ease-out {$sidebarCollapsed ? 'w-10' : 'w-64'}">
  {#if !$sidebarCollapsed}
    <div class="border-b border-quiet-border/60 px-4 py-4">
      <h1 class="text-sm font-semibold tracking-tight text-quiet-text">Quietness</h1>
      <p class="text-xs text-quiet-faded">A quiet place to write.</p>
    </div>

    <div class="px-3 pt-3 pb-1">
      <SearchBar />
    </div>

    <div class="overflow-y-auto">
      <FolderTree />

      <div class="mt-4 px-2 pt-3 pb-1 flex items-center justify-between border-t border-quiet-border/60">
        <span class="px-1 text-[10px] font-medium uppercase tracking-wider text-quiet-faded">Notes</span>
        <button
          class="rounded px-1.5 py-0.5 text-xs text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text"
          onclick={() => { showNewNoteInput.set(true); newNoteName = ''; }}
        >
          + New
        </button>
      </div>

      {#if $showNewNoteInput}
        <div class="px-3 pb-2">
          <input
            bind:this={newNoteInput}
            type="text"
            placeholder="Note name..."
            bind:value={newNoteName}
            onkeydown={handleKeydown}
            class="w-full rounded-md border border-quiet-border bg-quiet-surface px-2.5 py-1.5 text-xs text-quiet-text placeholder-quiet-faded outline-none transition-colors focus:border-quiet-accent/50"
          />
        </div>
      {/if}

      <NoteList />
    </div>
  {/if}

  <div class="mt-auto border-t border-quiet-border/60">
    {#if !$sidebarCollapsed}
      <button
        class="flex w-full items-center gap-2 px-3 py-2 text-xs text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text"
        onclick={() => (showTrash = true)}
      >
        <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2.5 4h11M6.5 1.5h3L10.5 4h-5l1-2.5Z" />
          <path d="M4 4l.7 9.2A1.5 1.5 0 0 0 6.2 14.5h3.6a1.5 1.5 0 0 0 1.5-1.3L12 4" />
          <path d="M7 7v4M9 7v4" />
        </svg>
        Trash
      </button>
    {/if}

    <button
      class="flex w-full items-center justify-center p-2.5 text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text"
      onclick={() => sidebarCollapsed.update(c => !c)}
      title={$sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {#if $sidebarCollapsed}
        <svg class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6.47 4.22a.75.75 0 0 1 1.06 0l3.75 3.75a.75.75 0 0 1 0 1.06l-3.75 3.75a.75.75 0 0 1-1.06-1.06L9.69 8 6.47 4.78a.75.75 0 0 1 0-1.06Z"/>
        </svg>
      {:else}
        <svg class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M9.53 4.22a.75.75 0 0 0-1.06 0L4.72 7.97a.75.75 0 0 0 0 1.06l3.75 3.75a.75.75 0 0 0 1.06-1.06L6.31 8l3.22-3.22a.75.75 0 0 0 0-1.06Z"/>
        </svg>
      {/if}
    </button>
  </div>
</aside>

<TrashDialog open={showTrash} onclose={() => (showTrash = false)} />
