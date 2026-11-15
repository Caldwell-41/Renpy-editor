import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import type { CoreOperation, CoreResponse } from "../src/protocol.js";

const tick = async (): Promise<void> => { await new Promise((resolve) => setTimeout(resolve, 50)); };

// The host answers a picker request after the native dialog has closed, so sending the
// request again would open the dialog again. Only REQUEST_OVERLAP comes before the dialog.
test("a picker the host refuses after its dialog closed is sent once and shows the refusal", async () => {
  const browser = new Window({ url: "http://tauri.localhost" });
  browser.document.body.innerHTML = '<div id="app"></div>';
  Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement,
    HTMLInputElement: browser.HTMLInputElement, HTMLSelectElement: browser.HTMLSelectElement, Event: browser.Event, KeyboardEvent: browser.KeyboardEvent });
  const refusals = [
    { code: "RUNTIME_BUSY", message: "Stop the runtime operation and wait for cleanup before continuing." },
    { code: "INTERNAL_ERROR", message: "Another request kept the project busy, so this choice was not applied. Choose again." },
  ];
  let refusal = refusals[0]!;
  const calls: CoreOperation[] = [];
  const request = async <T>(operation: CoreOperation): Promise<CoreResponse<T>> => {
    calls.push(operation);
    if (operation === "project.openPicker") return { protocolVersion: 1, requestId: "test", ok: false, error: refusal };
    return { protocolVersion: 1, requestId: "test", ok: true, value: (operation === "project.listRecent" ? [] : {}) as T };
  };
  const { startApplication } = await import("../src/main.js");
  startApplication(request);
  await tick();
  for (const next of refusals) {
    refusal = next;
    const from = calls.length;
    const open = [...document.querySelectorAll("button")].find((item) => item.textContent === "Open Loomlight Project");
    assert.ok(open, "missing Open Loomlight Project");
    open.click();
    await tick();
    assert.deepEqual(calls.slice(from).filter((operation) => operation === "project.openPicker"), ["project.openPicker"], `${next.code} must not reopen the picker`);
    assert.equal(document.querySelector("#app-status")?.textContent, next.message);
  }
});
