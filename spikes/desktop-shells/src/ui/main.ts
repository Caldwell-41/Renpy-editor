import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import type { DesktopRequest, FileVersion } from "../shared/contracts";
import { runGraphEvidence } from "./graph-evidence";

declare global {
  interface Window {
    loomlight?: { invoke(request: DesktopRequest): Promise<unknown>; subscribe(listener: (event: unknown) => void): () => void };
    __TAURI_INTERNALS__?: unknown;
    __loomlightRunUiEvidence?: (mode: "wide" | "narrow") => Promise<Record<string, unknown>>;
    __loomlightRunGraphEvidence?: () => Promise<Record<string, unknown>>;
  }
}

async function bridge() {
  if (window.loomlight) return { name: "Electron", ...window.loomlight };
  if (window.__TAURI_INTERNALS__) {
    const { invoke } = await import("@tauri-apps/api/core");
    const { listen } = await import("@tauri-apps/api/event");
    return {
      name: "Tauri",
      invoke: (request: DesktopRequest) => invoke("desktop_operation", { request }),
      subscribe: (listener: (event: unknown) => void) => {
        let unlisten: (() => void) | undefined;
        void listen("loomlight:event", (event) => listener(event.payload)).then((stop) => { unlisten = stop; });
        return () => unlisten?.();
      },
    };
  }
  throw new Error("No privileged desktop bridge is present");
}

const runtime = document.querySelector<HTMLElement>("#runtime")!;
const log = document.querySelector<HTMLElement>("#log")!;
const root = document.querySelector<HTMLInputElement>("#root")!;
const file = document.querySelector<HTMLInputElement>("#file")!;
const line = document.querySelector<HTMLInputElement>("#line")!;
const editor = monaco.editor.create(document.querySelector<HTMLElement>("#editor")!, {
  value: "# Select a synthetic fixture project to begin.\n",
  language: "python",
  automaticLayout: true,
  minimap: { enabled: false },
});
let current: FileVersion | undefined;

function report(value: unknown) { log.textContent = `${JSON.stringify(value, null, 2)}\n${log.textContent}`; }
function requestBase(operation: "readText" | "watchText") { return { operation, root: root.value, relativePath: file.value } as const; }

const desktop = await bridge();
runtime.textContent = desktop.name;
desktop.subscribe(report);

document.querySelector("#open")!.addEventListener("click", async () => {
  current = await desktop.invoke(requestBase("readText")) as FileVersion;
  editor.setValue(current.contents);
  await desktop.invoke(requestBase("watchText"));
  report({ opened: current.relativePath, sha256: current.sha256 });
});
document.querySelector("#save")!.addEventListener("click", async () => {
  if (!current) throw new Error("Open a file first");
  current = await desktop.invoke({ ...requestBase("readText"), operation: "writeTextAtomic", expectedSha256: current.sha256, contents: editor.getValue() }) as FileVersion;
  report({ saved: current.relativePath, sha256: current.sha256 });
});
document.querySelector("#sdk")!.addEventListener("click", async () => report(await desktop.invoke({ operation: "startMockSdk", command: "version", args: [], timeoutMs: 5_000 })));
document.querySelector("#reveal")!.addEventListener("click", () => {
  const target = Math.max(1, Number(line.value));
  editor.revealLineInCenter(target);
  editor.setSelection({ startLineNumber: target, startColumn: 1, endLineNumber: target, endColumn: 1 });
  editor.focus();
});

const workspace = document.querySelector<HTMLElement>("#workspace")!;
const layoutStatus = document.querySelector<HTMLElement>("#layout-status")!;
const panelDefinitions = {
  controls: { panel: document.querySelector<HTMLElement>("#controls")!, toggle: document.querySelector<HTMLButtonElement>("#toggle-controls")!, owner: workspace },
  inspector: { panel: document.querySelector<HTMLElement>("#inspector")!, toggle: document.querySelector<HTMLButtonElement>("#toggle-inspector")!, owner: workspace },
  bottom: { panel: document.querySelector<HTMLElement>("#bottom-panel")!, toggle: document.querySelector<HTMLButtonElement>("#toggle-bottom")!, owner: document.body },
} as const;

