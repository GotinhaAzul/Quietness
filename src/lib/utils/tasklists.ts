import type MarkdownIt from 'markdown-it';

export default function tasklistsPlugin(md: MarkdownIt): void {
  md.core.ruler.after('inline', 'tasklists', (state) => {
    const tokens = state.tokens;
    let checkboxCount = 0;

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'inline') continue;

      const content = tokens[i].content;
      const match = content.match(/^\[([ x])\]\s+/);
      if (!match) continue;

      let inListItem = false;
      for (let j = i - 1; j >= 0; j--) {
        if (tokens[j].type === 'list_item_open') {
          inListItem = true;
          tokens[j].attrJoin('class', 'task-list-item');
          break;
        }
        if (tokens[j].type === 'bullet_list_close' || tokens[j].type === 'ordered_list_close') {
          break;
        }
      }

      if (!inListItem) continue;

      const checked = match[1] === 'x';
      tokens[i].content = content.slice(match[0].length);

      const children = tokens[i].children;
      if (children && children.length > 0) {
        const firstChild = children[0];
        if (firstChild.type === 'text') {
          firstChild.content = firstChild.content.slice(match[0].length);
        }
      }

      const checkboxHtml = checked
        ? `<input type="checkbox" class="task-checkbox" data-list-index="${checkboxCount}" checked> `
        : `<input type="checkbox" class="task-checkbox" data-list-index="${checkboxCount}"> `;

      checkboxCount++;

      const checkboxToken = new state.Token('html_inline', '', 0);
      checkboxToken.content = checkboxHtml;

      if (children) {
        children.unshift(checkboxToken);
      }
    }
  });
}

export function toggleMarkdownCheckbox(markdown: string, targetIndex: number, checked: boolean): string {
  const lines = markdown.split(/\r?\n/);
  let currentIndex = 0;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      continue;
    }

    const match = line.match(/^([\s>]*(?:[-*+]|\d+\.)\s+)\[([ x])\](\s+)/);
    if (match) {
      if (currentIndex === targetIndex) {
        const newState = checked ? 'x' : ' ';
        lines[i] = line.replace(/^([\s>]*(?:[-*+]|\d+\.)\s+)\[([ x])\](\s+)/, `$1[${newState}]$3`);
        break;
      }
      currentIndex++;
    }
  }

  return lines.join('\n');
}
