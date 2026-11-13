// Story Combined v1 (`story-revamp` / `combined-v1`): the route through a scene's bodies,
// the Branch path and Tracks. Core gives every body its nodes, ending and insertion
// places (UI.md "Branches in a scene"); this module lays them out and works out no
// structure of its own. Open branches are view state: they add no history entry.
import type { BeatPayload, BodyRef, NodeRef, Position, SceneBeat, SceneBody, SceneDocument } from "./scene-ui.ts";

/** groupId → the open branch or option (its header beat id). */
export type OpenBranches = ReadonlyMap<string, string>;

export function sameBody(a: BodyRef, b: BodyRef): boolean {
  return a.type === "root" ? b.type === "root" : b.type === "branch" && a.groupId === b.groupId && a.branchId === b.branchId;
}
export function sameNode(a: NodeRef, b: NodeRef): boolean {
  return a.type === "beat" ? b.type === "beat" && a.beatId === b.beatId : b.type === "condition" && a.groupId === b.groupId;
}
export function samePosition(a: Position, b: Position): boolean {
  return a.type === "end" ? b.type === "end" : b.type === "before" && sameNode(a.anchor, b.anchor);
}
export function bodyOf(scene: SceneDocument, body: BodyRef): SceneBody | undefined {
  return scene.bodies.find(item => sameBody(item.body, body));
}
export function beatBody(beat: SceneBeat): BodyRef {
  return beat.owner ? { type: "branch", ...beat.owner } : { type: "root" };
}
export function nodeRef(beat: SceneBeat): NodeRef {
  return beat.conditionalBranch ? { type: "condition", groupId: beat.conditionalBranch.groupId } : { type: "beat", beatId: beat.id };
}
const beatOf = (scene: SceneDocument, id: string): SceneBeat | undefined => scene.beats.find(beat => beat.id === id);
/** A body's nodes as beats, in source order. */
export function nodeBeats(scene: SceneDocument, body: BodyRef): SceneBeat[] {
  return (bodyOf(scene, body)?.nodes ?? []).flatMap(node => beatOf(scene, node.beatId) ?? []);
}
/** The body a condition or Choice node owns, by its header beat id. */
export function ownedBodies(scene: SceneDocument, node: SceneBeat): readonly BodyRef[] {
  for (const body of scene.bodies) { const found = body.nodes.find(item => item.beatId === node.id); if (found) return found.bodies ?? []; }
  return [];
}
/** The node that owns a branch or option body. */
export function bodyOwner(scene: SceneDocument, body: BodyRef): SceneBeat | undefined {
  const owner = bodyOf(scene, body)?.owningNode;
  return owner === undefined ? undefined : beatOf(scene, owner);
}
/** The place right after a node in its body, when core offers one. */
export function placeAfter(scene: SceneDocument, beat: SceneBeat): Position | undefined {
  const body = beatBody(beat), info = bodyOf(scene, body), nodes = info?.nodes ?? [];
  const index = nodes.findIndex(node => node.beatId === beat.id); if (index < 0) return undefined;
  const next = nodes[index + 1] && beatOf(scene, nodes[index + 1]!.beatId);
  const position: Position = next ? { type: "before", anchor: nodeRef(next) } : { type: "end" };
  return info!.places.some(place => samePosition(place.position, position)) ? position : undefined;
}
/** The first place in a body: before its first node, or its only place when empty. */
export function firstPlace(scene: SceneDocument, body: BodyRef): Position | undefined {
  return bodyOf(scene, body)?.places[0]?.position;
}
/** Beat numbers as Tracks shows them: 06 in the scene, 06.2 and 06.2.1 inside its branches.
 *  A branch or option header shares the number of the condition or Choice that owns it. */
