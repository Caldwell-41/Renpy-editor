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

function labelledControl<T extends HTMLInputElement | HTMLSelectElement>(label: string): T {
  const wrapper = [...document.querySelectorAll("label")].find((item) => item.firstElementChild?.textContent === label);
  assert.ok(wrapper, `missing field ${label}`);
  const control = wrapper.querySelector("input, select");
  assert.ok(control);
  return control as T;
}

function enter(control: HTMLInputElement | HTMLSelectElement, value: string): void {
  control.value = value;
  control.dispatchEvent(new window.Event("input", { bubbles: true }));
}

test("variable defaults validate on completion and keep errors until the value is corrected", async () => {
  const browser = new Window({ url: "http://tauri.localhost" });
  browser.document.body.innerHTML = '<div id="app"></div>';
  Object.assign(globalThis, {
    window: browser, document: browser.document, HTMLElement: browser.HTMLElement,
    HTMLInputElement: browser.HTMLInputElement, HTMLSelectElement: browser.HTMLSelectElement,
    HTMLTextAreaElement: browser.HTMLTextAreaElement, Event: browser.Event, KeyboardEvent: browser.KeyboardEvent,
  });
  const model = {
    schemaVersion: 1, projectId: "project", characters: [], appearances: [], assets: [],
    variables: [
      { id: "money", technicalName: "money", variableType: "decimal", defaultValue: 2.5,
        source: { path: "game/variables.rpy", statement: "default money = 2.5", sourceRevision: "2".repeat(64) } },
      { id: "score", technicalName: "score", variableType: "int", defaultValue: "5",
        source: { path: "game/variables.rpy", statement: "default score = 5", sourceRevision: "2".repeat(64) } },
    ],
  };
  const project = {
    sessionId: "session", projectId: "project", title: "Validation fixture", folderName: "validation",
    chapterId: "chapter", chapterName: "Chapter 1", sceneId: "scene", sceneName: "Scene 1",
    sdkVersion: "8.5.3", resolution: { width: 1920, height: 1080 },
  };
  const writes: unknown[] = [];
  const request = async <T>(operation: CoreOperation, payload: Readonly<Record<string, unknown>> = {}): Promise<CoreResponse<T>> => {
    if (operation === "variable.update") writes.push(payload);
    const result = operation === "project.listRecent" ? [] : operation === "project.openPicker" ? project
      : operation === "project.status" ? "saved" : model;
    return { protocolVersion: 1, requestId: "test", ok: true, value: result as T };
  };
  try {
    const { startApplication } = await import("../src/main.js");
    startApplication(request); await tick();
    click("Open Loomlight Project"); await tick();
    click("Variables"); await tick();
    for (const [name, invalid, stillInvalid, valid, original] of [
      ["money", "1e", "1e+", "3.75", "2.5"],
      ["score", "9223372036854775808", "92233720368547758080", "7", "5"],
    ]) {
      click(name!); await tick();
      const control = labelledControl<HTMLInputElement>("Default value");
      const errors = () => (control.getAttribute("aria-describedby") ?? "").split(/\s+/)
        .map(id => document.getElementById(id)?.textContent ?? "").filter(Boolean);
      enter(control, invalid!);
      assert.notEqual(control.getAttribute("aria-invalid"), "true", "incomplete typing has no new error");
      control.dispatchEvent(new Event("blur"));
      assert.equal(control.getAttribute("aria-invalid"), "true", `${name} validates on blur`);
      assert.equal(errors().length, 1, "one associated error explains the invalid value");
      enter(control, stillInvalid!);
      assert.equal(control.getAttribute("aria-invalid"), "true", "an invalid correction keeps its error");
      assert.equal(errors().length, 1);
      click("Save Default"); await tick();
      assert.equal(control.value, stillInvalid);
      assert.equal(document.activeElement, control);
      assert.equal(errors().length, 1, "submission does not duplicate the field error");
      enter(control, valid!);
      assert.notEqual(control.getAttribute("aria-invalid"), "true");
      assert.deepEqual(errors(), []);
      control.dispatchEvent(new Event("compositionstart"));
      enter(control, invalid!); control.dispatchEvent(new Event("blur"));
      assert.deepEqual(errors(), [], "composition does not trigger validation");
      control.dispatchEvent(new Event("compositionend"));
      control.dispatchEvent(new Event("blur"));
      assert.equal(control.getAttribute("aria-invalid"), "true");
      click("Cancel");
      assert.equal(control.value, original);
      assert.notEqual(control.getAttribute("aria-invalid"), "true");
      assert.deepEqual(errors(), [], "Cancel clears the validation error");
    }
    assert.deepEqual(writes, [], "field validation and invalid submissions send no writes");
  } finally { await browser.happyDOM.close(); }
});

