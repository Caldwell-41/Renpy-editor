import type { LabScreen } from '../../contracts.ts';
export const definition: Omit<LabScreen, 'approval'> = {
  id: 'story-combined-status', title: 'Story Combined · Drafts, Save and Undo status', kind: 'prototype',
  description: 'Three placements inside Story Combined v1 for beat draft marks, the Save refusal, header Undo/Redo messages and the no-"body" insertion wording. Sample text; changes stay in the preview. Unapproved drafts.',
  states: [
    { id: 'pending', title: 'Drafts pending' },
    { id: 'refused', title: 'Save refused' },
    { id: 'conflict', title: 'Source conflict' },
    { id: 'undone', title: 'After Undo' },
  ],
  variants: [
    { id: 'header', title: '1 · Header save status', load: () => import('./header.ts') },
    { id: 'footer', title: '2 · Status bar', load: () => import('./footer.ts') },
    { id: 'strip', title: '3 · Refusal above Tracks', load: () => import('./strip.ts') },
  ],
};
