import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
const capture = name => fileURLToPath(new URL(`../../../../.toolchains/design-lab/pages/studio-request/${name}.png`, import.meta.url));

export default async function check({ page, open }) {
  const button = name => page.getByRole("button", { name, exact: true });
  const profile = () => page.getByRole("combobox", { name: "Saved request profile", exact: true });
  const deadline = () => page.getByRole("spinbutton", { name: "Response deadline in seconds", exact: true });
  const send = () => button("Send sample request");
  const waitState = state => page.waitForFunction(value => document.querySelector(".sr-result")?.getAttribute("data-state") === value, state);
  const sampleOutcome = async value => {
    const details = page.locator(".sr-simulation");
    if (!(await details.evaluate(node => node.open))) await details.locator("summary").click();
    await page.getByRole("combobox", { name: "Next sample outcome", exact: true }).selectOption(value);
  };
  for (const variant of ["console", "desk"]) {
    await page.setViewportSize({ width: 1100, height: 720 }); await open({ variant });
    assert.equal(await send().isEnabled(), true);
    const sendIsVisible = () => send().evaluate(node => { const bounds = node.getBoundingClientRect(); return bounds.top >= 0 && bounds.bottom <= innerHeight; });
    assert.equal(await sendIsVisible(), true, "Send stays visible before scrolling");
    assert.equal(await page.locator(".sr-message-text").innerText(), "This is a synthetic Loomlight connection test. Reply with the short text: Loomlight synthetic response. No tools.");
    assert.equal(await page.locator(".sr-shell textarea").count(), 0);
    assert.equal(await page.locator(".sr-request input").count(), 1);
    assert.equal(await page.locator(".sr-profile-details").getAttribute("open"), null);
    await page.locator(".sr-profile-details summary").click();
    assert.match(await page.locator(".sr-budget").innerText(), /Saved context 32,768 · Response reserve 16,384/);
    await page.locator(".sr-profile-details summary").click();
    assert.equal(await page.locator(".sr-safeguards").innerText(), "No project content\nThinking off\nTools off");
    await profile().selectOption("archive"); assert.equal(await send().isDisabled(), true);
    assert.match(await page.locator(".sr-profile-state").innerText(), /disabled/);
    await profile().selectOption("draft"); assert.equal(await send().isDisabled(), true);
    assert.match(await page.locator(".sr-profile-state").innerText(), /credential/);
    await profile().selectOption("writing");
    for (const value of ["", "29", "1801", "30.5"]) {
      await deadline().fill(value); assert.equal(await send().isDisabled(), true);
      assert.equal(await deadline().getAttribute("aria-invalid"), "true");
    }
    await deadline().fill("600"); assert.equal(await send().isEnabled(), true);
    await button("Reload profiles").click(); assert.equal(await send().isDisabled(), true);
    assert.equal(await button("Close panel").isDisabled(), true, "Close waits for the in-progress profile reload");
    await page.waitForFunction(() => document.querySelector(".lp-status")?.textContent?.startsWith("Fictional profiles reloaded"));
    assert.equal(await button("Close panel").isEnabled(), true);
    assert.equal(await page.locator(".sr-result").getAttribute("data-state"), "ready");
    await send().click();
    assert.equal(await profile().isDisabled(), true); assert.equal(await deadline().isDisabled(), true);
    assert.equal(await button("Reload profiles").isDisabled(), true); assert.equal(await button("Cancel request").isEnabled(), true);
    for (const stage of ["checking_model", "loading_model", "sending", "receiving", "validating"]) {
      await page.locator(`.sr-progress [data-stage="${stage}"][aria-current="step"]`).waitFor();
      if (stage === "loading_model") await page.screenshot({ path: capture(`${variant}-loading-light-wide`) });
      if (stage === "receiving") await page.screenshot({ path: capture(`${variant}-receiving-light-wide`) });
    }
    await waitState("completed");
    assert.equal(await page.getByLabel("Sample completion text", { exact: true }).innerText(), "Loomlight synthetic response.");
    assert.match(await page.locator(".sr-result-summary").innerText(), /Finished normally.*Usage reported.*Context verified/s);
    assert.equal(await page.locator(".sr-technical").getAttribute("open"), null);
    await page.locator(".sr-technical summary").click();
    assert.match(await page.locator(".sr-technical-data").innerText(), /32,768 \/ 22,528/);
    assert.match(await page.locator(".sr-technical-data").innerText(), /Input 10 · Output 4 · Total 14/);
    await profile().selectOption("draft");
    assert.match(await page.locator(".sr-result-source").innerText(), /Writing studio/);
    assert.match(await page.locator(".sr-technical-data").innerText(), /tram-writer-32b/);
    await profile().selectOption("writing");
    await page.screenshot({ path: capture(`${variant}-completed-details-light-wide`) });

    for (const [outcome, state] of [["unknown", "completed"], ["refusal", "refused"], ["transport", "failed"], ["expired", "expired"], ["configuration", "configuration"]]) {
      await sampleOutcome(outcome); await send().click(); await waitState(state);
      if (outcome === "unknown") assert.match(await page.locator(".sr-result-summary").innerText(), /Usage unknown/);
      if (state !== "completed") assert.equal(await page.getByLabel("Sample completion text", { exact: true }).isVisible(), false);
      if (state === "configuration") assert.equal(await send().isDisabled(), true);
      await button("Reload profiles").click();
      await page.waitForFunction(() => document.querySelector(".lp-status")?.textContent?.startsWith("Fictional profiles reloaded"));
      assert.equal(await page.locator(".sr-result").getAttribute("data-state"), state);
      assert.equal(await send().isEnabled(), true);
    }
    await sampleOutcome("observation"); await send().click(); await waitState("observation");
    assert.equal(await button("Cancel request").isEnabled(), true); await button("Cancel request").click(); await waitState("cancelled");
    await sampleOutcome("success"); await send().click(); await button("Cancel request").click(); await waitState("cancelled");
    await page.waitForTimeout(800); assert.equal(await page.locator(".sr-result").getAttribute("data-state"), "cancelled");
    await sampleOutcome("cleanup"); await send().click(); await button("Close panel").click(); await waitState("cleanup");
    assert.equal(await page.locator(".sr-layout").isVisible(), true); assert.equal(await button("Cancel request").isEnabled(), true);
    await button("Cancel request").click(); await waitState("cancelled");
    await button("Close panel").click(); assert.equal(await button("Reopen sample panel").isVisible(), true);
    await button("Reopen sample panel").click(); assert.equal(await page.locator(".sr-result").getAttribute("data-state"), "cancelled");
    await sampleOutcome("success"); await send().click(); await button("Close panel").click();
    assert.match(await page.locator(".sr-closed p").innerText(), /cancelled before closing/);

    await open({ variant, state: "empty" }); assert.equal(await send().isDisabled(), true);
    assert.equal(await button("Open profile settings").isVisible(), true);
    await sampleOutcome("success"); await button("Load fictional profiles").click(); assert.equal(await send().isEnabled(), true);
    await open({ variant, state: "error", theme: "dark", viewport: "compact" }); await page.setViewportSize({ width: 560, height: 640 });
    assert.equal(await sendIsVisible(), true, "Compact Send stays visible before scrolling");
    assert.equal(await page.locator(".sr-result").getAttribute("data-state"), "failed");
    await page.locator(".sr-result").scrollIntoViewIfNeeded(); await page.screenshot({ path: capture(`${variant}-error-dark-compact`) });
    await send().click(); await page.locator('.sr-progress [data-stage="receiving"][aria-current="step"]').waitFor();
    assert.equal(await button("Cancel request").evaluate(node => { const bounds = node.getBoundingClientRect(); return bounds.top >= 0 && bounds.bottom <= innerHeight; }), true, "Compact Cancel stays visible during progress");
    await page.locator(".sr-result").scrollIntoViewIfNeeded(); await page.screenshot({ path: capture(`${variant}-receiving-dark-compact`) });
    await waitState("completed"); await page.locator(".sr-result").scrollIntoViewIfNeeded();
    await page.screenshot({ path: capture(`${variant}-completed-dark-compact`) });
    await page.locator(".sr-technical summary").click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await open({ variant, state: "long", theme: "dark", viewport: "compact" });
    await page.locator(".sr-result").scrollIntoViewIfNeeded(); await page.screenshot({ path: capture(`${variant}-long-dark-compact`) });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  }
}
