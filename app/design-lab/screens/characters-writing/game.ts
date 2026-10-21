import type { LabContext } from "../../contracts.ts";
import { clone, type Appearance, type Character, type GameIdentity } from "./fixture.ts";

type Options = {
  host: HTMLElement; context: LabContext; current: () => Character; characters: () => Character[];
  writingDirty: () => boolean; checkpoint: () => void; refresh: () => void; changed: () => void;
  modal: (title: string) => HTMLDialogElement; announce: (text: string) => void;
};
function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text = ""): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag); n.className = className; n.textContent = text; return n;
}
function button(label: string, callback: () => void, primary = false) {
  const b = el("button", `button${primary ? " primary" : ""}`, label); b.type = "button"; b.onclick = callback; return b;
}
function label(title: string, input: HTMLInputElement | HTMLSelectElement, help: string) {
  input.ariaLabel = title; const wrap = el("label", "cw-field");
  const note = el("p", "cw-field-help muted", help); note.id = `game-help-${input.name}`; input.setAttribute("aria-describedby", note.id);
  wrap.append(el("span", "cw-field-title", title), input, note); return wrap;
}
function art(appearance?: Appearance) {
  const box = el("div", `cw-portrait cw-look-${appearance?.art ?? "empty"}`); box.ariaLabel = appearance ? `Fictional ${appearance.expression} appearance` : "No appearance added";
  if (appearance) {
    const hair = el("span", "cw-art-hair"), head = el("span", "cw-art-head"), coat = el("span", "cw-art-coat"), scarf = el("span", "cw-art-scarf");
    box.append(coat, hair, head, scarf);
  } else box.append(el("span", "muted", "No image yet"));
  return box;
}
export function gameWorkspace(o: Options) {
  const drafts = new Map<string, GameIdentity>();
  const baselines = new Map<string, string>();
  const previews = new Map<string, string>();
  const feedback = new Map<string, { text: string; error: boolean }>();
  let serial = 0;
  const current = () => o.current();
  function draft() {
    const c = current(); let d = drafts.get(c.id);
    if (!d) {
      d = clone(c.game ?? { id: `game-${c.id}`, technicalName: "", displayName: c.saved.title, colour: "#c5c8d0", appearances: [], defaultId: "", revision: 0 });
      drafts.set(c.id, d); baselines.set(c.id, JSON.stringify(d));
    }
    return d;
  }
  function currentDirty() {
    const c = current(), d = drafts.get(c.id);
    if (!d) return false;
    return JSON.stringify(d) !== baselines.get(c.id);
  }
  function dirty() { return [...drafts].some(([id, d]) => JSON.stringify(d) !== baselines.get(id)); }

  function say(text: string, error = false) { feedback.set(current().id, { text, error }); render(); o.changed(); }
  function changed() { feedback.delete(current().id); o.host.querySelector(".cw-game-error,.cw-game-success")?.remove(); o.changed(); }
  function source(d: GameIdentity) { return `define ${d.technicalName} = Character(${JSON.stringify(d.displayName)}, color=${JSON.stringify(d.colour)})`; }
  function validation(d: GameIdentity, creating = false) {
    if (!d.displayName.trim()) return { field: "gameDisplayName", text: "Enter a display name. Your game setup draft is retained." };
    if (creating && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(d.technicalName)) return { field: "gameTechnicalName", text: "Use a Ren'Py name with letters, numbers and underscores, starting with a letter or underscore." };
    if (creating && o.characters().some(c => c.game?.technicalName === d.technicalName)) return { field: "gameTechnicalName", text: "That Ren'Py name is already in use. Choose another name." };
    return null;
  }
  function validate(d: GameIdentity, creating = false) {
    const error = validation(d, creating); if (!error) return true;
    say(error.text, true); const n = o.host.querySelector<HTMLInputElement>(`[name="${error.field}"]`); n?.setAttribute("aria-invalid", "true"); n?.focus(); return false;
  }
  function commit(d: GameIdentity, text: string) {
    if (o.context.state === "save-error") { say("Simulated game setup save failure. Your changes are retained; retry or discard them.", true); return false; }
    o.checkpoint(); const c = current(); c.game = clone(d); c.game.revision++; c.inGame = true;
    drafts.delete(c.id); baselines.delete(c.id); feedback.set(c.id, { text, error: false }); o.refresh(); o.announce(text); return true;
  }
  function review(creating: boolean, linked?: Character) {
    if (o.writingDirty()) { say("Save or discard this character's writing changes before creating or linking a game character. Writing never applies to game definitions.", true); return; }
    const d = linked?.game ?? draft(); if (!validate(d, creating)) return;
    const captured = JSON.stringify(d), revision = linked?.game?.revision;
    const dialog = o.modal(creating ? "Review game character source" : "Review character link");
    dialog.append(el("p", "", creating ? "Review this fictional definition before creating the game character. No project file will change." : `Link this writing card to ${d.displayName} by saved identity. Names do not merge characters. No source definition will change.`));
    const details = el("div", "cw-source-review"); details.append(el("h3", "", creating ? "Proposed source · game/characters.rpy" : "Existing source · game/characters.rpy"), el("pre", "", source(d)), el("p", "muted", `Saved identity: ${d.id} · source revision ${d.revision}`)); dialog.append(details);
    const notice = el("p", "cw-game-error"); notice.role = "alert"; dialog.append(notice);
    const actions = el("div", "cw-dialog-actions");
    actions.append(button("Back to setup", () => dialog.close()), button(creating ? "Create game character in sample" : "Link character in sample", () => {
      if (o.writingDirty() || JSON.stringify(linked?.game ?? draft()) !== captured || (linked && linked.game?.revision !== revision)) { notice.textContent = "The preview has changed. Close this review and review the current details again."; return; }
      if (o.context.state === "save-error") { notice.textContent = "Simulated apply failure. No association changed. Your setup draft is retained."; return; }
      dialog.close(); commit(d, creating ? "Created the fictional game character after source review." : "Linked the writing card to the selected saved game identity.");
    }, true)); dialog.append(actions); dialog.showModal();
  }
  function editAppearance(existing?: Appearance) {
    const dialog = o.modal(existing ? "Edit appearance" : "Add appearance");
    dialog.append(el("p", "muted", "Use a fictional sample image. This chooser never opens files or a native picker."));
    const expression = el("input"); expression.name = "appearanceExpression"; expression.value = existing?.expression ?? "";
    const image = el("select"); image.name = "appearanceImage";
    for (const [value, text] of [["coat", "Rain coat · fictional sample"], ["scarf", "Wool scarf · fictional sample"], ["uniform", "Station uniform · fictional sample"]]) { const option = el("option", "", text); option.value = value!; image.append(option); }
    image.value = existing?.art ?? "coat"; const preview = el("div", "cw-appearance-dialog-preview");
    const repaint = () => preview.replaceChildren(art({ id: "preview", expression: expression.value || "preview", art: image.value }));
    image.onchange = repaint; repaint();
    dialog.append(label("Expression token", expression, "Use letters, numbers and underscores, starting with a letter or underscore."), label(existing ? "Replace image with sample" : "Sample image", image, "Choose one of these illustrated placeholders. No private media is used."), preview);
    const error = el("p", "cw-game-error"); error.role = "alert"; dialog.append(error);
    const actions = el("div", "cw-dialog-actions"); actions.append(button("Cancel", () => dialog.close()), button(existing ? "Keep appearance edits" : "Add to game draft", () => {
      const d = draft();
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(expression.value) || d.appearances.some(a => a.id !== existing?.id && a.expression === expression.value)) { error.textContent = "Enter a unique expression token using letters, numbers and underscores."; expression.ariaInvalid = "true"; expression.focus(); return; }
      const a = { id: existing?.id ?? `sample-${++serial}`, expression: expression.value, art: image.value };
      if (existing) d.appearances[d.appearances.findIndex(a => a.id === existing.id)] = a; else d.appearances.push(a);
      if (!d.defaultId) d.defaultId = a.id; previews.set(current().id, a.id); dialog.close(); changed(); render();
    }, true)); dialog.append(actions); dialog.showModal();
  }
  function render() {
    const host = el("div", "cw-game-body"), c = current(), d = draft(); o.host.replaceChildren(host);
    const notice = el("p", "cw-game-boundary", "Browser simulation · Writing notes never change game definitions or Appearance assets."); host.append(notice);
    if (o.writingDirty()) host.append(el("p", "cw-game-writing-notice", "Your unsaved writing is retained. Save or discard it in Writing before creating or linking a game character."));
    const form = el("div", "cw-game-fields");
    const display = el("input"); display.name = "gameDisplayName"; display.value = d.displayName;
    const colour = el("input"); colour.type = "color"; colour.name = "gameColour"; colour.value = d.colour;
    display.oninput = () => { d.displayName = display.value; display.removeAttribute("aria-invalid"); changed(); updateDialogue(); };
    colour.oninput = () => { d.colour = colour.value; changed(); updateDialogue(); };
    const dialogue = el("div", "cw-dialogue-preview");
    function updateDialogue() { dialogue.replaceChildren(); const name = el("strong", "", d.displayName || "Character name"); name.style.color = d.colour; dialogue.append(name, el("p", "", '"Then we had better wait another minute."'), el("small", "muted", "Fictional dialogue preview")); }
    updateDialogue();
    form.append(label("Display name", display, "The name shown above this character's dialogue. This stays separate from the writing card's name."), label("Dialogue colour", colour, "Preview the dialogue name colour before saving game settings."));
    const message = feedback.get(c.id); if (message) { const n = el("p", `cw-game-feedback ${message.error ? "cw-game-error" : "cw-game-success"}`, message.text); n.role = message.error ? "alert" : "status"; o.host.prepend(n); }
    if (!c.inGame) {
      host.append(el("h3", "", "Bring this character into the game"), el("p", "muted", "Keep planning here, create a new game identity, or link a saved one. Each path keeps the writing card's identity."));
      const create = el("section", "cw-game-create"); create.append(el("h4", "", "Create a game character"), form);
      const technical = el("input"); technical.name = "gameTechnicalName"; technical.value = d.technicalName;
      technical.oninput = () => { d.technicalName = technical.value; technical.removeAttribute("aria-invalid"); changed(); };
      const advanced = el("details", "cw-game-technical"); advanced.open = !d.technicalName; advanced.append(el("summary", "", "Ren'Py name"), label("Ren'Py name", technical, "A fixed source variable. Use letters, numbers and underscores; do not reuse another character's name.")); create.append(advanced, dialogue);
      const link = el("details", "cw-game-link"); link.append(el("summary", "", "Link an existing game character"));
      const candidates = o.characters().filter(other => other !== c && other.inGame && !other.hasCard && other.game && !o.characters().some(card => card !== other && card.game?.id === other.game?.id));
      const picker = el("select"); picker.name = "existingGameCharacter"; const empty = el("option", "", "Choose a saved game character"); empty.value = ""; picker.append(empty);
      for (const other of candidates) { const option = el("option", "", `${other.game!.displayName} · ${other.game!.technicalName}`); option.value = other.id; picker.append(option); }
      link.append(label("Existing game character", picker, "Only unlinked saved identities are available. Linking does not compare or merge names."), button("Review character link", () => {
        const target = candidates.find(other => other.id === picker.value);
        if (!target) { say("Choose an available saved game character before reviewing the link.", true); return; } review(false, target);
      }));
      if (!candidates.length) link.append(el("p", "muted", "Every saved game character already has a writing card."));
      const discard = button("Discard setup draft", () => {
        const dialog = o.modal("Discard game setup changes?"); dialog.append(el("p", "", "Reset this character's unsaved game setup fields? The writing card stays unchanged."));
        const actions = el("div", "cw-dialog-actions"); actions.append(button("Keep editing", () => dialog.close()), button("Discard game draft", () => { drafts.delete(c.id); baselines.delete(c.id); feedback.delete(c.id); dialog.close(); render(); o.changed(); }, true)); dialog.append(actions); dialog.showModal();
      });
      discard.disabled = !currentDirty();
      for (const input of [technical, display, colour]) input.addEventListener("input", () => { discard.disabled = !currentDirty(); });
      host.append(create, link); const controls = el("div", "cw-game-controls"); controls.append(discard, button("Review game character source", () => review(true), true)); o.host.append(controls); return;
    }
    const grid = el("div", "cw-game-grid"), setup = el("section", "cw-game-settings"), visuals = el("section", "cw-game-visuals");
    setup.append(el("h3", "", "Dialogue"), form, dialogue);
    const sourceDetails = el("details", "cw-game-technical"); sourceDetails.append(el("summary", "", "Game source definition"), el("p", "muted", `Ren'Py name ${c.game!.technicalName} is fixed. Saved identity ${c.game!.id}.`), el("pre", "", source(c.game!))); setup.append(sourceDetails);
    const actions = el("div", "cw-game-actions cw-game-controls"), save = button("Save game settings", () => { if (validate(d)) commit(d, "Saved game settings in this sample. Writing drafts are unchanged."); }, true), discard = button("Discard game edits", () => {
      const dialog = o.modal("Discard game setup changes?"); dialog.append(el("p", "", "Return this character's game settings and appearances to the saved sample? Writing drafts stay unchanged."));
      const actions = el("div", "cw-dialog-actions"); actions.append(button("Keep editing", () => dialog.close()), button("Discard game draft", () => { drafts.delete(c.id); baselines.delete(c.id); feedback.delete(c.id); dialog.close(); render(); o.changed(); }, true)); dialog.append(actions); dialog.showModal();
    });
    save.disabled = discard.disabled = !currentDirty(); actions.append(discard, save);
    // Inputs keep their selection while the enabled state changes.
    for (const input of [display, colour]) input.addEventListener("input", () => { save.disabled = discard.disabled = !currentDirty(); });
    visuals.append(el("h3", "", "Appearances")); const selected = d.appearances.find(a => a.id === previews.get(c.id)) ?? d.appearances.find(a => a.id === d.defaultId) ?? d.appearances[0];
    visuals.append(art(selected)); const caption = el("p", "cw-appearance-caption", selected ? `${selected.expression}${selected.id === d.defaultId ? " · Default" : ""}` : "Add an appearance to preview this character."); visuals.append(caption);
    const list = el("div", "cw-appearance-list");
    for (const a of d.appearances) {
      const row = el("div", "cw-appearance-row"), preview = button(a.expression, () => { previews.set(c.id, a.id); render(); }); preview.ariaLabel = `View appearance ${a.expression}`; preview.ariaPressed = String(a.id === selected?.id);
      const def = button(a.id === d.defaultId ? "Default" : "Set default", () => { d.defaultId = a.id; changed(); render(); }); def.ariaLabel = a.id === d.defaultId ? `Default appearance ${a.expression}` : `Set ${a.expression} as default`; def.disabled = a.id === d.defaultId;
      const edit = button("Edit", () => editAppearance(a)); edit.ariaLabel = `Edit appearance ${a.expression}`; row.append(preview, def, edit); list.append(row);
    }
    visuals.append(list, button("Add appearance", () => editAppearance())); grid.append(setup, visuals); host.append(grid); o.host.append(actions);
  }
  return { render, dirty, currentDirty, reset: () => { drafts.clear(); baselines.clear(); } };
}
