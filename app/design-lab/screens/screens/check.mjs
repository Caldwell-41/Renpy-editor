import assert from "node:assert/strict";
import checkNotebook from "./check-notebook.mjs";
import checkAlternatives from "./check-alternatives.mjs";
import checkManipulation from "./check-manipulation.mjs";
import checkList from "./check-list.mjs";

export default async function check(context) {
  const { page, open } = context;
  const ids = await page.evaluate(async () => (await import("/screens/screens/definition.ts")).variants.map(v => v.id));
  assert.deepEqual(ids, ["guided-v2", "direct", "flow"], "Only the three requested Screens drafts remain");
  await checkList(context);
  await checkManipulation(context);
  await checkNotebook(context);
  await checkAlternatives(context);
  for (const [i, variant] of ids.entries()) {
    await open({ variant });
    await page.getByRole("button", { name: "Next prototype layout", exact: true }).click();
    await page.waitForURL(new RegExp(`variant=${ids[(i + 1) % ids.length]}`));
  }
}
