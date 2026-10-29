// Production Screens controller and core. Only native font selection is substituted.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {randomUUID} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import {driverProcess} from './phase2-driver-process.mjs';

const output=resolve(process.env.PROJECT_FONT_OUTPUT??'../.toolchains/font-cache-review/controller');
await mkdir(output,{recursive:true});
const fixture=join(tmpdir(),`loomlight-help-controller-${randomUUID()}`);
const child=driverProcess(resolve(process.env.CARGO_TARGET_DIR??'target',`debug/examples/help-controller-driver${process.platform==='win32'?'.exe':''}`),[fixture,'project-font'],{startupTimeout:60000});
const server=await createServer({root:resolve('.'),cacheDir:join(output,'vite'),logLevel:'error',server:{host:'127.0.0.1',port:0}});
const errors=[];
let browser,page,sessionId,holdPresentation=false,releasePresentation;
const presentationReleased=new Promise(resolve=>{releasePresentation=resolve;});
const rpc=async request=>{
 if(request.operation==='screens.canvasStatus'||request.operation==='screens.canvasRender')return {ok:true,value:{phase:'unavailable',message:'SDK qualification is separate.'}};
 const held=request.operation==='asset.presentFont'&&holdPresentation;
 const result=await child.request(request);
 if(held)await presentationReleased;
 if(result.value?.sessionId)sessionId=result.value.sessionId;
 return result;
};
const request=async(operation,payload={})=>{
 const result=await rpc({protocolVersion:1,requestId:randomUUID(),operation,payload:{sessionId,...payload}});
 assert.equal(result.ok,true,JSON.stringify(result));return result.value;
};
try {
 assert.equal((await child.next()).ready,true);
 await server.listen();browser=await chromium.launch({channel:'chrome',headless:true});
 page=await browser.newPage({viewport:{width:1100,height:800}});page.setDefaultTimeout(10000);
 await page.routeWebSocket('**',()=>{});page.on('pageerror',error=>errors.push(error.message));
 await page.exposeBinding('fontRpc',(_,request)=>rpc(request));
 await page.route('**/font-cache-controller',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><link rel="stylesheet" href="/src/screen-ui.css"><div id="app"></div>'}));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/font-cache-controller`);
 await page.evaluate(async()=>{const {startApplication}=await import('/src/main.ts');startApplication((operation,payload)=>window.fontRpc({protocolVersion:1,requestId:crypto.randomUUID(),operation,payload}));});
 await page.locator('.recent-open').click();
 // Five real 15 MiB fonts exceed the production 64 MiB media cache.
 for(let index=0;index<5;index++){
  const selected=await child.request({driver:'chooseFont',cacheIndex:index});
  await request('asset.import',{authorityId:selected.authorityId,kind:'font',technicalName:`cache_${index}`,displayName:`Cache font ${index}`,characterId:null,expression:null});
  console.log(`Imported cache font ${index}.`);
 }
 const catalog=await request('screens.list');
 const created=await request('screens.create',{name:'font_cache',expectedProjectRevision:catalog.projectRevision,expectedSourceMapRevision:catalog.sourceMapRevision,expectedInventoryRevision:catalog.inventoryRevision});
 const owner=created.owned.find(screen=>screen.name==='font_cache');
 const added=await request('screens.compose',{screenId:owner.id,expectedRevision:(await request('screens.inspect',{path:owner.path})).revision,command:{type:'add',parentId:owner.rootId,kind:'text',text:'Choose an earlier font.'}});
 await page.getByRole('button',{name:'Screens',exact:true}).click();
 const ui=page.locator('.screens-editor');
 await ui.getByLabel('Screen',{exact:true}).selectOption(JSON.stringify(['owned',owner.id]));
 await ui.locator(`[data-node-id="${added.selectedId}"]`).dblclick();
 const trigger=ui.getByRole('button',{name:'Choose project font',exact:true});
 await trigger.click();
 const picker=page.getByRole('dialog',{name:'Choose project font',exact:true});
 for(let index=0;index<5;index++){
  const row=picker.getByRole('button',{name:`Use Cache font ${index}`,exact:true});
  await row.scrollIntoViewIfNeeded();
  await page.waitForFunction(name=>{const row=document.querySelector(`[aria-label="${name}"]`);return row&&!row.disabled&&getComputedStyle(row.querySelector('.screen-font-specimen')).fontFamily.includes('loomlight-project-font');},`Use Cache font ${index}`);
  console.log(`Browsed decoded cache font ${index}.`);
 }
 const earlier=picker.getByRole('button',{name:'Use Cache font 0',exact:true});
 // Deliver any real specimen reload only after selection. Its speed cannot make
 // a decoded-cache membership check accept this click by accident.
 holdPresentation=true;
 await earlier.scrollIntoViewIfNeeded();
 await earlier.click();
 await picker.waitFor({state:'detached'});
 assert.equal(await trigger.evaluate(element=>element===document.activeElement),true,'Choosing an earlier font closes the picker and returns focus');
 assert.match(await trigger.innerText(),/Cache font 0/);
 holdPresentation=false;releasePresentation();
 const read=async()=>(await request('source.open',{path:owner.path})).text;
 const before=await read();assert.doesNotMatch(before,/font "fonts\//,'Font selection remains a text draft');
 const apply=ui.getByRole('button',{name:'Apply',exact:true});await apply.click();
 await page.waitForFunction(()=>document.querySelector('[data-text-apply]')?.disabled===true&&document.querySelector('.screen-text-state')?.textContent==='');
 const accepted=await read();assert.match(accepted,/font "fonts\/cache_0.ttf"/,'Apply accepts the chosen asset after its specimen was evicted');
 await ui.getByRole('button',{name:'Undo',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.screen-text-font strong')?.textContent==='Default font');
 assert.equal(await read(),before,'Undo restores the source before the font choice');
 await ui.getByRole('button',{name:'Redo',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.screen-text-font strong')?.textContent==='Cache font 0');
 assert.equal(await read(),accepted,'Redo restores the chosen project font');
 assert.deepEqual(errors,[]);
 await writeFile(join(output,'result.json'),JSON.stringify({passed:true,actualControllerCore:true,sdkExecuted:false,fontBytes:15*1024*1024,fontCount:5},null,2));
 console.log('PASS earlier project font remains selectable after browsing beyond the media cache; draft, Apply and Undo/Redo retain the asset.');
} catch(error) {
 await page?.screenshot({path:join(output,'failure.png')}).catch(()=>{});
 await writeFile(join(output,'failure.json'),JSON.stringify({error:String(error),errors},null,2));throw error;
} finally {
 releasePresentation();
 await browser?.close();await server.close();await child.stop();await rm(fixture,{recursive:true,force:true});
}
