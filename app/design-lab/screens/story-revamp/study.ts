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
import './combined.css';
import './combined-revision.css';
import { backgrounds as artBackgrounds, sprite, characterColour, characters, expressions, music, sounds } from './combined-art.ts';
import { beatIcon } from './combined-icons.ts';
import { operations, parseFormula, isProblem, check, after, show, python as formulaPython, type Operation, type NumberType } from './combined-arithmetic.ts';

export type Variant = 'cue-sheet' | 'shot-reel' | 'stage-tracks' | 'combined';
export const variants = [{ id: 'cue-sheet', title: 'Cue sheet' }, { id: 'shot-reel', title: 'Shot reel' }, { id: 'stage-tracks', title: 'Stage tracks' }, { id: 'combined', title: 'Story combined' }] as const;

/** Disposable, fictional Story authoring study. No project, native or provider calls. */
export function mountStudy(host: HTMLElement, context: LabContext, variant: Variant, compare?: (variant: Variant) => void) {
  const combined = variant === 'combined';
  let bottomMode: 'tracks' | 'reel' = 'tracks';
  if (combined) { try { if (sessionStorage.getItem('story-combined-bottom') === 'reel') bottomMode = 'reel'; } catch { /* File previews can refuse session storage. */ } }
  const sample = makeSample(context.state);
  let scenes = sample.scenes, sceneId = scenes[0]!.id;
  if (context.state === 'protected') scenes[0]!.beats.splice(5, 0, sample.beat('customCode', '$ tram_clock.advance()'));
  /** Illustrative Choice preview, kept apart from the story and its Undo history. Keyed by option identity. */
  const previewOptions = new Map<string, { truth?: 'true' | 'false'; picked?: boolean }>();
  if (combined) {
    const line = (speaker: string, text: string) => { const b = sample.beat(speaker === 'Narration' ? 'narration' : 'dialogue', text); if (speaker !== 'Narration') b.speaker = speaker; return b; };
    const go = (kind: 'jump' | 'call', target: string, repeat = false) => { const b = sample.beat(kind); b.target = target; if (repeat) b.repeat = true; return b; };
    const assign = (variable: string, operation: Operation, value: string, protectedSource = false) => { const b = sample.beat('setVariable'); b.text = variable; b.operation = operation; b.value = value; b.protectedSource = protectedSource; return b; };
    const background = (asset: string) => { const b = sample.beat('background'); b.asset = asset; return b; };
    const menu = (id: string, prompt: [string, string] | undefined, options: { text: string; guard?: string; whenFalse?: 'hide' | 'disable'; beats: Beat[] }[], picked?: 'mark' | 'hide') => {
      const b = sample.beat('choice'); if (prompt) { b.speaker = prompt[0]; b.text = prompt[1]; } if (picked) b.picked = picked;
      b.options = options.map((o, i) => ({ text: o.text, target: '', guard: o.guard ?? '', whenFalse: o.whenFalse, body: `${id}-${i + 1}` }));
      b.branches = options.map((o, i) => ({ id: `${id}-${i + 1}`, name: `Option ${i + 1}`, condition: '', beats: o.beats })); return b;
    };
    const first = scenes[0]!, at = first.beats.findIndex(b => b.kind === 'choice');
    if (at >= 0) {
      first.beats[at] = menu('board', ['Eli', 'Last call. Are you getting on?'], [
        { text: 'Get on', beats: [assign('boarded', 'set', 'true')] },
        { text: 'Stay on the platform', beats: [] },
        { text: 'Show the gold ticket', guard: 'has_ticket is true', whenFalse: 'disable', beats: [line('Eli', 'Gold. I have not seen one of those in years.'), go('call', 'stranger'), line('Narration', 'When you look down, the ticket has been punched.')] },
        { text: 'Follow the lamplighter', guard: 'met_eli is true', whenFalse: 'hide', beats: [go('jump', 'departure')] },
      ]);
      first.beats.push(line('Narration', 'The doors close, and the tram pulls away into the rain.'));
      previewOptions.set('board-3', { truth: 'false' }); previewOptions.set('board-4', { truth: 'false' });
    }
    const stranger = scenes.find(s => s.id === 'stranger');
    if (stranger) {
      stranger.beats[0]!.speaker = 'Eli'; stranger.beats.unshift(background('Tram interior'));
      const ticket = sample.beat('condition'); ticket.branches = [{ id: 'ask-ticket-if', name: 'If', condition: 'has_ticket is true', beats: [line('Eli', 'Keep it close. It only works once.')] }, { id: 'ask-ticket-else', name: 'Otherwise', condition: '', beats: [line('Eli', 'Then you will need another way on.')] }];
      const goodbye = menu('goodbye', undefined, [{ text: 'Wave goodbye', beats: [line('Narration', 'He lifts his hat as the doors open.')] }, { text: 'Just go', beats: [] }]);
      stranger.beats.splice(2, 0, menu('ask', ['Narration', 'What do you ask him?'], [
        { text: 'Ask about the station', beats: [line('Eli', 'It was built for people who never left.'), go('jump', '', true)] },
        { text: 'Ask about the ticket', beats: [ticket, go('jump', '', true)] },
        { text: 'Ask about the station', beats: [line('Eli', 'Ask the driver. He remembers every stop.'), go('jump', '', true)] },
        { text: 'Leave', beats: [goodbye] },
      ], 'mark'));
      previewOptions.set('ask-1', { picked: true });
    }
    const departure = scenes.find(s => s.id === 'departure');
    if (departure) departure.beats.splice(0, departure.beats.length - 1, background('Station at dawn'), departure.beats[0]!, assign('trust', 'set', '2'), assign('trust', 'add', '1'), assign('coins', 'multiply', 'bonus'), assign('fare', 'divide', '2'), assign('trust', 'set', 'max(0, trust - 1)', true));
    for (const s of scenes) for (const b of flatten(s.beats)) if (b.kind === 'choice') prepareChoice(b, `${b.id}-option`);
  }
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
  frame.shell.classList.add('sr-shell'); frame.shell.classList.toggle('sc-combined-shell', combined); frame.content.classList.add('sr-content'); frame.heading.hidden = true;
  frame.shell.querySelector<HTMLElement>('.lp-project-shell')!.dataset.navigationCollapsed = 'true';
  const scene = () => scenes.find(s => s.id === sceneId)!;
  const current = () => flatten(scene().beats).find(b => b.id === selected);
  const number = (id = selected) => beatNumber(scene(), id);
  const name = (id = selected) => beatName(scene(), id);
  const contextName = (id = selected) => { const trail = (ancestry(scene(), id) ?? []).map(p => `${p.branch.name} ${p.branch.condition}`.trim()).join(' › '); return `${name(id)}${trail ? ' in ' + trail : ''}`; };
  const brief = (b: Beat) => { if (combined && b.kind === 'return') return 'Return to the caller, or the main menu'; if (combined && b.kind === 'jump' && b.repeat) return 'Repeat its Choice'; const branch = combined && b.kind === 'condition' ? b.branches.find(branch => branch.id === visibleBranches.get(b.id)) ?? b.branches[0] : undefined; return branch ? branchLabel(branch) : modelBrief(b, scenes); };
  type VariableType = 'flag' | 'number' | 'decimal' | 'text';
  const numeric = (type?: VariableType) => type === 'number' || type === 'decimal';
  interface StoryVariable { name: string; type: VariableType; initial: string }
  let projectVariables: StoryVariable[] = [{ name: 'has_ticket', type: 'flag', initial: 'false' }, { name: 'met_eli', type: 'flag', initial: 'false' }, { name: 'trust', type: 'number', initial: '0' }, { name: 'route', type: 'text', initial: 'platform' }, ...(combined ? [{ name: 'boarded', type: 'flag', initial: 'false' }, { name: 'coins', type: 'number', initial: '12' }, { name: 'bonus', type: 'number', initial: '2' }, { name: 'fare', type: 'decimal', initial: '2.5' }] as StoryVariable[] : [])];
  const snapshot = () => JSON.stringify({ scenes, sceneId, selected, ...(combined ? { visibleBranches: [...visibleBranches], reelBranch, variables: projectVariables } : {}) });
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
    const data = JSON.parse(previous.data) as { scenes: Scene[]; sceneId: string; selected: string; visibleBranches?: [string, string][]; reelBranch?: string; variables?: StoryVariable[] };
    scenes = data.scenes; sceneId = data.sceneId; selected = data.selected; stageObject = ''; manual = '';
    if (combined) { visibleBranches.clear(); for (const [owner, branch] of data.visibleBranches ?? []) visibleBranches.set(owner, branch); reelBranch = data.reelBranch ?? ''; if (data.variables) projectVariables = data.variables; }
    draw(); status(`${verb}: ${previous.name}`); if (hadFocus && document.activeElement === document.body) focusSelected();
  }
  function syncSelection() {
    if (combined) {
      const owners = scenes.flatMap(s => flatten(s.beats));
      for (const [owner, branch] of visibleBranches) if (!owners.find(b => b.id === owner)?.branches.some(b => b.id === branch)) visibleBranches.delete(owner);
    }
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
    const menu = combined && !manual ? current() : undefined;
    if (menu?.kind === 'choice' && menu.text.trim()) return { ...menu, kind: menu.speaker === 'Narration' ? 'narration' as const : 'dialogue' as const };
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
  function isEnding(kind: string) { return (combined ? ['jump', 'return'] : ['choice', 'jump', 'return']).includes(kind); }
  function ending(body: Beat[]) { return body.findIndex(b => isEnding(b.kind)); }
  function defaultIndex(body = scene().beats) { const end = ending(body); return end < 0 ? body.length : end; }
  function target() {
    const position = locate(scene(), selected), branch = variant !== 'cue-sheet' ? reelContext() : undefined;
    return branch && position?.body !== branch.branch.beats ? { body: branch.branch.beats, trail: branch.trail, index: defaultIndex(branch.branch.beats) } : { body: position?.body ?? scene().beats, trail: position?.trail ?? [scene().name], index: Math.min(position ? position.index + 1 : defaultIndex(), defaultIndex(position?.body)) };
  }
  function currentTrail(body: Beat[], fallback: string[]) {
    if (!combined) return fallback;
    if (body === scene().beats) return [scene().name];
    for (const owner of flatten(scene().beats)) for (const branch of owner.branches) {
      if (branch.beats === body) return [...locate(scene(), owner.id)!.trail, branchLabel(branch)];
    }
    return fallback;
  }
  function targetText(body: Beat[], trail: string[], requested: number) {
    trail = currentTrail(body, trail);
    const index = Math.min(requested, defaultIndex(body));
    const anchor = body[index], previous = body[index - 1];
    return `Adds to ${trail.join(' › ')}${combined && previous ? `, after ${name(previous.id)}${previous.kind === 'condition' ? ' and its branches' : ''}` : anchor ? `, before ${name(anchor.id)}` : previous ? `, after ${name(previous.id)}` : ', as its first beat'}`;
  }
  type Bookmark = { editor?: boolean; owner?: string; action?: string; label?: string; choice?: number; start?: number | null; end?: number | null };
  function bookmark(node = document.activeElement): Bookmark | undefined {
    if (!(node instanceof HTMLElement) || !host.contains(node)) return;
    const owner = node.closest<HTMLElement>('[data-beat],[data-editor-for],[data-reel-beat],[data-track-beat]');
    const option = node.closest<HTMLElement>('[data-choice-index]');
    return { editor: combined && !!owner?.dataset.editorFor, owner: owner?.dataset.beat ?? owner?.dataset.editorFor ?? owner?.dataset.reelBeat ?? owner?.dataset.trackBeat, action: node.dataset.action, label: node.getAttribute('aria-label') ?? undefined, choice: option ? Number(option.dataset.choiceIndex) : undefined, start: node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement ? node.selectionStart : undefined, end: node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement ? node.selectionEnd : undefined };
  }
  function restore(mark?: Bookmark) {
    if (!mark) return;
    const owner = mark.editor && mark.owner ? host.querySelector<HTMLElement>(`[data-editor-for="${mark.owner}"]`) : mark.owner ? host.querySelector<HTMLElement>(`[data-beat="${mark.owner}"],[data-editor-for="${mark.owner}"],[data-reel-beat="${mark.owner}"],[data-track-beat="${mark.owner}"]`) : undefined;
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
      if (id) activateBeat(id); revealGameOption(control);
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
      if (combined && focused) revealSelection();
    });
  }
  function input(value: string, title: string, update: (value: string) => void) { const control = el('input'); control.value = value; control.ariaLabel = title; if (title.endsWith(' condition')) control.placeholder = 'e.g. trust is at least 5'; bind(control, update); return control; }
  function select(values: readonly string[], value: string, title: string, update: (value: string) => void) {
    const control = el('select'); control.ariaLabel = title;
    for (const v of [...new Set([value, ...values])]) control.append(new Option(v, v));
    control.value = value; bind(control, update); return control;
  }
  function fit(area: HTMLTextAreaElement) { const row = area.closest<HTMLElement>('[data-beat]'); const active = !row || row.dataset.selected === 'true'; area.style.height = 'auto'; area.style.height = `${Math.max(active ? 52 : 24, area.scrollHeight)}px`; }
  function prose(b: Beat) {
    const text = el('textarea', 'sr-prose'); text.value = b.text; text.rows = 1;
    text.placeholder = b.kind === 'dialogue' ? `Type ${b.speaker}'s line` : 'Type narration'; text.ariaLabel = `${label(b.kind)} text`; text.dataset.beatText = b.id; if (variant === 'cue-sheet') text.setAttribute('aria-describedby', `sr-number-${b.id}`);
    bind(text, value => b.text = value);
    text.addEventListener('keydown', event => {
      if (event.isComposing) return;
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'Enter') { event.preventDefault(); const owner = locate(scene(), b.id)!; insert(combined && b.kind === 'narration' ? 'narration' : 'dialogue', owner.body, owner.trail, owner.index + 1, nextSpeaker(b.id)); }
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
  function actions(dialog: HTMLDialogElement, buttons: HTMLButtonElement[]) { if (combined) dialog.querySelector('[data-action=close-dialog]')?.remove(); const footer = el('footer', 'sr-dialog-actions'); footer.append(...buttons); dialog.append(footer); }
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
    dialog.append(el('p', 'sr-dialog-context', done ? `Option ${(choiceIndex ?? 0) + 1} "${choiceText ?? ''}" will lead here.${replaces ? ' It currently goes to ' + replaces + '. The new scene replaces that destination; ' + replaces + ' is kept.' : ''} You stay in this scene.` : 'Opens with an empty narration line.'));
    nameForm(dialog, '', value => {
      if (!done) { sceneSelections.set(sceneId, selected); caller = undefined; }
      const next: Scene = { id: sample.newId(), name: value, chapter: chapter.value, beats: [sample.beat('narration'), sample.beat('return')] };
      change(() => { stageExpanded = false; scenes.push(next); treeOpen = false; if (done) done(next); else { sceneId = next.id; selected = next.beats[0]!.id; reelBranch = ''; manual = ''; } }, `Create scene ${value}`);
      dialog.close(); focusText();
    }, done ? `Create scene and link option ${(choiceIndex ?? 0) + 1}` : 'Create and open scene', extra);
  }
  function renameScene() {
    const dialog = modal('Rename scene', 'rename-scene'); nameForm(dialog, scene().name, value => { change(() => scene().name = value, `Rename scene to ${value}`); dialog.close(); }, 'Rename scene');
  }
  function insert(kind: Kind, body: Beat[], trail: string[], requested: number, speaker = 'Mara', replaceEmpty?: Beat, initial?: Partial<Beat>) {
    trail = currentTrail(body, trail);
    const endsBody = isEnding(kind); const before = endsBody && ending(body) < 0 ? body.length : Math.min(requested, defaultIndex(body)); const oldEnding = endsBody && ending(body) >= 0 ? body[ending(body)] : undefined;
    const where = oldEnding ? `Replace ${name(oldEnding.id)}${oldEnding.kind === 'choice' ? ` and its ${count(oldEnding.options.length, 'option')}` : ''} with ${label(kind)}` : `${label(kind)} ${targetText(body, trail, before).replace('Adds to ', 'added to ')}`;
    const b = sample.beat(kind); b.speaker = speaker === 'Narration (no speaker)' ? 'Mara' : speaker; Object.assign(b, initial);
    if (kind === 'condition') b.branches = [{ id: sample.newId(), name: 'If', condition: '', beats: [] }, { id: sample.newId(), name: 'Otherwise', condition: '', beats: [] }];
    if (kind === 'choice' && combined) prepareChoice(b);
    change(() => {
      if (replaceEmpty && body[before] === replaceEmpty && !replaceEmpty.text.trim()) body.splice(before, 1);
      if (oldEnding) body.splice(ending(body), 1, b); else body.splice(Math.min(before, defaultIndex(body)), 0, b);
      selected = b.id; stageObject = ''; manual = ''; stageExpanded = false;
      if (kind === 'condition') expanded.add(b.id);
    }, kind === 'background' ? `${where} · Characters shown earlier are cleared.` : where);
    if (combined) status(`${oldEnding ? 'Replaced ending with' : 'Added'} ${name(b.id)} in ${trail.join(' › ')}${kind === 'background' ? '. Characters shown earlier are cleared.' : ''}`);
    focusText();
  }
  function picker(body = scene().beats, trail = [scene().name], requested = defaultIndex(body), replaceEmpty?: Beat) {
    if (combined) { combinedPicker(body, currentTrail(body, trail), requested, replaceEmpty); return; }
    const index = Math.min(requested, defaultIndex(body)); const dialog = modal('Add a beat', 'beat-picker'); dialog.classList.add('sr-picker-dialog');
    const insertionTarget = el('p', 'sr-insertion-target'); dialog.append(insertionTarget);
    const query = el('input'); query.type = 'search'; query.placeholder = 'Find dialogue, background, music, choices…'; query.ariaLabel = 'Find a beat'; query.dataset.pickerSearch = '';
    const results = el('div', 'sr-picker-results'); results.id = `sr-results-${++elementId}`; results.role = 'listbox'; results.ariaLabel = 'Matching beat types'; query.role = 'combobox'; query.setAttribute('aria-autocomplete', 'list'); query.setAttribute('aria-expanded', 'true'); query.setAttribute('aria-controls', results.id); let active = 0;
    function highlight() {
      const kind = results.querySelectorAll<HTMLElement>('[data-insert-kind]')[active]?.dataset.insertKind; const end = ending(body) >= 0 ? body[ending(body)] : undefined;
      insertionTarget.textContent = kind && ['choice', 'jump', 'return'].includes(kind) ? end ? `Replaces ${name(end.id)} in ${trail.join(' › ')}` : `Goes last in ${trail.join(' › ')}` : replaceEmpty ? `Replaces empty line ${number(replaceEmpty.id)} in ${trail.join(' › ')}` : targetText(body, trail, index); const buttons = [...results.querySelectorAll<HTMLButtonElement>('button[data-insert-kind]')]; buttons.forEach((button, i) => { button.dataset.highlighted = String(i === active); button.ariaSelected = String(i === active); }); if (buttons[active]) query.setAttribute('aria-activedescendant', buttons[active]!.id); else query.removeAttribute('aria-activedescendant'); }
    function filter() {
      results.replaceChildren(); active = 0;
      const search = query.value.toLowerCase().trim();
      const aliases: Partial<Record<Kind, string>> = { condition: 'if else branch test', placement: 'placement move position', call: 'shared conversation returns', choice: 'menu options decision', setVariable: 'flag counter value', showScreen: 'panel', callScreen: 'dialog' };
      const rank = (title: string) => { const name = title.toLowerCase(); return name === search ? 0 : name.startsWith(search) ? 1 : name.includes(search) ? 2 : 3; };
      const matched = kinds.filter(([kind, title, category]) => `${kind} ${title} ${category} ${aliases[kind] ?? ''}`.toLowerCase().includes(search)).sort((a, b) => rank(a[1]) - rank(b[1]));
      for (const category of new Set(matched.map(k => k[2]))) {
        const section = el('section'); section.role = 'group'; section.ariaLabel = category === 'Flow' ? 'Choices and logic' : category; section.append(el('h3', '', section.ariaLabel));
        for (const [kind, title] of matched.filter(k => k[2] === category)) {
          const button = action(title, () => { dialog.close(); insert(kind, body, trail, index, current()?.speaker, replaceEmpty); }, false, `insert-${kind}`); button.dataset.insertKind = kind; const choose = () => { active = [...results.querySelectorAll<HTMLElement>('[data-insert-kind]')].indexOf(button); highlight(); }; button.onpointerenter = choose; button.onfocus = choose; button.role = 'option'; button.tabIndex = -1; button.id = `sr-result-${++elementId}`; if (kind === 'background') { const note = el('small', '', 'Clears characters shown earlier.'); note.id = `sr-warning-${++elementId}`; button.setAttribute('aria-describedby', note.id); button.title = 'Add a background. Characters shown earlier are cleared.'; button.append(note); }
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
    const clamped = Math.min(index, defaultIndex(body)); const button = action('+', () => picker(body, trail, clamped), false, `insert-gap-${trail.join('/')}-${clamped}`); button.className = 'sr-gap'; if (combined) button.dataset.gapBefore = body[clamped - 1]?.id ?? ''; button.ariaLabel = targetText(body, trail, clamped); button.title = button.ariaLabel; button.tabIndex = variant === 'cue-sheet' && body[index - 1]?.id === selected ? 0 : -1; return button;
  }
  function moveTo(b: Beat) {
    const owner = locate(scene(), b.id)!; const dialog = modal(`Move ${name(b.id)}`, 'move-beat');
    const choices: { body: Beat[]; trail: string[] }[] = [];
    if (owner.body !== scene().beats) choices.push({ body: scene().beats, trail: [scene().name] });
    function visit(body: Beat[], trail: string[]) { for (const parent of body) if (parent !== b) for (const branch of parent.branches) { const path = [...trail, `${branch.name} ${branch.condition}`.trim()]; if (branch.beats !== owner.body) choices.push({ body: branch.beats, trail: path }); visit(branch.beats, path); } }
    visit(scene().beats, [scene().name]); const destination = el('select'); destination.ariaLabel = 'Move to'; choices.forEach((c, i) => destination.append(new Option(c.trail.join(' › '), String(i))));
    dialog.append(el('blockquote', '', brief(b)), el('p', '', `It goes last, before any ${combined ? 'Jump or Return' : 'Choice, Jump or Return'}.${b.kind === 'condition' ? ' Its branches move with it.' : ''}`), labelled('Move to', destination));
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
    const controls = el('div', 'sr-row-popover'); const owner = locate(scene(), b.id)!; const locked = b.kind === 'customCode' || isEnding(b.kind);
    for (const [delta, title] of [[-1, 'Move earlier'], [1, 'Move later']] as const) { const neighbour = owner.body[owner.index + delta]; const button = action(title, () => { change(() => { owner.body.splice(owner.index, 1); owner.body.splice(owner.index + delta, 0, b); selected = b.id; }, `${title}: ${name(b.id)}`); focusSelected(); }, false, `move-${delta}`); button.disabled = locked || !neighbour || neighbour.kind === 'customCode' || isEnding(neighbour.kind); if (button.disabled) button.title = locked ? 'This beat stays at its source position.' : !neighbour ? 'There is no beat in that direction.' : 'Cannot move past a scene ending or protected source.'; controls.append(button); }
    const move = action('Move to another branch…', () => moveTo(b)); move.disabled = locked; if (locked) move.title = 'This beat stays at its source position.';
    const remove = action(`Delete ${name(b.id)}${b.kind === 'choice' ? ' and its ' + count(b.options.length, 'option') : ''}`, () => removeBeat(b)); remove.disabled = b.kind === 'customCode' || locked && owner.trail.length === 1; if (remove.disabled) remove.title = b.kind === 'customCode' ? 'Protected source is read-only in this mock.' : 'Replace this ending through Add a beat.';
    controls.prepend(action(`Add beat before ${number(b.id)}`, () => picker(owner.body, owner.trail, owner.index))); controls.append(move, remove, action('View source', () => source(b)));
    if (b.kind === 'condition' && !combined) controls.append(action('Add Else if', () => addElseIf(b)));
    if (combined && locked) controls.prepend(el('p', 'sr-explanation', b.kind === 'customCode' ? 'Protected source cannot be moved or deleted here. You can add beats around it or view its source.' : 'This ending stays last. Use Add a beat to replace it.'));
    if (combined) { remove.classList.add('sc-menu-delete'); controls.append(remove); }
    menu.append(controls);
    const place = () => { if (!menu.open) { delete menu.dataset.placed; return; } const r = summary.getBoundingClientRect(), box = controls.getBoundingClientRect(); controls.style.left = `${Math.max(8, Math.min(innerWidth - box.width - 8, r.right - box.width))}px`; controls.style.top = `${Math.max(8, Math.min(innerHeight - box.height - 8, r.bottom + 4))}px`; menu.dataset.placed = 'true'; };
    summary.onclick = event => { event.preventDefault(); const open = !menu.open; closeMenus(); menu.open = open; place(); };
    menu.ontoggle = place; return menu;
  }
  function destination(value: string, title: string, update: (value: string) => void) { const control = el('select'); control.ariaLabel = title; for (const s of scenes) control.append(new Option(s.name, s.id)); control.value = value; bind(control, update); return control; }
  // Combined beat editors: pictures for assets, switches for short choices and a picker sheet for long lists.
  type SheetKind = 'background' | 'expression' | 'destination';
  let assetSheet: { beat: string; kind: SheetKind; option?: number } | undefined, sheetHover = '', openGuard = '';
  const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  function field(title: string, ...children: (Node | string)[]) { const node = el('div', 'sc-field'); node.role = 'group'; node.ariaLabel = title; node.append(el('span', 'sc-field-label', title), ...children); return node; }
  function avatar(person: string, expression = 'Neutral') { const node = el('span', 'sc-avatar'); node.ariaHidden = 'true'; if (person === 'Narration') node.append(beatIcon('narration')); else { node.style.backgroundImage = `url("${sprite(person, expression)}")`; } node.style.setProperty('--ring', characterColour(person)); return node; }
  function segmented(values: readonly string[], value: string, title: string, update: (value: string) => void, keys: readonly string[] = values) {
    const node = el('div', 'sc-segmented'); node.role = 'radiogroup'; node.ariaLabel = title;
    const buttons = values.map((v, i) => { const button = action(v, () => { if (v !== value) change(() => update(v), `${title}: ${keys[i]} · ${name()}`); }, false, `${slug(title)}-${slug(keys[i]!)}`); button.role = 'radio'; button.ariaChecked = String(v === value); button.tabIndex = v === value ? 0 : -1; return button; });
    buttons.forEach((button, i) => button.onkeydown = event => { const step = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0; if (!step) return; event.preventDefault(); buttons[(i + step + buttons.length) % buttons.length]!.click(); });
    node.append(...buttons); return node;
  }
  /** A list menu with portraits, for speakers and characters. */
  function personPicker(b: Beat, title: string, people: string[], value: string, choose: (person: string) => void) {
    const menu = el('details', 'sc-dropdown'); const summary = el('summary', 'sc-person'); summary.dataset.action = slug(title); summary.ariaLabel = `${title}: ${value}`;
    const person = value === 'Narration (no speaker)' ? 'Narration' : value;
    summary.append(avatar(person), el('span', 'sc-person-name', person === 'Narration' ? 'Narration · no speaker' : person), el('span', 'sc-caret', '▾')); summary.style.setProperty('--person', characterColour(person));
    const list = el('div', 'sc-dropdown-list'); list.role = 'listbox'; list.ariaLabel = title;
    for (const option of people) {
      const who = option === 'Narration (no speaker)' ? 'Narration' : option;
      const item = action('', () => { menu.open = false; if (option !== value) change(() => choose(option), `${title}: ${who} · ${name(b.id)}`); else summary.focus(); }, false, `${slug(title)}-option-${slug(who)}`);
      item.role = 'option'; item.ariaSelected = String(option === value); item.ariaLabel = who; item.style.setProperty('--person', characterColour(who));
      item.append(avatar(who), el('span', 'sc-person-name', who === 'Narration' ? 'Narration · no speaker' : who)); list.append(item);
    }
    list.onkeydown = event => { const items = [...list.querySelectorAll<HTMLElement>('[role=option]')], i = items.indexOf(document.activeElement as HTMLElement); if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); items[(i + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus(); } if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); menu.open = false; summary.focus(); } };
    menu.ontoggle = () => { if (menu.open) (list.querySelector<HTMLElement>('[aria-selected=true]') ?? list.querySelector<HTMLElement>('[role=option]'))?.focus(); };
    menu.append(summary, list); return field(title, menu);
  }
  function speakerPicker(b: Beat) {
    return personPicker(b, 'Speaker', [...characters, 'Narration (no speaker)'], b.kind === 'narration' ? 'Narration (no speaker)' : b.speaker, value => { b.kind = value === 'Narration (no speaker)' ? 'narration' : 'dialogue'; if (b.kind === 'dialogue') b.speaker = value; });
  }
  function assetRow(b: Beat, kind: 'background' | 'expression') {
    const row = el('div', 'sc-asset-row');
    const picture = el('span', `sc-thumb sc-thumb-${kind}`); picture.ariaHidden = 'true';
    if (kind === 'background') { if (artBackgrounds[b.asset]) picture.style.backgroundImage = `url("${artBackgrounds[b.asset]}")`; else picture.classList.add('sc-thumb-black'); }
    else picture.style.backgroundImage = `url("${sprite(b.speaker, b.asset)}")`;
    const text = el('span', 'sc-asset-text'); text.append(el('strong', '', b.asset === 'Black' ? 'Black screen' : b.asset), el('span', '', kind === 'background' ? 'Clears characters from the stage' : `${expressions.length} expressions for ${b.speaker}`));
    const open = action('Change', () => { assetSheet = { beat: b.id, kind }; sheetHover = ''; draw(); }, false, `change-${kind}`); open.ariaLabel = `Change ${kind === 'background' ? 'background' : `${b.speaker}'s expression`}: ${b.asset}`;
    row.append(picture, text, open); return field(kind === 'background' ? 'Background' : 'Expression', row);
  }
  function sheetValues(kind: 'background' | 'expression') { return kind === 'background' ? ['Black', ...Object.keys(artBackgrounds)] : [...expressions]; }
  /** The sheet over the sidebar: search, a grid of picture tiles and arrow-key movement. */
  function pickerSheet(kind: SheetKind, title: string, searchLabel: string, keep: string, tiles: HTMLButtonElement[], hint: string, ...extra: Node[]) {
    const sheet = el('section', 'sc-sheet'); sheet.role = 'dialog'; sheet.ariaLabel = title; sheet.dataset.sheet = kind;
    const head = el('header', 'sc-sheet-head'); const close = action('', () => closeSheet(), false, 'close-sheet'); close.ariaLabel = close.title = `Close and keep ${keep}`; close.append(beatIcon('close')); head.append(el('h3', '', title), close);
    const search = el('input', 'sc-sheet-search'); search.type = 'search'; search.placeholder = searchLabel; search.ariaLabel = searchLabel;
    const grid = el('div', `sc-tiles sc-tiles-${kind}`); grid.role = 'listbox'; grid.ariaLabel = title;
    grid.onkeydown = event => { const visible = tiles.filter(t => !t.hidden), i = visible.indexOf(document.activeElement as HTMLButtonElement); const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 2, ArrowUp: -2 }[event.key]; if (step === undefined || i < 0) return; event.preventDefault(); visible[Math.max(0, Math.min(visible.length - 1, i + step))]?.focus(); };
    const empty = el('p', 'sc-sheet-empty', 'No matches. Clear the search to see everything.'); empty.hidden = true;
    search.oninput = () => { const q = search.value.trim().toLowerCase(); for (const tile of tiles) tile.hidden = !!q && !tile.textContent!.toLowerCase().includes(q); empty.hidden = tiles.some(t => !t.hidden); };
    search.onkeydown = event => { if (event.key === 'ArrowDown') { event.preventDefault(); tiles.find(t => !t.hidden)?.focus(); } };
    sheet.onkeydown = event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeSheet(); } };
    grid.append(...tiles); sheet.append(head, search, grid, empty, ...extra, el('p', 'sc-sheet-hint', hint));
    requestAnimationFrame(() => (tiles.find(t => t.ariaSelected === 'true') ?? tiles[0])?.focus({ preventScroll: true })); return { sheet, grid };
  }
  function sheetTile(value: string, label: string, image: string | undefined, selected: boolean, choose: () => void, detail?: string) {
    const tile = action('', choose, false, `sheet-${slug(value)}`); tile.role = 'option'; tile.ariaSelected = String(selected); tile.dataset.value = value; tile.classList.add('sc-tile'); tile.tabIndex = selected ? 0 : -1;
    const picture = el('span', 'sc-tile-image'); picture.ariaHidden = 'true'; if (image) picture.style.backgroundImage = `url("${image}")`; else picture.classList.add('sc-thumb-black');
    tile.append(picture, el('span', 'sc-tile-name', label)); if (detail) tile.append(el('span', 'sc-tile-detail', detail));
    tile.ariaLabel = `${label}${selected ? ', current' : ''}`; return tile;
  }
  function assetPicker(b: Beat) {
    const kind = assetSheet!.kind as 'background' | 'expression', title = kind === 'background' ? 'Choose a background' : `Choose ${b.speaker}'s expression`, keep = b.asset === 'Black' ? 'Black screen' : b.asset;
    const preview = (value: string) => { if (sheetHover !== value) { sheetHover = value; refresh(); } };
    const tiles = sheetValues(kind).map(value => {
      const tile = sheetTile(value, value === 'Black' ? 'Black screen' : value, kind === 'background' ? artBackgrounds[value] : sprite(b.speaker, value), value === b.asset, () => { const before = b.asset; closeSheet(false); if (value !== before) change(() => b.asset = value, `${kind === 'background' ? 'Background' : `${b.speaker}'s expression`}: ${value} · ${name(b.id)}`); host.querySelector<HTMLElement>(`[data-editor-for="${b.id}"] [data-action="change-${kind}"]`)?.focus(); });
      tile.onpointerenter = () => preview(value); tile.onfocus = () => preview(value); return tile;
    });
    const { sheet, grid } = pickerSheet(kind, title, kind === 'background' ? 'Search backgrounds' : 'Search expressions', keep, tiles, `Point at a picture to preview it on the stage. Click to use it. Esc keeps ${keep}.`);
    grid.onpointerleave = () => { if (!grid.contains(document.activeElement)) { sheetHover = ''; refresh(); } };
    return sheet;
  }
  /** Scenes as pictures: the opening background, the name and the first line. */
  function sceneImage(s?: Scene) { const asset = s?.beats.find(x => x.kind === 'background')?.asset; return asset ? artBackgrounds[asset] : undefined; }
  function openingLine(s?: Scene) { const line = s?.beats.find(x => ['dialogue', 'narration'].includes(x.kind) && x.text.trim())?.text; return line ? `“${line}”` : 'No lines yet'; }
  function scenePicker(b: Beat) {
    const i = assetSheet!.option ?? 0, option = b.options[i]!, jump = b.branches.find(x => x.id === option.body)?.beats.at(-1), keep = scenes.find(s => s.id === jump?.target)?.name ?? 'the current scene';
    const retarget = (id: string) => { const last = b.branches.find(x => x.id === option.body)?.beats.at(-1); if (last?.kind === 'jump') last.target = id; };
    const trigger = () => host.querySelector<HTMLElement>(`[data-editor-for="${b.id}"] [data-action="change-destination-${i}"]`)?.focus();
    const tiles = scenes.map(s => sheetTile(s.name, s.name, sceneImage(s), s.id === jump?.target, () => { closeSheet(false); if (s.id !== jump?.target) change(() => retarget(s.id), `Option ${i + 1} goes to ${s.name} · ${name(b.id)}`); trigger(); }, s.id === sceneId ? 'This scene' : s.chapter));
    const create = action('+ New scene…', () => { closeSheet(false); createScene(s => retarget(s.id), i, option.text); }, false, `new-choice-${i}`); create.classList.add('sc-sheet-new');
    return pickerSheet('destination', `Option ${i + 1} goes to`, 'Search scenes', keep, tiles, `Click a scene to send option ${i + 1} there. Esc keeps ${keep}.`, create).sheet;
  }
  function closeSheet(restoreFocus = true) {
    const sheet = assetSheet; assetSheet = undefined; sheetHover = ''; draw();
    if (restoreFocus && sheet) host.querySelector<HTMLElement>(`[data-editor-for="${sheet.beat}"] [data-action="${sheet.kind === 'destination' ? `change-destination-${sheet.option}` : `change-${sheet.kind}`}"]`)?.focus();
  }
  /** Stage preview while the picker sheet is open. Copies state; the story is unchanged. */
  function withSheetPreview(state: Illustration): Illustration {
    const b = current(); if (!combined || !assetSheet || assetSheet.kind === 'destination' || !sheetHover || !b || b.id !== assetSheet.beat) return state;
    if (assetSheet.kind === 'background') return { ...state, background: { ...(state.background ?? b), asset: sheetHover }, characters: b.kind === 'background' ? new Map() : state.characters };
    const characters = new Map(state.characters), actor = characters.get(b.speaker);
    characters.set(b.speaker, { name: b.speaker, placement: actor?.placement ?? b.placement, from: actor?.from ?? b, asset: sheetHover }); return { ...state, characters };
  }
  function listChoice(values: readonly string[], value: string, title: string, icon: string, update: (value: string) => void) {
    const list = el('div', 'sc-option-list'); list.role = 'radiogroup'; list.ariaLabel = title;
    const buttons = values.map(v => { const button = action('', () => { if (v !== value) change(() => update(v), `${title}: ${v} · ${name()}`); }, false, `${slug(title)}-${slug(v)}`); button.role = 'radio'; button.ariaChecked = String(v === value); button.tabIndex = v === value ? 0 : -1; button.ariaLabel = v; button.append(beatIcon(icon), el('span', '', v)); return button; });
    buttons.forEach((button, i) => button.onkeydown = event => { const step = ['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : ['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : 0; if (!step) return; event.preventDefault(); buttons[(i + step + buttons.length) % buttons.length]!.click(); });
    list.append(...buttons); return field(title, list);
  }
  function note(text: string) { return el('p', 'sr-explanation', text); }
  // Condition builder. Tests stay readable text in the story; rules are parsed from it and written back.
  // Supported: yes/no, whole-number and text variables, same-type = and ≠, number ordering, one All/Any join.
  const operators = [['=', 'is', '=='], ['≠', 'is not', '!='], ['<', 'is less than', '<'], ['≤', 'is at most', '<='], ['>', 'is greater than', '>'], ['≥', 'is at least', '>=']] as const;
  type Rule = { variable: string; op: string; value: string };
  type Test = { join: 'and' | 'or'; rules: Rule[] } | { advanced: string };
  const typeName: Record<VariableType, string> = { flag: 'yes/no', number: 'whole number', decimal: 'decimal', text: 'text' };
  const variableOf = (variableName: string) => projectVariables.find(v => v.name === variableName);
  function parseRule(text: string): Rule | undefined {
    const match = /^([a-z_][a-z0-9_]*) (is not|is less than|is at most|is greater than|is at least|is)(?: (.*))?$/.exec(text.trim()); if (!match) return;
    const variable = variableOf(match[1]!), op = operators.find(o => o[1] === match[2])![0], raw = match[3] ?? ''; if (!variable) return;
    if (variable.type === 'flag') return op === '=' && /^(true|false)$/.test(raw) ? { variable: variable.name, op, value: raw } : undefined;
    if (numeric(variable.type)) return (variable.type === 'number' ? /^(-?\d+)?$/ : /^(-?\d+(\.\d+)?)?$/).test(raw) ? { variable: variable.name, op, value: raw } : undefined;
    const quoted = /^"(.*)"$/.exec(raw); return ['=', '≠'].includes(op) && quoted ? { variable: variable.name, op, value: quoted[1]! } : undefined;
  }
  function parseTest(text: string): Test {
    const t = text.trim(); if (!t) return { join: 'and', rules: [] };
    const hasAnd = / and /.test(t), hasOr = / or /.test(t); if (hasAnd && hasOr) return { advanced: t };
    const join = hasOr ? 'or' : 'and', rules = t.split(` ${join} `).map(parseRule);
    return rules.every(Boolean) ? { join, rules: rules as Rule[] } : { advanced: t };
  }
  function ruleText(rule: Rule) { const variable = variableOf(rule.variable), words = operators.find(o => o[0] === rule.op)![1]; return variable?.type === 'flag' ? `${rule.variable} is ${rule.value}` : variable?.type === 'text' ? `${rule.variable} ${words} "${rule.value}"` : `${rule.variable} ${words}${rule.value ? ' ' + rule.value : ''}`; }
  function rulePython(rule: Rule) { const variable = variableOf(rule.variable), py = operators.find(o => o[0] === rule.op)![2]; return variable?.type === 'flag' ? (rule.value === 'true' ? rule.variable : `not ${rule.variable}`) : variable?.type === 'text' ? `${rule.variable} ${py} ${JSON.stringify(rule.value)}` : `${rule.variable} ${py} ${rule.value || '?'}`; }
  function composeTest(test: { join: 'and' | 'or'; rules: Rule[] }) { return test.rules.map(ruleText).join(` ${test.join} `); }
  function pythonTest(test: { join: 'and' | 'or'; rules: Rule[] }) { return test.rules.map(rulePython).join(` ${test.join} `); }
  function defaultRule(variable: StoryVariable): Rule { return variable.type === 'flag' ? { variable: variable.name, op: '=', value: 'true' } : numeric(variable.type) ? { variable: variable.name, op: '≥', value: variable.type === 'decimal' ? '1.0' : '1' } : { variable: variable.name, op: '=', value: variable.initial }; }
  function typeBadge(type: VariableType) { const badge = el('span', `sc-type sc-type-${type}`, type === 'flag' ? 'Y/N' : type === 'number' ? '#' : type === 'decimal' ? '#.#' : 'Aa'); badge.ariaHidden = 'true'; return badge; }
  /** Variable list with types, defaults and a way to create one in place. */
  function variablePicker(key: string, title: string, current: string, choose: (variable: StoryVariable) => void, filter: (v: StoryVariable) => boolean = () => true) {
    const menu = el('details', 'sc-dropdown sc-variable-picker'); const summary = el('summary', 'sc-person'); summary.dataset.action = key; summary.ariaLabel = `${title}: ${current || 'none chosen'}`;
    const selectedVariable = variableOf(current);
    summary.append(selectedVariable ? typeBadge(selectedVariable.type) : el('span', 'sc-type'), el('span', 'sc-variable-name', current || 'Choose a variable'), el('span', 'sc-caret', '▾'));
    const list = el('div', 'sc-dropdown-list'); list.role = 'listbox'; list.ariaLabel = title;
    for (const variable of projectVariables.filter(filter)) {
      const item = action('', () => { menu.open = false; if (variable.name !== current) choose(variable); else summary.focus(); }, false, `${key}-${variable.name}`);
      item.role = 'option'; item.ariaSelected = String(variable.name === current); item.ariaLabel = `${variable.name}, ${typeName[variable.type]}`;
      const text = el('span', 'sc-variable-text'); text.append(el('span', 'sc-variable-name', variable.name), el('small', '', `${typeName[variable.type]} · starts ${variable.type === 'text' ? `"${variable.initial}"` : variable.initial}`));
      item.append(typeBadge(variable.type), text); list.append(item);
    }
    const create = action('+ New variable…', () => { menu.open = false; newVariable(choose); }, false, `${key}-new`); create.classList.add('sc-dropdown-create'); list.append(create);
    list.onkeydown = event => { const items = [...list.querySelectorAll<HTMLElement>('.button')], i = items.indexOf(document.activeElement as HTMLElement); if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); items[(i + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus(); } if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); menu.open = false; summary.focus(); } };
    menu.ontoggle = () => { if (menu.open) (list.querySelector<HTMLElement>('[aria-selected=true]') ?? list.querySelector<HTMLElement>('.button'))?.focus(); };
    menu.append(summary, list); return menu;
  }
  function newVariable(done: (variable: StoryVariable) => void) {
    const dialog = modal('New variable', 'new-variable'); dialog.classList.add('sc-variable-dialog');
    const nameInput = el('input'); nameInput.ariaLabel = 'Variable name'; nameInput.placeholder = 'e.g. found_letter'; nameInput.autocomplete = 'off'; nameInput.spellcheck = false;
    let type: VariableType = 'flag';
    const types = el('div', 'sc-segmented'); types.role = 'radiogroup'; types.ariaLabel = 'Variable type';
    const initial = el('div', 'sc-variable-initial');
    const drawInitial = () => { initial.replaceChildren(); if (type === 'flag') { const s = el('select'); s.ariaLabel = 'Starts as'; s.append(new Option('false', 'false'), new Option('true', 'true')); initial.append(s); } else { const i = el('input'); i.ariaLabel = 'Starts as'; i.value = type === 'number' ? '0' : type === 'decimal' ? '0.0' : ''; if (numeric(type)) i.inputMode = 'decimal'; initial.append(i); } };
    for (const [value, labelText] of [['flag', 'Yes/no'], ['number', 'Whole number'], ...(combined ? [['decimal', 'Decimal']] as const : []), ['text', 'Text']] as const) { const button = action(labelText, () => { type = value; for (const b of types.children) (b as HTMLElement).ariaChecked = String(b === button); drawInitial(); }, false, `variable-type-${value}`); button.role = 'radio'; button.ariaChecked = String(value === type); types.append(button); }
    drawInitial();
    const error = el('p', 'sc-field-error'); error.role = 'status';
    const reserved = ['and', 'or', 'not', 'if', 'elif', 'else', 'in', 'is', 'for', 'while', 'def', 'class', 'return', 'import', 'from', 'pass', 'true', 'false', 'none', 'mara', 'eli', 'narrator'];
    const create = action('Create variable', () => {
      const variableName = nameInput.value.trim(), start = (initial.querySelector('input,select') as HTMLInputElement).value.trim();
      const problem = !/^[a-z][a-z0-9_]*$/.test(variableName) ? 'Use lowercase letters, numbers and underscores, starting with a letter.' : reserved.includes(variableName) ? 'That name is reserved in Ren\'Py or this project.' : variableOf(variableName) ? 'A variable with that name already exists.' : type === 'number' && !/^-?\d+$/.test(start) ? 'Enter a whole number for the starting value.' : type === 'decimal' && !/^-?\d+(\.\d+)?$/.test(start) ? 'Enter a number such as 2.5 for the starting value.' : '';
      error.textContent = problem; nameInput.ariaInvalid = String(!!problem && !problem.startsWith('Enter')); if (problem) { (problem.startsWith('Enter') ? initial.querySelector<HTMLElement>('input') : nameInput)?.focus(); return; }
      const variable = { name: variableName, type, initial: start }; dialog.close(); change(() => { projectVariables = [...projectVariables, variable]; done(variable); }, `Create variable ${variableName}`);
    }, true, 'create-variable');
    nameInput.onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); create.click(); } };
    dialog.append(labelled('Name', nameInput), field('Type', types), field('Starts as', initial), error, el('p', 'sr-explanation', 'Written as a default statement in the project. Saves and loads with the game.'));
    actions(dialog, [action('Cancel', () => dialog.close(), false, 'cancel-dialog'), create]); nameInput.focus();
  }
  /** Rules joined by All or Any. Anything else stays read-only with Edit in Source. */
  function testBuilder(owner: Beat, key: string, labelText: string, keyword: string, read: () => string, write: (text: string) => void, empty: string) {
    const node = el('div', 'sc-test'); const test = parseTest(read());
    if ('advanced' in test) {
      const code = el('code', 'sc-test-code', `${keyword} ${test.advanced}:`);
      node.append(code, note('This test mixes All and Any, or uses Python the builder cannot show. It stays as written.'), action('Edit in Source', () => source(owner), false, `${key}-source`)); return node;
    }
    const code = el('code', 'sc-test-code'); const drawCode = () => { code.textContent = test.rules.length ? `${keyword} ${pythonTest(test)}:` : empty; code.classList.toggle('sc-test-empty', !test.rules.length); };
    const save = (title: string) => change(() => write(composeTest(test)), `${title} · ${name(owner.id)}`);
    if (test.rules.length > 1) node.append(field('Match', segmented(['All', 'Any'], test.join === 'and' ? 'All' : 'Any', `${labelText} match`, value => { test.join = value === 'All' ? 'and' : 'or'; write(composeTest(test)); })));
    test.rules.forEach((rule, i) => {
      const row = el('div', 'sc-rule'); row.dataset.rule = String(i); const variable = variableOf(rule.variable)!;
      const top = el('div', 'sc-rule-top'); const remove = action('', () => { test.rules.splice(i, 1); save('Remove rule'); }, false, `${key}-rule-${i}-remove`); remove.append(beatIcon('close')); remove.ariaLabel = remove.title = `Remove rule ${i + 1}`;
      top.append(variablePicker(`${key}-rule-${i}-variable`, `${labelText} rule ${i + 1} variable`, rule.variable, chosen => { test.rules[i] = defaultRule(chosen); save(`Test ${chosen.name}`); }), remove);
      const how = el('div', 'sc-rule-how');
      if (variable.type === 'flag') how.append(segmented(['is true', 'is false'], `is ${rule.value}`, `${labelText} rule ${i + 1}`, value => { rule.value = value.slice(3); write(composeTest(test)); }));
      else {
        const ops = numeric(variable.type) ? operators : operators.filter(o => ['=', '≠'].includes(o[0]));
        const switcher = segmented(ops.map(o => o[0]), rule.op, `${labelText} rule ${i + 1} operator`, value => { rule.op = value; write(composeTest(test)); }, ops.map(o => o[1]));
        switcher.classList.add('sc-operators'); ops.forEach((o, j) => { const b = switcher.children[j] as HTMLElement; b.title = o[1]; b.ariaLabel = o[1]; });
        const value = input(rule.value, `${labelText} rule ${i + 1} value`, text => { rule.value = text; write(composeTest(test)); drawCode(); value.ariaInvalid = String(numeric(variable.type) && !(variable.type === 'number' ? /^-?\d+$/ : /^-?\d+(\.\d+)?$/).test(text)); });
        if (numeric(variable.type)) { value.inputMode = 'decimal'; value.ariaInvalid = String(!(variable.type === 'number' ? /^-?\d+$/ : /^-?\d+(\.\d+)?$/).test(rule.value)); } value.placeholder = numeric(variable.type) ? 'Number' : 'Text';
        how.append(switcher, value);
      }
      row.append(top, how); node.append(row);
    });
    const add = action(test.rules.length ? '+ Add rule' : '+ Add a rule', () => { const first = projectVariables[0]; if (first) { test.rules.push(defaultRule(first)); save('Add rule'); } }, false, `${key}-add-rule`); add.classList.add('sc-add-rule');
    drawCode(); node.append(add, code); return node;
  }
  type Ending = 'continue' | 'jump' | 'repeat' | 'return';
  /** The option's ending is its last Beat. Continue means the body simply finishes. */
  function endingOf(body?: Branch): Ending { const last = body?.beats.at(-1); return last?.kind === 'jump' ? (last.repeat ? 'repeat' : 'jump') : last?.kind === 'return' ? 'return' : 'continue'; }
  const endings: { value: Ending; label: string; icon: string; detail: (b: Beat) => string }[] = [
    { value: 'continue', label: 'Continue after the Choice', icon: 'continue', detail: b => { const next = continuation(b); return next ? `Goes on to ${number(next.id)}` : 'Goes on to the end of the scene'; } },
    { value: 'jump', label: 'Go to a scene', icon: 'jump', detail: () => 'Jump. Does not come back' },
    { value: 'repeat', label: 'Repeat this Choice', icon: 'loop', detail: () => 'Shows the menu and prompt again' },
    { value: 'return', label: 'Return', icon: 'return', detail: () => 'To the scene that called this one, or the main menu' },
  ];
  /** Edits the body's last Beat only. Earlier Beats are never removed. */
  function setEnding(b: Beat, body: Branch, i: number, value: Ending) {
    const item = endings.find(e => e.value === value)!;
    change(() => {
      const last = body.beats.at(-1), target = last?.kind === 'jump' && !last.repeat ? last.target : undefined;
      if (last && (last.kind === 'jump' || last.kind === 'return')) body.beats.pop();
      if (value === 'jump') { const jump = sample.beat('jump'); jump.target = target ?? scenes.find(s => s.id !== sceneId)?.id ?? sceneId; body.beats.push(jump); }
      if (value === 'repeat') { const jump = sample.beat('jump'); jump.target = ''; jump.repeat = true; body.beats.push(jump); }
      if (value === 'return') body.beats.push(sample.beat('return'));
    }, `Option ${i + 1}: ${item.label} · ${name(b.id)}`);
  }
  /** The prompt is narration or a Character's line shown with the options. Empty reads as one quiet row. */
  let openCaption = '';
  function captionRow(b: Beat) {
    if (!b.text.trim() && openCaption !== b.id) {
      const row = el('div', 'sc-guard sc-caption-empty'); row.append(beatIcon('dialogue'), el('span', 'sc-guard-text', 'No prompt with the options'));
      const add = action('+ Prompt', () => { openCaption = b.id; draw(); focusField(`[data-editor-for="${b.id}"] input[aria-label="Prompt text"]`); }, false, 'add-prompt'); add.ariaLabel = 'Add a prompt shown with the options'; row.append(add); return row;
    }
    const people = [...characters, 'Narration (no speaker)'], who = b.speaker === 'Narration' ? 'Narration (no speaker)' : b.speaker;
    const speaker = personPicker(b, 'Prompt', people, who, value => b.speaker = value === 'Narration (no speaker)' ? 'Narration' : value);
    const line = input(b.text, 'Prompt text', value => b.text = value); line.placeholder = 'e.g. Where do you want to go?'; speaker.append(line); return speaker;
  }
  /** The option's own Beats, before its ending. Each row opens that Beat. */
  function optionBeats(b: Beat, body: Branch, i: number) {
    const ending = endingOf(body), beats = ending === 'continue' ? body.beats : body.beats.slice(0, -1); if (!beats.length) return undefined;
    const list = el('div', 'sc-option-body'); list.role = 'group'; list.ariaLabel = `Option ${i + 1} beats`;
    beats.slice(0, 3).forEach((beat, n) => { const row = action('', () => editBeat(beat.id), false, `option-${i + 1}-beat-${n + 1}`); row.classList.add('sc-option-beat'); row.append(beatIcon(beat.kind), el('span', 'sc-option-beat-number', number(beat.id)), el('span', 'sc-option-beat-text', beat.kind === 'dialogue' ? `${beat.speaker}: ${beat.text}` : beat.kind === 'narration' ? beat.text : `${label(beat.kind)} · ${brief(beat)}`)); row.ariaLabel = `Edit ${number(beat.id)} ${label(beat.kind)}: ${brief(beat)}`; list.append(row); });
    if (beats.length > 3) list.append(action(`+${beats.length - 3} more · Show`, () => openBranch(b, body), false, `open-option-${i}`));
    return list;
  }
  function endingRow(b: Beat, i: number, body: Branch) {
    const chosen = endings.find(e => e.value === endingOf(body))!, title = `Option ${i + 1} then`;
    const menu = el('details', 'sc-dropdown sc-outcome'); const summary = el('summary', 'sc-person'); summary.dataset.action = slug(title); summary.ariaLabel = `${title}: ${chosen.label}`;
    summary.append(beatIcon(chosen.icon), el('span', 'sc-person-name', chosen.label), el('span', 'sc-caret', '▾'));
    const list = el('div', 'sc-dropdown-list'); list.role = 'listbox'; list.ariaLabel = title;
    for (const item of endings) {
      const button = action('', () => { menu.open = false; if (item.value !== chosen.value) setEnding(b, body, i, item.value); else summary.focus(); }, false, `${slug(title)}-${item.value}`);
      button.role = 'option'; button.ariaSelected = String(item.value === chosen.value); button.ariaLabel = `${item.label}. ${item.detail(b)}`;
      const words = el('span', 'sc-outcome-words'); words.append(el('strong', '', item.label), el('span', '', item.detail(b))); button.append(beatIcon(item.icon), words); list.append(button);
    }
    list.onkeydown = event => { const items = [...list.querySelectorAll<HTMLElement>('[role=option]')], n = items.indexOf(document.activeElement as HTMLElement); if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); items[(n + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus(); } if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); menu.open = false; summary.focus(); } };
    menu.ontoggle = () => { if (menu.open) list.querySelector<HTMLElement>('[aria-selected=true]')?.focus(); };
    menu.append(summary, list); const row = el('div', 'sc-option-then'); row.append(el('span', 'sc-option-then-label', 'Then'), menu);
    const add = action('+ Beat', () => picker(body.beats, [...locate(scene(), b.id)!.trail, branchLabel(body)], defaultIndex(body.beats)), false, `inside-option-${i}`); add.ariaLabel = add.title = `Add a beat to option ${i + 1}${chosen.value === 'continue' ? '' : ', before its ending'}`; row.append(add);
    return row;
  }
  function destinationRow(b: Beat, i: number, jump: Beat) {
    const target = scenes.find(s => s.id === jump.target);
    const row = el('div', 'sc-asset-row sc-destination'); row.role = 'group'; row.ariaLabel = `Option ${i + 1} goes to`;
    const picture = el('span', 'sc-thumb sc-thumb-scene'); picture.ariaHidden = 'true'; const image = sceneImage(target); if (image) picture.style.backgroundImage = `url("${image}")`; else picture.classList.add('sc-thumb-black');
    const text = el('span', 'sc-asset-text'); text.append(el('strong', '', target?.name ?? 'Missing scene'), el('span', '', openingLine(target)));
    const pick = action('', () => { assetSheet = { beat: b.id, kind: 'destination', option: i }; sheetHover = ''; draw(); }, false, `change-destination-${i}`); pick.classList.add('sc-destination-pick'); pick.ariaLabel = `Change where option ${i + 1} goes: ${target?.name ?? 'missing scene'}`; pick.title = 'Choose a scene';
    pick.append(picture, text, el('span', 'sc-caret', '▾'));
    const open = action('', () => go(jump.target, true), false, `open-choice-${i}`); open.classList.add('sc-icon-button'); open.append(beatIcon('open')); open.ariaLabel = open.title = `Open ${target?.name ?? 'destination'}`;
    row.append(pick, open); return row;
  }
  function guardRow(b: Beat, i: number) {
    const option = b.options[i]!, key = `guard-${i}`, id = `${b.id}:${i}`, firstRule = `[data-editor-for="${b.id}"] [data-action="${key}-rule-0-variable"]`;
    if (openGuard === id) {
      const wrap = el('div', 'sc-guard-open'); wrap.role = 'group'; wrap.ariaLabel = `Option ${i + 1} only when`; const head = el('div', 'sc-guard-head');
      head.append(el('span', 'sc-field-label', 'Only when'), action('Done', () => { openGuard = ''; draw(); focusField(`[data-editor-for="${b.id}"] [data-choice-index="${i}"] .sc-guard>.button`); }, false, `${key}-done`));
      wrap.append(head, testBuilder(b, key, `Option ${i + 1}`, 'if', () => option.guard, text => option.guard = text, 'Always available')); return wrap;
    }
    const row = el('div', 'sc-guard'), text = el('span', 'sc-guard-text'), has = !!option.guard.trim();
    if (has) { text.append('Only when ', el('strong', '', option.guard)); text.title = `Only when ${option.guard}`; } else text.textContent = 'Always available';
    const button = has ? action('Edit', () => { openGuard = id; draw(); focusField(firstRule); }, false, `${key}-edit`)
      : action('+ Condition', () => { const first = projectVariables[0]; openGuard = id; if (first) change(() => option.guard = composeTest({ join: 'and', rules: [defaultRule(first)] }), `Add rule · ${name(b.id)}`); else draw(); focusField(firstRule); }, false, `${key}-add-rule`);
    button.ariaLabel = has ? `Edit when option ${i + 1} is available` : `Add a condition to option ${i + 1}`;
    row.append(beatIcon('condition'), text, button);
    if (!has || !combined) return row;
    const wrap = el('div', 'sc-guard-group'); const whenFalse = el('div', 'sc-when-false'); whenFalse.append(el('span', 'sc-option-then-label', 'If false'), segmented(['Hide', 'Show disabled'], option.whenFalse === 'disable' ? 'Show disabled' : 'Hide', `Option ${i + 1} when false`, value => option.whenFalse = value === 'Hide' ? 'hide' : 'disable'));
    wrap.append(row, whenFalse); return wrap;
  }
  function markGameOption(owner: string, index: number) { for (const button of host.querySelectorAll<HTMLElement>(`.sr-game-choices[data-choice-owner="${owner}"] [data-stage-choice]`)) button.dataset.active = String(Number(button.dataset.stageChoice) === index); }
  function choiceSource(b: Beat) {
    const repeats = b.branches.some(x => endingOf(x) === 'repeat'), menuLabel = `choice_${number(b.id).replace(/\./g, '_')}`;
    const lines = [repeats ? `menu ${menuLabel}:` : 'menu:'];
    if (b.picked && b.picked !== 'normal') lines.push(`    # Picked options: ${b.picked === 'mark' ? 'Mark picked' : 'Hide picked'} (Stage 2: saved per option identity)`);
    if (b.text.trim()) lines.push(`    ${b.speaker === 'Narration' ? '' : b.speaker.toLowerCase() + ' '}${JSON.stringify(b.text)}`);
    b.options.forEach(o => {
      const test = o.guard ? parseTest(o.guard) : undefined, guard = test ? ` if ${'advanced' in test ? test.advanced : pythonTest(test)}` : '';
      lines.push(`    ${JSON.stringify(o.text)}${guard}:${guard && o.whenFalse === 'disable' ? '  # shown disabled when false' : ''}`);
      const beats = b.branches.find(x => x.id === o.body)?.beats ?? []; if (!beats.length) lines.push('        pass');
      for (const x of beats) lines.push(`        ${x.kind === 'jump' ? `jump ${x.repeat ? menuLabel : x.target}` : x.kind === 'return' ? 'return' : x.kind === 'call' ? `call ${x.target}` : `# ${number(x.id)} ${label(x.kind)}: ${brief(x)}`}`);
    });
    return lines.join('\n');
  }
  /** Values this route sets before the beat. Declaration defaults are never used as current values. */
  function knownValues(id: string) {
    const { route, index } = pathFor(id), known = new Map<string, number>();
    for (const { beat } of route.slice(0, Math.max(0, index))) {
      if (beat.kind !== 'setVariable' || beat.protectedSource || !numeric(variableOf(beat.text)?.type)) continue;
      const node = parseFormula(beat.value); const value = isProblem(node) ? undefined : after(beat.operation ?? 'set', known.get(beat.text), node, n => known.get(n));
      if (value === undefined) known.delete(beat.text); else known.set(beat.text, value);
    }
    return known;
  }
  const numberType = (name: string): NumberType | 'other' | undefined => { const v = variableOf(name); return !v ? undefined : v.type === 'number' ? 'whole' : v.type === 'decimal' ? 'decimal' : 'other'; };
  function setVariableEditor(b: Beat): Node[] {
    const variable = variableOf(b.text) ?? projectVariables[0]!;
    if (b.protectedSource) {
      const line = el('div', 'sc-protected-line'); line.append(typeBadge(variable.type), el('strong', '', variable.name));
      return [field('Variable', line), el('code', 'sc-test-code', `$ ${variable.name} = ${formulaPython(b.value)}`), note('This calculation calls a function, which the visual editor cannot show. It stays exactly as written.'), action('Edit in Source', () => source(b), false, 'set-variable-source')];
    }
    const picker = field('Variable', variablePicker('set-variable', 'Variable', variable.name, chosen => change(() => { b.text = chosen.name; b.operation = 'set'; b.value = chosen.type === 'flag' ? 'true' : chosen.type === 'number' ? '1' : chosen.type === 'decimal' ? '1.0' : chosen.initial; }, `Set ${chosen.name} · ${name(b.id)}`)));
    if (variable.type === 'flag') return [picker, field('Value', segmented(['true', 'false'], b.value === 'false' ? 'false' : 'true', 'Value', value => b.value = value)), el('code', 'sc-test-code', `$ ${variable.name} = ${b.value === 'false' ? 'False' : 'True'}`)];
    if (variable.type === 'text') { const code = el('code', 'sc-test-code', `$ ${variable.name} = ${JSON.stringify(b.value)}`); const value = input(b.value, 'Variable value', text => { b.value = text; code.textContent = `$ ${variable.name} = ${JSON.stringify(text)}`; }); value.placeholder = 'Text'; return [picker, field('Value', value), code]; }
    const target = { name: variable.name, type: (variable.type === 'decimal' ? 'decimal' : 'whole') as NumberType }, operation = b.operation ?? 'set', op = operations.find(o => o.key === operation)!;
    const setOperation = (key: Operation) => { if (key !== operation) change(() => b.operation = key, `${operations.find(o => o.key === key)!.label} · ${name(b.id)}`); };
    const formula = input(b.value, 'Formula', text => { b.value = text; update(); suggest(); }); formula.classList.add('sc-formula'); formula.autocomplete = 'off'; formula.spellcheck = false; formula.placeholder = operation === 'set' ? 'Number or formula, e.g. bonus × 2' : 'Number or formula, e.g. 1 or bonus';
    const feedback = el('div', 'sc-formula-feedback'); feedback.role = 'status'; const code = el('code', 'sc-test-code');
    const suggestions = el('div', 'sc-suggestions'); suggestions.role = 'listbox'; suggestions.ariaLabel = 'Variables'; suggestions.hidden = true; let active = 0;
    const numericVariables = () => projectVariables.filter(v => numeric(v.type));
    const fragment = () => /[A-Za-z_][A-Za-z0-9_]*$/.exec(formula.value.slice(0, formula.selectionStart ?? formula.value.length))?.[0] ?? '';
    const insert = (text: string, replace = 0) => { formula.focus(); const end = formula.selectionStart ?? formula.value.length; formula.setRangeText(text, end - replace, formula.selectionEnd ?? end, 'end'); formula.dispatchEvent(new Event('input')); };
    function suggest() {
      const part = fragment(), matches = part ? numericVariables().filter(v => v.name.startsWith(part) && v.name !== part) : [];
      suggestions.replaceChildren(); suggestions.hidden = !matches.length; active = Math.min(active, Math.max(0, matches.length - 1)); formula.setAttribute('aria-expanded', String(!!matches.length));
      matches.forEach((v, i) => { const item = action('', () => { insert(v.name, part.length); suggestions.hidden = true; }, false, `formula-suggest-${v.name}`); item.role = 'option'; item.id = `sc-suggest-${b.id}-${i}`; item.ariaSelected = String(i === active); item.tabIndex = -1; item.append(typeBadge(v.type), el('span', 'sc-variable-name', v.name), el('small', '', typeName[v.type])); item.onmousedown = e => e.preventDefault(); suggestions.append(item); });
      if (matches.length) formula.setAttribute('aria-activedescendant', `sc-suggest-${b.id}-${active}`); else formula.removeAttribute('aria-activedescendant');
    }
    formula.setAttribute('role', 'combobox'); formula.setAttribute('aria-autocomplete', 'list'); formula.setAttribute('aria-expanded', 'false');
    formula.addEventListener('keydown', event => {
      if (suggestions.hidden) return; const items = [...suggestions.children] as HTMLElement[];
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); active = (active + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach((n, i) => n.ariaSelected = String(i === active)); formula.setAttribute('aria-activedescendant', items[active]!.id); }
      else if (event.key === 'Enter' || event.key === 'Tab') { event.preventDefault(); items[active]?.click(); }
      else if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); suggestions.hidden = true; formula.setAttribute('aria-expanded', 'false'); }
    }, { capture: true });
    formula.addEventListener('blur', () => { suggestions.hidden = true; formula.setAttribute('aria-expanded', 'false'); });
    function update() {
      const result = check(target, operation, b.value, numberType); feedback.replaceChildren(); formula.ariaInvalid = String(!!result.problem);
      if (result.problem) { const line = el('p', `sc-formula-problem sc-problem-${result.problem.kind}`); line.append(el('strong', '', result.problem.kind === 'target' ? 'Decimal result' : result.problem.kind === 'zero' ? 'Divides by zero' : result.problem.kind === 'missing' ? 'Unknown variable' : result.problem.kind === 'type' ? 'Not a number' : result.problem.kind === 'unsupported' ? 'Not supported' : 'Check the formula'), ` ${result.problem.message}`); feedback.append(line); if (result.problem.kind === 'missing') feedback.append(action('+ New variable…', () => newVariable(() => draw()), false, 'formula-new-variable')); }
      else {
        feedback.append(el('p', 'sc-formula-type', `Gives a ${result.result === 'decimal' ? 'decimal' : 'whole number'}${target.type === 'decimal' && result.result === 'whole' ? ', stored as a decimal' : ''}.`));
        const known = knownValues(b.id), before = known.get(target.name), value = after(operation, before, result.node!, n => known.get(n));
        const route = el('p', 'sc-formula-route'); route.append(el('span', '', 'On this route '), el('strong', '', before === undefined ? (operation === 'set' ? 'not set yet' : 'unknown') : show(before, target.type)), ' → ', el('strong', '', value === undefined ? 'unknown' : show(value, target.type)));
        route.title = 'Illustrative. Uses only values set earlier on this route, never the starting default.'; feedback.append(route);
      }
      code.textContent = `$ ${target.name} ${op.python} ${formulaPython(b.value) || '?'}`;
    }
    update();
    const planned = note('Planned (#87): Loomlight does not write arithmetic to source yet. This sample shows the intended editor.');
    const menu = el('details', 'sc-dropdown sc-operation-menu'); const summary = el('summary', 'sc-person'); summary.dataset.action = 'change'; summary.ariaLabel = `Change: ${op.label}`; summary.append(el('span', 'sc-operation-symbol', op.python), el('span', 'sc-caret', '▾'));
    const list = el('div', 'sc-dropdown-list'); list.role = 'listbox'; list.ariaLabel = 'Change';
    for (const o of operations) { const item = action('', () => { menu.open = false; setOperation(o.key); }, false, `change-${slug(o.label)}`); item.role = 'option'; item.ariaSelected = String(o.key === operation); item.ariaLabel = o.label; const words = el('span', 'sc-outcome-words'); words.append(el('strong', '', o.label), el('span', '', o.example)); item.append(el('span', 'sc-operation-symbol', o.python), words); list.append(item); }
    list.onkeydown = event => { const items = [...list.querySelectorAll<HTMLElement>('[role=option]')], n = items.indexOf(document.activeElement as HTMLElement); if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); items[(n + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus(); } if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); menu.open = false; summary.focus(); } };
    menu.ontoggle = () => { if (menu.open) list.querySelector<HTMLElement>('[aria-selected=true]')?.focus(); }; menu.append(summary, list);
    const equation = el('div', 'sc-equation'); equation.role = 'group'; equation.ariaLabel = 'Calculation'; equation.append(el('span', 'sc-equation-target', target.name), menu, formula, suggestions);
    return [picker, field('Calculation', equation), feedback, code, planned];
  }
  function combinedFields(b: Beat): HTMLDivElement {
    const form = el('div', 'sr-fields sc-fields'); form.dataset.editorFor = b.id; form.dataset.kind = b.kind;
    const transition = () => field('Transition', segmented(['None', 'Dissolve', 'Fade'], b.transition, 'Transition', value => b.transition = value));
    const who = () => personPicker(b, 'Character', [...characters], b.speaker, value => b.speaker = value);
    if (b.kind === 'dialogue' || b.kind === 'narration') form.append(speakerPicker(b), prose(b), el('p', 'sc-writing-shortcut', `Shift+${mod}+Enter: next line · Enter: line break in this text`));
    else if (b.kind === 'background') form.append(assetRow(b, 'background'), transition());
    else if (b.kind === 'showCharacter') form.append(who(), assetRow(b, 'expression'), field('Position', segmented(['Left', 'Centre', 'Right'], b.placement, 'Position', value => b.placement = value)), transition());
    else if (b.kind === 'changeAppearance') form.append(who(), assetRow(b, 'expression'), transition());
    else if (b.kind === 'placement') form.append(who(), field('Position', segmented(['Left', 'Centre', 'Right'], b.placement, 'Position', value => b.placement = value)));
    else if (b.kind === 'hideCharacter') form.append(who(), transition());
    else if (b.kind === 'transition') form.append(transition(), note('Applies to the next visual change.'));
    else if (b.kind === 'playMusic') form.append(listChoice(music, b.text || 'Night service', 'Music', 'playMusic', value => b.text = value), note('Loops until stopped or replaced. This sample does not play audio.'));
    else if (b.kind === 'stopMusic') form.append(note('Stops the current music. This sample does not play audio.'));
    else if (b.kind === 'playSfx') form.append(listChoice(sounds, b.asset, 'Sound effect', 'playSfx', value => b.asset = value), note('Plays once. This sample does not play audio.'));
    else if (b.kind.endsWith('Screen')) form.append(field('Screen', segmented(['Help', 'Inventory'], b.asset === 'Neutral' ? 'Help' : b.asset, 'Screen', value => b.asset = value)), note(b.kind === 'callScreen' ? 'Opens the screen and waits for it to close before the next beat.' : b.kind === 'showScreen' ? 'Shows the screen while the story continues.' : 'Hides the screen while the story continues.'));
    else if (b.kind === 'setVariable') form.append(...setVariableEditor(b));
    else if (b.kind === 'condition') {
      form.append(note('The first branch whose test is true runs. Tests are not evaluated in this mock.'));
      b.branches.forEach((branch, index) => {
        const row = el('section', 'sr-branch-control sc-branch'); row.dataset.branch = branch.id; row.dataset.arm = String(armOf(branch)); row.ariaLabel = `${branch.name} branch`;
        const head = el('div', 'sc-branch-head'); head.append(el('strong', '', branch.name));
        const show = action(visibleBranches.get(b.id) === branch.id ? 'Showing' : 'Show', () => openBranch(b, branch), false, `open-branch-${branch.id}`); show.ariaPressed = String(visibleBranches.get(b.id) === branch.id); head.append(show);
        if (branch.name.toLowerCase() === 'else if') { const remove = action('', () => removeBranch(b, branch), false, `remove-branch-${branch.id}`); remove.append(beatIcon('close')); remove.ariaLabel = remove.title = 'Remove this Else if'; head.append(remove); }
        row.append(head);
        if (branch.name === 'Otherwise') row.append(note('Runs when no test above is true.'));
        else row.append(testBuilder(b, `test-${branch.id}`, `${number(b.id)} ${branch.name}`, index === 0 ? 'if' : 'elif', () => branch.condition, text => branch.condition = text, 'Add a rule to give this branch a test.'));
        form.append(row);
      });
      form.append(action('+ Add Else if', () => addElseIf(b), false, 'add-else-if'));
    }
    else if (b.kind === 'choice') {
      form.append(captionRow(b));
      b.options.forEach((option, i) => {
        const body = b.branches.find(x => x.id === option.body)!;
        const block = el('fieldset', 'sr-option sc-option'); block.dataset.choiceIndex = String(i); block.dataset.option = body.id; block.dataset.arm = String(armOf(body)); block.append(el('legend', 'sc-visually-hidden', `Option ${i + 1}`));
        const top = el('div', 'sc-option-top'); const text = input(option.text, `Option ${i + 1} text`, value => option.text = value); text.placeholder = 'What the player can choose';
        const inside = flatten(body.beats).length;
        const remove = action('', () => { change(() => { b.options.splice(i, 1); b.branches = b.branches.filter(x => x.id !== option.body); b.options.forEach((o, n) => { const br = b.branches.find(x => x.id === o.body); if (br) br.name = `Option ${n + 1}`; }); }, `Remove option ${i + 1}${inside ? ` and its ${count(inside, 'beat')}` : ''} from ${name(b.id)}`); focusField(`[data-editor-for="${b.id}"] input[aria-label="Option ${Math.min(i, b.options.length - 1) + 1} text"]`); }, false, `remove-choice-${i}`);
        remove.append(beatIcon('close')); remove.ariaLabel = `Remove option ${i + 1}`; remove.title = remove.ariaLabel; remove.disabled = b.options.length === 1; if (remove.disabled) remove.title = 'A choice menu needs at least one option.';
        // Moving swaps positions only; each option keeps its body (its identity), so picked history follows it.
        const move = (step: -1 | 1) => { const to = i + step; change(() => { const [moved] = b.options.splice(i, 1); b.options.splice(to, 0, moved!); b.branches = b.options.map(o => b.branches.find(x => x.id === o.body)!); b.branches.forEach((x, n) => x.name = `Option ${n + 1}`); }, `Move option ${i + 1} ${step < 0 ? 'up' : 'down'} in ${name(b.id)}`); const other = to === 0 ? 'down' : to === b.options.length - 1 ? 'up' : step < 0 ? 'up' : 'down'; focusField(`[data-action=move-option-${to}-${other}]`); };
        const reorder = (step: -1 | 1) => { const button = action('', () => move(step), false, `move-option-${i}-${step < 0 ? 'up' : 'down'}`); button.append(beatIcon(step < 0 ? 'up' : 'down')); button.ariaLabel = button.title = `Move option ${i + 1} ${step < 0 ? 'up' : 'down'}`; button.disabled = step < 0 ? i === 0 : i === b.options.length - 1; button.classList.add('sc-option-move'); return button; };
        top.append(el('span', 'sc-option-number', String(i + 1)), text, reorder(-1), reorder(1), remove); block.append(top);
        const twin = b.options.findIndex((o, n) => n !== i && o.text.trim() && o.text.trim() === option.text.trim());
        if (twin >= 0) block.append(el('p', 'sc-option-twin', `Same text as option ${twin + 1}. Still a separate option with its own picked history.`));
        const mark = (on: boolean) => markGameOption(b.id, on ? i : Number(host.querySelector<HTMLElement>(`[data-editor-for="${b.id}"] [data-choice-index]:focus-within`)?.dataset.choiceIndex ?? -1));
        block.onpointerenter = () => mark(true); block.onpointerleave = () => mark(false); block.addEventListener('focusin', () => mark(true)); block.addEventListener('focusout', event => { if (!block.contains(event.relatedTarget as Node)) markGameOption(b.id, -1); });
        const beats = optionBeats(b, body, i); if (beats) block.append(beats);
        block.append(endingRow(b, i, body)); const last = body.beats.at(-1);
        if (last?.kind === 'jump' && !last.repeat) block.append(destinationRow(b, i, last));
        block.append(guardRow(b, i)); form.append(block);
      });
      form.append(action('+ Add option', () => { const index = b.options.length; change(() => { b.options.push({ text: '', target: '', guard: '' }); prepareChoice(b); }, `Add option to ${name(b.id)}`); focusField(`[data-editor-for="${b.id}"] input[aria-label="Option ${index + 1} text"]`); }, false, 'add-choice-option'));
      form.append(field('Picked options', segmented(['Show normally', 'Mark picked', 'Hide picked'], b.picked === 'mark' ? 'Mark picked' : b.picked === 'hide' ? 'Hide picked' : 'Show normally', 'Picked options', value => b.picked = value === 'Mark picked' ? 'mark' : value === 'Hide picked' ? 'hide' : 'normal'), el('p', 'sc-field-hint', 'Uses what the player picked in this save. Marked options stay selectable.')));
      const next = continuation(b);
      form.append(note(`If no option can be picked, the story continues ${next ? `at ${number(next.id)}` : 'after the Choice'} and records no pick.`), note('Planned (#98): Loomlight writes Jump-only menus today. Option beats, the prompt and Hide or Show disabled are Stage 1; Repeat and Picked options are Stage 2.'));
    }
    else return fields(b, true);
    return form;
  }
  function fields(b: Beat, plain = false): HTMLDivElement {
    if (combined && !plain) return combinedFields(b);
    const form = el('div', 'sr-fields'); form.dataset.editorFor = b.id;
    if (b.kind === 'dialogue' || b.kind === 'narration') {
      form.append(labelled('Speaker', lineSpeaker(b)), prose(b));
      if (combined) form.append(el('p', 'sc-writing-shortcut', `Shift+${mod}+Enter: next line · Enter: line break in this text`));
    } else if (b.kind === 'choice') {
      b.options.forEach((option, i) => {
        const row = el('fieldset', 'sr-option'); row.dataset.choiceIndex = String(i); row.append(el('legend', '', `Option ${i + 1}`));
        row.append(labelled('Option text', input(option.text, `Option ${i + 1} text`, value => option.text = value)), labelled('Goes to', destination(option.target, `Option ${i + 1} destination`, value => option.target = value)), labelled('Available when (optional)', input(option.guard, `Option ${i + 1} availability`, value => option.guard = value)));
        const buttons = el('div', 'sr-option-actions');
        buttons.append(action(`Open ${scenes.find(s => s.id === option.target)?.name ?? 'destination'}`, () => go(option.target, true), false, `open-choice-${i}`), action(combined ? 'New scene…' : `New scene for option ${i + 1}…`, () => createScene(s => option.target = s.id, i, option.text), false, `new-choice-${i}`));
        const remove = action(`Remove option ${i + 1}`, () => { change(() => b.options.splice(i, 1), `Remove option ${i + 1} from ${name(b.id)}`); focusField(`[data-editor-for="${b.id}"] input[aria-label="Option ${Math.min(i, b.options.length - 1) + 1} text"]`); }, false, `remove-choice-${i}`); remove.disabled = b.options.length === 1; if (remove.disabled) remove.title = 'A choice menu needs at least one option.'; if (combined) danger(remove); buttons.append(remove); row.append(buttons); form.append(row);
      });
      form.append(action('+ Add option', () => { const index = b.options.length; change(() => b.options.push({ text: '', target: scenes.find(s => s.id !== sceneId)?.id ?? sceneId, guard: '' }), `Add option to ${name(b.id)}`); focusField(`[data-editor-for="${b.id}"] input[aria-label="Option ${index + 1} text"]`); }), el('p', 'sr-explanation', 'Leave availability empty for an unconditional choice. Conditions are not evaluated here. If no choices are available, the game continues to the next beat.'));
    } else if (b.kind === 'condition') {
      form.append(el('p', 'sr-explanation', 'The first branch whose test is true runs. This illustration does not evaluate tests.'));
      for (const branch of b.branches) { const row = el('div', 'sr-branch-control'); row.dataset.branch = branch.id; if (combined) row.dataset.arm = String(armOf(branch)); if (branch.name !== 'Otherwise') row.append(labelled(`${branch.name} test`, input(branch.condition, `${name(b.id)} ${branch.name} condition`, value => branch.condition = value))); else row.append(el('strong', '', branch.name)); row.append(action(`${variant === 'stage-tracks' ? 'Show in tracks' : 'Open branch'}: ${branch.name}`, () => openBranch(b, branch), false, `open-branch-${branch.id}`)); if (branch.name.toLowerCase() === 'else if') row.append(action('Remove this Else if', () => removeBranch(b, branch))); form.append(row); }
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
    const samples: Partial<Record<Kind, string>> = { background: `scene ${b?.asset === 'Station at dawn' ? 'bg_station_dawn' : 'bg_platform'}${b?.transition === 'None' ? '' : ' with ' + (b?.transition ?? 'dissolve').toLowerCase()}`, showCharacter: `show ${b?.speaker.toLowerCase()} ${b?.asset.toLowerCase()} at ${(b?.placement ?? 'Centre').toLowerCase().replace('centre', 'center')}`, hideCharacter: `hide ${b?.speaker.toLowerCase()}`, changeAppearance: `show ${b?.speaker.toLowerCase()} ${b?.asset.toLowerCase()}`, placement: `show ${b?.speaker.toLowerCase()} at ${(b?.placement ?? 'Centre').toLowerCase().replace('centre', 'center')}`, transition: `with ${(b?.transition ?? 'dissolve').toLowerCase()}`, playMusic: `play music "audio/${b?.text === 'Last departure' ? 'last_departure' : 'night_service'}.ogg"`, stopMusic: 'stop music', playSfx: `play sound "audio/${b?.asset === 'Footsteps' ? 'footsteps' : 'tram_bell'}.ogg"`, call: `call ${targetId}`, jump: `jump ${targetId}`, return: 'return', showScreen: `show screen ${(b?.asset === 'Neutral' ? 'help' : b?.asset ?? 'help').toLowerCase()}`, hideScreen: `hide screen ${(b?.asset === 'Neutral' ? 'help' : b?.asset ?? 'help').toLowerCase()}`, callScreen: `call screen ${(b?.asset === 'Neutral' ? 'help' : b?.asset ?? 'help').toLowerCase()}`, setVariable: combined && b && numeric(variableOf(b.text)?.type) ? `$ ${b.text} ${operations.find(o => o.key === (b.operation ?? 'set'))!.python} ${formulaPython(b.value)}` : `$ ${b?.text || 'has_ticket'} = ${b?.value === 'true' ? 'True' : b?.value === 'false' ? 'False' : b?.value}`, choice: combined && b ? choiceSource(b) : `menu:\n${b?.options.map(o => `    # Available when: ${o.guard || 'Always'}\n    ${JSON.stringify(o.text)}:\n        jump ${o.target}`).join('\n')}`, condition: b?.branches.map(branch => `# ${branch.name} ${branch.condition}`.trim() + '\n' + branch.beats.map(beat => `#   ${number(beat.id)} ${label(beat.kind)}: ${brief(beat)}`).join('\n')).join('\n') };
    let example = b?.kind === 'customCode' ? b.text : speech ?? (b ? samples[b.kind] ?? `# ${brief(b)}` : '# Select a beat');
    if (b && ['showCharacter', 'hideCharacter', 'changeAppearance'].includes(b.kind)) example += `\n# Transition: ${b.transition}`;
    if (b?.kind === 'transition') example = `with ${b.transition === 'None' ? 'None' : b.transition.toLowerCase()}`;
    const code = el('pre', 'sr-code', example); code.tabIndex = 0;
    dialog.append(code);
    if (b && ['condition', 'choice', 'showCharacter', 'hideCharacter', 'changeAppearance'].includes(b.kind)) dialog.append(el('p', '', combined && b.kind === 'choice' ? "Each option's own beats are summarised as comments. This is an incomplete syntax example." : 'Branch tests, option availability and character transitions are shown as comments where relevant. This is an incomplete syntax example.'));
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
    const trail = ancestry(scene(), selected) ?? []; bar.append(el('span', 'sr-current-body', !combined && trail.length ? trail.map(p => `${number(p.beat.id)} ${p.branch.name} ${p.branch.condition}`).join(' › ') : ''));
    const tools = el('div', 'sr-top-tools');
    const focus = action(focused ? 'Show game window' : 'Writing focus', () => { focused = !focused; draw(); status(focused ? 'Writing focus · all beat tools remain available' : 'Game window shown'); }, false, 'toggle-focus'); focus.dataset.focusToggle = '';
    undoButton = action('Undo', () => history(undo, redo, 'Undid'), false, 'undo'); redoButton = action('Redo', () => history(redo, undo, 'Redid'), false, 'redo'); undoButton.disabled = !undo.length; redoButton.disabled = !redo.length;
    const t = target(); const add = action(combined || innerWidth < 900 ? '+ Add beat' : `+ Add beat ${t.body[t.index] ? 'before ' + name(t.body[t.index]!.id) : t.body[t.index - 1] ? 'after ' + name(t.body[t.index - 1]!.id) : 'to ' + (reelContext()?.branch.name ?? 'scene')}`, () => { const here = target(); picker(here.body, here.trail, here.index); }, true, 'add-beat'); add.title = targetText(t.body, t.trail, t.index);
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
  function tree() { const aside = el('aside', 'sr-scenes'); aside.ariaLabel = 'Scenes'; aside.append(action('+ New scene', () => createScene(), !combined, 'new-scene')); for (const chapter of new Set(scenes.map(s => s.chapter))) { aside.append(el('h2', '', chapter)); for (const s of scenes.filter(s => s.chapter === chapter)) { const button = action(s.name, () => { caller = undefined; go(s.id); }, false, `scene-${s.id}`); button.className = 'sr-scene-link'; button.ariaCurrent = s.id === sceneId ? 'page' : null; aside.append(button); } } return aside; }
  function openBranch(owner: Beat, branch: Branch, child = branch.beats[0]?.id) { visibleBranches.set(owner.id, branch.id); reelBranch = branch.id; selected = child ?? owner.id; expanded.add(owner.id); stageObject = ''; manual = ''; draw(); status(combined ? `Opened ${branchLabel(branch)} · ${child ? 'editing ' + name(selected) : 'ready for its first beat'}` : `Editing ${number(owner.id)} Condition › ${branch.name} ${branch.condition}`.trim()); if (combined) focusText(); else focusSelected(); }
  function stageInsert(kind: Kind, actor?: string) {
    const t = locate(scene(), selected); const state = stateAt(); const currentActor = actor && state.characters.get(actor);
    insert(kind, t?.body ?? scene().beats, t?.trail ?? [scene().name], t?.index ?? defaultIndex(), actor ?? current()?.speaker, undefined, currentActor ? { speaker: actor, asset: currentActor.asset, placement: currentActor.placement } : undefined);
  }
  function effects() {
    const section = el('section', 'sr-effects'); const state = stateAt(); section.append(el('h3', '', `In effect at ${number()}`));
    const row = (text: string, beat: Beat, object: string, thumb?: HTMLElement) => {
      const line = el('div', 'sr-effect-row'); const link = action(`${text} · Edit ${number(beat.id)}`, () => selectBeat(beat.id, true), false, `effect-owner-${beat.id}`); link.replaceChildren(el('span', '', text), el('span', 'sr-edit-link', `Edit ${number(beat.id)}`)); if (combined && thumb) link.prepend(thumb); line.append(link);
      line.dataset.effectObject = object; section.append(line);
    };
    const backdrop = (asset: string) => { const node = el('span', 'sc-thumb sc-thumb-mini'); node.ariaHidden = 'true'; if (artBackgrounds[asset]) node.style.backgroundImage = `url("${artBackgrounds[asset]}")`; else node.classList.add('sc-thumb-black'); return node; };
    const tune = () => { const node = el('span', 'sc-thumb sc-thumb-mini sc-thumb-icon'); node.append(beatIcon('music')); return node; };
    if (state.background) row(combined ? state.background.asset === 'Black' ? 'Black screen' : state.background.asset : `Background · ${state.background.asset}`, state.background, 'background', combined ? backdrop(state.background.asset) : undefined);
    for (const actor of state.characters.values()) row(`${actor.name} · ${actor.asset}, ${actor.placement}`, actor.from, actor.name, combined ? avatar(actor.name, actor.asset) : undefined);
    if (state.music) row(combined ? state.music.text || 'Night service' : `Music · ${state.music.text || 'Night service'}`, state.music, 'music', combined ? tune() : undefined);
    if (!state.background && !state.characters.size && !state.music) section.append(el('p', '', 'No scene-local media yet.'));
    if (state.unknown.length) section.append(el('p', 'sr-unknown-note', `Partial illustration after ${state.unknown.map(b => `${number(b.id)} ${label(b.kind)}`).join(', ')}. Conditions, Calls and protected source are not evaluated.`)); return section;
  }
  const mediaKinds: Kind[] = ['background', 'showCharacter', 'hideCharacter', 'changeAppearance', 'placement', 'transition', 'playMusic', 'stopMusic', 'playSfx'];
  function typeSelector(b: Beat) {
    const compatible: Kind[][] = [['showCharacter', 'changeAppearance', 'placement', 'hideCharacter'], ['playMusic', 'stopMusic'], ['showScreen', 'hideScreen', 'callScreen']]; const family = compatible.find(f => f.includes(b.kind));
    if (!family || variant !== 'shot-reel' && !combined) return el('strong', '', `${number(b.id)} · ${label(b.kind)}`);
    const control = el('select'); control.ariaLabel = 'Beat type'; for (const kind of family) control.append(new Option(label(kind), kind)); control.value = b.kind;
    control.onchange = () => change(() => b.kind = control.value as Kind, `${name(b.id)} is now ${label(control.value as Kind)}`); return control;
  }
  function inspector(textInGame = false) {
    const panel = el('aside', 'sr-inspector'); panel.ariaLabel = 'Selected beat editor'; const b = current(), emptyScene = scene().beats.length === 1 && b?.kind === 'return';
    if (variant !== 'cue-sheet' && reelContext()?.branch.beats.length === 0 && reelContext()?.owner.id === selected) { const c = reelContext()!; panel.append(empty(c.branch.beats, c.trail)); return panel; }
    if (!b || emptyScene) { if (variant !== 'cue-sheet') panel.append(empty(scene().beats, [scene().name])); if (!combined || !b) return panel; }
    if (stageObject) {
      const state = previewState(); const owner = stageObject === 'background' ? state.background : state.characters.get(stageObject)?.from;
      if (owner) { const { route, index } = pathFor(); const before = illustrate(route, index - 1); const canChange = owner.id !== selected && (stageObject === 'background' ? !!before.background : before.characters.has(stageObject)); panel.append(el('h3', '', `${stageObject === 'background' ? 'Background' : stageObject} on stage · set by ${name(owner.id)}`), action(`Edit ${name(owner.id)}`, () => { stageObject = ''; selectBeat(owner.id, true); focusText(); }, !canChange, 'edit-stage-owner')); if (canChange) panel.append(action(`${stageObject === 'background' ? 'Change background' : `Change ${stageObject}'s appearance`} before ${number()}`, () => { stageInsert(stageObject === 'background' ? 'background' : 'changeAppearance', stageObject === 'background' ? undefined : stageObject); stageObject = ''; }, true, 'stage-change')); panel.append(action(`Back to ${number()}`, () => { stageObject = ''; selectBeat(selected, true); }, false, 'close-stage-object')); return panel; }
    }
    const heading = el('div', 'sr-inspector-heading'); const type = typeSelector(b); if (type instanceof HTMLSelectElement) heading.append(el('strong', '', `${number(b.id)} ·`)); heading.append(type);
    if (['dialogue', 'narration'].includes(b.kind) && variant !== 'cue-sheet') { const next = action(combined ? '+ Next line' : `+ Next ${nextSpeaker(b.id)} line`, () => { const t = locate(scene(), b.id)!; insert(combined && b.kind === 'narration' ? 'narration' : 'dialogue', t.body, t.trail, t.index + 1, nextSpeaker(b.id)); }, !combined, 'next-dialogue'); if (combined) next.classList.add('sc-next-line'); next.title = `Add ${combined && b.kind === 'narration' ? 'narration' : 'dialogue'} after ${name(b.id)} (Shift+${mod}+Enter)`; heading.append(next); }
    heading.append(rowMenu(b)); if (combined) heading.prepend(beatIcon(b.kind)); panel.append(heading);
    if (combined && (ancestry(scene(), b.id) ?? []).length) { const where = el('p', 'sr-editor-location'); where.append(scene().name); for (const branch of chainOf(b.id)) { const part = el('span', 'sc-crumb', branchLabel(branch)); part.dataset.arm = String(armOf(branch)); part.dataset.branchLabel = branch.id; where.append(' › ', part); } panel.append(where); }
    else if ((ancestry(scene(), b.id) ?? []).length) panel.append(el('p', 'sr-editor-location', locate(scene(), b.id)!.trail.join(' › ')));
    if (variant === 'cue-sheet') { if (mediaKinds.includes(b.kind)) panel.append(fields(b)); else panel.append(effects()); }
    else { if (!textInGame || !['dialogue', 'narration'].includes(b.kind)) panel.append(fields(b)); else panel.append(el('p', 'sr-editor-hint', `Type in the game's text box. Shift+${mod}+Enter adds the next dialogue.`)); if (!focused && !emptyScene) panel.append(effects()); }
    if (combined && assetSheet && assetSheet.beat !== b.id) assetSheet = undefined;
    if (combined && assetSheet) { panel.classList.add('sc-has-sheet'); panel.append(assetSheet.kind === 'destination' ? scenePicker(b) : assetPicker(b)); }
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
      const image = button.querySelector('img')!; image.src = combined ? sprite(actor.name, actor.asset) : art[actor.name]?.[actor.asset] ?? mara; image.alt = `${actor.name}, ${actor.asset.toLowerCase()}`;
      button.querySelector('span')!.textContent = `${actor.name} · ${actor.asset}`;
    }
  }
  function preview() {
    const wrap = el('section', 'sr-preview'); wrap.ariaLabel = 'Game window';
    const top = el('div', 'sr-preview-title'); top.append(el('strong', '', 'Game window'), el('span', 'sr-stage-resolution', '1920 × 1080'), action(stageExpanded ? `Show ${variants.find(v => v.id === variant)!.title.toLowerCase()}` : 'Enlarge stage', () => { stageExpanded = !stageExpanded; draw(); }, false, 'enlarge-stage')); wrap.append(top);
    const slot = el('div', 'sr-stage-slot'); const stage = el('div', 'sr-stage'); stage.dataset.stage = '';
    const bgButton = action('', () => { stageObject = 'background'; stageExpanded = false; draw(); host.querySelector<HTMLElement>('[data-action="edit-stage-owner"]')?.focus(); }, false, 'stage-background'); bgButton.className = 'sr-backdrop-control'; bgButton.ariaLabel = 'Select background on stage';
    const image = el('img', 'sr-backdrop'); image.src = combined ? artBackgrounds['Rainy platform']! : platform; image.alt = 'Fictional rain-soaked tram platform'; bgButton.append(image); stage.append(bgButton);
    const placeholder = el('div', 'sr-stage-empty'); placeholder.append(el('span', '', 'No background yet')); if ((variant === 'stage-tracks' || combined) || scene().beats.some(b => b.kind !== 'return')) placeholder.append(action('Add background', () => stageInsert('background'), false, 'empty-stage-background')); stage.append(placeholder);
    const b = current(); const editable = variant === 'shot-reel' && !hideSaybox && innerWidth >= 900 && b && ['dialogue', 'narration'].includes(b.kind);
    const caption = el('div', 'sr-saybox'); caption.dataset.saybox = '';
    if (editable) { const speaker = lineSpeaker(b); speaker.classList.toggle('sr-narration-speaker', b.kind === 'narration'); caption.append(speaker, prose(b)); }
    else {
      caption.tabIndex = 0; caption.role = 'button'; caption.ariaLabel = 'Edit displayed dialogue'; caption.append(el('strong'), el('p'));
      const edit = () => { const line = previewLine(); if (line) { stageExpanded = false; manual = ''; selectBeat(line.id); focusText(); } }; caption.onclick = edit; caption.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); edit(); } };
    }
    stage.append(caption); stageCharacters(stage, previewState());
    if (b?.kind === 'choice') stage.append(gameChoices(b));
    slot.append(stage); wrap.append(slot);
    const bottom = el('div', 'sr-stage-footer'); bottom.append(el('span', 'sr-stage-status'));
    if (combined && current()?.kind === 'choice') bottom.append(choicePreview(current()!));
    if (variant === 'cue-sheet') {
      const routeOptions = flatten(scene().beats).filter(b => b.kind === 'condition');
      if (routeOptions.length) {
        const route = el('select'); route.ariaLabel = 'Illustrative branch preview'; route.dataset.action = 'preview-branch'; route.append(new Option(innerWidth < 900 ? 'Preview: selection' : 'Follow selection', ''));
        for (const condition of routeOptions) for (const branch of condition.branches) route.append(new Option(`${number(condition.id)} ${branch.name} ${branch.condition}`.trim(), branch.id));
        route.value = manual; route.onchange = () => { manual = route.value; refresh(); status(manual ? `Manual selection · not a playthrough · editing stays on ${name()}` : `Illustration follows ${name()}`); }; const label = el('label', 'sr-preview-route'); label.append(el('span', '', 'Preview'), route); bottom.append(label);
      }
    }
    const add = el('div', 'sr-stage-actions'); if (combined && scene().beats.length === 1 && scene().beats[0]?.kind === 'return') add.hidden = true; add.append(action(`+ Background before ${number()}`, () => stageInsert('background'), false, 'add-background'), action(`+ Character before ${number()}`, () => stageInsert('showCharacter'), false, 'add-character'));
    if (variant === 'shot-reel' && previewLine()) { const toggle = action(hideSaybox ? 'Show text box' : 'Hide text box', () => { hideSaybox = !hideSaybox; draw(); focusText(); status(`${hideSaybox ? 'Text box hidden' : 'Text box shown'} in preview only. Edit dialogue ${innerWidth < 900 ? 'below the game window' : hideSaybox ? 'in the side panel' : 'in the game text box'}.`); }, false, 'hide-text-box'); toggle.ariaPressed = String(hideSaybox); toggle.title = 'Preview only. Adds nothing to the script.'; add.append(toggle); }
    bottom.append(add); wrap.append(bottom); return wrap;
  }
  function revealGameOption(control: HTMLElement | null) {
    const row = control?.closest<HTMLElement>('[data-choice-index]'), owner = row?.closest<HTMLElement>('[data-editor-for]')?.dataset.editorFor; if (!row || !owner) return;
    for (const menu of host.querySelectorAll<HTMLElement>(`.sr-game-choices[data-choice-owner="${owner}"]`)) { const button = menu.querySelector<HTMLElement>(`[data-stage-choice="${row.dataset.choiceIndex}"]`); if (!button) continue; const r = button.getBoundingClientRect(), bounds = menu.getBoundingClientRect(); if (r.top < bounds.top) menu.scrollTop -= bounds.top - r.top; if (r.bottom > bounds.bottom) menu.scrollTop += r.bottom - bounds.bottom; }
  }
  function legacyGameChoices(b: Beat) {
    const choices = el('div', 'sr-game-choices'); choices.dataset.choiceOwner = b.id; b.options.forEach((option, i) => { const button = action(option.text || 'New choice', () => { stageExpanded = false; draw(); focusField(`[data-editor-for="${b.id}"] input[aria-label="Option ${i + 1} text"]`); }, false, `stage-choice-${i}`); button.ariaLabel = `Edit option ${i + 1}: ${option.text || 'New choice'}`; button.dataset.stageChoice = String(i); if (combined) { const body = b.branches.find(x => x.id === option.body); if (body) button.dataset.arm = String(armOf(body)); } choices.append(button); }); return choices;
  }
  /** Illustrative availability of each option. Hide picked wins over Show disabled. */
  type OptionState = 'available' | 'marked' | 'unknown' | 'disabled' | 'hidden' | 'hidden-picked';
  function optionStates(b: Beat): OptionState[] {
    return b.options.map(o => {
      const preview = previewOptions.get(o.body ?? '') ?? {}, truth = o.guard.trim() ? preview.truth : 'true', picked = !!preview.picked && truth !== 'false';
      if (picked && b.picked === 'hide') return 'hidden-picked';
      if (truth === 'false') return o.whenFalse === 'disable' ? 'disabled' : 'hidden';
      if (picked && b.picked === 'mark') return 'marked';
      return truth === undefined ? 'unknown' : 'available';
    });
  }
  function gameChoices(b: Beat) {
    if (!combined) return legacyGameChoices(b);
    const choices = el('div', 'sr-game-choices'); choices.dataset.choiceOwner = b.id; const states = optionStates(b);
    b.options.forEach((option, i) => {
      const state = states[i]!; if (state === 'hidden' || state === 'hidden-picked') return;
      const button = action('', () => { stageExpanded = false; draw(); focusField(`[data-editor-for="${b.id}"] input[aria-label="Option ${i + 1} text"]`); }, false, `stage-choice-${i}`);
      if (state === 'marked') button.append(el('span', 'sc-stage-mark', '✓')); if (state === 'disabled') button.append(beatIcon('lock'));
      button.append(el('span', '', option.text || 'New choice')); button.dataset.state = state; button.dataset.stageChoice = String(i);
      const body = b.branches.find(x => x.id === option.body); if (body) button.dataset.arm = String(armOf(body));
      button.ariaLabel = `Edit option ${i + 1}: ${option.text || 'New choice'}${state === 'disabled' ? ', shown disabled in the game' : state === 'marked' ? ', marked as picked' : state === 'unknown' ? ', availability unknown' : ''}`; choices.append(button);
    });
    const selectable = states.some(st => st === 'available' || st === 'marked' || st === 'unknown');
    if (!selectable) { const next = continuation(b), where = next ? `at ${number(next.id)}` : 'after the Choice'; choices.append(el('p', 'sc-choice-none', states.includes('disabled') ? `Only disabled options are left. Ren'Py would wait here; Loomlight continues ${where} instead and records no pick.` : `No option can be picked here, so the story continues ${where} and records no pick.`)); }
    return choices;
  }
  /** Stage footer control. Changes only the illustration, never the story or Undo. */
  function choicePreview(b: Beat) {
    const menu = el('details', 'sc-dropdown sc-choice-preview'); const summary = el('summary', 'button'); summary.dataset.action = 'preview-options'; summary.textContent = 'Preview options ▾'; summary.title = 'Illustrative: choose what to assume about conditions and picked history';
    const panel = el('div', 'sc-choice-preview-panel'); panel.role = 'group'; panel.ariaLabel = 'Illustrative option preview';
    panel.append(el('strong', '', 'Illustrative preview'), el('p', 'sc-field-hint', 'Not a playthrough or a save. Choose what to assume for each option.'));
    const syncs: (() => void)[] = [];
    b.options.forEach((option, i) => {
      const key = option.body ?? '', current = () => previewOptions.get(key) ?? {};
      const update = (patch: { truth?: 'true' | 'false'; picked?: boolean }) => { previewOptions.set(key, { ...current(), ...patch }); syncs.forEach(sync => sync()); refresh(); };
      const row = el('div', 'sc-preview-row'); row.append(el('span', 'sc-option-number', String(i + 1)), el('span', 'sc-preview-name', option.text || 'New choice'));
      const controls = el('div', 'sc-preview-controls'), truths: [HTMLButtonElement, 'true' | 'false' | undefined][] = [];
      if (option.guard.trim()) for (const [value, text] of [[undefined, '?'], ['true', 'True'], ['false', 'False']] as const) { const button = action(text, () => update({ truth: value }), false, `preview-option-${i + 1}-${value ?? 'unknown'}`); button.title = button.ariaLabel = value ? `Assume ${option.guard} is ${value}` : 'Availability unknown'; truths.push([button, value]); controls.append(button); }
      else controls.append(el('span', 'sc-preview-always', 'Always'));
      const picked = action('Picked', () => update({ picked: !current().picked }), false, `preview-option-${i + 1}-picked`); picked.title = picked.ariaLabel = `Assume option ${i + 1} was picked earlier in this save`; controls.append(picked);
      syncs.push(() => { for (const [button, value] of truths) button.ariaPressed = String(current().truth === value); picked.ariaPressed = String(!!current().picked); });
      row.append(controls); panel.append(row);
    });
    syncs.forEach(sync => sync()); menu.append(summary, panel); return menu;
  }
  function refresh() {
    syncSelectionChrome();
    const state = withSheetPreview(previewState()); const line = previewLine();
    for (const stage of host.querySelectorAll<HTMLElement>('[data-stage]')) {
      const choices = stage.querySelector<HTMLElement>('.sr-game-choices'), b = current();
      if (b?.kind !== 'choice') choices?.remove(); else if (combined || !choices || choices.dataset.choiceOwner !== b.id || choices.children.length !== b.options.length) { const menu = gameChoices(b), scroll = choices?.scrollTop ?? 0; if (choices) choices.replaceWith(menu); else stage.append(menu); menu.scrollTop = scroll; }
      stage.classList.toggle('sr-dawn', !combined && state.background?.asset === 'Station at dawn'); if (combined) { const backdrop = stage.querySelector<HTMLImageElement>('.sr-backdrop')!, asset = state.background?.asset ?? 'Rainy platform', src = artBackgrounds[asset]; backdrop.hidden = !src; if (src && backdrop.getAttribute('src') !== src) backdrop.src = src; backdrop.alt = src ? `Fictional ${asset.toLowerCase()}` : 'Black screen'; const previewing = assetSheet && sheetHover && sheetHover !== current()?.asset ? sheetHover : ''; let tag = stage.querySelector<HTMLElement>('.sc-preview-tag'); if (previewing) { if (!tag) { tag = el('span', 'sc-preview-tag'); stage.append(tag); } tag.textContent = `Previewing ${previewing === 'Black' ? 'Black screen' : previewing} · click to use it`; } else tag?.remove(); } stage.classList.toggle('sr-no-background', !state.background); stage.querySelector<HTMLElement>('.sr-stage-empty')!.hidden = !!state.background;
      stageCharacters(stage, state); const caption = stage.querySelector<HTMLElement>('.sr-saybox')!; caption.hidden = !line || hideSaybox;
      const paragraph = caption.querySelector('p'); if (paragraph) paragraph.textContent = line?.text ?? ''; const speaker = caption.querySelector('strong'); if (speaker) speaker.textContent = line?.kind === 'dialogue' ? line.speaker : ''; if (combined && line?.kind === 'dialogue') caption.style.setProperty('--sc-speaker', characterColour(line.speaker));
    }
    for (const item of host.querySelectorAll<HTMLElement>('[data-summary]')) { const b = flatten(scene().beats).find(b => b.id === item.dataset.summary); if (b) { item.textContent = brief(b); const control = item.closest<HTMLElement>('[data-reel-beat],.sr-cue'); if (control) control.ariaLabel = `${control.classList.contains('sr-cue') ? 'Select ' : ''}${contextName(b.id)}: ${brief(b)}`; } }
    if (!combined) for (const item of host.querySelectorAll<HTMLElement>('[data-stage-choice]')) { const option = current()?.options[Number(item.dataset.stageChoice)]; if (option) { item.textContent = option.text || 'New choice'; item.ariaLabel = `Edit option ${Number((item as HTMLElement).dataset.stageChoice) + 1}: ${option.text || 'New choice'}`; } }
    revealGameOption(document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const manualOwner = manual ? flatten(scene().beats).find(b => b.branches.some(branch => branch.id === manual)) : undefined, manualBranch = manualOwner?.branches.find(branch => branch.id === manual);
    const routes = state.unknown.filter(b => b.kind === 'condition').map(b => { const branch = b.branches.find(branch => branch.id === visibleBranches.get(b.id)); return branch ? `${number(b.id)} ${branch.name}` : ''; }).filter(Boolean).join(', ');
    for (const note of host.querySelectorAll<HTMLElement>('.sr-stage-status')) { const title = manual ? `Previewing ${manualOwner ? number(manualOwner.id) : ''} ${manualBranch?.name ?? 'branch'} · editing ${number()}` : `${number()} · ${state.unknown.length ? 'Partial illustration' : 'Sample illustration'}${routes && !combined ? ' · via ' + routes : ''}`; if (combined && !state.background && !state.characters.size && !state.line) { note.textContent = ''; note.title = note.ariaLabel = ''; continue; } note.textContent = innerWidth < 900 ? `${number()}${manual ? ' · Preview' : state.unknown.length ? ' · Partial' : ''}` : title; note.title = title; note.ariaLabel = title; }
    for (const effect of host.querySelectorAll('.sr-effects')) effect.replaceWith(effects());
    for (const owner of flatten(scene().beats)) for (const branch of owner.branches) {
      for (const button of host.querySelectorAll<HTMLElement>(`[data-action="open-branch-${branch.id}"]`)) { const prefix = button.closest('.sr-branch-control') ? (variant === 'stage-tracks' ? 'Show in tracks: ' : 'Open branch: ') : button.closest('.sr-reel-target') ? 'Open ' : ''; const fullName = `${prefix}${branch.name} ${branch.condition}${button.closest('.sr-reel-target') ? ' · ' + count(branch.beats.length, 'beat') : ''}`.trim(); if (button.closest('.sr-branch-control')) { button.textContent = variant === 'stage-tracks' ? 'Show in tracks' : combined ? (visibleBranches.get(owner.id) === branch.id ? 'Showing' : 'Show') : 'Open branch'; if (combined) button.ariaPressed = String(visibleBranches.get(owner.id) === branch.id); button.ariaLabel = button.title = fullName; } else if (!button.closest('.sc-branch-switch')) nameControl(button, fullName); if (button.closest('.sr-track-band')) button.title = `Show ${branch.name} ${branch.condition} in tracks`.trim(); }
      const option = host.querySelector<HTMLOptionElement>(`.sr-preview-route option[value="${branch.id}"]`); if (option) option.textContent = `${number(owner.id)} ${branch.name} ${branch.condition}`.trim();
    }
    const selectedBeat = current();
    if (selectedBeat?.kind === 'choice') selectedBeat.options.forEach((option, i) => { const button = host.querySelector<HTMLElement>(`[data-action="open-choice-${i}"]`); if (button) { const text = `Open ${scenes.find(s => s.id === option.target)?.name ?? 'destination'}`; if (!combined) button.textContent = text; button.ariaLabel = text; button.title = text; } });
    if (selectedBeat && ['call', 'jump'].includes(selectedBeat.kind)) { const button = host.querySelector<HTMLElement>('[data-action="open-destination"]'); if (button) { const text = `Open ${scenes.find(s => s.id === selectedBeat.target)?.name ?? 'destination'}`; button.textContent = text; button.ariaLabel = text; } }
    if (variant === 'stage-tracks' || combined) updateTrackCells();
    if (combined) refreshCombinedContext();
  }
  function removeBranch(owner: Beat, branch: Branch) {
    const total = flatten(branch.beats).length;
    const remove = () => change(() => { owner.branches.splice(owner.branches.indexOf(branch), 1); selected = owner.id; if (manual === branch.id) manual = ''; }, `Remove ${branch.name} from ${name(owner.id)}`);
    if (!total) { remove(); focusSelected(); return; }
    const dialog = modal(`Remove ${branch.name} ${branch.condition} from ${number(owner.id)} Condition?`, 'delete-branch', true); const cancel = action('Cancel', () => dialog.close()); dialog.append(el('p', '', `Removes this branch and its ${count(total, 'beat')}. Undo restores them.`)); actions(dialog, [cancel, danger(action(`Remove branch and ${count(total, 'beat')}`, () => { remove(); dialog.close(); focusSelected(); }))]); cancel.focus();
  }
  function addElseIf(owner: Beat) {
    const branch: Branch = { id: sample.newId(), name: 'Else if', condition: '', beats: [] };
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
    const top = el('div', 'sr-row-line'); const selectNumber = action(number(b.id), () => selectBeat(b.id), false, 'select-beat'); selectNumber.className = 'sr-number'; selectNumber.id = `sr-number-${b.id}`; selectNumber.tabIndex = -1; selectNumber.ariaLabel = `Select ${name(b.id)}`; top.append(selectNumber);
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
    const next = action(`+ Next ${b.kind === 'dialogue' ? b.speaker : 'dialogue'} line`, () => { const t = locate(scene(), b.id)!; insert(combined && b.kind === 'narration' ? 'narration' : 'dialogue', t.body, t.trail, t.index + 1, nextSpeaker(b.id)); }, false, 'next-dialogue'); if (combined) next.classList.add('sc-next-line'); next.title = `Shift+${mod}+Enter`; next.classList.add('sr-inline-next'); return next;
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
    const box = el('div', 'sr-empty'); const branch = trail.length > 1; box.append(el('h2', '', branch ? `${trail.at(-1)} has no beats yet.` : 'No lines yet.'), el('p', '', branch ? 'Write a line or add a background in this branch.' : 'Write the first line or add a background. New beats go before the ending.')); const controls = el('div'); controls.append(action('Write dialogue', () => insert('dialogue', body, trail, defaultIndex(body)), true), action('Write narration', () => insert('narration', body, trail, defaultIndex(body))), action('Add background', () => insert('background', body, trail, defaultIndex(body)))); if (combined && !focused && !branch && scene().beats.length === 1) { controls.lastElementChild?.remove(); box.querySelector('p')!.textContent = 'Write the first line. New beats go before the ending.'; } box.append(controls); return box;
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
  function focusSelected() { const request = ++focusRequest; requestAnimationFrame(() => { if (request !== focusRequest) return; const item = host.querySelector<HTMLElement>(`[data-reel-beat="${selected}"],[data-track-beat="${selected}"]`) ?? host.querySelector<HTMLElement>(`[data-beat="${selected}"] .sr-number`) ?? host.querySelector<HTMLElement>('[data-action="add-beat"]'); item?.focus({ preventScroll: combined }); revealSelection(); }); }
  function focusVisible(control?: HTMLElement | null) {
    if (!control) return; control.focus({ preventScroll: true });
    const work = host.querySelector<HTMLElement>('.sr-workarea')!, panel = control.closest<HTMLElement>('.sr-inspector');
    const container = panel ?? control.closest<HTMLElement>('[data-beat]');
    if (combined && focused && innerWidth < 900 && panel) { const r = control.getBoundingClientRect(), bounds = panel.getBoundingClientRect(); if (r.top < bounds.top) panel.scrollTop -= bounds.top - r.top; else if (r.bottom > bounds.bottom) panel.scrollTop += r.bottom - bounds.bottom; }
    else if (innerWidth < 900 && container && control.getBoundingClientRect().bottom - container.getBoundingClientRect().top < work.clientHeight - 16) work.scrollTop += container.getBoundingClientRect().top - work.getBoundingClientRect().top - (combined && focused ? 48 : 8);
    else { const anchor = focused && variant === 'shot-reel' && panel && panel.getBoundingClientRect().height < work.clientHeight ? panel : control; anchor.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  }
  function focusField(selector: string) { const request = ++focusRequest; requestAnimationFrame(() => { if (request === focusRequest) focusVisible(host.querySelector<HTMLElement>(selector)); }); }
  function focusText() { const request = ++focusRequest; requestAnimationFrame(() => { if (request !== focusRequest) return; revealSelection(); const area = host.querySelector<HTMLTextAreaElement>(`textarea[data-beat-text="${selected}"]`); const fields = host.querySelector<HTMLElement>(`[data-editor-for="${selected}"]`); const control = area ?? fields?.querySelector<HTMLElement>('input,select,button') ?? host.querySelector<HTMLElement>(`[data-beat="${selected}"] .sr-cue`); if (control) focusVisible(control); else focusSelected(); }); }
  function alignStripEnds() {
    if (!combined || focused) return;
    for (const selector of ['.sr-tracks-scroll', '.sc-reel>.sr-reel-strip']) {
      const area = host.querySelector<HTMLElement>(selector); if (!area) continue;
      area.style.setProperty('--strip-end', '0px');
      const nodes = [...area.querySelectorAll<HTMLElement>('.sr-track-column,.sc-reel-column,.sc-track-mark')];
      const last = nodes.at(-1); if (!last) continue;
      const rect = area.getBoundingClientRect(), labels = area.querySelector<HTMLElement>('.sr-track-labels')?.getBoundingClientRect().width ?? 0;
      const end = last.getBoundingClientRect().right - rect.left + area.scrollLeft;
      const limit = Math.max(0, end - area.clientWidth);
      const stops = nodes.map(n => n.getBoundingClientRect().left - rect.left - labels + area.scrollLeft);
      const stop = stops.find(left => left >= limit - .5);
      if (limit > 0 && stop != null) area.style.setProperty('--strip-end', `${Math.max(0, stop - limit)}px`);
    }
  }
  function revealSelection() {
    for (const [itemSelector, scrollSelector] of [[`[data-reel-beat="${selected}"]`, '.sr-reel-strip'], [`[data-track-beat="${selected}"]`, '.sr-tracks-scroll'], [`[data-beat="${selected}"]`, '.sr-sheet']]) {
      const scroller = focused && scrollSelector === '.sr-reel-strip' ? combined ? '.sc-reel' : '.sr-workarea' : scrollSelector!;
      const item = host.querySelector<HTMLElement>(itemSelector!), area = host.querySelector<HTMLElement>(scroller); if (!item || !area) continue;
      const r = item.getBoundingClientRect(), rect = area.getBoundingClientRect(), main = host.querySelector<HTMLElement>('.sr-workarea')!.getBoundingClientRect();
      const labels = combined && scrollSelector === '.sr-tracks-scroll' ? area.querySelector<HTMLElement>('.sr-track-labels')?.getBoundingClientRect() : undefined;
      const sticky = focused && variant === 'shot-reel' ? host.querySelector<HTMLElement>('.sr-shot-workspace[data-prose=true]')?.getBoundingClientRect().height ?? 0 : focused ? labels?.height ?? 0 : 0;
      const bounds = { left: rect.left + (!focused ? labels?.width ?? 0 : 0), right: rect.right, top: Math.max(rect.top + sticky, main.top), bottom: Math.min(rect.bottom, main.bottom) };
      // A last beat and its boundary belong together when the viewport can hold both.
      let tail = r;
      if (combined) {
        let next = item.closest('[data-column]')?.nextElementSibling;
        while (next instanceof HTMLElement && next.dataset.branchBoundary === 'exit') {
          const end = next.getBoundingClientRect();
          if (focused ? end.bottom - r.top <= bounds.bottom - bounds.top : end.right - r.left <= bounds.right - bounds.left) tail = end;
          else break;
          next = next.nextElementSibling;
        }
      }
      const right = Math.max(r.right, tail.right), bottom = Math.max(r.bottom, tail.bottom);
      if (r.left < bounds.left) area.scrollLeft -= bounds.left - r.left;
      else if (right > bounds.right) area.scrollLeft += right - bounds.right;
      if (combined && !focused && ['.sr-tracks-scroll', '.sr-reel-strip'].includes(scrollSelector!)) {
        const now = area.scrollLeft, itemRect = item.getBoundingClientRect();
        const min = now + itemRect.right + (right - r.right) - bounds.right, max = now + itemRect.left - bounds.left;
        const starts = [...area.querySelectorAll<HTMLElement>('.sr-track-column,.sc-reel-column,.sc-track-mark')].map(node => now + node.getBoundingClientRect().left - bounds.left);
        const candidates = starts.filter(value => value >= Math.max(0, min) - 1 && value <= Math.min(max, area.scrollWidth - area.clientWidth) + 1);
        if (candidates.length) area.scrollLeft = candidates.sort((a, b) => Math.abs(a - now) - Math.abs(b - now))[0]!;
      }
      if (r.top < bounds.top) area.scrollTop -= bounds.top - r.top;
      else if (bottom > bounds.bottom) area.scrollTop += Math.min(bottom - bounds.bottom, Math.max(0, r.top - bounds.top));
    }
  }
  function revealActiveBranch() {
    const strip = host.querySelector<HTMLElement>('.sc-condition-groups');
    const active = strip?.querySelector<HTMLElement>(`[data-branch-segment="${reelBranch}"]`);
    if (!strip || !active) return;
    const r = active.getBoundingClientRect(), bounds = strip.getBoundingClientRect();
    if (r.left < bounds.left) strip.scrollLeft -= bounds.left - r.left;
    else if (r.right > bounds.right) strip.scrollLeft += r.right - bounds.right;
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
    horizontalWheel(strip);
    reel.append(strip); return reel;
  }
  function horizontalWheel(scroller: HTMLElement) { scroller.addEventListener('wheel', event => { if (!focused && Math.abs(event.deltaY) > Math.abs(event.deltaX) && scroller.scrollWidth > scroller.clientWidth) { const before = scroller.scrollLeft; scroller.scrollLeft += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.clientWidth : 1); if (scroller.scrollLeft !== before) event.preventDefault(); } }, { passive: false }); }
  function shotReel(parent: HTMLElement) { const layout = el('div', 'sr-reel-layout'); const top = el('div', 'sr-shot-workspace'); top.dataset.prose = String(['dialogue', 'narration'].includes(current()?.kind ?? '')); if (!focused) top.append(preview()); top.append(inspector(!focused && !hideSaybox && innerWidth >= 900)); layout.append(top, orderedReel()); parent.append(layout); }
  const wordsOnly = () => focused ? innerWidth <= 1200 : innerWidth < 900 && !allTracks;
  function trackText(b: Beat, track: number) {
    const summary = combined && (b.kind.endsWith('Screen') || b.kind === 'return') ? brief(b) : `${label(b.kind)} · ${brief(b)}`;
    if (track === 0) return number(b.id);
    if (track === 1) return b.kind === 'background' ? b.asset : b.kind === 'transition' ? `Transition · ${b.transition}` : '';
    if (track === 2) return ['showCharacter', 'changeAppearance', 'placement', 'hideCharacter'].includes(b.kind) ? b.kind === 'hideCharacter' ? `${b.speaker} hidden` : brief(b) : '';
    if (track === 3) return ['dialogue', 'narration'].includes(b.kind) ? brief(b) : wordsOnly() ? summary : '';
    if (track === 4) return ['playMusic', 'stopMusic', 'playSfx'].includes(b.kind) ? brief(b) : '';
    return !['dialogue', 'narration', ...mediaKinds].includes(b.kind) ? summary : '';
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
    for (const { beat: b } of route.filter(c => c.beat.branches.length)) {
      const band = el('div', 'sr-track-band'); band.dataset.conditionOwner = b.id; band.append(el('span', '', `${number(b.id)} Condition · show:`));
      for (const branch of b.branches) { const button = action(`${branch.name} ${branch.condition}`.trim(), () => openBranch(b, branch), false, `open-branch-${branch.id}`); button.title = `Show ${branch.name} ${branch.condition} in tracks`.trim(); button.ariaPressed = String(visibleBranches.get(b.id) === branch.id); band.append(button); }
      if (visibleBranches.has(b.id)) band.append(action(`Hide ${number(b.id)} branches`, () => { visibleBranches.delete(b.id); selected = b.id; reelBranch = ''; draw(); focusSelected(); }, false, `hide-branches-${b.id}`));
      const branch = b.branches.find(branch => branch.id === visibleBranches.get(b.id)); if (branch && !branch.beats.length) band.append(action(`+ Add beat to ${branch.name}`, () => picker(branch.beats, [...locate(scene(), b.id)!.trail, `${branch.name} ${branch.condition}`.trim()], 0))); bands.append(band);
    }
    heading.append(bands, el('span', 'sr-track-legend', wordsOnly() ? 'Dashed: uncertain' : 'Fill: shown · Dashed: uncertain'), action(allTracks ? 'Show beat list' : 'Show all tracks', () => { allTracks = !allTracks; draw(); }, false, 'all-tracks')); dock.append(heading);
    const scroll = el('div', 'sr-tracks-scroll'); horizontalWheel(scroll); const grid = el('div', 'sr-track-grid'); grid.role = 'group'; grid.ariaLabel = 'Beats in story order'; grid.dataset.orientation = focused ? 'vertical' : 'horizontal';
    const labels = el('div', 'sr-track-labels'); labels.ariaHidden = 'true'; const titles = ['Beat', 'Background', 'Characters', wordsOnly() ? 'Beat content' : 'Words', 'Sound', 'Flow / state']; titles.forEach((title, i) => labels.append(el('span', `sr-track-label sr-track-${i}`, title))); grid.append(labels);
    const wrappers = new Map<string, HTMLElement>(), inserts: { owner: Beat; after: string; control: HTMLElement }[] = [];
    for (const [i, column] of route.entries()) {
      const { beat: b, body, trail, index } = column; const wrapper = el('div', 'sr-track-column'); wrapper.role = 'presentation';
      const button = action('', () => combined || innerWidth < 900 ? editBeat(b.id) : selectBeat(b.id, true), false, 'track-beat'); button.className = 'sr-track-beat'; button.ariaCurrent = b.id === selected ? 'true' : null; button.dataset.selected = String(b.id === selected); button.dataset.trackBeat = b.id; button.dataset.beatKind = b.kind; button.tabIndex = b.id === selected ? 0 : -1;
      titles.forEach((_title, track) => { const cell = el('span', `sr-track-cell sr-track-${track}`); cell.dataset.track = String(track); if (track === 3) cell.append(el('span', 'sr-track-copy')); button.append(cell); }); button.onkeydown = e => navigateBeat(e, route.map(c => c.beat), i); wrapper.append(button);
      if (!isEnding(b.kind)) { const add = gap(body, trail, index + 1); add.classList.add('sr-track-insert'); add.ariaLabel = `Add after ${name(b.id)}${b.branches.length ? ' and its branches' : ''}`; add.title = add.ariaLabel; let last = i; if (b.branches.length) while (route[last + 1] && route[last + 1]!.depth > column.depth) last++; inserts.push({ owner: b, after: route[last]!.beat.id, control: add }); }
      wrappers.set(b.id, wrapper); grid.append(wrapper);
    }
    for (const { owner, after, control } of inserts) { if (owner.id !== after) { control.textContent = `+ After ${number(owner.id)}`; control.className = 'button sr-track-group-add'; control.tabIndex = 0; bands.querySelector(`[data-condition-owner="${owner.id}"]`)!.append(control); } else wrappers.get(after)!.append(control); }
    scroll.append(grid); dock.append(scroll); layout.append(dock); parent.append(layout);
  }
  // Fourth experiment: one editing model with two bottom presentations.
  /** Combined mock: every option owns a body, stored like a condition branch, and an outcome. */
  function prepareChoice(b: Beat, prefix?: string) {
    b.options.forEach((option, i) => {
      if (b.branches.some(x => x.id === option.body)) return;
      const branch: Branch = { id: prefix ? `${prefix}-${i + 1}` : sample.newId(), name: `Option ${i + 1}`, condition: '', beats: [] };
      if (option.target) { const jump = sample.beat('jump'); jump.target = option.target; branch.beats.push(jump); option.target = ''; } // A simple destination option is a body holding one Jump.
      b.branches.push(branch); option.body = branch.id;
    });
  }
  function choiceOf(branch: Branch) { const owner = flatten(scene().beats).find(b => b.kind === 'choice' && b.branches.some(x => x.id === branch.id)); const index = owner ? owner.options.findIndex(o => o.body === branch.id) : -1; return owner && index >= 0 ? { owner, option: owner.options[index]!, index } : undefined; }
  function branchLabel(branch: Branch) { const choice = choiceOf(branch); if (choice) return `Option ${choice.index + 1} · ${choice.option.text || 'New choice'}`; return `${branch.name}${branch.condition ? ' ' + branch.condition : branch.name === 'Otherwise' ? '' : ' (add a test)'}`; }
  function afterCondition(owner: Beat) {
    const place = locate(scene(), owner.id)!;
    picker(place.body, place.trail, place.index + 1);
  }
  function continuation(owner: Beat): Beat | undefined {
    const place = locate(scene(), owner.id)!;
    if (place.body[place.index + 1]) return place.body[place.index + 1];
    const parent = ancestry(scene(), owner.id)?.at(-1);
    return parent ? continuation(parent.beat) : undefined;
  }
  /** One colour per branch, in scene order, cycling through four. */
  function armOf(branch: Branch) { const all = flatten(scene().beats).flatMap(b => b.branches); return (Math.max(0, all.indexOf(branch)) % 4) + 1; }
  function segmentLabel(owner: Beat, branch: Branch) { if (owner.kind === 'choice') { const i = owner.options.findIndex(o => o.body === branch.id), open = visibleBranches.get(owner.id); return open === branch.id ? `${i + 1} ${owner.options[i]?.text || 'New choice'}` : String(i + 1); } return branch === owner.branches[0] ? 'true' : branch.name === 'Otherwise' ? 'otherwise' : branch.condition || 'else if'; }
  function conditionStrip() {
    const strip = el('nav', 'sc-conditions'); strip.ariaLabel = 'Branch path';
    strip.append(el('strong', 'sc-conditions-title', 'Branch path'));
    const groups = el('div', 'sc-condition-groups');
    const route = columns(scene(), visibleBranches);
    for (const { beat: owner } of route.filter(c => c.beat.branches.length)) {
      const group = el('div', 'sc-condition-group'); group.dataset.conditionOwner = owner.id;
      if (groups.children.length) { const arrow = el('span', 'sc-path-arrow', '›'); arrow.ariaHidden = 'true'; group.append(arrow); }
      const edit = action(number(owner.id), () => editBeat(owner.id), false, `edit-condition-${owner.id}`); edit.classList.add('sc-condition-ref');
      edit.ariaLabel = `Edit ${owner.kind === 'choice' ? 'choice' : 'condition'} ${number(owner.id)}`; edit.title = `${name(owner.id)} · ${locate(scene(), owner.id)!.trail.join(' › ')}`;
      const test = el('span', 'sc-condition-test'); test.dataset.conditionTest = owner.id;
      const choices = el('div', 'sc-branch-switch'); choices.role = 'group'; choices.ariaLabel = owner.kind === 'choice' ? `Options of choice ${number(owner.id)}` : `Branches of condition ${number(owner.id)}`;
      for (const branch of owner.branches) {
        const button = action(segmentLabel(owner, branch), () => openBranch(owner, branch), false, `open-branch-${branch.id}`);
        button.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openBranch(owner, branch); focusRequest++; host.querySelector<HTMLElement>(`.sc-conditions [data-action="open-branch-${branch.id}"]`)?.focus({ preventScroll: true }); } };
        button.dataset.branchSegment = branch.id; if (owner.kind === 'choice') button.classList.add('sc-option-segment'); button.dataset.arm = String(armOf(branch)); button.ariaPressed = String(visibleBranches.get(owner.id) === branch.id);
        button.ariaLabel = button.title = `Show ${branchLabel(branch)}`; choices.append(button);
      }
      group.append(edit, test, choices); groups.append(group);
    }
    if (!groups.children.length) groups.append(el('span', 'sc-conditions-empty', 'No conditions or choices in this scene.'), action('+ Add condition', () => { const t = target(); insert('condition', t.body, t.trail, t.index); }, false, 'add-condition'));
    strip.append(groups); return strip;
  }
  function chainOf(id: string) { return (ancestry(scene(), id) ?? []).map(p => p.branch); }
  function thenText(owner: Beat, branch: Branch) {
    const last = branch.beats.at(-1), next = continuation(owner), choice = owner.kind === 'choice' ? choiceOf(branch) : undefined;
    if (choice) { const ending = endingOf(branch); if (ending === 'jump') return `goes to ${scenes.find(s => s.id === last!.target)?.name ?? 'a scene'}`; if (ending === 'repeat') return `back to ${number(owner.id)}`; if (ending === 'return') return 'returns'; }
    if (last && ['jump', 'return'].includes(last.kind)) return last.kind === 'jump' ? 'jumps away' : 'returns';
    return next ? `then ${number(next.id)} →` : 'then the scene ends';
  }
  /** Route rows above each Tracks column: one coloured line per open branch level. */
  function rail(chain: Branch[], label?: { branch: Branch; end?: string }) {
    const node = el('div', 'sc-rail'); node.ariaHidden = 'true';
    const levels = chain.length > 2 ? [chain[0]!, chain.at(-1)!] : chain;
    for (let r = 0; r < 2; r++) { const row = el('span', 'sc-rail-row'); const branch = levels[r]; if (branch) { row.dataset.arm = String(armOf(branch)); row.classList.add('sc-rail-on'); } node.append(row); }
    if (label) {
      const row = node.children[Math.min(chain.length, 2) - 1] as HTMLElement;
      const text = el('span', label.end !== undefined ? 'sc-rail-end' : 'sc-rail-label', label.end ?? branchLabel(label.branch));
      if (label.end === undefined) { text.dataset.branchLabel = label.branch.id; if (!label.branch.beats.length) text.dataset.empty = 'true'; } row.append(text);
    }
    return node;
  }
  function markTrackBranches(grid: HTMLElement) {
    const route = columns(scene(), visibleBranches);
    for (const column of route) {
      const wrapper = grid.querySelector<HTMLElement>(`[data-column="${column.beat.id}"]`); if (!wrapper) continue;
      const chain = chainOf(column.beat.id); wrapper.prepend(rail(chain)); wrapper.dataset.depth = String(column.depth);
      if (chain.length) wrapper.dataset.arm = String(armOf(chain.at(-1)!));
    }
    for (const [i, column] of route.entries()) {
      const owner = column.beat, branch = owner.branches.find(b => b.id === visibleBranches.get(owner.id)); if (!branch) continue;
      const ownerWrap = grid.querySelector<HTMLElement>(`[data-column="${owner.id}"]`)!; ownerWrap.querySelector('.sr-track-insert')?.remove();
      let last = i; while (route[last + 1] && route[last + 1]!.depth > column.depth) last++;
      const end = grid.querySelector<HTMLElement>(`[data-column="${route[last]!.beat.id}"]`)!;
      const place = locate(scene(), owner.id)!, parentChain = chainOf(owner.id), chain = [...parentChain, branch], path = [...place.trail, branchLabel(branch)];
      const mark = (kind: string, arms: Branch[]) => { const node = el('div', `sc-track-mark sc-track-${kind}`); node.dataset.branchBoundary = kind; node.dataset.branchOwner = owner.id; if (arms.length) node.dataset.arm = String(armOf(arms.at(-1)!)); return node; };
      // An empty branch is one beat-wide slot holding its name and where it goes next, so the two labels never overlap.
      const slot = !branch.beats.length && !focused;
      const entry = mark('entry', chain); entry.append(rail(chain, { branch }));
      if (slot) { entry.classList.add('sc-track-slot'); entry.querySelector('.sc-rail-label')!.after(el('span', 'sc-rail-end', thenText(owner, branch))); }
      const first = action(focused ? '+ First beat' : slot ? '+ Add a beat' : '+', () => picker(branch.beats, path, 0), false, `inside-${branch.id}`); first.ariaLabel = first.title = `Add the first beat in ${branchLabel(branch)}`; entry.append(first);
      const nodes: HTMLElement[] = [];
      if (!slot) {
        const exit = mark('exit', chain); exit.append(rail(chain, { branch, end: thenText(owner, branch) }));
        const append = action(focused ? '+ Last beat' : '+', () => picker(branch.beats, path, defaultIndex(branch.beats)), false, `append-${branch.id}`); append.ariaLabel = append.title = `Add the last beat in ${branchLabel(branch)}${ending(branch.beats) >= 0 ? ', before its ending' : ''}`; exit.append(append); nodes.push(exit);
      }
      if (!(parentChain.length && place.index === place.body.length - 1)) {
        const after = mark('after', parentChain); after.append(rail(parentChain));
        const add = action(focused ? `+ After ${number(owner.id)}` : '+', () => afterCondition(owner), false, `boundary-after-${owner.id}`); add.ariaLabel = add.title = `Add after ${owner.kind === 'choice' ? 'choice' : 'condition'} ${number(owner.id)}, outside its ${owner.kind === 'choice' ? 'options' : 'branches'}`; after.append(add); nodes.push(after);
      }
      end.after(...nodes); ownerWrap.after(entry);
      const label = entry.querySelector<HTMLElement>('.sc-rail-label'), endLabel = (slot ? entry : nodes[0])?.querySelector<HTMLElement>('.sc-rail-end');
      if (label && endLabel) requestAnimationFrame(() => { const room = endLabel.getBoundingClientRect().left - label.getBoundingClientRect().left - 10; if (room > 0) label.style.maxWidth = `${Math.min(260, room)}px`; });
    }
  }
  function refreshCombinedContext() {
    for (const node of host.querySelectorAll<HTMLElement>('[data-condition-test]')) { const owner = flatten(scene().beats).find(b => b.id === node.dataset.conditionTest), test = owner?.branches[0]?.condition; if (owner?.kind === 'choice') { node.textContent = 'Choice'; node.title = count(owner.options.length, 'option'); node.classList.remove('sc-missing'); continue; } node.textContent = test || 'Add a test'; node.title = test ? `If ${test}` : 'This condition has no test yet'; node.classList.toggle('sc-missing', !test); }
    for (const node of host.querySelectorAll<HTMLElement>('[data-branch-segment]')) { const owner = flatten(scene().beats).find(b => b.branches.some(x => x.id === node.dataset.branchSegment)), branch = owner?.branches.find(x => x.id === node.dataset.branchSegment); if (owner && branch) { node.textContent = segmentLabel(owner, branch); node.ariaLabel = node.title = `Show ${branchLabel(branch)}`; } }
    for (const node of host.querySelectorAll<HTMLElement>('[data-branch-label]')) {
      const branch = flatten(scene().beats).flatMap(b => b.branches).find(b => b.id === node.dataset.branchLabel);
      if (branch) { node.textContent = branchLabel(branch); node.title = branchLabel(branch); if (node instanceof HTMLButtonElement) node.ariaLabel = branchLabel(branch); }
    }
    for (const button of host.querySelectorAll<HTMLElement>('[data-gap-before]')) {
      const position = button.dataset.gapBefore ? locate(scene(), button.dataset.gapBefore) : undefined;
      if (position) button.title = button.ariaLabel = targetText(position.body, position.trail, position.index + 1);
    }
  }
  function bottomToolbar() {
    const bar = el('div', 'sc-bottom-toolbar');
    const modes = el('div', 'sc-mode-switch'); modes.role = 'group'; modes.ariaLabel = 'Bottom panel view';
    for (const mode of ['tracks', 'reel'] as const) {
      const button = action(mode === 'tracks' ? 'Tracks' : 'Reel', () => {
        bottomMode = mode;
        try { sessionStorage.setItem('story-combined-bottom', mode); } catch { /* The preference is optional in file previews. */ }
        draw(); revealSelection(); host.querySelector<HTMLElement>(`[data-action="bottom-${mode}"]`)?.focus({ preventScroll: true });
        status(`${mode === 'tracks' ? 'Tracks' : 'Reel'} view · ${scene().beats.length === 1 && current()?.kind === 'return' ? 'no lines yet' : 'editing ' + contextName()}`);
      }, false, `bottom-${mode}`); button.ariaPressed = String(bottomMode === mode); modes.append(button);
    }
    bar.append(modes);
    if (bottomMode === 'tracks' && !focused) bar.append(el('span', 'sc-track-legend', 'Shaded: carried forward · Dashed: state may differ'));
    return bar;
  }
  function combinedReel() {
    const reel = el('section', 'sr-reel sc-reel'); reel.ariaLabel = 'Ordered beat reel';
    const strip = el('div', 'sr-reel-strip'); strip.role = 'group'; strip.ariaLabel = 'Scene beats and expanded branches';
    const route = columns(scene(), visibleBranches);
    route.forEach(({ beat: b, body, trail, index }, i) => {
      const column = el('div', 'sc-reel-column'); column.dataset.column = b.id;
      const button = action('', () => editBeat(b.id), false, 'reel-beat'); button.className = 'sr-reel-beat'; button.dataset.reelBeat = b.id; button.dataset.beatKind = b.kind; button.dataset.selected = String(b.id === selected); button.ariaCurrent = b.id === selected ? 'true' : null; button.ariaLabel = `${contextName(b.id)}: ${brief(b)}`; button.tabIndex = b.id === selected ? 0 : -1;
      button.append(el('span', '', `${number(b.id)} · ${b.kind === 'return' ? brief(b) : label(b.kind)}`), el('p', '', brief(b))); button.querySelector('p')!.dataset.summary = b.id;
      button.onkeydown = event => navigateBeat(event, route.map(c => c.beat), i); column.append(button);
      if (!isEnding(b.kind) && !(b.branches.length && visibleBranches.has(b.id))) { const add = gap(body, trail, index + 1); add.tabIndex = b.id === selected ? 0 : -1; column.append(add); }
      strip.append(column);
    });
    markTrackBranches(strip); horizontalWheel(strip); reel.append(strip); return reel;
  }
  function combinedStory(parent: HTMLElement) {
    // Reuse the reference's stage, property editor and track renderer.
    const temporary = el('div'); stageTracks(temporary);
    const original = temporary.firstElementChild!;
    const top = original.querySelector<HTMLElement>('.sr-tracks-workspace')!;
    const tracks = original.querySelector<HTMLElement>('.sr-tracks')!;
    tracks.querySelector('.sr-track-heading')!.remove(); tracks.classList.add('sc-tracks');
    for (const column of tracks.querySelectorAll<HTMLElement>('.sr-track-column')) column.dataset.column = column.querySelector<HTMLElement>('[data-track-beat]')!.dataset.trackBeat;
    markTrackBranches(tracks.querySelector<HTMLElement>('.sr-track-grid')!);
    const layout = el('div', 'sc-combined-layout sr-tracks-layout');
    const conditions = conditionStrip(), toolbar = bottomToolbar();
    const panel = el('div', 'sc-bottom-panel'); panel.append(toolbar, bottomMode === 'tracks' ? tracks : combinedReel());
    if (focused) layout.append(conditions, panel, top);
    else { const bottom = el('div', 'sc-bottom'); bottom.append(conditions, panel); layout.append(top, bottom); }
    parent.append(layout);
  }
  /** Add a beat: one click or Enter adds the highlighted beat. Escape or Close cancels. */
  function combinedPicker(body: Beat[], trail: string[], requested: number, replaceEmpty?: Beat) {
    const index = Math.min(requested, defaultIndex(body));
    const dialog = modal('Add a beat', 'beat-picker'); dialog.classList.add('sr-picker-dialog', 'sc-picker');
    const close = dialog.querySelector<HTMLElement>('[data-action=close-dialog]'); if (close) { close.replaceChildren(beatIcon('close')); close.ariaLabel = close.title = 'Close without adding'; }
    const destination = el('p', 'sc-picker-target'); const targetLabel = el('span', 'sr-insertion-target'); destination.append(targetLabel); dialog.append(destination);
    const query = el('input'); query.type = 'search'; query.placeholder = 'Search beats'; query.ariaLabel = 'Find a beat'; query.dataset.pickerSearch = '';
    const search = el('label', 'sc-picker-search'); search.append(beatIcon('search'), query);
    const results = el('div', 'sr-picker-results'); results.id = `sr-results-${++elementId}`; results.role = 'listbox'; results.ariaLabel = 'Beat types';
    query.role = 'combobox'; query.setAttribute('aria-autocomplete', 'list'); query.setAttribute('aria-expanded', 'true'); query.setAttribute('aria-controls', results.id);
    const descriptions: Record<string, string> = { dialogue: 'A spoken line with a speaker.', narration: 'Story text with no speaker.', condition: 'Branches on a test, then the story continues.', choice: 'Options the player picks from.', background: 'Sets the scene and clears characters.', showCharacter: 'Puts a character on the stage.', hideCharacter: 'Takes a character off the stage.', changeAppearance: "Changes a shown character's expression.", placement: 'Moves a shown character.', transition: 'Animates the next visual change.', playMusic: 'Starts a music track.', stopMusic: 'Stops the current music.', playSfx: 'Plays a sound once.', call: 'Visits a scene, then comes back.', jump: 'Goes to a scene and does not return.', return: 'Returns to the caller or ends the story.', setVariable: 'Stores a value for later conditions.', showScreen: 'Shows a screen while the story continues.', hideScreen: 'Hides a screen while the story continues.', callScreen: 'Opens a screen and waits for it to close.' };
    const aliases: Record<string, string> = { condition: 'if else branch test', placement: 'position move', call: 'shared conversation returns', choice: 'menu options decision', setVariable: 'flag counter value', showScreen: 'panel', callScreen: 'dialog' };
    const note = el('p', 'sc-picker-note'); note.ariaLive = 'polite';
    let active = 0, items: HTMLButtonElement[] = [];
    function highlight() {
      const button = items[active]; note.replaceChildren(); note.hidden = true;
      items.forEach((item, i) => { item.dataset.highlighted = String(i === active); item.ariaSelected = String(i === active); });
      if (!button) { query.removeAttribute('aria-activedescendant'); targetLabel.textContent = targetText(body, trail, index).replace('Adds to ', ''); return; }
      query.setAttribute('aria-activedescendant', button.id); const kind = button.dataset.insertKind as Kind;
      const end = isEnding(kind) && ending(body) >= 0 ? body[ending(body)] : undefined;
      targetLabel.textContent = end ? `Replaces ${name(end.id)} in ${trail.join(' › ')}` : isEnding(kind) ? `Goes at the end of ${trail.join(' › ')}` : replaceEmpty ? `Replaces empty line ${number(replaceEmpty.id)} in ${trail.join(' › ')}` : targetText(body, trail, index).replace('Adds to ', '');
      destination.dataset.replaces = String(!!end);
      const message = end ? `${label(kind)} replaces ${name(end.id)}. Undo restores it.` : isEnding(kind) ? `${label(kind)} goes at the end of ${trail.at(-1)}.` : kind === 'background' ? 'A new background clears the characters on stage.' : '';
      if (message) { note.textContent = message; note.hidden = false; }
    }
    function filter() {
      results.replaceChildren(); items = []; active = 0;
      const search = query.value.trim().toLowerCase();
      const common = ['dialogue', 'narration', 'condition', 'choice', 'background'];
      const matches = kinds.filter(([kind, title, category]) => `${kind} ${title} ${category} ${aliases[kind] ?? ''}`.toLowerCase().includes(search));
      const rank = (title: string) => title.toLowerCase() === search ? 0 : title.toLowerCase().startsWith(search) ? 1 : title.toLowerCase().includes(search) ? 2 : 3;
      const groups = search ? ['Results'] : ['Common', 'Stage', 'Audio', 'Flow', 'State', 'Screens'];
      const columnsOf = search ? [results] : [el('div', 'sc-picker-column'), el('div', 'sc-picker-column')]; if (!search) results.append(...columnsOf);
      for (const group of groups) {
        const entries = search ? [...matches].sort((a, b) => rank(a[1]) - rank(b[1])) : group === 'Common' ? common.map(kind => kinds.find(k => k[0] === kind)!) : matches.filter(([kind, , category]) => category === group && !common.includes(kind));
        if (!entries.length) continue;
        const section = el('section'); section.role = 'group'; section.ariaLabel = group; section.dataset.group = group; section.append(el('h3', '', group === 'Flow' ? 'Scene flow' : group));
        for (const [kind, title] of entries) {
          const button = action('', () => { dialog.close(); insert(kind, body, trail, index, current()?.speaker, replaceEmpty); }, false, `insert-${kind}`);
          button.dataset.insertKind = kind; button.role = 'option'; button.tabIndex = -1; button.id = `sr-result-${++elementId}`; button.ariaLabel = title;
          const text = el('span', 'sc-picker-text'); text.append(el('strong', '', title), el('small', '', descriptions[kind] ?? ''));
          button.append(beatIcon(kind), text); button.title = descriptions[kind] ?? title;
          button.onpointerenter = () => { active = items.indexOf(button); highlight(); }; items.push(button); section.append(button);
        } (search ? results : columnsOf[['Common', 'Stage'].includes(group) ? 0 : 1]!).append(section);
      }
      if (!items.length) { const none = el('div', 'sr-picker-empty'); none.append(el('p', '', 'No beat matches that search.'), action('Clear search', () => { query.value = ''; filter(); query.focus(); })); results.append(none); }
      results.dataset.layout = search ? 'list' : 'groups'; highlight(); results.scrollTop = 0;
    }
    query.oninput = filter;
    query.onkeydown = event => { if (event.isComposing) return; if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dialog.close(); return; } if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); active = Math.max(0, Math.min(items.length - 1, active + (event.key === 'ArrowDown' ? 1 : -1))); highlight(); items[active]?.scrollIntoView({ block: 'nearest' }); } else if (event.key === 'Enter') { event.preventDefault(); items[active]?.click(); } };
    const foot = el('footer', 'sc-picker-foot'); foot.append(el('span', 'sr-picker-hint', '↑ ↓ choose · Enter adds · Esc cancels'), note);
    dialog.append(search, results, foot); filter(); query.focus();
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
    const mark = bookmark(); const selectors = ['.sr-workarea', '.sr-sheet', '.sr-reel-strip', '.sr-tracks-scroll', '.sr-inspector', '.sr-game-choices', '.sc-reel', '.sc-condition-groups']; const scrolls = selectors.map(selector => { const node = frame.content.querySelector<HTMLElement>(selector); return { selector, top: node?.scrollTop ?? 0, left: node?.scrollLeft ?? 0 }; });
    syncSelection(); const selectionChanged = renderedSelection !== selected, focusChanged = renderedFocused !== focused; frame.content.replaceChildren(); Object.assign(frame.content.dataset, { variant, focused: String(focused), treeOpen: String(treeOpen), stageExpanded: String(stageExpanded), allTracks: String(allTracks), bottomMode, edits: hasChanges() ? String(changes || 1) : '0', selected }); frame.shell.dataset.writingFocus = String(focused);
    const workspace = el('div', 'sr-workspace'); workspace.append(tree()); const main = el('main', 'sr-writing'); main.append(header()); const area = el('div', 'sr-workarea');
    if (variant === 'cue-sheet') cueSheet(area); else if (variant === 'shot-reel') shotReel(area); else if (combined) combinedStory(area); else stageTracks(area); main.append(area); workspace.append(main); frame.content.append(workspace);
    frame.shell.querySelector('.sr-state')?.remove(); const state = el('details', 'sr-state'); state.append(el('summary', '', 'Prototype state · memory only')); state.ontoggle = () => { if (state.open) { state.querySelector('pre')?.remove(); state.append(el('pre', '', JSON.stringify({ variant, bottomMode, focused, scene: sceneId, selected, editingBranch: reelBranch, visibleBranches: Object.fromEntries(visibleBranches), insertion: { trail: target().trail, index: target().index }, manualPreviewBranch: manual, changes, scenes }, null, 2))); } }; frame.shell.querySelector('.app-footer')!.append(state);
    for (const area of host.querySelectorAll<HTMLTextAreaElement>('.sr-prose')) fit(area);
    // Populate variable-height rows before restoring scroll, avoiding browser scroll anchoring.
    if (combined) { refresh(); alignStripEnds(); }
    for (const position of scrolls) { const node = frame.content.querySelector<HTMLElement>(position.selector); if (node) { node.scrollTop = position.top; node.scrollLeft = position.left; } }
    if (!combined) refresh(); if (!selectionChanged || !mark?.owner || mark.owner === selected) restore(mark);
    if (combined && focusChanged && innerWidth < 900) { area.scrollTop = 0; revealSelection(); }
    else if (focusChanged && focused && variant === 'shot-reel') area.scrollTop = 0;
    else if (selectionChanged || focusChanged) revealSelection();
    if (combined && (selectionChanged || focusChanged)) revealActiveBranch();
    renderedSelection = selected; renderedFocused = focused;
  }
  for (const b of scene().beats) if (b.kind === 'condition' && (variant === 'cue-sheet' || context.state === 'branching')) expanded.add(b.id);
  draw(); status('Fictional sample · changes stay in this preview'); const cleanup = compareBar();
  const key = (event: KeyboardEvent) => {
    if (event.isComposing) return;
    if (event.key === 'Escape' && !host.querySelector('dialog[open]')) { const open = host.querySelector<HTMLDetailsElement>('.sr-more[open],.sr-row-menu[open],.sc-dropdown[open]'); if (open) { open.open = false; open.querySelector<HTMLElement>('summary')?.focus(); event.preventDefault(); } else if (combined && assetSheet) { event.preventDefault(); closeSheet(); } else if (treeOpen) { treeOpen = false; draw(); host.querySelector<HTMLElement>('[data-action="scenes"]')?.focus(); event.preventDefault(); } else if (stageObject) { const object = stageObject; stageObject = ''; draw(); host.querySelector<HTMLElement>(object === 'background' ? '.sr-backdrop-control' : `[data-stage-character="${object}"]`)?.focus(); } }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !(event.target as Element).closest('input,textarea,select,dialog')) { event.preventDefault(); history(event.shiftKey ? redo : undo, event.shiftKey ? undo : redo, event.shiftKey ? 'Redid' : 'Undid'); }
  };
  const outside = (event: MouseEvent) => { for (const menu of host.querySelectorAll<HTMLDetailsElement>('.sr-more[open],.sr-row-menu[open],.sc-dropdown[open]')) if (!menu.contains(event.target as Node)) menu.open = false; if (treeOpen && !(event.target as Element).closest('.sr-scenes,[data-action="scenes"]')) { treeOpen = false; frame.content.dataset.treeOpen = 'false'; host.querySelector<HTMLElement>('[data-action="scenes"]')!.ariaExpanded = 'false'; host.querySelector('.sr-scenes')?.remove(); } };
  let resizeFrame = 0; const resize = () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => { draw(); if (combined) { revealSelection(); revealActiveBranch(); } }); };
  document.addEventListener('keydown', key); document.addEventListener('click', outside); window.addEventListener('resize', resize);
  if (compare) for (const button of frame.shell.querySelectorAll<HTMLButtonElement>('.lp-navigation .tree-item,.brand,.lp-studio-link,.lp-runtime-link')) button.onclick = () => status('Other workspaces are outside this Story mock.');
  return () => { cleanup(); document.removeEventListener('keydown', key); document.removeEventListener('click', outside); window.removeEventListener('resize', resize); cancelAnimationFrame(resizeFrame); host.replaceChildren(); };
}
