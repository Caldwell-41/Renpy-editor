// Game UI layout study (#197): three layouts of the Game UI workspace, switchable via ?variant=.
// Throwaway and memory-only. Nothing here reads a project, writes source or runs Ren'Py.
// The three layouts share the sample game and the setting controls. Each one decides for
// itself where the screen list, the settings, the themes and the detailed level go.
import type { LabContext } from '../../contracts.ts';
import { icon } from '../../../src/icons.ts';
import { game, type GameContext } from './game.ts';
import { art, defaults, fieldByKey, follows, groupTitles, ownerOf, pageById, pages, sampleDefaults, themes, type Field, type Group, type Page, type Part, type Sample, type Value, type Values } from './model.ts';
import './game.css';
import './style.css';

export type Variant = 'refined' | 'blend' | 'council' | 'pages' | 'click' | 'board';
const variants: Variant[] = ['refined', 'blend', 'council', 'pages', 'click', 'board'];
const names: Record<Variant, string> = { refined: 'A · Layout 1, refined', blend: 'B · Recommended blend', council: 'C · Council blend', pages: '1 · Pages and panel', click: '2 · Click the game', board: '3 · Whole-game board' };
/** What the shared behaviour needs to know about a layout. `lookPage`: the game-wide look is a page in the screen list.
 *  `modeless`: a click on the canvas always selects, and there is no Settings / Elements switch. */
const traits: Record<Variant, { lookPage: boolean; modeless: boolean }> = {
  refined: { lookPage: true, modeless: false }, blend: { lookPage: true, modeless: true }, council: { lookPage: true, modeless: false },
  pages: { lookPage: true, modeless: false }, click: { lookPage: false, modeless: true }, board: { lookPage: false, modeless: false },
};

type Doc = { values: Values; offsets: Record<string, { x: number; y: number }>; added: Record<string, { id: string; kind: string }[]> };
type Entry = { name: string; page: string; before: Doc; after: Doc };

const esc = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const svg = (d: string) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const glyph = {
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11', redo: 'm15 14 5-5-5-5m5 5H9.5a5.5 5.5 0 0 0 0 11H13',
  gameUi: 'M3 4h18v13H3zM8 21h8M12 17v4M7 12h6M7 9h3', plus: 'M12 5v14M5 12h14', back: 'm14 5-7 7 7 7', next: 'm10 5 7 7-7 7',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  elements: 'M4 4h7v7H4zM13 13h7v7h-7zM14 4l5 5M19 4l-5 5', down: 'm6 9 6 6 6-6', play: 'M7 4v16l13-8z',
};
const mac = /Mac|iPhone|iPad/.test(navigator.platform);
const clone = (doc: Doc): Doc => structuredClone(doc);
const hasStates = (id: string, kind: string) => kind === 'Button' || ['menu', 'nav', 'list'].includes(id);
const buttonStates: Sample = { key: 'state', label: 'Button', options: [['idle', 'Idle'], ['hover', 'Hover'], ['selected', 'Selected'], ['disabled', 'Disabled']] };
/** The screens whose drawing shows the sample button state. */
const drawsState = ['choice', 'title', 'pause', 'save', 'prefs', 'history', 'confirm', 'about', 'help'];