export function beatNumbers(scene: SceneDocument): Map<string, string> {
  const numbers = new Map<string, string>();
  const visit = (body: BodyRef, prefix: string, offset: number, depth: number): void => {
    if (depth > 32) return;
    (bodyOf(scene, body)?.nodes ?? []).forEach((node, index) => {
      const number = prefix ? `${prefix}.${offset + index + 1}` : String(index + 1).padStart(2, "0");
      numbers.set(node.beatId, number);
      let inner = 0;
      for (const child of node.bodies ?? []) {
        if (child.type === "branch" && !numbers.has(child.branchId)) numbers.set(child.branchId, number);
        visit(child, number, inner, depth + 1); inner += bodyOf(scene, child)?.nodes.length ?? 0;
      }
    });
  };
  visit({ type: "root" }, "", 0, 0);
  return numbers;
}

/** One colour per branch or option, in scene order, cycling through four. */
export function armOf(scene: SceneDocument, body: BodyRef): number {
  const arms = scene.bodies.filter(item => item.body.type === "branch");
  return Math.max(0, arms.findIndex(item => sameBody(item.body, body))) % 4 + 1;
}

/** Shortens a long condition with whole words, then an ellipsis (story-combined-status header-v2). */
export function shorten(text: string, limit = 26): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit + 1).replace(/\s+\S*$/, "");
  return `${cut || text.slice(0, limit)}…`;
}

/** A new beat that is not yet added, at the place the author chose. */
export interface PendingBeat { readonly key: string; readonly body: BodyRef; readonly position: Position; readonly label: string }
export type TrackItem =
  | { readonly kind: "beat"; readonly beat: SceneBeat; readonly depth: number; readonly chain: readonly BodyRef[] }
  | { readonly kind: "new"; readonly pending: PendingBeat; readonly depth: number; readonly chain: readonly BodyRef[] }
  // An open branch or option: an empty one is one slot, otherwise its entry and exit markers.
  | { readonly kind: "slot" | "entry" | "exit"; readonly owner: SceneBeat; readonly branch: BodyRef; readonly depth: number; readonly chain: readonly BodyRef[] }
  // After a condition or Choice whose branch is open: adds outside its branches.
  | { readonly kind: "after"; readonly owner: SceneBeat; readonly depth: number; readonly chain: readonly BodyRef[] }
  // The end of the scene: adds at the scene's own default place.
  | { readonly kind: "scene-end"; readonly depth: 0; readonly chain: readonly BodyRef[] };

/** The Tracks route: every node of the scene, with the open branch of each condition or Choice. */
export function trackRoute(scene: SceneDocument, open: OpenBranches, pending: readonly PendingBeat[] = []): TrackItem[] {
  const items: TrackItem[] = [];
  const walk = (body: BodyRef, depth: number, chain: readonly BodyRef[]): void => {
    if (depth > 32) return;
    const here = pending.filter(item => sameBody(item.body, body));
    const pendingAt = (position: Position): void => { for (const item of here) if (samePosition(item.position, position)) items.push({ kind: "new", pending: item, depth, chain }); };
    for (const beat of nodeBeats(scene, body)) {
      pendingAt({ type: "before", anchor: nodeRef(beat) });
      items.push({ kind: "beat", beat, depth, chain });
      const bodies = ownedBodies(scene, beat), groupId = bodies[0]?.type === "branch" ? bodies[0].groupId : undefined;
      const branch = groupId === undefined ? undefined : bodies.find(item => item.type === "branch" && item.branchId === open.get(groupId));
      if (!branch) continue;
      const inner = [...chain, branch], empty = !bodyOf(scene, branch)?.nodes.length && !pending.some(item => sameBody(item.body, branch));
      if (empty) items.push({ kind: "slot", owner: beat, branch, depth: depth + 1, chain: inner });
      else { items.push({ kind: "entry", owner: beat, branch, depth: depth + 1, chain: inner }); walk(branch, depth + 1, inner); items.push({ kind: "exit", owner: beat, branch, depth: depth + 1, chain: inner }); }
      items.push({ kind: "after", owner: beat, depth, chain });
    }
    pendingAt({ type: "end" });
  };
  walk({ type: "root" }, 0, []);
  if (bodyOf(scene, { type: "root" })?.defaultPlace) items.push({ kind: "scene-end", depth: 0, chain: [] });
  return items;
}

