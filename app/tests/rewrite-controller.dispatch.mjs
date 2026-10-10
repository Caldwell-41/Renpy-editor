// Actual renderer controller → native credential reader/HTTP worker → core planner/transaction.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {createServer} from 'node:http';
import {Window} from 'happy-dom';
import {mountRewrite} from '../dist-tests/src/rewrite-ui.js';
const continuing=process.argv.includes('--continue-scene'),acceptName=continuing?'Accept Beat group':'Accept 1 change';
const path=process.argv[2];assert(path,'Pass compiled native integration driver');
let mode='valid',received=[],heldResponse;
const server=createServer(async(req,res)=>{
 assert.equal(req.url,'/v1/chat/completions');assert.equal(req.headers.authorization,'Bearer loomlight-public-rewrite-fixture');
 let body='';for await(const chunk of req)body+=chunk;received.push(body);
 const value=JSON.parse(body),user=JSON.parse(value.messages[1].content);assert.equal(value.response_format.json_schema.strict,true);assert.equal(value.enable_tools,false);assert.equal(value.stream,false);assert.equal(user.references.length,2);
 let result;
 if(continuing){const character=user.definitions.find(d=>d.kind==='character');result={schemaVersion:1,action:'continueScene',target:{sceneId:user.story.sceneId,beatId:user.story.beatId},beats:[{type:'narration',text:'New [str(7)] {a=jump:label} café 雪 <img onerror=alert(1)>'},{type:'dialogue',characterId:character.id,text:'A second line.'}]};}
 else{const segments=structuredClone(user.responseContract.segments);segments[0].literal='New [str(7)] {a=jump:label} café 雪 ';result={schemaVersion:1,action:'rewriteDialogue',target:{sceneId:user.story.sceneId,beatId:user.story.beatId},segments};}
 const send=()=>{const text=mode==='malformed'?'{"schemaVersion":1,"schemaVersion":1}':JSON.stringify(result);const response=JSON.stringify({model:value.model,choices:[{index:0,finish_reason:'stop',message:{role:'assistant',content:text}}]});res.writeHead(200,{'Content-Type':'application/json','Content-Length':Buffer.byteLength(response)});res.end(response);};
 if(mode==='delay')heldResponse=send;else send();
});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const child=spawn(path,[`http://127.0.0.1:${server.address().port}/v1`],{stdio:['pipe','pipe','inherit']});
const lines=createInterface({input:child.stdout}),queued=[],waiters=[];lines.on('line',line=>{const v=JSON.parse(line);if(waiters.length)waiters.shift()(v);else queued.push(v);});const next=()=>queued.length?Promise.resolve(queued.shift()):new Promise(r=>waiters.push(r));const first=await next();
let lane=Promise.resolve();
function raw(p){const pending=lane.then(async()=>{child.stdin.write(JSON.stringify(p)+'\n');return next();});lane=pending.catch(()=>{});return pending;}
async function call(operation,payload={}){const r=await raw({protocolVersion:1,requestId:crypto.randomUUID(),operation,payload:operation.startsWith('ai.')?payload:{...payload,sessionId:first.sessionId}});if(!r.ok)throw Object.assign(Error(r.error.message),r.error);return r.value;}
const snapshot=async()=> (await raw({driver:'snapshot'})).snapshot;
const w=new Window({url:'http://tauri.localhost'});Object.assign(globalThis,{window:w,document:w.document,HTMLElement:w.HTMLElement,Event:w.Event});
const wait=async fn=>{const start=Date.now();while(!await fn()){assert(Date.now()-start<10000,'Controller integration timeout');await new Promise(r=>setTimeout(r,10));}};
const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
const click=async text=>{await wait(()=>button(text)&&!button(text).disabled);button(text).click();};
const input=(name,text)=>{const n=document.querySelector(`[name="${name}"]`);n.value=text;n.dispatchEvent(new Event('input'));};
let controller,accepted=0;
async function mount(){controller?.dispose();const options=await call('context.options'),ws=await call('scene.list');const s=ws.scenes[0],b=continuing?s.beats.at(-1):s.beats.find(b=>b.payload.type==='narration');controller=mountRewrite(document.body,s.id,b.id,{current:()=>true,call,accepted:()=>accepted++},continuing?'continueScene':'rewriteDialogue');await wait(()=>!document.querySelector('[name="rewriteTask"]').disabled);input('rewriteTask','Keep the meaning.');const checks=[...document.querySelectorAll('fieldset input')];assert.equal(checks.length,2);for(const check of checks){check.checked=true;check.dispatchEvent(new Event('change'));}return options;}
async function prepare(){await click('Review complete send');await wait(()=>!button('Generate proposal').disabled);const text=[...document.querySelectorAll('.rewrite-result section')].find(s=>s.querySelector('h4')?.textContent==='Complete exact request body').querySelector('pre').textContent;return text;}
async function generate(){const n=received.length;await click('Generate proposal');await wait(()=>received.length>n);}
try{
 await mount();const before=await snapshot(),body=await prepare();assert.deepEqual(await snapshot(),before);await generate();await wait(()=>!button(acceptName).disabled);assert.equal(received.at(-1),body);assert.deepEqual(await snapshot(),before);
 await raw({driver:'hold'});await click(acceptName);await wait(()=>document.querySelector('[role="status"]').textContent.includes('Another request is in progress'));assert.equal(accepted,0);await raw({driver:'release'});assert.deepEqual(await snapshot(),before);
 await click(acceptName);await wait(()=>accepted===1);const after=await snapshot();const sourcePath=Object.keys(after).find(p=>p.includes('chapters')&&p.endsWith('.rpy'));assert.notDeepEqual(after[sourcePath],before[sourcePath]);assert.equal(button(acceptName).disabled,true);let ws=await call('scene.list');await call('scene.apply',{expectedProjectRevision:ws.projectRevision,expectedSourceMapRevision:ws.sourceMapRevision,command:{type:'undo'}});assert.deepEqual((await snapshot())[sourcePath],before[sourcePath]);ws=await call('scene.list');await call('scene.apply',{expectedProjectRevision:ws.projectRevision,expectedSourceMapRevision:ws.sourceMapRevision,command:{type:'redo'}});assert.deepEqual((await snapshot())[sourcePath],after[sourcePath]);
 mode='malformed';await mount();const invalid=await snapshot();await prepare();await generate();await wait(()=>button('Review complete send').disabled===false&&button('Cancel request').disabled===true);assert.equal(button(acceptName).disabled,true);assert.deepEqual(await snapshot(),invalid);assert.equal(document.querySelector('[name="rewriteTask"]').value,'Keep the meaning.');
 mode='delay';heldResponse=undefined;await mount();const cancelled=await snapshot();await prepare();await generate();await click('Cancel request');await wait(()=>!button('Review complete send').disabled);heldResponse?.();assert.deepEqual(await snapshot(),cancelled);assert.equal(button(acceptName).disabled,true);
 mode='delay';heldResponse=undefined;await mount();await prepare();await generate();const prompt=await call('prompts.list');await call('prompts.apply',{expectedRevision:prompt.revision,command:{type:'save',text:'Save stays responsive while generation waits.'}});const stale=await snapshot();heldResponse();await wait(()=>!button('Review complete send').disabled&&button('Cancel request').disabled);assert.equal(button(acceptName).disabled,true);assert.deepEqual(await snapshot(),stale);
 assert.equal(document.querySelector('img,script'),null);
 console.log('PASS: actual controller/native credentials/exact strict-schema HTTP, inert review, held-owner refusal, one acceptance/Undo/Redo, malformed/cancelled/stale zero writes and responsive Save');
}finally{controller?.dispose();await w.happyDOM.close();child.stdin.end();await new Promise((r,j)=>child.on('exit',code=>code===0?r():j(Error(`Driver exit ${code}`))));await new Promise(r=>server.close(r));}
