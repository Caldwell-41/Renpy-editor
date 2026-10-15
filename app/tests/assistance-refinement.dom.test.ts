import assert from "node:assert/strict";
import test from "node:test";
import {Window} from "happy-dom";
import {mountStudioSettings} from "../src/ai-settings-ui.ts";
import {openSettings} from "../src/settings-ui.ts";
import {mountRewrite} from "../src/rewrite-ui.ts";
import {emptyReference,renderReferenceLibrary} from "../src/reference-ui.ts";
import type {CoreOperation,CoreResponse} from "../src/protocol.ts";
function waitFor(predicate:()=>boolean):Promise<void>{if(predicate())return Promise.resolve();return new Promise((resolve,reject)=>{const observer=new window.MutationObserver(()=>{if(predicate()){clearTimeout(deadline);observer.disconnect();resolve();}});const deadline=setTimeout(()=>{observer.disconnect();reject(Error("Expected assistance state was not reached"));},2000);observer.observe(document.body,{subtree:true,attributes:true,childList:true,characterData:true});});}
const settingsReady=()=>waitFor(()=>document.querySelector<HTMLElement>(".studio-settings")?.dataset.busy==="false");
function setup(){const w=new Window();Object.assign(globalThis,{window:w,document:w.document,HTMLElement:w.HTMLElement,HTMLInputElement:w.HTMLInputElement,HTMLTextAreaElement:w.HTMLTextAreaElement,HTMLSelectElement:w.HTMLSelectElement,Event:w.Event});document.body.innerHTML='<button id="entry">Open assistance</button><div class="app-shell"><header></header><main></main></div><footer></footer>';return w;}
function button(name:string){return [...document.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent===name)!;}
function enter(id:string,value:string){const n=document.getElementById(id) as HTMLInputElement;n.value=value;n.dispatchEvent(new window.Event('input',{bubbles:true}));return n;}

