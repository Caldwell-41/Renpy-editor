import "../src/styles.css";
import "../src/ui-refresh.css";
import "./lab.css";
import { screens, selection, viewports } from "./registry.ts";
import { referenceStatus, revisionFor, revisionStatus } from "./approval.ts";

const host = document.querySelector<HTMLElement>("#lab")!;

function chooser(title: string, key: string, options: readonly { id: string; title: string }[], current: string): HTMLLabelElement {
  const label = document.createElement("label");
  label.append(title);
  const select = document.createElement("select");
  select.ariaLabel = title;
  for (const item of options) select.add(new Option(item.title, item.id, false, current === item.id));
  select.addEventListener("change", () => {
    const query = new URLSearchParams(location.search);
    query.set(key, select.value);
    if (key === "screen") { query.delete("variant"); query.delete("state"); }
    location.search = query.toString();
  });
  label.append(select);
  return label;
}

try {
  if (import.meta.env.LOOMLIGHT_DESIGN_LAB !== true) throw new Error("Start this preview with npm run design:dev from app/.");
  const { screen, variant, state, viewport, theme } = selection(location.search);
  document.documentElement.dataset.theme = theme;
  const header = document.createElement("header");
  header.className = "lab-header";
  const title = document.createElement("h1");
  title.textContent = "Loomlight Design Lab";
  const notice = document.createElement("p");
  notice.textContent = `${screen.kind === "prototype" ? "Prototype" : "Production component preview"} · Sample data · ${screen.description}`;
  const revision = revisionFor(screen.approval, variant.id);
  const status = referenceStatus(screen.approval, revision, { state: state.id, theme, ...viewport });
  const approvalStatus = document.createElement("p");
  approvalStatus.className = "lab-approval";
  approvalStatus.dataset.approval = revisionStatus(screen.approval.record, revision).toLowerCase();
  approvalStatus.setAttribute("role", "status");
  approvalStatus.ariaLabel = "Design approval";
  approvalStatus.textContent = `${status} · ${revision.id}`;
  const approved = screen.approval.record.revisions.find(item => item.id === screen.approval.record.currentApproved);
  const current = document.createElement("p");
  current.className = "lab-current-approval";
  if (approved) {
    const link = document.createElement("a");
    link.textContent = `Current approved layout: ${approved.id}`;
    const query = new URLSearchParams(location.search);
    query.set("variant", approved.variantId);
    link.href = `/?${query}`;
    current.append(link);
  } else current.textContent = "No approved layout";
  const history = document.createElement("details");
  history.className = "lab-history";
  const summary = document.createElement("summary");
  summary.textContent = "Approval history";
  const recordPath = document.createElement("p");
  recordPath.textContent = screen.approval.path;
  const entries = document.createElement("ul");
  for (const item of screen.approval.record.revisions) {
    const entry = document.createElement("li");
    const approval = item.approval;
    const successor = screen.approval.record.revisions.find(candidate => candidate.approval?.supersedes === item.id);
    entry.textContent = `${item.id} · ${revisionStatus(screen.approval.record, item)}` + (approval
      ? ` · Approved ${approval.date} · ${approval.decision}${approval.supersedes ? ` · Replaces ${approval.supersedes}` : ""}${approval.reason ? ` · ${approval.reason}` : ""} · Source ${approval.source.commit}` : "") +
      (successor ? ` · Superseded by ${successor.id} on ${successor.approval!.date}${successor.approval!.reason ? ` · ${successor.approval!.reason}` : ""}` : "");
    entries.append(entry);
  }
  history.append(summary, recordPath, entries);
  const controls = document.createElement("nav");
  controls.ariaLabel = "Preview controls";
  controls.append(
    chooser("Screen", "screen", screens.map(item => ({ id: item.id, title: item.title })), screen.id),
    chooser("Layout", "variant", screen.variants.map(item => ({ id: item.id,
      title: `${item.title} · ${revisionStatus(screen.approval.record, revisionFor(screen.approval, item.id))}` })), variant.id),
    chooser("Sample state", "state", screen.states, state.id),
    chooser("Theme", "theme", [{ id: "light", title: "Light" }, { id: "dark", title: "Dark" }], theme),
    chooser("Viewport", "viewport", viewports, viewport.id),
  );
  const preview = document.createElement("iframe");
  preview.title = "Screen preview";
  preview.width = String(viewport.width);
  preview.height = String(viewport.height);
  preview.src = `/preview.html${location.search}`;
  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "button";
  reset.textContent = "Reset sample";
  reset.addEventListener("click", () => preview.contentWindow?.location.reload());
  const direct = document.createElement("a");
  direct.textContent = "Open preview on its own";
  direct.href = preview.src;
  direct.target = "_blank";
  direct.rel = "noopener";
  controls.append(reset, direct);
  const gallery = document.createElement("a");
  gallery.textContent = "Browse all pages";
  gallery.href = `/catalog.html?${new URLSearchParams({ theme, viewport: viewport.id })}`;
  controls.append(gallery);
  header.append(title, notice, approvalStatus, current, controls, history);
  const stage = document.createElement("main");
  stage.className = "lab-stage";
  stage.append(preview);
  host.append(header, stage);
} catch (error) {
  host.textContent = error instanceof Error ? error.message : "Design Lab could not be opened.";
  const home = document.createElement("a");
  home.href = "/";
  home.textContent = "Open the example";
  host.append(document.createElement("br"), home);
}
