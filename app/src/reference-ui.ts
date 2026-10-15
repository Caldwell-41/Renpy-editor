import { icon } from "./icons.ts";
import { layoutFor, saveLayout } from "./preferences.ts";
import { referenceComparison, referenceFieldName, referenceValue } from "./reference-presentation.ts";

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
export interface ProjectContextContent { world: string; tone: string }
export interface ProjectContextRecord { id:string; revisionCounter:number; currentRevisionId:string; revisions:{id:string;number:number;createdAt:string;content:ProjectContextContent}[] }
export interface ReferenceDocument { schemaVersion: 1; projectId: string; cards: ReferenceRecord[]; loreEntries: ReferenceRecord[]; projectContext?:ProjectContextRecord }
export interface ReferenceEntity { kind: EntityLink["type"]; id: string; title: string; revision: string | null }
export interface ReferenceIssue { recordId: string; revisionId: string; field: string; index: number; state: "missing" | "stale" }
export interface CharacterPreview { digest:string; patches:{path:string;before:string;after:string}[] }
export interface ReferenceWorkspace { document: ReferenceDocument | null; revision: string; diagnostic: string | null; entities: ReferenceEntity[]; issues: ReferenceIssue[]; canUndo: boolean; canRedo: boolean; characterPreview?:CharacterPreview }
interface GameCharacterFields { recordId:string|null; technicalName:string; displayName:string; dialogueColor:string }
export type ReferenceCommand =
  | {type:"reviewCard"|"reviewLore";recordId:string;revisionId:string;approve:boolean}
  | {type:"save";kind:ReferenceKind;recordId:string|null;fields:ReferenceContent}
  | {type:"move";kind:ReferenceKind;recordId:string;direction:"up"|"down"}
  | {type:"undo"|"redo"}
  | ({type:"previewGameCharacter"}&GameCharacterFields)
  | ({type:"createGameCharacter";expectedPreviewDigest:string}&GameCharacterFields)
  | {type:"linkCharacter";recordId:string|null;characterId:string;expectedSourceRevision:string}
  | {type:"restoreCard";recordId:string;revisionId:string}
  | {type:"saveProjectContext";world:string;tone:string};
export interface ReferenceActions {
  apply(command: ReferenceCommand, expectedRevision: string): Promise<ReferenceWorkspace>;
  load(): Promise<ReferenceWorkspace>; current(): boolean; guard(): Promise<boolean>;
  status(text: string, kind?: "normal" | "error"): void; creationHost: HTMLElement;
  workspaceKey?:string;
  renderGameSetup?(host:HTMLElement,characterId:string):Promise<void|(()=>void)>;
}
export interface ReferenceController { save(): Promise<void>; reload(): Promise<void>; isBusy(): boolean; dispose(): void }

const common=["title","tags","scope","knowledgeNotes","provenance","citations","links"] as const;
const cardFields=["linkedCharacterId","aliases","description","appearanceNotes","personality","motivations","background","relationships","speakingStyle","exampleDialogue","linkedLoreIds"] as const;
const loreFields=["text","category","subject","knowledge"] as const;
export function emptyReference(kind:ReferenceKind):ReferenceContent {
  const shared:ReferenceContent={title:"",tags:[],scope:{type:"project"},knowledgeNotes:"",provenance:{kind:"userAuthored",notes:""},citations:[],links:[]};
  return kind==="card"?{...shared,linkedCharacterId:null,aliases:[],description:"",appearanceNotes:"",personality:"",motivations:"",background:"",relationships:[],speakingStyle:"",exampleDialogue:"",linkedLoreIds:[]}:{...shared,text:"",category:"",subject:"",knowledge:[]};
}
function knownContent(content:ReferenceContent,kind:ReferenceKind):ReferenceContent {
  // Hidden stored fields remain in the draft and the core retains unknown members.
  const fields:Record<string,unknown>={};for(const key of [...common,...(kind==="card"?cardFields:loreFields)])if(content[key]!==undefined)fields[key]=structuredClone(content[key]);
  return fields as unknown as ReferenceContent;
}
function el<K extends keyof HTMLElementTagNameMap>(tag:K,text="",className=""):HTMLElementTagNameMap[K]{const n=document.createElement(tag);n.textContent=text;n.className=className;return n;}
function button(text:string,click:()=>void,className="button"):HTMLButtonElement{const b=el("button",text,className);b.type="button";b.onclick=click;return b;}
function label(text:string,control:HTMLElement):HTMLLabelElement{const l=el("label","","field");l.append(el("span",text),control);return l;}
function option(text:string,value:string):HTMLOptionElement{const n=el("option",text);n.value=value;return n;}
function currentRevision(record:ReferenceRecord):ReferenceRevision{return record.revisions.find(r=>r.id===record.currentRevisionId)!;}
function errorMessage(error:unknown):string{return error instanceof Error?error.message:"The change could not be saved. Your draft is retained.";}
function grow(control:HTMLTextAreaElement):void{control.style.height="auto";control.style.height=`${Math.max(control.scrollHeight,100)}px`;}
const help:Record<string,string>={
  title:"Use the name you want the AI to use for this character.",aliases:"List nicknames or other names, separated by commas, so the AI can recognise the same character.",tags:"Add comma-separated labels to organise and find this card.",
  description:"Give a short introduction: who they are, their role and what makes them distinctive.",personality:"Describe traits, habits and reactions. Concrete examples help the AI keep behaviour consistent.",motivations:"Write what they want and why it matters. This helps the AI give their choices a clear reason.",appearanceNotes:"Describe visible features and clothing the AI should mention consistently.",background:"Summarise past events that shape how they act now.",speakingStyle:"Describe vocabulary, tone and sentence style the AI should follow in dialogue.",exampleDialogue:"Write a few sample lines in their voice to show the AI the style you want.",relationship:"Describe how this character feels about the selected person and how they act around them.",
};

export function renderReferenceLibrary(host:HTMLElement,kind:ReferenceKind,initial:ReferenceWorkspace,actions:ReferenceActions):ReferenceController {
  return kind==="lore"?renderProjectLore(host,initial,actions):renderCharacters(host,initial,actions);
}

