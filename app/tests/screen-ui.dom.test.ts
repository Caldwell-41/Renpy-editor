import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { ScreensWorkspace, type ScreenDocument } from "../src/screen-ui.js";
import type { CoreOperation } from "../src/protocol.js";

const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const documentFor = (path: string, name?: string): ScreenDocument => ({ path, revision: "before", partial: false,
  screens: name ? [{ name, nodes: [{ kind: "frame", literal: null, layout: {}, span: { start: 30, end: 90 }, parentStart: null,
    properties: [{ property: "xsize", value: 640 }, { property: "ysize", value: 360 }], protected: [] }] }] : [] });
function harness(mixed = false, ownedRace?: "rename" | "revision" | "unavailable", canvas = false, movable = false, sibling = false) {
  const browser = new Window();
  Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, ResizeObserver: browser.ResizeObserver });
  let documents = mixed ? [documentFor("game/ui/a_styles.rpy"), documentFor("game/ui/help.rpy", "help"), documentFor("game/ui/pause.rpy", "pause")] : [documentFor("game/ui/help.rpy", "help")];
  if (movable) {
    const nodes=documents[0]!.screens[0]!.nodes;
    nodes[0]!.parentStart=10; nodes[0]!.position={xalign:0.5,yalign:0.5};
    nodes.unshift({kind:"fixed",literal:null,layout:{},span:{start:10,end:90},parentStart:null,properties:[],protected:[]});
    if(sibling) nodes.push({kind:"text",literal:"Sibling",layout:{},span:{start:100,end:120},parentStart:10,properties:[],protected:[]});
    documents.push(documentFor("game/ui/pause.rpy","pause"));
  }
  let settle: { resolve: (value: ScreenDocument) => void; reject: (error: Error) => void } | undefined;
  const sources: unknown[] = [];
  const calls: CoreOperation[] = [];
  const payloads: {operation:CoreOperation;payload?:Record<string,unknown>}[]=[];
  let canvasAvailable = true;
  let canvasFrame: Record<string, unknown> = {};
  const workspace = new ScreensWorkspace({ resolution: { width: 1280, height: 720 }, current: () => true,
    coordinate: task => task(), source: target => { sources.push(target); }, preview: () => {}, saved: () => {},
    request: async <T>(operation: CoreOperation, payload?: Record<string, unknown>): Promise<T> => {
      calls.push(operation);
      payloads.push({operation,payload});
      if (operation === "source.list") return { files: documents.map(d => ({ path: d.path })) } as T;
      if (operation === "screens.list") return { projectRevision: "project", sourceMapRevision: "map", inventoryRevision: "files", owned: ownedRace ? [{ id: "owned-help", rootId: "owned-root", name: "help", path: "game/ui/help.rpy", resolved: true, sourceRevision: "before" }] : [] } as T;
      if (operation === "screens.inspect") {
        if (ownedRace === "unavailable") throw new Error("Source changed during inspection");
        return ownedRace ? { ...documentFor("game/ui/help.rpy", ownedRace === "rename" ? "neighbor" : "help"), revision: "after" } as T : documents.find(d => d.path === payload?.path) as T;
      }
      if (operation === "screens.setSize" || operation === "screens.setPosition") return await new Promise<ScreenDocument>((resolve, reject) => { settle = { resolve, reject }; }) as T;
      if (operation === "screens.canvasStatus" && canvas) return {phase:"ready"} as T;
      if (operation === "screens.canvasRender" && canvas) return (canvasAvailable ? { phase:"ready", frameId:"fixture-frame", revision:"before", width:1280, height:720,
        image:"data:image/png;base64,fixture", geometry:[{start:10,x:0,y:0,width:1280,height:720},{start:30,x:320,y:180,width:640,height:360},
          ...(sibling ? [{start:100,x:10,y:10,width:100,height:30}] : [])], ...canvasFrame } : {phase:"unavailable",message:"Helper stopped. Drafts retained."}) as T;
      throw new Error(operation);
    } });
  workspace.mount(document.body);
  const click = (text: string) => { const b = [...document.querySelectorAll("button")].find(b => b.textContent === text)!; assert.ok(b, text); b.focus(); b.click(); return b; };
  const field = (name: string) => { const input = [...document.querySelectorAll("input")].find(i => i.ariaLabel === name); assert.ok(input, document.body.innerHTML); return input; };
  return { workspace, click, field, sources, calls, payloads, stopHelper: () => { canvasAvailable = false; }, removePause: () => { documents = documents.filter(d => !d.path.endsWith("pause.rpy")); },
    setCanvasFrame: (frame: Record<string, unknown>) => { canvasFrame = frame; },
    accept: () => { const accepted = structuredClone(documents.find(d => d.screens.length)!); accepted.revision = "accepted"; accepted.screens[0]!.nodes[0]!.properties[0]!.value = 750; settle!.resolve(accepted); },
    refuse: () => settle!.reject(new Error("Draft conflict")), dispose: () => workspace.dispose() };
}

