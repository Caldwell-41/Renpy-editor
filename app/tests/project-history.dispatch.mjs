// Project Undo and Redo across workspaces: actual main controls -> Help driver -> ApplicationHost history.
// No SDK, helper or native claim; happy-dom key events are synthetic.
import assert from 'node:assert/strict';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {Window} from 'happy-dom';
import {driverProcess} from './phase2-driver-process.mjs';
import {createRequest} from '../dist-tests/src/protocol.js';
const output=resolve(process.env.PROJECT_HISTORY_OUTPUT??`../.toolchains/project-history/journey-${randomUUID()}`);await mkdir(output,{recursive:true});
const scratch=join(output,`loomlight-help-controller-${randomUUID()}`),child=driverProcess(resolve(process.env.CARGO_TARGET_DIR??'target','debug/examples/help-controller-driver'+(process.platform==='win32'?'.exe':'')),[scratch]);
const browser=new Window({url:'http://tauri.localhost'});Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement,HTMLInputElement:browser.HTMLInputElement,HTMLTextAreaElement:browser.HTMLTextAreaElement,HTMLSelectElement:browser.HTMLSelectElement,HTMLButtonElement:browser.HTMLButtonElement,HTMLDetailsElement:browser.HTMLDetailsElement,ResizeObserver:browser.ResizeObserver,Event:browser.Event,KeyboardEvent:browser.KeyboardEvent,MouseEvent:browser.MouseEvent});
const result={passed:false,actualMain:true,actualCore:true,sdkExecuted:false,stages:[],transcript:[]};let session,inflight=0;
async function request(operation,payload={},ui=false){if(ui&&operation==='screens.canvasRender')return {protocolVersion:1,requestId:'offline-canvas',ok:true,value:{phase:'unavailable',message:'Offline journey; no helper started.'}};inflight++;try{const response=await child.request(createRequest(operation,payload));result.transcript.push({operation,ok:response.ok,code:response.error?.code,ui});if(response.ok&&operation==='project.openRecent')session=response.value.sessionId;return response;}finally{inflight--;}}
const call=async(operation,payload={})=>{const r=await request(operation,{...payload,...(session&&!['project.listRecent','project.openRecent'].includes(operation)?{sessionId:session}:{})});if(!r.ok)throw Object.assign(Error(r.error.message),r.error);return r.value;};
const wait=async(check,label='condition')=>{const until=Date.now()+8000;while(!await check()){assert(Date.now()<until,`Project history journey timed out: ${label}`);await new Promise(r=>setTimeout(r,10));}};
const settle=async()=>{await new Promise(r=>setTimeout(r,150));await wait(()=>inflight===0,'requests');};
const button=(text,scope=document)=>{const b=[...scope.querySelectorAll('button')].find(b=>(b.textContent===text||b.getAttribute('aria-label')===text||b.ariaLabel===text)&&!b.disabled);assert(b,`Missing enabled ${text}`);b.click();return b;};
const app=()=>document.querySelector('#app'),status=()=>document.querySelector('#app-status')?.textContent;
const mac=/Mac|iPhone|iPad|iPod/.test(window.navigator.platform);
const historyRequests=()=>result.transcript.filter(t=>t.ui&&t.operation.startsWith('history.')&&t.operation!=='history.state').length;
const workspace=()=>document.querySelector('.story-sidebar .tree-item.selected')?.textContent;
// The Screens selection path ends at the selected element in every step.
const selectedElement=()=>[...document.querySelectorAll('.screen-selection-path button')].at(-1)?.textContent??'';
const undoButton=()=>document.querySelector('.app-header [data-history="undo"]'),redoButton=()=>document.querySelector('.app-header [data-history="redo"]');
// The header buttons and the shortcut both report their run on the app root.
async function step(run,label){const before=Number(app().dataset.historySequence??0);run();await wait(()=>Number(app().dataset.historySequence??0)>before,label);await settle();return app().dataset.historyOutcome;}
async function header(direction){await wait(()=>(direction==='undo'?undoButton():redoButton())?.getAttribute('aria-disabled')==='false',`header ${direction} enabled`);return step(()=>(direction==='undo'?undoButton():redoButton()).click(),`header ${direction}`);}
const key=(target,{shiftKey=false,y=false}={})=>{const event=new KeyboardEvent('keydown',{key:y?'y':'z',shiftKey,metaKey:mac,ctrlKey:!mac,bubbles:true,cancelable:true});target.dispatchEvent(event);return event;};
async function shortcut(direction){return step(()=>key(document.body,{shiftKey:direction==='redo'}),`shortcut ${direction}`);}
const source=async path=>(await call('source.open',{path})).text;
const stage=text=>{result.stages.push(text);console.log(text);};
async function storyEdit(text){
 const scene=(await call('scene.list')).scenes[0],beat=scene.beats.find(b=>b.payload.type==='narration');assert(beat,'fixture narration beat');
 const select=document.querySelector(`[data-beat-id="${beat.id}"] .beat-select`);if(select.ariaExpanded!=='true')select.click();await wait(()=>document.querySelector(`[data-beat-id="${beat.id}"] textarea`),'narration editor');
 const field=document.querySelector(`[data-beat-id="${beat.id}"] textarea`);field.value=text;field.dispatchEvent(new Event('input',{bubbles:true}));
 button('Commit Beat',document.querySelector(`[data-beat-id="${beat.id}"]`));await wait(async()=>(await source(scene.sourcePath)).includes(text),'Story commit reaches source');await settle();
 return {scene,beat};
}
try{
 assert.equal((await child.next()).ready,true);document.body.innerHTML='<div id="app"></div>';const {startApplication}=await import('../dist-tests/src/main.js');startApplication((op,payload)=>request(op,payload,true));
 await wait(()=>document.querySelector('.recent-open')&&!document.querySelector('.recent-open').disabled,'recent');document.querySelector('.recent-open').click();await wait(()=>document.querySelector('.beat-card'),'story');await settle();
 assert.equal(undoButton().getAttribute('aria-disabled'),'true');assert.equal(undoButton().getAttribute('aria-label'),'Undo');
 assert.match(undoButton().parentElement.querySelector('.header-history-tip').textContent,/^Nothing to undo/);
 // Disposable public-core setup: an owned screen with a Start button.
 const catalog=await call('screens.list'),made=await call('screens.create',{name:'main_menu',expectedProjectRevision:catalog.projectRevision,expectedSourceMapRevision:catalog.sourceMapRevision,expectedInventoryRevision:catalog.inventoryRevision}),owner=made.owned.find(o=>o.name==='main_menu');
 let doc=await call('screens.inspect',{path:owner.path});
 const start=(await call('screens.compose',{screenId:owner.id,expectedRevision:doc.revision,command:{type:'add',parentId:owner.rootId,kind:'textbutton',text:'Start'}})).selectedId;

 // Reload Story after the setup writes, then commit a Story edit, resize the Screens button and return to Story.
 button('Screens');await wait(()=>document.querySelector('.screen-picker select'),'screens');await settle();button('Story');await wait(()=>workspace()==='Story'&&document.querySelector('.beat-card'),'fresh Story');await settle();
 const {scene}=await storyEdit('Foundation continuation, edited');
 button('Screens');await wait(()=>document.querySelector('.screen-picker select'),'screens');await settle();
 const picker=document.querySelector('.screen-picker select');picker.value=JSON.stringify(['owned',owner.id]);picker.dispatchEvent(new Event('change',{bubbles:true}));await settle();
 document.querySelector(`[data-node-id="${start}"]`).dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));await settle();
 const width=document.querySelector('.screens-editor [data-layout-field="xsize"]');assert(width,'button width field');width.value='280';width.dispatchEvent(new Event('input',{bubbles:true}));
 const beforeResize=await source(owner.path);width.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));await wait(async()=>(await source(owner.path)).includes('xsize 280'),'resize');await settle();const resized=await source(owner.path);
 button('Story');await wait(()=>workspace()==='Story'&&document.querySelector('.beat-card'),'back to Story');await settle();
 await wait(()=>undoButton().getAttribute('aria-label')==='Undo button resize','header names the resize');
 assert.match(undoButton().parentElement.querySelector('.header-history-tip').textContent,/^Undo button resize(⌘Z|Ctrl\+Z)$/);
 stage('Story edit, then Screens resize, then Story: the header names the latest edit');

 // Header Undo from Story reverses the resize and opens Screens with the button selected.
 assert.equal(await header('undo'),'committed');
 assert.equal(await source(owner.path),beforeResize,'Undo reverses the resize');
 await wait(()=>workspace()==='Screens'&&/Start/.test(selectedElement()),'Screens selects the button');
 assert.equal(status(),'Undone: button resize');assert.equal(redoButton().getAttribute('aria-label'),'Redo button resize');
 const buttonUndo={source:await source(owner.path),workspace:workspace(),selected:selectedElement(),status:status()};
 assert(scene.beats.length&&(await source(scene.sourcePath)).includes('Foundation continuation, edited'),'Undo leaves the older Story edit');
 stage('header Undo from Story reverses the resize, opens Screens with the button selected and reports its name');

 // Shift+Cmd/Ctrl+Z restores it; Cmd/Ctrl+Z from Story then gives the button's result.
 assert.equal(await shortcut('redo'),'committed');assert.equal(await source(owner.path),resized);assert.equal(status(),'Redone: button resize');
 await wait(()=>/Start/.test(selectedElement()),'Redo selects the button');
 button('Story');await wait(()=>workspace()==='Story'&&document.querySelector('.beat-card'),'Story again');await settle();
 assert.equal(await shortcut('undo'),'committed');await wait(()=>workspace()==='Screens'&&/Start/.test(selectedElement()),'shortcut reveal');
 assert.deepEqual({source:await source(owner.path),workspace:workspace(),selected:selectedElement(),status:status()},buttonUndo,'Cmd/Ctrl+Z gives the header button result');
 assert.equal(await header('redo'),'committed');assert.equal(await source(owner.path),resized);
 if(!mac){assert.equal(await shortcut('undo'),'committed');assert.equal(await step(()=>key(document.body,{y:true}),'Ctrl+Y'),'committed');assert.equal(await source(owner.path),resized,'Ctrl+Y redoes');}
 stage('Shift+Cmd/Ctrl+Z and the header Redo restore the resize; Cmd/Ctrl+Z matches the header Undo');
 // A native modal dialog owns the shortcut too.
 button('View in Source');await wait(()=>document.querySelector('.screen-source-dialog[open]'),'source dialog');await settle();
 let requests=historyRequests(),event=key(document.querySelector('.screen-source-dialog button'));await settle();
 assert.equal(historyRequests(),requests,'An open dialog keeps Cmd/Ctrl+Z');assert.equal(event.defaultPrevented,false);assert.equal(await source(owner.path),resized);
 button('Close source');await wait(()=>!document.querySelector('.screen-source-dialog[open]'),'source dialog closed');
 stage('an open Screens dialog keeps Cmd/Ctrl+Z');

 // A text field keeps its own text Undo: Find a file, then the Source editor.
 const fileSearch=()=>[...document.querySelectorAll('input[type="search"]')].find(n=>n.ariaLabel==='Find a file');
 button('Source');await wait(fileSearch,'Source');await settle();
 const find=fileSearch();find.focus();find.value='scene';find.dispatchEvent(new Event('input',{bubbles:true}));
 requests=historyRequests();event=key(find);await settle();
 assert.equal(event.defaultPrevented,false,'Cmd/Ctrl+Z stays with the search field');assert.equal(historyRequests(),requests);assert.equal(find.value,'scene');assert.equal(await source(owner.path),resized);
 const editor=document.querySelector('.source-editor');if(editor){editor.focus();event=key(editor);await settle();assert.equal(event.defaultPrevented,false);assert.equal(historyRequests(),requests,'The Source editor keeps its text Undo');}
 stage('Cmd/Ctrl+Z in the file search and the Source editor changes only that field');

 // An open Story form refuses Undo like any navigation and keeps its input.
 button('Story');await wait(()=>workspace()==='Story'&&document.querySelector('.beat-card'),'Story for form');await settle();
 button(`Rename scene ${scene.displayName}`);const rename=document.querySelector('.tree-inline input');assert(rename,'rename form');rename.value='Unsaved name';rename.dispatchEvent(new Event('input',{bubbles:true}));
 requests=historyRequests();assert.equal(await header('undo'),'blocked');assert.equal(historyRequests(),requests,'No history request while a Story form is open');
 assert.match(status(),/Finish the open Story form/);assert.equal(document.querySelector('.tree-inline input')?.value,'Unsaved name','The form keeps its input');assert.equal(await source(owner.path),resized);
 button('Cancel',document.querySelector('.tree-inline'));await settle();
 stage('an open Story form stops Undo with its input kept and the existing message');

 // Until #113, Undo waits while a beat draft exists.
 const narration=(await call('scene.list')).scenes[0].beats.find(b=>b.payload.type==='narration');
 const select=document.querySelector(`[data-beat-id="${narration.id}"] .beat-select`);if(select.ariaExpanded!=='true')select.click();await wait(()=>document.querySelector(`[data-beat-id="${narration.id}"] textarea`),'draft editor');
 const draft=document.querySelector(`[data-beat-id="${narration.id}"] textarea`);draft.value='Draft that must stay';draft.dispatchEvent(new Event('input',{bubbles:true}));await settle();
 requests=historyRequests();assert.equal(await shortcut('undo'),'blocked');assert.equal(historyRequests(),requests);assert.match(status(),/Commit or cancel beat drafts before Undo or Redo/);
 assert.equal(document.querySelector(`[data-beat-id="${narration.id}"] textarea`)?.value,'Draft that must stay');
 button('Cancel',document.querySelector(`[data-beat-id="${narration.id}"]`));await settle();
 stage('Undo and Redo still wait while a beat draft exists (#113 removes this)');

 // System prompts: a prompt edit, then a Story edit. Settings is a dialog, so it owns the shortcut.
 const baseline=(await call('prompts.list')).effectiveText;
 button('Settings');await wait(()=>document.querySelector('.settings-overlay'),'Settings');button('Current project');await wait(()=>document.querySelector('[name="systemPrompt"]')&&document.querySelector('.prompt-preparation')?.dataset.busy==='false','System prompts');
 const prompt=document.querySelector('[name="systemPrompt"]');prompt.value='Project prompt for the history journey';prompt.dispatchEvent(new Event('input',{bubbles:true}));
 button('Save prompt');await wait(async()=>(await call('prompts.list')).customized,'prompt saved');await settle();
 requests=historyRequests();event=key(document.querySelector('.settings-overlay'));await settle();assert.equal(historyRequests(),requests,'An open dialog keeps Cmd/Ctrl+Z');assert.equal(event.defaultPrevented,false);
 button('Close settings');await wait(()=>!document.querySelector('.settings-overlay'),'Settings closed');
 const edited=await storyEdit('Foundation continuation, after the prompt');
 assert.equal(await header('undo'),'committed');await wait(()=>workspace()==='Story'&&document.querySelector('.beat-card'),'Story opens');
 assert(!(await source(edited.scene.sourcePath)).includes('after the prompt'),'Undo reverses the Story edit');assert.match(status(),/^Undone: narration edit in /);
 assert.equal(await header('undo'),'committed');
 await wait(()=>document.querySelector('.settings-overlay [name="systemPrompt"]')&&document.querySelector('.prompt-preparation')?.dataset.busy==='false','Settings reopens at System prompts');
 assert.equal(document.querySelector('[name="assistanceAction"]').value,'rewriteDialogue');assert.equal(document.querySelector('[name="systemPrompt"]').value,baseline);assert.equal((await call('prompts.list')).customized,false);
 assert.equal(status(),'Undone: system prompt edit');button('Close settings');await settle();
 stage('after closing Settings, the header Undo reverses the Story edit and opens Story, then the prompt edit and opens System prompts');
 result.passed=true;console.log(`PASS project history journey: ${result.stages.length} stages`);
}finally{await browser.happyDOM.close();try{await child.stop();result.driver=child.exitStatus();await assert.rejects(access(scratch));result.cleanupComplete=true;}finally{await writeFile(join(output,'project-history.json'),JSON.stringify({...result,transcript:result.transcript.length},null,1));}}
