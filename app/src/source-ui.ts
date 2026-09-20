export type SourceFileState = "clean" | "dirty" | "conflict" | "invalid" | "readOnly" | "unavailable";

export interface SourceFileSummary {
  readonly path: string;
  readonly state: SourceFileState;
  readonly sceneId?: string;
  readonly dirty: boolean;
  readonly readOnly: boolean;
}

export interface SourceInventory {
  readonly files: readonly SourceFileSummary[];
  readonly dirtyCount: number;
  readonly draftBytes: number;
}

export interface SourceDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly byteStart: number;
  readonly byteEnd: number;
}

export interface SourceRange {
  readonly sceneId: string;
  readonly beatId: string;
  readonly kind: string;
  readonly byteStart: number;
  readonly byteEnd: number;
  readonly editorStart: number;
  readonly editorEnd: number;
  readonly protected: boolean;
}

export interface SourceDocument {
  readonly path: string;
  readonly text?: string;
  readonly state: SourceFileState;
  readonly editable: boolean;
  readonly dirty: boolean;
  readonly baseRevision: string;
  readonly liveRevision?: string;
  readonly draftVersion: number;
  readonly hasBom: boolean;
  readonly newline: "LF" | "CRLF";
  readonly partial: boolean;
  readonly diagnostics: readonly SourceDiagnostic[];
  readonly ranges: readonly SourceRange[];
  readonly selectionStart: number;
  readonly selectionEnd: number;
  readonly selectedSceneId?: string;
  readonly selectedBeatId?: string;
  readonly canApplyBoth: boolean;
  readonly combinedPreview?: string;
  readonly externalText?: string;
}

export interface SourceTarget {
  readonly path: string;
  readonly selectionStart?: number;
  readonly selectionEnd?: number;
  readonly byteStart?: number;
  readonly byteEnd?: number;
}

export interface SourceActions {
  readonly open: (target: SourceTarget) => Promise<SourceDocument>;
  readonly update: (request: { readonly path: string; readonly expectedBaseRevision: string; readonly text: string; readonly selectionStart: number; readonly selectionEnd: number }) => Promise<SourceDocument>;
  readonly save: (request: { readonly path: string; readonly expectedBaseRevision: string; readonly expectedDraftVersion: number }) => Promise<SourceDocument>;
  readonly discard: (path: string) => Promise<SourceDocument>;
  readonly applyBoth: (request: { readonly path: string; readonly expectedBaseRevision: string; readonly expectedDraftVersion: number }) => Promise<SourceDocument>;
  readonly reloadInventory: () => Promise<SourceInventory>;
  readonly viewScene: (sceneId: string, beatId: string) => void;
  readonly status: (message: string, kind?: "normal" | "error") => void;
}

function button(label: string, className = "button secondary"): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = label;
  return element;
}

function stateLabel(state: SourceFileState): string {
  return ({ clean: "Clean", dirty: "Pending validation", conflict: "Conflict", invalid: "Invalid draft", readOnly: "Read-only", unavailable: "Unavailable" })[state];
}

function lineNumbers(text: string): string {
  const count = Math.max(1, text.split("\n").length);
  return Array.from({ length: count }, (_, index) => String(index + 1)).join("\n");
}

