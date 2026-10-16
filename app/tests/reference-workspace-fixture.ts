import type { ReferenceWorkspace } from '../src/reference-ui.ts';

/** Passive saved-reference snapshot for shell tests; mutations stay explicitly stubbed. */
export function referenceWorkspace(model:{projectId:string;characters:{id:string;displayName:string;source:{sourceRevision:string}}[]}):ReferenceWorkspace {
  return {document:{schemaVersion:1,projectId:model.projectId,cards:[],loreEntries:[]},revision:'public-reference-revision',diagnostic:null,
    entities:model.characters.map(c=>({kind:'character',id:c.id,title:c.displayName,revision:c.source.sourceRevision})),issues:[],canUndo:false,canRedo:false};
}
