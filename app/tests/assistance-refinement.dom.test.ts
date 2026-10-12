import assert from "node:assert/strict";
import test from "node:test";
import {Window} from "happy-dom";
import {mountStudioSettings} from "../src/ai-settings-ui.ts";
import {openSettings} from "../src/settings-ui.ts";
import {mountRewrite} from "../src/rewrite-ui.ts";
import {emptyReference,renderReferenceLibrary} from "../src/reference-ui.ts";
const tick=()=>new Promise(r=>setTimeout(r,20));
function setup(){const w=new Window();Object.assign(globalThis,{window:w,document:w.document,HTMLElement:w.HTMLElement,HTMLInputElement:w.HTMLInputElement,HTMLTextAreaElement:w.HTMLTextAreaElement,HTMLSelectElement:w.HTMLSelectElement,Event:w.Event});document.body.innerHTML='<button id="entry">Open assistance</button><div class="app-shell"><header></header><main></main></div><footer></footer>';return w;}
function button(name:string){return [...document.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent===name)!;}
function enter(id:string,value:string){const n=document.getElementById(id) as HTMLInputElement;n.value=value;n.dispatchEvent(new window.Event('input',{bubbles:true}));return n;}
const settings={label:'Saved',endpoint:'http://127.0.0.1:8888/v1',model:'fixture',contextCeiling:8192,contextBudget:4096,maximumResponse:1024};
const profile={profileId:'p',revision:1,disabled:false,credentialStatus:'configured',compatibilityState:'ready',settings,discovery:null};
function bridge(w:Window,fn:(op:string,p:Record<string,unknown>)=>unknown){Object.assign(w,{__TAURI_INTERNALS__:{invoke:async(_:string,{request}:{request:{requestId:string;operation:string;payload:Record<string,unknown>}})=>({protocolVersion:1,requestId:request.requestId,ok:true,value:await fn(request.operation,request.payload)})}});}

test('Studio draft refusals preserve fields across switch/reload/cleanup and busy ownership; switching clears old errors',async()=>{
 const w=setup();const calls:string[]=[];let hold!:(v:unknown)=>void;
 const snapshot={token:'t',profiles:[profile],cleanup:[{profileId:'retained'}]};
 bridge(w,op=>{calls.push(op);return op==='ai.saveProfile'?new Promise(r=>{hold=r;}):snapshot;});
 const c=mountStudioSettings(document.querySelector('main')!,document.querySelector('footer')!);window.confirm=()=>false;
 try{await tick();const top=enter('studio-top-p','1.1');top.dispatchEvent(new Event('blur'));assert.equal(top.getAttribute('aria-invalid'),'true');
 const chooser=document.querySelector<HTMLSelectElement>('select')!;chooser.value='';chooser.dispatchEvent(new Event('change'));assert.equal(chooser.value,'p');assert.equal(top.value,'1.1');
 button('Reload saved profiles').click();button('Retry owned credential cleanup').click();assert.deepEqual(calls,['ai.profiles']);assert.equal(c.canLeave(),false);
 window.confirm=()=>true;chooser.value='';chooser.dispatchEvent(new Event('change'));assert.equal(document.querySelector('.studio-draft-state')!.textContent,'New profile · unsaved');assert.equal(top.getAttribute('aria-invalid'),null);assert.equal(document.querySelector('.field-error')!.textContent,'');
 chooser.value='p';chooser.dispatchEvent(new Event('change'));enter('studio-top-p','0.9');button('Save profile').click();assert.equal(c.canLeave(),false);assert.deepEqual(calls,['ai.profiles','ai.saveProfile']);hold(snapshot);await tick();assert.equal(c.canLeave(),true);
 }finally{c.dispose();await w.happyDOM.close();}
});

test('profile submission rechecks untouched/dependent fields, reveals error and retains invalid input without a write',async()=>{
 const w=setup();const calls:string[]=[];bridge(w,op=>(calls.push(op),{token:'t',profiles:[profile],cleanup:[]}));const c=mountStudioSettings(document.querySelector('main')!,document.querySelector('footer')!);
 try{await tick();const limit=enter('studio-configured-capacity-unverified','200');const response=enter('studio-maximum-response','4096');button('Save profile').click();assert.deepEqual(calls,['ai.profiles']);assert.equal(limit.closest('details')!.open,true);assert.equal(document.activeElement,limit);assert.equal(response.value,'4096');assert.equal(response.getAttribute('aria-invalid'),'true');
 enter('studio-configured-capacity-unverified','8192');enter('studio-maximum-response','1024');button('Save profile').click();await tick();assert.deepEqual(calls,['ai.profiles','ai.saveProfile']);
 }finally{c.dispose();await w.happyDOM.close();}
});

