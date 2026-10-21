import type { LabContext } from "../../contracts.ts";
import { action, element, labPage } from "../../page.ts";
import { icon } from "../../../src/icons.ts";
import { sampleFiles, type SourceSample } from "./fixture.ts";
import "./source.css";

type Layout = "workbench" | "focus";

export function mountSource(host: HTMLElement, context: LabContext, layout: Layout) {
  const files = sampleFiles(context.state);
  let current = files[0]!;
  const tabs = new Set([current.path, files[1]!.path]);
  let failNext = context.state === "error";
  let invalid = false;
  let busy = false;
  let disposed = false;
  let filesOpen = layout === "workbench" && innerWidth >= 850;
  let contextOpen = false;
  let findOpen = false;
  let mapped = "";
  let message = "All sample files are up to date";
  const dirty = (file = current) => file.text !== file.saved;
  const frame = labPage(host, context, { screen: "source", title: "Source", subtitle: layout === "workbench" ? "Docked workbench" : "Focus editor", dirty: () => files.some(file => dirty(file)) });
  frame.shell.classList.add("sl-shell");
  frame.shell.dataset.layout = layout;
  const workspace = element("div", "sl-workspace");
  const filePanel = element("aside", "sl-files"); filePanel.ariaLabel = "Source files";
  const work = element("section", "sl-work"); work.ariaLabel = "Source editing";
  const inspector = element("aside", "sl-context"); inspector.ariaLabel = "Scene context";
  workspace.append(filePanel, work, inspector); frame.content.append(workspace);
  const announce = (text: string, error = false) => { message = text; frame.status.textContent = text; frame.status.dataset.error = String(error); };
  const button = (label: string, callback: () => void, glyph?: Parameters<typeof icon>[0], primary = false) => {
    const result = action(label, callback, primary); if (glyph) result.prepend(icon(glyph)); return result;
  };
  function modal(title: string, origin?: HTMLElement) {
    const prior = origin ?? (document.activeElement instanceof HTMLElement ? document.activeElement : undefined);
    const dialog = element("dialog", "lp-dialog sl-dialog"); dialog.ariaLabel = title;
    dialog.append(element("h2", "", title));
    dialog.onclose = () => { dialog.remove(); prior?.isConnected && prior.focus(); };
    frame.shell.append(dialog);
    return dialog;
  }
  const filesToggle = button("Files", () => {
    remember(); filesOpen = !filesOpen; syncPanels(); filesToggle.focus();
    if (filesOpen && innerWidth < 850) fileSearch.focus();
  }, "source");
  const findToggle = button("Find / replace", () => { findOpen = !findOpen; findBar.hidden = !findOpen; findToggle.ariaExpanded = String(findOpen); if (findOpen) findInput.focus(); else editor.focus(); });
  const contextToggle = button("Scene context", () => { contextOpen = !contextOpen; syncPanels(); contextToggle.focus(); }, "panel");
  frame.tools.append(filesToggle, findToggle, contextToggle);

  const fileHeading = element("div", "sl-panel-heading"); fileHeading.append(element("h2", "", "Source files"));
  const hideFiles = action("Hide", () => { filesOpen = false; syncPanels(); filesToggle.focus(); }); hideFiles.ariaLabel = "Hide source files"; fileHeading.append(hideFiles);
  const fileSearch = element("input", "sl-input"); fileSearch.type = "search"; fileSearch.placeholder = "Find a file…"; fileSearch.ariaLabel = "Find a file";
  const fileRows = element("div", "sl-file-rows");
  const fileCount = element("p", "sl-note");
  fileSearch.oninput = drawFiles;
  filePanel.append(fileHeading, fileSearch, fileRows, fileCount);
  filePanel.append(action("Session drafts", showDrafts), action("Refresh files", () => { announce("Sample inventory refreshed. Your drafts are retained."); drawFiles(); }));

  const tabBar = element("div", "sl-tabs"); tabBar.role = "tablist"; tabBar.ariaLabel = "Open source files";
  const documentHeader = element("div", "sl-document-header");
  const identity = element("div", "sl-identity"); const path = element("h2"); const fileMeta = element("p", "sl-note"); identity.append(path, fileMeta);
  const badge = element("span", "sl-badge"); documentHeader.append(identity, badge);
  const toolbar = element("div", "sl-edit-tools");
  const save = button("Save source", saveCurrent, undefined, true);
  const undo = action("Undo", () => historyMove(false));
  const redo = action("Redo", () => historyMove(true));
  const discard = action("Discard draft", () => confirmDiscard());
  const more = element("details", "sl-more"); const summary = element("summary", "button", "More"); more.append(summary);
  const moreMenu = element("div", "sl-more-menu");
  const refresh = action("Refresh source", () => { more.open = false; announce(current.external ? "An external change needs review. Your draft is retained." : "Sample source checked. Your draft is retained."); update(); });
  const copy = action("Copy draft", () => { more.open = false; const d = modal("Copy this sample draft"); d.append(element("p", "", "The full text is available below. Select it and use your usual copy shortcut.")); const text = element("textarea", "sl-copy"); text.ariaLabel = "Draft to copy"; text.readOnly = true; text.value = current.text; d.append(text, action("Done", () => d.close())); d.showModal(); text.focus(); text.select(); });
  const simulations = element("details", "sl-simulations"); simulations.append(element("summary", "", "Sample scenarios"), element("p", "sl-note", "These controls change fictional sample conditions."));
  simulations.append(action("External change", () => { remember(); current.external = current.saved + "\n# External note: the clock was repaired.\n"; more.open = false; update(); announce("Simulated external change. Review both versions before saving."); }), action("Fail next save", () => { failNext = true; more.open = false; announce("The next sample save will fail once."); }), action("Invalid draft", () => { edit(current.text.replace("label last_service:", "label last_service")); invalid = true; more.open = false; update(); announce("Sample syntax problem added. Edit the source to clear this simulated validation state.", true); }));
  moreMenu.append(refresh, copy, action("Session drafts", () => { more.open = false; showDrafts(); }), simulations); more.append(moreMenu);
  toolbar.append(save, undo, redo, discard, more);

  const notice = element("div", "sl-notice"); notice.role = "status";
  const noticeText = element("span"); const review = action("Review changes", reviewConflict); notice.append(noticeText, review);
  const findBar = element("div", "sl-find"); findBar.hidden = true;
  const findInput = element("input", "sl-input"); findInput.type = "search"; findInput.placeholder = "Find in this file"; findInput.ariaLabel = "Find text";
  const replaceInput = element("input", "sl-input"); replaceInput.placeholder = "Replace with"; replaceInput.ariaLabel = "Replace with";
  const matchCase = element("input"); matchCase.type = "checkbox"; const caseLabel = element("label", "sl-case"); caseLabel.append(matchCase, "Match case");
  const matchCount = element("span", "sl-note");
  const next = action("Next", () => findNext());
  const replace = action("Replace", () => replaceMatch(false));
  const replaceAll = action("Replace all", () => replaceMatch(true));
  const closeFind = action("Close", () => { findOpen = false; findBar.hidden = true; findToggle.ariaExpanded = "false"; findToggle.focus(); }); closeFind.ariaLabel = "Close find and replace";
  findBar.append(findInput, replaceInput, caseLabel, next, replace, replaceAll, matchCount, closeFind);
  findInput.oninput = updateMatches; matchCase.onchange = updateMatches;
  findInput.onkeydown = event => { if (event.key === "Enter") { event.preventDefault(); findNext(); } if (event.key === "Escape") closeFind.click(); };
  const editorShell = element("div", "sl-editor-shell");
  const gutter = element("pre", "sl-gutter"); gutter.ariaHidden = "true";
  const editor = element("textarea", "sl-editor"); editor.spellcheck = false; editor.wrap = "off"; editor.autocapitalize = "off"; editor.autocomplete = "off";
  const empty = element("div", "sl-empty"); empty.append(element("h3", "", "Start with a line of source"), element("p", "sl-note", "This file is empty. Type in the editor to keep a draft in this session."));
  const unavailable = element("div", "sl-unavailable"); unavailable.append(element("h3", "", "This sample file is unavailable"), element("p", "", "It may have moved outside the app. The other files and their drafts are still available."), action("Retry file", () => announce("This fictional file is still unavailable. No draft was changed.", true)));
  editorShell.append(gutter, editor, empty, unavailable);
  const bottom = element("div", "sl-bottom"); const position = element("span"); const sessionHint = element("span", "sl-session-hint", "Session draft only · Save to accept changes"); bottom.append(position, sessionHint);
  work.append(tabBar, documentHeader, toolbar, notice, findBar, editorShell, bottom);

  const contextHeading = element("div", "sl-panel-heading"); const closeContext = action("Close", () => { contextOpen = false; syncPanels(); contextToggle.focus(); }); closeContext.ariaLabel = "Close scene context"; contextHeading.append(element("h2", "", "Scene context"), closeContext);
  const contextBody = element("div", "sl-context-body"); inspector.append(contextHeading, contextBody);
  function syncPanels() {
    workspace.dataset.files = String(filesOpen); workspace.dataset.context = String(contextOpen);
    filePanel.hidden = !filesOpen; inspector.hidden = !contextOpen;
    filesToggle.ariaExpanded = String(filesOpen); contextToggle.ariaExpanded = String(contextOpen);
  }
  function remember() { current.start = editor.selectionStart; current.end = editor.selectionEnd; current.scroll = editor.scrollTop; }
  function drawFiles() {
    fileRows.replaceChildren();
    const shown = files.filter(file => file.path.toLowerCase().includes(fileSearch.value.toLowerCase()));
    if (!shown.length) fileRows.append(element("p", "sl-note", "No matching source files."));
    for (const file of shown) {
      const row = action("", () => openFile(file)); row.className = `sl-file${file === current ? " selected" : ""}`; row.dataset.path = file.path; row.ariaLabel = file.path; if (file === current) row.ariaCurrent = "page";
      row.append(icon("source")); const title = element("span", "sl-file-name", file.path.replace("game/", "")); title.append(element("small", "", file.title));
      row.append(title, element("span", "sl-file-state", file.external ? "!" : dirty(file) ? "●" : file.kind === "read-only" ? "R" : file.kind === "unavailable" ? "?" : "")); row.title = file.path; fileRows.append(row);
    }
    const drafts = files.filter(file => dirty(file)).length;
    fileCount.textContent = `${files.length} files · ${drafts ? `${drafts} session draft${drafts > 1 ? "s" : ""}` : "No unsaved drafts"}`;
  }
  function drawTabs() {
    tabBar.replaceChildren();
    for (const path of tabs) {
      const file = files.find(item => item.path === path)!; const group = element("div", "sl-tab-group"); group.dataset.active = String(current === file);
      const tab = action(file.path.split("/").at(-1)!, () => openFile(file)); tab.role = "tab"; tab.ariaSelected = String(current === file); if (dirty(file)) tab.append(element("span", "sl-tab-dot", "●"));
      const close = action("×", () => { remember(); tabs.delete(path); if (file === current) { const next = files.find(item => tabs.has(item.path)); if (next) openFile(next); else { tabs.add(file.path); announce("Keep one file open. Its draft remains available."); } } drawTabs(); }); close.ariaLabel = `Close ${file.path.split("/").at(-1)} tab; keep draft`;
      group.append(tab, close); tabBar.append(group);
    }
  }
  function openFile(file: SourceSample) {
    if (busy) return;
    remember(); current = file; mapped = ""; invalid = false; tabs.add(file.path);
    if (innerWidth < 850 || layout === "focus") filesOpen = false;
    drawCurrent(); announce(file.kind === "unavailable" ? "This sample file is unavailable" : dirty() ? "Session draft restored" : "Sample source opened");
  }
  function drawCurrent() {
    editor.value = current.text; editor.ariaLabel = `Source editor for ${current.path}`; path.textContent = current.path.replace("game/", "");
    fileMeta.textContent = "game/ · UTF-8 · LF"; editor.readOnly = current.kind !== "editable"; editor.hidden = current.kind === "unavailable"; gutter.hidden = editor.hidden; unavailable.hidden = !editor.hidden;
    drawTabs(); drawFiles(); drawContext(); syncPanels(); update();
    editor.setSelectionRange(current.start, current.end); editor.scrollTop = current.scroll; gutter.scrollTop = current.scroll;
    if (!editor.hidden) editor.focus();
  }
  function edit(text: string) {
    if (text === current.text) return;
    current.history.push(current.text); current.future = []; current.text = text; editor.value = text; invalid = false; update();
  }
  editor.oninput = () => { const value = editor.value; if (value === current.text) return; current.history.push(current.text); current.future = []; current.text = value; invalid = false; remember(); update(); };
  editor.onscroll = () => { current.scroll = editor.scrollTop; gutter.scrollTop = editor.scrollTop; };
  const updatePosition = () => { const before = editor.value.slice(0, editor.selectionStart); position.textContent = `Ln ${before.split("\n").length}, Col ${before.length - before.lastIndexOf("\n")} · ${current.text.split("\n").length} lines`; };
  editor.onselect = () => { remember(); updatePosition(); }; editor.onkeyup = updatePosition; editor.onclick = updatePosition;
  editor.onkeydown = event => {
    const command = event.metaKey || event.ctrlKey;
    if (command && event.key.toLowerCase() === "s") { event.preventDefault(); if (!save.disabled) save.click(); }
    if (command && event.key.toLowerCase() === "f") { event.preventDefault(); if (!findOpen) findToggle.click(); else findInput.focus(); }
    if (command && event.key.toLowerCase() === "z") { event.preventDefault(); historyMove(event.shiftKey); }
    if (event.key === "Tab" && !editor.readOnly) { event.preventDefault(); const start = editor.selectionStart; edit(editor.value.slice(0, start) + "    " + editor.value.slice(editor.selectionEnd)); editor.setSelectionRange(start + 4, start + 4); }
  };
  function historyMove(forward: boolean) {
    const source = forward ? current.future : current.history; const target = forward ? current.history : current.future;
    if (!source.length || busy || editor.readOnly) return;
    target.push(current.text); current.text = source.pop()!; editor.value = current.text; invalid = false; update(); editor.focus(); announce(forward ? "Sample edit redone" : "Sample edit undone");
  }
  function update() {
    const blocked = current.kind !== "editable";
    save.disabled = busy || blocked || !dirty() || !!current.external || invalid;
    discard.disabled = busy || !dirty(); undo.disabled = busy || blocked || !current.history.length; redo.disabled = busy || blocked || !current.future.length;
    editor.readOnly = busy || blocked; workspace.dataset.busy = String(busy);
    more.inert = busy; if (busy) more.open = false;
    badge.textContent = busy ? "Saving…" : current.external ? "External change" : invalid ? "Syntax problem" : current.kind === "read-only" ? "Read-only" : current.kind === "unavailable" ? "Unavailable" : dirty() ? "Unsaved draft" : "Saved";
    badge.dataset.dirty = String(dirty());
    notice.hidden = !(current.external || invalid || blocked);
    notice.dataset.error = String(!!current.external || invalid);
    noticeText.textContent = current.external ? "This file changed outside the sample. Both versions are retained." : invalid ? "Sample syntax problem on line 4. Add the missing colon before saving." : current.kind === "read-only" ? "This sample file is read-only. Its custom syntax remains visible." : "The file could not be read.";
    review.hidden = !current.external;
    empty.hidden = current.text !== "" || blocked; gutter.textContent = Array.from({ length: current.text.split("\n").length }, (_, i) => String(i + 1)).join("\n");
    updatePosition(); updateMatches(); drawFiles(); drawTabs();
  }
  async function saveCurrent() {
    if (save.disabled) return;
    const file = current; remember(); busy = true; update(); announce("Validating and saving sample source…");
    await new Promise(resolve => setTimeout(resolve, 350)); if (disposed) return;
    busy = false;
    if (failNext) { failNext = false; announce("Simulated save failure. Your draft is retained. Retry when ready.", true); }
    else { file.saved = file.text; announce("Saved in sample. No project files were written."); }
    update(); editor.focus(); editor.setSelectionRange(file.start, file.end);
  }
  function confirmDiscard(external = false) {
    const file = current; const d = modal(external ? "Load the external version?" : "Discard this draft?");
    d.append(element("p", "", external ? "This replaces the session draft with the external sample version. Other file drafts stay as they are." : `This restores the last saved sample of ${file.path}. Other file drafts stay as they are.`));
    d.append(action("Keep editing", () => d.close()), action(external ? "Load external version" : "Discard this draft", () => {
      if (external && file.external) file.saved = file.external;
      file.text = file.saved; file.external = undefined; file.history = []; file.future = []; invalid = false; d.close(); drawCurrent(); announce(external ? "External sample loaded. Draft discarded." : "Sample draft discarded.");
    })); d.showModal();
  }
  function showDrafts() {
    const d = modal("Drafts in this session"); const drafts = files.filter(file => dirty(file));
    d.append(element("p", "", "Switching files or closing a tab retains its draft. Reloading this preview resets the sample. Session drafts do not survive a crash or restart."));
    if (!drafts.length) d.append(element("p", "sl-note", "No unsaved drafts."));
    for (const file of drafts) d.append(action(`Open ${file.path}`, () => { d.close(); openFile(file); }));
    d.append(action("Done", () => d.close())); d.showModal();
  }
  function reviewConflict() {
    if (!current.external) return;
    const file = current; const d = modal("Review external change"); d.classList.add("sl-conflict-dialog");
    d.append(element("p", "", "Your draft and the external version are separate. This sample can combine their non-overlapping changes."));
    const compare = element("div", "sl-compare");
    for (const [title, text] of [["Your session draft", file.text], ["External version", file.external]]) { const side = element("section"); side.append(element("h3", "", title!), element("pre", "", text!)); compare.append(side); }
    const combined = file.external!.endsWith("# External note: the clock was repaired.\n") ? file.text + "\n# External note: the clock was repaired.\n" : file.text.replace("Rain gathers beneath the station clock.", "Rain falls against the empty ticket booth.");
    const preview = element("details"); preview.append(element("summary", "", "Review combined result"), element("pre", "sl-combined", combined));
    const apply = action("Apply both", () => { file.history.push(file.text); file.future = []; file.saved = file.external!; file.text = combined; file.external = undefined; d.close(); drawCurrent(); announce("Combined as an unsaved sample draft. Review it, then save."); }, true);
    d.append(compare, preview, action("Keep draft for now", () => d.close()), action("Load external instead", () => { d.close(); confirmDiscard(true); }), apply); d.showModal();
  }
  function matches() {
    if (!findInput.value) return [];
    const haystack = matchCase.checked ? current.text : current.text.toLowerCase(); const needle = matchCase.checked ? findInput.value : findInput.value.toLowerCase();
    const result: number[] = []; let start = 0; while (start <= haystack.length) { const index = haystack.indexOf(needle, start); if (index < 0) break; result.push(index); start = index + needle.length; } return result;
  }
  function updateMatches() { const count = matches().length; matchCount.textContent = findInput.value ? `${count} match${count === 1 ? "" : "es"}` : ""; next.disabled = !count; replace.disabled = replaceAll.disabled = !count || current.kind !== "editable" || busy; }
  function findNext() { const found = matches(); if (!found.length) return; const index = found.find(value => value >= editor.selectionEnd) ?? found[0]!; editor.focus(); editor.setSelectionRange(index, index + findInput.value.length); editor.scrollTop = Math.max(0, (current.text.slice(0, index).split("\n").length - 4) * 23); remember(); updatePosition(); }
  function replaceMatch(all: boolean) {
    const found = matches(); if (!found.length || current.kind !== "editable") return;
    if (all) { let value = current.text; for (const index of found.reverse()) value = value.slice(0, index) + replaceInput.value + value.slice(index + findInput.value.length); edit(value); announce(`Replaced ${found.length} matches in this sample file.`); }
    else { const index = found.find(value => value >= editor.selectionStart) ?? found[0]!; edit(current.text.slice(0, index) + replaceInput.value + current.text.slice(index + findInput.value.length)); editor.focus(); editor.setSelectionRange(index, index + replaceInput.value.length); }
  }
  function drawContext() {
    contextBody.replaceChildren(element("p", "sl-note", "Mapped source ranges identify the parts Story can show. Custom code stays editable in Source."));
    if (!current.text.includes("label last_service:")) { contextBody.append(element("p", "sl-note", "No mapped ranges in this sample file.")); return; }
    const ranges = [
      ["Scene · Last service", "label last_service:", "    return"],
      ["Narration · The station clock", '    "Rain', "    mara"],
      ["Dialogue · Mara", "    mara", "    ivo"],
      ["Choice · Ask or wait", "    menu:", "    # This custom"],
      ["Custom code · Python", "    python:", "    return"],
    ];
    for (const [label, from, to] of ranges) {
      const b = action(label!, () => { const start = current.text.indexOf(from!); const end = current.text.indexOf(to!, start + from!.length); editor.focus(); editor.setSelectionRange(start, end < 0 ? current.text.length : end); mapped = label!; mapping.textContent = label!.startsWith("Custom") ? "Custom code remains Source-only." : `Selected ${label!.toLowerCase()}`; view.disabled = label!.startsWith("Custom"); remember(); editor.scrollTop = Math.max(0, (current.text.slice(0, start).split("\n").length - 3) * 23); });
      b.className = "sl-range"; contextBody.append(b);
    }
    const mapping = element("p", "sl-note", "Select a range to see its position in the editor.");
    const view = action("View selected beat in Story", () => { const d = modal("Story context"); d.append(element("p", "", `${mapped} belongs to Last service. This preview keeps you in Source; use Story in navigation to compare its separate drafts.`), action("Back to source", () => d.close())); d.showModal(); }); view.disabled = true;
    contextBody.append(mapping, view);
  }
  drawCurrent(); announce(current.external ? "External sample change needs review" : message);
  return () => { disposed = true; };
}
