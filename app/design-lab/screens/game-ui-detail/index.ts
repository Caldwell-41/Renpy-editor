// Game UI detailed level study (#205): direct work on elements on the screen canvas, on top of the approved layout B.
// Three mocks, switchable via ?variant=. Each one is a set of four choices that the dashed bar can also change one at a time:
// what a click selects, what a drag does in a row or column, where a new element lands, and how the four states show.
// Throwaway and memory-only. Nothing here reads a project, writes source or runs Ren'Py.
import type { LabContext } from '../../contracts.ts';
import { icon } from '../../../src/icons.ts';
import { art } from '../game-ui/model.ts';
import '../game-ui/game.css';
import '../game-ui/style.css';
import './style.css';

export type Preset = 'point' | 'boxes' | 'place';
type Opt = { click: 'deep' | 'boxes'; drag: 'reorder' | 'offset'; add: 'selection' | 'place'; states: 'switch' | 'matrix' | 'diff' };
const presets: Record<Preset, Opt> = {
  point: { click: 'deep', drag: 'reorder', add: 'selection', states: 'switch' },
  boxes: { click: 'boxes', drag: 'offset', add: 'place', states: 'matrix' },
  place: { click: 'deep', drag: 'reorder', add: 'place', states: 'diff' },
};
const presetNames: Record<Preset, string> = { point: 'A · Point and change', boxes: 'B · Boxes first', place: 'C · Place it yourself' };
const optNames: { [K in keyof Opt]: [label: string, options: [Opt[K], string][]] } = {
  click: ['A click selects', [['deep', 'What you point at'], ['boxes', 'The box first']]],
  drag: ['A drag in a row or column', [['reorder', 'Moves it to a new place'], ['offset', 'Shifts it by pixels']]],
  add: ['A new element', [['selection', 'Lands by the selection'], ['place', 'Goes where you click']]],
  states: ['States', [['switch', 'One at a time'], ['matrix', 'Side by side'], ['diff', 'Differences from Idle']]],
};

type V = string | number;
type St = 'idle' | 'hover' | 'selected' | 'disabled';
const states: St[] = ['idle', 'hover', 'selected', 'disabled'];
const cap = (text: string) => text[0]!.toUpperCase() + text.slice(1);
type Action = { id: number; type: 'set' | 'show' | 'hide'; name?: string; op?: string; value?: string; screen?: string };
type Kind = 'Text' | 'Image' | 'Button' | 'Bar' | 'Box' | 'Code';
type El = {
  id: string; kind: Kind; name?: string; text?: string;
  /** A Box arranges its elements in a column or a row, or leaves each one where the author put it. */
  kids?: El[]; arrange?: 'column' | 'row' | 'free'; gap?: number; pad?: number; frame?: boolean;
  /** Free placement: the top left corner, in game pixels. */
  at?: { x: number; y: number };
  /** In a row or column: how far it sits from its place. */
  off?: { x: number; y: number };
  w?: number; h?: number;
  /** Its look group. Loomlight makes each group. */
  group?: string; own?: Record<string, V>;
  actions?: Action[]; stock?: string; bind?: string; max?: number; entrance?: string; pic?: string;
  /** Why it does not move here. */
  fixed?: string;
};
type Doc = { screens: Record<string, El>; groups: Record<string, Record<string, V>>; game: Record<string, Record<string, V>> };
type Sel = { g?: string; e?: string } | null;
type Level = { label: string; own: Record<string, V> };
type Setting = { key: string; label: string; type: 'color' | 'px' | 'pick'; perState?: boolean; none?: boolean; max?: number; options?: [string, string][] };
type Rect = { x: number; y: number; w: number; h: number };

const looks: Record<string, Setting[]> = {
  Button: [
    { key: 'text', label: 'Text', type: 'color', perState: true }, { key: 'fill', label: 'Fill', type: 'color', perState: true, none: true },
    { key: 'border', label: 'Border', type: 'color', perState: true, none: true }, { key: 'corners', label: 'Corners', type: 'px', max: 40 },
    { key: 'motion', label: 'On hover', type: 'pick', options: [['none', 'No animation'], ['lift', 'Lift'], ['grow', 'Grow'], ['glow', 'Glow']] }],
  Text: [{ key: 'text', label: 'Color', type: 'color' }, { key: 'size', label: 'Size', type: 'px', max: 120 }],
  Box: [{ key: 'fill', label: 'Fill', type: 'color', none: true }, { key: 'border', label: 'Border', type: 'color', none: true }, { key: 'corners', label: 'Corners', type: 'px', max: 60 }],
  Bar: [{ key: 'track', label: 'Track', type: 'color' }, { key: 'filled', label: 'Filled part', type: 'color' }, { key: 'corners', label: 'Corners', type: 'px', max: 20 }],
};
const plural: Record<string, string> = { Button: 'Buttons', Text: 'Text', Box: 'Boxes', Bar: 'Bars' };
const inGame: Record<string, string> = { Button: 'buttons in the game', Text: 'text in the game', Box: 'boxes in the game', Bar: 'bars in the game' };
const variables: [name: string, type: string, sample: string][] = [['platform', 'whole number', '4'], ['depart_time', 'text', '23:52'], ['tram_wait', 'whole number', '6'], ['boarded', 'true or false', 'False']];
const entrances: [string, string][] = [['none', 'No animation'], ['fade', 'Fade'], ['up', 'Slide up'], ['left', 'Slide from left'], ['right', 'Slide from right'], ['pop', 'Pop']];
const listed: [title: string, rows: [id: string, name: string][]][] = [
  ['During the story', [['say', 'Dialogue box'], ['choice', 'Choices'], ['quick', 'Quick menu']]],
  ['Menus', [['title', 'Title screen'], ['pause', 'Pause menu'], ['save', 'Save and load'], ['prefs', 'Options'], ['history', 'History'], ['confirm', 'Confirm prompt']]],
  ['Your screens', [['ticket', 'Ticket stub']]],
];
const titles: Record<string, string> = { title: 'Title screen', ticket: 'Ticket stub' };

const menuButton = (id: string, text: string, stock: string): El => ({ id, kind: 'Button', text, group: 'menu', stock });
function fresh(): Doc {
  return {
    game: {
      Button: { text: '#f6efe2', 'hover.text': '#e8a54b', 'selected.text': '#e8a54b', 'disabled.text': '#8a8377', fill: '', border: '', corners: 10, motion: 'none' },
      Text: { text: '#f6efe2', size: 36 }, Box: { fill: '#1d1410', border: '#8a6a35', corners: 10 }, Bar: { track: '#3a3028', filled: '#e8a54b', corners: 6 },
    },
    groups: { menu: {} },
    screens: {
      title: { id: 'title', kind: 'Box', arrange: 'free', kids: [
        { id: 'bg', kind: 'Image', name: 'Background', pic: 'dawn', fixed: 'The background fills the screen. It does not move.' },
        { id: 'panel', kind: 'Box', name: 'Menu panel', frame: true, group: 'Box:title', arrange: 'free', at: { x: 0, y: 0 }, w: 440, h: 1080, own: { corners: 0, fill: '#1d1410d6' }, kids: [] },
        { id: 'menu', kind: 'Box', name: 'Menu', arrange: 'column', gap: 14, at: { x: 62, y: 330 }, kids: [
          menuButton('start', 'Start', 'Starts the game'), menuButton('load', 'Load', 'Opens Load'), menuButton('prefs', 'Preferences', 'Opens Options'),
          menuButton('about', 'About', 'Opens About'), menuButton('help', 'Help', 'Opens Help'), menuButton('quit', 'Quit', 'Asks, then closes the game')] },
        { id: 'name', kind: 'Text', text: 'The Last Tram', group: 'Text:title', at: { x: 1180, y: 850 }, own: { text: '#e8a54b', size: 96 } },
        { id: 'version', kind: 'Text', text: 'Version 1.0', group: 'Text:title', at: { x: 1640, y: 980 }, own: { size: 28 } },
      ] },
      ticket: { id: 'ticket', kind: 'Box', arrange: 'free', kids: [
        { id: 'stub', kind: 'Box', name: 'Stub box', frame: true, group: 'Box:ticket', arrange: 'column', gap: 16, pad: 30, at: { x: 1210, y: 100 }, w: 620, kids: [
          { id: 'heading', kind: 'Text', text: 'Night service', group: 'Text:ticket', own: { text: '#e8a54b', size: 50 } },
          { id: 'detail', kind: 'Text', text: 'Platform [platform] · [depart_time] · one way', group: 'Text:ticket', own: { size: 30 } },
          { id: 'stops', kind: 'Code', name: 'Stops list' },
          { id: 'wait', kind: 'Bar', name: 'Wait bar', group: 'Bar:ticket', bind: 'tram_wait', max: 10, w: 554 },
          { id: 'row', kind: 'Box', name: 'Buttons row', arrange: 'row', gap: 14, kids: [
            { id: 'board', kind: 'Button', text: 'Board the tram', group: 'Button:ticket', own: { fill: '#e8a54b', text: '#1d1410' }, entrance: 'custom',
              actions: [{ id: 1, type: 'set', name: 'boarded', op: 'set', value: 'True' }, { id: 2, type: 'hide', screen: 'ticket' }] },
            { id: 'later', kind: 'Button', text: 'Wait', group: 'Button:ticket', own: { border: '#8a6a35' }, actions: [{ id: 3, type: 'set', name: 'tram_wait', op: 'add', value: '1' }] }] },
        ] },
        { id: 'stamp', kind: 'Image', name: 'Stamp', pic: 'stamp', at: { x: 1730, y: 30 }, w: 150, h: 150 },
      ] },
    },
  };
}

