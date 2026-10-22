// Rehearse the exact packaged controller against real core services; no native claim.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {driverProcess} from './phase2-driver-process.mjs';
const output=resolve(process.env.OWNED_PROBE_OUTPUT??'../.toolchains/owned-screen/probe-controller-01');await mkdir(output,{recursive:true});
const child=driverProcess(resolve(`target/debug/examples/help-controller-driver${process.platform==='win32'?'.exe':''}`),[join(tmpdir(),`loomlight-help-controller-${randomUUID()}`)]);
const server=await createServer({root:resolve('.'),logLevel:'error',server:{host:'127.0.0.1',port:0}});
let browser, catalogBusyRefused = false;
try {
  assert.equal((await child.next()).ready,true);await server.listen();browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1100,height:720}});
  await page.exposeBinding('ownedRpc',async(_,request)=>{
    if(request.operation==='probe.runtimeUiReport')return {ok:true,protocolVersion:1,requestId:request.requestId,value:{recorded:true}};
    if(request.operation==='screens.list' && !catalogBusyRefused){
      catalogBusyRefused=true;
      return {ok:false,protocolVersion:1,requestId:request.requestId,error:{code:'RUNTIME_BUSY',message:'Another request is in progress.'}};
    }
    return child.request(request);
  });
  await page.route('**/owned-probe',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><link rel="stylesheet" href="/src/screen-ui.css"><div id="app"></div>'}));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/owned-probe`);
  await page.evaluate(async()=>{
    window.__TAURI_INTERNALS__={invoke:async(command,args)=>{const result=await window.ownedRpc(args.request);if(args.request.operation==='probe.runtimeUiReport')window.__ownedReport=args.request.payload;return result;}};
    Object.defineProperty(window.__TAURI_INTERNALS__,'invoke',{writable:false,configurable:false});
    const {enableRichSourceEditor}=await import('/src/source-editor.ts');enableRichSourceEditor();
    const {startApplication}=await import('/src/main.ts');const {requestCore}=await import('/src/bridge.ts');startApplication(requestCore);
  });
  await page.evaluate(await readFile('src-tauri/src/native_editor_probe.js','utf8'));
  await page.evaluate(await readFile('src-tauri/src/owned_screen_probe.js','utf8'));
  await page.waitForFunction(()=>window.__ownedReport,{},{timeout:60000});const report=await page.evaluate(()=>window.__ownedReport);
  await writeFile(join(output,'result.json'),JSON.stringify({controllerTestOnly:true,nativeWebView:false,scriptReport:report},null,2));
  assert.equal(report.passed,true,JSON.stringify(report));assert.equal(report.sdkExecuted,false);
  assert.equal(catalogBusyRefused,true,'the renderer must recover from a refused catalog read');
  console.log('PASS exact packaged owned-screen controller against real core services; browser rehearsal only.');
} finally {await browser?.close();await server.close();await child.stop();}
