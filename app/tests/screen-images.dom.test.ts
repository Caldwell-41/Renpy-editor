import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { Window } from "happy-dom";
import { ScreensWorkspace, type ScreenDocument, type ScreenNode } from "../src/screen-ui.js";
import type { CoreOperation } from "../src/protocol.js";

const flush = async () => {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
};
function fixture(mediaReady?: Promise<void>, previewReady?: Promise<void>) {
  const browser = new Window();
  Object.assign(globalThis, {
    window: browser,
    document: browser.document,
    HTMLElement: browser.HTMLElement,
    HTMLDetailsElement: browser.HTMLDetailsElement,
    HTMLInputElement: browser.HTMLInputElement,
    ResizeObserver: class {
      observe() {}
      disconnect() {}
    },
  });
  const image = (id: string, start: number): ScreenNode => ({
    id,
    kind: "image",
    literal: "images/ui seal.png",
    span: { start, end: start + 70 },
    parentStart: 0,
    layout: {},
    properties: [
      { property: "xsize", value: 160 },
      { property: "ysize", value: 80 },
    ],
    protected: [],
    numericLayout: {
      values: { xsize: { unit: "pixels", value: 160 }, ysize: { unit: "pixels", value: 80 } },
      blocked: {},
    },
  });
  let doc: ScreenDocument = {
    path: "game/ui/notes.rpy",
    revision: "before",
    partial: false,
    screens: [
      {
        name: "notes",
        nodes: [
          {
            id: "root",
            kind: "screen",
            literal: null,
            span: { start: 0, end: 240 },
            parentStart: null,
            layout: {},
            properties: [],
            protected: [],
          },
          image("image-one", 30),
          image("image-two", 130),
        ],
      },
    ],
  };
  const assets = [
    {
      id: "seal",
      kind: "uiImage",
      displayName: "Station seal",
      relativePath: "game/images/ui seal.png",
      sha256: "seal-sha",
      status: "available",
      naturalWidth: 80,
      naturalHeight: 40,
    },
    {
      id: "banner",
      kind: "uiImage",
      displayName: "Banner",
      relativePath: "game/images/ui banner.png",
      sha256: "banner-sha",
      status: "available",
      naturalWidth: 80,
      naturalHeight: 32,
    },
  ];
  const bytes = readFileSync(
    new URL("../../../tests/fixtures/phase-3b-screens/ui-image/seal.png", import.meta.url),
  );
  const calls: { operation: CoreOperation; payload?: Record<string, unknown> }[] = [];
  const workspace = new ScreensWorkspace({
    resolution: { width: 1280, height: 720 },
    current: () => true,
    coordinate: (t) => t(),
    saved: () => {},
    source: () => {},
    preview: () => {},
    request: async <T>(operation: CoreOperation, payload?: Record<string, unknown>): Promise<T> => {
      calls.push({ operation, payload });
      if (operation === "source.list") return { files: [{ path: doc.path }] } as T;
      if (operation === "screens.list")
        return {
          projectRevision: "project",
          sourceMapRevision: "map",
          inventoryRevision: "inventory",
          owned: [
            {
              id: "screen",
              rootId: "root",
              name: "notes",
              path: doc.path,
              resolved: true,
              sourceRevision: doc.revision,
            },
          ],
        } as T;
      if (operation === "screens.inspect") return structuredClone(doc) as T;
      if (operation === "authoring.list") return { assets: structuredClone(assets) } as T;
      if (operation === "media.present") {
        await mediaReady;
        const a = assets.find((a) => a.id === payload?.assetId)!;
        return {
          assetId: a.id,
          purpose: "imagePreview",
          mimeType: "image/png",
          dataBase64: bytes.toString("base64"),
          sha256: a.sha256,
          cacheKey: a.id + ":" + a.sha256,
          byteCount: bytes.length,
          width: a.naturalWidth,
          height: a.naturalHeight,
        } as T;
      }
      if (operation === "asset.chooseImport" || operation === "asset.chooseUiImage")
        return (
          previewReady
            ? { authorityId: "preview", displayName: "seal.png", extension: "png" }
            : { cancelled: true }
        ) as T;
      if (operation === "asset.previewImport") {
        await previewReady;
        return {
          assetId: "preview",
          purpose: "imagePreview",
          mimeType: "image/png",
          dataBase64: bytes.toString("base64"),
          sha256: "preview-sha",
          cacheKey: "preview",
          byteCount: bytes.length,
          width: 80,
          height: 40,
        } as T;
      }
      if (operation === "screens.canvasStatus")
        return { phase: "unavailable", message: "No SDK in component fixture" } as T;
      if (operation === "screens.compose") {
        const command = payload?.command as {
          type: string;
          nodeId: string;
          assetId: string;
          width: number;
          height: number;
        };
        assert.equal(payload?.expectedRevision, doc.revision);
        doc = structuredClone(doc);
        doc.revision = "after";
        const n = doc.screens[0]!.nodes.find((n) => n.id === command.nodeId)!;
        n.literal = assets.find((a) => a.id === command.assetId)!.relativePath.slice(5);
        n.numericLayout!.values.xsize = { unit: "pixels", value: command.width };
        n.numericLayout!.values.ysize = { unit: "pixels", value: command.height };
        return { document: doc, selectedId: n.id, changed: true } as T;
      }
      if (operation === "source.open")
        return {
          path: doc.path,
          baseRevision: doc.revision,
          text: 'screen notes():\n    add "images/ui seal.png"\n',
        } as T;
      throw Error(operation);
    },
  });
  workspace.mount(document.body);
  const click = (text: string) => {
    const b = [...document.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent === text);
    assert.ok(b, text);
    b.click();
    return b;
  };
  const edit = (id: string) => {
    const row = document.querySelector<HTMLElement>(`[data-node-id="${id}"]`);
    assert.ok(row);
    row.dispatchEvent(new window.MouseEvent("dblclick"));
  };
  const field = (name: string) => {
    const input = [...document.querySelectorAll<HTMLInputElement>("input")].find((i) => i.ariaLabel === name);
    assert.ok(input, name);
    return input;
  };
  const type = (name: string, value: string) => {
    const input = field(name);
    input.focus();
    input.value = value;
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
    return input;
  };
  return { workspace, calls, click, edit, field, type };
}

