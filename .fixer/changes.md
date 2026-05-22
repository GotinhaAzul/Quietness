# Changes

## Initial Workflow
- **Date:** 2026-05-21
- **Description:** Initial planning completed via Fixer.
- **Reason:** Project initial setup.
- **Alternatives considered:** None (first run).
- **Expected impact:** Directory structure, tasks, and agent rules defined.
- **Authorization:** User.

## Initial Workflow Completed
- **Date:** 2026-05-21
- **Description:** All Fixer stages completed.
- **Project structured and ready for execution.**

## Docs Alignment
- **Date:** 2026-05-21
- **Description:** Updated project meta docs to use SvelteKit wording where the frontend framework was previously described as plain Svelte + Vite.
- **Reason:** Keep documentation terminology consistent with the intended frontend stack.

## T01 Project Scaffold
- **Date:** 2026-05-21
- **Description:** Scaffolded the SvelteKit frontend, initialized Tauri, configured Tailwind CSS, and verified the build and dev startup path.
- **Reason:** Complete T01 foundation work so the project can run as a desktop app with the approved stack.
- **Alternatives considered:** Using the plain Svelte Tauri template was rejected because it would conflict with the planned SvelteKit structure.
- **Expected impact:** `npm run dev` starts the desktop development flow, `npm run build` outputs the static frontend bundle, and the project is ready for T02.
- **Authorization:** User.

## T02 CodeMirror 6 Integration
- **Date:** 2026-05-21
- **Description:** Installed `codemirror` and `@codemirror/lang-markdown`. Created `src/lib/components/NoteEditor.svelte` with CodeMirror 6, basic keybindings, Markdown syntax highlighting, and a reactive content binding. Updated the main page to render the editor inside a styled container.
- **Reason:** Complete T02 — provide an editor that renders and accepts typed Markdown text.
- **Alternatives considered:** Plain textarea — rejected because we need Markdown syntax highlighting and extensibility.
- **Expected impact:** `npm run build` succeeds. The editor renders in the dev window and accepts typed input with Markdown highlighting.
- **Authorization:** User.

## T03 markdown-it Renderer
- **Date:** 2026-05-21
- **Description:** Installed markdown-it. Created `src/lib/utils/markdown.ts` with `renderMarkdown()` supporting headings, bold, and italic. Created `src/lib/components/NotePreview.svelte` to display rendered HTML. Updated the main page with a split editor/preview layout showing sample Markdown.
- **Reason:** Complete T03 — provide a Markdown renderer as the foundation for the preview panel.
- **Alternatives considered:** None.
- **Expected impact:** `npm run build` succeeds. The preview panel renders sample Markdown (headings, bold, italic) correctly next to the editor.
- **Authorization:** User.

## T04 Tauri Filesystem Commands
- **Date:** 2026-05-21
- **Description:** Created `src-tauri/src/fs.rs` with filesystem logic (notes directory resolver, list/read/write .md files). Created `src-tauri/src/commands.rs` with Tauri commands (`list_notes`, `get_notes_dir`, `read_note`, `write_note`). Updated `src-tauri/src/lib.rs` to register `commands` and `fs` modules and the invoke handler.
- **Reason:** Complete T04 — frontend can call Tauri commands to interact with .md files in a dedicated notes directory under app data.
- **Alternatives considered:** Using `tauri-plugin-fs` — rejected to keep dependencies minimal and logic self-contained.
- **Expected impact:** `npm run build` (frontend) succeeds. Custom Tauri commands are registered and available via `invoke()` from the frontend.
- **Authorization:** User.

## T05 Notes Store
- **Date:** 2026-05-21
- **Description:** Created `src/lib/stores/notes.ts` with three writable stores (`notes`, `currentNote`, `loading`) and five exported async functions (`loadNotes`, `loadNote`, `saveCurrentNote`, `saveNote`, `createNote`). Store loads note listing from filesystem via Tauri `list_notes`, reads individual note content via `read_note`, persists via `write_note`.
- **Reason:** Complete T05 — frontend has a reactive store that maintains in-memory note state and synchronizes with the filesystem.
- **Alternatives considered:** Svelte 5 runes with `$state` — rejected in favor of shared writable stores for cross-component reactivity.
- **Expected impact:** `npm run build` succeeds. Store loads notes on call and exposes them reactively to subscribing components.
- **Authorization:** User.

## T06 Folder Tree Component + T07 Note List Component
- **Date:** 2026-05-22
- **Description:** Implemented folder tree and note list navigation in sidebar.
  - Added `FolderEntry` struct and `list_folders` / `list_notes_in_folder` Rust commands to `src-tauri/src/fs.rs` and `commands.rs`, registered in `lib.rs`.
  - Created `src/lib/stores/folders.ts` with writable stores for folder list and selected folder.
  - Created `src/lib/components/FolderTree.svelte` — recursive collapsible tree component that reads folder structure via `list_folders` and builds a tree from flat paths. Supports expand/collapse toggle and folder selection via `selectedFolder` store.
  - Created `src/lib/components/NoteList.svelte` — lists `.md` notes in the selected folder via `list_notes_in_folder`. Clicking a note calls `loadNote` from the notes store to open it in the editor.
  - Updated `src/routes/+page.svelte` with sidebar layout containing FolderTree + NoteList. Editor and Preview panels now display the active note from the store. Shows a welcome message when no note is selected.
