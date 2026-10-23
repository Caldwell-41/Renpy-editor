import type { LabScreen } from "../../contracts.ts";
export const definition: Omit<LabScreen, "approval"> = {
  id: "canvas-drag", title: "Canvas dragging", kind: "prototype",
  description: "Three draft drag targets with immediate guides and simulated delayed content. All edits stay in memory; no SDK or source writes.",
  states: [{ id: "ready", title: "Normal feedback" }, { id: "delayed", title: "Delayed content (600 ms)" }],
  variants: [
    { id: "handle", title: "Move handle", load: () => import("./handle.ts") },
    { id: "border", title: "Drag border", load: () => import("./border.ts") },
    { id: "body", title: "Drag selected frame", load: () => import("./body.ts") },
  ],
  check: "./screens/canvas-drag/check.mjs",
};
