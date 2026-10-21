import { action, element as el } from "../../page.ts";

export interface LayoutParts {
  workspace: HTMLElement; notebook: HTMLElement; hierarchy: HTMLElement;
  stage: HTMLElement; inspector: HTMLElement; playground: HTMLElement;
  tabs: HTMLElement; divider: HTMLElement; step: (id: string) => void;
}
export interface SelectionInfo { name: string; kind: string; parent: string; step: string; button: boolean; }
export interface LayoutView { update: (selection: SelectionInfo) => void; select: () => void; }

// A full canvas with optional panels. Detailed forms reserve space beside the game.
export function directLayout(p: LayoutParts): LayoutView {
  p.workspace.classList.add("direct-workspace");
  const commands = el("div", "direct-commands"); commands.ariaLabel = "Selected element commands";
  const caption = el("div", "direct-selection"), orders = el("div", "direct-order");
  let layersOpen = false, editorOpen = false;
  const layers = el("section", "direct-layers"); layers.ariaLabel = "Elements panel";
  const layerHeader = el("div", "direct-panel-heading");
  layerHeader.append(el("strong", "", "Elements"), action("Close elements", () => { layersOpen = false; sync(); elements.focus(); }));
  layers.append(layerHeader, p.hierarchy);
  const editorHeader = el("div", "direct-panel-heading");
  const editorName = el("strong");
  editorHeader.append(editorName, action("Close editing panel", () => { editorOpen = false; sync(); edit.focus(); }));
  const editorTabs = el("div", "direct-editor-tabs");
  editorTabs.append(action("Design", () => p.step("layout")), action("Story", () => p.step("behavior")));
  p.notebook.replaceChildren(editorHeader, editorTabs, p.inspector, p.playground);
  const elements = action("Elements", () => { layersOpen = !layersOpen; sync(); });
  const add = action("Add element...", () => { layersOpen = true; sync(); p.hierarchy.querySelector<HTMLElement>('[aria-label="Element type"]')?.focus(); });
  const edit = action("Edit element", () => { editorOpen = !editorOpen; p.step("layout"); sync(); }, true);
  const story = action("Try story", () => { editorOpen = true; layersOpen = false; p.step("behavior"); sync(); });
  commands.append(elements, add, caption, orders, edit, story);
  p.workspace.replaceChildren(commands, p.stage, p.divider, p.notebook, layers);
  function sync() {
    layers.hidden = !layersOpen; p.notebook.hidden = !editorOpen; p.divider.hidden = !editorOpen;
    p.workspace.classList.toggle("direct-editing", editorOpen);
    elements.ariaExpanded = String(layersOpen); edit.ariaExpanded = String(editorOpen);
    edit.textContent = editorOpen ? "Hide editor" : "Edit element"; edit.classList.toggle("primary", !editorOpen);
  }
  sync();
  return {
    select: () => { layersOpen = false; editorOpen = true; sync(); },
    update: selection => {
      caption.replaceChildren(el("strong", "", selection.name), el("span", "muted", `${selection.kind}${selection.parent ? ` · Inside ${selection.parent}` : ""}`));
      editorName.textContent = selection.step === "behavior" ? "Buttons & story" : selection.name;
      const order = p.hierarchy.querySelector(".nb-order");
      if (order) { const remove = [...order.querySelectorAll("button")].find(button => button.textContent === "Remove element"); if (remove) p.hierarchy.append(remove); orders.replaceChildren(order); }
      editorTabs.querySelectorAll("button").forEach((button, i) => button.ariaPressed = String((i === 1) === (selection.step === "behavior")));
      sync();
    },
  };
}

// A freely navigable task rail and one changing task card beside a persistent preview.
export function flowLayout(p: LayoutParts): LayoutView {
  p.workspace.classList.add("flow-workspace"); p.notebook.classList.add("flow-card");
  const heading = el("header", "flow-card-heading"), title = el("h2"), type = el("p", "flow-element-type"), note = el("p", "muted");
  const ordering = el("details", "flow-order");
  heading.append(title, type, note);
  p.tabs.ariaLabel = "Screen building steps";
  [...p.tabs.querySelectorAll("button")].forEach((button, i) => button.textContent = ["1  Choose", "2  Design", "3  Connect"][i]!);
  p.notebook.replaceChildren(heading, p.hierarchy, ordering, p.inspector, p.playground);
  p.workspace.replaceChildren(p.tabs, p.stage, p.divider, p.notebook);
  return {
    select: () => {},
    update: selection => {
      p.notebook.dataset.button = String(selection.button);
      const order = p.hierarchy.querySelector(".nb-order"), orderHeading = p.hierarchy.querySelector("h3"), position = p.hierarchy.querySelector(".nb-order-position");
      const summary = el("summary"); if (orderHeading) summary.append(...orderHeading.childNodes);
      ordering.replaceChildren(summary); if (position) ordering.append(position); if (order) ordering.append(order); orderHeading?.remove();
      title.textContent = selection.step === "compose" ? "Choose an element" : selection.name;
      type.hidden = selection.step === "compose"; type.textContent = selection.kind;
      note.textContent = selection.step === "compose" ? "Click an element to edit it, or drag it to move it. The list below includes elements hidden behind others." : selection.step === "layout" ? "Edit this element, then apply your changes." : selection.button ? "Choose what happens when the player clicks this button. Test the screen below." : "This element has no click actions. Select a button to set its actions, or test this screen below.";
    },
  };
}
