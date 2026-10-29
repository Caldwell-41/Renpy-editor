import type { MediaPresentation } from "./scene-ui.ts";

export interface ImagePreview {
  readonly media: MediaPresentation;
}
interface RetainedImage extends ImagePreview {
  url: string;
}
const key = (assetId: string | undefined, sha256: string | undefined) => `${assetId}:${sha256}`;

/** Owns passive image URLs from decode admission through staged and workspace cleanup. */
export class ScreenImageMedia {
  private readonly cache = new Map<string, RetainedImage>();
  private readonly pending = new Map<string, Promise<ImagePreview>>();
  private queue: Promise<void> = Promise.resolve();
  private decoding?: RetainedImage;
  private staged?: RetainedImage;
  private disposed = false;

  constructor(
    private readonly current: () => boolean,
    private readonly present: (assetId: string) => Promise<MediaPresentation>,
  ) {}

  get(assetId: string | undefined, sha256: string | undefined): ImagePreview | undefined {
    return this.cache.get(key(assetId, sha256));
  }

  async load(asset: { id: string; sha256: string }): Promise<ImagePreview> {
    const id = key(asset.id, asset.sha256), cached = this.cache.get(id);
    if (cached) return cached;
    const pending = this.pending.get(id);
    if (pending) return pending;
    const job = this.present(asset.id)
      .then((media) => this.retain(media))
      .finally(() => this.pending.delete(id));
    this.pending.set(id, job);
    return job;
  }

  retain(media: MediaPresentation): Promise<ImagePreview> {
    return this.enqueue(media);
  }

  stage(media: MediaPresentation, current: () => boolean): Promise<ImagePreview> {
    return this.enqueue(media, current);
  }

  show(image: HTMLImageElement, preview: ImagePreview): void {
    const retained = this.cache.get(key(preview.media.assetId, preview.media.sha256));
    if (retained === preview) image.src = retained.url;
  }

  clearStaged(preview?: ImagePreview): void {
    if (preview && preview !== this.staged) return;
    const staged = this.staged;
    this.staged = undefined;
    if (staged) this.release(staged);
  }

  dispose(): void {
    this.disposed = true;
    const staged = this.staged;
    this.clearStaged();
    if (this.decoding && this.decoding !== staged) this.release(this.decoding);
    for (const image of this.cache.values()) this.release(image);
    this.cache.clear();
  }

  private active(): boolean {
    return !this.disposed && this.current();
  }

  private enqueue(media: MediaPresentation, stageCurrent?: () => boolean): Promise<ImagePreview> {
    const job = this.queue.then(() => this.decode(media, stageCurrent));
    // Keep admission serialized through decode settlement; the caller still receives failures.
    this.queue = job.then(() => {}, () => {});
    return job;
  }

  private release(image: RetainedImage): void {
    for (const element of document.querySelectorAll<HTMLImageElement>("img[src]"))
      if (element.getAttribute("src") === image.url) element.removeAttribute("src");
    URL.revokeObjectURL(image.url);
    const id = key(image.media.assetId, image.media.sha256);
    if (this.cache.get(id) === image) this.cache.delete(id);
  }

  private async decode(media: MediaPresentation, stageCurrent?: () => boolean): Promise<ImagePreview> {
    if (!this.active() || (stageCurrent && !stageCurrent()))
      throw Error("This image selection is no longer active.");
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(media.mimeType) ||
      !media.width ||
      !media.height ||
      media.byteCount > 16 * 1024 * 1024
    )
      throw Error("This image cannot be presented safely.");
    const id = key(media.assetId, media.sha256), cached = this.cache.get(id);
    if (cached) {
      if (stageCurrent) this.staged = cached;
      return cached;
    }
    const bytes = Uint8Array.from(atob(media.dataBase64), (c) => c.charCodeAt(0));
    while (
      [...this.cache.values()].reduce((sum, image) => sum + image.media.byteCount, 0) + bytes.length >
        32 * 1024 * 1024 &&
      this.cache.size
    ) {
      this.release([...this.cache.values()].find((image) => image !== this.staged)!);
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
    this.cache.set(id, entry);
    return entry;
  }
}
