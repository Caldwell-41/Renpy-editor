// Fictional data and illustrative source. This is not a source parser or transaction service.
export type Visual = { width: number; height: number; fontSize: number; image: "tram" | "route"; closeLabel: string };
export const defaultVisual = (): Visual => ({ width: 320, height: 180, fontSize: 32, image: "tram", closeLabel: "Close" });
export type Screen = Visual & { id: string; name: string; title: string; explanation: string; starter: boolean; use: boolean; local: boolean; revision: number; copyName?: string; retainedGroup?: { title: string; explanation: string } };
export type Beat = { id: string; kind: "show" | "hide"; screenId: string; targetName: string; revision: number };
export type Sample = {
  revision: number;
  uiImages: Array<"tram" | "route">;
  component: Visual & { id: string; name: string; title: string; explanation: string; revision: number; state: "available" | "renamed" | "deleted"; unknown: boolean } | null;
  screens: Screen[]; beats: Beat[];
};
export const copy = <T>(value: T): T => structuredClone(value);
export const validName = (name: string) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
export function fixture(state: string): Sample {
  const shared = !["group", "starter", "story", "no-images"].includes(state);
  return {
    revision: 1,
    uiImages: state === "no-images" ? [] : ["tram", "route"],
    component: shared ? { ...defaultVisual(), id: "component-guide", name: "route_guide", title: "Find your way", explanation: "Choose a route. The last tram leaves at midnight.", revision: 1, state: state === "missing" ? "deleted" : "available", unknown: false } : null,
    screens: [
      { ...defaultVisual(), id: "screen-help", name: "help", title: "Help", explanation: "Choose a route. The last tram leaves at midnight.", starter: true, use: shared, local: false, revision: 1 },
      { ...defaultVisual(), id: "screen-about", name: "about", title: "About the tram", explanation: "Built by the night crew.", starter: true, use: shared, local: false, revision: 1 },
    ],
    beats: state === "story" ? [{ id: "beat-show", kind: "show", screenId: "screen-help", targetName: "help", revision: 1 }] : [],
  };
}
export function source(sample: Sample): { path: string; lines: string[] }[] {
  const definition = sample.component && sample.component.state !== "deleted" ? [{ path: "game/ui/components.rpy", lines: [
    "# Fictional sample. Ordinary Ren'Py screen source.", `screen ${sample.component.state === "renamed" ? "route_guide_changed" : sample.component.name}():`,
    "    vbox:", "        spacing 16", `        text ${JSON.stringify(sample.component.title)} size ${sample.component.fontSize}`,
    `        add "ui/${sample.component.image === "tram" ? "tram_emblem" : "route_map"}.svg" xsize ${sample.component.width} ysize ${sample.component.height}`, `        text ${JSON.stringify(sample.component.explanation)}`,
    ...(sample.component.unknown ? ["        # Unsupported child effect remains unknown", "        $ custom_route_effect()"] : []),
  ] }] : [];
  const copies = sample.screens.filter(screen => screen.copyName).map(screen => ({ path: "game/ui/components.rpy", lines: [
    `screen ${screen.copyName}():`, "    vbox:", `        text ${JSON.stringify(screen.title)} size ${screen.fontSize}`,
    `        add "ui/${screen.image === "tram" ? "tram_emblem" : "route_map"}.svg" xsize ${screen.width} ysize ${screen.height}`, `        text ${JSON.stringify(screen.explanation)}`,
  ] }));
  const combinedDefinition = definition[0] ? [{ path: definition[0].path, lines: [...definition[0].lines, ...copies.flatMap(item => ["", ...item.lines])] }] : copies;
  return [...combinedDefinition, ...sample.screens.map(screen => {
    const c = sample.component;
    return { path: `game/ui/${screen.name}.rpy`, lines: [
      "# Fictional sample. Outside edits are simulated by Lab controls.", `screen ${screen.name}():`, "    modal False", `    key \"K_ESCAPE\" action Hide(${JSON.stringify(screen.name)})`,
      ...(screen.starter ? ["    frame:", ...(screen.retainedGroup ? ["        vbox:", `            text ${JSON.stringify(screen.retainedGroup.title)}`, `            text ${JSON.stringify(screen.retainedGroup.explanation)}`] : []), ...(screen.use || screen.copyName ? [`        use ${screen.copyName ?? c?.name ?? "route_guide"}()`] : ["        vbox:", `            text ${JSON.stringify(screen.title)} size ${screen.fontSize}`, `            add "ui/${screen.image === "tram" ? "tram_emblem" : "route_map"}.svg" xsize ${screen.width} ysize ${screen.height}`, `            text ${JSON.stringify(screen.explanation)}`]), `        textbutton ${JSON.stringify(screen.closeLabel)} action Hide(${JSON.stringify(screen.name)})`] : []),
    ] };
  }), { path: "game/night_route.rpy", lines: ["label night_route:", '    "The last tram waits by the station."', ...sample.beats.flatMap(beat => [`    ${beat.kind} screen ${beat.targetName}`, ...(beat.kind === "show" ? ['    "We can read the guide while the tram moves."'] : [])]), '    "Next stop, the old observatory."'] }];
}
export function componentUses(sample: Sample): Screen[] { return sample.screens.filter(screen => screen.use); }
