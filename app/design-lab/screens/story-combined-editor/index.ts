// Story Combined v1 editor study: Custom Code endings in the Choice editor, the disabled Then menu,
// and the no-"body" wording in Add a beat and Move to. Throwaway, memory-only.
import type { LabContext } from '../../contracts.ts';
import { icon } from '../../../src/icons.ts';
import { shorten } from '../story-combined-status/index.ts';
import platform from '../story-revamp/art/bg-rainy-platform.webp';
import mara from '../story-revamp/art/mara-neutral.webp';
import '../story-combined-status/style.css';
import './style.css';

export type Variant = 'label' | 'blank' | 'replace' | 'replace-v2';
const variants: Variant[] = ['label', 'blank', 'replace', 'replace-v2'];
const names: Record<Variant, string> = { label: '1 · Menu reads "Custom Code"', blank: '2 · Menu with no value', replace: '3 · Ending replaces the menu', 'replace-v2': '3 · Ending replaces the menu v2' };
type State = 'choice' | 'custom-code' | 'then-menu' | 'add-beat' | 'move' | 'protected';

const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const svg = (d: string) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const glyph = {
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11', redo: 'm15 14 5-5-5-5m5 5H9.5a5.5 5.5 0 0 0 0 11H13',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z', continue: 'M12 4v14M6 12l6 6 6-6', jump: 'M4 17c0-6 4-10 10-10h6M16 3l4 4-4 4',
  loop: 'M4 12a8 8 0 0 1 14-5.3M20 4v5h-5M20 12a8 8 0 0 1-14 5.3M4 20v-5h5', return: 'M20 7v6a4 4 0 0 1-4 4H5M9 13l-4 4 4 4',
  code: 'M8 8l-4 4 4 4M16 8l4 4-4 4', dialogue: 'M4 5h16v11H9l-5 4zM8 9h8M8 12h5', narration: 'M4 6h16M4 10h16M4 14h12M4 18h8',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4', close: 'M6 6l12 12M18 6 6 18', up: 'M6 15l6-6 6 6', down: 'M6 9l6 6 6-6',
};

const outer = 'has_ticket and trust ≥ 3 and not missed_tram';
const outerShort = shorten(outer);
const unknownCode = '$ renpy.jump("depot") if late else None';
const endCode = '$ renpy.jump(next_stop)';
type OptionBeat = { id: string; kind: 'dialogue' | 'narration' | 'code'; text: string };
type Option = { text: string; arm: 1 | 2 | 3; guard: string; ending: 'unknown' | 'continue' | 'code'; beats: OptionBeat[] };
function options(): Option[] {
  return [
    { text: 'Ask about the last tram', arm: 1, guard: '', ending: 'unknown', beats: [
      { id: '07.1.1', kind: 'dialogue', text: "Mara: The last tram doesn't stop here." }, { id: '07.1.2', kind: 'code', text: unknownCode }] },
    { text: 'Leave', arm: 2, guard: '', ending: 'continue', beats: [{ id: '07.2.1', kind: 'narration', text: 'Mara turns up her collar and walks into the rain.' }] },
    { text: 'Wait for the next service', arm: 3, guard: 'trust ≥ 3', ending: 'code', beats: [{ id: '07.3.1', kind: 'code', text: endCode }] },
  ];
}
const endings = [
  { value: 'continue', label: 'Continue after the Choice', detail: 'Goes on to 08', glyph: glyph.continue },
  { value: 'jump', label: 'Go to a scene', detail: 'Jump. Does not come back', glyph: glyph.jump },
  { value: 'repeat', label: 'Repeat this Choice', detail: 'Shows the menu and prompt again', glyph: glyph.loop },
  { value: 'return', label: 'Return', detail: 'To the caller, or the main menu', glyph: glyph.return },
];

