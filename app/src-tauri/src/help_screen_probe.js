// Explicit packaged probe. Synthetic DOM input reaches production IPC and the real SDK.
(async () => {
  const stages = [], terminals = [];
  let stage = "open", serial = 0, previewLaunches = 0, latest, stopRequested = false;
  const targetOs = window.__loomlightHelpTargetOs;
  const started = performance.now(), delay = ms => new Promise(r => setTimeout(r, ms));
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  const until = async (condition, timeout = 30000) => {
    const deadline = performance.now() + timeout;
    while (!condition()) { if (performance.now() > deadline) throw Error(`Timeout: ${stage}`); await delay(30); }
  };
  window.__loomlightHelpEvidence = true;
  window.addEventListener("loomlight-help-probe-response", event => {
    const response = event.detail.response;
    if (response?.ok) {
      const value = response.value?.response?.value ?? response.value;
      if (value?.operationId && value?.phase) latest = value;
    }
  });
  const call = async (operation, payload = {}) => {
    const response = await window.__TAURI_INTERNALS__.invoke("core_request", { request: { protocolVersion: 1, requestId: `help-${++serial}`, operation, payload } });
    if (!response.ok) throw Object.assign(Error(`${operation}: ${response.error.code}`), { code: response.error.code });
    return response.value;
  };
  const read = (operation, payload) => window.__loomlightProbeRetryBusy(() => call(operation, payload));
  const find = window.__loomlightProbeFindButton;
  const click = async label => { await until(() => find(label) && !find(label).disabled && find(label).ariaDisabled !== "true"); find(label).click(); await delay(30); };
  const checkpoint = name => { stage = name; stages.push({ stage, elapsedMs: Math.round(performance.now() - started) }); };
  const message = () => document.querySelector(".screen-message")?.textContent ?? "";
  const width = () => document.querySelector('.screens-editor input[aria-label="Width"]');
  const edit = value => { const input = width(); input.focus(); input.value = String(value); input.dispatchEvent(new Event("input", { bubbles: true })); return input; };
  const trust = async () => {
    await until(() => find("Trust for this session and continue") || latest?.operationId, 120000);
    if (find("Trust for this session and continue")) {
      assert(document.activeElement?.textContent === "Cancel", "Trust defaults to Cancel");
      await click("Trust for this session and continue");
    }
  };
  let sessionId;
  const terminal = async kind => {
    const status = await read("runtime.status", { sessionId, operationId: latest.operationId, afterSequence: 0 });
    const report = await read("runtime.diagnostics", { sessionId, operationId: latest.operationId });
    terminals.push({ kind, status, diagnostics: report.diagnostics, stopRequested: kind === "run" && stopRequested });
    assert(status.cleanupComplete === true && status.outputTruncated === false && typeof status.output === "string", "Complete untruncated runtime evidence required");
    // STATUS_CONTROL_C_EXIT (0xC000013A) is the default Windows console-control exit.
    const expectedStop = stopRequested && status.phase === "cancelled" && (status.exitCode === 0
      || targetOs !== "windows" && status.exitCode === null
      || targetOs === "windows" && status.exitCode === -1073741510);
    assert(kind === "validate" ? status.phase === "exited" && status.exitCode === 0 : expectedStop,
      `Unexpected ${kind} result: ${targetOs}, ${status.phase}, exit ${status.exitCode}, Stop requested ${stopRequested}`);
    assert(!/Traceback \(most recent call last\):|While running game code:|Error:|Exception:/.test(status.output), "Runtime output contains an exception");
    assert(Array.isArray(report.diagnostics) && report.diagnostics.every(d => d.severity !== "error"), "Runtime diagnostics contain an error");
    return status;
  };
  try {
    assert(["windows", "macos"].includes(targetOs), "Native target OS is required");
    await until(() => document.querySelector(".recent-open")); document.querySelector(".recent-open").click();
    await until(() => find("Screens")); await click("Screens");
    await until(() => document.querySelector('.screen-tree [role="option"]'));
    const project = await read("project.current"); sessionId = project.sessionId;
    assert(JSON.parse(document.querySelector('.screens-editor select[aria-label="Screen"]').value)[1] === "loomlight_help", "Style-only file must not become the initial selection");
    assert(!latest, "Opening the project must not start the SDK");
    const before = await read("source.open", { sessionId, path: "game/ui/help.rpy" });
    const row = [...document.querySelectorAll('.screen-tree [role="option"]')].find(b => b.textContent === "Help frame");
    row.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })); await until(width);
    checkpoint("screen-inventory-passed");
    const invalid = edit("invalid width");
    assert(invalid.getAttribute("aria-invalid") !== "true", "Incomplete typing does not show a new numeric error");
    find("Apply layout").focus();
    assert(invalid.getAttribute("aria-invalid") === "true", "Completing an invalid numeric field shows its error");
    const fieldError = document.getElementById(invalid.getAttribute("aria-describedby"));
    assert(fieldError && invalid.closest("label").contains(fieldError) && fieldError.textContent === "Width needs a finite number. Input retained.", "The numeric field has an adjacent accessible explanation");
    assert(document.activeElement === find("Apply layout"), "Blur validation does not move focus back to the invalid field");
    assert((await read("source.open", { sessionId, path: "game/ui/help.rpy" })).text === before.text, "Blur validation never writes Source");
    const input = edit(760);
    input.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 229, isComposing: true, bubbles: true }));
    await until(() => !width().readOnly);
    assert((await read("source.open", { sessionId, path: "game/ui/help.rpy" })).text === before.text, "Confirming an IME candidate does not apply numeric drafts");
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", isComposing: true, bubbles: true }));
    assert(width().value === "760", "IME Escape does not cancel the numeric draft");
    input.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await until(() => message().startsWith("Layout saved"));
    assert(document.activeElement === width(), "Enter Apply preserves focus in the numeric field");
    const accepted = await read("source.open", { sessionId, path: "game/ui/help.rpy" });
    assert(accepted.text === before.text.replace("xsize 640", "xsize 760"), "Apply patches only the accepted dimension token");
    await click("Undo"); await until(() => width()?.value === "640");
    await click("Redo"); await until(() => width()?.value === "760");
    edit(0); await click("Apply layout"); await until(() => message().startsWith("Width needs a whole number of pixels"));
    await click("Cancel layout"); assert(width().value === "760", "Cancel restores the accepted value");
    checkpoint("source-roundtrip-passed");
    stage = "validate"; latest = undefined; await click("Validate screen"); await trust();
    await until(() => latest?.cleanupComplete, 120000); await terminal("validate"); checkpoint("validation-passed");
    stage = "preview"; latest = undefined; previewLaunches++; await click("Test in Ren'Py"); await trust();
    await until(() => {
      if (latest?.cleanupComplete) throw Error("Preview exited before geometry observation");
      return document.querySelector(".runtime-output")?.textContent.includes("HELP_SCRATCH_GEOMETRY ");
    }, 60000);
    const output = document.querySelector(".runtime-output").textContent;
    const geometry = JSON.parse(output.split("\n").find(line => line.startsWith("HELP_SCRATCH_GEOMETRY ")).slice("HELP_SCRATCH_GEOMETRY ".length));
    assert(JSON.stringify(geometry.size) === "[760,360]" && JSON.stringify(geometry.aspect) === "[1280,720]" && geometry.menu === false, "SDK measured the renderer-accepted Help frame in game context");
    checkpoint("preview-geometry-passed");
    edit(768); find("Apply layout").focus(); await click("Apply layout"); await until(() => message().startsWith("Layout saved"));
    assert(document.activeElement === find("Apply layout"), "Clicked Apply preserves button focus after the accepted edit");
    await until(() => document.querySelector(".runtime-revision")?.textContent.includes("Started from an earlier revision"));
    const running = await read("runtime.status", { sessionId, operationId: latest.operationId, afterSequence: 0 });
    assert(running.earlierRevision && !running.cleanupComplete, "Preview retains its frozen accepted revision");
    stopRequested = true; await click("Stop"); await until(() => latest?.cleanupComplete); await terminal("run"); checkpoint("stale-stop-passed");
    await click("Close Project"); await until(() => document.querySelector(".recent-open")); document.querySelector(".recent-open").click();
    await until(() => find("Screens")); const reopened = await read("project.current");
    assert(reopened.sessionId !== sessionId, "Reopen creates a new session"); sessionId = reopened.sessionId;
    const saved = await read("source.open", { sessionId, path: "game/ui/help.rpy" });
    assert(saved.text === before.text.replace("xsize 640", "xsize 768") && !saved.dirty, "Only accepted bytes survive reopen");
    await click("Screens"); await until(() => document.querySelector(".screen-tree button"));
    assert(document.documentElement.scrollWidth <= innerWidth + 2, "No page overflow");
    checkpoint("disk-reopen-passed"); checkpoint("complete");
    await call("probe.runtimeUiReport", { passed: true, scenario: "help-screen", targetOs, stage, stages, terminals, geometry, previewLaunches, nativeWebView: true, nativeKeyboard: false });
  } catch (error) {
    await call("probe.runtimeUiReport", { passed: false, scenario: "help-screen", targetOs, stage, stages, terminals, previewLaunches, error: String(error), message: message(), body: document.body.innerText.slice(-5000) });
  }
})();
