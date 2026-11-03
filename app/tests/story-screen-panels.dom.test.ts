import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { renderSceneAuthoring, type SceneActions, type SceneCommand, type SceneWorkspace, type ScreenInsertion } from "../src/scene-ui.js";
import type { ResolvedScreenTarget, ScreenCatalog, ScreenTargetBinding } from "../src/screen-contracts.js";
import { storyFixture } from "./story-controls-fixture.js";

const binding: ScreenTargetBinding = { screenId: "panel-id", sourceName: "help_panel" };
const revisions = { source: "panel-source", sourceMap: "map", inventory: "inventory", effects: "effect" };
const target: ResolvedScreenTarget = { binding, kind: "panel", blocking: false, path: "game/ui/help.rpy", rootId: "root", revisions, effects: { revision: "effect", unknown: true, hiddenScreens: ["panel-id"], finishesInteraction: false, dependencies: [] } };
const catalog: ScreenCatalog = { projectRevision: "project", sourceMapRevision: "map", inventoryRevision: "inventory", owned: [
  { id: "component-id", name: "guide", path: "game/ui/guide.rpy", rootId: "component-root", kind: "component", resolved: true, sourceRevision: "component-source" },
  { id: "missing-id", name: "missing", path: "game/ui/missing.rpy", rootId: "missing-root", kind: "panel", resolved: false, sourceRevision: null },
  { id: binding.screenId, name: binding.sourceName, path: target.path, rootId: target.rootId, kind: "panel", resolved: true, sourceRevision: revisions.source },
] };
const tick = async () => { await new Promise(resolve => setTimeout(resolve, 0)); };
function button(host: ParentNode, text: string) { const result = [...host.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent === text); assert.ok(result, text); return result; }
function fixture(): SceneWorkspace { const base = storyFixture(); return { ...base, scenes: [{ ...base.scenes[0]!, beats: [
  { id: "line", byteStart: 20, byteEnd: 40, protected: false, payload: { type: "narration", text: "The tram moves." } },
  { id: "end", byteStart: 40, byteEnd: 51, protected: false, payload: { type: "return" } },
] }] }; }
function setup(overrides: Partial<SceneActions> = {}, model = fixture()) {
  const browser = new Window(); Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, HTMLInputElement: browser.HTMLInputElement, HTMLSelectElement: browser.HTMLSelectElement, Event: browser.Event, KeyboardEvent: browser.KeyboardEvent });
  document.body.innerHTML = '<main></main><aside></aside>'; const host = document.querySelector<HTMLElement>("main")!;
  const commands: SceneCommand[] = [], resolutions: ScreenTargetBinding[] = [], messages: string[] = [];
  const dispose = renderSceneAuthoring(host, document.querySelector("aside")!, model, {
    resolution: { width: 1280, height: 720 }, present: async () => { throw Error("No media"); }, status: value => messages.push(value),
    apply: async command => { commands.push(command); throw Error("STALE_SCREEN_REVISION"); },
    screenCatalog: async () => catalog, resolveScreenTarget: async value => { resolutions.push(value); return structuredClone(target); }, ...overrides,
  });
  return { host, commands, resolutions, messages, close: async () => { dispose(); await browser.happyDOM.close(); } };
}
function openNew(host: HTMLElement, type: string) {
  button(host, "Add Beat").click();
  const panel = host.querySelector<HTMLElement>(".new-beat")!;
  const select = panel.querySelector<HTMLSelectElement>("select")!; select.value = type; select.dispatchEvent(new Event("change", { bubbles: true })); return panel;
}

test("Story Show picker resolves only owned Panels and retains captured revisions after a refused Apply", async () => {
  const s = setup(); const panel = openNew(s.host, "showScreen"); await tick();
  const picker = panel.querySelector<HTMLSelectElement>('[aria-label="Panel screen"]')!;
  assert.ok(picker); assert.deepEqual([...picker.options].map(item => item.value), [binding.screenId]);
  assert.deepEqual(s.resolutions, [binding]);
  assert.match(panel.textContent!, /dialogue continues/);
  button(panel, "Add Beat").click(); await tick(); button(panel, "Add Beat").click(); await tick();
  assert.equal(s.commands.length, 2);
  assert.deepEqual(s.commands[0]!.beat, { type: "showScreen", target: binding, revisions });
  assert.deepEqual(s.commands[1], s.commands[0]); assert.equal(s.resolutions.length, 1);
  assert.equal(picker.value, binding.screenId); assert.ok(panel.isConnected); assert.match(s.messages.at(-1)!, /Input retained/);
  await s.close();
});

