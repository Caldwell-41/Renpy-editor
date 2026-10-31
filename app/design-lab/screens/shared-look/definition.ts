import type { LabScreen } from "../../contracts.ts";

export const definition: Omit<LabScreen, "approval"> = {
  id: "shared-look", title: "Shared looks · #43", kind: "prototype",
  description: "A4 adds explicit shared-style scope and a scalable affected-screen review inside the existing editor, with fictional in-memory services. Earlier A2 and original drafts remain available. No project writes or SDK execution.",
  states: [
    { id: "shared", title: "Two shared uses" },
    { id: "many", title: "8 screens · 14 shared elements" },
    { id: "local", title: "Share with another screen" },
    { id: "stale", title: "Changed use" },
    { id: "missing", title: "Missing use" },
    { id: "expression", title: "Dynamic style · Source only" },
  ],
  variants: [
    { id: "shared-style", title: "A4 · Shared styles across screens", load: () => import("./editor.ts") },
    { id: "refined", title: "A2 · See where your look changes", load: () => import("./refined.ts") },
    { id: "inspector", title: "A · Inspector & review dialog", load: () => import("./inspector.ts") },
    { id: "library", title: "B · Style library & two previews", load: () => import("./library.ts") },
    { id: "inline", title: "C · Inline review worksheet", load: () => import("./inline.ts") },
  ],
  check: "./screens/shared-look/check.mjs",
};
