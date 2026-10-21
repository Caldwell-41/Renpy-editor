import type { LabScreen } from "../../contracts.ts";
export const variants = [{ id: "workbench", title: "Layout workbench" }, { id: "canvas", title: "Canvas desk" }, { id: "guided", title: "Screen notebook" }] as const;
export const definition: Omit<LabScreen, "approval"> = {
  id: "screens", title: "Screens", kind: "prototype",
  description: "Three Screens layouts with identical Help and protected-template samples. Edits, actions, source and preview status use fictional browser memory.",
  states: [{ id: "populated", title: "Help panel" }, { id: "dialog", title: "Blocking Help dialog" }, { id: "template", title: "Protected dialogue template" }, { id: "empty", title: "No custom screens" }, { id: "conflict", title: "Source conflict with retained draft" }],
  variants: [{ ...variants[0], load: () => import("./workbench.ts") }, { ...variants[1], load: () => import("./canvas.ts") }, { ...variants[2], load: () => import("./guided.ts") }],
  check: "./screens/screens/check.mjs",
};
