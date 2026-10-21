import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

export default async function check({ page, open }) {
  for (const variant of ["desk", "console"]) {
    const load = async (options = {}) => {
      await page.setViewportSize(options.viewport === "compact" ? { width: 560, height: 640 } : { width: 1100, height: 720 });
      await open({ screen: "runtime", variant, ...options });
    };
    const button = name => page.getByRole("button", { name, exact: true });
    const phase = value => page.locator(`.rt-workspace[data-phase="${value}"]`).waitFor();
    const conditions = async (outcome = "success", flags = {}) => {
      await button("Sample conditions").click();
      await page.getByRole("combobox", { name: "Next sample result", exact: true }).selectOption(outcome);
      for (const [name, value] of Object.entries(flags)) await page.getByRole("checkbox", { name, exact: true }).setChecked(value);
      await button("Apply sample conditions").click();
      await page.getByRole("dialog").waitFor({ state: "hidden" });
    };
    const trust = async () => {
      const dialog = page.getByRole("dialog", { name: "Allow project execution?", exact: true }); await dialog.waitFor();
      assert.match(await dialog.innerText(), /project Python with your user privileges/);
      assert.match(await dialog.innerText(), /not a sandbox/);
      assert.equal(await button("Cancel").evaluate(e => e === document.activeElement), true);
      await button("Trust for this sample session and continue").click();
    };
    const maintenance = async () => {
      if (!(await page.getByRole("region", { name: "SDK and execution maintenance" }).isVisible())) await button("SDK & execution").click();
    };
    const capture = async name => {
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.screenshot({ path: fileURLToPath(new URL(`../../../../.toolchains/design-lab/pages/runtime/${variant}-${name}.png`, import.meta.url)) });
    };

    await load();
    assert.equal(await button("Stop").isDisabled(), true);
    assert.equal(await page.locator('.rt-workspace[data-phase="idle"]').count(), 1);
    await button("Story preview").click(); assert.match(await page.getByRole("dialog").innerText(), /does not execute/); await button("Back to runtime").click();
    await button("Run Game").click(); await page.getByRole("dialog", { name: "Allow project execution?" }).waitFor();
    await capture("trust-light-wide");
    await page.keyboard.press("Escape"); await phase("idle"); assert.equal(await button("Stop").isDisabled(), true);
    await button("Run Game").click(); await trust(); await phase("running");
    await capture("running-light-wide");
    assert.equal(await button("Run Game").isDisabled(), true); assert.equal(await button("Validate").isDisabled(), true);
    await button("Story preview").click(); await button("Back to runtime").click(); await phase("running");
    await page.getByRole("button", { name: "Story", exact: true }).click();
    await page.getByRole("dialog", { name: "Stop before leaving?" }).waitFor(); await button("Keep running").click(); await phase("running");
    await button("Stop").click(); await phase("stopped");
    await button("Validate").click(); await phase("validating"); assert.match(await page.locator(".rt-retained").innerText(), /previous operation/); await phase("finished");
    assert.match(await page.locator(".rt-evidence").innerText(), /Previous validation/);
    await button("Errors 0").click(); assert.match(await page.locator(".rt-empty").innerText(), /No findings in this filter/); await button("All 2").click();
    await button("Open source location").click(); assert.match(await page.getByRole("dialog").innerText(), /read-only fictional source target/); await button("Back to diagnostics").click();
    await conditions("success", { "Diagnostic locations are stale": true });
    await button("Open source location").click(); assert.match(await page.locator(".rt-alert").innerText(), /No source selection changed/);
    await conditions("success", { "Unsaved Source draft": true });
    await button("Run Game").click(); await button("Cancel").click(); assert.match(await page.locator(".lp-status").innerText(), /Drafts retained/);
    await button("Run Game").click(); await button("Use saved revision").click(); await phase("running");
    await page.locator('.rt-disclosure summary').filter({ hasText: /^Launch details$/ }).click(); assert.match(await page.locator(".rt-evidence").innerText(), /earlier revision/);
    assert.match(await page.locator(".rt-readiness").innerText(), /1 Source draft/); await button("Stop").click(); await phase("stopped");
    await conditions("saveFailure"); await button("Run Game").click(); await button("Save All and continue").click(); assert.match(await page.locator(".rt-alert").innerText(), /drafts are retained/);
    await conditions("success", { "Pending Scene form": true }); await button("Run Game").click(); await button("Return to Scene Commit").click();
    await button("Commit sample Scene form").click(); assert.match(await page.locator(".lp-status").innerText(), /Choose Run or Validate again/);
    await button("Run Game").click(); await button("Save All and continue").click(); await phase("running"); await button("Stop").click(); await phase("stopped");

    await maintenance(); await button("Inspect trust").click(); assert.match(await page.getByRole("dialog").innerText(), /Inspected inputs/); await button("Close").click();
    await button("Revoke trust").click(); assert.equal(await button("Inspect trust").isDisabled(), true);
    await button("Choose SDK…").click(); await button("Older SDK folder · 8.4.1").click(); assert.match(await page.locator(".rt-alert").innerText(), /previous SDK selection is retained/);
    await conditions("selectionFailure"); await button("Choose SDK…").click(); await button("Selected SDK folder · 8.5.3").click(); assert.match(await page.locator(".rt-alert").innerText(), /could not be verified/);
    await conditions(); await button("Choose SDK…").click(); await button("Selected SDK folder · 8.5.3").click(); assert.match(await page.locator(".lp-status").innerText(), /Choose Run or Validate/);
    await button("Reinstall pinned SDK").click(); await button("Start sample installation").click(); await button("Cancel").click(); assert.match(await page.locator(".lp-status").innerText(), /cancelled/);
    await conditions("checksumFailure"); await button("Reinstall pinned SDK").click(); await button("Start sample installation").click();
    await page.getByText("Checksum mismatch. Extraction did not start. Previous SDK selection retained.", { exact: true }).waitFor();
    await capture("sdk-failure-light-wide"); await button("Close").click();
    await conditions(); await button("Reinstall pinned SDK").click(); await button("Start sample installation").click();
    await page.getByRole("dialog").waitFor({ state: "hidden" }); assert.match(await page.locator(".lp-status").innerText(), /No project executed/);
    await conditions("success", { "Controlled play helper absent": true });
    await button("Run Game").click(); assert.match(await page.locator(".rt-alert").innerText(), /Enable controlled play before Run/);
    await button("Enable controlled play").click(); await button("Cancel").click();
    await button("Enable controlled play").click(); await button("Add controlled play helper").click(); assert.equal(await button("Controlled play enabled").isDisabled(), true);

    await load({ state: "error", theme: "dark", viewport: "compact" });
    assert.equal(await button("Stop").isDisabled(), false); await capture("cleanup-dark-compact");
    await conditions("cleanupFailure"); await button("Stop").click(); await phase("cleanupFailed"); assert.match(await page.locator(".rt-alert").innerText(), /Ownership is retained/);
    await conditions(); await button("Stop").click(); await phase("stopped");
    await maintenance(); await button("Revoke trust").click();
    await conditions("runtimeError"); await button("Run Game").click(); await trust(); await phase("failed"); assert.match(await page.locator(".rt-core").innerText(), /Exit 0 does not override/);
    await capture("runtime-error-dark-compact");
    await button("SDK & execution").click(); await button("SDK & execution").click();
    await button("Revoke trust").click(); await conditions("timeout"); await button("Validate").click(); await trust(); await phase("timedOut");
    await conditions("success", { "Execution inputs changed externally": true });
    await button("Validate").click(); await trust(); await phase("finished");
    await load({ state: "long", theme: "dark", viewport: "compact" });
    await page.locator('.rt-disclosure summary').filter({ hasText: /^Process output$/ }).click(); assert.match(await page.locator(".rt-output").first().innerText(), /Output truncated/); await capture("long-dark-compact");
    await load({ state: "empty" }); await button("Run Game").click(); assert.match(await page.locator(".rt-alert").innerText(), /unavailable/); assert.equal(await page.locator(".rt-empty").isVisible(), true);
    await load();
  }
}