test("editor Escape cancels a new Hide operation without sending a game action or Beat write", async () => {
  const s = setup(); const panel = openNew(s.host, "hideScreen"); await tick();
  panel.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  assert.equal(panel.isConnected, false); assert.equal(s.commands.length, 0);assert.equal(s.host.querySelector(".story-screen-pending"),null);
  await s.close();
});

test("renamed hint retains its original intent until the author explicitly selects the current Panel", async () => {
  const renamed = { ...catalog, owned: catalog.owned.map(screen => screen.id === binding.screenId ? { ...screen, name: "renamed_help" } : screen) };
  const s = setup({ screenHint: binding, screenCatalog: async () => renamed, resolveScreenTarget: async value => ({ ...target, binding: value }) });
  assert.equal(s.commands.length, 0); assert.equal(s.host.querySelector(".new-beat"), null);
  const panel = openNew(s.host, "hideScreen"); await tick();
  const picker = panel.querySelector<HTMLSelectElement>('[aria-label="Panel screen"]')!;
  assert.match(picker.selectedOptions[0]!.textContent!, /help_panel.*Unavailable/);
  button(panel, "Add Beat").click(); await tick(); assert.equal(s.commands.length, 0);
  picker.value = binding.screenId; picker.dispatchEvent(new Event("change", { bubbles: true })); await tick();
  button(panel, "Add Beat").click(); await tick();
  assert.deepEqual(s.commands[0]!.beat, { type: "hideScreen", target: { ...binding, sourceName: "renamed_help" }, revisions });
  await s.close();
});

test("existing screen Beats keep exact Source navigation, conservative effects and editor cancellation", async () => {
  const base = fixture(), sourceCalls: unknown[][] = [];
  const screenBeat = { id: "show", byteStart: 40, byteEnd: 67, protected: false, screenEffects: target.effects, payload: { type: "showScreen" as const, target: binding, revisions } };
  const model: SceneWorkspace = { ...base, scenes: [{ ...base.scenes[0]!, beats: [base.scenes[0]!.beats[0]!, screenBeat, { ...base.scenes[0]!.beats[1]!, byteStart: 67, byteEnd: 78 }] }] };
  const s = setup({ viewSource: (...args) => { sourceCalls.push(args); } }, model);
  s.host.querySelector<HTMLButtonElement>('[data-beat-id="show"] .beat-select')!.click(); await tick();
  const editor = s.host.querySelector<HTMLElement>('[data-beat-type="showScreen"]')!;
  assert.match(editor.textContent!, /Effects unknown/);
  assert.equal(s.resolutions.length, 0, "workspace revisions must not be refreshed by opening the row");
  button(s.host, "View in Source").click(); assert.deepEqual(sourceCalls, [[model.scenes[0]!.sourcePath, 40, 67, "source"]]);
  editor.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  assert.equal(editor.isConnected, false); assert.equal(s.commands.length, 0);
  await s.close();
});

test("unresolved typed Beat stays protected even when a different Panel has the same source name", async () => {
  const base = fixture(); const model: SceneWorkspace = { ...base, scenes: [{ ...base.scenes[0]!, beats: [
    { id: "unresolved", byteStart: 20, byteEnd: 47, protected: true, payload: { type: "showScreen", target: { screenId: "deleted-panel", sourceName: "help_panel" } } }, base.scenes[0]!.beats[1]!,
  ] }] };
  const s = setup({}, model); s.host.querySelector<HTMLButtonElement>('[data-beat-id="unresolved"] .beat-select')!.click(); await tick();
  assert.equal(s.host.querySelector('[aria-label="Panel screen"]'), null); assert.equal(s.resolutions.length, 0); assert.equal(s.commands.length, 0);
  assert.match(s.host.querySelector('[data-beat-id="unresolved"]')!.textContent!, /Protected source/);
  await s.close();
});

