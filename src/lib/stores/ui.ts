import { writable, type Writable } from 'svelte/store';

export const searchQuery: Writable<string> = writable<string>('');
