import type { LabScreen } from '../../contracts.ts';
export const definition: Omit<LabScreen, 'approval'> = {
  id: 'game-ui-templates', title: 'Game UI · Templates', kind: 'prototype',
  description: "The candidate Loomlight templates for #222: the layout values of each one, drawn with each of the seven themes, and the template row and sheet with \"Custom\" and the question before a replacement. A browser drawing stands in for the hidden Ren'Py process. Each choice stays in browser memory.",
  states: [
    { id: 'title', title: 'Title screen' },
    { id: 'say', title: 'Dialogue box' },
    { id: 'choice', title: 'Choices' },
    { id: 'history', title: 'History' },
    { id: 'large', title: 'Board: one picture large' },
    { id: 'custom', title: 'Sheet: the layout is Custom' },
    { id: 'confirm', title: 'Sheet: the question before a replacement' },
  ],
  variants: [
    { id: 'board', title: 'Template board', load: () => import('./board.ts') },
    { id: 'sheet', title: 'Template row and sheet', load: () => import('./sheet.ts') },
  ],
};
