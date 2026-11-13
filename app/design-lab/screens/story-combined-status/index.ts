// Story Combined v1 status study: draft markers, Save refusal, header Undo/Redo and no-"body" wording.
// Throwaway, memory-only. Palette and conflict editor come from story-revamp and story-draft-conflict by import.
import type { LabContext } from '../../contracts.ts';
import { icon } from '../../../src/icons.ts';
import platform from '../story-revamp/art/bg-rainy-platform.webp';
import dawn from '../story-revamp/art/bg-station-dawn.webp';
import mara from '../story-revamp/art/mara-neutral.webp';
import eli from '../story-revamp/art/eli-neutral.webp';
import '../story-revamp/combined-revision.css';
import '../story-draft-conflict/style.css';
import './style.css';

export type Variant = 'header' | 'header-v2' | 'footer' | 'strip';
const variants: Variant[] = ['header', 'header-v2', 'footer', 'strip'];
const names: Record<Variant, string> = { header: '1 · Header save status', 'header-v2': '1 · Header save status v2', footer: '2 · Status bar', strip: '3 · Refusal above Tracks' };

type Lines = { speaker: string; text: string };
type Kind = 'Background' | 'Music' | 'Character' | 'Narration' | 'Dialogue' | 'Condition' | 'Choice';
type Arm = 1 | 2 | 3;
/** A beat column. Text beats carry saved/base/draft; base is the source the draft started from. */
type Beat = { type: 'beat'; id: string; kind: Kind; arm?: Arm; rail?: string; lane?: string; saved: Lines | null; base: Lines | null; draft: Lines | null };
/** An insertion marker at the end of a scene, branch or option. */
type End = { type: 'end'; label: string; arm?: Arm; owner: string };
type Item = Beat | End;
type Scene = { id: string; name: string; art: string; artName: string; background: string; items: Item[] };
type Entry = { name: string; scene: string; beat: string; before: Lines | null; after: Lines | null };

const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const same = (a: Lines | null, b: Lines | null) => a?.speaker === b?.speaker && a?.text === b?.text;
const textBeat = (b: Beat) => b.kind === 'Dialogue' || b.kind === 'Narration';
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const mac = /Mac|iPhone|iPad/.test(navigator.platform);
const keys = { undo: mac ? '⌘Z' : 'Ctrl+Z', redo: mac ? '⇧⌘Z' : 'Ctrl+Y' };
const paths = { undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11', redo: 'm15 14 5-5-5-5m5 5H9.5a5.5 5.5 0 0 0 0 11H13' };
const svg = (d: string) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** Shortens a long condition the way the Branch path does: whole words, then an ellipsis. */
export function shorten(text: string, limit = 26) {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit + 1).replace(/\s+\S*$/, '');
  return `${cut || text.slice(0, limit)}…`;
}
const outer = 'has_ticket and trust ≥ 3 and not missed_tram';
const inner = 'trust ≥ 5';

