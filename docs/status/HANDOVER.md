# Current checkpoint handover

**Prepared:** 2026-09-25. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** Phase 1G.2a R1-B1/B2 correction — `in_progress`; R1 not yet accepted.
**Branch:** `feature/phase-1g-branches-runtime`. **Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Entry publication:** `15f6d1b07916a9e29ffdc820b871063acfaf5d44`.
**Initial correction candidate:** `fd4ffca38373790f730818bbf9e6c8a388dac92f` (now superseded by the completed-receipt race correction).
**Verified main:** `924619def6f624f336032c3ebc8499ccfcc662f0`.

## Correction and evidence

The replacement implementation separates service checkout from independent token-bound
Stop/status/revoke, returns cancellable request receipts before inventory/rechecks, and
releases the renderer lease on receipt. Native dialogs revalidate their captured session.
Cancellation reaches inventory/hash and supervisor startup. Terminal cleanup does no
freshness hashing; results remain conservatively stale until complete new preparation.
Unix confirms group disappearance independently of output closure; failed cleanup keeps
its owner and reservation, including repeated shutdown.

New deterministic tests cover production dispatch cancellation at prepare/grant/start,
zero spawn attempts, stale completion, retained drafts, held service work, stale dialogs,
actual service switch/Cancel/Stop/shutdown/Drop with descendants and closed output, starting/
validation cancellation, injected cleanup-confirmation failure, and real history and
file lifecycle refusal/no-write/Stop/retry. The real pinned-SDK gate also traverses the
new desktop host path. Details and local results are in
[ledger 13](../tasks/active/phase-1g-branches-runtime-git.md#r1-b1b2-correction-and-replacement-candidate-assessment--2026-09-25)
and [ADR 0008](../adr/0008-controlled-runtime.md).

## Preserved runs and publication boundary

Existing production `36136466567` attempt 1 remains PASS on
`ad2627c4a0347261098f12883419672ecffc6e29`; prerequisite `36126490939` remains PASS
for SDK/reload feasibility. Both were already inspected and are not duplicated.
Failed/superseded `36135942863` remains FAILED with its skipped gates. Their full hashes,
job/artifact IDs, outcomes and limitations remain in ledger 13.

Initial correction candidate local validation passed: core 178/6 ignored, targeted runtime 18/2 ignored,
explicit SDK 1/0 ignored (117.37 s), frontend 49/0 skipped, Source browser/build,
desktop 1, format, repository validation (244 files) and whitespace. The corrected
candidate now needs one replacement native R1 run; record its exact identity and verify
remote contents. The final publication follow-up owns the candidate/run/attempt.

Initial correction R1 `36144599144` was in progress at inspection and is now superseded
by a bounded completed-receipt cancellation correction; preserve its eventual result.
Quality `36144604896` passed on `fd4ffca`. The correction accepts cancellation during
competing service ownership and defers teardown safely; its held-owner regression is
included in the new candidate. See the latest ledger entry for this exact distinction.
If CI is outstanding, publish the exact manual-resume handover and stop active polling,
as required by AGENTS/WORKFLOW. No qualified automatic continuation is configured.

An isolated continuation checkout preserves older worktrees/evidence branches. Visible
prior Renpy tasks were idle; cross-host ownership is not independently observable. Recheck
refs before publication. Keep PR #17 draft/open. Continue only this R1-B1/B2 correction
and evidence assessment; no user physical testing, merge, 1G.2b, optional Git or Phase 2.
