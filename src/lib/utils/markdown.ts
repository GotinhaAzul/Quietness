import MarkdownIt from 'markdown-it';
import wikilinksPlugin from './wikilinks';

const md = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: false,
});

md.use(wikilinksPlugin);

export default md;

export function renderMarkdown(src: string, existingNotes?: Set<string>): string {
  return md.render(src, { existingNotes });
}
