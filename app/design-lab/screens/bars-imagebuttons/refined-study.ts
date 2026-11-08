// Three property editors inside the approved Screens flow. Throwaway, memory only.
import type { LabContext } from '../../contracts.ts';
import { labPage, element as el, action as button } from '../../page.ts';
import { ScreensWorkspace } from '../../../src/screen-ui.ts';
import { loadPreferences } from '../../../src/preferences.ts';
import { icon } from '../../../src/icons.ts';
import { actionDraft, prepareInteraction, renderActions, type ActionDraft, type InteractionContext } from '../../../src/screen-interactions.ts';
import type { ScreenAction } from '../../../src/screen-contracts.ts';
import type { BarAppearance, IntegerBarBinding, ImageButtonAppearances } from '../../../src/screen-controls.ts';
import { fallbackChains, resolvedAppearance } from './appearances.ts';
import { fixture, clone, render } from '../shared-look/editor-sample.ts';
import '../../../src/screen-ui.css';
import './refined.css';

export type Variant = 'inspector' | 'focus' | 'table';
type Kind = 'bar' | 'button';
type State = keyof ImageButtonAppearances;
const states: [State, string, string][] = [['normal','Normal','idle'],['hover','Hover','hover'],['selected','Selected','selected_idle'],['selectedHover','Selected + hover','selected_hover'],['disabled','Disabled','insensitive'],['selectedDisabled','Selected + disabled','selected_insensitive']];
const ref = (index: number) => ({ assetId: `00000000-0000-4000-8000-${String(index + 1).padStart(12,'0')}`, expectedAssetSha256: String(index + 1).repeat(64) });
interface Control { binding: IntegerBarBinding; appearance: BarAppearance; appearances: ImageButtonAppearances; width: string; height: string; x: string; y: string; actions: ScreenAction[] }
interface Draft { value: Control; revision: string; authoring: string; actions: ActionDraft; keepRatio?: boolean; problem?: {message:string;label?:string} }
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const initial = (kind: Kind): Control => ({ binding: { variableId: 'coins', minimum: '0', maximum: '100' }, appearance: { leftBar: '#d7b476', rightBar: null, thumb: null }, appearances: { normal: ref(0), hover: ref(1), selected: null, selectedHover: null, disabled: ref(4), selectedDisabled: null }, width: kind === 'bar' ? '360' : '240', height: kind === 'bar' ? '24' : '64', x: '0', y: '0', actions: [{ type: 'setVariable', variableId: 'help_seen', value: true }, { type: 'finishInteraction' }] });

