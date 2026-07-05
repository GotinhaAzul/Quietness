<p align="center">
  <img src="src-tauri/icons/icon.png" width="96" alt="Quietness logo" />
</p>

<h1 align="center">Quietness</h1>

<p align="center">
  <em>A quiet place to write.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-6b7280?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/Tauri-v2-8b5cf6?style=flat-square" alt="Tauri" />
  <img src="https://img.shields.io/badge/Svelte-5-e34f26?style=flat-square" alt="Svelte" />
  <img src="https://img.shields.io/badge/Rust-1.80-dea584?style=flat-square" alt="Rust" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square" alt="TypeScript" />
  <img src="https://img.shields.io/badge/license-MIT-22c55e?style=flat-square" alt="License" />
</p>

---

A local-first, offline note-taking desktop app. Your notes are plain `.md` files on your filesystem — no accounts, no cloud, no noise.

"The best ideas often come from simple places."

---

## Why Quietness?

|                          | Quietness               | Typical Apps            |
| ------------------------ | ----------------------- | ----------------------- |
| **RAM usage**            | ~4 MB                   | ~200 MB                 |
| **Bundle size**          | ~10 MB                  | 200+ MB                 |
| **Offline**              | 100% — always           | Often requires internet |
| **Data format**          | Plain `.md` files       | Proprietary database    |
| **Telemetry**            | Zero                    | Often present           |

Your notes stay yours. Open them with any editor, any time — they're just markdown files.

---

## Features

### Editor

Built on **CodeMirror 6** with compartmentalized extensions for optimal performance:

- **Syntax highlighting**, bracket matching, auto-close brackets/quotes, rectangular selection, multiple cursors
- **Three view modes** — edit only, preview only, or split side-by-side
- **Per-note undo history** — isolated undo/redo per note via LRU state cache (max 15 entries), never cross-contaminated
- **Word & character count** — live counter in the editor footer
- **Smooth caret** — animated cursor with a subtle overshoot bounce
- **Dim inactive lines** — non-active lines fade slightly to reduce visual noise
- **Inline rename** — click any note title in the explorer to rename it in place
- **Configurable tab size** — 1 to 8 spaces
- **Save-status indicator** — subtle confirmation that your note has been saved
- **Optimistic UI** — instant feedback for create/delete operations

### Markdown & Links

