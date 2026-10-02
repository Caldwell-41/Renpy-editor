# Phase 3 — Initial WYSIWYG release

**Planning date:** 2026-10-02. **State:** draft for review; implementation `not_started`.
**User direction:** plan Phases 2 and 3 alongside ongoing Phase 1G; deliver richer
Story logic before the screen designer in Phase 3.
**Owner:** this brief owns Phase 3 capability boundaries and acceptance planning;
[ROADMAP](../../ROADMAP.md) owns the overall sequence, and
[PRODUCT](../../PRODUCT.md) retains the initial-release commitment.
**Entry:** accepted/integrated Phase 1 including 1H, accepted Phase 2, fresh refs and
implementation inspection, and selection of a bounded implementation outcome.
Planning can continue now. No implementation, integration, release or new CI dispatch
is selected by this document.

## 1. Outcome and first usable results

An author can build branching story logic, design supported game screens, time VN
staging/audio, inspect a supported starting state and run from it, then checkpoint
and reopen the game. Visual changes remain ordinary Ren'Py source, editable outside
Loomlight and runnable without editor metadata.

Phase 3 is substantially larger than Phase 2. Deliver reviewable capabilities along
the way; do not hide the first usable result behind completion of every workspace.
The order below is proposed except for the user's selected Story-before-Screens order.
No calendar estimate is committed before the source/SDK feasibility checks.

| Checkpoint | First usable result | Completion boundary |
| --- | --- | --- |
| 3A — Story logic | A variable changes which choice is available; a called Scene returns to its caller. | Supported conditions/calls agree across Story, Source, Branches and actual runtime. |
| 3B — Screen designer | Edit one supported screen using hierarchy, canvas and properties, then inspect it in Ren'Py. | Declared screen subset, reusable supported components, source reconciliation and accessible editing pass. |
| 3C — VN Timeline | Animate an existing character and schedule music/SFX relative to a supported beat. | Declared timing/transform/channel subset survives Source edits, undo and reopen and matches runtime comparisons. |
| 3D — State and Run From Here | Inspect one explicit route's effective state and start at a supported point. | Provenance, unknown-state refusal, call-stack constraints and isolated launch behavior pass. |
| 3E — Workflow and GitHub | Review local changes, checkpoint exact selected files and explicitly push to a selected private repository. | Optional local Git foundation is separately selected and accepted; supported remote/auth/error flows pass. |
| 3F — Release acceptance | Install on both supported targets and finish the integrated authoring workflow. | Agreed product coverage, distribution channel, applicable signing and release evidence are complete. |

Each checkpoint may use internal implementation/review/test commits in the same chat.
WORKFLOW governs pauses and independent review; these rows do not mandate a chat per
commit or authorize the entire phase as one goal.

## 2. Dependencies and compatibility

- 3A establishes shared condition/call semantics before 3D uses them. Branches keeps
  its observed saved-state contract; it does not become a second source of truth or
  claim complete reachability analysis.
- 3B and 3C reuse accepted source mapping, transactions, assets and history. Their
  internal source-model dependencies are checked at entry; no parallel writer is
  selected. Ship Story logic first, then Screens, then the proposed remaining order.
- 3D must account for supported visual/audio effects from 3C or explicitly refuse
  unsupported entry points. A successful jump is not proof of reconstructed state.
- 3E depends on Phase 2's production credential boundary and separately approved
  [GIT.1/GIT.2](optional-local-git.md). Existing project-creation Git init is insufficient.
  Local Git remains optional for Phases 1 and 2; it is needed for the existing broader
  initial-release promise unless the user explicitly changes that promise.
- Phase 2 assistance stays on its accepted operation allowlist. New conditions,
  screens or Timeline syntax do not automatically become LLM-editable. Excluded
  regions and unknown effects remain visible in selected context.
- Phase 4 broader analysis and Phase 5 open-world state are not prerequisites for
  honest, bounded Phase 3 support. Do not infer day/time, character knowledge or
  arbitrary Python state merely because later UI designs mention them.

## 3. 3A — Richer Story logic

**Proposed first subset:** conditions over existing bool/int/string variables using
typed literal comparisons and bounded boolean combinations; conditional choice
availability and explicit conditional branches; Scene call/return with an explicit
return point. Preserve exact integer precision. Parameterized calls, arbitrary
expressions, dynamic labels, Python evaluation and unbounded recursion are outside
the first subset pending a separate decision.

First write down the expression grammar, type/error rules, nested-block ownership,
source mappings and call/return behavior. Check these against the pinned official SDK
before promising a source format. Design the editing UX with small examples before
implementation. All edits use minimal source patches and shared transaction/history.

