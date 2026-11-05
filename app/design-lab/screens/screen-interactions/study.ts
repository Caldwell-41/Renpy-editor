// Experience First: vary action editing inside the actual Screens renderer.
import type {LabContext} from '../../contracts.ts';
import {labPage, element as el, action} from '../../page.ts';
import {ScreensWorkspace, type ScreenDocument, type ScreenNode} from '../../../src/screen-ui.ts';
import type {CompositionCommand} from '../../../src/screen-composition.ts';
import {loadPreferences} from '../../../src/preferences.ts';
import {icon} from '../../../src/icons.ts';
import {fixture, clone, applyText, render, source, type Sample} from '../shared-look/editor-sample.ts';
import '../../../src/screen-ui.css';
import './style.css';
export type Variant='inspector'|'worksheet'|'workspace'|'reference';
type Row={id:string;type:'setVariable'|'showScreen'|'hideScreen'|'finishInteraction';variableId:string;value:string;target:string};
type Draft={rows:Row[];saved:Row[];error:string;errorIndex?:number;errorPart?:string;active:string;editorOpen:boolean;expanded:Set<string>};
const variables=[{id:'coins',name:'Coins',kind:'int',value:'12'},{id:'help_seen',name:'Help seen',kind:'bool',value:'False'},{id:'player_name',name:'Player name',kind:'string',value:'Mara'}] as const;
// Capability is explicit. Kind and unknown effects are not eligibility rules.
const targetFixtures=[{id:'Help',name:'Help',canShowHide:false,blocking:true},{id:'About',name:'About',canShowHide:true,blocking:false},{id:'custom_overlay',name:'Custom overlay',canShowHide:false,blocking:false}];
const esc=(value:string)=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const integer=(value:string)=>/^(0|[1-9][0-9]*|-[1-9][0-9]*)$/.test(value);
const options=(items:readonly (readonly [string,string])[],value:string)=>items.map(([id,name])=>`<option value="${esc(id)}" ${id===value?'selected':''}>${esc(name)}</option>`).join('');
const titles:Record<Variant,string>={inspector:'A · Expandable actions',worksheet:'B · Sequence and editor',workspace:'C · Direct rows',reference:'Existing Screens'};
export async function mountStudy(host:HTMLElement,context:LabContext,variant:Variant){
  await loadPreferences();document.documentElement.dataset.theme=context.theme;
  const targets=targetFixtures.map(target=>context.state==='panel'&&target.id==='Help'?{...target,canShowHide:true,blocking:false}:target);
  let sample=fixture(''),disposed=false,entered=context.state==='choose',sampleOpen=context.state==='text';
  sample.documents[0]!.screens[0]!.nodes.find(n=>n.id==='body')!.literal='Coins: [coins!q]\nPlayer: [player_name!q]';
  for(const doc of sample.documents)doc.screens[0]!.nodes.find(n=>n.id==='close')!.dismissal=doc===sample.documents[0]?'finishInteraction':'hideScreen';
  let currentId=context.state==='text'?'body':'close';
  let actionSequence=0;const actionId=()=>`action-${++actionSequence}`;
  const drafts=new Map<string,Draft>();
  const samples:Record<string,string>=Object.fromEntries(variables.map(v=>[v.id,v.value]));
  const past:{sample:Sample;actions:[string,Row[]][]}[]=[],future:typeof past=[];
  const frame=labPage(host,context,{screen:'screens',title:'Screens',subtitle:'',dirty:()=>workspace.hasDraft()||[...drafts.values()].some(d=>dirty(d))});
  frame.shell.classList.add('screen-interactions-study');frame.heading.remove();
  frame.shell.querySelector('.lp-sample')!.textContent=`${titles[variant]} · Draft`;
  frame.shell.querySelector('.lp-fiction')!.textContent='Browser mock · All changes stay in memory';
  const nav=action('Screens',()=>{});nav.className='tree-item selected';nav.ariaLabel=nav.title='Screens';nav.ariaCurrent='page';nav.prepend(icon('panel'));frame.shell.querySelector('[aria-label="Source"]')!.after(nav);
  const report=(message:string)=>{frame.status.textContent=message;};
  frame.shell.addEventListener('click',event=>{const control=(event.target as HTMLElement).closest<HTMLElement>('.lp-navigation .tree-item,.brand,.lp-studio-link,.lp-runtime-link');if(control){event.preventDefault();event.stopImmediatePropagation();report('Only Screens is active in this browser mock.');}},{capture:true});
  const owner=(doc:ScreenDocument)=>context.state==='component'&&doc===sample.documents[0]?'component':doc===sample.documents[0]&&context.state!=='panel'?'dialog':'panel';
  function selection(){
    const picker=workspace.panel.querySelector<HTMLSelectElement>('.screen-picker select');
    const id=picker?.value?JSON.parse(picker.value)[1]:'Help';
    const doc=sample.documents.find(d=>d.screens[0]!.name===id)??sample.documents[0]!;
    const selected=workspace.panel.querySelector<HTMLElement>('.screen-node[aria-pressed="true"]');
    if(selected?.dataset.index){const node=doc.screens[0]!.nodes[Number(selected.dataset.index)];if(node?.id)currentId=node.id;}
    return {doc,node:doc.screens[0]!.nodes.find(n=>n.id===currentId)??doc.screens[0]!.nodes[0]!};
  }
  const key=(doc:ScreenDocument,node:ScreenNode)=>`${doc.screens[0]!.name}/${node.id}`;
  function draft(doc:ScreenDocument,node:ScreenNode):Draft{
    const id=key(doc,node);let value=drafts.get(id);if(value)return value;
    const rows:Row[]=[{id:actionId(),type:'setVariable',variableId:'help_seen',value:'True',target:'About'},{id:actionId(),type:'showScreen',variableId:'coins',value:'12',target:'About'},{id:actionId(),type:owner(doc)==='dialog'?'finishInteraction':'hideScreen',variableId:'coins',value:'12',target:doc.screens[0]!.name}];
    value={rows:clone(rows),saved:clone(rows),error:'',active:rows[0]!.id,editorOpen:true,expanded:new Set([rows[0]!.id])};
    if(context.state==='invalid')value.rows[0]={...value.rows[0]!,variableId:'coins',value:'12 + 1'};
    if(context.state==='missing')value.rows[0]!.variableId='missing';
    if(context.state==='limit')while(value.rows.length<8)value.rows.splice(value.rows.length-1,0,{id:actionId(),type:'setVariable',variableId:'coins',value:'12',target:'About'});
    drafts.set(id,value);return value;
  }
  const dirty=(d:Draft)=>JSON.stringify(d.rows)!==JSON.stringify(d.saved);
  function validate(d:Draft,doc:ScreenDocument){
    delete d.errorIndex;delete d.errorPart;
    const invalid=(index:number,part:string,message:string)=>{d.errorIndex=index;d.errorPart=part;return message;};
    if(context.state==='stale')return 'Source changed after this draft started. Your changes are retained.';
    if(context.state==='conflict')return 'Resolve the Source conflict before applying. Your changes are retained.';
    if(context.state==='custom')return 'Custom actions stay in Source. Your changes are retained.';
    if(owner(doc)==='component')return 'Component actions are read-only. Your changes are retained.';
    for(const [i,row] of d.rows.entries()){
      const variable=variables.find(v=>v.id===row.variableId);
      if(row.type==='setVariable'&&!variable)return invalid(i,'variableId','This variable is unavailable. Choose an existing variable. Your value is retained.');
      if(row.type==='setVariable'&&variable?.kind==='int'&&!integer(row.value))return invalid(i,'value','Enter a whole number, such as 12 or -3. Expressions are not supported.');
      if(row.type==='setVariable'&&variable?.kind==='bool'&&!['True','False'].includes(row.value))return invalid(i,'value','Choose True or False. Your value is retained.');
      if(row.type==='finishInteraction'&&(owner(doc)!=='dialog'||i!==d.rows.length-1))return invalid(i,'type','Finish belongs last on a blocking dialog. Your changes are retained.');
      if(['showScreen','hideScreen'].includes(row.type)&&!targets.find(t=>t.id===row.target)?.canShowHide)return invalid(i,'target','Choose a screen qualified for Show/Hide. Your changes are retained.');
    }return '';
  }
  const snapshot=()=>({sample:clone(sample),actions:[...drafts].map(([k,d])=>[k,clone(d.saved)] as [string,Row[]])});
  function accept(next:Sample,d?:Draft){past.push(snapshot());future.length=0;if(d)d.saved=clone(d.rows);next.revision=sample.revision+1;next.documents.forEach(doc=>doc.revision=`sample-${next.revision}`);sample=next;report('Applied to this browser sample. No game actions ran.');}
  const substitute=(text:string)=>text.replace(/\[([A-Za-z_][A-Za-z_0-9]*)!q\]/g,(token,id:string)=>samples[id]??token);
  const workspace=new ScreensWorkspace({
    projectId:'screen-interactions-v2',resolution:{width:1280,height:720},current:()=>!disposed,coordinate:task=>task(),
    source:()=>report('Source navigation stays in the application. This sample writes no files.'),
    preview:()=>report('This mock starts no Ren\'Py or validation process.'),saved:()=>queueMicrotask(update),
    useInStory:async()=>{report('Use in Story keeps its existing placement workflow. Nothing was inserted.');},
    request:async<T>(operation:string,payload:Record<string,unknown>={}):Promise<T>=>{
      if(operation==='source.list')return {files:sample.documents.map(d=>({path:d.path}))} as T;
      if(operation==='screens.list')return {projectRevision:`project-${sample.revision}`,sourceMapRevision:`map-${sample.revision}`,inventoryRevision:'sample',owned:sample.documents.map(doc=>({id:doc.screens[0]!.name,rootId:'root',name:doc.screens[0]!.name,path:doc.path,kind:owner(doc),resolved:true,sourceRevision:doc.revision}))} as T;
      if(operation==='screens.inspect')return clone(sample.documents.find(d=>d.path===payload.path)) as T;
      if(operation==='authoring.list')return {assets:[]} as T;
      if(operation==='screens.resolveTarget'){const binding=payload.binding as {screenId:string};const target=targets.find(t=>t.id===binding.screenId)!;return {binding,kind:target.blocking?'dialog':'panel',blocking:target.blocking,canShowHide:target.canShowHide} as T;}
      if(operation==='screens.canvasRender'){
        const doc=clone(sample.documents.find(d=>d.path===payload.path)!);
        for(const node of doc.screens[0]!.nodes)if(node.kind==='text')node.literal=substitute(node.literal??'');
        const textStyles=((payload.textStyles??[]) as {nodeStart:number;values:{text?:string}}[]).map(s=>({...s,values:{...s.values,...(s.values.text!==undefined?{text:substitute(s.values.text)}:{})}}));
        return render(doc,{...payload,textStyles}) as T;
      }
      if(operation==='source.open'){const doc=sample.documents.find(d=>d.path===payload.path)!;return {path:doc.path,text:source(sample,doc),dirty:false,baseRevision:doc.revision,hasBom:false} as T;}
      if(operation==='scene.list')return {projectRevision:`project-${sample.revision}`,sourceMapRevision:`map-${sample.revision}`} as T;
      if(operation==='scene.apply'){
        const undo=(payload.command as {type:string}).type==='undo',from=undo?past:future,to=undo?future:past;
        const previous=from.pop();if(previous){to.push(snapshot());sample=previous.sample;for(const [k,rows]of previous.actions){const d=drafts.get(k);if(d){d.saved=clone(rows);d.rows=clone(rows);d.error='';}}}return {} as T;
      }
      if(operation==='screens.compose'){
        const {doc,node}=selection(),d=node.kind==='textbutton'?draft(doc,node):undefined;
        if(d&&dirty(d)){const error=validate(d,doc);if(error)throw Error(error);}
        if(['stale','conflict'].includes(context.state))throw Error('Source changed. Your draft is retained.');
        const command=payload.command as CompositionCommand;
        if(command.type!=='formatText')throw Error('This mock only applies text, appearance and button-action edits in memory.');
        const next=clone(sample),nextDoc=next.documents.find(x=>x.path===doc.path)!;applyText(next,nextDoc,command);accept(next,d);
        return {document:clone(sample.documents.find(x=>x.path===doc.path)),selectedId:command.nodeId,changed:true} as T;
      }
      if(operation==='screens.setLayout')throw Error('Layout keeps its application owner. This study changes only text bindings and button actions.');
      throw Error(`The browser mock does not perform ${operation}.`);
    },
  });
  workspace.mount(frame.content);
  const events=new AbortController();
  function summary(row:Row){const v=variables.find(v=>v.id===row.variableId);return row.type==='setVariable'?`Set ${v?.name??'missing variable'} to ${row.value}`:row.type==='finishInteraction'?'Finish interaction':`${row.type==='showScreen'?'Show':'Hide'} ${row.target}`;}
  const control=(label:string,part:string,index:number,html:string)=>`<label class="screen-text-field">${label.endsWith('type')?'Action':label.replace(/^Action \d+ /,'').replace(/^./,c=>c.toUpperCase())}<select aria-label="${label}" data-part="${part}" data-row="${index}">${html}</select></label>`;
  function fields(row:Row,i:number,doc:ScreenDocument,d:Draft){
    const types:[string,string][]=[['setVariable','Set variable'],['showScreen','Show screen'],['hideScreen','Hide screen'],...(owner(doc)==='dialog'?[['finishInteraction','Finish interaction'] as [string,string]]:[])];
    const typeOptions=options(types,row.type);
    const type=control(`Action ${i+1} type`,'type',i,row.type!=='finishInteraction'&&d.rows.some(r=>r.type==='finishInteraction')?typeOptions.replace('value="finishInteraction"','value="finishInteraction" disabled'):typeOptions);
    if(row.type==='finishInteraction')return type+'<p class="siv-help">Resume Story after this dialog. Always last.</p>';
    if(row.type!=='setVariable')return type+control(`Action ${i+1} screen`,'target',i,options(targets.filter(t=>t.canShowHide).map(t=>[t.id,`${t.name} · Panel`]),row.target));
    const v=variables.find(v=>v.id===row.variableId),choices:[string,string][]=variables.map(v=>[v.id,`${v.name} · ${v.kind}`]);if(!v)choices.unshift([row.variableId,'Original variable missing']);
    const value=v?.kind==='bool'?control(`Action ${i+1} value`,'value',i,options([['True','True'],['False','False']],row.value)):`<label class="screen-text-field">Value<input aria-label="Action ${i+1} value" data-part="value" data-row="${i}" value="${esc(row.value)}" ${v?.kind==='int'?'inputmode="numeric"':''}></label>`;
    return type+`<div class="siv-payload">${control(`Action ${i+1} variable`,'variableId',i,options(choices,row.variableId))}${value}</div>`;
  }
  function clearError(section:HTMLElement,d:Draft){
    d.error='';delete d.errorIndex;delete d.errorPart;
    section.querySelectorAll('[data-field-error]').forEach(e=>e.remove());
    section.querySelectorAll('[aria-invalid]').forEach(e=>{e.removeAttribute('aria-invalid');e.removeAttribute('aria-describedby');});
    const general=section.querySelector<HTMLElement>('.siv-general-error');if(general)general.hidden=true;
  }
  function liveSummary(section:HTMLElement,d:Draft){
    for(const label of section.querySelectorAll<HTMLElement>('[data-summary-index]')){
      const row=d.rows[Number(label.dataset.summaryIndex)];if(row&&label.textContent!==summary(row))label.textContent=summary(row);
    }
  }
  function reveal(section:HTMLElement,d:Draft){section.querySelector<HTMLElement>(`[data-row-id="${d.active}"]`)?.scrollIntoView({block:'nearest'});}
  function renderActions(section:HTMLElement,d:Draft,doc:ScreenDocument){
    const body=section.closest('.screen-text-body'),scroll=body?.scrollTop??0;
    const focused=document.activeElement instanceof HTMLElement&&section.contains(document.activeElement)?document.activeElement:undefined;
    const focusId=focused?.closest<HTMLElement>('[data-row-id]')?.dataset.rowId;
    const focusPart=focused?.dataset.part,focusAction=focused?.dataset.action,focusSummary=focused?.tagName==='SUMMARY',focusAdd=focused?.classList.contains('siv-add');
    const readOnly=context.state==='custom'||owner(doc)==='component';
    const tools=(row:Row,i:number)=>`<div class="siv-row-tools"><button class="button" data-action="up" data-index="${i}" title="Move earlier" aria-label="Move action ${i+1} earlier" ${readOnly||i===0||row.type==='finishInteraction'?'disabled':''}>↑</button><button class="button" data-action="down" data-index="${i}" title="Move later" aria-label="Move action ${i+1} later" ${readOnly||i===d.rows.length-1||d.rows[i+1]?.type==='finishInteraction'?'disabled':''}>↓</button><button class="button" data-action="remove" data-index="${i}" title="Remove action" aria-label="Remove action ${i+1}" ${readOnly?'disabled':''}>×</button></div>`;
    const caption=(row:Row,i:number)=>`<span class="siv-number">${i+1}</span><span class="siv-summary" data-summary-index="${i}">${esc(summary(row))}</span>`;
    const rows=`<ol class="siv-sequence">${d.rows.map((row,i)=>`<li data-action-index="${i}" data-row-id="${row.id}">${variant==='worksheet'?`<button class="button siv-step" data-action="select" data-index="${i}" aria-pressed="${row.id===d.active}" aria-expanded="${row.id===d.active&&d.editorOpen}" aria-controls="editor-${row.id}">${caption(row,i)}<span class="siv-chevron" aria-hidden="true">${row.id===d.active&&d.editorOpen?'▾':'▸'}</span></button>${tools(row,i)}${row.id===d.active&&d.editorOpen?`<div id="editor-${row.id}" class="siv-single-editor" role="group" aria-label="Edit action ${i+1}">${fields(row,i,doc,d)}</div>`:''}`:variant==='inspector'?`<details name="actions-${doc.screens[0]!.name}" data-row-open="${i}" data-row-id="${row.id}" ${d.expanded.has(row.id)?'open':''}><summary>${caption(row,i)}</summary><div class="siv-row-editor">${fields(row,i,doc,d)}</div></details>${tools(row,i)}`:`<div class="siv-direct"><div class="siv-row-title">${caption(row,i)}</div>${fields(row,i,doc,d)}</div>${tools(row,i)}`}</li>`).join('')}</ol>`;
    section.className=`siv-actions siv-${variant}`;section.ariaLabel='Ordered button actions';
    section.innerHTML=`<div class="siv-section-heading"><h3>When clicked</h3><span>${d.rows.length} / 8 actions</span></div>${readOnly?`<p class="siv-error">${context.state==='custom'?'Custom actions stay in Source.':'Component actions are read-only here.'}</p>`:''}<select class="siv-add" aria-label="Add action" ${readOnly||d.rows.length>=8?'disabled':''}><option value="">+ Add action</option><option value="setVariable">Set variable</option><option value="showScreen">Show screen</option><option value="hideScreen">Hide screen</option>${owner(doc)==='dialog'?`<option value="finishInteraction" ${d.rows.some(r=>r.type==='finishInteraction')?'disabled':''}>Finish interaction</option>`:''}</select><fieldset ${readOnly?'disabled':''}>${rows}</fieldset><p class="siv-help">Runs in this order during play. Finish stays last.</p><p class="siv-error siv-general-error" role="alert" ${d.error&&d.errorIndex===undefined?'':'hidden'}>${esc(d.error)}</p>`;
    if(d.error&&d.errorIndex!==undefined){
      const input=section.querySelector<HTMLElement>(`[data-row="${d.errorIndex}"][data-part="${d.errorPart}"]`);
      if(input){const message=el('span','siv-error',d.error);message.id=`error-${d.rows[d.errorIndex]!.id}`;message.dataset.fieldError='';message.role='alert';input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby',message.id);const group=input.closest('.siv-payload');if(group){message.style.gridColumn='1 / -1';group.append(message);}else input.parentElement!.append(message);}
    }
    section.querySelectorAll<HTMLDetailsElement>('details').forEach(detail=>detail.addEventListener('toggle',()=>{if(!detail.isConnected)return;const id=detail.dataset.rowId!;if(detail.open){d.expanded.clear();d.expanded.add(id);d.active=id;}else d.expanded.delete(id);}));
    section.querySelectorAll<HTMLInputElement|HTMLSelectElement>('[data-part]').forEach(input=>input.addEventListener(input.tagName==='SELECT'?'change':'input',()=>{
      const i=Number(input.dataset.row),row=d.rows[i]!,part=input.dataset.part as keyof Row;
      if(part==='type'){
        const type=input.value as Row['type'];if(type==='finishInteraction'&&d.rows.some((r,j)=>r.type==='finishInteraction'&&i!==j)){renderActions(section,d,doc);return;}
        row.type=type;if(['showScreen','hideScreen'].includes(type)&&!targets.find(t=>t.id===row.target)?.canShowHide)row.target=targets.find(t=>t.canShowHide)!.id;
        if(type==='finishInteraction'){d.rows.splice(i,1);d.rows.push(row);d.active=row.id;}
      }else{row[part]=input.value;if(part==='variableId')row.value=variables.find(v=>v.id===input.value)?.value??row.value;}
      clearError(section,d);if(input.tagName==='SELECT')renderActions(section,d,doc);else liveSummary(section,d);syncCommit();
    }));
    section.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button=>button.onclick=()=>{
      const i=Number(button.dataset.index),op=button.dataset.action,row=d.rows[i]!;
      if(op==='select'){d.editorOpen=d.active===row.id?!d.editorOpen:true;d.active=row.id;}
      else if(op==='remove'){d.rows.splice(i,1);d.expanded.delete(row.id);if(d.active===row.id)d.active=d.rows[Math.min(i,d.rows.length-1)]?.id??'';}
      else{const j=i+(op==='up'?-1:1);if(j>=0&&j<d.rows.length&&row.type!=='finishInteraction'&&d.rows[j]?.type!=='finishInteraction')[d.rows[i],d.rows[j]]=[d.rows[j]!,row];}
      if(op!=='select')clearError(section,d);renderActions(section,d,doc);syncCommit();if(op==='select')reveal(section,d);else if(op==='up'||op==='down')section.querySelector<HTMLElement>(`li[data-row-id="${row.id}"] summary,li[data-row-id="${row.id}"] .siv-step`)?.scrollIntoView({block:'nearest'});
    });
    section.querySelector<HTMLSelectElement>('.siv-add')!.onchange=event=>{
      const type=(event.target as HTMLSelectElement).value as Row['type'];if(!type||d.rows.length>=8)return;
      const row:Row={id:actionId(),type,variableId:'coins',value:'12',target:'About'};
      const finish=d.rows.findIndex(r=>r.type==='finishInteraction'),index=finish<0?d.rows.length:finish;d.rows.splice(index,0,row);d.active=row.id;d.editorOpen=true;d.expanded.clear();d.expanded.add(row.id);clearError(section,d);renderActions(section,d,doc);syncCommit();const item=section.querySelector<HTMLElement>(`li[data-row-id="${row.id}"]`);const field=item?.querySelector<HTMLElement>('[data-part="variableId"],[data-part="target"]')??item?.querySelector<HTMLElement>('[data-part="type"]');field?.focus({preventScroll:true});(field?.parentElement??item)?.scrollIntoView({block:'nearest'});
    };
    section.onkeydown=event=>{
      const button=(event.target as HTMLElement).closest<HTMLElement>('.siv-step');if(!button||!['ArrowUp','ArrowDown'].includes(event.key))return;
      event.preventDefault();const i=Math.max(0,Math.min(d.rows.length-1,Number(button.dataset.index)+(event.key==='ArrowUp'?-1:1)));d.active=d.rows[i]!.id;d.editorOpen=true;renderActions(section,d,doc);section.querySelector<HTMLElement>(`.siv-step[data-index="${i}"]`)?.focus({preventScroll:true});reveal(section,d);
    };
    if(body)body.scrollTop=scroll;
    const item=focusId?section.querySelector<HTMLElement>(`li[data-row-id="${focusId}"]`):null;
    let restore=focusPart?item?.querySelector<HTMLElement>(`[data-part="${focusPart}"]`):focusAction?item?.querySelector<HTMLElement>(`[data-action="${focusAction}"]`):focusSummary?item?.querySelector<HTMLElement>('summary'):focusAdd?section.querySelector<HTMLElement>('.siv-add'):null;
    if(!restore||restore.matches(':disabled'))restore=focused?(item??section.querySelector<HTMLElement>(`li[data-row-id="${d.active}"]`))?.querySelector<HTMLElement>('summary,.siv-step')??section.querySelector<HTMLElement>('.siv-add'):null;
    restore?.focus({preventScroll:true});
  }
  function syncCommit(){
    const {doc,node}=selection();if(node.kind!=='textbutton')return;const d=draft(doc,node);
    if(dirty(d))for(const selector of ['[data-text-apply]','[data-text-cancel]']){const button=workspace.panel.querySelector<HTMLButtonElement>(selector);if(button)button.disabled=false;}
    const marker=workspace.panel.querySelector('.siv-draft-status');if(marker){const text=dirty(d)?'Action draft':'';if(marker.textContent!==text)marker.textContent=text;}
  }
  function update(){
    if(disposed)return;
    if(!entered){const id=context.state==='text'?'body':'close',row=workspace.panel.querySelector<HTMLElement>(`[data-node-id="${id}"]`);if(row){entered=true;currentId=id;row.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));}}
    if(variant==='reference')return;
    const card=workspace.panel.querySelector<HTMLElement>('.screen-card'),body=card?.querySelector<HTMLElement>('.screen-text-body');if(!card||!body)return;
    const {doc,node}=selection();
    card.querySelectorAll('.screen-dismissal').forEach(s=>s.remove());
    if(node.kind==='textbutton'&&!body.querySelector('.siv-actions')){
      const section=el('section');body.prepend(section);renderActions(section,draft(doc,node),doc);body.scrollTop=0;section.querySelector<HTMLElement>('summary,.siv-step')?.focus({preventScroll:true});
      const title=card.querySelector('h2');if(title)title.textContent=`${node.literal??'Selected'} button`;
      const heading=card.querySelector('.screen-text-heading');if(heading&&!heading.querySelector('.siv-draft-status'))heading.append(el('span','siv-draft-status'));
    }
    if(node.kind==='text'&&!body.querySelector('.siv-insert')){
      const content=body.querySelector('.screen-text-content')!,insert=el('div','siv-insert');
      const select=el('select');select.ariaLabel='Existing variable';select.innerHTML=options(variables.map(v=>[v.id,`${v.name} · ${v.kind}`]),'coins');
      insert.append(select,action('Insert variable',()=>{
        const text=content.querySelector<HTMLTextAreaElement>('textarea')!,token=`[${select.value}!q]`;
        text.setRangeText(token,text.selectionStart,text.selectionEnd,'end');text.dispatchEvent(new Event('input',{bubbles:true}));text.focus({preventScroll:true});
      }));content.append(insert);
    }
    if(node.kind!=='textbutton'&&[...drafts.values()].some(d=>dirty(d))&&!body.querySelector('.siv-retained')){
      const retained=el('div','siv-retained');retained.append(el('p','','Action draft retained on Close.'),action('Return to Close',()=>workspace.panel.querySelector<HTMLElement>(`.screen-node[data-index="${doc.screens[0]!.nodes.findIndex(n=>n.id==='close')}"]`)?.click()));body.prepend(retained);
    }
    const stage=workspace.panel.querySelector<HTMLElement>('.screen-stage')!;
    if(!stage.querySelector('.siv-sample-toggle')){
      const toggle=action('Sample values',()=>{sampleOpen=!sampleOpen;panel.hidden=!sampleOpen;toggle.ariaExpanded=String(sampleOpen);});toggle.classList.add('siv-sample-toggle');toggle.ariaExpanded=String(sampleOpen);
      const panel=el('section','siv-samples');panel.hidden=!sampleOpen;panel.ariaLabel='Editor-only samples';panel.append(el('h3','','Editor-only samples'),el('p','siv-help','Only the canvas changes. Source and game values stay separate.'));
      for(const v of variables){const label=el('label','screen-text-field',`${v.name} · ${v.kind}`),input=v.kind==='bool'?el('select'):el('input');input.ariaLabel=`Sample ${v.id}`;
        if(input instanceof HTMLSelectElement)input.innerHTML=options([['True','True'],['False','False']],samples[v.id]!);else input.value=samples[v.id]!;
        const error=el('span','siv-sample-error');error.id=`sample-${v.id}-error`;error.role='alert';error.hidden=true;
        input.addEventListener(v.kind==='bool'?'change':'input',()=>{if(v.kind==='int'&&!integer(input.value)){input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby',error.id);error.textContent='Use a whole number. The canvas keeps the last valid sample.';error.hidden=false;return;}input.removeAttribute('aria-invalid');input.removeAttribute('aria-describedby');error.hidden=true;samples[v.id]=input.value;refreshCanvas();});label.append(input,error);panel.append(label);
      }
      panel.append(action('Reset samples',()=>{for(const v of variables){samples[v.id]=v.value;const input=panel.querySelector<HTMLInputElement|HTMLSelectElement>(`[aria-label="Sample ${v.id}"]`)!;input.value=v.value;input.removeAttribute('aria-invalid');input.removeAttribute('aria-describedby');panel.querySelector<HTMLElement>(`#sample-${v.id}-error`)!.hidden=true;}refreshCanvas();}));stage.append(toggle,panel);
    }
    const image=workspace.panel.querySelector<HTMLImageElement>('.screen-render');if(image&&image.alt!=='Browser-drawn screen sample')image.alt='Browser-drawn screen sample';
    const status=workspace.panel.querySelector('.screen-canvas-status');if(status&&image&&status.textContent!=='Browser sample canvas. Ren\'Py is not running.')status.textContent='Browser sample canvas. Ren\'Py is not running.';
    syncCommit();
  }
  function refreshCanvas(){
    const {doc}=selection(),image=workspace.panel.querySelector<HTMLImageElement>('.screen-render');if(!image)return;
    const copy=clone(doc);for(const node of copy.screens[0]!.nodes)if(node.kind==='text')node.literal=substitute(node.literal??'');image.src=render(copy,{width:1280,height:720}).image;
    report('Editor sample changed. Source values and actions are unchanged.');
  }
  workspace.panel.addEventListener('click',event=>{
    if(variant==='reference')return;const target=(event.target as HTMLElement).closest<HTMLElement>('[data-text-apply],[data-text-cancel]');if(!target)return;
    const {doc,node}=selection();if(node.kind!=='textbutton')return;const d=draft(doc,node);if(!dirty(d))return;
    if(target.hasAttribute('data-text-cancel')){d.rows=clone(d.saved);d.error='';queueMicrotask(update);return;}
    d.error=validate(d,doc);if(d.error){event.preventDefault();event.stopImmediatePropagation();const section=workspace.panel.querySelector<HTMLElement>('.siv-actions')!;if(d.errorIndex!==undefined){d.active=d.rows[d.errorIndex]!.id;d.editorOpen=true;d.expanded.clear();d.expanded.add(d.active);}renderActions(section,d,doc);syncCommit();const input=section.querySelector<HTMLElement>('[aria-invalid="true"]');input?.focus({preventScroll:true});(input?.closest('.siv-payload')??input?.parentElement??section.querySelector<HTMLElement>('.siv-general-error'))?.scrollIntoView({block:'nearest'});return;}
    const textDirty=workspace.panel.querySelector('.screen-text-draft')?.textContent==='Draft';
    if(!textDirty){event.preventDefault();event.stopImmediatePropagation();accept(clone(sample),d);void workspace.load();}
  },{capture:true,signal:events.signal});
  workspace.panel.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing&&(event.target as HTMLElement).closest('.siv-actions input')){event.preventDefault();event.stopImmediatePropagation();workspace.panel.querySelector<HTMLButtonElement>('[data-text-apply]')?.click();return;}if(event.key==='Escape'){const {doc,node}=selection();if(node.kind==='textbutton'){const d=draft(doc,node);d.rows=clone(d.saved);d.error='';queueMicrotask(update);}}},{capture:true,signal:events.signal});
  workspace.panel.addEventListener('input',()=>queueMicrotask(syncCommit),{signal:events.signal});
  workspace.panel.addEventListener('change',()=>queueMicrotask(update),{signal:events.signal});
  const observer=new MutationObserver(update);observer.observe(workspace.panel,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-pressed']});
  return()=>{disposed=true;observer.disconnect();events.abort();workspace.dispose();};
}
