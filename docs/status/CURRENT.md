# Current status

## Phase 3B revised Screen notebook ready

2026-10-21: Branch `codex/phase3b-screen-designer` starts from Phase 3A at `571e76c`.
The [grilling agreement](../tasks/active/phase-3-initial-wysiwyg-release.md#agreed-3b-design-from-the-grilling-session)
records all approved product choices. Mac is the chosen development host.
[CI1's audited evidence](../tasks/active/phase-3-initial-wysiwyg-release.md#ci1-terminal-audit-and-prototype-continuation)
qualifies the narrow source/runtime proof at `0ef1748` on Windows x64 and macOS
ARM64, including the 720×360 panel and exactly one continuation after Close.
No CI is pending.

The user prefers Screen notebook. Its revised [Screens draft](../design/design-lab-screens/README.md)
is `review_ready`, with plain directions, help tooltips, front/back ordering and a
larger preview with border resizing and Focus preview. The original three layouts
remain available. Refinement local3 passes 80 focused cases and four journeys;
local4 passes TypeScript, approval/source checks, 528 rendering cases and 20 groups.
The [refinement record](../tasks/active/phase-3-initial-wysiwyg-release.md#screen-notebook-refinement--2026-10-21)
owns final local4/4 use and the two earlier focused failures. No repair is pending.
All four approval entries remain null. User selection and recorded approval precede
live Screens implementation. Browser controls use fictional memory only; the earlier
source proof's local11/11 and native/CI allowances stay closed.

## Earlier full-app mockups

The [12-page comparison](../tasks/active/browser-ui-design-lab.md#full-app-comparison-and-characters-refinement-2026-10-20)
retains its earlier `review_ready` result of 448 cases and 19 groups. Its 24 app
layouts and the starter remain unapproved; Screens adds four candidates separately.
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
