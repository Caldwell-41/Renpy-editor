import assert from 'node:assert/strict';
import test from 'node:test';
import { Window } from 'happy-dom';
import { catalogue } from '../src/catalog-ui.js';
import { assetImport } from '../src/asset-import-ui.js';
import { technicalNameInput, namingHelp } from '../src/authoring-input.js';
const tick=async()=>{await new Promise(r=>setTimeout(r,0));};
test('library selection, empty categories and cancelling a staged modal preserve project data',async()=>{
 const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement,HTMLInputElement:browser.HTMLInputElement,MutationObserver:browser.MutationObserver});
 document.body.innerHTML='<div id="app"><div class="app-shell"><section class="supporting-workspace"></section></div></div>';
 const host=document.querySelector<HTMLElement>('section')!;const list=document.createElement('section');const create=document.createElement('section');host.append(list,create);
 const row=document.createElement('div');row.className='entity-row';const name=document.createElement('strong');name.textContent='University';const path=document.createElement('code');path.textContent='game/images/uni.png';row.append(name,path);list.append(row);
 let writes=0;let reads=0;const errors:string[]=[];
 const importer=assetImport(create,[],{preview:async()=>{throw Error('Preview fixture unavailable');},choose:async()=>({choices:[{authorityId:'opaque',displayName:'New.PNG',byteCount:1,extension:'png'}]}),import:async()=>{writes++;},complete:()=>{},status:message=>errors.push(message)});
 const dispose=catalogue(host,list,create,'Assets',[{id:'asset',label:'University',kind:'Background',assetId:'asset'}],async()=>{reads++;return {assetId:'asset',dataBase64:'YQ==',mimeType:'image/png',cacheKey:'asset',sha256:'a'.repeat(64),byteCount:1,width:1,height:1,purpose:'thumbnail'};});
 await tick();assert.equal(reads,1,'card and inspector share successful presentation');
 importer.stage({choices:[],errors:['unsupported.txt could not be selected.']});await tick();
 assert.deepEqual(errors,['unsupported.txt could not be selected.']);assert.equal(create.hidden,true,'unsupported-only drop must not expose the empty form outside its dialog');assert.equal(document.querySelector('[aria-modal="true"]'),null);assert.equal(create.querySelectorAll('.import-entry').length,0);assert.equal(writes,0);
 const filters=host.querySelector<HTMLSelectElement>('select')!;assert.deepEqual([...filters.options].map(o=>o.textContent),['All','Backgrounds','Character images','Music','Sound effects']);filters.value='Music';filters.dispatchEvent(new window.Event('change'));assert.equal(row.hidden,true);assert.equal(host.querySelector('.catalog-empty')?.hasAttribute('hidden'),false);filters.value='All';filters.dispatchEvent(new window.Event('change'));
 const close=[...host.querySelectorAll('button')].find(b=>b.ariaLabel==='Close details')!;close.click();assert.equal(host.querySelector<HTMLElement>('.catalog-inspector')!.hidden,true);path.dispatchEvent(new window.MouseEvent('click',{bubbles:true}));assert.equal(host.querySelector<HTMLElement>('.catalog-inspector')!.hidden,false);
 const add=[...host.querySelectorAll('button')].find(b=>b.textContent==='Import assets')!;add.click();const modal=document.querySelector<HTMLElement>('[aria-modal="true"]')!;assert.ok(modal);assert.equal(create.closest('[aria-modal="true"]'),modal);
 [...create.querySelectorAll('button')].find(b=>b.textContent==='Choose files…')!.click();await tick();assert.equal(create.querySelectorAll('.import-entry').length,1);[...modal.querySelectorAll('button')].find(b=>b.textContent==='Cancel')!.click();assert.ok(modal.querySelector('.discard-question'));[...modal.querySelectorAll('button')].find(b=>b.textContent==='Discard changes')!.click();assert.equal(document.querySelector('[aria-modal="true"]'),null);assert.equal(create.querySelectorAll('.import-entry').length,0);assert.equal(writes,0);
 const label=document.createElement('label');const caption=document.createElement('span');caption.textContent='Technical name';const input=document.createElement('input');technicalNameInput(input);label.append(caption,input);namingHelp(label,input);document.body.append(label);input.value=' Bec ';input.dispatchEvent(new window.Event('compositionstart'));input.dispatchEvent(new window.Event('blur'));assert.equal(input.value,' Bec ');input.dispatchEvent(new window.Event('compositionend'));input.dispatchEvent(new window.Event('blur'));assert.equal(input.value,'bec');assert.equal(input.autocapitalize,'none');
 dispose();importer.dispose();await browser.happyDOM.close();
});

test('preview loading, bounded failure and retry preserve stale/session guards',async()=>{
 const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement,HTMLInputElement:browser.HTMLInputElement,MutationObserver:browser.MutationObserver});
 document.body.innerHTML='<section id="host"><section id="list"><div class="entity-row"><strong>University</strong></div></section></section>';
 const host=document.querySelector<HTMLElement>('#host')!;let resolve!:()=>void;const pending=new Promise<void>(accept=>resolve=accept);let available=false,reads=0;
 const dispose=catalogue(host,document.querySelector('#list')!,undefined,'Assets',[{id:'asset',label:'University',kind:'Background',assetId:'asset'}],async()=>{reads++;await pending;if(!available)throw Error('Image was changed outside Loomlight');return {assetId:'asset',dataBase64:'YQ==',mimeType:'image/png',cacheKey:'asset',sha256:'a'.repeat(64),byteCount:1,purpose:'thumbnail'};});
 assert.equal(host.querySelector('img')!.alt,'Loading preview…');assert.equal(host.querySelector('img')!.getAttribute('aria-busy'),'true');resolve();await tick();
 assert.match(host.textContent!,/Image was changed outside Loomlight/);assert.equal(host.querySelector('img')!.alt,'Preview unavailable');
 available=true;[...host.querySelectorAll<HTMLButtonElement>('.media-retry')].forEach(b=>b.click());await tick();assert.equal(reads,3,'one successful read is shared by both retrying previews');assert.equal(host.querySelector('.media-retry'),null);assert.equal(host.querySelector('img')!.alt,'University');assert.equal(host.querySelector('img')!.hasAttribute('aria-busy'),false);assert.ok(host.querySelector('img')!.getAttribute('src'));
 dispose();await browser.happyDOM.close();
});
