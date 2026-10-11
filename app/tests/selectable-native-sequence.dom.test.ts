import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { Window } from 'happy-dom';
import type { CoreOperation, CoreResponse } from '../src/protocol.js';
import type { SceneWorkspace } from '../src/scene-ui.js';

const helper = await readFile(new URL('../../src-tauri/src/native_editor_probe.js', import.meta.url), 'utf8');
const probe = await readFile(new URL('../../src-tauri/src/selectable_edit_probe.js', import.meta.url), 'utf8');
const digest = (text: string) => createHash('sha256').update(text).digest('hex');
const delay = (ms = 15) => new Promise(resolve => setTimeout(resolve, ms));

// This is a renderer/probe integration seam, with a controlled IPC backend.
// Production main, Scene, Assist and injected probe code run unchanged. No core,
// filesystem, credential, HTTP, package or OS-input proof is claimed here.
test('complete selectable native probe drives production shell/controller through delayed history, update, refusals and reopen', async () => {
  const browser = new Window({ url: 'http://tauri.localhost' });
  browser.document.body.innerHTML = '<div id="app"></div>';
  Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement,
    HTMLInputElement: browser.HTMLInputElement, HTMLSelectElement: browser.HTMLSelectElement,
    HTMLTextAreaElement: browser.HTMLTextAreaElement, Event: browser.Event, KeyboardEvent: browser.KeyboardEvent });
  const project = { sessionId: 'session', projectId: 'project', title: 'Source foundation fixture', folderName: 'synthetic', chapterId: 'chapter', chapterName: 'Chapter', sceneId: 'scene', sceneName: 'Scene', sdkVersion: '8.5.3', resolution: { width: 1280, height: 720 } };
  const profiles = { token: 'profile-token', profiles: [{ profileId: 'profile', credentialStatus: 'configured', disabled: false,
    settings: { label: 'Synthetic', endpoint: 'http://127.0.0.1:9999/v1', model: 'synthetic-model', contextBudget: 32768, contextCeiling: 32768, maximumResponse: 1024 } }] };
  const initial: SceneWorkspace = {
    projectRevision: digest('project'), sourceMapRevision: digest('map'), entrySceneId: 'scene',
    lastOpen: { chapterId: 'chapter', sceneId: 'scene' }, canUndo: false, canRedo: false,
    chapters: [{ id: 'chapter', displayName: 'Chapter', directory: 'game/chapters' }],
    scenes: [{ id: 'scene', chapterId: 'chapter', displayName: 'Scene', technicalLabel: 'scene', sourcePath: 'game/scene.rpy', sourceRevision: digest('source'), sourceConflict: false, partial: false,
      beats: [{ id: 'narration', byteStart: 0, byteEnd: 20, protected: false, payload: { type: 'narration', text: 'Public narration' } }, { id: 'return', byteStart: 20, byteEnd: 30, protected: false, payload: { type: 'return' } }] }],
    authoring: { characters: [{ id: 'alice', technicalName: 'alice', displayName: 'Alice' }], appearances: [], assets: [], variables: [] },
  };
  type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };
  type State = { workspace: Mutable<SceneWorkspace>; files: Record<string, string> };
  let state: State = { workspace: structuredClone(initial) as Mutable<SceneWorkspace>, files: { 'game/scene.rpy': 'label scene:\n    "Public narration"\n    return\n', '.renpy-editor/authoring.json': '{"characters":["Alice"]}' } };
  let undo: State | undefined, redo: State | undefined, prepared: Record<string, any> | undefined, review: Record<string, any> | undefined;
  let task = '', sendCount = 0, saveCount = 0, busy = false, external = false, restoredSource = '', phase = 1, delayedStatus: ((value: unknown) => void) | undefined, delayedRender = false, delayedSceneRead = false;
  let report: Record<string, any> | undefined;
  const sentDigests: string[] = [], operations: string[] = [], histories: string[] = [], stages: string[] = [];
  const model = () => ({ ...structuredClone(state.workspace), canUndo: !!undo, canRedo: !!redo });
  const snapshot = () => ({ files: Object.fromEntries(Object.entries(state.files).sort(([a], [b]) => a.localeCompare(b)).map(([path, text]) => [path, digest(text)])) });
  const button = (name: string) => [...document.querySelectorAll<HTMLButtonElement>('button')].find(b => b.textContent === name)!;
  const candidate = () => {
    const next = structuredClone(state), create = (prepared!.permission as { type: string }).type === 'create';
    next.files['game/scene.rpy'] += create ? '# selected create\n' : '# selected update\n';
    next.files['.renpy-editor/authoring.json'] = create ? '{"characters":["Alice","Selectable New"]}' : '{"characters":["Selectable Updated","Selectable New"]}';
    const ws = next.workspace, scene = ws.scenes[0]!;
    if (create) {
      ws.authoring.characters = [...ws.authoring.characters, { id: 'new-character', technicalName: 'selectable_new', displayName: 'Selectable New' }];
      scene.beats = [...scene.beats.slice(0, -1), { id: 'inserted', byteStart: 20, byteEnd: 40, protected: false, payload: { type: 'narration', text: 'Public insertion' } }, scene.beats.at(-1)!];
    } else ws.authoring.characters = ws.authoring.characters.map(c => c.id === 'alice' ? { ...c, displayName: 'Selectable Updated' } : c);
    return next;
  };
  const selectedReview = (selectedIds: string[]) => {
    const valid = !(selectedIds.includes('group') && !selectedIds.includes('character'));
    return { ...review, selectedIds, valid, previewDigest: digest(JSON.stringify(selectedIds)), missingDependencies: valid ? [] : [{ operationId: 'group', requires: 'character' }] };
  };
  const dispatch = async (operation: string, payload: Record<string, any> = {}, lane = 'probe'): Promise<unknown> => {
    operations.push(operation);
    if (operation === 'project.listRecent') return [{ id: 'recent', projectId: project.projectId, title: project.title, displayPath: 'Synthetic fixture', lastOpenedUnixMs: 0, status: 'available' }];
    if (operation === 'project.openRecent' || operation === 'project.current') return project;
    if (operation === 'project.status') {
      // Acceptance sets its outcome before the new Story surface finishes loading.
      // A fast independent probe read must not imply that its Beat DOM exists yet.
      if (lane === 'renderer' && saveCount === 2 && !delayedRender) { delayedRender = true; await delay(250); }
      return 'saved';
    }
    if (operation === 'source.list') return { files: [], dirtyCount: 0, draftBytes: 0 };
    if (operation === 'project.close') { await delay(); return null; }
    if (operation === 'scene.list') {
      if (lane === 'renderer' && saveCount === 2 && !delayedSceneRead) { delayedSceneRead = true; await delay(250); }
      else await delay();
      return model();
    }
    if (operation === 'scene.apply') {
      busy = true;
      try {
        await delay();
        if (payload.command.type === 'insertBeat') {
          const scene = state.workspace.scenes[0]!;
          scene.beats = [...scene.beats.slice(0, -1), { id: 'second', byteStart: 20, byteEnd: 30, protected: false, payload: payload.command.beat }, scene.beats.at(-1)!];
          state.files['game/scene.rpy'] += '# second saved narration\n';
        } else if (payload.command.type === 'undo') { histories.push('undo'); redo = structuredClone(state); state = undo!; undo = undefined; }
        else if (payload.command.type === 'redo') { histories.push('redo'); undo = structuredClone(state); state = redo!; redo = undefined; }
        else throw Error('Unexpected Scene command');
        return model();
      } finally { busy = false; }
    }
    if (operation === 'context.options') {
      await delay();
      const scene = state.workspace.scenes[0]!;
      return { prompt: { revision: 'prompt' }, editPrompt: { revision: 'edit-prompt' }, structureRevision: 'structure',
        targets: scene.beats.filter(b => b.payload.type === 'narration').map(b => ({ sceneId: scene.id, beatId: b.id, sourceRevision: scene.sourceRevision, label: 'Saved narration', batchEligible: true })),
        anchors: [{ sceneId: scene.id, beatId: 'return', sourceRevision: scene.sourceRevision, label: 'Return' }], characters: state.workspace.authoring.characters,
        references: ['card', 'lore'].map(kind => ({ kind, recordId: kind, revisionId: 'revision', title: kind, number: 1, eligible: true })) };
    }
    if (operation === 'ai.profiles') return profiles;
    if (operation === 'rewrite.prepare') {
      await delay();
      const context = payload.context, batch = context.batch; task = context.task;
      assert.equal(context.action, 'editScene'); assert.equal(batch.insertionAnchor, 'return');
      if (batch.character.type === 'update') { assert.equal(batch.character.characterId, 'alice'); assert.deepEqual(batch.speakerIds, ['alice']); }
      const body = JSON.stringify({ messages: [{ role: 'system', content: 'Synthetic' }, { role: 'user', content: JSON.stringify({ task, story: { batch: { targets: batch.replacementIds, permissions: batch } }, references: context.references }) }], response_format: { json_schema: { strict: true } } });
      prepared = { token: `token-${sendCount}`, payloadDigest: digest(body), serializedPayload: body, permission: batch.character,
        destination: { provider: 'Synthetic', endpoint: profiles.profiles[0]!.settings.endpoint, model: 'synthetic-model', connectionLocation: 'Loopback', inferenceLocality: 'Synthetic', retention: 'Public fixture' },
        size: { estimatedInputTokens: 100, maximumResponse: 1024, margin: 128, total: 1252, contextBudget: 32768, contextCeiling: 32768 },
        context: { included: [], excluded: [], dependencies: [], unrelatedDraftsExcluded: [], exclusionPolicy: [] }, protected: [], responseMode: 'Strict' };
      return prepared;
    }
    if (operation === 'rewrite.send') {
      assert.equal(payload.token, prepared!.token); assert.equal(payload.payloadDigest, prepared!.payloadDigest);
      sentDigests.push(prepared!.payloadDigest); sendCount++;
      return { requestId: `request-${sendCount}`, done: false, state: 'sending', proposal: null, message: null };
    }
    if (operation === 'ai.requestStatus') {
      if (task === 'FIXTURE_DELAY') return new Promise(resolve => { delayedStatus = resolve; });
      await delay();
      if (task === 'FIXTURE_MALFORMED' || task === 'FIXTURE_UNSAFE') return { requestId: `request-${sendCount}`, done: true, state: 'failed', proposal: null, message: 'Fixture refusal' };
      const next = candidate();
      review = { proposalId: `proposal-${sendCount}`, target: { sceneId: 'scene', beatId: 'narration' }, uncertainty: 'Synthetic',
        operations: [{ id: 'text0', type: 'replace', beatId: 'narration', beforeSegments: [], segments: [], protected: [], dependencies: [] }, { id: 'character', type: 'character', displayName: 'Selectable', permission: prepared!.permission, assignedCharacterId: 'new-character', dependencies: [] }, { id: 'group', type: 'insert', beats: [], dependencies: ['character'] }],
        patches: Object.entries(next.files).map(([path, after]) => ({ path, before: state.files[path], after })) };
      review = selectedReview(['text0', 'character', 'group']);
      return { requestId: `request-${sendCount}`, done: true, state: 'completed', proposal: review, message: null };
    }
    if (operation === 'rewrite.select') { await delay(); return selectedReview(payload.selectedIds); }
    if (operation === 'rewrite.accept') {
      await delay(); if (external) throw Object.assign(Error('Synthetic stale source'), { code: 'STALE_SOURCE' });
      assert.equal(payload.proposalId, review!.proposalId); assert.equal(payload.previewDigest, review!.previewDigest);
      undo = structuredClone(state); state = candidate(); redo = undefined; saveCount++; return { saved: true };
    }
    if (operation === 'rewrite.discard') { await delay(); return { discarded: true }; }
    if (operation === 'ai.cancelRequest') {
      const cancelled = { requestId: `request-${sendCount}`, done: true, state: 'cancelled', proposal: null, message: 'Cancelled' };
      setTimeout(() => delayedStatus?.({ ...cancelled, state: 'completed', proposal: review }), 20);
      return cancelled;
    }
    if (operation === 'preferences.write') return payload;
    if (operation === 'probe.runtimeUiReport') { report = payload; return { recorded: true }; }
    if (operation === 'probe.rewriteStage') {
      const stage = payload.stage;
      if (stage === 'snapshot') { if (busy) throw Object.assign(Error('Synthetic busy'), { code: 'RUNTIME_BUSY' }); return snapshot(); }
      if (payload.announce) {
        stages.push(stage);
        if (stage === 'physical-send') button('Generate proposal').click();
        if (stage === 'physical-select') { const check = document.querySelector<HTMLInputElement>('[data-operation-id="character"]')!; check.checked = false; check.dispatchEvent(new Event('change')); }
        if (stage === 'physical-accept') button('Save selected changes').click();
        if (stage === 'external-source') { restoredSource = state.files['game/scene.rpy']!; state.files['game/scene.rpy'] += '# external fixture\n'; external = true; }
        if (stage === 'restore-source') { state.files['game/scene.rpy'] = restoredSource; external = false; }
      }
      return { done: stage !== 'server-delay' || !!delayedStatus };
    }
    throw Error(`Unexpected operation ${operation}`);
  };
  const response = async <T>(operation: string, payload: Record<string, unknown> = {}, requestId = 'test', lane = 'probe'): Promise<CoreResponse<T>> => {
    try { return { protocolVersion: 1, requestId, ok: true, value: await dispatch(operation, payload, lane) as T }; }
    catch (error) { return { protocolVersion: 1, requestId, ok: false, error: { code: (error as { code?: string }).code ?? 'FIXTURE_FAILURE', message: String(error) } }; }
  };
  Object.assign(browser, { __TAURI_INTERNALS__: { invoke: async (_command: string, { request }: { request: { operation: string; payload: Record<string, unknown>; requestId: string } }) => response(request.operation, request.payload, request.requestId) } });
  const { startApplication } = await import('../src/main.js');
  const requester = <T>(operation: CoreOperation, payload: Readonly<Record<string, unknown>> = {}) => response<T>(operation, payload, 'test', 'renderer');
  try {
    for (phase of [1, 2]) {
      report = undefined; startApplication(requester);
      const scope = { window: browser, document, performance, setTimeout, crypto, Event: browser.Event, TextEncoder };
      Object.assign(browser, { __loomlightRewritePhase: phase });
      runInNewContext(helper, scope);
      const before = JSON.stringify(snapshot()), callsBefore = sendCount;
      await runInNewContext(probe, scope);
      const completed = report as Record<string, any> | undefined;
      assert.equal(completed?.passed, true, JSON.stringify(completed));
      assert.equal(completed?.stage, 'complete');
      assert.equal(completed?.checks.length, phase === 1 ? 19 : 2);
      assert.deepEqual(JSON.parse(JSON.stringify(completed?.reviewedBodyDigests)), phase === 1 ? sentDigests : []);
      if (phase === 2) { assert.equal(sendCount, callsBefore); assert.equal(JSON.stringify(snapshot()), before, 'reopen must leave exact bytes unchanged'); }
    }
    assert.equal(sendCount, 6); assert.equal(saveCount, 2); assert.deepEqual(histories, ['undo', 'redo']);
    assert.equal(delayedRender, true, 'the post-update Story readiness race must be exercised');
    assert.equal(delayedSceneRead, true, 'independent probe reads must be faster than the post-update render read');
    assert.deepEqual(stages, ['observe-light', 'observe-dark', 'observe-narrow', 'physical-send', 'physical-select', 'physical-accept', 'external-source', 'restore-source']);
    assert.equal(operations.filter(op => op === 'ai.cancelRequest').length, 1);
    assert.equal(operations.some(op => op === 'character.create' || op === 'character.update'), false, 'compound Save uses only the selected transaction');
    assert.equal(document.querySelector('.rewrite-panel'), null);
  } finally { await browser.happyDOM.close(); }
});
