// Probe controller rehearsal only. Real authoring core, fake runtime, no SDK/native claim.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {driverProcess} from './phase2-driver-process.mjs';
const output=resolve(process.env.HELP_PROBE_CONTROLLER_OUTPUT??'../.toolchains/help-screen/probe-controller-local10');await mkdir(output,{recursive:true});
const child=driverProcess(resolve(`target/debug/examples/help-controller-driver${process.platform==='win32'?'.exe':''}`),[join(tmpdir(),`loomlight-help-controller-${randomUUID()}`)]);
const server=await createServer({root:resolve('.'),logLevel:'error',server:{host:'127.0.0.1',port:0}});
let browser,kind,operation,stopped=false,stale=false,trusted=false;
const targetOs=process.env.HELP_PROBE_TARGET_OS??(process.platform==='win32'?'windows':'macos');
const stopExit=process.env.HELP_PROBE_STOP_EXIT===undefined?(targetOs==='windows'?0:null):Number(process.env.HELP_PROBE_STOP_EXIT);
const expectedPass=process.env.HELP_PROBE_EXPECT_PASS!=='false';
const state=()=>({operationId:operation,phase:kind==='validate'?'exited':stopped?'cancelled':'running',exitCode:kind==='validate'?0:stopped?stopExit:null,cleanupComplete:kind==='validate'||stopped,outputTruncated:false,output:kind==='run'?'HELP_SCRATCH_GEOMETRY {"size":[760,360],"aspect":[1280,720],"menu":false}\n':'',earlierRevision:stale,launchRevision:'fixture-launch',revisionStale:false,nextSequence:0});
try{
 assert.equal((await child.next()).ready,true);await server.listen();browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1100,height:720}});
 await page.exposeBinding('helpRpc',async(_,request)=>{
  const {operation:op,payload}=request;let value;
  if(op==='sdk.discover')value=[{id:'fixture-sdk',version:'8.5.3',compatible:true,displayName:'Test double; no SDK'}];
  else if(op==='runtime.prepare'){kind=payload.kind;value={preparationId:'prep',savedRevision:'fixture-launch',trustId:trusted?'trust':null,draftCount:0,trustNotice:'Test double only',inputs:[]};}
  else if(op==='runtime.grantTrust'){trusted=true;value={trustId:'trust'};}
  else if(op==='runtime.start'){operation=randomUUID();stopped=false;stale=false;value=state();}
  else if(op==='runtime.stop'){stopped=true;value=state();}
  else if(op==='runtime.status')value=state();
  else if(op==='runtime.diagnostics')value={diagnostics:[]};
  else if(op==='probe.runtimeUiReport')value={recorded:true};
  else{const response=await child.request(request);if(op==='screens.setLayout'&&kind==='run'&&response.ok)stale=true;return response;}
  return {ok:true,protocolVersion:1,requestId:request.requestId,value};
 });
 await page.route('**/help-probe-rehearsal',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><link rel="stylesheet" href="/src/screen-ui.css"><div id="app"></div>'}));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/help-probe-rehearsal`);
 await page.evaluate(async()=>{
  window.__TAURI_INTERNALS__={invoke:async(command,args)=>{const result=await window.helpRpc(args.request);if(args.request.operation==='probe.runtimeUiReport')window.__probeReport=args.request.payload;return result;}};
  Object.defineProperty(window.__TAURI_INTERNALS__,'invoke',{writable:false,configurable:false});
  const {startApplication}=await import('/src/main.ts');const {requestCore}=await import('/src/bridge.ts');startApplication(requestCore);
 });
 await page.evaluate(targetOs=>window.__loomlightHelpTargetOs=targetOs,targetOs);
 await page.evaluate(await readFile('src-tauri/src/native_editor_probe.js','utf8'));
 await page.evaluate(await readFile('src-tauri/src/help_screen_probe.js','utf8'));
 await page.waitForFunction(()=>window.__probeReport,{},{timeout:60000});const report=await page.evaluate(()=>window.__probeReport);
 await writeFile(join(output,'result.json'),JSON.stringify({controllerTestOnly:true,sdkExecuted:false,nativeWebView:false,scriptReport:report},null,2));
 assert.equal(report.passed,expectedPass,JSON.stringify(report));
 if(expectedPass)assert.equal(report.terminals.at(-1).status.exitCode,stopExit,'raw platform exit is preserved');
 else assert.match(report.error,/Unexpected run result/);
 console.log(`PASS packaged Help controller rehearsal (${targetOs}, Stop exit ${stopExit}, expected ${expectedPass}); runtime test double; no SDK/native proof.`);
}finally{await browser?.close();await server.close();await child.stop();}
