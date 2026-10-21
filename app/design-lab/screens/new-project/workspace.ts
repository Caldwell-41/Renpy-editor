import type { LabContext } from "../../contracts.ts";
import { action, element as el, labelled, labPage } from "../../page.ts";
import { icon } from "../../../src/icons.ts";
import { destination, fixture, folderError, folderFromTitle, locations, managedSdk, ratio, resolutionError, titleError, type Outcome, type SampleSdk } from "./fixture.ts";
import "./styles.css";

const steps = ["Project details", "Ren'Py SDK", "Game configuration", "Review & create"];
const stepCopy = ["Name the game and give its folder a home.", "Use the compatible engine for this project.", "Choose the dimensions of your game window.", "One last look before your story begins."];
type Result = "" | "creating" | "failed" | "open-error" | "success";

export function mountSetup(host: HTMLElement, context: LabContext, variant: "paced" | "sheet") {
  const setup = fixture(context.state);
  let step = context.state === "review" || context.state === "error" ? 4 : 1;
  let result: Result = context.state === "error" ? "failed" : "";
  let outcome: Outcome = context.state === "error" ? "create-error" : "success";
  let touched = false, attempted = false, installPhase = -1, createPhase = 0, operationToken = 0;
  let timer: number | undefined;
  let sdkMessage = "", sdkFailed = false;
  let dialog: HTMLDialogElement | undefined;
  let summaryRefresh = () => {}, sdkRefresh = () => {};
  const page = labPage(host, context, { screen: "new-project", title: "New project", subtitle: variant === "paced" ? "Paced wizard" : "Setup sheet", project: false, dirty: () => touched || result === "creating" || installPhase >= 0 });
  page.shell.classList.add("np-shell", `np-${variant}`);
  page.tools.append(action("Back to home", () => page.navigate("welcome")));
  const root = el("div", "np-workspace"); page.content.append(root);
  const body = el("div", "np-body");
  const footer = el("div", "np-actions");
  let proceed: HTMLButtonElement;

  function status(text: string, error = false) { page.status.textContent = text; page.status.dataset.error = String(error); }
  function changed() {
    touched = true; summaryRefresh(); syncProceed();
    if (page.status.dataset.error === "true") status("Sample setup updated. Review the field messages.");
  }
  function labelNote(text: string, className = "") { return el("p", `np-note ${className}`, text); }
  function button(label: string, callback: () => void, primary = false) { return action(label, callback, primary); }
  function sectionHeading(number: number, heading: string, copy: string) {
    const head = el("div", "np-section-heading");
    head.append(el("span", "np-section-number", String(number)), el("div", "np-section-copy"));
    head.lastElementChild!.append(el("h2", "", heading), labelNote(copy)); return head;
  }
  function invalidAt(index: number) {
    if (index === 1) return titleError(setup) || folderError(setup) || (!setup.parent ? "Choose a sample parent folder." : "");
    if (index === 2) return setup.sdk?.compatible ? "" : "Choose a compatible Ren'Py 8.5.3 sample SDK.";
    return resolutionError(setup);
  }
  function syncProceed() {
    if (!proceed) return;
    proceed.disabled = installPhase >= 0 || result === "creating" || (variant === "paced" && step === 2 && !setup.sdk?.compatible);
    const back = footer.querySelector<HTMLButtonElement>("button");
    if (back && back !== proceed) back.disabled = installPhase >= 0;
    root.querySelectorAll<HTMLButtonElement>(".np-step-rail>button").forEach((control, index) => { control.disabled = index + 1 > step || result === "creating" || installPhase >= 0; });
  }
  function goTo(index: number, focus = true) {
    step = index; result = ""; attempted = false; render();
    if (focus) {
      const target = variant === "sheet" && index < 4 ? body.querySelectorAll<HTMLElement>(".np-form>.np-section")[index - 1] : body;
      const control = target?.querySelector<HTMLElement>("input,select,button"); control?.focus({ preventScroll: true });
      if (variant === "sheet" && index < 4) target?.scrollIntoView({ block: "start" }); else body.scrollTop = 0;
    }
  }
  function validateAll() {
    for (const index of [1, 2, 3]) if (invalidAt(index)) { step = index; result = ""; attempted = true; render(); status(invalidAt(index), true); body.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); return false; }
    return true;
  }
  function advance() {
    attempted = true;
    if (variant === "sheet" || step === 4) { if (!validateAll()) return; if (step === 4 && variant === "paced") createSample(); else { step = 4; render(); } return; }
    if (invalidAt(step)) { render(); status(invalidAt(step), true); body.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); return; }
    goTo(step + 1);
  }
  function sampleDialog(title: string, copy: string) {
    dialog?.close();
    const d = el("dialog", "lp-dialog np-dialog"); d.ariaLabel = title;
    const prior = document.activeElement as HTMLElement;
    d.append(el("h2", "", title), labelNote(copy));
    d.onclose = () => { d.remove(); if (dialog === d) dialog = undefined; if (prior?.isConnected) prior.focus(); };
    page.shell.append(d); dialog = d; d.showModal(); return d;
  }
  function chooseParent() {
    const d = sampleDialog("Choose a fictional parent folder", "These sample locations do not open a system picker or read your computer.");
    for (const path of locations) {
      const choice = button(path, () => { setup.parent = path; d.close(); touched = true; render(); status("Sample destination selected."); });
      choice.classList.add("np-location-choice"); choice.prepend(icon("source")); d.append(choice);
    }
    d.append(button("Cancel sample selection", () => d.close()));
  }
  function detailsSection() {
    const section = el("section", "np-section np-details"); section.ariaLabel = "Project details";
    section.append(sectionHeading(1, "Project details", "Your game title can be different from its folder name."));
    const title = el("input"); title.value = setup.title; title.autocomplete = "off"; title.placeholder = "Give your game a title";
    const folder = el("input"); folder.value = setup.folder; folder.autocomplete = "off"; folder.spellcheck = false; folder.placeholder = "your-game";
    const titleField = labelled("Game title", title);
    const titleNotice = el("span", "np-field-error"); titleNotice.id = "np-title-error"; titleNotice.ariaLive = "polite"; titleField.append(titleNotice);
    const folderField = labelled("Folder name", folder, "Letters, numbers, hyphens and underscores. Up to 80 characters.");
    const folderNotice = el("span", "np-field-error"); folderNotice.id = "np-folder-error"; folderNotice.ariaLive = "polite"; folderField.append(folderNotice);
    const location = el("div", "np-location"); const locationText = el("span", "np-location-text", setup.parent || "No sample folder selected");
    const choose = button("Choose sample folder…", chooseParent); location.append(locationText, choose);
    const destinationBox = el("div", "np-destination"); destinationBox.append(el("span", "np-overline", "Final sample destination"));
    const path = el("p", "np-path"); const availability = labelNote(""); destinationBox.append(path, availability);
    function sync() {
      const t = attempted || title.value ? titleError(setup) : "";
      const f = attempted || folder.value ? folderError(setup) : "";
      titleNotice.textContent = t; folderNotice.textContent = f;
      title.ariaInvalid = String(Boolean(t)); folder.ariaInvalid = String(Boolean(f));
      title.setAttribute("aria-describedby", titleNotice.id); folder.setAttribute("aria-describedby", folderNotice.id);
      path.textContent = destination(setup);
      availability.textContent = f || (!setup.parent ? "Choose from the fictional locations above." : "Available in the sample. No real folder is checked.");
      availability.dataset.error = String(Boolean(f));
    }
    title.oninput = () => { setup.title = title.value; if (!setup.folderEdited) { setup.folder = title.value ? folderFromTitle(title.value) : ""; folder.value = setup.folder; } sync(); changed(); };
    folder.oninput = () => { setup.folder = folder.value; setup.folderEdited = true; sync(); changed(); };
    sync();
    section.append(titleField, folderField, el("div", "np-label", "Parent folder"), location, destinationBox);
    if (attempted && !setup.parent) section.append(labelNote("Choose a sample parent folder.", "np-error"));
    return section;
  }
  function browseSdk() {
    const d = sampleDialog("Choose a fictional SDK", "This is a sample list. Loomlight does not inspect or execute an SDK in Design Lab.");
    const choices: SampleSdk[] = [
      { id: "browsed", version: "8.5.3", source: "Sample downloads / renpy-8.5.3-sdk", compatible: true },
      { id: "old", version: "8.4.1", source: "Sample archive / renpy-8.4.1-sdk", compatible: false },
    ];
    for (const sdk of choices) {
      const row = button(`Choose sample Ren'Py ${sdk.version}`, () => {
        if (!setup.sdks.some(s => s.id === sdk.id)) setup.sdks.push(sdk);
        setup.sdk = sdk.compatible ? sdk : undefined;
        sdkMessage = sdk.compatible ? "Compatible sample SDK selected." : "Ren'Py 8.4.1 is incompatible. This project requires 8.5.3."; sdkFailed = !sdk.compatible;
        d.close(); touched = true; render(); status(sdkMessage, sdkFailed);
      }); row.classList.add("np-sdk-choice");
      row.ariaLabel = `Choose sample Ren'Py ${sdk.version}`;
      row.append(labelNote(`${sdk.source} · ${sdk.compatible ? "Compatible" : "Incompatible"}`)); d.append(row);
    }
    d.append(button("Cancel sample selection", () => d.close()));
  }
  function installSample() {
    if (installPhase >= 0) return;
    const token = ++operationToken; installPhase = 0; sdkFailed = false; sdkMessage = ""; touched = true;
    sdkRefresh(); syncProceed(); status("Simulating SDK download…");
    function tick() {
      if (token !== operationToken) return;
      installPhase++;
      if (installPhase === 3 && outcome === "checksum") {
        installPhase = -1; sdkFailed = true; sdkMessage = "Sample checksum mismatch. Installation stopped before extraction. Your project details are kept.";
        sdkRefresh(); syncProceed(); status("Sample SDK verification failed. Nothing was installed.", true); return;
      }
      if (installPhase > 4) {
        installPhase = -1; const sdk = managedSdk(); if (!setup.sdks.some(s => s.id === sdk.id)) setup.sdks.push(sdk); setup.sdk = sdk;
        sdkMessage = "Sample download, checksum verification and installation complete. Nothing was downloaded.";
        sdkRefresh(); summaryRefresh(); syncProceed(); status("Sample SDK ready."); return;
      }
      sdkRefresh(); timer = window.setTimeout(tick, 450);
    }
    timer = window.setTimeout(tick, 450);
  }
  function sdkSection() {
    const section = el("section", "np-section np-sdk"); section.ariaLabel = "Ren'Py SDK";
    section.append(sectionHeading(2, "Ren'Py SDK", "This project supports exactly Ren'Py 8.5.3."));
    const current = el("div", "np-sdk-content"); section.append(current);
    sdkRefresh = () => {
      current.replaceChildren();
      if (installPhase >= 0) {
        const progress = el("div", "np-progress"); progress.ariaLabel = "Simulated SDK installation";
        const downloading = installPhase < 3;
        const phase = downloading ? "Downloading sample archive" : installPhase === 3 ? "Verifying published checksum" : "Extracting sample SDK";
        progress.append(el("span", "np-badge", "Simulation"), el("h3", "", phase));
        const bar = el("progress"); bar.max = 128; if (downloading) bar.value = [16, 64, 128][installPhase]!;
        bar.ariaLabel = "Sample download progress"; progress.append(bar, labelNote(downloading ? `${[16, 64, 128][installPhase]} / 128 MiB · illustrative sample bytes` : "No overall percentage is assigned to this stage."));
        progress.append(button("Cancel sample install", () => { operationToken++; clearTimeout(timer); installPhase = -1; sdkMessage = "Sample install cancelled. Your earlier SDK selection and form values are kept."; sdkFailed = false; sdkRefresh(); syncProceed(); status("Sample SDK install cancelled."); }));
        current.append(progress); return;
      }
      if (!setup.sdks.length) {
        const empty = el("div", "np-sdk-empty"); empty.append(icon("source"), el("strong", "", "No sample SDK is ready yet"), labelNote("Install the fictional managed SDK or choose one from the sample list.")); current.append(empty);
      }
      for (const sdk of setup.sdks) {
        const row = el("label", "np-sdk-row"); row.dataset.selected = String(setup.sdk?.id === sdk.id);
        const radio = el("input"); radio.type = "radio"; radio.name = "sample-sdk"; radio.checked = setup.sdk?.id === sdk.id; radio.disabled = !sdk.compatible; radio.ariaLabel = `Use ${sdk.source}`;
        radio.onchange = () => { setup.sdk = sdk; sdkFailed = false; sdkMessage = ""; sdkRefresh(); changed(); };
        const copy = el("div", "np-sdk-copy"); copy.append(el("strong", "", `Ren'Py ${sdk.version}`), labelNote(sdk.source));
        copy.append(labelNote(sdk.compatible ? "Compatible with this project" : "Unsupported version. Requires 8.5.3.", sdk.compatible ? "" : "np-error"));
        row.append(radio, copy, el("span", "np-badge", sdk.compatible ? "Ready" : "Incompatible")); current.append(row);
      }
      const actions = el("div", "np-secondary-actions");
      actions.append(button("Install sample 8.5.3", installSample, !setup.sdk), button("Browse sample SDKs…", browseSdk)); current.append(actions);
      if (sdkMessage) { const notice = labelNote(sdkMessage, sdkFailed ? "np-error" : "np-feedback"); notice.role = sdkFailed ? "alert" : "status"; current.append(notice); }
      if (attempted && !setup.sdk && !sdkMessage) current.append(labelNote(invalidAt(2), "np-error"));
    };
    sdkRefresh(); return section;
  }
  function configurationSection() {
    const section = el("section", "np-section np-configuration"); section.ariaLabel = "Game configuration";
    section.append(sectionHeading(3, "Game configuration", "Game resolution, not editor size."));
    const preset = el("select");
    for (const [value, title] of [["1920x1080", "Full HD · 1920 × 1080"], ["1280x720", "HD · 1280 × 720"], ["2560x1440", "QHD · 2560 × 1440"], ["custom", "Custom dimensions"]]) {
      const option = el("option", "", title); option.value = value!; preset.append(option);
    }
    preset.value = setup.custom ? "custom" : `${setup.width}x${setup.height}`;
    const width = el("input"), height = el("input"); width.type = height.type = "number";
    width.value = setup.width; height.value = setup.height; width.min = "640"; width.max = "7680"; height.min = "360"; height.max = "4320"; width.step = height.step = "2";
    const dimensions = el("div", "np-dimensions"); dimensions.append(labelled("Width", width), labelled("Height", height)); dimensions.hidden = !setup.custom;
    const preview = el("div", "np-resolution-preview"); const stage = el("div", "np-resolution-stage"); stage.ariaHidden = "true";
    const screen = el("div", "np-resolution-screen"); stage.append(screen);
    const copy = el("div"); const ratioText = el("strong", "np-ratio"); const pixels = labelNote(""); copy.append(ratioText, pixels); preview.append(stage, copy);
    const error = labelNote("", "np-field-error"); error.id = "np-dimensions-error"; error.ariaLive = "polite";
    width.setAttribute("aria-describedby", error.id); height.setAttribute("aria-describedby", error.id);
    function sync() {
      const invalid = resolutionError(setup); error.textContent = invalid;
      width.ariaInvalid = height.ariaInvalid = String(Boolean(invalid));
      screen.hidden = Boolean(invalid); screen.style.width = `${Number(setup.width) * Math.min(148 / Number(setup.width), 88 / Number(setup.height))}px`; screen.style.height = `${Number(setup.height) * Math.min(148 / Number(setup.width), 88 / Number(setup.height))}px`;
      ratioText.textContent = invalid ? "Preview unavailable" : ratio(setup);
      pixels.textContent = invalid ? "Enter valid width and height." : `${setup.width} × ${setup.height} pixels`;
    }
    preset.onchange = () => { setup.custom = preset.value === "custom"; dimensions.hidden = !setup.custom; if (!setup.custom) { [setup.width, setup.height] = preset.value.split("x") as [string, string]; width.value = setup.width; height.value = setup.height; } sync(); changed(); };
    width.oninput = () => { setup.width = width.value; sync(); changed(); }; height.oninput = () => { setup.height = height.value; sync(); changed(); };
    sync(); section.append(labelled("Resolution preset", preset), dimensions, preview, error);
    return section;
  }
  function gitOptions() {
    const advanced = el("details", "np-advanced"); advanced.append(el("summary", "", "Advanced"));
    const git = el("input"); git.type = "checkbox"; git.checked = setup.git; git.ariaLabel = "Initialize local Git repository";
    const label = el("label", "np-git"); const copy = el("span"); copy.append(el("strong", "", "Initialize local Git repository"), labelNote("Keep the existing default. This sample never runs Git."));
    label.append(git, copy); advanced.append(label);
    git.onchange = () => { setup.git = git.checked; changed(); }; return advanced;
  }
  function facts(editable: boolean) {
    const facts = el("dl", "np-facts");
    const rows: [string, string, number][] = [["Game title", setup.title || "Untitled game", 1], ["Final destination", destination(setup), 1], ["Ren'Py SDK", setup.sdk ? `8.5.3 · ${setup.sdk.source}` : "Choose a compatible SDK", 2], ["Game window", `${setup.width || "?"} × ${setup.height || "?"}${ratio(setup) ? ` · ${ratio(setup)}` : ""}`, 3], ["Local Git", setup.git ? "Initialize repository" : "Not enabled", 4]];
    for (const [label, value, index] of rows) {
      const row = el("div", "np-fact"); row.append(el("dt", "", label), el("dd", "", value));
      if (editable && index !== 4) { const edit = button("Edit", () => goTo(index)); edit.ariaLabel = `Edit ${label.toLowerCase()}`; edit.classList.add("np-text-button"); row.append(edit); }
      facts.append(row);
    }
    return facts;
  }
  function sidebar() {
    const aside = el("aside", "np-summary"); aside.ariaLabel = "Project at a glance";
    const refresh = () => {
      aside.replaceChildren(); aside.append(el("span", "np-overline", "Your project"));
      const emblem = el("div", "np-project-emblem"); emblem.append(icon("story"));
      aside.append(emblem, el("h3", "", setup.title || "A new story"), labelNote("Fictional project · Ren'Py"));
      aside.append(facts(false), labelNote("No folders, SDKs or Git repositories are created in this preview.", "np-sample-note"));
    };
    summaryRefresh = refresh; refresh(); return aside;
  }
  function reviewSection() {
    const section = el("section", "np-section np-review"); section.ariaLabel = "Review project";
    section.append(sectionHeading(4, "Review & create", "Check the details. You can still change anything."));
    const liveFacts = el("div"); liveFacts.append(facts(true)); section.append(liveFacts, gitOptions());
    summaryRefresh = () => liveFacts.replaceChildren(facts(true));
    const notice = el("div", "np-review-notice"); notice.prepend(icon("story")); notice.append(labelNote("The sample creation flow will prepare a game, validate it, then offer a browser workspace preview. Nothing is written to disk.")); section.append(notice);
    return section;
  }
  function outcomeControls() {
    const details = el("details", "np-outcomes"); details.append(el("summary", "", "Try a sample outcome"));
    const select = el("select");
    for (const [value, label] of [["success", "Successful sample"], ["checksum", "SDK checksum mismatch"], ["create-error", "Project creation failure"], ["open-error", "Created, could not open"]]) { const option = el("option", "", label); option.value = value!; select.append(option); }
    select.value = outcome; select.onchange = () => { outcome = select.value as Outcome; status("Sample outcome changed. Your setup is kept."); };
    details.append(labelled("Sample outcome", select), labelNote("Review controls for this prototype. Choose a result, then try Install or Create sample.")); return details;
  }
  function renderResult() {
    const section = el("section", "np-section np-result"); section.ariaLabel = "Sample creation result";
    if (result === "creating") {
      section.append(el("span", "np-badge", "Simulation"), el("h2", "", "Creating your sample project"), labelNote(setup.title));
      const stages = ["Prepare destination", "Generate Ren'Py game", ...(setup.git ? ["Initialize local Git"] : []), "Validate game", "Finalise project", "Open workspace"];
      const list = el("ol", "np-stage-list");
      stages.forEach((name, index) => { const li = el("li"); li.dataset.state = index < createPhase ? "complete" : index === createPhase ? "active" : "waiting"; li.append(el("span", "np-stage-marker", index < createPhase ? "✓" : String(index + 1)), el("span", "", name)); list.append(li); });
      const progress = el("progress"); progress.ariaLabel = "Sample creation in progress";
      section.append(list, progress, labelNote("Illustrative stages. Creation has no overall percentage."));
    } else {
      const failed = result === "failed";
      section.append(el("span", `np-result-symbol ${failed ? "np-error" : ""}`, failed ? "!" : "✓"), el("h2", "", failed ? "The sample could not be created" : result === "open-error" ? "Created, but could not open" : "Your sample project is ready"));
      const copy = failed ? "Sample validation failed. Your title, destination, SDK and game configuration are kept. Return to review to try again." : result === "open-error" ? "The fictional project finished creation, but the sample open step failed. Open the sample workspace explicitly; do not create it again." : "The fictional creation flow is complete. Open the browser Story draft to continue exploring.";
      const notice = labelNote(copy, failed ? "np-error" : ""); if (failed) notice.role = "alert";
      section.append(notice, facts(false));
    }
    body.append(section);
  }
  function createSample() {
    if (result === "creating" || !validateAll()) return;
    const token = ++operationToken; result = "creating"; createPhase = 0; render(); status("Creating sample project…");
    const count = setup.git ? 6 : 5;
    function tick() {
      if (token !== operationToken) return;
      createPhase++;
      if (outcome === "create-error" && createPhase === count - 2) { result = "failed"; render(); status("Sample creation failed. Form values are kept.", true); return; }
      if (createPhase >= count) { result = outcome === "open-error" ? "open-error" : "success"; touched = false; render(); status(result === "open-error" ? "Sample created; open step failed." : "Sample project ready. No real files were created.", result === "open-error"); return; }
      render(); timer = window.setTimeout(tick, 320);
    }
    timer = window.setTimeout(tick, 320);
  }
  function render() {
    summaryRefresh = () => {}; sdkRefresh = () => {};
    root.replaceChildren(); root.dataset.step = String(step); root.dataset.result = result;
    const panel = el("div", "np-panel"); body.replaceChildren(); footer.replaceChildren();
    const paneHeading = el("div", "np-pane-heading");
    if (!result) {
      paneHeading.append(el("span", "np-overline", step === 4 ? "Ready when you are" : variant === "paced" ? `New project · Step ${step} of 4` : "A new story"), el("h2", "", variant === "sheet" && step !== 4 ? "Set up your game" : steps[step - 1]!));
      paneHeading.append(labelNote(variant === "sheet" && step !== 4 ? "Everything you need, with a review before creation." : stepCopy[step - 1]!));
    }
    if (variant === "paced") {
      const rail = el("nav", "np-step-rail"); rail.ariaLabel = "New project steps";
      rail.append(el("span", "np-overline", "Create a project"));
      steps.forEach((title, index) => {
        const item = button(title, () => { if (index + 1 < step) goTo(index + 1); });
        item.prepend(el("span", "np-step-number", index + 1 < step ? "✓" : String(index + 1)));
        item.disabled = index + 1 > step || result === "creating" || installPhase >= 0;
        if (index + 1 === step) item.ariaCurrent = "step"; rail.append(item);
      });
      rail.append(labelNote("Browser sample\nNothing is created on your computer.", "np-rail-note")); root.append(rail);
    }
    if (!result) {
      const grid = el("div", "np-edit-grid"); const form = el("div", "np-form");
      if (step === 4) form.append(reviewSection());
      else if (variant === "sheet") form.append(detailsSection(), sdkSection(), configurationSection(), gitOptions());
      else form.append(step === 1 ? detailsSection() : step === 2 ? sdkSection() : configurationSection());
      grid.append(form);
      if (step !== 4 && (variant === "sheet" || step === 1)) grid.append(sidebar());
      body.append(paneHeading, grid, outcomeControls());
    } else renderResult();
    if (result === "failed") {
      footer.append(button("Back to review", () => { result = ""; step = 4; render(); }));
      footer.append(labelNote("Your setup is kept.", "np-footer-copy"));
    } else if (result === "open-error" || result === "success") {
      footer.append(button("Back to home", () => page.navigate("welcome")), button("Open sample workspace", () => page.navigate("story"), true));
    } else if (result === "creating") {
      const busy = button("Creating sample…", () => {}, true); busy.disabled = true; footer.append(labelNote("Please wait for the sample result."), busy);
    } else {
      const back = button(step === 1 ? "Back to home" : variant === "sheet" ? "Edit setup" : "Back", () => { if (step === 1) page.navigate("welcome"); else goTo(variant === "sheet" ? 1 : step - 1); });
      back.disabled = installPhase >= 0;
      proceed = button(step === 4 ? "Create sample project" : variant === "sheet" ? "Review project" : "Continue", () => { if (step === 4) { if (validateAll()) createSample(); } else advance(); }, true);
      footer.append(back, proceed); syncProceed();
    }
    panel.append(body, footer); root.append(panel);
  }
  render();
  if (result === "failed") status("Sample creation failed. Your setup is kept.", true);
  return () => { operationToken++; clearTimeout(timer); dialog?.close(); };
}
