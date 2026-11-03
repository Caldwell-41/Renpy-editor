import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { buildPanelCreationForm, type PanelCreation } from "../src/screen-panels.js";
import type { UiImageAsset } from "../src/screen-images.js";

const image: UiImageAsset = { id: "image", kind: "uiImage", displayName: "Tram emblem", relativePath: "game/images/emblem.png", sha256: "a".repeat(64), status: "available", naturalWidth: 80, naturalHeight: 40 };
const tick = async () => { await new Promise(resolve => setTimeout(resolve, 0)); };

test("a missing-image create refusal keeps Assets reachable and the original image identity",async()=>{
 const browser=setup();let handed:unknown;
 const initial={name:"route_help",kind:"dialog" as const,starter:"help" as const,assetId:image.id};
 const view=buildPanelCreationForm({assets:[image],initialDraft:initial,openAssets:draft=>{handed=draft;},create:async()=>{throw Object.assign(Error("Image disappeared"),{code:"UI_IMAGE_MISSING"});},cancel:()=>{}});
 try{document.body.append(view.element);submit();await tick();
  assert.equal(view.element.querySelector<HTMLButtonElement>('[type="submit"]')!.disabled,true);
  assert.equal(view.preview.hidden,true);
  const assets=[...view.element.querySelectorAll<HTMLButtonElement>("button")].find(button=>button.textContent==="Open Assets")!;assert.equal(assets.hidden,false);assets.click();assert.deepEqual(handed,initial);
 }finally{view.dispose();await browser.happyDOM.close();}
});
function setup() {
  const browser = new Window();
  Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, HTMLInputElement: browser.HTMLInputElement, HTMLSelectElement: browser.HTMLSelectElement, Event: browser.Event, KeyboardEvent: browser.KeyboardEvent });
  return browser;
}
function control<T extends HTMLElement>(name: string): T { return document.querySelector<T>(`[name="${name}"]`)!; }
function submit() { document.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); }

test("Help creation uses a typed project image and one ordinary editable starter request", async () => {
  const browser = setup(); const calls: PanelCreation[] = [];
  const view = buildPanelCreationForm({ assets: [{ ...image, id: "background", kind: "background" }, { ...image, id: "missing", status: "missing" }, image], create: async value => { calls.push(value); }, cancel: () => {} });
  document.body.append(view.element);
  assert.equal(control<HTMLSelectElement>("starter-image").value, "image");
  assert.equal(view.element.querySelector(".screen-panels-preview strong")?.textContent,"Help");
  control<HTMLInputElement>("screen-name").value = "travel_help";
  submit(); await tick();
  assert.deepEqual(calls, [{ name: "travel_help", starter: { title: "Help", explanation: "Read this guide while the story continues.", assetId: "image", expectedAssetSha256: image.sha256, width: 320, height: 180 } }]);
  view.dispose(); await browser.happyDOM.close();
});

test("empty image inventory keeps Help and its name blocked until the author explicitly chooses Blank", async () => {
  const browser = setup(); const calls: PanelCreation[] = [];
  const view = buildPanelCreationForm({ assets: [{ ...image, kind: "background" }], create: async value => { calls.push(value); }, cancel: () => {} }); document.body.append(view.element);
  const name = control<HTMLInputElement>("screen-name"); name.value = "help_without_image";
  const create = document.querySelector<HTMLButtonElement>('[type="submit"]')!;
  assert.equal(create.disabled, true); submit(); await tick(); assert.deepEqual(calls, []);
  assert.equal(name.value, "help_without_image"); assert.equal(control<HTMLSelectElement>("starter").value, "help");
  assert.match(view.element.textContent!, /import an image in Assets with the UI image role/);
  const blank = control<HTMLSelectElement>("starter"); blank.value="blank";blank.dispatchEvent(new Event("change",{bubbles:true}));
  assert.equal(create.disabled, false); submit(); await tick(); assert.deepEqual(calls, [{ name: "help_without_image" }]);
  view.dispose(); await browser.happyDOM.close();
});

