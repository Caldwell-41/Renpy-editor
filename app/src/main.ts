import "./styles.css";
import { requestCore } from "./bridge.ts";

interface HealthValue {
  readonly status: "ready";
  readonly protocolVersion: number;
}

const root = document.querySelector<HTMLDivElement>("#app");
if (root === null) {
  throw new Error("Application root is unavailable.");
}

root.innerHTML = `
  <main class="shell" aria-labelledby="app-title">
    <header class="titlebar">
      <div>
        <p class="eyebrow">Production scaffold</p>
        <h1 id="app-title">Loomlight</h1>
      </div>
      <span class="boundary-state" id="boundary-state" role="status" aria-live="polite">
        <span class="status-mark" aria-hidden="true"></span>
        Checking desktop boundary
      </span>
    </header>
    <section class="workspace" aria-labelledby="foundation-title">
      <div class="workspace-copy">
        <p class="section-label">Phase 1A</p>
        <h2 id="foundation-title">A quiet foundation for story work.</h2>
        <p class="summary">
          The production shell is connected through one narrow, versioned command boundary.
          Authoring features remain deliberately unavailable at this checkpoint.
        </p>
      </div>
      <dl class="facts" aria-label="Scaffold status">
        <div><dt>Runtime</dt><dd>Tauri 2</dd></div>
        <div><dt>Protocol</dt><dd id="protocol-value">Version 1</dd></div>
        <div><dt>Authority</dt><dd>Main window only</dd></div>
      </dl>
      <button class="quiet-action" id="recheck" type="button">Recheck boundary</button>
    </section>
    <footer>
      <code>Source tools and project operations are not implemented in Phase 1A.</code>
    </footer>
  </main>
`;

const state = document.querySelector<HTMLElement>("#boundary-state");
const protocol = document.querySelector<HTMLElement>("#protocol-value");
const recheck = document.querySelector<HTMLButtonElement>("#recheck");

async function checkBoundary(): Promise<void> {
  if (state === null) return;
  state.dataset.status = "checking";
  state.lastChild!.textContent = " Checking desktop boundary";
  const response = await requestCore<HealthValue>("system.health");
  if (response.ok) {
    state.dataset.status = "success";
    state.lastChild!.textContent = " Desktop boundary ready";
    if (protocol !== null) protocol.textContent = `Version ${response.value.protocolVersion}`;
  } else {
    state.dataset.status = "error";
    state.lastChild!.textContent = ` ${response.error.message}`;
  }
}

recheck?.addEventListener("click", () => void checkBoundary());
void checkBoundary().catch(() => {
  if (state !== null) {
    state.dataset.status = "error";
    state.lastChild!.textContent = " Desktop boundary unavailable";
  }
});
