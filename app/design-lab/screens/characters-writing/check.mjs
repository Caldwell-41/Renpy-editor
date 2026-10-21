import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

export default async function check({ page, open }) {
  for (const variant of ["dossier", "board"]) {
    const load = async (options = {}) => {
      const compact = options.viewport === "compact";
      await page.setViewportSize({ width: compact ? 560 : 1100, height: compact ? 640 : 720 });
      await open({ screen: "characters-writing", variant, ...options });
    };
    const select = async id => {
      const restore = page.getByRole("button", { name: "Show character list", exact: true });
      if (await restore.isVisible()) await restore.click();
      await page.locator(`[data-character="${id}"]`).click();
    };
    const section = key => page.locator(`.cw-jump[data-topic="${key}"]`);
    const field = name => page.locator(`[name="${name}"]`);
    const save = page.getByRole("button", { name: "Save changes", exact: true });
    const status = page.locator(".cw-save-state");
    const capture = name => captureState(page, variant, name);
    const saved = async () => { await page.locator('.cw-shell[data-busy="false"]').waitFor(); assert.equal(await status.innerText(), "Saved in sample"); };

    await load();
    assert.equal(await save.isDisabled(), true);
    const original = await field("description").inputValue();
    const draft = "Draft retained across characters. Café 雪.";
    await field("description").fill(draft);
    await field("description").evaluate(n => { n.focus(); n.setSelectionRange(6, 14); });
    const scroll = await page.locator(".cw-body").evaluate(n => n.scrollTop);
    await select("ivo");
    await field("personality").fill("A second unsaved draft.");
    await select("mara");
    assert.equal(await field("description").inputValue(), draft);
    assert.deepEqual(await field("description").evaluate(n => ({ start: n.selectionStart, end: n.selectionEnd, focused: n === document.activeElement })), { start: 6, end: 14, focused: true });
    assert(Math.abs(await page.locator(".cw-body").evaluate(n => n.scrollTop) - scroll) < 2, "Character switch lost scroll");
    assert.equal(await page.getByRole("button", { name: "Undo", exact: true }).isDisabled(), true);
    await page.getByRole("button", { name: "Collapse character list", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Show character list", exact: true }).evaluate(n => n === document.activeElement), true);
    assert.equal(await field("description").inputValue(), draft);
    await page.getByRole("button", { name: "Show character list", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Collapse character list", exact: true }).evaluate(n => n === document.activeElement), true);
    await page.getByRole("button", { name: "Expand navigation", exact: true }).click();
    await page.getByRole("button", { name: "Collapse navigation", exact: true }).click();
    assert.equal(await field("description").inputValue(), draft);
    const beforeGameScroll = await page.locator(".cw-body").evaluate(n => n.scrollTop);
    await page.getByRole("tab", { name: "Game setup", exact: true }).click();
    assert.match(await page.locator(".cw-game").innerText(), /Writing notes never change game definitions/);
    await page.getByRole("tab", { name: "Game setup", exact: true }).press("ArrowLeft");
    assert.equal(await page.getByRole("tab", { name: "Writing", exact: true }).getAttribute("aria-selected"), "true");
    assert.equal(await field("description").inputValue(), draft);
    assert(Math.abs(await page.locator(".cw-body").evaluate(n => n.scrollTop) - beforeGameScroll) < 2, "Tab switching lost writing scroll");

    await page.getByRole("button", { name: "Version history", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Restore this version", exact: true }).isDisabled(), true);
    await page.getByRole("button", { name: "Close version history", exact: true }).press("Escape");
    assert.equal(await page.getByRole("button", { name: "Version history", exact: true }).evaluate(n => n === document.activeElement), true);
    await page.getByRole("button", { name: "Reload library", exact: true }).click();
    assert.equal(await field("description").inputValue(), draft);
    await save.click(); await saved();
    await select("ivo"); assert.equal(await field("personality").inputValue(), "A second unsaved draft.");
    await page.getByRole("button", { name: "Discard changes", exact: true }).click();
    await page.getByRole("button", { name: "Keep editing", exact: true }).click();
    assert.equal(await field("personality").inputValue(), "A second unsaved draft.");
    await page.getByRole("button", { name: "Discard changes", exact: true }).click();
    await page.getByRole("button", { name: "Discard this draft", exact: true }).click();
    await select("mara");
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    assert.equal(await field("description").inputValue(), original);
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    assert.equal(await field("description").inputValue(), draft);
    await page.getByRole("button", { name: "Version history", exact: true }).click();
    const restore = page.getByRole("button", { name: "Restore this version", exact: true }).first();
    await capture("history-light-wide"); await restore.click();
    assert.notEqual(await field("description").inputValue(), draft);
    assert.match(await status.innerText(), /Restored as a new saved/);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    assert.equal(await field("description").inputValue(), draft);

    await section("relationships").click();
    const summaries = page.locator(".cw-relationship summary");
    await summaries.nth(1).click();
    assert.equal(await field("relationship-1-target").inputValue(), "lore:station", "Retained non-character target was lost");
    await summaries.first().click();
    assert.equal(await page.locator(".cw-relationship[open]").count(), 1);
    await field("relationship-0-text").fill("They share a secret about the last service.");
    await page.getByRole("button", { name: "Add relationship", exact: true }).click();
    assert.equal(await field("relationship-2-target").evaluate(n => n === document.activeElement), true);
    await field("relationship-2-target").selectOption("elsie");
    await field("relationship-2-text").fill("She recognises the map in Elsie's suitcase.");
    await capture("relationships-light-wide"); await save.click(); await saved();
    await section("relationships").click();
    const lastRelationship = page.locator(".cw-relationship").last();
    if (await lastRelationship.getAttribute("open") === null) await lastRelationship.locator("summary").click();
    await page.locator(".cw-relationship[open]").getByRole("button", { name: "Remove relationship", exact: true }).click();
    assert.equal(await page.locator(".cw-relationship").count(), 2);
    await section("knowledge").click();
    await field("knowledgeNotes").fill("Knows the timetable. Has not read the letter. Keeps a second ticket hidden.");
    assert.match(await page.locator(".cw-knowledge-intro").innerText(), /when the story begins/);
    await page.getByRole("button", { name: "Collapse Starting knowledge & secrets section", exact: true }).click();
    await section("knowledge").click();
    assert.match(await field("knowledgeNotes").inputValue(), /Keeps a second ticket/);
    await save.click(); await saved();

    // Help is persistent and explicitly described, including empty fields.
    for (const input of await page.locator(".cw-field input,.cw-field textarea,.cw-field select").all()) {
      const ids = (await input.getAttribute("aria-describedby")).split(" ");
      assert(await page.locator(`#${ids[0]}`).textContent(), "Missing persistent help");
    }
    assert.equal(await page.locator('[name="linkedLoreIds"],[name="scope"],[name="provenance"],[name="links"]').count(), 0);
    await section("overview").click(); await page.getByRole("button", { name: "Card details", exact: true }).click(); await field("title").fill(""); await page.getByRole("button", { name: "Done", exact: true }).click(); await save.click();
    assert.equal(await field("title").getAttribute("aria-invalid"), "true");
    assert.equal(await field("title").evaluate(n => n === document.activeElement), true);
    await field("title").fill("Mara Vale"); await page.getByRole("button", { name: "Done", exact: true }).click();
    await select("theo");
    assert.equal(await field("description").inputValue(), ""); assert.equal(await field("knowledgeNotes").inputValue(), "");
    assert.match(await page.locator(".cw-character-status").innerText(), /In game/);
    await select("ivo"); assert.match(await page.locator(".cw-character-status").innerText(), /Planning only/);
    await page.getByRole("tab", { name: "Game setup", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Review game character source", exact: true }).isEnabled(), true);
    await page.getByRole("tab", { name: "Writing", exact: true }).click();
    await page.getByRole("searchbox", { name: "Search characters", exact: true }).fill("No such person");
    assert.match(await page.locator(".cw-character-rows").innerText(), /No matching/);
    await page.getByRole("searchbox", { name: "Search characters", exact: true }).fill("");
    await page.getByRole("button", { name: "New character", exact: true }).click();
    assert.equal(await field("description").inputValue(), "");
    await field("title").fill("Nell Ash"); await field("description").fill("A fictional new passenger.");
    await save.click(); await saved(); assert.match(await page.locator(".cw-identity-name").innerText(), /Nell Ash/);

    await load({ state: "save-error", theme: "dark", viewport: "compact" });
    await field("description").fill("Keep this draft after refusal."); await save.click();
    await page.locator('.cw-save-state[data-error="true"]').waitFor();
    await capture("writing-error-dark-compact"); assert.match(await status.innerText(), /Simulated save failure/); assert.equal(await field("description").inputValue(), "Keep this draft after refusal.");
    assert.equal(await save.isEnabled(), true);
    await select("ivo"); await select("mara"); assert.equal(await field("description").inputValue(), "Keep this draft after refusal.");
    await page.getByRole("button", { name: "Discard changes", exact: true }).click();
    await page.getByRole("button", { name: "Discard this draft", exact: true }).click();
    assert.equal(await field("description").inputValue(), original);

    await load({ state: "long", viewport: "compact", theme: "dark" });
    await section("overview").click();
    assert(await page.locator(".cw-body").evaluate(n => n.scrollHeight > n.clientHeight));
    assert(await field("background").evaluate(n => n.clientHeight > 1000), "Long prose should grow with page scrolling");
    await field("background").fill((await field("background").inputValue()) + "\nRetained end note.");
    await section("knowledge").click();
    await capture("knowledge-dark-compact"); const bounds = await save.boundingBox(); assert(bounds && bounds.y >= 0 && bounds.x >= 0 && bounds.y + bounds.height <= 640 && bounds.x + bounds.width <= 560, "Save must stay in view");
    await select("ivo"); await select("mara"); assert.match(await field("background").inputValue(), /Retained end note/);
    await load({ state: "empty" }); assert.equal(await field("description").inputValue(), "");
    await section("relationships").click(); assert.match(await page.locator(".cw-empty").innerText(), /No relationships yet/);

    await load({ state: "proposed" });
    await capture("proposal-light-wide"); assert.equal(await field("description").isDisabled(), true);
    await page.getByRole("button", { name: "Card details", exact: true }).click();
    assert.equal(await page.getByRole("dialog").getByRole("textbox", { name: "Name", exact: true }).isDisabled(), true);
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.getByRole("button", { name: "Approve this card revision", exact: true }).click();
    assert.equal(await field("description").isEnabled(), true);
    await load({ state: "proposed" });
    await page.getByRole("button", { name: "Reject proposed card", exact: true }).click();
    assert.match(await field("description").inputValue(), /still learning/);
    await checkGame({ page, load, select, field, save, saved, capture });
    for (const state of ["game-linked", "game-planning"]) for (const theme of ["light", "dark"]) for (const viewport of ["wide", "compact"]) {
      await load({ state, theme, viewport }); await capture(`${state}-${theme}-${viewport}`);
      const action = page.locator(".cw-game-controls .primary");
      const bounds = await action.boundingBox(); const size = page.viewportSize();
      assert(bounds && bounds.y >= 0 && bounds.y + bounds.height <= size.height, "Game action must remain visible");
    }
    await load();
  }
}

async function captureState(page, variant, name) {
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.screenshot({ path: fileURLToPath(new URL(`../../../../.toolchains/design-lab/pages/characters-writing/${variant}-${name}.png`, import.meta.url)) });
}
async function checkGame({ page, load, select, field, save, saved, capture }) {
  const game = page.locator(".cw-game");
  const tab = name => page.getByRole("tab", { name, exact: true });
  const gameButton = name => game.getByRole("button", { name, exact: true });
  const button = name => page.getByRole("button", { name, exact: true });
  await load({ state: "game-linked" });
  assert.match(await game.innerText(), /Browser simulation/);
  await field("gameDisplayName").fill("Conductor Mara"); await field("gameColour").fill("#d4a180");
  assert.equal(await page.locator(".cw-dialogue-preview strong").innerText(), "Conductor Mara");
  await tab("Writing").click(); assert.match(await page.locator(".cw-identity-name").innerText(), /Mara Vale/);
  await button("Version history").click(); assert.equal(await button("Restore this version").isDisabled(), true);
  await button("Close version history").click(); await tab("Game setup").click();
  assert.equal(await field("gameDisplayName").inputValue(), "Conductor Mara");
  await button("Source").click(); assert.equal(await page.getByRole("dialog", { name: "Leave this sample?", exact: true }).isVisible(), true);
  await button("Keep editing").click(); assert.equal(await field("gameDisplayName").inputValue(), "Conductor Mara");
  await gameButton("Save game settings").click(); assert.match(await game.innerText(), /Saved game settings/);
  await gameButton("View appearance thoughtful").click(); await gameButton("Set thoughtful as default").click();
  assert.match(await page.locator(".cw-appearance-caption").innerText(), /thoughtful · Default/);
  await gameButton("Add appearance").click(); await button("Add to game draft").click();
  assert.match(await page.getByRole("dialog").innerText(), /Enter a unique expression/);
  await field("appearanceExpression").fill("waiting"); await field("appearanceImage").selectOption("uniform");
  await button("Add to game draft").click(); await gameButton("Edit appearance waiting").click();
  await field("appearanceExpression").fill("hopeful"); await field("appearanceImage").selectOption("scarf");
  await button("Keep appearance edits").click(); assert.equal(await gameButton("View appearance hopeful").isVisible(), true);
  await gameButton("Save game settings").click(); await page.locator(".cw-game-body").evaluate(n => n.scrollTop = 0); await capture("game-linked-light-wide");
  await field("gameDisplayName").fill(""); await gameButton("Save game settings").click();
  assert.equal(await field("gameDisplayName").getAttribute("aria-invalid"), "true");
  await gameButton("Discard game edits").click(); await button("Discard game draft").click();
  assert.equal(await field("gameDisplayName").inputValue(), "Conductor Mara");
  await button("Undo").click(); assert.equal(await gameButton("View appearance hopeful").count(), 0);
  await button("Redo").click(); assert.equal(await gameButton("View appearance hopeful").count(), 1);

  await load({ state: "game-planning" }); await capture("game-planning-light-wide");
  await field("gameTechnicalName").fill("ivo"); await field("gameDisplayName").fill("Ivo");
  await tab("Writing").click(); await field("description").fill("Keep this prose separate from the source definition.");
  await tab("Game setup").click(); await gameButton("Review game character source").click();
  assert.match(await game.innerText(), /Save or discard this character's writing/); assert.equal(await page.getByRole("dialog").count(), 0);
  await tab("Writing").click(); await save.click(); await saved(); await tab("Game setup").click();
  assert.equal(await field("gameTechnicalName").inputValue(), "ivo");
  await gameButton("Review game character source").click(); assert.match(await page.getByRole("dialog").innerText(), /define ivo = Character/);
  await capture("game-create-review-light-wide"); await button("Back to setup").click();
  assert.match(await page.locator(".cw-character-status").innerText(), /Planning only/);
  await gameButton("Review game character source").click(); await button("Create game character in sample").click();
  assert.match(await page.locator(".cw-character-status").innerText(), /In game/);
  await tab("Writing").click(); assert.equal(await field("description").inputValue(), "Keep this prose separate from the source definition.");
  await select("elsie"); await tab("Game setup").click(); await game.locator(".cw-game-link summary").click();
  await field("existingGameCharacter").selectOption("theo"); await gameButton("Review character link").click();
  assert.match(await page.getByRole("dialog").innerText(), /Saved identity: game-theo/); await capture("game-link-review-light-wide");
  await button("Link character in sample").click(); assert.match(await page.locator(".cw-character-status").innerText(), /In game/);
  await game.locator(".cw-game-technical summary").click(); assert.match(await game.innerText(), /Saved identity game-theo/);
  assert.equal(await page.locator('[data-character="theo"]').count(), 0, "Linking should not leave a duplicate game-only row");
  await tab("Writing").click(); assert.match(await field("description").inputValue(), /suitcase full of maps/);

  await load({ state: "save-error", theme: "dark", viewport: "compact" }); await tab("Game setup").click();
  await field("gameDisplayName").fill("Retained game name"); await gameButton("Save game settings").click();
  assert.match(await game.innerText(), /Simulated game setup save failure/); assert.equal(await page.locator(".cw-game-feedback").isVisible(), true); assert.equal(await field("gameDisplayName").inputValue(), "Retained game name");
  await capture("game-error-dark-compact");
  await select("ivo"); await tab("Game setup").click(); await field("gameTechnicalName").fill("ivo");
  await gameButton("Review game character source").click(); await button("Create game character in sample").click();
  assert.match(await page.getByRole("dialog").innerText(), /Simulated apply failure/); await capture("game-create-error-dark-compact");
  await button("Back to setup").click(); assert.match(await page.locator(".cw-character-status").innerText(), /Planning only/);
}
