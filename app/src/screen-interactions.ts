import type { OwnedScreen, ResolvedScreenTarget, ScreenAction, ScreenRevisions, ScreenTargetBinding, ScreenVariableValue, ScreenArithmeticValue } from "./screen-contracts.ts";

export interface ScreenVariable {
  id:string; technicalName:string; variableType:"bool"|"int"|"decimal"|"string"; defaultValue:ScreenVariableValue;
  source:{sourceRevision:string};
}
export interface InteractionContext {
  authoringRevision:string; variables:ScreenVariable[]; targets:ResolvedScreenTarget[]; owner?:OwnedScreen;
}
export interface InteractionEdit {
  expectedAuthoringRevision:string;
  expectedTargetRevisions:{target:ScreenTargetBinding;revisions:ScreenRevisions}[];
  actions?:ScreenAction[];
}
interface Row { id:string; type:ScreenAction["type"]; variableId:string; value:string; arithmetic?:ScreenArithmeticValue; target:ScreenTargetBinding }
interface ActionFocus {id:string;part?:string;operation?:string;start?:number|null;end?:number|null}
export interface ActionDraft { focus?:ActionFocus; rows:Row[]; touched:boolean; expanded?:string; error?:{id:string;part:string;text:string} }
let sequence=0;
const el=<K extends keyof HTMLElementTagNameMap>(tag:K,className="",text="")=>{const n=document.createElement(tag);n.className=className;n.textContent=text;return n;};
const key=(target:ScreenTargetBinding)=>JSON.stringify([target.screenId,target.sourceName]);
export function variableValue(variable:ScreenVariable,raw:string):ScreenVariableValue {
  if(variable.variableType==="bool") {if(raw!=="True"&&raw!=="False")throw Error("Choose True or False. Your value is retained.");return raw==="True";}
  if(variable.variableType==="int" && (!/^(?:0|-[1-9][0-9]*|[1-9][0-9]*)$/.test(raw)||BigInt(raw)<-9223372036854775808n||BigInt(raw)>9223372036854775807n))throw Error("Use a whole number from -9223372036854775808 to 9223372036854775807. Your value is retained.");
  if(variable.variableType==="decimal"){const value=Number(raw);if(!raw.trim()||!Number.isFinite(value))throw Error("Use a finite decimal number. Your value is retained.");return value;}
  return raw;
}
export const variableLabel=(variable:ScreenVariable)=>variable.technicalName.replaceAll("_"," ").replace(/^./,letter=>letter.toUpperCase());
export const variableRaw=(value:ScreenVariableValue)=>typeof value==="boolean"?value?"True":"False":String(value);
export function actionSummary(row:ActionDraft["rows"][number],variables:readonly ScreenVariable[]):string {
 const variable=variables.find(v=>v.id===row.variableId);
 const name=variable?variableLabel(variable):"missing variable";
 const operator=row.arithmetic?({assign:"",add:"+",subtract:"-",multiply:"*",divide:"/",floorDivide:"//",remainder:"%"}[row.arithmetic.operation]):"";
 return row.type==="setVariable"?`Set ${name} to ${operator?`${name} ${operator} (${row.value})`:row.value}`:row.type==="finishInteraction"?"Finish interaction":`${row.type==="showScreen"?"Show":"Hide"} ${row.target.sourceName||"missing screen"}`;
}
export function actionDraft(actions:ScreenAction[]):ActionDraft {
 const rows=actions.map(action=>({id:`screen-action-${++sequence}`,type:action.type,variableId:action.type==="setVariable"?action.variableId:"",value:action.type==="setVariable"?(typeof action.value==="object"?action.value.operand:variableRaw(action.value)):"",...(action.type==="setVariable"&&typeof action.value==="object"?{arithmetic:{...action.value}}:{}),target:action.type==="showScreen"||action.type==="hideScreen"?{...action.target}:{screenId:"",sourceName:""}}));
 return {rows,touched:false,expanded:rows[0]?.id};
}
export function prepareInteraction(context:InteractionContext, draft?:ActionDraft):InteractionEdit {
 const reviews=new Map<string,{target:ScreenTargetBinding;revisions:ScreenRevisions}>();
 const fail=(row:Row,part:string,text:string):never=>{if(draft){draft.error={id:row.id,part,text};draft.expanded=row.id;}throw Error(text);};
 const actions=draft?.rows.map((row,index):ScreenAction=>{
   if(context.owner?.kind==="component")return fail(row,"type","Component actions stay in Source.");
   if(row.type==="setVariable") {
     const variable=context.variables.find(v=>v.id===row.variableId);if(!variable)return fail(row,"variable","Choose an available variable. Your input is retained.");
     try{return {type:row.type,variableId:variable.id,value:row.arithmetic?{...row.arithmetic,operand:row.value}:variableValue(variable,row.value)};}catch(error){return fail(row,"value",(error as Error).message);}
   }
   if(row.type==="finishInteraction") {
     const own=context.targets.find(t=>t.binding.screenId===context.owner?.id);
     if(own?.kind!=="dialog"||!own.blocking||index!==draft!.rows.length-1)return fail(row,"type","Finish requires a blocking Dialog and must stay last.");
     return {type:row.type};
   }
   const target=context.targets.find(t=>key(t.binding)===key(row.target));
   if(!target?.canShowHide)return fail(row,"target","Choose a screen qualified for Show or Hide. Your input is retained.");
   reviews.set(key(target.binding),{target:{...target.binding},revisions:{...target.revisions}});
   return {type:row.type,target:{...target.binding}};
 });
 if(actions && actions.length>8)throw Error("Use no more than eight actions.");
 return {expectedAuthoringRevision:context.authoringRevision,expectedTargetRevisions:[...reviews.values()],...(actions?{actions}:{})};
}

