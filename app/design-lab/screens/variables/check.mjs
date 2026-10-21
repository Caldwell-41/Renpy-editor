import assert from "node:assert/strict";

export default async function check({ page, open }) {
  const close = async variant => {
    await page.getByRole("button", { name: variant === "ledger" ? "Close editor" : "All variables", exact: true }).click();
  };
  for (const variant of ["ledger", "notebook"]) {
    await page.setViewportSize({ width: 1100, height: 720 });
    await open({ variant });
    if (variant === "ledger") await close(variant);
    await page.getByRole("searchbox", { name: "Search variables" }).fill("ada");
    assert.equal(await page.locator("[data-variable]").count(), 2);
    await page.getByRole("combobox", { name: "Filter by type" }).selectOption("int");
    assert.equal(await page.locator("[data-variable]").count(), 1);
    await page.getByRole("searchbox", { name: "Search variables" }).fill("no_match");
    await page.getByRole("button", { name: "Clear filters", exact: true }).click();
    assert.equal(await page.locator("[data-variable]").count(), 6);

    await page.getByRole("button", { name: "Edit ada_trust", exact: true }).click();
    const value = page.getByRole("textbox", { name: "Default value", exact: true });
    for (const invalid of ["01", "-0", "+1", "1.5", " 4", "9223372036854775808", "-9223372036854775809"]) {
      await value.fill(invalid);
      await page.getByRole("button", { name: "Save default", exact: true }).click();
      assert.match(await page.getByRole("alert").innerText(), /canonical signed 64-bit/);
      assert.equal(await value.inputValue(), invalid);
      assert.equal(await value.evaluate(node => node === document.activeElement), true);
    }
    await value.fill("9223372036854775807");
    await close(variant);
    await page.getByRole("button", { name: "Edit ticket_message", exact: true }).click();
    await value.fill("A retained draft. Café 雪.\nNext line.");
    await close(variant);
    await page.getByRole("button", { name: "Edit ada_trust", exact: true }).click();
    assert.equal(await value.inputValue(), "9223372036854775807");
    await page.getByRole("button", { name: "Save default", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".lp-status")?.textContent === "Default saved in sample");
    await page.getByText("View declaration", { exact: true }).click();
    assert.match(await page.locator(".vl-declaration pre").innerText(), /default ada_trust = 9223372036854775807/);
    await value.fill("-9223372036854775808");
    await page.getByRole("button", { name: "Save default", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".lp-status")?.textContent === "Default saved in sample");
    await value.fill("12");
    await page.getByRole("button", { name: "Cancel editing", exact: true }).click();
    await page.getByRole("button", { name: "Keep editing", exact: true }).click();
    assert.equal(await value.inputValue(), "12");
    await page.getByRole("button", { name: "Cancel editing", exact: true }).click();
    await page.getByRole("button", { name: "Discard draft", exact: true }).click();
    assert.equal(await value.inputValue(), "-9223372036854775808");
    await close(variant);
    await page.getByRole("button", { name: "Edit ticket_message", exact: true }).click();
    assert.equal(await value.inputValue(), "A retained draft. Café 雪.\nNext line.");
    await page.getByRole("button", { name: "Save default", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".lp-status")?.textContent === "Default saved in sample");
    await close(variant);
    await page.getByRole("button", { name: "Edit met_ada", exact: true }).click();
    const bool = page.getByRole("combobox", { name: "Default value", exact: true });
    await bool.selectOption("true");
    await page.getByRole("button", { name: "Save default", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".lp-status")?.textContent === "Default saved in sample");
    assert.equal(await page.getByRole("textbox", { name: "Technical name", exact: true }).count(), 0, "Existing identity has no editing control");
    assert.match(await page.locator(".vl-related").innerText(), /Custom code is not included/);
    await bool.selectOption("false");
    await page.getByRole("button", { name: "Open The last departure, Beat 6 in Story", exact: true }).click();
    await page.getByRole("dialog", { name: "Leave this sample?", exact: true }).waitFor();
    await page.getByRole("button", { name: "Keep editing", exact: true }).click();
    assert.equal(await bool.inputValue(), "false");

    await page.getByRole("button", { name: "New variable", exact: true }).click();
    const name = page.getByRole("textbox", { name: "Technical name", exact: true });
    await name.fill("bad name");
    await page.getByRole("button", { name: "Create variable", exact: true }).click();
    assert.match(await page.getByRole("alert").innerText(), /must begin with a letter/);
    await name.fill("ADA_TRUST");
    await page.getByRole("button", { name: "Create variable", exact: true }).click();
    assert.match(await page.getByRole("alert").innerText(), /already uses this name/);
    await name.fill("  Bought_Ticket  ");
    await close(variant);
    await page.getByRole("button", { name: "New variable", exact: true }).click();
    assert.equal(await name.inputValue(), "  Bought_Ticket  ");
    await page.getByRole("button", { name: "Create variable", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".lp-status")?.textContent === "Variable created in sample");
    assert.equal(await page.getByRole("heading", { name: "bought_ticket", exact: true }).count(), 1);
    await page.getByRole("button", { name: "New variable", exact: true }).click();
    await name.fill("trip_count");
    await page.getByRole("combobox", { name: "Type", exact: true }).selectOption("int");
    await value.fill("42");
    await page.getByRole("button", { name: "Create variable", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".lp-status")?.textContent === "Variable created in sample");
    await page.getByRole("button", { name: "New variable", exact: true }).click();
    await name.fill("destination_note");
    await page.getByRole("combobox", { name: "Type", exact: true }).selectOption("string");
    await page.getByRole("button", { name: "Create variable", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".lp-status")?.textContent === "Variable created in sample");
    assert.equal(await value.inputValue(), "");

    await open({ variant, state: "error" });
    if (variant === "ledger") await close(variant);
    await page.getByRole("button", { name: "Edit ada_trust", exact: true }).click();
    await value.fill("7"); await page.getByRole("button", { name: "Save default", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".lp-status")?.textContent?.startsWith("Simulated save failure"));
    assert.equal(await value.inputValue(), "7");
    assert.equal(await page.getByRole("button", { name: "Save default", exact: true }).isEnabled(), true);
    await page.getByRole("button", { name: "Save default", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".lp-status")?.textContent === "Default saved in sample");

    await page.setViewportSize({ width: 560, height: 640 });
    await open({ variant, state: "long", viewport: "compact", theme: "dark" });
    if (variant === "ledger") await close(variant);
    await page.getByRole("button", { name: "Edit ticket_message", exact: true }).click();
    assert(await value.evaluate(node => node.scrollHeight > node.clientHeight));
    await value.fill("Keep the long draft");
    await page.getByRole("button", { name: "Save default", exact: true }).scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Save default", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".lp-status")?.textContent === "Default saved in sample");

    await open({ variant, state: "empty", viewport: "compact" });
    await page.getByRole("button", { name: "Create first variable", exact: true }).click();
    await name.fill("cancel_this");
    await page.getByRole("button", { name: "Cancel editing", exact: true }).click();
    await page.getByRole("button", { name: "Discard draft", exact: true }).click();
    assert.equal(await page.locator("[data-variable]").count(), 0);
  }
}
