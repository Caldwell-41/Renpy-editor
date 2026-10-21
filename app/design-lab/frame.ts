import { icon } from "../src/icons.ts";

export function sampleFrame(host: HTMLElement): HTMLElement {
  const shell = document.createElement("div");
  shell.className = "app-shell";
  const header = document.createElement("header");
  header.className = "app-header";
  const brand = document.createElement("span");
  brand.className = "brand";
  brand.textContent = "Loomlight";
  const project = document.createElement("span");
  project.textContent = "Sample project";
  header.append(brand, project);
  const layout = document.createElement("div");
  layout.className = "project-shell";
  const sidebar = document.createElement("nav");
  sidebar.className = "story-sidebar";
  sidebar.ariaLabel = "Project navigation";
  const selected = document.createElement("button");
  selected.className = "tree-item selected";
  selected.type = "button";
  selected.setAttribute("aria-current", "page");
  selected.append(icon("characters"), "Characters");
  sidebar.append(selected);
  const surface = document.createElement("main");
  surface.className = "supporting-workspace";
  layout.append(sidebar, surface);
  const footer = document.createElement("footer");
  footer.className = "app-footer";
  footer.textContent = "Sample project";
  shell.append(header, layout, footer);
  host.replaceChildren(shell);
  return surface;
}
