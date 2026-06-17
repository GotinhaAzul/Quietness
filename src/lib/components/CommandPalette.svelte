<script lang="ts">
  import { tick } from 'svelte';
  import { notes, loadNote } from '$lib/stores/notes';
  import { selectedFolder } from '$lib/stores/folders';
  import { viewMode, type ViewMode } from '$lib/stores/editor';
  import { showNewNoteInput, sidebarCollapsed } from '$lib/stores/ui';
  import { getNoteRelativeFolder } from '$lib/utils/explorerTree';
  import {
    filterCommandPaletteItems,
    type CommandPaletteSearchItem,
  } from '$lib/utils/commandPalette';

  type PaletteItem = CommandPaletteSearchItem & {
    detail: string;
    action: () => void | Promise<void>;
  };

  let {
    open = false,
    notesDir = '',
    onclose,
  }: {
    open?: boolean;
    notesDir?: string;
    onclose?: () => void;
  } = $props();

  let query = $state('');
  let activeIndex = $state(0);
  let inputEl = $state<HTMLInputElement | undefined>();

  const destination = $derived($selectedFolder ?? 'Library root');

  const items = $derived.by<PaletteItem[]>(() => {
    const switchView = (mode: ViewMode) => {
      viewMode.set(mode);
      onclose?.();
    };

    const commands: PaletteItem[] = [
      {
        id: 'new-note',
        label: 'New note',
        detail: destination,
        kind: 'command',
        action: async () => {
          sidebarCollapsed.set(false);
          showNewNoteInput.set(true);
          onclose?.();
        },
      },
      {
        id: 'view-edit',
        label: 'Switch to Edit',
        detail: $viewMode === 'edit' ? 'Current view' : 'View',
        kind: 'command',
        action: () => switchView('edit'),
      },
      {
        id: 'view-split',
        label: 'Switch to Split',
        detail: $viewMode === 'split' ? 'Current view' : 'View',
        kind: 'command',
        action: () => switchView('split'),
      },
      {
        id: 'view-preview',
        label: 'Switch to Preview',
        detail: $viewMode === 'preview' ? 'Current view' : 'View',
        kind: 'command',
        action: () => switchView('preview'),
      },
    ];

    const noteItems = $notes.map<PaletteItem>(note => {
      const folder = notesDir ? getNoteRelativeFolder(note.path, notesDir) : null;
      return {
        id: `note:${note.path}`,
        label: note.name,
        detail: folder ?? 'Library root',
        kind: 'note',
        action: async () => {
          selectedFolder.set(folder);
          onclose?.();
          await loadNote(note.path);
        },
      };
    });

    return [...commands, ...noteItems];
  });

  const filteredItems = $derived(filterCommandPaletteItems(items, query));

  $effect(() => {
    if (!open) return;
    query = '';
    activeIndex = 0;
    void tick().then(() => inputEl?.focus());
  });

  $effect(() => {
    query;
    activeIndex = 0;
  });

  function close() {
    onclose?.();
  }

  async function runItem(item: PaletteItem | undefined) {
    if (!item) return;
    await item.action();
  }

  function keepActiveItemVisible() {
    void tick().then(() => {
      document.getElementById(`command-palette-item-${activeIndex}`)
        ?.scrollIntoView({ block: 'nearest' });
    });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (filteredItems.length > 0) {
        activeIndex = (activeIndex + 1) % filteredItems.length;
        keepActiveItemVisible();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (filteredItems.length > 0) {
        activeIndex = (activeIndex - 1 + filteredItems.length) % filteredItems.length;
        keepActiveItemVisible();
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      void runItem(filteredItems[activeIndex]);
    }
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-start justify-center bg-black/25 px-4 pt-[14vh]"
    role="presentation"
    onclick={(event) => {
      if (event.target === event.currentTarget) close();
    }}
  >
    <div
      class="flex w-full max-w-xl flex-col overflow-hidden rounded-xl border border-quiet-border bg-[var(--q-bg)] shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div class="border-b border-quiet-border/60 p-2">
        <input
          bind:this={inputEl}
          bind:value={query}
          onkeydown={handleKeydown}
          type="text"
          placeholder="Search note titles or commands…"
          aria-label="Search note titles or commands"
          aria-controls="command-palette-results"
          aria-activedescendant={filteredItems.length > 0
            ? `command-palette-item-${activeIndex}`
            : undefined}
          class="w-full rounded-lg bg-quiet-surface px-3 py-2.5 text-sm text-quiet-text placeholder-quiet-faded outline-none ring-1 ring-transparent transition-colors focus:ring-quiet-accent/35"
        />
      </div>

      <div
        id="command-palette-results"
        class="max-h-[52vh] overflow-y-auto p-2"
        role="listbox"
      >
        {#if filteredItems.length === 0}
          <div class="px-3 py-8 text-center text-xs text-quiet-faded">
            No matching notes or commands
          </div>
        {:else}
          {#each filteredItems as item, index (item.id)}
            <button
              id={`command-palette-item-${index}`}
              class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors {index === activeIndex
                ? 'bg-quiet-hover text-quiet-text'
                : 'text-quiet-muted hover:bg-quiet-hover/60 hover:text-quiet-text'}"
              role="option"
              aria-selected={index === activeIndex}
              onmouseenter={() => (activeIndex = index)}
              onclick={() => void runItem(item)}
            >
              <span class="min-w-0 flex-1 truncate text-sm">{item.label}</span>
              <span class="max-w-[45%] shrink-0 truncate text-[11px] text-quiet-faded">
                {item.detail}
              </span>
            </button>
          {/each}
        {/if}
      </div>

      <div class="flex items-center justify-between border-t border-quiet-border/60 px-4 py-2 text-[10px] text-quiet-faded">
        <span>↑↓ navigate · Enter open</span>
        <span>Esc close</span>
      </div>
    </div>
  </div>
{/if}
