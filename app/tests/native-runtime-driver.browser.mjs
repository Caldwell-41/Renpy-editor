import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';

const server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:0}});
let browser;
try {
  await server.listen();
  browser=await chromium.launch({channel:'chrome',headless:true});
  for(const mode of process.argv.slice(2).length?process.argv.slice(2):['compile','lint','route-a','route-b','runtime-error']) {
    const page=await browser.newPage({viewport:{width:1100,height:720}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/driver',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><div id="app"></div>'}));
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/driver`);
    await page.evaluate(async mode=>{
      const {runtimeProbeFixture}=await import('/tests/runtime-probe-fixture.mjs');
      const fixture=runtimeProbeFixture(mode);window.__driverCalls=fixture.calls;
      let preferences={schemaVersion:1,theme:'system',density:'default',sourceFontSize:14,rememberLayout:true,layouts:{}};
      // Only direct probe observations contend. User mutations are never retried.
      const busy=new Set(['project.current','source.open','flow.list']);
      window.__TAURI_INTERNALS__={invoke:async(command,{request}={})=>{
        if(command==='complete_application_close')throw Error('Close the project through its runtime and draft flow first.');
        if(command!=='core_request')throw Error(`Unexpected command: ${command}`);
        const ok=value=>({protocolVersion:1,requestId:request.requestId,ok:true,value});
        if(request.operation==='probe.runtimeUiReport'){window.__driverReport=request.payload;return ok(null);}
        if(request.operation==='preferences.write'){preferences=request.payload;return ok(preferences);}
        if(request.operation==='preferences.read')return ok(preferences);
        if(busy.delete(request.operation))return {ok:false,error:{code:'RUNTIME_BUSY'}};
        return fixture.request(request.operation,request.payload);
      }};
      window.__loomlightRuntimeProbeCase=mode;
      const {enableRichSourceEditor}=await import('/src/source-editor.ts');enableRichSourceEditor();
      const {startApplication}=await import('/src/main.ts');startApplication(fixture.request);
    },mode);
    await page.addScriptTag({content:await readFile(new URL('../src-tauri/src/native_editor_probe.js',import.meta.url),'utf8')});
    // Reject hidden/disabled synthetic clicks. Native probes must follow the UI.
    await page.evaluate(()=>{
      const original=HTMLButtonElement.prototype.click;
      HTMLButtonElement.prototype.click=function(){
        if(this.disabled||!this.checkVisibility({visibilityProperty:true}))throw Error(`Driver clicked unavailable control: ${this.textContent}`);
        return original.call(this);
      };
    });
    await page.addScriptTag({content:await readFile(new URL('../src-tauri/src/runtime_ui_probe.js',import.meta.url),'utf8')});
    try { await page.waitForFunction(()=>window.__driverReport,{},{timeout:45000}); } catch(error) { console.log(await page.evaluate(()=>({body:document.body.innerText,calls:window.__driverCalls}))); throw error; }
    const report=await page.evaluate(()=>window.__driverReport);
    if(!report.passed) console.log(await page.evaluate(()=>({active:document.activeElement?.outerHTML.slice(0,300),selection:getSelection()?.toString(),start:window.__loomlightProbeEditor(document.querySelector('.source-editor'))?.selectionStart,text:window.__loomlightProbeEditor(document.querySelector('.source-editor'))?.value,calls:window.__driverCalls})));
    assert.equal(report.passed,true,`${mode}: ${JSON.stringify(report)}`);
    assert.deepEqual(errors,[],mode);
    console.log(`PASS shipped ${mode} driver: ${report.stages.map(s=>s.stage).join(', ')}`);
    await page.close();
  }
  console.log('Driver compatibility only: real rendered UI and shipped scripts, fixture service/SDK/close results. Native qualification remains required.');
} finally {await browser?.close();await server.close();}
