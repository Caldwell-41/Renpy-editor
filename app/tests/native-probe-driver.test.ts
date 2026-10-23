import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { Window } from 'happy-dom';
import { renderSceneAuthoring, type SceneWorkspace } from '../src/scene-ui.js';

const helper = await readFile(new URL('../../src-tauri/src/native_editor_probe.js', import.meta.url), 'utf8');
const selectable = await readFile(new URL('../../src-tauri/src/selectable_edit_probe.js', import.meta.url), 'utf8');

test('selectable native probe retains the selected Beat across history and reports bounded wait diagnostics', async () => {
  const browser = new Window();
  Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement });
  browser.document.body.innerHTML = '<aside id="tree"></aside><main id="host"></main>';
  const model: SceneWorkspace = {
    projectRevision: '1'.repeat(64), sourceMapRevision: '2'.repeat(64), entrySceneId: 'scene',
    lastOpen: { chapterId: 'chapter', sceneId: 'scene' }, canUndo: true, canRedo: true,
    chapters: [{ id: 'chapter', displayName: 'Chapter', directory: 'game/chapters' }],
    scenes: [{ id: 'scene', chapterId: 'chapter', displayName: 'Scene', technicalLabel: 'scene', sourcePath: 'game/scene.rpy', sourceRevision: '3'.repeat(64), sourceConflict: false, partial: false,
      beats: [{ id: 'narration', byteStart: 0, byteEnd: 20, protected: false, payload: { type: 'narration', text: 'Synthetic narration' } }, { id: 'return', byteStart: 20, byteEnd: 30, protected: false, payload: { type: 'return' } }] }],
    authoring: { characters: [], appearances: [], assets: [], variables: [] },
  };
  const history: string[] = [], opened: string[] = [];
  const dispose = renderSceneAuthoring(document.querySelector('#host')!, document.querySelector('#tree')!, model, {
    status: () => {}, resolution: { width: 1280, height: 720 }, present: async () => { throw Error('unexpected media'); },
    apply: async command => { history.push(command.type); return model; },
    assist: (_scene, beat, action) => { opened.push(`${action}:${beat}`); },
  }, 'narration'); // Acceptance explicitly restores this target before Undo/Redo.
  const scope: { __loomlightProbeSelectBeat?: (id: string) => void; __loomlightProbeFindButton?: (label: string) => HTMLButtonElement } = {};
  runInNewContext(helper, { window: scope, document, performance, setTimeout });
  const selected = () => document.querySelector('.beat-select')!.ariaExpanded;
  const assist = () => scope.__loomlightProbeFindButton!('Assist · Edit Scene')!;
  try {
    for (const command of ['Undo', 'Redo']) {
      scope.__loomlightProbeFindButton!(command)!.click();
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    assert.deepEqual(history, ['undo', 'redo']); assert.equal(selected(), 'true');
    document.querySelector<HTMLButtonElement>('.beat-select')!.click();
    assert.equal(selected(), 'false'); assert.equal(assist().disabled, true, 'old unconditional probe click deselects the retained target');
    scope.__loomlightProbeSelectBeat!('narration');
    assert.equal(selected(), 'true'); assert.equal(assist().disabled, false);
    scope.__loomlightProbeSelectBeat!('narration');
    assert.equal(selected(), 'true', 'remount must preserve an already selected target');
    assist().click(); assert.deepEqual(opened, ['editScene:narration']);
    assert.throws(() => scope.__loomlightProbeSelectBeat!('absent'), /Unique rendered fixture Beat/);
    assert.ok(selectable.includes('window.__loomlightProbeSelectBeat(beat.id)'), 'actual selectable mount uses the tested rendered selection helper');
  } finally { dispose(); }

  // Run the actual probe with an ordinary disabled control and an elapsed deadline.
  // Only fixed control/state facts may enter its diagnostic, never project text.
  document.body.innerHTML = '<button disabled>Source foundation fixture</button><pre>private project text must stay absent</pre>';
  let now = 0, reported: Record<string, unknown> | undefined;
  const probeWindow = { ...scope, __TAURI_INTERNALS__: { invoke: async (_command: string, { request }: { request: { operation: string; payload: Record<string, unknown> } }) => {
    assert.equal(request.operation, 'probe.runtimeUiReport'); reported = request.payload; return { ok: true, value: { recorded: true } };
  } } };
  await runInNewContext(selectable, { window: probeWindow, document, performance: { now: () => now += 21000 }, setTimeout, crypto });
  assert.equal(reported?.passed, false); assert.equal(reported?.waitingFor, 'button: Source foundation fixture');
  assert.match(String(reported?.failure), /Timeout at open waiting for button: Source foundation fixture/);
  assert.deepEqual(JSON.parse(JSON.stringify(reported?.observation)), {
    panelPresent: false, busy: null, active: null, errorCode: '', selectedBeatCount: 0,
    buttons: Object.fromEntries(['Assist · Edit Scene', 'Review complete send', 'Generate proposal', 'Save selected changes', 'Undo', 'Redo'].map(name => [name, { present: false, disabled: null }])),
  });
  assert.equal(JSON.stringify(reported).includes('private project text'), false);
  await browser.happyDOM.close();
});

