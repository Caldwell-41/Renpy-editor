// Production component controls through real core, Source, history and reopen. No SDK/helper.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {createHash,randomUUID} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {driverProcess} from './phase2-driver-process.mjs';
import {execFileSync} from 'node:child_process';

const output=resolve(process.env.COMPONENT_UI_OUTPUT??'../.toolchains/component-ui/browser-01');
await mkdir(output,{recursive:false});
const fixtureRoot=join(tmpdir(),`loomlight-help-controller-${randomUUID()}`);
const child=driverProcess(resolve(process.env.CARGO_TARGET_DIR??'../.toolchains/target','debug/examples/help-controller-driver'+(process.platform==='win32'?'.exe':'')),[fixtureRoot],{startupTimeout:60000});
const game=join(fixtureRoot,'synthetic-project'),receipts=[],errors=[],checks=[];
let sessionId,browser,page,server,failCopyInspect=false;
const listeners=new Set();
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const candidate=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const harness=await readFile(new URL(import.meta.url)),harnessSHA256=digest(harness);
await writeFile(join(output,'harness.mjs'),harness);
const rpc=async request=>{
  if(['screens.canvasRender','screens.canvasStatus'].includes(request.operation))return {ok:true,value:{phase:'unavailable',message:'Component canvas/helper qualification is separate.'}};
  if(failCopyInspect && request.operation==='screens.inspect' && request.payload.path==='game/ui/component_about_copy.rpy') {
    const result={ok:false,error:{code:'SOURCE_CONFLICT',message:'Deliberate post-copy inspection refusal'}};
    receipts.push({request,result,injectedReadFailure:true});return result;
  }
  const result=await child.request(request);receipts.push({request,result});for(const observe of listeners)observe({request,result});if(result.value?.sessionId)sessionId=result.value.sessionId;return result;
};
const request=async(operation,payload={})=>{
  const result=await rpc({protocolVersion:1,requestId:randomUUID(),operation,payload:{sessionId,...payload}});
  assert.equal(result.ok,true,JSON.stringify(result));return result.value;
};
const read=async path=>(await request('source.open',{path})).text;
const save=async(path,text)=>{
  const base=await request('source.open',{path});
  const draft=await request('source.updateDraft',{path,expectedBaseRevision:base.baseRevision,text,selectionStart:0,selectionEnd:0});
  return request('source.save',{path,expectedBaseRevision:draft.baseRevision,expectedDraftVersion:draft.draftVersion});
};
const mapBytes=()=>readFile(join(game,'.renpy-editor/source-map.json'));
const create=async name=>{
  const catalog=await request('screens.list');
  const created=await request('screens.create',{name,expectedProjectRevision:catalog.projectRevision,expectedSourceMapRevision:catalog.sourceMapRevision,expectedInventoryRevision:catalog.inventoryRevision});
  return created.owned.find(owner=>owner.name===name);
};
const compose=async(owner,command)=>request('screens.compose',{screenId:owner.id,expectedRevision:(await request('screens.inspect',{path:owner.path})).revision,command});
let passed=false,cleanupComplete=false;
try {
  assert.equal((await child.next()).ready,true);
  const recent=(await request('project.listRecent'))[0];assert.ok(recent);await request('project.openRecent',{recentId:recent.id});
  const help=await create('component_help'),about=await create('component_about');
  const group=(await compose(help,{type:'add',parentId:help.rootId,kind:'vbox',text:''})).selectedId;
  const title=(await compose(help,{type:'add',parentId:group,kind:'text',text:'Find your way'})).selectedId;
  await compose(help,{type:'add',parentId:group,kind:'text',text:'Choose a route. The last tram leaves at midnight.'});
  const doc=await request('screens.inspect',{path:help.path});
  await request('screens.setLayout',{path:help.path,screenName:help.name,expectedRevision:doc.revision,nodeStart:doc.screens[0].nodes.find(node=>node.id===group).span.start,values:{xsize:{unit:'pixels',value:500}}});
  await save(help.path,(await read(help.path))+'# Owned opaque comment neighbor stays exactly here.\n');
  const legacyOriginal=await read('game/ui/help.rpy');
  await save('game/ui/help.rpy',legacyOriginal+'\n    use flow_help\n');
  const before=await read(help.path),beforeMap=await mapBytes(),binding={screenId:help.id,sourceName:help.name};
  await writeFile(join(output,'preflight-before.rpy'),before);await writeFile(join(output,'preflight-source-map.json'),beforeMap);
  const target=await request('screens.resolveTarget',{binding});
  const refusal=await rpc({protocolVersion:1,requestId:randomUUID(),operation:'screens.componentExtract',payload:{sessionId,target:binding,expected:target.revisions,expectedProjectRevision:(await request('screens.list')).projectRevision,nodeId:group,name:'must_refuse_legacy'}});
  assert.equal(refusal.ok,false,'An unmarked legacy inclusion must refuse extraction');
  assert.equal(await read(help.path),before);assert.deepEqual(await mapBytes(),beforeMap);
  checks.push('incomplete legacy inventory refuses with exact source/map unchanged');
  // Explicitly authorized synthetic setup. Keep the existing opaque comment bytes.
  const legacy=await read('game/ui/help.rpy'),comment=legacy.slice(0,legacy.indexOf('\n')+1);
  await save('game/ui/help.rpy',comment+'screen loomlight_help():\n    text "Bounded legacy fixture"\n');
  assert.ok((await read('game/ui/help.rpy')).startsWith(comment));
  checks.push('only synthetic legacy fixture bounded through real Source owner');
  if(process.env.COMPONENT_PREFLIGHT_ONLY==='1') {
    await writeFile(join(output,'preflight.json'),JSON.stringify({passed:true,checks,help,about,group,title,refusal,sourceSHA256:digest(before),sourceMapSHA256:digest(beforeMap)},null,2));
    passed=true;
  } else {
    await request('project.close');sessionId=undefined;
    server=await createServer({root:resolve('.'),cacheDir:join(output,'vite-cache'),logLevel:'error',server:{host:'127.0.0.1',port:0}});
    await server.listen();browser=await chromium.launch({channel:'chrome',headless:true});
    page=await browser.newPage({viewport:{width:1100,height:800},colorScheme:'dark'});page.setDefaultTimeout(10000);
    page.on('pageerror',error=>errors.push(error.message));await page.exposeBinding('componentRpc',(_,message)=>rpc(message));
    await page.route('**/component-controller',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><link rel="stylesheet" href="/src/screen-ui.css"><div id="app"></div>'}));
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/component-controller`,{waitUntil:'domcontentloaded'});
    await page.evaluate(async()=>{const {startApplication}=await import('/src/main.ts');startApplication((operation,payload)=>window.componentRpc({protocolVersion:1,requestId:crypto.randomUUID(),operation,payload}));});
    await page.locator('.recent-open').click();await page.getByRole('button',{name:'Screens',exact:true}).click();
    const ui=page.locator('.screens-editor'),select=owner=>ui.getByLabel('Screen',{exact:true}).selectOption(JSON.stringify(['owned',owner.id]));
    const history=async direction=>{
      let timer,observe;
      const accepted=new Promise((resolve,reject)=>{
        observe=({request,result})=>{if(request.operation==='scene.apply' && request.payload.command?.type===direction){clearTimeout(timer);listeners.delete(observe);result.ok?resolve(result):reject(Error(JSON.stringify(result)));}};
        listeners.add(observe);timer=setTimeout(()=>{listeners.delete(observe);reject(Error('History acknowledgement missing'));},10000);
      });
      try {await ui.getByRole('button',{name:direction==='undo'?'Undo':'Redo',exact:true}).click();await accepted;}
      finally {clearTimeout(timer);listeners.delete(observe);}
    };
    const choose=()=>ui.getByRole('button',{name:/^1\s+Choose$/}).click();
    const field=()=>ui.getByRole('textbox',{name:'Text',exact:true});
    await select(help);await choose();await ui.locator(`[data-node-id="${group}"]`).press('Enter');
    const extractLaunch=await ui.getByRole('button',{name:'Make component…',exact:true}).elementHandle();
    await ui.getByRole('button',{name:'Make component…',exact:true}).click();
    let dialog=page.getByRole('dialog',{name:'Make component',exact:true});
    await dialog.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await extractLaunch.evaluate(element=>element.isConnected && document.activeElement===element),true);
    await ui.getByRole('button',{name:'Make component…',exact:true}).click();
    await dialog.getByLabel('Component name',{exact:true}).fill('component_route_guide');await dialog.getByRole('button',{name:'Make component',exact:true}).click();await dialog.waitFor({state:'detached'});
    const component=(await request('screens.list')).owned.find(owner=>owner.name==='component_route_guide');assert.ok(component);
    const firstUse=(await request('screens.inspect',{path:help.path})).screens[0].nodes.find(node=>node.kind==='use');assert.equal(firstUse.component.componentId,component.id);
    assert.ok((await read(help.path)).endsWith('# Owned opaque comment neighbor stays exactly here.\n'));
    assert.equal((await request('screens.inspect',{path:component.path})).screens[0].nodes.some(node=>node.id===title),true);
    checks.push('UI extraction preserves moved IDs and exact opaque neighbor');
    await select(about);await choose();await ui.locator(`[data-node-id="${about.rootId}"]`).press('Enter');
    const insertLaunch=await ui.getByRole('button',{name:'Add component…',exact:true}).elementHandle();
    await ui.getByRole('button',{name:'Add component…',exact:true}).click();dialog=page.getByRole('dialog',{name:'Add component',exact:true});
    await dialog.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await insertLaunch.evaluate(element=>element.isConnected && document.activeElement===element),true);
    await ui.getByRole('button',{name:'Add component…',exact:true}).click();
    await dialog.getByLabel('Component',{exact:true}).selectOption(component.id);await dialog.getByLabel('Parent group',{exact:true}).selectOption(about.rootId);
    await dialog.getByRole('button',{name:'Insert component',exact:true}).click();await dialog.waitFor({state:'detached'});
    const secondUse=(await request('screens.inspect',{path:about.path})).screens[0].nodes.find(node=>node.kind==='use');assert.notEqual(firstUse.id,secondUse.id);assert.equal(secondUse.component.componentId,component.id);
    await ui.getByRole('button',{name:'Edit component',exact:true}).click();
    await page.waitForFunction(id=>document.querySelector('.screens-editor select[aria-label="Screen"]')?.value===JSON.stringify(['owned',id]),component.id);
    await choose();await ui.locator(`[data-node-id="${title}"]`).press('Enter');
    await ui.getByText('Shared by Component about and Component help',{exact:true}).waitFor();
    const accepted=await read(component.path);await field().fill('Shared through UI');
    await ui.locator('.screen-text-layout').evaluate(details=>{details.open=true;});await ui.getByLabel('Width',{exact:true}).fill('420');
    await ui.locator('[data-text-apply]').click();
    dialog=page.getByRole('dialog',{name:'Review component changes',exact:true});await dialog.waitFor();
    assert.match(await dialog.innerText(),/Component about/);assert.match(await dialog.innerText(),/Component help/);assert.equal(await dialog.locator('.screen-component-changes tbody tr').count(),2);
    assert.match(await dialog.innerText(),/420/);assert.equal((await dialog.innerText()).includes('Color'),false,'Untouched fields stay out of shared review');
    await dialog.getByRole('button',{name:'Keep editing',exact:true}).click();assert.equal(await field().inputValue(),'Shared through UI');assert.equal(await read(component.path),accepted);
    await ui.locator('[data-text-apply]').click();dialog=page.getByRole('dialog',{name:'Review component changes',exact:true});await dialog.getByRole('button',{name:'Apply to 2 screens',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('[data-text-apply]')?.disabled===true && !document.querySelector('.screen-text-state')?.textContent.includes('Applying'));
    const shared=await read(component.path);assert.ok(shared.includes('Shared through UI'));
    for(const owner of [help,about])assert.equal((await request('screens.inspect',{path:owner.path})).screens[0].nodes.find(node=>node.kind==='use').component.sourceRevision,digest(shared));
    await field().fill('Cancelled');await ui.locator('[data-text-cancel]').click();assert.equal(await read(component.path),shared);
    checks.push('shared changed-only review, Cancel and Apply reach actual core and both uses');
    const copyMap=await mapBytes();await field().fill('About only pending');await ui.getByLabel('Width',{exact:true}).fill('480');await ui.getByRole('button',{name:'Make a copy for Component about',exact:true}).click();
    dialog=page.getByRole('dialog',{name:'Make a copy for Component about',exact:true});await dialog.getByLabel('Component name',{exact:true}).fill('component_about_copy');failCopyInspect=true;
    await dialog.getByRole('button',{name:'Create copy',exact:true}).click();await dialog.waitFor({state:'detached'});
    await ui.getByText('Copy created. Your edits are still unsaved.',{exact:true}).waitFor();
    assert.equal(await field().inputValue(),'About only pending');assert.equal(await ui.locator('[data-text-apply]').isDisabled(),true);
    await field().fill('About only latest pending');await ui.locator('.screen-text-layout').evaluate(details=>{details.open=true;});await ui.getByLabel('Width',{exact:true}).fill('490');failCopyInspect=false;await ui.getByRole('button',{name:'Reload copy',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('[data-text-apply]')?.disabled===false);
    assert.equal(await field().inputValue(),'About only latest pending');
    await ui.locator('.screen-text-layout').evaluate(details=>{details.open=true;});assert.equal(await ui.getByLabel('Width',{exact:true}).inputValue(),'490');
    const independent=(await request('screens.list')).owned.find(owner=>owner.name==='component_about_copy');assert.ok(independent);
    const acceptedCopy=await read(independent.path);assert.ok(acceptedCopy.includes('Shared through UI'));assert.equal(acceptedCopy.includes('About only latest pending'),false,'Reload never applies retained fields');
    await ui.locator('[data-text-cancel]').click();assert.equal((await read(independent.path)).includes('About only latest pending'),false);
    assert.equal((await request('screens.inspect',{path:about.path})).screens[0].nodes.find(node=>node.id===secondUse.id).component.componentId,independent.id);
    await field().fill('Independent through UI');await ui.locator('.screen-text-layout').evaluate(details=>{details.open=true;});await ui.getByLabel('Width',{exact:true}).fill('460');await ui.locator('[data-text-apply]').click();
    await page.waitForFunction(()=>document.querySelector('[data-text-apply]')?.disabled===true && !document.querySelector('.screen-text-state')?.textContent.includes('Applying'));
    assert.equal(await page.getByRole('dialog').count(),0,'A single-use independent edit applies directly');
    const copied=await read(independent.path);assert.ok(copied.includes('Independent through UI'));assert.equal(await read(component.path),shared);
    assert.equal((await request('screens.inspect',{path:help.path})).screens[0].nodes.find(node=>node.id===firstUse.id).component.componentId,component.id);
    checks.push('accepted Copy, failed refresh, latest draft Reload, Cancel keeping copy and separate local Apply');
    await history('undo');await page.waitForFunction(()=>document.querySelector('.screen-card textarea')?.value==='Shared through UI');
    assert.equal(await read(independent.path),acceptedCopy,'One Undo restores both ordinary text and layout fields');
    await history('undo');await page.waitForFunction(id=>document.querySelector('.screens-editor select[aria-label="Screen"]')?.value!==JSON.stringify(['owned',id]),independent.id);
    await assert.rejects(readFile(join(game,independent.path)),error=>error.code==='ENOENT');assert.deepEqual(await mapBytes(),copyMap);
    await history('redo');await page.waitForFunction(([id,revision])=>document.querySelector(`.screen-component-scope[data-component-id="${id}"]`)?.dataset.componentRevision===revision,[independent.id,digest(acceptedCopy)]);
    await history('redo');await page.waitForFunction(([id,revision])=>document.querySelector(`.screen-component-scope[data-component-id="${id}"]`)?.dataset.componentRevision===revision,[independent.id,digest(copied)]);
    assert.equal(await read(independent.path),copied);assert.equal(await read(component.path),shared);
    checks.push('Undo Apply then Copy; Redo restores exact copied source/map intent');
    await page.getByRole('button',{name:'Close Project',exact:true}).click();await page.locator('.recent-open').click();await page.getByRole('button',{name:'Screens',exact:true}).click();
    assert.equal(await read(independent.path),copied);assert.equal(await read(component.path),shared);
    await select(help);await choose();await ui.locator(`[data-node-id="${firstUse.id}"]`).press('Enter');
    const source=await read(help.path),use=(await request('screens.inspect',{path:help.path})).screens[0].nodes.find(node=>node.id===firstUse.id);
    await ui.getByRole('button',{name:'Use Source',exact:true}).click();const editor=page.locator('textarea.source-editor');await editor.waitFor();
    const location=await editor.evaluate(element=>({text:element.value,start:element.selectionStart,end:element.selectionEnd}));
    assert.equal(location.text,source);assert.equal(location.start,Buffer.from(source).subarray(0,use.span.start).toString('utf8').length);assert.equal(location.end,Buffer.from(source).subarray(0,use.span.end).toString('utf8').length);
    checks.push('actual Source navigation selects the exact accepted UTF-8 use span');
    await page.getByRole('button',{name:'Screens',exact:true}).click();
    const renamed=shared.replace('screen component_route_guide():','screen component_route_guide_renamed():');assert.notEqual(renamed,shared);await save(component.path,renamed);
    await ui.getByRole('button',{name:'Refresh Source',exact:true}).click();await ui.getByText(/Can't find this component/).waitFor();
    assert.equal((await request('screens.inspect',{path:help.path})).screens[0].nodes.find(node=>node.id===firstUse.id).component.componentId,component.id);
    assert.equal(await ui.getByRole('button',{name:'Edit component',exact:true}).count(),0);await save(component.path,shared);
    checks.push('reopen exact source and Source rename preserves stable missing intent without retargeting');
    for(const [width,height] of [[1100,800],[560,720]]){await page.setViewportSize({width,height});await page.screenshot({path:join(output,`production-dark-${width}.png`),fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
    assert.deepEqual(errors,[]);
    await writeFile(join(output,'accepted-component.rpy'),shared);await writeFile(join(output,'accepted-independent.rpy'),copied);
    passed=true;
  }
} catch(error) {
  await writeFile(join(output,'failure.txt'),String(error.stack??error));
  if(page){await writeFile(join(output,'failure-dom.txt'),await page.locator('body').innerText());await page.screenshot({path:join(output,'failure.png'),fullPage:true});}
  throw error;
} finally {
  const cleanupErrors=[];
  for(const close of [()=>browser?.close(),()=>server?.close(),()=>child.stop()])try{await close();}catch(error){cleanupErrors.push(String(error));}
  cleanupComplete=cleanupErrors.length===0;if(!cleanupComplete)passed=false;
  await writeFile(join(output,'receipts.json'),JSON.stringify(receipts,null,2));
  await writeFile(join(output,'result.json'),JSON.stringify({passed,candidate,harnessSHA256,checks,errors,realCore:true,sdk:false,helper:false,nativeEditor:false,cleanupComplete,cleanupErrors},null,2));
}
