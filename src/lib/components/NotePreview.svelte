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

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="preview-content" role="region" onclick={handleClick} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleClick(e))}>
  {@html renderMarkdown(content, existingNoteNames)}
</div>