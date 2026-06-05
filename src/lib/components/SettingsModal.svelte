<script lang="ts">
  import { settings, DEFAULT_SETTINGS } from '$lib/stores/settings';
  import { userThemes } from '$lib/stores/userThemes';
  import { UI_FONTS, EDITOR_FONTS, PREVIEW_FONTS, AVAILABLE_THEMES, FONT_STACKS } from '$lib/utils/fonts';
  import { invoke } from '@tauri-apps/api/core';
  import { showError, showSuccess } from '$lib/stores/errors';
  import { loadLibrarySnapshot } from '$lib/stores/library';

  let { open = false, onclose }: { open?: boolean; onclose?: () => void } = $props();

  let activeTab = $state<'general' | 'theme' | 'fonts' | 'editor' | 'pet'>('general');
  let previousFocus: Element | null = null;
  let closeButtonRef: HTMLButtonElement | undefined = $state();
  let homeFolderPath = $state('');
  let initialHomeFolder = $state('');
  let homeFolderDirty = $state(false);
  let saving = $state(false);
  let showMigrationPrompt = $state(false);
  let migrationCount = $state(0);
  let migrationFromPath = $state('');
  let migrationToPath = $state('');
  let migrating = $state(false);

  $effect(() => {
    if (open) {
      userThemes.load();
      previousFocus = document.activeElement;
      requestAnimationFrame(() => {
        closeButtonRef?.focus();
      });
      loadHomeFolder();
    } else if (previousFocus) {
      (previousFocus as HTMLElement)?.focus();
      previousFocus = null;
    }
  });

  async function loadHomeFolder() {
    try {
      const path = await invoke<string>('get_home_folder');
      homeFolderPath = path;
      initialHomeFolder = path;
      homeFolderDirty = false;
    } catch (e) {
      showError(`Failed to load home folder: ${e}`);
    }
  }

  function handleHomeFolderInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    homeFolderPath = val;
    homeFolderDirty = val !== initialHomeFolder;
  }

  async function applyHomeFolder() {
    const oldPath = initialHomeFolder;
    saving = true;
    try {
      if (homeFolderPath === oldPath) return;
      const newPath = homeFolderPath.trim();
      if (!newPath) {
        await invoke('reset_home_folder');
      } else {
        await invoke('set_home_folder', { path: newPath });
      }
      initialHomeFolder = homeFolderPath;
      homeFolderDirty = false;
      await Promise.all([loadLibrarySnapshot(), settings.load()]);

      // Detect orphaned notes in old folder
      if (oldPath && oldPath !== newPath) {
        const count = await invoke<number>('count_md_files', { path: oldPath });
        if (count > 0) {
          migrationCount = count;
          migrationFromPath = oldPath;
          migrationToPath = newPath || '';
          showMigrationPrompt = true;
        }
      }
    } catch (e) {
      showError(`Failed to set home folder: ${e}`);
      await loadHomeFolder();
    } finally {
      saving = false;
    }
  }

  async function handleMigrate() {
    migrating = true;
    try {
      const to = migrationToPath || homeFolderPath.trim();
      const count = await invoke<number>('migrate_content', {
        from: migrationFromPath,
        to,
      });
      showMigrationPrompt = false;
      showSuccess(`Migrated ${count} notes to the new home folder.`);
      await loadLibrarySnapshot();
    } catch (e) {
      showError(`Migration failed: ${e}`);
    } finally {
      migrating = false;
    }
  }

  function handleSkipMigration() {
    showMigrationPrompt = false;
  }

  async function resetToDefault() {
    const oldPath = initialHomeFolder;
    saving = true;
    try {
      await invoke('reset_home_folder');
      homeFolderPath = '';
      initialHomeFolder = '';
      homeFolderDirty = false;
      await Promise.all([loadLibrarySnapshot(), settings.load()]);

      if (oldPath) {
        const count = await invoke<number>('count_md_files', { path: oldPath });
        if (count > 0) {
          migrationCount = count;
          migrationFromPath = oldPath;
          migrationToPath = '';
          showMigrationPrompt = true;
        }
      }
    } catch (e) {
      showError(`Failed to reset home folder: ${e}`);
    } finally {
      saving = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onclose?.();
      return;
    }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
    role="dialog"
    aria-modal="true"
    aria-label="Settings"
    onclick={(e) => { if (e.target === e.currentTarget) onclose?.(); }}
    onkeydown={handleKeydown}
  >
    <div
      class="relative mx-4 flex w-[560px] max-w-full flex-col rounded-xl border border-quiet-border bg-[var(--q-bg)] shadow-xl"
      style="max-height: 80vh;"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-quiet-border/60 px-6 py-4">
        <h2 class="text-sm font-semibold text-quiet-text">Settings</h2>
        <button
          bind:this={closeButtonRef}
          class="rounded-md p-1.5 text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text"
          onclick={onclose}
          aria-label="Close settings"
        >
          <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-quiet-border/60 px-6">
        {#each ([
          { id: 'general', label: 'General' },
          { id: 'theme', label: 'Theme' },
          { id: 'fonts', label: 'Fonts' },
          { id: 'editor', label: 'Editor' },
          { id: 'pet', label: 'Pet' },
        ] as const) as tab}
          <button
            class="border-b-2 px-4 py-3 text-xs font-medium transition-colors {activeTab === tab.id
              ? 'border-quiet-accent text-quiet-text'
              : 'border-transparent text-quiet-faded hover:text-quiet-muted'}"
            onclick={() => (activeTab = tab.id)}
          >
            {tab.label}
          </button>
        {/each}
      </div>

      <!-- Tab content -->
      <div class="flex-1 overflow-y-auto p-6">
        {#if activeTab === 'general'}
          <div class="space-y-5">
            <h3 class="text-xs font-medium text-quiet-text">Home Folder</h3>
            <p class="text-[11px] text-quiet-faded leading-relaxed">
              All notes and folders are stored inside this directory. Changes take effect immediately.
            </p>
            <div class="flex items-center gap-2">
              <input
                type="text"
                class="flex-1 rounded-md border border-quiet-border/70 bg-quiet-surface/60 px-3 py-1.5 text-xs text-quiet-text outline-none transition-colors focus:border-quiet-accent/40 focus:bg-quiet-surface focus:ring-1 focus:ring-quiet-accent/20"
                placeholder="C:\Users\...\Quietness (leave empty for default)"
                value={homeFolderPath}
                oninput={handleHomeFolderInput}
              />
              <button
                class="rounded-md border border-quiet-border/60 px-3 py-1.5 text-xs text-quiet-faded transition-colors hover:border-quiet-border hover:bg-quiet-hover hover:text-quiet-text disabled:opacity-50"
                onclick={resetToDefault}
                disabled={!initialHomeFolder || saving}
              >Reset</button>
            </div>
            {#if homeFolderDirty}
              <button
                class="w-full rounded-md bg-quiet-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                onclick={applyHomeFolder}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Apply'}
              </button>
            {/if}

            <hr class="border-quiet-border/60" />

            <h3 class="text-xs font-medium text-quiet-text">Templates</h3>
            <div class="flex items-center justify-between">
              <span class="text-xs text-quiet-text">Note templates</span>
              <button
                aria-label="Toggle note templates"
                class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors {$settings.templatesEnabled ? 'bg-quiet-accent' : 'bg-quiet-border'}"
                onclick={() => settings.update(s => ({ ...s, templatesEnabled: !s.templatesEnabled }))}
                role="switch"
                aria-checked={$settings.templatesEnabled}
              >
                <span class="inline-block h-3.5 w-3.5 translate-x-0.5 transform rounded-full bg-white shadow-sm transition-transform {$settings.templatesEnabled ? 'translate-x-[18px]' : ''}"></span>
              </button>
            </div>
            <p class="text-[11px] text-quiet-faded leading-relaxed">
              When enabled, a templates button appears in the editor toolbar for quick access.
            </p>
          </div>

        {:else if activeTab === 'theme'}
          <div class="mb-6">
            <h3 class="mb-3 text-[11px] font-medium uppercase tracking-wider text-quiet-faded">Built-in Themes</h3>
            <div class="grid grid-cols-3 gap-3">
              {#each AVAILABLE_THEMES as theme}
                {@const active = $settings.theme === theme.id}
                {@const c = theme.colors}
                <button
                  class="rounded-lg border-2 p-4 text-left transition-all {active
                    ? 'border-quiet-accent ring-1 ring-quiet-accent/30'
                    : 'border-quiet-border/60 hover:border-quiet-border hover:bg-quiet-hover'}"
                  onclick={() => settings.update(s => ({ ...s, theme: theme.id }))}
                >
                  <div class="mb-3 flex gap-1">
                    <span class="h-5 w-5 rounded-full border border-quiet-border/50" style="background: {c.bg}" title="Background"></span>
                    <span class="h-5 w-5 rounded-full border border-quiet-border/50" style="background: {c.surface}" title="Surface"></span>
                    <span class="h-5 w-5 rounded-full border border-quiet-border/50" style="background: {c.text}" title="Text"></span>
                    <span class="h-5 w-5 rounded-full border border-quiet-border/50" style="background: {c.accent}" title="Accent"></span>
                    <span class="h-5 w-5 rounded-full border border-quiet-border/50" style="background: {c.muted}" title="Muted"></span>
                  </div>
                  <div class="text-xs font-medium text-quiet-text">{theme.name}</div>
                  <div class="mt-0.5 text-[11px] text-quiet-faded">{theme.description}</div>
                </button>
              {/each}
            </div>
          </div>
          {#if $userThemes.list.length > 0}
            <div>
              <h3 class="mb-3 text-[11px] font-medium uppercase tracking-wider text-quiet-faded">User Themes</h3>
              <div class="grid grid-cols-3 gap-3">
                {#each $userThemes.list as theme}
                  {@const active = $settings.theme === theme.id}
                  <button
                    class="rounded-lg border-2 p-4 text-left transition-all {active
                      ? 'border-quiet-accent ring-1 ring-quiet-accent/30'
                      : 'border-quiet-border/60 hover:border-quiet-border hover:bg-quiet-hover'}"
                    onclick={() => settings.update(s => ({ ...s, theme: theme.id }))}
                  >
                    <div class="mb-2 flex h-10 items-center justify-center rounded bg-quiet-surface/50">
                      <svg class="h-5 w-5 text-quiet-muted" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <div class="text-xs font-medium text-quiet-text">{theme.name}</div>
                    <div class="mt-0.5 text-[11px] text-quiet-faded">Custom theme</div>
                  </button>
                {/each}
              </div>
            </div>
          {:else}
            <div class="rounded-lg border border-dashed border-quiet-border/60 p-6 text-center">
              <p class="text-xs text-quiet-faded">Place <code class="rounded bg-quiet-surface px-1 py-0.5 text-[11px]">.css</code> files in the <code class="rounded bg-quiet-surface px-1 py-0.5 text-[11px]">_themes/</code> folder inside your notes directory to see them here.</p>
            </div>
          {/if}

        {:else if activeTab === 'fonts'}
          <div class="space-y-6">
            <!-- UI Font -->
            <div>
              <span class="mb-2 block text-xs font-medium text-quiet-text" id="font-ui-label">UI Font &mdash; sidebar, toolbar, interface</span>
              <div class="flex items-center gap-4">
                <select
                  aria-labelledby="font-ui-label"
                   class="flex-1 rounded-md border border-quiet-border/70 bg-quiet-surface/60 px-3 py-1.5 text-xs text-quiet-text outline-none transition-colors focus:border-quiet-accent/40 focus:bg-quiet-surface focus:ring-1 focus:ring-quiet-accent/20"
                   value={$settings.fonts.ui}
                   onchange={(e) => {
                     const val = (e.target as HTMLSelectElement).value;
                     settings.update(s => ({ ...s, fonts: { ...s.fonts, ui: val } }));
                   }}
                 >
                   {#each UI_FONTS as font}
                     <option value={font}>{font}</option>
                  {/each}
                </select>
                <div class="flex w-32 items-center gap-3">
                  <input
                    type="range"
                    min="12"
                    max="24"
                    step="1"
                    class="quiet-range w-full"
                    value={$settings.sizes.ui}
                    oninput={(e) => {
                      const val = parseInt((e.target as HTMLInputElement).value);
                      settings.update(s => ({ ...s, sizes: { ...s.sizes, ui: val } }));
                    }}
                  />
                  <span class="w-7 text-right text-xs text-quiet-muted tabular-nums">{$settings.sizes.ui}</span>
                </div>
              </div>
            </div>

            <!-- Editor Font -->
            <div>
              <span class="mb-2 block text-xs font-medium text-quiet-text" id="font-editor-label">Editor Font &mdash; code editing area</span>
              <div class="flex items-center gap-4">
                 <select
                   aria-labelledby="font-editor-label"
                    class="flex-1 rounded-md border border-quiet-border/70 bg-quiet-surface/60 px-3 py-1.5 text-xs text-quiet-text outline-none transition-colors focus:border-quiet-accent/40 focus:bg-quiet-surface focus:ring-1 focus:ring-quiet-accent/20"
                    value={$settings.fonts.editor}
                  onchange={(e) => {
                    const val = (e.target as HTMLSelectElement).value;
                    settings.update(s => ({ ...s, fonts: { ...s.fonts, editor: val } }));
                  }}
                  style="font-family: {FONT_STACKS[$settings.fonts.editor] || 'monospace'}"
                >
                  {#each EDITOR_FONTS as font}
                    <option value={font} style="font-family: {FONT_STACKS[font]}">{font}</option>
                  {/each}
                </select>
                <div class="flex w-32 items-center gap-3">
                  <input
                    type="range"
                    min="12"
                    max="24"
                    step="1"
                    class="quiet-range w-full"
                    value={$settings.sizes.editor}
                    oninput={(e) => {
                      const val = parseInt((e.target as HTMLInputElement).value);
                      settings.update(s => ({ ...s, sizes: { ...s.sizes, editor: val } }));
                    }}
                  />
                  <span class="w-7 text-right text-xs text-quiet-muted tabular-nums">{$settings.sizes.editor}</span>
                </div>
              </div>
            </div>

            <!-- Preview Font -->
            <div>
              <span class="mb-2 block text-xs font-medium text-quiet-text" id="font-preview-label">Preview Font &mdash; rendered Markdown preview</span>
              <div class="flex items-center gap-4">
                 <select
                   aria-labelledby="font-preview-label"
                    class="flex-1 rounded-md border border-quiet-border/70 bg-quiet-surface/60 px-3 py-1.5 text-xs text-quiet-text outline-none transition-colors focus:border-quiet-accent/40 focus:bg-quiet-surface focus:ring-1 focus:ring-quiet-accent/20"
                    value={$settings.fonts.preview}
                  onchange={(e) => {
                    const val = (e.target as HTMLSelectElement).value;
                    settings.update(s => ({ ...s, fonts: { ...s.fonts, preview: val } }));
                  }}
                  style="font-family: {FONT_STACKS[$settings.fonts.preview] || 'serif'}"
                >
                  {#each PREVIEW_FONTS as font}
                    <option value={font} style="font-family: {FONT_STACKS[font]}">{font}</option>
                  {/each}
                </select>
                <div class="flex w-32 items-center gap-3">
                  <input
                    type="range"
                    min="12"
                    max="24"
                    step="1"
                    class="quiet-range w-full"
                    value={$settings.sizes.preview}
                    oninput={(e) => {
                      const val = parseInt((e.target as HTMLInputElement).value);
                      settings.update(s => ({ ...s, sizes: { ...s.sizes, preview: val } }));
                    }}
                  />
                  <span class="w-7 text-right text-xs text-quiet-muted tabular-nums">{$settings.sizes.preview}</span>
                </div>
              </div>
            </div>
          </div>

        {:else if activeTab === 'editor'}
          <div class="space-y-5">
            <!-- Line Numbers -->
            <div class="flex items-center justify-between">
              <span class="text-xs text-quiet-text">Line numbers</span>
              <button
                aria-label="Toggle line numbers"
                class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors {$settings.editor.lineNumbers ? 'bg-quiet-accent' : 'bg-quiet-border'}"
                onclick={() => settings.update(s => ({ ...s, editor: { ...s.editor, lineNumbers: !s.editor.lineNumbers } }))}
                role="switch"
                aria-checked={$settings.editor.lineNumbers}
              >
                <span class="inline-block h-3.5 w-3.5 translate-x-0.5 transform rounded-full bg-white shadow-sm transition-transform {$settings.editor.lineNumbers ? 'translate-x-[18px]' : ''}"></span>
              </button>
            </div>

            <!-- Word Wrap -->
            <div class="flex items-center justify-between">
              <span class="text-xs text-quiet-text">Word wrap</span>
              <button
                aria-label="Toggle word wrap"
                class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors {$settings.editor.wordWrap ? 'bg-quiet-accent' : 'bg-quiet-border'}"
                onclick={() => settings.update(s => ({ ...s, editor: { ...s.editor, wordWrap: !s.editor.wordWrap } }))}
                role="switch"
                aria-checked={$settings.editor.wordWrap}
              >
                <span class="inline-block h-3.5 w-3.5 translate-x-0.5 transform rounded-full bg-white shadow-sm transition-transform {$settings.editor.wordWrap ? 'translate-x-[18px]' : ''}"></span>
              </button>
            </div>

            <!-- Tab Size -->
            <div class="flex items-center justify-between">
              <span class="text-xs text-quiet-text">Tab size</span>
              <div class="flex items-center gap-2">
                <button
                  class="flex h-6 w-6 items-center justify-center rounded-md border border-quiet-border/70 text-xs text-quiet-muted transition-colors hover:bg-quiet-hover hover:text-quiet-text disabled:opacity-40"
                  onclick={() => settings.update(s => ({ ...s, editor: { ...s.editor, tabSize: Math.max(1, s.editor.tabSize - 1) } }))}
                  disabled={$settings.editor.tabSize <= 1}
                >−</button>
                <span class="w-6 text-center text-xs text-quiet-text tabular-nums">{$settings.editor.tabSize}</span>
                <button
                  class="flex h-6 w-6 items-center justify-center rounded-md border border-quiet-border/70 text-xs text-quiet-muted transition-colors hover:bg-quiet-hover hover:text-quiet-text disabled:opacity-40"
                  onclick={() => settings.update(s => ({ ...s, editor: { ...s.editor, tabSize: Math.min(8, s.editor.tabSize + 1) } }))}
                  disabled={$settings.editor.tabSize >= 8}
                >+</button>
              </div>
            </div>

            <!-- Dim Inactive Lines -->
            <div class="flex items-center justify-between">
              <span class="text-xs text-quiet-text">Dim inactive lines</span>
              <button
                aria-label="Toggle dim inactive lines"
                class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors {$settings.editor.dimInactiveLines ? 'bg-quiet-accent' : 'bg-quiet-border'}"
                onclick={() => settings.update(s => ({ ...s, editor: { ...s.editor, dimInactiveLines: !s.editor.dimInactiveLines } }))}
                role="switch"
                aria-checked={$settings.editor.dimInactiveLines}
              >
                <span class="inline-block h-3.5 w-3.5 translate-x-0.5 transform rounded-full bg-white shadow-sm transition-transform {$settings.editor.dimInactiveLines ? 'translate-x-[18px]' : ''}"></span>
              </button>
            </div>

            <!-- Smooth Caret -->
            <div class="flex items-center justify-between">
              <span class="text-xs text-quiet-text">Smooth animated cursor</span>
              <button
                aria-label="Toggle smooth cursor animation"
                class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors {$settings.editor.smoothCaret ? 'bg-quiet-accent' : 'bg-quiet-border'}"
                onclick={() => settings.update(s => ({ ...s, editor: { ...s.editor, smoothCaret: !s.editor.smoothCaret } }))}
                role="switch"
                aria-checked={$settings.editor.smoothCaret}
              >
                <span class="inline-block h-3.5 w-3.5 translate-x-0.5 transform rounded-full bg-white shadow-sm transition-transform {$settings.editor.smoothCaret ? 'translate-x-[18px]' : ''}"></span>
              </button>
            </div>
          </div>

        {:else if activeTab === 'pet'}
          <div class="space-y-5">
            <!-- Big Flame Toggle -->
            <div class="flex items-center justify-between">
              <span class="text-xs text-quiet-text">Big Flame</span>
              <button
                aria-label="Toggle big flame"
                class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors {$settings.pet.bigFlameEnabled ? 'bg-quiet-accent' : 'bg-quiet-border'}"
                onclick={() => settings.update(s => ({ ...s, pet: { ...s.pet, bigFlameEnabled: !s.pet.bigFlameEnabled } }))}
                role="switch"
                aria-checked={$settings.pet.bigFlameEnabled}
              >
                <span class="inline-block h-3.5 w-3.5 translate-x-0.5 transform rounded-full bg-white shadow-sm transition-transform {$settings.pet.bigFlameEnabled ? 'translate-x-[18px]' : ''}"></span>
              </button>
            </div>

            <!-- Small Particle Toggle -->
            <div class="flex items-center justify-between">
              <span class="text-xs text-quiet-text">Small Particle</span>
              <button
                aria-label="Toggle small particle"
                class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors {$settings.pet.smallParticleEnabled ? 'bg-quiet-accent' : 'bg-quiet-border'}"
                onclick={() => settings.update(s => ({ ...s, pet: { ...s.pet, smallParticleEnabled: !s.pet.smallParticleEnabled } }))}
                role="switch"
                aria-checked={$settings.pet.smallParticleEnabled}
              >
                <span class="inline-block h-3.5 w-3.5 translate-x-0.5 transform rounded-full bg-white shadow-sm transition-transform {$settings.pet.smallParticleEnabled ? 'translate-x-[18px]' : ''}"></span>
              </button>
            </div>

            <!-- Ambient Particles Toggle -->
            <div class="flex items-center justify-between">
              <span class="text-xs text-quiet-text">Ambient particles</span>
              <button
                aria-label="Toggle ambient particles"
                class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors {$settings.pet.ambientParticlesEnabled ? 'bg-quiet-accent' : 'bg-quiet-border'}"
                onclick={() => settings.update(s => ({ ...s, pet: { ...s.pet, ambientParticlesEnabled: !s.pet.ambientParticlesEnabled } }))}
                role="switch"
                aria-checked={$settings.pet.ambientParticlesEnabled}
              >
                <span class="inline-block h-3.5 w-3.5 translate-x-0.5 transform rounded-full bg-white shadow-sm transition-transform {$settings.pet.ambientParticlesEnabled ? 'translate-x-[18px]' : ''}"></span>
              </button>
            </div>

            <hr class="border-quiet-border/60" />

            <h3 class="text-xs font-medium text-quiet-text">Flame Colors</h3>

            {#each ([
              { key: 'core', label: 'Core' },
              { key: 'inner', label: 'Inner' },
              { key: 'mid', label: 'Mid' },
              { key: 'outer', label: 'Outer' },
              { key: 'ember', label: 'Ember' },
            ] as const) as color}
              <div class="flex items-center justify-between">
                <span class="text-xs text-quiet-text">{color.label}</span>
                <input
                  type="color"
                  value={$settings.pet.colors[color.key]}
                  oninput={(e) => {
                    const val = (e.target as HTMLInputElement).value;
                    settings.update(s => ({
                      ...s,
                      pet: { ...s.pet, colors: { ...s.pet.colors, [color.key]: val } }
                    }));
                  }}
                  class="h-7 w-10 cursor-pointer rounded border border-quiet-border/70 bg-transparent p-0.5"
                />
              </div>
            {/each}

            <button
              class="mt-2 w-full rounded-md border border-quiet-border/60 px-3 py-1.5 text-xs text-quiet-faded transition-colors hover:border-quiet-border hover:bg-quiet-hover hover:text-quiet-text"
              onclick={() => settings.update(s => ({
                ...s,
                pet: { ...s.pet, colors: { ...DEFAULT_SETTINGS.pet.colors } }
              }))}
            >
              Reset to default colors
            </button>
          </div>
        {/if}
      </div>

      <!-- Migration prompt -->
      {#if showMigrationPrompt}
        <div class="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/20">
          <div class="mx-4 w-[380px] rounded-xl border border-quiet-border bg-[var(--q-bg)] shadow-xl">
            <div class="px-5 py-4">
              <h3 class="text-sm font-semibold text-quiet-text">Migrate notes?</h3>
              <p class="mt-1.5 text-xs text-quiet-muted leading-relaxed">
                Your old home folder has {migrationCount} note{migrationCount !== 1 ? 's' : ''}.
                Would you like to copy them to the new location?
              </p>
              <p class="mt-1 text-[11px] text-quiet-faded break-all">
                {migrationFromPath} &rarr; {migrationToPath}
              </p>
            </div>
            <div class="flex items-center justify-end gap-2 border-t border-quiet-border/60 px-5 py-3">
              <button
                class="rounded-md px-3.5 py-1.5 text-xs font-medium text-quiet-faded transition-colors hover:bg-quiet-hover hover:text-quiet-text disabled:opacity-50"
                onclick={handleSkipMigration}
                disabled={migrating}
              >Skip</button>
              <button
                class="rounded-md bg-quiet-accent px-3.5 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                onclick={handleMigrate}
                disabled={migrating}
              >
                {migrating ? 'Migrating…' : 'Migrate'}
              </button>
            </div>
          </div>
        </div>
      {/if}

      <!-- Footer -->
      <div class="flex items-center justify-end border-t border-quiet-border/60 px-6 py-3">
        <button
          class="rounded-md bg-quiet-accent px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          onclick={onclose}
        >Done</button>
      </div>
    </div>
  </div>
{/if}
