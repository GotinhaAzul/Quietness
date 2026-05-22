import { writable, get, type Writable } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';

export interface NoteEntry {
  name: string;
  path: string;
}

export interface Note {
  name: string;
  path: string;
  content: string;
}

export const notes: Writable<NoteEntry[]> = writable<NoteEntry[]>([]);
export const currentNote: Writable<Note | null> = writable<Note | null>(null);
export const loading: Writable<boolean> = writable<boolean>(false);
export const noteListChanged: Writable<number> = writable<number>(0);
export const errorMessage: Writable<string | null> = writable<string | null>(null);

let errorTimeout: any = null;
export function showError(message: string) {
  errorMessage.set(message);
  if (errorTimeout) {
    clearTimeout(errorTimeout);
  }
  errorTimeout = setTimeout(() => {
    errorMessage.set(null);
    errorTimeout = null;
  }, 4000);
}

export async function loadNotes(): Promise<void> {
  loading.set(true);
  try {
    const entries = await invoke<NoteEntry[]>('list_notes');
    notes.set(entries);
  } catch (e) {
    showError(`Failed to load notes listing: ${e}`);
  } finally {
    loading.set(false);
  }
}

export async function loadNote(path: string): Promise<void> {
  // Save current note before switching to prevent unsaved changes data loss
  await saveCurrentNote();
  try {
    const content = await invoke<string>('read_note', { path });
    const name = path.replace(/\\/g, '/').split('/').pop()?.replace('.md', '') || 'Untitled';
    currentNote.set({ name, path, content });
  } catch (e) {
    showError(`Failed to load note: ${e}`);
  }
}

export async function saveCurrentNote(): Promise<void> {
  const note = get(currentNote);
  if (!note) return;
  try {
    await invoke('write_note', { path: note.path, content: note.content });
  } catch (e) {
    showError(`Failed to save note: ${e}`);
  }
}

export async function saveNote(path: string, content: string): Promise<void> {
  try {
    await invoke('write_note', { path, content });
    currentNote.update(n => (n && n.path === path) ? { ...n, content } : n);
  } catch (e) {
    showError(`Failed to save note: ${e}`);
  }
}

export async function createNote(name: string, folder: string = '', content: string = ''): Promise<void> {
  let cleanName = name.trim();
  if (cleanName.toLowerCase().endsWith('.md')) {
    cleanName = cleanName.slice(0, -3).trim();
  }

  if (!cleanName) {
    showError("Note name cannot be empty.");
    return;
  }

  // Windows reserved chars validation & path traversal check
  if (/[\\/:\*\?"<>\|]/.test(cleanName) || cleanName.includes('..')) {
    showError("Note name cannot contain invalid characters (\\ / : * ? \" < > |) or path traversal patterns.");
    return;
  }

  try {
    const dir = await invoke<string>('get_notes_dir');
    const baseDir = dir.replace(/\\/g, '/');
    const path = folder ? `${baseDir}/${folder}/${cleanName}.md` : `${baseDir}/${cleanName}.md`;

    // Prevent duplicate note overwrites
    const normalizedPath = path.toLowerCase().replace(/\\/g, '/');
    const duplicate = get(notes).find(n => n.path.toLowerCase().replace(/\\/g, '/') === normalizedPath);
    if (duplicate) {
      showError(`A note named "${cleanName}" already exists in this folder.`);
      return;
    }

    await invoke('write_note', { path, content });
    await loadNotes();
    noteListChanged.update(n => n + 1);
    await loadNote(path);
  } catch (e) {
    showError(`Failed to create note: ${e}`);
  }
}

export async function deleteNote(path: string): Promise<void> {
  try {
    await invoke('delete_note', { path });
    currentNote.update(n => (n && n.path === path) ? null : n);
    await loadNotes();
    noteListChanged.update(n => n + 1);
  } catch (e) {
    showError(`Failed to delete note: ${e}`);
  }
}

export async function createNoteFromWikilink(targetName: string): Promise<void> {
  const active = get(currentNote);
  let folder = '';
  if (active) {
    try {
      const dir = await invoke<string>('get_notes_dir');
      const baseDir = dir.replace(/\\/g, '/');
      const activePath = active.path.replace(/\\/g, '/');
      if (activePath.startsWith(baseDir)) {
        let rel = activePath.slice(baseDir.length);
        if (rel.startsWith('/')) rel = rel.slice(1);
        const parts = rel.split('/');
        parts.pop(); // remove filename
        folder = parts.join('/');
      }
    } catch (e) {
      console.error('Failed to resolve current folder:', e);
    }
  }
  await createNote(targetName, folder);
}
