import type { LabScreen } from "../../contracts.ts";
export const definition: Omit<LabScreen, "approval"> = {
  id: "project-font", title: "Project fonts · #39", kind: "prototype",
  description: "Refined A2 plus three original font workflows inside Screens. Text, typed font selection/import, drafts, source, history and reopen use fictional browser memory. Browser font families stand in for project fonts; no URLs, real files or SDK calls.",
  states: [
    { id: "text", title: "Help text" }, { id: "missing", title: "Missing font" },
    { id: "invalid", title: "Invalid font" }, { id: "expression", title: "Unsupported expressions" },
    { id: "conflict", title: "Source conflict" }, { id: "long", title: "Long text" },
  ],
  variants: [
    { id: "refined", title: "A2 · Text inspector", load: () => import("./refined.ts") },
    { id: "inspector", title: "A · Inspector & chooser", load: () => import("./inspector.ts") },
    { id: "library", title: "B · Inline font browser", load: () => import("./library.ts") },
    { id: "strip", title: "C · Formatting strip", load: () => import("./strip.ts") },
  ],
  check: "./screens/project-font/check.mjs",
};