test("move reference pixels depend on the installed helper image, including mid-gesture replacement", async () => {
  const h = harness(false, undefined, true, true);
  try {
    await tick(); await tick();
    const zoom = [...document.querySelectorAll('select')].find(e => e.ariaLabel === 'Canvas zoom')!;
    zoom.value = "100"; zoom.dispatchEvent(new window.Event("change"));
    const image = document.querySelector<HTMLImageElement>('.screen-render')!;
    image.dispatchEvent(new window.Event("load"));
    document.querySelector<HTMLButtonElement>('.screen-node-frame')!.click();
    image.dispatchEvent(new window.Event("load"));
    const handle = document.querySelector<HTMLButtonElement>('.screen-move')!;
    handle.setPointerCapture = () => {}; handle.hasPointerCapture = () => false;
    const pointer = (type: string, x: number) => handle.dispatchEvent(new window.PointerEvent(type, {button:0,pointerId:1,clientX:x,clientY:200,bubbles:true}));
    h.setCanvasFrame({frameId:"generation-1", image:"data:image/png;base64,replacement",
      geometry:[{start:10,x:0,y:0,width:1280,height:720},{start:30,x:328,y:180,width:640,height:360}]});
    pointer('pointerdown',400); pointer('pointermove',408);
    assert.equal(image.src, 'data:image/png;base64,fixture');
    assert.equal(image.style.transform, 'translate(8px, 0px)');
    await tick(); await tick();
    // Happy DOM dispatches load synchronously for data URLs.
    assert.equal(image.src, 'data:image/png;base64,replacement');
    assert.equal(image.style.transform, 'translate(0px, 0px)');
    assert.equal(document.querySelector<HTMLElement>('.screen-game')!.dataset.provisional, 'panel', 'Panel mode alone cannot distinguish settled pixels');
    pointer('pointermove',416);
    assert.equal(image.style.transform, 'translate(8px, 0px)', 'The next translation uses the replacement image, not the baseline');
    assert.equal(document.querySelector<HTMLElement>('.screen-node-frame')!.style.left, '336px');
  } finally { h.dispose(); }
});

