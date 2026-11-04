import type { LabScreen } from "../../contracts.ts";

export const definition: Omit<LabScreen, "approval"> = {
  id: "help-dialog-story", title: "Help dialog and Story Call · #45", kind: "prototype",
  description: "Three draft workflows. Creation, editing, Story and playback use fictional data in memory. Browser playback does not qualify Ren'Py behavior.",
  states: [
    { id: "start", title: "Start the Help workflow" },
    { id: "create", title: "New Help screen" },
    { id: "panel", title: "Existing Help panel" },
    { id: "design", title: "Edit Help dialog" },
    { id: "story", title: "Call from Story" },
    { id: "no-images", title: "No UI image available" },
    { id: "invalid", title: "Invalid dismissal · draft retained" },
    { id: "unknown", title: "Unknown active interaction" },
    { id: "missing", title: "Missing owned dialog" },
  ],
  variants: [
    { id: "inspector-v4", title: "Help A4 · Inspector extension", load: () => import("./inspector.ts") },
    { id: "steps-v4", title: "Help B4 · Guided setup", load: () => import("./steps.ts") },
    { id: "story-split-v4", title: "Help C4 · Story first", load: () => import("./story-split.ts") },
  ],
};
