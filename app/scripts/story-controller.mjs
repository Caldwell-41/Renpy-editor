// Actual production application → typed request → ApplicationHost → source/history.
// Core-only disposable driver; no WebView/package, credentials, network or SDK.
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve,basename,dirname} from 'node:path';
import {existsSync,rmSync,mkdirSync,writeFileSync,readdirSync,lstatSync,readFileSync} from 'node:fs';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {Window} from 'happy-dom';
import {driverProcess} from '../tests/phase2-driver-process.mjs';
import {createRequest,isCoreResponse} from '../dist-tests/src/protocol.js';

export const STORY_CASES=[
 'Guarded Choice actual Story dispatch preserves exact neighbours',
 'Call destination actual Story dispatch preserves its return label',
 'Explicit branch Beat insertion captures body and sibling position',
 'Condition builder and If Else If Otherwise controls preserve exact ownership',
 'Nested keyboard and explicit cross-body moves preserve subtree identity',
 'Delete versus unwrap and empty bodies preserve safe source boundaries',
 'Manual branch preview and Branches navigation agree with exact Source locations',
 'Cancel and dirty Source draft refusal retain pending author input',
 'Ordinary external edits and stale revisions refuse with zero source writes',
];
const NARROW=STORY_CASES.filter((_,i)=>[0,1,2,7,8].includes(i));
const REOPEN_CASE='Undo Redo preserves exact bytes and process reopen retains maps with session history reset';
const hash=bytes=>createHash('sha256').update(Buffer.from(bytes)).digest('hex');
const rpy=snapshot=>Object.fromEntries(Object.entries(snapshot).filter(([p])=>p.endsWith('.rpy')));
const hashes=snapshot=>Object.fromEntries(Object.entries(snapshot).map(([p,b])=>[p,hash(b)]));
const ownedProjectSnapshot=fixture=>{
 const base=join(fixture,'synthetic-project'),snapshot={};
 const visit=(dir,prefix='')=>{for(const entry of readdirSync(dir)){const file=join(dir,entry),relative=prefix+entry,state=lstatSync(file);assert(!state.isSymbolicLink(),'Owned failure snapshot refuses links');if(state.isDirectory())visit(file,relative+'/');else if(state.isFile()){assert(!relative.includes('savetoken')&&!relative.endsWith('.key'));snapshot[relative]=Array.from(readFileSync(file));}}};
 if(existsSync(base))visit(base);return snapshot;
};

