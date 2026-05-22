import { writable } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import { showError } from '$lib/stores/notes';

export interface UserThemeMeta {
  id: string;
  name: string;
}

export interface UserThemeCssMap {
  [id: string]: string;
}

export interface UserThemesState {
  list: UserThemeMeta[];
  cssMap: UserThemeCssMap;
}

function createUserThemesStore() {
  const { subscribe, set, update } = writable<UserThemesState>({ list: [], cssMap: {} });

  let currentState: UserThemesState = { list: [], cssMap: {} };
  subscribe((v) => (currentState = v));

  return {
    subscribe,
    set,
    update,
    load: async (): Promise<void> => {
      try {
        const entries = await invoke<UserThemeMeta[]>('list_user_themes');
        const map: UserThemeCssMap = {};
        for (const entry of entries) {
          try {
            map[entry.id] = await invoke<string>('read_user_theme_css', { id: entry.id });
          } catch (e) {
            console.error(`Failed to read user theme "${entry.id}":`, e);
          }
        }
        set({ list: entries, cssMap: map });
      } catch (e) {
        showError(`Failed to load user themes: ${e}`);
      }
    },
    getCss: (id: string): string | undefined => {
      return currentState.cssMap[id];
    },
  };
}

export const userThemes = createUserThemesStore();
