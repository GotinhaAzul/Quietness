# Changes

| # | Entry | Date | Area |
|---|-------|------|------|
| 1 | Initial planning via Fixer | 2026-05-21 | Meta |
| 2 | Docs alignment (SvelteKit terminology) | 2026-05-21 | Meta |
| 3 | **T01** — SvelteKit + Tauri + Tailwind scaffold | 2026-05-21 | Foundation |
| 4 | **T02** — CodeMirror 6 editor with Markdown highlighting | 2026-05-21 | Editor |
| 5 | **T03** — markdown-it renderer + preview panel | 2026-05-21 | Editor |
| 6 | **T04** — Tauri FS commands (list/read/write .md) | 2026-05-21 | Backend |
| 7 | **T05** — Reactive notes store | 2026-05-21 | Frontend |
| 8 | **T06+T07** — Folder tree + note list in sidebar | 2026-05-22 | UI |
| 9 | **T08** — Sidebar layout (SearchBar + header) | 2026-05-22 | UI |
| 10 | **T09** — Edit/Split/Preview mode toggle | 2026-05-22 | Editor |
| 11 | **T10** — Wikilinks `[[Note]]` parsing + navigation | 2026-05-22 | Editor |
| 12 | **T11** — Note creation (+ New) + deletion (Delete) | 2026-05-22 | UI |
| 13 | Fixes for T10 & T11 review (14 issues) | 2026-05-22 | Fixes |
| 14 | **T12** — Minimalist "quiet" Tailwind theme | 2026-05-22 | Styling |
| 15 | **T14** — App icon + window config (1000×700) | 2026-05-22 | Config |
| 16 | Planned Groups 6–10 (themes & customization) in ToDo.md | 2026-05-22 | Planning |
| 17 | **T15** — CSS custom properties architecture (`--q-*` semantic tokens, `@theme` mapping, `theme-*` class support) | 2026-05-22 | Theming |
| 18 | **T16** — Settings store + persistência (`stores/settings.ts`, Rust `save_settings`/`load_settings`, `settings.json` in notes dir, auto-save with debounce) | 2026-05-22 | Settings |
| 19 | **T17** — Settings modal (gear button, 3-tab modal: Theme cards, Fonts+Size pickers, Editor prefs), real-time application via CSS vars + store | 2026-05-22 | Settings |
| 20 | **T19** — Font customization (UI/Editor/Preview font selectors + size sliders 12–24px, FONT_STACKS mapping, --q-font-* + --q-size-* CSS vars applied via $effect) | 2026-05-22 | Settings |
| 21 | **T20** — User themes folder: Rust `list_user_themes`/`read_user_theme_css` commands, `stores/userThemes.ts` store, theme selector in SettingsModal, CSS injection via `<style data-user-theme>` in `+page.svelte` | 2026-05-22 | Theming |
| 22 | **T21** — Replace hardcoded `#5a514a`/`#a83838` in wikilink & preview link hover states with `var(--q-text)` / `var(--q-danger)` | 2026-05-22 | Theming |
| 23 | **T22** — Replace `bg-white/70` and `bg-white/80` in Sidebar, SearchBar, SettingsModal with `bg-quiet-surface/60` / `bg-quiet-surface` | 2026-05-22 | Theming |
| 24 | **T23** — Add CodeMirror theme extension in `NoteEditor.svelte` that reads `--q-*` CSS vars (bg, text, accent, surface, hover, faded, border) for editor colors | 2026-05-22 | Theming |
| 25 | **V2 Planning** — intent.md updated with V1/V2 split; ADR created; structure.md corrected; ToDo.md with 19 V2 refinement tasks | 2026-05-22 | Meta |
| 26 | **T01-T07** — V2 Group 1 stability tasks: content sync loop fix (NoteEditor.svelte), hardened is_safe_path (fs.rs), stale-request cancellation (NoteList.svelte), user-facing error handling (folders.ts, settings.ts, NoteList.svelte), startup race condition fix (+page.svelte), beforeunload unsaved warning (+page.svelte), empty catch logging (userThemes.ts) | 2026-05-22 | Stability |
| 27 | **T22** — Code format rendering: monospace font + text-color on inline `code`, monospace font + border + line-height on `pre`, font-size on `pre code` | 2026-05-22 | Styling |
| 28 | **T08** — Search optimization: async `search_notes` with `spawn_blocking` for content reads; in-memory `HashMap` filename index (`ENTRY_CACHE`) with lazy build + invalidation on write/delete/rename; `Clone` on `NoteEntry` | 2026-05-22 | Backend |
| 29 | **T12 (backend)** — `rename_note` command: `fs::rename_note` with path-safety check, name validation (no `/`, `\`, `..`), `.md` extension preservation, overwrite prevention; registered in `lib.rs` | 2026-05-22 | Backend |
| 30 | **T23 (backend)** — Search scope filter: `scope` param (`"current_note"`, `"current_folder"`, `"all_notes"`) + optional `scope_path`; backward-compatible via `Option<String>` defaulting to `"all_notes"` | 2026-05-22 | Backend |
| 31 | **T12, T13, T15, T16, T17, T23 (frontend)** — Note rename UI (pencil icon + inline input), sidebar collapse toggle (store + animation), search feedback (count + results dropdown), auto-focus new note input (`bind:this` + `$effect`), focus trap in SettingsModal, search scope filter (3 options) | 2026-05-22 | Frontend |
| 32 | **T09, T10, T19, T20** — NoteEditor: compartment split (editor-only settings refire), markdown.ts: renderMarkdown() memoization by content hash (50-entry LRU), CM6 undo history per note path (EditorState save/restore), inline title editing (click-to-rename with invoke + stores update) | 2026-05-22 | Editor |
| 33 | **T11, T14, T18, T21** — Global keyboard shortcuts (Ctrl+S/N/,/Shift+F/E/S/P), save status indicator (Saving…/Saved/Unsaved), error toast dismiss + stacking (array of toasts with × dismiss), settings always accessible (gear button outside `{#if $currentNote}`) | 2026-05-22 | Frontend |
| 34 | **Fix `is_safe_path` + `read_user_theme_css`** — Windows `Prefix`/`RootDir` component reconstruction in `is_safe_path` and `read_user_theme_css` dropped drive letter (`C:`), causing `starts_with` to always return `false`. Replaced manual component-loop with direct `canon_target.starts_with(&canon_base)`. | 2026-05-22 | Backend |
| 35 | **Fix rename false-positive** — `rename_note` in `fs.rs`: `new_path.exists()` check did not account for same-file renames (case-insensitive FS, no-op rename). Added path comparison + `canonicalize()` dedup. Added no-op guard in `NoteList.svelte:handleRename`. | 2026-05-22 | Backend |
| 36 | **Fix split view note-switching bug** — `NoteEditor.svelte`: removed truthy guards (`if (newContent)`) that skipped content update when target note content is empty; added cached-state content validation (`saved.doc.toString() === newContent`) before restoring undo history to prevent stale rehydration. Fixes editor/preview divergence when switching to/creating empty notes. | 2026-05-22 | Editor |
| 37 | **Fix rename double-submit + stale sidebar title** — Added shared `noteRename` helper with tests, blocked duplicate blur/Enter rename submissions in `NoteList.svelte` and `NoteEditor.svelte`, normalized optional `.md` suffix, updated local/sidebar note entries immediately, and emitted `noteListChanged` from editor title renames so new titles appear without refresh. | 2026-05-22 | Frontend |
| 38 | **Group 4** — Performance audit report with 18 optimization tasks (T24-T41) added to ToDo.md; each task annotated with simplicity/risk observations | 2026-05-22 | Performance |
| 39 | **Group 4 refresh** — Parallel sub-agent performance scan reviewed completed ToDos and added safe non-duplicate optimization tasks T24-T31 to `.fixer/ToDo.md`; ignored duplicate/incremental candidates already covered by T08-T10/T19. | 2026-05-23 | Planning |