function setPanel(name: keyof typeof panelDefinitions, expanded: boolean) {
  const definition = panelDefinitions[name];
  if (!expanded && definition.panel.contains(document.activeElement)) definition.toggle.focus();
  definition.owner.classList.toggle(`${name}-collapsed`, !expanded);
  definition.toggle.setAttribute("aria-expanded", String(expanded));
  layoutStatus.textContent = `${name} panel ${expanded ? "expanded" : "collapsed"}`;
  editor.layout();
}

for (const [name, definition] of Object.entries(panelDefinitions)) {
  definition.toggle.addEventListener("click", () => setPanel(name as keyof typeof panelDefinitions, definition.toggle.getAttribute("aria-expanded") !== "true"));
}

function keyboardResize(element: HTMLElement, property: "--controls-width" | "--inspector-width", initial: number, minimum: number, maximum: number) {
  let value = initial;
  element.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    value = Math.min(maximum, Math.max(minimum, value + (event.key === "ArrowRight" ? 16 : -16)));
    document.documentElement.style.setProperty(property, `${value}px`);
    element.setAttribute("aria-valuenow", String(value));
    editor.layout();
  });
}

keyboardResize(document.querySelector("#controls-resizer")!, "--controls-width", 240, 180, 420);
keyboardResize(document.querySelector("#inspector-resizer")!, "--inspector-width", 320, 220, 480);

document.addEventListener("keydown", (event) => {
  if (!(event.ctrlKey || event.metaKey)) return;
  if (event.key.toLowerCase() === "j") {
    event.preventDefault();
    panelDefinitions.bottom.toggle.click();
  }
  if (event.shiftKey && event.key.toLowerCase() === "i") {
    event.preventDefault();
    panelDefinitions.inspector.toggle.click();
  }
});

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
function applyMotionPreference() { document.documentElement.dataset.reducedMotion = String(motionQuery.matches); }
applyMotionPreference();
motionQuery.addEventListener("change", applyMotionPreference);

const dropZone = document.querySelector<HTMLElement>("#drop-zone")!;
const previews = document.querySelector<HTMLElement>("#media-previews")!;
function previewFiles(files: readonly File[]) {
  previews.replaceChildren();
  for (const file of files) {
    const url = URL.createObjectURL(file);
    let element: HTMLImageElement | HTMLAudioElement | HTMLVideoElement | undefined;
    if (file.type.startsWith("image/")) {
      element = document.createElement("img");
      element.alt = `Local preview of ${file.name}`;
    } else if (file.type.startsWith("audio/")) {
      element = document.createElement("audio");
      element.controls = true;
      element.setAttribute("aria-label", `Local audio preview of ${file.name}`);
    } else if (file.type.startsWith("video/")) {
      element = document.createElement("video");
      element.controls = true;
      element.muted = true;
      element.setAttribute("aria-label", `Local video preview of ${file.name}`);
    }
    if (!element) { URL.revokeObjectURL(url); continue; }
    element.src = url;
    element.dataset.objectUrl = url;
    previews.append(element);
  }
}

dropZone.addEventListener("dragover", (event) => { event.preventDefault(); });
dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  previewFiles(Array.from(event.dataTransfer?.files ?? []));
});
dropZone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") layoutStatus.textContent = "Choose local media with drag and drop";
});

function stylesheetContains(text: string): boolean {
  try {
    return Array.from(document.styleSheets).some((sheet) => Array.from(sheet.cssRules).some((rule) => rule.cssText.includes(text)));
  } catch { return false; }
}

