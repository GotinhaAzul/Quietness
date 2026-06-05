import type MarkdownIt from 'markdown-it';

// Minimal markdown-it plugin for ~~strikethrough~~ syntax.
// Renders as <del>text</del> — no external dependencies.

export default function strikethroughPlugin(md: MarkdownIt): void {
  md.inline.ruler.before('emphasis', 'strikethrough', (state, silent) => {
    const start = state.pos;
    const marker = state.src.charCodeAt(start);
    if (marker !== 0x7E /* ~ */) return false;
    if (silent) return false;

    const scanned = state.scanDelims(state.pos, true);
    let len = scanned.length;
    if (len < 2) return false;

    const ch = '~';
    if (len % 2) {
      const token = state.push('text', '', 0);
      token.content = ch;
      len--;
    }

    for (let i = 0; i < len; i += 2) {
      const token = state.push('text', '', 0);
      token.content = ch + ch;

      if (!scanned.can_open && !scanned.can_close) continue;

      state.delimiters.push({
        marker,
        length: 0,
        token: state.tokens.length - 1,
        end: -1,
        open: scanned.can_open,
        close: scanned.can_close,
      });
    }

    state.pos += scanned.length;
    return true;
  });

  md.inline.ruler2.before('emphasis', 'strikethrough', (state) => {
    function postProcess(delimiters: typeof state.delimiters) {
      for (let i = 0; i < delimiters.length; i++) {
        const startDelim = delimiters[i];
        if (startDelim.marker !== 0x7E) continue;
        if (startDelim.end === -1) continue;

        const endDelim = delimiters[startDelim.end];
        const token_o = state.tokens[startDelim.token];
        token_o.type = 'del_open';
        token_o.tag = 'del';
        token_o.nesting = 1;
        token_o.markup = '~~';
        token_o.content = '';

        const token_c = state.tokens[endDelim.token];
        token_c.type = 'del_close';
        token_c.tag = 'del';
        token_c.nesting = -1;
        token_c.markup = '~~';
        token_c.content = '';
      }
    }

    const max = (state.tokens_meta || []).length;
    postProcess(state.delimiters);
    for (let curr = 0; curr < max; curr++) {
      const meta = state.tokens_meta[curr];
      if (meta?.delimiters) {
        postProcess(meta.delimiters);
      }
    }
    return true;
  });
}
