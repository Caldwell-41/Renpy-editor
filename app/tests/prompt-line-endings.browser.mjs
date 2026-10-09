import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
let js=await readFile(new URL('../dist-tests/src/prompt-ui.js',import.meta.url),'utf8');
if(process.argv.includes('--expect-failure'))js=js.replace('prompt.value !== savedEditorText','prompt.value !== model.prompt.effectiveText');
const server=http.createServer((req,res)=>{if(req.url==='/prompt-ui.js'){res.setHeader('Content-Type','text/javascript');res.end(js);}else {res.setHeader('Content-Type','text/html');res.end('<main></main>');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}`);
 const result=await page.evaluate(async()=>{const {mountPromptPreparation}=await import('/prompt-ui.js');let saved=0;const raw='Custom café 雪\r\nLiteral {{x}}';const prompt={revision:'p',effectiveText:raw,baselineText:'Baseline\n',baselineVersion:'1',baselineDigest:'b',savedBaselineVersion:'1',savedBaselineDigest:'b',customized:true,styleNotes:'',canUndo:false,canRedo:false};const c=mountPromptPreparation(document.querySelector('main'),{current:()=>true,load:async()=>({prompt,targets:[],references:[],structureRevision:'s'}),apply:async()=>{saved++;return prompt;},preview:async()=>{throw Error('Unused');}});while(document.querySelector('.prompt-preparation').dataset.busy!=='false')await new Promise(r=>setTimeout(r,10));const n=document.querySelector('textarea');const leave=c.canLeave();return {raw,displayed:n.value,leave,saved,dirty:document.querySelector('[data-unsubmitted]')!==null};});
 assert.equal(result.displayed,result.raw.replace(/\r\n/g,'\n'));
 if(process.argv.includes('--expect-failure')){assert.equal(result.leave,false);assert.equal(result.dirty,true);console.log('PASS: failing-first actual browser reproduces unchanged CRLF prompt falsely dirty');}
 else{assert.equal(result.leave,true);assert.equal(result.dirty,false);assert.equal(result.saved,0);console.log('PASS: unchanged CRLF prompt remains clean and leaves without rewriting stored prose');}
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
