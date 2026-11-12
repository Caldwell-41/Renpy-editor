// Explicit packaged-WebView probe. UI input is synthetic; no SDK is started.
(async () => {
  const stages = []; let stage = 'open', awaitedControl = 'recent project', serial = 0, sessionId, identity, identities, binding, appearances, acceptedSource, historyObservation, imageDecoded = false;
  const assert = (value, message) => { if (!value) throw Error(message); };
  const until = async condition => { const end = performance.now() + 30000; while (!await condition()) { if (performance.now() > end) throw Error(`Timeout: ${stage} / ${awaitedControl}`); await new Promise(resolve => setTimeout(resolve, 30)); } };
  const request = async (operation, payload = {}) => {
    const response = await window.__TAURI_INTERNALS__.invoke('core_request', { request: { protocolVersion: 1, requestId: `controls-${++serial}`, operation, payload: operation === 'project.current' ? payload : { sessionId, ...payload } } });
    if (!response.ok) throw Object.assign(Error(`${operation}: ${response.error.code}`), { code: response.error.code });
    return response.value;
  };
  const call = (operation, payload = {}) => ['project.current', 'source.open', 'screens.inspect', 'screens.list', 'authoring.list'].includes(operation) ? window.__loomlightProbeRetryBusy(() => request(operation, payload)) : request(operation, payload);
  const find = window.__loomlightProbeFindButton;
  const reveal = element => {
    assert(element, 'Rendered control required');
    for (let parent = element.parentElement; parent; parent = parent.parentElement) if (parent.tagName === 'DETAILS' && !parent.open) parent.querySelector(':scope > summary').click();
    element.scrollIntoView({ block: 'center' });
    const bounds = element.getBoundingClientRect(), hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    assert(bounds.width > 0 && bounds.height > 0 && hit && element.contains(hit), 'Control must be visible and unobscured');
    return element;
  };
  const click = async label => { awaitedControl = `button ${label}`; await until(() => find(label) && !find(label).disabled); reveal(find(label)).click(); };
  const field = label => document.querySelector(`[aria-label="${label}"]`);
  const change = (label, value) => { const element = reveal(field(label)); element.focus(); assert(document.activeElement === element, `Focus ${label}`); element.value = value; element.dispatchEvent(new Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); };
  const key = (label, value) => field(label).dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }));
  const settled = () => until(() => document.querySelector('.sce-state')?.textContent === 'No pending changes' && !field('Width')?.readOnly);
  const checkpoint = value => { stage = value; stages.push({ stage }); };
  const source = async () => (await call('source.open', { path: identity.path })).text;
  const inspect = async () => (await call('screens.inspect', { path: identity.path })).screens[0].nodes;
  const history = async (direction, expected) => {
    const previous = document.querySelector('.screen-card').firstChild;
    historyObservation = { direction, expected, widthReadOnly: field('Width')?.readOnly };
    await window.__loomlightProbeHistory(direction.toLowerCase());
    await until(async () => { historyObservation.actual = await source(); historyObservation.previousConnected = previous.isConnected; return historyObservation.actual === expected && !previous.isConnected; });
  };
  try {
    await until(() => document.querySelector('.recent-open')); document.querySelector('.recent-open').click();
    await click('Screens'); sessionId = (await call('project.current')).sessionId;
    const coins = (await call('authoring.list')).variables.find(variable => variable.technicalName === 'coins'); assert(coins?.variableType === 'int', 'Existing integer fixture');
    await click('New screen'); await until(() => field('Screen name')); change('Start with', 'blank'); change('Screen name', 'travel_notes'); change('Screen kind', 'dialog'); await click('Create screen');
    await until(() => document.querySelector('.screen-tree [data-node-id]'));
    identity = (await call('screens.list')).owned.find(owner => owner.name === 'travel_notes'); assert(identity?.resolved && identity.kind === 'dialog', 'Dialog owner resolves');
    const before = await source(); await click('Add element'); reveal(document.querySelector('[data-kind="bar"]')).click();
    await until(() => field('Choose integer variable')); change('Choose integer variable', coins.id); change('Minimum', '-10'); change('Maximum', '90'); change('Width', '360'); change('Height', '24');
    await click('Apply changes'); await settled(); const barSource = await source();
    binding = (await inspect()).find(node => node.kind === 'bar').barBinding; assert(binding.variableId === coins.id && binding.minimum === '-10' && binding.maximum === '90', 'Exact decimal binding accepted');
    await history('Undo', before); await history('Redo', barSource); checkpoint('controls-bar-passed');

    await click('1  Choose'); await click('Add element'); reveal(document.querySelector('[data-kind="imagebutton"]')).click();
    await until(() => field('Choose normal image')); const trigger = field('Choose normal image'); reveal(trigger).click();
    await until(() => document.querySelector('.screen-image-dialog[open]')); await click('Close'); await until(() => !document.querySelector('.screen-image-dialog[open]'));
    assert(document.activeElement === trigger, 'Cancel restores picker trigger focus'); assert(await source() === barSource, 'Picker cancellation writes nothing');
    for (const name of ['normal', 'hover', 'selected', 'selected + hover', 'disabled', 'selected + disabled']) {
      reveal(field(`Choose ${name} image`)).click(); await until(() => field('Use Station seal')); reveal(field('Use Station seal')).click();
      await until(() => !document.querySelector('.screen-image-dialog[open]') && field(`Choose ${name} image`)?.querySelector('img')?.complete);
      assert(document.activeElement === field(`Choose ${name} image`), 'Chosen reference restores current trigger focus');
    }
    imageDecoded = field('Choose normal image').querySelector('img').naturalWidth === 80; assert(imageDecoded, 'Actual picker media decoded');
    change('Width', '240'); change('Height', '80'); change('Add action', 'setVariable'); change('Action 1 variable', coins.id); change('Action 1 value', '21'); change('Add action', 'finishInteraction');
    await click('Apply changes'); await settled(); const placed = await source(); assert((placed.match(/Transform\(/g) ?? []).length === 6, 'Six explicit state transforms'); checkpoint('controls-picker-passed');

    change('Width', 'bad'); await click('Apply changes'); await until(() => field('Width')?.getAttribute('aria-invalid') === 'true');
    assert(field('Width').value === 'bad' && document.activeElement === field('Width'), 'Invalid input and focus retained'); assert(await source() === placed, 'Invalid input writes nothing');
    await click('Cancel'); await settled(); assert(field('Width').value === '240' && await source() === placed, 'Cancel restores accepted dimensions'); checkpoint('controls-validation-passed');

    const priorWidth = field('Width');
    await click('View in Source'); await until(() => document.querySelector('.screen-source-dialog[open]')); await click('Edit in Source'); await until(() => document.querySelector('.source-editor'));
    const editor = window.__loomlightProbeEditor(document.querySelector('.source-editor'));
    const withNeighbor = placed + '    use source_only_footer()\n\nscreen source_only_footer():\n    text "Protected neighbor"\n';
    editor.value = withNeighbor; editor.dispatchEvent(new Event('input', { bubbles: true })); await click('Save Source'); await until(() => document.querySelector('#app-status')?.textContent === 'Saved');
    await click('Screens'); await until(() => field('Width') && field('Width') !== priorWidth); change('Width', '300'); key('Width', 'Enter'); await settled(); acceptedSource = await source();
    assert(acceptedSource.includes('xysize=(300, 80)') && acceptedSource.includes('use source_only_footer()'), 'Keyboard uses combined state scaling and preserves opaque neighbor');
    await history('Undo', withNeighbor); await history('Redo', acceptedSource); checkpoint('controls-history-passed');
    reveal(field('Preview selected + hover sample')).click(); assert(await source() === acceptedSource && find('Apply changes').disabled, 'Marked state samples stay inert');
    assert(String((await call('authoring.list')).variables.find(variable => variable.id === coins.id).defaultValue) === '12', 'Authoring actions and samples did not execute'); checkpoint('controls-source-passed');

    const nodes = await inspect(); identities = [identity.rootId, nodes.find(node => node.kind === 'bar').id, nodes.find(node => node.kind === 'imagebutton').id];
    appearances = nodes.find(node => node.kind === 'imagebutton').imageButtonAppearances;
    await click('Close Project'); await until(() => document.querySelector('.recent-open')); document.querySelector('.recent-open').click(); await until(() => find('Screens'));
    const reopened = await call('project.current'); assert(reopened.sessionId !== sessionId, 'New reopened session'); sessionId = reopened.sessionId; await click('Screens');
    await until(() => document.querySelector(`[data-node-id="${identities[2]}"]`)); document.querySelector(`[data-node-id="${identities[2]}"]`).dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); await until(() => field('Width'));
    const fresh = await inspect(); assert(identities.every(id => fresh.some(node => node.id === id)) && await source() === acceptedSource, 'Source and stable identities reopen');
    assert(JSON.stringify(fresh.find(node => node.kind === 'imagebutton').imageButtonAppearances) === JSON.stringify(appearances), 'Six typed references reopen'); checkpoint('controls-reopen-passed'); checkpoint('complete');
    await call('probe.runtimeUiReport', { scenario: 'screen-controls', passed: true, stage, stages, identity, identities, binding, appearances, acceptedSource, imageDecoded, nativeWebView: true, sdkExecuted: false });
  } catch (error) {
    await call('probe.runtimeUiReport', { scenario: 'screen-controls', passed: false, stage, stages, identity, awaitedControl, historyObservation, widthReadOnly: field('Width')?.readOnly, historyButtons: [...document.querySelectorAll('.screen-tools button')].map(button => ({ label: button.textContent, disabled: button.disabled, hidden: button.hidden })), error: String(error), feedback: document.querySelector('.screen-message')?.textContent, nativeWebView: true, sdkExecuted: false });
  }
})();
