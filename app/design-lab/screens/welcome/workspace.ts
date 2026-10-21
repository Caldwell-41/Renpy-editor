import type { LabContext } from "../../contracts.ts";
import { action, element, labPage } from "../../page.ts";
import { icon } from "../../../src/icons.ts";
import { projects, statusHelp, statusLabel, type SampleProject } from "./fixture.ts";
import "./styles.css";

export function mountWelcome(host: HTMLElement, context: LabContext, variant: "desk" | "shelf") {
  let recents = projects(context.state);
  let phase = context.state === "error" ? "error" : context.state === "loading" ? "loading" : "ready";
  let removed: { project: SampleProject; index: number } | undefined;
  const frame = labPage(host, context, {
    screen: "welcome", title: "Home", subtitle: variant === "desk" ? "Return desk" : "Project shelf", project: false,
  });
  frame.shell.classList.add("wh-shell", `wh-${variant}`);
  const layout = element("div", "wh-layout");
  const introduction = element("section", "wh-introduction");
  introduction.ariaLabel = "Start or open a project";
  const start = element("div", "wh-start");
  start.append(element("p", "eyebrow", "Visual Ren'Py authoring"), element("h2", "wh-welcome", recents.length ? "Pick up your story." : "Your first story starts here."));
  start.append(element("p", "wh-lede", recents.length ? "Open a recent project, or begin something new." : "Create a Loomlight project to write your first scene. You can also open an existing project."));
  const buttons = element("div", "wh-start-actions");
  const create = action("New project", () => frame.navigate("new-project"), true); create.prepend(icon("plus"));
  const open = action("Open Loomlight project", () => chooser(open)); open.prepend(icon("story"));
  buttons.append(create, open); start.append(buttons);
  introduction.append(start);
  const resume = element("div", "wh-resume-slot"); introduction.append(resume);
  const recent = element("section", "wh-recents"); recent.ariaLabel = "Recent projects";
  const top = element("div", "wh-list-heading");
  const title = element("h2", "", "Recent projects"); title.tabIndex = -1;
  const count = element("span", "wh-count"); top.append(title, count);
  const searchRow = element("div", "wh-search-row");
  const search = element("input", "wh-search"); search.type = "search"; search.placeholder = "Find a project by name or folder"; search.ariaLabel = "Find a project";
  const clear = action("Clear search", () => { search.value = ""; render(); search.focus(); }); clear.classList.add("wh-clear");
  searchRow.append(search, clear);
  const feedback = element("div", "wh-feedback"); feedback.role = "status"; feedback.ariaLive = "polite";
  const list = element("div", "wh-list");
  recent.append(top, searchRow, feedback, list);
  layout.append(introduction, recent); frame.content.append(layout);
  search.addEventListener("input", render);

  function modal(label: string, opener: HTMLElement) {
    const dialog = element("dialog", "lp-dialog wh-dialog"); dialog.ariaLabel = label;
    dialog.append(element("h2", "", label));
    dialog.onclose = () => { dialog.remove(); if (opener.isConnected) opener.focus(); else title.focus(); };
    frame.shell.append(dialog); return dialog;
  }
  function sampleOpened(project: SampleProject, opener: HTMLElement) {
    // Only the matching Last Tram sample navigates directly. Other fictional
    // projects retain their own identity before offering a separate Story preview.
    if (project.id === "tram") { frame.navigate("story"); return; }
    const dialog = modal("Project opened in sample", opener);
    dialog.append(element("p", "wh-dialog-project", project.title), element("p", "wh-path", project.path));
    dialog.append(element("p", "", "This fictional project is selected. The Story preview contains The Last Tram's sample scene."));
    dialog.append(action("Stay on Home", () => dialog.close()), action("Preview The Last Tram story", () => frame.navigate("story"), true));
    dialog.showModal();
  }
  function chooser(opener: HTMLElement) {
    const dialog = modal("Choose a sample project", opener);
    dialog.append(element("p", "", "This chooser uses fictional folders. It does not open your files."));
    const choices = element("div", "wh-choices");
    const choicesData = projects("populated");
    let selected = choicesData[0]!;
    for (const project of choicesData) {
      const label = element("label", "wh-choice");
      const radio = element("input"); radio.type = "radio"; radio.name = "sample-project"; radio.value = project.id; radio.checked = project.id === selected.id;
      radio.ariaLabel = project.title; radio.onchange = () => { selected = project; error.hidden = true; };
      const copy = element("span"); copy.append(element("strong", "", project.title), element("span", "wh-path", project.path));
      const badge = element("span", `wh-badge wh-${project.status}`, statusLabel[project.status]);
      label.append(radio, copy, badge); choices.append(label);
    }
    const error = element("p", "wh-error"); error.role = "alert"; error.hidden = true;
    const choose = action("Open sample project", () => {
      if (selected.status !== "available") {
        error.textContent = `${selected.title} could not be opened in this sample. ${statusHelp[selected.status]} Choose another sample above.`;
        error.hidden = false; choices.querySelector<HTMLInputElement>(`input[value="${selected.id}"]`)?.focus(); return;
      }
      dialog.close(); frame.status.textContent = `${selected.title} opened in sample`; sampleOpened(selected, opener);
    }, true);
    dialog.append(choices, error, action("Cancel", () => { dialog.close(); frame.status.textContent = "Open cancelled. Recent projects are unchanged."; }), choose);
    dialog.showModal();
  }
  function options(project: SampleProject, opener: HTMLElement) {
    const dialog = modal(`Project options for ${project.title}`, opener);
    dialog.append(element("p", "wh-path wh-full-path", project.path));
    dialog.append(element("p", `wh-badge wh-${project.status}`, statusLabel[project.status]), element("p", "", statusHelp[project.status]));
    dialog.append(element("p", "muted", "Remove only clears this entry from the fictional recent list. It does not delete the project."));
    dialog.append(action("Close", () => dialog.close()), action("Remove from recents", () => {
      const index = recents.findIndex(p => p.id === project.id);
      if (index < 0) return;
      removed = { project, index }; recents.splice(index, 1); dialog.close();
      render(); showRemoved(); title.focus();
    }));
    if (project.status === "missing") dialog.append(action("Choose a sample location", () => { dialog.close(); chooser(open); }));
    dialog.showModal();
  }
  function showRemoved() {
    if (!removed) return;
    feedback.replaceChildren(element("span", "", `${removed.project.title} removed from recents. Project not deleted.`));
    const undo = action("Undo removal", () => {
      if (!removed) return;
      const restored = removed.project; recents.splice(removed.index, 0, restored); removed = undefined;
      render(); feedback.textContent = `${restored.title} restored to recents.`; frame.status.textContent = "Recent entry restored in sample";
      list.querySelector<HTMLButtonElement>(`[data-project="${restored.id}"] .wh-options`)?.focus();
    }); feedback.append(undo); frame.status.textContent = "Recent entry removed in sample. Project not deleted.";
  }
  function renderResume() {
    resume.replaceChildren();
    if (phase !== "ready" || search.value.trim()) return;
    const project = recents.find(p => p.status === "available");
    if (!project) return;
    const card = element("section", "wh-resume"); card.ariaLabel = "Last available project";
    const mark = element("div", "wh-resume-mark"); mark.append(icon("story"));
    const copy = element("div", "wh-resume-copy");
    copy.append(element("p", "eyebrow", "Last opened"), element("h3", "", project.title), element("p", "wh-path", project.path), element("p", "wh-time", project.opened));
    const continueButton = action("Continue writing", () => sampleOpened(project, continueButton), true);
    continueButton.ariaLabel = `Continue ${project.title}`;
    continueButton.classList.add("wh-continue");
    card.append(mark, copy, continueButton); resume.append(card);
  }
  function render() {
    list.replaceChildren(); feedback.replaceChildren();
    clear.hidden = !search.value;
    search.disabled = phase !== "ready";
    const query = search.value.trim().toLocaleLowerCase();
    const matches = recents.filter(p => `${p.title} ${p.path}`.toLocaleLowerCase().includes(query));
    count.textContent = phase === "ready" ? `${matches.length}${query ? ` of ${recents.length}` : ""}` : "";
    renderResume();
    if (removed) showRemoved();
    if (phase !== "ready") {
      const box = element("div", "wh-message");
      if (phase === "error") {
        box.setAttribute("role", "alert"); box.append(icon("story"), element("h3", "", "Recent projects couldn't load"), element("p", "", "The sample recent list is unavailable. Retry, or open a project with the sample chooser. Your projects are unchanged."));
        box.append(action("Retry recent projects", () => { phase = "ready"; render(); frame.status.textContent = "Recent projects loaded in sample"; title.focus(); }, true));
      } else {
        box.append(element("span", "wh-loading", ""), element("h3", "", "Loading recent projects"), element("p", "", "Checking the fictional recent list. New project and Open remain available."));
        box.append(action("Finish sample loading", () => { phase = "ready"; render(); frame.status.textContent = "Recent projects loaded in sample"; title.focus(); }));
      }
      list.append(box); return;
    }
    if (!matches.length) {
      const box = element("div", "wh-message");
      box.append(icon("story"), element("h3", "", query ? "No matching projects" : "A place for your stories"));
      box.append(element("p", "", query ? `No recent project matches "${search.value}". Search a title or folder.` : "Projects you create or open will appear here."));
      if (query) box.append(action("Clear project search", () => { search.value = ""; render(); search.focus(); }));
      else box.append(action("Create your first project", () => frame.navigate("new-project"), true));
      list.append(box); return;
    }
    for (const project of matches) {
      const row = element("article", "wh-project"); row.dataset.project = project.id;
      const cover = element("div", `wh-cover wh-cover-${project.id}`); cover.ariaHidden = "true"; cover.append(icon("story"));
      const identity = element("div", "wh-identity");
      const projectButton = action(project.title, () => sampleOpened(project, projectButton));
      projectButton.className = "wh-project-name"; projectButton.disabled = project.status !== "available";
      const path = element("p", "wh-path", project.path); path.title = project.path;
      identity.append(projectButton, path);
      const metadata = element("div", "wh-metadata");
      metadata.append(element("span", `wh-badge wh-${project.status}`, statusLabel[project.status]), element("span", "wh-time", project.opened));
      const more = action("•••", () => options(project, more)); more.className = "wh-options icon-button"; more.ariaLabel = more.title = `Project options for ${project.title}`;
      row.append(cover, identity, metadata, more);
      list.append(row);
    }
  }
  render();
  if (phase === "error") frame.status.textContent = "Simulated recent-list failure. Retry is available.";
  else if (phase === "loading") frame.status.textContent = "Loading fictional recent projects";
}
