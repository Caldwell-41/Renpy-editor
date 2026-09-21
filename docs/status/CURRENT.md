# Current status

**Updated:** 2026-09-21.
**Integrated application:** Phase 0 and corrected Phase 1A-1E.
**Integrated maintenance:** CI-SIMPLE, [PR #13](https://github.com/Caldwell-41/Renpy-editor/pull/13), merge `998b5f4684c5c287920bfda67d12e818e3bd0371`.
**Active application milestone:** [Phase 1F — Source synchronisation and partial-visual handling](../tasks/active/phase-1f-source-synchronisation.md), interrupted after a second bounded smoke correction was published on `feature/phase-1f-source-synchronisation`; supported-target validation remains outstanding on draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Latest implementation candidate:** `4dfedd24b4831972376d69fde216ad2063d708d4`; tree `f925db131c27fd744d13b64fadd6019ab370e1ea`, exactly matching local commit `3ce6e8fdd69b946d7d31d7b1104a991e1ccfb8ec`.
**Continuation:** [HANDOVER](HANDOVER.md).

## Accepted baseline

Phase 1E PR #9 merged as `f1be3f0745f76e46113df7d3e84e70e13ee9d9c9`.
PRs #7/#8 and corrected 1A-1D are also integrated; do not replay them. The
[Scene ledger](../tasks/archive/2026-09-16-phase-1e-scene-authoring.md) and
[Phase 1 plan](../tasks/active/phase-1-vertical-slice.md) retain their evidence.

CI-SIMPLE passed bounded independent review and post-merge gates. Its closeout remains
in [the archived ledger](../tasks/archive/2026-09-20-ci-simple-cleanup.md). The merged
remote cleanup branch was retired during Phase 1F entry without touching unrelated
branches or work. W0/OPT-1A remain abandoned; PR #12 and its history remain unmerged.

## Phase 1F correction snapshot

The candidate retains the existing-`.rpy` Source inventory, bounded session-local
drafts, explicit Source Save and all-before-write Save All, transaction/source-map/
history integration, conservative supported/opaque mapping, exact external conflict
reconciliation, same-file guards, the Source centre workspace, bidirectional selection,
truthful persistence states, and close/switch/normal-exit choices. It does not add a
raw source lifecycle, autosave journal, general parser, Branches, Run/Validate, Git UI,
new renderer authority, or Phase 1G work.

The first review-correction candidate `822e3fbeea9e90409ecc66988322cc524309468c`
fixed clean external valid-to-invalid Source handling, destructive-draft confirmation,
Copy Draft, and smoke failure reporting. Production run `35553029892`, attempt 1,
then passed preflight and both targets' core, SDK, desktop-boundary and packaging steps,
but failed the packaged WebView smoke on Windows x64 and macOS ARM64. Both artifacts
reported `sourceAuthoringStage: source-focused-save: Timed out waiting for Source
acceptance`; neither observed a completed Source save.

Candidate `4dfedd24b4831972376d69fde216ad2063d708d4` addresses only that demonstrated
follow-up failure. Source-focused Ctrl/Cmd+S is intercepted at the window capture
boundary before the application-wide Flush shortcut, the smoke waits for the rendered
dirty state before dispatch, and a future failure reports status plus observed calls.
The existing Source acceptance assertion remains intact. A focused regression proves
that Source save wins over global Flush and that the handler is removed with the view.

Local validation of the latest candidate passed: 209-file repository validation;
whitespace; Rust format and core clippy; core 151 total / 147 passed / four intentional
subprocess-worker ignores; frontend 21/21 plus production build; lossless-source 26/26;
SDK adapter/archive 24/24; and the 620,000-byte/40,000-node benchmark at 168.57 ms
median. Repository-quality run `35554153917`, attempt 1, passed at `4dfedd24`. Local
Linux desktop/package compilation remains unavailable because this client lacks
`pkg-config` and GLib development metadata; it is not supported-target evidence.

No production workflow was dispatched after `4dfedd24`. The Actions history still
ends with failed production run `35553029892` (#68) from the earlier candidate.
Therefore Phase 1F is not review-ready, complete, or ready to merge.

## Scope now

Do not merge or start 1G. The next bounded action is to dispatch the existing Phase 1
production gate from the current Phase 1F branch containing implementation candidate
`4dfedd24`, then inspect the actual Windows x64 and macOS ARM64 jobs and Source markers.
If it passes, stop for independent Phase 1F review. If it fails, record and address
only the exact demonstrated Phase 1F blocker on this same branch and PR.