/** The six lanes, in order. Each beat fills the lane its kind belongs to. */
export const lanes = ["Beat", "Background", "Characters", "Words", "Sound", "Flow"] as const;
export function laneOf(beat: SceneBeat): 1 | 2 | 3 | 4 | 5 {
  if (beat.conditionalBranch) return 5;
  const lane: Partial<Record<BeatPayload["type"], 1 | 2 | 3 | 4>> = { background: 1, transition: 1, showCharacter: 2, hideCharacter: 2, changeAppearance: 2, placement: 2, dialogue: 3, narration: 3, playMusic: 4, stopMusic: 4, playSfx: 4 };
  return lane[beat.payload.type] ?? 5;
}

/**
 * Author-facing wording for the Branch path, insertion markers and draft marks. It names
 * the scene, branch or option itself and never says "body" (story-combined-status / header-v2).
 */
export const trackCopy = {
  pathTitle: "Branch path",
  noForks: "No conditions or choices in this scene.",
  choice: "Choice",
  addAfter: (name: string, fork: "condition" | "choice" | undefined) => `Add after ${name}${fork === "choice" ? " and its options" : fork ? " and its branches" : ""}`,
  firstBeat: (branch: string) => `Add the first beat in ${branch}`,
  outside: (fork: "condition" | "choice", number: string) => `Add after ${fork} ${number}, outside its ${fork === "choice" ? "options" : "branches"}`,
  addBeat: "+ Add a beat",
  empty: "empty",
  show: (branch: string) => `Show ${branch}`,
  hide: (branch: string) => `Close ${branch}`,
  editFork: (fork: "condition" | "choice", number: string) => `Edit ${fork} ${number}`,
  thenNext: (number: string) => `then ${number} →`,
  sceneEnds: "then the scene ends",
  goesTo: (scene: string) => `goes to ${scene}`,
  returns: "returns",
  backTo: (number: string) => `back to ${number}`,
  endsHere: "ends here",
  endingUnknown: "ending unknown",
  key: ["Shaded: carried forward from an earlier beat", "Dashed: state may differ on another route", "Coloured line: the open branch or option"],
  sceneEnd: "End of scene",
  endOf: (branch: string) => `End of ${branch}`,
  addAt: (end: string) => `Add a beat at ${end}`,
  // Beat draft marks, approved as story-combined-status / header-v2.
  draft: "Draft", conflict: "Conflict with source", needsChanges: "Needs changes",
};

/** What Tracks needs from Story to draw and to act. */
export interface TracksContext {
  readonly scene: SceneDocument;
  readonly items: readonly TrackItem[];
  readonly numbers: ReadonlyMap<string, string>;
  /** Selected beat id, branch header id or new beat key. */
  readonly selected?: string;
  readonly locked: boolean;
  readonly label: (beat: SceneBeat) => string;
  readonly summary: (beat: SceneBeat) => string;
  readonly branchName: (header: SceneBeat) => string;
  /** How an end marker names its branch or option: "If trust ≥ 5" in quotes, option 2 "Leave", Otherwise. */
  readonly endName: (header: SceneBeat) => string;
  readonly sceneName: (sceneId: string) => string;
  /** Lane shading: which lanes carry state, and whether state is unknown. */
  readonly state: (beat: SceneBeat) => { readonly background: boolean; readonly characters: boolean; readonly music: boolean; readonly unknown: boolean };
  readonly select: (id: string) => void;
  readonly selectNew: (key: string) => void;
  readonly insert: (body: BodyRef, position: Position, opener: string) => void;
  readonly move: (beat: SceneBeat, direction: "up" | "down") => void;
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node;
}
function action(text: string, className: string, run: () => void): HTMLButtonElement {
  const button = element("button", className, text); button.type = "button"; button.addEventListener("click", run); return button;
}
const forkKind = (beat: SceneBeat): "condition" | "choice" | undefined => beat.payload.type === "choice" ? "choice" : beat.conditionalBranch && !beat.conditionalBranch.choiceOption ? "condition" : undefined;

