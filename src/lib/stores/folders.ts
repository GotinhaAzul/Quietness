import { writable, type Writable } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import { showError } from '$lib/stores/notes';

export interface FolderEntry {
  name: string;
  path: string;
}

export const folders: Writable<FolderEntry[]> = writable<FolderEntry[]>([]);
export const selectedFolder: Writable<string | null> = writable<string | null>(null);

export async function loadFolders(): Promise<void> {
  try {
    const entries = await invoke<FolderEntry[]>('list_folders');
    folders.set(entries);
  } catch (e) {
    showError(`Failed to load folders: ${e}`);
  }
}
