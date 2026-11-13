import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import type { CoreOperation, CoreResponse } from "../src/protocol.js";
import type { SourceDocument, SourceInventory } from "../src/source-ui.js";
import type { SceneBeat } from "../src/scene-ui.js";
import { sceneBodies } from "./story-controls-fixture.js";

const tick = async (): Promise<void> => { await new Promise((resolve) => setTimeout(resolve, 0)); };
const ticks = async (count = 4): Promise<void> => { for (let index = 0; index < count; index += 1) await tick(); };

function click(label: string): void {
  const target = [...document.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent === label);
  assert.ok(target, `missing button ${label}`);
  target.click();
}

function saveEvent(options: { meta?: boolean; ctrl?: boolean; shift?: boolean; alt?: boolean; repeat?: boolean; composing?: boolean } = {}): KeyboardEvent {
  const event = new window.KeyboardEvent("keydown", {
    key: "s",
    bubbles: true,
    cancelable: true,
    ctrlKey: options.ctrl,
    metaKey: options.meta,
    shiftKey: options.shift,
    altKey: options.alt,
    repeat: options.repeat,
  });
  if (options.composing) Object.defineProperty(event, "isComposing", { value: true });
  return event;
}

// main.ts keeps #app and its keyboard listener from first import, so both tests share one window.
const browser = new Window({ url: "http://tauri.localhost" });
browser.document.body.innerHTML = '<div id="app"></div>';
Object.assign(globalThis, {
  window: browser,
  document: browser.document,
  HTMLElement: browser.HTMLElement,
  HTMLInputElement: browser.HTMLInputElement,
  HTMLSelectElement: browser.HTMLSelectElement,
  HTMLTextAreaElement: browser.HTMLTextAreaElement,
  Event: browser.Event,
  KeyboardEvent: browser.KeyboardEvent,
});

