/// <reference types="vite/client" />
// Read-only visual fixture. Data comes from the disposable actual UI/core journey.
import '../src/styles.css';
import '../src/ui-refresh.css';
import '../src/screen-ui.css';
import { ScreensWorkspace, type ScreenDocument } from '../src/screen-ui.ts';
import { loadPreferences } from '../src/preferences.ts';
import { icon } from '../src/icons.ts';
import { labPage } from '../design-lab/page.ts';
import type { ScreenCatalog, ResolvedScreenTarget } from '../src/screen-contracts.ts';
import type { MediaPresentation } from '../src/scene-ui.ts';
interface Data { catalog:ScreenCatalog;documents:ScreenDocument[];authoring:unknown;targets:ResolvedScreenTarget[];media:MediaPresentation[] }
const sample=(window as unknown as {controlComparison:{data:Data;state:string}}).controlComparison;
await loadPreferences();document.documentElement.dataset.theme='dark';
const frame=labPage(document.querySelector<HTMLElement>('#preview')!,{state:sample.state,theme:'dark'},{screen:'screens',title:'Screens',subtitle:''});
frame.heading.remove();const navigation=document.createElement('button');navigation.className='tree-item selected';navigation.setAttribute('aria-label','Screens');navigation.append(icon('panel'),document.createTextNode('Screens'));frame.shell.querySelector('[aria-label=Source]')!.after(navigation);frame.shell.classList.add('control-production-comparison');
frame.shell.querySelector('.lp-sample')!.textContent='Production controls · Disposable core fixture';
frame.shell.querySelector('.lp-fiction')!.textContent='Read-only comparison · Canvas helper offline';
const workspace=new ScreensWorkspace({projectId:'control-production-comparison',resolution:{width:1280,height:720},current:()=>true,coordinate:task=>task(),source:()=>{},saved:()=>{throw Error('Comparison refuses writes');},preview:()=>{throw Error('Comparison refuses project execution');},request:async<T>(operation:string,payload:Record<string,unknown>={}):Promise<T>=>{
  if(operation==='source.list')return {files:sample.data.documents.map(d=>({path:d.path}))} as T;
  if(operation==='screens.list')return structuredClone(sample.data.catalog) as T;
  if(operation==='screens.inspect')return structuredClone(sample.data.documents.find(d=>d.path===payload.path)) as T;
  if(operation==='authoring.list')return structuredClone(sample.data.authoring) as T;
  if(operation==='screens.resolveTarget')return structuredClone(sample.data.targets.find(t=>t.binding.screenId===(payload.binding as {screenId:string}).screenId)) as T;
  if(operation==='media.present')return structuredClone(sample.data.media.find(m=>m.assetId===payload.assetId)) as T;
  if(operation==='screens.canvasRender'||operation==='screens.canvasStatus')return {phase:'unavailable',message:'Canvas helper offline for inspector comparison. No runtime or fidelity claim.'} as T;
  throw Error(`Comparison refuses ${operation}`);
}});
const owner=sample.data.catalog.owned.find(o=>o.name==='controls_dialog')!;
workspace.mount(frame.content);
const observer=new MutationObserver(()=>{
  const picker=workspace.panel.querySelector<HTMLSelectElement>('.screen-picker select');if(!picker?.options.length)return;
  observer.disconnect();picker.value=JSON.stringify(['owned',owner.id]);picker.dispatchEvent(new Event('change',{bubbles:true}));
  const node=sample.data.documents.find(d=>d.path===owner.path)!.screens[0]!.nodes.find(n=>n.kind===(sample.state==='bar'?'bar':'imagebutton'))!;
  workspace.panel.querySelector<HTMLElement>(`[data-node-id="${node.id}"]`)?.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));
  if(sample.state==='invalid-size'){const input=workspace.panel.querySelector<HTMLInputElement>('[aria-label="Width"]')!;input.value='oops';input.dispatchEvent(new Event('input',{bubbles:true}));[...workspace.panel.querySelectorAll('button')].find(b=>b.textContent==='Apply changes')?.click();}
  document.documentElement.dataset.comparisonReady='true';
});observer.observe(workspace.panel,{childList:true,subtree:true});
