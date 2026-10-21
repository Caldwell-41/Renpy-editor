import type { LabScreen } from "../../contracts.ts";

export const definition: Omit<LabScreen, "approval"> = {
  id: "source",
  title: "Source",
  kind: "prototype",
  description: "Two source-editing drafts. File edits, validation, conflicts and saves use fictional session data.",
  states: [
    { id: "populated", title: "Fictional project" },
    { id: "empty", title: "Empty source file" },
    { id: "long", title: "Long source file" },
    { id: "error", title: "Save failure" },
    { id: "conflict", title: "External change" },
  ],
  variants: [
    { id: "workbench", title: "Docked workbench", load: () => import("./workbench.ts") },
    { id: "focus", title: "Focus editor", load: () => import("./focus.ts") },
  ],
  check: "./screens/source/check.mjs",
};
