import type {LabContext} from '../../contracts.ts';
import {element as el,action,labelled} from '../../page.ts';
import {refinedEditor} from './refined-editor.ts';
export const operations=[['=','Set to'],['+=','Add'],['-=','Subtract'],['*=','Multiply'],['/=','Divide'],['//=','Floor divide'],['%=','Remainder']] as const;
export const vars=[['trust','Whole number'],['reward','Whole number'],['bonus','Whole number'],['money','Decimal'],['price','Decimal']] as const;
const types:Record<string,string>=Object.fromEntries(vars);
export function select(label:string,options:readonly (readonly [string,string])[],value:string){const s=el('select');s.ariaLabel=label;for(const [id,name]of options){const o=el('option','',name);o.value=id;s.append(o);}s.value=value;return s;}
export type Row={id:number;kind:string;target:string;op:string;formula:string};
// Named response fixtures, not a parser, type checker or evaluator. Unlisted
// formula text stays a draft. Real admission and numeric semantics belong to core.
function feedback(row:Row):{type?:string;error?:string;note?:string}{
  if(row.kind!=='set')return {};
  const text=row.formula.trim();
  const errors:Record<string,string>={
    'trust +':'Enter a number or variable after +.', 'ghost + 1':'Variable "ghost" is not declared.',
    'help_seen + 1':'Boolean values cannot be used in arithmetic.', 'price / 0':'The divisor is zero.',
    '2 ** 3':'Powers are not supported. Use +, -, *, /, // or %.',
    'round(price)':'Function calls stay in Source.', '1e309':'The result is not finite.',
    '9223372036854775808':'The result exceeds the whole-number range.',
  };
  if(errors[text])return {error:errors[text]};
  const decimal=['price','money','price / 2','1.25','2.5','0.5','trust / 2','price // 2'].includes(text)||row.op==='/='||types[row.target]==='Decimal'&&row.op!=='=';
  const known=['1','2','0','-1','-5 // 2','-5 % 2','trust','bonus','trust * 2','trust + bonus * 2','(trust + bonus) * 2','price','money','price / 2','1.25','2.5','0.5','trust / 2','trust // 2','price // 2','9223372036854775807'];
  if(!known.includes(text))return {error:'No response fixture for this formula. Your draft is retained.'};
  if(['/=','//=','%='].includes(row.op)&&text==='0')return {error:'The divisor is zero.'};
  if(decimal&&types[row.target]==='Whole number')return {error:'Decimal result. Choose a Decimal target, or use // with whole-number operands. Nothing is rounded.'};
  return {type:decimal?'Decimal':'Whole number',note:row.op==='='?'Reads variables when this action runs.':'Uses the target and formula values when this action runs.'};
}
export function mountControls(root:HTMLElement,context:LabContext,variant:string){
  const refined=variant==='equation-v2';
  let nextId=10,selected='continue',expanded=1,message='',contextKind='dialog';
  const initial=():Row[]=>[
    {id:1,kind:'set',target:['decimal','unknown'].includes(context.state)?'money':'trust',op:context.state==='decimal'?'/=':'+=',formula:context.state==='decimal'?'2':context.state==='unknown'?'price':context.state==='invalid'?'trust +':'1'},
    {id:2,kind:'set',target:'reward',op:'=',formula:'trust * 2'},
    {id:3,kind:'finish',target:'',op:'',formula:''},
  ];
  const saved:Record<string,Row[]>={continue:initial(),reward:[{id:4,kind:'set',target:'money',op:'-=',formula:'price'}]};
  const drafts:Record<string,Row[]>=structuredClone(saved);
  let mode=context.state==='text'?'text':'actions';
  let sample='1.25',savedSample='1.25',text='Balance: [money!q]',savedText=text;
  if(context.state==='limits')while(drafts.continue!.length<8)drafts.continue!.splice(-1,0,{id:++nextId,kind:'set',target:'trust',op:'+=',formula:'1'});
  const title=el('h2','',context.state==='imagebutton'?'Continue imagebutton':'Continue textbutton');
  const tabs=el('div','sa-tabs'),body=el('div','sa-body'),footer=el('div','sa-footer'),status=el('p','sa-message');status.role='status';
  const editContinue=action('Continue',()=>change('continue'));editContinue.ariaLabel='Edit continue button';
  const editReward=action('Reward',()=>change('reward'));editReward.ariaLabel='Edit reward button';
  const editText=action('Text & samples',()=>{mode='text';render();});
  tabs.append(editContinue,editReward,editText);
  const review=el('details','sa2-review');review.append(el('summary','','Review cases'),tabs);
  if(refined)root.append(title,body,footer,status,review);else root.append(title,tabs,body,footer,status);
  // The parent production inspector has its own shortcuts; this experimental
  // editor owns its keys and must not dispatch a literal-only Apply behind it.
  const key=(event:KeyboardEvent)=>{
    event.stopPropagation();
    const step=(event.target as HTMLElement).closest<HTMLElement>('[data-step]');
    if(step&&['ArrowDown','ArrowUp'].includes(event.key)){
      event.preventDefault();const index=rows().findIndex(r=>String(r.id)===step.dataset.step);
      expanded=rows()[Math.max(0,Math.min(rows().length-1,index+(event.key==='ArrowDown'?1:-1)))]!.id;
      render();root.querySelector<HTMLElement>(`[data-step="${expanded}"]`)?.focus();
    }else if(event.key==='Escape'){
      if(root.querySelector('dialog[open]'))return;
      event.preventDefault();confirmCancel();
    }else if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();apply();}
  };root.addEventListener('keydown',key);
  function rows(){return drafts[selected]!;}
  function change(id:string){selected=id;mode='actions';expanded=rows()[0]?.id??0;message='Drafts stay with each button.';render();root.querySelector<HTMLElement>('.sa-step')?.focus();}
  function dirty(){return JSON.stringify(rows())!==JSON.stringify(saved[selected]);}
  function note(text:string){message=text;status.textContent=text;}
  function confirmCancel(){
    if(!dirty()&&mode!=='text'){note('No action changes to discard.');editContinue.focus();return;}
    const dialog=el('dialog','sa-dialog');dialog.ariaLabel='Discard this draft?';
    const previous=document.activeElement as HTMLElement;
    const keep=action('Keep editing',()=>dialog.close());
    dialog.append(el('h2','','Discard this draft?'),el('p','','Other button drafts and sample values stay as they are.'),keep,
      action('Discard draft',()=>{drafts[selected]=structuredClone(saved[selected]!);if(mode==='text'){text=savedText;sample=savedSample;}dialog.close();render();editContinue.focus();}));
    dialog.oncancel=e=>{e.preventDefault();dialog.close();};dialog.onclose=()=>{dialog.remove();if(previous.isConnected)previous.focus();};root.append(dialog);dialog.showModal();keep.focus();
  }
  function apply(){
    if(mode==='text'){if(!decimalInput(sample)){note('Enter a finite decimal sample. Your draft is retained.');root.querySelector<HTMLInputElement>('[aria-label="Money sample"]')?.focus();return;}savedSample=sample;savedText=text;note('Text applied to browser memory. Samples remain editor-only.');return;}
    if(context.state==='protected'||contextKind==='component'){note('These actions stay in Source. No draft was applied.');return;}
    const invalid=rows().find(r=>feedback(r).error);
    if(invalid){expanded=invalid.id;render();const input=root.querySelector<HTMLInputElement>(`[data-formula="${invalid.id}"]`);input?.focus();input?.scrollIntoView({block:'nearest'});note('Correct the formula. Your draft is retained.');return;}
    if(context.state==='stale'){note('Source or a formula dependency changed. Reload before applying. Your draft is retained.');return;}
    saved[selected]=structuredClone(rows());render();note('Action draft applied in browser memory. No actions ran.');
  }
  function rowSummary(r:Row){return r.kind==='set'?`${r.target} ${r.op} ${r.formula}`:r.kind==='finish'?'Finish interaction':`${r.kind==='show'?'Show':'Hide'} About`;}
  function render(){
    title.textContent=mode==='text'?'Text and editor samples':refined?(selected==='continue'?'Continue':'Reward'):`${selected==='continue'?'Continue':'Reward'} ${context.state==='imagebutton'?'imagebutton':'textbutton'}`;
    editContinue.ariaPressed=String(mode==='actions'&&selected==='continue');editReward.ariaPressed=String(mode==='actions'&&selected==='reward');editText.ariaPressed=String(mode==='text');
    body.replaceChildren();footer.replaceChildren();review.querySelector('.sa-examples')?.remove();status.textContent=message;
    if(mode==='text'){renderText();return;}
    const heading=el('div','sa-line');heading.append(el('strong','','When clicked'),el('code','',`${rows().length} / 8 actions`));body.append(heading);
    if(context.state==='protected'||contextKind==='component'){
      body.append(el('p','sa-warning',contextKind==='component'?'Component actions stay in Source.':'Source-only action. This form captures price while the screen is evaluated.'),el('pre','','SetVariable("money", money - price)'),el('p','','Its timing differs from click-time arithmetic. Keep the original source unchanged.'),action('View in Source',()=>note('Source navigation is simulated. Original source remains untouched.')));return;
    }
    const add=select('Add action',[['','+ Add action'],['set','Set variable'],['show','Show screen'],['hide','Hide screen'],...(contextKind==='dialog'&&!rows().some(r=>r.kind==='finish')?[['finish','Finish interaction'] as const]:[])],'');
    add.disabled=rows().length>=8;add.onchange=()=>{
      const r:Row={id:++nextId,kind:add.value,target:'trust',op:'+=',formula:'1'};
      const finish=rows().findIndex(r=>r.kind==='finish');rows().splice(finish<0?rows().length:finish,0,r);expanded=r.id;render();root.querySelector<HTMLElement>(`[data-target="${r.id}"]`)?.focus();
    };body.append(add);
    const sequence=el('ol',`sa-sequence ${variant==='sequence-v1'?'sa-separate':''}`);sequence.ariaLabel='Ordered actions';
    for(const [index,row]of rows().entries()){
      const li=el('li');li.dataset.rowId=String(row.id);
      const line=el('div','sa-action-line');
      const trigger=action(`${index+1}  ${refined&&expanded===row.id&&row.kind==='set'?'Set variable':rowSummary(row)}`,()=>{expanded=row.id;render();root.querySelector<HTMLElement>(`[data-step="${row.id}"]`)?.focus();});trigger.className='sa-step';trigger.dataset.step=String(row.id);trigger.ariaExpanded=String(expanded===row.id||variant==='expanded-v1');
      const tools=el('div','sa-tools');
      for(const [direction,symbol]of [[-1,'↑'],[1,'↓']] as const){const b=action(symbol,()=>{const at=index+direction;[rows()[index],rows()[at]]=[rows()[at]!,row];render();root.querySelector<HTMLElement>(`[data-step="${row.id}"]`)?.focus();});b.ariaLabel=`Move action ${index+1} ${direction<0?'earlier':'later'}`;b.disabled=row.kind==='finish'||index+direction<0||index+direction>=rows().length||rows()[index+direction]?.kind==='finish';tools.append(b);}
      const remove=action('×',()=>{rows().splice(index,1);expanded=rows()[Math.min(index,rows().length-1)]?.id??0;render();root.querySelector<HTMLElement>('.sa-step')?.focus();});remove.ariaLabel=`Remove action ${index+1}`;tools.append(remove);line.append(trigger,tools);li.append(line);
      if(variant!=='sequence-v1'&&(expanded===row.id||variant==='expanded-v1'))li.append(editor(row,index));sequence.append(li);
    }
    body.append(sequence);
    if(variant==='sequence-v1'){const at=rows().findIndex(r=>r.id===expanded);if(at>=0){body.append(el('h3','',`Edit action ${at+1}`),editor(rows()[at]!,at));}}
    body.append(el('p','sa-order',refined?'Runs in this order. Each action reads the values left by the action above it.':'Runs top to bottom during play. Each action reads the values left by the actions above it. Finish stays last.'));
    if(context.state==='unknown')body.append(el('p','sa-warning','Current money is unknown. No starting value or result is inferred from its default. The formula can still be authored.'));
    const info=el('details','sa-examples');info.append(el('summary','','Formula examples and context'));
    const examples=select('Formula example',[
      ['1','Whole number · 1'],['(trust + bonus) * 2','Grouping · (trust + bonus) * 2'],['trust + bonus * 2','Precedence · trust + bonus * 2'],['trust / 2','Decimal division · trust / 2'],['trust // 2','Whole floor division · trust // 2'],['price // 2','Decimal floor division · price // 2'],['-5 // 2','Negative floor · -5 // 2'],['-5 % 2','Negative remainder · -5 % 2'],['ghost + 1','Missing variable'],['help_seen + 1','Wrong type'],['price / 0','Zero divisor'],['2 ** 3','Unsupported power'],['round(price)','Unsupported call'],['1e309','Non-finite result'],['9223372036854775808','Out of range'],['9223372036854775807','Exact whole-number text']
    ],'1');examples.onchange=()=>{const row=rows().find(r=>r.id===expanded);if(row){row.formula=examples.value;render();}};
    const kind=select('Action context',[['dialog','Blocking dialog'],['panel','Qualified panel'],['component','Component']],contextKind);kind.onchange=()=>{contextKind=kind.value;if(contextKind!=='dialog')drafts[selected]=rows().filter(r=>r.kind!=='finish');render();};
    info.append(examples,labelled('Context',kind),el('p','','Show/Hide target About is explicitly qualified by the sample contract. Kind alone does not grant eligibility. Changing this sample context resets Finish eligibility.'));if(refined)review.append(info);else body.append(info);
    footer.append(action('Apply',apply,true),action('Cancel',confirmCancel));footer.children[0]!.setAttribute('aria-label','Apply action draft');footer.children[1]!.setAttribute('aria-label','Cancel action draft');
  }
  function operationField(wrap:HTMLElement){const label=el('label','field lp-field');label.append(el('span','lp-label','Operation'),wrap);return label;}
  function editor(row:Row,index:number){
    if(refined)return refinedEditor(row,index,{variables:vars,operations,feedback,changed:()=>{const trigger=root.querySelector(`[data-step="${row.id}"]`);if(trigger)trigger.textContent=`${index+1}  ${expanded===row.id&&row.kind==='set'?'Set variable':rowSummary(row)}`;}});
    const section=el('div','sa-fields');if(row.kind!=='set'){section.append(el('p','',row.kind==='finish'?'Resume Story after this blocking dialog. Always last.':'Target: About · Qualified panel'));return section;}
    const target=select(`Action ${index+1} variable`,vars.map(([name,type])=>[name,`${name} · ${type}`]),row.target);target.dataset.target=String(row.id);
    const op=select(`Action ${index+1} operation`,operations.map(([symbol,name])=>[symbol,`${symbol}  ${name}`]),row.op);
    const formula=el('input');formula.value=row.formula;formula.ariaLabel=`Action ${index+1} formula`;formula.dataset.formula=String(row.id);formula.autocomplete='off';formula.spellcheck=false;
    const equation=el('div','sa-equation'),opWrap=el('div','sa-operation'),symbol=el('span','sa-operation-symbol',row.op);opWrap.append(op,symbol);if(variant!=='equation-v1')symbol.hidden=true;equation.append(labelled('Variable',target),operationField(opWrap),labelled('Number or formula',formula));section.append(equation);
    const diagnostic=el('p','sa-diagnostic');diagnostic.id=`sa-result-${row.id}`;diagnostic.ariaLive='polite';formula.setAttribute('aria-describedby',diagnostic.id);section.append(diagnostic);
    const suggestions=el('div','sa-suggestions');suggestions.setAttribute('aria-label',`Action ${index+1} variable suggestions`);
    for(const [name,type]of vars){const b=action(name,()=>{const end=formula.selectionEnd??formula.value.length;let start=formula.selectionStart??end;if(start===end){const prefix=formula.value.slice(0,start).match(/[A-Za-z_][A-Za-z_0-9]*$/)?.[0];if(prefix)start-=prefix.length;}formula.setRangeText(name,start,end,'end');row.formula=formula.value;update();formula.focus();});b.title=type;suggestions.append(b);}
    const group=action('( )',()=>{const start=formula.selectionStart??0,end=formula.selectionEnd??formula.value.length;formula.setRangeText(`(${formula.value.slice(start,end)})`,start,end,'select');row.formula=formula.value;update();formula.focus();});group.ariaLabel=`Group action ${index+1} selection`;suggestions.append(group);section.append(suggestions);
    function update(){const f=feedback(row);diagnostic.textContent=f.error??`${f.type} result → ${types[row.target]} target. ${f.note}`;diagnostic.classList.toggle('sa-error',!!f.error);if(f.error)formula.setAttribute('aria-invalid','true');else formula.removeAttribute('aria-invalid');const trigger=root.querySelector(`[data-step="${row.id}"]`);if(trigger)trigger.textContent=`${index+1}  ${rowSummary(row)}`;}
    formula.oninput=()=>{row.formula=formula.value;update();};target.onchange=()=>{row.target=target.value;update();};op.onchange=()=>{row.op=op.value;symbol.textContent=row.op;op.title=operations.find(([id])=>id===row.op)?.[1]??row.op;update();};update();
    return section;
  }
  function renderText(){
    const input=el('textarea');input.ariaLabel='Screen text';input.value=text;input.oninput=()=>{text=input.value;};
    const insert=action('Insert money',()=>{input.setRangeText('[money!q]',input.selectionStart,input.selectionEnd,'end');text=input.value;input.focus();});
    const value=el('input');value.ariaLabel='Money sample';value.inputMode='decimal';value.value=sample;
    const canvas=el('output','sa-text-sample',`Balance: ${sample}`);canvas.ariaLabel='Editor text sample';
    const error=el('p','sa-diagnostic');value.oninput=()=>{sample=value.value;const valid=decimalInput(sample);error.textContent=valid?'Editor-only override. Default money stays 1.25.':'Enter a finite decimal such as -2.5. Input retained.';value.setAttribute('aria-invalid',String(!valid));if(valid)canvas.textContent=text.replaceAll('[money!q]',sample);};
    body.append(labelled('Text',input),insert,el('h3','','Editor samples'),labelled('money · Decimal',value),error,canvas,el('p','','Canvas clicks select elements. Sample edits never execute button actions or change defaults.'),action('Reset sample',()=>{sample='1.25';render();}));footer.append(action('Apply text draft',apply,true),action('Cancel text draft',confirmCancel));
  }
  render();return()=>root.removeEventListener('keydown',key);
}
export function decimalInput(value:string){return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)&&Number.isFinite(Number(value));}
