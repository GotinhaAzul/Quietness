<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import NoteEditor from '$lib/components/NoteEditor.svelte';
  import NotePreview from '$lib/components/NotePreview.svelte';
  import SettingsModal from '$lib/components/SettingsModal.svelte';
  import { loadNotes, currentNote, saveCurrentNote, deleteNote, errorMessage } from '$lib/stores/notes';
  import { loadFolders } from '$lib/stores/folders';
  import { viewMode, type ViewMode } from '$lib/stores/editor';
  import { settings } from '$lib/stores/settings';
  import { userThemes } from '$lib/stores/userThemes';
  import { FONT_STACKS } from '$lib/utils/fonts';

  const modes: { value: ViewMode; label: string }[] = [
    { value: 'edit', label: 'Edit' },
    { value: 'split', label: 'Split' },
    { value: 'preview', label: 'Preview' },
  ];

  let saveTimeout: any = null;
  let isDeleting = $state(false);
  let showSettings = $state(false);
  let appReady = $state(false);
  let unsavedChanges = $state(false);

  onMount(() => {
    loadNotes();
    loadFolders();
    settings.load().then(async () => {
      await userThemes.load();
      appReady = true;
    });

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (unsavedChanges) {
        event.preventDefault();
      }
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      saveCurrentNote();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  });

  onDestroy(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
  });

  $effect(() => {
    if (!appReady) return;
    const s = $settings;
    const root = document.documentElement;
    const isUser = s.theme.startsWith('user-');

    root.className = `theme-${s.theme}`;

    const existing = document.querySelector('style[data-user-theme]');
    if (isUser) {
      const css = userThemes.getCss(s.theme);
      if (css) {
        if (existing) {
          existing.textContent = css;
        } else {
          const el = document.createElement('style');
          el.setAttribute('data-user-theme', '');
          el.textContent = css;
          document.head.appendChild(el);
        }
      }
    } else if (existing) {
      existing.remove();
    }

    root.style.setProperty('--q-font-ui', FONT_STACKS[s.fonts.ui] ?? FONT_STACKS['Inter']);
    root.style.setProperty('--q-font-editor', FONT_STACKS[s.fonts.editor] ?? FONT_STACKS['JetBrains Mono']);
    root.style.setProperty('--q-font-preview', FONT_STACKS[s.fonts.preview] ?? FONT_STACKS['Inter']);

    root.style.setProperty('--q-size-ui', `${s.sizes.ui}px`);
    root.style.setProperty('--q-size-editor', `${s.sizes.editor}px`);
    root.style.setProperty('--q-size-preview', `${s.sizes.preview}px`);
  });

  function handleContentChange(value: string) {
    if (!$currentNote) return;
    $currentNote = { ...$currentNote, content: value };
    unsavedChanges = true;

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(async () => {
      await saveCurrentNote();
      unsavedChanges = false;
    }, 800);
  }

  async function handleSave() {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    await saveCurrentNote();
    unsavedChanges = false;
  }

  async function handleDelete() {
    if (!$currentNote || isDeleting) return;
    if (!confirm(`Delete "${$currentNote.name}"?`)) return;
    isDeleting = true;
    try {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      await deleteNote($currentNote.path);
    } finally {
      isDeleting = false;
    }
  }
</script>

<svelte:head>
  <title>Quietness</title>
  <meta
    name="description"
    content="Offline note taking app with a calm, minimal writing surface."
  />
</svelte:head>

<div class="flex min-h-screen">
  <Sidebar />

  <main class="flex flex-1 flex-col">
    {#if $currentNote}
      <div class="flex items-center justify-between border-b border-quiet-border/60 px-6 py-3">
        <h2 class="text-sm font-medium text-quiet-muted">{$currentNote.name}</h2>
        <div class="flex items-center gap-2">
          <button
            class="rounded-md p-1.5 text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text"
            onclick={() => (showSettings = true)}
            aria-label="Settings"
          >
            <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="8" cy="8" r="1.5" />
              <path d="M8 1.5v1M8 13.5v1M3.3 3.3l.7.7M12 12l.7.7M1.5 8h1M13.5 8h1M3.3 12.7l.7-.7M12 4l.7-.7" />
            </svg>
          </button>
          <div class="flex overflow-hidden rounded-md border border-quiet-border/60">
            {#each modes as mode}
              <button
                class="px-3 py-1 text-xs transition-colors {$viewMode === mode.value
                  ? 'bg-quiet-accent text-white'
                  : 'text-quiet-faded hover:bg-quiet-hover hover:text-quiet-text'}"
                onclick={() => viewMode.set(mode.value)}
              >
                {mode.label}
              </button>
            {/each}
          </div>
          <button
            class="rounded-md px-3 py-1 text-xs text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text"
            onclick={handleSave}
          >
            Save
          </button>
          <button
            disabled={isDeleting}
            class="rounded-md px-3 py-1 text-xs text-quiet-danger/70 transition-colors hover:bg-quiet-danger-bg hover:text-quiet-danger disabled:opacity-50"
            onclick={handleDelete}
          >
            Delete
          </button>
        </div>
      </div>

      <div class="flex flex-1">
        {#if $viewMode === 'edit' || $viewMode === 'split'}
          <div class="{$viewMode === 'split' ? 'flex-1 border-r border-quiet-border/60' : 'flex-1'} overflow-hidden">
            <div class="flex h-full flex-col">
              <div class="border-b border-quiet-border/60 px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-quiet-faded">
                Editor
              </div>
              <div class="flex-1">
                <NoteEditor content={$currentNote.content} onContentChange={handleContentChange} />
              </div>
            </div>
          </div>
        {/if}
        {#if $viewMode === 'preview' || $viewMode === 'split'}
          <div class="flex-1 overflow-hidden">
            <div class="flex h-full flex-col">
              <div class="border-b border-quiet-border/60 px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-quiet-faded">
                Preview
              </div>
              <div class="flex-1 overflow-y-auto p-6">
                <NotePreview content={$currentNote.content} />
              </div>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div class="flex flex-1 items-center justify-center">
        <div class="text-center">
          <h2 class="text-xl font-semibold tracking-tight text-quiet-muted">Welcome to Quietness</h2>
          <p class="mt-2 text-sm text-quiet-faded">Select a note from the sidebar to start writing.</p>
        </div>
      </div>
    {/if}
  </main>

  {#if $errorMessage}
    <div class="fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-3 rounded-lg border border-quiet-danger/20 bg-quiet-danger-bg/95 px-4 py-3 shadow-sm backdrop-blur-sm transition-all duration-300 ease-in-out">
      <svg class="h-4 w-4 shrink-0 text-quiet-danger" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      <div class="text-xs font-medium text-quiet-danger">{$errorMessage}</div>
    </div>
  {/if}
</div>

<SettingsModal open={showSettings} onclose={() => (showSettings = false)} />

