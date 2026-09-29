export interface SelectedAsset { authorityId:string;displayName:string;byteCount:number;extension:string }
interface Character { id:string;displayName:string }
export interface ImportBatch { choices:SelectedAsset[]; errors?:string[]; cancelled?:boolean }
export function assetImport(host:HTMLElement, characters:Character[], actions:{choose:()=>Promise<ImportBatch>;import:(payload:Record<string,unknown>)=>Promise<void>;complete:()=>void;status:(message:string)=>void}):{stage:(batch:ImportBatch)=>void;dispose:()=>void} {
  let disposed=false,busy=false;const entries:HTMLElement[]=[];
  const choose=document.createElement('button');choose.className='button primary';choose.textContent='Choose files…';
  const description=document.createElement('p');description.className='muted';description.textContent='Choose files or drop them into Assets, then select how each will be used. Original files stay unchanged.';
  const list=document.createElement('div');list.className='import-staging';const submit=document.createElement('button');submit.className='button primary';submit.textContent='Import selected files';submit.hidden=true;
  const jobs=new Map<HTMLElement,()=>Record<string,unknown>>();
  function field(row:HTMLElement,title:string,input:HTMLInputElement|HTMLSelectElement):void{const label=document.createElement('label');label.className='field';const text=document.createElement('span');text.textContent=title;label.append(text,input);row.append(label);}
  const stage=(batch:ImportBatch):void=>{
    if(disposed||busy)return;host.hidden=false;
    batch.errors?.forEach(error=>actions.status(error));
    for(const selected of batch.choices){
      if(entries.length>=32){actions.status('Import up to 32 files at a time.');break;}
      const row=document.createElement('section');row.className='import-entry';row.dataset.unsubmitted='true';
      const title=document.createElement('h3');title.textContent=selected.displayName;row.append(title);
      const audio=['ogg','mp3','wav','flac'].includes(selected.extension.toLowerCase());
      const kind=document.createElement('select');for(const [value,label] of audio?[['music','Music'],['sfx','Sound effect']]:[['background','Background'],['characterAppearance','Character image']]){const option=document.createElement('option');option.value=value!;option.textContent=label!;kind.append(option);}field(row,'Use as',kind);
      const name=document.createElement('input');name.value=selected.displayName.replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_]/g,'_').replace(/^[^a-zA-Z]+/,'')||'asset';name.pattern='[A-Za-z][A-Za-z0-9_]*';field(row,'Ren’Py name',name);
      const display=document.createElement('input');display.value=selected.displayName.replace(/\.[^.]+$/,'');field(row,'Display name',display);
      const character=document.createElement('select');const empty=document.createElement('option');empty.value='';empty.textContent='Select a character';character.append(empty);characters.forEach(c=>{const o=document.createElement('option');o.value=c.id;o.textContent=c.displayName;character.append(o);});field(row,'Character',character);
      const expression=document.createElement('input');expression.value='neutral';field(row,'Expression',expression);
      const sync=():void=>{character.parentElement!.hidden=expression.parentElement!.hidden=kind.value!=='characterAppearance';};kind.addEventListener('change',sync);sync();
      const remove=document.createElement('button');remove.className='text-button';remove.textContent='Remove from import';remove.addEventListener('click',()=>{if(busy)return;row.remove();jobs.delete(row);entries.splice(entries.indexOf(row),1);submit.hidden=entries.length===0;});row.append(remove);entries.push(row);list.append(row);
      jobs.set(row,()=>{if(!/^[A-Za-z][A-Za-z0-9_]*$/.test(name.value)||!display.value.trim())throw new Error('Enter a name beginning with a letter, using letters, numbers and underscores, and a display name.');if(kind.value==='characterAppearance'&&(!character.value||!/^[A-Za-z][A-Za-z0-9_]*$/.test(expression.value)))throw new Error('Select a character and enter a valid expression.');return {authorityId:selected.authorityId,kind:kind.value,technicalName:name.value,displayName:display.value.trim(),characterId:kind.value==='characterAppearance'?character.value:null,expression:kind.value==='characterAppearance'?expression.value:null};});
    }submit.hidden=entries.length===0;
  };
  choose.addEventListener('click',async()=>{if(busy)return;busy=true;choose.disabled=true;try{const batch=await actions.choose();busy=false;if(!disposed)stage(batch);}catch(e){actions.status(e instanceof Error?e.message:'Files could not be selected.');}finally{busy=false;choose.disabled=false;}});
  submit.addEventListener('click',async()=>{if(busy)return;
    const payloads:Array<[HTMLElement,Record<string,unknown>]> = [];
    try{for(const [row,read] of jobs)payloads.push([row,read()]);}catch(e){actions.status((e as Error).message);return;}
    busy=true;host.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLSelectElement>('button,input,select').forEach(c=>c.disabled=true);
    for(const [row,payload] of payloads){if(disposed)break;try{await actions.import(payload);row.dataset.unsubmitted='false';row.replaceChildren();const result=document.createElement('p');result.textContent=`Imported ${String(payload.displayName)}`;row.append(result);jobs.delete(row);entries.splice(entries.indexOf(row),1);}catch(e){const error=document.createElement('p');error.className='error-message';error.role='alert';error.textContent=(e as Error).message;row.append(error);}}
    busy=false;if(!disposed){host.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLSelectElement>('button,input,select').forEach(c=>c.disabled=false);if(jobs.size===0)actions.complete();else actions.status('Some files were not imported. Successful imports were kept; review the remaining files.');}
  });host.append(description,choose,list,submit);return {stage,dispose:()=>{disposed=true;}};
}