window.__loomlightRunUiEvidence = async (mode) => {
  setPanel("controls", true); setPanel("inspector", true); setPanel("bottom", true);
  const focusPanel = mode === "narrow" ? panelDefinitions.controls : panelDefinitions.inspector;
  const focusAction = document.querySelector<HTMLButtonElement>(mode === "narrow" ? "#open" : "#inspector-action")!;
  focusAction.focus();
  focusPanel.toggle.click();
  const focusReturned = document.activeElement === focusPanel.toggle;
  focusPanel.toggle.click();

  const resizer = document.querySelector<HTMLElement>("#controls-resizer")!;
  const widthBefore = Number(resizer.getAttribute("aria-valuenow"));
  resizer.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  const widthAfter = Number(resizer.getAttribute("aria-valuenow"));

  document.dispatchEvent(new KeyboardEvent("keydown", { key: "j", ctrlKey: true, bubbles: true }));
  const shortcutCollapsed = panelDefinitions.bottom.toggle.getAttribute("aria-expanded") === "false";
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "j", ctrlKey: true, bubbles: true }));

  const transfer = new DataTransfer();
  transfer.items.add(new File(["<svg xmlns='http://www.w3.org/2000/svg' width='2' height='2'></svg>"], "synthetic.svg", { type: "image/svg+xml" }));
  transfer.items.add(new File([new Uint8Array(44)], "synthetic.wav", { type: "audio/wav" }));
  transfer.items.add(new File([new Uint8Array(4)], "synthetic.webm", { type: "video/webm" }));
  dropZone.dispatchEvent(new DragEvent("drop", { dataTransfer: transfer, bubbles: true, cancelable: true }));
  await new Promise((resolve) => setTimeout(resolve, 20));

  const image = previews.querySelector("img");
  const audio = previews.querySelector("audio");
  const video = previews.querySelector("video");
  const editStarted = performance.now();
  editor.setValue(`${editor.getValue()}# ui evidence\n`);
  editor.focus();
  const editLatencyMs = Math.round((performance.now() - editStarted) * 100) / 100;
  const buttonsNamed = Array.from(document.querySelectorAll("button")).every((button) => Boolean(button.textContent?.trim() || button.getAttribute("aria-label")));
  const narrow = window.innerWidth < 800;
  const responsive = mode === "narrow" ? narrow && getComputedStyle(panelDefinitions.inspector.panel).display === "none" : !narrow && getComputedStyle(panelDefinitions.inspector.panel).display !== "none";
  const result = {
    mode,
    passed: focusReturned && widthAfter === widthBefore + 16 && shortcutCollapsed && previews.children.length === 3
      && Boolean(image?.alt) && Boolean(audio?.controls) && Boolean(video?.controls) && buttonsNamed
      && stylesheetContains("prefers-reduced-motion") && document.documentElement.dataset.reducedMotion === String(motionQuery.matches)
      && responsive && editLatencyMs < 250,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    dockPositions: Array.from(document.querySelectorAll<HTMLElement>("[data-dock]")).map((element) => element.dataset.dock),
    keyboardResize: widthAfter === widthBefore + 16,
    shortcutCollapsed,
    focusReturned,
    labelledButtons: buttonsNamed,
    separators: document.querySelectorAll('[role="separator"][tabindex="0"]').length,
    liveRegions: document.querySelectorAll('[aria-live], [role="status"]').length,
    reducedMotionQuery: motionQuery.matches,
    reducedMotionApplied: document.documentElement.dataset.reducedMotion === String(motionQuery.matches),
    reducedMotionRule: stylesheetContains("prefers-reduced-motion"),
    syntheticFilesHandled: previews.children.length,
    imagePreviewLabelled: Boolean(image?.alt),
    audioPreviewControlled: Boolean(audio?.controls),
    videoPreviewControlled: Boolean(video?.controls),
    audioWav: audio?.canPlayType("audio/wav") ?? "",
    audioMpeg: audio?.canPlayType("audio/mpeg") ?? "",
    videoMp4: video?.canPlayType('video/mp4; codecs="avc1.42E01E"') ?? "",
    videoWebm: video?.canPlayType('video/webm; codecs="vp9, opus"') ?? "",
    responsive,
    editorEditLatencyMs: editLatencyMs,
    screenReaderManualRequired: true,
  };
  for (const element of Array.from(previews.querySelectorAll<HTMLElement>("[data-object-url]"))) URL.revokeObjectURL(element.dataset.objectUrl!);
  return result;
};

window.__loomlightRunGraphEvidence = () => runGraphEvidence(() => {
  const started = performance.now();
  const model = editor.getModel();
  if (!model) throw new Error("Monaco model unavailable");
  model.applyEdits([{ range: new monaco.Range(1, 1, 1, 1), text: "# graph evidence\n" }]);
  editor.layout();
  return Math.round((performance.now() - started) * 100) / 100;
});
