import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { Window } from "happy-dom";
import { ScreensWorkspace, type ScreenDocument, type ScreenNode } from "../src/screen-ui.js";
import type { CoreOperation } from "../src/protocol.js";

const flush = async () => {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
};
function fixture(mediaReady?: Promise<void>, previewReady?: Promise<void>, imageBytes?: Buffer, composeReady?: Promise<void>) {
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
    {
      id: "poster",
      kind: "uiImage",
      displayName: "Poster",
      relativePath: "game/images/ui poster.png",
      sha256: "poster-sha",
      status: "available",
      naturalWidth: 80,
      naturalHeight: 40,
    },
  ];
  const bytes = imageBytes ?? readFileSync(
    new URL("../../../tests/fixtures/phase-3b-screens/ui-image/seal.png", import.meta.url),
  );
  let importSequence = 0;
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
            ? { authorityId: `preview-${++importSequence}`, displayName: "seal.png", extension: "png" }
            : { cancelled: true }
        ) as T;
      if (operation === "asset.previewImport") {
        await previewReady;
        return {
          assetId: payload?.authorityId,
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
      if (operation === "asset.import") {
        assets.push({
          id: "imported",
          kind: "uiImage",
          displayName: String(payload?.displayName),
          relativePath: `game/images/ui ${payload?.technicalName}.png`,
          sha256: "preview-sha",
          status: "available",
          naturalWidth: 80,
          naturalHeight: 40,
        });
        return { assets: structuredClone(assets) } as T;
      }
      if (operation === "screens.canvasStatus")
        return { phase: "unavailable", message: "No SDK in component fixture" } as T;
      if (operation === "screens.compose") {
        await composeReady;
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
  return { workspace, calls, click, edit, field, type, browser };
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

for (const fails of [false, true]) test(`image Apply reserves original size and layout until ${fails ? "failure" : "success"}`, async () => {
  let releaseMedia!: () => void, finishCompose!: () => void;
  const media = new Promise<void>((resolve) => { releaseMedia = resolve; });
  const compose = new Promise<void>((resolve, reject) => {
    finishCompose = () => fails ? reject(Error("Source conflict")) : resolve();
  });
  const f = fixture(media, undefined, undefined, compose);
  try {
    await flush();
    f.edit("image-one");
    await flush();
    f.type("Width", "200");
    f.click("Apply image");
    await flush();
    const assertReserved = () => {
      assert.equal(f.click("Use original").disabled, true, "Original size cannot replace the submitted draft");
      assert.equal(f.field("Width").value, "200");
      assert.equal(f.field("Height").value, "100");
      assert.equal(f.field("Horizontal position").readOnly, true, "Image Apply also reserves its layout draft");
      const preset = document.querySelector<HTMLButtonElement>('[data-align-x="0"][data-align-y="0"]')!;
      assert.equal(preset.disabled, true, "Alignment cannot create a newer draft during Apply");
      preset.click();
    };
    assertReserved();
    assert.equal(f.calls.filter((c) => c.operation === "screens.compose").length, 0);
    releaseMedia();
    await flush();
    assert.equal(f.calls.filter((c) => c.operation === "screens.compose").length, 1);
    assertReserved();
    finishCompose();
    await flush();
    assert.equal(f.field("Width").value, "200");
    assert.equal(f.field("Horizontal position").value, "");
    assert.equal(f.field("Horizontal position").readOnly, false);
    assert.equal(f.workspace.hasDraft(), fails, "Failure retains the submitted draft; success accepts it");
    assert.equal(f.click("Use original").disabled, false);
    assert.equal(f.field("Width").value, "80", "Original size works again after Apply settles");
    assert.equal(f.field("Height").value, "40");
  } finally {
    releaseMedia();
    finishCompose();
    await flush();
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

test("picker image decodes stay within the media budget and keep visible URLs valid", async (t) => {
  const live = new Map<string, number>();
  let peak = 0, sequence = 0;
  t.mock.method(URL, "createObjectURL", (blob: Blob) => {
    const url = `blob:picker-${++sequence}`;
    live.set(url, blob.size);
    peak = Math.max(peak, [...live.values()].reduce((sum, size) => sum + size, 0));
    return url;
  });
  t.mock.method(URL, "revokeObjectURL", (url: string) => live.delete(url));
  let release!: () => void;
  const decoding = new Promise<void>((resolve) => { release = resolve; });
  const f = fixture(undefined, undefined, Buffer.alloc(12 * 1024 * 1024));
  t.mock.method(f.browser.HTMLImageElement.prototype, "decode", async () => { await decoding; });
  try {
    await flush();
    f.edit("image-one");
    await flush();
    [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((b) => b.ariaLabel === "Change image, Station seal")!.click();
    await flush();
    assert.ok(peak <= 32 * 1024 * 1024, "Pending image decodes count toward the 32 MiB URL budget");
    release();
    await flush();
    assert.ok(peak <= 32 * 1024 * 1024, "Completed image decodes stay within the same budget");
    for (const img of document.querySelectorAll<HTMLImageElement>("img[src]"))
      assert.ok(live.has(img.src), "A live image never points to a revoked URL");
  } finally {
    release();
    f.workspace.dispose();
  }
  assert.equal(live.size, 0, "Disposing the workspace releases every image URL");
});

test("import staging releases its preview on cancel, replacement, close and completed import", async (t) => {
  const live = new Set<string>();
  let sequence = 0;
  t.mock.method(URL, "createObjectURL", () => {
    const url = `blob:staging-${++sequence}`;
    live.add(url);
    return url;
  });
  t.mock.method(URL, "revokeObjectURL", (url: string) => live.delete(url));
  const f = fixture(undefined, Promise.resolve());
  t.mock.method(f.browser.HTMLImageElement.prototype, "decode", async () => {});
  const picker = async () => {
    [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((b) => b.ariaLabel?.startsWith("Change image,"))!.click();
    await flush();
  };
  const stage = async () => {
    f.click("Import image…");
    f.click("Browse files…");
    await flush();
    const image = document.querySelector<HTMLImageElement>(".screen-image-staged img");
    assert.ok(image?.src, "The selected import has a visible preview");
    assert.ok(live.has(image.src));
    return image.src;
  };
  try {
    await flush();
    f.edit("image-one");
    await flush();
    await picker();
    const cancelled = await stage();
    f.click("Cancel import");
    assert.equal(live.has(cancelled), false, "Cancel releases the staged image URL");
    const replaced = await stage();
    f.click("Browse files…");
    await flush();
    const replacement = document.querySelector<HTMLImageElement>(".screen-image-staged img")!.src;
    assert.equal(live.has(replaced), false, "Browsing again releases the earlier selection");
    assert.ok(live.has(replacement), "The replacement selection keeps its preview");
    f.click("Close");
    assert.equal(live.has(replacement), false, "Close releases the current staged preview");
    await picker();
    const imported = await stage();
    f.type("Display name", "Imported seal");
    f.click("Import and use");
    await flush();
    assert.equal(live.has(imported), false, "Completed import releases its staging URL");
    assert.equal(document.querySelector(".screen-image-dialog"), null);
    assert.equal(document.querySelector<HTMLButtonElement>("[data-image-apply]")!.disabled, false, "The imported asset remains available to Apply");
    for (const img of document.querySelectorAll<HTMLImageElement>("img[src]"))
      assert.ok(live.has(img.src), "Visible images retain a valid Asset preview");
  } finally {
    f.workspace.dispose();
  }
  assert.equal(live.size, 0);
});

test("leaving import staging and disposing the workspace release pending decode URLs", async (t) => {
  const live = new Set<string>();
  let sequence = 0, latest = "";
  t.mock.method(URL, "createObjectURL", () => {
    latest = `blob:pending-${++sequence}`;
    live.add(latest);
    return latest;
  });
  t.mock.method(URL, "revokeObjectURL", (url: string) => live.delete(url));
  const f = fixture(undefined, Promise.resolve());
  let release = () => {};
  try {
    await flush();
    f.edit("image-one");
    await flush();
    [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((b) => b.ariaLabel === "Change image, Station seal")!.click();
    await flush();
    let decoding: Promise<void>;
    t.mock.method(f.browser.HTMLImageElement.prototype, "decode", async () => { await decoding; });
    decoding = new Promise<void>((resolve) => { release = resolve; });
    f.click("Import image…");
    f.click("Browse files…");
    await flush();
    const abandoned = latest;
    f.click("Back to project images");
    assert.equal(live.has(abandoned), false, "Back releases an import URL even while decoding");
    release();
    await flush();
    assert.ok([...document.querySelectorAll("input")].some((input) => input.ariaLabel === "Search UI images"));
    assert.equal(document.querySelector(".screen-image-staged"), null, "The late decode cannot restore staging");
    decoding = new Promise<void>((resolve) => { release = resolve; });
    f.click("Import image…");
    f.click("Browse files…");
    await flush();
    f.workspace.dispose();
    assert.equal(live.size, 0, "Workspace disposal releases pending URLs immediately");
    release();
    await flush();
    assert.equal(live.size, 0, "Late decodes cannot recreate disposed previews");
  } finally {
    release();
    f.workspace.dispose();
  }
});
