import { writable, type Writable } from 'svelte/store';

export type ToastType = 'error' | 'warning' | 'success';

export interface ErrorToast {
  id: number;
  message: string;
  type: ToastType;
}

export const errorMessage: Writable<ErrorToast[]> = writable<ErrorToast[]>([]);

let errorIdCounter = 0;
const errorTimeouts = new Map<number, ReturnType<typeof setTimeout>>();
const MAX_TOASTS = 5;

function showToast(message: string, type: ToastType) {
  errorMessage.update(errors => {
    const next = [...errors, { id: ++errorIdCounter, message, type }];
    return next.slice(-MAX_TOASTS);
  });
  const timeout = setTimeout(() => {
    dismissError(errorIdCounter);
  }, 4000);
  errorTimeouts.set(errorIdCounter, timeout);
}

export function showError(message: string) {
  showToast(message, 'error');
}

export function showWarning(message: string) {
  showToast(message, 'warning');
}

export function showSuccess(message: string) {
  showToast(message, 'success');
}

export function dismissError(id: number) {
  const timeout = errorTimeouts.get(id);
  if (timeout) {
    clearTimeout(timeout);
    errorTimeouts.delete(id);
  }
  errorMessage.update(errors => errors.filter(e => e.id !== id));
}
