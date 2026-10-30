import assert from "node:assert/strict";

export default async function check({ page, open }) {
  const state = async () => JSON.parse(await page.locator(".sle-state pre").textContent());
  const body = () => page.locator("[data-node-id=body]");
  const field = name => page.locator(`[data-text-field=${name}]`);
  const apply = () => page.locator("[data-text-apply]");
  const cancel = () => page.locator("[data-text-cancel]");
  const card = () => page.locator(".screen-card");
  const design = async (scenario = "shared") => {
    await open({ variant: "editor", state: scenario, theme: "dark" });
    await body().waitFor(); assert.equal(await page.getByRole("button", { name: "1 Choose", exact: true }).getAttribute("aria-pressed"), "true");
    await body().dblclick(); await page.locator(".sle-look").waitFor();
  };
  await design();
  assert.equal(await page.getByRole("navigation", { name: "Project navigation" }).getByRole("button", { name: "Screens", exact: true }).getAttribute("aria-current"), "page");
  assert.equal(await page.locator(".screen-game").count(), 1);
  assert.equal(await page.getByRole("button", { name: "2 Design", exact: true }).getAttribute("aria-pressed"), "true");
  assert.equal(await field("text").inputValue(), "Choose a route.\nThe last tram leaves at midnight.");
  assert.match(await page.locator(".sle-look").innerText(), /Shared with About/);
  assert.equal(await apply().isDisabled(), true);
  await field("size").press("Enter"); assert.equal(await page.locator(".sle-review").count(), 0); assert.equal((await state()).history, 0);
  await field("size").fill("32");
  await field("size").evaluate(input => { input.focus(); input.setSelectionRange(0, 1); });
  await card().locator(".screen-text-layout > summary").click();
  await field("size").focus();
  const before = await field("size").evaluate(input => ({ start: input.selectionStart, end: input.selectionEnd, scroll: document.querySelector(".screen-text-body").scrollTop }));
  await apply().click(); assert.match(await page.getByRole("dialog", { name: "Review shared look" }).innerText(), /Help · Will update/); assert.match(await page.locator(".sle-review").innerText(), /About · Will update/);
  assert.equal((await state()).history, 0);
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  assert.deepEqual(await field("size").evaluate(input => ({ focus: input === document.activeElement, start: input.selectionStart, end: input.selectionEnd, scroll: document.querySelector(".screen-text-body").scrollTop, expanded: document.querySelector(".screen-text-layout").open })), { focus: true, ...before, expanded: true });
  assert.equal(await field("size").inputValue(), "32");
  await apply().click(); await page.getByRole("button", { name: "Apply to 2 screens", exact: true }).click();
  await page.waitForFunction(() => JSON.parse(document.querySelector(".sle-state pre").textContent).history === 1);
  let result = await state(); assert.equal(result.accepted.looks.body.values.size, 32); assert.equal(result.accepted.documents[1].screens[0].nodes.find(n => n.id === "body").textProperties.values.size, 32);
  await page.locator(".screen-tools").getByRole("button", { name: "Undo", exact: true }).click(); await page.waitForFunction(() => JSON.parse(document.querySelector(".sle-state pre").textContent).history === 0);
  await field("size").waitFor(); assert.equal(await field("size").inputValue(), "26");
  await page.locator(".screen-tools").getByRole("button", { name: "Redo", exact: true }).click(); await page.waitForFunction(() => JSON.parse(document.querySelector(".sle-state pre").textContent).history === 1);
  await page.getByRole("button", { name: "Make independent", exact: true }).click();
  await field("color").fill("#e8a87c"); await apply().click(); assert.match(await page.locator(".sle-review").innerText(), /About · Unchanged/);
  await page.getByRole("button", { name: "Apply to Help only", exact: true }).click(); await page.waitForFunction(() => JSON.parse(document.querySelector(".sle-state pre").textContent).history === 2);
  result = await state(); assert.notEqual(result.accepted.uses["Help/body"], result.accepted.uses["About/body"]); assert.equal(result.accepted.looks.body.values.color, "#f1e9d6"); assert.equal(result.accepted.looks[result.accepted.uses["Help/body"]].values.color, "#e8a87c");
  await field("size").fill("40"); await cancel().click(); assert.equal(await field("size").inputValue(), "32"); assert.equal((await state()).history, 2);
  await page.getByRole("button", { name: "1 Choose", exact: true }).click(); await body().dblclick(); assert.match(await page.locator(".sle-look").innerText(), /Used only/);
  await page.getByRole("button", { name: "3 Connect", exact: true }).click(); assert.equal(await page.locator(".sle-look").count(), 0);
  await page.getByRole("button", { name: "2 Design", exact: true }).click(); await page.locator(".sle-look").waitFor();
  await design(); await field("text").fill("Only the Help content changes."); await apply().click(); await page.waitForFunction(() => JSON.parse(document.querySelector(".sle-state pre").textContent).history === 1);
  assert.equal(await page.locator(".sle-review").count(), 0); result = await state(); assert.match(result.accepted.documents[1].screens[0].nodes.find(n => n.id === "body").literal, /long way home/);
  await design(); await page.getByRole("button", { name: "Make independent", exact: true }).click(); await apply().click(); await page.getByRole("button", { name: "Apply to Help only", exact: true }).click(); await page.waitForFunction(() => JSON.parse(document.querySelector(".sle-state pre").textContent).history === 1); assert.notEqual((await state()).accepted.uses["Help/body"], (await state()).accepted.uses["About/body"]);
  for (const scenario of ["stale", "missing"]) {
    await design(scenario); await field("size").fill("34"); await apply().click(); await page.getByRole("button", { name: "Apply to 2 screens", exact: true }).click(); assert.match(await page.locator(".sle-review [role=alert]").innerText(), /Nothing was applied/); assert.equal((await state()).history, 0); await page.getByRole("button", { name: "Keep editing", exact: true }).click(); assert.equal(await field("size").inputValue(), "34");
  }
  await design("local"); await page.getByRole("combobox", { name: "Screen", exact: true }).selectOption(JSON.stringify(["owned", "About"])); await page.getByRole("button", { name: "1 Choose", exact: true }).click(); await body().dblclick(); await page.locator(".sle-look").getByRole("button", { name: "Change…", exact: true }).click(); await page.getByRole("dialog", { name: "Choose a look" }).getByRole("button", { name: /^Body text/ }).click(); await apply().click(); await page.getByRole("button", { name: "Apply to 1 screen", exact: true }).click(); await page.waitForFunction(() => JSON.parse(document.querySelector(".sle-state pre").textContent).history === 1); assert.equal((await state()).accepted.uses["Help/body"], (await state()).accepted.uses["About/body"]);
  console.log("A3 existing-editor journey passes: sidebar, Choose/Design/Connect, existing fields, shared Apply, independent copy, review retention, history and refusal.");
}
