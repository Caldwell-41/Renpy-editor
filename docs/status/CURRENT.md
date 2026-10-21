# Current status

## Phase 3B Screens refinement

2026-10-21: Branch `codex/phase3b-screen-designer` starts from Phase 3A at `571e76c`.
The [grilling agreement](../tasks/active/phase-3-initial-wysiwyg-release.md#agreed-3b-design-from-the-grilling-session)
records approved product choices. Mac is the chosen development host.
[CI1's audited evidence](../tasks/active/phase-3-initial-wysiwyg-release.md#ci1-terminal-audit-and-prototype-continuation)
qualifies the narrow source/runtime proof at `0ef1748` on Windows x64 and macOS
ARM64. No CI is pending.

The user prefers Screen builder. Its
[final Design continuity review](../tasks/active/phase-3-initial-wysiwyg-release.md#design-section-continuity-and-final-experience-review-2026-10-22)
is `review_ready`. Reuse-look and font-picker actions keep editing sections open;
deliberately closed sections stay closed. Design/Connect remember sections per
selected element. Form updates retain panel scroll and keyboard focus; pickers return
focus to their launcher. All three mockups share the repair. Earlier list dragging,
double-click Design, canvas resizing and Depth controls remain qualified.
[Comparison notes](../design/design-lab-screens/README.md) own controls and limits.
All three approval entries remain null; next is user review.

Combined continuity local2 passes TypeScript, approval/source checks, 508 rendering
cases and 20 interaction groups without browser errors. Visual review covers the
changed Design states; all 12 matrix captures match the previously reviewed set in
both themes/sizes. Final use is continuity local2/3; the unused repair cycle is
closed. No repair or verification is pending. Browser actions stay in fictional
memory. Earlier allowances stay closed. Work is saved locally.

## Earlier full-app mockups

The [12-page comparison](../tasks/active/browser-ui-design-lab.md#full-app-comparison-and-characters-refinement-2026-10-20)
retains its earlier `review_ready` result of 448 cases and 19 groups. Its 24 app
layouts and the starter remain unapproved; Screens adds three current candidates separately.
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
