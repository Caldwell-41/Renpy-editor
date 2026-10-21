import type { LabScreen } from '../../contracts.ts';
export const definition: Omit<LabScreen, 'approval'> = {
  id: 'assets', title: 'Assets', kind: 'prototype',
  description: 'Library shelves and Preview desk compare browsing and inspection with one fictional import loop.',
  states: [{ id: 'populated', title: 'Project library' }, { id: 'empty', title: 'Empty library' }, { id: 'long', title: 'Large library' }, { id: 'error', title: 'Unavailable preview' }],
  variants: [{ id: 'shelves', title: 'Library shelves', load: () => import('./shelves.ts') }, { id: 'desk', title: 'Preview desk', load: () => import('./desk.ts') }],
  check: './screens/assets/check.mjs',
};
