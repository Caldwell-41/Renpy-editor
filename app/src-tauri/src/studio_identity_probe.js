// Opt-in isolated packaged proof. Keys enter the real native dialog, never this JS.
(async () => {
  const {phase, endpoint} = window.__loomlightIdentityProbe;
  const details = {phase, stage: 'open', checks: [], localGets: 0};
  const check = (value, message) => { if (!value) throw Error(message); details.checks.push(message); };
  const wait = async predicate => {
    const until = performance.now() + 180000;
    while (!predicate()) {
      if (performance.now() > until) throw Error(`Timeout: ${details.stage}`);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  };
  const button = name => window.__loomlightProbeFindButton(name);
  const click = async name => { await wait(() => button(name) && !button(name).disabled); button(name).click(); };
  const settled = () => wait(() => button('Reload saved profiles') && !button('Reload saved profiles').disabled);
  const call = async (operation, payload = {}) => {
    const result = await window.__TAURI_INTERNALS__.invoke('core_request', {request: {
      protocolVersion: 1, requestId: crypto.randomUUID(), operation, payload,
    }});
    if (!result.ok) throw Error(result.error.code);
    return result.value;
  };
  const snapshot = () => call('ai.profiles');
  const fill = (name, value) => {
    const input = [...document.querySelectorAll('.studio-settings input')].find(node => node.ariaLabel === name);
    if (!input) throw Error(`Missing settings field: ${name}`);
    input.value = value; input.dispatchEvent(new Event('input', {bubbles: true}));
  };
  const audit = async (active, retired) => {
    const result = await call('probe.studioIdentityAudit');
    details.processId = result.processId; details.executablePath = result.executablePath;
    check(result.active === active && result.retiredAbsent === retired && result.cleanup === 0,
      `App-owned native audit: ${active} active, ${retired} retired absent, no cleanup`);
  };
  const remembered = async () => {
    for (let i = 0; i < 2; i++) {
      const state = await snapshot();
      check(state.profiles.length === 1 && state.profiles[0].credentialStatus === 'configured'
        && !state.profiles[0].credentialError && state.cleanup.length === 0,
      `Remembered native read ${i + 1}`);
    }
  };
  const discoverTwice = async () => {
    for (let i = 0; i < 2; i++) {
      details.stage = `discovery-${details.localGets + 1}`;
      await click('Refresh models'); details.localGets++;
      await settled();
      const state = await snapshot();
      check(state.profiles[0].discovery?.selectedAvailable === true
        && document.querySelector('.studio-settings [role="status"]').textContent === 'model available; discovery only',
      `Explicit authenticated local GET ${details.localGets}`);
    }
  };
  try {
    await click('Settings'); await click('AI providers'); await settled();
    const initial = await snapshot();
    check(initial.cleanup.length === 0, 'Isolated fixture has no prior owned cleanup');
    if (phase === 1) {
      check(initial.profiles.length === 0, 'Fresh isolated profile');
      fill('Profile name', 'Disposable identity proof'); fill('Endpoint', endpoint);
      fill('Model ID', 'loomlight-synthetic-model');
      await click('Save profile'); await settled();
      details.stage = 'native-entry-alpha';
      await click('Enter credential…'); await settled();
    } else {
      check(initial.profiles.length === 1 && initial.profiles[0].settings.endpoint === endpoint,
        'Full process reopen retained profile and loopback endpoint');
      check(initial.profiles[0].discovery === null, 'Discovery readiness did not persist across processes');
    }
    check(!document.querySelector('.studio-settings input[type="password"]'), 'WebView contains no secret field');
    if (phase <= 3) {
      await remembered(); await audit(1, 0); await discoverTwice();
      if (phase === 3) {
        const revision = (await snapshot()).profiles[0].revision;
        details.stage = 'native-replace-beta';
        await click('Replace credential…'); await settled();
        check((await snapshot()).profiles[0].revision === revision + 1, 'Native replacement published a new revision');
        await remembered(); await audit(1, 1); await discoverTwice();
        details.stage = 'delete'; await click('Remove credential'); await settled();
        const removed = await snapshot();
        check(removed.profiles[0].disabled && removed.profiles[0].credentialStatus === 'missing',
          'Credential deletion disabled profile and removed active reference');
        await audit(0, 2);
        check(button('Refresh models').disabled, 'Discovery disabled after deletion');
      }
    } else {
      check(initial.profiles[0].disabled && initial.profiles[0].credentialStatus === 'missing',
        'Final reopen retained deletion without another key entry');
      check(button('Refresh models').disabled, 'Final reopen cannot discover without a key');
      await audit(0, 0);
      await click('Remove profile'); await settled();
      const final = await snapshot();
      check(final.profiles.length === 0 && final.cleanup.length === 0, 'Disposable profile fully removed');
    }
    details.stage = 'complete';
    await call('probe.runtimeUiReport', {passed: true, ...details});
  } catch (error) {
    // Fixed assertion/IPC codes only; never serialize arbitrary state or HTTP headers.
    details.error = String(error);
    await call('probe.runtimeUiReport', {passed: false, ...details});
  }
})();
