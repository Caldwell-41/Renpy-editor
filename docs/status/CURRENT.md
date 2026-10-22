# Current status

## Selected Help-screen outcome

2026-10-22: The bounded Help workflow has audited Windows x64 and signed Mac ARM64
functional proof. [CI3](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39712450128),
attempt 1 at c2d9f45, passes both Windows service aspects and the packaged WebView/SDK
round trip. Source/history, frozen revision, Stop and cleanup pass.
[The evidence](../tasks/evidence/help-screen-production.md#ci3-terminal-audit-2026-10-22)
owns hashes, receipt limits and final counts; [the brief](../tasks/active/help-screen-production.md)
owns scope and acceptance.

The selecting chat accepted Mac proof and closed the original findings.
Final review remains there; material flow-v1 visual differences, physical keyboard
proof and whole-phase acceptance remain pending. Local/CI allowances are spent.
No run or worker audit remains pending. Preserve unrelated maintenance/private receipts.
No PR, merge or release is authorized.

Documentation/validator maintenance is complete and committed locally under
[its task](../tasks/active/agent-documentation-ownership.md) and
[ADR 0019](../adr/0019-task-briefs-and-evidence-ownership.md). It remains separate from
the Phase 3B requirement/review commit. The 213 frontend tests and 13 validator regressions
pass. No remote CI result is claimed.

## Product capability and acceptance

| Workstream | Implementation or reference | Evidence and remaining acceptance |
| --- | --- | --- |
| 3B Screens | Screen builder `flow-v1` approved; bounded Help sizing/preview published at `c2d9f45` | [Approved reference and scope](../tasks/reference/phase-3b-screens.md); Windows x64/macOS ARM64 functional proof passes. Selecting-chat review and material visual acceptance remain pending. Full 3B remains pending. |
| Phase 2 Thinking and draft connection | Implemented at `36feff12` | [CI3 audit](../tasks/evidence/phase-2-execution.md#ci3-terminal-results-and-retained-evidence-audit--2026-10-16) supplies automated both-host proof. Matching signed-Mac/real Studio and Phase 2/3A human acceptance remain pending. |
| CI reliability | Accepted at `e00160b` | [Closed task](../tasks/active/ci-harness-reliability.md) owns portable/rendered and selected Windows native proof; allowances are closed. |
| Walkthrough model-load amendment | Automated scope review_ready at `7551a9c` | [Walkthrough task](../tasks/active/walkthrough-redesign-implementation.md) distinguishes controlled proof from remaining native/live/human acceptance. |

The [Screens approval JSON](../design/design-lab-screens/approval.json) pins the
reviewed source and 13 hashed captures. Screen notebook and Canvas focus remain
drafts. [Comparison notes](../design/design-lab-screens/README.md) own fictional
controls and limits. Production integration follows its selected task and INTEGRATION;
approval is separate from implementation acceptance. Earlier 3B allowances remain closed.

The [earlier full-app comparison](../tasks/active/browser-ui-design-lab.md) retains
its original review_ready result; its 24 app layouts and starter remain unapproved.
The source-map-js development advisory remains open.

The combined walkthrough remains paused at Step3. Preserve the protected user window
and existing isolated fixture. Native counts remain packages1/2 (first stale),
launches0/2, live0/4, output0/65536 and cached loads0/1.
[HANDOVER](HANDOVER.md#native-recovery-and-remaining-acceptance) owns exact recovery;
no earlier allowance is renewed by documentation changes.
