import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { ScreensWorkspace, type ScreenDocument, type ScreenNode } from "../src/screen-ui.js";
import type { CoreOperation } from "../src/protocol.js";

const tick = () => new Promise(resolve => setTimeout(resolve, 0));

function interactiveFixture(initial?: ScreenDocument, canvas = false) {
  const browser = new Window();
  Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement,
    ResizeObserver: class { observe() {} disconnect() {} } });
  const node = (id: string, kind: string, start: number, end: number, parentStart: number | null, literal: string | null = null): ScreenNode => ({
    id, kind, literal, span: { start, end }, parentStart, layout: {}, properties: [], protected: [],
  });
  let doc: ScreenDocument = initial ?? { path: "game/ui/notes.rpy", revision: "before", partial: true, screens: [{ name: "notes", nodes: [
    node("root-id", "screen", 0, 250, null), node("box-id", "vbox", 30, 200, 0),
    node("title-id", "text", 60, 100, 30, "Title"), node("body-id", "text", 110, 140, 30, "Directions"),
    { ...node("custom-id", "custom", 210, 240, 0, "use custom_footer()"), protected: [{ start: 210, end: 240 }] },
  ] }] };
  const calls: { operation: CoreOperation; payload?: Record<string, unknown> }[] = [];
  let reply: { document: ScreenDocument; selectedId: string } | undefined;
  let historyReply: ScreenDocument | undefined;
  let inspectionGate: Promise<void> | undefined;
  let compositionGate: Promise<void> | undefined;
  let current = true, saved = 0;
  const workspace = new ScreensWorkspace({ resolution: { width: 1280, height: 720 }, current: () => current,
    coordinate: task => task(), source: () => {}, preview: () => {}, saved: () => { saved++; },
    request: async <T>(operation: CoreOperation, payload?: Record<string, unknown>): Promise<T> => {
      calls.push({ operation, payload });
      if (operation === "source.list") return { files: [{ path: doc.path }] } as T;
      if (operation === "screens.list") return { projectRevision: "project", sourceMapRevision: "map", inventoryRevision: "inventory",
        owned: [{ id: "screen-id", rootId: "root-id", name: "notes", path: doc.path, resolved: true, sourceRevision: doc.revision }] } as T;
      if (operation === "screens.inspect") { await inspectionGate; return structuredClone(doc) as T; }
      if (operation === "screens.canvasStatus" && canvas) return { phase: "ready" } as T;
      if (operation === "screens.canvasRender" && canvas) return { phase: "ready", frameId: "fixture-frame", revision: doc.revision,
        width: 1280, height: 720, image: "data:image/png;base64,fixture",
        geometry: doc.screens[0]!.nodes.map((node, index) => ({ start: node.span.start, x: 0, y: 0,
          width: index === 0 ? 1280 : 640, height: index === 0 ? 720 : 360 })) } as T;
      if (operation === "screens.compose" && reply) {
        await compositionGate;
        if (payload?.expectedRevision !== doc.revision) throw new Error("Source conflict");
        doc = reply.document; return structuredClone(reply) as T;
      }
      if (["screens.setSize", "screens.setPosition"].includes(operation) && reply) { doc = reply.document; return structuredClone(doc) as T; }
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
    respondHistory: (next: ScreenDocument) => { historyReply = next; }, replaceDocument: (next: ScreenDocument) => { doc = next; },
    setCurrent: (value: boolean) => { current = value; }, saved: () => saved,
    holdComposition: () => { let release!: () => void; compositionGate = new Promise<void>(resolve => { release = resolve; }); return () => { compositionGate = undefined; release(); }; },
    holdInspection: () => { let release!: () => void; inspectionGate = new Promise<void>(resolve => { release = resolve; }); return () => { inspectionGate = undefined; release(); }; } };
}

for (const kind of ["text", "textbutton", "frame"]) {
  test(`owned canvas ${kind} selects on click and opens Design on Enter`, async () => {
    const root: ScreenNode = { id: "root-id", kind: "screen", literal: null, span: { start: 0, end: 250 },
      parentStart: null, layout: {}, properties: [], protected: [] };
    const element: ScreenNode = { id: "element-id", kind, literal: kind === "frame" ? null : "Content",
      span: { start: 30, end: 200 }, parentStart: 0, layout: {}, protected: [],
      properties: kind === "frame" ? [{ property: "xsize", value: 640 }, { property: "ysize", value: 360 }] : [],
      ...(kind === "frame" ? { position: { xalign: 0.5, yalign: 0.5 } } : {}) };
    const h = interactiveFixture({ path: "game/ui/notes.rpy", revision: "before", partial: false,
      screens: [{ name: "notes", nodes: [root, element] }] }, true);
    try {
      await tick(); await tick();
      document.querySelector("img")!.dispatchEvent(new window.Event("load"));
      const target = document.querySelector<HTMLButtonElement>(`.screen-node-${kind}`); assert.ok(target);
      target.focus(); target.click();
      assert.equal(h.row("element-id").ariaSelected, "true", "Click selects the canvas element in Choose");
      const enter = new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
      target.dispatchEvent(enter);
      const design = [...document.querySelectorAll("button")].find(button => button.textContent === "2  Design");
      assert.equal(design?.ariaPressed, "true", "Enter on the canvas element opens Design");
      assert.equal(enter.defaultPrevented, true, "Enter must not trigger another default button activation");
      if (kind !== "frame") {
        const input = [...document.querySelectorAll("textarea")].find(field => field.ariaLabel === (kind === "textbutton" ? "Button label" : "Text"));
        assert.equal(input?.value, "Content");
        assert.equal(document.activeElement === input, true, "Explicit Design entry focuses the text field");
      }
      assert.equal(h.calls.some(call => ["screens.compose", "screens.setPosition", "screens.setSize"].includes(call.operation)), false,
        "Selection and Design entry do not write source");
    } finally { h.workspace.dispose(); }
  });
}

for (const kind of ["text", "textbutton"]) {
  test(`hierarchy Enter focuses the ${kind} editor and retains its draft on re-entry`, async () => {
    const h = interactiveFixture();
    try {
      await tick(); await tick();
      const before = structuredClone(h.original); before.screens[0]!.nodes[2]!.kind = kind;
      h.replaceDocument(before); await h.workspace.load();
      const enter = () => {
        const row = h.row("title-id"); row.focus();
        row.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
        const field = document.querySelector(".screen-card textarea"); assert.ok(field);
        assert.equal(document.activeElement === field, true, "Typing must reach the editor after its focused row is replaced");
        return field as HTMLTextAreaElement;
      };
      const field = enter(); field.value = "Unfinished text"; field.dispatchEvent(new window.Event("input"));
      h.click("1  Choose"); assert.equal(enter().value, "Unfinished text");
      assert.equal(h.calls.some(call => call.operation === "screens.compose"), false);
    } finally { h.workspace.dispose(); }
  });
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

test("accepted addition refreshes the canvas and selects its source-backed geometry without another interaction", async () => {
  const h = interactiveFixture(undefined, true);
  try {
    await tick(); await tick();
    document.querySelector("img")!.dispatchEvent(new window.Event("load"));
    h.row("box-id").click(); h.click("Add element");
    const field = [...document.querySelectorAll("textarea")].find(input => input.ariaLabel === "New element text"); assert.ok(field);
    field.value = "Added"; field.dispatchEvent(new window.Event("input"));
    const accepted = structuredClone(h.original); accepted.revision = "accepted";
    accepted.screens[0]!.nodes.splice(4, 0, { id: "added-id", kind: "text", literal: "Added", parentStart: 30,
      span: { start: 150, end: 180 }, properties: [], layout: {}, protected: [] });
    h.respond(accepted, "added-id"); h.click("Add text");
    await tick(); await tick();
    assert.equal(h.workspace.hasDraft(), false);
    assert.equal(h.row("added-id").ariaSelected, "true");
    const render = h.calls.find(call => call.operation === "screens.canvasRender" && call.payload?.expectedRevision === "accepted");
    assert.ok(render, "Accepted Source must request a canvas frame without another click or resize");
    assert.equal("addition" in render.payload!, false, "The accepted element must render from Source rather than a draft addition");
    const canvas = document.querySelector<HTMLElement>(".screen-game"); assert.ok(canvas);
    document.querySelector("img")!.dispatchEvent(new window.Event("load"));
    assert.equal(canvas.dataset.stale, "false");
    assert.doesNotMatch(document.querySelector(".screen-canvas-status")?.textContent ?? "", /earlier Source revision|Input retained/);
    const target = [...canvas.querySelectorAll<HTMLButtonElement>(".screen-node")].find(node => node.ariaLabel === "Select Added");
    assert.ok(target, "The accepted addition has canvas geometry");
    assert.equal(target.ariaPressed, "true", "Canvas and hierarchy select the accepted addition");
    assert.equal(canvas.querySelector(".screen-pending-addition"), null);
  } finally { h.workspace.dispose(); }
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
    const second = structuredClone(accepted); second.revision = "second"; second.screens[0]!.nodes[3]!.literal = "Unfinished directions";
    h.respond(second, "body-id"); h.click("Apply changes"); await tick(); await tick();
    assert.equal(h.calls.filter(c => c.operation === "screens.compose").at(-1)?.payload?.expectedRevision, "accepted",
      "An unchanged neighboring literal can keep its draft on the accepted revision");
    assert.equal(h.workspace.hasDraft(), false);
    h.text().value = "Cancelled directions"; h.text().dispatchEvent(new window.Event("input"));
    h.click("Cancel changes"); assert.equal(h.text().value, "Unfinished directions");
    assert.equal(h.workspace.hasDraft(), false);
  } finally { h.workspace.dispose(); }
});

test("a pending Add blocks competing operations and a stale completion retains its draft without refreshing", async () => {
  const h = interactiveFixture(undefined, true);
  try {
    await tick(); await tick(); h.row("box-id").click(); h.click("Add element");
    const field = document.querySelector<HTMLTextAreaElement>(".screen-addition textarea"); assert.ok(field);
    field.value = "Pending addition"; field.dispatchEvent(new window.Event("input"));
    const accepted = structuredClone(h.original); accepted.revision = "accepted";
    accepted.screens[0]!.nodes.splice(4, 0, { id: "added-id", kind: "text", literal: "Pending addition", parentStart: 30,
      span: { start: 150, end: 180 }, properties: [], layout: {}, protected: [] });
    h.respond(accepted, "added-id"); const release = h.holdComposition(); h.click("Add text");
    h.click("Add text"); h.click("Undo"); h.click("Refresh Source");
    assert.equal(h.calls.filter(c => c.operation === "screens.compose").length, 1);
    assert.equal(h.calls.filter(c => c.operation === "source.list").length, 1);
    assert.equal(h.calls.some(c => c.operation === "scene.apply"), false);
    const card = document.querySelector(".screen-card")!.innerHTML;
    h.setCurrent(false); release(); await tick(); await tick();
    assert.equal(h.workspace.hasDraft(), true, "A completion for an inactive session must not clear its addition");
    assert.equal(document.querySelector(".screen-card")!.innerHTML, card);
    assert.equal(h.saved(), 0);
    assert.equal(h.calls.some(c => c.operation === "screens.canvasRender" && c.payload?.expectedRevision === "accepted"), false);
  } finally { h.workspace.dispose(); }
});

test("removing the only child settles the dialog before rendering the selected root", async () => {
  const h = interactiveFixture();
  try {
    await tick(); await tick();
    const before = structuredClone(h.original); before.screens[0]!.nodes = [before.screens[0]!.nodes[0]!, { ...before.screens[0]!.nodes[2]!, parentStart: 0 }];
    h.replaceDocument(before); await h.workspace.load(); h.row("title-id").click(); h.click("Remove element");
    const removed = structuredClone(before); removed.revision = "removed"; removed.screens[0]!.nodes.splice(1, 1);
    h.respond(removed, "root-id"); h.click("Remove text"); await tick(); await tick();
    assert.equal(document.querySelector<HTMLDialogElement>(".screen-removal-dialog")?.open, false);
    assert.equal(h.row("root-id").ariaSelected, "true"); assert.equal(document.activeElement, h.row("root-id"));
    assert.equal(h.row("root-id").disabled, false);
    assert.equal(document.querySelector<HTMLElement>(".screen-removal-notice")?.hidden, false);
    h.respondHistory(before); h.click("Undo removal"); await tick(); await tick();
    assert.equal(h.row("title-id").ariaSelected, "true");
  } finally { h.workspace.dispose(); }
});

test("text editing after a size save uses the accepted revision and preserves numeric focus", async () => {
  const h = interactiveFixture();
  try {
    await tick(); await tick();
    const before = structuredClone(h.original);
    before.screens[0]!.nodes[2]!.properties = [{ property: "xsize", value: 640 }, { property: "ysize", value: 360 }];
    h.replaceDocument(before); await h.workspace.load(); h.edit("title-id");
    const properties = document.querySelector<HTMLDetailsElement>(".screen-properties"); assert.ok(properties); properties.open = true;
    const card = document.querySelector<HTMLElement>(".screen-card"); assert.ok(card); card.scrollTop = 40;
    const width = document.querySelector<HTMLInputElement>('[data-size="width"]'); assert.ok(width);
    width.value = "700"; width.dispatchEvent(new window.Event("input")); width.focus();
    const resized = structuredClone(before); resized.revision = "resized"; resized.screens[0]!.nodes[2]!.properties[0]!.value = 700;
    h.respond(resized, "title-id"); width.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await tick(); await tick();
    assert.equal(document.activeElement === document.querySelector('[data-size="width"]'), true, "Save keeps numeric keyboard focus");
    assert.equal(document.querySelector<HTMLDetailsElement>(".screen-properties")?.open, true);
    assert.equal(card.scrollTop, 40);
    h.text().value = "New title"; h.text().dispatchEvent(new window.Event("input"));
    const edited = structuredClone(resized); edited.revision = "edited"; edited.screens[0]!.nodes[2]!.literal = "New title";
    h.respond(edited, "title-id"); h.click("Apply changes"); await tick(); await tick();
    assert.equal(h.calls.find(call => call.operation === "screens.compose")?.payload?.expectedRevision, "resized");
    assert.equal(h.workspace.hasDraft(), false, "The new text saves without reopening Design");
    assert.equal(h.text().value, "New title");
  } finally { h.workspace.dispose(); }
});

for (const gesture of ["keyboard", "drag"] as const) {
  test(`${gesture} hierarchy reorder after canvas resize uses the accepted source`, async () => {
    const h = interactiveFixture(undefined, true);
    try {
      await tick(); await tick();
      const before = structuredClone(h.original), nodes = before.screens[0]!.nodes; before.revision = "geometry-before";
      nodes[1]!.parentStart = 10;
      nodes.splice(1, 0, { id: "frame-id", kind: "frame", literal: null, span: { start: 10, end: 205 }, parentStart: 0,
        layout: {}, properties: [{ property: "xsize", value: gesture === "keyboard" ? 99 : 640 }, { property: "ysize", value: 360 }], protected: [] });
      h.replaceDocument(before); await h.workspace.load(); await tick();
      document.querySelector("img")!.dispatchEvent(new window.Event("load")); h.row("frame-id").click();
      document.querySelector("img")!.dispatchEvent(new window.Event("load"));
      const resized = structuredClone(before); resized.revision = "resized";
      resized.screens[0]!.nodes[1]!.properties[0]!.value++;
      if (gesture === "keyboard") {
        for (const node of resized.screens[0]!.nodes) {
          if (node.span.start > 10) node.span.start++;
          if (node.span.end > 10) node.span.end++;
          if (node.parentStart !== null && node.parentStart > 10) node.parentStart++;
        }
      }
      h.respond(resized, "frame-id");
      const handle = document.querySelector<HTMLButtonElement>(".screen-resize"); assert.ok(handle); handle.focus();
      handle.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); await tick(); await tick();
      document.querySelector("img")!.dispatchEvent(new window.Event("load"));
      assert.equal(document.activeElement === document.querySelector(".screen-resize"), true, "Save retains canvas resize focus");
      const reordered = structuredClone(resized); reordered.revision = "reordered";
      const children = reordered.screens[0]!.nodes; [children[3], children[4]] = [children[4]!, children[3]!];
      h.respond(reordered, "title-id"); h.row("title-id").click();
      if (gesture === "keyboard") h.row("title-id").dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, bubbles: true }));
      else {
        h.row("title-id").dispatchEvent(new window.DragEvent("dragstart", { bubbles: true }));
        const drop = new window.DragEvent("drop", { bubbles: true }); Object.defineProperty(drop, "clientY", { value: 1 });
        h.row("body-id").dispatchEvent(drop);
      }
      await tick(); await tick();
      assert.deepEqual(h.calls.find(call => call.operation === "screens.compose")?.payload,
        { screenId: "screen-id", expectedRevision: "resized", command: { type: "reorder", nodeId: "title-id", targetId: "body-id", after: true } });
      assert.equal(h.row("title-id").ariaSelected, "true");
      assert.equal(document.activeElement === h.row("title-id"), true);
      assert.deepEqual([...document.querySelectorAll<HTMLElement>('[data-node-id]')].map(row => row.dataset.nodeId),
        ["root-id", "frame-id", "box-id", "body-id", "title-id", "custom-id"]);
    } finally { h.workspace.dispose(); }
  });
}