test("refused Help creation retains fields, serializes submission and Escape cancels only the editor", async () => {
  const browser = setup(); let reject!: (error: Error) => void, writes = 0, cancels = 0;
  const view = buildPanelCreationForm({ assets: [image], create: async () => { writes++; await new Promise<void>((_, failure) => { reject = failure; }); }, cancel: () => { cancels++; } }); document.body.append(view.element);
  const name = control<HTMLInputElement>("screen-name"); name.value = "guide_help";
  submit(); submit(); assert.equal(writes, 1);
  view.element.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })); assert.equal(cancels, 0);
  reject(Error("SCREEN_INVENTORY_CHANGED")); await tick();
  assert.equal(name.value, "guide_help"); assert.equal(control<HTMLSelectElement>("starter-image").value, "image"); assert.equal(name.disabled, false);
  assert.match(view.element.textContent!, /SCREEN_INVENTORY_CHANGED.*Input retained/); assert.equal(view.hasDraft(), true);
  view.element.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })); assert.equal(cancels, 1); assert.equal(writes, 1);
  view.dispose(); await browser.happyDOM.close();
});

test("Help keeps the chosen asset hash from form admission instead of refreshing it during Apply", async () => {
  const browser = setup(), supplied = { ...image }; const calls: PanelCreation[] = [];
  const view = buildPanelCreationForm({ assets: [supplied], create: async value => { calls.push(value); }, cancel: () => {} }); document.body.append(view.element);
  supplied.sha256 = "b".repeat(64); submit(); await tick();
  assert.equal(calls[0]!.starter!.expectedAssetSha256, image.sha256);
  view.dispose(); await browser.happyDOM.close();
});

test("screen name validates on completion, associates its error and allows incomplete typing",async()=>{
  const browser=setup(),view=buildPanelCreationForm({assets:[image],create:async()=>{},cancel:()=>{}});document.body.append(view.element);
  const name=control<HTMLInputElement>("screen-name");assert.equal(name.hasAttribute("aria-invalid"),false);
  name.value="bad name";name.dispatchEvent(new Event("input",{bubbles:true}));assert.equal(name.hasAttribute("aria-invalid"),false);
  name.dispatchEvent(new Event("blur"));assert.equal(name.getAttribute("aria-invalid"),"true");
  const error=document.getElementById(name.getAttribute("aria-describedby")!);assert.ok(error);assert.match(error.textContent!,/letters|underscore/);
  name.value="valid_name";name.dispatchEvent(new Event("input",{bubbles:true}));assert.equal(name.hasAttribute("aria-invalid"),false);assert.equal(error.hidden,true);
  view.dispose();await browser.happyDOM.close();
});

test("Dialog creation retains required image, kind and name across an Assets handoff", async () => {
  const browser=setup();const calls:PanelCreation[]=[];let retained:unknown;
  const view=buildPanelCreationForm({assets:[],create:async value=>{calls.push(value);},cancel:()=>{}});
  document.body.append(view.element);
  const kind=control<HTMLSelectElement>("screen-kind");kind.value="dialog";kind.dispatchEvent(new Event("change",{bubbles:true}));
  control<HTMLInputElement>("screen-name").value="quick_help";
  submit();await tick();assert.equal(calls.length,0);assert.equal(view.element.querySelector<HTMLButtonElement>('[type="submit"]')!.disabled,true);
  retained=view.readDraft();view.dispose();view.element.remove();
  const restored=buildPanelCreationForm({assets:[image],initialDraft:retained as ReturnType<typeof view.readDraft>,create:async value=>{calls.push(value);},cancel:()=>{}});
  document.body.append(restored.element);submit();await tick();
  assert.equal(calls[0]?.kind,"dialog");assert.equal(calls[0]?.name,"quick_help");assert.equal(calls[0]?.starter?.assetId,image.id);
  restored.dispose();await browser.happyDOM.close();
});

test("unavailable retained Help image keeps Create blocked even when another image exists",async()=>{
 const browser=setup();let handoff:unknown;
 const draft={name:"guide",kind:"dialog" as const,starter:"help" as const,assetId:"original-missing"};
 const view=buildPanelCreationForm({assets:[image],initialDraft:draft,create:async()=>{throw Error("Must not create");},cancel:()=>{},openAssets:value=>{handoff=value;}});document.body.append(view.element);
 assert.equal(view.element.querySelector<HTMLButtonElement>('[type="submit"]')!.disabled,true);
 [...view.element.querySelectorAll("button")].find(b=>b.textContent==="Open Assets")!.click();assert.deepEqual(handoff,draft);
 assert.equal(view.readDraft().assetId,"original-missing");view.dispose();await browser.happyDOM.close();
});
