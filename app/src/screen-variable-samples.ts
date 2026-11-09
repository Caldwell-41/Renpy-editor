import { variableLabel, variableRaw, variableValue, type ScreenVariable } from "./screen-interactions.ts";
import type { VariableSample } from "./screen-contracts.ts";
interface Sample {raw:string;valid:VariableSample;error?:string}
const el=<K extends keyof HTMLElementTagNameMap>(tag:K,className="",text="")=>{const n=document.createElement(tag);n.className=className;n.textContent=text;return n;};
/** Editor-only values. They never join a source draft or invoke an action. */
export class ScreenVariableSamples {
 private readonly samples=new Map<string,Sample>();
 private variables:ScreenVariable[]=[];
 private open=false;
 readonly element=el("div");
 constructor(private readonly changed:()=>void){}
 update(variables:ScreenVariable[]):void {this.variables=variables;this.render();}
 payload():{stale:boolean;values:VariableSample[]} {
  return {stale:[...this.samples].some(([id,sample])=>this.variables.find(v=>v.id===id)?.source.sourceRevision!==sample.valid.expectedSourceRevision),values:[...this.samples.values()].map(s=>s.valid)};
 }
 private render():void {
  this.element.replaceChildren();if(!this.variables.length&&!this.samples.size)return;
  const toggle=el("button","button secondary siv-sample-toggle","Sample values");toggle.type="button";toggle.setAttribute("aria-expanded",String(this.open));
  const markOverrides=()=>{const count=this.samples.size;toggle.textContent=`Sample values${count?` (${count} override${count===1?"":"s"})`:""}`;};markOverrides();
  const panel=el("section","siv-samples");panel.hidden=!this.open;panel.setAttribute("aria-label","Editor-only samples");panel.append(el("h3","","Editor-only samples"),el("p","siv-help","Only the canvas changes. Source and game values stay separate."));
  toggle.onclick=()=>{this.open=!this.open;panel.hidden=!this.open;toggle.setAttribute("aria-expanded",String(this.open));};
  for(const variable of this.variables){
   const label=el("label","screen-text-field",`${variableLabel(variable)} · ${variable.variableType}`),input=variable.variableType==="bool"?el("select"):el("input");
   input.setAttribute("aria-label",`Sample ${variable.technicalName}`);
   if(input.tagName==="SELECT")for(const value of ["True","False"]){const option=el("option","",value);option.value=value;input.append(option);}
   else (input as HTMLInputElement).inputMode=variable.variableType==="int"?"numeric":variable.variableType==="decimal"?"decimal":"text";
   input.value=this.samples.get(variable.id)?.raw??variableRaw(variable.defaultValue);
   const error=el("span","siv-sample-error");error.id=`sample-${variable.id}-error`;error.role="alert";
   const feedback=()=>{const state=this.samples.get(variable.id);error.textContent=state?.error??"";error.hidden=!state?.error;if(state?.error){input.setAttribute("aria-invalid","true");input.setAttribute("aria-describedby",error.id);}else {input.removeAttribute("aria-invalid");input.removeAttribute("aria-describedby");}};
   input.addEventListener(input.tagName==="SELECT"?"change":"input",()=>{
    const previous=this.samples.get(variable.id);
    try{const value=variableValue(variable,input.value);this.samples.set(variable.id,{raw:input.value,valid:{variableId:variable.id,expectedSourceRevision:variable.source.sourceRevision,value}});feedback();this.changed();}
    catch{this.samples.set(variable.id,{raw:input.value,valid:previous?.valid??{variableId:variable.id,expectedSourceRevision:variable.source.sourceRevision,value:variable.defaultValue},error:variable.variableType==="decimal"?"Enter a finite decimal. The canvas keeps the last valid sample.":"Use a whole number in the signed 64-bit range. The canvas keeps the last valid sample."});feedback();}
    markOverrides();
   });feedback();label.append(input,error);panel.append(label);
  }
  for(const [id,sample]of this.samples)if(!this.variables.some(v=>v.id===id))panel.append(el("p","siv-sample-error",`Sample variable unavailable. Input retained: ${sample.raw}`));
  if(this.payload().stale)panel.append(el("p","siv-sample-error","Samples use an earlier variable revision. Edit a sample or reset samples to update the canvas."));
  const reset=el("button","button secondary","Reset samples");reset.type="button";reset.onclick=()=>{this.samples.clear();this.render();this.changed();};panel.append(reset);this.element.append(toggle,panel);
 }
}
