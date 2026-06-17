<script lang="ts">
  import { onDestroy } from 'svelte';
  import { searchQuery, searchScope, searchResultCount, focusSearchInput, type SearchScope } from '$lib/stores/ui';

  let query = $state('');
  let inputEl: HTMLInputElement | undefined = $state();
  let debounce: ReturnType<typeof setTimeout>;

  $effect(() => {
    if ($focusSearchInput && inputEl) {
      inputEl.focus();
    }
  });

  $effect(() => {
    if (!$searchQuery) {
      clearTimeout(debounce);
      query = '';
    }
  });

  onDestroy(() => clearTimeout(debounce));

  function handleInput() {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      searchQuery.set(query.trim());
    }, 150);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      clearTimeout(debounce);
      query = '';
      searchQuery.set('');
    }
  }

  function setScope(s: SearchScope) {
    searchScope.set(s);
    if (query.trim()) {
      searchQuery.set(query.trim());
    }
  }

  const SCOPE_LABELS: Record<SearchScope, string> = {
    'current-note': 'Note',
    'current-folder': 'Folder',
    'all': 'All',
  };
</script>

<div class="relative">
  <div class="relative">
    <svg class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-quiet-faded pointer-events-none" viewBox="0 0 16 16" fill="currentColor">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    </svg>
    <input
      bind:this={inputEl}
      type="text"
      placeholder="Search notes…"
      bind:value={query}
      oninput={handleInput}
      onkeydown={handleKeydown}
      class="w-full rounded-md border border-quiet-chrome bg-quiet-surface/60 py-1.5 pl-9 pr-3 text-xs text-quiet-text placeholder-quiet-faded outline-none transition-colors focus:border-quiet-sidebar-accent/40 focus:bg-quiet-surface focus:ring-1 focus:ring-quiet-sidebar-accent/20"
    />
  </div>

  <div class="mt-1.5 flex gap-1">
    {#each (['current-note', 'current-folder', 'all'] as const) as s}
      <button
        class="rounded px-2 py-0.5 text-[10px] font-medium transition-colors {$searchScope === s
          ? 'bg-quiet-sidebar-accent/15 text-quiet-sidebar-accent'
          : 'text-quiet-faded hover:bg-quiet-sidebar-item-hover hover:text-quiet-muted'}"
        onclick={() => setScope(s)}
      >
        {SCOPE_LABELS[s]}
      </button>
    {/each}
  </div>

  {#if query.trim() && $searchResultCount >= 0}
    <div class="mt-1.5 px-1 text-[11px] text-quiet-faded">
      {#if $searchResultCount === 0}
        No notes found
      {:else}
        {$searchResultCount} note{$searchResultCount === 1 ? '' : 's'} found
      {/if}
    </div>
  {/if}
</div>
