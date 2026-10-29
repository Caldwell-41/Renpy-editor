// A2 explores the choose -> size -> apply loop. All documents and assets are fictional.
import type { LabMount } from "../../contracts.ts";
import { action, element as el, labelled, labPage } from "../../page.ts";
import { icon } from "../../../src/icons.ts";
import { coordinates, labels, unitFor, validate as validateLayout, type Item } from "../nested-layout/refined-model.ts";
import "./style.css";
import "./refined.css";

type Status = "ready" | "missing" | "replaced" | "invalid";
interface Asset { id: string; name: string; path: string; width: number; height: number; art: string; status: Status; version: number }
interface ImageNode { id: string; asset: string; version: number; parent: string; props: Record<string, string> }
interface Snapshot { images: ImageNode[]; selected: string }
interface Problem { key: string; text: string }
const clone = <T,>(v: T): T => structuredClone(v);
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const createImage = (id: string): ImageNode => ({ id, asset: "", version: 1, parent: "content", props: { xsize: "320", ysize: "180", xpos: "0", xanchor: "0", xunit: "px", xaunit: "px" } });
const assetsFixture = (): Asset[] => [
  { id: "tram", name: "Tram emblem", path: "game/assets/ui/tram_emblem.png", width: 640, height: 360, art: "tram", status: "ready", version: 1 },
  { id: "ticket", name: "Night ticket", path: "game/assets/ui/night_ticket.webp", width: 600, height: 240, art: "ticket", status: "ready", version: 1 },
  { id: "route", name: "Route marker", path: "game/assets/ui/route_marker.png", width: 256, height: 256, art: "route", status: "ready", version: 1 },
];
const sourceNumber = (text: string, relative: boolean) => relative && Number.isInteger(+text) ? `${+text}.0` : String(+text);
export const mount: LabMount = (host, context) => {
  const assets = assetsFixture();
  if (["missing", "replaced", "invalid"].includes(context.state)) assets[0]!.status = context.state as Status;
  let images: ImageNode[] = context.state === "add" ? [] : [{ ...createImage("image-1"), asset: "tram" }];
  let selected = context.state === "add" ? "image-2" : "image-1", step = "design", sequence = 2;
  let addition: ImageNode | null = context.state === "add" ? createImage("image-2") : null;
  let returnSelection = "text", conflict = context.state === "conflict", focused = false;
  let picker: HTMLDialogElement | null = null, sourceReturn: HTMLElement | null = null, feedback = "Ready", pickerStage = "choose", pickerSearch = "", pickerReturn = "asset";
  const drafts = new Map<string, ImageNode>(), problems = new Map<string, Problem>(), locks = new Map<string, boolean>();
  const expanded = new Map<string, Set<string>>(), scrolls = new Map<string, number>();
  const history: Snapshot[] = [], future: Snapshot[] = [];
  const accepted = () => images.find(n => n.id === selected);
  const value = () => addition?.id === selected ? addition : drafts.get(selected) ?? accepted();
  const assetFor = (n = value()) => assets.find(a => a.id === n?.asset);
  const hasDraft = () => drafts.size > 0 || !!addition;
  const localDraft = () => !!value() && (addition?.id === selected || drafts.has(selected));
  const locked = () => locks.get(selected) !== false;
  const title = (n: ImageNode) => assets.find(a => a.id === n.asset)?.name ?? "New image";
  const frame = labPage(host, context, { screen: "screens", title: "Screens", subtitle: "", dirty: hasDraft });
  frame.shell.classList.add("image-lab", "image-refined"); frame.shell.dataset.variant = "refined";
  frame.heading.querySelector("p")?.remove();
  frame.shell.querySelector(".lp-sample")!.textContent = "#40 · A2 · Prototype";
  frame.shell.querySelector(".lp-fiction")!.textContent = "Prototype · Memory only · Native import and Ren'Py are simulated";
  const addButton = action("Add element", openAddMenu), undo = action("Undo", () => travel(history, future)), redo = action("Redo", () => travel(future, history));
  const sourceButton = action("Source", openSource); frame.tools.append(addButton, undo, redo, sourceButton);
  const address = el("div", "ui-address", "Help / game/ui/help.rpy"), rail = el("nav", "ui-rail"); rail.ariaLabel = "Screen building steps";
  for (const [id, text] of [["choose", "1  Choose"], ["design", "2  Design"], ["connect", "3  Connect"]]) { const b = action(text!, () => { rememberScroll(); step = id!; renderEditor(); sync(); }); b.dataset.step = id; rail.append(b); }
  const work = el("div", "ui-work"), stage = el("section", "ui-stage"), editor = el("section", "ui-editor");
  stage.ariaLabel = "Screen canvas"; editor.ariaLabel = "Image editor";
  const stageHead = el("div", "ui-stage-heading");
  const resolution = select("Sample resolution", [["1280", "1280 × 720"], ["1024", "1024 × 768"]], "1280", () => draw());
  const zoom = select("Canvas zoom", [["fit", "Fit"], ["1", "100%"]], "fit", () => draw());
  const focus = action("Focus preview", () => { focused = !focused; work.dataset.focus = String(focused); focus.textContent = focused ? "Back to editing" : "Focus preview"; requestAnimationFrame(draw); });
  const editJump = action("Edit image", () => { editor.scrollIntoView({ block: "start" }); focusField("xsize"); }); editJump.classList.add("ir-compact-jump");
  stageHead.append(el("h2", "", "Help"), resolution, zoom, focus, editJump);
  const canvasWrap = el("div", "ui-canvas-wrap"), canvas = el("div", "ui-canvas"); canvas.ariaLabel = "Schematic Help canvas"; canvasWrap.append(canvas);
  const path = el("nav", "ui-path"); path.ariaLabel = "Selection path";
  const previewState = el("p", "ir-preview-state"); previewState.role = "status";
  const coverage = el("div", "ui-coverage"); coverage.append(el("span", "", "Partial coverage · Custom footer stays in Source"), action("Inspect footer", openSource));
  const test = action("Test in Ren'Py", openTest); test.title = "Deliberately test accepted source. This prototype starts no SDK.";
  const stageFoot = el("div", "ir-stage-foot"); stageFoot.append(previewState, test);
  stage.append(stageHead, canvasWrap, path, stageFoot, coverage); work.append(stage, editor); frame.content.append(address, rail, work);
  const labTools = el("details", "ir-lab-tools"), stateText = el("pre"); labTools.append(el("summary", "", "Prototype tools"), el("p", "", "All edits, imports, history and reopen stay in browser memory. Artwork is schematic. No project code runs."), stateText, action("Simulate reopen", reopen));
  stage.append(labTools);
  const sourceDialog = el("dialog", "ui-dialog ui-source-dialog"); sourceDialog.ariaLabel = "Screen source";
  const sourceCode = el("pre", "ui-source"); sourceCode.ariaLabel = "Accepted sample source";
  sourceDialog.append(el("h2", "", "Source · Help"), el("p", "ui-note", "Accepted source. Your pending image edits stay in the inspector."), sourceCode, action("Back to editing", () => sourceDialog.close()));
  if (conflict) sourceDialog.append(action("Simulate source refresh", () => { if (hasDraft()) { sourceDialog.close(); report("Cancel pending edits before refreshing Source. Your draft is kept."); return; } conflict = false; sourceDialog.close(); renderEditor(); sync(); report("Source refreshed in sample."); }));
  sourceDialog.onclose = () => sourceReturn?.focus({ preventScroll: true }); frame.shell.append(sourceDialog);
  const switcher = el("div", "ui-switcher"); switcher.ariaLabel = "Prototype variants";
  switcher.append(action("Previous variant", () => switchVariant(-1)), el("span", "", "A2 · Focused image editor"), action("Next variant", () => switchVariant(1))); switcher.querySelectorAll<HTMLButtonElement>("button").forEach(b => b.ariaLabel = b.textContent); frame.shell.append(switcher);
  const button = (text: string, callback: () => void, className = "") => { const b = action(text, callback); if (className) b.classList.add(className); return b; };

  function report(text: string) { feedback = text; frame.status.textContent = text; }
  function rememberScroll() { const body = editor.querySelector<HTMLElement>(".ui-editor-body"); if (body) scrolls.set(`${selected}/${step}`, body.scrollTop); }
  function choose(id: string) { rememberScroll(); selected = id; step = "design"; renderEditor(); sync(); }
  function edit(key: string, text: string) {
    const before = value(); if (!before) return;
    const n = clone(before); n.props[key] = text;
    if (key === "xsize" || key === "ysize") {
      const a = assetFor(n), other = key === "xsize" ? "ysize" : "xsize";
      if (locked() && a && /^\d+$/.test(text) && +text > 0 && +text <= 16384) { n.props[other] = String(Math.max(1, Math.round(+text * (key === "xsize" ? a.height / a.width : a.width / a.height)))); const peer = editor.querySelector<HTMLInputElement>(`[data-field=${other}]`); if (peer) peer.value = n.props[other]!; }
    }
    storeDraft(n); problems.delete(selected); sync();
  }
  function storeDraft(n: ImageNode) { if (addition?.id === n.id) addition = n; else if (equal(n, images.find(i => i.id === n.id))) drafts.delete(n.id); else drafts.set(n.id, n); }
  function thumbnail(a: Asset, name = a.name) { const img = el("img"); img.src = new URL(`./${a.art}.svg`, import.meta.url).href; img.alt = name; return img; }
  function group(name: string) { const section = el("section", "ir-group"); section.append(el("h3", "", name)); return section; }
  function disclosure(name: string, key: string) { const details = el("details", "ir-group"); details.dataset.group = key; details.open = expanded.get(selected)?.has(key) ?? false; details.append(el("summary", "", name)); details.ontoggle = () => { let set = expanded.get(selected); if (!set) expanded.set(selected, set = new Set()); details.open ? set.add(key) : set.delete(key); }; return details; }
  function inlineError(key: string) { const p = el("p", "ir-inline-error"); p.dataset.error = key; p.id = `ir-error-${selected}-${key}`; p.role = "alert"; p.hidden = true; return p; }
  function field(key: string, name: string, coordinate = false) {
    const n = value()!, input = el("input"); input.type = "text"; input.inputMode = coordinate ? "decimal" : "numeric"; input.value = n.props[key] ?? ""; input.dataset.field = key; input.oninput = () => edit(key, input.value);
    const label = labelled(name, input); label.classList.add("ir-field"); input.setAttribute("aria-describedby", `ir-error-${selected}-${key}`);
    if (coordinate) {
      const controlled = n.parent === "content" && key.startsWith("y"); input.readOnly = controlled; input.placeholder = controlled ? "From group" : "Default";
      const unit = select(`${name} unit`, [["px", "px"], ["relative", "fraction"]], n.props[unitFor[key]!] ?? "px", text => edit(unitFor[key]!, text)); unit.disabled = controlled; label.append(unit);
    } else label.append(el("span", "ir-unit", "px"));
    label.append(inlineError(key)); return label;
  }
  function imageSection(body: HTMLElement) {
    const n = value()!, a = assetFor(n), row = button("", openPicker, "ir-asset-trigger"); row.ariaLabel = a ? `Change image, ${a.name}` : "Choose image"; row.dataset.focusKey = "asset";
    const words = el("span", "ir-asset-words");
    if (a) { row.append(thumbnail(a)); words.append(el("strong", "", a.name), el("small", "", a.path.replace("game/assets/", ""))); }
    else { row.prepend(icon("assets")); words.append(el("strong", "", "Choose an image"), el("small", "", "Use a project asset or import one")); }
    row.append(words, el("span", "ir-change-label", a ? "Change…" : "Choose…")); body.append(row);
    if (a && a.status !== "ready") {
      const warning = el("div", "ir-asset-warning"); warning.role = "status";
      const text = a.status === "missing" ? "Image missing. Restore the file or choose another image." : a.status === "replaced" ? "This file changed. Review it before applying." : "This file cannot be read as an image. Choose another image.";
      warning.append(el("p", "", text), button(a.status === "replaced" ? "Review changed image" : "Choose another image", a.status === "replaced" ? () => openReplacement(a) : openPicker, "ir-text-button")); body.append(warning);
    }
    body.append(inlineError("asset"));
  }
  function sizeSection() {
    const section = group("Displayed size"), fields = el("div", "ir-fields"); fields.append(field("xsize", "Width"), field("ysize", "Height")); section.append(fields);
    const preserve = el("input"); preserve.type = "checkbox"; preserve.checked = locked(); preserve.ariaLabel = "Preserve aspect ratio";
    preserve.title = "Use the image's original ratio when either dimension changes.";
    preserve.onchange = () => { locks.set(selected, preserve.checked); const a = assetFor(); if (preserve.checked && a) edit("xsize", value()!.props.xsize ?? ""); else sync(); };
    const label = el("label", "ui-check"); label.append(preserve, el("span", "", "Preserve aspect ratio")); section.append(label);
    const original = el("div", "ir-original"), a = assetFor();
    if (a) original.append(el("span", "", `Original ${a.width} × ${a.height} px`), button("Use original", () => { const n = clone(value()!); n.props.xsize = String(a.width); n.props.ysize = String(a.height); storeDraft(n); problems.delete(selected); renderEditor(); sync(); focusField("xsize"); }, "ir-text-button"));
    else original.append(el("span", "", "Choose an image to use its original ratio.")); section.append(original); return section;
  }
  function placementSection() {
    const n = value()!, details = group("Position & anchor");
    const parent = select("Inside parent", [["content", "Help content · Vertical group"], ["root", "Screen root · Free layout"], ["frame", "Help frame · One child already"]], n.parent, id => {
      const next = clone(value()!); next.parent = id; if (id === "content") for (const k of ["ypos", "yanchor", "yunit", "yaunit"]) delete next.props[k]; storeDraft(next); problems.delete(selected); renderEditor(); sync();
    }); parent.dataset.focusKey = "parent"; details.append(labelled("Inside parent", parent), inlineError("parent"));
    const fields = el("div", "ir-fields"); for (const key of coordinates) fields.append(field(key, labels[key]!, true)); details.append(fields);
    if (n.parent === "content") details.append(el("p", "ir-parent-note", "The vertical group sets vertical placement. Reorder its children to move this image vertically."));
    const alignment = el("div", "ir-alignment"); alignment.ariaLabel = "Alignment shortcuts";
    for (const [i, name] of ["Top left", "Top center", "Top right", "Middle left", "Center", "Middle right", "Bottom left", "Bottom center", "Bottom right"].entries()) {
      const b = button("", () => { const next = clone(value()!); const x = (i % 3) / 2, y = Math.floor(i / 3) / 2; next.props.xpos = next.props.xanchor = String(x); next.props.xunit = next.props.xaunit = "relative"; if (next.parent !== "content") { next.props.ypos = next.props.yanchor = String(y); next.props.yunit = next.props.yaunit = "relative"; } storeDraft(next); problems.delete(selected); renderEditor(); sync(); }, "ir-align-button"); b.ariaLabel = b.title = name; b.append(el("span")); alignment.append(b);
    } details.append(alignment); return details;
  }
  function limitsSection() { const details = disclosure("Size limits", "limits"), fields = el("div", "ir-fields"); for (const key of ["xminimum", "xmaximum", "yminimum", "ymaximum"]) fields.append(field(key, labels[key]!)); details.append(el("p", "ui-note", "A displayed width or height fixes that axis. Clear it before setting limits."), fields); return details; }
  function renderEditor() {
    const n = value(), isImage = !!n; editor.replaceChildren();
    const heading = el("div", "ui-editor-head"); heading.append(el("h2", "", addition?.id === selected ? "Add image" : isImage ? "Image" : "Help text"), el("span", "ir-draft")); const previewJump = action("Show preview", () => { stage.scrollIntoView({ block: "start" }); stageHead.tabIndex = -1; stageHead.focus({ preventScroll: true }); }); previewJump.classList.add("ir-compact-jump"); heading.append(previewJump); editor.append(heading);
    const body = el("div", "ui-editor-body"); editor.append(body);
    if (step === "choose") renderTree(body);
    else if (step === "connect") body.append(el("p", "ir-empty-note", "Images display an asset and have no game action."), button("Back to image", () => { step = "design"; renderEditor(); sync(); }));
    else if (!isImage) body.append(el("p", "ir-empty-note", "Choose a route. The last tram leaves at midnight."), el("p", "ui-note", hasDraft() ? "Your image edits are kept while you inspect another element." : "This comparison adds image editing to the existing composition workflow."), button(images.length ? "Return to image" : "Add image", () => images.length ? choose(images[0]!.id) : beginAdd()));
    else {
      imageSection(body); body.append(sizeSection()); const layout = disclosure("Layout", "placement"); layout.append(placementSection(), limitsSection());
      if (!addition) {
        const order = disclosure("Order & removal", "order"), row = el("div", "ui-actions"), index = images.findIndex(i => i.id === selected), before = button("Move earlier", () => move(-1)), after = button("Move later", () => move(1)); before.disabled = index <= 0; after.disabled = index >= images.length - 1; row.append(before, after, button("Remove image…", removeImage)); order.append(row); layout.append(order);
      }
      body.append(layout);
    }
    const footer = el("div", "ui-commit"), problem = el("div", "ir-global-error"); problem.role = "alert"; problem.hidden = true;
    const state = el("p", "ir-commit-state"); state.role = "status"; footer.append(problem, state);
    if (step === "design" && isImage) { const actions = el("div", "ui-actions"); const apply = action(addition?.id === selected ? "Add image" : "Apply image", applyImage, true); apply.dataset.apply = ""; const cancel = action("Cancel", cancelImage); cancel.dataset.cancel = ""; actions.append(apply, cancel); footer.append(actions); }
    else if (hasDraft()) footer.append(button("Return to pending image", () => choose(addition?.id ?? [...drafts.keys()][0]!)));
    editor.append(footer); body.scrollTop = scrolls.get(`${selected}/${step}`) ?? 0;
    body.onkeydown = e => { if (e.isComposing) return; if (e.key === "Escape" && isImage && localDraft()) { e.preventDefault(); cancelImage(); } else if (e.key === "Enter" && e.target instanceof HTMLInputElement && e.target.type !== "checkbox") { e.preventDefault(); applyImage(); } };
  }
  function renderTree(body: HTMLElement) {
    const tree = el("div", "ir-tree"); tree.ariaLabel = "Help elements";
    for (const [id, name, depth] of [["root", "Help", 0], ["frame", "Help frame", 1], ["content", "Vertical group", 2], ...images.map(n => [n.id, title(n), n.parent === "root" ? 1 : 3]), ...(addition ? [[addition.id, `${title(addition)} · Draft`, 3]] : []), ["text", "Help text", 3], ["custom", "Custom footer · Source only", 1]] as Array<[string, string, number]>) {
      const row = button(name, () => id === "custom" ? openSource() : choose(images.some(n => n.id === id) || addition?.id === id ? id : "text"), "ui-tree-row"); row.style.paddingLeft = `${4 + depth * 12}px`; row.ariaPressed = String(id === selected); row.prepend(icon(id.startsWith("image-") ? "assets" : "panel")); if (drafts.has(id)) row.append(el("small", "", "Draft")); tree.append(row);
    } body.append(tree);
  }
  function sync() {
    undo.disabled = !history.length; redo.disabled = !future.length;
    rail.querySelectorAll<HTMLButtonElement>("button").forEach(b => b.ariaPressed = String(b.dataset.step === step));
    const n = value(), pending = localDraft(), issue = problems.get(selected);
    editor.querySelector<HTMLElement>(".ir-draft")!.textContent = pending ? "Draft" : "";
    const apply = editor.querySelector<HTMLButtonElement>("[data-apply]"); if (apply) apply.disabled = !pending || !n?.asset;
    const cancel = editor.querySelector<HTMLButtonElement>("[data-cancel]"); if (cancel) cancel.disabled = !pending;
    editor.querySelector<HTMLElement>(".ir-commit-state")!.textContent = issue ? "Draft kept. Nothing was applied." : addition?.id === selected ? n?.asset ? "Ready to add to Help" : "Choose an image to continue" : pending ? "Unapplied changes" : feedback.startsWith("Applied") ? feedback : "No pending changes";
    editor.querySelectorAll<HTMLElement>("[data-error]").forEach(p => { const active = issue?.key === p.dataset.error; p.textContent = active ? issue!.text : ""; p.hidden = !active; });
    editor.querySelectorAll<HTMLInputElement>("[data-field]").forEach(i => { i.ariaInvalid = String(issue?.key === i.dataset.field); });
    const global = editor.querySelector<HTMLElement>(".ir-global-error")!; const globalIssue = !!issue && !editor.querySelector(`[data-error="${issue.key}"]`); global.hidden = !globalIssue; global.replaceChildren();
    if (globalIssue) { global.append(el("p", "", issue!.text)); if (issue!.key === "conflict") global.append(button("Inspect Source", openSource, "ir-text-button")); }
    draw(); sourceCode.textContent = source(); stateText.textContent = JSON.stringify({ selected, images, addition, drafts: Object.fromEntries(drafts), preserveAspect: Object.fromEntries(locks), sourceConflict: conflict, history: history.length, redo: future.length, feedback }, null, 2);
  }
  function validate(n: ImageNode): Problem | undefined {
    const a = assetFor(n);
    if (!a) return { key: "asset", text: "Choose a project UI image." };
    if (a.status !== "ready") return { key: "asset", text: a.status === "missing" ? "This image is missing. Choose another or restore the file." : a.status === "replaced" ? "The file changed. Review the replacement before applying." : "This file cannot be decoded as an image. Choose another." };
    if (n.parent === "frame") return { key: "parent", text: "The frame already has one child. Choose its vertical group or the screen root." };
    const fake = (v: ImageNode): Item => ({ id: v.id, parent: v.parent, kind: "text", text: "", props: v.props });
    const parent: Item = { id: n.parent, parent: "", kind: n.parent === "content" ? "vbox" : "fixed", text: "", props: {} };
    const invalid = validateLayout(fake(n), fake(accepted() ?? createImage(n.id)), parent, 0); if (invalid) return { key: invalid.key, text: invalid.text.replace(/ Your draft is retained\.$/, "") };
    if (locked() && a && (!n.props.xsize || !n.props.ysize)) return { key: !n.props.xsize ? "xsize" : "ysize", text: "Set both displayed dimensions to preserve aspect, or turn aspect preservation off." };
    if (conflict) return { key: "conflict", text: "Source changed outside this editor. Inspect it before retrying." };
  }
  function applyImage() {
    const n = value(); if (!n || !localDraft()) return;
    const issue = validate(n); if (issue) { problems.set(selected, issue); sync(); if (["parent", "xminimum", "xmaximum", "yminimum", "ymaximum"].includes(issue.key)) { const details = editor.querySelector<HTMLDetailsElement>(`[data-group=${issue.key === "parent" ? "placement" : "limits"}]`); if (details) details.open = true; } focusField(issue.key); return; }
    const normalized = clone(n); for (const key of Object.keys(normalized.props)) if (!key.endsWith("unit")) { if (normalized.props[key]) normalized.props[key] = String(+normalized.props[key]!); else delete normalized.props[key]; }
    if (equal(normalized, accepted())) { drafts.delete(selected); problems.delete(selected); renderEditor(); sync(); report("No changes to apply."); return; }
    rememberScroll(); const fieldKey = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.field : undefined;
    history.push({ images: clone(images), selected: addition ? returnSelection : selected }); future.length = 0;
    if (addition?.id === selected) { images.push(normalized); addition = null; } else images[images.findIndex(i => i.id === selected)] = normalized;
    drafts.delete(selected); problems.delete(selected); report(`Applied · ${normalized.props.xsize ?? "Auto"} × ${normalized.props.ysize ?? "Auto"} px`); renderEditor(); sync(); if (fieldKey) focusField(fieldKey);
  }
  function cancelImage() {
    const fieldKey = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.field : undefined;
    rememberScroll(); drafts.delete(selected); problems.delete(selected);
    if (addition?.id === selected) { addition = null; selected = returnSelection; }
    report("Changes cancelled."); renderEditor(); sync(); if (fieldKey) focusField(fieldKey);
  }
  function focusField(key: string) { const input = editor.querySelector<HTMLElement>(`[data-field="${key}"],[data-focus-key="${key}"]`); if (input) { let parent = input.parentElement; while (parent && parent !== editor) { if (parent instanceof HTMLDetailsElement) parent.open = true; parent = parent.parentElement; } input.focus({ preventScroll: false }); } }
  function openAddMenu() {
    const dialog = el("dialog", "ui-dialog ir-add-dialog"); dialog.ariaLabel = "Add element";
    dialog.append(el("h2", "", "Add element"), button("Image", () => { dialog.close(); beginAdd(); }, "ir-add-image"), el("p", "ui-note", "This prototype covers images. Existing element types keep their composition controls."), button("Cancel", () => dialog.close())); dialog.onclose = () => dialog.remove(); frame.shell.append(dialog); dialog.showModal();
  }
  function beginAdd() {
    if (addition) { choose(addition.id); return; }
    if (drafts.size) { problems.set(selected, { key: "pending", text: "Apply or cancel the current draft before adding another image." }); sync(); return; }
    returnSelection = selected; addition = createImage(`image-${++sequence}`); selected = addition.id; step = "design"; renderEditor(); sync(); focusField("asset");
  }
  function travel(from: Snapshot[], to: Snapshot[]) {
    if (hasDraft()) { problems.set(selected, { key: "pending", text: "Apply or cancel pending image edits before using history." }); sync(); return; }
    if (!from.length) return; to.push({ images: clone(images), selected }); const next = from.pop()!; images = clone(next.images); selected = next.selected; problems.clear(); step = "design"; renderEditor(); report("Sample history restored."); sync();
  }
  function move(delta: number) {
    if (hasDraft()) { problems.set(selected, { key: "pending", text: "Apply or cancel pending edits before changing the order." }); sync(); return; }
    const index = images.findIndex(n => n.id === selected), target = index + delta; if (target < 0 || target >= images.length || images[target]!.parent !== accepted()!.parent) return;
    history.push({ images: clone(images), selected }); future.length = 0; [images[index], images[target]] = [images[target]!, images[index]!]; report("Image order changed in sample."); renderEditor(); sync();
  }
  function removeImage() {
    if (hasDraft()) { problems.set(selected, { key: "pending", text: "Apply or cancel pending edits before removing this image." }); sync(); return; }
    const n = accepted(); if (!n) return;
    const dialog = el("dialog", "ui-dialog"); dialog.ariaLabel = "Remove image"; dialog.append(el("h2", "", `Remove ${title(n)}?`), el("p", "", "This removes the screen element. The project asset remains available. Undo can restore the element."), button("Keep image", () => dialog.close()), button("Remove image", () => { history.push({ images: clone(images), selected }); future.length = 0; images = images.filter(i => i.id !== selected); selected = images[0]?.id ?? "text"; dialog.close(); renderEditor(); report("Image removed. The asset is still available."); sync(); })); dialog.onclose = () => dialog.remove(); frame.shell.append(dialog); dialog.showModal();
  }
  function pickerRows(list: HTMLElement, query: string) {
    list.replaceChildren(); const matches = assets.filter(a => `${a.name} ${a.path}`.toLowerCase().includes(query.toLowerCase()));
    for (const a of matches) { const row = button("", () => useAsset(a), "ui-asset-row"); row.ariaLabel = `Use ${a.name}`; row.ariaPressed = String(a.id === value()?.asset); const words = el("span", "ui-asset-words"); words.append(el("strong", "", a.name), el("small", "", `${a.width} × ${a.height} · ${a.path.split(".").pop()!.toUpperCase()}`), el("small", "", a.path.replace("game/assets/", ""))); row.append(thumbnail(a), words); if (a.status !== "ready") row.append(el("span", "ui-reference-status", a.status)); list.append(row); }
    if (!matches.length) list.append(el("p", "ir-no-matches", `No UI images match "${query}".`), button("Clear search", () => { pickerSearch = ""; renderPicker(); }));
  }
  function openPicker() {
    pickerSearch = ""; pickerStage = "choose"; pickerReturn = "asset"; picker = el("dialog", "ui-dialog ir-picker"); picker.ariaLabel = "Choose UI image";
    picker.onclose = () => { picker?.remove(); picker = null; focusField(pickerReturn); }; frame.shell.append(picker); renderPicker(); picker.showModal(); picker.querySelector<HTMLInputElement>("input")?.focus();
  }
  function renderPicker() {
    if (!picker) return; picker.replaceChildren();
    const heading = el("div", "ir-dialog-heading"); heading.append(el("h2", "", pickerStage === "choose" ? "Choose image" : "Import image"), button("Close", () => { picker?.close(); report("Image chooser closed. Your edits are kept."); })); picker.append(heading);
    if (pickerStage === "choose") {
      const toolbar = el("div", "ir-picker-toolbar"), search = el("input"), list = el("div", "ui-asset-list"); search.type = "search"; search.placeholder = "Search project images"; search.ariaLabel = "Search UI images"; search.value = pickerSearch;
      search.oninput = () => { pickerSearch = search.value; pickerRows(list, search.value); }; toolbar.append(search, button("Import image…", () => { pickerStage = "import"; renderPicker(); })); picker.append(toolbar, el("p", "ir-picker-scope", "Project UI images · PNG, JPEG, WebP"), list); pickerRows(list, pickerSearch);
      const note = el("p", "ir-picker-boundary", "Prototype · Selection runs no project code. Imports stay in memory."); picker.append(note);
    } else if (pickerStage === "import") {
      picker.append(button("Back to project images", () => { pickerStage = "choose"; renderPicker(); }, "ir-text-button"), el("p", "", "Import a PNG, JPEG or WebP as a UI image."), el("p", "ir-picker-boundary", "Prototype · Browse files selects a fictional PNG. No native picker opens."), button("Browse files…", () => { pickerStage = "staged"; renderPicker(); }), button("Simulate file picker Cancel", () => { pickerStage = "choose"; renderPicker(); report("File picker cancelled. Your image edits are kept."); }));
    } else {
      const sample: Asset = { id: "seal", name: "Station seal", path: "game/assets/ui/station_seal.png", width: 400, height: 400, art: "route", status: "ready", version: 1 };
      const row = el("div", "ir-staged-file"); row.append(thumbnail(sample), el("p", "", "station_seal.png"), el("span", "", "400 × 400 px · PNG · UI image"));
      const name = el("input"); name.value = sample.name; name.ariaLabel = "Display name";
      const error = el("p", "ir-inline-error"); error.role = "alert"; error.hidden = true;
      picker.append(row, labelled("Display name", name), el("p", "ui-file", "Destination: game/assets/ui/station_seal.png"), error);
      const actions = el("div", "ui-actions"); actions.append(button("Cancel import", () => { pickerStage = "choose"; renderPicker(); report("Import cancelled. Your image edits are kept."); }), action("Import and use", () => { if (!name.value.trim()) { error.textContent = "Give this image a display name."; error.hidden = false; name.ariaInvalid = "true"; name.focus(); return; } let a = assets.find(a => a.id === "seal"); if (!a) { a = { ...sample, name: name.value.trim() }; assets.push(a); } useAsset(a); report(`Imported ${a.name}. Apply to accept the screen change.`); }, true)); picker.append(actions, el("p", "ir-picker-boundary", "Prototype · This import changes only the sample catalog."));
    }
  }
  function useAsset(a: Asset) {
    const n = clone(value()!); n.asset = a.id; n.version = a.version; if (locked() && /^\d+$/.test(n.props.xsize ?? "")) n.props.ysize = String(Math.max(1, Math.round(+n.props.xsize! * a.height / a.width)));
    storeDraft(n); problems.delete(selected); pickerReturn = "xsize"; picker?.close(); renderEditor(); report(`${a.name} selected. Changes are not applied yet.`); sync(); focusField("xsize");
  }
  function openReplacement(a: Asset) {
    const dialog = el("dialog", "ui-dialog ir-replacement"); dialog.ariaLabel = "Review changed image"; dialog.append(el("h2", "", "Review changed image"), el("p", "ui-file", a.path));
    const comparison = el("div", "ir-file-comparison"); const before = el("div"), after = el("div"); before.append(el("h3", "", "Previously selected"), thumbnail(a), el("p", "", `${a.width} × ${a.height} px`)); const replacement = { ...a, width: 600, height: 240, art: "ticket", version: 2 }; after.append(el("h3", "", "File on disk"), thumbnail(replacement), el("p", "", "600 × 240 px")); comparison.append(before, after);
    dialog.append(comparison, el("p", "ui-note", locked() ? `Prototype replacement. Width stays at ${value()!.props.xsize} px. Height becomes ${Math.max(1, Math.round(+(value()!.props.xsize || 320) * 240 / 600))} px to preserve aspect. Apply accepts the change.` : "Prototype replacement. Your displayed size stays unchanged. Apply accepts the refreshed reference."), button("Keep draft", () => dialog.close()), action("Use changed image", () => { Object.assign(a, replacement, { status: "ready" }); const n = clone(value()!); n.version = 2; if (locked() && /^\d+$/.test(n.props.xsize ?? "")) n.props.ysize = String(Math.max(1, Math.round(+n.props.xsize! * a.height / a.width))); storeDraft(n); problems.delete(selected); dialog.close(); renderEditor(); report("Changed image reviewed. Apply to accept the new reference and displayed size."); sync(); }, true)); dialog.onclose = () => dialog.remove(); frame.shell.append(dialog); dialog.showModal();
  }
  function source() {
    const line = (n: ImageNode, depth: number) => { const a = assetFor(n)!; const indent = "    ".repeat(depth); let text = `${indent}add ${JSON.stringify(a.path.replace(/^game\//, ""))}:\n`; for (const [key, number] of Object.entries(n.props)) if (number && !key.endsWith("unit")) text += `${indent}    ${key} ${sourceNumber(number, n.props[unitFor[key]!] === "relative")}\n`; return text; };
    return `# Fictional source. No project writes.\nscreen help():\n    frame:\n        padding (32, 32)\n        vbox:\n            spacing 16\n            text "Help"\n${images.filter(n => n.parent === "content").map(n => line(n, 3)).join("")}            text "Choose a route. The last tram leaves at midnight."\n            textbutton "Close" action Hide("help")\n${images.filter(n => n.parent === "root").map(n => line(n, 1)).join("")}\n    # Opaque neighboring region, unchanged\n    use custom_footer(route_state)\n`;
  }
  function openSource() { sourceReturn = document.activeElement as HTMLElement; sourceCode.textContent = source(); sourceDialog.showModal(); sourceDialog.querySelector<HTMLButtonElement>("button")?.focus(); }
  function openTest() { const dialog = el("dialog", "ui-dialog"); dialog.ariaLabel = "Test in Ren'Py sample"; dialog.append(el("h2", "", "Test in Ren'Py"), el("p", "", "In Loomlight this deliberately tests accepted source with the actual image. Pending edits are excluded."), el("p", "ir-picker-boundary", "Prototype · No SDK or project process starts here."), button("Back to editing", () => dialog.close())); dialog.onclose = () => dialog.remove(); frame.shell.append(dialog); dialog.showModal(); }
  function reopen() { if (hasDraft()) { problems.set(selected, { key: "pending", text: "Apply or cancel image edits before reopening the sample." }); sync(); return; } selected = images[0]?.id ?? "text"; renderEditor(); report("Reopened accepted images from browser memory."); sync(); }
  function draw() {
    const gameWidth = +resolution.value, gameHeight = gameWidth === 1280 ? 720 : 768;
    const available = Math.max(200, canvasWrap.clientWidth), maxHeight = innerWidth <= 800 ? 240 : focused ? 500 : 420;
    const scale = zoom.value === "1" ? 1 : Math.min(available / gameWidth, maxHeight / gameHeight);
    canvas.style.width = `${gameWidth * scale}px`; canvas.style.height = `${gameHeight * scale}px`; canvas.style.aspectRatio = "auto"; canvas.dataset.draft = String(hasDraft()); canvas.replaceChildren();
    const game = el("div", "ir-game"); game.style.width = `${gameWidth}px`; game.style.height = `${gameHeight}px`; game.style.transform = `scale(${scale})`;
    const window = el("div", "ir-game-window"); const heading = button("Help", () => choose("text"), "ir-game-title"); const content = el("div", "ir-game-content");
    const shown = images.map(n => drafts.get(n.id) ?? n); if (addition) shown.push(addition);
    const usable = (n: ImageNode) => !validate(n) || problems.get(n.id)?.key === "conflict";
    for (const n of shown) {
      const a = assetFor(n); if (!a) continue;
      const source = !usable(n) ? images.find(i => i.id === n.id) ?? n : n;
      const b = button("", () => choose(n.id), "ir-game-image"); b.ariaLabel = `Select image ${title(n)}`; b.dataset.selected = String(n.id === selected);
      const width = +(source.props.xsize || a.width), height = +(source.props.ysize || a.height); b.style.width = `${Math.max(1, Math.min(width, 16384))}px`; b.style.height = `${Math.max(1, Math.min(height, 16384))}px`;
      if (a.status === "ready") b.append(thumbnail(a)); else b.append(el("span", "ir-image-unavailable", a.status === "missing" ? "Image missing" : a.status === "replaced" ? "File changed" : "Image unreadable"));
      if (source.parent === "root") { b.style.position = "absolute"; const axis = (key: string, size: number) => +(source.props[key] || 0) * (source.props[unitFor[key]!] === "relative" ? size : 1); b.style.left = `${axis("xpos", gameWidth) - axis("xanchor", width)}px`; b.style.top = `${axis("ypos", gameHeight) - axis("yanchor", height)}px`; game.append(b); }
      else { const x = +(source.props.xpos || 0) * (source.props.xunit === "relative" ? gameWidth * .75 : 1) - +(source.props.xanchor || 0) * (source.props.xaunit === "relative" ? width : 1); b.style.marginLeft = `${x}px`; content.append(b); }
    }
    content.append(button("Choose a route.\nThe last tram leaves at midnight.", () => choose("text"), "ir-game-text"), button("Close", () => { choose("text"); report("Canvas selection only. The game action did not run."); }, "ir-game-close")); window.append(heading, content); game.prepend(window); canvas.append(game);
    if (addition && !addition.asset) canvas.append(el("span", "ir-add-hint", "Choose an image to preview it here"));
    path.replaceChildren(); for (const [id, name] of [["text", "Help"], ["text", value()?.parent === "root" ? "Screen root" : "Vertical group"], [selected, value() ? title(value()!) : "Help text"]]) path.append(button(name!, () => choose(id!)));
    const issue = value() ? validate(value()!) : undefined;
    previewState.textContent = issue && localDraft() ? "Showing accepted size · Draft kept" : hasDraft() ? "Draft preview · Not applied" : "Accepted preview";
    previewState.title = "Schematic browser canvas. Ren'Py geometry is not verified here.";
  }
  function switchVariant(delta: number) { const choices = ["inspector", "refined", "browser", "guided"], q = new URLSearchParams(location.search); q.set("variant", choices[(1 + delta + choices.length) % choices.length]!); location.search = q.toString(); }
  const keydown = (e: KeyboardEvent) => { if (e.isComposing || e.target instanceof Element && e.target.closest("input,textarea,select,[contenteditable],dialog")) return; if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); switchVariant(e.key === "ArrowLeft" ? -1 : 1); } };
  window.addEventListener("keydown", keydown); const resize = new ResizeObserver(draw); resize.observe(canvasWrap);
  renderEditor(); sync();
  return () => { resize.disconnect(); window.removeEventListener("keydown", keydown); };
};
function select(name: string, options: string[][], value: string, callback: (value: string) => void) { const s = el("select"); s.ariaLabel = name; for (const [id, title] of options) { const option = el("option", "", title); option.value = id!; s.append(option); } s.value = value; s.onchange = () => callback(s.value); return s; }
