import assert from 'node:assert/strict';
import test from 'node:test';
import { Window } from 'happy-dom';
import { assetImport } from '../src/asset-import-ui.js';
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
test('asset import canonicalizes filename suggestions and edited names before IPC',async()=>{
 const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement});
 const host=document.createElement('section');document.body.append(host);
 const calls:Record<string,unknown>[]=[];const errors:string[]=[];
 const ui=assetImport(host,[{id:'character',displayName:'Bec'}],{preview:async()=>{throw Error('Preview fixture unavailable');},choose:async()=>({choices:[]}),import:async p=>{calls.push(p);},complete:()=>{},status:m=>errors.push(m)});
 ui.stage({choices:[{authorityId:'background',displayName:'Uni_Night.PNG',extension:'png',byteCount:1},{authorityId:'appearance',displayName:'Bec.PNG',extension:'png',byteCount:1}]});
 const rows=[...host.querySelectorAll('.import-entry')];
 const field=(row:Element,label:string)=>[...row.querySelectorAll('label')].find(l=>l.firstElementChild?.textContent===label)!.querySelector<HTMLInputElement|HTMLSelectElement>('input,select')!;
 assert.equal(field(rows[0]!,'Ren’Py name').value,'uni_night','generated technical name must be accepted by the lowercase-only core');
 field(rows[0]!,'Ren’Py name').value=' Uni_Night ';
 field(rows[1]!,'Use as').value='characterAppearance';
 field(rows[1]!,'Character').value='character';field(rows[1]!,'Expression').value=' Happy ';
 [...host.querySelectorAll('button')].find(b=>b.textContent==='Import selected files')!.click();await tick();
 assert.deepEqual(calls,[{authorityId:'background',kind:'background',technicalName:'uni_night',displayName:'Uni_Night',characterId:null,expression:null},{authorityId:'appearance',kind:'characterAppearance',technicalName:'bec',displayName:'Bec',characterId:'character',expression:'happy'}]);
 assert.deepEqual(errors,[]);ui.dispose();await browser.happyDOM.close();
});
test('staged import cancellation retains choices; partial failure never retries a successful file',async()=>{
 const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement});
 const host=document.createElement('section');document.body.append(host);
 let attempt=0;const calls:string[]=[];let complete=0;
 const ui=assetImport(host,[],{preview:async()=>{throw Error('Preview fixture unavailable');},choose:async()=>({choices:[],cancelled:true}),import:async p=>{calls.push(String(p.authorityId));if(p.authorityId==='two'&&attempt++===0)throw Error('File no longer available');},complete:()=>{complete++;},status:()=>{}});
 ui.stage({choices:[{authorityId:'one',displayName:'one.png',extension:'png',byteCount:1},{authorityId:'two',displayName:'two.ogg',extension:'ogg',byteCount:1}]});
 const click=(text:string)=>[...host.querySelectorAll('button')].find(b=>b.textContent===text)!.click();
 click('Add files…');await tick();assert.equal(host.querySelectorAll('.import-entry').length,2);
 click('Import selected files');await tick();assert.deepEqual(calls,['one','two']);assert.equal(complete,0);assert.match(host.textContent!,/File no longer available/);
 click('Import selected files');await tick();assert.deepEqual(calls,['one','two','two']);assert.equal(complete,1);
 ui.dispose();await browser.happyDOM.close();
});

test('native request channel keeps progress truthful and ignores events after completion',async()=>{
 const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement});
 const {requestCore}=await import('../src/bridge.js');
 const {operationProgress}=await import('../src/operation-progress.js');
 let complete!:(response:unknown)=>void;
 let channel:{onmessage:(value:unknown)=>void};
 let requestId='';
 Object.assign(browser,{__TAURI_INTERNALS__:{transformCallback:()=>1,invoke:async(_command:string,args:{request:{requestId:string};onProgress:typeof channel})=>{channel=args.onProgress;requestId=args.request.requestId;return new Promise(resolve=>complete=resolve);}}});
 const host=document.createElement('section');document.body.append(host);
 const ui=operationProgress(host,'sdk.install');const pending=requestCore('sdk.install');
 const bar=host.querySelector('progress')!;
 channel!.onmessage({sequence:1,stage:'download',bytes:100,total:400});
 assert.equal(bar.value,100);assert.equal(bar.max,400);assert.match(host.textContent!,/25%/);
 channel!.onmessage({sequence:1,stage:'download',bytes:0,total:400});assert.equal(bar.value,100,'duplicate sequence cannot regress progress');
 channel!.onmessage({sequence:2,stage:'download',bytes:200,total:null});assert.equal(bar.hasAttribute('value'),false,'unknown total stays indeterminate');
 channel!.onmessage({sequence:3,stage:'verify',bytes:null,total:null});assert.match(host.textContent!,/Verify download/);
 complete({protocolVersion:1,requestId,ok:false,error:{code:'DOWNLOAD_FAILED',message:'Download failed'}});await pending;
 ui.fail('Download failed');channel!.onmessage({sequence:4,stage:'install'});
 assert.equal(host.querySelector('[role="alert"]')?.textContent,'Download failed');
 assert.equal(host.querySelector('.operation-panel')?.getAttribute('data-failed'),'true');
 ui.dispose();await browser.happyDOM.close();
});

