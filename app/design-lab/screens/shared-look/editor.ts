// A4 extends the existing editor study with explicit scope and any number of uses.
import type { LabMount } from "../../contracts.ts";
import { action, element as el, labPage } from "../../page.ts";
import { ScreensWorkspace, type ScreenNode, type ScreenDocument } from "../../../src/screen-ui.ts";
import type { CompositionCommand } from "../../../src/screen-composition.ts";
import { loadPreferences } from "../../../src/preferences.ts";
import { icon } from "../../../src/icons.ts";
import { fixture, clone, equal, useKey, resolvedValues, applyText, changeLook, source, render, type Sample, type PendingLook, type Appearance } from "./editor-sample.ts";
import "../../../src/screen-ui.css";
import "./editor.css";

export const mount: LabMount = async (host, context) => {
  await loadPreferences();
  document.documentElement.dataset.theme = context.theme;
  let sample = fixture(context.state), disposed = false;
  const past: Sample[] = [], future: Sample[] = [], pending = new Map<string, PendingLook>();
  let bypass = false, review: HTMLDialogElement | null = null;
  let enteredDesign = new URLSearchParams(location.search).get("entry") !== "design";
  let lastField: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null = null;
  const frame = labPage(host, context, { screen: "screens", title: "Screens", subtitle: "", dirty: () => workspace.hasDraft() || pending.size > 0 });
  frame.shell.classList.add("look-integrated"); frame.heading.remove();
  frame.shell.querySelector(".lp-sample")!.textContent = "A4 · Shared styles · Draft";
  frame.shell.querySelector(".lp-fiction")!.textContent = "Browser mock · Memory-only source and canvas";
  const nav = frame.shell.querySelector(".lp-navigation")!;
  const screens = action("Screens", () => { workspace.panel.querySelector<HTMLElement>(".screen-heading h1")?.focus(); });
  screens.className = "tree-item selected"; screens.ariaLabel = screens.title = "Screens"; screens.ariaCurrent = "page"; screens.prepend(icon("panel"));
  nav.querySelector('[aria-label="Source"]')!.after(screens);
  if (innerWidth >= 1000) (frame.shell.querySelector(".lp-project-shell") as HTMLElement).dataset.navigationCollapsed = "false";
  const details = el("details", "sle-state"), state = el("pre"); details.append(el("summary", "", "Prototype details"), el("p", "", "Actual editor renderer, fictional services. Shared styles are a prototype. The canvas is browser-drawn; no project files or Ren'Py process are opened."), state);
  const workspace = new ScreensWorkspace({
    projectId: "shared-style-study", resolution: { width: 1280, height: 720 }, current: () => !disposed,
    coordinate: task => task(), source: () => report("Source editing remains in its existing application workflow. This mock shows saved sample Source only."),
    preview: (_target, validate) => report(validate ? "Browser mock: validation starts no SDK." : "Browser mock: Test in Ren'Py starts no process."),
    saved: () => { update(); },
    request: async <T>(operation: string, payload: Record<string, unknown> = {}): Promise<T> => {
      if (operation === "source.list") return { files: sample.documents.map(doc => ({ path: doc.path })) } as T;
      if (operation === "screens.list") return { projectRevision: `project-${sample.revision}`, sourceMapRevision: `map-${sample.revision}`, inventoryRevision: "sample", owned: sample.documents.map(doc => ({ id: doc.screens[0]!.name, rootId: "root", name: doc.screens[0]!.name, path: doc.path, resolved: true, sourceRevision: doc.revision })) } as T;
      if (operation === "screens.inspect") return clone(sample.documents.find(doc => doc.path === payload.path)) as T;
      if (operation === "authoring.list") return { assets: [] } as T;
      if (operation === "screens.canvasRender") {
        const doc = sample.documents.find(doc => doc.path === payload.path)!; return render(doc, payload) as T;
      }
      if (operation === "source.open") { const doc = sample.documents.find(doc => doc.path === payload.path)!; return { path: doc.path, text: source(sample, doc), dirty: false, baseRevision: doc.revision, hasBom: false } as T; }
      if (operation === "scene.list") return { projectRevision: `project-${sample.revision}`, sourceMapRevision: `map-${sample.revision}` } as T;
      if (operation === "scene.apply") {
        const undo = (payload.command as { type: string }).type === "undo", from = undo ? past : future, to = undo ? future : past;
        if (from.length) { to.push(clone(sample)); sample = from.pop()!; pending.clear(); } updateState(); return {} as T;
      }
      if (operation === "screens.compose") {
        refuseChanged();
        const doc = sample.documents.find(doc => doc.screens[0]!.name === payload.screenId)!;
        if (payload.expectedRevision !== doc.revision) throw Error("Sample Source changed. Draft retained.");
        const command = payload.command as CompositionCommand;
        if (command.type !== "formatText") throw Error("This shared-look study supports existing text and layout edits. Structural changes remain in their existing workflow.");
        const next = clone(sample), nextDoc = next.documents.find(d => d.path === doc.path)!;
        const node = nextDoc.screens[0]!.nodes.find(n => n.id === command.nodeId)!;
        applyText(next, nextDoc, command, pending.get(useKey(doc, node))); accept(next); pending.delete(useKey(doc, node));
        return { document: clone(sample.documents.find(d => d.path === doc.path)), selectedId: command.nodeId, changed: true } as T;
      }
      if (operation === "screens.setLayout") {
        refuseChanged(); const next = clone(sample), doc = next.documents.find(d => d.path === payload.path)!;
        const node = doc.screens[0]!.nodes.find(n => n.span.start === payload.nodeStart)!;
        for (const [key, value] of Object.entries(payload.values as Record<string, unknown>)) {
          if (value === null) delete node.numericLayout!.values[key]; else node.numericLayout!.values[key] = value as { unit: "pixels"; value: number };
        }
        accept(next); return clone(sample.documents.find(d => d.path === doc.path)) as T;
      }
      throw Error(`This prototype does not perform ${operation}. The existing application owns that operation.`);
    },
  });
  workspace.mount(frame.content); workspace.panel.append(details);
  workspace.panel.querySelector(".screen-limits")!.textContent = "Custom Python and unsupported regions stay in Source.";
  workspace.panel.querySelector<HTMLElement>(".screen-heading h1")!.tabIndex = -1;
  const observer = new MutationObserver(update); observer.observe(workspace.panel, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "aria-pressed"] });
  const events = new AbortController();
  workspace.panel.addEventListener("focusin", event => {
    const target = event.target;
    if ((target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) && target.closest(".screen-card")) lastField = target;
  }, { signal: events.signal });
  workspace.panel.addEventListener("click", event => {
    const target = event.target as HTMLElement;
    if (pending.size && target.closest(".screen-tools button") && ["Undo", "Redo"].includes(target.closest("button")!.textContent ?? "")) { event.preventDefault(); event.stopImmediatePropagation(); report("Apply or cancel the pending look change before using history."); return; }
    if (target.closest("[data-text-cancel]")) { const selected = selection(); if (selected) pending.delete(useKey(selected.doc, selected.node)); queueMicrotask(update); }
    if (!bypass && target.closest("[data-text-apply]") && needsReview()) { event.preventDefault(); event.stopImmediatePropagation(); openReview(); }
  }, { capture: true, signal: events.signal });
  workspace.panel.addEventListener("keydown", event => {
    if (event.key !== "Enter" || event.isComposing || event.keyCode === 229 || review || bypass) return;
    if (event.target instanceof HTMLTextAreaElement && !event.ctrlKey && !event.metaKey) return;
    if ((event.target as HTMLElement).closest(".screen-card.screen-text") && needsReview()) { event.preventDefault(); event.stopImmediatePropagation(); openReview(); }
  }, { capture: true, signal: events.signal });
  function report(message: string) { frame.status.textContent = message; }
  function refuseChanged() {
    if (context.state === "stale") throw Error("A shared use changed in Source. Nothing was applied.");
    if (context.state === "missing") throw Error("A shared use is missing. Nothing was applied.");
  }
  function accept(next: Sample) {
    if (equal(next, sample)) return;
    past.push(clone(sample)); future.length = 0; next.revision++;
    next.documents.forEach(doc => doc.revision = `sample-${next.revision}`); sample = next; updateState();
  }
  function selection(): { doc: ScreenDocument; node: ScreenNode } | undefined {
    const picker = workspace.panel.querySelector<HTMLSelectElement>(".screen-picker select"); if (!picker?.value) return;
    const [, id] = JSON.parse(picker.value) as string[];
    const doc = sample.documents.find(d => d.screens[0]!.name === id); if (!doc) return;
    const picked = workspace.panel.querySelector<HTMLElement>(".screen-node[aria-pressed=true]");
    const selected = workspace.panel.querySelector<HTMLElement>(".screen-tree [aria-selected=true]");
    const node = selected?.dataset.nodeId ? doc.screens[0]!.nodes.find(n => n.id === selected.dataset.nodeId) : picked ? doc.screens[0]!.nodes[Number(picked.dataset.index)] : undefined;
    return node && { doc, node };
  }
  function formValues(): Appearance {
    const values: Record<string, unknown> = {};
    workspace.panel.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-text-field]").forEach(input => {
      const field = input.dataset.textField!; if (["text", "font"].includes(field) || !(input instanceof HTMLInputElement || input instanceof HTMLSelectElement)) return;
      if (input.value) values[field] = ["size", "align"].includes(field) ? Number(input.value) : ["bold", "italic"].includes(field) ? input.value === "True" : input.value;
    }); return values as Appearance;
  }
  function formValid() { const values = formValues(); return (!values.color || /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(values.color)) && (values.size === undefined || Number.isInteger(values.size) && values.size >= 1 && values.size <= 256); }
  function targets() {
    const selected = selection(); if (!selected) return [];
    const key = useKey(selected.doc, selected.node), choice = pending.get(key), id = choice?.id ?? sample.uses[key];
    if (choice?.independent || !appearanceChanged()) return [key];
    return [...new Set([...Object.keys(sample.uses).filter(use => sample.uses[use] === id), key])];
  }
  function appearanceChanged() {
    const selected = selection(); if (!selected?.node.textProperties) return false;
    return !equal(formValues(), resolvedValues(sample, selected.doc, selected.node, pending.get(useKey(selected.doc, selected.node))));
  }
  function needsReview() {
    const selected = selection(); return !!selected?.node.textProperties && formValid() && (!!pending.get(useKey(selected.doc, selected.node)) || appearanceChanged() && targets().length > 1);
  }
  function updateState() { const text = JSON.stringify({ accepted: sample, pending: [...pending], history: past.length, redo: future.length }, null, 2); if (state.textContent !== text) state.textContent = text; }
  function setText(target: Element, text: string) { if (target.textContent !== text) target.textContent = text; }
  function update() {
    if (disposed) return;
    if (!enteredDesign) { const body = workspace.panel.querySelector('[data-node-id="body"]'); if (body) { enteredDesign = true; body.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })); } }
    const status = workspace.panel.querySelector(".screen-canvas-status"); if (status && workspace.panel.querySelector(".screen-render")) setText(status, "Browser sample canvas. Ren'Py is not running.");
    const image = workspace.panel.querySelector<HTMLImageElement>(".screen-render"); if (image?.alt !== "Browser-drawn screen sample" && image) { image.alt = "Browser-drawn screen sample"; image.ariaLabel = "Screen canvas sample"; }
    const selected = selection(), typography = workspace.panel.querySelector(".screen-text-typography");
    if (!selected?.node.textProperties || !typography) { updateState(); return; }
    const key = useKey(selected.doc, selected.node), choice = pending.get(key), id = choice?.id ?? sample.uses[key]!;
    let row = typography.querySelector<HTMLElement>(".sle-look");
    if (!row) {
      row = el("section", "sle-look"); row.ariaLabel = "Shared style";
      const heading = el("div", "sle-look-heading"), name = el("strong"); name.dataset.lookName = "";
      const label = el("span"); label.dataset.styleLabel = "";
      heading.append(label, name, action("Change style…", chooseLook));
      const sharing = el("p"); sharing.dataset.lookSharing = "";
      const viewUses = action("View uses", () => openReview(true)); viewUses.dataset.viewUses = "";
      const independent = action("Edit only this element", () => { const selected = selection()!; const key = useKey(selected.doc, selected.node), current = pending.get(key); pending.set(key, { id: current?.id ?? sample.uses[key]!, independent: !current?.independent }); if (!pending.get(key)!.independent && pending.get(key)!.id === sample.uses[key]) pending.delete(key); update(); }); independent.dataset.lookIndependent = "";
      row.append(heading, sharing, viewUses, independent); typography.querySelector("h3")!.after(row);
    }
    setText(row.querySelector("[data-look-name]")!, sample.looks[id]!.name);
    const uses = Object.keys(sample.uses).filter(use => sample.uses[use] === id), count = new Set(uses.map(use => use.split("/")[0])).size;
    setText(row.querySelector("[data-style-label]")!, uses.length > 1 ? "Shared style:" : "Style:");
    setText(row.querySelector("[data-look-sharing]")!, choice?.independent ? "Only this element will change. Others keep their shared style." : uses.length > 1 ? `Used on ${count} screen${count === 1 ? "" : "s"} · ${uses.length} elements` : uses.length === 1 ? "Used only on this element." : "Not used yet. Apply to use on this element.");
    const viewUses = row.querySelector<HTMLButtonElement>("[data-view-uses]")!; viewUses.hidden = !!choice?.independent;
    const independent = row.querySelector<HTMLButtonElement>("[data-look-independent]")!; independent.hidden = uses.length < 2; setText(independent, choice?.independent ? "Edit the shared style instead" : "Edit only this element");
    const blocked = context.state === "expression";
    row.querySelectorAll<HTMLButtonElement>("button").forEach(button => { if (button.disabled !== blocked) button.disabled = blocked; });
    if (choice) for (const selector of ["[data-text-apply]", "[data-text-cancel]"]) { const button = workspace.panel.querySelector<HTMLButtonElement>(selector); if (button?.disabled && !blocked) button.disabled = false; }
    const apply = workspace.panel.querySelector<HTMLButtonElement>("[data-text-apply]");
    if (apply) {
      const affected = targets(), screens = new Set(affected.map(use => use.split("/")[0])).size;
      setText(apply, choice?.independent ? "Apply to this element…" : appearanceChanged() && affected.length > 1 ? `Apply to ${screens} screen${screens === 1 ? "" : "s"}…` : "Apply");
      const scope = workspace.panel.querySelector(".screen-text-state");
      if (scope && choice?.independent) setText(scope, "Only this element will change. Other uses stay unchanged.");
      else if (scope && appearanceChanged() && affected.length > 1) setText(scope, `Shared appearance changes apply to ${screens} screen${screens === 1 ? "" : "s"} and ${affected.length} elements.`);
    }
    updateState();
  }
  function chooseLook() {
    const selected = selection(); if (!selected || context.state === "expression") return;
    const modal = el("dialog", "lp-dialog sle-chooser"); modal.ariaLabel = "Choose a style"; modal.append(el("h2", "", "Choose a style"));
    for (const [id, look] of Object.entries(sample.looks)) {
      const button = action("", () => {
        pending.set(useKey(selected.doc, selected.node), { id, independent: false });
        for (const [field, value] of Object.entries(look.values)) {
          const input = workspace.panel.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-text-field=${field}]`); if (!input) continue;
          input.value = typeof value === "boolean" ? value ? "True" : "False" : String(value); input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
        }
        modal.close(); update();
      }); button.classList.add("sle-look-option"); button.append(el("strong", "", look.name), el("small", "", `${look.values.size} px · ${look.values.color}`)); modal.append(button);
    }
    modal.append(action("Cancel", () => modal.close())); modal.onclose = () => modal.remove(); frame.shell.append(modal); modal.showModal();
  }
  function openReview(viewOnly = false) {
    const selected = selection(); if (!selected || review) return;
    const key = useKey(selected.doc, selected.node), choice = pending.get(key), values = formValues();
    const style = choice?.id ?? sample.uses[key]!, allUses = Object.keys(sample.uses).filter(use => sample.uses[use] === style);
    const uses = viewOnly ? allUses : targets();
    const groups = sample.documents.map(doc => ({ doc, name: doc.screens[0]!.name, nodes: doc.screens[0]!.nodes.filter(node => uses.includes(useKey(doc, node))) })).filter(group => group.nodes.length);
    const active = lastField?.isConnected ? lastField : workspace.panel.querySelector<HTMLInputElement>("[data-text-field=color]");
    const start = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement ? active.selectionStart : null, end = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement ? active.selectionEnd : null;
    const body = workspace.panel.querySelector<HTMLElement>(".screen-text-body")!, scroll = body.scrollTop;
    const revision = sample.revision, modal = el("dialog", "lp-dialog sle-review"); review = modal; modal.ariaLabel = viewOnly ? "Shared style uses" : "Review shared style";
    const count = `${groups.length} screen${groups.length === 1 ? "" : "s"} · ${uses.length} element${uses.length === 1 ? "" : "s"}`;
    modal.append(el("h2", "", viewOnly ? `Where ${sample.looks[style]!.name} is used` : choice?.independent ? "Apply only to this element?" : "Apply shared style changes?"), el("p", "sle-review-count", `${count}${viewOnly ? " use this style." : " will update."}`));
    const untouched = new Set(allUses.filter(use => !uses.includes(use)).map(use => use.split("/")[0])).size;
    modal.append(el("p", "sle-review-note", viewOnly ? "Select a screen to inspect its uses. This view shows the saved appearance." : choice?.independent ? `This element gets a separate style. ${untouched} other screen${untouched === 1 ? " keeps" : "s keep"} the shared style.` : "Every use listed here will update. Text content and layout stay on the selected element."));
    const content = el("div", "sle-scope-content"), list = el("div", "sle-use-list"); list.ariaLabel = viewOnly ? "Screens using this style" : "Affected screens";
    const preview = el("section", "sle-scope-preview"); preview.ariaLabel = "Selected screen preview";
    const previewName = el("h3"), image = el("img"), caption = el("p"), elementNames = el("ul");
    preview.append(previewName, image, caption, elementNames);
    const buttons: HTMLButtonElement[] = [];
    const show = (group: typeof groups[number]) => {
      setText(previewName, group.name);
      image.alt = `${group.name} ${viewOnly ? "saved" : "proposed"} appearance`;
      image.src = render(group.doc, { width: 1280, height: 720, textStyles: viewOnly ? [] : group.nodes.map(node => ({ nodeStart: node.span.start, values })) }).image;
      caption.textContent = `${group.nodes.length} element${group.nodes.length === 1 ? "" : "s"} · ${viewOnly ? "Saved appearance" : "After Apply"}`;
      elementNames.replaceChildren(...group.nodes.map(node => el("li", "", node.id === "body" ? "Body text" : node.id === "note" ? "Secondary text" : node.literal?.split("\n")[0] ?? node.kind)));
      buttons.forEach(button => button.ariaPressed = String(button.dataset.screen === group.name));
    };
    for (const group of groups) {
      const button = action("", () => show(group)); button.classList.add("sle-use-row"); button.dataset.screen = group.name;
      button.append(el("strong", "", group.name), el("span", "", `${group.nodes.length} element${group.nodes.length === 1 ? "" : "s"}`));
      buttons.push(button); list.append(button);
    }
    if (groups[0]) show(groups[0]);
    else { list.append(el("p", "", "This style has no saved uses.")); preview.hidden = true; }
    content.append(list, preview); modal.append(content);
    if (!viewOnly && appearanceChanged()) {
      const diff = el("div", "sle-diff"), before = resolvedValues(sample, selected.doc, selected.node, choice);
      const labels = { size: "Size", color: "Color", align: "Alignment", bold: "Bold", italic: "Italic", font: "Font" };
      for (const field of Object.keys(labels) as Array<keyof Appearance>) if (values[field] !== before[field]) diff.append(el("p", "", `${labels[field]}: ${before[field] ?? "Default"} → ${values[field] ?? "Default"}`));
      modal.append(diff);
    }
    const warning = el("p", "sle-warning"); warning.role = "alert"; warning.hidden = true;
    const footer = el("div", "sle-review-actions");
    const close = () => { modal.close(); modal.remove(); review = null; body.scrollTop = scroll; active?.focus({ preventScroll: true }); if ((active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) && start !== null) active.setSelectionRange(start, end); };
    footer.append(action(viewOnly ? "Close" : "Keep editing", close));
    if (!viewOnly) footer.append(action(choice?.independent ? `Apply to ${selected.doc.screens[0]!.name} only` : `Apply to ${groups.length} screen${groups.length === 1 ? "" : "s"}`, () => {
      try { refuseChanged(); if (sample.revision !== revision) throw Error("A use changed. Keep editing to review it again. Your draft is retained."); }
      catch (error) { warning.hidden = false; warning.textContent = (error as Error).message; return; }
      close();
      if (choice && !workspace.hasDraft()) {
        const next = clone(sample), doc = next.documents.find(d => d.path === selected.doc.path)!, node = doc.screens[0]!.nodes.find(n => n.id === selected.node.id)!;
        changeLook(next, doc, node, choice); accept(next); pending.delete(key); void workspace.load().then(update);
      } else { bypass = true; workspace.panel.querySelector<HTMLButtonElement>("[data-text-apply]")!.click(); bypass = false; }
    }, true));
    modal.append(warning, footer); modal.addEventListener("cancel", event => { event.preventDefault(); close(); }); frame.shell.append(modal); modal.showModal();
  }
  updateState();
  return () => { disposed = true; observer.disconnect(); events.abort(); review?.remove(); workspace.dispose(); };
};