**Completion checks:**

- A synthetic two-route story chooses the expected option for each tested variable
  value; boundary values and missing/type-mismatched definitions are diagnosed.
- A called Scene returns to the correct continuation, including a bounded nested-call
  example. Jump, call and return remain distinct in graph navigation and diagnostics.
- Story-to-Source and Source-to-Story edits agree; unsupported expressions, comments,
  formatting and custom blocks survive unchanged. Partial/unknown conditions are
  never silently treated as false or as unreachable paths.
- Undo/redo, external-edit conflict, failed acceptance and close/reopen preserve the
  accepted source and input. Tests assert branch/runtime outcomes, not just labels.

**Early risk proof:** exercise a real nested source edit and call/return through core
dispatch and the pinned SDK before building the full condition-editor UI.

## 4. 3B — Supported screen designer

Use the canonical [UI direction](../../UI.md#screenui-designer): hierarchy plus a
constraint canvas, property editing and synchronized screen source. Proposed first
slice: one editor-created screen containing containers, text, image and a button,
with explicit position/size/alignment and a small allowlist of actions. Follow with
the reviewed initial-release subset for styles, bars, grids, viewports and reusable
components. The exact property/action inventory is a design deliverable, not assumed
support for every Ren'Py screen-language feature.

Start with a disposable custom screen. Choose which conventional generated game
screens may be edited only after proving safe ownership and round-trip mapping;
do not rewrite the full generated screen file. Arbitrary existing-project import,
dynamic screen Python, unrestricted actions and complete WYSIWYG fidelity are excluded.

**Completion checks:** create/edit/reorder supported nodes through canvas and keyboard
hierarchy; compare the selected layout and interaction states against real Ren'Py at
the chosen resolution and a second supported aspect. Reconcile a supported Source
edit; preserve an unsupported neighboring block and show partial coverage. Undo,
resize, external conflict and reopen must preserve the same source intent. Buttons
preview as inert controls in the editor; runtime actions require deliberate execution.

**Early risk proof:** round-trip one nested screen with an opaque neighboring region
and compare its actual SDK rendering before committing to the general canvas design.
Record supported properties and visible approximation limits alongside the result.

## 5. 3C — VN animation/audio Timeline

Proposed first slice: existing Appearance/placement assets, a named transform with
position/opacity changes and a small reviewed interpolation set, plus play/stop/fade
events on supported audio channels. Timing is tied explicitly to beat execution and
relative event order. Authoring time, preview time and actual runtime time have
distinct meanings. Dialogue interactions can wait indefinitely; do not invent a fixed
duration for an entire interactive Scene.

The broader canonical track list is a design direction, not automatic first-slice
support. Inventory camera/effects/voice/movie/loop behavior before 3C approval and
identify which are in its release subset. Full video editing, unrestricted ATL,
arbitrary Python interpolation and sample-accurate synchronization are excluded.

**Completion checks:** preview/play/scrub supported effects with disclosed limits;
change timing numerically and by keyboard; preserve source mappings and unsupported
ATL; undo/reopen; compare generated transforms and audio event order with the pinned
SDK. Define measurable duration/order tolerances from the supported behavior before
trusting the gate. Do not use an unexplained screenshot similarity threshold.

**Early risk proof:** one combined transform/audio sequence survives a source edit,
transaction and real runtime comparison before adding the full Timeline workspace.

## 6. 3D — Supported state and Run From Here

Represent defaults, selected route decisions, supported assignments, call context,
presentation/audio state and source revisions with provenance. Distinguish computed
supported state, a recorded/saved route and explicitly synthetic manual input. A saved
snapshot is usable only under a proven compatibility rule; otherwise it is stale.

Select one bounded route and target, account for repeated visits and branch decisions,
and show unresolved prerequisites. Unknown Python, dynamic control flow, unsupported
effects, ambiguous call stacks and incompatible revisions block the affected launch
claim. Manual values remain visibly synthetic and cannot erase unknown runtime side
effects. The first launch subset may be Scene boundaries with no active call stack;
that restriction must be explicit before implementation, not discovered at acceptance.

**Completion checks:** compare a normal play-through and a supported start at the
same target for relevant variables, route, return behavior and presentation. Change
a prerequisite revision and verify invalidation. Custom effects refuse or expose
an explicitly limited mode without claiming reconstruction. Stop/cancel/session-switch
behavior reuses runtime ownership, and saves/profile data stay isolated from ordinary
play. Development harness files must be absent from distributable game output.

**Early risk proof:** establish one normal-run versus reconstructed-start equivalence
case with the real SDK. Reassess the proposed subset if this cannot be demonstrated;
do not substitute a label warp for that evidence.

## 7. 3E — Workflow and GitHub

Select and complete the existing optional local Git brief before remote work. Reuse
its reviewed file inclusion, exact-byte checkpoint and external-index protections.
Phase 3E's proposed remote minimum is explicit authentication, selected repository and
branch, fetch/status and reviewed push. Divergence produces a refusal with actionable
guidance. Automatic sync, force-push, broad credential scopes, repository visibility
changes and general merge/conflict editors are outside this proposed minimum.

Confirm that minimum against the product's private-repository workflow before
implementation; pull/clone support is an open scope decision, not implied arbitrary
project import. Use synthetic repositories for evidence. No private project content
is transmitted just by opening the Git surface.

**Completion checks:** exact selected checkpoint; unrelated staged work retained;
remote ahead/diverged, revoked credentials, interrupted network and reopened app
states handled without data loss or duplicate actions. Secrets remain outside the
renderer/project/logs. Asset/diagnostic/recovery improvements here must name observed
user problems; this is not an unlimited cleanup bucket or replacement recovery system.

## 8. 3F — Release and evidence

Before final qualification, map every initial-release PRODUCT workflow and all five
major workspaces to implemented capability and actual evidence. A first usable slice
is not completion of the broader requirement. Missing agreed capabilities require
completion or an explicit product/roadmap revision; never silently lower the exit gate.

Use synthetic content for create → author conditional/called routes → screen edit →
Timeline edit → Source reconciliation → reviewed LLM proposal → supported Run From Here
→ local checkpoint/selected remote workflow → recovery → close/reopen. Exercise both
normal routes and run a copy without editor metadata. Record each capability's limits.

Agent-owned focused tests run at the changed boundary; native input, credential,
rendering, audio/runtime and packaging evidence runs on affected Windows x64/macOS
ARM64 targets. Test the first risky production path early. Final integrated evidence
covers both targets. Human review is focused on actual visual/input/interaction needs;
routine automated testing is not delegated to the user. Reuse follows implemented
TESTING policy and exact changed inputs, not a blanket cross-SHA waiver.

Keep ordinary conflict/interrupted-save regressions. Use non-crashing fault/state
fixtures for recovery; no renewed hostile same-user filesystem or deliberate process-
termination programme. Required-case omissions must make gates fail. Keep cumulative
problem costs and reassess after two unsuccessful corrections of one hypothesis.

Select audience/channel before release preparation. Follow ROADMAP's existing private
versus broader-distribution policy, including signing/notarisation where required.
Install/upgrade behavior, package privacy, dependency/licence inventory, known limits
and exact tagged source/package evidence must be recorded. No publishing is selected
by this planning task and no date is promised.

## 9. Decisions and planning continuation

| Decision | State / next action |
| --- | --- |
| Story logic before screen design | User-selected 2026-10-02. |
| Remaining order 3C → 3D → 3E → 3F | Proposed; dependency order above retained if priorities change. |
| Condition grammar and call parameters | Proposed bounded subset; confirm in 3A design and SDK proof. |
| Screen properties/actions and generated-screen ownership | Inventory and mockup before 3B implementation selection. |
| Timeline tracks, timing model and supported effects | Inventory and real-path proof before 3C selection. |
| Run From Here entry points and state provenance | Resolve before 3D; unknown state never counts as proven. |
| Git minimum, pull/clone expectations | Confirm before selecting GIT.1/GIT.2 and 3E. |
| Release audience, signing access and schedule | Open until release planning; no service or signing purchases selected. |

Planning branch: `codex/phase-2-3-planning`, forked from local Phase 1G checkpoint
`de2fdad21193bb4d1089d00702d8d71600b4750d`. Phase 1G remains active in its original
checkout. This branch changes docs only and does not qualify or accept Phase 1.
The existing HANDOVER carries a short concurrent-planning note; no second handover
or orchestration system is created. The Phase 2 brief retains its own requirement IDs.

Next: review the proposed subsets, then refine the earliest undecided scope. After
Phase 1 acceptance, select Phase 2's bounded provider qualification outcome first.
At implementation entry use the current accepted baseline, not this historical fork.
Codex can plan on any host; documentation validation needs no native build/app launch.
Implementation briefs must state affected test hosts, measured limits, finite build/
dispatch allowance and accessible prerequisites before expensive execution.

Planning validation: repository validator passed across 315 files; whitespace and
six-document scope review passed. Phase 1 application, tests and workflow files are
unchanged in this planning diff. No native/app/provider check was run. Publication
target is the separate origin planning branch; no PR or merge is selected.