test("text and resize requests keep stale content until image load, even when guides change", async () => {
  for (const series of ['text','resize']) {
    const h = harness(false, undefined, true, true, true);
    try {
      await tick(); await tick();
      const image = document.querySelector<HTMLImageElement>('.screen-render')!;
      image.dispatchEvent(new window.Event('load'));
      document.querySelector<HTMLButtonElement>(series === 'text' ? '.screen-node-text' : '.screen-node-frame')!.click();
      image.dispatchEvent(new window.Event('load'));
      h.setCanvasFrame({frameId:'new-content',image:'data:image/png;base64,newcontent'});
      if (series === 'text') {
        const input = [...document.querySelectorAll('textarea')].find(e => e.ariaLabel === 'Canvas text sample')!;
        input.value = 'Changed text'; input.dispatchEvent(new window.Event('input'));
      } else {
        const handle = document.querySelector<HTMLButtonElement>('.screen-resize')!;
        handle.setPointerCapture = () => {}; handle.hasPointerCapture = () => false;
        handle.dispatchEvent(new window.PointerEvent('pointerdown',{button:0,pointerId:1,clientX:100,clientY:100,bubbles:true}));
        handle.dispatchEvent(new window.PointerEvent('pointermove',{pointerId:1,clientX:116,clientY:116,bubbles:true}));
      }
      const canvas = document.querySelector<HTMLElement>('.screen-game')!;
      assert.equal(image.src, 'data:image/png;base64,fixture');
      assert.equal(image.style.transform, '');
      assert.equal(canvas.dataset.stale, 'true');
      assert.notEqual(canvas.dataset.provisional, 'panel');
      await tick(); await tick();
      assert.equal(canvas.dataset.stale, 'false');
      assert.equal(image.src, 'data:image/png;base64,newcontent');
    } finally { h.dispose(); }
  }
});

test("aligned frame dragging previews game coordinates, cancels and retains a refused move", async () => {
  const h=harness(false,undefined,true,true);
  try {
    await tick(); await tick();
    const zoom=[...document.querySelectorAll("select")].find(e=>e.ariaLabel==="Canvas zoom")!;
    zoom.value="100"; zoom.dispatchEvent(new window.Event("change"));
    document.querySelector("img")!.dispatchEvent(new window.Event("load"));
    document.querySelector<HTMLButtonElement>('.screen-node-frame')!.click();
    document.querySelector('img')!.dispatchEvent(new window.Event('load'));
    const target=document.querySelector<HTMLButtonElement>('.screen-move')!;
    assert.ok(target, 'The selected aligned frame has an explicit move handle');
    target.setPointerCapture=()=>{};target.releasePointerCapture=()=>{};target.hasPointerCapture=()=>true;
    const pointer=(type:string,x:number,y:number)=>target.dispatchEvent(new window.PointerEvent(type,{button:0,pointerId:1,clientX:x,clientY:y,bubbles:true}));
    pointer("pointerdown",400,200); pointer("pointermove",464,236);
    assert.equal(document.querySelector<HTMLElement>('.screen-node-frame')!.style.left, '384px', 'Selection follows the pointer before helper delivery');
    const translation=document.querySelector<HTMLImageElement>('.screen-render')!.style.transform;
    const offsets=translation.match(/-?[\d.]+/g)!.map(Number);
    assert.ok(Math.abs(offsets[0]!-64)<0.001 && Math.abs(offsets[1]!-40)<0.001, 'The last complete panel image follows the pointer');
    await tick(); await tick();
    const draft=h.payloads.filter(p=>p.operation==="screens.canvasRender").at(-1)!.payload!;
    assert.deepEqual(draft.positions,[{nodeStart:30,xalign:0.6,yalign:0.6111111111111112}],"64 by 40 snapped game pixels must preserve alignment coordinates");
    assert.equal(h.calls.includes("screens.setPosition"),false,"Holding the pointer must not write");
    const picker=document.querySelector("select")!;
    picker.value=JSON.stringify(["game/ui/pause.rpy","pause"]);picker.dispatchEvent(new window.Event("change"));
    assert.deepEqual(JSON.parse(picker.value),["game/ui/help.rpy","help"],"A held gesture must keep its originating screen");
    target.dispatchEvent(new window.KeyboardEvent("keydown",{key:"Escape",bubbles:true}));
    pointer("pointerup",464,236);
    assert.equal(h.workspace.hasDraft(),false); assert.equal(h.calls.includes("screens.setPosition"),false);
    await tick(); await tick(); document.querySelector("img")!.dispatchEvent(new window.Event("load"));
    const cancelled=document.querySelector<HTMLButtonElement>('.screen-move')!;
    cancelled.setPointerCapture=()=>{};cancelled.releasePointerCapture=()=>{};cancelled.hasPointerCapture=()=>true;
    cancelled.dispatchEvent(new window.PointerEvent("pointerdown",{button:0,pointerId:3,clientX:400,clientY:200,bubbles:true}));
    h.click("Cancel changes");
    cancelled.dispatchEvent(new window.PointerEvent("pointermove",{pointerId:3,clientX:464,clientY:232,bubbles:true}));
    cancelled.dispatchEvent(new window.PointerEvent("pointerup",{pointerId:3,bubbles:true}));
    assert.equal(h.calls.includes("screens.setPosition"),false,"Cancel must release the held gesture before another pointer event");
    await tick(); await tick();document.querySelector("img")!.dispatchEvent(new window.Event("load"));
    const next=document.querySelector<HTMLButtonElement>('.screen-move')!;
    next.setPointerCapture=()=>{};next.releasePointerCapture=()=>{};next.hasPointerCapture=()=>true;
    next.dispatchEvent(new window.PointerEvent("pointerdown",{button:0,pointerId:2,clientX:400,clientY:200,bubbles:true}));
    next.dispatchEvent(new window.PointerEvent("pointermove",{pointerId:2,clientX:464,clientY:232,bubbles:true}));
    next.dispatchEvent(new window.PointerEvent("pointerup",{pointerId:2,bubbles:true}));
    assert.equal(h.calls.filter(op=>op==="screens.setPosition").length,1);
    assert.equal(document.activeElement, next, 'Release retains focus while acceptance is pending');
    assert.equal(next.isConnected, true);
    h.refuse(); await tick();
    assert.equal(h.workspace.hasDraft(),true); assert.match(document.querySelector('.screen-message')!.textContent!,/Draft conflict.*retained/);
    h.click("Cancel changes"); assert.equal(h.workspace.hasDraft(),false);
  } finally {h.dispose();}
});

