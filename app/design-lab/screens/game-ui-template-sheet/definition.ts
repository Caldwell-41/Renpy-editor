import type { LabScreen } from '../../contracts.ts';
// The layout shares the template data and drawing of screens/game-ui-templates.
export const definition: Omit<LabScreen, 'approval'> = {
  id: 'game-ui-template-sheet', title: 'Game UI · Template row and sheet', kind: 'prototype',
  description: "The template row and its sheet for #222, as the approved Game UI layout places them: the order and names of the templates, \"Custom\", and the question before a template replaces a layout of the author's own. Each choice stays in browser memory. A browser drawing stands in for Ren'Py.",
  states: [
    { id: 'title', title: 'Title screen, sheet open' },
    { id: 'say', title: 'Dialogue box, sheet open' },
    { id: 'choice', title: 'Choices, sheet open' },
    { id: 'history', title: 'History, sheet open' },
    { id: 'custom', title: 'The layout is Custom' },
    { id: 'confirm', title: 'The question before a replacement' },
  ],
  variants: [
    { id: 'sheet', title: 'Template row and sheet', load: () => import('../game-ui-templates/sheet.ts') },
  ],
};
