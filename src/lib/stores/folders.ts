import { writable, type Writable } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import { showError } from '$lib/stores/errors';

export interface FolderEntry {
  name: string;
  path: string;
}

export const folders: Writable<FolderEntry[]> = writable<FolderEntry[]>([]);
export const selectedFolder: Writable<string | null> = writable<string | null>(null);

export async function createFolder(name: string, parentPath?: string): Promise<void> {
  try {
    const cleanName = name.trim();
    if (!cleanName) {
      showError('Folder name cannot be empty.');
      return;
    }
    if (/[\\/:*?"<>|]/.test(cleanName) || cleanName.includes('..') || cleanName.startsWith('_')) {
      showError('Invalid folder name.');
      return;
    }
    const path = parentPath ? `${parentPath}/${cleanName}` : cleanName;
    await invoke('create_folder', { path });
    await loadFolders();
  } catch (e) {
    showError(`Failed to create folder: ${e}`);
  }
}

export async function loadFolders(): Promise<void> {
  try {
    const entries = await invoke<FolderEntry[]>('list_folders');
    folders.set(entries);
  } catch (e) {
    showError(`Failed to load folders: ${e}`);
  }
}
