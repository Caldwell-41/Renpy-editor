import type { CoreOperation } from "./protocol.js";
import type { SourceTarget, SourceWorkspaceController } from "./source-ui.js";
import { awaitRuntimeRequest, prepareRuntimeInput, type RuntimeKind, type RuntimePreparation, type RuntimeRevisionChoice, type RuntimeTicket } from "./runtime-preparation.js";

export interface RuntimeStatus {
  operationId: string; phase: string; exitCode: number | null; output: string;
  nextSequence: number; outputTruncated: boolean; earlierRevision: boolean;
  cleanupComplete: boolean; launchRevision: string | null; revisionStale: boolean | null;
}
export interface RuntimeDiagnostic {
  id: number; origin: "compile" | "lint" | "runtime"; severity: string; message: string;
  path: string | null; line: number | null; column: number | null; sourceRevision: string | null;
  operationId: string; sessionId: string; freshness: string;
}
interface Inspection extends RuntimePreparation {
  projectPath: string; sdkPath: string; sdkVersion: string; sdkRevision: string;
  inputs: string[]; trustNotice: string;
}
export interface RuntimeActions {
  sessionId: string; sdkVersion: string;
  request: <T>(operation: CoreOperation, payload?: Readonly<Record<string, unknown>>) => Promise<T>;
  current: () => boolean;
  capture: () => { controller?: SourceWorkspaceController; sceneRoot: ParentNode; current: () => boolean };
  coordinate: <T>(task: () => Promise<T>) => Promise<T>;
  navigate: (target: SourceTarget) => Promise<void>;
  refreshPersistence: () => void;
}
function button(label: string): HTMLButtonElement {
  const item = document.createElement("button"); item.type = "button"; item.className = "button secondary"; item.textContent = label; return item;
}
/** Session-owned controls survive navigation without losing the process receipt. */
export class RuntimeWorkspace {
  readonly toolbar = document.createElement("div");
  readonly panel = document.createElement("section");
  private readonly status = document.createElement("p");
  private readonly revision = document.createElement("p");
  private readonly notice = document.createElement("p");
  private readonly previous = document.createElement("details");
  private readonly output = document.createElement("pre");
  private readonly diagnostics = document.createElement("div");
  private readonly run = button("Run Game");
  private readonly validate = button("Validate");
  private readonly stop = button("Stop");
  private readonly revoke = button("Revoke trust");
  private readonly policy = button("Enable controlled play");
  private readonly inspect = button("Inspect trust");
  private readonly browse = button("Choose SDK…");
  private selectedSdk?: { id: string; version: string; displayName: string; compatible: boolean };
  private diagnosticsKey = "";
  private runtimeErrorReported = false;
  private operation?: RuntimeStatus;
  private kind?: RuntimeKind;
  private preparation?: RuntimePreparation;
  private trust?: Inspection;
  private abort?: AbortController;
  private pending?: Promise<void>;
  private timer?: ReturnType<typeof setTimeout>;
  private disposed = false;
  private outputText = "";
  private dialogCancel?: () => void;
  private dialogCompletion?: Promise<void>;
  private receipt?: string;
  constructor(private readonly actions: RuntimeActions) {
    this.toolbar.className = "runtime-toolbar"; this.toolbar.role = "toolbar"; this.toolbar.ariaLabel = "Runtime controls";
    this.panel.className = "runtime-panel"; this.panel.ariaLabel = "Diagnostics and Runtime";
    const title = document.createElement("h2"); title.textContent = "Diagnostics / Runtime";
    this.status.role = "status"; this.status.ariaLive = "polite";
    this.revision.className = "runtime-revision muted";
    this.output.className = "runtime-output"; this.output.tabIndex = 0; this.output.ariaLabel = "Bounded runtime output";
    const details = document.createElement("details"); const summary = document.createElement("summary"); summary.textContent = "Process output"; details.append(summary, this.output);
    this.diagnostics.className = "runtime-diagnostics"; this.diagnostics.ariaLabel = "SDK diagnostics";
    const note = document.createElement("p"); note.className = "muted"; note.textContent = "Static Source and Branches findings are separate from SDK validation. Only explicit Validate runs compile and lint.";
    this.notice.role = "alert"; this.previous.hidden = true; this.panel.tabIndex = 0;
    this.panel.append(title, this.status, this.notice, this.revision, note, this.previous, this.diagnostics, details);
    this.toolbar.append(this.validate, this.run, this.stop, this.inspect, this.revoke, this.policy, this.browse);
    this.validate.addEventListener("click", () => this.begin("validate"));
    this.run.addEventListener("click", () => this.begin("run"));
    this.stop.addEventListener("click", () => { void this.stopOperation().catch(error => this.fail(error)); });
    this.revoke.addEventListener("click", () => { void this.revokeTrust().catch(error => this.fail(error)); });
    this.inspect.addEventListener("click", () => { if (this.trust) void this.choose("Session execution consent", this.trustText(this.trust), [{ label: "Close", value: "close" }], "close"); });
    this.policy.addEventListener("click", () => { void this.installPolicy(); });
    this.browse.addEventListener("click", () => { void (async () => {
      if (this.active() || document.querySelector('[aria-modal="true"]')) return;
      try {
        const selected = await this.actions.request<{ id: string; version: string; displayName: string; compatible: boolean; cancelled?: boolean }>("sdk.browse");
        if (!this.current() || selected.cancelled) return;
        if (!selected.compatible || selected.version !== this.actions.sdkVersion) throw new Error(`Choose pinned Ren'Py ${this.actions.sdkVersion}.`);
        this.selectedSdk = selected; this.status.textContent = `Selected ${selected.displayName}. Execution still requires Validate or Run Game.`;
      } catch (error) { this.fail(error); }
    })(); });
    this.status.textContent = "Idle — no SDK execution in this session."; this.controls();
  }
  private current(): boolean { return !this.disposed && this.actions.current(); }
  private active(): boolean { return !!this.pending || !!this.operation && !this.operation.cleanupComplete; }
  private controls(): void {
    this.run.disabled = this.validate.disabled = this.policy.disabled = this.browse.disabled = this.active();
    this.stop.disabled = !this.active(); this.revoke.disabled = this.inspect.disabled = !this.trust;
  }
  private fail(error: unknown): void { if (this.current()) this.notice.textContent = `Runtime action failed: ${error instanceof Error ? error.message : String(error)}`; }
  private begin(kind: RuntimeKind): void {
    if (this.active() || document.querySelector('[aria-modal="true"]')) return;
    this.notice.textContent = "";
    this.abort = new AbortController();
    this.pending = this.execute(kind).catch(error => this.fail(error)).finally(() => { this.pending = undefined; this.controls(); });
    this.controls();
  }
  private async execute(kind: RuntimeKind): Promise<void> {
    const capture = this.actions.capture(); const signal = this.abort!.signal;
    const current = () => this.current() && capture.current() && !signal.aborted;
    this.status.textContent = "Preparing — checking revision and execution consent.";
    let started = false;
    try {
      const sdks = await this.actions.request<{ id: string; version: string; displayName: string; compatible: boolean }[]>("sdk.discover");
      if (!current()) return;
      if (this.selectedSdk && !sdks.some(sdk => sdk.id === this.selectedSdk?.id)) sdks.push(this.selectedSdk);
      const supported = sdks.filter(sdk => sdk.compatible && sdk.version === this.actions.sdkVersion);
      if (!supported.length) throw new Error(`Pinned Ren'Py ${this.actions.sdkVersion} is unavailable. Configure that SDK before retrying.`);
      const sdkId = supported.length === 1 ? supported[0]!.id : await this.choose("Choose pinned SDK", "Select the verified SDK for this execution.", [...supported.map(sdk => ({ label: sdk.displayName, value: sdk.id })), { label: "Cancel", value: "cancel" }], "cancel");
      if (!current() || sdkId === "cancel") return;
      const preparation = await prepareRuntimeInput(kind, sdkId, { ...capture, current, signal,
        coordinate: this.actions.coordinate, request: async <T>(operation: CoreOperation, payload?: Readonly<Record<string, unknown>>): Promise<T> => {
          const result = await this.actions.request<T>(operation, payload);
          if (operation === "runtime.prepare" && result && typeof result === "object" && "requestToken" in result) this.receipt = String(result.requestToken);
          return result;
        },
        choose: async input => this.choose<RuntimeRevisionChoice>("Choose execution revision",
          `${input.sourceDrafts} Source draft(s); ${input.pendingScene ? "pending Scene form" : "no pending Scene form"}. Use saved revision excludes drafts and retains input. Cancel writes nothing.`,
          [...(input.pendingScene ? [{ label: "Return to Scene Commit", value: "commitScene" as const }] : [{ label: "Save All and continue", value: "saveAll" as const }]),
            { label: "Use saved revision", value: "saved" }, { label: "Cancel", value: "cancel" }], "cancel"),
      });
      this.preparation = preparation;
      if (!preparation || !current()) return;
      const inspection = preparation as Inspection; let trustId = preparation.trustId;
      if (!trustId) {
        this.trust = undefined; this.controls();
        const choice = await this.choose("Allow project execution?", this.trustText(inspection), [{ label: "Trust for this session and continue", value: "trust" }, { label: "Cancel", value: "cancel" }], "cancel");
        if (choice !== "trust" || !current()) return;
        const trust = await this.work<{ trustId: string }>("runtime.grantTrust", { preparationId: preparation.preparationId }, current, signal);
        if (!trust || !current()) return; trustId = trust.trustId;
      }
      this.trust = { ...inspection, trustId }; if (!current()) return;
      const result = await this.work<RuntimeStatus>("runtime.start", { preparationId: preparation.preparationId, trustId }, current, signal);
      if (!result || !current()) return;
      started = true; this.preparation = undefined; this.receipt = undefined;
      if (this.kind === "validate" && this.operation) {
        const summary = document.createElement("summary"); summary.textContent = `Previous validation · ${this.operation.launchRevision ?? "unknown revision"} · locations stale`;
        const text = document.createElement("pre"); text.textContent = (this.diagnostics.textContent ?? "").slice(0,1024*1024);
        this.previous.hidden = false; this.previous.replaceChildren(summary,text);
      }
      this.kind = kind; this.outputText = ""; this.diagnosticsKey = ""; this.runtimeErrorReported = false;
      this.diagnostics.textContent = "Awaiting SDK results; prior diagnostics do not validate this revision.";
      this.acceptStatus(result); this.schedule(25);
    } finally {
      if (!started && this.preparation) {
        await this.actions.request(this.receipt ? "runtime.cancelRequest" : "runtime.cancelPreparation", this.receipt ? { requestToken: this.receipt } : { preparationId: this.preparation.preparationId });
        this.preparation = undefined; this.receipt = undefined;
      }
      if (!started && current()) this.status.textContent = "Preparation ended without execution.";
      this.actions.refreshPersistence();
    }
  }
  private async work<T>(operation: CoreOperation, payload: Readonly<Record<string, unknown>>, current: () => boolean, signal: AbortSignal): Promise<T | undefined> {
    const result = await this.actions.request<T | RuntimeTicket>(operation, payload);
    if (result && typeof result === "object" && "requestToken" in result) {
      this.receipt = (result as RuntimeTicket).requestToken;
      const resolved = await awaitRuntimeRequest<T>(result as RuntimeTicket, { request: this.actions.request, current, signal });
      if (!current()) { await this.actions.request("runtime.cancelRequest", { requestToken: (result as RuntimeTicket).requestToken }); return undefined; }
      return resolved;
    }
    return result as T;
  }
  private trustText(p: Inspection): string {
    return `${p.trustNotice}\nProject: ${p.projectPath}\nSDK: ${p.sdkPath} (${p.sdkVersion})\nSDK revision: ${p.sdkRevision}\nSaved revision: ${p.savedRevision}\nInventory (${p.inputs?.length ?? 0} inputs):\n${(p.inputs ?? []).slice(0,128).join("\n")}${p.inputs?.length > 128 ? "\nDisplay limited to 128 paths." : ""}`;
  }
  private async installPolicy(): Promise<void> {
    if (this.active() || document.querySelector('[aria-modal="true"]')) return;
    const choice = await this.choose("Enable controlled play", "Add game/loomlight_runtime.rpy through the normal transaction layer. It disables developer tools and automatic reload for editor Run only, and never overwrites a user script. This is a separate explicit saved edit; it does not run the project.", [{ label: "Add controlled play helper", value: "install" }, { label: "Cancel", value: "cancel" }], "cancel");
    if (choice !== "install" || !this.current()) return;
    try { await this.actions.coordinate(() => this.actions.request("runtime.installPolicy")); this.status.textContent = "Controlled play helper saved. Choose Run Game when ready."; this.actions.refreshPersistence(); }
    catch (error) { this.fail(error); }
  }
  private acceptStatus(status: RuntimeStatus): void {
    this.operation = status; this.outputText = (this.outputText + status.output).slice(0, 2 * 1024 * 1024);
    this.output.textContent = this.outputText + (status.outputTruncated ? "\n[Output truncated at the core retention limit]" : "");
    const labels: Record<string, string> = { starting: "Starting", running: "Running", validating: "Validating (compile then lint)", stopping: "Stopping", exited: this.kind === "validate" ? "Validation finished" : "Game finished", failed: "Failed", cancelled: "Cancelled / stopped", timedOut: "Timed out", cleanupFailed: "Cleanup failed — ownership retained; close is blocked" };
    this.status.textContent = `${labels[status.phase] ?? status.phase}${status.exitCode === null ? "" : ` · exit ${status.exitCode}`}`;
    if (this.runtimeErrorReported && !status.cleanupComplete) this.status.textContent = `Runtime failed — process ${status.phase}; Stop remains available.`;
    this.revision.textContent = `${this.kind === "validate" ? "Tested" : "Launch"} revision: ${status.launchRevision ?? "unavailable"}. ${status.earlierRevision ? "Started from an earlier revision. Stop then Run uses saved edits." : ""} ${status.revisionStale ? "Filesystem freshness unverified; locations rechecked when opened." : "Launch-time evidence; files may change externally."}`;
    this.controls();
  }
  private schedule(delay: number): void { if (this.timer) clearTimeout(this.timer); if (this.current()) this.timer = setTimeout(() => { void this.poll(); }, delay); }
  private async poll(): Promise<void> {
    const operation = this.operation; if (!operation || !this.current()) return;
    try {
      const status = await this.actions.request<RuntimeStatus>("runtime.status", { operationId: operation.operationId, afterSequence: operation.nextSequence });
      if (!this.current() || this.operation?.operationId !== status.operationId) return;
      this.acceptStatus(status);
      if (status.nextSequence !== operation.nextSequence) await this.loadDiagnostics();
      if (status.cleanupComplete && status.nextSequence === operation.nextSequence) { await this.loadDiagnostics(); this.actions.refreshPersistence(); return; }
      this.schedule(status.cleanupComplete ? 10 : 250);
    } catch (error) { this.fail(error); this.schedule(500); }
  }
  private async loadDiagnostics(): Promise<void> {
    if (!this.operation) return; const id = this.operation.operationId;
    const result = await this.actions.request<{ diagnostics: RuntimeDiagnostic[] }>("runtime.diagnostics", { operationId: id });
    if (!this.current() || id !== this.operation?.operationId) return;
    if (result.diagnostics.some(d => d.origin === "runtime" && d.severity === "error")) {
      this.runtimeErrorReported = true;
      if (!this.operation.cleanupComplete) this.status.textContent = `Runtime failed — process ${this.operation.phase}; Stop remains available.`;
    }
    const key = JSON.stringify(result); if (key === this.diagnosticsKey) return; this.diagnosticsKey = key;
    this.diagnostics.replaceChildren();
    if (!result.diagnostics.length) this.diagnostics.textContent = "No structured SDK diagnostics. The process result remains authoritative; inspect raw output for unrecognised failures.";
    for (const diagnostic of result.diagnostics.slice(0,256)) {
      if (diagnostic.operationId !== id || diagnostic.sessionId !== this.actions.sessionId) continue;
      const row = document.createElement("article"); const text = document.createElement("pre"); text.textContent = `${diagnostic.origin} · ${diagnostic.severity}\n${diagnostic.message}`; row.append(text);
      if (diagnostic.path && diagnostic.sourceRevision) {
        const open = button(`Open ${diagnostic.path}:${diagnostic.line ?? "?"}`);
        const freshness = document.createElement("span"); freshness.textContent = "Location unverified until opened";
        open.addEventListener("click", async () => {
          try {
            if (this.operation?.operationId !== id) throw new Error("Diagnostic belongs to an earlier operation.");
            const capture = this.actions.capture();
            const target = await this.actions.coordinate(async () => {
              const lease = await capture.controller?.prepareTransition("navigation");
              if (capture.controller && !lease) throw new Error("Retain Source input before navigation.");
              try { return await this.actions.request<SourceTarget>("runtime.resolveDiagnostic", { operationId: id, diagnosticId: diagnostic.id }); }
              finally { lease?.release(); }
            });
            if (this.current() && capture.current()) await this.actions.navigate(target);
          } catch (error) { freshness.textContent = "Stale or unavailable location — no source selection changed"; this.fail(error); }
        }); row.append(open, freshness);
      } else { const note = document.createElement("span"); note.textContent = "No proven project source location"; row.append(note); }
      this.diagnostics.append(row);
    }
    if (result.diagnostics.length >= 256) this.diagnostics.append("Diagnostic display limited to 256 records; inspect bounded output.");
  }
  async stopOperation(): Promise<void> {
    this.abort?.abort(); this.dialogCancel?.();
    if (this.pending) { await this.pending; this.status.textContent = "Preparation cancelled."; }
    if (this.operation && !this.operation.cleanupComplete) {
      const status = await this.actions.request<RuntimeStatus>("runtime.stop", { operationId: this.operation.operationId });
      if (this.current()) { this.acceptStatus({ ...status, output: "", nextSequence: this.operation.nextSequence }); this.schedule(25); }
    }
  }
  private async revokeTrust(): Promise<void> {
    const id = this.trust?.trustId; if (!id) return;
    await this.actions.request("runtime.revokeTrust", { trustId: id }); this.trust = undefined;
    await this.stopOperation(); this.controls();
  }
  async beforeClose(): Promise<boolean> {
    if (!this.active()) return true;
    const choice = await this.choose("Stop before closing?", "Stop the owned runtime and finish cleanup before the existing draft leave flow.", [{ label: "Stop and continue", value: "stop" }, { label: "Cancel", value: "cancel" }], "cancel");
    if (choice !== "stop") return false; await this.stopOperation();
    const deadline = Date.now() + 10_000;
    while (this.operation && !this.operation.cleanupComplete && Date.now() < deadline && this.current()) {
      await new Promise(resolve => setTimeout(resolve,100));
    }
    if (this.active()) { this.status.textContent = "Cleanup not confirmed; project remains open."; return false; }
    return this.current();
  }
  dispose(): void { this.disposed = true; this.abort?.abort(); this.dialogCancel?.(); if (this.timer) clearTimeout(this.timer); }
  private choose<T extends string>(title: string, copy: string, choices: readonly { label: string; value: T }[], cancel: T): Promise<T> {
    if (this.dialogCompletion) return this.dialogCompletion.then(() => this.choose(title,copy,choices,cancel));
    if (!this.current() || (this.pending && this.abort?.signal.aborted)) return Promise.resolve(cancel);
    const restore = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    let release!: () => void;
    this.dialogCompletion = new Promise<void>(resolve => { release = resolve; });
    return new Promise(resolve => {
      const backdrop = document.createElement("div"); backdrop.className = "leave-source-dialog runtime-dialog"; backdrop.role = "dialog"; backdrop.setAttribute("aria-modal", "true"); backdrop.ariaLabel = title;
      const panel = document.createElement("section"); const heading = document.createElement("h2"); heading.textContent = title;
      const description = document.createElement("pre"); description.textContent = copy;
      const actions = document.createElement("div"); actions.className = "row-actions";
      const done = (value: T): void => { backdrop.remove(); this.dialogCancel = undefined; this.dialogCompletion = undefined; release(); if (restore?.isConnected) restore.focus(); resolve(value); };
      const buttons = choices.map(choice => { const item = button(choice.label); item.addEventListener("click", () => done(choice.value)); actions.append(item); return item; });
      panel.append(heading, description, actions); backdrop.append(panel); document.body.append(backdrop); buttons.at(-1)?.focus();
      this.dialogCancel = () => done(cancel);
      backdrop.addEventListener("keydown", event => {
        if (event.key === "Escape") { event.preventDefault(); done(cancel); }
        if (event.key === "Tab") { event.preventDefault(); const index = buttons.indexOf(document.activeElement as HTMLButtonElement); buttons[(index + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length]?.focus(); }
      });
    });
  }
}
