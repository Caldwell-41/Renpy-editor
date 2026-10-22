// Explicit packaged L01 verification. Synthetic DOM input uses production services.
(async () => {
  const stages = [], started = performance.now();
  let stage = "open", serial = 0, identity, awaitedControl = "recent project";
  const assert = (value, message) => { if (!value) throw Error(message); };
  const until = async (condition, control = awaitedControl) => {
    awaitedControl = control;
    const deadline = performance.now() + 30000;
    while (!condition()) { if (performance.now() > deadline) throw Error(`Timeout: ${stage}`); await new Promise(resolve => setTimeout(resolve, 30)); }
  };
  const call = async (operation, payload = {}) => window.__loomlightProbeRetryBusy(async () => {
    const result = await window.__TAURI_INTERNALS__.invoke("core_request", { request: { protocolVersion: 1, requestId: `owned-${++serial}`, operation, payload } });
    if (!result.ok) throw Object.assign(Error(`${operation}: ${result.error.code}`), { code: result.error.code });
    return result.value;
  });
  const find = window.__loomlightProbeFindButton;
  const click = async label => { await until(() => find(label) && !find(label).disabled, `button ${label}`); find(label).click(); };
  const checkpoint = name => { stage = name; stages.push({ stage, elapsedMs: Math.round(performance.now() - started) }); };
  const message = () => document.querySelector(".screen-message")?.textContent ?? "";
  try {
    await until(() => document.querySelector(".recent-open") && !document.querySelector(".recent-open").disabled); document.querySelector(".recent-open").click();
    await click("Screens"); await until(() => find("New blank screen"), "Choose creation action");
    let project = await call("project.current"), sessionId = project.sessionId;
    const before = await call("screens.list", { sessionId });
    await click("New blank screen"); await until(() => document.querySelector('[aria-label="Screen name"]'));
    const editName = value => { const input = document.querySelector('[aria-label="Screen name"]'); input.focus(); input.value = value; input.dispatchEvent(new Event("input", { bubbles: true })); return input; };
    editName("cancelled_screen"); await click("Cancel creation");
    assert(JSON.stringify(await call("screens.list", { sessionId })) === JSON.stringify(before), "Cancel writes nothing");
    checkpoint("cancel-passed");
    await click("New blank screen"); await until(() => document.querySelector('[aria-label="Screen name"]'));
    const input = editName("travel_notes"); input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await until(() => document.querySelector('.screens-editor select')?.selectedOptions[0]?.textContent.includes("travel_notes"));
    const catalog = await call("screens.list", { sessionId }); identity = catalog.owned[0];
    assert(identity.name === "travel_notes" && identity.resolved && identity.id !== identity.rootId, "Distinct persistent screen and root IDs required");
    assert(document.querySelector('.screen-tree [aria-selected="true"]')?.textContent === "Screen root", "Created root selected");
    checkpoint("creation-passed");
    await click("View in Source"); await until(() => document.querySelector(".source-editor"), "Source editor");
    const editor = window.__loomlightProbeEditor(document.querySelector(".source-editor")), accepted = editor.value;
    assert(accepted.endsWith("screen travel_notes():\n    pass\n"), "Ordinary blank source emitted");
    editor.focus();
    await until(() => editor.value.slice(editor.selectionStart, editor.selectionEnd) === "screen travel_notes():\n    pass\n", "Source declaration selection");
    assert(editor.value.slice(editor.selectionStart, editor.selectionEnd) === "screen travel_notes():\n    pass\n", "Exact declaration selected in Source");
    checkpoint("exact-source-passed");
    await click("Screens"); await click("Undo"); await until(() => message().includes("Unresolved owned screen travel_notes"));
    assert((await call("screens.list", { sessionId })).owned.length === 0, "One Undo removes creation and ownership");
    await click("Redo"); await until(() => document.querySelector('.screen-tree [aria-selected="true"]')?.textContent === "Screen root");
    assert(JSON.stringify((await call("screens.list", { sessionId })).owned[0]) === JSON.stringify(identity), "One Redo restores both IDs");
    checkpoint("history-passed");
    await click("Close Project"); await until(() => document.querySelector(".recent-open")); document.querySelector(".recent-open").click();
    await until(() => find("Screens")); project = await call("project.current"); assert(project.sessionId !== sessionId, "Reopen creates a fresh session"); sessionId = project.sessionId;
    await click("Screens"); await until(() => document.querySelector('.screen-tree [aria-selected="true"]'));
    assert(JSON.stringify((await call("screens.list", { sessionId })).owned[0]) === JSON.stringify(identity), "Reopen preserves ownership");
    assert((await call("source.open", { sessionId, path: identity.path })).text === accepted, "Reopen preserves exact source bytes");
    checkpoint("reopen-passed"); checkpoint("complete");
    await call("probe.runtimeUiReport", { scenario: "owned-screen", passed: true, stage, stages, identity, nativeWebView: true, sdkExecuted: false });
  } catch (error) {
    await call("probe.runtimeUiReport", { scenario: "owned-screen", passed: false, stage, stages, awaitedControl, error: String(error), nativeWebView: true, sdkExecuted: false });
  }
})();
