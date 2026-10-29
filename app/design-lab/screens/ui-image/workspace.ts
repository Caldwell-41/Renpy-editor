// Three image workflows on one Design Lab route, selected by ?variant=.
// The existing Screens shell and numeric conventions remain the host design.
import type { LabContext } from "../../contracts.ts";
import { action, element as el, labelled, labPage } from "../../page.ts";
import { icon } from "../../../src/icons.ts";
import "./style.css";

type Variant = "inspector" | "refined" | "browser" | "guided";
type Asset = { id: string; name: string; path: string; width: number; height: number; art: string; status: "ready" | "missing" | "replaced" | "invalid" };
type ImageNode = { asset: string; width: string; height: string; parent: string; xpos: string; ypos: string; xanchor: string; yanchor: string; order: number };
const variants: Variant[] = ["inspector", "refined", "browser", "guided"];
const titles = ["A · Inspector picker", "A2 · Focused image editor", "B · Asset browser", "C · Guided image sheet"];
const fixture = (): Asset[] => [
  { id: "tram", name: "Tram emblem", path: "game/assets/ui/tram_emblem.png", width: 640, height: 360, art: "tram", status: "ready" },
  { id: "ticket", name: "Night ticket", path: "game/assets/ui/night_ticket.webp", width: 600, height: 240, art: "ticket", status: "ready" },
  { id: "route", name: "Route marker", path: "game/assets/ui/route_marker.png", width: 256, height: 256, art: "route", status: "ready" },
];
const copy = <T,>(v: T): T => structuredClone(v);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
export function mountImage(host: HTMLElement, context: LabContext, variant: Variant) {
  const assets = fixture();
  if (["missing", "replaced", "invalid"].includes(context.state)) assets[0]!.status = context.state as Asset["status"];
  let accepted: ImageNode | null = context.state === "add" ? null : { asset: "tram", width: "320", height: "180", parent: "content", xpos: "0", ypos: "", xanchor: "0", yanchor: "0", order: 1 };
  let draft: ImageNode = copy(accepted ?? { asset: "", width: "320", height: "180", parent: "content", xpos: "0", ypos: "", xanchor: "0", yanchor: "0", order: 1 });
  let adding = !accepted, selected = "image", step = "design", preserve = true, wizard = 0, filter = "", conflict = context.state === "conflict", error = "", feedback = "Ready in sample", chooser: HTMLDialogElement | null = null;
  const undoStack: Array<ImageNode | null> = [], redoStack: Array<ImageNode | null> = [];
  const dirty = () => adding || (accepted ? !same(accepted, draft) : !!draft.asset);
  const currentAsset = () => assets.find(a => a.id === draft.asset);
  const frame = labPage(host, context, { screen: "screens", title: "Screens", subtitle: "", dirty });
  frame.shell.classList.add("image-lab"); frame.shell.dataset.variant = variant;
  frame.heading.querySelector("p")?.remove();
  frame.shell.querySelector(".lp-sample")!.textContent = `#40 · ${titles[variants.indexOf(variant)]} · Prototype`;
  frame.shell.querySelector(".lp-fiction")!.textContent = "Fictional sample · Import, saves and preview are simulated";
  const undo = action("Undo", () => travel(undoStack, redoStack));
  const redo = action("Redo", () => travel(redoStack, undoStack));
  const add = action("Add element", beginAdd), sourceButton = action("Source", openSource);
  frame.tools.append(add, undo, redo, sourceButton);
  const address = el("div", "ui-address", "Help / game/ui/help.rpy");
  const rail = el("nav", "ui-rail"); rail.ariaLabel = "Screen building steps";
  for (const [id, title] of [["choose", "1  Choose"], ["design", "2  Design"], ["connect", "3  Connect"]]) {
    const b = action(title!, () => { step = id!; renderEditor(); sync(); }); b.dataset.step = id; rail.append(b);
  }
  const work = el("div", "ui-work"), library = el("aside", "ui-library"), stage = el("section", "ui-stage"), editor = el("section", "ui-editor");
  stage.ariaLabel = "Screen canvas"; editor.ariaLabel = "Image editor"; library.ariaLabel = "UI image browser";
  const stageHead = el("div", "ui-stage-heading");
  const resolution = select("Sample resolution", [["1280", "1280 × 720"], ["1024", "1024 × 768"]], "1280", () => draw());
  const zoom = select("Canvas zoom", [["fit", "Fit"], ["1", "100%"]], "fit", () => draw());
  const focus = action("Focus preview", () => { const focused = work.dataset.focus !== "true"; work.dataset.focus = String(focused); focus.textContent = focused ? "Back to editing" : "Focus preview"; draw(); });
  stageHead.append(el("h2", "", "Help"), resolution, zoom, focus);
  const canvasWrap = el("div", "ui-canvas-wrap"), canvas = el("div", "ui-canvas"); canvas.ariaLabel = "Schematic Help canvas";
  canvasWrap.append(canvas);
  const path = el("nav", "ui-path"); path.ariaLabel = "Selection path";
  const caption = el("p", "ui-caption"), coverage = el("div", "ui-coverage");
  coverage.append(el("span", "", "Partial coverage · Custom footer stays in Source"), action("Inspect footer", openSource));
  const evidence = el("details", "ui-state"), stateText = el("pre"); evidence.append(el("summary", "", "Prototype state"), stateText);
  stage.append(stageHead, canvasWrap, path, caption, coverage, evidence);
  if (variant === "browser") work.append(library);
  work.append(stage, editor); frame.content.append(address, rail, work);
  const sourceDialog = el("dialog", "ui-dialog ui-source-dialog"); sourceDialog.ariaLabel = "Screen source";
  const sourceCode = el("pre", "ui-source"); sourceCode.ariaLabel = "Accepted sample source";
  const sourceActions = el("div", "ui-actions");
  sourceActions.append(action("Back to image", () => { sourceDialog.close(); selected = "image"; step = "design"; renderEditor(); sync(); }));
  if (conflict) sourceActions.append(action("Simulate source refresh", () => { if (dirty()) { report("Cancel the retained draft before refreshing Source.", true); return; } conflict = false; sourceDialog.close(); report("Sample Source refreshed."); sync(); }));
  sourceDialog.append(el("h2", "", "Source · Help"), el("p", "ui-note", "Accepted sample source only. Pending image edits are retained when you return. No project file is opened."), sourceCode, sourceActions);
  sourceDialog.addEventListener("close", () => sourceButton.focus());
  const testDialog = el("dialog", "ui-dialog"); testDialog.ariaLabel = "Test in Ren'Py sample";
  testDialog.append(el("h2", "", "Test in Ren'Py"), el("p", "", "This browser mock starts no process. In Loomlight, deliberate testing will use the accepted source and actual asset. Pending drafts are excluded."), action("Back to editing", () => testDialog.close()));
  frame.shell.append(sourceDialog, testDialog);
  const switcher = el("div", "ui-switcher"); switcher.ariaLabel = "Prototype variants";
  switcher.append(action("Previous variant", () => switchVariant(-1)), el("span", "", titles[variants.indexOf(variant)]), action("Next variant", () => switchVariant(1)));
  switcher.querySelectorAll<HTMLButtonElement>("button").forEach(b => b.ariaLabel = b.textContent); frame.shell.append(switcher);

  function report(message: string, failed = false) { feedback = message; error = failed ? message : ""; frame.status.textContent = message; updateStatus(); }
  function updateStatus() {
    const alert = editor.querySelector<HTMLElement>(".ui-feedback"); if (alert) { alert.textContent = error; alert.hidden = !error; }
    const marker = editor.querySelector<HTMLElement>(".ui-draft"); if (marker) marker.textContent = dirty() ? "Draft" : "Accepted";
    const status = editor.querySelector<HTMLElement>(".ui-commit-state"); if (status) status.textContent = dirty() ? "Not applied · Your input stays here until Apply or Cancel." : "Accepted in sample · No pending edits.";
  }
  function sync() {
    undo.disabled = !undoStack.length; redo.disabled = !redoStack.length;
    rail.querySelectorAll<HTMLButtonElement>("button").forEach(b => b.ariaPressed = String(b.dataset.step === step));
    updateStatus(); draw(); sourceCode.textContent = source();
    stateText.textContent = JSON.stringify({ selected, step, adding, accepted, draft, preserveAspect: preserve, referenceStatus: currentAsset()?.status ?? "unselected", sourceConflict: conflict, history: undoStack.length, redo: redoStack.length, feedback }, null, 2);
  }
  function chooseImage(a: Asset) {
    draft.asset = a.id; error = "";
    if (preserve && validNumber(draft.width)) draft.height = String(Math.max(1, Math.round(+draft.width * a.height / a.width)));
    if (variant === "guided") wizard = 1;
    chooser?.close(); chooser = null; selected = "image"; step = "design";
    renderEditor(); report(`Selected ${a.name}. Apply to accept the image change.`); sync();
  }
  function thumb(a: Asset, className = "") { const img = el("img", className); img.src = new URL(`./${a.art}.svg`, import.meta.url).href; img.alt = a.name; return img; }
  function assetRows(host: HTMLElement, pick: (a: Asset) => void, search = "") {
    host.replaceChildren();
    const matches = assets.filter(a => `${a.name} ${a.path}`.toLowerCase().includes(search.toLowerCase()));
    for (const a of matches) {
      const b = action("", () => pick(a)); b.className = "button ui-asset-row"; b.ariaLabel = `Use ${a.name}`; b.ariaPressed = String(a.id === draft.asset);
      const words = el("span", "ui-asset-words"); words.append(el("strong", "", a.name), el("small", "", `${a.width} × ${a.height} · ${a.path.split(".").pop()!.toUpperCase()}`), el("small", "ui-asset-path", a.path));
      b.append(thumb(a), words); if (a.status !== "ready") b.append(el("span", "ui-reference-status", a.status)); host.append(b);
    }
    if (!matches.length) host.append(el("p", "ui-note", "No matching UI images."));
  }
  function renderLibrary() {
    library.replaceChildren(el("h2", "", "UI images"));
    const search = el("input"); search.type = "search"; search.ariaLabel = "Search UI images"; search.placeholder = "Find an image"; search.value = filter;
    const list = el("div", "ui-asset-list"); search.oninput = () => { filter = search.value; assetRows(list, chooseImage, filter); };
    library.append(search, el("p", "ui-note", "Project assets · UI image role"), list, action("Import image…", openImport)); assetRows(list, chooseImage, filter);
  }
  function openPicker() {
    const dialog = el("dialog", "ui-dialog ui-picker"); dialog.ariaLabel = "Choose UI image"; chooser = dialog;
    const search = el("input"); search.type = "search"; search.ariaLabel = "Search UI images"; search.placeholder = "Find an image";
    const list = el("div", "ui-asset-list"); search.oninput = () => assetRows(list, chooseImage, search.value);
    const actions = el("div", "ui-actions"); actions.append(action("Import image…", () => { dialog.close(); chooser = null; openImport(); }), action("Cancel picker", () => { dialog.close(); chooser = null; report("Picker cancelled. Image draft retained."); sync(); }));
    dialog.append(el("h2", "", "Choose UI image"), search, el("p", "ui-note", "Only project assets with the UI image role. PNG, JPEG and WebP. Choosing an image runs no game code."), list, actions);
    assetRows(list, chooseImage); dialog.onclose = () => { dialog.remove(); if (chooser === dialog) chooser = null; }; frame.shell.append(dialog); dialog.showModal(); search.focus();
  }
  function openImport() {
    const dialog = el("dialog", "ui-dialog ui-import"); dialog.ariaLabel = "Import UI image sample";
    dialog.append(el("h2", "", "Import UI image"), el("p", "ui-note", "Simulated native import. No file picker, filesystem write or Ren'Py process runs here."));
    const body = el("div");
    const finish = (message: string) => { dialog.close(); report(message); sync(); };
    body.append(action("Choose sample file…", () => {
      body.replaceChildren();
      const name = el("input"); name.value = "Station seal"; name.ariaLabel = "Display name";
      const role = select("Use as", [["uiImage", "UI image"]], "uiImage", () => {});
      body.append(el("p", "", "station_seal.png · 400 × 400 · PNG"), labelled("Use as", role), labelled("Display name", name), el("p", "ui-note", "Destination: game/assets/ui/station_seal.png"));
      const actions = el("div", "ui-actions"); actions.append(action("Import and select", () => {
        if (!name.value.trim()) { const p = el("p", "ui-feedback", "Display name is required. The staged file is retained."); p.role = "alert"; body.append(p); return; }
        let a = assets.find(a => a.id === "seal");
        if (!a) { a = { id: "seal", name: name.value.trim(), path: "game/assets/ui/station_seal.png", width: 400, height: 400, art: "route", status: "ready" }; assets.push(a); }
        dialog.close(); chooseImage(a); report("Imported into the sample catalog and selected. Apply to place it on the screen."); sync();
      }, true), action("Cancel import", () => finish("Import cancelled. The image draft is retained; no asset was added."))); body.append(actions);
    }), action("Simulate file picker Cancel", () => finish("File picker cancelled. The image draft is retained; no asset was added.")));
    dialog.append(body, action("Close import", () => finish("Import closed. The image draft is retained."))); dialog.onclose = () => dialog.remove(); frame.shell.append(dialog); dialog.showModal();
  }
  function beginAdd() {
    if (dirty()) { report("Apply or cancel the current image draft before adding another element.", true); return; }
    if (accepted) { const dialog = el("dialog", "ui-dialog"); dialog.ariaLabel = "Add image sample"; const q = new URLSearchParams(location.search); q.set("state", "add"); dialog.append(el("h2", "", "Add an image"), el("p", "", "This comparison edits one image node. Open the empty-screen sample to review adding a new image. Your current sample stays open.")); const link = el("a", "button primary", "Open add-image sample"); link.href = `/preview.html?${q}`; link.target = "_blank"; link.rel = "noopener"; dialog.append(link, action("Keep editing", () => dialog.close())); dialog.onclose = () => dialog.remove(); frame.shell.append(dialog); dialog.showModal(); return; }
    adding = true; draft = { asset: "", width: "320", height: "180", parent: "content", xpos: "0", ypos: "", xanchor: "0", yanchor: "0", order: 1 }; wizard = 0; selected = "image"; step = "design"; error = ""; renderEditor(); sync();
  }
  function group(title: string) { const section = el("section", "ui-group"); section.append(el("h3", "", title)); return section; }
  function sizeFields() {
    const section = group("Displayed size"), fields = el("div", "ui-fields");
    for (const [key, name] of [["width", "Width"], ["height", "Height"]] as const) {
      const input = el("input"); input.type = "text"; input.inputMode = "numeric"; input.value = draft[key]; input.dataset.field = key;
      input.oninput = () => {
        draft[key] = input.value; error = "";
        const a = currentAsset();
        if (preserve && a && validNumber(input.value)) {
          const other = key === "width" ? "height" : "width";
          draft[other] = String(Math.max(1, Math.round(+input.value * (key === "width" ? a.height / a.width : a.width / a.height))));
          const peer = editor.querySelector<HTMLInputElement>(`[data-field=${other}]`); if (peer) peer.value = draft[other];
        }
        sync();
      };
      const label = labelled(name, input); label.append(el("span", "ui-unit", "px")); fields.append(label);
    }
    const lock = el("input"); lock.type = "checkbox"; lock.checked = preserve; lock.ariaLabel = "Preserve aspect ratio";
    lock.onchange = () => { preserve = lock.checked; const a = currentAsset(); if (preserve && a && validNumber(draft.width)) { draft.height = String(Math.max(1, Math.round(+draft.width * a.height / a.width))); const h = editor.querySelector<HTMLInputElement>("[data-field=height]"); if (h) h.value = draft.height; } sync(); };
    const label = el("label", "ui-check"); label.append(lock, el("span", "", "Preserve aspect ratio"));
    const a = currentAsset(); section.append(fields, label, el("p", "ui-note", a ? `Original ${a.width} × ${a.height} px · ${a.width / a.height === 1 ? "1:1" : a.id === "ticket" ? "5:2" : "16:9"}` : "Choose an image to use its original aspect ratio."));
    section.append(action("Use original size", () => { const a = currentAsset(); if (!a) return; draft.width = String(a.width); draft.height = String(a.height); error = ""; renderEditor(); sync(); }));
    return section;
  }
  function placement() {
    const details = el("details", "ui-group"); details.append(el("summary", "", "Position & anchor"));
    const fields = el("div", "ui-fields");
    for (const [key, name] of [["xpos", "Horizontal position"], ["ypos", "Vertical position"], ["xanchor", "Horizontal anchor"], ["yanchor", "Vertical anchor"]] as const) {
      const input = el("input"); input.value = draft[key]; input.ariaLabel = name; input.inputMode = "decimal";
      input.readOnly = key === "ypos" && draft.parent === "content";
      input.oninput = () => { draft[key] = input.value; error = ""; sync(); };
      const unit = select(`${name} unit`, [["px", "px"]], "px", () => {}); unit.disabled = input.readOnly;
      const field = labelled(name, input); field.append(unit); fields.append(field);
    }
    details.append(el("p", "ui-note", draft.parent === "content" ? "The vertical group controls vertical placement. Existing numeric unit and alignment controls retain their accepted scope." : "Free layout position uses the existing numeric inspector. This image comparison shows its pixel fields."), fields);
    return details;
  }
  function assetSummary() {
    const section = group("Image"), a = currentAsset(), row = el("div", "ui-selected-asset");
    if (a) { row.append(thumb(a), el("strong", "", a.name)); section.append(row, el("p", "ui-file", a.path)); }
    else section.append(el("p", "ui-note", "No UI image selected."));
    if (a && a.status !== "ready") {
      const messages = { missing: "This project asset is missing. Choose another image or restore the file. Your size and placement draft is retained.", replaced: "The file changed since it was selected. Review the replacement before applying. Your draft is retained.", invalid: "This file could not be decoded as a supported image. Choose another image. Your draft is retained." };
      const warning = el("p", "ui-reference-warning", messages[a.status]); warning.role = "status"; section.append(warning);
      if (a.status === "replaced") section.append(action("Review replacement", () => {
        const dialog = el("dialog", "ui-dialog"); dialog.ariaLabel = "Review replacement";
        dialog.append(el("h2", "", "Review replacement"), thumb(a, "ui-replacement-image"), el("p", "", "Simulated replacement: same path, new file content. New original size is 640 × 360 px. Accepting refreshes this draft reference; Apply accepts the screen change."), action("Keep old reference", () => dialog.close()), action("Use reviewed replacement", () => { a.status = "ready"; dialog.close(); report("Replacement reviewed in sample. Your size draft is retained."); renderEditor(); sync(); }, true));
        dialog.onclose = () => dialog.remove(); frame.shell.append(dialog); dialog.showModal();
      }));
    }
    if (variant !== "browser") section.append(action(a ? "Change image…" : "Choose image…", openPicker));
    return section;
  }
  function destination() {
    return labelled("Inside parent", select("Inside parent", [["content", "Help content · Vertical group"], ["root", "Screen root · Free layout"], ["frame", "Help frame · Already has one child"]], draft.parent, parent => { draft.parent = parent; if (parent === "content") draft.ypos = ""; error = ""; renderEditor(); sync(); }));
  }
  function renderEditor() {
    const scroll = editor.querySelector<HTMLElement>(".ui-editor-body")?.scrollTop ?? 0;
    editor.replaceChildren();
    const head = el("div", "ui-editor-head"); head.append(el("h2", "", adding ? "Add image" : selected === "image" ? "Image" : "Help text"), el("span", "ui-draft")); editor.append(head);
    const body = el("div", "ui-editor-body"); editor.append(body);
    if (step === "choose") {
      body.append(el("p", "ui-note", "Select an element. Image drafts survive selection changes."));
      for (const [id, name, indent] of [["root", "Help", 0], ["frame", "Help frame", 1], ["content", "Vertical group", 2], ["image", "Tram emblem · Image", 3], ["text", "Help text", 3], ["custom", "Custom footer · Source only", 1]] as const) {
        const b = action(name, () => { if (id === "custom") { openSource(); return; } selected = id === "image" ? "image" : "text"; step = "design"; renderEditor(); sync(); }); b.classList.add("ui-tree-row"); b.style.paddingLeft = `${indent * 12 + 4}px`; b.ariaPressed = String((id === "image" && selected === "image") || (id === "text" && selected === "text")); b.prepend(icon(id === "image" ? "assets" : "panel")); body.append(b);
      }
    } else if (step === "connect") body.append(el("p", "", "An image displays an asset and has no game action."), el("p", "ui-note", "Picker and canvas clicks only select. Existing button connections remain available in the composition workflow."));
    else if (selected !== "image") {
      body.append(el("p", "", "Help text"), el("p", "ui-note", "Your image draft remains unchanged. Existing text, container, numeric, reordering and removal controls retain their approved behavior."), action("Return to image", () => { selected = "image"; renderEditor(); sync(); }));
      const link = el("a", "ui-reference-link", "Open existing layout controls"); const q = new URLSearchParams(location.search); q.set("screen", "nested-layout"); q.set("variant", "focused-refined"); q.set("state", "nested"); link.href = `/preview.html?${q}`; link.target = "_blank"; link.rel = "noopener"; body.append(link, el("p", "ui-note", "The pinned A2 reference is required for approved comparison. This link may report changed source in this experimental checkout."));
    } else if (variant === "guided") {
      const steps = el("nav", "ui-wizard-steps"); steps.ariaLabel = "Image steps";
      for (const [i, title] of ["1  Image", "2  Size", "3  Review"].entries()) { const b = action(title, () => { wizard = i; renderEditor(); sync(); }); b.ariaCurrent = wizard === i ? "step" : null; steps.append(b); } body.append(steps);
      if (wizard === 0) { body.append(el("p", "", "Choose a project UI image"), assetSummary(), action("Import image…", openImport)); }
      if (wizard === 1) body.append(sizeFields(), destination(), placement());
      if (wizard === 2) { body.append(el("h3", "", "Review image change"), el("p", "", `${currentAsset()?.name ?? "No image"} · ${draft.width} × ${draft.height} px`), el("p", "ui-note", `Inside ${draft.parent === "content" ? "Help content" : "Screen root"}. One sample history entry on Apply.`), assetSummary(), el("pre", "ui-proposed-source", imageSource(draft))); }
      const nav = el("div", "ui-wizard-actions"); if (wizard > 0) nav.append(action("Back", () => { wizard--; renderEditor(); sync(); })); if (wizard < 2) nav.append(action(wizard === 0 ? "Continue to size" : "Review change", () => { wizard++; renderEditor(); sync(); })); body.append(nav);
    } else {
      body.append(assetSummary(), sizeFields(), destination(), placement());
      const details = el("details", "ui-group"); details.append(el("summary", "", "Existing layout controls"), el("p", "ui-note", "Keep the accepted paired numeric inspector, alignment shortcuts, size limits, nested constraints, order and removal controls. This comparison adds image selection and displayed size only.")); body.append(details);
    }
    const footer = el("div", "ui-commit"), alert = el("p", "ui-feedback"); alert.role = "alert"; alert.hidden = true;
    footer.append(alert, el("p", "ui-commit-state"));
    const actions = el("div", "ui-actions");
    if (step === "design" && selected === "image") actions.append(action(adding ? "Add image" : "Apply image", apply, true), action("Cancel", cancel));
    actions.append(action("View source", openSource), action("Test in Ren'Py", () => testDialog.showModal())); footer.append(actions);
    editor.append(footer); body.scrollTop = scroll;
    body.onkeydown = e => { if (e.isComposing) return; if (e.key === "Escape") { e.preventDefault(); cancel(); } if (e.key === "Enter" && e.target instanceof HTMLInputElement && e.target.type !== "checkbox") { e.preventDefault(); apply(); } };
    if (variant === "browser") renderLibrary(); updateStatus();
  }
  function validNumber(s: string) { return /^\d+$/.test(s) && +s >= 1 && +s <= 16384; }
  function validate() {
    const a = currentAsset();
    if (!a) return "Choose a project UI image. Your draft is retained.";
    if (a.status === "missing") return "The selected UI image is missing. Restore it or choose another image. Your draft is retained.";
    if (a.status === "replaced") return "The image file was replaced. Review the replacement before applying. Your draft is retained.";
    if (a.status === "invalid") return "The selected file is not a decodable supported image. Your draft is retained.";
    for (const key of ["width", "height"] as const) if (!validNumber(draft[key])) return `${key === "width" ? "Width" : "Height"} needs a whole number from 1 to 16384 pixels. Your draft is retained.`;
    for (const key of ["xpos", "ypos", "xanchor", "yanchor"] as const) if (draft[key] && !/^-?\d+$/.test(draft[key])) return "Position and anchor need whole pixels in this sample. Your draft is retained.";
    if (draft.parent === "frame") return "The Help frame already has its one child. Choose the vertical group or screen root. Your draft is retained.";
    if (conflict) return "Source changed outside this editor. Your image draft is retained. Inspect Source before retrying.";
    return "";
  }
  function apply() {
    const problem = validate();
    if (problem) { report(problem, true); sync(); return; }
    if (!adding && same(accepted, draft)) { report("No image changes to apply. No history entry added."); sync(); return; }
    undoStack.push(copy(accepted)); redoStack.length = 0; accepted = copy(draft); adding = false;
    report("Image applied in sample. One history entry added."); renderEditor(); sync();
  }
  function cancel() {
    if (accepted) { draft = copy(accepted); adding = false; } else { draft = { asset: "", width: "320", height: "180", parent: "content", xpos: "0", ypos: "", xanchor: "0", yanchor: "0", order: 1 }; adding = false; }
    error = ""; report("Image draft cancelled. Accepted source is unchanged."); renderEditor(); sync();
  }
  function travel(from: Array<ImageNode | null>, to: Array<ImageNode | null>) {
    if (dirty()) { report("Apply or cancel the image draft before history. Your draft is retained.", true); sync(); return; }
    if (!from.length) return;
    to.push(copy(accepted)); accepted = copy(from.pop()!); draft = copy(accepted ?? { asset: "", width: "320", height: "180", parent: "content", xpos: "0", ypos: "", xanchor: "0", yanchor: "0", order: 1 }); adding = false;
    report("Sample history restored the accepted image and source."); renderEditor(); sync();
  }
  function imageSource(node: ImageNode) {
    const a = assets.find(a => a.id === node.asset); if (!a) return "# No image selected";
    return `add ${JSON.stringify(a.path.replace(/^game\//, ""))}:\n    xsize ${node.width}\n    ysize ${node.height}\n    xpos ${node.xpos || "0"}\n    xanchor ${node.xanchor || "0"}` + (node.parent === "root" ? `\n    ypos ${node.ypos || "0"}\n    yanchor ${node.yanchor || "0"}` : "");
  }
  function source() {
    const image = accepted ? imageSource(accepted).split("\n").map(s => `${accepted?.parent === "root" ? "    " : "            "}${s}`).join("\n") : "            # No image node";
    const nestedImage = accepted?.parent === "root" ? "" : image;
    const rootImage = accepted?.parent === "root" ? `\n${image}` : "";
    return `# Fictional source; transactions are simulated.\nscreen help():\n    frame:\n        padding (32, 32)\n        vbox:\n            spacing 16\n            text "Help"\n${nestedImage}\n            text "Choose a route. The last tram leaves at midnight."\n            textbutton "Close" action Hide("help")${rootImage}\n\n    # Opaque neighboring region, unchanged\n    use custom_footer(route_state)\n`;
  }
  function openSource() { sourceCode.textContent = source(); sourceDialog.showModal(); sourceDialog.querySelector<HTMLButtonElement>("button")?.focus(); }
  function draw() {
    canvas.replaceChildren(); const width = +resolution.value, height = width === 1280 ? 720 : 768;
    canvas.style.aspectRatio = `${width}/${height}`; canvas.style.width = zoom.value === "1" ? `${width}px` : "100%";
    canvas.style.maxWidth = zoom.value === "1" ? "none" : `${width / height * (variant === "browser" ? 185 : innerWidth <= 800 ? 240 : 420)}px`;
    canvas.style.maxHeight = "none";
    canvas.dataset.draft = String(dirty());
    const game = el("div", "ui-game"), gameWindow = el("div", "ui-game-window");
    const title = action("Help", () => { selected = "text"; renderEditor(); sync(); }); title.classList.add("ui-game-title");
    const content = el("div", "ui-game-content");
    const candidate = currentAsset(), showDraft = candidate?.status === "ready" && validNumber(draft.width) && validNumber(draft.height);
    const shown = (dirty() && showDraft) ? draft : accepted;
    if (shown) {
      const a = assets.find(a => a.id === shown.asset); const b = action("", () => { selected = "image"; step = "design"; renderEditor(); sync(); }); b.className = "ui-game-image"; b.ariaLabel = "Select image on canvas"; b.dataset.selected = String(selected === "image");
      b.style.width = `${+shown.width / width * 100 / .78}%`; b.style.aspectRatio = `${shown.width}/${shown.height}`;
      if (a?.status === "ready") b.append(thumb(a)); else b.append(el("span", "ui-missing", a?.status === "missing" ? "Missing image" : a?.status === "replaced" ? "Image changed" : "Invalid image"));
      content.append(b);
    }
    const text = action("Choose a route.\nThe last tram leaves at midnight.", () => { selected = "text"; step = "design"; renderEditor(); sync(); }); text.classList.add("ui-game-text");
    const close = action("Close", () => { report("Canvas selection only. Hide(\"help\") was not executed."); sync(); }); close.classList.add("ui-game-close");
    content.append(text, close); gameWindow.append(title, content); game.append(gameWindow); canvas.append(game);
    if (adding && !draft.asset) canvas.append(el("span", "ui-add-mark", "Add image · Choose an asset"));
    path.replaceChildren(); for (const label of ["Help", "Frame", "Vertical group", selected === "image" ? "Image" : "Help text"]) path.append(action(label, () => { selected = label === "Image" ? "image" : "text"; step = "design"; renderEditor(); sync(); }));
    caption.textContent = dirty() && showDraft ? "Draft image preview · Not applied · Schematic canvas" : "Accepted sample · Schematic canvas, not a Ren'Py render";
  }
  function switchVariant(delta: number) { const q = new URLSearchParams(location.search); q.set("variant", variants[(variants.indexOf(variant) + delta + variants.length) % variants.length]!); location.search = q.toString(); }
  const keydown = (e: KeyboardEvent) => { if (e.target instanceof Element && e.target.closest("input,textarea,select,[contenteditable],dialog")) return; if (["ArrowLeft", "ArrowRight"].includes(e.key)) { e.preventDefault(); switchVariant(e.key === "ArrowLeft" ? -1 : 1); } };
  window.addEventListener("keydown", keydown);
  const reopen = action("Simulate reopen", () => { if (dirty()) { report("Apply or cancel your image draft before reopening this sample. Your input is retained.", true); sync(); return; } draft = copy(accepted ?? { asset: "", width: "320", height: "180", parent: "content", xpos: "0", ypos: "", xanchor: "0", yanchor: "0", order: 1 }); selected = "image"; step = "design"; renderEditor(); report("Reopened accepted image from browser memory. Disk persistence is not tested."); sync(); }); evidence.append(reopen);
  renderEditor(); sync();
  return () => window.removeEventListener("keydown", keydown);
}
function select(name: string, options: string[][], value: string, change: (value: string) => void) { const s = el("select"); s.ariaLabel = name; for (const [v, label] of options) { const o = el("option", "", label); o.value = v!; s.append(o); } s.value = value; s.onchange = () => change(s.value); return s; }
