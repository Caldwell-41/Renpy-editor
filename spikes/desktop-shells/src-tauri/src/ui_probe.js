setTimeout(async () => {
  for (let attempt = 0; attempt < 100 && !window.__loomlightRunUiEvidence; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  const results = window.__loomlightRunUiEvidence
    ? await window.__loomlightRunUiEvidence(window.__loomlightUiProbeMode)
    : { mode: window.__loomlightUiProbeMode, passed: false, error: "UI probe unavailable" };
  await window.__TAURI_INTERNALS__.invoke("desktop_operation", { request: { operation: "uiProbeResult", uiResults: results } });
}, 500);
