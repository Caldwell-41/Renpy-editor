import type { CompositionView, CopyDraftParticipant } from "./screen-composition.ts";
import type { ComponentChange, ComponentReview, ScreenCatalog, ScreenRevisions, ResolvedScreenTarget } from "./screen-contracts.ts";
import type { ScreenDocument, ScreenNode } from "./screen-ui.ts";
import type { CoreOperation } from "./protocol.ts";
import type { SourceTarget } from "./source-ui.ts";
import { technicalName, technicalNameHelp, technicalNameInput, validateField } from "./authoring-input.ts";

export type { CopyDraftParticipant } from "./screen-composition.ts";
export interface ComponentFieldChange { label: string; before: string; after: string }
export interface ScreenComponentsHost {
  view(): CompositionView | undefined;
  catalog(): ScreenCatalog | undefined;
  current(): boolean;
  request<T>(operation: CoreOperation, payload?: Record<string, unknown>): Promise<T>;
  coordinate<T>(task: () => Promise<T>): Promise<T>;
  accepted(change: ComponentChange, selection: {screenId:string;nodeId:string}): Promise<CompositionView>;
  openDefinition(componentId: string, nodeId?: string): Promise<CompositionView>;
  openScreen?(screenId: string, nodeId?: string): Promise<CompositionView>;
  captureDrafts?(view: CompositionView): readonly CopyDraftParticipant[];
  source(target: SourceTarget): void;
  note(message: string, error?: boolean): void;
  redraw(): void;
}
export interface PreparedComponentGroup {
  screenId:string; nodeId:string; path:string; sourceRevision:string;
  span:{start:number;end:number}; source:string;
}
interface Extraction { view:CompositionView; target:ResolvedScreenTarget; projectRevision:string; group:PreparedComponentGroup }
interface UseOrigin { view:CompositionView; target:ResolvedScreenTarget; componentId:string; useId:string }
interface PendingCopy { change:ComponentChange; name:string; before:CompositionView; participants:readonly CopyDraftParticipant[]; origin:UseOrigin }

function copiedNodes(before:CompositionView,after:CompositionView):ReadonlyMap<string,string> {
  if(before.document.partial || after.document.partial || before.nodes.length!==after.nodes.length || before.nodes.length>1024)
    throw Error("The copied definition cannot be verified. Your edits are kept.");
  const originals=new Set(before.nodes.map(node=>node.id)), fresh=new Set(after.nodes.map(node=>node.id));
  if(originals.has(null) || originals.has(undefined) || fresh.has(null) || fresh.has(undefined) || originals.size!==before.nodes.length || fresh.size!==after.nodes.length || [...fresh].some(id=>originals.has(id)))
    throw Error("The copied child identities are unavailable or ambiguous. Your edits are kept.");
  const shape=(view:CompositionView,node:ScreenNode)=>{
    const {id:_id,span:_span,parentStart,...values}=node;
    const properties=node.properties.map(property=>{
      const {span:_sourceSpan,...semantic}=property as typeof property & {span?:unknown};return semantic;
    });
    if(node.protected.length)throw Error("The copied definition contains Source-only content. Your edits are kept.");
    const parent=parentStart===null ? null : view.nodes.findIndex(node=>node.span.start===parentStart);
    if(parent===-1)throw Error("The copied parent is unavailable. Your edits are kept.");
    return JSON.stringify({parent,...values,properties});
  };
  const ids=new Map<string,string>();
  for(const [index,node] of before.nodes.entries()) {
    const copy=after.nodes[index]!;
    if(shape(before,node)!==shape(after,copy))throw Error("The copied accepted content changed. Your edits are kept.");
    ids.set(node.id!,copy.id!);
  }
  return ids;
}
const el=<K extends keyof HTMLElementTagNameMap>(tag:K,className="",text="")=>{
  const node=document.createElement(tag);node.className=className;node.textContent=text;return node;
};
const action=(label:string,run:()=>void,primary=false)=>{
  const button=el("button",`button ${primary?"primary":"secondary"}`,label);button.type="button";button.onclick=run;return button;
};
const displayName=(name:string)=>name.replaceAll("_"," ").replace(/^./,letter=>letter.toUpperCase());

