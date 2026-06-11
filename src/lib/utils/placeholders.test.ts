import test from 'node:test';
import assert from 'node:assert/strict';

const { resolvePlaceholders } = await import(
  new URL('./placeholders.ts', import.meta.url).href
);

test('{date} resolves to YYYY-MM-DD format', () => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const expected = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  assert.equal(resolvePlaceholders('{date}'), expected);
});

test('{time} resolves to HH:mm format', () => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const expected = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  assert.equal(resolvePlaceholders('{time}'), expected);
});

test('{datetime} resolves to YYYY-MM-DD HH:mm format', () => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const expected = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  assert.equal(resolvePlaceholders('{datetime}'), expected);
});

test('{title} resolves to the provided title parameter', () => {
  assert.equal(resolvePlaceholders('{title}', 'My Note'), 'My Note');
});

test('{title} without parameter resolves to empty string', () => {
  assert.equal(resolvePlaceholders('{title}'), '');
});

test('unknown placeholder is kept literal', () => {
  assert.equal(resolvePlaceholders('{foo}'), '{foo}');
});

test('multiple placeholders in the same string are all resolved', () => {
  const result = resolvePlaceholders('{date} at {time}', 'Test');
  assert.match(result, /^\d{4}-\d{2}-\d{2} at \d{2}:\d{2}$/);
});

test('string without placeholders is returned unchanged', () => {
  assert.equal(resolvePlaceholders('Just a plain string'), 'Just a plain string');
});
