import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { layoutFlow, renderBranches, type FlowWorkspace } from "../src/branches-ui.js";
const tick = async (): Promise<void> => { await new Promise((resolve) => setTimeout(resolve, 0)); };
function fixture(): FlowWorkspace {
  const location = { path: "game/one.rpy", revision: "a", byteStart: 0, byteEnd: 40 };
  return { revision: "one", entrySceneId: "one", partial: false, stale: false, overLimit: false, notice: "Accepted source", nodes: [
    { sceneId: "one", name: "One", label: "one", location, partial: false, stale: false },
    { sceneId: "two", name: "Two", label: "two", location: { ...location, path: "game/two.rpy" }, partial: false, stale: false },
  ], edges: [0, 1].map((i) => ({ id: `choice-${i}`, sceneId: "one", beatId: "choice", optionOrdinal: i, text: "Same", kind: "choice", location, editable: true, destination: { kind: "resolved", sceneId: "two" } })) };
}
function setup(): { browser: Window; host: HTMLElement } {
  const browser = new Window(); Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement });
  document.body.innerHTML = '<main id="host"></main>'; return { browser, host: document.querySelector("main")! };
}
function click(label: string): void { const target = [...document.querySelectorAll("button")].find((item) => item.textContent === label); assert.ok(target, label); target.click(); }
function choose(label: string, value: string): void { const select = document.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!; select.value = value; select.dispatchEvent(new window.Event("change")); }

test("Branches shows distinct duplicate routes and navigates/edit via existing Scene controls", async () => {
  const { browser, host } = setup(); const calls: string[] = [];
  const dispose = renderBranches(host, { load: async () => fixture(), source: (location) => calls.push(location?.path ?? "source"), scene: (node, edge) => calls.push(`${node.sceneId}:${edge?.beatId ?? ""}`), status: () => {} }); await tick();
  choose("Selected Scene", "one"); const options = document.querySelector('select[aria-label="Selected route"]')!; assert.match(options.textContent!, /1\. Same.*2\. Same/);
  choose("Selected route", "choice-1"); click("Edit Choice / Jump"); await tick(); assert.deepEqual(calls, ["one:choice"]);
  click("View origin in Source"); await tick(); assert.equal(calls[1], "game/one.rpy"); click("Open destination"); await tick(); assert.equal(calls[2], "two:");
  dispose(); await browser.happyDOM.close();
});

test("Branches refresh invalidates removed/changed selection and stale navigation never guesses", async () => {
  const { browser, host } = setup(); let model = fixture(); let navigations = 0; let status = "";
  const dispose = renderBranches(host, { load: async () => model, source: () => { navigations++; }, scene: () => { navigations++; }, status: (text) => { status = text; } }); await tick();
  choose("Selected Scene", "one"); choose("Selected route", "choice-0"); model = { ...model, revision: "new", edges: [] };
  click("Edit Choice / Jump"); await tick(); assert.equal(navigations, 0); assert.match(status, /Flow changed/); assert.equal(document.querySelector<HTMLSelectElement>('select[aria-label="Selected route"]')!.value, "");
  model = { ...model, revision: "deleted", nodes: [] }; click("Refresh flow"); await tick(); assert.equal(document.querySelector<HTMLSelectElement>('select[aria-label="Selected Scene"]')!.value, "");
  dispose(); await browser.happyDOM.close();
});

test("Branches disposal cancels old-session completions; failures label last view stale", async () => {
  const { browser, host } = setup(); let resolve!: (model: FlowWorkspace) => void;
  const dispose = renderBranches(host, { load: () => new Promise((accept) => { resolve = accept; }), source: () => {}, scene: () => {}, status: () => {} });
  dispose(); host.textContent = "Next project"; resolve(fixture()); await tick(); assert.equal(host.textContent, "Next project");
  let fail = false;
  const dispose2 = renderBranches(host, { load: async () => { if (fail) throw new Error("Unavailable"); return fixture(); }, source: () => {}, scene: () => {}, status: () => {} }); await tick();
  choose("Selected Scene", "one"); fail = true; click("Refresh flow"); await tick(); assert.match(host.textContent!, /stale/); const open = [...host.querySelectorAll("button")].find((button) => button.textContent === "Open Scene")!; assert.equal(open.disabled, true);
  dispose2(); await browser.happyDOM.close();
});

test("Branches bounds, deterministic layout and keyboard controls stay explicit", async () => {
  const { browser, host } = setup(); let model = fixture();
  const positions = layoutFlow(model.nodes); assert.deepEqual(positions, layoutFlow([...model.nodes].reverse()));
  const dispose = renderBranches(host, { load: async () => model, source: () => {}, scene: () => {}, status: () => {} }); await tick();
  const viewport = host.querySelector<HTMLElement>(".branches-viewport")!; const canvas = host.querySelector<HTMLElement>(".branches-canvas")!;
  viewport.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); assert.match(canvas.style.transform, /-40px/);
  click("Zoom in"); assert.match(canvas.style.transform, /scale/); click("Fit graph"); assert.match(canvas.style.transform, /translate\(0px, 0px\)/);
  model = { ...model, overLimit: true, notice: "Graph limit exceeded", nodes: [], edges: [] }; click("Refresh flow"); await tick(); assert.match(host.textContent!, /Graph limit exceeded/); assert.equal(host.querySelectorAll(".branch-node").length, 0); assert.ok([...host.querySelectorAll("button")].some((button) => button.textContent === "Open Source"));
  dispose(); await browser.happyDOM.close();
});
