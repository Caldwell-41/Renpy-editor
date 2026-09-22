# Current checkpoint handover

**Prepared:** 2026-09-22.
**Repository:** `Caldwell-41/Renpy-editor`.
**Checkpoint:** [1F-SAVE-EVIDENCE final-report scope correction](../tasks/active/phase-1f-save-correction.md#716-final-report-lexical-scope-correction).
**State:** `awaiting_ci`; correction locally verified and published. Manual resume required; P5 and native P3 remain open.
**Branch / PR:** `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Reviewed baseline:** `1d5704b738de25a1b95197cc0866f866ae52826d`.
**Application candidate:** `85e44e926399ae7ad8431c948e1751db04dcde35` (tree `ca22dc8486a7114eeda227821582a7945a344d77`).
**Publication:** candidate and this documentation-only handoff are on the existing branch/PR; no additional production dispatch for documentation.

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

Repository Quality `35707727479` passed the exact candidate. After confirming no
equivalent active/ambiguous run, production
[35708223679](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35708223679)
(#84), attempt 1, was dispatched once and its exact SHA verified.
Preflight `106682217975` passed. Windows x64 `106682384572` and macOS ARM64
`106682384566` were in progress at handoff; the artifact list was empty.

Read AGENTS/CURRENT and section 7.16; preserve newer work. Inspect the existing run's
terminal jobs and both target artifacts. P5 requires accepted packaged final reports
and successful artifact secret scan and dependency/licence inventory on BOTH targets.
Do not dispatch again. No qualified same-thread continuation is available here, so
active polling has stopped under repository rules; this is a manual-resume handoff,
not a completed gate or claimed automatic wake-up.

If the gate fails, retain exact error, timings, SHA/run/jobs and stop for independent
review. Do not increase timeout, rerun the SHA, experiment with yielding, split smoke,
or modify Source Save. No merge, new branch/PR or Phase 1G.

## Native P3 — outstanding

No trusted native keyboard input is available here. On the exact packaged candidate:

- Windows x64: dirty Source Ctrl+S accepts; clean Source Ctrl+S performs ordinary
  Flush; non-Source Ctrl+S does not accept Source.
- macOS ARM64: repeat with Cmd+S.

Record package identity, OS/architecture and outcomes. Synthetic events are not P3.
