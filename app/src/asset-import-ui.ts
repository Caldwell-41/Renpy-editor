import { technicalName, technicalNameInput, technicalNameHelp, namingHelp } from './authoring-input.ts';
import type { MediaPresentation } from './scene-ui.ts';
export interface SelectedAsset { authorityId:string;displayName:string;byteCount:number;extension:string }
interface Character { id:string;displayName:string }
export interface ImportBatch { choices:SelectedAsset[]; errors?:string[]; cancelled?:boolean }
export function assetImport(host:HTMLElement, characters:Character[], actions:{choose:()=>Promise<ImportBatch>;preview:(authorityId:string)=>Promise<MediaPresentation>;import:(payload:Record<string,unknown>)=>Promise<void>;complete:()=>void;status:(message:string)=>void}):{stage:(batch:ImportBatch)=>void;dispose:()=>void} {
  let disposed=false,busy=false,previewing=false;
  const entries:HTMLElement[]=[];
  const choose=document.createElement('button');choose.className='button primary';choose.textContent='Choose files…';
  const description=document.createElement('p');description.className='muted import-empty-description';description.textContent='Choose files or drop them into Assets, then select how each will be used. Original files stay unchanged.';
  const stagedToolbar=document.createElement('div');stagedToolbar.className='import-staged-toolbar';stagedToolbar.hidden=true;
  const stagedLabel=document.createElement('span');stagedLabel.textContent='Review selected files';
  const add=document.createElement('button');add.className='button';add.textContent='Add files…';stagedToolbar.append(stagedLabel,add);
  const list=document.createElement('div');list.className='import-staging';const submit=document.createElement('button');submit.className='button primary catalog-submit';submit.textContent='Import selected files';submit.hidden=true;
  const jobs=new Map<HTMLElement,()=>Record<string,unknown>>();
  const urls=new Map<HTMLElement,{url:string;bytes:number;release:()=>void}>();
  const previews:Array<{row:HTMLElement;load:()=>Promise<void>}>=[];
  const release=(row:HTMLElement):void=>{const cached=urls.get(row);if(cached){URL.revokeObjectURL(cached.url);urls.delete(row);cached.release();}};
  const syncEmpty=():void=>{const empty=entries.length===0;description.hidden=choose.hidden=!empty;stagedToolbar.hidden=empty;submit.hidden=empty;};
  const pump=async():Promise<void>=>{if(previewing||disposed)return;previewing=true;try{while(previews.length&&!disposed){const preview=previews.shift()!;if(jobs.has(preview.row))await preview.load();}}finally{previewing=false;}};
  function field(row:HTMLElement,title:string,input:HTMLInputElement|HTMLSelectElement):void{const label=document.createElement('label');label.className='field';const text=document.createElement('span');text.textContent=title;label.append(text,input);row.append(label);namingHelp(label,input);}
  const stage=(batch:ImportBatch):void=>{
    if(disposed||busy)return;host.hidden=false;
    batch.errors?.forEach(error=>actions.status(error));
    for(const selected of batch.choices){
      if(entries.length>=32){actions.status('Import up to 32 files at a time.');break;}
      const row=document.createElement('section');row.className='import-entry';row.dataset.unsubmitted='true';
      const title=document.createElement('h3');title.textContent=selected.displayName;row.append(title);
      const audio=['ogg','mp3','wav','flac'].includes(selected.extension.toLowerCase());
      const status=document.createElement('p');status.className='import-preview-status';status.role='status';row.append(status);
      const retry=document.createElement('button');retry.className='button media-retry';retry.textContent='Retry preview';retry.hidden=true;status.append(retry);
      if(audio){status.textContent=`Audio file · ${(selected.byteCount/1024).toFixed(1)} KB`;}
      else{
        const image=document.createElement('img');image.className='import-preview';image.alt=`Preview of ${selected.displayName}`;row.insertBefore(image,status);
        const setStatus=(message:string,retryable:boolean):void=>{status.replaceChildren(document.createTextNode(message),retry);retry.hidden=!retryable;};
        const load=async():Promise<void>=>{
          if(disposed||!jobs.has(row))return;setStatus('Loading preview…',false);image.setAttribute('aria-busy','true');
          try{
            const media=await actions.preview(selected.authorityId);
            if(disposed||!jobs.has(row))return;
            const bytes=Uint8Array.from(atob(media.dataBase64),c=>c.charCodeAt(0));
            release(row);
            let total=[...urls.values()].reduce((n,entry)=>n+entry.bytes,0);
            for(const [other,entry] of urls){if(total+bytes.length<=32*1024*1024)break;total-=entry.bytes;release(other);}
            const url=URL.createObjectURL(new Blob([bytes],{type:media.mimeType}));
            urls.set(row,{url,bytes:bytes.length,release:()=>{image.removeAttribute('src');setStatus('Preview released to save memory. ',true);}});
            image.onload=()=>{if(!disposed&&jobs.has(row)){setStatus(`${media.width??''} × ${media.height??''} · ${(selected.byteCount/1024).toFixed(1)} KB`,false);image.removeAttribute('aria-busy');}};
            image.onerror=()=>{if(!disposed&&jobs.has(row)){release(row);setStatus('Preview unavailable: this image could not be decoded. ',true);image.removeAttribute('aria-busy');}};
            image.src=url;
          }catch(error){if(!disposed&&jobs.has(row)){image.removeAttribute('aria-busy');setStatus(`Preview unavailable: ${error instanceof Error?error.message:'Image could not be read.'} `,true);}}
        };
        retry.onclick=()=>{if(!busy){previews.push({row,load});void pump();}};previews.push({row,load});
      }
      const kind=document.createElement('select');for(const [value,label] of audio?[['music','Music'],['sfx','Sound effect']]:[['background','Background'],['characterAppearance','Character image']]){const option=document.createElement('option');option.value=value!;option.textContent=label!;kind.append(option);}field(row,'Use as',kind);
      const name=document.createElement('input');name.value=(selected.displayName.replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_]/g,'_').replace(/^[^a-zA-Z]+/,'').slice(0,64)||'asset').toLowerCase();technicalNameInput(name);field(row,'Ren’Py name',name);
      const help=document.createElement('p');help.className='muted';help.textContent=technicalNameHelp;row.append(help);
      const display=document.createElement('input');display.value=selected.displayName.replace(/\.[^.]+$/,'');field(row,'Display name',display);
      const character=document.createElement('select');const empty=document.createElement('option');empty.value='';empty.textContent='Select a character';character.append(empty);characters.forEach(c=>{const o=document.createElement('option');o.value=c.id;o.textContent=c.displayName;character.append(o);});field(row,'Character',character);
      const expression=document.createElement('input');expression.value='neutral';technicalNameInput(expression);field(row,'Expression',expression);
      const sync=():void=>{character.parentElement!.hidden=expression.parentElement!.hidden=kind.value!=='characterAppearance';};kind.addEventListener('change',sync);sync();
      const remove=document.createElement('button');remove.className='text-button';remove.textContent='Remove from import';remove.addEventListener('click',()=>{if(busy)return;release(row);row.remove();jobs.delete(row);entries.splice(entries.indexOf(row),1);syncEmpty();if(!choose.hidden)choose.focus();});row.append(remove);entries.push(row);list.append(row);
      jobs.set(row,()=>{const canonicalName=technicalName(name.value,'Ren’Py name');if(!display.value.trim())throw new Error('Display name is required.');if(kind.value==='characterAppearance'&&!character.value)throw new Error('Select a character.');const canonicalExpression=kind.value==='characterAppearance'?technicalName(expression.value,'Expression'):null;return {authorityId:selected.authorityId,kind:kind.value,technicalName:canonicalName,displayName:display.value.trim(),characterId:kind.value==='characterAppearance'?character.value:null,expression:canonicalExpression};});
    }syncEmpty();void pump();
    if(choose===document.activeElement&&choose.hidden)entries[0]?.querySelector<HTMLElement>('input,select')?.focus();
  };
  host.addEventListener('catalog-discard',()=>{if(busy)return;entries.splice(0).forEach(e=>{release(e);e.remove();});jobs.clear();previews.length=0;syncEmpty();});
  const chooseFiles=async():Promise<void>=>{if(busy)return;busy=true;choose.disabled=add.disabled=true;try{const batch=await actions.choose();busy=false;if(!disposed)stage(batch);}catch(e){actions.status(e instanceof Error?e.message:'Files could not be selected.');}finally{busy=false;choose.disabled=add.disabled=false;}};
  choose.addEventListener('click',()=>void chooseFiles());add.addEventListener('click',()=>void chooseFiles());
  submit.addEventListener('click',async()=>{if(busy)return;
    const payloads:Array<[HTMLElement,Record<string,unknown>]> = [];
    try{for(const [row,read] of jobs)payloads.push([row,read()]);}catch(e){actions.status((e as Error).message);return;}
    busy=true;submit.disabled=true;host.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLSelectElement>('button,input,select').forEach(c=>c.disabled=true);
    for(const [row,payload] of payloads){if(disposed)break;try{await actions.import(payload);release(row);row.dataset.unsubmitted='false';row.replaceChildren();const result=document.createElement('p');result.textContent=`Imported ${String(payload.displayName)}`;row.append(result);jobs.delete(row);entries.splice(entries.indexOf(row),1);}catch(e){const error=document.createElement('p');error.className='error-message';error.role='alert';error.textContent=(e as Error).message;row.append(error);}}
    busy=false;if(!disposed){submit.disabled=false;host.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLSelectElement>('button,input,select').forEach(c=>c.disabled=false);if(jobs.size===0)actions.complete();else actions.status('Some files were not imported. Successful imports were kept; review the remaining files.');}
  });host.append(description,choose,stagedToolbar,list,submit);return {stage,dispose:()=>{disposed=true;previews.length=0;[...urls.keys()].forEach(release);}};
}
