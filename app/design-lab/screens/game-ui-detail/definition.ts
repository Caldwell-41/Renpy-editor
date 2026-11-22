import type { LabScreen } from '../../contracts.ts';
export const definition: Omit<LabScreen, 'approval'> = {
  id: 'game-ui-detail', title: 'Game UI · Detailed level', kind: 'prototype',
  description: 'Direct work on elements on the screen canvas for #205, on top of the approved layout B of Game UI: selection, the keyboard, moving and resizing, adding, deleting and reordering, the element list, the look for each state, button actions, variable text, bar values and parts that Loomlight cannot edit. Each mock is a set of four choices, and the dashed bar changes one choice at a time. A browser drawing stands in for the hidden Ren\'Py process. Sample project; changes stay in the preview. Unapproved drafts.',
  states: [
    { id: 'group', title: 'Title screen, the Menu buttons group' },
    { id: 'button', title: 'Ticket stub, a button inside two boxes' },
    { id: 'text', title: 'Ticket stub, text with variables' },
    { id: 'bar', title: 'Ticket stub, a bar' },
    { id: 'source', title: 'Ticket stub, a part that is source only' },
    { id: 'box', title: 'Ticket stub, a box and its properties' },
    { id: 'screen', title: 'Ticket stub, nothing selected' },
  ],
  variants: [
    { id: 'chosen', title: 'D · Chosen mix', load: () => import('./chosen.ts') },
    { id: 'point', title: 'A · Point and change', load: () => import('./point.ts') },
    { id: 'boxes', title: 'B · Boxes first', load: () => import('./boxes.ts') },
    { id: 'place', title: 'C · Place it yourself', load: () => import('./place.ts') },
  ],
};
