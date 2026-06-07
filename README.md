# Quietness

> A quiet place to write.

A local-first, offline note-taking desktop app built with **Tauri** + **SvelteKit**. Your notes are plain `.md` files on your filesystem — no accounts, no cloud, no noise.

---

## Why Quietness?

| | Quietness | Typical Apps |
|---|---|---|
| **RAM usage** | ~4 MB | ~200 MB |
| **Bundle size** | ~10 MB | 200+ MB |
| **Offline** | 100% — always | Often requires internet |
| **Data format** | Plain `.md` files | Proprietary database |
| **Telemetry** | Zero | Often present |

Your notes stay yours. Open them with any editor, any time.

---

## Features

### Editor

- **CodeMirror 6** — syntax highlighting, bracket matching, auto-close brackets/quotes, rectangular selection, multiple cursors
- **Three view modes** — edit only, preview only, split side-by-side
- **Dim inactive lines** — subtle opacity fade on non-active lines
- **Smooth caret** — animated cursor with a slight overshoot bounce
- **Tab indentation** — configurable from 1 to 8 spaces
- **Inline rename** — click any note title to rename it in place
- **Word & character count** — live in the editor footer
- **LRU state cache** — instant note switching without reinitializing the editor

### Markdown & Links

- **Live preview** rendered via markdown-it
- **Highlight & strikethrough** — `==text==` renders as highlighted `<mark>`, `~~text~~` renders as `<del>` (strikethrough)
- **Wikilinks** — `[[note-name]]` to navigate, `[[target|display text]]` for custom labels. Click to jump; create missing notes on the fly
- **Interactive task lists** — click a checkbox in preview to toggle `[ ]` / `[x]` directly in the source
- **Scoped search** — find across all notes, current folder, or current note. Debounced, instant results

### Organization

- **Hierarchical folder tree** — create, rename, delete, and move notes/folders freely
- **Collapsible sidebar** — toggle between full width and icon-only
- **Note templates** — create reusable `.md` templates stored under `_templates/`. Pick from a dropdown, preview, and insert into the editor. Create and delete templates inline. Toggle on/off in settings
- **Backlinks panel** — `Ctrl+Shift+B` opens a modal showing outgoing wikilinks and incoming backlinks for the current note. Each entry shows the note name and folder; click to navigate. Toggle on/off in settings
- **Trash with retention** — deleted notes go to trash with configurable retention (default 30 days)
- **Home folder migration** — switch your notes directory with automatic content migration

---

## Customization

### 9 Built-in Themes

Each theme defines variables for the full interface — sidebar backgrounds, item hover/active states, icon colors, scrollbar styling, text selection, and more.

| Theme | Style |
|---|---|
| Quiet Light | Warm paper, soft contrast |
| Quiet Dark | Dark background, muted tones |
| Catppuccin Latte | Warm, gentle pastels |
| Catppuccin Mocha | Rich, cozy dark pastels |
| Everforest Day | Soft green-tinted light |
| Everforest Night | Deep green-tinted dark |
| GitHub Light | Clean, neutral light |
| GitHub Dark | Clean, neutral dark |
| Nord | Arctic, bluish cool tones |

### Your Own Themes

Drop `.css` files into the `_themes/` folder in your notes directory. They appear automatically in settings.

### Fonts

Independently configure fonts and sizes for three zones:

| Zone | Defaults | Options |
|---|---|---|
| **UI** | Inter | Inter, System, Atkinson Hyperlegible |
| **Editor** | JetBrains Mono | JetBrains Mono, Fira Code, Cascadia, monospace |
| **Preview** | Inter | Inter, Lora, Source Serif, Georgia |

Sizes range from 12 to 24px per zone.

### Editor Preferences

- Line numbers (toggle)
- Word wrap (toggle)
- Tab size (1-8)
- Dim inactive lines (toggle)
- Smooth caret animation (toggle)

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

| Layer | What it does |
|---|---|
| **Big Flame** | A particle emitter anchored to the bottom-right. Emits upward-drifting particles with a gentle breathing animation. Occasionally bursts or wiggles on its own. |
| **Small Particle** | A cross-shaped orb with 4 orbiting sparks. Separates from the flame to follow your cursor while you type. |
| **Ambient Particles** | 25 tiny embers that drift slowly upward across the entire viewport, wrapping at edges. Pure atmosphere. |

### Typing reactivity

| Time since last keystroke | Flama's state |
|---|---|
| **0-2 seconds** | Actively tracking your cursor. Sparks orbit normally. |
| **2-10 seconds** | Spins in place. If your mouse is nearby, sparks rearrange to face it. |
| **> 10 seconds** | Slowly drifts back to the flame and merges. |

### Personality

- **Breathing** — the big flame gently bobs with a sine wave
- **Bursts** — occasional extra particle flares (more likely when your mouse is close)
- **Wiggles** — the flame base oscillates side to side randomly
- **Wobble** — micro-displacements while idle give a subtle "alive" feel
- **Ember trail** — the small particle leaves fading embers as it moves

### Full color control

Five independently customizable color slots:

| Slot | Controls |
|---|---|
| `core` | Brightest center particles |
| `inner` | Mid-bright particles |
| `mid` | Mid-dim particles |
| `outer` | Dimmest particles, spark orbiters, glow aura |
| `ember` | Ember dots and trail |

All colors are editable in Settings > Pet with a reset-to-default button.

### Performance

- Pauses entirely when the tab is hidden
- Only runs if at least one layer is enabled
- Particle arrays are pruned each frame
- Uses `requestAnimationFrame` — no timers, no intervals

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | [Tauri](https://tauri.app) v2 (Rust) |
| Frontend | [SvelteKit](https://kit.svelte.dev) + [Svelte](https://svelte.dev) 5 |
| Editor | [CodeMirror](https://codemirror.net) 6 |
| Markdown | [markdown-it](https://github.com/markdown-it/markdown-it) |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 |

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
