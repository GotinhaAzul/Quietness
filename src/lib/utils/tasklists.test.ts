import test from 'node:test';
import assert from 'node:assert/strict';
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url);
const { toggleMarkdownCheckbox } = jiti('./tasklists.ts') as typeof import('./tasklists');

test('toggleMarkdownCheckbox checks an unchecked item by index', () => {
  const md = `- [ ] Alpha\n- [ ] Beta\n- [ ] Gamma`;
  const result = toggleMarkdownCheckbox(md, 1, true);
  assert.equal(result, `- [ ] Alpha\n- [x] Beta\n- [ ] Gamma`);
});

test('toggleMarkdownCheckbox unchecks a checked item by index', () => {
  const md = `- [x] Alpha\n- [x] Beta`;
  const result = toggleMarkdownCheckbox(md, 0, false);
  assert.equal(result, `- [ ] Alpha\n- [x] Beta`);
});

test('toggleMarkdownCheckbox handles nested list checkboxes', () => {
  const md = `- [ ] Parent\n  - [ ] Child\n  - [ ] Sibling`;
  const result = toggleMarkdownCheckbox(md, 1, true);
  assert.equal(result, `- [ ] Parent\n  - [x] Child\n  - [ ] Sibling`);
});

test('toggleMarkdownCheckbox skips checkboxes inside fenced code blocks', () => {
  const md = '- [ ] Real item\n```\n- [ ] Code block item\n```\n- [ ] Another real item';
  const result = toggleMarkdownCheckbox(md, 1, true);
  assert.equal(result, '- [ ] Real item\n```\n- [ ] Code block item\n```\n- [x] Another real item');
});

test('toggleMarkdownCheckbox returns unchanged markdown for out-of-range index', () => {
  const md = `- [ ] Only item`;
  const result = toggleMarkdownCheckbox(md, 5, true);
  assert.equal(result, md);
});

test('toggleMarkdownCheckbox handles mixed ordered/unordered task lists', () => {
  const md = `1. [ ] First\n2. [ ] Second\n- [ ] Bullet`;
  const result = toggleMarkdownCheckbox(md, 2, true);
  assert.equal(result, `1. [ ] First\n2. [ ] Second\n- [x] Bullet`);
});

test('toggleMarkdownCheckbox preserves CRLF line endings as LF in output', () => {
  const md = '- [ ] Alpha\r\n- [ ] Beta';
  const result = toggleMarkdownCheckbox(md, 0, true);
  assert.equal(result, '- [x] Alpha\n- [ ] Beta');
});
