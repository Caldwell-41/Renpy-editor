import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import type { DesktopRequest, FileVersion } from "../shared/contracts";

declare global {
  interface Window {
    loomlight?: { invoke(request: DesktopRequest): Promise<unknown>; subscribe(listener: (event: unknown) => void): () => void };
    __TAURI_INTERNALS__?: unknown;
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
