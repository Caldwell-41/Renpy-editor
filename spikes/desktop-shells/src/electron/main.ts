import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from "electron";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MockSdkRuns, readText, watchText, writeTextAtomic } from "../shared/node-adapter.js";
import { validateRequest } from "../shared/contracts.js";
import type { FSWatcher } from "node:fs";

const here = path.dirname(fileURLToPath(import.meta.url));
const runs = new MockSdkRuns();
const watchers = new Map<string, FSWatcher>();

function trusted(event: IpcMainInvokeEvent): void {
  const expected = pathToFileURL(path.resolve(here, "../../ui/index.html")).href;
  if (!event.senderFrame || event.senderFrame.url !== expected) throw new Error("untrusted IPC sender");
}

ipcMain.handle("loomlight:invoke", async (event, raw: unknown) => {
  trusted(event);
  const request = validateRequest(raw);
  if (request.operation === "readText") return readText(request.root, request.relativePath);
  if (request.operation === "writeTextAtomic") {
    return writeTextAtomic(request.root, request.relativePath, request.expectedSha256, request.contents);
  }
  if (request.operation === "watchText") {
    const key = `${request.root}\0${request.relativePath}`;
    watchers.get(key)?.close();
    watchers.set(key, await watchText(request.root, request.relativePath, () => event.sender.send("loomlight:event", {
      type: "fileChanged",
      relativePath: request.relativePath,
    })));
    return { watching: true };
  }
  if (request.operation === "unwatchText") {
    const key = `${request.root}\0${request.relativePath}`;
    const existing = watchers.get(key);
    existing?.close();
    watchers.delete(key);
    return { watching: false };
  }
  if (request.operation === "startMockSdk") {
    return { runId: runs.start(request, (message) => event.sender.send("loomlight:event", message)) };
  }
  if (request.operation === "cancelMockSdk") return { cancelled: runs.cancel(request.runId) };
  throw new Error("operation is not implemented");
});

function createWindow() {
  let deniedNavigations = 0;
  const win = new BrowserWindow({
    width: 1180,
    height: 760,
    show: false,
    webPreferences: {
      preload: path.join(here, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.webContents.setWindowOpenHandler(() => { deniedNavigations += 1; return { action: "deny" }; });
  win.webContents.on("will-navigate", (event) => { deniedNavigations += 1; event.preventDefault(); });
  void win.loadFile(path.resolve(here, "../../ui/index.html"));
  win.once("ready-to-show", () => win.show());
  win.webContents.once("did-finish-load", async () => {
    if (process.env.LOOMLIGHT_SPIKE_SMOKE !== "1") return;
    const result = await win.webContents.executeJavaScript(`(async () => ({
      nodeGlobalsDenied: typeof process === "undefined" && typeof require === "undefined",
      bridgeFrozen: Object.isFrozen(window.loomlight) && Object.keys(window.loomlight).sort().join(",") === "invoke,subscribe",
      unknownIpcDenied: await window.loomlight.invoke({ operation: "shell", command: "arbitrary" }).then(() => false, () => true),
      traversalDenied: await window.loomlight.invoke({ operation: "readText", root: "/", relativePath: "../secret" }).then(() => false, () => true),
      networkDenied: await fetch("https://example.invalid/loomlight-probe").then(() => false, () => true),
      popupDenied: window.open("https://example.invalid/loomlight-popup") === null,
    }))()`);
    win.webContents.executeJavaScript(`location.href = "https://example.invalid/loomlight-navigation"`);
    setTimeout(() => {
      const passed = Object.values(result).every(Boolean) && deniedNavigations >= 2 && win.webContents.getURL().startsWith("file:");
      console.log(JSON.stringify({ evidence: "electron-packaged-denial", ...result, navigationDenied: deniedNavigations >= 2 }));
      app.exit(passed ? 0 : 1);
    }, 250);
  });
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => watchers.forEach((watcher) => watcher.close()));
