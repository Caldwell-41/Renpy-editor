// Project Undo and Redo across workspaces: actual main controls -> Help driver -> ApplicationHost history.
// No SDK, helper or native claim; happy-dom key events are synthetic.
import assert from 'node:assert/strict';
import {mkdir,writeFile,access,readdir,readFile,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
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
// "Undone: …" and "Redone: …" appear in the bottom status bar (story-combined-status header-v2).
const message=()=>document.querySelector('#app-message')?.textContent;
const mac=/Mac|iPhone|iPad|iPod/.test(window.navigator.platform);
// A public command outside the shell's controls: reload Story so the header reads the history again.
async function refreshHistoryView(){button('Source');await wait(()=>workspace()==='Source','Source');await settle();button('Story');await wait(()=>workspace()==='Story','Story');await settle();}
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
// Every project file's hash and modification time: a draft-step Undo must change none of them.
async function disk(dir=join(scratch,'synthetic-project'),prefix='',files={}){
 for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name),name=prefix+entry.name;
  if(entry.isDirectory())await disk(path,`${name}/`,files);else files[name]=`${createHash('sha256').update(await readFile(path)).digest('hex')}@${(await stat(path)).mtimeMs}`;}
 return files;
}
const stage=text=>{result.stages.push(text);console.log(text);};
async function storyEdit(text){
 const scene=(await call('scene.list')).scenes[0],beat=scene.beats.find(b=>b.payload.type==='narration');assert(beat,'fixture narration beat');
 const select=document.querySelector(`.story-track-column[data-beat-id="${beat.id}"] > .story-track-beat`);if(select.dataset.selected!=='true')select.click();await wait(()=>document.querySelector(`.story-editor[data-editor-for="${beat.id}"] textarea`),'narration editor');
 const field=document.querySelector(`.story-editor[data-editor-for="${beat.id}"] textarea`);field.value=text;field.dispatchEvent(new Event('input',{bubbles:true}));
 button('Commit Beat',document.querySelector(`.story-editor[data-editor-for="${beat.id}"]`));await wait(async()=>(await source(scene.sourcePath)).includes(text),'Story commit reaches source');await settle();
 return {scene,beat};
}
try{
 assert.equal((await child.next()).ready,true);document.body.innerHTML='<div id="app"></div>';const {startApplication}=await import('../dist-tests/src/main.js');startApplication((op,payload)=>request(op,payload,true));
 await wait(()=>document.querySelector('.recent-open')&&!document.querySelector('.recent-open').disabled,'recent');document.querySelector('.recent-open').click();await wait(()=>document.querySelector('.story-track-column'),'story');await settle();
 assert.equal(undoButton().getAttribute('aria-disabled'),'true');assert.equal(undoButton().getAttribute('aria-label'),'Undo');
 assert.match(undoButton().parentElement.querySelector('.header-history-tip').textContent,/^Nothing to undo/);
 // Disposable public-core setup: an owned screen with a Start button.
 const catalog=await call('screens.list'),made=await call('screens.create',{name:'main_menu',expectedProjectRevision:catalog.projectRevision,expectedSourceMapRevision:catalog.sourceMapRevision,expectedInventoryRevision:catalog.inventoryRevision}),owner=made.owned.find(o=>o.name==='main_menu');
 let doc=await call('screens.inspect',{path:owner.path});
 const start=(await call('screens.compose',{screenId:owner.id,expectedRevision:doc.revision,command:{type:'add',parentId:owner.rootId,kind:'textbutton',text:'Start'}})).selectedId;

 // Reload Story after the setup writes, then commit a Story edit, resize the Screens button and return to Story.
 button('Screens');await wait(()=>document.querySelector('.screen-picker select'),'screens');await settle();button('Story');await wait(()=>workspace()==='Story'&&document.querySelector('.story-track-column'),'fresh Story');await settle();
 const {scene}=await storyEdit('Foundation continuation, edited');
 button('Screens');await wait(()=>document.querySelector('.screen-picker select'),'screens');await settle();
 const picker=document.querySelector('.screen-picker select');picker.value=JSON.stringify(['owned',owner.id]);picker.dispatchEvent(new Event('change',{bubbles:true}));await settle();
 document.querySelector(`[data-node-id="${start}"]`).dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));await settle();
 const width=document.querySelector('.screens-editor [data-layout-field="xsize"]');assert(width,'button width field');width.value='280';width.dispatchEvent(new Event('input',{bubbles:true}));
 const beforeResize=await source(owner.path);width.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));await wait(async()=>(await source(owner.path)).includes('xsize 280'),'resize');await settle();const resized=await source(owner.path);
 button('Story');await wait(()=>workspace()==='Story'&&document.querySelector('.story-track-column'),'back to Story');await settle();
 await wait(()=>undoButton().getAttribute('aria-label')==='Undo button resize','header names the resize');
 assert.match(undoButton().parentElement.querySelector('.header-history-tip').textContent,/^Undo button resize(⌘Z|Ctrl\+Z)$/);
 stage('Story edit, then Screens resize, then Story: the header names the latest edit');

 // Header Undo from Story reverses the resize and opens Screens with the button selected.
 assert.equal(await header('undo'),'committed');
 assert.equal(await source(owner.path),beforeResize,'Undo reverses the resize');
 await wait(()=>workspace()==='Screens'&&/Start/.test(selectedElement()),'Screens selects the button');
 assert.equal(message(),'Undone: button resize');assert.equal(redoButton().getAttribute('aria-label'),'Redo button resize');
 const buttonUndo={source:await source(owner.path),workspace:workspace(),selected:selectedElement(),status:status()};
 assert(scene.beats.length&&(await source(scene.sourcePath)).includes('Foundation continuation, edited'),'Undo leaves the older Story edit');
 stage('header Undo from Story reverses the resize, opens Screens with the button selected and reports its name');

 // Shift+Cmd/Ctrl+Z restores it; Cmd/Ctrl+Z from Story then gives the button's result.
 assert.equal(await shortcut('redo'),'committed');assert.equal(await source(owner.path),resized);assert.equal(message(),'Redone: button resize');
 await wait(()=>/Start/.test(selectedElement()),'Redo selects the button');
 button('Story');await wait(()=>workspace()==='Story'&&document.querySelector('.story-track-column'),'Story again');await settle();
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

 // A text field whose input does not survive navigation keeps its own text Undo: Find a file.
 const fileSearch=()=>[...document.querySelectorAll('input[type="search"]')].find(n=>n.ariaLabel==='Find a file');
 button('Source');await wait(fileSearch,'Source');await settle();
 const find=fileSearch();find.focus();find.value='scene';find.dispatchEvent(new Event('input',{bubbles:true}));
 requests=historyRequests();event=key(find);await settle();
 assert.equal(event.defaultPrevented,false,'Cmd/Ctrl+Z stays with the search field');assert.equal(historyRequests(),requests);assert.equal(find.value,'scene');assert.equal(await source(owner.path),resized);
 stage('Cmd/Ctrl+Z in the file search changes only that field');

 // An open Story form refuses Undo like any navigation and keeps its input.
 button('Story');await wait(()=>workspace()==='Story'&&document.querySelector('.story-track-column'),'Story for form');await settle();
 button(`Rename scene ${scene.displayName}`);const rename=document.querySelector('.tree-inline input');assert(rename,'rename form');rename.value='Unsaved name';rename.dispatchEvent(new Event('input',{bubbles:true}));
 requests=historyRequests();assert.equal(await header('undo'),'blocked');assert.equal(historyRequests(),requests,'No history request while a Story form is open');
 assert.match(status(),/Finish the open Story form/);assert.equal(document.querySelector('.tree-inline input')?.value,'Unsaved name','The form keeps its input');assert.equal(await source(owner.path),resized);
 button('Cancel',document.querySelector('.tree-inline'));await settle();
 stage('an open Story form stops Undo with its input kept and the existing message');

 // Beat draft steps (#113). A is the root narration, B the dialogue in the true branch.
 const current=(await call('scene.list')).scenes[0],path=current.sourcePath,sceneName=current.displayName;
 const beatA=current.beats.find(b=>b.payload.type==='narration'),beatB=current.beats.find(b=>b.payload.type==='dialogue'&&b.payload.text.startsWith('True'));assert(beatA&&beatB,'fixture beats A and B');
 // Tracks shows a beat as a column; its editor sits beside the stage. B needs its branch open.
 const row=id=>document.querySelector(`.story-track-column[data-beat-id="${id}"]`),editorFor=id=>document.querySelector(`.story-editor[data-editor-for="${id}"]`),field=id=>editorFor(id)?.querySelector('textarea'),marked=id=>row(id)?.dataset.beatDraft==='true';
 const open=async id=>{if(!field(id)){if(!row(id))[...document.querySelectorAll('.story-branch-segment')].find(item=>item.dataset.branchId===beatB.owner.branchId).click();await wait(()=>row(id),`column for ${id}`);row(id).querySelector('.story-track-beat').click();await wait(()=>field(id),`editor for ${id}`);}return field(id);};
 const input=(control,value,type='input')=>{control.focus();control.value=value;control.dispatchEvent(new Event(type,{bubbles:true}));};
 const type=async(id,text)=>{const control=await open(id);input(control,text);await settle();return control;};
 const named=direction=>(direction==='undo'?undoButton():redoButton()).getAttribute('aria-label');
 const historyNow=()=>call('history.state');
 const newBeat=()=>document.querySelector('.scene-workspace .new-beat'),beatType=()=>newBeat()?.querySelector(':scope > .field select');
 const headerSave=async check=>{button('Save',document.querySelector('.app-header'));await wait(check,'Story Save');await settle();};
 const original=await source(path),files=await disk(),prior=(await historyNow()).undo;assert.equal(prior.name,'button resize');

 // A beat field change is a draft step. Cmd/Ctrl+Z in the focused field and the header Undo reverse it the same way, and neither writes.
 let typed=await type(beatA.id,'Draft A typed');
 await wait(()=>named('undo')===`Undo narration typing in ${sceneName}`,'the header names the typing step');assert.equal(marked(beatA.id),true);
 assert.equal(await step(()=>{event=key(typed);},'Cmd/Ctrl+Z in a beat field'),'committed');assert.equal(event.defaultPrevented,true,'the beat field gives Cmd/Ctrl+Z to project Undo');
 const reversed=async()=>({text:(await open(beatA.id)).value,marked:marked(beatA.id),status:message(),redo:named('redo'),workspace:workspace()});
 const byShortcut=await reversed();
 assert.deepEqual(byShortcut,{text:beatA.payload.text,marked:false,status:`Undone: narration typing in ${sceneName}`,redo:`Redo narration typing in ${sceneName}`,workspace:'Story'});
 assert.deepEqual(await disk(),files,'Undo of a draft step writes nothing');
 assert.equal(await shortcut('redo'),'committed');assert.equal((await open(beatA.id)).value,'Draft A typed');assert.equal(marked(beatA.id),true);
 assert.deepEqual(await disk(),files,'Redo of a draft step writes nothing');
 (await open(beatA.id)).focus();assert.equal(await header('undo'),'committed');
 assert.deepEqual(await reversed(),byShortcut,'the header Undo gives the Cmd/Ctrl+Z result');
 assert.deepEqual((await historyNow()).undo,prior);assert.deepEqual(await disk(),files);
 stage('a beat draft change is a draft step; Cmd/Ctrl+Z in the beat field and the header Undo reverse it alike and write nothing');

 // A text step ends after 2 seconds without typing or when its field loses focus. Each other control change is one step.
 typed=await type(beatA.id,'One');await new Promise(r=>setTimeout(r,2100));
 input(typed,'One two');typed.blur();input(typed,'One two three');await settle();
 for(const expected of ['One two','One',beatA.payload.text]){assert.equal(await header('undo'),'committed');assert.equal((await open(beatA.id)).value,expected);}
 assert.equal(marked(beatA.id),false,'Undo past the first step ends the draft');
 button('Add Beat',document.querySelector('.scene-workspace .scene-history'));await wait(newBeat,'new beat');await settle();
 await wait(()=>named('undo')===`Undo new dialogue draft in ${sceneName}`,'adding a beat is its first step');
 input(beatType(),'narration','change');await settle();input(newBeat().querySelector('textarea'),'New narration');await settle();
 assert.equal(await header('undo'),'committed');assert.equal(beatType().value,'narration');assert.equal(newBeat().querySelector('textarea').value,'');
 assert.equal(await header('undo'),'committed');assert.equal(beatType().value,'dialogue','a menu change is one step');
 assert.equal(await header('undo'),'committed');assert.equal(newBeat(),null,'Undo of adding the beat ends its draft');
 for(let i=0;i<3;i+=1)assert.equal(await header('redo'),'committed');
 assert.equal(beatType().value,'narration');assert.equal(newBeat().querySelector('textarea').value,'New narration');
 // Cancel is an edit: Undo brings the draft back, and Redo cancels it again.
 button('Cancel',newBeat());await settle();assert.equal(newBeat(),null);assert.equal(named('undo'),`Undo cancel of narration draft in ${sceneName}`);
 assert.equal(await header('undo'),'committed');assert.equal(newBeat()?.querySelector('textarea').value,'New narration','Undo of Cancel brings the draft back');
 assert.equal(await header('redo'),'committed');assert.equal(newBeat(),null);assert.deepEqual(await disk(),files);
 stage('text steps end on a 2 second pause or blur, a menu change is one step, and Cancel is an edit that Undo reverses');

 // Type in A, commit an edit in B, then return to A without editing: Undo reverses B, then A's typing.
 const beforeAB=(await historyNow()).undo;await type(beatA.id,'A typing');
 await type(beatB.id,'B committed');button('Commit Beat',editorFor(beatB.id));await wait(async()=>(await source(path)).includes('B committed'),'B commit');await settle();
 const afterCommit=await historyNow();assert.equal(afterCommit.undo.name,`dialogue edit in ${sceneName}`);
 for(const name of ['Screens','Branches']){button(name);await wait(()=>workspace()===name,name);await settle();}
 button('Story');await wait(()=>workspace()==='Story'&&row(beatA.id),'Story');await settle();
 assert.equal((await open(beatA.id)).value,'A typing','A keeps its draft through navigation');
 assert.deepEqual(await historyNow(),afterCommit,'selecting beats and changing workspace add no entries');
 assert.equal(await header('undo'),'committed');assert.equal(await source(path),original,'Undo reverses B first, to the exact bytes');
 assert.equal((await open(beatA.id)).value,'A typing');const beforeA=await disk();
 assert.equal(await header('undo'),'committed');assert.equal(message(),`Undone: narration typing in ${sceneName}`);
 assert.equal((await open(beatA.id)).value,beatA.payload.text);assert.deepEqual(await disk(),beforeA);assert.deepEqual((await historyNow()).undo,beforeAB);
 stage('type in A, commit B, return to A: Undo reverses B, then the typing in A');

 // Commit joins a beat's steps into one edit on top; Story Save adds one per beat, the latest edited on top. Neither clears earlier history.
 const earlier=(await historyNow()).undo;typed=await type(beatA.id,'Joined one');typed.blur();input(typed,'Joined one two');await settle();
 button('Commit Beat',editorFor(beatA.id));await wait(async()=>(await source(path)).includes('Joined one two'),'A commit');await settle();
 assert.equal(named('undo'),`Undo narration edit in ${sceneName}`);assert.equal(await header('undo'),'committed');
 assert.equal(await source(path),original,'one Undo reverses the whole beat');assert.deepEqual((await historyNow()).undo,earlier,'Commit joined both typing steps');
 await type(beatA.id,'Saved A');await type(beatB.id,'Saved B');
 await headerSave(async()=>{const text=await source(path);return text.includes('Saved A')&&text.includes('Saved B');});const saved=await source(path);
 assert.equal(named('undo'),`Undo dialogue edit in ${sceneName}`,'the most recently edited beat is on top');
 assert.equal(await header('undo'),'committed');let text=await source(path);assert(text.includes('Saved A')&&!text.includes('Saved B'),'Undo reverses only B');
 assert.equal(named('undo'),`Undo narration edit in ${sceneName}`);assert.equal(await header('undo'),'committed');assert.equal(await source(path),original);
 assert.deepEqual((await historyNow()).undo,earlier,'Story Save clears no earlier history');
 for(let i=0;i<2;i+=1)assert.equal(await header('redo'),'committed');assert.equal(await source(path),saved);
 for(let i=0;i<2;i+=1)assert.equal(await header('undo'),'committed');assert.equal(await source(path),original);
 stage('Commit joins its typing steps into one Undo; Story Save adds one entry per beat with the latest edited on top');

 // Cancel of an existing beat's draft is an edit too. Undo of a beat delete then brings back the beat, not the draft it discarded.
 await type(beatA.id,'Discarded A');button('Cancel',editorFor(beatA.id));await settle();
 assert.equal(marked(beatA.id),false);assert.equal(named('undo'),`Undo cancel of narration draft in ${sceneName}`);
 assert.equal(await header('undo'),'committed');assert.equal((await open(beatA.id)).value,'Discarded A');assert.equal(marked(beatA.id),true);
 await open(beatA.id);button('Delete',editorFor(beatA.id).querySelector('.story-beat-menu'));button('Delete this Beat',document.querySelector('.story-operation[aria-label="Delete Beat"]'));
 await wait(async()=>!(await source(path)).includes('Foundation continuation'),'delete');await settle();
 assert.equal(await header('undo'),'committed');assert.equal(await source(path),original,'Undo brings the beat back');
 assert.equal((await open(beatA.id)).value,beatA.payload.text,'not its discarded draft');assert.equal(marked(beatA.id),false);
 assert.deepEqual((await historyNow()).undo,earlier,'the discarded draft left the history');
 stage('Undo of an existing beat Cancel restores its draft; Undo of a beat delete restores the beat but not its discarded draft');

 // A refused Story Save writes nothing and keeps every draft step; Undo then fixes the failing draft and Save succeeds.
 await type(beatA.id,'Refused save A');button('Add Beat',document.querySelector('.scene-workspace .scene-history'));await wait(newBeat,'new beat');input(beatType(),'choice','change');await settle();
 const available=()=>newBeat().querySelector('input[aria-label="Available when"]');available().checked=true;available().dispatchEvent(new Event('change',{bubbles:true}));await settle();
 const quiet=await disk();await headerSave(()=>/^Nothing saved/.test(status()));
 assert.deepEqual(await disk(),quiet,'a refused Story Save writes nothing');assert.equal(named('undo'),`Undo choice change in ${sceneName}`);
 assert.equal(await header('undo'),'committed');assert.equal(available().checked,false,'a checkbox change is one step');
 assert.equal(await header('undo'),'committed');assert.equal(beatType().value,'dialogue');await wait(()=>status()==='2 unsaved beat drafts. Ready to save.','Undo fixes the refusal');
 assert.equal(await header('undo'),'committed');assert.equal(newBeat(),null);assert.deepEqual(await disk(),quiet);
 await headerSave(async()=>(await source(path)).includes('Refused save A'));assert.equal(status(),'Saved');
 assert.equal(named('undo'),`Undo narration edit in ${sceneName}`);assert.equal(await header('undo'),'committed');assert.equal(await source(path),original);
 stage('a refused Story Save keeps the drafts and their steps; Undo repairs the draft and the next Save succeeds');

 // Source draft steps (#155), typed through the Source editor. The Source workspace opens the file and selects what changed.
 const stylePath='game/ui/a_styles.rpy',styleName='a_styles.rpy',styled=await source(stylePath);
 const sourceEditor=()=>document.querySelector('.source-workspace .source-editor');
 const openSource=async(file=stylePath)=>{if(workspace()!=='Source'){button('Source');await wait(()=>workspace()==='Source'&&sourceEditor(),'Source');await settle();}
  if(document.querySelector('.source-header h1')?.textContent!==file){[...document.querySelectorAll('.source-file-open')].find(b=>b.title===file).click();await wait(()=>document.querySelector('.source-header h1')?.textContent===file&&sourceEditor(),`open ${file}`);await settle();}
  return sourceEditor();};
 const sourceType=async(text,file=stylePath)=>{const editor=await openSource(file);input(editor,text);await settle();return editor;};
 const revealed=()=>{const editor=sourceEditor();return {workspace:workspace(),file:document.querySelector('.source-header h1')?.textContent,text:editor.value,selection:[editor.selectionStart,editor.selectionEnd]};};
 const sourceBaseline=(await historyNow()).undo;
 // Two typing steps, split by a 2 second pause, then a Story edit. Undo reverses the Story edit, then each step.
 let editor=await sourceType(`${styled}# one\n`);await wait(()=>named('undo')===`Undo Source typing in ${styleName}`,'the header names the Source typing step');
 await new Promise(r=>setTimeout(r,2100));await sourceType(`${styled}# two\n`);
 button('Story');await wait(()=>workspace()==='Story'&&document.querySelector('.story-track-column'),'Story after Source');await settle();
 const storyPath=(await call('scene.list')).scenes[0].sourcePath,beforeStory=await source(storyPath);
 await storyEdit('Foundation continuation, after Source typing');
 assert.equal(await header('undo'),'committed');assert.equal(await source(storyPath),beforeStory,'the first Undo reverses the Story edit');
 await wait(()=>workspace()==='Story','Story edit revealed');const quietSource=await disk();
 assert.equal(await header('undo'),'committed');
 const changed=styled.length+2;
 assert.deepEqual(revealed(),{workspace:'Source',file:stylePath,text:`${styled}# one\n`,selection:[changed,changed+3]},'Undo from Story opens the file with the restored range selected');
 assert.equal(message(),`Undone: Source typing in ${styleName}`);assert.equal(named('redo'),`Redo Source typing in ${styleName}`);
 assert.deepEqual(await disk(),quietSource,'Undo of a Source draft step writes nothing');
 assert.equal(await header('undo'),'committed');assert.deepEqual(revealed().text,styled);assert.equal((await call('source.open',{path:stylePath})).dirty,false,'Undo past the first step ends the draft');
 assert.deepEqual((await historyNow()).undo,sourceBaseline);assert.deepEqual(await disk(),quietSource);
 for(let i=0;i<2;i+=1)assert.equal(await header('redo'),'committed');assert.equal(revealed().text,`${styled}# two\n`);assert.deepEqual(await disk(),quietSource,'Redo of a Source draft step writes nothing');
 stage('Source typing, then a Story edit: header Undo reverses the Story edit, then each Source typing step, opening the file at the range, and writes nothing');

 // Cmd/Ctrl+Z from Screens reaches the Source step; in the Source editor it runs project Undo, not text Undo.
 button('Screens');await wait(()=>workspace()==='Screens'&&document.querySelector('.screen-picker select'),'Screens');await settle();
 assert.equal(await shortcut('undo'),'committed');
 assert.deepEqual(revealed(),{workspace:'Source',file:stylePath,text:`${styled}# one\n`,selection:[changed,changed+3]},'Undo from Screens reveals the range');
 assert.equal(await header('redo'),'committed');editor=sourceEditor();
 requests=historyRequests();assert.equal(await step(()=>{editor.focus();event=key(editor);},'Cmd/Ctrl+Z in the Source editor'),'committed');
 assert.equal(event.defaultPrevented,true,'the Source editor gives Cmd/Ctrl+Z to project Undo');assert.equal(historyRequests(),requests+1);
 assert.equal(revealed().text,`${styled}# one\n`);assert.deepEqual(await disk(),quietSource);
 assert.equal(await step(()=>key(sourceEditor(),{shiftKey:true}),'Shift+Cmd/Ctrl+Z in the Source editor'),'committed');assert.equal(revealed().text,`${styled}# two\n`);
 stage('Cmd/Ctrl+Z from Screens reaches a Source draft step; in the Source editor Cmd/Ctrl+Z and Shift+Cmd/Ctrl+Z run project Undo and Redo');

 // Save Source joins the file's steps into one edit on top.
 button('Save Source',document.querySelector('.source-workspace'));await wait(async()=>(await source(stylePath))===`${styled}# two\n`&&!(await call('source.open',{path:stylePath})).dirty,'Source saved');await settle();
 assert.equal(named('undo'),`Undo Source edit in ${styleName}`);assert.equal(await header('undo'),'committed');
 assert.equal(await source(stylePath),styled,'one Undo reverses the saved file');assert.deepEqual((await historyNow()).undo,sourceBaseline,'Save joined both typing steps');
 stage('Save Source joins its typing steps into one edit; one Undo reverses the file');

 // Source Save All keeps its one history action across files.
 const menuPath=owner.path,menu=await source(menuPath);
 await sourceType(`${styled}# all\n`);await sourceType(`${menu}# all\n`,menuPath);
 assert.equal(named('undo'),`Undo Source typing in ${menuPath.split('/').at(-1)}`);
 button('Story');await wait(()=>workspace()==='Story','Story before Save All');await settle();
 await call('source.saveAll');await refreshHistoryView();
 assert.equal(named('undo'),'Undo Source edits in 2 files');assert.equal(await header('undo'),'committed');
 assert.deepEqual([await source(stylePath),await source(menuPath)],[styled,menu],'one Undo reverses Save All');assert.deepEqual((await historyNow()).undo,sourceBaseline,'Save All joined every typing step');
 stage('Source Save All adds one history entry that joins the typing steps of every saved file');

 // An external edit while Source draft steps exist: Undo changes only the draft and both versions stay.
 await sourceType(`${styled}# one\n`);await new Promise(r=>setTimeout(r,2100));await sourceType(`${styled}# two\n`);
 const external=`${styled}# external\n`;await writeFile(join(scratch,'synthetic-project',stylePath),external);
 button('Refresh',document.querySelector('.source-workspace'));await wait(()=>document.querySelector('.source-workspace .source-conflict'),'conflict');await settle();const outside=await disk();
 assert.equal(await header('undo'),'committed');assert.equal(revealed().text,`${styled}# one\n`);
 assert(document.querySelector('.source-workspace .source-conflict'),'the conflict stays after Undo');assert.deepEqual(await disk(),outside,'Undo keeps the external bytes');
 const kept=await call('source.open',{path:stylePath});assert.deepEqual([kept.dirty,kept.state,kept.externalText],[true,'conflict',external]);
 await call('source.discard',{path:stylePath});assert.equal(await source(stylePath),external);
 assert.deepEqual((await historyNow()).undo,sourceBaseline,'Discard Draft removes its steps');
 button('Story');await wait(()=>workspace()==='Story'&&document.querySelector('.story-track-column'),'Story after Source');await settle();
 stage('an external edit while Source draft steps exist: Undo changes only the draft, keeps the conflict and both versions');

 // System prompts: a prompt edit, then a Story edit. Settings is a dialog, so it owns the shortcut.
 const baseline=(await call('prompts.list')).effectiveText;
 button('Settings');await wait(()=>document.querySelector('.settings-overlay'),'Settings');button('Current project');await wait(()=>document.querySelector('[name="systemPrompt"]')&&document.querySelector('.prompt-preparation')?.dataset.busy==='false','System prompts');
 const prompt=document.querySelector('[name="systemPrompt"]');prompt.value='Project prompt for the history journey';prompt.dispatchEvent(new Event('input',{bubbles:true}));
 button('Save prompt');await wait(async()=>(await call('prompts.list')).customized,'prompt saved');await settle();
 requests=historyRequests();event=key(document.querySelector('.settings-overlay'));await settle();assert.equal(historyRequests(),requests,'An open dialog keeps Cmd/Ctrl+Z');assert.equal(event.defaultPrevented,false);
 button('Close settings');await wait(()=>!document.querySelector('.settings-overlay'),'Settings closed');
 const edited=await storyEdit('Foundation continuation, after the prompt');
 assert.equal(await header('undo'),'committed');await wait(()=>workspace()==='Story'&&document.querySelector('.story-track-column'),'Story opens');
 assert(!(await source(edited.scene.sourcePath)).includes('after the prompt'),'Undo reverses the Story edit');assert.match(message(),/^Undone: narration edit in /);
 assert.equal(await header('undo'),'committed');
 await wait(()=>document.querySelector('.settings-overlay [name="systemPrompt"]')&&document.querySelector('.prompt-preparation')?.dataset.busy==='false','Settings reopens at System prompts');
 assert.equal(document.querySelector('[name="assistanceAction"]').value,'rewriteDialogue');assert.equal(document.querySelector('[name="systemPrompt"]').value,baseline);assert.equal((await call('prompts.list')).customized,false);
 assert.equal(message(),'Undone: system prompt edit');button('Close settings');await settle();
 stage('after closing Settings, the header Undo reverses the Story edit and opens Story, then the prompt edit and opens System prompts');
 result.passed=true;console.log(`PASS project history journey: ${result.stages.length} stages`);
}finally{await browser.happyDOM.close();try{await child.stop();result.driver=child.exitStatus();await assert.rejects(access(scratch));result.cleanupComplete=true;}finally{await writeFile(join(output,'project-history.json'),JSON.stringify({...result,transcript:result.transcript.length},null,1));}}
