import assert from "node:assert/strict";

// Tests the fictional workflow, not production writes, image decoding or SDK geometry.
export default async function check({ page, open }) {
  await (await import("./refined-check.mjs")).default({ page, open });
  for (const variant of ["inspector", "browser", "guided"]) {
    await page.setViewportSize({ width: 1100, height: 720 });
    await open({ variant, state: "placed", theme: "dark" });
    const size = async () => { if (variant === "guided") await page.getByRole("button", { name: "2  Size", exact: true }).click(); };
    await size();
    const width = page.getByRole("textbox", { name: "Width", exact: true });
    const height = page.getByRole("textbox", { name: "Height", exact: true });
    const apply = page.getByRole("button", { name: "Apply image", exact: true });
    const undo = page.getByRole("button", { name: "Undo", exact: true });
    const redo = page.getByRole("button", { name: "Redo", exact: true });
    await apply.click(); assert.equal(await undo.isDisabled(), true, "No-op adds no history");
    await width.fill("400"); assert.equal(await height.inputValue(), "225", "Aspect ratio follows original");
    await page.getByRole("main").getByRole("button", { name: "Source", exact: true }).click();
    assert.match(await page.getByLabel("Accepted sample source", { exact: true }).textContent(), /xsize 320/);
    await page.getByRole("button", { name: "Back to image", exact: true }).click(); await size();
    assert.equal(await width.inputValue(), "400", "Source retains draft");
    await width.press("Enter"); await size(); assert.equal(await width.inputValue(), "400");
    await undo.click(); await size(); assert.equal(await width.inputValue(), "320");
    await redo.click(); await size(); assert.equal(await width.inputValue(), "400");
    await width.fill("-1"); await apply.click();
    assert.match(await page.getByRole("alert").innerText(), /Width needs a whole number/);
    assert.equal(await width.inputValue(), "-1"); await width.press("Escape"); await size();
    assert.equal(await width.inputValue(), "400");
    await page.getByRole("checkbox", { name: "Preserve aspect ratio", exact: true }).uncheck();
    await height.fill("300"); assert.equal(await width.inputValue(), "400"); await apply.click(); await size();
    await width.fill("480");
    await page.getByRole("button", { name: "1  Choose", exact: true }).click();
    await page.getByRole("button", { name: "Help text", exact: true }).click();
    await page.getByRole("button", { name: "Return to image", exact: true }).click(); await size();
    assert.equal(await width.inputValue(), "480", "Selection retains draft");
    // Opening and cancelling import must retain pending size values.
    if (variant === "browser") await page.getByRole("button", { name: "Import image…", exact: true }).click();
    else { if (variant === "guided") await page.getByRole("button", { name: "1  Image", exact: true }).click(); await page.getByRole("button", { name: "Change image…", exact: true }).click(); await page.locator("dialog[open]").getByRole("button", { name: "Import image…", exact: true }).click(); }
    await page.getByRole("button", { name: "Simulate file picker Cancel", exact: true }).click(); await size();
    assert.equal(await width.inputValue(), "480", "Import cancellation retains draft");
    const importAgain = async () => {
      if (variant === "browser") await page.getByRole("button", { name: "Import image…", exact: true }).click();
      else { if (variant === "guided") await page.getByRole("button", { name: "1  Image", exact: true }).click(); await page.getByRole("button", { name: "Change image…", exact: true }).click(); await page.locator("dialog[open]").getByRole("button", { name: "Import image…", exact: true }).click(); }
    };
    await importAgain();
    await page.getByRole("button", { name: "Choose sample file…", exact: true }).click();
    await page.getByRole("textbox", { name: "Display name", exact: true }).fill("Station seal draft");
    await page.getByRole("button", { name: "Cancel import", exact: true }).click(); await size();
    assert.equal(await width.inputValue(), "480", "Staged import cancellation retains draft");
    await importAgain(); await page.getByRole("button", { name: "Choose sample file…", exact: true }).click();
    await page.getByRole("button", { name: "Import and select", exact: true }).click(); await size();
    assert.equal(await width.inputValue(), "480"); assert.equal(await height.inputValue(), "300", "Unlocked import preserves both dimensions");
    await apply.click();
    await page.getByRole("main").getByRole("button", { name: "Source", exact: true }).click();
    assert.match(await page.getByLabel("Accepted sample source", { exact: true }).textContent(), /station_seal.png/);
    await page.getByRole("button", { name: "Back to image", exact: true }).click();

    for (const state of ["missing", "replaced", "invalid", "conflict"]) {
      await open({ variant, state, theme: "dark" }); await size();
      await width.fill("500"); await apply.click();
      const message = await page.getByRole("alert").innerText();
      assert.match(message, state === "missing" ? /missing/ : state === "replaced" ? /replaced/ : state === "invalid" ? /decodable/ : /Source changed/);
      assert.equal(await width.inputValue(), "500", `${state} retains draft`);
      assert.equal(await undo.isDisabled(), true, `${state} accepts no history`);
    }
    // Add, including a simulated import, produces an ordinary sample source node.
    await open({ variant, state: "add", theme: "dark" });
    if (variant === "browser") await page.getByRole("button", { name: "Use Night ticket", exact: true }).click();
    else { await page.getByRole("button", { name: "Choose image…", exact: true }).click(); await page.getByRole("button", { name: "Use Night ticket", exact: true }).click(); }
    await size(); assert.equal(await height.inputValue(), "128");
    await page.getByRole("button", { name: "Add image", exact: true }).click();
    await page.getByRole("main").getByRole("button", { name: "Source", exact: true }).click();
    assert.match(await page.getByLabel("Accepted sample source", { exact: true }).textContent(), /add "assets\/ui\/night_ticket.webp"/);
    await page.getByRole("button", { name: "Back to image", exact: true }).click();
    await page.getByText("Prototype state", { exact: true }).click();
    await page.getByRole("button", { name: "Simulate reopen", exact: true }).click();
    assert.match(await page.locator(".lp-status").textContent(), /Reopened accepted image/);
    await undo.click(); assert.equal(await page.getByRole("button", { name: "Select image on canvas", exact: true }).count(), 0);
    await redo.click(); assert.equal(await page.getByRole("button", { name: "Select image on canvas", exact: true }).count(), 1);
  }
}
