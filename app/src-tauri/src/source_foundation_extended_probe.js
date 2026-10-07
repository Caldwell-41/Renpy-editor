// Extends the original eleven checks. Mutations use ordinary source/scene IPC;
// the runner owns the single external write in this disposable profile.
window.__loomlightFoundationExtended = async ({ details, check, wait, click, call, read }) => {
  let project, model, scene;
  const refresh = async () => {
    project = await read('project.current');
    model = await read('scene.list', { sessionId: project.sessionId }); scene = model.scenes[0];
  };
  const source = () => read('source.open', { sessionId: project.sessionId, path: scene.sourcePath });
  const owners = m => JSON.stringify(m.scenes[0].beats.filter(b => b.owner).map(b => [b.id, b.owner]));
  const apply = command => call('scene.apply', { sessionId: project.sessionId, expectedProjectRevision: model.projectRevision, expectedSourceMapRevision: model.sourceMapRevision, command: { sceneId: scene.id, expectedSourceRevision: scene.sourceRevision, ...command } });
  const reopen = async () => {
    await click('Close Project'); await wait(() => window.__loomlightProbeFindButton('Source foundation fixture'));
    await click('Source foundation fixture'); await wait(() => document.querySelectorAll('.nested-dialogue').length === 2); await refresh();
  };
  const save = async text => {
    const opened = await source();
    const draft = await call('source.updateDraft', { sessionId: project.sessionId, path: scene.sourcePath, expectedBaseRevision: opened.baseRevision, text, selectionStart: 0, selectionEnd: 0 });
    await call('source.save', { sessionId: project.sessionId, path: scene.sourcePath, expectedBaseRevision: draft.baseRevision, expectedDraftVersion: draft.draftVersion });
    await reopen();
  };
  const card = id => [...document.querySelectorAll('.beat-card')].find(c => c.dataset.beatId === id);
  await refresh();
  details.stage = 'corrected-boundaries';
  const accepted = await source();
  const boundaryText = `label ${scene.technicalLabel}:\n    if flag:\n        bec "True café 雪"\n        # before Otherwise\n    else:\n        # before child\n        bec "False café 雪"\n    bec "Root one"\n    bec "Root two"\n    return\n`;
  await save(boundaryText);
  const baseline = model, baselineSource = await source(), baselineOwners = owners(model);
  const beats = scene.beats, root = beats.find(b => b.payload.text === 'Root one');
  const child = beats.find(b => b.payload.text === 'False café 雪');
  check(card(root.id).querySelector('.beat-controls button').disabled, 'Root Move Up across child disabled');
  const grip = card(root.id).querySelector('.beat-grip'), target = card(child.id);
  const originalHit = document.elementFromPoint.bind(document);
  document.elementFromPoint = () => target;
  try {
    const pointer = (type, x) => new PointerEvent(type, { button: 0, pointerId: 1, clientX: x, clientY: 20, bubbles: true });
    grip.dispatchEvent(pointer('pointerdown', 10)); window.dispatchEvent(pointer('pointermove', 30));
    check(!target.classList.contains('drop-before'), 'Root drag across child has no accepted target');
    window.dispatchEvent(pointer('pointerup', 30));
  } finally { document.elementFromPoint = originalHit; }
  await refresh();
  check(JSON.stringify(model) === JSON.stringify(baseline) && (await source()).text === baselineSource.text, 'Refused native drag leaves source, map revision and IDs unchanged');
  const commands = [ { type: 'moveBeat', beatId: root.id, direction: 'up' }, { type: 'reorderBeat', beatId: root.id, toIndex: beats.indexOf(child) } ];
  const anchors = beats.filter(b => b.conditionalBranch?.otherwise || b.payload.source?.trimStart().startsWith('#'));
  check(anchors.length === 3, 'Otherwise and both body trivia anchors present');
  for (const anchor of anchors) {
    card(anchor.id).querySelector('.beat-select').click();
    const additions = [...document.querySelectorAll('.provenance-row button:last-child')];
    check(additions.length > 0 && additions.every(b => b.disabled), `Insertion UI refused at ${anchor.payload.source.trim()}`);
    card(anchor.id).querySelector('.beat-select').click();
    commands.push({ type: 'insertBeat', beforeBeatId: anchor.id, beat: { type: 'narration', text: 'Unsafe root' } });
  }
  for (const command of commands) {
    let code; try { await apply(command); } catch (error) { code = error.code; }
    check(code === 'SCENE_INVARIANT', `Real core refuses ${command.type}${command.beforeBeatId ? ' at protected anchor' : ' across child'}`);
  }
  await refresh();
  check(JSON.stringify(model) === JSON.stringify(baseline) && (await source()).text === baselineSource.text, 'All structural refusals preserve exact source and workspace');
  model = await apply({ type: 'moveBeat', beatId: root.id, direction: 'down' }); scene = model.scenes[0];
  check((await source()).text === baselineSource.text.replace('    bec "Root one"\n    bec "Root two"', '    bec "Root two"\n    bec "Root one"'), 'Safe root move outside group changes only adjacent roots');
  model = await apply({ type: 'insertBeat', beforeBeatId: beats[0].id, beat: { type: 'narration', text: 'Before group' } }); scene = model.scenes[0];
  model = await apply({ type: 'insertBeat', beforeBeatId: root.id, beat: { type: 'narration', text: 'After group' } }); scene = model.scenes[0];
  check(owners(model) === baselineOwners && beats.every(b => scene.beats.some(n => n.id === b.id)) && (await source()).text.includes('    "Before group"\n    if flag:') && (await source()).text.includes('    "After group"\n    bec "Root one"'), 'Safe before/after insertion preserves child IDs and owners');
  details.stage = 'unterminated-child-append';
  const eofText = accepted.text.slice(0, accepted.text.indexOf('    python:')).trimEnd();
  await save(eofText); const eofOwners = owners(model);
  check(!(await source()).text.endsWith('\n'), 'EOF fixture ends at child without final newline');
  await click('Add Beat'); await wait(() => document.querySelector('.new-beat'));
  const adding = document.querySelector('.new-beat'), type = adding.querySelector('select');
  type.value = 'narration'; type.dispatchEvent(new Event('change', { bubbles: true }));
  const narration = adding.querySelector('textarea'); narration.value = 'EOF continuation'; narration.dispatchEvent(new Event('input', { bubbles: true }));
  [...adding.querySelectorAll('button')].find(b => b.textContent === 'Add Beat').click();
  await wait(() => !adding.isConnected); await refresh();
  const appended = await source();
  check(appended.text === eofText + '\r\n    "EOF continuation"\r\n' && owners(model) === eofOwners, 'EOF append adds separator and retains child IDs and owners');
  await click('Undo'); await wait(async () => (await source()).text === eofText); await refresh();
  check(owners(model) === eofOwners, 'EOF Undo restores unterminated bytes and owners');
  await click('Redo'); await wait(async () => (await source()).text === appended.text); await reopen();
  check(owners(model) === eofOwners && (await source()).text === appended.text, 'EOF Redo and shell reopen retain bytes, IDs and owners');
  details.stage = 'external-refusal';
  const editing = scene.beats.find(b => b.owner);
  card(editing.id).querySelector('.beat-select').click(); await wait(() => card(editing.id).querySelector('textarea'));
  const editor = card(editing.id).querySelector('textarea'); editor.value = 'Retained external Story draft'; editor.dispatchEvent(new Event('input', { bubbles: true }));
  const beforeExternal = await source();
  await call('probe.foundationExternalReady', { path: scene.sourcePath });
  await wait(async () => (await call('probe.foundationExternalStatus')).written === true);
  await click('Commit Beat'); await wait(() => !editor.disabled && document.querySelector('#app-status')?.textContent !== 'Saving…');
  check(editor.isConnected && editor.value === 'Retained external Story draft' && editor.closest('.scene-draft').dataset.unsubmitted === 'true', 'External refusal retains exact native Story draft');
  const external = await source();
  check(external.text === beforeExternal.text + '# ordinary external writer\n' && !external.text.includes('Retained external Story draft'), 'External refusal retains exact external source');
  await click('Cancel'); await reopen();
  check((await source()).text === external.text && owners(model) === eofOwners, 'Normal shell close/reopen after external refusal preserves source and owners');
  details.extendedChecksComplete = true;
};
