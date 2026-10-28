# L04 nested and clipped layout evidence

[#42](https://github.com/Caldwell-41/Renpy-editor/issues/42) owns scope, acceptance,
operation limits and current consumption. The implementation branch is
`codex/phase3b-l04-nested-layout`, based on `eb83d3b`. All four acceptance criteria
remain pending until the affected Windows and signed Mac native checks and final
independent review are complete.

## Approved design and integration

Kris approved A2 `focused-refined` / `focused-v2` with "approved".
[Approval](../../design/design-lab-nested-layout/approval.json) pins source
`b2fffee2a3983ff309c27502fdfc215f56b1ccd0` and fingerprint
`98ceba77f44a69e91840ea4afa09e0e19118656fc9caa474a765753d5269e42d`.
The seven scoped prototype commits were integrated sequentially. All 13 source
hashes and 14 captures verified, and the source fingerprint reproduced before
production edits. The prototype worktree remains pinned for comparison.

The existing combined Design Lab check remains failed at initial navigation's
8-second timeout. Its external 45-second diagnostic remains failed at flow-v1's
changed-source refusal after 488 cases. The approved prototype's focused 64 cases
and interactions passed; these failures are not a combined-gate pass or waiver.

Production extends the existing composition and numeric-layout owners. Grid counts
join other element fields in one Apply. Window/frame/viewport use one direct child;
grid uses literal 1-64 axes, row-major order and explicit empty-cell permission.
[Data model](../../DATA_MODEL.md#nested-containers-and-viewport-limits) owns the
bounded mappings and Source-only behavior. The Source modal retains screen drafts
and opens the existing editor through Edit in Source. Existing Source-navigation
probe consumers were migrated to that explicit action.

## Portable and real UI/core checks

The first core slice failed at unsupported composition, then passed new-container
creation, stable identity, Undo/Redo and reopen. Further public requests verify
minimal grid-header/layout changes, one history entry, no-op, capacity refusal,
canvas-draft validation and lossless Source-only viewport refusal. A public-core
fixture prepares both accepted viewport heights used by SDK qualification.

The real browser/controller/core sequence passes grid creation/editing, capacity
errors, focused Apply, Cancel, Source-modal draft retention, parent navigation,
retained child drafts and stale Source reconciliation. The exact packaged L04
probe also passes its real-core browser rehearsal, including nested composition,
viewport/source edits, protected neighbors, grouped removal/history and reopen.
These browser results do not establish native WebView or SDK execution.

The frontend suite passes all 264 cases. The 43 affected existing screen component
cases also pass. The ordinary broad core run passed 402 cases and failed 31 unrelated transport
cases because the sandbox denied localhost sockets. All 38 cases in that affected
module pass with socket access, resolving those 31 failures. Combined ordinary
coverage is 433 cases; 49 explicitly selected-out SDK/specialist cases remain ignored
and three policy exclusions remain filtered. The four new core cases pass again
with explicit grid count units. No failed required case is treated as a pass.

## Mac SDK geometry and clipping

[Local SDK receipt](nested-layout/local-sdk.json) retains the accepted-source hashes,
four normal-entry aspect/opening records, helper backend and cooperative shutdown.
The public fixture contains window padding, an hbox, a 2x2 grid with an empty cell,
and a viewport containing larger content. Normal game entry qualifies 1280x720 and
1024x768 at openings of 100 and 200 pixels. Exact rectangle checks pass. Alpha-render
samples establish that the right edge clips, increasing height reveals content,
and the surrounding window background remains outside the opening. Pixel checks
compare exact colors within the same source render; no tolerance is introduced.

The inert GL2 helper passes the same four conditions. Its visible descendant hit
bounds match the clipped opening, and completely clipped text has no canvas hit
region. Closing the project stops the helper cooperatively with exit 0 and removes
its private directory. Full GPU pixel agreement remains with L19.

These local checks used the implementation working tree before its commit. Later
formatting and UI/probe changes do not change the SDK displayable mappings or accepted
fixture bytes. The grid count-unit refinement changes typed request validation,
not the integer data passed to the SDK. Focused public-core/UI checks cover that
refinement; the final native candidate and Windows qualification remain separate.

## Retained failures and corrections

- Helper attempt 1 stopped during preflight at a numeric JSON lookup. No helper/SDK
  process started. Attempt 2 reached the missing displayable mapping and failed with
  `Unsupported canvas kind`. Attempt 3 passes after the four SDK mappings were added.
- Source campaign 1 stopped on a package-relative input-path error before launching.
  Campaign 2 passed compile/lint and reached correct geometry, then rejected the
  validator's incorrect intrinsic-size expectation for clipped content. Its software
  framebuffer screenshot is striped and is excluded from pixel proof.
- Retained pixels and pinned SDK source distinguish framebuffer byte-format corruption
  from layout errors. [Earlier diagnostics](canvas-rendering.md#decisive-results)
  already exclude software window captures. Campaign 3 used an incorrect export
  namespace and exited 61. Campaign 4 uses `SWDraw.render_to_texture` with alpha and
  passes all four cases. It reuses campaign 2's compile/lint only after verifying
  byte-identical accepted inputs and successful, untruncated command receipts.
- The Source modal's first UI check caught Escape cancelling the underlying layout
  draft. Isolating modal keystrokes fixes the original sequence. The native-probe
  rehearsal caught reads completing before the UI history refresh; it now waits for
  the accepted fields. Returning from Source also explicitly opens Choose before
  inspecting hierarchy rows. No deadline or assertion was weakened.

Raw local receipts remain under ignored `.toolchains/l04/`, including original
failures, screenshots and logs. Package-relative copies were preserved and copied
into that owning directory. Current actual use is Mac SDK 10/16 and helpers 2/4;
Windows SDK/helpers, package/native sessions and costly CI dispatches remain zero.
