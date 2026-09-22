# Current checkpoint handover

**Prepared:** 2026-09-22.
**Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** [1F-SAVE-EVIDENCE final-report scope correction](../tasks/active/phase-1f-save-correction.md#716-final-report-lexical-scope-correction).
**State:** locally verified; publishing one candidate for Repository Quality and one production gate. P5 and native P3 remain open.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Reviewed baseline:** `1d5704b738de25a1b95197cc0866f866ae52826d`.

## Completed and verified locally

Moved the single trace declaration out of the authoring try into callback scope;
collection/assertions and all other production behavior are unchanged. Added one
actual-probe/real-shell executable test group to existing frontend discovery.
Red: all three cases hit `ReferenceError: sourceCommandTrace is not defined`.
Green: all three now submit exactly one truthful report, including failure/incomplete
trace rejection. Full check 32/32, build, syntax, repository validation (216 files)
and whitespace passed. Exact commands and self-review are in section 7.16.

Native #83 post-conflict timing was 1,017 ms Windows / 5,157 ms macOS, well before
300 seconds. Timing does not prove an IPC stall; the scope error is reproduced
locally. Corrected native acceptance is not yet established.

## Next bounded action

After Repository Quality passes for the corrected candidate, verify no equivalent
production run is active or ambiguously dispatched, then dispatch the existing gate
once. Record exact SHA/run/attempt/jobs. Both supported targets must produce accepted
final reports and complete artifact secret scan and dependency/licence inventory.
Under repository waiting rules, publish pending/manual-resume state if the run is
still active; do not model-poll or claim automatic continuation.

If the gate fails, retain exact error, timings, SHA/run/jobs and stop for independent
review. Do not increase timeout, rerun the SHA, experiment with yielding, split smoke,
or modify Source Save. No merge, new branch/PR or Phase 1G.

## Native P3 — outstanding

No trusted native keyboard input is available here. On the exact packaged candidate:

- Windows x64: dirty Source Ctrl+S accepts; clean Source Ctrl+S performs ordinary
  Flush; non-Source Ctrl+S does not accept Source.
- macOS ARM64: repeat with Cmd+S.

Record package identity, OS/architecture and outcomes. Synthetic events are not P3.
