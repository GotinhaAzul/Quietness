# Stack Definition

- **Date:** 2026-05-21
- **Context:** Definir a stack tecnológica para o Quietness, um app desktop offline de anotações minimalistas.
- **Decision:**
  - **Desktop framework:** Tauri (leve, Rust-based, multi-plataforma)
  - **Frontend UI:** Svelte (reativo, compilado, bundle pequeno)
  - **Estilização:** Tailwind CSS (utility-first, design consistente)
  - **Editor de texto:** CodeMirror 6 (extensível, leve, suporte a Markdown)
  - **Renderização Markdown:** markdown-it (rápido, parser comum)
- **Alternatives considered:**
  - Electron (descartado por ser mais pesado que Tauri)
  - React/Vue (descartados em favor da simplicidade do Svelte)
  - Monaco Editor (descartado por ser mais pesado que CodeMirror 6)
- **Consequences:**
  - Aplicativo leve e performático (Tauri + Svelte)
  - Editor rico com syntax highlighting (CodeMirror 6)
  - Renderização de preview Markdown confiável (markdown-it)
  - Necessário conhecimento de Rust para configuração do backend Tauri
- **Authorization:** User
