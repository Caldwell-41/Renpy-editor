// One actual renderer/native credential/HTTP/core session across all five actions.
// Controlled synthetic inference only; live Studio compatibility is separate evidence.
import assert from 'node:assert/strict';
import {driverProcess} from './phase2-driver-process.mjs';
import {createServer} from 'node:http';
import {randomUUID, createHash} from 'node:crypto';
import {tmpdir, networkInterfaces} from 'node:os';
import {join} from 'node:path';
import {existsSync, writeFileSync} from 'node:fs';
import {Window} from 'happy-dom';
import {mountRewrite} from '../dist-tests/src/rewrite-ui.js';
const executable=process.argv[2]; assert(executable,'Pass the actual native integration driver');
const privateLan=process.argv.includes('--private-lan');
const selectableIntegrated=process.argv.includes('--selectable-integrated');
const privateIPv4=ip=>{const b=ip.split('.').map(Number);return b[0]===10||(b[0]===172&&b[1]>=16&&b[1]<=31)||(b[0]===192&&b[1]===168);};
const address=privateLan?Object.values(networkInterfaces()).flat().find(n=>n?.family==='IPv4'&&!n.internal&&privateIPv4(n.address))?.address:'127.0.0.1';
assert(address,'Required owned RFC1918 interface is unavailable; LAN proof cannot be skipped');
const outputIndex=process.argv.indexOf('--game-output');
const gameOutput=outputIndex<0?null:process.argv[outputIndex+1];
const root=join(tmpdir(),`loomlight-rewrite-controller-${randomUUID()}`);
const sent=[],reviewed=[],generated=[];
let action,expectedReferences=[],controller,accepted=0,child,sessionId,raw,serverError;
const server=createServer(async(req,res)=>{
 try{
 assert.equal(req.url,'/v1/chat/completions');
 assert.equal(req.headers.authorization,'Bearer loomlight-public-rewrite-fixture');
 assert.equal(req.headers.host,`${address}:${server.address().port}`);
 assert(privateLan?privateIPv4(req.socket.localAddress.replace('::ffff:','')):req.socket.localAddress==='127.0.0.1');
 let bytes='';for await(const chunk of req)bytes+=chunk;
 const wire=JSON.parse(bytes),user=JSON.parse(wire.messages[1].content);
 assert.equal(wire.stream,false);assert.equal(wire.response_format.json_schema.strict,true);
 assert.equal(wire.model,'synthetic-rewrite-model');assert.equal(wire.temperature,1);assert.equal(wire.top_p,0.95);
 assert.equal(wire.enable_tools,false);assert.deepEqual(wire.enabled_tools,[]);
 assert.equal(wire.enable_thinking,true);assert(!Object.hasOwn(wire,'tools'));assert(!Object.hasOwn(wire,'session_id'));
 assert.deepEqual(user.references.map(r=>({kind:r.kind,recordId:r.recordId,revisionId:r.revisionId})),[...expectedReferences].sort((a,b)=>a.kind.localeCompare(b.kind)||a.recordId.localeCompare(b.recordId)));
 sent.push({action,sha256:createHash('sha256').update(bytes).digest('hex')});
 let result;
 if(action==='editScene'){
  const permission=user.story.batch.permissions;assert.equal(permission.character.type,'create');
  const operations=user.story.batch.targets.map((t,i)=>{const segments=structuredClone(t.segments);segments[0]={literal:`Integrated selectable ${i} [str(7)] café 雪 `};return {type:'replace',id:`text${i}`,beatId:t.beatId,segments};});
  assert(operations.length>=2,'Integrated proposal requires selectable text alternatives');
  operations.push({type:'character',id:'character',displayName:'Closeout selectable Character [str(7)] {b}literal{/b}',dialogueColor:'#aabbcc'});
  operations.push({type:'insert',id:'group',beforeBeatId:permission.insertionAnchor,beats:[{type:'dialogue',characterId:'proposedCharacter',text:'Closeout selectable dialogue [str(7)] {b}literal{/b} 雪'},{type:'narration',text:'Closeout selectable narration'}]});
  result={schemaVersion:1,action,sceneId:user.story.sceneId,operations};
 }else if(action==='generateCard')result={schemaVersion:1,action,target:{recordId:user.story.cardTarget.recordId,title:user.story.cardTarget.title},fields:{aliases:['Synthetic'],description:'Passive [str(7)] {b}metadata{/b} <img onerror=alert(1)>',appearanceNotes:'Notes',personality:'Calm',motivations:'Explore',background:'Authored fiction',speakingStyle:'Brief',exampleDialogue:'Hello'}};
 else if(action==='generateLore')result={schemaVersion:1,action,target:{recordId:user.story.loreTarget.recordId,title:user.story.loreTarget.title},fields:{tags:['Synthetic'],text:'Passive [str(7)] {b}lore{/b} <img onerror=alert(1)>',category:'World rule',subject:'Tram',knowledgeNotes:'Author intent; runtime unknown.'}};
 else if(action==='rewriteDialogue'){
  const segments=structuredClone(user.responseContract.segments);segments[0].literal='Integrated literal [str(7)] {a=jump:label} café 雪 ';
  result={schemaVersion:1,action,target:{sceneId:user.story.sceneId,beatId:user.story.beatId},segments};
  assert.equal(wire.messages[0].content,'Integrated custom instructions: preserve the response contract.');
 }else{
  const character=user.definitions.find(d=>d.kind==='character');assert(character);
  result={schemaVersion:1,action,target:action==='draftScene'?{chapterId:user.story.chapterId,title:user.story.title}:{sceneId:user.story.sceneId,beatId:user.story.beatId},beats:[{type:'narration',text:'Integrated new [str(7)] {b}literal{/b} café 雪'},{type:'dialogue',characterId:character.id,text:'Second literal [flag] {b}line{/b}'}],...(action==='draftScene'?{terminal:{type:'return'}}:{})};
 }
 const respond=()=>{
  const content=JSON.stringify(result);
  const body=JSON.stringify({model:wire.model,choices:[{index:0,finish_reason:'stop',message:{role:'assistant',content}}]});
  res.writeHead(200,{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)});res.end(body);
 };
 respond();
 }catch(error){serverError=error;res.writeHead(500);res.end();}
});
await new Promise(r=>server.listen(0,address,r));
const endpoint=`http://${address}:${server.address().port}/v1`;
const w=new Window({url:'http://tauri.localhost'});
Object.assign(globalThis,{window:w,document:w.document,HTMLElement:w.HTMLElement,Event:w.Event});
async function start(reopen=false,retain=false){
 child=driverProcess(executable,[endpoint,'--root',root,...(privateLan?['--private-lan']:[]),...(reopen?['--reopen']:[]),...(retain?['--retain']:[])]);
 sessionId=(await child.next()).sessionId;assert(sessionId,'Driver ready session missing');raw=child.request;
}
async function stop(){const owned=child;try{await owned.stop();}finally{child=undefined;}}
async function call(operation,payload={}){
 const r=await raw({protocolVersion:1,requestId:randomUUID(),operation,payload:operation.startsWith('ai.')?payload:{...payload,sessionId}});
 if(!r.ok)throw Object.assign(Error(r.error.message),r.error);return r.value;
}
const snapshot=async()=> (await raw({driver:'snapshot'})).snapshot;
const stable=s=>Object.fromEntries(Object.entries(s).filter(([p])=>p.endsWith('.rpy')||['.renpy-editor/references.json','.renpy-editor/ai.json','.renpy-editor/project.json','.renpy-editor/source-map.json'].includes(p)));
const source=s=>Object.fromEntries(Object.entries(s).filter(([p])=>p.endsWith('.rpy')));
const decode=bytes=>JSON.parse(Buffer.from(bytes).toString('utf8'));
const wait=async fn=>{const start=Date.now();while(!await fn()){if(serverError)throw serverError;assert(Date.now()-start<15000,'Integrated controller timeout');await new Promise(r=>setTimeout(r,10));}};
const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
const click=async text=>{await wait(()=>button(text)&&!button(text).disabled);button(text).click();};
const input=(name,text,event='input')=>{const el=document.querySelector(`[name="${name}"]`);assert(el);el.value=text;el.dispatchEvent(new Event(event));};
async function mount(nextAction,includeGenerated=false){
 action=nextAction;controller?.dispose();document.body.replaceChildren();
 const options=await call('context.options'),workspace=await call('scene.list'),s=workspace.scenes[0];
 const b=action==='continueScene'?s.beats.at(-1):s.beats.find(b=>b.payload.type==='narration');
 const target=action==='draftScene'?options.chapters[0].id:s.id;
 controller=mountRewrite(document.body,target,action==='draftScene'?'':b.id,{current:()=>true,call,accepted:()=>accepted++},action);
 await wait(()=>!document.querySelector('[name="rewriteTask"]').disabled);
 if(['generateCard','generateLore','draftScene'].includes(action))input('draftSceneTitle',`Integrated ${action} café 雪`);
 input('rewriteTask','Use only reviewed synthetic facts and literal prose.');
 if(action==='editScene'){
  input('batchAnchor',s.beats.at(-1).id);input('batchCharacter','create','change');input('batchTechnicalName','integrated_new');
  for(const checkbox of document.querySelectorAll('[name="batchReplacement"]')){checkbox.checked=true;checkbox.dispatchEvent(new Event('change'));}
 }
 expectedReferences=options.references.filter(r=>r.eligible&&(includeGenerated||!generated.some(g=>g.recordId===r.recordId))).map(r=>({kind:r.kind,recordId:r.recordId,revisionId:r.revisionId}));
 for(const checkbox of document.querySelectorAll('fieldset input')){
  if(expectedReferences.some(r=>JSON.stringify(r)===checkbox.value)){checkbox.checked=true;checkbox.dispatchEvent(new Event('change'));}
 }
 return options;
}
const acceptName=()=>({generateCard:'Save proposed card',generateLore:'Save proposed lore entry',rewriteDialogue:'Apply and save 1 change',continueScene:'Accept Beat group',draftScene:'Accept Scene',editScene:'Save selected changes'})[action];
async function prepare(){
 await click('Review complete send');await wait(()=>button('Generate proposal')&&!button('Generate proposal').disabled);
 const disclosure=document.querySelector('.rewrite-result').textContent;
 assert(disclosure.includes(endpoint));assert(disclosure.includes('synthetic-rewrite-model'));
 assert(disclosure.includes(`Reviewed connection addresses: ${address}:${server.address().port}`));
 assert(disclosure.includes(privateLan?'Private LAN HTTP (unencrypted)':'Literal loopback HTTP (unencrypted)'));
 assert(action==='draftScene'?disclosure.includes('Processing location: unknown'):disclosure.includes('inference locality Unknown'));
 const bytes=[...document.querySelectorAll('.rewrite-result section')].find(s=>s.querySelector('h4')?.textContent==='Complete exact request body').querySelector('pre').textContent;
 const payload=JSON.parse(bytes);assert.equal(payload.temperature,1);assert.equal(payload.top_p,0.95);
 reviewed.push({action,sha256:createHash('sha256').update(bytes).digest('hex')});return payload;
}
async function generate(){const n=sent.length;await click('Generate proposal');await wait(()=>sent.length===n+1);assert.deepEqual(sent.at(-1),reviewed.at(-1));}
async function toggleOperation(id){
 const checkbox=document.querySelector(`[data-operation-id="${id}"]`);assert(checkbox);checkbox.checked=!checkbox.checked;checkbox.dispatchEvent(new Event('change'));
 await wait(()=>document.querySelector('.rewrite-panel').dataset.busy==='false');
}
async function accept(){await wait(()=>!button(acceptName()).disabled);assert.equal(document.querySelector('img,script'),null);const n=accepted;await click(acceptName());await wait(()=>accepted===n+1);assert(button(acceptName()).disabled);}
async function history(surface,type){
 if(surface==='scene'){const v=await call('scene.list');return call('scene.apply',{expectedProjectRevision:v.projectRevision,expectedSourceMapRevision:v.sourceMapRevision,command:{type}});}
 const v=await call(`${surface}.list`);return call(`${surface}.apply`,{expectedRevision:v.revision,command:{type}});
}
async function approve(kind){
 const before=await snapshot(),v=await call('references.list'),record=v.document[kind==='card'?'cards':'loreEntries'].at(-1),revisionId=record.currentRevisionId;
 assert.equal(record.approvedRevisionId,null);assert.equal(record.revisions.at(-1).status,'proposed');
 await call('references.apply',{expectedRevision:v.revision,command:{type:kind==='card'?'reviewCard':'reviewLore',recordId:record.id,revisionId,approve:true}});
 const approved=await snapshot();assert.deepEqual(source(approved),source(before));
 const current=(await call('references.list')).document[kind==='card'?'cards':'loreEntries'].at(-1);assert.equal(current.approvedRevisionId,revisionId);
 generated.push({kind,recordId:record.id,revisionId});
 await history('prompts','undo');assert.deepEqual(stable(await snapshot()),stable(before));
 await history('scene','redo');assert.deepEqual(stable(await snapshot()),stable(approved));
}
try{
 await start(false,true);
 const baseline=await snapshot(),initialCount=sent.length;
 const p=await call('prompts.list');await call('prompts.apply',{expectedRevision:p.revision,command:{type:'save',text:'Integrated custom instructions: preserve the response contract.'}});
 for(const kind of ['card','lore']){
  await mount(kind==='card'?'generateCard':'generateLore');const before=await snapshot();await prepare();assert.deepEqual(stable(await snapshot()),stable(before));
  await generate();await wait(()=>!button(acceptName()).disabled);assert.deepEqual(stable(await snapshot()),stable(before));
  await accept();assert.deepEqual(source(await snapshot()),source(baseline));await approve(kind);
 }
 await mount('rewriteDialogue',true);assert(generated.every(g=>expectedReferences.some(r=>JSON.stringify(g)===JSON.stringify(r))));
 const beforeRewrite=await snapshot();await prepare();await generate();await accept();const afterRewrite=await snapshot();assert.notDeepEqual(source(afterRewrite),source(beforeRewrite));
 await history('references','undo');assert.deepEqual(stable(await snapshot()),stable(beforeRewrite));
 await history('prompts','redo');assert.deepEqual(stable(await snapshot()),stable(afterRewrite));
 const staleOptions=await call('context.options');assert(generated.every(g=>staleOptions.references.some(r=>r.recordId===g.recordId&&!r.eligible)));
 const custom=await snapshot(),prompt=await call('prompts.list');await call('prompts.apply',{expectedRevision:prompt.revision,command:{type:'restore'}});const restored=await snapshot();
 assert.equal((await call('prompts.list')).customized,false);await history('scene','undo');assert.deepEqual(stable(await snapshot()),stable(custom));await history('references','redo');assert.deepEqual(stable(await snapshot()),stable(restored));
 for(const nextAction of ['continueScene','draftScene']){
  await mount(nextAction);input('rewriteBudget','65536');input('rewriteCapacity','65536');input('rewriteResponse','1536');
  const before=await snapshot(),body=await prepare();assert.equal(body.max_tokens,1536);assert.deepEqual(stable(await snapshot()),stable(before));
  await generate();await wait(()=>!button(acceptName()).disabled);assert.deepEqual(stable(await snapshot()),stable(before));await accept();const after=await snapshot();assert.notDeepEqual(source(after),source(before));
  if(nextAction==='draftScene'){for(const [path,bytes] of Object.entries(source(before)))assert.deepEqual(after[path],bytes);}
  await history('references','undo');assert.deepEqual(stable(await snapshot()),stable(before));await history('prompts','redo');assert.deepEqual(stable(await snapshot()),stable(after));
 }
 const expectedActions=['generateCard','generateLore','rewriteDialogue','continueScene','draftScene'];
 if(selectableIntegrated){
  await mount('editScene');const before=await snapshot(),workspace=await call('scene.list'),scene=workspace.scenes[0];
  await prepare();assert.deepEqual(stable(await snapshot()),stable(before));await generate();await wait(()=>!button(acceptName()).disabled);assert.deepEqual(stable(await snapshot()),stable(before));
  const fullDigest=document.querySelector('.rewrite-panel').dataset.previewDigest;
  await toggleOperation('character');assert(button(acceptName()).disabled);assert.match(document.querySelector('.rewrite-result').textContent,/group requires character/);assert.deepEqual(stable(await snapshot()),stable(before));
  await toggleOperation('group');assert.equal(button(acceptName()).disabled,false);assert.notEqual(document.querySelector('.rewrite-panel').dataset.previewDigest,fullDigest);
  await toggleOperation('character');await toggleOperation('group');assert.equal(document.querySelector('.rewrite-panel').dataset.previewDigest,fullDigest);
  // Keep only the generated Character and its dependent insertion. Preserve all
  // previously accepted five-action prose by declining every replacement row.
  const replacementIds=[...document.querySelectorAll('[data-operation-id]')].map(c=>c.dataset.operationId).filter(id=>id.startsWith('text'));
  for(const id of replacementIds)await toggleOperation(id);
  assert.equal(button(acceptName()).disabled,false);assert.notEqual(document.querySelector('.rewrite-panel').dataset.previewDigest,fullDigest);assert.deepEqual(stable(await snapshot()),stable(before));
  assert.deepEqual([...document.querySelectorAll('[data-operation-id]:checked')].map(c=>c.dataset.operationId),['character','group']);
  await accept();const after=await snapshot();assert.notDeepEqual(source(after),source(before));assert([...document.querySelectorAll('[data-operation-id]')].every(c=>c.disabled));
  const text=Buffer.from(after[scene.sourcePath]).toString('utf8');assert(text.startsWith('\ufeff'));assert(text.includes('opaque_neighbor = "kept"'));assert(text.includes('# true branch comment'));assert(text.includes('[flag] {b}friend{/b}'));assert(text.includes('[[str(7)]'));assert(!text.includes('Integrated selectable '));assert(text.includes('Closeout selectable dialogue'));assert(text.includes('Closeout selectable narration'));
  for(const [path,bytes] of Object.entries(source(before)).filter(([path])=>path!==scene.sourcePath&&path!=='game/definitions/characters.rpy'))assert.deepEqual(after[path],bytes);
  await history('references','undo');assert.deepEqual(stable(await snapshot()),stable(before));await history('prompts','redo');assert.deepEqual(stable(await snapshot()),stable(after));
  expectedActions.push('editScene');
 }
 assert.equal(sent.length-initialCount,expectedActions.length);assert.deepEqual(sent.map(r=>r.action),expectedActions);
 const durable=await snapshot(),n=sent.length;
 if(gameOutput){const scenes=(await call('scene.list')).scenes;writeFileSync(gameOutput,JSON.stringify({schemaVersion:1,source:Object.fromEntries(Object.entries(source(durable)).map(([p,b])=>[p,Buffer.from(b).toString('utf8')])),scenes:scenes.map(s=>({id:s.id,label:s.technicalLabel,path:s.sourcePath})),sourceSHA256:Object.fromEntries(Object.entries(source(durable)).map(([p,b])=>[p,createHash('sha256').update(Buffer.from(b)).digest('hex')]))},null,2)+'\n');}controller.dispose();document.body.replaceChildren();
 sessionId=(await raw({driver:'reopen'})).sessionId;assert.deepEqual(stable(await snapshot()),stable(durable));assert.equal(sent.length,n);
 await stop();await start(true,false);assert.deepEqual(stable(await snapshot()),stable(durable));assert.equal(sent.length,n);
 const refs=await call('references.list');for(const g of generated)assert.equal(refs.document[g.kind==='card'?'cards':'loreEntries'].find(r=>r.id===g.recordId).approvedRevisionId,g.revisionId);
 const ai=decode(durable['.renpy-editor/ai.json']);assert.deepEqual(ai.futureSettings,{retained:true});assert.equal(ai.prompts.futureAction.text,'Retained');
 await stop();assert(!existsSync(root));
 console.log('PASS: integrated five actions/exact sends/passive review/separate approvals/generated-reference staleness/mixed source-reference-prompt Undo-Redo/project-process reopen/zero reopen HTTP/owned cleanup');
 if(selectableIntegrated)console.log('PASS: same-project integrated selectable multi-operation/dependency-invalid zero writes/valid partial subset accepted once/custom preservation/Undo-Redo/export/project-process reopen');
 if(privateLan)console.log('PASS: actual opted-in private LAN HTTP/exact address/native credential worker/five actions/owned interface');
}catch(error){
 controller?.dispose();const cleanupErrors=[];
 if(child){await stop().catch(e=>cleanupErrors.push(e.message));}
 if(existsSync(root)){
  try{await start(true,false);await stop();}catch(e){cleanupErrors.push(e.message);if(child)await stop().catch(e=>cleanupErrors.push(e.message));}
 }
 console.error(JSON.stringify({result:'failed',ownedCleanupAttempted:true,rootRemaining:existsSync(root),cleanupErrors}));
 throw error;
}finally{controller?.dispose();await w.happyDOM.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
