import type { LabScreen } from '../../contracts.ts';
export const definition: Omit<LabScreen, 'approval'> = {
  id: 'story-revamp', title: 'Story · New authoring experiences', kind: 'prototype',
  description: 'Three council-led Story experiments. Create scenes, write and arrange beats, edit branches, and switch to focused writing. All changes stay in memory.',
  states: [{ id: 'populated', title: 'The last service' }, { id: 'empty', title: 'Start a scene' }, { id: 'branching', title: 'Nested alternatives' }, { id: 'protected', title: 'Custom source' }],
  variants: [
    { id: 'cue-sheet', title: 'Cue sheet', load: () => import('./cue-sheet.ts') },
    { id: 'branch-lanes', title: 'Branch lanes', load: () => import('./branch-lanes.ts') },
    { id: 'shot-reel', title: 'Shot reel', load: () => import('./shot-reel.ts') },
  ],
  check: './screens/story-revamp/check.mjs',
};
