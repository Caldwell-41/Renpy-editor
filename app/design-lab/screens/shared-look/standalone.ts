// Offline review entry for the same Design Lab renderers. No server or native API.
import "../../../src/styles.css";
import "../../../src/ui-refresh.css";
import { action, element as el, labelled } from "../../page.ts";
import { mountLook, type Variant } from "./workspace.ts";
import { mount as mountRefined } from "./refined.ts";

const host = document.querySelector<HTMLElement>("#preview")!;
const controls = el("nav", "look-comparison"); controls.ariaLabel = "Compare shared-look designs";
const root = el("div", "look-comparison-root");
let variant: Variant | "refined" = "refined", state = "shared";
let dispose: (() => void) | undefined;
const select = el("select"); select.ariaLabel = "Sample scenario";
for (const [id, name] of [["shared", "Two shared uses"], ["local", "Share with another screen"], ["stale", "Changed use"], ["missing", "Missing use"], ["expression", "Dynamic style"]]) {
  const option = el("option", "", name); option.value = id!; select.append(option);
}
select.onchange = () => { state = select.value; render(); };
for (const [id, title] of [["refined", "A2 · Shared looks"], ["inspector", "A · Original"], ["library", "B · Library"], ["inline", "C · Inline review"]] as const) {
  const button = action(title, () => { variant = id; render(); }); button.dataset.variant = id; controls.append(button);
}
controls.append(labelled("Fresh sample", select));
function render() {
  dispose?.();
  controls.querySelectorAll<HTMLButtonElement>("button").forEach(button => button.ariaPressed = String(button.dataset.variant === variant));
  const cleanup = variant === "refined" ? mountRefined(root, { state, theme: "dark" }) : mountLook(root, { state, theme: "dark" }, variant, true);
  dispose = typeof cleanup === "function" ? cleanup : undefined;
}
host.append(controls, root); render();
