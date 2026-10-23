// Synthetic focused WebView control. Production service lifecycle and app-close command.
(async () => {
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  let serial = 0;
  const call = async (stage, action, extra = {}) => {
    const response = await window.__TAURI_INTERNALS__.invoke("core_request", {request: {
      protocolVersion: 1, requestId: `lifecycle-${++serial}`, operation: "probe.canvasLifecycle",
      payload: {stage, action, ...extra}
    }});
    if (!response.ok) throw Error(response.error?.code || "Lifecycle command failed");
    return response.value;
  };
  const until = async predicate => {
    const deadline = performance.now() + 60000;
    while (!(await predicate())) { if (performance.now() > deadline) throw Error("Lifecycle wait timed out"); await delay(20); }
  };
  try {
    await until(() => document.querySelector('.recent-open'));
    const input = document.createElement("input");
    input.setAttribute("aria-label", "Native lifecycle focus check");
    input.value = "Canvas lifecycle qualification";
    input.style.cssText = "position:fixed;top:12px;left:12px;z-index:99999;width:320px";
    document.body.append(input); input.focus();
    const stages = window.__loomlightLifecyclePhase === 1 ? ["refusal", "restart-change", "quit"] : ["app-restart"];
    for (const stage of stages) {
      if (stage === "quit" || stage === "app-restart") {
        // Load the current project through the real UI so its ordinary quit flow owns cleanup.
        const oldRecent = document.querySelector('.recent-open');
        document.querySelector('.brand').click();
        await until(() => !oldRecent.isConnected && document.querySelector('.recent-open'));
        document.querySelector('.recent-open').click();
        await until(() => document.querySelector('.close-project') && document.querySelector('.story-tree .tree-scene-row.selected'));
        input.focus();
      }
      await call(stage, "observe");
      await until(async () => (await call(stage, "observer")).ready);
      await call(stage, "render");
      await until(async () => {
        const value = await call(stage, "status");
        if (stage === "refusal") return value.phase === "unavailable";
        if (value.phase === "unavailable") throw Error("Canvas helper unavailable");
        return value.phase === "ready";
      });
      await until(async () => (await call(stage, "observer")).observed);
      await call(stage, "transition", {domFocusRetained: document.activeElement === input});
      if (document.activeElement !== input) throw Error("Editor focus lost during transition");
    }
    if (typeof window.__loomlightRequestApplicationClose !== "function") throw Error("Application close flow unavailable");
    const invoke = window.__TAURI_INTERNALS__.invoke.bind(window.__TAURI_INTERNALS__);
    window.__TAURI_INTERNALS__.invoke = (command, args) => {
      if (command === "complete_application_close" && document.activeElement !== input) {
        return Promise.reject(Error("Editor focus lost during application close"));
      }
      return invoke(command, args);
    };
    await window.__loomlightRequestApplicationClose();
  } catch (error) {
    // No retry: the external runner retains the failure and enforces its timeout.
    console.error("Canvas lifecycle qualification failed", String(error));
    document.body.dataset.canvasLifecycleError = String(error);
  }
})();
