import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

export default async function check({ page, open }) {
  const capture = name => page.screenshot({ path: fileURLToPath(new URL(`../../../../.toolchains/design-lab/pages/welcome/${name}.png`, import.meta.url)) });
  for (const variant of ["desk", "shelf"]) {
    await page.setViewportSize({ width: 1100, height: 720 });
    await open({ variant });
    const search = page.getByRole("searchbox", { name: "Find a project", exact: true });
    assert.equal(await page.locator("[data-project]").count(), 4);
    assert.equal(await page.getByRole("button", { name: "Summer Letters", exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole("button", { name: "After the Tide", exact: true }).isDisabled(), true);
    await search.fill("external drive");
    assert.equal(await page.locator("[data-project]").count(), 1);
    await page.getByRole("button", { name: "Project options for Summer Letters", exact: true }).click();
    assert.match(await page.getByRole("dialog").innerText(), /recorded folder is unavailable/);
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("button", { name: "Project options for Summer Letters", exact: true }).evaluate(el => document.activeElement === el), true);
    await search.fill("no such project");
    await page.getByRole("heading", { name: "No matching projects", exact: true }).waitFor();
    await page.getByRole("button", { name: "Clear project search", exact: true }).click();
    assert.equal(await search.inputValue(), "");
    assert.equal(await search.evaluate(el => document.activeElement === el), true);
    assert.equal(await page.locator("[data-project]").count(), 4);

    await page.getByRole("button", { name: "Project options for The Last Tram", exact: true }).click();
    await page.getByRole("button", { name: "Remove from recents", exact: true }).click();
    assert.equal(await page.locator("[data-project]").count(), 3);
    assert.match(await page.locator(".wh-feedback").innerText(), /Project not deleted/);
    assert.equal(await page.locator(".wh-list-heading h2").evaluate(el => document.activeElement === el), true);
    await search.fill("tram");
    assert.equal(await page.locator("[data-project]").count(), 0);
    await page.getByRole("button", { name: "Undo removal", exact: true }).click();
    assert.equal(await page.locator("[data-project]").count(), 1);
    assert.equal(await page.locator("[data-project]").first().getAttribute("data-project"), "tram");
    assert.equal(await page.getByRole("button", { name: "Project options for The Last Tram", exact: true }).evaluate(el => document.activeElement === el), true);
    await page.getByRole("button", { name: "Clear search", exact: true }).click();
    await page.getByRole("button", { name: "Project options for After the Tide", exact: true }).click();
    assert.match(await page.getByRole("dialog").innerText(), /newer Loomlight format/);
    await page.getByRole("button", { name: "Close", exact: true }).click();

    await page.getByRole("button", { name: "Open Loomlight project", exact: true }).click();
    await page.getByRole("radio", { name: "Summer Letters", exact: true }).check();
    await page.getByRole("button", { name: "Open sample project", exact: true }).click();
    assert.match(await page.getByRole("alert").innerText(), /could not be opened.*Choose another sample/s);
    await page.getByRole("radio", { name: "After the Tide", exact: true }).check();
    await page.getByRole("button", { name: "Open sample project", exact: true }).click();
    assert.match(await page.getByRole("alert").innerText(), /compatible version/);
    await page.getByRole("radio", { name: "A Quiet Morning", exact: true }).check();
    await page.getByRole("button", { name: "Open sample project", exact: true }).click();
    const opened = page.getByRole("dialog", { name: "Project opened in sample", exact: true });
    assert.match(await opened.innerText(), /A Quiet Morning/);
    assert.match(await opened.innerText(), /Story preview contains The Last Tram/);
    await page.getByRole("button", { name: "Stay on Home", exact: true }).click();
    await page.getByRole("button", { name: "Open Loomlight project", exact: true }).click();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    assert.equal(await page.locator("[data-project]").count(), 4);
    assert.match(await page.locator(".lp-status").innerText(), /Open cancelled/);

    await page.getByRole("button", { name: "Continue The Last Tram", exact: true }).click();
    await page.waitForURL(url => url.searchParams.get("screen") === "story");
    await open({ variant });
    await page.locator(".wh-start-actions").getByRole("button", { name: "New project", exact: true }).click();
    await page.waitForURL(url => url.searchParams.get("screen") === "new-project");

    await open({ variant, state: "error" });
    await page.getByRole("heading", { name: "Recent projects couldn't load", exact: true }).waitFor();
    assert.equal(await search.isDisabled(), true);
    await page.getByRole("button", { name: "Retry recent projects", exact: true }).click();
    assert.equal(await page.locator("[data-project]").count(), 4);
    assert.equal(await search.isEnabled(), true);
    await open({ variant, state: "loading" });
    await page.getByRole("heading", { name: "Loading recent projects", exact: true }).waitFor();
    assert.equal(await search.isDisabled(), true);
    await page.getByRole("button", { name: "Finish sample loading", exact: true }).click();
    assert.equal(await page.locator("[data-project]").count(), 4);

    await page.setViewportSize({ width: 560, height: 640 });
    await open({ variant, theme: "dark", viewport: "compact" });
    await page.locator("[data-project]").first().scrollIntoViewIfNeeded();
    await capture(`${variant}-recents-dark-compact`);
    await open({ variant, state: "long", theme: "dark", viewport: "compact" });
    await search.fill("observatory collection");
    assert.equal(await page.locator("[data-project]").count(), 1);
    await page.locator(".wh-options").click();
    assert.match(await page.getByRole("dialog").innerText(), /Observatory collection/);
    await capture(`${variant}-long-options-dark-compact`);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Clear search", exact: true }).click();
    assert.equal(await page.locator("[data-project]").count(), 16);

    for (const theme of ["light", "dark"]) for (const state of ["empty", "error"]) {
      await open({ variant, state, theme, viewport: "compact" });
      await capture(`${variant}-${state}-${theme}-compact`);
      if (state === "empty") {
        assert.equal(await page.locator("[data-project]").count(), 0);
        await page.getByRole("button", { name: "Open Loomlight project", exact: true }).click();
        await page.getByRole("button", { name: "Cancel", exact: true }).click();
        await page.getByRole("button", { name: "Create your first project", exact: true }).scrollIntoViewIfNeeded();
        assert.equal(await page.getByRole("button", { name: "Create your first project", exact: true }).isVisible(), true);
      }
    }
    await page.getByRole("button", { name: "Open Loomlight project", exact: true }).click();
    await page.getByRole("radio", { name: "Summer Letters", exact: true }).check();
    await page.getByRole("button", { name: "Open sample project", exact: true }).click();
    const dialogBounds = await page.getByRole("dialog", { name: "Choose a sample project", exact: true }).boundingBox();
    const actionBounds = await page.getByRole("button", { name: "Open sample project", exact: true }).boundingBox();
    assert(dialogBounds && actionBounds && actionBounds.y + actionBounds.height <= dialogBounds.y + dialogBounds.height, "Compact chooser recovery action fits inside its visible dialog");
    await capture(`${variant}-chooser-error-dark-compact`);
    await page.keyboard.press("Escape");
  }
}
