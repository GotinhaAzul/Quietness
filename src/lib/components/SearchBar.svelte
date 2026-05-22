<script lang="ts">
  import { searchQuery, searchScope, searchResultCount, searchResults, focusSearchInput, type SearchScope } from '$lib/stores/ui';
  import { loadNote } from '$lib/stores/notes';

  let query = $state('');
  let scope: SearchScope = $state('all');
  let inputEl: HTMLInputElement | undefined = $state();
  let debounce: ReturnType<typeof setTimeout>;

  $effect(() => {
    if ($focusSearchInput && inputEl) {
      inputEl.focus();
    }
  });

  function handleInput() {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      searchQuery.set(query.trim());
    }, 150);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      query = '';
      searchQuery.set('');
    }
  }

  function setScope(s: SearchScope) {
    scope = s;
    searchScope.set(s);
    if (query.trim()) {
      searchQuery.set(query.trim());
    }
  }

  async function openFromSearch(path: string) {
    query = '';
    searchQuery.set('');
    await loadNote(path);
  }

  const SCOPE_LABELS: Record<SearchScope, string> = {
    'current-note': 'Note',
    'current-folder': 'Folder',
    'all': 'All',
  };
</script>

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
    class="w-full rounded-md border border-quiet-border/70 bg-quiet-surface/60 py-1.5 pl-9 pr-3 text-xs text-quiet-text placeholder-quiet-faded outline-none transition-colors focus:border-quiet-accent/40 focus:bg-quiet-surface focus:ring-1 focus:ring-quiet-accent/20"
  />

  <div class="mt-1.5 flex gap-1">
    {#each (['current-note', 'current-folder', 'all'] as const) as s}
      <button
        class="rounded px-2 py-0.5 text-[10px] font-medium transition-colors {scope === s
          ? 'bg-quiet-accent/15 text-quiet-accent'
          : 'text-quiet-faded hover:bg-quiet-hover hover:text-quiet-muted'}"
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
    {#if $searchResultCount > 0}
      <div class="mt-1 max-h-40 overflow-y-auto rounded-md border border-quiet-border/70 bg-quiet-surface shadow-lg">
        {#each $searchResults as result}
          <button
            class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-quiet-muted transition-colors hover:bg-quiet-hover hover:text-quiet-text"
            onclick={() => openFromSearch(result.path)}
          >
            <span class="truncate">{result.name}</span>
            <span class="shrink-0 truncate text-[10px] text-quiet-faded">{result.path.split('/').slice(-2, -1).join('/')}</span>
          </button>
        {/each}
      </div>
    {/if}
  {/if}
</div>