test("the shell owns Save routing across Source, clean fallback, modifiers, remount, modal, and retention failure", async () => {
  Object.defineProperty(browser.navigator, "platform", { configurable: true, value: "Win32" });

  const project = {
    sessionId: "save-session", projectId: "save-project", title: "Save Project", folderName: "save-project",
    chapterId: "chapter", chapterName: "Chapter", sceneId: "scene", sceneName: "Scene",
    sdkVersion: "8.5.3", resolution: { width: 1280, height: 720 },
  };
  let acceptedText = 'label scene:\n    "Hello"\n    return\n';
  let retainedDraft: string | undefined;
  let model: SourceDocument = {
    path: "game/scene.rpy", text: acceptedText, state: "clean", editable: true, dirty: false,
    baseRevision: "a".repeat(64), liveRevision: "a".repeat(64), draftVersion: 0,
    hasBom: false, newline: "LF", partial: false, diagnostics: [], ranges: [],
    selectionStart: 0, selectionEnd: 0, canApplyBoth: false,
  };
  const inventory = (): SourceInventory => ({
    files: [
      { path: model.path, state: model.state, dirty: model.dirty, readOnly: false },
      ...(otherSourceDirty ? [{ path: "game/other.rpy", state: "dirty" as const, dirty: true, readOnly: false }] : []),
    ],
    dirtyCount: Number(model.dirty) + Number(otherSourceDirty),
    draftBytes: (model.dirty ? (model.text?.length ?? 0) : 0) + (otherSourceDirty ? 32 : 0),
  });
  const calls: CoreOperation[] = [];
  let saves = 0;
  let saveAlls = 0;
  let flushes = 0;
  let closes = 0;
  let failNextRetention = false;
  let otherSourceDirty = false;
  const authoring = {
    schemaVersion: 1,
    projectId: project.projectId,
    characters: [],
    appearances: [],
    assets: [],
    variables: [],
  };
  const emptyScene = {
    projectRevision: "1".repeat(64), sourceMapRevision: "2".repeat(64), entrySceneId: "scene",
    lastOpen: { chapterId: "chapter", sceneId: "scene" },
    chapters: [{ id: "chapter", displayName: "Chapter", directory: "game" }],
    scenes: [{ id: "scene", chapterId: "chapter", displayName: "Scene", technicalLabel: "scene", sourcePath: model.path, sourceRevision: model.baseRevision, sourceConflict: false, partial: false, beats: [], bodies: sceneBodies([]) }],
    authoring: { characters: [], appearances: [], assets: [], variables: [] },
  };

  const request = async <T>(operation: CoreOperation, payload: Readonly<Record<string, unknown>> = {}): Promise<CoreResponse<T>> => {
    calls.push(operation);
    let value: unknown = {};
    if (operation === "project.listRecent") value = [];
    else if (operation === "project.openPicker") value = project;
    else if (operation === "project.status") value = model.state === "conflict" || model.state === "invalid" ? "conflict" : model.dirty || otherSourceDirty ? "pendingValidation" : "saved";
    else if (operation === "project.flush") { flushes += 1; value = null; }
    else if (operation === "project.close") { closes += 1; value = null; }
    else if (operation === "source.list") value = inventory();
    else if (operation === "flow.list") value = { revision: "flow", entrySceneId: "scene", nodes: [], edges: [], partial: false, stale: false, overLimit: false, notice: "Accepted source" };
    else if (operation === "source.open") value = model;
    else if (operation === "source.updateDraft") {
      if (failNextRetention) {
        failNextRetention = false;
        return { protocolVersion: 1, requestId: "test", ok: false, error: { code: "DRAFT_LIMIT", message: "Latest Source input could not be retained" } };
      }
      const text = String(payload.text);
      const nextDraft = text === acceptedText ? undefined : text;
      const changed = retainedDraft !== nextDraft;
      retainedDraft = nextDraft;
      model = {
        ...model,
        text,
        dirty: nextDraft !== undefined,
        state: nextDraft === undefined ? "clean" : "dirty",
        draftVersion: model.draftVersion + Number(changed),
        selectionStart: Number(payload.selectionStart),
        selectionEnd: Number(payload.selectionEnd),
      };
      value = model;
    } else if (operation === "source.save") {
      saves += 1;
      acceptedText = retainedDraft ?? acceptedText;
      retainedDraft = undefined;
      model = { ...model, text: acceptedText, dirty: false, state: "clean", draftVersion: model.draftVersion + 1 };
      value = model;
    } else if (operation === "source.saveAll") {
      saveAlls += 1;
      acceptedText = retainedDraft ?? acceptedText;
      retainedDraft = undefined;
      model = { ...model, text: acceptedText, dirty: false, state: "clean", draftVersion: model.draftVersion + 1 };
      value = inventory();
    } else if (operation === "source.discardAll") {
      retainedDraft = undefined;
      model = { ...model, text: acceptedText, dirty: false, state: "clean", draftVersion: model.draftVersion + 1 };
      value = inventory();
    } else if (operation === "authoring.list") value = authoring;
    else if (operation === "scene.list") value = emptyScene;
    return { protocolVersion: 1, requestId: "test", ok: true, value: value as T };
  };

  const { startApplication } = await import("../src/main.js");
  startApplication(request);
  await ticks();
  click("Open Loomlight Project");
  await ticks();
  click("Source");
  await ticks();

  let editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  editor.value = editor.value.replace("Hello", "Shell-owned");
  editor.dispatchEvent(new window.Event("input", { bubbles: true }));
  editor.focus();
  const dirtyShortcut = saveEvent({ ctrl: true });
  editor.dispatchEvent(dirtyShortcut);
  await ticks(8);
  assert.equal(dirtyShortcut.defaultPrevented, true);
  assert.equal(saves, 1);
  assert.equal(flushes, 0);
  assert.match(acceptedText, /Shell-owned/);

  editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  for (const event of [
    saveEvent({ ctrl: true, shift: true }),
    saveEvent({ ctrl: true, alt: true }),
    saveEvent({ meta: true }),
  ]) editor.dispatchEvent(event);
  await ticks();
  assert.equal(saves, 1);
  assert.equal(flushes, 0);

  editor.dispatchEvent(saveEvent({ ctrl: true, composing: true }));
  editor.dispatchEvent(saveEvent({ ctrl: true, repeat: true }));
  await ticks();
  assert.equal(saves, 1);
  assert.equal(flushes, 0);

  Object.defineProperty(browser.navigator, "platform", { configurable: true, value: "MacIntel" });
  const cleanMacShortcut = saveEvent({ meta: true });
  editor.dispatchEvent(cleanMacShortcut);
  await ticks(6);
  assert.equal(cleanMacShortcut.defaultPrevented, true);
  assert.equal(saves, 1);
  assert.equal(flushes, 1);

  editor.value = acceptedText + "# Branch navigation draft\n";
  editor.selectionStart = 7; editor.selectionEnd = 9;
  editor.dispatchEvent(new window.Event("input", { bubbles: true }));
  const beforeBranchesSaves = saves;
  click("Branches"); await ticks();
  assert.ok(document.querySelector(".branches-viewport"));
  assert.equal(saves, beforeBranchesSaves);
  assert.equal(model.dirty, true);
  click("Source"); await ticks();
  editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  assert.equal(editor.value, model.text);
  assert.equal(editor.selectionStart, 7); assert.equal(editor.selectionEnd, 9);

  click("Variables");
  await ticks();
  const supportingInput = document.querySelector<HTMLInputElement>('input[data-technical-name="true"]')!;
  supportingInput.value = "unsubmitted_variable";
  supportingInput.dispatchEvent(new window.Event("input", { bubbles: true }));
  otherSourceDirty = true;
  const flushesBeforeCombinedCase = flushes;
  const savesBeforeCombinedCase = saves;
  const saveAllsBeforeCombinedCase = saveAlls;
  const supportingMutationsBefore = calls.filter((operation) => [
    "character.create", "character.update", "variable.create", "variable.update", "asset.import", "asset.repairCompatibility",
  ].includes(operation)).length;
  const nonSourceShortcut = saveEvent({ meta: true });
  window.dispatchEvent(nonSourceShortcut);
  await ticks(5);
  assert.equal(nonSourceShortcut.defaultPrevented, true);
  assert.equal(flushes, flushesBeforeCombinedCase + 1, JSON.stringify(calls.slice(-20)));
  assert.equal(saves, savesBeforeCombinedCase);
  assert.equal(saveAlls, saveAllsBeforeCombinedCase);
  assert.equal(calls.filter((operation) => [
    "character.create", "character.update", "variable.create", "variable.update", "asset.import", "asset.repairCompatibility",
  ].includes(operation)).length, supportingMutationsBefore);
  assert.equal(document.querySelector("#app-status")?.textContent, "Unsaved Source draft");
  assert.equal(supportingInput.value, "unsubmitted_variable");
  assert.equal(flushes, 2);
  assert.equal(saves, 1);

  click("Source");
  await ticks();
  assert.ok(document.querySelector('[aria-label="Unsubmitted changes"]'));
  click("Keep editing");
  assert.equal(supportingInput.value, "unsubmitted_variable");
  click("Source");
  await ticks();
  click("Discard and leave");
  await ticks();
  editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  editor.value = editor.value.replace("Shell-owned", "Remounted");
  editor.dispatchEvent(new window.Event("input", { bubbles: true }));
  editor.focus();
  editor.dispatchEvent(saveEvent({ meta: true }));
  await ticks(8);
  assert.equal(saves, 2);
  assert.equal(flushes, 2, JSON.stringify(calls.slice(-20)));

  editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  editor.value = editor.value.replace("Remounted", "Modal draft");
  editor.dispatchEvent(new window.Event("input", { bubbles: true }));
  await ticks();
  click("Close Project");
  await ticks();
  assert.ok(document.querySelector(".leave-source-dialog"));
  const savesBeforeModalShortcut = saves;
  const flushesBeforeModalShortcut = flushes;
  window.dispatchEvent(saveEvent({ meta: true }));
  await ticks();
  assert.equal(saves, savesBeforeModalShortcut);
  assert.equal(flushes, flushesBeforeModalShortcut);
  click("Cancel");
  assert.equal(closes, 0);
  assert.match(document.querySelector<HTMLTextAreaElement>(".source-editor")?.value ?? "", /Modal draft/);

  failNextRetention = true;
  editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  editor.value = editor.value.replace("Modal draft", "Unretained close");
  editor.dispatchEvent(new window.Event("input", { bubbles: true }));
  await ticks();
  click("Close Project");
  await ticks();
  assert.equal(document.querySelector(".leave-source-dialog"), null);
  assert.equal(closes, 0);
  assert.match(document.querySelector<HTMLTextAreaElement>(".source-editor")?.value ?? "", /Unretained close/);
  assert.match(document.querySelector("#app-status")?.textContent ?? "", /could not be retained/);
});

