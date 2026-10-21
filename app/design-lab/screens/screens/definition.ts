import type { LabScreen } from "../../contracts.ts";
export const variants = [{ id: "guided-v2", title: "Screen notebook" }, { id: "direct", title: "Canvas focus" }, { id: "flow", title: "Screen builder" }] as const;
export const definition: Omit<LabScreen, "approval"> = {
  id: "screens", title: "Screens", kind: "prototype",
  description: "Screen notebook, a canvas with optional editing panels, and a guided screen builder. Element help explains each type. Changes stay in this demo.",
  states: [{ id: "populated", title: "Help panel" }, { id: "dialog", title: "Blocking Help dialog" }, { id: "template", title: "Protected dialogue template" }, { id: "empty", title: "No custom screens" }, { id: "conflict", title: "Source conflict with retained draft" }],
  variants: [{ ...variants[0], load: () => import("./notebook.ts") }, { ...variants[1], load: () => import("./direct.ts") }, { ...variants[2], load: () => import("./flow.ts") }],
  check: "./screens/screens/check.mjs",
};
