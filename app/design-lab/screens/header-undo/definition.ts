import type { LabScreen } from '../../contracts.ts';
export const definition: Omit<LabScreen, 'approval'> = {
  id: 'header-undo', title: 'Header · Undo and Redo', kind: 'prototype',
  description: 'Compare three places and forms for the header Undo and Redo buttons. Every Undo control runs one command; tooltips name the next edit and the status line names the last one. Sample text; edits stay in the preview. No variant is approved.',
  states: [{ id: 'ready', title: 'Three edits, nothing undone' }, { id: 'undone', title: 'After one Undo' }, { id: 'empty', title: 'Nothing to undo or redo' }],
  variants: [
    { id: 'icons', title: '1 · Icons beside Save', load: () => import('./icons.ts') },
    { id: 'grouped', title: '2 · Text with the save state', load: () => import('./grouped.ts') },
    { id: 'apart', title: '3 · Beside the brand', load: () => import('./apart.ts') },
  ],
};
