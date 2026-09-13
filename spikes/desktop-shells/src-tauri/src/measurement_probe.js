setTimeout(async () => {
  const invoke = (stage, results) => window.__TAURI_INTERNALS__.invoke("desktop_operation", {
    request: { operation: "measurementProbeResult", measurementStage: stage, measurementResults: results },
  });
  await invoke("ready");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await invoke("idle");
  await new Promise((resolve) => setTimeout(resolve, 500));
  await invoke("stress-start");
  for (let attempt = 0; attempt < 100 && !window.__loomlightRunGraphEvidence; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  const results = window.__loomlightRunGraphEvidence
    ? await window.__loomlightRunGraphEvidence()
    : { passed: false, error: "graph probe unavailable" };
  await invoke("complete", results);
}, 0);