/** Insertion places for Move to, named after the scene, branch or option itself. */
const places = [
  { owner: 'The last service', path: 'The last service', positions: ['Before 05 Mara\'s line', 'Before 06 Condition', 'Before 07 Choice', 'End of scene'] },
  { owner: `If ${outerShort}`, path: `The last service › If ${outerShort}`, positions: ['Before 06.2 Condition', `End of "If ${outerShort}"`] },
  { owner: 'If trust ≥ 5', path: `The last service › If ${outerShort} › If trust ≥ 5`, positions: ['Before 06.2.1 Mara\'s line', 'End of "If trust ≥ 5"'] },
  { owner: 'Option 2 "Leave"', path: 'The last service › Option 2 "Leave"', positions: ['Before 07.2.1 Narration', 'End of option 2 "Leave"'] },
];

/** v2 Move to tree, in source order. 06.1 sits before 06.2, so that position is left out. */
type TreeNode = { id: string; label: string; path?: string; parent?: string; children?: TreeNode[] };
function moveTree(): TreeNode {
  const pos = (place: string, n: number, label: string): TreeNode => ({ id: `${place}:${n}`, label, parent: place });
  const place = (id: string, label: string, path: string, children: TreeNode[], parent?: string): TreeNode => ({ id, label, path, parent, children });
  return place('scene', 'The last service', 'The last service', [
    pos('scene', 0, "Before 05 Mara's line"), pos('scene', 1, 'Before 06 Condition'),
    place('outer', `If ${outerShort}`, `The last service › If ${outerShort}`, [
      place('inner', 'If trust ≥ 5', `The last service › If ${outerShort} › If trust ≥ 5`, [pos('inner', 0, "Before 06.2.1 Mara's line"), pos('inner', 1, 'End of "If trust ≥ 5"')], 'outer'),
      pos('outer', 0, `End of "If ${outerShort}"`),
    ], 'scene'),
    pos('scene', 2, 'Before 07 Choice'),
    place('opt2', 'Option 2 "Leave"', 'The last service › Option 2 "Leave"', [pos('opt2', 0, 'Before 07.2.1 Narration'), pos('opt2', 1, 'End of option 2 "Leave"')], 'scene'),
    pos('scene', 3, 'End of scene'),
  ]);
}

