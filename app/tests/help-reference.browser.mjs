// Render the pinned approved reference. Production source is never substituted here.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const pinned=resolve('../.toolchains/help-flow-reference');
const output=resolve('../.toolchains/help-screen/reference-local5');await mkdir(output,{recursive:true});
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
 await writeFile(join(output,'result.json'),JSON.stringify({source:revision.approval.source,verifiedPinnedCaptures:13,results},null,2));console.log(JSON.stringify({verifiedPinnedCaptures:13,results}));
}finally{await browser?.close();await server.close();}
