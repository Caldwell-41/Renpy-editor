import type {LabContext} from '../../contracts.ts';
import {labPage,element as el,action,labelled} from '../../page.ts';
import {select,decimalInput} from './controls.ts';
import '../../../src/ui-refresh.css';
export function mountDecimals(host:HTMLElement,context:LabContext,variant:string){
  const frame=labPage(host,context,{screen:'variables',title:context.state==='condition'?'Numeric condition':'Variables',subtitle:''});
  frame.heading.querySelector('p')?.remove();frame.shell.classList.add('sa-decimals');host.dataset.arithmeticVariant=variant;
  frame.shell.querySelector('.lp-sample')!.textContent='Decimal controls · Draft';
  frame.shell.querySelector('.lp-fiction')!.textContent='Browser mock · Fictional definitions';
  const definitions=[{name:'money',type:'decimal',value:'1.25'},{name:'trust',type:'int',value:'5'},{name:'help_seen',type:'bool',value:'false'},{name:'destination',type:'string',value:'North pier'}];
  const labels:Record<string,string>={decimal:'Decimal',int:'Whole number',bool:'Boolean',string:'Text'};
  let selected='money',creating=false,name='',type='decimal',value='0.0',conditionValue='1.25',conditionVariable='money',conditionOp='>=';
  const drafts=new Map<string,string>();
  const workspace=el('div',`sa-decimal-workspace sa-decimal-${variant}`),list=el('div','sa-definition-list'),editor=el('div','sa-definition-editor');workspace.append(list,editor);frame.content.append(workspace);
  // Keep sample navigation inside this prototype rather than opening other mocks.
  frame.shell.addEventListener('click',event=>{if((event.target as HTMLElement).closest('.lp-navigation,.brand,.lp-studio-link,.lp-runtime-link')){event.preventDefault();event.stopImmediatePropagation();frame.status.textContent='Only the decimal control comparison is active.';}},{capture:true});
  const newButton=action('New variable',()=>{creating=true;name='';type='decimal';value='0.0';render();editor.querySelector<HTMLInputElement>('[aria-label="Technical name"]')?.focus();},true);frame.tools.append(newButton);
  function render(){list.replaceChildren();editor.replaceChildren();
    for(const d of definitions){const b=action(`${d.name}    ${labels[d.type]}    ${d.value}${drafts.has(d.name)?' · Draft':''}`,()=>{creating=false;selected=d.name;render();});if(variant==='equation-v2')b.replaceChildren(el('span','sa2-definition-name',d.name),el('span','sa2-definition-type',labels[d.type]),el('span','sa2-definition-value',d.value));b.ariaLabel=`Edit ${d.name} default`;b.className='sa-definition';b.ariaPressed=String(!creating&&selected===d.name);list.append(b);}
    list.append(el('p','sa-bar-note','Bars accept Whole number variables only. Decimal variables do not appear in the bar picker.'));
    if(context.state==='condition'){list.hidden=true;workspace.classList.add('sa-condition-workspace');renderCondition();return;}
    const d=definitions.find(d=>d.name===selected)!;
    const heading=el('h2','',creating?'New variable':`${d.name} · ${labels[d.type]}`);editor.append(heading);
    if(creating){
      const input=el('input');input.ariaLabel='Technical name';input.value=name;input.oninput=()=>name=input.value;
      const picker=select('Variable type',[['bool','Boolean'],['int','Whole number'],['decimal','Decimal'],['string','Text']],type);picker.onchange=()=>{type=picker.value;value=type==='bool'?'false':type==='string'?'':'0';render();};
      editor.append(labelled('Technical name',input),labelled('Type',picker));
    }else editor.append(el('p','','Name and type are fixed. You can edit the default.'));
    const t=creating?type:d.type;
    const input=t==='bool'?select('Default value',[['false','False'],['true','True']],creating?value:drafts.get(d.name)??d.value):el('input');
    input.ariaLabel='Default value';input.value=creating?value:drafts.get(d.name)??d.value;
    if(input instanceof HTMLInputElement&&['decimal','int'].includes(t))input.inputMode=t==='decimal'?'decimal':'text';
    const error=el('p','sa-diagnostic');error.id='sa-default-feedback';error.ariaLive='polite';input.setAttribute('aria-describedby',error.id);
    const check=()=>t==='decimal'?!decimalInput(input.value)?'Enter a finite decimal such as -2.5 or 1.25.':undefined:t==='int'?!/^[+-]?\d+$/.test(input.value)?'Whole numbers cannot contain a decimal point.':BigInt(input.value)<-9223372036854775808n||BigInt(input.value)>9223372036854775807n?'Outside the signed 64-bit whole-number range.':undefined:undefined;
    const update=()=>{if(creating)value=input.value;else drafts.set(d.name,input.value);const invalid=check();error.textContent=invalid??(t==='decimal'?'Decimal default. Whole-number input is also accepted.':t==='int'?'Exact whole-number text. No decimal rounding.':'');if(invalid)input.setAttribute('aria-invalid','true');else input.removeAttribute('aria-invalid');};
    input.addEventListener('input',update);input.addEventListener('change',update);
    if(variant==='sequence-v1'){editor.append(el('p','sa-type-note',`${labels[t]} default`));}
    editor.append(labelled('Default value',input),error);
    const buttons=el('div','sa-footer');buttons.append(action(creating?'Create variable':'Save default',()=>{
      if(creating&&(!/^[a-z_][a-z_0-9]*$/.test(name)||definitions.some(d=>d.name===name))){frame.status.textContent='Use a unique lowercase technical name.';editor.querySelector<HTMLInputElement>('[aria-label="Technical name"]')?.focus();return;}
      update();if(check()){input.focus();frame.status.textContent='Correct the default. Your draft is retained.';return;}
      if(creating){definitions.push({name,type,value:input.value});selected=name;creating=false;}else{d.value=input.value;drafts.delete(d.name);}render();frame.status.textContent='Default saved in browser memory.';
    },true),action('Cancel',()=>cancel()));editor.append(buttons);
    if(variant==='expanded-v1'){const source=el('div','sa-definition-source');source.append(el('h3','','Declaration preview'),el('code','',`default ${creating?name||'variable':d.name} = ${input.value}`),el('p','','Illustrative text only. No source is written.'));editor.append(source);}
    update();if(!creating&&input.value===d.value)drafts.delete(d.name);
  }
  function cancel(){const dialog=el('dialog','sa-dialog');dialog.ariaLabel='Discard default draft?';const keep=action('Keep editing',()=>dialog.close());dialog.append(el('h2','','Discard default draft?'),keep,action('Discard draft',()=>{drafts.delete(selected);creating=false;dialog.close();render();newButton.focus();}));dialog.oncancel=e=>{e.preventDefault();dialog.close();};dialog.onclose=()=>{dialog.remove();editor.querySelector<HTMLElement>('[aria-label="Default value"]')?.focus();};frame.shell.append(dialog);dialog.showModal();keep.focus();}
  function renderCondition(){
    newButton.hidden=true;
    const variable=select('Condition variable',[['money','money · Decimal'],['trust','trust · Whole number']],conditionVariable);
    const op=select('Comparison',[['==','equals'],['!=','does not equal'],['<','less than'],['<=','at most'],['>','greater than'],['>=','at least']],conditionOp);
    const number=el('input');number.ariaLabel='Condition number';number.inputMode='decimal';number.value=conditionValue;
    const feedback=el('p','sa-diagnostic');feedback.id='sa-condition-feedback';feedback.ariaLive='polite';number.setAttribute('aria-describedby',feedback.id);
    const comparison=el('div','sa-condition-fields');comparison.append(labelled('Variable',variable),labelled('Comparison',op),labelled('Number',number));
    const summary=el('output','sa-condition-summary');summary.ariaLabel='Condition summary';
    const update=()=>{conditionVariable=variable.value;conditionOp=op.value;conditionValue=number.value;const valid=decimalInput(conditionValue);number.setAttribute('aria-invalid',String(!valid));feedback.textContent=valid?'Numeric comparison. Decimal thresholds are allowed for either numeric type. No rounding.':'Finish the number. Your condition draft is retained.';summary.textContent=`${conditionVariable} ${conditionOp} ${conditionValue}`;};
    variable.onchange=update;op.onchange=update;number.oninput=update;
    editor.append(el('h2','','Only when'),comparison,feedback,summary,el('p','','The current value is unknown. This editor does not decide which branch will run.'),action('Apply condition',()=>{update();if(!decimalInput(conditionValue)){number.focus();return;}frame.status.textContent='Condition applied in browser memory.';},true));update();
  }
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!frame.shell.querySelector('dialog[open]')){e.preventDefault();cancel();}};frame.shell.addEventListener('keydown',key);render();
  return()=>frame.shell.removeEventListener('keydown',key);
}
