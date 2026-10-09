import { icon } from "./icons.ts";

export type ReferenceKind = "card" | "lore";
export interface EntityLink { type: "scene" | "character" | "card" | "lore"; id: string }
export interface Citation { target: EntityLink; revision: string; notes: string }
export interface Relationship { target: EntityLink | null; text: string }
export interface Knowledge { characterId: string; notes: string }
export interface ReferenceContent {
  title: string; tags: string[]; scope: { type: "project" | "scenes" | "route"; sceneIds?: string[] };
  knowledgeNotes: string; provenance: { kind: "userAuthored" | "sourceDerived" | "inferred"; notes: string };
  citations: Citation[]; links: EntityLink[];
  linkedCharacterId?: string | null; aliases?: string[]; description?: string; appearanceNotes?: string;
  personality?: string; motivations?: string; background?: string; relationships?: Relationship[];
  speakingStyle?: string; exampleDialogue?: string; linkedLoreIds?: string[];
  text?: string; category?: string; subject?: string; knowledge?: Knowledge[];
}
export interface ReferenceRevision { id: string; number: number; status: string; content: ReferenceContent; createdAt: string; reviewedAt: string | null }
export interface ReferenceRecord { id: string; revisionCounter: number; currentRevisionId: string; approvedRevisionId: string | null; revisions: ReferenceRevision[] }
export interface ReferenceDocument { schemaVersion: 1; projectId: string; cards: ReferenceRecord[]; loreEntries: ReferenceRecord[] }
export interface ReferenceEntity { kind: EntityLink["type"]; id: string; title: string; revision: string | null }
export interface ReferenceIssue { recordId: string; revisionId: string; field: string; index: number; state: "missing" | "stale" }
export interface ReferenceWorkspace { document: ReferenceDocument | null; revision: string; diagnostic: string | null; entities: ReferenceEntity[]; issues: ReferenceIssue[]; canUndo: boolean; canRedo: boolean }
export type ReferenceCommand = { type: "save"; kind: ReferenceKind; recordId: string | null; fields: ReferenceContent } | { type: "move"; kind: ReferenceKind; recordId: string; direction: "up" | "down" } | { type: "undo" | "redo" };
export interface ReferenceActions {
  apply(command: ReferenceCommand, expectedRevision: string): Promise<ReferenceWorkspace>;
  load(): Promise<ReferenceWorkspace>; current(): boolean; guard(): Promise<boolean>;
  status(text: string, kind?: "normal" | "error"): void; creationHost: HTMLElement;
}
export interface ReferenceController { save(): Promise<void>; isBusy(): boolean; dispose(): void }

const common = ["title","tags","scope","knowledgeNotes","provenance","citations","links"] as const;
const cardFields = ["linkedCharacterId","aliases","description","appearanceNotes","personality","motivations","background","relationships","speakingStyle","exampleDialogue","linkedLoreIds"] as const;
const loreFields = ["text","category","subject","knowledge"] as const;
export function emptyReference(kind: ReferenceKind): ReferenceContent {
  const shared: ReferenceContent = {title:"",tags:[],scope:{type:"project"},knowledgeNotes:"",provenance:{kind:"userAuthored",notes:""},citations:[],links:[]};
  return kind==="card" ? {...shared,linkedCharacterId:null,aliases:[],description:"",appearanceNotes:"",personality:"",motivations:"",background:"",relationships:[],speakingStyle:"",exampleDialogue:"",linkedLoreIds:[]} : {...shared,text:"",category:"",subject:"",knowledge:[]};
}
function knownContent(content: ReferenceContent, kind: ReferenceKind): ReferenceContent {
  // The core retains unknown members; send only fields the form can edit.
  const fields: Record<string,unknown>={};for(const key of [...common,...(kind==="card"?cardFields:loreFields)]) fields[key]=structuredClone(content[key]);
  return fields as unknown as ReferenceContent;
}
function el<K extends keyof HTMLElementTagNameMap>(tag: K, text="", className=""): HTMLElementTagNameMap[K] {const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;}
function button(text:string, click:()=>void, className="button"):HTMLButtonElement{const b=el("button",text,className);b.type="button";b.onclick=click;return b;}
function option(text="",value=""):HTMLOptionElement{const o=el("option",text);o.value=value;return o;}
function currentRevision(record:ReferenceRecord):ReferenceRevision{return record.revisions.find(v=>v.id===record.currentRevisionId)!;}
function errorMessage(error:unknown):string{return error instanceof Error?error.message:"The reference could not be saved. Your changes are still in the form.";}

