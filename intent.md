# Quietness

> Leve offline note taking app — minimalista, tranquilo, focado.

## Purpose

Criar um aplicativo desktop de anotações offline com ênfase em minimalismo,
quietude e simplicidade. Nada de ruído visual, configurações complexas ou
dependência de nuvem.

## Scope — V1 (entregue)

- [x] Sidebar esquerda com lista de notas e pastas (navegação hierárquica)
- [x] Área de visualização/edição de notas com suporte a formatação:
  - `#` headings, `**` negrito, `''` itálico (Markdown básico)
- [x] Armazenamento local persistido em arquivos `.md` no sistema de arquivos
- [x] Links entre notas via sintaxe `[[]]` (wikilinks)
- [x] Design minimalista, silencioso, focado em tranquilidade
- [x] Totalmente offline — sem dependência de rede
- [x] Tema claro/escuro com sistema de custom themes
- [x] Modal de configurações (temas, fontes, preferências do editor)
- [x] Customização de fontes e tamanhos
- [x] CodeMirror 6 com syntax highlighting e tema customizado

## Scope — V2 (refinamento)

- [ ] Estabilidade: tratamento de bordas, erros, estados vazios e recuperação
- [ ] Performance: otimizar carregamento, edição, preview e troca de notas
- [ ] Qualidade de vida: atalhos de teclado, busca, experiência geral

## Non-negotiable constraints

- Stack: Tauri + SvelteKit + Tailwind CSS + CodeMirror 6 + markdown-it
- Dados salvos exclusivamente como arquivos `.md` locais
- Sem contas, sem sync, sem nuvem
