import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { ScreensWorkspace, type ScreenDocument, type ScreenNode } from "../src/screen-ui.js";
import type { CoreOperation } from "../src/protocol.js";

const tick = () => new Promise(resolve => setTimeout(resolve, 0));

function interactiveFixture() {
  const browser = new Window();
  Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, ResizeObserver: browser.ResizeObserver });
  const node = (id: string, kind: string, start: number, end: number, parentStart: number | null, literal: string | null = null): ScreenNode => ({
    id, kind, literal, span: { start, end }, parentStart, layout: {}, properties: [], protected: [],
  });
  let doc: ScreenDocument = { path: "game/ui/notes.rpy", revision: "before", partial: true, screens: [{ name: "notes", nodes: [
    node("root-id", "screen", 0, 250, null), node("box-id", "vbox", 30, 200, 0),
    node("title-id", "text", 60, 100, 30, "Title"), node("body-id", "text", 110, 140, 30, "Directions"),
    { ...node("custom-id", "custom", 210, 240, 0, "use custom_footer()"), protected: [{ start: 210, end: 240 }] },
  ] }] };
  const calls: { operation: CoreOperation; payload?: Record<string, unknown> }[] = [];
  let reply: { document: ScreenDocument; selectedId: string } | undefined;
  let historyReply: ScreenDocument | undefined;
  const workspace = new ScreensWorkspace({ resolution: { width: 1280, height: 720 }, current: () => true,
    coordinate: task => task(), source: () => {}, preview: () => {}, saved: () => {},
    request: async <T>(operation: CoreOperation, payload?: Record<string, unknown>): Promise<T> => {
      calls.push({ operation, payload });
      if (operation === "source.list") return { files: [{ path: doc.path }] } as T;
      if (operation === "screens.list") return { projectRevision: "project", sourceMapRevision: "map", inventoryRevision: "inventory",
        owned: [{ id: "screen-id", rootId: "root-id", name: "notes", path: doc.path, resolved: true, sourceRevision: doc.revision }] } as T;
      if (operation === "screens.inspect") return structuredClone(doc) as T;
      if (operation === "screens.compose" && reply) { doc = reply.document; return structuredClone(reply) as T; }
      if (operation === "scene.list") return { projectRevision: "project", sourceMapRevision: "map" } as T;
      if (operation === "scene.apply" && historyReply) { doc = historyReply; return {} as T; }
      throw new Error(operation === "screens.compose" ? "Source conflict" : operation);
    } });
  workspace.mount(document.body);
  const click = (name: string) => { const b = [...document.querySelectorAll("button")].find(b => b.textContent === name); assert.ok(b, name); b.focus(); b.click(); return b; };
  const row = (id: string) => { const b = document.querySelector<HTMLButtonElement>(`[data-node-id="${id}"]`); assert.ok(b, id); return b; };
  const edit = (id: string) => { row(id).dispatchEvent(new window.MouseEvent("dblclick")); };
  const text = () => { const input = [...document.querySelectorAll("textarea")].find(i => i.ariaLabel === "Text"); assert.ok(input); return input; };
  return { workspace, calls, click, row, edit, text, browser, original: structuredClone(doc), respond: (next: ScreenDocument, selectedId: string) => { reply = { document: next, selectedId }; },
    respondHistory: (next: ScreenDocument) => { historyReply = next; } };
}

