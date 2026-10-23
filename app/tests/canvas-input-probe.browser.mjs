// Rehearse the exact native setup/readback against production UI/core. Chrome is not native evidence.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {driverProcess} from './phase2-driver-process.mjs';
import {buildCanvasDriver} from './canvas-driver.mjs';
const output=resolve(process.env.LOOMLIGHT_CANVAS_EVIDENCE);
await mkdir(output,{recursive:false});
const child=driverProcess(buildCanvasDriver(),[join(tmpdir(),`loomlight-canvas-controller-${randomUUID()}`)],{timeout:180000});
let server;
const create=()=>createServer({root:resolve('.'),logLevel:'error',server:{host:'127.0.0.1',port:0}});
let browser,page,current,report;
const stages=[];
let busySourceReads=0, retriedSourceRead=false;
try {
  server=await create();
  assert.equal((await child.next()).ready,true);
  await server.listen();browser=await chromium.launch({channel:'chrome',headless:true});page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.exposeBinding('canvasProbeRpc',async(_,request)=>{
    if(request.operation==='probe.canvasInputStage'){current=request.payload;stages.push(current);return {ok:true,value:{}};}
    if(request.operation==='probe.runtimeUiReport'){report=request.payload;return {ok:true,value:{}};}
    // Reproduce native contention before dispatch, only on the probe's readback.
    // Production edits still go to the real controller exactly once.
    if(current?.stage==='resize-arrow-right' && request.operation==='source.open' && request.requestId.startsWith('canvas-input-')){
      if(busySourceReads===0){
        busySourceReads++;
        return {ok:false,error:{code:'RUNTIME_BUSY',message:'Read refused before dispatch'}};
      }
      retriedSourceRead=true;
    }
    return child.request(request);
  });
  await page.route('**/canvas-controller',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><link rel="stylesheet" href="/src/screen-ui.css"><div id="app"></div>'}));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/canvas-controller`);
  await page.evaluate(async()=>{window.__TAURI_INTERNALS__={invoke:(_,args)=>window.canvasProbeRpc(args.request)};const {startApplication}=await import('/src/main.ts');const {requestCore}=await import('/src/bridge.ts');startApplication(requestCore);});
  await page.evaluate(await readFile('src-tauri/src/native_editor_probe.js','utf8'));
  // Do not await the long-running probe: input is delivered by this independent driver.
  void page.evaluate(await readFile('src-tauri/src/canvas_input_probe.js','utf8')).catch(()=>{});
  const wait=async name=>{const deadline=Date.now()+30000;while(current?.stage!==name){assert(!report,JSON.stringify(report));assert(Date.now()<deadline,`Awaiting ${name}, at ${current?.stage}`);await new Promise(r=>setTimeout(r,20));}};
  await wait('draft-width-760');await page.keyboard.press('Meta+a');await page.keyboard.type('760');
  await wait('escape-cancel');await page.keyboard.press('Escape');
  await wait('enter-apply-752');await page.keyboard.press('Meta+a');await page.keyboard.type('752');await page.keyboard.press('Enter');
  await wait('keyboard-undo');await page.keyboard.press('Enter');
  await wait('resize-arrow-right');await page.keyboard.press('ArrowRight');
  await wait('move-arrow-right');await page.keyboard.press('ArrowRight');
  await wait('drag-frame');let r=current.rect;await page.mouse.move(r.x+8,r.y+8);await page.mouse.down();await page.mouse.move(r.x+48,r.y+32,{steps:12});await page.mouse.up();await page.mouse.move(20,20,{steps:4});
  await wait('drag-resize');r=current.rect;await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+30,r.y+20,{steps:12});await page.mouse.up();await page.mouse.move(20,20,{steps:4});
  const deadline=Date.now()+30000;while(!report){assert(Date.now()<deadline,'Awaiting report');await new Promise(r=>setTimeout(r,20));}
  assert.equal(busySourceReads,1,'Expected the pre-dispatch busy source read');
  assert.equal(retriedSourceRead,true,'Expected the probe to retry its source read');
  await writeFile(join(output,'result.json'),JSON.stringify({controllerOnly:true,nativeEvidence:false,busySourceReads,retriedSourceRead,stages,report},null,2));
  assert.equal(report.passed,true,JSON.stringify(report));console.log('PASS native input probe rehearsal; no native/presentation claim.');
} catch(error) {await writeFile(join(output,'failure.txt'),String(error.stack));if(page)await page.screenshot({path:join(output,'failure.png')});throw error;}
finally {
  const cleanup=await Promise.allSettled([browser?.close(),server?.close(),child.stop()]);
  await writeFile(join(output,'cleanup.json'),JSON.stringify(cleanup.map(r=>({status:r.status,error:r.reason?.message})),null,2));
  assert(cleanup.every(r=>r.status==='fulfilled'),'An owner failed cleanup');
}
