# Current status

**Updated:** 2026-09-30.
**Branch:** feature/phase-1g-branches-runtime, draft/open/conflicting
[PR #17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Main inspected:** `4d7ba0333c48d60242a9a42d3e079fea499a5531`; no integration.

## Live continuation

**Current user-selected work:** [UI refresh implementation](../tasks/active/ui-design-review.md).
The user explicitly said “okay build it” on 2026-09-30. Implementation is published on
the existing feature branch. Both native qualification attempts failed; the second
failure audit and bounded timing corrections are recorded in the
[UI ledger](../tasks/active/ui-design-review.md#second-qualification-failure-and-timing-reassessment--2026-09-30).
Accepted references remain under [docs/design/ui-refresh](../design/ui-refresh/README.md).
This does not authorize integration or erase Phase 1G evidence.

The UI refresh is implemented, but **not a qualified release**. Second
[run 36653112288](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36653112288),
attempt 1, tested `d129d9c016517ffecf7276bb04a4bb8e6fe996b1` and completed failed
2026-09-30 01:28:10 UTC. macOS passed five of six packaged UI cases; Windows passed
three of six. Earlier selector corrections passed. Route failures raced a delayed
commit receipt; Windows UI-refresh timed out before editor readiness without enough
telemetry to identify the exact native cause. Both package builds and other preceding
gates passed, but required report gates failed and boundary smoke was skipped.

Bounded corrections reproduce the route failure locally, wait for actual commit
completion and order workspace reads before early Source navigation. The latter
fixes a separately reproduced application race; it is not yet proof of the Windows
native timeout cause. Updated local verification passes 70 frontend tests, full
browser/driver checks, Rust formatting and desktop compile check. Native qualification,
physical input/drop, live SDK/create progress and human acceptance remain open.

**No workflow is pending.** The second dispatch allowance is consumed. Cumulative
refresh: two hosted dispatches, four production Tauri builds and 24 native case starts,
plus the separate early Mac debug build/launch. Proposed next decision: one focused
local macOS build and only route-a, route-b and UI-refresh native cases before any
further matrix. That build/launch allowance, another CI dispatch and merge are not
authorized. Continue the same branch/chat; see HANDOVER for exact limits.

The user approved outcome-sized goals with internal checkpoints and manual same-thread
workflow resume. [WORKFLOW](../WORKFLOW.md) owns the rules; the
[delivery brief and change record](../tasks/active/phase-1g-review-delivery.md) owns the
next outcome and this documentation update. The rules no longer require a new chat
at every checkpoint or CI wait. Actual client pause controls remain user/system-owned;
no automatic wait/wake or runtime capability was implemented or tested here.

**Prior delivery outcome (not selected by this UI review):** provide a reviewable Loomlight build, complete available bounded
Windows native checks and prepare focused final user review. Select **REVIEW-DELIVERY-1**
from [HANDOVER](HANDOVER.md). This replaces the older preparation-only next prompt;
it does not select integration, 1H or new features. The active UI workflow is recorded above.

## Phase 1G capability status

| Capability | Implemented | Automated proof | Native/human acceptance |
| --- | --- | --- | --- |
| Branches / G1-OBS | Yes, observed saved-state contract | Q1 core/browser and packaged reopen pass on both targets | MAC-N1 supporting limits retained; Windows/native and final acceptance open |
| Runtime foundation / R1 | Yes, prior corrections retained | Q1 final-source SDK service/diagnostic gates pass on both targets | Final native/human acceptance open |
| Runtime UI / R2-P1 | Yes, Windows heap fix retained | Q1 standard packages and ten Runtime cases pass | Focused final user session on each platform open |
| Integration / 1H | 1G not merged | Conflicts and affected integrated-tree gates remain | Separately selected; no automatic duplicate human pass |

## Evidence baseline, not a new qualification

Q1 [run 36383551820](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36383551820),
attempt 1, passed at candidate `8546dcddd5ac95bfe849575fe618f6e990cdd5d4`.
The [terminal audit](../tasks/active/testing-policy-alignment.md#q1-terminal-evidence-audit--2026-09-28)
and [1G ledger 41](../tasks/active/phase-1g-branches-runtime-git.md#41-q1-terminal-evidence-audit--automated-pass--2026-09-28)
retain exact source, executable and artifact identity, measurements and limitations.
Four artifacts were available/unexpired on this update; expiry is 2026-10-05 UTC.
Use the original packages as that tested candidate, not as qualification of a later SHA.

Historical R2-P1 run `36293797731` and H1 run `36310107481` remain FAIL; WIN-F1,
MAC-N1 and TEST-P2 retain their original scope/budget limits in ledger 27/32/33.
Q1 retains two requests (one HTTP 422 rejection, one accepted run), zero retries,
two Tauri builds and fourteen top-level starts. This policy change adds zero runs,
builds or launches and does not reset those totals. Phase 0 and accepted 1A-1F remain
preserved; optional Git is deferred. Read old ledgers only for relevant evidence, not
as live next-step authority. HANDOVER and the new selected brief own continuation.