- **Live preview** — rendered via [markdown-it](https://github.com/markdown-it/markdown-it) with caching (LRU, 100 entries)
- **Highlight & strikethrough** — `==text==` renders as `<mark>`, `~~text~~` as `<del>`
- **Wikilinks** — `[[note-name]]` to navigate, `[[target|display text]]` for custom labels. Click to jump; create missing notes on the fly
- **Interactive task lists** — click checkboxes in preview to toggle `[ ]` / `[x]` directly in the source

### Navigation & Search

- **Unified Explorer** — folder tree and note list merged into a single component. Browse hierarchically, or type to search and see flat results in place
- **Search with scope** — search across all notes, the current folder, or within the current note. Debounced, instant results with content snippets
- **Command Palette** — `Ctrl+P` to jump to any note by title, create a new note, or switch view modes. Fuzzy, case/accent-insensitive matching with ranked results
- **Breadcrumbs** — current note's folder path displayed in the toolbar for spatial awareness

### Organization

- **Note Templates** — reusable `.md` templates stored under `_templates/`. Pick from a dropdown with preview, insert content at cursor, or create a new note from template. Supports placeholder variables: `{date}`, `{time}`, `{datetime}`, `{title}`. Create and delete templates inline. Toggle on/off in settings
- **Backlinks Panel** — `Ctrl+Shift+B` opens a modal showing outgoing wikilinks and incoming backlinks for the current note. Each entry shows the note name and folder; click to navigate. Toggle on/off in settings
- **Trash with retention** — deleted notes go to `.trash/` with configurable retention period (default 30 days). Auto-cleanup runs periodically in the background
- **Home folder migration** — switch your notes directory at any time; existing notes are migrated automatically
- **Collapsible sidebar** — toggle between full width and icon-only
- **Keyboard shortcuts** — full set of shortcuts for power users:

  | Shortcut              | Action                   |
  | --------------------- | ------------------------ |
  | `Ctrl+P`              | Command Palette          |
  | `Ctrl+Shift+F`        | Focus search             |
  | `Ctrl+N`              | New note                 |
  | `Ctrl+Shift+N`        | New folder               |
  | `Ctrl+Shift+E`        | Edit mode                |
  | `Ctrl+Shift+S`        | Split mode               |
  | `Ctrl+Shift+P`        | Preview mode             |
  | `Ctrl+Shift+B`        | Backlinks panel          |
  | `Ctrl+Shift+D`        | Delete note (to trash)   |
  | `Ctrl+Shift+Delete`   | Permanent delete         |
  | `Ctrl+S`              | Save                     |
  | `Ctrl+,`              | Settings                 |

---

## Customization

### 9 Built-in Themes

Each theme defines variables for the full interface — sidebar backgrounds, item hover/active states, icon colors, scrollbar styling, text selection, and more.

| Theme                | Style                              |
| -------------------- | ---------------------------------- |
| Quiet Light          | Warm paper, soft contrast          |
| Quiet Dark           | Dark background, muted tones       |
| Catppuccin Latte     | Warm, gentle pastels               |
| Catppuccin Mocha     | Rich, cozy dark pastels            |
| Everforest Day       | Soft green-tinted light            |
| Everforest Night     | Deep green-tinted dark             |
| GitHub Light         | Clean, neutral light               |
| GitHub Dark          | Clean, neutral dark                |
| Nord                 | Arctic, bluish cool tones          |

### Your Own Themes

Drop `.css` files into the `_themes/` folder in your notes directory. They appear automatically in the settings.

### Fonts

Independently configure fonts and sizes for three zones:

| Zone      | Defaults       | Options                                             |
| --------- | -------------- | --------------------------------------------------- |
| **UI**    | Inter          | Inter, System, Atkinson Hyperlegible                |
| **Editor**| JetBrains Mono | JetBrains Mono, Fira Code, Cascadia, monospace      |
| **Preview**| Inter         | Inter, Lora, Source Serif, Georgia                  |

Sizes range from 12 to 24px per zone.

### Editor Preferences

- **Line numbers** — toggle on/off
- **Word wrap** — toggle on/off
- **Tab size** — 1 to 8 spaces
- **Dim inactive lines** — toggle on/off
- **Smooth caret** — toggle animation on/off

### Sidebar Customization

- **Accent color** — pick any color for the active item highlight and hover states via a color picker in Settings
- **Chrome opacity** — slider (0.0–1.0) controlling the opacity of borders, separators, and structural elements
- **Per-theme icons** — each theme carries its own set of folder and note icons (SVG masks), swapping automatically when you switch themes

---

## Flama

A pixel-art flame companion that lives in your editor.

Flama is not a gimmick — it's an ambient presence that reacts to what you're doing without demanding attention.

### How it works

Flama is rendered on a full-viewport canvas with three independent, toggleable layers:

| Layer              | What it does                                                                 |
| ------------------ | ---------------------------------------------------------------------------- |
| **Big Flame**      | A particle emitter anchored to the bottom-right. Emits upward-drifting particles with a gentle breathing animation. Occasionally bursts or wiggles on its own. |
| **Small Particle** | A cross-shaped orb with 4 orbiting sparks. Separates from the flame to follow your cursor while you type. |
| **Ambient Particles**| 25 tiny embers that drift slowly upward across the entire viewport, wrapping at edges. Pure atmosphere. |

### Typing reactivity

| Time since last keystroke | Flama's state                                                      |
| ------------------------- | ------------------------------------------------------------------ |
| **0–2 seconds**           | Actively tracking your cursor. Sparks orbit normally.              |
| **2–10 seconds**          | Spins in place. If your mouse is nearby, sparks rearrange to face it. |
| **> 10 seconds**          | Slowly drifts back to the flame and merges.                        |

### Personality

- **Breathing** — the big flame gently bobs with a sine wave
- **Bursts** — occasional extra particle flares (more likely when your mouse is close)
- **Wiggles** — the flame base oscillates side to side randomly
- **Wobble** — micro-displacements while idle give a subtle "alive" feel
- **Ember trail** — the small particle leaves fading embers as it moves

### Full color control

Five independently customizable color slots, all editable in Settings > Pet with a reset-to-default button:

| Slot    | Controls                                                                 |
| ------- | ------------------------------------------------------------------------ |
| `core`  | Brightest center particles                                                |
| `inner` | Mid-bright particles                                                      |
| `mid`   | Mid-dim particles                                                         |
| `outer` | Dimmest particles, spark orbiters, glow aura                              |
| `ember` | Ember dots and trail                                                      |

### Performance

- Pauses entirely when the tab is hidden
- Only runs if at least one layer is enabled
- Particle arrays are pruned each frame
- Uses `requestAnimationFrame` — no timers, no intervals

---

## Tech Stack

| Layer          | Technology                                                               |
| -------------- | ------------------------------------------------------------------------ |
| Desktop shell  | [Tauri](https://tauri.app) v2 (Rust)                                     |
| Frontend       | [SvelteKit](https://kit.svelte.dev) + [Svelte](https://svelte.dev) 5     |
| Editor         | [CodeMirror](https://codemirror.net) 6                                   |
| Markdown       | [markdown-it](https://github.com/markdown-it/markdown-it)                |
| Styling        | [Tailwind CSS](https://tailwindcss.com) v4                               |

### Backend (Rust)

Minimal dependency footprint: `serde`, `serde_json`, `log`, `chrono`, `tokio`. No database, no network libraries. Filesystem operations use `spawn_blocking` for non-blocking I/O.

### Frontend (SvelteKit)

Svelte 5 runes for reactive state. Compartmentalized CodeMirror extensions. Markdown render caching with LRU (100 entries). Editor state caching with LRU (15 entries). Single-character diff detection for minimal dispatches. Optimistic UI for instant create/delete feedback.

---

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