test("addition text validates on completion and submission without losing input or focus", async () => {
  const h = interactiveFixture();
  try {
    await tick(); await tick(); h.click("Add element");
    const input = [...document.querySelectorAll("textarea")].find(field => field.ariaLabel === "New element text"); assert.ok(input);
    assert.equal(input.getAttribute("aria-invalid"), null, "An untouched field is not erroneous");
    input.focus(); input.dispatchEvent(new window.Event("compositionstart")); input.blur();
    input.dispatchEvent(new window.KeyboardEvent("keydown", {key:"Enter",ctrlKey:true,isComposing:true,bubbles:true}));
    assert.equal(input.getAttribute("aria-invalid"), null, "IME completion does not validate or submit");
    input.dispatchEvent(new window.Event("compositionend")); input.focus(); input.blur();
    assert.equal(input.getAttribute("aria-invalid"), "true");
    const error = document.getElementById(input.getAttribute("aria-describedby")!);
    assert.match(error?.textContent ?? "", /Enter text/);
    input.value = "  \n"; input.dispatchEvent(new window.Event("input"));
    h.click("Add text"); await tick();
    assert.equal(document.activeElement === input, true, "Submission focuses the same invalid control");
    assert.equal(input.value, "  \n"); assert.equal(input.isConnected, true);
    assert.equal(h.calls.filter(call => call.operation === "screens.compose").length, 0);
    input.value = "Retained words"; input.dispatchEvent(new window.Event("input"));
    assert.equal(input.getAttribute("aria-invalid"), null);
    assert.equal(error?.hidden, true); assert.equal(document.activeElement === input, true);
  } finally { h.workspace.dispose(); }
});

