export interface Profile {
  id: string; name: string; endpoint: string; privateHttp: boolean; key: boolean; connected: boolean; model: string;
  context: string; response: string; thinking: boolean; temperature: string; topP: string;
  parallel: string; gpu: string; fit: string;
}
export const models = ["tram-writer-32b", "tram-writer-14b"];
export const categories = ["Workspace", "AI providers", "Source editor", "Keyboard shortcuts", "About"] as const;
export type Category = typeof categories[number];
export const actions = ["Dialogue rewrite", "Edit Scene", "Continue Scene", "Draft Scene", "Character card", "Lore entry"];
export function newProfile(id = "new"): Profile {
  return { id, name: "Studio", endpoint: "http://127.0.0.1:8888/v1", privateHttp: false, key: false, connected: false, model: "", context: "32768", response: "16384", thinking: true, temperature: "1", topP: "0.95", parallel: "1", gpu: "manual", fit: "off" };
}
export function fixture(state: string) {
  const profiles = state === "empty" ? [] : [
    { ...newProfile("studio"), name: "Writing studio", key: true, connected: true, model: models[0]! },
    { ...newProfile("laptop"), name: "Laptop experiments", key: true, connected: true, model: models[1]!, response: "8192" },
  ];
  if (state === "long") for (let index = 0; index < 7; index++) profiles.push({ ...newProfile(`extra-${index}`), name: ["Dialogue revision and scene planning", "Offline editorial experiments", "Small model for first drafts"][index % 3]!, key: true, connected: true, model: models[1]! });
  const prompts = actions.map(action => `Help the writer with ${action.toLowerCase()} for The Last Tram. Preserve established facts and character voice. Return a structured proposal for the writer to review. Never apply a change yourself.${state === "long" ? "\n\nUse specific physical detail. Keep the tram timetable consistent. Give Mara room to hesitate before she answers. Preserve the quiet tension between old friends.".repeat(5) : ""}`);
  return { profiles, prompts };
}
