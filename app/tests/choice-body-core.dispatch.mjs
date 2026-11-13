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
  // Each beat draft step adds one history.draftStep request (#113); the journey makes 138.
  const steps=result.transcript.filter(entry=>entry.request.operation==='history.draftStep').length;
  assert(result.transcript.length-steps<800&&steps<200,"Unexpected request loop");
  if(ui&&['scene.apply','history.undo','history.redo'].includes(operation)){assert(lastEvent?.connected,'Story mutation must originate at connected production controls');lastApply=response;}
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
// The header Undo and Redo: icon buttons with no text, enabled once the next entry is known.
async function historyStep(direction){await wait(()=>document.querySelector(`.app-header [data-history="${direction}"]:not([aria-disabled="true"])`));lastApply=undefined;document.querySelector(`.app-header [data-history="${direction}"]`).click();await wait(()=>lastApply);await settle();return lastApply;}
const button=(text,scope=document)=>{const b=[...scope.querySelectorAll('button')].find(b=>(b.textContent===text||b.getAttribute('aria-label')===text)&&!b.disabled);assert(b,`Missing enabled ${text}`);b.click();return b;};
const enter=(node,text,event='input')=>{assert(node?.isConnected&&!node.disabled);node.focus();node.value=text;node.dispatchEvent(new Event(event,{bubbles:true}));};
const source=async path=>(await call('source.open',{path})).text;
async function saveSource(path,text){const base=await call('source.open',{path});const draft=await call('source.updateDraft',{path,expectedBaseRevision:base.baseRevision,text,selectionStart:0,selectionEnd:0});await call('source.save',{path,expectedBaseRevision:draft.baseRevision,expectedDraftVersion:draft.draftVersion});}
// Story Combined: Tracks columns, the Branch path and the editor beside the stage.
const beatsOf=id=>(workspace.scenes.find(s=>s.beats.some(b=>b.id===id))?.beats??[]);
const column=id=>[...document.querySelectorAll('.story-tracks [data-beat-id]')].find(node=>node.dataset.beatId===id);
const editorFor=id=>document.querySelector(`.story-editor[data-editor-for="${id}"]`);
const openBranch=id=>{const segment=[...document.querySelectorAll('.story-branch-segment')].find(item=>item.dataset.branchId===id);assert(segment,`Missing Branch path switch ${id}`);if(segment.ariaPressed!=='true')segment.click();};
const pick=id=>{const beats=beatsOf(id),chain=[];let beat=beats.find(b=>b.id===id);while(beat?.owner){chain.unshift(beat.owner.branchId);beat=beats.find(b=>b.id===beat.owner.branchId);}chain.forEach(openBranch);
 const target=column(id).querySelector(':scope > .story-track-beat, :scope > .story-slot-name');if(target.dataset.selected!=='true')target.click();return editorFor(id);};
// A condition's editor with its If branch open, by the If header.
const ifBranch=id=>{pick(id);openBranch(id);return pick(id);};
// An option is a numbered block in its Choice's editor.
const option=id=>{const shown=document.querySelector(`.story-editor .story-option[data-option-id="${id}"]`);if(shown)return shown;
 const menu=beatsOf(id).find(b=>b.payload.type==='choice'&&b.payload.options.some(o=>o.id===id));pick(menu.id);return document.querySelector(`.story-editor .story-option[data-option-id="${id}"]`);};
// Add a beat: pick a kind in the open dialog; its new beat opens in the editor.
const kind=type=>{const row=document.querySelector(`.story-add-beat [data-insert-kind="${type}"]`);assert(row,`Add a beat offers ${type}`);row.click();return document.querySelector('.story-editor .new-beat');};
// + Add beat in the scene toolbar, then a kind.
const addBeat=type=>{button('+ Add beat');return kind(type);};
// An unadded new beat's Move to tree: its positions in its own place, and choosing one.
const placeTree=draft=>{draft.querySelector('.story-beat-menu > summary').click();button('Move to…',draft);return document.querySelector('.story-move');};
const positionsIn=tree=>{const chosen=tree.querySelector('[role=treeitem][aria-selected="true"]'),level=chosen?.getAttribute('aria-level');return [...tree.querySelectorAll('[role=treeitem][aria-selected]')].filter(item=>item.getAttribute('aria-level')===level).map(item=>item.textContent.slice(1));};
const beatNumber=id=>column(id).querySelector('.story-beat-number').textContent;
async function placeBefore(draft,beatId){const tree=placeTree(draft);const position=[...tree.querySelectorAll('[role=treeitem][aria-selected]')].find(item=>item.textContent.slice(1).startsWith(`Before ${beatNumber(beatId)} `));assert(position,`place before ${beatId}`);position.click();button('Move',tree);await settle();assert(!tree.isConnected);}
// Only when: the rule builder tests choice_flag; If false is Hide or Show disabled.
function availability(row,enabled,policy='hide',value='true'){
 const number=Number(row.dataset.choiceIndex)+1,toggle=row.querySelector('.story-guard > button');if(toggle)toggle.click();
 const rules=row.querySelector('.story-rules');
 if(!enabled){for(const remove of [...rules.querySelectorAll('button[aria-label^="Remove rule"]')].reverse())remove.click();button('Done',row);return;}
 const rule=rules.querySelector('.story-rule');rule.querySelector('.story-variable-picker > summary').click();
 const variable=[...rule.querySelectorAll('[role=option]')].find(item=>item.querySelector('.story-variable-name')?.textContent==='choice_flag');if(variable.getAttribute('aria-selected')!=='true')variable.click();
 [...row.querySelector('.story-rule').querySelectorAll('[role=radio]')].find(item=>item.textContent===(value==='true'?'is true':'is false')).click();
 button('Done',row);
 [...row.querySelectorAll(`[role=radiogroup][aria-label="Option ${number} if false"] [role=radio]`)].find(item=>item.textContent===(policy==='showDisabled'?'Show disabled':'Hide')).click();
}
// A new condition's first rule tests choice_flag.
function conditionRule(form,value){const rule=form.querySelector('.story-rule');rule.querySelector('.story-variable-picker > summary').click();
 [...rule.querySelectorAll('[role=option]')].find(item=>item.querySelector('.story-variable-name')?.textContent==='choice_flag').click();
 [...form.querySelector('.story-rule').querySelectorAll('[role=radio]')].find(item=>item.textContent===(value==='true'?'is true':'is false')).click();}
