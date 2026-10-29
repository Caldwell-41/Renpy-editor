import type { LabScreen } from "../../contracts.ts";
export const definition: Omit<LabScreen, "approval"> = {
  id: "ui-image", title: "UI image · #40", kind: "prototype",
  description: "Refined A2 and three original image workflows inside Screens. Asset import, source writes, history, reopen and preview are simulated in browser memory. The picker never starts Ren'Py or runs a game action.",
  states: [
    { id: "placed", title: "Placed image" }, { id: "add", title: "Add an image" },
    { id: "missing", title: "Missing asset" }, { id: "replaced", title: "Replaced file" },
    { id: "invalid", title: "Invalid image" }, { id: "conflict", title: "Source conflict" },
  ],
  variants: [
    { id: "refined", title: "A2 · Focused image editor", load: () => import("./refined.ts") },
    { id: "inspector", title: "A · Inspector picker", load: () => import("./inspector.ts") },
    { id: "browser", title: "B · Asset browser", load: () => import("./browser.ts") },
    { id: "guided", title: "C · Guided image sheet", load: () => import("./guided.ts") },
  ],
  check: "./screens/ui-image/check.mjs",
};
