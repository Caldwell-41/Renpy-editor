// Three ways to show a Story Save refusal with several failing drafts. Throwaway, memory-only.
// Layout and conflict editor reuse Story Combined v1 and the approved B conflict editor.
import type { LabContext } from '../../contracts.ts';
import { icon } from '../../../src/icons.ts';
import platform from '../story-revamp/art/bg-rainy-platform.webp';
import dawn from '../story-revamp/art/bg-station-dawn.webp';
import mara from '../story-revamp/art/mara-neutral.webp';
import eli from '../story-revamp/art/eli-neutral.webp';
import '../story-revamp/combined-revision.css';
import '../story-draft-conflict/style.css';
import './style.css';

export type Variant = 'marked' | 'stepper' | 'first';
type Lines = { speaker: string; text: string };
type Kind = 'Background' | 'Music' | 'Character' | 'Narration' | 'Dialogue' | 'Condition';
type Beat = { id: string; kind: Kind; context?: string; saved: Lines | null; base: Lines | null; draft: Lines | null };
type Scene = { id: string; name: string; background: string; art: string; artName: string; beats: Beat[] };
const variants: Variant[] = ['marked', 'stepper', 'first'];
const names: Record<Variant, string> = { marked: '1 · Count and failure marks', stepper: '2 · Count with next/previous', first: '3 · First failure only' };
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const same = (a: Lines | null, b: Lines | null) => a?.speaker === b?.speaker && a?.text === b?.text;
const textBeat = (b: Beat) => b.kind === 'Dialogue' || b.kind === 'Narration';
const paired = ['i', 'b', 'u', 's', 'color', 'size', 'font', 'alpha', 'a', 'k'];

// Ren'Py text tags that wrap text must close. A small check that is good enough for the sample.
function unclosedTag(text: string) {
  const open: string[] = [];
  for (const [, slash, name] of text.matchAll(/\{(\/?)([a-z]+)[^}]*\}/g)) {
    if (!paired.includes(name!)) continue;
    if (!slash) open.push(name!);
    else if (open.at(-1) === name) open.pop();
    else return name!;
  }
  return open.at(-1) ?? null;
}

function fixtures(): Scene[] {
  const fixed = (id: string, kind: Kind, context: string): Beat => ({ id, kind, context, saved: null, base: null, draft: null });
  const line = (id: string, kind: Kind, speaker: string, text: string): Beat => ({ id, kind, saved: { speaker, text }, base: { speaker, text }, draft: null });
  return [
    { id: 'service', name: 'The last service', background: platform, art: mara, artName: 'Mara', beats: [
      fixed('01', 'Background', 'Rainy platform'), fixed('02', 'Music', 'Night service'), fixed('03', 'Character', 'Mara · Neutral'),
      line('04', 'Narration', '', 'The station is empty.'), line('05', 'Dialogue', 'Mara', 'Hello'),
      fixed('06', 'Condition', 'If has_ticket'), line('07', 'Narration', '', 'The last tram is still waiting.'),
    ] },
    { id: 'depot', name: 'Morning at the depot', background: dawn, art: eli, artName: 'Eli', beats: [
      fixed('01', 'Background', 'Station at dawn'), fixed('02', 'Character', 'Eli · Neutral'),
      // A new beat the author has not added yet: it has no saved source.
      { id: '03', kind: 'Dialogue', saved: null, base: null, draft: null },
      line('04', 'Dialogue', 'Eli', 'The depot opens at six.'), line('05', 'Narration', '', 'Steam rises from the rails.'),
    ] },
  ];
}

