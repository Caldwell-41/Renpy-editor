import type { LabScreen } from "../../contracts.ts";

export const definition: Omit<LabScreen, "approval"> = {
  id: "help-composition", title: "Help composition · #37", kind: "prototype",
  description: "A complete add, select, edit, reorder and remove workflow, with earlier composition drafts for comparison. Hierarchy selection, text drafts, order and history use fictional data in browser memory. Source, Ren'Py and persistence are simulated.",
  states: [{ id: "nested", title: "Nested Help with protected neighbor" }, { id: "adding", title: "Adding text inside the vertical group" }, { id: "conflict", title: "Source conflict with retained input" }],
  check: "./screens/help-composition/check.mjs",
  variants: [
    { id: "workflow-popup", title: "C5 · Confirm every removal", load: () => import("./workflow-popup.ts") },
    { id: "workflow-removal", title: "C4 · Workflow with removal", load: () => import("./workflow-removal.ts") },
    { id: "workflow", title: "C3 · Complete workflow", load: () => import("./workflow.ts") },
    { id: "inline", title: "A · Inline composer", load: () => import("./inline.ts") },
    { id: "context", title: "B · Add at selection", load: () => import("./context.ts") },
    { id: "focused-refined", title: "C2 · Focused refinement", load: () => import("./refined.ts") },
    { id: "focused", title: "C · Focused composer", load: () => import("./focused.ts") },
  ],
};