test('native Game setup saves refresh only their host and retain all cached writing drafts',async()=>{
 const w=setup();document.body.innerHTML='<div id="app"></div>';
 Object.assign(globalThis,{KeyboardEvent:w.KeyboardEvent,MutationObserver:w.MutationObserver});
 const project={sessionId:'game-draft-session',projectId:'game-draft-project',title:'Synthetic game drafts',folderName:'synthetic',chapterId:'chapter',chapterName:'Chapter',sceneId:'scene',sceneName:'Scene',sdkVersion:'8.5.3',resolution:{width:1280,height:720}};
 const source={path:'game/characters.rpy',statement:'define mara = Character("Mara")',sourceRevision:'source-1'};
 const game={schemaVersion:1,projectId:project.projectId,characters:[{id:'mara',technicalName:'mara',displayName:'Mara',dialogueColor:'#abcdef',defaultAppearanceId:'one',source}],appearances:[{id:'one',characterId:'mara',label:'calm',attributes:{outfit:'default',pose:'default'},renderMode:'staticImportedAsset',assetId:'asset-one'},{id:'two',characterId:'mara',label:'alert',attributes:{outfit:'default',pose:'default'},renderMode:'staticImportedAsset',assetId:'asset-two'}],assets:[{id:'asset-one',kind:'characterAppearance',displayName:'Calm',relativePath:'game/images/calm.png',sha256:'1'.repeat(64)},{id:'asset-two',kind:'characterAppearance',displayName:'Alert',relativePath:'game/images/alert.png',sha256:'2'.repeat(64)}],variables:[]};
 const card=(id:string,title:string,linkedCharacterId:string|null)=>({id,revisionCounter:1,currentRevisionId:id+'-v1',approvedRevisionId:id+'-v1',revisions:[{id:id+'-v1',number:1,status:'approved',createdAt:'',reviewedAt:'',content:{...emptyReference('card'),title,linkedCharacterId}}]});
 const references={revision:'library-1',document:{schemaVersion:1 as const,projectId:project.projectId,cards:[card('mara-card','Mara','mara'),card('ivo-card','Ivo',null)],loreEntries:[]},diagnostic:null,entities:[{kind:'character' as const,id:'mara',title:'Mara',revision:'source-1'}],issues:[],canUndo:true,canRedo:false};
 const calls:CoreOperation[]=[];let refuseCharacter=true,refuseRefresh=false,revision=1;
 const request=async<T>(op:CoreOperation,p:Readonly<Record<string,unknown>>={}):Promise<CoreResponse<T>>=>{
  calls.push(op);let value:unknown;
  if(op==='project.listRecent')value=[];
  else if(op==='project.openPicker')value=project;
  else if(op==='project.status')value='saved';
  else if(op==='scene.list')value={scenes:[],chapters:[],lastOpen:{}};
  else if(op==='references.list')value=structuredClone(references);
  else if(op==='authoring.list'&&refuseRefresh){refuseRefresh=false;return{protocolVersion:1,requestId:'fixture',ok:false,error:{code:'READ_FAILED',message:'Synthetic refresh refusal'}};}
  else if(op==='authoring.list')value=structuredClone(game);
  else if(op==='media.present')value={mimeType:'image/png',dataBase64:'AA=='};
  else if(op==='asset.chooseImport')value={authorityId:'synthetic-image',displayName:'new.png',byteCount:1,extension:'png'};
  else if(op==='character.update'&&refuseCharacter){refuseCharacter=false;return{protocolVersion:1,requestId:'fixture',ok:false,error:{code:'INVALID_PAYLOAD',message:'Synthetic character refusal'}};}
  else if(['character.update','appearance.setDefault','appearance.update','asset.import'].includes(op)){
   references.revision=`library-${++revision}`;
   if(op==='character.update'){game.characters[0]!.displayName=String(p.displayName);game.characters[0]!.source.sourceRevision=`source-${revision}`;references.entities[0]!.revision=`source-${revision}`;}
   if(op==='appearance.setDefault')game.characters[0]!.defaultAppearanceId=String(p.appearanceId);
   if(op==='appearance.update')game.appearances.find(a=>a.id===p.id)!.label=String(p.expression);
   if(op==='asset.import')refuseRefresh=true;
   value=structuredClone(game);
  }else throw Error(`Unexpected main wiring operation ${op}`);
  return{protocolVersion:1,requestId:'fixture',ok:true,value:value as T};
 };
 bridge(w,()=>({schemaVersion:1,theme:'light',density:'default',sourceFontSize:14,rememberLayout:false,layouts:{}}));
 const click=(text:string,host:ParentNode=document)=>{const b=[...host.querySelectorAll<HTMLButtonElement>('button')].find(n=>n.textContent===text);assert(b,`Missing ${text}`);b.click();};
 const input=(name:string,value:string,host:ParentNode=document)=>{const n=host.querySelector<HTMLInputElement|HTMLTextAreaElement>(`[name="${name}"]`);assert(n,`Missing ${name}`);n.value=value;n.dispatchEvent(new Event('input',{bubbles:true}));return n;};
 const select=async(id:string)=>{document.querySelector<HTMLButtonElement>(`[data-entry-key="card:${id}"]`)!.click();await waitFor(()=>document.querySelector<HTMLElement>('.character-workspace')?.dataset.selectedKey===`card:${id}`);};
 const {startApplication}=await import('../src/main.js');startApplication(request);
 try{
  await waitFor(()=>!!document.querySelector('.recent-section'));click('Open Loomlight Project');await waitFor(()=>!!document.querySelector('.project-shell'));click('Characters');await waitFor(()=>!!document.querySelector('.character-workspace'));
  const workspace=document.querySelector('.character-workspace');
  input('description','Mara retained writing');await select('ivo-card');input('description','Ivo retained writing');await select('mara-card');click('Game setup');await waitFor(()=>!!document.querySelector('.catalog-details-only'));
  click('Edit',document.querySelector('.catalog-inspector')!);let dialog=document.querySelector<HTMLElement>('.catalog-dialog')!;const display=dialog.querySelector<HTMLInputElement>('input')!;display.value='Mara changed';display.dispatchEvent(new Event('input',{bubbles:true}));click('Save Character',dialog);
  await waitFor(()=>document.querySelector('#app-status')?.textContent==='Synthetic character refusal');assert.equal(display.value,'Mara changed');assert.equal(dialog.isConnected,true);
  click('Save Character',dialog);await waitFor(()=>!document.querySelector('.catalog-dialog'));assert.equal(document.querySelector('.character-workspace'),workspace);
  const beforeDefaultReads=calls.filter(op=>op==='references.list').length;click('Set default');await waitFor(()=>calls.filter(op=>op==='authoring.list').length===3);await waitFor(()=>!!document.querySelector('.appearance-select[data-appearance-id="two"][data-default="true"]')&&calls.filter(op=>op==='references.list').length>beforeDefaultReads&&document.querySelector<HTMLElement>('.character-workspace')?.dataset.busy==='false');
  const editAppearance=[...document.querySelectorAll<HTMLButtonElement>('.appearance-row button')].find(b=>b.ariaLabel==='Edit appearance alert');assert(editAppearance);editAppearance.click();dialog=document.querySelector<HTMLElement>('.catalog-dialog')!;const expression=dialog.querySelector<HTMLInputElement>('input')!;expression.value='happy';expression.dispatchEvent(new Event('input',{bubbles:true}));click('Save Appearance',dialog);await waitFor(()=>!document.querySelector('.catalog-dialog'));assert.equal(document.querySelector('.character-workspace'),workspace);
  click('Add Appearance');dialog=document.querySelector<HTMLElement>('.catalog-dialog')!;const imported=dialog.querySelector<HTMLInputElement>('input')!;imported.value='new';imported.dispatchEvent(new Event('input',{bubbles:true}));click('Choose image…',dialog);await waitFor(()=>!document.querySelector('.catalog-dialog'));assert.match(document.querySelector('.character-game-setup')!.textContent!,/Saved\. Game setup could not be refreshed/);assert.equal(document.querySelector('.character-workspace'),workspace);assert.equal(calls.filter(op=>op==='asset.import').length,1);const beforeRetryReads=calls.filter(op=>op==='references.list').length;click('Reload game setup');await waitFor(()=>!!document.querySelector('.catalog-details-only')&&calls.filter(op=>op==='references.list').length>beforeRetryReads&&document.querySelector<HTMLElement>('.character-workspace')?.dataset.busy==='false');assert.equal(calls.filter(op=>op==='asset.import').length,1,'read-only refresh never replays the saved import');
  click('Writing');await waitFor(()=>document.querySelector<HTMLButtonElement>('#character-view-writing')?.ariaSelected==='true');assert.equal((document.querySelector('[name="description"]') as HTMLTextAreaElement).value,'Mara retained writing');await select('ivo-card');assert.equal((document.querySelector('[name="description"]') as HTMLTextAreaElement).value,'Ivo retained writing');
  assert.equal(document.querySelector('.character-workspace'),workspace);assert.equal(calls.filter(op=>op==='references.apply').length,0);assert.equal(calls.filter(op=>op==='asset.import').length,1);assert.equal(calls.filter(op=>op==='character.update').length,2);assert.equal(calls.filter(op=>op==='appearance.update').length,1);assert.equal(calls.filter(op=>op==='appearance.setDefault').length,1);
 }finally{await w.happyDOM.close();}
});
const settings={label:'Saved',endpoint:'http://127.0.0.1:8888/v1',model:'fixture',contextCeiling:8192,contextBudget:4096,maximumResponse:1024};
const profile={profileId:'p',revision:1,disabled:false,credentialStatus:'configured',compatibilityState:'ready',settings,discovery:null};
function bridge(w:Window,fn:(op:string,p:Record<string,unknown>)=>unknown){Object.assign(w,{__TAURI_INTERNALS__:{invoke:async(_:string,{request}:{request:{requestId:string;operation:string;payload:Record<string,unknown>}})=>({protocolVersion:1,requestId:request.requestId,ok:true,value:await fn(request.operation,request.payload)})}});}

