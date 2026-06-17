<script lang="ts">
  import Explorer from './Explorer.svelte';
  import SearchBar from './SearchBar.svelte';
  import TrashDialog from './TrashDialog.svelte';
  import { sidebarCollapsed } from '$lib/stores/ui';

  let showTrash = $state(false);
</script>

<aside class="flex shrink-0 flex-col border-r border-quiet-chrome bg-quiet-sidebar-bg transition-all duration-150 ease-out {$sidebarCollapsed ? 'w-10' : 'w-64'}">
  {#if !$sidebarCollapsed}
    <div class="border-b border-quiet-chrome px-4 py-4">
      <h1 class="text-sm font-semibold tracking-tight text-quiet-text">Quietness</h1>
      <p class="text-xs text-quiet-faded">A quiet place to write.</p>
    </div>

    <div class="px-3 pt-3 pb-1">
      <SearchBar />
    </div>

    <div class="overflow-y-auto">
      <Explorer />
    </div>
  {/if}

  <div class="mt-auto border-t border-quiet-chrome">
    {#if !$sidebarCollapsed}
      <button
        class="quiet-sidebar-row flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors"
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
      class="quiet-sidebar-row flex w-full items-center justify-center p-2.5 text-quiet-faded transition-colors"
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
