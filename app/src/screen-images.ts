import type { CompositionCommand, CompositionView } from "./screen-composition.ts";
import type { ScreenDocument, ScreenNode } from "./screen-ui.ts";
import type { CoreOperation } from "./protocol.ts";
import type { MediaPresentation } from "./scene-ui.ts";
import type { ImageLayoutReservation, NumericLayout, ScreenLayoutEditor } from "./screen-layout.ts";

export interface UiImageAsset {
  id: string;
  kind: string;
  displayName: string;
  relativePath: string;
  sha256: string;
  status: string;
  naturalWidth?: number;
  naturalHeight?: number;
}
interface Draft {
  key: string;
  document: ScreenDocument;
  screenId: string;
  nodeId?: string;
  parentId: string;
  assetId?: string;
  expectedSha?: string;
  width: string;
  height: string;
  replacement?: MediaPresentation;
  returnId?: string;
}
interface SubmittedImage {
  draft: Draft;
  command: CompositionCommand;
  layout: ImageLayoutReservation;
}
interface Cached {
  media: MediaPresentation;
  url: string;
}
interface Host {
  view: () => CompositionView | undefined;
  current: () => boolean;
  request: <T>(operation: CoreOperation, payload?: Record<string, unknown>) => Promise<T>;
  coordinate: <T>(task: () => Promise<T>) => Promise<T>;
  commit: (command: CompositionCommand, base: ScreenDocument) => Promise<void>;
  redraw: () => void;
  preview: () => void;
  note: (message: string, error?: boolean) => void;
  select: (id: string, design?: boolean) => void;
  source: () => void;
  saved: () => void;
  layoutTools: (host: HTMLElement) => void;
  order: (host: HTMLElement) => void;
}
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text = "") => {
  const n = document.createElement(tag);
  n.className = className;
  n.textContent = text;
  return n;
};
const button = (text: string, run: () => void, primary = false) => {
  const b = el("button", `button ${primary ? "primary" : "secondary"}`, text);
  b.type = "button";
  b.onclick = run;
  return b;
};
const valid = (value: string) => /^[1-9]\d*$/.test(value) && Number(value) <= 16384;
const containers = new Set(["screen", "fixed", "frame", "window", "vbox", "hbox", "grid", "viewport"]);
let sequence = 0;

