# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** R2-P1, `blocked`; completed run assessed, qualification failed.
**Authority:** user selected exact-run artifact assessment/publication only; no
redispatch, production-code change or merge.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/unmerged,
conflicting against main. Integration is outside scope.
**Tested candidate:** `f1a0f148445f34f8af1a57d0f69e2d27eb543b11`.
**Exact run:** [36293797731](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36293797731),
**attempt 1**, terminal **FAIL**; last target job completed 2026-09-27 04:32:03 UTC.
Later commits contain documentation only; resolve published head from Git.

## Verified outcome

Read [ledger 23](../tasks/active/phase-1g-branches-runtime-git.md#23-r2-p1-packaged-proof-correction-and-qualification--2026-09-27)
for exact measurements, gate dispositions, hashes and failure evidence.
Preflight **108548761361** passed (60 frontend tests, Source browser, repo/format).
Windows **108548848419** passed core, three G1-U2 samples, rendered budgets, explicit
SDK/R1/diagnostics, desktop test and MSI/NSIS build. All five packaged cases then
exited with code 3221225725 and `thread 'main' has overflowed its stack`, in
0.015–0.047 seconds, no timeout and no reports. Scenario stages/cleanup are unproven.
The overflow location and normal-launch impact remain unknown.

macOS ARM64 **108548848384** passed core and three G1-U2 samples, then failed the
Branches browser frame gate: p95 **109.9 ms** against <100 ms, maximum **860.3 ms**.
Synchronous dispatch maximum was 0.3 ms; it does not excuse the frame failure.
Cause is unproven. Downstream SDK/desktop/package/scenario gates were skipped.
Windows p95 was 15.6 ms. Both retained ordinary core protections and browser resize/
navigation checks. Neither target qualifies the new graph-reopen/duration assertions.
Legacy packaged boundary, secret scan and dependency inventory were skipped on both.
Final G1/R1/R2 and human acceptance remain incomplete; earlier evidence is preserved.

## Artifact integrity and limits

Both GitHub archive digests/lengths, ZIP CRCs and all 29 extracted files verified
(7 macOS, 22 Windows). All 101 Windows app/workflow input hashes matched the tested
Git tree, with exact candidate/run/attempt identity. Windows executable digest is
recorded in the ledger but cannot be independently rehashed: package uploads were
skipped and no binary is available. macOS never generated that manifest or package.
Four Runtime browser screenshots were inspected; these use an injected requester
and synthetic input, not successful packaged/native interaction.
Raw logs/API records, original ZIPs, extracted files, verification manifest and computed
assessment are preserved outside Git at workspace `reports/r2-p1-ci-36293797731`.
G1-OBS's previous qualification and 126 ms/1,058.6 ms frame outliers remain in ledger 22.

## Next bounded decision

No CI operation or task-created local writer/watch process remains outstanding.
This assessment made documentation changes only; no redispatch, production fix or merge.
R2-P1 remains blocked. Proposed next checkpoint: identify the Windows packaged-startup
stack overflow and determine whether it affects the probe path or ordinary launch,
then propose the smallest supported correction. That investigation needs user selection.
Keep the macOS budget failure open for a separate bounded diagnosis/decision.
Do not rerun the matrix, relax budgets, change production code, add native automation,
request human acceptance, resolve merge conflicts or merge from this handover alone.
