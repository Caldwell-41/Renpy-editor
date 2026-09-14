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
  const rendererSecretsAbsent =
    !Object.keys(window).some((key) => /loomlight.*(?:credential|secret|token)|(?:credential|secret).*loomlight/i.test(key)) &&
    localStorage.length === 0 &&
    sessionStorage.length === 0 &&
    !document.documentElement.textContent.includes("sentinel");
  const buttons = [...document.querySelectorAll("button")];
  const newProject = buttons.find((button) => button.textContent === "New Project");
  const openProject = buttons.find((button) => button.textContent === "Open Loomlight Project");
  const welcomeLifecycleVisible = Boolean(newProject && openProject);
  newProject?.click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  const pageText = document.body.textContent ?? "";
  const newProjectWizardVisible =
    pageText.includes("Project details") &&
    pageText.includes("Ren'Py SDK") &&
    pageText.includes("Game configuration") &&
    pageText.includes("Review & Create");
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
        welcomeLifecycleVisible,
        newProjectWizardVisible,
        unauthorisedWindowDenied: known && window.__loomlightUnauthorisedDenied === true,
        unknownCommandDenied,
      },
    },
  }).then((value) => {
    if (value?.ok !== true) throw new Error("Smoke report was rejected.");
  });
}, 100);
