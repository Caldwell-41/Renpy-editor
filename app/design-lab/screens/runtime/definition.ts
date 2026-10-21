import type { LabScreen } from "../../contracts.ts";

export const definition: Omit<LabScreen, "approval"> = {
  id: "runtime",
  title: "Runtime & diagnostics",
  kind: "prototype",
  description: "Compare a run desk with a diagnostic console. Every SDK, execution and source action is fictional browser state.",
  states: [
    { id: "populated", title: "Ready with retained validation" },
    { id: "empty", title: "SDK needed, no results" },
    { id: "long", title: "Many retained diagnostics" },
    { id: "error", title: "Runtime error and cleanup failure" },
  ],
  variants: [
    { id: "desk", title: "Run desk", load: () => import("./desk.ts") },
    { id: "console", title: "Diagnostic console", load: () => import("./console.ts") },
  ],
  check: "./screens/runtime/check.mjs",
};
