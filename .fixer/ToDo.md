# ToDo — Quietness V2

> Fase de refinamento: estabilidade, performance e qualidade de vida.
> Tasks organizadas por grupo. Marque `[x]` ao concluir.

## Group 1 — Estabilidade

- [x] `T01` **Fix content sync loop** — Add guard variable in NoteEditor `$effect` (88-94) to prevent document replacement when change originated from editor itself. Completion: content sync loop eliminated; typing does not reset cursor position.
- [x] `T02` **Hardened `is_safe_path`** — Resolve symlinks and UNC paths via `std::fs::canonicalize` before sandbox comparison in `fs.rs:63-90`. Completion: path traversal via symlinks and `\\?\` is blocked.
- [x] `T03` **Stale-request cancellation** — Add abort controller or incrementing counter in NoteList `$effect` (15-20) to discard outdated backend responses. Completion: rapid folder/search switches always show correct final result.
- [x] `T04` **User-facing error handling** — Replace `console.error` with `showError` in `folders.ts`, `settings.ts`, `userThemes.ts`, `NoteList.svelte`. Completion: all silent failures surface as visible error toasts.
- [x] `T05` **Fix startup race condition** — Await `userThemes.load()` before setting `appReady` in `+page.svelte:28-29`. Completion: user theme CSS injection is reliable on first load.
- [x] `T06` **beforeunload await + unsaved warning** — Await `saveCurrentNote()` in beforeunload handler; add `event.preventDefault()` to warn user if unsaved changes exist. Completion: data loss on window close is prevented.
- [x] `T07` **Empty catch blocks** — Add logging to empty `catch {}` in `userThemes.ts:36,40-42`. Completion: errors from user theme loading are visible in console/logs.

## Group 2 — Performance

- [x] `T08` **Search optimization** — Move `search_notes` content reads to background thread (`tokio::spawn_blocking`); add in-memory filename index. Completion: search does not block UI thread; repeated searches are sub-second with index.
- [x] `T09` **Settings effect compartment split** — Only reconfigure CodeMirror compartments when editor-specific settings change (gutters, wordWrap, tabSize) in `NoteEditor.svelte:76-86`. Completion: theme slider drag does not re-trigger editor configuration.
- [x] `T10` **Markdown rendering memoization** — Cache `renderMarkdown()` output by content hash in `markdown.ts`. Completion: re-renders with unchanged content skip markdown-it parse.

## Group 3 — Qualidade de Vida

- [x] `T11` **Global keyboard shortcuts** — Register shortcuts in `+page.svelte` or dedicated utility: `Ctrl+S` save, `Ctrl+N` new note, `Ctrl+,` settings, `Ctrl+Shift+F` focus search, `Ctrl+Shift+E/S/P` toggle edit/split/preview. Completion: all listed shortcuts work app-wide.
- [x] `T12` **Note rename** — Add rename action in NoteList (context/hover) + new Tauri `rename_note` command in `fs.rs`. Completion: user can rename notes from the UI; filesystem is updated accordingly.
- [x] `T13` **Sidebar collapse toggle** — Add collapse/expand button in Sidebar; toggle via `ui.ts` store. Completion: sidebar can be hidden to give more writing space.
- [x] `T14` **Save status indicator** — Show "Saving…" / "Saved" / "Unsaved" state in the top bar of `+page.svelte`. Completion: user always knows persist state of current note.
- [x] `T15` **Search feedback** — Show result count ("X notes found") in SearchBar; consider dropdown for results. Completion: user sees whether search matched anything and how many results.
- [x] `T16` **Auto-focus new note input** — Use `bind:this` + `.focus()` when `showNewNoteInput` becomes true in Sidebar. Completion: clicking "+ New" immediately focuses the input.
- [x] `T17` **Focus trap in SettingsModal** — Trap Tab focus within the modal when open. Completion: Tab cycling does not escape to elements behind the overlay.
- [x] `T18` **Error toast dismiss + stacking** — Add dismiss button to error toasts; stack multiple errors instead of replacing. Completion: multiple errors are visible simultaneously; users can dismiss individually.
- [x] `T19` **Undo history across note switches** — Save CM6 history per note path; restore when switching back. Completion: switching away from a note and back preserves undo stack.
- [x] `T20` **Inline title editing** — Editable title field at top of NoteEditor that renames the note file on change. Completion: user can click the note title in the editor area, edit it, and the file is renamed accordingly.
- [x] `T21` **Settings always accessible** — Gear button visible on welcome/empty state, not only when a note is open. Completion: settings can be opened regardless of whether a note is active.
- [x] `T22` **Code format rendering** — Add CSS styling for inline code (`code`) and fenced code blocks (```) in NotePreview; ensure markdown-it renders them correctly. Completion: code formatting displays with proper monospace font, background, and syntax styling in preview.
- [x] `T23` **Search by keyword with scope filter** — Add keyword search input with scope filter (current note / current folder / all notes). Current note scope searches within the open note's content; current folder scopes to notes in the active folder; all notes searches the entire vault. Show matches inline or in results dropdown. Completion: user can search by keyword and choose where to search.