export async function qualifyStoryController(executable,{output,caseModule,selection='full'}={}) {
 assert(executable&&output&&caseModule,'Explicit driver, evidence output and reviewed DOM case module required');
 assert(['full','narrow'].includes(selection));
 const cases=await import(pathToFileURL(resolve(caseModule)).href);
 const required=selection==='full'?STORY_CASES:NARROW;
 for(const name of required)assert.equal(typeof cases.storyCases?.[name],'function',`Required actual DOM case not implemented: ${name}`);
 const fixture=join(tmpdir(),`loomlight-phase3a-controller-${randomUUID()}`);
 assert(!existsSync(fixture));
 const evidence={selection,passed:false,cases:[],driverStarts:0,driverExits:[],cleanupComplete:false,
  sdkCommands:0,credentialOperations:0,aiOperations:0,packagedUi:'not exercised',humanAcceptance:'not claimed',fixtureId:basename(fixture),ownedFixtureRemoved:false,failureSnapshotRetained:false};
 let child,session,latestWorkspace,lastMutation,saveBefore,saveAfter;
 let domSequence=0,lastEvent,caseActive=false,caseEventStart=0;
 const panelEvents=new Map();let sourceInputEvent;
 let stopFailure;let inFlight=0;let responseBarrier;
 const transcript=[];
 const w=new Window({url:'http://tauri.localhost'});
 Object.assign(globalThis,{window:w,document:w.document,HTMLElement:w.HTMLElement,HTMLInputElement:w.HTMLInputElement,
  HTMLTextAreaElement:w.HTMLTextAreaElement,HTMLSelectElement:w.HTMLSelectElement,HTMLButtonElement:w.HTMLButtonElement,
  Event:w.Event,KeyboardEvent:w.KeyboardEvent,MouseEvent:w.MouseEvent});
 document.body.innerHTML='<div id="app"></div>';
 for(const type of ['click','keydown','input','change'])document.addEventListener(type,event=>{
  const target=event.target?.closest?.('button,input,select,textarea,[role="button"]')??event.target;
  const panel=target?.closest?.('.scene-workspace')?'story':target?.closest?.('.source-workspace')?'source':target?.closest?.('.app-header')?'header':null;
  domSequence++;lastEvent={sequence:domSequence,type,tag:target?.tagName,panel,
   connected:target?.isConnected===true,enabled:target?.disabled!==true,
   currentDocument:target?.ownerDocument===document,ownerSession:session,
   label:target?.getAttribute?.('aria-label')??target?.textContent?.slice(0,120)};
  if(panel)panelEvents.set(panel,lastEvent);
  if(panel==='source'&&['input','change','keydown'].includes(type))sourceInputEvent=lastEvent;
 },true);
 const wait=async predicate=>{const start=Date.now();while(!await predicate()){
  assert(Date.now()-start<15000,'Actual Story controller deadline exceeded');await new Promise(r=>setTimeout(r,10));
 }};
 const snapshot=async()=> (await child.request({driver:'snapshot'})).snapshot;
 const requester=async(operation,payload={})=>{
  assert(!operation.startsWith('ai.')&&!operation.startsWith('rewrite.')&&!operation.startsWith('sdk.')&&!operation.startsWith('runtime.'),
   `Unexpected execution/send operation: ${operation}`);
  const request=createRequest(operation,payload);
  let attributed=lastEvent;
  if(operation==='scene.apply')attributed=panelEvents.get('story');
  if(operation==='source.updateDraft')attributed=sourceInputEvent??panelEvents.get('source');
  else if(operation.startsWith('source.')&&!reads.has(operation)){
   const source=panelEvents.get('source'),header=panelEvents.get('header');
   attributed=header&&(!source||header.sequence>source.sequence)?header:source;
  }
  const event=attributed?{...attributed}:null;
  const eligible=event&&event.connected&&event.enabled&&event.currentDocument&&event.ownerSession===session&&payload.sessionId===session;
  if(operation==='scene.apply'&&!['undo','redo','selectScene'].includes(payload.command.type)){
   assert(caseActive&&eligible&&event.sequence>caseEventStart&&event.panel==='story',
    'A fresh event in the current actual Story panel must initiate authoring');
  }
  if(['source.updateDraft','source.save','source.applyBoth','source.saveAll','source.discard','source.discardAll'].includes(operation)){
   assert(caseActive&&eligible&&event.sequence>caseEventStart&&['source','header'].includes(event.panel),
    'Source writes must originate in the current actual Source UI');
  }
  inFlight++;let response;
  try{
   response=await child.request(request);
   assert(isCoreResponse(response,request.requestId),'Actual Host response must match the exact typed request ID');
   if(responseBarrier&&operation==='scene.apply'&&payload.command.type===responseBarrier.command){
    const barrier=responseBarrier;assert(!barrier.observed,'Only one actual UI response may be held');
    assert(response.ok,'Pending lock proof requires an accepted real Host transaction');barrier.observed=true;
    await barrier.releasePromise;
   }
  }finally{inFlight--;}
  assert(isCoreResponse(response,request.requestId),'Actual Host response must match the exact typed request ID');
  transcript.push({request,responseOk:response.ok,errorCode:response.ok?undefined:response.error.code,
   responseSHA256:hash(Buffer.from(JSON.stringify(response))),domEvent:event});
  if(operation==='project.openRecent'&&response.ok)session=response.value.sessionId;
  if(operation==='scene.list'&&response.ok)latestWorkspace=response.value;
  if(operation==='scene.apply'){
   assert.equal(payload.sessionId,session);assert(payload.expectedProjectRevision&&payload.expectedSourceMapRevision);
   if(!['undo','redo','selectScene'].includes(payload.command.type)){
    assert(payload.command.sceneId&&payload.command.expectedSourceRevision);
    if(payload.command.type==='updateBodyBeat')assert(payload.command.beatId&&payload.command.expectedBody);
    if(payload.command.type==='insertBodyBeat')assert(payload.command.body&&payload.command.position);
   }
   lastMutation={request,response,event};
   if(response.ok)latestWorkspace=response.value;
  }
  return response;
 };
 const reads=new Set(['project.listRecent','project.current','project.status','scene.list','source.list','source.open','flow.list','authoring.list']);
 const call=async(operation,payload={})=>{
  assert(reads.has(operation),'Scenario context.call permits typed reads only; use actual DOM controls for writes');
  const response=await requester(operation,{...payload,...(operation.startsWith('project.')&&['project.listRecent','project.current','project.openRecent'].includes(operation)?{}:{sessionId:session})});
  if(!response.ok)throw Object.assign(Error(response.error.message),response.error);return response.value;
 };
 const click=async(label,scope=document)=>{
  await wait(()=>[...scope.querySelectorAll('button')].some(b=>(b.textContent===label||b.getAttribute('aria-label')===label)&&!b.disabled));
  const button=[...scope.querySelectorAll('button')].find(b=>(b.textContent===label||b.getAttribute('aria-label')===label)&&!b.disabled);
  button.click();return button;
 };
 const enter=(control,value,event='input')=>{assert(control?.isConnected&&control.ownerDocument===document&&!control.disabled,'Input must be a connected enabled current control');control.focus();control.value=value;control.dispatchEvent(new w.Event(event,{bubbles:true}));};
 const key=(control,key,options={})=>{assert(control?.isConnected&&control.ownerDocument===document&&!control.disabled);control.focus();assert.equal(document.activeElement,control);control.dispatchEvent(new w.KeyboardEvent('keydown',{key,bubbles:true,...options}));};
 const labelled=(text,scope=document)=>{
  const label=[...scope.querySelectorAll('label')].find(l=>l.firstElementChild?.textContent===text);
  assert(label,`Missing actual control ${text}`);const control=label.querySelector('input,select,textarea');assert(control);return control;
 };
 // This cannot initiate or alter a request: it delays delivery of one validated Host response.
 const pendingWrite=async(command,action,observe)=>{
  assert(caseActive&&!responseBarrier);let release;const releasePromise=new Promise(resolve=>{release=resolve;});
  const barrier={command,observed:false,releasePromise};responseBarrier=barrier;let actionPromise;
  try{actionPromise=action();await wait(()=>barrier.observed);await observe();}
  finally{release();responseBarrier=undefined;await actionPromise;}
 };
 const raw=async request=>{
  assert(request?.driver==='snapshot'||request?.driver==='externalAppend','Only owned fixture controls allowed');return child.request(request);
 };
 const start=async reopen=>{
  evidence.driverStarts++;
  child=driverProcess(executable,['--root',fixture,'--seed-evidence',join(output,'seed'),...(reopen?['--reopen']:['--retain'])]);
  const ready=await child.next();evidence.lastDriverReady=ready;assert.equal(ready.fixtureId,basename(fixture));assert.equal(ready.ready,true);assert.equal(ready.reopen,reopen);
 };
 const stop=async()=>{
  assert(child,'No owned driver to stop');const owner=child;
  try{
   await owner.stop();const outcome=owner.exitStatus();assert(outcome.exitObserved&&outcome.exitCode===0&&!outcome.signal);
   evidence.driverExits.push({normal:true,reaped:true,...outcome});
   if(child===owner)child=undefined;
  }catch(error){
   stopFailure??=error;evidence.passed=false;evidence.cleanupComplete=false;
   const outcome=owner.exitStatus();
   if(!evidence.driverExits.some(exit=>exit.normal===false))evidence.driverExits.push({normal:false,reaped:outcome.exitObserved,...outcome,error:String(error)});
   // Release a child only after its OS exit is observed. Abnormal termination still fails the gate.
   if(outcome.exitObserved&&child===owner)child=undefined;
   throw error;
  }
 };
 try {
  await start(false);
  const {startApplication}=await import('../dist-tests/src/main.js');
  startApplication(requester);
  await wait(()=>document.querySelector('.recent-open')&&!document.querySelector('.recent-open').disabled);
  document.querySelector('.recent-open').click();
  await wait(()=>document.querySelector('.beat-card')&&latestWorkspace&&session);
  const context={assert,wait,click,enter,key,labelled,call,raw,snapshot,rpy,hashes,pendingWrite,
   requests:()=>transcript,settle:async()=>{await new Promise(r=>setTimeout(r,0));await wait(()=>inFlight===0);await new Promise(r=>setTimeout(r,0));},
   workspace:()=>latestWorkspace,session:()=>session,lastMutation:()=>lastMutation,document,
   sourceText:(snapshot,path)=>Buffer.from(snapshot[path]).toString('utf8')};
  for(const name of required){
   const before=await snapshot();const from=transcript.length;const beforeEvent=domSequence;
   lastMutation=undefined;lastEvent=undefined;sourceInputEvent=undefined;panelEvents.clear();caseEventStart=domSequence;caseActive=true;
   // Case code owns exact expected byte/model/history assertions and actual selectors.
   try{await cases.storyCases[name](context);await context.settle();}finally{caseActive=false;}
   const after=await snapshot();const requests=transcript.slice(from);
   assert(domSequence>beforeEvent,'A DOM scenario must operate actual application controls');
   evidence.cases.push({name,passed:true,beforeSHA256:hashes(rpy(before)),afterSHA256:hashes(rpy(after)),
    requests:requests.map(r=>r.request.requestId),sceneApplyRequests:requests.filter(r=>r.request.operation==='scene.apply').length});
   if(name===STORY_CASES[2]){saveBefore=before;saveAfter=after;}
  }
  assert(saveBefore&&saveAfter,'One exact nested transaction required for shared history/reopen proof');
  // The DOM cases must leave their last accepted transaction undoable and restore any ordinary conflict.
  const beforeUndo=await snapshot();
  await click('Undo');await wait(()=>lastMutation?.request.payload.command.type==='undo'&&lastMutation.response.ok);
  const undone=await snapshot();assert.notDeepEqual(rpy(undone),rpy(beforeUndo),'Undo must reverse an actual source transaction');
  await click('Redo');await wait(()=>lastMutation?.request.payload.command.type==='redo'&&lastMutation.response.ok);
  const redone=await snapshot();assert.deepEqual(rpy(redone),rpy(beforeUndo),'Redo must restore exact accepted bytes');
  const beforeReopen=await call('scene.list');const oldSession=session;
  const staleRequest=lastMutation.request;
  await click('Close Project');await wait(()=>document.querySelector('.recent-open'));
  await stop();assert(existsSync(fixture),'First normal process exit retains only the owned fixture');
  await start(true);startApplication(requester);
  await wait(()=>document.querySelector('.recent-open')&&!document.querySelector('.recent-open').disabled);
  document.querySelector('.recent-open').click();
  await wait(()=>document.querySelector('.beat-card')&&session!==oldSession);
  const reopened=await call('scene.list');assert.deepEqual(reopened.scenes,beforeReopen.scenes);
  const reopenedSnapshot=await snapshot();assert.deepEqual(rpy(reopenedSnapshot),rpy(redone));
  assert.equal(reopened.sourceMapRevision,beforeReopen.sourceMapRevision);
  assert.equal(reopened.canUndo,false);assert.equal(reopened.canRedo,false);
  // Transaction contract: accepted bytes/maps persist; Close deliberately clears its session cursor.
  const stale=await child.request(staleRequest);assert(isCoreResponse(stale,staleRequest.requestId));
  assert.equal(stale.ok,false);assert.equal(stale.error.code,'STALE_PROJECT_SESSION');
  assert.deepEqual(await snapshot(),reopenedSnapshot,'Old OS-process session must refuse without writes');
  evidence.cases.push({name:REOPEN_CASE,passed:true,processRestart:true,staleSessionRefused:true,sourceMapsRetained:true,sessionHistoryReset:true});
  await click('Close Project');await wait(()=>document.querySelector('.recent-open'));await stop();
  assert(!existsSync(fixture));evidence.cleanupComplete=true;
  assert.equal(evidence.driverStarts,2);assert.equal(evidence.driverExits.length,2);
  assert.deepEqual(evidence.cases.map(c=>c.name),[...required,REOPEN_CASE]);
  evidence.passed=true;
 } finally {
  let cleanupError=stopFailure;
  if(child){try{await stop();}catch(error){cleanupError=error;}}
  try{await w.happyDOM.close();}catch(error){cleanupError??=error;evidence.domDisposalError=String(error);}
  // Rust EOF cleanup cannot run after a crash/forced kill; harness owns this exact UUID root.
  if(existsSync(fixture)){
   assert.equal(dirname(fixture),tmpdir());assert(basename(fixture).startsWith('loomlight-phase3a-controller-'));
   let retained=true;
   if(!evidence.passed){
    try{mkdirSync(output,{recursive:true});const saved=ownedProjectSnapshot(fixture),serialized=JSON.stringify(saved,null,2)+'\n';writeFileSync(join(output,'failed-owned-project-snapshot.json'),serialized);evidence.failureSnapshotRetained=true;evidence.failureSnapshotSHA256=hash(Buffer.from(serialized));}
    catch(error){retained=false;cleanupError??=error;evidence.failureSnapshotError=String(error);}
   }
   // Preserve failed evidence, or a still-unobserved child, instead of deleting underneath it.
   if(retained&&!child)rmSync(fixture,{recursive:true,force:true});
   else evidence.ownedFixtureRetained=true;
  }
  evidence.ownedFixtureRemoved=!existsSync(fixture);
  evidence.cleanupComplete=evidence.ownedFixtureRemoved&&!cleanupError&&!stopFailure&&!child;
  if(cleanupError)evidence.passed=false;
  mkdirSync(output,{recursive:true});
  writeFileSync(join(output,'controller-report.json'),JSON.stringify(evidence,null,2)+'\n');
  writeFileSync(join(output,'controller-transcript.json'),JSON.stringify(transcript,null,2)+'\n');
  if(cleanupError)throw cleanupError;
 }
 console.log('phase-3a-controller-terminal: '+JSON.stringify(evidence));
 return evidence;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(fileURLToPath(import.meta.url))){
 const option=name=>{const index=process.argv.indexOf(name);assert(index>=0&&process.argv[index+1],`Missing ${name}`);return process.argv[index+1];};
 await qualifyStoryController(option('--driver'),{output:option('--output'),caseModule:option('--cases'),selection:process.argv.includes('--narrow')?'narrow':'full'});
}
