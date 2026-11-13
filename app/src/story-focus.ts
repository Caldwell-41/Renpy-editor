// Writing focus (story-revamp / combined-v1): grips resize the sidebar and the Tracks lanes
// by pointer or arrow keys, and markers name the lanes that the sidebar or a scroll hides.
// Widths are view preferences for the project session. They are CSS custom properties on
// the Story workspace, so resizing redraws nothing, sends nothing to core and adds no Undo
// entry. A pointer drag leaves the editor's focus and caret where they were.
import { lanes } from "./story-tracks.ts";

/** Custom property name (`focus-side`, `lane-1`) → width in px. */
export type FocusWidths = Map<string, number>;

export interface GripOptions {
  readonly key: string;
  readonly label: string;
  /** The element that carries the width as `--{key}`. */
  readonly host: HTMLElement;
  readonly widths: FocusWidths;
  readonly measure: () => number;
  readonly min: number;
  readonly max: () => number;
  /** 1 when dragging right widens, -1 when dragging left widens. */
  readonly grow: 1 | -1;
}

/** A grip on an edge. Drag it or use the arrow keys (Shift for larger steps). Escape
 *  cancels the drag or the keyboard changes since the grip took focus; double-click or
 *  Enter resets the default width. */
export function resizeGrip({ key, label, host, widths, measure, min, max, grow }: GripOptions): HTMLElement {
  const grip = document.createElement("div"); grip.className = "story-grip"; grip.dataset.resize = key;
  grip.role = "separator"; grip.tabIndex = 0; grip.ariaLabel = label; grip.setAttribute("aria-orientation", "vertical");
  grip.title = `${label}. Drag or use the arrow keys; double-click resets.`;
  const limit = (): number => Math.max(min, max());
  const show = (): void => { grip.setAttribute("aria-valuemin", String(min)); grip.setAttribute("aria-valuemax", String(Math.round(limit()))); grip.setAttribute("aria-valuenow", String(Math.round(measure()))); };
  const restore = (width: number | undefined): void => {
    if (width === undefined) { widths.delete(key); host.style.removeProperty(`--${key}`); }
    else { widths.set(key, width); host.style.setProperty(`--${key}`, `${width}px`); }
    show();
  };
  const set = (width: number): void => restore(Math.round(Math.min(limit(), Math.max(min, width))));
  // The width before the current drag or keyboard session, for Escape.
  let before: { readonly width: number | undefined } | undefined;
  let drag: { readonly x: number; readonly start: number } | undefined;
  const escape = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" || !drag) return;
    event.preventDefault(); event.stopPropagation(); restore(before?.width); end();
  };
  const end = (): void => { drag = undefined; before = undefined; grip.dataset.dragging = "false"; document.removeEventListener("keydown", escape, true); };
  // Without this the mouse press would move focus out of the editor.
  grip.addEventListener("mousedown", event => event.preventDefault());
  grip.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    event.preventDefault(); grip.setPointerCapture?.(event.pointerId);
    before = { width: widths.get(key) }; drag = { x: event.clientX, start: measure() }; grip.dataset.dragging = "true";
    document.addEventListener("keydown", escape, true); show();
  });
  grip.addEventListener("pointermove", event => { if (drag) set(drag.start + (event.clientX - drag.x) * grow); });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) grip.addEventListener(type, () => { if (drag) end(); });
  grip.addEventListener("dblclick", () => restore(undefined));
  grip.addEventListener("focus", () => { before = { width: widths.get(key) }; show(); });
  grip.addEventListener("blur", () => { if (!drag) before = undefined; });
  grip.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); set(measure() + (event.key === "ArrowRight" ? 1 : -1) * grow * (event.shiftKey ? 32 : 8)); }
    else if (event.key === "Enter") { event.preventDefault(); restore(undefined); }
    else if (event.key === "Escape" && before && widths.get(key) !== before.width) { event.preventDefault(); event.stopPropagation(); restore(before.width); }
  });
  return grip;
}

/** Writing focus Tracks: a grip on each lane edge away from Words, which fills the rest.
 *  A lane grows only into the room Words has above its minimum (`--words-min`). */
export function laneGrips(scroller: HTMLElement, host: HTMLElement, widths: FocusWidths): void {
  const labels = scroller.querySelector<HTMLElement>(".story-track-labels"); if (!labels) return;
  const lane = (index: number): HTMLElement => labels.children[index] as HTMLElement;
  const width = (index: number): number => lane(index).getBoundingClientRect().width;
  const view = labels.ownerDocument.defaultView!;
  const room = (): number => width(3) - (parseFloat(view.getComputedStyle(labels).getPropertyValue("--words-min")) || 220);
  for (const index of [0, 1, 2, 4, 5]) {
    const grip = resizeGrip({ key: `lane-${index}`, label: `${lanes[index]} lane width`, host, widths, measure: () => width(index), min: 40, max: () => width(index) + room(), grow: index < 3 ? 1 : -1 });
    grip.classList.add(index < 3 ? "story-grip-end" : "story-grip-start"); lane(index).append(grip);
  }
}

/** Names the lanes cut off at either edge of Writing focus Tracks, in buttons that scroll
 *  them into view, and marks the cut edge. Returns a function that stops watching. */
export function watchHiddenLanes(scroller: HTMLElement, toolbar: HTMLElement): () => void {
  const labels = scroller.querySelector<HTMLElement>(".story-track-labels"); if (!labels) return () => undefined;
  const edge = (side: "start" | "end"): HTMLButtonElement => {
    const button = document.createElement("button"); button.type = "button"; button.className = `story-lane-edge story-lane-edge-${side}`; button.hidden = true;
    button.addEventListener("click", () => { scroller.scrollLeft = side === "end" ? scroller.scrollWidth : 0; });
    return button;
  };
  const start = edge("start"), end = edge("end");
  toolbar.querySelector(".story-view-switch")?.after(start); toolbar.append(end);
  // Lane cells keep 8 px of padding, so a cut within it hides no text.
  const slack = 8;
  const update = (): void => {
    const box = scroller.getBoundingClientRect(), right = box.left + scroller.clientWidth;
    const shown = lanes.flatMap((name, index) => { const rect = (labels.children[index] as HTMLElement).getBoundingClientRect(); return rect.width > 0 ? [{ name, rect }] : []; });
    for (const [button, hidden, side] of [[start, shown.filter(lane => lane.rect.left < box.left - slack), "start"], [end, shown.filter(lane => lane.rect.right > right + slack), "end"]] as const) {
      const names = hidden.map(lane => lane.name);
      button.hidden = !names.length; scroller.dataset[side === "start" ? "hiddenStart" : "hiddenEnd"] = String(!!names.length);
      if (!names.length) continue;
      button.textContent = side === "end" ? `${names.join(", ")} ›` : `‹ ${names.join(", ")}`;
      button.ariaLabel = button.title = `${names.length === 1 ? `The ${names[0]} lane is` : `${names.join(" and ")} lanes are`} partly or fully hidden. Show ${names.length === 1 ? "it" : "them"}.`;
    }
  };
  scroller.addEventListener("scroll", update, { passive: true });
  const observer = new (scroller.ownerDocument.defaultView!.ResizeObserver)(update);
  observer.observe(scroller); observer.observe(labels);
  update();
  return () => observer.disconnect();
}
