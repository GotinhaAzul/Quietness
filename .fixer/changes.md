# Changes

## V1 — Foundation (May 21-22)

| # | Entry | Date |
|---|-------|------|
| 1-2 | Initial Fixer planning + SvelteKit terminology alignment | May 21 |
| 3-5 | **T01-T03** — SvelteKit + Tauri + Tailwind scaffold, CodeMirror 6, markdown-it preview | May 21 |
| 6-12 | **T04-T11** — Tauri FS commands, stores, sidebar, folder/note tree, edit/split/preview, wikilinks, note CRUD | May 21-22 |
| 13-24 | Fixes, quiet theme, app icon, theming system (CSS vars, user themes, settings, fonts, CM theme), planning | May 22 |

## V2 — Refinement (May 22-23)

| # | Entry | Date |
|---|-------|------|
| 25 | V2 Planning — intent.md, ADR, structure.md, ToDo.md with 19 tasks | May 22 |
| 26 | **T01-T07** — Stability: content sync, path safety, stale-request cancel, error handling, startup race, beforeunload, empty catch | May 22 |
| 27 | **T22** — Code format rendering styling | May 22 |
| 28-30 | **T08/T12/T23 (backend)** — Search optimization (spawn_blocking + HashMap index), rename_note command, search scope filter | May 22 |
| 31 | **T12/T13/T15-T17/T23 (frontend)** — Rename UI, sidebar collapse, search feedback, auto-focus, focus trap, scope filter | May 22 |
| 32 | **T09/T10/T19/T20 (editor)** — Compartment split, markdown memoization, undo history per note, inline title editing | May 22 |
| 33 | **T11/T14/T18/T21** — Keyboard shortcuts, save status, error toasts, settings always accessible | May 22 |
| 34-37 | **Fixes (4x)** — is_safe_path Windows, rename false-positive, split view note-switch, rename double-submit | May 22 |
| 38-39 | **Group 4** — Performance audit (18 tasks T24-T41) + refresh with non-duplicate candidates | May 22-23 |
| 40-43 | **T26/T27/T28/T31** — Folder tree expand opt, CM reconfigure removal, wikilink indexed lookup, redundant FS checks | May 23 |
| 44-45 | **T32 + UI** — Editor selection visibility, optimistic note list (loading flicker removed) | May 23 |

## V3 — Polimento Final (May 23+)

| # | Entry | Date |
|---|-------|------|
| 46 | V3 Planning — intent.md updated, ADR created, structure.md (pet/ dir), ToDo.md with 12 tasks | May 23 |
| 47-49 | **T01-T03** — Preview render throttle (debounce 50ms), CSS transitions (sidebar/mode toggle), optimistic UI for create/delete | May 23 |
| 50 | **T01** — Changed throttle from 50ms debounce to 2ms throttle for snappier preview updates | May 23 |
| 51 | **T04** — Dim inactive lines: CodeMirror extension with Compartment toggle, setting in SettingsModal, persisted via settings store | May 23 |
| 52 | **T05** — Autocomplete brackets/quotes: closeBrackets() from @codemirror/autocomplete + custom backtick auto-close keymap | May 23 |
| 53 | **T06** — Smooth caret/animated cursor: CodeMirror extension with elastic cubic-bezier transition on .cm-cursor, Compartment toggle in NoteEditor, setting + toggle in SettingsModal | May 23 |
| 54 | **T07** — Checkboxes/task lists: markdown-it plugin detecting `- [ ]` / `- [x]` syntax, inserts checkbox HTML in preview, scoped styling in NotePreview | May 23 |
| 55 | **T08 fix** — Locked app shell/page scroll, bounded editor/preview scroll areas, styled settings sliders, fixed stale delete/sidebar state and markdown cache key | May 23 |
| 56 | **Robust deletion** — Guard against double-delete in `deleteNote()`, fix rollback bug (noteEntries not restored on failure via `noteListChanged` in `finally`), CSS slide transition (150ms) in NoteList, custom ConfirmModal replacing native `confirm()`, Ctrl+Shift+D shortcut, EditorState cache cleanup on delete | May 23 |
| 57 | **Delete UI sync fix** — Added shared optimistic-delete filtering for stale note/search results so deleted notes disappear immediately and do not reappear during async list refresh | May 23 |
| 58 | **Instant delete feedback** — Removed sidebar delete slide transition and yielded one paint frame before invoking filesystem delete so optimistic removal renders before backend work | May 23 |
| 59 | **Open-note delete close fix** — Normalized note path identity for delete so deleting an open note clears editor/preview even when path separators or casing differ | May 23 |
| 60 | **Over-engineering cleanup** — Removed Rust search entry cache/invalidation, simplified rename helper to `string | null`, and dropped delete paint scheduler helper while keeping stale-list optimistic filtering | May 23 |
| 61 | **Over-engineering review fixes** — Replaced markdown hash cache key with exact content/context key + LRU promotion, moved toast state to `stores/errors.ts`, removed `noteListChanged` counter in favor of `$notes` invalidation, and simplified SettingsModal focus handling | May 23 |
| 62 | **Delete modal flush fix** - Added confirmed-action sequencing so delete confirmation closes, flushes Svelte DOM, and yields one paint frame before optimistic delete/backend work starts | May 23 |
| 63 | **Delete backend unblock fix** - Moved the Tauri `delete_note` command onto `spawn_blocking` so filesystem deletion cannot hold the app main thread and block clicks after the dialog closes | May 23 |
| 64 | **Delete click recovery hardening** - Made confirm delete handlers fire-and-forget after modal dismissal and changed ConfirmModal wrapper to avoid acting as an invisible pointer-event shield | May 23 |
| 65 | **Backend-confirmed delete refresh** - Removed optimistic sidebar/search filtering for delete; lists now refresh from disk after `delete_note`, while deleting the open note still clears editor/preview immediately and restores on failure | May 23 |
| 66 | **T08a — Tab/Shift+Tab list indentation** — Added `keymap.of([indentWithTab])` from `@codemirror/commands` to CodeMirror extensions; Tab indents list items, Shift+Tab outdents, with no conflict with focus-trap navigation | May 23 |
| 67 | **T08b — Polished list preview styles** — Enhanced `app.css` with nested bullet hierarchy (`disc` → `circle` → `square`), ordered list numbering (`decimal` → `lower-alpha` → `lower-roman`), tighter spacing, and task-list-item flex layout | May 23 |
| 68 | **T08c — Interactive preview checkboxes** — `tasklists.ts` now emits `data-list-index` and removes `disabled`; `toggleMarkdownCheckbox()` helper locates and flips the N-th checkbox in source markdown (code-block-aware); `NotePreview.svelte` intercepts checkbox clicks, patches `$currentNote.content`, and uses `getSingleDiff` in `NoteEditor.svelte` to dispatch a 1-character CodeMirror change, preserving cursor and undo history | May 23 |
| 69 | **T10 — Sprite data + rendering** — Added `PetColorPalette`/`PetSettings` types, `pet` defaults in store, `pet-sprites.ts` config, `FlamePet.svelte` dual render loop (big flame particles + small orb/sparks), mounted in `+page.svelte` | May 23 |
