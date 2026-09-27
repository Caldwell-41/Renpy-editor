# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** G1-OBS, bounded qualification correction in progress.
**Authority:** user selected G1-OBS through the active goal/next-chat instruction.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/unmerged.
**Entry:** 76ebadb2dd59506c7bc57c066e421fbfac17fd2a, verified clean and matching remote.
**Published implementation candidate:** `1fab71e0e3b1ce18ee3cc5b22ab5940269a2ff88`.
Push and remote/PR head equality verified; keep the PR draft/open.

## Implemented and verified locally

Read [ADR 0010](../adr/0010-local-project-safety-and-observed-flow.md) and
[ledger 22](../tasks/active/phase-1g-branches-runtime-git.md#22-g1-obs-observed-branches-implementation--2026-09-27)
for the requirement/test map and exact evidence. Session-owned observed inputs,
changed-path invalidation, ordinary Source reconciliation, explicit disk refresh and
status, coalesced UI requests and independent target navigation are implemented.
Dirty Source/caret, focus/selection/pan and the last usable graph survive refresh.
The Branches timer and second all-source verification pass are removed; transaction,
recovery, execution and baseline path/privacy safeguards remain.

Local Windows release samples passed: accepted model 41.25–44.76 ms; initial/explicit
refresh 242.97–253.91 ms on the unchanged full fixture. Chromium pan p95 3.6 ms with
refresh pending; 60 UI tests, Source browser/build and broader core regressions pass.
The ledger reports all ignored, SDK-skipped and capability-filtered cases. These are
not final packaged WebView/native keyboard or official SDK acceptance.

## Native artifact audit and next bounded action

Run [36289951468](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36289951468),
attempt 1, candidate `1fab71e0e3b1ce18ee3cc5b22ab5940269a2ff88`, completed successfully
on both targets. Archive digests and all 12 extracted files verified; core/renderer
measurements and baseline link cases passed. Full logs/screenshots/JSON are retained
locally and in the run artifacts. See ledger 22 for the audit and limitations.

The artifact review found CI used npm **11.17.0**, not pinned **11.9.0**, and macOS
recorded one 1,058.6 ms frame despite passing its 59.8 ms p95. Correct the omitted npm
pin and add synchronous dispatch timing/sample order to the browser evidence without
changing its workload or p95 gate. These are the only new qualification inputs.

Publish that bounded correction and run exactly one matching Windows/macOS
`quality.yml` qualification (`phase1g_flow_profile=true`,
`phase1g_candidate_proof=false`). Record its exact run/attempt/SHA immediately.
No CI operation is currently outstanding; no local writer is pending. Preserve the
first run as passed under its actual unpinned npm environment, not final qualification.

After corrected target evidence is inspected, publish findings/handover and stop at
G1-OBS. Final R2/1G packaging/runtime/diagnostic, native-keyboard/human acceptance and
integration remain separate. No privilege change, native experiment, package matrix
or merge is selected. Preserve historical worktree and raw evidence.
