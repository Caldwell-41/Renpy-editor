import type { LabScreen } from "../../contracts.ts";

export const definition: Omit<LabScreen, "approval"> = {
  id: "variables",
  title: "Variables",
  kind: "prototype",
  description: "Compare a compact definition ledger with a grouped notebook. Typed defaults and story links use fictional browser data.",
  states: [
    { id: "populated", title: "Fictional definitions" },
    { id: "empty", title: "No variables yet" },
    { id: "long", title: "Many definitions and long text" },
    { id: "error", title: "Save failure and retry" },
  ],
  variants: [
    { id: "ledger", title: "Definition ledger", load: () => import("./ledger.ts") },
    { id: "notebook", title: "Definition notebook", load: () => import("./notebook.ts") },
  ],
  check: "./screens/variables/check.mjs",
};