- **Reason:** Complete T06 and T07 — provide filesystem-based folder navigation and note listing in the sidebar.
- **Alternatives considered:** Returning nested folder tree from Rust (rejected — simpler to build tree from flat list on frontend). Using `list_notes` with folder filtering (rejected — added dedicated `list_notes_in_folder` to keep backward compatibility).
- **Expected impact:** `npm run build` succeeds. Sidebar shows folders with expand/collapse, clicking a folder filters notes, clicking a note opens it in the split editor.
- **Authorization:** User.

## T08 Sidebar Layout
- **Date:** 2026-05-22
- **Description:** Created `src/lib/components/SearchBar.svelte` with a search input and search icon. Created `src/lib/components/Sidebar.svelte` assembling SearchBar, FolderTree, and NoteList with the app header. Refactored `src/routes/+page.svelte` to use the new `Sidebar` component instead of inline sidebar markup.
- **Reason:** Complete T08 — extract sidebar into a standalone component with all sub-components (folder tree, note list, search bar) as specified in the structure plan.
- **Alternatives considered:** Keeping sidebar markup inline in the page (rejected — Sidebar.svelte exists in structure.md as the designated container component).
- **Expected impact:** `npm run build` succeeds. Sidebar renders with app header, search bar, folder tree, and note list. No visual or functional regression.
- **Authorization:** User.

## T09 Note Editor with Live Preview
- **Date:** 2026-05-22
- **Description:** Created `src/lib/stores/editor.ts` with `viewMode` writable store ('edit' | 'preview' | 'split'). Updated `src/routes/+page.svelte` with a mode toggle (Edit/Split/Preview buttons in the header) and conditional rendering — shows editor only, preview only, or side-by-side split based on selected mode. Live preview already worked reactively via the store; this adds the toggle/split view UX.
- **Reason:** Complete T09 — provide toggle between editor-only, preview-only, and split view with live Markdown preview.
- **Alternatives considered:** None.
- **Expected impact:** `npm run build` succeeds. User can toggle between edit, split, and preview modes. Typing Markdown in the editor updates the preview in real time.
- **Authorization:** User.

## T10 Wikilinks Support
- **Date:** 2026-05-22
- **Description:** Created `src/lib/utils/wikilinks.ts` as a markdown-it inline ruler plugin that parses `[[wikilink]]` and `[[target|display]]` syntax into anchor tags with `data-wikilink` attributes. Integrated the plugin into `src/lib/utils/markdown.ts`. Updated `src/lib/components/NotePreview.svelte` with a click handler that resolves wikilinks against the notes store and navigates via `loadNote`. Added `a.wikilink` visual styling in `src/app.css`. Made `list_notes` recursive in `src-tauri/src/fs.rs` so wikilinks can resolve notes in subdirectories.
- **Reason:** Complete T10 — wikilinks parsed in rendered Markdown, clicking a wikilink navigates to the target note.
- **Alternatives considered:** Using a separate link resolution step before rendering (rejected — cleaner to keep resolution in the click handler). Restricting to flat notes directory (rejected — recursive listing gives richer wiki linking).
- **Expected impact:** `npm run build` succeeds. Typing `[[Note Name]]` or `[[Note Name|Display]]` in the editor renders as a styled link in preview, clicking it opens the matching note.
- **Authorization:** User.

## T11 Note Creation and Deletion
- **Date:** 2026-05-22
- **Description:** Added `+ New` button in Sidebar.svelte that reveals an inline text input; pressing Enter creates a new `.md` file in the currently selected folder (or root) via the store's `createNote`. Added `Delete` button in the editor toolbar in `+page.svelte` with a confirmation dialog. Added `delete_note` Rust command in `src-tauri/src/fs.rs` and `commands.rs`, registered in `lib.rs`. Added `deleteNote` async function and `noteListChanged` signal store in `src/lib/stores/notes.ts`. Modified `createNote` to accept a `folder` parameter for subfolder placement. Updated `NoteList.svelte` to watch `noteListChanged` for reactive refresh after create/delete.
- **Reason:** Complete T11 — user can create notes via the sidebar and delete the currently open note from the editor toolbar.
- **Alternatives considered:** Context-menu delete on note list items (rejected — simpler and more discoverable to have the delete button in the toolbar). Using a modal for note creation (rejected — inline input is more minimal and immediate).
- **Expected impact:** `npm run build` succeeds. Clicking "+ New" shows a text input, pressing Enter creates the note and opens it. Clicking "Delete" with a confirmation removes the note file.
- **Authorization:** User.

## Fixes for T10 & T11 Review Findings
- **Date:** 2026-05-22
- **Description:** Resolved all 14 issues raised in [.fixer/review-t10-t11.md](file:///C:/Users/d4v1s/Downloads/projetos/quietness/.fixer/review-t10-t11.md).
  - Fixed wikilinks to trim whitespace, match case-insensitively, handle nested brackets, support Space key accessibility, check note existence, style broken links (orange), and auto-create missing notes on click.
  - Fixed creation/deletion by adding Rust-side `is_safe_path` validation against path traversal, preventing duplicate overwrite on create, adding debounced auto-save (800ms) and switch-note auto-save, validating note names for special characters, displaying error notifications in a global sliding toast banner, stripping `.md` extension on creation, disabling Delete button to prevent double-click, and adding sidebar deletion capabilities on hover.
- **Reason:** Address critical security, data loss, and UX bugs identified in code review.
- **Alternatives considered:** Auto-saving continuously without debouncing (rejected due to excessive Tauri calls).
- **Expected impact:** Safe filesystem access, complete prevention of note overwriting/traversal, zero data loss on editor switches, and accessible case-insensitive wikilinks.
- **Authorization:** User.