test("invalid text Apply identifies the field and keeps its draft and keyboard focus", async () => {
  const h = interactiveFixture();
  try {
    await tick(); await tick(); h.edit("title-id");
    const input = h.text(); input.focus(); input.value = " \n "; input.dispatchEvent(new window.Event("input"));
    h.click("Apply changes"); await tick();
    assert.equal(document.activeElement === input, true); assert.equal(input.isConnected, true);
    assert.equal(input.getAttribute("aria-invalid"), "true");
    assert.match(document.getElementById(input.getAttribute("aria-describedby")!)?.textContent ?? "", /Enter text/);
    assert.equal(input.value, " \n "); assert.equal(h.workspace.hasDraft(), true);
    assert.equal(h.calls.filter(call => call.operation === "screens.compose").length, 0);
    input.value = "Corrected title"; input.dispatchEvent(new window.Event("input"));
    assert.equal(input.getAttribute("aria-invalid"), null); assert.equal(document.activeElement === input, true);
    const enter = new window.KeyboardEvent("keydown", { key:"Enter",cancelable:true,bubbles:true });
    input.dispatchEvent(enter); assert.equal(enter.defaultPrevented, false, "Ordinary Enter remains multiline input");
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

test("a Source-removed element keeps its unfinished text available for recovery", async () => {
  const h = interactiveFixture();
  try {
    await tick(); await tick(); h.edit("title-id");
    h.text().value = "Keep this unfinished title"; h.text().dispatchEvent(new window.Event("input"));
    h.click("1  Choose");
    const external = structuredClone(h.original); external.revision = "external"; external.screens[0]!.nodes.splice(2, 1);
    h.replaceDocument(external); h.click("Refresh Source"); await tick(); await tick();
    const retained = [...document.querySelectorAll("textarea")].find(input => input.ariaLabel === "Retained text draft");
    assert.equal(retained?.value, "Keep this unfinished title");
    assert.equal(h.workspace.hasDraft(), true);
    h.click("Discard retained draft"); assert.equal(h.workspace.hasDraft(), false);
    assert.equal(h.calls.filter(call => call.operation === "screens.compose").length, 0);
  } finally { h.workspace.dispose(); }
});

test("removal confirms every element, retains exact Cancel focus, and selects the core fallback", async () => {
  const h = interactiveFixture();
  try {
    await tick(); await tick();
    assert.equal(document.querySelector('[aria-modal="true"]') === null, true, "A closed confirmation must not block project navigation");
    h.row("box-id").click();
    const card = document.querySelector<HTMLElement>(".screen-card")!; card.scrollTop = 120;
    const invoke = h.click("Remove element");
    const dialog = document.querySelector<HTMLDialogElement>(".screen-removal-dialog"); assert.ok(dialog?.open);
    assert.match(dialog.textContent ?? "", /Title/); assert.match(dialog.textContent ?? "", /Directions/);
    const cancel = [...dialog.querySelectorAll("button")].find(b => b.textContent === "Cancel")!;
    assert.equal(document.activeElement === cancel, true, "Cancel starts with focus");
    cancel.click(); assert.equal(dialog.open, false); assert.equal(document.activeElement === invoke, true, "Cancel restores the invoking control"); assert.equal(card.scrollTop, 120);
    assert.equal(document.querySelector('[aria-modal="true"]') === null, true, "Cancellation releases the application's modal guard");
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

test("Undo removal restores the removed selected identity and Redo restores the fallback", async () => {
  const h = interactiveFixture();
  try {
    await tick(); await tick(); h.row("title-id").click(); h.click("Remove element");
    const removed = structuredClone(h.original); removed.revision = "removed"; removed.screens[0]!.nodes.splice(2, 1);
    h.respond(removed, "body-id"); h.click("Remove text"); await tick(); await tick();
    h.respondHistory(h.original); h.click("Undo removal"); await tick(); await tick();
    assert.equal(h.row("title-id").ariaSelected, "true");
    assert.equal(document.activeElement === h.row("title-id"), true);
    h.respondHistory(removed); h.click("Redo"); await tick(); await tick();
    assert.equal(h.row("body-id").ariaSelected, "true");
    assert.equal(document.activeElement === h.row("body-id"), true);
  } finally { h.workspace.dispose(); }
});

for (const edit of ["size", "position"] as const) {
  test(`a saved ${edit} edit expires Undo removal before it can undo unrelated work`, async () => {
    const h = interactiveFixture(undefined, true);
    try {
      await tick(); await tick();
      const before = structuredClone(h.original); before.screens[0]!.nodes[0]!.span.end = 500;
      before.screens[0]!.nodes.push({ id: "frame-id", kind: "frame", literal: null, span: { start: 250, end: 300 },
        parentStart: 0, layout: {}, protected: [], properties: [{ property: "xsize", value: 640 }, { property: "ysize", value: 360 }],
        position: { xalign: 0.5, yalign: 0.5 } });
      h.replaceDocument(before); await h.workspace.load();
      h.row("title-id").click(); h.click("Remove element");
      const removed = structuredClone(before); removed.revision = "removed"; removed.screens[0]!.nodes.splice(2, 1);
      h.respond(removed, "body-id"); h.click("Remove text"); await tick(); await tick();
      const notice = document.querySelector<HTMLElement>(".screen-removal-notice"); assert.ok(notice && !notice.hidden);
      const changed = structuredClone(removed); changed.revision = "changed";
      const changedFrame = changed.screens[0]!.nodes.find(node => node.id === "frame-id")!;
      if (edit === "size") {
        h.edit("frame-id"); const width = document.querySelector<HTMLInputElement>('[data-size="width"]'); assert.ok(width);
        width.value = "640"; width.dispatchEvent(new window.Event("input")); h.click("Apply size"); await tick(); await tick();
        assert.equal(notice.hidden, false, "A no-op does not advance history or expire its Undo action");
        changedFrame.properties[0]!.value = 700; h.respond(changed, "frame-id");
        width.value = "700"; width.dispatchEvent(new window.Event("input")); h.click("Apply size");
      } else {
        changedFrame.position!.xalign += 1 / 640; h.respond(changed, "frame-id");
        document.querySelector("img")!.dispatchEvent(new window.Event("load"));
        const target = document.querySelector<HTMLButtonElement>(".screen-node-frame"); assert.ok(target);
        target.focus(); target.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
      }
      await tick(); await tick();
      assert.equal(h.calls.filter(call => call.operation === (edit === "size" ? "screens.setSize" : "screens.setPosition")).length, edit === "size" ? 2 : 1);
      assert.equal(notice.hidden, true, "A removal-specific Undo action expires when shared history advances");
      h.respondHistory(removed); h.click("Undo"); await tick(); await tick();
      assert.equal(document.querySelector('[data-node-id="title-id"]'), null, "Generic Undo reverses the later edit, leaving removal intact");
    } finally { h.workspace.dispose(); }
  });
}

test("returning to Screens expires an Undo removal action from the previous visit", async () => {
  const h = interactiveFixture();
  try {
    await tick(); await tick(); h.row("title-id").click(); h.click("Remove element");
    const removed = structuredClone(h.original); removed.revision = "removed"; removed.screens[0]!.nodes.splice(2, 1);
    h.respond(removed, "body-id"); h.click("Remove text"); await tick(); await tick();
    const notice = document.querySelector<HTMLElement>(".screen-removal-notice"); assert.ok(notice && !notice.hidden);
    h.workspace.panel.remove();
    h.workspace.mount(document.body); await tick(); await tick();
    assert.equal(notice.hidden, true, "Other workspaces may have advanced shared history while Screens was detached");
    assert.equal(h.calls.some(call => call.operation === "scene.apply"), false);
  } finally { h.workspace.dispose(); }
});

test("addition history keeps a surviving parent selection on Redo", async () => {
  const h = interactiveFixture();
  try {
    await tick(); await tick(); h.row("box-id").click(); h.click("Add element");
    const field = [...document.querySelectorAll("textarea")].find(input => input.ariaLabel === "New element text")!;
    field.value = "Added"; field.dispatchEvent(new window.Event("input"));
    const added = structuredClone(h.original); added.revision = "added";
    added.screens[0]!.nodes.splice(4, 0, { id: "added-id", kind: "text", literal: "Added", parentStart: 30, span: {start:150,end:180}, properties:[], layout:{}, protected:[] });
    h.respond(added, "added-id"); h.click("Add text"); await tick(); await tick();
    h.respondHistory(h.original); h.click("Undo"); await tick(); await tick(); assert.equal(h.row("box-id").ariaSelected, "true");
    h.respondHistory(added); h.click("Redo"); await tick(); await tick(); assert.equal(h.row("box-id").ariaSelected, "true");
  } finally { h.workspace.dispose(); }
});

test("removal and its history select an unmarked next sibling by its accepted source position", async () => {
  const h = interactiveFixture();
  try {
    await tick(); await tick();
    const before = structuredClone(h.original); before.screens[0]!.nodes[3]!.id = null;
    h.replaceDocument(before); await h.workspace.load();
    h.row("title-id").click(); h.click("Remove element");
    const removed = structuredClone(before); removed.revision = "removed"; removed.screens[0]!.nodes.splice(2, 1);
    removed.screens[0]!.nodes[2]!.span = { start: 70, end: 100 };
    h.respond(removed, "source-at-70"); h.click("Remove text"); await tick(); await tick();
    assert.equal(h.row("source-at-70").ariaSelected, "true");
    assert.equal(document.activeElement, h.row("source-at-70"));
    h.respondHistory(before); h.click("Undo"); await tick(); await tick();
    assert.equal(h.row("title-id").ariaSelected, "true");
    h.respondHistory(removed); h.click("Redo"); await tick(); await tick();
    assert.equal(h.row("source-at-70").ariaSelected, "true");
    assert.equal(document.activeElement, h.row("source-at-70"));
    h.workspace.dispose();
    const reopened = interactiveFixture(removed);
    try {
      await tick(); await tick();
      assert.equal(reopened.row("source-at-70").ariaSelected, "true");
    } finally { reopened.workspace.dispose(); }
    const changed = structuredClone(removed); changed.revision = "changed-externally";
    const stale = interactiveFixture(changed);
    try {
      await tick(); await tick();
      assert.equal(stale.row("root-id").ariaSelected, "true", "An offset never selects against another revision");
    } finally { stale.workspace.dispose(); }
  } finally { h.workspace.dispose(); }
});

test("history remains busy until its refreshed document and selection are installed", async () => {
  const h = interactiveFixture(); let release: (() => void) | undefined;
  try {
    await tick(); await tick();
    h.respondHistory(h.original); release = h.holdInspection();
    h.click("Undo"); await tick(); await tick(); h.click("Redo"); await tick();
    assert.equal(h.calls.filter(call => call.operation === "scene.apply").length, 1, "A second history command must wait for the first refresh");
    release(); release = undefined; await tick(); await tick();
  } finally { release?.(); h.workspace.dispose(); }
});
