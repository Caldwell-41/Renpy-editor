setTimeout(async () => {
  const invoke = window.__TAURI_INTERNALS__.invoke;
  const denied = await invoke("privileged_ping").then(() => false, () => true);
  document.title = denied ? "permission-denied" : "permission-allowed";
}, 100);
