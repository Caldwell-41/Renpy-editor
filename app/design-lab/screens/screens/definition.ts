import type { LabScreen } from "../../contracts.ts";
export const variants = [{ id: "guided-v2", title: "Screen notebook · revised" }, { id: "workbench", title: "Layout workbench" }, { id: "canvas", title: "Canvas desk" }, { id: "guided", title: "Screen notebook · original" }] as const;
export const definition: Omit<LabScreen, "approval"> = {
  id: "screens", title: "Screens", kind: "prototype",
  description: "A revised Screen notebook with a larger, resizable preview and plain directions. Three earlier layouts remain available. Changes stay in this demo.",
  states: [{ id: "populated", title: "Help panel" }, { id: "dialog", title: "Blocking Help dialog" }, { id: "template", title: "Protected dialogue template" }, { id: "empty", title: "No custom screens" }, { id: "conflict", title: "Source conflict with retained draft" }],
  variants: [{ ...variants[0], load: () => import("./notebook.ts") }, { ...variants[1], load: () => import("./workbench.ts") }, { ...variants[2], load: () => import("./canvas.ts") }, { ...variants[3], load: () => import("./guided.ts") }],
  check: "./screens/screens/check.mjs",
};