test('Settings navigation and close keep a Studio draft until explicit discard; return focus to invoker',async()=>{
 const w=setup();const calls:string[]=[];bridge(w,op=>(calls.push(op),{token:'t',profiles:[profile],cleanup:[]}));const entry=document.getElementById('entry')!;entry.focus();openSettings();button('AI providers').click();await tick();window.confirm=()=>false;
 try{enter('studio-profile-name','Retained draft');button('Workspace').click();button('Close settings').click();assert(document.querySelector('.studio-settings'));assert.equal((document.querySelector('#studio-profile-name') as HTMLInputElement).value,'Retained draft');assert.deepEqual(calls,['ai.profiles']);
 window.confirm=()=>true;button('Close settings').click();assert.equal(document.querySelector('.settings-overlay'),null);assert.equal(document.activeElement,entry);
 }finally{await w.happyDOM.close();}
});

test('proposed-reference selection enters visible review; oversized optional input is refused on submit without blur',async()=>{
 const w=setup();const content=emptyReference('card');content.title='Mara';content.description='Approved';const record={id:'c',revisionCounter:2,currentRevisionId:'new',approvedRevisionId:'old',revisions:[{id:'old',number:1,status:'approved',content,createdAt:'',reviewedAt:''},{id:'new',number:2,status:'proposed',content:{...content,description:'Proposal'},createdAt:'',reviewedAt:null}]};
 const model={revision:'t',document:{schemaVersion:1 as const,projectId:'p',cards:[record],loreEntries:[]},diagnostic:null,entities:[],issues:[],canUndo:true,canRedo:false};let writes=0;
 const c=renderReferenceLibrary(document.querySelector('main')!,'card',model,{creationHost:document.querySelector('header')!,current:()=>true,guard:async()=>true,status:()=>{},load:async()=>model,apply:async()=>{writes++;return model;}});
 try{document.querySelector<HTMLButtonElement>('.reference-entry')!.click();await tick();assert.equal(document.activeElement?.className,'reference-identity');assert(document.querySelector<HTMLDetailsElement>('.reference-proposal-review')!.open);assert.equal(document.querySelector<HTMLDetailsElement>('.reference-frozen-fields')!.open,false);
 button('New character card').click();await tick();const title=document.querySelector<HTMLInputElement>('[name=title]')!;title.value='New';title.dispatchEvent(new Event('input'));const background=document.querySelector<HTMLTextAreaElement>('[name=background]')!;background.value='雪'.repeat(3334);background.dispatchEvent(new Event('input'));await c.save();assert.equal(writes,0);assert.equal(document.activeElement,background);assert.equal(background.closest('details')!.open,true);assert.equal(background.value.length,3334);
 }finally{c.dispose();await w.happyDOM.close();}
});

test('Assist has one primary action per stage, keeps inspected budget visible, focuses Cancel and returns to invoker',async()=>{
 const w=setup();const entry=document.getElementById('entry')!;entry.focus();const calls:string[]=[];
 const prepared={token:'send',payloadDigest:'digest',serializedPayload:'{"exact":true}',destination:{provider:'Unsloth Studio',endpoint:settings.endpoint,model:'fixture',connectionLocation:'Loopback HTTP',inferenceLocality:'Unknown',retention:'Unknown'},size:{estimatedInputTokens:400,maximumResponse:1024,margin:128,total:1552,contextBudget:4096,contextCeiling:8192},context:{included:[],excluded:[],dependencies:[]},protected:[],responseMode:'Structured'};
 const c=mountRewrite(document.querySelector('main')!,'s','b',{current:()=>true,accepted:()=>{},call:async<T>(op:string):Promise<T>=>{calls.push(op);return (op==='context.options'?{prompt:{revision:'r'},structureRevision:'s',targets:[{sceneId:'s',beatId:'b',label:'Saved narration',sourceRevision:'r'}],references:[]}:op==='ai.profiles'?{token:'t',profiles:[profile]}:op==='rewrite.prepare'?prepared:op==='rewrite.send'?{requestId:'request',done:false,state:'sending',message:'Sending',proposal:null}:op==='ai.requestStatus'?new Promise(()=>{}):{done:true,state:'cancelled',message:'Cancelled'}) as T;}});
 const primaries=()=>[...document.querySelectorAll<HTMLButtonElement>('.rewrite-footer .primary')].filter(n=>!n.hidden);
 try{await tick();assert.equal(document.activeElement?.getAttribute('name'),'rewriteTask');const task=document.querySelector<HTMLTextAreaElement>('[name=rewriteTask]')!;task.value='Rewrite';task.dispatchEvent(new Event('input'));assert.equal(primaries().length,1);button('Review complete send').click();await tick();assert.equal(document.activeElement?.textContent,'Review complete send');assert.equal(primaries().length,1);assert(document.querySelector('.rewrite-result')!.textContent!.includes('1552 / 4096'));button('Generate proposal').click();await tick();assert.equal(document.activeElement?.textContent,'Cancel request');assert.equal(primaries().length,0);button('Cancel request').click();await tick();window.confirm=()=>true;button('Close Assist').focus();button('Close Assist').click();await tick();assert.equal(document.activeElement,entry);assert.equal(calls.filter(op=>op==='rewrite.accept').length,0);
 }finally{c.dispose();await w.happyDOM.close();}
});

