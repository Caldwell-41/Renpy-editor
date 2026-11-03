# Help dialog and base canvas delivery evidence

## Selection and ownership, 2026-11-03

Kris approved the coordinator's read-only plan for
[#45](https://github.com/Caldwell-41/Renpy-editor/issues/45) and
[#46](https://github.com/Caldwell-41/Renpy-editor/issues/46), with Sol 6.1 fast mode
permitted for subagents. The selected outcome is a reviewed, verified implementation
committed on a new local integration branch. Push, PR, merge, issue closure and
release are not selected. GitHub leaves retain bounded scope and acceptance; this
file owns detailed evidence and coordination, not a parallel execution brief.

Integration branch: `codex/help-dialog-canvas`. Base:
`e32ded49f2c4212cd78efc748cdf9b59cdcc0c48` on
`codex/phase3b-screen-designer`, verified against the remote before approval.
The unrelated untracked codebase-design audit and protected recovery stay intact.

| Owner | Assignment and files | Integration dependency |
| --- | --- | --- |
| Coordinator, Sol High | Metadata/schema compatibility, shared screen references/effects, shared parsing and request contracts, `screen-contracts.ts`, `screen-ui.ts`, `main.ts`, shared fixtures, canonical/status/evidence docs and workflows | Owns integration branch and reviews each checkpoint |
| Dialog/Story implementation, Sol High fast | `screens/panels.rs`, `screens/composition.rs` and bounded dismissal module/tests, `scene.rs`, affected `scene/` and minimal exhaustive callers including `source.rs`, `screen-panels.ts`, `scene-ui.ts`, focused tests and normal-entry qualifier | Starts from reviewed shared checkpoint; production UI waits for approved prototype |
| Canvas implementation, Sol High fast | `screens/canvas.rs`, `canvas-renderer.rpy`, canvas session/frame delivery where needed, matched-render cases and qualification | Starts from shared checkpoint; combines with dialog after reviewed commits |

T3 provisioned isolated worktrees at shared base `00eda362fe33696936461b49a2c9c4f76593309a`:
Dialog/Story on `t3/help-dialog-story-call` in checkout `t3-1995c4aa`, Canvas on
`t3/help-canvas-rendering-fidelity` in checkout `t3-4fbe8c4a`. The generated initial
branch names were renamed by T3 after startup. Prototype launch first refused the
obsolete branch ref without creating a chat; retry from the exact committed base
created the sole design chat on `t3/help-dialog-design-prototype`, checkout
`t3-3d879ac4`. Its owner confirms direct return to implementation and coordinator.
The actual private checkout roots stay in T3 metadata rather than committed docs.
One writer owns each file. Agents request shared changes from the
coordinator rather than editing shared files. Shared contracts transfer through
reviewed commits. Mutable fixtures, profiles and outputs stay isolated.

The Dialog/Story agent creates the separately requested prototype chat, supplies
scope and design context, and receives the approved design directly from that
agent. Sol High fast writes prototype code. Terra Max owns browser/desktop
inspection. The existing A2 approval does not cover Call/Finish. New variants
preserve the prior approval and follow Design Lab's approval/source/capture rules.
No affected production UI changes precede the new approval.

## Shared checkpoint

Source-map v8 adds `dialog` and reserves `callScreen` mappings. The existing
migration owner retains older maps' recognition rules and script bytes. Panel
remains the default kind; component remains a separate kind. TypeScript matches
the core catalog and effect response. `finishesInteraction` is distinct from
`hiddenScreens`, with action dependencies included in the effect revision.
Exact dialog Return actions are local to the dialog. Captured values and custom
actions remain unqualified. Component extraction cannot capture dismissal.

The Dialog/Story lane will implement `CallScreen` as a separate Beat payload using
the existing `ScreenTargetBinding` and `ScreenRevisions`. Scene Call and Story
Return keep their owners. The proposed creation contract adds an optional
panel/dialog kind to the existing `screens.create` request, defaulting to panel;
the coordinator owns that request change and source-builder wiring when the lane
supplies its dialog builder. No second creation or persistence implementation.

Checkpoint verification on Mac ARM64:

- The new public-core dialog-resolution test initially fails at `InvalidMetadata`,
  then passes after the implementation. It proves exact Return qualification,
  separate Finish/Hide effects, action dependencies, unsupported Return-value
  uncertainty and stale effect-revision refusal.
- Nine screen-reference tests, five metadata tests and the source-preserving
  metadata migration/no-op reopen test pass.
- Typechecking, test compilation and 27 affected component/Story DOM tests pass.
- Rust formatting and whitespace checks pass. No SDK/helper/package/native/CI
  operation ran. An initial test command used the wrong relative environment
  script path and started no compiler; the corrected command produced the red test.
- Repository validation passes for 1,470 files. CURRENT/HANDOVER remain above their
  review targets at 3,073/5,803 words because the existing recovery/history size
  exception is preserved; this checkpoint adds only the live selected-outcome entry.

This checkpoint implements contracts, not dialog creation, runtime Call or canvas
acceptance. Final independent review and combined verification remain pending.

## Approved test seams and acceptance

Plan approval confirms these test boundaries for the implement/TDD workflow:

| Seam | Required proof | Limits |
| --- | --- | --- |
| Actual UI through core authoring | Minimal source writes, one history entry, no-op/Cancel, retained invalid/stale/conflicted drafts, stable references, Undo/Redo, Source reconciliation and reopen | Does not prove runtime behavior |
| Pinned SDK normal-entry game | Modal blocking, focus, Close/Escape/outside click, Call waits and Finish continues at the following Beat once | Scratch preview alone cannot pass |
| Canvas plan/helper/installed image | Actual assets/fonts/styles, geometry/wrapping, inert controls, synchronized selection and stale-frame handling | Requires matched actual SDK captures |

Compare identical source/assets/fonts/state at 1280x720 and 1024x768 on Windows
x64 and Mac ARM64. Exclude editor guides. The accepted baseline has no pixel
tolerance. A new tolerance requires evidence and Kris's decision. #46 stays within
the base fixed/frame/vbox/text/image/textbutton scope; #50/#54 and whole-editor/3B
acceptance remain separate. Numerical timing qualification stays closed under the
accepted release decision unless a new concrete regression is observed.

## Operations and continuation

Development stays on this Mac. The linked SUNDOWN host was reachable during
planning; Windows checkout/toolchain/SDK/ownership preflight remains pending.
Costly SDK/helper/package/native/CI operations are not started by this checkpoint.
The coordinator will record their concrete case matrix, counting unit and ceiling
before execution. Historical closed allowances remain closed. Routine local
checks, review and commits need no numerical allowance.

### Selected operation limits

| Outcome | Planned SDK starts per target | Ceiling per target | Current use |
| --- | --- | --- | --- |
| #45 dialog normal entry | 11: version, compile, lint, eight normal-entry cases | 16 | Mac 0; Windows 0 |
| #46 base Help fidelity | 8: compile, lint, two normal-entry runs, two adapter validations, discovery, persistent helper | 12 | Mac 0; Windows 0 |

Targets are Mac ARM64 and Windows x64. The #45 matrix runs pointer Close,
default-focus keyboard Close, Escape and outside-click/underlying-blocking cases
at both aspects. Every case proves the following-Beat counter remains zero while
Call waits and reaches one after Finish. The #46 matrix compares two base screens,
both aspects and normal/hover for eight matched frames per target. Its helper is
one persistent SDK process for all frames. New namespaces are `base_help_fidelity`
and `base_help_anchors`, separate from #45 and historical proof fixtures.

The ceilings include five focused correction starts for #45 and four for #46 per
target. Every actual SDK process start counts, including version/validation,
failed/cancelled attempts and helpers. Uncertain starts reserve capacity until
resolved. Shared setup starts are charged once to their producing outcome and
linked when reused. No native-editor/package/CI starts are selected by these limits.
Execution remains gated on a committed coherent producer/fixture, audited offline
admission checks and host preflight. A limit is not a launch instruction. The
coordinator controls reservations and resolves all pending starts before a retry.

No publication is selected. Required published CI/package qualification remains
an acceptance gap until authorized; connected-host evidence retains its exact
candidate and scope. Agents must not independently start an expensive campaign.

Both implementation lanes and the user-iterable prototype chat are active. The
Dialog/Story owner proceeds with backend work while the prototype seeks approval.
Canvas confirms the current mappings already cover native base displayables,
numeric coordinates, typography/Styles and verified assets, with no demonstrated
production deficiency yet. It is preparing a coherent expanded comparison fixture
and offline gate. Its proposed five SDK starts per target remain provisional until
driver/discovery side effects are counted; no campaign is authorized or started.
SUNDOWN is reachable and its registered Loomlight project is identified, but checkout
and toolchain capability preflight remains pending. Each implementation lane follows the
implement skill, commits its assignment, and returns its reviewed result. The
coordinator integrates Dialog/Story before Canvas, runs combined checks and separate
Standards/Spec review, resolves findings and records criterion-to-evidence results.

## Dialog builder and shared creation checkpoint

Worker builder commit `994c9b1014d0be3ce6c7e67d560a648646356832` was inspected and
integrated as `3adc75d`. It extends the existing Help builder, keeping a single
content implementation, with five focused tests and typechecking passing. No
production UI changed and no costly operation ran.

The coordinator wires panel/dialog creation through the existing source/map
transaction, removes the redundant internal create-kind argument, and migrates
component callers to the authoritative request kind. A resolver-owned `blocking`
flag qualifies exact single root modality; unsupported/missing declarations keep
effects unknown. `editable_dismissal_action` supplies an expression-only range
using the shared lexer and local action qualifications for the lane's bounded
composition command. Its public-command behavioral proof remains with that lane.

Public-core tests first fail on missing blocking and refused dialog-create payload,
then pass. Ten reference tests, five Help builder tests, 21 component tests and
27 affected DOM tests pass; production/test typechecking and formatting pass.
The 15 existing Story panel tests also pass. An initial wrong Story module filter
ran zero tests and establishes no proof; the corrected named filter ran all 15.
A TypeScript fixture missing the new blocking field was corrected, then test
compilation passed. Normal-play, matched-target, UI and final review remain pending.

## Windows read-only preflight

The SUNDOWN preflight completed with no file, checkout, stash or process changes,
and no SDK/helper/native/package/test/build/CI start. The registered project and
origin match Loomlight. Windows 11 x64 reports build `10.0.26200.9711`; WMI access
was refused, while Python corroborates the OS. Node 24.19.0, npm 11.9.0,
Rust/Cargo 1.90.0 and Python 3.12.14 with Pillow 12.3.0 are available. Existing MSVC
and Windows SDK library files are present; no compilation ran.

The official Ren'Py 8.5.3 archive hashes to
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`.
The staged SDK exists, but its entire tree was not compared to the archive. No
SDK version, discovery or adapter validation ran. Prior #41/#44 normal-game ANGLE2
and #36 private-desktop/helper cleanup receipts establish earlier capability only.
They do not qualify the current source, current private-desktop/display readiness
or either selected ticket.

The primary checkout stays clean on `codex/phase3b-audit-fixes` at
`039f22ce3c118f408145573ccedfeac0e93b7b70`, with its protected stash unchanged.
The new local-only shared commits are absent there. Existing secondary worktrees
remain reserved; sandbox ownership checks refused their status without changing
Git safety configuration. Their cleanliness and live ownership are unproved.
No Loomlight/Ren'Py process was observed. Existing unrelated Python processes were
left alone, and protected draft/credential contents were not read.

After the integrated candidate is fixed, use a private hashed Git bundle through
the existing authenticated Taildrop route, verify/import to a new ref, and ask T3
to provision the assigned fresh checkout without an origin fetch or setup-script
execution. Preserve the primary checkout and existing worktrees. Execution paths
and process identities remain in the private T3 preflight receipt. Transfer and
qualification have not started. Both ticket SDK counters remain zero.
