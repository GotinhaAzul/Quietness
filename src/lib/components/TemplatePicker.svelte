<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { settings } from '$lib/stores/settings';
  import { createNote } from '$lib/stores/notes';
  import { showError, showSuccess } from '$lib/stores/errors';

  interface TemplateEntry {
    name: string;
  }

  let { onInsert }: { onInsert?: (content: string) => void } = $props();

  let open = $state(false);
  let templates: TemplateEntry[] = $state([]);
  let selectedName: string | null = $state(null);
  let previewContent: string = $state('');
  let previewLoading = $state(false);
  let loading = $state(false);
  let deleteConfirm: string | null = $state(null);
  let showCreateDialog = $state(false);
  let newName = $state('');
  let newContent = $state('');
  let creating = $state(false);

  let dropdownRef: HTMLDivElement | undefined = $state();
  let buttonRef: HTMLButtonElement | undefined = $state();

  async function loadTemplates() {
    loading = true;
    try {
      templates = await invoke<TemplateEntry[]>('list_templates');
    } catch (e) {
      showError(`Failed to load templates: ${e}`);
    } finally {
      loading = false;
    }
  }

  function toggle() {
    if (!open) {
      loadTemplates();
      selectedName = null;
      previewContent = '';
    }
    open = !open;
  }

  async function selectTemplate(name: string) {
    selectedName = name;
    previewLoading = true;
    try {
      previewContent = await invoke<string>('read_template', { name });
    } catch (e) {
      previewContent = `Error: ${e}`;
    } finally {
      previewLoading = false;
    }
  }

  function handleInsert() {
    if (!selectedName || !previewContent) return;
    onInsert?.(previewContent);
    close();
  }

  async function handleNewFromTemplate() {
    if (!selectedName || !previewContent) return;
    await createNote(selectedName, '', previewContent);
    showSuccess(`Created note from "${selectedName}" template.`);
    close();
  }

  async function confirmDelete(name: string) {
    deleteConfirm = name;
  }

  async function executeDelete() {
    if (!deleteConfirm) return;
    try {
      await invoke('delete_template', { name: deleteConfirm });
      templates = templates.filter(t => t.name !== deleteConfirm);
      if (selectedName === deleteConfirm) {
        selectedName = null;
        previewContent = '';
      }
      showSuccess(`Deleted template "${deleteConfirm}".`);
    } catch (e) {
      showError(`Failed to delete template: ${e}`);
    } finally {
      deleteConfirm = null;
    }
  }

  async function handleCreateTemplate() {
    if (!newName.trim()) return;
    creating = true;
    try {
      await invoke('create_template', { name: newName.trim(), content: newContent });
      showSuccess(`Template "${newName.trim()}" created.`);
      showCreateDialog = false;
      newName = '';
      newContent = '';
      await loadTemplates();
    } catch (e) {
      showError(`Failed to create template: ${e}`);
    } finally {
      creating = false;
    }
  }

  function close() {
    open = false;
    deleteConfirm = null;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (deleteConfirm) {
        deleteConfirm = null;
        return;
      }
      if (showCreateDialog) {
        showCreateDialog = false;
        return;
      }
      close();
    }
  }

  function handleGlobalClick(e: MouseEvent) {
    if (open && dropdownRef && !dropdownRef.contains(e.target as Node) && !buttonRef?.contains(e.target as Node)) {
      close();
    }
  }

  // Using mousedown to avoid race with onblur
  // Using capture phase to ensure we get it
  $effect(() => {
    if (open) {
      document.addEventListener('mousedown', handleGlobalClick, true);
      return () => document.removeEventListener('mousedown', handleGlobalClick, true);
    }
  });

  function focusInput(node: HTMLInputElement | HTMLTextAreaElement) {
    node.focus();
  }
</script>

