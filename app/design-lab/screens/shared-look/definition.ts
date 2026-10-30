import type { LabScreen } from "../../contracts.ts";

export const definition: Omit<LabScreen, "approval"> = {
  id: "shared-look", title: "Shared looks · #43", kind: "prototype",
  description: "A3 mounts the existing production screen editor with a proposed Look row and fictional in-memory services. Earlier A2 and original drafts remain available. No project writes or SDK execution.",
  states: [
    { id: "shared", title: "Two shared uses" },
    { id: "local", title: "Share with another screen" },
    { id: "stale", title: "Changed use" },
    { id: "missing", title: "Missing use" },
    { id: "expression", title: "Dynamic style · Source only" },
  ],
  variants: [
    { id: "editor", title: "A3 · Look inside the existing editor", load: () => import("./editor.ts") },
    { id: "refined", title: "A2 · See where your look changes", load: () => import("./refined.ts") },
    { id: "inspector", title: "A · Inspector & review dialog", load: () => import("./inspector.ts") },
    { id: "library", title: "B · Style library & two previews", load: () => import("./library.ts") },
    { id: "inline", title: "C · Inline review worksheet", load: () => import("./inline.ts") },
  ],
  check: "./screens/shared-look/check.mjs",
};