/** Owns component workflows. Accepted source and ordinary field drafts keep their existing owners. */
export class ScreenComponents {
  private extraction?: Extraction;
  private working = false;
  private disposed = false;
  private origin?:UseOrigin;
  private pendingCopy?:PendingCopy;
  private dialog?:HTMLDialogElement;
  private dismissDialog?:()=>void;
  private readonly scopes=new Map<string,{review?:ComponentReview;error?:string}>();
  constructor(private readonly host: ScreenComponentsHost) {}
  isSaving(): boolean { return this.working || !!this.dialog; }
  hasPendingCopy(): boolean { return !!this.pendingCopy; }
  dispose(): void { this.disposed=true;this.extraction=undefined;this.dismissDialog?.();this.dialog?.remove(); }
  private active(): boolean { return !this.disposed && this.host.current(); }
  private view(): CompositionView {
    const view=this.host.view();
    if(this.pendingCopy)throw Error("The copy exists. Reload or cancel its unsaved edits before another operation.");
    if(!this.active() || !view || view.busy && !this.working && !this.dialog)throw Error("Finish the current operation first. Your input is kept.");
    return view;
  }
  private assertCurrent(base:CompositionView):void {
    const current=this.view();
    if(current.screenId!==base.screenId || current.document.path!==base.document.path || current.document.revision!==base.document.revision)
      throw Error("Source changed. Your input is kept. Inspect Source before continuing.");
  }
  private async resolve(view:CompositionView):Promise<ResolvedScreenTarget> {
    const owner=this.host.catalog()?.owned.find(owner=>owner.id===view.screenId);
    if(!owner?.resolved || owner.path!==view.document.path || owner.name!==view.screenName)throw Error("This owned screen is unavailable. Inspect Source.");
    const target=await this.host.request<ResolvedScreenTarget>("screens.resolveTarget",{binding:{screenId:owner.id,sourceName:owner.name}});
    this.assertCurrent(view);
    if(target.revisions.source!==view.document.revision)throw Error("Source changed. Your input is kept. Inspect Source before continuing.");
    return target;
  }
  async prepareExtract():Promise<PreparedComponentGroup> {
    if(this.working)throw Error("Finish the current operation first.");
    const view=this.view(), projectRevision=this.host.catalog()?.projectRevision;
    if(!view.selected.id || !projectRevision)throw Error("Choose a supported owned group first.");
    this.working=true;
    try {
      const target=await this.resolve(view);
      const group=await this.host.request<PreparedComponentGroup>("screens.componentPrepareExtract",{screenId:view.screenId,nodeId:view.selected.id,expectedRevision:view.document.revision});
      this.assertCurrent(view);
      if(group.screenId!==view.screenId || group.nodeId!==view.selected.id || group.sourceRevision!==view.document.revision || group.path!==view.document.path)
        throw Error("The selected Source changed. Your input is kept.");
      this.extraction={view,target,projectRevision,group};return group;
    } finally {this.working=false;}
  }
  async extract(name:string):Promise<ComponentChange> {
    if(this.working || !this.extraction)throw Error("Review the selected group first.");
    const capture=this.extraction;
    this.assertCurrent(capture.view);
    const normalized=technicalName(name,"Component name");
    this.working=true;
    try {
      const change=await this.host.coordinate(()=>this.host.request<ComponentChange>("screens.componentExtract",{
        target:capture.target.binding,expected:capture.target.revisions,expectedProjectRevision:capture.projectRevision,nodeId:capture.group.nodeId,name:normalized,
      }));
      this.extraction=undefined;
      await this.host.accepted(change,{screenId:change.screenId,nodeId:change.useId});
      this.host.note(`Created ${normalized}. The selected group is now a component use.`);return change;
    } finally {this.working=false;}
  }
  cancelExtraction():void { if(!this.working)this.extraction=undefined; }
  async place(componentId:string,parentId:string):Promise<ComponentChange> {
    if(this.working)throw Error("Finish the current operation first.");
    const view=this.view(), owner=this.host.catalog()?.owned.find(owner=>owner.id===componentId && owner.kind==="component" && owner.resolved);
    if(!view.nodes.some(node=>node.id===parentId && ["screen","fixed","frame","window","vbox","hbox","grid","viewport"].includes(node.kind)))
      throw Error("Choose the parent group for this component.");
    if(!owner)throw Error("This component is unavailable. Its saved identity is kept.");
    this.working=true;
    try {
      const target=await this.resolve(view);
      const component=await this.host.request<ResolvedScreenTarget>("screens.resolveTarget",{binding:{screenId:owner.id,sourceName:owner.name}});
      this.assertCurrent(view);
      if(component.kind!=="component" || component.binding.screenId!==componentId)throw Error("The component reference changed. Inspect Source.");
      const change=await this.host.coordinate(()=>this.host.request<ComponentChange>("screens.componentPlace",{
        component:component.binding,expectedComponent:component.revisions,target:target.binding,expectedTarget:target.revisions,parentId,
      }));
      await this.host.accepted(change,{screenId:change.screenId,nodeId:change.useId});
      this.host.note(`Added ${owner.name} to ${view.screenName}.`);return change;
    } finally {this.working=false;}
  }
  private async componentReview(componentId:string,base?:CompositionView):Promise<ComponentReview> {
    const review=await this.host.request<ComponentReview>("screens.componentReview",{componentId});
    if(!this.active() || review.component.kind!=="component" || review.component.binding.screenId!==componentId || !review.complete)
      throw Error("Component references are unavailable or incomplete. Your edits are kept. Inspect Source.");
    if(base && (review.component.path!==base.document.path || review.component.revisions.source!==base.document.revision))
      throw Error("Source changed. Your draft is still here. Inspect Source before applying.");
    this.scopes.set(JSON.stringify([componentId,review.component.revisions.source,review.component.revisions.sourceMap,review.component.revisions.inventory]),{review});
    return review;
  }
  async editUse(view=this.view()):Promise<CompositionView> {
    if(this.working)throw Error("Finish the current operation first.");
    const use=view.selected;
    if(use.kind!=="use" || !use.id || !use.component?.resolved)throw Error("Can't find this component. Its saved reference is kept. Inspect Source.");
    this.working=true;
    try {
      const target=await this.resolve(view), review=await this.componentReview(use.component.componentId);
      this.assertCurrent(view);
      const fresh=await this.host.openDefinition(use.component.componentId);
      if(fresh.screenId!==use.component.componentId || fresh.document.revision!==review.component.revisions.source || fresh.document.path!==review.component.path)
        throw Error("The component refresh changed. Your input is kept. Reload Source.");
      this.origin={view,target,componentId:use.component.componentId,useId:use.id};return fresh;
    } finally {this.working=false;}
  }
  async makeCopy(name:string):Promise<ComponentChange> {
    if(this.working)throw Error("Finish the current operation first.");
    const before=this.view(), origin=this.origin, normalized=technicalName(name,"Component name");
    if(!origin || before.screenId!==origin.componentId)throw Error("Open a component from its current screen use before copying.");
    const participants=this.host.captureDrafts?.(before)??[];
    for(const participant of participants)participant.validate();
    this.working=true;
    try {
      const review=await this.componentReview(origin.componentId,before);
      const target=await this.host.request<ResolvedScreenTarget>("screens.resolveTarget",{binding:origin.target.binding});
      if(target.revisions.source!==origin.view.document.revision || target.binding.screenId!==origin.view.screenId)throw Error("The current screen use changed. Your edits are kept.");
      this.assertCurrent(before);
      const projectRevision=this.host.catalog()?.projectRevision;
      if(!projectRevision)throw Error("Reload the project before copying. Your edits are kept.");
      const change=await this.host.coordinate(()=>this.host.request<ComponentChange>("screens.componentCopy",{
        target:target.binding,expectedTarget:target.revisions,useId:origin.useId,expectedComponent:review.component.revisions,expectedProjectRevision:projectRevision,name:normalized,
      }));
      this.pendingCopy={change,name:normalized,before,participants,origin};
      await this.verifyCopy();return change;
    } finally {this.working=false;this.host.redraw();}
  }
  private async verifyCopy():Promise<void> {
    const pending=this.pendingCopy;
    if(!pending || !this.active())throw Error("The copy refresh is unavailable. Your edits are kept.");
    try {
      const {change,before}=pending;
      const ownerView=await this.host.accepted(change,{screenId:change.screenId,nodeId:change.useId});
      if(ownerView.screenId!==pending.origin.view.screenId || ownerView.selected.id!==pending.origin.useId || !ownerView.selected.component?.resolved || ownerView.selected.component.componentId!==change.componentId)
        throw Error("The current screen does not resolve to the accepted copy.");
      const review=await this.componentReview(change.componentId);
      let fresh=await this.host.openDefinition(change.componentId);
      const owner=this.host.catalog()?.owned.find(owner=>owner.id===change.componentId && owner.kind==="component" && owner.resolved);
      if(!owner || owner.name!==pending.name || fresh.screenId!==change.componentId || fresh.screenName!==owner.name || fresh.document.path!==review.component.path || fresh.document.revision!==review.component.revisions.source || ownerView.selected.component.sourceRevision!==fresh.document.revision || fresh.nodes.find(node=>node.parentStart===null)?.id!==review.component.rootId)
        throw Error("The copied definition or revision is unavailable.");
      const ids=copiedNodes(before,fresh), selected=ids.get(before.selected.id!);
      if(!selected)throw Error("The copied selection is ambiguous.");
      if(fresh.selected.id!==selected) {
        fresh=await this.host.openDefinition(change.componentId,selected);
        if(fresh.document.revision!==review.component.revisions.source || fresh.selected.id!==selected)throw Error("The copied selection changed during refresh.");
        copiedNodes(before,fresh);
      }
      await this.host.request("screens.resolveTarget",{binding:review.component.binding,expected:review.component.revisions});
      const ownerTarget=await this.host.request<ResolvedScreenTarget>("screens.resolveTarget",{binding:pending.origin.target.binding});
      if(ownerTarget.revisions.source!==ownerView.document.revision)throw Error("The current screen changed during copy refresh.");
      const commits=pending.participants.map(participant=>participant.prepare(fresh,ids));
      for(const commit of commits)commit();
      this.origin={view:ownerView,target:ownerTarget,componentId:change.componentId,useId:change.useId};
      this.pendingCopy=undefined;
      this.host.note(pending.participants.length ? `Copy created for ${ownerView.screenName}. Your edits are still unsaved. Apply them when ready.` : `Copy created for ${ownerView.screenName}. Other screens keep their original component.`);
    } catch(error) {
      let restoreFailed=false;
      if(this.active()) {
        try {await this.host.openDefinition(pending.before.screenId,pending.before.selected.id??undefined);}
        catch {restoreFailed=true;}
      }
      throw Error(`Copy created. Your edits are still unsaved. Reload copy to continue. ${(error as Error).message}${restoreFailed ? " The original fields could not be reopened; your input is still retained." : ""}`);
    }
  }
  async reloadCopy():Promise<void> {
    if(this.working || !this.pendingCopy)throw Error("There is no copy waiting for reload.");
    this.working=true;try {await this.verifyCopy();} finally {this.working=false;this.host.redraw();}
  }
  cancelCopy():void {
    if(this.working || !this.pendingCopy)return;
    for(const participant of this.pendingCopy.participants)participant.cancel();
    this.pendingCopy=undefined;this.origin=undefined;this.host.redraw();this.host.note("Unsaved edits cancelled. The accepted copy remains saved.");
  }
  private sourceUse(use:ComponentReview["uses"][number]):void {
    if(!use.resolved || !use.span || !use.sourceRevision)throw Error("This reference no longer has an exact Source location. Reload Source.");
    this.host.source({path:use.path,expectedRevision:use.sourceRevision,byteStart:use.span.start,byteEnd:use.span.end});
  }
  private affected(dialog:HTMLElement,review:ComponentReview):void {
    const table=el("table","screen-component-affected"),head=el("thead"),row=el("tr");row.append(el("th","","Affected screen"),el("th","","Change"));head.append(row);table.append(head);
    const body=el("tbody");
    for(const screen of review.affectedScreens) {
      const row=el("tr");row.append(el("td","",displayName(screen.name)),el("td","","Component content"));body.append(row);
    }
    table.append(body);dialog.append(table);
    const details=el("details","screen-component-references");details.append(el("summary","","Source and effects"));
    const list=el("ul");
    for(const use of review.uses) {
      const item=el("li"),source=action(`${displayName(use.screenName)} · ${use.path}`,()=>{try{this.sourceUse(use);}catch(error){this.host.note((error as Error).message,true);}});
      source.disabled=!use.resolved || !use.span || !use.sourceRevision;
      item.append(source,el("code","",`Use ${use.nodeId}${use.span ? ` · bytes ${use.span.start}–${use.span.end}` : " · location unavailable"}`));list.append(item);
    }
    details.append(list,el("p","",review.component.effects.unknown ? "Unknown effects. Custom or unsupported children need Source inspection." : review.component.effects.hiddenScreens.length ? `Known Hide targets: ${review.component.effects.hiddenScreens.join(", ")}` : "Known content presents information."));
    const values=el("dl");
    for(const [label,value] of [["Source name",review.component.binding.sourceName],["Stable reference",review.component.binding.screenId],...Object.entries(review.component.revisions)])values.append(el("dt","",label),el("dd","",value));
    details.append(values);dialog.append(details);
  }
  async reviewChanges(changedFields:readonly ComponentFieldChange[]):Promise<ScreenRevisions|undefined> {
    if(this.working)throw Error("Finish the current operation first.");
    const base=this.view(), owner=this.host.catalog()?.owned.find(owner=>owner.id===base.screenId);
    if(owner?.kind!=="component")return;
    this.working=true;
    try {
      const review=await this.componentReview(base.screenId,base);this.assertCurrent(base);
      const changes=changedFields.filter(change=>change.before!==change.after);
      if(!changes.length || review.affectedScreens.length<=1 && review.uses.filter(use=>use.componentId===base.screenId).length<=1)return review.component.revisions;
      const dialog=el("dialog","screen-component-dialog");dialog.ariaLabel="Review component changes";
      dialog.append(el("h2","","Review changes"),el("p","",`Update ${displayName(base.screenName)} on ${review.affectedScreens.length} ${review.affectedScreens.length===1?"screen":"screens"}.`));
      this.affected(dialog,review);
      const table=el("table","screen-component-changes"),head=el("thead"),heading=el("tr");
      for(const label of ["Field","Current","After Apply"])heading.append(el("th","",label));head.append(heading);table.append(head);
      const body=el("tbody");for(const change of changes){const row=el("tr");for(const value of [change.label,change.before,change.after])row.append(el("td","",value));body.append(row);}table.append(body);dialog.append(table);
      const focused=document.activeElement as HTMLElement|null;
      const accepted=await new Promise<boolean>(resolve=>{
        const close=(accepted:boolean)=>{dialog.close();dialog.remove();this.dialog=undefined;this.dismissDialog=undefined;if(focused?.isConnected)focused.focus({preventScroll:true});resolve(accepted);};
        this.dialog=dialog;this.dismissDialog=()=>close(false);
        dialog.oncancel=event=>{event.preventDefault();close(false);};dialog.onkeydown=event=>event.stopPropagation();
        const actions=el("div","screen-component-actions");actions.append(action(`Apply to ${review.affectedScreens.length} ${review.affectedScreens.length===1?"screen":"screens"}`,()=>close(true),true),action("Keep editing",()=>close(false)));dialog.append(actions);
        document.body.append(dialog);dialog.showModal();
        (actions.lastElementChild as HTMLElement).focus();
      });
      if(!accepted)return;
      this.assertCurrent(base);return review.component.revisions;
    } finally {this.working=false;}
  }
  invalidate():void {this.scopes.clear();this.extraction=undefined;if(!this.pendingCopy)this.origin=undefined;}
  private run(task:()=>Promise<unknown>):void {
    void task().catch(error=>{if(this.active()){this.host.note((error as Error).message,true);this.host.redraw();}});
  }
  private currentSource(view:CompositionView):void {
    this.host.source({path:view.document.path,expectedRevision:view.document.revision,byteStart:view.selected.span.start,byteEnd:view.selected.span.end});
  }
  private async componentSource(componentId:string):Promise<void> {
    const review=await this.componentReview(componentId);
    const doc=await this.host.request<ScreenDocument>("screens.inspect",{path:review.component.path});
    const root=doc.screens.find(screen=>screen.name===review.component.binding.sourceName)?.nodes.find(node=>node.id===review.component.rootId);
    if(!root || doc.revision!==review.component.revisions.source)throw Error("The exact component Source location changed. Reload Source.");
    this.host.source({path:doc.path,expectedRevision:doc.revision,byteStart:root.span.start,byteEnd:root.span.end});
  }
  private mountDialog(title:string):{dialog:HTMLDialogElement;close:()=>void} {
    if(this.dialog)throw Error("Finish the current dialog first.");
    const focused=document.activeElement as HTMLElement|null, dialog=el("dialog","screen-component-dialog");dialog.ariaLabel=title;dialog.append(el("h2","",title));
    const close=()=>{if(this.working)return;dialog.close();dialog.remove();if(this.dialog===dialog){this.dialog=undefined;this.dismissDialog=undefined;}if(focused?.isConnected)focused.focus({preventScroll:true});};
    this.dialog=dialog;this.dismissDialog=()=>{dialog.remove();this.dialog=undefined;};
    dialog.oncancel=event=>{event.preventDefault();close();};dialog.onkeydown=event=>event.stopPropagation();document.body.append(dialog);
    return {dialog,close};
  }
  private nameDialog(copy:boolean):void {
    const {dialog,close}=this.mountDialog(copy?`Make a copy for ${displayName(this.origin?.view.screenName??"this screen")}`:"Make component");
    const form=el("form"),label=el("label","screen-component-field","Component name"),input=el("input");
    input.ariaLabel="Component name";technicalNameInput(input);label.append(input);form.append(label,el("p","screen-component-help",technicalNameHelp));
    const error=el("p","screen-component-error");error.role="alert";
    const validate=validateField(input,()=>{
      const name=technicalName(input.value,"Component name");
      if(this.host.catalog()?.owned.some(owner=>owner.name===name))throw Error("That Source name already exists. Choose another component name.");
    });
    const actions=el("div","screen-component-actions"),submit=action(copy?"Create copy":"Make component",()=>{},true);submit.type="submit";submit.onclick=null;
    actions.append(submit,action("Cancel",()=>{this.cancelExtraction();close();}));form.append(error,actions);
    form.onsubmit=event=>{
      event.preventDefault();if(this.working)return;
      try{validate();}catch{input.focus();return;}
      submit.disabled=true;
      void (copy?this.makeCopy(input.value):this.extract(input.value)).then(()=>close()).catch(failure=>{
        if(this.pendingCopy){close();this.host.note((failure as Error).message,true);this.host.redraw();}
        else {error.textContent=(failure as Error).message;input.focus();}
      }).finally(()=>{submit.disabled=false;});
    };
    dialog.append(form);dialog.showModal();input.focus();
  }
  renderGroupTools(host:HTMLElement):void {
    const view=this.host.view();if(!view)return;
    const tools=el("div","screen-component-tools");
    if(view.selected.id && ["fixed","frame","window","vbox","hbox","grid","viewport"].includes(view.selected.kind)) {
      const make=action("Make component…",()=>this.run(async()=>{await this.prepareExtract();if(this.active())this.nameDialog(false);}));
      make.disabled=view.busy || this.isSaving() || this.hasPendingCopy();tools.append(make);
    }
    const insert=action("Add component…",()=>this.run(()=>this.insertDialog()));insert.disabled=view.busy || this.isSaving() || this.hasPendingCopy() || !this.host.catalog()?.owned.some(owner=>owner.kind==="component" && owner.resolved);
    tools.append(insert);host.append(tools);
  }
  renderUse(card:HTMLElement,view:CompositionView):boolean {
    if(view.selected.kind!=="use")return false;
    const id=view.selected.component?.componentId,owner=this.host.catalog()?.owned.find(owner=>owner.id===id);
    card.classList.add("screen-component-use");card.append(el("h2","",displayName(owner?.name??view.selected.literal??"Component")));
    if(!view.selected.component?.resolved || !owner?.resolved)card.append(el("p","screen-component-error","Can't find this component. Its saved reference is kept. Inspect Source to resolve it."));
    else {
      card.append(el("p","","Edit its ordinary text, Style, layout and image fields in the shared definition."),action("Edit component",()=>this.run(()=>this.editUse(view)),true));
      this.renderScope(card,view,id);
    }
    card.append(action("Use Source",()=>this.currentSource(view)));return true;
  }
  renderScope(host:HTMLElement,view:CompositionView,componentId?:string):boolean {
    const owner=this.host.catalog()?.owned.find(owner=>owner.id===view.screenId),id=componentId??(owner?.kind==="component"?owner.id:undefined);
    if(!id)return false;
    const section=el("section","screen-component-scope");host.append(section);
    if(this.pendingCopy) {
      section.append(el("strong","","Copy created. Your edits are still unsaved."),el("p","","Reload the copy to continue. Other screens keep their saved content."));
      const actions=el("div","screen-component-actions"),cancel=action("Cancel",()=>this.cancelCopy());cancel.dataset.componentCancel="";
      actions.append(action("Reload copy",()=>this.run(()=>this.reloadCopy()),true),cancel);section.append(actions);return true;
    }
    const key=JSON.stringify([id,view.document.revision,this.host.catalog()?.sourceMapRevision,this.host.catalog()?.inventoryRevision]);
    let state=this.scopes.get(key);
    if(!state) {
      state={};this.scopes.set(key,state);const capture=state;
      void this.componentReview(id,owner?.kind==="component" && owner.id===id?view:undefined).then(review=>{capture.review=review;}).catch(error=>{capture.error=(error as Error).message;}).finally(()=>{if(this.active() && section.isConnected){section.replaceChildren();this.scopeContent(section,view,id,capture);}});
    }
    this.scopeContent(section,view,id,state);return true;
  }
  private scopeContent(section:HTMLElement,view:CompositionView,id:string,state:{review?:ComponentReview;error?:string}):void {
    if(!state.review){section.append(el("p",state.error?"screen-component-error":"",state.error??"Loading affected screens…"));return;}
    const review=state.review,names=review.affectedScreens.map(owner=>displayName(owner.name));
    section.dataset.shared=String(names.length>1 || review.uses.filter(use=>use.componentId===id).length>1);
    section.append(el("p","screen-component-scope-line",names.length>1?`Shared by ${names.join(" and ")}`:names.length?`Only ${names[0]}`:"This component is not used in a screen."));
    const tools=el("div","screen-component-actions");tools.append(action(`Used on ${names.length} ${names.length===1?"screen":"screens"}`,()=>this.run(()=>this.showUses(id))));
    if(this.origin?.componentId===id && names.length>1)tools.append(action(`Make a copy for ${displayName(this.origin.view.screenName)}`,()=>this.nameDialog(true)));
    else if(this.host.openScreen)tools.append(action("Add to another screen…",()=>this.run(()=>this.insertDialog(id))));
    tools.append(action("Open Source",()=>this.run(()=>this.componentSource(id))));section.append(tools);
    section.dataset.sourceRevision=view.document.revision;
  }
  private async showUses(componentId:string):Promise<void> {
    const review=await this.componentReview(componentId),{dialog,close}=this.mountDialog("Component uses");
    this.affected(dialog,review);dialog.append(action("Back to editor",close));dialog.showModal();dialog.querySelector("button")?.focus();
  }
  private async insertDialog(preselected?:string):Promise<void> {
    const base=this.view(),catalog=this.host.catalog();if(!catalog)return;
    const components=catalog.owned.filter(owner=>owner.kind==="component" && owner.resolved),panels=catalog.owned.filter(owner=>owner.kind==="panel" && owner.resolved);
    if(!components.length)throw Error("Make a component from a supported group first.");
    const {dialog,close}=this.mountDialog("Add component"),form=el("form"),error=el("p","screen-component-error");error.role="alert";
    const select=(name:string,options:{id:string;name:string}[])=>{
      const label=el("label","screen-component-field",name),control=el("select");control.ariaLabel=name;
      for(const option of options){const row=el("option","",displayName(option.name));row.value=option.id;control.append(row);}label.append(control);form.append(label);return control;
    };
    const component=select("Component",components);if(preselected)component.value=preselected;
    const screen=select("Screen",panels),parent=select("Parent group",[]);
    if(panels.some(panel=>panel.id===base.screenId))screen.value=base.screenId;
    let target:CompositionView|undefined;
    const submit=action("Insert component",()=>{},true);submit.type="submit";submit.onclick=null;submit.disabled=true;
    let sequence=0;
    const load=async()=>{
      const capture=++sequence;submit.disabled=true;target=undefined;parent.replaceChildren();
      try {
        const view=screen.value===base.screenId?base:await this.host.openScreen?.(screen.value);
        if(capture!==sequence || this.dialog!==dialog)return;
        if(!view || view.screenId!==screen.value)throw Error("The selected screen could not be refreshed.");target=view;
        for(const node of view.nodes.filter(node=>node.id && ["screen","fixed","frame","window","vbox","hbox","grid","viewport"].includes(node.kind))){const option=el("option","",node.kind==="screen"?"Screen root":`${displayName(node.kind)} · byte ${node.span.start}`);option.value=node.id!;parent.append(option);}
        if(view.nodes.some(node=>node.id===base.selected.id) && [...parent.options].some(option=>option.value===base.selected.id))parent.value=base.selected.id!;
        submit.disabled=!parent.value;error.textContent="";
      }catch(failure){error.textContent=(failure as Error).message;}
    };
    screen.onchange=()=>{void load();};
    const actions=el("div","screen-component-actions");actions.append(submit,action("Cancel",close));form.append(error,actions);dialog.append(form);
    form.onsubmit=event=>{event.preventDefault();if(this.working || !target || !parent.value)return;submit.disabled=true;
      void this.place(component.value,parent.value).then(()=>close()).catch(failure=>{error.textContent=(failure as Error).message;}).finally(()=>{submit.disabled=false;});};
    dialog.showModal();component.focus();await load();
  }
}
