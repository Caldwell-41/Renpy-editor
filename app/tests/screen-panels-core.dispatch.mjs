// Production Help fields/Story controller -> real dispatch/transactions. No SDK.
import assert from 'node:assert/strict';
import {mkdir, realpath, writeFile, access, readFile} from 'node:fs/promises';
import {resolve, join, dirname} from 'node:path';
import {randomUUID, createHash} from 'node:crypto';
import {Window} from 'happy-dom';
import {driverProcess} from './phase2-driver-process.mjs';
import {buildPanelCreationForm} from '../dist-tests/src/screen-panels.js';
import {ScreenText} from '../dist-tests/src/screen-text.js';
import {ScreenLayoutEditor} from '../dist-tests/src/screen-layout.js';
import {renderStoryView} from '../dist-tests/src/scene-ui.js';

const output = resolve(process.env.PANEL_CORE_UI_OUTPUT ?? `target/screen-panels-core-ui-${randomUUID()}`);
await mkdir(dirname(output), {recursive: true}); await mkdir(output);
const scratch = join(await realpath(output), `loomlight-help-controller-${randomUUID()}`);
const child = driverProcess(resolve(process.env.CARGO_TARGET_DIR ?? 'target', `debug/examples/help-controller-driver${process.platform === 'win32' ? '.exe' : ''}`), [scratch]);
const browser = new Window();
Object.assign(globalThis, {window: browser, document: browser.document, HTMLElement: browser.HTMLElement, HTMLInputElement: browser.HTMLInputElement, HTMLSelectElement: browser.HTMLSelectElement, HTMLTextAreaElement:browser.HTMLTextAreaElement, HTMLDetailsElement:browser.HTMLDetailsElement, Event: browser.Event, KeyboardEvent: browser.KeyboardEvent});
let session, disposeStory, form, textEditor;
const result = {passed: false, controllerToCore: true, sdkExecuted: false, nativeWebView: false, physicalInput: false, stages: [], operations: {}};
const messages = [];
const hash = text => createHash('sha256').update(text).digest('hex');
async function call(operation, payload = {}) {
  assert(!operation.startsWith('runtime.') && !['screens.canvasRender', 'screens.canvasStatus'].includes(operation));
  result.operations[operation] = (result.operations[operation] ?? 0) + 1;
  const response = await child.request({protocolVersion: 1, requestId: randomUUID().replaceAll('-', ''), operation,
    payload: {...payload, ...(session && !['project.listRecent', 'project.openRecent'].includes(operation) ? {sessionId: session} : {})}});
  if (!response.ok) { (result.refusals ??= []).push({operation, payload, error: response.error}); throw Object.assign(Error(response.error.message), response.error); }
  return response.value;
}
async function wait(check, description) {
  const deadline = Date.now() + 5000;
  while (!check()) { if (Date.now() >= deadline) throw Error('Controller did not settle: ' + description); await new Promise(resolve => setTimeout(resolve, 5)); }
}
function button(host, text) { const node = [...host.querySelectorAll('button')].find(node => node.textContent === text); assert(node, text); return node; }
async function history(type) { const model = await call('scene.list'); return call('scene.apply', {expectedProjectRevision: model.projectRevision, expectedSourceMapRevision: model.sourceMapRevision, command: {type}}); }
async function source(path) { return (await call('source.open', {path})).text; }
async function saveSource(path, text) {
  const base = await call('source.open', {path});
  const draft = await call('source.updateDraft', {path, expectedBaseRevision: base.baseRevision, text, selectionStart: 0, selectionEnd: 0});
  return call('source.save', {path, expectedBaseRevision: draft.baseRevision, expectedDraftVersion: draft.draftVersion});
}
async function mountStory(sceneId) {
  disposeStory?.(); document.body.replaceChildren();
  const model = await call('scene.list'); model.lastOpen = {chapterId: model.scenes.find(scene => scene.id === sceneId).chapterId, sceneId};
  const host = document.createElement('main'), tree = document.createElement('aside'); document.body.append(host, tree);
  disposeStory = renderStoryView(host, tree, model, {
    resolution: {width: 1280, height: 720}, status: message => messages.push(message), present: async () => { throw Error('No media requested'); },
    screenCatalog: () => call('screens.list'), resolveScreenTarget: binding => call('screens.resolveTarget', {binding}),
    apply: (command, expected) => call('scene.apply', {expectedProjectRevision: expected.projectRevision, expectedSourceMapRevision: expected.sourceMapRevision, command}),
    viewSource: (...args) => { result.sourceNavigation = args; },
  }).dispose;
  return host;
}
async function openBeat(host, type) {
  button(host, 'Add Beat').click(); const draft = host.querySelector('.new-beat');
  const select = draft.querySelector('select'); select.value = type; select.dispatchEvent(new Event('change', {bubbles: true}));
  await wait(() => draft.querySelector('[aria-label="Panel screen"]')?.disabled === false && /Panel ready/.test(draft.textContent), 'Panel resolution'); return draft;
}
try {
  assert.equal((await child.next()).ready, true);
  const recent = (await call('project.listRecent'))[0], opened = await call('project.openRecent', {recentId: recent.id});
  session = opened.sessionId; const projectId = opened.projectId;
  const initialModel = await call('scene.list'), entry = initialModel.scenes.find(scene => scene.id === initialModel.entrySceneId);
  const opaqueNeighbor = await source(entry.sourcePath); assert.match(opaqueNeighbor, /opaque_neighbor/);
  // The native picker is replaced only by the bounded public-file selection hook.
  const choice = await child.request({driver: 'choosePanelImage'});
  const imported = await call('asset.import', {authorityId: choice.authorityId, kind: 'uiImage', technicalName: 'panel_emblem', displayName: 'Panel emblem'});
  const catalog = await call('screens.list');
  let created, creationCalls = 0;
  form = buildPanelCreationForm({assets: imported.assets, create: async value => {
    creationCalls++; created = await call('screens.create', {...value, expectedProjectRevision: catalog.projectRevision, expectedSourceMapRevision: catalog.sourceMapRevision, expectedInventoryRevision: catalog.inventoryRevision});
    form.dispose(); form.element.remove();
  }, cancel: () => { form.dispose(); form.element.remove(); }});
  document.body.append(form.element); form.element.querySelector('[name="screen-name"]').value = 'travel_notes';
  form.element.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
  await wait(() => created || form.element.querySelector('[role="alert"]')?.textContent, 'Help create'); assert(created, form.element.textContent); assert.equal(creationCalls, 1);
  const panel = created.owned.find(screen => screen.name === 'travel_notes'); assert.equal(panel.kind, 'panel');
  const acceptedPanel = await source(panel.path); assert.match(acceptedPanel, /text "Help"/); assert.match(acceptedPanel, /action Hide\("travel_notes"\)/); assert.match(acceptedPanel, /default_focus True/);
  await history('undo'); assert(!(await call('screens.list')).owned.some(screen => screen.id === panel.id));
  await history('redo'); assert.equal(await source(panel.path), acceptedPanel);
  result.stages.push('Help form -> one accepted create -> one-step Undo/Redo');
  const panelDocument=await call('screens.inspect',{path:panel.path}),panelNodes=panelDocument.screens.find(s=>s.name===panel.name).nodes;
  const panelButton=panelNodes.find(node=>node.kind==='textbutton'&&node.actions?.some(action=>action.type==='hideScreen'));assert(panelButton);
  const panelTarget=await call('screens.resolveTarget',{binding:{screenId:panel.id,sourceName:panel.name}});assert.equal(panelTarget.canShowHide,true);
  const panelView={document:panelDocument,screenId:panel.id,screenName:panel.name,nodes:panelNodes,selected:panelButton,step:'design',busy:false},panelCard=document.createElement('section');document.body.append(panelCard);
  const panelLayout=new ScreenLayoutEditor({view:()=>undefined,commit:async()=>{throw Error('No separate layout writer');},preview:()=>{},note:()=>{},select:()=>{}});
  const panelWrites=[];
  textEditor=new ScreenText({view:()=>panelView,interaction:()=>({authoringRevision:panelDocument.authoringRevision,variables:[],targets:[panelTarget],owner:panel}),current:()=>true,request:call,coordinate:task=>task(),inspect:async()=>panelDocument,commit:async(command,base)=>{panelWrites.push(command);const accepted=await call('screens.compose',{screenId:panel.id,expectedRevision:base.revision,command});textEditor.accept(command,base,accepted.document);},redraw:()=>{},preview:()=>{},source:()=>{},saved:()=>{},layoutTools:()=>{},order:()=>{},note:m=>messages.push(m)},panelLayout);
  textEditor.render(panelCard,panelView);const target=panelCard.querySelector('[aria-label="Action 1 screen"]');target.dispatchEvent(new Event('change',{bubbles:true}));button(panelCard,'Apply').click();await wait(()=>!textEditor.isSaving(),'self-Hide no-op accepted');assert.equal(await source(panel.path),acceptedPanel);assert.deepEqual(panelWrites[0].interaction.expectedTargetRevisions,[{target:panelTarget.binding,revisions:panelTarget.revisions}]);
  textEditor.unmount();panelCard.replaceChildren();textEditor.render(panelCard,panelView);panelCard.querySelector('[aria-label="Remove action 1"]').click();button(panelCard,'Apply').click();await wait(()=>!textEditor.isSaving(),'Null accepted');const nullSource=acceptedPanel.replace(`                action Hide("${panel.name}")`,'                action Null()');assert.equal(await source(panel.path),nullSource);await history('undo');assert.equal(await source(panel.path),acceptedPanel);await history('redo');assert.equal(await source(panel.path),nullSource);await history('undo');assert.equal(await source(panel.path),acceptedPanel);textEditor.dispose();textEditor=undefined;panelCard.remove();result.stages.push('canonical self-Hide UI no-op revalidates self review; empty sequence writes Null with one-step Undo/Redo');


  let model = await call('scene.list');
  model = await call('scene.apply', {expectedProjectRevision: model.projectRevision, expectedSourceMapRevision: model.sourceMapRevision, command: {type: 'createScene', chapterId: model.chapters[0].id, displayName: 'Panel UI proof'}});
  const scene = model.scenes.find(scene => scene.displayName === 'Panel UI proof'), before = await source(scene.sourcePath);
  let host = await mountStory(scene.id), draft = await openBeat(host, 'showScreen');
  button(draft, 'Add Beat').click(); await wait(() => !draft.isConnected || messages.at(-1)?.includes('Input retained'), 'Show accepted'); assert(!draft.isConnected, messages.at(-1));
  const shownSource = await source(scene.sourcePath); assert.equal(shownSource, before.replace('    return', '    show screen travel_notes\n    return'));
  model = await call('scene.list'); const shown = model.scenes.find(item => item.id === scene.id).beats.find(beat => beat.payload.type === 'showScreen');
  assert.equal(shown.payload.target.screenId, panel.id);
  host.querySelector(`[data-beat-id="${shown.id}"] .beat-select`).click();
  await wait(() => /Panel ready/.test(host.querySelector('[data-beat-type="showScreen"]')?.textContent ?? ''), 'existing Show opened');
  button(host, 'View in Source').click(); assert.deepEqual(result.sourceNavigation, [scene.sourcePath, shown.byteStart, shown.byteEnd, model.scenes.find(item => item.id === scene.id).sourceRevision]);
  const editor = host.querySelector('[data-beat-type="showScreen"]'); button(editor, 'Commit Beat').click(); await wait(() => !editor.isConnected, 'no-op Show accepted');
  await history('undo'); assert.equal(await source(scene.sourcePath), before, 'no-op must not add a history entry');
  await history('redo'); assert.equal(await source(scene.sourcePath), shownSource);
  result.stages.push('Story controller -> exact Show Source -> no-op -> one-step Undo/Redo');

  host = await mountStory(scene.id); draft = await openBeat(host, 'hideScreen');
  draft.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true})); assert(!draft.isConnected); assert.equal(await source(scene.sourcePath), shownSource);
  draft = await openBeat(host, 'hideScreen'); button(draft, 'Add Beat').click(); await wait(() => !draft.isConnected, 'Hide accepted');
  const hiddenSource = await source(scene.sourcePath); assert.equal(hiddenSource, shownSource.replace('    return', '    hide screen travel_notes\n    return'));
  await history('undo'); assert.equal(await source(scene.sourcePath), shownSource); await history('redo'); assert.equal(await source(scene.sourcePath), hiddenSource);
  result.stages.push('Hide exact Source -> Cancel/Escape unchanged -> one-step Undo/Redo');

  host = await mountStory(scene.id); draft = await openBeat(host, 'showScreen');
  const resolveCount = result.operations['screens.resolveTarget'];
  await saveSource(panel.path, acceptedPanel + '# accepted Source edit\n');
  const startMessages = messages.length; button(draft, 'Add Beat').click(); await wait(() => messages.length > startMessages && messages.at(-1).includes('Input retained'), 'stale refusal');
  assert(draft.isConnected); assert.equal(result.operations['screens.resolveTarget'], resolveCount); assert.equal(await source(scene.sourcePath), hiddenSource);
  button(draft, 'Cancel').click();
  const renamed = (await source(panel.path)).replace('screen travel_notes():', 'screen renamed_notes():'); await saveSource(panel.path, renamed);
  // Retain public fixture metadata for diagnosing a refused reopen. These bytes
  // are evidence only; controller assertions use public dispatch/Source reads.
  const diagnostic = join(output, 'before-reopen'); await mkdir(diagnostic);
  for (const file of ['project.json', 'source-map.json', 'authoring.json']) await writeFile(join(diagnostic, file), await readFile(join(scratch, 'synthetic-project/.renpy-editor', file)));
  await writeFile(join(diagnostic, 'panel.rpy'), await source(panel.path));
  await writeFile(join(diagnostic, 'story.rpy'), await source(scene.sourcePath));
  await call('project.close'); session = undefined;
  const currentRecent = (await call('project.listRecent')).find(item => item.projectId === projectId); assert(currentRecent, 'current recent project identity');
  session = (await call('project.openRecent', {recentId: currentRecent.id})).sessionId;
  model = await call('scene.list'); const reopened = model.scenes.find(item => item.id === scene.id), unresolved = reopened.beats.find(beat => beat.id === shown.id);
  assert.equal(unresolved.protected, true); assert.equal(unresolved.payload.target.screenId, panel.id); assert.equal(unresolved.payload.target.sourceName, 'travel_notes'); assert(!unresolved.payload.revisions);
  assert.equal(await source(scene.sourcePath), hiddenSource);
  assert.equal(await source(entry.sourcePath), opaqueNeighbor, 'unrelated comments and opaque Source remain exact');
  host = await mountStory(scene.id); host.querySelector(`[data-beat-id="${shown.id}"] .beat-select`).click(); assert.equal(host.querySelector('[aria-label="Panel screen"]'), null);
  result.stages.push('stale captured draft refuses -> Source rename -> reopen keeps protected stable intent');
  result.acceptedHashes = {panel: hash(acceptedPanel), show: hash(shownSource), hide: hash(hiddenSource)}; result.passed = true;
} catch (error) {
  result.failure = {message: error.message, stack: error.stack}; throw error;
} finally {
  result.messages = messages;
  form?.dispose(); textEditor?.dispose(); disposeStory?.(); await browser.happyDOM.close();
  try { await child.stop(); await assert.rejects(access(scratch)); result.cleanupComplete = true; }
  catch (error) { result.passed = false; result.cleanupFailure = error.message; throw error; }
  finally { result.driver = child.exitStatus(); await writeFile(join(output, 'result.json'), JSON.stringify(result, null, 2) + '\n'); }
}
console.log('PASS actual Help/Story DOM-controller-core: atomic starter, exact Source, no-op/history, Cancel/Escape, stale retention and protected rename/reopen. No SDK/native proof.');