/** Where a branch or option leads once its beats run out. */
function thenText(context: TracksContext, owner: SceneBeat, branch: BodyRef): string {
  const { scene, numbers } = context, ending = bodyOf(scene, branch)?.ending;
  if (ending?.type === "unknown") return trackCopy.endingUnknown;
  if (ending?.type === "ends") {
    const last = beatOf(scene, ending.beatId)?.payload;
    if (last?.type === "jump") return trackCopy.goesTo(context.sceneName(last.sceneId));
    if (last?.type === "return") return trackCopy.returns;
    if (last?.type === "repeatChoice") return trackCopy.backTo(numbers.get(owner.id) ?? "");
    return trackCopy.endsHere;
  }
  // The next node after the owner, climbing out of enclosing branches.
  let node: SceneBeat | undefined = owner;
  for (let steps = 0; node && steps <= 32; steps++) {
    const nodes = bodyOf(scene, beatBody(node))?.nodes ?? [], index = nodes.findIndex(item => item.beatId === node!.id);
    const next = nodes[index + 1];
    if (next) return trackCopy.thenNext(numbers.get(next.beatId) ?? "");
    node = bodyOwner(scene, beatBody(node));
  }
  return trackCopy.sceneEnds;
}

/** An end marker: "+ End of …", adding at the default place of the scene, branch or option. */
function endButton(context: TracksContext, body: BodyRef, label: string, opener: string): HTMLElement | undefined {
  const place = bodyOf(context.scene, body)?.defaultPlace;
  if (!place || context.locked) return undefined;
  const add = element("button", "story-track-end"); add.type = "button"; add.dataset.beatOpener = opener;
  add.append(element("span", "story-track-end-plus", "+"), element("span", "story-track-end-text", label));
  add.ariaLabel = add.title = trackCopy.addAt(label); add.addEventListener("click", () => context.insert(body, place, opener));
  return add;
}

/** Route rows above a column: one coloured line per open branch level, at most two. */
function rail(context: TracksContext, chain: readonly BodyRef[], label?: { readonly text: string; readonly end?: boolean; readonly empty?: boolean }): HTMLElement {
  const node = element("div", "story-rail"); node.ariaHidden = "true";
  const levels = chain.length > 2 ? [chain[0]!, chain.at(-1)!] : chain;
  for (let row = 0; row < 2; row++) {
    const line = element("span", "story-rail-row"), branch = levels[row];
    if (branch) { line.dataset.arm = String(armOf(context.scene, branch)); line.classList.add("story-rail-on"); }
    node.append(line);
  }
  if (label) {
    const text = element("span", label.end ? "story-rail-end" : "story-rail-label", label.end ? label.text : shorten(label.text, 30));
    text.title = label.text;
    if (label.empty) text.dataset.empty = "true";
    node.children[Math.max(0, Math.min(chain.length, 2) - 1)]!.append(text);
  }
  return node;
}