export function mountEditor(host: HTMLElement, context: LabContext, initial: Variant) {
  let variant = initial;
  let state = context.state as State;
  let menuOpen = state === 'then-menu', message = '', place = 2, position = 1;
  const tree = moveTree(), nodes = new Map<string, TreeNode>();
  (function index(n: TreeNode) { nodes.set(n.id, n); n.children?.forEach(index); })(tree);
  // v2 opens on the beat's own location: 06.1 is in "If has_ticket…", inside the scene.
  let expanded = new Set(['scene', 'outer']), chosen: string | null = 'outer:0', focusId = 'outer:0', pickedPlace = 'outer';
  const isReplace = () => variant === 'replace' || variant === 'replace-v2';
  const opts = options();
  const button = (label: string, action: string, extra = '') => `<button type="button" data-action="${action}" ${extra}>${label}</button>`;

  function header() {
    const cmd = (kind: 'undo' | 'redo', label: string, enabled: boolean) => `<span class="scs-cmd"><button type="button" class="scs-history" data-action="noop" aria-label="${label}" aria-disabled="${!enabled}">${svg(glyph[kind])}</button><span class="scs-tip" role="tooltip">${label}</span></span>`;
    return `<header class="scs-header"><strong class="scs-brand" data-icon="story">Loomlight</strong><span class="scs-project">The Last Tram</span>
      <div class="scs-save-state" aria-label="Save status"><span>Saved</span></div>
      <div class="scs-history-group" role="group" aria-label="Project history">${cmd('undo', 'Undo option 2 text edit', true)}${cmd('redo', 'Nothing to redo', false)}</div>
      ${button('Save', 'noop', 'class="sdc-primary"')}<span class="scs-runtime">${button('Validate', 'noop')}${button('Run', 'noop')}${button('Stop', 'noop', 'disabled')}</span></header>`;
  }

  // ---- Choice editor.
  function beatRow(o: Option, b: OptionBeat) {
    const isUnknown = o.ending === 'unknown' && b.kind === 'code';
    const row = `<div class="sce-beat${b.kind === 'code' ? ' sce-code-beat' : ''}">${svg(glyph[b.kind === 'code' ? 'code' : b.kind])}<span class="sce-beat-id">${b.id}</span><span class="sce-beat-text">${b.kind === 'code' ? `Custom Code · <code>${escape(b.text)}</code>` : escape(b.text)}</span></div>`;
    // Variant 3 puts the unknown-ending note on the Custom Code beat that causes it.
    return isUnknown && isReplace() ? `${row}<p class="sce-warn sce-beat-note">Ending unknown: Custom Code can leave this option</p>` : row;
  }
  function menu(o: Option, i: number) {
    const chosen = endings[0]!, title = `Option ${i + 1} then`;
    const flag = o.ending === 'unknown' && variant === 'blank' ? '<b class="sce-flag" aria-hidden="true">?</b>' : '';
    const open = menuOpen && i === 0;
    const list = open ? `<div class="sce-menu-list" role="listbox" aria-label="${title}">${endings.map(e => `<button type="button" role="option" aria-selected="${e.value === chosen.value}" data-action="pick">${svg(e.glyph)}<span><strong>${e.label}</strong><span>${e.detail}</span></span></button>`).join('')}<p class="sce-menu-foot">${o.ending === 'unknown' && variant === 'label' ? '<span class="sce-warn">Ending unknown: Custom Code at 07.1.2 can leave first.</span>' : ''}Option ${i + 1}'s beats follow below. Then changes only its ending.</p></div>` : '';
    return { button: `<div class="sce-menu"><button type="button" class="sce-menu-button" data-action="toggle-menu" data-option="${i}" aria-haspopup="listbox" aria-expanded="${open}" aria-label="${title}: ${chosen.label}">${svg(chosen.glyph)}<span class="sce-menu-value">${chosen.label}</span>${flag}<span class="sce-caret">▾</span></button></div>`, list };
  }
  function lockedMenu(i: number) {
    const title = `Option ${i + 1} then`;
    if (variant === 'label') return `<div class="sce-menu"><button type="button" class="sce-menu-button" aria-disabled="true" aria-label="${title}: Custom Code. Edit it in Source." title="Custom Code ends this option. Edit it in Source.">${svg(glyph.lock)}<span class="sce-menu-value">Custom Code</span><span class="sce-caret">▾</span></button></div>`;
    return `<div class="sce-menu"><button type="button" class="sce-menu-button sce-menu-empty" aria-disabled="true" aria-label="${title}: no ending to choose. Custom Code ends this option." title="Custom Code ends this option. Edit it in Source.">${svg(glyph.lock)}<span class="sce-menu-value"></span><span class="sce-caret">▾</span></button></div>`;
  }
  function thenRow(o: Option, i: number) {
    const add = button('+ Beat', 'add-beat', `class="sce-small" aria-label="Add a beat to option ${i + 1}${o.ending === 'code' ? ', before its ending' : ''}"`);
    const source = button('Edit in Source', 'noop', 'class="sce-link"');
    if (o.ending === 'code') {
      const sentence = `<p class="sce-ending">Ends with Custom Code: <code>${escape(endCode.replace(/^\$ /, ''))}</code></p>`;
      if (isReplace()) return `<div class="sce-then sce-then-replaced"><span class="sce-then-label">Then</span><div class="sce-then-text">${sentence}${source}</div>${add}</div>`;
      return `<div class="sce-then"><span class="sce-then-label">Then</span>${lockedMenu(i)}${add}</div><div class="sce-then-note">${sentence}${source}</div>`;
    }
    const warn = o.ending === 'unknown' && !isReplace() ? '<p class="sce-warn sce-then-note">Ending unknown: Custom Code can leave this option</p>' : '';
    const m = menu(o, i);
    return `<div class="sce-then"><span class="sce-then-label">Then</span>${m.button}${add}</div>${m.list}${warn}`;
  }
  function choiceEditor() {
    return `<div class="sdc-editor-heading scs-editor-heading"><strong>07 · Choice</strong></div>
      <p class="scs-trail">The last service</p>
      <div class="sce-prompt"><span class="sce-label">Prompt</span><span class="sce-speaker">Eli</span><span class="sce-input">Last call. Are you getting on?</span></div>
      ${opts.map((o, i) => `<fieldset class="sce-option" data-arm="${o.arm}"><legend class="sc-visually-hidden">Option ${i + 1}</legend>
        <div class="sce-option-head"><span class="sce-num">${i + 1}</span><span class="sce-input">${escape(o.text)}</span><span class="sce-icon-buttons">${button(svg(glyph.up), 'noop', `aria-label="Move option ${i + 1} up" ${i === 0 ? 'disabled' : ''}`)}${button(svg(glyph.down), 'noop', `aria-label="Move option ${i + 1} down" ${i === opts.length - 1 ? 'disabled' : ''}`)}${button(svg(glyph.close), 'noop', `aria-label="Remove option ${i + 1}"`)}</span></div>
        <div class="sce-beats" role="group" aria-label="Option ${i + 1} beats">${(o.ending === 'code' ? o.beats.slice(0, -1) : o.beats).map(b => beatRow(o, b)).join('')}</div>
        ${thenRow(o, i)}
        <p class="sce-guard">${o.guard ? `Only when ${escape(o.guard)} · Hide when false` : 'Always available'}</p></fieldset>`).join('')}`;
  }
  function protectedEditor() {
    const lines = [
      ['Ask about the last tram', "Option 1's beats, then continues after the Choice", 'Always available'],
      ['Leave', "Option 2's beats, then continues after the Choice", 'Always available'],
      ['Wait for the next service', "Option 3's beats", 'Available when trust ≥ 3 · Availability unknown'],
    ];
    return `<div class="sdc-editor-heading scs-editor-heading"><strong>07 · Choice</strong><span class="scs-editor-state">Protected</span></div>
      <p class="scs-trail">The last service</p>
      <p class="sce-protected">This Choice contains an unsupported condition. Edit it in Source to preserve the expression. Availability is unknown in the editor preview.</p>
      <ul class="sce-protected-list">${lines.map(([t, d, a]) => `<li><strong>${escape(t!)}</strong><span>→ ${escape(d!)}${t === 'Wait for the next service' ? ` · ${variant === 'label' ? 'Then: Custom Code' : variant === 'blank' ? 'Then: none to choose' : 'Ends with Custom Code'}` : ''}</span><span>${escape(a!)}</span></li>`).join('')}</ul>
      ${button('Edit in Source', 'noop')}`;
  }

  // ---- Dialogs.
  function addBeatDialog() {
    const where = 'End of option 2 "Leave"', path = 'The last service › Option 2 "Leave"';
    const target = variant === 'label' ? `<p class="sce-target"><strong>Adds to</strong> ${escape(path)} · ${escape(where)}</p>`
      : variant === 'blank' ? `<p class="sce-target"><strong>Goes at ${escape(where)}</strong><span>${escape(path)}, after 07.2.1</span></p>` : '';
    const groups: [string, string[]][] = [['Write', ['Dialogue', 'Narration']], ['Stage', ['Background', 'Show character', 'Hide character', 'Change appearance']], ['Flow', ['Choice', 'Condition', 'Call scene', 'Jump', 'Return / end']], ['State', ['Set variable']]];
    const details = `<div class="sce-picker-details"><h3>Dialogue</h3><p>A spoken line with a speaker.</p>${isReplace() ? `<dl class="sce-where"><dt>Goes at</dt><dd>${escape(where)}</dd><dt>In</dt><dd>${escape(path)}</dd><dt>After</dt><dd>07.2.1 Narration</dd></dl>` : ''}</div>`;
    return dialog('Add a beat', `${target}<label class="sce-search">${svg(glyph.search)}<input type="search" placeholder="Search beats" aria-label="Find a beat"></label>
      <div class="sce-picker-body"><div class="sce-results" role="listbox" aria-label="Beat types">${groups.map(([g, items]) => `<section><h4>${g}</h4>${items.map((k, n) => `<button type="button" role="option" data-action="added" aria-selected="${g === 'Write' && n === 0}">${k}</button>`).join('')}</section>`).join('')}</div>${details}</div>
      <p class="sce-hint">Click or Enter adds · Escape cancels</p>`);
  }
  function visible(n: TreeNode = tree): TreeNode[] { return [n, ...(n.children && expanded.has(n.id) ? n.children.flatMap(c => visible(c)) : [])]; }
  function level(n: TreeNode): number { return n.parent ? level(nodes.get(n.parent)!) + 1 : 1; }
  function treeV2() {
    const item = (n: TreeNode) => {
      const isPlace = !!n.children, focus = n.id === focusId;
      const attrs = `role="treeitem" data-node="${n.id}" aria-level="${level(n)}" tabindex="${focus ? 0 : -1}" style="--depth:${level(n) - 1}" ${isPlace ? `aria-expanded="${expanded.has(n.id)}"` : `aria-selected="${n.id === chosen}"`}`;
      return `<li ${attrs} class="${isPlace ? 'sce-tree2-place' : 'sce-tree2-pos'}"><span class="sce-tree2-mark" aria-hidden="true">${isPlace ? (expanded.has(n.id) ? '▾' : '▸') : n.id === chosen ? '●' : '○'}</span>${escape(n.label)}</li>`;
    };
    return `<ul class="sce-tree2" role="tree" aria-label="Move to">${visible().map(item).join('')}</ul>`;
  }
  function treeSummary() {
    if (!chosen) return `Choose an available position in ${escape(nodes.get(pickedPlace)!.label)}.`;
    const pos = nodes.get(chosen)!; return `Move to ${escape(nodes.get(pos.parent!)!.path!)} · ${escape(pos.label)}`;
  }
  /** Arrow keys move, Right opens and Left closes, Enter selects; Escape is handled by the dialog. */
  function treeKey(event: KeyboardEvent) {
    const list = visible(), at = list.findIndex(n => n.id === focusId), n = list[at]!;
    const move = (id?: string) => { if (id) focusId = id; };
    if (event.key === 'ArrowDown') move(list[at + 1]?.id);
    else if (event.key === 'ArrowUp') move(list[at - 1]?.id);
    else if (event.key === 'ArrowRight') { if (n.children && !expanded.has(n.id)) expanded.add(n.id); else if (n.children) move(n.children[0]?.id); }
    else if (event.key === 'ArrowLeft') { if (n.children && expanded.has(n.id)) expanded.delete(n.id); else move(n.parent); }
    else if (event.key === 'Enter') treeSelect(n);
    else return;
    event.preventDefault(); event.stopPropagation(); render();
  }
  /** Selecting a position chooses it. Selecting a branch or option opens it and asks for a position there. */
  function treeSelect(n: TreeNode) {
    focusId = n.id;
    if (n.children) { expanded.add(n.id); pickedPlace = n.id; chosen = null; } else { chosen = n.id; pickedPlace = n.parent!; }
  }
  function resetTree() { expanded = new Set(['scene', 'outer']); chosen = 'outer:0'; focusId = 'outer:0'; pickedPlace = 'outer'; }
  function moveDialog() {
    if (variant === 'replace-v2') return dialog("Move 06.1 Eli's line", `<p class="sce-dialog-note">Moves this beat to the chosen scene, branch or option.</p>${treeV2()}<p class="sce-summary" role="status">${treeSummary()}</p><p class="sce-hint">Arrow keys move · Right opens · Left closes · Enter selects · Escape cancels</p>`, `${button('Cancel', 'close')}${button('Move', 'moved', 'class="sdc-primary"')}`);
    const chosen = places[place]!, pos = chosen.positions[position] ?? '';
    const note = '<p class="sce-dialog-note">Moves this beat to the chosen scene, branch or option.</p>';
    const summary = `<p class="sce-summary" role="status">${pos ? `Move to ${escape(chosen.path)} · ${escape(pos)}` : `Choose an available position in ${escape(chosen.owner)}.`}</p>`;
    let body = '';
    if (variant === 'label') {
      body = `<label class="sce-field">Move to<select data-move="place" aria-label="Move to">${places.map((p, i) => `<option value="${i}" ${i === place ? 'selected' : ''}>${escape(p.path)}</option>`).join('')}</select></label>
        <label class="sce-field">Position<select data-move="position" aria-label="Position">${chosen.positions.map((p, i) => `<option value="${i}" ${i === position ? 'selected' : ''}>${escape(p)}</option>`).join('')}</select></label>`;
    } else if (variant === 'blank') {
      body = `<div class="sce-places" role="radiogroup" aria-label="Move to">${places.map((p, i) => `<section><h4 title="${escape(p.path)}">${escape(p.owner)}</h4>${p.positions.map((q, n) => `<label><input type="radio" name="sce-place" data-place="${i}" data-position="${n}" ${i === place && n === position ? 'checked' : ''}>${escape(q)}</label>`).join('')}</section>`).join('')}</div>`;
    } else {
      const depth = [0, 1, 2, 1];
      body = `<div class="sce-tree" role="tree" aria-label="Move to">${places.map((p, i) => `<div role="treeitem" aria-expanded="${i === place}" style="--depth:${depth[i]}"><button type="button" data-place-row="${i}" class="sce-tree-row" aria-current="${i === place}">${escape(p.owner)}</button>${i === place ? `<div role="group">${p.positions.map((q, n) => `<label class="sce-tree-leaf"><input type="radio" name="sce-place" data-place="${i}" data-position="${n}" ${n === position ? 'checked' : ''}>${escape(q)}</label>`).join('')}</div>` : ''}</div>`).join('')}</div>`;
    }
    return dialog("Move 06.1 Eli's line", `${note}${body}${summary}`, `${button('Cancel', 'close')}${button('Move', 'moved', 'class="sdc-primary"')}`);
  }
  function dialog(title: string, content: string, actions = '') {
    return `<div class="sce-backdrop"><div class="sce-dialog" tabindex="-1" role="dialog" aria-modal="true" aria-label="${escape(title)}"><div class="sce-dialog-head"><h2>${escape(title)}</h2>${button(svg(glyph.close), 'close', 'aria-label="Close" class="sce-close"')}</div>${content}${actions ? `<div class="sce-dialog-actions">${actions}</div>` : ''}</div></div>`;
  }

  function render() {
    const tracks = [['05', 'Dialogue', "Mara: You heard the bell too?", ''], ['06', 'Condition', '', `Condition · If ${outerShort}`], ['07', 'Choice', '', 'Choice · 3 options'], ['08', 'Narration', 'The doors close behind them.', '']];
    host.innerHTML = `<div class="sdc-shell sc-combined-shell scs-shell sce-shell" data-variant="${variant}">
      <section class="scs-prototype" aria-label="Prototype controls"><strong>Editor study · draft</strong><label>Compare <select aria-label="Editor variant">${variants.map(v => `<option value="${v}" ${v === variant ? 'selected' : ''}>${names[v]}</option>`).join('')}</select></label>${button('Reset', 'reset')}</section>
      <div class="scs-app">${header()}
        <div class="scs-body"><nav class="sdc-nav" aria-label="Workspaces"><span data-icon="panelOpen"></span><span data-icon="story" class="sdc-nav-selected" title="Story"></span><span data-icon="source"></span><span data-icon="branches"></span><span data-icon="characters"></span><span data-icon="assets"></span></nav>
        <main class="scs-main">
          <header class="scs-toolbar"><strong class="scs-scene-name">The last service ▾</strong><span class="scs-spacer"></span>${button('Writing focus', 'noop')}${button('+ Add beat', 'add-beat', 'class="sdc-primary"')}${button('More', 'noop', 'class="scs-plain"')}</header>
          <div class="scs-workspace"><section class="sdc-stage-area" aria-label="Game stage"><div class="sdc-stage-heading"><strong>Game window</strong><span>1920 × 1080</span></div><div class="sdc-stage-fit"><div class="sdc-stage"><img class="sdc-background" src="${platform}" alt=""><div class="sdc-character"><img src="${mara}" alt="Mara"></div><div class="sce-stage-menu">${opts.map(o => `<span>${escape(o.text)}</span>`).join('')}</div><div class="sdc-saybox"><strong class="scs-say-eli">Eli</strong><p>Last call. Are you getting on?</p></div></div></div></section>
            <aside class="sdc-editor" aria-label="Selected beat editor">${state === 'protected' ? protectedEditor() : choiceEditor()}</aside></div>
          <nav class="sc-conditions scs-path" aria-label="Branch path"><strong class="sc-conditions-title">Branch path</strong><span class="sc-condition-groups scs-path-groups"><span class="sc-condition-group scs-path-group" data-arm="1"><span class="scs-path-ref">06</span><span class="sc-condition-test" title="${escape(outer)}">${escape(outerShort)}</span><span class="sc-branch-switch"><button type="button" class="button" aria-pressed="true" data-action="noop">If</button><button type="button" class="button" aria-pressed="false" data-action="noop">Otherwise</button></span></span><span class="sc-path-arrow" aria-hidden="true">›</span><span class="sc-condition-group scs-path-group" data-arm="2"><span class="scs-path-ref">07</span><span class="sc-condition-test">Choice</span><span class="sc-branch-switch">${['1', '2', '3'].map((n, i) => `<button type="button" class="button" aria-pressed="${i === 1}" data-action="noop">${n}</button>`).join('')}</span></span></span></nav>
          <section class="scs-bottom" aria-label="Story beats"><div class="sdc-mode">${button('Tracks', 'noop', 'aria-pressed="true"')}${button('Reel', 'noop', 'aria-pressed="false"')}</div>
            <div class="sdc-timeline"><div class="sdc-lane-labels scs-lanes">${(compact() ? ['Beat', 'Beat content'] : ['Beat', 'Background', 'Characters', 'Words', 'Sound', 'Flow / state']).map(l => `<span>${l}</span>`).join('')}</div><div class="sdc-columns scs-columns">${tracks.map(([id, kind, words, flow]) => `<div class="scs-col-wrap"><span class="scs-rail"></span><button type="button" class="sdc-column scs-column" aria-pressed="${id === '07'}" aria-label="Beat ${id} ${kind}" data-action="noop"><span class="sdc-beat-number">${id}</span>${compact() ? `<span>${escape(words || flow!)}</span>` : `<span></span><span></span><span>${escape(words!)}</span><span></span><span>${escape(flow!)}</span>`}</button></div>`).join('')}</div></div></section>
        </main></div>
        <footer class="scs-footer" aria-label="Status"><div class="scs-footer-status" role="status"><span class="scs-message">${escape(message || 'Ready')}</span></div><span class="scs-footer-context">Tracks · editing 07 Choice</span></footer>
        ${state === 'add-beat' ? addBeatDialog() : state === 'move' ? moveDialog() : ''}
      </div></div>`;
    host.querySelectorAll<HTMLElement>('[data-icon]').forEach(n => n.prepend(icon(n.dataset.icon!)));
    host.querySelector<HTMLSelectElement>('[aria-label="Editor variant"]')!.onchange = event => { variant = (event.target as HTMLSelectElement).value as Variant; render(); };
    host.querySelectorAll<HTMLSelectElement>('[data-move]').forEach(select => select.onchange = () => {
      if (select.dataset.move === 'place') { place = Number(select.value); position = places[place]!.positions.length - 1; } else position = Number(select.value);
      render();
    });
    host.querySelectorAll<HTMLInputElement>('input[data-place]').forEach(radio => radio.onchange = () => { place = Number(radio.dataset.place); position = Number(radio.dataset.position); render(); });
    if (compact()) {
      const work = host.querySelector<HTMLElement>('.scs-workspace')!, editor = host.querySelector<HTMLElement>('.sdc-editor')!;
      editor.style.minHeight = `${work.clientHeight}px`; work.scrollTop = editor.offsetTop;
      if (state === 'custom-code') work.scrollTop = work.scrollHeight;
    } else if (state === 'custom-code') { const editor = host.querySelector<HTMLElement>('.sdc-editor')!; editor.scrollTop = editor.scrollHeight; }
    if (state === 'then-menu') host.querySelector<HTMLElement>('.sce-menu-list')?.scrollIntoView({ block: 'end' });
    const first = ['.sce-tree2 [tabindex="0"]', '.sce-dialog [aria-selected=true]', '.sce-dialog select', '.sce-dialog input:checked', '.sce-dialog [aria-current=true]', '.sce-dialog', '.sce-menu-list [aria-selected=true]'].map(q => host.querySelector<HTMLElement>(q)).find(Boolean);
    first?.focus({ preventScroll: true });
  }
  const compact = () => host.clientWidth <= 640;
  function close(note = '') { state = 'choice'; menuOpen = false; message = note; render(); host.querySelector<HTMLElement>('.sdc-editor')?.focus(); }

  function onClick(event: MouseEvent) {
    const node0 = (event.target as HTMLElement).closest<HTMLElement>('.sce-tree2 [data-node]');
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!node0 && (!target || !host.contains(target) || target.getAttribute('aria-disabled') === 'true')) return;
    const node = (event.target as HTMLElement).closest<HTMLElement>('.sce-tree2 [data-node]');
    if (node && host.contains(node)) { const n = nodes.get(node.dataset.node!)!; if (n.children && expanded.has(n.id) && pickedPlace === n.id && !chosen) expanded.delete(n.id); else treeSelect(n); render(); return; }
    if (!target) return;
    if (target.dataset.placeRow) { place = Number(target.dataset.placeRow); position = places[place]!.positions.length - 1; render(); return; }
    switch (target.dataset.action) {
      case 'reset': state = context.state as State; menuOpen = state === 'then-menu'; message = ''; place = 2; position = 1; resetTree(); render(); break;
      case 'toggle-menu': menuOpen = !menuOpen; render(); break;
      case 'pick': close('Option 1 keeps Continue after the Choice.'); break;
      case 'add-beat': state = 'add-beat'; menuOpen = false; render(); break;
      case 'added': close(`Added ${target.textContent} at End of option 2 "Leave".`); break;
      case 'moved':
        if (variant !== 'replace-v2') close(`Moved 06.1 to ${places[place]!.positions[position]}.`);
        else if (chosen) close(`Moved 06.1 to ${nodes.get(chosen)!.label}.`);
        else { message = `Choose an available position in ${nodes.get(pickedPlace)!.label}.`; render(); }
        break;
      case 'close': close(); break;
      case 'noop': message = `${target.getAttribute('aria-label') ?? target.textContent?.trim()} is outside this study.`; render(); break;
    }
  }
  function onKey(event: KeyboardEvent) {
    if ((event.target as HTMLElement).closest('.sce-tree2')) treeKey(event);
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    if (state === 'add-beat' || state === 'move' || menuOpen) { event.preventDefault(); close(); }
  }
  let width = 0;
  const resize = new ResizeObserver(() => { if (host.clientWidth !== width) { width = host.clientWidth; render(); } });
  host.addEventListener('click', onClick); host.addEventListener('keydown', onKey);
  render(); width = host.clientWidth; resize.observe(host);
  return () => { resize.disconnect(); host.removeEventListener('click', onClick); host.removeEventListener('keydown', onKey); host.replaceChildren(); };
}