test('native driver matches a recent title independently of its date without prefix ambiguity', async () => {
  const browser = new Window();
  browser.document.body.innerHTML = '<button class="recent-open">Runtime UI fixture extra<span class="recent-time">Sep 30, 2026</span></button><button class="recent-open">Runtime UI fixture<span class="recent-time">Sep 30, 2026</span></button><button>Source</button>';
  const scope: { __loomlightProbeFindButton?: (label: string) => HTMLElement } = {};
  runInNewContext(helper, { window: scope, document: browser.document, performance, setTimeout });
  assert.equal([...browser.document.querySelectorAll('button')].find(b => b.textContent === 'Runtime UI fixture'), undefined, 'old exact-text selector must reject this dated fixture');
  assert.equal(scope.__loomlightProbeFindButton!('Runtime UI fixture'), browser.document.querySelectorAll('button')[1]);
  assert.equal(scope.__loomlightProbeFindButton!('Source'), browser.document.querySelectorAll('button')[2]);
  assert.equal(scope.__loomlightProbeFindButton!('Runtime UI'), undefined);
  await browser.happyDOM.close();
});

test('native observation retries only busy rejection and retains failures and deadline', async () => {
  const scope: { __loomlightProbeRetryBusy?: <T>(task: () => Promise<T>, timeout?: number) => Promise<T> } = {};
  runInNewContext(helper, { window: scope, document: {}, performance, setTimeout });
  let calls = 0;
  const value = await scope.__loomlightProbeRetryBusy!(async () => {
    if (++calls < 3) throw Object.assign(new Error('busy'), { code: 'RUNTIME_BUSY' });
    return 'retained';
  });
  assert.equal(value, 'retained'); assert.equal(calls, 3);
  calls = 0;
  await assert.rejects(scope.__loomlightProbeRetryBusy!(async () => { calls++; throw Object.assign(new Error('invalid source'), { code: 'INVALID_SOURCE' }); }), /invalid source/);
  assert.equal(calls, 1, 'real errors must not be retried');
  calls = 0;
  await assert.rejects(scope.__loomlightProbeRetryBusy!(async () => { calls++; throw Object.assign(new Error('busy deadline'), { code: 'RUNTIME_BUSY' }); }, 0), /busy deadline/);
  assert.equal(calls, 1, 'deadline must remain rejecting');
});

test('native helper selects the visible confirmation when a hidden control has the same caption',async()=>{
 const browser=new Window();browser.document.body.innerHTML='<button hidden>Remove profile</button><section hidden><button>Remove profile</button></section><button>Remove profile</button>';
 const scope:{__loomlightProbeFindButton?:(name:string)=>HTMLElement}={};
 try{runInNewContext(helper,{window:scope,document:browser.document,performance,setTimeout});assert.equal(scope.__loomlightProbeFindButton!('Remove profile'),browser.document.querySelectorAll('button')[2]);
 browser.document.body.innerHTML='<button hidden disabled>Generate proposal</button>';assert.equal(scope.__loomlightProbeFindButton!('Generate proposal'),browser.document.querySelector('button'));}
 finally{await browser.happyDOM.close();}
});


test('canvas source comparison allows only alignment float roundoff and preserves every other byte', () => {
  const scope: { __loomlightProbePositionSourceMatches?: (actual: string, expected: string) => boolean } = {};
  runInNewContext(helper, { window: scope, document: {}, performance, setTimeout });
  const matches = scope.__loomlightProbePositionSourceMatches!;
  const expected = '# retained\n    xalign 0.9375\n    yalign 0.9222222222222223\n    xsize 640\n';
  const actual = expected.replace('0.9222222222222223', '0.9222222222222224');
  assert.equal(matches(actual, expected), true, 'native JSON roundtrip differs by one representable float');
  assert.equal(matches(expected, expected), true);
  for (const bad of [actual.replace('0.9375', '0.9390625'), actual.replace('640', '641'),
    actual.replace('# retained', '# changed'), actual.replace('yalign ', 'yalign  '),
    actual.replace('0.9375', '1'), actual.replace('0.9375', 'float(0.9375)'), actual + '\n']) {
    assert.equal(matches(bad, expected), false, bad);
  }
});
