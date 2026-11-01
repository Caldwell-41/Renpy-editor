// Offline wrapper around the registered Design Lab renderers. No native APIs.
import "../../../src/styles.css";
import "../../../src/ui-refresh.css";
import { definition } from "./definition.ts";
import { mountStudy, type Variant } from "./workspace.ts";

const host = document.querySelector<HTMLElement>("#preview")!;
const controls = document.createElement("nav"); controls.className = "cp-comparison"; controls.ariaLabel = "Compare draft designs";
const root = document.createElement("div"); root.id = "study";
const query = new URLSearchParams(location.search);
let variant = (query.get("variant") ?? "inspector") as Variant;
let state = query.get("state") ?? "shared";
let theme: "light" | "dark" = query.get("theme") === "light" ? "light" : "dark";
let dispose: (() => void) | undefined;
for (const item of definition.variants) {
  const button = document.createElement("button"); button.textContent = item.title; button.dataset.variant = item.id;
  button.onclick = () => { variant = item.id as Variant; render(); }; controls.append(button);
}
const scenario = document.createElement("select"); scenario.ariaLabel = "Fresh sample scenario";
for (const item of definition.states) scenario.add(new Option(item.title, item.id)); scenario.value = state;
scenario.onchange = () => { state = scenario.value; render(); };
const themes = document.createElement("select"); themes.ariaLabel = "Review theme";
themes.add(new Option("Dark", "dark")); themes.add(new Option("Light", "light")); themes.value = theme;
themes.onchange = () => { theme = themes.value as "dark" | "light"; render(); };
controls.append(scenario, themes); host.append(controls, root);
function render() {
  dispose?.(); root.dataset.ready = "false";
  controls.querySelectorAll<HTMLButtonElement>("button").forEach(b => b.ariaPressed = String(b.dataset.variant === variant));
  dispose = mountStudy(root, { state, theme }, variant); root.dataset.ready = "true";
}
render();
