import { writable } from 'svelte/store';

export type ViewMode = 'edit' | 'preview' | 'split';

export const viewMode = writable<ViewMode>('split');
