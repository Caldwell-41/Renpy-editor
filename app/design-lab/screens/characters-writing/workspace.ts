import { icon } from "../../../src/icons.ts";
import fieldCopy from "./field-help.json";
import type { LabContext } from "../../contracts.ts";
import { clone, emptyCard, sampleCharacters, type Card, type Character } from "./fixture.ts";
import { labPage } from "../../page.ts";
import { gameWorkspace } from "./game.ts";
import "./styles.css";

type Field = Exclude<keyof Card, "relationships" | "retained">;
type Topic = "overview" | "personality" | "voice" | "relationships" | "knowledge";
const topics: [Topic, string, string][] = [
  ["overview", "Overview", "Who they are"], ["personality", "Personality & goals", "What drives them"],
  ["voice", "Voice", "How they speak"], ["relationships", "Relationships", "How they see others"],
  ["knowledge", "Starting knowledge & secrets", "Their perspective at the start"],
];
const fields: Record<Topic, [Field, string, boolean][]> = {
  overview: [["description", "Description", true], ["appearanceNotes", "Appearance notes", true], ["background", "Background", true]],
  personality: [["personality", "Personality", true], ["motivations", "Motivations", true]],
  voice: [["speakingStyle", "Speaking style", true], ["exampleDialogue", "Example dialogue", true]],
  relationships: [], knowledge: [["knowledgeNotes", "Starting knowledge & secrets", true]],
};
interface Draft {
  card: Card; focus: string | null; start: number | null; end: number | null;
  scroll: number; openRelationship: number; collapsed: Set<Topic>;
}
function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text = ""): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag); n.className = className; n.textContent = text; return n;
}
function button(text: string, action: () => void, className = "button") {
  const b = el("button", className, text); b.type = "button"; b.onclick = action; return b;
}
function iconButton(name: string, title: string, action: () => void) {
  const b = button("", action, "icon-button"); b.append(icon(name)); b.ariaLabel = b.title = title; return b;
}
function grow(input: HTMLTextAreaElement) { input.style.height = "auto"; input.style.height = `${Math.max(92, input.scrollHeight + 2)}px`; }

