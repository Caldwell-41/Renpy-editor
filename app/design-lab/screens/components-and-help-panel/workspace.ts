import type { LabContext } from "../../contracts.ts";
import { icon } from "../../../src/icons.ts";
import tram from "../ui-image/tram.svg?url";
import route from "../ui-image/route.svg?url";
import { copy, fixture, source, componentUses, validName, defaultVisual, type Visual, type Sample, type Screen } from "./sample.ts";
import "./style.css";

export type Variant = "inspector" | "library" | "worksheet";
type Draft = Visual & { title: string; explanation: string; base: number };
const escape = (value: unknown) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const button = (id: string, label: string, primary = false, disabled = false) => `<button type="button" class="cp-button${primary ? " cp-primary" : ""}" data-action="${id}" ${disabled ? "disabled" : ""}>${label}</button>`;
const variants = { inspector: "A · Inspector", library: "B · Component library", worksheet: "C · Review below" };

export function mountStudy(host: HTMLElement, context: LabContext, variant: Variant): () => void {
  document.documentElement.dataset.theme = context.theme;
  let sample = fixture(context.state), screenId = "screen-help", step = "design", selection = "group";
  const drafts = new Map<string, Draft>(), undo: Sample[] = [], redo: Sample[] = [];
  let notice = "Ready in sample", error = "", modal: HTMLDialogElement | null = null, reviewInline = false;
  let shown = true, line = 0, lastLauncher: HTMLElement | null = null;
  if (context.state === "story") step = "connect";
  if (context.state === "conflict") { drafts.set("component-guide", { ...defaultVisual(), title: "A guide for night travellers", explanation: sample.component!.explanation, base: 1 }); sample.revision = 2; sample.component!.revision = 2; error = "Source changed after this draft began. Draft retained. Inspect Source before retrying."; }
  host.classList.add("cp-host"); host.dataset.variant = variant;
  const active = (): Screen => sample.screens.find(screen => screen.id === screenId)!;
  const shared = () => active().use && selection !== "close" ? sample.component : null;
  const draftKey = () => selection === "close" ? `${screenId}/close` : shared() ? "component-guide" : screenId;
  const values = (): Draft => {
    const c = shared(); const screen = active();
    return drafts.get(draftKey()) ?? { ...(c ?? screen), base: sample.revision };
  };
  const dirty = () => drafts.has(draftKey());
  const available = () => !active().use || sample.component?.state === "available";
  const report = (message: string) => { notice = message; host.querySelector<HTMLElement>(".cp-status")!.textContent = message; };
  function accept(next: Sample, message: string) {
    undo.push(copy(sample)); redo.length = 0; next.revision = sample.revision + 1; sample = next;
    error = ""; notice = `${message} One sample history entry.`; render();
  }
  function refuse(): boolean {
    if (!available()) { error = "Component unavailable. The saved reference has not changed. Draft retained; inspect Source."; render(); return true; }
    if (dirty() && values().base !== sample.revision) { error = "Source changed after this draft began. Draft retained. Inspect Source before retrying."; render(); return true; }
    return false;
  }
  function content(screen: Screen, draft = true) {
    const c = screen.use ? sample.component : null;
    const d = draft ? drafts.get(c ? "component-guide" : screen.id) : undefined;
    return { ...(d ?? c ?? screen) };
  }
  function preview(screen = active(), draft = true): string {
    const text = content(screen, draft);
    const missing = screen.use && sample.component?.state !== "available";
    return `<div class="cp-canvas" aria-label="Inert screen canvas"><div class="cp-game-panel${screen.starter ? "" : " cp-blank"}">
      ${screen.starter ? `${screen.retainedGroup ? `<p class="cp-retained-group">${escape(screen.retainedGroup.title)} · ${escape(screen.retainedGroup.explanation)}</p>` : ""}<button class="cp-canvas-title" data-select="title" style="font-size:${Math.max(12, text.fontSize * .6)}px">${escape(text.title)}</button>
      ${missing ? `<div class="cp-unavailable">Component unavailable<br><code>route_guide</code><br>Saved reference retained</div>` : `<button class="cp-canvas-image" data-select="image" aria-label="Select sample image" style="width:${Math.min(100, text.width / 4)}%;aspect-ratio:${text.width}/${text.height}"><img src="${text.image === "tram" ? tram : route}" alt="${text.image === "tram" ? "Fictional tram emblem, a tram inside a gold diamond" : "Fictional route map"}"></button><button class="cp-canvas-copy" data-select="explanation">${escape(text.explanation)}</button>`}
      <button class="cp-game-close" data-select="close">${escape(drafts.get(`${screen.id}/close`)?.closeLabel ?? screen.closeLabel)}</button>` : `<span>Blank panel</span>`}
    </div></div>`;
  }
  function toolbar(): string {
    return `<header class="cp-heading"><h1>${step === "connect" ? "Story" : "Screens"}</h1><div class="cp-tools">${button("new", "New screen", true)}${button("undo", "Undo", false, !undo.length)}${button("redo", "Redo", false, !redo.length)}${button("source", "Source")}</div></header>
    <nav class="cp-steps" aria-label="Screens steps">${["choose", "design", "connect"].map((id, i) => `<button data-action="step-${id}" aria-current="${step === id ? "step" : "false"}">${i + 1} ${id[0]!.toUpperCase() + id.slice(1)}</button>`).join("")}</nav>`;
  }
  function screenSelect(): string {
    return `<label class="cp-screen-select">Screen <select name="screen" aria-label="Screen">${sample.screens.map(screen => `<option value="${screen.id}" ${screen.id === screenId ? "selected" : ""}>${escape(screen.name)} · Panel</option>`).join("")}</select></label>`;
  }
  function tree(): string {
    return `<section class="cp-tree"><h2>Elements</h2><div class="cp-row">${button("add-use", "+ Use component", false, !sample.component || sample.component.state !== "available")}</div>
      ${[["group", active().use ? `Use ${sample.component?.name ?? "route_guide"}` : active().copyName ? `Use ${active().copyName}` : "Vertical group"], ["title", "Title"], ["image", "Tram emblem"], ["explanation", "Explanation"], ["close", "Close"]].filter(([id]) => active().starter || id === "group").map(([id, title]) => `<button data-select="${id}" class="cp-node ${selection === id ? "cp-selected" : ""}">${id === "group" ? "▾" : "　"} ${escape(title)}</button>`).join("")}
    </section>`;
  }
  function reviewBody(): string {
    const screens = shared() ? componentUses(sample) : [active()];
    return `<h2>Review ${shared() ? "shared component" : "changes"}</h2><p>${shared() ? `Update ${screens.length} uses of <strong>${escape(sample.component!.name)}</strong>.` : `Update only ${escape(active().name)}.`}</p>
      <table class="cp-table"><thead><tr><th>Affected screen</th><th>Change</th></tr></thead><tbody>${screens.map(screen => `<tr><td>${escape(screen.name)}</td><td>${screen.use ? "Shared component content" : "Local content"}</td></tr>`).join("")}</tbody></table>
      <dl class="cp-diff">${selection === "close" ? `<dt>Close label</dt><dd>${escape(values().closeLabel)}</dd>` : `<dt>Title</dt><dd>${escape(values().title)}</dd><dt>Explanation</dt><dd>${escape(values().explanation)}</dd><dt>Image</dt><dd>${values().image === "tram" ? "Tram emblem" : "Route map"} · ${values().width} × ${values().height} px</dd>`}</dl>
      <p>Close stays local to each panel. ${shared() ? "All uses keep the same component reference." : "Other screens keep their current content."}</p>
      <div class="cp-actions">${button("confirm-apply", shared() ? `Apply to ${screens.length} screens` : "Apply changes", true)}${button("back-review", "Keep editing")}</div>`;
  }
  function editor(): string {
    const c = shared(); const d = values();
    return `<section class="cp-editor" aria-label="Element editor"><div class="cp-editor-head"><h2>${selection === "close" ? "Editing Close button" : c ? "Editing shared component" : active().copyName ? "Editing independent component" : "Editing vertical group"}</h2>${button("focus-preview", "Show preview")}</div>
      <div class="cp-editor-body">
      <div class="cp-scope"><strong>${c ? escape(c.name) : active().copyName ? escape(active().copyName) : escape(active().name)}</strong><span>${c ? `Editing ${componentUses(sample).length} uses across ${componentUses(sample).length} screens` : "This screen only"}</span>
      <div class="cp-row">${selection === "close" ? "Close belongs to this panel." : c ? button("uses", "View uses") + button("copy", "Make independent copy") : button("extract", "Make component", false, !!active().copyName || !active().starter)}</div></div>
      ${!available() ? `<p class="cp-error">${sample.component?.state === "renamed" ? "Source name changed." : "Component definition missing."} This use still points to its original identity. No replacement selected. ${button("source-component", "Inspect Source")}</p>` : ""}
      ${error ? `<p class="cp-error" role="alert">${escape(error)} ${button("source", "Inspect Source")}</p>` : ""}
      ${selection === "close" ? `<label class="cp-field">Button label<input name="close-label" value="${escape(d.closeLabel)}"></label><p>Action: Hide ${escape(active().name)}</p><p>Game Escape uses the same panel dismissal. The canvas selects this button without running its action.</p>` : `<label class="cp-field">Title<input name="title" value="${escape(d.title)}" ${!active().starter ? "disabled" : ""}></label>
      <label class="cp-field">Explanation<textarea name="explanation" rows="3" ${!active().starter ? "disabled" : ""}>${escape(d.explanation)}</textarea></label>
      <div class="cp-image-row"><img src="${d.image === "tram" ? tram : route}" alt="Selected sample image"><span>${d.image === "tram" ? "Tram emblem" : "Route map"}<br><code>ui/${d.image === "tram" ? "tram_emblem" : "route_map"}.svg</code><br>${d.width} × ${d.height} px</span>${button("image", "Edit image")}</div>`}
      <details class="cp-disclosure"><summary>Layout and appearance</summary><p>Existing layout, font, Style and image editing remain in the ordinary node editor. This study isolates component ownership and the panel connection.</p>${button("existing", "Show ordinary node editing")}</details>
      <details class="cp-disclosure"><summary>References and effects</summary><dl class="cp-meta"><dt>Role</dt><dd>${c || active().copyName ? "Owned component, parameterless" : "Owned screen, panel"}</dd><dt>Stable ID</dt><dd>${c ? c.id : screenId}</dd><dt>Revision</dt><dd>Screen ${active().revision}; ${c ? `component ${c.revision}; use 1; ` : ""}source ${sample.revision}</dd><dt>Effects</dt><dd>${c?.unknown ? "Unknown. A custom child effect cannot be classified as passive." : "Known content is passive presentation. Close hides its owning panel; shown-panel presence changes."}</dd></dl>${button("source-component", c ? "Component Source" : "Screen Source")}</details>
      </div><div class="cp-commit"><span>${dirty() ? "Draft · not applied" : "No pending changes"}</span><div class="cp-row">${button("apply", c ? "Review shared Apply" : "Apply changes", true, !dirty())}${button("cancel", "Cancel", false, !dirty())}</div></div>
      ${reviewInline ? `<section class="cp-inline-review">${reviewBody()}</section>` : ""}
    </section>`;
  }
  function library(): string {
    return `<aside class="cp-library"><h2>Components</h2>${sample.component ? `<button data-action="uses" class="cp-library-item"><strong>${escape(sample.component.name)}</strong><span>${componentUses(sample).length} uses · ${sample.component.state}</span></button>` : `<p>No components yet.</p>`}${button("extract", "Make from selected group", false, !!sample.component)}${button("add-use", "Insert owned component", false, !sample.component || sample.component.state !== "available")}<div class="cp-library-bottom"><h2>Current screen</h2>${screenSelect()}${tree()}</div></aside>`;
  }
  function design(): string {
    return `<div class="cp-design cp-${variant}">${variant === "library" ? library() : ""}<section class="cp-stage"><div class="cp-stage-head">${screenSelect()}<span>1280 × 720 · Fit</span>${button("play", "Test in Ren'Py")}</div>${preview()}<div class="cp-canvas-foot"><span>${dirty() ? "Draft canvas" : "Accepted sample canvas"}</span><span>Inert · click to select</span></div>${variant !== "library" ? tree() : ""}</section>${editor()}</div>`;
  }
  function choose(): string {
    return `<div class="cp-choose"><section><h2>Owned screens</h2>${sample.screens.map(screen => `<button class="cp-screen-row" data-open-screen="${screen.id}"><strong>${escape(screen.name)}</strong><span>Panel · ${screen.use ? "uses route_guide" : screen.copyName ? `uses ${screen.copyName}` : "ordinary nodes"}</span><span>Open Design</span></button>`).join("")}<h2>Owned components</h2>${sample.component ? `<div class="cp-screen-row"><strong>${escape(sample.component.name)}</strong><span>Component · ${componentUses(sample).length} uses</span>${button("uses", "View uses")}</div>` : `<p>Make a supported group into a component from Design.</p>`}</section><section class="cp-stage">${preview()}<p>New screen offers Blank or Help panel starter. Both create ordinary editable source.</p></section></div>`;
  }
  function story(): string {
    return `<div class="cp-connect"><section><div class="cp-section-heading"><h2>Night route</h2>${button("add-beat", "+ Screen Beat", true)}</div><ol class="cp-beats"><li><span>Dialogue</span><p>The last tram waits by the station.</p></li>${sample.beats.map(beat => `<li><span>${beat.kind === "show" ? "Show screen" : "Hide screen"}</span><strong>${escape(beat.targetName)}</strong>${button(`beat-source-${beat.id}`, "Source")}${!sample.screens.some(s => s.id === beat.screenId && s.name === beat.targetName) ? `<p class="cp-error">Target unavailable. Saved identity retained; this Beat cannot run.</p>` : ""}</li>${beat.kind === "show" ? `<li><span>Dialogue</span><p>We can read the guide while the tram moves.</p></li>` : ""}`).join("")}<li><span>Dialogue</span><p>Next stop, the old observatory.</p></li></ol></section>
      <section class="cp-connection"><h2>Help panel</h2><dl class="cp-meta"><dt>Type</dt><dd>Panel</dd><dt>Show</dt><dd>Stays visible through dialogue</dd><dt>Hide / Close</dt><dd>Removes the panel</dd><dt>Game Escape</dt><dd>Dismisses the panel</dd><dt>Outside click</dt><dd>Keeps the panel open</dd></dl>${button("play", "Try playback simulation", true)}${button("step-design", "Edit panel")}<p>Editor Escape cancels the current editor operation.</p><details class="cp-disclosure"><summary>Effects and revisions</summary><p>Show adds panel presence; Hide and Close remove it. Track the target screen, action and binding revisions. A missing target or unknown child remains unknown.</p><code>screen-help · revision ${sample.screens[0]!.revision}<br>sample action r1 · binding r1</code></details></section></div>`;
  }
  function render() {
    const focused = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
    const name = focused?.getAttribute("name"), start = focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement ? focused.selectionStart : null;
    const end = focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement ? focused.selectionEnd : null;
    const scrolls = [...host.querySelectorAll<HTMLElement>(".cp-editor-body,.cp-main")].map(e => e.scrollTop);
    const openSections = new Set([...host.querySelectorAll<HTMLDetailsElement>("details[open]")].map(d => d.querySelector("summary")?.textContent));
    host.innerHTML = `<div class="cp-shell"><header class="cp-app-header"><strong>Loomlight</strong><span>The Last Tram</span><span>${variants[variant]} · Draft</span></header>
      <div class="cp-project"><nav class="cp-nav" aria-label="Project navigation"><button data-action="step-connect" aria-label="Story"></button><button data-action="source" aria-label="Source"></button><button data-action="step-choose" aria-label="Screens"></button></nav><main class="cp-main">${toolbar()}${step !== "design" && error ? `<p class="cp-error" role="alert">${escape(error)}</p>` : ""}${step === "choose" ? choose() : step === "connect" ? story() : design()}</main></div>
      <footer class="cp-footer"><span class="cp-status" role="status">${escape(notice)}</span><span>Simulation · memory only</span></footer></div>
      <details class="cp-lab"><summary>Lab controls and simulation limits</summary><div class="cp-row"><label>Simulate Source change <select name="external" aria-label="Simulate Source change"><option value="">Choose…</option><option value="conflict">External edit</option><option value="rename">Rename component</option><option value="delete">Delete component</option><option value="unknown">Unknown child effect</option><option value="panel-rename">Rename panel</option><option value="panel-delete">Delete panel</option></select></label>${button("reopen", "Reopen sample")}${button("reset", "Reset sample")}</div><p>Fictional source, transactions, Undo/Redo, reopen and playback are browser-memory simulations. No native operation, project write, SDK or game execution occurs. Reload discards this sample. Existing editor controls keep their product scope.</p></details>`;
    const nav = host.querySelectorAll(".cp-nav button"); ["story", "source", "panel"].forEach((glyph, i) => nav[i]!.append(icon(glyph)));
    host.querySelectorAll<HTMLDetailsElement>("details").forEach(d => { d.open = openSections.has(d.querySelector("summary")?.textContent); });
    host.querySelectorAll<HTMLElement>(".cp-editor-body,.cp-main").forEach((e, i) => { e.scrollTop = scrolls[i] ?? 0; });
    if (name) {
      const replacement = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
      replacement?.focus({ preventScroll: true }); if (start !== null && end !== null && replacement && replacement.type !== "select-one") replacement.setSelectionRange(start, end);
    }
    host.dataset.ready = "true";
  }
  function openDialog(title: string, html: string, focusName?: string) {
    lastLauncher = document.activeElement as HTMLElement; modal?.remove();
    modal = document.createElement("dialog"); modal.className = "cp-dialog"; modal.ariaLabel = title;
    modal.innerHTML = `<div class="cp-dialog-heading"><h2>${title}</h2>${button("dialog-close", "Cancel")}</div><div class="cp-dialog-body">${html}</div>`;
    host.append(modal); modal.showModal();
    const current = modal, launcher = lastLauncher?.dataset.action;
    modal.addEventListener("close", () => { current.remove(); if (modal === current) modal = null; const returnTo = host.querySelector<HTMLElement>(`[data-action="${launcher ?? "new"}"]`) ?? host.querySelector<HTMLElement>("[name=title]"); returnTo?.focus({ preventScroll: true }); });
    if (focusName) modal.querySelector<HTMLInputElement>(`[name="${focusName}"]`)?.focus();
  }
  function closeDialog() { modal?.close(); }
  function nameProblem(name: string): string {
    if (!validName(name)) return "Use letters, numbers and underscores. Start with a letter or underscore.";
    if (sample.screens.some(s => s.name === name || s.copyName === name) || sample.component?.name === name) return "That source name is already owned. Choose another name.";
    return "";
  }
  function namedOperation(kind: "extract" | "copy") {
    if (kind === "extract" && (!active().starter || sample.component || active().copyName)) { report("Select an ordinary supported group before making a component."); return; }
    if (kind === "copy" && refuse()) return;
    openDialog(kind === "copy" ? "Make one use independent" : "Make component", `<p>${kind === "copy" ? `Copy only the use in ${escape(active().name)} into a new owned component. Other uses keep route_guide.` : `Move the selected supported group into an owned component. Replace this group in ${escape(active().name)} with one use.`}</p><label class="cp-field">Component name<input name="component-name" value="${kind === "copy" ? "help_guide" : "route_guide"}"></label><p class="cp-form-error" role="alert"></p><p>Parameterless component · Close stays in its owning panel.</p><div class="cp-actions">${button(`confirm-${kind}`, kind === "copy" ? "Create independent copy" : "Create component", true)}${button("dialog-close", "Cancel")}</div>`, "component-name");
  }
  function openNew() {
    openDialog("New screen", `<label class="cp-field">Screen name<input name="new-name" value="help_panel"></label><fieldset><legend>Start with</legend><label class="cp-option"><input type="radio" name="starter" value="help" checked><span><strong>Help panel</strong><br>Title, explanation, tram image and Close. Edit every node later.</span></label><label class="cp-option"><input type="radio" name="starter" value="blank"><span><strong>Blank</strong><br>An empty screen for your own layout.</span></label></fieldset><p><strong>Type: Panel</strong> · Shown without stopping dialogue.</p><p>Close and game Escape dismiss it. Outside clicks keep it open.</p><div class="cp-starter-preview"><img src="${tram}" alt="Tram emblem sample image"><span>Help<br>Choose a route. The last tram leaves at midnight.<br>Close</span></div><p class="cp-form-error" role="alert"></p><div class="cp-actions">${button("confirm-new", "Create screen", true)}${button("dialog-close", "Cancel")}</div>`, "new-name");
  }
  function openInsert() {
    if (!sample.component || sample.component.state !== "available") { report("No available owned component. Normal screens and panels are not components."); return; }
    openDialog("Use an owned component", `<label class="cp-field">Component<select name="component"><option value="component-guide">${escape(sample.component.name)} · Component</option></select></label><p>Only explicitly owned components appear here. Normal screens and panels are separate.</p><label class="cp-field">Screen<select name="insert-screen">${sample.screens.map(s => `<option value="${s.id}" ${!s.use ? "selected" : ""}>${escape(s.name)}</option>`).join("")}</select></label><label class="cp-field">Insertion parent<select name="insert-parent"><option value="panel-frame">Panel frame</option></select></label><p>Insert the component as a child of this frame. This sample has one eligible parent per screen.</p><p class="cp-form-error" role="alert"></p><div class="cp-actions">${button("confirm-insert", "Insert use", true)}${button("dialog-close", "Cancel")}</div>`);
  }
  function showSource(target = "screen") {
    const files = source(sample); let path = target === "component" ? "game/ui/components.rpy" : target.startsWith("beat") ? "game/night_route.rpy" : `game/ui/${active().name}.rpy`;
    const file = files.find(item => item.path === path); let lineNumber = 2;
    if (target === "component" && active().copyName) lineNumber = (file?.lines.findIndex(text => text === `screen ${active().copyName}():`) ?? 1) + 1;
    if (target.startsWith("beat")) { const beat = sample.beats.find(b => b.id === target.slice(5)); lineNumber = (file?.lines.findIndex(text => text.trim() === `${beat?.kind} screen ${beat?.targetName}`) ?? -1) + 1; }
    if (!file) path += " · definition unavailable";
    openDialog("Exact sample Source", `<p><code>${escape(path)}:${lineNumber}</code></p><p>Saved sample Source. Pending drafts are not written here.</p><div class="cp-source">${file ? file.lines.map((text, i) => `<div class="${i + 1 === lineNumber ? "cp-source-selected" : ""}"><span>${i + 1}</span><code>${escape(text)}</code></div>`).join("") : "Definition missing. The saved identity has not been rebound."}</div><details><summary>Stable reference</summary><code>${target === "component" ? "component-guide" : target.startsWith("beat") ? escape(target.slice(5)) : escape(screenId)} · sample revision ${sample.revision}</code></details>${button("dialog-close", "Back to editor")}`);
  }
  function apply() {
    if (!dirty() || refuse()) return;
    if (!values().title.trim() || !values().explanation.trim()) { error = "Enter a title and explanation. Draft retained."; render(); host.querySelector<HTMLInputElement>("[name=title]")?.focus(); return; }
    if (variant === "worksheet") { reviewInline = true; render(); host.querySelector(".cp-inline-review")?.scrollIntoView({ block: "nearest" }); }
    else openDialog("Review affected screens", reviewBody());
  }
  function finishApply() {
    if (refuse()) { closeDialog(); return; }
    const next = copy(sample), d = values(), c = shared();
    const changed = { title: d.title, explanation: d.explanation, width: d.width, height: d.height, fontSize: d.fontSize, image: d.image };
    if (c) { Object.assign(next.component!, changed); next.component!.revision++; componentUses(next).forEach(s => s.revision++); }
    else { const screen = next.screens.find(s => s.id === screenId)!; if (selection !== "close") Object.assign(screen, changed); screen.closeLabel = d.closeLabel; screen.revision++; }
    drafts.delete(draftKey()); reviewInline = false; closeDialog(); accept(next, "Changes applied.");
  }
  function openBeat() {
    openDialog("Add screen Beat", `<label class="cp-field">Operation<select name="beat-kind"><option value="show">Show screen</option><option value="hide">Hide screen</option></select></label><label class="cp-field">Owned panel<select name="beat-screen">${sample.screens.map(s => `<option value="${s.id}">${escape(s.name)} · Panel</option>`).join("")}</select></label><p>Uses a stable owned-screen identity. Components do not appear in this picker.</p><p>Show continues dialogue. Hide removes the shown panel.</p><p class="cp-form-error" role="alert"></p><div class="cp-actions">${button("confirm-beat", "Insert Beat", true, !sample.screens.length)}${button("dialog-close", "Cancel")}</div>`);
  }
  function runSimulation() {
    const invalid = sample.beats.some(b => !sample.screens.some(s => s.id === b.screenId && s.name === b.targetName));
    if (invalid || !available()) { error = "Target unavailable. Playback refused; saved references are retained."; render(); return; }
    shown = true; line = 0;
    const target = sample.screens.find(s => s.id === sample.beats.find(b => b.kind === "show")?.screenId) ?? active(), accepted = content(target, false);
    openDialog("Playback simulation", `<p class="cp-simulation-label">Browser simulation · no Ren'Py process</p><div class="cp-play-stage" tabindex="-1"><div class="cp-play-panel"><h3>${escape(accepted.title)}</h3><img src="${accepted.image === "tram" ? tram : route}" alt="Fictional sample UI image"><p>${escape(accepted.explanation)}</p>${button("play-close", escape(target.closeLabel))}</div><button class="cp-outside" data-action="play-outside">Outside the panel</button></div><div class="cp-play-dialogue"><strong>Conductor</strong><p>The last tram waits by the station.</p></div><div class="cp-actions">${button("play-next", "Next dialogue", true)}${button("play-show", "Show panel")}${button("play-hide", "Hide panel")}${button("dialog-close", "Return to editor")}</div><p class="cp-play-status" role="status">Panel shown. Keyboard focus starts on Close. Game Escape dismisses the panel.</p>`);
    modal!.classList.add("cp-play"); modal!.querySelector<HTMLButtonElement>('[data-action="play-close"]')!.focus();
    modal!.addEventListener("cancel", event => { event.preventDefault(); if (shown) setShown(false, "Game Escape dismissed the panel. Dialogue continues."); else closeDialog(); });
  }
  function setShown(value: boolean, message: string) {
    shown = value; modal!.querySelector<HTMLElement>(".cp-play-panel")!.hidden = !shown;
    modal!.querySelector<HTMLElement>(".cp-play-status")!.textContent = message;
    modal!.querySelector<HTMLButtonElement>(`[data-action="${shown ? "play-close" : "play-next"}"]`)!.focus();
  }
  function ordinaryEditor() {
    const d = values();
    openDialog("Edit ordinary nodes", `<p>Help starter nodes use the ordinary editing operations. This small sample shows image and title changes; existing layout, Style, add/remove and reordering retain their approved editor.</p><label class="cp-field">Typed UI-image asset<select name="node-image"><option value="tram" ${d.image === "tram" ? "selected" : ""}>Tram emblem · UI image</option><option value="route" ${d.image === "route" ? "selected" : ""}>Route map · UI image</option></select></label><div class="cp-field-pair"><label class="cp-field">Width (px)<input name="node-width" type="number" min="1" value="${d.width}"></label><label class="cp-field">Height (px)<input name="node-height" type="number" min="1" value="${d.height}"></label></div><label class="cp-field">Title font size<input name="node-font" type="number" min="1" value="${d.fontSize}"></label><p>These values join the pending draft. Apply still reviews the affected screens.</p><p class="cp-form-error" role="alert"></p><div class="cp-actions">${button("node-draft", "Keep in draft", true)}${button("dialog-close", "Cancel")}</div>`);
  }
  const events = new AbortController();
  host.addEventListener("click", event => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action],[data-select],[data-open-screen]"); if (!target) return;
    if (target.dataset.select) { selection = target.dataset.select; render(); host.querySelector<HTMLInputElement>(selection === "close" ? "[name=close-label]" : selection === "explanation" ? "[name=explanation]" : "[name=title]")?.focus({ preventScroll: true }); if (selection === "image") report("Tram emblem selected. Use Edit image for its existing editing route."); if (selection === "close") report("Close selected for editing. Canvas actions stay inert."); return; }
    if (target.dataset.openScreen) { screenId = target.dataset.openScreen; step = "design"; error = ""; render(); return; }
    const action = target.dataset.action!;
    if (action.startsWith("step-")) { step = action.slice(5); error = ""; render(); return; }
    if (action.startsWith("beat-source-")) { showSource(`beat:${action.slice(12)}`); return; }
    if (["undo", "redo"].includes(action)) {
      if (drafts.size) { report("Apply or cancel the retained draft before using history."); return; }
      const from = action === "undo" ? undo : redo, to = action === "undo" ? redo : undo;
      if (from.length) { to.push(copy(sample)); sample = from.pop()!; if (!sample.screens.some(s => s.id === screenId)) screenId = sample.screens[0]!.id; notice = `${action === "undo" ? "Undo" : "Redo"} restored sample Source and identities.`; render(); } return;
    }
    switch (action) {
      case "new": openNew(); break;
      case "source": showSource(); break;
      case "source-component": showSource(shared() || active().copyName ? "component" : "screen"); break;
      case "dialog-close": closeDialog(); break;
      case "extract": namedOperation("extract"); break;
      case "copy": namedOperation("copy"); break;
      case "confirm-extract": case "confirm-copy": {
        const name = modal!.querySelector<HTMLInputElement>("[name=component-name]")!.value.trim(), problem = nameProblem(name);
        if (problem) { modal!.querySelector(".cp-form-error")!.textContent = problem; break; }
        if (drafts.size) { modal!.querySelector(".cp-form-error")!.textContent = "Apply or cancel the retained draft first."; break; }
        const next = copy(sample), screen = next.screens.find(s => s.id === screenId)!;
        if (action === "confirm-extract") { next.component = { width: screen.width, height: screen.height, fontSize: screen.fontSize, image: screen.image, closeLabel: screen.closeLabel, id: "component-guide", name, title: screen.title, explanation: screen.explanation, revision: 1, state: "available", unknown: false }; screen.use = true; }
        else { const c = sample.component!; Object.assign(screen, { title: c.title, explanation: c.explanation, width: c.width, height: c.height, fontSize: c.fontSize, image: c.image }); screen.copyName = name; screen.use = false; screen.local = true; }
        screen.revision++; closeDialog(); accept(next, action === "confirm-copy" ? "Only this use now refers to the new independent component." : "Owned component created; the selected group is now one use."); break;
      }
      case "add-use": openInsert(); break;
      case "confirm-insert": {
        const id = modal!.querySelector<HTMLSelectElement>("[name=insert-screen]")!.value, next = copy(sample), screen = next.screens.find(s => s.id === id)!;
        if (screen.use) { modal!.querySelector(".cp-form-error")!.textContent = "This sample already has a use in that frame. Choose the other screen."; break; }
        if (screen.starter) screen.retainedGroup = { title: screen.title, explanation: screen.explanation };
        screen.use = true; screen.starter = true; screen.revision++; screenId = screen.id; closeDialog(); accept(next, "Use inserted in the chosen panel frame. Existing content retained."); break;
      }
      case "uses": openDialog("Component uses", `<p>${escape(sample.component?.name ?? "route_guide")} · explicitly owned component</p><table class="cp-table"><thead><tr><th>Screen</th><th>Reference</th></tr></thead><tbody>${componentUses(sample).map(s => `<tr><td>${escape(s.name)}</td><td><code>${s.id}/use-guide</code> · r1</td></tr>`).join("")}</tbody></table><p>Only these uses change on shared Apply.</p>${button("source-component", "Component Source")}${button("dialog-close", "Back to editor")}`); break;
      case "apply": apply(); break;
      case "confirm-apply": finishApply(); break;
      case "back-review": reviewInline = false; closeDialog(); render(); break;
      case "cancel": drafts.delete(draftKey()); reviewInline = false; error = ""; notice = "Editor operation cancelled. Saved Source unchanged."; render(); break;
      case "confirm-new": {
        const name = modal!.querySelector<HTMLInputElement>("[name=new-name]")!.value.trim(), problem = nameProblem(name);
        if (problem) { modal!.querySelector(".cp-form-error")!.textContent = problem; break; }
        const starter = modal!.querySelector<HTMLInputElement>("[name=starter]:checked")!.value === "help", next = copy(sample);
        const id = `screen-created-${next.revision}`; next.screens.push({ ...defaultVisual(), id, name, title: "Help", explanation: "Choose a route. The last tram leaves at midnight.", starter, use: false, local: false, revision: 1 });
        screenId = id; step = "design"; closeDialog(); accept(next, `${starter ? "Editable Help starter" : "Blank panel"} created.`); break;
      }
      case "add-beat": openBeat(); break;
      case "confirm-beat": {
        const id = modal!.querySelector<HTMLSelectElement>("[name=beat-screen]")!.value, kind = modal!.querySelector<HTMLSelectElement>("[name=beat-kind]")!.value as "show" | "hide";
        const screen = sample.screens.find(s => s.id === id); if (!screen) { modal!.querySelector(".cp-form-error")!.textContent = "Target unavailable. Choose a current owned panel explicitly."; break; }
        const next = copy(sample); next.beats.push({ id: `beat-${kind}-${sample.revision}`, kind, screenId: id, targetName: screen.name, revision: 1 }); closeDialog(); accept(next, `${kind === "show" ? "Show" : "Hide"} Beat inserted with a stable screen reference.`); break;
      }
      case "play": runSimulation(); break;
      case "play-close": setShown(false, "Close hid the panel. Dialogue continues."); break;
      case "play-hide": setShown(false, "Hide removed the panel. Dialogue continues."); break;
      case "play-show": setShown(true, "Panel shown. Focus returned to Close."); break;
      case "play-outside": modal!.querySelector(".cp-play-status")!.textContent = shown ? "Outside click kept the panel open." : "Panel remains hidden."; break;
      case "play-next": line++; modal!.querySelector(".cp-play-dialogue p")!.textContent = ["We can read the guide while the tram moves.", "Next stop, the old observatory."][Math.min(line - 1, 1)]!; modal!.querySelector(".cp-play-status")!.textContent = shown ? "Dialogue advanced. Help is still visible." : "Dialogue advanced. Help remains hidden."; break;
      case "image": case "existing": ordinaryEditor(); break;
      case "node-draft": {
        const width = Number(modal!.querySelector<HTMLInputElement>("[name=node-width]")!.value), height = Number(modal!.querySelector<HTMLInputElement>("[name=node-height]")!.value), fontSize = Number(modal!.querySelector<HTMLInputElement>("[name=node-font]")!.value);
        if (![width, height, fontSize].every(n => Number.isInteger(n) && n > 0 && n <= 4096)) { modal!.querySelector(".cp-form-error")!.textContent = "Enter whole pixel values between 1 and 4096. Draft retained."; break; }
        const d = copy(values()); Object.assign(d, { width, height, fontSize, image: modal!.querySelector<HTMLSelectElement>("[name=node-image]")!.value }); const saved = shared() || active();
        if (["title", "explanation", "width", "height", "image", "fontSize"].every(key => d[key as keyof Draft] === saved[key as keyof typeof saved])) drafts.delete(draftKey()); else drafts.set(draftKey(), d); closeDialog(); render(); break;
      }
      case "focus-preview": host.querySelector(".cp-canvas")?.scrollIntoView({ block: "start" }); break;
      case "reopen": notice = "Reopened accepted sample Source. Stable identities, history and retained draft stay in this browser session."; render(); break;
      case "reset": sample = fixture(context.state); screenId = "screen-help"; drafts.clear(); undo.length = redo.length = 0; error = ""; reviewInline = false; notice = "Fresh fictional sample."; render(); break;
    }
  }, { signal: events.signal });
  host.addEventListener("input", event => {
    const input = event.target as HTMLInputElement;
    if (!["title", "explanation", "close-label"].includes(input.name)) return;
    const saved = shared() || active(), d = copy(values()); d[(input.name === "close-label" ? "closeLabel" : input.name) as "title" | "explanation" | "closeLabel"] = input.value;
    if (["title", "explanation", "width", "height", "image", "fontSize", "closeLabel"].every(key => d[key as keyof Draft] === saved[key as keyof typeof saved])) drafts.delete(draftKey()); else drafts.set(draftKey(), d);
    reviewInline = false; render();
  }, { signal: events.signal });
  host.addEventListener("change", event => {
    const input = event.target as HTMLSelectElement;
    if (input.name === "screen") { screenId = input.value; error = ""; selection = "group"; render(); }
    if (input.name === "external" && input.value) {
      sample.revision++;
      if (sample.component) {
        if (input.value === "rename") sample.component.state = "renamed";
        if (input.value === "delete") sample.component.state = "deleted";
        if (input.value === "unknown") sample.component.unknown = true;
        sample.component.revision++;
      }
      if (input.value === "panel-rename") sample.screens[0]!.name = "help_changed";
      if (input.value === "panel-delete") { sample.screens = sample.screens.filter(s => s.id !== "screen-help"); if (screenId === "screen-help") screenId = sample.screens[0]!.id; }
      notice = "Simulated Source changed. Original identities remain; pending drafts keep their base revision.";
      if (dirty()) error = "Source changed after this draft began. Draft retained."; render();
    }
    if (input.name === "starter") { modal!.querySelector<HTMLElement>(".cp-starter-preview")!.hidden = input.value === "blank"; }
  }, { signal: events.signal });
  host.addEventListener("keydown", event => {
    if (event.key !== "Escape" || modal || event.isComposing) return;
    if (dirty()) { event.preventDefault(); drafts.delete(draftKey()); error = ""; reviewInline = false; notice = "Editor Escape cancelled the pending editor operation. Saved Source unchanged."; render(); }
  }, { signal: events.signal });
  render(); if (context.state === "starter") openNew();
  return () => { events.abort(); modal?.remove(); host.replaceChildren(); host.classList.remove("cp-host"); };
}
