# Current checkpoint handover

**Prepared:** 2026-09-22.
**Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** **1F-CLOSEOUT-CORRECTION**, **awaiting_ci / blocked on external validation; manual resume**.
**Corrected application candidate:** `f452d0a8c1599b05650ae2e835d14d9f86f14653` (published).
**Run:** [production #88 / 35732725675](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35732725675), **attempt 1**, `upload_packages=true`.
**Last observed:** in_progress; Preflight `106762105167`, candidate SHA verified. No target pass/package claim.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Entry head:** `baf7a00bab8a7e7af84c19a690bad2bf2e1c628c`.
**Verified main:** `75a91c5f72cd0eac8586faf2be036ec5021a939d`.
**Authority:** user authorised F1–F3 correction/validation and publication only; stop for independent review. No merge, branch deletion, Phase 1G or signing work.
**Detailed evidence:** [ledger section 7.23](../tasks/active/phase-1f-save-correction.md#723-1f-closeout-correction).

## Completed correction

Apply Both now carries the exact reviewed base/draft/external revision and combined
text through a dedicated JSON request; core refuses a stale review before proposing
writes. Renderer checks before and after retention and requires refresh for stale review.
Preview's Add change here retains the selected Beat anchor. Background clears Characters
and their layer uncertainty while preserving unrelated uncertainty.

The three failing entry probes now pass and also run in normal regression coverage.
Real JSON/service tests cover stale identities/sessions, no-write/draft preservation,
successful persistence/reopen, overlap/same-position/Custom Code boundary ambiguity,
and Scene insertion adjacency/reopen/missing-anchor refusal. Production-proposal
transaction races preserve external bytes and existing final-window recovery behavior.

Local validation: frontend typecheck + 38 tests; build; browser Save regression; pinned
Rust formatting; core 153 passed / 4 ignored worker tests; lossless Python 26 passed;
benchmark passed. Legacy Python SDK suite is 23 pass / 1 host process-group permission
error after correcting the local interpreter/path setup. Explicit official-SDK, desktop,
packaging/smoke and supported-target validation remain for the existing CI workflow.
Node/npm differ from pinned CI. No claim of native testing of the corrections.

## Preserved evidence and remaining work

#87 (`35719829561`, attempt 1, SHA `0b9ea0f0c23f843b3324cd63a524a642a2399f2e`)
remains successful historical evidence, not a pass for these corrections. All six native
Save passes remain user-reported PASS. User confirmed both installed build #87, macOS
26.6.2 and Windows “the latest windows version”; numeric Windows build unspecified.
No repetition of unchanged native Save tests. Any new native follow-up is limited to
F1–F3. DIST-MAC-01 remains outside scope.

## Manual-resume boundary

The candidate is committed/pushed on the existing branch. Production #88 was dispatched
once and its attempt/SHA verified directly. No second dispatch, watcher or automatic
wake-up is claimed. Under AGENTS/WORKFLOW stop active polling here. The documentation
follow-up records this external wait without changing application/CI inputs; it does
not require another package matrix.

On manual resume, inspect #88, attempt 1, for the exact candidate above. Verify all
preflight and Windows x64/macOS ARM64 jobs, actual core/desktop regression results,
explicit official-SDK gates, packaging/smoke and actual package/evidence uploads.
Retain failed/skipped results and diagnose before any new dispatch. Do not treat a
successful job alone as proof of package availability. Update the same ledger/status/PR
with terminal evidence, then stop for independent review. No merge or branch deletion.
If focused native validation is needed, use the corrected packages for F1–F3 only;
the six unchanged #87 native Save passes remain recorded. Windows numeric build is
still unspecified. No automatic application acceptance is claimed from local checks.

PR #14 remains draft. Keep all branches and active 1F records. Existing Phase 1G
planning is integrated; no further planning or implementation is selected.

Next-chat selector:

```text
/goal — Phase 1F correction validation and independent review only
Repository: Caldwell-41/Renpy-editor. Continue feature/phase-1f-source-synchronisation
and draft PR #14. Read AGENTS.md, docs/status/HANDOVER.md and correction ledger 7.23.
Inspect #88 / 35732725675 attempt 1 on f452d0a8c1599b05650ae2e835d14d9f86f14653;
do not redispatch. Record exact terminal evidence and review F1–F3 independently.
Preserve native Save passes. Publish the handover and stop; no merge, cleanup or 1G.
```
