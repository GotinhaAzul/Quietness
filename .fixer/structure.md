# Project Structure — Quietness

> ⚠️ This structure is the first version. During development, revise it
> whenever something doesn't fit well.

```
quietness/
├── src/                          # Código frontend (SvelteKit)
│   ├── lib/
│   │   ├── components/           # Componentes Svelte reutilizáveis
│   │   │   ├── FolderTree.svelte       # Árvore de pastas na sidebar
│   │   │   ├── NoteEditor.svelte       # Editor CodeMirror 6
│   │   │   ├── NoteList.svelte         # Lista de notas na sidebar
│   │   │   ├── NotePreview.svelte      # Preview Markdown renderizado
│   │   │   ├── SearchBar.svelte        # Busca na sidebar
│   │   │   ├── SettingsModal.svelte    # Modal de configurações
│   │   │   ├── Sidebar.svelte          # Barra lateral com notas e pastas
│   │   ├── stores/               # Stores Svelte (estado global)
│   │   │   ├── editor.ts         # Estado do editor CodeMirror
│   │   │   ├── folders.ts        # Estado das pastas
│   │   │   ├── notes.ts          # Estado das notas
│   │   │   ├── settings.ts       # Estado das configurações
│   │   │   ├── ui.ts             # Estado da interface
│   │   │   └── userThemes.ts     # Temas customizados do usuário
│   │   ├── themes/               # Folhas de estilo de temas
│   │   │   ├── catppuccin-latte.css
│   │   │   ├── catppuccin-mocha.css
│   │   │   ├── everforest-day.css
│   │   │   ├── everforest-night.css
│   │   │   ├── github-dark.css
│   │   │   ├── github-light.css
│   │   │   ├── nord.css
│   │   │   ├── quiet-dark.css
│   │   │   └── quiet-light.css
│   │   ├── utils/                # Funções utilitárias
│   │   │   ├── fonts.ts          # Gerenciamento de fontes
│   │   │   ├── markdown.ts       # Configuração do markdown-it
│   │   │   ├── noteRename.ts     # Lógica de renomeação de notas
│   │   │   ├── noteRename.test.ts# Testes para rename
│   │   │   └── wikilinks.ts      # Parse/resolve de links [[]]
│   │   └── types/                # Tipos TypeScript
│   │       └── settings.ts       # Tipos das configurações
│   ├── routes/                   # Rotas SvelteKit
│   │   ├── +layout.svelte        # Layout principal
│   │   ├── +layout.ts            # Configuração do layout
│   │   └── +page.svelte          # Página principal
│   ├── app.css                   # Estilos globais + Tailwind
│   ├── app.html                  # HTML template
│   └── global.d.ts               # Tipos globais
├── src-tauri/                    # Backend Tauri (Rust)
│   ├── src/
│   │   ├── commands.rs           # Comandos Tauri
│   │   ├── fs.rs                 # Lógica de arquivos .md
│   │   ├── lib.rs                # Setup e plugins Tauri
│   │   └── main.rs               # Entry point Tauri
│   ├── capabilities/
│   │   └── default.json          # Permissões Tauri
│   ├── icons/                    # Ícones do app (convenção Tauri v2)
│   ├── build.rs                  # Script de build
│   ├── Cargo.toml
│   ├── Cargo.lock
│   └── tauri.conf.json
├── .gitignore
├── AGENTS.md                     # Regras operacionais do agente
├── intent.md                     # Intenção e escopo do projeto
├── package.json
├── package-lock.json
├── quietness.ico                 # Ícone do app (Windows)
├── svelte.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

### Directory purpose

| Directory | Purpose |
|-----------|---------|
| `src/lib/components/` | Componentes Svelte reutilizáveis da interface |
| `src/lib/stores/` | Stores Svelte reativas para estado global |
| `src/lib/themes/` | Folhas de estilo CSS dos temas |
| `src/lib/utils/` | Utilitários (Markdown, wikilinks, fontes) |
| `src/lib/types/` | Tipos TypeScript |
| `src/routes/` | Rotas e páginas da aplicação SvelteKit |
| `src-tauri/src/` | Código Rust do backend Tauri |
| `src-tauri/icons/` | Ícones do aplicativo (convenção Tauri v2) |