test("late target resolution cannot replace the author's newer explicit Panel selection", async () => {
  let finish!: (value: ResolvedScreenTarget) => void;
  const nextBinding = { screenId: "about-panel", sourceName: "about" };
  const nextTarget = { ...target, binding: nextBinding, revisions: { ...revisions, source: "about-source" } };
  const s = setup({ screenCatalog: async () => ({ ...catalog, owned: [...catalog.owned, { ...catalog.owned[2]!, id: nextBinding.screenId, name: nextBinding.sourceName }] }),
    resolveScreenTarget: async value => value.screenId === binding.screenId ? new Promise(resolve => { finish = resolve; }) : nextTarget });
  const draft = openNew(s.host, "showScreen"); await tick();
  const picker = draft.querySelector<HTMLSelectElement>('[aria-label="Panel screen"]')!;
  picker.value = nextBinding.screenId; picker.dispatchEvent(new Event("change", { bubbles: true })); await tick();
  finish(target); await tick(); button(draft, "Add Beat").click(); await tick();
  assert.deepEqual(s.commands[0]!.beat, { type: "showScreen", target: nextBinding, revisions: nextTarget.revisions });
  await s.close();
});

test("a new screen draft captures the navigation hint before the asynchronous catalog read", async () => {
  const hint = { ...binding }; let finish!: (value: ScreenCatalog) => void;
  const s = setup({ screenHint: hint, screenCatalog: async () => new Promise(resolve => { finish = resolve; }) });
  const draft = openNew(s.host, "showScreen"); hint.sourceName = "different_name"; finish(catalog); await tick();
  button(draft, "Add Beat").click(); await tick();
  assert.deepEqual(s.commands[0]!.beat, { type: "showScreen", target: binding, revisions });
  await s.close();
});

test("existing Show draft captures its workspace revisions before catalog refresh settles", async () => {
  const supplied = { ...revisions }, base = fixture(); let finish!: (value: ScreenCatalog) => void;
  const model: SceneWorkspace = { ...base, scenes: [{ ...base.scenes[0]!, beats: [
    { id: "show", byteStart: 20, byteEnd: 47, protected: false, payload: { type: "showScreen", target: binding, revisions: supplied } }, base.scenes[0]!.beats[1]!,
  ] }] };
  const s = setup({ screenCatalog: async () => new Promise(resolve => { finish = resolve; }) }, model);
  s.host.querySelector<HTMLButtonElement>('[data-beat-id="show"] .beat-select')!.click(); supplied.source = "newer-revision"; finish(catalog); await tick();
  button(s.host.querySelector('[data-beat-type="showScreen"]')!, "Commit Beat").click(); await tick();
  assert.deepEqual(s.commands[0]!.beat, { type: "showScreen", target: binding, revisions });
  await s.close();
});

test("Use in Story offers an explicit screen Beat action with the selected panel hint", async () => {
  const s = setup({screenHint:{...binding}});
  try {
    button(s.host,"Add screen Beat").click();await tick();
    const draft=s.host.querySelector<HTMLElement>(".new-beat")!;
    assert.equal(draft.querySelector<HTMLSelectElement>("select")!.value,"showScreen");
    assert.equal(draft.querySelector<HTMLSelectElement>('[aria-label="Panel screen"]')!.value,binding.screenId);
    assert.deepEqual(s.commands,[]);
  } finally {await s.close();}
});

test("Call screen chooses only dialogs and retains the selected insertion anchor after refusal", async () => {
  const dialogBinding={screenId:"dialog-id",sourceName:"help_dialog"};
  const dialogTarget:ResolvedScreenTarget={...target,binding:dialogBinding,kind:"dialog",blocking:true,effects:{...target.effects,unknown:false,hiddenScreens:[],finishesInteraction:true}};
  const s=setup({screenCatalog:async()=>({...catalog,owned:[...catalog.owned,{...catalog.owned[2]!,id:dialogBinding.screenId,name:dialogBinding.sourceName,kind:"dialog"}]}),resolveScreenTarget:async()=>dialogTarget});
  const draft=openNew(s.host,"callScreen");await tick();
  const picker=draft.querySelector<HTMLSelectElement>('[aria-label="Dialog screen"]');assert.ok(picker);assert.deepEqual([...picker.options].map(o=>o.value),[dialogBinding.screenId]);
  const position=draft.querySelector<HTMLSelectElement>('[aria-label="Insert before"]');assert.ok(position);assert(![...position.options].some(o=>o.textContent==="End of body"));
  position.value="line";position.dispatchEvent(new Event("change",{bubbles:true}));
  const marker=s.host.querySelector(".story-screen-pending");assert.ok(marker);assert.equal(marker.nextElementSibling?.getAttribute("data-beat-id"),"line");assert.match(marker.textContent!,/Pending Call screen/);
  button(draft,"Add Beat").click();await tick();
  assert.deepEqual(s.commands[0]!.body,{type:"root"});assert.deepEqual(s.commands[0]!.position,{type:"before",anchor:{type:"beat",beatId:"line"}});
  assert.deepEqual(s.commands[0]!.beat,{type:"callScreen",target:dialogBinding,revisions});
  assert.equal(position.value,"line");assert.ok(draft.isConnected);assert.match(s.messages.at(-1)!,/Input retained/);
  await s.close();
});

