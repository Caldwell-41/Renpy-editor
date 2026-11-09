import type { ScreenDocument, ScreenNode } from './screen-ui.ts';
import type { CompositionView, CompositionCommand, CopyDraftParticipant } from './screen-composition.ts';
import type { IntegerBarBinding, BarAppearance, ScreenControlCommand, BarSample, BarAddition, ImageButtonAppearances, ImageButtonSample, ImageButtonAddition, ControlButtonState } from './screen-controls.ts';
import { showActionRefusal, actionDraft, prepareInteraction, renderActions, captureActionFocus, restoreActionFocus, type ActionDraft, type InteractionContext } from './screen-interactions.ts';
import type { ScreenLayoutEditor, LayoutReservation } from './screen-layout.ts';
import type { ScreenImages } from './screen-images.ts';
import { validateField } from './authoring-input.ts';
import type { AuthoringRevisionChange } from './screen-contracts.ts';

interface Draft {
  key:string; document:ScreenDocument; screenId:string; node?:ScreenNode; parentId:string;
  binding:IntegerBarBinding; appearance:BarAppearance; width:string; height:string;
  context?:InteractionContext; problem?:{text:string;field?:string;validation?:boolean}; invalidFields?:Set<string>; focus?:string;
  caret?:{start:number|null;end:number|null};
  kind:'bar'|'imagebutton'; appearances?:Partial<ImageButtonAppearances>; actions?:ActionDraft; keepRatio?:boolean;
  normalSize?:{assetId:string;sha256:string;width:number;height:number};
}
interface Host {
  validateActions?:import("./screen-interactions.ts").ValidateScreenActions;
  view:()=>CompositionView|undefined; interaction:()=>InteractionContext|undefined;
  commit:(command:CompositionCommand,base:ScreenDocument)=>Promise<void>;
  redraw:()=>void; preview:()=>void; note:(text:string,error?:boolean)=>void;
  select:(id:string,design?:boolean)=>void; source:()=>void;
  writeBlocked:()=>boolean; cancelCopy:()=>void; order:(host:HTMLElement)=>void; layoutTools:(host:HTMLElement)=>void;
  sample:(state:ControlButtonState)=>void; current:()=>boolean;
  imported:(change:AuthoringRevisionChange,base:ScreenDocument)=>boolean;
}
const el=<K extends keyof HTMLElementTagNameMap>(tag:K,cls='',text='')=>{const n=document.createElement(tag);n.className=cls;n.textContent=text;return n;};
const button=(text:string,run:()=>void,primary=false)=>{const b=el('button',`button ${primary?'primary':'secondary'}`,text);b.type='button';b.onclick=run;return b;};
const size=(node:ScreenNode|undefined,key:'xsize'|'ysize',fallback:number)=>String(node?.numericLayout?.values[key]?.value??node?.properties.find(p=>p.property===key)?.value??fallback);
const validSize=(raw:string)=>/^[1-9]\d*$/.test(raw)&&Number(raw)<=16384;
export const controlSampleStates:[ControlButtonState,string][]=[['normal','Normal'],['hover','Hover'],['selected','Selected'],['selectedHover','Selected + hover'],['disabled','Disabled'],['selectedDisabled','Selected + disabled']];
const chains:Record<keyof ImageButtonAppearances,(keyof ImageButtonAppearances)[]>={normal:['normal'],hover:['hover','normal'],selected:['selected','normal'],selectedHover:['selectedHover','hover','normal'],disabled:['disabled','normal'],selectedDisabled:['selectedDisabled','disabled','normal']};

