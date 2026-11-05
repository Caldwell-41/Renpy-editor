/// <reference types="vite/client" />
/** Test-only visual fixture. Mounts the production workspace; never accepts writes. */
import "../src/styles.css";
import "../src/ui-refresh.css";
import "../src/screen-ui.css";
import {ScreensWorkspace} from "../src/screen-ui.ts";
import {loadPreferences} from "../src/preferences.ts";
import {labPage,element,action} from "../design-lab/page.ts";
import {fixture,clone,render} from "../design-lab/screens/shared-look/editor-sample.ts";
import {icon} from "../src/icons.ts";
import type {ResolvedScreenTarget,VariableSample} from "../src/screen-contracts.ts";
import type {ScreenVariable} from "../src/screen-interactions.ts";
await loadPreferences();
const state=new URLSearchParams(location.search).get("state")??"button";
const host=document.querySelector<HTMLElement>("#preview")!;
const stateTitle=document.querySelector<HTMLOptionElement>('[aria-label="Review state"] option');if(stateTitle)stateTitle.textContent=({button:"Button actions",text:"Text and samples",limit:"Eight actions",invalid:"Invalid integer"} as Record<string,string>)[state]??state;
const sample=fixture("");
const variables:ScreenVariable[]=[{id:"coins",technicalName:"coins",variableType:"int",defaultValue:"12",source:{sourceRevision:"coins-source"}},{id:"help_seen",technicalName:"help_seen",variableType:"bool",defaultValue:false,source:{sourceRevision:"seen-source"}},{id:"player_name",technicalName:"player_name",variableType:"string",defaultValue:"Mara",source:{sourceRevision:"name-source"}}];
for(const doc of sample.documents){doc.authoringRevision="fictional-authoring";for(const node of doc.screens[0]!.nodes){if(node.kind==="text")node.variableBindings=[];if(node.id==="close")node.actions=[{type:"setVariable",variableId:"help_seen",value:true},{type:"showScreen",target:{screenId:"About",sourceName:"About"}},{type:"finishInteraction"}];}}
const body=sample.documents[0]!.screens[0]!.nodes.find(n=>n.id==="body")!;body.literal="Coins: [coins!q]\nPlayer: [player_name!q]";body.variableBindings=[{variableId:"coins"},{variableId:"player_name"}];

const owners=sample.documents.map(doc=>({id:doc.screens[0]!.name,rootId:"root",name:doc.screens[0]!.name,path:doc.path,kind:doc===sample.documents[0]?"dialog" as const:"panel" as const,resolved:true,sourceRevision:doc.revision}));
const frame=labPage(host,{state,theme:"dark"},{screen:"screens",title:"Screens",subtitle:""});frame.heading.remove();frame.shell.classList.add("screen-interactions-study");frame.shell.querySelector(".lp-sample")!.textContent="A · Expandable actions · Draft";frame.shell.querySelector(".lp-fiction")!.textContent="Browser mock · All changes stay in memory";
const nav=action("Screens",()=>{});nav.className="tree-item selected";nav.ariaLabel=nav.title="Screens";nav.ariaCurrent="page";nav.prepend(icon("panel"));frame.shell.querySelector('[aria-label="Source"]')!.after(nav);
const workspace=new ScreensWorkspace({projectId:"production-interactions-comparison",resolution:{width:1280,height:720},current:()=>true,coordinate:task=>task(),source:()=>{},preview:()=>{throw Error("Test-only comparison refuses execution");},saved:()=>{throw Error("Test-only comparison refuses writes");},request:async<T>(operation:string,payload:Record<string,unknown>={}):Promise<T>=>{
 if(operation==="source.list")return {files:sample.documents.map(d=>({path:d.path}))} as T;
 if(operation==="screens.list")return {projectRevision:"fictional-project",sourceMapRevision:"fictional-map",inventoryRevision:"fictional-inventory",owned:owners} as T;
 if(operation==="screens.inspect")return clone(sample.documents.find(d=>d.path===payload.path)) as T;
 if(operation==="authoring.list")return {assets:[],variables} as T;
 if(operation==="screens.resolveTarget"){const binding=payload.binding as {screenId:string;sourceName:string};const owner=owners.find(o=>o.id===binding.screenId)!;return {binding,kind:owner.kind,blocking:owner.kind==="dialog",canShowHide:owner.kind==="panel",path:owner.path,rootId:owner.rootId,revisions:{source:owner.sourceRevision,sourceMap:"fictional-map",inventory:"fictional-inventory",effects:"fictional-effects"}} as ResolvedScreenTarget as T;}
 if(operation==="screens.canvasRender"){
  const doc=clone(sample.documents.find(d=>d.path===payload.path)!);
  const values=new Map(variables.map(v=>[v.technicalName,v.defaultValue]));for(const value of payload.variableSamples as VariableSample[]??[]){const variable=variables.find(v=>v.id===value.variableId);if(variable)values.set(variable.technicalName,value.value);}
  const substitute=(text:string)=>text.replace(/\[([A-Za-z_][A-Za-z_0-9]*)!q\]/g,(token,name:string)=>String(values.get(name)??token));
  for(const node of doc.screens[0]!.nodes)if(node.kind==="text")node.literal=node.literal==null?null:substitute(node.literal);
  const textStyles=(payload.textStyles as {nodeStart:number;values:{text?:string}}[]??[]).map(sample=>({...sample,values:{...sample.values,...(sample.values.text===undefined?{}:{text:substitute(sample.values.text)})}}));
  return render(doc,{...payload,textStyles}) as T;
 }
 throw Error(`Test-only comparison refuses ${operation}.`);
}});
workspace.mount(frame.content);
const observer=new MutationObserver(()=>{
 const row=workspace.panel.querySelector<HTMLElement>(`[data-node-id="${state==="text"?"body":"close"}"]`);if(!row)return;observer.disconnect();row.dispatchEvent(new MouseEvent("dblclick",{bubbles:true}));
 if(state==="text")[...workspace.panel.querySelectorAll("button")].find(b=>b.textContent==="Sample values")?.click();
 if(state==="limit") {
  for(let index=0;index<5;index++){const add=workspace.panel.querySelector<HTMLSelectElement>('[aria-label="Add action"]')!;add.value="setVariable";add.dispatchEvent(new Event("change",{bubbles:true}));}
  const details=[...workspace.panel.querySelectorAll<HTMLDetailsElement>(".siv-sequence details")];for(const [index,detail]of details.entries())detail.open=index===0;
  workspace.panel.querySelector<HTMLElement>(".siv-sequence summary")?.focus({preventScroll:true});workspace.panel.querySelector<HTMLElement>(".screen-text-body")!.scrollTop=0;
 }
 if(state==="invalid"){const variable=workspace.panel.querySelector<HTMLSelectElement>('[aria-label="Action 1 variable"]')!;variable.value="coins";variable.dispatchEvent(new Event("change",{bubbles:true}));const value=workspace.panel.querySelector<HTMLInputElement>('[aria-label="Action 1 value"]')!;value.value="12 + 1";value.dispatchEvent(new Event("input",{bubbles:true}));}
 host.dataset.ready="true";
});observer.observe(workspace.panel,{childList:true,subtree:true});
Object.assign(window,{productionComparison:workspace});
