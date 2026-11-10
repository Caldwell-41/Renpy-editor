// Actual production main/Story controls -> ApplicationHost -> source/history/reopen.
// Happy DOM supplies input events. No SDK, package, native WebView or physical-input claim.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,appendFile,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {Window} from 'happy-dom';
import {driverProcess} from './phase2-driver-process.mjs';
import {createRequest,isCoreResponse} from '../dist-tests/src/protocol.js';
const output=resolve(process.env.CHOICE_BODY_OUTPUT??`/tmp/choice101-journey-${randomUUID()}`);await mkdir(output,{recursive:true});
const scratch=join(output,`loomlight-help-controller-${randomUUID()}`);
const child=driverProcess(resolve(process.env.CARGO_TARGET_DIR??'target','debug/examples/help-controller-driver'+(process.platform==='win32'?'.exe':'')),[scratch]);
const browser=new Window({url:'http://tauri.localhost'});
Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement,HTMLInputElement:browser.HTMLInputElement,HTMLTextAreaElement:browser.HTMLTextAreaElement,HTMLSelectElement:browser.HTMLSelectElement,HTMLButtonElement:browser.HTMLButtonElement,Event:browser.Event,KeyboardEvent:browser.KeyboardEvent});
const result={passed:false,actualCore:true,actualMain:true,happyDOM:true,sdkExecuted:false,stages:[],transcript:[]};let session,workspace,lastApply,lastValidation,inflight=0,lastEvent,staleSession=false;
function stage(text){result.stages.push(text);console.log(text);}
const hash=text=>createHash('sha256').update(text).digest('hex');
for(const type of ['click','input','change','keydown'])document.addEventListener(type,event=>{lastEvent={type,label:event.target.getAttribute?.('aria-label')??event.target.textContent?.slice(0,80),connected:event.target.isConnected};},true);
async function request(operation,payload={},ui=false){
 const request=createRequest(operation,payload);inflight++;
 try{
  const response=await child.request(request);assert(isCoreResponse(response,request.requestId));
  result.transcript.push({request,response,event:ui?lastEvent:undefined});
  await appendFile(join(output,"requests.jsonl"),JSON.stringify({operation,ok:response.ok,code:response.error?.code})+"\n");
  assert(result.transcript.length<400,"Unexpected request loop");
  if(ui&&operation==='scene.apply'){assert(lastEvent?.connected,'Story mutation must originate at connected production controls');lastApply=response;}
  if(ui&&operation==='scene.validateAssignment')lastValidation=response;
  if(response.ok&&operation==='project.openRecent')session=response.value.sessionId;
  if(response.ok&&['scene.list','scene.apply'].includes(operation))workspace=response.value;
  return response;
 }finally{inflight--;}
}
const call=async(operation,payload={})=>{const r=await request(operation,{...payload,...(session&&!['project.listRecent','project.openRecent'].includes(operation)?{sessionId:session}:{})});if(!r.ok)throw Object.assign(Error(r.error.message),r.error);return r.value;};
const requester=(operation,payload)=>request(operation,staleSession&&operation==='scene.apply'?{...payload,sessionId:'stale-session'}:payload,true);
const wait=async check=>{const until=Date.now()+8000;while(!await check()){assert(Date.now()<until,'Choice deadline exceeded');await new Promise(r=>setTimeout(r,10));}};
const settle=async()=>{await new Promise(r=>setTimeout(r,150));await wait(()=>inflight===0);};
const button=(text,scope=document)=>{const b=[...scope.querySelectorAll('button')].find(b=>(b.textContent===text||b.getAttribute('aria-label')===text)&&!b.disabled);assert(b,`Missing enabled ${text}`);b.click();return b;};
const enter=(node,text,event='input')=>{assert(node?.isConnected&&!node.disabled);node.focus();node.value=text;node.dispatchEvent(new Event(event,{bubbles:true}));};
const source=async path=>(await call('source.open',{path})).text;
async function saveSource(path,text){const base=await call('source.open',{path});const draft=await call('source.updateDraft',{path,expectedBaseRevision:base.baseRevision,text,selectionStart:0,selectionEnd:0});await call('source.save',{path,expectedBaseRevision:draft.baseRevision,expectedDraftVersion:draft.draftVersion});}
const option=id=>document.querySelector(`.story-choice-option[data-option-id="${id}"]`);
async function applied(scope,label){lastApply=undefined;button(label,scope);await wait(()=>lastApply);await settle();assert.equal(lastApply.ok,true,JSON.stringify(lastApply));}
try {
 assert.equal((await child.next()).ready,true);
 const recent=(await call('project.listRecent'))[0];await call('project.openRecent',{recentId:recent.id});
 await call('variable.create',{technicalName:'choice_flag',variableType:'bool',defaultValue:false});
 let initial=await call('scene.list');const created=await call('scene.apply',{expectedProjectRevision:initial.projectRevision,expectedSourceMapRevision:initial.sourceMapRevision,command:{type:'createScene',chapterId:initial.chapters[0].id,displayName:'Transfer target'}});initial=created;const entry=initial.scenes.find(s=>s.id===initial.entrySceneId),path=entry.sourcePath,target=initial.scenes.find(s=>s.id!==entry.id&&s.displayName==='Transfer target');await saveSource(target.sourcePath,`label ${target.technicalLabel}:\n    \"Transferred\"\n    return\n`);
 const original=`label ${entry.technicalLabel}:\n    # retained neighbor\n    "Shared once"\n    return\n`;
 await saveSource(path,original);const selectedModel=await call('scene.list');await call('scene.apply',{expectedProjectRevision:selectedModel.projectRevision,expectedSourceMapRevision:selectedModel.sourceMapRevision,command:{type:'selectScene',sceneId:entry.id}});await call('project.close');session=undefined;
 document.body.innerHTML='<div id="app"></div>';const {startApplication}=await import('../dist-tests/src/main.js');startApplication(requester);
 await wait(()=>document.querySelector('.recent-open')&&!document.querySelector('.recent-open').disabled);button(document.querySelector('.recent-open').textContent);await wait(()=>document.querySelector('.beat-card'));await settle();
 const scene=()=>workspace.scenes.find(s=>s.id===entry.id),choice=()=>scene().beats.find(b=>b.payload.type==='choice');
 assert.equal(await source(path),original);
 button('Add Beat');let draft=document.querySelector('.new-beat');enter(draft.querySelector('[aria-label="Beat type"]'),'choice','change');
 enter(draft.querySelector('[aria-label="Insert before"]'),scene().beats.find(b=>b.payload.text==='Shared once').id,'change');
 enter(draft.querySelector('[aria-label="Choice option text"]'),'Yes');button('Add option',draft);
 enter(draft.querySelectorAll('[aria-label="Choice option text"]')[1],'No');await applied(draft,'Add Beat');
 assert(choice());const [yes,no]=choice().payload.options;assert(yes.id&&no.id&&yes.id!==no.id);
 const empty=await source(path);assert.equal(empty,original.replace('    "Shared once"','    menu:\n        "Yes":\n            pass\n        "No":\n            pass\n    "Shared once"'));
 const ids=[choice().id,yes.id,no.id];
 stage('production Add Choice creates two inert empty bodies before one shared continuation');
 button('Add a Beat',option(yes.id));draft=document.querySelector('.new-beat');enter(draft.querySelector('[aria-label="Beat type"]'),'setVariable','change');
 enter(draft.querySelector('[aria-label="Variable"]'),workspace.authoring.variables.find(v=>v.technicalName==='choice_flag').id,'change');enter(draft.querySelector('[aria-label="Value"]'),'true','change');await applied(draft,'Add Beat');
 const accepted=await source(path);result.runtime={continuation:accepted,entryLabel:entry.technicalLabel,target:await source(target.sourcePath)};assert.equal(accepted,empty.replace('        "Yes":\n            pass','        "Yes":\n            $ choice_flag = True'));
 assert.equal(scene().beats.filter(b=>b.structuralPlaceholder).length,1);assert.equal(scene().beats.filter(b=>b.payload.text==='Shared once').length,1);
 stage('production option body writes the boolean through explicit body/position to real core');
 await applied(document,'Undo');assert.equal(await source(path),empty);await applied(document,'Redo');assert.equal(await source(path),accepted);
 // A stale retained Then draft must not overwrite competing Source.
 button('Then',option(yes.id));let panel=document.querySelector('.story-operation[aria-label="Option ending"]');enter(panel.querySelector('[aria-label="Then"]'),'return','change');
 await saveSource(path,accepted+'# external accepted change\n');lastApply=undefined;button('Apply ending',panel);await wait(()=>lastApply);await settle();assert.equal(lastApply.ok,false);assert.equal(lastApply.error.code,'SOURCE_CONFLICT');assert.equal(panel.querySelector('[aria-label="Then"]').value,'return');assert(panel.isConnected);assert.equal(await source(path),accepted+'# external accepted change\n');button('Cancel',panel);
 stage('stale option ending retains input and accepted Source; Cancel discards the draft');
 button('Close Project');await wait(()=>document.querySelector('.recent-open'));button(document.querySelector('.recent-open').textContent);await wait(()=>document.querySelector('.beat-card'));await settle();
 assert.deepEqual([choice().id,...choice().payload.options.map(o=>o.id)],ids);assert.equal(await source(path),accepted+'# external accepted change\n');
 // Then Return replaces no earlier Beat. Continue removes only that Return.
 button('Then',option(yes.id));panel=document.querySelector('.story-operation');enter(panel.querySelector('[aria-label="Then"]'),'return','change');await applied(panel,'Apply ending');
 assert.equal(await source(path),(accepted+'# external accepted change\n').replace('$ choice_flag = True\n','$ choice_flag = True\n            return\n'));result.runtime.return=await source(path);
 button('Then',option(yes.id));panel=document.querySelector('.story-operation');enter(panel.querySelector('[aria-label="Then"]'),'continue','change');await applied(panel,'Apply ending');assert.equal(await source(path),accepted+'# external accepted change\n');
 button('Then',option(yes.id));panel=document.querySelector('.story-operation');enter(panel.querySelector('[aria-label="Then"]'),'jump','change');enter(panel.querySelector('[aria-label="Destination Scene"]'),target.id,'change');await applied(panel,'Apply ending');result.runtime.jump=await source(path);await applied(document,'Undo');assert.equal(await source(path),accepted+'# external accepted change\n');stage('reopen preserves identities; Then Return, Jump and Continue preserve the preceding boolean');
 // Empty text is a local validation refusal; caption rename is a minimal patch.
 document.querySelector(`[data-beat-id="${choice().id}"] .beat-select`).click();await settle();let editor=document.querySelector('.expanded-beat');const text=editor.querySelector('[aria-label="Choice option text"]');enter(text,'');lastApply=undefined;button('Commit Beat',editor);await settle();assert.equal(lastApply,undefined);assert.equal(text.value,'');button('Cancel',editor);
 document.querySelector(`[data-beat-id="${choice().id}"] .beat-select`).click();editor=document.querySelector('.expanded-beat');enter(editor.querySelector('[aria-label="Choice option text"]'),'Yes, please');await applied(editor,'Commit Beat');assert.equal(await source(path),(accepted+'# external accepted change\n').replace('"Yes":','"Yes, please":'));
 stage('invalid caption retained without a write; accepted caption changes only its quoted token');
 const flow=await call('flow.list');const menuEdges=flow.edges.filter(e=>e.kind==='choice'&&e.beatId===choice().id);assert.equal(menuEdges.length,2);assert(menuEdges.every(e=>e.destination.kind==='body'));
 // #102 uses the same production body controls and source/history owner.
 async function addBodyBeat(id,type,fill) {
  button('Add a Beat',option(id)); const form=document.querySelector('.new-beat');
  const types=form.querySelector('[aria-label="Beat type"]');
  assert([...types.options].some(o=>o.value===type),`Option body must offer ${type}`);
  enter(types,type,'change');fill?.(form);await applied(form,'Add Beat');
 }
 await addBodyBeat(yes.id,'narration',form=>enter(form.querySelector('textarea'),'Before call'));
 const beforeInvalidCall=await source(path);
 button('Add a Beat',option(yes.id));draft=document.querySelector('.new-beat');enter(draft.querySelector('[aria-label="Beat type"]'),'call','change');
 enter(draft.querySelector('[aria-label="Call destination Scene"]'),entry.id,'change');lastApply=undefined;button('Add Beat',draft);await wait(()=>lastApply);await settle();
 assert.equal(lastApply.ok,false);assert.equal(lastApply.error.code,'UNSUPPORTED_CALL_ROUTE');assert(draft.isConnected);assert.equal(await source(path),beforeInvalidCall);button('Cancel',draft);assert.equal(await source(path),beforeInvalidCall);
 await addBodyBeat(yes.id,'call',form=>enter(form.querySelector('[aria-label="Call destination Scene"]'),target.id,'change'));
 await addBodyBeat(yes.id,'narration',form=>enter(form.querySelector('textarea'),'Resume inside option'));
 const callBeat=scene().beats.find(b=>b.payload.type==='call');const callLabel=callBeat.payload.returnLabel;
 assert(callLabel?.startsWith('_ll_call_'));
 button('Add Condition',option(yes.id));panel=document.querySelector('.story-operation[aria-label="Add Condition"]');
 // Select the declared fixture variable explicitly; default comparison may use another project variable.
 enter(panel.querySelector('[aria-label="Condition Variable"]'),workspace.authoring.variables.find(v=>v.technicalName==='choice_flag').id,'change');
 await applied(panel,'Create Condition');
 const branch=scene().beats.find(b=>b.conditionalBranch&&!b.conditionalBranch.choiceOption);
 button('Add Beat to If',document.querySelector(`[data-branch-id="${branch.id}"]`));
 draft=document.querySelector('.new-beat');enter(draft.querySelector('[aria-label="Beat type"]'),'choice','change');
 enter(draft.querySelector('[aria-label="Choice option text"]'),'Inner normal');button('Add option',draft);
 enter(draft.querySelectorAll('[aria-label="Choice option text"]')[1],'Inner jump');button('Add option',draft);
 enter(draft.querySelectorAll('[aria-label="Choice option text"]')[2],'Inner return');await applied(draft,'Add Beat');
 const nested=scene().beats.find(b=>b.payload.type==='choice'&&b.owner);
 const [normal,jump,ret]=nested.payload.options;
 await addBodyBeat(normal.id,'narration',form=>enter(form.querySelector('textarea'),'Inside inner'));
 for(const [id,kind] of [[jump.id,'jump'],[ret.id,'return']]) {
  button('Then',option(id));panel=document.querySelector('.story-operation[aria-label="Option ending"]');
  enter(panel.querySelector('[aria-label="Then"]'),kind,'change');if(kind==='jump')enter(panel.querySelector('[aria-label="Destination Scene"]'),target.id,'change');await applied(panel,'Apply ending');
 }
 await addBodyBeat(yes.id,'narration',form=>enter(form.querySelector('textarea'),'After nested'));
 const recursive=await source(path);result.runtime.recursive=recursive;
 assert.equal(scene().beats.find(b=>b.id===callBeat.id).payload.returnLabel,callLabel);
 const recursiveFlow=await call('flow.list');const callEdge=recursiveFlow.edges.find(e=>e.kind==='call'&&e.beatId===callBeat.id);
 assert.equal(callEdge.continuation.beatId,scene().beats.find(b=>b.payload.text==='Resume inside option').id);
 assert.equal(callEdge.guardPath[0].branchId,yes.id);
 assert.match(option(normal.id).textContent,/Choice.*Option/);
 await applied(document,'Undo');await applied(document,'Redo');assert.equal(await source(path),recursive);
 button('Close Project');await wait(()=>document.querySelector('.recent-open'));button(document.querySelector('.recent-open').textContent);await wait(()=>document.querySelector('.beat-card'));await settle();
 assert.equal(await source(path),recursive);assert.equal(scene().beats.find(b=>b.id===callBeat.id).payload.returnLabel,callLabel);
 stage('recursive production controls author dialogue, stable Call, condition and nested Choice with normal/Jump/Return paths; history and reopen preserve source');
 result.acceptedSource=await source(path);result.sourceSHA256=hash(result.acceptedSource);result.identities=ids;
 button('Close Project');await wait(()=>document.querySelector('.recent-open'));result.passed=true;
} catch(error){result.failure={message:error.message,stack:error.stack};result.dom=document.body.innerHTML;throw error;}
finally{await browser.happyDOM.close();try{await child.stop();result.driver=child.exitStatus();await assert.rejects(access(scratch));result.cleanupComplete=true;}finally{await writeFile(join(output,'result.json'),JSON.stringify(result,null,2)+'\n');}}
console.log('PASS actual production Story/main to core Choice body journey. Happy DOM input, no SDK/native claim.');
