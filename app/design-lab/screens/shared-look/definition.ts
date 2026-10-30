import type { LabScreen } from "../../contracts.ts";

export const definition: Omit<LabScreen, "approval"> = {
  id: "shared-look", title: "Shared looks · #43", kind: "prototype",
  description: "Three draft shared-style workflows. Source, revisions, history, reopen and rendering are fictional browser simulations. No project writes or SDK execution.",
  states: [
    { id: "shared", title: "Two shared uses" },
    { id: "local", title: "Share with another screen" },
    { id: "stale", title: "Changed use" },
    { id: "missing", title: "Missing use" },
    { id: "expression", title: "Dynamic style · Source only" },
  ],
  variants: [
    { id: "inspector", title: "A · Inspector & review dialog", load: () => import("./inspector.ts") },
    { id: "library", title: "B · Style library & two previews", load: () => import("./library.ts") },
    { id: "inline", title: "C · Inline review worksheet", load: () => import("./inline.ts") },
  ],
  check: "./screens/shared-look/check.mjs",
};
