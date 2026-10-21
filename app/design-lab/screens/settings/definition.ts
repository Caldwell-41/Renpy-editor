import type { LabScreen } from "../../contracts.ts";
export const definition: Omit<LabScreen, "approval"> = {
  id: "settings", title: "Settings", kind: "prototype",
  description: "Settings book and Control desk share fictional application preferences, provider profiles and project preparation tools.",
  states: [
    { id: "populated", title: "Everyday workspace" }, { id: "empty", title: "First provider connection" },
    { id: "long", title: "Many profiles and long prompts" }, { id: "error", title: "Retained draft after failure" },
  ],
  variants: [
    { id: "book", title: "Settings book", load: () => import("./book.ts") },
    { id: "desk", title: "Control desk", load: () => import("./desk.ts") },
  ],
  check: "./screens/settings/check.mjs",
};
