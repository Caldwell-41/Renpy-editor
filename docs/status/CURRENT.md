# Current status

**Updated:** 2026-09-20.
**Integrated application:** Phase 0 and corrected Phase 1A-1E.
**Integrated maintenance:** CI-SIMPLE, [PR #13](https://github.com/Caldwell-41/Renpy-editor/pull/13), merge `998b5f4684c5c287920bfda67d12e818e3bd0371`.
**Active application milestone:** [Phase 1F — Source synchronisation and partial-visual handling](../tasks/active/phase-1f-source-synchronisation.md), implementation complete and awaiting the dispatched supported-target gate on `feature/phase-1f-source-synchronisation`, draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Implementation candidate:** `4fc544559e9f5d7ea8d591f08b95fb58bf2c30ef`; its tree `50e503c0403afaa01bc95779212a9ce66391555e` exactly matches the locally validated implementation commit.
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

## Phase 1F validation snapshot

The candidate implements the existing-`.rpy` Source inventory, bounded session-local
drafts, explicit Source Save and all-before-write Save All, transaction/source-map/
history integration, conservative supported/opaque mapping, exact external conflict
reconciliation, same-file guards, the Source centre workspace, bidirectional selection,
truthful persistence states, and close/switch/normal-exit choices. It does not add a
raw source lifecycle, autosave journal, general parser, Branches, Run/Validate, Git UI,
new renderer authority, or Phase 1G work.

Local acceptance passed: 209-file repository validation; whitespace; Rust format and
clippy; core 150 total / 146 passed / four intentional subprocess-worker ignores;
frontend 19 passed plus production build; lossless-source 26 passed; SDK adapter/archive
24 passed; and the 620,000-byte/40,000-node benchmark at 237.50 ms median. Local Linux
desktop/package compilation was unavailable because the client lacks `pkg-config` and
GLib development metadata; it is not substituted for supported-target evidence.

Repository quality run `35544769657`, attempt 1, passed at the exact implementation
candidate. Production run `35544944804`, attempt 1, was manually dispatched at that
candidate with Windows x64 and macOS ARM64 package/smoke jobs and was queued at this
publication snapshot. Its smoke gate now requires `sourceAuthoringUiPassed: true` and
`sourceAuthoringStage: complete`.

## Scope now

Do not merge or start 1G. Independent review should inspect PR #14 and the actual
production-run outcome. If that run passes, Phase 1F is review-ready; if it fails,
continue only the demonstrated Phase 1F correction on the same branch and PR.
