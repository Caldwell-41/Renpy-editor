# L02 simple Help layout evidence

[#37](https://github.com/Caldwell-41/Renpy-editor/issues/37) owns scope, execution
state and acceptance. This file retains its design and verification evidence.

## Local Enter-to-Design correction, 2026-10-27

Kris selected fixing PR #62's canvas keyboard regression and keeping the changes
local. The checkout is `codex/37-compose-help-layout` at `a32d525`. Owned canvas
overlays selected on button activation but had no Enter-to-Design handler; the
aligned-frame movement handler also ignored Enter. Each overlay now receives one
Enter listener when created, independently of movement bindings. Single-click
selection, double-click and movement behavior retain their existing handlers.

Three focused DOM cases reproduced the failure before the fix. They now verify
text, text-button and movable-frame selection, Enter-to-Design, prevented default
activation and no source writes. Typechecking and all 246 frontend cases pass
through `npm run check` with Node 24.19.0 and the supported bundled Python runtime.
`npm run build` passes. A focused Chrome 156.0.8078.48 check using the production
controller and fixture IPC passes real click, Enter and double-click for all three
types, with no source writes or page errors.

The first full run exposed an incorrect label assertion in the new button test,
then corrected to `Button label`, and the previously documented system-Python
`tomllib` prerequisite failure. The supported-interpreter rerun has zero failures
or skips. The initial browser preflight could not bind its loopback server inside
the sandbox; the permitted local run passes and closes its browser and server.
The focused browser script is retained under ignored
`.toolchains/screen-composition/enter-design-regression.mjs`.

The correction changes no layout or CSS. Native packages and SDKs were not rerun;
their prior receipts retain their original candidate scope and operation limits.
Product code and tests are committed at `daf6c3b`.

Kris then selected the code-review skill, with push and PR update conditional on
passing review. Separate read-only Standards and Spec agents reviewed the complete
`a32d525...daf6c3b` correction. Standards reports zero documented-standard breaches
and no justified heuristic smells; Spec reports zero missing, incorrect or extra
requirements. Both verify the Enter listener's independence from movement bindings
and preservation of selection, double-click, guarded navigation and source safety.

The two-file commit is pushed to `codex/37-compose-help-layout`. At the correction
audit, PR #62's head was verified as
`daf6c3b3d44648c5b30b0b5a34f7b56a57ae6d7d`, with unchanged base
`8f7f9e7191f3b9c27343c7f4d4f5fdc65b2135f4`; its description now records the keyboard
correction and 246-test result. Automatic Repository quality
[run 40426321177, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40426321177/attempts/1)
is independently verified `completed/success` for that exact head, which matched
PR #62's open branch and unchanged base at audit. The ci-watch event matched this
chat, its receipt is recorded and the worker is done. Both required jobs and all
executed steps pass. Downloaded logs verify 246 frontend cases with zero failures,
skips or cancellations, including all three new canvas Enter cases; Rust 1.90.0
formatting; validation of 954 published repository files; 13 section-link cases;
Q1 rejection controls/source-selector audit; and ten retention cases. The nine
dispatch-only jobs were skipped as configured and provide no new native/SDK proof.
The raw log is retained under ignored
`.toolchains/screen-composition/enter-design-ci-40426321177.log`.

PR #62's description includes the audited run and result. No correction, retry,
manual dispatch or additional costly operation was needed. The correction's CI
audit is complete. Kris then selected committing and pushing these three status
and evidence files as a documentation successor, leaving the unrelated audit
untouched. Automatic checks on that successor require a same-chat terminal audit;
record the result on PR #62 without another receipt-only commit. The tested
product candidate remains `daf6c3b`; documentation does not replace native/SDK
candidates. The tracker is unchanged. Formal acceptance, merge and release remain
unselected.

## Design preparation, 2026-10-25

The user selected implementing #37 on a new branch through the implement skill.
The coordinating agent owns `codex/37-compose-help-layout`, based on fetched
Screens commit `8f7f9e7191f3b9c27343c7f4d4f5fdc65b2135f4`. Its intended integration
destination is `codex/phase3b-screen-designer`. Development is on Mac ARM64.
[#34](https://github.com/Caldwell-41/Renpy-editor/issues/34) is closed. The live
P3B, B02 and L02 requirements were read before preparing the drafts.

Root AGENTS.md requires several mocks and user approval before non-trivial
production UI changes. The existing flow-v1 Choose/Design/Connect workflow remains
the reference. These three drafts compare only composition controls within it.
They have their own `help-composition` lab entry and unapproved revision records.

| Draft | Add interaction | Tradeoff |
| --- | --- | --- |
| `inline-v1` | Opens a form below the hierarchy, with type, parent and text fields. | Keeps the tree visible; the form needs scrolling on smaller screens. |
| `context-v1` | Opens the form at the selected row and inserts a sibling after that row, or a child inside a selected group. | Makes insertion position visible; the form interrupts the tree. |
| `focused-v1` | Replaces the Choose list with a type chooser and the add form. Cancel returns to the list. | Keeps the form together; the hierarchy is hidden during addition. |

Start the lab with `npm run design:dev` in `app/`. Review
`/preview.html?screen=help-composition&variant=focused&state=adding&theme=dark&viewport=wide`,
substituting `inline` or `context` for the other variants. `nested` shows the
hierarchy; `conflict` shows retained input after a simulated Source conflict.
The recommendation is `focused-v1` because its add controls fit together beside
the canvas.

All data is fictional and memory-only. The drafts simulate add, text Apply/Cancel,
same-parent reorder, stable selection, history and refusal around protected source.
The sample-source view displays that memory state; it does not parse or patch a
project. HTML sample rendering establishes no Ren'Py fidelity. Existing button
actions appear unchanged; new sample buttons use `Null()`.

The drafts preserve the canvas, Choose/Design/Connect navigation, single-click
selection, Enter/double-click Design entry, Apply/Cancel, Source access and shared
Undo/Redo as reviewable sample interactions. They add the five L02 element types,
text edits, parent selection, ordering controls, drag/keyboard reorder and type/depth
help. Creation of a whole screen, resizing/movement and runtime preview remain
existing production capabilities outside this focused mock.

### Verification

- Production and lab TypeScript checks pass.
- The existing `check-screen.mjs help-composition` runner passes all 36 combinations
  of three drafts, three states, two sizes and two themes, with no page errors,
  horizontal document overflow or native-operation attempts. Its interaction-module
  flag is false because this draft adds no automated interaction module.
- In-app browser inspection exercised inline addition, earlier ordering, Enter to
  Design, text Apply and Undo/Redo. Contextual addition appeared immediately after
  its selected sibling in the sample hierarchy and sample source.
- Browser inspection also exercised occupied-frame refusal with the addition input
  retained, Cancel, protected-neighbor reorder refusal, canvas selection,
  double-click Design entry and conflict refusal with the exact text draft retained.
- The first full frontend run passed 230/231 tests. The remaining evidence test
  selected the shell's Python 3.9.6 and failed to import `tomllib`. This is an
  environment limitation against the documented Python 3.11+ prerequisite. Selecting
  the existing bundled Python 3.12.14 through `HARNESS_PYTHON` makes all eight tests
  in `windows-studio-probe.dom.test.js` pass. The full `npm run check` rerun with
  that supported interpreter passes typechecking and all 231 tests, with zero
  failures or skips.

The first sandboxed lab-server/browser attempts failed before startup. The normal
loopback server and installed Chrome work with the existing execution permissions.
The root-cause debugging skill guided the interpreter diagnosis; no product or
harness correction was needed. Temporary captures, the rendering report and the
full frontend-check log stay ignored under
`.toolchains/design-lab/pages/help-composition/`.

### Remaining implementation proof

Design selection is pending. Production add/text/reorder code, minimal source
transactions, persistent node identity and reopen proof remain unimplemented for
L02. No native package, app launch, SDK qualification or CI matrix has started for
this ticket. Set applicable costly-operation limits in #37 before those operations.

The user approved these TDD boundaries on 2026-10-26 when requesting the separate
prototyping chat. Test-boundary confirmation is complete; design selection remains
with the user in that chat.

- Public core dispatch and shared history with a disposable nested owned screen.
  Prove exact source edits, protected bytes, one history entry, no-ops, stale/conflict
  refusal, Undo/Redo and reopen. This does not prove UI input or rendering.
- The existing ScreensWorkspace DOM interface. Prove hierarchy/canvas selection,
  keyboard and pointer ordering, text/add drafts, Cancel and refusal retention.
  Stubbed requests do not prove durable source writes.
- The actual packaged UI-to-core route and deliberate pinned-SDK preview of the
  nested example. Prove real source/history/reopen and runtime display, with
  platform evidence selected from the changed behavior. Canvas fidelity remains
  the separate gate named by #37.

## Prototyping handoff, 2026-10-26

The user requested a new chat to display the existing drafts as they are, iterate
with them, and message the implementation chat when done. The draft candidate is
`2c4ff1d0d319c5482e919e96f9035f07b28852e4`; its fingerprint is
`74ee751a16bb56136b40d414b878e4288c329868df560f2c3d06c2ec34074163`.
The prototype chat takes sole writer ownership of this checkout on
`codex/37-compose-help-layout` until it returns the approved design. Its scope is
the `help-composition` lab files, their registry entry, design approval/captures and
the relevant evidence/status sections. The implementation chat waits during this
assignment. Production implementation follows the design return.

At handoff, the loopback Design Lab server is stopped. The receiving agent starts
it through the existing runbook and shows all three committed drafts before edits.
An unrelated untracked `docs/audits/2026-10-25-phase-1-codebase-design.md` is present;
preserve it. Prototype behavior, source/runtime acceptance and costly-operation
limits retain their existing boundaries. The user authorized the receiving chat
to report back to the implementation chat after prototyping is complete.

## Focused refinement, 2026-10-26

The user selected C as the direction and requested refinement with the
Experience First skill. This is a direction for iteration, not final approval.
The new `focused-refined-v1` revision uses variant `focused-refined`; all three
original draft modules and their shared styles remain unchanged. Its separate
sample module preserves the original C for comparison.

C2 compresses the five type choices into a two-column list. The parent selector
shows the complete container path, and a sentence identifies the append position.
A dashed pending element appears on the fictional canvas before Add, without
changing sample source or history. Occupied frames suppress that preview and
explain the constraint. Validation and Source-conflict errors appear beside the
form and retain its input. Starting an addition focuses the text input; Add and
Cancel return focus to the selected hierarchy row. Ctrl/Command+Enter adds;
Escape cancels. Narrow layouts put the form before the canvas. Existing
Choose/Design/Connect, hierarchy ordering, text editing and history remain.

The lab TypeScript check and `check-screen.mjs help-composition` pass. The runner
covers 48 combinations of four layouts, three states, two sizes and two themes,
with no page errors, horizontal document overflow or native-operation attempts.
The new interaction module checks that pending previews do not change sample
source, Cancel and Undo restore the original sample, focus returns after Add and
Cancel, and occupied-frame, empty-text and Source-conflict refusals retain input.
Wide and compact dark captures were visually inspected. Temporary captures and
`report.json` remain under `.toolchains/design-lab/pages/help-composition/`.

Review route:
`/preview.html?screen=help-composition&variant=focused-refined&state=adding&theme=dark&viewport=wide`.
The original C remains at `variant=focused`. C2 is local, uncommitted and unapproved.
The pending preview is HTML simulation; production feasibility and Ren'Py fidelity
remain with implementation. No production files changed, and writer ownership
remains with the prototype chat while the user reviews this revision.

## Complete workflow refinement, 2026-10-26

The user clarified that the prototype must cover the whole add, select, edit and
reorder workflow before any approval. They requested Luna at maximum reasoning to
research comparable apps before building, followed by a separate Experience First
review and implementation of its recommendations before presentation.

The research agent completed [the research note](../../design/design-lab-help-composition/workflow-research.md)
first. It used official Webflow, Figma, Penpot, Unity, Godot and Ren'Py documentation
and separated observed behavior from recommendations. The agent owned only that
note; the coordinator remained read-only until it finished, then owned all code
and status changes. The reviewer had read-only source/capture access.

The new `workflow-v1` revision, variant `workflow` (C3), retains the chosen focused
composer and the existing Choose/Design/Connect structure. It opens on the complete
nested layout. C and C2 remain separate and unchanged.

| Workflow | C3 behavior |
| --- | --- |
| Add | All five supported types, explicit container path and append position, pending canvas preview, retained input and parent-constraint feedback. |
| Select | Shared canvas/tree selection, tree hover outline, ancestor-path selection, arrow-key parent/child navigation, visible type and nesting level. |
| Edit | Named Edit text action, Enter/double-click Design entry, live draft preview, Apply/Cancel, pending markers and Resume draft actions across selection/step changes. |
| Reorder | Visible Move up/down or earlier/later buttons, Alt+arrows, pointer drag with before/after cues, same-parent guards and protected-source refusal. Groups retain descendants. |
| Inspect/recover | Shared Undo/Redo, modal accepted sample Source, explicit source-only markers, retained conflict drafts and a labelled simulated source refresh. |

The independent Experience First reviewer assessed source, the research note and
seven interaction captures. It confirmed coverage of the full workflow and made
five recommendations; all were implemented before presentation:

- Preserve text appearance by identity during reorder. C3 assigns the sample heading
  an explicit identity marker instead of inheriting the first-text styling.
- Distinguish repeated sibling containers with ordinals in the tree and destination
  paths, so a second vertical group has an identifiable destination.
- Add Show canvas and Back to editing navigation on compact layouts, preserving
  selection and drafts across jumps.
- Left-align and ellipsize breadcrumb labels inside a text span, retaining full titles.
- Name ancestor depth Nesting level and explain free-layout sibling drawing order
  separately in the existing type/order help.

The lab TypeScript check and targeted `check-screen.mjs help-composition` pass.
The runner covers 60 cases across five variants, three states, two sizes and two
themes with no page errors, horizontal document overflow or native-operation
attempts. The full workflow check exercises canvas/tree/ancestor selection,
double-click/Enter editing, exact unapplied text retention across nodes, Apply,
Cancel, Undo/Redo, pointer and keyboard reorder, protected-neighbor refusal,
creation of a nested example using all five types, group/descendant movement,
occupied-frame refusal, source-conflict retention and simulated recovery. Focused
checks also confirm the review fixes: stable text size across reorder, unique
repeated-container paths and retained drafts/focus across compact canvas jumps.
C2's original interaction checks still pass.

Temporary captures and the report stay under
`.toolchains/design-lab/pages/help-composition/`; the `workflow/` subdirectory has
select, add, edit, reorder, protected-refusal, conflict and compact captures.
The coordinator visually inspected the final select, edit and compact captures.
The live review URL is
`/preview.html?screen=help-composition&variant=workflow&state=nested&theme=dark&viewport=wide`.

C3 remains local, uncommitted and unapproved. Browser memory and illustrative
Source do not prove real `.rpy` patching, durable reopening, external reconciliation
or Ren'Py rendering. The prototype chat retains writer/server ownership until the
user approves the complete design and the integration approval procedure finishes.
No production changes, publication or return message to the implementation chat
have occurred. The original reference and unrelated audit remain intact.


## Deletion workflow refinement, 2026-10-26

The user explicitly requested adding deletion to #37 with the agreed boundaries
and prototyping it with Experience First before approval. The issue body was
updated through GitHub CLI and read back exactly. The added acceptance covers
smallest safe source patches, explicit group/descendant scope, protected regions
and containing groups, screen-root refusal, retained input on refusal/conflict,
one history entry, exact Undo/Redo restoration, fallback selection/focus and
persistence after reopening. This scope change is not design or implementation
acceptance.

C4 (`workflow-removal-v1`, variant `workflow-removal`) keeps the complete C3 workflow
and adds removal in selected-element controls. Leaf removal immediately offers
Undo removal. A nonempty group first names and lists all descendants, marks the
canvas scope, and focuses Keep group before explicit confirmation. Escape cancels.
Selection moves to the next sibling, then previous sibling, then parent. Undo
restores the removed target and focus; Redo restores the fallback. Protected
source, containing groups and the screen root refuse removal. Unfinished edits
and source conflicts retain input and source.

The same independent Experience First reviewer inspected C4 source and captures
read-only before presentation. Its requested fix now ignores repeated Delete and
Backspace keydowns so a held key cannot remove successive fallback elements. Its
copy recommendation also shortened attempted protected-removal feedback while
retaining the persistent explanation and source-inspection action.

TypeScript and the targeted Design Lab runner pass. The runner covers 72 rendering
cases across six variants, three states, two sizes and two themes. Full workflow
checks run against C4. Focused removal checks cover leaf Undo/Redo, one history
entry, held-key refusal, group scope/cancellation, descendant restoration, all
fallback positions, keyboard focus, protected/root refusal, retained drafts,
source conflicts and compact group review. One initial test checked row focus
after its source-inspection helper had deliberately moved focus to the toolbar;
the assertion now runs before source inspection. This was a test-order correction.

Captures stay under `.toolchains/design-lab/pages/help-composition/removal/` and
`workflow-removal/`. The live draft is
`/preview.html?screen=help-composition&variant=workflow-removal&state=nested&theme=dark&viewport=wide`.
C4 is local, uncommitted and unapproved. The issue scope is published; production
code is unchanged. Browser memory and illustrative Source do not prove real
patching, durable reopening, reconciliation or Ren'Py rendering. The prototype
chat retains writer/server ownership pending complete design approval and the
Design Lab integration procedure.


## Confirmation popup refinement, 2026-10-26

The user reported page movement during inline removal review and requested a
confirmation popup for every removal, retaining the page position. C5
(`workflow-popup-v1`, variant `workflow-popup`) preserves C4 as a separate comparison.
Every eligible Remove action, Delete or Backspace now opens a native modal dialog.
Individual elements show their type and text; groups name and list their descendants.
Cancel receives focus. Cancel or Escape preserves source/history/selection and
returns focus to the exact invoking button or row without scrolling. Confirmation
retains C4's fallback selection, history and protected-source boundaries.

The dialog uses the browser top layer, dims the background and keeps review content
outside the panel layout. Scrollbar space remains reserved while background scrolling
is locked. Undo removal now appears in a dismissible fixed notice, so recovery feedback
does not insert another row above the element tree. No animation is used.

TypeScript and the focused runner pass 84 rendering cases across seven variants,
three states, two sizes and two themes. Full add/select/edit/reorder checks run
against C5. Removal checks verify no source change before confirmation, individual
and group confirmation, Cancel/Escape, exact focus return, keyboard focus cycling,
held-key refusal, Undo/Redo, fallback focus, protected/root refusal, draft retention
and conflicts. Geometry and scroll positions match before, during and after cancelled
review at desktop and compact sizes. The first run found Shift+Tab from Cancel could
leave the document for browser controls; explicit boundary cycling fixes it, and the
rerun passes. Captures live under
`.toolchains/design-lab/pages/help-composition/popup/` and `workflow-popup/`.
The coordinator visually inspected individual, group and compact confirmations.
The independent Experience First reviewer inspected source, focused checks and
those captures after the focus correction, and recommended no further changes.

The live draft is
`/preview.html?screen=help-composition&variant=workflow-popup&state=nested&theme=dark&viewport=wide`.
C5 remains local, uncommitted and unapproved. The production editor is unchanged;
source writes, persistence and runtime behavior still require implementation proof.


## C5 approval and handback, 2026-10-26

Kris explicitly approved C5 and requested handback to the original implementation
chat to continue #37. The exact decision and behavior are recorded in
[approval.json](../../design/design-lab-help-composition/approval.json).
Source commit `94c78e725f48829a017377786a0bcafc0fd48c41` reproduces fingerprint
`bc5cc41629a11465593f49375cd8d7d637c0987f6116ff31d24cc2169245328c`.
Sixteen SHA-256-verified captures retain desktop/compact and both-theme baseline
views plus add, edit, reorder, conflict, protection and removal-confirmation states.
Interaction-state capture IDs describe the exercised state; the three scenario
URLs remain nested, adding and conflict.

C5 replaces C4's immediate leaf removal with confirmation for every eligible
removal. Its stationary dialog, initial Cancel focus, exact cancellation focus
return and Undo outside the panel layout are approved behavior. All implementation
acceptance remains pending, including real patches, identity/history, reopen,
external reconciliation and runtime rendering. Earlier test-boundary approval
remains valid. The original implementation chat resumes sole checkout/server
ownership on handback; this prototype chat then stops editing. All prototype
commits remain local-only. The unrelated Phase 1 audit remains untracked.

The CURRENT/HANDOVER word-count targets remain exceeded by retained unique prior
acceptance and protected native recovery evidence. This handback replaces their
live L02 sections and preserves that earlier evidence.


Approval validation: the lab TypeScript and approval-record checks pass. The live
C5 preview displays Approved, and `sourceMatches[workflow-popup-v1]` is true.
The required full `npm run design:check` was run, but is not a pass: after 488
rendering cases and 13 earlier screen interaction checks it stopped at the existing
Screens `flow-v1` approval's changed-source guard. That approval requires commit
`3c7ea31d8210538cc987a2d2f4ceb8b7aa8f5437`; its global source fingerprint predates
this prototype. The guard correctly refuses to present that older screen as its
approved reference in the current checkout. Its record was left intact. Log:
`.toolchains/design-lab/c5-approval-check.log`; partial report:
`.toolchains/design-lab/report.json`. This is an older-reference limitation of the
combined check, not a C5 interaction failure. Preserve the source-pinned comparison
procedure during implementation; do not rewrite older approvals to make it pass.

After recording approval, the targeted C5 screen runner again passed all 84 cases
and complete workflow/popup interactions. C5's source fingerprint remains matched.
The handback includes the combined-suite limitation above and does not claim the
older reference or production implementation has passed acceptance.

## Prototype iteration handoff, 2026-10-26

Kris requested a new chat to display the current prototype unchanged, iterate with
him, then message the implementation chat when finished. He also reaffirmed approval
of the proposed tests. C5 remains the approved baseline until another explicit design
decision. The selected receiving chat is "Iterate Help composition prototype for #37";
the parent is "Implement ticket #37" (`01a170cf-8fea-74f3-b48d-90c241cf2ad7`).

Production checkpoint `79f2e5e` on `codex/37-compose-help-layout` adds revision-bound
composition commands, source-carried element identities, shared-history integration,
retained UI drafts, confirmed removal and selection preferences. Its diff is the
implementation record. It is incomplete and unaccepted. The receiving chat owns
Design Lab and its evidence/approval records; production continuation returns to the
parent. The parent yields checkout/server ownership on creation of the receiving chat.

At this checkpoint, `npm run typecheck`, `npm run build:tests`, the two focused
`screen-composition.dom.test.js` and `screen-ui.dom.test.js` files pass all 21 cases.
`cargo test -p loomlight-core --locked owned_composition_` passes all seven cases.
`git diff --check` passes. No full-suite or runtime/native acceptance is claimed.
Remaining proof includes real UI-to-core operations, Source reconciliation and reopen,
deliberate nested-screen SDK preview, affected native qualification and final independent
Standards/Spec reviews. No costly operation has started for #37.

The approved C5 reference is served from the read-only worktree
`.toolchains/l02-c5-reference` at `94c78e7`, with copied approval metadata. The preview
URL on port 5175 returned HTTP 200 at handoff. Current production changes invalidate
the main checkout's approved source fingerprint as expected; preserve the reference
and create a separate unapproved variant for further experiments. All work is local-only.
The unrelated untracked Phase 1 audit remains untouched. The new handoff replaces the
live L02 status sections and preserves the unique prior recovery evidence below them.

## Implementation resumed, 2026-10-26

Kris requested continuing implementation under the existing C5 and test approvals.
The duplicate prototype chat remained idle and made no changes. The original
implementation chat resumed checkout/server ownership. No new design approval is due.

The real `screen_composition_probe.js` controller now drives the production renderer,
ApplicationHost, Source and shared transactions through six groups. Browser run 06
passes addition/history, literal-only editing/no-op/Cancel, keyboard sibling reorder,
confirmed removal with focus/scroll retention, protected-source reconciliation and
group history, then close/reopen with exact bytes and selected element identity.
Its output and accepted nested `.rpy` are in ignored
`.toolchains/screen-composition/browser-06/`. Chrome is not native WebView proof.

The first browser run exposed a harness wait for a message the UI does not emit.
The second exposed a selection expectation; inspecting pinned C5 established that
Redo keeps a surviving selection, so production retains that behavior. The third
found a product defect: the persistent closed confirmation carried `aria-modal=true`,
which the application's navigation guard treats as an active modal. The dialog now
sets that attribute only while open. Run 04 reached reopen and found the harness
passed an obsolete session ID to the session-free `project.current` operation. The
corrected payload passed in run 05; run 06 repeats after placing the protected footer
separately so the deliberate SDK preview can show it clearly. These failures remain
in their separate ignored output directories.

A focused UI case also established that Source removal could leave a retained text
draft inaccessible. The UI now presents the orphaned text for copying or explicit
discard. Focused core and component checks pass; broad suites and native/runtime
qualification remain pending. The owning issue records operation limits. Before any
qualification starts, consumption is Mac/Windows package 0/0, editor 0/0, SDK campaign
0/0 and focused CI 0. Routine checks do not consume these limits.

### C5 controls and production operations

| C5 control or retained capability | Production operation and observable result | Verification owner |
| --- | --- | --- |
| Screen picker and New blank screen | Existing catalog/creation retains distinct screen/root IDs and exact Source navigation. | Existing owned-screen browser and packaged-controller rehearsal. |
| Hierarchy, canvas, ancestor path and type/depth help | One selected element ID; Enter/double-click enters Design. | Component tests, real UI/core controller and inert SDK helper. |
| Add palette, destination, text and Cancel | Revision-bound `screens.compose` addition; one shared-history entry; a refused draft stays editable. | Core dispatch, component and real UI/core checks. |
| Pending addition outline and text preview | Typed inert canvas plans; accepted `.rpy` remains unchanged until Apply. | Core plan case and SDK helper campaign. |
| Text Apply/Cancel and shortcuts | Literal-token patch, no-op refusal, retained per-element drafts and saved-text restoration. | Core dispatch and real UI/core controller. |
| Order buttons, Alt + arrows and pointer drop | Same-parent source-subtree move; protected crossings refuse. | Whole-group core case, keyboard controller and pointer browser check. |
| Remove, Delete and Backspace | Stationary modal names the target/subtree; Cancel starts focused; Cancel/Escape restores its exact invoker. Core rechecks revision and protection. | Component, real controller, compact/wide position and stale-removal browser checks. |
| Undo notice and Dismiss | Existing shared history restores exact source/IDs, with removed-target/fallback selection. Dismiss changes no source. | Core dispatch and real UI/core history. |
| Source and Connect | Existing revision-bound Source navigation; actions/connections remain in Source. | Real Source reconciliation and retained earlier scope. |
| Dimensions, aligned movement, canvas samples/aspect/zoom/button state | Existing operations remain; unmarked Source-authored text retains its sample controls. | Existing Screens component/core cases and prior qualified scope. |
| Validate/Test in Ren'Py | Existing explicit runtime preparation/trust/scratch route for accepted source. | Deliberate nested-screen SDK campaign. |

The C5 comparison retains the split editor, flat tree, typography, add/text controls,
compact editor-before-canvas order and stationary confirmation. The production shell
keeps its existing service toolbar, real screen picker, navigation width and technical
source names; the mock used a smaller fictional shell and friendly sample names.
The protected `use` neighbor makes the inert canvas explicitly unavailable, while
the deliberate project preview can execute that accepted source. The mock's HTML
canvas does not qualify that source or waive the separate canvas-fidelity gate.
Wide/compact dark captures are retained in each browser output directory. Browser
run 10 observes settled Source/row state and verifies position before/during each modal.

### Qualification and corrections after the first candidate

Candidate `6e6697b` produced signed Mac package 1 at
`.toolchains/releases/l02-composition-01/`. Strict signature, certificate-backed
requirement and installer contents pass. Executable SHA-256 is
`b2b36a031096c09ff0e9f5eed8ace42d5eeaae9f52514da9823b33b453b2df8b`;
installer SHA-256 is `31d01944c490b9c2ee1547982eebb61023e9ab818ab9c6acba644c0b6352096a`.
Native Mac session 1 failed at keyboard reorder after addition and literal-history
stages. Its report records ordinary cleanup, and the runner retained its source and
failed result under `.toolchains/screen-composition/native-mac-01/`.

A focused component case reproduced overlapping history commands while the first
refresh was pending. The workspace now keeps its busy state through refreshed
document/selection installation. The exact cause of the first native stop remains
provisional until the corrected package runs. A pinned WebKit rehearsal then exposed
an independent probe defect: changing the DOM selection without notifying CodeMirror
could insert a replacement at the old selection. The native editor helper now sends
the same selection-change event as its range helper. WebKit run 02 completes the six
controller groups, but its outer browser check fails on a ResizeObserver delivery
notification. That result remains failed diagnostic evidence; it is not a native pass.

SDK helper setup 01 exceeded the new harness's 60-second ready deadline before any
helper started. Its identified public partial fixture was removed after driver exit;
`setup-failure.json` retains the audit. Existing canvas evidence already establishes
a 180-second SDK setup bound. The harness now uses that bound only for initial
readiness, retaining the ordinary 15-second request bound. Helper run 02 passes real
canvas click/double-click selection, unapplied addition rendering without source writes,
the six controller groups, pointer reorder, compact confirmations and stale-removal
refusal. The driver confirms host cleanup. This campaign uses one inert helper start.

The first broad core run had 380 passes and 34 failures. Local-server fixtures were
denied loopback binding by the sandbox; two source-only inspection fixtures exposed
a real metadata assumption. Raw source inspection is again independent of ownership
metadata, while managed IPC and mutation responses retain ownership annotation.
Those two existing fixtures pass after correction. A process fixture also failed;
the normal-capability rerun passes all 414 ordinary core cases, with 48 intentionally
ignored specialist/SDK cases and three documented exclusions. Its retained log is
`.toolchains/screen-composition/core-final-02.log`. No ignored case counts as a pass.
The four harness groups pass in `harness-final-02/`. The repository validator passes.

SDK campaign 2 passes its exact named nested-screen case. It compiles/lints the
renderer-accepted source, deliberately renders the nested composition and protected
neighbor, then stops and cleans up. Both terminal receipts report exit 0 and complete
cleanup; accepted source is unchanged, without generated project bytecode, saves or
scratch residue. `sdk-preview-01/` retains the render and receipts. Accepted source
SHA-256 is `ef20aa1105fec5594224141a36a5d3a789cb2825a97d4600857eda34db8f881e`.
This establishes runtime behavior, not native WebView or canvas-fidelity acceptance.

### Independent review and focused corrections

Standards and Spec independently reviewed the full diff from `8f7f9e7` to `1bec29d`.
They found one shared P1 source-preservation defect and two distinct P2 defects.
Each source defect reproduced through the public dispatcher before correction.

- Reordering after a final sibling without a newline could put the moved statement
  inside that sibling's inline UUID comment. The transaction now refuses this unsafe
  destination, preserves every byte and creates no history entry.
- Removal skipped an unmarked supported sibling because it had no owned UUID.
  The accepted result now returns a source-offset selection key for that sibling.
  The UI resolves it through history and stores its source revision for reopen.
  A different revision cannot restore that offset, and the key grants no write authority.
  The component check reproduced immediate/history selection and the separate reopen
  omission before their fixes. Spec's correction review found no remaining defect.
- The Windows SDK command could return exit 0 for an unmatched exact test selector.
  Its gate now requires the positive named case, a one-pass summary, matching accepted
  source hash, both runtime cleanup receipts and the retained PNG. Focused admission
  tests reject zero/ignored/missing cases and incomplete evidence. The actual Mac
  SDK receipts pass this same verifier without another runtime start.

After these corrections, all 25 ordinary Screens core cases pass; its separate
four-helper SDK case remains intentionally ignored. Both preference cases pass.
TypeScript and all 240 frontend cases pass with supported Python 3.12. A prior rerun
with system Python 3.9 failed only the existing `tomllib` consumer; it remains a failed
environment diagnostic. Browser run 11 passes all six production UI-to-core groups,
pointer reorder, compact/wide stationary confirmations and stale-removal refusal.
Workflow actionlint and whitespace checks pass. The new SDK verifier's three cases
pass. These changes do not alter the already-qualified inert helper plan, SDK adapter,
runtime path or renderer-accepted nested source. Their SDK evidence is reused for
that unchanged scope; the unsafe-EOF case has separate dispatch proof.

At this checkpoint Mac use is one package build and one failed native editor session.
Both SDK campaigns pass, with three of four allowed SDK starts used. Windows
package/editor/SDK use and focused CI dispatches remain zero. The explicit
`compose_help` workflow selector preserves closed L01/L17 guards and prepares the
required Windows SDK/native route plus portable Mac checks. It has not been published
or dispatched. The corrected Mac package/session remain due.

### Native request contention and remaining build decision

Signed package 2 qualifies candidate `9facf7c`. Its strict signature and installer
contents pass on the existing approved certificate. Executable SHA-256 is
`081de92d5870487c21c118bc993fded6b0c44517854c6a48900bcf1ec49e5906`;
installer SHA-256 is `bb6aefc8f5a2f9ee24306748846a39e360446923603790887fac03a3f608ec5f`.
Native session 2 again failed keyboard reorder. This report captures the key event
and `Another request is in progress.` feedback. The owned fixture and host cleaned
up; partial source and failure receipts remain in `native-mac-02/`. This is a failed
qualification, not a passing functional run. The earlier history correction remains
valid but did not resolve this native failure.

The second failure prompted reassessment at the native request boundary. New selection
persistence sent `preferences.write` directly through the bridge, bypassing the app's
existing request lane. A following composition write could reach the checked-out
service before the preference write returned. `checkout-red/` reproduces the identical
stage, feedback and refusal by holding the preference response and returning the
host's pre-dispatch busy response for an overlapping composition request. The actual
UI and source operations still use the real core; that concurrency condition is a
controlled client-boundary test, not a second native run. A focused lane test also
failed before correction.

Candidate `602613d` shares the existing application request lane with preference
reads/writes. It queues each request once; it adds no mutation replay or new queue,
and runtime Stop/status retain their independent route. `checkout-green/` passes
all six controller groups and additional pointer/modal/stale checks under held
preferences. Its 49 preference writes and 12 composition requests have no preference
contention refusals. TypeScript and all 241 frontend cases pass. Standards and Spec
independently reviewed this correction and found no remaining issue. Native proof
for this candidate remains pending.

The final ordinary core run on `9facf7c` passes all 417 cases, with 48 intentional
ignores and three documented exclusions, in `core-final-03.log`. The following
correction changes renderer scheduling only, so those core results retain their
scope. All four harness groups pass in `harness-final-03/`. Workflow actionlint,
whitespace checks and the repository validator pass. The previously qualified SDK
adapter, inert plan, accepted nested source and deliberate runtime path remain
unchanged; their Mac SDK receipts retain that bounded scope. Windows proof is pending.

| #37 criterion group | Local evidence | Remaining required proof |
| --- | --- | --- |
| Minimal composition, group/source order and owned identity through history/reopen | Public dispatcher and six UI/core controller groups pass. | Corrected Mac native and Windows qualification. |
| Hierarchy/canvas selection, Design entry and type/depth help | Actual inert SDK helper plus browser/controller checks pass. | Corrected native/platform qualification; canvas fidelity remains separate. |
| Parent/protected constraints and retained input | Dispatcher, component and stale-source browser checks pass. | Corrected native/platform qualification. |
| Confirmed exact removal and unchanged cancellation | Dispatcher, stationary wide/compact browser and component checks pass. | Corrected native/platform qualification. |
| Protected/root/group refusal and stale removal | Dispatcher and stale-dialog browser checks pass. | Corrected native/platform qualification. |
| One history entry, exact subtree/UUID restoration, fallback focus and reopen | Dispatcher, component and UI/core history/reopen checks pass; unmarked fallback has revision-bound reopen coverage. | Corrected native/platform qualification. |
| Nested example and protected neighbor in deliberate Ren'Py | Mac compile/lint, actual render, Stop and cleanup pass. | Windows SDK campaign; no canvas-fidelity waiver. |

#### Standards

Two initial findings, unsafe EOF insertion and a zero-test SDK gate, are resolved.
The correction recheck and final request-lane recheck report no remaining documented
standard defect. Reviews were read-only and did not start builds or runtimes.

#### Spec

Two initial findings, unsafe EOF insertion and skipped unmarked fallback selection,
are resolved. A follow-up reopen omission is also resolved with revision-qualified
preferences. The final request-lane review reports no scope or behavior mismatch.
Native/platform qualification remains required.

At this pause, cumulative consumption is Mac packages 2/2, native sessions 2/3 and
SDK campaigns 2/2 with three of four SDK starts. Windows counts and focused CI
consumption remain zero. No qualification operation is running. The next step needs one additional
Mac package build for `602613d`, followed by the already-allowed third native session.
WORKFLOW requires asking before exceeding the recorded two-build limit. Existing
design and test approvals remain effective. Branch publication, PR, merge and release
remain unselected; required Windows CI follows its publication boundary. The issue
stays open with all acceptance criteria pending platform completion.

The attempted GitHub status update was rejected by automatic approval review before
execution. Its reason was that local implementation authorization did not explicitly
authorize external disclosure or issue mutation. No issue update was published.
The prepared body remains locally at `/tmp/loomlight-37-final-status.md`; ask for
explicit permission before publishing it. Current consumption above must be preserved
even though the issue still shows the historical pre-qualification counts.

This continuation reviewed status-document size. CURRENT is about 1,567 words and
HANDOVER about 3,030 before this final note. They retain prior acceptance decisions,
protected native recovery and unique failure records outside L02. Their excess is
preserved rather than folding unrelated historical maintenance into this outcome.

### Additional Mac builds approved, 2026-10-26

Kris approved the prepared #37 status update and said five more builds may run if
needed. The Mac package ceiling rises from two to seven total. Existing consumption
is preserved: Mac packages 2/7, native sessions 2/3, SDK campaigns 2/2 with three of
four starts; Windows use and focused CI remain zero. Other operation limits remain
unchanged. The next build qualifies the reviewed request-lane correction at
`602613d`, followed by the already-allowed third native session. Branch push, PR,
merge and release remain unselected.

The approved status update was published to #37 and read back with its acceptance
criteria unchanged. Package 3 built successfully for product candidate `602613d`;
its checkout differs only in documentation. Strict signature and installer-content
verification pass on the unchanged approved certificate. Executable SHA-256 is
`1a914c1ad33b73a761da853235fa563f9d1d13bf517ef168fa96962cf38d4c53`; installer SHA-256 is
`450d9cac8e90b19ebe710db0da293457d4233d03ae19b362bacf9e08fba0d14c`. The package identity and source-equivalence receipt
are retained in `.toolchains/releases/l02-composition-03/`.
Native session 3 is running against that exact executable in its disposable fixture.
Current use is Mac packages 3/7, native sessions 3/3 and SDK campaigns 2/2 with three
of four SDK starts. Windows use and focused CI remain zero.

### Corrected signed Mac functional qualification

Native session 3 passes all six `screen-composition` groups on package 3/product
candidate `602613d`. It completes addition/history, literal editing/history,
keyboard reorder/history, confirmed removal, protected Source reconciliation and
reopen. All seven owned identities and the selected body survive reopen. The
runner matches accepted source to disk and metadata, observes no source bytecode,
saves or scratch residue, and confirms host/request/credential-owner cleanup plus
fixture removal. Exit is 0 without timeout. `native-mac-03/` retains the complete
receipt, accepted source and disk audit. The normal native scenario starts no SDK.

The 261-second run includes an unexplained gap between literal-history completion
at 5.4 seconds and reorder-history completion at 253.3 seconds. A read-only fixture
observation during that gap found the source already reordered, with its last write
about nine seconds after launch. A CUA attempt to inspect the current app timed out.
A later one-second process sample could not start because the app had already
completed and exited. Its diagnostic command result is retained. There is no stack
sample or evidence establishing the cause of the pause. This is the bounded
functional native pass; it makes no new responsiveness or canvas-performance claim.
No unchanged native retry or extra package build was started.

Cumulative use is Mac packages 3/7, native sessions 3/3 and SDK campaigns 2/2, with
three of four SDK starts. Windows package/editor/SDK use and focused CI remain zero.
All required local functional proof is now present for the reviewed product, within
its recorded SDK/core reuse scope. Windows proof is still pending. All #37 acceptance
boxes remain open until required target proof and the acceptance decision are complete.
The next action is publication approval for the reviewed branch, then the prepared
`compose_help` CI dispatch at ordinal 1. No PR, merge or release is selected.

### Branch publication and Windows CI approved, 2026-10-27

The user answered the earlier explicit approval question with "Approve push and
Windows CI" after requesting a fresh-agent handoff. This authorizes publishing
`codex/37-compose-help-layout` and running its prepared qualification route.
PR creation, merge and release remain unselected. A fresh ownership check found
no receiving agent active and no checkout changes beyond the preserved unrelated
audit. The original implementation chat owns publication and the exact CI run's
audit. A receiving chat must reconcile that assignment before another dispatch or
checkout edits.

Preflight confirms no remote L02 branch and no earlier `screens-source.yml` run
for it. The selected route is `compose_help=true`, with the exact pushed SHA and
ordinal 1. It runs Windows SDK/native qualification and portable Mac checks, without
a Mac package or native launch. The two-dispatch ceiling remains in force; Windows
package/editor/SDK limits are unchanged. Actual costly starts will be audited from
the confirmed run. The unexplained Mac timing gap remains a separate pre-PR concern.

### L02 qualification dispatch 1 pending

Publication is verified at `d80c323dd9bcac404bd3bfe446ebc867021765a3` on
`origin/codex/37-compose-help-layout`. The product and workflow are unchanged from
reviewed product `602613d`; subsequent changes record authorization and handoff.
The user-approved dispatch uses `compose_help=true` and ordinal 1.
[Run 40396855757](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40396855757)
is confirmed as attempt 1, event `workflow_dispatch`, branch
`codex/37-compose-help-layout`, with that exact full head SHA. Last observed status
is `in_progress`, updated `2026-10-26T20:34:37Z`.

Both required jobs started. At the initial step observation Windows was in pinned
dependencies/evidence checks; Mac was in shared composition/source/desktop gates.
No Windows package, editor or SDK start had been observed at that snapshot. The
first run reserves one Windows package, one editor session and both selected SDK
campaigns, with the existing four-start ceiling. Audit actual started operations,
including failures, from the exact job steps and retained receipts before another
attempt. Dispatch consumption is now 1/2. Local Mac use remains packages 3/7,
native sessions 3/3 and SDK campaigns 2/2 with three of four starts.

Initial metadata is retained under `.toolchains/screen-composition/ci-40396855757/`.
A documentation-only wait commit may follow; it does not change this test candidate.
The original chat owns CI registration and result audit. A receiving chat may take
sole checkout writer ownership after recording that transfer; the CI auditor must
reconcile it before editing. The selected wait route is installed `ci-watch`, with
registration confirmed only by its startup acknowledgement. A failed registration
uses manual same-thread resume. No result is accepted yet. The Mac pause remains
unexplained, and PR creation/merge/release remain unselected.

### Qualification dispatch 1 audited, 2026-10-27

The `ci-watch` completion event was matched to the original thread, run and full SHA;
its receipt was acknowledged. GitHub independently confirms
[run 40396855757, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40396855757/attempts/1)
completed successfully on `d80c323dd9bcac404bd3bfe446ebc867021765a3`. Both selected
Help composition jobs and selector validation succeeded. Closed Help/L01/L17/GPU
routes were skipped as intended and supply no additional pass. No source or workflow
change exists between that candidate and the documentation-only successor at audit.
No receiving agent had taken writer ownership when the audit began or before its
status updates.

The audit downloaded both evidence archives, matched their SHA-256 against GitHub's
artifact digests, and compared every extracted file with its archive entry. It also
matched retained test/desktop binaries against the producer manifests and Cargo's
exact emitted executable names. Windows binaries have x64 PE headers; the portable
Mac test executable has an ARM64 Mach-O header. The native Windows executable is
`5b42f61af62af42bad1adc92c81270dcd501e0d23681ec8c993a43ad5cf03a0d`.

| Evidence | Windows x64 | macOS ARM64 CI |
| --- | --- | --- |
| Frontend/typecheck | 241 passed, zero failed/skipped. | 241 passed, zero failed/skipped. |
| Selected shared core | Every named case matched source: 25 Screens, 3 metadata, 16 Source and 1 selected scene refinement passed. | Same 45 named passes. |
| Existing separate four-helper case | Intentionally ignored in the ordinary Screens filter; not a pass. | Same exclusion. |
| Production renderer/core | Six composition groups, pointer/modal/stale checks and held-preference regression pass. | Same groups/checks pass. |
| Owned-screen regression | Eight real renderer/core groups plus exact earlier probe rehearsal pass. | Same groups/rehearsal pass. |
| Inert SDK helper | Actual canvas selection and unapplied draft checks pass. Driver shutdown must succeed before the browser command exits. | Not selected; existing local Mac evidence retains its scope. |
| Deliberate nested SDK preview | Exact named SDK case passed once with zero ignored/failed cases; accepted-source hash and both cleanup receipts pass the admission checker. | Not selected; existing local Mac evidence retains its scope. |
| Native packaged controller | All six groups, accepted bytes/metadata and seven UUIDs, history/reopen, exit 0 and complete host/fixture cleanup pass. | No CI package or native launch; existing signed local Mac session 3 remains the proof. |

The Windows SDK accepted source SHA-256 is
`fb05f53bbe894b746925b00b2a26c75b231167aef1d3c8cb63529e46efc6c820`.
The official SDK archive/checksum verification step succeeded. Validation exits 0;
preview Stop exits `-1073741510`, admitted by the existing Windows cancellation
policy, with complete cleanup and no error diagnostics. The retained 1280x720 PNG
was visually inspected: quoted Harbor/Platform 2 text, Travel notes, Close and the
separate protected neighbor are visible. This is deliberate runtime proof, not a
canvas-fidelity or physical-input acceptance claim.

Windows native elapsed time is 14.547 seconds. Its literal-history and reorder
checkpoints are 3.730 and 4.697 seconds. Mac CI browser checkpoints are 4.734 and
5.866 seconds. Neither reproduces the local Mac native pause; neither establishes
its cause. That pre-PR concern remains unresolved.

Artifact identities retained for recovery:

- Windows artifact `12687134917`, archive SHA-256
  `9a4e83d30e3ac08adfbab5e84a88a614ae682fa7b14db47d79d3c01b08a0cf36`.
- Mac artifact `12687392311`, archive SHA-256
  `03f6608e1c4d462e5445a65a5c5a198844d2d33ac2bbeb01745db2fd098e8468`.

Raw run/log metadata, archives, extracted evidence and the read-only audit result
are under `.toolchains/screen-composition/ci-40396855757/`. Both CI privacy scans
passed. The audit executed no retained binary and launched no SDK, editor or package
build. It does not require another qualification dispatch.

#### SDK process-count correction

Earlier records counted the inert helper plus the two `runtime.start` submissions
as three starts per host. `RuntimeKind::Validate` in
`app/src-core/src/renpy/runtime.rs` launches compile and lint as separate SDK child
processes. The actual execution is helper, compile, lint and preview: four SDK
process starts per host. The original campaign-2 two-start wording counted its two
runtime submissions and understated its three child processes. This records the
counting error rather than rewriting the earlier limit or granting extra attempts.
The overall four-process ceiling per host is fully used; further SDK execution
needs an explicit extension and consistent child-process accounting.

Current cumulative use is Mac packages 3/7, native sessions 3/3, SDK campaigns 2/2
and SDK processes 4/4; Windows packages 1/2, native sessions 1/2, SDK campaigns 2/2
and SDK processes 4/4; focused CI dispatches 1/2. Both-target functional qualification
is audited for its stated scope. The remaining work is Mac-pause diagnosis or its
explicit disposition, any evidenced fixes and focused review, then PR preparation.
PR creation, merge and release remain unselected. The issue stays open pending that
work and the acceptance decision. CI watching and the original chat's CI audit are
complete; the receiving chat can assume sole writer ownership after its state check.

### Mac-pause diagnostic chat selected, 2026-10-27

The user requested a new GPT-6.1 Sol chat at xhigh to review the Mac pause's cause
and explicitly said, "Any allowance it needs for this is approved." The receiving
chat owns diagnosis and its checkout/server work after creation and a live state
check. The original implementation chat stops editing after dispatching it.
The diagnostic agent may choose and record necessary bounded experiments, including
additional builds, native sessions, SDK process starts or focused CI, without
requesting another allowance approval. Historical consumption is preserved, and
physical SDK child processes must be counted separately. This later approval
supersedes exhausted diagnostic ceilings for the selected investigation; other
outcomes and PR/merge/release authorization remain separate.

The assignment is to establish whether the observed pause comes from the app, probe
or host, and report the cause with evidence and a recommended correction. Diagnostic
instrumentation is in scope; a production behavior change is not requested by this
review assignment. Existing signed Mac and audited CI evidence remain available for
comparison, with their original limits and failures retained.

### Mac pause investigation started, 2026-10-27

The diagnostic chat checked `e989b72` on `codex/37-compose-help-layout` and took
sole checkout/server writer ownership. Only the unrelated untracked codebase-design
audit was present. Live #37, B02 and P3B were refreshed. Production behavior remains
unchanged. Historical session 3 and its failed sample remain intact.

Initial classification is missing causal evidence, with host/WebKit suspension now
supported by retained OS logs. The app's WebKit log has a 246.275-second activity
gap, following removal of its renderer process assertion, and resumes when its
window becomes visible. The host power log records a display wake caused by the
earlier CUA inspection at the same boundary. These observations need a bounded
comparison before a final diagnosis.

Under the user's approved diagnostic extension, reserve at most two additional
Mac native sessions initially (cumulative sessions 4 and 5), using the existing
signed package 3 with its executable hash verified. Compare ordinary execution
with an owned, temporary display-awake assertion; retain exact process/window/power
state and elapsed receipts. No build, SDK process or CI dispatch is selected for
this first experiment. A started session counts even if it fails. Reassess before
extending this experiment; further necessary diagnosis is already authorized.
Ignored raw diagnostic scripts, extracts and receipts belong under
`.toolchains/screen-composition/pause-diagnosis/`.

### Mac pause cause established, 2026-10-27

The pause was host display sleep followed by WKWebView renderer suspension. The
native runner admitted a sleeping display and held no display-awake assertion.
The source write could finish before macOS suspended the renderer, leaving the
probe's JavaScript continuation unable to run. Production request-lane contention
and a wrong UI wait do not explain this interval. This is an environment condition
with a harness admission/lifecycle omission, not evidence of a composition defect.

Retained native session 3 belongs to app PID `34608`; the OS records its WebContent
child as PID `34612`. The following events are from that actual session, in
Australia/Brisbane time on 2026-10-26. They are not a fresh reproduction or a timing
estimate from the CI browser.

| Time | Causal evidence |
| --- | --- |
| 18:45:32 | `pmset` records the display turning off. Its next display-on event is 19:05:28. |
| 19:01:15.031 | The app's WebKit activity log reports its window visible but occluded, then marks the view invisible. |
| 19:01:21.652 | WebContent reports ready to suspend. WebKit releases its assertions with no foreground or background activity. |
| 19:01:22.766 | `runningboardd` explicitly suspends WebContent PID `34612` and records `running-suspended`. |
| 19:05:28 | `SkyComputerUseService` creates user-active and display-awake assertions for the earlier CUA inspection. The display turns on. |
| 19:05:29.014 | WebKit marks the same window visible. It sends resume IPC because the process was suspended, naming the activity-state change as the wake reason. |
| 19:05:29.063 | `runningboardd` explicitly resumes the same renderer. The original probe then finishes reorder/history and the remaining groups. |

The OS suspension lasts **246.297 seconds**. It accounts for **99.3393%** of the
original **247.935-second** literal-to-reorder interval, leaving **1.638 seconds**
outside suspension. No retained WebContent event occurs between suspension and resumption.
The app's UI process records visibility changes immediately before resuming its
renderer; those are distinct processes. The failed CUA inspection was therefore
an intervention that woke the display, even though it returned no useful UI snapshot.
The original functional pass, cleanup and signed executable identity remain valid
for their stated scope. The result establishes no foreground responsiveness claim.

#### Replay and competing explanations

The ignored `check-pause.py` replays the exact original symptom against
`native-mac-03/runtime-ui-screen-composition.json`. It exits 1 with
`literalToReorderMs: 247935` and `functionalPassed: true`. Its 30-second discriminator
locates this recorded gap; it is not a new product performance threshold.

Before further experiments, the ranked predictions were display sleep, independent
window occlusion, app request-lane stall, then an incorrect probe wait. The retained
OS trace supplies the intervention directly: display wake, visibility change and
explicit renderer resume precede completion. The longest suspend/resume pair for
the exact child explains the interval. Host power records also show the existing
assertion prevented system idle sleep but did not prevent display sleep. No separate
app or probe stall is needed to explain the pause. The earlier ResizeObserver
diagnostic has no established causal relationship to this host suspension.

`python3 .toolchains/screen-composition/pause-diagnosis/audit-cause.py` exits 0 after
matching process ownership, suspend/resume, power and visibility order, the explained
duration and absence of WebContent activity. Its first draft incorrectly required
the app UI process to remain silent until renderer resumption; the process-specific
check corrects that diagnostic assertion. `cause.json` retains the result and input
SHA-256 hashes; `causal-events.log` retains the minimum event sequence. Original
`historical-host.log`, `historical-webkit.log` and `historical-power.log` extracts
remain ignored beside them. Nothing in the original native receipt was rewritten.

#### Recommended correction and scope

Correct the Mac native runner at its host boundary. Verify an unlocked console and
an awake main display before launching, hold an owned temporary display-awake and
system-idle assertion for the full child lifetime, and release it on every exit path.
The local `caffeinate(8)` manual confirms that `-d` prevents display sleep while
`-i` prevents system idle sleep; a utility-bound assertion ends with that utility.
An already sleeping display needs an explicit wake and another preflight check.
Retain host power/visibility state with monotonic checkpoints so a suspended renderer
cannot be mistaken for a slow operation. This review recommends that correction;
it does not implement or qualify it. A future focused check belongs at the runner's
preflight/assertion lifecycle and actual Mac desktop boundary, not in a source-model
unit test. No production timeout, request ordering or UI behavior change is indicated.

The historical intervention made a new native comparison unnecessary. Read-only
preflight also found the current Mac locked with its display asleep, so neither
reserved native session was started. The retained signed executable still hashes to
`1a914c1ad33b73a761da853235fa563f9d1d13bf517ef168fa96962cf38d4c53`, and strict
signature verification passes. One small read-only Objective-C host-state observer
was compiled into the ignored diagnostic directory; no app package was built.

Additional use for this investigation is **zero app builds, native sessions, SDK
processes and CI dispatches**. Historical cumulative counts remain Mac packages
3/7, native sessions 3, SDK campaigns 2 and physical SDK starts 4; Windows packages
1/2, native sessions 1/2, SDK campaigns 2 and physical SDK starts 4; CI dispatches
1/2. Compile and lint remain separately counted SDK children. The two initial
diagnostic reservations are unused and closed. No new app/helper/server or power
assertion remains. Diagnostic files stay in the ignored, named debug directory.

The unexplained-pause investigation is complete. #37 remains open for its acceptance
decision and PR preparation; PR creation, merge and release remain unselected.
Production behavior and the native runner are unchanged. Existing test and design
approvals retain their original scope.

Repository validation passes for 956 files, and whitespace checks pass. The diff
contains only evidence, live status and the incident index; no product or runner
file changed. CURRENT and HANDOVER remain above their normal word-count review
targets because their earlier phase results and protected recovery records remain
intact. The detailed diagnosis stays in this evidence owner.

### Mac native runner correction selected, 2026-10-27

Kris requested implementing the recommended fix with principle-fix-root-causes and
testing it. The same chat retains sole writer ownership on `0aba94c`. The selected
correction is the native runner's unlocked/awake admission and owned power-assertion
lifecycle, followed by focused regression checks and the real packaged composition
case. Production app behavior remains outside this harness correction.

Reserve two Mac native sessions for correction verification and one possible
evidenced correction, cumulative sessions 4 and 5. Count every started app session;
a host-preflight refusal before launch consumes none. No package build, SDK start
or CI dispatch is selected. The user's diagnostic allowance and explicit fix/test
request authorize this bounded continuation. Test the runner boundary already
identified above, including refusal and assertion cleanup under child failure,
timeout and interruption. The current locked/asleep desktop has been reported to
the user; implementation and portable boundary tests proceed while unlock is pending.

The fix applies at the shared `run-runtime-ui-probes.py` launch boundary for every
ordinary and optional case, including owned-screen, composition and canvas cases.
It uses a small `macos_native_desktop.py` adapter for CoreGraphics session/display
queries and process-owned IOKit power assertions. It checks admission before and
after acquisition, holds display and system-idle assertions, checks the desktop at
exit and releases every acquired assertion independently. The per-case desktop
receipt retains monotonic state samples, assertion IDs, admission and cleanup.
Windows uses no Mac API. Production app code and the signed package are unchanged.
An audit of neighboring native launchers found separate historical/specialized
walkthrough owners; this patch changes the shared runner used by #37 and all of its
cases, without reopening those frozen qualification plans.

Focused tests first failed when locked admission and power ownership were absent.
The integrated runner test also failed on interruption: it left the app alive while
the desktop guard released power. A further reader-start failure showed the same
ownership gap before the wait loop. The runner now registers child cleanup
immediately after `Popen` and reaps it before the outer power scope can exit.
The ten new boundary cases pass, including timeout/failure/interruption,
reader-start failure, partial assertion acquisition, changed/unknown desktop,
independent release failure and the portable Windows path.

The first full harness run retained in `pause-fix/harness-01/` failed three existing
simulated owned-screen cases because their fixtures omitted the new OS boundary.
Their controlled app/source/cleanup assertions remain intact; they now also supply
controlled awake desktop/power APIs. The corrected `harness-02/` passes all four
groups with Python 3.12.14 and pinned Node. Its Python group has 247 passes and three
expected Windows-only exclusions (250 cases); the retention group passes ten cases.
The later reader-start regression and immediate cleanup registration pass the
focused ten cases plus all three existing owned-screen runner cases. Final Python
discovery in `pause-fix/python-final.log` passes the strict host gate with 248 passes
and the three expected Windows-only exclusions (251 cases). Unchanged Q1/retention
results retain their scope. Supported Python is 3.12.14; early focused cycles also
passed on system Python 3.9, which was not used for the full harness qualification.

The actual Mac runner refused the locked/asleep host before `Popen`; its receipt is
in `.toolchains/screen-composition/pause-fix/locked-preflight/`. No app session was
started. A separate real OS check creates both IOKit assertions, observes both in
`pmset -g assertions`, releases them and verifies no owned assertion remains.
`pause-fix/power-api.json` retains that result. It changes no desktop settings and
does not unlock or wake the host. Native composition verification is prepared but
still requires the user's desktop unlock. Both reserved app sessions remain unused;
no additional package, SDK process or CI dispatch has run.

The final single-agent review checked power ownership, partial acquisition,
independent release, unsafe/unknown state refusal, child cleanup order and Windows
API isolation. No debug instrumentation or app behavior change was introduced.
The retained signed executable hash still matches package 3. Native verification
must use the corrected runner with that unchanged app, the explicit
`screen-composition` selector and a fresh
`.toolchains/screen-composition/pause-fix/native-mac-04/` output directory. Require
the six original functional groups, source/metadata/reopen and fixture cleanup,
plus admitted/awake desktop samples and both assertion releases. Compare the
literal-to-reorder gap with historical session 3 without creating a new product
performance threshold. The user's unlock is the remaining capability requirement;
the pending native result supplies no pass.

### Corrected Mac runner native verification, 2026-10-27

Kris confirmed desktop unlock. Live preflight on harness candidate `05cfc9d` finds
the console logged in and unlocked, main display active and awake, and no existing
Loomlight process. Strict signature verification passes and the retained package-3
executable hash remains
`1a914c1ad33b73a761da853235fa563f9d1d13bf517ef168fa96962cf38d4c53`.
Reserved native session 4 is selected with fresh `pause-fix/native-mac-04/` output
and the explicit `screen-composition` case. This starts no SDK and builds no package.
The second reserved session remains available only for an evidenced correction.

Native session 4 passes on the unchanged signed product candidate `602613d`, using
the corrected harness at `05cfc9d`. It exits 0 without timeout in **9.594 seconds**.
All six original groups pass: composition/history, literal editing/history,
keyboard reorder/history, confirmed removal, protected-source reconciliation and
reopen. Accepted source matches disk and metadata; all seven owned identities and
selected-node reopen pass. Host/request/credential-owner and fixture cleanup pass,
with no source bytecode, saves or scratch jobs. Accepted source SHA-256 is
`054c7e76bc2336bfa4000b51272342a004ff34e22b98af650224458a833b0901`.

Literal-history completes at 2.473 seconds and reorder-history at 3.122 seconds.
That interval is **649 ms**, compared with historical session 3's 247.935 seconds.
The original diagnostic replay changes from detected gap to no detected gap on
this receipt. It remains a diagnostic comparison, not a product timing threshold.

The desktop receipt records unlocked/awake admission before acquisition, the same
state immediately before launch and after child exit, and both owned assertion
IDs (`41701` display, `41702` system idle) released successfully. The OS power log
independently records the runner's display assertion created at 07:52:36 and
released at 07:52:45 (Australia/Brisbane). No runner-owned power assertion or
Loomlight process remains after the audit. `audit.json` retains input hashes,
source/duration checks and the scope below; `native-power.log` retains those OS
events beside the original native/desktop receipts in `pause-fix/native-mac-04/`.

A separate pre-existing `caffeinate -di` process (PID `47152`) also held display
and system-idle assertions during this run. It remains untouched. This native run
qualifies the complete corrected-runner workflow on an awake desktop and its own
assertion lifecycle. Its elapsed time alone does not isolate the runner's assertion
as the only sleep-prevention mechanism. Locked/asleep refusal, the earlier actual
IOKit acquisition/release observation and the focused lifecycle regressions provide
the separate boundary checks. No forced sleep, lock or idle-duration campaign was
selected or claimed.

The requested runner correction and native verification are complete. Additional
use is one Mac native session, zero package builds, SDK processes or CI dispatches.
Cumulative Mac use is packages 3/7, native sessions 4 under the approved extension,
SDK campaigns 2/2 and four physical SDK starts. Windows and CI counts are unchanged.
The second native correction reservation is unused and closed after the passing
run. Existing functional qualification retains its scope; acceptance and PR
preparation remain separate. No app behavior changed.

### Final implementation review and corrections, 2026-10-27

Kris selected continuing #37 with the implement skill. The fixed review comparison
is `8f7f9e7...4d65e91`. Standards and Spec agents worked read-only; this chat remains
the sole file writer. Spec initially found no implementation mismatch. Standards
found two P2 violations: invalid text submission replaced the focused control
without associated field errors, and a Mac desktop-exit failure skipped remaining
fixture cleanup and result recording.

Both defects reproduced before correction at the existing approved component and
runner seams. `final-review/dom-red-02.log` records missing completion validation
and lost submission focus. `runner-red.log` records post-child lock/release failures
escaping before fixture audit. The first DOM test draft used a Happy DOM ARIA
selector it does not reflect and object-diff assertions; its earlier failed log
is retained separately. The corrected fixture catches the intended failures.

Completion validation now reuses the existing authoring field helper, moved from
the Story condition module to `authoring-input.ts` with textarea support. Empty
input gets an associated inline error on blur/submission, retains its value and
the same focused control, and stays untouched during IME composition. Correcting
the value clears the error without rerendering. The error strings and normal C5
layout remain unchanged; the invalid state uses the existing field-error pattern
required by UI.md, not a new layout design. Two new DOM cases pass with all eleven
composition component cases. TypeScript passes.

The runner now distinguishes desktop errors from unrelated failures. A prelaunch
refusal still prevents launch. A desktop failure after a child starts remains a
failed result while helper/fixture audit, cleanup and report writing continue.
The integrated fixture passes both post-child lock and independent release-failure
subcases, retaining successful app evidence without converting the overall result
to a pass. The ten existing desktop lifecycle cases also pass. The Standards
correction review reports both findings resolved and no remaining standards or
meaningful smell finding.

Chrome's complete renderer/core case passes the changed invalid fields plus the
six existing groups, pointer order, stationary confirmations and stale removal.
The full WebKit rehearsal and a shorter validation diagnostic both retain the
previously documented ResizeObserver undelivered-notification failure. They supply
no WebKit pass. Their controller assertions completed, but the outer error gate
remains failed. The shorter diagnostic's first draft had an import-path refusal
before any browser/service started; that failed result also remains retained.
No production change or error suppression was made to satisfy that diagnostic.

Spec's correction review found no new implementation defect but identified the
remaining native focus proof: old package-3 receipts cannot qualify the new invalid
field behavior. The common composition probe now exercises both invalid forms and
reports `text-validation-passed`; admission requires that checkpoint. Its omission
was accepted before the gate correction and rejected afterward in
`admission-red.log`/`admission-green.log`. Historical six-group receipts retain their
original tested contract; they are not passes under this new seven-group gate.

This continuation selects one final Mac package and editor session for the evidenced
review corrections, within unchanged cumulative ceilings: package 4/7 and native
session 5/5. The earlier runner-only unused reservation was closed after its pass;
the current user-selected implementation continuation now needs the focused review
correction proof. No ceiling is increased. No SDK campaign/start or CI dispatch is
selected. Unchanged source/core, SDK adapter/helper plan and runtime proof retain
their earlier candidate-bound scope. Run the ordinary final suites first, then
qualify this corrected renderer/probe in the signed package. A failed native/build
attempt requires reassessment before any further costly operation.

Final TypeScript/frontend checks pass all 243 cases, zero failed/skipped. The four
final harness groups pass; Python discovery has 249 passes and the three expected
Windows-only exclusions (252 cases), and retention has ten passes. Rust formatting
and actionlint pass. The strengthened common controller passes all seven groups in
Chrome against the real core, followed by pointer order, stationary confirmations
and stale-removal checks. These are browser/service results, not native proof.

Chosen Chrome captures of the two invalid states are retained under
`docs/design/design-lab-help-composition/production/` with filenames beginning
`2026-10-27-invalid-`. They show only the disposable public fixture, dark theme,
1100x800 CSS viewport and scale 1. They are production check evidence, not a new
design approval. The SHA-256 values for addition and text are respectively
`4c6162c7c3d0a001a999082723179c10f3eefac78086305f73edca64ec3489c4` and
`a71f3caf5caae8f84e1684262bbd9fce3a90c308d078cc17d77d5b38135cb89b`.
The pinned C5 reference and approval remain unchanged.

The final ordinary core suite passes 417 cases, with 48 intentional SDK/specialist
ignores and the three documented broad-run exclusions. The named audit matches
all 465 listed cases to their actual pass/ignore rows, including Rust's ignored
reason suffixes. Its first diagnostic parser omitted those suffixes and was
corrected without another core run. `final-review/core-audit.json` retains the
input hashes and unchanged core tree. No ignored case supplies a pass. No SDK
process started during these ordinary suites.

### Final review native qualification, 2026-10-27

Correction candidate `73ffb7f` includes both resolved review findings and the
required seven-group composition probe. Package 4 passes strict signature and
installer-content checks on the unchanged approved Mac identity. Executable SHA-256
is `b118a214b1280489e2e2c6b60ae3df5dd10f17dea18ee8701c4e34d26a4fc8c1`;
installer SHA-256 is
`228c9c42700d6eea35dc0a2a58f563fc7ea656f1ad0174f3ece1ae4bc1656b96`.
Its candidate/identity receipts and installer remain in
`.toolchains/releases/l02-composition-04/`. Actual package consumption is now 4/7.

Live preflight finds the console unlocked and logged in, the display active/awake,
and no existing Loomlight process. Select native session 5 against this exact
package with fresh `final-review/native-mac-05/` output. No SDK or game is started.
The pre-existing separate `caffeinate -di` process remains untouched, so this run
will establish native functional/focus behavior, not isolated sleep-prevention
performance. Both review axes report no remaining code finding; the Spec axis's
current-renderer native focus result is the remaining required proof.

Native session 5 passes on this exact signed candidate in **9.425 seconds**, exit 0
without timeout. The current admission gate accepts all seven groups, including
`text-validation-passed`. Both invalid submissions retain the same focused field,
associated error and unchanged source. The original composition, literal history,
reorder, confirmed removal, protected Source and reopen groups all pass. Accepted
source and metadata match disk; seven owned identities and selected-node reopen
persist. No bytecode, saves or scratch jobs remain. Host/request/credential and
fixture cleanup pass. Desktop admission/exit are unlocked and awake; both owned
power assertions are released. No owned app or power assertion remains.

`final-review/native-mac-05/audit.json` retains source/artifact hashes and current
gate checks. Accepted source SHA-256 is
`4345f766cdc9e2fd4997b8ed64879469ca366cc97a9ec5965bc7009862f348ce`.
The Spec reviewer independently read the native/desktop receipts and matched the
retained executable and installer to package 4. Its current-renderer focus evidence
gap is resolved. Cumulative consumption is Mac packages **4/7**, native sessions
**5/5**; Windows packages **1/2**, native sessions **1/2**; SDK campaigns **2/2** and
physical SDK starts **4/4** on each host; CI dispatches **1/2**. No further costly
operation is selected. The separate external display-awake assertion remains
untouched; no isolated performance result is claimed.

### Final acceptance review, 2026-10-27

All seven #37 criteria have verified evidence. The leaf is `review_ready`; its
formal acceptance and PR creation remain separate decisions. Earlier failed
attempts, six-group contracts and candidate identities retain their recorded scope.

| #37 criterion | Evidence and reuse basis | Result |
| --- | --- | --- |
| Minimal add/edit/reorder/remove, groups and stable selection/history/reopen | Public dispatcher composition cases; current seven-group renderer/core and signed Mac candidate `73ffb7f`; audited Windows six-group candidate `d80c323` for unchanged successful source operations. | Verified. |
| Pointer/keyboard hierarchy and canvas selection, Design entry and type/depth help | Component/controller checks; actual inert helper selection/double-click and draft proof retained from both-target qualification; current pointer/keyboard/tree checks. Helper plan and supported source model are unchanged. | Verified for functional selection; no new canvas-fidelity claim. |
| Parent/protected constraints, retained input and minimal source preservation | Dispatcher refusal/dirty/stale cases; component draft recovery; actual Source reconciliation; current invalid-field focus/no-write group and browser stale-removal refusal. | Verified. |
| Exact leaf/group removal, named descendants and unchanged Cancel | Exact-subtree core cases; stationary compact/wide browser confirmation; native cancellation/removal/history. Current source/transaction code is unchanged from qualified core. | Verified. |
| Protected/root/containing-group refusal and stale/conflicted retention | Protected-neighbor/root dispatch cases, retained field drafts, real external edit during confirmation and native protected Source group. | Verified. |
| One history entry, exact grouped restoration, next/previous/parent fallback, focus and reopen | Core removal/fallback/history cases; revision-bound unmarked selection and reopen component cases; current native history/source/owned identity checks. | Verified. |
| Nested example and protected neighbor in deliberate Ren'Py | Retained Mac SDK preview and audited Windows exact named compile/lint/render/Stop/cleanup. Core source generation, SDK adapter, inert helper plan and runtime code are unchanged; no new SDK result is claimed. | Verified for the selected nested example. |

The final ordinary core tree is unchanged from `602613d`:
`45b2674cc283b170df00a8252be70f06462b8202`. New code affects field validation,
probe admission and native failure cleanup, not source generation or SDK execution.
Their changed boundaries have current rejecting/positive tests and signed Mac proof.
Retained Windows/SDK results do not become current-candidate runs. Full WebKit
diagnostics remain failed on their recorded ResizeObserver notification; the current
packaged Mac WebView passes the required functional path. No physical-input,
canvas-fidelity, full-editor or full-3B acceptance is inferred.

#### Standards

Two P2 findings were corrected with red/green checks: associated completion errors
and focus on invalid text, and independent cleanup/reporting after a desktop error.
The correction review and final probe/admission review report zero remaining
documented-standard violations or meaningful code-smell findings.

#### Spec

No implementation mismatch or scope creep remains. The reviewer identified the
new invalid-field native focus evidence gap, then independently resolved it against
package 4/native session 5. Zero remaining Spec findings or required evidence gaps
within #37's selected functional scope.

Visual fidelity remains the approved C5 `workflow-popup-v1` composition mapped in
the earlier C5 controls section, with its recorded shell/naming and source-only
canvas differences. The correction changes no normal layout or CSS. Its invalid
state uses the existing authoring field-error pattern; the new captures and current
native checks verify that state without claiming it was an approved C5 capture.
All mapped functional actions are verified within the table's scope.

Final review totals are Standards **0 remaining findings**, Spec **0 remaining
findings**. No code, qualification, CI or watcher work remains pending. The prepared
PR targets `codex/phase3b-screen-designer` from the selected branch. Its title/body
are local review artifacts under `.toolchains/screen-composition/final-review/`.
At this checkpoint PR creation needed explicit approval. The later approval and
publication are recorded below. Merge and release remain unselected.

### PR publication, 2026-10-27

Kris explicitly instructed, "Yes, create the PR for #37 into
codex/phase3b-screen-designer." [PR #62](https://github.com/Caldwell-41/Renpy-editor/pull/62)
was created as an open, non-draft PR with the prepared title and description, then
attached to this chat. Read-back verified head `codex/37-compose-help-layout` at
`ab176ed608752d2172028b958535319a84746a6d` and base
`codex/phase3b-screen-designer` at `8f7f9e7191f3b9c27343c7f4d4f5fdc65b2135f4`.
The description says "Implements #37"; the issue remains open for formal acceptance.
The tested product/probe candidate stays `73ffb7f`; later status documents do not
become a new native/SDK candidate. Merge and release remain unselected.

Automatic Repository quality run
[40418047591, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40418047591/attempts/1)
reports head SHA `ab176ed608752d2172028b958535319a84746a6d` for the PR event.
At 2026-10-26 23:12 UTC, repository validation passed; frontend tests and Rust
formatting were still in progress. Dispatch-only qualification jobs were skipped
by the workflow and supply no new evidence. No manual workflow was dispatched.
At publication the leaf entered `awaiting_ci`; the terminal audit below supersedes
that wait. Existing costly-operation counts are unchanged.

### PR automatic-check audit, 2026-10-27

The ci-watch event for
[40418300606, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/40418300606/attempts/1)
was matched to this chat and acknowledged. GitHub independently confirms
`completed/success`, PR head `ab8ae3edaf866a65ba8a0cebf56130ce3da79b8a`, the selected
branch and open PR #62 into `codex/phase3b-screen-designer`. The PR reports `CLEAN`.

Both required jobs and every executed step pass. Downloaded logs verify TypeScript
checks and **243 frontend passes, zero failures/skips/cancellations**; Rust 1.90.0
formatting; validation of 954 repository files; 13 section-link tests;
Q1 rejection controls/source-selector audit; and ten retention tests.
Dispatch-only jobs were skipped as configured and provide no new qualification.
Raw job logs, run/PR snapshots and the audit record remain under the ignored
`.toolchains/screen-composition/final-review/` directory. No fix or retry is needed.

Functional review remains complete. #37 owns any automatic check triggered by this
documentation-only audit commit and its terminal result. Continue that audit in this
same chat, update the issue, then restore `review_ready` without another receipt-only
commit. The tested product/native/SDK identities and operation counts are unchanged.
Formal acceptance, issue closure, merge and release remain unselected.
