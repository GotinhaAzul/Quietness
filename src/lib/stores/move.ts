import { writable, type Writable } from 'svelte/store';

export interface MoveTarget {
  type: 'note' | 'folder';
  path: string;
  name: string;
}

export const moveTarget: Writable<MoveTarget | null> = writable<MoveTarget | null>(null);