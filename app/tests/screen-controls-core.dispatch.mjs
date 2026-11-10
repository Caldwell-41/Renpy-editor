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
 if(!response.ok){result.refusals.push({operation,code:response.error.code});throw Object.assign(Error(response.error.message),response.error);}return response.value;
}
async function settle(check,label){const deadline=Date.now()+15000;while(!await check()){if(Date.now()>deadline)throw Error(`Did not settle: ${label}`);await new Promise(r=>setTimeout(r,5));}}
const source=async path=>(await call('source.open',{path})).text;
const control=label=>{const node=[...workspace.panel.querySelectorAll('input,textarea,select,button')].find(n=>n.ariaLabel===label||n.getAttribute('aria-label')===label||n.getAttribute('aria-label')===label.replace(/ value$/,' formula'));assert(node,label);return node;};
const change=(label,value)=>{const node=control(label);node.value=value;node.dispatchEvent(new Event(node.tagName==='SELECT'?'change':'input',{bubbles:true}));};
const button=label=>{const node=[...workspace.panel.querySelectorAll('button')].find(n=>n.textContent===label);assert(node,label);node.click();};
async function mount(owner){
 workspace?.dispose();document.body.replaceChildren();
 workspace=new ScreensWorkspace({resolution:{width:1280,height:720},current:()=>true,coordinate:task=>task(),source:()=>{},preview:()=>{throw Error('No deliberate execution');},saved:()=>{saves++;},request:async(operation,payload)=>{
  if(operation==='asset.chooseUiImage')return child.request({driver:'chooseImage',alternate:process.argv.includes('--import-stale-review')});
  if(operation==='authoring.list'&&catalogGate){catalogBlocked=true;await catalogGate;}
  if(operation==='screens.canvasStatus')return {phase:'unavailable',message:'Offline UI/core journey. No helper.'};
  if(operation==='screens.canvasRender'){renders.push(structuredClone(payload));return {phase:'unavailable',message:'Offline UI/core journey. No helper.'};}
  if(operation==='screens.compose'&&!payload.validateOnly){writes.push(structuredClone(payload));if(refuse)throw Error('Retained test refusal');}
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
 if(process.argv.includes('--import-review')||process.argv.includes('--import-stale-review')||process.argv.includes('--import-after-edit-review')){
  browser.HTMLImageElement.prototype.decode=async()=>{};
  const stale=process.argv.includes('--import-stale-review'),afterEdit=process.argv.includes('--import-after-edit-review');
  if(stale){const choice=await child.request({driver:'chooseImage'});await call('asset.import',{authorityId:choice.authorityId,kind:'uiImage',technicalName:'original_image',displayName:'Original image'});}
  await mount(owner);button('Add element');workspace.panel.querySelector('[data-kind="imagebutton"]').click();change('Width','280');
  const original=await source(owner.path);
  const globalButton=label=>{const found=[...document.querySelectorAll('button')].find(b=>b.textContent===label);assert(found,label);found.click();};
  if(stale){control('Choose normal image').click();await settle(()=>[...document.querySelectorAll('button')].some(b=>b.ariaLabel==='Use Original image'),'original picker');[...document.querySelectorAll('button')].find(b=>b.ariaLabel==='Use Original image').click();await settle(()=>!document.querySelector('dialog.screen-image-dialog'),'original chosen');}
  control(stale?'Choose hover image':'Choose normal image').click();await settle(()=>document.querySelector('dialog.screen-image-dialog'),'normal picker');
  globalButton('Import image…');globalButton('Browse files…');
  await settle(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='Import and use'),'staged image');
  if(stale)await call('variable.create',{technicalName:'unrelated_import_edit',variableType:'int',defaultValue:'3'});
  globalButton('Import and use');
  if(stale||afterEdit){
   if(afterEdit){await settle(()=>!document.querySelector('dialog.screen-image-dialog'),'own import selected');const variableSource=await source(coins.source.path);await writeFile(join(scratch,'synthetic-project',coins.source.path),variableSource+'# ordinary external variable-file edit\n');}
   await settle(()=>document.querySelector('dialog.screen-image-dialog')?.textContent.includes('retained')||!document.querySelector('dialog.screen-image-dialog'),'stale import outcome');
   if(document.querySelector('dialog.screen-image-dialog'))document.querySelector('dialog.screen-image-dialog').dispatchEvent(new Event('cancel',{cancelable:true}));
   const writesBefore=writes.length;button('Apply changes');await settle(()=>writes.length>writesBefore&&idle(),'stale Apply');
   assert(result.refusals.some(r=>r.operation==='screens.compose'&&r.code==='SOURCE_CONFLICT'));
   assert.equal(workspace.hasDraft(),true);assert.equal(control('Width').value,'280');assert.equal(await source(owner.path),original);
   await workspace.load();const writesAfter=writes.length;button('Apply changes');assert.equal(writes.length,writesAfter);assert.equal(workspace.hasDraft(),true);assert.equal(control('Width').value,'280');assert.equal(await source(owner.path),original);
   stage('unrelated variable edit around import refuses the retained control draft before and after Refresh Source');
  }else{
   await settle(()=>!document.querySelector('dialog.screen-image-dialog'),'import and select');
   const savedBefore=saves;button('Apply changes');await settle(()=>saves>savedBefore&&!workspace.hasDraft()&&idle(),'imported imagebutton Apply');
   assert.equal(writes.at(-1).command.width,280);assert.match(await source(owner.path),/idle Transform\(/);
   const accepted=await source(owner.path),undoSaves=saves;button('Undo');await settle(async()=>saves>undoSaves&&await source(owner.path)===original,'imported control Undo');const redoSaves=saves;button('Redo');await settle(async()=>saves>redoSaves&&await source(owner.path)===accepted,'imported control Redo');
   stage('actual Import and use followed by imagebutton Apply succeeds and control history remains grouped');
  }
  result.passed=true;
 }else if(process.argv.includes('--field-review')){
  await mount(owner);button('Add element');workspace.panel.querySelector('[data-kind="bar"]').click();change('Choose integer variable',coins.id);
  const width=control('Width');change('Width','bad');assert.notEqual(width.getAttribute('aria-invalid'),'true','unfinished input stays unmarked');width.dispatchEvent(new Event('blur'));assert.equal(width.getAttribute('aria-invalid'),'true','blur reports invalid width');
  change('Width','still bad');assert.equal(width.getAttribute('aria-invalid'),'true','an invalid correction keeps its error');change('Height','30');assert.equal(width.getAttribute('aria-invalid'),'true','unrelated edit retains width error');change('Width','360');assert.notEqual(width.getAttribute('aria-invalid'),'true');
  change('Minimum','-');control('Minimum').dispatchEvent(new Event('blur'));assert.equal(control('Minimum').getAttribute('aria-invalid'),'true');change('Minimum','0');
  change('Filled color','#wrong');control('Filled color').dispatchEvent(new Event('blur'));assert.equal(control('Filled color').getAttribute('aria-invalid'),'true');
  change('Width','');button('Apply changes');assert.equal(control('Width').value,'');assert.equal(writes.length,0);button('Cancel');assert.equal(workspace.hasDraft(),false);assert.equal(await source(owner.path),before);
  stage('field-completion errors retain invalid corrections and survive unrelated edits; valid input clears them; no write');result.passed=true;
 }else if(process.argv.includes('--addition-review')){
  await mount(owner);button('Add element');workspace.panel.querySelector('[data-kind="bar"]').click();change('Choose integer variable',coins.id);change('Minimum','12');change('Horizontal position','23');
  const base=await call('source.open',{path:owner.path}),draft=await call('source.updateDraft',{path:owner.path,expectedBaseRevision:base.baseRevision,text:'# screen removed externally\n',selectionStart:0,selectionEnd:0});await call('source.save',{path:owner.path,expectedBaseRevision:draft.baseRevision,expectedDraftVersion:draft.draftVersion});await workspace.load();
  const recovered=control('Retained control draft');assert(recovered.value.includes('12'));assert(recovered.value.includes('360'));workspace.panel.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));assert.equal(workspace.hasDraft(),false,'Escape discards the unavailable addition and its placement draft');assert.equal(writes.length,0);
  stage('unavailable-screen addition remains recoverable and Escape discards only its combined control/layout draft');result.passed=true;
 }else if(process.argv.includes('--replacement-review')){
  const choice=await child.request({driver:'chooseImage'});await call('asset.import',{authorityId:choice.authorityId,kind:'uiImage',technicalName:'station_seal',displayName:'Station seal',characterId:null,expression:null});browser.HTMLImageElement.prototype.decode=async()=>{};
  await mount(owner);button('Add element');workspace.panel.querySelector('[data-kind="imagebutton"]').click();
  const pickNormal=async()=>{control('Choose normal image').click();await settle(()=>[...document.querySelectorAll('button')].some(b=>b.ariaLabel==='Use Station seal'),'Normal picker');[...document.querySelectorAll('button')].find(b=>b.ariaLabel==='Use Station seal').click();};
  await pickNormal();await settle(()=>!document.querySelector('dialog.screen-image-dialog'),'original selection');const aspect=workspace.panel.querySelector('.sce-aspect input');aspect.checked=true;aspect.dispatchEvent(new Event('change',{bubbles:true}));change('Width','200');assert.equal(control('Height').value,'100');
  await child.request({driver:'imageFile',state:'changed'});await pickNormal();const review=()=>[...document.querySelectorAll('dialog')].find(d=>d.ariaLabel==='Review changed image');await settle(()=>review(),'changed image review');review().dispatchEvent(new Event('cancel',{cancelable:true}));review().close();await settle(()=>!review(),'changed review closes');assert.equal(document.activeElement===control('Choose normal image'),true,'Escape restores reference trigger focus');
  await pickNormal();await settle(()=>review(),'changed image review reopened');[...review().querySelectorAll('button')].find(b=>b.textContent==='Use changed image').click();await settle(()=>!review(),'replacement chosen');assert.equal(control('Height').value,'80');change('Width','300');assert.equal(control('Height').value,'120','subsequent edits preserve the reviewed 80x32 ratio, not old 80x40');
  const beforeApply=saves;button('Apply changes');await settle(()=>saves>beforeApply&&!workspace.hasDraft()&&idle(),'replacement Apply');assert.equal(writes.at(-1).command.height,120);assert(writes.at(-1).command.appearances.normal.replacementSha256);
  stage('changed-image Escape restores picker focus; reviewed Normal dimensions govern later aspect edits and combined Apply');result.passed=true;
 }else if(process.argv.includes('--component-review')||process.argv.includes('--component-apply-review')||process.argv.includes('--component-add-review')){
  const choice=await child.request({driver:'chooseImage'});await call('asset.import',{authorityId:choice.authorityId,kind:'uiImage',technicalName:'station_seal',displayName:'Station seal',characterId:null,expression:null});browser.HTMLImageElement.prototype.decode=async()=>{};
  const asset=(await call('authoring.list')).assets.find(a=>a.relativePath==='game/images/ui station_seal.png');
  const makePanel=async name=>{const list=await call('screens.list');const made=await call('screens.create',{name,kind:'panel',expectedProjectRevision:list.projectRevision,expectedSourceMapRevision:list.sourceMapRevision,expectedInventoryRevision:list.inventoryRevision});return made.owned.find(o=>o.name===name);};
  const first=await makePanel('first_control_use');let doc=await call('screens.inspect',{path:first.path});let added=await call('screens.compose',{screenId:first.id,expectedRevision:doc.revision,command:{type:'add',parentId:first.rootId,kind:'fixed',text:''}});const groupId=added.selectedId;
  const appearances={normal:{assetId:asset.id,expectedAssetSha256:asset.sha256},hover:null,selected:null,selectedHover:null,disabled:null,selectedDisabled:null};
  added=await call('screens.compose',{screenId:first.id,expectedRevision:added.document.revision,command:{type:'addImageButton',parentId:groupId,appearances,width:240,height:64,interaction:{expectedAuthoringRevision:added.document.authoringRevision,expectedTargetRevisions:[],actions:[]}}});
  await call('screens.componentPrepareExtract',{screenId:first.id,nodeId:groupId,expectedRevision:added.document.revision});const target=await call('screens.resolveTarget',{binding:{screenId:first.id,sourceName:first.name}});
  const extracted=await call('screens.componentExtract',{target:target.binding,expected:target.revisions,expectedProjectRevision:(await call('screens.list')).projectRevision,nodeId:groupId,name:'image_control_component'});
  const second=await makePanel('second_control_use'),comp=(await call('screens.list')).owned.find(o=>o.id===extracted.componentId);
  const componentTarget=await call('screens.resolveTarget',{binding:{screenId:comp.id,sourceName:comp.name}}),secondTarget=await call('screens.resolveTarget',{binding:{screenId:second.id,sourceName:second.name}});
  await call('screens.componentPlace',{component:componentTarget.binding,expectedComponent:componentTarget.revisions,target:secondTarget.binding,expectedTarget:secondTarget.revisions,parentId:second.rootId});
  if(process.argv.includes('--component-add-review')){
   const before=await source(comp.path),document=await call('screens.inspect',{path:comp.path}),target=await call('screens.resolveTarget',{binding:{screenId:comp.id,sourceName:comp.name}});
   const request={screenId:comp.id,expectedRevision:document.revision,componentRevisions:target.revisions,command:{type:'addImageButton',parentId:comp.rootId,appearances,width:160,height:80,interaction:{expectedAuthoringRevision:document.authoringRevision,expectedTargetRevisions:[],actions:[]}}};
   const accepted=await call('screens.compose',request);assert.equal(accepted.changed,true);const added=accepted.document.screens[0].nodes.find(n=>n.id===accepted.selectedId);assert.deepEqual(added.actions,[]);assert.equal(added.numericLayout.values.xsize.value,160);
   const after=await source(comp.path);assert.notEqual(after,before);assert.equal((await call('screens.resolveTarget',{binding:{screenId:comp.id,sourceName:comp.name}})).effects.unknown,false);
   const refreshed=await call('screens.resolveTarget',{binding:{screenId:comp.id,sourceName:comp.name}});
   for(const actions of [[{type:'setVariable',variableId:coins.id,value:'8'}],[{type:'finishInteraction'}]]){
    await assert.rejects(call('screens.compose',{...request,expectedRevision:accepted.document.revision,componentRevisions:refreshed.revisions,command:{...request.command,interaction:{...request.command.interaction,actions}}}),error=>error.code==='INCOMING_REFERENCE');assert.equal(await source(comp.path),after);
   }
   const history=async type=>{const state=await call('scene.list');await call('scene.apply',{expectedProjectRevision:state.projectRevision,expectedSourceMapRevision:state.sourceMapRevision,command:{type}});};
   await history('undo');assert.equal(await source(comp.path),before);await history('redo');assert.equal(await source(comp.path),after);
   stage('passive component imagebutton addition is one history change and effectful actions remain blocked');
  }else{
  await mount(comp);const image=(await call('screens.inspect',{path:comp.path})).screens[0].nodes.find(n=>n.kind==='imagebutton');button('1  Choose');workspace.panel.querySelector(`[data-node-id="${image.id}"]`).dispatchEvent(new browser.MouseEvent('dblclick',{bubbles:true}));
  const componentSource=await source(comp.path),writeCount=writes.length;change('Width','300');button('Apply changes');
  const review=()=>[...document.querySelectorAll('dialog')].find(d=>d.ariaLabel==='Review component changes');await settle(()=>review()||writes.length>writeCount,'shared dimension review');assert(review(),'size-only imagebutton changes require the shared-component review');
  assert.match(review().textContent,/First Control Use/i);assert.match(review().textContent,/Second Control Use/i);const cells=[...review().querySelectorAll('.screen-component-changes tbody td')].map(n=>n.textContent);assert.deepEqual(cells,['Width','240','300']);assert.equal(await source(comp.path),componentSource);
  if(process.argv.includes('--component-apply-review')){
   const beforeSaves=saves;[...review().querySelectorAll('button')].find(b=>b.textContent.startsWith('Apply to ')).click();
   await settle(()=>saves>beforeSaves&&!workspace.hasDraft()&&idle(),'shared component Apply');
   assert.equal(writes.at(-1).command.interaction.actions,undefined,'read-only actions are preserved');
   const edited=await source(comp.path);assert.notEqual(edited,componentSource);assert.match(edited,/action Null\(\)/);
   assert.equal((await call('screens.inspect',{path:comp.path})).screens[0].nodes.find(n=>n.id===image.id).numericLayout.values.xsize.value,300);
   stage('shared component width edit applies after review and preserves read-only actions');
  }else{
   [...review().querySelectorAll('button')].find(b=>b.textContent==='Keep editing').click();await settle(()=>idle(),'component review cancelled');assert.equal(writes.length,writeCount);assert.equal(control('Width').value,'300');assert.equal(workspace.hasDraft(),true);
   stage('shared component imagebutton width-only edit lists both affected screens and dimensions before any write; Keep editing retains draft');
  }
  }
  result.passed=true;
 }else if(process.argv.includes('--picker-review')){
  const choice=await child.request({driver:'chooseImage'});await call('asset.import',{authorityId:choice.authorityId,kind:'uiImage',technicalName:'station_seal',displayName:'Station seal',characterId:null,expression:null});browser.HTMLImageElement.prototype.decode=async()=>{};
  await mount(owner);button('Add element');workspace.panel.querySelector('[data-kind="imagebutton"]').click();
  const nativeFocus=browser.HTMLElement.prototype.focus;browser.HTMLElement.prototype.focus=function(...args){const modal=document.querySelector('dialog[open]');if(modal&&!modal.contains(this))return;return nativeFocus.apply(this,args);};
  try{control('Choose normal image').click();await settle(()=>[...document.querySelectorAll('button')].some(b=>b.ariaLabel==='Use Station seal'),'reference picker');[...document.querySelectorAll('button')].find(b=>b.ariaLabel==='Use Station seal').click();await settle(()=>!document.querySelector('dialog.screen-image-dialog'),'reference picker closes');assert.equal(document.activeElement===control('Choose normal image'),true,'native modal rules permit replacement trigger focus only after close');assert.equal(writes.length,0);const selected=control('Preview selected + hover sample');selected.click();assert.equal(selected.getAttribute('aria-pressed'),'true','the sampled appearance row exposes its active state');assert.equal(selected.parentElement.dataset.sampled,'true');assert.equal(control('Button state (sample)').value,'selectedHover');const state=control('Button state (sample)');state.value='disabled';state.dispatchEvent(new Event('change',{bubbles:true}));assert.equal(control('Preview disabled sample').getAttribute('aria-pressed'),'true');assert.equal(selected.getAttribute('aria-pressed'),'false');assert.equal(writes.length,0);}finally{browser.HTMLElement.prototype.focus=nativeFocus;}
  stage('reference picker closes before replacement-trigger focus under native modal-inert focus rules (synthetic DOM)');result.passed=true;
 }else{
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
 change('Horizontal position','23');change('Add action','setVariable');change('Action 1 variable',coins.id);change('Action 1 value','1 // 0');
 button('Apply changes');await settle(()=>control('Action 1 value').getAttribute('aria-invalid')==='true','action field error');
 assert.equal(document.activeElement===control('Action 1 value'),true,'action error keeps field focus');assert.equal(control('Action 1 value').value,'1 // 0');
 change('Action 1 value','21');const beforeAll=await source(owner.path),allSaves=saves;button('Apply changes');await settle(()=>saves>allSaves&&!workspace.hasDraft()&&idle(),'six-state combined edit');
 const all=await source(owner.path),allCommand=writes.at(-1).command;
 assert.equal(Object.values(allCommand.appearances).filter(Boolean).length,6);assert.deepEqual(allCommand.layout,{xpos:{unit:'pixels',value:23}});
 assert.deepEqual(allCommand.interaction.actions,[{type:'setVariable',variableId:coins.id,value:{operation:'assign',operand:'21'}},{type:'finishInteraction'}]);
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
 }
}catch(error){result.failure={message:error.message,stack:error.stack,html:workspace?.panel.outerHTML};throw error;}
finally{workspace?.dispose();await browser.happyDOM.close();try{await child.stop();await assert.rejects(access(scratch));result.cleanupComplete=true;}finally{result.driver=child.exitStatus();if(previewData)await writeFile(join(output,'preview-data.json'),JSON.stringify(previewData,null,2)+'\n');await writeFile(join(output,'result.json'),JSON.stringify(result,null,2)+'\n');}}
console.log('PASS actual control UI -> core source/history. No SDK/helper/native claim.');
