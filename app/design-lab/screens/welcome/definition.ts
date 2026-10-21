import type { LabScreen } from "../../contracts.ts";

export const definition: Omit<LabScreen, "approval"> = {
  id: "welcome", title: "Home", kind: "prototype",
  description: "Return desk and Project shelf compare resuming a story with starting a first project. All projects and operations are fictional.",
  states: [
    { id: "populated", title: "Recent projects" },
    { id: "empty", title: "First project" },
    { id: "long", title: "Many projects and long names" },
    { id: "error", title: "Recent list unavailable" },
    { id: "loading", title: "Loading recent projects" },
  ],
  variants: [
    { id: "desk", title: "Return desk", load: () => import("./desk.ts") },
    { id: "shelf", title: "Project shelf", load: () => import("./shelf.ts") },
  ],
  check: "./screens/welcome/check.mjs",
};
