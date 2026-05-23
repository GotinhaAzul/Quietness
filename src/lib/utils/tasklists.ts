import type MarkdownIt from 'markdown-it';

export default function tasklistsPlugin(md: MarkdownIt): void {
  md.core.ruler.after('inline', 'tasklists', (state) => {
    const tokens = state.tokens;

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
        ? '<input type="checkbox" class="task-checkbox" checked disabled> '
        : '<input type="checkbox" class="task-checkbox" disabled> ';

      const checkboxToken = new state.Token('html_inline', '', 0);
      checkboxToken.content = checkboxHtml;

      if (children) {
        children.unshift(checkboxToken);
      }
    }
  });
}