export function captureActionFocus(section:HTMLElement,draft:ActionDraft):void {
 const active=document.activeElement as HTMLElement|null;
 if(!active||!section.contains(active))return;
 const id=active.closest<HTMLElement>("[data-row-id]")?.dataset.rowId;if(!id)return;
 const input=active.tagName==="INPUT"?active as HTMLInputElement:undefined;
 draft.focus={id,part:active.dataset.part,operation:active.dataset.action,...(input?{start:input.selectionStart,end:input.selectionEnd}:{})};
}

/** Presentation and raw input only. ScreenText owns its original-base draft and Apply. */
export function renderActions(section:HTMLElement,draft:ActionDraft,context:InteractionContext|undefined,readOnly:boolean,changed:()=>void):void {
 captureActionFocus(section,draft);

 const variables=context?.variables??[],targets=context?.targets.filter(t=>t.canShowHide)??[];
 const finish=context?.targets.some(t=>t.binding.screenId===context.owner?.id&&t.kind==="dialog"&&t.blocking)??false;
 const types:[string,string][]=[["setVariable","Set variable"],["showScreen","Show screen"],["hideScreen","Hide screen"],...(finish?[["finishInteraction","Finish interaction"] as [string,string]]:[])];
 const summary=(row:Row)=>actionSummary(row,variables);
 const select=(choices:[string,string][],value:string)=>{const control=el("select");if(!choices.some(([id])=>id===value)){const option=el("option","",value?"Original selection unavailable":"Choose…");option.value=value;control.append(option);}for(const [id,label]of choices){const option=el("option","",label);option.value=id;control.append(option);}control.value=value;return control;};
 section.replaceChildren();section.className="siv-actions siv-inspector";section.setAttribute("aria-label","Ordered button actions");
 const heading=el("div","siv-section-heading");heading.append(el("h3","","When clicked"),el("span","",`${draft.rows.length} / 8 actions`));
 const add=select([["","+ Add action"],...types],"");add.className="siv-add";add.setAttribute("aria-label","Add action");add.disabled=readOnly||!context||draft.rows.length>=8;
 for(const option of add.options)if(option.value==="finishInteraction"&&draft.rows.some(r=>r.type==="finishInteraction"))option.disabled=true;
 section.append(heading,add);
 if(readOnly||!context)section.append(el("p","siv-error",context?.owner?.kind==="component"?"Component actions are read-only here.":"Actions are source-only or unavailable. Your draft is retained."));
 const fieldset=el("fieldset");fieldset.disabled=readOnly||!context;const list=el("ol","siv-sequence");fieldset.append(list);section.append(fieldset);
 const rerender=()=>renderActions(section,draft,context,readOnly,changed);
 const update=()=>{draft.touched=true;draft.error=undefined;changed();};
 draft.rows.forEach((row,index)=>{
   const item=el("li"),detail=el("details"),caption=el("summary"),number=el("span","siv-number",String(index+1)),description=el("span","siv-summary",summary(row));item.dataset.rowId=row.id;detail.dataset.rowId=row.id;detail.name="screen-actions";detail.open=draft.expanded===row.id;caption.onfocus=()=>{draft.focus={id:row.id};};caption.append(number,description);detail.append(caption);item.append(detail);
   detail.addEventListener("toggle",()=>{if(!detail.isConnected)return;if(detail.open){draft.expanded=row.id;for(const other of list.querySelectorAll("details"))if(other!==detail)other.open=false;}else if(draft.expanded===row.id)draft.expanded=undefined;});
   const editor=el("div","siv-row-editor");detail.append(editor);
   const field=(part:string,label:string,control:HTMLInputElement|HTMLSelectElement,parent:HTMLElement=editor)=>{
     const wrapper=el("label","screen-text-field",label);control.setAttribute("aria-label",`Action ${index+1} ${part==="target"?"screen":part}`);control.dataset.part=part;wrapper.append(control);parent.append(wrapper);
     if(draft.error?.id===row.id&&draft.error.part===part){const error=el("span","siv-error",draft.error.text);error.id=`${row.id}-error`;error.role="alert";error.dataset.fieldError="";control.setAttribute("aria-invalid","true");control.setAttribute("aria-describedby",error.id);if(parent.classList.contains("siv-payload")){error.style.gridColumn="1 / -1";parent.append(error);}else wrapper.append(error);}
     const rememberFocus=()=>{const input=control.tagName==="INPUT"?control as HTMLInputElement:undefined;draft.focus={id:row.id,part,...(input?{start:input.selectionStart,end:input.selectionEnd}:{})};};
     control.onfocus=rememberFocus;control.onblur=rememberFocus;control.onselect=rememberFocus;
     control.addEventListener(control.tagName==="SELECT"?"change":"input",()=>{
       if(part==="type") {row.type=control.value as Row["type"];if(row.type==="finishInteraction"){draft.rows.splice(index,1);draft.rows.push(row);}if(row.type==="setVariable"&&!row.variableId){row.variableId=variables[0]?.id??"";row.value=variables[0]?variableRaw(variables[0].defaultValue):"";}if((row.type==="showScreen"||row.type==="hideScreen")&&!targets.some(t=>key(t.binding)===key(row.target)))row.target={...targets[0]?.binding??{screenId:"",sourceName:""}};}
       else if(part==="variable"){row.variableId=control.value;const variable=variables.find(v=>v.id===row.variableId);if(variable)row.value=variableRaw(variable.defaultValue);}
       else if(part==="target")row.target={...targets.find(t=>key(t.binding)===control.value)?.binding??row.target};
       else row.value=control.value;
       rememberFocus();update();if(control.tagName==="SELECT")rerender();else {description.textContent=summary(row);section.querySelectorAll("[data-field-error]").forEach(e=>e.remove());section.querySelectorAll("[aria-invalid]").forEach(e=>{e.removeAttribute("aria-invalid");e.removeAttribute("aria-describedby");});}
     });
   };
   const type=select(types,row.type);for(const option of type.options)if(option.value==="finishInteraction"&&draft.rows.some(r=>r!==row&&r.type==="finishInteraction"))option.disabled=true;field("type","Action",type);
   if(row.type==="setVariable") {const payload=el("div","siv-payload");editor.append(payload);field("variable","Variable",select(variables.map(v=>[v.id,`${variableLabel(v)} · ${v.variableType}`]),row.variableId),payload);const variable=variables.find(v=>v.id===row.variableId);const control=variable?.variableType==="bool"?select([["True","True"],["False","False"]],row.value):el("input");control.value=row.value;if(variable?.variableType==="int"&&control.tagName==="INPUT")(control as HTMLInputElement).inputMode="numeric";field("value","Value",control,payload);}
   else if(row.type!=="finishInteraction")field("target","Screen",select(targets.map(t=>[key(t.binding),`${t.binding.sourceName.replaceAll("_"," ")} · Panel`]),key(row.target)));
   else editor.append(el("p","siv-help","Resume Story after this dialog. Always last."));
   const tools=el("div","siv-row-tools");
   for(const [operation,label,symbol,disabled] of [["up","earlier","↑",index===0||row.type==="finishInteraction"],["down","later","↓",index===draft.rows.length-1||row.type==="finishInteraction"||draft.rows[index+1]?.type==="finishInteraction"],["remove","","×",false]] as const){const button=el("button","button",symbol);button.type="button";button.dataset.action=operation;button.setAttribute("aria-label",operation==="remove"?`Remove action ${index+1}`:`Move action ${index+1} ${label}`);button.onfocus=()=>{draft.focus={id:row.id,operation};};button.title=operation==="remove"?"Remove action":`Move ${label}`;button.disabled=disabled;button.onclick=()=>{
     let destinationId:string|undefined=row.id;
     if(operation==="remove"){draft.rows.splice(index,1);destinationId=draft.rows[Math.min(index,draft.rows.length-1)]?.id;}
     else {const destination=index+(operation==="up"?-1:1);[draft.rows[index],draft.rows[destination]]=[draft.rows[destination]!,row];}
     update();rerender();const destination=destinationId?section.querySelector<HTMLElement>(`li[data-row-id="${destinationId}"] summary`):section.querySelector<HTMLElement>(".siv-add");destination?.focus({preventScroll:true});destination?.scrollIntoView({block:"nearest"});
   };tools.append(button);}
   item.append(tools);list.append(item);
 });
 section.append(el("p","siv-help","Runs in this order during play. Finish stays last."));
 add.onchange=()=>{if(!add.value||draft.rows.length>=8)return;const row:Row={id:`screen-action-${++sequence}`,type:add.value as Row["type"],variableId:variables[0]?.id??"",value:variables[0]?variableRaw(variables[0].defaultValue):"",target:{...targets[0]?.binding??{screenId:"",sourceName:""}}};const finishAt=draft.rows.findIndex(r=>r.type==="finishInteraction");draft.rows.splice(finishAt<0?draft.rows.length:finishAt,0,row);draft.expanded=row.id;update();rerender();const item=section.querySelector<HTMLElement>(`li[data-row-id="${row.id}"]`),control=item?.querySelector<HTMLElement>('[data-part="variable"]')??item?.querySelector<HTMLElement>('[data-part="target"]')??item?.querySelector<HTMLElement>('[data-part="type"]');control?.focus({preventScroll:true});(control?.parentElement??item)?.scrollIntoView({block:"nearest"});};
 restoreActionFocus(section,draft);
}

export function restoreActionFocus(section:HTMLElement,draft:ActionDraft):void {
 const focus=draft.focus;if(!focus)return;
 const item=section.querySelector<HTMLElement>(`li[data-row-id="${focus.id}"]`);
 let control=focus.part?item?.querySelector<HTMLElement>(`[data-part="${focus.part}"]`):focus.operation?item?.querySelector<HTMLElement>(`[data-action="${focus.operation}"]`):item?.querySelector<HTMLElement>("summary");
 if(control?.matches(":disabled"))control=item?.querySelector<HTMLElement>("summary");
 control?.focus({preventScroll:true});
 if(control?.tagName==="INPUT"&&focus.start!=null&&focus.end!=null)(control as HTMLInputElement).setSelectionRange(focus.start,focus.end);
}
