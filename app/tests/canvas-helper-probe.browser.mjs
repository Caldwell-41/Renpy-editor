// Exact packaged controller with real UI/core/SDK; Chrome supplies no native proof.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {driverProcess} from './phase2-driver-process.mjs';
import {buildCanvasDriver} from './canvas-driver.mjs';
const output=resolve(process.env.LOOMLIGHT_CANVAS_EVIDENCE??'../.toolchains/canvas-proof/controller-32');
await mkdir(output,{recursive:true});
const child=driverProcess(buildCanvasDriver(),[join(tmpdir(),`loomlight-canvas-controller-${randomUUID()}`)],{timeout:180000});
const server=await createServer({root:resolve('.'),logLevel:'error',server:{host:'127.0.0.1',port:0}});
let browser,page,accepted=false,initialBusy=false,acceptedBusy=false,acceptedWrites=0;
try {
  assert.equal((await child.next()).ready,true);
  await server.listen();browser=await chromium.launch({channel:'chrome',headless:true});page=await browser.newPage({viewport:{width:1100,height:760}});
  await page.exposeBinding('canvasProbeRpc',async(_,request)=>{
    // Browser rehearsal has no OS observer; only packaged runs admit native evidence.
    if(request.operation==='probe.canvasObservation')return {protocolVersion:1,requestId:request.requestId,ok:true,value:{ready:true}};
    if(request.operation==='probe.runtimeUiReport')return {protocolVersion:1,requestId:request.requestId,ok:true,value:{recorded:true}};
    if(request.operation==='source.open' && request.requestId.startsWith('canvas-') && (!initialBusy || (accepted && !acceptedBusy))) {
      if(accepted)acceptedBusy=true;else initialBusy=true;
      return {protocolVersion:1,requestId:request.requestId,ok:false,error:{code:'RUNTIME_BUSY',message:'Another request is in progress.'}};
    }
    const response=await child.request(request);
    if(request.operation==='screens.setLayout' && response.ok){accepted=true;acceptedWrites++;}
    return response;
  });
  await page.route('**/canvas-controller',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><link rel="stylesheet" href="/src/screen-ui.css"><div id="app"></div>'}));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/canvas-controller`);
  await page.evaluate(async()=>{
    window.__TAURI_INTERNALS__={invoke:async(command,args)=>{
      const result=await window.canvasProbeRpc(args.request);
      if(args.request.operation==='probe.runtimeUiReport')window.__canvasControllerReport=args.request.payload;
      return result;
    }};
    const {startApplication}=await import('/src/main.ts');const {requestCore}=await import('/src/bridge.ts');startApplication(requestCore);
  });
  await page.evaluate(await readFile('src-tauri/src/native_editor_probe.js','utf8'));
  await page.evaluate(await readFile('src-tauri/src/canvas_helper_probe.js','utf8'));
  await page.waitForFunction(()=>window.__canvasControllerReport,{},{timeout:60000});
  const report=await page.evaluate(()=>window.__canvasControllerReport);
  await writeFile(join(output,'result.json'),JSON.stringify({controllerTestOnly:true,nativeWebView:false,initialBusy,acceptedBusy,acceptedWrites,scriptReport:report},null,2));
  assert.equal(report.passed,true,JSON.stringify({...report,frames:undefined}));
  assert.equal(initialBusy,true);assert.equal(acceptedBusy,true);
  assert.equal(acceptedWrites,1,'Busy read recovery must not replay accepted source writes');
  console.log('PASS exact canvas controller recovers two pre-dispatch busy reads with one accepted size edit.');
} catch(error) {
  if(page){await writeFile(join(output,'failure.txt'),String(error.stack));await page.screenshot({path:join(output,'failure.png'),fullPage:true});}
  throw error;
} finally {await browser?.close();await server.close();await child.stop();}
