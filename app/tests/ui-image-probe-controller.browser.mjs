// Rehearse the exact packaged L06 probe against production UI/core before a package.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {driverProcess} from './phase2-driver-process.mjs';
const controls=process.argv.includes('--screen-controls');
const output=resolve(process.env.UI_IMAGE_PROBE_OUTPUT??`../.toolchains/${controls?'screen-controls':'ui-image'}/probe-controller-01`);await mkdir(dirname(output),{recursive:true});await mkdir(output,{recursive:!controls});
const child=driverProcess(resolve(process.env.CARGO_TARGET_DIR??'target',`debug/examples/help-controller-driver${process.platform==='win32'?'.exe':''}`),[join(tmpdir(),`loomlight-help-controller-${randomUUID()}`),'ui-image-probe']);
const server=await createServer({root:resolve('.'),logLevel:'error',server:{host:'127.0.0.1',port:0}});
let browser,report;let refusedInitialRead=false;const pageErrors=[],operations=[];
try {
 assert.equal((await child.next()).ready,true);
 if(controls){
  let sequence=0;const setup=async(operation,payload={})=>{const response=await child.request({protocolVersion:1,requestId:`controls-setup-${++sequence}`,operation,payload});assert.equal(response.ok,true,JSON.stringify(response));return response.value;};
  const recent=await setup('project.listRecent');const opened=await setup('project.openRecent',{recentId:recent[0].id});
  await setup('variable.create',{sessionId:opened.sessionId,technicalName:'coins',variableType:'int',defaultValue:'12'});await setup('project.close',{sessionId:opened.sessionId});
 }
 await server.listen();browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:controls?1280:1100,height:800},colorScheme:'dark'});page.on('pageerror',error=>pageErrors.push(error.message));
 await page.exposeBinding('imageRpc',async(_,request)=>{
  const reply=value=>({ok:true,protocolVersion:1,requestId:request.requestId,value});
  if(request.operation==='project.current'&&request.requestId.startsWith(controls?'controls-':'image-')&&!refusedInitialRead){refusedInitialRead=true;return {ok:false,protocolVersion:1,requestId:request.requestId,error:{code:'RUNTIME_BUSY',message:'Initial observation owns the service.'}};}
  if(request.operation==='probe.runtimeUiReport')return reply({recorded:true});
  if(['screens.canvasRender','screens.canvasStatus'].includes(request.operation))return reply({phase:'unavailable',message:'SDK rendering is qualified separately.'});
  const response=await child.request(request);operations.push({operation:request.operation,path:request.payload?.path,command:request.payload?.command?.type,ok:response.ok,error:response.error});return response;
 });
 await page.route('**/image-probe',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><link rel="stylesheet" href="/src/screen-ui.css"><div id="app"></div>'}));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/image-probe`);
 await page.evaluate(async()=>{
  window.__TAURI_INTERNALS__={invoke:async(command,args)=>{const result=await window.imageRpc(args.request);if(args.request.operation==='probe.runtimeUiReport')window.__probeReport=args.request.payload;return result;}};
  const {startApplication}=await import('/src/main.ts');const {requestCore}=await import('/src/bridge.ts');startApplication(requestCore);
 });
 await page.evaluate(await readFile('src-tauri/src/native_editor_probe.js','utf8'));
 await page.evaluate(await readFile(`src-tauri/src/${controls?'screen_controls_probe':'ui_image_probe'}.js`,'utf8'));
 report=await page.evaluate(()=>window.__probeReport);
 await page.screenshot({path:join(output,'terminal.png'),fullPage:true});
 await writeFile(join(output,'result.json'),JSON.stringify({controllerTestOnly:true,nativeWebView:false,sdkExecuted:false,scriptReport:report},null,2));
 assert.equal(report?.passed,true,JSON.stringify(report));
 assert.deepEqual(pageErrors,[],'Uncaught browser errors');
 if(controls){const checked=spawnSync(process.env.HARNESS_PYTHON??(process.platform==='win32'?'python':'python3'),['-c',"import sys,json;sys.path.insert(0,'scripts');from runtime_probe_cases import runtime_report_ok;assert runtime_report_ok('screen-controls',dict(evidence='runtime-ui-packaged',case='screen-controls',passed=True,cleanupComplete=True,details=json.load(sys.stdin)))"],{input:JSON.stringify(report),encoding:'utf8'});assert.equal(checked.status,0,checked.stderr);}
 assert.equal(refusedInitialRead,true,'The native probe encounters an initial busy read.');
 assert.deepEqual(report.stages.map(s=>s.stage),controls?['controls-bar-passed','controls-picker-passed','controls-validation-passed','controls-history-passed','controls-source-passed','controls-reopen-passed','complete']:['image-picker-passed','image-draft-passed','image-history-passed','image-source-passed','image-reopen-passed','complete']);
 console.log(`PASS exact ${controls?'screen-controls':'L06'} probe rehearsal with production UI/core; no native or SDK claim.`);
} finally {await browser?.close();await server.close();await child.stop();await writeFile(join(output,'result.json'),JSON.stringify({controllerTestOnly:true,nativeWebView:false,sdkExecuted:false,scriptReport:report,pageErrors,operations,driver:child.exitStatus(),cleanupComplete:true},null,2));}