const esc = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const svg = (d: string) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const glyph = {
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11', redo: 'm15 14 5-5-5-5m5 5H9.5a5.5 5.5 0 0 0 0 11H13', gameUi: 'M3 4h18v13H3zM8 21h8M12 17v4M7 12h6M7 9h3',
  plus: 'M12 5v14M5 12h14', back: 'm14 5-7 7 7 7', next: 'm10 5 7 7-7 7', down: 'm6 9 6 6 6-6', up: 'm6 15 6-6 6 6', more: 'M5 12h.01M12 12h.01M19 12h.01',
  linked: 'M9 17H7a5 5 0 0 1 0-10h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8', unlinked: 'M9 17H7a5 5 0 0 1 0-10h2M15 7h2a5 5 0 0 1 0 10h-2', code: 'M8 8l-4 4 4 4M16 8l4 4-4 4',
  none: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM6.4 6.4l11.2 11.2',
};
const mac = /Mac|iPhone|iPad/.test(navigator.platform);
const u = (px: number) => `${+(px / 19.2).toFixed(3)}cqw`;
const same = (a: Sel, b: Sel) => !!a && !!b && a.g === b.g && a.e === b.e;

export function mountDetail(host: HTMLElement, context: LabContext, initial: Preset) {
  document.documentElement.dataset.theme = context.theme;
  let preset: Preset | '' = initial, opt: Opt = { ...presets[initial] };
  let doc: Doc, done: { name: string; page: string; before: Doc; after: Doc }[], undone: typeof done, saved: number, status: string;
  let page: string, sel: Sel, hover: Sel = null, showState: St, cell: string, more: boolean, listOpen: boolean | null, open: string, expanded: number | null;
  let copied: { kind: string; values: Record<string, V>; from: string } | null, placing: Kind | null, nextNew: number, nextAction: number;
  // What the pointer is doing on the canvas: an outline that follows it, and the line where the element will land.
  let ghost: Rect | null = null, line: Rect | null = null, pending: Doc | null = null, focusCanvas = false;

  function reset(state: string) {
    doc = fresh(); done = []; undone = []; saved = 0; status = 'Ready'; page = 'ticket'; sel = null; hover = null; showState = 'idle'; cell = 'idle.text';
    more = false; listOpen = null; open = ''; expanded = null; copied = null; placing = null; nextNew = 1; nextAction = 10; ghost = line = null;
    if (state === 'group') { page = 'title'; sel = { g: 'menu' }; }
    if (state === 'button') { sel = { e: 'board' }; expanded = 1; }
    if (state === 'text') sel = { e: 'detail' };
    if (state === 'bar') sel = { e: 'wait' };
    if (state === 'source') sel = { e: 'stops' };
    if (state === 'box') { sel = { e: 'stub' }; more = true; }
  }

  // ---- the sample screen ----
  const root = () => doc.screens[page]!;
  type Found = { el: El; parent: El; path: El[] };
  function find(id: string, el = root(), path: El[] = []): Found | null {
    for (const kid of el.kids ?? []) {
      if (kid.id === id) return { el: kid, parent: el, path };
      const deep = find(id, kid, [...path, kid]);
      if (deep) return deep;
    }
    return null;
  }
  function all(el = root(), list: El[] = []) { for (const kid of el.kids ?? []) { list.push(kid); all(kid, list); } return list; }
  const members = (g: string) => all().filter(el => el.group === g);
  const kindOf = (g: string) => g === 'menu' ? 'Button' : g.split(':')[0]!;
  const groupName = (g: string) => g === 'menu' ? 'Menu buttons' : `${plural[kindOf(g)]} on this screen`;
  const nameOf = (el: El) => el.name ?? (el.text?.trim() || `New ${el.kind.toLowerCase()}`);
  const selEls = (s: Sel) => s?.g ? members(s.g) : s?.e && find(s.e) ? [find(s.e)!.el] : [];
  const selKind = (s: Sel) => s?.g ? kindOf(s.g) : s?.e ? find(s.e)?.el.kind ?? '' : '';
  const arranged = (f: Found) => f.parent.arrange !== 'free';

  // ---- the three look levels ----
  function levels(s: Sel): Level[] {
    const game = (kind: string): Level => ({ label: inGame[kind] ?? '', own: doc.game[kind] ?? {} });
    const group = (g: string): Level => ({ label: groupName(g), own: doc.groups[g] ??= {} });
    if (s?.g) return [group(s.g), game(kindOf(s.g))];
    const el = find(s!.e!)!.el;
    return [{ label: nameOf(el), own: el.own ??= {} }, ...(el.group ? [group(el.group)] : []), game(el.kind)];
  }
  /** The value in use and where it comes from. The nearest level with an own value wins, and at that level
   *  a state's own value beats the Idle one. `skip` leaves out one own key of the first level. */
  function resolve(L: Level[], key: string, st: St, skip = ''): { value: V; depth: number; viaIdle: boolean } {
    for (let i = 0; i < L.length; i++) {
      const own = L[i]!.own, k = `${st}.${key}`;
      if (st !== 'idle' && k in own && !(i === 0 && k === skip)) return { value: own[k]!, depth: i, viaIdle: false };
      if (key in own && !(i === 0 && key === skip)) return { value: own[key]!, depth: i, viaIdle: st !== 'idle' };
    }
    return { value: '', depth: L.length - 1, viaIdle: false };
  }
  const fromName = (L: Level[], r: { depth: number }) => r.depth === 0 ? 'Idle' : L[r.depth]!.label;

  // ---- drawing: a browser drawing stands in for the frame the hidden Ren'Py process sends ----
  const shown = (text: string) => esc(text).replace(/\[(\w+)\]/g, (whole, name: string) => variables.find(([n]) => n === name)?.[2] ?? whole);
  function drawEl(el: El, parent: El): string {
    if (el.id === 'bg') return `<div class="d-el g-bg" data-el="bg" style="background-image:url(${art[el.pic!]})"></div>`;
    const forced = el.kind === 'Button' && showState !== 'idle' && selEls(sel).includes(el) ? showState : 'idle';
    const L = levels({ e: el.id });
    const v = (key: string) => resolve(L, key, forced).value;
    const css: string[] = [];
    if (parent.arrange === 'free') css.push(`position:absolute;left:${u(el.at?.x ?? 0)};top:${u(el.at?.y ?? 0)}`);
    else if (el.off) css.push(`translate:${u(el.off.x)} ${u(el.off.y)}`);
    if (el.w) css.push(`width:${u(el.w)}`);
    if (el.h) css.push(`height:${u(el.h)}`);
    let inner = '', cls = `d-${el.kind}`;
    if (el.kind === 'Box') {
      cls += ` d-a-${el.arrange}`;
      css.push(`gap:${u(el.gap ?? 0)};padding:${u(el.pad ?? 0)}`);
      if (el.frame) css.push(`background:${v('fill') || 'transparent'};border:${u(3)} solid ${v('border') || 'transparent'};border-radius:${u(Number(v('corners')))}`);
      inner = el.kids!.map(kid => drawEl(kid, el)).join('');
    } else if (el.kind === 'Button') { css.push(`color:${v('text')};background:${v('fill') || 'transparent'};border-color:${v('border') || 'transparent'};border-radius:${u(Number(v('corners')))}`); inner = shown(el.text ?? ''); }
    else if (el.kind === 'Text') { css.push(`color:${v('text')};font-size:${u(Number(v('size')))}`); inner = shown(el.text ?? ''); }
    else if (el.kind === 'Bar') {
      const sample = Number(variables.find(([n]) => n === el.bind)?.[2] ?? 0), part = el.bind ? Math.min(1, sample / (el.max || 1)) : 0.5;
      css.push(`background:${v('track')};border-radius:${u(Number(v('corners')))}`);
      inner = `<i style="width:${part * 100}%;background:${v('filled')}"></i>`;
    } else if (el.kind === 'Image') { cls += el.pic ? ` d-pic-${el.pic}` : ' d-nopic'; inner = el.pic === 'stamp' ? 'NIGHT<br>FARE' : el.pic ? '' : 'Picture'; }
    else inner = ['Harrow Quay', 'Mill Lane', 'Depot'].map(stop => `<span>${stop}</span>`).join('<b>›</b>');
    return `<div class="d-el ${cls}" data-el="${el.id}" style="${css.join(';')}">${inner}</div>`;
  }
  function stageHtml() {
    const back = page === 'ticket' ? `<div class="g-bg" style="background-image:url(${art.platform})"></div><img class="g-sprite" src="${art.mara}" alt="">` : '';
    return `<div class="g d-root" style="--gf:Georgia,'Iowan Old Style',serif;--gz:1;--gt:#f6efe2;--gp:#1d1410;--ga:#e8a54b">${back}${root().kids!.map(kid => drawEl(kid, root())).join('')}</div>`;
  }
  function refreshStage() { const stage = host.querySelector<HTMLElement>('[data-main]'); if (stage) stage.innerHTML = stageHtml(); drawOver(); }

  // ---- the outlines: Loomlight draws them over the frame, from the rectangles the helper reports ----
  function rectOf(id: string): Rect | null {
    const node = host.querySelector(`[data-main] [data-el="${id}"]`), view = host.querySelector('.gu-view');
    if (!node || !view) return null;
    const a = view.getBoundingClientRect(), b = node.getBoundingClientRect();
    return { x: b.left - a.left + view.scrollLeft, y: b.top - a.top + view.scrollTop, w: b.width, h: b.height };
  }
  const place = (r: Rect) => `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`;
  function tagOf(s: Sel) {
    if (s?.g) return `${groupName(s.g)} · ${members(s.g).length}`;
    const el = find(s!.e!)!.el;
    return `${nameOf(el)}${el.kind === 'Code' ? ' · Source only' : el.fixed ? ' · does not move' : ''}`;
  }
  const canResize = (el: El) => !el.fixed && el.kind !== 'Code';
  function drawOver() {
    const over = host.querySelector<HTMLElement>('.d-over');
    if (!over) return;
    const outline = (el: El, cls: string, tag: string) => {
      const r = rectOf(el.id);
      return r ? `<i class="d-out ${cls}${el.kind === 'Code' ? ' d-src' : ''}" style="${place(r)}">${tag ? `<em class="${r.y < 24 ? 'd-tag-in' : ''}${r.x + 170 > over.clientWidth ? ' d-tag-right' : ''}">${esc(tag)}</em>` : ''}</i>` : '';
    };
    let html = hover && !same(hover, sel) ? selEls(hover).map((el, i) => outline(el, 'd-hov', i === 0 ? tagOf(hover) : '')).join('') : '';
    html += selEls(sel).map((el, i) => outline(el, 'd-sel', i === 0 ? tagOf(sel) : '')).join('');
    const one = sel?.e ? find(sel.e)?.el : null, r = one && canResize(one) && !ghost ? rectOf(one.id) : null;
    // Text takes a width and wraps, so it has one handle. The others take a width and a height.
    if (one && r) html += (one.kind === 'Text' ? ['e'] : ['e', 's', 'se']).map(dir => `<b class="d-h d-h-${dir}" data-handle="${dir}" style="left:${r.x + (dir === 's' ? r.w / 2 : r.w)}px;top:${r.y + (dir === 'e' ? r.h / 2 : r.h)}px"></b>`).join('');
    if (ghost) html += `<i class="d-ghost" style="${place(ghost)}"></i>`;
    if (line) html += `<i class="d-line" style="${place(line)}"></i>`;
    over.innerHTML = html;
  }

  // ---- selection ----
  /** What repeated clicks on one element select, in order. "What you point at": its group, then the element.
   *  "The box first": each box around it from the outside in, then its group, then the element. */
  function ladder(id: string): Sel[] {
    const f = find(id)!, g = f.el.group && members(f.el.group).length > 1 ? [{ g: f.el.group }] : [];
    return [...(opt.click === 'boxes' ? f.path.map(box => ({ e: box.id })) : []), ...g, { e: id }];
  }
  /** The path from the screen to the selection: the boxes around it, its group, then the element. Esc goes one step left. */
  function pathOf(s: Sel): Sel[] {
    const first = selEls(s)[0];
    if (!first) return [];
    const f = find(first.id)!;
    return [...f.path.map(box => ({ e: box.id })), ...(first.group && members(first.group).length > 1 ? [{ g: first.group }] : []), ...(s!.e ? [{ e: s!.e }] : [])];
  }
  function select(next: Sel) {
    if (!same(next, sel) && selKind(next) !== selKind(sel)) { showState = 'idle'; cell = 'idle.text'; }
    if (!same(next, sel)) expanded = null;
    sel = next; open = '';
  }
  const selName = (s: Sel) => s?.g ? groupName(s.g) : nameOf(find(s!.e!)!.el);
  const order = () => all().filter(el => el.id !== 'bg');

  // ---- edits ----
  const clone = (d: Doc): Doc => structuredClone(d);
  function push(name: string, before: Doc) { done.push({ name, page, before, after: clone(doc) }); undone = []; status = cap(name); }
  function commit(name: string, change: () => void) { const before = clone(doc); change(); push(name, before); }
  function step(back: boolean) {
    const entry = (back ? done : undone).pop();
    if (!entry) return;
    doc = clone(back ? entry.before : entry.after); (back ? undone : done).push(entry); page = entry.page;
    // Undo keeps the selection when its element still exists.
    if (sel && !selEls(sel).length) sel = null;
    status = `${back ? 'Undone' : 'Redone'}: ${entry.name}`;
  }
  const scale = () => 1920 / host.querySelector<HTMLElement>('[data-main]')!.getBoundingClientRect().width;
  /** The row or column under the pointer, and the place in it. Null means free space. */
  function dropTarget(x: number, y: number, dragId: string | null): { box: El; index: number; line: Rect } | null {
    for (const node of document.elementsFromPoint(x, y)) {
      const id = (node as HTMLElement).dataset?.el;
      const f = id ? find(id) : null;
      if (!f || id === dragId || f.path.some(box => box.id === dragId)) continue;
      const box = f.el.kind === 'Box' && f.el.arrange !== 'free' ? f.el : f.parent !== root() && f.parent.arrange !== 'free' ? f.parent : null;
      if (!box) return null;
      const a = rectOf(box.id)!, view = host.querySelector('.gu-view')!.getBoundingClientRect(), row = box.arrange === 'row';
      const at = row ? x - view.left : y - view.top;
      const rects = box.kids!.filter(kid => kid.id !== dragId).map(kid => rectOf(kid.id)!);
      const index = rects.filter(r => (row ? r.x + r.w / 2 : r.y + r.h / 2) < at).length;
      const edge = !rects.length ? (row ? a.x : a.y) + 6 : index < rects.length ? (row ? rects[index]!.x : rects[index]!.y) - 4 : (row ? rects.at(-1)!.x + rects.at(-1)!.w : rects.at(-1)!.y + rects.at(-1)!.h) + 3;
      return { box, index, line: row ? { x: edge, y: a.y, w: 2, h: a.h } : { x: a.x, y: edge, w: a.w, h: 2 } };
    }
    return null;
  }
  /** An element takes the group of its kind in the box it joins. Outside such a box it is in its screen's group. */
  function regroup(el: El, box: El) {
    if (!looks[el.kind] || (el.kind === 'Box' && !el.frame)) return;
    el.group = box.kids!.find(kid => kid !== el && kid.kind === el.kind && kid.group)?.group ?? `${el.kind}:${page}`;
  }
  function moveInto(id: string, box: El, index: number) {
    const f = find(id)!;
    f.parent.kids!.splice(f.parent.kids!.indexOf(f.el), 1);
    delete f.el.at; delete f.el.off;
    box.kids!.splice(index, 0, f.el); regroup(f.el, box);
  }
  function moveFree(id: string, at: { x: number; y: number }) {
    const f = find(id)!;
    if (f.parent !== root()) { f.parent.kids!.splice(f.parent.kids!.indexOf(f.el), 1); root().kids!.push(f.el); regroup(f.el, root()); }
    delete f.el.off; f.el.at = at;
  }
  function make(kind: Kind): El {
    const id = `new${nextNew++}`, g = `${kind}:${page}`;
    if (kind === 'Text') return { id, kind, text: 'New text', group: g };
    if (kind === 'Button') return { id, kind, text: 'New button', group: g, actions: [] };
    if (kind === 'Bar') return { id, kind, name: 'New bar', group: g, w: 360, max: 100 };
    if (kind === 'Image') return { id, kind, name: 'Picture', w: 280, h: 180 };
    return { id, kind, name: 'New box', frame: true, group: g, arrange: 'column', gap: 12, pad: 20, w: 420, h: 200, kids: [] };
  }
  function addAt(kind: Kind, target: { box: El; index: number } | null, at: { x: number; y: number }) {
    const el = make(kind);
    commit(`add ${kind.toLowerCase()}`, () => {
      if (target) { target.box.kids!.splice(target.index, 0, el); regroup(el, target.box); } else { el.at = at; root().kids!.push(el); }
    });
    const before = target ? target.box.kids![target.index - 1] : null;
    status = target ? `Added to ${nameOf(target.box)}${before ? `, after ${nameOf(before)}` : ', at the start'}${el.group && el.group !== `${kind}:${page}` ? `. It is one of the ${groupName(el.group)}` : ''}.` : 'Added to the screen. It stays where you put it.';
    select({ e: el.id });
  }
  /** "Lands by the selection": in the selected row or column, or after the selected element. With no selection, the middle of the screen. */
  function addBySelection(kind: Kind) {
    const anchor = selEls(sel).at(-1), f = anchor ? find(anchor.id)! : null;
    if (f && sel?.e && f.el.kind === 'Box' && f.el.arrange !== 'free') addAt(kind, { box: f.el, index: f.el.kids!.length }, { x: 0, y: 0 });
    else if (f && arranged(f)) addAt(kind, { box: f.parent, index: f.parent.kids!.indexOf(f.el) + 1 }, { x: 0, y: 0 });
    else addAt(kind, null, { x: 820, y: 470 + 70 * ((nextNew - 1) % 6) });
  }
  function remove() {
    if (!sel) return;
    if (sel.g) { status = 'Select one element to delete it. A group is a shared look, not a thing on the screen.'; return; }
    const f = find(sel.e!)!;
    if (f.el.fixed || f.el.kind === 'Code') { status = f.el.kind === 'Code' ? `${nameOf(f.el)} is source only. Delete its lines in Source.` : `${nameOf(f.el)} cannot go. Its settings can hide it.`; return; }
    commit(`delete ${nameOf(f.el)}`, () => { f.parent.kids!.splice(f.parent.kids!.indexOf(f.el), 1); });
    select(f.parent === root() ? null : { e: f.parent.id });
  }
  function shift(by: number) {
    const f = sel?.e ? find(sel.e) : null;
    if (!f) return;
    const kids = f.parent.kids!, i = kids.indexOf(f.el), to = i + by;
    if (to < (kids[0]?.id === 'bg' ? 1 : 0) || to >= kids.length) return;
    commit(`move ${nameOf(f.el)} ${by < 0 ? 'earlier' : 'later'}`, () => { kids.splice(i, 1); kids.splice(to, 0, f.el); });
  }
  function nudge(dx: number, dy: number) {
    const f = sel?.e ? find(sel.e) : null;
    if (!f) { status = sel?.g ? 'Select one element to move it.' : status; return; }
    if (f.el.fixed || f.el.kind === 'Code') { status = `${nameOf(f.el)} does not move here.`; return; }
    if (arranged(f) && opt.drag === 'reorder') {
      const along = f.parent.arrange === 'row' ? dx : dy;
      if (along) shift(Math.sign(along)); else status = `${nameOf(f.parent)} arranges it. The arrow keys move it along the ${f.parent.arrange}.`;
      return;
    }
    commit(`move ${nameOf(f.el)}`, () => {
      if (arranged(f)) f.el.off = { x: (f.el.off?.x ?? 0) + dx, y: (f.el.off?.y ?? 0) + dy };
      else f.el.at = { x: (f.el.at?.x ?? 0) + dx, y: (f.el.at?.y ?? 0) + dy };
    });
  }
  function setLook(key: string, value: V) { levels(sel)[0]!.own[key] = value; }
  const lookEdit = (key: string) => `${selName(sel)} ${key.includes('.') ? `${key.split('.')[0]} ` : ''}${looks[selKind(sel)]?.find(def => def.key === key.split('.').pop())?.label.toLowerCase() ?? key}`;

  // ---- the panel ----
  function chain(L: Level[], def: Setting, st: St) {
    const key = st === 'idle' ? def.key : `${st}.${def.key}`;
    if (!(key in L[0]!.own)) {
      const from = fromName(L, resolve(L, def.key, st));
      return `<span class="gu-linked" role="img" aria-label="Same as ${esc(from)}" data-tip="Same as ${esc(from)}. Change it here to give it an own value.">${svg(glyph.linked)}</span>`;
    }
    const from = fromName(L, resolve(L, def.key, st, key));
    return `<span class="gu-anchor"><button type="button" class="gu-flat gu-same" data-do="menu:chain:${key}" aria-expanded="${open === `chain:${key}`}" aria-label="${esc(def.label)}: own value. Open its commands" title="Own value">${svg(glyph.unlinked)}</button>
      ${open === `chain:${key}` ? `<div class="gu-pop gu-menu gu-pop-right" role="menu"><button type="button" class="gu-flat" role="menuitem" data-do="same:${key}">Same as ${esc(from)}</button>${L[1] ? `<button type="button" class="gu-flat" role="menuitem" data-do="forall:${key}">Use for all ${esc(L[1].label)}</button>` : ''}</div>` : ''}</span>`;
  }
  function lookRow(L: Level[], def: Setting, st: St, label = def.label) {
    const key = st === 'idle' ? def.key : `${st}.${def.key}`, value = resolve(L, def.key, st).value;
    const name = `${st === 'idle' ? '' : `${cap(st)} `}${def.label}`;
    const control = def.type === 'color' ? `<span class="gu-color"><input type="color" data-in="look:${key}" value="${String(value).slice(0, 7) || '#000000'}" aria-label="${esc(name)}"${value === '' ? ' class="d-none"' : ''}><code>${value === '' ? 'None' : String(value).slice(0, 7)}</code></span>${def.none ? `<button type="button" class="gu-icon gu-flat d-nonebtn" data-do="none:${key}" aria-pressed="${value === ''}" aria-label="No ${def.label.toLowerCase()}" title="No ${def.label.toLowerCase()}">${svg(glyph.none)}</button>` : ''}`
      : def.type === 'px' ? `<span class="gu-range"><input type="range" data-in="look:${key}" min="0" max="${def.max}" value="${value}" aria-label="${esc(name)}"><output>${value}px</output></span>`
        : `<select data-in="look:${key}" aria-label="${esc(name)}">${def.options!.map(([v, text]) => `<option value="${v}" ${v === value ? 'selected' : ''}>${text}</option>`).join('')}</select>`;
    return `<div class="gu-field"><span class="gu-label">${label}</span><span class="gu-control">${control}<span class="gu-spacer"></span>${chain(L, def, st)}</span></div>`;
  }
  const showButton = (st: St, label = cap(st)) => `<button type="button" class="gu-flat d-show" data-do="state:${st}" aria-pressed="${showState === st}" aria-label="Show ${st} on the canvas" title="Show ${st} on the canvas">${label}</button>`;
  function lookSection(): string {
    const kind = selKind(sel), defs = looks[kind];
    if (!defs) return '';
    const one = sel?.e ? find(sel.e)!.el : null;
    if (one?.kind === 'Box' && !one.frame) return `<section class="gu-group"><h3>Look</h3><p class="gu-help gu-help-wide">This box only arranges its elements. It has no background.</p><div><button type="button" data-do="frame">Give it a background</button></div></section>`;
    const L = levels(sel), per = defs.filter(def => def.perState), rest = defs.filter(def => !def.perState);
    let body: string;
    if (!per.length) body = defs.map(def => lookRow(L, def, 'idle')).join('');
    else if (opt.states === 'switch') {
      // One state at a time: the switch sets what the rows edit and what the canvas shows.
      body = `<div class="gu-seg" role="group" aria-label="State">${states.map(st => showButton(st)).join('')}</div>${(showState === 'idle' ? defs : per).map(def => lookRow(L, def, showState)).join('')}
        ${showState === 'idle' ? '' : `<p class="gu-help gu-help-wide">${rest.map(def => def.label).join(' and ')} are the same in every state.</p>`}`;
    } else if (opt.states === 'matrix') {
      // Side by side: every state of every setting in one table. A click on a cell opens its row under the table.
      const [cst, ckey] = cell.split('.') as [St, string], cdef = per.find(def => def.key === ckey) ?? per[0]!;
      const cellHtml = (def: Setting, st: St) => {
        const key = st === 'idle' ? def.key : `${st}.${def.key}`, r = resolve(L, def.key, st), own = key in L[0]!.own;
        const where = own ? 'own value' : `same as ${fromName(L, r)}`;
        return `<button type="button" class="d-cell${own ? ' is-own' : ''}${r.value === '' ? ' is-none' : ''}" data-do="cell:${st}.${def.key}" aria-pressed="${cell === `${st}.${def.key}`}" style="--c:${r.value || 'transparent'}" aria-label="${cap(st)} ${def.label.toLowerCase()}: ${r.value || 'none'}, ${esc(where)}" title="${cap(st)} ${def.label.toLowerCase()}: ${esc(where)}"></button>`;
      };
      body = `<div class="d-matrix"><span></span>${states.map(st => showButton(st)).join('')}${per.map(def => `<span class="gu-label">${def.label}</span>${states.map(st => cellHtml(def, st)).join('')}`).join('')}</div>
        <p class="gu-help gu-help-wide">A solid edge marks an own value. A state name shows that state on the canvas.</p>
        ${lookRow(L, cdef, cst, `${cap(cst)} ${cdef.label.toLowerCase()}`)}${rest.map(def => lookRow(L, def, 'idle')).join('')}`;
    } else {
      // Differences from Idle: each other state lists only the settings that differ from Idle.
      body = `<div class="d-state-head"><h4>Idle</h4><span class="gu-spacer"></span>${showButton('idle', 'Show')}</div>${defs.map(def => lookRow(L, def, 'idle')).join('')}${states.slice(1).map(st => {
        const differs = per.filter(def => `${st}.${def.key}` in L[0]!.own || resolve(L, def.key, st).value !== resolve(L, def.key, 'idle').value);
        const others = per.filter(def => !differs.includes(def));
        return `<div class="d-state-head"><h4>${cap(st)}</h4>${differs.length ? '' : '<span class="gu-muted">Same as Idle</span>'}<span class="gu-spacer"></span>${showButton(st, 'Show')}
          ${others.length ? `<span class="gu-anchor"><button type="button" class="gu-flat gu-edit" data-do="menu:diff:${st}" aria-expanded="${open === `diff:${st}`}">Change</button>${open === `diff:${st}` ? `<div class="gu-pop gu-menu gu-pop-right" role="menu">${others.map(def => `<button type="button" class="gu-flat" role="menuitem" data-do="own:${st}.${def.key}">${def.label}</button>`).join('')}</div>` : ''}</span>` : ''}</div>
          ${differs.map(def => lookRow(L, def, st)).join('')}`;
      }).join('')}`;
    }
    return `<section class="gu-group"><h3>Look</h3>${body}</section>`;
  }
  const actionText = (a: Action) => a.type === 'set' ? (a.op === 'add' ? `Add ${a.value} to ${a.name}` : a.op === 'sub' ? `Subtract ${a.value} from ${a.name}` : `Set ${a.name} to ${a.value}`) : `${a.type === 'show' ? 'Show' : 'Hide'} ${titles[a.screen!] ?? a.screen}`;
  function behavior(el: El): string {
    let html = '';
    if (el.kind === 'Text' || el.kind === 'Button') {
      html += `<section class="gu-group"><div class="gu-field"><span class="gu-label">Text</span><span class="gu-control"><textarea data-in="text" rows="${el.kind === 'Text' ? 2 : 1}" aria-label="Text">${esc(el.text ?? '')}</textarea></span></div>
        <div class="d-row"><span class="gu-help">${/\[\w+\]/.test(el.text ?? '') ? 'The canvas shows sample values.' : ''}</span><span class="gu-anchor"><button type="button" class="gu-flat gu-edit" data-do="menu:var" aria-expanded="${open === 'var'}">Insert variable</button>
          ${open === 'var' ? `<div class="gu-pop gu-menu gu-pop-right d-vars" role="menu">${variables.map(([name, type, sample]) => `<button type="button" class="gu-flat" role="menuitem" data-do="var:${name}"><code>${name}</code><span class="gu-muted">${type} · ${sample}</span></button>`).join('')}</div>` : ''}</span></div></section>`;
    }
    if (el.kind === 'Image') html += `<section class="gu-group"><div class="gu-field"><span class="gu-label">Picture</span><span class="gu-control"><button type="button" data-do="say:Choose a picture opens the project's pictures. It is not part of this mock.">${el.pic ? 'Change' : 'Choose a picture'}</button></span></div></section>`;
    if (el.kind === 'Bar') {
      html += `<section class="gu-group"><h3>Value</h3><div class="gu-field"><span class="gu-label">Shows</span><span class="gu-control"><select data-in="bind" aria-label="Variable"><option value="">Nothing yet</option>${variables.filter(([, type]) => type === 'whole number').map(([name]) => `<option value="${name}" ${el.bind === name ? 'selected' : ''}>${name}</option>`).join('')}</select></span></div>
        <div class="gu-field"><span class="gu-label">Full at</span><span class="gu-control gu-xy"><input type="number" data-in="max" value="${el.max ?? 100}" aria-label="Full at"></span><p class="gu-help">${el.bind ? `The canvas shows the sample value ${variables.find(([n]) => n === el.bind)?.[2]}.` : 'Choose a whole-number variable.'}</p></div></section>`;
    }
    if (el.kind === 'Button') {
      // The approved action editor: ordered actions, one open at a time. Each change is a draft step, with no Apply.
      const rows = (el.actions ?? []).map((a, i) => {
        const isOpen = expanded === a.id;
        const fields = a.type === 'set'
          ? `<div class="gu-field"><span class="gu-label">Variable</span><span class="gu-control"><select data-in="act:${a.id}:name" aria-label="Variable">${variables.map(([name]) => `<option ${a.name === name ? 'selected' : ''}>${name}</option>`).join('')}</select></span></div>
             <div class="gu-field"><span class="gu-label">Change</span><span class="gu-control"><select data-in="act:${a.id}:op" aria-label="Change">${[['set', 'Set to'], ['add', 'Add'], ['sub', 'Subtract']].map(([v, text]) => `<option value="${v}" ${a.op === v ? 'selected' : ''}>${text}</option>`).join('')}</select><input type="text" data-in="act:${a.id}:value" value="${esc(a.value ?? '')}" aria-label="Value"></span></div>`
          : `<div class="gu-field"><span class="gu-label">Screen</span><span class="gu-control"><select data-in="act:${a.id}:screen" aria-label="Screen">${Object.entries(titles).map(([id, title]) => `<option value="${id}" ${a.screen === id ? 'selected' : ''}>${title}</option>`).join('')}</select></span></div>`;
        return `<li><button type="button" class="gu-flat d-action" data-do="expand:${a.id}" aria-expanded="${isOpen}"><span class="gu-muted">${i + 1}</span><span class="gu-clip">${esc(actionText(a))}</span>${svg(isOpen ? glyph.down : glyph.next)}</button>
          ${isOpen ? `<div class="d-action-body">${fields}<div class="d-row"><span><button type="button" class="gu-icon gu-flat" data-do="actmove:${a.id}:-1" aria-label="Move earlier" title="Move earlier">${svg(glyph.up)}</button><button type="button" class="gu-icon gu-flat" data-do="actmove:${a.id}:1" aria-label="Move later" title="Move later">${svg(glyph.down)}</button></span><button type="button" class="gu-flat gu-edit" data-do="actdel:${a.id}">Remove</button></div></div>` : ''}</li>`;
      }).join('');
      const add = `<span class="gu-anchor"><button type="button" class="gu-flat gu-edit" data-do="menu:act" aria-expanded="${open === 'act'}">${svg(glyph.plus)}Add action</button>${open === 'act' ? `<div class="gu-pop gu-menu gu-pop-right" role="menu">${[['set', 'Set variable'], ['show', 'Show screen'], ['hide', 'Hide screen']].map(([type, text]) => `<button type="button" class="gu-flat" role="menuitem" data-do="actadd:${type}">${text}</button>`).join('')}</div>` : ''}</span>`;
      html += el.stock
        ? `<section class="gu-group"><h3>When clicked</h3><p>${esc(el.stock)}.</p><p class="gu-help gu-help-wide">Ren'Py supplies this action. Loomlight keeps it as written.</p><div><button type="button" class="gu-flat gu-edit" data-do="source">${svg(glyph.code)}Open in Source</button></div></section>`
        : `<section class="gu-group"><div class="gu-group-head"><h3>When clicked</h3>${add}</div>${rows ? `<ol class="d-actions">${rows}</ol>` : '<p class="gu-help gu-help-wide">It does nothing yet.</p>'}</section>`;
    }
    return html;
  }
  function properties(f: Found): string {
    const el = f.el, kids = f.parent.kids!, at = el.at ?? { x: 0, y: 0 }, off = el.off ?? { x: 0, y: 0 };
    const xy = (kind: string, p: { x: number; y: number }) => `<span class="gu-control gu-xy"><label>X<input type="number" data-in="${kind}:x" value="${p.x}"></label><label>Y<input type="number" data-in="${kind}:y" value="${p.y}"></label></span>`;
    const where = arranged(f)
      ? `<div class="gu-field"><span class="gu-label">Place</span><span class="gu-control"><span>${kids.indexOf(el) + 1} of ${kids.length} in ${esc(nameOf(f.parent))}</span><span class="gu-spacer"></span><button type="button" class="gu-icon gu-flat" data-do="shift:-1" aria-label="Move earlier" title="Move earlier">${svg(glyph.up)}</button><button type="button" class="gu-icon gu-flat" data-do="shift:1" aria-label="Move later" title="Move later">${svg(glyph.down)}</button></span></div>
         <div class="gu-field"><span class="gu-label">Offset</span>${xy('off', off)}<p class="gu-help">How far it sits from its place in the ${f.parent.arrange}.</p></div>`
      : `<div class="gu-field"><span class="gu-label">Position</span>${xy('pos', at)}<p class="gu-help">From the top left of ${f.parent === root() ? 'the screen' : esc(nameOf(f.parent))}.</p></div>`;
    const size = `<div class="gu-field"><span class="gu-label">${el.kind === 'Text' ? 'Wraps at' : 'Size'}</span><span class="gu-control gu-xy"><label>W<input type="number" data-in="size:w" value="${el.w ?? ''}" placeholder="Fit"></label>${el.kind === 'Text' ? '' : `<label>H<input type="number" data-in="size:h" value="${el.h ?? ''}" placeholder="Fit"></label>`}</span>
      <p class="gu-help">Empty means it fits its content.</p></div>`;
    const box = el.kind === 'Box' ? `<div class="gu-field"><span class="gu-label">Arrange</span><span class="gu-control"><div class="gu-seg" role="group" aria-label="Arrange">${(['column', 'row', 'free'] as const).map(a => `<button type="button" data-do="arrange:${a}" aria-pressed="${el.arrange === a}">${cap(a)}</button>`).join('')}</div></span>
      <p class="gu-help">${el.arrange === 'free' ? 'Each element stays where you put it.' : `The box places its elements in a ${el.arrange}.`}</p></div>
      ${el.arrange === 'free' ? '' : `<div class="gu-field"><span class="gu-label">Gap</span><span class="gu-control gu-xy"><input type="number" data-in="gap" value="${el.gap ?? 0}" aria-label="Gap"></span></div>`}` : '';
    const entrance = `<div class="gu-field"><span class="gu-label">Entrance</span><span class="gu-control">${el.entrance === 'custom' ? `<span>Custom (in source)</span><span class="gu-spacer"></span><button type="button" class="gu-flat gu-edit" data-do="source">${svg(glyph.code)}Source</button>` : `<select data-in="entrance" aria-label="Entrance">${entrances.map(([v, text]) => `<option value="${v}" ${(el.entrance ?? 'none') === v ? 'selected' : ''}>${text}</option>`).join('')}</select>`}</span></div>`;
    return `<section class="gu-group">${where}${size}${box}${entrance}</section>`;
  }
  function elementList(): string {
    const count = order().length, shown = listOpen ?? !sel;
    const rows = (el: El, depth: number): string => (el.kids ?? []).map(kid => {
      const on = sel?.e === kid.id, mark = kid.kind === 'Code' ? 'Source only' : kid.kind === 'Box' && kid.arrange !== 'free' ? cap(kid.arrange!) : kid.kind;
      return `<div class="d-el-row${on ? ' is-on' : ''}"><button type="button" class="gu-row gu-el" data-do="pick:${kid.id}" data-hover-el="${kid.id}" aria-pressed="${on}" style="padding-left:${12 + depth * 14}px" title="${esc(nameOf(kid))}"><span class="gu-clip">${esc(nameOf(kid))}</span><span class="gu-muted">${mark}</span></button>
        ${on && !kid.fixed ? `<button type="button" class="gu-icon gu-flat" data-do="shift:-1" aria-label="Move earlier" title="Move earlier">${svg(glyph.up)}</button><button type="button" class="gu-icon gu-flat" data-do="shift:1" aria-label="Move later" title="Move later">${svg(glyph.down)}</button>` : ''}</div>${rows(kid, depth + 1)}`;
    }).join('');
    return `<button type="button" class="gu-flat gu-disclose" data-do="list" aria-expanded="${shown}">${svg(shown ? glyph.down : glyph.next)}All elements<span class="gu-muted">${count}</span></button>
      ${shown ? `<section class="gu-group"><div class="gu-els">${rows(root(), 0)}</div><p class="gu-help gu-help-wide">The order is the order in source. In free space, a later element draws over an earlier one.</p></section>` : ''}`;
  }
  const addMenu = () => `<span class="gu-anchor"><button type="button" data-do="menu:add" aria-expanded="${open === 'add'}">${svg(glyph.plus)}Add element</button>${open === 'add' ? `<div class="gu-pop gu-menu gu-pop-right" role="menu">${(['Text', 'Image', 'Button', 'Bar', 'Box'] as const).map(kind => `<button type="button" class="gu-flat" role="menuitem" data-do="add:${kind}">${kind}</button>`).join('')}</div>` : ''}</span>`;
  function panel(): string {
    const screen = titles[page]!;
    if (!sel) {
      return `<div class="gu-panel-top"><div class="gu-panel-head"><h2>${screen}</h2><span class="gu-spacer"></span>${addMenu()}</div></div>
        <div class="gu-scroll" data-scroll="panel"><p class="gu-note">${page === 'title' ? 'The settings page of the Title screen is in the approved layout mock. This mock shows the work on its elements.' : `${screen} is your own screen. Click an element to change it.`}</p>${elementList()}</div>`;
    }
    // Line one: the way back to the screen, with Add element. Then the boxes and the group around the selection, then its name.
    const path = pathOf(sel).slice(0, -1);
    const back = `<button type="button" class="gu-flat gu-crumb" data-do="crumb:">${svg(glyph.back)}${screen}</button>`;
    const trail = path.length ? `<div class="d-crumbs">${path.map((s, i) => `${i ? '<span class="gu-muted">›</span>' : ''}<button type="button" class="gu-flat gu-crumb" data-do="crumb:${s!.g ? `g:${s!.g}` : `e:${s!.e}`}" data-hover-sel="${s!.g ? `g:${s!.g}` : `e:${s!.e}`}" title="Select ${esc(selName(s))}">${esc(selName(s))}</button>`).join('')}</div>` : '';
    const kind = selKind(sel), canPaste = !!copied && copied.kind === kind;
    const menu = `<span class="gu-anchor"><button type="button" class="gu-icon gu-flat" data-do="menu:more" aria-expanded="${open === 'more'}" aria-label="More commands" title="More commands">${svg(glyph.more)}</button>${open === 'more' ? `<div class="gu-pop gu-menu gu-pop-right" role="menu">
      ${looks[kind] ? `<button type="button" class="gu-flat" role="menuitem" data-do="copylook">Copy look</button><button type="button" class="gu-flat" role="menuitem" data-do="pastelook" aria-disabled="${!canPaste}" title="${canPaste ? `From ${esc(copied!.from)}` : `Copy the look of ${kind === 'Text' ? 'some text' : `a ${kind.toLowerCase()}`} first`}">Paste look</button>` : ''}
      ${sel.e ? `<button type="button" class="gu-flat" role="menuitem" data-do="delete">Delete<span class="gu-muted d-key">${mac ? '⌫' : 'Del'}</span></button>` : ''}</div>` : ''}</span>`;
    const n = sel.g ? members(sel.g).length : 0;
    const counts = sel.g ? `<p class="d-counts">${n} here${sel.g === 'menu' ? ` · <button type="button" class="gu-flat gu-edit" data-do="say:&quot;on 7 screens&quot; shows those screens together with the unsaved change. That view is in the approved layout mock.">on 7 screens</button>` : ''}</p>` : '';
    const head = `<div class="gu-panel-top"><div class="gu-el-head"><div class="gu-el-back">${back}${addMenu()}</div>${trail}<div class="d-name"><h2 class="gu-clip" title="${esc(selName(sel))}">${esc(selName(sel))}</h2>${menu}</div>${counts}</div></div>`;
    if (sel.g) return `${head}<div class="gu-scroll" data-scroll="panel"><p class="gu-note">A change here applies to the ${n} outlined ${kind === 'Text' ? 'text elements' : `${kind.toLowerCase()}${kind === 'Box' ? 'es' : 's'}`}. Click one of them to change it alone.</p>${lookSection()}${elementList()}</div>`;
    const f = find(sel.e!)!, el = f.el;
    if (el.kind === 'Code') {
      return `${head}<div class="gu-scroll" data-scroll="panel"><section class="gu-group"><p>Loomlight shows this part and keeps its code as written. It is a loop over <code>stops</code>.</p>
        <p class="gu-file">screens.rpy · lines 214 to 219</p><div class="gu-writes d-code"><code>for stop in stops:</code><code>    text stop.name:</code><code>        size 24</code><code>    if not loop.last:</code><code>        text "›"</code></div>
        <div><button type="button" data-do="source">${svg(glyph.code)}Open in Source</button></div>
        <p class="gu-help gu-help-wide">The parts around it still move, and it keeps its place between them. To change it, edit its lines in Source.</p></section>${elementList()}</div>`;
    }
    if (el.fixed) return `${head}<div class="gu-scroll" data-scroll="panel"><section class="gu-group"><p>${esc(el.fixed)}</p><p class="gu-help gu-help-wide">Its picture and how dark it is are on the settings page of the ${screen}.</p></section>${elementList()}</div>`;
    return `${head}<div class="gu-scroll" data-scroll="panel">${behavior(el)}${lookSection()}
      <button type="button" class="gu-flat gu-disclose" data-do="more" aria-expanded="${more}">${svg(more ? glyph.down : glyph.next)}All properties</button>${more ? properties(f) : ''}${elementList()}</div>`;
  }

  // ---- shell: the approved layout B ----
  function command(kind: 'undo' | 'redo') {
    const entry = kind === 'undo' ? done.at(-1) : undone.at(-1), label = entry ? `${cap(kind)} ${entry.name}` : `Nothing to ${kind}`;
    return `<button type="button" class="gu-icon" data-do="${kind}" aria-label="${esc(label)}" title="${esc(label)} ${kind === 'undo' ? (mac ? '⌘Z' : 'Ctrl+Z') : (mac ? '⇧⌘Z' : 'Ctrl+Y')}" aria-disabled="${!entry}">${svg(glyph[kind])}</button>`;
  }
  function shell(): string {
    const count = Math.abs(done.length - saved);
    const pick = <K extends keyof Opt>(key: K) => `<label>${optNames[key][0]} <select data-opt="${key}">${(optNames[key][1] as [string, string][]).map(([v, text]) => `<option value="${v}" ${opt[key] === v ? 'selected' : ''}>${text}</option>`).join('')}</select></label>`;
    const keys = `Tab next · ${opt.drag === 'reorder' ? 'Arrows move' : 'Arrows shift'} · Shift+Arrows by 10 · Enter in · Esc out · ${mac ? '⌫' : 'Del'} delete`;
    return `<div class="gu-shell" data-variant="detail">
      <section class="gu-proto d-proto" aria-label="Prototype controls"><strong>Game UI detailed level · unapproved</strong><button type="button" data-do="reset">Reset</button>
        <label>Mock <select data-preset aria-label="Mock">${(Object.keys(presets) as Preset[]).map(p => `<option value="${p}" ${p === preset ? 'selected' : ''}>${presetNames[p]}</option>`).join('')}${preset ? '' : '<option value="" selected>Your mix</option>'}</select></label>
        ${pick('click')}${pick('drag')}${pick('add')}${pick('states')}</section>
      <div class="gu-app"><header class="gu-header"><strong class="gu-brand" data-icon="story">Loomlight</strong><span class="gu-project">The Last Tram</span><span class="gu-spacer"></span>
          <span class="gu-save-state">${count ? `${count} unsaved ${count === 1 ? 'change' : 'changes'}` : 'Saved'}</span>
          <div class="gu-history" role="group" aria-label="Project history">${command('undo')}${command('redo')}</div><button type="button" class="gu-primary" data-do="save">Save</button>
          <div class="gu-runtime" role="toolbar" aria-label="Runtime controls"><button type="button" data-do="say:No problems found in this sample.">Validate</button><button type="button" data-do="say:Run is not part of this mock.">Run</button><button type="button" disabled>Stop</button></div></header>
        <div class="gu-body"><nav class="gu-rail" aria-label="Workspaces"><span data-icon="story" title="Story"></span><span data-icon="source" title="Source"></span><span data-icon="branches" title="Branches"></span>
            <button type="button" class="gu-flat" aria-pressed="true" aria-label="Game UI" title="Game UI">${svg(glyph.gameUi)}</button><span data-icon="characters" title="Characters"></span><span data-icon="assets" title="Assets"></span><span data-icon="variables" title="Variables"></span></nav>
          <aside class="gu-list gu-list-a" data-scroll="list" aria-label="Game UI screens"><button type="button" class="gu-row" data-do="go:look">Game-wide look</button>
            ${listed.map(([title, rows]) => `<h3>${title}</h3>${rows.map(([id, name]) => `<button type="button" class="gu-row" data-do="go:${id}" ${id === page ? 'aria-current="page"' : ''}>${name}</button>`).join('')}`).join('')}
            <button type="button" class="gu-row gu-row-new" data-do="say:New screen opens the visual starters. They are not part of this mock.">${svg(glyph.plus)}New screen</button></aside>
          <main class="gu-centre"><div class="gu-canvas gu-canvas-b${placing ? ' d-placing' : ''}"><div class="gu-view" tabindex="0" data-canvas aria-label="Screen canvas: ${titles[page]}. ${sel ? `${esc(selName(sel))} selected.` : 'Nothing selected.'}"><div class="gu-stage" data-main>${stageHtml()}</div><div class="d-over"></div></div>
            <div class="gu-preview"><div class="gu-preview-left"><span class="d-keys">${keys}</span></div><div class="gu-seg gu-zoom" role="group" aria-label="Canvas size"><button type="button" aria-pressed="true">Fit</button><button type="button" data-do="say:100% is in the approved layout mock.">100%</button></div></div></div></main>
          <aside class="gu-panel" aria-label="Settings">${panel()}</aside></div>
        <footer class="gu-footer"><span role="status" aria-live="polite">${esc(status)}</span><span class="gu-muted">Local project</span></footer></div></div>`;
  }
  function focusKey(el: HTMLElement) {
    for (const name of ['do', 'in', 'opt'] as const) if (el.dataset[name] !== undefined) return `[data-${name}="${CSS.escape(el.dataset[name]!)}"]`;
    return el.hasAttribute('data-canvas') ? '[data-canvas]' : null;
  }
  function render() {
    const active = document.activeElement as HTMLElement | null;
    if ((active instanceof HTMLTextAreaElement || (active instanceof HTMLInputElement && (active.type === 'text' || active.type === 'number'))) && host.contains(active)) active.blur();
    const focus = focusCanvas ? '[data-canvas]' : active && host.contains(active) ? focusKey(active) : null;
    focusCanvas = false;
    const scroll = new Map<string, number>();
    host.querySelectorAll<HTMLElement>('[data-scroll]').forEach(node => scroll.set(node.dataset.scroll!, node.scrollTop));
    host.innerHTML = shell();
    host.querySelectorAll<HTMLElement>('[data-icon]').forEach(node => node.prepend(icon(node.dataset.icon!)));
    host.querySelectorAll<HTMLElement>('[data-scroll]').forEach(node => { node.scrollTop = scroll.get(node.dataset.scroll!) ?? 0; });
    drawOver();
    if (focus) host.querySelector<HTMLElement>(focus)?.focus({ preventScroll: true });
  }

  // ---- events ----
  const parseSel = (text: string): Sel => !text ? null : text.startsWith('g:') ? { g: text.slice(2) } : { e: text.slice(2) };
  function act(name: string, arg: string) {
    const f = sel?.e ? find(sel.e) : null;
    switch (name) {
      case 'undo': step(true); break;
      case 'redo': step(false); break;
      case 'save': saved = done.length; status = 'Saved.'; break;
      case 'reset': reset(new URLSearchParams(location.search).get('state') ?? context.state); break;
      case 'say': status = arg; break;
      case 'source': status = 'Open in Source goes to these lines in the Source workspace. It is not part of this mock.'; break;
      case 'go': if (titles[arg]) { page = arg; select(null); hover = null; status = 'Ready'; } else status = 'Only the Title screen and the Ticket stub are in this mock.'; break;
      case 'menu': open = open === arg ? '' : arg; return;
      case 'crumb': select(parseSel(arg)); break;
      case 'pick': select({ e: arg }); break;
      case 'list': listOpen = !(listOpen ?? !sel); break;
      case 'more': more = !more; break;
      case 'state': showState = arg as St; if (opt.states === 'matrix') cell = `${arg}.${cell.split('.')[1]}`; break;
      case 'cell': cell = arg; showState = arg.split('.')[0] as St; break;
      case 'add': if (opt.add === 'place') { placing = arg as Kind; status = `Click the canvas where the new ${arg.toLowerCase()} goes. Esc cancels.`; focusCanvas = true; } else addBySelection(arg as Kind); break;
      case 'delete': remove(); break;
      case 'shift': shift(Number(arg)); break;
      case 'frame': commit(`give ${nameOf(f!.el)} a background`, () => { f!.el.frame = true; regroup(f!.el, f!.parent); }); break;
      case 'arrange': if (f!.el.arrange !== arg) commit(`arrange ${nameOf(f!.el)} as a ${arg}`, () => {
        // Free placement keeps each element where the row or column had put it.
        const spots = arg === 'free' ? f!.el.kids!.map(kid => rectOf(kid.id)!) : [], box = rectOf(f!.el.id)!, s = scale();
        f!.el.arrange = arg as El['arrange'];
        f!.el.kids!.forEach((kid, i) => { delete kid.off; if (arg === 'free') kid.at = { x: Math.round((spots[i]!.x - box.x) * s), y: Math.round((spots[i]!.y - box.y) * s) }; else delete kid.at; });
        if (arg === 'free') { f!.el.w ??= Math.round(box.w * s); f!.el.h ??= Math.round(box.h * s); }
      }); break;
      case 'none': { const L = levels(sel), def = looks[selKind(sel)]!.find(d => d.key === arg.split('.').pop())!, st = (arg.includes('.') ? arg.split('.')[0] : 'idle') as St;
        commit(lookEdit(arg), () => setLook(arg, resolve(L, def.key, st).value === '' ? '#1d1410' : '')); break; }
      case 'own': { const [st, key] = arg.split('.') as [St, string]; commit(lookEdit(arg), () => setLook(arg, resolve(levels(sel), key, st).value)); break; }
      case 'same': commit(`${lookEdit(arg)} same as the level above`, () => { delete levels(sel)[0]!.own[arg]; }); break;
      case 'forall': { const L = levels(sel); commit(`${lookEdit(arg)} for all ${L[1]!.label}`, () => { L[1]!.own[arg] = L[0]!.own[arg]!; delete L[0]!.own[arg]; }); break; }
      case 'copylook': { const L = levels(sel), values: Record<string, V> = {};
        for (const def of looks[selKind(sel)]!) for (const st of def.perState ? states : ['idle' as St]) values[st === 'idle' ? def.key : `${st}.${def.key}`] = resolve(L, def.key, st).value;
        copied = { kind: selKind(sel), values, from: selName(sel) }; status = `Copied the look of ${selName(sel)}.`; break; }
      case 'pastelook': if (copied && copied.kind === selKind(sel)) commit(`paste look on ${selName(sel)}`, () => {
        // An own value only where the result differs, so a chain that already gives the same value stays joined.
        const L = levels(sel);
        for (const [key, value] of Object.entries(copied!.values)) { const [st, k] = key.includes('.') ? key.split('.') as [St, string] : ['idle' as St, key]; if (resolve(L, k, st).value !== value) L[0]!.own[key] = value; }
      }); break;
      case 'var': commit('change element text', () => { f!.el.text = `${f!.el.text ?? ''}${f!.el.text?.endsWith(' ') || !f!.el.text ? '' : ' '}[${arg}]`; }); break;
      case 'expand': expanded = expanded === Number(arg) ? null : Number(arg); break;
      case 'actadd': { const id = nextAction++; commit(`add action to ${nameOf(f!.el)}`, () => { (f!.el.actions ??= []).push(arg === 'set' ? { id, type: 'set', name: 'boarded', op: 'set', value: 'True' } : { id, type: arg as 'show' | 'hide', screen: 'ticket' }); }); expanded = id; break; }
      case 'actdel': commit(`remove action from ${nameOf(f!.el)}`, () => { f!.el.actions = f!.el.actions!.filter(a => a.id !== Number(arg)); }); break;
      case 'actmove': { const [id, by] = arg.split(':').map(Number) as [number, number], list = f!.el.actions!, i = list.findIndex(a => a.id === id);
        if (list[i + by]) commit(`reorder actions of ${nameOf(f!.el)}`, () => { const [a] = list.splice(i, 1); list.splice(i + by, 0, a!); }); break; }
    }
    open = '';
  }
  function onClick(event: MouseEvent) {
    const target = event.target as HTMLElement, button = target.closest<HTMLButtonElement>('button[data-do]');
    if (!button || button.getAttribute('aria-disabled') === 'true') { if (open && !target.closest('.gu-pop')) { open = ''; render(); } return; }
    const [name, ...rest] = button.dataset.do!.split(':');
    act(name!, rest.join(':')); render();
  }
  function onInput(event: Event) {
    const el = event.target as HTMLInputElement, [name, key] = (el.dataset.in ?? '').split(':');
    const f = sel?.e ? find(sel.e) : null;
    if (name === 'look') {
      pending ??= clone(doc);
      setLook(key!, el.type === 'range' ? Number(el.value) : el.value);
      const out = el.parentElement?.querySelector('output, code');
      if (out) out.textContent = el.type === 'range' ? `${el.value}px` : el.value;
      refreshStage();
    } else if (name === 'text' && f) { pending ??= clone(doc); f.el.text = el.value; refreshStage(); }
  }
  function onChange(event: Event) {
    const el = event.target as HTMLInputElement, d = el.dataset;
    if (d.preset !== undefined) { if (el.value) { preset = el.value as Preset; opt = { ...presets[preset] }; placing = null; } render(); return; }
    if (d.opt) { (opt as unknown as Record<string, string>)[d.opt] = el.value; preset = (Object.keys(presets) as Preset[]).find(p => JSON.stringify(presets[p]) === JSON.stringify(opt)) ?? ''; placing = null; render(); return; }
    const [name, a, b] = (d.in ?? '').split(':'), f = sel?.e ? find(sel.e) : null;
    if (!name) return;
    if (name === 'look' || name === 'text') {
      onInput(event);
      const before = pending!; pending = null;
      if (JSON.stringify(before) !== JSON.stringify(doc)) push(name === 'text' ? 'change element text' : lookEdit(a!), before);
    } else if (f) {
      const n = Number(el.value) || 0, axis = a as 'x' | 'y';
      if (name === 'pos') commit(`move ${nameOf(f.el)}`, () => { f.el.at = { ...(f.el.at ?? { x: 0, y: 0 }), [axis]: n }; });
      if (name === 'off') commit(`move ${nameOf(f.el)}`, () => { f.el.off = { ...(f.el.off ?? { x: 0, y: 0 }), [axis]: n }; });
      if (name === 'size') commit(`resize ${nameOf(f.el)}`, () => { if (el.value === '') delete f.el[a as 'w' | 'h']; else f.el[a as 'w' | 'h'] = Math.max(8, n); });
      if (name === 'gap') commit(`${nameOf(f.el)} gap`, () => { f.el.gap = Math.max(0, n); });
      if (name === 'entrance') commit(`${nameOf(f.el)} entrance`, () => { f.el.entrance = el.value; });
      if (name === 'bind') commit(`${nameOf(f.el)} value`, () => { f.el.bind = el.value || undefined; });
      if (name === 'max') commit(`${nameOf(f.el)} range`, () => { f.el.max = Math.max(1, n); });
      if (name === 'act') commit(`change action of ${nameOf(f.el)}`, () => { const action = f.el.actions!.find(item => item.id === Number(a))!; (action as unknown as Record<string, unknown>)[b!] = el.value; });
    }
    render();
  }
  function onPointerDown(event: PointerEvent) {
    const target = event.target as HTMLElement;
    if (event.button !== 0) return;
    const handle = target.closest<HTMLElement>('[data-handle]');
    if (handle && sel?.e) { resize(event, handle.dataset.handle!); return; }
    if (!target.closest('[data-main]')) return;
    event.preventDefault(); focusCanvas = true;
    if (placing) {
      const t = dropTarget(event.clientX, event.clientY, null), stage = host.querySelector('[data-main]')!.getBoundingClientRect(), s = scale();
      const kind = placing; placing = null; ghost = line = null;
      addAt(kind, t, { x: Math.round((event.clientX - stage.left) * s), y: Math.round((event.clientY - stage.top) * s) }); render(); return;
    }
    const id = target.closest<HTMLElement>('[data-el]')?.dataset.el;
    if (!id) { select(null); render(); return; }
    const hit = find(id)!.el, lad = ladder(id), i = lad.findIndex(s => same(s, sel));
    // A click on the selection goes one step in. Inside a group, a click on another member selects that member.
    let advance: Sel = null;
    if (i >= 0) advance = lad[Math.min(i + 1, lad.length - 1)]!;
    else { const now = sel?.e ? find(sel.e)?.el : null; select(now?.group && now.group === hit.group ? { e: id } : lad[0]!); }
    hover = null; render();
    // The drag takes the selected element. With a group selected, it takes the member under the pointer.
    const dragId = sel?.e && (sel.e === id || find(id)!.path.some(box => box.id === sel!.e)) ? sel.e : id;
    const f = find(dragId)!, start = rectOf(dragId)!, s = scale();
    let moving = false, drop: ReturnType<typeof dropTarget> = null;
    const move = (m: PointerEvent) => {
      const dx = m.clientX - event.clientX, dy = m.clientY - event.clientY;
      if (!moving) {
        if (Math.hypot(dx, dy) < 5) return;
        if (f.el.fixed || f.el.kind === 'Code') { status = `${nameOf(f.el)} does not move here.`; stop(); render(); return; }
        moving = true; if (!same(sel, { e: dragId })) { select({ e: dragId }); render(); }
      }
      // The outline follows the pointer. The canvas draws the element again when it lands, as the real frame would.
      ghost = { ...start, x: start.x + dx, y: start.y + dy };
      drop = opt.drag === 'reorder' ? dropTarget(m.clientX, m.clientY, dragId) : null;
      line = drop?.line ?? null; drawOver();
    };
    const stop = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); };
    const up = (m: PointerEvent) => {
      stop();
      if (!moving) { if (advance && !same(advance, sel)) { select(advance); render(); } return; }
      const dx = Math.round((m.clientX - event.clientX) * s), dy = Math.round((m.clientY - event.clientY) * s), name = nameOf(f.el);
      const stage = host.querySelector('.gu-view')!.getBoundingClientRect(), origin = host.querySelector('[data-main]')!.getBoundingClientRect();
      const free = { x: Math.round((ghost!.x - (origin.left - stage.left)) * s), y: Math.round((ghost!.y - (origin.top - stage.top)) * s) };
      if (opt.drag === 'reorder' && drop) { const t = drop; commit(`move ${name} ${t.box === f.parent ? 'in' : 'into'} ${nameOf(t.box)}`, () => moveInto(dragId, t.box, t.index)); }
      else if (opt.drag === 'reorder' && arranged(f)) { commit(`take ${name} out of ${nameOf(f.parent)}`, () => moveFree(dragId, free)); status = `${name} left ${nameOf(f.parent)}. It stays where you put it.`; }
      else if (arranged(f)) commit(`move ${name}`, () => { f.el.off = { x: (f.el.off?.x ?? 0) + dx, y: (f.el.off?.y ?? 0) + dy }; });
      else commit(`move ${name}`, () => { f.el.at = { x: (f.el.at?.x ?? 0) + dx, y: (f.el.at?.y ?? 0) + dy }; });
      ghost = line = null; focusCanvas = true; render();
    };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
  }
  function resize(event: PointerEvent, dir: string) {
    event.preventDefault();
    const f = find(sel!.e!)!, start = rectOf(f.el.id)!, s = scale();
    const move = (m: PointerEvent) => {
      const w = Math.max(12, start.w + (dir.includes('e') ? m.clientX - event.clientX : 0));
      // A picture keeps its shape from the corner handle.
      const h = f.el.kind === 'Image' && dir === 'se' ? w * start.h / start.w : Math.max(12, start.h + (dir.includes('s') ? m.clientY - event.clientY : 0));
      ghost = { ...start, w, h }; drawOver();
    };
    const up = () => {
      document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up);
      if (ghost) { const g = ghost; commit(`resize ${nameOf(f.el)}`, () => { if (dir.includes('e')) f.el.w = Math.round(g.w * s); if ((dir.includes('s') || f.el.kind === 'Image') && f.el.kind !== 'Text') f.el.h = Math.round(g.h * s); }); }
      ghost = null; focusCanvas = true; render();
    };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
  }
  function onMove(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (placing && target.closest('[data-main]')) {
      const view = host.querySelector('.gu-view')!.getBoundingClientRect(), t = dropTarget(event.clientX, event.clientY, null);
      ghost = { x: event.clientX - view.left - 4, y: event.clientY - view.top - 4, w: 96, h: 30 }; line = t?.line ?? null; drawOver(); return;
    }
    if (ghost) return;
    // The outline on the pointer shows what a click selects next.
    const id = target.closest('[data-main]') ? target.closest<HTMLElement>('[data-el]')?.dataset.el : undefined;
    const row = target.closest<HTMLElement>('[data-hover-el]')?.dataset.hoverEl, crumb = target.closest<HTMLElement>('[data-hover-sel]')?.dataset.hoverSel;
    let next: Sel = row ? { e: row } : crumb ? parseSel(crumb) : null;
    if (id) {
      const lad = ladder(id), i = lad.findIndex(s => same(s, sel)), now = sel?.e ? find(sel.e)?.el : null;
      next = i >= 0 ? lad[Math.min(i + 1, lad.length - 1)]! : now?.group && now.group === find(id)!.el.group ? { e: id } : lad[0]!;
    }
    if (!same(next, hover) && (next || hover)) { hover = next; drawOver(); }
  }
  function onKey(event: KeyboardEvent) {
    const target = event.target as HTMLElement, typing = !!target.closest('input:not([type=range]):not([type=color]),textarea,select');
    if (event.key === 'Escape') {
      if (open) open = ''; else if (placing) { placing = null; ghost = line = null; status = 'Ready'; } else if (sel && !typing) { select(pathOf(sel).at(-2) ?? null); focusCanvas = true; } else return;
      render(); return;
    }
    if ((event.metaKey || event.ctrlKey) && !typing) {
      const key = event.key.toLowerCase();
      if (key === 'z' || (key === 'y' && !mac)) { event.preventDefault(); step(!(key === 'y' || event.shiftKey)); render(); }
      return;
    }
    if (!target.hasAttribute('data-canvas')) return;
    const list = order(), i = sel?.e ? list.findIndex(el => el.id === sel!.e) : -1, by = event.shiftKey ? 10 : 1;
    const arrows: Record<string, [number, number]> = { ArrowLeft: [-by, 0], ArrowRight: [by, 0], ArrowUp: [0, -by], ArrowDown: [0, by] };
    if (event.key === 'Tab') {
      // Tab steps through the elements in source order. After the last one, it leaves the canvas.
      const to = sel?.g ? members(sel.g)[0] : list[i + (event.shiftKey ? -1 : 1)] ?? (i < 0 && !event.shiftKey ? list[0] : undefined);
      if (!to) return;
      event.preventDefault(); select({ e: to.id });
    } else if (arrows[event.key]) { event.preventDefault(); nudge(...arrows[event.key]!); }
    else if (event.key === 'Enter') { const first = sel?.g ? members(sel.g)[0] : sel?.e ? find(sel.e)!.el.kids?.[0] : list[0]; if (!first) return; select({ e: first.id }); }
    else if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); remove(); }
    else return;
    focusCanvas = true; render();
  }

  reset(context.state);
  host.addEventListener('click', onClick); host.addEventListener('input', onInput); host.addEventListener('change', onChange);
  host.addEventListener('pointerdown', onPointerDown); host.addEventListener('mousemove', onMove); document.addEventListener('keydown', onKey);
  const onLeave = () => { if (hover) { hover = null; drawOver(); } };
  host.addEventListener('mouseleave', onLeave);
  const onResize = () => drawOver();
  window.addEventListener('resize', onResize);
  render();
  return () => {
    host.removeEventListener('click', onClick); host.removeEventListener('input', onInput); host.removeEventListener('change', onChange);
    host.removeEventListener('pointerdown', onPointerDown); host.removeEventListener('mousemove', onMove); document.removeEventListener('keydown', onKey);
    host.removeEventListener('mouseleave', onLeave); window.removeEventListener('resize', onResize); host.replaceChildren();
  };
}
