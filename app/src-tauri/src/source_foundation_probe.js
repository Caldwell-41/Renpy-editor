// Explicit disposable native fixture; real Story controller/IPC, synthetic DOM input.
(async () => {
  const details = { stage: 'open', checks: [], layer: 'native WebView; real IPC; synthetic editor input' };
  const check = (value, message) => { if (!value) throw Error(message); details.checks.push(message); };
  const wait = async condition => { const start = performance.now(); while (!await condition()) { if (performance.now() - start > 20000) throw Error(`Timeout: ${details.stage}`); await new Promise(r => setTimeout(r, 30)); } };
  const find = window.__loomlightProbeFindButton;
  const click = async name => { await wait(() => find(name) && !find(name).disabled); find(name).click(); };
  const call = async (operation, payload = {}) => {
    const result = await window.__TAURI_INTERNALS__.invoke('core_request', { request: { protocolVersion: 1, requestId: crypto.randomUUID(), operation, payload } });
    if (!result.ok) throw Object.assign(Error(`${operation}: ${result.error.code}`), { code: result.error.code }); return result.value;
  };
  const read = (operation, payload) => window.__loomlightProbeRetryBusy(() => call(operation, payload));
  const ids = model => model.scenes[0].beats.map(b => b.id).join(',');
  let project, model, original;
  try {
    await click('Source foundation fixture');
    await wait(() => document.querySelectorAll('.nested-dialogue').length === 2);
    project = await read('project.current');
    model = await read('scene.list', { sessionId: project.sessionId });
    const scene = model.scenes[0], children = scene.beats.filter(b => b.owner);
    original = await read('source.open', { sessionId: project.sessionId, path: scene.sourcePath });
    check(children.length === 2 && children[0].owner.groupId === children[1].owner.groupId && children[0].owner.branchId !== children[1].owner.branchId, 'Two dialogue children have one group and distinct branches');
    check(original.hasBom && original.text.includes('\r\n') && original.text.includes('café 雪'), 'BOM, mixed newlines and Unicode fixture observed');
    const card = () => [...document.querySelectorAll('.beat-card')].find(c => c.dataset.beatId === children[0].id);
    check(card().querySelector('.beat-grip').disabled && [...card().querySelectorAll('.beat-controls button')].every(b => b.disabled), 'Child structural operations disabled');
    card().querySelector('.beat-select').click();
    await wait(() => card().querySelector('textarea'));
    details.stage = 'commit-child';
    const form = card().querySelector('.expanded-beat');
    const editor = card().querySelector('textarea');
    editor.value = 'Edited café 雪'; editor.dispatchEvent(new Event('input', { bubbles: true }));
    await click('Commit Beat'); await wait(() => !form.isConnected);
    const accepted = await read('source.open', { sessionId: project.sessionId, path: scene.sourcePath });
    const changed = await read('scene.list', { sessionId: project.sessionId });
    check(accepted.text === original.text.replace('True café 雪', 'Edited café 雪') && accepted.hasBom, 'Real Story commit changes only dialogue token and preserves BOM/source neighbors');
    check(ids(model) === ids(changed), 'All existing Beat IDs preserved');
    details.sourceRevision = accepted.baseRevision;
    details.stage = 'undo-redo';
    await click('Undo'); await wait(async () => (await read('source.open', { sessionId: project.sessionId, path: scene.sourcePath })).text === original.text);
    await click('Redo'); await wait(async () => (await read('source.open', { sessionId: project.sessionId, path: scene.sourcePath })).text === accepted.text);
    check(true, 'Native Story Undo/Redo restores exact source');
    const current = await read('scene.list', { sessionId: project.sessionId });
    let rejected = false;
    try { await call('scene.apply', { sessionId: project.sessionId, expectedProjectRevision: current.projectRevision, expectedSourceMapRevision: current.sourceMapRevision, command: { type: 'updateChildDialogue', sceneId: scene.id, expectedSourceRevision: current.scenes[0].sourceRevision, beatId: children[0].id, expectedOwner: children[1].owner, characterId: children[0].payload.characterId, text: 'wrong owner' } }); }
    catch (error) { rejected = error.code === 'SCENE_INVARIANT'; details.ownerRejection = error.code; }
    check(rejected, 'Wrong child owner rejected by real core dispatch');
    details.stage = 'retained-draft';
    card().querySelector('.beat-select').click(); await wait(() => card().querySelector('textarea'));
    const retainedEditor = card().querySelector('textarea'); retainedEditor.value = 'Retained Story draft'; retainedEditor.dispatchEvent(new Event('input', { bubbles: true }));
    await call('source.updateDraft', { sessionId: project.sessionId, path: scene.sourcePath, expectedBaseRevision: accepted.baseRevision, text: accepted.text + '# dirty source draft\n', selectionStart: 0, selectionEnd: 0 });
    await click('Commit Beat'); await wait(() => !retainedEditor.disabled && document.querySelector('#app-status')?.textContent !== 'Saving…');
    check(retainedEditor.isConnected && retainedEditor.value === 'Retained Story draft' && retainedEditor.closest('.scene-draft').dataset.unsubmitted === 'true', 'Refused child edit retains exact Story draft');
    check((await read('source.open', { sessionId: project.sessionId, path: scene.sourcePath })).dirty, 'Concurrent Source draft retained');
    await call('source.discard', { sessionId: project.sessionId, path: scene.sourcePath }); await click('Cancel');
    details.stage = 'close';
    await click('Close Project'); details.stage = 'welcome-after-close'; await wait(() => find('Source foundation fixture'));
    details.stage = 'reopen'; await click('Source foundation fixture'); details.stage = 'reopened-outline'; await wait(() => document.querySelectorAll('.nested-dialogue').length === 2);
    const reopenedProject = await read('project.current'), reopened = await read('scene.list', { sessionId: reopenedProject.sessionId });
    check(ids(model) === ids(reopened), 'Native close/reopen preserves child and structural IDs');
    check((await read('source.open', { sessionId: reopenedProject.sessionId, path: scene.sourcePath })).text === accepted.text, 'Native close/reopen preserves accepted source');
    details.stage = 'complete'; details.passed = true;
  } catch (error) {
    details.passed = false; details.error = String(error);
    details.failureState = { status: document.querySelector('#app-status')?.textContent, text: document.querySelector('.scene-workspace')?.textContent?.slice(0, 1500), buttons: [...document.querySelectorAll('button')].map(b => ({ text: b.textContent, disabled: b.disabled })).slice(0, 60) };
  }
  await call('probe.runtimeUiReport', details);
})();
