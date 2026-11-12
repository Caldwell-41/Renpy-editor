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
  assert(result.transcript.length<800,"Unexpected request loop");
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
 const generatedChoice = 'screen choice(items):\n    style_prefix "choice"\n\n    vbox:\n        for i in items:\n            textbutton i.caption action i.action\n';
 await saveSource('game/screens.rpy', generatedChoice);
 const original=`label ${entry.technicalLabel}:\n    # retained neighbor\n    "Shared once"\n    return\n`;
 await saveSource(path,original);await call('project.close');session=undefined;
 document.body.innerHTML='<div id="app"></div>';const {startApplication}=await import('../dist-tests/src/main.js');startApplication(requester);
 await wait(()=>document.querySelector('.recent-open')&&!document.querySelector('.recent-open').disabled);button(document.querySelector('.recent-open').textContent);await wait(()=>document.querySelector('.beat-card'));await settle();
 [...document.querySelectorAll('.tree-scene-open')].find(b=>b.textContent===entry.displayName).click();await wait(()=>document.querySelector('.tree-scene-row.selected .tree-scene-open')?.textContent===entry.displayName);await settle();
 const scene=()=>workspace.scenes.find(s=>s.id===entry.id),choice=()=>scene().beats.find(b=>b.payload.type==='choice');
 assert.equal(await source(path),original);
 button('Add Beat');let draft=document.querySelector('.new-beat');enter(draft.querySelector('[aria-label="Beat type"]'),'choice','change');
 enter(draft.querySelector('[aria-label="Insert before"]'),scene().beats.find(b=>b.payload.text==='Shared once').id,'change');
 enter(draft.querySelector('[aria-label="Choice option text"]'),'Yes');button('Add option',draft);
 enter(draft.querySelectorAll('[aria-label="Choice option text"]')[1],'No');await applied(draft,'Add Beat');
 assert(choice());const [yes,no]=choice().payload.options;assert(yes.id&&no.id&&yes.id!==no.id);
 const empty=await source(path);
 const initialHeader=`    menu (screen="_ll_choice_v1", _ll_mode="showNormally", _ll_id="${choice().id}"):\n`;
 const initialOption=(text,id)=>`        "${text}" (_ll_id="${id}", _ll_available=True, _ll_guarded=False, _ll_locked=False) if True:\n            $ _ll_picked_v1[("${choice().id}", "${id}")] = True\n            pass\n`;
 assert.equal(empty,original.replace('    "Shared once"',initialHeader+initialOption('Yes',yes.id)+initialOption('No',no.id)+'    "Shared once"'));

 const ids=[choice().id,yes.id,no.id];
 stage('production Add Choice creates two inert empty bodies before one shared continuation');
 button('Add a Beat',option(yes.id));draft=document.querySelector('.new-beat');enter(draft.querySelector('[aria-label="Beat type"]'),'setVariable','change');
 enter(draft.querySelector('[aria-label="Variable"]'),workspace.authoring.variables.find(v=>v.technicalName==='choice_flag').id,'change');enter(draft.querySelector('[aria-label="Value"]'),'true','change');await applied(draft,'Add Beat');
 const accepted=await source(path);result.runtime={continuation:accepted,entryLabel:entry.technicalLabel,target:await source(target.sourcePath)};assert.equal(accepted,empty.replace('            pass','            $ choice_flag = True'));
 assert.equal(scene().beats.filter(b=>b.structuralPlaceholder).length,1);assert.equal(scene().beats.filter(b=>b.payload.text==='Shared once').length,1);
 await applied(document,'Undo');assert.equal(await source(path),empty);await applied(document,'Redo');assert.equal(await source(path),accepted);
 stage('production option body writes the boolean through explicit body/position to real core');
 // #103 uses the same Choice editor and accepted transaction boundary.
 const speaker=workspace.authoring.characters[0];
 result.runtime.characterDefinition=speaker.source.statement+'\n';
 async function editChoice(id) { document.querySelector(`[data-beat-id="${id}"] .beat-select`).click(); await settle(); return document.querySelector('.expanded-beat'); }
 let promptEditor=await editChoice(choice().id);
 button('Add a prompt shown with the options',promptEditor);
 let promptText=promptEditor.querySelector('[aria-label="Prompt text"]');
 lastApply=undefined;button('Commit Beat',promptEditor);await settle();assert.equal(lastApply,undefined);assert.equal(promptText.getAttribute('aria-invalid'),'true');
 enter(promptText,'Choose a route');await applied(promptEditor,'Commit Beat');
 const narrationPrompt=await source(path);result.runtime.narrationPrompt=narrationPrompt;
 assert.equal(narrationPrompt,accepted.replace(initialHeader,initialHeader+'        "Choose a route"\n'));
 assert.deepEqual(choice().payload.options,[yes,no]);
 assert.match(document.querySelector('.preview-choice-summary').textContent,/Choose a route.*Yes.*No/);
 const mapPath=join(scratch,'synthetic-project/.renpy-editor/source-map.json');
 const noOpMap=await readFile(mapPath);promptEditor=await editChoice(choice().id);await applied(promptEditor,'Commit Beat');assert.deepEqual(await readFile(mapPath),noOpMap);assert.equal(await source(path),narrationPrompt);
 promptEditor=await editChoice(choice().id);enter(promptEditor.querySelector('[aria-label="Prompt text"]'),'Cancelled prompt');button('Cancel',promptEditor);assert.equal(await source(path),narrationPrompt);
 promptEditor=await editChoice(choice().id);enter(promptEditor.querySelector('[aria-label="Prompt speaker"]'),speaker.id,'change');enter(promptEditor.querySelector('[aria-label="Prompt text"]'),'Where shall we go?');await applied(promptEditor,'Commit Beat');
 const characterPrompt=await source(path);result.runtime.characterPrompt=characterPrompt;
 assert.equal(characterPrompt,narrationPrompt.replace('"Choose a route"',`${speaker.technicalName} "Where shall we go?"`));
 assert.equal(choice().payload.prompt.characterId,speaker.id);
 assert.match(document.querySelector('.preview-choice-summary').textContent,new RegExp(`${speaker.displayName}.*Where shall we go.*Yes.*No`));
 await applied(document,'Undo');assert.equal(await source(path),narrationPrompt);await applied(document,'Redo');assert.equal(await source(path),characterPrompt);
 promptEditor=await editChoice(choice().id);button('Remove prompt',promptEditor);await applied(promptEditor,'Commit Beat');assert.equal(await source(path),accepted);assert.deepEqual(choice().payload.options,[yes,no]);
 stage('production prompt controls add narration, switch existing Character, preview with options, cancel/no-op, history and exact removal');

 // #104 source is exported only after real production availability controls accept it.
 const flagId=workspace.authoring.variables.find(v=>v.technicalName==='choice_flag').id;
 function availability(row, enabled, policy='hide') {
   const checkbox=row.querySelector('[aria-label="Available when"]');checkbox.checked=enabled;checkbox.dispatchEvent(new Event('change',{bubbles:true}));
   if(enabled){enter(row.querySelector('[aria-label="Condition Variable"]'),flagId,'change');enter(row.querySelector('[aria-label="Condition value"]'),'true','change');enter(row.querySelector('[aria-label="If false"]'),policy,'change');}
 }
 let policyEditor=await editChoice(choice().id);button('Add option',policyEditor);
 let policyRows=policyEditor.querySelectorAll('.choice-option');enter(policyRows[0].querySelector('[aria-label="Choice option text"]'),'Secret');enter(policyRows[1].querySelector('[aria-label="Choice option text"]'),'Locked');enter(policyRows[2].querySelector('[aria-label="Choice option text"]'),'Available');
 availability(policyRows[0],true);availability(policyRows[1],true,'showDisabled');
 await applied(policyEditor,'Commit Beat');
 await addBodyBeat(no.id,'setVariable',form=>{enter(form.querySelector('[aria-label="Variable"]'),flagId,'change');enter(form.querySelector('[aria-label="Value"]'),'true','change');});
 const mixed=await source(path);result.runtime.mixedAvailability=mixed;result.runtime.choiceAdapter=await source('game/loomlight_choice_v1.rpy');result.runtime.choiceTemplate=generatedChoice;
 assert(mixed.includes('_ll_mode="showNormally"'));assert(mixed.includes('_ll_available=(choice_flag == True), _ll_guarded=True, _ll_locked=True'));assert.equal(choice().payload.options[0].text,'Secret');
 assert.match(document.querySelector('.preview-choice-summary').textContent,/Condition unknown/);assert.equal(document.querySelectorAll('.preview-choice-summary button').length,0);
 const policies=choice().payload.options;assert.equal(policies[0].unavailablePolicy,undefined);assert.equal(policies[1].unavailablePolicy,'showDisabled');
 const policyMap=await readFile(mapPath);policyEditor=await editChoice(choice().id);await applied(policyEditor,'Commit Beat');assert.equal(await source(path),mixed);assert.deepEqual(await readFile(mapPath),policyMap);
 policyEditor=await editChoice(choice().id);policyRows=policyEditor.querySelectorAll('.choice-option');availability(policyRows[2],true,'showDisabled');await applied(policyEditor,'Commit Beat');
 result.runtime.allUnavailable=await source(path);
 assert(result.runtime.allUnavailable.includes('if ((choice_flag == True)) or ((choice_flag == True)) or ((choice_flag == True)):'));
 // All-disabled and all-hidden variants are both authored with the same controls.
 policyEditor=await editChoice(choice().id);policyRows=policyEditor.querySelectorAll('.choice-option');availability(policyRows[0],true,'showDisabled');await applied(policyEditor,'Commit Beat');result.runtime.allDisabled=await source(path);
 policyEditor=await editChoice(choice().id);policyRows=policyEditor.querySelectorAll('.choice-option');for(const row of policyRows)availability(row,true,'hide');await applied(policyEditor,'Commit Beat');result.runtime.allHidden=await source(path);
 await applied(document,'Undo');assert.equal(await source(path),result.runtime.allDisabled);await applied(document,'Redo');assert.equal(await source(path),result.runtime.allHidden);
 policyEditor=await editChoice(choice().id);policyRows=policyEditor.querySelectorAll('.choice-option');availability(policyRows[1],true,'showDisabled');await applied(policyEditor,'Commit Beat');
 assert.equal(choice().payload.options[1].unavailablePolicy,'showDisabled');
 policyEditor=await editChoice(choice().id);enter(policyEditor.querySelector('[aria-label="If false"]'),'showDisabled','change');button('Cancel',policyEditor);
 // Restore the earlier two-option source through accepted history before continuing #101/#103.
 while((await source(path))!==accepted)await applied(document,'Undo');
 stage('production availability controls author mixed, all-disabled and all-hidden menus; inert unknown preview, exact no-op and history pass');



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
 document.querySelector(`[data-beat-id="${choice().id}"] .beat-select`).click();editor=document.querySelector('.expanded-beat');enter(editor.querySelector('[aria-label="Choice option text"]'),'Yes, please');await applied(editor,'Commit Beat');assert.equal(await source(path),(accepted+'# external accepted change\n').replace('"Yes" (','"Yes, please" ('));
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

 promptEditor=await editChoice(choice().id);button('Add a prompt shown with the options',promptEditor);enter(promptEditor.querySelector('[aria-label="Prompt text"]'),'Choose a route');await applied(promptEditor,'Commit Beat');
 promptEditor=await editChoice(nested.id);button('Add a prompt shown with the options',promptEditor);enter(promptEditor.querySelector('[aria-label="Prompt speaker"]'),speaker.id,'change');enter(promptEditor.querySelector('[aria-label="Prompt text"]'),'Inside, which route?');await applied(promptEditor,'Commit Beat');
 const recursivePrompt=await source(path);result.runtime.recursivePrompt=recursivePrompt;
 const outerHeader=recursive.split('\n').find(l=>l.startsWith('    menu '))+'\n',innerHeader=recursive.split('\n').find(l=>l.startsWith('                menu '))+'\n';assert.equal(recursivePrompt,recursive.replace(outerHeader,outerHeader+'        "Choose a route"\n').replace(innerHeader,innerHeader+`                    ${speaker.technicalName} "Inside, which route?"\n`));
 const nestedNow=scene().beats.find(b=>b.id===nested.id);assert.equal(nestedNow.payload.prompt.characterId,speaker.id);assert.deepEqual(nestedNow.payload.options,nested.payload.options);
 button('Close Project');await wait(()=>document.querySelector('.recent-open'));button(document.querySelector('.recent-open').textContent);await wait(()=>document.querySelector('.beat-card'));await settle();assert.equal(await source(path),recursivePrompt);
 // Ordinary external filesystem conflict must retain the original prompt draft.
 promptEditor=await editChoice(choice().id);enter(promptEditor.querySelector('[aria-label="Prompt text"]'),'Retained prompt after conflict');
 await appendFile(join(scratch,'synthetic-project',path),'# ordinary external writer\r\n');
 const external=await readFile(join(scratch,'synthetic-project',path));const externalMap=await readFile(mapPath);
 lastApply=undefined;button('Commit Beat',promptEditor);await wait(()=>lastApply);await settle();assert.equal(lastApply.ok,false);assert.equal(lastApply.error.code,'SOURCE_CONFLICT');assert.equal(promptEditor.querySelector('[aria-label="Prompt text"]').value,'Retained prompt after conflict');assert(promptEditor.isConnected);assert.deepEqual(await readFile(join(scratch,'synthetic-project',path)),external);assert.deepEqual(await readFile(mapPath),externalMap);button('Cancel',promptEditor);
 button('Close Project');await wait(()=>document.querySelector('.recent-open'));button(document.querySelector('.recent-open').textContent);await wait(()=>document.querySelector('.beat-card'));await settle();assert.equal(await source(path),external.toString('utf8').replace(/^\uFEFF/,''));
 stage('nested prompt preserves recursive Call and option ownership; reopen and ordinary external conflict retain exact source and drafts');
 // #105 authors the conversation and its endings through the production controls.
 await call('variable.create',{technicalName:'choice_visits',variableType:'int',defaultValue:0});
 await saveSource(path,`label ${entry.technicalLabel}:\n    "Shared once"\n    return\n`);
 button('Close Project');await wait(()=>document.querySelector('.recent-open'));button(document.querySelector('.recent-open').textContent);await wait(()=>document.querySelector('.beat-card'));await settle();
 button('Add Beat');draft=document.querySelector('.new-beat');enter(draft.querySelector('[aria-label="Beat type"]'),'setVariable','change');enter(draft.querySelector('[aria-label="Insert before"]'),scene().beats.find(b=>b.payload.text==='Shared once').id,'change');enter(draft.querySelector('[aria-label="Variable"]'),workspace.authoring.variables.find(v=>v.technicalName==='choice_visits').id,'change');enter(draft.querySelector('[aria-label="Formula"]'),'choice_visits + 1');await applied(draft,'Add Beat');
 button('Add Beat');draft=document.querySelector('.new-beat');enter(draft.querySelector('[aria-label="Beat type"]'),'choice','change');enter(draft.querySelector('[aria-label="Insert before"]'),scene().beats.find(b=>b.payload.text==='Shared once').id,'change');
 enter(draft.querySelector('[aria-label="Choice option text"]'),'Ask about the station');button('Add option',draft);enter(draft.querySelectorAll('[aria-label="Choice option text"]')[1],'Ask about the ticket');button('Add option',draft);enter(draft.querySelectorAll('[aria-label="Choice option text"]')[2],'Leave');await applied(draft,'Add Beat');
 const conversationId=choice().id,[station,ticket,leave]=choice().payload.options;
 promptEditor=await editChoice(conversationId);button('Add a prompt shown with the options',promptEditor);enter(promptEditor.querySelector('[aria-label="Prompt text"]'),'What would you like to ask?');availability(promptEditor.querySelectorAll('.choice-option')[1],true,'showDisabled');await applied(promptEditor,'Commit Beat');
 await addBodyBeat(station.id,'narration',form=>enter(form.querySelector('textarea'),'Station answer'));
 await addBodyBeat(station.id,'call',form=>enter(form.querySelector('[aria-label="Call destination Scene"]'),target.id,'change'));
 await addBodyBeat(station.id,'narration',form=>enter(form.querySelector('textarea'),'Station call resumed'));
 await addBodyBeat(station.id,'setVariable',form=>{enter(form.querySelector('[aria-label="Variable"]'),flagId,'change');enter(form.querySelector('[aria-label="Value"]'),'true','change');});
 await addBodyBeat(ticket.id,'narration',form=>enter(form.querySelector('textarea'),'Ticket answer'));
 async function thenOption(id,kind,commit=true){button('Then',option(id));const form=document.querySelector('.story-operation[aria-label="Option ending"]');enter(form.querySelector('[aria-label="Then"]'),kind,'change');if(commit)await applied(form,'Apply ending');return form;}
 const beforeRepeat=await source(path),beforeRepeatMap=await readFile(mapPath);
 panel=await thenOption(station.id,'repeatChoice',false);assert([...panel.querySelector('[aria-label="Then"]').options].some(o=>o.textContent==='Repeat this Choice'));button('Cancel',panel);assert.equal(await source(path),beforeRepeat);assert.deepEqual(await readFile(mapPath),beforeRepeatMap);
 await thenOption(station.id,'repeatChoice');const oneRepeat=await source(path);assert.equal((oneRepeat.match(/label _ll_choice_/g)??[]).length,1);assert(oneRepeat.includes('"Station call resumed"\n            $ choice_flag = True\n            jump _ll_choice_'));
 assert.equal(choice().id,conversationId);assert.deepEqual(choice().payload.options.map(o=>o.id),[station.id,ticket.id,leave.id]);
 const repeatMap=await readFile(mapPath);await thenOption(station.id,'repeatChoice');assert.equal(await source(path),oneRepeat);assert.deepEqual(await readFile(mapPath),repeatMap);
 await applied(document,'Undo');assert.equal(await source(path),beforeRepeat);await applied(document,'Redo');assert.equal(await source(path),oneRepeat);
 panel=await thenOption(ticket.id,'repeatChoice',false);staleSession=true;lastApply=undefined;button('Apply ending',panel);await wait(()=>lastApply);await settle();staleSession=false;assert.equal(lastApply.ok,false);assert.equal(panel.querySelector('[aria-label="Then"]').value,'repeatChoice');assert(panel.isConnected);assert.equal(await source(path),oneRepeat);button('Cancel',panel);
 await thenOption(ticket.id,'repeatChoice');result.runtime.repeatConversation=await source(path);assert.equal((result.runtime.repeatConversation.match(/label _ll_choice_/g)??[]).length,1);
 await thenOption(station.id,'continue');assert((await source(path)).includes('"Station call resumed"\n            $ choice_flag = True\n'));await applied(document,'Undo');assert.equal(await source(path),result.runtime.repeatConversation);
 const repeatFlow=await call('flow.list');assert.equal(repeatFlow.edges.filter(e=>e.kind==='repeat'&&e.destination.beatId===conversationId).length,2);
 // No selectable options after Repeat must traverse the same aggregate gate.
 promptEditor=await editChoice(conversationId);for(const row of promptEditor.querySelectorAll('.choice-option')){availability(row,true,'showDisabled');enter(row.querySelector('[aria-label="Condition value"]'),'false','change');}await applied(promptEditor,'Commit Beat');result.runtime.repeatExhausted=await source(path);
 await applied(document,'Undo');assert.equal(await source(path),result.runtime.repeatConversation);
 // A Choice nested in a condition inside another option owns its own target.
 promptEditor=await editChoice(conversationId);button('Add option',promptEditor);enter(promptEditor.querySelectorAll('[aria-label="Choice option text"]')[3],'Nested conversation');await applied(promptEditor,'Commit Beat');
 const nestedOuter=choice().payload.options[3];button('Add Condition',option(nestedOuter.id));panel=document.querySelector('.story-operation[aria-label="Add Condition"]');enter(panel.querySelector('[aria-label="Condition Variable"]'),flagId,'change');enter(panel.querySelector('[aria-label="Condition value"]'),'false','change');await applied(panel,'Create Condition');
 const repeatBranch=scene().beats.find(b=>b.conditionalBranch&&!b.conditionalBranch.choiceOption);button('Add Beat to If',document.querySelector(`[data-branch-id="${repeatBranch.id}"]`));draft=document.querySelector('.new-beat');enter(draft.querySelector('[aria-label="Beat type"]'),'choice','change');enter(draft.querySelector('[aria-label="Choice option text"]'),'Inner ask');button('Add option',draft);enter(draft.querySelectorAll('[aria-label="Choice option text"]')[1],'Inner leave');await applied(draft,'Add Beat');
 const repeatInner=scene().beats.find(b=>b.payload.type==='choice'&&b.owner),innerAsk=repeatInner.payload.options[0];promptEditor=await editChoice(repeatInner.id);button('Add a prompt shown with the options',promptEditor);enter(promptEditor.querySelector('[aria-label="Prompt speaker"]'),speaker.id,'change');enter(promptEditor.querySelector('[aria-label="Prompt text"]'),'Inside, ask again?');await applied(promptEditor,'Commit Beat');
 await addBodyBeat(innerAsk.id,'narration',form=>enter(form.querySelector('textarea'),'Inner answer'));await thenOption(innerAsk.id,'repeatChoice');await addBodyBeat(nestedOuter.id,'narration',form=>enter(form.querySelector('textarea'),'Outer resumed'));result.runtime.repeatNested=await source(path);
 assert.equal((result.runtime.repeatNested.match(/label _ll_choice_/g)??[]).length,2);const innerRepeat=scene().beats.find(b=>b.payload.type==='repeatChoice'&&b.owner?.branchId===innerAsk.id);assert(innerRepeat);assert((await call('flow.list')).edges.some(e=>e.kind==='repeat'&&e.beatId===innerRepeat.id&&e.destination.beatId===repeatInner.id));
 const allRepeatIds=scene().beats.map(b=>b.id);button('Close Project');await wait(()=>document.querySelector('.recent-open'));button(document.querySelector('.recent-open').textContent);await wait(()=>document.querySelector('.beat-card'));await settle();assert.deepEqual(scene().beats.map(b=>b.id),allRepeatIds);assert.equal(await source(path),result.runtime.repeatNested);
 stage('production Repeat preserves preceding Beats and Call, shares one target per Choice, supports no-op/cancel/history/reopen, and exports prompted nested and availability-changing runtime sources');
 // #106 uses the approved whole-Choice selector through the actual editor.
 promptEditor=await editChoice(conversationId);
 const pickedControl=promptEditor.querySelector('[aria-label="Picked options"]');
 assert(pickedControl, 'The real Story editor must offer Picked options');
 enter(pickedControl,'markPicked','change');await applied(promptEditor,'Commit Beat');
 result.runtime.pickedRepeat=await source(path);
 result.runtime.pickedAdapter=await source('game/loomlight_choice_v1.rpy');
 assert.equal(choice().payload.pickedPolicy,'markPicked');
 assert.deepEqual(choice().payload.options.map(o=>o.id),[station.id,ticket.id,leave.id,nestedOuter.id]);
 await applied(document,'Undo');assert.equal(await source(path),result.runtime.repeatNested);
 await applied(document,'Redo');assert.equal(await source(path),result.runtime.pickedRepeat);
 stage('production Picked options controls accept current-save history through the shared transaction');

 // Hide picked must win when a picked Repeat answer becomes disabled.
 promptEditor=await editChoice(conversationId);enter(promptEditor.querySelector('[aria-label="Picked options"]'),'hidePicked','change');availability(promptEditor.querySelectorAll('.choice-option')[0],true,'showDisabled');enter(promptEditor.querySelectorAll('.choice-option')[0].querySelector('[aria-label="Condition value"]'),'false','change');await applied(promptEditor,'Commit Beat');result.runtime.pickedRepeatHide=await source(path);
 // Independent Scene reentry fixtures. Only the exported accepted bytes reach the SDK.
 await saveSource(path,`label ${entry.technicalLabel}:\n    "Shared once"\n    return\n`);
 await saveSource(target.sourcePath,`label ${target.technicalLabel}:\n    "Reenter Choice"\n    jump ${entry.technicalLabel}\n`);
 result.runtime.pickedTarget=await source(target.sourcePath);
 button('Close Project');await wait(()=>document.querySelector('.recent-open'));button(document.querySelector('.recent-open').textContent);await wait(()=>document.querySelector('.beat-card'));await settle();
 button('Add Beat');draft=document.querySelector('.new-beat');enter(draft.querySelector('[aria-label="Beat type"]'),'choice','change');enter(draft.querySelector('[aria-label="Insert before"]'),scene().beats.find(b=>b.payload.text==='Shared once').id,'change');
 enter(draft.querySelector('[aria-label="Choice option text"]'),'Same');button('Add option',draft);enter(draft.querySelectorAll('[aria-label="Choice option text"]')[1],'Same');button('Add option',draft);enter(draft.querySelectorAll('[aria-label="Choice option text"]')[2],'Locked');
 enter(draft.querySelector('[aria-label="Picked options"]'),'showNormally','change');availability(draft.querySelectorAll('.choice-option')[2],true,'showDisabled');await applied(draft,'Add Beat');
 const pickedId=choice().id,[firstPick,secondPick,lockedPick]=choice().payload.options;
 for(const id of [firstPick.id,secondPick.id]){panel=await thenOption(id,'jump',false);enter(panel.querySelector('[aria-label="Destination Scene"]'),target.id,'change');await applied(panel,'Apply ending');}
 promptEditor=await editChoice(pickedId);button('Add a prompt shown with the options',promptEditor);enter(promptEditor.querySelector('[aria-label="Prompt text"]'),'Choose independently');await applied(promptEditor,'Commit Beat');
 result.runtime.pickedShow=await source(path);
 promptEditor=await editChoice(pickedId);enter(promptEditor.querySelector('[aria-label="Picked options"]'),'markPicked','change');await applied(promptEditor,'Commit Beat');result.runtime.pickedMark=await source(path);
 assert.match(document.querySelector('.preview-choice-summary').textContent,/Picked state unknown/);assert.equal(document.querySelectorAll('.preview-choice-summary button').length,0);
 const pickedMap=await readFile(mapPath);promptEditor=await editChoice(pickedId);await applied(promptEditor,'Commit Beat');assert.equal(await source(path),result.runtime.pickedMark);assert.deepEqual(await readFile(mapPath),pickedMap);
 promptEditor=await editChoice(pickedId);enter(promptEditor.querySelector('[aria-label="Picked options"]'),'hidePicked','change');button('Cancel',promptEditor);assert.equal(await source(path),result.runtime.pickedMark);
 promptEditor=await editChoice(pickedId);enter(promptEditor.querySelector('[aria-label="Picked options"]'),'hidePicked','change');await applied(promptEditor,'Commit Beat');result.runtime.pickedHide=await source(path);
 await applied(document,'Undo');assert.equal(await source(path),result.runtime.pickedMark);await applied(document,'Redo');assert.equal(await source(path),result.runtime.pickedHide);
 result.runtime.pickedIdentities={choice:pickedId,options:[firstPick.id,secondPick.id,lockedPick.id]};
 // Rename/reorder preserves keys. A newly added identical caption gets a fresh key.
 promptEditor=await editChoice(pickedId);button('Move option down',promptEditor.querySelectorAll('.choice-option')[0]);enter(promptEditor.querySelectorAll('.choice-option')[0].querySelector('[aria-label="Choice option text"]'),'Renamed');button('Add option',promptEditor);enter(promptEditor.querySelectorAll('.choice-option')[3].querySelector('[aria-label="Choice option text"]'),'Same');await applied(promptEditor,'Commit Beat');
 assert.equal(choice().payload.options[0].id,secondPick.id);assert.equal(choice().payload.options[1].id,firstPick.id);assert(![firstPick.id,secondPick.id,lockedPick.id].includes(choice().payload.options[3].id));
 await applied(document,'Undo');assert.equal(await source(path),result.runtime.pickedHide);
 button('Close Project');await wait(()=>document.querySelector('.recent-open'));button(document.querySelector('.recent-open').textContent);await wait(()=>document.querySelector('.beat-card'));await settle();assert.equal(await source(path),result.runtime.pickedHide);assert.equal(choice().id,pickedId);
 // Retain the whole Choice draft on invalid text, stale session and external conflict.
 promptEditor=await editChoice(pickedId);enter(promptEditor.querySelector('[aria-label="Picked options"]'),'markPicked','change');enter(promptEditor.querySelector('[aria-label="Choice option text"]'),'');lastApply=undefined;button('Commit Beat',promptEditor);await settle();assert.equal(lastApply,undefined);assert.equal(promptEditor.querySelector('[aria-label="Picked options"]').value,'markPicked');button('Cancel',promptEditor);
 promptEditor=await editChoice(pickedId);enter(promptEditor.querySelector('[aria-label="Picked options"]'),'markPicked','change');staleSession=true;lastApply=undefined;button('Commit Beat',promptEditor);await wait(()=>lastApply);await settle();staleSession=false;assert.equal(lastApply.ok,false);assert(promptEditor.isConnected);assert.equal(promptEditor.querySelector('[aria-label="Picked options"]').value,'markPicked');assert.equal(await source(path),result.runtime.pickedHide);button('Cancel',promptEditor);
 // Immediate Return and immediate Repeat are accepted through the same Then controls.
 await thenOption(firstPick.id,'return');result.runtime.pickedReturn=await source(path);await applied(document,'Undo');
 await thenOption(firstPick.id,'repeatChoice');result.runtime.pickedImmediateRepeat=await source(path);await applied(document,'Undo');assert.equal(await source(path),result.runtime.pickedHide);
 // A separate Choice with identical captions must have independent history.
 button('Add Beat');draft=document.querySelector('.new-beat');enter(draft.querySelector('[aria-label="Beat type"]'),'choice','change');enter(draft.querySelector('[aria-label="Insert before"]'),scene().beats.find(b=>b.payload.text==='Shared once').id,'change');enter(draft.querySelector('[aria-label="Choice option text"]'),'Same');button('Add option',draft);enter(draft.querySelectorAll('[aria-label="Choice option text"]')[1],'Same');enter(draft.querySelector('[aria-label="Picked options"]'),'markPicked','change');await applied(draft,'Add Beat');
 const secondChoice=scene().beats.find(b=>b.payload.type==='choice'&&b.id!==pickedId);result.runtime.pickedInstanceIdentities={choice:secondChoice.id,options:secondChoice.payload.options.map(o=>o.id)};assert(![pickedId,firstPick.id,secondPick.id].includes(secondChoice.id));result.runtime.pickedInstances=await source(path);
 await applied(document,'Undo');assert.equal(await source(path),result.runtime.pickedHide);
 // Exhaustion makes the shared continuation reachable even when every option transfers.
 promptEditor=await editChoice(pickedId);button('Remove option',promptEditor.querySelectorAll('.choice-option')[2]);await applied(promptEditor,'Commit Beat');
 const transferOnly=await source(path),sharedAnchor=scene().beats.find(b=>b.payload.text==='Shared once'),finalReturn=scene().beats.at(-1);
 for(const anchor of [sharedAnchor,finalReturn]){
  button('Add Beat');draft=document.querySelector('.new-beat');
  const position=draft.querySelector('[aria-label="Insert before"]');
  assert.deepEqual([...position.options].map(o=>o.value),[pickedId,sharedAnchor.id,finalReturn.id]);assert.equal(position.value,finalReturn.id);
  enter(position,anchor.id,'change');enter(draft.querySelector('[aria-label="Beat type"]'),'narration','change');enter(draft.querySelector('textarea'),'Exhaustion insertion');await applied(draft,'Add Beat');
  const inserted=scene().beats.find(b=>b.payload.text==='Exhaustion insertion');assert(inserted&&!inserted.owner);assert.equal(lastApply.ok,true);
  assert.deepEqual(result.transcript.filter(t=>t.request.operation==='scene.apply').at(-1).request.payload.command.position,{type:'before',anchor:{type:'beat',beatId:anchor.id}});
  await applied(document,'Undo');assert.equal(await source(path),transferOnly);
 }
 await addBodyBeat(firstPick.id,'choice',form=>{enter(form.querySelector('[aria-label="Choice option text"]'),'Nested leave');enter(form.querySelector('[aria-label="Picked options"]'),'hidePicked','change');});
 const exhaustionInner=scene().beats.find(b=>b.payload.type==='choice'&&b.owner?.branchId===firstPick.id);
 await thenOption(exhaustionInner.payload.options[0].id,'return');
 const nestedBefore=await source(path),sharedJump=scene().beats.find(b=>b.payload.type==='jump'&&b.owner?.branchId===firstPick.id);
 button('Add a Beat',option(firstPick.id));draft=document.querySelector('.new-beat');
 const nestedPosition=draft.querySelector('[aria-label="Insert before"]');assert.deepEqual([...nestedPosition.options].map(o=>o.value),[exhaustionInner.id,sharedJump.id]);
 enter(nestedPosition,sharedJump.id,'change');enter(draft.querySelector('[aria-label="Beat type"]'),'narration','change');enter(draft.querySelector('textarea'),'Nested exhaustion insertion');await applied(draft,'Add Beat');
 const nestedInserted=scene().beats.find(b=>b.payload.text==='Nested exhaustion insertion');assert.equal(nestedInserted.owner.branchId,firstPick.id);assert.equal(lastApply.ok,true);
 await applied(document,'Undo');assert.equal(await source(path),nestedBefore);
 await applied(document,'Undo');await applied(document,'Undo');assert.equal(await source(path),transferOnly);
 await applied(document,'Undo');assert.equal(await source(path),result.runtime.pickedHide);
 stage('Hide picked exposes shared Beat/final Return and nested continuation positions through actual controls and public dispatch');
 promptEditor=await editChoice(pickedId);enter(promptEditor.querySelector('[aria-label="Picked options"]'),'markPicked','change');await appendFile(join(scratch,'synthetic-project',path),'# picked external writer\n');const pickedExternal=await readFile(join(scratch,'synthetic-project',path));lastApply=undefined;button('Commit Beat',promptEditor);await wait(()=>lastApply);await settle();assert.equal(lastApply.ok,false);assert.equal(lastApply.error.code,'SOURCE_CONFLICT');assert(promptEditor.isConnected);assert.equal(promptEditor.querySelector('[aria-label="Picked options"]').value,'markPicked');assert.deepEqual(await readFile(join(scratch,'synthetic-project',path)),pickedExternal);button('Cancel',promptEditor);
 stage('independent Scene routes export all three picked policies, duplicate-caption identities, immediate Jumps, inert preview, Cancel/no-op/history and reopen');
 result.acceptedSource=await source(path);result.sourceSHA256=hash(result.acceptedSource);result.identities=ids;
 button('Close Project');await wait(()=>document.querySelector('.recent-open'));result.passed=true;
} catch(error){result.failure={message:error.message,stack:error.stack};result.dom=document.body.innerHTML;throw error;}
finally{await browser.happyDOM.close();try{await child.stop();result.driver=child.exitStatus();await assert.rejects(access(scratch));result.cleanupComplete=true;}finally{await writeFile(join(output,'result.json'),JSON.stringify(result,null,2)+'\n');}}
console.log('PASS actual production Story/main to core Choice body journey. Happy DOM input, no SDK/native claim.');
