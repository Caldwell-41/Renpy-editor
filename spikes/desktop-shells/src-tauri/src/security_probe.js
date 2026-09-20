setTimeout(async () => {
  const invoke = window.__TAURI_INTERNALS__.invoke;
  const projectId = window.__loomlightSecurityProjectId;
  const relativePath = window.__loomlightSecurityRelativePath;
  const results = {
    nodeGlobalsDenied: typeof process === "undefined" && typeof require === "undefined",
    knownCommandAllowed: await invoke("privileged_ping").then((value) => value?.pong === true, () => false),
    approvedAccess: await invoke("desktop_operation", { request: { operation: "readText", projectId, relativePath } }).then((value) => value?.contents?.includes("label start") === true, () => false),
    unknownIpcDenied: await invoke("desktop_operation", { request: { operation: "shell" } }).then(() => false, () => true),
    traversalDenied: await invoke("desktop_operation", { request: { operation: "readText", projectId, relativePath: "../secret" } }).then(() => false, () => true),
    forgedProjectDenied: await invoke("desktop_operation", { request: { operation: "readText", projectId: "project-forged", relativePath } }).then(() => false, () => true),
    rendererRootDenied: await invoke("desktop_operation", { request: { operation: "readText", root: "/", relativePath } }).then(() => false, () => true),
    symlinkDenied: await invoke("desktop_operation", { request: { operation: "readText", projectId, relativePath: "game/escape-link.rpy" } }).then(() => false, () => true),
    networkDenied: await fetch("https://example.invalid/loomlight-probe").then(() => false, () => true),
    popupDenied: window.open("https://example.invalid/loomlight-popup") === null,
  };
  await invoke("desktop_operation", { request: { operation: "securityProbeResult", securityResults: results } });
}, 1000);
