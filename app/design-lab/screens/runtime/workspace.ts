import type { LabContext } from "../../contracts.ts";
import { action, element as el, labelled, labPage } from "../../page.ts";
import { icon } from "../../../src/icons.ts";
import { errors, fixture, warnings, type Finding, type Outcome } from "./fixture.ts";
import "./styles.css";

/** Disposable browser state. No bridge, filesystem, process or network operations. */
export function mountRuntime(host: HTMLElement, context: LabContext, layout: "desk" | "console") {
  const m = fixture(context.state);
  const frame = labPage(host, context, { screen: "runtime", title: "Runtime & diagnostics", subtitle: layout === "desk" ? "Run desk" : "Diagnostic console", dirty: () => !!m.sourceDrafts || m.pendingScene || active() });
  frame.shell.classList.add("rt-shell");
  const workspace = el("div", `rt-workspace rt-${layout}`);
  frame.content.append(workspace);
  let timers: ReturnType<typeof setTimeout>[] = [], disposed = false, currentDialog: HTMLDialogElement | undefined;
  let rawOpen = false, launchOpen = false, toolsOpen = false, afterStop: (() => void) | undefined;
  const later = (callback: () => void, delay = 400) => { timers.push(setTimeout(() => { if (!disposed) callback(); }, delay)); };
  const cancelTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const active = () => ["preparing", "starting", "running", "validating", "stopping", "cleanupFailed"].includes(m.phase);
  const busy = () => active() || !!m.stage;
  const say = (copy: string) => { frame.status.textContent = copy; };
  const btn = (label: string, callback: () => void, primary = false, disabled = false) => { const b = action(label, callback, primary); b.disabled = disabled; return b; };
  const note = (copy: string, className = "") => el("p", `rt-note ${className}`, copy);
  const badge = (copy: string, className = "") => el("span", `rt-badge ${className}`, copy);
  const smallHeading = (copy: string) => el("h2", "rt-section-title", copy);

  function modal(title: string, copy: string, build: (body: HTMLElement, close: () => void) => void) {
    if (currentDialog) return;
    const restore = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    const dialog = el("dialog", "lp-dialog rt-dialog"); dialog.ariaLabel = title;
    currentDialog = dialog;
    const close = () => dialog.close();
    dialog.append(el("h2", "", title), note(copy));
    const body = el("div", "rt-dialog-body"); dialog.append(body);
    build(body, close);
    dialog.onclose = () => { dialog.remove(); currentDialog = undefined; if (restore?.isConnected) restore.focus(); else frame.tools.querySelector<HTMLButtonElement>("button")?.focus(); };
    dialog.addEventListener("cancel", () => { if (m.phase === "preparing") { cancelTimers(); m.phase = "idle"; render(); say("Preparation cancelled. Nothing executed."); } });
    frame.shell.append(dialog); dialog.showModal();
    const cancel = [...dialog.querySelectorAll<HTMLButtonElement>("button")].find(b => ["Cancel", "Close", "Keep running", "Keep editing"].includes(b.textContent ?? ""));
    (cancel ?? dialog.querySelector<HTMLElement>("button,input,select"))?.focus();
  }
  function dialogActions(body: HTMLElement, buttons: HTMLButtonElement[]) {
    const row = el("div", "rt-dialog-actions"); row.append(...buttons); body.append(row);
  }
  function statusCopy() {
    const labels = {
      idle: m.sdk ? "Ready to run" : "Set up the pinned SDK", preparing: "Preparing saved revision", starting: "Starting game", running: "Game is running",
      validating: "Validating saved revision", stopping: "Stopping game", stopped: "Stopped", finished: m.kind === "validate" ? "Validation finished" : "Game finished",
      failed: "Game ended with a runtime error", timedOut: "Validation timed out", cleanupFailed: "Cleanup needs attention",
    };
    return m.stage || labels[m.phase];
  }
  function render() {
    const focused = document.activeElement instanceof HTMLButtonElement ? document.activeElement.textContent : null;
    workspace.dataset.phase = m.phase; workspace.dataset.busy = String(busy());
    frame.tools.replaceChildren(btn("Sample conditions", sampleConditions));
    workspace.replaceChildren();
    const core = coreControls();
    const diagnostics = diagnosticPanel();
    if (layout === "desk") {
      const top = el("div", "rt-desk-top"); top.append(core, readiness()); workspace.append(top, diagnostics);
    } else {
      workspace.append(core, diagnostics);
      const rail = el("div", "rt-console-rail"); rail.append(readiness()); workspace.append(rail);
    }
    workspace.append(maintenance());
    if (m.notice) { const message = note(m.notice, "rt-alert"); message.role = "alert"; workspace.prepend(message); }
    if (focused && !currentDialog) [...workspace.querySelectorAll<HTMLButtonElement>("button"), ...frame.tools.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === focused && !b.disabled)?.focus({ preventScroll: true });
  }
  function coreControls() {
    const core = el("section", "rt-core"); core.ariaLabel = "Run controls";
    const caption = el("div", "rt-core-caption"); caption.append(badge("The Last Tram"), el("span", "muted rt-small", `Saved project · ${m.savedRevision}`));
    const status = el("div", "rt-run-status"); status.role = "status"; status.ariaLive = "polite";
    const dot = el("span", "rt-state-dot"); dot.ariaHidden = "true";
    status.append(dot, el("h2", "", statusCopy()));
    const detail = m.phase === "running" ? "The fictional game is open. Stop ends this run; saved edits need another Run."
      : m.phase === "cleanupFailed" ? "An owned process may still be active. Stop remains available; leaving waits for confirmed cleanup."
      : m.phase === "validating" ? "Compile, then lint. Previous findings stay visible until this revision has results."
      : m.phase === "preparing" ? "Checking the saved revision and session execution consent."
      : m.phase === "failed" ? "Exit 0 does not override a reported runtime error. Review the retained finding below."
      : m.phase === "timedOut" ? "The SDK did not finish in time. Retained output and diagnostics remain available."
      : !m.sdk ? "This project needs Ren'Py 8.5.3 before Run or Validate. Choose an existing sample SDK or simulate installation."
      : "Run the saved game, or use Validate to compile and lint. Neither starts until you choose it.";
    const actions = el("div", "rt-run-actions");
    actions.append(btn("Run Game", () => begin("run"), true, busy()), btn("Validate", () => begin("validate"), false, busy()), btn(m.phase === "preparing" ? "Cancel preparation" : "Stop", stop, false, !active()));
    const progress = el("div", "rt-progress"); progress.hidden = !["preparing", "starting", "validating", "stopping"].includes(m.phase) && !m.stage;
    progress.append(el("span", "rt-progress-line")); progress.ariaLabel = statusCopy(); progress.role = "progressbar";
    const preview = btn("Story preview", storyPreview, false, ["preparing", "starting", "validating", "stopping"].includes(m.phase)); preview.classList.add("rt-text-action");
    core.append(caption, status, note(detail), actions, progress, preview);
    return core;
  }
  function readiness() {
    const panel = el("section", "rt-readiness"); panel.ariaLabel = "Execution readiness";
    panel.append(smallHeading("Before the next run"));
    const facts = el("dl", "rt-facts");
    for (const [term, value] of [
      ["Saved revision", m.savedRevision], ["Drafts", m.sourceDrafts || m.pendingScene ? `${m.sourceDrafts} Source draft${m.sourceDrafts === 1 ? "" : "s"}${m.pendingScene ? " · Scene form pending" : ""}` : "No pending edits"],
      ["Pinned SDK", `Ren'Py 8.5.3 · ${m.sdk ? "ready" : "unavailable"}`], ["Execution consent", m.trusted ? "Trusted for this sample session" : "Asked before execution"],
    ]) facts.append(el("dt", "", term), el("dd", "", value));
    const manage = btn("SDK & execution", () => { toolsOpen = !toolsOpen; render(); if (toolsOpen) workspace.querySelector<HTMLElement>(".rt-maintenance")?.scrollIntoView({ block: "nearest" }); }); manage.ariaExpanded = String(toolsOpen);
    panel.append(facts, manage); return panel;
  }
  function diagnosticPanel() {
    const panel = el("section", "rt-diagnostic-panel"); panel.ariaLabel = "SDK diagnostics";
    const header = el("div", "rt-diagnostic-header");
    const heading = el("div"); heading.append(smallHeading("Diagnostics"), note(m.tested ? `${m.findings.length} findings · ${m.launchRevision || m.savedRevision}${m.stale ? " · freshness unverified" : " · last SDK result"}` : "No SDK validation in this sample yet."));
    const filters = el("div", "rt-filters"); filters.role = "group"; filters.ariaLabel = "Diagnostic filters";
    for (const [value, label] of [["all", "All"], ["error", "Errors"], ["warning", "Warnings"]]) {
      const count = value === "all" ? m.findings.length : m.findings.filter(d => d.severity === value).length;
      const b = btn(`${label} ${count}`, () => { m.filter = value!; render(); }); b.ariaPressed = String(m.filter === value); filters.append(b);
    }
    header.append(heading, filters); panel.append(header);
    if (active() && m.phase !== "cleanupFailed" && m.findings.length) panel.append(note("Retained results from the previous operation. They do not validate this revision.", "rt-retained"));
    const body = el("div", "rt-diagnostic-body");
    const list = el("div", "rt-findings"); list.ariaLabel = "Diagnostic findings";
    const visible = m.findings.filter(d => m.filter === "all" || d.severity === m.filter);
    if (!visible.length) {
      const empty = el("div", "rt-empty"); empty.append(icon("source"), el("h3", "", m.findings.length ? "No findings in this filter" : m.tested ? "No structured SDK diagnostics" : "No results yet"), note(m.tested ? "The process result still matters. Inspect output for failures the SDK did not structure." : "Choose Validate to compile and lint the saved revision. Static Story and Source checks are separate.")); list.append(empty);
    }
    for (const d of visible) {
      const row = btn("", () => { m.selected = d.id; render(); }); row.className = "rt-finding"; row.dataset.id = d.id; row.ariaPressed = String(m.selected === d.id);
      row.append(badge(d.severity === "error" ? "Error" : "Warning", `rt-${d.severity}`));
      const copy = el("span", "rt-finding-copy"); copy.append(el("strong", "", d.message), el("span", "rt-small muted", `${d.origin}${d.path ? ` · ${d.path}:${d.line}` : " · no source location"}`)); row.append(copy); list.append(row);
    }
    body.append(list);
    const selected = m.findings.find(d => d.id === m.selected);
    if (selected && visible.some(d => d.id === selected.id)) body.append(diagnosticDetail(selected));
    panel.append(body, evidence()); return panel;
  }
  function diagnosticDetail(d: Finding) {
    const detail = el("section", "rt-finding-detail"); detail.ariaLabel = "Selected diagnostic";
    const heading = el("div", "rt-detail-heading"); heading.append(badge(`${d.origin} · ${d.severity}`, `rt-${d.severity}`));
    const close = btn("Close diagnostic", () => { m.selected = ""; render(); workspace.querySelector<HTMLElement>(`.rt-finding[data-id="${d.id}"]`)?.focus(); }); close.classList.add("rt-text-action"); heading.append(close);
    detail.append(heading, el("h3", "", d.message), note(d.detail));
    if (d.path) {
      detail.append(el("code", "rt-location", `${d.path}:${d.line}`), note("Location unverified until opened.", "muted"), btn("Open source location", () => openLocation(d)));
    } else detail.append(note("No proven project source location.", "muted"));
    return detail;
  }
  function evidence() {
    const outer = el("div", "rt-evidence");
    const raw = el("details", "rt-disclosure"); raw.open = rawOpen;
    raw.append(el("summary", "", "Process output"), el("pre", "rt-output", m.output || "No process output in this sample."));
    raw.ontoggle = () => { rawOpen = raw.open; };
    const launch = el("details", "rt-disclosure"); launch.open = launchOpen; launch.append(el("summary", "", "Launch details"), note(`${m.kind === "validate" ? "Tested" : "Launch"} revision: ${m.launchRevision || "none"}. ${m.earlier ? "Started from an earlier revision. Stop then Run uses saved edits." : "Launch-time evidence; files may change externally."}`), note("Static Source and Branches findings are separate. Only explicit Validate runs compile and lint.")); launch.ontoggle = () => { launchOpen = launch.open; };
    outer.append(raw, launch);
    if (m.previous) { const previous = el("details", "rt-disclosure"); previous.append(el("summary", "", "Previous validation · locations stale"), el("pre", "rt-output", m.previous)); outer.append(previous); }
    return outer;
  }
  function maintenance() {
    const section = el("section", "rt-maintenance"); section.hidden = !toolsOpen; section.ariaLabel = "SDK and execution maintenance";
    const header = el("div", "rt-maintenance-head"); header.append(smallHeading("SDK & execution"), btn("Close SDK & execution", () => { toolsOpen = false; render(); })); section.append(header);
    const grid = el("div", "rt-maintenance-grid");
    const sdk = el("div"); sdk.append(el("h3", "", "Pinned runtime"), note(`Ren'Py 8.5.3 · ${m.sdk ? m.sdkName : "not available"}`), note("The sample represents an official download with published checksum verification. Execution always uses the project's pinned version."));
    const sdkActions = el("div", "rt-secondary-actions"); sdkActions.append(btn("Choose SDK…", chooseSdk, false, busy()), btn(m.sdk ? "Reinstall pinned SDK" : "Install pinned SDK", installSdk, false, busy())); sdk.append(sdkActions);
    const trust = el("div"); trust.append(el("h3", "", "Session execution consent"), note(m.trusted ? "Consent applies to this project, SDK and inspected revision for this sample session." : "Run and Validate ask before executing project Python. Opening this browser sample does not execute a game."));
    const trustActions = el("div", "rt-secondary-actions"); trustActions.append(btn("Inspect trust", inspectTrust, false, !m.trusted), btn("Revoke trust", revokeTrust, false, !m.trusted)); trust.append(trustActions);
    const policy = el("div"); policy.append(el("h3", "", "Controlled play"), note(m.helper ? "Helper saved in this sample. Editor Run disables developer tools and automatic reload." : "Run requires the controlled play helper. Adding it is a separate explicit saved edit. Validate does not require it."), btn(m.helper ? "Controlled play enabled" : "Enable controlled play", enableHelper, false, busy() || m.helper));
    grid.append(sdk, trust, policy); section.append(grid); return section;
  }
  function begin(kind: "run" | "validate") {
    if (busy() || currentDialog) return;
    m.notice = ""; m.kind = kind;
    if (!m.sdk) { m.notice = "Pinned Ren'Py 8.5.3 is unavailable. Configure the SDK before retrying."; toolsOpen = true; render(); return; }
    if (kind === "run" && !m.helper) { m.notice = "Enable controlled play before Run Game. Adding the helper is a separate saved edit; nothing has executed."; toolsOpen = true; render(); return; }
    if (m.sourceDrafts || m.pendingScene) {
      modal("Choose execution revision", "Run and Validate use a saved revision. Unsaved input stays in this sample until you explicitly save or commit it.", (body, close) => {
        body.append(note(`${m.sourceDrafts} Source draft(s)${m.pendingScene ? " and a pending Scene form" : ". No pending Scene form"}.`));
        dialogActions(body, [
          btn(m.pendingScene ? "Return to Scene Commit" : "Save All and continue", () => {
            close();
            if (m.pendingScene) { showSceneCommit(); return; }
            if (m.outcome === "saveFailure") { m.notice = "Simulated Save All failure. Source drafts are retained; nothing prepared or executed."; say(m.notice); render(); return; }
            m.sourceDrafts = 0; m.savedRevision = "sample-r15"; prepare();
          }),
          btn("Use saved revision", () => { close(); m.earlier = true; prepare(); }),
          btn("Cancel", () => { close(); say("Preparation cancelled. Drafts retained; nothing executed."); }),
        ]);
      });
    } else prepare();
  }
  function prepare() {
    m.phase = "preparing"; render(); say("Preparing saved revision in sample");
    later(() => {
      if (m.trusted) launch();
      else modal("Allow project execution?", "Run and Validate execute project Python with your user privileges. Session consent is not a sandbox. This dialog only changes fictional browser state.", (body, close) => {
        body.append(trustInventory());
        dialogActions(body, [btn("Trust for this sample session and continue", () => { close(); m.trusted = true; launch(); }, true), btn("Cancel", () => { close(); m.phase = "idle"; say("Preparation cancelled. No execution or trust grant."); render(); })]);
      });
    });
  }
  function trustInventory() {
    const inventory = el("dl", "rt-facts rt-inventory");
    for (const [key, value] of [["Project", "The Last Tram · fictional project"], ["SDK", `Ren'Py 8.5.3 · ${m.sdkName}`], ["SDK revision", "sample-sdk-rev-01"], ["Saved revision", m.savedRevision], ["Inspected inputs", `game/last_service.rpy, game/images.rpy, game/options.rpy${m.helper ? ", game/loomlight_runtime.rpy" : ""}`]]) inventory.append(el("dt", "", key), el("dd", "", value));
    return inventory;
  }
  function launch() {
    m.previous = m.kind === "validate" && m.tested ? m.findings.map(d => `${d.severity}: ${d.message}`).join("\n") || "No structured diagnostics." : m.previous;
    m.phase = m.kind === "run" ? "starting" : "validating";
    m.launchRevision = m.savedRevision;
    m.output = `[Fictional SDK output]\nRen'Py 8.5.3\n${m.kind === "run" ? "Starting saved game." : "Compiling saved source."}`;
    render(); say(m.kind === "run" ? "Starting fictional game" : "Compiling fictional saved revision");
    later(() => {
      if (m.kind === "run") {
        if (m.outcome === "runtimeError") { m.phase = "failed"; m.findings = errors(); m.selected = m.findings[0]!.id; m.tested = true; m.output += "\nNameError: timetable is not defined.\nProcess exit 0. Runtime error retained."; }
        else { m.phase = "running"; m.output += "\nFictional game running. No native process exists."; }
        say(statusCopy()); render();
      } else {
        m.output += "\nCompile completed. Running lint."; say("Linting fictional saved revision");
        later(() => {
          if (m.outcome === "timeout") { m.phase = "timedOut"; m.output += "\nSDK validation timed out; cleanup confirmed."; }
          else { m.phase = "finished"; m.tested = true; m.findings = warnings(); m.selected = m.findings[0]!.id; m.stale = false; m.output += "\nLint completed with 2 warnings. Exit 0."; }
          say(statusCopy()); render();
        }, 550);
      }
    }, 550);
  }
  function stop() {
    if (!active()) return;
    cancelTimers();
    if (currentDialog) currentDialog.close();
    if (m.phase === "preparing") { m.phase = "idle"; say("Preparation cancelled. No execution."); render(); return; }
    m.phase = "stopping"; render(); say("Stopping fictional owned runtime");
    later(() => {
      if (m.outcome === "cleanupFailure") { m.phase = "cleanupFailed"; afterStop = undefined; m.notice = "Cleanup was not confirmed. Ownership is retained and leaving remains blocked. Try Stop after changing the sample outcome."; }
      else { m.phase = "stopped"; m.notice = ""; m.output += "\nStopped. Owned-process cleanup confirmed in sample."; }
      say(statusCopy()); render();
      if (m.phase === "stopped" && afterStop) { const go = afterStop; afterStop = undefined; go(); }
    }, 550);
  }
  function inspectTrust() {
    if (!m.trusted) return;
    modal("Session execution consent", "Consent is limited to this sample session and inspected input. Run and Validate can execute project Python; consent is not a sandbox.", (body, close) => { body.append(trustInventory()); dialogActions(body, [btn("Close", close)]); });
  }
  function revokeTrust() {
    if (!m.trusted) return;
    m.trusted = false;
    if (active()) stop(); else { say("Session trust revoked in sample. The next execution asks again."); render(); }
  }
  function chooseSdk() {
    modal("Choose pinned SDK", "These SDK entries are fictional. No folder picker, discovery or file access occurs. Only Ren'Py 8.5.3 matches this project's pin.", (body, close) => {
      for (const [name, version] of [["Managed SDK", "8.5.3"], ["Selected SDK folder", "8.5.3"], ["Older SDK folder", "8.4.1"]]) {
        const choose = btn(`${name} · ${version}`, () => {
          close();
          if (version !== "8.5.3" || m.outcome === "selectionFailure") { m.notice = version !== "8.5.3" ? "Choose pinned Ren'Py 8.5.3. The previous SDK selection is retained." : "The selected sample SDK could not be verified. The previous selection is retained."; }
          else { m.sdk = true; m.sdkName = name!; m.trusted = false; m.notice = ""; say(`Selected ${name} in sample. Choose Run or Validate when ready.`); }
          render();
        }); choose.classList.add("rt-sdk-choice"); body.append(choose);
      }
      dialogActions(body, [btn("Cancel", close)]);
    });
  }
  function installSdk() {
    modal(m.sdk ? "Reinstall pinned SDK?" : "Install pinned SDK?", "Simulate the existing official SDK install flow for Ren'Py 8.5.3. The checksum must match before extraction. Nothing is downloaded or installed.", (body, close) => {
      const progress = el("div", "rt-install-progress"); const stage = note("Ready to simulate installation."); progress.append(stage); body.append(progress);
      let cancelled = false;
      const cancel = btn("Cancel", () => { cancelled = true; cancelTimers(); m.stage = ""; close(); render(); say("SDK installation cancelled in sample. Previous selection retained."); });
      const start = btn("Start sample installation", () => {
        start.disabled = true; m.stage = "Downloading sample SDK"; render(); stage.textContent = "Downloading · 42 MiB of 112 MiB (fictional)";
        later(() => {
          if (cancelled) return;
          stage.textContent = "Verifying published checksum…"; m.stage = "Verifying sample checksum"; render();
          later(() => {
            if (cancelled) return;
            if (m.outcome === "checksumFailure") {
              stage.textContent = "Checksum mismatch. Extraction did not start. Previous SDK selection retained."; stage.classList.add("rt-error"); m.stage = ""; m.notice = "Sample SDK checksum mismatch. Nothing installed."; cancel.textContent = "Close"; start.textContent = "Sample installation failed"; render(); return;
            }
            stage.textContent = "Extracting verified sample archive…"; m.stage = "Extracting sample SDK"; render();
            later(() => { if (cancelled) return; m.stage = ""; m.sdk = true; m.sdkName = "Managed SDK"; m.trusted = false; m.notice = ""; close(); say("Pinned SDK ready in sample. No project executed."); render(); });
          });
        });
      }, true);
      dialogActions(body, [start, cancel]);
      currentDialog!.addEventListener("cancel", () => { cancelled = true; cancelTimers(); m.stage = ""; render(); say("SDK installation cancelled in sample."); });
    });
  }
  function enableHelper() {
    modal("Enable controlled play", "Add game/loomlight_runtime.rpy through the fictional transaction layer. It disables developer tools and automatic reload for editor Run, never overwrites a user script and does not execute the project.", (body, close) => {
      dialogActions(body, [btn("Add controlled play helper", () => { m.helper = true; m.savedRevision = "sample-r15"; m.trusted = false; close(); render(); say("Controlled play helper saved in sample. Choose Run when ready."); }, true), btn("Cancel", close)]);
    });
  }
  function openLocation(d: Finding) {
    if (m.stale) { m.notice = "Stale or unavailable location. No source selection changed. Retained findings remain available."; say(m.notice); render(); return; }
    modal("Source location · sample", "This is a read-only fictional source target. No project or file was opened. Unsaved source input is retained before navigation.", (body, close) => {
      body.append(el("code", "rt-location", `${d.path}:${d.line}`), el("pre", "rt-output", `${d.line}: ${d.origin === "runtime" ? '    mara "The next tram leaves at [timetable]."' : d.id === "unused" ? 'image station_sign = "station_sign.png"' : "label old_timetable:"}`));
      dialogActions(body, [btn("Back to diagnostics", close)]);
    });
  }
  function showSceneCommit() {
    // Wait for the revision chooser's native close event before opening its successor.
    later(() => modal("Pending Scene form · sample", "Runtime does not commit a Scene form automatically. In the app, this returns focus to the existing Scene Commit control. This card represents that step in browser memory.", (body, close) => {
      body.append(note("Dialogue draft · Mara: The last tram will wait."));
      dialogActions(body, [btn("Commit sample Scene form", () => { m.pendingScene = false; m.savedRevision = "sample-r15"; close(); render(); say("Scene committed in sample. Choose Run or Validate again."); }, true), btn("Keep editing", close)]);
    }), 0);
  }
  function storyPreview() {
    modal("Story preview · sample", "Illustrative saved-scene preview. It does not execute Ren'Py or Python and does not prove a runtime result. Closing this view does not stop an active run.", (body, close) => {
      const canvas = el("div", "rt-story-preview");
      canvas.append(el("div", "rt-platform"), el("div", "rt-track"));
      const dialogue = el("div", "rt-preview-dialogue"); dialogue.append(el("strong", "", "Mara"), note("The last tram will wait.")); canvas.append(dialogue); body.append(canvas);
      dialogActions(body, [btn("Back to runtime", close)]);
    });
  }
  const guardNavigation = (event: Event) => {
    if (!active() || !(event.target instanceof Element)) return;
    const target = event.target.closest<HTMLButtonElement>(".lp-navigation .tree-item,.lp-studio-link,.lp-runtime-link");
    if (!target || target.classList.contains("lp-runtime-link") || currentDialog) return;
    event.preventDefault(); event.stopImmediatePropagation();
    modal("Stop before leaving?", "Stop the owned runtime and confirm cleanup before continuing through the existing draft leave flow. You can keep this run open.", (body, close) => {
      dialogActions(body, [btn("Stop and continue", () => { close(); afterStop = () => target.click(); stop(); }, true), btn("Keep running", close)]);
    });
  };
  frame.shell.addEventListener("click", guardNavigation, true);
  function sampleConditions() {
    modal("Sample conditions", "Lab controls for reviewing existing runtime states. These are not proposed product settings. All changes reset with the preview.", (body, close) => {
      const outcomes: [Outcome, string][] = [["success", "Normal result"], ["runtimeError", "Runtime error, process exit 0"], ["timeout", "Validation timeout"], ["cleanupFailure", "Stop cannot confirm cleanup"], ["saveFailure", "Save All refusal"], ["checksumFailure", "SDK checksum mismatch"], ["selectionFailure", "SDK verification failure"]];
      const select = el("select"); for (const [value, copy] of outcomes) { const o = el("option", "", copy); o.value = value; select.append(o); } select.value = m.outcome;
      body.append(labelled("Next sample result", select));
      const draft = el("input"); draft.type = "checkbox"; draft.checked = !!m.sourceDrafts;
      const scene = el("input"); scene.type = "checkbox"; scene.checked = m.pendingScene;
      const stale = el("input"); stale.type = "checkbox"; stale.checked = m.stale;
      const noHelper = el("input"); noHelper.type = "checkbox"; noHelper.checked = !m.helper;
      const changedInputs = el("input"); changedInputs.type = "checkbox";
      for (const [input, text] of [[draft, "Unsaved Source draft"], [scene, "Pending Scene form"], [stale, "Diagnostic locations are stale"], [noHelper, "Controlled play helper absent"], [changedInputs, "Execution inputs changed externally"]] as const) { const row = el("label", "rt-check"); row.append(input, document.createTextNode(text)); body.append(row); }
      dialogActions(body, [btn("Apply sample conditions", () => { m.outcome = select.value as Outcome; m.sourceDrafts = draft.checked ? 1 : 0; m.pendingScene = scene.checked; m.stale = stale.checked; if (m.helper !== !noHelper.checked || changedInputs.checked) m.trusted = false; m.helper = !noHelper.checked; if (changedInputs.checked) m.savedRevision = "sample-external-r16"; close(); render(); say("Sample conditions updated in browser memory."); }, true), btn("Cancel", close)]);
    });
  }
  render();
  say(context.state === "error" ? "Cleanup not confirmed. Stop remains available in sample." : "Fictional SDK state. Nothing has executed.");
  return () => { disposed = true; cancelTimers(); currentDialog?.remove(); frame.shell.removeEventListener("click", guardNavigation, true); };
}