export function mountRefusal(host: HTMLElement, context: LabContext, initial: Variant) {
  document.documentElement.dataset.theme = 'dark';
  let variant = initial;
  let scenes: Scene[];
  let sceneId = 'depot';
  let selected = '05';
  let mode: 'tracks' | 'reel' = 'tracks';
  let refused = false; // A Save refusal is showing.
  let revealed = ''; // First-only: the draft Save revealed.
  let shown = new Set<string>(); // Drafts whose Commit was refused.
  let note = '';
  let sceneMenu = false;
  let inspectionOpen = false;

  const key = (s: Scene, b: Beat) => `${s.id}:${b.id}`;
  const scene = () => scenes.find(s => s.id === sceneId)!;
  const beat = (s = scene(), id = selected) => s.beats.find(b => b.id === id)!;
  const drafts = () => scenes.flatMap(s => s.beats.filter(b => b.draft).map(b => ({ scene: s, beat: b })));
  const conflicted = (b: Beat) => !!b.draft && !!b.saved && !same(b.base, b.saved);
  function problem(b: Beat): { field: 'source' | 'speaker' | 'text'; short: string; detail: string } | null {
    if (!b.draft) return null;
    if (conflicted(b)) return { field: 'source', short: 'Conflict with source', detail: 'The source changed after you started editing.' };
    if (b.kind === 'Dialogue' && !b.draft.speaker) return { field: 'speaker', short: 'No speaker', detail: 'Choose a speaker.' };
    if (!b.draft.text.trim()) return { field: 'text', short: 'No text', detail: `Enter the ${b.kind === 'Dialogue' ? 'line' : 'narration'}.` };
    const tag = unclosedTag(b.draft.text);
    if (tag) return { field: 'text', short: `Open {${tag}} tag`, detail: `Close {${tag}} with {/${tag}}.` };
    return null;
  }
  const failing = () => drafts().filter(d => problem(d.beat));
  // Which failing drafts the author can see as failing.
  function visible(s: Scene, b: Beat) {
    if (!problem(b)) return false;
    if (conflicted(b) || shown.has(key(s, b))) return true;
    return variant === 'first' ? revealed === key(s, b) : refused;
  }

  function reset(refuse: boolean) {
    scenes = fixtures();
    const [service, depot] = scenes as [Scene, Scene];
    const draft = (b: Beat, speaker: string, text: string) => { b.base = b.saved; b.draft = { speaker, text }; };
    draft(beat(service, '05'), 'Mara', 'Stay here');
    beat(service, '05').saved = { speaker: 'Mara', text: 'Leave now' }; // Changed in source after the draft began.
    draft(beat(service, '07'), '', "I'll wait by the door.");
    draft(beat(depot, '03'), '', "You missed the last tram, didn't you?");
    draft(beat(depot, '04'), 'Eli', '{i}The first tram leaves at six.');
    draft(beat(depot, '05'), '', 'Steam rises from the cold rails.');
    sceneId = 'depot'; selected = '05'; mode = 'tracks'; refused = false; revealed = ''; shown = new Set(); note = ''; sceneMenu = false;
    if (refuse) save();
  }

  function go(s: Scene, b: Beat) { sceneId = s.id; selected = b.id; sceneMenu = false; }
  function save() {
    const bad = failing();
    if (bad.length) {
      refused = true; revealed = key(bad[0]!.scene, bad[0]!.beat); note = '';
      go(bad[0]!.scene, bad[0]!.beat);
      return;
    }
    const count = drafts().length;
    for (const { beat: b } of drafts()) { b.saved = b.draft; b.base = b.draft; b.draft = null; }
    refused = false; revealed = ''; shown = new Set();
    note = count ? `Saved ${count} beat ${count === 1 ? 'draft' : 'drafts'}.` : 'Saved.';
  }
  function commit() {
    const b = beat();
    if (!b.draft) return;
    if (problem(b)) { shown.add(key(scene(), b)); note = ''; return; }
    b.saved = b.draft; b.base = b.draft; b.draft = null;
    note = `Saved beat ${b.id}. Other drafts are still unsaved.`;
  }
  function discard() {
    const b = beat(); if (!b.draft) return;
    b.draft = null; b.base = b.saved;
    note = 'Discarded your draft. The source is unchanged.';
  }
  function override() {
    const b = beat(); if (!b.draft) return;
    if (!b.draft.text.trim()) { note = 'Enter text before saving this beat.'; return; }
    b.saved = b.draft; b.base = b.draft; b.draft = null;
    note = `Saved beat ${b.id}. Other drafts are still unsaved.`;
  }
  function edit(field: keyof Lines, value: string) {
    const b = beat();
    if (!b.draft) { b.base = b.saved; b.draft = { ...(b.saved ?? { speaker: '', text: '' }) }; }
    b.draft[field] = value;
    if (b.saved && same(b.draft, b.saved)) { b.draft = null; b.base = b.saved; }
    note = '';
  }
  function step(direction: 1 | -1) {
    const bad = failing();
    if (!bad.length) return;
    const order = drafts().map(d => key(d.scene, d.beat));
    const here = order.indexOf(key(scene(), beat()));
    const sorted = bad.map(d => ({ d, i: order.indexOf(key(d.scene, d.beat)) }));
    const next = direction === 1
      ? sorted.find(x => x.i > here) ?? sorted[0]!
      : [...sorted].reverse().find(x => x.i < here && x.i !== -1) ?? sorted.at(-1)!;
    go(next.d.scene, next.d.beat);
  }

  function button(label: string, action: string, extra = '') { return `<button type="button" data-action="${action}" ${extra}>${label}</button>`; }

  function status() {
    const count = drafts().length, bad = failing();
    const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
    if (note && !refused) return `<span class="ssr-status">${escape(note)}</span>`;
    if (variant === 'first') {
      const [sid, bid] = revealed.split(':');
      const target = scenes.find(s => s.id === sid);
      if (revealed && target && problem(beat(target, bid))) return `<span class="ssr-status ssr-refused"><b>Nothing saved.</b> Fix beat ${bid} in ${escape(target.name)}.</span>`;
      return `<span class="ssr-status">${count ? `${plural(count, 'unsaved beat draft')}` : 'Saved'}</span>`;
    }
    if (!refused) return `<span class="ssr-status">${count ? plural(count, 'unsaved beat draft') : 'Saved'}</span>`;
    if (!bad.length) return `<span class="ssr-status">${plural(count, 'unsaved beat draft')}. Ready to save.</span>`;
    if (variant === 'marked') {
      const byScene = scenes.map(s => ({ s, n: bad.filter(d => d.scene === s).length })).filter(x => x.n);
      return `<span class="ssr-status ssr-refused"><b>Nothing saved.</b> ${bad.length} of ${plural(count, 'draft')} need changes:</span>${byScene.map(({ s, n }) => `<button type="button" class="ssr-scene-count" data-scene-jump="${s.id}" aria-label="${escape(s.name)}, ${n} to fix">${escape(s.name)} <b>${n}</b></button>`).join('')}`;
    }
    const at = bad.findIndex(d => d.scene === scene() && d.beat === beat());
    return `<span class="ssr-status ssr-refused"><b>Nothing saved.</b> ${plural(bad.length, 'draft')} ${bad.length === 1 ? 'needs' : 'need'} changes.</span>
      <span class="ssr-stepper" role="group" aria-label="Drafts to fix">${button('‹', 'previous-failure', 'aria-label="Previous draft to fix" title="Previous draft to fix"')}<output aria-live="polite">${at === -1 ? `– of ${bad.length}` : `${at + 1} of ${bad.length}`}</output>${button('›', 'next-failure', 'aria-label="Next draft to fix" title="Next draft to fix"')}</span>`;
  }

  function marker(s: Scene, b: Beat) {
    if (!b.draft) return '';
    if (variant === 'marked' && visible(s, b)) return '<b class="ssr-fail-marker">!</b>';
    if (conflicted(b)) return '<b>!</b>';
    return '<b>•</b>';
  }
  function columns() {
    const s = scene();
    return s.beats.map(b => {
      const value = b.draft ?? b.saved;
      const words = b.kind === 'Dialogue' ? `${value?.speaker || '?'}: ${value?.text ?? ''}` : b.kind === 'Narration' ? value?.text ?? '' : '';
      const cells = [b.kind === 'Background' ? b.context! : '', b.kind === 'Character' ? b.context! : '', words, b.kind === 'Music' ? b.context! : '', b.kind === 'Condition' ? b.context! : ''];
      const p = problem(b), fail = variant === 'marked' && visible(s, b);
      const label = `Beat ${b.id} ${b.kind}${fail ? `, needs changes: ${p!.short}` : conflicted(b) ? ', conflict with source' : b.draft ? ', draft' : ''}`;
      const branch = s.id === 'service' && b.id === '07' ? ' sdc-branch-column' : '';
      return `<button type="button" class="sdc-column${branch}${fail ? ' ssr-fail' : ''}" data-select="${b.id}" ${textBeat(b) ? '' : 'disabled'} aria-label="${escape(label)}" aria-pressed="${b.id === selected}" ${fail ? `title="${escape(p!.short)}"` : ''}><span class="sdc-beat-number">${b.id}${marker(s, b)}</span>${mode === 'tracks' ? cells.map(c => `<span>${escape(c)}</span>`).join('') : `<span class="sdc-reel-title">${b.kind}</span><span class="sdc-reel-copy">${escape(cells.filter(Boolean).join(' · '))}</span>${fail ? `<span class="ssr-reel-fail">${escape(p!.short)}</span>` : ''}`}</button>`;
    }).join('');
  }
  function scenePicker() {
    const s = scene();
    const tally = (x: Scene) => {
      const ds = drafts().filter(d => d.scene === x);
      const bad = variant === 'marked' ? ds.filter(d => visible(x, d.beat)).length : 0;
      return `${ds.length ? `<span>• ${ds.length}</span>` : ''}${bad ? `<span class="ssr-fail-text">! ${bad}</span>` : ''}`;
    };
    return `<div class="ssr-scene-picker">${button(`${escape(s.name)} ▾`, 'scenes', `aria-expanded="${sceneMenu}" aria-label="Scenes · ${escape(s.name)}"`)}
      ${sceneMenu ? `<div class="ssr-scene-menu" role="menu"><strong>Chapter 1</strong>${scenes.map(x => `<button type="button" role="menuitem" data-scene="${x.id}" aria-current="${x === s ? 'page' : 'false'}"><span>${escape(x.name)}</span>${tally(x)}</button>`).join('')}</div>` : ''}</div>`;
  }
  function editor() {
    const s = scene(), b = beat(), value = b.draft ?? b.saved ?? { speaker: '', text: '' };
    const p = visible(s, b) ? problem(b) : null;
    const conflict = conflicted(b);
    const err = (field: string) => p && p.field === field ? `<p class="ssr-field-error" id="ssr-error-${field}">${escape(p.detail)}</p>` : '';
    const invalid = (field: string) => p && p.field === field ? `aria-invalid="true" aria-describedby="ssr-error-${field}"` : '';
    const speakers = ['Mara', 'Eli'].map(n => `<option ${value.speaker === n ? 'selected' : ''}>${n}</option>`).join('');
    return `<div class="sdc-editor-heading"><strong>${b.id} · ${b.kind}${b.saved ? '' : ' (new)'}</strong></div>
      ${b.kind === 'Dialogue' ? `<label class="sdc-speaker ssr-speaker">Speaker<select aria-label="Speaker" ${invalid('speaker')} data-speaker="${escape(value.speaker)}"><option value="" ${value.speaker ? '' : 'selected'}>Choose…</option>${speakers}</select></label>${err('speaker')}` : ''}
      ${conflict ? `<section class="sdc-conflict" tabindex="-1" aria-label="Conflict with source"><strong>Conflict with source</strong><p>The source changed after you started editing.</p><label>Source<output class="sdc-saved-line">${escape(b.saved!.text)}</output></label></section>` : ''}
      <label class="sdc-field"><span>${conflict ? 'Your draft' : b.kind}</span><textarea aria-label="Beat text" ${invalid('text')}>${escape(value.text)}</textarea></label>${err('text')}
      ${conflict ? `<div class="sdc-resolution"><div class="sdc-row">${button('Discard draft', 'discard')}${button('Override source', 'override', 'class="sdc-primary"')}</div><p>Other drafts stay unsaved.</p></div>` : ''}
      ${!conflict && b.draft ? `<div class="sdc-row sdc-commit">${button('Commit', 'commit', 'class="sdc-primary"')}${button('Cancel', 'discard')}</div>` : ''}
      <div class="sdc-message" role="status">${escape(note)}</div>
      <div class="sdc-effects"><strong>In effect at ${b.id}</strong><span>${s.id === 'service' ? 'Rainy platform' : 'Station at dawn'}</span><span>${s.artName} · Neutral, Centre</span>${s.id === 'service' ? '<span>Night service</span>' : ''}</div>`;
  }
  function inspection() {
    return `<table><thead><tr><th>Scene</th><th>Beat</th><th>Source</th><th>Draft</th><th>Check</th></tr></thead><tbody>${scenes.flatMap(s => s.beats.filter(textBeat).map(b => {
      const show = (l: Lines | null) => l ? escape(`${l.speaker ? l.speaker + ': ' : ''}${l.text}`) : 'None';
      return `<tr data-row="${key(s, b)}"><td>${escape(s.name)}</td><td>${b.id}</td><td data-saved="${key(s, b)}">${show(b.saved)}</td><td data-draft="${key(s, b)}">${show(b.draft)}</td><td>${b.draft ? escape(problem(b)?.short ?? 'Ready') : ''}</td></tr>`;
    })).join('')}</tbody></table>`;
  }
  function stageText(s: Scene) {
    const index = s.beats.findIndex(b => b.id === selected);
    const shownBeat = s.beats.slice(0, index + 1).reverse().find(textBeat);
    const v = shownBeat ? shownBeat.draft?.text.trim() ? shownBeat.draft : shownBeat.saved : null;
    return { speaker: shownBeat?.kind === 'Dialogue' ? v?.speaker ?? '' : '', text: v?.text ?? '' };
  }

  function render() {
    const s = scene(), line = stageText(s);
    const oldEditor = host.querySelector<HTMLElement>('.sdc-editor');
    const oldScroll = oldEditor?.dataset.beat === `${s.id}:${selected}` ? oldEditor.scrollTop : 0;
    host.innerHTML = `<div class="sdc-shell ssr-shell sc-combined-shell" data-variant="${variant}">
      <section class="sdc-prototype" aria-label="Prototype scenario controls"><div class="sdc-scenario-title"><strong>Save refusal study · unapproved</strong><span>Sample text. Changes stay in this preview.</span>${button('Reset', 'reset')}</div><div class="sdc-scenario-actions">${button('Load refusal', 'jump')}<span class="ssr-guide">Five drafts across two scenes. Three fail: a source conflict, a missing speaker and an open text tag.</span></div></section>
      <div class="sdc-product">
        <header class="sdc-app-header"><strong class="sdc-brand" data-icon="story">Loomlight</strong><span>The Last Tram</span><div class="ssr-status-line" aria-label="Save status">${status()}</div>${button('Save', 'save', 'class="sdc-primary"')}</header>
        <div class="sdc-app-body"><nav class="sdc-nav" aria-label="Workspace context"><span data-icon="panelOpen"></span><span data-icon="story" class="sdc-nav-selected" title="Story"></span><span data-icon="source"></span><span data-icon="branches"></span><span data-icon="characters"></span><span data-icon="assets"></span></nav>
        <main class="sdc-main"><header class="sdc-scene">${scenePicker()}<span>${selected} · ${beat().kind}</span></header>
        <div class="sdc-workspace"><section class="sdc-stage-area" aria-label="Game stage"><div class="sdc-stage-heading"><strong>Game window</strong><span>1920 × 1080</span></div><div class="sdc-stage-fit"><div class="sdc-stage"><img class="sdc-background" src="${s.background}" alt=""><div class="sdc-character"><img src="${s.art}" alt="${s.artName}"></div><div class="sdc-saybox"><strong class="ssr-say-${line.speaker.toLowerCase()}">${escape(line.speaker)}</strong><p data-stage-text>${escape(line.text)}</p></div></div></div></section><aside class="sdc-editor" data-beat="${s.id}:${selected}" aria-label="Selected beat editor">${editor()}</aside></div>
        <section class="sdc-branch-path" aria-label="Branch path"><strong>Branch path</strong>${s.id === 'service' ? '<span>06</span><span>has_ticket is true</span><div class="sdc-branch-switch"><button type="button" aria-pressed="true" disabled>If</button><button type="button" aria-pressed="false" disabled>Otherwise</button></div>' : '<span class="ssr-muted">No branches in this scene</span>'}</section>
        <section class="sdc-bottom" aria-label="Story beats"><div class="sdc-mode">${button('Tracks', 'tracks', `aria-pressed="${mode === 'tracks'}"`)}${button('Reel', 'reel', `aria-pressed="${mode === 'reel'}"`)}<span>${variant === 'marked' ? '• Draft &nbsp; <b class="ssr-fail-text">!</b> Needs changes' : '• Draft &nbsp; ! Conflict with source'}</span></div><div class="sdc-timeline ${mode === 'reel' ? 'sdc-reel' : ''}">${mode === 'tracks' ? '<div class="sdc-lane-labels"><span>Beat</span><span>Background</span><span>Characters</span><span>Words</span><span>Sound</span><span>Flow / state</span></div>' : ''}<div class="sdc-columns">${columns()}</div></div></section>
        </main></div>
      </div>
      <details class="sdc-inspection" ${inspectionOpen ? 'open' : ''}><summary>Inspect source and drafts</summary><div class="sdc-inspection-data">${inspection()}</div></details>
      <div class="sdc-switcher" aria-label="Prototype variant switcher">${button('←', 'previous-variant', 'aria-label="Previous variant"')}<label>Compare <select aria-label="Refusal variant">${variants.map(v => `<option value="${v}" ${v === variant ? 'selected' : ''}>${names[v]}</option>`).join('')}</select></label>${button('→', 'next-variant', 'aria-label="Next variant"')}</div>
    </div>`;
    host.querySelectorAll<HTMLElement>('[data-icon]').forEach(n => n.prepend(icon(n.dataset.icon!)));
    host.querySelector<HTMLElement>('.sdc-editor')!.scrollTop = oldScroll;
    const strip = host.querySelector<HTMLElement>('.sdc-columns')!;
    const chosen = strip.querySelector<HTMLElement>('[aria-pressed=true]');
    if (chosen) {
      const c = chosen.getBoundingClientRect(), r = strip.getBoundingClientRect();
      if (c.right > r.right) strip.scrollLeft += c.right - r.right;
      if (c.left < r.left) strip.scrollLeft -= r.left - c.left;
    }
    host.querySelector<HTMLTextAreaElement>('textarea')!.oninput = event => {
      const field = event.target as HTMLTextAreaElement, start = field.selectionStart, end = field.selectionEnd;
      edit('text', field.value); render();
      const next = host.querySelector<HTMLTextAreaElement>('textarea')!; next.focus(); next.setSelectionRange(start, end);
    };
    const speaker = host.querySelector<HTMLSelectElement>('[aria-label="Speaker"]');
    if (speaker) speaker.onchange = () => { edit('speaker', speaker.value); render(); host.querySelector<HTMLSelectElement>('[aria-label="Speaker"]')!.focus(); };
    host.querySelector<HTMLSelectElement>('[aria-label="Refusal variant"]')!.onchange = event => switchVariant((event.target as HTMLSelectElement).value as Variant);
    host.querySelector<HTMLDetailsElement>('.sdc-inspection')!.ontoggle = event => { inspectionOpen = (event.target as HTMLDetailsElement).open; };
  }
  function reveal() {
    render();
    const target = host.querySelector<HTMLElement>('.sdc-conflict, [aria-invalid=true]');
    target?.focus();
  }
  function switchVariant(next: Variant) {
    variant = next;
    if (['file:', 'http:', 'https:'].includes(location.protocol) && !location.pathname.includes('preview.html')) {
      try { const url = new URL(location.href); url.searchParams.set('variant', next); history.replaceState(null, '', url); } catch { /* Inline viewer may disallow URL changes. */ }
    }
    render();
  }
  function cycle(direction: 1 | -1) { switchVariant(variants[(variants.indexOf(variant) + direction + variants.length) % variants.length]!); }

  function onClick(event: MouseEvent) {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!target || !host.contains(target)) return;
    if (target.dataset.select) { selected = target.dataset.select; sceneMenu = false; render(); return; }
    if (target.dataset.scene) {
      const s = scenes.find(x => x.id === target.dataset.scene)!;
      go(s, s.beats.find(textBeat)!); render(); return;
    }
    if (target.dataset.sceneJump) {
      const s = scenes.find(x => x.id === target.dataset.sceneJump)!;
      const first = failing().find(d => d.scene === s);
      if (first) go(s, first.beat);
      reveal(); return;
    }
    switch (target.dataset.action) {
      case 'reset': reset(false); render(); break;
      case 'jump': reset(true); reveal(); break;
      case 'save': save(); reveal(); break;
      case 'commit': commit(); reveal(); break;
      case 'discard': discard(); render(); break;
      case 'override': override(); render(); break;
      case 'next-failure': step(1); reveal(); break;
      case 'previous-failure': step(-1); reveal(); break;
      case 'scenes': sceneMenu = !sceneMenu; render(); break;
      case 'tracks': mode = 'tracks'; render(); break;
      case 'reel': mode = 'reel'; render(); break;
      case 'previous-variant': cycle(-1); break;
      case 'next-variant': cycle(1); break;
    }
  }
  function onKey(event: KeyboardEvent) {
    const input = event.target as HTMLElement;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') { event.preventDefault(); save(); reveal(); return; }
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && input.tagName === 'TEXTAREA') { event.preventDefault(); commit(); reveal(); return; }
    if (event.key === 'Escape' && sceneMenu) { sceneMenu = false; render(); return; }
    if (['ArrowLeft', 'ArrowRight'].includes(event.key) && !input.closest('input,textarea,select,[contenteditable]')) {
      event.preventDefault(); cycle(event.key === 'ArrowLeft' ? -1 : 1);
    }
  }
  reset(context.state !== 'pending');
  host.addEventListener('click', onClick); host.addEventListener('keydown', onKey);
  render();
  return () => { host.removeEventListener('click', onClick); host.removeEventListener('keydown', onKey); host.replaceChildren(); };
}
