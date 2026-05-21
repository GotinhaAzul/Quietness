# Quietness

> Leve offline note taking app — minimalista, tranquilo, focado.

## Purpose

Criar um aplicativo desktop de anotações offline com ênfase em minimalismo,
quietude e simplicidade. Nada de ruído visual, configurações complexas ou
dependência de nuvem.

## Scope / Done criteria

- [ ] Sidebar esquerda com lista de notas e pastas (navegação hierárquica)
- [ ] Área de visualização/edição de notas com suporte a formatação:
  - `#` headings, `**` negrito, `''` itálico (Markdown básico)
- [ ] Armazenamento local persistido em arquivos `.md` no sistema de arquivos
- [ ] Links entre notas via sintaxe `[[]]` (wikilinks)
- [ ] Design minimalista, silencioso, focado em tranquilidade
- [ ] Totalmente offline — sem dependência de rede

## Non-negotiable constraints

- Stack: Tauri + SvelteKit + Tailwind CSS + CodeMirror 6 + markdown-it
- Dados salvos exclusivamente como arquivos `.md` locais
- Sem contas, sem sync, sem nuvem
