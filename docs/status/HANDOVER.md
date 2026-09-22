# Current checkpoint handover

**Prepared:** 2026-09-22.
**Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** **1F-CLOSEOUT-CORRECTION**, in_progress; F1–F3 implemented and locally tested.
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

Next: publish the coherent corrected candidate, verify no equivalent active run,
dispatch the existing production workflow once with package upload, then record exact
run/attempt/SHA. Until a qualified watcher exists, publish a blocked/manual-resume
handover and stop polling. Inspect results without redispatch, then stop for independent
review. Keep PR #14 draft and all branches/1F records. Existing Phase 1G planning is
integrated; its implementation is not selected.
