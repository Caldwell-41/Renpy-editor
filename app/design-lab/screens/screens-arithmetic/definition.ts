import type { LabScreen } from '../../contracts.ts';
export const definition: Omit<LabScreen, 'approval'> = {
  id: 'screens-arithmetic', title: 'Screens · Arithmetic and decimals', kind: 'prototype',
  description: 'Draft arithmetic controls in the existing Screens inspector, plus decimal defaults, conditions and text samples. Fictional browser memory only.',
  states: [
    {id:'button',title:'Textbutton actions'}, {id:'imagebutton',title:'Imagebutton actions'},
    {id:'decimal',title:'Decimal result'}, {id:'invalid',title:'Invalid formula'},
    {id:'unknown',title:'Unknown current value'}, {id:'protected',title:'Protected timing'},
    {id:'stale',title:'Changed source'}, {id:'limits',title:'Context and eight actions'},
    {id:'variables',title:'Decimal creation and defaults'}, {id:'condition',title:'Numeric condition'},
    {id:'text',title:'Decimal text and samples'},
  ],
  variants: [
    {id:'equation-v2',title:'A2 · Story equation refinement',load:()=>import('./refined.ts')},
    {id:'equation-v1',title:'A · Equation disclosure',load:()=>import('./equation.ts')},
    {id:'sequence-v1',title:'B · Sequence and editor',load:()=>import('./sequence.ts')},
    {id:'expanded-v1',title:'C · Expanded worksheet',load:()=>import('./expanded.ts')},
  ],
};
