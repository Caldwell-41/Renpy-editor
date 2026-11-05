import type { LabContext } from '../../contracts.ts';
import { action, element as el, labelled, labPage } from '../../page.ts';
import { prototypeSwitcher } from '../../prototype-switcher.ts';
import { kinds, label, brief, locate, makeSample, type Beat, type Branch, type Kind, type Scene } from './model.ts';
import platform from './platform.svg';
import mara from './mara.svg';
import './style.css';

export type Variant = 'cue-sheet' | 'shot-reel' | 'stage-tracks';
export const variants = [{ id: 'cue-sheet', title: 'Cue sheet' }, { id: 'shot-reel', title: 'Shot reel' }, { id: 'stage-tracks', title: 'Stage tracks' }] as const;

/** Three different layouts, one fictional story. No native calls or durable state. */
export function mountStudy(host: HTMLElement, context: LabContext, variant: Variant, compare?: (variant: Variant) => void) {
  const sample = makeSample(context.state);
  let scenes = sample.scenes, sceneId = scenes[0]!.id;
  if (context.state === 'protected') scenes[0]!.beats.splice(5, 0, sample.beat('customCode', '$ tram_clock.advance()'));
  let selected = scenes[0]!.beats.find(b => b.kind === 'dialogue')?.id ?? scenes[0]!.beats[0]!.id;
  let focused = false, treeOpen = false, stageExpanded = false, manual = '', reelBranch = '', stageObject = '', hideSaybox = false, allTracks = false;
  const expanded = new Set<string>();
  const visibleBranches = new Map<string, string>();
  const undo: string[] = [], redo: string[] = [];
  let changes = 0;
  const frame = labPage(host, context, { screen: 'story', title: 'Story', subtitle: '', dirty: () => changes > 0 });
  frame.shell.classList.add('sr-shell'); frame.content.classList.add('sr-content');
  frame.shell.querySelector<HTMLElement>('.lp-project-shell')!.dataset.navigationCollapsed = 'true';
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
    control.addEventListener('keydown', inputEvent => { const event = inputEvent as KeyboardEvent; if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key === 'Enter') { event.preventDefault(); before = snapshot(); recorded = false; status('Writing kept in this preview'); } });
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
      for (const fields of host.querySelectorAll('.sr-row>.sr-fields')) fields.remove();
      if (variant === 'cue-sheet') { stageObject = ''; host.querySelector('.sr-inspector')?.replaceWith(inspector(true)); }
      updateIllustration();
    };
    text.onkeydown = event => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'Enter') {
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
    sceneId = id; reelBranch = ''; stageObject = '';
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
      change(() => { scenes.push(next); if (done) done(next); else { sceneId = next.id; selected = next.beats[0]!.id; reelBranch = ''; } }, 'Scene created');
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
      selected = b.id; stageObject = '';
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
        line.append(action('Open body', () => { reelBranch = branch.id; visibleBranches.set(b.id, branch.id); selected = branch.beats[0]?.id ?? b.id; expanded.add(b.id); draw(); })); form.append(line);
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
      ['Stage tracks', 'Inspect statement order across background, character, words and sound rows. These are ordered beats, not elapsed time. Timing and provenance can extend this dock later.'],
      ['Shot reel', 'Compose against the image. Future drag/resize belongs on the stage; animation and idle controls extend appearances. The reel is statement order, not a timed Timeline.'],
      ['Later tools', 'Timeline opens for a selected beat. Supported Run From Here requires a separate state/provenance inspection step. Unknown state remains explicit. No future runtime or animation behavior is simulated.'],
    ]) dialog.append(el('h3', '', title), el('p', '', copy));
  }
  function header() {
    const bar = el('header', 'sr-topbar');
    const toggle = action(`${scene().name} ▾`, () => { treeOpen = !treeOpen; draw(); }); toggle.ariaLabel = 'Scenes'; toggle.ariaExpanded = String(treeOpen);
    const trail = locate(scene(), selected)?.trail.slice(1).join(' › ') ?? '';
    bar.append(toggle, el('span', 'sr-current-body', trail || 'Scene body'));
    const tools = el('div', 'sr-top-tools');
    const focus = action(focused ? 'Visual mode' : 'Writing focus', () => { focused = !focused; draw(); status(focused ? 'Writing focus; all beat tools remain available' : 'Visual mode'); }); focus.ariaPressed = String(focused); focus.dataset.focusToggle = '';
    undoButton = action('Undo', () => history(undo, redo)); redoButton = action('Redo', () => history(redo, undo)); undoButton.disabled = !undo.length; redoButton.disabled = !redo.length;
    const more = el('details', 'sr-more'); more.append(el('summary', '', 'More')); const menu = el('div', 'sr-top-menu');
    menu.append(action('Assist', assist), action('Source', () => source()), action('Design notes', notes), action('Rename scene', () => { const d = modal('Rename scene'); const name = el('input'); name.value = scene().name; name.ariaLabel = 'Scene name'; d.append(name, action('Rename', () => { if (name.value.trim()) { change(() => scene().name = name.value.trim(), 'Scene renamed'); d.close(); } })); })); more.append(menu);
    tools.append(focus, undoButton, redoButton, action('+ Add beat', () => {
      const t = locate(scene(), selected), reel = variant !== 'cue-sheet' ? reelContext() : undefined;
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
        const button = action(s.name, () => { treeOpen = false; go(s.id); }); button.className = 'sr-scene-link'; button.ariaCurrent = s.id === sceneId ? 'page' : null; aside.append(button);
      }
    }
    return aside;
  }
  // Only the explicitly inspected source path contributes to this illustration.
  // This is not a runtime reducer and never follows a condition or a Call.
  function illustrationPath(body = scene().beats): Beat[] | undefined {
    const before: Beat[] = [];
    for (const beat of body) {
      before.push(beat);
      if (beat.id === selected) return before;
      for (const branch of beat.branches) {
        const path = illustrationPath(branch.beats);
        if (path) return [...before, ...path];
      }
    }
    return undefined;
  }
  function illustrationLine() {
    if (manual) {
      const group = scene().beats.find(b => b.kind === 'condition');
      return group?.branches[manual === 'else' ? 1 : 0]?.beats.find(b => ['dialogue', 'narration'].includes(b.kind));
    }
    return illustrationPath()?.findLast(b => ['dialogue', 'narration'].includes(b.kind));
  }
  function updateIllustration() {
    const before = illustrationPath() ?? [];
    const background = before.findLast(b => b.kind === 'background');
    const shown = before.slice(before.findLastIndex(b => b.kind === 'background') + 1).findLast(b => ['showCharacter', 'hideCharacter'].includes(b.kind));
    const appearance = before.findLast(b => ['showCharacter', 'changeAppearance', 'placement'].includes(b.kind));
    const line = illustrationLine();
    for (const stage of host.querySelectorAll<HTMLElement>('.sr-stage')) {
      stage.classList.toggle('sr-dawn', background?.asset === 'Station at dawn');
      stage.classList.toggle('sr-no-background', !background);
      const placeholder = stage.querySelector<HTMLElement>('.sr-stage-empty'); if (placeholder) placeholder.hidden = !!background;
      const character = stage.querySelector<HTMLElement>('.sr-character')!;
      character.hidden = !shown || shown.kind === 'hideCharacter';
      character.style.left = appearance?.placement === 'Left' ? '25%' : appearance?.placement === 'Right' ? '75%' : '52%';
      const caption = stage.querySelector<HTMLElement>('.sr-saybox')!;
      caption.hidden = !line || hideSaybox;
      const text = caption.querySelector('p'); if (text) text.textContent = line?.text ?? '';
      const speaker = caption.querySelector('strong'); if (speaker) speaker.textContent = line?.kind === 'dialogue' ? line.speaker : '';
      const object = stage.querySelector('.sr-object-label'); if (object) object.textContent = shown?.speaker ?? 'Mara';
    }
    for (const status of host.querySelectorAll('.sr-stage-status')) status.textContent = manual ? 'Manual route · illustrative' : before.some(b => ['condition', 'call', 'customCode'].includes(b.kind)) ? 'Partial illustration · state not evaluated' : 'Illustrative scene';
  }
  function preview() {
    const wrap = el('section', 'sr-preview'); wrap.ariaLabel = 'Game window';
    const top = el('div', 'sr-preview-title');
    const title = el('strong', '', 'Game window');
    const route = el('select'); route.ariaLabel = 'Illustrative preview branch';
    for (const [v, text] of [['', 'Selected beat'], ['if', 'Manual If preview'], ['else', 'Manual Otherwise preview']]) route.append(new Option(text, v));
    route.value = manual;
    route.onchange = () => { manual = route.value; updateIllustration(); status('Manual illustration changed; editing target retained'); };
    const enlarge = action(stageExpanded ? 'Restore workspace' : 'Enlarge stage', () => { stageExpanded = !stageExpanded; draw(); });
    enlarge.ariaPressed = String(stageExpanded);
    top.append(title, el('span', 'sr-stage-resolution', '1920 × 1080'), enlarge); wrap.append(top);
    const stage = el('div', 'sr-stage'); stage.dataset.stage = '';
    const background = action('', () => { stageObject = 'background'; stageExpanded = false; draw(); }); background.className = 'sr-backdrop-control'; background.ariaLabel = 'Background staging actions';
    const bg = el('img', 'sr-backdrop'); bg.src = platform; bg.alt = 'Fictional rain-soaked tram platform'; background.append(bg); stage.append(background);
    const placeholder = el('div', 'sr-stage-empty'); placeholder.append(action('Choose a background', () => { const t = locate(scene(), selected); insert('background', t?.body ?? scene().beats, t?.trail ?? [scene().name], t?.index ?? defaultIndex()); })); stage.append(placeholder);
    const character = el('button', 'sr-character'); character.ariaLabel = 'Character staging actions';
    const image = el('img'); image.src = mara; image.alt = 'Mara, wearing a brown coat';
    character.append(image, el('span', 'sr-object-label', 'Mara'));
    character.dataset.stageCharacter = '';
    character.dataset.objectSelected = String(stageObject === 'character');
    character.onclick = () => { stageObject = 'character'; stageExpanded = false; draw(); };
    stage.append(character);
    const b = current();
    const editable = variant === 'shot-reel' && innerWidth >= 900 && b && ['dialogue', 'narration'].includes(b.kind);
    const caption = el('div', 'sr-saybox'); caption.dataset.saybox = '';
    if (editable) {
      if (b.kind === 'dialogue') caption.append(select(['Mara', 'Eli'], b.speaker, 'Speaker', value => b.speaker = value));
      caption.append(prose(b));
    } else {
      caption.tabIndex = 0; caption.role = 'button'; caption.ariaLabel = 'Edit displayed dialogue'; caption.append(el('strong'), el('p'));
      const edit = () => { const line = illustrationLine(); if (line) { selected = line.id; stageObject = ''; draw(); focusText(); } };
      caption.onclick = edit; caption.onkeydown = event => { if (event.key === 'Enter') edit(); };
    }
    stage.append(caption);
    if (b?.kind === 'choice') {
      const choices = el('div', 'sr-game-choices');
      b.options.forEach((option, i) => choices.append(action(option.text || 'New choice', () => { host.querySelector<HTMLInputElement>(`input[aria-label="Choice ${i + 1} text"]`)?.focus(); })));
      stage.append(choices);
    }
    const slot = el('div', 'sr-stage-slot'); slot.append(stage); wrap.append(slot);
    const bottom = el('div', 'sr-stage-footer');
    const path = locate(scene(), selected);
    const partial = illustrationPath()?.some(b => ['condition', 'call', 'customCode'].includes(b.kind));
    bottom.append(el('span', 'sr-stage-status', manual ? 'Manual route · illustrative' : partial ? 'Partial illustration · state not evaluated' : 'Illustrative scene'));
    const add = el('div', 'sr-stage-actions');
    add.append(action('Background', () => insert('background', path?.body ?? scene().beats, path?.trail ?? [scene().name], path?.index ?? defaultIndex())), action('+ Character', () => insert('showCharacter', path?.body ?? scene().beats, path?.trail ?? [scene().name], path ? path.index + 1 : defaultIndex())));
    if (variant === 'shot-reel') add.append(action(hideSaybox ? 'Show text box' : 'Hide text box', () => { hideSaybox = !hideSaybox; draw(); }));
    bottom.append(route, add); wrap.append(bottom); return wrap;
  }
  function row(b: Beat, body: Beat[], trail: string[], index: number) {
    const result = el('article', `sr-row sr-${b.kind}`); result.dataset.beat = b.id; result.dataset.selected = String(selected === b.id);
    const top = el('div', 'sr-row-line');
    const number = action(String(index + 1).padStart(2, '0'), () => { selected = b.id; draw(); }); number.className = 'sr-number'; number.ariaLabel = `Select ${label(b.kind)} beat ${index + 1}`;
    top.append(number, el('span', 'sr-kind', label(b.kind)));
    if (b.kind === 'dialogue' || b.kind === 'narration') {
      if (b.kind === 'dialogue') top.append(select(['Mara', 'Eli'], b.speaker, `Speaker for beat ${index + 1}`, value => b.speaker = value));
      else top.append(el('span', 'sr-narrator', 'Narrator'));
      top.append(prose(b));
    } else {
      const open = action(`${label(b.kind)} · ${brief(b)}`, () => { selected = b.id; if (b.kind === 'condition') { if (expanded.has(b.id)) expanded.delete(b.id); else expanded.add(b.id); } draw(); });
      open.className = 'sr-cue'; top.append(open);
    }
    top.append(rowMenu(b)); result.append(top);
    if (selected === b.id && !['dialogue', 'narration', 'condition'].includes(b.kind) && (focused || innerWidth < 900)) result.append(fields(b));
    if (b.kind === 'condition' && expanded.has(b.id)) {
      for (const branch of b.branches) result.append(branchBody(branch, [...trail, `${branch.name} ${branch.condition}`.trim()]));
      result.append(el('div', 'sr-rejoin', 'Continue after condition · falling-through paths only'));
    }
    if (!['choice', 'jump', 'return'].includes(b.kind)) result.append(gap(body, trail, index + 1));
    return result;
  }
  function branchBody(branch: Branch, trail: string[]) {
    const section = el('section', 'sr-inline-branch'); section.dataset.branch = branch.id;
    const title = el('div', 'sr-branch-title'); title.append(el('strong', '', branch.name));
    if (branch.name !== 'Otherwise') title.append(input(branch.condition, `${branch.name} condition`, value => branch.condition = value));
    section.append(title);
    branch.beats.forEach((b, i) => section.append(row(b, branch.beats, trail, i)));
    section.append(action('+ Add beat to ' + branch.name, () => picker(branch.beats, trail, defaultIndex(branch.beats)))); return section;
  }
  function empty(body: Beat[], trail: string[]) {
    const box = el('div', 'sr-empty'); box.append(el('h2', '', 'Your scene starts here.'), el('p', '', 'A place. A voice. Something worth saying.'));
    const actions = el('div'); actions.append(action('Write dialogue', () => insert('dialogue', body, trail, defaultIndex(body)), true), action('Write narration', () => insert('narration', body, trail, defaultIndex(body))), action('Add a background', () => insert('background', body, trail, defaultIndex(body)))); box.append(actions); return box;
  }
  function nextDialogue(b: Beat) {
    const t = locate(scene(), b.id)!; insert('dialogue', t.body, t.trail, t.index + 1, b.speaker);
  }
  function inspector(textInGame = false) {
    const panel = el('aside', 'sr-inspector'); panel.ariaLabel = 'Selected beat editor';
    const b = current();
    if (stageObject) {
      const owner = illustrationPath()?.findLast(item => stageObject === 'background' ? item.kind === 'background' : ['showCharacter', 'changeAppearance', 'placement'].includes(item.kind));
      const head = el('div', 'sr-inspector-heading'); head.append(el('strong', '', stageObject === 'background' ? 'Background' : owner?.speaker ?? 'Mara'), action('Done', () => { stageObject = ''; draw(); })); panel.append(head);
      if (owner) {
        const index = locate(scene(), owner.id)!.index + 1;
        panel.append(el('p', 'sr-owner', `${brief(owner)} · set by ${String(index).padStart(2, '0')} ${label(owner.kind)}`));
        const actions = el('div', 'sr-inspector-actions');
        actions.append(action(`Edit beat ${String(index).padStart(2, '0')}`, () => { selected = owner.id; stageObject = ''; draw(); focusText(); }), action('Add change here', () => {
          const t = locate(scene(), selected); const kind = stageObject === 'background' ? 'background' : 'changeAppearance'; stageObject = ''; insert(kind, t?.body ?? scene().beats, t?.trail ?? [scene().name], t?.index ?? defaultIndex());
        }, true)); panel.append(actions);
        if (selected === owner.id) panel.append(fields(owner));
      }
      return panel;
    }
    if (!b || scene().beats.length === 1 && b.kind === 'return') {
      if (variant !== 'cue-sheet') panel.append(empty(scene().beats, [scene().name]));
      else panel.append(el('p', 'sr-editor-hint', 'Choose a background, then write your first line in the cue sheet.'));
      return panel;
    }
    const heading = el('div', 'sr-inspector-heading'); heading.append(el('strong', '', `${String(locate(scene(), b.id)!.index + 1).padStart(2, '0')} · ${label(b.kind)}`));
    if (['dialogue', 'narration'].includes(b.kind)) heading.append(action('Next dialogue', () => nextDialogue(b), true));
    heading.append(rowMenu(b)); panel.append(heading);
    if (['dialogue', 'narration'].includes(b.kind)) {
      if (!textInGame) panel.append(fields(b));
      else panel.append(el('p', 'sr-editor-hint', variant === 'cue-sheet' ? 'Write in the cue sheet. The game window follows your line.' : 'Write directly in the dialogue box.'));
    } else panel.append(fields(b));
    return panel;
  }
  function cueSheet(parent: HTMLElement) {
    const layout = el('div', 'sr-cue-layout');
    if (!focused) { const stage = el('div', 'sr-cue-stage'); stage.append(preview()); if (innerWidth >= 900 || stageObject) stage.append(inspector(true)); layout.append(stage); }
    const sheet = el('section', 'sr-sheet'); sheet.ariaLabel = 'Cue sheet writing';
    const head = el('header', 'sr-sheet-heading'); head.append(el('strong', '', 'Cue sheet'), el('span', '', 'Shift + ⌘ / Ctrl + Enter · next line')); sheet.append(head);
    if (scene().beats.length === 1 && scene().beats[0]!.kind === 'return') sheet.append(empty(scene().beats, [scene().name]));
    scene().beats.forEach((b, i) => sheet.append(row(b, scene().beats, [scene().name], i)));
    layout.append(sheet); parent.append(layout);
  }
  function orderedReel() {
    const reel = el('section', 'sr-reel'); reel.ariaLabel = 'Ordered beat reel';
    let body = scene().beats, trail = [scene().name]; const context = reelContext();
    if (context) {
      body = context.branch.beats; trail = context.trail;
      reel.append(action('← Scene body', () => { reelBranch = ''; selected = scene().beats.find(beat => all([beat]).some(item => item.id === context.owner.id))!.id; draw(); }));
    }
    reel.append(el('div', 'sr-reel-target', trail.join(' / ')));
    const strip = el('div', 'sr-reel-strip');
    body.forEach((item, i) => {
      strip.append(gap(body, trail, i));
      const button = action('', () => { selected = item.id; stageObject = ''; draw(); }); button.className = 'sr-reel-beat'; button.dataset.selected = String(item.id === selected); button.dataset.reelBeat = item.id;
      button.append(el('span', '', `${String(i + 1).padStart(2, '0')} · ${label(item.kind)}`), el('p', '', brief(item))); strip.append(button);
    });
    strip.append(gap(body, trail, defaultIndex(body), 'Add beat')); reel.append(strip);
    const b = current();
    if (b?.kind === 'condition') {
      const branches = el('div', 'sr-reel-branches');
      for (const branch of b.branches) branches.append(action(`${branch.name} ${branch.condition}`.trim(), () => { reelBranch = branch.id; visibleBranches.set(b.id, branch.id); selected = branch.beats[0]?.id ?? b.id; draw(); }));
      reel.append(branches);
    }
    return reel;
  }
  function shotReel(parent: HTMLElement) {
    const layout = el('div', 'sr-reel-layout'); const top = el('div', 'sr-shot-workspace');
    if (!focused) top.append(preview());
    const textInGame = !focused && !hideSaybox && innerWidth >= 900;
    top.append(inspector(textInGame)); layout.append(top, orderedReel()); parent.append(layout);
  }
  // The tracks describe a manually inspected source path. They do not evaluate
  // variables, follow Calls, reconstruct runtime state, or assign durations.
  function routeColumns(body = scene().beats, trail = [scene().name], depth = 0): { beat: Beat; body: Beat[]; trail: string[]; index: number; depth: number }[] {
    return body.flatMap((beat, index) => {
      const column = { beat, body, trail, index, depth };
      const chosen = beat.branches.find(branch => branch.id === visibleBranches.get(beat.id));
      return [column, ...(chosen ? routeColumns(chosen.beats, [...trail, `${chosen.name} ${chosen.condition}`.trim()], depth + 1) : [])];
    });
  }
  function stageTracks(parent: HTMLElement) {
    const layout = el('div', 'sr-tracks-layout'); const top = el('div', 'sr-tracks-workspace');
    if (!focused) top.append(preview()); top.append(inspector()); layout.append(top);
    const dock = el('section', 'sr-tracks'); dock.ariaLabel = 'Stage tracks';
    const heading = el('header', 'sr-track-heading'); heading.append(el('strong', '', 'Stage tracks'), el('span', '', 'Beat order · no timing'), action(allTracks ? 'Show stage' : 'All tracks', () => { allTracks = !allTracks; draw(); })); dock.append(heading);
    const columns = routeColumns();
    const branchBar = el('div', 'sr-track-branches');
    for (const { beat, trail } of columns.filter(c => c.beat.kind === 'condition')) {
      const band = el('div', 'sr-track-band'); band.append(el('span', '', `${trail.length > 1 ? trail.slice(1).join(' › ') + ' › ' : ''}Alternatives`));
      for (const branch of beat.branches) {
        const button = action(`${branch.name} ${branch.condition}`.trim(), () => { visibleBranches.set(beat.id, branch.id); reelBranch = branch.id; selected = branch.beats[0]?.id ?? beat.id; draw(); });
        button.ariaPressed = String(visibleBranches.get(beat.id) === branch.id); band.append(button);
      }
      const branch = beat.branches.find(b => b.id === visibleBranches.get(beat.id));
      if (branch) band.append(action('+ Add beat to ' + branch.name, () => picker(branch.beats, [...trail, `${branch.name} ${branch.condition}`.trim()], defaultIndex(branch.beats))));
      branchBar.append(band);
    }
    dock.append(branchBar);
    const scroll = el('div', 'sr-tracks-scroll'); const grid = el('div', 'sr-track-grid'); grid.role = 'grid'; grid.ariaLabel = 'Beat playhead';
    const names = ['Beat', 'Background', 'Mara', 'Words', 'Sound', 'Flow / state'];
    grid.style.gridTemplateColumns = focused ? '100px 110px 110px minmax(230px,1fr) 110px 140px' : `86px repeat(${columns.length}, minmax(126px,1fr))`;
    function position(node: HTMLElement, column: number, track: number) { node.style.gridColumn = String(focused ? track + 1 : column + 2); node.style.gridRow = String(focused ? column + 2 : track + 1); }
    names.forEach((name, track) => { const label = el('div', `sr-track-label sr-track-${track}`, name); label.style.gridColumn = focused ? String(track + 1) : '1'; label.style.gridRow = focused ? '1' : String(track + 1); grid.append(label); });
    columns.forEach((column, i) => {
      const { beat, body, trail, index } = column;
      const before = columns.slice(0, i + 1).map(c => c.beat);
      const background = before.findLast(b => b.kind === 'background');
      const character = before.findLast(b => ['showCharacter', 'hideCharacter', 'changeAppearance', 'placement'].includes(b.kind));
      const music = before.findLast(b => ['playMusic', 'stopMusic'].includes(b.kind));
      const uncertain = before.some(b => ['customCode', 'call'].includes(b.kind) || b.kind === 'condition' && !visibleBranches.has(b.id));
      const texts = [String(i + 1).padStart(2, '0') + (beat.id === selected ? ' ▾' : ''), beat.kind === 'background' ? beat.asset : '', ['showCharacter', 'changeAppearance', 'placement'].includes(beat.kind) ? `${beat.speaker} · ${beat.asset}` : '', ['dialogue', 'narration'].includes(beat.kind) ? brief(beat) : '', ['playMusic', 'playSfx', 'stopMusic'].includes(beat.kind) ? brief(beat) : '', !['dialogue', 'narration', 'background', 'showCharacter', 'changeAppearance', 'placement', 'playMusic', 'playSfx', 'stopMusic'].includes(beat.kind) ? brief(beat) : ''];
      texts.forEach((text, track) => {
        const cell = action(text, () => { selected = beat.id; stageObject = ''; const owner = all(scene().beats).flatMap(b => b.branches).find(b => b.beats === body); reelBranch = owner?.id ?? ''; draw(); });
        cell.className = `sr-track-cell sr-track-${track}`; cell.role = 'gridcell'; cell.ariaLabel = `${names[track]}, beat ${i + 1}: ${text || label(beat.kind)}`; cell.dataset.selected = String(beat.id === selected); cell.dataset.trackBeat = beat.id;
        cell.tabIndex = beat.id === selected && track === 0 ? 0 : -1;
        cell.classList.toggle('sr-track-present', track === 1 && !!background || track === 2 && !!character && character.kind !== 'hideCharacter' || track === 4 && !!music && music.kind !== 'stopMusic');
        cell.classList.toggle('sr-track-unknown', uncertain); cell.classList.toggle('sr-track-protected', beat.kind === 'customCode');
        position(cell, i, track);
        cell.onkeydown = event => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); const next = columns[i + (['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1)]; if (next) { selected = next.beat.id; draw(); host.querySelector<HTMLElement>(`.sr-track-0[data-track-beat="${selected}"]`)?.focus(); } } };
        grid.append(cell);
        if (track === 0) { const insert = gap(body, trail, index + 1); insert.classList.add('sr-track-insert'); position(insert, i, track); grid.append(insert); }
      });
    });
    scroll.append(grid); dock.append(scroll); layout.append(dock); parent.append(layout);
  }
  function compareBar() {
    if (!compare) { const cleanup = prototypeSwitcher(frame.shell, variants, variant, () => changes > 0); frame.shell.querySelector('.app-footer')!.prepend(frame.shell.querySelector('.sc-prototype-switcher')!); return cleanup; }
    const bar = el('nav', 'sr-compare'); bar.ariaLabel = 'Prototype layout comparison';
    const next = (direction: number) => {
      const target = variants[(variants.findIndex(v => v.id === variant) + direction + variants.length) % variants.length]!.id;
      if (!changes) { compare(target); return; }
      const dialog = modal('Switch prototype layout?');
      dialog.append(el('p', '', 'The next layout opens a fresh sample. Your edits in this preview will reset.'), action('Keep editing', () => dialog.close()), action('Switch and reset sample', () => { dialog.close(); compare(target); }));
    };
    bar.append(action('←', () => next(-1)), el('span', '', variants.find(v => v.id === variant)!.title), action('→', () => next(1)));
    bar.querySelectorAll('button')[0]!.ariaLabel = 'Previous prototype layout'; bar.querySelectorAll('button')[1]!.ariaLabel = 'Next prototype layout'; frame.shell.querySelector('.app-footer')!.prepend(bar);
    const key = (event: KeyboardEvent) => { if (!event.defaultPrevented && !event.altKey && !event.ctrlKey && !event.metaKey && !(event.target as Element).closest('input,textarea,select,[contenteditable],dialog') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); next(event.key === 'ArrowLeft' ? -1 : 1); } };
    document.addEventListener('keydown', key); return () => { document.removeEventListener('keydown', key); };
  }
  function draw() {
    const scroll = ['.sr-workarea', '.sr-sheet', '.sr-reel', '.sr-reel-strip', '.sr-tracks-scroll', '.sr-inspector'].map(selector => {
      const node = frame.content.querySelector<HTMLElement>(selector);
      return { selector, top: node?.scrollTop ?? 0, left: node?.scrollLeft ?? 0 };
    });
    frame.content.replaceChildren(); frame.content.dataset.variant = variant; frame.content.dataset.focused = String(focused); frame.content.dataset.treeOpen = String(treeOpen); frame.content.dataset.stageExpanded = String(stageExpanded); frame.content.dataset.allTracks = String(allTracks);
    const layout = el('div', 'sr-workspace'); layout.append(tree()); const main = el('main', 'sr-writing'); main.append(header()); const content = el('div', 'sr-workarea');
    if (variant === 'cue-sheet') cueSheet(content); else if (variant === 'shot-reel') shotReel(content); else stageTracks(content);
    main.append(content); const state = el('details', 'sr-state'); state.append(el('summary', '', 'Prototype state · memory only'));
    state.ontoggle = () => { if (state.open) { state.querySelector('pre')?.remove(); state.append(el('pre', '', JSON.stringify({ variant, focused, scene: sceneId, selected, manualPreviewBranch: manual, changes, scenes }, null, 2))); } };
    frame.shell.querySelector('.app-footer .sr-state')?.remove(); frame.shell.querySelector('.app-footer')!.append(state); layout.append(main); frame.content.append(layout);
    for (const area of host.querySelectorAll<HTMLTextAreaElement>('.sr-prose')) fit(area);
    for (const position of scroll) { const node = frame.content.querySelector<HTMLElement>(position.selector); if (node) { node.scrollTop = position.top; node.scrollLeft = position.left; } }
    revealReelSelection();
    updateIllustration();
    const cell = host.querySelector<HTMLElement>(`.sr-track-0[data-track-beat="${selected}"]`);
    const strip = host.querySelector<HTMLElement>('.sr-tracks-scroll');
    if (cell && strip) { const r = cell.getBoundingClientRect(), s = strip.getBoundingClientRect(); if (r.right > s.right) strip.scrollLeft += r.right - s.right; if (r.left < s.left) strip.scrollLeft -= s.left - r.left; }
  }
  if (context.state === 'branching') expanded.add(scene().beats.find(b => b.kind === 'condition')!.id);
  draw(); status('Fictional sample ready'); const cleanup = compareBar();
  const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && treeOpen && !host.querySelector('dialog[open]')) { treeOpen = false; draw(); } };
  document.addEventListener('keydown', escape);
  let resizeFrame = 0;
  const resize = () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => { const active = document.activeElement; const text = active instanceof HTMLTextAreaElement ? active : undefined; const start = text?.selectionStart, end = text?.selectionEnd; draw(); if (text) { const next = host.querySelector<HTMLTextAreaElement>(`textarea[data-beat-text="${selected}"]`); next?.focus(); if (start != null && end != null) next?.setSelectionRange(start, end); } }); };
  window.addEventListener('resize', resize);
  if (compare) for (const button of frame.shell.querySelectorAll<HTMLButtonElement>('.lp-navigation .tree-item,.brand,.lp-studio-link,.lp-runtime-link')) button.onclick = () => status('Other workspaces are outside this standalone Story study');
  return () => { cleanup(); document.removeEventListener('keydown', escape); window.removeEventListener('resize', resize); cancelAnimationFrame(resizeFrame); host.replaceChildren(); };
}
