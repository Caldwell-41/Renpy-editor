# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** Phase 1G.2b **G1-O1 verified-candidate feasibility proof**, `in_progress`.
**Capability state:** G1-V1 `blocked`; no production integration.
**Branch:** `feature/phase-1g-branches-runtime`.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/unmerged.
**Entry:** `1c87e2c952e67c6e39b02cf6ba6990881f9a347d`.

The user selected G1-O1 only: core-private prototype, adversarial safety proof and
one cheap Windows/macOS profile pair, then publication and stop. Fresh refs matched
the entry; the existing clean checkout was fast-forwarded without discarding work.
No other visible active repository writer was found. Main remains `4d7ba03`; its
profiling dispatch is already represented here. Recheck refs/ownership on continuation.

## Implementation and local evidence

Read [ledger 18](../tasks/active/phase-1g-branches-runtime-git.md#18-g1-o1-verified-candidate-feasibility-proof--2026-09-27)
for code boundaries, old/new safety-check map, exact local results and explicit gaps.
All new executable paths are test-only. Source candidates never become write/trust
authority. Source-pass counts are 1,006 cold / 503 warm / 504 accepted Scene edit;
fixture source bytes total 105,627. No production flow, public transaction reader,
write path, runtime inventory or renderer changed.

Local focused tests: 12 pass. Full core regression: 196 pass / 7 ignored before the
final resource instrumentation/Windows-test additions. Preliminary local enforced
cold/warm/accepted: 78.826 / 53.248 / 57.001 ms. Supported-target three-sample native
qualification remains pending; these local timings do not close G1-O1.

## Native operation and stop boundary

The candidate includes a bounded selector in the existing quality workflow:
`phase1g_flow_profile=true`, `phase1g_candidate_proof=true`. Safety runs first,
then three sequential fresh-process samples per Windows/macOS job, 15-minute ceiling,
all failures retained, unchanged budgets and terminal marker required. No package run.
Before dispatch inspect exact published candidate and pending operations; never retry
an ambiguous dispatch. Record exact run/attempt/SHA here after dispatch. If still
pending at an external wait, use this manual-resume handover; no model polling loop.

The ledger lists unproved resource-exhaustion/boundary and authority cases separately
from O2's production ownership/dependency work. Even green native timings cannot
silently satisfy those gaps. Publish the native outcome/gaps and stop; do not advance
to G1-O2 or claim final G1/R1/R2 acceptance.

## Preserved evidence

Production `36210484651` / `ec6a76a`: Windows accepted update 616.686 ms failed;
macOS full job passed at 66.483 ms and pan p95 58 ms. Profiles `36213357271` and
`36218397984` retain the Windows acquisition/concurrency failures. Prior R1 closure
and G1-V2 evidence remain on their actual inputs in ledger 13–17. No new package,
SDK or physical verification is claimed.

Publication is the commit containing this handover and test-only candidate; resolve
its actual head from Git/PR. No receipt-only self-SHA commit. Keep PR draft/open.
