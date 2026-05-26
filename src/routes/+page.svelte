<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import NoteEditor from '$lib/components/NoteEditor.svelte';
  import NotePreview from '$lib/components/NotePreview.svelte';
  import SettingsModal from '$lib/components/SettingsModal.svelte';
import { loadNotes, currentNote, saveCurrentNote, deleteNote, permanentlyDeleteNote } from '$lib/stores/notes';
import { errorMessage, dismissError, showError } from '$lib/stores/errors';
import { invoke } from '@tauri-apps/api/core';
import { loadFolders } from '$lib/stores/folders';
import { viewMode, type ViewMode } from '$lib/stores/editor';
import { settings } from '$lib/stores/settings';
import { userThemes } from '$lib/stores/userThemes';
import { focusSearchInput, showNewNoteInput } from '$lib/stores/ui';
import { moveTarget } from '$lib/stores/move';
import { FONT_STACKS } from '$lib/utils/fonts';
import { runAfterModalDismiss, waitForNextPaint } from '$lib/utils/confirmedAction';
import ConfirmModal from '$lib/components/ConfirmModal.svelte';
import FlamePet from '$lib/components/FlamePet.svelte';
import MoveDialog from '$lib/components/MoveDialog.svelte';

  const modes: { value: ViewMode; label: string }[] = [
    { value: 'edit', label: 'Edit' },
    { value: 'split', label: 'Split' },
    { value: 'preview', label: 'Preview' },
  ];

  let saveTimeout: any = null;
  let showSettings = $state(false);
  let confirmDelete = $state(false);
  let confirmPermanentDelete = $state(false);
  let appReady = $state(false);
  let unsavedChanges = $state(false);
  let saveStatus = $state<'saved' | 'saving' | 'unsaved'>('saved');

  $effect(() => {
    function handleKeydown(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      if (e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'n') {
        e.preventDefault();
        showNewNoteInput.set(true);
      } else if (e.key === ',') {
        e.preventDefault();
        showSettings = true;
      } else if (e.key === 'F' || e.key === 'f') {
        if (e.shiftKey) {
          e.preventDefault();
          focusSearchInput.update(n => n + 1);
        }
      } else if (e.key === 'E' && e.shiftKey) {
        e.preventDefault();
        viewMode.set('edit');
      } else if (e.key === 'S' && e.shiftKey) {
        e.preventDefault();
        viewMode.set('split');
      } else if (e.key === 'P' && e.shiftKey) {
        e.preventDefault();
        viewMode.set('preview');
      } else if (e.key === 'D' && e.shiftKey) {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Delete' && e.shiftKey) {
        e.preventDefault();
        handlePermanentDelete();
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });

  onMount(() => {
    loadNotes();
    loadFolders();
    settings.load().then(async () => {
      await userThemes.load();
      appReady = true;
      // Check home folder health
      try {
        const status = await invoke<{ configuredPath: string; effectivePath: string; isFallback: boolean }>('home_folder_status');
        if (status.isFallback) {
          showError(`Home folder is missing or inaccessible. Using default location: ${status.effectivePath}`);
        }
      } catch { /* ignore */ }
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
    saveStatus = 'unsaved';

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(async () => {
      saveStatus = 'saving';
      await saveCurrentNote();
      unsavedChanges = false;
      saveStatus = 'saved';
    }, 800);
  }

  async function handleSave() {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveStatus = 'saving';
    await saveCurrentNote();
    unsavedChanges = false;
    saveStatus = 'saved';
  }

  function handleDelete() {
    if (!$currentNote) return;
    confirmDelete = true;
  }

  function confirmDeleteNote() {
    if (!$currentNote) return;
    const path = $currentNote.path;
    void runAfterModalDismiss({
      close: () => {
        confirmDelete = false;
      },
      waitForDismissal: async () => {
        await tick();
        await waitForNextPaint();
      },
      action: async () => {
        if (saveTimeout) {
          clearTimeout(saveTimeout);
        }
        await deleteNote(path);
      },
    });
  }

  function handlePermanentDelete() {
    if (!$currentNote) return;
    confirmPermanentDelete = true;
  }

  function confirmPermanentDeleteNote() {
    if (!$currentNote) return;
    const path = $currentNote.path;
    void runAfterModalDismiss({
      close: () => {
        confirmPermanentDelete = false;
      },
      waitForDismissal: async () => {
        await tick();
        await waitForNextPaint();
      },
      action: async () => {
        if (saveTimeout) {
          clearTimeout(saveTimeout);
        }
        await permanentlyDeleteNote(path);
      },
    });
  }
</script>

<svelte:head>
  <title>Quietness</title>
  <meta
    name="description"
    content="Offline note taking app with a calm, minimal writing surface."
  />
</svelte:head>

<div class="flex h-screen min-h-0 overflow-hidden">
  <Sidebar />

  <main class="flex min-h-0 flex-1 flex-col overflow-hidden">
    <div class="flex items-center justify-between border-b border-quiet-border/60 px-6 py-3">
      <div class="flex items-center gap-3">
        {#if saveStatus !== 'saved'}
          <span class="text-[10px] text-quiet-faded">
            {#if saveStatus === 'saving'}Saving…{:else}Unsaved{/if}
          </span>
        {/if}
      </div>
      <div class="flex items-center gap-2">
        {#if $currentNote}
            <div class="flex overflow-hidden rounded-md border border-quiet-border/60">
            {#each modes as mode}
              <button
                class="px-3 py-1 text-xs transition-all duration-150 ease-out {$viewMode === mode.value
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
            class="rounded-md px-3 py-1 text-xs text-quiet-danger/70 transition-colors hover:bg-quiet-danger-bg hover:text-quiet-danger"
            onclick={handleDelete}
          >
            Delete
          </button>
        {/if}
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
      </div>
    </div>

    {#if $currentNote}
      <div class="flex min-h-0 flex-1">
        {#if $viewMode === 'edit' || $viewMode === 'split'}
          <div class="{$viewMode === 'split' ? 'min-h-0 flex-1 border-r border-quiet-border/60' : 'min-h-0 flex-1'} overflow-hidden">
            <div class="flex h-full min-h-0 flex-col">
              <div class="border-b border-quiet-border/60 px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-quiet-faded">
                Editor
              </div>
              <div class="min-h-0 flex-1">
                <NoteEditor content={$currentNote.content} onContentChange={handleContentChange} />
              </div>
            </div>
          </div>
        {/if}
        {#if $viewMode === 'preview' || $viewMode === 'split'}
          <div id="preview-panel" class="min-h-0 flex-1 overflow-hidden">
            <div class="flex h-full min-h-0 flex-col">
              <div class="border-b border-quiet-border/60 px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-quiet-faded">
                Preview
              </div>
              <div class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-6">
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

  {#if $errorMessage.length > 0}
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {#each $errorMessage as error (error.id)}
        <div class="flex max-w-sm items-center gap-3 rounded-lg border border-quiet-danger/20 bg-quiet-danger-bg/95 px-4 py-3 shadow-sm backdrop-blur-sm transition-all duration-300 ease-in-out">
          <svg class="h-4 w-4 shrink-0 text-quiet-danger" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <div class="flex-1 text-xs font-medium text-quiet-danger">{error.message}</div>
          <button
            class="shrink-0 rounded p-0.5 text-quiet-danger/60 transition-colors hover:text-quiet-danger"
            onclick={() => dismissError(error.id)}
            aria-label="Dismiss error"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<SettingsModal open={showSettings} onclose={() => (showSettings = false)} />

<ConfirmModal
  open={confirmDelete && $currentNote !== null}
  title="Delete note"
  message={$currentNote ? `Delete "${$currentNote.name}"?` : ''}
  confirmLabel="Delete"
  onconfirm={confirmDeleteNote}
  oncancel={() => (confirmDelete = false)}
/>

<ConfirmModal
  open={confirmPermanentDelete && $currentNote !== null}
  title="Delete permanently"
  message={$currentNote ? `Permanently delete "${$currentNote.name}"? This cannot be undone.` : ''}
  confirmLabel="Delete forever"
  onconfirm={confirmPermanentDeleteNote}
  oncancel={() => (confirmPermanentDelete = false)}
/>

<FlamePet />

<MoveDialog open={$moveTarget !== null} />
