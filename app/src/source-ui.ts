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

export interface SourceSaveIntent {
  readonly controllerId: number;
  readonly documentGeneration: number;
  readonly inputSequence: number;
  readonly path: string;
  readonly origin: "keyboard" | "toolbar";
}

export type SourceSaveCapture =
  | { readonly kind: "notApplicable" }
  | { readonly kind: "blocked"; readonly message: string }
  | { readonly kind: "captured"; readonly intent: SourceSaveIntent };

export type SourceSaveOutcome =
  | { readonly kind: "accepted" | "flushed" }
  | { readonly kind: "blocked" | "busy" | "stale"; readonly message: string };

export interface SourceTransitionHandle {
  readonly release: () => void;
}

export interface SourceWorkspaceController {
  readonly captureSaveIntent: (origin: "keyboard" | "toolbar", requireEditingContext: boolean) => SourceSaveCapture;
  readonly executeSave: (intent: SourceSaveIntent, flushClean: () => Promise<void>) => Promise<SourceSaveOutcome>;
  readonly prepareTransition: (reason: "navigation" | "leave") => Promise<SourceTransitionHandle | undefined>;
  readonly hasUnretainedInput: () => boolean;
  readonly setModalBlocked: (blocked: boolean) => void;
  readonly dispose: () => void;
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
  readonly requestSave: (controller: SourceWorkspaceController, intent: SourceSaveIntent) => Promise<void>;
  readonly registerController: (controller: SourceWorkspaceController) => () => void;
  readonly runCoordinated: <T>(label: string, task: () => Promise<T>) => Promise<T>;
  readonly refreshPersistence: () => void;
}

interface InputSnapshot {
  readonly controllerId: number;
  readonly documentGeneration: number;
  readonly sequence: number;
  readonly path: string;
  readonly expectedBaseRevision: string;
  readonly text: string;
  readonly selectionStart: number;
  readonly selectionEnd: number;
}

type RetentionResult =
  | { readonly ok: true; readonly document: SourceDocument; readonly snapshot: InputSnapshot }
  | { readonly ok: false; readonly error: Error; readonly snapshot: InputSnapshot };

let nextControllerId = 0;

function button(label: string, className = "button secondary"): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = label;
  return element;
}

function stateLabel(state: SourceFileState): string {
  return ({ clean: "Clean", dirty: "Pending validation", conflict: "Conflict", invalid: "Invalid Source · Scene stale", readOnly: "Read-only", unavailable: "Unavailable" })[state];
}

function lineNumbers(text: string): string {
  const count = Math.max(1, text.split("\n").length);
  return Array.from({ length: count }, (_, index) => String(index + 1)).join("\n");
}

function focusableWithin(host: HTMLElement): HTMLElement[] {
  return [...host.querySelectorAll<HTMLElement>("button:not(:disabled), textarea:not([readonly]), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex='-1'])")]
    .filter((item) => !item.hidden);
}

function containModalFocus(modal: HTMLElement, cancel: () => void): () => void {
  const handler = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusableWithin(modal);
    if (!items.length) return;
    const first = items[0]!;
    const last = items.at(-1)!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  modal.addEventListener("keydown", handler);
  return () => modal.removeEventListener("keydown", handler);
}

