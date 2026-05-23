# ToDo — Quietness V3

> Polimento final: performance, QoL e The Pet.
> Tasks organizadas por grupo. Marque `[x]` ao concluir.

## Group 1 — Performance / Snappiness

- [x] `T01` **Preview render throttle** — Implement tight throttle for NotePreview: update every 2ms. Completion: preview updates at 2ms granularity for maximum responsiveness.
- [x] `T02` **CSS transitions for UI movements** — Add CSS transitions (100-150ms ease-out or cubic-bezier) to sidebar slide, mode toggle buttons, and other UI movements. Completion: UI animations feel instantaneous but smooth.
- [x] `T03` **Optimistic UI for create/delete** — Update note list instantly on create/delete click, handling backend save/delete in background. Completion: app reacts at millisecond of click; backend failures surface as toasts.

## Group 2 — Editor QoL

- [x] `T04` **Dim inactive lines** — Add CodeMirror extension that dims non-active lines; toggle in SettingsModal. Completion: inactive lines are visually dimmed when enabled; toggle persists across sessions.
- [x] `T05` **Autocomplete brackets and quotes** — Add CodeMirror extension for auto-closing `'`, `` ` ``, `(`, `[`, `{`, `"`. Completion: typing an opening quote/bracket automatically inserts the closing pair.
- [x] `T06` **Smooth caret / animated cursor** — Add CodeMirror extension for fluid cursor animation (elastic stretch on movement); add toggle in SettingsModal. Completion: cursor slides smoothly between positions when enabled; can be disabled.
- [x] `T07` **Checkboxes / task lists** — Add markdown-it plugin for `- [ ]` / `- [x]` task list syntax; style in preview. Completion: checkboxes render correctly in preview with proper styling.

## Group 3 — Sidebar & Status

- [ ] `T08` **Note-scoped scrollbar** — Scope scrollbar to note container so oversized content doesn't push UI chrome or trigger full-page scroll. Completion: only the note area scrolls; sidebar, toolbar, and status bar remain fixed regardless of note length.
- [ ] `T09` **Word count** — Add small word/character count at bottom of NoteEditor. Completion: word count updates in real-time as user types.

## Group 4 — The Pet (Flama)

- [ ] `T10` **Sprite data + rendering** — Define pixel art sprites in `pet-sprites.ts` (big flame, small particle, burst/wiggle/spin frames); implement dual render loop in `FlamePet.svelte` with color customization. Completion: both flames render with editable colors and basic animation.
- [ ] `T11` **Core behaviors (separation + following)** — Big flame stays at preview corner; on typing, small particle separates and follows the last typed letter; position syncs with editor cursor. Completion: particle separates/attaches correctly based on typing activity.
- [ ] `T12` **Idle timer behaviors** — 2s inactive → small particle spins in place; 10s inactive → particle returns to big flame and merges; big flame does bursts/wiggles while idle in preview/split mode. Completion: idle animations trigger at correct timeouts and feel natural.
- [ ] `T13` **Mode-specific behavior** — Edit-only mode: small flame enters from screen edge (no big flame); preview/split mode: full big flame + particle behavior; handle mode switches gracefully (particle returns on mode change). Completion: behavior matches current editor mode without glitches.
- [ ] `T14` **Pet settings** — Add toggle on/off and color picker in SettingsModal; persist via settings store. Completion: pet is controllable from settings and responds to changes in real-time.
