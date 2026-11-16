import type { LabScreen } from '../../contracts.ts';
export const definition: Omit<LabScreen, 'approval'> = {
  id: 'game-ui', title: 'Game UI · Workspace layout', kind: 'prototype',
  description: 'Three layouts of the Game UI workspace for #197: the screen list, the screen canvas, a settings page, the way into the detailed level, themes and templates, the header actions and the sample content controls. A browser drawing stands in for the hidden Ren\'Py process. Sample project; changes stay in the preview. Unapproved drafts.',
  states: [
    { id: 'dialogue', title: 'Dialogue box settings' },
    { id: 'title', title: 'Title screen and its templates' },
    { id: 'themes', title: 'Themes' },
    { id: 'detailed', title: 'Detailed level on the title screen' },
  ],
  variants: [
    { id: 'pages', title: '1 · Pages and panel', load: () => import('./pages.ts') },
    { id: 'click', title: '2 · Click the game', load: () => import('./click.ts') },
    { id: 'board', title: '3 · Whole-game board', load: () => import('./board.ts') },
  ],
};
