import type { LabScreen } from '../../contracts.ts';
export const definition: Omit<LabScreen, 'approval'> = {
  id: 'game-ui', title: 'Game UI · Workspace layout', kind: 'prototype',
  description: 'Layouts of the Game UI workspace for #197: the screen list, the screen canvas, a settings page, the way into the detailed level, themes and templates, the header actions and the sample content controls. A, B and C are the second round; 1, 2 and 3 are the first. A browser drawing stands in for the hidden Ren\'Py process. Sample project; changes stay in the preview. Unapproved drafts.',
  states: [
    { id: 'dialogue', title: 'Dialogue box settings' },
    { id: 'title', title: 'Title screen and its templates' },
    { id: 'themes', title: 'Themes' },
    { id: 'detailed', title: 'Detailed level on the title screen' },
  ],
  variants: [
    { id: 'refined', title: 'A · Layout 1, refined', load: () => import('./refined.ts') },
    { id: 'blend', title: 'B · Recommended blend, approved', load: () => import('./blend.ts') },
    { id: 'blend-v2', title: 'B · Recommended blend, revision 2', load: () => import('./blend-v2.ts') },
    { id: 'council', title: 'C · Council blend', load: () => import('./council.ts') },
    { id: 'pages', title: '1 · Pages and panel', load: () => import('./pages.ts') },
    { id: 'click', title: '2 · Click the game', load: () => import('./click.ts') },
    { id: 'board', title: '3 · Whole-game board', load: () => import('./board.ts') },
  ],
};