test("owned composition retains a refused addition and Cancel accepts no source request", async () => {
  const browser = new Window();
  Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, ResizeObserver: browser.ResizeObserver });
  const doc: ScreenDocument = { path: "game/ui/notes.rpy", revision: "before", partial: false,
    screens: [{ name: "notes", nodes: [{ id: "root-id", kind: "screen", literal: null, layout: {},
      span: { start: 70, end: 100 }, parentStart: null, properties: [], protected: [] }] }] };
  const calls: { operation: CoreOperation; payload?: Record<string, unknown> }[] = [];
  const workspace = new ScreensWorkspace({ resolution: { width: 1280, height: 720 }, current: () => true,
    coordinate: task => task(), source: () => {}, preview: () => {}, saved: () => {},
    request: async <T>(operation: CoreOperation, payload?: Record<string, unknown>): Promise<T> => {
      calls.push({ operation, payload });
      if (operation === "source.list") return { files: [{ path: doc.path }] } as T;
      if (operation === "screens.list") return { projectRevision: "project", sourceMapRevision: "map", inventoryRevision: "inventory",
        owned: [{ id: "screen-id", rootId: "root-id", name: "notes", path: doc.path, resolved: true, sourceRevision: "before" }] } as T;
      if (operation === "screens.inspect") return structuredClone(doc) as T;
      if (operation === "screens.compose") throw new Error("Source changed externally");
      throw new Error(operation);
    } });
  const click = (name: string) => { const b = [...document.querySelectorAll("button")].find(b => b.textContent === name); assert.ok(b, name); b.focus(); b.click(); return b; };
  try {
    workspace.mount(document.body); await tick(); await tick();
    click("Add element");
    const field = [...document.querySelectorAll("textarea")].find(i => i.ariaLabel === "New element text"); assert.ok(field);
    field.value = "Keep this text"; field.dispatchEvent(new window.Event("input"));
    click("Add text"); await tick(); await tick();
    assert.match(document.body.textContent ?? "", /Input retained/);
    assert.equal([...document.querySelectorAll("textarea")].find(i => i.ariaLabel === "New element text")?.value, "Keep this text");
    const accepted = calls.filter(c => c.operation === "screens.compose");
    assert.equal(accepted.length, 1);
    assert.deepEqual(accepted[0]!.payload, { screenId: "screen-id", expectedRevision: "before", command: { type: "add", parentId: "root-id", kind: "text", text: "Keep this text" } });
    click("Cancel");
    assert.equal(workspace.hasDraft(), false);
    assert.equal(calls.filter(c => c.operation === "screens.compose").length, 1);
    assert.ok([...document.querySelectorAll("button")].some(b => b.role === "treeitem" && b.ariaSelected === "true"));
  } finally { workspace.dispose(); }
});

test("text drafts follow element identity across selection, Apply and Cancel", async () => {
  const h = interactiveFixture();
  try {
    await tick(); await tick();
    h.edit("title-id");
    h.text().value = "New title"; h.text().dispatchEvent(new window.Event("input"));
    h.click("1  Choose"); h.edit("body-id");
    h.text().value = "Unfinished directions"; h.text().dispatchEvent(new window.Event("input"));
    h.click("1  Choose"); h.edit("title-id"); assert.equal(h.text().value, "New title");
    const accepted = structuredClone(h.original); accepted.revision = "accepted"; accepted.screens[0]!.nodes[2]!.literal = "New title";
    h.respond(accepted, "title-id"); h.click("Apply changes"); await tick(); await tick();
    assert.deepEqual(h.calls.find(c => c.operation === "screens.compose")?.payload,
      { screenId: "screen-id", expectedRevision: "before", command: { type: "text", nodeId: "title-id", text: "New title" } });
    assert.equal(h.workspace.hasDraft(), true, "Applying one element keeps another element's draft");
    h.click("1  Choose"); h.edit("body-id"); assert.equal(h.text().value, "Unfinished directions");
    h.click("Cancel changes"); assert.equal(h.text().value, "Directions");
    assert.equal(h.workspace.hasDraft(), false);
  } finally { h.workspace.dispose(); }
});

test("keyboard reordering uses stable sibling identities and refuses a protected neighbor", async () => {
  const h = interactiveFixture();
  try {
    await tick(); await tick();
    const accepted = structuredClone(h.original); accepted.revision = "reordered";
    const nodes = accepted.screens[0]!.nodes; [nodes[2], nodes[3]] = [nodes[3]!, nodes[2]!];
    h.respond(accepted, "title-id");
    h.row("title-id").click();
    h.row("title-id").dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, bubbles: true }));
    await tick(); await tick();
    assert.deepEqual(h.calls.find(c => c.operation === "screens.compose")?.payload,
      { screenId: "screen-id", expectedRevision: "before", command: { type: "reorder", nodeId: "title-id", targetId: "body-id", after: true } });
    assert.equal(h.row("title-id").ariaSelected, "true");
    assert.equal(document.activeElement, h.row("title-id"));
    h.row("box-id").click();
    h.row("box-id").dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, bubbles: true }));
    assert.equal(h.calls.filter(c => c.operation === "screens.compose").length, 1);
    assert.equal(h.row("box-id").ariaSelected, "true");
    assert.match(document.body.textContent ?? "", /protected|source-only/i);
  } finally { h.workspace.dispose(); }
});