/** Control drafts capture source and variable revisions once. Workspace owns accepted writes. */
export class ScreenControlEditor {
  private readonly drafts=new Map<string,Draft>();
  private addition?:Draft;
  private mounted?:Draft;
  private card?:HTMLElement;
  private sampleState:ControlButtonState='normal';
  private preparing=false;
  private disposed=false;
  private submitted?:{draft:Draft;command:ScreenControlCommand;layout:LayoutReservation};
  private readonly validators=new Map<string,()=>void>();
  private readonly expanded=new Map<string,boolean>();
  constructor(private readonly host:Host,private readonly layout:ScreenLayoutEditor,private readonly images:ScreenImages){}
  private key(view:CompositionView){return `${view.screenId}:${view.selected.id}`;}
  hasDraft(){return !!this.addition||this.drafts.size>0;}
  hasAddition(){return !!this.addition;}
  isSaving(){return this.preparing||!!this.submitted;}
  hasNodeDraft(screenId:string,nodeId:string){return this.drafts.has(`${screenId}:${nodeId}`);}
  setSampleState(state:ControlButtonState){this.sampleState=state;for(const row of this.card?.querySelectorAll<HTMLElement>('[data-control-state]')??[]){const active=row.dataset.controlState===state;row.dataset.sampled=String(active);row.querySelector('button')?.setAttribute('aria-pressed',String(active));}}
  hasActionDraft(){return [...this.drafts.values()].some(d=>d.actions?.touched);}
  captureCopyDraft(view:CompositionView,trackNewDrafts=false):CopyDraftParticipant|undefined{
    const currentKeys=()=>[...this.drafts.values()].filter(d=>d.screenId===view.screenId&&d.document.path===view.document.path).map(d=>d.key);
    const captured=currentKeys(),keys=()=>trackNewDrafts?currentKeys():captured;if(!captured.length&&!trackNewDrafts)return;
    const read=()=>keys().map(key=>{const d=this.drafts.get(key);if(!d?.node||d.document.revision!==view.document.revision||!view.nodes.some(n=>n.id===d.node!.id))throw Error('The control draft changed its Source target. Input retained.');this.validate(d);if(d.actions?.touched)throw Error('Apply or cancel action edits before copying. Input retained.');return d;});
    return {validate:()=>{read();},prepare:(fresh,nodeIds)=>{
      const transfers=read().map(d=>{const node=fresh.nodes.find(n=>n.id===nodeIds.get(d.node!.id!));if(!node||node.kind!==d.kind)throw Error('The copied control target is unavailable. Input retained.');const key=`${fresh.screenId}:${node.id}`;if(this.drafts.has(key))throw Error('The copied control already has a draft. Input retained.');return {original:d.key,draft:{...structuredClone(d),key,document:fresh.document,screenId:fresh.screenId,node,parentId:fresh.nodes.find(n=>n.span.start===node.parentStart)?.id??''}};});
      return ()=>{for(const {original,draft}of transfers){this.drafts.delete(original);this.drafts.set(draft.key,draft);}};
    },cancel:()=>{for(const key of keys())this.drafts.delete(key);}};
  }
  renderRetained(host:HTMLElement,documents:ScreenDocument[]){
    const retained=[...this.drafts.entries(),...(this.addition?[[this.addition.key,this.addition] as const]:[])];
    for(const [,d]of retained){const available=documents.some(doc=>doc.path===d.document.path&&doc.screens.some(s=>s.nodes.some(n=>n.id===(d.node?.id??d.parentId))));if(available)continue;
      const section=el('section','screen-retained-draft');section.append(el('p','','The control is no longer available in Source. Your unfinished values are retained.'));
      const input=el('textarea');input.readOnly=true;input.setAttribute('aria-label','Retained control draft');input.value=JSON.stringify({binding:d.kind==='bar'?d.binding:undefined,appearance:d.kind==='bar'?d.appearance:undefined,appearances:d.appearances,width:d.width,height:d.height,actions:d.actions?.rows},null,2);
      section.append(input,button('Discard retained control draft',()=>{this.discard(d);this.host.redraw();this.host.preview();}));host.append(section);
    }
  }
  dispose(){this.disposed=true;this.card=undefined;}
  unmount(){const active=document.activeElement;if(this.card?.contains(active)){const view=this.host.view(),d=this.mounted;if(view&&d){if(active instanceof HTMLInputElement){d.focus=active.getAttribute('aria-label')??undefined;d.caret={start:active.selectionStart,end:active.selectionEnd};}const section=this.card.querySelector<HTMLElement>('.siv-actions');if(section&&d.actions){captureActionFocus(section,d.actions);if(section.contains(active))d.focus=undefined;}}}this.card=undefined;if(this.mounted&&!this.drafts.has(this.mounted.key)&&this.addition!==this.mounted)this.mounted=undefined;}
  begin(parentId:string,document:ScreenDocument,kind:'bar'|'imagebutton'){
    const view=this.host.view();if(!view||view.busy||this.submitted)return;
    this.addition={key:`${view.screenId}:new-${kind}`,kind,document,screenId:view.screenId,parentId,binding:{variableId:'',minimum:'0',maximum:'100'},appearance:{leftBar:null,rightBar:null,thumb:null},width:kind==='bar'?'360':'240',height:kind==='bar'?'24':'64',context:structuredClone(this.host.interaction()),...(kind==='imagebutton'?{appearances:{hover:null,selected:null,selectedHover:null,disabled:null,selectedDisabled:null},actions:actionDraft([])}:{})};
    this.host.redraw();this.focus('Choose integer variable');this.host.preview();
  }
  private value(view:CompositionView):Draft {
    if(this.addition)return this.addition;
    return this.drafts.get(this.key(view))??(this.mounted?.key===this.key(view)?this.mounted:undefined)??{
      key:this.key(view),kind:view.selected.kind as Draft['kind'],document:view.document,screenId:view.screenId,node:view.selected,parentId:view.nodes.find(n=>n.span.start===view.selected.parentStart)?.id??'',
      ...(view.selected.kind==='imagebutton'?{appearances:structuredClone(view.selected.imageButtonAppearances??{}),...(view.selected.actions?{actions:actionDraft(view.selected.actions)}:{})}:{}),
      binding:structuredClone(view.selected.barBinding??{variableId:'',minimum:'0',maximum:'100'}),appearance:structuredClone(view.selected.barAppearance??{leftBar:null,rightBar:null,thumb:null}),width:size(view.selected,'xsize',360),height:size(view.selected,'ysize',24),context:structuredClone(this.host.interaction())};
  }
  private store(draft:Draft){if(!draft.node)this.addition=draft;else this.drafts.set(draft.key,draft);if(draft.problem?.validation){if(draft.problem.field){try{this.validate(draft,draft.problem.field);draft.problem=undefined;}catch(error){if(draft.problem)draft.problem.text=(error as {text:string}).text;}}else if(!draft.actions?.error)draft.problem=undefined;}this.showProblem(draft);this.sync();this.host.preview();}
  synthetic(view:CompositionView):ScreenNode|undefined {
    const d=this.addition;if(!d||d.screenId!==view.screenId)return;
    const parent=view.nodes.find(n=>n.id===d.parentId),start=1+Math.max(...view.nodes.map(n=>n.span.end));
    const blocked:Record<string,string>={};for(const key of parent?.kind==='vbox'?['ypos','yanchor']:parent?.kind==='hbox'?['xpos','xanchor']:parent?.kind==='grid'?['xpos','ypos','xanchor','yanchor']:[])blocked[key]='The parent controls this placement.';
    return {id:d.key,kind:d.kind,literal:null,span:{start,end:start},parentStart:parent?.span.start??null,layout:{},properties:[],protected:[],numericLayout:{values:{},blocked}};
  }
  layoutNodes(view:CompositionView){const node=this.synthetic(view);return node?[...view.nodes,node]:view.nodes;}
  render(card:HTMLElement,view:CompositionView):boolean {
    if(!this.addition&&!['bar','imagebutton'].includes(view.selected.kind))return false;
    this.card=card;this.validators.clear();const d=this.value(view);this.mounted=d;
    const oldScroll=card.querySelector('.sce-body')?.scrollTop??0;
    card.replaceChildren();card.classList.add('screen-control-card');
    const title=el('h2','sce-title',`${d.node?'':'Add '}${d.kind==='bar'?'Value bar':'Image button'}`);title.tabIndex=-1;
    const nav=el('nav','sce-nav');nav.ariaLabel='Control property sections';
    const body=el('div','sce-body');card.append(title,nav,body);
    if(!this.addition&&(d.kind==='bar'?(!d.node?.barBinding||!d.node?.barAppearance):!d.node?.imageButtonAppearances)){
      body.append(el('p','','This control is edited in Source. Your project code is never evaluated here.'),button('View in Source',this.host.source));this.host.layoutTools(body);return true;
    }
    const group=(name:string,disclosure=false)=>{
      const section=el('section','sce-group');section.append(el('h3','',name));section.dataset.section=name;let container:HTMLElement=section;
      if(disclosure){const detail=el('details','sce-disclosure');detail.open=this.expanded.get(`${d.key}:${name}`)??name==='Displayed size';const summary=el('summary','',name);if(name==='Displayed size')summary.append(el('span','sce-size-summary',`${d.width} \u00d7 ${d.height} px`));detail.append(summary,section);section.querySelector('h3')!.hidden=true;detail.ontoggle=()=>{if(detail.isConnected)this.expanded.set(`${d.key}:${name}`,detail.open);};container=detail;}
      body.append(container);const jump=button(name==='Displayed size'?'Position & size':name==='Actions'?`Actions (${d.actions?.rows.length??0})`:name,()=>{if(container instanceof HTMLDetailsElement)container.open=true;container.scrollIntoView({block:'nearest'});container.querySelector<HTMLElement>('input,select,button')?.focus({preventScroll:true});});jump.dataset.sectionJump=name;if(name!=='Layout')nav.append(jump);return section;
    };
    const field=(parent:HTMLElement,name:string,raw:string,edit:(raw:string)=>void)=>{
      const label=el('label','sce-field',name),input=el('input');input.type='text';input.setAttribute('aria-label',name);input.value=raw;input.inputMode='numeric';input.onfocus=()=>{d.focus=name;};input.addEventListener('input',()=>{edit(input.value);this.store(d);});label.append(input);parent.append(label);this.registerField(input,d,name);return input;
    };
    if(d.kind==='bar'){
    const binding=group('Binding'),choose=el('select');choose.setAttribute('aria-label','Choose integer variable');choose.onfocus=()=>{d.focus='Choose integer variable';};
    const variables=d.context?.variables.filter(v=>v.variableType==='int')??[];
    if(!variables.some(v=>v.id===d.binding.variableId)){const option=el('option','',d.binding.variableId?'Original integer unavailable':'Choose an existing integer');option.value=d.binding.variableId;choose.append(option);}
    for(const variable of variables){const option=el('option','',variable.technicalName);option.value=variable.id;choose.append(option);}choose.value=d.binding.variableId;choose.addEventListener('change',()=>{d.binding.variableId=choose.value;this.store(d);});
    this.registerField(choose,d,'Choose integer variable');
    const label=el('label','sce-field','Integer variable');label.append(choose);binding.append(label);
    const bounds=el('div','sce-pair');field(bounds,'Minimum',d.binding.minimum,raw=>d.binding.minimum=raw);field(bounds,'Maximum',d.binding.maximum,raw=>d.binding.maximum=raw);binding.append(bounds);
    const appearance=group('Appearance');
    for(const [key,name]of [['leftBar','Filled'],['rightBar','Empty'],['thumb','Thumb']]as const){const row=el('div','sce-color'),swatch=el('span','sce-swatch');swatch.style.background=d.appearance[key]??'';const input=field(row,`${name} color`,d.appearance[key]??'',raw=>{d.appearance[key]=raw||null;swatch.style.background=raw;});input.inputMode='text';input.placeholder='Default';row.prepend(swatch);const reset=button('Default',()=>{d.appearance[key]=null;this.store(d);this.host.redraw();this.focus(`${name} color`);});reset.ariaLabel=`Reset ${name.toLowerCase()} color to default`;row.append(reset);appearance.append(row);}
    }else{
      const appearance=group('Appearance');appearance.classList.add('sce-image-appearance');appearance.querySelector('h3')!.hidden=true;
      for(const [key,name]of controlSampleStates){const row=el('div','sce-image-state'),sample=button(name,()=>{this.setSampleState(key);this.host.sample(key);}),choose=button('',()=>{d.focus=`Choose ${name.toLowerCase()} image`;this.setSampleState(key);this.host.sample(key);void this.images.chooseReference(d.appearances?.[key]??undefined,`${d.key}:${key}`,choose,()=>{const current=this.host.view();return !!current&&this.value(current).key===d.key;},(reference,asset,change)=>{if(change&&d.context?.authoringRevision===change.before&&this.host.imported(change,d.document))d.context.authoringRevision=change.after;d.appearances![key]=reference;if(key==='normal'&&asset.naturalWidth&&asset.naturalHeight)d.normalSize={assetId:reference.assetId,sha256:reference.replacementSha256??reference.expectedAssetSha256,width:asset.naturalWidth,height:asset.naturalHeight};if(key==='normal'&&d.keepRatio&&asset.naturalWidth&&asset.naturalHeight&&validSize(d.width))d.height=String(Math.max(1,Math.round(Number(d.width)*asset.naturalHeight/asset.naturalWidth)));this.store(d);this.host.redraw();this.focus(d.focus);},d.context?.authoringRevision);});
        row.dataset.controlState=key;row.dataset.sampled=String(this.sampleState===key);sample.setAttribute('aria-pressed',String(this.sampleState===key));if(key==='normal')sample.append(el('small','','Required'));sample.setAttribute('aria-label',`Preview ${name.toLowerCase()} sample`);choose.setAttribute('aria-label',`Choose ${name.toLowerCase()} image`);choose.classList.add('sce-asset');
        const reference=d.appearances?.[key],fallback=chains[key].find(state=>d.appearances?.[state]),resolved=fallback&&d.appearances?.[fallback];
        if(resolved){const thumbnail=this.images.referenceThumbnail(resolved);if(thumbnail){thumbnail.classList.toggle('sce-fallback',!reference);choose.append(thumbnail);}}
        const words=el('span','sce-asset-words');words.append(el('span','',reference?this.images.assetName(reference.assetId):key==='normal'?'Choose required image':`Uses ${chains[key].slice(1).map(state=>controlSampleStates.find(([id])=>id===state)![1]).join(' → ')}`),el('small','',reference?'Change…':'Choose…'));choose.append(words);row.append(sample,choose);
        if(key!=='normal'&&reference){const clear=button('×',()=>{d.appearances![key]=null;this.store(d);this.host.redraw();this.focus(`Choose ${name.toLowerCase()} image`);});clear.setAttribute('aria-label',`Clear ${name.toLowerCase()} image`);row.append(clear);}appearance.append(row);
      }
      void this.images.refreshAssets().then(()=>{if(this.card===card&&card.isConnected)this.updateAssetNames();});
    }
    const displayed=group('Displayed size',true),pair=el('div','sce-pair');field(pair,'Width',d.width,raw=>this.dimension(d,'width',raw));field(pair,'Height',d.height,raw=>this.dimension(d,'height',raw));displayed.append(pair);
    if(d.kind==='imagebutton'){const label=el('label','sce-aspect'),check=el('input');check.type='checkbox';check.checked=!!d.keepRatio;check.onchange=()=>{d.keepRatio=check.checked;this.store(d);};label.append(check,el('span','','Preserve normal image aspect ratio'));displayed.append(label);}
    const placement=group('Layout',true);this.layout.render(placement,{sharedCommit:true,dimensions:false});
    if(d.kind==='imagebutton'){const actions=group('Actions'),section=el('div','sce-actions');actions.append(section);if(d.actions)renderActions(section,d.actions,d.context,this.isSaving()||this.host.writeBlocked()||d.context?.owner?.kind==='component',()=>{d.focus=undefined;captureActionFocus(section,d.actions!);this.store(d);},this.host.validateActions&&d.node&&d.context?()=>this.host.validateActions!(d.document,d.screenId,d.node!.id!,d.context!,d.actions!):undefined,d.node?.id??undefined);else section.append(el('p','',d.node?.actionProtectionReason??'Custom actions stay in Source. Appearance and size edits preserve them.'),button('Edit actions in Source',this.host.source));}
    const footer=el('footer','sce-apply'),state=el('p','sce-state');state.ariaLive='polite';footer.append(state,button('Cancel',()=>this.cancelCurrent()),button('Apply changes',()=>void this.apply(),true));card.append(footer);
    const tools=el('div','sce-tools');this.host.layoutTools(tools);tools.append(button('View in Source',this.host.source));this.host.order(tools);body.append(tools);
    card.onkeydown=event=>{if(event.isComposing||event.keyCode===229)return;if(event.key==='Escape'){event.preventDefault();event.stopPropagation();this.cancelCurrent();}else if(event.key==='Enter'&&(event.ctrlKey||event.metaKey||event.target instanceof HTMLInputElement)){event.preventDefault();event.stopPropagation();void this.apply();}};
    body.scrollTop=oldScroll;this.sync();this.showProblem(d);for(const name of [...d.invalidFields??[]]){try{this.validators.get(name)?.();}catch{ /* Restore the reported field error. */ }}
    if(this.drafts.has(d.key)||this.addition===d){if(d.focus){this.focus(d.focus);const input=card.querySelector<HTMLInputElement>(`input[aria-label="${d.focus}"]`);if(input&&d.caret?.start!=null&&d.caret.end!=null)input.setSelectionRange(d.caret.start,d.caret.end);}else if(d.actions){const section=card.querySelector<HTMLElement>('.siv-actions');if(section)restoreActionFocus(section,d.actions);}}
    return true;
  }
  private registerField(input:HTMLInputElement|HTMLSelectElement,d:Draft,name:string){const validate=validateField(input,()=>{try{this.validate(d,name);d.invalidFields?.delete(name);}catch(error){(d.invalidFields??=new Set()).add(name);throw Error((error as {text:string}).text);}});this.validators.set(name,validate);}
  private updateAssetNames(){const view=this.host.view();if(!view)return;const d=this.value(view);for(const [key,name]of controlSampleStates){const reference=d.appearances?.[key],row=this.card?.querySelector<HTMLElement>(`[aria-label="Choose ${name.toLowerCase()} image"]`);const text=row?.querySelector('.sce-asset-words>span');if(text&&reference){const asset=this.images.asset(reference.assetId);text.textContent=asset?.status==='available'?asset.displayName:asset?.status==='changed'?'Changed image':'Missing image';}const fallback=chains[key].find(state=>d.appearances?.[state]),resolved=fallback&&d.appearances?.[fallback];if(row&&resolved&&!row.querySelector('img')){const image=this.images.referenceThumbnail(resolved);if(image){image.classList.toggle('sce-fallback',!reference);row.prepend(image);}}}}
  private dimension(d:Draft,key:'width'|'height',raw:string){d[key]=raw;if(d.kind==='imagebutton'&&d.keepRatio&&validSize(raw)){const reference=d.appearances?.normal,asset=reference&&this.images.asset(reference.assetId),reviewed=reference&&d.normalSize?.assetId===reference.assetId&&d.normalSize.sha256===(reference.replacementSha256??reference.expectedAssetSha256)?d.normalSize:undefined;const width=reviewed?.width??(!reference?.replacementSha256?asset?.naturalWidth:undefined),height=reviewed?.height??(!reference?.replacementSha256?asset?.naturalHeight:undefined);if(width&&height){const peer=key==='width'?'height':'width';d[peer]=String(Math.max(1,Math.round(Number(raw)*(key==='width'?height/width:width/height))));const input=this.card?.querySelector<HTMLInputElement>(`[aria-label="${peer==='width'?'Width':'Height'}"]`);if(input)input.value=d[peer];}}}
  sync(){if(!this.card||this.disposed)return;const view=this.host.view();if(!view)return;const current=this.value(view);const ownLayout=this.layout.currentDraft();if(ownLayout&&current.node&&!this.drafts.has(current.key))this.drafts.set(current.key,current);const dirty=this.addition===current||this.drafts.has(current.key)||!!ownLayout;const actionJump=this.card.querySelector('[data-section-jump=Actions]');if(actionJump)actionJump.textContent=`Actions (${current.actions?.rows.length??0})`;const dimensions=this.card.querySelector('.sce-size-summary');if(dimensions)dimensions.textContent=`${current.width} \u00d7 ${current.height} px`;const state=this.card.querySelector('.sce-state');if(state)state.textContent=this.isSaving()?'Applying changes':dirty?'Unsaved changes':'No pending changes';for(const b of this.card.querySelectorAll<HTMLButtonElement>('.sce-apply button'))b.disabled=this.isSaving()||!dirty;for(const input of this.card.querySelectorAll<HTMLInputElement>('.sce-field input'))input.readOnly=this.isSaving();for(const select of this.card.querySelectorAll<HTMLSelectElement>('.sce-field select'))select.disabled=this.isSaving();for(const b of this.card.querySelectorAll<HTMLButtonElement>('.sce-image-state button,.sce-color button,.sce-nav button'))b.disabled=this.isSaving();const actions=this.card.querySelector<HTMLFieldSetElement>('.siv-actions fieldset');if(actions)actions.disabled=this.isSaving()||this.host.writeBlocked()||current.context?.owner?.kind==='component'||!current.context;const add=this.card.querySelector<HTMLSelectElement>('.siv-add');if(add)add.disabled=this.isSaving()||this.host.writeBlocked()||current.context?.owner?.kind==='component'||!current.context||(current.actions?.rows.length??0)>=8;}
  private focus(name?:string){const control=name?[...this.card?.querySelectorAll<HTMLElement>('[aria-label]')??[]].find(n=>(n.getAttribute('aria-label')??n.ariaLabel)===name):this.card?.querySelector<HTMLElement>('.sce-title');if(control)this.reveal(control);}
  private reveal(control:HTMLElement){for(let p=control.parentElement;p&&p!==this.card;p=p.parentElement)if(p instanceof HTMLDetailsElement)p.open=true;const unit=control.closest<HTMLElement>('.siv-payload')??control.closest<HTMLElement>('.sce-field,.layout-field,.screen-text-field,.sce-image-state')??control;unit.scrollIntoView({block:'center'});control.focus({preventScroll:true});}
  private showProblem(d:Draft){this.card?.querySelectorAll('.sce-error').forEach(n=>n.remove());this.card?.querySelectorAll('[data-control-invalid]').forEach(n=>{n.removeAttribute('aria-invalid');n.removeAttribute('aria-describedby');n.removeAttribute('data-control-invalid');});if(!d.problem)return;
    const p=el('p','sce-error',d.problem.text);p.role='alert';p.id='sce-current-error';const target=[...this.card?.querySelectorAll<HTMLElement>('[aria-label]')??[]].find(n=>(n.getAttribute('aria-label')??n.ariaLabel)===d.problem?.field);
    if(d.problem.validation&&d.problem.field){try{this.validators.get(d.problem.field)?.();}catch{ /* Shared field feedback owns the inline error. */ }this.card?.querySelector('.sce-apply')?.prepend(p);}
    else if(target){target.setAttribute('aria-invalid','true');target.setAttribute('data-control-invalid','');target.setAttribute('aria-describedby',p.id);(target.closest('label')??target).append(p);}else this.card?.querySelector('.sce-apply')?.prepend(p);
  }
  private fail(d:Draft,text:string,field?:string,validation=false){d.problem={text,field,validation};this.showProblem(d);const nativeError=!field&&this.card?.querySelector<HTMLElement>('.siv-actions [aria-invalid],.screen-layout [aria-invalid]');if(nativeError){this.reveal(nativeError);}else this.focus(field??d.focus);this.host.note(text,true);}
  cancelCurrent():boolean {
    const view=this.host.view();if(this.isSaving())return false;if(this.host.writeBlocked()){this.host.cancelCopy();return true;}
    if(!view){if(!this.addition)return false;this.discard(this.addition);this.host.redraw();this.host.preview();this.host.note('Changes cancelled. No source was written.');return true;}
    const d=this.value(view);if(!this.addition&&!this.drafts.has(d.key)&&!this.layout.hasNodeDraft(view.document,view.screenName,view.selected))return false;
    this.layout.cancelCurrent();this.discard(d);this.host.redraw();this.focus(d.focus);this.host.preview();this.host.note('Changes cancelled. No source was written.');return true;
  }
  private discard(d:Draft){const screen=d.document.screens.find(s=>s.nodes.some(n=>n.id===(d.node?.id??d.parentId)));if(screen)this.layout.discardNodeDraft(d.document.path,screen.name,d.node?.id??d.key);this.drafts.delete(d.key);if(this.addition===d)this.addition=undefined;if(this.mounted===d)this.mounted=undefined;}
  private validate(d:Draft,completed?:string){
    if(d.kind==='bar'){
    if((!completed||completed==='Choose integer variable')&&!d.context?.variables.some(v=>v.id===d.binding.variableId&&v.variableType==='int'))throw {text:'Choose an existing integer. Your draft is retained.',field:'Choose integer variable'};
    for(const [key,label]of [['minimum','Minimum'],['maximum','Maximum']]as const)if((!completed||completed===label)&&(!/^(0|-[1-9]\d*|[1-9]\d*)$/.test(d.binding[key])||BigInt(d.binding[key])< -9007199254740991n||BigInt(d.binding[key])>9007199254740991n))throw {text:'Use a whole decimal number from -9007199254740991 to 9007199254740991.',field:label};
    if((!completed||['Minimum','Maximum'].includes(completed))&&[d.binding.minimum,d.binding.maximum].every(raw=>/^(0|-[1-9]\d*|[1-9]\d*)$/.test(raw))){const span=BigInt(d.binding.maximum)-BigInt(d.binding.minimum);if(span<=0n||span>9007199254740991n)throw {text:'Maximum must exceed Minimum with an exactly representable range.',field:completed??'Maximum'};}
    for(const [key,label]of [['leftBar','Filled'],['rightBar','Empty'],['thumb','Thumb']]as const)if((!completed||completed===`${label} color`)&&d.appearance[key]&&!/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(d.appearance[key]!))throw {text:'Use a literal hex color or leave it blank.',field:`${label} color`};
    }else if((!completed||completed==='Choose normal image')&&!d.appearances?.normal)throw {text:'Choose a normal UI image. Your draft is retained.',field:'Choose normal image'};
    for(const key of ['width','height']as const)if((!completed||completed===(key==='width'?'Width':'Height'))&&!validSize(d[key]))throw {text:'Use a whole pixel size from 1 to 16384. Your draft is retained.',field:key==='width'?'Width':'Height'};
  }
  async apply(){
    const view=this.host.view();if(!view||view.busy||this.isSaving())return;const d=this.value(view);if(this.host.writeBlocked()){this.fail(d,'Reload or cancel the copy before applying.');return;}
    let layout:ReturnType<ScreenLayoutEditor['currentDraft']>;
    try{this.validate(d);layout=this.layout.currentDraft(true);}catch(error){const e=error as {text?:string;field?:string;message?:string};this.fail(d,e.text??e.message??'Invalid values.',e.field,true);return;}
    if(layout&&layout.document.revision!==d.document.revision){this.fail(d,'Control and layout use different Source revisions. Input retained.');return;}
    if(d.document.revision!==view.document.revision||d.context?.authoringRevision!==this.host.interaction()?.authoringRevision){this.fail(d,'Source or variables changed after this draft started. Input retained.');return;}
    const common={width:Number(d.width),height:Number(d.height),...(layout?{layout:layout.values}:{})};
    const reservation=this.layout.reserveForComposition(d.document);
    this.preparing=true;this.sync();
    try{
    let command:ScreenControlCommand;
    if(d.kind==='bar'){const values={...common,binding:d.binding,appearance:d.appearance,expectedAuthoringRevision:d.context!.authoringRevision};command=d.node?{type:'bar',nodeId:d.node.id!,...values}:{type:'addBar',parentId:d.parentId,...values};}
    else {
      try{await this.images.refreshAssets();for(const [key,name]of controlSampleStates){const ref=d.appearances?.[key];if(!ref)continue;const asset=this.images.asset(ref.assetId);if(!asset||asset.status!=='available'&&!ref.replacementSha256){this.fail(d,`${name} image is missing or changed. Choose an available UI image.`,`Choose ${name.toLowerCase()} image`);return;}}
        const values={...common,appearances:d.appearances as ImageButtonAppearances,interaction:prepareInteraction(d.context!,d.node&&d.context?.owner?.kind==='component'?undefined:d.actions)};command=d.node?{type:'imageButton',nodeId:d.node.id!,...values}:{type:'addImageButton',parentId:d.parentId,...values};
      }catch(error){const section=this.card?.querySelector<HTMLElement>('.siv-actions');if(section&&d.actions){renderActions(section,d.actions,d.context,false,()=>this.store(d));restoreActionFocus(section,d.actions);const target=section.querySelector<HTMLElement>('[aria-invalid]');target?.focus({preventScroll:true});target?.scrollIntoView({block:'nearest'});}this.fail(d,(error as Error).message,undefined,true);return;}
    }
    if(this.disposed||!this.host.current())return;
    const submitted={draft:d,command,layout:reservation};this.submitted=submitted;this.sync();
    try{await this.host.commit(command,d.document);this.focus(d.focus);}catch(error){this.fail(d,`${(error as Error).message} Your draft is retained.`,d.focus);showActionRefusal(this.card?.querySelector<HTMLElement>(".siv-actions")??undefined,d.actions,error);}finally{if(this.submitted===submitted)this.submitted=undefined;this.sync();}
    }finally{this.preparing=false;reservation.release();this.sync();}
  }
  accept(command:CompositionCommand,_base:ScreenDocument,accepted:ScreenDocument){if(this.submitted?.command===command){const s=this.submitted;this.drafts.delete(s.draft.key);if(this.addition===s.draft)this.addition=undefined;this.mounted=undefined;s.layout.accept(accepted);this.submitted=undefined;}}
  canvasDraft():{invalid:boolean;barSamples:BarSample[];barAddition?:BarAddition;imageButtonSamples:ImageButtonSample[];imageButtonAddition?:ImageButtonAddition}{
    const view=this.host.view(),result:ReturnType<ScreenControlEditor['canvasDraft']>={invalid:false,barSamples:[],imageButtonSamples:[]};if(!view)return {...result,invalid:this.hasDraft()};
    for(const d of [...this.drafts.values(),...(this.addition?[this.addition]:[])]){if(d.screenId!==view.screenId)continue;try{this.validate(d);}catch{result.invalid=true;continue;}
      if(d.document.revision!==view.document.revision||d.context?.authoringRevision!==this.host.interaction()?.authoringRevision){result.invalid=true;continue;}
      const common={width:Number(d.width),height:Number(d.height)},node=view.nodes.find(n=>n.id===d.node?.id),parent=view.nodes.find(n=>n.id===d.parentId);
      if(d.kind==='bar'){const data={...common,binding:d.binding,appearance:d.appearance,expectedAuthoringRevision:d.context!.authoringRevision};if(d.node&&node)result.barSamples.push({nodeStart:node.span.start,...data});else if(!d.node&&parent)result.barAddition={parentStart:parent.span.start,...data};else result.invalid=true;}
      else {const data={...common,appearances:d.appearances as ImageButtonAppearances};if(d.node&&node)result.imageButtonSamples.push({nodeStart:node.span.start,...data});else if(!d.node&&parent)result.imageButtonAddition={parentStart:parent.span.start,...data};else result.invalid=true;}
    }return result;
  }
}
