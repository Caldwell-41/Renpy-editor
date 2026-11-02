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