test("screen draft Source and effects follows Add and Cancel and navigates only accepted screen source",async()=>{
 const sourceCalls:unknown[][]=[];const s=setup({viewSource:(...args)=>sourceCalls.push(args)});const draft=openNew(s.host,"showScreen");await tick();
 const secondary=draft.querySelector<HTMLElement>(".story-screen-secondary");assert.ok(secondary);assert.equal(secondary.querySelector("summary")?.textContent,"Source and effects");
 const row=draft.querySelector<HTMLElement>(".row-actions")!;assert.equal(row.nextElementSibling,secondary);assert.deepEqual([...row.querySelectorAll("button")].map(b=>b.textContent),["Add Beat","Cancel"]);
 button(secondary,"View screen in Source").click();assert.deepEqual(sourceCalls,[[target.path,undefined,undefined,revisions.source]]);assert.equal(s.commands.length,0);await s.close();
});

test("retained screen insertion refuses a changed Scene or missing anchor until an explicit location choice",async()=>{
 for(const mode of ["changed","missing"]){
  const model=fixture(),scene=model.scenes[0]!,remembered:unknown[]=[];
  const dialogBinding={screenId:"dialog-id",sourceName:"help_dialog"};const dialogTarget:ResolvedScreenTarget={...target,binding:dialogBinding,kind:"dialog",blocking:true,effects:{...target.effects,unknown:false}};
  const s=setup({screenHint:dialogBinding,screenHintKind:"dialog",screenInsertion:{sceneId:scene.id,body:{type:"root"},position:{type:"before",anchor:{type:"beat",beatId:mode==="missing"?"removed":"line"}},expectedSourceRevision:mode==="changed"?"old":scene.sourceRevision},rememberScreenInsertion:value=>remembered.push(value),screenCatalog:async()=>({...catalog,owned:[{...catalog.owned[2]!,id:dialogBinding.screenId,name:dialogBinding.sourceName,kind:"dialog"}]}),resolveScreenTarget:async()=>dialogTarget},model);
  const draft=openNew(s.host,"callScreen");await tick();button(draft,"Add Beat").click();await tick();assert.equal(s.commands.length,0);assert.equal(remembered.length,0);assert.ok(draft.isConnected);
  const position=draft.querySelector<HTMLSelectElement>('[aria-label="Insert before"]')!;position.value="line";position.dispatchEvent(new Event("change",{bubbles:true}));button(draft,"Add Beat").click();await tick();assert.equal(s.commands.length,1);assert.equal((remembered.at(-1) as {expectedSourceRevision:string}).expectedSourceRevision,scene.sourceRevision);await s.close();
 }
});

test("unknown or nonblocking Dialog is refused before a new Call write",async()=>{
 for(const state of ["unknown","nonblocking"]){const b={screenId:"dialog-id",sourceName:"help_dialog"};
  const s=setup({screenCatalog:async()=>({...catalog,owned:[{...catalog.owned[2]!,id:b.screenId,name:b.sourceName,kind:"dialog"}]}),resolveScreenTarget:async()=>({...target,binding:b,kind:"dialog",blocking:state!=="nonblocking",effects:{...target.effects,unknown:state==="unknown"}})});
  const draft=openNew(s.host,"callScreen");await tick();button(draft,"Add Beat").click();await tick();assert.equal(s.commands.length,0);assert.ok(draft.isConnected);assert.match(draft.textContent!,/blocking Dialog with known/);await s.close();
 }
});

