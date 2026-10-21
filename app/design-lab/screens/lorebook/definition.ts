import type { LabScreen } from "../../contracts.ts";

export const definition: Omit<LabScreen, "approval"> = {
  id: "lorebook",
  title: "Lorebook",
  kind: "prototype",
  description: "One project-wide world and tone document, compared as a continuous manuscript and a parallel writing desk. All saves and request previews stay in browser memory.",
  states: [
    { id: "populated", title: "World and tone notes" },
    { id: "empty", title: "Blank project reference" },
    { id: "long", title: "Long project notes" },
    { id: "error", title: "Simulated save refusal" },
  ],
  variants: [
    { id: "manuscript", title: "Project manuscript", load: () => import("./manuscript.ts") },
    { id: "parallel", title: "World & tone desk", load: () => import("./parallel.ts") },
  ],
  check: "./screens/lorebook/check.mjs",
};
