# Current checkpoint handover

**Prepared:** 2026-09-22.
**Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** [1F-SAVE-EVIDENCE](../tasks/active/phase-1f-save-correction.md#7-independent-review-follow-up--1f-save-evidence).
**State:** `not_started`; detailed independent-review follow-up plan selected.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Retained application candidate:** `a720ea3fb150f2a49422e8385256179185129968`.
**Application tree:** `8edc9136aa362e180faa52421584f519aa0c0935`.

## Resume here

Read AGENTS.md, CURRENT, section 7 of the 1F-SAVE ledger and ADR 0007. Inspect actual
refs, PR/worktree and execution ownership before editing. Preserve newer work; do not
reset to the retained application SHA or replay the completed 1F-SAVE implementation.

Independent review does not request another Save redesign. The next correction is
bounded to the packaged acceptance harness and four evidence gaps:

1. require a successful CoreResponse before a smoke report enters the accepted path;
   make a rejected report terminal non-zero evidence;
2. replace the obsolete fixed 60-second whole-smoke deadline with one named 180-second
   coarse ceiling and only five coarse checkpoints; do not build a heartbeat system or
   split the smoke on the first attempt;
3. add one combined L3 shell case, two delayed L8 cases (Discard and Apply Both), and
   one deterministic L9 observation-resumption case;
4. close L16 at the semantic shell boundary rather than creating a hypothetical editor
   abstraction.

The detailed implementation, exact assertions, narrow validation commands, expected
file scope and first-attempt confidence are canonical in section 7.

## Retained evidence

Run `35624108754`, attempt 1, exact candidate `a720ea3f`:
- Preflight passed.
- Windows x64 and macOS ARM64 passed browser, core, official-SDK lifecycle,
  `phase-1f-source-save-target-gate`, desktop boundary and packaging.
- Windows packaged smoke reached every Source checkpoint through `source-complete`
  before the host timeout.
- macOS hit the same host timeout before its first Source checkpoint.
- artifact secret scan and dependency/licence inventory were skipped.
- P4 therefore passes on both real services; P1/P2 remain target-partial; P3 is native
  input and remains outstanding; P5 failed.

The previous local verification and red/green smoke-model evidence remain associated
with `a720ea3f`; do not present them as fresh results for the new candidate.

## Validation and publication

Run only the focused checks in section 7 unless implementation scope expands because a
new regression demonstrates a real dependency. Self-review the smoke-report branch,
outer bound/checkpoints and new L3/L8/L9 evidence. Confirm the Source Save coordinator,
Source core, transactions, recovery and renderer privileges are unchanged unless
evidence required otherwise.

Publish one coherent application candidate. After repository quality passes, verify no
equivalent production run is already active/ambiguous, then dispatch the existing
production gate once. Both targets must reach a terminal packaged report and continue
through scan/inventory. A future failure must be diagnosed from the new checkpoints;
do not blindly increase the timeout or rerun the same SHA.

P3 remains deliberately separate: collect actual packaged Windows Ctrl+S and macOS
Cmd+S evidence if the environment can provide trusted native input. Otherwise publish
the exact three-action manual checklist from section 7 and stop with P3 explicitly
outstanding. Synthetic key events are not native evidence.

Before ending, update the correction ledger, parent Phase 1F ledger, CURRENT, this
single HANDOVER and PR #14, verify remote publication and stop for independent review.
No merge, Phase 1G, new branch/PR, broad test replay or abandoned CI optimisation work.
