<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { selectedFolder } from '$lib/stores/folders';
  import { searchQuery } from '$lib/stores/ui';
  import { currentNote, loadNote, deleteNote, noteListChanged, type NoteEntry } from '$lib/stores/notes';

  let noteEntries = $state<NoteEntry[]>([]);
  let loading = $state(false);

  onMount(() => {
    loadNoteList();
  });

  $effect(() => {
    $selectedFolder;
    $noteListChanged;
    $searchQuery;
    loadNoteList();
  });

  async function loadNoteList() {
    loading = true;
    try {
      const query = $searchQuery;
      if (query) {
        const entries = await invoke<NoteEntry[]>('search_notes', { query });
        noteEntries = entries;
      } else {
        const folderPath = $selectedFolder ?? '';
        const entries = await invoke<NoteEntry[]>('list_notes_in_folder', { folderPath });
        noteEntries = entries;
      }
    } catch (e) {
      console.error('Failed to load notes:', e);
      noteEntries = [];
    } finally {
      loading = false;
    }
  }

  async function openNote(path: string) {
    await loadNote(path);
  }

  async function handleDeleteSidebar(entry: NoteEntry) {
    if (!confirm(`Delete "${entry.name}"?`)) return;
    await deleteNote(entry.path);
  }

  function noteBtnClass(isActive: boolean): string {
    const base = 'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs transition-colors';
    if (isActive) {
      return `${base} bg-quiet-active text-quiet-text font-medium`;
    }
    return `${base} text-quiet-muted hover:bg-quiet-hover hover:text-quiet-text`;
  }
</script>

{#if loading}
  <div class="px-3 py-2 text-xs text-quiet-faded">Loading...</div>
{:else if noteEntries.length === 0}
  <div class="px-3 py-2 text-xs text-quiet-faded">No notes</div>
{:else}
  <div class="space-y-px">
    {#each noteEntries as entry}
      <div class="group relative flex items-center">
        <button
          class={noteBtnClass($currentNote?.path === entry.path)}
          onclick={() => openNote(entry.path)}
        >
          <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 1.75C2 .784 2.784 0 3.75 0h5.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 12.25 16h-8.5A1.75 1.75 0 0 1 2 14.25V1.75Z"/>
          </svg>
          <span class="truncate pr-5">{entry.name}</span>
        </button>
        <button
          class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-quiet-faded opacity-0 transition-all hover:bg-quiet-hover hover:text-quiet-danger group-hover:opacity-100"
          onclick={(e) => {
            e.stopPropagation();
            handleDeleteSidebar(entry);
          }}
          title="Delete note"
        >
          <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 4h10M5 4v10a1 1 0 001 1h4a1 1 0 001-1V4M6.5 4V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5V4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    {/each}
  </div>
{/if}