export async function mountStudy(host: HTMLElement, context: LabContext, startVariant: Variant) {
  await loadPreferences(); document.documentElement.dataset.theme = context.theme;
  let variant = startVariant, kind: Kind = ['bar','invalid','missing-variable','custom'].includes(context.state) ? 'bar' : 'button';
  let revision = 'sample-1', authoring = 'variables-1', disposed = false, sourceChanged = context.state === 'stale', assetMissing = context.state === 'missing-asset', variableMissing = context.state === 'missing-variable', custom = context.state === 'custom';
  let sampleValue = '42', sampleState: State = 'normal', tab = 'appearance', adding = false, parent = 'content', workspace!: ScreensWorkspace;
  let sampleKind: Kind | undefined;
  const disclosures = new Map<string, boolean>();
  let renderedKind: Kind | undefined;
  let entered = false, showProperties = true;
  let observer: MutationObserver | undefined;
  const accepted = { bar: initial('bar'), button: initial('button') }, drafts = new Map<Kind, Draft>();
  const past: { kind: Kind; before: Control; after: Control }[] = [], future: typeof past = [];
  const data = fixture(''); data.documents.forEach(doc => {doc.authoringRevision = authoring;});
  const doc = data.documents[0]!; doc.screens[0]!.nodes.find(n => n.id === 'body')!.literal = 'Fare credits';
  doc.screens[0]!.nodes.find(n => n.id === 'close')!.literal = 'Continue';
  const frame = labPage(host, context, { screen: 'screens', title: 'Screens', subtitle: '', dirty: () => drafts.size > 0 });
  frame.heading.remove(); frame.shell.classList.add('bi-study','bi-refined');
  frame.shell.querySelector('.lp-sample')!.textContent = 'Prototype · Fictional project';
  frame.shell.querySelector('.lp-fiction')!.textContent = 'Memory only · No game code runs';
  const nav = button('Screens', () => showWorkspace()); nav.className = 'tree-item selected'; nav.ariaLabel = 'Screens'; nav.prepend(icon('panel')); frame.shell.querySelector('[aria-label="Source"]')!.after(nav);
  const report = (text: string) => { frame.status.textContent = text; };
  const assets = states.map(([id], index) => {const width=index===2?360:480,height=index===2?240:128;return {...ref(index),id,name:`continue_${id}.png`,width,height,url:image(index,width,height)};});
  const bitmaps = assets.map(asset => { const img = new Image(); img.onload = () => { if (!disposed) sync(); }; img.src = asset.url; return img; });
  const stateLabel = (state: State) => states.find(([id]) => id === state)![1];
  const fallbackLabel = (state: State) => fallbackChains[state].slice(1).map(stateLabel).join(' → ');
  const variables: InteractionContext['variables'] = [
    { id: 'coins', technicalName: 'coins', variableType: 'int', defaultValue: '12', source: { sourceRevision: 'coins-1' } },
    { id: 'fare', technicalName: 'fare', variableType: 'int', defaultValue: '8', source: { sourceRevision: 'fare-1' } },
    { id: 'help_seen', technicalName: 'help_seen', variableType: 'bool', defaultValue: false, source: { sourceRevision: 'seen-1' } },
    { id: 'player_name', technicalName: 'player_name', variableType: 'string', defaultValue: 'Mara', source: { sourceRevision: 'name-1' } },
  ];
  const interaction = (): InteractionContext => ({ authoringRevision: authoring, variables: variableMissing ? variables.filter(v => v.id !== 'coins') : variables, owner: { id: 'Help', rootId: 'root', path: doc.path, name: 'Help', kind: 'dialog', resolved: true, sourceRevision: revision }, targets: [{ binding: { screenId: 'Help', sourceName: 'Help' }, kind: 'dialog', blocking: true, canShowHide: false, path: doc.path, rootId: 'root', revisions: { source: revision, sourceMap: 'map-1', inventory: 'inventory-1', effects: 'effects-1' }, effects: { revision: 'effects-1', unknown: false, hiddenScreens: [], finishesInteraction: true, shownScreens: [], assignedVariables: [], dependencies: [] } }, { binding: { screenId: 'About', sourceName: 'About' }, kind: 'panel', blocking: false, canShowHide: true, path: data.documents[1]!.path, rootId: 'root', revisions: { source: 'about-1', sourceMap: 'map-1', inventory: 'inventory-1', effects: 'effects-1' }, effects: { revision: 'effects-1', unknown: false, hiddenScreens: [], finishesInteraction: false, shownScreens: [], assignedVariables: [], dependencies: [] } }] });
  const panel = el('section', 'bi-editor'); panel.ariaLabel = 'Selected control properties';
  const samples = el('section', 'bi-samples'); samples.ariaLabel = 'Inert editor samples';
  const inspection = el('details', 'bi-review'); inspection.append(el('summary', '', 'Prototype checks'));
  const reviewTools = el('div', 'bi-review-tools'); inspection.append(reviewTools);
  for (const [name, run] of [
    ['Change source', () => { sourceChanged = true; report('Source changed. Pending drafts keep their captured revision.'); }],
    ['Remove image', () => { assetMissing = true; report('Normal image is now missing in this sample.'); drawEditor(); }],
    ['Change variable type', () => { variableMissing = true; authoring = 'variables-2'; report('Coins is no longer an integer. Your draft is retained.'); drawEditor(); }],
    ['Unrelated edit', () => { report('An unrelated About edit was accepted. This draft and its revisions are unchanged.'); }],
    ['Remount editor', () => { workspace.dispose(); mountWorkspace(); report('Workspace remounted. Drafts and captured revisions are retained.'); }],
    ['Reopen', () => { if (drafts.size) { report('Apply or Cancel pending edits before reopening. Drafts are retained.'); return; } workspace.dispose(); mountWorkspace(); report('Reopened accepted sample configuration.'); }],
  ] as [string, () => void][]) reviewTools.append(button(name, run));

  function image(index: number, width:number, height:number) {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const c = canvas.getContext('2d')!;c.scale(width/480,height/128);
    const colors = ['#354644','#50675c','#6b5734','#856b39','#353a39','#4d493c'];
    c.fillStyle = colors[index]!; c.fillRect(0,0,480,128); c.strokeStyle = index === 4 || index === 5 ? '#69706a' : '#ddbf88'; c.lineWidth = 4; c.strokeRect(3,3,474,122);
    c.fillStyle = index >= 4 ? '#939b93' : '#f4e7c8'; c.font = '600 26px sans-serif'; c.fillText(index === 2 || index === 3 || index === 5 ? '✓  CONTINUE' : 'CONTINUE', 52,77);
    c.strokeStyle = c.fillStyle; c.lineWidth = 4; c.beginPath(); c.moveTo(366,64); c.lineTo(414,64); c.lineTo(401,51); c.moveTo(414,64); c.lineTo(401,77); c.stroke();
    return canvas.toDataURL('image/png');
  }
  function current() { return drafts.get(kind)?.value ?? accepted[kind]; }
  function draft() { let d = drafts.get(kind); if (!d) { d = { value: clone(accepted[kind]), revision, authoring, actions: actionDraft(accepted[kind].actions) }; drafts.set(kind,d); } return d; }
  function clearProblem(){const own=drafts.get(kind);if(own)own.problem=undefined;panel.querySelectorAll('.bi-error,.bi-field-error').forEach(n=>n.remove());panel.querySelectorAll('[aria-describedby="bi-current-error"]').forEach(n=>{n.removeAttribute('aria-invalid');n.removeAttribute('aria-describedby');});}
  function update(change: (value: Control) => void) { change(draft().value);clearProblem();sync(); }
  function field(name: string, value: string, edit: (raw: string) => void, numeric = true) {
    const label = el('label', 'bi-field', name), input = el('input'); input.value = value; input.ariaLabel = name; input.inputMode = numeric ? 'numeric' : 'text';
    input.oninput = () => edit(input.value); label.append(input); return label;
  }
  function group(title: string) { const section = el('section', 'bi-group'); section.dataset.group = title.toLowerCase().replaceAll(' ', '-'); section.append(el('h3','',title)); return section; }
  function error(message: string, label?: string) {
    draft().problem={message,label};panel.querySelectorAll('.bi-error,.bi-field-error').forEach(n=>n.remove());
    let note = el('p','bi-error');note.role='alert';note.textContent=message;panel.querySelector('.bi-apply')!.prepend(note);
    if (variant === 'focus' && label) { tab = label.includes('imum') || label.includes('variable') ? 'binding' : label.includes('image') ? 'appearance' : 'layout'; drawEditor(); panel.querySelector('.bi-body')!.prepend(note); }
    const actionError=drafts.get(kind)?.actions.error;
    const target = label ? panel.querySelector<HTMLElement>(`[aria-label="${label}"]`) : actionError ? panel.querySelector<HTMLElement>(`[data-row-id="${actionError.id}"] [data-part="${actionError.part}"]`) : panel.querySelector<HTMLElement>('.bi-title');
    if(target){
      for(let p=target.parentElement;p&&p!==panel;p=p.parentElement)if(p instanceof HTMLDetailsElement){p.open=true;disclosures.set(`${kind}/${p.dataset.section}`,true);}
      if(label){const inline=el('span','bi-field-error',message);inline.id='bi-current-error';target.setAttribute('aria-invalid','true');target.setAttribute('aria-describedby',inline.id);target.after(inline);}
      const errorUnit=!label&&actionError?(target.closest('.siv-payload')??target.closest('.screen-text-field')):target.closest('.bi-field,.screen-text-field,.bi-state-row');
      (errorUnit??target).scrollIntoView({block:'nearest'});target.focus({preventScroll:true});
    }report(message);
  }
  function picker(title: string, choices: { name: string; url?: string; current?: boolean; choose: () => void }[], trigger: HTMLElement) {
    const dialog = el('dialog','bi-picker'); dialog.ariaLabel = title; const heading = el('h2','',title), search = el('input'); search.ariaLabel = `Search ${title.toLowerCase()}`; search.placeholder = 'Search';
    const list = el('div','bi-pick-list');
    function fill() { list.replaceChildren(); for (const choice of choices.filter(c => c.name.toLowerCase().includes(search.value.toLowerCase()))) { const b = button('', () => { choice.choose(); dialog.close(); });const words=el('span','bi-pick-words');const [name,...meta]=choice.name.split(' · ');words.append(el('span','',name),el('small','',meta.join(' · ')));b.append(words);if(choice.current){b.dataset.current='true';b.append(el('span','bi-current','Current'));} if (choice.url) { const img = el('img'); img.src = choice.url; img.alt = ''; b.prepend(img); } list.append(b); } if (!list.children.length) list.append(el('p','','No matches. Try another name.')); }
    search.oninput = fill; dialog.append(heading, search, list, button('Cancel', () => dialog.close())); fill(); frame.shell.append(dialog);
    dialog.onclose = () => { dialog.remove(); const replacement = trigger.ariaLabel && panel.querySelector<HTMLElement>(`[aria-label="${trigger.ariaLabel}"]`); (replacement || trigger).focus({preventScroll:true}); };
    dialog.showModal(); search.focus();
  }
  function drawEditor(focusLabel?:string) {
    const active=panel.contains(document.activeElement)?document.activeElement as HTMLElement:undefined,focusName=focusLabel??active?.getAttribute('aria-label'),focusText=active?.tagName==='BUTTON'?active.textContent:undefined;
    const scroll = panel.querySelector('.bi-body')?.scrollTop ?? 0;for(const d of panel.querySelectorAll<HTMLDetailsElement>('details[data-section]'))disclosures.set(`${renderedKind??kind}/${d.dataset.section}`,d.open);panel.replaceChildren(); panel.dataset.variant = variant;renderedKind=kind;
    const head = el('header','bi-editor-head'); const title = el('h2','bi-title', `${adding ? 'Add ' : ''}${kind === 'bar' ? 'Value bar' : 'Image button'}`); title.tabIndex = -1;
    head.append(title,el('span','bi-type',kind === 'bar' ? 'Integer binding' : '"Continue"')); panel.append(head);
    if (adding) panel.append(el('p','bi-parent',`Inside ${parent === 'content' ? 'Vertical group' : 'Help frame'} · Selected parent`));
    if (variant === 'focus') { const nav = el('nav','bi-tabs'); nav.ariaLabel = 'Property sections'; for (const name of kind === 'bar' ? ['binding','appearance','layout'] : ['appearance','layout','actions']) { const b = button(name[0]!.toUpperCase()+name.slice(1),()=>{tab=name;drawEditor();}); b.ariaPressed=String(name===tab); nav.append(b); } panel.append(nav); }
    const sectionNav=el('nav','bi-section-nav');sectionNav.ariaLabel='Control property sections';panel.append(sectionNav);
    const body = el('div','bi-body'); panel.append(body);
    if (custom) { body.append(el('p','','This value expression is edited in Source. It cannot be evaluated in the editor.'),button('Open Source',openSource)); return; }
    const value = current();
    const binding = group('Binding');
    const variable = variables.find(v => v.id === value.binding.variableId);
    const chooseVariable = button(variableMissing ? 'Missing integer · Choose…' : `${variable?.technicalName ?? 'Choose variable'} · integer     Change…`,()=>picker('Choose integer variable',variables.filter(v=>v.variableType==='int' && !(variableMissing&&v.id==='coins')).map(v=>({name:`${v.technicalName} · int`,current:v.id===value.binding.variableId,choose:()=>{update(n=>n.binding.variableId=v.id);drawEditor();}})),chooseVariable)); chooseVariable.ariaLabel='Choose integer variable';
    binding.append(chooseVariable); const bounds = el('div','bi-pair'); bounds.append(field('Minimum',value.binding.minimum,s=>update(n=>n.binding.minimum=s)),field('Maximum',value.binding.maximum,s=>update(n=>n.binding.maximum=s))); binding.append(bounds,el('p','bi-help','Whole numbers. The game changes the bound variable in steps of 1.'));
    const appearance = group('Appearance');
    if(kind==='bar') {
      for (const [key,name] of [['leftBar','Filled'],['rightBar','Empty'],['thumb','Thumb']] as const) { const row = el('div','bi-color-row'),swatch=el('span','bi-swatch'),input = field(`${name} color`,value.appearance[key]??'',s=>{update(n=>n.appearance[key]=s||null);swatch.style.background=s||({leftBar:'#c4ab72',rightBar:'#425249',thumb:'#f4e5c2'}[key]);},false);swatch.style.background=value.appearance[key]??({leftBar:'#c4ab72',rightBar:'#425249',thumb:'#f4e5c2'}[key]); input.querySelector('input')!.placeholder='Default';const reset=button('Default',()=>{update(n=>n.appearance[key]=null);drawEditor();});reset.ariaLabel=`Reset ${name.toLowerCase()} color to default`;row.append(swatch,input,reset); appearance.append(row); }
      appearance.append(el('p','bi-help','Use a literal hex color. Blank keeps the project default.'));
    } else {
      appearance.querySelector('h3')!.append(el('span','bi-heading-hint','Click a state to preview'));
      const grid = el('div','bi-state-list');
      for(const [key,name,sourceName] of states) {
        const stateRef=value.appearances[key], asset=assets.find(a=>a.assetId===stateRef?.assetId), row=el('div','bi-state-row');
        row.dataset.state=key;const label=button(name,()=>setSampleState(key));label.className='bi-state-name';label.ariaLabel=`Preview ${name.toLowerCase()} sample`;label.ariaPressed=String(sampleState===key);label.title=`Preview inert sample · Ren'Py ${sourceName}`;if(key==='normal')label.append(el('small','','Required'));
        const choose=button('',()=>{setSampleState(key);picker(`Choose ${name.toLowerCase()} image`,assets.map(a=>({name:`${a.name} · UI image · ${a.width} × ${a.height}`,url:a.url,current:a.assetId===stateRef?.assetId,choose:()=>{update(n=>{n.appearances[key]=ref(assets.indexOf(a));if(key==='normal'&&drafts.get(kind)?.keepRatio&&/^\d+$/.test(n.width))n.height=String(Math.max(1,Math.round(+n.width*a.height/a.width)));});drawEditor();}})),choose);}); choose.ariaLabel=`Choose ${name.toLowerCase()} image`; choose.classList.add('bi-asset');
        if(asset) {const img=el('img');img.src=asset.url;img.alt='';const words=el('span','bi-asset-words');words.append(el('span','bi-file',assetMissing&&key==='normal'?'Missing image':asset.name),el('span','bi-change','Change…'));choose.title=asset.name;choose.append(img,words);} else {const resolved=resolvedAppearance(value.appearances,key),inherited=assets.find(a=>a.assetId===resolved.reference.assetId),img=el('img'),words=el('span','bi-asset-words');img.src=inherited?.url??'';img.alt='';img.className='bi-inherited-image';words.append(el('span','bi-native',`Uses ${fallbackLabel(key)}`),el('span','bi-change','Choose…'));choose.append(img,words); choose.title=`Native fallback: ${fallbackLabel(key)}`; }
        row.append(label,choose);if(key!=='normal'&&stateRef){const clear=button('×',()=>{update(n=>n.appearances[key]=null);setSampleState(key);drawEditor(`Choose ${name.toLowerCase()} image`);});clear.ariaLabel=`Clear ${name.toLowerCase()} image`;clear.title=`Use native fallback for ${name.toLowerCase()}`;row.append(clear);} grid.append(row);
      }
      appearance.append(grid);
    }
    const displayed=group('Displayed size'),layout=group('Layout'),sizes=el('div','bi-pair');
    const dimension=(key:'width'|'height',raw:string)=>{update(n=>{n[key]=raw;const normal=assets.find(a=>a.assetId===n.appearances.normal.assetId);if(kind==='button'&&drafts.get(kind)?.keepRatio&&normal&&/^\d+$/.test(raw)&&+raw>0)n[key==='width'?'height':'width']=String(Math.max(1,Math.round(+raw*(key==='width'?normal.height/normal.width:normal.width/normal.height))));});const peer=panel.querySelector<HTMLInputElement>(`[aria-label="${key==='width'?'Height':'Width'}"]`);if(peer)peer.value=current()[key==='width'?'height':'width'];};
    sizes.append(field('Width',value.width,s=>dimension('width',s)),field('Height',value.height,s=>dimension('height',s)));displayed.append(sizes);
    if(kind==='button'){const keep=el('label','bi-check'),check=el('input');check.type='checkbox';check.checked=drafts.get(kind)?.keepRatio??false;check.onchange=()=>{draft().keepRatio=check.checked;sync();};keep.title='Link edits to the current Normal image ratio. All explicit states use the same displayed dimensions.';keep.append(check,el('span','','Preserve normal image aspect ratio'));displayed.append(keep);}
    const position=el('div','bi-pair'),vertical=field('Vertical position','From vertical group',()=>{});vertical.querySelector('input')!.readOnly=true;position.append(field('Horizontal position',value.x,s=>update(n=>n.x=s)),vertical);layout.append(position,el('p','bi-help','Position in pixels. Vertical placement follows the group.'));
    const actions=group('Actions');if(kind==='button'){const actionHost=el('div');actions.append(actionHost);const d=drafts.get(kind),ad=d?.actions??actionDraft(value.actions);renderActions(actionHost,ad,interaction(),false,()=>{const entry=draft();clearProblem();entry.actions=ad;try{entry.value.actions=prepareInteraction(interaction(),ad).actions??[];}catch{}sync();});}
    const groups = kind==='bar' ? [['binding',binding],['appearance',appearance],['size',displayed],['layout',layout]] as const : [['appearance',appearance],['size',displayed],['layout',layout],['actions',actions]] as const;
    if (variant==='focus'&&!groups.some(([id])=>id===tab)) tab=groups[0]![0];
    for(const [name,section]of groups){
      if(variant==='focus'&&name!==tab)continue;
      section.dataset.sectionTarget=name;let container:HTMLElement=section;
      if(variant==='inspector'&&['size','layout'].includes(name)){
        const detail=el('details','bi-disclosure'),key=`${kind}/${name}`;detail.dataset.section=name;
        detail.open=disclosures.get(key)??name==='size';
        const summary=el('summary');summary.append(el('span','',name==='size'?'Displayed size':'Layout'),el('span','bi-section-value',name==='size'?`${value.width} × ${value.height} px`:'From current group'));
        detail.append(summary,section);detail.ontoggle=()=>{if(detail.isConnected)disclosures.set(key,detail.open);};container=detail;
      }
      body.append(container);if(name==='layout')continue;
      const jump=button(name==='actions'?`Actions (${value.actions.length})`:name==='size'?'Position & size':name[0]!.toUpperCase()+name.slice(1),()=>{
        if(container instanceof HTMLDetailsElement){container.open=true;disclosures.set(`${kind}/${name}`,true);}
        container.scrollIntoView({block:'nearest'});(container.querySelector<HTMLElement>('input,select,button')??container.querySelector<HTMLElement>('summary'))?.focus({preventScroll:true});
      });jump.dataset.sectionNav=name;sectionNav.append(jump);
    }
    const footer=el('footer','bi-apply');footer.append(button('Cancel',()=>{drafts.delete(kind);adding=false;drawEditor();sync();report('Changes cancelled. Accepted configuration is unchanged.');}),button('Apply changes',apply,true)); panel.append(footer);
    const status=el('p','bi-draft-state');status.ariaLive='polite';footer.prepend(status);body.scrollTop=scroll;sync();
    if(active||focusLabel){const replacement=[...panel.querySelectorAll<HTMLElement>('button,input,select,summary')].find(n=>focusName?n.getAttribute('aria-label')===focusName:focusText&&n.textContent===focusText);if(replacement&&!(replacement as HTMLButtonElement).disabled)replacement.focus({preventScroll:true});else title.focus({preventScroll:true});}
    const problem=drafts.get(kind)?.problem;if(problem)error(problem.message,problem.label);
  }
  function apply() {
    const d=drafts.get(kind);if(!d){report('No changes. No history entry added.');return;}
    const v=d.value;
    if(kind==='bar') {
      if(variableMissing&&v.binding.variableId==='coins')return error('Coins is missing or no longer an integer. Choose an existing integer. Your draft is retained.','Choose integer variable');
      for(const key of ['minimum','maximum'] as const){const raw=v.binding[key];if(!/^(0|-[1-9][0-9]*|[1-9][0-9]*)$/.test(raw))return error('Use a whole decimal number. Your draft is retained.',key==='minimum'?'Minimum':'Maximum');}
      if(BigInt(v.binding.maximum)<=BigInt(v.binding.minimum))return error('Maximum must be greater than Minimum. Your draft is retained.','Maximum');
      for(const [key,name] of [['leftBar','Filled'],['rightBar','Empty'],['thumb','Thumb']] as const)if(v.appearance[key]&&!/^#(?:[\da-fA-F]{3,4}|[\da-fA-F]{6}|[\da-fA-F]{8})$/.test(v.appearance[key]!))return error('Use a literal hex color or leave it blank.',`${name} color`);
    } else {
      if(assetMissing&&v.appearances.normal.assetId===ref(0).assetId)return error('Normal image is missing. Choose another UI image. Your draft is retained.','Choose normal image');
      try{v.actions=prepareInteraction({...interaction(),authoringRevision:d.authoring},d.actions).actions??[];}catch(e){tab='actions';drawEditor();return error((e as Error).message);}
    }
    for(const key of ['width','height'] as const)if(!/^\d+$/.test(v[key])||+v[key]<1||+v[key]>16384)return error('Use a whole pixel size from 1 to 16384. Your draft is retained.',key==='width'?'Width':'Height');
    if(!/^-?\d+$/.test(v.x)||!Number.isSafeInteger(Number(v.x))||Number(v.x)<-16384||Number(v.x)>16384)return error('Use a whole pixel position from -16384 to 16384. Your draft is retained.','Horizontal position');
    if(d.authoring!==authoring)return error('Variables changed after this draft started. Review Source or Cancel. Your draft is retained.',kind==='bar'?'Choose integer variable':undefined);
    if(sourceChanged||d.revision!==revision)return error('Source changed after this draft started. Review Source or Cancel. Your draft is retained.');
    if(equal(v,accepted[kind])&&!adding){drafts.delete(kind);drawEditor();report('No changes. No history entry added.');return;}
    past.push({kind,before:clone(accepted[kind]),after:clone(v)});future.length=0;accepted[kind]=clone(v);drafts.delete(kind);revision=`sample-${past.length+1}`;adding=false;drawEditor();sync();report('Applied appearance, actions and layout together. One history entry. No game actions ran.');
  }
  function sync() {
    const status=panel.querySelector('.bi-draft-state'),pending=drafts.get(kind),changes:string[]=[];if(pending){const before=accepted[kind],after=pending.value;if(kind==='button'){for(const[key,name]of states)if(!equal(before.appearances[key],after.appearances[key]))changes.push(`${name} image`);if(pending.actions.touched)changes.push('Actions');}else {if(!equal(before.binding,after.binding))changes.push('Binding');if(!equal(before.appearance,after.appearance))changes.push('Colors');}if(before.width!==after.width||before.height!==after.height)changes.push('Size');if(before.x!==after.x)changes.push('Position');}const message=pending?(changes.length?`Unsaved: ${changes.join(', ')}`:'No value changes'):'No pending changes';if(status&&status.textContent!==message)status.textContent=message;for(const b of panel.querySelectorAll<HTMLButtonElement>('.bi-apply button'))b.disabled=!pending;
    inspection.dataset.capturedRevision=drafts.get(kind)?.revision??revision;inspection.dataset.capturedAuthoring=drafts.get(kind)?.authoring??authoring;
    const count=drafts.get(kind)?.actions.rows.length??current().actions.length,actionNav=panel.querySelector('[data-section-nav="actions"]'),sizeCount=panel.querySelector('details[data-section="size"] .bi-section-value');if(actionNav&&actionNav.textContent!==`Actions (${count})`)actionNav.textContent=`Actions (${count})`;const dimensions=`${current().width} × ${current().height} px`;if(sizeCount&&sizeCount.textContent!==dimensions)sizeCount.textContent=dimensions;
    const stage=workspace?.panel.querySelector('.screen-stage');if(stage&&!stage.contains(samples)){stage.querySelector('.screen-viewport')?.after(samples);stage.append(inspection);}
    const image=workspace?.panel.querySelector<HTMLImageElement>('.screen-render');if(image){const src=canvasSample();if(image.src!==src)image.src=src;}
    if(sampleKind!==kind)drawSamples();const stateSelect=workspace?.panel.querySelector<HTMLSelectElement>('[aria-label="Button sample state"]');if(stateSelect)stateSelect.hidden=kind==='bar';
    const actual=resolvedAppearance((kind==='button'?current():accepted.button).appearances,sampleState),caption=workspace?.panel.querySelector('.screen-canvas-status'),text=kind==='button'?`Editor sample · ${stateLabel(sampleState)}${actual.state===sampleState?' · Own image':` · Uses ${stateLabel(actual.state)}`} · No actions run`:'Editor sample · No game values change';if(caption&&caption.textContent!==text)caption.textContent=text;
    const jump=workspace?.panel.querySelector('.screen-stage .screen-compose-jump');if(jump&&jump.textContent!=='Edit control')jump.textContent='Edit control';
    for(const row of panel.querySelectorAll<HTMLElement>('[data-state]')){const active=row.dataset.state===sampleState;row.dataset.sampled=String(active);row.querySelector('.bi-state-name')?.setAttribute('aria-pressed',String(active));}
    const game=workspace?.panel.querySelector<HTMLElement>('.screen-game');if(game){const scale=game.clientWidth/1280;for(const [id,type]of [['body','bar'],['close','button']]as const){const index=doc.screens[0]!.nodes.findIndex(n=>n.id===id),g=controlGeometry(type);for(const node of game.querySelectorAll<HTMLElement>(`.screen-node[data-index="${index}"]`)){for(const [key,n]of Object.entries({left:g.x,top:g.y,width:g.width,height:g.height}))node.style.setProperty(key,`${n*scale}px`);if(node.ariaPressed==='true'){const outline=game.querySelector<HTMLElement>('.screen-selection');if(outline)for(const key of ['left','top','width','height'])outline.style.setProperty(key,node.style.getPropertyValue(key));}}}}
  }
  function setSampleState(state:State){sampleState=state;const select=workspace?.panel.querySelector<HTMLSelectElement>('[aria-label="Button sample state"]');if(select)select.value=state;sync();}
  function controlGeometry(type:Kind){const value=kind===type?current():accepted[type],x=Number(value.x),offset=Number.isInteger(x)&&x>=-16384&&x<=16384?x:Number(accepted[type].x),dimension=(key:'width'|'height')=>{const n=Number(value[key]);return Number.isInteger(n)&&n>=1&&n<=16384?n:Number(accepted[type][key]);};return{x:166+offset,y:type==='bar'?320:425,width:dimension('width'),height:dimension('height')};}
  function canvasSample() {
    const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;const c=canvas.getContext('2d')!;c.fillStyle='#182422';c.fillRect(0,0,1280,720);c.fillStyle='#273832';c.fillRect(100,65,1080,590);c.fillStyle='#eeddb8';c.font='600 40px sans-serif';c.fillText('Help',166,156);c.font='26px sans-serif';c.fillText('Choose a route. The last tram leaves at midnight.',166,215);c.font='22px sans-serif';c.fillText(`Fare credits · ${sampleValue}`,166,295);
    const b=kind==='bar'?current():accepted.bar;const raw=Number(sampleValue),min=Number(b.binding.minimum),max=Number(b.binding.maximum),ratio=Math.max(0,Math.min(1,(raw-min)/(max-min)))||0;const bg=controlGeometry('bar'),w=bg.width,h=bg.height;c.fillStyle=b.appearance.rightBar??'#425249';c.fillRect(bg.x,bg.y,w,h);c.fillStyle=b.appearance.leftBar??'#c4ab72';c.fillRect(bg.x,bg.y,w*ratio,h);c.fillStyle=b.appearance.thumb??'#f4e5c2';c.fillRect(bg.x+w*ratio-4,bg.y-2,8,h+4);
    const v=kind==='button'?current():accepted.button,resolved=resolvedAppearance(v.appearances,sampleState),assetIndex=assets.findIndex(a=>a.assetId===resolved.reference.assetId),img=bitmaps[assetIndex];
    const vg=controlGeometry('button');if(img?.complete&&img.naturalWidth)c.drawImage(img,vg.x,vg.y,vg.width,vg.height);else {c.fillStyle='#354644';c.fillRect(vg.x,vg.y,vg.width,vg.height);c.fillStyle='#eeddb8';c.fillText('CONTINUE →',vg.x+19,vg.y+41);}
    return canvas.toDataURL('image/png');
  }
  function drawSamples() {
    sampleKind=kind;samples.replaceChildren();samples.hidden=kind==='button';if(kind==='button')return;samples.append(el('h3','','Editor sample'));
    const row=el('div','bi-sample-fields');row.append(field('Sample value',sampleValue,s=>{sampleValue=s;sync();}));
    samples.append(row,el('p','bi-help','Editor only. No game values change.'));
  }
  function openSource() {
    const trigger=document.activeElement as HTMLElement,dialog=el('dialog','bi-picker');dialog.ariaLabel='Accepted sample configuration';
    dialog.append(el('h2','','Source review'),el('p','','Accepted fictional configuration. Pending edits stay in the inspector. Production uses the existing source editor and minimal source patches.'),el('pre','',JSON.stringify(accepted[kind],null,2)),button('Back to editing',()=>dialog.close()));dialog.onclose=()=>{dialog.remove();trigger?.focus();};frame.shell.append(dialog);dialog.showModal();
  }
  function choose(next:Kind) {kind=next;adding=false;tab=kind==='bar'?'binding':'appearance';showProperties=false;workspace.panel.querySelector<HTMLButtonElement>('.screen-steps button')?.click();const row=workspace.panel.querySelector<HTMLElement>(`[data-node-id="${kind==='bar'?'body':'close'}"]`);if(row){entered=true;row.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));showProperties=true;}drawEditor();install();sync();}
  function install(){
    if(!entered){const row=workspace.panel.querySelector<HTMLElement>(`[data-node-id="${kind==='bar'?'body':'close'}"]`);if(row){entered=true;row.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));}}
    const card=workspace.panel.querySelector<HTMLElement>('.screen-card');if(entered&&showProperties&&card&&!card.contains(panel)){card.replaceChildren(panel);card.className='screen-card bi-card';}workspace.panel.dataset.biVariant=variant;sync();
  }
  function mountWorkspace() {
    workspace?.panel.remove();entered=false;workspace=new ScreensWorkspace({projectId:'bars-imagebuttons-sample',resolution:{width:1280,height:720},current:()=>!disposed,coordinate:task=>task(),source:openSource,preview:()=>report('Use deliberate Test in Ren\'Py in the app. This prototype never starts it.'),saved:()=>{},request:async<T>(op:string,p:Record<string,unknown>={}):Promise<T>=>{
      if(op==='source.list')return {files:data.documents.map(d=>({path:d.path}))}as T;
      if(op==='screens.list')return {projectRevision:revision,sourceMapRevision:'map-1',inventoryRevision:'sample',owned:data.documents.map((d,i)=>({id:d.screens[0]!.name,rootId:'root',name:d.screens[0]!.name,path:d.path,kind:i?'panel':'dialog',resolved:true,sourceRevision:d.revision}))}as T;
      if(op==='screens.inspect')return clone(data.documents.find(d=>d.path===p.path))as T;
      if(op==='authoring.list')return {assets:[],variables}as T;
      if(op==='screens.resolveTarget')return interaction().targets.find(t=>t.binding.screenId===(p.binding as {screenId:string}).screenId)as T;
      if(op==='screens.canvasRender'){const result=render(doc,p);for(const g of result.geometry){const node=doc.screens[0]!.nodes.find(n=>n.span.start===g.start);if(node?.id==='body')Object.assign(g,controlGeometry('bar'));if(node?.id==='close')Object.assign(g,controlGeometry('button'));}return {...result,image:canvasSample()}as T;}
      if(op==='source.open')return {path:doc.path,text:JSON.stringify(accepted,null,2),dirty:false,baseRevision:revision,hasBom:false}as T;
      throw Error(`This prototype refuses ${op}.`);
    }});workspace.mount(frame.content);workspace.panel.addEventListener('dblclick',event=>{const id=(event.target as HTMLElement).closest<HTMLElement>('[data-node-id]')?.dataset.nodeId;if(id==='body'||id==='close'){kind=id==='body'?'bar':'button';showProperties=true;drawEditor();}});
    workspace.panel.addEventListener('click',event=>{const target=(event.target as HTMLElement).closest<HTMLButtonElement>('.screen-steps button');if(target){showProperties=target.textContent?.includes('Design')??false;}},{capture:true});
    const nativeState=workspace.panel.querySelector<HTMLSelectElement>('[aria-label="Button state (sample)"]');if(nativeState){const previous=nativeState.onchange;nativeState.ariaLabel='Button sample state';nativeState.replaceChildren();for(const[id,name]of states){const option=el('option','',`Sample: ${name}`);option.value=id;nativeState.append(option);}nativeState.value=sampleState;nativeState.onchange=event=>{setSampleState(nativeState.value as State);previous?.call(nativeState,event);};nativeState.hidden=kind==='bar';}
    workspace.panel.addEventListener('click',event=>{const target=(event.target as HTMLElement).closest<HTMLElement>('.screen-node');if(!target)return;const id=doc.screens[0]!.nodes[Number(target.dataset.index)]?.id;if(id==='body'||id==='close'){event.preventDefault();event.stopImmediatePropagation();choose(id==='body'?'bar':'button');}},{capture:true});
    observer?.disconnect();observer?.observe(workspace.panel,{childList:true,subtree:true});
    drawSamples();setTimeout(()=>{if(!disposed)choose(kind);},0);
  }
  function showWorkspace(){frame.content.style.display='';frame.shell.querySelector('.bi-away')?.remove();install();report('Returned to Screens. Drafts and captured revisions are retained.');}
  frame.shell.addEventListener('click',event=>{
    const target=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!target)return;
    const navTarget=target.closest('.lp-navigation');if(navTarget&&target!==nav&&!target.classList.contains('lp-nav-toggle')){event.preventDefault();event.stopImmediatePropagation();frame.content.style.display='none';const away=el('div','bi-away');away.append(el('h2','','Another workspace'),el('p','','Pending Screens drafts stay in this session.'),button('Back to Screens',showWorkspace));frame.main.append(away);return;}
    if(target.closest('.screen-tools')){if(target.textContent==='View in Source'){event.preventDefault();event.stopImmediatePropagation();openSource();}else if(/Undo|Redo/.test(target.textContent??'')){event.preventDefault();event.stopImmediatePropagation();if(drafts.size){report('Apply or Cancel pending edits before history. Your draft is retained.');return;}const undo=target.textContent==='Undo',from=undo?past:future,to=undo?future:past,entry=from.pop();if(entry){accepted[entry.kind]=clone(undo?entry.before:entry.after);to.push(entry);revision=`history-${Date.now()}`;drawEditor();sync();report(`${undo?'Undid':'Redid'} one accepted change.`);}else report('No history in that direction.');}}
  },{capture:true});
  mountWorkspace();
  const switcher=el('nav','bi-switcher');switcher.ariaLabel='Prototype control samples';
  switcher.append(el('span','','Prototype samples'),button('Value bar',()=>choose('bar')),button('Image button',()=>choose('button')),button('Add…',()=>{adding=true;draft();drawEditor();report('New control uses the selected qualified parent. Apply inserts once.');}));frame.shell.querySelector('.lp-sample')!.replaceWith(switcher);
  observer=new MutationObserver(()=>{if(!disposed)install();});observer.observe(workspace.panel,{childList:true,subtree:true});
  drawEditor();if(context.state==='invalid')update(n=>n.binding.maximum='0');if(context.state==='stale'||context.state==='missing-asset'||context.state==='missing-variable')draft();
  return()=>{disposed=true;observer.disconnect();workspace.dispose();};
}
