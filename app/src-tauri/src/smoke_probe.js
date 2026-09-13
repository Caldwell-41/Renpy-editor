setTimeout(async () => {
  const invoke = window.__TAURI_INTERNALS__.invoke;
  const known = await invoke("core_request", {
    request: { protocolVersion: 1, requestId: "smoke-health", operation: "system.health", payload: {} },
  }).then((value) => value?.ok === true && value?.value?.status === "ready", () => false);
  const malformedPayloadDenied = await invoke("core_request", {
    request: { protocolVersion: 1, requestId: "smoke-malformed", operation: "system.health", payload: { extra: true } },
  }).then((value) => value?.ok === false && value?.error?.code === "INVALID_PAYLOAD", () => false);
  const unknownCommandDenied = await invoke("unlisted_command", {}).then(() => false, () => true);
  const ambientFilesystemDenied = await invoke("plugin:fs|read_text_file", { path: "/synthetic-denied" }).then(() => false, () => true);
  const ambientProcessDenied = await invoke("plugin:shell|execute", { program: "synthetic-denied" }).then(() => false, () => true);
  const ambientHttpDenied = await invoke("plugin:http|fetch", { url: "https://example.invalid" }).then(() => false, () => true);
  const networkDenied = await fetch("https://example.invalid/loomlight-probe").then(() => false, () => true);
  window.open("https://example.invalid/loomlight-popup");
  const popupRequestIssued = true;
  const nodeGlobalsDenied = typeof process === "undefined" && typeof require === "undefined";
  const rendererSecretsAbsent = !Object.keys(window).some((key) => /api.?key|credential|secret|token/i.test(key));
  await invoke("core_request", {
    request: {
      protocolVersion: 1,
      requestId: "smoke-report",
      operation: "probe.smokeReport",
      payload: {
        ambientFilesystemDenied,
        ambientHttpDenied,
        ambientProcessDenied,
        malformedPayloadDenied,
        networkDenied,
        nodeGlobalsDenied,
        popupRequestIssued,
        rendererSecretsAbsent,
        unauthorisedWindowDenied: known && window.__loomlightUnauthorisedDenied === true,
        unknownCommandDenied,
      },
    },
  }).then((value) => {
    if (value?.ok !== true) throw new Error("Smoke report was rejected.");
  });
}, 100);