test("Story Save takes one route from toolbar and keyboard, and a refusal never flushes or reports Saved", async () => {
  Object.defineProperty(browser.navigator, "platform", { configurable: true, value: "Win32" });
  const project = {
    sessionId: "story-save-session", projectId: "story-save-project", title: "Story Save", folderName: "story-save",
    chapterId: "chapter", chapterName: "Chapter", sceneId: "scene", sceneName: "Scene",
    sdkVersion: "8.5.3", resolution: { width: 1280, height: 720 },
  };
  let accepted = "Hello", revision = 3;
  const workspace = () => ({
    projectRevision: "1".repeat(64), sourceMapRevision: String(revision).repeat(64), entrySceneId: "scene",
    lastOpen: { chapterId: "chapter", sceneId: "scene" },
    chapters: [{ id: "chapter", displayName: "Chapter", directory: "game" }],
    scenes: [{ id: "scene", chapterId: "chapter", displayName: "Scene", technicalLabel: "scene", sourcePath: "game/scene.rpy", sourceRevision: String(revision).repeat(64), sourceConflict: false, partial: false,
      ...(beats => ({ beats, bodies: sceneBodies(beats) }))([{ id: "line", byteStart: 15, byteEnd: 30, protected: false, payload: { type: "narration" as const, text: accepted } }]) }],
    authoring: { characters: [], appearances: [], assets: [], variables: [] },
  });
  const sent: { commands: { beat: { text: string } }[] }[] = [];
  let flushes = 0;
  let refusal: { code: string; message: string; actionIndex: number } | undefined;
  const request = async <T>(operation: CoreOperation, payload: Readonly<Record<string, unknown>> = {}): Promise<CoreResponse<T>> => {
    let value: unknown = {};
    if (operation === "project.listRecent") value = [];
    else if (operation === "project.openPicker") value = project;
    else if (operation === "project.status") value = "saved";
    else if (operation === "project.flush") { flushes += 1; value = null; }
    else if (operation === "source.list") value = { files: [], dirtyCount: 0, draftBytes: 0 };
    else if (operation === "scene.list") value = workspace();
    else if (operation === "scene.saveDrafts") {
      sent.push(payload as unknown as (typeof sent)[number]);
      if (refusal) return { protocolVersion: 1, requestId: "test", ok: false, error: refusal };
      accepted = sent.at(-1)!.commands[0]!.beat.text; revision += 1; value = workspace();
    }
    return { protocolVersion: 1, requestId: "test", ok: true, value: value as T };
  };
  const status = (): string => document.querySelector("#app-status")?.textContent ?? "";
  const draft = async (text: string): Promise<HTMLTextAreaElement> => {
    if (!document.querySelector('.story-editor[data-editor-for="line"] textarea')) document.querySelector<HTMLButtonElement>('.story-track-column[data-beat-id="line"] > .story-track-beat')!.click();
    const editor = document.querySelector<HTMLTextAreaElement>('.story-editor[data-editor-for="line"] textarea')!;
    editor.value = text; editor.dispatchEvent(new window.Event("input", { bubbles: true })); await ticks();
    return editor;
  };

  const { startApplication } = await import("../src/main.js");
  startApplication(request);
  await ticks(); click("Open Loomlight Project"); await ticks(8);

  await draft("From toolbar"); click("Save"); await ticks(10);
  assert.equal(sent.length, 1); assert.equal(accepted, "From toolbar"); assert.equal(status(), "Saved");
  await draft("From keyboard"); window.dispatchEvent(saveEvent({ ctrl: true })); await ticks(10);
  assert.equal(sent.length, 2); assert.equal(accepted, "From keyboard"); assert.equal(status(), "Saved");
  assert.equal(flushes, 0, "a Story Save never runs Flush afterwards");

  // Core refuses the draft at index 0. Neither origin falls through to Flush or reports Saved.
  refusal = { code: "INVALID_PAYLOAD", message: "The Scene operation is invalid.", actionIndex: 0 };
  let editor = await draft("Refused draft");
  click("Save"); await ticks(10);
  window.dispatchEvent(saveEvent({ ctrl: true })); await ticks(10);
  assert.equal(sent.length, 4); assert.equal(flushes, 0); assert.equal(accepted, "From keyboard");
  assert.equal(status(), "Nothing saved. 1 of 1 draft needs changes:Scene 1");
  editor = document.querySelector<HTMLTextAreaElement>('.story-editor[data-editor-for="line"] textarea')!;
  assert.equal(editor.value, "Refused draft"); assert.equal(editor.closest<HTMLElement>("[data-beat-draft-key]")?.dataset.saveRefused, "true");

  // A stale refusal refreshes Story. A draft whose own beat changed in source is then a conflict.
  refusal = { code: "SOURCE_CONFLICT", message: "The Scene source changed outside Loomlight. Reload before editing.", actionIndex: 0 };
  accepted = "Edited elsewhere"; revision += 1;
  click("Save"); await ticks(10);
  assert.equal(sent.length, 5); assert.equal(flushes, 0);
  assert.equal(status(), "Story changed in source and was refreshed. Nothing saved. 1 of 1 draft needs changes:Scene 1");
  assert.equal(document.querySelector('.story-editor[data-editor-for="line"] .story-conflict-source')?.textContent, "Edited elsewhere");
  assert.equal(document.querySelector<HTMLTextAreaElement>('.story-editor[data-editor-for="line"] textarea')?.value, "Refused draft");

  // With no beat drafts, Save in Story still runs Flush.
  click("Discard draft"); await ticks();
  click("Save"); await ticks(10);
  assert.equal(flushes, 1); assert.equal(sent.length, 5);
});

