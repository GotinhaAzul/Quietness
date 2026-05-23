import { writable, type Writable } from 'svelte/store';

export interface ErrorToast {
  id: number;
  message: string;
}

export const errorMessage: Writable<ErrorToast[]> = writable<ErrorToast[]>([]);

let errorIdCounter = 0;
const errorTimeouts = new Map<number, ReturnType<typeof setTimeout>>();

export function showError(message: string) {
  const id = ++errorIdCounter;
  errorMessage.update(errors => [...errors, { id, message }]);
  const timeout = setTimeout(() => {
    dismissError(id);
  }, 4000);
  errorTimeouts.set(id, timeout);
}

export function dismissError(id: number) {
  const timeout = errorTimeouts.get(id);
  if (timeout) {
    clearTimeout(timeout);
    errorTimeouts.delete(id);
  }
  errorMessage.update(errors => errors.filter(e => e.id !== id));
}
