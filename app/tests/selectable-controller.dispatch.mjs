// Real renderer controller → native credential reader/HTTP → core selection/transaction.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {Window} from 'happy-dom';
import {mountRewrite} from '../dist-tests/src/rewrite-ui.js';
const driver=process.argv[2];assert(driver);const oi=process.argv.indexOf('--game-output'),output=oi<0?null:process.argv[oi+1];
let mode='valid',received=[],pending;
const server=createServer(async(req,res)=>{
 assert.equal(req.url,'/v1/chat/completions');assert.equal(req.headers.authorization,'Bearer loomlight-public-rewrite-fixture');let body='';for await(const c of req)body+=c;
 received.push(body);const v=JSON.parse(body),u=JSON.parse(v.messages[1].content),p=u.story.batch.permissions;assert.equal(v.response_format.json_schema.strict,true);assert.equal(v.stream,false);assert.equal(v.enable_tools,false);
 const operations=u.story.batch.targets.map((t,i)=>{const segments=structuredClone(t.segments);segments[0]={literal:`Selectable ${i} [str(7)] café 雪 `};return {type:'replace',id:`text${i}`,beatId:t.beatId,segments};});
 operations.push({type:'character',id:'character',displayName:p.character.type==='create'?'Selectable New [loomlight_untrusted()] {b}literal{/b}':'Selectable Updated [loomlight_untrusted()] {b}literal{/b}',dialogueColor:'#aabbcc'});
 operations.push({type:'insert',id:'group',beforeBeatId:p.insertionAnchor,beats:[{type:'dialogue',characterId:p.character.type==='create'?'proposedCharacter':p.speakerIds[0],text:'Selectable insertion [str(7)] {b}literal{/b} 雪'},{type:'narration',text:'Selectable group narration'}]});
 if(mode==='unsafe')operations[0].beatId='unselected';
 const send=()=>{const content=mode==='malformed'?'{"schemaVersion":1,"schemaVersion":1}':JSON.stringify({schemaVersion:1,action:'editScene',sceneId:u.story.sceneId,operations});res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({model:v.model,choices:[{index:0,finish_reason:'stop',message:{role:'assistant',content}}]}));};
 if(mode==='delay')pending=send;else send();
});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const child=spawn(driver,[`http://127.0.0.1:${server.address().port}/v1`],{stdio:['pipe','pipe','inherit']});const lines=createInterface({input:child.stdout}),queue=[],waiters=[];lines.on('line',line=>{const v=JSON.parse(line);waiters.length?waiters.shift()(v):queue.push(v);});const next=()=>queue.length?Promise.resolve(queue.shift()):new Promise(r=>waiters.push(r));let session=(await next()).sessionId,lane=Promise.resolve();
function raw(p){const task=lane.then(async()=>{child.stdin.write(JSON.stringify(p)+'\n');return next();});lane=task.catch(()=>{});return task;}
async function call(operation,payload={}){const r=await raw({protocolVersion:1,requestId:crypto.randomUUID(),operation,payload:operation.startsWith('ai.')?payload:{...payload,sessionId:session}});if(!r.ok)throw Object.assign(Error(r.error.message),r.error);return r.value;}
const snapshot=async()=> (await raw({driver:'snapshot'})).snapshot;
const authoritative=s=>Object.fromEntries(Object.entries(s).filter(([p])=>!p.startsWith('.renpy-editor/recovery/')));
const w=new Window({url:'http://tauri.localhost'});Object.assign(globalThis,{window:w,document:w.document,HTMLElement:w.HTMLElement,Event:w.Event});
const wait=async fn=>{const start=Date.now();while(!await fn()){assert(Date.now()-start<15000,'Selectable integration timeout');await new Promise(r=>setTimeout(r,10));}};
const button=name=>[...document.querySelectorAll('button')].find(b=>b.textContent===name);
const click=async name=>{await wait(()=>button(name)&&!button(name).disabled);button(name).click();};
const input=(name,value,event='input')=>{const c=document.querySelector(`[name="${name}"]`);c.value=value;c.dispatchEvent(new Event(event));};
let controller,accepted=0;
async function mount(create=true){controller?.dispose();const o=await call('context.options'),ws=await call('scene.list'),s=ws.scenes[0],b=s.beats.find(b=>b.payload.type==='narration');controller=mountRewrite(document.body,s.id,b.id,{current:()=>true,call,accepted:()=>accepted++},'editScene');await wait(()=>!document.querySelector('[name="rewriteTask"]').disabled);input('rewriteTask','Synthetic bounded edits');input('batchAnchor',s.beats.at(-1).id);input('batchCharacter',create?'create':ws.authoring.characters[0].id,'change');if(create)input('batchTechnicalName','selectable_new');for(const c of document.querySelectorAll('[name="batchReplacement"]')){c.checked=true;c.dispatchEvent(new Event('change'));}if(!create){const c=document.querySelector('[name="batchSpeaker"]');c.checked=true;c.dispatchEvent(new Event('change'));}return o;}
async function prepare(){await click('Review complete send');await wait(()=>!button('Generate proposal').disabled);return [...document.querySelectorAll('.rewrite-result section')].find(s=>s.querySelector('h4')?.textContent==='Complete exact request body').querySelector('pre').textContent;}
async function generate(){const count=received.length;await click('Generate proposal');await wait(()=>received.length>count);await wait(()=>document.querySelector('.rewrite-panel').dataset.active==='false');}
async function toggle(id){const check=document.querySelector(`[data-operation-id="${id}"]`);check.checked=!check.checked;check.dispatchEvent(new Event('change'));await wait(()=>document.querySelector('.rewrite-panel').dataset.busy==='false');}
async function history(type){const ws=await call('scene.list');return call('scene.apply',{expectedProjectRevision:ws.projectRevision,expectedSourceMapRevision:ws.sourceMapRevision,command:{type}});}
const exports=[];
async function exported(){const s=await snapshot(),ws=await call('scene.list'),source=Object.fromEntries(Object.entries(s).filter(([p])=>p.endsWith('.rpy')).map(([p,b])=>[p,Buffer.from(b).toString('utf8')]));return {schemaVersion:1,source,sourceSHA256:Object.fromEntries(Object.entries(source).map(([p,t])=>[p,createHash('sha256').update(t).digest('hex')])),scenes:ws.scenes.map(s=>({id:s.id,label:s.technicalLabel,path:s.sourcePath}))};}
try{
 // Add a second saved root narration through the ordinary Scene transaction path.
 const ws=await call('scene.list'),s=ws.scenes[0];
 await call('scene.apply',{expectedProjectRevision:ws.projectRevision,expectedSourceMapRevision:ws.sourceMapRevision,command:{type:'insertBeat',sceneId:s.id,expectedSourceRevision:s.sourceRevision,beforeBeatId:s.beats.at(-1).id,beat:{type:'narration',text:'Second narration'}}});
 await mount();const before=await snapshot(),body=await prepare();assert.deepEqual(await snapshot(),before);await generate();await wait(()=>!button('Save selected changes').disabled);assert.equal(received.at(-1),body);assert.deepEqual(await snapshot(),before);
 const fullDigest=document.querySelector('.rewrite-panel').dataset.previewDigest;
 await toggle('character');assert(button('Save selected changes').disabled);assert.match(document.querySelector('.rewrite-result').textContent,/group requires character/);assert.deepEqual(await snapshot(),before);
 await toggle('group');assert.equal(button('Save selected changes').disabled,false);assert.notEqual(document.querySelector('.rewrite-panel').dataset.previewDigest,fullDigest);
 await toggle('character');await toggle('group');assert.equal(document.querySelector('.rewrite-panel').dataset.previewDigest,fullDigest);
 await raw({driver:'hold'});await click('Save selected changes');await wait(()=>document.querySelector('[role="status"]').textContent.includes('Another request is in progress'));assert.equal(accepted,0);await raw({driver:'release'});assert.deepEqual(await snapshot(),before);
 await click('Save selected changes');await wait(()=>accepted===1);const after=await snapshot();assert.equal(button('Save selected changes').disabled,true);assert([...document.querySelectorAll('[data-operation-id]')].every(c=>c.disabled));
 const source=Buffer.from(after[s.sourcePath]).toString('utf8');assert(source.startsWith('\ufeff'));assert(source.includes('opaque_neighbor = "kept"'));assert(source.includes('# true branch comment'));assert(source.includes('[[str(7)]'));assert(source.includes('[flag] {b}friend{/b}'));
 exports.push(await exported());await history('undo');assert.deepEqual(authoritative(await snapshot()),authoritative(before));await history('redo');assert.deepEqual(authoritative(await snapshot()),authoritative(after));
 session=(await raw({driver:'reopen'})).sessionId;assert.deepEqual(authoritative(await snapshot()),authoritative(after));
 // Existing runnable Character update shares one candidate with Scene patches.
 await mount(false);await prepare();await generate();await wait(()=>!button('Save selected changes').disabled);const updateBefore=await snapshot();await click('Save selected changes');await wait(()=>accepted===2);const updated=await snapshot();assert.notDeepEqual(updated['game/definitions/characters.rpy'],updateBefore['game/definitions/characters.rpy']);exports.push(await exported());await history('undo');assert.deepEqual(authoritative(await snapshot()),authoritative(updateBefore));await history('redo');assert.deepEqual(authoritative(await snapshot()),authoritative(updated));
 for(const failure of ['malformed','unsafe']){mode=failure;await mount(false);const before=await snapshot();await prepare();await generate();assert(button('Save selected changes').disabled);assert.deepEqual(await snapshot(),before);}
 mode='delay';await mount(false);await prepare();const delayed=await snapshot();await click('Generate proposal');await wait(()=>pending);await click('Cancel request');pending();pending=undefined;await wait(()=>button('Cancel request').disabled);assert(button('Save selected changes').disabled);assert.deepEqual(await snapshot(),delayed);
 mode='valid';await mount(false);await prepare();await generate();await wait(()=>!button('Save selected changes').disabled);const prompt=await call('prompts.list');await call('prompts.apply',{expectedRevision:prompt.revision,command:{type:'save',text:'Changed prompt'}});const stale=await snapshot();await toggle('character');assert(button('Save selected changes').disabled);assert.deepEqual(await snapshot(),stale);
 assert.equal(document.querySelector('img,script'),null);if(output)writeFileSync(output,JSON.stringify({schemaVersion:1,cases:exports},null,2)+'\n');
 console.log('PASS: selectable actual controller/native HTTP; bound permissions, same-file patches, dependency refusal, stable exact previews, one transaction/Undo/Redo/reopen, Character create/update, malformed/cancelled/stale/held-owner zero writes and cleanup');
}finally{controller?.dispose();await w.happyDOM.close();child.stdin.end();await new Promise((r,j)=>child.on('exit',code=>code===0?r():j(Error(`Driver exit ${code}`))));await new Promise(r=>server.close(r));}
