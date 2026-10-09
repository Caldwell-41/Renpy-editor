// Actual browser disabled-control focus semantics; supports but does not replace native proof.
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const js=await readFile(new URL('../dist-tests/src/prompt-ui.js',import.meta.url),'utf8');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/prompt-ui.js'?'text/javascript':'text/html');res.end(req.url==='/prompt-ui.js'?js:'<main></main>');});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}`);
 const result=await page.evaluate(async()=>{
  const {mountPromptPreparation}=await import('/prompt-ui.js');
  const prompt={revision:'p',effectiveText:'Saved',baselineText:'Baseline',baselineVersion:'1',baselineDigest:'b',savedBaselineVersion:'1',savedBaselineDigest:'b',customized:true,styleNotes:'',canUndo:true,canRedo:true};
  let fail=false;const c=mountPromptPreparation(document.querySelector('main'),{current:()=>true,load:async()=>({prompt,targets:[],references:[],structureRevision:'s'}),apply:async command=>{if(fail)throw Object.assign(Error('Stale saved prompt'),{code:'STALE_CONTEXT'});return {...prompt,effectiveText:command.text??'Baseline'};},preview:async()=>{throw Error('Unused');}});
  const settled=async()=>{while(document.querySelector('.prompt-preparation').dataset.busy!=='false')await new Promise(r=>setTimeout(r,10));};
  const button=label=>[...document.querySelectorAll('button')].find(b=>b.textContent===label);
  await settled();const editor=document.querySelector('[name="systemPrompt"]');
  const edit=()=>{editor.focus();editor.value='Draft';editor.dispatchEvent(new Event('input'));};
  edit();button('Save prompt').focus();button('Save prompt').click();await settled();const savedFocus=document.activeElement===editor;
  fail=true;editor.value='Refused draft';editor.dispatchEvent(new Event('input'));button('Save prompt').focus();button('Save prompt').click();await settled();const refusedFocus=document.activeElement===editor;const retained=editor.value;
  c.dispose();let loads=0;
  const retryController=mountPromptPreparation(document.querySelector('main'),{current:()=>true,load:async()=>{if(++loads===1)throw Error('Busy load');return {prompt,targets:[],references:[],structureRevision:'s'};},apply:async()=>{throw Error('Unexpected write');},preview:async()=>{throw Error('Unused');}});
  await settled();const retry=button('Reload project prompts');let reloadFocus=false;
  if(retry){retry.focus();retry.click();await settled();reloadFocus=document.activeElement===document.querySelector('[name="systemPrompt"]');}
  retryController.dispose();return {savedFocus,refusedFocus,retained,reloadFocus};
 });
 console.log(JSON.stringify(result));assert.equal(result.retained,'Refused draft');
 if(process.argv.includes('--expect-failure')){assert.equal(result.savedFocus,false);assert.equal(result.refusedFocus,false);console.log('PASS: failing-first browser confirms disabled Save focus and unfocused retained refusal');}
 else{assert.equal(result.savedFocus,true);assert.equal(result.refusedFocus,true);assert.equal(result.reloadFocus,true);console.log('PASS: Save/refused Save and explicit initial-load recovery restore enabled prompt focus and retain refused draft');}
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