// A branch's + Beat is named after the branch: "Add a beat to If (choice_flag is True)".
const ifName=id=>{const editor=pick(id);return editor.querySelector(`[data-beat-opener="branch:${id}"]`).getAttribute('aria-label').replace(/^Add a beat to /,'');};
// Picked options and the prompt speaker are a switch and a portrait list.
const pickedMode=(editor,mode)=>[...editor.querySelectorAll('[role=radiogroup][aria-label="Picked options"] [role=radio]')].find(item=>item.textContent===({showNormally:'Show normally',markPicked:'Mark picked',hidePicked:'Hide picked'})[mode]).click();
const promptSpeaker=(editor,character)=>{editor.querySelector('.story-prompt .story-dropdown > summary').click();[...editor.querySelectorAll('.story-prompt [role=option]')].find(item=>item.getAttribute('aria-label')===character.displayName).click();};
// Then: choose an ending in an option's Then menu; Go to a scene picks its scene in the sheet.
const endingLabels={continue:'Continue after the Choice',jump:'Go to a scene',repeatChoice:'Repeat this Choice',return:'Return'};
async function thenOption(id,ending,sceneId,commit=true){const block=option(id);block.querySelector('.story-outcome > summary').click();
 const item=[...block.querySelectorAll('.story-outcome [role=option]')].find(o=>o.getAttribute('aria-label').startsWith(`${endingLabels[ending]}.`));assert(item,`Then offers ${ending}`);
 // Choosing the ending already there changes nothing.
 if(item.getAttribute('aria-selected')==='true'&&ending!=='jump'){item.click();await settle();return undefined;}
 lastApply=undefined;item.click();
 if(ending==='jump'){const tile=[...document.querySelectorAll('.story-sheet .story-tile')].find(t=>t.dataset.value===sceneId);assert(tile,'scene sheet');tile.click();}
 await wait(()=>lastApply);await settle();if(commit)assert.equal(lastApply.ok,true,JSON.stringify(lastApply));return lastApply;}