/** The Tracks grid: lane labels, then one column per beat on the route. */
export function renderTracks(context: TracksContext): HTMLElement {
  const { scene, numbers } = context;
  const grid = element("div", "story-tracks"); grid.role = "group"; grid.ariaLabel = "Beats in story order";
  const labels = element("div", "story-track-labels"); labels.ariaHidden = "true";
  lanes.forEach((lane, index) => labels.append(element("span", `story-track-label story-lane-${index}`, lane)));
  grid.append(labels);
  const beats = context.items.flatMap(item => item.kind === "beat" ? [item.beat] : []);
  const focusColumn = (id: string): void => { [...grid.querySelectorAll<HTMLElement>(".story-track-column")].find(column => column.dataset.beatId === id)?.querySelector<HTMLElement>(":scope > .story-track-beat")?.focus(); };
  for (const item of context.items) {
    if (item.kind === "beat") {
      const { beat } = item, number = numbers.get(beat.id) ?? "", column = element("div", "story-track-column");
      column.dataset.beatId = beat.id; column.dataset.depth = String(item.depth);
      if (item.chain.length) column.dataset.arm = String(armOf(scene, item.chain.at(-1)!));
      column.append(rail(context, item.chain));
      const selected = context.selected === beat.id;
      const button = element("button", "story-track-beat"); button.type = "button"; button.dataset.beatKind = beat.conditionalBranch ? "condition" : beat.payload.type;
      button.ariaLabel = `${number} ${context.label(beat)}: ${context.summary(beat)}`; button.dataset.selected = String(selected);
      if (selected) button.ariaCurrent = "true";
      button.tabIndex = selected || (!context.selected && beat === beats[0]) ? 0 : -1;
      const state = context.state(beat), lane = laneOf(beat);
      lanes.forEach((_lane, index) => {
        const cell = element("span", `story-lane story-lane-${index}`);
        if (index === 0) cell.textContent = number;
        else if (index === lane) cell.textContent = lane === 5 ? `${context.label(beat)} · ${context.summary(beat)}` : context.summary(beat);
        if (index === 3) { const copy = element("span", "story-lane-copy", cell.textContent ?? ""); cell.replaceChildren(copy); }
        cell.classList.toggle("story-lane-present", index === 1 && state.background || index === 2 && state.characters || index === 4 && state.music);
        cell.classList.toggle("story-lane-unknown", index > 0 && state.unknown);
        button.append(cell);
      });
      button.addEventListener("click", () => context.select(beat.id));
      button.addEventListener("keydown", event => {
        const index = beats.indexOf(beat);
        if (event.altKey && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); context.move(beat, event.key === "ArrowUp" || event.key === "ArrowLeft" ? "up" : "down"); return; }
        const target = event.key === "ArrowRight" ? beats[index + 1] : event.key === "ArrowLeft" ? beats[index - 1] : event.key === "Home" ? beats[0] : event.key === "End" ? beats.at(-1) : undefined;
        if (!target) return;
        event.preventDefault(); context.select(target.id); focusColumn(target.id);
      });
      column.append(button);
      // A condition or Choice with an open branch adds after itself from its after marker.
      const fork = forkKind(beat), open = context.items.some(other => other.kind === "after" && other.owner === beat);
      const after = open ? undefined : placeAfter(scene, beat);
      if (after && !context.locked) {
        const add = action("+", "story-track-insert", () => context.insert(beatBody(beat), after, `after:${beat.id}`));
        add.dataset.beatOpener = `after:${beat.id}`; add.ariaLabel = add.title = trackCopy.addAfter(`${number} ${context.label(beat)}`, fork);
        column.append(add);
      }
      grid.append(column);
      continue;
    }
    if (item.kind === "new") {
      const column = element("div", "story-track-column story-track-pending"); column.dataset.newBeat = item.pending.key; column.dataset.depth = String(item.depth);
      if (item.chain.length) column.dataset.arm = String(armOf(scene, item.chain.at(-1)!));
      column.append(rail(context, item.chain));
      const button = element("button", "story-track-beat"); button.type = "button"; button.dataset.selected = String(context.selected === item.pending.key);
      if (context.selected === item.pending.key) button.ariaCurrent = "true";
      button.ariaLabel = `New ${item.pending.label}, not yet added`;
      lanes.forEach((_lane, index) => button.append(element("span", `story-lane story-lane-${index}`, index === 0 ? "New" : index === 3 ? item.pending.label : "")));
      button.addEventListener("click", () => context.selectNew(item.pending.key));
      column.append(button); grid.append(column);
      continue;
    }
    if (item.kind === "scene-end") {
      const mark = element("div", "story-track-mark story-track-scene-end"); mark.append(rail(context, []));
      const add = endButton(context, { type: "root" }, trackCopy.sceneEnd, "end:scene"); if (add) mark.append(add);
      grid.append(mark);
      continue;
    }
    if (item.kind === "after") {
      const mark = element("div", "story-track-mark story-track-after"); mark.dataset.branchOwner = item.owner.id;
      if (item.chain.length) mark.dataset.arm = String(armOf(scene, item.chain.at(-1)!));
      mark.append(rail(context, item.chain));
      const fork = forkKind(item.owner) ?? "condition", after = placeAfter(scene, item.owner);
      if (after && !context.locked) {
        const add = action("+", "", () => context.insert(beatBody(item.owner), after, `after:${item.owner.id}`));
        add.dataset.beatOpener = `after:${item.owner.id}`; add.ariaLabel = add.title = trackCopy.outside(fork, numbers.get(item.owner.id) ?? "");
        mark.append(add);
      }
      grid.append(mark);
      continue;
    }
    const header = item.branch.type === "branch" ? beatOf(scene, item.branch.branchId) : undefined;
    const name = header ? context.branchName(header) : "";
    const mark = element("div", `story-track-mark story-track-${item.kind}`); mark.dataset.branchId = item.branch.type === "branch" ? item.branch.branchId : "";
    mark.dataset.arm = String(armOf(scene, item.branch));
    if (item.kind === "exit") {
      mark.append(rail(context, item.chain, { text: thenText(context, item.owner, item.branch), end: true }));
      const add = header && endButton(context, item.branch, trackCopy.endOf(context.endName(header)), `last:${mark.dataset.branchId}`);
      if (add) mark.append(add); else mark.classList.add("story-track-exit-bare");
      grid.append(mark);
      continue;
    }
    // An empty branch or option is one beat-wide slot holding its name, where it goes next and Add a beat.
    const slot = item.kind === "slot";
    mark.append(rail(context, item.chain, { text: name, empty: slot }));
    if (slot) {
      mark.classList.add("story-track-slot"); mark.dataset.beatId = mark.dataset.branchId;
      mark.querySelector(".story-rail-label")?.after(element("span", "story-rail-end", thenText(context, item.owner, item.branch)));
      const select = action(name, "story-slot-name", () => { if (header) context.select(header.id); });
      select.dataset.selected = String(!!header && context.selected === header.id); if (select.dataset.selected === "true") select.ariaCurrent = "true";
      mark.append(select);
    }
    const first = firstPlace(scene, item.branch);
    if (first && !context.locked) {
      const add = action(slot ? trackCopy.addBeat : "+", "", () => context.insert(item.branch, first, `first:${mark.dataset.branchId}`));
      add.dataset.beatOpener = `first:${mark.dataset.branchId}`; add.ariaLabel = add.title = trackCopy.firstBeat(name); mark.append(add);
    }
    grid.append(mark);
  }
  return grid;
}

