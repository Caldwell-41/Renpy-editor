import assert from "node:assert/strict";
import test from "node:test";
import { ScreenComponents, type ScreenComponentsHost } from "../src/screen-components.ts";
import type { CompositionView } from "../src/screen-composition.ts";
import type { ScreenCatalog, ScreenRevisions, ResolvedScreenTarget } from "../src/screen-contracts.ts";
import type { ScreenNode } from "../src/screen-ui.ts";
import type { CoreOperation } from "../src/protocol.ts";

const revisions: ScreenRevisions = {source:"source",sourceMap:"map",inventory:"inventory",effects:"effects"};
const node = (id:string,kind:string,start:number,parentStart:number|null):ScreenNode => ({id,kind,literal:null,span:{start,end:start+10},parentStart,layout:{},properties:[],protected:[]});
function fixture() {
  const nodes = [node("root","screen",0,null),node("group","vbox",20,0)];
  const view:CompositionView = {document:{path:"game/ui/help.rpy",revision:"source",partial:false,screens:[{name:"help",nodes}]},screenId:"panel",screenName:"help",nodes,selected:nodes[1]!,step:"design",busy:false};
  const catalog:ScreenCatalog = {projectRevision:"project",sourceMapRevision:"map",inventoryRevision:"inventory",owned:[{id:"panel",rootId:"root",path:view.document.path,name:"help",kind:"panel",resolved:true,sourceRevision:"source"}]};
  const resolved:ResolvedScreenTarget = {binding:{screenId:"panel",sourceName:"help"},kind:"panel",path:view.document.path,rootId:"root",revisions,effects:{revision:"effects",unknown:false,hiddenScreens:[],dependencies:[]}};
  const calls:{operation:string;payload?:Record<string,unknown>}[] = [];
  let saved = 0;
  const host:ScreenComponentsHost = {view:()=>view,catalog:()=>catalog,current:()=>true,
    request:async<T>(operation:CoreOperation,payload?:Record<string,unknown>):Promise<T> => {calls.push({operation,payload});return (operation==="screens.resolveTarget"?resolved:operation==="screens.componentPrepareExtract"?{screenId:"panel",nodeId:"group",path:view.document.path,sourceRevision:"source",span:{start:20,end:30},source:"    vbox:\n"}:{componentId:"component",screenId:"panel",useId:"use"}) as T;},
    coordinate:task=>task(),accepted:async()=>view,openDefinition:async()=>view,source:()=>{},redraw:()=>{},note:()=>{},saved:()=>{saved++;}};
  return {controller:new ScreenComponents(host),host,view,catalog,calls,saved:()=>saved};
}

test("extract preparation captures exact Source without writing; naming submits one typed transaction",async()=>{
  const h=fixture();
  const prepared=await h.controller.prepareExtract();
  assert.equal(prepared.source,"    vbox:\n");
  assert.equal(h.saved(),0);
  assert.deepEqual(h.calls.map(c=>c.operation),["screens.resolveTarget","screens.componentPrepareExtract"]);
  await h.controller.extract("route_guide");
  assert.deepEqual(h.calls.at(-1),{operation:"screens.componentExtract",payload:{target:{screenId:"panel",sourceName:"help"},expected:revisions,expectedProjectRevision:"project",nodeId:"group",name:"route_guide"}});
  assert.equal(h.saved(),1);
});

test("placement requires an explicit current parent and preserves typed component intent",async()=>{
  const h=fixture();
  h.catalog.owned.push({id:"component",rootId:"component-root",name:"route_guide",path:"game/ui/route_guide.rpy",kind:"component",resolved:true,sourceRevision:"component-source"});
  const request=h.host.request;
  h.host.request=async<T>(operation:CoreOperation,payload?:Record<string,unknown>):Promise<T> => {
    if(operation==="screens.resolveTarget" && (payload?.binding as {screenId:string}).screenId==="component")return {binding:{screenId:"component",sourceName:"route_guide"},kind:"component",path:"game/ui/route_guide.rpy",rootId:"component-root",revisions:{...revisions,source:"component-source"},effects:{revision:"effects",unknown:false,hiddenScreens:[],dependencies:[]}} as T;
    return request<T>(operation,payload);
  };
  await assert.rejects(h.controller.place("component","missing"),/parent/);
  assert.equal(h.saved(),0);
  await h.controller.place("component","group");
  assert.deepEqual(h.calls.at(-1),{operation:"screens.componentPlace",payload:{component:{screenId:"component",sourceName:"route_guide"},expectedComponent:{...revisions,source:"component-source"},target:{screenId:"panel",sourceName:"help"},expectedTarget:revisions,parentId:"group"}});
  assert.equal(h.saved(),1);
});