export function renderSourceWorkspace(
  host: HTMLElement,
  treeHost: HTMLElement,
  initialInventory: SourceInventory,
  actions: SourceActions,
  initialTarget?: SourceTarget,
): SourceWorkspaceController {
  const controllerId = ++nextControllerId;
  let inventory = initialInventory;
  let current: SourceDocument | undefined;
  let editor: HTMLTextAreaElement | undefined;
  let disposed = false;
  let documentGeneration = 0;
  let inputSequence = 0;
  let acknowledgedSequence = 0;
  let latestSnapshot: InputSnapshot | undefined;
  let latestRetentionFailure: RetentionResult & { readonly ok: false } | undefined;
  let retentionTail: Promise<void> = Promise.resolve();
  const retentions = new Map<number, Promise<RetentionResult>>();
  let observationTimer: number | undefined;
  let observationInterval: number | undefined;
  let modalBlocked = false;
  let nextBarrierId = 0;
  const barriers = new Set<number>();
  const priorDisabled = new Map<HTMLButtonElement, boolean>();
  let unregisterController: (() => void) | undefined;

  const identityMatches = (generation: number, path: string): boolean =>
    !disposed && generation === documentGeneration && current?.path === path;

  const hasLocalInput = (): boolean =>
    latestSnapshot !== undefined
    && latestSnapshot.documentGeneration === documentGeneration
    && latestSnapshot.path === current?.path
    && (
      latestSnapshot.sequence > acknowledgedSequence
      || retentions.has(latestSnapshot.sequence)
      || latestRetentionFailure?.snapshot.sequence === latestSnapshot.sequence
    );

  const applyBarrierState = (): void => {
    const blocked = barriers.size > 0;
    for (const control of [...host.querySelectorAll<HTMLButtonElement>("button"), ...treeHost.querySelectorAll<HTMLButtonElement>("button")]) {
      if (blocked) {
        if (!priorDisabled.has(control)) priorDisabled.set(control, control.disabled);
        control.disabled = true;
      } else if (priorDisabled.has(control)) {
        control.disabled = priorDisabled.get(control) ?? false;
        priorDisabled.delete(control);
      }
    }
    if (editor) {
      editor.readOnly = blocked || !current?.editable;
      editor.ariaBusy = blocked ? "true" : null;
    }
    host.dataset.sourceBusy = String(blocked);
  };

  const beginBarrier = (): SourceTransitionHandle => {
    const id = ++nextBarrierId;
    barriers.add(id);
    applyBarrierState();
    let released = false;
    return {
      release: () => {
        if (released) return;
        released = true;
        barriers.delete(id);
        applyBarrierState();
        updateStateOnly();
      },
    };
  };

  const captureSnapshot = (advance: boolean): InputSnapshot | undefined => {
    if (!current || !editor || !current.editable) return undefined;
    const changed = !latestSnapshot
      || latestSnapshot.documentGeneration !== documentGeneration
      || latestSnapshot.path !== current.path
      || latestSnapshot.text !== editor.value
      || latestSnapshot.selectionStart !== editor.selectionStart
      || latestSnapshot.selectionEnd !== editor.selectionEnd;
    if (advance || changed) inputSequence += 1;
    if (!latestSnapshot || advance || changed) {
      latestSnapshot = {
        controllerId,
        documentGeneration,
        sequence: inputSequence,
        path: current.path,
        expectedBaseRevision: current.baseRevision,
        text: editor.value,
        selectionStart: editor.selectionStart,
        selectionEnd: editor.selectionEnd,
      };
    }
    return latestSnapshot;
  };

  const drawTree = (): void => {
    treeHost.replaceChildren();
    const heading = document.createElement("p");
    heading.className = "eyebrow";
    heading.textContent = "Source files";
    treeHost.append(heading);
    for (const file of inventory.files) {
      const row = document.createElement("div");
      row.className = `source-file-row${current?.path === file.path ? " selected" : ""}`;
      const open = button(file.path.replace(/^game\//, ""), "source-file-open");
      open.title = file.path;
      if (current?.path === file.path) open.ariaCurrent = "page";
      open.addEventListener("click", () => void openFile({ path: file.path }));
      const state = document.createElement("span");
      state.className = `source-state ${file.state}`;
      state.textContent = file.dirty ? "●" : file.state === "conflict" ? "!" : "";
      state.title = stateLabel(file.state);
      row.append(open, state);
      treeHost.append(row);
    }
    const total = document.createElement("p");
    total.className = "source-draft-total";
    total.textContent = inventory.dirtyCount
      ? `${inventory.dirtyCount} draft${inventory.dirtyCount === 1 ? "" : "s"} · ${inventory.draftBytes.toLocaleString()} bytes`
      : "No unaccepted drafts";
    treeHost.append(total);
    applyBarrierState();
  };

  const refreshInventory = async (): Promise<SourceInventory> => {
    const next = await actions.reloadInventory();
    if (!disposed) {
      inventory = next;
      drawTree();
    }
    return next;
  };

  const queueRetention = (snapshot: InputSnapshot): Promise<RetentionResult> => {
    const existing = retentions.get(snapshot.sequence);
    if (existing) return existing;
    const run = retentionTail.then(async (): Promise<RetentionResult> => {
      try {
        const next = await actions.update({
          path: snapshot.path,
          expectedBaseRevision: snapshot.expectedBaseRevision,
          text: snapshot.text,
          selectionStart: snapshot.selectionStart,
          selectionEnd: snapshot.selectionEnd,
        });
        if (identityMatches(snapshot.documentGeneration, snapshot.path) && snapshot.sequence >= acknowledgedSequence) {
          acknowledgedSequence = snapshot.sequence;
          current = next;
          if (latestRetentionFailure && latestRetentionFailure.snapshot.sequence <= snapshot.sequence) latestRetentionFailure = undefined;
          if (latestSnapshot?.sequence === snapshot.sequence) {
            updateStateOnly();
            actions.refreshPersistence();
          }
        }
        return { ok: true, document: next, snapshot };
      } catch (cause) {
        const error = cause instanceof Error ? cause : new Error("Source draft could not be retained");
        const result = { ok: false as const, error, snapshot };
        if (identityMatches(snapshot.documentGeneration, snapshot.path) && latestSnapshot?.sequence === snapshot.sequence) {
          latestRetentionFailure = result;
          actions.status(error.message, "error");
          updateStateOnly();
          actions.refreshPersistence();
        }
        return result;
      }
    });
    retentionTail = run.then(() => undefined);
    retentions.set(snapshot.sequence, run);
    void run.finally(() => retentions.delete(snapshot.sequence));
    return run;
  };

  const settleSnapshot = async (snapshot: InputSnapshot): Promise<RetentionResult> => {
    if (!identityMatches(snapshot.documentGeneration, snapshot.path)) {
      return { ok: false, error: new Error("The captured Source document is no longer open."), snapshot };
    }
    if (latestRetentionFailure?.snapshot.sequence === snapshot.sequence && !retentions.has(snapshot.sequence)) {
      return latestRetentionFailure;
    }
    if (snapshot.sequence <= acknowledgedSequence && !retentions.has(snapshot.sequence) && current) {
      return { ok: true, document: current, snapshot };
    }
    return queueRetention(snapshot);
  };

  const updateStateOnly = (): void => {
    if (!current) return;
    const localPending = hasLocalInput();
    const badge = host.querySelector<HTMLElement>(".source-document-state");
    if (badge) {
      badge.textContent = localPending ? "Pending validation" : stateLabel(current.state);
      badge.dataset.state = localPending ? "dirty" : current.state;
    }
    const save = host.querySelector<HTMLButtonElement>('button[data-source-action="save"]');
    if (save) {
      const candidate = localPending || current.dirty;
      save.disabled = barriers.size > 0 || !candidate || !current.editable;
    }
    const discard = host.querySelector<HTMLButtonElement>('button[data-source-action="discard"]');
    if (discard) discard.disabled = barriers.size > 0 || !(localPending || current.dirty);
    const warning = host.querySelector<HTMLElement>(".source-draft-warning");
    if (warning) warning.hidden = !(localPending || current.dirty);
    const view = host.querySelector<HTMLButtonElement>('button[data-source-action="view-scene"]');
    if (view) view.hidden = !current.selectedSceneId || !current.selectedBeatId;
  };

  const recordEditorEvent = (): void => {
    const snapshot = captureSnapshot(true);
    if (!snapshot) return;
    updateStateOnly();
    actions.refreshPersistence();
    void queueRetention(snapshot);
  };

  const captureForSettlement = (): InputSnapshot | undefined => {
    const failedSequence = latestRetentionFailure?.snapshot.sequence;
    const retryFailedSnapshot = failedSequence !== undefined
      && failedSequence === latestSnapshot?.sequence
      && !retentions.has(failedSequence);
    return captureSnapshot(retryFailedSnapshot);
  };

  const captureSaveIntent = (origin: "keyboard" | "toolbar", requireEditingContext: boolean): SourceSaveCapture => {
    if (disposed || !current || !editor) return { kind: "notApplicable" };
    if (requireEditingContext && document.activeElement !== editor) return { kind: "notApplicable" };
    if (modalBlocked || host.querySelector('[aria-modal="true"]')) return { kind: "blocked", message: "Finish the open dialog before saving." };
    if (barriers.size > 0) return { kind: "blocked", message: "Source persistence is already in progress." };
    const snapshot = captureForSettlement();
    if (!snapshot) return { kind: "blocked", message: "This Source document cannot be edited." };
    return {
      kind: "captured",
      intent: {
        controllerId,
        documentGeneration: snapshot.documentGeneration,
        inputSequence: snapshot.sequence,
        path: snapshot.path,
        origin,
      },
    };
  };

  const snapshotForIntent = (intent: SourceSaveIntent): InputSnapshot | undefined => {
    if (
      intent.controllerId !== controllerId
      || intent.documentGeneration !== documentGeneration
      || intent.path !== current?.path
      || intent.inputSequence !== latestSnapshot?.sequence
    ) return undefined;
    return latestSnapshot;
  };

  const executeSave = async (intent: SourceSaveIntent, flushClean: () => Promise<void>): Promise<SourceSaveOutcome> => {
    const snapshot = snapshotForIntent(intent);
    if (!snapshot) return { kind: "stale", message: "The captured Source document is no longer current." };
    const barrier = beginBarrier();
    actions.status("Retaining latest Source input…");
    try {
      const retained = await settleSnapshot(snapshot);
      if (!retained.ok) {
        if (identityMatches(intent.documentGeneration, intent.path)) {
          actions.status(retained.error.message, "error");
          editor?.focus();
        }
        return { kind: "blocked", message: retained.error.message };
      }
      if (!identityMatches(intent.documentGeneration, intent.path)) {
        return { kind: "stale", message: "The captured Source document changed before Save." };
      }
      const settled = retained.document;
      current = settled;
      if (!settled.dirty) {
        actions.status("Saving…");
        await flushClean();
        return { kind: "flushed" };
      }
      if (!settled.editable || settled.state === "conflict" || settled.state === "invalid" || settled.state === "unavailable" || settled.state === "readOnly") {
        const message = settled.state === "conflict"
          ? "Resolve the Source conflict before saving."
          : settled.state === "invalid"
            ? "Correct the invalid Source before saving."
            : "This Source document is not available for saving.";
        actions.status(message, "error");
        editor?.focus();
        return { kind: "blocked", message };
      }
      actions.status("Validating Source…");
      const saved = await actions.save({
        path: settled.path,
        expectedBaseRevision: settled.baseRevision,
        expectedDraftVersion: settled.draftVersion,
      });
      if (!identityMatches(intent.documentGeneration, intent.path)) {
        return { kind: "stale", message: "Source was accepted, but this editor is no longer current." };
      }
      current = saved;
      acknowledgedSequence = intent.inputSequence;
      latestRetentionFailure = undefined;
      latestSnapshot = {
        ...snapshot,
        expectedBaseRevision: saved.baseRevision,
        text: saved.text ?? snapshot.text,
        selectionStart: saved.selectionStart,
        selectionEnd: saved.selectionEnd,
      };
      try {
        await refreshInventory();
      } catch (cause) {
        if (!identityMatches(intent.documentGeneration, intent.path)) {
          return { kind: "stale", message: "Source was accepted, but this editor is no longer current." };
        }
        drawDocument();
        const detail = cause instanceof Error ? cause.message : "project state could not be read";
        actions.status(`Source accepted, but project state could not be confirmed: ${detail}`, "error");
        actions.refreshPersistence();
        return { kind: "accepted" };
      }
      if (!identityMatches(intent.documentGeneration, intent.path)) {
        return { kind: "stale", message: "Source was accepted, but this editor is no longer current." };
      }
      drawDocument();
      actions.status("Source accepted; checking project state…");
      actions.refreshPersistence();
      return { kind: "accepted" };
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error("Source could not be saved");
      if (identityMatches(intent.documentGeneration, intent.path)) {
        actions.status(error.message, "error");
        editor?.focus();
      }
      return { kind: "blocked", message: error.message };
    } finally {
      barrier.release();
    }
  };

  const prepareTransition = async (_reason: "navigation" | "leave"): Promise<SourceTransitionHandle | undefined> => {
    if (disposed) return undefined;
    const barrier = beginBarrier();
    const snapshot = captureSnapshot(false);
    if (!snapshot) return barrier;
    const retained = await settleSnapshot(snapshot);
    if (!retained.ok) {
      actions.status(retained.error.message, "error");
      barrier.release();
      editor?.focus();
      return undefined;
    }
    if (!identityMatches(snapshot.documentGeneration, snapshot.path)) {
      barrier.release();
      return undefined;
    }
    current = retained.document;
    return barrier;
  };

  const runDiscard = async (path: string, external: boolean): Promise<void> => {
    await actions.runCoordinated("source.discard", async () => {
      const barrier = beginBarrier();
      try {
        await retentionTail;
        const generation = documentGeneration;
        const next = await actions.discard(path);
        if (!identityMatches(generation, path)) return;
        current = next;
        inputSequence += 1;
        acknowledgedSequence = inputSequence;
        latestRetentionFailure = undefined;
        await refreshInventory();
        drawDocument();
        actions.status(external ? "External Source loaded" : "Draft discarded");
        actions.refreshPersistence();
      } finally {
        barrier.release();
      }
    });
  };

  const runApplyBoth = async (): Promise<void> => {
    const capture = captureSaveIntent("toolbar", false);
    if (capture.kind !== "captured") {
      if (capture.kind === "blocked") actions.status(capture.message, "error");
      return;
    }
    await actions.runCoordinated("source.applyBoth", async () => {
      const snapshot = snapshotForIntent(capture.intent);
      if (!snapshot) return;
      const barrier = beginBarrier();
      try {
        const retained = await settleSnapshot(snapshot);
        if (!retained.ok) throw retained.error;
        const settled = retained.document;
        if (!identityMatches(capture.intent.documentGeneration, capture.intent.path)) return;
        const next = await actions.applyBoth({
          path: settled.path,
          expectedBaseRevision: settled.baseRevision,
          expectedDraftVersion: settled.draftVersion,
        });
        if (!identityMatches(capture.intent.documentGeneration, capture.intent.path)) return;
        current = next;
        inputSequence += 1;
        acknowledgedSequence = inputSequence;
        latestRetentionFailure = undefined;
        await refreshInventory();
        drawDocument();
        actions.status("Combined Source accepted; checking project state…");
        actions.refreshPersistence();
      } finally {
        barrier.release();
      }
    });
  };

  const copyDraft = async (): Promise<void> => {
    const snapshot = captureSnapshot(false);
    const text = snapshot?.text ?? current?.text;
    if (!text) return;
    try {
      if (window.navigator.clipboard?.writeText) {
        await window.navigator.clipboard.writeText(text);
      } else {
        editor?.focus();
        editor?.select();
        if (!document.execCommand?.("copy")) throw new Error("Copy is unavailable");
      }
      actions.status("Draft copied");
    } catch {
      editor?.focus();
      actions.status("Draft could not be copied", "error");
    }
  };

  const confirmDiscard = (external: boolean): void => {
    if (!(hasLocalInput() || current?.dirty) || host.querySelector(".source-discard-confirmation")) return;
    const path = current?.path;
    if (!path) return;
    const restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : editor;
    modalBlocked = true;
    const confirmation = document.createElement("section");
    confirmation.className = "source-conflict source-discard-confirmation";
    confirmation.role = "dialog";
    confirmation.setAttribute("aria-modal", "true");
    const heading = document.createElement("h2");
    heading.textContent = external ? "Reload external Source?" : "Discard this draft?";
    const warning = document.createElement("p");
    warning.textContent = external
      ? "This permanently discards the session-only draft and loads the external Source bytes."
      : "This permanently discards the session-only draft and restores the accepted Source bytes.";
    const controls = document.createElement("div");
    controls.className = "row-actions";
    const closeModal = (): void => {
      removeFocusTrap();
      confirmation.remove();
      modalBlocked = false;
      if (restoreFocus?.isConnected) restoreFocus.focus();
    };
    const cancel = button("Cancel", "text-button");
    cancel.addEventListener("click", closeModal);
    const confirm = button(external ? "Reload External" : "Discard Draft", "button danger");
    confirm.addEventListener("click", async () => {
      confirm.disabled = true;
      cancel.disabled = true;
      try {
        await runDiscard(path, external);
        removeFocusTrap();
        confirmation.remove();
        modalBlocked = false;
      } catch (cause) {
        confirm.disabled = false;
        cancel.disabled = false;
        actions.status(cause instanceof Error ? cause.message : external ? "External Source could not be loaded" : "Draft could not be discarded", "error");
        confirm.focus();
      }
    });
    controls.append(cancel, confirm);
    confirmation.append(heading, warning, controls);
    host.append(confirmation);
    const removeFocusTrap = containModalFocus(confirmation, closeModal);
    cancel.focus();
  };

  const openFile = async (target: SourceTarget): Promise<void> => {
    if (modalBlocked || disposed || barriers.size > 0) return;
    try {
      await actions.runCoordinated("source.open", async () => {
        const transition = current ? await prepareTransition("navigation") : beginBarrier();
        if (!transition) return;
        const generation = ++documentGeneration;
        actions.status("Opening Source…");
        try {
          const next = await actions.open(target);
          if (disposed || generation !== documentGeneration) return;
          current = next;
          inputSequence += 1;
          acknowledgedSequence = inputSequence;
          latestRetentionFailure = undefined;
          latestSnapshot = undefined;
          drawTree();
          drawDocument();
          actions.refreshPersistence();
        } finally {
          transition.release();
        }
      });
    } catch (cause) {
      if (!disposed) actions.status(cause instanceof Error ? cause.message : "Source could not be opened", "error");
    }
  };

  const observeCurrent = (): void => {
    if (!current || disposed || barriers.size > 0 || modalBlocked) return;
    if (observationTimer !== undefined) window.clearTimeout(observationTimer);
    observationTimer = window.setTimeout(() => {
      observationTimer = undefined;
      const observed = current;
      const control = editor;
      const generation = documentGeneration;
      const sequence = inputSequence;
      if (!observed || !control || disposed) return;
      void actions.runCoordinated("source.observe", async () => {
        await retentionTail;
        if (!identityMatches(generation, observed.path) || sequence !== inputSequence || barriers.size > 0) return;
        const next = await actions.open({
          path: observed.path,
          selectionStart: control.selectionStart,
          selectionEnd: control.selectionEnd,
        });
        if (!identityMatches(generation, observed.path) || sequence !== inputSequence || barriers.size > 0) return;
        const changed = next.state !== current?.state
          || next.liveRevision !== current?.liveRevision
          || next.baseRevision !== current?.baseRevision
          || next.draftVersion !== current?.draftVersion;
        current = next;
        if (changed) {
          await refreshInventory();
          if (!identityMatches(generation, observed.path) || sequence !== inputSequence) return;
          drawDocument();
          actions.refreshPersistence();
        }
      }).catch(() => { /* explicit Refresh and Save report actionable failures */ });
    }, 250);
  };

  const requestToolbarSave = (): void => {
    const capture = captureSaveIntent("toolbar", false);
    if (capture.kind === "captured") {
      void actions.requestSave(controller, capture.intent);
    } else if (capture.kind === "blocked") {
      actions.status(capture.message, "error");
    }
  };

  const drawDocument = (): void => {
    host.replaceChildren();
    editor = undefined;
    if (!current) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Choose a project-owned .rpy file.";
      host.append(empty);
      return;
    }
    const header = document.createElement("header");
    header.className = "source-header";
    const title = document.createElement("div");
    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "Source";
    const heading = document.createElement("h1");
    heading.textContent = current.path;
    const details = document.createElement("code");
    details.textContent = `${current.newline}${current.hasBom ? " · UTF-8 BOM" : " · UTF-8"}`;
    title.append(eyebrow, heading, details);
    const state = document.createElement("span");
    state.className = "source-document-state";
    state.dataset.state = current.state;
    state.textContent = stateLabel(current.state);
    header.append(title, state);
    host.append(header);

    const toolbar = document.createElement("div");
    toolbar.className = "source-toolbar";
    const save = button("Save Source", "button primary");
    save.dataset.sourceAction = "save";
    save.addEventListener("click", requestToolbarSave);
    const discard = button("Discard Draft");
    discard.dataset.sourceAction = "discard";
    discard.addEventListener("click", () => confirmDiscard(false));
    const refresh = button("Refresh");
    refresh.addEventListener("click", () => {
      if (current) void openFile({ path: current.path, selectionStart: editor?.selectionStart, selectionEnd: editor?.selectionEnd });
    });
    toolbar.append(save, discard, refresh);
    host.append(toolbar);
    const draftWarning = document.createElement("p");
    draftWarning.className = "source-draft-warning";
    draftWarning.textContent = "This unaccepted draft is held only for this session and cannot be recovered after a crash or restart.";
    host.append(draftWarning);

    if (current.diagnostics.length) {
      const diagnostics = document.createElement("section");
      diagnostics.className = "source-diagnostics";
      diagnostics.role = "alert";
      for (const item of current.diagnostics) {
        const line = document.createElement("p");
        const code = document.createElement("code");
        code.textContent = item.code;
        line.append(code, ` ${item.message}`);
        diagnostics.append(line);
      }
      host.append(diagnostics);
    }

    if (current.state === "conflict") {
      const conflict = document.createElement("section");
      conflict.className = "source-conflict";
      const conflictHeading = document.createElement("h2");
      conflictHeading.textContent = "External Source conflict";
      const copy = document.createElement("p");
      copy.textContent = "Your draft and the external bytes are both retained. Loomlight will not overwrite either version automatically.";
      conflict.append(conflictHeading, copy);
      const copyDraftButton = button("Copy Draft");
      copyDraftButton.addEventListener("click", () => void copyDraft());
      conflict.append(copyDraftButton);
      if (current.canApplyBoth && current.combinedPreview !== undefined) {
        const preview = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = "Review combined non-overlapping result";
        const code = document.createElement("pre");
        code.textContent = current.combinedPreview;
        preview.append(summary, code);
        conflict.append(preview);
        const apply = button("Apply Both", "button primary");
        apply.addEventListener("click", () => void runApplyBoth().catch((cause) => {
          actions.status(cause instanceof Error ? cause.message : "The sources could not be combined", "error");
        }));
        conflict.append(apply);
      }
      const reload = button("Reload External / Discard Draft", "button danger");
      reload.addEventListener("click", () => confirmDiscard(true));
      const cancel = button("Cancel", "text-button");
      cancel.addEventListener("click", () => editor?.focus());
      conflict.append(reload, cancel);
      host.append(conflict);
    }

    const editorShell = document.createElement("div");
    editorShell.className = "source-editor-shell";
    const gutter = document.createElement("pre");
    gutter.className = "source-line-numbers";
    gutter.ariaHidden = "true";
    gutter.textContent = lineNumbers(current.text ?? "");
    const text = document.createElement("textarea");
    text.className = "source-editor";
    text.spellcheck = false;
    text.wrap = "off";
    text.value = current.text ?? "";
    text.readOnly = barriers.size > 0 || !current.editable;
    text.ariaLabel = `Source editor for ${current.path}`;
    text.selectionStart = Math.min(current.selectionStart, text.value.length);
    text.selectionEnd = Math.min(current.selectionEnd, text.value.length);
    text.addEventListener("scroll", () => { gutter.scrollTop = text.scrollTop; });
    text.addEventListener("input", () => {
      if (barriers.size > 0) return;
      gutter.textContent = lineNumbers(text.value);
      recordEditorEvent();
    });
    for (const event of ["select", "keyup", "mouseup"]) {
      text.addEventListener(event, () => {
        if (barriers.size === 0) recordEditorEvent();
      });
    }
    editor = text;
    latestSnapshot = {
      controllerId,
      documentGeneration,
      sequence: inputSequence,
      path: current.path,
      expectedBaseRevision: current.baseRevision,
      text: text.value,
      selectionStart: text.selectionStart,
      selectionEnd: text.selectionEnd,
    };
    editorShell.append(gutter, text);
    host.append(editorShell);

    const mapping = document.createElement("section");
    mapping.className = "source-mapping";
    const mappingHeading = document.createElement("h2");
    mappingHeading.textContent = "Mapped ranges";
    mapping.append(mappingHeading);
    if (!current.ranges.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = current.partial ? "Source-only or currently unmapped content." : "No mapped ranges.";
      mapping.append(empty);
    }
    for (const range of current.ranges) {
      const select = button(range.protected ? `Custom Code · ${range.kind}` : range.kind, range.protected ? "source-range opaque" : "source-range supported");
      select.addEventListener("click", () => {
        text.focus();
        text.setSelectionRange(range.editorStart, range.editorEnd);
        recordEditorEvent();
      });
      mapping.append(select);
    }
    const view = button("View selected Beat in Scene", "text-button");
    view.dataset.sourceAction = "view-scene";
    view.hidden = !current.selectedSceneId || !current.selectedBeatId;
    view.addEventListener("click", () => {
      if (current?.selectedSceneId && current.selectedBeatId) actions.viewScene(current.selectedSceneId, current.selectedBeatId);
    });
    mapping.append(view);
    host.append(mapping);
    updateStateOnly();
    applyBarrierState();
    text.focus();
  };

  const controller: SourceWorkspaceController = {
    captureSaveIntent,
    executeSave,
    prepareTransition,
    hasUnretainedInput: hasLocalInput,
    setModalBlocked: (blocked) => { modalBlocked = blocked; },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      documentGeneration += 1;
      unregisterController?.();
      unregisterController = undefined;
      barriers.clear();
      if (observationTimer !== undefined) window.clearTimeout(observationTimer);
      if (observationInterval !== undefined) window.clearInterval(observationInterval);
      window.removeEventListener("focus", observeCurrent);
    },
  };

  unregisterController = actions.registerController(controller);
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
  return controller;
}