function fixtures(): Scene[] {
  const fixed = (id: string, kind: Kind, lane: string, arm?: Arm, rail?: string): Beat => ({ type: 'beat', id, kind, lane, arm, rail, saved: null, base: null, draft: null });
  const line = (id: string, kind: Kind, speaker: string, text: string, arm?: Arm, rail?: string): Beat => ({ type: 'beat', id, kind, arm, rail, saved: { speaker, text }, base: { speaker, text }, draft: null });
  return [
    { id: 'service', name: 'The last service', art: mara, artName: 'Mara', background: platform, items: [
      fixed('01', 'Background', 'Rainy platform'), fixed('02', 'Music', 'Night service'), fixed('03', 'Character', 'Mara · Neutral · Centre'),
      line('04', 'Narration', '', 'The timetable has not changed in thirty years.'),
      line('05', 'Dialogue', 'Mara', 'You heard the bell too?'),
      fixed('06', 'Condition', `If ${outer}`),
      line('06.1', 'Dialogue', 'Eli', 'Keep your ticket. Some doors only open once.', 1, `If ${outer}`),
      fixed('06.2', 'Condition', `If ${inner}`, 1),
      line('06.2.1', 'Dialogue', 'Mara', 'There is something I should tell you.', 3, `If ${inner}`),
      { type: 'end', label: `End of "If ${inner}"`, arm: 3, owner: '06.2' },
      { type: 'end', label: `End of "If ${shorten(outer)}"`, arm: 1, owner: '06' },
      fixed('07', 'Choice', '3 options'),
      line('07.2.1', 'Narration', '', 'Mara turns up her collar and walks into the rain.', 2, 'Option 2 "Leave"'),
      { type: 'end', label: 'End of option 2 "Leave"', arm: 2, owner: '07' },
      line('08', 'Narration', '', 'The doors close behind them.'),
      { type: 'end', label: 'End of scene', owner: 'scene' },
    ] },
    { id: 'depot', name: 'Morning at the depot', art: eli, artName: 'Eli', background: dawn, items: [
      fixed('01', 'Background', 'Station at dawn'), fixed('02', 'Character', 'Eli · Neutral · Left'),
      // A new beat with no saved source yet.
      { type: 'beat', id: '03', kind: 'Dialogue', saved: null, base: null, draft: null },
      line('04', 'Dialogue', 'Eli', 'The depot opens at six.'),
      line('05', 'Narration', '', 'Steam rises from the rails.'),
      { type: 'end', label: 'End of scene', owner: 'scene' },
    ] },
  ];
}

// Ren'Py text tags that wrap text must close. Good enough for the sample.
const paired = ['i', 'b', 'u', 's', 'color', 'size', 'font', 'a'];
function unclosedTag(text: string) {
  const open: string[] = [];
  for (const [, slash, name] of text.matchAll(/\{(\/?)([a-z]+)[^}]*\}/g)) {
    if (!paired.includes(name!)) continue;
    if (!slash) open.push(name!); else if (open.at(-1) === name) open.pop(); else return name!;
  }
  return open.at(-1) ?? null;
}

