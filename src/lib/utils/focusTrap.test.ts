import test from 'node:test';
import assert from 'node:assert/strict';

const { computeNextFocusIndex } = await import(
  new URL('./focusTrap.ts', import.meta.url).href
);

/**
 * Tests for the pure focus-trap logic: computeNextFocusIndex.
 *
 * DOM interaction (event listeners, querySelectorAll, focus())
 * lives in the Svelte action wrapper and is not unit-tested here.
 */

test('cycles forward on Tab (no shift)', () => {
  // 3 elements: indices 0, 1, 2
  assert.equal(computeNextFocusIndex(0, 3, false), 1);
  assert.equal(computeNextFocusIndex(1, 3, false), 2);
  assert.equal(computeNextFocusIndex(2, 3, false), 0); // wraps
});

test('cycles backward on Shift+Tab', () => {
  assert.equal(computeNextFocusIndex(0, 3, true), 2); // wraps
  assert.equal(computeNextFocusIndex(1, 3, true), 0);
  assert.equal(computeNextFocusIndex(2, 3, true), 1);
});

test('single element always points to itself', () => {
  assert.equal(computeNextFocusIndex(0, 1, false), 0);
  assert.equal(computeNextFocusIndex(0, 1, true), 0);
});

test('two elements cycle correctly', () => {
  assert.equal(computeNextFocusIndex(0, 2, false), 1);
  assert.equal(computeNextFocusIndex(1, 2, false), 0); // wrap
  assert.equal(computeNextFocusIndex(0, 2, true), 1); // wrap backward
  assert.equal(computeNextFocusIndex(1, 2, true), 0);
});

test('returns -1 when total is 0', () => {
  assert.equal(computeNextFocusIndex(0, 0, false), -1);
  assert.equal(computeNextFocusIndex(0, 0, true), -1);
});

test('handles negative current index (when no element is focused)', () => {
  // If no element is focused, currentIndex is -1; should go to 0 on Tab
  assert.equal(computeNextFocusIndex(-1, 3, false), 0);
  // On Shift+Tab with -1, should go to last
  assert.equal(computeNextFocusIndex(-1, 3, true), 2);
});
