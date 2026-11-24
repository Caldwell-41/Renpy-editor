// Story mounted in a happy-dom document, for DOM tests. Browser fixtures load
// story-controls-fixture.ts in Chromium, so happy-dom stays out of that file.
import { Window } from "happy-dom";
import type { SceneActions, SceneCommand, SceneWorkspace } from "../src/scene-ui.ts";
import { renderStoryView } from "./story-controls-fixture.ts";

/** Story over `model` in a fresh document, recording each command it sends and each status line. */
export function mountStory(model: SceneWorkspace, extra: Partial<SceneActions> = {}) {
  const browser = new Window(); Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, HTMLInputElement: browser.HTMLInputElement, HTMLTextAreaElement: browser.HTMLTextAreaElement, HTMLSelectElement: browser.HTMLSelectElement, Event: browser.Event, KeyboardEvent: browser.KeyboardEvent });
  document.body.innerHTML = "<main></main><aside></aside>";
  const host = document.querySelector<HTMLElement>("main")!, calls: SceneCommand[] = [], status: string[] = [];
  const view = renderStoryView(host, document.querySelector("aside")!, model, { apply: async command => { calls.push(command); return model; }, status: text => status.push(text), resolution: { width: 1280, height: 720 }, present: async () => { throw Error("No media"); }, viewSource: () => {}, ...extra });
  return { host, calls, status, view, close: async () => { view.dispose(); await browser.happyDOM.close(); } };
}
