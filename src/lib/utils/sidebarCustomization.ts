import type { Settings } from '$lib/types/settings';

export type SidebarCustomizationInput = Pick<Settings, 'sidebarAccent' | 'chromeOpacity'>;

export function clampChromeOpacity(value: number): number {
  if (!Number.isFinite(value)) return 0.65;
  return Math.min(1, Math.max(0, value));
}

export function getSidebarCustomizationVars(settings: SidebarCustomizationInput): Record<string, string> {
  return {
    '--q-sidebar-accent': settings.sidebarAccent,
    '--q-chrome-opacity': String(clampChromeOpacity(settings.chromeOpacity)),
  };
}
