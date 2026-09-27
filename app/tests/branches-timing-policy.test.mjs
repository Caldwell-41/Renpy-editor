import assert from "node:assert/strict";
import test from "node:test";
import { classifyBranchesTiming } from "./branches-timing-policy.mjs";

const baseline = () => ({ initialLayoutMs: 1999.9, original: [{ dispatchMs: 99.9 }],
  visible: [{ dispatchMs: 99.9 }], panFrameP95Ms: 99.9, visibleDispatchToRafP95Ms: 99.9,
  visibleRenderingOpportunityP95Ms: 99.9 });

test("unchanged strict timing limits pass below their boundaries", () => {
  const report = baseline(), before = structuredClone(report);
  const result = classifyBranchesTiming(report);
  assert.equal(result.budgetStatus, "pass");
  assert.equal(result.timingMetrics.length, 5);
  assert.deepEqual(report, before);
});

test("each timing overrun is retained as a failed diagnostic without throwing", () => {
  for (const metric of ["initialLayoutMs", "inputDispatchMaxMs", "panFrameP95Ms",
    "visibleDispatchToRafP95Ms", "visibleRenderingOpportunityP95Ms"]) {
    const report = baseline();
    if (metric === "inputDispatchMaxMs") report.visible[0].dispatchMs = 100;
    else report[metric] = metric === "initialLayoutMs" ? 2000 : 100;
    const result = classifyBranchesTiming(report);
    assert.equal(result.budgetStatus, "fail", metric);
    assert.deepEqual(result.timingMetrics.filter(value => value.status === "fail").map(value => value.metric), [metric]);
  }
});

test("historical-style Chrome overruns preserve values and do not rewrite run status", () => {
  const report = { ...baseline(), status: "fail", panFrameP95Ms: 123.6,
    visibleRenderingOpportunityP95Ms: 181.6, noInputRenderingOpportunityP95Ms: 148.8 };
  const before = structuredClone(report);
  const result = classifyBranchesTiming(report);
  assert.equal(result.budgetStatus, "fail");
  assert.equal(result.timingMetrics.find(value => value.metric === "panFrameP95Ms").valueMs, 123.6);
  assert.deepEqual(report, before);
});

test("missing, non-finite and negative measurements remain blocking errors", () => {
  for (const bad of [undefined, NaN, Infinity, -1]) {
    const report = baseline();
    report.panFrameP95Ms = bad;
    assert.throws(() => classifyBranchesTiming(report), /Invalid Chrome timing evidence/);
  }
  assert.throws(() => classifyBranchesTiming({ ...baseline(), original: [], visible: [] }), /Invalid Chrome timing evidence/);
});
