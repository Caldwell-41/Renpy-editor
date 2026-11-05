# Integer bars and image buttons

Delivery and bounded acceptance belong to [#51](https://github.com/Caldwell-41/Renpy-editor/issues/51)
and [#52](https://github.com/Caldwell-41/Renpy-editor/issues/52). This file retains
implementation checkpoints, validation and review evidence. It is not another execution brief.

## Approved selection and contract checkpoint, 2026-11-05

Kris approved the coordinator's plan in the current T3 thread. The selected outcome
is a reviewed, verified implementation of both tickets committed locally on
`codex/51-52-integration`, based on `ab19b7869843445dba291ee8b9ef7ea4bef5ffd8`.
Publication, PR creation and merge are not selected. Both tickets' #47 prerequisite
is satisfied. Broader #54 canvas, aggregate groups and Phase 3B acceptance remain separate.

The coordinator owns shared contracts, integration, combined qualification, final
review and findings. A core agent owns both controls' Rust implementations and
tests. An editor agent owns both controls' frontend implementation and tests, and
must create the separately requested Sol 6.1 xhigh design chat before production UI
changes. Both implementation agents use Sol 6.1 xhigh, the implement skill and their
own T3-prepared worktree/branch. Browser and desktop operation uses Terra 6.1 max.
Actual worker checkout, thread and commit identities follow once assigned.

Shared definitions are `screens/controls.rs` and `screen-controls.ts`, exclusively
owned by the coordinator. Implementation files transfer to their named writer after
this checkpoint. A requested contract change returns to the coordinator for a
reviewed checkpoint before dependent work continues. Mutable outputs and fixtures
stay isolated per checkout. No worker starts SDK/helper/package/native operations
without a coordinator reservation.

### Initial interface agreement

- `IntegerBarBinding` names an existing integer variable by stable ID with canonical
  decimal-string minimum and maximum. The qualified mapping must enforce a positive
  range and integer steps, and must reject unsupported or imprecise bounds.
- `BarAppearance` contains nullable literal colors for `left_bar`, `right_bar` and
  `thumb`. Null restores the corresponding default. Qualification precedes support claims.
- `ImageButtonAppearances` requires a normal UI-image reference and nullable hover,
  selected, selected-hover, disabled and selected-disabled references. Every reference
  uses the existing asset ID/content-hash validation. Source names are `idle`, `hover`,
  `selected_idle`, `selected_hover`, `insensitive` and `selected_insensitive`.
  Missing optional states retain Ren'Py's native fallback behavior.
- Composition extends the existing `screens.compose` transaction with `addBar`/`bar`
  and `addImageButton`/`imageButton`. Add commands capture `parentId`; edits capture
  `nodeId`. Bars carry `binding`, `appearance`, `width`, `height`, `layout` and
  `expectedAuthoringRevision`. Image buttons carry `appearances`, `width`, `height`,
  `layout` and the existing `InteractionEdit`. The coordinator reviews exact enum
  wiring before the editor consumes it. One combined Apply is one transaction.
- Inspection exposes nullable `barBinding`, `barAppearance` and
  `imageButtonAppearances` on nodes. Existing action inspection supplies button actions.
  Unsupported expressions remain Source-only with conservative unknown effects.
- Canvas preparation accepts only validated data and marked samples. It must never
  evaluate a value expression, load game code or execute an action. Existing variable
  samples and button-state selection remain separate from source/runtime values.

### Approved verification seams and limits

TDD is approved at public core operations, the actual Screens UI connected to core
dispatch, and deliberate pinned-SDK preview/normal play. Core cases prove minimal
patches, validation/revisions/effects/history/reopen. UI/core cases prove real drafts,
Apply/Cancel, numeric/keyboard editing, picker focus and retained failures. SDK cases
prove binding/limits, appearances and qualified actions. Isolated mocks do not replace
those paths. Workers run focused tests during development and their applicable full
suite at handoff; the coordinator runs the combined full frontend and routine broad
core suites after integration, with documented specialist exclusions.

#51 owns the single cumulative operation record linked by #52. Approved ceilings per
target are 16 deliberate SDK process starts, four helper starts, two package builds
and three native editor launches. Actual starts, including failures/cancellations,
count; audited preflight refusals do not. Windows x64 and macOS ARM64 are required.
Initial use is zero for every category on both targets. No reservation is pending.
Routine tests, typechecking and review are uncapped. Earlier closed allowances stay closed.

### Readiness observations

The local and remote base match and the starting checkout is clean. Windows has
Node 24.19.0, npm 11.9.0, Rust 1.90.0 and runtime Python 3.12.14 with `tomllib`.
The official 8.5.3 archive/checksum record exist; checksum/provenance verification
precedes execution. The linked Mac is reachable; checkout/toolchain readiness remains
to be checked. `gh` authentication fails; the connected GitHub tools can read tickets.
Git transport works with a process-scoped OpenSSL backend selection. No credentials
or machine configuration changed. The sandbox required escalation to create the
approved integration branch; that branch operation succeeded.
