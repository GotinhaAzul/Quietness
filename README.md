# Quietness

> Leve, offline note-taking app — minimalista, tranquilo, focado.

Quietness is a desktop note-taking application built with **Tauri** + **SvelteKit**. Every note is a plain `.md` file on your filesystem — no accounts, no cloud, no noise.

## Features

- **Markdown editing** with CodeMirror 6 — syntax highlighting, headings, bold, italic, lists, task lists (`- [ ]` / `- [x]`)
- **Live preview** rendered via markdown-it with scoped styling
- **Wikilinks** (`[[note-name]]`) — click to navigate between notes
- **Hierarchical folder tree** — organize notes in directories
- **Full-text search** with scope filter (current folder / all notes)
- **9 built-in themes** — Quiet Light/Dark, Catppuccin (Latte/Mocha), Everforest (Day/Night), GitHub (Light/Dark), Nord
- **Custom themes** — define your own color palette via the settings modal
- **Font customization** — choose any system font and size
- **Light/dark mode** toggle
- **Editor QoL** — dim inactive lines, auto-closing brackets/quotes, smooth animated cursor, tab indentation for lists
- **Interactive checkboxes** — click a checkbox in preview to toggle its state
- **Word count** in the editor footer
- **Keyboard shortcuts** — full set for navigation, editing, and search
- **Flama** — a pixel-art flame companion that follows your typing, idles with animations, and responds to editor mode
- **100% offline** — no internet connection required
- **Local `.md` files** — your notes are regular Markdown files you can open with any editor

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | [Tauri](https://tauri.app) v2 (Rust) |
| Frontend | [SvelteKit](https://kit.svelte.dev) + [Svelte](https://svelte.dev) 5 |
| Editor | [CodeMirror](https://codemirror.net) 6 |
| Markdown | [markdown-it](https://github.com/markdown-it/markdown-it) |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 |

### Backend (Rust)

Persisted and safe filesystem operations — note CRUD, folder management, search with `spawn_blocking` for non-blocking I/O.

### Frontend (SvelteKit)

Svelte 5 runes for reactive state, compartmentalized CodeMirror extensions, markdown render caching with LRU, and optimistic UI for instant create/delete feedback.

## Getting Started

```bash
npm install
npm run tauri dev
```

To run the web-only version (no Tauri backend):

```bash
npm run dev:web
```

## Building

```bash
npm run tauri build
```

## License

MIT
