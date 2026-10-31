// Production Screens controls through the real core, Source and transaction history.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {randomUUID} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {driverProcess} from './phase2-driver-process.mjs';
const output=resolve(process.env.SHARED_STYLE_OUTPUT??'../.toolchains/l07-shared-look/controller-01');await mkdir(output,{recursive:true});
const child=driverProcess(resolve(process.env.CARGO_TARGET_DIR??'target',`debug/examples/help-controller-driver${process.platform==='win32'?'.exe':''}`),[join(tmpdir(),`loomlight-help-controller-${randomUUID()}`),'project-font'],{startupTimeout:60000});
const server=await createServer({root:resolve('.'),logLevel:'error',server:{host:'127.0.0.1',port:0}});
let browser,sessionId,page;const errors=[],plans=[],canvasRequests=[];
let assignmentPreviewTarget,assignmentPreviewProof,acceptAssignmentPreview;
const assignmentPreview=new Promise(resolve=>{acceptAssignmentPreview=resolve;});
let switchPreviewTarget,switchPreviewProof,acceptSwitchPreview;
const switchPreview=new Promise(resolve=>{acceptSwitchPreview=resolve;});
let textAssignmentTarget,textAssignmentProof,acceptTextAssignment;
const textAssignmentPreview=new Promise(resolve=>{acceptTextAssignment=resolve;});
const rpc=async r=>{
 if(r.operation==='screens.canvasRender'){
  canvasRequests.push(r.payload);const plan=await child.request({...r,operation:'screens.canvasPlan'});plans.push(plan);
  if(assignmentPreviewTarget&&r.payload.path===assignmentPreviewTarget.path&&r.payload.screenName===assignmentPreviewTarget.screenName&&r.payload.expectedRevision===assignmentPreviewTarget.revision&&r.payload.textStyles?.some(sample=>sample.nodeStart===assignmentPreviewTarget.nodeStart)){
   assignmentPreviewProof??={payload:r.payload,plan};acceptAssignmentPreview(assignmentPreviewProof);
  }
  if(switchPreviewTarget&&r.payload.path===switchPreviewTarget.path&&r.payload.screenName===switchPreviewTarget.screenName&&r.payload.expectedRevision===switchPreviewTarget.revision&&r.payload.textStyles?.some(sample=>sample.nodeStart===switchPreviewTarget.nodeStart)){switchPreviewProof??={payload:r.payload,plan};acceptSwitchPreview(switchPreviewProof);}
  if(textAssignmentTarget&&r.payload.path===textAssignmentTarget.path&&r.payload.screenName===textAssignmentTarget.screenName&&r.payload.expectedRevision===textAssignmentTarget.revision&&r.payload.textStyles?.some(sample=>sample.nodeStart===textAssignmentTarget.nodeStart&&sample.values.size===50)){textAssignmentProof??={payload:r.payload,plan};acceptTextAssignment(textAssignmentProof);}
  return {ok:true,value:{phase:'unavailable',message:'SDK qualification is separate.'}};
 }
 if(r.operation==='screens.canvasStatus')return {ok:true,value:{phase:'unavailable',message:'SDK qualification is separate.'}};
 const result=await child.request(r);if(result.value?.sessionId)sessionId=result.value.sessionId;return result;
};
const request=async(operation,payload={})=>{const r=await rpc({protocolVersion:1,requestId:randomUUID(),operation,payload:{sessionId,...payload}});assert.equal(r.ok,true,JSON.stringify(r));return r.value;};
const read=async owner=>(await request('source.open',{path:owner.path})).text;
const save=async(owner,text)=>{const base=await request('source.open',{path:owner.path});const draft=await request('source.updateDraft',{path:owner.path,expectedBaseRevision:base.baseRevision,text,selectionStart:0,selectionEnd:0});await request('source.save',{path:owner.path,expectedBaseRevision:draft.baseRevision,expectedDraftVersion:draft.draftVersion});};
try {
 assert.equal((await child.next()).ready,true);await server.listen();browser=await chromium.launch({channel:'chrome',headless:true});
 page=await browser.newPage({viewport:{width:1440,height:1080}});page.setDefaultTimeout(8000);
 page.on('pageerror',e=>errors.push(e.message));await page.exposeBinding('styleRpc',(_,r)=>rpc(r));
 await page.route('**/style-controller',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><link rel="stylesheet" href="/src/screen-ui.css"><div id="app"></div>'}));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/style-controller`);
 await page.evaluate(async()=>{const {startApplication}=await import('/src/main.ts');startApplication((operation,payload)=>window.styleRpc({protocolVersion:1,requestId:crypto.randomUUID(),operation,payload}));});
 await page.locator('.recent-open').click();await page.getByRole('button',{name:'Screens',exact:true}).click();
 await page.evaluate(async()=>{const {updatePreferences}=await import('/src/preferences.ts');await updatePreferences({theme:'dark'});});
 const owners=[],ids=[];
 for(const name of ['travel_notes','about','journal','map','inventory','settings','credits','pause_menu']) {
  const c=await request('screens.list');const created=await request('screens.create',{name,expectedProjectRevision:c.projectRevision,expectedSourceMapRevision:c.sourceMapRevision,expectedInventoryRevision:c.inventoryRevision});const owner=created.owned.find(s=>s.name===name);owners.push(owner);
  const compose=async text=>{const doc=await request('screens.inspect',{path:owner.path});return request('screens.compose',{screenId:owner.id,expectedRevision:doc.revision,command:{type:'add',parentId:owner.rootId,kind:'text',text}});};
  const added=await compose('Choose a route.\nThe last tram leaves at midnight.');ids.push(added.selectedId);const elements=[added.selectedId];
  if(owners.length<=6)elements.push((await compose('Related route note.')).selectedId);
  let source=(await read(owner)).replace('midnight." #','midnight.": #').replace('text "Related route note." #','text "Related route note.": #');
  for(const id of elements){const marker=`# loomlight-element: ${id}\n`;source=source.replace(marker,marker+'        style "ll_body_text" # keep use\n');}
  if(owners.length===1)source+='\nstyle ll_body_text is text:\n    size 26 # keep size\n    color "#f1e9d6"\n    text_align 0.0\n    bold False\n    italic False\n';
  await save(owner,source);
 }
 const settled=()=>page.waitForFunction(()=>document.querySelector('[data-text-apply]')?.disabled===true&&!document.querySelector('.screen-text-state')?.textContent.includes('Applying'));
 const ui=page.locator('.screens-editor');await ui.getByRole('button',{name:'Refresh Source',exact:true}).click();await ui.getByLabel('Screen',{exact:true}).selectOption(JSON.stringify(['owned',owners[0].id]));await ui.locator(`[data-node-id="${ids[0]}"]`).dblclick();
 const before=await read(owners[0]),other=await read(owners[1]);
 const size=ui.getByRole('textbox',{name:'Size · px',exact:true});assert.equal(await size.inputValue(),'26');
 await ui.getByRole('button',{name:'All elements using this style',exact:true}).waitFor();
 assert.match(await ui.locator('.screen-style-heading').innerText(),/Editing 14 elements across 8 screens/);
 await size.fill('32');await size.focus();await size.evaluate(e=>e.setSelectionRange(2,2));
 await ui.locator('.screen-text-layout').evaluate(e=>e.open=false);await ui.locator('.screen-text-body').evaluate(e=>e.scrollTop=0);
 await ui.locator('.screen-card').screenshot({path:join(output,'pending-shared-inspector.png')});
 await size.evaluate(e=>e.setSelectionRange(1,2));await ui.locator('.screen-text-layout').evaluate(e=>e.open=true);
 const scroll=await ui.locator('.screen-text-body').evaluate(e=>{e.scrollTop=120;return e.scrollTop;});
 await ui.getByRole('button',{name:'View uses',exact:true}).click();
 const review=page.getByRole('dialog',{name:'Style uses',exact:true});await review.waitFor();
 assert.match(await review.innerText(),/travel_notes/);assert.match(await review.innerText(),/about/);assert.equal(await review.locator('.screen-style-uses li').count(),8);
 await review.getByRole('button',{name:/pause_menu/}).click();assert.equal(await review.locator('.screen-style-preview h3').innerText(),'pause_menu');
 await review.screenshot({path:join(output,'view-uses.png')});
 await review.getByRole('button',{name:'Keep editing',exact:true}).click();assert.equal(await size.inputValue(),'32');assert.equal(await read(owners[0]),before);
 assert.equal(await size.evaluate(e=>e===document.activeElement),true);assert.deepEqual(await size.evaluate(e=>[e.selectionStart,e.selectionEnd]),[1,2]);assert.equal(await ui.locator('.screen-text-body').evaluate(e=>e.scrollTop),scroll);
 await ui.getByRole('button',{name:'This element only',exact:true}).press('Enter');assert.equal(await size.inputValue(),'32');assert.equal(await page.getByRole('dialog').count(),0);await ui.locator('.screen-text-layout').evaluate(e=>e.open=false);await ui.locator('.screen-text-body').evaluate(e=>e.scrollTop=0);await size.focus();await size.evaluate(e=>e.setSelectionRange(2,2));await ui.locator('.screen-card').screenshot({path:join(output,'pending-local-inspector.png')});await ui.locator('.screen-text-layout').evaluate(e=>e.open=true);await ui.locator('.screen-text-body').evaluate((e,value)=>e.scrollTop=value,scroll);
 await ui.getByRole('button',{name:'All elements using this style',exact:true}).click();assert.equal(await size.inputValue(),'32');
 await ui.locator('[data-text-apply]').click();
 const apply=page.getByRole('dialog',{name:'Review style changes',exact:true});await apply.waitFor();assert.match(await apply.innerText(),/about/);assert.equal(await apply.locator('.screen-style-uses li').count(),8);await apply.screenshot({path:join(output,'apply-review.png')});
 await apply.getByRole('button',{name:'Apply to all elements',exact:true}).click();await apply.waitFor({state:'detached'});await settled();
 assert.equal(await read(owners[0]),before.replace('size 26 #','size 32 #'));assert.equal(await read(owners[1]),other);
 // A numeric no-op keeps all inspected screens available.
 const beforeNoop=await read(owners[0]);await size.fill('032');await ui.locator('[data-text-apply]').click();await page.getByRole('dialog',{name:'Review style changes',exact:true}).getByRole('button',{name:'Apply to all elements',exact:true}).click();await page.getByRole('dialog',{name:'Review style changes',exact:true}).waitFor({state:'detached'});await settled();assert.equal(await read(owners[0]),beforeNoop);
 await ui.getByRole('button',{name:'1 Choose',exact:true}).click();await ui.getByLabel('Screen',{exact:true}).selectOption(JSON.stringify(['owned',owners[1].id]));await ui.locator(`[data-node-id="${ids[1]}"]`).dblclick();assert.equal(await ui.getByRole('textbox',{name:'Size · px',exact:true}).inputValue(),'32');await ui.getByRole('button',{name:'1 Choose',exact:true}).click();await ui.getByLabel('Screen',{exact:true}).selectOption(JSON.stringify(['owned',owners[0].id]));await ui.locator(`[data-node-id="${ids[0]}"]`).dblclick();
 // Content-only Apply stays local even while the shared appearance scope is selected.
 const sharedSource=await read(owners[0]);await ui.locator('[data-text-field=text]').fill('Local caption only.');assert.equal(await ui.locator('[data-text-apply]').innerText(),'Apply');await ui.locator('[data-text-apply]').click();await settled();assert.equal(await page.getByRole('dialog').count(),0);assert.equal(await read(owners[1]),other);assert.equal(await read(owners[0]),sharedSource.replace('Choose a route.\\nThe last tram leaves at midnight.','Local caption only.'));
 await ui.getByRole('button',{name:'Undo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-text-field=text]')?.value.startsWith('Choose a route.'));assert.equal(await read(owners[0]),sharedSource);
 await ui.getByRole('button',{name:'This element only',exact:true}).click();await size.fill('40');await ui.locator('[data-text-apply]').click();
 await page.getByRole('dialog',{name:'Review style changes',exact:true}).getByRole('button',{name:'Apply to this element',exact:true}).click();
 await page.getByRole('dialog',{name:'Review style changes',exact:true}).waitFor({state:'detached'});await settled();
 assert.equal(await size.inputValue(),'40');assert.equal(await read(owners[1]),other);
 assert.match(await read(owners[0]),/style ll_copy_[a-f0-9]+ is text:/);
 await page.screenshot({path:join(output,'local-applied.png')});
 const copied=await read(owners[0]);
 await ui.getByRole('button',{name:'Undo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-text-field=size]')?.value==='32');
 assert.equal(await read(owners[0]),before.replace('size 26 #','size 32 #'));
 await ui.getByRole('button',{name:'Redo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-text-field=size]')?.value==='40');assert.equal(await read(owners[0]),copied);
 // A changed use between review and confirmation refuses the entire command.
 await size.fill('44');await ui.locator('[data-text-apply]').click();
 const stale=page.getByRole('dialog',{name:'Review style changes',exact:true});await stale.waitFor();
 const otherSource=await read(owners[1]);await save(owners[1],otherSource+'\n# ordinary Source update\n');
 await stale.getByRole('button',{name:'Apply to all elements',exact:true}).click();await stale.waitFor({state:'detached'});
 await ui.locator('.screen-text-error').getByText(/Your edits are kept/).waitFor();assert.equal(await size.inputValue(),'44');assert.equal(await read(owners[0]),copied);
 await ui.getByRole('button',{name:'Cancel',exact:true}).click();await ui.getByRole('button',{name:'Refresh Source',exact:true}).click();
 const sourceBefore=await read(owners[0]);await save(owners[0],sourceBefore.replace('size 40','size 42'));await ui.getByRole('button',{name:'Refresh Source',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-text-field=size]')?.value==='42');
 await ui.getByRole('button',{name:'Undo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-text-field=size]')?.value==='40');
 await ui.getByRole('button',{name:'Redo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-text-field=size]')?.value==='42');
 await request('project.close');await page.reload();await page.evaluate(async()=>{const {startApplication}=await import('/src/main.ts');startApplication((operation,payload)=>window.styleRpc({protocolVersion:1,requestId:crypto.randomUUID(),operation,payload}));});await page.locator('.recent-open').click();await page.getByRole('button',{name:'Screens',exact:true}).click();await page.locator('.screens-editor').getByLabel('Screen',{exact:true}).selectOption(JSON.stringify(['owned',owners[0].id]));await page.locator(`[data-node-id="${ids[0]}"]`).dblclick();assert.equal(await page.getByRole('textbox',{name:'Size · px',exact:true}).inputValue(),'42');
 // Changing and creating a Style use the same accepted transaction path.
 const active=page.locator('.screens-editor');await active.getByRole('button',{name:'1 Choose',exact:true}).click();await active.getByLabel('Screen',{exact:true}).selectOption(JSON.stringify(['owned',owners[1].id]));await active.locator(`[data-node-id="${ids[1]}"]`).dblclick();
 const firstSaved=await read(owners[0]);await active.getByRole('button',{name:'Change style…',exact:true}).click();await page.getByRole('dialog',{name:'Choose style',exact:true}).getByRole('button',{name:/Independent style/}).click();
 assert.equal(await active.getByRole('textbox',{name:'Size · px',exact:true}).inputValue(),'42');await active.locator('[data-text-apply]').click();const assignment=page.getByRole('dialog',{name:'Review style changes',exact:true});assert.equal(await assignment.locator('.screen-style-uses li').count(),1);await assignment.getByRole('button',{name:'Apply to this element',exact:true}).click();await assignment.waitFor({state:'detached'});await settled();assert.equal(await read(owners[0]),firstSaved);
 assert.match(await read(owners[1]),/style "ll_copy_[a-f0-9]+"/);
 const c=await request('screens.list'),created=await request('screens.create',{name:'caption',expectedProjectRevision:c.projectRevision,expectedSourceMapRevision:c.sourceMapRevision,expectedInventoryRevision:c.inventoryRevision}),caption=created.owned.find(o=>o.name==='caption');
 const add=async kind=>{const doc=await request('screens.inspect',{path:caption.path});return request('screens.compose',{screenId:caption.id,expectedRevision:doc.revision,command:{type:'add',parentId:caption.rootId,kind,text:'Caption'}});};
 const text=await add('text');await active.getByRole('button',{name:'1 Choose',exact:true}).click();await active.getByRole('button',{name:'Refresh Source',exact:true}).click();await active.getByLabel('Screen',{exact:true}).selectOption(JSON.stringify(['owned',caption.id]));await active.locator(`[data-node-id="${text.selectedId}"]`).dblclick();
 await active.getByRole('textbox',{name:'Size · px',exact:true}).fill('22');const plain=await read(caption);await active.getByRole('button',{name:'Change style…',exact:true}).click();let chooser=page.getByRole('dialog',{name:'Choose style',exact:true});await chooser.getByRole('textbox',{name:'Style name',exact:true}).fill('Caption style');await chooser.getByRole('button',{name:'Keep editing',exact:true}).click();assert.equal(await read(caption),plain);assert.equal(await active.getByRole('textbox',{name:'Size · px',exact:true}).inputValue(),'22');
 await active.getByRole('button',{name:'Change style…',exact:true}).click();chooser=page.getByRole('dialog',{name:'Choose style',exact:true});await chooser.getByRole('textbox',{name:'Style name',exact:true}).fill('  Caption__Style  ');await chooser.getByRole('button',{name:'Create style',exact:true}).click();await active.locator('[data-text-apply]').click();await page.getByRole('dialog',{name:'Review style changes',exact:true}).getByRole('button',{name:'Apply to this element',exact:true}).click();await page.getByRole('dialog',{name:'Review style changes',exact:true}).waitFor({state:'detached'});await settled();
 const named=await read(caption);assert.match(named,/style caption__style is text:/);assert.match(named,/style "caption__style"/);await active.getByRole('button',{name:'Undo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-text-field=size]')?.value==='');assert.equal(await read(caption),plain);await active.getByRole('button',{name:'Redo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-text-field=size]')?.value==='22');
 const frame=await add('frame');await active.getByRole('button',{name:'1 Choose',exact:true}).click();await active.getByRole('button',{name:'Refresh Source',exact:true}).click();await active.locator(`[data-node-id="${frame.selectedId}"]`).dblclick();await active.getByRole('textbox',{name:'Background color',exact:true}).fill('#123456');await active.getByRole('textbox',{name:'Border color',exact:true}).fill('#abcdef');await active.getByRole('textbox',{name:'Border width · px',exact:true}).fill('2');await active.locator('[data-text-apply]').click();await page.waitForFunction(()=>document.querySelector('[data-text-apply]')?.disabled===true&&!document.querySelector('.screen-text-state')?.textContent.includes('Applying')); assert.match(await read(caption),/background "#123456"/);assert.match(await read(caption),/foreground Frame\(Composite\(\(6, 6\)/);
 const panelSource=await read(caption),libraryCatalog=await request('screens.list');const libraryResult=await request('screens.create',{name:'panel_styles',expectedProjectRevision:libraryCatalog.projectRevision,expectedSourceMapRevision:libraryCatalog.sourceMapRevision,expectedInventoryRevision:libraryCatalog.inventoryRevision}),library=libraryResult.owned.find(o=>o.name==='panel_styles');const librarySource=await read(library)+'\nstyle panel_style is frame:\n    background "#654321"\n';await save(library,librarySource);assert.equal((await request('screens.list')).styles.definitions.find(d=>d.name==='panel_style')?.error,null);
 await active.getByRole('button',{name:'1 Choose',exact:true}).click();await active.getByRole('button',{name:'Refresh Source',exact:true}).click();await active.getByLabel('Screen',{exact:true}).locator('option').filter({hasText:'panel_styles'}).waitFor({state:'attached'});await active.locator(`[data-node-id="${frame.selectedId}"]`).dblclick();await active.getByRole('button',{name:'Change style…',exact:true}).click();await page.getByRole('dialog',{name:'Choose style',exact:true}).getByRole('button',{name:/Panel style/}).click();
 const previewDocument=await request('screens.inspect',{path:caption.path});
 assignmentPreviewTarget={path:caption.path,screenName:caption.name,revision:previewDocument.revision,nodeStart:previewDocument.screens.find(s=>s.name===caption.name).nodes.find(n=>n.id===frame.selectedId).span.start};
 await active.locator('[data-text-apply]').click();const appearanceReview=page.getByRole('dialog',{name:'Review style changes',exact:true});await appearanceReview.waitFor();
 // A click does not acknowledge the canvas timer or its asynchronous core reply.
 let previewTimer;
 try {
  const proof=await Promise.race([assignmentPreview,new Promise((_,reject)=>{previewTimer=setTimeout(()=>reject(Error('Assigned Style preview did not reach core plan validation')),8000);})]);
  assert.equal(proof.plan.ok,true,JSON.stringify(proof));
  assert.equal(proof.plan.value.revision,assignmentPreviewTarget.revision);
  assert.deepEqual(proof.payload.textStyles.find(sample=>sample.nodeStart===assignmentPreviewTarget.nodeStart).values.appearance,{background:'#654321',border:null});
  const properties=proof.plan.value.nodes.find(node=>node.start===assignmentPreviewTarget.nodeStart).properties;
  assert.equal(properties.background,'#654321');assert.equal(properties.foreground,undefined);
 } finally {clearTimeout(previewTimer);}
 await appearanceReview.getByRole('button',{name:'Keep editing',exact:true}).click();
 assert.equal(await read(caption),panelSource);assert.equal(await read(library),librarySource);await active.getByRole('button',{name:'Cancel',exact:true}).click();
 const button=await add('textbutton');await active.getByRole('button',{name:'1 Choose',exact:true}).click();await active.getByRole('button',{name:'Refresh Source',exact:true}).click();await active.locator(`[data-node-id="${button.selectedId}"]`).dblclick();await active.getByRole('combobox',{name:'Appearance state',exact:true}).selectOption('hover_');await active.getByRole('textbox',{name:'State text color',exact:true}).fill('#ffffff');await active.getByRole('textbox',{name:'Background color',exact:true}).fill('#345678');await active.locator('[data-text-apply]').click();await page.waitForFunction(()=>document.querySelector('[data-text-apply]')?.disabled===true&&!document.querySelector('.screen-text-state')?.textContent.includes('Applying')); assert.match(await read(caption),/text_hover_color "#ffffff"/);assert.match(await read(caption),/hover_background "#345678"/);
 // Repeated pending assignments must not turn previous defaults into shared edits.
 const switchCatalog=await request('screens.list'),switchResult=await request('screens.create',{name:'style_switches',expectedProjectRevision:switchCatalog.projectRevision,expectedSourceMapRevision:switchCatalog.sourceMapRevision,expectedInventoryRevision:switchCatalog.inventoryRevision}),switchOwner=switchResult.owned.find(o=>o.name==='style_switches');
 const switchIds=[];
 for(const label of ['Assign me','Existing C use']){const doc=await request('screens.inspect',{path:switchOwner.path});switchIds.push((await request('screens.compose',{screenId:switchOwner.id,expectedRevision:doc.revision,command:{type:'add',parentId:switchOwner.rootId,kind:'textbutton',text:label}})).selectedId);}
 let switchSource=await read(switchOwner);
 for(const [index,id] of switchIds.entries()){switchSource=switchSource.replace(`textbutton "${index?'Existing C use':'Assign me'}" #`,`textbutton "${index?'Existing C use':'Assign me'}": #`).replace(`# loomlight-element: ${id}\n`,`# loomlight-element: ${id}\n        style "switch_${index?'c':'a'}" # keep assignment\n        text_style "switch_${index?'c':'a'}" # keep label style\n`);}
 switchSource+='\n# Keep all style definitions and their existing uses unchanged.\n';
 for(const [name,size,color] of [['a',20,'#123456'],['b',30,'#456789'],['c',40,'#789abc']])switchSource+=`style switch_${name} is button:\n    size ${size} # keep size\n    color "${color}"\n    background "${color}"\n    hover_color "${color}"\n\n`;
 await save(switchOwner,switchSource);
 await active.getByRole('button',{name:'1 Choose',exact:true}).click();await active.getByRole('button',{name:'Refresh Source',exact:true}).click();await active.getByLabel('Screen',{exact:true}).selectOption(JSON.stringify(['owned',switchOwner.id]));await active.locator(`[data-node-id="${switchIds[0]}"]`).dblclick();
 const chooseSwitch=async name=>{await active.getByRole('button',{name:'Change style…',exact:true}).click();await page.getByRole('dialog',{name:'Choose style',exact:true}).getByRole('button',{name:new RegExp(`^Switch ${name} ·`)}).click();};
 await chooseSwitch('b');assert.equal(await active.getByRole('textbox',{name:'Size · px',exact:true}).inputValue(),'30');await chooseSwitch('c');assert.equal(await active.getByRole('textbox',{name:'Size · px',exact:true}).inputValue(),'40');
 assert.equal(await active.getByRole('textbox',{name:'Background color',exact:true}).inputValue(),'#789abc');
 await chooseSwitch('a');assert.equal(await active.getByRole('textbox',{name:'Size · px',exact:true}).inputValue(),'20');assert.equal(await active.locator('[data-text-apply]').isDisabled(),true);
 await chooseSwitch('b');await chooseSwitch('c');
 const switchDocument=await request('screens.inspect',{path:switchOwner.path}),switchNode=switchDocument.screens.find(s=>s.name===switchOwner.name).nodes.find(n=>n.id===switchIds[0]);
 switchPreviewTarget={path:switchOwner.path,screenName:switchOwner.name,revision:switchDocument.revision,nodeStart:switchNode.span.start};
 await active.locator('[data-text-apply]').click();const switchReview=page.getByRole('dialog',{name:'Review style changes',exact:true});await switchReview.waitFor();assert.equal(await switchReview.locator('.screen-style-uses li').count(),1);
 let switchTimer;let pendingProperties;try{const proof=await Promise.race([switchPreview,new Promise((_,reject)=>{switchTimer=setTimeout(()=>reject(Error('Repeated Style assignment preview did not reach core plan validation')),8000);})]);assert.equal(proof.plan.ok,true,JSON.stringify(proof));pendingProperties=proof.plan.value.nodes.find(n=>n.start===switchNode.span.start).properties;assert.equal(pendingProperties.text_size,40);assert.equal(pendingProperties.background,'#789abc');}finally{clearTimeout(switchTimer);}
 await switchReview.getByRole('button',{name:'Apply to this element',exact:true}).click();await switchReview.waitFor({state:'detached'});await settled();
 assert.equal(await read(switchOwner),switchSource.replaceAll('"switch_a"','"switch_c"'));
 const acceptedSwitch=await request('screens.inspect',{path:switchOwner.path}),acceptedNode=acceptedSwitch.screens.find(s=>s.name===switchOwner.name).nodes.find(n=>n.id===switchIds[0]);assert.equal(acceptedNode.textProperties.values.size,40);assert.equal(acceptedNode.textProperties.values.background,'#789abc');
 const acceptedPlan=await request('screens.canvasPlan',{path:switchOwner.path,screenName:switchOwner.name,expectedRevision:acceptedSwitch.revision,width:1280,height:720});assert.deepEqual(acceptedPlan.nodes.find(n=>n.start===acceptedNode.span.start).properties,pendingProperties);
 await active.getByRole('button',{name:'Undo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-text-field=size]')?.value==='20');assert.equal(await read(switchOwner),switchSource);await active.getByRole('button',{name:'Redo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-text-field=size]')?.value==='40');assert.equal(await read(switchOwner),switchSource.replaceAll('"switch_a"','"switch_c"'));
 // A text-only target owns typography; inherited button decoration stays local.
 const decorateDocument=await request('screens.inspect',{path:switchOwner.path}),decorateCatalog=await request('screens.list');
 const decoration={border:{color:'#abcdef',width:2}};for(const state of ['hover_','selected_','insensitive_']){decoration[state+'background']='#345678';decoration[state+'border']={color:'#fedcba',width:3};}
 await request('screens.compose',{screenId:switchOwner.id,expectedRevision:decorateDocument.revision,command:{type:'formatText',nodeId:switchIds[0],values:{appearance:decoration},style:{scope:'shared',name:'switch_c',expectedRevision:decorateCatalog.styles.revision}}});
 const beforeTextAssignment=await read(switchOwner),textStyleSource=beforeTextAssignment+'\nstyle switch_label is text:\n    size 50\n    color "#fedcba"\n    hover_color "#fedcba"\n';await save(switchOwner,textStyleSource);
 const labelCatalog=await request('screens.list');assert.equal(labelCatalog.styles.definitions.find(d=>d.name==='switch_label')?.error,null,JSON.stringify(labelCatalog.styles));
 await active.getByRole('button',{name:'1 Choose',exact:true}).click();const oldScreenOption=await active.getByLabel('Screen',{exact:true}).locator('option').first().elementHandle();await active.getByRole('button',{name:'Refresh Source',exact:true}).click();await page.waitForFunction(option=>!option.isConnected,oldScreenOption);await active.locator(`[data-node-id="${switchIds[0]}"]`).dblclick();await chooseSwitch('label');assert.equal(await active.getByRole('textbox',{name:'Size · px',exact:true}).inputValue(),'50');
 const textAssignmentDocument=await request('screens.inspect',{path:switchOwner.path}),textAssignmentNode=textAssignmentDocument.screens.find(s=>s.name===switchOwner.name).nodes.find(n=>n.id===switchIds[0]);
 const originalTextPlan=await request('screens.canvasPlan',{path:switchOwner.path,screenName:switchOwner.name,expectedRevision:textAssignmentDocument.revision,width:1280,height:720}),originalTextProperties=originalTextPlan.nodes.find(n=>n.start===textAssignmentNode.span.start).properties;
 textAssignmentTarget={path:switchOwner.path,screenName:switchOwner.name,revision:textAssignmentDocument.revision,nodeStart:textAssignmentNode.span.start};
 await active.locator('[data-text-apply]').click();const textReview=page.getByRole('dialog',{name:'Review style changes',exact:true});await textReview.waitFor();
 let textTimer;let textPendingProperties;try{const proof=await Promise.race([textAssignmentPreview,new Promise((_,reject)=>{textTimer=setTimeout(()=>reject(Error('Text-only Style assignment preview did not reach core plan validation')),8000);})]);assert.equal(proof.plan.ok,true,JSON.stringify(proof));textPendingProperties=proof.plan.value.nodes.find(n=>n.start===textAssignmentNode.span.start).properties;assert.equal(textPendingProperties.background,'#789abc');assert.equal(textPendingProperties.text_size,50);assert.equal(textPendingProperties.text_hover_color,'#fedcba');for(const key of ['background','foreground','hover_background','hover_foreground','selected_background','selected_foreground','insensitive_background','insensitive_foreground']){assert.notEqual(originalTextProperties[key],undefined,key);assert.deepEqual(textPendingProperties[key],originalTextProperties[key],key);}}finally{clearTimeout(textTimer);}
 await textReview.getByRole('button',{name:'Apply to this element',exact:true}).click();await textReview.waitFor({state:'detached'});await settled();
 const textAccepted=await request('screens.inspect',{path:switchOwner.path}),textAcceptedNode=textAccepted.screens.find(s=>s.name===switchOwner.name).nodes.find(n=>n.id===switchIds[0]);assert.equal(textAcceptedNode.textProperties.values.background,'#789abc');assert.equal(textAcceptedNode.textProperties.values.size,50);assert.equal(textAcceptedNode.style.name,'switch_label');assert.equal(textAcceptedNode.style.error,null);
 const textAcceptedPlan=await request('screens.canvasPlan',{path:switchOwner.path,screenName:switchOwner.name,expectedRevision:textAccepted.revision,width:1280,height:720}),textAcceptedProperties=textAcceptedPlan.nodes.find(n=>n.start===textAcceptedNode.span.start).properties;
 // The full-button source had a label-style reset. Its reference is removed on assignment.
 const pendingAppearance={...textPendingProperties};delete pendingAppearance.text_style;assert.deepEqual(textAcceptedProperties,pendingAppearance);
 const textSaved=await read(switchOwner);assert.equal(textSaved.split('\nstyle switch_a')[1],textStyleSource.split('\nstyle switch_a')[1]);assert.equal(textSaved.includes('style "switch_c" # keep assignment'),true,'The existing C use remains assigned to C');assert.equal(textSaved.includes('text_style "switch_label" # keep label style'),true);
 await active.getByRole('button',{name:'Undo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-text-field=size]')?.value==='40');assert.equal(await read(switchOwner),textStyleSource);await active.getByRole('button',{name:'Redo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-text-field=size]')?.value==='50');assert.equal(await read(switchOwner),textSaved);
 assert.deepEqual(errors,[]);await writeFile(join(output,'result.json'),JSON.stringify({passed:true,realCore:true,sdk:false,native:false,errors,plans,assignmentPreviewProof,switchPreviewProof,textAssignmentProof},null,2));console.log('PASS shared and independent Style journeys through production UI/core.');
} catch(error) {await page?.screenshot({path:join(output,'failure.png')}).catch(()=>{});await writeFile(join(output,'failure.json'),JSON.stringify({error:String(error),errors,canvasRequests,plans,assignmentPreviewTarget,assignmentPreviewProof,switchPreviewTarget,switchPreviewProof,textAssignmentTarget,textAssignmentProof},null,2));throw error;} finally {await browser?.close();await server.close();await child.stop();}
