import type { LabScreen } from "../../contracts.ts";

export const definition: Omit<LabScreen, "approval"> = {
  id: "numeric-layout", title: "Numeric layout · #38", kind: "prototype",
  description: "Three numeric inspector proposals beside the existing Help composition. Units, alignment shortcuts, validation, Apply/Cancel and history use browser memory. Geometry is schematic; no source files or SDK are used.",
  states: [
    { id: "anchored", title: "Anchored frame" },
    { id: "constrained", title: "Text inside a vertical group" },
    { id: "spacing", title: "Vertical group spacing" },
    { id: "conflict", title: "Source conflict" },
  ],
  variants: [
    { id: "paired", title: "A · Paired sections", load: () => import("./paired.ts") },
    { id: "axes", title: "B · Axis worksheet", load: () => import("./axes.ts") },
    { id: "placement", title: "C · Placement first", load: () => import("./placement.ts") },
  ],
};
