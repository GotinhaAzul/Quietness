/**
 * Focus trap utilities.
 *
 * Core logic is pure-function based for testability.
 * `useFocusTrap` is the Svelte 5 action wrapping DOM interaction.
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([type="hidden"]):not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

export interface FocusTrapOptions {
  /** Auto-focus the first focusable element when the trap activates. */
  autoFocus?: boolean;
}

/**
 * Pure logic: given an array of focusable elements and the current index,
 * returns the next index to focus.
 *
 * Exported for unit testing.
 */
export function computeNextFocusIndex(
  currentIndex: number,
  total: number,
  shiftKey: boolean,
): number {
  if (total === 0) return -1;
  if (shiftKey) {
    return currentIndex <= 0 ? total - 1 : currentIndex - 1;
  }
  return currentIndex >= total - 1 ? 0 : currentIndex + 1;
}

/**
 * Svelte 5 action: traps Tab/Shift+Tab focus cycling within the node.
 *
 * Usage:
 * ```svelte
 * <script lang="ts">
 *   import { focusTrap } from '$lib/utils/focusTrap';
 * </script>
 * <div use:focusTrap={{ autoFocus: true }}>
 *   <!-- focusable elements -->
 * </div>
 * ```
 */
export function focusTrap(
  node: HTMLElement,
  options: FocusTrapOptions = {},
): { destroy: () => void } {
  let previousFocus: HTMLElement | null = null;

  function handleKeydown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    const focusable = getFocusableElements(node);
    if (focusable.length === 0) return;

    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
    const nextIndex = computeNextFocusIndex(currentIndex, focusable.length, e.shiftKey);

    if (nextIndex >= 0 && nextIndex < focusable.length) {
      e.preventDefault();
      focusable[nextIndex]?.focus();
    }
  }

  function activate() {
    previousFocus = document.activeElement as HTMLElement | null;
    node.addEventListener('keydown', handleKeydown);

    if (options.autoFocus) {
      const focusable = getFocusableElements(node);
      if (focusable.length > 0) {
        requestAnimationFrame(() => focusable[0]?.focus());
      }
    }
  }

  function deactivate() {
    node.removeEventListener('keydown', handleKeydown);
    if (previousFocus && document.contains(previousFocus)) {
      previousFocus.focus();
    }
    previousFocus = null;
  }

  activate();

  return { destroy: deactivate };
}
