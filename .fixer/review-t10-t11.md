# PR Review: T10 — Wikilinks / T11 — Note Creation & Deletion

**Reviewer:** opencode
**Date:** 2026-05-22
**Status:** ❌ Changes requested (9 critical, 2 medium, 3 low)

---

## T10 — Wikilink `[[]]` Support

Files: `src/lib/utils/wikilinks.ts`, `src/lib/components/NotePreview.svelte`

### 🔴 Critical

| # | File:Line | Issue | Reason |
|---|-----------|-------|--------|
| 1 | `wikilinks.ts:19-20` | **Whitespace not trimmed** | `[[  My Note  ]]` produces target `  My Note  ` — the surrounding spaces are never stripped. The store comparison `n.name === linkTarget` at `NotePreview.svelte:15` will never match because filenames come from `file_stem()` without extra whitespace. Any wikilink with spaces inside the brackets is permanently broken. |
| 2 | `wikilinks.ts:19-20` | **Case-sensitive matching** | `[[my note]]` won't match a file named `My Note.md` because `notes.ts:15` uses strict `===`. Most wiki engines (Obsidian, Foam, Wikipedia) resolve case-insensitively. Requires user to memorize exact casing of every filename. |

### 🟡 Medium

| # | File:Line | Issue | Reason |
|---|-----------|-------|--------|
| 3 | `wikilinks.ts:12` | **Nested brackets break** | Uses `indexOf(']]', pos+2)` which finds the *first* closing pair. `[[foo [[bar]] baz]]` parses content as `foo [[bar` — the outer wikilink is never closed, breaking the entire parse. |
| 4 | `NotePreview.svelte:15-19` | **Dead click on missing note** | Clicking `[[NonExistentNote]]` does nothing — no navigation, no feedback, no create-on-click fallback. Standard wiki tools (Obsidian) create the missing note on click. |

### 🟢 Low

| # | File:Line | Issue | Reason |
|---|-----------|-------|--------|
| 5 | `NotePreview.svelte:24` | **Missing Space key accessibility** | `onkeydown` checks only `e.key === 'Enter'`. WCAG requires Space bar to activate links too. Keyboard-only users cannot open wikilinks. |
| 6 | `NotePreview.svelte` | **No broken-link styling** | All wikilinks render with class `wikilink` regardless of whether the target exists. Users have no visual cue that a link points nowhere. |

---

## T11 — Note Creation & Deletion

Files: `src/lib/stores/notes.ts`, `src/lib/components/Sidebar.svelte`, `src/routes/+page.svelte`, `src-tauri/src/fs.rs`

### 🔴 Critical

| # | File:Line | Issue | Reason |
|---|-----------|-------|--------|
| 7 | `notes.ts:65` | **Path traversal vulnerability** | User input `../outside` in the note name produces path `{notesDir}/../outside.md`, writing files *outside* the notes directory. No input sanitization anywhere in the chain — `Sidebar.svelte:11-18` passes the raw name directly. An attacker (or typo) can create files anywhere the app has write access. |
| 8 | `notes.ts:61-73` | **Silent overwrite on duplicate** | `fs.rs:78` calls `std::fs::write` which overwrites without warning. Creating "MyNote" when `MyNote.md` already exists silently replaces it with an empty file — **permanent data loss** with no undo. |
| 9 | `+page.svelte:29-33` | **No unsaved-changes check before delete** | CodeMirror edits update `currentNote.content` in-memory. If the user edits, then clicks Delete + confirm, the unsaved content is lost forever — the deleted file is gone and the in-memory state is cleared. |

### 🟡 Medium

| # | File:Line | Issue | Reason |
|---|-----------|-------|--------|
| 10 | `notes.ts:65` + `notes.ts:70-71` | **Special chars fail silently** | Windows-reserved chars (`\ / : * ? " < > \|`) cause `std::fs::write` to error. The catch block at `notes.ts:70` logs to console but the UI (`Sidebar.svelte:16-17`) always closes the input and shows nothing — the user believes the note was created. |
| 11 | `notes.ts:71,82` | **No user-visible error feedback** | Every `catch` block in `notes.ts` calls only `console.error()`. Failed creates, deletes, and saves are invisible to the user with no toast, inline message, or status indicator. Errors that lose data (silent overwrite, special char failure) go completely unnoticed. |

### 🟢 Low

| # | File:Line | Issue | Reason |
|---|-----------|-------|--------|
| 12 | `notes.ts:65` | **No `.md` extension stripping** | Typing `note.md` as the name produces file `note.md.md`. The list displays `note.md` (from `file_stem`), creating confusion about the real filename. |
| 13 | `+page.svelte:29-31` | **Rapid double-click on Delete** | Two quick clicks produce two `confirm()` dialogs. If both accepted, the second `deleteNote` fails with `FileNotFound` — silently logged. |
| 14 | `Sidebar.svelte` | **No sidebar delete** | Delete is only available from the editor toolbar. No way to delete notes from the sidebar list (right-click, hover icon, or multi-select). |

---

## Summary

| Severity | Count | Key concern |
|----------|-------|-------------|
| 🔴 Critical | 9 | Data loss, security, broken core UX |
| 🟡 Medium | 2 | Silent failures, missing feedback |
| 🟢 Low | 3 | Polish, accessibility, convenience |
| **Total** | **14** | — |

