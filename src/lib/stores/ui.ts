import { writable, type Writable } from 'svelte/store';

export const searchQuery: Writable<string> = writable<string>('');
export const sidebarCollapsed: Writable<boolean> = writable<boolean>(false);

export type SearchScope = 'current-note' | 'current-folder' | 'all';
export const searchScope: Writable<SearchScope> = writable<SearchScope>('all');

export const searchResultCount: Writable<number> = writable<number>(0);

/** Result of `search_notes` IPC: title match or content-only match. */
export interface SearchMatch {
  name: string;
  path: string;
  contentMatch: boolean;
}

export const focusSearchInput: Writable<number> = writable<number>(0);
export const showNewNoteInput: Writable<boolean> = writable<boolean>(false);
export const showNewFolderInput: Writable<boolean> = writable<boolean>(false);
