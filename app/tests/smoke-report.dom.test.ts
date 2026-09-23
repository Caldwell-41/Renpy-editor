import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { Window } from "happy-dom";
import type { CoreResponse } from "../src/protocol.js";

// Execute the shipped probe unchanged, with the real shell/UI and its own fake
// authoring requester. Only the desktop/security boundary is stubbed: this is not
// native keyboard, WebView security, or packaged acceptance evidence.
const probe = await readFile(new URL("../../src-tauri/src/smoke_probe.js", import.meta.url), "utf8");

test("packaged probe constructs exactly one truthful final report", async (t) => {
  for (const scenario of ["success", "authoring-failure", "incomplete-trace"] as const) {
    await t.test(scenario, async () => {
      const browser = new Window({ url: "http://tauri.localhost" });
      browser.document.body.innerHTML = '<div id="app"></div>';
      Object.defineProperty(browser.navigator, "platform", { value: "Win32" });
      Object.assign(globalThis, {
        window: browser, document: browser.document,
        HTMLElement: browser.HTMLElement, HTMLInputElement: browser.HTMLInputElement,
        HTMLSelectElement: browser.HTMLSelectElement, HTMLTextAreaElement: browser.HTMLTextAreaElement,
        Event: browser.Event, KeyboardEvent: browser.KeyboardEvent,
      });
      Object.assign(browser, { __loomlightScaffoldSmokeMode: true });
      // Fresh shell module/root/listener state for each isolated window.
      const { startApplication } = await import(`../src/main.js?smoke-report=${scenario}`);
      startApplication(async <T>(): Promise<CoreResponse<T>> => ({
        protocolVersion: 1, requestId: "test", ok: true, value: [] as T,
      }));
      const shell = browser as unknown as globalThis.Window;
      const order: string[] = [];
      const reports: Record<string, unknown>[] = [];
      let runProbe: (() => Promise<void>) | undefined;
      const invoke = async (command: string, args: { request?: { operation: string; payload: Record<string, unknown> } }) => {
        if (command !== "core_request") throw new Error("Denied desktop command stub");
        const request = args.request!;
        if (request.operation === "system.health") {
          return Object.keys(request.payload).length === 0
            ? { ok: true, value: { status: "ready" } }
            : { ok: false, error: { code: "INVALID_PAYLOAD" } };
        }
        if (request.operation === "probe.smokeCheckpoint") {
          const stage = String(request.payload.stage);
          order.push(stage);
          return { ok: !(scenario === "authoring-failure" && stage === "pre-source-complete") };
        }
        assert.equal(request.operation, "probe.smokeReport");
        order.push("report");
        reports.push(request.payload);
        // Model acceptance versus rejection; retain every attempted report.
        return { ok: scenario === "success" };
      };
      const probeWindow = {
        __TAURI_INTERNALS__: { invoke },
        __loomlightUnauthorisedDenied: true,
        __loomlightInstallSmokeRequester(requester: Parameters<NonNullable<typeof shell.__loomlightInstallSmokeRequester>>[0]) {
          const restore = shell.__loomlightInstallSmokeRequester!(requester);
          return () => { restore(); order.push("restore-requester"); };
        },
        __loomlightReadSaveTrace: () => shell.__loomlightReadSaveTrace!()
          .filter((entry) => scenario !== "incomplete-trace" || !entry.includes("phase=accepted")),
        dispatchEvent: browser.dispatchEvent.bind(browser),
        open: () => null,
      };
      try {
        runInNewContext(probe, {
          window: probeWindow, document: browser.document, navigator: browser.navigator,
          localStorage: browser.localStorage, sessionStorage: browser.sessionStorage,
          Event: browser.Event, KeyboardEvent: browser.KeyboardEvent,
          MessageChannel, performance, crypto,
          fetch: async () => { throw new Error("Denied network stub"); },
          setTimeout: (callback: () => Promise<void>) => { runProbe = callback; },
        }, { filename: "smoke_probe.js" });
        assert.ok(runProbe);
        if (scenario === "success") await runProbe();
        else await assert.rejects(runProbe(), /Smoke report was rejected\./);
        assert.equal(reports.length, 1);
        const report = reports[0]!;
        assert.deepEqual(order.slice(-3), ["restore-requester", "final-report-start", "report"]);
        assert.equal(report.supportingAuthoringUiPassed, true);
        if (scenario === "authoring-failure") {
          assert.equal(report.sceneAuthoringUiPassed, false);
          assert.equal(report.sourceAuthoringUiPassed, false);
          assert.equal(report.sourceCommandTracePassed, false);
          assert.match(String(report.sceneAuthoringStage), /Smoke checkpoint was rejected: pre-source-complete/);
          assert.equal(report.sourceAuthoringStage, "not-started");
          assert.match(String(report.sourceCommandTrace), /^\|shell=/);
        } else {
          assert.equal(report.sceneAuthoringUiPassed, true);
          assert.equal(report.sourceAuthoringUiPassed, true);
          assert.equal(report.sourceAuthoringStage, "complete");
          assert.equal(report.sourceCommandTracePassed, scenario === "success");
          assert.match(String(report.sourceCommandTrace), /button:source:generation-current:completed:saves=1:flushes=0:saved/);
          assert.deepEqual(order, ["pre-source-complete", "source-complete", "post-source-recovery-complete",
            "post-source-conflict-complete", "restore-requester", "final-report-start", "report"]);
        }
      } finally {
        await browser.happyDOM.close();
      }
    });
  }
});
