setTimeout(async () => {
  const denied = await window.__TAURI_INTERNALS__.invoke("core_request", {
    request: {
      protocolVersion: 1,
      requestId: "unauthorised-probe",
      operation: "system.health",
      payload: {},
    },
  }).then(() => false, () => true);
  const signal = new URL(location.href);
  signal.search = denied ? "?permission-denied=1" : "?permission-allowed=1";
  location.href = signal.href;
}, 100);
