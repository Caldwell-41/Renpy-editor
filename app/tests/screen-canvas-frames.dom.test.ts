import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { Window } from "happy-dom";
import { ScreenCanvasFrames, type CanvasGeometry } from "../src/screen-canvas-frames.js";
import type { CoreOperation } from "../src/protocol.js";

function fixture(t: TestContext) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const browser = new Window(), document = browser.document;
  const canvas = document.createElement("div"), status = document.createElement("p"), image = document.createElement("img");
  image.className = "screen-render";
  // The browser loads PNGs asynchronously. Keep image delivery under the test's control.
  let source = "";
  Object.defineProperty(image, "src", { get: () => source, set: (value: string) => { source = value; } });
  canvas.append(image); document.body.append(canvas, status);
  let revision: string | undefined = "accepted", installed = 0;
  const invalidations: boolean[] = [];
  const calls: { operation: CoreOperation; payload?: Record<string, unknown>; resolve: (value: unknown) => void; reject: (error: Error) => void }[] = [];
  const frames = new ScreenCanvasFrames({
    canvas: canvas as unknown as HTMLElement, status: status as unknown as HTMLElement,
    currentRevision: () => revision,
    request: <T>(operation: CoreOperation, payload?: Record<string, unknown>) => new Promise<T>((resolve, reject) => {
      calls.push({ operation, payload, resolve: value => resolve(value as T), reject });
    }),
    installed: () => { installed++; }, invalidated: discard => { invalidations.push(discard); },
  });
  const payload = { path: "game/ui/help.rpy", screenName: "help", expectedRevision: "accepted", width: 1280, height: 720 };
  const geometry: CanvasGeometry[] = [{ start: 10, x: 20, y: 30, width: 640, height: 360 }];
  const ready = (name = "first", values = geometry) => ({ phase: "ready", frameId: name, revision: "accepted", image: `data:image/png;base64,${name}`, geometry: values });
  const advance = async (milliseconds = 0) => { t.mock.timers.tick(milliseconds); await Promise.resolve(); await Promise.resolve(); };
  const load = () => image.dispatchEvent(new browser.Event("load"));
  t.after(() => { frames.dispose(); });
  return { frames, canvas, status, image, calls, payload, geometry, ready, advance, load, invalidations,
    installed: () => installed, revision: (value: string | undefined) => { revision = value; } };
}

test("canvas delivery polls starting frames and exposes geometry only after the matching PNG loads", async t => {
  const h = fixture(t);
  h.frames.render(h.payload); await h.advance();
  assert.equal(h.calls[0]!.operation, "screens.canvasRender");
  assert.deepEqual(h.calls[0]!.payload, h.payload);
  h.calls[0]!.resolve({ phase: "starting", frameId: "pending" }); await h.advance();
  await h.advance(16);
  assert.equal(h.calls[1]!.operation, "screens.canvasStatus");
  assert.deepEqual(h.calls[1]!.payload, { frameId: "pending" });
  h.calls[1]!.resolve(h.ready()); await h.advance();
  assert.equal(h.image.src, "data:image/png;base64,first");
  assert.equal(h.frames.ready, false);
  assert.equal(h.frames.geometry, undefined);
  assert.equal(h.canvas.dataset.stale, "true");
  h.load();
  assert.equal(h.frames.ready, true);
  assert.deepEqual(h.frames.geometry, h.geometry);
  assert.equal(h.canvas.dataset.stale, "false");
  assert.equal(h.installed(), 1);
  h.frames.render({ ...h.payload });
  assert.equal(h.calls.length, 2, "Selection-only rendering reuses the delivered frame");
  h.load();
  assert.equal(h.installed(), 2, "The installed frame can refresh editor guides without another helper request");
});