function renderProjectLore(host:HTMLElement,initial:ReferenceWorkspace,actions:ReferenceActions):ReferenceController {
  let model=initial,busy=false,disposed=false,sequence=0,history:HTMLElement|undefined;
  const saved=():ProjectContextContent=>{const record=model.document?.projectContext;return structuredClone(record?.revisions.find(r=>r.id===record.currentRevisionId)?.content??{world:"",tone:""});};
  let draft=saved(),baseline=JSON.stringify(draft),expectedRevision=model.revision;
  const root=el("section","","reference-library project-lorebook");root.dataset.kind="lore";
  const toolbar=el("div","","reference-history"),notice=el("p","","reference-notice");notice.role="status";
  const undo=button("Undo",()=>{void mutate({type:"undo"});}),redo=button("Redo",()=>{void mutate({type:"redo"});}),reload=button("Reload Lorebook",()=>{void refresh();});toolbar.append(undo,redo,reload);
  const editor=el("div","","reference-editor lorebook-editor"),body=el("div","","reference-writing-body");
  const footer=el("div","","reference-form-footer"),state=el("span"),discard=button("Discard changes",()=>{void discardDraft();}),saveButton=button("Save changes",()=>{void save();},"button primary");footer.append(state,discard,saveButton);
  const header=el("div","","reference-identity-header"),versions=button("Version history",()=>openHistory()),proposedLore=button("Review proposed lore",()=>openProposedLore());header.append(el("h2","Project Lorebook","reference-identity"),proposedLore,versions);root.append(toolbar,notice,editor);editor.append(header,el("p","Shared context for AI writing in this project. You can omit these notes for each request. Review these notes in the AI request before sending. Saving sends nothing.","muted"),body,footer);host.append(root);
  const controls=new Map<keyof ProjectContextContent,HTMLTextAreaElement>();const errors=new Map<keyof ProjectContextContent,HTMLElement>();
  for(const [key,title,description] of [["world","World & starting situation","Describe the setting, world rules and situation when the story begins."],["tone","Tone & writing style","Describe the mood, pacing, dialogue and prose style. Character cards guide each person's voice."]] as const){
    const input=el("textarea");input.name=key;input.rows=6;input.value=draft[key];const helper=el("p",description,"reference-field-help muted"),error=el("span","","field-error");helper.id=`lorebook-${key}-help`;error.id=`lorebook-${key}-error`;input.setAttribute("aria-describedby",`${helper.id} ${error.id}`);const wrapper=label(title,input);wrapper.append(helper,error);body.append(wrapper);controls.set(key,input);errors.set(key,error);
    input.oninput=()=>{draft[key]=input.value;grow(input);if(error.textContent)validate(key);synchronize();};input.onblur=()=>{validate(key);};grow(input);
  }
  const active=():boolean=>!disposed&&actions.current();const dirty=():boolean=>JSON.stringify(draft)!==baseline;
  function feedback(text:string,error=false):void{notice.textContent=text;notice.dataset.kind=error?"error":"normal";actions.status(text,error?"error":"normal");}
  function validate(key:keyof ProjectContextContent):boolean{const message=new TextEncoder().encode(draft[key]).length>10000?"Use at most 10,000 UTF-8 bytes for this field.":"";errors.get(key)!.textContent=message;controls.get(key)!.setAttribute("aria-invalid",String(!!message));return !message;}
  function synchronize():void{const blocked=busy||!!history;root.dataset.busy=String(busy);if(dirty())root.dataset.unsubmitted="true";else delete root.dataset.unsubmitted;state.textContent=busy?"Saving…":dirty()?"Unsaved changes":"Saved";saveButton.disabled=blocked||!dirty()||!model.document;discard.disabled=blocked||!dirty();undo.disabled=blocked||dirty()||!model.canUndo;redo.disabled=blocked||dirty()||!model.canRedo;reload.disabled=blocked;versions.disabled=busy||!model.document?.projectContext;proposedLore.hidden=!pendingLore().length;proposedLore.disabled=busy;controls.forEach(n=>n.disabled=blocked||!model.document);if(history)history.querySelectorAll<HTMLButtonElement>("button").forEach(n=>n.disabled=busy||n.dataset.refused==="true");}
  function draw():void{for(const [key,input]of controls){input.value=draft[key];errors.get(key)!.textContent="";input.removeAttribute("aria-invalid");grow(input);}synchronize();}
  async function discardDraft():Promise<void>{if(busy||history||!active()||!await actions.guard()||!active())return;draft=saved();baseline=JSON.stringify(draft);expectedRevision=model.revision;draw();feedback("Returned to saved text.");}
  async function save():Promise<void>{if(busy||history||!active()||!dirty())return;let first:HTMLTextAreaElement|undefined;for(const key of controls.keys())if(!validate(key))first??=controls.get(key);if(first){feedback("Correct the marked fields before saving. Your draft is retained.",true);first.focus();return;}await mutate({type:"saveProjectContext",...draft});}
  async function mutate(command:ReferenceCommand):Promise<void>{if(busy||history||!active()||!model.document||(command.type!=="saveProjectContext"&&dirty()))return;busy=true;root.dataset.mutationCommand=command.type;root.dataset.mutationOutcome="pending";synchronize();try{const next=await actions.apply(command,command.type==="saveProjectContext"?expectedRevision:model.revision);if(!active())return;model=next;draft=saved();baseline=JSON.stringify(draft);expectedRevision=model.revision;root.dataset.mutationOutcome="committed";draw();feedback(next.diagnostic??"Saved");}catch(error){if(active()){root.dataset.mutationOutcome="refused";feedback(errorMessage(error),true);}}finally{busy=false;root.dataset.mutationSequence=String(++sequence);if(active())synchronize();}}
  async function refresh():Promise<void>{if(busy||history||!active())return;busy=true;synchronize();try{const next=await actions.load();if(!active())return;model=next;if(!dirty()){draft=saved();baseline=JSON.stringify(draft);expectedRevision=model.revision;draw();}feedback(next.diagnostic??(dirty()?"Lorebook reloaded. Your draft is retained; changed saved data may require a fresh edit.":"Lorebook reloaded."));}catch(error){if(active())feedback(errorMessage(error),true);}finally{busy=false;if(active())synchronize();}}
  function pendingLore():ReferenceRecord[]{return (model.document?.loreEntries??[]).filter(record=>currentRevision(record).status==="proposed");}
  function openProposedLore():void{
    if(busy||history||!pendingLore().length)return;
    const invoker=document.activeElement as HTMLElement,overlay=el("div","","leave-source-dialog reference-version-dialog reference-proposed-lore-dialog");overlay.role="dialog";overlay.setAttribute("aria-modal","true");overlay.ariaLabel="Review proposed lore";
    const panel=el("section","","catalog-dialog-panel"),notice=el("p","","reference-proposal-notice"),items=el("div");notice.role="status";
    panel.append(el("h2","Review proposed lore"),el("p","These retained lore entries are separate from the project's world and tone notes. Review each saved proposal explicitly. Approving or rejecting it keeps your unsaved Lorebook draft.","muted"),notice,items);
    const close=button("Close proposed lore review",()=>finish());panel.append(close);overlay.append(panel);root.append(overlay);history=overlay;
    function finish():void{if(busy)return;overlay.remove();history=undefined;synchronize();if(invoker?.isConnected&&!invoker.hidden)invoker.focus();else{const heading=header.querySelector<HTMLElement>("h2");if(heading){heading.tabIndex=-1;heading.focus();}}}
    function drawReviews():void{
      items.replaceChildren();const records=pendingLore();if(!records.length)items.append(el("p","No proposed lore needs review."));
      for(const record of records){
        const next=currentRevision(record),approved=record.revisions.find(r=>r.id===record.approvedRevisionId),section=el("section","","reference-proposed-lore");section.dataset.recordId=record.id;section.append(el("h3",next.content.title),el("p",`Saved version ${next.number} · Proposed · needs approval`),el("p","Approving replaces the approved text for this entry; rejection retains the previous approved text. Undo is available."));
        for(const [key,value]of Object.entries(next.content)){const previous=(approved?.content as unknown as Record<string,unknown>|undefined)?.[key];if(JSON.stringify(previous)!==JSON.stringify(value))section.append(referenceComparison(referenceFieldName(key),previous,value));}
        const retained=el("details");retained.append(el("summary","Saved proposed lore and exact metadata"),el("h4","Current approved text"),el("pre",JSON.stringify(approved?.content??null,null,2)),el("h4","Proposed text"),el("pre",JSON.stringify(next.content,null,2)));section.append(retained);
        const approve=button("Approve this lore revision",()=>{void review(record.id,next.id,true);},"button primary"),reject=button("Reject proposed lore entry",()=>{void review(record.id,next.id,false);});approve.dataset.reviewLore=reject.dataset.reviewLore="true";
        if(model.issues.some(issue=>issue.recordId===record.id&&issue.revisionId===next.id&&(issue.field==="citations"||issue.field==="supportingReadSet"))){approve.dataset.refused="true";section.append(el("p","Approval unavailable: supporting material is missing or changed. Review fresh material before approving this revision.","error-message"));}
        section.append(approve,reject);items.append(section);
      }
    }
    async function review(recordId:string,revisionId:string,approve:boolean):Promise<void>{
      if(busy||!active())return;const record=pendingLore().find(r=>r.id===recordId);if(!record||currentRevision(record).id!==revisionId)return;
      if(approve&&model.issues.some(issue=>issue.recordId===recordId&&issue.revisionId===revisionId&&(issue.field==="citations"||issue.field==="supportingReadSet")))return;
      const previousContext=model.document?.projectContext?.currentRevisionId;
      busy=true;root.dataset.mutationCommand="reviewLore";root.dataset.mutationOutcome="pending";delete root.dataset.mutationErrorCode;notice.textContent="Saving review…";notice.classList.remove("error-message");synchronize();
      try{
        const next=await actions.apply({type:"reviewLore",recordId,revisionId,approve},model.revision);if(!active())return;model=next;
        // This explicit review changes a separate record. Preserve global drafts and
        // advance their token only when the world/tone revision stayed unchanged.
        if(!dirty()){draft=saved();baseline=JSON.stringify(draft);expectedRevision=model.revision;draw();}else if(previousContext===model.document?.projectContext?.currentRevisionId)expectedRevision=model.revision;
        root.dataset.mutationOutcome="committed";drawReviews();notice.textContent=approve?"Lore revision approved. Your Lorebook draft is retained.":"Proposed lore rejected. Your Lorebook draft is retained.";feedback(notice.textContent);close.focus();
      }catch(error){if(active()){root.dataset.mutationOutcome="refused";const code=(error as {code?:unknown})?.code;root.dataset.mutationErrorCode=typeof code==="string"&&/^[A-Z_]+$/.test(code)?code:"REFERENCE_ACTION_FAILED";notice.textContent=errorMessage(error);notice.classList.add("error-message");feedback(notice.textContent,true);}}
      finally{busy=false;root.dataset.mutationSequence=String(++sequence);if(active()){synchronize();if(root.dataset.mutationOutcome==="committed"&&history===overlay)close.focus();}}
    }
    overlay.addEventListener("keydown",event=>{if(event.key==="Escape"&&!busy){event.preventDefault();finish();}if(event.key==="Tab"){const controls=[...overlay.querySelectorAll<HTMLElement>('button:not(:disabled),summary')],first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});drawReviews();synchronize();close.focus();
  }
  function openHistory():void{
    const record=model.document?.projectContext;if(busy||history||!record)return;
    const invoker=document.activeElement as HTMLElement,overlay=el("div","","leave-source-dialog reference-version-dialog lorebook-version-dialog");overlay.role="dialog";overlay.setAttribute("aria-modal","true");overlay.ariaLabel="Lorebook version history";
    const panel=el("section","","catalog-dialog-panel");panel.append(el("h2","Version history"),el("p","Recent saved world and tone notes. Opening this history does not change your current draft.","muted"));
    const previews=el("div","","reference-version-previews");for(const revision of [...record.revisions].reverse()){
      const item=el("details","","reference-version-preview");item.open=true;item.append(el("summary",`Saved version ${revision.number}${revision.id===record.currentRevisionId?" · Current":""}`));
      for(const [key,title]of [["world","World & starting situation"],["tone","Tone & writing style"]] as const)item.append(el("h4",title),el("p",revision.content[key]||"No notes in this version.","review-prose"));previews.append(item);
    }
    const close=button("Close version history",()=>finish());panel.append(previews,close);overlay.append(panel);root.append(overlay);history=overlay;
    function finish():void{overlay.remove();history=undefined;synchronize();if(invoker?.isConnected)invoker.focus();}
    overlay.addEventListener("keydown",event=>{if(event.key==="Escape"){event.preventDefault();finish();}if(event.key==="Tab"){const focusable=[...overlay.querySelectorAll<HTMLElement>("summary,button")],first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});synchronize();close.focus();
  }
  synchronize();if(model.diagnostic)feedback(model.diagnostic,true);
  return {save,reload:refresh,isBusy:()=>busy,dispose:()=>{disposed=true;history?.remove();root.remove();}};
}

interface CharacterEntry { key:string;record:ReferenceRecord|null;game:ReferenceEntity|null;title:string }
interface DraftEntry { draft:ReferenceContent;baseline:string;expectedRevision:string;scroll:number;focusName:string|null;selectionStart:number|null;selectionEnd:number|null;gameFields:{technicalName:string;displayName:string;dialogueColor:string};gameBaseline:string;preview:CharacterPreview|null }
type Topic="overview"|"personality"|"voice"|"relationships"|"knowledge";
const topics:[Topic,string][]=[["overview","Overview"],["personality","Personality & goals"],["voice","Voice"],["relationships","Relationships"],["knowledge","Starting knowledge & secrets"]];

function renderCharacters(host:HTMLElement,initial:ReferenceWorkspace,actions:ReferenceActions):ReferenceController {
  let model=initial,busy=false,disposed=false,sequence=0,viewGeneration=0,gameCleanup:(()=>void)|undefined,gameHost:HTMLElement|undefined,history:HTMLElement|undefined;
  const workspaceKey=actions.workspaceKey??`${initial.document?.projectId??"project"}:characters`,remembered=layoutFor(workspaceKey);
  let selected=remembered.referenceSelection??"",topic:Topic=topics.some(([key])=>key===remembered.referenceTopic)?remembered.referenceTopic as Topic:"overview",view:"writing"|"game"="writing";
  const drafts=new Map<string,DraftEntry>();
  const root=el("section","","reference-library character-workspace");root.dataset.kind="card";
  const create=button("New character",()=>{void select("new");},"button primary");create.prepend(icon("plus"));actions.creationHost.append(create);
  const toolbar=el("div","","reference-history"),notice=el("p","","reference-notice");notice.role="status";
  const undo=button("Undo",()=>{void mutate({type:"undo"});}),redo=button("Redo",()=>{void mutate({type:"redo"});}),reload=button("Reload library",()=>{void refresh();});undo.ariaLabel="Undo last project change";redo.ariaLabel="Redo last project change";toolbar.append(undo,redo,reload);
  const layout=el("div","","reference-layout"),list=el("aside","","reference-list");list.id="character-list";list.ariaLabel="Characters";
  const collapse=button("",()=>setCollapsed(true,true),"icon-button project-tree-toggle");collapse.append(icon("panel"));collapse.title=collapse.ariaLabel="Collapse character list";collapse.setAttribute("aria-controls",list.id);
  const restore=button("",()=>setCollapsed(false,true),"icon-button tree-restore");restore.append(icon("panelOpen"));restore.title=restore.ariaLabel="Show character list";restore.setAttribute("aria-controls",list.id);
  const search=el("input");search.type="search";search.placeholder="Search name or notes";search.ariaLabel="Search characters";
  const rows=el("div","","reference-entries");list.append(collapse,el("h2","Characters"),label("Search",search),rows);
  const editor=el("div","","reference-editor");layout.append(list,restore,editor);root.append(toolbar,notice,layout);host.append(root);
  let body:HTMLElement,header:HTMLElement,footer:HTMLElement,state:HTMLElement,saveButton:HTMLButtonElement,discardButton:HTMLButtonElement;
  const validators=new Map<HTMLInputElement|HTMLTextAreaElement,()=>boolean>();
  const entries=():CharacterEntry[]=>{
    const cards=model.document?.cards??[],associated=new Set(cards.map(r=>currentRevision(r).content.linkedCharacterId).filter(Boolean));
    return [...cards.map(record=>({key:`card:${record.id}`,record,game:model.entities.find(e=>e.kind==="character"&&e.id===currentRevision(record).content.linkedCharacterId)??null,title:currentRevision(record).content.title})),...model.entities.filter(e=>e.kind==="character"&&!associated.has(e.id)).map(game=>({key:`character:${game.id}`,record:null,game,title:game.title}))];
  };
  const entry=():CharacterEntry=>entries().find(e=>e.key===selected)??{key:"new",record:null,game:null,title:"New character"};
  const active=():boolean=>!disposed&&actions.current();
  function data():DraftEntry{let value=drafts.get(selected);if(!value){const e=entry(),draft=e.record?knownContent(currentRevision(e.record).content,"card"):emptyReference("card");if(e.game&&!e.record){draft.title=e.game.title;draft.linkedCharacterId=e.game.id;}value={draft,baseline:JSON.stringify(draft),expectedRevision:model.revision,scroll:0,focusName:null,selectionStart:null,selectionEnd:null,gameFields:{technicalName:"",displayName:e.title==="New character"?"":e.title,dialogueColor:"#c5c8d0"},gameBaseline:JSON.stringify({technicalName:"",displayName:e.title==="New character"?"":e.title,dialogueColor:"#c5c8d0"}),preview:null};drafts.set(selected,value);}return value;}
  const dirty=(value=data()):boolean=>JSON.stringify(value.draft)!==value.baseline;
  const currentDirty=(value=data()):boolean=>dirty(value)||JSON.stringify(value.gameFields)!==value.gameBaseline;
  const restoreBlocked=():boolean=>currentDirty()||!!gameHost?.querySelector('[data-unsubmitted="true"]');
  const anyDirty=():boolean=>[...drafts.values()].some(d=>currentDirty(d));
  const proposed=():boolean=>!!entry().record&&currentRevision(entry().record!).status==="proposed";
  function feedback(text:string,error=false):void{notice.textContent=text;notice.dataset.kind=error?"error":"normal";actions.status(text,error?"error":"normal");}
  function setCollapsed(value:boolean,transfer=false):void{root.dataset.treeCollapsed=String(value);list.hidden=value;restore.hidden=!value;collapse.ariaExpanded=restore.ariaExpanded=String(!value);if(transfer)(value?restore:collapse).focus();saveLayout(workspaceKey,{treeCollapsed:value});}
  function synchronize():void{
    root.dataset.busy=String(busy);if(anyDirty())root.dataset.unsubmitted="true";else delete root.dataset.unsubmitted;
    if(editor){if(dirty())editor.dataset.unsubmitted="true";else delete editor.dataset.unsubmitted;}
    state.textContent=busy?"Saving…":currentDirty()?"Unsaved changes":proposed()?"Proposed · needs approval":selected==="new"?"New character":"Saved";
    saveButton.disabled=busy||!dirty()||proposed()||!model.document;discardButton.disabled=busy||!currentDirty();undo.disabled=busy||anyDirty()||!model.canUndo;redo.disabled=busy||anyDirty()||!model.canRedo;reload.disabled=busy;create.disabled=busy||!model.document;
    for(const n of root.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>(".reference-writing input,.reference-writing textarea,.reference-writing select"))n.disabled=busy||proposed()||!model.document;
    for(const n of root.querySelectorAll<HTMLButtonElement>(".reference-writing button,.reference-game-linking button,.reference-entry,.reference-topics button,.reference-view-tabs button,.reference-identity-header button"))n.disabled=busy||n.dataset.refused==="true"||(proposed()&&n.dataset.mutation==="true");
    root.querySelectorAll<HTMLInputElement|HTMLSelectElement>(".reference-game-linking input,.reference-game-linking select").forEach(n=>n.disabled=busy||proposed());
    if(history){for(const b of history.querySelectorAll<HTMLButtonElement>("button"))b.disabled=busy||(b.dataset.restore==="true"&&(restoreBlocked()||proposed()||b.dataset.refused==="true"));}
  }
  function changed():void{synchronize();actions.status(dirty()?"Unsaved reference changes":"Saved");}
  function field(parent:HTMLElement,key:keyof ReferenceContent,title:string,multiline=false,required=false,description=help[key]??""):void{
    const n=multiline?el("textarea"):el("input");n.name=key;n.value=String(data().draft[key]??"");n.required=required;if(n instanceof HTMLTextAreaElement)n.rows=5;
    const helper=el("p",description,"reference-field-help muted"),error=el("span","","field-error");helper.id=`reference-${key}-help`;error.id=`reference-${key}-error`;n.setAttribute("aria-describedby",`${helper.id} ${error.id}`);const wrapper=label(title,n);wrapper.append(helper,error);parent.append(wrapper);
    const validate=():boolean=>{const max=key==="title"?160:10000,message=required&&!n.value.trim()?`Enter ${title.toLowerCase()} before saving.`:new TextEncoder().encode(n.value).length>max?`Use at most ${max.toLocaleString()} UTF-8 bytes for ${title.toLowerCase()}.`:"";error.textContent=message;n.setAttribute("aria-invalid",String(!!message));return !message;};validators.set(n,validate);
    let composing=false;n.addEventListener("compositionstart",()=>{composing=true;});n.addEventListener("compositionend",()=>{composing=false;});n.onblur=()=>{if(!composing)validate();};n.oninput=()=>{(data().draft as unknown as Record<string,unknown>)[key]=n.value;if(n instanceof HTMLTextAreaElement)grow(n);if(error.textContent&&!composing)validate();changed();};if(n instanceof HTMLTextAreaElement)grow(n);
  }
  function stringList(parent:HTMLElement,key:"tags"|"aliases",title:string):void{const n=el("input");n.name=key;n.value=(data().draft[key]??[]).join(", ");const helper=el("p",help[key],"reference-field-help muted");helper.id=`reference-${key}-help`;n.setAttribute("aria-describedby",helper.id);n.oninput=()=>{data().draft[key]=n.value.split(",").map(s=>s.trim()).filter(Boolean);changed();};const wrapper=label(title,n);wrapper.append(helper);parent.append(wrapper);}
  function rememberFocus():void{if(!body)return;const value=data();value.scroll=body.scrollTop;const focus=document.activeElement;if(focus instanceof HTMLInputElement||focus instanceof HTMLTextAreaElement){if(body.contains(focus)){value.focusName=focus.name;value.selectionStart=focus.selectionStart;value.selectionEnd=focus.selectionEnd;}}}
  function focusEditor():void{if(proposed()){editor.querySelector<HTMLElement>(".reference-identity")?.focus();return;}const value=data(),panel=body.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden])')??body;const remembered=[...panel.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>("input,textarea")].find(n=>n.name===value.focusName);const focus=remembered??panel.querySelector<HTMLElement>("input,textarea,select,button,h3");focus?.focus();if(remembered&&(remembered.type==="text"||remembered instanceof HTMLTextAreaElement)&&value.selectionStart!==null)remembered.setSelectionRange(value.selectionStart,value.selectionEnd);body.scrollTop=value.scroll;}
  function drawList():void{rows.replaceChildren();const needle=search.value.toLocaleLowerCase(),visible=entries().filter(e=>JSON.stringify(e.record?currentRevision(e.record).content:e.title).toLocaleLowerCase().includes(needle));for(const e of visible){const draft=drafts.get(e.key),row=button("",()=>{void select(e.key);},"reference-entry");row.dataset.referenceId=e.record?.id??e.key;row.dataset.entryKey=e.key;row.ariaPressed=String(selected===e.key);row.append(el("strong",draft?.draft.title||e.title),el("small",e.game?"In game":"Planning only"));if(e.record&&currentRevision(e.record).status==="proposed")row.append(el("small","Proposed · needs approval"));if(draft&&dirty(draft))row.append(el("small","Unsaved changes"));rows.append(row);}if(!visible.length)rows.append(el("p",entries().length?"No matching characters.":"No characters yet. Choose New character to start.","muted"));}
  function clearGame():void{++viewGeneration;gameCleanup?.();gameCleanup=undefined;gameHost=undefined;}
  function drawEditor():void{
    clearGame();editor.replaceChildren();validators.clear();root.dataset.selectedKey=selected;const e=entry(),value=data();
    header=el("div","","reference-identity-header");const identity=el("div"),heading=el("h2",value.draft.title||e.title,"reference-identity");heading.tabIndex=-1;identity.append(heading,el("span",e.game?"In game":"Planning only","reference-character-state"));header.append(identity);if(e.record){const versions=button("Version history",()=>openHistory());versions.classList.add("reference-version-history");header.append(versions);}editor.append(header);
    const tabs=el("div","","reference-view-tabs");tabs.role="tablist";tabs.ariaLabel="Character workspace";
    for(const [key,title]of [["writing","Writing"],["game","Game setup"]] as const){const b=button(title,()=>{void switchView(key);});b.role="tab";b.id=`character-view-${key}`;b.setAttribute("aria-controls",`character-${key}`);b.ariaSelected=String(view===key);b.tabIndex=view===key?0:-1;tabs.append(b);}wireTabs(tabs);editor.append(tabs);
    body=el("div","","reference-writing-body");editor.append(body);
    body.addEventListener("focusout",event=>{const n=event.target;if(n instanceof HTMLInputElement||n instanceof HTMLTextAreaElement){value.focusName=n.name;value.selectionStart=n.selectionStart;value.selectionEnd=n.selectionEnd;value.scroll=body.scrollTop;}});
    const writing=el("div","","reference-writing");writing.id="character-writing";writing.role="tabpanel";writing.setAttribute("aria-labelledby","character-view-writing");writing.hidden=view!=="writing";body.append(writing);
    const topicTabs=el("div","","reference-topics");topicTabs.role="tablist";topicTabs.ariaLabel="Writing topics";writing.append(topicTabs);
    for(const [key,title]of topics){const b=button(title,()=>{rememberFocus();topic=key;saveLayout(workspaceKey,{referenceTopic:key});showTopic();});b.role="tab";b.id=`character-topic-${key}`;b.setAttribute("aria-controls",`character-topic-panel-${key}`);b.dataset.topic=key;topicTabs.append(b);}
    wireTabs(topicTabs);
    for(const [key,title]of topics){const panel=el("section","","reference-topic-panel");panel.id=`character-topic-panel-${key}`;panel.dataset.topic=key;panel.role="tabpanel";panel.setAttribute("aria-labelledby",`character-topic-${key}`);const h=el("h3",title);h.tabIndex=-1;panel.append(h);writing.append(panel);
      if(key==="overview"){field(panel,"title","Name",false,true);stringList(panel,"aliases","Aliases (optional)");stringList(panel,"tags","Tags (comma separated)");field(panel,"description","Description",true);field(panel,"appearanceNotes","Appearance notes",true);field(panel,"background","Background",true);}
      if(key==="personality"){field(panel,"personality","Personality",true);field(panel,"motivations","Motivations",true);}
      if(key==="voice"){field(panel,"speakingStyle","Speaking style",true);field(panel,"exampleDialogue","Example dialogue",true);}
      if(key==="relationships")drawRelationships(panel);
      if(key==="knowledge"){const name=value.draft.title||"this character";panel.append(el("p",`Describe ${name}'s perspective when the story begins.`),el("p",`What does ${name} already know? What have they not learned yet? What secrets do they keep?`,"reference-knowledge-guides"));field(panel,"knowledgeNotes","Starting knowledge & secrets",true,false,`Write what ${name} knows, doesn't know and keeps secret at the start of the story.`);}
    }
    writing.append(el("p",`Used only when you include ${value.draft.title||"this character"}'s card in an AI request.`,"reference-inclusion-note muted"));
    const game=el("div","","reference-game");game.id="character-game";game.role="tabpanel";game.setAttribute("aria-labelledby","character-view-game");game.hidden=view!=="game";body.append(game);
    if(e.game){gameHost=el("div","","character-game-setup");game.append(gameHost);if(view==="game")loadGame(e.game.id,gameHost);}else drawGameLinking(game);
    if(e.record&&proposed())drawProposal(e.record,writing);
    footer=el("div","","reference-form-footer");state=el("span");discardButton=button("Discard changes",()=>{void discard();});saveButton=button("Save changes",()=>{void save();},"button primary");footer.append(state,discardButton,saveButton);editor.append(footer);showTopic();synchronize();body.scrollTop=value.scroll;
  }
  function showTopic():void{for(const n of editor.querySelectorAll<HTMLElement>(".reference-topics button")){const is=n.dataset.topic===topic;n.ariaSelected=String(is);n.tabIndex=is?0:-1;}for(const panel of editor.querySelectorAll<HTMLElement>(".reference-topic-panel")){panel.hidden=panel.dataset.topic!==topic;if(!panel.hidden)panel.querySelectorAll<HTMLTextAreaElement>("textarea").forEach(grow);} }
  function wireTabs(tabs:HTMLElement):void{tabs.addEventListener("keydown",event=>{const buttons=[...tabs.querySelectorAll<HTMLButtonElement>('[role="tab"]')],index=buttons.indexOf(document.activeElement as HTMLButtonElement);if(index<0)return;const next=event.key==="ArrowRight"?(index+1)%buttons.length:event.key==="ArrowLeft"?(index+buttons.length-1)%buttons.length:event.key==="Home"?0:event.key==="End"?buttons.length-1:-1;if(next>=0){event.preventDefault();buttons[next]!.click();buttons[next]!.focus();}});}
  async function loadGame(id:string,parent:HTMLElement):Promise<void>{const generation=++viewGeneration;parent.append(el("p","Loading game setup…","muted"));try{if(!actions.renderGameSetup){parent.replaceChildren(el("p","Game setup is unavailable in this view.","muted"));return;}parent.replaceChildren();const cleanup=await actions.renderGameSetup(parent,id);if(!active()||generation!==viewGeneration||!parent.isConnected){cleanup?.();return;}gameCleanup=cleanup??undefined;}catch(error){if(active()&&generation===viewGeneration)parent.replaceChildren(el("p",errorMessage(error),"error-message"));}}
  async function guardGame():Promise<boolean>{return !gameHost?.querySelector('[data-unsubmitted="true"]')||await actions.guard();}
  async function switchView(next:"writing"|"game"):Promise<void>{if(busy||next===view||!active()||!await guardGame()||!active())return;rememberFocus();view=next;drawEditor();focusEditor();}
  async function select(key:string):Promise<void>{if(busy||!active()||!await guardGame()||!active())return;rememberFocus();selected=key;view="writing";saveLayout(workspaceKey,{referenceSelection:key});drawList();drawEditor();focusEditor();}
  function drawRelationships(parent:HTMLElement):void{
    const container=el("div","","reference-relationships");parent.append(container);
    const redraw=(open=-1):void=>{container.replaceChildren();for(const [index,item]of (data().draft.relationships??[]).entries()){
      const row=el("details","","reference-relationship");row.open=index===open;const summary=el("summary");const targetName=():string=>model.entities.find(e=>e.kind===item.target?.type&&e.id===item.target.id)?.title??(item.target?`Missing ${item.target.type}`:"Choose a person");summary.textContent=targetName();row.append(summary);
      const target=el("select");target.name=`relationship-${index}-target`;target.append(option("Choose a person",""));
      const candidates=model.entities.filter(e=>e.kind==="character"||e.kind==="card"||e.kind===item.target?.type);for(const e of candidates)target.append(option(e.title,`${e.kind}:${e.id}`));const selectedKey=item.target?`${item.target.type}:${item.target.id}`:"";if(selectedKey&&![...target.options].some(n=>n.value===selectedKey))target.append(option(targetName(),selectedKey));target.value=selectedKey;
      const targetHelp=el("p","Choose who these notes are about.","reference-field-help muted");targetHelp.id=`relationship-${index}-target-help`;target.setAttribute("aria-describedby",targetHelp.id);const targetLabel=label("Relationship with",target);targetLabel.append(targetHelp);row.append(targetLabel);
      target.onchange=()=>{const separator=target.value.indexOf(":"),next=separator<0?null:{type:target.value.slice(0,separator) as EntityLink["type"],id:target.value.slice(separator+1)};item.target=next?{...item.target,...next}:null;summary.textContent=targetName();changed();};
      const notes=el("textarea");notes.name=`relationship-${index}-text`;notes.rows=5;notes.value=item.text;const helper=el("p",help.relationship,"reference-field-help muted");helper.id=`relationship-${index}-help`;const error=el("span","","field-error");error.id=`relationship-${index}-error`;notes.setAttribute("aria-describedby",`${helper.id} ${error.id}`);const wrapper=label("Relationship",notes);wrapper.append(helper,error);row.append(wrapper);const validate=():boolean=>{const message=new TextEncoder().encode(notes.value).length>10000?"Use at most 10,000 UTF-8 bytes for this relationship.":"";error.textContent=message;notes.setAttribute("aria-invalid",String(!!message));return !message;};validators.set(notes,validate);notes.oninput=()=>{item.text=notes.value;grow(notes);if(error.textContent)validate();changed();};notes.onblur=()=>{validate();};
      const remove=button("Remove relationship",()=>{data().draft.relationships!.splice(index,1);for(const [n]of validators)if(container.contains(n))validators.delete(n);redraw();changed();});remove.dataset.mutation="true";row.append(remove);row.ontoggle=()=>{if(row.open)for(const other of container.querySelectorAll<HTMLDetailsElement>("details"))if(other!==row)other.open=false;};container.append(row);grow(notes);
    }const add=button("Add relationship",()=>{data().draft.relationships??=[];data().draft.relationships!.push({target:null,text:""});for(const [n]of validators)if(container.contains(n))validators.delete(n);redraw(data().draft.relationships!.length-1);changed();container.querySelector<HTMLSelectElement>("details[open] select")?.focus();});add.dataset.mutation="true";container.append(add);};redraw();
  }
  function drawGameLinking(parent:HTMLElement):void{
    const linking=el("div","","reference-game-linking");parent.append(linking);linking.append(el("h3","Planning only"),el("p","Create a game character or link an existing one by its saved identity. Writing notes never change game definitions or Appearance assets.","muted"));
    const e=entry(),value=data(),picker=el("select");picker.name="existingGameCharacter";picker.append(option("Choose an existing character",""));const associated=new Set((model.document?.cards??[]).filter(r=>r.id!==e.record?.id).map(r=>currentRevision(r).content.linkedCharacterId));for(const game of model.entities.filter(e=>e.kind==="character"&&!associated.has(e.id)))picker.append(option(game.title,game.id));
    const link=button("Link existing character",()=>{const game=model.entities.find(e=>e.kind==="character"&&e.id===picker.value);if(!game?.revision){feedback("Choose an available game character with a saved source revision.",true);return;}void mutate({type:"linkCharacter",recordId:e.record?.id??null,characterId:game.id,expectedSourceRevision:game.revision});});link.dataset.mutation="true";linking.append(label("Existing game character",picker),link);
    const createFields=el("div","","reference-game-create");linking.append(el("h3","Create game character"),createFields);
    for(const [key,title,type]of [["technicalName","Technical name","text"],["displayName","Display name","text"],["dialogueColor","Dialogue colour","color"]] as const){const n=el("input");n.type=type;n.name=key;n.value=value.gameFields[key];n.oninput=()=>{value.gameFields[key]=n.value;value.preview=null;preview.replaceChildren();confirm.hidden=true;synchronize();};createFields.append(label(title,n));}
    const preview=el("div","","reference-character-source-preview"),confirm=button("Create game character",()=>{if(!value.preview)return;void mutate({type:"createGameCharacter",recordId:e.record?.id??null,...value.gameFields,expectedPreviewDigest:value.preview.digest});},"button primary");confirm.dataset.mutation="true";confirm.hidden=!value.preview;
    const previewButton=button("Review game character source",()=>{void previewCharacter();});previewButton.dataset.mutation="true";linking.append(previewButton,preview,confirm);
    function showPreview():void{preview.replaceChildren();for(const patch of value.preview?.patches??[]){const section=el("section");section.append(el("h4",patch.path),el("h5","Current source"),el("pre",patch.before),el("h5","Proposed source"),el("pre",patch.after));preview.append(section);}confirm.hidden=!value.preview;}
    async function previewCharacter():Promise<void>{if(busy||dirty()||proposed()){feedback("Save or discard writing changes before creating or linking a game character.",true);return;}if(!value.gameFields.technicalName.trim()||!value.gameFields.displayName.trim()){feedback("Enter a technical name and display name before reviewing source.",true);return;}busy=true;synchronize();try{const next=await actions.apply({type:"previewGameCharacter",recordId:e.record?.id??null,...value.gameFields},model.revision);if(!active())return;if(!next.characterPreview)throw new Error("Source preview is unavailable. No character was created.");value.preview=next.characterPreview;showPreview();feedback("Review the source changes, then explicitly create the game character.");}catch(error){if(active())feedback(errorMessage(error),true);}finally{busy=false;if(active())synchronize();}}
    showPreview();
  }
  function drawProposal(record:ReferenceRecord,writing:HTMLElement):void{
    const next=currentRevision(record),approved=record.revisions.find(r=>r.id===record.approvedRevisionId),review=el("details","","reference-details reference-proposal-review");review.open=true;review.append(el("summary","Review proposed card and approved text"),el("p","This proposed card is saved but unapproved. Approving replaces the current approved text; rejection keeps it. Undo is available."));
    for(const [key,value]of Object.entries(next.content)){const previous=(approved?.content as unknown as Record<string,unknown>|undefined)?.[key];if(JSON.stringify(previous)!==JSON.stringify(value))review.append(referenceComparison(referenceFieldName(key),previous,value));}
    const exact=el("details");exact.append(el("summary","Exact metadata comparison"),el("h4","Current approved text"),el("pre",JSON.stringify(approved?.content??null,null,2)),el("h4","Proposed text"),el("pre",JSON.stringify(next.content,null,2)));review.append(exact);
    const approve=button("Approve this card revision",()=>{void mutate({type:"reviewCard",recordId:record.id,revisionId:next.id,approve:true});},"button primary");if(model.issues.some(i=>i.recordId===record.id&&i.revisionId===next.id&&(i.field==="citations"||i.field==="supportingReadSet"))){approve.dataset.refused="true";review.append(el("p","Approval unavailable: supporting material is missing or changed. Review fresh material before approving this revision.","error-message"));}approve.dataset.review="true";
    const reject=button("Reject proposed card",()=>{void mutate({type:"reviewCard",recordId:record.id,revisionId:next.id,approve:false});});reject.dataset.review="true";review.append(approve,reject);
    const frozen=el("details","","reference-details reference-frozen-fields");frozen.append(el("summary","Saved proposed fields"));for(const child of [...writing.children])frozen.append(child);writing.append(review,frozen);
  }
  function openHistory():void{
    if(busy||history||!entry().record)return;const record=entry().record!,invoker=document.activeElement as HTMLElement;
    const overlay=el("div","","leave-source-dialog reference-version-dialog");overlay.role="dialog";overlay.setAttribute("aria-modal","true");overlay.ariaLabel="Character version history";
    const panel=el("section","","catalog-dialog-panel"),heading=el("h2","Version history"),copy=el("p","Restores this card’s writing as a new saved version. The current game-character link is kept. You can undo the restore."),versions=el("div","","reference-version-previews");panel.append(heading,copy);if(restoreBlocked())panel.append(el("p","Save or discard your current changes before restoring a version.","error-message"));
    const close=button("Close version history",()=>closeHistory(invoker));
    for(const revision of [...record.revisions].reverse()){
      const item=el("details","","reference-version-preview");item.open=revision.id!==record.currentRevisionId;item.append(el("summary",`Saved version ${revision.number} · ${revision.status}${revision.id===record.currentRevisionId?" · Current":""}`));
      for(const key of ["title","description","personality","motivations","appearanceNotes","background","speakingStyle","exampleDialogue","relationships","knowledgeNotes"] as const){const value=revision.content[key];if(value&&(!Array.isArray(value)||value.length)){const section=el("section");section.append(el("h4",key==="knowledgeNotes"?"Starting knowledge & secrets":referenceFieldName(key)),el("p",referenceValue(value),"review-prose"));item.append(section);}}
      if(revision.id!==record.currentRevisionId){const restoreVersion=button("Restore this version",()=>{void restore();});restoreVersion.dataset.restore="true";restoreVersion.dataset.revisionId=revision.id;if(!["approved","superseded"].includes(revision.status))restoreVersion.dataset.refused="true";item.append(restoreVersion);}
      async function restore():Promise<void>{if(busy||restoreBlocked()||proposed()||!["approved","superseded"].includes(revision.status))return;await mutate({type:"restoreCard",recordId:record.id,revisionId:revision.id});if(root.dataset.mutationOutcome==="committed")closeHistory(editor.querySelector<HTMLElement>(".reference-version-history")??invoker);}
      versions.append(item);
    }
    panel.append(versions,close);overlay.append(panel);root.append(overlay);history=overlay;
    overlay.addEventListener("keydown",event=>{if(event.key==="Escape"&&!busy){event.preventDefault();closeHistory(invoker);}if(event.key==="Tab"){const controls=[...overlay.querySelectorAll<HTMLElement>('button:not(:disabled),summary')],first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});synchronize();close.focus();
  }
  function closeHistory(invoker?:HTMLElement):void{if(busy)return;history?.remove();history=undefined;if(invoker?.isConnected)invoker.focus();}
  async function discard():Promise<void>{if(busy||!active()||!await actions.guard()||!active())return;drafts.delete(selected);drawList();drawEditor();feedback("Returned to saved text.");focusEditor();}
  async function save():Promise<void>{if(busy||!active()||!dirty()||proposed()||history)return;if(gameHost?.querySelector('[data-unsubmitted="true"]')){feedback("Finish or discard game setup changes before saving writing. Both drafts are retained.",true);return;}let invalid:HTMLInputElement|HTMLTextAreaElement|undefined;for(const [n,validate]of validators)if(!validate())invalid??=n;if(invalid){const section=invalid.closest<HTMLElement>(".reference-topic-panel");if(section){topic=section.dataset.topic as Topic;showTopic();}const details=invalid.closest("details");if(details)details.open=true;feedback("Correct the marked fields before saving. Your draft is retained.",true);invalid.focus();return;}await mutate({type:"save",kind:"card",recordId:entry().record?.id??null,fields:knownContent(data().draft,"card")});}
  function reconcileDrafts(previous:ReferenceWorkspace):void{for(const [key,value]of drafts){if(!dirty(value)&&JSON.stringify(value.gameFields)===value.gameBaseline){drafts.delete(key);continue;}const id=key.startsWith("card:")?key.slice(5):null,old=previous.document?.cards.find(r=>r.id===id),next=model.document?.cards.find(r=>r.id===id);if(old?.currentRevisionId===next?.currentRevisionId)value.expectedRevision=model.revision;}}
  async function mutate(command:ReferenceCommand):Promise<void>{if(busy||!active()||!model.document)return;if(command.type!=="save"&&dirty()){feedback("Save or discard your changes first.",true);return;}if(proposed()&&!["reviewCard","undo","redo"].includes(command.type)){feedback("Review this proposed revision before changing the character.",true);return;}
    busy=true;root.dataset.mutationCommand=command.type;root.dataset.mutationOutcome="pending";delete root.dataset.mutationErrorCode;synchronize();feedback("Saving…");const previous=model,key=selected,pendingGameFields=structuredClone(data().gameFields),pendingGameBaseline=data().gameBaseline;
    try{const next=await actions.apply(command,command.type==="save"?data().expectedRevision:model.revision);if(!active())return;model=next;root.dataset.mutationOutcome="committed";drafts.delete(key);reconcileDrafts(previous);
      if(command.type==="save"&&command.recordId===null){const linked=command.fields.linkedCharacterId,created=model.document?.cards.find(r=>!previous.document?.cards.some(old=>old.id===r.id)&&(linked?currentRevision(r).content.linkedCharacterId===linked:true));if(created)selected=`card:${created.id}`;}
      if(command.type==="linkCharacter"||command.type==="createGameCharacter"){const record=command.recordId?model.document?.cards.find(r=>r.id===command.recordId):model.document?.cards.find(r=>!previous.document?.cards.some(old=>old.id===r.id));if(record)selected=`card:${record.id}`;}
      if(!entries().some(e=>e.key===selected)&&selected!=="new")selected=entries()[0]?.key??"new";if(command.type==="save"&&JSON.stringify(pendingGameFields)!==pendingGameBaseline){const retained=data();retained.gameFields=pendingGameFields;retained.gameBaseline=pendingGameBaseline;retained.preview=null;}saveLayout(workspaceKey,{referenceSelection:selected});drawList();drawEditor();feedback(next.diagnostic??"Saved");busy=false;synchronize();if(!history)focusEditor();
    }catch(error){root.dataset.mutationOutcome="refused";const code=(error as {code?:unknown})?.code;root.dataset.mutationErrorCode=typeof code==="string"&&/^[A-Z_]+$/.test(code)?code:"REFERENCE_ACTION_FAILED";if(active()){feedback(errorMessage(error),true);if(history){let errorNode=history.querySelector<HTMLElement>(".dialog-error");if(!errorNode){errorNode=el("p","","error-message dialog-error");errorNode.role="alert";history.querySelector("section")?.append(errorNode);}errorNode.textContent=errorMessage(error);}}}
    finally{root.dataset.mutationSequence=String(++sequence);busy=false;if(active())synchronize();}
  }
  async function refresh():Promise<void>{if(busy||!active()||history||!await guardGame())return;busy=true;synchronize();try{const next=await actions.load();if(!active())return;const previous=model;model=next;reconcileDrafts(previous);if(!entries().some(e=>e.key===selected)&&selected!=="new"&&!dirty())selected=entries()[0]?.key??"new";drawList();if(!dirty())drawEditor();feedback(next.diagnostic??(anyDirty()?"Library reloaded. Unsaved drafts are retained; changed saved cards may require a fresh edit.":"Library reloaded."),!!next.diagnostic);}catch(error){if(active())feedback(errorMessage(error),true);}finally{busy=false;if(active())synchronize();}}
  search.oninput=drawList;
  if(!entries().some(e=>e.key===selected)&&selected!=="new")selected=entries()[0]?.key??"new";
  drawList();drawEditor();setCollapsed(remembered.treeCollapsed||window.innerWidth<900);if(model.diagnostic)feedback(model.diagnostic,true);
  const reset=():void=>setCollapsed(window.innerWidth<900,true);root.closest(".project-shell")?.addEventListener("reset-panes",reset);
  return {save,reload:refresh,isBusy:()=>busy,dispose:()=>{disposed=true;clearGame();history?.remove();root.closest(".project-shell")?.removeEventListener("reset-panes",reset);create.remove();root.remove();}};
}
