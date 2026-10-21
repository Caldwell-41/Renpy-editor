import type { LabScreen } from "../../contracts.ts";

export const definition: Omit<LabScreen, "approval"> = {
  id: "new-project", title: "New project", kind: "prototype",
  description: "A paced wizard and a setup sheet share one fictional project-creation workflow. All folders, SDK operations and creation results stay in browser memory.",
  states: [
    { id: "populated", title: "Project details" },
    { id: "empty", title: "Start without an SDK" },
    { id: "long", title: "Long title and destination" },
    { id: "review", title: "Ready to review" },
    { id: "error", title: "Creation failure, values retained" },
  ],
  variants: [
    { id: "paced", title: "Paced wizard", load: () => import("./paced.ts") },
    { id: "sheet", title: "Setup sheet", load: () => import("./sheet.ts") },
  ],
  check: "./screens/new-project/check.mjs",
};
