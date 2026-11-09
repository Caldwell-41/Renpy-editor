// Two conflict interactions in the Story Combined v1 layout. Throwaway, memory-only.
import type { LabContext } from '../../contracts.ts';
import { icon } from '../../../src/icons.ts';
import background from '../story-revamp/art/bg-rainy-platform.webp';
import mara from '../story-revamp/art/mara-neutral.webp';
import '../story-revamp/combined-revision.css';
import './style.css';

export type Variant = 'inline' | 'compact';
type BeatId = '05' | '07';
type Beat = { saved: string; draft: string | null; base: string };
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const names = { inline: 'A · Separate buttons', compact: 'B · Buttons together' };

export function mountConflict(host: HTMLElement, context: LabContext, initial: Variant) {
  document.documentElement.dataset.theme = 'dark';
  let variant = initial;
  let beats: Record<BeatId, Beat>;
  let selected: BeatId = '05';
  let mode = 'tracks';
  let arm = 'if';
  let saveBlocked = false;
  let message = '';
  let inspectionOpen = true;
  const conflicted = (id: BeatId) => beats[id].draft !== null && beats[id].base !== beats[id].saved;
  const pending = () => Object.values(beats).filter(b => b.draft !== null).length;
  const value = (id: BeatId) => beats[id].draft ?? beats[id].saved;
  function reset(conflict = false) {
    beats = { '05': { saved: 'Hello', draft: null, base: 'Hello' }, '07': { saved: 'The last tram is still waiting.', draft: null, base: 'The last tram is still waiting.' } };
    selected = '05'; mode = 'tracks'; arm = 'if'; saveBlocked = false; message = '';
    if (conflict) {
      beats['05'].draft = 'Stay here'; beats['05'].saved = 'Leave now';
      beats['07'].draft = "I'll wait by the door.";
    }
  }
  reset(context.state === 'conflict');
  function button(label: string, action: string, extra = '') { return `<button type="button" data-action="${action}" ${extra}>${label}</button>`; }
  function select(id: BeatId) { selected = id; render(); }
  function edit(text: string) {
    const beat = beats[selected];
    if (beat.draft === null) beat.base = beat.saved;
    beat.draft = text;
    // Matching the latest saved line needs no write or conflict choice.
    if (text === beat.saved) { beat.draft = null; beat.base = beat.saved; }
    message = ''; saveBlocked = false;
    render();
  }
  function save(one = false) {
    const ids: BeatId[] = one ? [selected] : ['05', '07'];
    const conflict = ids.find(conflicted);
    if (conflict) {
      selected = conflict; saveBlocked = true;
      message = one ? 'Choose which text to save before committing this beat.' : `Choose the text for beat ${conflict}. All drafts remain unsaved.`;
      render(); host.querySelector<HTMLElement>('.sdc-conflict')?.focus(); return;
    }
    const invalid = ids.find(id => beats[id].draft !== null && !beats[id].draft!.trim());
    if (invalid) { selected = invalid; message = `Enter text for beat ${invalid}. All drafts remain unsaved.`; render(); return; }
    for (const id of ids) {
      const beat = beats[id];
      if (beat.draft !== null) { beat.saved = beat.draft; beat.draft = null; beat.base = beat.saved; }
    }
    saveBlocked = false;
    message = one ? `Saved beat ${selected}.` : 'Saved all Story drafts.';
    render();
  }
  function keepSource() {
    const beat = beats[selected];
    beat.draft = null; beat.base = beat.saved; saveBlocked = false;
    message = 'Discarded your draft. The source is unchanged.';
    render();
  }
  function overrideSource() {
    const beat = beats[selected];
    if (beat.draft === null) return;
    if (!beat.draft.trim()) {
      message = 'Enter text before saving this beat.';
      render(); return;
    }
    // Explicit candidate action: accept only this beat, with no real source write.
    beat.saved = beat.draft; beat.draft = null; beat.base = beat.saved;
    saveBlocked = false;
    message = `Saved beat ${selected}. Other drafts are still unsaved.`;
    render();
  }
  function inspection() {
    return `<table><thead><tr><th>Beat</th><th>Source text</th><th>Remaining draft</th><th>Conflict</th></tr></thead><tbody>${(['05', '07'] as BeatId[]).map(id => `<tr><td>${id}</td><td data-saved="${id}">${escape(beats[id].saved)}</td><td data-draft="${id}">${beats[id].draft === null ? 'None' : escape(beats[id].draft!)}</td><td>${conflicted(id) ? 'Unresolved' : 'None'}</td></tr>`).join('')}</tbody></table>`;
  }
  function readout() {
    const count = pending();
    return `${count ? `${count} unsaved beat ${count === 1 ? 'draft' : 'drafts'}` : 'Saved'}${saveBlocked ? ` · Resolve beat ${(['05', '07'] as BeatId[]).find(conflicted) ?? selected}` : ''}`;
  }
  function editor() {
    const conflict = conflicted(selected), beat = beats[selected];
    const separate = variant === 'inline';
    return `<div class="sdc-editor-heading"><strong>${selected} · ${selected === '05' ? 'Dialogue' : 'Narration'}</strong></div>
      ${selected === '05' ? '<label class="sdc-speaker">Speaker<strong>Mara</strong></label>' : ''}
      ${conflict ? `<section class="sdc-conflict" tabindex="-1" aria-label="Conflict with source"><strong>Conflict with source</strong><p>The source changed after you started editing.</p><label>Source<output class="sdc-saved-line">${escape(beat.saved)}</output></label>${separate ? `<div class="sdc-source-action">${button('Keep source', 'keep-source')}<span>Discards your draft.</span></div>` : ''}</section>` : ''}
      <label class="sdc-field"><span>${conflict ? 'Your draft' : selected === '05' ? 'Dialogue' : 'Narration'}</span><textarea aria-label="Beat text">${escape(value(selected))}</textarea></label>
      ${conflict ? `<div class="sdc-resolution"><div class="sdc-row">${separate ? '' : button('Discard draft', 'keep-source')}${button('Override source', 'override-source', 'class="sdc-primary"')}</div><p>${separate ? 'Saves this beat only.' : 'Other drafts stay unsaved.'}</p></div>` : ''}
      ${!conflict && beat.draft !== null ? `<div class="sdc-row sdc-commit">${button('Commit', 'commit', 'class="sdc-primary"')}${button('Cancel', 'cancel')}</div>` : ''}
      <div class="sdc-message" role="status">${escape(message)}</div>
      <div class="sdc-effects"><strong>In effect at ${selected}</strong><span>Rainy platform</span><span>Mara · Neutral, Centre</span><span>Night service</span></div>`;
  }
  function columns() {
    const fixed: [string, string, string[]][] = [
      ['01', 'Background', ['Rainy platform', '', '', '', '']],
      ['02', 'Music', ['', '', '', 'Night service', '']],
      ['03', 'Character', ['', 'Mara · Neutral', '', '', '']],
      ['04', 'Narration', ['', '', 'The station is empty.', '', '']],
      ['05', 'Dialogue', ['', '', `Mara: ${value('05')}`, '', '']],
      ['06', 'Condition', ['', '', '', '', 'If has_ticket']],
      ['07', 'Narration', ['', '', value('07'), '', 'Continue']],
    ];
    return fixed.map(([id, title, cells]) => {
      const editable = id === '05' || id === '07';
      const draft = editable && beats[id as BeatId].draft !== null;
      const conflict = editable && conflicted(id as BeatId);
      const marker = conflict ? ' !' : draft ? ' •' : '';
      return `<button type="button" class="sdc-column ${id === '07' ? 'sdc-branch-column' : ''}" data-select="${id}" ${!editable ? 'disabled' : ''} aria-label="Beat ${id} ${title}${conflict ? ', conflict with source' : draft ? ', draft' : ''}" aria-pressed="${id === selected}" ${conflict ? 'title="Conflict with source"' : ''}><span class="sdc-beat-number">${id}<b data-marker="${id}">${marker}</b></span>${mode === 'tracks' ? cells.map(c => `<span>${escape(c)}</span>`).join('') : `<span class="sdc-reel-title">${title}</span><span class="sdc-reel-copy">${escape(cells.filter(Boolean).join(' · '))}</span>`}</button>`;
    }).join('');
  }
  function render() {
    const oldEditor = host.querySelector<HTMLElement>('.sdc-editor');
    const oldScroll = oldEditor?.dataset.beat === selected ? oldEditor.scrollTop : 0;
    host.innerHTML = `<div class="sdc-shell sc-combined-shell">
      <section class="sdc-prototype" aria-label="Prototype scenario controls"><div class="sdc-scenario-title"><strong>Conflict study · unapproved</strong><span>Sample text. Changes stay in this preview.</span>${button('Reset', 'reset')}</div><div class="sdc-scenario-actions">${button('1. Draft &quot;Stay here&quot;', 'draft')}${button('2. Source → &quot;Leave now&quot;', 'external')}${button(selected === '05' ? '3. Leave beat' : '3. Return to 05', 'navigate')}${button('Load conflict example', 'jump', 'class="sdc-text-button"')}<details class="sdc-more"><summary>More actions</summary>${button('Change an unrelated beat', 'unrelated')}${button('Draft beat 07', 'other-draft')}</details></div><p class="sdc-guide">Press Save to see how Story handles the conflict.</p></section>
      <div class="sdc-product">
        <header class="sdc-app-header"><strong class="sdc-brand" data-icon="story">Loomlight</strong><span>The Last Tram</span><span class="sdc-save-status" role="status">${readout()}</span>${button('Save', 'save', 'class="sdc-primary"')}</header>
        <div class="sdc-app-body"><nav class="sdc-nav" aria-label="Workspace context"><span data-icon="panelOpen"></span><span data-icon="story" class="sdc-nav-selected" title="Story"></span><span data-icon="source"></span><span data-icon="branches"></span><span data-icon="characters"></span><span data-icon="assets"></span></nav>
        <main class="sdc-main"><header class="sdc-scene"><strong>The last service</strong><span>${selected} · ${selected === '05' ? "Mara's line" : 'The platform'}</span></header>
        <div class="sdc-workspace"><section class="sdc-stage-area" aria-label="Game stage"><div class="sdc-stage-heading"><strong>Game window</strong><span>1920 × 1080</span></div><div class="sdc-stage-fit"><div class="sdc-stage"><img class="sdc-background" src="${background}" alt="A rainy tram platform at night"><div class="sdc-character"><img src="${mara}" alt="Mara"></div><div class="sdc-saybox"><strong>${selected === '05' ? 'Mara' : ''}</strong><p data-stage-text>${escape(value(selected).trim() ? value(selected) : beats[selected].saved)}</p></div></div></div></section><aside class="sdc-editor" data-beat="${selected}" aria-label="Selected beat editor">${editor()}</aside></div>
        <section class="sdc-branch-path" aria-label="Branch path"><strong>Branch path</strong><span>06</span><span>has_ticket is true</span><div class="sdc-branch-switch">${button('If', 'arm-if', `aria-pressed="${arm === 'if'}" disabled title="Branch context only"`)}${button('Otherwise', 'arm-else', `aria-pressed="${arm === 'else'}" disabled title="Branch context only"`)}</div></section>
        <section class="sdc-bottom" aria-label="Story beats"><div class="sdc-mode">${button('Tracks', 'tracks', `aria-pressed="${mode === 'tracks'}"`)}${button('Reel', 'reel', `aria-pressed="${mode === 'reel'}"`)}<span>• Draft &nbsp; ! Conflict with source</span></div><div class="sdc-timeline ${mode === 'reel' ? 'sdc-reel' : ''}">${mode === 'tracks' ? '<div class="sdc-lane-labels"><span>Beat</span><span>Background</span><span>Characters</span><span>Words</span><span>Sound</span><span>Flow / state</span></div>' : ''}<div class="sdc-columns">${columns()}</div></div></section>
        </main></div>
      </div>
      <details class="sdc-inspection" ${inspectionOpen ? 'open' : ''}><summary>Inspect source and drafts</summary><div class="sdc-inspection-data">${inspection()}</div></details>
      <div class="sdc-switcher" aria-label="Prototype variant switcher">${button('←', 'previous', 'aria-label="Previous variant"')}<label>Compare <select aria-label="Conflict variant"><option value="inline" ${variant === 'inline' ? 'selected' : ''}>${names.inline}</option><option value="compact" ${variant === 'compact' ? 'selected' : ''}>${names.compact}</option></select></label>${button('→', 'next', 'aria-label="Next variant"')}</div>
    </div>`;
    host.querySelectorAll<HTMLElement>('[data-icon]').forEach(n => n.prepend(icon(n.dataset.icon!)));
    host.querySelector<HTMLElement>('.sdc-editor')!.scrollTop = oldScroll;
    const strip = host.querySelector<HTMLElement>('.sdc-columns')!;
    const chosen = strip.querySelector<HTMLElement>('[aria-pressed=true]')!;
    const columnRect = chosen.getBoundingClientRect(), stripRect = strip.getBoundingClientRect();
    if (columnRect.right > stripRect.right) strip.scrollLeft += columnRect.right - stripRect.right;
    if (columnRect.left < stripRect.left) strip.scrollLeft -= stripRect.left - columnRect.left;
    host.querySelector<HTMLTextAreaElement>('textarea')!.oninput = event => {
      const field = event.target as HTMLTextAreaElement;
      const start = field.selectionStart, end = field.selectionEnd;
      edit(field.value);
      const next = host.querySelector<HTMLTextAreaElement>('textarea')!;
      next.focus(); next.setSelectionRange(start, end);
    };
    host.querySelector<HTMLSelectElement>('select')!.onchange = event => switchVariant((event.target as HTMLSelectElement).value as Variant);
    host.querySelector<HTMLDetailsElement>('.sdc-inspection')!.ontoggle = event => { inspectionOpen = (event.target as HTMLDetailsElement).open; };
  }
  function switchVariant(next: Variant) {
    variant = next;
    // Embedded HTML may have an opaque origin. Switching still works in memory.
    if (['file:', 'http:', 'https:'].includes(location.protocol) && !location.pathname.includes('preview.html')) {
      try { const url = new URL(location.href); url.searchParams.set('variant', next); history.replaceState(null, '', url); } catch { /* Inline viewer may disallow URL changes. */ }
    }
    render();
  }
  function onClick(event: MouseEvent) {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!target || !host.contains(target)) return;
    if (target.dataset.select) { select(target.dataset.select as BeatId); return; }
    switch (target.dataset.action) {
      case 'reset': reset(); render(); break;
      case 'jump': reset(true); render(); break;
      case 'draft': {
        selected = '05'; const b = beats['05']; if (b.draft === null) b.base = b.saved; b.draft = 'Stay here';
        message = ''; saveBlocked = false; render(); break;
      }
      case 'external': beats['05'].saved = 'Leave now'; message = ''; render(); break;
      case 'unrelated': beats['07'].saved = 'A tram bell rings in the distance.'; message = ''; render(); break;
      case 'other-draft': selected = '07'; beats['07'].base = beats['07'].saved; beats['07'].draft = "I'll wait by the door."; message = ''; render(); break;
      case 'navigate': select(selected === '05' ? '07' : '05'); break;
      case 'save': save(); break;
      case 'commit': save(true); break;
      case 'keep-source': keepSource(); break;
      case 'override-source': overrideSource(); break;
      case 'cancel': beats[selected].draft = null; message = ''; render(); break;
      case 'tracks': mode = 'tracks'; render(); break;
      case 'reel': mode = 'reel'; render(); break;
      case 'previous': case 'next': switchVariant(variant === 'inline' ? 'compact' : 'inline'); break;
    }
  }
  function onKey(event: KeyboardEvent) {
    const input = event.target as HTMLElement;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') { event.preventDefault(); save(); return; }
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && input.tagName === 'TEXTAREA') { event.preventDefault(); save(true); return; }
    if (['ArrowLeft', 'ArrowRight'].includes(event.key) && !input.closest('input,textarea,select,[contenteditable]')) {
      event.preventDefault(); switchVariant(variant === 'inline' ? 'compact' : 'inline');
    }
  }
  host.addEventListener('click', onClick); host.addEventListener('keydown', onKey);
  render();
  return () => { host.removeEventListener('click', onClick); host.removeEventListener('keydown', onKey); host.replaceChildren(); };
}
