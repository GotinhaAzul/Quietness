import MarkdownIt from 'markdown-it';
import wikilinksPlugin from './wikilinks';
import tasklistsPlugin from './tasklists';
import markPlugin from 'markdown-it-mark';
import strikethroughPlugin from './strikethrough';

const md = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: false,
  breaks: true,
});

md.use(wikilinksPlugin);
md.use(tasklistsPlugin);
md.use(markPlugin);
md.use(strikethroughPlugin);

export default md;

import { incrementCounter } from './perf';

const cache = new Map<string, string>();
const CACHE_MAX = 100;

export function renderMarkdown(src: string, existingNotes?: Set<string>, revision?: number): string {
  const key = revision !== undefined
    ? JSON.stringify([src, revision])
    : (existingNotes
        ? JSON.stringify([src, Array.from(existingNotes).sort().join('\u0000')])
        : JSON.stringify([src, '']));
  const cached = cache.get(key);
  if (cached !== undefined) {
    cache.delete(key);
    cache.set(key, cached);
    incrementCounter('markdown-cache-hit');
    return cached;
  }
  incrementCounter('markdown-cache-miss');
  if (cache.size >= CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  const result = md.render(src, { existingNotes });
  cache.set(key, result);
  return result;
}
