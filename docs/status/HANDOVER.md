# Current checkpoint handover

**Prepared:** 2026-09-26. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** Phase 1G.2a R1-B1/B2 — resolved, `review_ready`; not user-accepted.
**Branch:** `feature/phase-1g-branches-runtime`. **Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Tested application candidate:** `07f23b61d46511848d2b09db57ba1d5a696cabe0`.
**Candidate tree:** `614931107db78f61c5b864a099ca2737ab546bd8`.
**Entry handover:** `90629baf4c343d3521fa7f7ed136f57f22f11d8d`; this follow-up changes documentation only.
**Verified main:** `924619def6f624f336032c3ebc8499ccfcc662f0`.

## Completed correction and evidence

`ApplicationHost` separates exclusive service checkout from session/token-bound
Stop/status/revoke and cancellable preparation receipts. Source releases its lease on
receipt and retains drafts; stale dialog completions cannot mutate a replacement session.
Cancellation reaches inventories and supervisor startup with an atomic spawn boundary.
Terminal cleanup performs no inventory and conservatively reports stale revision.
Unix checks group disappearance independently of pipes; failed cleanup retains ownership.
The final receipt-race correction also accepts cancellation during competing authoring
ownership and defers teardown to the returning session-bound owner.

Replacement [36144974132](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36144974132),
**attempt 1, SUCCESS**, matches the exact application candidate above. Complete job logs,
each artifact's six files, ZIP size/SHA-256/CRC and **all 60 input hashes per target**
were verified. Every required gate actually ran and passed; cached SDK download was
skipped, but archive verification and the explicit SDK test ran.

| Target | Job / artifact | Verified results |
| --- | --- | --- |
| Windows x64 | `108104157804` / `10868999163` | Runtime core 17 passed/2 ignored; explicit SDK 1 passed/0 ignored (79.93 s); frontend 49/0 skipped; Source browser/build, desktop 1 and format passed |
| macOS ARM64 | `108104157482` / `10868604900` | Runtime core 18 passed/2 ignored; explicit SDK 1 passed/0 ignored (118.24 s); frontend 49/0 skipped; Source browser/build, desktop 1 and format passed |

Ignored core entries are the separately invoked SDK gate and child fixture, not extra
passes. Production-dispatch cancellation/held-ownership, real service switch/shutdown/
Drop, closed-output descendants/PID liveness, failed-cleanup ownership and actual Scene
history/file-lifecycle refusal/no-write/Stop/retry cases passed on both targets.

[Ledger 13 closeout](../tasks/active/phase-1g-branches-runtime-git.md#replacement-native-evidence-and-r1-b1b2-closeout--2026-09-26)
contains the requirement assessment, exact hashes/sizes/expiry, run provenance and limits.
[ADR 0008](../adr/0008-controlled-runtime.md) owns the durable control/cancellation contract.
Kernel I/O cancellation is cooperative; failed cleanup confirmation is injected after
actual tree cleanup. Desktop's one test is smoke-report validation; lifecycle behavior
is evidenced in core. No native keyboard, packaged runtime UI or final human acceptance
is claimed. Those remain later 1G gates, not missing evidence for this bounded correction.

## Preserved work and publication

Superseded `36144599144`, attempt 1 on `fd4ffca`, actually **succeeded** on both targets;
its complete logs/outcomes were inspected and retained in the ledger. It is superseded
by the final receipt-race fix and is not final-source acceptance evidence. Historical
production `36136466567` and feasibility `36126490939` retain their verified PASS results;
failed `36135942863` retains its failures/skipped gates. No duplicate dispatch or rerun.
Final-source quality `36144979086` and entry-handover quality `36145345911` passed.

The isolated checkout preserves prior local worktrees/evidence branches. Fresh refs
showed no newer branch commit; publication uses non-forced ancestry checks. This
assessment is documentation only; repository validation passed for 244 files and
whitespace checks passed;
it triggers no native runtime/package matrix. Verify remote head/tree, handover and PR
body after publishing. No local-only implementation remains. Any automatic quality
check for this documentation commit is separate from the completed native evidence;
follow AGENTS/WORKFLOW and stop active polling if it is outstanding.

## Next bounded action

No outstanding native R1 operation and no unresolved R1-B1/B2 finding in this assessment.
Independently review **1G.2a only** from this candidate, ledger and handover; acceptance
is a separate decision. Keep PR #17 draft/open. Do not request physical testing, merge,
start 1G.2b, optional Git or Phase 2 without a new explicit scope selection.
