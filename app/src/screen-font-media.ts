import type { CoreOperation } from "./protocol.ts";

export interface ProjectFont {
  id: string; kind: string; displayName: string; relativePath: string; sha256: string; status: string;
}
export interface FontReference { assetId: string; expectedAssetSha256: string }
export interface FontPresentation { mimeType: string; dataBase64: string; byteCount: number; sha256: string }
interface LoadedFont { family: string; face: FontFace; bytes: number }
let sequence = 0;

/** Decodes core-owned bytes. No project path becomes a browser URL. */
export class ScreenFontMedia {
  private readonly cache = new Map<string, LoadedFont>();
  private readonly pending = new Map<string, Promise<string>>();
  private queue: Promise<void> = Promise.resolve();
  private disposed = false;
  constructor(private readonly current: () => boolean,
    private readonly request: <T>(operation: CoreOperation, payload: Record<string, unknown>) => Promise<T>) {}
  load(font: ProjectFont): Promise<string> {
    const key = `${font.id}:${font.sha256}`, cached = this.cache.get(key);
    if (cached) return Promise.resolve(cached.family);
    const pending = this.pending.get(key); if (pending) return pending;
    const job = this.queue.then(async () => {
      if (this.disposed || !this.current()) throw Error("This font selection is no longer active.");
      const value = await this.request<FontPresentation>("asset.presentFont", {assetId:font.id,expectedAssetSha256:font.sha256});
      if (value.sha256 !== font.sha256 || !["font/ttf","font/otf"].includes(value.mimeType) || value.byteCount > 16 * 1024 * 1024)
        throw Error("This project font cannot be read.");
      const bytes = Uint8Array.from(atob(value.dataBase64), c => c.charCodeAt(0));
      if (bytes.length !== value.byteCount) throw Error("The font bytes changed.");
      const family = `loomlight-project-font-${++sequence}`, face = new FontFace(family, bytes);
      await face.load();
      if (this.disposed || !this.current()) throw Error("This font selection is no longer active.");
      while ([...this.cache.values()].reduce((n, f) => n + f.bytes, 0) + bytes.length > 64 * 1024 * 1024 && this.cache.size) {
        const [oldKey, old] = this.cache.entries().next().value!;
        document.fonts.delete(old.face); this.cache.delete(oldKey);
      }
      document.fonts.add(face); this.cache.set(key, {family,face,bytes:bytes.length}); return family;
    }).finally(() => this.pending.delete(key));
    this.queue = job.then(() => {}, () => {}); this.pending.set(key,job); return job;
  }
  dispose(): void {
    this.disposed = true;
    for (const font of this.cache.values()) document.fonts.delete(font.face);
    this.cache.clear();
  }
}
