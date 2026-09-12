setTimeout(async () => {
  const invoke = window.__TAURI_INTERNALS__.invoke;
  const results = {
    nodeGlobalsDenied: typeof process === "undefined" && typeof require === "undefined",
    unknownIpcDenied: await invoke("desktop_operation", { request: { operation: "shell" } }).then(() => false, () => true),
    traversalDenied: await invoke("desktop_operation", { request: { operation: "readText", root: "/", relativePath: "../secret" } }).then(() => false, () => true),
    networkDenied: await fetch("https://example.invalid/loomlight-probe").then(() => false, () => true),
    popupDenied: window.open("https://example.invalid/loomlight-popup") === null,
  };
  await invoke("desktop_operation", { request: { operation: "securityProbeResult", securityResults: results } });
}, 500);