export function renderSourceWorkspace(
  host: HTMLElement,
  treeHost: HTMLElement,
  initialInventory: SourceInventory,
  actions: SourceActions,
  initialTarget?: SourceTarget,
): () => void {
  let inventory = initialInventory;
  let current: SourceDocument | undefined;
  let editor: HTMLTextAreaElement | undefined;
  let disposed = false;
  let openGeneration = 0;
  let updateQueue: Promise<void> = Promise.resolve();
  let observationTimer: number | undefined;
  let observationInterval: number | undefined;

  const drawTree = (): void => {
    treeHost.replaceChildren();
    const heading = document.createElement("p"); heading.className = "eyebrow"; heading.textContent = "Source files"; treeHost.append(heading);
    for (const file of inventory.files) {
      const row = document.createElement("div"); row.className = `source-file-row${current?.path === file.path ? " selected" : ""}`;
      const open = button(file.path.replace(/^game\//, ""), "source-file-open");
      open.title = file.path;
      if (current?.path === file.path) open.ariaCurrent = "page";
      open.addEventListener("click", () => void openFile({ path: file.path }));
      const state = document.createElement("span"); state.className = `source-state ${file.state}`; state.textContent = file.dirty ? "●" : file.state === "conflict" ? "!" : ""; state.title = stateLabel(file.state);
      row.append(open, state); treeHost.append(row);
    }
    const total = document.createElement("p"); total.className = "source-draft-total"; total.textContent = inventory.dirtyCount ? `${inventory.dirtyCount} draft${inventory.dirtyCount === 1 ? "" : "s"} · ${inventory.draftBytes.toLocaleString()} bytes` : "No unaccepted drafts"; treeHost.append(total);
  };

  const refreshInventory = async (): Promise<SourceInventory> => {
    inventory = await actions.reloadInventory();
    if (!disposed) drawTree();
    return inventory;
  };

  const enqueueUpdate = (): Promise<void> => {
    const documentAtInput = current;
    const control = editor;
    if (!documentAtInput || !control || !documentAtInput.editable) return updateQueue;
    const request = {
      path: documentAtInput.path,
      expectedBaseRevision: documentAtInput.baseRevision,
      text: control.value,
      selectionStart: control.selectionStart,
      selectionEnd: control.selectionEnd,
    };
    updateQueue = updateQueue.then(async () => {
      try {
        const next = await actions.update(request);
        if (!disposed && current?.path === next.path) {
          current = next;
          actions.status(next.state === "conflict" ? "Conflict — both Source versions retained" : next.dirty ? "Pending validation" : "Saved", next.state === "conflict" || next.state === "invalid" ? "error" : "normal");
          await refreshInventory();
          updateStateOnly();
        }
      } catch (error) {
        actions.status(error instanceof Error ? error.message : "Source draft could not be retained", "error");
      }
    });
    return updateQueue;
  };

  const updateStateOnly = (): void => {
    if (!current) return;
    const badge = host.querySelector<HTMLElement>(".source-document-state");
    if (badge) { badge.textContent = stateLabel(current.state); badge.dataset.state = current.state; }
    const save = host.querySelector<HTMLButtonElement>('button[data-source-action="save"]');
    if (save) save.disabled = !current.dirty || current.state === "conflict" || current.state === "invalid";
    const discard = host.querySelector<HTMLButtonElement>('button[data-source-action="discard"]');
    if (discard) discard.disabled = !current.dirty;
    const warning = host.querySelector<HTMLElement>(".source-draft-warning");
    if (warning) warning.hidden = !current.dirty;
    const view = host.querySelector<HTMLButtonElement>('button[data-source-action="view-scene"]');
    if (view) view.hidden = !current.selectedSceneId || !current.selectedBeatId;
  };

  const saveCurrent = async (): Promise<void> => {
    await enqueueUpdate();
    await updateQueue;
    if (!current?.dirty) { actions.status("Saved"); return; }
    actions.status("Validating Source…");
    try {
      current = await actions.save({ path: current.path, expectedBaseRevision: current.baseRevision, expectedDraftVersion: current.draftVersion });
      const latest = await refreshInventory();
      actions.status(latest.dirtyCount ? "Pending validation" : "Saved");
      drawDocument();
    } catch (error) {
      actions.status(error instanceof Error ? error.message : "Source could not be saved", "error");
      editor?.focus();
    }
  };

  const openFile = async (target: SourceTarget): Promise<void> => {
    await enqueueUpdate();
    await updateQueue;
    const generation = ++openGeneration;
    actions.status("Opening Source…");
    try {
      const next = await actions.open(target);
      if (disposed || generation !== openGeneration) return;
      current = next;
      drawTree();
      drawDocument();
      actions.status(next.state === "conflict" ? "Conflict — both Source versions retained" : next.dirty ? "Pending validation" : "Saved", next.state === "conflict" || next.state === "invalid" ? "error" : "normal");
    } catch (error) {
      if (!disposed && generation === openGeneration) actions.status(error instanceof Error ? error.message : "Source could not be opened", "error");
    }
  };

  const observeCurrent = (): void => {
    if (!current || disposed) return;
    if (observationTimer !== undefined) window.clearTimeout(observationTimer);
    observationTimer = window.setTimeout(() => {
      observationTimer = undefined;
      const observed = current;
      const control = editor;
      if (!observed || !control || disposed) return;
      void updateQueue.then(async () => {
        try {
          const next = await actions.open({ path: observed.path, selectionStart: control.selectionStart, selectionEnd: control.selectionEnd });
          if (disposed || current?.path !== next.path) return;
          const changed = next.state !== current.state || next.liveRevision !== current.liveRevision || next.baseRevision !== current.baseRevision || next.draftVersion !== current.draftVersion;
          current = next;
          if (changed) { await refreshInventory(); drawDocument(); actions.status(next.state === "conflict" ? "Conflict — both Source versions retained" : next.dirty ? "Pending validation" : "Source refreshed", next.state === "conflict" || next.state === "invalid" ? "error" : "normal"); }
        } catch { /* explicit Refresh and Save report actionable failures */ }
      });
    }, 250);
  };

  const drawDocument = (): void => {
    host.replaceChildren();
    editor = undefined;
    if (!current) {
      const empty = document.createElement("p"); empty.className = "muted"; empty.textContent = "Choose a project-owned .rpy file."; host.append(empty); return;
    }
    const header = document.createElement("header"); header.className = "source-header";
    const title = document.createElement("div"); const eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = "Source";
    const heading = document.createElement("h1"); heading.textContent = current.path; const details = document.createElement("code"); details.textContent = `${current.newline}${current.hasBom ? " · UTF-8 BOM" : " · UTF-8"}`; title.append(eyebrow, heading, details);
    const state = document.createElement("span"); state.className = "source-document-state"; state.dataset.state = current.state; state.textContent = stateLabel(current.state); header.append(title, state); host.append(header);

    const toolbar = document.createElement("div"); toolbar.className = "source-toolbar";
    const save = button("Save Source", "button primary"); save.dataset.sourceAction = "save"; save.disabled = !current.dirty || current.state === "conflict" || current.state === "invalid"; save.addEventListener("click", () => void saveCurrent());
    const discard = button("Discard Draft"); discard.dataset.sourceAction = "discard"; discard.disabled = !current.dirty; discard.addEventListener("click", async () => { if (!current) return; try { current = await actions.discard(current.path); const latest = await refreshInventory(); drawDocument(); actions.status(latest.dirtyCount ? "Pending validation" : "Draft discarded"); } catch (error) { actions.status(error instanceof Error ? error.message : "Draft could not be discarded", "error"); } });
    const refresh = button("Refresh"); refresh.addEventListener("click", () => { if (current) void openFile({ path: current.path, selectionStart: editor?.selectionStart, selectionEnd: editor?.selectionEnd }); });
    toolbar.append(save, discard, refresh); host.append(toolbar);
    const draftWarning = document.createElement("p");
    draftWarning.className = "source-draft-warning";
    draftWarning.hidden = !current.dirty;
    draftWarning.textContent = "This unaccepted draft is held only for this session and cannot be recovered after a crash or restart.";
    host.append(draftWarning);

    if (current.diagnostics.length) {
      const diagnostics = document.createElement("section"); diagnostics.className = "source-diagnostics"; diagnostics.role = "alert";
      for (const item of current.diagnostics) { const line = document.createElement("p"); const code = document.createElement("code"); code.textContent = item.code; line.append(code, ` ${item.message}`); diagnostics.append(line); }
      host.append(diagnostics);
    }

    if (current.state === "conflict") {
      const conflict = document.createElement("section"); conflict.className = "source-conflict"; const heading = document.createElement("h2"); heading.textContent = "External Source conflict";
      const copy = document.createElement("p"); copy.textContent = "Your draft and the external bytes are both retained. Loomlight will not overwrite either version automatically."; conflict.append(heading, copy);
      const selectDraft = button("Select Draft to Copy"); selectDraft.addEventListener("click", () => { editor?.focus(); editor?.select(); actions.status("Draft selected — use the system Copy command"); }); conflict.append(selectDraft);
      if (current.canApplyBoth && current.combinedPreview !== undefined) {
        const preview = document.createElement("details"); const summary = document.createElement("summary"); summary.textContent = "Review combined non-overlapping result"; const code = document.createElement("pre"); code.textContent = current.combinedPreview; preview.append(summary, code); conflict.append(preview);
        const apply = button("Apply Both", "button primary"); apply.addEventListener("click", async () => { if (!current) return; try { current = await actions.applyBoth({ path: current.path, expectedBaseRevision: current.baseRevision, expectedDraftVersion: current.draftVersion }); const latest = await refreshInventory(); drawDocument(); actions.status(latest.dirtyCount ? "Pending validation" : "Combined Source saved"); } catch (error) { actions.status(error instanceof Error ? error.message : "The sources could not be combined", "error"); } }); conflict.append(apply);
      }
      const reload = button("Reload External / Discard Draft", "button danger"); reload.addEventListener("click", async () => { if (!current) return; try { current = await actions.discard(current.path); const latest = await refreshInventory(); drawDocument(); actions.status(latest.dirtyCount ? "Pending validation" : "External Source loaded"); } catch (error) { actions.status(error instanceof Error ? error.message : "External Source could not be loaded", "error"); } });
      const cancel = button("Cancel", "text-button"); cancel.addEventListener("click", () => editor?.focus()); conflict.append(reload, cancel); host.append(conflict);
    }

    const editorShell = document.createElement("div"); editorShell.className = "source-editor-shell";
    const gutter = document.createElement("pre"); gutter.className = "source-line-numbers"; gutter.ariaHidden = "true"; gutter.textContent = lineNumbers(current.text ?? "");
    const text = document.createElement("textarea"); text.className = "source-editor"; text.spellcheck = false; text.wrap = "off"; text.value = current.text ?? ""; text.readOnly = !current.editable; text.ariaLabel = `Source editor for ${current.path}`;
    text.selectionStart = Math.min(current.selectionStart, text.value.length); text.selectionEnd = Math.min(current.selectionEnd, text.value.length);
    text.addEventListener("scroll", () => { gutter.scrollTop = text.scrollTop; });
    text.addEventListener("input", () => { gutter.textContent = lineNumbers(text.value); void enqueueUpdate(); });
    for (const event of ["select", "keyup", "mouseup"]) text.addEventListener(event, () => { void enqueueUpdate(); });
    text.addEventListener("keydown", (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); event.stopPropagation(); void saveCurrent(); } });
    editor = text; editorShell.append(gutter, text); host.append(editorShell);

    const mapping = document.createElement("section"); mapping.className = "source-mapping"; const mappingHeading = document.createElement("h2"); mappingHeading.textContent = "Mapped ranges"; mapping.append(mappingHeading);
    if (!current.ranges.length) { const empty = document.createElement("p"); empty.className = "muted"; empty.textContent = current.partial ? "Source-only or currently unmapped content." : "No mapped ranges."; mapping.append(empty); }
    for (const range of current.ranges) {
      const select = button(range.protected ? `Custom Code · ${range.kind}` : range.kind, range.protected ? "source-range opaque" : "source-range supported");
      select.addEventListener("click", () => { text.focus(); text.setSelectionRange(range.editorStart, range.editorEnd); void enqueueUpdate(); }); mapping.append(select);
    }
    const view = button("View selected Beat in Scene", "text-button"); view.dataset.sourceAction = "view-scene"; view.hidden = !current.selectedSceneId || !current.selectedBeatId; view.addEventListener("click", () => { if (current?.selectedSceneId && current.selectedBeatId) actions.viewScene(current.selectedSceneId, current.selectedBeatId); }); mapping.append(view);
    host.append(mapping); text.focus();
  };

  drawTree();
  const target = initialTarget ?? inventory.files[0];
  if (target) void openFile({
    path: target.path,
    selectionStart: "selectionStart" in target ? target.selectionStart : undefined,
    selectionEnd: "selectionEnd" in target ? target.selectionEnd : undefined,
    byteStart: "byteStart" in target ? target.byteStart : undefined,
    byteEnd: "byteEnd" in target ? target.byteEnd : undefined,
  });
  if ("__TAURI_INTERNALS__" in window) {
    observationInterval = window.setInterval(observeCurrent, 2000);
    window.addEventListener("focus", observeCurrent);
  }
  return () => {
    disposed = true; openGeneration += 1;
    if (observationTimer !== undefined) window.clearTimeout(observationTimer);
    if (observationInterval !== undefined) window.clearInterval(observationInterval);
    window.removeEventListener("focus", observeCurrent);
  };
}
