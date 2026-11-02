import type { CompositionView, CopyDraftParticipant } from "./screen-composition.ts";
import type { ComponentChange, ScreenCatalog, ResolvedScreenTarget } from "./screen-contracts.ts";
import type { CoreOperation } from "./protocol.ts";
import type { SourceTarget } from "./source-ui.ts";
import { technicalName } from "./authoring-input.ts";

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
  captureDrafts?(view: CompositionView): readonly CopyDraftParticipant[];
  source(target: SourceTarget): void;
  saved(): void;
  note(message: string, error?: boolean): void;
  redraw(): void;
}
export interface PreparedComponentGroup {
  screenId:string; nodeId:string; path:string; sourceRevision:string;
  span:{start:number;end:number}; source:string;
}
interface Extraction { view:CompositionView; target:ResolvedScreenTarget; projectRevision:string; group:PreparedComponentGroup }

/** Owns component workflows. Accepted source and ordinary field drafts keep their existing owners. */
export class ScreenComponents {
  private extraction?: Extraction;
  private working = false;
  private disposed = false;
  constructor(private readonly host: ScreenComponentsHost) {}
  isSaving(): boolean { return this.working; }
  hasPendingCopy(): boolean { return false; }
  dispose(): void { this.disposed=true;this.extraction=undefined; }
  private active(): boolean { return !this.disposed && this.host.current(); }
  private view(): CompositionView {
    const view=this.host.view();
    if(!this.active() || !view || view.busy)throw Error("Finish the current operation first. Your input is kept.");
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
      this.extraction=undefined;this.host.saved();
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
      this.host.saved();await this.host.accepted(change,{screenId:change.screenId,nodeId:change.useId});
      this.host.note(`Added ${owner.name} to ${view.screenName}.`);return change;
    } finally {this.working=false;}
  }
}
