import type {LabScreen} from '../../contracts.ts';
export const definition:Omit<LabScreen,'approval'>={
  id:'screen-interactions',title:'Screens · Text variables and button actions',kind:'prototype',
  description:'Actual Screens renderer and production styles with fictional, inert services. Three action editors share the same canvas, task rail, tree and inspector.',
  states:[{id:'button',title:'Close button actions'},{id:'text',title:'Text and editor samples'},{id:'choose',title:'Existing element chooser'},{id:'panel',title:'Panel Hide'},{id:'invalid',title:'Invalid integer'},{id:'missing',title:'Missing variable'},{id:'stale',title:'Changed source'},{id:'conflict',title:'Source conflict'},{id:'custom',title:'Custom actions'},{id:'component',title:'Component actions'},{id:'limit',title:'Eight actions'}],
  variants:[{id:'inspector-v2',title:'A · Expandable actions',load:()=>import('./inspector.ts')},{id:'worksheet-v2',title:'B · Sequence and editor',load:()=>import('./worksheet.ts')},{id:'workspace-v2',title:'C · Direct rows',load:()=>import('./workspace.ts')}],
  check:'./screens/screen-interactions/check.mjs',
};
