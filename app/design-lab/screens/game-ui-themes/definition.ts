import type { LabScreen } from '../../contracts.ts';
export const definition: Omit<LabScreen, 'approval'> = {
  id: 'game-ui-themes', title: 'Game UI · Themes and fonts', kind: 'prototype',
  description: "The seven Loomlight themes and their fonts for #215, drawn on six stock screens of a sample game, with every value a theme sets and the license facts of each font. A browser drawing stands in for the hidden Ren'Py process. The project-creation layouts are the screen game-ui-theme-creation.",
  states: [
    { id: 'idle', title: 'Buttons idle' },
    { id: 'hover', title: 'First button under the pointer' },
    { id: 'large', title: 'One screen large' },
    { id: 'values', title: 'Values table' },
    { id: 'fonts', title: 'Fonts table' },
  ],
  variants: [
    { id: 'board', title: 'Theme board', load: () => import('./board.ts') },
  ],
};