test("superseded replies and PNG callbacks cannot publish older canvas geometry", async t => {
  const h = fixture(t);
  h.frames.render(h.payload); await h.advance();
  h.frames.render({ ...h.payload, textSamples: [{ nodeStart: 10, value: "Second" }] }); await h.advance();
  h.calls[1]!.resolve(h.ready("second")); await h.advance();
  const secondLoad = h.image.onload!;
  h.calls[0]!.resolve(h.ready("obsolete")); await h.advance();
  assert.equal(h.image.src, "data:image/png;base64,second");
  h.frames.render({ ...h.payload, textSamples: [{ nodeStart: 10, value: "Third" }] }); await h.advance();
  secondLoad.call(h.image, new h.image.ownerDocument.defaultView!.Event("load"));
  assert.equal(h.frames.ready, false);
  assert.equal(h.installed(), 0);
  const thirdGeometry = [{ ...h.geometry[0]!, x: 40 }];
  h.calls[2]!.resolve(h.ready("third", thirdGeometry)); await h.advance(); h.load();
  assert.deepEqual(h.frames.geometry, thirdGeometry);
  assert.equal(h.installed(), 1);
});

test("canvas image errors and helper health failure disable geometry and stop their polling", async t => {
  const h = fixture(t);
  h.frames.render(h.payload); await h.advance(); h.calls[0]!.resolve(h.ready()); await h.advance(); h.load();
  h.frames.render({ ...h.payload, buttonState: "hover" }); await h.advance();
  h.calls[1]!.resolve(h.ready("replacement")); await h.advance();
  h.image.dispatchEvent(new h.image.ownerDocument.defaultView!.Event("error"));
  assert.equal(h.frames.ready, false);
  assert.deepEqual(h.frames.geometry, h.geometry, "The last installed image remains the movement reference");
  assert.equal(h.status.textContent, "Canvas image unavailable. Drafts retained.");
  assert.equal(h.invalidations.at(-1), true);
  await h.advance(1000); assert.equal(h.calls.length, 2);
  h.frames.render(h.payload); await h.advance(); h.calls[2]!.resolve(h.ready("retry")); await h.advance(); h.load();
  await h.advance(500);
  assert.deepEqual(h.calls[3]!.payload, { frameId: "retry", includeImage: false });
  h.calls[3]!.resolve({ phase: "unavailable", message: "Helper stopped. Drafts retained." }); await h.advance();
  assert.equal(h.frames.ready, false);
  assert.equal(h.image.src, "data:image/png;base64,retry");
  assert.equal(h.canvas.dataset.stale, "true");
  assert.equal(h.status.textContent, "Helper stopped. Drafts retained.");
  await h.advance(1000); assert.equal(h.calls.length, 4);
});

test("hidden canvas delivery sends no polls and ignores a reply already in flight", async t => {
  const h = fixture(t);
  h.frames.render(h.payload); await h.advance(); h.calls[0]!.resolve(h.ready()); await h.advance(); h.load();
  h.canvas.remove(); await h.advance(1000);
  assert.equal(h.frames.ready, false);
  assert.equal(h.calls.length, 1, "A hidden workspace must not compete for the shared helper");
  h.image.ownerDocument.body.append(h.canvas);
  h.frames.invalidate("Checking canvas source.");
  h.frames.render(h.payload); await h.advance();
  h.calls[1]!.resolve({ phase: "starting", frameId: "starting" }); await h.advance(); await h.advance(16);
  assert.equal(h.calls.length, 3);
  h.canvas.remove(); h.calls[2]!.resolve(h.ready("hidden")); await h.advance();
  assert.equal(h.image.src, "data:image/png;base64,first");
  assert.equal(h.frames.ready, false);
  await h.advance(1000); assert.equal(h.calls.length, 3);
});

test("source revision changes and disposal prevent a pending PNG from restoring usable geometry", async t => {
  const h = fixture(t);
  h.frames.render(h.payload); await h.advance(); h.calls[0]!.resolve(h.ready()); await h.advance();
  const pendingLoad = h.image.onload!;
  h.revision("new-source"); h.load();
  assert.equal(h.frames.ready, false);
  assert.equal(h.frames.geometry, undefined);
  h.revision("accepted"); h.load();
  assert.equal(h.frames.ready, true);
  h.revision("new-source");
  assert.equal(h.frames.ready, false, "Installed geometry cannot manipulate a different Source revision");
  h.frames.dispose(); h.revision("accepted");
  assert.equal(h.frames.ready, false);
  pendingLoad.call(h.image, new h.image.ownerDocument.defaultView!.Event("load"));
  h.frames.render(h.payload); await h.advance(1000);
  assert.equal(h.calls.length, 1);
  assert.equal(h.installed(), 1);
});
