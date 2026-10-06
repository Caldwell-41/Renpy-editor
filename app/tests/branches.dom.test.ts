import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { layoutFlow, renderBranches, type FlowWorkspace } from "../src/branches-ui.js";
const tick = async (): Promise<void> => { await new Promise((resolve) => setTimeout(resolve, 0)); };
function fixture(): FlowWorkspace {
  const location = { path: "game/one.rpy", revision: "a", byteStart: 0, byteEnd: 40 };
  return { observation: { status: "checked", checkedAt: 1000 }, revision: "one", entrySceneId: "one", partial: false, stale: false, overLimit: false, notice: "Accepted source", nodes: [
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

test("Branches refresh invalidates removed selection; navigation passes captured targets without scanning", async () => {
  const { browser, host } = setup(); let model = fixture(); let navigations = 0; let status = "";
  const dispose = renderBranches(host, { load: async () => model, source: () => { navigations++; }, scene: () => { navigations++; }, status: (text) => { status = text; } }); await tick();
  choose("Selected Scene", "one"); choose("Selected route", "choice-0"); model = { ...model, revision: "new", edges: [] };
  click("Edit Choice / Jump"); await tick(); assert.equal(navigations, 1); assert.equal(status, ""); click("Refresh flow"); await tick(); assert.equal(document.querySelector<HTMLSelectElement>('select[aria-label="Selected route"]')!.value, "");
  model = { ...model, revision: "deleted", nodes: [] }; click("Refresh flow"); await tick(); assert.equal(document.querySelector<HTMLSelectElement>('select[aria-label="Selected Scene"]')!.value, "");
  dispose(); await browser.happyDOM.close();
});

test("Branches disposal cancels old-session completions; failures preserve the last view with visible error status", async () => {
  const { browser, host } = setup(); let resolve!: (model: FlowWorkspace) => void;
  const dispose = renderBranches(host, { load: () => new Promise((accept) => { resolve = accept; }), source: () => {}, scene: () => {}, status: () => {} });
  dispose(); host.textContent = "Next project"; resolve(fixture()); await tick(); assert.equal(host.textContent, "Next project");
  let fail = false;
  const dispose2 = renderBranches(host, { load: async () => { if (fail) throw new Error("Unavailable"); return fixture(); }, source: () => {}, scene: () => {}, status: () => {} }); await tick();
  choose("Selected Scene", "one"); fail = true; click("Refresh flow"); await tick(); assert.match(host.textContent!, /Could not refresh/); const open = [...host.querySelectorAll("button")].find((button) => button.textContent === "Open Scene")!; assert.equal(open.disabled, false);
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


test("Branches coalesces focus/Refresh, preserves focused nodes and pan, and accepts enabled clicks during refresh", async () => {
  const { browser, host } = setup(); let pending: ((model: FlowWorkspace) => void) | undefined; const loads: boolean[] = []; const calls: string[] = [];
  const dispose = renderBranches(host, { load: async disk => { loads.push(disk); if (loads.length === 1) return fixture(); return new Promise(resolve => { pending = resolve; }); }, source: location => calls.push(location?.revision ?? "source"), scene: node => calls.push(node.sceneId), status: () => {} }); await tick();
  const card = host.querySelector<HTMLButtonElement>(".branch-node")!; card.click(); card.focus();
  const viewport = host.querySelector<HTMLElement>(".branches-viewport")!; viewport.dispatchEvent(new window.KeyboardEvent("keydown", {key: "ArrowRight", bubbles: true}));
  window.dispatchEvent(new window.Event("focus")); window.dispatchEvent(new window.Event("focus")); click("Refresh flow");
  assert.deepEqual(loads, [false, true]); assert.match(host.textContent!, /Checking disk/);
  click("View origin in Source"); assert.deepEqual(calls, ["a"]);
  pending!({...fixture(), revision:"updated", observation:{status:"savedEdits",checkedAt:1000}}); await tick();
  assert.deepEqual(loads, [false,true,true]); assert.equal((document.activeElement as HTMLElement).dataset.sceneId, "one");
  assert.match(host.querySelector<HTMLElement>(".branches-canvas")!.style.transform, /-40px/);
  pending!({...fixture(),revision:"updated", observation:{status:"checked",checkedAt:2000}}); await tick();
  assert.match(host.querySelector(".branches-observation")!.textContent!, /Checked at/);
  dispose(); await browser.happyDOM.close();
});


test("Branches retains usable graph on an incomplete scan and checks disk after showing a cached opening", async () => {
  const { browser, host } = setup(); const loads: boolean[] = []; let mode = "open";
  const dispose = renderBranches(host, { load: async disk => { loads.push(disk); if (mode === "broken") return {...fixture(), revision:"broken", stale:true, observation:{status:"incomplete",checkedAt:1000}, edges:[]}; return {...fixture(), observation:{status:"checked",checkedAt:1000,fromCache:!disk}}; }, source: () => {}, scene: () => {}, status: () => {} }); await tick();
  assert.deepEqual(loads,[false,true]); choose("Selected Scene","one"); choose("Selected route","choice-0");
  mode="broken"; click("Refresh flow"); await tick();
  assert.equal(host.querySelectorAll("[data-edge-id]").length,2);
  assert.match(host.textContent!, /last usable observed graph/);
  assert.match(host.querySelector(".branches-observation")!.textContent!, /Could not refresh/);
  mode="open"; click("Refresh flow"); await tick(); assert.doesNotMatch(host.textContent!, /last usable observed graph/);
  dispose(); await browser.happyDOM.close();
});
