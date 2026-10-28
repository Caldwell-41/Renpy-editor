import type { LabScreen } from "../../contracts.ts";

export const definition: Omit<LabScreen, "approval"> = {
  id: "numeric-layout", title: "Numeric layout · #38", kind: "prototype",
  description: "Three refined numeric inspectors and the original proposals beside the existing Help composition. Units, alignment shortcuts, validation, Apply/Cancel and history use browser memory. Geometry is schematic; no source files or SDK are used.",
  states: [
    { id: "anchored", title: "Anchored frame" },
    { id: "constrained", title: "Text inside a vertical group" },
    { id: "spacing", title: "Vertical group spacing" },
    { id: "conflict", title: "Source conflict" },
  ],
  check: "./screens/numeric-layout/check.mjs",
  variants: [
    { id: "paired-refined", title: "A2 · Paired fields", load: () => import("./paired-refined.ts") },
    { id: "axes-refined", title: "B2 · Axis columns", load: () => import("./axes-refined.ts") },
    { id: "placement-refined", title: "C2 · Alignment first", load: () => import("./placement-refined.ts") },
    { id: "paired", title: "A · Paired sections", load: () => import("./paired.ts") },
    { id: "axes", title: "B · Axis worksheet", load: () => import("./axes.ts") },
    { id: "placement", title: "C · Placement first", load: () => import("./placement.ts") },
  ],
};
