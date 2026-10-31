// Offline review entry for the same Design Lab renderers. No server or native API.
import "../../../src/styles.css";
import "../../../src/ui-refresh.css";
import { action, element as el, labelled } from "../../page.ts";
import { mountLook, type Variant } from "./workspace.ts";
import { mount as mountRefined } from "./refined.ts";
import { mount as mountEditor } from "./editor.ts";

const host = document.querySelector<HTMLElement>("#preview")!;
const controls = el("nav", "look-comparison"); controls.ariaLabel = "Compare shared-look designs";
const root = el("div", "look-comparison-root");
let variant: Variant | "refined" | "shared-style" = "shared-style", state = "many";
let dispose: (() => void) | undefined;
const select = el("select"); select.ariaLabel = "Sample scenario";
for (const [id, name] of [["shared", "Two shared uses"], ["many", "8 screens · 14 shared elements"], ["local", "Share with another screen"], ["stale", "Changed use"], ["missing", "Missing use"], ["expression", "Dynamic style"]]) {
  const option = el("option", "", name); option.value = id!; select.append(option);
}
select.value = state;
select.onchange = () => { state = select.value; render(); };
for (const [id, title] of [["shared-style", "A4 · Shared styles"], ["refined", "A2 · Shared looks"], ["inspector", "A · Original"], ["library", "B · Library"], ["inline", "C · Inline review"]] as const) {
  const button = action(title, () => { variant = id; render(); }); button.dataset.variant = id; controls.append(button);
}
controls.append(labelled("Fresh sample", select));
async function render() {
  dispose?.();
  if (variant !== "shared-style" && state === "many") { state = "shared"; select.value = state; }
  root.dataset.ready = "false";
  controls.querySelectorAll<HTMLButtonElement>("button").forEach(button => button.ariaPressed = String(button.dataset.variant === variant));
  const theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
  const cleanup = await (variant === "shared-style" ? mountEditor(root, { state, theme }) : variant === "refined" ? mountRefined(root, { state, theme }) : mountLook(root, { state, theme }, variant, true));
  dispose = typeof cleanup === "function" ? cleanup : undefined;
  root.dataset.ready = "true";
}
host.append(controls, root); render();