test("A2 image editing links natural aspect, retains invalid input, cancels in place and accepts one image command", async () => {
  const f = fixture();
  try {
    await flush();
    f.edit("image-one");
    await flush();
    assert.equal(f.click("Apply image").disabled, true);
    const width = f.type("Width", "200");
    assert.equal(f.field("Height").value, "100");
    width.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
    );
    assert.equal(f.field("Width").value, "160");
    assert.equal(document.activeElement, f.field("Width"));
    f.type("Width", "bad");
    f.click("Apply image");
    await flush();
    assert.equal(f.field("Width").value, "bad");
    assert.equal(f.field("Width").ariaInvalid, "true");
    assert.equal(f.calls.filter((c) => c.operation === "screens.compose").length, 0);
    const entered = f.type("Width", "200");
    entered.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
    );
    await flush();
    const writes = f.calls.filter((c) => c.operation === "screens.compose");
    assert.equal(writes.length, 1);
    assert.deepEqual(writes[0]!.payload?.command, {
      type: "image",
      nodeId: "image-one",
      assetId: "seal",
      expectedAssetSha256: "seal-sha",
      width: 200,
      height: 100,
    });
    assert.equal(document.activeElement, f.field("Width"));
    assert.equal(f.click("Apply image").disabled, true);
  } finally {
    f.workspace.dispose();
  }
});

test("A2 chooser cancellation and selection keep separate image drafts without starting a project runtime", async () => {
  const f = fixture();
  try {
    await flush();
    f.edit("image-one");
    await flush();
    f.type("Width", "200");
    const asset = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
      (b) => b.ariaLabel === "Change image, Station seal",
    );
    assert.ok(asset);
    asset.click();
    await flush();
    f.click("Import image…");
    f.click("Browse files…");
    await flush();
    f.click("Close");
    assert.equal(f.field("Width").value, "200");
    f.click("1  Choose");
    f.edit("image-two");
    await flush();
    assert.equal(f.field("Width").value, "160");
    f.type("Width", "240");
    f.click("1  Choose");
    f.edit("image-one");
    await flush();
    assert.equal(f.field("Width").value, "200");
    assert.equal(
      f.calls.some((c) => c.operation.startsWith("runtime.")),
      false,
    );
    assert.equal(
      f.calls.some((c) => c.operation === "screens.compose"),
      false,
    );
  } finally {
    f.workspace.dispose();
  }
});

test("image Apply includes advanced layout once and keeps the numeric field focus", async () => {
  const f = fixture();
  try {
    await flush();
    f.edit("image-one");
    await flush();
    const position = f.type("Horizontal position", "10");
    position.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
    );
    await flush();
    const writes = f.calls.filter((c) => c.operation === "screens.compose");
    assert.equal(writes.length, 1);
    assert.deepEqual((writes[0]!.payload?.command as { layout: unknown }).layout, {
      xpos: { unit: "pixels", value: 10 },
    });
    assert.equal(document.activeElement === f.field("Horizontal position"), true);
  } finally {
    f.workspace.dispose();
  }
});

test("slow image Apply reserves selection and preserves the other image's draft", async () => {
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  const f = fixture(ready);
  try {
    await flush();
    f.edit("image-two");
    await flush();
    f.type("Width", "240");
    f.click("1  Choose");
    f.edit("image-one");
    await flush();
    f.type("Width", "200");
    f.click("Apply image");
    await flush();
    f.click("1  Choose");
    assert.equal(
      document.querySelector('[data-image-field="width"]') !== null,
      true,
      "Selection stays reserved through media validation",
    );
    release();
    await flush();
    assert.equal(f.calls.filter((c) => c.operation === "screens.compose").length, 1);
    f.click("1  Choose");
    f.edit("image-two");
    await flush();
    assert.equal(f.field("Width").value, "240");
  } finally {
    release();
    f.workspace.dispose();
  }
});

test("Back discards late import previews without replacing the project picker", async () => {
  let release!: () => void;
  const preview = new Promise<void>((resolve) => {
    release = resolve;
  });
  const f = fixture(undefined, preview);
  try {
    await flush();
    f.edit("image-one");
    await flush();
    [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((b) => b.ariaLabel === "Change image, Station seal")!
      .click();
    await flush();
    f.click("Import image…");
    f.click("Browse files…");
    await flush();
    f.click("Back to project images");
    release();
    await flush();
    assert.equal(
      [...document.querySelectorAll("input")].some((i) => i.ariaLabel === "Search UI images"),
      true,
    );
    assert.equal(
      [...document.querySelectorAll("input")].some((i) => i.ariaLabel === "Display name"),
      false,
    );
    assert.equal(
      f.calls.some((c) => c.operation === "asset.import"),
      false,
    );
  } finally {
    release();
    f.workspace.dispose();
  }
});
