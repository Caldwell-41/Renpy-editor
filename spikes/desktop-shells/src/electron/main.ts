import { app, BrowserWindow, ipcMain, safeStorage, type IpcMainInvokeEvent } from "electron";
import { access, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MockSdkRuns, readText, watchText, writeTextAtomic } from "../shared/node-adapter.js";
import { validateRequest } from "../shared/contracts.js";
import type { FSWatcher } from "node:fs";

const here = path.dirname(fileURLToPath(import.meta.url));
const runs = new MockSdkRuns();
const watchers = new Map<string, FSWatcher>();

async function packagedCredentialProbe(): Promise<void> {
  const secret = process.env.LOOMLIGHT_SPIKE_CREDENTIAL_SECRET;
  let directory: string | undefined;
  let passed = false;
  let result: Record<string, unknown> = {
    evidence: "electron-packaged-credential",
    passed: false,
    provider: process.platform === "darwin" ? "keychain-key" : "dpapi-key",
    rendererCreated: false,
  };
  try {
    if (!secret || secret.length < 24) throw new Error("synthetic credential unavailable");
    const encryptionAvailable = await safeStorage.isAsyncEncryptionAvailable();
    if (!encryptionAvailable) throw new Error("native encryption unavailable");
    directory = await mkdtemp(path.join(tmpdir(), "loomlight-credential-probe-"));
    const encryptedPath = path.join(directory, "credential.bin");
    const encrypted = await safeStorage.encryptStringAsync(secret);
    const ciphertextOpaque = !encrypted.includes(Buffer.from(secret, "utf8"));
    await writeFile(encryptedPath, encrypted);
    const persisted = await readFile(encryptedPath);
    const decrypted = await safeStorage.decryptStringAsync(persisted);
    const roundTrip = decrypted.result === secret;
    encrypted.fill(0);
    persisted.fill(0);
    await rm(directory, { recursive: true, force: true });
    const cleaned = await access(directory).then(() => false, () => true);
    passed = encryptionAvailable && ciphertextOpaque && roundTrip && cleaned;
    result = {
      evidence: "electron-packaged-credential",
      passed,
      provider: process.platform === "darwin" ? "keychain-key" : "dpapi-key",
      encryptionAvailable,
      ciphertextOpaque,
      roundTrip,
      shouldReEncrypt: decrypted.shouldReEncrypt,
      cleaned,
      rendererCreated: false,
    };
  } catch {
    result = { ...result, error: "native credential probe failed" };
  } finally {
    if (directory) await rm(directory, { recursive: true, force: true });
    delete process.env.LOOMLIGHT_SPIKE_CREDENTIAL_SECRET;
  }
  process.stdout.write(`${JSON.stringify(result)}\n`, () => app.exit(passed ? 0 : 1));
}

function trusted(event: IpcMainInvokeEvent): void {
  const expected = pathToFileURL(path.resolve(here, "../../ui/index.html")).href;
  if (!event.senderFrame || event.senderFrame.url !== expected) throw new Error("untrusted IPC sender");
}

ipcMain.handle("loomlight:invoke", async (event, raw: unknown) => {
  try {
    trusted(event);
    const request = validateRequest(raw);
    if (request.operation === "readText") return { ok: true, value: await readText(request.root, request.relativePath) };
    if (request.operation === "writeTextAtomic") {
      return { ok: true, value: await writeTextAtomic(request.root, request.relativePath, request.expectedSha256, request.contents) };
    }
    if (request.operation === "watchText") {
      const key = `${request.root}\0${request.relativePath}`;
      watchers.get(key)?.close();
      watchers.set(key, await watchText(request.root, request.relativePath, () => event.sender.send("loomlight:event", {
        type: "fileChanged",
        relativePath: request.relativePath,
      })));
      return { ok: true, value: { watching: true } };
    }
    if (request.operation === "unwatchText") {
      const key = `${request.root}\0${request.relativePath}`;
      const existing = watchers.get(key);
      existing?.close();
      watchers.delete(key);
      return { ok: true, value: { watching: false } };
    }
    if (request.operation === "startMockSdk") {
      return { ok: true, value: { runId: runs.start(request, (message) => event.sender.send("loomlight:event", message)) } };
    }
    if (request.operation === "cancelMockSdk") return { ok: true, value: { cancelled: runs.cancel(request.runId) } };
    return { ok: false, error: "desktop operation denied" };
  } catch {
    // Expected denials are data, not thrown IPC errors whose Electron stack trace
    // would expose the packaged application or runner path in process logs.
    return { ok: false, error: "desktop operation denied" };
  }
});

