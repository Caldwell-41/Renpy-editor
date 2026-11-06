// Actual ScreensWorkspace -> production core source/history. Canvas transport stays offline.
import assert from 'node:assert/strict';
import {mkdir,realpath,writeFile,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {Window} from 'happy-dom';
import {driverProcess} from './phase2-driver-process.mjs';
import {ScreensWorkspace} from '../dist-tests/src/screen-ui.js';
const output=resolve(process.env.SCREEN_CONTROLS_CORE_OUTPUT??`target/screen-controls-ui-${randomUUID()}`);
await mkdir(output,{recursive:true});
const scratch=join(await realpath(output),`loomlight-help-controller-controls-${randomUUID()}`);
const child=driverProcess(resolve(process.env.CARGO_TARGET_DIR??'target/51-52-ui',`debug/examples/help-controller-driver${process.platform==='win32'?'.exe':''}`),[scratch,'ui-image']);
const browser=new Window();
for(const name of ['window','document','HTMLElement','HTMLInputElement','HTMLSelectElement','HTMLTextAreaElement','HTMLDetailsElement','ResizeObserver','Event','KeyboardEvent'])globalThis[name]=name==='window'?browser:name==='document'?browser.document:browser[name];
let previewData;
let session,workspace,saves=0,refuse=false,catalogGate,catalogBlocked=false;
const result={passed:false,controllerToCore:true,sdkExecuted:false,helperExecuted:false,stages:[],refusals:[],operations:[]};
const writes=[],renders=[];
const idle=()=>!workspace?.panel.querySelector('.sce-state')?.textContent.includes('Applying');
const stage=text=>{result.stages.push(text);console.log(`PASS ${text}`);};
async function call(operation,payload={}){
 assert(!operation.startsWith('runtime.')&&!['screens.canvasRender','screens.canvasStatus'].includes(operation));
 const started=Date.now();
 const response=await child.request({protocolVersion:1,requestId:randomUUID().replaceAll('-',''),operation,payload:{...payload,...(session&&!['project.listRecent','project.openRecent'].includes(operation)?{sessionId:session}:{})}});
 result.operations.push({operation,elapsedMs:Date.now()-started});
 if(!response.ok){result.refusals.push({operation,code:response.error.code});throw Object.assign(Error(response.error.message),{code:response.error.code});}return response.value;
}
async function settle(check,label){const deadline=Date.now()+15000;while(!await check()){if(Date.now()>deadline)throw Error(`Did not settle: ${label}`);await new Promise(r=>setTimeout(r,5));}}
const source=async path=>(await call('source.open',{path})).text;
const control=label=>{const node=[...workspace.panel.querySelectorAll('input,textarea,select,button')].find(n=>n.ariaLabel===label||n.getAttribute('aria-label')===label);assert(node,label);return node;};
const change=(label,value)=>{const node=control(label);node.value=value;node.dispatchEvent(new Event(node.tagName==='SELECT'?'change':'input',{bubbles:true}));};
const button=label=>{const node=[...workspace.panel.querySelectorAll('button')].find(n=>n.textContent===label);assert(node,label);node.click();};
async function mount(owner){
 workspace?.dispose();document.body.replaceChildren();
 workspace=new ScreensWorkspace({resolution:{width:1280,height:720},current:()=>true,coordinate:task=>task(),source:()=>{},preview:()=>{throw Error('No deliberate execution');},saved:()=>{saves++;},request:async(operation,payload)=>{
  if(operation==='authoring.list'&&catalogGate){catalogBlocked=true;await catalogGate;}
  if(operation==='screens.canvasStatus')return {phase:'unavailable',message:'Offline UI/core journey. No helper.'};
  if(operation==='screens.canvasRender'){renders.push(structuredClone(payload));return {phase:'unavailable',message:'Offline UI/core journey. No helper.'};}
  if(operation==='screens.compose'){writes.push(structuredClone(payload));if(refuse)throw Error('Retained test refusal');}
  return call(operation,payload);
 }});
 workspace.mount(document.body);await settle(()=>workspace.panel.querySelector('[data-node-id]'),'workspace');
 const picker=workspace.panel.querySelector('.screen-picker select');picker.value=JSON.stringify(['owned',owner.id]);picker.dispatchEvent(new Event('change',{bubbles:true}));
}
try{
 assert.equal((await child.next()).ready,true);
 session=(await call('project.openRecent',{recentId:(await call('project.listRecent'))[0].id})).sessionId;
 const opaque=await source('game/ui/help.rpy');
 await call('variable.create',{technicalName:'coins',variableType:'int',defaultValue:'12'});
 const coins=(await call('authoring.list')).variables.find(v=>v.technicalName==='coins');
 const catalog=await call('screens.list');
 const created=await call('screens.create',{name:'controls_dialog',kind:'dialog',expectedProjectRevision:catalog.projectRevision,expectedSourceMapRevision:catalog.sourceMapRevision,expectedInventoryRevision:catalog.inventoryRevision});
 const owner=created.owned.find(o=>o.name==='controls_dialog'),before=await source(owner.path);
 await mount(owner);button('Add element');
 const addBar=workspace.panel.querySelector('[data-kind="bar"]');assert(addBar,'Bar available in the actual Add element palette');addBar.click();
 change('Choose integer variable',coins.id);change('Minimum','-10');change('Maximum','90');change('Width','360');change('Height','24');
 await settle(()=>renders.at(-1)?.barAddition?.binding?.minimum==='-10','bar provisional frame request');
 const provisionalBar=await call('screens.canvasPlan',renders.at(-1));assert(provisionalBar.nodes.some(n=>n.kind==='bar'));
 button('Apply changes');await settle(()=>writes.length&& !workspace.hasDraft()&&idle(),'combined bar Apply');
 const accepted=await source(owner.path),command=writes.at(-1).command;
 assert.equal(command.type,'addBar');assert.deepEqual(command.binding,{variableId:coins.id,minimum:'-10',maximum:'90'});
 assert.equal(command.width,360);assert.equal(command.height,24);assert.match(accepted,/bar:/);assert.notEqual(accepted,before);
 button('Undo');await settle(async()=>await source(owner.path)===before&&!workspace.panel.querySelector('.sce-title'),'one-step bar Undo');
 button('Redo');await settle(async()=>await source(owner.path)===accepted&&saves>=3,'one-step bar Redo');
 assert.equal(await source('game/ui/help.rpy'),opaque);
 stage('actual Add bar -> typed decimal binding/dimensions -> one Apply -> Undo/Redo, opaque neighbor unchanged');
 const choice=await child.request({driver:'chooseImage'});
 await call('asset.import',{authorityId:choice.authorityId,kind:'uiImage',technicalName:'station_seal',displayName:'Station seal',characterId:null,expression:null});
 const asset=(await call('authoring.list')).assets.find(a=>a.technicalName==='station_seal'||a.relativePath==='game/images/ui station_seal.png');assert(asset);
 // Browser bitmap decoding is outside this DOM/core seam. Core still admits the real image bytes.
 browser.HTMLImageElement.prototype.decode=async()=>{};
 await mount(owner);button('1  Choose');button('Add element');workspace.panel.querySelector('[data-kind="imagebutton"]').click();
 const chooseNormal=control('Choose normal image');chooseNormal.click();
 await settle(()=>[...document.querySelectorAll('button')].some(b=>b.ariaLabel==='Use Station seal'),'existing image picker');
 [...document.querySelectorAll('button')].find(b=>b.ariaLabel==='Use Station seal').click();
 await settle(()=>!document.querySelector('dialog.screen-image-dialog'),'normal reference selected');
 change('Width','240');change('Height','64');change('Add action','finishInteraction');
 const beforeButton=await source(owner.path),saveBefore=saves;button('Apply changes');await settle(()=>saves>saveBefore&&!workspace.hasDraft()&&idle(),'combined imagebutton Apply');
 const buttonSource=await source(owner.path),imageCommand=writes.at(-1).command;
 assert.equal(imageCommand.type,'addImageButton');assert.equal(imageCommand.appearances.normal.assetId,asset.id);assert.equal(imageCommand.appearances.hover,null);
 assert.deepEqual(imageCommand.interaction.actions,[{type:'finishInteraction'}]);
 assert.match(buttonSource,/idle Transform\("images\/ui station_seal.png", xysize=\(240, 64\)\)/);
 button('Undo');await settle(async()=>await source(owner.path)===beforeButton&&!workspace.panel.querySelector('.sce-title'),'combined button Undo');
 const undoSaves=saves;button('Redo');await settle(async()=>await source(owner.path)===buttonSource&&saves>undoSaves,'combined button Redo');
 stage('actual existing image picker -> real image reference + shared dimensions + typed Finish -> one Apply/Undo/Redo');
 const imageId=(await call('screens.inspect',{path:owner.path})).screens[0].nodes.find(n=>n.kind==='imagebutton').id;
 await mount(owner);button('1  Choose');workspace.panel.querySelector(`[data-node-id="${imageId}"]`).dispatchEvent(new browser.MouseEvent('dblclick',{bubbles:true}));
 const width=control('Width');width.focus();width.setSelectionRange(1,2);change('Width','320');
 refuse=true;const rejectedAt=writes.length;button('Apply changes');await settle(()=>writes.length>rejectedAt,'refused size Apply');await settle(()=>workspace.panel.textContent.includes('Retained test refusal'),'refused size feedback');
 assert.equal(workspace.hasDraft(),true);assert.equal(control('Width').value,'320');assert.equal(document.activeElement===control('Width'),true,'Width focus retained');
 workspace.panel.remove();workspace.mount(document.body);await settle(()=>workspace.panel.querySelector('.screen-message')?.textContent.startsWith('Source refreshed'),'retained remount');
 assert.equal(control('Width').value,'320');assert.equal(document.activeElement===control('Width'),true,'Width focus retained');
 const rejected=structuredClone(writes.at(-1));refuse=false;const sizeSaves=saves;button('Apply changes');await settle(()=>saves>sizeSaves&&!workspace.hasDraft()&&idle(),'accepted size edit');
 assert.deepEqual(writes.at(-1),rejected);assert.equal(writes.at(-1).command.type,'imageButton');assert.equal(writes.at(-1).command.width,320);
 const resized=await source(owner.path);assert.match(resized,/xysize=\(320, 64\)/);
 change('Width','oops');button('Apply changes');assert.equal(control('Width').value,'oops');assert.equal(control('Width').getAttribute('aria-invalid'),'true');assert.equal(document.activeElement===control('Width'),true,'Width focus retained');
 button('Cancel');assert.equal(workspace.hasDraft(),false);assert.equal(await source(owner.path),resized);
 stage('imagebutton numeric size -> refused Apply/remount keeps original envelope/focus -> accepted Transform resize; invalid input and Cancel');
 // A disappearing asset must leave the existing editable draft reachable.
 change('Width','384');await child.request({driver:'imageFile',state:'missing'});await workspace.load();
 assert.equal(control('Width').value,'384');button('Apply changes');await settle(()=>workspace.panel.textContent.includes('missing'),'missing image feedback');
 assert.equal(control('Width').value,'384');assert.equal(workspace.hasDraft(),true);assert.equal(await source(owner.path),resized);
 await child.request({driver:'imageFile',state:'restore'});button('Cancel');await workspace.load();
 stage('missing asset refuses while retained raw dimensions remain editable; Cancel restores accepted source');
 change('Horizontal position','23');const beforeCatalog=await source(owner.path),beforeCatalogWrites=writes.length;
 await call('variable.create',{technicalName:'other_int',variableType:'int',defaultValue:'3'});await workspace.load();
 button('Apply changes');await settle(()=>workspace.panel.textContent.includes('changed after this draft started')||writes.length>beforeCatalogWrites,'catalog conflict');
 assert.equal(writes.length,beforeCatalogWrites,'layout-only control draft retains the variable catalog it captured');assert.equal(control('Horizontal position').value,'23');assert.equal(await source(owner.path),beforeCatalog);button('Cancel');
 stage('layout-only control edits retain captured variable catalog across accepted unrelated variable creation');
 for(const name of ['hover','selected','selected + hover','disabled','selected + disabled']){
  control(`Choose ${name} image`).click();await settle(()=>[...document.querySelectorAll('button')].some(b=>b.ariaLabel==='Use Station seal'),`${name} picker`);
  [...document.querySelectorAll('button')].find(b=>b.ariaLabel==='Use Station seal').click();await settle(()=>!document.querySelector('dialog.screen-image-dialog'),`${name} selection`);
 }
 change('Horizontal position','23');change('Add action','setVariable');change('Action 1 variable',coins.id);change('Action 1 value','-0');
 button('Apply changes');await settle(()=>control('Action 1 value').getAttribute('aria-invalid')==='true','action field error');
 assert.equal(document.activeElement===control('Action 1 value'),true,'action error keeps field focus');assert.equal(control('Action 1 value').value,'-0');
 change('Action 1 value','21');const beforeAll=await source(owner.path),allSaves=saves;button('Apply changes');await settle(()=>saves>allSaves&&!workspace.hasDraft()&&idle(),'six-state combined edit');
 const all=await source(owner.path),allCommand=writes.at(-1).command;
 assert.equal(Object.values(allCommand.appearances).filter(Boolean).length,6);assert.deepEqual(allCommand.layout,{xpos:{unit:'pixels',value:23}});
 assert.deepEqual(allCommand.interaction.actions,[{type:'setVariable',variableId:coins.id,value:'21'},{type:'finishInteraction'}]);
 assert.equal((all.match(/Transform\(/g)??[]).length,6);
 change('Width','320');const noOpSaves=saves;button('Apply changes');await settle(()=>saves>noOpSaves&&!workspace.hasDraft()&&idle(),'no-op control Apply');assert.equal(await source(owner.path),all);
 button('Undo');await settle(async()=>await source(owner.path)===beforeAll&&control('Horizontal position').value!=='23','one-step six-state Undo');
 const undoAll=saves;button('Redo');await settle(async()=>await source(owner.path)===all&&saves>undoAll,'six-state Redo');
 stage('six explicit image states/actions/layout use one transaction; typed action errors keep input/focus; no-op adds no history');
 const beforeKey=writes.length;change('Width','400');control('Width').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));await settle(()=>writes.length>beforeKey&&writes.at(-1).command.width===400&&!workspace.hasDraft()&&idle()&&workspace.panel.querySelector('.screen-message')?.textContent.startsWith('Control applied'),'keyboard combined size');
 assert.equal(writes.at(-1).command.type,'imageButton');assert.equal(writes.at(-1).command.width,400);
 await source(owner.path);let releaseCatalog;catalogGate=new Promise(resolve=>{releaseCatalog=resolve;});catalogBlocked=false;change('Width','432');const delayedSaves=saves;button('Apply changes');await settle(()=>catalogBlocked,'catalog preparation');const reserved=control('Width').readOnly;result.admission={reserved,state:workspace.panel.querySelector('.sce-state')?.textContent};releaseCatalog();catalogGate=undefined;await settle(()=>saves>delayedSaves&&!workspace.hasDraft()&&idle(),'delayed control Apply');assert.equal(reserved,true,'control fields reserve during asynchronous asset admission');
 const beforeReopen=await source(owner.path);workspace.dispose();workspace=undefined;await call('project.close');session=undefined;session=(await call('project.openRecent',{recentId:(await call('project.listRecent'))[0].id})).sessionId;
 const reopened=await call('screens.inspect',{path:owner.path});assert.equal(reopened.screens[0].nodes.find(n=>n.id===imageId).imageButtonAppearances.selectedHover.assetId,asset.id);assert.equal(await source(owner.path),beforeReopen);assert.equal(await source('game/ui/help.rpy'),opaque);
 stage('keyboard size goes through combined owner; actual project close/reopen preserves all state references/actions and opaque neighbors');
 previewData={catalog:await call('screens.list'),documents:[reopened],authoring:await call('authoring.list'),targets:[await call('screens.resolveTarget',{binding:{screenId:owner.id,sourceName:owner.name}})],media:[await call('media.present',{assetId:asset.id,purpose:'imagePreview'})]};
 await mount(owner);button('1  Choose');workspace.panel.querySelector(`[data-node-id="${imageId}"]`).dispatchEvent(new browser.MouseEvent('dblclick',{bubbles:true}));change('Width','455');
 const imageNode=reopened.screens[0].nodes.find(n=>n.id===imageId),acceptedBytes=Buffer.from(beforeReopen),removed=Buffer.concat([acceptedBytes.subarray(0,imageNode.span.start),acceptedBytes.subarray(imageNode.span.end)]).toString('utf8');
 const sourceBase=await call('source.open',{path:owner.path}),sourceDraft=await call('source.updateDraft',{path:owner.path,expectedBaseRevision:sourceBase.baseRevision,text:removed,selectionStart:0,selectionEnd:0});await call('source.save',{path:owner.path,expectedBaseRevision:sourceDraft.baseRevision,expectedDraftVersion:sourceDraft.draftVersion});await workspace.load();
 const recovered=control('Retained control draft');assert.equal(recovered.readOnly,true);assert(recovered.value.includes('455'));assert.equal(await source(owner.path),removed);button('Discard retained control draft');assert.equal(workspace.hasDraft(),false);
 stage('Source-removed control retains recoverable raw draft without restoring or overwriting source');result.passed=true;
}catch(error){result.failure={message:error.message,stack:error.stack,html:workspace?.panel.outerHTML};throw error;}
finally{workspace?.dispose();await browser.happyDOM.close();try{await child.stop();await assert.rejects(access(scratch));result.cleanupComplete=true;}finally{result.driver=child.exitStatus();if(previewData)await writeFile(join(output,'preview-data.json'),JSON.stringify(previewData,null,2)+'\n');await writeFile(join(output,'result.json'),JSON.stringify(result,null,2)+'\n');}}
console.log('PASS actual control UI -> core source/history. No SDK/helper/native claim.');