test('selected image replaces chooser and releases previews on removal and discard',async()=>{
 const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement});
 const host=document.createElement('section');document.body.append(host);
 const created:string[]=[],revoked:string[]=[];const createURL=URL.createObjectURL,revokeURL=URL.revokeObjectURL;
 URL.createObjectURL=()=>{const url=`blob:preview-${created.length}`;created.push(url);return url;};URL.revokeObjectURL=url=>revoked.push(url);
 let writes=0;
 const ui=assetImport(host,[],{choose:async()=>({choices:[]}),preview:async authorityId=>({assetId:authorityId,dataBase64:'YQ==',mimeType:'image/png',sha256:'a',byteCount:1,width:2,height:1,cacheKey:'a',purpose:'imagePreview'}),import:async()=>{writes++;},complete:()=>{},status:()=>{}});
 try{
  const stage=()=>ui.stage({choices:[{authorityId:'opaque',displayName:'room.png',extension:'png',byteCount:1}]});
  stage();await tick();const img=host.querySelector<HTMLImageElement>('.import-preview')!;img.dispatchEvent(new window.Event('load'));
  assert.equal(host.querySelector<HTMLButtonElement>('button')!.hidden,true);assert.equal(host.querySelector<HTMLElement>('.import-empty-description')!.hidden,true);
  assert.equal(img.getAttribute('src'),created[0]);assert.equal(writes,0);assert.match(host.textContent!,/2 × 1/);
  [...host.querySelectorAll('button')].find(b=>b.textContent==='Remove from import')!.click();assert.deepEqual(revoked,created);
  assert.equal(host.querySelector<HTMLButtonElement>('button')!.hidden,false);assert.equal(host.querySelector<HTMLElement>('.import-staged-toolbar')!.hidden,true);
  stage();await tick();host.dispatchEvent(new window.Event('catalog-discard'));assert.deepEqual(revoked,created);assert.equal(host.querySelectorAll('.import-entry').length,0);
 }finally{ui.dispose();URL.createObjectURL=createURL;URL.revokeObjectURL=revokeURL;await browser.happyDOM.close();}
});

test('removed and disposed staging ignores late previews; errors offer retry without importing',async()=>{
 const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement});
 const host=document.createElement('section');document.body.append(host);let receipt!:(value:any)=>void;let reads=0,writes=0;
 const media={assetId:'opaque',dataBase64:'YQ==',mimeType:'image/png',sha256:'a',byteCount:1,width:1,height:1,cacheKey:'a',purpose:'imagePreview' as const};
 const ui=assetImport(host,[],{choose:async()=>({choices:[]}),preview:async()=>{reads++;if(reads===2)throw Error('Selection changed');return new Promise(resolve=>receipt=resolve);},import:async()=>{writes++;},complete:()=>{},status:()=>{}});
 const stage=()=>ui.stage({choices:[{authorityId:'opaque',displayName:'room.png',extension:'png',byteCount:1}]});
 stage();const oldImage=host.querySelector('img')!;[...host.querySelectorAll('button')].find(b=>b.textContent==='Remove from import')!.click();receipt(media);await tick();assert.equal(oldImage.hasAttribute('src'),false);
 stage();await tick();assert.match(host.textContent!,/Selection changed/);const retry=host.querySelector<HTMLButtonElement>('.media-retry')!;assert.equal(retry.hidden,false);retry.click();await tick();ui.dispose();receipt(media);await tick();assert.equal(host.querySelector('img')!.hasAttribute('src'),false);assert.equal(writes,0);
 await browser.happyDOM.close();
});
