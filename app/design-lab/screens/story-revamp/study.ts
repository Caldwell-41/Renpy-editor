import type { LabContext } from '../../contracts.ts';
import { action, element as el, labelled, labPage } from '../../page.ts';
import { prototypeSwitcher } from '../../prototype-switcher.ts';
import { kinds, label, brief, locate, makeSample, type Beat, type Branch, type Kind, type Scene } from './model.ts';
import platform from './platform.svg';
import mara from './mara.svg';
import './style.css';

export type Variant = 'cue-sheet' | 'branch-lanes' | 'shot-reel';
export const variants = [{ id: 'cue-sheet', title: 'Cue sheet' }, { id: 'branch-lanes', title: 'Branch lanes' }, { id: 'shot-reel', title: 'Shot reel' }] as const;

/** Three different layouts, one fictional story. No native calls or durable state. */
export function mountStudy(host: HTMLElement, context: LabContext, variant: Variant, compare?: (variant: Variant) => void) {
  const sample = makeSample(context.state);
  let scenes = sample.scenes, sceneId = scenes[0]!.id;
  if (context.state === 'protected') scenes[0]!.beats.splice(5, 0, sample.beat('customCode', '$ tram_clock.advance()'));
  let selected = scenes[0]!.beats.find(b => b.kind === 'dialogue')?.id ?? scenes[0]!.beats[0]!.id;
  let focused = false, treeOpen = innerWidth >= 1000, previewOpen = true, manual = '', scopedGroup = '', reelBranch = '';
  const expanded = new Set<string>();
  const visibleBranches = new Map<string, string>();
  const undo: string[] = [], redo: string[] = [];
  let changes = 0;
  const frame = labPage(host, context, { screen: 'story', title: 'Story', subtitle: '', dirty: () => changes > 0 });
  frame.shell.classList.add('sr-shell'); frame.content.classList.add('sr-content');
  frame.heading.hidden = true;
  const scene = () => scenes.find(s => s.id === sceneId)!;
  const all = (body: Beat[]): Beat[] => body.flatMap(b => [b, ...b.branches.flatMap(branch => all(branch.beats))]);
  const current = () => all(scene().beats).find(b => b.id === selected);
  function reelContext() {
    const owner = all(scene().beats).find(item => item.branches.some(branch => branch.id === reelBranch));
    const branch = owner?.branches.find(item => item.id === reelBranch);
    return owner && branch ? { owner, branch, trail: [...locate(scene(), owner.id)!.trail, `${branch.name} ${branch.condition}`.trim()] } : undefined;
  }
  const snapshot = () => JSON.stringify({ scenes, sceneId, selected });
  let undoButton: HTMLButtonElement, redoButton: HTMLButtonElement;
  function status(message: string) {
    frame.content.dataset.edits = String(changes);
    frame.status.textContent = `${message} · Only in this preview`;
    if (undoButton) undoButton.disabled = !undo.length;
    if (redoButton) redoButton.disabled = !redo.length;
  }
  function remember(before = snapshot()) { undo.push(before); redo.length = 0; changes++; }
  function change(fn: () => void, message: string) { remember(); fn(); draw(); status(message); }
  function history(from: string[], to: string[]) {
    const previous = from.pop(); if (!previous) return;
    to.push(snapshot()); const data = JSON.parse(previous) as { scenes: Scene[]; sceneId: string; selected: string };
    scenes = data.scenes; sceneId = data.sceneId; selected = data.selected;
    draw(); status('History updated');
  }
  function bind(control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, update: (value: string) => void) {
    let before = snapshot(), recorded = false;
    control.addEventListener('focus', () => { before = snapshot(); recorded = false; });
    control.addEventListener('input', () => {
      if (!recorded) { remember(before); recorded = true; }
      update(control.value); status('Edited');
      updateIllustration();
      if (control instanceof HTMLTextAreaElement) fit(control);
    });
  }
  function input(value: string, name: string, update: (value: string) => void) {
    const control = el('input'); control.value = value; control.ariaLabel = name; bind(control, update); return control;
  }
  function select(values: readonly string[], value: string, name: string, update: (value: string) => void) {
    const control = el('select'); control.ariaLabel = name;
    for (const v of [...new Set([value, ...values])]) { const option = el('option', '', v); option.value = v; control.append(option); }
    control.value = value; bind(control, update); return control;
  }
  function fit(area: HTMLTextAreaElement) { area.style.height = 'auto'; area.style.height = `${Math.max(48, area.scrollHeight)}px`; }
  function prose(b: Beat) {
    const text = el('textarea', 'sr-prose'); text.value = b.text; text.rows = 2;
    text.placeholder = b.kind === 'dialogue' ? 'What do they say?' : 'What happens here?';
    text.ariaLabel = `${label(b.kind)} text`; text.dataset.beatText = b.id;
    bind(text, value => { b.text = value; });
    text.onfocus = () => {
      selected = b.id;
      for (const row of host.querySelectorAll<HTMLElement>('[data-beat]')) row.dataset.selected = String(row.dataset.beat === selected);
      updateIllustration();
    };
    text.onkeydown = event => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault(); const owner = locate(scene(), b.id)!;
        insert('dialogue', owner.body, owner.trail, owner.index + 1, b.speaker);
      } else if (event.key === '/' && !text.value) {
        event.preventDefault(); const owner = locate(scene(), b.id)!; picker(owner.body, owner.trail, owner.index, b);
      }
    };
    return text;
  }
  function modal(title: string) {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = el('dialog', 'lp-dialog sr-dialog'); dialog.ariaLabel = title;
    const head = el('header', 'sr-dialog-head'); head.append(el('h2', '', title), action('Close', () => dialog.close())); dialog.append(head);
    dialog.onclose = () => { dialog.remove(); if (previous?.isConnected) previous.focus(); };
    frame.shell.append(dialog); dialog.showModal(); return dialog;
  }
  function revealReelSelection() {
    const item = host.querySelector<HTMLElement>(`[data-reel-beat="${selected}"]`);
    const strip = host.querySelector<HTMLElement>('.sr-reel-strip');
    const reel = host.querySelector<HTMLElement>('.sr-reel');
    if (!item || !strip || !reel) return;
    const r = item.getBoundingClientRect(), horizontal = strip.getBoundingClientRect(), vertical = reel.getBoundingClientRect();
    if (r.left < horizontal.left) strip.scrollLeft -= horizontal.left - r.left;
    else if (r.right > horizontal.right) strip.scrollLeft += r.right - horizontal.right;
    if (r.top < vertical.top) reel.scrollTop -= vertical.top - r.top;
    else if (r.bottom > vertical.bottom) reel.scrollTop += r.bottom - vertical.bottom;
  }
  function focusText() {
    requestAnimationFrame(() => {
      const text = host.querySelector<HTMLTextAreaElement>(`textarea[data-beat-text="${selected}"]`);
      const fields = host.querySelector<HTMLElement>(`[data-editor-for="${selected}"]`);
      const fallback = host.querySelector<HTMLElement>(`[data-beat="${selected}"] .sr-cue,[data-reel-beat="${selected}"]`);
      (text ?? fields?.querySelector<HTMLElement>('input,select,textarea,button') ?? fallback)?.focus(); revealReelSelection();
    });
  }
  function go(id: string) {
    sceneId = id; scopedGroup = ''; reelBranch = '';
    selected = scene().beats.find(b => ['dialogue', 'narration'].includes(b.kind))?.id ?? scene().beats[0]!.id;
    draw(); status('Scene opened; edits retained');
  }
  function createScene(done?: (newScene: Scene) => void) {
    const dialog = modal(done ? 'Create destination scene' : 'New scene');
    const name = el('input'); name.ariaLabel = 'Scene name'; name.placeholder = 'Give this moment a name'; name.required = true;
    const chapter = el('select'); chapter.ariaLabel = 'Chapter';
    for (const title of new Set(scenes.map(s => s.chapter))) chapter.append(new Option(title, title));
    chapter.value = scene().chapter;
    dialog.append(labelled('Scene name', name), labelled('Chapter', chapter), action('Create scene', () => {
      if (!name.reportValidity()) return;
      const next: Scene = { id: sample.newId(), name: name.value.trim(), chapter: chapter.value, beats: [sample.beat('narration'), sample.beat('return')] };
      change(() => { scenes.push(next); if (done) done(next); else { sceneId = next.id; selected = next.beats[0]!.id; scopedGroup = ''; reelBranch = ''; } }, 'Scene created');
      dialog.close(); focusText();
    }, true)); name.focus();
  }
  function ending(body: Beat[]) { return body.findIndex(b => ['choice', 'jump', 'return'].includes(b.kind)); }
  function defaultIndex(body = scene().beats) { const end = ending(body); return end < 0 ? body.length : end; }
  function insert(kind: Kind, body: Beat[], trail: string[], index: number, speaker = 'Mara', replaceEmpty?: Beat) {
    const b = sample.beat(kind); b.speaker = speaker;
    if (kind === 'condition') b.branches = [{ id: sample.newId(), name: 'If', condition: 'has_ticket is true', beats: [] }, { id: sample.newId(), name: 'Otherwise', condition: '', beats: [] }];
    change(() => {
      if (replaceEmpty && body[index] === replaceEmpty && !replaceEmpty.text.trim()) body.splice(index, 1);
      if (['choice', 'jump', 'return'].includes(kind)) {
        const end = ending(body); if (end >= 0) body.splice(end, body.length - end, b); else body.push(b);
      } else body.splice(Math.min(index, defaultIndex(body)), 0, b);
      selected = b.id;
      if (kind === 'condition') expanded.add(b.id);
    }, `${label(kind)} added in ${trail.at(-1)}`); focusText();
  }
  function insertionName(body: Beat[], trail: string[], index: number) {
    return `${trail.join(' / ')} · ${body[index] ? 'before ' + brief(body[index]!).slice(0, 64) : 'at end of body'}`;
  }
  function picker(body = scene().beats, trail = [scene().name], index = defaultIndex(body), replaceEmpty?: Beat) {
    const dialog = modal('Add a beat');
    const destination = `${replaceEmpty ? 'Replace empty line · ' : ''}${insertionName(body, trail, index)}`;
    dialog.append(el('p', 'sr-insertion-target', destination));
    const query = el('input'); query.type = 'search'; query.placeholder = 'Find dialogue, background, music, condition…'; query.ariaLabel = 'Find a beat';
    const results = el('div', 'sr-picker-results');
    function filter() {
      results.replaceChildren();
      const matched = kinds.filter(([kind, name, category]) => `${kind} ${name} ${category}`.toLowerCase().includes(query.value.toLowerCase().trim()));
      for (const category of new Set(matched.map(k => k[2]))) {
        const group = el('section'); group.append(el('h3', '', category));
        for (const [kind, name] of matched.filter(k => k[2] === category)) {
          const button = action(name, () => { dialog.close(); insert(kind, body, trail, index, current()?.speaker, replaceEmpty); });
          if (['choice', 'jump', 'return'].includes(kind) && ending(body) >= 0) button.append(el('small', '', 'Replaces this body’s ending'));
          group.append(button);
        }
        results.append(group);
      }
      if (!matched.length) results.append(el('p', '', 'No matching beat. Try a shorter name.'));
    }
    query.oninput = filter;
    query.onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); results.querySelector<HTMLButtonElement>('button')?.click(); } };
    filter(); dialog.append(query, results); query.focus();
  }
  function gap(body: Beat[], trail: string[], index: number, text = 'Add beat here') {
    const button = action('+', () => picker(body, trail, index)); button.className = 'sr-gap';
    button.ariaLabel = `${text} · ${insertionName(body, trail, index)}`; button.title = button.ariaLabel; return button;
  }
  function moveTo(b: Beat) {
    const owner = locate(scene(), b.id)!;
    const dialog = modal('Move beat');
    const choices: { body: Beat[]; trail: string[] }[] = [{ body: scene().beats, trail: [scene().name] }];
    function visit(body: Beat[], trail: string[]) { for (const parent of body) if (parent !== b) for (const branch of parent.branches) { const path = [...trail, `${branch.name} ${branch.condition}`.trim()]; choices.push({ body: branch.beats, trail: path }); visit(branch.beats, path); } }
    visit(scene().beats, [scene().name]);
    const destination = el('select'); destination.ariaLabel = 'Move destination';
    choices.forEach((c, i) => destination.append(new Option(c.trail.join(' / '), String(i))));
    dialog.append(el('p', '', 'Move before the destination body’s ending. The whole selected group moves together.'), labelled('Destination body', destination), action('Move beat', () => {
      const target = choices[Number(destination.value)]!;
      change(() => { owner.body.splice(owner.index, 1); target.body.splice(defaultIndex(target.body), 0, b); }, `Moved to ${target.trail.at(-1)}`); dialog.close();
    }, true));
  }
  function rowMenu(b: Beat) {
    const menu = el('details', 'sr-row-menu'); const summary = el('summary', '', '⋯'); summary.ariaLabel = `Actions for ${label(b.kind)}`; menu.append(summary);
    const controls = el('div', 'sr-row-popover'); const owner = locate(scene(), b.id)!;
    for (const [direction, title] of [[-1, 'Move up'], [1, 'Move down']] as const) {
      const neighbour = owner.body[owner.index + direction];
      const button = action(title, () => change(() => { owner.body.splice(owner.index, 1); owner.body.splice(owner.index + direction, 0, b); }, 'Beat moved'));
      button.disabled = !neighbour || ['choice', 'jump', 'return', 'customCode'].includes(b.kind) || ['choice', 'jump', 'return', 'customCode'].includes(neighbour.kind); controls.append(button);
    }
    const move = action('Move to body…', () => moveTo(b)); move.disabled = ['choice', 'jump', 'return', 'customCode'].includes(b.kind);
    const remove = action('Delete beat', () => {
      if (b.kind === 'condition') {
        const dialog = modal('Delete condition and its beats?'); dialog.append(el('p', '', 'This removes every branch in this group. Undo restores the group.'), action('Delete group', () => { change(() => owner.body.splice(owner.index, 1), 'Condition deleted'); dialog.close(); }));
      } else change(() => { owner.body.splice(owner.index, 1); selected = owner.body[Math.max(0, owner.index - 1)]?.id ?? ''; }, 'Beat deleted');
    }); remove.disabled = ['choice', 'jump', 'return', 'customCode'].includes(b.kind);
    controls.append(move, remove, action('Open in Source', () => source(b)));
    if (b.kind === 'condition') controls.append(action('Add Else If', () => change(() => b.branches.splice(Math.max(1, b.branches.length - 1), 0, { id: sample.newId(), name: 'Else If', condition: 'trust is at least 5', beats: [] }), 'Else If added')));
    menu.append(controls); return menu;
  }
  function destination(value: string, name: string, update: (value: string) => void) {
    const control = el('select'); control.ariaLabel = name;
    for (const s of scenes) control.append(new Option(s.name, s.id)); control.value = value; bind(control, update); return control;
  }
  function fields(b: Beat, includeText = true) {
    const form = el('div', 'sr-fields'); form.dataset.editorFor = b.id;
    if (b.kind === 'dialogue' || b.kind === 'narration') {
      if (b.kind === 'dialogue') form.append(labelled('Speaker', select(['Mara', 'Eli'], b.speaker, 'Speaker', value => b.speaker = value)));
      if (includeText) form.append(prose(b));
      if (variant !== 'shot-reel') form.append(action('Next dialogue', () => { const t = locate(scene(), b.id)!; insert('dialogue', t.body, t.trail, t.index + 1, b.speaker); }));
    } else if (b.kind === 'choice') {
      b.options.forEach((option, i) => {
        const row = el('div', 'sr-option'); row.append(input(option.text, `Choice ${i + 1} text`, value => option.text = value), destination(option.target, `Choice ${i + 1} destination`, value => option.target = value));
        row.append(input(option.guard, `Choice ${i + 1} availability`, value => option.guard = value)); row.lastElementChild!.setAttribute('placeholder', 'Available when… (optional)');
        row.append(action('Make scene', () => createScene(s => { option.target = s.id; })), action('Open scene', () => go(option.target))); form.append(row);
      });
      form.append(action('+ Option', () => change(() => b.options.push({ text: '', target: 'stranger', guard: '' }), 'Option added')));
    } else if (b.kind === 'condition') {
      form.append(el('p', 'sr-explanation', 'First matching branch wins. Editing a branch does not select a preview route.'));
      for (const branch of b.branches) {
        const line = el('div', 'sr-branch-control'); line.append(el('strong', '', branch.name));
        if (branch.name !== 'Otherwise') line.append(input(branch.condition, `${branch.name} condition`, value => branch.condition = value));
        line.append(action('Open body', () => { scopedGroup = b.id; reelBranch = branch.id; selected = branch.beats[0]?.id ?? b.id; expanded.add(b.id); draw(); })); form.append(line);
      }
    } else if (b.kind === 'call' || b.kind === 'jump') {
      form.append(labelled('Destination', destination(b.target, 'Destination scene', value => b.target = value)), el('p', 'sr-explanation', b.kind === 'call' ? 'Returns to the next beat. The preview does not execute this scene.' : 'Does not return to this scene.'), action('Open destination', () => go(b.target)));
    } else if (b.kind === 'customCode') {
      form.append(el('p', 'sr-explanation', 'Protected custom source. Preview state is unknown after this beat.'), el('pre', 'sr-code', b.text), action('Open in Source', () => source(b)));
    } else if (b.kind === 'return') form.append(el('p', 'sr-explanation', 'Returns to the caller, or ends the story. Add Choice or Jump to replace this ending.'));
    else if (b.kind.endsWith('Screen')) form.append(labelled('Screen', select(['Help', 'Inventory'], b.asset === 'Neutral' ? 'Help' : b.asset, 'Screen', value => b.asset = value)), el('p', 'sr-explanation', b.kind === 'callScreen' ? 'Wait for this dialog to finish, then continue.' : b.kind === 'showScreen' ? 'Show this panel while the story continues.' : 'Hide the panel and continue.'));
    else if (b.kind === 'setVariable') form.append(labelled('Variable', select(['has_ticket', 'trust'], b.text || 'has_ticket', 'Variable', value => b.text = value)), labelled('Value', input(b.value, 'Variable value', value => b.value = value)));
    else {
      if (b.kind === 'background') form.append(labelled('Background', select(['Rainy platform', 'Station at dawn'], b.asset, 'Background', value => b.asset = value)));
      else if (['showCharacter', 'changeAppearance', 'placement', 'hideCharacter'].includes(b.kind)) {
        form.append(labelled('Character', select(['Mara', 'Eli'], b.speaker, 'Character', value => b.speaker = value)));
        if (b.kind !== 'hideCharacter') form.append(labelled('Appearance', select(['Neutral', 'Concerned'], b.asset, 'Appearance', value => b.asset = value)), labelled('Position', select(['Left', 'Centre', 'Right'], b.placement, 'Position', value => b.placement = value)));
      } else if (b.kind === 'playMusic') form.append(labelled('Music', select(['Night service', 'Last departure'], b.text || 'Night service', 'Music', value => b.text = value)));
      else if (b.kind === 'playSfx') form.append(labelled('Sound', select(['Tram bell', 'Footsteps'], b.asset, 'Sound', value => b.asset = value)));
      else if (b.kind === 'stopMusic') form.append(el('p', 'sr-explanation', 'Stops the current music. Audio is not played in this prototype.'));
      if (['background', 'showCharacter', 'hideCharacter', 'changeAppearance', 'transition'].includes(b.kind)) form.append(labelled('Transition', select(['None', 'Dissolve', 'Fade'], b.transition, 'Transition', value => b.transition = value)));
    }
    return form;
  }
  function source(b = current()) {
    const dialog = modal('Source · read-only sample');
    const code = b ? b.kind === 'customCode' ? b.text : b.kind === 'dialogue' ? `m ${JSON.stringify(b.text)}` : `# ${label(b.kind)}\n# ${brief(b)}` : '# Select a beat';
    dialog.append(el('pre', 'sr-code', code), el('p', '', 'This sample never reads or writes a project. Production Source remains authoritative.'));
  }
  function assist() {
    const b = current(); const dialog = modal('Assist · sample rewrite');
    if (!b || !['dialogue', 'narration'].includes(b.kind)) { dialog.append(el('p', '', 'Select a dialogue or narration beat first.')); return; }
    dialog.append(el('p', '', 'Fictional local model · selected beat and approved Mara card · no request is sent.'));
    const task = el('textarea'); task.ariaLabel = 'Rewrite instructions'; task.value = 'Make this line more curious, less guarded.';
    dialog.append(labelled('What would you like to change?', task), action('Review sample proposal', () => {
      const proposed = 'You heard it too? Tell me you heard the bell.';
      dialog.replaceChildren(el('h2', '', 'Review the rewrite'), el('p', '', 'Before'), el('blockquote', '', b.text), el('p', '', 'Proposed'), el('blockquote', '', proposed), action('Reject', () => dialog.close()), action('Apply to preview', () => { change(() => b.text = proposed, 'Sample proposal applied'); dialog.close(); }, true));
    }, true));
  }
  function notes() {
    const dialog = modal('Design notes · future connections');
    dialog.append(el('p', '', 'Prototype only. Future tools are not implemented here.'));
    for (const [title, copy] of [
      ['Cue sheet', 'Optimize scanning and consecutive writing. Timing and state provenance can expand at the selected row, without a permanent inspector.'],
      ['Branch lanes', 'Compare alternatives directly. Future provenance can sit beside each guard; deeper branches use scoped lanes instead of narrower text.'],
      ['Shot reel', 'Compose against the image. Future drag/resize belongs on the stage; animation and idle controls extend appearances. The reel is statement order, not a timed Timeline.'],
      ['Later tools', 'Timeline opens for a selected beat. Supported Run From Here requires a separate state/provenance inspection step. Unknown state remains explicit. No future runtime or animation behavior is simulated.'],
    ]) dialog.append(el('h3', '', title), el('p', '', copy));
  }
  function header() {
    const bar = el('header', 'sr-topbar');
    const toggle = action('Scenes', () => { treeOpen = !treeOpen; draw(); }); toggle.ariaExpanded = String(treeOpen);
    bar.append(toggle, el('h1', '', scene().name));
    const tools = el('div', 'sr-top-tools');
    const focus = action(focused ? 'Visual mode' : 'Writing focus', () => { focused = !focused; draw(); status(focused ? 'Writing focus; all beat tools remain available' : 'Visual mode'); }); focus.ariaPressed = String(focused); focus.dataset.focusToggle = '';
    undoButton = action('Undo', () => history(undo, redo)); redoButton = action('Redo', () => history(redo, undo)); undoButton.disabled = !undo.length; redoButton.disabled = !redo.length;
    const more = el('details', 'sr-more'); more.append(el('summary', '', 'More')); const menu = el('div', 'sr-top-menu');
    menu.append(action('Assist', assist), action('Source', () => source()), action('Design notes', notes), action('Rename scene', () => { const d = modal('Rename scene'); const name = el('input'); name.value = scene().name; name.ariaLabel = 'Scene name'; d.append(name, action('Rename', () => { if (name.value.trim()) { change(() => scene().name = name.value.trim(), 'Scene renamed'); d.close(); } })); })); more.append(menu);
    tools.append(focus, undoButton, redoButton, action('+ Add beat', () => {
      const t = locate(scene(), selected), reel = variant === 'shot-reel' ? reelContext() : undefined;
      if (reel && t?.body !== reel.branch.beats) picker(reel.branch.beats, reel.trail, defaultIndex(reel.branch.beats));
      else picker(t?.body, t?.trail, t ? t.index + 1 : undefined);
    }, true), more); bar.append(tools); return bar;
  }
  function tree() {
    const aside = el('aside', 'sr-scenes'); aside.ariaLabel = 'Scenes';
    aside.append(action('+ New scene', () => createScene(), true));
    for (const chapter of new Set(scenes.map(s => s.chapter))) {
      aside.append(el('h2', '', chapter));
      for (const s of scenes.filter(s => s.chapter === chapter)) {
        const button = action(s.name, () => { if (innerWidth < 760) treeOpen = false; go(s.id); }); button.className = 'sr-scene-link'; button.ariaCurrent = s.id === sceneId ? 'page' : null; aside.append(button);
      }
    }
    return aside;
  }
  function updateIllustration() {
    const b = current();
    if (b?.kind === 'background') for (const stage of host.querySelectorAll('.sr-stage')) stage.classList.toggle('sr-dawn', b.asset === 'Station at dawn');
    if (b && ['showCharacter', 'changeAppearance', 'placement'].includes(b.kind)) for (const character of host.querySelectorAll<HTMLElement>('.sr-character')) character.style.left = b.placement === 'Left' ? '25%' : b.placement === 'Right' ? '75%' : '52%';
    if (b && ['dialogue', 'narration'].includes(b.kind) && !manual) {
      for (const text of host.querySelectorAll('.sr-preview-caption p')) text.textContent = b.text;
      for (const speaker of host.querySelectorAll('.sr-preview-caption strong')) speaker.textContent = b.kind === 'dialogue' ? b.speaker : 'Selected beat';
    }
  }
  function preview() {
    const wrap = el('section', 'sr-preview'); wrap.ariaLabel = 'Illustrative scene preview';
    const top = el('div', 'sr-preview-title'); top.append(el('span', '', 'Illustrative preview'), action(previewOpen ? 'Hide stage' : 'Show stage', () => { previewOpen = !previewOpen; draw(); })); wrap.append(top);
    if (!previewOpen) return wrap;
    const stage = el('div', 'sr-stage'); stage.dataset.stage = '';
    const bg = el('img', 'sr-backdrop'); bg.src = platform; bg.alt = 'Fictional rain-soaked tram platform';
    const before = scene().beats.slice(0, Math.max(0, scene().beats.findIndex(b => b.id === selected)) + 1);
    const background = before.findLast(b => b.kind === 'background'); if (background?.asset === 'Station at dawn') stage.classList.add('sr-dawn');
    stage.append(bg);
    const character = el('button', 'sr-character'); character.ariaLabel = 'Character staging actions'; const image = el('img'); image.src = mara; image.alt = 'Mara, wearing a brown coat'; character.append(image);
    character.onclick = () => {
      const d = modal('Change character staging');
      d.append(el('p', '', 'Edit the contributing beat, or add an explicit change at the current position.'));
      const existing = scene().beats.find(b => b.kind === 'showCharacter');
      if (existing) d.append(action('Edit contributing beat', () => { selected = existing.id; draw(); d.close(); }));
      d.append(action('Add change here', () => { d.close(); const t = locate(scene(), selected); insert('changeAppearance', t?.body ?? scene().beats, t?.trail ?? [scene().name], t?.index ?? defaultIndex()); }));
    }; stage.append(character);
    const uncertainty = before.some(b => ['condition', 'call', 'customCode'].includes(b.kind)) || !!locate(scene(), selected)?.trail.slice(1).length;
    const notice = el('div', 'sr-preview-notice', uncertainty ? 'Partial preview · route state is not evaluated' : 'Scene-local illustration · no game execution'); stage.append(notice);
    if (variant !== 'shot-reel') {
      const caption = el('div', 'sr-preview-caption'); const b = current(); caption.append(el('strong', '', b?.kind === 'dialogue' ? b.speaker : 'Selected beat'), el('p', '', b ? ['dialogue', 'narration'].includes(b.kind) ? b.text : brief(b) : 'Start writing your scene.')); stage.append(caption);
    }
    wrap.append(stage);
    const route = el('select'); route.ariaLabel = 'Illustrative preview branch';
    for (const [v, text] of [['', 'No manual branch'], ['if', 'Manual If preview'], ['else', 'Manual Otherwise preview']]) route.append(new Option(text, v));
    route.value = manual; route.onchange = () => {
      manual = route.value;
      const group = scene().beats.find(b => b.kind === 'condition');
      const branch = group?.branches[manual === 'else' ? 1 : 0];
      const line = branch?.beats.find(b => ['dialogue', 'narration'].includes(b.kind));
      notice.textContent = manual ? `Manual ${branch?.name ?? 'branch'} illustration · not a playthrough` : 'Partial preview · route state is not evaluated';
      const caption = stage.querySelector('.sr-preview-caption p'); if (caption) caption.textContent = manual && line ? line.text : current()?.text ?? '';
      status('Manual preview selection changed; editing target unchanged');
    };
    if (manual) route.dispatchEvent(new Event('change'));
    wrap.append(route); return wrap;
  }
  function row(b: Beat, body: Beat[], trail: string[], index: number, nested = false) {
    const result = el('article', `sr-row sr-${b.kind}`); result.dataset.beat = b.id; result.dataset.selected = String(selected === b.id);
    const top = el('div', 'sr-row-line');
    const number = action(String(index + 1).padStart(2, '0'), () => { selected = b.id; draw(); }); number.className = 'sr-number'; number.ariaLabel = `Select ${label(b.kind)} beat ${index + 1}`;
    top.append(number, el('span', 'sr-kind', label(b.kind)));
    if (b.kind === 'dialogue' || b.kind === 'narration') {
      if (b.kind === 'dialogue') top.append(select(['Mara', 'Eli'], b.speaker, `Speaker for beat ${index + 1}`, value => b.speaker = value));
      else top.append(el('span', 'sr-narrator', 'Narrator'));
      top.append(prose(b));
    } else {
      const open = action(brief(b), () => { selected = b.id; if (b.kind === 'condition') { if (expanded.has(b.id)) expanded.delete(b.id); else expanded.add(b.id); } draw(); });
      open.className = 'sr-cue'; top.append(open);
    }
    top.append(rowMenu(b)); result.append(top);
    if (selected === b.id && !['dialogue', 'narration', 'condition'].includes(b.kind)) result.append(fields(b));
    if (b.kind === 'condition' && expanded.has(b.id)) {
      if (nested && variant === 'branch-lanes') result.append(action('Open nested alternatives', () => { scopedGroup = b.id; draw(); }));
      else for (const branch of b.branches) result.append(branchBody(branch, [...trail, `${branch.name} ${branch.condition}`.trim()], true));
      result.append(el('div', 'sr-rejoin', 'Continue after condition · falling-through paths only'));
    }
    if (!['choice', 'jump', 'return'].includes(b.kind)) result.append(gap(body, trail, index + 1));
    return result;
  }
  function branchBody(branch: Branch, trail: string[], inline = false) {
    const section = el('section', inline ? 'sr-inline-branch' : 'sr-lane'); section.dataset.branch = branch.id;
    const title = el('div', 'sr-lane-title'); title.append(el('strong', '', branch.name));
    if (branch.name !== 'Otherwise') title.append(input(branch.condition, `${branch.name} condition`, value => branch.condition = value));
    section.append(title);
    branch.beats.forEach((b, i) => section.append(row(b, branch.beats, trail, i, true)));
    section.append(action('+ Add beat to ' + branch.name, () => picker(branch.beats, trail, defaultIndex(branch.beats)))); return section;
  }
  function empty(body: Beat[], trail: string[]) {
    const box = el('div', 'sr-empty'); box.append(el('h2', '', 'Your scene starts here.'), el('p', '', 'A place. A voice. Something worth saying.'));
    const actions = el('div'); actions.append(action('Write dialogue', () => insert('dialogue', body, trail, defaultIndex(body)), true), action('Write narration', () => insert('narration', body, trail, defaultIndex(body))), action('Add a background', () => insert('background', body, trail, defaultIndex(body)))); box.append(actions); return box;
  }
  function cueSheet(parent: HTMLElement) {
    const layout = el('div', 'sr-cue-layout'); const sheet = el('section', 'sr-sheet'); sheet.ariaLabel = 'Cue sheet writing';
    const headings = el('div', 'sr-sheet-heading'); for (const title of ['Beat', 'Speaker', 'Story / cue']) headings.append(el('span', '', title)); sheet.append(headings);
    if (scene().beats.length === 1 && scene().beats[0]!.kind === 'return') sheet.append(empty(scene().beats, [scene().name]));
    scene().beats.forEach((b, i) => sheet.append(row(b, scene().beats, [scene().name], i)));
    layout.append(sheet); if (!focused) { const dock = el('aside', 'sr-preview-dock'); dock.append(preview(), el('p', 'sr-key-hint', '⌘ / Ctrl + Enter · next dialogue\n/ in an empty line · find a beat')); layout.append(dock); }
    parent.append(layout);
  }
  function branchLanes(parent: HTMLElement) {
    const layout = el('div', 'sr-lanes-layout'); const document = el('section', 'sr-lanes-document');
    function columnsFor(group: Beat) {
      const wrap = el('div'); const columns = el('div', 'sr-lane-columns');
      const chooser = el('select', 'sr-compact-branch'); chooser.ariaLabel = 'Visible branch';
      const visible = visibleBranches.get(group.id) ?? group.branches[0]!.id;
      group.branches.forEach(branch => {
        chooser.append(new Option(`${branch.name}${branch.condition ? ' · ' + branch.condition : ''}`, branch.id));
        const lane = branchBody(branch, [...locate(scene(), group.id)!.trail, `${branch.name} ${branch.condition}`.trim()]);
        lane.classList.toggle('sr-inactive-branch', branch.id !== visible); columns.append(lane);
      });
      chooser.value = visible;
      chooser.onchange = () => {
        visibleBranches.set(group.id, chooser.value);
        for (const lane of columns.querySelectorAll<HTMLElement>('[data-branch]')) lane.classList.toggle('sr-inactive-branch', lane.dataset.branch !== chooser.value);
        selected = group.branches.find(b => b.id === chooser.value)?.beats[0]?.id ?? group.id;
        status('Branch opened; other drafts retained');
      };
      wrap.append(chooser, columns); return wrap;
    }
    const selectedGroup = all(scene().beats).find(b => b.id === scopedGroup);
    if (selectedGroup) {
      const path = el('nav', 'sr-scope-nav'); path.ariaLabel = 'Branch ancestry'; path.append(action('← Whole scene', () => { scopedGroup = ''; draw(); }));
      function ancestors(body: Beat[], parents: Beat[] = []): Beat[] | undefined {
        for (const beat of body) {
          if (beat.id === selectedGroup!.id) return parents;
          for (const branch of beat.branches) { const found = ancestors(branch.beats, [...parents, beat]); if (found) return found; }
        }
        return undefined;
      }
      for (const parent of ancestors(scene().beats) ?? []) path.append(action(brief(parent), () => { scopedGroup = parent.id; draw(); }));
      document.append(path, el('h2', 'sr-group-heading', `${locate(scene(), selectedGroup.id)!.trail.join(' / ')} / Alternatives`));
      document.append(columnsFor(selectedGroup));
    } else {
      if (scene().beats.length === 1) document.append(empty(scene().beats, [scene().name]));
      scene().beats.forEach((b, i) => {
        if (b.kind !== 'condition') { document.append(row(b, scene().beats, [scene().name], i)); return; }
        const header = el('header', 'sr-group-heading'); header.append(el('strong', '', brief(b)), el('span', '', 'First match wins'), rowMenu(b)); document.append(header);
        document.append(columnsFor(b), el('div', 'sr-rejoin', 'Continue after condition · falling-through paths only'), gap(scene().beats, [scene().name], i + 1));
      });
    }
    layout.append(document);
    if (!focused) { const drawer = el('details', 'sr-preview-drawer'); drawer.append(el('summary', '', 'Scene preview · illustrative'), preview()); layout.append(drawer); }
    parent.append(layout);
  }
  function shotReel(parent: HTMLElement) {
    const layout = el('div', 'sr-reel-layout'); const composer = el('section', 'sr-shot-composer');
    if (!focused) composer.append(preview());
    const b = current(); const caption = el('div', 'sr-author-caption'); caption.dataset.caption = '';
    if (scene().beats.length === 1 && scene().beats[0]!.kind === 'return') caption.append(empty(scene().beats, [scene().name]));
    else if (b) {
      const name = el('div', 'sr-caption-heading'); name.append(el('strong', '', `${label(b.kind)} · edit this beat`));
      if (['dialogue', 'narration'].includes(b.kind)) name.append(action('Next dialogue', () => { const t = locate(scene(), b.id)!; insert('dialogue', t.body, t.trail, t.index + 1, b.speaker); }));
      name.append(rowMenu(b)); caption.append(name, fields(b));
    }
    else caption.append(empty(scene().beats, [scene().name]));
    composer.append(caption); layout.append(composer);
    const reel = el('section', 'sr-reel'); reel.ariaLabel = 'Ordered beat reel';
    let body = scene().beats, trail = [scene().name];
    const context = reelContext();
    if (context) {
      body = context.branch.beats; trail = context.trail;
      reel.append(action('← Scene body', () => {
        reelBranch = '';
        selected = scene().beats.find(beat => all([beat]).some(item => item.id === context.owner.id))!.id;
        draw();
      }));
    }
    reel.append(el('div', 'sr-reel-target', trail.join(' / ')));
    const strip = el('div', 'sr-reel-strip');
    body.forEach((item, i) => {
      strip.append(gap(body, trail, i)); const button = action('', () => { selected = item.id; draw(); }); button.className = 'sr-reel-beat'; button.dataset.selected = String(item.id === selected); button.dataset.reelBeat = item.id;
      button.append(el('span', '', `${String(i + 1).padStart(2, '0')} · ${label(item.kind)}`), el('p', '', brief(item))); strip.append(button);
    });
    strip.append(gap(body, trail, defaultIndex(body), 'Add beat')); reel.append(strip);
    if (b?.kind === 'condition') {
      const branches = el('div', 'sr-reel-branches');
      for (const branch of b.branches) branches.append(action(`${branch.name} ${branch.condition}`.trim(), () => { reelBranch = branch.id; selected = branch.beats[0]?.id ?? b.id; draw(); }));
      reel.append(branches);
    }
    layout.append(reel); parent.append(layout);
  }
  function compareBar() {
    if (!compare) return prototypeSwitcher(frame.shell, variants, variant, () => changes > 0);
    const bar = el('nav', 'sr-compare'); bar.ariaLabel = 'Prototype layout comparison';
    const next = (direction: number) => {
      const target = variants[(variants.findIndex(v => v.id === variant) + direction + variants.length) % variants.length]!.id;
      if (!changes) { compare(target); return; }
      const dialog = modal('Switch prototype layout?');
      dialog.append(el('p', '', 'The next layout opens a fresh sample. Your edits in this preview will reset.'), action('Keep editing', () => dialog.close()), action('Switch and reset sample', () => { dialog.close(); compare(target); }));
    };
    bar.append(action('←', () => next(-1)), el('span', '', variants.find(v => v.id === variant)!.title), action('→', () => next(1)));
    bar.querySelectorAll('button')[0]!.ariaLabel = 'Previous prototype layout'; bar.querySelectorAll('button')[1]!.ariaLabel = 'Next prototype layout'; frame.shell.append(bar);
    const key = (event: KeyboardEvent) => { if (!event.defaultPrevented && !event.altKey && !event.ctrlKey && !event.metaKey && !(event.target as Element).closest('input,textarea,select,[contenteditable],dialog') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); next(event.key === 'ArrowLeft' ? -1 : 1); } };
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key);
  }
  function draw() {
    const scroll = ['.sr-workarea', '.sr-reel', '.sr-reel-strip'].map(selector => {
      const node = frame.content.querySelector<HTMLElement>(selector);
      return { selector, top: node?.scrollTop ?? 0, left: node?.scrollLeft ?? 0 };
    });
    frame.content.replaceChildren(); frame.content.dataset.variant = variant; frame.content.dataset.focused = String(focused); frame.content.dataset.treeOpen = String(treeOpen);
    const layout = el('div', 'sr-workspace'); layout.append(tree()); const main = el('main', 'sr-writing'); main.append(header()); const content = el('div', 'sr-workarea');
    if (variant === 'cue-sheet') cueSheet(content); else if (variant === 'branch-lanes') branchLanes(content); else shotReel(content);
    main.append(content); const state = el('details', 'sr-state'); state.append(el('summary', '', 'Prototype state · memory only'));
    state.ontoggle = () => { if (state.open) { state.querySelector('pre')?.remove(); state.append(el('pre', '', JSON.stringify({ variant, focused, scene: sceneId, selected, manualPreviewBranch: manual, changes, scenes }, null, 2))); } };
    main.append(state); layout.append(main); frame.content.append(layout);
    for (const area of host.querySelectorAll<HTMLTextAreaElement>('.sr-prose')) fit(area);
    for (const position of scroll) { const node = frame.content.querySelector<HTMLElement>(position.selector); if (node) { node.scrollTop = position.top; node.scrollLeft = position.left; } }
    revealReelSelection();
    updateIllustration();
  }
  if (context.state === 'branching' || context.state === 'populated' && variant === 'branch-lanes') {
    const group = scene().beats.find(b => b.kind === 'condition')!; expanded.add(group.id);
    if (variant === 'branch-lanes') { scopedGroup = group.id; selected = group.branches[0]!.beats[0]!.id; }
  }
  draw(); status('Fictional sample ready'); const cleanup = compareBar();
  if (compare) for (const button of frame.shell.querySelectorAll<HTMLButtonElement>('.lp-navigation .tree-item,.brand,.lp-studio-link,.lp-runtime-link')) button.onclick = () => status('Other workspaces are outside this standalone Story study');
  return () => { cleanup(); host.replaceChildren(); };
}
