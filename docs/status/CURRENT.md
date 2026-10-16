# Current status

## CI harness reliability — deliverables1/2 complete; native plan awaiting selection

Updated2026-10-16. The [selected maintenance](../tasks/active/ci-harness-reliability.md)
is published on `codex/phase3a-story-logic` at `c33d77cf4cf5826050d1ae367d6219822dc30bc1`:
concise testing guidance/runbooks, searchable incidents, symmetric development-host/CI
routing, independent harness checks and current production-probe consumers.
Application behavior was not changed. The CI1 audit found a test fixture dependency
on ignored generated permissions, masked by a prior local build. Both-host failures
remain recorded; artifact/source identities were verified.

[Harness CI1run38878570023](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38878570023)
failed on exactc33d77c. The self-contained fixture repair is published at
`0cc56e702e514b30a01378954916a862c618a349`. Clean-export checks pass without generated
permissions/dependencies/build output. [CI2run38886792055](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38886792055)
completed success at2026-10-16T10:23:48Z on exact0cc56e7/attempt1. Both required hosts
passed all four harness groups and source/privacy/upload gates. Windows passed191
Python cases with four exact exclusions; Mac189 with two exact exclusions. Retention
passed Windows9/one exact exclusion and Mac10. Both archives/digests/manifests, source
identities and named results are audited; the new regression passes on both hosts.
The [terminal audit](../tasks/active/ci-harness-reliability.md#ci2-terminal-audit-and-deliverable2-completion--2026-10-16)
closes deliverable2. Local5/6 and pairedCI2/2 are final usage; CI1 remains failed.
Native gates are unchanged; no additional dispatch remains.
The [deliverable3 plan](../tasks/active/ci-harness-reliability.md#deliverable3-proposed-plan--current-native-connection-harness)
is prepared only; its native migration/allowance needs selection. No package, SDK execution, editor launch,
provider request, dependency update, merge or release is selected. Unrelated local
walkthrough-design and Phase2/3 task edits remain untouched and unpublished.

## Retained app baseline and pending acceptance

Thinking on by default, new response16384 and Name → Endpoint/private HTTP → native
key → Connect → model → Save remain implemented at `36feff12ff9acfc1cd6eb0832da3abba243b9463`.
Existing response limits persist; raw keys remain native-owned and reasoning stays
separate from saved writing. [CI3 and its terminal audit](../tasks/active/phase-2-initial-llm-assistance.md#ci3-terminal-results-and-retained-evidence-audit--2026-10-16)
retain both-target automated proof and the two earlier failures; that Thinking paired
allowance is closed3/3. Maintenance changes harness/workflow inputs separately.

The source-map-js development-dependency advisory remains open; no lockfile update
or packaged-runtime exploit claim was made. Full signed native/real Studio proof
still requires a matching package and observed user unlock/close. Native counts stay
packages1/2 (first stale), launches0/2, live0/4, output0/65536 and cached loads0/1.
Preserve the protected user window and existing isolated fixture.

The [walkthrough](../tasks/active/phase-3-initial-wysiwyg-release.md#restarted-combined-phase-2--3a-guided-walkthrough--2026-10-16)
remains paused Step3. Phase2/3A human acceptance is pending. [HANDOVER](HANDOVER.md)
owns continuation and exact native recovery; no prior allowance is renewed.
