import MarkdownIt from 'markdown-it';
import wikilinksPlugin from './wikilinks';
import tasklistsPlugin from './tasklists';

const md = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: false,
});

md.use(wikilinksPlugin);
md.use(tasklistsPlugin);

export default md;

function hashContent(src: string): string {
  let h = 0;
  for (let i = 0; i < src.length; i++) {
    h = ((h << 5) - h) + src.charCodeAt(i);
    h |= 0;
  }
  return src.length + ':' + h;
}

const cache = new Map<string, string>();
const CACHE_MAX = 50;

export function renderMarkdown(src: string, existingNotes?: Set<string>): string {
  const key = hashContent(src) + (existingNotes ? ':' + existingNotes.size : '');
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  if (cache.size >= CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  const result = md.render(src, { existingNotes });
  cache.set(key, result);
  return result;
}
