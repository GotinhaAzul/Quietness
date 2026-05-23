import test from 'node:test';
import assert from 'node:assert/strict';
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url);
const { renderMarkdown } = jiti('./markdown.ts') as typeof import('./markdown');

test('renderMarkdown cache accounts for actual existing note names', () => {
  const src = 'See [[Alpha]] and [[Beta]].';

  const withAlphaOnly = renderMarkdown(src, new Set(['alpha']));
  const withBetaOnly = renderMarkdown(src, new Set(['beta']));

  assert.match(withAlphaOnly, /data-wikilink="Alpha" class="wikilink"/);
  assert.match(withAlphaOnly, /data-wikilink="Beta" class="wikilink broken"/);
  assert.match(withBetaOnly, /data-wikilink="Alpha" class="wikilink broken"/);
  assert.match(withBetaOnly, /data-wikilink="Beta" class="wikilink"/);
});
