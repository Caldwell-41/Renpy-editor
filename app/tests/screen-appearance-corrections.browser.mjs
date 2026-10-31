// Approved appearance controls through the real workspace, dispatch and transaction owner.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {randomUUID} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {driverProcess} from './phase2-driver-process.mjs';
const output=resolve(process.env.APPEARANCE_CORRECTIONS_OUTPUT??'../.toolchains/screen-corrections/controller');await mkdir(output,{recursive:true});
const root=join(tmpdir(),`loomlight-help-controller-${randomUUID()}`);
const child=driverProcess(resolve(process.env.CARGO_TARGET_DIR??'target',`debug/examples/help-controller-driver${process.platform==='win32'?'.exe':''}`),[root],{startupTimeout:60000});
let server;
let browser,page,sessionId;const errors=[],plans=[],calls=[];
const rpc=async r=>{
 calls.push(r);
 if(r.operation==='screens.canvasStatus')return {ok:true,value:{phase:'unavailable',message:'SDK qualification is separate.'}};
 if(r.operation==='screens.canvasRender'){
  const plan=await child.request({...r,operation:'screens.canvasPlan'});plans.push({payload:r.payload,plan});
  return {ok:true,value:{phase:'unavailable',message:'SDK qualification is separate.',checked:{payload:r.payload,plan}}};
 }
 const result=await child.request(r);if(result.value?.sessionId)sessionId=result.value.sessionId;return result;
};
const request=async(operation,payload={})=>{const result=await rpc({protocolVersion:1,requestId:randomUUID(),operation,payload:{sessionId,...payload}});assert.equal(result.ok,true,JSON.stringify(result));return result.value;};
const read=async owner=>(await request('source.open',{path:owner.path})).text;
const save=async(owner,text)=>{const base=await request('source.open',{path:owner.path});const draft=await request('source.updateDraft',{path:owner.path,expectedBaseRevision:base.baseRevision,text,selectionStart:0,selectionEnd:0});await request('source.save',{path:owner.path,expectedBaseRevision:draft.baseRevision,expectedDraftVersion:draft.draftVersion});};
try {
 assert.equal((await child.next()).ready,true);
 const external='screen external():\n    textbutton "External":\n        text_style "inspect_label"\n        background "#567"\n';
 await writeFile(join(root,'synthetic-project/game/screens.rpy'),external);
 server=await createServer({root:resolve('.'),configFile:false,cacheDir:join(output,'vite-cache'),logLevel:'error',server:{host:'127.0.0.1',port:0}});await server.listen();browser=await chromium.launch({channel:'chrome',headless:true});page=await browser.newPage();page.setDefaultTimeout(8000);
 page.on('pageerror',error=>errors.push(error.message));await page.exposeBinding('correctionRpc',(_,r)=>rpc(r));
 await page.route('**/appearance-corrections',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><div id="app"></div>'}));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/appearance-corrections`);
 await page.evaluate(async()=>{window.__checkedPlans=[];const {startApplication}=await import('/src/main.ts');startApplication(async(operation,payload)=>{const result=await window.correctionRpc({protocolVersion:1,requestId:crypto.randomUUID(),operation,payload});if(result.value?.checked)window.__checkedPlans.push(result.value.checked);return result;});});
 await page.locator('.recent-open').click();await page.getByRole('button',{name:'Screens',exact:true}).click();
 const catalog=await request('screens.list');const created=await request('screens.create',{name:'appearance_check',expectedProjectRevision:catalog.projectRevision,expectedSourceMapRevision:catalog.sourceMapRevision,expectedInventoryRevision:catalog.inventoryRevision});const owner=created.owned.find(o=>o.name==='appearance_check');
 const doc=await request('screens.inspect',{path:owner.path});const added=await request('screens.compose',{screenId:owner.id,expectedRevision:doc.revision,command:{type:'add',parentId:owner.rootId,kind:'textbutton',text:'Continue'}});
 let source=(await read(owner)).replace('textbutton "Continue" #','textbutton "Continue": #').replace(`# loomlight-element: ${added.selectedId}\n`,`# loomlight-element: ${added.selectedId}\n        text_style "inspect_label"\n        background "#123"\n`);
 source+='\nstyle inspect_label is text:\n    size 24 # preserve definition\n';await save(owner,source);
 const ui=page.locator('.screens-editor');await ui.getByRole('button',{name:'Refresh Source',exact:true}).click();await ui.getByLabel('Screen',{exact:true}).selectOption(JSON.stringify(['owned',owner.id]));await ui.locator(`[data-node-id="${added.selectedId}"]`).dblclick();
 const background=ui.getByRole('textbox',{name:'Background color',exact:true});assert.equal(await background.inputValue(),'#123');
 await ui.getByRole('button',{name:'This element only',exact:true}).click();await background.fill('#abc');await ui.getByRole('textbox',{name:'Text',exact:true}).fill('Local caption');
 const commitsBefore=calls.filter(c=>c.operation==='screens.compose').length;
 await ui.locator('[data-text-apply]').click();let review=page.getByRole('dialog',{name:'Review style changes',exact:true});await review.getByRole('button',{name:'Apply to this element',exact:true}).click();
 const settled=()=>page.waitForFunction(()=>document.querySelector('[data-text-apply]')?.disabled===true&&!document.querySelector('.screen-text-state')?.textContent.includes('Applying'));
 await settled();assert.equal(calls.filter(c=>c.operation==='screens.compose').length,commitsBefore+1);const accepted=await read(owner);assert.match(accepted,/background "#abc"/);assert.match(accepted,/Local caption/);assert.equal(await readFile(join(root,'synthetic-project/game/screens.rpy'),'utf8'),external);
 await ui.getByRole('button',{name:'Undo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-text-field=text]')?.value==='Continue');assert.equal(await read(owner),source);
 // The catalog's outside-file use must reach the existing planner, including pending shared values.
 await ui.getByRole('textbox',{name:'Size · px',exact:true}).fill('30');await ui.locator('[data-text-apply]').click();review=page.getByRole('dialog',{name:'Review style changes',exact:true});await review.getByRole('button',{name:/external.*game\/screens.rpy/}).click();
 await page.waitForFunction(()=>window.__checkedPlans.some(r=>r.payload.path==='game/screens.rpy'&&r.payload.textStyles?.some(s=>s.values.size===30)));
 const proof=await page.evaluate(()=>window.__checkedPlans.find(r=>r.payload.path==='game/screens.rpy'&&r.payload.textStyles?.some(s=>s.values.size===30)));
 assert.equal(proof.plan.ok,true,JSON.stringify(proof));assert.equal(proof.plan.value.nodes.find(n=>n.kind==='textbutton').properties.text_size,30);assert.equal(proof.plan.value.nodes.find(n=>n.kind==='textbutton').properties.background,'#567');
 assert.doesNotMatch(await review.innerText(),/Source changed/);await review.getByRole('button',{name:'Keep editing',exact:true}).click();await ui.getByRole('button',{name:'Cancel',exact:true}).click();
 // Dynamic decoration stays read-only while supported text edits still commit.
 const dynamic=source.replace('background "#123"','background gui.panel\n        hover_background gui.hover_panel\n        foreground gui.border');await save(owner,dynamic);await ui.getByRole('button',{name:'1 Choose',exact:true}).click();await ui.getByRole('button',{name:'Refresh Source',exact:true}).click();await ui.locator(`[data-node-id="${added.selectedId}"]`).dblclick();
 await page.waitForFunction(()=>document.querySelector('[data-appearance-field=background]')?.value==='gui.panel');assert.equal(await background.inputValue(),'gui.panel');assert.equal(await background.getAttribute('readonly'),'');assert.match(await background.locator('..').innerText(),/Source-only/);
 assert.equal(await ui.getByRole('textbox',{name:'Border color',exact:true}).inputValue(),'gui.border');assert.equal(await ui.getByRole('textbox',{name:'Border width · px',exact:true}).getAttribute('readonly'),'');
 await ui.getByRole('combobox',{name:'Appearance state',exact:true}).selectOption('hover_');assert.equal(await background.inputValue(),'gui.hover_panel');assert.equal(await background.getAttribute('readonly'),'');
 await ui.getByRole('textbox',{name:'Text',exact:true}).fill('Dynamic sibling');await ui.locator('[data-text-apply]').click();await settled();assert.equal(await read(owner),dynamic.replace('Continue','Dynamic sibling'));
 const opensBefore=calls.filter(c=>c.operation==='source.open'&&c.payload.path===owner.path).length;await background.locator('..').getByRole('button',{name:'Edit in Source',exact:true}).press('Enter');await page.getByRole('dialog',{name:'Screen source',exact:true}).waitFor();assert.match(await page.getByRole('dialog',{name:'Screen source',exact:true}).innerText(),/background gui.panel/);
 assert.ok(calls.filter(c=>c.operation==='source.open'&&c.payload.path===owner.path).length>opensBefore);
 assert.deepEqual(errors,[]);await writeFile(join(output,'result.json'),JSON.stringify({passed:true,realCore:true,sdk:false,native:false,proof,plans},null,2));console.log('PASS local decoration, Source-only expressions and indexed outside-file previews through the real controller/core.');
} catch(error) {await writeFile(join(output,'failure.json'),JSON.stringify({error:String(error),errors,plans,body:await page?.locator('body').innerText()},null,2));throw error;} finally {await browser?.close();await server?.close();await child.stop();}
