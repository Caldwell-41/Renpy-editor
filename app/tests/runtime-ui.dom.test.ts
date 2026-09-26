import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { RuntimeWorkspace, type RuntimeStatus } from "../src/runtime-ui.js";
import type { CoreOperation } from "../src/protocol.js";

const tick = (ms = 0): Promise<void> => new Promise(resolve => setTimeout(resolve,ms));
function click(label: string): HTMLButtonElement {
  const item = [...document.querySelectorAll("button")].find(button => button.textContent === label);
  assert.ok(item, label); item.click(); return item;
}
function harness(options: { drafts?: number; refuseSave?: boolean; stale?: boolean; terminal?: boolean } = {}) {
  const browser = new Window({ url: "http://tauri.localhost" });
  Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, HTMLInputElement: browser.HTMLInputElement });
  const calls: { operation: CoreOperation; payload?: Readonly<Record<string, unknown>> }[] = [];
  let current = true, stopped = false, navigated = false;
  let drafts = options.drafts ?? 0;
  const state = (): RuntimeStatus => ({ operationId: "op", phase: stopped ? "cancelled" : options.terminal ? "failed" : "running", exitCode: options.terminal ? 1 : null, output: "", nextSequence: 0, outputTruncated: false, earlierRevision: true, cleanupComplete: stopped || !!options.terminal, launchRevision: "launch", revisionStale: true });
  const request = async <T>(operation: CoreOperation, payload?: Readonly<Record<string, unknown>>): Promise<T> => {
    calls.push({ operation, payload });
    if (operation === "sdk.discover") return [{ id: "sdk", compatible: true, version: "8.5.3", displayName: "SDK" }] as T;
    if (operation === "source.list") return { files: [], dirtyCount: drafts } as T;
    if (operation === "source.saveAll") { if (options.refuseSave) throw new Error("Save All refused; drafts retained"); drafts = 0; return {} as T; }
    if (operation === "runtime.prepare") return { preparationId: "prep", savedRevision: "launch", trustId: null, draftCount: drafts, projectPath: "synthetic", sdkPath: "verified-sdk", sdkVersion: "8.5.3", sdkRevision: "sdk-rev", inputs: ["game/custom.rpy"], trustNotice: "Executes project Python; session only, not a sandbox." } as T;
    if (operation === "runtime.grantTrust") return { trustId: "trust" } as T;
    if (operation === "runtime.start" || operation === "runtime.status") return state() as T;
    if (operation === "runtime.stop") { stopped = true; return state() as T; }
    if (operation === "runtime.diagnostics") return { diagnostics: [{ id: 0, origin: "compile", severity: "error", message: '<img src=x onerror="alert(1)">', path: "game/custom.rpy", line: 2, sourceRevision: "file", operationId: "op", sessionId: "session", freshness: "unverified" }] } as T;
    if (operation === "runtime.resolveDiagnostic") { if (options.stale) throw new Error("STALE_RUNTIME"); return { path: "game/custom.rpy", expectedRevision: "file", byteStart: 10, byteEnd: 20 } as T; }
    return {} as T;
  };
  const runtime = new RuntimeWorkspace({ sessionId: "session", sdkVersion: "8.5.3", request, current: () => current,
    capture: () => ({ sceneRoot: document.body, current: () => current }), coordinate: task => task(),
    navigate: async target => { assert.equal(target.expectedRevision, "file"); navigated = true; }, refreshPersistence: () => {} });
  document.body.append(runtime.toolbar, runtime.panel);
  return { runtime, browser, calls, drafts: () => drafts, navigated: () => navigated, stale: () => { current = false; }, dispose: () => runtime.dispose() };
}

test("runtime UI executes only after explicit revision choice and inspectable trust; Stop and close cancel retain session", async () => {
  const h = harness({ drafts: 1 });
  try {
    assert.equal(h.calls.length,0);
    click("Run Game"); await tick(); click("Use saved revision"); await tick();
    assert.match(document.querySelector('[aria-modal="true"]')?.textContent ?? "", /project Python/);
    assert.equal(document.activeElement?.textContent, "Cancel");
    document.activeElement?.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    assert.equal(document.activeElement?.textContent, "Trust for this session and continue");
    click("Trust for this session and continue"); await tick();
    assert.equal(h.drafts(),1); assert.equal(h.calls.filter(c => c.operation === "runtime.start").length,1);
    assert.match(h.runtime.panel.textContent ?? "", /Started from an earlier revision/);
    assert.ok(click("Run Game").disabled); assert.equal(h.calls.filter(c => c.operation === "runtime.start").length,1);
    const cancelled = h.runtime.beforeClose(); await tick(); click("Cancel"); assert.equal(await cancelled,false);
    assert.equal(h.calls.filter(c => c.operation === "runtime.stop").length,0);
    const close = h.runtime.beforeClose(); await tick(); click("Stop and continue"); assert.equal(await close,true);
    assert.equal(h.calls.filter(c => c.operation === "runtime.stop").length,1);
    assert.equal(h.drafts(),1);
  } finally { h.dispose(); }
});

test("runtime UI refused Save All and Cancel never prepare, grant or spawn", async () => {
  const h = harness({ drafts: 2, refuseSave: true });
  try {
    click("Validate"); await tick(); click("Save All and continue"); await tick();
    assert.equal(h.drafts(),2); assert.match(h.runtime.panel.textContent ?? "", /Save All refused/);
    click("Validate"); await tick(); click("Cancel"); await tick();
    assert.equal(h.calls.some(c => ["runtime.prepare", "runtime.grantTrust", "runtime.start"].includes(c.operation)),false);
  } finally { h.dispose(); }
});

test("runtime UI trust cancellation releases preparation without installing policy", async () => {
  const h = harness();
  try {
    click("Run Game"); await tick(); click("Cancel"); await tick();
    assert.equal(h.calls.filter(c => c.operation === "runtime.cancelPreparation").length,1);
    assert.equal(h.calls.some(c => ["runtime.start", "runtime.installPolicy"].includes(c.operation)),false);
  } finally { h.dispose(); }
});

for (const stale of [false,true]) test(`runtime diagnostics are inert and navigation ${stale ? "refuses stale locations" : "uses current revision"}`, async () => {
  const h = harness({ stale, terminal: true });
  try {
    click("Validate"); await tick(); click("Trust for this session and continue"); await tick(100);
    assert.match(h.runtime.panel.textContent ?? "", /Failed/);
    assert.equal(h.runtime.panel.querySelector("img"),null);
    click("Open game/custom.rpy:2"); await tick();
    assert.equal(h.navigated(), !stale);
    if (stale) assert.match(h.runtime.panel.textContent ?? "", /no source selection changed/);
    assert.deepEqual(h.calls.find(c => c.operation === "runtime.resolveDiagnostic")?.payload,{ operationId: "op", diagnosticId: 0 });
  } finally { h.dispose(); }
});

test("runtime old-view preparation does not retarget a new session", async () => {
  const h = harness();
  try { click("Run Game"); h.stale(); await tick(); assert.equal(h.calls.some(c => c.operation === "runtime.prepare"), false); }
  finally { h.dispose(); }
});
