import test from 'node:test';
import assert from 'node:assert/strict';
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url);
const { getSidebarCustomizationVars } = jiti('./sidebarCustomization.ts') as typeof import('./sidebarCustomization');

test('getSidebarCustomizationVars exposes sidebar accent and clamped chrome opacity', () => {
  assert.deepEqual(
    getSidebarCustomizationVars({ sidebarAccent: '#4f8f6f', chromeOpacity: 1.4 }),
    {
      '--q-sidebar-accent': '#4f8f6f',
      '--q-chrome-opacity': '1',
    },
  );

  assert.deepEqual(
    getSidebarCustomizationVars({ sidebarAccent: '#b88a2e', chromeOpacity: -0.2 }),
    {
      '--q-sidebar-accent': '#b88a2e',
      '--q-chrome-opacity': '0',
    },
  );
});
