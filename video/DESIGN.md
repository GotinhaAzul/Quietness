# Quietness Showcase Video — Design Tokens

> Derived from `src/lib/themes/quiet-dark.css`, adapted for video scale.

## Palette

| Token         | Hex       | Usage                        |
|---------------|-----------|------------------------------|
| bg            | `#1e1e1e` | Canvas background            |
| surface       | `#252525` | Cards, panels, sidebar       |
| border        | `#333333` | Dividers, panel edges        |
| text          | `#d4d4d4` | Primary text                 |
| muted         | `#888888` | Secondary text, metadata     |
| faded         | `#666666` | Tertiary text, inactive      |
| accent        | `#8b8178` | Active state, highlights     |
| hover         | `#2d2d2d` | Hover backgrounds            |
| active        | `#353535` | Active backgrounds           |

## Typography

- **UI:** Inter, system-ui, sans-serif (body 28px, labels 20px)
- **Editor:** JetBrains Mono, Fira Code, monospace (18px)
- **Headlines:** 72-96px, weight 700
- **Overlays:** 32-42px, weight 600

## Motion

- Entrance: 0.4-0.6s, `power2.out` or `power3.out`
- Transitions: CSS crossfade, 0.5s, `power2.inOut`
- Background ambient: Breathing pulse, 4s cycle, opacity 0.3→0.5
- No aggressive motion, no bounce, no elastic

## Palette Avoidance

- No pure `#000` or `#fff` — always tint toward accent
- No gradient text
- No neon/cyan accents
- No left-edge accent stripes
