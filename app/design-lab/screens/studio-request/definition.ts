import type { LabScreen } from "../../contracts.ts";

export const definition: Omit<LabScreen, "approval"> = {
  id: "studio-request", title: "Studio request", kind: "prototype",
  description: "A compact request console and a split request desk share a fixed fictional diagnostic request. Nothing contacts a model.",
  states: [
    { id: "populated", title: "Ready to send a sample" },
    { id: "empty", title: "No saved profiles" },
    { id: "long", title: "Long profile and retained result" },
    { id: "error", title: "Retained request error" },
  ],
  variants: [
    { id: "console", title: "Request console", load: () => import("./console.ts") },
    { id: "desk", title: "Request desk", load: () => import("./desk.ts") },
  ],
  check: "./screens/studio-request/check.mjs",
};
