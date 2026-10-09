// Narrow real controller → production dispatch → transaction integration, no WebView mock.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {Window} from 'happy-dom';
import {mountPromptPreparation} from '../dist-tests/src/prompt-ui.js';
const process=spawn(processPath(),[],{stdio:['pipe','pipe','inherit']});
function processPath(){const path=globalThis.process.argv[2];assert(path,'Pass the compiled production driver path');return path;}
const lines=createInterface({input:process.stdout});const queued=[];const waiters=[];
lines.on('line',line=>{const value=JSON.parse(line);if(waiters.length)waiters.shift()(value);else queued.push(value);});
const next=()=>queued.length?Promise.resolve(queued.shift()):new Promise(resolve=>waiters.push(resolve));
const first=await next();
async function call(operation,payload={}){const request={protocolVersion:1,requestId:crypto.randomUUID(),operation,payload:{sessionId:first.sessionId,...payload}};process.stdin.write(JSON.stringify(request)+'\n');const r=await next();if(!r.ok)throw Object.assign(Error(r.error.message),r.error);return r.value;}
const w=new Window({url:'http://tauri.localhost'});Object.assign(globalThis,{window:w,document:w.document,HTMLElement:w.HTMLElement,HTMLInputElement:w.HTMLInputElement,HTMLTextAreaElement:w.HTMLTextAreaElement,HTMLSelectElement:w.HTMLSelectElement,Event:w.Event});document.body.innerHTML='<main></main>';
const wait=async fn=>{const start=Date.now();while(!await fn()){assert(Date.now()-start<10000,'Controller integration timed out');await new Promise(r=>setTimeout(r,10));}};
const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
const click=async text=>{await wait(()=>button(text)&&!button(text).disabled);button(text).click();await wait(()=>document.querySelector('.prompt-preparation')?.dataset.busy==='false');};
const input=(name,text)=>{const n=document.querySelector(`[name="${name}"]`);n.value=text;n.dispatchEvent(new Event('input'));};
let controller;
try{
 process.stdin.write(JSON.stringify({driver:'hold'})+'\n');assert.equal((await next()).driver,'held');
 controller=mountPromptPreparation(document.querySelector('main'),{current:()=>true,load:()=>call('context.options'),apply:(command,expectedRevision)=>call('prompts.apply',{command,expectedRevision}),preview:payload=>call('context.preview',payload)});
 await wait(()=>document.querySelector('.prompt-preparation')?.dataset.busy==='false');
 assert.match(document.querySelector('.prompt-notice').textContent,/Another request is in progress/);
 assert.equal(button('Reload project prompts')?.disabled,false,'Actual busy host must leave an enabled recovery action');
 process.stdin.write(JSON.stringify({driver:'release'})+'\n');assert.equal((await next()).driver,'released');
 await click('Reload project prompts');assert.equal(document.querySelector('[name="systemPrompt"]').disabled,false);
 input('systemPrompt','Controller custom café 雪\r\nLiteral {{text}}');await click('Save prompt');const saved=await call('prompts.list');assert.equal(saved.effectiveText,'Controller custom café 雪\r\nLiteral {{text}}');assert.equal(saved.customized,true);
 await click('Restore baseline');assert.equal(document.querySelector('.prompt-restore').hidden,false);await click('Cancel restore');assert.equal((await call('prompts.list')).effectiveText,saved.effectiveText);
 await click('Restore baseline');await click('Confirm restore baseline');assert.equal((await call('prompts.list')).customized,false);await click('Undo project change');assert.equal((await call('prompts.list')).effectiveText,saved.effectiveText);await click('Redo project change');assert.equal((await call('prompts.list')).customized,false);
 await click('Context preparation');input('task','Retain intent');await click('Build context preview');assert(document.querySelector('[data-exact-payload]'));assert.equal(JSON.parse(document.querySelector('[data-exact-payload]').textContent).messages[0].content,saved.baselineText);
 input('contextBudget','256');await click('Build context preview');assert.equal(document.querySelector('.prompt-preparation').dataset.errorCode,'CONTEXT_BUDGET');assert.equal(document.querySelector('[data-exact-payload]'),null);assert.equal(document.querySelector('[name="task"]').value,'Retain intent');
 console.log('PASS: actual prompt controller → held ApplicationHost refusal/reload → persisted Save/restore/history and bounded preview/refusal');
}finally{controller?.dispose();await w.happyDOM.close();process.stdin.end();await new Promise((resolve,reject)=>process.on('exit',code=>code===0?resolve():reject(Error(`Driver exit ${code}`))));}
