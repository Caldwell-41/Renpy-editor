import type { LabScreen } from '../../contracts.ts';
export const definition: Omit<LabScreen, 'approval'> = {
  id: 'game-ui-templates', title: 'Game UI · Templates', kind: 'prototype',
  description: "The candidate Loomlight templates for #222: the layout values of each one, drawn with each of the seven themes, and the values each one sets. The template row and sheet are the screen game-ui-template-sheet. A browser drawing stands in for the hidden Ren'Py process.",
  states: [
    { id: 'title', title: 'Title screen' },
    { id: 'say', title: 'Dialogue box' },
    { id: 'choice', title: 'Choices' },
    { id: 'history', title: 'History' },
    { id: 'large', title: 'One picture large' },
  ],
  variants: [
    { id: 'board', title: 'Template board', load: () => import('./board.ts') },
  ],
};
