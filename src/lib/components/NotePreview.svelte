<script lang="ts">
  import { renderMarkdown } from '$lib/utils/markdown';
  import { notes, loadNote, createNoteFromWikilink } from '$lib/stores/notes';

  let { content = '' }: { content?: string } = $props();

  let existingNoteNames = $derived(new Set($notes.map(n => n.name.toLowerCase())));
  let noteIndex = $derived(
    $notes.reduce<Record<string, (typeof $notes)[number]>>((idx, n) => {
      idx[n.name.toLowerCase()] = n;
      return idx;
    }, {})
  );

  let renderedHTML = $state('');
  let lastRender = 0;
  let pendingContent: string | null = null;
  let pendingNames: Set<string> | null = null;
  let rafId: number | undefined;

  $effect(() => {
    const src = content;
    const names = existingNoteNames;

    const now = performance.now();
    if (now - lastRender >= 2) {
      lastRender = now;
      renderedHTML = renderMarkdown(src, names);
    } else {
      pendingContent = src;
      pendingNames = names;
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          rafId = undefined;
          if (pendingContent !== null && pendingNames !== null) {
            lastRender = performance.now();
            renderedHTML = renderMarkdown(pendingContent, pendingNames);
            pendingContent = null;
            pendingNames = null;
          }
        });
      }
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = undefined;
      }
    };
  });

  function handleClick(event: Event) {
    const target = event.target as HTMLElement;
    const link = target.closest('[data-wikilink]') as HTMLElement | null;
    if (!link) return;

    const linkTarget = link.getAttribute('data-wikilink');
    if (!linkTarget) return;

    const noteEntry = noteIndex[linkTarget.toLowerCase()];
    if (noteEntry) {
      event.preventDefault();
      loadNote(noteEntry.path);
    } else {
      event.preventDefault();
      if (confirm(`Note "${linkTarget}" does not exist. Create it?`)) {
        createNoteFromWikilink(linkTarget);
      }
    }
  }
</script>

<style>
  :global(.task-checkbox) {
    appearance: none;
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border: 1.5px solid var(--q-muted);
    border-radius: 3px;
    margin: 0 6px 0 0;
    vertical-align: middle;
    cursor: default;
    display: inline-block;
    position: relative;
    top: -1px;
    flex-shrink: 0;
    transition: background 0.15s, border-color 0.15s;
  }
  :global(.task-checkbox:checked) {
    background: var(--q-accent);
    border-color: var(--q-accent);
  }
  :global(.task-checkbox:checked::after) {
    content: '';
    position: absolute;
    left: 3.5px;
    top: 1px;
    width: 4px;
    height: 7px;
    border: solid white;
    border-width: 0 1.5px 1.5px 0;
    transform: rotate(45deg);
  }
  :global(.task-list-item) {
    list-style: none;
    margin-left: -1.4em;
  }
</style>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="preview-content" role="region" onclick={handleClick} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleClick(e))}>
  {@html renderedHTML}
</div>