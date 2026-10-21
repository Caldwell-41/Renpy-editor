import type { LabContext } from "../../contracts.ts";
import { action, element as el, labelled, labPage } from "../../page.ts";
import { icon } from "../../../src/icons.ts";
import { profiles, sampleCompletion, sampleMessage, stages } from "./fixture.ts";
import "./style.css";

export function mountRequest(host: HTMLElement, context: LabContext, variant: "console" | "desk") {
  let saved = context.state === "empty" ? [] : profiles(context.state === "long");
  let selected = saved[0]?.id ?? "", active = false, closed = false, stage = -1, done = false;
  let resultState = context.state === "error" ? "failed" : context.state === "long" ? "completed" : "ready";
  let resultProfile = saved[0]?.label ?? "", outcome = "success", resultOutcome = "success", cancelledOnce = false, loadCount = 0;
  let requestProfile = saved[0], requestDeadline = "600", needsReload = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let profileLoading = false;
  const frame = labPage(host, context, { screen: "studio-request", title: "Studio request", subtitle: variant === "console" ? "Request console" : "Request desk", dirty: () => active });
  frame.shell.classList.add("sr-shell");
  const close = action("Close panel", closePanel); frame.tools.append(close);
  const layout = el("div", `sr-layout sr-${variant}`);
  const introduction = el("div", "sr-introduction");
  const introMark = el("span", "sr-mark"); introMark.append(icon("source"));
  const introText = el("div"); introText.append(el("h2", "", "Check a Studio connection"), el("p", "muted", "Send a fixed synthetic message. Your project content stays out of this request."));
  introduction.append(introMark, introText, el("span", "sr-sample-badge", "Browser simulation"));

  const request = el("section", "sr-card sr-request"); request.ariaLabel = "Sample request setup";
  const requestHeading = el("div", "sr-section-heading");
  const headingCopy = el("div"); headingCopy.append(el("span", "sr-overline", "01 · Request"), el("h2", "", "Choose a saved profile"));
  const reload = action("Reload profiles", reloadProfiles); reload.classList.add("sr-quiet"); requestHeading.append(headingCopy, reload);
  const selection = el("select"); selection.ariaLabel = "Saved request profile";
  const deadline = el("input"); deadline.type = "number"; deadline.min = "30"; deadline.max = "1800"; deadline.step = "1"; deadline.value = "600";
  deadline.ariaLabel = "Response deadline in seconds";
  const profileForm = el("div", "sr-profile-form");
  const profileLabel = labelled("Saved profile", selection);
  const deadlineLabel = labelled("Response deadline", deadline, "30 to 1,800 seconds");
  const deadlineUnit = el("span", "sr-input-unit", "seconds"); deadlineLabel.insertBefore(deadlineUnit, deadlineLabel.lastChild);
  profileForm.append(profileLabel, deadlineLabel);
  const profileInfo = el("div", "sr-profile-info");
  const profileState = el("p", "sr-profile-state"); profileState.role = "status";
  const model = el("p", "sr-model"); const endpoint = el("code", "sr-endpoint");
  const budget = el("p", "sr-budget muted");
  const profileDetails = el("details", "sr-details sr-profile-details"); profileDetails.append(el("summary", "", "Saved profile details"), endpoint, budget);
  const settings = action("Open profile settings", () => frame.navigate("settings")); settings.classList.add("sr-settings-link");
  profileInfo.append(profileState, model, profileDetails, settings);
  const message = el("section", "sr-message");
  message.append(el("div", "sr-message-heading", "Fixed synthetic message"), el("p", "sr-message-text", sampleMessage));
  const safeguards = el("div", "sr-safeguards");
  for (const text of ["No project content", "Thinking off", "Tools off"]) safeguards.append(el("span", "", text));
  message.append(safeguards);
  const validation = el("p", "sr-validation"); validation.id = "sr-deadline-error"; validation.role = "alert";
  deadline.setAttribute("aria-describedby", "sr-deadline-error");
  const actions = el("div", "sr-request-actions");
  const send = action("Send sample request", start, true); send.prepend(icon("source"));
  const cancel = action("Cancel request", cancelRequest); actions.append(send, cancel);
  const explicit = el("p", "sr-explicit muted", "Only Send starts a sample. No project content is included.");
  const launchbar = el("div", "sr-launchbar"); launchbar.append(explicit, actions);
  request.append(requestHeading, profileForm, profileInfo, message, validation);

  const result = el("section", "sr-card sr-result"); result.ariaLabel = "Sample response";
  const resultHeading = el("div", "sr-section-heading");
  const resultCopy = el("div"); resultCopy.append(el("span", "sr-overline", "02 · Response"), el("h2", "", "Read the result"));
  const resultBadge = el("span", "sr-result-badge", "Not sent"); resultHeading.append(resultCopy, resultBadge);
  const progress = el("ol", "sr-progress"); progress.ariaLabel = "Request progress";
  const stageRows = stages.map((item, index) => {
    const row = el("li"); row.dataset.stage = item.id;
    row.append(el("span", "sr-stage-number", String(index + 1)), el("span", "", item.short)); progress.append(row); return row;
  });
  const feedback = el("div", "sr-feedback"); feedback.role = "status"; feedback.ariaLive = "polite";
  const feedbackTitle = el("h3"); const feedbackText = el("p"); feedback.append(feedbackTitle, feedbackText);
  const resultSource = el("p", "sr-result-source muted");
  const completion = el("pre", "sr-completion"); completion.ariaLabel = "Sample completion text";
  const resultSummary = el("div", "sr-result-summary");
  const contextWarning = el("p", "sr-context-warning");
  const technical = el("details", "sr-details sr-technical"); technical.append(el("summary", "", "Request details · timing, HTTP, usage & context"));
  const technicalData = el("dl", "sr-technical-data"); technical.append(technicalData);
  result.append(resultHeading, progress, feedback, resultSource, completion, resultSummary, contextWarning, technical);

  const simulation = el("details", "sr-details sr-simulation"); simulation.append(el("summary", "", "Sample controls"));
  const simulator = el("div", "sr-simulator");
  const outcomeSelect = el("select"); outcomeSelect.ariaLabel = "Next sample outcome";
  for (const [value, text] of [["success", "Successful response"], ["unknown", "Response with unknown usage"], ["refusal", "Provider refusal"], ["transport", "Transport error"], ["expired", "Deadline expired"], ["configuration", "Configuration changed"], ["observation", "Status observation failed"], ["cleanup", "First cancellation fails"]] as const) {
    const option = el("option", "", text); option.value = value; outcomeSelect.append(option);
  }
  outcomeSelect.onchange = () => { outcome = outcomeSelect.value; };
  const loadSample = action("Load fictional profiles", () => { saved = profiles(); selected = "writing"; renderProfiles(); draw(); frame.status.textContent = "Fictional profiles loaded. No saved settings were read."; });
  simulator.append(labelled("Next sample outcome", outcomeSelect), loadSample, el("p", "muted", "These controls choose browser fixtures. They do not contact a provider, read profiles or change credentials.")); simulation.append(simulator);
  const closedView = el("section", "sr-closed sr-card"); closedView.hidden = true;
  const closedText = el("p"); closedView.append(el("h2", "", "Request panel closed"), closedText, action("Reopen sample panel", () => { closed = false; closedView.hidden = true; layout.hidden = false; close.disabled = false; draw(); }));
  layout.append(introduction, request, result, simulation); frame.content.append(layout, closedView); frame.main.append(launchbar);

  function current() { return saved.find(p => p.id === selected); }
  function renderProfiles() {
    selection.replaceChildren();
    if (!saved.length) { const option = el("option", "", "No saved profiles"); option.value = ""; selection.append(option); }
    for (const p of saved) { const option = el("option", "", p.label); option.value = p.id; selection.append(option); }
    selection.value = selected;
  }
  function validDeadline() { return Number.isInteger(Number(deadline.value)) && Number(deadline.value) >= 30 && Number(deadline.value) <= 1800; }
  function controls() {
    const p = current();
    send.disabled = active || profileLoading || needsReload || !p || p.disabled || !p.credential || !validDeadline();
    cancel.disabled = !active; selection.disabled = active || profileLoading || !saved.length;
    deadline.disabled = active || profileLoading; reload.disabled = active || profileLoading;
    close.disabled = profileLoading || closed;
    outcomeSelect.disabled = active; loadSample.disabled = active || profileLoading;
    deadline.ariaInvalid = String(!validDeadline());
    validation.textContent = validDeadline() ? "" : "Enter a whole number from 30 to 1,800 seconds.";
    validation.hidden = validDeadline();
    launchbar.hidden = closed;
    explicit.textContent = !validDeadline() ? "Set a whole-number deadline from 30 to 1,800 seconds." : active ? "Sample in progress. Cancel stops the client request." : "Only Send starts a sample. No project content is included.";
  }
  function drawProfile() {
    const p = current();
    profileState.dataset.kind = !p || p.disabled || !p.credential ? "warning" : "ready";
    profileState.textContent = profileLoading ? "Reloading fictional profiles…" : !p ? "No profile available" : p.disabled ? "This saved profile is disabled" : !p.credential ? "This profile needs a credential" : "Ready for a sample request";
    model.textContent = p ? p.model : "Create a saved profile in Settings";
    endpoint.textContent = p?.endpoint ?? ""; endpoint.hidden = !p;
    budget.textContent = p ? `Saved context ${p.context.toLocaleString()} · Response reserve ${p.response.toLocaleString()} · Capacity unverified until send` : "Loading and saving a profile do not start a request.";
    profileDetails.hidden = !p;
    settings.hidden = !!p && !p.disabled && p.credential;
  }
  function fillDetails() {
    const p = requestProfile;
    const fields: [string, string][] = [
      ["Request", done || active || resultState !== "ready" ? "sample-request-01 · Browser memory only" : "No request started"],
      ["Transport", "Fictional loopback HTTP · No network operation"],
      ["HTTP status", resultState === "completed" || resultState === "refused" ? "200 (sample)" : "Unknown"],
      ["Elapsed", resultState === "completed" ? "2,400 ms (sample)" : active ? `${Math.max(stage + 1, 1) * 400} ms (sample)` : "No completed timing"],
      ["Deadline", `${requestDeadline} seconds`],
      ["Input admission", `Estimate 200 + margin 128 + response reserve ${(p?.response ?? 16384).toLocaleString()} tokens`],
      ["Context requested / loaded", stage >= 1 || resultState === "completed" ? "32,768 / 22,528 tokens · Loaded for this sample" : "Capacity unverified"],
      ["Finish reason", resultState === "completed" ? "stop" : "No completion"],
      ["Usage", resultState === "completed" && resultOutcome !== "unknown" ? "Input 10 · Output 4 · Total 14 · Reasoning unknown (provider-reported sample)" : "Input unknown · Output unknown · Total unknown · Reasoning unknown"],
      ["Model", p?.model ?? "No selected profile"],
    ];
    technicalData.replaceChildren();
    for (const [name, value] of fields) technicalData.append(el("dt", "", name), el("dd", "", value));
  }
  function draw() {
    layout.dataset.state = resultState; result.dataset.state = resultState;
    drawProfile(); controls();
    stageRows.forEach((row, index) => { row.dataset.progress = resultState === "completed" || (stage > index && resultState !== "ready") ? "done" : active && stage === index ? "current" : "waiting"; row.removeAttribute("aria-current"); if (active && stage === index) row.ariaCurrent = "step"; });
    const messages: Record<string, [string, string, string]> = {
      ready: ["No response yet", "Inspect the fixed message, then send a sample when you are ready.", "Not sent"],
      completed: ["Sample response ready", "The complete response passed the sample format check.", "Completed"],
      failed: ["Response unavailable", "The sample connection ended before a complete response arrived. Your saved profile has not changed. Reload profiles or send another sample explicitly.", "Error"],
      refused: ["The sample provider refused this request", "No completion was published. You can inspect the retained request details or try another sample explicitly.", "Refused"],
      expired: ["Response deadline reached", "The sample request expired. No completion was published. Review the deadline before sending again.", "Expired"],
      configuration: ["Configuration changed", "The saved profile or project changed during this sample. Its response was discarded. Reload profiles before sending again.", "Discarded"],
      cancelled: ["Client request cancelled", "The sample client stopped observing this request. In the app, server computation may continue. No completion was published.", "Cancelled"],
      observation: ["Request status unavailable", "The sample cannot observe the request. Cancel remains available so you can stop the client request.", "Status error"],
      cleanup: ["Client cleanup is incomplete", "Keep this panel open and cancel again. The sample retains the request until cancellation succeeds.", "Cleanup needed"],
    };
    const copy = active && resultState === "progress" ? [stages[stage]!.title, stages[stage]!.detail, `Step ${stage + 1} of 5`] : messages[resultState]!;
    feedbackTitle.textContent = copy[0]!; feedbackText.textContent = copy[1]!; resultBadge.textContent = copy[2]!;
    completion.hidden = resultState !== "completed"; completion.textContent = resultState === "completed" ? sampleCompletion : "";
    resultSource.hidden = resultState === "ready"; resultSource.textContent = `Sample result · ${resultProfile}`;
    resultSummary.replaceChildren();
    if (resultState === "completed") for (const text of ["Finished normally", resultOutcome === "unknown" ? "Usage unknown" : "Usage reported", "Context verified"]) resultSummary.append(el("span", "", text));
    resultSummary.hidden = resultState !== "completed";
    contextWarning.hidden = !(stage >= 1 || resultState === "completed");
    contextWarning.textContent = "The sample loaded a smaller context than requested. This fixed message still fits.";
    technical.hidden = resultState === "ready";
    frame.status.textContent = active ? `${copy[0]} · Browser simulation` : resultState === "ready" ? "Ready in sample · No request sent" : `${copy[0]} · Retained in this preview`;
    fillDetails();
  }
  function start() {
    if (send.disabled || !validDeadline()) return;
    clearTimeout(timer); active = true; done = false; stage = 0; resultState = "progress"; resultProfile = current()!.label; requestProfile = current(); requestDeadline = deadline.value; resultOutcome = outcome; cancelledOnce = false; draw();
    const next = () => {
      if (!active || closed) return;
      if (outcome === "observation" && stage === 2) { resultState = "observation"; draw(); return; }
      if (stage < stages.length - 1) { stage++; draw(); timer = setTimeout(next, 650); return; }
      active = false; done = true;
      resultState = ({ success: "completed", unknown: "completed", refusal: "refused", transport: "failed", expired: "expired", configuration: "configuration", cleanup: "completed" } as Record<string, string>)[outcome] ?? "failed"; needsReload = resultState === "configuration"; draw();
    };
    timer = setTimeout(next, 650);
    if (variant === "console" || innerWidth <= 740) result.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  function cancelRequest() {
    if (!active) return false;
    clearTimeout(timer);
    if (outcome === "cleanup" && !cancelledOnce) { cancelledOnce = true; resultState = "cleanup"; draw(); return false; }
    active = false; done = true; resultState = "cancelled"; draw(); return true;
  }
  function closePanel() {
    if (profileLoading) return;
    const wasActive = active;
    if (active && !cancelRequest()) return;
    clearTimeout(timer); closed = true; layout.hidden = true; closedView.hidden = false; close.disabled = true;
    launchbar.hidden = true;
    closedText.textContent = wasActive ? "The client sample was cancelled before closing. No model was contacted." : "The sample panel is closed. No request starts when you reopen it.";
    frame.status.textContent = "Sample panel closed"; closedView.querySelector("button")?.focus();
  }
  function reloadProfiles() {
    if (active || profileLoading) return;
    profileLoading = true; drawProfile(); controls();
    frame.status.textContent = "Reloading fictional profiles. No request sent.";
    timer = setTimeout(() => {
      profileLoading = false; needsReload = false; loadCount++; renderProfiles(); draw();
      frame.status.textContent = `Fictional profiles reloaded (${loadCount}). No request sent. Last feedback retained.`;
    }, 350);
  }
  selection.onchange = () => { selected = selection.value; drawProfile(); controls(); fillDetails(); frame.status.textContent = "Selected saved sample profile. Last request feedback retained. No request sent."; };
  deadline.oninput = () => { controls(); fillDetails(); };
  renderProfiles(); draw();
  return () => { clearTimeout(timer); };
}
