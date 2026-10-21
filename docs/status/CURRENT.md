# Current status

## Phase 3B source proof passes; prototype verification blocked

2026-10-21: Branch `codex/phase3b-screen-designer` starts from Phase 3A at `571e76c`.
The [grilling agreement](../tasks/active/phase-3-initial-wysiwyg-release.md#agreed-3b-design-from-the-grilling-session)
records all approved product choices. Mac is the chosen development host.
[CI1's audited evidence](../tasks/active/phase-3-initial-wysiwyg-release.md#ci1-terminal-audit-and-prototype-continuation)
qualifies the narrow source/runtime proof at `0ef1748` on Windows x64 and macOS
ARM64, including the 720×360 panel and exactly one continuation after Close.
No CI is pending.

The three-layout [Screens prototype](../design/design-lab-screens/README.md) exists
in the Design Lab. State `blocked`: both local combined runs rendered 508 cases,
but the final Screens interaction journey timed out on the switcher button lookup.
Its explicit accessible-label correction is unverified. The
[task ledger](../tasks/active/phase-3-initial-wysiwyg-release.md#early-execution-ledger)
retains failures and exhausted local8/8 use; further verification needs a new user
selection. The prototype is not review-ready. All approval entries remain null;
layout selection and recorded approval precede live Screens implementation.

## Earlier full-app mockups

The [12-page comparison](../tasks/active/browser-ui-design-lab.md#full-app-comparison-and-characters-refinement-2026-10-20)
retains its earlier `review_ready` result of 448 cases and 19 groups. Its 24 app
layouts and the starter remain unapproved; Screens adds three candidates separately.
The earlier work was published before this branch. [Page notes](../design/design-lab-app/README.md)
describe fictional memory-only controls and prior references. Promotion still needs
explicit selection.

## Qualified baseline and pending acceptance

[CI harness reliability](../tasks/active/ci-harness-reliability.md#deliverable3-ci3-terminal-audit-and-completion--2026-10-17)
is accepted at `e00160b`, with both-target proof and the selected Windows native
sequence. Its allowances are closed; no CI or repair is pending there.

Thinking/default response and connection behavior remain qualified at `36feff12`
by the [Phase 2 CI3 audit](../tasks/active/phase-2-initial-llm-assistance.md#ci3-terminal-results-and-retained-evidence-audit--2026-10-16).
The source-map-js development advisory remains open. Signed Mac/real Studio proof
and Phase 2/3A human acceptance remain pending; the walkthrough is paused at Step3.
Native counts remain packages1/2 (first stale), launches0/2, live0/4,
output0/65536 and cached loads0/1. Preserve the protected user window and isolated
fixture. [HANDOVER](HANDOVER.md) owns exact recovery; no earlier allowance is renewed.
