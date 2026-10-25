import type { LabScreen } from "../../contracts.ts";

export const definition: Omit<LabScreen, "approval"> = {
  id: "help-composition", title: "Help composition · #37", kind: "prototype",
  description: "Three ways to add elements within Choose. Hierarchy selection, text drafts, order and history use fictional data in browser memory. Source, Ren'Py and persistence are simulated.",
  states: [{ id: "adding", title: "Adding text inside the vertical group" }, { id: "nested", title: "Nested Help with protected neighbor" }, { id: "conflict", title: "Source conflict with retained input" }],
  variants: [
    { id: "inline", title: "A · Inline composer", load: () => import("./inline.ts") },
    { id: "context", title: "B · Add at selection", load: () => import("./context.ts") },
    { id: "focused", title: "C · Focused composer", load: () => import("./focused.ts") },
  ],
};
