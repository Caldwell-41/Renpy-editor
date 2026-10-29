import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import check from './check.mjs';
const origin='http://127.0.0.1:5177';
const output=new URL('../../../../.toolchains/design-lab/l05/',import.meta.url);
await mkdir(output,{recursive:true});
const report={cases:[],errors:[],interactions:false};
let browser,failure;
try {
 browser=await chromium.launch({channel:'chrome',headless:true}); report.browserVersion=browser.version();
 const page=await browser.newPage(); page.setDefaultTimeout(10000); await page.routeWebSocket('**',()=>{});
 page.on('pageerror',e=>report.errors.push(e.message)); page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()}: ${new URL(r.url()).pathname}`)});
 async function open({variant='inspector',state='text',theme='dark',viewport='wide'}={}) {
  await page.goto(`${origin}/preview.html?${new URLSearchParams({screen:'project-font',variant,state,theme,viewport})}`,{timeout:45000});
  await page.locator('#preview[data-ready="true"],#preview[data-error="true"]').waitFor(); assert.equal(await page.locator('#preview').getAttribute('data-error'),null,await page.locator('#preview').innerText()); return page;
 }
 if(!process.argv.includes('--interactions-only')) for(const variant of ['inspector','library','strip']) for(const state of ['text','missing','invalid','expression','conflict','long']) for(const theme of ['dark','light']) for(const viewport of ['wide','compact']) {
  await page.setViewportSize(viewport==='wide'?{width:1100,height:720}:{width:560,height:640}); await open({variant,state,theme,viewport});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${variant}/${state}/${theme}/${viewport}: overflow`);
  assert.deepEqual(await page.evaluate(async()=> (await import('/native.ts')).blockedOperations()),[]);
  if(state==='text'||theme==='dark'&&viewport==='wide') await page.screenshot({path:fileURLToPath(new URL(`${variant}-${state}-${theme}-${viewport}.png`,output))});
  report.cases.push({variant,state,theme,viewport});
 }
 await page.setViewportSize({width:1100,height:720}); await check({page,open,origin}); report.interactions=true;
 assert.deepEqual(report.errors,[]);
} catch(e){failure=e;report.errors.push(String(e));}
finally {await browser?.close(); await writeFile(new URL(process.argv.includes('--interactions-only')?'interactions.json':'report.json',output),JSON.stringify(report,null,2)+'\n');}
if(failure)throw failure;
console.log(`Project font: ${report.cases.length} rendered cases and interactions passed.`);