{#if $settings.templatesEnabled}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="relative" onkeydown={handleKeydown}>
    <button
      bind:this={buttonRef}
      class="flex h-7 w-7 items-center justify-center rounded-md text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text"
      onclick={toggle}
      aria-label="Templates"
      title="Templates"
    >
      <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 4.5h12M2 8h8M2 11.5h5" />
        <path d="M12 8l2 2-2 2" />
      </svg>
    </button>

    {#if open}
      <div
        bind:this={dropdownRef}
        class="absolute right-0 top-full z-50 mt-1 flex w-[420px] max-w-[90vw] rounded-lg border border-quiet-border bg-[var(--q-bg)] shadow-xl overflow-hidden"
        style="max-height: min(70vh, 560px);"
      >
        <!-- Template list -->
        <div class="flex w-1/2 shrink-0 flex-col border-r border-quiet-border/60 min-h-0">
          <div class="flex items-center justify-between border-b border-quiet-border/60 px-3 py-2 shrink-0">
            <span class="text-[11px] font-medium text-quiet-faded uppercase tracking-wider">Templates</span>
            <button
              class="flex h-5 w-5 items-center justify-center rounded text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text"
              onclick={() => { showCreateDialog = true; }}
              aria-label="Create template"
              title="Create template"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <path d="M8 3v10M3 8h10" />
              </svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto min-h-0">
            {#if loading}
              <div class="p-6 text-center text-xs text-quiet-faded">Loading…</div>
            {:else if templates.length === 0}
              <div class="p-6 text-center text-xs text-quiet-faded">
                No templates yet.
              </div>
            {:else}
              {#each templates as tpl}
                <button
                  class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors {selectedName === tpl.name ? 'bg-quiet-hover text-quiet-text' : 'text-quiet-muted hover:bg-quiet-hover hover:text-quiet-text'}"
                  onclick={() => selectTemplate(tpl.name)}
                >
                  <svg class="h-3.5 w-3.5 shrink-0 text-quiet-faded" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
                    <path d="M3 2.5h6l3 3v8a1 1 0 01-1 1H3a1 1 0 01-1-1v-10a1 1 0 011-1z" />
                    <path d="M9 2.5v3h3" />
                  </svg>
                  <span class="truncate">{tpl.name}</span>
                </button>
              {/each}
            {/if}
          </div>
        </div>

        <!-- Preview / actions -->
        <div class="flex w-1/2 flex-col min-h-0">
          {#if deleteConfirm}
            <div class="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
              <p class="text-xs text-quiet-text">Delete "<span class="font-medium">{deleteConfirm}</span>"?</p>
              <div class="flex gap-2">
                <button
                  class="rounded-md border border-quiet-border/60 px-3 py-1 text-xs text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text"
                  onclick={() => { deleteConfirm = null; }}
                >Cancel</button>
                <button
                  class="rounded-md bg-red-500/80 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-500"
                  onclick={executeDelete}
                >Delete</button>
              </div>
            </div>
          {:else if showCreateDialog}
            <div class="flex flex-1 flex-col gap-2 p-3 min-h-0">
              <span class="text-[11px] font-medium text-quiet-faded uppercase tracking-wider shrink-0">New Template</span>
              <input
                type="text"
                class="rounded-md border border-quiet-border/70 bg-quiet-surface/60 px-2 py-1.5 text-xs text-quiet-text outline-none transition-colors focus:border-quiet-accent/40 focus:bg-quiet-surface shrink-0"
                placeholder="Template name"
                bind:value={newName}
                use:focusInput
                onkeydown={(e) => { if (e.key === 'Enter') handleCreateTemplate(); }}
              />
              <textarea
                class="min-h-[80px] flex-1 resize-none rounded-md border border-quiet-border/70 bg-quiet-surface/60 px-2 py-1.5 text-xs text-quiet-text outline-none transition-colors focus:border-quiet-accent/40 focus:bg-quiet-surface"
                placeholder="# Template content (Markdown)"
                bind:value={newContent}
              ></textarea>
              <div class="flex justify-end gap-2 shrink-0">
                <button
                  class="rounded-md border border-quiet-border/60 px-3 py-1 text-xs text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text"
                  onclick={() => { showCreateDialog = false; newName = ''; newContent = ''; }}
                >Cancel</button>
                <button
                  class="rounded-md bg-quiet-accent px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  onclick={handleCreateTemplate}
                  disabled={creating || !newName.trim()}
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </div>
          {:else if selectedName && previewContent}
            <div class="flex flex-col flex-1 min-h-0">
              <div class="flex items-center justify-between border-b border-quiet-border/60 px-3 py-2 shrink-0">
                <span class="text-[11px] font-medium text-quiet-faded uppercase tracking-wider">Preview</span>
                <button
                  class="flex h-5 w-5 items-center justify-center rounded text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-red-400"
                  onclick={() => confirmDelete(selectedName!)}
                  aria-label="Delete template"
                  title="Delete template"
                >
                  <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                    <path d="M3 4h10M5.5 4V3a1 1 0 011-1h3a1 1 0 011 1v1M6 7v4M10 7v4M4 4l.7 8.4a1 1 0 001 .6h4.6a1 1 0 001-.6L12 4" />
                  </svg>
                </button>
              </div>
              {#if previewLoading}
                <div class="flex-1 p-3 text-xs text-quiet-faded min-h-0">Loading…</div>
              {:else}
                <div class="flex-1 overflow-y-auto p-3 min-h-0">
                  <pre class="whitespace-pre-wrap text-xs text-quiet-text leading-relaxed font-mono">{previewContent}</pre>
                </div>
                <div class="flex flex-col gap-1.5 border-t border-quiet-border/60 p-2 shrink-0">
                  <button
                    class="w-full rounded-md bg-quiet-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                    onclick={handleInsert}
                  >Insert into note</button>
                  <button
                    class="w-full rounded-md border border-quiet-border/60 px-3 py-1.5 text-xs text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text"
                    onclick={handleNewFromTemplate}
                  >New note from template</button>
                </div>
              {/if}
            </div>
          {:else}
            <div class="flex flex-1 items-center justify-center p-4 min-h-0">
              <p class="text-xs text-quiet-faded text-center">Select a template to preview its content, or create a new one.</p>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
{/if}