export interface ConfirmedActionOptions {
  close: () => void;
  waitForDismissal: () => Promise<void>;
  action: () => void | Promise<void>;
}

export async function runAfterModalDismiss({
  close,
  waitForDismissal,
  action,
}: ConfirmedActionOptions): Promise<void> {
  close();
  await waitForDismissal();
  await action();
}

export function waitForNextPaint(): Promise<void> {
  if (typeof requestAnimationFrame !== 'function') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}