test("screen insertion keeps existing nested body ownership",async()=>{
 const base=fixture(),scene=base.scenes[0]!;const model:SceneWorkspace={...base,scenes:[{...scene,beats:[
  {id:"branch",byteStart:10,byteEnd:20,protected:false,conditionalBranch:{groupId:"group",otherwise:false,condition:{status:"supported",expression:{type:"bool",value:true}}},payload:{type:"customCode",source:"if True:",reason:"Condition"}},
  {...scene.beats[0]!,owner:{groupId:"group",branchId:"branch"}},scene.beats[1]!
 ]}]};const s=setup({},model);const draft=openNew(s.host,"showScreen");await tick();
 const body=draft.querySelector<HTMLSelectElement>('[aria-label="Insert in"]')!;body.value="branch";body.dispatchEvent(new Event("change",{bubbles:true}));
 const position=draft.querySelector<HTMLSelectElement>('[aria-label="Insert before"]')!;position.value="line";position.dispatchEvent(new Event("change",{bubbles:true}));button(draft,"Add Beat").click();await tick();
 assert.deepEqual(s.commands[0]!.body,{type:"branch",groupId:"group",branchId:"branch"});assert.deepEqual(s.commands[0]!.position,{type:"before",anchor:{type:"beat",beatId:"line"}});assert.equal(s.host.querySelector(".story-screen-pending")!.parentElement?.getAttribute("data-branch-id"),"branch");button(draft,"Cancel").click();assert.equal(s.host.querySelector(".story-screen-pending"),null);await s.close();
});

test("Cancel and Escape return focus to the visible Story draft opener",async()=>{
 for(const entry of ["root","screen","branch"])for(const exit of ["cancel","escape"]){
  const s=setup({},entry==="branch"?storyFixture():fixture());
  try{
   const caption=entry==="branch"?"Add Beat to If":entry==="screen"?"Add screen Beat":"Add Beat";
   const opener=button(s.host,caption);opener.focus();opener.click();await tick();
   const draft=s.host.querySelector<HTMLElement>(".new-beat")!;
   const type=draft.querySelector<HTMLSelectElement>("select")!;type.value="showScreen";type.dispatchEvent(new Event("change",{bubbles:true}));
   if(exit==="cancel"){const cancel=button(draft,"Cancel");cancel.focus();cancel.click();}
   else{const position=draft.querySelector<HTMLSelectElement>('[aria-label="Insert before"]')!;position.focus();position.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));}
   assert.ok(document.activeElement===button(s.host,caption),`${entry} ${exit} must restore the recreated opener`);
   assert.equal(s.host.querySelector(".new-beat"),null);assert.equal(s.commands.length,0);
  }finally{await s.close();}
 }
});

test("Cancel and Escape restore the captured insertion context after a refused screen draft",async()=>{
 for(const cancel of ["button","escape"])for(const context of ["current","default","unavailable nested"]){
  const model=fixture(),scene=model.scenes[0]!;
  const original:ScreenInsertion=context!=="unavailable nested"
   ?{sceneId:scene.id,body:{type:"root"},position:{type:"before",anchor:{type:"beat",beatId:"end"}},expectedSourceRevision:scene.sourceRevision}
   :{sceneId:scene.id,body:{type:"branch",groupId:"removed-group",branchId:"removed-branch"},position:{type:"before",anchor:{type:"beat",beatId:"removed-beat"}},expectedSourceRevision:"old-source"};
  let remembered=structuredClone(original);
  const s=setup({screenInsertion:context==="default"?undefined:original,rememberScreenInsertion:value=>{remembered=structuredClone(value);}},model);
  try{
   button(s.host,"Add screen Beat").click();await tick();const draft=s.host.querySelector<HTMLElement>(".new-beat")!;
   if(context==="unavailable nested"){
    const body=draft.querySelector<HTMLSelectElement>('[aria-label="Insert in"]')!;body.value="root";body.dispatchEvent(new Event("change",{bubbles:true}));
   }
   const position=draft.querySelector<HTMLSelectElement>('[aria-label="Insert before"]')!;position.value="line";position.dispatchEvent(new Event("change",{bubbles:true}));
   button(draft,"Add Beat").click();await tick();
   assert.deepEqual(remembered.position,{type:"before",anchor:{type:"beat",beatId:"line"}},"Refusal must retain the pending position");
   assert.ok(draft.isConnected);
   if(cancel==="button")button(draft,"Cancel").click();else position.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));
   assert.deepEqual(remembered,original,"Cancellation must restore the location captured before this draft");
   assert.equal(s.host.querySelector(".story-screen-pending"),null);
  }finally{await s.close();}
 }
});