test('nonmodal Assist completion preserves focus and input in unrelated authoring',async()=>{
 const w=setup();const author=document.createElement('textarea');author.ariaLabel='Story draft';document.body.append(author);let finish!:(v:unknown)=>void;
 const c=mountRewrite(document.querySelector('main')!,'s','b',{current:()=>true,accepted:()=>{},call:async<T>(op:string):Promise<T>=>{
  if(op==='rewrite.send')return await new Promise<unknown>(r=>{finish=r;}) as T;
  return (op==='context.options'?{prompt:{revision:'r'},structureRevision:'s',targets:[{sceneId:'s',beatId:'b',label:'Saved narration',sourceRevision:'r'}],references:[]}:op==='ai.profiles'?{token:'t',profiles:[profile]}:{token:'send',payloadDigest:'digest',serializedPayload:'{}',destination:{provider:'Unsloth Studio',endpoint:settings.endpoint,model:'fixture',connectionLocation:'Loopback HTTP',inferenceLocality:'Unknown',retention:'Unknown'},size:{total:1552,contextBudget:4096,contextCeiling:8192},context:{included:[],excluded:[],dependencies:[]},protected:[]}) as T;
 }});
 try{await tick();const task=document.querySelector<HTMLTextAreaElement>('[name=rewriteTask]')!;task.value='Rewrite';task.dispatchEvent(new Event('input'));button('Review complete send').click();await tick();button('Generate proposal').click();author.focus();author.value='Still writing';finish({requestId:'r',done:true,state:'completed',message:null,proposal:{proposalId:'p',previewDigest:'d',target:{sceneId:'s',beatId:'b'},beforeSegments:[{literal:'Old'}],segments:[{literal:'New'}],protected:[],patches:[],uncertainty:'Preview only'}});await tick();assert.equal(document.activeElement,author);assert.equal(author.value,'Still writing');assert.equal(document.querySelector('.rewrite-panel')!.getAttribute('data-stage'),'2');
 }finally{c.dispose();await w.happyDOM.close();}
});

test('unfinished status replies preserve focus while inspecting request details',async()=>{
 const w=setup();let finishStatus!:(v:unknown)=>void;
 const c=mountRewrite(document.querySelector('main')!,'s','b',{current:()=>true,accepted:()=>{},call:async<T>(op:string):Promise<T>=>{
  if(op==='ai.requestStatus')return await new Promise<unknown>(r=>{finishStatus=r;}) as T;
  return (op==='context.options'?{prompt:{revision:'r'},structureRevision:'s',targets:[{sceneId:'s',beatId:'b',label:'Saved narration',sourceRevision:'r'}],references:[]}:op==='ai.profiles'?{token:'t',profiles:[profile]}:op==='rewrite.send'?{requestId:'r',done:false,state:'sending',message:'Sending',proposal:null}:{token:'send',payloadDigest:'digest',serializedPayload:'{}',destination:{provider:'Unsloth Studio',endpoint:settings.endpoint,model:'fixture',connectionLocation:'Loopback HTTP',inferenceLocality:'Unknown',retention:'Unknown'},size:{total:1552,contextBudget:4096,contextCeiling:8192},context:{included:[],excluded:[],dependencies:[]},protected:[]}) as T;
 }});
 try{await tick();const task=document.querySelector<HTMLTextAreaElement>('[name=rewriteTask]')!;task.value='Rewrite';task.dispatchEvent(new Event('input'));button('Review complete send').click();await tick();button('Generate proposal').click();await tick();const summary=document.querySelector<HTMLElement>('.rewrite-result summary')!;summary.focus();finishStatus({requestId:'r',done:false,state:'receiving',message:'Receiving',proposal:null});await tick();assert.equal(document.activeElement,summary);assert.equal(button('Cancel request').disabled,false);
 }finally{c.dispose();await w.happyDOM.close();}
});
