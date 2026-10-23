// Real Screens UI, dispatch, canvas-plan validation and source transactions.
// A fixed test image supplies pointer targets. This does not run or qualify the helper.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {randomUUID,createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {driverProcess} from './phase2-driver-process.mjs';

const output=resolve(process.env.LOOMLIGHT_CANVAS_EVIDENCE ?? '../.toolchains/canvas-proof/continuation-55-60/position-controller');
await mkdir(output,{recursive:true});
const child=driverProcess(resolve(`target/debug/examples/help-controller-driver${process.platform==='win32'?'.exe':''}`),[join(tmpdir(),`loomlight-help-controller-${randomUUID()}`),'canvas-position']);
const server=await createServer({root:resolve('.'),logLevel:'error',server:{host:'127.0.0.1',port:0}});
const receipts=[],errors=[];
let browser,page,sessionId,passed=false, imageGate, releaseImages;
const rpc=async request=>{
  if(request.operation==='screens.canvasStatus')return {ok:true,value:{phase:'ready'}};
  if(request.operation==='screens.canvasRender') {
    const plan=await child.request({...request,operation:'screens.canvasPlan'});
    assert.equal(plan.ok,true,JSON.stringify(plan));
    const nodes=plan.value.nodes,frame=nodes.find(n=>n.kind==='frame');
    if(imageGate) await imageGate;
    const x=(1280-640)*frame.properties.xalign,y=(720-360)*frame.properties.yalign;
    // Geometry here is a fixture for source/controller tests, never rendering evidence.
    return {ok:true,value:{phase:'ready',frameId:'controller-fixture',revision:plan.value.revision,width:1280,height:720,
      image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=',
      geometry:[{start:frame.parent,x:0,y:0,width:1280,height:720},{start:frame.start,x,y,width:640,height:360},...nodes.filter(n=>n.kind==="text").map(n=>({start:n.start,x:x+40,y:y+60,width:200,height:30}))]}};
  }
  const response=await child.request(request);receipts.push({request,response});
  if(response.value?.sessionId)sessionId=response.value.sessionId;
  return response;
};
try {
  assert.equal((await child.next()).ready,true);await server.listen();
  browser=await chromium.launch({channel:'chrome',headless:true});page=await browser.newPage({viewport:{width:1100,height:760}});await page.routeWebSocket('**',()=>{});
  page.on('pageerror',error=>errors.push(error.message));await page.exposeBinding('positionRpc',(_,request)=>rpc(request));
  await page.route('**/position-controller',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><link rel="stylesheet" href="/src/screen-ui.css"><div id="app"></div>'}));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/position-controller`);
  await page.evaluate(async()=>{const {startApplication}=await import('/src/main.ts');startApplication(async(operation,payload)=>{
    const result=await window.positionRpc({protocolVersion:1,requestId:crypto.randomUUID(),operation,payload});
    if(operation==='screens.canvasRender')window.__positionRevision=result.value.revision;
    return result;
  });});
  await page.locator('.recent-open').click();await page.getByRole('button',{name:'Screens',exact:true}).click();
  const fresh=source=>page.waitForFunction(revision=>document.querySelector('.screen-game')?.dataset.stale==='false' && (!revision || window.__positionRevision===revision),source && createHash('sha256').update(source).digest('hex'));
  const snapshot=async()=>Buffer.from((await child.request({driver:'snapshot'})).source).toString();
  await fresh();const before=await snapshot();
  await page.getByLabel('Canvas zoom',{exact:true}).selectOption('100');await fresh();
  const frameTarget=page.locator('.screen-node-frame');
  await frameTarget.click({position:{x:10,y:10}});await fresh();
  const target=page.getByRole('button',{name:'Move frame',exact:true});
  assert.equal((await target.boundingBox()).height,30);
  await page.getByLabel('Canvas zoom',{exact:true}).selectOption('fit');await fresh();
  assert.equal((await target.boundingBox()).height,30,'Handle size is independent of canvas zoom');
  await page.getByLabel('Canvas zoom',{exact:true}).selectOption('100');await fresh();
  await target.scrollIntoViewIfNeeded();const box=await target.boundingBox();
  await page.evaluate(()=>document.addEventListener('pointerdown',event=>{window.__dragPointer=event.pointerId;},true));
  imageGate=new Promise(resolve=>{releaseImages=resolve;});
  const origin=await frameTarget.boundingBox(), childOrigin=await page.locator('.screen-node-text').first().boundingBox();
  await page.mouse.move(box.x+10,box.y+10);await page.mouse.down();await page.mouse.move(box.x+74,box.y+42);
  const moved=await frameTarget.boundingBox(),childMoved=await page.locator('.screen-node-text').first().boundingBox();
  assert.equal(moved.x-origin.x,64);assert.equal(moved.y-origin.y,32);
  assert.equal(childMoved.x-childOrigin.x,64);assert.equal(childMoved.y-childOrigin.y,32);
  assert.equal(await page.locator('.screen-game').getAttribute('data-provisional'),'panel');
  assert.equal(await snapshot(),before,'Delayed helper feedback cannot write source');
  releaseImages();imageGate=undefined;await fresh();
  // Image delivery must not cancel a held gesture. The next input flushes the
  // browser's pending lostpointercapture event before we inspect capture.
  await page.mouse.move(box.x+82,box.y+50);await fresh();
  assert.equal(await target.evaluate(element=>element.hasPointerCapture(window.__dragPointer)),true,'Image updates must preserve a held frame drag');
  assert.equal(await snapshot(),before,'Held movement cannot write source');
  await page.keyboard.press('Escape');await page.mouse.up();await fresh();
  assert.equal(await snapshot(),before);assert.equal(receipts.filter(r=>r.request.operation==='screens.setPosition').length,0);
  const next=await target.boundingBox();
  await page.mouse.move(next.x+10,next.y+10);await page.mouse.down();await page.mouse.move(next.x+42,next.y+26);await fresh();
  await page.mouse.move(next.x+74,next.y+42);await fresh();imageGate=new Promise(resolve=>{releaseImages=resolve;});await page.mouse.up();
  assert.equal(await target.evaluate(e=>e===document.activeElement),true,'Release preserves handle focus');
  releaseImages();imageGate=undefined;
  await page.getByText('Position saved. Undo reverses the move.',{exact:true}).waitFor();await fresh();
  const accepted=before.replace('xalign 0.5','xalign 0.6').replace('yalign 0.5','yalign 0.5888888888888889');
  assert.equal(await snapshot(),accepted);
  assert.equal(receipts.filter(r=>r.request.operation==='screens.setPosition').length,1);
  const ui=page.locator('.screens-editor');
  await ui.getByRole('button',{name:'Undo',exact:true}).click();await fresh(before);assert.equal(await snapshot(),before);
  await ui.getByRole('button',{name:'Redo',exact:true}).click();await fresh(accepted);assert.equal(await snapshot(),accepted);
  const source=await rpc({protocolVersion:1,requestId:randomUUID(),operation:'source.open',payload:{sessionId,path:'game/ui/help.rpy'}});
  assert.equal(source.value.text,accepted);
  await ui.getByRole('button',{name:'Undo',exact:true}).click();await fresh(before);
  await target.focus();await target.press('Shift+ArrowRight');await page.getByText('Position saved. Undo reverses the move.',{exact:true}).waitFor();await fresh();
  assert.equal(await snapshot(),before.replace('xalign 0.5','xalign 0.5125'));
  assert.deepEqual(errors,[]);passed=true;
} finally {
  releaseImages?.();await browser?.close();await server.close();await child.stop();
  await writeFile(join(output,'result.json'),JSON.stringify({passed,rendererToCore:true,fixtureImage:true,sdkExecuted:false,nativeWebView:false,errors,driver:child.exitStatus(),receipts},null,2));
}
