// Current-source compatibility candidate. The approved 7090a03 reference is preserved separately.
import type {LabContext} from '../../contracts.ts';
import {labPage, action} from '../../page.ts';
import {ScreensWorkspace, type ScreenDocument} from '../../../src/screen-ui.ts';
import type {CompositionCommand} from '../../../src/screen-composition.ts';
import type {ResolvedScreenTarget, ScreenRevisions, VariableSample} from '../../../src/screen-contracts.ts';
import type {ScreenVariable} from '../../../src/screen-interactions.ts';
import {loadPreferences} from '../../../src/preferences.ts';
import {icon} from '../../../src/icons.ts';
import {fixture, clone, applyText, render, source, type Sample} from '../shared-look/editor-sample.ts';
import '../../../src/screen-ui.css';
import './style.css';
export type Variant='inspector'|'worksheet'|'workspace'|'reference';
const titles:Record<Variant,string>={inspector:'A · Expandable actions',worksheet:'B · Sequence and editor',workspace:'C · Direct rows',reference:'Existing Screens'};

export async function mountStudy(host:HTMLElement,context:LabContext,variant:Variant){
  await loadPreferences();document.documentElement.dataset.theme=context.theme;
  const variables:ScreenVariable[]=[
    {id:'coins',technicalName:'coins',variableType:'int',defaultValue:'12',source:{sourceRevision:'coins-source'}},
    {id:'help_seen',technicalName:'help_seen',variableType:'bool',defaultValue:false,source:{sourceRevision:'seen-source'}},
    {id:'player_name',technicalName:'player_name',variableType:'string',defaultValue:'Mara',source:{sourceRevision:'name-source'}},
  ];
  let sample=fixture(''),disposed=false,entered=context.state==='choose';
  const owner=(doc:ScreenDocument)=>context.state==='component'&&doc.path===sample.documents[0]!.path?'component':doc.path===sample.documents[0]!.path&&context.state!=='panel'?'dialog':'panel';
  const targets=()=>sample.documents.map(doc=>({id:doc.screens[0]!.name,rootId:'root',name:doc.screens[0]!.name,path:doc.path,kind:owner(doc),resolved:true,sourceRevision:doc.revision}));
  // Eligibility is fixture data, never inferred from kind, effects or nonblocking alone.
  const capabilities=new Map([['Help',{canShowHide:context.state==='panel',blocking:context.state!=='panel'&&context.state!=='component'}],['About',{canShowHide:true,blocking:false}]]);
  const revisions=(doc:ScreenDocument):ScreenRevisions=>({source:doc.revision,sourceMap:`map-${sample.revision}`,inventory:'sample',effects:`effects-${sample.revision}`});
  for(const doc of sample.documents){
    doc.authoringRevision='fictional-authoring';
    for(const node of doc.screens[0]!.nodes){
      node.variableBindings=node.kind==='text'?[]:null;
      node.actions=node.kind==='textbutton'?[]:null;
      if(node.id==='close')node.actions=context.state==='custom'?null:[
        {type:'setVariable',variableId:'help_seen',value:true},
        {type:'showScreen',target:{screenId:'About',sourceName:'About'}},
        ...(owner(doc)==='dialog'?[{type:'finishInteraction'} as const]:[{type:'hideScreen',target:{screenId:doc.screens[0]!.name,sourceName:doc.screens[0]!.name}} as const]),
      ];
    }
  }
  const body=sample.documents[0]!.screens[0]!.nodes.find(n=>n.id==='body')!;
  body.literal='Coins: [coins!q]\nPlayer: [player_name!q]';body.variableBindings=[{variableId:'coins'},{variableId:'player_name'}];
  if(context.state==='missing')sample.documents[0]!.screens[0]!.nodes.find(n=>n.id==='close')!.actions![0]={type:'setVariable',variableId:'missing',value:'12'};
  const past:Sample[]=[],future:Sample[]=[];
  const frame=labPage(host,context,{screen:'screens',title:'Screens',subtitle:'',dirty:()=>workspace.hasDraft()});
  frame.shell.classList.add('screen-interactions-study');frame.heading.remove();
  frame.shell.querySelector('.lp-sample')!.textContent=`${titles[variant]} · Current-source compatibility draft`;
  frame.shell.querySelector('.lp-fiction')!.textContent='Browser mock · All changes stay in memory';
  const nav=action('Screens',()=>{});nav.className='tree-item selected';nav.ariaLabel=nav.title='Screens';nav.ariaCurrent='page';nav.prepend(icon('panel'));frame.shell.querySelector('[aria-label="Source"]')!.after(nav);
  const report=(message:string)=>{frame.status.textContent=message;};
  frame.shell.addEventListener('click',event=>{const control=(event.target as HTMLElement).closest<HTMLElement>('.lp-navigation .tree-item,.brand,.lp-studio-link,.lp-runtime-link');if(control){event.preventDefault();event.stopImmediatePropagation();report('Only Screens is active in this browser mock.');}},{capture:true});
  // One memory-only transaction/history service. ScreenText owns every visible draft,
  // Apply, Cancel, retained-draft notice, insertion and sample control.
  const workspace=new ScreensWorkspace({
    projectId:'screen-interactions-v2',resolution:{width:1280,height:720},current:()=>!disposed,coordinate:task=>task(),
    source:()=>report('Source navigation stays in the application. This sample writes no files.'),
    preview:()=>report('This mock starts no Ren\'Py or validation process.'),saved:()=>report('Applied to this browser sample. No game actions ran.'),
    useInStory:async()=>{throw Error('This browser mock refuses Story insertion.');},
    request:async<T>(operation:string,payload:Record<string,unknown>={}):Promise<T>=>{
      if(operation==='source.list')return {files:sample.documents.map(d=>({path:d.path}))} as T;
      if(operation==='screens.list')return {projectRevision:`project-${sample.revision}`,sourceMapRevision:`map-${sample.revision}`,inventoryRevision:'sample',owned:targets()} as T;
      if(operation==='screens.inspect')return clone(sample.documents.find(d=>d.path===payload.path)) as T;
      if(operation==='authoring.list')return {assets:[],variables:clone(variables)} as T;
      if(operation==='screens.resolveTarget'){
        const binding=payload.binding as {screenId:string;sourceName:string},target=targets().find(t=>t.id===binding.screenId&&t.name===binding.sourceName);
        if(!target)throw Error('This fictional target is unavailable.');
        const capability=capabilities.get(target.id)!,doc=sample.documents.find(d=>d.path===target.path)!;
        return {binding,kind:target.kind,...capability,path:target.path,rootId:target.rootId,revisions:revisions(doc)} as ResolvedScreenTarget as T;
      }
      if(operation==='screens.canvasRender'){
        const doc=clone(sample.documents.find(d=>d.path===payload.path)!);
        const values=new Map(variables.map(v=>[v.technicalName,v.defaultValue]));
        for(const value of payload.variableSamples as VariableSample[]??[]){
          const variable=variables.find(v=>v.id===value.variableId);
          if(!variable||variable.source.sourceRevision!==value.expectedSourceRevision)throw Error('This fictional sample revision is unavailable.');
          values.set(variable.technicalName,value.value);
        }
        // Browser-drawn literal samples, not a Ren'Py source parser or helper.
        const substitute=(text:string)=>text.replace(/\[([A-Za-z_][A-Za-z_0-9]*)!q\]/g,(token,name:string)=>String(values.get(name)??token));
        for(const node of doc.screens[0]!.nodes)if(node.kind==='text')node.literal=substitute(node.literal??'');
        const textStyles=(payload.textStyles as {nodeStart:number;values:{text?:string}}[]??[]).map(s=>({...s,values:{...s.values,...(s.values.text===undefined?{}:{text:substitute(s.values.text)})}}));
        return render(doc,{...payload,textStyles}) as T;
      }
      if(operation==='source.open'){const doc=sample.documents.find(d=>d.path===payload.path)!;return {path:doc.path,text:source(sample,doc),dirty:false,baseRevision:doc.revision,hasBom:false} as T;}
      if(operation==='scene.list')return {projectRevision:`project-${sample.revision}`,sourceMapRevision:`map-${sample.revision}`} as T;
      if(operation==='scene.apply'){
        const type=(payload.command as {type:string}).type;
        if(type!=='undo'&&type!=='redo')throw Error('This mock only supports in-memory Undo and Redo.');
        const from=type==='undo'?past:future,to=type==='undo'?future:past,previous=from.pop();
        if(previous){to.push(clone(sample));sample=previous;}return {} as T;
      }
      if(operation==='screens.compose'){
        if(context.state==='stale')throw Error('Source changed after this draft started. Your changes are retained.');
        if(context.state==='conflict')throw Error('Resolve the Source conflict before applying. Your changes are retained.');
        const command=payload.command as CompositionCommand;
        if(command.type!=='formatText')throw Error('This mock only applies text, appearance and button-action edits in memory.');
        const doc=sample.documents.find(d=>d.screens[0]!.name===payload.screenId);
        if(!doc||doc.revision!==payload.expectedRevision)throw Error('This fictional Source changed. Your draft is retained.');
        if(command.interaction){
          if(command.interaction.expectedAuthoringRevision!==doc.authoringRevision)throw Error('This fictional authoring revision changed. Your draft is retained.');
          for(const review of command.interaction.expectedTargetRevisions){
            const target=sample.documents.find(d=>d.screens[0]!.name===review.target.screenId&&d.screens[0]!.name===review.target.sourceName);
            if(!target||JSON.stringify(revisions(target))!==JSON.stringify(review.revisions))throw Error('This fictional target changed. Your draft is retained.');
          }
        }
        const next=clone(sample),nextDoc=next.documents.find(d=>d.path===doc.path)!,node=nextDoc.screens[0]!.nodes.find(n=>n.id===command.nodeId)!;
        applyText(next,nextDoc,command);
        if(command.interaction?.actions)node.actions=clone(command.interaction.actions);
        if(command.values.text!==undefined&&node.kind==='text')node.variableBindings=variables.filter(v=>node.literal?.includes(`[${v.technicalName}!q]`)).map(v=>({variableId:v.id}));
        const changed=JSON.stringify(next)!==JSON.stringify(sample);
        if(changed){past.push(clone(sample));future.length=0;next.revision++;next.documents.forEach(d=>d.revision=`sample-${next.revision}`);sample=next;}
        return {document:clone(sample.documents.find(d=>d.path===doc.path)),selectedId:command.nodeId,changed} as T;
      }
      throw Error(`The browser mock does not perform ${operation}.`);
    },
  });
  workspace.mount(frame.content);

  // B/C remain draft presentation experiments over the same production controls.
  // Adapt disclosures only; never replace action inputs, handlers or draft ownership.
  function presentation(){
    const section=workspace.panel.querySelector<HTMLElement>('.siv-actions');
    if(!section||variant==='inspector'||variant==='reference')return;
    const className=`siv-actions siv-${variant}`;if(section.className!==className)section.className=className;
    for(const detail of section.querySelectorAll<HTMLDetailsElement>('details:not([data-lab-presentation])')){
      detail.dataset.labPresentation=variant;const summary=detail.querySelector<HTMLElement>('summary')!,editor=detail.querySelector<HTMLElement>('.siv-row-editor')!;
      if(variant==='worksheet'){
        detail.style.gridColumn='1 / -1';summary.className='button siv-step';summary.style.marginRight='116px';editor.className='siv-single-editor';
        summary.addEventListener('keydown',event=>{if(!['ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();const items=[...section.querySelectorAll<HTMLDetailsElement>('details')],index=items.indexOf(detail),next=items[Math.max(0,Math.min(items.length-1,index+(event.key==='ArrowUp'?-1:1)))]!;next.open=true;next.querySelector('summary')?.focus({preventScroll:true});next.scrollIntoView({block:'nearest'});});
        const tools=detail.parentElement!.querySelector<HTMLElement>('.siv-row-tools')!;tools.style.position='absolute';tools.style.right='0';tools.style.top='4px';
      }else{
        detail.removeAttribute('name');detail.addEventListener('toggle',event=>event.stopImmediatePropagation(),{capture:true});
        detail.open=true;detail.className='siv-direct';summary.className='siv-row-title';summary.style.listStyle='none';summary.addEventListener('click',event=>event.preventDefault());
      }
    }
  }
  function change(label:string,value:string){const input=workspace.panel.querySelector<HTMLInputElement|HTMLSelectElement>(`[aria-label="${label}"]`)!;input.value=value;input.dispatchEvent(new Event(input.tagName==='SELECT'?'change':'input',{bubbles:true}));}
  function update(){
    if(disposed)return;
    if(!entered){
      const id=context.state==='text'?'body':'close',row=workspace.panel.querySelector<HTMLElement>(`[data-node-id="${id}"]`);
      if(row){
        entered=true;row.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));
        if(context.state==='text')workspace.panel.querySelector<HTMLButtonElement>('.siv-sample-toggle')?.click();
        if(context.state==='limit'){
          for(let i=0;i<5;i++)change('Add action','setVariable');
          const details=[...workspace.panel.querySelectorAll<HTMLDetailsElement>('.siv-sequence details')];for(const [index,detail]of details.entries())detail.open=index===0;
          workspace.panel.querySelector<HTMLElement>('.siv-sequence summary')?.focus({preventScroll:true});workspace.panel.querySelector<HTMLElement>('.screen-text-body')!.scrollTop=0;
        }
        if(context.state==='invalid'){change('Action 1 variable','coins');change('Action 1 value','12 + 1');}
        if(context.state==='missing')change('Action 1 value','12');
      }
    }
    presentation();
    const image=workspace.panel.querySelector<HTMLImageElement>('.screen-render');if(image&&image.alt!=='Browser-drawn screen sample')image.alt='Browser-drawn screen sample';
    const status=workspace.panel.querySelector('.screen-canvas-status'),message='Browser sample canvas. Ren\'Py is not running.';if(status&&image&&status.textContent!==message)status.textContent=message;
  }
  const observer=new MutationObserver(update);observer.observe(workspace.panel,{childList:true,subtree:true});
  return()=>{disposed=true;observer.disconnect();workspace.dispose();};
}