async function packagedFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "loomlight-electron-project space ü-"));
  const outside = await mkdtemp(path.join(tmpdir(), "loomlight-electron-outside-"));
  const deep = Array.from({ length: 24 }, (_, index) => `deep-${index}`);
  const relativePath = ["game space", "日本語", ...deep, "scene ü.rpy"].join("/");
  const target = path.join(root, ...relativePath.split("/"));
  const outsideFile = path.join(outside, "private.rpy");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, "label start:\n    return\n", "utf8");
  await writeFile(outsideFile, "private fixture\n", "utf8");
  await symlink(outsideFile, path.join(root, "game space", "escape-link.rpy"));
  return { root, outside, relativePath, target };
}

function createWindow() {
  let deniedNavigations = 0;
  const uiProbeMode = process.env.LOOMLIGHT_SPIKE_UI_PROBE;
  const uiProbeNarrow = uiProbeMode === "narrow";
  const win = new BrowserWindow({
    width: uiProbeNarrow ? 720 : 1180,
    height: uiProbeNarrow ? 600 : 760,
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
    if (uiProbeMode === "wide" || uiProbeMode === "narrow") {
      try {
        const mode = JSON.stringify(uiProbeMode);
        const result = await win.webContents.executeJavaScript(`(async () => {
          for (let attempt = 0; attempt < 100 && !window.__loomlightRunUiEvidence; attempt += 1) {
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
          if (!window.__loomlightRunUiEvidence) throw new Error("UI probe unavailable");
          return window.__loomlightRunUiEvidence(${mode});
        })()`);
        console.log(JSON.stringify({ evidence: "electron-packaged-ui", ...result }));
        app.exit(result.passed ? 0 : 1);
      } catch {
        console.error(JSON.stringify({ evidence: "electron-packaged-ui", mode: uiProbeMode, passed: false, error: "probe failed" }));
        app.exit(1);
      }
      return;
    }
    if (process.env.LOOMLIGHT_SPIKE_SMOKE !== "1") return;
    let fixture: Awaited<ReturnType<typeof packagedFixture>> | undefined;
    try {
      fixture = await packagedFixture();
      const syntheticSecret = "loomlight-synthetic-secret-value";
      process.env.LOOMLIGHT_SPIKE_SYNTHETIC_SECRET = syntheticSecret;
      const input = JSON.stringify({ root: fixture.root, relativePath: fixture.relativePath, syntheticSecret });
      const result = await win.webContents.executeJavaScript(`(async () => {
        const input = ${input};
        const observations = [];
        const stop = window.loomlight.subscribe((event) => observations.push({ event, at: performance.now() }));
        const before = await window.loomlight.invoke({ operation: "readText", ...input });
        const after = await window.loomlight.invoke({ operation: "writeTextAtomic", ...input, expectedSha256: before.sha256, contents: before.contents + "# updated\\n" });
        const staleDenied = await window.loomlight.invoke({ operation: "writeTextAtomic", ...input, expectedSha256: before.sha256, contents: "overwrite\\n" }).then(() => false, () => true);
        const missingError = await window.loomlight.invoke({ operation: "readText", root: input.root, relativePath: "game space/missing.rpy" }).then(() => "", (error) => String(error));
        const symlinkDenied = await window.loomlight.invoke({ operation: "readText", root: input.root, relativePath: "game space/escape-link.rpy" }).then(() => false, () => true);
        const processEvents = [];
        const processStop = window.loomlight.subscribe((event) => processEvents.push(event));
        const processRunId = (await window.loomlight.invoke({ operation: "startMockSdk", command: "stderr", args: [input.root, input.syntheticSecret], timeoutMs: 1000 })).runId;
        await new Promise((resolve, reject) => {
          const guard = setTimeout(() => reject(new Error("packaged process probe timed out")), 5000);
          const poll = setInterval(() => {
            if (processEvents.some((event) => event && event.runId === processRunId && event.type === "terminal")) {
              clearTimeout(guard); clearInterval(poll); resolve();
            }
          }, 10);
        });
        processStop();
        const processOutput = processEvents.filter((event) => event && event.runId === processRunId).map((event) => event.text || "").join("");
        const watchStarted = performance.now();
        await window.loomlight.invoke({ operation: "watchText", ...input });
        window.__loomlightPackagedProbe = { observations, stop, watchStarted };
        return {
          nodeGlobalsDenied: typeof process === "undefined" && typeof require === "undefined",
          bridgeFrozen: Object.isFrozen(window.loomlight) && Object.keys(window.loomlight).sort().join(",") === "invoke,subscribe",
          unknownIpcDenied: await window.loomlight.invoke({ operation: "shell", command: "arbitrary" }).then(() => false, () => true),
          arbitraryProcessDenied: await window.loomlight.invoke({ operation: "startMockSdk", command: "shell", args: [], timeoutMs: 1000 }).then(() => false, () => true),
          traversalDenied: await window.loomlight.invoke({ operation: "readText", root: input.root, relativePath: "../secret" }).then(() => false, () => true),
          networkDenied: await fetch("https://example.invalid/loomlight-probe").then(() => false, () => true),
          popupDenied: window.open("https://example.invalid/loomlight-popup") === null,
          read: before.contents.includes("label start"), atomicReplace: after.contents.endsWith("# updated\\n"),
          staleDenied, missingErrorRedacted: !missingError.includes(input.root), symlinkDenied,
          sensitiveRedacted: !processOutput.includes(input.root) && !processOutput.includes(input.syntheticSecret) && processOutput.includes("REDACTED"),
        };
      })()`);
      await writeFile(fixture.target, "external edit\n", "utf8");
      await new Promise((resolve) => setTimeout(resolve, 200));
      const watch = await win.webContents.executeJavaScript(`(() => {
        const probe = window.__loomlightPackagedProbe;
        probe.stop();
        const changes = probe.observations.filter((item) => item.event && item.event.type === "fileChanged");
        return { watchEvents: changes.length, watchLatencyMs: changes.length ? Math.round(changes[0].at - probe.watchStarted) : null };
      })()`);
      win.webContents.executeJavaScript(`location.href = "https://example.invalid/loomlight-navigation"`);
      await new Promise((resolve) => setTimeout(resolve, 250));
      const entries = await readdir(path.dirname(fixture.target));
      const filesystem = {
        ...watch,
        sameDirectoryReplacement: entries.every((entry) => !entry.endsWith(".tmp")),
        pathLengthChars: fixture.target.length,
        pathCases: ["spaces", "unicode", "long", "deep"],
      };
      const navigationDenied = deniedNavigations >= 2 && win.webContents.getURL().startsWith("file:");
      const passed = Object.values(result).every(Boolean) && navigationDenied && watch.watchEvents >= 1 && filesystem.sameDirectoryReplacement;
      console.log(JSON.stringify({ evidence: "electron-packaged-security-filesystem", ...result, ...filesystem, navigationDenied }));
      app.exit(passed ? 0 : 1);
    } catch {
      console.error(JSON.stringify({ evidence: "electron-packaged-security-filesystem", passed: false, error: "probe failed" }));
      app.exit(1);
    } finally {
      delete process.env.LOOMLIGHT_SPIKE_SYNTHETIC_SECRET;
      if (fixture) {
        await rm(fixture.root, { recursive: true, force: true });
        await rm(fixture.outside, { recursive: true, force: true });
      }
    }
  });
}

app.whenReady().then(() => {
  if (process.env.LOOMLIGHT_SPIKE_CREDENTIAL_PROBE === "1") {
    void packagedCredentialProbe();
  } else {
    createWindow();
  }
});
app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => watchers.forEach((watcher) => watcher.close()));
