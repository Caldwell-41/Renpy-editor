<a id="phase-3--initial-wysiwyg-release"></a>

# Phase 3: initial WYSIWYG release

## Current state and entry

Updated 2026-10-22 on `codex/phase3b-screen-designer`; Mac is the chosen development
host. This brief routes Phase 3 scope and acceptance. Read the branch contract for
the selected outcome. The [shared source/runtime contract](../reference/phase-3-shared-contracts.md)
applies when implementing a new Phase 3 capability. The
[shared Phase 2/3 delivery contract](../reference/phase-2-3-delivery.md) owns sequencing
and shared-file ownership; specific selected outcomes retain their own limits.

| Branch | Current state | Read when selected |
| --- | --- | --- |
| 3A Story | Technically qualified; human acceptance pending. | [Story requirements and acceptance](../reference/phase-3a-story.md) |
| 3B Screens | Narrow source/runtime proof qualified; Screen builder design approved. Production workspace and full 3B acceptance remain pending. | [Screens scope, approved design and source/runtime gates](../reference/phase-3b-screens.md) |
| 3C Timeline | Planned; no implementation or native-media qualification claimed. | [Timeline and native-media requirements](../reference/phase-3c-timeline.md) |
| 3D State and Run From Here | Planned; consumes qualified 3A/3B/3C semantics. | [State reconstruction and launch requirements](../reference/phase-3d-state-run.md) |
| 3F Release | Planned; audience/channel and release selection remain open. | [Integrated acceptance and distribution requirements](../reference/phase-3f-release.md) |

## Selected Help-screen production outcome

The user selected the [first production Help-screen round trip](help-screen-production.md)
on 2026-10-22 as an early 3B exception. That brief owns its source/UI/runtime gates,
control map and cumulative allowance. Phase 2/3A human acceptance remains pending.
Mac remains sole writer. Existing documentation and workflow maintenance stays preserved.

## Acceptance and continuation

Phase 3A's [CI4 audit](../evidence/phase-3-history.md#ci4-terminal-audit-and-scoped-qualification--2026-10-14)
qualifies the scoped implementation at `49dba1f`; the
[3B CI1 audit](../evidence/phase-3-history.md#ci1-terminal-audit-and-prototype-continuation)
qualifies its narrow source/runtime proof. Neither establishes whole-phase acceptance.
The [3B approval receipt](../evidence/phase-3-history.md#screen-builder-design-approval-2026-10-22)
records the approved source/captures and completed browser checks. All earlier 3B
local/native/CI allowances remain closed. The selected production outcome above has
its own cumulative allowance.

Combined Phase 2/3A human acceptance remains paused at Step 3. Preserve the protected
native window, unsaved draft, isolated fixture and counters in
[HANDOVER](../../status/HANDOVER.md#native-recovery-and-remaining-acceptance) before any
native continuation. The [walkthrough implementation task](walkthrough-redesign-implementation.md)
owns its approved follow-up scope. Current card/settings decisions live in the
[walkthrough decision record](../../design/character-workspace-2026-10-15/walkthrough-decisions.md);
the [Lorebook design](../../design/lorebook-workspace-2026-10-15/README.md)
owns its refinements. Phase briefs link these owners rather than maintain copies.

For a matching failure, evidence reuse, source/run identity or earlier allowance,
search the [historical evidence ledger](../evidence/phase-3-history.md) and read the
matching section. Its old next actions, branches and approvals are historical.
[CURRENT](../../status/CURRENT.md) and [HANDOVER](../../status/HANDOVER.md) own live
project state and recovery. The selected production outcome above owns current implementation authority.
Publication remains subject to its actual payload/destination boundary.

<a id="1-outcome-and-first-usable-results"></a>

## 1. Outcome and first usable results

An author can build branching story logic, design supported game screens, time VN
staging/audio, inspect a supported starting state and run from it, then save
and reopen the game. Visual changes remain ordinary Ren'Py source, editable outside
Loomlight and runnable without editor metadata.

Phase 3 is substantially larger than Phase 2. Deliver reviewable capabilities along
the way; do not hide the first usable result behind completion of every workspace.
The shared Phase 2/3 delivery contract governs implementation; the table below names
capability completion boundaries rather than a strictly serial execution order.
No calendar estimate is committed before the source/SDK feasibility checks.

| Checkpoint | First usable result | Completion boundary |
| --- | --- | --- |
| 3A — Story logic | A variable changes which choice is available; a called Scene returns to its caller. | Supported conditions/calls agree across Story, Source, Branches and actual runtime. |
| 3B — Screen designer | Edit one supported screen using hierarchy, canvas and properties, then inspect it in Ren'Py. | Declared screen subset, reusable supported components, source reconciliation and accessible editing pass. |
| 3C — Staging, native animation and VN Timeline | Drag/resize a character; play a supplied native animation, including an idle loop during dialogue; animate transforms and schedule music/SFX. | Declared placement/media/timing/transform/channel subset survives Source edits, undo and reopen and matches native SDK output; no import conversion. |
| 3D — State and Run From Here | Inspect one explicit route's effective state and start at a supported point. | Provenance, unknown-state refusal, call-stack constraints and isolated launch behavior pass. |
| 3F — Release acceptance | Install on both supported targets and finish the integrated authoring workflow. | Agreed product coverage, distribution channel, applicable signing and release evidence are complete. |

**3E is removed.** Local Git and GitHub remain deferred optional work, outside this
phase and initial-release acceptance. Retain 3F's existing ID for traceability; it is
release qualification, not another creative feature. Existing project-creation Git init
is unchanged. Repository development commits are unrelated to this product deferral.

Each checkpoint may use internal implementation/review/test commits in the same chat.
WORKFLOW governs pauses and independent review; these rows do not mandate a chat per
commit or authorize the entire phase as one goal.

**At the end of Phase 3:** build a richer playable visual novel using supported
conditions/calls, editable game screens and timed staging/audio; inspect and launch
from a supported story state; save/reopen your work; and install a
qualified initial-release editor on Windows x64 and macOS ARM64. Unsupported Ren'Py
still remains editable as source, with visual limitations shown. Phase 3 builds on
Phase 2's cards, lorebook and reviewed generation rather than replacing them.
