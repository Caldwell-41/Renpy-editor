setTimeout(async () => {
  for (let attempt = 0; attempt < 100 && !window.__loomlightRunGraphEvidence; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  const results = window.__loomlightRunGraphEvidence
    ? await window.__loomlightRunGraphEvidence()
    : { passed: false, error: "graph probe unavailable" };
  await window.__TAURI_INTERNALS__.invoke("desktop_operation", { request: { operation: "graphProbeResult", graphResults: results } });
}, 500);