test("moving a frame with sibling content keeps the composite image stationary", async () => {
  const h=harness(false,undefined,true,true,true);
  try {
    await tick();await tick();document.querySelector('img')!.dispatchEvent(new window.Event('load'));
    document.querySelector<HTMLButtonElement>('.screen-node-frame')!.click();
    document.querySelector('img')!.dispatchEvent(new window.Event('load'));
    const handle=document.querySelector<HTMLButtonElement>('.screen-move')!;
    handle.setPointerCapture=()=>{};handle.hasPointerCapture=()=>false;
    handle.dispatchEvent(new window.PointerEvent('pointerdown',{button:0,pointerId:1,clientX:20,clientY:20,bubbles:true}));
    handle.dispatchEvent(new window.PointerEvent('pointermove',{pointerId:1,clientX:36,clientY:36,bubbles:true}));
    assert.equal(document.querySelector<HTMLImageElement>('.screen-render')!.style.transform,'');
    assert.equal(document.querySelector<HTMLElement>('.screen-game')!.dataset.provisional,'guides');
    assert.match(document.querySelector('.screen-canvas-status')!.textContent!,/Panel rendering is pending/);
  } finally {h.dispose();}
});

test("a hidden Screens workspace releases its polling and validates a fresh frame on remount", async () => {
  const h=harness(false,undefined,true);
  try {
    await tick();await tick();
    document.querySelector('img')!.dispatchEvent(new window.Event('load'));
    h.workspace.panel.remove();
    await new Promise(resolve=>setTimeout(resolve,550));
    assert.equal(h.calls.filter(op=>op==='screens.canvasStatus').length,0,"Hidden Screens must not compete with another editor's shared service");
    h.stopHelper();h.workspace.mount(document.body);await tick();await tick();
    assert.equal(document.querySelector('.screen-game')?.getAttribute('data-stale'),'true');
    assert.equal(document.querySelector('.screen-node'),null,"A remounted workspace must not reuse unchecked geometry");
    assert.match(document.querySelector('.screen-canvas-status')!.textContent!,/stopped|unavailable|retained/i);
  } finally {h.dispose();}
});