test('Studio draft refusals preserve fields across switch/reload/cleanup and busy ownership; switching clears old errors',async()=>{
 const w=setup();const calls:string[]=[];let hold!:(v:unknown)=>void;
 const snapshot={token:'t',profiles:[profile],cleanup:[{profileId:'retained'}]};
 bridge(w,op=>{calls.push(op);return op==='ai.saveProfile'?new Promise(r=>{hold=r;}):snapshot;});
 const c=mountStudioSettings(document.querySelector('main')!,document.querySelector('footer')!);window.confirm=()=>false;
 try{await settingsReady();const top=enter('studio-top-p','1.1');top.dispatchEvent(new Event('blur'));assert.equal(top.getAttribute('aria-invalid'),'true');
 const chooser=document.querySelector<HTMLSelectElement>('select')!;chooser.value='';chooser.dispatchEvent(new Event('change'));assert.equal(chooser.value,'p');assert.equal(top.value,'1.1');
 button('Reload profiles').click();button('Retry owned credential cleanup').click();assert.deepEqual(calls,['ai.profiles']);assert.equal(c.canLeave(),false);
 window.confirm=()=>true;chooser.value='';chooser.dispatchEvent(new Event('change'));assert.equal(document.querySelector('.studio-draft-state')!.textContent,'New profile · unsaved');assert.equal(top.getAttribute('aria-invalid'),null);assert.equal(document.querySelector('.field-error')!.textContent,'');
 chooser.value='p';chooser.dispatchEvent(new Event('change'));enter('studio-top-p','0.9');button('Save profile').click();assert.equal(c.canLeave(),false);assert.deepEqual(calls,['ai.profiles','ai.saveProfile']);hold(snapshot);await settingsReady();assert.equal(c.canLeave(),true);
 }finally{c.dispose();await w.happyDOM.close();}
});

