import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { ScreensWorkspace, type ScreenDocument } from "../src/screen-ui.js";
import type { CoreOperation } from "../src/protocol.js";

const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const documentFor = (path: string, name?: string): ScreenDocument => ({ path, revision: "before", partial: false,
  screens: name ? [{ name, nodes: [{ kind: "frame", literal: null, layout: {}, span: { start: 30, end: 90 }, parentStart: null,
    properties: [{ property: "xsize", value: 640 }, { property: "ysize", value: 360 }], protected: [] }] }] : [] });
function harness(mixed = false, ownedRace?: "rename" | "revision" | "unavailable") {
  const browser = new Window();
  Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, ResizeObserver: browser.ResizeObserver });
  let documents = mixed ? [documentFor("game/ui/a_styles.rpy"), documentFor("game/ui/help.rpy", "help"), documentFor("game/ui/pause.rpy", "pause")] : [documentFor("game/ui/help.rpy", "help")];
  let settle: { resolve: (value: ScreenDocument) => void; reject: (error: Error) => void } | undefined;
  const sources: unknown[] = [];
  const workspace = new ScreensWorkspace({ resolution: { width: 1280, height: 720 }, current: () => true,
    coordinate: task => task(), source: target => { sources.push(target); }, preview: () => {}, saved: () => {},
    request: async <T>(operation: CoreOperation, payload?: Record<string, unknown>): Promise<T> => {
      if (operation === "source.list") return { files: documents.map(d => ({ path: d.path })) } as T;
      if (operation === "screens.list") return { projectRevision: "project", sourceMapRevision: "map", inventoryRevision: "files", owned: ownedRace ? [{ id: "owned-help", rootId: "owned-root", name: "help", path: "game/ui/help.rpy", resolved: true, sourceRevision: "before" }] : [] } as T;
      if (operation === "screens.inspect") {
        if (ownedRace === "unavailable") throw new Error("Source changed during inspection");
        return ownedRace ? { ...documentFor("game/ui/help.rpy", ownedRace === "rename" ? "neighbor" : "help"), revision: "after" } as T : documents.find(d => d.path === payload?.path) as T;
      }
      if (operation === "screens.setSize") return await new Promise<ScreenDocument>((resolve, reject) => { settle = { resolve, reject }; }) as T;
      throw new Error(operation);
    } });
  workspace.mount(document.body);
  const click = (text: string) => { const b = [...document.querySelectorAll("button")].find(b => b.textContent === text)!; assert.ok(b, text); b.focus(); b.click(); return b; };
  const field = (name: string) => { const input = [...document.querySelectorAll("input")].find(i => i.ariaLabel === name); assert.ok(input, document.body.innerHTML); return input; };
  return { workspace, click, field, sources, removePause: () => { documents = documents.filter(d => !d.path.endsWith("pause.rpy")); },
    accept: () => { const accepted = structuredClone(documents.find(d => d.screens.length)!); accepted.revision = "accepted"; accepted.screens[0]!.nodes[0]!.properties[0]!.value = 750; settle!.resolve(accepted); },
    refuse: () => settle!.reject(new Error("Draft conflict")), dispose: () => workspace.dispose() };
}

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
