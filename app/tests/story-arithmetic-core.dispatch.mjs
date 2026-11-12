// Actual production main/Story controls -> ApplicationHost -> source/history/reopen.
// Happy DOM supplies input events. No SDK, package, native WebView or physical-input claim.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,appendFile,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {Window} from 'happy-dom';
import {driverProcess} from './phase2-driver-process.mjs';
import {createRequest,isCoreResponse} from '../dist-tests/src/protocol.js';
const output=resolve(process.env.STORY_ARITHMETIC_OUTPUT??`../.toolchains/arithmetic-96/journey-${randomUUID()}`);await mkdir(output,{recursive:true});
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
  if(ui&&['scene.apply','history.undo','history.redo'].includes(operation)){assert(lastEvent?.connected,'Story mutation must originate at connected production controls');lastApply=response;}
  if(ui&&operation==='scene.validateAssignment')lastValidation=response;
  if(response.ok&&operation==='project.openRecent')session=response.value.sessionId;
  if(response.ok&&['scene.list','scene.apply'].includes(operation))workspace=response.value;
  return response;
 }finally{inflight--;}
}
const call=async(operation,payload={})=>{const r=await request(operation,{...payload,...(session&&!['project.listRecent','project.openRecent'].includes(operation)?{sessionId:session}:{})});if(!r.ok)throw Object.assign(Error(r.error.message),r.error);return r.value;};
const requester=(operation,payload)=>request(operation,staleSession&&operation==='scene.apply'?{...payload,sessionId:'stale-session'}:payload,true);
const wait=async check=>{const until=Date.now()+8000;while(!await check()){assert(Date.now()<until,'Story arithmetic deadline exceeded');await new Promise(r=>setTimeout(r,10));}};
const settle=async()=>{await new Promise(r=>setTimeout(r,150));await wait(()=>inflight===0);};
// The header Undo and Redo: icon buttons with no text, enabled once the next entry is known.
async function historyStep(direction){await wait(()=>document.querySelector(`.app-header [data-history="${direction}"]:not([aria-disabled="true"])`));lastApply=undefined;document.querySelector(`.app-header [data-history="${direction}"]`).click();await wait(()=>lastApply);await settle();return lastApply;}
const button=(text,scope=document)=>{const b=[...scope.querySelectorAll('button')].find(b=>(b.textContent===text||b.getAttribute('aria-label')===text)&&!b.disabled);assert(b,`Missing enabled ${text}`);b.click();return b;};
const enter=(node,text,event='input')=>{assert(node?.isConnected&&!node.disabled);node.focus();node.value=text;node.dispatchEvent(new Event(event,{bubbles:true}));};
const source=async path=>(await call('source.open',{path})).text;
async function saveSource(path,text){const base=await call('source.open',{path});const draft=await call('source.updateDraft',{path,expectedBaseRevision:base.baseRevision,text,selectionStart:0,selectionEnd:0});await call('source.save',{path,expectedBaseRevision:draft.baseRevision,expectedDraftVersion:draft.draftVersion});}
const selected=()=>document.querySelector('.beat-card.selected');
async function selectBeat(id){document.querySelector(`[data-beat-id="${id}"] .beat-select`).click();await settle();assert(selected()?.dataset.beatId===id);}
const formula=()=>selected().querySelector('[aria-label="Formula"]');
async function commit(){lastApply=undefined;button('Commit Beat',selected());await wait(()=>lastApply);await settle();return lastApply;}
try{
 assert.equal((await child.next()).ready,true);const recent=(await call('project.listRecent'))[0];const opened=await call('project.openRecent',{recentId:recent.id});
 for(const [technicalName,variableType,defaultValue] of [['trust','int','99'],['bonus','int','7'],['money','decimal',99.5],['arith_flag','bool',false],['arith_title','string','literal']])await call('variable.create',{technicalName,variableType,defaultValue});
 const initial=await call('scene.list'),entry=initial.scenes.find(s=>s.id===initial.entrySceneId);const path=entry.sourcePath;
 const fixture=(await readFile(new URL('../../tests/fixtures/arithmetic-96/story.rpy',import.meta.url),'utf8')).replace('ENTRY_LABEL',entry.technicalLabel).replace('    $ money = 9.5','    $ money = -0.0\n    $ money = 1.0\n    $ money = 9.5');
 await saveSource(path,fixture);await call('project.close');session=undefined;
 document.body.innerHTML='<div id="app"></div>';const {startApplication}=await import('../dist-tests/src/main.js');startApplication(requester);
 await wait(()=>document.querySelector('.recent-open')&&!document.querySelector('.recent-open').disabled);document.querySelector('.recent-open').click();await wait(()=>document.querySelector('.beat-card'));await settle();
 assert.equal(await source(path),fixture,'opening imported arithmetic preserves exact source');
 const scene=()=>workspace.scenes.find(s=>s.id===entry.id),numeric=()=>scene().beats.filter(b=>b.payload.type==='setVariable');
 const signedZero=numeric().find(b=>b.payload.value==='-0.0');assert(signedZero);await selectBeat(signedZero.id);assert.equal(formula().value,'-0.0');assert.equal((await commit()).ok,true);assert.equal(await source(path),fixture);assert.equal((await call('history.state')).undo,null);
 const literal=numeric().find(b=>b.payload.value===1);assert(literal);
 await selectBeat(literal.id);assert.equal(formula().value,'1');assert.equal((await call('history.state')).undo,null);
 assert.equal((await commit()).ok,true);assert.equal(await source(path),fixture,'unchanged decimal literal preserves bytes');assert.equal((await call('history.state')).undo,null,'unchanged decimal literal adds no history');
 stage('unchanged decimal literal commits through actual Story controls without source or history changes');
 const compound=numeric().find(b=>b.payload.value?.operation==='add'),decimal=numeric().find(b=>b.payload.value?.operand==='money / 2');assert(compound&&decimal);
 await selectBeat(compound.id);assert.equal(formula().value,'(bonus + 2) * 3');assert.match(selected().textContent,/Current value unknown/);assert(!selected().textContent.includes('Draft result 99'));assert.match(selected().querySelector('.beat-summary').textContent,/trust/);
 assert.equal(lastValidation.ok,true);assert.equal(lastValidation.value.assignment.inferredResultType,'int');assert.equal(lastValidation.value.assignment.state.status,'unknown');
 const noOp=await source(path);assert.equal((await commit()).ok,true);assert.equal(await source(path),noOp,'no-op import preserves original compound/comments');
 stage('editable imported compound and explicit formulas; unknown draft state from core; open and semantic no-op bytes preserved');
 await selectBeat(compound.id);enter(formula(),'(9007199254740993 // 3) % 5');
 assert.equal((await commit()).ok,true);const whole=await source(path);assert(whole.includes('$ trust += (9007199254740993 // 3) % 5  # imported compound'));
 const acceptedWhole=numeric().find(b=>b.id===compound.id);assert.equal(acceptedWhole.assignment.inferredResultType,'int');assert.equal(acceptedWhole.assignment.state.value,'6');
 assert.equal((await historyStep('undo')).ok,true);assert.equal(await source(path),noOp);assert.equal((await historyStep('redo')).ok,true);assert.equal(await source(path),whole);
 stage('whole formula accepted; exact i64 transport, one-step shared Undo and Redo');
 await selectBeat(decimal.id);assert.equal(formula().value,'money / 2');enter(formula(),'(9.5 + 0.5) / 4');
 assert.equal((await commit()).ok,true);const accepted=await source(path);assert(accepted.includes('$ money = (9.5 + 0.5) / 4  # imported explicit'));
 assert.equal(numeric().find(b=>b.id===decimal.id).assignment.state.value,2.5);
 assert.equal((await historyStep('undo')).ok,true);assert.equal(await source(path),whole);assert.equal((await historyStep('redo')).ok,true);assert.equal(await source(path),accepted);
 stage('decimal grouped formula accepted as actual finite JSON number; exact one-step shared Undo/Redo');
 await selectBeat(compound.id);enter(formula(),'1 // 0');formula().dispatchEvent(new Event('blur'));await settle();assert.equal(formula().getAttribute('aria-invalid'),'true');assert.match(selected().textContent,/divides by zero/);assert.equal((await commit()).ok,false);assert.equal(lastApply.error.code,'ARITHMETIC_ZERO_DIVISOR');assert.equal(formula().value,'1 // 0');assert.equal(await source(path),accepted);
 enter(formula(),'4 / 2');await settle();assert.match(selected().textContent,/gives a decimal/);assert.equal((await commit()).ok,false);assert.equal(lastApply.error.code,'ARITHMETIC_TARGET_TYPE');assert.equal(formula().value,'4 / 2');button('Cancel',selected());await settle();
 stage('invalid and incompatible formulas retain exact input, field diagnostics and accepted source');
 await selectBeat(compound.id);enter(formula(),'bon');await settle();const input=formula();input.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true}));assert.equal(input.value,'bonus');assert(document.activeElement===input,"Suggestion must retain input focus");
 enter(input,'(bonus + 3) * 2');button('Writing focus');assert(formula()===input,"Writing focus must retain the same formula control");assert.equal(input.value,'(bonus + 3) * 2');button('Exit Writing focus');assert(formula()===input,"Writing focus must retain the same formula control");button('Cancel',selected());await settle();assert.equal(await source(path),accepted);
 const protectedBeat=scene().beats.find(b=>b.payload.type==='customCode'&&b.payload.source.includes('max('));assert(protectedBeat?.protected);await selectBeat(protectedBeat.id);assert.match(selected().textContent,/unsupported|protected|function/i);button('View in Source',selected());await wait(()=>document.querySelector('.source-editor'));assert(document.querySelector('.source-editor').value.includes('max(0, trust - 1)'));
 button('Story');await wait(()=>document.querySelector('.beat-card'));await settle();
 stage('keyboard numeric suggestions, focus and Writing focus retain draft; Cancel writes nothing; protected import navigates to real Source');
 await selectBeat(compound.id);enter(formula(),'bonus + 8');staleSession=true;assert.equal((await commit()).ok,false);staleSession=false;assert.equal(lastApply.error.code,'STALE_PROJECT_SESSION');assert.equal(formula().value,'bonus + 8');button('Cancel',selected());await settle();
 // Retain an unfinished Source buffer through the real public owner, then refuse the Story draft.
 const openedSource=await call('source.open',{path});await call('source.updateDraft',{path,expectedBaseRevision:openedSource.baseRevision,text:openedSource.text+'# unfinished source\n',selectionStart:0,selectionEnd:0});
 await selectBeat(compound.id);enter(formula(),'bonus + 9');assert.equal((await commit()).ok,false);assert.equal(lastApply.error.code,'DIRTY_SOURCE');assert.equal(formula().value,'bonus + 9');button('Cancel',selected());await settle();await call('source.discard',{path});
 await selectBeat(compound.id);enter(formula(),'bonus + 10');await saveSource(path,accepted+'# competing accepted Source\n');assert.equal((await commit()).ok,false);assert.equal(formula().value,'bonus + 10');assert.equal(await source(path),accepted+'# competing accepted Source\n');button('Cancel',selected());await settle();
 stage('ordinary session, dirty Source and stale revision refusals retain Story drafts and accepted source');
 button('Close Project');await wait(()=>document.querySelector('.recent-open'));document.querySelector('.recent-open').click();await wait(()=>document.querySelector('.beat-card'));await settle();assert.equal(await source(path),accepted+'# competing accepted Source\n');assert.equal((await call('history.state')).undo,null);assert.equal((await call('history.state')).redo,null);
 await selectBeat(decimal.id);assert.equal(formula().value,'(9.5 + 0.5) / 4');assert.equal(numeric().find(b=>b.id===decimal.id).assignment.state.value,2.5);
 stage('real project close/reopen preserves accepted source, editable formulas and core results; session history resets');
 // Exercise every approved operation through actual menu controls and core admission.
 for (const [label,operation,operand,expectedValue] of [['Set to','assign','2',2],['Add','add','2',11.5],['Subtract','subtract','2',7.5],['Multiply by','multiply','2',19],['Divide by','divide','2',4.75],['Floor divide by','floorDivide','2',4],['Remainder after dividing by','remainder','2',1.5]]) {
  const panel=selected();panel.querySelector('summary').click();button(label,panel);enter(formula(),operand);
  assert.equal((await commit()).ok,true);assert.equal(result.transcript.filter(t=>t.request.operation==='scene.apply').at(-1).request.payload.command.beat.value.operation,operation);
  assert.equal(numeric().find(b=>b.id===decimal.id).assignment.state.value,expectedValue);await selectBeat(decimal.id);
 }
 button('Cancel',selected());await settle();
 const literalSource=await source(path);
 for(const name of ['arith_flag','arith_title']) {const id=workspace.authoring.variables.find(v=>v.technicalName===name).id;const literal=numeric().find(b=>b.payload.variableId===id);assert(literal);await selectBeat(literal.id);assert(selected().querySelector('[aria-label="Value"]'));assert.equal((await commit()).ok,true);assert.equal(await source(path),literalSource);}
 stage('all seven operation menu choices reach core with correct results; bool/string literal paths and no-op source remain intact');
 // Existing explicit branch owner, insertion position and the same validation/apply envelope.
 button('Add Beat to If');const newBeat=document.querySelector('.new-beat');enter(newBeat.querySelector('select'),'setVariable','change');
 enter(newBeat.querySelector('[aria-label="Variable"]'),workspace.authoring.variables.find(v=>v.technicalName==='trust').id,'change');
 enter(newBeat.querySelector('[aria-label="Formula"]'),'(bonus + 2) * 3');await settle();
 const validated=result.transcript.filter(t=>t.request.operation==='scene.validateAssignment').at(-1);assert.equal(validated.request.payload.command.type,'insertBodyBeat');assert.equal(validated.request.payload.command.body.type,'branch');
 lastApply=undefined;button('Add Beat',newBeat);await wait(()=>lastApply);assert.equal(lastApply.ok,true);await settle();
 const inserted=scene().beats.find(b=>b.payload.value?.operand==='(bonus + 2) * 3'&&b.owner);assert(inserted);assert.deepEqual(inserted.owner,{groupId:validated.request.payload.command.body.groupId,branchId:validated.request.payload.command.body.branchId});
 const finalSource=await source(path);assert(finalSource.includes('        $ trust = (bonus + 2) * 3\n'));assert(finalSource.includes('# competing accepted Source'));
 assert.equal((await historyStep('undo')).ok,true);assert.equal(await source(path),literalSource);assert.equal((await historyStep('redo')).ok,true);assert.equal(await source(path),finalSource);
 button('Close Project');await wait(()=>document.querySelector('.recent-open'));document.querySelector('.recent-open').click();await wait(()=>document.querySelector('.beat-card'));await settle();assert.equal(await source(path),finalSource);assert(scene().beats.some(b=>b.id===inserted.id&&b.owner?.branchId===inserted.owner.branchId));
 stage('nested formula insertion validates and commits its captured branch/position; exact shared history and reopen retain it');
 await selectBeat(decimal.id);
 result.sourceSHA256=hash(await source(path));await writeFile(join(output,'accepted.rpy'),await source(path));button('Cancel',selected());button('Close Project');await wait(()=>document.querySelector('.recent-open'));result.passed=true;
}catch(error){result.failure={message:error.message,stack:error.stack};result.dom=document.body.innerHTML;throw error;}
finally{await browser.happyDOM.close();try{await child.stop();result.driver=child.exitStatus();await assert.rejects(access(scratch));result.cleanupComplete=true;}finally{await writeFile(join(output,'result.json'),JSON.stringify(result,null,2)+'\n');}}
console.log('PASS actual production Story/main to real core arithmetic journey. Happy DOM input, no SDK/native claim.');
