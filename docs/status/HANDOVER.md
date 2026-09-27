# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** R2-P1-MAC-D1 diagnosis/review, `review_ready`; R2-P1 remains `blocked`.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/unmerged,
conflicting against main. No conflict resolution or merge performed/authorized.
**Reviewed application candidate:** `4470e3af6f3603f8936eaf442e6d849bb366114b`,
including completed WIN-F1. This checkpoint changes documentation only; resolve the
published documentation head from Git. Main remains `4d7ba0333c48d60242a9a42d3e079fea499a5531`.

## Diagnosis and evidence

Read [ledger 28](../tasks/active/phase-1g-branches-runtime-git.md#28-r2-p1-mac-d1-macos-frame-budget-diagnosisreview--2026-09-27)
for provenance, findings, trace evidence, limits and the concrete correction/proof plan.
Original [run 36293797731](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36293797731),
attempt 1, candidate `f1a0f148445f34f8af1a57d0f69e2d27eb543b11`, remains **FAIL**.
macOS job **108548848384**, artifact **10923840024** was freshly verified against
GitHub's size/digest; p95 **109.9 ms**, max **860.3 ms**, four of 30 samples >100 ms.

Confirmed probe defects: the endpoint is dispatch-to-next-rAF rather than confirmed
presentation; the fixed leftward input sequence moves the fitted graph out of the
clipped viewport after two inputs, despite retaining every DOM node/path. Panning
only changes a transform and dispatch is fast; deferred graphics cost is not excluded.
The renderer/probe/lock are identical to the earlier passing run. Both CI runs used
Chrome 152.0.7977.83 and the same runner image, without trace/GPU-load evidence.

Two local launches used existing Chrome 154.0.8037.57 on ARM64 macOS 26.6.2, Apple M4.
Unchanged probe: initial **46.8 ms**, p95 **15.9 ms**. Diagnostic trace shows callback
before paint and a **104 ms no-input interval** overlapping compositor/GPU waits.
This supports a browser/graphics contribution mechanism, not exact attribution of
the historical CI failure or native WKWebView acceptance. Implementation-versus-host
split remains unresolved; do not call it merely a flake or weaken the 100 ms budget.
Raw evidence and replayable diagnostic copy: ignored `.toolchains/reports/r2-p1-mac-d1` on this Mac.
No new tools were needed. Two browser/server sessions terminated; none is pending.

## Preserved Windows and qualification limits

WIN-D1 and WIN-F1 remain `review_ready`; see [ledger 26](../tasks/active/phase-1g-branches-runtime-git.md#26-r2-p1-win-d1-resumed-local-startup-diagnosis--2026-09-27)
and [ledger 27](../tasks/active/phase-1g-branches-runtime-git.md#27-r2-p1-win-f1-sdk-hashing-stack-correction--2026-09-27).
The two heap-buffer correction, six ordinary checks and all five local real-service
application scenarios remain preserved. Three of four F1 build runs were used; the
remaining allowance does not authorize macOS work. Windows raw evidence remains in
that host's `reports/r2-p1-win-d1`, fixed output `.cache/target-r2-p1-win-d1/release`.
Original CI failure, skipped macOS SDK/package gates, unavailable original executable
and final supported-target/native-human acceptance remain open. No hostile/crash tests.

## Next bounded decision

**Proposed R2-P1-MAC-M1 — approval required:** correct the probe's visible pan coverage
and timing/evidence semantics, preserving original samples and budgets, then perform
the two fixed local browser checks described in ledger 28. Keep production renderer,
CSS and Windows fix unchanged. Local results cannot qualify the historical runner.
A subsequent single hosted diagnostic run requires explicit review/authorization and
bounded workflow scope; no production matrix rerun or automatic retry is authorized.
Ask before downloading/installing a new tool only if existing tools cannot answer a
specific blocker. No implementation, redispatch, merge/conflict resolution, budget
relaxation, hostile/crash testing or human acceptance follows from this review alone.

Only ledger, CURRENT, HANDOVER and TESTING measurement guidance accompany publication.
Repository structure/link/privacy checks passed for 270 files; whitespace and changed-
path checks passed. Actual pushed head is reported after remote verification, without
a receipt-only commit.
