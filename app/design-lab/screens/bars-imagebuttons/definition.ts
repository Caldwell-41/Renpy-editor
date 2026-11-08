import type { LabScreen } from '../../contracts.ts';
export const definition: Omit<LabScreen, 'approval'> = {
  id: 'bars-imagebuttons', title: 'Screens · Bars and image buttons', kind: 'prototype',
  description: 'Three layouts in the real Screens workspace. Fictional UI-image references, typed actions and source/history services stay in memory. No game code runs.',
  states: [
    { id: 'button', title: 'Image button' }, { id: 'bar', title: 'Integer bar' },
    { id: 'invalid', title: 'Invalid bounds' }, { id: 'missing-asset', title: 'Missing image' },
    { id: 'missing-variable', title: 'Missing integer variable' }, { id: 'stale', title: 'Changed source' },
    { id: 'custom', title: 'Source-only expression' },
  ],
  variants: [
    { id: 'inspector-v2', title: 'A2 · Refined continuous inspector', load: () => import('./refined.ts') },
    { id: 'inspector-v1', title: 'A · Continuous inspector', load: () => import('./inspector.ts') },
    { id: 'focus-v1', title: 'B · Focused properties', load: () => import('./focus.ts') },
    { id: 'table-v1', title: 'C · Property desk', load: () => import('./table.ts') },
  ],
};
