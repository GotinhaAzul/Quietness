import { writable, get, type Writable } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import { showError } from '$lib/stores/errors';
import { currentNote, loadNotes } from '$lib/stores/notes';
import { normalizeNotePath } from '$lib/utils/noteDeletion';
import { isPathInsideFolder, restoreFailedFolderMutation } from '$lib/utils/folderCrudRecovery';
import { moveTarget } from '$lib/stores/move';

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

export async function deleteFolder(folderPath: string): Promise<void> {
  let currentWasCleared = false;
  let selectedWasCleared = false;
  const previousCurrent = get(currentNote);
  const previousSelected = get(selectedFolder);

  try {
    const dir = await invoke<string>('get_notes_dir');

    if (previousCurrent && isPathInsideFolder(previousCurrent.path, dir, folderPath)) {
      currentNote.set(null);
      currentWasCleared = true;
    }

    selectedFolder.update(cur => {
      if (cur !== null && (normalizeNotePath(cur) === normalizeNotePath(folderPath) || normalizeNotePath(cur).startsWith(`${normalizeNotePath(folderPath)}/`))) {
        selectedWasCleared = true;
        return null;
      }
      return cur;
    });

    await invoke('trash_folder', { path: folderPath });
    await Promise.all([loadFolders(), loadNotes()]);
  } catch (e) {
    const restored = restoreFailedFolderMutation(
      previousCurrent,
      currentWasCleared,
      previousSelected,
      selectedWasCleared,
    );
    if (restored.currentNote) currentNote.set(restored.currentNote);
    if (restored.selectedFolder) selectedFolder.set(restored.selectedFolder);
    await Promise.all([loadFolders(), loadNotes()]);
    showError(`Failed to delete folder: ${e}`);
  }
}

export async function permanentlyDeleteFolder(folderPath: string): Promise<void> {
  let currentWasCleared = false;
  let selectedWasCleared = false;
  const previousCurrent = get(currentNote);
  const previousSelected = get(selectedFolder);

  try {
    const dir = await invoke<string>('get_notes_dir');

    if (previousCurrent && isPathInsideFolder(previousCurrent.path, dir, folderPath)) {
      currentNote.set(null);
      currentWasCleared = true;
    }

    selectedFolder.update(cur => {
      if (cur !== null && (normalizeNotePath(cur) === normalizeNotePath(folderPath) || normalizeNotePath(cur).startsWith(`${normalizeNotePath(folderPath)}/`))) {
        selectedWasCleared = true;
        return null;
      }
      return cur;
    });

    await invoke('delete_folder', { path: folderPath });
    await Promise.all([loadFolders(), loadNotes()]);
  } catch (e) {
    const restored = restoreFailedFolderMutation(
      previousCurrent,
      currentWasCleared,
      previousSelected,
      selectedWasCleared,
    );
    if (restored.currentNote) currentNote.set(restored.currentNote);
    if (restored.selectedFolder) selectedFolder.set(restored.selectedFolder);
    await Promise.all([loadFolders(), loadNotes()]);
    showError(`Failed to permanently delete folder: ${e}`);
  }
}

export async function renameFolder(oldPath: string, newName: string): Promise<void> {
  try {
    await invoke('rename_folder', { oldPath, newName });

    const note = get(currentNote);
    if (note) {
      const dir = await invoke<string>('get_notes_dir');
      const baseDir = dir.replace(/\\/g, '/');
      if (isPathInsideFolder(note.path, baseDir, oldPath)) {
        const parentParts = oldPath.split('/');
        parentParts.pop();
        const newRelPath = parentParts.length > 0 ? `${parentParts.join('/')}/${newName}` : newName;
        const newFolderAbs = `${baseDir}/${newRelPath}`;
        const oldFolderAbs = normalizeNotePath(`${baseDir}/${oldPath}`);
        const pattern = oldFolderAbs.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const newNotePath = note.path.replace(new RegExp(pattern, 'i'), newFolderAbs);
        currentNote.set({ ...note, path: newNotePath });
      }
    }

    await Promise.all([loadFolders(), loadNotes()]);
  } catch (e) {
    showError(`Failed to rename folder: ${e}`);
  }
}

export async function moveFolder(path: string, destFolder: string): Promise<void> {
  try {
    await invoke('move_folder', { path, destFolder });

    const note = get(currentNote);
    if (note) {
      const dir = await invoke<string>('get_notes_dir');
      if (isPathInsideFolder(note.path, dir, path)) {
        currentNote.set(null);
      }
    }

    selectedFolder.update(cur => {
      if (cur !== null && (cur === path || cur.startsWith(path + '/'))) {
        return null;
      }
      return cur;
    });

    await Promise.all([loadFolders(), loadNotes()]);
    moveTarget.set(null);
  } catch (e) {
    showError(`Failed to move folder: ${e}`);
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