/** Keeps each open branch's name beside the lane labels while its route is on screen, as
 *  Story Combined v1 does: the label slides right with the scroll and stops before its end.
 *  Call it once the scroller is in the document. */
export function pinRouteLabels(scroller: HTMLElement): void {
  const pin = (): void => {
    const cover = (scroller.querySelector(".story-track-labels")?.getBoundingClientRect().right ?? 0) + 8;
    const ends = [...scroller.querySelectorAll<HTMLElement>(".story-track-exit")];
    for (const entry of scroller.querySelectorAll<HTMLElement>(".story-track-entry, .story-track-slot")) {
      const label = entry.querySelector<HTMLElement>(".story-rail-label"); if (!label) continue;
      label.style.translate = "";
      const own = label.getBoundingClientRect();
      const end = ends.find(mark => mark.dataset.branchId === entry.dataset.branchId)?.querySelector(".story-rail-end") ?? entry.querySelector(".story-rail-end");
      const shift = Math.max(0, Math.min(cover - own.left, (end?.getBoundingClientRect().left ?? own.right) - 8 - own.right));
      if (shift > 0) label.style.translate = `${shift}px 0`;
    }
  };
  scroller.addEventListener("scroll", pin, { passive: true }); pin();
}

export interface BranchPathContext {
  readonly scene: SceneDocument;
  readonly items: readonly TrackItem[];
  readonly numbers: ReadonlyMap<string, string>;
  readonly open: OpenBranches;
  readonly caption: (owner: SceneBeat) => string;
  readonly branchName: (header: SceneBeat) => string;
  readonly select: (id: string) => void;
  readonly toggle: (owner: SceneBeat, branch: BodyRef) => void;
}

