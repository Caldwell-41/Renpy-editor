// A2 presentation follows Story Combined v1. Diagnostics remain named fixtures.
import {element as el,action,labelled} from '../../page.ts';
import type {Row} from './controls.ts';
interface Options {
  variables:readonly (readonly [string,string])[];
  operations:readonly (readonly [string,string])[];
  feedback:(row:Row)=>{type?:string;error?:string};
  changed:()=>void;
}
export function refinedEditor(row:Row,index:number,options:Options){
  const section=el('div','sa-fields sa2-fields');
  if(row.kind!=='set'){
    section.append(el('p','',row.kind==='finish'?'Close this dialog and resume Story. Finish is always last.':'About · Qualified panel'));
    return section;
  }
  const target=el('select');target.ariaLabel=`Action ${index+1} variable`;target.dataset.target=String(row.id);
  for(const [name,type]of options.variables){const o=el('option','',`${name} · ${type}`);o.value=name;target.append(o);}target.value=row.target;
  const equation=el('div','sa2-equation');equation.role='group';equation.ariaLabel=`Action ${index+1} calculation`;
  const name=el('span','sa2-target',row.target);
  const operation=el('button','button sa2-operation');operation.type='button';operation.setAttribute('aria-haspopup','menu');operation.setAttribute('aria-expanded','false');
  const menu=el('div','sa2-operation-menu');menu.role='menu';menu.ariaLabel=`Action ${index+1} operations`;menu.hidden=true;menu.setAttribute('popover','manual');
  const formula=el('input','sa2-formula');formula.value=row.formula;formula.ariaLabel=`Action ${index+1} formula`;formula.dataset.formula=String(row.id);formula.autocomplete='off';formula.spellcheck=false;formula.placeholder='Number or formula';formula.role='combobox';formula.setAttribute('aria-autocomplete','list');formula.setAttribute('aria-expanded','false');
  const suggestions=el('div','sa2-suggestions');suggestions.role='listbox';suggestions.ariaLabel=`Action ${index+1} variable suggestions`;suggestions.id=`sa2-suggestions-${row.id}`;suggestions.hidden=true;suggestions.setAttribute('popover','manual');formula.setAttribute('aria-controls',suggestions.id);
  const feedback=el('div','sa-diagnostic sa2-feedback');feedback.id=`sa2-result-${row.id}`;feedback.ariaLive='polite';formula.setAttribute('aria-describedby',feedback.id);
  const group=action('( )',()=>{const start=formula.selectionStart??0,end=formula.selectionEnd??start;formula.setRangeText(`(${formula.value.slice(start,end)})`,start,end,'select');row.formula=formula.value;update();formula.focus();});group.ariaLabel=`Group action ${index+1} selection`;group.title='Group the selected formula';
  const hint=el('div','sa2-formula-hint');hint.append(el('span','','Numbers, variables and parentheses'),group);
  let active=0;
  const closeSuggestions=()=>{if(suggestions.matches(':popover-open'))suggestions.hidePopover();suggestions.hidden=true;formula.setAttribute('aria-expanded','false');formula.removeAttribute('aria-activedescendant');};
  const closeMenu=()=>{if(menu.matches(':popover-open'))menu.hidePopover();menu.hidden=true;operation.setAttribute('aria-expanded','false');};
  function showPopup(popup:HTMLElement,height:number){
    const box=equation.getBoundingClientRect(),below=innerHeight-box.bottom-10,above=box.top-10;
    const useBelow=below>=height||below>=above,room=useBelow?below:above;
    const size=Math.min(height,Math.max(80,room));
    Object.assign(popup.style,{left:`${Math.max(8,box.left)}px`,top:`${useBelow?box.bottom+4:Math.max(8,box.top-size-4)}px`,width:`${Math.min(box.width,innerWidth-16)}px`,maxHeight:`${size}px`});
    popup.hidden=false;if(!popup.matches(':popover-open'))popup.showPopover();
  }
  const fragment=()=>formula.value.slice(0,formula.selectionStart??formula.value.length).match(/[A-Za-z_][A-Za-z_0-9]*$/)?.[0]??'';
  function suggest(){
    const prefix=fragment(),matches=prefix?options.variables.filter(([v])=>v.startsWith(prefix)&&v!==prefix):[];
    suggestions.replaceChildren();active=0;
    matches.forEach(([variable,type],i)=>{
      const item=action('',()=>{
        const start=formula.selectionStart??formula.value.length;formula.setRangeText(variable,start-prefix.length,formula.selectionEnd??start,'end');row.formula=formula.value;closeSuggestions();update();formula.focus();
      });item.role='option';item.id=`sa2-suggest-${row.id}-${i}`;item.ariaSelected=String(i===0);item.tabIndex=-1;item.append(el('span','sa2-variable-name',variable),el('small','',type));item.onmousedown=e=>e.preventDefault();suggestions.append(item);
    });
    if(matches.length)showPopup(suggestions,matches.length*36+8);else closeSuggestions();formula.setAttribute('aria-expanded',String(!!matches.length));
    if(matches.length)formula.setAttribute('aria-activedescendant',suggestions.children[0]!.id);else formula.removeAttribute('aria-activedescendant');
  }
  function update(){
    name.textContent=row.target;const label=options.operations.find(([op])=>op===row.op)?.[1]??row.op;
    operation.textContent=`${row.op} ▾`;operation.ariaLabel=`Action ${index+1} operation: ${label}`;
    for(const item of menu.querySelectorAll<HTMLElement>('[role=menuitemradio]'))item.setAttribute('aria-checked',String(item.dataset.operation===row.op));
    const result=options.feedback(row);feedback.replaceChildren();feedback.classList.toggle('sa-error',!!result.error);
    if(result.error){
      formula.setAttribute('aria-invalid','true');
      const title=result.error.startsWith('Decimal result.')?'Decimal result':result.error.includes('zero')?'Divides by zero':result.error.includes('not declared')?'Unknown variable':'Check the formula';
      feedback.append(el('strong','',title),el('p','',result.error.replace(/^Decimal result\. /,'')));
    }else{
      formula.removeAttribute('aria-invalid');
      const type=options.variables.find(([v])=>v===row.target)?.[1];
      feedback.append(el('p','',`Gives a ${result.type==='Decimal'?'decimal':'whole number'}${type==='Decimal'&&result.type==='Whole number'?', stored as a decimal':''}.`));
    }
    options.changed();
  }
  const example:Record<string,string>={'=':'Replace the current value','+=':'Increase by this amount','-=':'Decrease by this amount','*=':'Multiply by this amount','/=':'Divide, keeping decimals','//=':'Divide and round down','%=':'Keep the remainder'};
  for(const [symbol,label]of options.operations){
    const item=action('',()=>{row.op=symbol;closeMenu();update();formula.focus();});item.role='menuitemradio';item.dataset.operation=symbol;item.setAttribute('aria-checked',String(symbol===row.op));item.append(el('span','sa2-operation-symbol',symbol));
    const words=el('span','sa2-operation-words');words.append(el('strong','',label),el('small','',example[symbol]??''));item.append(words);menu.append(item);
  }
  operation.onclick=()=>{closeSuggestions();const opening=menu.hidden;if(opening){showPopup(menu,344);operation.setAttribute('aria-expanded','true');menu.querySelector<HTMLElement>('[aria-checked=true]')?.focus();}else closeMenu();};
  operation.onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();if(menu.hidden)operation.click();}};
  menu.onkeydown=e=>{
    const items=[...menu.querySelectorAll<HTMLElement>('[role=menuitemradio]')],at=items.indexOf(document.activeElement as HTMLElement);
    if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?items.length-1:(at+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next]?.focus();}
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeMenu();operation.focus();}
    if(e.key==='Tab')closeMenu();
  };
  formula.addEventListener('keydown',e=>{
    if(suggestions.hidden)return;
    if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();const items=[...suggestions.children] as HTMLElement[];active=(active+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items.forEach((item,i)=>item.ariaSelected=String(i===active));formula.setAttribute('aria-activedescendant',items[active]!.id);}
    else if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();(suggestions.children[active] as HTMLElement)?.click();}
    else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeSuggestions();}
  });
  formula.oninput=()=>{row.formula=formula.value;update();suggest();};formula.onfocus=()=>{closeMenu();suggest();};formula.onblur=()=>closeSuggestions();
  target.onchange=()=>{row.target=target.value;update();};
  section.addEventListener('focusout',()=>queueMicrotask(()=>{if(!section.contains(document.activeElement))closeMenu();}));
  equation.append(name,operation,formula,menu,suggestions);
  const calculation=el('div','sa2-calculation');calculation.append(el('span','lp-label','Calculation'),equation);
  section.append(labelled('Variable',target),calculation,feedback,hint);update();return section;
}
