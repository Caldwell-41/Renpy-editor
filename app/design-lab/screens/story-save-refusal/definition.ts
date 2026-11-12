import type { LabScreen } from '../../contracts.ts';
export const definition: Omit<LabScreen, 'approval'> = {
  id: 'story-save-refusal', title: 'Story · Save refusal with several drafts', kind: 'prototype',
  description: 'Compare three ways Story Save can show a refusal when several beat drafts fail across two scenes. All text is fictional and changes stay in the preview. Variant 1 is approved; variants 2 and 3 are not.',
  states: [{ id: 'refused', title: 'After Save refuses 3 of 5 drafts' }, { id: 'pending', title: '5 drafts before Save' }],
  variants: [
    { id: 'marked', title: '1 · Count and failure marks', load: () => import('./marked.ts') },
    { id: 'stepper', title: '2 · Count with next/previous', load: () => import('./stepper.ts') },
    { id: 'first', title: '3 · First failure only', load: () => import('./first.ts') },
  ],
};
