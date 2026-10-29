// Actual Screens controller and application dispatch, with a disposable native-picker fixture.
// Canvas requests build real inert plans; this check starts no SDK or native editor.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {randomUUID} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {driverProcess} from './phase2-driver-process.mjs';
const output=resolve(process.env.UI_IMAGE_OUTPUT??'../.toolchains/ui-image/controller-01');
await mkdir(output,{recursive:true});
const driver=resolve(process.env.CARGO_TARGET_DIR??'target',`debug/examples/help-controller-driver${process.platform==='win32'?'.exe':''}`);
const child=driverProcess(driver,[join(tmpdir(),`loomlight-help-controller-${randomUUID()}`),'ui-image']);
const server=await createServer({root:resolve('.'),logLevel:'error',server:{host:'127.0.0.1',port:0}});
const errors=[],receipts=[],plans=[];let browser,sessionId,passed=false,cancelPicker=true;
const rpc=async request=>{
 if(request.operation==='asset.chooseUiImage'){
  if(cancelPicker)return {ok:true,value:{cancelled:true}};
  return {ok:true,value:await child.request({driver:'chooseImage'})};
 }
 if(request.operation==='screens.canvasStatus')return {ok:true,value:{phase:'unavailable',message:'SDK proof is separate.'}};
 if(request.operation==='screens.canvasRender'){
  const response=await child.request({...request,operation:'screens.canvasPlan'});plans.push(response);
  return {ok:true,value:{phase:'unavailable',message:'SDK proof is separate.'}};
 }
 const response=await child.request(request);receipts.push({operation:request.operation,ok:response.ok,error:response.error?.code});
 if(response.value?.sessionId)sessionId=response.value.sessionId;return response;
};
const request=async(operation,payload={})=>{const response=await rpc({protocolVersion:1,requestId:randomUUID(),operation,payload:{sessionId,...payload}});assert.equal(response.ok,true,JSON.stringify(response));return response.value;};
try {
 assert.equal((await child.next()).ready,true);await server.listen();
 browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1100,height:800}});page.setDefaultTimeout(8000);
 await page.routeWebSocket('**',()=>{});page.on('pageerror',e=>errors.push(e.message));
 await page.exposeBinding('imageRpc',(_,r)=>rpc(r));
 await page.route('**/image-controller',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><link rel="stylesheet" href="/src/screen-ui.css"><div id="app"></div>'}));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/image-controller`);
 await page.evaluate(async()=>{const {startApplication}=await import('/src/main.ts');startApplication((operation,payload)=>window.imageRpc({protocolVersion:1,requestId:crypto.randomUUID(),operation,payload}));});
 await page.locator('.recent-open').click();await page.getByRole('button',{name:'Screens',exact:true}).click();
 await page.evaluate(async()=>{const {updatePreferences}=await import('/src/preferences.ts');await updatePreferences({theme:'dark'});});
 await page.getByRole('button',{name:'Toggle navigation size',exact:true}).click();
 const catalog=await request('screens.list');const created=await request('screens.create',{name:'travel_notes',expectedProjectRevision:catalog.projectRevision,expectedSourceMapRevision:catalog.sourceMapRevision,expectedInventoryRevision:catalog.inventoryRevision});
 const owner=created.owned.find(s=>s.name==='travel_notes'),ui=page.locator('.screens-editor');
 await ui.getByRole('button',{name:'Refresh Source',exact:true}).click();
 await ui.getByLabel('Screen',{exact:true}).selectOption(JSON.stringify(['owned',owner.id]));
 const read=async()=>(await request('source.open',{path:owner.path})).text;
 const blank=await read();
 const add=async()=>{await ui.getByRole('button',{name:'1  Choose',exact:true}).click();await ui.getByRole('button',{name:'Add element',exact:true}).click();await ui.getByRole('button',{name:'Image',exact:true}).click();};
 const refresh=async()=>{const layout=ui.locator('.screen-image-layout');if(await layout.count())await layout.evaluate(e=>e.open=true);await ui.getByRole('button',{name:'Refresh Source',exact:true}).click();};
 const picker=()=>page.getByRole('dialog',{name:'Choose UI image',exact:true});
 const browse=async()=>{await picker().getByRole('button',{name:'Import image…',exact:true}).click();await picker().getByRole('button',{name:'Browse files…',exact:true}).click();};
 await add();await ui.getByRole('button',{name:'Choose image',exact:true}).click();await browse();
 await picker().getByRole('button',{name:'Close',exact:true}).click();assert.equal(await read(),blank);
 await ui.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await read(),blank);
 await add();await ui.getByRole('button',{name:'Choose image',exact:true}).click();cancelPicker=false;await browse();
 await picker().getByRole('textbox',{name:'Display name',exact:true}).fill('Station seal');
 await picker().getByRole('button',{name:'Import and use',exact:true}).click();await picker().waitFor({state:'detached'});
 const assets=await request('authoring.list'),asset=assets.assets.find(a=>a.kind==='uiImage');assert(asset);assert.equal(asset.naturalWidth,80);assert.equal(asset.naturalHeight,40);assert.equal(await read(),blank);
 const width=ui.getByRole('textbox',{name:'Width',exact:true}),height=ui.getByRole('textbox',{name:'Height',exact:true});
 assert.equal(await width.inputValue(),'320');assert.equal(await height.inputValue(),'160');
 await ui.getByRole('button',{name:'Add image',exact:true}).click();await ui.getByRole('button',{name:'Apply image',exact:true}).waitFor();
 const placed=await read();assert.match(placed,/add "images\/ui station_seal.png":/);assert.match(placed,/xsize 320\n\s+ysize 160/);
 await width.fill('200');assert.equal(await height.inputValue(),'100');await width.press('Enter');await page.waitForFunction(()=>document.querySelector('.screen-image-state')?.textContent==='No pending changes');
 const sized=await read();assert.match(sized,/xsize 200\n\s+ysize 100/);assert.equal(await width.evaluate(e=>e===document.activeElement),true);
 await width.fill('bad');await ui.getByRole('button',{name:'Apply image',exact:true}).click();assert.equal(await width.getAttribute('aria-invalid'),'true');assert.equal(await read(),sized);await width.press('Escape');assert.equal(await width.inputValue(),'200');
 await ui.getByLabel('Preserve aspect ratio',{exact:true}).uncheck();await height.fill('70');await height.press('Enter');await page.waitForFunction(()=>document.querySelector('.screen-image-state')?.textContent==='No pending changes');const stretched=await read();assert.match(stretched,/ysize 70/);
 await ui.getByRole('button',{name:'Undo',exact:true}).click();await height.waitFor();await page.waitForFunction(()=>document.querySelector('[data-image-field=height]')?.value==='100');assert.equal(await read(),sized);
 await ui.getByRole('button',{name:'Redo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-image-field=height]')?.value==='70');assert.equal(await read(),stretched);
 await page.screenshot({path:join(output,'placed-dark-wide.png'),fullPage:false});
 await page.setViewportSize({width:560,height:640});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:join(output,'placed-dark-compact.png'),fullPage:false});await writeFile(join(output,'compact-dom.json'),JSON.stringify(await page.evaluate(()=>({appCount:document.querySelectorAll('#app').length,headers:[...document.querySelectorAll('.app-header')].map(e=>({text:e.textContent,rect:e.getBoundingClientRect().toJSON()})),apply:document.querySelector('[data-image-apply]')?.getBoundingClientRect().toJSON(),pixel:document.elementFromPoint(280,580)?.outerHTML})),null,2));
 assert.equal(await ui.getByRole('button',{name:'Apply image',exact:true}).evaluate(e=>{const r=e.getBoundingClientRect();return r.bottom<640&&document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)===e;}),true);
 await page.setViewportSize({width:1100,height:800});
 await width.fill('240');await ui.getByRole('button',{name:'View in Source',exact:true}).first().click();const source=page.getByRole('dialog',{name:'Screen source',exact:true});await source.waitFor();assert.match(await source.locator('pre').innerText(),/xsize 200/);await page.keyboard.press('Escape');assert.equal(await width.inputValue(),'240');
 await child.request({driver:'externalAppend',path:owner.path});await width.press('Enter');await ui.getByText(/Your draft is retained/).first().waitFor();assert.equal(await width.inputValue(),'240');await width.press('Escape');
 await refresh();await page.waitForFunction(()=>document.querySelector('.screen-image-state')?.textContent==='No pending changes');
 await child.request({driver:'imageFile',state:'changed'});await refresh();await ui.getByRole('button',{name:'Review changed image',exact:true}).click();const review=page.getByRole('dialog',{name:'Review changed image',exact:true});await review.waitFor();assert.match(await review.innerText(),/80 × 32 px/);await review.getByRole('button',{name:'Use changed image',exact:true}).click();assert.equal((await request('authoring.list')).assets.find(a=>a.id===asset.id).sha256,asset.sha256);
 await ui.getByRole('button',{name:'Apply image',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.screen-image-state')?.textContent==='No pending changes');assert.notEqual((await request('authoring.list')).assets.find(a=>a.id===asset.id).sha256,asset.sha256);
 await child.request({driver:'imageFile',state:'missing'});await refresh();await ui.getByText('Image missing. Restore the file or choose another image.',{exact:true}).waitFor();await width.fill('260');await ui.getByRole('button',{name:'Apply image',exact:true}).click();assert.equal(await width.inputValue(),'260');await width.press('Escape');
 assert.equal(receipts.some(r=>r.operation.startsWith('runtime.')),false);assert.equal(plans.some(p=>p.ok&&p.value.nodes.some(n=>n.kind==='image'&&n.literal==='images/ui station_seal.png')),true);assert.deepEqual(errors,[]);passed=true;
} catch(error){errors.push(String(error));throw error;}
finally{await writeFile(join(output,'result.json'),JSON.stringify({passed,controllerAndRealCore:true,nativePicker:false,sdkRendering:false,receipts,plans,errors},null,2));await browser?.close();await server.close();await child.stop();}