async function applied(scope,label){if(label==='Undo'||label==='Redo'){assert.equal((await historyStep(label.toLowerCase())).ok,true,JSON.stringify(lastApply));return;}lastApply=undefined;button(label,scope);await wait(()=>lastApply);await settle();assert.equal(lastApply.ok,true,JSON.stringify(lastApply));}
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
 await wait(()=>document.querySelector('.recent-open')&&!document.querySelector('.recent-open').disabled);button(document.querySelector('.recent-open').textContent);await wait(()=>document.querySelector('.story-track-column'));await settle();
 [...document.querySelectorAll('.tree-scene-open')].find(b=>b.textContent===entry.displayName).click();await wait(()=>document.querySelector('.tree-scene-row.selected .tree-scene-open')?.textContent===entry.displayName);await settle();
 const scene=()=>workspace.scenes.find(s=>s.id===entry.id),choice=()=>scene().beats.find(b=>b.payload.type==='choice');
 assert.equal(await source(path),original);
 let draft=addBeat('choice');await placeBefore(draft,scene().beats.find(b=>b.payload.text==='Shared once').id);
 enter(draft.querySelector('[aria-label="Choice option text"]'),'Yes');button('+ Add option',draft);
 enter(draft.querySelectorAll('[aria-label="Choice option text"]')[1],'No');await applied(draft,'Add Beat');
 assert(choice());const [yes,no]=choice().payload.options;assert(yes.id&&no.id&&yes.id!==no.id);
 const empty=await source(path);
 const initialHeader=`    menu (screen="_ll_choice_v1", _ll_mode="showNormally", _ll_id="${choice().id}"):\n`;
 const initialOption=(text,id)=>`        "${text}" (_ll_id="${id}", _ll_available=True, _ll_guarded=False, _ll_locked=False) if True:\n            $ _ll_picked_v1[("${choice().id}", "${id}")] = True\n            pass\n`;
 assert.equal(empty,original.replace('    "Shared once"',initialHeader+initialOption('Yes',yes.id)+initialOption('No',no.id)+'    "Shared once"'));

 const ids=[choice().id,yes.id,no.id];
 stage('production Add Choice creates two inert empty bodies before one shared continuation');
 button('+ Beat',option(yes.id));draft=kind('setVariable');
 enter(draft.querySelector('[aria-label="Variable"]'),workspace.authoring.variables.find(v=>v.technicalName==='choice_flag').id,'change');enter(draft.querySelector('[aria-label="Value"]'),'true','change');await applied(draft,'Add Beat');
 const accepted=await source(path);result.runtime={continuation:accepted,entryLabel:entry.technicalLabel,target:await source(target.sourcePath)};assert.equal(accepted,empty.replace('            pass','            $ choice_flag = True'));
 assert.equal(scene().beats.filter(b=>b.structuralPlaceholder).length,1);assert.equal(scene().beats.filter(b=>b.payload.text==='Shared once').length,1);
 await applied(document,'Undo');assert.equal(await source(path),empty);await applied(document,'Redo');assert.equal(await source(path),accepted);
 stage('production option body writes the boolean through explicit body/position to real core');
 // #103 uses the same Choice editor and accepted transaction boundary.
 const speaker=workspace.authoring.characters[0];
 result.runtime.characterDefinition=speaker.source.statement+'\n';
 // Undo and Redo reveal the beat they change, so it may already be open.
 async function editChoice(id) { pick(id); await settle(); return editorFor(id).querySelector('.expanded-beat'); }
 let promptEditor=await editChoice(choice().id);
 button('Add a prompt shown with the options',promptEditor);
 // An empty prompt is no prompt: Commit changes nothing.
 let promptText=promptEditor.querySelector('[aria-label="Prompt text"]');assert.equal(document.activeElement,promptText);
 await applied(promptEditor,'Commit Beat');assert.equal(await source(path),accepted);
 promptEditor=await editChoice(choice().id);button('Add a prompt shown with the options',promptEditor);promptText=promptEditor.querySelector('[aria-label="Prompt text"]');
 enter(promptText,'Choose a route');await applied(promptEditor,'Commit Beat');
 const narrationPrompt=await source(path);result.runtime.narrationPrompt=narrationPrompt;
 assert.equal(narrationPrompt,accepted.replace(initialHeader,initialHeader+'        "Choose a route"\n'));
 assert.deepEqual(choice().payload.options,[yes,no]);
 assert.equal(document.querySelector('.preview-canvas .preview-overlay').textContent,'Choose a route');assert.deepEqual([...document.querySelectorAll('.preview-canvas .story-game-choice')].map(item=>item.textContent),['Yes','No']);
 const mapPath=join(scratch,'synthetic-project/.renpy-editor/source-map.json');
 const noOpMap=await readFile(mapPath);promptEditor=await editChoice(choice().id);await applied(promptEditor,'Commit Beat');assert.deepEqual(await readFile(mapPath),noOpMap);assert.equal(await source(path),narrationPrompt);
 promptEditor=await editChoice(choice().id);enter(promptEditor.querySelector('[aria-label="Prompt text"]'),'Cancelled prompt');button('Cancel',promptEditor);assert.equal(await source(path),narrationPrompt);
 promptEditor=await editChoice(choice().id);promptSpeaker(promptEditor,speaker);enter(promptEditor.querySelector('[aria-label="Prompt text"]'),'Where shall we go?');await applied(promptEditor,'Commit Beat');
 const characterPrompt=await source(path);result.runtime.characterPrompt=characterPrompt;
 assert.equal(characterPrompt,narrationPrompt.replace('"Choose a route"',`${speaker.technicalName} "Where shall we go?"`));
 assert.equal(choice().payload.prompt.characterId,speaker.id);
 assert.equal(document.querySelector('.preview-canvas .preview-overlay').textContent,`${speaker.displayName}Where shall we go?`);
 await applied(document,'Undo');assert.equal(await source(path),narrationPrompt);await applied(document,'Redo');assert.equal(await source(path),characterPrompt);
 // Clearing the prompt text removes the prompt.
 promptEditor=await editChoice(choice().id);enter(promptEditor.querySelector('[aria-label="Prompt text"]'),'');await applied(promptEditor,'Commit Beat');assert.equal(await source(path),accepted);assert.deepEqual(choice().payload.options,[yes,no]);
 stage('production prompt controls add narration, switch existing Character, preview with options, cancel/no-op, history and exact removal');

 // #104 source is exported only after real production availability controls accept it.
 const flagId=workspace.authoring.variables.find(v=>v.technicalName==='choice_flag').id;
 let policyEditor=await editChoice(choice().id);button('+ Add option',policyEditor);
 let policyRows=policyEditor.querySelectorAll('.story-option');enter(policyRows[0].querySelector('[aria-label="Choice option text"]'),'Secret');enter(policyRows[1].querySelector('[aria-label="Choice option text"]'),'Locked');enter(policyRows[2].querySelector('[aria-label="Choice option text"]'),'Available');
 availability(policyRows[0],true);availability(policyRows[1],true,'showDisabled');
 await applied(policyEditor,'Commit Beat');
 await addBodyBeat(no.id,'setVariable',form=>{enter(form.querySelector('[aria-label="Variable"]'),flagId,'change');enter(form.querySelector('[aria-label="Value"]'),'true','change');});
 const mixed=await source(path);result.runtime.mixedAvailability=mixed;result.runtime.choiceAdapter=await source('game/loomlight_choice_v1.rpy');result.runtime.choiceTemplate=generatedChoice;
 assert(mixed.includes('_ll_mode="showNormally"'));assert(mixed.includes('_ll_available=(choice_flag == True), _ll_guarded=True, _ll_locked=True'));assert.equal(choice().payload.options[0].text,'Secret');
 assert.deepEqual([...document.querySelectorAll('.preview-canvas .story-game-choice')].map(item=>item.dataset.state),['unknown','unknown','available'],'guarded options read unknown on the stage');
 const policies=choice().payload.options;assert.equal(policies[0].unavailablePolicy,undefined);assert.equal(policies[1].unavailablePolicy,'showDisabled');
 const policyMap=await readFile(mapPath);policyEditor=await editChoice(choice().id);await applied(policyEditor,'Commit Beat');assert.equal(await source(path),mixed);assert.deepEqual(await readFile(mapPath),policyMap);
 policyEditor=await editChoice(choice().id);policyRows=policyEditor.querySelectorAll('.story-option');availability(policyRows[2],true,'showDisabled');await applied(policyEditor,'Commit Beat');
 result.runtime.allUnavailable=await source(path);
 assert(result.runtime.allUnavailable.includes('if ((choice_flag == True)) or ((choice_flag == True)) or ((choice_flag == True)):'));
 // All-disabled and all-hidden variants are both authored with the same controls.
 policyEditor=await editChoice(choice().id);policyRows=policyEditor.querySelectorAll('.story-option');availability(policyRows[0],true,'showDisabled');await applied(policyEditor,'Commit Beat');result.runtime.allDisabled=await source(path);
 policyEditor=await editChoice(choice().id);policyRows=policyEditor.querySelectorAll('.story-option');for(const row of policyRows)availability(row,true,'hide');await applied(policyEditor,'Commit Beat');result.runtime.allHidden=await source(path);
 await applied(document,'Undo');assert.equal(await source(path),result.runtime.allDisabled);await applied(document,'Redo');assert.equal(await source(path),result.runtime.allHidden);
 policyEditor=await editChoice(choice().id);policyRows=policyEditor.querySelectorAll('.story-option');availability(policyRows[1],true,'showDisabled');await applied(policyEditor,'Commit Beat');
 assert.equal(choice().payload.options[1].unavailablePolicy,'showDisabled');
 policyEditor=await editChoice(choice().id);[...policyEditor.querySelectorAll('[role=radiogroup][aria-label="Option 1 if false"] [role=radio]')].find(item=>item.textContent==='Show disabled').click();button('Cancel',policyEditor);
 // Restore the earlier two-option source through accepted history before continuing #101/#103.
 while((await source(path))!==accepted)await applied(document,'Undo');
 stage('production availability controls author mixed, all-disabled and all-hidden menus; inert unknown preview, exact no-op and history pass');



 // Then acts at once on the option's ending beat. Against source that changed underneath, core refuses and nothing is written.
 option(yes.id);await saveSource(path,accepted+'# external accepted change\n');let panel;const staleEnding=await thenOption(yes.id,'return',undefined,false);
 assert.equal(staleEnding.ok,false);assert.equal(staleEnding.error.code,'SOURCE_CONFLICT');assert.equal(await source(path),accepted+'# external accepted change\n');
 stage('a stale option ending refuses and keeps accepted Source');
 button('Close Project');await wait(()=>document.querySelector('.recent-open'));button(document.querySelector('.recent-open').textContent);await wait(()=>document.querySelector('.story-track-column'));await settle();
 assert.deepEqual([choice().id,...choice().payload.options.map(o=>o.id)],ids);assert.equal(await source(path),accepted+'# external accepted change\n');
 // Then Return replaces no earlier Beat. Continue removes only that Return.
 await thenOption(yes.id,'return');
 assert.equal(await source(path),(accepted+'# external accepted change\n').replace('$ choice_flag = True\n','$ choice_flag = True\n            return\n'));result.runtime.return=await source(path);
 await thenOption(yes.id,'continue');assert.equal(await source(path),accepted+'# external accepted change\n');
 await thenOption(yes.id,'jump',target.id);result.runtime.jump=await source(path);await applied(document,'Undo');assert.equal(await source(path),accepted+'# external accepted change\n');stage('reopen preserves identities; Then Return, Jump and Continue preserve the preceding boolean');
 // Empty text is a local validation refusal; caption rename is a minimal patch.
 pick(choice().id);await settle();let editor=editorFor(choice().id).querySelector('.expanded-beat');const text=editor.querySelector('[aria-label="Choice option text"]');enter(text,'');lastApply=undefined;button('Commit Beat',editor);await settle();assert.equal(lastApply,undefined);assert.equal(text.value,'');button('Cancel',editor);
 pick(choice().id);editor=editorFor(choice().id).querySelector('.expanded-beat');enter(editor.querySelector('[aria-label="Choice option text"]'),'Yes, please');await applied(editor,'Commit Beat');assert.equal(await source(path),(accepted+'# external accepted change\n').replace('"Yes" (','"Yes, please" ('));
 stage('invalid caption retained without a write; accepted caption changes only its quoted token');
 const flow=await call('flow.list');const menuEdges=flow.edges.filter(e=>e.kind==='choice'&&e.beatId===choice().id);assert.equal(menuEdges.length,2);assert(menuEdges.every(e=>e.destination.kind==='body'));
 // #102 uses the same production body controls and source/history owner.
 // An option's + Beat opens Add a beat for that option.
 async function addBodyBeat(id,type,fill) {
  button('+ Beat',option(id)); const form=kind(type);assert(form,`Option body must offer ${type}`);
  fill?.(form);await applied(form,'Add Beat');
 }
 await addBodyBeat(yes.id,'narration',form=>enter(form.querySelector('textarea'),'Before call'));
 const beforeInvalidCall=await source(path);
 button('+ Beat',option(yes.id));draft=kind('call');
 enter(draft.querySelector('[aria-label="Call destination Scene"]'),entry.id,'change');lastApply=undefined;button('Add Beat',draft);await wait(()=>lastApply);await settle();
 assert.equal(lastApply.ok,false);assert.equal(lastApply.error.code,'UNSUPPORTED_CALL_ROUTE');assert(draft.isConnected);assert.equal(await source(path),beforeInvalidCall);button('Cancel',draft);assert.equal(await source(path),beforeInvalidCall);
 await addBodyBeat(yes.id,'call',form=>enter(form.querySelector('[aria-label="Call destination Scene"]'),target.id,'change'));
 await addBodyBeat(yes.id,'narration',form=>enter(form.querySelector('textarea'),'Resume inside option'));
 const callBeat=scene().beats.find(b=>b.payload.type==='call');const callLabel=callBeat.payload.returnLabel;
 assert(callLabel?.startsWith('_ll_call_'));
 // Add a beat in an option offers Condition. Its rule starts on the first variable, so choose choice_flag.
 button('+ Beat',option(yes.id));kind('condition');panel=document.querySelector('.story-operation[aria-label="Add Condition"]');conditionRule(panel,'true');
 await applied(panel,'Create Condition');
 const branch=scene().beats.find(b=>b.conditionalBranch&&!b.conditionalBranch.choiceOption);
 button(`Add a beat to ${ifName(branch.id)}`,ifBranch(branch.id));draft=kind('choice');
 enter(draft.querySelector('[aria-label="Choice option text"]'),'Inner normal');button('+ Add option',draft);
 enter(draft.querySelectorAll('[aria-label="Choice option text"]')[1],'Inner jump');button('+ Add option',draft);
 enter(draft.querySelectorAll('[aria-label="Choice option text"]')[2],'Inner return');await applied(draft,'Add Beat');
 const nested=scene().beats.find(b=>b.payload.type==='choice'&&b.owner);
 const [normal,jump,ret]=nested.payload.options;
 await addBodyBeat(normal.id,'narration',form=>enter(form.querySelector('textarea'),'Inside inner'));
 for(const [id,kind] of [[jump.id,'jump'],[ret.id,'return']]) await thenOption(id,kind,target.id);
 await addBodyBeat(yes.id,'narration',form=>enter(form.querySelector('textarea'),'After nested'));
 const recursive=await source(path);result.runtime.recursive=recursive;
 assert.equal(scene().beats.find(b=>b.id===callBeat.id).payload.returnLabel,callLabel);
 const recursiveFlow=await call('flow.list');const callEdge=recursiveFlow.edges.find(e=>e.kind==='call'&&e.beatId===callBeat.id);
 assert.equal(callEdge.continuation.beatId,scene().beats.find(b=>b.payload.text==='Resume inside option').id);
 assert.equal(callEdge.guardPath[0].branchId,yes.id);
 assert(option(normal.id),'The nested Choice shows its own option blocks');
 await applied(document,'Undo');await applied(document,'Redo');assert.equal(await source(path),recursive);
 button('Close Project');await wait(()=>document.querySelector('.recent-open'));button(document.querySelector('.recent-open').textContent);await wait(()=>document.querySelector('.story-track-column'));await settle();
 assert.equal(await source(path),recursive);assert.equal(scene().beats.find(b=>b.id===callBeat.id).payload.returnLabel,callLabel);
 stage('recursive production controls author dialogue, stable Call, condition and nested Choice with normal/Jump/Return paths; history and reopen preserve source');

 promptEditor=await editChoice(choice().id);button('Add a prompt shown with the options',promptEditor);enter(promptEditor.querySelector('[aria-label="Prompt text"]'),'Choose a route');await applied(promptEditor,'Commit Beat');
 promptEditor=await editChoice(nested.id);button('Add a prompt shown with the options',promptEditor);promptSpeaker(promptEditor,speaker);enter(promptEditor.querySelector('[aria-label="Prompt text"]'),'Inside, which route?');await applied(promptEditor,'Commit Beat');
 const recursivePrompt=await source(path);result.runtime.recursivePrompt=recursivePrompt;
 const outerHeader=recursive.split('\n').find(l=>l.startsWith('    menu '))+'\n',innerHeader=recursive.split('\n').find(l=>l.startsWith('                menu '))+'\n';assert.equal(recursivePrompt,recursive.replace(outerHeader,outerHeader+'        "Choose a route"\n').replace(innerHeader,innerHeader+`                    ${speaker.technicalName} "Inside, which route?"\n`));
 const nestedNow=scene().beats.find(b=>b.id===nested.id);assert.equal(nestedNow.payload.prompt.characterId,speaker.id);assert.deepEqual(nestedNow.payload.options,nested.payload.options);
 button('Close Project');await wait(()=>document.querySelector('.recent-open'));button(document.querySelector('.recent-open').textContent);await wait(()=>document.querySelector('.story-track-column'));await settle();assert.equal(await source(path),recursivePrompt);
 // Ordinary external filesystem conflict must retain the original prompt draft.
 promptEditor=await editChoice(choice().id);enter(promptEditor.querySelector('[aria-label="Prompt text"]'),'Retained prompt after conflict');
 await appendFile(join(scratch,'synthetic-project',path),'# ordinary external writer\r\n');
 const external=await readFile(join(scratch,'synthetic-project',path));const externalMap=await readFile(mapPath);
 lastApply=undefined;button('Commit Beat',promptEditor);await wait(()=>lastApply);await settle();assert.equal(lastApply.ok,false);assert.equal(lastApply.error.code,'SOURCE_CONFLICT');assert.equal(promptEditor.querySelector('[aria-label="Prompt text"]').value,'Retained prompt after conflict');assert(promptEditor.isConnected);assert.deepEqual(await readFile(join(scratch,'synthetic-project',path)),external);assert.deepEqual(await readFile(mapPath),externalMap);button('Cancel',promptEditor);
 button('Close Project');await wait(()=>document.querySelector('.recent-open'));button(document.querySelector('.recent-open').textContent);await wait(()=>document.querySelector('.story-track-column'));await settle();assert.equal(await source(path),external.toString('utf8').replace(/^\uFEFF/,''));
 stage('nested prompt preserves recursive Call and option ownership; reopen and ordinary external conflict retain exact source and drafts');
 // #105 authors the conversation and its endings through the production controls.
 await call('variable.create',{technicalName:'choice_visits',variableType:'int',defaultValue:0});
 await saveSource(path,`label ${entry.technicalLabel}:\n    "Shared once"\n    return\n`);
 button('Close Project');await wait(()=>document.querySelector('.recent-open'));button(document.querySelector('.recent-open').textContent);await wait(()=>document.querySelector('.story-track-column'));await settle();
 draft=addBeat('setVariable');await placeBefore(draft,scene().beats.find(b=>b.payload.text==='Shared once').id);enter(draft.querySelector('[aria-label="Variable"]'),workspace.authoring.variables.find(v=>v.technicalName==='choice_visits').id,'change');enter(draft.querySelector('[aria-label="Formula"]'),'choice_visits + 1');await applied(draft,'Add Beat');
 draft=addBeat('choice');await placeBefore(draft,scene().beats.find(b=>b.payload.text==='Shared once').id);
 enter(draft.querySelector('[aria-label="Choice option text"]'),'Ask about the station');button('+ Add option',draft);enter(draft.querySelectorAll('[aria-label="Choice option text"]')[1],'Ask about the ticket');button('+ Add option',draft);enter(draft.querySelectorAll('[aria-label="Choice option text"]')[2],'Leave');await applied(draft,'Add Beat');
 const conversationId=choice().id,[station,ticket,leave]=choice().payload.options;
 promptEditor=await editChoice(conversationId);button('Add a prompt shown with the options',promptEditor);enter(promptEditor.querySelector('[aria-label="Prompt text"]'),'What would you like to ask?');availability(promptEditor.querySelectorAll('.story-option')[1],true,'showDisabled');await applied(promptEditor,'Commit Beat');
 await addBodyBeat(station.id,'narration',form=>enter(form.querySelector('textarea'),'Station answer'));
 await addBodyBeat(station.id,'call',form=>enter(form.querySelector('[aria-label="Call destination Scene"]'),target.id,'change'));
 await addBodyBeat(station.id,'narration',form=>enter(form.querySelector('textarea'),'Station call resumed'));
 await addBodyBeat(station.id,'setVariable',form=>{enter(form.querySelector('[aria-label="Variable"]'),flagId,'change');enter(form.querySelector('[aria-label="Value"]'),'true','change');});
 await addBodyBeat(ticket.id,'narration',form=>enter(form.querySelector('textarea'),'Ticket answer'));
 const beforeRepeat=await source(path),beforeRepeatMap=await readFile(mapPath);
 // The Then menu offers Repeat this Choice; Escape closes it without a change.
 {const block=option(station.id);block.querySelector('.story-outcome > summary').click();const list=block.querySelector('.story-outcome [role=listbox]');assert([...list.querySelectorAll('[role=option]')].some(o=>o.getAttribute('aria-label').startsWith('Repeat this Choice.')));
  list.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(block.querySelector('.story-outcome').open,false);await settle();assert.equal(await source(path),beforeRepeat);assert.deepEqual(await readFile(mapPath),beforeRepeatMap);}
 await thenOption(station.id,'repeatChoice');const oneRepeat=await source(path);assert.equal((oneRepeat.match(/label _ll_choice_/g)??[]).length,1);assert(oneRepeat.includes('"Station call resumed"\n            $ choice_flag = True\n            jump _ll_choice_'));
 assert.equal(choice().id,conversationId);assert.deepEqual(choice().payload.options.map(o=>o.id),[station.id,ticket.id,leave.id]);
 const repeatMap=await readFile(mapPath);await thenOption(station.id,'repeatChoice');assert.equal(await source(path),oneRepeat);assert.deepEqual(await readFile(mapPath),repeatMap);
 await applied(document,'Undo');assert.equal(await source(path),beforeRepeat);await applied(document,'Redo');assert.equal(await source(path),oneRepeat);
 staleSession=true;const staleRepeat=await thenOption(ticket.id,'repeatChoice',undefined,false);staleSession=false;assert.equal(staleRepeat.ok,false);assert.equal(await source(path),oneRepeat);
 await thenOption(ticket.id,'repeatChoice');result.runtime.repeatConversation=await source(path);assert.equal((result.runtime.repeatConversation.match(/label _ll_choice_/g)??[]).length,1);
 await thenOption(station.id,'continue');assert((await source(path)).includes('"Station call resumed"\n            $ choice_flag = True\n'));await applied(document,'Undo');assert.equal(await source(path),result.runtime.repeatConversation);
 const repeatFlow=await call('flow.list');assert.equal(repeatFlow.edges.filter(e=>e.kind==='repeat'&&e.destination.beatId===conversationId).length,2);
 // No selectable options after Repeat must traverse the same aggregate gate.
 promptEditor=await editChoice(conversationId);for(const row of promptEditor.querySelectorAll('.story-option')){availability(row,true,'showDisabled','false');}await applied(promptEditor,'Commit Beat');result.runtime.repeatExhausted=await source(path);
 await applied(document,'Undo');assert.equal(await source(path),result.runtime.repeatConversation);
 // A Choice nested in a condition inside another option owns its own target.
 promptEditor=await editChoice(conversationId);button('+ Add option',promptEditor);enter(promptEditor.querySelectorAll('[aria-label="Choice option text"]')[3],'Nested conversation');await applied(promptEditor,'Commit Beat');
 const nestedOuter=choice().payload.options[3];button('+ Beat',option(nestedOuter.id));kind('condition');panel=document.querySelector('.story-operation[aria-label="Add Condition"]');conditionRule(panel,'false');await applied(panel,'Create Condition');
 const repeatBranch=scene().beats.find(b=>b.conditionalBranch&&!b.conditionalBranch.choiceOption);button(`Add a beat to ${ifName(repeatBranch.id)}`,ifBranch(repeatBranch.id));draft=kind('choice');enter(draft.querySelector('[aria-label="Choice option text"]'),'Inner ask');button('+ Add option',draft);enter(draft.querySelectorAll('[aria-label="Choice option text"]')[1],'Inner leave');await applied(draft,'Add Beat');
 const repeatInner=scene().beats.find(b=>b.payload.type==='choice'&&b.owner),innerAsk=repeatInner.payload.options[0];promptEditor=await editChoice(repeatInner.id);button('Add a prompt shown with the options',promptEditor);promptSpeaker(promptEditor,speaker);enter(promptEditor.querySelector('[aria-label="Prompt text"]'),'Inside, ask again?');await applied(promptEditor,'Commit Beat');
 await addBodyBeat(innerAsk.id,'narration',form=>enter(form.querySelector('textarea'),'Inner answer'));await thenOption(innerAsk.id,'repeatChoice');await addBodyBeat(nestedOuter.id,'narration',form=>enter(form.querySelector('textarea'),'Outer resumed'));result.runtime.repeatNested=await source(path);
 assert.equal((result.runtime.repeatNested.match(/label _ll_choice_/g)??[]).length,2);const innerRepeat=scene().beats.find(b=>b.payload.type==='repeatChoice'&&b.owner?.branchId===innerAsk.id);assert(innerRepeat);assert((await call('flow.list')).edges.some(e=>e.kind==='repeat'&&e.beatId===innerRepeat.id&&e.destination.beatId===repeatInner.id));
 const allRepeatIds=scene().beats.map(b=>b.id);button('Close Project');await wait(()=>document.querySelector('.recent-open'));button(document.querySelector('.recent-open').textContent);await wait(()=>document.querySelector('.story-track-column'));await settle();assert.deepEqual(scene().beats.map(b=>b.id),allRepeatIds);assert.equal(await source(path),result.runtime.repeatNested);
 stage('production Repeat preserves preceding Beats and Call, shares one target per Choice, supports no-op/cancel/history/reopen, and exports prompted nested and availability-changing runtime sources');
 // #106 uses the approved whole-Choice selector through the actual editor.
 promptEditor=await editChoice(conversationId);
 pickedMode(promptEditor,'markPicked');await applied(promptEditor,'Commit Beat');
 result.runtime.pickedRepeat=await source(path);
 result.runtime.pickedAdapter=await source('game/loomlight_choice_v1.rpy');
 assert.equal(choice().payload.pickedPolicy,'markPicked');
 assert.deepEqual(choice().payload.options.map(o=>o.id),[station.id,ticket.id,leave.id,nestedOuter.id]);
 await applied(document,'Undo');assert.equal(await source(path),result.runtime.repeatNested);
 await applied(document,'Redo');assert.equal(await source(path),result.runtime.pickedRepeat);
 stage('production Picked options controls accept current-save history through the shared transaction');

 // Hide picked must win when a picked Repeat answer becomes disabled.
 promptEditor=await editChoice(conversationId);pickedMode(promptEditor,'hidePicked');availability(promptEditor.querySelectorAll('.story-option')[0],true,'showDisabled','false');await applied(promptEditor,'Commit Beat');result.runtime.pickedRepeatHide=await source(path);
 // Independent Scene reentry fixtures. Only the exported accepted bytes reach the SDK.
 await saveSource(path,`label ${entry.technicalLabel}:\n    "Shared once"\n    return\n`);
 await saveSource(target.sourcePath,`label ${target.technicalLabel}:\n    "Reenter Choice"\n    jump ${entry.technicalLabel}\n`);
 result.runtime.pickedTarget=await source(target.sourcePath);
 button('Close Project');await wait(()=>document.querySelector('.recent-open'));button(document.querySelector('.recent-open').textContent);await wait(()=>document.querySelector('.story-track-column'));await settle();
 draft=addBeat('choice');await placeBefore(draft,scene().beats.find(b=>b.payload.text==='Shared once').id);
 enter(draft.querySelector('[aria-label="Choice option text"]'),'Same');button('+ Add option',draft);enter(draft.querySelectorAll('[aria-label="Choice option text"]')[1],'Same');button('+ Add option',draft);enter(draft.querySelectorAll('[aria-label="Choice option text"]')[2],'Locked');
 pickedMode(draft,'showNormally');availability(draft.querySelectorAll('.story-option')[2],true,'showDisabled');await applied(draft,'Add Beat');
 const pickedId=choice().id,[firstPick,secondPick,lockedPick]=choice().payload.options;
 for(const id of [firstPick.id,secondPick.id])await thenOption(id,'jump',target.id);
 promptEditor=await editChoice(pickedId);button('Add a prompt shown with the options',promptEditor);enter(promptEditor.querySelector('[aria-label="Prompt text"]'),'Choose independently');await applied(promptEditor,'Commit Beat');
 result.runtime.pickedShow=await source(path);
 promptEditor=await editChoice(pickedId);pickedMode(promptEditor,'markPicked');await applied(promptEditor,'Commit Beat');result.runtime.pickedMark=await source(path);
 assert.deepEqual([...document.querySelectorAll('.preview-canvas .story-game-choice')].map(item=>item.dataset.state),['available','available','unknown'],'without Preview options nothing is marked picked');
 const pickedMap=await readFile(mapPath);promptEditor=await editChoice(pickedId);await applied(promptEditor,'Commit Beat');assert.equal(await source(path),result.runtime.pickedMark);assert.deepEqual(await readFile(mapPath),pickedMap);
 promptEditor=await editChoice(pickedId);pickedMode(promptEditor,'hidePicked');button('Cancel',promptEditor);assert.equal(await source(path),result.runtime.pickedMark);
 promptEditor=await editChoice(pickedId);pickedMode(promptEditor,'hidePicked');await applied(promptEditor,'Commit Beat');result.runtime.pickedHide=await source(path);
 await applied(document,'Undo');assert.equal(await source(path),result.runtime.pickedMark);await applied(document,'Redo');assert.equal(await source(path),result.runtime.pickedHide);
 result.runtime.pickedIdentities={choice:pickedId,options:[firstPick.id,secondPick.id,lockedPick.id]};
 // Rename/reorder preserves keys. A newly added identical caption gets a fresh key.
 promptEditor=await editChoice(pickedId);button('Move option 1 down',promptEditor.querySelectorAll('.story-option')[0]);enter(promptEditor.querySelectorAll('.story-option')[0].querySelector('[aria-label="Choice option text"]'),'Renamed');button('+ Add option',promptEditor);enter(promptEditor.querySelectorAll('.story-option')[3].querySelector('[aria-label="Choice option text"]'),'Same');await applied(promptEditor,'Commit Beat');
 assert.equal(choice().payload.options[0].id,secondPick.id);assert.equal(choice().payload.options[1].id,firstPick.id);assert(![firstPick.id,secondPick.id,lockedPick.id].includes(choice().payload.options[3].id));
 await applied(document,'Undo');assert.equal(await source(path),result.runtime.pickedHide);
 button('Close Project');await wait(()=>document.querySelector('.recent-open'));button(document.querySelector('.recent-open').textContent);await wait(()=>document.querySelector('.story-track-column'));await settle();assert.equal(await source(path),result.runtime.pickedHide);assert.equal(choice().id,pickedId);
 // Retain the whole Choice draft on invalid text, stale session and external conflict.
 promptEditor=await editChoice(pickedId);pickedMode(promptEditor,'markPicked');enter(promptEditor.querySelector('[aria-label="Choice option text"]'),'');lastApply=undefined;button('Commit Beat',promptEditor);await settle();assert.equal(lastApply,undefined);assert.equal(promptEditor.querySelector('select[aria-label="Picked options"]').value,'markPicked');button('Cancel',promptEditor);
 promptEditor=await editChoice(pickedId);pickedMode(promptEditor,'markPicked');staleSession=true;lastApply=undefined;button('Commit Beat',promptEditor);await wait(()=>lastApply);await settle();staleSession=false;assert.equal(lastApply.ok,false);assert(promptEditor.isConnected);assert.equal(promptEditor.querySelector('select[aria-label="Picked options"]').value,'markPicked');assert.equal(await source(path),result.runtime.pickedHide);button('Cancel',promptEditor);
 // Immediate Return and immediate Repeat are accepted through the same Then controls.
 await thenOption(firstPick.id,'return');result.runtime.pickedReturn=await source(path);await applied(document,'Undo');
 await thenOption(firstPick.id,'repeatChoice');result.runtime.pickedImmediateRepeat=await source(path);await applied(document,'Undo');assert.equal(await source(path),result.runtime.pickedHide);
 // A separate Choice with identical captions must have independent history.
 draft=addBeat('choice');await placeBefore(draft,scene().beats.find(b=>b.payload.text==='Shared once').id);enter(draft.querySelector('[aria-label="Choice option text"]'),'Same');button('+ Add option',draft);enter(draft.querySelectorAll('[aria-label="Choice option text"]')[1],'Same');pickedMode(draft,'markPicked');await applied(draft,'Add Beat');
 const secondChoice=scene().beats.find(b=>b.payload.type==='choice'&&b.id!==pickedId);result.runtime.pickedInstanceIdentities={choice:secondChoice.id,options:secondChoice.payload.options.map(o=>o.id)};assert(![pickedId,firstPick.id,secondPick.id].includes(secondChoice.id));result.runtime.pickedInstances=await source(path);
 await applied(document,'Undo');assert.equal(await source(path),result.runtime.pickedHide);
 // Exhaustion makes the shared continuation reachable even when every option transfers.
 promptEditor=await editChoice(pickedId);button('Remove option 3',promptEditor.querySelectorAll('.story-option')[2]);await applied(promptEditor,'Commit Beat');
 const transferOnly=await source(path),sharedAnchor=scene().beats.find(b=>b.payload.text==='Shared once'),finalReturn=scene().beats.at(-1);
 for(const anchor of [sharedAnchor,finalReturn]){
  // Add a beat starts before the scene's Return; Move to lists every scene place.
  draft=addBeat('narration');assert.equal(draft.querySelector('.story-where dd').textContent,`Before ${beatNumber(finalReturn.id)} Return`);
  {const tree=placeTree(draft);assert.deepEqual(positionsIn(tree),[`Before ${beatNumber(pickedId)} Choice`,`Before ${beatNumber(sharedAnchor.id)} Narration`,`Before ${beatNumber(finalReturn.id)} Return`]);tree.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));}
  await placeBefore(draft,anchor.id);enter(draft.querySelector('textarea'),'Exhaustion insertion');await applied(draft,'Add Beat');
  const inserted=scene().beats.find(b=>b.payload.text==='Exhaustion insertion');assert(inserted&&!inserted.owner);assert.equal(lastApply.ok,true);
  assert.deepEqual(result.transcript.filter(t=>t.request.operation==='scene.apply').at(-1).request.payload.command.position,{type:'before',anchor:{type:'beat',beatId:anchor.id}});
  await applied(document,'Undo');assert.equal(await source(path),transferOnly);
 }
 await addBodyBeat(firstPick.id,'choice',form=>{enter(form.querySelector('[aria-label="Choice option text"]'),'Nested leave');pickedMode(form,'hidePicked');});
 const exhaustionInner=scene().beats.find(b=>b.payload.type==='choice'&&b.owner?.branchId===firstPick.id);
 await thenOption(exhaustionInner.payload.options[0].id,'return');
 const nestedBefore=await source(path),sharedJump=scene().beats.find(b=>b.payload.type==='jump'&&b.owner?.branchId===firstPick.id);
 button('+ Beat',option(firstPick.id));draft=kind('narration');
 {const tree=placeTree(draft);assert.deepEqual(positionsIn(tree),[`Before ${beatNumber(exhaustionInner.id)} Choice`,`Before ${beatNumber(sharedJump.id)} Jump`]);tree.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));}
 await placeBefore(draft,sharedJump.id);enter(draft.querySelector('textarea'),'Nested exhaustion insertion');await applied(draft,'Add Beat');
 const nestedInserted=scene().beats.find(b=>b.payload.text==='Nested exhaustion insertion');assert.equal(nestedInserted.owner.branchId,firstPick.id);assert.equal(lastApply.ok,true);
 await applied(document,'Undo');assert.equal(await source(path),nestedBefore);
 await applied(document,'Undo');await applied(document,'Undo');assert.equal(await source(path),transferOnly);
 await applied(document,'Undo');assert.equal(await source(path),result.runtime.pickedHide);
 stage('Hide picked exposes shared Beat/final Return and nested continuation positions through actual controls and public dispatch');
 promptEditor=await editChoice(pickedId);pickedMode(promptEditor,'markPicked');await appendFile(join(scratch,'synthetic-project',path),'# picked external writer\n');const pickedExternal=await readFile(join(scratch,'synthetic-project',path));lastApply=undefined;button('Commit Beat',promptEditor);await wait(()=>lastApply);await settle();assert.equal(lastApply.ok,false);assert.equal(lastApply.error.code,'SOURCE_CONFLICT');assert(promptEditor.isConnected);assert.equal(promptEditor.querySelector('select[aria-label="Picked options"]').value,'markPicked');assert.deepEqual(await readFile(join(scratch,'synthetic-project',path)),pickedExternal);button('Cancel',promptEditor);
 stage('independent Scene routes export all three picked policies, duplicate-caption identities, immediate Jumps, inert preview, Cancel/no-op/history and reopen');
 // Core bodies drive the Then ending states and every place list (#144). The condition
 // is the issue's example: Custom Code before Return does not hide the ending.
 const bodiesBefore=await source(path);
 const bodiesSource=`label ${entry.technicalLabel}:\n    menu:\n        "Coded":\n            "Before code"\n            return "good"\n        "Unknown":\n            "Before unknown"\n            $ renpy.jump("elsewhere")\n    if choice_flag:\n        $ seen = True\n        return\n    else:\n        return\n`;
 const reopen=async()=>{button('Close Project');await wait(()=>document.querySelector('.recent-open'));button(document.querySelector('.recent-open').textContent);await wait(()=>document.querySelector('.story-track-column'));await settle();};
 await saveSource(path,bodiesSource);await reopen();
 const endingMenu=choice(),[coded,unknownOption]=endingMenu.payload.options,bodyOf=id=>scene().bodies.find(b=>b.body.branchId===id);
 const codeEnding=scene().beats.find(b=>b.payload.source?.trim()==='return "good"');
 assert.deepEqual(bodyOf(coded.id).ending,{type:'ends',beatId:codeEnding.id});assert.equal(bodyOf(unknownOption.id).ending.type,'unknown');
 // story-combined-editor / replace-v2: Custom Code that ends an option takes the Then menu's place.
 let block=option(coded.id);const then=block.querySelector('.story-then');
 assert(then.classList.contains('story-then-replaced'));assert.equal(block.querySelector('.story-outcome'),null,'no Then menu when Custom Code ends the option');
 assert.equal(then.querySelector('.story-ending').textContent,'Ends with Custom Code: return "good"');assert(!then.textContent.includes('Continue after the Choice'));
 assert([...then.querySelectorAll('button')].some(b=>b.textContent==='Edit in Source'&&!b.disabled));
 // + Beat goes before the ending: no place before Custom Code or after the ending.
 button('+ Beat',block);draft=kind('narration');
 {const tree=placeTree(draft);assert.deepEqual(positionsIn(tree),[`Before ${beatNumber(scene().beats.find(b=>b.payload.text==='Before code').id)} Narration`],'no place before Custom Code or after the ending');tree.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));}
 button('Cancel',draft);
 // Ending unknown sits on the Custom Code beat that causes it; Then stays editable.
 block=option(unknownOption.id);assert.equal(block.querySelector('.story-beat-note').textContent,'Ending unknown: Custom Code can leave this option');
 assert.equal(block.querySelector('.story-outcome > summary').getAttribute('aria-label'),'Option 2 then: Continue after the Choice');
 await thenOption(unknownOption.id,'return');
 assert.equal(await source(path),bodiesSource.replace('$ renpy.jump("elsewhere")\n','$ renpy.jump("elsewhere")\n            return\n'));await applied(document,'Undo');assert.equal(await source(path),bodiesSource);
 const conditionHeader=scene().beats.find(b=>b.conditionalBranch&&!b.owner&&!b.conditionalBranch.choiceOption&&!b.conditionalBranch.ordinal&&!b.conditionalBranch.otherwise);
 draft=addBeat('narration');assert.equal(draft.querySelector('.story-where dd').textContent,`Before ${beatNumber(conditionHeader.id)} Condition`,'the default place is before the ending condition');
 {const tree=placeTree(draft);const places=positionsIn(tree);assert.deepEqual(places,[`Before ${beatNumber(endingMenu.id)} Choice`,`Before ${beatNumber(conditionHeader.id)} Condition`]);assert(!places.some(label=>label.startsWith('End of')),'the condition ends the scene');tree.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));}
 button('Cancel',draft);
 assert.equal([...pick(endingMenu.id).querySelectorAll('.story-beat-menu button')].find(item=>item.textContent==='Move down').disabled,true,'Move down cannot pass the ending condition');
 const otherwiseHeader=scene().beats.find(b=>b.conditionalBranch?.otherwise),otherwiseReturn=scene().beats.find(b=>b.payload.type==='return'&&b.owner?.branchId===otherwiseHeader.id);
 button('Delete',pick(otherwiseReturn.id).querySelector('.story-beat-menu'));panel=document.querySelector('.story-operation[aria-label="Delete Beat"]');
 lastApply=undefined;button('Delete this Beat',panel);await wait(()=>lastApply);await settle();
 assert.equal(lastApply.ok,false);assert.equal(lastApply.error.code,'SCENE_INVARIANT');assert.equal(await source(path),bodiesSource);assert(panel.isConnected);button('Cancel',panel);
 stage('core bodies drive Then for Custom Code and unknown endings, the place lists and Move down, and refuse a new fallthrough');
 await saveSource(path,bodiesBefore);await reopen();assert.equal(await source(path),bodiesBefore);
 result.acceptedSource=await source(path);result.sourceSHA256=hash(result.acceptedSource);result.identities=ids;
 button('Close Project');await wait(()=>document.querySelector('.recent-open'));result.passed=true;
} catch(error){result.failure={message:error.message,stack:error.stack};result.dom=document.body.innerHTML;throw error;}
finally{await browser.happyDOM.close();try{await child.stop();result.driver=child.exitStatus();await assert.rejects(access(scratch));result.cleanupComplete=true;}finally{await writeFile(join(output,'result.json'),JSON.stringify(result,null,2)+'\n');}}
console.log('PASS actual production Story/main to core Choice body journey. Happy DOM input, no SDK/native claim.');
