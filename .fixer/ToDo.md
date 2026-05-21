# ToDo - Quietness

> Project task management. Update as progress is made.

## Group 1 - Foundation

- [x] `T01` **Project scaffold** - Initialize Tauri + SvelteKit project, configure Tailwind CSS and TypeScript. *Criteria: `npm run dev` opens a window with Tailwind styles applied.*
- [ ] `T02` **CodeMirror 6 integration** - Add CodeMirror editor to `NoteEditor.svelte` with Markdown syntax highlighting and basic keybindings. *Criteria: editor renders and accepts typed Markdown text.*
- [ ] `T03` **markdown-it renderer** - Configure markdown-it in `utils/markdown.ts` with heading, bold, italic support. *Criteria: sample Markdown renders to HTML correctly.*

## Group 2 - Filesystem & Data Layer

- [ ] `T04` **Tauri filesystem commands** - Implement Rust commands in `commands.rs` to list, read, and write `.md` files in a notes directory. *Criteria: frontend can call Tauri commands and see file contents.*
- [ ] `T05` **Notes store** - Create Svelte store (`stores/notes.ts`) that loads notes from filesystem and maintains in-memory state. *Criteria: store reacts to file changes and updates UI.*

## Group 3 - Navigation (Sidebar)

- [ ] `T06` **Folder tree component** - Create `FolderTree.svelte` that reads folder structure and displays collapsible tree. *Criteria: folders shown in sidebar with expand/collapse.*
- [ ] `T07` **Note list component** - Create `NoteList.svelte` showing notes in selected folder. *Criteria: clicking a folder shows its notes, clicking a note opens it in editor.*
- [ ] `T08` **Sidebar layout** - Create `Sidebar.svelte` assembling folder tree + note list + search bar. *Criteria: sidebar renders with all sub-components.*

## Group 4 - Editor & Preview

- [ ] `T09` **Note editor with live preview** - Wire CodeMirror editor to markdown-it preview toggle/split view. *Criteria: typing Markdown shows rendered preview alongside or below.*
- [ ] `T10` **Wikilinks `[[]]` support** - Parse `[[wikilink]]` syntax in markdown-it plugin and link to existing notes. *Criteria: clicking a wikilink navigates to the target note.*
- [ ] `T11` **Note creation and deletion** - Add "New note", "Delete note" actions in sidebar/editor. *Criteria: creating a note adds `.md` file, deleting removes it.*

## Group 5 - Polish & Quietness

- [ ] `T12` **Minimalist theme** - Design a quiet, minimal Tailwind theme: muted colors, ample whitespace, no visual noise. *Criteria: theme applied and visually consistent across editor and sidebar.*
- [ ] `T13` **Search/filter notes** - Add search bar that filters notes by title and content. *Criteria: typing in search bar filters note list in real time.*
- [ ] `T14` **App icon and window config** - Configure Tauri window (title, size, decorations) and add app icon. *Criteria: window opens with correct title and icon.*
