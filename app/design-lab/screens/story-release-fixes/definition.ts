import type { LabScreen } from '../../contracts.ts';
export const definition: Omit<LabScreen, 'approval'> = {
  id: 'story-release-fixes', title: 'Story Combined · Release qualification fixes', kind: 'prototype',
  description: 'Copy and placement fixes from #120 inside Story Combined v1: condition diagnostics, + New variable in Set variable, placing beats before protected Custom Code, the scene delete refusal, Transition wording, a draft whose beat moved branch, screen beat placement and Tracks character summaries. Sample text; changes stay in the preview. Unapproved drafts.',
  states: [
    { id: 'diagnostics', title: 'D2/B5 · Condition diagnostics' },
    { id: 'set-variable', title: 'B9 · Set variable, no variables yet' },
    { id: 'protected', title: 'B8 · Add before protected Custom Code' },
    { id: 'move-protected', title: 'B8 · Move to across protected Custom Code' },
    { id: 'delete-scene', title: 'B4 · Scene delete refused' },
    { id: 'transition', title: 'B14 · Transition editor' },
    { id: 'transition-add', title: 'B14 · Add a beat, Transition' },
    { id: 'moved-draft', title: 'D1 · Draft whose beat moved branch' },
    { id: 'screen-beat', title: 'B13 · New screen beat placement' },
    { id: 'screen-beat-changed', title: 'B13 · Screen beat place changed' },
    { id: 'tracks-summary', title: 'B18 · Tracks character summaries' },
  ],
  variants: [
    { id: 'a', title: 'A · First option for each item', load: () => import('./a.ts') },
    { id: 'b', title: 'B · Second option for each item', load: () => import('./b.ts') },
    { id: 'a-v2', title: 'Combined · Picks and refinements from review', load: () => import('./a-v2.ts') },
  ],
};
