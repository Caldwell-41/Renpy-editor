export type Action = { kind: "set" | "hide" | "finish"; variable: string; value: string };
export type ScreenNode = {
  id: string; parent: string; kind: string; name: string; text: string;
  x: string; y: string; width: string; height: string; coordinates: string;
  anchorX: string; anchorY: string; alignment: string; minWidth: string; maxWidth: string;
  padding: string; spacing: string; font: string; size: string; color: string;
  bold: boolean; italic: boolean; asset: string; aspect: boolean; background: string; border: string;
  shared: boolean; actions: Action[]; variable: string; minimum: string; maximum: string;
};
export type Screen = { id: string; name: string; mode: "panel" | "blocking"; template: boolean; nodes: ScreenNode[]; revision: number; };
export const kinds = ["fixed", "frame", "vbox", "text", "image", "textbutton", "window", "hbox", "grid", "imagebutton", "bar", "viewport", "component"];
export const variables = [{ id: "help_seen", type: "bool", value: "false" }, { id: "courage", type: "int", value: "35" }, { id: "destination", type: "string", value: "The harbour" }];
export function node(id: string, kind: string, name: string, x = 320, y = 216, width = 640, height = 48): ScreenNode {
  return { id, parent: "stack", kind, name, text: name, x: String(x), y: String(y), width: String(width), height: String(height), coordinates: "px", anchorX: "0", anchorY: "0", alignment: "left", minWidth: "0", maxWidth: "1280", padding: "16", spacing: "16", font: "NotoSans-Regular.ttf", size: "32", color: "#f0e6d2", bold: false, italic: false, asset: "tram-map.webp", aspect: true, background: "#293c3c", border: "#81968b", shared: false, actions: [], variable: "courage", minimum: "0", maximum: "100" };
}
export function help(id: string, mode: Screen["mode"]): Screen {
  const fixed = node("root", "fixed", "Screen root", 0, 0, 1280, 720); fixed.parent = "";
  const frame = node("frame", "frame", "Help frame", 280, 180, 720, 360); frame.parent = "root";
  const stack = node("stack", "vbox", "Content stack", 312, 204, 656, 304); stack.parent = "frame";
  const title = node("title", "text", "Help title", 328, 214, 610, 46); title.text = "Your next stop"; title.bold = true; title.shared = true;
  const body = node("body", "text", "Instructions", 328, 274, 360, 120); body.text = "Choose a route. Talk to Ada at [destination]."; body.size = "22";
  const image = node("map", "image", "Tram map", 718, 278, 214, 124);
  const close = node("close", "textbutton", "Close Help", 328, 434, 210, 48); close.text = "Close"; close.actions = [{ kind: mode === "panel" ? "hide" : "finish", variable: "help_seen", value: "true" }];
  return { id, name: mode === "panel" ? "Help panel" : "Help dialog", mode, template: false, nodes: [fixed, frame, stack, title, body, image, close], revision: 1 };
}
export function fixture(state: string): Screen[] {
  const custom = state === "empty" ? [] : [help("help-panel", "panel"), help("help-dialog", "blocking")];
  const templates = ["Dialogue (say)", "Choices (choice)", "Main menu", "Navigation", "Preferences", "Save / load"].map((name, index) => {
    const screen = help(`template-${index}`, "panel"); screen.name = name; screen.template = true;
    screen.nodes[1]!.name = index === 0 ? "Dialogue window" : "Menu frame";
    screen.nodes[3]!.name = index === 0 ? "Speaker (who)" : "Template heading";
    screen.nodes[3]!.text = index === 0 ? "Ada" : name;
    screen.nodes[4]!.name = index === 0 ? "Dialogue (what)" : "Required controls";
    screen.nodes[4]!.text = index === 0 ? "The last tram leaves at midnight." : index === 1 ? "Harbour / Old town / Station" : index === 4 ? "Music volume / Text speed" : index === 5 ? "Slot 1 / Slot 2 / Next page" : "Start / Load / Preferences / Return";
    screen.nodes[6]!.name = "Protected template action"; screen.nodes[6]!.text = "Required interaction"; screen.nodes[6]!.actions = [];
    return screen;
  });
  return [...custom, ...templates];
}