test("Screens keeps a focused draft and disables old geometry when the helper becomes unavailable", async () => {
  const h = harness(false,undefined,true);
  try {
    await tick(); await tick();
    const image = document.querySelector<HTMLImageElement>('img[aria-label="Ren\'Py screen canvas"]');
    assert.ok(image,`The canvas must show the helper's pixels. ${document.querySelector('.screen-canvas-status')?.textContent}`);
    image.dispatchEvent(new window.Event("load"));
    h.click("2  Design");
    h.stopHelper();
    const width=h.field("Width"); width.focus(); width.value="750"; width.dispatchEvent(new window.Event("input"));
    await tick(); await tick();
    assert.equal(document.activeElement,width);
    assert.equal(width.value,"750"); assert.equal(h.workspace.hasDraft(),true);
    assert.equal(document.querySelector('.screen-resize'),null,"Old geometry cannot manipulate a newer draft");
    assert.match(document.querySelector('.screen-canvas-status')!.textContent!,/retained|unavailable/i);
  } finally { h.dispose(); }
});

for (const race of ["rename", "revision", "unavailable"] as const) test(`Owned selection stays unresolved when ${race} changes between catalog and inspection`, async () => {
  const h = harness(false, race);
  try {
    await tick();
    assert.deepEqual(JSON.parse(document.querySelector("select")!.value), ["owned", "owned-help"]);
    assert.match(document.querySelector(".screen-message")!.textContent!, /Unresolved owned screen help/);
    assert.equal(document.querySelectorAll('.screen-tree [role="option"]').length, 0);
    h.click("View in Source"); assert.deepEqual(h.sources, []);
  } finally { h.dispose(); }
});

test("Screens selects a supported declaration in mixed inventory and keeps a valid selection on refresh", async () => {
  const h = harness(true);
  try {
    await tick(); const picker = document.querySelector("select")!;
    assert.deepEqual(JSON.parse(picker.value), ["game/ui/help.rpy", "help"]);
    assert.ok(document.querySelector(".screen-tree button"));
    picker.value = JSON.stringify(["game/ui/pause.rpy", "pause"]); picker.dispatchEvent(new window.Event("change"));
    await h.workspace.load(); assert.deepEqual(JSON.parse(picker.value), ["game/ui/pause.rpy", "pause"]);
    h.removePause(); await h.workspace.load(); assert.deepEqual(JSON.parse(picker.value), ["game/ui/help.rpy", "help"]);
  } finally { h.dispose(); }
});

for (const control of ["Width", "Height", "Apply changes"]) for (const refused of [false, true]) {
  test(`Screens Apply retains the ${control} control and focus through ${refused ? "refusal" : "success"}`, async () => {
    const h = harness();
    try {
      await tick(); h.click("2  Design"); const width = h.field("Width"); width.value = "750"; width.dispatchEvent(new window.Event("input"));
      const active = control === "Apply changes" ? h.click(control) : h.field(control);
      if (control !== "Apply changes") { active.focus(); active.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })); }
      assert.ok(document.activeElement === active, "dispatch must retain the original focused control and caret");
      assert.equal(active.isConnected, true);
      assert.equal(width.readOnly, true, "pending input cannot race an accepted edit");
      if (refused) h.refuse(); else h.accept(); await tick();
      assert.ok(document.activeElement === active, "completion must retain the original focused control and caret"); assert.equal(active.isConnected, true);
      assert.equal(width.value, "750"); assert.equal(width.readOnly, false);
      assert.equal(h.workspace.hasDraft(), refused);
    } finally { h.dispose(); }
  });
}
