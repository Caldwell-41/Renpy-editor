// Render the pinned approved reference. Production source is never substituted here.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const pinned=resolve('../.toolchains/help-flow-reference');
const output=resolve(process.env.HELP_REFERENCE_OUTPUT??'../.toolchains/help-screen/reference-local10');await mkdir(output,{recursive:true});
const approval=JSON.parse(await readFile(resolve('../docs/design/design-lab-screens/approval.json'),'utf8'));
const revision=approval.revisions.find(r=>r.id==='flow-v1');
assert.equal(revision.approval.source.commit,'3c7ea31d8210538cc987a2d2f4ceb8b7aa8f5437');
const captures=revision.approval.captures??revision.approval.screenshots;
assert.equal(captures.length,13);
for(const capture of captures){const bytes=await readFile(resolve('..',capture.path));assert.equal(createHash('sha256').update(bytes).digest('hex'),capture.sha256);}
const server=await createServer({configFile:join(pinned,'app/design-lab/vite.config.ts'),logLevel:'error',server:{host:'127.0.0.1',port:0}});
let browser;const results=[];
try{
 await server.listen();browser=await chromium.launch({channel:'chrome',headless:true});
 for(const theme of ['light','dark'])for(const [viewport,width,height] of [['wide',1100,720],['compact',560,640]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/preview.html?screen=screens&variant=flow&state=populated&theme=${theme}&viewport=${viewport}`);
  await page.locator('#preview[data-ready="true"]').waitFor();await page.evaluate(()=>document.fonts.ready);
  const baseline=await page.screenshot({path:join(output,`reference-choose-${theme}-${width}.png`)});
  const capture=captures.find(c=>c.state==='populated'&&c.theme===theme&&c.width===width);
  const hash=createHash('sha256').update(baseline).digest('hex');
  await page.locator('[role=treeitem][data-node-id=frame]').dblclick();
  await page.screenshot({path:join(output,`reference-frame-design-${theme}-${width}.png`)});
  assert.deepEqual(errors,[]);results.push({theme,width,height,retainedBaselineByteMatch:hash===capture.sha256,renderedSHA256:hash,expectedSHA256:capture.sha256});
  await page.close();
 }
 const fixtureInput = `export function fixture(_state) {
   const root=node("root","fixed","Screen root",0,0,1280,720);root.parent="";
   const frame=node("frame","frame","Help frame",280,180,720,360);frame.parent="root";
   const title=node("title","text","Your next stop",304,204,672,40);title.parent="frame";title.text="Your next stop";title.size="22";
   return [{id:"help-panel",name:"flow_help",mode:"panel",template:false,nodes:[root,frame,title],revision:1}];
 }`;
 const inputs=[];
 for(const theme of ['light','dark'])for(const [viewport,width,height] of [['wide',1100,720],['compact',560,640]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  await page.route('**/screens/screens/fixture.ts*',async route=>{
   const response=await route.fetch();const original=await response.text();
   assert.ok(original.includes('export function fixture(state)'));
   const body=original.replace('export function fixture(state)','function approvedFixture(state)')+'\n'+fixtureInput;
   inputs.push({theme,width,originalModuleSHA256:createHash('sha256').update(original).digest('hex'),fixtureInputSHA256:createHash('sha256').update(fixtureInput).digest('hex')});
   await route.fulfill({response,body});
  });
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/preview.html?screen=screens&variant=flow&state=populated&theme=${theme}&viewport=${viewport}`);
  await page.locator('#preview[data-ready="true"]').waitFor();await page.evaluate(()=>document.fonts.ready);
  await page.locator('[role=treeitem][data-node-id=frame]').dblclick();
  await page.locator('details[data-group="Position & size"]').evaluate(d=>d.open=true);
  await page.evaluate(()=>{document.querySelectorAll('*').forEach(e=>{e.scrollTop=0;e.scrollLeft=0;});});
  await page.screenshot({path:join(output,`reference-comparison-design-${theme}-${width}.png`)});
  if(width===560){await page.locator('details[data-group="Position & size"]').scrollIntoViewIfNeeded();await page.screenshot({path:join(output,`reference-comparison-inspector-${theme}-${width}.png`)});}
  await page.getByRole('button',{name:'1 Choose',exact:true}).click();
  await page.evaluate(()=>{document.querySelectorAll('*').forEach(e=>{e.scrollTop=0;e.scrollLeft=0;});});
  await page.screenshot({path:join(output,`reference-comparison-choose-${theme}-${width}.png`)});
  await page.close();
 }
 await writeFile(join(output,'comparison-input.json'),JSON.stringify({fixtureInput,inputs,note:'Only disposable fixture input changes in the browser. Pinned presentation source and retained approval captures stay unchanged. Same source-supported frame and literal text as game/ui/z_compare.rpy; scenery and unavailable operations remain visible differences.'},null,2));
 await writeFile(join(output,'result.json'),JSON.stringify({source:revision.approval.source,verifiedPinnedCaptures:13,results},null,2));console.log(JSON.stringify({verifiedPinnedCaptures:13,results}));
}finally{await browser?.close();await server.close();}
