import { formulaCompletionRange } from "./formula-editing.ts";
// Approved A2 presentation. Core owns arithmetic parsing, types and evaluation.
import type { ScreenVariable, ActionDraft } from "./screen-interactions.ts";
import type { ScreenActionAssignment, ScreenArithmeticInspection } from "./screen-contracts.ts";
import { assignmentOperations } from "./story-arithmetic-editor.ts";
const el = <K extends keyof HTMLElementTagNameMap>(tag:K, cls="", text="") => { const n=document.createElement(tag); n.className=cls; n.textContent=text; return n; };
const action=(text:string,run:()=>void)=>{const b=el("button","button",text);b.type="button";b.onclick=run;return b;};
type Row=ActionDraft["rows"][number];
interface Options {
 variables:readonly ScreenVariable[];
 capabilities?:ScreenArithmeticInspection["actionCapabilities"];
 inspect?:()=>Promise<{assignment:ScreenActionAssignment|null;capabilities?:ScreenArithmeticInspection["actionCapabilities"]}>;
 changed:()=>void;
}
export function screenArithmeticEditor(row:Row,index:number,options:Options){
  const section=el('div','siv-numeric');
  const target=options.variables.find(v=>v.id===row.variableId)!;
  const labels:Record<string,string>={multiply:"Multiply",divide:"Divide",floorDivide:"Floor divide",remainder:"Remainder"};
  const operations=assignmentOperations.map(op=>({...op,label:labels[op.key]??op.label})).filter(op=>!options.capabilities||options.capabilities.operations.includes(op.key));
  let operationKey=row.arithmetic?.operation??'assign';
  const equation=el('div','siv-equation');equation.role='group';equation.setAttribute("aria-label",`Action ${index+1} calculation`);
  const name=el('span','siv-target',target.technicalName);
  const operation=el('button','button siv-operation');operation.type='button';operation.setAttribute('aria-haspopup','menu');operation.setAttribute('aria-expanded','false');
  const menu=el('div','siv-operation-menu');menu.role='menu';menu.setAttribute("aria-label",`Action ${index+1} operations`);menu.hidden=true;menu.setAttribute('popover','manual');
  const formula=el('input','siv-formula');formula.value=row.value;formula.setAttribute("aria-label",`Action ${index+1} formula`);formula.dataset.part='value';formula.dataset.formula=String(row.id);formula.autocomplete='off';formula.spellcheck=false;formula.placeholder='Number or formula';formula.role='combobox';formula.setAttribute('aria-autocomplete','list');formula.setAttribute('aria-expanded','false');
  const suggestions=el('div','siv-suggestions');suggestions.role='listbox';suggestions.setAttribute("aria-label",`Action ${index+1} variable suggestions`);suggestions.id=`siv-suggestions-${row.id}`;suggestions.hidden=true;suggestions.setAttribute('popover','manual');formula.setAttribute('aria-controls',suggestions.id);
  const feedback=el('div','siv-feedback');feedback.id=`siv-result-${row.id}`;feedback.ariaLive='off';formula.setAttribute('aria-describedby',feedback.id);
  const group=action('( )',()=>{const start=formula.selectionStart??0,end=formula.selectionEnd??start;formula.setRangeText(`(${formula.value.slice(start,end)})`,start,end,'select');row.value=formula.value;update();formula.focus();});group.setAttribute("aria-label",`Group action ${index+1} selection`);group.title='Group the selected formula';
  const hint=el('div','siv-formula-hint');hint.append(el('span','','Numbers, variables and parentheses'),group);
  let active=0,composing=false,showErrors=false;
  const closeSuggestions=()=>{if(suggestions.hidePopover && suggestions.matches(':popover-open'))suggestions.hidePopover();suggestions.hidden=true;formula.setAttribute('aria-expanded','false');formula.removeAttribute('aria-activedescendant');};
  const closeMenu=()=>{if(menu.hidePopover && menu.matches(':popover-open'))menu.hidePopover();menu.hidden=true;operation.setAttribute('aria-expanded','false');};
  function showPopup(popup:HTMLElement,height:number){
    const box=equation.getBoundingClientRect(),below=window.innerHeight-box.bottom-10,above=box.top-10;
    const useBelow=below>=height||below>=above,room=useBelow?below:above;
    const size=Math.min(height,Math.max(80,room));
    Object.assign(popup.style,{left:`${Math.max(8,box.left)}px`,top:`${useBelow?box.bottom+4:Math.max(8,box.top-size-4)}px`,width:`${Math.min(box.width,window.innerWidth-16)}px`,maxHeight:`${size}px`});
    popup.hidden=false;if(popup.showPopover && !popup.matches(':popover-open'))popup.showPopover();
  }

  function suggest(){
    const range=formulaCompletionRange(formula),prefix=range.prefix,matches=prefix||range.selected?options.variables.filter(v=>['int','decimal'].includes(v.variableType)&&v.technicalName.startsWith(prefix)&&v.technicalName!==prefix):[];
    suggestions.replaceChildren();active=0;
    matches.forEach((v,i)=>{const variable=v.technicalName,type=v.variableType;
      const item=action('',()=>{
        formula.setRangeText(variable,range.start,range.end,'end');formula.setSelectionRange(range.start+variable.length,range.start+variable.length);row.value=formula.value;closeSuggestions();update();formula.focus();
      });item.role='option';item.id=`siv-suggest-${row.id}-${i}`;item.setAttribute('aria-selected',String(i===0));item.tabIndex=-1;item.append(el('span','siv-variable-name',variable),el('small','',type));item.onmousedown=e=>e.preventDefault();suggestions.append(item);
    });
    if(matches.length)showPopup(suggestions,matches.length*36+8);else closeSuggestions();formula.setAttribute('aria-expanded',String(!!matches.length));
    if(matches.length)formula.setAttribute('aria-activedescendant',suggestions.children[0]!.id);else formula.removeAttribute('aria-activedescendant');
  }
  let generation=0,timer:ReturnType<typeof setTimeout>|undefined;
  function update(changed=true){
    const op=operations.find(op=>op.key===operationKey)!;
    operation.textContent=`${op.symbol} ▾`;operation.setAttribute("aria-label",`Action ${index+1} operation: ${op.label}`);
    for(const item of menu.querySelectorAll<HTMLElement>('[role=menuitemradio]'))item.setAttribute('aria-checked',String(item.dataset.operation===operationKey));
    if(changed){row.arithmetic={operation:operationKey,operand:row.value};options.changed();}
    const own=++generation;clearTimeout(timer);if(composing||(!formula.value&&!showErrors))return;feedback.textContent='Checking formula…';formula.removeAttribute('aria-invalid');
    timer=setTimeout(async()=>{
      if(!section.isConnected||!section.closest('details[open]'))return;
      try{
        const result=await options.inspect?.();if(own!==generation||!section.isConnected)return;
        feedback.replaceChildren();
        if(!result){feedback.textContent='Apply validates through core.';return;}
        const a=result.assignment;feedback.title='Calculations read current values when each action runs. Declaration defaults are not current route values.';
        if(a?.inferredResultType)feedback.append(el('p','',`Gives a ${a.inferredResultType==='int'?'whole number':'decimal'}${target.variableType==='decimal'&&a.inferredResultType==='int'?', stored as a decimal':''}.`));
        if(a?.state.status==='known')feedback.append(el('p','',`Draft result ${String(a.state.value)}`));
        else if(a?.state.status==='unknown')feedback.append(el('p','','Current value unknown.'));
        for(const d of a?.diagnostics??[])if(d.reason!=='unobservedCurrentValue')feedback.append(el('p','',d.reason.replace(/([A-Z])/g,' $1').toLowerCase()));
        if(result.capabilities)feedback.title=`Core limits: ${result.capabilities.maxBytes} bytes, ${result.capabilities.maxNodes} nodes, depth ${result.capabilities.maxDepth}. Operators: ${result.capabilities.operators.join(' ')}`;
      }catch(error){if(own!==generation||!section.isConnected)return;const {code,actionIndex} = error as {code?:string;actionIndex?:number};if(actionIndex!==undefined&&actionIndex!==index){feedback.textContent='Another action needs correction. Apply reveals that field.';return;}const invalid=code?.includes('ARITHMETIC')??false;if(invalid&&!showErrors){feedback.textContent='Enter a number or formula.';return;}feedback.textContent=code==='ARITHMETIC_TARGET_TYPE'?'Decimal result. Choose a decimal variable or a whole-number formula. Division always gives a decimal. Input retained.':`${error instanceof Error?error.message:'Validation unavailable.'} Input retained.`;if(invalid)formula.setAttribute('aria-invalid','true');}
    },120);
  }
  const example:Record<string,string>={'=':'Replace the current value','+=':'Increase by this amount','-=':'Decrease by this amount','*=':'Multiply by this amount','/=':'Divide, keeping decimals','//=':'Divide and round down','%=':'Keep the remainder'};
  for(const {key,symbol,label} of operations){
    const item=action('',()=>{operationKey=key;closeMenu();update();formula.focus();});item.role='menuitemradio';item.setAttribute('aria-label',label);item.dataset.operation=key;item.setAttribute('aria-checked',String(key===operationKey));item.append(el('span','siv-operation-symbol',symbol));
    const words=el('span','siv-operation-words');words.append(el('strong','',label),el('small','',example[symbol]??''));item.append(words);menu.append(item);
  }
  operation.onclick=()=>{closeSuggestions();const opening=menu.hidden;if(opening){showPopup(menu,344);operation.setAttribute('aria-expanded','true');menu.querySelector<HTMLElement>('[aria-checked=true]')?.focus();}else closeMenu();};
  operation.onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();if(menu.hidden)operation.click();}};
  menu.onkeydown=e=>{
    const items=[...menu.querySelectorAll<HTMLElement>('[role=menuitemradio]')],at=items.indexOf(document.activeElement as HTMLElement);
    e.stopPropagation();if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?items.length-1:(at+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next]?.focus();}
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeMenu();operation.focus();}
    if(e.key==='Enter'||e.key===' '){e.preventDefault();items[at]?.click();}if(e.key==='Tab')closeMenu();
  };
  formula.addEventListener('keydown',e=>{
    if(composing||e.isComposing||e.keyCode===229){e.stopPropagation();return;}
    if(suggestions.hidden)return;e.stopPropagation();
    if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();const items=[...suggestions.children] as HTMLElement[];active=(active+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items.forEach((item,i)=>item.setAttribute('aria-selected',String(i===active)));formula.setAttribute('aria-activedescendant',items[active]!.id);}
    else if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();(suggestions.children[active] as HTMLElement)?.click();}
    else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeSuggestions();}
  });
  formula.addEventListener('compositionstart',()=>{composing=true;generation++;clearTimeout(timer);closeSuggestions();});
  formula.addEventListener('compositionend',()=>{composing=false;row.value=formula.value;update();});
  formula.oninput=()=>{showErrors=formula.getAttribute('aria-invalid')==='true';feedback.ariaLive='off';row.value=formula.value;update();if(!composing)suggest();};formula.onfocus=()=>{closeMenu();suggest();};formula.onblur=()=>{closeSuggestions();if(!composing){showErrors=true;feedback.ariaLive='polite';update(false);}};
  section.addEventListener('siv-inspect',()=>{showErrors ||= formula.getAttribute('aria-invalid')==='true';update(false);});
  section.addEventListener('focusout',()=>queueMicrotask(()=>{if(!section.contains(document.activeElement))closeMenu();}));
  equation.append(name,operation,formula,menu,suggestions);
  const calculation=el('div','siv-calculation');calculation.append(el('span','lp-label','Calculation'),equation);
  section.append(calculation,feedback,hint);update(false);return section;
}
