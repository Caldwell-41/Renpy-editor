import "../src/styles.css";
import "../src/ui-refresh.css";
import "./catalog.css";
import { screens } from "./registry.ts";
import { revisionFor, revisionStatus } from "./approval.ts";
import { icon } from "../src/icons.ts";

const host = document.querySelector<HTMLElement>("#catalog")!;
const query = new URLSearchParams(location.search);
let theme = query.get("theme") === "dark" ? "dark" : "light";
let viewport = query.get("viewport") === "compact" ? "compact" : "wide";
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text = ""): HTMLElementTagNameMap[K] => {
  const n = document.createElement(tag); n.className = className; n.textContent = text; return n;
};
document.documentElement.dataset.theme = theme;
const header = el("header", "gallery-header");
const brand = el("div", "gallery-brand", "Loomlight"); brand.prepend(icon("story"));
header.append(brand, el("span", "muted", "Design Lab"));
const intro = el("section", "gallery-intro");
intro.append(el("p", "gallery-eyebrow muted", "App layout comparison"), el("h1", "", "Choose a page to explore"), el("p", "muted", "Compare interactive drafts with fictional content. Each preview has theme, viewport and sample-state controls. Your sample edits reset when you open another preview."));
const controls = el("div", "gallery-controls");
const search = el("input"); search.type = "search"; search.ariaLabel = "Find a page"; search.placeholder = "Find a page";
function picker(title: string, choices: [string, string][], value: string, change: (value: string) => void) {
  const label = el("label", "gallery-picker"); label.append(title);
  const select = el("select"); select.ariaLabel = title;
  for (const [id, title] of choices) { const option = el("option", "", title); option.value = id; select.append(option); }
  select.value = value; select.onchange = () => { change(select.value); draw(); };
  label.append(select); return label;
}
controls.append(search,
  picker("Theme", [["light", "Light"], ["dark", "Dark"]], theme, value => { theme = value; document.documentElement.dataset.theme = theme; }),
  picker("Preview size", [["wide", "1100 × 720"], ["compact", "560 × 640"]], viewport, value => { viewport = value; }),
);
const count = el("p", "gallery-count muted");
const cards = el("div", "gallery-cards"); cards.ariaLabel = "Page comparisons";
const empty = el("p", "gallery-empty muted", "No matching pages. Try a page name such as Story or Settings.");
host.append(header, intro, controls, count, cards, empty);
const order = ["welcome", "new-project", "story", "screens", "source", "branches", "characters-writing", "lorebook", "assets", "variables", "settings", "runtime", "studio-request", "character-notes"];
function draw() {
  cards.replaceChildren();
  const needle = search.value.trim().toLocaleLowerCase();
  const visible = [...screens].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)).filter(s => `${s.title} ${s.description}`.toLocaleLowerCase().includes(needle));
  for (const screen of visible) {
    const card = el("article", "gallery-card"); card.dataset.screen = screen.id;
    const title = el("div", "gallery-card-heading");
    title.append(el("h2", "", screen.title), el("span", "gallery-count-badge muted", `${screen.variants.length} layout${screen.variants.length === 1 ? "" : "s"}`));
    card.append(title, el("p", "muted", screen.description));
    const links = el("div", "gallery-layouts");
    for (const variant of screen.variants) {
      const revision = revisionFor(screen.approval, variant.id);
      const link = el("a", "gallery-layout-link");
      link.href = `/?${new URLSearchParams({ screen: screen.id, variant: variant.id, state: screen.states[0]!.id, theme, viewport })}`;
      link.append(el("span", "", variant.title), el("span", "muted", revisionStatus(screen.approval.record, revision)));
      links.append(link);
    }
    card.append(links); cards.append(card);
  }
  count.textContent = `${visible.length} of ${screens.length} pages · All actions use fictional browser samples`;
  empty.hidden = visible.length > 0;
  history.replaceState(null, "", `?${new URLSearchParams({ theme, viewport })}`);
}
search.oninput = draw; draw();
