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
