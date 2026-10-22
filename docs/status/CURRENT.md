# Current status

## Selected Help-screen outcome

2026-10-22: Corrected app source `5925bb6` passes the signed Mac WebView-to-SDK Help
workflow. The exact package verifies signature, ARM64 and installer identity. Native
proof covers accepted bytes, Undo/Redo, Cancel/reopen, SDK validation, 760x360 geometry,
frozen-revision staleness and Stop with exit 0, no errors and owned scratch/process
cleanup. [The brief](../tasks/active/help-screen-production.md) owns scope;
[the evidence](../tasks/evidence/help-screen-production.md) owns hashes and receipts.
The three original review findings are closed at source/local-regression scope.
Final visual/functional approval remains with the selecting chat.

CI1 run 39702239464 at 00ee110, attempt 1, failed before Windows SDK/package/native work.
Mac lacked the frontend build before desktop check; Windows scratch cleanup retained
its own delete-blocking handles. Both causes are corrected at 5925bb6. Local13 passes
focused scratch/context-drop/runtime/source/request tests, build/check and validators.
CI2 is ready under the existing ordinal 2 selector, which skips service previews.
Windows native qualification and two-aspect service proof remain missing.

Actual use is local 13/13; Mac packages 3/3, native launches 2/3 and SDK previews 7/8.
Windows packages 0/2, launches 0/3 and previews 0/4; focused CI 1/2 before CI2 dispatch.
No fourth Mac package or fourteenth local batch is authorized. Preserve unrelated
maintenance and private receipts. Material flow-v1 differences remain unaccepted.
No PR, merge or release is authorized.

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
