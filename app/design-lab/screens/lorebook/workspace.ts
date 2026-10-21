import type { LabContext } from "../../contracts.ts";
import { action, element as el, labPage } from "../../page.ts";
import { fixture, retainedEntries, type Notes } from "./fixture.ts";
import "./styles.css";

type Field = keyof Notes;
const fields = [
  ["world", "World & starting situation", "Describe the setting, world rules and situation when the story begins."],
  ["tone", "Tone & writing style", "Describe the mood, pacing, dialogue and prose style. Character cards guide each person's voice."],
] as const;

export function mountLorebook(host: HTMLElement, context: LabContext, variant: "manuscript" | "parallel") {
  const sample = fixture(context.state);
  let saved = structuredClone(sample.notes), draft = structuredClone(saved), versions = sample.versions;
  let undo: Notes[] = [], redo: Notes[] = [], busy = false, disposed = false, refuseNextSave = context.state === "error";
  const dirty = () => JSON.stringify(saved) !== JSON.stringify(draft);
  const page = labPage(host, context, { screen: "lorebook", title: "Lorebook", subtitle: "World and tone for this project", dirty });
  page.shell.classList.add("lb-shell", `lb-${variant}`);
  page.content.classList.add("lb-content");

  const historyButton = action("Version history", showHistory);
  const more = el("details", "lb-more");
  const moreSummary = el("summary", "button", "More"); moreSummary.ariaLabel = "More Lorebook actions";
  const moreMenu = el("div", "lb-more-menu");
  const undoButton = action("Undo", () => { if (!dirty() && undo.length) { redo.push(saved); saved = undo.pop()!; draft = structuredClone(saved); draw(); feedback("Previous saved notes restored in this sample."); more.open = false; moreSummary.focus(); } });
  const redoButton = action("Redo", () => { if (!dirty() && redo.length) { undo.push(saved); saved = redo.pop()!; draft = structuredClone(saved); draw(); feedback("Saved change reapplied in this sample."); more.open = false; moreSummary.focus(); } });
  const reloadButton = action("Reload Lorebook", () => { feedback(dirty() ? "Sample reloaded. Your unsaved draft is retained." : "Sample reloaded. Saved notes are current."); more.open = false; moreSummary.focus(); });
  const retainedButton = action("Saved reference entries", () => { more.open = false; moreSummary.focus(); showRetained(); });
  moreMenu.append(undoButton, redoButton, reloadButton, retainedButton); more.append(moreSummary, moreMenu);
  more.addEventListener("keydown", event => { if (event.key === "Escape") { more.open = false; moreSummary.focus(); } });
  page.tools.append(historyButton, more);

  const intro = el("section", "lb-intro");
  const introCopy = el("div", "lb-intro-copy");
  introCopy.append(el("span", "lb-eyebrow", "Project-wide reference"), el("p", "", "One shared world. A consistent way to tell its story."), el("p", "lb-boundary", "Saving sends nothing. Review these notes in the AI request before sending."));
  const requestButton = action("Preview request context", showRequest); requestButton.classList.add("lb-request-button");
  intro.append(introCopy, requestButton);
  const notice = el("p", "lb-notice"); notice.role = "status"; notice.hidden = true;
  const body = el("div", "lb-body"); body.ariaLabel = "Lorebook writing"; body.tabIndex = -1;
  const document = el("div", "lb-document");
  const inputs = new Map<Field, HTMLTextAreaElement>(), errors = new Map<Field, HTMLElement>();
  fields.forEach(([key, title, help], index) => {
    const section = el("section", `lb-section lb-${key}`);
    const label = el("label", "lb-field-label"); label.htmlFor = `lb-${key}`;
    label.append(el("span", "lb-section-number", `0${index + 1}`), el("span", "", title));
    const input = el("textarea", "lb-writing"); input.id = `lb-${key}`; input.name = key; input.ariaLabel = title; input.rows = key === "world" ? 7 : 6; input.value = draft[key];
    input.placeholder = key === "world" ? "Where does the story begin? What is already true?" : "What should the writing sound like?";
    const helper = el("p", "lb-help", help); helper.id = `lb-${key}-help`;
    const error = el("p", "lb-field-error"); error.id = `lb-${key}-error`; error.hidden = true;
    input.setAttribute("aria-describedby", `${helper.id} ${error.id}`);
    const count = el("span", "lb-word-count"); count.dataset.words = key; count.ariaHidden = "true";
    input.oninput = () => { draft[key] = input.value; grow(input); if (!error.hidden) validate(key); synchronize(); };
    input.onblur = () => validate(key);
    inputs.set(key, input); errors.set(key, error);
    section.append(label, input, helper, error, count); document.append(section);
  });
  const note = el("p", "lb-perspective", "World facts do not mean every character knows them. Keep each person's starting knowledge on their character card.");
  body.append(document, note);
  const footer = el("div", "lb-save-row");
  const state = el("span", "lb-save-state", "Saved in sample");
  const discard = action("Discard changes", confirmDiscard), save = action("Save changes", () => { void saveDraft(); }, true);
  footer.append(state, discard, save);
  page.content.append(intro, notice, body, footer);

  function grow(input: HTMLTextAreaElement) { input.style.height = "auto"; input.style.height = `${Math.max(input.scrollHeight, variant === "parallel" && innerWidth >= 900 ? 270 : 120)}px`; }
  function feedback(message: string, error = false) { notice.hidden = false; notice.textContent = message; notice.dataset.error = String(error); page.status.textContent = message; }
  function validate(key: Field) {
    const message = new TextEncoder().encode(draft[key]).length > 10_000 ? "Use at most 10,000 UTF-8 bytes for this field. Your draft is retained." : "";
    const error = errors.get(key)!; error.textContent = message; error.hidden = !message;
    inputs.get(key)!.ariaInvalid = String(!!message); return !message;
  }
  function synchronize() {
    state.textContent = busy ? "Saving in sample…" : dirty() ? "Unsaved changes" : "Saved in sample";
    page.shell.dataset.dirty = String(dirty()); page.shell.dataset.busy = String(busy);
    save.disabled = discard.disabled = busy || !dirty(); historyButton.disabled = busy;
    requestButton.disabled = reloadButton.disabled = retainedButton.disabled = busy;
    if (busy) more.open = false;
    moreSummary.inert = busy;
    undoButton.disabled = busy || dirty() || !undo.length; redoButton.disabled = busy || dirty() || !redo.length;
    inputs.forEach((input, key) => { input.disabled = busy; const count = document.querySelector<HTMLElement>(`[data-words="${key}"]`)!; const words = draft[key].trim().split(/\s+/).filter(Boolean).length; count.textContent = `${words} ${words === 1 ? "word" : "words"}`; });
  }
  function draw() { inputs.forEach((input, key) => { input.value = draft[key]; input.ariaInvalid = "false"; errors.get(key)!.hidden = true; grow(input); }); synchronize(); }
  async function saveDraft() {
    if (busy || !dirty()) return;
    const invalid = fields.find(([key]) => !validate(key));
    if (invalid) { feedback("Correct the marked field before saving. Your draft is retained.", true); inputs.get(invalid[0])!.focus(); return; }
    busy = true; synchronize(); await new Promise(resolve => setTimeout(resolve, 300));
    if (disposed) return;
    if (refuseNextSave) { refuseNextSave = false; busy = false; synchronize(); feedback("Simulated save failure. Your draft is retained. Try Save changes again.", true); return; }
    undo.push(structuredClone(saved)); redo = []; saved = structuredClone(draft);
    versions.push({ number: (versions.at(-1)?.number ?? 0) + 1, date: "Just now · browser sample", notes: structuredClone(saved) });
    busy = false; synchronize(); feedback("Saved in sample. Nothing was sent.");
  }
  function dialog(title: string, closeLabel = "Close") {
    const invoker = globalThis.document.activeElement as HTMLElement | null;
    const modal = el("dialog", "lp-dialog lb-dialog"); modal.ariaLabel = title;
    const header = el("div", "lb-dialog-heading"); header.append(el("h2", "", title));
    const close = action(closeLabel, () => modal.close()); header.append(close); modal.append(header);
    modal.onclose = () => {
      modal.remove();
      if (modal.dataset.focusWorld === "true") inputs.get("world")!.focus();
      else if (invoker?.isConnected && invoker.getClientRects().length) invoker.focus();
      else moreSummary.focus();
    };
    page.shell.append(modal); modal.showModal(); return modal;
  }
  function confirmDiscard() {
    const modal = dialog("Discard Lorebook draft?", "Keep editing");
    modal.append(el("p", "", "Both fields will return to the last saved notes. Your saved versions stay available."));
    modal.append(action("Discard draft", () => { draft = structuredClone(saved); draw(); modal.dataset.focusWorld = "true"; modal.close(); feedback("Returned to saved notes."); }));
  }
  function showHistory() {
    const modal = dialog("Lorebook version history", "Close version history");
    modal.append(el("p", "muted", "Saved world and tone notes. Reviewing a version keeps your current draft. History is read-only in this prototype."));
    const list = el("div", "lb-versions");
    if (!versions.length) list.append(el("p", "lb-empty-history", "No saved versions yet. Save your first notes to start this project's history."));
    [...versions].reverse().forEach((version, index) => {
      const item = el("details", "lb-version"); item.open = index === 0;
      const current = JSON.stringify(version.notes) === JSON.stringify(saved);
      item.append(el("summary", "", `Version ${version.number}${current ? " · Current" : ""} · ${version.date}`));
      fields.forEach(([key, title]) => item.append(el("h3", "", title), el("p", "lb-review-prose", version.notes[key] || "No notes in this version.")));
      list.append(item);
    }); modal.append(list);
  }
  function showRetained() {
    const modal = dialog("Saved reference entries", "Close saved reference entries");
    modal.append(el("p", "muted", "Earlier saved entries remain separate from the project-wide notes. This review is read-only. No entry is merged, deleted or migrated."));
    retainedEntries.forEach(entry => {
      const item = el("section", "lb-retained");
      item.append(el("h3", "", entry.title), el("p", "lb-reference-state", `${entry.revision} · ${entry.status}`), el("p", "lb-review-prose", entry.text));
      const details = el("details"); details.append(el("summary", "", "Approval and source check"), el("p", "", entry.detail), el("p", "muted", `Retained entry ID: ${entry.id}. Links, citations and saved revisions stay with the entry.`));
      item.append(details); modal.append(item);
    });
    modal.append(el("p", "lb-request-note", "An entry needs an explicitly approved revision and current supporting material before an AI request may include it. Saving global notes does not approve a saved entry."));
  }
  function showRequest() {
    const modal = dialog("Request context preview", "Close request context preview");
    modal.append(el("p", "lb-request-note", "Illustrative request only. This page does not start a writing operation or send a request. Real requests start in Story or Studio and require an explicit Send."));
    if (dirty()) modal.append(el("p", "lb-preview-warning", "You have unsaved notes. This preview uses the last saved version; your draft is retained."));
    const checkbox = el("input"); checkbox.type = "checkbox"; checkbox.checked = true; checkbox.id = "lb-include";
    const label = el("label", "lb-include"); label.htmlFor = checkbox.id; label.append(checkbox, el("span", "", "Include project Lorebook in this request"));
    const contextBox = el("section", "lb-request-context");
    const tokenNote = el("p", "lb-token-note");
    const update = () => {
      contextBox.replaceChildren();
      if (checkbox.checked) {
        fields.forEach(([key, title]) => contextBox.append(el("h3", "", title), el("p", "lb-review-prose", saved[key] || "No saved notes.")));
        tokenNote.textContent = `About ${Math.ceil((saved.world.length + saved.tone.length) / 4)} tokens from saved Lorebook notes. This rough sample estimate excludes other request content. Actual model limits and the full request budget belong in the request preview.`;
      } else { contextBox.append(el("p", "", "Project Lorebook omitted for this request. Your saved notes and current draft are unchanged.")); tokenNote.textContent = "0 Lorebook tokens for this sample request."; }
      contextBox.dataset.included = String(checkbox.checked);
    };
    checkbox.onchange = update; update(); modal.append(label, tokenNote, contextBox, el("p", "muted", "The Lorebook guides overall style. Character cards still guide each person's voice and starting knowledge. No connection test uses these notes."));
  }
  const resize = () => inputs.forEach(grow); window.addEventListener("resize", resize);
  draw(); requestAnimationFrame(() => { if (!disposed) inputs.forEach(grow); });
  if (context.state === "error") feedback("This sample refuses the next Save. Your draft will stay available for retry.", true);
  return () => { disposed = true; window.removeEventListener("resize", resize); };
}
