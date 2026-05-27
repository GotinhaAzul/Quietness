import { writable, get, type Writable } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import { isSameNotePath } from '$lib/utils/noteDeletion';
import { shouldRestoreNoteAfterDeleteFailure } from '$lib/utils/noteCrudRecovery';
import { showError } from '$lib/stores/errors';
import { reconcileIntegrity } from '$lib/stores/integrity';

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
export const deletingNotePaths: Writable<Set<string>> = writable(new Set());
export const notesRevision = writable(0);

export function bumpNotesRevision(): void {
  notesRevision.update(r => r + 1);
}

export async function loadNotes(): Promise<void> {
  loading.set(true);
  try {
    const entries = await invoke<NoteEntry[]>('list_notes');
    notes.set(entries);
    notesRevision.update(r => r + 1);
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
    await reconcileIntegrity('load-note-failed');
    showError(`Failed to load note: ${e}`);
  }
}

export async function saveCurrentNote(): Promise<void> {
  const note = get(currentNote);
  if (!note) return;
  try {
    await invoke('write_note', { path: note.path, content: note.content });
  } catch (e) {
    const msg = String(e).toLowerCase();
    if (msg.includes('no such file') || msg.includes('not found') || msg.includes('cannot find')) {
      await reconcileIntegrity('save-failed');
    }
    showError(`Failed to save note: ${e}`);
  }
}

export async function saveNote(path: string, content: string): Promise<void> {
  try {
    await invoke('write_note', { path, content });
    currentNote.update(n => (n && n.path === path) ? { ...n, content } : n);
  } catch (e) {
    const msg = String(e).toLowerCase();
    if (msg.includes('no such file') || msg.includes('not found') || msg.includes('cannot find')) {
      await reconcileIntegrity('save-failed');
    }
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

    // Optimistic UI: add note and load it instantly
    const entry: NoteEntry = { name: cleanName, path };
    notes.update(list => [...list, entry]);
    currentNote.set({ name: cleanName, path, content });

    try {
      await invoke('write_note', { path, content });
      await loadNotes();
    } catch (e) {
      notes.update(list => list.filter(n => n.path !== path));
      currentNote.update(n => n?.path === path ? null : n);
      showError(`Failed to create note: ${e}`);
    }
  } catch (e) {
    showError(`Failed to create note: ${e}`);
  }
}

export async function deleteNote(path: string): Promise<void> {
  if ([...get(deletingNotePaths)].some(deletingPath => isSameNotePath(deletingPath, path))) return;

  const previousCurrent = get(currentNote);
  const deletedOpenNote = previousCurrent ? isSameNotePath(previousCurrent.path, path) : false;

  deletingNotePaths.update(paths => new Set(paths).add(path));
  if (deletedOpenNote) {
    currentNote.set(null);
  }

    try {
      await invoke('trash_note', { path });
      await loadNotes();
  } catch (e) {
    if (deletedOpenNote && shouldRestoreNoteAfterDeleteFailure(e)) {
      currentNote.set(previousCurrent);
    }
    await loadNotes();
    showError(`Failed to delete note: ${e}`);
  } finally {
    deletingNotePaths.update(paths => {
      const next = new Set(paths);
      next.delete(path);
      return next;
    });
  }
}

export async function permanentlyDeleteNote(path: string): Promise<void> {
  if ([...get(deletingNotePaths)].some(deletingPath => isSameNotePath(deletingPath, path))) return;

  const previousCurrent = get(currentNote);
  const deletedOpenNote = previousCurrent ? isSameNotePath(previousCurrent.path, path) : false;

  deletingNotePaths.update(paths => new Set(paths).add(path));
  if (deletedOpenNote) {
    currentNote.set(null);
  }

  try {
    await invoke('delete_note', { path });
    await loadNotes();
  } catch (e) {
    if (deletedOpenNote && shouldRestoreNoteAfterDeleteFailure(e)) {
      currentNote.set(previousCurrent);
    }
    await loadNotes();
    showError(`Failed to permanently delete note: ${e}`);
  } finally {
    deletingNotePaths.update(paths => {
      const next = new Set(paths);
      next.delete(path);
      return next;
    });
  }
}

export async function moveNote(path: string, destFolder: string): Promise<string | null> {
  try {
    const newPath = await invoke<string>('move_note', { path, destFolder });
    const note = get(currentNote);
    if (note && isSameNotePath(note.path, path)) {
      const name = note.name;
      currentNote.set({ ...note, path: newPath });
    }
    await loadNotes();
    return newPath;
  } catch (e) {
    showError(`Failed to move note: ${e}`);
    return null;
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