/** The Branch path: each condition or Choice on the route, with a switch for its branches. It only switches branches. */
export function renderBranchPath(context: BranchPathContext): HTMLElement {
  const { scene, numbers } = context;
  const path = element("nav", "story-branch-path"); path.ariaLabel = trackCopy.pathTitle;
  path.append(element("strong", "story-branch-path-title", trackCopy.pathTitle));
  const groups = element("div", "story-branch-groups");
  for (const item of context.items) {
    if (item.kind !== "beat") continue;
    const owner = item.beat, fork = forkKind(owner), bodies = ownedBodies(scene, owner);
    if (!fork || !bodies.length) continue;
    const number = numbers.get(owner.id) ?? "";
    const group = element("div", "story-branch-group"); group.dataset.branchOwner = owner.id;
    if (groups.children.length) { const arrow = element("span", "story-path-arrow", "›"); arrow.ariaHidden = "true"; group.append(arrow); }
    const edit = action(number, "story-branch-ref", () => context.select(owner.id)); edit.ariaLabel = trackCopy.editFork(fork, number);
    const caption = fork === "choice" ? trackCopy.choice : context.caption(owner);
    const test = element("span", "story-branch-test", shorten(caption)); test.title = caption;
    const switches = element("div", "story-branch-switch"); switches.role = "group"; switches.ariaLabel = `${fork === "choice" ? "Options of choice" : "Branches of condition"} ${number}`;
    bodies.forEach((body, index) => {
      if (body.type !== "branch") return;
      const header = beatOf(scene, body.branchId); if (!header) return;
      const open = context.open.get(body.groupId) === body.branchId, name = context.branchName(header);
      const text = fork === "choice" ? (open ? `${index + 1} ${optionText(owner, body.branchId)}`.trim() : String(index + 1))
        : !header.conditionalBranch?.ordinal && !header.conditionalBranch?.otherwise ? "If" : header.conditionalBranch.otherwise ? "Otherwise" : "Else if";
      const button = action(text, "story-branch-segment", () => context.toggle(owner, body));
      button.dataset.branchId = body.branchId; button.dataset.arm = String(armOf(scene, body)); button.ariaPressed = String(open);
      button.ariaLabel = button.title = open ? trackCopy.hide(name) : trackCopy.show(name);
      switches.append(button);
    });
    group.append(edit, test, switches); groups.append(group);
  }
  if (!groups.children.length) groups.append(element("span", "story-branch-empty", trackCopy.noForks));
  path.append(groups);
  return path;
}
function optionText(owner: SceneBeat, optionId: string): string {
  return owner.payload.type === "choice" ? owner.payload.options.find(option => option.id === optionId)?.text.trim() ?? "" : "";
}

/** The marks legend beside the view name. Needs changes shows only after a refused Save. */
export function renderMarksLegend(): HTMLElement {
  const legend = element("span", "story-marks-legend");
  const item = (mark: string, kind: string, text: string): HTMLElement => { const node = element("span", `story-legend-${kind}`); node.append(element("b", `story-mark-${kind}`, mark), ` ${text}`); return node; };
  const failing = item("!", "fail", trackCopy.needsChanges); failing.hidden = true;
  legend.append(item("*", "draft", trackCopy.draft), item("!", "conflict", trackCopy.conflict), failing);
  return legend;
}

/** The Tracks key: what shading, dashes and route lines mean. */
export function renderTracksKey(): HTMLElement {
  const key = element("details", "story-track-key");
  const summary = element("summary", "button secondary", "Key"); summary.ariaLabel = "Tracks key";
  const list = element("div", "story-track-key-list");
  for (const line of trackCopy.key) list.append(element("p", "", line));
  key.append(summary, list);
  key.addEventListener("keydown", event => { if (event.key === "Escape" && key.open) { event.preventDefault(); event.stopPropagation(); key.open = false; summary.focus(); } });
  return key;
}
