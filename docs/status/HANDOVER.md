# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** G1-OBS, `awaiting_ci`; implementation/local checks complete.
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

## Next bounded action and publication

The single bounded `quality.yml` dispatch is live:
[36289951468](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36289951468), attempt **1**, exact candidate
`1fab71e0e3b1ce18ee3cc5b22ab5940269a2ff88`, inputs
`phase1g_flow_profile=true`, `phase1g_candidate_proof=false`.
Windows job **108538000239** and macOS ARM64 job **108538000117** were verified
`in_progress` after checkout on 2026-09-27 at 02:56 UTC. Both were restoring the
Rust cache; no completed native result is claimed. The validator job is intentionally
skipped in this dispatch; the separate pull-request validator owns that check.

**Outstanding operation:** this exact run/attempt. No local build/test process or
second dispatch is outstanding. No automatic same-thread watcher is claimed.

**Manual-resume action (G1-OBS only):** inspect this exact run, collect native logs and
artifacts when terminal, verify all three cold/explicit-refresh/accepted samples,
core/UI results and rendered input/pan evidence on both targets. Include baseline
symlink cases filtered locally; distinguish SDK wrappers/explicit ignored specialist
cases from passes. Preserve failure/overrun evidence; do not redispatch on observation
timeout. Publish final findings and handover, then stop at G1-OBS.

The repository waiting rule applies: use manual resume while native work runs;
no repeated model polling, hypothetical watcher or premature checkpoint completion.
Final R2/1G package/runtime/diagnostic completion, native-keyboard/human acceptance
and integration remain separate and unapproved here.

No security/privilege settings changed, no historical native experiment resumed,
no package matrix or merge. Preserve the historical checkout and local raw evidence.
