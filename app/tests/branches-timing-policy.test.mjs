import assert from "node:assert/strict";
import test from "node:test";
import { classifyBranchesTiming } from "./branches-timing-policy.mjs";
import { isAdvancingFrame, nextAdvancingFrame } from "./branches-frame-sampling.mjs";

test("repeated callback timestamps remain evidence until a strictly advancing frame", async () => {
  const supplied = [5818.832, 5818.832, 5835.5];
  const observed = await nextAdvancingFrame(5818.832, async () => supplied.shift());
  assert.deepEqual(observed, [5818.832, 5818.832, 5835.5]);
  assert.equal(isAdvancingFrame(5818.832, observed), true);
  assert.equal(isAdvancingFrame(5818.832, [5818.832]), false);
});

test("a nonadvancing frame sequence is bounded and rejected", async () => {
  let calls = 0;
  const observed = await nextAdvancingFrame(100, async () => { calls++; return 100; });
  assert.equal(calls, 8);
  assert.deepEqual(observed, Array(8).fill(100));
  assert.equal(isAdvancingFrame(100, observed), false);
});

test("backward or malformed callback evidence cannot be accepted or retried away", async () => {
  for (const timestamp of [99, NaN, Infinity, undefined]) {
    let calls = 0;
    const observed = await nextAdvancingFrame(100, async () => { calls++; return timestamp; });
    assert.equal(calls, 1);
    assert.equal(isAdvancingFrame(100, observed), false);
  }
  assert.equal(isAdvancingFrame(100, []), false);
  assert.equal(isAdvancingFrame(100, [99, 101]), false);
});

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
