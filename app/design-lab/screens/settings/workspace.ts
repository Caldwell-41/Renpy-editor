import type { LabContext } from "../../contracts.ts";
import { action, element as el, labelled, labPage } from "../../page.ts";
import { icon } from "../../../src/icons.ts";
import { actions, categories, fixture, models, newProfile, type Category, type Profile } from "./fixture.ts";
import "./styles.css";

const select = (items: readonly (readonly [string, string])[], value: string) => {
  const input = el("select");
  for (const [id, label] of items) { const option = el("option", "", label); option.value = id; input.append(option); }
  input.value = value; return input;
};
const field = (value: string, type = "text") => { const input = el("input"); input.type = type; input.value = value; return input; };
const buttons = (...items: HTMLElement[]) => { const row = el("div", "stg-actions"); row.append(...items); return row; };

export function mountSettings(host: HTMLElement, context: LabContext, layout: "book" | "desk") {
  const sample = fixture(context.state), profiles = sample.profiles;
  const drafts = new Map<string, Profile>();
  const promptSaved = [...sample.prompts], promptDrafts = [...sample.prompts], baseline = [...sample.prompts];
  const promptHistory: string[][] = [[...sample.prompts]]; let historyIndex = 0;
  let scope = "Application", category: Category = context.state === "empty" || context.state === "error" ? "AI providers" : "Workspace";
  let selected = profiles[0]?.id ?? "new", currentAction = 0, projectTab = "Project overview";
  let theme = context.theme as string, density = "default", font = "14", remember = true;
  let busy = "", failurePending = context.state === "error", disposed = false, operation = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const profileDirty = (id: string) => {
    const draft = drafts.get(id); if (!draft) return false;
    const saved = profiles.find(profile => profile.id === id);
    return !saved ? JSON.stringify(draft) !== JSON.stringify(newProfile(id)) : JSON.stringify(draft) !== JSON.stringify(saved);
  };
  const promptDirty = () => promptDrafts.some((text, index) => text !== promptSaved[index]);
  const dirty = () => !!busy || [...drafts.keys()].some(profileDirty) || promptDirty();
  const frame = labPage(host, context, { screen: "settings", title: "Settings", subtitle: layout === "book" ? "Settings book · A place for every preference" : "Control desk · Shape your writing workspace", dirty });
  frame.shell.classList.add("stg-shell", `stg-${layout}`);
  const scopes = el("div", "stg-scopes"); scopes.role = "tablist"; scopes.ariaLabel = "Settings scope";
  const workspace = el("div", "stg-workspace"), navigation = el("nav", "stg-categories"), pane = el("section", "stg-pane");
  navigation.ariaLabel = "Settings categories"; pane.ariaLabel = "Selected settings";
  const scroll = el("div", "stg-scroll"), notice = el("p", "stg-notice"); notice.role = "status"; notice.hidden = true;
  const body = el("div", "stg-body"); scroll.append(notice, body); pane.append(scroll);
  const scopeNote = el("span", "stg-scope-note muted");
  frame.tools.append(scopeNote);
  frame.content.append(scopes, workspace);
  if (layout === "book") workspace.append(navigation, pane);
  else { frame.content.insertBefore(navigation, workspace); workspace.append(pane); }

  function message(text: string, error = false) {
    notice.hidden = false; notice.textContent = text; notice.dataset.kind = error ? "error" : "normal";
    frame.status.textContent = text;
  }
  function confirm(title: string, description: string, confirmLabel: string, callback: () => void) {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = el("dialog", "lp-dialog stg-dialog"); dialog.ariaLabel = title;
    const cancel = action("Keep editing", () => dialog.close());
    dialog.append(el("h2", "", title), el("p", "", description), cancel, action(confirmLabel, () => { dialog.close(); callback(); }));
    dialog.onclose = () => { dialog.remove(); if (previous?.isConnected) previous.focus(); };
    frame.shell.append(dialog); dialog.showModal(); cancel.focus();
  }
  function tabList(names: string[], current: string, change: (name: string) => void, label: string) {
    const list = el("div", "stg-tabs"); list.role = "tablist"; list.ariaLabel = label;
    for (const name of names) {
      const button = action(name, () => { if (!busy) change(name); }); button.role = "tab"; button.ariaSelected = String(name === current); button.tabIndex = name === current ? 0 : -1; button.disabled = !!busy;
      button.onkeydown = event => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return; event.preventDefault(); const index = names.indexOf(name); const next = event.key === "Home" ? 0 : event.key === "End" ? names.length - 1 : (index + (event.key === "ArrowRight" ? 1 : names.length - 1)) % names.length; change(names[next]!); const target = [...frame.content.querySelectorAll<HTMLButtonElement>(`[role="tablist"][aria-label="${label}"] [role="tab"]`)].find(item => item.textContent === names[next]); target?.focus(); };
      list.append(button);
    } return list;
  }
  function heading(title: string, copy: string, eyebrow = scope) {
    const header = el("header", "stg-section-heading"); header.append(el("p", "eyebrow", eyebrow), el("h2", "", title), el("p", "muted", copy)); body.append(header);
  }
  function card(title: string, copy = "", className = "") {
    const section = el("section", `stg-card ${className}`); const header = el("div", "stg-card-heading"); header.append(el("h3", "", title)); if (copy) header.append(el("p", "muted", copy)); section.append(header); return section;
  }
  function row(title: string, copy: string, control: HTMLElement) {
    const result = el("div", "stg-row"), label = el("div", "stg-row-copy"); label.append(el("span", "stg-label", title), el("p", "muted", copy));
    if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement) control.ariaLabel ||= title;
    result.append(label, control); return result;
  }
  function check(title: string, value: boolean, change: (checked: boolean) => void) {
    const input = el("input"); input.type = "checkbox"; input.checked = value; input.ariaLabel = title; input.onchange = () => change(input.checked); return input;
  }
  function details(title: string) { const result = el("details", "stg-details"); result.append(el("summary", "", title)); return result; }
  function renderNavigation() {
    scopes.replaceChildren();
    for (const name of ["Application", "Current project"]) {
      const button = action(name, () => { scope = name; render(); }); button.role = "tab"; button.ariaSelected = String(name === scope); button.tabIndex = name === scope ? 0 : -1; button.disabled = !!busy;
      button.onkeydown = event => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return; event.preventDefault(); scope = event.key === "Home" ? "Application" : event.key === "End" ? "Current project" : scope === "Application" ? "Current project" : "Application"; render(); [...scopes.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent === scope)?.focus(); };
      scopes.append(button);
    }
    scopeNote.textContent = scope === "Application" ? "This preview only" : "The Last Tram";
    navigation.replaceChildren(); navigation.hidden = scope !== "Application"; workspace.dataset.scope = scope;
    if (layout === "book") navigation.append(el("p", "eyebrow", "Application"));
    const descriptions = ["Appearance & layout", "Connections & defaults", "Code text", "Find a command", "Version & diagnostics"];
    for (const [index, name] of categories.entries()) {
      const button = action("", () => { category = name; render(); }); button.className = "stg-category"; button.ariaLabel = name; button.ariaCurrent = name === category ? "page" : "false"; button.disabled = !!busy;
      button.append(icon(index === 1 ? "variables" : index === 2 ? "source" : index === 3 ? "story" : "settings"), el("span", "stg-category-name", name));
      if (layout === "desk") button.append(el("small", "muted", descriptions[index]!));
      navigation.append(button);
    }
  }
  function render() {
    renderNavigation(); body.replaceChildren(); notice.hidden = true;
    pane.classList.toggle("stg-provider-pane", scope === "Application" && category === "AI providers");
    if (scope === "Current project") renderProject();
    else if (category === "Workspace") renderWorkspace();
    else if (category === "AI providers") renderProviders();
    else if (category === "Source editor") renderSource();
    else if (category === "Keyboard shortcuts") renderShortcuts();
    else renderAbout();
    if (promptDirty() || [...drafts.keys()].some(profileDirty)) message("Unsaved drafts are kept while you move between settings.");
    scroll.scrollTop = 0;
  }
  function renderWorkspace() {
    heading("Your workspace", "Make the editor comfortable. Your game keeps its own appearance.");
    const grid = el("div", "stg-workspace-grid"), appearance = card("Appearance", "See each choice in this preview.");
    const themes = el("div", "stg-theme-choices"); themes.role = "radiogroup"; themes.ariaLabel = "Theme";
    for (const [id, title, subtitle] of [["light", "Light", "Paper & teal"], ["dark", "Dark", "Charcoal & copper"], ["system", "System", "Follow your device"]]) {
      const choice = action("", () => { theme = id!; document.documentElement.dataset.theme = id === "system" ? context.theme : id; render(); message("Theme changed in this preview only."); }); choice.className = `stg-theme-choice stg-swatch-${id}`; choice.role = "radio"; choice.ariaLabel = `${title} theme`; choice.ariaChecked = String(theme === id); choice.tabIndex = theme === id ? 0 : -1;
      choice.append(el("span", "stg-swatch"), el("strong", "", title), el("small", "muted", subtitle));
      choice.onkeydown = event => { if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return; event.preventDefault(); const choices = [...themes.querySelectorAll<HTMLButtonElement>("button")]; const next = choices[(choices.indexOf(choice) + (event.key === "ArrowRight" ? 1 : choices.length - 1)) % choices.length]!; next.click(); frame.content.querySelector<HTMLButtonElement>(`[aria-label="${next.ariaLabel}"]`)?.focus(); }; themes.append(choice);
    }
    appearance.append(themes);
    const size = select([["small", "Small"], ["default", "Default"], ["large", "Large"]], density); size.onchange = () => { density = size.value; document.documentElement.dataset.density = density; message("Interface size changed in this preview only."); };
    appearance.append(row("Interface size", "Controls and text throughout Loomlight.", size));
    const preview = card("Workspace preview", "A small sample of your editor.", "stg-live-preview");
    preview.append(el("div", "stg-preview-title", "The Last Tram"));
    const scene = el("div", "stg-preview-scene"); scene.append(el("span", "stg-preview-selection", "Station · Evening"), el("strong", "", "Mara"), el("p", "", '"If we miss this one, we walk."')); preview.append(scene, el("div", "stg-preview-bottom muted", "Dialogue · Draft kept"));
    const arrangement = card("Workspace layout"); arrangement.append(row("Remember panel layout", "Restore panel sizes and visibility when you reopen.", check("Remember panel layout", remember, value => { remember = value; message("Layout preference changed in sample."); })), row("Restore default layout", "Keep your content and appearance choices.", action("Reset layout", () => message("Default panel layout restored in sample. Your appearance choices are kept."))));
    const source = card("Source text", "Set code text independently of the interface."); source.append(sourceSize());
    source.append(action("More Source editor preferences", () => { category = "Source editor"; render(); }));
    if (layout === "book") { grid.append(appearance, preview, arrangement, source); } else { grid.append(preview, appearance, source, arrangement); }
    body.append(grid, el("p", "stg-footnote muted", "Application preferences apply immediately in this preview. Profiles and project prompts use explicit Save."));
  }
  function sourceSize() {
    const container = el("div"), size = select([10, 12, 14, 16, 18, 20, 24].map(value => [String(value), `${value} px`]), font);
    const code = el("pre", "stg-source-sample", 'label start:\n    scene bg station_evening\n    mara "If we miss this one, we walk."'); code.style.fontSize = `${font}px`;
    size.onchange = () => { font = size.value; code.style.fontSize = `${font}px`; message("Source text size changed in this preview only."); };
    container.append(labelled("Source text size", size), code); return container;
  }
  function renderSource() {
    heading("Source editor", "Keep code readable without changing the rest of the interface.");
    const section = card("Code text"); section.append(sourceSize(), el("p", "stg-inline-note", "Source edits stay as session drafts until you explicitly save them.")); body.append(section);
  }
  function renderShortcuts() {
    heading("Keyboard shortcuts", "Find the command you need, then get back to writing.");
    const section = card("Find a command"), search = field("", "search"); search.placeholder = "Search commands or keys"; search.ariaLabel = "Find a shortcut";
    const list = el("div", "stg-shortcuts"); list.ariaLive = "polite";
    const rows = [["⌘ S", "Save current Source draft or project changes"], ["⌘ Enter", "Commit the current dialogue"], ["Shift ⌘ Enter", "Commit and continue dialogue"], ["⌘ F", "Find in Source"], ["Escape", "Dismiss a dialog"], ["Tab / Shift Tab", "Move between controls"], ["Arrow keys", "Adjust focused sliders and graph controls"]];
    const filter = () => { list.replaceChildren(); const matches = rows.filter(row => row.join(" ").toLowerCase().includes(search.value.toLowerCase())); for (const [keys, description] of matches) { const item = el("div", "stg-shortcut"); item.append(el("span", "", description), el("kbd", "", keys)); list.append(item); } if (!matches.length) list.append(el("p", "muted", "No matching shortcuts. Try a command such as Save or Find.")); };
    search.oninput = filter; filter(); section.append(search, list, el("p", "stg-footnote muted", "This Mac preview shows ⌘. The Windows app uses Ctrl.")); body.append(section);
  }
  function renderAbout() {
    heading("About Loomlight", "A visual authoring workspace for Ren'Py.");
    const section = card("Loomlight", "Fictional preview version 0.3.0 · Protocol 1");
    section.append(row("Basic diagnostics", "Exclude project content and file paths.", action("Preview basic diagnostics", () => { const dialog = el("dialog", "lp-dialog stg-dialog"); dialog.ariaLabel = "Basic diagnostics preview"; dialog.append(el("h2", "", "Basic diagnostics"), el("pre", "stg-source-sample", `Loomlight 0.3.0 (fictional preview)\nProtocol: 1\nTheme: ${theme}\nInterface: ${density}\nNo project content or file paths.`), action("Simulate copy", () => message("Copy simulated. The clipboard was not changed.")), action("Close diagnostics", () => dialog.close())); dialog.onclose = () => dialog.remove(); frame.shell.append(dialog); dialog.showModal(); })), el("p", "stg-inline-note", "All changes in Design Lab stay in browser memory. Reset or reload starts a fresh sample.")); body.append(section);
  }

  function renderProviders() {
    heading("AI providers", "Connect once, choose your model, then keep writing defaults close at hand.");
    const collection = el("div", "stg-profiles"), selection = select([...profiles.map(profile => [profile.id, `${profile.name}${profileDirty(profile.id) ? " · draft" : ""}`] as [string, string]), ["new", "+ New Studio profile"]], selected); selection.ariaLabel = "Saved Studio profile";
    selection.onchange = () => { selected = selection.value; render(); };
    collection.append(labelled("Saved on this computer", selection), el("p", "muted", profiles.length ? `${profiles.length} fictional profiles · Each profile keeps its own draft` : "No saved profiles yet. Start with a name and endpoint.")); body.append(collection);
    const draft = drafts.get(selected) ?? structuredClone(profiles.find(profile => profile.id === selected) ?? newProfile()); drafts.set(selected, draft);
    const grid = el("div", "stg-provider-grid"), connection = card("Connection", "Name → endpoint → API Key → Connect → model → Save", "stg-connection"), defaults = card("Writing defaults", "Thinking uses part of the response allowance.", "stg-defaults");
    const form = el("form", "stg-provider-form"); form.noValidate = true;
    const errors = el("div", "stg-errors"); errors.role = "alert"; errors.hidden = true;
    const controls = new Map<keyof Profile, HTMLInputElement | HTMLSelectElement>();
    const add = (section: HTMLElement, key: keyof Profile, label: string, help: string, type = "text") => {
      const input = field(String(draft[key]), type); input.ariaLabel = label; if (type === "number") input.step = "1";
      input.oninput = () => { (draft as unknown as Record<string, unknown>)[key] = input.value; if (key === "endpoint") invalidateConnection(); sync(); };
      controls.set(key, input); section.append(labelled(label, input, help)); return input;
    };
    add(connection, "name", "Profile name", "A local name for this connection.");
    add(connection, "endpoint", "Endpoint", "Loopback HTTP or verified HTTPS. This preview never connects to it.");
    const privateRow = row("Allow private-network HTTP", "Unencrypted LAN or VPN connections need explicit opt-in.", check("Allow private-network HTTP", draft.privateHttp, value => { draft.privateHttp = value; invalidateConnection(); sync(); })); connection.append(privateRow);
    const keyState = el("p", "stg-key-state"), keyEntry = action("Fictional native API Key entry…", () => {
      const dialog = el("dialog", "lp-dialog stg-dialog"); dialog.ariaLabel = "Fictional native API Key entry";
      dialog.append(el("p", "eyebrow", "Browser simulation"), el("h2", "", "Fictional native API Key entry"), el("p", "", "The app opens a native credential dialog here. This sample has no credential field. Do not enter a real key."), el("p", "stg-inline-note", "Use fictional key marks a sample key as ready in browser memory."));
      const cancel = action("Cancel key entry", () => { dialog.close(); message("Key entry cancelled. Your profile draft is kept."); });
      dialog.append(cancel, action("Use fictional key", () => { draft.key = true; dialog.close(); sync(); message("Fictional key ready. Connect to retrieve the sample model list."); }, true));
      dialog.onclose = () => { dialog.remove(); keyEntry.focus(); }; frame.shell.append(dialog); dialog.showModal(); cancel.focus();
    });
    const removeKey = action("Remove fictional key", () => confirm("Remove this sample key?", "Only this profile's fictional key will be removed from browser memory. Its saved writing settings stay available.", "Remove sample key", () => {
      const saved = profiles.find(profile => profile.id === selected), wasClean = !profileDirty(selected);
      draft.key = false; draft.connected = false;
      if (saved && wasClean) { saved.key = false; saved.connected = false; }
      sync(); message(saved && wasClean ? "Fictional key removed from the saved sample profile. Writing settings are kept." : "Fictional key removed from this draft.");
    }));
    const key = el("div", "stg-key"); key.append(el("h4", "", "API Key"), keyState, buttons(keyEntry, removeKey)); connection.append(key);
    const connectionState = el("p", "stg-connection-state"); connectionState.role = "status";
    const connect = action("Connect", () => {
      if (!validAddress()) return;
      start("Connecting and retrieving sample models…", () => {
        if (failurePending) {
          failurePending = false; draft.connected = false; sync();
          const text = "Simulated connection failure. The endpoint and fictional key are retained. Try Connect again.";
          message(text, true); connectionState.textContent = text; connectionState.dataset.kind = "error"; connectionState.scrollIntoView({ block: "nearest" }); return;
        }
        draft.connected = true; sync(); message("Connected in sample. Choose an exact model, then Save profile.");
      }); sync();
    });
    const cancelConnection = action("Cancel connection", () => { cancel(); sync(); message("Connection cancelled. Your name, endpoint and fictional key are retained."); });
    connection.append(connectionState, buttons(connect, cancelConnection));
    const model = select([["", "Choose a model"], ...models.map(id => [id, id] as [string, string])], draft.model); model.ariaLabel = "Model ID"; model.onchange = () => { draft.model = model.value; sync(); }; controls.set("model", model);
    const modelField = labelled("Model ID", model, "Exact ID from this connection's sample list."); connection.append(modelField);
    const budget = add(defaults, "context", "Context length", "Input + response reserve + safety margin. Also used for model-load context.", "number"); budget.min = "256"; budget.max = "2000000";
    const response = add(defaults, "response", "Maximum response length", "A new profile starts at 16,384 tokens. A lower limit can cut writing short.", "number"); response.min = "1"; response.max = "2000000";
    defaults.append(row("Thinking", "Let the model think before answering. This may take longer.", check("Thinking", draft.thinking, value => { draft.thinking = value; sync(); })), el("p", "stg-inline-note", "New profiles use 32,768 context, 16,384 response and Thinking on. Existing limits stay as saved."));
    grid.append(connection, defaults); form.append(errors, grid);
    const advanced = details("Advanced · model loading, sampling & maintenance");
    const advancedGrid = el("div", "stg-advanced-grid"), sampling = card("Sampling"), loading = card("Model loading", "Save preferences before applying them to the sample model.");
    const temperature = add(sampling, "temperature", "Temperature", "0–2. Start at 1 for writing.", "number"); temperature.min = "0"; temperature.max = "2"; temperature.step = "0.01";
    const topP = add(sampling, "topP", "Top-p", "0–1. Start at 0.95.", "number"); topP.min = "0"; topP.max = "1"; topP.step = "0.01";
    const slots = add(loading, "parallel", "Parallel slots", "Whole number from 1 to 64. Start at 1.", "number"); slots.min = "1"; slots.max = "64";
    const gpu = select([["auto", "Automatic"], ["manual", "Manual"]], draft.gpu); gpu.ariaLabel = "GPU memory mode"; gpu.onchange = () => { draft.gpu = gpu.value; sync(); }; controls.set("gpu", gpu); loading.append(labelled("GPU memory mode", gpu, "Manual is a request, not a guaranteed GPU-layer count."));
    const fit = select([["on", "On"], ["off", "Off"]], draft.fit); fit.ariaLabel = "Automatic memory fitting"; fit.onchange = () => { draft.fit = fit.value; sync(); }; controls.set("fit", fit); loading.append(labelled("Automatic memory fitting", fit, "Starts Off. Actual loaded settings may differ."));
    const report = el("p", "stg-inline-note"); report.hidden = true;
    const read = action("Read model-load settings", () => { report.hidden = false; report.textContent = `Sample report · requested ${Number(draft.context).toLocaleString()} context / ${draft.parallel} slot(s) / ${draft.gpu} memory / fitting ${draft.fit}. Effective loaded context 32,768. Automatic model switching remains off.`; message("Model-load report simulated. No model was contacted."); });
    const apply = action("Apply model-load settings", () => { report.hidden = false; report.textContent = "Sample saved settings updated. The active model was not reloaded. Read again to compare effective values."; message("Apply simulated. No model was loaded or changed."); }); loading.append(buttons(read, apply), report);
    const testing = card("Response format test", "A separate synthetic request checks structured output. No project content is part of it.");
    const testStatus = el("p", "muted", "Not tested in this sample.");
    const test = action("Test response format", () => { start("Testing the sample response format…", () => { testStatus.textContent = "Sample response format passed. Every writing proposal still needs review."; sync(); message("Response format test completed in sample."); }); sync(); });
    const cancelTest = action("Cancel response format test", () => { cancel(); sync(); message("Response format test cancelled. No compatibility result recorded."); });
    const payload = details("Inspect synthetic test request"); payload.append(el("pre", "stg-source-sample", '{ "instruction": "Return one fictional structured proposal", "projectContent": null }')); testing.append(testStatus, buttons(test, cancelTest), payload);
    const maintenance = card("Local profile maintenance", "These actions affect this browser sample only.");
    const reload = action("Reload profiles", () => {
      const reloadNow = () => { drafts.clear(); render(); message("Saved sample profiles reloaded. No local files were read."); };
      if ([...drafts.keys()].some(profileDirty)) confirm("Reload saved sample profiles?", "Reload discards unsaved profile drafts. Your saved sample profiles stay available.", "Reload sample profiles", reloadNow); else reloadNow();
    });
    const remove = action("Remove profile", () => confirm("Remove this sample profile?", `Remove ${profiles.find(profile => profile.id === selected)?.name ?? "this profile"} and its fictional key? Other profiles are kept.`, "Remove sample profile", () => { const index = profiles.findIndex(profile => profile.id === selected); if (index >= 0) profiles.splice(index, 1); drafts.delete(selected); selected = profiles[0]?.id ?? "new"; render(); message("Profile removed from sample."); })); maintenance.append(buttons(reload, remove));
    advancedGrid.append(sampling, loading, testing, maintenance); advanced.append(advancedGrid); form.append(advanced);
    const savebar = el("div", "stg-savebar"), saveState = el("span", "muted"), save = action("Save profile", () => form.requestSubmit(), true);
    const discard = action("Discard profile changes", () => confirm("Discard this profile draft?", "Return this profile to its saved sample settings. Other drafts are kept.", "Discard draft", () => { drafts.delete(selected); render(); message("Profile draft discarded in sample."); }));
    savebar.append(saveState, discard, save); form.append(savebar); body.append(form);
    function invalidateConnection() { draft.key = false; draft.connected = false; draft.model = ""; model.value = ""; }
    function validAddress() {
      const nameError = !draft.name.trim() || new TextEncoder().encode(draft.name).length > 80 || /[\u0000-\u001f\u007f-\u009f]/u.test(draft.name);
      if (nameError) { showError("Enter a profile name using at most 80 UTF-8 bytes and no control characters.", "name"); return false; }
      if (!draft.endpoint.trim()) { showError("Enter the Studio base endpoint.", "endpoint"); return false; }
      try { const url = new URL(draft.endpoint); if (!["http:", "https:"].includes(url.protocol)) throw Error(); if (url.protocol === "http:" && !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) && !draft.privateHttp) { showError("This simulated private HTTP connection needs explicit private-network HTTP opt-in.", "endpoint"); return false; } } catch { showError("Use an HTTP or HTTPS endpoint in this sample.", "endpoint"); return false; } return true;
    }
    function showError(text: string, key: keyof Profile) {
      errors.hidden = false; errors.textContent = text;
      form.querySelectorAll(".stg-field-error").forEach(error => error.remove());
      const input = controls.get(key); input?.setAttribute("aria-invalid", "true");
      const local = el("span", "stg-field-error", text); local.id = `stg-error-${key}`;
      input?.closest("label")?.append(local); input?.setAttribute("aria-describedby", `${input.getAttribute("aria-describedby") ?? ""} ${local.id}`.trim());
      const disclosure = input?.closest("details"); if (disclosure) disclosure.open = true;
      input?.focus(); input?.closest("label")?.scrollIntoView({ block: "nearest" }); message(`${text} Your draft is retained.`, true);
    }
    function sync() {
      const isBusy = !!busy, saved = profiles.some(profile => profile.id === selected), changed = profileDirty(selected);
      privateRow.hidden = !draft.endpoint.trim() || /^https:/i.test(draft.endpoint);
      keyState.textContent = draft.key ? "Fictional key ready · stored in memory only" : "No fictional key configured";
      keyEntry.disabled = isBusy || !draft.endpoint.trim(); removeKey.disabled = isBusy || !draft.key;
      connect.disabled = isBusy || !draft.endpoint.trim() || !draft.key; cancelConnection.hidden = busy !== "Connecting and retrieving sample models…";
      connectionState.textContent = busy || (draft.connected ? "Sample model list ready · No network request was made" : "Enter a fictional key, then Connect to retrieve models.");
      delete connectionState.dataset.kind;
      modelField.hidden = !draft.connected; model.disabled = isBusy;
      save.disabled = isBusy || !draft.connected || !draft.model || (!changed && saved); discard.disabled = isBusy || (!changed && saved);
      saveState.textContent = isBusy ? "Working…" : changed ? "Unsaved profile changes" : saved ? "Saved sample profile" : "New profile · unsaved";
      for (const input of controls.values()) input.disabled = isBusy;
      for (const input of form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')) input.disabled = isBusy;
      selection.disabled = isBusy; reload.disabled = isBusy; remove.disabled = isBusy || !saved || changed;
      read.disabled = apply.disabled = test.disabled = isBusy || !saved || changed || !draft.key;
      cancelTest.hidden = busy !== "Testing the sample response format…";
      for (const button of scopes.querySelectorAll<HTMLButtonElement>("button")) button.disabled = isBusy;
      for (const button of navigation.querySelectorAll<HTMLButtonElement>("button")) button.disabled = isBusy;
    }
    form.onsubmit = event => {
      event.preventDefault(); if (busy) return; errors.hidden = true; form.querySelectorAll(".stg-field-error").forEach(error => error.remove()); for (const input of controls.values()) input.removeAttribute("aria-invalid"); if (!validAddress()) return;
      const whole = (value: string, min: number, max: number) => !!value.trim() && Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;
      if (!whole(draft.context, 256, 2000000)) { showError("Enter a whole context length from 256 to 2,000,000 tokens.", "context"); return; }
      if (!whole(draft.response, 1, 2000000) || Number(draft.response) + 128 >= Number(draft.context)) { showError("The response must leave more than 128 tokens within the context length.", "response"); return; }
      if (!models.includes(draft.model) || !draft.connected) { showError("Choose an exact model from the connected sample list.", "model"); return; }
      if (!whole(draft.parallel, 1, 64)) { showError("Use 1–64 whole parallel slots.", "parallel"); return; }
      if (!draft.temperature.trim() || !Number.isFinite(Number(draft.temperature)) || Number(draft.temperature) < 0 || Number(draft.temperature) > 2) { showError("Temperature must be between 0 and 2.", "temperature"); return; }
      if (!draft.topP.trim() || !Number.isFinite(Number(draft.topP)) || Number(draft.topP) < 0 || Number(draft.topP) > 1) { showError("Top-p must be between 0 and 1.", "topP"); return; }
      start("Saving sample profile…", () => { const saved = structuredClone(draft); const index = profiles.findIndex(profile => profile.id === selected); if (index >= 0) profiles[index] = saved; else { saved.id = `sample-${profiles.length + 1}`; profiles.push(saved); } drafts.delete(selected); selected = saved.id; render(); message("Profile saved in sample. Test response format before generating."); }); sync();
    };
    sync();
    if (context.state === "error" && failurePending) message("Sample connection could not be reached. Edit the retained profile, or Connect to retry the simulated failure.", true);
  }
  function start(text: string, done: () => void) { busy = text; const version = ++operation; message(text); timer = setTimeout(() => { if (disposed || version !== operation) return; busy = ""; done(); }, 550); }
  function cancel() { ++operation; if (timer) clearTimeout(timer); busy = ""; }

  function renderProject() {
    heading("The Last Tram", "Project settings stay with this story. Application preferences stay on this device.", "Current project");
    body.append(tabList(["Project overview", "System prompts", "Context preparation"], projectTab, name => { projectTab = name; render(); }, "Project settings"));
    if (projectTab === "Project overview") {
      const overview = card("Runtime & display", "Inspect the pinned runtime and the game's own resolution.");
      overview.append(row("Ren'Py SDK", "Pinned runtime for this fictional project.", el("code", "", "8.5.3")), row("Game resolution", "Read-only here. Independent of interface size.", el("strong", "", "1920 × 1080")), row("Preview & Run", "Review SDK selection and execution trust.", action("Manage SDK & execution trust", () => frame.navigate("runtime"))));
      const writing = card("Writing instructions", "Choose an action, edit its system prompt, then inspect context before any send."); writing.append(buttons(action("Edit system prompts", () => { projectTab = "System prompts"; render(); }), action("Prepare context", () => { projectTab = "Context preparation"; render(); })), el("p", "stg-footnote muted", "Shared world and tone live in Lorebook. Legacy project style notes are preserved and excluded from AI requests.")); body.append(overview, writing); return;
    }
    const actionChoice = select(actions.map((action, index) => [String(index), action]), String(currentAction)); actionChoice.ariaLabel = "Prompt action"; actionChoice.onchange = () => { currentAction = Number(actionChoice.value); render(); }; body.append(labelled("Action", actionChoice));
    if (projectTab === "System prompts") renderPrompt(); else renderContext();
  }
  function renderPrompt() {
    const section = card(`${actions[currentAction]} system prompt`, "Edit authoring instructions for this project. Save explicitly.");
    const editor = el("textarea"); editor.rows = 9; editor.value = promptDrafts[currentAction]!; editor.ariaLabel = "Action system prompt";
    const state = el("p", "stg-prompt-state muted");
    const save = action("Save prompt", () => {
      if (!editor.value.trim()) { editor.setAttribute("aria-invalid", "true"); message("Enter a system prompt before saving. Your draft is retained.", true); editor.focus(); return; }
      if (failurePending) { failurePending = false; message("Simulated prompt save failure. Your draft is retained.", true); return; }
      promptSaved[currentAction] = editor.value; promptDrafts[currentAction] = editor.value; promptHistory.splice(historyIndex + 1); promptHistory.push([...promptSaved]); historyIndex++; render(); message("Project prompt saved in sample. Build a fresh context preview.");
    }, true);
    const discard = action("Discard prompt changes", () => confirm("Discard this prompt draft?", "Return this action to its saved sample prompt. Other prompt drafts stay available.", "Discard draft", () => { promptDrafts[currentAction] = promptSaved[currentAction]!; render(); message("Prompt draft discarded in sample."); }));
    const restore = action("Restore baseline", () => {
      const dialog = el("dialog", "lp-dialog stg-dialog"); dialog.ariaLabel = "Restore installed baseline?";
      dialog.append(el("h2", "", "Restore installed baseline?"), el("h3", "", "Current saved prompt"), el("pre", "stg-source-sample", promptSaved[currentAction]), el("h3", "", "Installed baseline v1"), el("pre", "stg-source-sample", baseline[currentAction]), action("Cancel restore", () => dialog.close()), action("Confirm restore baseline", () => { promptSaved[currentAction] = baseline[currentAction]!; promptDrafts[currentAction] = baseline[currentAction]!; promptHistory.splice(historyIndex + 1); promptHistory.push([...promptSaved]); historyIndex++; dialog.close(); render(); message("Baseline restored in sample. Undo remains available."); })); dialog.onclose = () => dialog.remove(); frame.shell.append(dialog); dialog.showModal();
    });
    const history = (direction: number) => { historyIndex += direction; const saved = promptHistory[historyIndex]!; saved.forEach((text, index) => { promptSaved[index] = text; promptDrafts[index] = text; }); render(); message(direction < 0 ? "Project prompt change undone in sample." : "Project prompt change redone in sample."); };
    const undo = action("Undo project change", () => history(-1)), redo = action("Redo project change", () => history(1));
    const sync = () => { const changed = promptDrafts[currentAction] !== promptSaved[currentAction]; state.textContent = changed ? "Unsaved prompt changes · Draft kept for this action" : `${promptSaved[currentAction] === baseline[currentAction] ? "Installed baseline v1" : "Customized"} · Saved in this project`; save.disabled = discard.disabled = !changed; restore.disabled = changed || promptSaved[currentAction] === baseline[currentAction]; undo.disabled = promptDirty() || historyIndex === 0; redo.disabled = promptDirty() || historyIndex >= promptHistory.length - 1; };
    editor.oninput = () => { promptDrafts[currentAction] = editor.value; editor.removeAttribute("aria-invalid"); sync(); message("Prompt draft kept in this preview. Save or discard before context preparation."); };
    section.append(state, labelled("Action system prompt", editor));
    const savebar = el("div", "stg-savebar"); savebar.append(undo, redo, restore, discard, save); section.append(savebar);
    const legacy = details("Legacy project style notes · preserved"); legacy.append(el("p", "muted", "These notes are excluded from AI requests. Use Lorebook → Tone & writing style for shared guidance."), el("pre", "stg-source-sample", "Quiet conversations. Weathered stations. The city feels familiar after dark."), action("Open Lorebook", () => frame.navigate("lorebook"))); section.append(legacy); body.append(section); sync();
  }
  function renderContext() {
    const section = card(`Prepare ${actions[currentAction]} context`, "Inspect saved instructions and exact reference revisions. This preparation does not send or apply anything.");
    const target = select([["platform", "Station platform · Dialogue 4 · Mara"], ["ticket", "Ticket office · Dialogue 2 · Ivo"]], "platform"); target.ariaLabel = "Saved assistance target";
    const title = field("A late departure"); title.ariaLabel = "Draft title";
    const task = el("textarea"); task.rows = 3; task.ariaLabel = "Task instructions"; task.value = "Keep Mara's answer brief. Let the station bell interrupt her.";
    const budget = field("32768", "number"), response = field("16384", "number"); budget.ariaLabel = "Preview context length"; response.ariaLabel = "Preview maximum response length";
    const shared = check("Include project world & tone", true, invalidate);
    const references = el("div", "stg-references"); references.role = "group"; references.ariaLabel = "Exact approved reference revisions";
    for (const [name, id] of [["Mara · Character card · saved version 3", "mara-r3"], ["Night service · Lore · saved version 2", "night-r2"], ["Ivo · Character card · unavailable: stale citation", "ivo-r1"]]) { const label = el("label", "stg-reference"), input = check(name!, false, invalidate); input.dataset.revision = id; input.disabled = id === "ivo-r1"; label.append(input, el("span", "", name)); references.append(label); }
    const result = el("div", "stg-context-result"); result.ariaLive = "polite";
    function invalidate() { result.replaceChildren(); }
    for (const input of [target, title, task, budget, response]) input.addEventListener(input === target ? "change" : "input", invalidate);
    section.append(labelled(currentAction === 3 ? "Saved insertion anchor" : "Saved Beat", target));
    if ([3, 4, 5].includes(currentAction)) section.append(labelled("Title", title));
    section.append(labelled("Task instructions (this preview)", task), row("Include project world & tone", "Use saved shared guidance for this request.", shared));
    const limits = el("div", "stg-context-limits"); limits.append(labelled("Context length (tokens)", budget), labelled("Maximum response length (tokens)", response));
    section.append(limits, el("p", "stg-footnote muted", "These preview overrides do not change the saved provider profile."), el("h4", "", "Approved reference revisions"), references);
    const build = action("Build context preview", () => {
      result.replaceChildren();
      if (promptDirty()) { message("Save or discard prompt changes before preparing context.", true); return; }
      const b = Number(budget.value), r = Number(response.value), inputTokens = 1640, margin = 256;
      if (!Number.isInteger(b) || !Number.isInteger(r) || b < 256 || b > 2000000 || r < 1 || r + inputTokens + margin > b) { message("The preview input, response and margin must fit within a whole context length of 256–2,000,000 tokens.", true); budget.setAttribute("aria-invalid", "true"); return; }
      if (currentAction === 1) { message("Prepare Edit Scene in Story → Assist to inspect the selected batch operations."); return; }
      const included = [...references.querySelectorAll<HTMLInputElement>("input:checked")].map(input => input.dataset.revision);
      result.append(el("h3", "", "Would-be payload · preview only"), el("p", "", `${inputTokens.toLocaleString()} input + ${r.toLocaleString()} response + ${margin} margin = ${(inputTokens + r + margin).toLocaleString()} / ${b.toLocaleString()} tokens`), el("p", "muted", `World & tone: ${shared.checked ? "Included" : "Omitted"} · ${included.length} exact reference revisions · No send available`));
      const exact = details("Inspect complete serialized preview"), payload = { action: actions[currentAction], savedPrompt: promptSaved[currentAction], target: target.options[target.selectedIndex]!.text, title: [3, 4, 5].includes(currentAction) ? title.value : undefined, task: task.value, worldAndTone: shared.checked ? "A coastal city after midnight. Quiet, concrete writing." : null, exactRevisions: included, exclusions: ["Unrelated Source drafts", "Legacy style notes", "Stale Ivo citation"], contextLength: b, maximumResponse: r };
      exact.append(el("pre", "stg-source-sample", JSON.stringify(payload, null, 2))); result.append(exact, el("p", "stg-footnote muted", "Fictional size estimate. Unsupported custom code remains unexecuted. A changed field requires a fresh preview.")); message("Context preview prepared in sample. Nothing was sent.");
    }, true);
    const reload = action("Reload saved choices", () => { if (promptDirty()) message("Save or discard prompt changes before reloading saved choices.", true); else { invalidate(); message("Saved fictional choices reloaded. Reference selections remain explicit."); } });
    if (promptDirty()) section.append(el("p", "stg-inline-note", "An action has an unsaved prompt draft. Save or discard it before building context."));
    section.append(buttons(build, reload), result); body.append(section);
  }
  render();
  return () => { disposed = true; cancel(); };
}