export function renderReferenceLibrary(host:HTMLElement,kind:ReferenceKind,initial:ReferenceWorkspace,actions:ReferenceActions):ReferenceController {
  let model=initial, selected:string|null=null, draft=emptyReference(kind), baseline="", busy=false, disposed=false;
  const root=el("section","","reference-library");root.dataset.kind=kind;
  const create=button(kind==="card"?"New character card":"New lore entry",()=>{void select(null,true);});create.prepend(icon("plus"));actions.creationHost.append(create);
  const toolbar=el("div","","reference-history");
  const undo=button("Undo",()=>{void mutate({type:"undo"});});undo.ariaLabel="Undo last project change";
  const redo=button("Redo",()=>{void mutate({type:"redo"});});redo.ariaLabel="Redo last project change";
  const reload=button("Reload library",()=>{void refresh();});toolbar.append(undo,redo,reload);
  const notice=el("p","","reference-notice");notice.role="status";
  const layout=el("div","","reference-layout");const list=el("aside","","reference-list");list.ariaLabel=kind==="card"?"Character cards":"Lore entries";
  const search=el("input");search.type="search";search.placeholder=kind==="card"?"Search name or notes":"Search title or text";search.ariaLabel=kind==="card"?"Search cards":"Search lore";
  const filter=el("select");filter.ariaLabel=kind==="card"?"Filter by tag":"Filter by category or tag";
  const rows=el("div","","reference-entries");list.append(label("Search",search),label(kind==="card"?"Filter by tag":"Filter by category or tag",filter),rows);
  const editor=el("div","","reference-editor");layout.append(list,editor);root.append(toolbar,notice,layout);host.append(root);
  const records=():ReferenceRecord[]=>model.document?(kind==="card"?model.document.cards:model.document.loreEntries):[];
  const dirty=():boolean=>JSON.stringify(draft)!==baseline;
  const disabledBeforeBusy=new Map<HTMLButtonElement,boolean>();
  let saveButton:HTMLButtonElement|undefined, discardButton:HTMLButtonElement|undefined, state:HTMLElement|undefined;
  function label(text:string,control:HTMLElement):HTMLLabelElement{const l=el("label","","field");l.append(el("span",text),control);return l;}
  function active():boolean{return !disposed&&actions.current();}
  function feedback(text:string,error=false):void{notice.textContent=text;notice.dataset.kind=error?"error":"normal";actions.status(text,error?"error":"normal");}
  function synchronize():void{
    root.dataset.busy=String(busy);if(dirty())editor.dataset.unsubmitted="true";else delete editor.dataset.unsubmitted;
    if(saveButton)saveButton.disabled=busy||!dirty();if(discardButton)discardButton.disabled=busy||(!dirty()&&selected!==null);
    if(state)state.textContent=busy?"Saving…":dirty()?"Unsaved changes":selected===null?"New entry":"Saved";
    undo.disabled=busy||dirty()||!model.canUndo;redo.disabled=busy||dirty()||!model.canRedo;create.disabled=busy||!model.document;reload.disabled=busy;
    for(const control of root.querySelectorAll<HTMLButtonElement>(".reference-editor button,.reference-order button")){if(control===saveButton||control===discardButton)continue;if(busy){if(!disabledBeforeBusy.has(control))disabledBeforeBusy.set(control,control.disabled);control.disabled=true;}else if(disabledBeforeBusy.has(control)){control.disabled=disabledBeforeBusy.get(control)!;disabledBeforeBusy.delete(control);}}
    root.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>(".reference-editor input,.reference-editor textarea,.reference-editor select").forEach(e=>e.disabled=busy);
  }
  function changed():void{synchronize();actions.status(dirty()?"Unsaved reference changes":"Saved");}
  function field(parent:HTMLElement,key:keyof ReferenceContent,text:string,multiline=false,required=false):void{
    const control=multiline?el("textarea"):el("input");control.value=String(draft[key]??"");if(control instanceof HTMLTextAreaElement)control.rows=3;
    control.name=String(key);control.required=required;const error=el("span","","field-error");error.id=`reference-error-${String(key)}`;control.setAttribute("aria-describedby",error.id);
    const validate=():boolean=>{const maximum=["title","category","subject"].includes(String(key))?160:10000;const bytes=new TextEncoder().encode(control.value).length;
      const message=required&&!control.value.trim()?`Enter ${text.toLowerCase()} before saving.`:bytes>maximum?`Use at most ${maximum.toLocaleString()} bytes for ${text.toLowerCase()}.`:"";
      error.textContent=message;control.setAttribute("aria-invalid",String(!!message));return !message;};
    let composing=false;control.addEventListener("compositionstart",()=>{composing=true;});control.addEventListener("compositionend",()=>{composing=false;});
    control.addEventListener("input",()=>{(draft as unknown as Record<string,unknown>)[key]=control.value;if(error.textContent&&!composing)validate();changed();});control.addEventListener("blur",()=>{if(!composing)validate();});
    control.dataset.referenceRequired=String(required);const wrapper=label(text,control);wrapper.append(error);parent.append(wrapper);
  }
  function stringList(parent:HTMLElement,key:"tags"|"aliases",text:string):void{
    const input=el("input");input.value=(draft[key]??[]).join(", ");input.name=key;
    input.oninput=()=>{draft[key]=input.value.split(",").map(s=>s.trim()).filter(Boolean);changed();};parent.append(label(text,input));
  }
  function details(title:string):HTMLDetailsElement{const d=el("details","","reference-details");d.append(el("summary",title));editor.append(d);return d;}
  function entitySelect(kinds:EntityLink["type"][],value:EntityLink|null,none=true):HTMLSelectElement{
    const s=el("select");if(none)s.append(option("Not linked",""));
    for(const e of model.entities.filter(e=>kinds.includes(e.kind)))s.append(option(e.title,`${e.kind}:${e.id}`));
    const key=value?`${value.type}:${value.id}`:"";if(key&&!Array.from(s.options).some(o=>o.value===key))s.append(option(`Missing ${value!.type} (${value!.id})`,key));s.value=key;return s;
  }
  function chosen(select:HTMLSelectElement):EntityLink|null{if(!select.value)return null;const [type,id]=select.value.split(":");return {type:type as EntityLink["type"],id:id!};}
  function redrawList():void{
    rows.replaceChildren();const previous=filter.value;filter.replaceChildren(option("All", ""));
    const options=new Set<string>();for(const r of records()){const c=currentRevision(r).content;c.tags.forEach(t=>options.add(t));if(c.category)options.add(c.category);}
    for(const value of [...options].sort())filter.append(option(value,value));filter.value=options.has(previous)?previous:"";
    const needle=search.value.toLocaleLowerCase();const visible=records().filter(r=>{const c=currentRevision(r).content;return (!filter.value||c.tags.includes(filter.value)||c.category===filter.value)&&JSON.stringify(c).toLocaleLowerCase().includes(needle);});
    if(!visible.length)rows.append(el("p",records().length?"No matching entries.":kind==="card"?"No cards yet. Choose New character card to start.":"No lore yet. Choose New lore entry to start.","muted"));
    for(const r of visible){const c=currentRevision(r).content;const row=button("",()=>{void select(r.id);},"reference-entry");row.dataset.referenceId=r.id;row.ariaPressed=String(r.id===selected);row.append(el("strong",c.title),el("small",[c.category,...c.tags].filter(Boolean).join(" · ")));rows.append(row);}
  }
  function drawEditor():void{
    list.querySelector(".reference-order")?.remove();
    editor.replaceChildren();saveButton=discardButton=undefined;state=undefined;
    if(!model.document){editor.append(el("p",model.diagnostic??"The library is unavailable.","error-message"));synchronize();return;}
    const back=button(kind==="card"?"All character cards":"All lore entries",()=>{void (async()=>{if(busy)return;if(dirty())await discard();if(dirty())return;root.dataset.browsing="true";search.focus();})();},"text-button reference-back");back.prepend(icon("back"));editor.append(back);
    const identity=el("div","","reference-two-fields");editor.append(identity);field(identity,"title",kind==="card"?"Name":"Title",false,true);
    if(kind==="card")stringList(identity,"aliases","Aliases (optional)");else field(identity,"category","Category (optional)");
    stringList(editor,"tags","Tags (comma separated)");
    field(editor,kind==="card"?"description":"text",kind==="card"?"Description":"Entry text",true,kind==="lore");
    if(kind==="card"){
      field(editor,"personality","Personality",true);
      const about=details("Appearance, background & motivations");field(about,"appearanceNotes","Appearance notes",true);field(about,"background","Background",true);field(about,"motivations","Motivations",true);
      const voice=details("Voice & relationships");field(voice,"speakingStyle","Speaking style",true);field(voice,"exampleDialogue","Example dialogue",true);
      const relations=el("div");voice.append(relations);drawRelationships(relations);
    }else field(editor,"subject","Subject (optional)");
    const links=details("Story links & knowledge notes");
    if(kind==="card"){
      const s=entitySelect(["character"],draft.linkedCharacterId?{type:"character",id:draft.linkedCharacterId}:null);s.name="linkedCharacterId";s.onchange=()=>{draft.linkedCharacterId=chosen(s)?.id??null;changed();};links.append(label("Game character (optional)",s));
      const lore=el("div");links.append(lore);drawLoreLinks(lore);
    }
    const scope=el("select");scope.name="scope";for(const [value,text]of [["project","Whole project"],["scenes","Selected Scenes"],["route","Selected route"]])scope.append(option(text,value));scope.value=draft.scope.type;
    const scopeList=el("div");scope.onchange=()=>{draft.scope={type:scope.value as ReferenceContent["scope"]["type"],...(scope.value==="project"?{}:{sceneIds:[]})};drawScope(scopeList);changed();};links.append(label("Applies to",scope),scopeList);drawScope(scopeList);
    field(links,"knowledgeNotes","Knowledge & spoiler notes",true);
    const knowledge=el("div");if(kind==="lore"){links.append(knowledge);drawKnowledge(knowledge);}
    const entityLinks=el("div");links.append(entityLinks);drawEntityLinks(entityLinks);
    const sources=details("Source notes");const provenance=el("select");for(const [value,text]of [["userAuthored","Written by me"],["sourceDerived","From story source"],["inferred","My interpretation"]])provenance.append(option(text,value));provenance.value=draft.provenance.kind;provenance.onchange=()=>{draft.provenance.kind=provenance.value as ReferenceContent["provenance"]["kind"];changed();};sources.append(label("Where these notes came from",provenance));
    const provenanceNotes=el("textarea");provenanceNotes.rows=2;provenanceNotes.value=draft.provenance.notes;provenanceNotes.oninput=()=>{draft.provenance.notes=provenanceNotes.value;changed();};sources.append(label("Notes about the source (optional)",provenanceNotes));
    const citations=el("div");sources.append(citations);drawCitations(citations);
    const issues=model.issues.filter(i=>i.recordId===selected);if(issues.length)sources.append(el("p",`${issues.length} missing or changed link${issues.length===1?"":"s"}. Your notes and saved links have been kept.`,"reference-link-warning"));
    const revision=records().find(r=>r.id===selected);if(revision){const versions=details("Earlier saved text");for(const v of [...revision.revisions].reverse()){const entry=el("details");entry.append(el("summary",`Saved version ${v.number}`));const prose=el("pre",Object.entries(v.content).filter(([,value])=>typeof value==="string").map(([key,value])=>`${key}: ${value}`).join("\n"));entry.append(prose);versions.append(entry);}}
    const footer=el("div","","reference-form-footer");state=el("span");const buttons=el("div","","row-actions");discardButton=button(selected?"Discard changes":"Cancel",()=>{void discard();});saveButton=button(selected?"Save changes":kind==="card"?"Create card":"Create lore entry",()=>{void save();},"button primary");buttons.append(discardButton,saveButton);footer.append(state,buttons);editor.append(footer);
    if(selected){const order=el("div","","reference-order");order.append(el("span","List order"));const index=records().findIndex(r=>r.id===selected);const up=button("Move up",()=>{void mutate({type:"move",kind,recordId:selected!,direction:"up"});});const down=button("Move down",()=>{void mutate({type:"move",kind,recordId:selected!,direction:"down"});});up.disabled=index<=0;down.disabled=index>=records().length-1;order.append(up,down);list.append(order);}
    synchronize();
  }
  function drawRelationships(parent:HTMLElement):void{parent.replaceChildren();for(const [i,item]of (draft.relationships??[]).entries()){const row=el("div","","reference-link-row");const target=entitySelect(["character","card","lore","scene"],item.target);target.onchange=()=>{const next=chosen(target);item.target=next?{...item.target,...next}:null;changed();};const notes=el("textarea");notes.rows=2;notes.value=item.text;notes.oninput=()=>{item.text=notes.value;changed();};row.append(label("Related character or entry",target),label("Relationship",notes),button("Remove relationship",()=>{draft.relationships!.splice(i,1);drawRelationships(parent);changed();}));parent.append(row);}parent.append(button("Add relationship",()=>{draft.relationships!.push({target:null,text:""});drawRelationships(parent);changed();}));}
  function drawLoreLinks(parent:HTMLElement):void{parent.replaceChildren(el("p","Linked lore"));const ids=new Set([...model.entities.filter(e=>e.kind==="lore").map(e=>e.id),...(draft.linkedLoreIds??[])]);for(const id of ids){const checkbox=el("input");checkbox.type="checkbox";checkbox.checked=draft.linkedLoreIds!.includes(id);checkbox.onchange=()=>{draft.linkedLoreIds=checkbox.checked?[...draft.linkedLoreIds!,id]:draft.linkedLoreIds!.filter(x=>x!==id);changed();};const l=el("label","","reference-check");l.append(checkbox,el("span",model.entities.find(e=>e.id===id)?.title??`Missing lore (${id})`));parent.append(l);}if(!ids.size)parent.append(el("p","Create a lore entry to link it here.","muted"));}
  function drawScope(parent:HTMLElement):void{parent.replaceChildren();if(draft.scope.type==="project")return;for(const [i,id]of (draft.scope.sceneIds??[]).entries()){const row=el("div","","reference-route-row");row.append(el("span",`${i+1}. ${model.entities.find(e=>e.kind==="scene"&&e.id===id)?.title??"Missing Scene"}`));const up=button("Move up",()=>{const a=draft.scope.sceneIds!;[a[i-1],a[i]]=[a[i]!,a[i-1]!];drawScope(parent);changed();});up.disabled=i===0;row.append(up,button("Remove Scene",()=>{draft.scope.sceneIds!.splice(i,1);drawScope(parent);changed();}));parent.append(row);}const picker=entitySelect(["scene"],null);parent.append(label("Scene to add",picker),button("Add Scene",()=>{const target=chosen(picker);if(!target)return;if(draft.scope.type==="route"||!draft.scope.sceneIds!.includes(target.id))draft.scope.sceneIds!.push(target.id);drawScope(parent);changed();}));if(draft.scope.type==="route")parent.append(el("p","Route order is explicit. A Scene can appear more than once.","muted"));}
  function drawKnowledge(parent:HTMLElement):void{parent.replaceChildren();for(const [i,item]of (draft.knowledge??[]).entries()){const row=el("div","","reference-link-row");const picker=entitySelect(["character"],{type:"character",id:item.characterId},false);picker.onchange=()=>{item.characterId=chosen(picker)!.id;changed();};const notes=el("textarea");notes.value=item.notes;notes.rows=2;notes.oninput=()=>{item.notes=notes.value;changed();};row.append(label("Character",picker),label("What this character knows",notes),button("Remove knowledge note",()=>{draft.knowledge!.splice(i,1);drawKnowledge(parent);changed();}));parent.append(row);}const picker=entitySelect(["character"],null);parent.append(label("Character for a knowledge note",picker),button("Add knowledge note",()=>{const target=chosen(picker);if(!target)return;draft.knowledge!.push({characterId:target.id,notes:""});drawKnowledge(parent);changed();}));}
  function drawEntityLinks(parent:HTMLElement):void{parent.replaceChildren(el("p","Related story items"));for(const [i,target]of draft.links.entries()){const row=el("div","","reference-route-row");row.append(el("span",model.entities.find(e=>e.kind===target.type&&e.id===target.id)?.title??`Missing ${target.type}`),button("Remove link",()=>{draft.links.splice(i,1);drawEntityLinks(parent);changed();}));parent.append(row);}const picker=entitySelect(["scene","character","card","lore"],null);parent.append(label("Item to link",picker),button("Add link",()=>{const target=chosen(picker);if(!target)return;draft.links.push(target);drawEntityLinks(parent);changed();}));}
  function drawCitations(parent:HTMLElement):void{parent.replaceChildren();for(const [i,item]of draft.citations.entries()){const entity=model.entities.find(e=>e.kind===item.target.type&&e.id===item.target.id);const row=el("div","","reference-link-row");const status=!entity?.revision?"Missing source":entity.revision!==item.revision?"Source changed":"Source unchanged";row.append(el("p",`${entity?.title??`Missing ${item.target.type}`} · ${status}`));const notes=el("textarea");notes.rows=2;notes.value=item.notes;notes.oninput=()=>{item.notes=notes.value;changed();};row.append(label("Source note",notes));if(entity?.revision&&entity.revision!==item.revision)row.append(button("Use current source version",()=>{item.revision=entity.revision!;drawCitations(parent);changed();}));row.append(button("Remove source link",()=>{draft.citations.splice(i,1);drawCitations(parent);changed();}));parent.append(row);}const picker=entitySelect(["scene","character","card","lore"],null);parent.append(label("Supporting story item",picker),button("Add source link",()=>{const target=chosen(picker);const entity=model.entities.find(e=>e.kind===target?.type&&e.id===target.id);if(!target||!entity?.revision){feedback("Choose an available story item with a saved version.",true);return;}draft.citations.push({target,revision:entity.revision,notes:""});drawCitations(parent);changed();}));}
  async function select(id:string|null,creating=false):Promise<void>{if(busy||!active()||!await actions.guard())return;if(!model.document)return;selected=id;const record=records().find(r=>r.id===id);draft=record?knownContent(currentRevision(record).content,kind):emptyReference(kind);baseline=JSON.stringify(draft);root.dataset.browsing="false";list.querySelector(".reference-order")?.remove();redrawList();drawEditor();if(creating||id)editor.querySelector<HTMLInputElement>('input[name="title"]')?.focus();}
  async function discard():Promise<void>{if(busy)return;if(dirty()&&!await actions.guard())return;await select(selected===null?(records()[0]?.id??null):selected);feedback("Returned to saved text.");}
  async function save():Promise<void>{if(busy||!active()||!dirty())return;
    const formInvalid=Array.from(editor.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input[data-reference-required],textarea[data-reference-required]')).find(input=>input.required&&!input.value.trim());
    if(formInvalid){formInvalid.setAttribute("aria-invalid","true");const error=editor.querySelector(`#${formInvalid.getAttribute("aria-describedby")}`);if(error)error.textContent="Enter a value before saving.";feedback("Complete the required fields before saving.",true);formInvalid.focus();return;}
    await mutate({type:"save",kind,recordId:selected,fields:knownContent(draft,kind)});
  }
  async function mutate(command:ReferenceCommand):Promise<void>{if(busy||!active()||!model.document)return;if(command.type!=="save"&&dirty()){feedback("Save or discard your changes first.",true);return;}busy=true;synchronize();actions.status("Saving…");
    try{const next=await actions.apply(command,model.revision);if(!active())return;model=next;if(command.type==="save"&&command.recordId===null)selected=records().at(-1)?.id??null;const record=records().find(r=>r.id===selected);if(!record)selected=records()[0]?.id??null;draft=record?knownContent(currentRevision(record).content,kind):selected?knownContent(currentRevision(records()[0]!).content,kind):emptyReference(kind);baseline=JSON.stringify(draft);list.querySelector(".reference-order")?.remove();redrawList();drawEditor();feedback(next.diagnostic??"Saved");busy=false;synchronize();editor.querySelector<HTMLInputElement>('input[name="title"]')?.focus();}
    catch(error){if(active())feedback(errorMessage(error),true);}
    finally{busy=false;if(active())synchronize();}
  }
  async function refresh():Promise<void>{if(busy||!active())return;busy=true;synchronize();try{const next=await actions.load();if(!active())return;model=next;redrawList();feedback(next.diagnostic??(dirty()?"Library reloaded. Your unsaved text is still in the form; review it before saving.":"Library reloaded."),!!next.diagnostic);if(!dirty()){const record=records().find(r=>r.id===selected)??records()[0];selected=record?.id??null;draft=record?knownContent(currentRevision(record).content,kind):emptyReference(kind);baseline=JSON.stringify(draft);drawEditor();}}catch(error){if(active())feedback(errorMessage(error),true);}finally{busy=false;if(active())synchronize();}}
  search.oninput=redrawList;filter.onchange=redrawList;
  selected=records()[0]?.id??null;draft=selected?knownContent(currentRevision(records()[0]!).content,kind):emptyReference(kind);baseline=JSON.stringify(draft);redrawList();drawEditor();notice.textContent=model.diagnostic??"";
  return {save,isBusy:()=>busy,dispose:()=>{disposed=true;create.remove();root.remove();}};
}
