import type { LabScreen } from "../../contracts.ts";
export const definition: Omit<LabScreen, "approval"> = {
  id: "nested-layout", title: "Nested layout · #42", kind: "prototype",
  description: "Refined A2 and the three original proposals for nested containers, grid order and viewport clipping. Fictional source and drafts stay in memory. Canvas geometry and source transactions are simulated.",
  states: [{ id: "nested", title: "Nested Help layout" }, { id: "constrained", title: "Parent-controlled placement" }, { id: "source-only", title: "Source-only expression" }, { id: "conflict", title: "Source conflict" }],
  variants: [
    { id: "focused-refined", title: "A2 · Focused editor", load: () => import("./refined.ts") },
    { id: "focused", title: "A · Focused inspector", load: () => import("./focused.ts") },
    { id: "worksheet", title: "B · Hierarchy worksheet", load: () => import("./worksheet.ts") },
    { id: "source-led", title: "C · Source split", load: () => import("./source-led.ts") },
  ],
  check: "./screens/nested-layout/check.mjs",
};
