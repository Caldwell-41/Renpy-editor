import type { LabScreen } from '../../contracts.ts';
export const definition: Omit<LabScreen, 'approval'> = {
  id: 'story-draft-conflict', title: 'Story · Retained draft conflict', kind: 'prototype',
  description: 'Compare two ways to resolve a Story draft conflict. All text is fictional and changes stay in the preview. Neither version is approved.',
  states: [{ id: 'start', title: 'Hello → draft → saved change' }, { id: 'conflict', title: 'Return to a conflicted beat' }],
  variants: [
    { id: 'inline', title: 'A · Separate buttons', load: () => import('./inline.ts') },
    { id: 'compact', title: 'B · Buttons together', load: () => import('./compact.ts') },
  ],
};
