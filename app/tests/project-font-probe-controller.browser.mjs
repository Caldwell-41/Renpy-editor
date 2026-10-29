// Rehearse the exact packaged L05 probe against production UI/core before a package.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {driverProcess} from './phase2-driver-process.mjs';
const output=resolve(process.env.PROJECT_FONT_PROBE_OUTPUT??'../.toolchains/project-font/probe-controller-01');await mkdir(output,{recursive:true});
const child=driverProcess(resolve(process.env.CARGO_TARGET_DIR??'target',`debug/examples/help-controller-driver${process.platform==='win32'?'.exe':''}`),[join(tmpdir(),`loomlight-help-controller-${randomUUID()}`),'project-font-probe'],{startupTimeout:60000});
const server=await createServer({root:resolve('.'),logLevel:'error',server:{host:'127.0.0.1',port:0}});
let browser;let refusedInitialRead=false;
try {
 assert.equal((await child.next()).ready,true);await server.listen();browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1100,height:800}});
 await page.exposeBinding('fontRpc',async(_,request)=>{
  const reply=value=>({ok:true,protocolVersion:1,requestId:request.requestId,value});
  if(request.operation==='project.current'&&request.requestId.startsWith('font-')&&!refusedInitialRead){refusedInitialRead=true;return {ok:false,protocolVersion:1,requestId:request.requestId,error:{code:'RUNTIME_BUSY',message:'Initial observation owns the service.'}};}
  if(request.operation==='probe.runtimeUiReport')return reply({recorded:true});
  if(['screens.canvasRender','screens.canvasStatus'].includes(request.operation))return reply({phase:'unavailable',message:'SDK rendering is qualified separately.'});
  return child.request(request);
 });
 await page.route('**/image-probe',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><link rel="stylesheet" href="/src/screen-ui.css"><div id="app"></div>'}));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/image-probe`);
 await page.evaluate(async()=>{
  window.__TAURI_INTERNALS__={invoke:async(command,args)=>{const result=await window.fontRpc(args.request);if(args.request.operation==='probe.runtimeUiReport')window.__probeReport=args.request.payload;return result;}};
  const {startApplication}=await import('/src/main.ts');const {requestCore}=await import('/src/bridge.ts');startApplication(requestCore);
 });
 await page.evaluate(await readFile('src-tauri/src/native_editor_probe.js','utf8'));
 await page.evaluate(await readFile('src-tauri/src/project_font_probe.js','utf8'));
 const report=await page.evaluate(()=>window.__probeReport);
 await page.screenshot({path:join(output,'terminal.png'),fullPage:true});
 await writeFile(join(output,'result.json'),JSON.stringify({controllerTestOnly:true,nativeWebView:false,sdkExecuted:false,scriptReport:report},null,2));
 assert.equal(report?.passed,true,JSON.stringify(report));
 assert.equal(refusedInitialRead,true,'The native probe encounters an initial busy read.');
 assert.deepEqual(report.stages.map(s=>s.stage),['font-picker-passed','font-draft-passed','font-history-passed','font-source-passed','font-reopen-passed','complete']);
 console.log('PASS exact L05 probe rehearsal with production UI/core; no native or SDK claim.');
} finally {await browser?.close();await server.close();await child.stop();}