export function mountGameUi(host: HTMLElement, context: LabContext, initial: Variant) {
  document.documentElement.dataset.theme = context.theme;
  let variant = initial;
  // What the author looks at. `home` is the board of layout 3, `fine` the game-wide settings of layouts 2 and 3.
  let page: string, level: 'settings' | 'elements', sel: string | null, home: boolean, fine: boolean, more: boolean, tryIt: boolean;
  let open: '' | 'theme' | 'add' | 'sample' | 'template' | 'elements', hit: string | null, replay: string;
  // Layouts A and B: `others` opens the "Other screens" rows, `allParts` the element list, `forced` marks a screen that has no settings page.
  let others: boolean, allParts: boolean, forced: boolean;
  // Layout B: the canvas size, and whether the list and the panel are open. `listOpen` null follows the window width.
  let zoom: 'fit' | '100', listOpen: boolean | null, panelOpen: boolean;
  let doc: Doc, done: Entry[], undone: Entry[], saved: number, status: string, sample: Record<string, string>;
  let pending: Doc | null = null;

  function reset(state: string) {
    doc = { values: { ...defaults }, offsets: {}, added: {} }; done = []; undone = []; saved = 0; status = 'Ready';
    sample = { ...sampleDefaults }; page = 'say'; level = 'settings'; sel = null; home = false; fine = false; more = false; tryIt = false; open = ''; hit = null; replay = ''; others = false; allParts = false; forced = false;
    zoom = 'fit'; listOpen = null; panelOpen = true;
    if (state === 'title') page = 'title';
    if (state === 'themes') { if (traits[variant].lookPage) page = 'look'; else if (variant === 'click') open = 'theme'; else home = true; }
    if (state === 'detailed') { page = 'title'; level = 'elements'; sel = 'menu'; more = true; }
  }

  // ---- the sample project ----
  function read(key: string, over?: Values): Value {
    const value = over && key in over ? over[key] : doc.values[key];
    if (value === null || value === undefined) return follows[key] ? read(follows[key]!, over) : null;
    return value;
  }
  const canSelect = () => traits[variant].modeless ? !tryIt : level === 'elements';
  function gameContext(id: string, over: Values | undefined, main: boolean): GameContext {
    return { g: key => read(key, over), s: key => sample[key] ?? '', parts: main, sel: main && canSelect() ? sel : null, offsets: doc.offsets, added: doc.added[id] ?? [], replay: main ? replay : '' };
  }
  function stage(id: string, o: { over?: Values; main?: boolean } = {}) {
    return `<div class="gu-stage" data-game="${id}"${o.main ? ' data-main' : ''}${o.over ? ` data-over="${esc(JSON.stringify(o.over))}"` : ''}>${game(id, gameContext(id, o.over, !!o.main))}</div>`;
  }
  /** Redraws every game picture in place. The controls keep their focus and their drag. */
  function refreshStages() {
    host.querySelectorAll<HTMLElement>('[data-game]').forEach(node => {
      node.innerHTML = game(node.dataset.game!, gameContext(node.dataset.game!, node.dataset.over ? JSON.parse(node.dataset.over) as Values : undefined, node.hasAttribute('data-main')));
    });
    markHit();
  }
  /** Records one edit. `at` is the page Undo returns to. */
  function push(name: string, before: Doc, at = page) { done.push({ name, page: at, before, after: clone(doc) }); undone = []; status = 'Ready'; }
  function commit(name: string, change: (next: Doc) => void, at = page) { const before = clone(doc); change(doc); push(name, before, at); }
  function reveal(entry: Entry) {
    // Layout C: Undo on the screen in view keeps the level and the selected element.
    if (variant === 'council' && entry.page === page) { if (!partOf(pageById(page), sel)) sel = null; return; }
    go(entry.page);
    if (entry.page === 'look' && !traits[variant].lookPage) { page = 'say'; fine = true; home = variant === 'board'; }
  }
  function undo() { const entry = done.pop(); if (!entry) return; doc = clone(entry.before); undone.push(entry); reveal(entry); status = `Undone: ${entry.name}`; }
  function redo() { const entry = undone.pop(); if (!entry) return; doc = clone(entry.after); done.push(entry); reveal(entry); status = `Redone: ${entry.name}`; }
  function go(id: string) {
    page = id; sel = null; home = false; fine = false; open = ''; hit = null;
    if (id === 'look') level = 'settings';
    else if (variant === 'refined' || variant === 'council') {
      // A screen with no settings page opens on its elements. Leaving it returns to Settings.
      const plain = !!pageById(id).groups;
      if (!plain) level = 'elements'; else if (forced) level = 'settings';
      forced = !plain;
    }
  }
  const editName = (key: string) => `${ownerOf[key]?.title ?? 'Game UI'} ${fieldByKey[key]?.label.toLowerCase() ?? key}`;
  const partsOf = (pg: Page): Part[] => [...pg.parts, ...(doc.added[pg.id] ?? []).map(item => [item.id, `New ${item.kind.toLowerCase()}`, item.kind] as const)];
  const partOf = (pg: Page, id: string | null) => partsOf(pg).find(item => item[0] === id);
  const themeNow = () => themes.find(theme => Object.entries(theme.values).every(([key, value]) => doc.values[key] === value));

  // ---- shared controls ----
  function control(f: Field): string {
    const value = read(f.key);
    const label = esc(f.label);
    switch (f.kind) {
      case 'color': return `<span class="gu-color"><input type="color" data-key="${f.key}" value="${value}" aria-label="${label}"><code>${value}</code></span>`;
      case 'segment': return `<div class="gu-seg" role="group" aria-label="${label}">${f.options!.map(([v, text]) => `<button type="button" data-set="${f.key}" data-value="${v}" aria-pressed="${String(value) === v}">${text}</button>`).join('')}</div>`;
      case 'select': return `<select data-key="${f.key}" aria-label="${label}">${f.options!.map(([v, text]) => `<option value="${v}" ${String(value) === v ? 'selected' : ''}>${text}</option>`).join('')}</select>`;
      case 'range': return `<span class="gu-range"><input type="range" data-key="${f.key}" min="${f.min}" max="${f.max}" value="${value}" aria-label="${label}"><output>${value}${f.unit ?? ''}</output></span>`;
      case 'image': return `<div class="gu-pics" role="group" aria-label="${label}">${f.options!.map(([v, text]) => `<button type="button" data-set="${f.key}" data-value="${v}" aria-pressed="${String(value) === v}" aria-label="${text}" title="${text}"${v === 'none' ? '>None' : ` style="background-image:url(${art[v]})">`}</button>`).join('')}</div>`;
      case 'checks': { const on = String(value).split(','); return `<div class="gu-checks" role="group" aria-label="${label}">${f.options!.map(([v, text]) => `<label><input type="checkbox" data-check="${f.key}" data-value="${v}" ${on.includes(v) ? 'checked' : ''}>${text}</label>`).join('')}</div>`; }
      default: return '';
    }
  }
  function field(f: Field): string {
    if (f.kind === 'toggle') return `<label class="gu-toggle"><input type="checkbox" data-key="${f.key}" ${read(f.key) ? 'checked' : ''}>${esc(f.label)}</label>`;
    let body = control(f);
    if (f.follows) {
      if (doc.values[f.key] === null) {
        const shown = read(f.key);
        const what = f.kind === 'color' ? `<i class="gu-swatch" style="background:${shown}"></i>` : '';
        const word = f.kind === 'color' ? '' : ` (${f.options?.find(([v]) => v === String(shown))?.[1] ?? shown})`;
        body = `<button type="button" class="gu-flat gu-follow" data-own="${f.key}" title="Give this screen its own value">${what}Same as game-wide look${word}</button>`;
      } else body += `<button type="button" class="gu-flat gu-same" data-same="${f.key}" title="Use the game-wide look again" aria-label="${esc(f.label)}: use the game-wide look again">${svg(glyph.link)}</button>`;
    }
    return `<div class="gu-field"><span class="gu-label">${esc(f.label)}</span><span class="gu-control">${body}</span>${f.help ? `<p class="gu-help">${esc(f.help)}</p>` : ''}</div>`;
  }
  function groupHtml(group: Group) {
    const isHit = !!group.part && group.part === hit;
    // Layout A: the group of the part the author clicked offers the way into the detailed level.
    // Layout B: every group that belongs to a part can select that part.
    const more = variant === 'refined' && isHit ? '<button type="button" class="gu-flat gu-edit" data-act="edit-hit">Edit element</button>'
      : variant === 'blend' && group.part && !sel ? `<button type="button" class="gu-flat gu-edit" data-select="${group.part}" aria-label="Select ${esc(group.title)} on the canvas" title="Select it on the canvas">${svg(glyph.next)}</button>` : '';
    return `<section class="gu-group${isHit ? ' is-hit' : ''}"><div class="gu-group-head"><h3>${esc(group.title)}</h3>${more}</div>${group.fields.map(field).join('')}</section>`;
  }
  const groupsHtml = (groups: readonly Group[]) => groups.map(groupHtml).join('');
  function templateTiles(pg: Page, cls = '') {
    return `<div class="gu-tiles ${cls}">${(pg.templates ?? []).map(t => `<button type="button" class="gu-tile" data-template="${t.id}" aria-pressed="${Object.entries(t.values).every(([key, value]) => doc.values[key] === value)}">${stage(pg.id, { over: t.values })}<span>${t.name}</span></button>`).join('')}</div>`;
  }
  function themeTiles(cls = '', notes = true) {
    const now = themeNow();
    return `<div class="gu-tiles ${cls}">${themes.map(t => `<button type="button" class="gu-tile" data-theme="${t.id}" aria-pressed="${t === now}">${stage('say', { over: t.values })}<span>${esc(t.name)}</span>${notes ? `<small>${t.note}</small>` : ''}</button>`).join('')}</div>`;
  }
  function sampleControl(s: Sample, form: 'select' | 'segment') {
    if (form === 'select') return `<label class="gu-sample">${s.label}<select data-sample-key="${s.key}">${s.options.map(([v, text]) => `<option value="${v}" ${sample[s.key] === v ? 'selected' : ''}>${text}</option>`).join('')}</select></label>`;
    return `<span class="gu-sample"><span class="gu-label">${s.label}</span><span class="gu-seg" role="group" aria-label="Sample ${s.label.toLowerCase()}">${s.options.map(([v, text]) => `<button type="button" data-sample="${s.key}" data-value="${v}" aria-pressed="${sample[s.key] === v}">${text}</button>`).join('')}</span></span>`;
  }
  const samples = (pg: Page, form: 'select' | 'segment') => (pg.samples ?? []).map(s => sampleControl(s, form)).join('');
  function addMenu(label = 'Add element') {
    return `<span class="gu-anchor"><button type="button" ${label ? '' : 'class="gu-icon" aria-label="Add element" title="Add element" '}data-act="menu-add" aria-expanded="${open === 'add'}">${svg(glyph.plus)}${label}</button>${open === 'add' ? `<div class="gu-pop gu-menu gu-pop-right" role="menu">${['Text', 'Image', 'Button', 'Bar', 'Box'].map(kind => `<button type="button" class="gu-flat" role="menuitem" data-add="${kind}">${kind}</button>`).join('')}</div>` : ''}</span>`;
  }
  const elementList = (pg: Page) => `<div class="gu-els">${partsOf(pg).map(([id, name, kind]) => `<button type="button" class="gu-row gu-el" data-select="${id}" aria-pressed="${sel === id}"><span>${name}</span><span class="gu-muted">${kind}</span></button>`).join('')}</div>`;
  /** The detailed level's own properties for one element. The plain settings for it sit above these. */
  function deeper(pg: Page, id: string, full = true) {
    const off = doc.offsets[`${pg.id}.${id}`] ?? { x: 0, y: 0 };
    const kind = partOf(pg, id)?.[2] ?? '';
    return `<section class="gu-group"><h3>Position</h3>
        <div class="gu-field"><span class="gu-label">Moved by</span><span class="gu-control gu-xy"><label>X<input type="number" data-offset="x" value="${off.x}"></label><label>Y<input type="number" data-offset="y" value="${off.y}"></label></span>
        <p class="gu-help">Drag the element on the canvas, or type how far it sits from its place in the layout.</p></div></section>
      ${full && hasStates(id, kind) ? `<section class="gu-group"><h3>Button states</h3>${sampleControl({ ...buttonStates, label: 'Show' }, 'segment')}<p class="gu-help gu-help-wide">The canvas shows the first button in this state. Each state takes its own colors, border and picture.</p></section>` : ''}
      ${full ? '<p class="gu-note">Box effects, image frames and animation belong to the next mock, "Design the detailed level on the screen canvas".</p>' : ''}`;
  }
  const settingsFor = (pg: Page, id: string) => groupsHtml((pg.groups ?? []).filter(group => group.part === id));
  function elementsPanel(pg: Page, withAdd = true) {
    const part = partOf(pg, sel);
    return `<section class="gu-group"><div class="gu-group-head"><h3>${withAdd ? 'Elements' : 'On this screen'}</h3>${withAdd ? addMenu() : ''}</div>${elementList(pg)}</section>
      ${part ? `<div class="gu-part-head"><h2>${part[1]}</h2><span class="gu-muted">${part[2]}</span></div>${settingsFor(pg, part[0])}${deeper(pg, part[0])}` : '<p class="gu-note">Select an element on the canvas or in the list. Drag it to move it.</p>'}`;
  }
  const noSettings = (pg: Page) => `<section class="gu-group"><p>${pg.title} has no settings page yet. It follows the game-wide look.</p><div><button type="button" data-act="level-elements">Edit its elements</button></div></section>`;
  const resetRow = (pg: Page, quiet = false) => `<section class="gu-group"><div><button type="button" ${quiet ? 'class="gu-flat gu-quiet" ' : ''}data-act="reset-page">Reset ${pg.title}</button></div></section>`;

  // ---- application shell ----
  function command(kind: 'undo' | 'redo') {
    const entry = kind === 'undo' ? done.at(-1) : undone.at(-1);
    const word = kind === 'undo' ? 'Undo' : 'Redo';
    const label = entry ? `${word} ${entry.name}` : `Nothing to ${kind}`;
    const keys = kind === 'undo' ? (mac ? '⌘Z' : 'Ctrl+Z') : (mac ? '⇧⌘Z' : 'Ctrl+Y');
    return `<button type="button" class="gu-icon" data-act="${kind}" aria-label="${esc(label)}" title="${esc(label)} ${keys}" aria-disabled="${!entry}">${svg(glyph[kind])}</button>`;
  }
  function header() {
    const count = Math.abs(done.length - saved);
    return `<strong class="gu-brand" data-icon="story">Loomlight</strong><span class="gu-project">The Last Tram</span><span class="gu-spacer"></span>
      <span class="gu-save-state">${count ? `${count} unsaved<span class="gu-long"> ${count === 1 ? 'change' : 'changes'}</span>` : 'Saved'}</span>
      <div class="gu-history" role="group" aria-label="Project history">${command('undo')}${command('redo')}</div>
      <button type="button" class="gu-primary" data-act="save">Save</button>
      <div class="gu-runtime" role="toolbar" aria-label="Runtime controls"><button type="button" data-act="validate">Validate</button><button type="button" data-act="run">Run</button><button type="button" disabled>Stop</button></div>`;
  }
  const rail = () => `<nav class="gu-rail" aria-label="Workspaces"><span data-icon="story" title="Story"></span><span data-icon="source" title="Source"></span><span data-icon="branches" title="Branches"></span>
    <button type="button" class="gu-flat" aria-pressed="true" aria-label="Game UI" title="Game UI">${svg(glyph.gameUi)}</button>
    <span data-icon="characters" title="Characters"></span><span data-icon="assets" title="Assets"></span><span data-icon="variables" title="Variables"></span></nav>`;
  const canvas = (pg: Page) => `<div class="gu-canvas${canSelect() || variant === 'refined' || variant === 'council' ? ' gu-pick' : ''}${tryIt ? ' gu-try' : ''}${variant === 'blend' && zoom === '100' ? ' gu-zoom-100" data-scroll="canvas' : ''}">${stage(pg.id, { main: true })}</div>`;
  /** Layout B: which side panels are open. Below 900 px the list starts closed. At 700 px or less the panel sits under the canvas and stays open. */
  function frame() {
    const stacked = innerWidth <= 700;
    return { stacked, list: listOpen ?? innerWidth >= 900, panel: panelOpen || stacked };
  }
  /** Layout A, Settings level: outlines the part the author clicked, with no resize handles. */
  function markHit() { if (hit && !canSelect()) host.querySelectorAll(`[data-main] [data-part="${hit}"]`).forEach(node => node.classList.add('is-hit')); }
  const elementsOnly = `<span class="gu-only" title="No settings page yet. You edit its elements.">${svg(glyph.elements)}</span>`;

  // ---- pieces shared by layouts A and B ----
  /** The screen list after the refinement: no markers, and the screens with no settings page sit under one closed row. */
  function screenList(head = '') {
    const row = (item: Page) => `<button type="button" class="gu-row" data-go="${item.id}" ${item.id === page ? 'aria-current="page"' : ''}>${item.title}</button>`;
    const withPage = (group: Page['group']) => pages.filter(item => item.group === group && (item.groups || group === 'yours'));
    const other = pages.filter(item => !item.groups && item.group !== 'yours');
    const showOther = others || other.some(item => item.id === page);
    return `<aside class="gu-list gu-list-a" data-scroll="list" aria-label="Game UI screens">${head}${row(pageById('look'))}
      ${(['story', 'menus'] as const).map(group => `<h3>${groupTitles[group]}</h3>${withPage(group).map(row).join('')}`).join('')}
      <h3>${groupTitles.yours}</h3>${withPage('yours').map(row).join('')}<button type="button" class="gu-row gu-row-new" data-act="new-screen">${svg(glyph.plus)}New screen</button>
      <button type="button" class="gu-flat gu-disclose gu-other" data-act="others" aria-expanded="${showOther}">${svg(showOther ? glyph.down : glyph.next)}Other screens<span class="gu-muted">${other.length}</span></button>
      ${showOther ? `${other.map(row).join('')}<p class="gu-note">These follow the game-wide look. You edit their elements.</p>` : ''}</aside>`;
  }
  /** One row for the template in use. The four pictures open in a sheet, so the settings start at the top of the panel. */
  function templateRow(pg: Page) {
    if (!pg.templates) return '';
    const now = pg.templates.find(t => Object.entries(t.values).every(([key, value]) => doc.values[key] === value));
    return `<div class="gu-template"><span class="gu-anchor"><button type="button" class="gu-flat gu-template-button" data-act="menu-template" aria-expanded="${open === 'template'}">
        <span class="gu-template-thumb">${stage(pg.id)}</span><span class="gu-template-text"><span class="gu-label">Template</span><span>${now ? now.name : 'Your own'}</span></span>${svg(glyph.down)}</button>
      ${open === 'template' ? `<div class="gu-pop gu-pop-right gu-template-pop"><h3>Start from a template</h3>${templateTiles(pg, 'gu-tiles-4')}<p class="gu-help gu-help-wide">A template changes this screen only. Every setting stays editable afterwards.</p></div>` : ''}</span></div>`;
  }
  const previewRow = (pg: Page) => `<div class="gu-preview" title="Sample content never changes your game.">${pg.samples ? `<span class="gu-label">Sample content</span>${samples(pg, 'select')}` : ''}</div>`;
  const lookPanel = (pg: Page, extra = '') => `<div class="gu-panel-top"><div class="gu-panel-head"><h2>Game-wide look</h2>${extra}</div></div>
    <div class="gu-scroll" data-scroll="panel"><section class="gu-group"><h3>Theme</h3>${themeTiles('', false)}<p class="gu-help gu-help-wide">A theme sets everything below. A screen that has its own value keeps it.</p></section>${groupsHtml(pg.groups!)}</div>`;

  // ---- layout A: layout 1 after an experience-first pass. Same skeleton, fewer controls. ----
  // Removed: the toolbar above the canvas, the footnote, the list markers, the "no settings page" dead end and the element list.
  function layoutRefined(pg: Page) {
    const look = pg.id === 'look';
    const editing = level === 'elements';
    let panel = look ? lookPanel(pg) : '';
    if (!look) {
      const part = partOf(pg, editing ? sel : hit);
      const tabs = pg.groups ? `<div class="gu-seg gu-level" role="group" aria-label="Level"><button type="button" data-act="level-settings" aria-pressed="${!editing}">Settings</button><button type="button" data-act="level-elements" aria-pressed="${editing}">Elements</button></div>` : '';
      const picker = `<section class="gu-group"><div class="gu-field"><span class="gu-label">Element</span><span class="gu-control"><select data-el-select aria-label="Element"><option value="">Click one on the canvas</option>${partsOf(pg).map(([id, name]) => `<option value="${id}" ${sel === id ? 'selected' : ''}>${name}</option>`).join('')}</select>${addMenu('')}</span></div></section>`;
      const noGroup = !editing && part && !(pg.groups ?? []).some(group => group.part === part[0])
        ? `<section class="gu-group is-hit"><div class="gu-group-head"><h3>${part[1]}</h3><button type="button" class="gu-flat gu-edit" data-act="edit-hit">Edit element</button></div><p class="gu-help gu-help-wide">It has no plain settings. It follows the game-wide look.</p></section>` : '';
      panel = `<div class="gu-panel-top"><div class="gu-panel-head"><h2>${pg.title}</h2>${tabs}</div>${editing ? '' : templateRow(pg)}</div>
        <div class="gu-scroll" data-scroll="panel">${editing ? `${picker}${part ? `<div class="gu-part-head"><h2>${part[1]}</h2><span class="gu-muted">${part[2]}</span></div>${settingsFor(pg, part[0])}${deeper(pg, part[0])}` : '<p class="gu-note">Click an element on the canvas. Drag it to move it.</p>'}`
    : `${noGroup}${groupsHtml(pg.groups ?? [])}${resetRow(pg, true)}`}</div>`;
    }
    const sheet = `<div class="gu-canvas"><div class="gu-sheet">${['say', 'choice', 'title', 'save'].map(id => `<button type="button" class="gu-tile" data-go="${id}">${stage(id)}<span>${pageById(id).title}</span></button>`).join('')}</div></div>`;
    return `${screenList()}<main class="gu-centre">${look ? sheet : canvas(pg)}${look ? '<div class="gu-preview"></div>' : previewRow(pg)}</main>
      <aside class="gu-panel" aria-label="${look ? 'Game-wide look' : editing ? 'Elements' : 'Settings'}">${panel}</aside>`;
  }

  // ---- layout B: the recommendation. Layout 1's list and panel, layout 2's click-a-part with no level switch, layout 3's board. ----
  function layoutBlend(pg: Page) {
    const look = pg.id === 'look';
    const part = look ? undefined : partOf(pg, sel);
    const open2 = frame();
    // Each side panel has a collapse control. Collapsed, it is a thin column with the control that restores it.
    const side = (what: 'list' | 'panel', shown: boolean) => `<button type="button" class="gu-flat gu-icon${what === 'panel' ? ' gu-flip' : ''}" data-act="toggle-${what}" data-icon="${shown ? 'panel' : 'panelOpen'}" aria-expanded="${shown}" aria-label="${shown ? 'Collapse' : 'Show'} the ${what === 'list' ? 'screen list' : 'settings panel'}" title="${shown ? 'Collapse' : 'Show'} the ${what === 'list' ? 'screen list' : 'settings panel'}"></button>`;
    const collapse = open2.stacked ? '' : side('panel', true);
    let panel = look ? lookPanel(pg, `<span class="gu-spacer"></span>${collapse}`) : '';
    if (part) {
      const plain = settingsFor(pg, part[0]);
      panel = `<div class="gu-panel-top"><div class="gu-panel-head"><button type="button" class="gu-flat gu-crumb" data-act="deselect">${svg(glyph.back)}${pg.title}</button><h2>${part[1]}</h2><span class="gu-muted">${part[2]}</span><span class="gu-spacer"></span>${collapse}</div></div>
        <div class="gu-scroll" data-scroll="panel">${plain || '<p class="gu-note">It has no plain settings. It follows the game-wide look.</p>'}
        <button type="button" class="gu-flat gu-disclose" data-act="more" aria-expanded="${more}">${svg(more ? glyph.down : glyph.next)}All properties</button>${more ? deeper(pg, part[0]) : ''}</div>`;
    } else if (!look) {
      const showParts = allParts || !pg.groups;
      panel = `<div class="gu-panel-top"><div class="gu-panel-head"><h2>${pg.title}</h2><span class="gu-spacer"></span>${addMenu()}${collapse}</div>${templateRow(pg)}</div>
        <div class="gu-scroll" data-scroll="panel">${groupsHtml(pg.groups ?? [])}
        <button type="button" class="gu-flat gu-disclose" data-act="all-parts" aria-expanded="${showParts}">${svg(showParts ? glyph.down : glyph.next)}All elements<span class="gu-muted">${partsOf(pg).length}</span></button>
        ${showParts ? `<section class="gu-group">${elementList(pg)}</section>` : ''}${pg.groups ? resetRow(pg, true) : ''}</div>`;
    }
    const board = `<div class="gu-board" data-scroll="board">${(['story', 'menus', 'yours'] as const).map(group => `<section><h3>${groupTitles[group]}</h3><div class="gu-board-row">${pages.filter(item => item.group === group).map(item =>
      `<button type="button" class="gu-tile" data-go="${item.id}">${stage(item.id)}<span>${item.title}</span></button>`).join('')}</div></section>`).join('')}</div>`;
    const zoomSwitch = `<div class="gu-seg gu-zoom" role="group" aria-label="Canvas size"><button type="button" data-act="zoom-fit" aria-pressed="${zoom === 'fit'}">Fit</button><button type="button" data-act="zoom-100" aria-pressed="${zoom === '100'}">100%</button></div>`;
    const under = look ? '<div class="gu-preview"><span class="gu-muted">Every screen follows the game-wide look. Click one to open it.</span></div>'
      : `<div class="gu-preview" title="Sample content never changes your game.">${pg.samples ? `<span class="gu-label">Sample content</span>${samples(pg, 'select')}` : ''}<span class="gu-spacer"></span>${zoomSwitch}</div>`;
    const list = open2.list ? screenList(`<div class="gu-list-head"><h2>Game UI</h2>${side('list', true)}</div>`) : `<aside class="gu-list gu-thin" aria-label="Game UI screens">${side('list', false)}</aside>`;
    return `${list}<main class="gu-centre">${look ? board : canvas(pg)}${under}</main>
      ${open2.panel ? `<aside class="gu-panel" aria-label="${look ? 'Game-wide look' : 'Settings'}">${panel}</aside>` : `<aside class="gu-panel gu-thin" aria-label="Settings">${side('panel', false)}</aside>`}`;
  }

  // ---- layout C: the council blend. Layout 1's list, toolbar and panel, layout 2's click on the canvas and its element panel, layout 3's template strip. ----
  // Left out: the picture strip and the board of screens, the Theme sheet, Try it, the Edit elements bar, the always-open element list and the "no settings page" dead end.
  function layoutCouncil(pg: Page) {
    const look = pg.id === 'look';
    const editing = level === 'elements';
    const part = look ? undefined : partOf(pg, editing ? sel : hit);
    const list = (Object.keys(groupTitles) as Page['group'][]).map(group => `<h3>${groupTitles[group]}</h3>${pages.filter(item => item.group === group).map(item =>
      `<button type="button" class="gu-row" data-go="${item.id}" ${item.id === page ? 'aria-current="page"' : ''}><span>${item.title}</span>${item.groups ? '' : elementsOnly}</button>`).join('')}`).join('');
    // Sample content has one home. Every screen that draws a button state lists the Button menu, at both levels.
    const shown = [...(pg.samples ?? [])];
    const backdropAt = shown.findIndex(s => s.key === 'backdrop');
    if (drawsState.includes(pg.id) && !shown.some(s => s.key === 'state')) shown.splice(backdropAt < 0 ? shown.length : backdropAt, 0, buttonStates);
    const bar = `<div class="gu-bar"><h2>${pg.title}</h2><span class="gu-spacer"></span>${shown.length ? `<span class="gu-label gu-sample-name" title="Sample content never changes your game.">Sample</span>${shown.map(s => sampleControl(s, 'select')).join('')}` : ''}</div>`;
    const sheet = `<div class="gu-canvas"><div class="gu-sheet">${['say', 'choice', 'title', 'save'].map(id => `<button type="button" class="gu-tile" data-go="${id}">${stage(id)}<span>${pageById(id).title}</span></button>`).join('')}</div></div>`;
    // The strip's row keeps its height on a screen with no templates, so the canvas stays in one place.
    const strip = look ? '' : `<div class="gu-cstrip">${pg.templates ? `<h3>Template</h3>${templateTiles(pg)}` : ''}</div>`;
    const foot = look ? 'Four of your screens with sample content. Click one to open it.'
      : editing ? 'Click an element to select it. Drag it to move it.' : 'Click an element to find its settings. Double-click it to open it in Elements.';
    // The toolbar already names the page, so the panel starts with the themes.
    let panel = look ? `<div class="gu-panel-top"></div><div class="gu-scroll" data-scroll="panel"><section class="gu-group"><h3>Theme</h3>${themeTiles('', false)}<p class="gu-help gu-help-wide">A theme sets everything below. A screen that has its own value keeps it.</p></section>${groupsHtml(pg.groups!)}</div>` : '';
    if (!look) {
      const tabs = `<div class="gu-panel-head"><div class="gu-seg gu-level" role="group" aria-label="Level"><button type="button" data-act="level-settings" aria-pressed="${!editing}"${pg.groups ? '' : ` aria-disabled="true" title="${pg.title} has no settings page yet."`}>Settings</button><button type="button" data-act="level-elements" aria-pressed="${editing}">Elements</button></div></div>`;
      // The element list is a menu behind the selected element's name, so the properties start at the top of the panel.
      const pick = `<div class="gu-el-head"><span class="gu-anchor gu-el-anchor"><button type="button" class="gu-el-pick" data-act="menu-elements" aria-haspopup="menu" aria-expanded="${open === 'elements'}" title="Elements on this screen">${part ? `<span class="gu-el-name">${part[1]}</span><span class="gu-muted">${part[2]}</span>` : '<span class="gu-muted">Choose an element</span>'}${svg(glyph.down)}</button>
          ${open === 'elements' ? `<div class="gu-pop gu-el-pop" role="menu">${elementList(pg)}</div>` : ''}</span>
        <span class="gu-anchor"><button type="button" data-act="menu-add" aria-label="Add element" title="Add element" aria-expanded="${open === 'add'}">${svg(glyph.plus)}Add</button>${open === 'add' ? `<div class="gu-pop gu-menu gu-pop-right" role="menu">${['Text', 'Image', 'Button', 'Bar', 'Box'].map(kind => `<button type="button" class="gu-flat" role="menuitem" data-add="${kind}">${kind}</button>`).join('')}</div>` : ''}</span></div>`;
      const noGroup = !editing && part && !(pg.groups ?? []).some(group => group.part === part[0])
        ? `<section class="gu-group is-hit"><h3>${part[1]}</h3><p class="gu-help gu-help-wide">It has no plain settings. Double-click it to open it in Elements.</p></section>` : '';
      panel = editing
        ? `<div class="gu-panel-top">${tabs}${pick}</div><div class="gu-scroll" data-scroll="elements">${part ? `${settingsFor(pg, part[0])}${deeper(pg, part[0], false)}`
          : `<p class="gu-note">${pg.groups ? '' : `${pg.title} has no settings page yet. It follows the game-wide look. `}Click an element on the canvas, or choose one from the menu above.</p>`}</div>`
        : `<div class="gu-panel-top">${tabs}</div><div class="gu-scroll" data-scroll="panel">${noGroup}${groupsHtml(pg.groups ?? [])}${resetRow(pg, true)}</div>`;
    }
    return `<aside class="gu-list" data-scroll="list" aria-label="Game UI screens">${list}<div class="gu-list-foot"><button type="button" data-act="new-screen">${svg(glyph.plus)}New screen</button></div></aside>
      <main class="gu-centre">${bar}${look ? sheet : canvas(pg)}${strip}<p class="gu-foot">${foot}</p></main>
      <aside class="gu-panel" aria-label="${look ? 'Game-wide look' : editing ? 'Elements' : 'Settings'}">${panel}</aside>`;
  }

  // ---- layout 1: a list of pages, the canvas, and a panel that switches between Settings and Elements ----
  function layoutPages(pg: Page) {
    const look = pg.id === 'look';
    const list = (Object.keys(groupTitles) as Page['group'][]).map(group => `<h3>${groupTitles[group]}</h3>${pages.filter(item => item.group === group).map(item =>
      `<button type="button" class="gu-row" data-go="${item.id}" ${item.id === page ? 'aria-current="page"' : ''}><span>${item.title}</span>${item.groups ? '' : elementsOnly}</button>`).join('')}`).join('');
    const sheet = `<div class="gu-canvas"><div class="gu-sheet">${['say', 'choice', 'title', 'save'].map(id => `<button type="button" class="gu-tile" data-go="${id}">${stage(id)}<span>${pageById(id).title}</span></button>`).join('')}</div></div>`;
    const foot = look ? 'Four of your screens with sample content. Click one to open it.'
      : level === 'elements' ? 'Click an element to select it. Drag it to move it.'
        : 'Sample content. It never changes your game. Click a part to find its settings, or double-click it to edit it as an element.';
    const panel = look ? `<div class="gu-panel-head"><h2>Game-wide look</h2></div><div class="gu-scroll" data-scroll="panel"><section class="gu-group"><h3>Theme</h3>${themeTiles()}<p class="gu-help gu-help-wide">A theme sets everything below. A screen that has its own value keeps it.</p></section>${groupsHtml(pg.groups!)}</div>`
      : `<div class="gu-panel-head"><div class="gu-seg gu-level" role="group" aria-label="Level"><button type="button" data-act="level-settings" aria-pressed="${level === 'settings'}">Settings</button><button type="button" data-act="level-elements" aria-pressed="${level === 'elements'}">Elements</button></div></div>
        <div class="gu-scroll" data-scroll="panel">${level === 'elements' ? elementsPanel(pg)
    : `${pg.templates ? `<section class="gu-group"><h3>Template</h3>${templateTiles(pg)}</section>` : ''}${pg.groups ? groupsHtml(pg.groups) : noSettings(pg)}${resetRow(pg)}`}</div>`;
    return `<aside class="gu-list" data-scroll="list" aria-label="Game UI screens">${list}<div class="gu-list-foot"><button type="button" data-act="new-screen">${svg(glyph.plus)}New screen</button></div></aside>
      <main class="gu-centre"><div class="gu-bar"><h2>${pg.title}</h2>${look ? '' : samples(pg, 'select')}</div>${look ? sheet : canvas(pg)}<p class="gu-foot">${foot}</p></main>
      <aside class="gu-panel" aria-label="${look ? 'Game-wide look' : level === 'elements' ? 'Elements' : 'Settings'}">${panel}</aside>`;
  }

  // ---- layout 2: the canvas is the navigation. Click a part for its settings. No level switch. ----
  function layoutClick(pg: Page) {
    const now = themeNow();
    const themeButton = `<span class="gu-anchor"><button type="button" data-act="menu-theme" aria-expanded="${open === 'theme'}"><span class="gu-dots">${['gui.panel', 'gui.accent', 'gui.text'].map(key => `<i style="background:${read(key)}"></i>`).join('')}</span>Theme: ${now ? esc(now.name) : 'Your own'}${svg(glyph.down)}</button>
      ${open === 'theme' ? `<div class="gu-pop gu-theme-pop"><h3>Theme</h3>${themeTiles('gu-tiles-4')}<div><button type="button" data-act="fine">Fine-tune colors, text, buttons and boxes</button></div></div>` : ''}</span>`;
    const strip = (['story', 'menus', 'yours'] as const).map(group => `<div class="gu-strip-group"><h3>${groupTitles[group]}</h3><div class="gu-strip-row">${pages.filter(item => item.group === group).map(item =>
      `<button type="button" class="gu-tile gu-thumb" data-go="${item.id}" ${item.id === page ? 'aria-current="page"' : ''}>${stage(item.id)}<span>${item.title}</span></button>`).join('')}${group === 'yours' ? `<button type="button" class="gu-new" data-act="new-screen">${svg(glyph.plus)}New screen</button>` : ''}</div></div>`).join('');
    const part = partOf(pg, sel);
    let panel: string;
    if (fine) panel = `<div class="gu-panel-head"><button type="button" class="gu-flat gu-crumb" data-act="fine">${svg(glyph.back)}${pg.title}</button><h2>Game-wide look</h2></div><div class="gu-scroll" data-scroll="panel"><section class="gu-group"><h3>Theme</h3>${themeTiles()}</section>${groupsHtml(pageById('look').groups!)}</div>`;
    else if (part) {
      const plain = settingsFor(pg, part[0]);
      panel = `<div class="gu-panel-head"><button type="button" class="gu-flat gu-crumb" data-act="deselect">${svg(glyph.back)}${pg.title}</button><h2>${part[1]}</h2><span class="gu-muted">${part[2]}</span></div>
        <div class="gu-scroll" data-scroll="panel">${plain || '<p class="gu-note">This part has no plain settings yet. It follows the game-wide look.</p>'}
        <button type="button" class="gu-flat gu-disclose" data-act="more" aria-expanded="${more}">${svg(more ? glyph.down : glyph.next)}All properties</button>${more ? deeper(pg, part[0]) : ''}</div>`;
    } else panel = `<div class="gu-panel-head"><h2>${pg.title}</h2></div><div class="gu-scroll" data-scroll="panel">
        ${pg.templates ? `<section class="gu-group"><h3>Template</h3>${templateTiles(pg)}</section>` : ''}
        ${groupsHtml((pg.groups ?? []).filter(group => !group.part))}
        <section class="gu-group"><h3>Parts of this screen</h3>${elementList(pg)}<p class="gu-help gu-help-wide">Click a part here or on the canvas to change it.</p></section>${resetRow(pg)}</div>`;
    return `<main class="gu-centre"><div class="gu-bar"><h2>${pg.title}</h2>${themeButton}<span class="gu-spacer"></span>${addMenu()}
        <button type="button" data-act="try" aria-pressed="${tryIt}" title="Use the screen the way a player does. Nothing is saved.">${svg(glyph.play)}Try it</button></div>
      ${canvas(pg)}
      <div class="gu-showing">${tryIt ? '<span>Try it is on. Buttons react to the pointer and menu buttons open their screens.</span>' : `${samples(pg, 'segment')}<span class="gu-muted">Sample content never changes your game.</span>`}</div>
      <div class="gu-strip" data-scroll="strip" aria-label="Game UI screens">${strip}</div></main>
      <aside class="gu-panel" aria-label="Settings">${panel}</aside>`;
  }

  // ---- layout 3: a board of every screen with the themes beside it, then one screen in focus ----
  function layoutBoard(pg: Page) {
    if (home) {
      const board = (['story', 'menus', 'yours'] as const).map(group => `<section><h3>${groupTitles[group]}</h3><div class="gu-board-row">${pages.filter(item => item.group === group).map(item =>
        `<button type="button" class="gu-tile" data-go="${item.id}">${stage(item.id)}<span>${item.title}${item.groups ? '' : elementsOnly}</span></button>`).join('')}${group === 'yours' ? `<button type="button" class="gu-new" data-act="new-screen">${svg(glyph.plus)}New screen</button>` : ''}</div></section>`).join('');
      return `<aside class="gu-list gu-look" aria-label="Game-wide look"><div class="gu-panel-head"><h2>Game-wide look</h2></div><div class="gu-scroll" data-scroll="look"><section class="gu-group"><h3>Theme</h3>${themeTiles()}<p class="gu-help gu-help-wide">Every screen on the board follows the theme. A screen that has its own value keeps it.</p></section>${groupsHtml(pageById('look').groups!)}</div></aside>
        <main class="gu-board" data-scroll="board" aria-label="Game UI screens">${board}</main>`;
    }
    const editing = level === 'elements';
    const summary = (pg.samples ?? []).map(s => s.options.find(([v]) => v === sample[s.key])?.[1]).join(', ');
    const sampleMenu = pg.samples ? `<span class="gu-anchor"><button type="button" data-act="menu-sample" aria-expanded="${open === 'sample'}">Sample: ${summary}${svg(glyph.down)}</button>${open === 'sample' ? `<div class="gu-pop gu-sample-pop">${samples(pg, 'segment')}<p class="gu-help gu-help-wide">Sample content never changes your game.</p></div>` : ''}</span>` : '';
    return `<main class="gu-centre"><div class="gu-bar${editing ? ' gu-bar-editing' : ''}"><button type="button" data-act="home">${svg(glyph.back)}All screens</button>
        <button type="button" class="gu-icon" data-act="prev" aria-label="Previous screen" title="Previous screen">${svg(glyph.back)}</button><button type="button" class="gu-icon" data-act="next" aria-label="Next screen" title="Next screen">${svg(glyph.next)}</button>
        <h2>${pg.title}</h2>${sampleMenu}<span class="gu-spacer"></span>
        ${editing ? `<span>Editing elements</span>${addMenu()}<button type="button" class="gu-primary" data-act="level-settings">Done</button>` : `<button type="button" data-act="level-elements">${svg(glyph.elements)}Edit elements</button>`}</div>
      ${canvas(pg)}
      ${pg.templates && !editing ? `<div class="gu-tstrip"><h3>Templates</h3>${templateTiles(pg, 'gu-tiles-row')}</div>` : `<p class="gu-foot">${editing ? 'Click an element to select it. Drag it to move it.' : 'Click a part to find its settings, or double-click it to edit elements.'}</p>`}</main>
      <aside class="gu-panel" aria-label="${editing ? 'Elements' : 'Settings'}"><div class="gu-panel-head"><h2>${editing ? 'Elements' : 'Settings'}</h2></div><div class="gu-scroll" data-scroll="panel">${editing ? elementsPanel(pg, false) : `${pg.groups ? groupsHtml(pg.groups) : noSettings(pg)}${resetRow(pg)}`}</div></aside>`;
  }

  // ---- rendering ----
  function focusSelector(el: HTMLElement) {
    for (const name of ['key', 'set', 'act', 'go', 'select', 'check', 'template', 'theme', 'sample', 'own', 'same', 'offset', 'add']) {
      const value = el.dataset[name];
      if (value !== undefined) return `[data-${name}="${value}"]${el.dataset.value !== undefined ? `[data-value="${el.dataset.value}"]` : ''}`;
    }
    return el.dataset.sampleKey ? `[data-sample-key="${el.dataset.sampleKey}"]` : null;
  }
  function render() {
    const active = document.activeElement as HTMLElement | null;
    const focus = active && host.contains(active) ? focusSelector(active) : null;
    const scroll = new Map<string, [number, number]>();
    host.querySelectorAll<HTMLElement>('[data-scroll]').forEach(node => scroll.set(node.dataset.scroll!, [node.scrollTop, node.scrollLeft]));
    const pg = pageById(page);
    const sides = variant === 'blend' ? ` data-list="${frame().list ? 'open' : 'thin'}" data-panel="${frame().panel ? 'open' : 'thin'}" data-look="${page === 'look'}"` : '';
    host.innerHTML = `<div class="gu-shell" data-variant="${variant}" data-home="${variant === 'board' && home}"${sides}>
      <section class="gu-proto" aria-label="Prototype controls"><strong>Game UI layout study · unapproved</strong><span>Sample project. Changes stay in this preview.</span>
        <button type="button" data-act="reset">Reset</button><label>Layout <select data-variant-select aria-label="Game UI layout">${variants.map(v => `<option value="${v}" ${v === variant ? 'selected' : ''}>${names[v]}</option>`).join('')}</select></label></section>
      <div class="gu-app"><header class="gu-header">${header()}</header>
        <div class="gu-body">${rail()}${{ refined: layoutRefined, blend: layoutBlend, council: layoutCouncil, pages: layoutPages, click: layoutClick, board: layoutBoard }[variant](pg)}</div>
        <footer class="gu-footer"><span role="status" aria-live="polite">${esc(status)}</span><span class="gu-muted">Local project</span></footer></div></div>`;
    host.querySelectorAll<HTMLElement>('[data-icon]').forEach(node => node.prepend(icon(node.dataset.icon!)));
    host.querySelectorAll<HTMLElement>('[data-scroll]').forEach(node => { const at = scroll.get(node.dataset.scroll!); if (at) { node.scrollTop = at[0]; node.scrollLeft = at[1]; } });
    markHit();
    if (hit) host.querySelector('.gu-group.is-hit')?.scrollIntoView({ block: 'nearest' });
    host.querySelector('.gu-strip [aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (focus) host.querySelector<HTMLElement>(focus)?.focus();
    replay = '';
  }
  function switchVariant(next: Variant) {
    variant = next; open = ''; home = false; fine = false; forced = false;
    if (page === 'look' && !traits[next].lookPage) { page = 'say'; fine = next === 'click'; home = next === 'board'; }
    if (next === 'refined' || next === 'council') go(page);
    if (['http:', 'https:'].includes(location.protocol) && !location.pathname.includes('preview.html')) {
      try { const url = new URL(location.href); url.searchParams.set('variant', next); history.replaceState(null, '', url); } catch { /* An inline viewer may refuse URL changes. */ }
    }
    render();
  }

  // ---- events ----
  function act(name: string) {
    const order = pages.filter(item => item.id !== 'look');
    switch (name) {
      case 'undo': undo(); break;
      case 'redo': redo(); break;
      case 'save': saved = done.length; status = 'Saved.'; break;
      case 'validate': status = 'No problems found in this sample.'; break;
      case 'run': status = 'Run is not part of this preview. It starts the game at the title screen.'; break;
      case 'reset': reset(new URLSearchParams(location.search).get('state') ?? 'dialogue'); break;
      // Layout C carries the element across the switch: the selected element's settings are marked, and the marked part is selected.
      case 'level-settings': if (variant === 'council') hit = sel; level = 'settings'; sel = null; break;
      case 'level-elements': if (variant === 'council' && hit) sel = hit; level = 'elements'; hit = null; break;
      case 'home': home = true; open = ''; sel = null; level = 'settings'; break;
      case 'prev': case 'next': go(order[(order.findIndex(item => item.id === page) + (name === 'next' ? 1 : -1) + order.length) % order.length]!.id); break;
      case 'fine': fine = !fine; sel = null; break;
      case 'more': more = !more; break;
      case 'deselect': sel = null; break;
      case 'try': tryIt = !tryIt; sel = null; break;
      case 'menu-theme': case 'menu-add': case 'menu-sample': case 'menu-template': case 'menu-elements': { const which = name.slice(5) as typeof open; open = open === which ? '' : which; return; }
      case 'others': others = !others; break;
      case 'toggle-list': listOpen = !frame().list; break;
      case 'toggle-panel': panelOpen = !panelOpen; break;
      case 'zoom-fit': zoom = 'fit'; break;
      case 'zoom-100': zoom = '100'; break;
      case 'all-parts': allParts = !allParts; break;
      case 'edit-hit': level = 'elements'; sel = hit; hit = null; break;
      case 'new-screen': status = 'New screen opens the visual starters. They are not part of this mock.'; break;
      case 'reset-page': {
        const pg = pageById(page);
        const keys = [...(pg.groups ?? []).flatMap(group => group.fields.map(f => f.key)), ...(pg.templates ?? []).flatMap(t => Object.keys(t.values))];
        commit(`reset ${pg.title}`, target => {
          for (const key of keys) target.values[key] = defaults[key] ?? null;
          for (const key of Object.keys(target.offsets)) if (key.startsWith(`${pg.id}.`)) delete target.offsets[key];
          delete target.added[pg.id];
        });
        sel = null; break;
      }
    }
    open = '';
  }
  function onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('[data-main]')) {
      const to = tryIt ? target.closest<HTMLElement>('[data-goto]')?.dataset.goto : undefined;
      if (to) { go(to); render(); }
      return;
    }
    const button = target.closest<HTMLButtonElement>('button');
    if (!button || !host.contains(button) || button.getAttribute('aria-disabled') === 'true') {
      if (open && !target.closest('.gu-pop')) { open = ''; render(); }
      return;
    }
    const d = button.dataset;
    const inPop = !!button.closest('.gu-pop');
    if (d.go) go(d.go);
    else if (d.set) { if (String(read(d.set)) !== d.value) commit(editName(d.set), next => { next.values[d.set!] = d.value!; }, d.set.startsWith('gui.') ? 'look' : page); }
    else if (d.own) commit(editName(d.own), next => { next.values[d.own!] = read(d.own!); });
    else if (d.same) commit(editName(d.same), next => { next.values[d.same!] = null; });
    else if (d.template) { const t = pageById(page).templates!.find(item => item.id === d.template)!; commit(`${pageById(page).title} template "${t.name}"`, next => { Object.assign(next.values, t.values); }); }
    else if (d.theme) { const t = themes.find(item => item.id === d.theme)!; if (t !== themeNow()) commit(`theme "${t.name}"`, next => { Object.assign(next.values, t.values); }, 'look'); }
    else if (d.sample) sample[d.sample] = d.value!;
    else if (d.select) { sel = d.select; if (!traits[variant].modeless) level = 'elements'; }
    else if (d.add) {
      const id = `new${(doc.added[page]?.length ?? 0) + 1}`;
      commit(`add ${d.add.toLowerCase()} to ${pageById(page).title}`, next => { (next.added[page] ??= []).push({ id, kind: d.add! }); });
      sel = id; if (!traits[variant].modeless) level = 'elements'; open = '';
    } else if (d.act) act(d.act);
    else return;
    if (!d.act?.startsWith('menu-') && !(inPop && (d.theme || d.sample || d.template))) open = '';
    render();
  }
  function onInput(event: Event) {
    const el = event.target as HTMLInputElement;
    const key = el.dataset.key;
    if (!key) return;
    pending ??= clone(doc);
    doc.values[key] = el.type === 'checkbox' ? el.checked : el.type === 'range' ? Number(el.value) : el.value;
    const shown = el.parentElement?.querySelector('output, code');
    if (shown) shown.textContent = `${el.value}${fieldByKey[key]?.unit ?? ''}`;
    refreshStages();
  }
  function onChange(event: Event) {
    const el = event.target as HTMLInputElement;
    const d = el.dataset;
    if (el.hasAttribute('data-variant-select')) { switchVariant(el.value as Variant); return; }
    if (d.sampleKey) { sample[d.sampleKey] = el.value; status = 'Sample content changed. Your game is unchanged.'; render(); return; }
    if (el.hasAttribute('data-el-select')) { sel = el.value || null; render(); return; }
    if (d.check) {
      const options = fieldByKey[d.check]!.options!.map(([v]) => v);
      const on = new Set(String(read(d.check)).split(',').filter(Boolean)); if (el.checked) on.add(d.value!); else on.delete(d.value!);
      commit(editName(d.check), next => { next.values[d.check!] = options.filter(v => on.has(v)).join(','); }); render(); return;
    }
    if (d.offset && sel) {
      const key = `${page}.${sel}`;
      commit(`move ${partOf(pageById(page), sel)?.[1] ?? 'element'}`, next => { next.offsets[key] = { ...(next.offsets[key] ?? { x: 0, y: 0 }), [d.offset!]: Number(el.value) || 0 }; }); render(); return;
    }
    if (!d.key) return;
    onInput(event);
    const before = pending!; pending = null;
    if (before.values[d.key] === doc.values[d.key]) return;
    push(editName(d.key), before, d.key.startsWith('gui.') ? 'look' : page);
    if (d.key === 'say.show' && el.value !== 'none') replay = `g-show-${el.value}`;
    render();
  }
  /** Selects the part under the pointer and, at the detailed level, drags it. */
  function onPointerDown(event: PointerEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-main]') || event.button !== 0 || tryIt) return;
    const id = target.closest<HTMLElement>('[data-part]')?.dataset.part ?? null;
    if (!canSelect()) { if (hit !== id) { hit = id; render(); } return; }
    if (id !== sel) { sel = id; render(); }
    if (!id || id === 'bg') return;
    event.preventDefault();
    const key = `${page}.${id}`;
    const start = doc.offsets[key] ?? { x: 0, y: 0 };
    const scale = 1920 / host.querySelector<HTMLElement>('[data-main]')!.getBoundingClientRect().width;
    let before: Doc | null = null;
    const move = (m: PointerEvent) => {
      const dx = (m.clientX - event.clientX) * scale, dy = (m.clientY - event.clientY) * scale;
      if (!before) { if (Math.hypot(dx, dy) < 6) return; before = clone(doc); }
      const at = doc.offsets[key] = { x: Math.round(start.x + dx), y: Math.round(start.y + dy) };
      host.querySelectorAll<HTMLElement>(`[data-main] [data-part="${id}"]`).forEach(node => { node.style.translate = `${at.x / 19.2}cqw ${at.y / 19.2}cqw`; });
    };
    const up = () => {
      document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up);
      if (before) { push(`move ${partOf(pageById(page), id)?.[1] ?? 'element'}`, before); render(); }
    };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
  }
  function onDoubleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-main]') || canSelect() || tryIt) return;
    level = 'elements'; hit = null; sel = target.closest<HTMLElement>('[data-part]')?.dataset.part ?? null; render();
  }
  function onKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (open) open = ''; else if (variant === 'council' && level === 'elements' && !forced) act('level-settings'); else if (sel) sel = null; else if (variant === 'board' && level === 'elements') level = 'settings'; else return;
      render(); return;
    }
    if (!(event.metaKey || event.ctrlKey) || (event.target as HTMLElement).closest('input:not([type=range]):not([type=checkbox]):not([type=color]),textarea')) return;
    const key = event.key.toLowerCase();
    if (key === 'z' || (key === 'y' && event.ctrlKey && !mac)) { event.preventDefault(); if (key === 'y' || event.shiftKey) redo(); else undo(); render(); }
  }

  reset(context.state);
  host.addEventListener('click', onClick); host.addEventListener('input', onInput); host.addEventListener('change', onChange);
  host.addEventListener('pointerdown', onPointerDown); host.addEventListener('dblclick', onDoubleClick); document.addEventListener('keydown', onKey);
  // Layout B opens and closes its list with the window width.
  const onResize = () => { if (variant === 'blend') render(); };
  window.addEventListener('resize', onResize);
  render();
  return () => {
    host.removeEventListener('click', onClick); host.removeEventListener('input', onInput); host.removeEventListener('change', onChange);
    host.removeEventListener('pointerdown', onPointerDown); host.removeEventListener('dblclick', onDoubleClick); document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize);
    host.replaceChildren();
  };
}
