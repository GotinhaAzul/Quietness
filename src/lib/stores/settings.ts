import { writable, type Writable } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import type { Settings } from '$lib/types/settings';
import { showError } from '$lib/stores/errors';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'quiet',
  fonts: {
    ui: 'Inter',
    editor: 'JetBrains Mono',
    preview: 'Inter',
  },
  sizes: {
    ui: 14,
    editor: 14,
    preview: 16,
  },
  editor: {
    lineNumbers: true,
    wordWrap: false,
    tabSize: 4,
    dimInactiveLines: false,
    smoothCaret: true,
  },
  pet: {
    bigFlameEnabled: true,
    smallParticleEnabled: true,
    colors: {
      core: '#ffffff',
      inner: '#c98aff',
      mid: '#912eff',
      outer: '#5a00c2',
      ember: '#5a00c2',
    },
  },
};

function createSettingsStore() {
  const { subscribe, set, update } = writable<Settings>({ ...DEFAULT_SETTINGS });

  let ready = false;
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;

  function scheduleSave(settings: Settings) {
    if (!ready) return;
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      invoke('save_settings', { settings }).catch((e) => {
        showError(`Failed to save settings: ${e}`);
      });
    }, 300);
  }

  return {
    subscribe,
    set(value: Settings) {
      set(value);
      scheduleSave(value);
    },
    update(fn: (s: Settings) => Settings) {
      update((current) => {
        const next = fn(current);
        scheduleSave(next);
        return next;
      });
    },
    async load(): Promise<void> {
      try {
        const saved = await invoke<Settings | null>('load_settings');
        if (saved) {
          set({ ...DEFAULT_SETTINGS, ...saved });
        }
      } catch (e) {
        showError(`Failed to load settings: ${e}`);
      } finally {
        ready = true;
      }
    },
  };
}

export const settings = createSettingsStore();
