<script lang="ts">
  import { settings } from '$lib/stores/settings';
  import { UI_FONTS, EDITOR_FONTS, PREVIEW_FONTS, AVAILABLE_THEMES, FONT_STACKS } from '$lib/utils/fonts';

  let { open = false, onclose }: { open?: boolean; onclose?: () => void } = $props();

  let activeTab = $state<'theme' | 'fonts' | 'editor'>('theme');

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose?.();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
    role="dialog"
    aria-modal="true"
    aria-label="Settings"
    onclick={(e) => { if (e.target === e.currentTarget) onclose?.(); }}
    onkeydown={(e) => { if (e.key === 'Escape') onclose?.(); }}
  >
    <div
      class="mx-4 flex w-[560px] max-w-full flex-col rounded-xl border border-quiet-border bg-[var(--q-bg)] shadow-xl"
      style="max-height: 80vh;"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-quiet-border/60 px-6 py-4">
        <h2 class="text-sm font-semibold text-quiet-text">Settings</h2>
        <button
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
          { id: 'theme', label: 'Theme' },
          { id: 'fonts', label: 'Fonts' },
          { id: 'editor', label: 'Editor' },
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
        {#if activeTab === 'theme'}
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
                <!-- Color swatches -->
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

        {:else if activeTab === 'fonts'}
          <div class="space-y-6">
            <!-- UI Font -->
            <div>
              <span class="mb-2 block text-xs font-medium text-quiet-text" id="font-ui-label">UI Font &mdash; sidebar, toolbar, interface</span>
              <div class="flex items-center gap-4">
                <select
                  aria-labelledby="font-ui-label"
                  class="flex-1 rounded-md border border-quiet-border/70 bg-white/70 px-3 py-1.5 text-xs text-quiet-text outline-none transition-colors focus:border-quiet-accent/40 focus:bg-white focus:ring-1 focus:ring-quiet-accent/20"
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
                <div class="flex w-24 items-center gap-2">
                  <input
                    type="range"
                    min="12"
                    max="24"
                    step="1"
                    class="w-full accent-quiet-accent"
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
                   class="flex-1 rounded-md border border-quiet-border/70 bg-white/70 px-3 py-1.5 text-xs text-quiet-text outline-none transition-colors focus:border-quiet-accent/40 focus:bg-white focus:ring-1 focus:ring-quiet-accent/20"
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
                <div class="flex w-24 items-center gap-2">
                  <input
                    type="range"
                    min="12"
                    max="24"
                    step="1"
                    class="w-full accent-quiet-accent"
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
                   class="flex-1 rounded-md border border-quiet-border/70 bg-white/70 px-3 py-1.5 text-xs text-quiet-text outline-none transition-colors focus:border-quiet-accent/40 focus:bg-white focus:ring-1 focus:ring-quiet-accent/20"
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
                <div class="flex w-24 items-center gap-2">
                  <input
                    type="range"
                    min="12"
                    max="24"
                    step="1"
                    class="w-full accent-quiet-accent"
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
          </div>
        {/if}
      </div>

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