test('profile submission rechecks untouched/dependent fields, reveals error and retains invalid input without a write',async()=>{
 const w=setup();const calls:string[]=[];bridge(w,op=>(calls.push(op),{token:'t',profiles:[profile],cleanup:[]}));const c=mountStudioSettings(document.querySelector('main')!,document.querySelector('footer')!);
 try{await settingsReady();const limit=enter('studio-context-length','200');const response=enter('studio-maximum-response-length','4096');button('Save profile').click();assert.deepEqual(calls,['ai.profiles']);assert.equal(limit.closest('section')!.querySelector('h4')!.textContent,'Response defaults');assert.equal(document.activeElement,limit);assert.equal(response.value,'4096');assert.equal(response.getAttribute('aria-invalid'),'true');
 enter('studio-context-length','8192');enter('studio-maximum-response-length','1024');button('Save profile').click();await settingsReady();assert.deepEqual(calls,['ai.profiles','ai.saveProfile']);
 }finally{c.dispose();await w.happyDOM.close();}
});

test('Settings navigation and close keep a Studio draft until explicit discard; return focus to invoker',async()=>{
 const w=setup();const calls:string[]=[];bridge(w,op=>(calls.push(op),{token:'t',profiles:[profile],cleanup:[]}));const entry=document.getElementById('entry')!;entry.focus();openSettings();button('AI providers').click();await settingsReady();window.confirm=()=>false;
 try{enter('studio-profile-name','Retained draft');button('Workspace').click();button('Close settings').click();assert(document.querySelector('.studio-settings'));assert.equal((document.querySelector('#studio-profile-name') as HTMLInputElement).value,'Retained draft');assert.deepEqual(calls,['ai.profiles']);
 window.confirm=()=>true;button('Close settings').click();assert.equal(document.querySelector('.settings-overlay'),null);assert.equal(document.activeElement,entry);
 }finally{await w.happyDOM.close();}
});

