setTimeout(async () => {
  const invoke = window.__TAURI_INTERNALS__.invoke;
  const denied = await invoke("privileged_ping").then(() => false, () => true);
  location.href = denied
    ? "tauri://localhost/index.html?permission-denied=1"
    : "tauri://localhost/index.html?permission-allowed=1";
}, 100);
