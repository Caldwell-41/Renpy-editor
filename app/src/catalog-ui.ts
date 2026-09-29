import type { MediaPresentation } from "./scene-ui.ts";
interface CardInfo { id: string; label: string; kind?: string; assetId?: string; extra?: HTMLElement[] }
/** Presentation layer over existing transactional forms; handlers retain their owner. */
export function catalogue(host: HTMLElement, list: HTMLElement, create: HTMLElement | undefined, title: string, infos: CardInfo[], load: (id: string)=>Promise<MediaPresentation>): ()=>void {
  const rows=[...list.querySelectorAll<HTMLElement>(":scope > .entity-row")];
  const toolbar=document.createElement("div");toolbar.className="catalog-toolbar";
  const search=document.createElement("input");search.type="search";search.placeholder=`Search ${title.toLowerCase()}…`;search.ariaLabel=`Search ${title.toLowerCase()}`;
  const filters=document.createElement("select");filters.ariaLabel="Filter by type";
  const kinds=[...new Set(infos.map(i=>i.kind).filter(Boolean))];["All",...kinds].forEach(kind=>{const o=document.createElement("option");o.value=kind!;o.textContent=kind!;filters.append(o);});
  const view=document.createElement("button");view.className="button";view.textContent="List view";view.ariaPressed="false";
  const body=document.createElement("div");body.className="catalog-body";
  const grid=document.createElement("div");grid.className=`catalog-grid${title==="Variables"?" catalog-list":""}`;
  const inspector=document.createElement("aside");inspector.className="catalog-inspector";inspector.ariaLabel=`${title} details`;inspector.hidden=true;
  const empty=document.createElement("p");empty.className="muted catalog-empty";empty.textContent=`No matching ${title.toLowerCase()}.`;
  const close=document.createElement("button");close.className="text-button";close.textContent="Close details";
  let selected: HTMLElement | undefined;
  const details=document.createElement("div");inspector.append(close,details);
  close.addEventListener("click",()=>{if(details.querySelector('[data-unsubmitted="true"]')){(details.querySelector("input,select,textarea") as HTMLElement)?.focus();return;}inspector.hidden=true;body.classList.remove("inspecting");selected?.querySelector<HTMLElement>(".card-open")?.focus();});
  const urls=new Map<string,{url:string;bytes:number}>();const pending:Array<{id:string;img:HTMLImageElement}>=[];let loading=false,disposed=false;
  const pump=async():Promise<void>=>{if(loading||disposed)return;loading=true;try{while(pending.length&&!disposed){const item=pending.shift()!;try{const media=await load(item.id);if(disposed)break;let cached=urls.get(item.id);if(!cached){const bytes=Uint8Array.from(atob(media.dataBase64),c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:media.mimeType}));cached={url,bytes:bytes.length};urls.set(item.id,cached);let total=[...urls.values()].reduce((sum,c)=>sum+c.bytes,0);for(const [key,c] of urls){if(total<=32*1024*1024||key===item.id)break;URL.revokeObjectURL(c.url);urls.delete(key);total-=c.bytes;}}item.img.src=cached.url;}catch{item.img.alt="Preview unavailable";}}}finally{loading=false;}};
  const observer=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){const img=entry.target as HTMLImageElement;observer?.unobserve(img);pending.push({id:img.dataset.assetId!,img});void pump();}});}):undefined;
  const selectRow=(row:HTMLElement,info:CardInfo,controls:HTMLElement[],extras:HTMLElement[]):void=>{
    if(details.querySelector('[data-unsubmitted="true"]')){(details.querySelector("input,select,textarea") as HTMLElement)?.focus();return;}
    selected=row;rows.forEach(r=>r.classList.toggle("selected",r===row));details.replaceChildren();const heading=document.createElement("h2");heading.textContent=info.label;details.append(heading);
    const thumbnail=row.querySelector<HTMLImageElement>(".catalog-thumbnail");if(thumbnail){const preview=thumbnail.cloneNode(true) as HTMLImageElement;preview.className="inspector-thumbnail";if(!preview.getAttribute("src")){pending.push({id:info.assetId!,img:preview});void pump();}details.append(preview);}
    details.append(...controls,...extras);inspector.hidden=false;body.classList.add("inspecting");
    if(info.kind==="Music"||info.kind==="Sound effect"){const audio=document.createElement("button");audio.className="button";audio.disabled=true;audio.textContent="Audio preview · future milestone";details.append(audio);}
  };
  rows.forEach((row,index)=>{
    const info=infos[index];if(!info)return;row.dataset.filter=`${info.label} ${info.kind??""}`.toLowerCase();row.dataset.kind=info.kind??"";
    const controls=[...row.querySelectorAll<HTMLElement>(":scope > .row-actions, :scope > button")];const extras=info.extra??[];
    const trigger=document.createElement("button");trigger.className="card-open";trigger.textContent=info.label;trigger.ariaLabel=`Show details for ${info.label}`;trigger.addEventListener("click",()=>selectRow(row,info,controls,extras));
    const summary=row.querySelector("strong");if(summary)summary.replaceWith(trigger);else row.prepend(trigger);
    if(info.assetId){const image=document.createElement("img");image.className="catalog-thumbnail";image.alt=info.label;image.loading="lazy";image.dataset.assetId=info.assetId;row.prepend(image);image.addEventListener("click",()=>trigger.click());if(observer)observer.observe(image);}else if(title!=="Variables"){const placeholder=document.createElement("div");placeholder.className="catalog-placeholder";placeholder.textContent=info.kind==="Music"||info.kind==="Sound effect"?"♫":info.label.slice(0,1).toUpperCase();row.prepend(placeholder);}
    grid.append(row);
  });
  const apply=():void=>{let count=0;rows.forEach(r=>{const matches=(r.dataset.filter??"").includes(search.value.toLowerCase())&&(filters.value==="All"||r.dataset.kind===filters.value);r.hidden=!matches;if(matches)count++;});empty.hidden=count>0;};search.addEventListener("input",apply);filters.addEventListener("change",apply);
  view.addEventListener("click",()=>{const asList=grid.classList.toggle("catalog-list");view.textContent=asList?"Grid view":"List view";view.ariaPressed=String(asList);});
  toolbar.append(search);if(kinds.length>1)toolbar.append(filters);if(title!=="Variables")toolbar.append(view);
  if(create){create.classList.add("catalog-create");create.hidden=true;const add=document.createElement("button");add.className="button primary";add.textContent=title==="Assets"?"Import assets":title==="Characters"?"New character":"New variable";add.addEventListener("click",()=>{create.hidden=!create.hidden;if(!create.hidden){create.scrollIntoView?.({block:"nearest"});create.querySelector<HTMLElement>("input,select,button")?.focus();}});toolbar.append(add);}
  if(title==="Variables"){const header=document.createElement("div");header.className="catalog-table-header";for(const label of ["Name","Type","Initial value"]){const cell=document.createElement("span");cell.textContent=label;header.append(cell);}grid.prepend(header);}
  list.replaceChildren();list.classList.add("catalog-section");body.append(grid,inspector);list.append(toolbar,body,empty);apply();
  host.classList.add("catalog-workspace");
  rows[0]?.querySelector<HTMLButtonElement>(".card-open")?.click();
  return ()=>{disposed=true;observer?.disconnect();pending.length=0;urls.forEach(c=>URL.revokeObjectURL(c.url));urls.clear();};
}
