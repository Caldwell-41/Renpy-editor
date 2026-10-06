// Chrome timing is diagnostic; malformed evidence still fails the browser check.
export function classifyBranchesTiming(report) {
  const metrics = [
    ["initialLayoutMs", report.initialLayoutMs, 2000],
    ["inputDispatchMaxMs", Math.max(...report.original.concat(report.visible).map(value => value.dispatchMs)), 100],
    ["panFrameP95Ms", report.panFrameP95Ms, 100],
    ["visibleDispatchToRafP95Ms", report.visibleDispatchToRafP95Ms, 100],
    ["visibleRenderingOpportunityP95Ms", report.visibleRenderingOpportunityP95Ms, 100],
  ].map(([metric, valueMs, limitMs]) => {
    if (!Number.isFinite(valueMs) || valueMs < 0) throw new Error(`Invalid Chrome timing evidence: ${metric}`);
    return { metric, valueMs, limitMs, status: valueMs < limitMs ? "pass" : "fail" };
  });
  return { budgetStatus: metrics.every(value => value.status === "pass") ? "pass" : "fail", timingMetrics: metrics };
}
