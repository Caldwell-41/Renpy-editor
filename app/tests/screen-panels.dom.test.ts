import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { buildPanelCreationForm, type PanelCreation } from "../src/screen-panels.js";
import type { UiImageAsset } from "../src/screen-images.js";

const image: UiImageAsset = { id: "image", kind: "uiImage", displayName: "Tram emblem", relativePath: "game/images/emblem.png", sha256: "a".repeat(64), status: "available", naturalWidth: 80, naturalHeight: 40 };
const tick = async () => { await new Promise(resolve => setTimeout(resolve, 0)); };
function setup() {
  const browser = new Window();
  Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, HTMLInputElement: browser.HTMLInputElement, HTMLSelectElement: browser.HTMLSelectElement, Event: browser.Event, KeyboardEvent: browser.KeyboardEvent });
  return browser;
}
function control<T extends HTMLElement>(name: string): T { return document.querySelector<T>(`[name="${name}"]`)!; }
function submit() { document.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); }

test("Help creation defaults a valid typed image and sends one editable starter request", async () => {
  const browser = setup(); const calls: PanelCreation[] = [];
  const view = buildPanelCreationForm({ assets: [{ ...image, id: "background", kind: "background" }, { ...image, id: "missing", status: "missing" }, image], create: async value => { calls.push(value); }, cancel: () => {} });
  document.body.append(view.element);
  assert.equal(control<HTMLSelectElement>("starter-image").value, "image");
  control<HTMLInputElement>("screen-name").value = "travel_help";
  control<HTMLInputElement>("starter-title").value = "Travel help";
  control<HTMLTextAreaElement>("starter-explanation").value = "Read while the tram moves.";
  control<HTMLInputElement>("starter-width").value = "240";
  control<HTMLInputElement>("starter-height").value = "120";
  submit(); await tick();
  assert.deepEqual(calls, [{ name: "travel_help", starter: { title: "Travel help", explanation: "Read while the tram moves.", assetId: "image", expectedAssetSha256: image.sha256, width: 240, height: 120 } }]);
  view.dispose(); await browser.happyDOM.close();
});

test("empty image inventory keeps Help and its name blocked until the author explicitly chooses Blank", async () => {
  const browser = setup(); const calls: PanelCreation[] = [];
  const view = buildPanelCreationForm({ assets: [{ ...image, kind: "background" }], create: async value => { calls.push(value); }, cancel: () => {} }); document.body.append(view.element);
  const name = control<HTMLInputElement>("screen-name"); name.value = "help_without_image";
  const create = document.querySelector<HTMLButtonElement>('[type="submit"]')!;
  assert.equal(create.disabled, true); submit(); await tick(); assert.deepEqual(calls, []);
  assert.equal(name.value, "help_without_image"); assert.equal(document.querySelector<HTMLInputElement>('[name="starter"]:checked')!.value, "help");
  assert.match(view.element.textContent!, /import an image in Assets with the UI image role/);
  const blank = document.querySelector<HTMLInputElement>('[name="starter"][value="blank"]')!;
  blank.click();
  assert.equal(create.disabled, false); submit(); await tick(); assert.deepEqual(calls, [{ name: "help_without_image" }]);
  view.dispose(); await browser.happyDOM.close();
});

test("refused Help creation retains fields, serializes submission and Escape cancels only the editor", async () => {
  const browser = setup(); let reject!: (error: Error) => void, writes = 0, cancels = 0;
  const view = buildPanelCreationForm({ assets: [image], create: async () => { writes++; await new Promise<void>((_, failure) => { reject = failure; }); }, cancel: () => { cancels++; } }); document.body.append(view.element);
  const name = control<HTMLInputElement>("screen-name"); name.value = "guide_help";
  control<HTMLInputElement>("starter-title").value = "Retained title";
  submit(); submit(); assert.equal(writes, 1);
  view.element.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })); assert.equal(cancels, 0);
  reject(Error("SCREEN_INVENTORY_CHANGED")); await tick();
  assert.equal(name.value, "guide_help"); assert.equal(control<HTMLInputElement>("starter-title").value, "Retained title"); assert.equal(name.disabled, false);
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