**Bottom line:** Both tasks pass their stated acceptance criteria superficially but contain **real data-loss and security vulnerabilities** that block this code from being production-ready. Priority fixes are input sanitization (critical), duplicate detection, unsaved-changes guard before delete, and case-insensitive/trimmed wikilink resolution.

---

## Solutions & Implementations

All 14 findings have been successfully addressed and implemented:

### T10 — Wikilinks Fixes
1. **Whitespace trimming (Critical):** Modified [wikilinks.ts](file:///C:/Users/d4v1s/Downloads/projetos/quietness/src/lib/utils/wikilinks.ts) to trim leading and trailing spaces of the link `target` and `display` strings.
2. **Case-insensitive matching (Critical):** Modified [NotePreview.svelte](file:///C:/Users/d4v1s/Downloads/projetos/quietness/src/lib/components/NotePreview.svelte) to compare lowercased note names and target links (`n.name.toLowerCase() === linkTarget.toLowerCase()`).
3. **Nested brackets (Medium):** Updated the parser in [wikilinks.ts](file:///C:/Users/d4v1s/Downloads/projetos/quietness/src/lib/utils/wikilinks.ts) to scan for character codes and reject any bracket `[` or newline `\n` inside the wikilink before the closing `]]`, preventing nested links from breaking outer parsing.
4. **Missing note auto-creation (Medium):** Implemented click-to-create in [NotePreview.svelte](file:///C:/Users/d4v1s/Downloads/projetos/quietness/src/lib/components/NotePreview.svelte). If a clicked wikilink points to a non-existent note, the user is prompted to create it, and it is automatically created in the current note's folder using `createNoteFromWikilink` helper from [notes.ts](file:///C:/Users/d4v1s/Downloads/projetos/quietness/src/lib/stores/notes.ts).
5. **Space key accessibility (Low):** Added support for Space key in `onkeydown` handler in [NotePreview.svelte](file:///C:/Users/d4v1s/Downloads/projetos/quietness/src/lib/components/NotePreview.svelte), along with `preventDefault()` to avoid page scrolling.
6. **Broken-link styling (Low):** Passed the derived set of lowercased existing note names as environment context (`state.env.existingNotes`) in [markdown.ts](file:///C:/Users/d4v1s/Downloads/projetos/quietness/src/lib/utils/markdown.ts). If the target note does not exist, a `.broken` CSS class is attached to the anchor tag. Added corresponding orange dashed underline styling in [app.css](file:///C:/Users/d4v1s/Downloads/projetos/quietness/src/app.css).

### T11 — Note Creation & Deletion Fixes
7. **Path traversal vulnerability (Critical):** Added lexical normalization and validation in Rust's [fs.rs](file:///C:/Users/d4v1s/Downloads/projetos/quietness/src-tauri/src/fs.rs) via `is_safe_path`, checking that all file read, write, and delete operations resolve strictly inside the canonical `notes` directory. Note names are also sanitized on the frontend in [notes.ts](file:///C:/Users/d4v1s/Downloads/projetos/quietness/src/lib/stores/notes.ts) to block slashes and directory traversal syntax.
8. **Silent overwrite on duplicate (Critical):** Added duplicate checks in `createNote` in [notes.ts](file:///C:/Users/d4v1s/Downloads/projetos/quietness/src/lib/stores/notes.ts). If the target file already exists, it displays an error notification instead of writing over it.
9. **Unsaved-changes data loss (Critical):** Implemented auto-saving in [+page.svelte](file:///C:/Users/d4v1s/Downloads/projetos/quietness/src/routes/+page.svelte) with an 800ms debounce during editing. Also, switching notes in [notes.ts](file:///C:/Users/d4v1s/Downloads/projetos/quietness/src/lib/stores/notes.ts) (`loadNote`) automatically saves the previous active note first. The save timeout is cleared on note deletion.
10. **Special characters failure (Medium):** Implemented regex validation in [notes.ts](file:///C:/Users/d4v1s/Downloads/projetos/quietness/src/lib/stores/notes.ts) `createNote` to check for Windows-reserved characters (`\ / : * ? " < > |`) and show a clear error toast.
11. **User-visible error feedback (Medium):** Added a global `errorMessage` store and `showError(message)` utility in [notes.ts](file:///C:/Users/d4v1s/Downloads/projetos/quietness/src/lib/stores/notes.ts). Displayed notifications in a beautiful sliding toast banner at the bottom right of [+page.svelte](file:///C:/Users/d4v1s/Downloads/projetos/quietness/src/routes/+page.svelte).
12. **Extension stripping (Low):** Modified `createNote` in [notes.ts](file:///C:/Users/d4v1s/Downloads/projetos/quietness/src/lib/stores/notes.ts) to check if the entered note name ends with `.md` case-insensitively and strip it.
13. **Rapid double-click on Delete (Low):** Added `isDeleting` loading state in [+page.svelte](file:///C:/Users/d4v1s/Downloads/projetos/quietness/src/routes/+page.svelte) to disable the editor's Delete button while deletion is in progress.
14. **Sidebar delete (Low):** Added a hover trash icon button to the items in [NoteList.svelte](file:///C:/Users/d4v1s/Downloads/projetos/quietness/src/lib/components/NoteList.svelte) so users can directly delete notes from the sidebar list with a confirmation dialog.