test('proposed-reference selection enters visible review; oversized optional input is refused on submit without blur',async()=>{
 const w=setup();const content=emptyReference('card');content.title='Mara';content.description='Approved';const record={id:'c',revisionCounter:2,currentRevisionId:'new',approvedRevisionId:'old',revisions:[{id:'old',number:1,status:'approved',content,createdAt:'',reviewedAt:''},{id:'new',number:2,status:'proposed',content:{...content,description:'Proposal'},createdAt:'',reviewedAt:null}]};
 const model={revision:'t',document:{schemaVersion:1 as const,projectId:'p',cards:[record],loreEntries:[]},diagnostic:null,entities:[],issues:[],canUndo:true,canRedo:false};let writes=0;
 const c=renderReferenceLibrary(document.querySelector('main')!,'card',model,{creationHost:document.querySelector('header')!,current:()=>true,guard:async()=>true,status:()=>{},load:async()=>model,apply:async()=>{writes++;return model;}});
 try{document.querySelector<HTMLButtonElement>('.reference-entry')!.click();await waitFor(()=>document.activeElement?.className==='reference-identity');assert.equal(document.activeElement?.className,'reference-identity');assert(document.querySelector<HTMLDetailsElement>('.reference-proposal-review')!.open);assert.equal(document.querySelector<HTMLDetailsElement>('.reference-frozen-fields')!.open,false);
 button('New character').click();await waitFor(()=>document.querySelector<HTMLElement>('.reference-library')!.dataset.selectedKey==='new');const title=document.querySelector<HTMLInputElement>('[name=title]')!;title.value='New';title.dispatchEvent(new Event('input'));const background=document.querySelector<HTMLTextAreaElement>('[name=background]')!;background.value='雪'.repeat(3334);background.dispatchEvent(new Event('input'));await c.save();assert.equal(writes,0);assert.equal(document.activeElement,background);assert.equal(background.closest<HTMLElement>('.reference-topic-panel')!.hidden,false);assert.equal(background.value.length,3334);
 }finally{c.dispose();await w.happyDOM.close();}
});

test('Assist has one primary action per stage, keeps inspected budget visible, focuses Cancel and returns to invoker',async()=>{
 const w=setup();const entry=document.getElementById('entry')!;entry.focus();const calls:string[]=[];
 const prepared={token:'send',payloadDigest:'digest',serializedPayload:'{"exact":true}',destination:{provider:'Unsloth Studio',endpoint:settings.endpoint,model:'fixture',connectionLocation:'Loopback HTTP',inferenceLocality:'Unknown',retention:'Unknown'},size:{estimatedInputTokens:400,maximumResponse:1024,margin:128,total:1552,contextBudget:4096,contextCeiling:8192},context:{included:[],excluded:[],dependencies:[]},protected:[],responseMode:'Structured'};
 const c=mountRewrite(document.querySelector('main')!,'s','b',{current:()=>true,accepted:()=>{},call:async<T>(op:string):Promise<T>=>{calls.push(op);return (op==='context.options'?{prompt:{revision:'r'},structureRevision:'s',targets:[{sceneId:'s',beatId:'b',label:'Saved narration',sourceRevision:'r'}],references:[]}:op==='ai.profiles'?{token:'t',profiles:[profile]}:op==='rewrite.prepare'?prepared:op==='rewrite.send'?{requestId:'request',done:false,state:'sending',message:'Sending',proposal:null}:op==='ai.requestStatus'?new Promise(()=>{}):{done:true,state:'cancelled',message:'Cancelled'}) as T;}});
 const primaries=()=>[...document.querySelectorAll<HTMLButtonElement>('.rewrite-footer .primary')].filter(n=>!n.hidden);
 try{await waitFor(()=>document.querySelector<HTMLTextAreaElement>('[name=rewriteTask]')?.disabled===false);assert.equal(document.activeElement?.getAttribute('name'),'rewriteTask');const task=document.querySelector<HTMLTextAreaElement>('[name=rewriteTask]')!;task.value='Rewrite';task.dispatchEvent(new Event('input'));assert.equal(primaries().length,1);button('Review complete send').click();await waitFor(()=>!!document.querySelector('.rewrite-result')?.textContent?.includes('1552 / 4096'));assert.equal(document.activeElement?.textContent,'Review complete send');assert.equal(primaries().length,1);assert(document.querySelector('.rewrite-result')!.textContent!.includes('1552 / 4096'));button('Generate proposal').click();await waitFor(()=>document.activeElement?.textContent==='Cancel request');assert.equal(document.activeElement?.textContent,'Cancel request');assert.equal(primaries().length,0);button('Cancel request').click();await waitFor(()=>button('Cancel request').hidden===true);window.confirm=()=>true;button('Close Assist').focus();button('Close Assist').click();await waitFor(()=>!document.querySelector('.rewrite-panel'));assert.equal(document.activeElement,entry);assert.equal(calls.filter(op=>op==='rewrite.accept').length,0);
 }finally{c.dispose();await w.happyDOM.close();}
});

