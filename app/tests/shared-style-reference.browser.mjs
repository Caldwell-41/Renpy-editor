// Retain fresh A5 reference captures from its pinned source checkout.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {resolve,join} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
const root=resolve(process.env.SHARED_STYLE_REFERENCE??'../.toolchains/l07-shared-look/approved-reference/app');
const output=resolve(process.env.SHARED_STYLE_REFERENCE_OUTPUT??'../.toolchains/l07-shared-look/reference-01');await mkdir(output,{recursive:true});
const server=await createServer({configFile:join(root,'design-lab/vite.config.ts'),logLevel:'error',server:{host:'127.0.0.1',port:0}});let browser;
try {
 await server.listen();browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1080},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/preview.html?screen=shared-look&variant=appearance-scope&state=many&theme=dark&viewport=wide&entry=design`);
 await page.locator('#preview[data-ready=true]').waitFor();const size=page.locator('[data-text-field=size]');await size.fill('32');await page.locator('.screen-text-layout').evaluate(e=>e.open=false);await page.locator('.screen-text-body').evaluate(e=>e.scrollTop=0);await size.focus();await size.evaluate(e=>e.setSelectionRange(2,2));
 await page.locator('.screen-card').screenshot({path:join(output,'approved-pending-shared-inspector.png')});
 await page.locator('[data-edit-scope=local]').click();await size.focus();await size.evaluate(e=>e.setSelectionRange(2,2));await page.locator('.screen-text-body').evaluate(e=>e.scrollTop=0);
 await page.locator('.screen-card').screenshot({path:join(output,'approved-pending-local-inspector.png')});
 assert.deepEqual(errors,[]);await writeFile(join(output,'result.json'),JSON.stringify({passed:true,referenceOnly:true,source:'8218bbfab6b6931b1f8610bf85ac6e64f33d747e',viewport:{width:1440,height:1080},scale:1,theme:'dark',errors},null,2));
 console.log('PASS pinned A5 reference captures at 1440x1080, dark, scale 1, Size 32, Layout closed and body scroll 0.');
}finally{await browser?.close();await server.close();}
