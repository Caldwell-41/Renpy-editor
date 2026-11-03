import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { ScreensWorkspace, type ScreenDocument, type ScreenNode } from "../src/screen-ui.js";
import type { CoreOperation } from "../src/protocol.js";
import type { OwnedScreen, ResolvedScreenTarget } from "../src/screen-contracts.js";

const flush = async () => { for (let i = 0; i < 12; i++) await new Promise(resolve => setTimeout(resolve, 0)); };
const click = (name: string, host: ParentNode = document) => {
  const button = [...host.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent === name);
  assert.ok(button, `Missing button: ${name}`); button.click();
};
const owner = (id: string, kind: "panel" | "component"): OwnedScreen => ({
  id, rootId: `${id}-root`, path: `game/ui/${id}.rpy`, name: id, kind, resolved: true, sourceRevision: `${id}-source`,
});
const node = (id: string, kind: string, start: number, parentStart: number | null): ScreenNode => ({
  id, kind, literal: null, layout: {}, span: {start, end: start + 15}, parentStart, properties: [], protected: [],
});
const target = (item: OwnedScreen): ResolvedScreenTarget => ({
  binding: {screenId: item.id, sourceName: item.name}, kind: item.kind, path: item.path, rootId: item.rootId,
  revisions: {source: item.sourceRevision!, sourceMap: "map", inventory: "inventory", effects: "effects"},
  effects: {revision: "effects", unknown: false, hiddenScreens: [], dependencies: []},
});
const installDOM = () => {
  const browser = new Window();
  Object.assign(globalThis, {window: browser, document: browser.document, HTMLElement: browser.HTMLElement,
    HTMLInputElement: browser.HTMLInputElement, HTMLTextAreaElement: browser.HTMLTextAreaElement,
    HTMLSelectElement: browser.HTMLSelectElement, HTMLDetailsElement: browser.HTMLDetailsElement, ResizeObserver: browser.ResizeObserver});
  return browser;
};

test("one of two uses on a panel can be copied with a draft and applied separately", async () => {
  const browser = installDOM(), panel = owner("help", "panel"), original = owner("guide", "component"), copy = owner("guide_copy", "component");
  const use = (id: string, start: number): ScreenNode => ({...node(id, "use", start, 0), literal: original.name,
    component: {componentId: original.id, resolved: true, sourceRevision: original.sourceRevision}});
  const panelDoc: ScreenDocument = {path: panel.path, revision: panel.sourceRevision!, partial: false,
    screens: [{name: panel.name, nodes: [node(panel.rootId, "screen", 0, null), use("first-use", 20), use("second-use", 40)]}]};
  const definition = (item: OwnedScreen): ScreenDocument => ({path: item.path, revision: item.sourceRevision!, partial: false,
    screens: [{name: item.name, nodes: [node(item.rootId, "screen", 0, null),
      {...node(`${item.id}-text`, "text", 20, 0), literal: "Accepted", textProperties: {values: {size: 20}, blocked: {}}}]}]});
  const originalDoc = definition(original), copyDoc = definition(copy), owners = [panel, original], documents = [panelDoc, originalDoc];
  const writes: {operation: CoreOperation; payload?: Record<string, unknown>}[] = [];
  const workspace = new ScreensWorkspace({projectId: "same-panel-copy", resolution: {width: 1280, height: 720}, current: () => true,
    coordinate: task => task(), source: () => {}, preview: () => {}, saved: () => {},
    request: async <T>(operation: CoreOperation, payload?: Record<string, unknown>): Promise<T> => {
      if (operation === "source.list") return {files: documents.map(doc => ({path: doc.path}))} as T;
      if (operation === "screens.list") return {projectRevision: "project", sourceMapRevision: "map", inventoryRevision: "inventory", owned: structuredClone(owners)} as T;
      if (operation === "screens.inspect") return structuredClone(documents.find(doc => doc.path === payload?.path)) as T;
      if (operation === "screens.resolveTarget") return target(owners.find(item => item.id === (payload?.binding as {screenId: string}).screenId)!) as T;
      if (operation === "screens.componentReview") {
        const item = owners.find(item => item.id === payload?.componentId)!;
        const uses = panelDoc.screens[0]!.nodes.filter(n => n.component?.componentId === item.id).map(n => ({
          screenId: panel.id, componentId: item.id, nodeId: n.id, path: panel.path, screenName: panel.name,
          span: n.span, sourceRevision: panel.sourceRevision, resolved: true,
        }));
        return {component: target(item), affectedScreens: [panel], uses, complete: true} as T;
      }
      if (operation === "scene.list") return {sourceMapRevision: "map"} as T;
      if (operation === "screens.componentCopy") {
        writes.push({operation, payload});
        assert.equal(payload?.useId, "second-use");
        const selected = panelDoc.screens[0]!.nodes.find(n => n.id === payload?.useId)!;
        selected.literal = copy.name; selected.component = {componentId: copy.id, resolved: true, sourceRevision: copy.sourceRevision};
        owners.push(copy); documents.push(copyDoc);
        return {componentId: copy.id, screenId: panel.id, useId: selected.id} as T;
      }
      if (operation === "screens.compose") {
        writes.push({operation, payload});
        assert.equal(payload?.screenId, copy.id); assert.equal(payload?.expectedRevision, copy.sourceRevision);
        assert.deepEqual(payload?.command, {type: "formatText", nodeId: "guide_copy-text", values: {text: "Pending"}});
        const updated = structuredClone(copyDoc); updated.revision = "copy-applied"; updated.screens[0]!.nodes[1]!.literal = "Pending";
        return {document: updated, selectedId: "guide_copy-text", changed: true} as T;
      }
      if (operation === "screens.canvasStatus" || operation === "screens.canvasRender") return {phase: "unavailable", reason: "No renderer"} as T;
      if (operation === "authoring.list") return {assets: []} as T;
      throw Error(`Unexpected ${operation}`);
    }});
  try {
    workspace.mount(document.body); await flush();
    document.querySelector<HTMLButtonElement>('[data-node-id="second-use"]')!.click(); click("2  Design"); click("Edit component"); await flush();
    click("1  Choose"); document.querySelector<HTMLButtonElement>('[data-node-id="guide-text"]')!.click(); click("2  Design"); await flush();
    const input = document.querySelector<HTMLTextAreaElement>("textarea")!; input.value = "Pending"; input.dispatchEvent(new window.Event("input", {bubbles: true}));
    assert.equal(document.querySelector<HTMLElement>(".screen-component-scope")?.dataset.shared, "true");
    click("Make a copy for Help");
    const dialog = [...document.querySelectorAll("dialog")].find(item => item.ariaLabel === "Make a copy for Help")!;
    assert.ok(dialog); dialog.querySelector("input")!.value = copy.name;
    dialog.querySelector("form")!.dispatchEvent(new window.Event("submit", {bubbles: true, cancelable: true})); await flush();
    assert.deepEqual(writes.map(item => item.operation), ["screens.componentCopy"]);
    assert.equal(document.querySelector<HTMLTextAreaElement>("textarea")?.value, "Pending");
    document.querySelector<HTMLButtonElement>("[data-text-apply]")!.click(); await flush();
    assert.deepEqual(writes.map(item => item.operation), ["screens.componentCopy", "screens.compose"]);
  } finally {workspace.dispose(); await browser.happyDOM.abort();}
});

