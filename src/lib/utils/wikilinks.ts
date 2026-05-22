import type MarkdownIt from 'markdown-it';

export default function wikilinksPlugin(md: MarkdownIt): void {
  md.inline.ruler.before('link', 'wikilink', (state, silent) => {
    const pos = state.pos;
    const max = state.posMax;

    if (pos + 1 >= max) return false;
    if (state.src.charCodeAt(pos) !== 0x5B) return false;
    if (state.src.charCodeAt(pos + 1) !== 0x5B) return false;

    let close = -1;
    for (let i = pos + 2; i < max; i++) {
      const code = state.src.charCodeAt(i);
      if (code === 0x5B) { // '['
        // If we find another '[' before ']]', the outer link is invalid
        return false;
      }
      if (code === 0x0A) { // '\n'
        return false;
      }
      if (code === 0x5D && i + 1 < max && state.src.charCodeAt(i + 1) === 0x5D) { // ']]'
        close = i;
        break;
      }
    }

    if (close === -1) return false;

    const content = state.src.slice(pos + 2, close);

    if (!silent) {
      const pipeIndex = content.indexOf('|');
      const target = (pipeIndex !== -1 ? content.slice(0, pipeIndex) : content).trim();
      const display = (pipeIndex !== -1 ? content.slice(pipeIndex + 1) : content).trim();

      const existing = state.env?.existingNotes as Set<string> | undefined;
      const exists = existing ? existing.has(target.toLowerCase()) : false;
      const linkClass = exists ? 'wikilink' : 'wikilink broken';

      const token = state.push('link_open', 'a', 1);
      token.attrs = [
        ['href', '#'],
        ['data-wikilink', target],
        ['class', linkClass],
      ];

      const textToken = state.push('text', '', 0);
      textToken.content = display;

      state.push('link_close', 'a', -1);
    }

    state.pos = close + 2;
    return true;
  });
}
