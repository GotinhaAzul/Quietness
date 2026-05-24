import { writable } from 'svelte/store';

export interface PetCursorCoords {
  x: number;
  y: number;
}

export const petCursorCoords = writable<PetCursorCoords | null>(null);
export const petLastTypingTime = writable<number>(0);