test('nonmodal Assist completion preserves focus and input in unrelated authoring',async()=>{
 const w=setup();const author=document.createElement('textarea');author.ariaLabel='Story draft';document.body.append(author);let finish!:(v:unknown)=>void;
 const c=mountRewrite(document.querySelector('main')!,'s','b',{current:()=>true,accepted:()=>{},call:async<T>(op:string):Promise<T>=>{
  if(op==='rewrite.send')return await new Promise<unknown>(r=>{finish=r;}) as T;
  return (op==='context.options'?{prompt:{revision:'r'},structureRevision:'s',targets:[{sceneId:'s',beatId:'b',label:'Saved narration',sourceRevision:'r'}],references:[]}:op==='ai.profiles'?{token:'t',profiles:[profile]}:{token:'send',payloadDigest:'digest',serializedPayload:'{}',destination:{provider:'Unsloth Studio',endpoint:settings.endpoint,model:'fixture',connectionLocation:'Loopback HTTP',inferenceLocality:'Unknown',retention:'Unknown'},size:{total:1552,contextBudget:4096,contextCeiling:8192},context:{included:[],excluded:[],dependencies:[]},protected:[]}) as T;
 }});
 try{await waitFor(()=>document.querySelector<HTMLTextAreaElement>('[name=rewriteTask]')?.disabled===false);const task=document.querySelector<HTMLTextAreaElement>('[name=rewriteTask]')!;task.value='Rewrite';task.dispatchEvent(new Event('input'));button('Review complete send').click();await waitFor(()=>!button('Generate proposal').hidden);button('Generate proposal').click();author.focus();author.value='Still writing';finish({requestId:'r',done:true,state:'completed',message:null,proposal:{proposalId:'p',previewDigest:'d',target:{sceneId:'s',beatId:'b'},beforeSegments:[{literal:'Old'}],segments:[{literal:'New'}],protected:[],patches:[],uncertainty:'Preview only'}});await waitFor(()=>document.querySelector('.rewrite-panel')!.getAttribute('data-stage')==='2');assert.equal(document.activeElement,author);assert.equal(author.value,'Still writing');assert.equal(document.querySelector('.rewrite-panel')!.getAttribute('data-stage'),'2');
 }finally{c.dispose();await w.happyDOM.close();}
});

test('unfinished status replies preserve focus while inspecting request details',async()=>{
 const w=setup();let finishStatus!:(v:unknown)=>void;
 const c=mountRewrite(document.querySelector('main')!,'s','b',{current:()=>true,accepted:()=>{},call:async<T>(op:string):Promise<T>=>{
  if(op==='ai.requestStatus')return await new Promise<unknown>(r=>{finishStatus=r;}) as T;
  return (op==='context.options'?{prompt:{revision:'r'},structureRevision:'s',targets:[{sceneId:'s',beatId:'b',label:'Saved narration',sourceRevision:'r'}],references:[]}:op==='ai.profiles'?{token:'t',profiles:[profile]}:op==='rewrite.send'?{requestId:'r',done:false,state:'sending',message:'Sending',proposal:null}:{token:'send',payloadDigest:'digest',serializedPayload:'{}',destination:{provider:'Unsloth Studio',endpoint:settings.endpoint,model:'fixture',connectionLocation:'Loopback HTTP',inferenceLocality:'Unknown',retention:'Unknown'},size:{total:1552,contextBudget:4096,contextCeiling:8192},context:{included:[],excluded:[],dependencies:[]},protected:[]}) as T;
 }});
 try{await waitFor(()=>document.querySelector<HTMLTextAreaElement>('[name=rewriteTask]')?.disabled===false);const task=document.querySelector<HTMLTextAreaElement>('[name=rewriteTask]')!;task.value='Rewrite';task.dispatchEvent(new Event('input'));button('Review complete send').click();await waitFor(()=>!button('Generate proposal').hidden);button('Generate proposal').click();await waitFor(()=>!!finishStatus);const summary=document.querySelector<HTMLElement>('.rewrite-result summary')!;summary.focus();finishStatus({requestId:'r',done:false,state:'receiving',message:'Receiving',proposal:null});await waitFor(()=>document.querySelector('.rewrite-panel')!.textContent!.includes('Receiving'));assert.equal(document.activeElement,summary);assert.equal(button('Cancel request').disabled,false);
 }finally{c.dispose();await w.happyDOM.close();}
});
