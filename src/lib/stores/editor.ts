import { writable } from 'svelte/store';

export type ViewMode = 'edit' | 'preview' | 'split';

export const viewMode = writable<ViewMode>('split');

/** Insert callback provided by NoteEditor for TemplatePicker use. */
export const editorInsert = writable<((content: string) => void) | null>(null);
