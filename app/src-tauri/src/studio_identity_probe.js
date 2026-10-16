// Opt-in isolated packaged proof. Keys enter the real native dialog, never this JS.
(async () => {
  const {phase, endpoint} = window.__loomlightIdentityProbe;
  const details = {contract:2,phase, stage: 'open', checks: [], localGets: 0};
  const check = (value, message) => { if (!value) throw Error(message); details.checks.push(message); };
  const wait = async predicate => {
    const until = performance.now() + 180000;
    while (!predicate()) {
      if(window.__loomlightProbeSignal?.aborted)throw Error("Probe cancelled");
      if (performance.now() > until) throw Error(`Timeout: ${details.stage}`);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  };
  const button = name => window.__loomlightProbeFindButton(name);
  const click = async name => { await wait(() => button(name) && !button(name).disabled); button(name).click(); };
  const settled = () => wait(() => document.querySelector('.studio-settings')?.dataset.busy==='false');
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
  const discover = async () => {
    const before=JSON.stringify(await snapshot());
    await click('Connect');details.localGets++;await settled();
    check(document.querySelector('.studio-connect [role="status"]').textContent.startsWith('Connected.')
      && [...document.querySelectorAll('#studio-model-choices option')].some(n=>n.value==='loomlight-synthetic-model'),
      `Explicit authenticated local GET ${details.localGets}`);
    check(JSON.stringify(await snapshot())===before,'Connect does not persist profile changes');
  };
  const discoverTimes = async count => {
    for(let i=0;i<count;i++){details.stage=`discovery-${details.localGets+1}`;await discover();}
  };
  const saveDraft=async()=>{await discover();fill('Model ID','loomlight-synthetic-model');await click('Save profile');await settled();};
  try {
    await click('Settings'); await click('AI providers'); await settled();
    const initial = await snapshot();
    check(initial.cleanup.length === 0, 'Isolated fixture has no prior owned cleanup');
    if (phase === 1) {
      check(initial.profiles.length === 0, 'Fresh isolated profile');
      fill('Profile name', 'Disposable identity proof'); fill('Endpoint', endpoint);
      check(button('Save profile').disabled,'New profile cannot save before connection');
      details.stage = 'native-entry-alpha';
      await click('Enter credential…'); await settled();
      check((await snapshot()).profiles.length===0,'Native draft entry does not publish a profile');
      await saveDraft();
    } else {
      check(initial.profiles.length === 1 && initial.profiles[0].settings.endpoint === endpoint,
        'Full process reopen retained profile and loopback endpoint');
      check(initial.profiles[0].discovery === null, 'Discovery readiness did not persist across processes');
    }
    check(!document.querySelector('.studio-settings input[type="password"]'), 'WebView contains no secret field');
    if (phase <= 3) {
      await remembered(); await audit(1, 0); await discoverTimes(phase===1?1:2);
      if (phase === 3) {
        const revision = (await snapshot()).profiles[0].revision;
        details.stage = 'native-replace-beta';
        await click('Replace credential…'); await settled();
        check((await snapshot()).profiles[0].revision===revision,'Draft key replacement preserves saved revision until Save');
        await saveDraft();
        check((await snapshot()).profiles[0].revision === revision + 1, 'Native replacement published a new revision');
        await remembered(); await audit(1, 1); await discoverTimes(1);
        details.stage = 'delete'; await click('Remove credential'); await settled();
        const removed = await snapshot();
        check(removed.profiles[0].disabled && removed.profiles[0].credentialStatus === 'missing',
          'Credential deletion disabled profile and removed active reference');
        await audit(0, 2);
        check(button('Connect').disabled, 'Discovery disabled after deletion');
      }
    } else {
      check(initial.profiles[0].disabled && initial.profiles[0].credentialStatus === 'missing',
        'Final reopen retained deletion without another key entry');
      check(button('Connect').disabled, 'Final reopen cannot discover without a key');
      await audit(0, 0);
      await click('Remove profile');await click('Remove profile'); await settled();
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
