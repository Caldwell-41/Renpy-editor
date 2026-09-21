# Current status

**Updated:** 2026-09-21.
**Integrated application:** Phase 0 and corrected Phase 1A-1E.
**Integrated maintenance:** CI-SIMPLE, [PR #13](https://github.com/Caldwell-41/Renpy-editor/pull/13), merge `998b5f4684c5c287920bfda67d12e818e3bd0371`.
**Active milestone:** [Phase 1F Source synchronisation](../tasks/active/phase-1f-source-synchronisation.md), not accepted or ready to merge.
**Selected correction:** [1F-SAVE](../tasks/active/phase-1f-save-correction.md), `not_started`; implement and verify the reviewed command/harness correction before target validation.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, existing draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Latest application candidate:** `4dfedd24b4831972376d69fde216ad2063d708d4`; tree `f925db131c27fd744d13b64fadd6019ab370e1ea`.
**Reviewed documentation-only head:** `3aebbcd9aff8a051e28f5b92dc6e50ee324dd3b5`; this later planning update also changes documentation only.
**Continuation:** [HANDOVER](HANDOVER.md).

## Accepted baseline

Phase 1E PR #9 merged as `f1be3f0745f76e46113df7d3e84e70e13ee9d9c9`.
PRs #7/#8 and corrected 1A-1D are integrated. The
[Scene ledger](../tasks/archive/2026-09-16-phase-1e-scene-authoring.md),
[Phase 1 plan](../tasks/active/phase-1-vertical-slice.md), and
[CI-SIMPLE closeout](../tasks/archive/2026-09-20-ci-simple-cleanup.md) retain their evidence.
Completed entry checks and merged-branch housekeeping must not be replayed.
W0/OPT-1A remain abandoned; their PR #12 and history remain unmerged.

## Why another bounded correction is required

The reviewed packaged smoke falsely marks unchanged selection updates dirty. Source
Save can complete and then be re-dirtied by its fake service, so the composite timeout
is not proof that Source Save never ran or global Flush stole its shortcut. The
[corrected diagnosis and evidence limits](../tasks/active/phase-1f-save-correction.md#1-evidence-and-corrected-diagnosis)
supersede earlier causal interpretations without discarding historical failures.

[ADR 0007](../adr/0007-shell-save-command-ownership.md) selects one shell Save owner,
a document-bound Source controller, reliable retention barriers, coordinated
operations/leave handling, and authoritative status. These fixes are planned, not
implemented. The existing source, transaction, recovery, mapping and history
foundation remains; no Phase 1F restart is authorised.

## Evidence and next action

Production runs `35544944804` at `4fc54455` and `35553029892` at `822e3fbe` failed on
both supported targets at packaged Source acceptance. Quality run `35554153917` passed
for `4dfedd24`; the reviewed history has no production acceptance for that candidate.
The parent ledger preserves local counts, unavailable Linux desktop dependencies and
exact failed-run records. None is acceptance for the new correction.

Implement 1F-SAVE, run its local regressions and self-review, then validate the corrected
candidate under the selected goal. Do not dispatch the old capture candidate as the
next action. Missing native input/real-service evidence remains an explicit blocker.
Do not merge PR #14, begin 1G, create another delivery line, or revive abandoned CI work.
