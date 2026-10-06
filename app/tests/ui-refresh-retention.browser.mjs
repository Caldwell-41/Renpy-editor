import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';

// Fixture service only: discriminate probe contention without claiming native evidence.
const server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:0}});
let browser;
const script=await readFile(new URL('../src-tauri/src/ui_refresh_probe.js',import.meta.url),'utf8');
const settled="details.stage='editor-settlement';await wait(()=>document.querySelector('.source-draft-total')?.textContent.startsWith('1 draft'))";
assert.ok(script.includes(`${settled};`),'shipped probe must await acknowledged retention');
const corrected=script;
const original=corrected.replace(`${settled};`, '');
try{
 await server.listen();browser=await chromium.launch({channel:'chrome',headless:true});
 for(const mode of ['original-collision','corrected-collision','corrected-refusal']){
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/retention-probe',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><div id="app"></div>'}));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/retention-probe`);
  await page.evaluate(async mode=>{
   const {visualRequest}=await import('/tests/ui-refresh-fixture.ts');
   let held=false;let preferences={schemaVersion:1,theme:'system',density:'default',sourceFontSize:14,rememberLayout:true,layouts:{}};
   window.__retentionEvidence={directReads:0,refusals:0,retainedTexts:[]};
   window.__TAURI_INTERNALS__={invoke:async(_command,{request})=>{
    const ok=value=>({protocolVersion:1,requestId:request.requestId,ok:true,value});
    if(request.operation==='probe.runtimeUiReport'){window.__retentionReport=request.payload;return ok(null);}
    if(request.operation==='preferences.read')return ok(preferences);
    if(request.operation==='preferences.write'){preferences=request.payload;return ok(preferences);}
    if(request.operation==='source.list'&&document.querySelector('.source-draft-warning')?.hidden===false){
     window.__retentionEvidence.directReads++;held=true;
     try{await new Promise(r=>setTimeout(r,100));return await visualRequest(request.operation,request.payload);}finally{held=false;}
    }
    return visualRequest(request.operation,request.payload);
   }};
   const {enableRichSourceEditor}=await import('/src/source-editor.ts');enableRichSourceEditor();
   const {startApplication}=await import('/src/main.ts');startApplication(async(operation,payload={})=>{
    if(operation==='source.updateDraft'&&String(payload.text).includes('Native editor check')){
     await new Promise(r=>setTimeout(r,70));
     if(held||mode==='corrected-refusal'){
      window.__retentionEvidence.refusals++;
      return {protocolVersion:1,requestId:'fixture',ok:false,error:{code:'RUNTIME_BUSY',message:'Draft write refused before dispatch'}};
     }
     window.__retentionEvidence.retainedTexts.push(payload.text);
    }
    return visualRequest(operation,payload);
   });
  },mode);
  await page.addScriptTag({content:await readFile(new URL('../src-tauri/src/native_editor_probe.js',import.meta.url),'utf8')});
  await page.addScriptTag({content:mode==='original-collision'?original:corrected});
  await page.waitForFunction(()=>window.__retentionReport,{},{timeout:30000});
  const {report,evidence}=await page.evaluate(()=>({report:window.__retentionReport,evidence:window.__retentionEvidence}));
  assert.deepEqual(errors,[]);
  if(mode==='corrected-collision'){
   assert.equal(report.passed,true,JSON.stringify(report));assert.equal(report.checks.length,11);
   assert.equal(evidence.refusals,0);assert.ok(evidence.retainedTexts.some(text=>text.startsWith('# Native editor check\n')));
   assert.ok(evidence.directReads>=1,'backend dirty-count assertion was bypassed');
  }else{
   assert.equal(report.passed,false);assert.equal(report.stage,mode==='original-collision'?'editor-retention':'editor-settlement');
   assert.equal(report.failureState.retentionDirtyCount??0,0);assert.ok(evidence.refusals>=1);
   if(mode==='corrected-refusal')assert.equal(evidence.directReads,0,'probe observed before settlement');
  }
  console.log(JSON.stringify({mode,passed:report.passed,stage:report.stage,checks:report.checks.length,directReads:evidence.directReads,refusals:evidence.refusals}));
  await page.close();
 }
 console.log('PASS: old probe collision reproduced; settled probe retains exact input; refused retention remains a failure. Fixture bridge only.');
}finally{await browser?.close();await server.close();}