/** Owns image drafts and passive media; accepted writes remain with ScreensWorkspace/core. */
export class ScreenImages {
  private readonly drafts = new Map<string, Draft>();
  private readonly locks = new Map<string, boolean>();
  private readonly errors = new Map<string, { field: string; text: string }>();
  private readonly cache = new Map<string, Cached>();
  private readonly loadingMedia = new Map<string, Promise<Cached>>();
  private mediaQueue: Promise<void> = Promise.resolve();
  private decoding?: Cached;
  private assets: UiImageAsset[] = [];
  private loaded = false;
  private load?: Promise<void>;
  private generation = 0;
  private disposed = false;
  private submitted?: SubmittedImage;
  private pickerGeneration = 0;
  private importing = false;
  private staged?: Cached;
  private addition?: Draft;
  private card?: HTMLElement;
  private dialog?: HTMLDialogElement;
  private cardKeys = new AbortController();
  private layoutOpen = new Map<string, boolean>();
  constructor(private readonly host: Host, private readonly layout: ScreenLayoutEditor) {}
  private get saving(): boolean {
    return !!this.submitted;
  }
  isSaving(): boolean {
    return this.saving;
  }
  hasDraft(): boolean {
    return !!this.addition || this.drafts.size > 0;
  }
  hasAddition(): boolean {
    return !!this.addition;
  }
  renderRetained(host: HTMLElement, documents: ScreenDocument[]): void {
    for (const [key, draft] of this.drafts) {
      if (
        documents.some(
          (d) =>
            d.path === draft.document.path &&
            d.screens.some((s) => s.nodes.some((n) => n.id === draft.nodeId)),
        )
      )
        continue;
      const section = el("section", "screen-retained-draft");
      section.append(
        el("p", "", "The image is no longer available in Source. Your image draft is retained here."),
      );
      const input = el("textarea");
      input.readOnly = true;
      input.ariaLabel = "Retained image draft";
      input.value = `${this.asset(draft.assetId)?.displayName ?? draft.assetId ?? "No image selected"}\n${draft.width} × ${draft.height} px`;
      section.append(
        input,
        button("Discard retained image draft", () => {
          this.drafts.delete(key);
          this.errors.delete(key);
          section.remove();
          this.host.preview();
        }),
      );
      host.append(section);
    }
  }
  private active(): boolean {
    return !this.disposed && this.host.current();
  }
  private key(view: CompositionView): string {
    return JSON.stringify([view.document.path, view.screenId, view.selected.id]);
  }
  private asset(id?: string): UiImageAsset | undefined {
    return this.assets.find((a) => a.id === id);
  }
  private accepted(view: CompositionView): Draft {
    const asset = this.assets.find(
      (a) => a.kind === "uiImage" && a.relativePath === `game/${view.selected.literal}`,
    );
    const values = view.selected.numericLayout?.values;
    const parent = view.nodes.find((n) => n.span.start === view.selected.parentStart);
    return {
      key: this.key(view),
      document: view.document,
      screenId: view.screenId,
      nodeId: view.selected.id ?? undefined,
      parentId: parent?.id ?? "",
      assetId: asset?.id,
      expectedSha: asset?.sha256,
      width: String(values?.xsize?.value ?? asset?.naturalWidth ?? ""),
      height: String(values?.ysize?.value ?? asset?.naturalHeight ?? ""),
    };
  }
  private value(view = this.host.view()): Draft | undefined {
    return view ? (this.addition ?? this.drafts.get(this.key(view)) ?? this.accepted(view)) : undefined;
  }
  private changed(draft: Draft, view: CompositionView): boolean {
    if (!draft.nodeId) return true;
    const before = this.accepted(view);
    return (
      !!draft.replacement ||
      ["assetId", "parentId", "width", "height"].some(
        (k) => draft[k as keyof Draft] !== before[k as keyof Draft],
      )
    );
  }
  private store(draft: Draft): void {
    const view = this.host.view();
    if (!view) return;
    if (!draft.nodeId) this.addition = draft;
    else if (this.changed(draft, view)) this.drafts.set(draft.key, draft);
    else this.drafts.delete(draft.key);
  }
  private locked(draft: Draft): boolean {
    return this.locks.get(draft.key) !== false;
  }
  private natural(draft: Draft): { width: number; height: number } | undefined {
    const a = this.asset(draft.assetId),
      media = draft.replacement ?? this.cache.get(`${a?.id}:${a?.sha256}`)?.media;
    const width = media?.width ?? a?.naturalWidth,
      height = media?.height ?? a?.naturalHeight;
    return width && height ? { width, height } : undefined;
  }
  async refreshAssets(): Promise<void> {
    if (this.load) return this.load;
    const generation = ++this.generation;
    this.load = (async () => {
      try {
        const model = await this.host.request<{ assets: UiImageAsset[] }>("authoring.list");
        if (!this.active() || generation !== this.generation) return;
        this.assets = model.assets.filter((a) => a.kind === "uiImage");
        this.loaded = true;
      } catch (error) {
        this.loaded = true;
        if (this.active() && this.value()?.assetId) this.host.note((error as Error).message, true);
      } finally {
        this.load = undefined;
      }
    })();
    return this.load;
  }
  invalidate(): void {
    this.loaded = false;
  }
  unmountCard(): void {
    this.cardKeys.abort();
    this.card = undefined;
  }
  dispose(): void {
    this.disposed = true;
    this.cardKeys.abort();
    this.generation++;
    this.dialog?.remove();
    const staged = this.staged;
    this.releaseStaged();
    if (this.decoding && this.decoding !== staged) this.release(this.decoding);
    for (const c of this.cache.values()) this.release(c);
    this.cache.clear();
  }
  private async media(asset: UiImageAsset): Promise<Cached> {
    const key = `${asset.id}:${asset.sha256}`,
      cached = this.cache.get(key);
    if (cached) return cached;
    const pending = this.loadingMedia.get(key);
    if (pending) return pending;
    const job = this.host
      .request<MediaPresentation>("media.present", { assetId: asset.id, purpose: "imagePreview" })
      .then((m) => this.retain(m))
      .finally(() => this.loadingMedia.delete(key));
    this.loadingMedia.set(key, job);
    return job;
  }
  private retain(media: MediaPresentation, stageCurrent?: () => boolean): Promise<Cached> {
    const job = this.mediaQueue.then(() => this.decode(media, stageCurrent));
    // The caller receives the rejection; the queue still admits the next image.
    this.mediaQueue = job.then(() => {}, () => {});
    return job;
  }
  private show(image: HTMLImageElement, cached: Cached): void {
    if (this.cache.get(`${cached.media.assetId}:${cached.media.sha256}`) === cached)
      image.src = cached.url;
  }
  private release(cached: Cached): void {
    for (const image of document.querySelectorAll<HTMLImageElement>("img[src]"))
      if (image.getAttribute("src") === cached.url) image.removeAttribute("src");
    URL.revokeObjectURL(cached.url);
    const key = `${cached.media.assetId}:${cached.media.sha256}`;
    if (this.cache.get(key) === cached) this.cache.delete(key);
  }
  private releaseStaged(): void {
    const staged = this.staged;
    this.staged = undefined;
    if (staged) this.release(staged);
  }
  private async decode(media: MediaPresentation, stageCurrent?: () => boolean): Promise<Cached> {
    if (!this.active() || (stageCurrent && !stageCurrent()))
      throw Error("This image selection is no longer active.");
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(media.mimeType) ||
      !media.width ||
      !media.height ||
      media.byteCount > 16 * 1024 * 1024
    )
      throw Error("This image cannot be presented safely.");
    const key = `${media.assetId}:${media.sha256}`,
      cached = this.cache.get(key);
    if (cached) {
      if (stageCurrent) this.staged = cached;
      return cached;
    }
    const bytes = Uint8Array.from(atob(media.dataBase64), (c) => c.charCodeAt(0));
    while (
      [...this.cache.values()].reduce((sum, e) => sum + e.media.byteCount, 0) + bytes.length >
        32 * 1024 * 1024 &&
      this.cache.size
    ) {
      this.release([...this.cache.values()].find((entry) => entry !== this.staged)!);
    }
    const url = URL.createObjectURL(new Blob([bytes], { type: media.mimeType }));
    const entry = { media, url };
    this.decoding = entry;
    if (stageCurrent) this.staged = entry;
    const image = document.createElement("img");
    image.src = url;
    try {
      await image.decode();
      if (!this.active() || (stageCurrent && (!stageCurrent() || this.staged !== entry)))
        throw Error("This image selection is no longer active.");
    } catch {
      this.release(entry);
      if (this.staged === entry) this.staged = undefined;
      throw Error("This file cannot be decoded as an image. Choose another image. Your draft is retained.");
    } finally {
      this.decoding = undefined;
    }
    this.cache.set(key, entry);
    return entry;
  }
  private thumbnail(asset: UiImageAsset, media?: MediaPresentation): HTMLImageElement {
    const img = el("img");
    img.alt = asset.displayName;
    img.width = 68;
    img.height = 48;
    img.loading = "lazy";
    const cached = media
      ? this.cache.get(`${asset.id}:${media.sha256}`)
      : this.cache.get(`${asset.id}:${asset.sha256}`);
    if (cached) this.show(img, cached);
    else if (asset.status === "available")
      void this.media(asset)
        .then((c) => {
          if (this.active() && img.isConnected) this.show(img, c);
        })
        .catch(() => {});
    return img;
  }
  begin(parentId: string, document: ScreenDocument): void {
    const view = this.host.view();
    if (!view || this.hasDraft() || this.layout.currentDraft()) {
      this.host.note("Apply or cancel pending edits before adding an image.", true);
      return;
    }
    this.addition = {
      key: `image-add-${++sequence}`,
      document,
      screenId: view.screenId,
      parentId,
      width: "320",
      height: "180",
      returnId: view.selected.id ?? undefined,
    };
    this.host.redraw();
    this.focus("asset");
  }
  synthetic(view: CompositionView): ScreenNode | undefined {
    const draft = this.addition;
    if (!draft) return;
    const parent = view.nodes.find((n) => n.id === draft.parentId);
    const blocked: Record<string, string> = {};
    for (const k of [
      "columns",
      "rows",
      "left_padding",
      "right_padding",
      "top_padding",
      "bottom_padding",
      "spacing",
      "xminimum",
      "xmaximum",
      "yminimum",
      "ymaximum",
    ])
      blocked[k] = "This property is not supported for an image.";
    for (const k of parent?.kind === "vbox"
      ? ["ypos", "yanchor"]
      : parent?.kind === "hbox"
        ? ["xpos", "xanchor"]
        : parent?.kind === "grid"
          ? ["xpos", "ypos", "xanchor", "yanchor"]
          : [])
      blocked[k] = "The parent controls this placement.";
    const numericLayout: NumericLayout = {
      values: { xsize: { unit: "pixels", value: 320 }, ysize: { unit: "pixels", value: 180 } },
      blocked,
    };
    return {
      id: draft.key,
      kind: "image",
      literal: null,
      span: {
        start: Math.max(...view.nodes.map((n) => n.span.end)) + 1,
        end: Math.max(...view.nodes.map((n) => n.span.end)) + 1,
      },
      parentStart: parent?.span.start ?? null,
      layout: {},
      properties: [],
      protected: [],
      numericLayout,
    };
  }
  private edit(field: "width" | "height", value: string): void {
    const current = this.value();
    if (!current || this.saving) return;
    const draft = { ...current, [field]: value };
    const natural = this.natural(draft);
    if (this.locked(draft) && natural && valid(value))
      draft[field === "width" ? "height" : "width"] = String(
        Math.max(
          1,
          Math.round(
            Number(value) *
              (field === "width" ? natural.height / natural.width : natural.width / natural.height),
          ),
        ),
      );
    this.store(draft);
    this.errors.delete(draft.key);
    this.sync();
    this.host.preview();
  }
  render(card: HTMLElement, view: CompositionView): boolean {
    if (!this.addition && (!view.selected.id || view.selected.kind !== "image")) return false;
    this.cardKeys.abort();
    this.cardKeys = new AbortController();
    this.card = card;
    card.classList.add("screen-image");
    card.ariaLabel = "Image editor";
    if (!this.loaded && !this.load)
      void this.refreshAssets().then(() => {
        if (this.active()) this.host.redraw();
      });
    const draft = this.value(view)!;
    const a = this.asset(draft.assetId);
    const heading = el("header", "screen-image-heading");
    heading.append(el("h2", "", this.addition ? "Add image" : "Image"));
    const jump = button("Show preview", () =>
      document.querySelector<HTMLElement>(".screen-stage")?.scrollIntoView({ block: "start" }),
    );
    jump.classList.add("screen-image-jump");
    heading.append(jump);
    card.append(heading);
    const body = el("div", "screen-image-body");
    card.append(body);
    const trigger = button("", () => void this.openPicker());
    trigger.classList.add("screen-image-asset");
    trigger.ariaLabel = a ? `Change image, ${a.displayName}` : "Choose image";
    trigger.dataset.imageFocus = "asset";
    if (a) trigger.append(this.thumbnail(a, draft.replacement));
    const words = el("span", "screen-image-words");
    words.append(
      el("strong", "", a?.displayName ?? "Choose an image"),
      el("small", "", a?.relativePath.replace(/^game\//, "") ?? "Use a project asset or import one"),
    );
    trigger.append(words, el("span", "screen-image-change", a ? "Change…" : "Choose…"));
    body.append(trigger);
    if (a && a.status !== "available" && !draft.replacement) {
      const warning = el("div", "screen-image-warning");
      warning.append(
        el(
          "p",
          "",
          a.status === "changed"
            ? "This file changed. Review it before applying."
            : a.status === "missing"
              ? "Image missing. Restore the file or choose another image."
              : "This file cannot be read as an image. Choose another image.",
        ),
        button(a.status === "changed" ? "Review changed image" : "Choose another image", () =>
          a.status === "changed" ? void this.review(a) : void this.openPicker(),
        ),
      );
      body.append(warning);
    }
    const fields = el("section", "screen-image-size");
    fields.append(el("h3", "", "Displayed size"));
    const pair = el("div", "screen-image-fields");
    for (const [key, label] of [
      ["width", "Width"],
      ["height", "Height"],
    ] as const) {
      const wrap = el("label", "screen-image-field"),
        input = el("input");
      input.type = "text";
      input.inputMode = "numeric";
      input.ariaLabel = label;
      input.dataset.imageField = key;
      input.value = draft[key];
      input.oninput = () => this.edit(key, input.value);
      input.onblur = () => {
        if (!valid(input.value)) {
          this.errors.set(draft.key, {
            field: key,
            text: "Enter a whole number from 1 to 16384. Your draft is retained.",
          });
          this.sync();
        }
      };
      const error = el("span", "screen-image-field-error");
      error.id = `${draft.key}-${key}-error`;
      error.hidden = true;
      error.dataset.imageError = key;
      input.setAttribute("aria-describedby", error.id);
      wrap.append(el("span", "", label), input, el("span", "screen-image-unit", "px"), error);
      pair.append(wrap);
    }
    fields.append(pair);
    const preserve = el("input");
    preserve.type = "checkbox";
    preserve.ariaLabel = "Preserve aspect ratio";
    preserve.checked = this.locked(draft);
    preserve.onchange = () => {
      this.locks.set(draft.key, preserve.checked);
      if (preserve.checked) this.edit("width", this.value()!.width);
      else this.sync();
    };
    const lock = el("label", "screen-image-lock");
    lock.append(preserve, el("span", "", "Preserve aspect ratio"));
    fields.append(lock);
    const natural = this.natural(draft),
      original = el("div", "screen-image-original");
    original.append(
      el(
        "span",
        "",
        natural
          ? `Original ${natural.width} × ${natural.height} px`
          : "Choose an image to use its original ratio.",
      ),
    );
    if (natural)
      original.append(
        button("Use original", () => {
          if (this.saving) return;
          const next = { ...this.value()!, width: String(natural.width), height: String(natural.height) };
          this.store(next);
          this.errors.delete(next.key);
          this.sync();
          this.focus("width");
          this.host.preview();
        }),
      );
    original.querySelector("button")?.setAttribute("data-image-original", "");
    fields.append(original);
    body.append(fields);
    const layout = el("details", "screen-image-layout");
    layout.open = this.layoutOpen.get(draft.key) ?? false;
    layout.ontoggle = () => this.layoutOpen.set(draft.key, layout.open);
    layout.append(el("summary", "", "Layout"));
    const parentLabel = el("label", "field", "Inside parent"),
      parent = el("select");
    parent.ariaLabel = "Inside parent";
    for (const node of view.nodes.filter((n) => n.id && containers.has(n.kind))) {
      const option = el(
        "option",
        "",
        node.kind === "screen" ? view.screenName : `${node.kind} · ${view.nodes.indexOf(node)}`,
      );
      option.value = node.id!;
      parent.append(option);
    }
    parent.value = draft.parentId;
    parent.onchange = () => {
      const next = { ...this.value()!, parentId: parent.value };
      this.store(next);
      this.errors.delete(next.key);
      this.host.redraw();
      this.host.preview();
    };
    parentLabel.append(parent);
    layout.append(parentLabel);
    const numeric = el("div");
    layout.append(numeric);
    this.layout.render(numeric, true);
    this.host.layoutTools(numeric);
    if (!this.addition) this.host.order(layout);
    body.append(layout);
    const footer = el("footer", "screen-image-commit"),
      error = el("div", "screen-image-error");
    error.role = "alert";
    const state = el("p", "screen-image-state");
    state.role = "status";
    const controls = el("div", "screen-edit-actions");
    const apply = button(this.addition ? "Add image" : "Apply image", () => void this.apply(), true);
    apply.dataset.imageApply = "";
    const cancel = button("Cancel", () => this.cancel());
    cancel.dataset.imageCancel = "";
    controls.append(apply, cancel);
    footer.append(error, state, controls);
    card.append(footer);
    card.onkeydown = (event) => {
      if (event.isComposing || this.saving || this.dialog?.open) return;
      const input = event.target instanceof HTMLElement && event.target.matches("input:not([type=checkbox])");
      if (event.key === "Enter" && input) {
        event.preventDefault();
        event.stopPropagation();
        void this.apply();
      } else if (event.key === "Escape" && (this.hasCurrentDraft() || this.layout.currentDraft())) {
        event.preventDefault();
        event.stopPropagation();
        this.cancel();
      }
    };
    const keys = card.onkeydown;
    card.onkeydown = null;
    card.addEventListener("keydown", (event) => keys?.call(card, event), {
      capture: true,
      signal: this.cardKeys.signal,
    });
    this.sync();
    return true;
  }
  private hasCurrentDraft(): boolean {
    const view = this.host.view();
    return !!this.addition || (!!view && this.drafts.has(this.key(view)));
  }
  sync(): void {
    const view = this.host.view(),
      draft = this.value(view);
    if (!view || !draft || !this.card?.isConnected) return;
    for (const key of ["width", "height"] as const) {
      const input = this.card.querySelector<HTMLInputElement>(`[data-image-field=${key}]`);
      if (input) {
        input.value = draft[key];
        input.readOnly = this.saving || !this.loaded;
        input.ariaInvalid = String(this.errors.get(draft.key)?.field === key);
      }
      const error = this.card.querySelector<HTMLElement>(`[data-image-error=${key}]`);
      if (error) {
        const problem = this.errors.get(draft.key);
        error.textContent = problem?.field === key ? problem.text : "";
        error.hidden = !error.textContent;
      }
    }
    this.card
      .querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[type=checkbox],select")
      .forEach((control) => (control.disabled = this.saving || !this.loaded));
    const original = this.card.querySelector<HTMLButtonElement>("[data-image-original]");
    if (original) original.disabled = this.saving || !this.loaded;
    this.layout.sync();
    let layout = false;
    try {
      layout = !!this.layout.currentDraft();
    } catch {
      layout = true;
    }
    const dirty = this.hasCurrentDraft() || layout;
    const apply = this.card.querySelector<HTMLButtonElement>("[data-image-apply]"),
      cancel = this.card.querySelector<HTMLButtonElement>("[data-image-cancel]");
    if (apply) apply.disabled = this.saving || !dirty;
    if (cancel) cancel.disabled = this.saving || !dirty;
    const state = this.card.querySelector<HTMLElement>(".screen-image-state");
    if (state)
      state.textContent = this.saving ? "Applying image…" : dirty ? "Pending changes" : "No pending changes";
    const error = this.card.querySelector<HTMLElement>(".screen-image-error");
    if (error) {
      const problem = this.errors.get(draft.key);
      error.replaceChildren();
      error.hidden = !problem;
      if (problem) {
        error.append(el("p", "", problem.text));
        if (problem.field === "source") error.append(button("Inspect Source", this.host.source));
      }
    }
  }
  private focus(field: string): void {
    this.card
      ?.querySelector<HTMLElement>(
        field.startsWith("layout:")
          ? `[data-layout-field="${field.slice(7)}"]`
          : `[data-image-field="${field}"],[data-image-focus="${field}"]`,
      )
      ?.focus({ preventScroll: true });
  }
  private fail(field: string, text: string): void {
    const draft = this.value();
    if (!draft) return;
    this.errors.set(draft.key, { field, text });
    this.sync();
    this.focus(field);
    this.host.note(text, true);
  }
  private cancel(): void {
    if (this.saving) return;
    const draft = this.value();
    if (!draft) return;
    const active = (document.activeElement as HTMLElement | null)?.dataset;
    const focus = active?.imageField ?? (active?.layoutField ? `layout:${active.layoutField}` : undefined);
    this.layout.cancelCurrent();
    this.drafts.delete(draft.key);
    this.errors.delete(draft.key);
    if (this.addition) {
      this.addition = undefined;
      if (draft.returnId) this.host.select(draft.returnId, true);
      else this.host.redraw();
    } else {
      this.host.redraw();
      if (focus) this.focus(focus);
    }
    this.host.note("Changes cancelled.");
    this.host.preview();
  }
  private async apply(): Promise<void> {
    const view = this.host.view(),
      draft = this.value(view);
    if (!view || !draft || this.saving) return;
    for (const field of ["width", "height"] as const)
      if (!valid(draft[field])) {
        this.fail(field, "Enter a whole number from 1 to 16384. Your draft is retained.");
        return;
      }
    const asset = this.asset(draft.assetId);
    if (!asset) {
      this.fail("asset", "Choose an available UI image. Your draft is retained.");
      return;
    }
    if (asset.status !== "available" && !draft.replacement) {
      this.fail(
        "asset",
        asset.status === "changed"
          ? "This file changed. Review it before applying. Your draft is retained."
          : "This image is missing or unreadable. Choose another image. Your draft is retained.",
      );
      return;
    }
    let layout: ReturnType<ScreenLayoutEditor["currentDraft"]>;
    try {
      layout = this.layout.currentDraft(true);
    } catch (error) {
      this.fail("layout", (error as Error).message);
      return;
    }
    if (layout && layout.document.revision !== draft.document.revision) {
      this.fail(
        "source",
        "This layout and image draft use different Source revisions. Your drafts are retained.",
      );
      return;
    }
    if (!this.changed(draft, view) && !layout) return;
    const active = (document.activeElement as HTMLElement | null)?.dataset;
    const focus = active?.imageField ?? (active?.layoutField ? `layout:${active.layoutField}` : undefined);
    const common = {
      assetId: asset.id,
      expectedAssetSha256: draft.expectedSha ?? asset.sha256,
      width: Number(draft.width),
      height: Number(draft.height),
      ...(draft.replacement ? { replacementSha256: draft.replacement.sha256 } : {}),
      ...(layout ? { layout: layout.values } : {}),
    };
    const parent = view.nodes.find((n) => n.span.start === view.selected.parentStart);
    const command: CompositionCommand = draft.nodeId
      ? {
          type: "image",
          nodeId: draft.nodeId,
          ...common,
          ...(draft.parentId !== parent?.id ? { parentId: draft.parentId } : {}),
        }
      : { type: "addImage", parentId: draft.parentId, ...common };
    const submitted: SubmittedImage = {
      draft: { ...draft },
      command,
      layout: this.layout.reserveForImage(draft.document),
    };
    this.submitted = submitted;
    this.sync();
    try {
      if (draft.replacement) await this.retain(draft.replacement);
      else await this.media(asset);
      if (!this.active()) return;
      await this.host.commit(command, draft.document);
      if (this.active() && focus) this.focus(focus);
    } catch (error) {
      if (this.active()) this.fail("source", `${(error as Error).message} Your draft is retained.`);
    } finally {
      if (this.submitted === submitted) this.submitted = undefined;
      submitted.layout.release();
      if (this.active()) this.sync();
    }
  }
  accept(command: CompositionCommand, base: ScreenDocument, accepted: ScreenDocument): void {
    if (command.type === "image" || command.type === "addImage") {
      const submitted = this.submitted;
      if (command.replacementSha256) {
        const asset = this.asset(command.assetId);
        const media =
          submitted?.draft.replacement ?? this.cache.get(`${command.assetId}:${command.replacementSha256}`)?.media;
        if (asset && media) {
          asset.sha256 = command.replacementSha256;
          asset.naturalWidth = media.width ?? undefined;
          asset.naturalHeight = media.height ?? undefined;
          asset.status = "available";
        }
      }
      if (submitted && submitted.command === command) {
        this.drafts.delete(submitted.draft.key);
        this.errors.delete(submitted.draft.key);
        if (command.type === "addImage") this.addition = undefined;
        submitted.layout.accept(accepted);
        this.submitted = undefined;
      }
    } else this.layout.accept("", base, accepted);
    for (const draft of this.drafts.values()) {
      if (draft.document.path !== base.path || draft.document.revision !== base.revision) continue;
      const before = base.screens.flatMap((s) => s.nodes).find((n) => n.id === draft.nodeId),
        after = accepted.screens.flatMap((s) => s.nodes).find((n) => n.id === draft.nodeId);
      const parentId = (d: ScreenDocument, n: ScreenNode) =>
        d.screens.flatMap((s) => s.nodes).find((p) => p.span.start === n.parentStart)?.id;
      if (
        before &&
        after &&
        before.literal === after.literal &&
        JSON.stringify(before.numericLayout?.values) === JSON.stringify(after.numericLayout?.values) &&
        parentId(base, before) === parentId(accepted, after)
      )
        draft.document = accepted;
    }
  }
  canvasDraft(): {
    invalid: boolean;
    samples: Record<string, unknown>[];
    addition?: Record<string, unknown>;
  } {
    const view = this.host.view();
    if (!view) return { invalid: this.hasDraft(), samples: [] };
    const result: {
      invalid: boolean;
      samples: Record<string, unknown>[];
      addition?: Record<string, unknown>;
    } = { invalid: false, samples: [] };
    const drafts = [...this.drafts.values()].filter(
      (d) => d.document.path === view.document.path && d.screenId === view.screenId,
    );
    if (this.addition) drafts.push(this.addition);
    for (const d of drafts) {
      const a = this.asset(d.assetId);
      if (
        !a ||
        !valid(d.width) ||
        !valid(d.height) ||
        d.document.revision !== view.document.revision ||
        (a.status !== "available" && !d.replacement)
      ) {
        result.invalid = true;
        continue;
      }
      const node = view.nodes.find((n) => n.id === d.nodeId),
        parent = view.nodes.find((n) => n.id === d.parentId);
      const data = {
        assetId: a.id,
        expectedAssetSha256: d.expectedSha ?? a.sha256,
        ...(d.replacement ? { replacementSha256: d.replacement.sha256 } : {}),
        width: Number(d.width),
        height: Number(d.height),
      };
      if (d.nodeId && node) {
        result.samples.push({
          nodeStart: node.span.start,
          ...data,
          ...(parent && parent.span.start !== node.parentStart ? { parentStart: parent.span.start } : {}),
        });
      } else if (!d.nodeId && parent) result.addition = { parentStart: parent.span.start, ...data };
      else result.invalid = true;
    }
    return result;
  }
  private closePicker(): void {
    if (this.importing) return;
    this.releaseStaged();
    this.pickerGeneration++;
    const dialog = this.dialog;
    this.dialog = undefined;
    dialog?.close();
    dialog?.remove();
  }
  private async openPicker(): Promise<void> {
    if (this.saving) return;
    const key = this.value()?.key,
      generation = ++this.pickerGeneration;
    await this.refreshAssets();
    if (!this.active() || generation !== this.pickerGeneration || key !== this.value()?.key) return;
    this.closePicker();
    const dialog = el("dialog", "screen-image-dialog");
    dialog.ariaLabel = "Choose UI image";
    this.dialog = dialog;
    dialog.onclose = () => {
      if (this.dialog === dialog) {
        this.releaseStaged();
        this.dialog = undefined;
        this.pickerGeneration++;
      }
      dialog.remove();
      this.focus("asset");
    };
    dialog.oncancel = (event) => {
      if (this.importing) event.preventDefault();
    };
    document.body.append(dialog);
    this.renderPicker();
    dialog.showModal();
    dialog.querySelector("input")?.focus();
  }
  private renderPicker(): void {
    this.releaseStaged();
    this.pickerGeneration++;
    const dialog = this.dialog;
    if (!dialog) return;
    dialog.replaceChildren();
    const heading = el("header");
    heading.append(
      el("h2", "", "Choose image"),
      button("Close", () => this.closePicker()),
    );
    dialog.append(heading);
    const toolbar = el("div", "screen-image-picker-tools"),
      search = el("input");
    search.type = "search";
    search.ariaLabel = "Search UI images";
    search.placeholder = "Search project images";
    toolbar.append(
      search,
      button("Import image…", () => this.renderImport()),
    );
    dialog.append(toolbar, el("p", "screen-image-scope", "Project UI images · PNG, JPEG, WebP"));
    const list = el("div", "screen-image-list");
    dialog.append(list);
    const render = () => {
      list.replaceChildren();
      const matches = this.assets.filter((a) =>
        `${a.displayName} ${a.relativePath}`.toLowerCase().includes(search.value.toLowerCase()),
      );
      for (const [index, a] of matches.entries()) {
        const row = button("", () => (a.status === "changed" ? void this.review(a) : void this.use(a)));
        row.ariaLabel = `Use ${a.displayName}`;
        row.classList.add("screen-image-choice");
        if (index < 8 || this.cache.has(`${a.id}:${a.sha256}`)) row.append(this.thumbnail(a));
        const words = el("span", "screen-image-words");
        words.append(
          el("strong", "", a.displayName),
          el(
            "small",
            "",
            `${a.naturalWidth ?? "?"} × ${a.naturalHeight ?? "?"} · ${a.relativePath.split(".").at(-1)?.toUpperCase()}`,
          ),
          el("small", "", a.relativePath.replace(/^game\//, "")),
        );
        row.append(words);
        if (a.status !== "available") row.append(el("span", "", a.status));
        list.append(row);
      }
      if (!matches.length)
        list.append(
          el("p", "", `No UI images match "${search.value}".`),
          button("Clear search", () => {
            search.value = "";
            render();
          }),
        );
    };
    search.oninput = render;
    render();
    dialog.append(
      el("p", "screen-image-boundary", "Selection reads image data. It runs no project scripts or actions."),
    );
  }
  private async use(asset: UiImageAsset, replacement?: MediaPresentation): Promise<void> {
    const current = this.value(),
      generation = this.pickerGeneration;
    if (!current) return;
    try {
      if (!replacement) await this.media(asset);
      if (!this.active() || generation !== this.pickerGeneration || current.key !== this.value()?.key) return;
      const draft = { ...current, assetId: asset.id, expectedSha: asset.sha256, replacement };
      const natural = replacement ?? this.cache.get(`${asset.id}:${asset.sha256}`)?.media;
      if (this.locked(draft) && natural?.width && natural.height && valid(draft.width))
        draft.height = String(
          Math.max(1, Math.round((Number(draft.width) * natural.height) / natural.width)),
        );
      this.store(draft);
      this.errors.delete(draft.key);
      this.closePicker();
      this.host.redraw();
      this.focus("width");
      this.host.preview();
    } catch (error) {
      if (!this.active() || generation !== this.pickerGeneration) return;
      this.fail("asset", (error as Error).message);
      const dialog = this.dialog;
      if (dialog) dialog.append(el("p", "screen-image-error", (error as Error).message));
    }
  }
  private renderImport(): void {
    this.releaseStaged();
    this.pickerGeneration++;
    const dialog = this.dialog;
    if (!dialog) return;
    dialog.replaceChildren();
    const heading = el("header");
    heading.append(
      el("h2", "", "Import image"),
      button("Close", () => this.closePicker()),
    );
    dialog.append(
      heading,
      button("Back to project images", () => this.renderPicker()),
      el("p", "", "Import a PNG, JPEG or WebP as a UI image."),
    );
    const status = el("p", "screen-image-error");
    status.role = "alert";
    const browse = button("Browse files…", () => void choose());
    dialog.append(browse, status);
    const choose = async () => {
      this.releaseStaged();
      const generation = ++this.pickerGeneration;
      const current = () => this.active() && this.dialog === dialog && generation === this.pickerGeneration;
      browse.disabled = true;
      try {
        const choice = await this.host.request<{
          cancelled?: boolean;
          authorityId: string;
          displayName: string;
          extension: string;
        }>("asset.chooseUiImage");
        if (!current()) return;
        if (choice.cancelled) {
          this.renderPicker();
          return;
        }
        const media = await this.host.request<MediaPresentation>("asset.previewImport", {
          authorityId: choice.authorityId,
        });
        if (!current()) return;
        const shown = await this.retain(media, current);
        if (!current()) {
          this.release(shown);
          return;
        }
        const staged = el("div", "screen-image-staged"),
          img = el("img");
        this.show(img, shown);
        img.alt = choice.displayName;
        staged.append(
          img,
          el("strong", "", choice.displayName),
          el("span", "", `${media.width} × ${media.height} px · UI image`),
        );
        const name = el("input");
        name.ariaLabel = "Display name";
        name.value = choice.displayName.replace(/\.[^.]+$/, "");
        const label = el("label", "field", "Display name");
        label.append(name);
        const destination = el("p", "screen-image-scope");
        const technical = () =>
          name.value
            .toLowerCase()
            .replace(/[^a-z0-9_]+/g, "_")
            .replace(/^[^a-z]+/, "")
            .slice(0, 64) || "image";
        const update = () =>
          (destination.textContent = `Destination: game/images/ui ${technical()}.${choice.extension}`);
        name.oninput = update;
        update();
        const controls = el("div", "screen-edit-actions"),
          cancel = button("Cancel import", () => this.renderPicker());
        const submit = button(
          "Import and use",
          () =>
            void (async () => {
              if (!name.value.trim()) {
                status.textContent = "Give this image a display name.";
                name.ariaInvalid = "true";
                name.focus();
                return;
              }
              if (!current()) return;
              this.importing = true;
              dialog
                .querySelectorAll<HTMLInputElement | HTMLButtonElement>("input,button")
                .forEach((control) => (control.disabled = true));
              try {
                await this.host.coordinate(() =>
                  this.host.request("asset.import", {
                    authorityId: choice.authorityId,
                    kind: "uiImage",
                    technicalName: technical(),
                    displayName: name.value.trim(),
                    characterId: null,
                    expression: null,
                  }),
                );
                if (!this.active()) return;
                this.releaseStaged();
                this.host.saved();
                await this.refreshAssets();
                if (!current()) return;
                const destinationPath = `game/images/ui ${technical()}.${choice.extension}`;
                const asset = this.assets.find(
                  (a) => a.relativePath === destinationPath && a.sha256 === media.sha256,
                );
                if (!asset) throw Error("The imported UI image is unavailable.");
                this.importing = false;
                await this.use(asset);
              } catch (error) {
                if (current()) {
                  status.textContent = `${(error as Error).message} Your draft and display name are retained. Browse again to retry.`;
                  submit.disabled = true;
                }
              } finally {
                this.importing = false;
                if (current()) {
                  dialog
                    .querySelectorAll<HTMLInputElement | HTMLButtonElement>("input,button")
                    .forEach((control) => (control.disabled = false));
                  submit.disabled = true;
                }
              }
            })(),
          true,
        );
        controls.append(cancel, submit);
        dialog.replaceChildren(heading, staged, label, destination, status, browse, controls);
      } catch (error) {
        if (current()) status.textContent = (error as Error).message;
      } finally {
        browse.disabled = false;
      }
    };
  }
  private async review(asset: UiImageAsset): Promise<void> {
    const generation = ++this.pickerGeneration;
    const draft = this.value();
    if (!draft || this.saving) return;
    try {
      const media = await this.host.request<MediaPresentation>("asset.reviewUiImage", {
        assetId: asset.id,
        expectedAssetSha256: asset.sha256,
      });
      if (!this.active() || generation !== this.pickerGeneration) return;
      const after = await this.retain(media);
      if (!this.active() || generation !== this.pickerGeneration || draft.key !== this.value()?.key) return;
      this.closePicker();
      const dialog = el("dialog", "screen-image-dialog");
      dialog.ariaLabel = "Review changed image";
      this.dialog = dialog;
      const before = el("section"),
        next = el("section");
      before.append(el("h3", "", "Previously selected"));
      const old = this.cache.get(`${asset.id}:${asset.sha256}`);
      if (old) {
        const img = el("img");
        this.show(img, old);
        img.alt = "Previously selected image";
        before.append(img);
      } else before.append(el("p", "", "Previous file preview unavailable."));
      before.append(el("p", "", `${asset.naturalWidth ?? "?"} × ${asset.naturalHeight ?? "?"} px`));
      const image = el("img");
      this.show(image, after);
      image.alt = "File on disk";
      next.append(el("h3", "", "File on disk"), image, el("p", "", `${media.width} × ${media.height} px`));
      const comparison = el("div", "screen-image-comparison");
      comparison.append(before, next);
      dialog.append(
        el("h2", "", "Review changed image"),
        el("p", "", asset.relativePath),
        comparison,
        el(
          "p",
          "",
          this.locked(draft)
            ? `Width stays at ${draft.width} px. Height becomes ${Math.max(1, Math.round((Number(draft.width) * media.height!) / media.width!))} px to preserve aspect. Apply accepts the change.`
            : "Your displayed size stays unchanged. Apply accepts the refreshed reference.",
        ),
        button("Keep draft", () => this.closePicker()),
        button("Use changed image", () => void this.use(asset, media), true),
      );
      dialog.onclose = () => {
        dialog.remove();
        if (this.dialog === dialog) {
          this.dialog = undefined;
          this.pickerGeneration++;
        }
        this.focus("asset");
      };
      document.body.append(dialog);
      dialog.showModal();
    } catch (error) {
      if (this.active() && generation === this.pickerGeneration)
        this.fail("asset", `${(error as Error).message} Your draft is retained.`);
    }
  }
}