export function mountWriting(host: HTMLElement, context: LabContext, layout: "dossier" | "board") {
  let characters = sampleCharacters(context.state);
  let selected = context.state === "game-planning" ? "ivo" : "mara", view: "writing" | "game" = context.state.startsWith("game-") ? "game" : "writing", busy = false, message = "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  let listCollapsed = innerWidth < 760;
  let sequence = 0;
  const drafts = new Map<string, Draft>();
  const undoStack: Character[][] = [], redoStack: Character[][] = [];
  const validators = new Map<HTMLInputElement | HTMLTextAreaElement, () => boolean>();
  const frame = labPage(host, context, { screen: "characters-writing", title: "Characters", subtitle: layout === "dossier" ? "Continuous dossier" : "Writing board", dirty: () => anyDirty() });
  const { shell, main } = frame; shell.classList.add("cw-shell", `cw-${layout}`);
  frame.status.removeAttribute("role"); frame.status.textContent = "Characters comparison";
  const pageHeader = frame.heading; pageHeader.classList.add("cw-page-header");
  main.classList.add("cw-main"); frame.content.classList.add("cw-frame-content");
  const create = button("New character", () => {
    remember(); const id = `new-${++sequence}`;
    characters.push({ id, inGame: false, hasCard: false, proposed: false, saved: emptyCard(), versions: [] });
    selected = id; view = "writing"; message = ""; search.value = ""; render(); focusEditor();
  }, "button primary"); create.prepend(icon("plus")); frame.tools.append(create);
  const historyBar = el("div", "cw-toolbar");
  const undo = button("Undo", () => travel(undoStack, redoStack, "Undid the last sample change."));
  const redo = button("Redo", () => travel(redoStack, undoStack, "Redid the last sample change."));
  const reload = button("Reload library", () => { message = "Sample library reloaded. Unsaved drafts are retained."; update(); });
  const draftCount = el("span", "cw-draft-count muted"); historyBar.append(undo, redo, reload, draftCount);
  const workspace = el("div", "cw-workspace");
  const list = el("aside", "cw-characters"); list.id = "cw-character-list"; list.ariaLabel = "Characters";
  const listTop = el("div", "cw-list-top"); listTop.append(el("h2", "", "Characters"));
  const collapse = iconButton("panel", "Collapse character list", () => setCollapsed(true));
  collapse.setAttribute("aria-controls", list.id); listTop.append(collapse);
  const search = el("input"); search.type = "search"; search.ariaLabel = "Search characters"; search.placeholder = "Search name or notes";
  const rows = el("div", "cw-character-rows"); list.append(listTop, search, rows);
  search.oninput = drawList;
  const editor = el("section", "cw-editor"); editor.ariaLabel = "Character workspace";
  const restore = iconButton("panelOpen", "Show character list", () => setCollapsed(false)); restore.setAttribute("aria-controls", list.id);
  const identity = el("div", "cw-identity");
  const viewTabs = el("div", "cw-view-tabs"); viewTabs.role = "tablist"; viewTabs.ariaLabel = "Character workspace";
  const writingTab = button("Writing", () => switchView("writing"));
  const gameTab = button("Game setup", () => switchView("game"));
  for (const [key, tab] of [["writing", writingTab], ["game", gameTab]] as const) {
    tab.role = "tab"; tab.id = `cw-tab-${key}`; tab.setAttribute("aria-controls", `cw-${key}`); viewTabs.append(tab);
  }
  viewTabs.onkeydown = e => {
    if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) {
      e.preventDefault(); const next = e.key === "Home" ? writingTab : e.key === "End" ? gameTab : view === "writing" ? gameTab : writingTab; next.click();
    }
  };
  const writing = el("div", "cw-writing"); writing.id = "cw-writing"; writing.role = "tabpanel"; writing.setAttribute("aria-labelledby", writingTab.id);
  const index = el("nav", "cw-section-index"); index.ariaLabel = "Writing sections";
  const body = el("div", "cw-body"); body.tabIndex = 0; body.ariaLabel = "Writing content";
  writing.append(index, body);
  const game = el("div", "cw-game"); game.id = "cw-game"; game.role = "tabpanel"; game.setAttribute("aria-labelledby", gameTab.id);
  const footer = el("div", "cw-save-bar");
  const state = el("span", "cw-save-state"); state.role = "status";
  const discard = button("Discard changes", confirmDiscard);
  const save = button("Save changes", saveDraft, "button primary");
  footer.append(state, discard, save);
  editor.append(identity, viewTabs, writing, game, footer); workspace.append(list, editor);
  if (layout === "board") frame.tools.prepend(historyBar); else frame.content.append(historyBar);
  frame.content.append(workspace);
  const gameController = gameWorkspace({ host: game, context, current, characters: () => characters,
    writingDirty: () => dirty(), checkpoint, refresh: () => { render(); }, modal,
    changed: () => update(), announce: text => { message = text; update(); },
  });

  function current() { return characters.find(c => c.id === selected)!; }
  function data() {
    let d = drafts.get(selected);
    if (!d) { d = { card: clone(current().saved), focus: null, start: null, end: null, scroll: 0, openRelationship: -1, collapsed: new Set() }; drafts.set(selected, d); }
    return d;
  }
  function dirty(id = selected) { const d = drafts.get(id), c = characters.find(c => c.id === id); return !!d && !!c && JSON.stringify(d.card) !== JSON.stringify(c.saved); }
  function anyDirty() { return characters.some(c => dirty(c.id)) || gameController?.dirty(); }
  function setCollapsed(value: boolean) {
    listCollapsed = value; updateCollapse(); (value ? restore : collapse).focus(); requestAnimationFrame(resizeFields);
  }
  function updateCollapse() {
    workspace.dataset.listCollapsed = String(listCollapsed); list.hidden = listCollapsed; restore.hidden = !listCollapsed;
    restore.ariaExpanded = collapse.ariaExpanded = String(!listCollapsed);
  }
  function remember() {
    if (view !== "writing") return;
    const d = data(); d.scroll = body.scrollTop;
    const active = document.activeElement;
    if ((active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) && body.contains(active)) rememberField(active);
  }
  function rememberField(n: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
    const d = drafts.get(n.dataset.owner ?? selected) ?? data(); d.focus = n.name;
    if (!(n instanceof HTMLSelectElement)) { d.start = n.selectionStart; d.end = n.selectionEnd; }
  }
  body.addEventListener("focusout", event => {
    const n = event.target;
    if (n instanceof HTMLInputElement || n instanceof HTMLTextAreaElement || n instanceof HTMLSelectElement) rememberField(n);
  });
  function focusEditor() {
    const d = data();
    const n = [...body.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input,textarea,select")].find(n => n.name === d.focus && n.getClientRects().length);
    const fallback = d.focus?.startsWith("section:") ? body.querySelector<HTMLElement>(`.cw-section[data-topic="${d.focus.slice(8)}"] h3`) : body.querySelector<HTMLElement>(".cw-starting input,h3");
    (n ?? fallback)?.focus({ preventScroll: true });
    if (n && !(n instanceof HTMLSelectElement) && d.start !== null && (n instanceof HTMLTextAreaElement || n.type === "text")) n.setSelectionRange(d.start, d.end);
    body.scrollTop = d.scroll;
  }
  function resizeFields() { body.querySelectorAll<HTMLTextAreaElement>("textarea").forEach(n => { if (n.getClientRects().length) grow(n); }); }
  function drawList() {
    rows.replaceChildren(); const needle = search.value.toLocaleLowerCase();
    for (const c of characters.filter(c => !(c.inGame && !c.hasCard && c.game && characters.some(other => other !== c && other.game?.id === c.game!.id))).filter(c => JSON.stringify(drafts.get(c.id)?.card ?? c.saved).toLocaleLowerCase().includes(needle))) {
      const b = button("", () => {
        if (busy) return; remember(); selected = c.id; view = "writing"; message = ""; render();
        if (innerWidth < 760) { setCollapsed(true); } else focusEditor();
      }, "cw-character");
      b.dataset.character = c.id; b.ariaPressed = String(c.id === selected); b.disabled = busy;
      const name = drafts.get(c.id)?.card.title || c.saved.title || "New character";
      const avatar = el("span", "cw-initials", name.split(" ").slice(0, 2).map(w => w[0]).join("")); avatar.ariaHidden = "true";
      const text = el("span", "cw-character-text"); text.append(el("strong", "", name), el("small", "", c.inGame ? "In game" : "Planning only"));
      const badge = el("small", "cw-row-state", dirty(c.id) ? "Unsaved" : c.proposed ? "Proposed" : !c.hasCard && c.inGame ? "No writing yet" : "");
      b.append(avatar, text, badge); rows.append(b);
    }
    if (!rows.childElementCount) rows.append(el("p", "muted", "No matching characters."));
  }
  function update() {
    shell.dataset.busy = String(busy); shell.dataset.selected = selected;
    const c = current(); state.textContent = busy ? "Saving in sample…" : message || (view === "game" && gameController.currentDirty() ? "Unsaved game setup changes" : dirty() ? "Unsaved changes" : c.proposed ? "Proposed · needs review" : c.hasCard ? "Saved in sample" : "No writing saved yet");
    state.dataset.error = String(message.includes("failure") || message.includes("Correct"));
    save.disabled = busy || !dirty() || c.proposed || view === "game";
    discard.disabled = busy || !dirty() || view === "game";
    undo.disabled = busy || anyDirty() || !undoStack.length; redo.disabled = busy || anyDirty() || !redoStack.length;
    reload.disabled = create.disabled = search.disabled = busy;
    const writingCount = characters.filter(c => dirty(c.id)).length;
    draftCount.textContent = writingCount ? `${writingCount} unsaved character draft${writingCount === 1 ? "" : "s"}` : gameController.dirty() ? "Unsaved game setup draft" : "";
    for (const n of body.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input,textarea,select")) n.disabled = busy || c.proposed;
    for (const b of shell.querySelectorAll<HTMLButtonElement>(".cw-character,.cw-section-index button,.cw-section-toggle,.cw-relationships button,.cw-view-tabs button,.cw-identity button,.cw-review button")) b.disabled = busy || (c.proposed && b.closest(".cw-relationships") !== null);
    drawList();
  }
  function changed() { message = ""; update(); }
  function render() {
    validators.clear(); const c = current(), d = data();
    identity.replaceChildren();
    const name = el("div", "cw-identity-name"); const h = el("h2", "", d.card.title || "New character");
    name.append(h, el("span", "cw-character-status", c.inGame ? "In game" : "Planning only"));
    identity.append(restore, name);
    if (layout === "board") identity.append(viewTabs);
    if (view === "writing" && c.saved.title) identity.append(button("Card details", openDetails, "button cw-details-button"));
    if (c.hasCard) identity.append(button("Version history", openHistory, "button cw-history-button"));
    for (const [key, tab] of [["writing", writingTab], ["game", gameTab]] as const) { tab.ariaSelected = String(view === key); tab.tabIndex = view === key ? 0 : -1; }
    writing.hidden = view !== "writing"; game.hidden = view !== "game"; footer.hidden = view === "game";
    body.replaceChildren(); index.replaceChildren();
    if (c.proposed) drawProposal();
    if (!c.saved.title) {
      const starting = el("section", "cw-starting"); starting.append(el("p", "muted", "Name this character, then start with a few lines about who they are."));
      addField(starting, "title", "Name", false); body.append(starting);
    }
    const inclusion = el("p", "cw-inclusion muted", `Used only when you include ${d.card.title || "this character"}'s card in an AI request.`); body.append(inclusion);
    const sections = el("div", "cw-sections"); body.append(sections);
    for (const [i, [key, title, subtitle]] of topics.entries()) {
      const jump = button("", () => showSection(key), "cw-jump"); jump.append(el("span", "cw-section-number", String(i + 1).padStart(2, "0")), el("span", "", title)); jump.dataset.topic = key; index.append(jump);
      const section = el("section", `cw-section cw-section-${key}`); section.dataset.topic = key;
      const sh = el("div", "cw-section-heading"); const titleBox = el("div");
      const h3 = el("h3", "", title); h3.tabIndex = -1; titleBox.append(h3, el("p", "muted", subtitle));
      const content = el("div", "cw-section-content"); content.id = `cw-content-${key}`; content.hidden = d.collapsed.has(key);
      const toggle = button(d.collapsed.has(key) ? "+" : "−", () => {
        content.hidden = !content.hidden;
        if (content.hidden) d.collapsed.add(key); else { d.collapsed.delete(key); resizeFields(); }
        toggle.textContent = content.hidden ? "+" : "−"; toggle.ariaExpanded = String(!content.hidden);
        toggle.ariaLabel = `${content.hidden ? "Expand" : "Collapse"} ${title} section`;
      }, "icon-button cw-section-toggle");
      toggle.ariaLabel = `${content.hidden ? "Expand" : "Collapse"} ${title} section`; toggle.ariaExpanded = String(!content.hidden); toggle.setAttribute("aria-controls", content.id);
      sh.append(titleBox, toggle); section.append(sh, content); sections.append(section);
      if (key === "knowledge") {
        content.append(el("p", "cw-knowledge-intro", `Describe ${d.card.title || "this character"}'s perspective when the story begins.`));
        const guides = el("ul", "cw-knowledge-guides");
        for (const q of [`What does ${d.card.title || "this character"} already know?`, "What have they not learned yet?", "What secrets do they keep?"]) guides.append(el("li", "", q));
        content.append(guides);
      }
      for (const [field, label, multiline] of fields[key]) addField(content, field, label, multiline);
      if (key === "relationships") drawRelationships(content);
    }
    gameController.render(); updateCollapse(); update(); resizeFields(); body.scrollTop = d.scroll;
  }
  function addField(parent: HTMLElement, key: Field, title: string, multiline: boolean) {
    const input = multiline ? el("textarea") : el("input"); input.name = key; input.value = data().card[key];
    if (input instanceof HTMLTextAreaElement) input.rows = key === "description" ? 3 : 4;
    if (key === "title") input.required = true;
    const helpKey = key === "title" ? "name" : key === "appearanceNotes" ? "appearance" : key;
    const helpText = key === "knowledgeNotes" ? `Write what ${data().card.title || "this character"} knows, doesn't know and keeps secret at the start of the story.` : fieldCopy.fields[helpKey];
    bindField(parent, input, title, helpText, () => {
      const length = new TextEncoder().encode(input.value).length;
      return key === "title" && !input.value.trim() ? "Enter a name before saving." : length > (key === "title" ? 160 : 10000) ? `Use at most ${key === "title" ? "160" : "10,000"} UTF-8 bytes.` : "";
    }, () => { data().card[key] = input.value; });
  }
  function bindField(parent: HTMLElement, input: HTMLInputElement | HTMLTextAreaElement, title: string, copy: string, validate: () => string, commit: () => void) {
    input.dataset.owner = selected; input.ariaLabel = title;
    const label = el("label", "field cw-field"); label.append(el("span", "cw-field-title", title), input);
    const help = el("p", "cw-field-help muted", copy); help.id = `cw-help-${input.name}`;
    const error = el("span", "field-error"); error.id = `cw-error-${input.name}`; input.setAttribute("aria-describedby", `${help.id} ${error.id}`);
    label.append(help, error); parent.append(label);
    const check = () => { const message = validate(); error.textContent = message; input.ariaInvalid = String(!!message); return !message; };
    validators.set(input, check);
    let composing = false;
    input.addEventListener("compositionstart", () => { composing = true; }); input.addEventListener("compositionend", () => { composing = false; });
    input.onblur = () => { if (!composing) check(); };
    input.oninput = () => { commit(); if (input instanceof HTMLTextAreaElement) grow(input); if (error.textContent && !composing) check(); changed(); };
  }
  function showSection(key: Topic) {
    const section = body.querySelector<HTMLElement>(`.cw-section[data-topic="${key}"]`)!;
    const toggle = section.querySelector<HTMLButtonElement>(".cw-section-toggle")!;
    if (data().collapsed.has(key)) toggle.click();
    section.scrollIntoView({ block: "start" }); section.querySelector<HTMLElement>("h3")!.focus({ preventScroll: true });
    data().focus = `section:${key}`; data().start = data().end = null;
    index.querySelectorAll<HTMLButtonElement>("button").forEach(b => b.setAttribute("aria-current", b.dataset.topic === key ? "location" : "false"));
  }
  function drawRelationships(parent: HTMLElement) {
    const container = el("div", "cw-relationships"); parent.append(container);
    const redraw = () => {
      for (const n of container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input,textarea")) validators.delete(n);
      container.replaceChildren(); const d = data();
      const nameFor = (target: string) => characters.find(c => c.id === target)?.saved.title || (target === "lore:station" ? "The closed station · retained lore note" : target ? "Missing saved target" : "Choose a person");
      if (!d.card.relationships.length) container.append(el("p", "cw-empty muted", "No relationships yet. Add someone to describe how this character acts around them."));
      d.card.relationships.forEach((rel, i) => {
        const row = el("details", "cw-relationship"); row.name = "cw-relationship"; row.open = d.openRelationship === i;
        const summary = el("summary", "", nameFor(rel.target)); row.append(summary);
        row.ontoggle = () => {
          if (row.open) {
            d.openRelationship = i;
            for (const other of container.querySelectorAll<HTMLDetailsElement>("details")) if (other !== row) other.open = false;
            row.querySelectorAll<HTMLTextAreaElement>("textarea").forEach(grow);
          } else if (d.openRelationship === i) d.openRelationship = -1;
        };
        const target = el("select"); target.name = `relationship-${i}-target`; target.dataset.owner = selected; target.ariaLabel = "Relationship with";
        const option = (value: string, text: string) => { const n = el("option", "", text); n.value = value; target.append(n); };
        option("", "Choose a person"); for (const c of characters) if (c.id !== selected) option(c.id, c.saved.title || "New character");
        if (rel.target && ![...target.options].some(o => o.value === rel.target)) option(rel.target, nameFor(rel.target));
        target.value = rel.target;
        const label = el("label", "field cw-field"); const help = el("p", "cw-field-help muted", fieldCopy.fields.relationshipTarget); help.id = `cw-help-${target.name}`;
        target.setAttribute("aria-describedby", help.id); label.append(el("span", "cw-field-title", "Relationship with"), target, help); row.append(label);
        target.onchange = () => { rel.target = target.value; summary.textContent = nameFor(rel.target); changed(); };
        const notes = el("textarea"); notes.name = `relationship-${i}-text`; notes.rows = 4; notes.value = rel.text;
        bindField(row, notes, "Relationship", fieldCopy.fields.relationship, () => new TextEncoder().encode(notes.value).length > 10000 ? "Use at most 10,000 UTF-8 bytes." : "", () => { rel.text = notes.value; });
        row.append(button("Remove relationship", () => {
          d.card.relationships.splice(i, 1); d.openRelationship = -1; redraw(); changed(); container.querySelector<HTMLButtonElement>(".cw-add-relationship")!.focus();
        }, "button cw-remove"));
        container.append(row);
      });
      const add = button("Add relationship", () => {
        d.card.relationships.push({ target: "", text: "" }); d.openRelationship = d.card.relationships.length - 1; redraw(); changed();
        container.querySelector<HTMLSelectElement>("details[open] select")!.focus();
      }, "button cw-add-relationship"); add.prepend(icon("plus")); container.append(add);
      resizeFields();
    };
    redraw();
  }
  function switchView(next: "writing" | "game") {
    if (busy) return; remember(); view = next; render();
    (next === "writing" ? writingTab : gameTab).focus();
  }
  function openDetails() {
    const dialog = modal("Card details");
    dialog.append(el("p", "muted", "Names help the AI recognise this character. Tags help you find the card. Changes share Writing's Save and Discard controls."));
    const detailsFields = el("div"); dialog.append(detailsFields);
    for (const [key, title] of [["title", "Name"], ["aliases", "Aliases (optional)"], ["tags", "Tags (comma separated)"]] as const) addField(detailsFields, key, title, false);
    const done = button("Done", () => dialog.close());
    dialog.append(done);
    for (const input of detailsFields.querySelectorAll<HTMLInputElement>("input")) input.disabled = busy || current().proposed;
    dialog.addEventListener("close", () => { for (const n of detailsFields.querySelectorAll<HTMLInputElement>("input")) validators.delete(n); render(); identity.querySelector<HTMLButtonElement>(".cw-details-button")?.focus(); });
    dialog.showModal();
  }
  function checkpoint() { undoStack.push(clone(characters)); redoStack.length = 0; }
  function saveVersion(card: Card) { const c = current(); c.saved = clone(card); c.hasCard = true; c.versions.push(clone(card)); c.versions = c.versions.slice(-3); }
  function saveDraft() {
    if (busy || !dirty() || current().proposed) return;
    const invalidMetadata = (["title", "aliases", "tags"] as const).find(key => (key === "title" && !data().card.title.trim()) || new TextEncoder().encode(data().card[key]).length > (key === "title" ? 160 : 10000));
    if (invalidMetadata) {
      let input = invalidMetadata === "title" ? body.querySelector<HTMLInputElement>('.cw-starting [name="title"]') : null;
      if (!input) { openDetails(); input = shell.querySelector<HTMLInputElement>(`dialog [name="${invalidMetadata}"]`)!; }
      validators.get(input)?.(); message = "Correct the marked fields. Your draft is retained."; update(); input.focus(); return;
    }
    for (const [input, validate] of validators) if (!validate()) {
      const key = input.closest<HTMLElement>(".cw-section")?.dataset.topic as Topic | undefined; if (key) showSection(key);
      const details = input.closest("details"); if (details) details.open = true;
      message = "Correct the marked fields. Your draft is retained."; update(); input.focus(); return;
    }
    remember(); busy = true; message = ""; update();
    timer = setTimeout(() => {
      busy = false;
      if (context.state === "save-error") { message = "Simulated save failure. Your draft is retained. Try Save again or discard it."; update(); save.focus(); return; }
      checkpoint(); saveVersion(data().card); message = "Saved in sample"; render(); focusEditor();
    }, 320);
  }
  function modal(title: string, invoker: HTMLElement = document.activeElement as HTMLElement) {
    const dialog = el("dialog", "cw-dialog"); dialog.ariaLabel = title;
    dialog.append(el("h2", "", title)); shell.append(dialog);
    dialog.addEventListener("close", () => { dialog.remove(); if (invoker.isConnected) invoker.focus(); });
    return dialog;
  }
  function confirmDiscard() {
    if (!dirty() || busy) return;
    const dialog = modal("Discard writing changes?");
    dialog.append(el("p", "", `Discard the unsaved writing for ${data().card.title || "this character"}? Other character drafts stay unchanged.`));
    const actions = el("div", "cw-dialog-actions");
    actions.append(button("Keep editing", () => dialog.close()), button("Discard this draft", () => {
      remember(); const d = data(); d.card = clone(current().saved); d.openRelationship = -1; message = "Returned to saved text."; dialog.close(); render(); focusEditor();
    }, "button primary")); dialog.append(actions); dialog.showModal();
  }
  function openHistory() {
    if (busy || !current().hasCard) return;
    const dialog = modal("Character version history");
    dialog.append(el("p", "", "Restores the whole card as a new saved version. Your current version stays in recent history. You can undo the restore."));
    if (dirty() || gameController.currentDirty()) dialog.append(el("p", "cw-history-warning", "Save or discard your current changes before restoring a version."));
    const versions = el("div", "cw-version-list");
    for (const [i, card] of [...current().versions].reverse().entries()) {
      const details = el("details", "cw-version"); details.open = i === 1;
      details.append(el("summary", "", i === 0 ? "Current saved card" : "Previous saved card"));
      for (const [key, title] of [...[ ["title", "Name"], ["aliases", "Aliases"], ["tags", "Tags"], ...Object.values(fields).flat().map(([key, title]) => [key, title])], ["relationships", "Relationships"]]) {
        const value = card[key as keyof Card];
        if (typeof value === "string" && value) details.append(el("h4", "", title), el("p", "cw-version-prose", value));
        if (key === "relationships") for (const rel of card.relationships) details.append(el("p", "cw-version-prose", rel.text));
      }
      if (i > 0) {
        const restoreVersion = button("Restore this version", () => {
          checkpoint(); saveVersion(card); drafts.delete(selected); message = "Restored as a new saved sample version."; dialog.close(); render(); identity.querySelector<HTMLButtonElement>(".cw-history-button")!.focus();
        }, "button primary"); restoreVersion.disabled = dirty() || gameController.currentDirty() || current().proposed; details.append(restoreVersion);
      }
      versions.append(details);
    }
    dialog.append(versions, button("Close version history", () => dialog.close())); dialog.showModal();
    dialog.querySelector<HTMLButtonElement>("button:last-child")?.focus();
  }
  function travel(from: Character[][], to: Character[][], text: string) {
    if (busy || anyDirty() || !from.length) return;
    to.push(clone(characters)); characters = from.pop()!; drafts.clear(); gameController.reset();
    if (!characters.some(c => c.id === selected)) selected = characters[0]!.id;
    message = text; render();
    (from === undoStack ? undo : redo).focus();
  }
  function drawProposal() {
    const review = el("section", "cw-review");
    review.append(el("h3", "", "Review proposed card"), el("p", "", "This saved proposal needs review. Writing stays read-only until you approve or reject it."));
    const comparison = el("details"); comparison.append(el("summary", "", "Compare with the previous approved card"), el("h4", "", "Previous description"), el("p", "", current().versions[0]!.description), el("h4", "", "Proposed description"), el("p", "", current().saved.description)); review.append(comparison);
    review.append(button("Approve this card revision", () => {
      checkpoint(); current().proposed = false; message = "Approved the fictional card in this sample."; render(); focusEditor();
    }, "button primary"), button("Reject proposed card", () => {
      checkpoint(); const c = current(); c.saved = clone(c.versions[0]!); c.proposed = false; drafts.delete(selected); message = "Kept the previous approved sample card."; render(); focusEditor();
    }));
    body.append(review);
  }
  render();
  const onResize = () => resizeFields(); window.addEventListener("resize", onResize);
  return () => { if (timer) clearTimeout(timer); window.removeEventListener("resize", onResize); };
}
