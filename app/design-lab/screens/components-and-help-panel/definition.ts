import type { LabScreen } from "../../contracts.ts";

export const definition: Omit<LabScreen, "approval"> = {
  id: "components-and-help-panel", title: "Components and Help panel · #41 / #44", kind: "prototype",
  description: "A2 refines the inspector workflow and keeps the original alternatives. Source, history, reference changes and play stay in browser memory. No project or Ren'Py execution.",
  states: [
    { id: "group", title: "Start with a supported group" },
    { id: "shared", title: "Component in two screens" },
    { id: "starter", title: "Create a Help panel" },
    { id: "no-images", title: "Help starter · no typed UI images" },
    { id: "story", title: "Show / Hide in Story" },
    { id: "conflict", title: "Retained conflicting draft" },
    { id: "missing", title: "Missing component reference" },
    { id: "copy-refresh-failure", title: "Copy created · reload required" },
  ],
  variants: [
    { id: "refined", title: "A2 · Focused workflow", load: () => import("./refined.ts") },
    { id: "inspector", title: "A · Inspector and review dialog", load: () => import("./inspector.ts") },
    { id: "library", title: "B · Component library", load: () => import("./library.ts") },
    { id: "worksheet", title: "C · Review below the preview", load: () => import("./worksheet.ts") },
  ],
};