test("cancelling a component destination load preserves the screen, element and focus", async () => {
  const browser = installDOM(), panel = owner("help", "panel"), component = owner("guide", "component");
  const owners = [panel, component];
  const documents: ScreenDocument[] = owners.map(item => ({path:item.path, revision:item.sourceRevision!, partial:false,
    screens:[{name:item.name,nodes:[node(item.rootId,"screen",0,null),...(item === panel ? [{
      ...node("use-guide","use",20,0),literal:component.name,
      component:{componentId:component.id,resolved:true,sourceRevision:component.sourceRevision},
    }] : [])]}]}));
  let hold = false, held = false, release = () => {};
  const writes: CoreOperation[] = [];
  const workspace = new ScreensWorkspace({projectId:"cancel-destination",resolution:{width:1280,height:720},current:()=>true,
    coordinate:task=>task(),source:()=>{},preview:()=>{},saved:()=>{},request:async<T>(operation:CoreOperation,payload?:Record<string,unknown>):Promise<T>=>{
      if (hold && (operation === "source.list" || operation === "screens.inspect")) {
        hold=false;held=true;await new Promise<void>(resolve=>{release=resolve;});
      }
      if (operation === "source.list") return {files:documents.map(doc=>({path:doc.path}))} as T;
      if (operation === "screens.list") return {projectRevision:"project",sourceMapRevision:"map",inventoryRevision:"inventory",owned:structuredClone(owners)} as T;
      if (operation === "screens.inspect") return structuredClone(documents.find(doc=>doc.path === payload?.path)) as T;
      if (operation === "screens.resolveTarget") return target(owners.find(item=>item.id === (payload?.binding as {screenId:string}).screenId)!) as T;
      if (operation === "screens.componentReview") return {component:target(component),affectedScreens:[panel],uses:[{
        screenId:panel.id,componentId:component.id,nodeId:"use-guide",path:panel.path,screenName:panel.name,
        span:{start:20,end:35},sourceRevision:panel.sourceRevision,resolved:true,
      }],complete:true} as T;
      if (operation === "screens.canvasStatus" || operation === "screens.canvasRender") return {phase:"unavailable",reason:"No renderer"} as T;
      if (operation === "authoring.list") return {assets:[]} as T;
      writes.push(operation);throw Error(`Unexpected ${operation}`);
    }});
  try {
    workspace.mount(document.body);await flush();
    document.querySelector<HTMLButtonElement>('[data-node-id="use-guide"]')!.click();click("2  Design");click("Edit component");await flush();
    const screen = () => [...document.querySelectorAll<HTMLSelectElement>("select")].find(item=>item.ariaLabel === "Screen")!.value;
    const opener = [...document.querySelectorAll<HTMLButtonElement>("button")].find(item=>item.textContent === "Add to another screen…")!;
    opener.focus();hold=true;opener.click();await flush();assert.equal(held,true);
    const dialog = [...document.querySelectorAll("dialog")].find(item=>item.ariaLabel === "Add component")!;
    click("Cancel",dialog);release();await flush();
    assert.equal(screen(),JSON.stringify(["owned","guide"]));
    assert.equal(document.activeElement,opener);
    click("1  Choose");
    assert.equal(document.querySelector<HTMLButtonElement>('[data-node-id="guide-root"]')?.ariaSelected,"true");
    assert.deepEqual(writes,[]);
  } finally {release();workspace.dispose();await browser.happyDOM.abort();}
});
