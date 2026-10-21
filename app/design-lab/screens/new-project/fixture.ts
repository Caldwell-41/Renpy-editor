export type Outcome = "success" | "checksum" | "create-error" | "open-error";
export interface SampleSdk { id: string; version: string; source: string; compatible: boolean }
export interface Setup {
  title: string; folder: string; folderEdited: boolean; parent: string; sdk?: SampleSdk;
  sdks: SampleSdk[]; width: string; height: string; custom: boolean; git: boolean;
}
export const managedSdk = (): SampleSdk => ({ id: "managed", version: "8.5.3", source: "Sample managed SDK", compatible: true });
export const locations = ["Sample workspace / Stories", "Sample workspace / Writing / Visual novels / Autumn collection"];
export function fixture(state: string): Setup {
  const empty = state === "empty";
  return {
    title: empty ? "" : state === "long" ? "The Last Tram: A very long evening on the line to Northbridge" : "The Last Tram",
    folder: empty ? "" : state === "long" ? "the-last-tram-a-very-long-evening-on-the-line-to-northbridge" : "the-last-tram",
    folderEdited: false, parent: empty ? "" : locations[state === "long" ? 1 : 0]!,
    sdk: empty ? undefined : managedSdk(), sdks: empty ? [] : [managedSdk()],
    width: "1920", height: "1080", custom: false, git: true,
  };
}
export function folderFromTitle(title: string) {
  let output = "", separator = false;
  for (const char of title.trim()) {
    if (/^[a-z0-9]$/i.test(char)) { if (separator && output) output += "-"; output += char.toLowerCase(); separator = false; }
    else separator = true;
    if (output.length >= 64) break;
  }
  return output.replace(/-+$/, "") || "untitled-project";
}
export function titleError(s: Setup) {
  return !s.title.trim() ? "Enter a game title." : new TextEncoder().encode(s.title).length > 160 || /\p{Cc}/u.test(s.title) ? "Use a title of at most 160 UTF-8 bytes without control characters." : "";
}
export function folderError(s: Setup) {
  if (!s.folder) return "Enter a folder name.";
  if (!/^[a-z0-9][a-z0-9_-]{0,79}$/i.test(s.folder) || /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(s.folder)) return "Use 1–80 letters, numbers, hyphens or underscores. Start with a letter or number; reserved Windows names are unavailable.";
  if (s.folder.toLowerCase() === "existing-story") return "A sample folder already exists at this location. Choose another name.";
  return "";
}
export function resolutionError(s: Setup) {
  const w = Number(s.width), h = Number(s.height);
  return s.width === "" || s.height === "" || !Number.isInteger(w) || !Number.isInteger(h) || w < 640 || w > 7680 || h < 360 || h > 4320 || w % 2 || h % 2 ? "Use even dimensions between 640 × 360 and 7680 × 4320." : "";
}
export function ratio(s: Setup) {
  if (resolutionError(s)) return "";
  let a = Number(s.width), b = Number(s.height);
  while (b) { const remainder = a % b; a = b; b = remainder; }
  return `${Number(s.width) / a}:${Number(s.height) / a}`;
}
export const destination = (s: Setup) => s.parent && s.folder ? `${s.parent} / ${s.folder}` : "Choose a sample folder to see the final destination.";
