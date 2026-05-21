# Project Structure — Quietness

> ⚠️ This structure is the first version. During development, revise it
> whenever something doesn't fit well.

```
quietness/
├── src/                          # Código frontend (SvelteKit)
│   ├── lib/
│   │   ├── components/           # Componentes Svelte reutilizáveis
│   │   │   ├── Sidebar.svelte          # Barra lateral com notas e pastas
│   │   │   ├── NoteList.svelte         # Lista de notas na sidebar
│   │   │   ├── FolderTree.svelte       # Árvore de pastas na sidebar
│   │   │   ├── NoteEditor.svelte       # Editor CodeMirror 6
│   │   │   ├── NotePreview.svelte      # Preview Markdown renderizado
│   │   │   ├── NoteTitle.svelte        # Título/editável da nota
│   │   │   └── SearchBar.svelte        # Busca na sidebar
│   │   ├── stores/               # Stores Svelte (estado global)
│   │   │   ├── notes.ts          # Estado das notas
│   │   │   ├── folders.ts        # Estado das pastas
│   │   │   ├── editor.ts         # Estado do editor (nota ativa, cursor, etc.)
│   │   │   └── ui.ts             # Estado da interface (sidebar collapsada, etc.)
│   │   ├── utils/                # Funções utilitárias
│   │   │   ├── markdown.ts       # Configuração do markdown-it
│   │   │   ├── wikilinks.ts      # Parse/resolve de links [[]]
│   │   │   ├── filesystem.ts     # Chamadas Tauri para ler/escrever arquivos
│   │   │   └── parser.ts         # Parse de frontmatter / metadados
│   │   └── types/                # Tipos TypeScript
│   │       ├── note.ts           # Interface Note, Folder
│   │       └── settings.ts       # Interface de configurações
│   ├── routes/                   # Rotas SvelteKit
│   │   └── +page.svelte          # Página principal
│   ├── app.html                  # HTML template
│   ├── app.css                   # Estilos globais + Tailwind
│   └── global.d.ts               # Tipos globais
├── src-tauri/                    # Backend Tauri (Rust)
│   ├── src/
│   │   ├── main.rs               # Entry point Tauri
│   │   ├── commands.rs           # Comandos Tauri (listar, ler, escrever arquivos)
│   │   └── fs.rs                 # Lógica de arquivos .md
│   ├── Cargo.toml
│   └── tauri.conf.json
├── static/                       # Assets estáticos
│   └── icons/                    # Ícones do app
├── .gitignore
├── package.json
├── svelte.config.js
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── AGENTS.md                     # Regras operacionais do agente
└── intent.md                     # Intenção e escopo do projeto
```

### Directory purpose

| Directory | Purpose |
|-----------|---------|
| `src/lib/components/` | Componentes Svelte reutilizáveis da interface |
| `src/lib/stores/` | Stores Svelte reativas para estado global |
| `src/lib/utils/` | Utilitários (Markdown, wikilinks, filesystem) |
| `src/lib/types/` | Interfaces TypeScript compartilhadas |
| `src/routes/` | Rotas e páginas da aplicação SvelteKit |
| `src-tauri/src/` | Código Rust do backend Tauri |
| `static/icons/` | Ícones e assets do aplicativo |
