import { icon } from "../src/icons.ts";
import type { LabContext } from "./contracts.ts";
import "./page.css";

export function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text = ""): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag); result.className = className; result.textContent = text; return result;
}
export function action(label: string, callback: () => void, primary = false) {
  const result = element("button", `button${primary ? " primary" : ""}`, label);
  result.type = "button"; result.onclick = callback; return result;
}
export function labelled<T extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(title: string, input: T, help = "") {
  const label = element("label", "field lp-field"); if (!input.ariaLabel) input.ariaLabel = title;
  label.append(element("span", "lp-label", title), input);
  if (help) {
    const note = element("p", "muted lp-help", help); note.id = `lp-help-${++helpSequence}`;
    input.setAttribute("aria-describedby", note.id); label.append(note);
  }
  return label;
}
let helpSequence = 0;

const pages = [
  ["story", "Story", "story"], ["source", "Source", "source"], ["branches", "Branches", "branches"],
  ["characters-writing", "Characters", "characters"], ["lorebook", "Lorebook", "lorebook"],
  ["assets", "Assets", "assets"], ["variables", "Variables", "variables"],
] as const;

/** Browser sample frame. It imports presentation assets only. */
export function labPage(host: HTMLElement, context: LabContext, options: {
  screen: string; title: string; subtitle: string; project?: boolean; dirty?: () => boolean;
}) {
  const shell = element("div", "app-shell lp-shell");
  const header = element("header", "app-header");
  const brand = action("Loomlight", () => { if (options.screen !== "welcome") navigate("welcome"); });
  brand.className = "brand"; brand.ariaLabel = "Go to Home"; brand.title = "Home"; brand.prepend(icon("story"));
  header.append(brand, element("span", "lp-project", options.project === false ? "Local workspace" : "The Last Tram"), element("span", "lp-sample muted", "Fictional sample"));
  const project = element("div", "project-shell lp-project-shell");
  const nav = element("nav", "story-sidebar lp-navigation"); nav.ariaLabel = "Project navigation";
  const collapsedAtMount = innerWidth < 1280;
  project.dataset.navigationCollapsed = String(collapsedAtMount);
  const collapse = action("", () => {
    project.dataset.navigationCollapsed = String(project.dataset.navigationCollapsed !== "true"); updateToggle(); collapse.focus();
  }); collapse.className = "icon-button lp-nav-toggle";
  const updateToggle = () => {
    const collapsed = project.dataset.navigationCollapsed === "true";
    collapse.ariaLabel = collapse.title = collapsed ? "Expand navigation" : "Collapse navigation";
    collapse.ariaExpanded = String(!collapsed); collapse.replaceChildren(icon(collapsed ? "panelOpen" : "panel"));
  };
  updateToggle(); nav.append(collapse);
  function navigate(screen: string) {
    const query = new URLSearchParams({ screen, theme: context.theme, viewport: new URLSearchParams(location.search).get("viewport") ?? "wide" });
    const go = () => { window.top!.location.href = `/?${query}`; };
    if (!options.dirty?.()) { go(); return; }
    const dialog = element("dialog", "lp-dialog"); dialog.ariaLabel = "Leave this sample?";
    dialog.append(element("h2", "", "Leave this sample?"), element("p", "", "Your unsaved sample changes will reset when you switch pages."));
    dialog.append(action("Keep editing", () => dialog.close()), action("Leave sample", go));
    dialog.onclose = () => dialog.remove(); shell.append(dialog); dialog.showModal();
  }
  const studio = action("Studio request", () => navigate("studio-request")); studio.classList.add("lp-studio-link"); header.append(studio);
  const destinations = options.project === false ? [["welcome", "Home", "story"] as const, ["new-project", "New project", "plus"] as const, ["settings", "Settings", "settings"] as const] : [...pages, ["settings", "Settings", "settings"] as const];
  for (const [screen, title, glyph] of destinations) {
    const b = action(title, () => { if (screen !== options.screen) navigate(screen); });
    b.className = `tree-item${screen === options.screen ? " selected" : ""}`;
    b.prepend(icon(glyph)); b.ariaLabel = b.title = title;
    if (screen === options.screen) b.ariaCurrent = "page"; nav.append(b);
  }
  const main = element("main", "lp-main");
  const heading = element("div", "lp-heading");
  const title = element("div"); title.append(element("h1", "", options.title), element("p", "muted", `${options.subtitle} · Draft`));
  const tools = element("div", "lp-tools"); heading.append(title, tools);
  const content = element("div", "lp-content"); main.append(heading, content);
  project.append(nav, main);
  const footer = element("footer", "app-footer");
  const status = element("span", "lp-status"); status.role = "status"; status.textContent = "Ready in sample";
  footer.append(element("span", "lp-fiction", "Fictional sample · Changes stay in this preview"), status);
  if (options.project !== false) {
    const runtime = action("Runtime & diagnostics", () => navigate("runtime")); runtime.className = "text-button lp-runtime-link"; footer.append(runtime);
  }
  shell.append(header, project, footer); host.replaceChildren(shell);
  return { shell, main, content, heading, tools, status, navigate };
}
