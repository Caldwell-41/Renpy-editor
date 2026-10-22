# Phase 3A Story requirements

Read for Story logic implementation or acceptance. The scoped implementation is
`review_ready`; [CI4](../evidence/phase-3-history.md#ci4-terminal-audit-and-scoped-qualification--2026-10-14)
qualifies `49dba1f` on both targets. Human Phase 3A acceptance remains incomplete;
Phase 2 acceptance remains incomplete. Historical local/CI budgets and prior failures remain in the
[3A ledger](../evidence/phase-3-history.md#3a-execution-ledger--2026-10-13).
No new work or allowance follows from this reference.

The scoped implementation contracts live in
[architecture](../../ARCHITECTURE.md#loomlight-created-project-convention),
[source metadata](../../DATA_MODEL.md#project-lifecycle-metadata),
[Story UI](../../UI.md#bounded-source-foundation-story-outline) and ADRs
[0014](../../adr/0014-typed-conditions-and-recursive-source-ownership.md),
[0015](../../adr/0015-guarded-choices-and-stable-call-continuations.md) and
[0016](../../adr/0016-explicit-body-story-authoring.md). Read the relevant owner
before changing that behavior. This reference keeps scope and acceptance gates;
the artwork below is a historical visual proposal. [HANDOVER](../../status/HANDOVER.md#native-recovery-and-remaining-acceptance)
owns the protected window, fixture and native acceptance recovery.

<a id="3-3a--richer-story-logic"></a>

## 3. 3A — Richer Story logic

**Scoped subset:** conditions over existing bool/int/string variables using
typed literal comparisons and bounded boolean combinations; conditional choice
availability and explicit conditional branches; Scene call/return with an explicit
return point. Preserve exact integer precision. Parameterized calls, arbitrary
expressions, dynamic labels, Python evaluation and unbounded recursion are outside
the first subset pending a separate decision.

ADRs 0014-0016 define the expression grammar, type/error rules, nested-block
ownership, source mappings and call/return behavior. Changes must preserve those
contracts and qualify any new emitted syntax against the pinned official SDK.
Use small authoring examples when changing the UX. All edits use minimal source
patches and shared transaction/history.

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

The early proof requirement covers a real nested source edit and call/return through core
dispatch and the pinned SDK before broad condition-editor work. The
[CI4 audit](../evidence/phase-3-history.md#ci4-terminal-audit-and-scoped-qualification--2026-10-14)
records the scoped proof. Reuse valid evidence; changed inputs or unresolved failures
require the relevant new proof under the selected outcome.

<a id="story-interaction-design"></a>

### Story interaction design

The image records the visual proposal requested on 2026-10-02. It is proposed
artwork; Story's typed conditions, guarded choices, Calls and structural authoring
have since received the scoped technical qualification linked above. Current
implementation behavior belongs to the canonical contracts, and human acceptance
remains separate.

![Historical Story proposal with nested conditions and a returning call](../../design/phase-3-story/nested-beats-light-v1.png)

[Artwork provenance](../../design/phase-3-story/README.md) records the saved UI
screenshot and generation. Keep Story as the familiar writing workspace with
preview, ordered Beat outline, scene tree, inline forms and shared Save/history.
The interaction requirements below take precedence over generated details.

**Example author journey:** select Add Beat → Condition, choose `trust`, “is at least”,
and `5`, then confirm once. Story inserts one expandable condition group. Add Bec's
“I can tell you what happened” dialogue to If and “Maybe another time” to Otherwise.
Continue below the group with Call Scene → Shared conversation, then another dialogue.
The group makes mutually exclusive content visible without requiring a graph editor.

| Author action | What the UI does |
| --- | --- |
| Read or collapse a condition | Label the group with its condition in plain language. Show If, ordered Else If branches, and Otherwise with indentation and a subtle nesting rail. Collapse to condition and branch/Beat counts; preserve selection and input. Outline numbers locate content, not execution order. |
| Create/edit a condition | Use typed variable/operator/value controls. Offer “All of” / “Any of” / “Not” for supported combinations, with an optional read-only source expression. Show missing variables and type errors beside the relevant field. Add Else If and Otherwise explicitly; keep branch order visible because the first matching branch wins. |
| Write inside a branch | Keep the ordinary inline Dialogue/Beat form. A breadcrumb identifies Scene / Condition / Branch. “Add Beat to If” names the insertion parent. Top-level Add Beat shows its exact insertion location before confirmation; it never guesses nesting from the selected row. Confirm new Beats once and return a collapsed saved row. |
| Reorder or move content | Up/down moves within the current body. “Move to…” selects an explicit parent branch and position, with a readable destination before apply. Provide keyboard equivalents. Moving a group moves its whole subtree; prevent moving it into itself. Dragging is optional, never the only path. One accepted move is one undo operation. |
| Continue after a condition | Show a non-editable “Continue after condition” structural separator at the parent indentation. Only branches that fall through reach it; show Jump/Return endings explicitly. If no Otherwise exists, a no-match path continues. Do not present the separator as a runnable Beat. |
| Add conditional choices | Keep the existing option editor, adding an optional “Available when…” condition and readable badge on each option. Explain where execution continues if no options are available. Distinguish unavailable, available and unknown with text; unknown is never silently disabled as false. |
| Call another Scene | A compact Call Beat names the target and says “Returns to next Beat”, with navigation to that continuation. Opening the target retains a back-to-caller breadcrumb; it does not expand or copy the target's contents inline. Keep Jump and Return visually and semantically distinct. Missing targets get an actionable diagnostic. |
| Inspect a branch preview | Offer a manual branch selector labelled “Illustrative branch preview” and “Manual selection · not a playthrough”. Keep the chosen branch separate from editing selection. Require a choice at ambiguous forks; never run both bodies in source order or infer actual state. Unsupported effects yield a partial/unknown preview. Evaluated route state arrives in 3D. |
| Cancel, collapse or navigate with a draft | Keep typed input and existing commit/cancel navigation protection. Collapsing a group with active input must not hide it silently: retain the editor or provide a visible draft marker and return action. Save status describes persisted source separately from unsubmitted form input. |
| Delete a group | Show the group's condition and contained Beat count. Explicitly distinguish deleting the entire group from unwrapping one selected branch; do not silently concatenate mutually exclusive bodies. Preserve the existing transaction/revision checks and undo. |

**Writing comfort and accessibility:** preserve Writing focus and the scene/branch
breadcrumb; do not add a mandatory right inspector for ordinary dialogue. Preview
resizes using the accepted accessible divider, without the redundant slider. On
narrow windows collapse the scene tree and wrap controls; cap visual indentation and
offer “Focus this branch” with an ancestor breadcrumb for deeper nesting. This changes
presentation, not stored nesting or scope. Provide labelled disclosure controls,
visible keyboard focus and text labels as well as color. Use existing light/dark theme
tokens and shared button sizing. Do not reduce dialogue text to fit more branches.

**Implementation connection:** 3A.1/3A.2 expose stable parent/branch identities and
continuation information. 3A.3 renders that outline and dispatches explicit insert,
move, unwrap and condition edits through the shared transaction layer. View state
(collapse, focus, manual preview route) must never rewrite source. Reconcile external
edits by stable identity; if a draft's owner changes or disappears, retain its text and
show a conflict rather than transferring it to another branch.

**UX proof within 3A.3/3A.4:** create the example above with mouse and keyboard; edit
both dialogues; add an Else If; move a Beat between bodies; collapse/reopen; cancel and
undo; reopen the project; then inspect an ordinary external edit while a child has a
draft. Verify actual source ownership and draft preservation, not only screen labels.
Check light/dark, laptop/wide layouts, Writing focus and deep nesting without horizontal
overflow. Validate both trust outcomes through deliberate normal Ren'Py execution;
manual editor preview alone cannot pass the runtime gate.

<a id="implementation-plan"></a>

### Implementation and acceptance contract

| Scope | Required behavior | Qualification evidence |
| --- | --- | --- |
| 3A.1 — Expressions and nested source | Use the shared core typed expression tree: bool variable/literal, same-type equality/inequality, integer ordering, `not`, `and`, `or`, parentheses. No calls, attributes, indexing or evaluation of Python text. Represent nested conditional blocks with ordered `if`/`elif`/`else` bodies in the source-derived Beat model. | Exact-byte no-op corpus, edits within one nested child, comments/Unicode/newlines, bounded depth/node counts, type errors and unknown expressions. Check SDK behavior for the emitted subset. |
| 3A.2 — Flow and persistence | Keep typed conditions on choice options and a nonterminal Call Beat with a stable collision-checked `from` label. Preserve existing return labels on edits. Model possible continuation after a conditional menu using block-aware completion checks. Keep map migration, history and observed graph on the same source-derived model. | Old Phase 1 fixtures reopen unchanged; all-false menu continues as Ren'Py specifies; called Scene returns to the following Beat; nested calls and remove/undo retain correct destinations. |
| 3A.3 — Story controls | Keep typed variable/operator/value controls, nested branch rows, condition badges on options and a Call Scene picker. Support keyboard insert/move and explicit moving across block boundaries. Branches shows guarded/call/continuation edges with navigation to the exact source. | One edit through actual frontend/core dispatch, coherent Source/Story/Branches, cancellation and pending input retention, useful missing/type-mismatch diagnostics. |
| 3A.4 — Qualification | Qualify a small branching fixture through normal entry with multiple variable cases and two call sites, including save inside a called Scene and return after a safe surrounding edit. | Actual route/value/return assertions, no-op/minimal-patch regressions and both affected native targets. Stable `from` labels do not promise arbitrary save compatibility after script changes. |

The scoped subset excludes parameterized/dynamic calls and while-loop authoring.
Already existing custom forms stay lossless. Add an explicit final Return/Jump where
the authored block requires one; never make an all-false conditional menu silently
fall into another Scene. A selected trace used in 3D will account for actual guarded
continuations; 3A's overview graph does not infer that every displayed path is reachable.

Ren'Py basis: [conditions](https://www.renpy.org/doc/html/conditional.html),
[conditional menus](https://www.renpy.org/doc/html/menus.html), and
[calls/return labels](https://www.renpy.org/doc/html/label.html#call-statement).