test("removal confirms every element, retains exact Cancel focus, and selects the core fallback", async () => {
  const h = interactiveFixture();
  try {
    await tick(); await tick();
    h.row("box-id").click();
    const card = document.querySelector<HTMLElement>(".screen-card")!; card.scrollTop = 120;
    const invoke = h.click("Remove element");
    const dialog = document.querySelector<HTMLDialogElement>(".screen-removal-dialog"); assert.ok(dialog?.open);
    assert.match(dialog.textContent ?? "", /Title/); assert.match(dialog.textContent ?? "", /Directions/);
    const cancel = [...dialog.querySelectorAll("button")].find(b => b.textContent === "Cancel")!;
    assert.equal(document.activeElement === cancel, true, "Cancel starts with focus");
    cancel.click(); assert.equal(dialog.open, false); assert.equal(document.activeElement === invoke, true, "Cancel restores the invoking control"); assert.equal(card.scrollTop, 120);
    assert.equal(h.calls.filter(c => c.operation === "screens.compose").length, 0);
    h.row("title-id").focus(); h.row("title-id").click();
    h.row("title-id").dispatchEvent(new window.KeyboardEvent("keydown", { key: "Delete", repeat: true, bubbles: true }));
    assert.equal(dialog.open, false);
    const leafInvoke = h.click("Remove element"); assert.equal(dialog.open, true);
    dialog.dispatchEvent(new window.Event("cancel", { cancelable: true }));
    assert.equal(document.activeElement === leafInvoke, true, "Escape restores the invoking control");
    h.click("Remove element");
    const accepted = structuredClone(h.original); accepted.revision = "removed"; accepted.screens[0]!.nodes.splice(2, 1);
    h.respond(accepted, "body-id");
    const confirm = [...dialog.querySelectorAll("button")].find(b => b.textContent === "Remove text"); assert.ok(confirm); confirm.click();
    await tick(); await tick();
    assert.equal(dialog.open, false);
    assert.deepEqual(h.calls.find(c => c.operation === "screens.compose")?.payload,
      { screenId: "screen-id", expectedRevision: "before", command: { type: "remove", nodeId: "title-id" } });
    assert.equal(h.row("body-id").ariaSelected, "true"); assert.equal(document.activeElement === h.row("body-id"), true, "Focus follows the remaining sibling");
    assert.ok(document.querySelector(".screen-removal-notice"));
    assert.equal(document.querySelector(".screen-card .screen-removal-notice"), null, "Undo feedback stays outside the panel layout");
  } finally { h.workspace.dispose(); }
});

test("shared Undo restores the removed selected identity and Redo restores the fallback", async () => {
  const h = interactiveFixture();
  try {
    await tick(); await tick(); h.row("title-id").click(); h.click("Remove element");
    const removed = structuredClone(h.original); removed.revision = "removed"; removed.screens[0]!.nodes.splice(2, 1);
    h.respond(removed, "body-id"); h.click("Remove text"); await tick(); await tick();
    h.respondHistory(h.original); h.click("Undo"); await tick(); await tick();
    assert.equal(h.row("title-id").ariaSelected, "true");
    assert.equal(document.activeElement === h.row("title-id"), true);
    h.respondHistory(removed); h.click("Redo"); await tick(); await tick();
    assert.equal(h.row("body-id").ariaSelected, "true");
    assert.equal(document.activeElement === h.row("body-id"), true);
  } finally { h.workspace.dispose(); }
});
