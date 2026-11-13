import type { LabScreen } from '../../contracts.ts';
export const definition: Omit<LabScreen, 'approval'> = {
  id: 'story-combined-editor', title: 'Story Combined · Choice endings and placement wording', kind: 'prototype',
  description: 'Three treatments inside Story Combined v1 for Custom Code option endings, the disabled Then menu and the no-"body" wording in Add a beat and Move to. Sample text; changes stay in the preview. Unapproved drafts.',
  states: [
    { id: 'choice', title: 'Choice editor · option 1 ending unknown' },
    { id: 'custom-code', title: 'Choice editor · option 3 ends with Custom Code' },
    { id: 'then-menu', title: 'Then menu open' },
    { id: 'add-beat', title: 'Add a beat to option 2' },
    { id: 'move', title: 'Move a beat' },
    { id: 'protected', title: 'Protected Choice' },
  ],
  variants: [
    { id: 'label', title: '1 · Menu reads "Custom Code"', load: () => import('./label.ts') },
    { id: 'blank', title: '2 · Menu with no value', load: () => import('./blank.ts') },
    { id: 'replace', title: '3 · Ending replaces the menu', load: () => import('./replace.ts') },
    { id: 'replace-v2', title: '3 · Ending replaces the menu v2', load: () => import('./replace-v2.ts') },
  ],
};
