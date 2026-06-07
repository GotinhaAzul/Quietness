<script lang="ts">
  import { currentNote, notes, loadNote } from '$lib/stores/notes';
  import { invoke } from '@tauri-apps/api/core';

  interface BacklinkEntry {
    name: string;
    path: string;
    folder: string;
  }

  interface OutgoingEntry {
    target: string;
    name: string;
    path: string;
    folder: string;
    exists: boolean;
  }

  let { open = false, onclose }: { open?: boolean; onclose?: () => void } = $props();

  let outgoingLinks = $state<OutgoingEntry[]>([]);
  let backlinks = $state<BacklinkEntry[]>([]);
  let loading = $state(false);
  let activeTab = $state<'outgoing' | 'backlinks'>('outgoing');

  $effect(() => {
    if (!open || !$currentNote) return;

    loading = true;

    // Extract outgoing links from current note content
    const content = $currentNote.content;
    const linkTargets = extractWikilinkTargets(content);
    const allNotes = $notes;

    outgoingLinks = linkTargets.map(target => {
      const match = allNotes.find(n => n.name.toLowerCase() === target.toLowerCase());
      if (match) {
        const folder = getFolderFromPath(match.path);
        return { target, name: match.name, path: match.path, folder, exists: true };
      }
      return { target, name: target, path: '', folder: '', exists: false };
    });

    // Fetch backlinks from Rust
    const noteName = $currentNote.name;
    invoke<BacklinkEntry[]>('find_backlinks', { targetName: noteName })
      .then(result => {
        backlinks = result;
      })
      .catch(() => {
        backlinks = [];
      })
      .finally(() => {
        loading = false;
      });
  });

  function extractWikilinkTargets(content: string): string[] {
    const regex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    const targets: string[] = [];
    const seen = new Set<string>();
    let match;
    while ((match = regex.exec(content)) !== null) {
      const target = match[1].trim();
      if (target && !seen.has(target.toLowerCase())) {
        seen.add(target.toLowerCase());
        targets.push(target);
      }
    }
    return targets;
  }

  function getFolderFromPath(filePath: string): string {
    // Expects absolute path; extract relative folder from notes directory
    const normalized = filePath.replace(/\\/g, '/');
    const parts = normalized.split('/');
    const filename = parts.pop() ?? '';
    // The last component is the filename, everything before is the folder path
    if (parts.length > 0) {
      return parts.join('/');
    }
    return '';
  }

  function handleNavigate(path: string) {
    if (path) {
      loadNote(path);
      onclose?.();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onclose?.();
    }
  }

  function formatFolder(folder: string): string {
    if (!folder) return '';
    const parts = folder.split('/');
    // Only show the last 2 levels to keep it readable
    if (parts.length <= 2) return folder;
    return '…/' + parts.slice(-2).join('/');
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
    role="dialog"
    aria-modal="true"
    aria-label="Backlinks"
    onclick={(e) => { if (e.target === e.currentTarget) onclose?.(); }}
    onkeydown={handleKeydown}
  >
    <div
      class="relative mx-4 flex w-[480px] max-w-full flex-col rounded-xl border border-quiet-border bg-[var(--q-bg)] shadow-xl"
      style="max-height: 70vh;"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-quiet-border/60 px-5 py-3">
        <h2 class="text-sm font-semibold text-quiet-text">Backlinks</h2>
        <button
          class="rounded-md p-1 text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text"
          onclick={onclose}
          aria-label="Close backlinks"
        >
          <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-quiet-border/60 px-5">
        <button
          class="border-b-2 px-3 py-2.5 text-xs font-medium transition-colors {activeTab === 'outgoing'
            ? 'border-quiet-accent text-quiet-text'
            : 'border-transparent text-quiet-faded hover:text-quiet-muted'}"
          onclick={() => (activeTab = 'outgoing')}
        >
          Outgoing ({outgoingLinks.length})
        </button>
        <button
          class="border-b-2 px-3 py-2.5 text-xs font-medium transition-colors {activeTab === 'backlinks'
            ? 'border-quiet-accent text-quiet-text'
            : 'border-transparent text-quiet-faded hover:text-quiet-muted'}"
          onclick={() => (activeTab = 'backlinks')}
        >
          Backlinks ({backlinks.length})
        </button>
      </div>

      <!-- Body -->
      <div class="min-h-0 flex-1 overflow-y-auto p-4">
        {#if loading && activeTab === 'backlinks'}
          <div class="flex items-center justify-center py-12">
            <span class="text-xs text-quiet-faded">Scanning notes…</span>
          </div>
        {:else if activeTab === 'outgoing'}
          {#if outgoingLinks.length === 0}
            <div class="flex flex-col items-center justify-center py-12">
              <p class="text-xs text-quiet-muted">No outgoing links in this note.</p>
              <p class="mt-1 text-[11px] text-quiet-faded">Use <code class="rounded bg-quiet-surface px-1 py-0.5 font-mono">[[Note Name]]</code> to create links.</p>
            </div>
          {:else}
            <div class="space-y-1">
              {#each outgoingLinks as link}
                <button
                  class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-quiet-hover {link.exists ? 'cursor-pointer' : 'cursor-default'}"
                  onclick={() => link.exists && handleNavigate(link.path)}
                  disabled={!link.exists}
                >
                  <svg class="h-3.5 w-3.5 shrink-0 {link.exists ? 'text-quiet-muted' : 'text-quiet-danger/50'}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10 2h4v4M6 10L14 2M8 5H3a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V8" />
                  </svg>
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-xs font-medium {link.exists ? 'text-quiet-text' : 'text-quiet-danger/60'}">
                      {link.name}
                    </div>
                    {#if link.folder}
                      <div class="truncate text-[10px] text-quiet-faded">{formatFolder(link.folder)}</div>
                    {/if}
                  </div>
                  {#if !link.exists}
                    <span class="shrink-0 text-[10px] text-quiet-danger/50">Not created</span>
                  {/if}
                </button>
              {/each}
            </div>
          {/if}
        {:else}
          {#if backlinks.length === 0}
            <div class="flex flex-col items-center justify-center py-12">
              <p class="text-xs text-quiet-muted">No other notes link to this note.</p>
              <p class="mt-1 text-[11px] text-quiet-faded">Links are created automatically when you use <code class="rounded bg-quiet-surface px-1 py-0.5 font-mono">[[Note Name]]</code>.</p>
            </div>
          {:else}
            <div class="space-y-1">
              {#each backlinks as link}
                <button
                  class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-quiet-hover"
                  onclick={() => handleNavigate(link.path)}
                >
                  <svg class="h-3.5 w-3.5 shrink-0 text-quiet-muted" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 2H2v4M10 14h4v-4M2 14L7 9M9 7l5-5" />
                  </svg>
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-xs font-medium text-quiet-text">{link.name}</div>
                    {#if link.folder}
                      <div class="truncate text-[10px] text-quiet-faded">{formatFolder(link.folder)}</div>
                    {/if}
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        {/if}
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between border-t border-quiet-border/60 px-5 py-2.5">
        <span class="text-[10px] text-quiet-faded">
          {$currentNote?.name ?? ''}
        </span>
        <button
          class="rounded-md bg-quiet-accent px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90"
          onclick={onclose}
        >Close</button>
      </div>
    </div>
  </div>
{/if}
