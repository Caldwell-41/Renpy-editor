// Three header Undo/Redo placements. Throwaway, memory-only.
// All Undo controls (header, Story scene buttons, Cmd/Ctrl+Z) call one undo() here,
// standing in for the one shell Undo command (#143 decision 8).
import type { LabContext } from '../../contracts.ts';
import { icon } from '../../../src/icons.ts';
import './style.css';

export type Variant = 'icons' | 'grouped' | 'apart';
const variants: Variant[] = ['icons', 'grouped', 'apart'];
const names: Record<Variant, string> = { icons: '1 · Icons beside Save', grouped: '2 · Text with the save state', apart: '3 · Beside the brand' };

type Key = 'beat01' | 'beat05' | 'startWidth';
type Doc = Record<Key, string | number>;
type Workspace = 'story' | 'screens';
type Entry = { name: string; workspace: Workspace; item: string; key: Key; before: string | number; after: string | number };

const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const paths = { undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11', redo: 'm15 14 5-5-5-5m5 5H9.5a5.5 5.5 0 0 0 0 11H13' };
const mac = /Mac|iPhone|iPad/.test(navigator.platform);
const keys = { undo: mac ? '⌘Z' : 'Ctrl+Z', redo: mac ? '⇧⌘Z' : 'Ctrl+Y' };

const original = (): Doc => ({ beat01: 'Rainy platform', beat05: 'Hello', startWidth: 240 });
const edits = {
  background: (d: Doc): Entry => ({ name: 'background change in beat 01', workspace: 'story', item: '01', key: 'beat01', before: d.beat01, after: d.beat01 === 'Rainy platform' ? 'Station at dawn' : 'Rainy platform' }),
  dialogue: (d: Doc): Entry => ({ name: 'dialogue edit in beat 05', workspace: 'story', item: '05', key: 'beat05', before: d.beat05, after: d.beat05 === 'Hello' ? 'Stay here' : d.beat05 === 'Stay here' ? 'Stay here. The tram can wait.' : 'Hello' }),
  resize: (d: Doc): Entry => ({ name: 'button resize', workspace: 'screens', item: 'start', key: 'startWidth', before: d.startWidth, after: d.startWidth === 240 ? 280 : 240 }),
};

export function mountHeaderUndo(host: HTMLElement, context: LabContext, initial: Variant) {
  document.documentElement.dataset.theme = context.theme;
  let variant = initial;
  let doc: Doc, done: Entry[], undone: Entry[], workspace: Workspace, selected: string, status: string;

  function reset(state: string) {
    doc = original(); done = []; undone = []; workspace = 'story'; selected = '05'; status = 'Ready';
    if (state === 'empty') return;
    // The UI.md example: edit Story, resize a button in Screens, return to Story without editing.
    for (const make of [edits.background, edits.dialogue, edits.resize]) apply(make(doc));
    workspace = 'story'; selected = '05'; status = 'Ready';
    if (state === 'undone') undo();
  }
  function apply(entry: Entry) {
    doc[entry.key] = entry.after; done.push(entry); undone = [];
    workspace = entry.workspace; selected = entry.item; status = 'Ready';
  }
  function reveal(entry: Entry) { workspace = entry.workspace; selected = entry.item; }
  function undo() {
    const entry = done.pop(); if (!entry) return;
    doc[entry.key] = entry.before; undone.push(entry); reveal(entry); status = `Undone: ${entry.name}`;
  }
  function redo() {
    const entry = undone.pop(); if (!entry) return;
    doc[entry.key] = entry.after; done.push(entry); reveal(entry); status = `Redone: ${entry.name}`;
  }

  function svg(name: keyof typeof paths) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  // One control per command and place. `where` keeps focus on the same control after a re-render.
  function command(kind: 'undo' | 'redo', where: string, form: 'icon' | 'text' | 'both') {
    const entry = kind === 'undo' ? done.at(-1) : undone.at(-1);
    const word = kind === 'undo' ? 'Undo' : 'Redo';
    const label = entry ? `${word} ${entry.name}` : word;
    const tip = entry ? label : `Nothing to ${kind}`;
    const shortcut = kind === 'undo' ? 'Meta+Z Control+Z' : 'Meta+Shift+Z Control+Y';
    return `<span class="hu-cmd hu-cmd-${form}"><button type="button" class="hu-history" data-action="${kind}" data-where="${where}" aria-label="${escape(label)}" aria-disabled="${!entry}" aria-keyshortcuts="${shortcut}">${form === 'text' ? '' : svg(kind)}${form === 'icon' ? '' : `<span>${word}</span>`}</button><span class="hu-tip" aria-hidden="true">${escape(tip)}<kbd>${keys[kind]}</kbd></span></span>`;
  }
  const button = (label: string, action: string, extra = '') => `<button type="button" data-action="${action}" ${extra}>${label}</button>`;

  function header() {
    const brand = '<strong class="hu-brand" data-icon="story">Loomlight</strong>';
    const project = '<span class="hu-project">The Last Tram</span>';
    const saved = '<span class="hu-save-state">Saved</span>';
    const save = button('Save', 'save', 'class="hu-primary" data-where="header"');
    const runtime = `<div class="hu-runtime" role="toolbar" aria-label="Runtime controls">${button('Validate', 'validate')}${button('Run', 'run')}${button('Stop', 'stop', 'disabled')}</div>`;
    const history = (form: 'icon' | 'text' | 'both') => `<div class="hu-history-group" role="group" aria-label="Project history">${command('undo', 'header', form)}${command('redo', 'header', form)}</div>`;
    if (variant === 'icons') return `${brand}${project}<span class="hu-spacer"></span>${saved}${history('icon')}${save}${runtime}`;
    if (variant === 'grouped') return `${brand}${project}<span class="hu-cluster">${saved}${history('text')}</span><span class="hu-spacer"></span>${save}${runtime}`;
    return `${brand}${history('both')}${project}<span class="hu-spacer"></span>${saved}${save}${runtime}`;
  }

  function story() {
    const beats: [string, string, string][] = [
      ['01', 'Background', String(doc.beat01)], ['02', 'Music', 'Night service'], ['03', 'Character', 'Mara · Neutral'],
      ['04', 'Narration', 'The station is empty.'], ['05', 'Dialogue', `Mara: ${doc.beat05}`], ['06', 'Narration', 'The last tram is still waiting.'],
    ];
    return `<header class="hu-ws-head"><strong>The last service</strong><span class="hu-muted">Story · Chapter 1</span><span class="hu-spacer"></span><span class="hu-scene-history">${command('undo', 'story', 'text')}${command('redo', 'story', 'text')}</span></header>
      <ol class="hu-beats" aria-label="Beats">${beats.map(([id, kind, text]) => `<li><button type="button" data-select="${id}" aria-pressed="${selected === id}"><b>${id}</b><span>${kind}</span><span>${escape(text)}</span></button></li>`).join('')}</ol>`;
  }
  function screens() {
    const width = Number(doc.startWidth);
    return `<header class="hu-ws-head"><strong>Main menu</strong><span class="hu-muted">Screens</span></header>
      <div class="hu-screens"><div class="hu-canvas" aria-label="Main menu canvas"><span class="hu-canvas-title">The Last Tram</span>
        ${['start', 'load', 'settings'].map(id => `<button type="button" class="hu-canvas-button" data-select="${id}" aria-pressed="${selected === id}" style="width:${id === 'start' ? width / 2 : 120}px">${id[0]!.toUpperCase() + id.slice(1)}</button>`).join('')}</div>
        <dl class="hu-inspector"><dt>Selected</dt><dd>${selected === 'start' ? 'Start button' : selected === 'load' ? 'Load button' : 'Settings button'}</dd><dt>Width</dt><dd data-width>${selected === 'start' ? width : 240}</dd><dt>Height</dt><dd>64</dd></dl></div>`;
  }

  function render() {
    const active = document.activeElement as HTMLElement | null;
    const focus = active && host.contains(active) && active.dataset.action ? `[data-action="${active.dataset.action}"]${active.dataset.where ? `[data-where="${active.dataset.where}"]` : ''}` : null;
    host.innerHTML = `<div class="hu-shell" data-variant="${variant}">
      <section class="hu-scenario" aria-label="Prototype scenario controls"><strong>Header Undo study · unapproved</strong>
        <span class="hu-muted">Sample project. Edits stay in this preview.</span>
        <span class="hu-scenario-actions">Make an edit: ${button('Beat 01 background', 'edit-background')}${button('Beat 05 dialogue', 'edit-dialogue')}${button('Start button width', 'edit-resize')}${button('Reset', 'reset')}</span>
        <label class="hu-switcher">Compare <select aria-label="Header Undo variant">${variants.map(v => `<option value="${v}" ${v === variant ? 'selected' : ''}>${names[v]}</option>`).join('')}</select></label></section>
      <div class="hu-app">
        <header class="hu-header">${header()}</header>
        <div class="hu-body"><nav class="hu-rail" aria-label="Workspaces">${button('', 'story', `data-icon="story" aria-label="Story" aria-pressed="${workspace === 'story'}"`)}${button('', 'screens', `data-icon="assets" aria-label="Screens" aria-pressed="${workspace === 'screens'}"`)}<span data-icon="source"></span><span data-icon="branches"></span><span data-icon="characters"></span></nav>
          <main class="hu-main" data-workspace="${workspace}">${workspace === 'story' ? story() : screens()}</main></div>
        <footer class="hu-footer"><span class="hu-status" role="status" aria-live="polite">${escape(status)}</span><span class="hu-muted">Local project</span></footer>
      </div>
    </div>`;
    host.querySelectorAll<HTMLElement>('[data-icon]').forEach(n => n.prepend(icon(n.dataset.icon!)));
    if (focus) host.querySelector<HTMLElement>(focus)?.focus();
    host.querySelector<HTMLSelectElement>('[aria-label="Header Undo variant"]')!.onchange = event => switchVariant((event.target as HTMLSelectElement).value as Variant);
  }
  function switchVariant(next: Variant) {
    variant = next;
    if (['http:', 'https:'].includes(location.protocol) && !location.pathname.includes('preview.html')) {
      try { const url = new URL(location.href); url.searchParams.set('variant', next); history.replaceState(null, '', url); } catch { /* Inline viewer may disallow URL changes. */ }
    }
    render();
  }

  function onClick(event: MouseEvent) {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!target || !host.contains(target) || target.getAttribute('aria-disabled') === 'true') return;
    if (target.dataset.select) { selected = target.dataset.select; render(); return; }
    switch (target.dataset.action) {
      case 'undo': undo(); break;
      case 'redo': redo(); break;
      case 'edit-background': apply(edits.background(doc)); break;
      case 'edit-dialogue': apply(edits.dialogue(doc)); break;
      case 'edit-resize': apply(edits.resize(doc)); workspace = 'story'; selected = '05'; break;
      case 'reset': reset('ready'); break;
      case 'save': status = 'Saved.'; break;
      case 'validate': status = 'No problems found in this sample.'; break;
      case 'run': status = 'Run is not part of this preview.'; break;
      case 'story': workspace = 'story'; selected = '05'; break;
      case 'screens': workspace = 'screens'; selected = 'start'; break;
      default: return;
    }
    render();
  }
  function onKey(event: KeyboardEvent) {
    if (!(event.metaKey || event.ctrlKey) || (event.target as HTMLElement).closest('input,textarea,select')) return;
    const key = event.key.toLowerCase();
    if (key === 'z' || (key === 'y' && event.ctrlKey && !mac)) {
      event.preventDefault();
      if (key === 'y' || event.shiftKey) redo(); else undo();
      render();
    }
  }
  reset(context.state);
  host.addEventListener('click', onClick); document.addEventListener('keydown', onKey);
  render();
  return () => { host.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); host.replaceChildren(); };
}
