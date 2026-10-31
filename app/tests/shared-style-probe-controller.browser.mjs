// Rehearse the exact packaged L07 probe through production controls and real core.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {driverProcess} from './phase2-driver-process.mjs';
const output=resolve(process.env.SHARED_STYLE_PROBE_OUTPUT??'../.toolchains/l07-shared-look/probe-controller-01');await mkdir(output,{recursive:true});
const child=driverProcess(resolve(process.env.CARGO_TARGET_DIR??'target',`debug/examples/help-controller-driver${process.platform==='win32'?'.exe':''}`),[join(tmpdir(),`loomlight-help-controller-${randomUUID()}`),'project-font'],{startupTimeout:60000});
const server=await createServer({root:resolve('.'),logLevel:'error',server:{host:'127.0.0.1',port:0}});let browser;
try {
 assert.equal((await child.next()).ready,true);await server.listen();browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1080}});
 await page.exposeBinding('styleProbeRpc',async(_,r)=>{
  if(r.operation==='probe.runtimeUiReport'){await writeFile(join(output,'producer-report.json'),JSON.stringify(r.payload,null,2));return {ok:true,value:{recorded:true}};}
  if(['screens.canvasRender','screens.canvasStatus'].includes(r.operation))return {ok:true,value:{phase:'unavailable',message:'SDK qualification is separate.'}};
  return child.request(r);
 });
 await page.route('**/style-probe',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><link rel="stylesheet" href="/src/screen-ui.css"><div id="app"></div>'}));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/style-probe`);
 await page.evaluate(async()=>{window.__TAURI_INTERNALS__={invoke:async(_command,args)=>{const result=await window.styleProbeRpc(args.request);if(args.request.operation==='probe.runtimeUiReport')window.__styleProbeReport=args.request.payload;return result;}};const {startApplication}=await import('/src/main.ts');const {requestCore}=await import('/src/bridge.ts');startApplication(requestCore);});
 await page.evaluate(await readFile('src-tauri/src/native_editor_probe.js','utf8'));await page.evaluate(await readFile('src-tauri/src/shared_style_probe.js','utf8'));
 const report=await page.evaluate(()=>window.__styleProbeReport);await page.screenshot({path:join(output,'terminal.png'),fullPage:true});
 assert.equal(report?.passed,true,JSON.stringify(report));
 // The producer's native flag belongs to its intended packaged host. This wrapper
 // explicitly records that this rehearsal runs in Chrome rather than a WebView.
 const checked=spawnSync(process.env.HARNESS_PYTHON??'python3',['-c',`import sys,json,copy\nsys.path.insert(0,'scripts')\nfrom runtime_probe_cases import runtime_report_ok\nd=json.load(sys.stdin)\nr=dict(evidence='runtime-ui-packaged',case='shared-style',passed=True,cleanupComplete=True,details=d)\nassert runtime_report_ok('shared-style',r)\nfor field,value in [('stages',[]),('nativeWebView',False),('sdkExecuted',True),('acceptedSource',''),('flags',{}),('copyStyleName','wrong')]:\n b=copy.deepcopy(r);b['details'][field]=value;assert not runtime_report_ok('shared-style',b),field\nprint('PASS exact producer and native gate rejection cases.')`],{input:JSON.stringify(report),encoding:'utf8'});
 assert.equal(checked.status,0,checked.stdout+checked.stderr);
 await writeFile(join(output,'result.json'),JSON.stringify({passed:true,controllerTestOnly:true,nativeWebView:false,sdkExecuted:false,producerReport:report,gate:checked.stdout},null,2));console.log('PASS exact L07 packaged-probe rehearsal and native evidence gate.');
} finally {await browser?.close();await server.close();await child.stop();}
