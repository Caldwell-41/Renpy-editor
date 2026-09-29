import { requestCore } from "./bridge.ts";
export interface Layout { navigationCollapsed: boolean; treeCollapsed: boolean; inspectorOpen: boolean; previewPercent?: number; treeWidth?:number; graph?: { zoom:number; x:number; y:number } }
export interface Preferences { schemaVersion: 1; theme: "system" | "light" | "dark"; density: "small" | "default" | "large"; sourceFontSize: number; rememberLayout: boolean; layouts: Record<string, Layout> }
let preferences: Preferences = { schemaVersion: 1, theme: "system", density: "default", sourceFontSize: 14, rememberLayout: true, layouts: {} };
let writer: Promise<void> = Promise.resolve();
let persistenceError = "";
const subscribers = new Set<() => void>();
const systemTheme = typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : undefined;
export function readPreferences(): Preferences { return structuredClone(preferences); }
export function preferenceError(): string { return persistenceError; }
export function subscribePreferences(listener: () => void): () => void { subscribers.add(listener); return () => subscribers.delete(listener); }
function apply(): void {
  document.documentElement.dataset.theme = preferences.theme === "system" ? systemTheme?.matches ? "dark" : "light" : preferences.theme;
  document.documentElement.dataset.density = preferences.density;
  document.documentElement.style.setProperty("--source-size", `${preferences.sourceFontSize}px`);
  subscribers.forEach(listener => listener());
}
systemTheme?.addEventListener("change", () => { if (preferences.theme === "system") apply(); });
export async function loadPreferences(): Promise<void> {
  try { const result = await requestCore<Preferences>("preferences.read"); if (result.ok) preferences = result.value; else persistenceError = result.error.message; }
  catch { persistenceError = "Preferences could not be loaded. Using defaults."; }
  apply();
}
export function updatePreferences(patch: Partial<Preferences>): Promise<void> {
  preferences = { ...preferences, ...patch }; apply();
  const snapshot = structuredClone(preferences);
  writer = writer.catch(() => undefined).then(async () => {
    try { const result = await requestCore<Preferences>("preferences.write", { ...snapshot }); if (!result.ok) throw new Error(result.error.message); persistenceError = ""; }
    catch { persistenceError = "Preferences could not be saved on this device. Your current choices still apply for this session."; }
    subscribers.forEach(listener => listener());
  });
  return writer;
}
export function layoutFor(key: string): Layout { return preferences.rememberLayout ? { navigationCollapsed: false, treeCollapsed: false, inspectorOpen: false, ...preferences.layouts[key] } : { navigationCollapsed: false, treeCollapsed: false, inspectorOpen: false }; }
export function saveLayout(key: string, patch: Partial<Layout>): void {
  if (!preferences.rememberLayout) return;
  const entries = Object.entries(preferences.layouts).filter(([k]) => k !== key).slice(-63);
  void updatePreferences({ layouts: { ...Object.fromEntries(entries), [key]: { ...layoutFor(key), ...patch } } });
}
