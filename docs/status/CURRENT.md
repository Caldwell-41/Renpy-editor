# Current status

**Updated:** 2026-09-21.
**Integrated application:** Phase 0 and corrected Phase 1A-1E.
**Integrated maintenance:** CI-SIMPLE, [PR #13](https://github.com/Caldwell-41/Renpy-editor/pull/13), merge `998b5f4684c5c287920bfda67d12e818e3bd0371`.
**Active application milestone:** [Phase 1F — Source synchronisation and partial-visual handling](../tasks/active/phase-1f-source-synchronisation.md), bounded review corrections published on `feature/phase-1f-source-synchronisation`; corrected supported-target evidence is pending on draft [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
**Corrected implementation candidate:** `822e3fbeea9e90409ecc66988322cc524309468c`; its tree `bb8fca46a99b6e07cdee9898c7b0f1b938fd5d51` exactly matches local correction commit `026209493f5c7ea16433564ec4844e436ac631d3`.
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

Independent review demonstrated three blockers in the prior candidate: production run
`35544944804` failed both supported targets in the packaged Source-focused save step;
clean externally-invalid mapped source could make Source open fail; and draft-destroying
actions lacked confirmation. The corrected candidate preserves current invalid bytes,
marks Source invalid and Scene projection stale/conflicted, blocks affected writes,
adds confirmed discard/reload with Cancel/no-change, provides real Copy Draft, and makes
the native smoke save event deterministic with the actual failure appended to its stage.

Corrected local acceptance passed: 209-file repository validation; whitespace; Rust
format and core clippy; core 151 total / 147 passed / four intentional subprocess-worker
ignores; frontend 21 passed plus production build; lossless-source 26 passed; SDK
adapter/archive 24 passed; and the 620,000-byte/40,000-node benchmark at 224.81 ms
median. Local Linux desktop/package compilation was unavailable because the client
lacks `pkg-config` and GLib development metadata; it is not substituted for
supported-target evidence.

Repository quality run `35552625358`, attempt 1, passed at the exact corrected candidate.
Production run `35553029892`, attempt 1, was manually dispatched at that same SHA with
Windows x64 and macOS ARM64 package/smoke jobs; preflight was in progress at this
publication snapshot. No supported-target success is inferred while it is non-terminal.

## Scope now

Do not merge or start 1G. Inspect production run `35553029892` once it is terminal and
review its actual jobs/log markers. If it passes, Phase 1F is ready for independent
review; if it fails, continue only the exact demonstrated Phase 1F blocker on this same
branch and PR.
