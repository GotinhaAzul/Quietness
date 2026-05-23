import test from 'node:test';
import assert from 'node:assert/strict';

const { runAfterModalDismiss } = await import(
  new URL('./confirmedAction.ts', import.meta.url).href
);

test('runAfterModalDismiss closes before awaiting the UI boundary and running the action', async () => {
  const events: string[] = [];
  let continueBoundary: (() => void) | undefined;

  const task = runAfterModalDismiss({
    close: () => events.push('close'),
    waitForDismissal: () => new Promise<void>((resolve) => {
      events.push('wait-start');
      continueBoundary = resolve;
    }).then(() => {
      events.push('wait-end');
    }),
    action: () => {
      events.push('action');
    },
  });

  assert.deepEqual(events, ['close', 'wait-start']);

  continueBoundary?.();
  await task;

  assert.deepEqual(events, ['close', 'wait-start', 'wait-end', 'action']);
});
