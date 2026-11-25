import type { LabScreen } from '../../contracts.ts';
// The layouts share the theme data and drawing of screens/game-ui-themes.
export const definition: Omit<LabScreen, 'approval'> = {
  id: 'game-ui-theme-creation', title: 'New project · Theme choice', kind: 'prototype',
  description: "Three places for the theme choice in project creation, for #215. All folders, SDK operations and creation results stay in browser memory. A browser drawing stands in for Ren'Py.",
  states: [
    { id: 'idle', title: 'Ren\'Py default selected' },
    { id: 'hover', title: 'First button under the pointer' },
    { id: 'sheet', title: 'Creation C: the theme sheet open' },
  ],
  variants: [
    { id: 'create-step', title: 'Creation A · Own step', load: () => import('../game-ui-themes/create-step.ts') },
    { id: 'create-config', title: 'Creation B · With the window size', load: () => import('../game-ui-themes/create-config.ts') },
    { id: 'create-review', title: 'Creation C · On the review step', load: () => import('../game-ui-themes/create-review.ts') },
  ],
};