export function mountStatus(host: HTMLElement, context: LabContext, initial: Variant) {
  let variant = initial;
  let scenes: Scene[] = [];
  let sceneId = 'service', selected = '06.2.1', mode: 'tracks' | 'reel' = 'tracks';
  let refused = false, message = '', done: Entry[] = [], undone: Entry[] = [];
  const compact = () => host.clientWidth <= 640;

  const scene = (id = sceneId) => scenes.find(s => s.id === id)!;
  const beats = (s: Scene) => s.items.filter((i): i is Beat => i.type === 'beat');
  const beat = (s = scene(), id = selected) => beats(s).find(b => b.id === id)!;
  const drafts = () => scenes.flatMap(s => beats(s).filter(b => b.draft).map(b => ({ scene: s, beat: b })));
  const conflicted = (b: Beat) => !!b.draft && !!b.saved && !same(b.base, b.saved);
  function problem(b: Beat): { field: 'source' | 'speaker' | 'text'; short: string; detail: string } | null {
    if (!b.draft) return null;
    if (conflicted(b)) return { field: 'source', short: 'Conflict with source', detail: 'The source changed after you started editing.' };
    if (b.kind === 'Dialogue' && !b.draft.speaker) return { field: 'speaker', short: 'No speaker', detail: 'Choose a speaker.' };
    if (!b.draft.text.trim()) return { field: 'text', short: 'No text', detail: `Enter the ${b.kind === 'Dialogue' ? 'line' : 'narration'}.` };
    const tag = unclosedTag(b.draft.text);
    return tag ? { field: 'text', short: `Open {${tag}} tag`, detail: `Close {${tag}} with {/${tag}}.` } : null;
  }
  const failing = () => drafts().filter(d => problem(d.beat));
  /** Failure marks appear only after a refused Save. A conflict has its own quiet mark before that. */
  const failed = (b: Beat) => refused && !!problem(b);
  const name = (b: Beat) => `${b.id} ${b.kind === 'Dialogue' ? `${(b.draft ?? b.saved)?.speaker || 'new'}'s line` : b.kind}`;

  function reset() {
    scenes = fixtures(); done = []; undone = []; message = ''; refused = false; mode = 'tracks';
    const service = scene('service'), depot = scene('depot');
    const history = (s: Scene, b: Beat, after: Lines) => { b.base = b.saved; b.draft = after; done.push({ name: `dialogue edit in beat ${b.id}`, scene: s.id, beat: b.id, before: null, after }); };
    done.push({ name: 'background change in beat 01', scene: 'service', beat: '01', before: null, after: null });
    history(depot, beat(depot, '03'), { speaker: '', text: "You missed the last tram, didn't you?" });
    history(depot, beat(depot, '04'), { speaker: 'Eli', text: 'The depot opens at six. Not a minute later.' });
    beat(depot, '04').saved = { speaker: 'Eli', text: 'The depot opens at seven.' }; // Source changed after the draft began.
    history(depot, beat(depot, '05'), { speaker: '', text: 'Steam rises from the cold rails.' });
    history(service, beat(service, '05'), { speaker: 'Mara', text: '{i}You heard the bell too?' });
    history(service, beat(service, '06.2.1'), { speaker: 'Mara', text: 'There is something I should tell you. Not here.' });
    sceneId = 'service'; selected = '06.2.1';
    if (context.state === 'refused') save();
    if (context.state === 'conflict') { sceneId = 'depot'; selected = '04'; mode = 'reel'; }
    if (context.state === 'undone') undo();
  }

  function go(s: string, id: string) { sceneId = s; selected = id; }
  function save() {
    const bad = failing();
    if (bad.length) { refused = true; message = ''; go(bad[0]!.scene.id, bad[0]!.beat.id); return; }
    const count = drafts().length;
    for (const { beat: b } of drafts()) { b.saved = b.draft; b.base = b.draft; b.draft = null; }
    refused = false; message = count ? `Saved ${plural(count, 'beat draft')}.` : 'Saved.';
  }
  function commit() {
    const b = beat(); if (!b.draft) return;
    if (problem(b)) { refused = true; return; }
    b.saved = b.draft; b.base = b.draft; b.draft = null; message = `Saved beat ${b.id}. Other drafts are still unsaved.`;
  }
  function discard() { const b = beat(); if (!b.draft) return; b.draft = null; b.base = b.saved; message = 'Discarded your draft. The source is unchanged.'; }
  function override() {
    const b = beat(); if (!b.draft) return;
    if (!b.draft.text.trim()) { message = 'Enter text before saving this beat.'; return; }
    b.saved = b.draft; b.base = b.draft; b.draft = null; message = `Saved beat ${b.id}. Other drafts are still unsaved.`;
  }
  function edit(field: keyof Lines, value: string) {
    const b = beat(), before = b.draft ? { ...b.draft } : null;
    if (!b.draft) { b.base = b.saved; b.draft = { ...(b.saved ?? { speaker: '', text: '' }) }; }
    b.draft[field] = value;
    if (b.saved && same(b.draft, b.saved)) { b.draft = null; b.base = b.saved; }
    const last = done.at(-1);
    // Continuous typing in one beat is one Undo step. A new edit drops Redo.
    if (last && !undone.length && last.scene === sceneId && last.beat === b.id) last.after = b.draft && { ...b.draft };
    else done.push({ name: `dialogue edit in beat ${b.id}`, scene: sceneId, beat: b.id, before, after: b.draft && { ...b.draft } });
    undone = []; message = '';
  }
  function apply(entry: Entry, value: Lines | null) {
    go(entry.scene, entry.beat);
    const b = beats(scene()).find(x => x.id === entry.beat)!;
    if (!textBeat(b)) return;
    if (value && !b.draft) b.base = b.saved;
    b.draft = value && { ...value };
  }
  function undo() { const entry = done.pop(); if (!entry) return; apply(entry, entry.before); undone.push(entry); message = `Undone: ${entry.name}`; }
  function redo() { const entry = undone.pop(); if (!entry) return; apply(entry, entry.after); done.push(entry); message = `Redone: ${entry.name}`; }

  const button = (label: string, action: string, extra = '') => `<button type="button" data-action="${action}" ${extra}>${label}</button>`;

  // ---- Save status, in three placements.
  function sceneLinks() {
    const bad = failing();
    return scenes.map(s => ({ s, n: bad.filter(d => d.scene === s).length })).filter(x => x.n)
      .map(({ s, n }) => `<button type="button" class="scs-scene-count" data-scene-jump="${s.id}" aria-label="${escape(s.name)}, ${n} to fix">${escape(s.name)} <b>${n}</b></button>`).join('');
  }
  /** The full save-state line: draft count, ready, or the refusal with scene links. */
  function saveLine() {
    const count = drafts().length, bad = failing();
    if (refused && bad.length) return `<span class="scs-refused"><b>Nothing saved.</b> ${bad.length} of ${plural(count, 'draft')} need changes:</span>${sceneLinks()}`;
    if (refused && count) return `<span>${plural(count, 'unsaved beat draft')}. Ready to save.</span>`;
    return `<span>${count ? plural(count, 'unsaved beat draft') : 'Saved'}</span>`;
  }
  function shortState() {
    const count = drafts().length;
    if (refused && failing().length) return '<span class="scs-refused"><b>Nothing saved</b></span>';
    return `<span>${count ? variant === 'footer' ? 'Unsaved' : `${count} unsaved` : 'Saved'}</span>`;
  }
  function headerStatus() {
    if (variant === 'header') return saveLine();
    // v2 at compact width: "Nothing saved" keeps the header on one row; the bottom status bar holds the count and scene links.
    if (variant === 'header-v2') {
      if (!compact()) return saveLine();
      return shortState();
    }
    if (variant === 'footer') return shortState();
    // Strip: the header slot carries the last action, then the short state.
    return message ? `<span class="scs-message">${escape(message)}</span><span class="scs-dim">·</span>${shortState()}` : shortState();
  }
  function footer() {
    if (variant === 'strip') return '';
    const where = `<span class="scs-footer-context">${mode === 'tracks' ? 'Tracks' : 'Reel'} · editing ${escape(name(beat()))}</span>`;
    const v2Compact = variant === 'header-v2' && compact() && refused && drafts().length;
    const left = v2Compact ? `${message ? `<span class="scs-message">${escape(message)}</span><span class="scs-dim">·</span>` : ''}${saveLine()}`
      : variant === 'header' || variant === 'header-v2' ? `<span class="scs-message">${escape(message || 'Ready')}</span>`
      : `${message ? `<span class="scs-message">${escape(message)}</span><span class="scs-dim">·</span>` : ''}${saveLine()}`;
    return `<footer class="scs-footer" aria-label="Status"><div class="scs-footer-status" role="status">${left}</div>${where}</footer>`;
  }
  function strip() {
    if (variant !== 'strip' || !refused) return '';
    const bad = failing();
    if (!bad.length) return `<div class="scs-strip" role="status"><span>${plural(drafts().length, 'unsaved beat draft')}. Ready to save.</span></div>`;
    return `<div class="scs-strip" role="status">${saveLine()}</div>`;
  }

  // ---- Header, with Undo and Redo as approved in header-undo icons-v1.
  function history(kind: 'undo' | 'redo') {
    const entry = kind === 'undo' ? done.at(-1) : undone.at(-1), word = kind === 'undo' ? 'Undo' : 'Redo';
    const label = entry ? `${word} ${entry.name}` : `Nothing to ${kind}`;
    return `<span class="scs-cmd"><button type="button" class="scs-history" data-action="${kind}" aria-label="${escape(label)}" aria-keyshortcuts="${kind === 'undo' ? 'Meta+Z Control+Z' : 'Meta+Shift+Z Control+Y'}" aria-disabled="${!entry}">${svg(paths[kind])}</button><span class="scs-tip" role="tooltip">${escape(label)}${entry ? ` <kbd>${keys[kind]}</kbd>` : ''}</span></span>`;
  }
  function header() {
    return `<header class="scs-header"><strong class="scs-brand" data-icon="story">Loomlight</strong><span class="scs-project">The Last Tram</span>
      <div class="scs-save-state" aria-label="Save status">${headerStatus()}</div>
      <div class="scs-history-group" role="group" aria-label="Project history">${history('undo')}${history('redo')}</div>
      ${button('Save', 'save', 'class="sdc-primary"')}<span class="scs-runtime">${button('Validate', 'noop')}${button('Run', 'noop')}${button('Stop', 'noop', 'disabled')}</span></header>`;
  }

  // ---- Tracks and Reel.
  function mark(b: Beat) {
    if (!b.draft) return '';
    if (failed(b)) return '<b class="scs-fail-mark" aria-hidden="true">!</b>';
    if (conflicted(b)) return '<b class="scs-conflict-mark" aria-hidden="true">!</b>';
    return '<b class="scs-draft-mark" aria-hidden="true">*</b>';
  }
  function cells(b: Beat) {
    const v = b.draft ?? b.saved;
    const words = b.kind === 'Dialogue' ? `${v?.speaker || '?'}: ${v?.text ?? ''}` : b.kind === 'Narration' ? v?.text ?? '' : '';
    return [b.kind === 'Background' ? b.lane! : '', b.kind === 'Character' ? b.lane! : '', words, b.kind === 'Music' ? b.lane! : '', ['Condition', 'Choice'].includes(b.kind) ? `${b.kind} · ${b.lane}` : ''];
  }
  function rail(item: Item, previous?: Item) {
    if (!item.arm) return '<span class="scs-rail"></span>';
    const first = item.type === 'beat' && item.rail && previous?.arm !== item.arm;
    return `<span class="scs-rail scs-rail-on" data-arm="${item.arm}">${first ? `<span class="scs-rail-label" title="${escape((item as Beat).rail!)}">${escape(shorten((item as Beat).rail!, 30))}</span>` : ''}</span>`;
  }
  function endMarker(e: End, previous?: Item) {
    const label = escape(e.label);
    const attrs = `type="button" class="scs-end" data-end="${escape(e.owner)}" ${e.arm ? `data-arm="${e.arm}"` : ''} aria-label="Add a beat at ${label}" title="Add a beat at ${label}"`;
    if (variant === 'footer') return `<div class="scs-end-wrap scs-end-slim" ${e.arm ? `data-arm="${e.arm}"` : ''}>${rail(e, previous)}<button ${attrs}><span class="scs-end-plus">+</span><span class="scs-end-text">${label}</span></button></div>`;
    return `<div class="scs-end-wrap" ${e.arm ? `data-arm="${e.arm}"` : ''}>${rail(e, previous)}<button ${attrs}><span class="scs-end-plus">+</span><span class="scs-end-text">${label}</span></button></div>`;
  }
  function columns() {
    const s = scene();
    return s.items.map((item, i) => {
      const previous = s.items[i - 1];
      if (item.type === 'end') return endMarker(item, previous);
      const b = item, p = problem(b), fail = failed(b), c = cells(b);
      const state = fail ? `, needs changes: ${p!.short}` : conflicted(b) ? ', conflict with source' : b.draft ? ', draft' : '';
      const reason = fail ? p!.short : conflicted(b) ? 'Conflict with source' : '';
      const body = mode === 'tracks'
        ? (compact() ? [c[2] || c.filter(Boolean)[0] || ''] : c).map((t, n) => `<span${(compact() || n === 2) && fail && variant === 'footer' ? ' class="scs-lane-reason"' : ''}>${(compact() || n === 2) && fail && variant === 'footer' ? `<em>${escape(p!.short)}</em> ` : ''}${escape(t)}</span>`).join('')
        : `<span class="scs-reel-title">${b.kind}</span><span class="scs-reel-copy">${escape(c.filter(Boolean).join(' · '))}</span>${reason ? `<span class="${fail ? 'scs-reel-fail' : 'scs-reel-conflict'}">${escape(reason)}</span>` : ''}`;
      return `<div class="scs-col-wrap" ${b.arm ? `data-arm="${b.arm}"` : ''}>${rail(b, previous)}<button type="button" class="sdc-column scs-column${fail ? ' scs-fail' : ''}" data-select="${b.id}" ${textBeat(b) ? '' : 'aria-disabled="true"'} aria-label="${escape(`Beat ${b.id} ${b.kind}${state}`)}" aria-pressed="${b.id === selected}" ${reason ? `title="${escape(reason)}"` : ''}><span class="sdc-beat-number">${b.id}${mark(b)}</span>${body}</button></div>`;
    }).join('');
  }
  function legend() {
    const showFail = refused && failing().length;
    return `<span class="scs-legend"><span><b class="scs-draft-mark">*</b> Draft</span><span><b class="scs-conflict-mark">!</b> Conflict with source</span>${showFail ? '<span><b class="scs-fail-mark">!</b> Needs changes</span>' : ''}</span>`;
  }

  // ---- Branch path: switches only. Long conditions shorten with an ellipsis; the title keeps the full test.
  function branchPath() {
    if (sceneId !== 'service') return '<strong class="sc-conditions-title">Branch path</strong><span class="sc-conditions-empty">No branches in this scene</span>';
    const group = (ref: string, test: string, arm: Arm, labels: string[], pressed: number) => `<span class="sc-condition-group scs-path-group" data-arm="${arm}"><span class="scs-path-ref">${ref}</span><span class="sc-condition-test" title="${escape(test)}">${escape(shorten(test))}</span><span class="sc-branch-switch">${labels.map((l, i) => `<button type="button" class="button" aria-pressed="${i === pressed}" data-action="noop">${l}</button>`).join('')}</span></span>`;
    const arrow = '<span class="sc-path-arrow" aria-hidden="true">›</span>';
    return `<strong class="sc-conditions-title">Branch path</strong><span class="sc-condition-groups scs-path-groups">${group('06', outer, 1, ['If', 'Otherwise'], 0)}${arrow}${group('06.2', inner, 3, ['If', 'Otherwise'], 0)}${arrow}${group('07', 'Choice', 2, ['1', '2', '3'], 1)}</span>`;
  }
  function trail(b: Beat) {
    const s = scene();
    const parts = [s.name];
    if (b.id.startsWith('06.')) parts.push(`If ${shorten(outer)}`);
    if (b.id.startsWith('06.2.')) parts.push(`If ${inner}`);
    if (b.id.startsWith('07.2.')) parts.push('Option 2 "Leave"');
    return parts.map(escape).join(' <span aria-hidden="true">›</span> ');
  }

  // ---- Selected-beat editor.
  function editor() {
    const s = scene(), b = beat(), value = b.draft ?? b.saved ?? { speaker: '', text: '' };
    const p = failed(b) ? problem(b) : null, conflict = conflicted(b);
    const err = (field: string) => p && p.field === field && variant !== 'footer' ? `<p class="scs-field-error" id="scs-error-${field}">${escape(p.detail)}</p>` : '';
    const invalid = (field: string) => p && p.field === field ? `aria-invalid="true" aria-describedby="scs-error-${field}"` : '';
    const banner = p && variant === 'footer' && p.field !== 'source' ? `<p class="scs-editor-banner" id="scs-error-${p.field}"><b>!</b> Not saved. ${escape(p.detail)}</p>` : '';
    const state = b.draft ? `<span class="scs-editor-state ${p ? 'scs-fail-text' : conflict ? 'scs-conflict-text' : ''}">${p ? '! Needs changes' : conflict ? '! Conflict' : '* Draft'}</span>` : '';
    const speakers = ['Mara', 'Eli'].map(n => `<option ${value.speaker === n ? 'selected' : ''}>${n}</option>`).join('');
    return `<div class="sdc-editor-heading scs-editor-heading"><strong>${b.id} · ${b.kind}${b.saved ? '' : ' (new)'}</strong>${state}</div>
      <p class="scs-trail">${trail(b)}</p>${banner}
      ${b.kind === 'Dialogue' ? `<label class="sdc-speaker scs-speaker">Speaker<select aria-label="Speaker" ${invalid('speaker')} data-speaker="${escape(value.speaker)}"><option value="" ${value.speaker ? '' : 'selected'}>Choose…</option>${speakers}</select></label>${err('speaker')}` : ''}
      ${conflict ? `<section class="sdc-conflict" tabindex="-1" aria-label="Conflict with source"><strong>Conflict with source</strong><p>The source changed after you started editing.</p><label>Source<output class="sdc-saved-line">${escape(b.saved!.text)}</output></label></section>` : ''}
      <label class="sdc-field"><span>${conflict ? 'Your draft' : b.kind}</span><textarea aria-label="Beat text" ${invalid('text')}>${escape(value.text)}</textarea></label>${err('text')}
      ${conflict ? `<div class="sdc-resolution"><div class="sdc-row">${button('Discard draft', 'discard')}${button('Override source', 'override', 'class="sdc-primary"')}</div><p>Other drafts stay unsaved.</p></div>` : ''}
      ${!conflict && b.draft ? `<div class="sdc-row sdc-commit">${button('Commit', 'commit', 'class="sdc-primary"')}${button('Cancel', 'discard')}</div>` : ''}
      <div class="sdc-effects"><strong>In effect at ${b.id}</strong><span>${s.id === 'service' ? 'Rainy platform' : 'Station at dawn'}</span><span>${s.artName} · Neutral</span></div>`;
  }
  function stageLine() {
    const s = scene(), list = beats(s), index = list.findIndex(b => b.id === selected);
    const shown = list.slice(0, index + 1).reverse().find(textBeat);
    const v = shown ? (shown.draft?.text.trim() && !problem(shown) ? shown.draft : shown.saved ?? shown.draft) : null;
    return { speaker: shown?.kind === 'Dialogue' ? v?.speaker ?? '' : '', text: v?.text ?? '' };
  }

  function render() {
    const s = scene(), line = stageLine();
    const keepEditor = host.querySelector<HTMLElement>('.sdc-editor')?.dataset.beat === `${s.id}:${selected}`;
    const editorScroll = keepEditor ? host.querySelector<HTMLElement>('.sdc-editor')!.scrollTop : 0;
    host.innerHTML = `<div class="sdc-shell sc-combined-shell scs-shell" data-variant="${variant}">
      <section class="scs-prototype" aria-label="Prototype controls"><strong>Status study · draft</strong><label>Compare <select aria-label="Status variant">${variants.map(v => `<option value="${v}" ${v === variant ? 'selected' : ''}>${names[v]}</option>`).join('')}</select></label>${button('Reset', 'reset')}</section>
      <div class="scs-app">${header()}
        <div class="scs-body"><nav class="sdc-nav" aria-label="Workspaces"><span data-icon="panelOpen"></span><span data-icon="story" class="sdc-nav-selected" title="Story"></span><span data-icon="source"></span><span data-icon="branches"></span><span data-icon="characters"></span><span data-icon="assets"></span></nav>
        <main class="scs-main">
          <header class="scs-toolbar"><strong class="scs-scene-name">${escape(s.name)} ▾</strong><span class="scs-spacer"></span>${button('Writing focus', 'noop')}${button('+ Add beat', 'noop', 'class="sdc-primary"')}${button('More', 'noop', 'class="scs-plain"')}</header>
          <div class="scs-workspace"><section class="sdc-stage-area" aria-label="Game stage"><div class="sdc-stage-heading"><strong>Game window</strong><span>1920 × 1080</span></div><div class="sdc-stage-fit"><div class="sdc-stage"><img class="sdc-background" src="${s.background}" alt=""><div class="sdc-character"><img src="${s.art}" alt="${s.artName}"></div><div class="sdc-saybox"><strong class="scs-say-${line.speaker.toLowerCase()}">${escape(line.speaker)}</strong><p data-stage-text>${escape(line.text)}</p></div></div></div></section>
            <aside class="sdc-editor" data-beat="${s.id}:${selected}" aria-label="Selected beat editor">${editor()}</aside></div>
          <nav class="sc-conditions scs-path" aria-label="Branch path">${branchPath()}</nav>
          ${strip()}
          <section class="scs-bottom" aria-label="Story beats"><div class="sdc-mode">${button('Tracks', 'tracks', `aria-pressed="${mode === 'tracks'}"`)}${button('Reel', 'reel', `aria-pressed="${mode === 'reel'}"`)}${legend()}</div>
            <div class="sdc-timeline ${mode === 'reel' ? 'sdc-reel' : ''}">${mode === 'tracks' ? `<div class="sdc-lane-labels scs-lanes">${(compact() ? ['Beat', 'Beat content'] : ['Beat', 'Background', 'Characters', 'Words', 'Sound', 'Flow / state']).map(l => `<span>${l}</span>`).join('')}</div>` : ''}<div class="sdc-columns scs-columns">${columns()}</div></div></section>
        </main></div>${footer()}
      </div></div>`;
    host.querySelectorAll<HTMLElement>('[data-icon]').forEach(n => n.prepend(icon(n.dataset.icon!)));
    const editorNode = host.querySelector<HTMLElement>('.sdc-editor')!;
    editorNode.scrollTop = editorScroll;
    // Keep the selected column in view, and at compact size show the editor rather than the stage.
    const row = host.querySelector<HTMLElement>(".scs-columns")!, chosen = row.querySelector<HTMLElement>('[aria-pressed=true]');
    if (chosen) { const c = chosen.parentElement!.getBoundingClientRect(), r = row.getBoundingClientRect(); row.scrollLeft += c.left - r.left - Math.max(0, (r.width - c.width) / 3); }
    if (compact()) { const work = host.querySelector<HTMLElement>('.scs-workspace')!; editorNode.style.minHeight = `${work.clientHeight}px`; work.scrollTop = editorNode.offsetTop; }
    host.querySelector<HTMLTextAreaElement>('textarea')!.oninput = event => {
      const field = event.target as HTMLTextAreaElement, start = field.selectionStart, end = field.selectionEnd;
      edit('text', field.value); render();
      const next = host.querySelector<HTMLTextAreaElement>('textarea')!; next.focus(); next.setSelectionRange(start, end);
    };
    const speaker = host.querySelector<HTMLSelectElement>('[aria-label="Speaker"]');
    if (speaker) speaker.onchange = () => { edit('speaker', speaker.value); render(); host.querySelector<HTMLSelectElement>('[aria-label="Speaker"]')!.focus(); };
    host.querySelector<HTMLSelectElement>('[aria-label="Status variant"]')!.onchange = event => { variant = (event.target as HTMLSelectElement).value as Variant; render(); };
  }
  function reveal() { render(); host.querySelector<HTMLElement>('.sdc-conflict, [aria-invalid=true]')?.focus(); }

  function onClick(event: MouseEvent) {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!target || !host.contains(target) || target.getAttribute('aria-disabled') === 'true') return;
    if (target.dataset.select) { selected = target.dataset.select; render(); return; }
    if (target.dataset.end) { message = `${target.title}. The Add a beat dialog is in the editor study.`; render(); return; }
    if (target.dataset.sceneJump) { const first = failing().find(d => d.scene.id === target.dataset.sceneJump); if (first) go(first.scene.id, first.beat.id); reveal(); return; }
    switch (target.dataset.action) {
      case 'reset': reset(); render(); break;
      case 'save': save(); reveal(); break;
      case 'commit': commit(); reveal(); break;
      case 'discard': discard(); render(); break;
      case 'override': override(); render(); break;
      case 'undo': undo(); render(); host.querySelector<HTMLElement>('[data-action=undo]')?.focus(); break;
      case 'redo': redo(); render(); host.querySelector<HTMLElement>('[data-action=redo]')?.focus(); break;
      case 'tracks': mode = 'tracks'; render(); break;
      case 'reel': mode = 'reel'; render(); break;
      case 'noop': message = `${target.textContent?.trim()} is outside this study.`; render(); break;
    }
  }
  function onKey(event: KeyboardEvent) {
    const mod = event.metaKey || event.ctrlKey, key = event.key.toLowerCase();
    if (mod && key === 's') { event.preventDefault(); save(); reveal(); return; }
    if (mod && (key === 'y' || (key === 'z' && event.shiftKey))) { event.preventDefault(); redo(); render(); return; }
    if (mod && key === 'z') { event.preventDefault(); undo(); render(); }
  }
  let width = 0;
  const resize = new ResizeObserver(() => { if (host.clientWidth !== width) { width = host.clientWidth; render(); } });
  reset();
  host.addEventListener('click', onClick); host.addEventListener('keydown', onKey);
  render(); width = host.clientWidth; resize.observe(host);
  return () => { resize.disconnect(); host.removeEventListener('click', onClick); host.removeEventListener('keydown', onKey); host.replaceChildren(); };
}
