import type { LabContext } from '../../contracts.ts';
import { action as makeAction, element as el, labelled, labPage } from '../../page.ts';
import { prototypeSwitcher } from '../../prototype-switcher.ts';
import { kinds, label, count, brief as modelBrief, locate, ancestry, flatten, beatNumber, beatName, columns, illustrate, makeSample, type Beat, type Branch, type Kind, type Scene, type Illustration } from './model.ts';
import platform from './platform.svg';
import mara from './mara.svg';
import maraConcerned from './mara-concerned.svg';
import eli from './eli.svg';
import eliConcerned from './eli-concerned.svg';
import './style.css';

export type Variant = 'cue-sheet' | 'shot-reel' | 'stage-tracks';
export const variants = [{ id: 'cue-sheet', title: 'Cue sheet' }, { id: 'shot-reel', title: 'Shot reel' }, { id: 'stage-tracks', title: 'Stage tracks' }] as const;

/** Disposable, fictional Story authoring study. No project, native or provider calls. */
export function mountStudy(host: HTMLElement, context: LabContext, variant: Variant, compare?: (variant: Variant) => void) {
  const sample = makeSample(context.state);
  let scenes = sample.scenes, sceneId = scenes[0]!.id;
  if (context.state === 'protected') scenes[0]!.beats.splice(5, 0, sample.beat('customCode', '$ tram_clock.advance()'));
  let selected = scenes[0]!.beats.find(b => b.kind === 'dialogue')?.id ?? scenes[0]!.beats[0]!.id;
  let focused = false, treeOpen = false, stageExpanded = false, manual = '', reelBranch = '', stageObject = '', hideSaybox = false, allTracks = false;
  const initialData = JSON.stringify(scenes);
  const hasChanges = () => JSON.stringify(scenes) !== initialData;
  const expanded = new Set<string>();
  const visibleBranches = new Map<string, string>();
  const sceneSelections = new Map<string, string>();
  let caller: { scene: string; selected: string; branch: string } | undefined;
  type Step = { data: string; name: string };
  const undo: Step[] = [], redo: Step[] = [];
  let changes = 0, elementId = 0, focusRequest = 0;
  let renderedSelection = '', renderedFocused = focused, chromeKey = '';
  const mod = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';
  const frame = labPage(host, context, { screen: 'story', title: 'Story', subtitle: '', dirty: hasChanges });
  frame.shell.classList.add('sr-shell'); frame.content.classList.add('sr-content'); frame.heading.hidden = true;
  frame.shell.querySelector<HTMLElement>('.lp-project-shell')!.dataset.navigationCollapsed = 'true';
  const scene = () => scenes.find(s => s.id === sceneId)!;
  const current = () => flatten(scene().beats).find(b => b.id === selected);
  const number = (id = selected) => beatNumber(scene(), id);
  const name = (id = selected) => beatName(scene(), id);
  const contextName = (id = selected) => { const trail = (ancestry(scene(), id) ?? []).map(p => `${p.branch.name} ${p.branch.condition}`.trim()).join(' › '); return `${name(id)}${trail ? ' in ' + trail : ''}`; };
  const brief = (b: Beat) => modelBrief(b, scenes);
  const snapshot = () => JSON.stringify({ scenes, sceneId, selected });
  let undoButton: HTMLButtonElement, redoButton: HTMLButtonElement;
  function action(text: string, fn: () => void, primary = false, key = text) {
    const button = makeAction(text, fn, primary); button.title = text; button.ariaLabel = text; button.dataset.action = key; return button;
  }
  function nameControl(node: HTMLElement, text: string) { node.textContent = text; node.ariaLabel = text; node.title = text; }
  function status(message: string) {
    frame.content.dataset.edits = hasChanges() ? String(changes || 1) : '0'; frame.status.textContent = message;
    if (undoButton) { undoButton.disabled = !undo.length; undoButton.ariaLabel = undoButton.title = undo.length ? `Undo: ${undo.at(-1)!.name}` : 'Nothing to undo'; }
    if (redoButton) { redoButton.disabled = !redo.length; redoButton.ariaLabel = redoButton.title = redo.length ? `Redo: ${redo.at(-1)!.name}` : 'Nothing to redo'; }
  }
  function remember(title: string, data = snapshot()) { undo.push({ data, name: title }); redo.length = 0; changes++; }
  function change(fn: () => void, title: string) {
    const before = snapshot(); fn();
    if (before === snapshot()) { status('No change'); return; }
    remember(title, before); draw(); status(title);
  }
  function history(from: Step[], to: Step[], verb: string) {
    const hadFocus = host.contains(document.activeElement);
    const previous = from.pop(); if (!previous) return;
    to.push({ data: snapshot(), name: previous.name });
    const data = JSON.parse(previous.data) as { scenes: Scene[]; sceneId: string; selected: string };
    scenes = data.scenes; sceneId = data.sceneId; selected = data.selected; stageObject = ''; manual = '';
    draw(); status(`${verb}: ${previous.name}`); if (hadFocus && document.activeElement === document.body) focusSelected();
  }
  function syncSelection() {
    if (caller && !scenes.some(s => s.id === caller!.scene)) caller = undefined;
    if (!current()) selected = scene().beats[0]?.id ?? '';
    if (manual && !flatten(scene().beats).some(b => b.branches.some(branch => branch.id === manual))) manual = '';
    if (reelBranch && !reelContext()) reelBranch = '';
    const parents = ancestry(scene(), selected) ?? [];
    for (const parent of parents) { expanded.add(parent.beat.id); visibleBranches.set(parent.beat.id, parent.branch.id); }
    const explicit = reelContext();
    if (explicit?.owner.id === selected && explicit.branch.beats.length === 0) reelBranch = explicit.branch.id;
    else if (parents.length) reelBranch = parents.at(-1)!.branch.id;
    else reelBranch = '';
  }
  function pathFor(id = selected) {
    const choices = new Map(visibleBranches);
    for (const parent of ancestry(scene(), id) ?? []) choices.set(parent.beat.id, parent.branch.id);
    const route = columns(scene(), choices); return { route, index: route.findIndex(c => c.beat.id === id) };
  }
  function stateAt(id = selected): Illustration { const { route, index } = pathFor(id); return illustrate(route, index); }
  function nextSpeaker(id = selected) { const { route, index } = pathFor(id); return route.slice(0, index + 1).reverse().find(c => c.beat.kind === 'dialogue')?.beat.speaker ?? 'Mara'; }
  function previewLine() {
    if (!manual) return stateAt().line;
    const branch = flatten(scene().beats).flatMap(b => b.branches).find(b => b.id === manual);
    return branch && flatten(branch.beats).find(b => ['dialogue', 'narration'].includes(b.kind));
  }
  function previewState() { const line = previewLine(); const owner = manual && flatten(scene().beats).find(b => b.branches.some(branch => branch.id === manual)); return stateAt(manual ? line?.id ?? (owner ? owner.id : selected) : selected); }
  function reelContext() {
    const owner = flatten(scene().beats).find(b => b.branches.some(branch => branch.id === reelBranch));
    const branch = owner?.branches.find(b => b.id === reelBranch);
    return owner && branch ? { owner, branch, trail: [...locate(scene(), owner.id)!.trail, `${branch.name} ${branch.condition}`.trim()] } : undefined;
  }
  function ending(body: Beat[]) { return body.findIndex(b => ['choice', 'jump', 'return'].includes(b.kind)); }
  function defaultIndex(body = scene().beats) { const end = ending(body); return end < 0 ? body.length : end; }
  function target() {
    const position = locate(scene(), selected), branch = variant !== 'cue-sheet' ? reelContext() : undefined;
    return branch && position?.body !== branch.branch.beats ? { body: branch.branch.beats, trail: branch.trail, index: defaultIndex(branch.branch.beats) } : { body: position?.body ?? scene().beats, trail: position?.trail ?? [scene().name], index: Math.min(position ? position.index + 1 : defaultIndex(), defaultIndex(position?.body)) };
  }
  function targetText(body: Beat[], trail: string[], requested: number) {
    const index = Math.min(requested, defaultIndex(body));
    const anchor = body[index], previous = body[index - 1];
    return `Adds to ${trail.join(' › ')}${anchor ? `, before ${name(anchor.id)}` : previous ? `, after ${name(previous.id)}` : ', as its first beat'}`;
  }
  type Bookmark = { owner?: string; action?: string; label?: string; choice?: number; start?: number | null; end?: number | null };
  function bookmark(node = document.activeElement): Bookmark | undefined {
    if (!(node instanceof HTMLElement) || !host.contains(node)) return;
    const owner = node.closest<HTMLElement>('[data-beat],[data-editor-for],[data-reel-beat],[data-track-beat]');
    const option = node.closest<HTMLElement>('[data-choice-index]');
    return { owner: owner?.dataset.beat ?? owner?.dataset.editorFor ?? owner?.dataset.reelBeat ?? owner?.dataset.trackBeat, action: node.dataset.action, label: node.getAttribute('aria-label') ?? undefined, choice: option ? Number(option.dataset.choiceIndex) : undefined, start: node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement ? node.selectionStart : undefined, end: node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement ? node.selectionEnd : undefined };
  }
  function restore(mark?: Bookmark) {
    if (!mark) return;
    const owner = mark.owner ? host.querySelector<HTMLElement>(`[data-beat="${mark.owner}"],[data-editor-for="${mark.owner}"],[data-reel-beat="${mark.owner}"],[data-track-beat="${mark.owner}"]`) : undefined;
    const root = owner || host;
    const query = mark.action ? `[data-action="${CSS.escape(mark.action)}"]` : mark.label ? `[aria-label="${CSS.escape(mark.label)}"]` : '';
    let node = query ? root.querySelector<HTMLElement>(query) : undefined;
    const usable = (item?: HTMLElement | null) => item?.getClientRects().length && !item.matches(':disabled');
    if (!usable(node)) node = undefined;
    if (!node && mark.choice != null) { const options = [...root.querySelectorAll<HTMLElement>('[data-choice-index]')]; node = options[Math.min(mark.choice, options.length - 1)]?.querySelector<HTMLElement>('input'); }
    if (!node && ['undo', 'redo'].includes(mark.action ?? '')) node = host.querySelector<HTMLElement>(`[data-action="${mark.action === 'undo' ? 'redo' : 'undo'}"]:not(:disabled)`) ?? host.querySelector<HTMLElement>('[data-action="add-beat"]') ?? undefined;
    if (!node && owner instanceof HTMLButtonElement) node = owner;
    if (!usable(node)) node = owner?.querySelector<HTMLElement>('input:not(:disabled),textarea:not(:disabled),select:not(:disabled),.sr-number,summary,button:not(:disabled)') ?? undefined;
    if (!node && query && !mark.owner) node = host.querySelector<HTMLElement>(query) ?? undefined;
    if (usable(node)) { node!.focus({ preventScroll: true }); if ((node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement) && mark.start != null && mark.end != null && ['textarea', 'input'].includes(node.tagName.toLowerCase())) { try { node.setSelectionRange(mark.start, mark.end); } catch { /* Non-text input. */ } } }
  }
  function activateBeat(id: string) {
    if (selected === id) return;
    selected = id; stageObject = ''; renderedSelection = id;
    for (const row of host.querySelectorAll<HTMLElement>('[data-beat]')) row.dataset.selected = String(row.dataset.beat === id);
    if (variant === 'cue-sheet') host.querySelector('.sr-cue-stage>.sr-inspector')?.replaceWith(inspector(true));
    if (variant === 'cue-sheet') reconcileCueRows();
    refresh(); for (const text of host.querySelectorAll<HTMLTextAreaElement>('.sr-prose')) fit(text);
  }
  function bind(control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, update: (value: string) => void) {
    let before = snapshot(), recorded = false;
    control.onfocus = () => {
      const owner = control.closest<HTMLElement>('[data-editor-for],[data-beat]'); const id = owner?.dataset.editorFor ?? owner?.dataset.beat;
      if (id) activateBeat(id);
      before = snapshot(); recorded = false;
    };
    control.addEventListener('keydown', eventValue => {
      const event = eventValue as KeyboardEvent; if (event.isComposing) return;
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key === 'Enter') { event.preventDefault(); before = snapshot(); recorded = false; status(`Kept ${name()}`); }
      if (event.key === 'Escape' && !host.querySelector('dialog[open]')) { event.preventDefault(); selectBeat(selected, true); }
    });
    control.addEventListener('input', () => {
      if (!recorded) { remember(`Edit ${name()}`, before); recorded = true; }
      update(control.value); status(`Edited ${name()}`); refresh();
      if (control instanceof HTMLTextAreaElement) fit(control);
    });
  }
  function input(value: string, title: string, update: (value: string) => void) { const control = el('input'); control.value = value; control.ariaLabel = title; bind(control, update); return control; }
  function select(values: readonly string[], value: string, title: string, update: (value: string) => void) {
    const control = el('select'); control.ariaLabel = title;
    for (const v of [...new Set([value, ...values])]) control.append(new Option(v, v));
    control.value = value; bind(control, update); return control;
  }
  function fit(area: HTMLTextAreaElement) { const row = area.closest<HTMLElement>('[data-beat]'); const active = !row || row.dataset.selected === 'true'; area.style.height = 'auto'; area.style.height = `${Math.max(active ? 52 : 24, area.scrollHeight)}px`; }
  function prose(b: Beat) {
    const text = el('textarea', 'sr-prose'); text.value = b.text; text.rows = 1;
    text.placeholder = b.kind === 'dialogue' ? `Type ${b.speaker}'s line` : 'Type narration'; text.ariaLabel = `${label(b.kind)} text`; text.dataset.beatText = b.id;
    bind(text, value => b.text = value);
    text.addEventListener('keydown', event => {
      if (event.isComposing) return;
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'Enter') { event.preventDefault(); const owner = locate(scene(), b.id)!; insert('dialogue', owner.body, owner.trail, owner.index + 1, nextSpeaker(b.id)); }
      else if (event.key === '/' && !text.value) { event.preventDefault(); const owner = locate(scene(), b.id)!; picker(owner.body, owner.trail, owner.index, b); }
    }); return text;
  }
  function lineSpeaker(b: Beat, title = 'Speaker') {
    const field = el('select'); field.ariaLabel = title; field.dataset.action = 'line-speaker';
    for (const speaker of ['Mara', 'Eli', 'Narration (no speaker)']) field.append(new Option(speaker, speaker));
    field.value = b.kind === 'narration' ? 'Narration (no speaker)' : b.speaker;
    if (variant === 'cue-sheet' && title !== 'Speaker') field.style.width = `${field.value.length + 3}ch`;
    field.onfocus = () => activateBeat(b.id);
    field.onchange = () => change(() => { b.kind = field.value === 'Narration (no speaker)' ? 'narration' : 'dialogue'; if (b.kind === 'dialogue') b.speaker = field.value; }, `Change ${name(b.id)} to ${field.value}`); return field;
  }
  function closeMenus() { for (const menu of host.querySelectorAll<HTMLDetailsElement>('.sr-more[open],.sr-row-menu[open]')) menu.open = false; }
  function modal(title: string, key: string, confirmation = false) {
    const active = document.activeElement as HTMLElement | null;
    const invoker = active?.closest('details')?.querySelector('summary') ?? active;
    const previous = bookmark(invoker), focusAtOpen = focusRequest; closeMenus();
    const dialog = el('dialog', 'lp-dialog sr-dialog'); dialog.ariaLabel = title; dialog.dataset.modal = key;
    const head = el('header', 'sr-dialog-head'); const heading = el('h2', '', title); head.append(heading);
    if (!confirmation) head.append(action('Close', () => dialog.close(), false, 'close-dialog'));
    dialog.append(head); dialog.onclose = () => { dialog.remove(); if (focusRequest !== focusAtOpen) return; restore(previous); if (document.activeElement === document.body) focusSelected(); };
    frame.shell.append(dialog); dialog.showModal(); return dialog;
  }
  function actions(dialog: HTMLDialogElement, buttons: HTMLButtonElement[]) { const footer = el('footer', 'sr-dialog-actions'); footer.append(...buttons); dialog.append(footer); }
  function danger(button: HTMLButtonElement) { button.classList.add('danger'); return button; }
  function nameForm(dialog: HTMLDialogElement, value: string, commit: (value: string) => void, primary: string, extra?: HTMLElement) {
    const form = el('form', 'sr-name-form'); const field = el('input'); field.value = value; field.ariaLabel = 'Scene name'; field.placeholder = 'For example: Platform at dawn';
    const error = el('p', 'sr-field-error'); error.id = `sr-error-${++elementId}`; error.role = 'alert'; error.hidden = true; field.setAttribute('aria-describedby', error.id);
    field.oninput = () => { error.hidden = true; field.removeAttribute('aria-invalid'); };
    form.append(labelled('Scene name', field), error); if (extra) form.append(extra);
    const submit = action(primary, () => form.requestSubmit(), true, 'submit-scene');
    form.onsubmit = event => { event.preventDefault(); if (!field.value.trim()) { error.textContent = 'Enter a scene name.'; error.hidden = false; field.setAttribute('aria-invalid', 'true'); field.focus(); return; } commit(field.value.trim()); };
    dialog.append(form); actions(dialog, [action('Cancel', () => dialog.close(), false, 'cancel-dialog'), submit]); field.focus(); if (value) field.select();
  }
  function go(id: string, fromLink = false) {
    sceneSelections.set(sceneId, selected);
    if (fromLink) caller = { scene: sceneId, selected, branch: reelBranch };
    sceneId = id; treeOpen = false; manual = ''; stageObject = ''; reelBranch = '';
    selected = sceneSelections.get(id) ?? scene().beats.find(b => ['dialogue', 'narration'].includes(b.kind))?.id ?? scene().beats[0]!.id;
    draw(); status(`Opened ${scene().name}`); focusSelected();
  }
  function createScene(done?: (newScene: Scene) => void, choiceIndex?: number, choiceText?: string) {
    const title = done ? `New scene for option ${(choiceIndex ?? 0) + 1}` : 'New scene'; const dialog = modal(title, 'new-scene');
    const chapter = el('select'); chapter.ariaLabel = 'Chapter'; for (const title of new Set(scenes.map(s => s.chapter))) chapter.append(new Option(title, title)); chapter.value = scene().chapter;
    const extra = labelled('Chapter', chapter);
    const replaces = done ? scenes.find(s => s.id === current()?.options[choiceIndex ?? 0]?.target)?.name : undefined;
    dialog.append(el('p', 'sr-dialog-context', done ? `Option ${(choiceIndex ?? 0) + 1} "${choiceText ?? ''}" will lead here.${replaces ? ' Replaces ' + replaces + '.' : ''} You stay in this scene.` : 'Opens with an empty narration line.'));
    nameForm(dialog, '', value => {
      if (!done) { sceneSelections.set(sceneId, selected); caller = undefined; }
      const next: Scene = { id: sample.newId(), name: value, chapter: chapter.value, beats: [sample.beat('narration'), sample.beat('return')] };
      change(() => { scenes.push(next); treeOpen = false; if (done) done(next); else { sceneId = next.id; selected = next.beats[0]!.id; reelBranch = ''; manual = ''; } }, `Create scene ${value}`);
      dialog.close(); focusText();
    }, done ? `Create scene and link option ${(choiceIndex ?? 0) + 1}` : 'Create and open scene', extra);
  }
  function renameScene() {
    const dialog = modal('Rename scene', 'rename-scene'); nameForm(dialog, scene().name, value => { change(() => scene().name = value, `Rename scene to ${value}`); dialog.close(); }, 'Rename scene');
  }
  function insert(kind: Kind, body: Beat[], trail: string[], requested: number, speaker = 'Mara', replaceEmpty?: Beat, initial?: Partial<Beat>) {
    const before = Math.min(requested, defaultIndex(body)); const oldEnding = ['choice', 'jump', 'return'].includes(kind) && ending(body) >= 0 ? body[ending(body)] : undefined;
    const where = oldEnding ? `Replace ${name(oldEnding.id)}${oldEnding.kind === 'choice' ? ` and its ${count(oldEnding.options.length, 'option')}` : ''} with ${label(kind)}` : `${label(kind)} ${targetText(body, trail, before).replace('Adds to ', 'added to ')}`;
    const b = sample.beat(kind); b.speaker = speaker === 'Narration (no speaker)' ? 'Mara' : speaker; Object.assign(b, initial);
    if (kind === 'condition') b.branches = [{ id: sample.newId(), name: 'If', condition: 'has_ticket is true', beats: [] }, { id: sample.newId(), name: 'Otherwise', condition: '', beats: [] }];
    change(() => {
      if (replaceEmpty && body[before] === replaceEmpty && !replaceEmpty.text.trim()) body.splice(before, 1);
      if (oldEnding) body.splice(ending(body), 1, b); else body.splice(Math.min(before, defaultIndex(body)), 0, b);
      selected = b.id; stageObject = ''; manual = '';
      if (kind === 'condition') expanded.add(b.id);
    }, kind === 'background' ? `${where} · Characters shown earlier are cleared.` : where); focusText();
  }
  function picker(body = scene().beats, trail = [scene().name], requested = defaultIndex(body), replaceEmpty?: Beat) {
    const index = Math.min(requested, defaultIndex(body)); const dialog = modal('Add a beat', 'beat-picker'); dialog.classList.add('sr-picker-dialog');
    dialog.append(el('p', 'sr-insertion-target', replaceEmpty ? `Replaces empty line ${number(replaceEmpty.id)} in ${trail.join(' › ')}` : targetText(body, trail, index)));
    const query = el('input'); query.type = 'search'; query.placeholder = 'Find dialogue, background, music, choices…'; query.ariaLabel = 'Find a beat'; query.dataset.pickerSearch = '';
    const results = el('div', 'sr-picker-results'); results.id = `sr-results-${++elementId}`; results.role = 'listbox'; results.ariaLabel = 'Matching beat types'; query.role = 'combobox'; query.setAttribute('aria-autocomplete', 'list'); query.setAttribute('aria-expanded', 'true'); query.setAttribute('aria-controls', results.id); let active = 0;
    function highlight() { const buttons = [...results.querySelectorAll<HTMLButtonElement>('button[data-insert-kind]')]; buttons.forEach((button, i) => { button.dataset.highlighted = String(i === active); button.ariaSelected = String(i === active); }); if (buttons[active]) query.setAttribute('aria-activedescendant', buttons[active]!.id); else query.removeAttribute('aria-activedescendant'); }
    function filter() {
      results.replaceChildren(); active = 0;
      const search = query.value.toLowerCase().trim();
      const aliases: Partial<Record<Kind, string>> = { condition: 'if else branch test', placement: 'placement move position', call: 'shared conversation returns', choice: 'menu options decision', setVariable: 'flag counter value', showScreen: 'panel', callScreen: 'dialog' };
      const matched = kinds.filter(([kind, title, category]) => `${kind} ${title} ${category} ${aliases[kind] ?? ''}`.toLowerCase().includes(search));
      for (const category of new Set(matched.map(k => k[2]))) {
        const section = el('section'); section.role = 'group'; section.ariaLabel = category === 'Flow' ? 'Choices and logic' : category; section.append(el('h3', '', section.ariaLabel));
        for (const [kind, title] of matched.filter(k => k[2] === category)) {
          const button = action(title, () => { dialog.close(); insert(kind, body, trail, index, current()?.speaker, replaceEmpty); }, false, `insert-${kind}`); button.dataset.insertKind = kind; button.role = 'option'; button.tabIndex = -1; button.id = `sr-result-${++elementId}`; if (kind === 'background') { const note = el('small', '', 'Clears characters shown earlier.'); note.id = `sr-warning-${++elementId}`; button.setAttribute('aria-describedby', note.id); button.title = 'Add a background. Characters shown earlier are cleared.'; button.append(note); }
          const end = ending(body) >= 0 ? body[ending(body)]! : undefined;
          if (end && ['choice', 'jump', 'return'].includes(kind)) { const warning = el('small', '', `Replaces ${name(end.id)}${end.kind === 'choice' ? ` and its ${count(end.options.length, 'option')}` : ''}. Undo restores it.`); warning.id = `sr-warning-${++elementId}`; button.setAttribute('aria-describedby', warning.id); button.append(warning); }
          section.append(button);
        } results.append(section);
      }
      results.role = matched.length ? 'listbox' : 'region';
      if (!matched.length) { const empty = el('div', 'sr-picker-empty'); empty.append(el('p', '', 'No matching beat.'), action('Clear search', () => { query.value = ''; filter(); query.focus(); })); results.append(empty); }
      highlight();
    }
    query.oninput = filter;
    query.onkeydown = event => { if (event.isComposing) return; const items = [...results.querySelectorAll<HTMLButtonElement>('button[data-insert-kind]')]; if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); active = Math.max(0, Math.min(items.length - 1, active + (event.key === 'ArrowDown' ? 1 : -1))); highlight(); items[active]?.scrollIntoView({ block: 'nearest' }); } if (event.key === 'Enter') { event.preventDefault(); items[active]?.click(); } };
    filter(); dialog.append(labelled('Beat type', query), results, el('p', 'sr-picker-hint', '↑ ↓ choose a type · Enter adds it · Escape cancels')); query.focus();
  }
  function gap(body: Beat[], trail: string[], index: number) {
    const clamped = Math.min(index, defaultIndex(body)); const button = action('+', () => picker(body, trail, clamped), false, `insert-gap-${trail.join('/')}-${clamped}`); button.className = 'sr-gap'; button.ariaLabel = targetText(body, trail, clamped); button.title = button.ariaLabel; button.tabIndex = variant === 'cue-sheet' && body[index - 1]?.id === selected ? 0 : -1; return button;
  }
  function moveTo(b: Beat) {
    const owner = locate(scene(), b.id)!; const dialog = modal(`Move ${name(b.id)}`, 'move-beat');
    const choices: { body: Beat[]; trail: string[] }[] = [];
    if (owner.body !== scene().beats) choices.push({ body: scene().beats, trail: [scene().name] });
    function visit(body: Beat[], trail: string[]) { for (const parent of body) if (parent !== b) for (const branch of parent.branches) { const path = [...trail, `${branch.name} ${branch.condition}`.trim()]; if (branch.beats !== owner.body) choices.push({ body: branch.beats, trail: path }); visit(branch.beats, path); } }
    visit(scene().beats, [scene().name]); const destination = el('select'); destination.ariaLabel = 'Move to'; choices.forEach((c, i) => destination.append(new Option(c.trail.join(' › '), String(i))));
    dialog.append(el('blockquote', '', brief(b)), el('p', '', `It goes last, before any Choice, Jump or Return.${b.kind === 'condition' ? ' Its branches move with it.' : ''}`), labelled('Move to', destination));
    const move = action(`Move ${name(b.id)}`, () => { const to = choices[Number(destination.value)]!; change(() => { owner.body.splice(owner.index, 1); to.body.splice(defaultIndex(to.body), 0, b); selected = b.id; reelBranch = ''; }, `Move ${name(b.id)} to ${to.trail.join(' › ')}`); dialog.close(); selectBeat(b.id, true); }, true, 'confirm-move');
    move.disabled = !choices.length; if (!choices.length) dialog.append(el('p', '', 'There is no other branch in this scene. Use Move earlier or Move later instead.'));
    actions(dialog, [action('Cancel', () => dialog.close(), false, 'cancel-dialog'), move]); destination.focus();
  }
  function removeBeat(b: Beat) {
    const owner = locate(scene(), b.id)!; const parents = ancestry(scene(), b.id) ?? []; const title = name(b.id);
    const remove = () => { change(() => { owner.body.splice(owner.index, 1); selected = owner.body[Math.max(0, owner.index - 1)]?.id ?? parents.at(-1)?.beat.id ?? scene().beats[0]?.id ?? ''; stageObject = ''; }, `Delete ${title}`); focusSelected(); };
    if (b.kind !== 'condition') { remove(); return; }
    const total = flatten(b.branches.flatMap(branch => branch.beats)).length;
    const dialog = modal(`Delete condition ${number(b.id)} and ${count(total, 'beat')}?`, 'delete-condition', true);
    dialog.append(el('p', '', `Deletes ${b.branches.map(branch => `${branch.name} ${branch.condition}`.trim()).join(', ')} and the ${count(total, 'beat')} inside them. Undo restores them.`));
    const cancel = action('Cancel', () => dialog.close(), false, 'cancel-dialog'); actions(dialog, [cancel, danger(action(`Delete condition and ${count(total, 'beat')}`, () => { remove(); dialog.close(); }, false, 'confirm-delete'))]); cancel.focus();
  }
  function rowMenu(b: Beat) {
    const menu = el('details', 'sr-row-menu'); menu.dataset.owner = b.id; const summary = el('summary', '', '⋯'); summary.ariaLabel = `Actions for ${name(b.id)}`; summary.title = summary.ariaLabel; summary.dataset.action = 'beat-menu'; menu.append(summary);
    const controls = el('div', 'sr-row-popover'); const owner = locate(scene(), b.id)!; const locked = ['choice', 'jump', 'return', 'customCode'].includes(b.kind);
    for (const [delta, title] of [[-1, 'Move earlier'], [1, 'Move later']] as const) { const neighbour = owner.body[owner.index + delta]; const button = action(title, () => { change(() => { owner.body.splice(owner.index, 1); owner.body.splice(owner.index + delta, 0, b); selected = b.id; }, `${title}: ${name(b.id)}`); focusSelected(); }, false, `move-${delta}`); button.disabled = locked || !neighbour || ['choice', 'jump', 'return', 'customCode'].includes(neighbour.kind); if (button.disabled) button.title = locked ? 'This beat stays at its source position.' : !neighbour ? 'There is no beat in that direction.' : 'Cannot move past a scene ending or protected source.'; controls.append(button); }
    const move = action('Move to another branch…', () => moveTo(b)); move.disabled = locked; if (locked) move.title = 'This beat stays at its source position.';
    const remove = action(`Delete ${name(b.id)}`, () => removeBeat(b)); remove.disabled = locked; if (locked) remove.title = b.kind === 'customCode' ? 'Protected source is read-only in this mock.' : 'Replace this ending through Add a beat.';
    controls.append(move, remove, action('View source', () => source(b)));
    if (b.kind === 'condition') controls.append(action('Add Else if', () => addElseIf(b)));
    menu.append(controls);
    const place = () => { if (!menu.open) { delete menu.dataset.placed; return; } const r = summary.getBoundingClientRect(), box = controls.getBoundingClientRect(); controls.style.left = `${Math.max(8, Math.min(innerWidth - box.width - 8, r.right - box.width))}px`; controls.style.top = `${Math.max(8, Math.min(innerHeight - box.height - 8, r.bottom + 4))}px`; menu.dataset.placed = 'true'; };
    summary.onclick = event => { event.preventDefault(); const open = !menu.open; closeMenus(); menu.open = open; place(); };
    menu.ontoggle = place; return menu;
  }
  function destination(value: string, title: string, update: (value: string) => void) { const control = el('select'); control.ariaLabel = title; for (const s of scenes) control.append(new Option(s.name, s.id)); control.value = value; bind(control, update); return control; }
  function fields(b: Beat) {
    const form = el('div', 'sr-fields'); form.dataset.editorFor = b.id;
    if (b.kind === 'dialogue' || b.kind === 'narration') {
      form.append(labelled('Speaker', lineSpeaker(b)), prose(b));
    } else if (b.kind === 'choice') {
      b.options.forEach((option, i) => {
        const row = el('fieldset', 'sr-option'); row.dataset.choiceIndex = String(i); row.append(el('legend', '', `Option ${i + 1}`));
        row.append(labelled('Option text', input(option.text, `Option ${i + 1} text`, value => option.text = value)), labelled('Goes to', destination(option.target, `Option ${i + 1} destination`, value => option.target = value)), labelled('Available when (optional)', input(option.guard, `Option ${i + 1} availability`, value => option.guard = value)));
        const buttons = el('div', 'sr-option-actions');
        buttons.append(action(`Open ${scenes.find(s => s.id === option.target)?.name ?? 'destination'}`, () => go(option.target, true), false, `open-choice-${i}`), action(`New scene for option ${i + 1}…`, () => createScene(s => option.target = s.id, i, option.text), false, `new-choice-${i}`));
        const remove = action(`Remove option ${i + 1}`, () => { change(() => b.options.splice(i, 1), `Remove option ${i + 1} from ${name(b.id)}`); focusField(`[data-editor-for="${b.id}"] input[aria-label="Option ${Math.min(i, b.options.length - 1) + 1} text"]`); }, false, `remove-choice-${i}`); remove.disabled = b.options.length === 1; if (remove.disabled) remove.title = 'A choice menu needs at least one option.'; buttons.append(remove); row.append(buttons); form.append(row);
      });
      form.append(action('+ Add option', () => change(() => b.options.push({ text: '', target: scenes.find(s => s.id !== sceneId)?.id ?? sceneId, guard: '' }), `Add option to ${name(b.id)}`)), el('p', 'sr-explanation', 'Leave availability empty for an unconditional choice. Conditions are not evaluated here. If no choices are available, the game continues to the next beat.'));
    } else if (b.kind === 'condition') {
      form.append(el('p', 'sr-explanation', 'The first branch whose test is true runs. This illustration does not evaluate tests.'));
      for (const branch of b.branches) { const row = el('div', 'sr-branch-control'); row.dataset.branch = branch.id; if (branch.name !== 'Otherwise') row.append(labelled(`${branch.name} test`, input(branch.condition, `${name(b.id)} ${branch.name} condition`, value => branch.condition = value))); else row.append(el('strong', '', branch.name)); row.append(action(`${variant === 'stage-tracks' ? 'Show in tracks' : 'Open branch'}: ${branch.name}`, () => openBranch(b, branch), false, `open-branch-${branch.id}`)); if (branch.name.toLowerCase() === 'else if') row.append(action('Remove this Else if', () => removeBranch(b, branch))); form.append(row); }
    form.append(action('+ Add Else if', () => addElseIf(b)));
    } else if (b.kind === 'call' || b.kind === 'jump') {
      form.append(labelled('Destination scene', destination(b.target, 'Destination scene', value => b.target = value)), el('p', 'sr-explanation', b.kind === 'call' ? 'Returns to the next beat after the destination scene finishes.' : 'Leaves this scene and does not return.'), action(`Open ${scenes.find(s => s.id === b.target)?.name ?? 'destination'}`, () => go(b.target, true), false, 'open-destination'));
    } else if (b.kind === 'return') form.append(el('p', 'sr-explanation', 'Returns to the calling scene, or ends the story. Use Add a beat to replace this ending.'));
    else if (b.kind === 'customCode') form.append(el('p', 'sr-explanation', 'Protected source is read-only. Its effects cannot be illustrated.'), el('pre', 'sr-code', b.text), action('View source', () => source(b)));
    else if (b.kind.endsWith('Screen')) form.append(labelled('Screen', select(['Help', 'Inventory'], b.asset === 'Neutral' ? 'Help' : b.asset, 'Screen', value => b.asset = value)), el('p', 'sr-explanation', b.kind === 'callScreen' ? 'Opens a dialog and waits for it to finish before the next beat.' : b.kind === 'showScreen' ? 'Shows a panel while the story continues.' : 'Hides the panel while the story continues.'));
    else if (b.kind === 'setVariable') form.append(labelled('Variable', select(['has_ticket', 'trust'], b.text || 'has_ticket', 'Variable', value => b.text = value)), labelled('Value', input(b.value, 'Variable value', value => b.value = value)), el('p', 'sr-explanation', 'Writes a value in the story. Values and conditions are not evaluated in this mock.'));
    else {
      if (b.kind === 'background') form.append(labelled('Background', select(['Rainy platform', 'Station at dawn'], b.asset, 'Background', value => b.asset = value)));
      if (['showCharacter', 'hideCharacter', 'changeAppearance', 'placement'].includes(b.kind)) {
        form.append(labelled('Character', select(['Mara', 'Eli'], b.speaker, 'Character', value => b.speaker = value)));
        if (['showCharacter', 'changeAppearance'].includes(b.kind)) form.append(labelled('Appearance', select(['Neutral', 'Concerned'], b.asset, 'Appearance', value => b.asset = value)));
        if (['showCharacter', 'placement'].includes(b.kind)) form.append(labelled('Position', select(['Left', 'Centre', 'Right'], b.placement, 'Position', value => b.placement = value)));
      }
      if (b.kind === 'playMusic') form.append(labelled('Music', select(['Night service', 'Last departure'], b.text || 'Night service', 'Music', value => b.text = value)));
      if (b.kind === 'playSfx') form.append(labelled('Sound effect', select(['Tram bell', 'Footsteps'], b.asset, 'Sound effect', value => b.asset = value)));
      if (b.kind === 'stopMusic') form.append(el('p', 'sr-explanation', 'Stops the current music. This browser sample does not play audio.'));
      if (['background', 'showCharacter', 'hideCharacter', 'changeAppearance', 'transition'].includes(b.kind)) form.append(labelled('Transition', select(['None', 'Dissolve', 'Fade'], b.transition, 'Transition', value => b.transition = value)));
    } return form;
  }
  function source(b = current()) {
    const dialog = modal(`Illustrative source · ${b ? name(b.id) : 'No selected beat'}`, 'source', true);
    const speech = b?.kind === 'dialogue' ? `${b.speaker === 'Eli' ? 'e' : 'm'} ${JSON.stringify(b.text)}` : b?.kind === 'narration' ? JSON.stringify(b.text) : undefined;
    const targetId = b?.target ?? 'scene_name';
    const samples: Partial<Record<Kind, string>> = { background: `scene ${b?.asset === 'Station at dawn' ? 'bg_station_dawn' : 'bg_platform'}${b?.transition === 'None' ? '' : ' with ' + (b?.transition ?? 'dissolve').toLowerCase()}`, showCharacter: `show ${b?.speaker.toLowerCase()} ${b?.asset.toLowerCase()} at ${(b?.placement ?? 'Centre').toLowerCase().replace('centre', 'center')}`, hideCharacter: `hide ${b?.speaker.toLowerCase()}`, changeAppearance: `show ${b?.speaker.toLowerCase()} ${b?.asset.toLowerCase()}`, placement: `show ${b?.speaker.toLowerCase()} at ${(b?.placement ?? 'Centre').toLowerCase().replace('centre', 'center')}`, transition: `with ${(b?.transition ?? 'dissolve').toLowerCase()}`, playMusic: `play music "audio/${b?.text === 'Last departure' ? 'last_departure' : 'night_service'}.ogg"`, stopMusic: 'stop music', playSfx: `play sound "audio/${b?.asset === 'Footsteps' ? 'footsteps' : 'tram_bell'}.ogg"`, call: `call ${targetId}`, jump: `jump ${targetId}`, return: 'return', showScreen: `show screen ${(b?.asset === 'Neutral' ? 'help' : b?.asset ?? 'help').toLowerCase()}`, hideScreen: `hide screen ${(b?.asset === 'Neutral' ? 'help' : b?.asset ?? 'help').toLowerCase()}`, callScreen: `call screen ${(b?.asset === 'Neutral' ? 'help' : b?.asset ?? 'help').toLowerCase()}`, setVariable: `$ ${b?.text || 'has_ticket'} = ${b?.value === 'true' ? 'True' : b?.value === 'false' ? 'False' : b?.value}`, choice: `menu:\n${b?.options.map(o => `    # Available when: ${o.guard || 'Always'}\n    ${JSON.stringify(o.text)}:\n        jump ${o.target}`).join('\n')}`, condition: b?.branches.map(branch => `# ${branch.name} ${branch.condition}`.trim() + '\n' + branch.beats.map(beat => `#   ${number(beat.id)} ${label(beat.kind)}: ${brief(beat)}`).join('\n')).join('\n') };
    let example = b?.kind === 'customCode' ? b.text : speech ?? (b ? samples[b.kind] ?? `# ${brief(b)}` : '# Select a beat');
    if (b && ['showCharacter', 'hideCharacter', 'changeAppearance'].includes(b.kind)) example += `\n# Transition: ${b.transition}`;
    if (b?.kind === 'transition') example = `with ${b.transition === 'None' ? 'None' : b.transition.toLowerCase()}`;
    const code = el('pre', 'sr-code', example); code.tabIndex = 0;
    dialog.append(code);
    if (b && ['condition', 'choice', 'showCharacter', 'hideCharacter', 'changeAppearance'].includes(b.kind)) dialog.append(el('p', '', 'Branch tests, option availability and character transitions are shown as comments where relevant. This is an incomplete syntax example.'));
    dialog.append(el('p', '', 'Sample text only, not a project file. This preview never reads or writes project source.')); actions(dialog, [action('Close', () => dialog.close(), false, 'close-source')]);
  }
  function assist() {
    const b = current(); const dialog = modal(`Assist · rewrite ${b ? name(b.id) : 'a line'}`, 'assist');
    if (!b || !['dialogue', 'narration'].includes(b.kind)) { dialog.append(el('p', '', 'Select a dialogue or narration line to rewrite.')); actions(dialog, [action('Close', () => dialog.close())]); return; }
    let instructions = 'Make this line more curious, less guarded.';
    const head = dialog.querySelector<HTMLElement>('.sr-dialog-head')!;
    function reset(title: string) { head.querySelector('h2')!.textContent = title; dialog.ariaLabel = title; for (const child of [...dialog.children]) if (child !== head) child.remove(); }
    function prepare() {
      reset(`Assist · rewrite ${name(b!.id)}`); dialog.dataset.step = 'prepare';
      const task = el('textarea'); task.ariaLabel = 'Rewrite instructions'; task.value = instructions; task.rows = 3; task.oninput = () => instructions = task.value;
      dialog.append(el('p', 'sr-dialog-context', `Selected line · ${name(b!.id)}`), el('blockquote', '', b!.text), labelled('How should this line change?', task), el('p', '', 'Prewritten sample only. No model request is sent.'));
      actions(dialog, [action('Cancel', () => dialog.close(), false, 'cancel-dialog'), action('Show sample rewrite', review, true, 'assist-review')]); task.focus();
    }
    function review() {
      reset(`Review rewrite for ${name(b!.id)}`); dialog.dataset.step = 'review'; const proposed = 'You heard it too? Tell me you heard the bell.';
      dialog.append(el('h3', '', 'Current line'), el('blockquote', '', b!.text), el('h3', '', 'Prewritten sample proposal'), el('blockquote', '', proposed), el('p', '', `Replaces only ${name(b!.id)}. Undo restores the current line.`));
      actions(dialog, [action('Back to instructions', prepare, false, 'assist-back'), action('Discard proposal', () => dialog.close(), false, 'assist-discard'), action(`Replace ${number(b!.id)} text`, () => { change(() => b!.text = proposed, `Rewrite ${name(b!.id)}`); dialog.close(); focusText(); }, true, 'assist-apply')]);
      dialog.querySelector<HTMLButtonElement>('[data-action="assist-back"]')!.focus();
    } prepare();
  }
  function notes() { const dialog = modal('Design notes · future tools', 'design-notes', true); dialog.append(el('p', '', 'These tools are not implemented in this mock.')); for (const [title, copy] of [['Stage', 'Character dragging and resizing belong on this large game window, with numeric and keyboard alternatives.'], ['Appearances', 'Animation and idle settings extend the character fields.'], ['Timeline', `Open timing tools for a selected beat. ${variant === 'cue-sheet' ? 'The cue sheet shows' : variant === 'shot-reel' ? 'The reel shows' : 'The tracks show'} statement order, without elapsed time or keyframes.`], ['State and Run From Here', 'A future inspection step must show route, provenance and unknown state before a deliberate launch. This illustration evaluates no conditions and follows no Calls.']]) dialog.append(el('h3', '', title), el('p', '', copy)); actions(dialog, [action('Close', () => dialog.close())]); }
  function header() {
    const bar = el('header', 'sr-topbar'); const choose = action(`${scene().name} ▾`, () => { treeOpen = !treeOpen; draw(); }, false, 'scenes'); choose.ariaLabel = `Scenes · ${scene().name}`; choose.title = `Choose a scene · ${scene().name}`; choose.ariaExpanded = String(treeOpen); bar.append(choose);
    if (caller) { const origin = scenes.find(s => s.id === caller!.scene); const back = action(`← Back to ${origin?.name ?? 'previous scene'}`, () => { const previous = caller!; caller = undefined; sceneSelections.set(previous.scene, previous.selected); go(previous.scene); reelBranch = previous.branch; draw(); focusSelected(); }, false, 'back-scene'); back.classList.add('sr-back-scene'); back.title = `${back.textContent} · ${origin ? beatName(origin, caller.selected) : ''}`; bar.append(back); }
    const trail = ancestry(scene(), selected) ?? []; bar.append(el('span', 'sr-current-body', trail.length ? trail.map(p => `${number(p.beat.id)} ${p.branch.name} ${p.branch.condition}`).join(' › ') : ''));
    const tools = el('div', 'sr-top-tools');
    const focus = action(focused ? 'Show game window' : 'Writing focus', () => { focused = !focused; draw(); status(focused ? 'Writing focus · all beat tools remain available' : 'Game window shown'); }, false, 'toggle-focus'); focus.dataset.focusToggle = '';
    undoButton = action('Undo', () => history(undo, redo, 'Undid'), false, 'undo'); redoButton = action('Redo', () => history(redo, undo, 'Redid'), false, 'redo'); undoButton.disabled = !undo.length; redoButton.disabled = !redo.length;
    const t = target(); const add = action(innerWidth < 900 ? '+ Add beat' : `+ Add beat ${t.body[t.index] ? 'before ' + name(t.body[t.index]!.id) : t.body[t.index - 1] ? 'after ' + name(t.body[t.index - 1]!.id) : 'to ' + (reelContext()?.branch.name ?? 'scene')}`, () => { const here = target(); picker(here.body, here.trail, here.index); }, true, 'add-beat'); add.title = targetText(t.body, t.trail, t.index);
    const more = el('details', 'sr-more'); const summary = el('summary', '', 'More'); summary.ariaLabel = 'More scene actions'; summary.dataset.action = 'more'; more.append(summary);
    const menu = el('div', 'sr-top-menu'); const rewrite = action(`Assist with ${name()}…`, assist); rewrite.disabled = !current() || !['dialogue', 'narration'].includes(current()!.kind); if (rewrite.disabled) rewrite.title = 'Select a dialogue or narration line to rewrite.'; menu.append(rewrite, action(`View source for ${name()}`, () => source()), action('Rename this scene…', renameScene), action('Design notes (future tools)', notes)); more.append(menu);
    tools.append(focus, undoButton, redoButton, add, more); bar.append(tools); return bar;
  }
  function syncSelectionChrome() {
    frame.content.dataset.selected = selected;
    const t = target(); const key = `${sceneId}|${selected}|${name()}|${t.trail.join('/')}|${t.index}|${focused}`;
    if (chromeKey !== key) { host.querySelector('.sr-topbar')?.replaceWith(header()); chromeKey = key; }
    for (const [key, title] of [['add-background', `+ Background before ${number()}`], ['add-character', `+ Character before ${number()}`]]) for (const button of host.querySelectorAll<HTMLElement>(`[data-action="${key}"]`)) { nameControl(button, title!); if (key === 'add-background') button.title = `${title}. Characters shown earlier are cleared.`; }
    status(frame.status.textContent ?? '');
  }
  function tree() { const aside = el('aside', 'sr-scenes'); aside.ariaLabel = 'Scenes'; aside.append(action('+ New scene', () => createScene(), true, 'new-scene')); for (const chapter of new Set(scenes.map(s => s.chapter))) { aside.append(el('h2', '', chapter)); for (const s of scenes.filter(s => s.chapter === chapter)) { const button = action(s.name, () => { caller = undefined; go(s.id); }, false, `scene-${s.id}`); button.className = 'sr-scene-link'; button.ariaCurrent = s.id === sceneId ? 'page' : null; aside.append(button); } } return aside; }
  function openBranch(owner: Beat, branch: Branch, child = branch.beats[0]?.id) { visibleBranches.set(owner.id, branch.id); reelBranch = branch.id; selected = child ?? owner.id; expanded.add(owner.id); stageObject = ''; manual = ''; draw(); status(`Editing ${number(owner.id)} Condition › ${branch.name} ${branch.condition}`.trim()); focusSelected(); }
  function stageInsert(kind: Kind, actor?: string) {
    const t = locate(scene(), selected); const state = stateAt(); const currentActor = actor && state.characters.get(actor);
    insert(kind, t?.body ?? scene().beats, t?.trail ?? [scene().name], t?.index ?? defaultIndex(), actor ?? current()?.speaker, undefined, currentActor ? { speaker: actor, asset: currentActor.asset, placement: currentActor.placement } : undefined);
  }
  function effects() {
    const section = el('section', 'sr-effects'); const state = stateAt(); section.append(el('h3', '', `In effect at ${number()}`));
    const row = (text: string, beat: Beat, object: string) => {
      const line = el('div', 'sr-effect-row'); const link = action(`${text} · Edit ${number(beat.id)}`, () => selectBeat(beat.id, true), false, `effect-owner-${beat.id}`); link.replaceChildren(el('span', '', text), el('span', 'sr-edit-link', `Edit ${number(beat.id)}`)); line.append(link);
      line.dataset.effectObject = object; section.append(line);
    };
    if (state.background) row(`Background · ${state.background.asset}`, state.background, 'background');
    for (const actor of state.characters.values()) row(`${actor.name} · ${actor.asset}, ${actor.placement}`, actor.from, actor.name);
    if (state.music) row(`Music · ${state.music.text || 'Night service'}`, state.music, 'music');
    if (!state.background && !state.characters.size && !state.music) section.append(el('p', '', 'No scene-local media yet.'));
    if (state.unknown.length) section.append(el('p', 'sr-unknown-note', `Partial illustration after ${state.unknown.map(b => `${number(b.id)} ${label(b.kind)}`).join(', ')}. Conditions and Calls are not evaluated.`)); return section;
  }
  const mediaKinds: Kind[] = ['background', 'showCharacter', 'hideCharacter', 'changeAppearance', 'placement', 'transition', 'playMusic', 'stopMusic', 'playSfx'];
  function typeSelector(b: Beat) {
    const compatible: Kind[][] = [['showCharacter', 'changeAppearance', 'placement', 'hideCharacter'], ['playMusic', 'stopMusic'], ['showScreen', 'hideScreen', 'callScreen']]; const family = compatible.find(f => f.includes(b.kind));
    if (!family || variant !== 'shot-reel') return el('strong', '', `${number(b.id)} · ${label(b.kind)}`);
    const control = el('select'); control.ariaLabel = 'Beat type'; for (const kind of family) control.append(new Option(label(kind), kind)); control.value = b.kind;
    control.onchange = () => change(() => b.kind = control.value as Kind, `${name(b.id)} is now ${label(control.value as Kind)}`); return control;
  }
  function inspector(textInGame = false) {
    const panel = el('aside', 'sr-inspector'); panel.ariaLabel = 'Selected beat editor'; const b = current();
    if (variant !== 'cue-sheet' && reelContext()?.branch.beats.length === 0 && reelContext()?.owner.id === selected) { const c = reelContext()!; panel.append(empty(c.branch.beats, c.trail)); return panel; }
    if (!b || scene().beats.length === 1 && b.kind === 'return') { if (variant !== 'cue-sheet') panel.append(empty(scene().beats, [scene().name]));  return panel; }
    if (stageObject) {
      const state = stateAt(); const owner = stageObject === 'background' ? state.background : state.characters.get(stageObject)?.from;
      if (owner) { panel.append(el('h3', '', `${stageObject === 'background' ? 'Background' : stageObject} on stage · set by ${name(owner.id)}`), action(`Edit ${name(owner.id)}`, () => { stageObject = ''; selectBeat(owner.id, true); focusText(); }, false, 'edit-stage-owner'), action(`${stageObject === 'background' ? 'Change background' : `Change ${stageObject}'s appearance`} before ${number()}`, () => { stageInsert(stageObject === 'background' ? 'background' : 'changeAppearance', stageObject === 'background' ? undefined : stageObject); stageObject = ''; }, true, 'stage-change'), action(`Back to ${number()}`, () => { stageObject = ''; selectBeat(selected, true); }, false, 'close-stage-object')); return panel; }
    }
    const heading = el('div', 'sr-inspector-heading'); const type = typeSelector(b); if (type instanceof HTMLSelectElement) heading.append(el('strong', '', `${number(b.id)} ·`)); heading.append(type);
    if (['dialogue', 'narration'].includes(b.kind) && variant !== 'cue-sheet') { const next = action('+ Add dialogue', () => { const t = locate(scene(), b.id)!; insert('dialogue', t.body, t.trail, t.index + 1, nextSpeaker(b.id)); }, true, 'next-dialogue'); next.title = `Add dialogue after ${name(b.id)} (Shift+${mod}+Enter)`; heading.append(next); }
    heading.append(rowMenu(b)); panel.append(heading);
    if ((ancestry(scene(), b.id) ?? []).length) panel.append(el('p', 'sr-editor-location', locate(scene(), b.id)!.trail.join(' › ')));
    if (variant === 'cue-sheet') { if (mediaKinds.includes(b.kind)) panel.append(fields(b)); else panel.append(effects()); }
    else { if (!textInGame || !['dialogue', 'narration'].includes(b.kind)) panel.append(fields(b)); else panel.append(el('p', 'sr-editor-hint', `Type in the game's text box. Shift+${mod}+Enter adds the next dialogue.`)); if (!focused) panel.append(effects()); }
    return panel;
  }
  const art: Record<string, Record<string, string>> = { Mara: { Neutral: mara, Concerned: maraConcerned }, Eli: { Neutral: eli, Concerned: eliConcerned } };
  function stageCharacters(stage: HTMLElement, state: Illustration) {
    for (const old of stage.querySelectorAll<HTMLElement>('[data-stage-character]')) if (!state.characters.has(old.dataset.stageCharacter!)) old.remove();
    for (const actor of state.characters.values()) {
      let button = stage.querySelector<HTMLButtonElement>(`[data-stage-character="${actor.name}"]`);
      if (!button) {
        button = action('', () => { stageObject = actor.name; stageExpanded = false; draw(); host.querySelector<HTMLElement>('[data-action="edit-stage-owner"]')?.focus(); }, false, `stage-${actor.name}`); button.className = 'sr-character'; button.dataset.stageCharacter = actor.name;
        button.append(el('img'), el('span', 'sr-object-label')); stage.insertBefore(button, stage.querySelector('.sr-saybox'));
      }
      button.ariaLabel = `Select ${actor.name} on stage`; button.title = `${actor.name} · ${actor.asset} · ${actor.placement}. Select to inspect its contributing beat.`; button.dataset.objectSelected = String(stageObject === actor.name);
      button.style.left = actor.placement === 'Left' ? '25%' : actor.placement === 'Right' ? '75%' : '52%';
      const image = button.querySelector('img')!; image.src = art[actor.name]?.[actor.asset] ?? mara; image.alt = `${actor.name}, ${actor.asset.toLowerCase()}`;
      button.querySelector('span')!.textContent = `${actor.name} · ${actor.asset}`;
    }
  }
  function preview() {
    const wrap = el('section', 'sr-preview'); wrap.ariaLabel = 'Game window';
    const top = el('div', 'sr-preview-title'); top.append(el('strong', '', 'Game window'), el('span', 'sr-stage-resolution', '1920 × 1080'), action(stageExpanded ? `Show ${variants.find(v => v.id === variant)!.title.toLowerCase()}` : 'Enlarge stage', () => { stageExpanded = !stageExpanded; draw(); }, false, 'enlarge-stage')); wrap.append(top);
    const slot = el('div', 'sr-stage-slot'); const stage = el('div', 'sr-stage'); stage.dataset.stage = '';
    const bgButton = action('', () => { stageObject = 'background'; stageExpanded = false; draw(); host.querySelector<HTMLElement>('[data-action="edit-stage-owner"]')?.focus(); }, false, 'stage-background'); bgButton.className = 'sr-backdrop-control'; bgButton.ariaLabel = 'Select background on stage';
    const image = el('img', 'sr-backdrop'); image.src = platform; image.alt = 'Fictional rain-soaked tram platform'; bgButton.append(image); stage.append(bgButton);
    const placeholder = el('div', 'sr-stage-empty'); placeholder.append(el('span', '', 'No background yet')); if (variant === 'stage-tracks' || scene().beats.some(b => b.kind !== 'return')) placeholder.append(action('Add background', () => stageInsert('background'), false, 'empty-stage-background')); stage.append(placeholder);
    const b = current(); const editable = variant === 'shot-reel' && !hideSaybox && innerWidth >= 900 && b && ['dialogue', 'narration'].includes(b.kind);
    const caption = el('div', 'sr-saybox'); caption.dataset.saybox = '';
    if (editable) { const speaker = lineSpeaker(b); speaker.classList.toggle('sr-narration-speaker', b.kind === 'narration'); caption.append(speaker, prose(b)); }
    else {
      caption.tabIndex = 0; caption.role = 'button'; caption.ariaLabel = 'Edit displayed dialogue'; caption.append(el('strong'), el('p'));
      const edit = () => { const line = previewLine(); if (line) { manual = ''; selectBeat(line.id); focusText(); } }; caption.onclick = edit; caption.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); edit(); } };
    }
    stage.append(caption); stageCharacters(stage, previewState());
    if (b?.kind === 'choice') stage.append(gameChoices(b));
    slot.append(stage); wrap.append(slot);
    const bottom = el('div', 'sr-stage-footer'); bottom.append(el('span', 'sr-stage-status'));
    if (variant === 'cue-sheet') {
      const routeOptions = flatten(scene().beats).filter(b => b.kind === 'condition');
      if (routeOptions.length) {
        const route = el('select'); route.ariaLabel = 'Illustrative branch preview'; route.dataset.action = 'preview-branch'; route.append(new Option(innerWidth < 900 ? 'Preview: follow selection' : 'Follow selection', ''));
        for (const condition of routeOptions) for (const branch of condition.branches) route.append(new Option(`${number(condition.id)} ${branch.name} ${branch.condition}`.trim(), branch.id));
        route.value = manual; route.onchange = () => { manual = route.value; refresh(); status(manual ? `Manual selection · not a playthrough · editing stays on ${name()}` : `Illustration follows ${name()}`); }; const label = el('label', 'sr-preview-route'); label.append(el('span', '', 'Preview'), route); bottom.append(label);
      }
    }
    const add = el('div', 'sr-stage-actions'); add.append(action(`+ Background before ${number()}`, () => stageInsert('background'), false, 'add-background'), action(`+ Character before ${number()}`, () => stageInsert('showCharacter'), false, 'add-character'));
    if (variant === 'shot-reel' && previewLine()) add.append(action(hideSaybox ? 'Show text box' : 'Hide text box', () => { hideSaybox = !hideSaybox; draw(); focusText(); }, false, 'hide-text-box'));
    bottom.append(add); wrap.append(bottom); return wrap;
  }
  function gameChoices(b: Beat) {
    const choices = el('div', 'sr-game-choices'); b.options.forEach((option, i) => { const button = action(option.text || 'New choice', () => host.querySelector<HTMLInputElement>(`input[aria-label="Option ${i + 1} text"]`)?.focus(), false, `stage-choice-${i}`); button.ariaLabel = `Edit option ${i + 1}: ${option.text || 'New choice'}`; button.dataset.stageChoice = String(i); choices.append(button); }); return choices;
  }
  function refresh() {
    syncSelectionChrome();
    const state = previewState(); const line = previewLine();
    for (const stage of host.querySelectorAll<HTMLElement>('[data-stage]')) {
      stage.querySelector('.sr-game-choices')?.remove(); if (current()?.kind === 'choice') stage.append(gameChoices(current()!));
      stage.classList.toggle('sr-dawn', state.background?.asset === 'Station at dawn'); stage.classList.toggle('sr-no-background', !state.background); stage.querySelector<HTMLElement>('.sr-stage-empty')!.hidden = !!state.background;
      stageCharacters(stage, state); const caption = stage.querySelector<HTMLElement>('.sr-saybox')!; caption.hidden = !line || hideSaybox;
      const paragraph = caption.querySelector('p'); if (paragraph) paragraph.textContent = line?.text ?? ''; const speaker = caption.querySelector('strong'); if (speaker) speaker.textContent = line?.kind === 'dialogue' ? line.speaker : '';
    }
    for (const item of host.querySelectorAll<HTMLElement>('[data-summary]')) { const b = flatten(scene().beats).find(b => b.id === item.dataset.summary); if (b) { item.textContent = brief(b); const control = item.closest<HTMLElement>('[data-reel-beat],.sr-cue'); if (control) control.ariaLabel = `${control.classList.contains('sr-cue') ? 'Select ' : ''}${contextName(b.id)}: ${brief(b)}`; } }
    for (const item of host.querySelectorAll<HTMLElement>('[data-stage-choice]')) { const option = current()?.options[Number(item.dataset.stageChoice)]; if (option) item.textContent = option.text || 'New choice'; }
    for (const note of host.querySelectorAll('.sr-stage-status')) note.textContent = manual ? `Manual selection · editing ${number()}` : innerWidth < 900 ? number() : `${number()} · ${state.unknown.length ? 'Partial illustration' : 'Sample illustration'}`;
    for (const effect of host.querySelectorAll('.sr-effects')) effect.replaceWith(effects());
    for (const owner of flatten(scene().beats)) for (const branch of owner.branches) {
      for (const button of host.querySelectorAll<HTMLElement>(`[data-action="open-branch-${branch.id}"]`)) { const prefix = button.closest('.sr-branch-control') ? (variant === 'stage-tracks' ? 'Show in tracks: ' : 'Open branch: ') : button.closest('.sr-reel-target') ? 'Open ' : ''; nameControl(button, `${prefix}${branch.name} ${branch.condition}${button.closest('.sr-reel-target') ? ' · ' + count(branch.beats.length, 'beat') : ''}`.trim()); if (button.closest('.sr-track-band')) button.title = `Show ${branch.name} ${branch.condition} in tracks`.trim(); }
      const option = host.querySelector<HTMLOptionElement>(`.sr-preview-route option[value="${branch.id}"]`); if (option) option.textContent = `${number(owner.id)} ${branch.name} ${branch.condition}`.trim();
    }
    const selectedBeat = current();
    if (selectedBeat?.kind === 'choice') selectedBeat.options.forEach((option, i) => { const button = host.querySelector<HTMLElement>(`[data-action="open-choice-${i}"]`); if (button) { const text = `Open ${scenes.find(s => s.id === option.target)?.name ?? 'destination'}`; button.textContent = text; button.ariaLabel = text; } });
    if (selectedBeat && ['call', 'jump'].includes(selectedBeat.kind)) { const button = host.querySelector<HTMLElement>('[data-action="open-destination"]'); if (button) { const text = `Open ${scenes.find(s => s.id === selectedBeat.target)?.name ?? 'destination'}`; button.textContent = text; button.ariaLabel = text; } }
    if (variant === 'stage-tracks') updateTrackCells();
  }
  function removeBranch(owner: Beat, branch: Branch) {
    const total = flatten(branch.beats).length;
    const remove = () => change(() => { owner.branches.splice(owner.branches.indexOf(branch), 1); selected = owner.id; if (manual === branch.id) manual = ''; }, `Remove ${branch.name} from ${name(owner.id)}`);
    if (!total) { remove(); focusSelected(); return; }
    const dialog = modal(`Remove ${branch.name} ${branch.condition} from ${number(owner.id)} Condition?`, 'delete-branch', true); const cancel = action('Cancel', () => dialog.close()); dialog.append(el('p', '', `Removes this branch and its ${count(total, 'beat')}. Undo restores them.`)); actions(dialog, [cancel, danger(action(`Remove branch and ${count(total, 'beat')}`, () => { remove(); dialog.close(); focusSelected(); }))]); cancel.focus();
  }
  function addElseIf(owner: Beat) {
    const branch: Branch = { id: sample.newId(), name: 'Else if', condition: 'trust is at least 5', beats: [] };
    change(() => { owner.branches.splice(Math.max(1, owner.branches.length - 1), 0, branch); expanded.add(owner.id); selected = owner.id; }, `Add Else if to ${name(owner.id)}`);
    focusField(`[data-branch="${branch.id}"] input`);
  }
  function branchBody(owner: Beat, branch: Branch, trail: string[]) {
    const section = el('section', 'sr-inline-branch'); section.dataset.branch = branch.id; section.ariaLabel = `${number(owner.id)} ${branch.name} ${branch.condition}`.trim();
    const heading = el('div', 'sr-branch-title'); heading.append(el('strong', '', branch.name)); if (branch.name !== 'Otherwise') heading.append(input(branch.condition, `${name(owner.id)} ${branch.name} condition`, value => branch.condition = value));
    if (branch.name.toLowerCase() === 'else if') heading.append(action('Remove this Else if', () => removeBranch(owner, branch))); section.append(heading);
    branch.beats.forEach((b, i) => section.append(row(b, branch.beats, trail, i))); section.append(action(`+ Add beat to ${branch.name}`, () => picker(branch.beats, trail, defaultIndex(branch.beats)))); return section;
  }
  function row(b: Beat, body: Beat[], trail: string[], index: number) {
    const result = el('article', `sr-row sr-${b.kind}`); result.dataset.beat = b.id; result.dataset.beatKind = b.kind; result.dataset.selected = String(b.id === selected);
    const top = el('div', 'sr-row-line'); const selectNumber = action(number(b.id), () => selectBeat(b.id), false, 'select-beat'); selectNumber.className = 'sr-number'; selectNumber.tabIndex = -1; selectNumber.ariaLabel = `Select ${name(b.id)}`; top.append(selectNumber);
    if (['dialogue', 'narration'].includes(b.kind)) {
      const speaker = lineSpeaker(b, `Speaker for ${name(b.id)}`); speaker.classList.toggle('sr-narrator', b.kind === 'narration'); top.append(speaker);
      top.append(prose(b));
    } else {
      const button = action('', () => innerWidth < 900 ? editBeat(b.id) : selectBeat(b.id), false, 'select-beat-content'); button.className = 'sr-cue'; button.ariaLabel = `Select ${name(b.id)}: ${brief(b)}`; button.append(el('span', 'sr-kind', label(b.kind)), el('span', 'sr-cue-value', brief(b))); button.querySelector<HTMLElement>('.sr-cue-value')!.dataset.summary = b.id; top.append(button);
    }
    top.append(rowMenu(b)); result.append(top);
    if (b.kind === 'condition') {
      const total = flatten(b.branches.flatMap(branch => branch.beats)).length; const toggle = action(`${expanded.has(b.id) ? '▾ Hide' : '▸ Show'} ${count(b.branches.length, 'branch')} · ${count(total, 'beat')}`, () => { if (expanded.has(b.id)) { if (b.branches.some(branch => flatten(branch.beats).some(beat => beat.id === selected))) selected = b.id; expanded.delete(b.id); } else expanded.add(b.id); draw(); }, false, 'toggle-condition'); toggle.ariaExpanded = String(expanded.has(b.id)); result.append(toggle);
      if (expanded.has(b.id)) {
        result.append(el('p', 'sr-branch-explanation', 'The first branch whose test is true runs.'));
        for (const branch of b.branches) result.append(branchBody(b, branch, [...trail, `${branch.name} ${branch.condition}`.trim()]));
        result.append(action('+ Add Else if', () => addElseIf(b)), el('div', 'sr-rejoin', 'Continue after condition · Jump and Return leave this path. If a Choice has no available options, the story continues here.'));
      }
    } else if (selected === b.id && !['dialogue', 'narration'].includes(b.kind)) {
      if (focused || innerWidth < 900 || !mediaKinds.includes(b.kind)) result.append(fields(b)); else { const edit = action(`Edit ${name(b.id)} below the game window`, focusText, false, 'edit-media-fields'); edit.classList.add('sr-editor-location'); result.append(edit); }
    }
    if (b.kind === 'choice' && selected !== b.id) result.append(choiceSummary(b));
    if (selected === b.id && ['dialogue', 'narration'].includes(b.kind)) result.append(nextLine(b));
    if (!['choice', 'jump', 'return'].includes(b.kind)) result.append(gap(body, trail, index + 1)); return result;
  }
  function choiceSummary(b: Beat) {
    const summary = el('div', 'sr-choice-summary'); b.options.forEach((option, i) => summary.append(el('p', '', `${i + 1}  ${option.text || 'New choice'} → ${scenes.find(s => s.id === option.target)?.name ?? option.target}${option.guard ? ' · only when ' + option.guard : ''}`))); return summary;
  }
  function nextLine(b: Beat) {
    const next = action(`+ Next ${b.kind === 'dialogue' ? b.speaker : 'dialogue'} line`, () => { const t = locate(scene(), b.id)!; insert('dialogue', t.body, t.trail, t.index + 1, nextSpeaker(b.id)); }, false, 'next-dialogue'); next.title = `Shift+${mod}+Enter`; next.classList.add('sr-inline-next'); return next;
  }
  function reconcileCueRows() {
    for (const row of host.querySelectorAll<HTMLElement>('[data-beat]')) {
      const b = flatten(scene().beats).find(b => b.id === row.dataset.beat); if (!b) continue;
      for (const node of row.querySelectorAll(':scope>.sr-inline-next')) node.remove();
      const gap = row.querySelector<HTMLElement>(':scope>.sr-gap'); if (gap) gap.tabIndex = b.id === selected ? 0 : -1;
      if (b.id === selected && ['dialogue', 'narration'].includes(b.kind)) row.insertBefore(nextLine(b), gap);
      if (b.id !== selected) for (const node of row.querySelectorAll(':scope>.sr-fields,:scope>.sr-editor-location')) node.remove();
      if (b.kind === 'choice' && b.id !== selected && !row.querySelector(':scope>.sr-choice-summary')) row.insertBefore(choiceSummary(b), gap);
    }
  }
  function empty(body: Beat[], trail: string[]) {
    const box = el('div', 'sr-empty'); const branch = trail.length > 1; box.append(el('h2', '', branch ? `${trail.at(-1)} has no beats yet.` : 'No lines yet.'), el('p', '', branch ? 'Write a line or add a background in this branch.' : 'Write the first line or add a background. New beats go before the ending.')); const controls = el('div'); controls.append(action('Write dialogue', () => insert('dialogue', body, trail, defaultIndex(body)), true), action('Write narration', () => insert('narration', body, trail, defaultIndex(body))), action('Add background', () => insert('background', body, trail, defaultIndex(body)))); box.append(controls); return box;
  }
  function cueSheet(parent: HTMLElement) {
    const layout = el('div', 'sr-cue-layout'); if (!focused) { const stage = el('div', 'sr-cue-stage'); stage.append(preview()); if (innerWidth >= 900 || stageObject) stage.append(inspector(true)); layout.append(stage); }
    const sheet = el('section', 'sr-sheet'); sheet.ariaLabel = 'Cue sheet writing'; const heading = el('header', 'sr-sheet-heading'); heading.append(el('strong', '', 'Cue sheet'), el('span', '', `Shift+${mod}+Enter · next line`)); sheet.append(heading);
    if (scene().beats.length === 1 && scene().beats[0]!.kind === 'return') sheet.append(empty(scene().beats, [scene().name])); scene().beats.forEach((b, i) => sheet.append(row(b, scene().beats, [scene().name], i))); layout.append(sheet); parent.append(layout);
  }
  function selectBeat(id: string, focus = false) { selected = id; stageObject = ''; manual = ''; reelBranch = ''; draw(); status(`Selected ${contextName()}`); if (focus) focusSelected(); }
  function editBeat(id: string) {
    selectBeat(id);
    if (host.querySelector(`textarea[data-beat-text="${id}"],[data-editor-for="${id}"] input,[data-editor-for="${id}"] select,[data-editor-for="${id}"] button`)) focusText();
    else focusSelected();
  }
  function focusSelected() { const request = ++focusRequest; requestAnimationFrame(() => { if (request !== focusRequest) return; const item = host.querySelector<HTMLElement>(`[data-reel-beat="${selected}"],[data-track-beat="${selected}"]`) ?? host.querySelector<HTMLElement>(`[data-beat="${selected}"] .sr-number`) ?? host.querySelector<HTMLElement>('[data-action="add-beat"]'); item?.focus(); revealSelection(); }); }
  function focusVisible(control?: HTMLElement | null) {
    if (!control) return; control.focus({ preventScroll: true });
    const work = host.querySelector<HTMLElement>('.sr-workarea')!, panel = control.closest<HTMLElement>('.sr-inspector');
    const container = panel ?? control.closest<HTMLElement>('[data-beat]');
    if (innerWidth < 900 && container && control.getBoundingClientRect().bottom - container.getBoundingClientRect().top < work.clientHeight - 16) work.scrollTop += container.getBoundingClientRect().top - work.getBoundingClientRect().top - 8;
    else { const anchor = focused && variant === 'shot-reel' && panel && panel.getBoundingClientRect().height < work.clientHeight ? panel : control; anchor.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  }
  function focusField(selector: string) { const request = ++focusRequest; requestAnimationFrame(() => { if (request === focusRequest) focusVisible(host.querySelector<HTMLElement>(selector)); }); }
  function focusText() { const request = ++focusRequest; requestAnimationFrame(() => { if (request !== focusRequest) return; revealSelection(); const area = host.querySelector<HTMLTextAreaElement>(`textarea[data-beat-text="${selected}"]`); const fields = host.querySelector<HTMLElement>(`[data-editor-for="${selected}"]`); focusVisible(area ?? fields?.querySelector<HTMLElement>('input,select,button') ?? host.querySelector<HTMLElement>(`[data-beat="${selected}"] .sr-cue`)); }); }
  function revealSelection() {
    for (const [itemSelector, scrollSelector] of [[`[data-reel-beat="${selected}"]`, '.sr-reel-strip'], [`[data-track-beat="${selected}"]`, '.sr-tracks-scroll'], [`[data-beat="${selected}"]`, '.sr-sheet']]) {
      const item = host.querySelector<HTMLElement>(itemSelector!), area = host.querySelector<HTMLElement>(focused && scrollSelector === '.sr-reel-strip' ? '.sr-workarea' : scrollSelector!); if (!item || !area) continue;
      const r = item.getBoundingClientRect(), rect = area.getBoundingClientRect(), main = host.querySelector<HTMLElement>('.sr-workarea')!.getBoundingClientRect(); const sticky = focused && variant === 'shot-reel' ? host.querySelector<HTMLElement>('.sr-shot-workspace[data-prose=true]')?.getBoundingClientRect().height ?? 0 : 0; const a = { left: rect.left, right: rect.right, top: focused ? Math.max(rect.top, main.top + sticky) : rect.top, bottom: focused ? Math.min(rect.bottom, main.bottom) : rect.bottom }; if (r.left < a.left) area.scrollLeft -= a.left - r.left; if (r.right > a.right) area.scrollLeft += r.right - a.right;
      if (r.top < a.top) area.scrollTop -= a.top - r.top; if (r.bottom > a.bottom) area.scrollTop += Math.min(r.bottom - a.bottom, Math.max(0, r.top - a.top));
    }
  }
  function navigateBeat(event: KeyboardEvent, beats: Beat[], index: number) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    const previousKey = focused ? 'ArrowUp' : 'ArrowLeft', nextKey = focused ? 'ArrowDown' : 'ArrowRight'; let next = index;
    if (event.key === previousKey) next--; else if (event.key === nextKey) next++; else if (event.key === 'Home') next = 0; else if (event.key === 'End') next = beats.length - 1; else if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); focusText(); return; } else return;
    event.preventDefault(); event.stopPropagation(); if (beats[next]) selectBeat(beats[next]!.id, true);
  }
  function branchBreadcrumb(reel: HTMLElement) {
    const breadcrumb = el('nav', 'sr-reel-target'); breadcrumb.ariaLabel = 'Branch path'; breadcrumb.append(action(scene().name, () => { const root = scene().beats.find(b => flatten([b]).some(item => item.id === selected)); reelBranch = ''; selected = root?.id ?? scene().beats[0]!.id; draw(); focusSelected(); }, false, 'scene-path'));
    const separator = () => { const text = el('span', 'sr-path-separator', '›'); text.ariaHidden = 'true'; breadcrumb.append(text); };
    const context = reelContext(); if (context) { const parents = ancestry(scene(), context.owner.id) ?? []; for (const [index, parent] of parents.entries()) { separator(); breadcrumb.append(action(`${parent.branch.name} ${parent.branch.condition}`.trim(), () => openBranch(parent.beat, parent.branch, parents[index + 1]?.beat.id ?? context.owner.id), false, `path-${parent.beat.id}`)); } separator(); breadcrumb.append(el('strong', '', `${context.branch.name} ${context.branch.condition}`.trim())); }
    const b = current(); if (b?.kind === 'condition') for (const branch of b.branches) breadcrumb.append(action(`Open ${branch.name} ${branch.condition} · ${count(branch.beats.length, 'beat')}`.replace(/\s+/g, ' ').trim(), () => openBranch(b, branch), false, `open-branch-${branch.id}`)); reel.append(breadcrumb);
  }
  function orderedReel() {
    const reel = el('section', 'sr-reel'); reel.ariaLabel = 'Ordered beat reel'; branchBreadcrumb(reel); const context = reelContext(), body = context?.branch.beats ?? scene().beats, trail = context?.trail ?? [scene().name];
    const total = el('span', 'sr-reel-count', count(body.length, 'beat')); total.title = 'Use the arrow keys on a beat, or scroll the reel, to reach every beat.'; reel.querySelector('.sr-reel-target')!.append(total);
    const strip = el('div', 'sr-reel-strip'); strip.role = 'group'; strip.ariaLabel = 'Beats in story order';

    body.forEach((b, i) => { strip.append(gap(body, trail, i)); const button = action('', () => editBeat(b.id), false, 'reel-beat'); button.className = 'sr-reel-beat'; button.dataset.reelBeat = b.id; button.dataset.beatKind = b.kind; button.dataset.selected = String(b.id === selected); button.ariaCurrent = b.id === selected ? 'true' : null; button.ariaLabel = `${contextName(b.id)}: ${brief(b)}`; button.tabIndex = b.id === selected || !body.some(b => b.id === selected) && i === 0 ? 0 : -1; button.append(el('span', '', `${number(b.id)} · ${label(b.kind)}`), el('p', '', brief(b))); button.querySelector('p')!.dataset.summary = b.id; button.onkeydown = e => navigateBeat(e, body, i); strip.append(button); });
    if (ending(body) < 0) strip.append(gap(body, trail, body.length));
    strip.addEventListener('wheel', event => { if (!focused && Math.abs(event.deltaY) > Math.abs(event.deltaX) && strip.scrollWidth > strip.clientWidth) { const before = strip.scrollLeft; strip.scrollLeft += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? strip.clientWidth : 1); if (strip.scrollLeft !== before) event.preventDefault(); } }, { passive: false });
    reel.append(strip); return reel;
  }
  function shotReel(parent: HTMLElement) { const layout = el('div', 'sr-reel-layout'); const top = el('div', 'sr-shot-workspace'); top.dataset.prose = String(['dialogue', 'narration'].includes(current()?.kind ?? '')); if (!focused) top.append(preview()); top.append(inspector(!focused && !hideSaybox && innerWidth >= 900)); layout.append(top, orderedReel()); parent.append(layout); }
  const wordsOnly = () => focused ? innerWidth <= 1200 : innerWidth < 900 && !allTracks;
  function trackText(b: Beat, track: number) {
    if (track === 0) return number(b.id);
    if (track === 1) return b.kind === 'background' ? b.asset : b.kind === 'transition' ? `Transition · ${b.transition}` : '';
    if (track === 2) return ['showCharacter', 'changeAppearance', 'placement', 'hideCharacter'].includes(b.kind) ? b.kind === 'hideCharacter' ? `${b.speaker} hidden` : brief(b) : '';
    if (track === 3) return ['dialogue', 'narration'].includes(b.kind) ? brief(b) : wordsOnly() ? `${label(b.kind)} · ${brief(b)}` : '';
    if (track === 4) return ['playMusic', 'stopMusic', 'playSfx'].includes(b.kind) ? brief(b) : '';
    return !['dialogue', 'narration', ...mediaKinds].includes(b.kind) ? `${label(b.kind)} · ${brief(b)}` : '';
  }
  function updateTrackCells() {
    const route = columns(scene(), visibleBranches);
    for (const button of host.querySelectorAll<HTMLElement>('[data-track-beat]')) { const i = route.findIndex(c => c.beat.id === button.dataset.trackBeat); if (i < 0) continue; const b = route[i]!.beat, state = illustrate(route, i); button.ariaLabel = `${contextName(b.id)}: ${brief(b)}`;
      for (const cell of button.querySelectorAll<HTMLElement>('[data-track]')) { const track = Number(cell.dataset.track); (cell.querySelector('.sr-track-copy') ?? cell).textContent = trackText(b, track); cell.classList.toggle('sr-track-present', track === 1 && !!state.background || track === 2 && !!state.characters.size || track === 4 && !!state.music); cell.classList.toggle('sr-track-unknown', !!state.unknown.length); cell.title = `${cell.textContent ?? ''}${state.unknown.length ? ' · Uncertain after a Condition, Call or custom source; these are not evaluated.' : ''}`; }
    }
  }
  function stageTracks(parent: HTMLElement) {
    const layout = el('div', 'sr-tracks-layout'); const top = el('div', 'sr-tracks-workspace'); if (!focused) top.append(preview()); top.append(inspector()); layout.append(top);
    const dock = el('section', 'sr-tracks'); dock.ariaLabel = 'Stage tracks'; const heading = el('header', 'sr-track-heading'); heading.append(el('strong', '', 'Stage tracks'));
    const bands = el('div', 'sr-track-branches'); const route = columns(scene(), visibleBranches);
    for (const { beat: b } of route.filter(c => c.beat.kind === 'condition')) {
      const band = el('div', 'sr-track-band'); band.append(el('span', '', `${number(b.id)} Condition · show:`));
      for (const branch of b.branches) { const button = action(`${branch.name} ${branch.condition}`.trim(), () => openBranch(b, branch), false, `open-branch-${branch.id}`); button.title = `Show ${branch.name} ${branch.condition} in tracks`.trim(); button.ariaPressed = String(visibleBranches.get(b.id) === branch.id); band.append(button); }
      if (visibleBranches.has(b.id)) band.append(action(`Hide ${number(b.id)} branches`, () => { visibleBranches.delete(b.id); selected = b.id; reelBranch = ''; draw(); focusSelected(); }, false, `hide-branches-${b.id}`));
      const branch = b.branches.find(branch => branch.id === visibleBranches.get(b.id)); if (branch && !branch.beats.length) band.append(action(`+ Add beat to ${branch.name}`, () => picker(branch.beats, [...locate(scene(), b.id)!.trail, `${branch.name} ${branch.condition}`.trim()], 0))); bands.append(band);
    }
    heading.append(bands, el('span', 'sr-track-legend', 'Fill: shown · Dashed: uncertain'), action(allTracks ? 'Show 2 tracks' : 'Show all tracks', () => { allTracks = !allTracks; draw(); }, false, 'all-tracks')); dock.append(heading);
    const scroll = el('div', 'sr-tracks-scroll'); const grid = el('div', 'sr-track-grid'); grid.role = 'group'; grid.ariaLabel = 'Beats in story order'; grid.dataset.orientation = focused ? 'vertical' : 'horizontal';
    const labels = el('div', 'sr-track-labels'); labels.ariaHidden = 'true'; const titles = ['Beat', 'Background', 'Characters', wordsOnly() ? 'Beat content' : 'Words', 'Sound', 'Flow / state']; titles.forEach((title, i) => labels.append(el('span', `sr-track-label sr-track-${i}`, title))); grid.append(labels);
    const wrappers = new Map<string, HTMLElement>(), inserts: { owner: Beat; after: string; control: HTMLElement }[] = [];
    for (const [i, column] of route.entries()) {
      const { beat: b, body, trail, index } = column; const wrapper = el('div', 'sr-track-column'); wrapper.role = 'presentation';
      const button = action('', () => innerWidth < 900 ? editBeat(b.id) : selectBeat(b.id, true), false, 'track-beat'); button.className = 'sr-track-beat'; button.ariaCurrent = b.id === selected ? 'true' : null; button.dataset.selected = String(b.id === selected); button.dataset.trackBeat = b.id; button.dataset.beatKind = b.kind; button.tabIndex = b.id === selected ? 0 : -1;
      titles.forEach((_title, track) => { const cell = el('span', `sr-track-cell sr-track-${track}`); cell.dataset.track = String(track); if (track === 3) cell.append(el('span', 'sr-track-copy')); button.append(cell); }); button.onkeydown = e => navigateBeat(e, route.map(c => c.beat), i); wrapper.append(button);
      if (!['choice', 'jump', 'return'].includes(b.kind)) { const add = gap(body, trail, index + 1); add.classList.add('sr-track-insert'); add.ariaLabel = `Add after ${name(b.id)}${b.kind === 'condition' ? ' and its branches' : ''}`; add.title = add.ariaLabel; let last = i; if (b.kind === 'condition') while (route[last + 1] && route[last + 1]!.depth > column.depth) last++; inserts.push({ owner: b, after: route[last]!.beat.id, control: add }); }
      wrappers.set(b.id, wrapper); grid.append(wrapper);
    }
    for (const { owner, after, control } of inserts) { const wrapper = wrappers.get(after)!; if (owner.id !== after) { control.textContent = `+ after ${number(owner.id)}`; control.classList.add('sr-track-group-insert'); if (!focused) control.style.top = `${24 * (1 + wrapper.querySelectorAll('.sr-track-insert').length)}px`; } wrapper.append(control); }
    scroll.append(grid); dock.append(scroll); layout.append(dock); parent.append(layout);
  }
  function compareBar() {
    const cleanup = prototypeSwitcher(frame.shell, variants, variant, hasChanges, {
      onChange: compare,
      canUseKeys: event => event.target === document.body || event.target === document.documentElement,
      confirmChange: (next, apply) => { const title = variants.find(v => v.id === next)!.title; const dialog = modal(`Switch to ${title}?`, 'switch-layout', true); dialog.append(el('p', '', 'Opens a fresh sample and discards your edits here.')); const stay = action(`Stay in ${variants.find(v => v.id === variant)!.title}`, () => dialog.close(), false, 'cancel-layout'); actions(dialog, [stay, danger(action('Discard edits and switch', () => { dialog.close(); apply(); }, false, 'confirm-layout'))]); stay.focus(); },
    });
    frame.shell.querySelector('.app-footer')!.prepend(frame.shell.querySelector('.sc-prototype-switcher')!); return cleanup;
  }
  function draw() {
    const mark = bookmark(); const selectors = ['.sr-workarea', '.sr-sheet', '.sr-reel-strip', '.sr-tracks-scroll', '.sr-inspector']; const scrolls = selectors.map(selector => { const node = frame.content.querySelector<HTMLElement>(selector); return { selector, top: node?.scrollTop ?? 0, left: node?.scrollLeft ?? 0 }; });
    syncSelection(); const selectionChanged = renderedSelection !== selected, focusChanged = renderedFocused !== focused; frame.content.replaceChildren(); Object.assign(frame.content.dataset, { variant, focused: String(focused), treeOpen: String(treeOpen), stageExpanded: String(stageExpanded), allTracks: String(allTracks), edits: hasChanges() ? String(changes || 1) : '0', selected }); frame.shell.dataset.writingFocus = String(focused);
    const workspace = el('div', 'sr-workspace'); workspace.append(tree()); const main = el('main', 'sr-writing'); main.append(header()); const area = el('div', 'sr-workarea');
    if (variant === 'cue-sheet') cueSheet(area); else if (variant === 'shot-reel') shotReel(area); else stageTracks(area); main.append(area); workspace.append(main); frame.content.append(workspace);
    frame.shell.querySelector('.sr-state')?.remove(); const state = el('details', 'sr-state'); state.append(el('summary', '', 'Prototype state · memory only')); state.ontoggle = () => { if (state.open) { state.querySelector('pre')?.remove(); state.append(el('pre', '', JSON.stringify({ variant, focused, scene: sceneId, selected, manualPreviewBranch: manual, changes, scenes }, null, 2))); } }; frame.shell.querySelector('.app-footer')!.append(state);
    for (const area of host.querySelectorAll<HTMLTextAreaElement>('.sr-prose')) fit(area);
    for (const position of scrolls) { const node = frame.content.querySelector<HTMLElement>(position.selector); if (node) { node.scrollTop = position.top; node.scrollLeft = position.left; } }
    refresh(); if (!selectionChanged || !mark?.owner || mark.owner === selected) restore(mark);
    if (focusChanged && focused && variant === 'shot-reel') area.scrollTop = 0;
    else if (selectionChanged || focusChanged) revealSelection();
    renderedSelection = selected; renderedFocused = focused;
  }
  for (const b of scene().beats) if (b.kind === 'condition' && (variant === 'cue-sheet' || context.state === 'branching')) expanded.add(b.id);
  draw(); status('Fictional sample · changes stay in this preview'); const cleanup = compareBar();
  const key = (event: KeyboardEvent) => {
    if (event.isComposing) return;
    if (event.key === 'Escape' && !host.querySelector('dialog[open]')) { const open = host.querySelector<HTMLDetailsElement>('.sr-more[open],.sr-row-menu[open]'); if (open) { open.open = false; open.querySelector<HTMLElement>('summary')?.focus(); event.preventDefault(); } else if (treeOpen) { treeOpen = false; draw(); host.querySelector<HTMLElement>('[data-action="scenes"]')?.focus(); event.preventDefault(); } else if (stageObject) { const object = stageObject; stageObject = ''; draw(); host.querySelector<HTMLElement>(object === 'background' ? '.sr-backdrop-control' : `[data-stage-character="${object}"]`)?.focus(); } }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !(event.target as Element).closest('input,textarea,select,dialog')) { event.preventDefault(); history(event.shiftKey ? redo : undo, event.shiftKey ? undo : redo, event.shiftKey ? 'Redid' : 'Undid'); }
  };
  const outside = (event: MouseEvent) => { for (const menu of host.querySelectorAll<HTMLDetailsElement>('.sr-more[open],.sr-row-menu[open]')) if (!menu.contains(event.target as Node)) menu.open = false; };
  let resizeFrame = 0; const resize = () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(draw); };
  document.addEventListener('keydown', key); document.addEventListener('click', outside); window.addEventListener('resize', resize);
  if (compare) for (const button of frame.shell.querySelectorAll<HTMLButtonElement>('.lp-navigation .tree-item,.brand,.lp-studio-link,.lp-runtime-link')) button.onclick = () => status('Other workspaces are outside this Story mock.');
  return () => { cleanup(); document.removeEventListener('keydown', key); document.removeEventListener('click', outside); window.removeEventListener('resize', resize); cancelAnimationFrame(resizeFrame); host.replaceChildren(); };
}
