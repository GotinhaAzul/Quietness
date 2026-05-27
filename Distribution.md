# Distribution — Quietness V5

> Tasks da Fase V5 (Estabilidade & Confiança) classificadas por complexidade
> e atribuídas ao agente mais adequado.

---

## 🔥 Codex — Alta Complexidade

Arquitetura profunda, concorrência, riscos de regressão.

| Task | Descrição | Por quê |
|------|-----------|---------|
| **T03** | Migrar comandos FS para base path configurável | Refatoração sistêmica: todos os 12+ comandos Rust (`fs.rs`) precisam parar de usar `notes_dir()` como raiz fixa e passar a usar `home_folder` configurável. Alto risco de regressão. |
| **T09** | Hardening de CRUD paths | Condições de borda: nota deletada externamente, concorrência, recovery. Requer pensar em cenários imprevisíveis de filesystem. |
| **T10** | Recuperação de integridade | Sincronizar store Svelte com disco, detectar `.md` ausentes/inconsistentes, auto-repair. Lógica de estado complexa. |
| **T07** | UI da lixeira | Visualizar/restaurar/deletar itens — requer multi-view (lista, restauração, purga permanente), integração com store. |
| **T12** | Perfilhar startup e carregamento | Medir e otimizar tempo de inicialização com 100+ notas. Requer profiling real, identificação de gargalos, refatoração. |

---

## 🧠 Deepseek — Média / Confiável

Bem definido, trabalho sistemático, baixo risco de regressão.

| Task | Descrição | Por quê |
|------|-----------|---------|
| **T01** | Rust `set_home_folder` | Comando novo em Rust para validar/persistir path customizado. Escopo limitado e bem definido. |
| **T02** | UI de seleção no SettingsModal | Folder picker ou input no SettingsModal existente. Padrão já conhecido (tabs, persistência via settings store). |
| **T04** | Bordas de home folder | Path inválido, permissão negada, migração, fallback. Lógica de edge cases, mas isolada. |
| **T05** | Rust `trash_note` + `trash_folder` | Mover para `.trash/` com timestamp. Comandos Rust novos, similares aos existentes. |
| **T06** | Auto-cleanup agendado | Timer periódico no startup + purge de N+ dias. Lógica de scheduler em Rust. |
| **T08** | Integrar fluxo de deleção | Soft-delete padrão vs Shift+Delete bypass. Mudança localizada no fluxo existente. |
| **T11** | Polimento de erros | Mensagens Rust significativas + toasts/rollback no frontend. Melhoria incremental. |
| **T13** | Revisão de overhead | Extensões CodeMirror, memória, caching. Auditoria + ajustes pontuais. |

---

## ⚡ Antigravity — Baixa Complexidade

Quick wins, componentes isolados, puramente visual.

| Task | Descrição | Por quê |
|------|-----------|---------|
| **T14** | Novos comportamentos da Flama | Respiração idle, reação a clique. Código Svelte/pet isolado, animações existentes como base. |
| **T15** | Partículas ambientes | Embers flutuantes, glow no preview. Puramente visual, sem impacto em lógica de negócio. |

---

## Sumário

| Agente | Tasks | Complexidade |
|--------|-------|-------------|
| Codex | 5 | T03, T07, T09, T10, T12 |
| Deepseek | 8 | T01, T02, T04, T05, T06, T08, T11, T13 |
| Antigravity | 2 | T14, T15 |
| **Total** | **15** | |



Ideia futura: Fazer o quietness CLI com integração ao App, inspirando nisso aqui: (https://github.com/Axorax/inkless)
