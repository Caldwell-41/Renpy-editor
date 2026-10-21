export interface Scene { id: string; name: string; label: string; chapter: string; summary: string; x: number; y: number }
export interface Route { id: string; from: string; to?: string; text: string; kind: "choice" | "jump" | "call" | "body" | "missing" | "unknown" | "terminal"; condition?: string; continuation?: string }
export function story(long = false) {
  const scenes: Scene[] = [
    { id: "start", name: "The last tram", label: "start", chapter: "01 · After hours", summary: "Mara returns to a city that has forgotten her name.", x: 280, y: 24 },
    { id: "platform", name: "An empty platform", label: "platform", chapter: "01 · After hours", summary: "A familiar voice comes from the other side of the tracks.", x: 280, y: 175 },
    { id: "market", name: "Night market", label: "night_market", chapter: "02 · The city listens", summary: "Eli trades in small truths and unopened letters.", x: 30, y: 340 },
    { id: "signal", name: "The signal box", label: "signal_box", chapter: "02 · The city listens", summary: "A light blinks in a room that should be locked.", x: 530, y: 340 },
    { id: "archive", name: "A borrowed memory", label: "memory", chapter: "02 · The city listens", summary: "A short memory returns to the moment that called it.", x: 30, y: 505 },
    { id: "departure", name: "Before departure", label: "departure", chapter: "03 · First light", summary: "Both routes meet as the city begins to wake.", x: 280, y: 655 },
    { id: "home", name: "First light", label: "first_light", chapter: "03 · First light", summary: "Mara decides which version of the city to keep.", x: 280, y: 820 },
  ];
  const routes: Route[] = [
    { id: "arrival", from: "start", to: "platform", text: "Step off the tram", kind: "jump" },
    { id: "market-choice", from: "platform", to: "market", text: "Follow the music", kind: "choice" },
    { id: "signal-choice", from: "platform", to: "signal", text: "Look for the signal", kind: "choice", condition: "If has_ticket is true" },
    { id: "platform-body", from: "platform", text: "Wait for the next announcement", kind: "body", condition: "Otherwise · no earlier condition matched" },
    { id: "memory-call", from: "market", to: "archive", text: "Remember the letter", kind: "call", continuation: "Back at the market, after the memory" },
    { id: "market-leave", from: "market", to: "departure", text: "Leave before dawn", kind: "jump" },
    { id: "signal-leave", from: "signal", to: "departure", text: "Switch the signal", kind: "jump" },
    { id: "signal-missing", from: "signal", text: "Open the service passage", kind: "missing" },
    { id: "signal-unknown", from: "signal", text: "Follow a custom route", kind: "unknown" },
    { id: "memory-return", from: "archive", text: "Return to the caller", kind: "terminal" },
    { id: "departure-home", from: "departure", to: "home", text: "Take the first tram home", kind: "choice" },
    { id: "home-end", from: "home", text: "End the story", kind: "terminal" },
  ];
  if (long) {
    scenes[1]!.name = "An empty platform beneath the city's oldest clock";
    routes[1]!.text = "Follow the distant music through the arcade and ask Eli about the unopened letter";
    for (let i = 0; i < 18; i++) {
      const id = `detour-${i}`;
      scenes.push({ id, name: `A small detour ${i + 1}`, label: `detour_${i + 1}`, chapter: "04 · The long way home", summary: "A quiet street, an unfamiliar door, and another way to return to the tram line.", x: 810 + (i % 3) * 250, y: 24 + Math.floor(i / 3) * 165 });
      routes.push({ id: `detour-route-${i}`, from: i ? `detour-${i - 1}` : "departure", to: id, text: "Keep walking", kind: "jump" });
    }
  }
  return { scenes, routes };
}
export const kindCaption = { choice: "Choice", jump: "Jump", call: "Call & return", body: "Within scene", missing: "Missing label", unknown: "Custom flow", terminal: "Return / end" };
