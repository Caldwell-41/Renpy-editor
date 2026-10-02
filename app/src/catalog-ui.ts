import { catalogDialog } from "./catalog-dialog.ts";
import type { MediaPresentation } from "./scene-ui.ts";
interface CardInfo { id: string; label: string; kind?: string; assetId?: string; extra?: HTMLElement[] }
interface CatalogState { search:string; kind:string; asList:boolean; selectedId?:string; inspectorOpen:boolean; appearances:Record<string,string> }
const retainedCatalogues=new Map<string,CatalogState>();
/** Presentation layer over existing transactional forms; handlers retain their owner. */
export function catalogue(host: HTMLElement, list: HTMLElement, create: HTMLElement | undefined, title: string, infos: CardInfo[], load: (id: string)=>Promise<MediaPresentation>, stateKey?:string): ()=>void {
  const retained=stateKey?retainedCatalogues.get(stateKey):undefined;
  const selectedAppearances={...retained?.appearances};
  const rows=[...list.querySelectorAll<HTMLElement>(":scope > .entity-row")];
  const toolbar=document.createElement("div");toolbar.className="catalog-toolbar";
  const search=document.createElement("input");search.type="search";search.placeholder=`Search ${title.toLowerCase()}…`;search.ariaLabel=`Search ${title.toLowerCase()}`;
  const filters=document.createElement("select");filters.ariaLabel="Filter by type";
  const kinds=title==="Assets"?["Background", "Character image", "Music", "Sound effect"]:[...new Set(infos.map(i=>i.kind).filter(Boolean))];["All",...kinds].forEach(kind=>{const o=document.createElement("option");o.value=kind!;o.textContent=kind==="Background"?"Backgrounds":kind==="Character image"?"Character images":kind==="Sound effect"?"Sound effects":kind!;filters.append(o);});
  search.value=retained?.search??"";filters.value=retained?.kind??"All";
  const view=document.createElement("button");view.className="button";view.textContent="List view";view.ariaPressed="false";
  const body=document.createElement("div");body.className="catalog-body";
  const grid=document.createElement("div");grid.className=`catalog-grid${title==="Variables"?" catalog-list":""}`;
  if(title!=="Variables"&&retained?.asList){grid.classList.add("catalog-list");view.textContent="Grid view";view.ariaPressed="true";}
  const inspector=document.createElement("aside");inspector.className="catalog-inspector";inspector.ariaLabel=`${title} details`;inspector.hidden=true;
  const empty=document.createElement("p");empty.className="muted catalog-empty";empty.textContent=`No matching ${title.toLowerCase()}.`;
  const close=document.createElement("button");close.className="icon-button panel-close";close.textContent="×";close.ariaLabel="Close details";close.title="Close details";
  let selected: HTMLElement | undefined;let selectedId:string|undefined;
  const details=document.createElement("div");inspector.append(close,details);
  const closeInspector=():void=>{if(details.querySelector('[data-unsubmitted="true"]')){(details.querySelector("input,select,textarea") as HTMLElement)?.focus();return;}inspector.hidden=true;body.classList.remove("inspecting");selected?.querySelector<HTMLElement>(".card-open")?.focus();};close.addEventListener("click",closeInspector);inspector.addEventListener("keydown",e=>{if(e.key==="Escape"&&!document.querySelector('[aria-modal="true"]')){e.preventDefault();closeInspector();}});
  const urls=new Map<string,{url:string;bytes:number}>();const pending:Array<{id:string;img:HTMLImageElement}>=[];let loading=false,disposed=false;
  let closeDialog:(()=>void)|undefined;const createObservers:MutationObserver[]=[];
  const feedbacks=new WeakMap<HTMLImageElement,HTMLElement>();
  const clearFeedback=(img:HTMLImageElement):void=>{feedbacks.get(img)?.remove();feedbacks.delete(img);};
  const attachFeedback=(img:HTMLImageElement,feedback:HTMLElement):void=>{(img.parentElement?.classList.contains("appearance-select")?img.parentElement:img).after(feedback);feedbacks.set(img,feedback);};
  const enqueue=(id:string,img:HTMLImageElement):void=>{
    if(disposed)return;clearFeedback(img);img.dataset.mediaLabel??=img.alt;img.alt="Loading preview…";img.setAttribute("aria-busy","true");
    const feedback=document.createElement("span");feedback.className="media-feedback";feedback.role="status";feedback.textContent="Loading preview…";attachFeedback(img,feedback);pending.push({id,img});void pump();
  };
  const pump=async():Promise<void>=>{
    if(loading||disposed)return;loading=true;
    try{while(pending.length&&!disposed){
      const item=pending.shift()!;
      try{
        let cached=urls.get(item.id);
        if(!cached){
          const media=await load(item.id);if(disposed)break;
          const bytes=Uint8Array.from(atob(media.dataBase64),c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:media.mimeType}));cached={url,bytes:bytes.length};urls.set(item.id,cached);
          let total=[...urls.values()].reduce((sum,c)=>sum+c.bytes,0);for(const [key,c] of urls){if(total<=32*1024*1024||key===item.id)break;URL.revokeObjectURL(c.url);urls.delete(key);total-=c.bytes;}
        }
        if(item.img.isConnected&&item.img.dataset.assetId===item.id){item.img.src=cached.url;item.img.alt=item.img.dataset.mediaLabel??"Preview";item.img.removeAttribute("aria-busy");clearFeedback(item.img);}
      }catch(error){
        if(!disposed&&item.img.isConnected&&item.img.dataset.assetId===item.id){
          clearFeedback(item.img);item.img.alt="Preview unavailable";item.img.removeAttribute("aria-busy");
          const feedback=document.createElement("span");feedback.className="media-feedback";feedback.role="status";
          const detail=error instanceof Error?error.message:"Media could not be read.";feedback.textContent=`Preview unavailable: ${detail.slice(0,240)} `;
          const retry=document.createElement("button");retry.className="button media-retry";retry.textContent="Retry preview";retry.onclick=event=>{event.stopPropagation();enqueue(item.id,item.img);};feedback.append(retry);attachFeedback(item.img,feedback);
        }
      }
    }}finally{loading=false;}
  };
  const observer=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){const img=entry.target as HTMLImageElement;observer?.unobserve(img);enqueue(img.dataset.assetId!,img);}});}):undefined;
  const selectRow=(row:HTMLElement,info:CardInfo,controls:HTMLElement[],extras:HTMLElement[]):void=>{
    if(details.querySelector('[data-unsubmitted="true"]')){(details.querySelector("input,select,textarea") as HTMLElement)?.focus();return;}
    selected=row;selectedId=info.id;rows.forEach(r=>r.classList.toggle("selected",r===row));details.replaceChildren();const heading=document.createElement("h2");heading.textContent=info.label;details.append(heading);
    const thumbnail=row.querySelector<HTMLImageElement>(".catalog-thumbnail");if(thumbnail){const preview=thumbnail.cloneNode(true) as HTMLImageElement;preview.className="inspector-thumbnail";details.append(preview);if(!preview.getAttribute("src"))enqueue(info.assetId!,preview);}
    details.append(...controls,...extras);details.querySelectorAll<HTMLImageElement>(".appearance-thumbnail").forEach(img=>{if(observer)observer.observe(img);else enqueue(img.dataset.assetId!,img);});inspector.hidden=false;body.classList.add("inspecting");
    const appearances=[...details.querySelectorAll<HTMLButtonElement>(".appearance-select")];
    (appearances.find(b=>b.dataset.appearanceId===selectedAppearances[info.id])??appearances.find(b=>b.dataset.default==="true")??appearances[0])?.click();
    if(info.kind==="Music"||info.kind==="Sound effect"){const audio=document.createElement("button");audio.className="button";audio.disabled=true;audio.textContent="Audio preview · future milestone";details.append(audio);}
  };
  inspector.addEventListener("catalog-preview",event=>{const value=(event as CustomEvent<{assetId:string;label:string;appearanceId:string}>).detail;if(selectedId)selectedAppearances[selectedId]=value.appearanceId;const preview=details.querySelector<HTMLImageElement>(".inspector-thumbnail");if(!preview)return;preview.removeAttribute("src");preview.dataset.assetId=value.assetId;preview.dataset.mediaLabel=value.label;enqueue(value.assetId,preview);});
  rows.forEach((row,index)=>{
    const info=infos[index];if(!info)return;row.dataset.filter=`${info.label} ${info.kind??""}`.toLowerCase();row.dataset.kind=info.kind??"";
    const controls=[...row.querySelectorAll<HTMLElement>(":scope > .row-actions, :scope > button")];const extras=info.extra??[];
    const trigger=document.createElement("button");trigger.className="card-open";trigger.textContent=info.label;trigger.ariaLabel=`Show details for ${info.label}`;trigger.addEventListener("click",()=>selectRow(row,info,controls,extras));
    const summary=row.querySelector("strong");if(summary)summary.replaceWith(trigger);else row.prepend(trigger);
    if(info.assetId){const image=document.createElement("img");image.className="catalog-thumbnail";image.alt="Loading preview…";image.dataset.mediaLabel=info.label;image.loading="lazy";image.dataset.assetId=info.assetId;row.prepend(image);if(observer)observer.observe(image);else enqueue(info.assetId,image);}else if(title!=="Variables"){const placeholder=document.createElement("div");placeholder.className="catalog-placeholder";placeholder.textContent=info.kind==="Music"||info.kind==="Sound effect"?"♫":info.label.slice(0,1).toUpperCase();row.prepend(placeholder);}
    row.tabIndex=0;row.setAttribute("aria-label",`Select ${info.label}`);
    row.addEventListener("click",event=>{if(!(event.target as HTMLElement).closest("button,input,select,a"))selectRow(row,info,controls,extras);});
    row.addEventListener("keydown",event=>{if(event.target===row&&(event.key==="Enter"||event.key===" ")){event.preventDefault();selectRow(row,info,controls,extras);}});
    const edit=controls.flatMap(c=>[...c.querySelectorAll<HTMLButtonElement>("button"),...(c.tagName==="BUTTON"?[c as HTMLButtonElement]:[])]).find(b=>b.textContent?.startsWith("Edit"));
    if(edit){const direct=document.createElement("button");direct.className="button catalog-direct-edit";direct.textContent="Edit";direct.ariaLabel=`Edit ${info.label}`;direct.onclick=()=>edit.click();row.append(direct);}
    grid.append(row);
  });
  const apply=():void=>{let count=0;rows.forEach(r=>{const matches=(r.dataset.filter??"").includes(search.value.toLowerCase())&&(filters.value==="All"||r.dataset.kind===filters.value);r.hidden=!matches;if(matches)count++;});empty.hidden=count>0;empty.textContent=title==="Assets"&&filters.value!=="All"?`No ${filters.selectedOptions[0]!.textContent!.toLowerCase()} match this search.`:`No matching ${title.toLowerCase()}.`;};search.addEventListener("input",apply);filters.addEventListener("change",apply);
  view.addEventListener("click",()=>{const asList=grid.classList.toggle("catalog-list");view.textContent=asList?"Grid view":"List view";view.ariaPressed=String(asList);});
  toolbar.append(search);if(title==="Assets"||kinds.length>1)toolbar.append(filters);if(title!=="Variables")toolbar.append(view);
  if(create){create.classList.add("catalog-create");create.hidden=true;const add=document.createElement("button");add.className="button primary";add.textContent=title==="Assets"?"Import assets":title==="Characters"?"New character":"New variable";add.addEventListener("click",()=>{closeDialog=catalogDialog(create,add.textContent!,add);});toolbar.append(add);}
  if(title==="Variables"){const header=document.createElement("div");header.className="catalog-table-header";for(const label of ["Name","Type","Initial value", "Actions"]){const cell=document.createElement("span");cell.textContent=label;header.append(cell);}grid.prepend(header);}
  list.replaceChildren();list.classList.add("catalog-section");body.append(grid,inspector);list.append(toolbar,body,empty);apply();
  if(title==="Assets"&&create){const drop=document.createElement("button");drop.className="asset-drop-target";drop.type="button";drop.textContent="Drop images here or Browse files";drop.onclick=()=>{closeDialog=catalogDialog(create,"Import assets",drop);create.querySelector<HTMLButtonElement>("button")?.click();};toolbar.after(drop);
    const staged=()=>{if(create.querySelector(".import-entry"))closeDialog=catalogDialog(create,"Import assets",drop);};
    const watcher=new MutationObserver(()=>{if(!create.closest('[aria-modal="true"]'))staged();});watcher.observe(create,{childList:true,subtree:true});createObservers.push(watcher);
  }
  host.classList.add("catalog-workspace");
  const selectedIndex=infos.findIndex(info=>info.id===retained?.selectedId);
  rows[selectedIndex>=0?selectedIndex:0]?.querySelector<HTMLButtonElement>(".card-open")?.click();
  if(retained?.inspectorOpen===false){inspector.hidden=true;body.classList.remove("inspecting");}
  return ()=>{if(stateKey){retainedCatalogues.set(stateKey,{search:search.value,kind:filters.value,asList:grid.classList.contains("catalog-list"),selectedId,inspectorOpen:!inspector.hidden,appearances:selectedAppearances});if(retainedCatalogues.size>24)retainedCatalogues.delete(retainedCatalogues.keys().next().value!);}disposed=true;createObservers.forEach(o=>o.disconnect());closeDialog?.();observer?.disconnect();pending.length=0;urls.forEach(c=>URL.revokeObjectURL(c.url));urls.clear();};
}
