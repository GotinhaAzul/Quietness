# ToDo - Quietness

> Project task management. Update as progress is made.

---

## ✅ Concluído — Foundation to Polish

### Group 1 - Foundation

- [x] `T01` **Project scaffold** - Initialize Tauri + SvelteKit project, configure Tailwind CSS and TypeScript. *Criteria: `npm run dev` opens a window with Tailwind styles applied.*
- [x] `T02` **CodeMirror 6 integration** - Add CodeMirror editor to `NoteEditor.svelte` with Markdown syntax highlighting and basic keybindings. *Criteria: editor renders and accepts typed Markdown text.*
- [x] `T03` **markdown-it renderer** - Configure markdown-it in `utils/markdown.ts` with heading, bold, italic support. *Criteria: sample Markdown renders to HTML correctly.*

### Group 2 - Filesystem & Data Layer

- [x] `T04` **Tauri filesystem commands** - Implement Rust commands in `commands.rs` to list, read, and write `.md` files in a notes directory. *Criteria: frontend can call Tauri commands and see file contents.*
- [x] `T05` **Notes store** - Create Svelte store (`stores/notes.ts`) that loads notes from filesystem and maintains in-memory state. *Criteria: store reacts to file changes and updates UI.*

### Group 3 - Navigation (Sidebar)

- [x] `T06` **Folder tree component** - Create `FolderTree.svelte` that reads folder structure and displays collapsible tree. *Criteria: folders shown in sidebar with expand/collapse.*
- [x] `T07` **Note list component** - Create `NoteList.svelte` showing notes in selected folder. *Criteria: clicking a folder shows its notes, clicking a note opens it in editor.*
- [x] `T08` **Sidebar layout** - Create `Sidebar.svelte` assembling folder tree + note list + search bar. *Criteria: sidebar renders with all sub-components.*

### Group 4 - Editor & Preview

- [x] `T09` **Note editor with live preview** - Wire CodeMirror editor to markdown-it preview toggle/split view. *Criteria: typing Markdown shows rendered preview alongside or below.*
- [x] `T10` **Wikilinks `[[]]` support** - Parse `[[wikilink]]` syntax in markdown-it plugin and link to existing notes. *Criteria: clicking a wikilink navigates to the target note.*
- [x] `T11` **Note creation and deletion** - Add "New note", "Delete note" actions in sidebar/editor. *Criteria: creating a note adds `.md` file, deleting removes it.*

### Group 5 - Polish & Quietness

- [x] `T12` **Minimalist theme** - Design a quiet, minimal Tailwind theme: muted colors, ample whitespace, no visual noise. *Criteria: theme applied and visually consistent across editor and sidebar.*
- [x] `T13` **Search/filter notes** - Add search bar that filters notes by title and content. *Criteria: typing in search bar filters note list in real time.*
- [x] `T14` **App icon and window config** - Configure Tauri window (title, size, decorations) and add app icon. *Criteria: window opens with correct title and icon.*

---

## 📋 Próximas tarefas — Temas & Customização

### Group 6 - Architecture & Theming System

- [x] `T15` **CSS Variables architecture** - Refactor `app.css` to use CSS custom properties throughout. Map `@theme` tokens to variables so themes can override by class (`.theme-everforest`, etc.). *Criteria: switching a class on `<html>` changes all colors in the app; Tailwind utility classes respond to the change.*

- [x] `T16` **Settings store + persistência** - Create `stores/settings.ts` with writable store for all user preferences (theme, fonts, sizes). Add Rust commands `save_settings` / `load_settings` that read/write `settings.json` in the notes directory. Wire auto-save on preference change. *Criteria: changing a setting persists across app restarts.*

### Group 7 - Settings UI

- [x] `T17` **Settings modal** - Add a settings button in the toolbar that opens a modal with tabs: Theme (cards with live preview), Fonts (family + size pickers), Editor (line numbers, word wrap, tab size). All changes apply in real time. *Criteria: user can open settings, switch theme, change font, close settings — and the UI reflects the new choices instantly.*

### Group 8 - Built-in Themes

- [x] `T18` **5+ built-in themes** - Create CSS files in `src/lib/themes/` for: Quiet Light (default), Quiet Dark, Catppuccin (Latte + Mocha), Everforest (Day + Night), GitHub (Light + Dark), Nord. Each defines `:root.theme-<name> { --color-*: ... }` overrides. *Criteria: all themes appear in the settings selector; switching between them changes colors across the entire app.*

### Group 9 - Font Customization

- [x] `T19` **Font customization** - Add font selectors in settings for UI (Inter, System, Atkinson), Editor (JetBrains Mono, Fira Code, Cascadia, monospace), Preview (Inter, Lora, Source Serif, Georgia). Size sliders (12–24px) for each. Apply via `--font-*` CSS variables. *Criteria: changing font/size in settings immediately updates the corresponding text in the app.*

### Group 10 - User Themes

- [ ] `T20` **User themes folder** - Watch a `_themes/` directory inside the notes folder. Any `.css` file placed there appears in the theme selector. Selected user theme is injected into the page. *Criteria: dropping a valid `.css` theme file into `_themes/` makes it selectable; selecting it applies the custom colors.*
