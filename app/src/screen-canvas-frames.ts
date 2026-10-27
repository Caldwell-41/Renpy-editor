import type { CoreOperation } from "./protocol.ts";

export interface CanvasGeometry {
  start: number; x: number; y: number; width: number; height: number;
}
interface CanvasFrame {
  phase: "starting" | "ready" | "stale" | "unavailable";
  frameId?: string; revision?: string; image?: string;
  buttonState?: string;
  message?: string;
  geometry?: CanvasGeometry[];
}
interface Host {
  canvas: HTMLElement;
  status: HTMLElement;
  request: <T>(operation: CoreOperation, payload?: Record<string, unknown>) => Promise<T>;
  currentRevision: () => string | undefined;
  installed: () => void;
  invalidated: (discardProvisional: boolean) => void;
}

/** Owns helper delivery through PNG installation. Geometry describes the installed image. */
export class ScreenCanvasFrames {
  private frame?: CanvasFrame;
  private key = "";
  private sequence = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private usable = false;
  private disposed = false;
  constructor(private readonly host: Host) {}

  get ready(): boolean { return this.usable && this.active() && this.frame?.revision === this.host.currentRevision(); }
  get geometry(): readonly CanvasGeometry[] | undefined { return this.frame?.geometry; }

  render(payload: Record<string, unknown>): void {
    if (!this.active()) return;
    const key = JSON.stringify(payload);
    if (key === this.key) {
      if (this.usable && this.frame) this.install(this.sequence, this.frame);
      return;
    }
    this.key = key;
    this.markStale(this.frame?.image ? "Updating canvas. Previous image is out of date." : "Starting the Ren'Py canvas helper…", false);
    const sequence = this.sequence;
    this.timer = setTimeout(() => { void this.update(sequence, payload); }, 0);
  }

  invalidate(message: string): void { this.markStale(message, true); }

  dispose(): void {
    this.disposed = true;
    this.sequence++;
    clearTimeout(this.timer);
    const image = this.host.canvas.querySelector<HTMLImageElement>(".screen-render");
    if (image) { image.onload = null; image.onerror = null; }
  }

  private active(sequence = this.sequence): boolean {
    return !this.disposed && this.host.canvas.isConnected && this.host.currentRevision() !== undefined && sequence === this.sequence;
  }

  private markStale(message: string, discardProvisional: boolean): void {
    this.sequence++;
    clearTimeout(this.timer);
    this.usable = false;
    if (discardProvisional) {
      this.key = "";
      const image = this.host.canvas.querySelector<HTMLImageElement>(".screen-render");
      if (image) image.style.transform = "";
      delete this.host.canvas.dataset.provisional;
    }
    this.host.canvas.dataset.stale = "true";
    this.host.status.textContent = message;
    this.host.invalidated(discardProvisional);
  }

  private fail(sequence: number, error: unknown): void {
    if (this.active(sequence)) this.invalidate(`${(error as Error).message} Drafts retained.`);
  }

  private async update(sequence: number, payload: Record<string, unknown>): Promise<void> {
    if (!this.active(sequence)) return;
    try {
      const frame = await this.host.request<CanvasFrame>("screens.canvasRender", payload);
      this.receive(sequence, frame);
    } catch (error) { this.fail(sequence, error); }
  }

  private receive(sequence: number, frame: CanvasFrame): void {
    if (!this.active(sequence)) return;
    if (frame.phase === "starting" && frame.frameId) {
      this.timer = setTimeout(() => {
        void this.poll(sequence, frame.frameId!);
      }, 16);
    } else if (frame.phase === "ready" && frame.revision === this.host.currentRevision() && frame.image?.startsWith("data:image/png;base64,")) {
      this.install(sequence, frame);
      if (frame.frameId) this.timer = setTimeout(() => { void this.health(sequence, frame.frameId!); }, 500);
    } else this.invalidate(frame.message ?? "Canvas unavailable. Drafts retained; open Source or use Test in Ren'Py.");
  }

  private async poll(sequence: number, frameId: string): Promise<void> {
    if (!this.active(sequence)) return;
    try {
      this.receive(sequence, await this.host.request<CanvasFrame>("screens.canvasStatus", { frameId }));
    } catch (error) { this.fail(sequence, error); }
  }

  private async health(sequence: number, frameId: string): Promise<void> {
    if (!this.active(sequence)) return;
    try {
      const current = await this.host.request<CanvasFrame>("screens.canvasStatus", { frameId, includeImage: false });
      if (!this.active(sequence)) return;
      if (current.phase !== "ready") {
        this.invalidate(current.message ?? "Canvas unavailable. Drafts retained.");
        return;
      }
      this.timer = setTimeout(() => { void this.health(sequence, frameId); }, 500);
    } catch (error) { this.fail(sequence, error); }
  }

  private install(sequence: number, frame: CanvasFrame): void {
    if (!frame.image) return;
    const { canvas } = this.host;
    canvas.dataset.renderer = "renpy";
    const image = canvas.querySelector<HTMLImageElement>(".screen-render") ?? canvas.ownerDocument.createElement("img");
    image.className = "screen-render";
    image.setAttribute("aria-label", "Ren'Py screen canvas"); image.alt = "Inert screen rendering";
    image.dataset.buttonState = frame.buttonState ?? "";
    image.onload = () => {
      if (!this.active(sequence) || frame.revision !== this.host.currentRevision()) return;
      this.frame = frame;
      image.style.transform = ""; delete canvas.dataset.provisional;
      this.usable = true; canvas.dataset.stale = "false";
      this.host.installed();
    };
    image.onerror = () => {
      if (this.active(sequence)) this.invalidate("Canvas image unavailable. Drafts retained.");
    };
    image.src = frame.image;
    if (image.parentElement !== canvas) canvas.prepend(image);
  }
}
