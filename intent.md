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

## Scope — V2 (entregue)

- [x] Estabilidade: tratamento de bordas, erros, estados vazios e recuperação
- [x] Performance: otimizar carregamento, edição, preview e troca de notas
- [x] Qualidade de vida: atalhos de teclado, busca, experiência geral

## Scope — V3 (polimento final)

### UI / Qualidade de Vida
- [ ] Esconder sidebar com `Ctrl+L` ou botão no canto inferior
- [ ] Contador de palavras no rodapé do editor
- [ ] Opção para dimmer de linhas inativas (CodeMirror)
- [ ] Checkboxes (task lists) no Markdown
- [ ] Autocomplete de aspas, crases, parênteses e colchetes
- [ ] Cursor animado / smooth caret (com toggle nas settings)

### Performance / Snappiness
- [ ] Render throttle do preview (16ms para 60fps ou 50ms debounce)
- [ ] Transições CSS (100-150ms ease-out) para movimentos de UI
- [ ] UI otimista para criar/deletar notas (instantâneo, sync em background)

### The Pet (Flama)
- [ ] **Big flame** no canto do preview; **small particle** que se separa ao digitar
- [ ] **Split view:** big flame no preview, small particle segue a digitação no editor, pousando ao lado da última letra
- [ ] **Edit-only:** small flame entra pela lateral e segue o texto; sem big flame
- [ ] **Preview/split idle:** big flame dá "bursts", tremelicar, relaxar
- [ ] **Timers:** 2s+ inativo → small particle gira; 10s+ inativo → volta pra big flame
- [ ] Cores editáveis nas settings
- [ ] Toggle on/off nas settings

## Non-negotiable constraints

- Stack: Tauri + SvelteKit + Tailwind CSS + CodeMirror 6 + markdown-it
- Dados salvos exclusivamente como arquivos `.md` locais
- Sem contas, sem sync, sem nuvem
