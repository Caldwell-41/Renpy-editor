# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** G1-OBS, implementation complete; supported-target qualification pending.
**Authority:** user selected G1-OBS through the active goal/next-chat instruction.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/unmerged.
**Entry:** 76ebadb2dd59506c7bc57c066e421fbfac17fd2a, verified clean and matching remote.
Resolve published implementation candidate from Git/PR; do not create self-SHA receipts.

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

Publish the coherent implementation, then dispatch exactly one bounded `quality.yml`
run on that feature candidate with `phase1g_flow_profile=true` and
`phase1g_candidate_proof=false`. This changed-input qualification is selected by
G1-OBS: ordinary core/UI, three fixed U2 samples and rendered interaction on both
supported targets, including baseline symlink cases unavailable locally. It does not
package or download an SDK. Record run/attempt/SHA here immediately after dispatch.
No native CI run has been dispatched at the time this implementation record is written.

If the run remains active, publish its exact identity and use manual resume per
AGENTS/WORKFLOW. Do not redispatch on a timeout or infer completion from queueing.
Collect target logs/artifacts and inspect results before closing G1-OBS. Publish the
findings/handover, then stop. Final R2/1G package/runtime/diagnostic completion, human
interaction acceptance and integration remain separate and unapproved here.

No security/privilege settings changed, no historical native experiment resumed,
no package matrix or merge. Preserve the historical checkout and local raw evidence.
