setTimeout(async () => {
  const denied = await window.__TAURI_INTERNALS__.invoke("core_request", {
    request: {
      protocolVersion: 1,
      requestId: "unauthorised-probe",
      operation: "system.health",
      payload: {},
    },
  }).then(() => false, () => true);
  location.href = denied
    ? "https://permission-denied.invalid/loomlight-capability-probe"
    : "https://permission-allowed.invalid/loomlight-capability-probe";
}, 100);
