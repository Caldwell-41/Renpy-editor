import "../src/styles.css";
import "../src/ui-refresh.css";
import "./preview.css";
import { selection } from "./registry.ts";
import { referenceStatus, revisionFor } from "./approval.ts";

const host = document.querySelector<HTMLElement>("#preview")!;
try {
  if (import.meta.env.LOOMLIGHT_DESIGN_LAB !== true) throw new Error("Start this preview with npm run design:dev from app/.");
  const { screen, variant, state, theme, viewport } = selection(location.search);
  const revision = revisionFor(screen.approval, variant.id);
  if (revision.approval && !screen.approval.sourceMatches[revision.id]) {
    throw new Error(`Approved source has changed. Open recorded commit ${revision.approval.source.commit} in a separate comparison checkout. Keep this approval intact while editing a draft.`);
  }
  host.dataset.approval = referenceStatus(screen.approval, revision, { state: state.id, theme, ...viewport });
  document.title = `${screen.title} · ${host.dataset.approval}`;
  // Production renderers that remember layout get read-only, memory-only preferences.
  const { loadPreferences } = await import("../src/preferences.ts");
  await loadPreferences();
  host.dataset.screen = screen.id;
  host.dataset.variant = variant.id;
  host.dataset.state = state.id;
  const { mount } = await variant.load();
  const dispose = await mount(host, { state: state.id, theme });
  if (dispose) window.addEventListener("pagehide", dispose, { once: true });
  host.dataset.ready = "true";
} catch (error) {
  host.dataset.error = "true";
  host.textContent = error instanceof Error ? error.message : "The sample preview could not be opened.";
}
