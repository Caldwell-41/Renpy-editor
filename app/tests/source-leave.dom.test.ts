import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import type { CoreOperation, CoreResponse } from "../src/protocol.js";

const tick = async (): Promise<void> => { await new Promise((resolve) => setTimeout(resolve, 0)); };

function click(label: string): void {
  const target = [...document.querySelectorAll("button")].find((item) => item.textContent === label);
  assert.ok(target, `missing button ${label}`);
  target.click();
}

test("dirty Source close offers cancel and zero-leave failed Save All before a successful close", async () => {
  const browser = new Window({ url: "http://tauri.localhost" });
  browser.document.body.innerHTML = '<div id="app"></div>';
  Object.assign(globalThis, {
    window: browser,
    document: browser.document,
    HTMLElement: browser.HTMLElement,
    HTMLInputElement: browser.HTMLInputElement,
    HTMLSelectElement: browser.HTMLSelectElement,
    Event: browser.Event,
    KeyboardEvent: browser.KeyboardEvent,
  });

  const project = {
    sessionId: "source-session", projectId: "source-project", title: "Source Project", folderName: "source-project",
    chapterId: "chapter", chapterName: "Chapter", sceneId: "scene", sceneName: "Scene",
    sdkVersion: "8.5.3", resolution: { width: 1280, height: 720 },
  };
  let saveShouldFail = true;
  let closeCount = 0;
  const calls: CoreOperation[] = [];
  const request = async <T>(operation: CoreOperation): Promise<CoreResponse<T>> => {
    calls.push(operation);
    if (operation === "project.listRecent") return { protocolVersion: 1, requestId: "test", ok: true, value: [] as T };
    if (operation === "project.openPicker") return { protocolVersion: 1, requestId: "test", ok: true, value: project as T };
    if (operation === "project.status") return { protocolVersion: 1, requestId: "test", ok: true, value: "pendingValidation" as T };
    if (operation === "source.list") return { protocolVersion: 1, requestId: "test", ok: true, value: { files: [], dirtyCount: 1, draftBytes: 7 } as T };
    if (operation === "source.saveAll" && saveShouldFail) return { protocolVersion: 1, requestId: "test", ok: false, error: { code: "INVALID_SOURCE", message: "No Source files were saved" } };
    if (operation === "source.saveAll") return { protocolVersion: 1, requestId: "test", ok: true, value: { files: [], dirtyCount: 0, draftBytes: 0 } as T };
    if (operation === "project.close") { closeCount += 1; return { protocolVersion: 1, requestId: "test", ok: true, value: undefined as T }; }
    return { protocolVersion: 1, requestId: "test", ok: true, value: {} as T };
  };

  const { startApplication } = await import("../src/main.js");
  startApplication(request);
  await tick();
  click("Open Loomlight Project");
  await tick();
  click("Close Project");
  await tick();
  const choices = document.querySelector(".leave-source-dialog")?.textContent ?? "";
  for (const choice of ["Save All", "Discard All", "Cancel"]) assert.match(choices, new RegExp(choice));
  assert.equal((document.activeElement as HTMLElement | null)?.textContent, "Save All");
  document.activeElement?.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
  assert.equal((document.activeElement as HTMLElement | null)?.textContent, "Cancel");
  document.activeElement?.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true }));
  assert.equal((document.activeElement as HTMLElement | null)?.textContent, "Save All");
  document.querySelector(".leave-source-dialog")?.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  assert.equal(closeCount, 0);
  assert.match(document.body.textContent ?? "", /Source Project/);

  click("Close Project");
  await tick();
  click("Save All");
  await tick();
  assert.equal(closeCount, 0);
  assert.ok(document.querySelector(".leave-source-dialog"));
  assert.match(document.querySelector("#app-status")?.textContent ?? "", /No Source files were saved/);

  saveShouldFail = false;
  click("Save All");
  await tick();
  await tick();
  assert.equal(closeCount, 1);
  assert.equal(calls.filter((operation) => operation === "source.saveAll").length, 2);
  assert.match(document.body.textContent ?? "", /New Project/);
});
