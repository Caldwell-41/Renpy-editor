import type { LabContext } from "../../contracts.ts";
import "./style.css";
import { icon } from "../../../src/icons.ts";

type Box = { x: number; y: number; width: number; height: number };
type Variant = "handle" | "border" | "body";
const initial = (): Box => ({ x: 320, y: 180, width: 640, height: 360 });
const descriptions: Record<Variant, string> = {
  handle: "Drag the Move frame handle. Click content to select a child.",
  border: "Drag the highlighted border. Click content to select a child.",
  body: "Drag anywhere inside the selected frame. Double-click content to select a child.",
};

export function mountDrag(host: HTMLElement, context: LabContext, variant: Variant): () => void {
  host.innerHTML = `<section class="drag-lab" data-target="${variant}">
    <header><h1>Move the Help panel</h1><span>Interaction draft · #36</span></header>
    <p class="drag-instructions">${descriptions[variant]}</p>
    <div class="drag-toolbar">
      <button data-action="undo">Undo</button><button data-action="redo">Redo</button>
      <button data-action="reset">Reset</button>
      ${variant === "handle" ? `<label>Zoom <select aria-label="Canvas zoom"><option value="fit">Fit</option><option value="0.5">50%</option><option value="1">100%</option></select></label>` : ""}
      <label>Content delay <select aria-label="Content delay"><option value="0">None</option><option value="180">180 ms</option><option value="600">600 ms</option></select></label>
    </div>
    <div class="drag-workspace">
      <nav aria-label="Elements"><h2>Elements</h2>
        <button data-element="frame" aria-pressed="true">Help frame</button>
        <button data-element="group">&nbsp; Vertical group</button>
        <button data-element="text">&nbsp; &nbsp; Help text</button>
        <button data-element="button">&nbsp; &nbsp; Close button</button>
        <p>Arrows move 1 px.<br>Shift moves 8 px.<br>Escape cancels.</p>
      </nav>
      <div class="drag-canvas-column">
        <div class="drag-canvas-caption"><span>1280 × 720</span><span data-feedback>Content current</span></div>
        <div class="drag-stage"><div class="drag-plane"><div class="drag-game">
          <div class="drag-content"><div class="drag-content-group"><h2>Help</h2><p>Find your way through the story.</p><p>Click to continue.<br>Scroll back to revisit a line.<br>Press Escape to open the menu.</p><span>Close</span></div></div>
          <button class="drag-child drag-group" data-pick="group" aria-label="Select vertical group"></button>
          <button class="drag-child drag-text" data-pick="text" aria-label="Select Help text"></button>
          <button class="drag-child drag-button" data-pick="button" aria-label="Select Close button"></button>
          <div class="drag-outline">
            <button class="drag-move drag-handle" aria-label="Move frame">Move frame</button>
            <button class="drag-move drag-edge edge-top" aria-label="Move frame from top border"></button>
            <button class="drag-move drag-edge edge-left" aria-label="Move frame from left border"></button>
            <button class="drag-move drag-edge edge-right" aria-label="Move frame from right border"></button>
            <button class="drag-move drag-edge edge-bottom" aria-label="Move frame from bottom border"></button>
            <button class="drag-move drag-body" aria-label="Move selected frame"></button>
            <button class="drag-resize" aria-label="Resize frame"></button>
          </div>
        </div></div></div>
        <output class="drag-coordinates"></output>
      </div>
    </div>
    <div class="drag-properties"><strong data-selection>Help frame</strong>
      <label>Width <input aria-label="Frame width" type="number" min="160" max="1000" value="640"></label>
      <label>Height <input aria-label="Frame height" type="number" min="160" max="600" value="360"></label>
      <button data-action="apply">Apply size</button><button data-action="cancel">Cancel</button>
    </div>
    <p role="status">Ready. Dragging previews a draft; release accepts one in-memory change.</p>
    <footer>Fictional HTML content. ${variant === "handle" ? "The panel follows input provisionally; confirmation is simulated." : "The outline follows input immediately; content arrival is simulated."} This preview does not measure Ren'Py or native performance.</footer>
  </section>`;
  const root = host.querySelector<HTMLElement>(".drag-lab")!;
  const get = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const game = get<HTMLDivElement>(".drag-game"), stage = get<HTMLDivElement>(".drag-stage");
  const outline = get<HTMLDivElement>(".drag-outline"), content = get<HTMLDivElement>(".drag-content");
  const handle = get<HTMLButtonElement>(".drag-handle");
  if (variant === "handle") {
    // Use the shared icon construction and stroke style; this draft shape stays in the lab.
    const moveIcon = icon("plus");
    moveIcon.querySelector("path")!.setAttribute("d", "M12 3v18M3 12h18m-12-6 3-3 3 3m-6 12 3 3 3-3M6 9l-3 3 3 3m12-6 3 3-3 3");
    handle.prepend(moveIcon);
    handle.title = "Drag to move. Arrows adjust by one pixel; Shift by eight. Escape cancels.";
  }
  const zoom = root.querySelector<HTMLSelectElement>('[aria-label="Canvas zoom"]');
  const width = get<HTMLInputElement>('[aria-label="Frame width"]'), height = get<HTMLInputElement>('[aria-label="Frame height"]');
  const delay = get<HTMLSelectElement>('[aria-label="Content delay"]');
  delay.value = context.state === "delayed" ? "600" : "180";
  let box = initial(), displayed = initial(), selected = "frame", scale = 1, timer: ReturnType<typeof setTimeout> | undefined;
  let undo: Box[] = [], redo: Box[] = [];
  let gesture: { before: Box; x: number; y: number; pointer: number; target: HTMLElement; resize: boolean } | undefined;
  const message = (text: string) => { get('[role="status"]').textContent = text; };
  function place(element: HTMLElement, value: Box) {
    Object.assign(element.style, { left: `${value.x}px`, top: `${value.y}px`, width: `${value.width}px`, height: `${value.height}px` });
  }
  function positionContent(value: Box) {
    displayed = { ...value }; place(content, displayed);
    place(get(".drag-group"), { x: displayed.x + 48, y: displayed.y + 40, width: displayed.width - 96, height: displayed.height - 80 });
    place(get(".drag-text"), { x: displayed.x + 48, y: displayed.y + 90, width: displayed.width - 96, height: 100 });
    place(get(".drag-button"), { x: displayed.x + 48, y: displayed.y + displayed.height - 85, width: 110, height: 38 });
  }
  function paintContent() {
    positionContent(box);
    get("[data-feedback]").textContent = "Content current";
    root.dataset.pending = "false";
  }
  function positionHandle() {
    if (variant !== "handle") return;
    handle.style.transform = `scale(${1 / scale})`;
    handle.style.top = `${box.y * scale >= 34 ? -34 / scale : 4 / scale}px`;
    // Keep the whole hit area within the game canvas at either horizontal edge.
    handle.style.left = `${Math.max(-box.x + 4 / scale, Math.min(0, (1280 - box.x) - handle.offsetWidth / scale - 4 / scale))}px`;
  }
  function paint(immediate = false) {
    positionHandle();
    place(outline, box); outline.hidden = selected !== "frame";
    get(".drag-coordinates").textContent = `x ${box.x}   y ${box.y}   width ${box.width}   height ${box.height}${gesture ? "   · draft" : ""}`;
    width.value = String(box.width); height.value = String(box.height);
    get<HTMLButtonElement>('[data-action="undo"]').disabled = !undo.length || !!gesture;
    get<HTMLButtonElement>('[data-action="redo"]').disabled = !redo.length || !!gesture;
    clearTimeout(timer);
    // Translation uses the last visible panel while the simulated helper catches up.
    // Resizing keeps its separate delayed layout behavior.
    if (variant === "handle") positionContent({ ...displayed, x: box.x, y: box.y });
    if (immediate || Number(delay.value) === 0) paintContent();
    else { root.dataset.pending = "true"; get("[data-feedback]").textContent = variant === "handle" ? (gesture ? "Draft position" : "Confirming position") : "Draft guide · content pending"; timer = setTimeout(paintContent, Number(delay.value)); }
  }
  function choose(value: string) {
    selected = value;
    root.querySelectorAll<HTMLButtonElement>('[data-element]').forEach(button => button.ariaPressed = String(button.dataset.element === value));
    get("[data-selection]").textContent = value === "frame" ? "Help frame" : `Selected ${value}. Choose Help frame to move it.`;
    width.disabled = height.disabled = value !== "frame";
    get<HTMLButtonElement>('[data-action="apply"]').disabled = value !== "frame";
    outline.hidden = value !== "frame";
  }
  const same = (a: Box, b: Box) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
  function commit(before: Box) {
    if (!same(before, box)) { undo.push(before); redo = []; message("Change accepted in memory. Undo restores the previous position and size."); }
    paint();
  }
  function release() {
    const previous = gesture; gesture = undefined; root.dataset.dragging = "false";
    if (previous?.target.hasPointerCapture(previous.pointer)) previous.target.releasePointerCapture(previous.pointer);
    return previous;
  }
  function cancel() {
    const previous = release(); if (previous) box = previous.before;
    paint(true); message("Draft cancelled. No change accepted.");
  }
  root.querySelectorAll<HTMLButtonElement>('.drag-move,.drag-resize').forEach(target => {
    target.onpointerdown = event => {
      if (event.button !== 0 || gesture || selected !== "frame") return;
      gesture = { before: { ...box }, x: event.clientX, y: event.clientY, pointer: event.pointerId, target, resize: target.classList.contains("drag-resize") };
      root.dataset.dragging = "true";
      target.setPointerCapture(event.pointerId); target.focus(); event.preventDefault();
    };
    target.onpointermove = event => {
      if (!gesture || event.pointerId !== gesture.pointer) return;
      const dx = Math.round((event.clientX - gesture.x) / scale / 8) * 8;
      const dy = Math.round((event.clientY - gesture.y) / scale / 8) * 8;
      const before = gesture.before;
      box = gesture.resize ? { ...before, width: Math.max(160, Math.min(1280 - before.x, before.width + dx)), height: Math.max(160, Math.min(720 - before.y, before.height + dy)) }
        : { ...before, x: Math.max(0, Math.min(1280 - before.width, before.x + dx)), y: Math.max(0, Math.min(720 - before.height, before.y + dy)) };
      paint();
    };
    target.onpointerup = event => { if (gesture?.pointer === event.pointerId) { const previous = release()!; commit(previous.before); } };
    target.onlostpointercapture = target.onpointercancel = () => { if (gesture) cancel(); };
    target.onkeydown = event => {
      if (gesture || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault(); const before = { ...box }, amount = event.shiftKey ? 8 : 1;
      const dx = event.key === "ArrowLeft" ? -amount : event.key === "ArrowRight" ? amount : 0;
      const dy = event.key === "ArrowUp" ? -amount : event.key === "ArrowDown" ? amount : 0;
      box = target.classList.contains("drag-resize") ? { ...box, width: Math.max(160, Math.min(1280 - box.x, box.width + dx)), height: Math.max(160, Math.min(720 - box.y, box.height + dy)) }
        : { ...box, x: Math.max(0, Math.min(1280 - box.width, box.x + dx)), y: Math.max(0, Math.min(720 - box.height, box.y + dy)) };
      commit(before);
    };
  });
  // The body alternative deliberately changes nested selection to a double click.
  get<HTMLButtonElement>(".drag-body").ondblclick = event => {
    const x = (event.clientX - game.getBoundingClientRect().x) / scale - displayed.x;
    const y = (event.clientY - game.getBoundingClientRect().y) / scale - displayed.y;
    choose(y >= displayed.height - 85 && x < 158 ? "button" : y >= 90 && y < 190 ? "text" : "group");
  };
  root.querySelectorAll<HTMLButtonElement>('[data-element]').forEach(button => { button.onclick = () => { if (gesture) cancel(); choose(button.dataset.element!); }; });
  root.querySelectorAll<HTMLButtonElement>('[data-pick]').forEach(button => { button.onclick = () => choose(button.dataset.pick!); });
  get('[data-action="cancel"]').onclick = cancel;
  get('[data-action="reset"]').onclick = () => { release(); box = initial(); undo = []; redo = []; choose("frame"); paint(true); message("Sample reset."); };
  get('[data-action="undo"]').onclick = () => { const previous = undo.pop(); if (previous) { redo.push({ ...box }); box = previous; paint(); message("Change undone."); } };
  get('[data-action="redo"]').onclick = () => { const next = redo.pop(); if (next) { undo.push({ ...box }); box = next; paint(); message("Change restored."); } };
  get('[data-action="apply"]').onclick = () => {
    const w = Number(width.value), h = Number(height.value);
    if (!Number.isInteger(w) || !Number.isInteger(h) || w < 160 || w > 1000 || h < 160 || h > 600) { message("Use whole numbers: width 160 to 1000, height 160 to 600. Input retained."); return; }
    const before = { ...box }; box = { x: Math.min(box.x, 1280 - w), y: Math.min(box.y, 720 - h), width: w, height: h }; commit(before);
  };
  root.onkeydown = event => { if (event.key === "Escape") { event.preventDefault(); cancel(); } };
  delay.onchange = () => paint(true);
  const fit = () => {
    scale = zoom && zoom.value !== "fit" ? Number(zoom.value) : stage.clientWidth / 1280;
    game.style.transform = `scale(${scale})`;
    const plane = get<HTMLElement>(".drag-plane");
    plane.style.width = `${1280 * scale}px`; plane.style.height = `${720 * scale}px`;
    stage.style.height = `${Math.min(720 * scale, 500)}px`;
    positionHandle();
  };
  if (zoom) zoom.onchange = () => { if (gesture) cancel(); fit(); };
  const observer = new ResizeObserver(fit);
  fit(); observer.observe(stage); paint(true);
  return () => { clearTimeout(timer); observer.disconnect(); release(); };
}
