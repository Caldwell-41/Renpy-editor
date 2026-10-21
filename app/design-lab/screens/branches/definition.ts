import type { LabScreen } from "../../contracts.ts";
export const definition: Omit<LabScreen, "approval"> = {
  id: "branches", title: "Branches", kind: "prototype",
  description: "Compare a whole-story atlas with a scene-by-scene route desk. All flow and navigation are fictional, read-only samples.",
  states: [
    { id: "populated", title: "Observed story flow" }, { id: "empty", title: "No mapped scenes" },
    { id: "long", title: "Long story and labels" }, { id: "error", title: "Refresh failure with retained flow" },
  ],
  variants: [
    { id: "atlas", title: "Story atlas", load: () => import("./atlas.ts") },
    { id: "desk", title: "Route desk", load: () => import("./desk.ts") },
  ], check: "./screens/branches/check.mjs",
};
