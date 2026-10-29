import assert from 'node:assert/strict';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const output=new URL('../../../../docs/design/design-lab-project-font/captures/inspector-v2/',import.meta.url);
const matrix=new URL('../../../../.toolchains/design-lab/l05-refined/',import.meta.url);
await mkdir(output,{recursive:true});
const captures=[];
for(const state of ['text','missing','invalid','expression','conflict','long'])for(const theme of ['dark','light'])for(const viewport of ['wide','compact']){
 if(state!=='text'&&(theme!=='dark'||viewport!=='wide'))continue;
 const name=`${state}-${theme}-${viewport}.png`;await copyFile(new URL(`refined-${name}`,matrix),new URL(name,output));
 captures.push({name,state,theme,width:viewport==='wide'?1100:560,height:viewport==='wide'?720:640,scale:1});
}
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1100,height:720}});await page.routeWebSocket('**',()=>{});
 async function open(state='text'){
  await page.goto(`http://127.0.0.1:5177/preview.html?screen=project-font&variant=refined&state=${state}&theme=dark&viewport=wide`,{timeout:45000});
  await page.locator('#preview[data-ready],#preview[data-error]').waitFor();assert.equal(await page.locator('#preview').getAttribute('data-error'),null);
 }
 async function capture(state){const name=`${state}-dark-wide.png`;await page.screenshot({path:fileURLToPath(new URL(name,output))});captures.push({name,state,theme:'dark',width:1100,height:720,scale:1});}
 await open();await page.getByRole('button',{name:'Choose project font',exact:true}).click();await capture('picker');
 await page.getByRole('searchbox',{name:'Find project font'}).fill('No matching font');await capture('empty-search');
 await page.getByRole('button',{name:'Import font…',exact:true}).click();await capture('import');
 await page.getByRole('combobox',{name:'Sample file'}).selectOption('invalid');await page.getByRole('button',{name:'Import and use'}).click();await capture('invalid-import');
 await page.getByRole('button',{name:'Cancel import'}).click();await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('textbox',{name:'Size · px'}).fill('999');await page.locator('[data-apply]').click();await capture('invalid-size');
 await page.locator('[data-cancel-draft]').click();await page.getByRole('textbox',{name:'Color',exact:true}).fill('orange');await page.locator('[data-apply]').click();await capture('invalid-color');
 for(const state of ['missing','invalid','conflict']){await open(state);await page.getByRole('textbox',{name:'Text',exact:true}).fill('Keep these text edits while I repair the font.');await page.locator('[data-apply]').click();await capture(`${state}-draft`);}
}finally{await browser.close();}
const manifest=[];
for(const c of captures){const{ name,...conditions}=c;manifest.push({path:`docs/design/design-lab-project-font/captures/inspector-v2/${name}`,sha256:createHash('sha256').update(await readFile(new URL(name,output))).digest('hex'),...conditions});}
await writeFile(new URL('manifest.json',output),JSON.stringify(manifest,null,2)+'\n');
console.log(`Retained ${manifest.length} A2 draft captures. Approval remains open.`);
