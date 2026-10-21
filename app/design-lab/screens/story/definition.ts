import type { LabScreen } from '../../contracts.ts';
export const definition: Omit<LabScreen, 'approval'> = {
  id: 'story', title: 'Story', kind: 'prototype',
  description: 'Two Story drafts with identical fictional scenes, structured beats and simulated Assist review.',
  states: [{ id: 'populated', title: 'Arrival scene' }, { id: 'empty', title: 'Empty scene' }, { id: 'long', title: 'Long scene' }, { id: 'error', title: 'Simulated save refusal' }],
  variants: [{ id: 'manuscript', title: 'Manuscript desk', load: () => import('./manuscript.ts') }, { id: 'stage', title: 'Stage & sequence', load: () => import('./stage.ts') }],
  check: './screens/story/check.mjs',
};
