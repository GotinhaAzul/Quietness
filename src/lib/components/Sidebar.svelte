<script lang="ts">
  import FolderTree from './FolderTree.svelte';
  import NoteList from './NoteList.svelte';
  import SearchBar from './SearchBar.svelte';
  import { createNote } from '$lib/stores/notes';
  import { selectedFolder } from '$lib/stores/folders';

  let showNewNoteInput = $state(false);
  let newNoteName = $state('');

  async function handleCreateNote() {
    const name = newNoteName.trim();
    if (!name) return;
    const folder = $selectedFolder ?? '';
    await createNote(name, folder);
    newNoteName = '';
    showNewNoteInput = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleCreateNote();
    } else if (event.key === 'Escape') {
      showNewNoteInput = false;
      newNoteName = '';
    }
  }
</script>

<aside class="flex w-64 shrink-0 flex-col border-r border-stone-200/80 bg-white/50">
  <div class="border-b border-stone-200/60 px-4 py-3">
    <h1 class="text-sm font-semibold tracking-tight text-stone-800">Quietness</h1>
    <p class="text-xs text-stone-400">A quiet place to write.</p>
  </div>

  <div class="px-3 pt-3 pb-1">
    <SearchBar />
  </div>

  <div class="overflow-y-auto">
    <div class="px-2 pt-3 pb-1">
      <span class="px-1 text-[10px] font-medium uppercase tracking-wider text-stone-400">Folders</span>
    </div>
    <FolderTree />

    <div class="mt-4 px-2 pt-3 pb-1 flex items-center justify-between border-t border-stone-200/60">
      <span class="px-1 text-[10px] font-medium uppercase tracking-wider text-stone-400">Notes</span>
      <button
        class="rounded px-1.5 py-0.5 text-xs text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
        onclick={() => { showNewNoteInput = true; newNoteName = ''; }}
      >
        + New
      </button>
    </div>

    {#if showNewNoteInput}
      <div class="px-3 pb-2">
        <input
          type="text"
          placeholder="Note name..."
          bind:value={newNoteName}
          onkeydown={handleKeydown}
          class="w-full rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-700 placeholder-stone-400 outline-none transition-colors focus:border-stone-400"
        />
      </div>
    {/if}

    <NoteList />
  </div>
</aside>