test("A refused Story Save counts failing drafts, links each scene and marks failures until they are fixed", async () => {
  Object.defineProperty(browser.navigator, "platform", { configurable: true, value: "Win32" });
  const project = {
    sessionId: "story-refusal-session", projectId: "story-refusal-project", title: "Story refusal", folderName: "story-refusal",
    chapterId: "chapter", chapterName: "Chapter", sceneId: "arrival", sceneName: "Arrival",
    sdkVersion: "8.5.3", resolution: { width: 1280, height: 720 },
  };
  // Dialogue by "ghost", a character no longer in the project, cannot be saved until the author picks a speaker.
  const texts: Record<string, string> = { n1: "Hello", g1: "Who?", g2: "Me.", n2: "Steam.", g3: "Late." };
  let revision = 3;
  const beat = (id: string, offset: number) => ({ id, byteStart: offset, byteEnd: offset + 10, protected: false,
    payload: id.startsWith("g") ? { type: "dialogue", characterId: "ghost", text: texts[id] } : { type: "narration", text: texts[id] } });
  const scene = (id: string, displayName: string, ids: string[]) => ({ id, chapterId: "chapter", displayName, technicalLabel: id, sourcePath: `game/${id}.rpy`,
    sourceRevision: String(revision).repeat(64), sourceConflict: false, partial: false, ...(beats => ({ beats, bodies: sceneBodies(beats as SceneBeat[]) }))(ids.map((item, index) => beat(item, 20 + index * 10))) });
  const workspace = () => ({
    projectRevision: "1".repeat(64), sourceMapRevision: String(revision).repeat(64), entrySceneId: "arrival",
    lastOpen: { chapterId: "chapter", sceneId: "arrival" },
    chapters: [{ id: "chapter", displayName: "Chapter", directory: "game" }],
    scenes: [scene("arrival", "Arrival", ["n1", "g1", "g2"]), scene("depot", "Depot", ["n2", "g3"])],
    authoring: { characters: [{ id: "mara", displayName: "Mara", technicalName: "mara" }], appearances: [], assets: [], variables: [] },
  });
  const sent: { commands: { type: string }[] }[] = [];
  let refusal: { code: string; message: string; actionIndex: number } | undefined;
  const request = async <T>(operation: CoreOperation, payload: Readonly<Record<string, unknown>> = {}): Promise<CoreResponse<T>> => {
    let value: unknown = {};
    if (operation === "project.listRecent") value = [];
    else if (operation === "project.openPicker") value = project;
    else if (operation === "project.status") value = "saved";
    else if (operation === "source.list") value = { files: [], dirtyCount: 0, draftBytes: 0 };
    else if (operation === "scene.list") value = workspace();
    else if (operation === "scene.saveDrafts") {
      sent.push(payload as unknown as (typeof sent)[number]);
      if (refusal) return { protocolVersion: 1, requestId: "test", ok: false, error: refusal };
      revision += 1; value = workspace();
    }
    return { protocolVersion: 1, requestId: "test", ok: true, value: value as T };
  };
  const status = (): string => document.querySelector("#app-status")?.textContent ?? "";
  const links = (): string[] => [...document.querySelectorAll<HTMLButtonElement>("#app-status .status-link")].map(link => link.getAttribute("aria-label") ?? "");
  const card = (id: string): HTMLElement => document.querySelector<HTMLElement>(`.story-track-column[data-beat-id="${id}"]`)!;
  const editorFor = (id: string): HTMLElement | null => document.querySelector<HTMLElement>(`.story-editor[data-editor-for="${id}"]`);
  const open = async (id: string): Promise<HTMLElement> => { if (!editorFor(id)) { card(id).querySelector<HTMLButtonElement>(".story-track-beat")!.click(); await ticks(); } return editorFor(id)!; };
  const failing = (): string[] => [...document.querySelectorAll<HTMLElement>('.story-track-column[data-save-refused="true"]')].map(item => item.dataset.beatId!);
  const sceneRow = (name: string): HTMLElement => [...document.querySelectorAll<HTMLElement>(".tree-scene-row")].find(row => row.querySelector(".tree-scene-open")?.textContent === name)!;
  const shown = (): string | undefined => document.querySelector<HTMLElement>(".tree-scene-row.selected .tree-scene-open")?.textContent ?? undefined;
  const openScene = async (name: string): Promise<void> => { sceneRow(name).querySelector<HTMLButtonElement>(".tree-scene-open")!.click(); await ticks(); };
  const draft = async (id: string, text: string): Promise<void> => {
    const editor = (await open(id)).querySelector<HTMLTextAreaElement>("textarea")!;
    editor.value = text; editor.dispatchEvent(new window.Event("input", { bubbles: true })); await ticks();
  };
  const pickSpeaker = async (id: string): Promise<void> => {
    const speaker = (await open(id)).querySelector<HTMLSelectElement>("select")!;
    speaker.value = "mara"; speaker.dispatchEvent(new window.Event("change", { bubbles: true })); await ticks();
  };

  const { startApplication } = await import("../src/main.js");
  startApplication(request);
  await ticks(); click("Open Loomlight Project"); await ticks(8);

  // Five drafts across two scenes, begun out of project order. Three keep the missing speaker.
  await openScene("Depot"); await draft("n2", "Steam rises."); await draft("g3", "You are late.");
  await openScene("Arrival"); await draft("n1", "Hello again"); await draft("g2", "Only me."); await draft("g1", "Who is there?");
  // Before any Save, drafts show * and the header counts them; at 560 px it reads "5 unsaved".
  const header = (): HTMLElement => document.querySelector<HTMLElement>("#app-status")!, mirror = (): string => document.querySelector("#app-refusal")?.textContent ?? "";
  const state = (id: string): string | undefined => editorFor(id)?.querySelector<HTMLElement>(".story-editor-state")?.textContent ?? undefined;
  const legendFails = (): boolean => !document.querySelector<HTMLElement>(".story-legend-fail")!.hidden;
  assert.equal(status(), "5 unsaved beat drafts"); assert.equal(header().dataset.short, "5 unsaved");
  assert.equal(state("g1"), "* Draft"); assert.equal(failing().length, 0, "marks appear only after a refused Save"); assert.equal(legendFails(), false);
  await openScene("Depot");
  click("Save"); await ticks(10);
  // The header bolds "Nothing saved." and shows only that at 560 px; the bottom status bar then holds the full line.
  assert.equal(header().querySelector("b")?.textContent, "Nothing saved."); assert.equal(header().dataset.short, "Nothing saved");
  assert.equal(mirror(), "Nothing saved. 3 of 5 drafts need changes:Arrival 2Depot 1");
  assert.equal(state("g1"), "! Needs changes"); assert.equal(legendFails(), true);
  assert.equal(card("g1").querySelector(".story-track-beat")?.getAttribute("title"), "Select an available item first.", "the tooltip gives the reason");
  assert.equal(sent.length, 0, "a failing draft stops Story Save before any request");
  assert.equal(status(), "Nothing saved. 3 of 5 drafts need changes:Arrival 2Depot 1");
  assert.deepEqual(links(), ["Arrival, 2 to fix", "Depot, 1 to fix"]);
  // Save opens the first failing draft in project order, in its own scene, and shows why it failed.
  assert.equal(shown(), "Arrival");
  assert.ok(editorFor("g1")?.contains(document.activeElement), "Save reveals Arrival's first failing beat");
  assert.deepEqual(failing(), ["g1", "g2"]);
  assert.equal(card("n1").dataset.saveRefused, undefined, "a ready draft keeps the plain draft mark");
  assert.equal(card("n1").dataset.beatDraft, "true");
  assert.equal(card("g1").querySelector(".story-track-beat")?.getAttribute("aria-description"), "Unsaved draft. Needs changes.");
  assert.equal(editorFor("g1")?.querySelector(".story-save-reason")?.textContent, "Select an available item first.");
  assert.deepEqual([sceneRow("Arrival").dataset.saveRefused, sceneRow("Depot").dataset.saveRefused], ["true", "true"]);
  // Reel shows the same marks and puts the reason under the failing beat's text (header-v2).
  const view = (name: string): void => { document.querySelector<HTMLButtonElement>(`.story-view-option[data-view="${name}"]`)!.click(); };
  const reason = (id: string): HTMLElement => card(id).querySelector<HTMLElement>(".story-reel-reason")!;
  view("reel");
  assert.ok(document.querySelector(".story-reel")); assert.equal(document.querySelector(".story-track-key"), null, "Reel has no lanes and no Key");
  assert.deepEqual(failing(), ["g1", "g2"]); assert.equal(legendFails(), true);
  assert.equal(reason("g1").textContent, "Select an available item first."); assert.equal(reason("g1").hidden, false);
  assert.equal(card("n1").dataset.beatDraft, "true"); assert.equal(reason("n1").hidden, true);
  assert.equal(editorFor("g1")?.querySelector(".story-save-reason")?.textContent, "Select an available item first.", "the editor stays as it was");
  view("tracks");

  // A scene link opens that scene's failing draft.
  document.querySelectorAll<HTMLButtonElement>("#app-status .status-link")[1]!.click(); await ticks();
  assert.equal(shown(), "Depot"); assert.deepEqual(failing(), ["g3"]);
  assert.ok(editorFor("g3")?.querySelector("textarea"), "the link opens the failing draft's editor");

  // Fixing a draft clears its mark and its scene's link. Cancelling one lowers both counts.
  await pickSpeaker("g3");
  assert.deepEqual(failing(), []); assert.equal(sceneRow("Depot").dataset.saveRefused, undefined);
  assert.equal(editorFor("g3")?.querySelector(".story-save-reason"), null);
  assert.equal(status(), "Nothing saved. 2 of 5 drafts need changes:Arrival 2");
  await openScene("Arrival");
  [...(await open("g1")).querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent === "Cancel")!.click(); await ticks(6);
  assert.equal(status(), "Nothing saved. 1 of 4 drafts needs changes:Arrival 1");
  assert.deepEqual(failing(), ["g2"]);
  await pickSpeaker("g2");
  assert.equal(status(), "4 unsaved beat drafts. Ready to save.");assert.equal(header().dataset.short, "4 unsaved");assert.equal(mirror(), "");assert.equal(legendFails(), false);
  assert.deepEqual(failing(), []); assert.equal(sceneRow("Arrival").dataset.saveRefused, undefined);

  // A new beat whose place is gone from core's candidate is a beat draft conflict, marked like the others.
  click("+ Add beat"); await ticks();
  const added = document.querySelector<HTMLElement>(".new-beat")!;
  const text = added.querySelector<HTMLTextAreaElement>("textarea")!;
  text.value = "A new line."; text.dispatchEvent(new window.Event("input", { bubbles: true })); await ticks();
  refusal = { code: "BEAT_DRAFT_CONFLICT", message: "This beat's place changed in source after the draft began. Draft retained.", actionIndex: 4 };
  click("Save"); await ticks(10);
  assert.equal(sent.length, 1); assert.equal(sent[0]!.commands[4]!.type, "insertBodyBeat");
  assert.equal(status(), "Nothing saved. 1 of 5 drafts needs changes:Arrival 1");
  assert.equal(added.dataset.saveRefused, "true");
  assert.equal(added.querySelector(".story-save-reason")?.textContent, "This beat's place changed in source after the draft began. Draft retained.");

  // A later Save that succeeds clears every mark and the refusal status.
  refusal = undefined;
  click("Save"); await ticks(10);
  assert.equal(sent.length, 2); assert.equal(status(), "Saved");
  assert.deepEqual(failing(), []); assert.equal(links().length, 0);
  assert.equal(document.querySelector('[data-save-refused="true"]'), null);

  // A draft whose beat then changes in source shows "Conflict with source" under its text in Reel.
  await openScene("Arrival"); await draft("n1", "Hello once more");
  texts.n1 = "Hello from source"; click("Source"); await ticks(8); click("Story"); await ticks(8);
  view("reel");
  assert.equal(card("n1").dataset.beatConflict, "true"); assert.equal(card("n1").dataset.saveRefused, undefined);
  assert.equal(reason("n1").textContent, "Conflict with source"); assert.equal(reason("n1").hidden, false);
});
