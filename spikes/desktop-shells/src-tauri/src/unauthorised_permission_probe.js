setTimeout(async () => {
  const invoke = window.__TAURI_INTERNALS__.invoke;
  const denied = await invoke("privileged_ping").then(() => false, () => true);
  const signal = new URL(location.href);
  signal.search = denied ? "?permission-denied=1" : "?permission-allowed=1";
  location.href = signal.href;
}, 100);
