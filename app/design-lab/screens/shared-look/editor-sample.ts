// Fictional services for the real Screens renderer. No native transport or files.
import type { ScreenDocument, ScreenNode } from "../../../src/screen-ui.ts";
import type { TextProperties } from "../../../src/screen-text.ts";
import type { CompositionCommand } from "../../../src/screen-composition.ts";

export type Appearance = TextProperties["values"];
export interface Look { name: string; values: Appearance }
export interface Sample { documents: ScreenDocument[]; looks: Record<string, Look>; uses: Record<string, string>; revision: number }
export interface PendingLook { id: string; independent: boolean }
export const clone = <T,>(value: T): T => structuredClone(value);
export const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
export const useKey = (doc: ScreenDocument, node: ScreenNode) => `${doc.screens[0]!.name}/${node.id}`;

export function fixture(state: string): Sample {
  const local = state === "local", expression = state === "expression", many = state === "many";
  const looks: Sample["looks"] = {
    body: { name: "Body text", values: { size: 26, color: "#f1e9d6", align: 0, bold: false, italic: false } },
    heading: { name: "Heading", values: { size: 38, color: "#e4bb70", align: 0, bold: true, italic: false } },
    button: { name: "Button label", values: { size: 24, color: "#f1e9d6", align: 0, bold: false, italic: false } },
  };
  if (local) looks.about_body = { name: "About body text", values: clone(looks.body!.values) };
  const uses: Sample["uses"] = {};
  const screens = many ? ["Help", "About", "Journal", "Map", "Inventory", "Settings", "Credits", "Pause"] : ["Help", "About"];
  const documents = screens.map(name => {
    const node = (id: string, kind: string, start: number, parentStart: number | null, literal: string | null = null): ScreenNode => ({
      id, kind, literal, span: { start, end: start + 20 }, parentStart, layout: {}, properties: [], protected: [],
      numericLayout: { values: {}, blocked: {}, sourceBlocked: {} },
    });
    const root = node("root", "screen", 0, null), frame = node("frame", "frame", 40, 0), group = node("content", "vbox", 80, 40);
    frame.properties = [{ property: "xsize", value: 1040 }, { property: "ysize", value: 560 }];
    frame.numericLayout!.values = { xpos: { unit: "pixels", value: 120 }, ypos: { unit: "pixels", value: 80 }, xsize: { unit: "pixels", value: 1040 }, ysize: { unit: "pixels", value: 560 } };
    group.numericLayout!.values = { spacing: { unit: "pixels", value: 24 } };
    const title = node("title", "text", 120, 80, name === "About" ? "About the last tram" : name);
    const body = node("body", "text", 180, 80, name === "Help" ? "Choose a route.\nThe last tram leaves at midnight." : name === "About" ? "Built for the long way home.\nEvery stop has a story." : `${name} for the last tram.\nYour next stop is waiting.`);
    const note = many && !["Help", "About"].includes(name) ? node("note", "text", 210, 80, "Return here whenever you need.") : undefined;
    const button = node("close", "textbutton", 240, 80, "Close");
    const styled: Array<readonly [ScreenNode, string]> = [[title, "heading"], [body, local && name === "About" ? "about_body" : "body"], [button, "button"]];
    if (note) styled.push([note, "body"]);
    for (const [n, style] of styled) {
      uses[`${name}/${n.id}`] = style;
      n.textProperties = { values: clone(looks[style]!.values), blocked: {} };
      n.numericLayout!.values = { xpos: { unit: "pixels", value: 0 }, xanchor: { unit: "pixels", value: 0 }, xsize: { unit: "pixels", value: n.id === "close" ? 220 : 880 } };
      if (expression && n.id === "body") { n.textProperties.blocked = { size: "Expression in Source", color: "Expression in Source", font: "Expression in Source" }; n.textProperties.expressions = { color: "gui.text_color", size: "gui.text_size", font: "gui.text_font" }; }
    }
    const opaque = node("custom", "custom", 900, 0, "use custom_footer()"); opaque.protected = [clone(opaque.span)];
    return { path: `game/ui/${name.toLowerCase()}.rpy`, revision: "sample-1", partial: true, screens: [{ name, nodes: [root, frame, group, title, body, ...(note ? [note] : []), button, opaque] }] };
  });
  return { documents, looks, uses, revision: 1 };
}

export function resolvedValues(sample: Sample, doc: ScreenDocument, node: ScreenNode, pending?: PendingLook): Appearance {
  return sample.looks[pending?.id ?? sample.uses[useKey(doc, node)]!]!.values;
}