test("accepted screen insertion remembers its nested location at the accepted revision",async()=>{
 const base=fixture(),scene=base.scenes[0]!;
 const model:SceneWorkspace={...base,scenes:[{...scene,beats:[
  {id:"branch",byteStart:10,byteEnd:20,protected:false,conditionalBranch:{groupId:"group",otherwise:false,condition:{status:"supported",expression:{type:"bool",value:true}}},payload:{type:"customCode",source:"if True:",reason:"Condition"}},
  {...scene.beats[0]!,owner:{groupId:"group",branchId:"branch"}},scene.beats[1]!
 ]}]};
 let remembered:ScreenInsertion|undefined;
 const s=setup({rememberScreenInsertion:value=>{remembered=structuredClone(value);},apply:async()=>({...model,scenes:[{...model.scenes[0]!,sourceRevision:"accepted-source"}]})},model);
 try{
  const draft=openNew(s.host,"showScreen");await tick();
  const body=draft.querySelector<HTMLSelectElement>('[aria-label="Insert in"]')!;body.value="branch";body.dispatchEvent(new Event("change",{bubbles:true}));
  const position=draft.querySelector<HTMLSelectElement>('[aria-label="Insert before"]')!;position.value="line";position.dispatchEvent(new Event("change",{bubbles:true}));
  button(draft,"Add Beat").click();await tick();
  assert.equal(draft.isConnected,false);
  assert.deepEqual(remembered,{sceneId:scene.id,body:{type:"branch",groupId:"group",branchId:"branch"},position:{type:"before",anchor:{type:"beat",beatId:"line"}},expectedSourceRevision:"accepted-source"});
 }finally{await s.close();}
});

test("a deleted insertion Scene retains intent and allows an explicit replacement position",async()=>{
 const model=fixture(),scene=model.scenes[0]!,remembered:unknown[]=[];
 const insertion={sceneId:"deleted-scene",body:{type:"root" as const},position:{type:"before" as const,anchor:{type:"beat" as const,beatId:"line"}},expectedSourceRevision:scene.sourceRevision};
 const s=setup({screenInsertion:insertion,rememberScreenInsertion:value=>remembered.push(value)},model);
 try{
  button(s.host,"Add screen Beat").click();await tick();
  const draft=s.host.querySelector<HTMLElement>(".new-beat");assert.ok(draft,"A missing original Scene must expose location recovery");
  button(draft,"Add Beat").click();await tick();assert.equal(s.commands.length,0);assert.equal(remembered.length,0);assert.match(draft.textContent!,/original insertion Scene is unavailable/i);
  const position=draft.querySelector<HTMLSelectElement>('[aria-label="Insert before"]')!;position.value="line";position.dispatchEvent(new Event("change",{bubbles:true}));
  button(draft,"Add Beat").click();await tick();assert.equal(s.commands.length,1);assert.equal(s.commands[0]!.sceneId,scene.id);assert.deepEqual(s.commands[0]!.position,insertion.position);assert.equal((remembered.at(-1) as {sceneId:string}).sceneId,scene.id);assert.equal(insertion.sceneId,"deleted-scene");
 }finally{await s.close();}
});

test("a deleted screen insertion Scene does not block ordinary Add Beat",async()=>{
 for(const screenHintKind of [undefined,"dialog"] as const){
 const scene=fixture().scenes[0]!;
 const s=setup({screenHintKind,screenInsertion:{sceneId:"deleted-scene",body:{type:"branch",groupId:"deleted-group",branchId:"deleted-branch"},position:{type:"before",anchor:{type:"beat",beatId:"deleted-beat"}},expectedSourceRevision:scene.sourceRevision}});
 try{
  const draft=openNew(s.host,"narration");assert.ok(draft,"An unavailable screen hint must not block ordinary authoring");
  const text=draft.querySelector<HTMLTextAreaElement>("textarea")!;text.value="A replacement line.";text.dispatchEvent(new Event("input",{bubbles:true}));
  button(draft,"Add Beat").click();await tick();assert.equal(s.commands.length,1);assert.deepEqual(s.commands[0]!.beat,{type:"narration",text:"A replacement line."});assert.deepEqual(s.commands[0]!.body,{type:"root"});assert.deepEqual(s.commands[0]!.position,{type:"before",anchor:{type:"beat",beatId:"end"}});
 }finally{await s.close();}
 }
});
