import type { LabScreen } from '../../contracts.ts';
export const definition: Omit<LabScreen, 'approval'> = {
  id: 'game-ui-themes', title: 'Game UI · Themes and fonts', kind: 'prototype',
  description: "Candidate themes and fonts for #215, drawn on six stock screens of a sample game, with every value a theme sets and the license facts of each font. Three layouts place the theme choice in project creation. A browser drawing stands in for the hidden Ren'Py process. Unapproved drafts.",
  states: [
    { id: 'idle', title: 'Buttons idle' },
    { id: 'hover', title: 'First button under the pointer' },
    { id: 'large', title: 'Board: one screen large' },
    { id: 'values', title: 'Board: values table' },
    { id: 'fonts', title: 'Board: fonts table' },
    { id: 'sheet', title: 'Creation C: the theme sheet open' },
  ],
  variants: [
    { id: 'board', title: 'Theme board', load: () => import('./board.ts') },
    { id: 'create-step', title: 'Creation A · Own step', load: () => import('./create-step.ts') },
    { id: 'create-config', title: 'Creation B · With the window size', load: () => import('./create-config.ts') },
    { id: 'create-review', title: 'Creation C · On the review step', load: () => import('./create-review.ts') },
  ],
};