export function changeLook(next: Sample, doc: ScreenDocument, node: ScreenNode, pending: PendingLook | undefined, values: { [K in keyof Appearance]?: Appearance[K] | null } = {}) {
  const key = useKey(doc, node); let id = pending?.id ?? next.uses[key]!;
  if (pending?.independent) { const copy = `${id}_${doc.screens[0]!.name.toLowerCase()}_${next.revision}`; next.looks[copy] = clone(next.looks[id]!); next.looks[copy]!.name += ` / ${doc.screens[0]!.name}`; id = copy; }
  next.uses[key] = id;
  for (const [field, value] of Object.entries(values)) {
    if (value === null) delete (next.looks[id]!.values as Record<string, unknown>)[field];
    else (next.looks[id]!.values as Record<string, unknown>)[field] = value;
  }
  for (const document of next.documents) for (const n of document.screens[0]!.nodes) if (n.textProperties) n.textProperties.values = clone(resolvedValues(next, document, n));
}

export function applyText(next: Sample, doc: ScreenDocument, command: Extract<CompositionCommand, { type: "formatText" }>, pending?: PendingLook) {
  const node = doc.screens[0]!.nodes.find(n => n.id === command.nodeId)!;
  const { text, font, ...appearance } = command.values;
  if (font) throw Error("This study uses the default project font. Project font import remains in its own workflow.");
  changeLook(next, doc, node, pending, appearance);
  if (text !== undefined) node.literal = text;
  for (const [key, value] of Object.entries(command.layout ?? {})) {
    if (value === null) delete node.numericLayout!.values[key]; else node.numericLayout!.values[key] = value;
  }
}

export function source(sample: Sample, doc: ScreenDocument): string {
  return "# Fictional saved source. Actual serialization remains unqualified.\n" +
    Object.entries(sample.looks).map(([id, look]) => `style tram_${id}:\n    size ${look.values.size}\n    color "${look.values.color}"`).join("\n\n") +
    `\n\nscreen ${doc.screens[0]!.name.toLowerCase()}():\n` + doc.screens[0]!.nodes.filter(n => n.textProperties).map(n => `    ${n.kind === "textbutton" ? "textbutton" : "text"} ${JSON.stringify(n.literal)} style "tram_${sample.uses[useKey(doc, n)]}"`).join("\n") + "\n    use custom_footer()\n";
}

/** Browser canvas stands in for helper PNGs. It never calls the SDK. */
export function render(doc: ScreenDocument, payload: Record<string, unknown>, values?: { nodeStart: number; values: Appearance; text?: string }) {
  const width = Number(payload.width ?? 1280), height = Number(payload.height ?? 720);
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const c = canvas.getContext("2d")!; c.fillStyle = "#172629"; c.fillRect(0, 0, width, height);
  c.fillStyle = "#293b3b"; c.fillRect(width * .08, height * .1, width * .84, height * .8);
  const positions: Record<string, [number, number, number, number]> = { root: [0, 0, width, height], frame: [width * .08, height * .1, width * .84, height * .8], content: [width * .12, height * .15, width * .76, height * .7], title: [width * .13, height * .18, width * .7, 75], body: [width * .13, height * .34, width * .7, 150], note: [width * .13, height * .53, width * .7, 65], close: [width * .13, height * .67, 220, 58] };
  const samples = (payload.textStyles ?? []) as Array<{ nodeStart: number; values: Appearance & { text?: string } }>;
  for (const n of doc.screens[0]!.nodes.filter(n => n.textProperties)) {
    const draft = samples.find(s => s.nodeStart === n.span.start)?.values;
    const style = { ...n.textProperties!.values, ...draft, ...(values?.nodeStart === n.span.start ? values.values : {}) };
    const text = values?.nodeStart === n.span.start && values.text !== undefined ? values.text : draft?.text ?? n.literal ?? "";
    const [x, y, w, h] = positions[n.id!]!;
    c.fillStyle = style.color ?? "#f1e9d6"; c.font = `${style.italic ? "italic " : ""}${style.bold ? "bold " : ""}${style.size ?? 26}px sans-serif`;
    text.split("\n").forEach((line, index) => c.fillText(line, x, y + (index + 1) * ((style.size ?? 26) * 1.45), w));
    if (n.kind === "textbutton") { c.strokeStyle = "#829a94"; c.lineWidth = 2; c.strokeRect(x - 12, y, w, h); }
  }
  return { phase: "ready", revision: doc.revision, image: canvas.toDataURL("image/png"), geometry: doc.screens[0]!.nodes.filter(n => positions[n.id!]).map(n => { const [x, y, width, height] = positions[n.id!]!; return { start: n.span.start, x, y, width, height }; }) };
}
