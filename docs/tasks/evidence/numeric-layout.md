# L03 numeric layout evidence

[L03 #38](https://github.com/Caldwell-41/Renpy-editor/issues/38) owns execution,
acceptance and any costly-operation limits. [B02 #24](https://github.com/Caldwell-41/Renpy-editor/issues/24)
owns aggregate node/property acceptance. This file records detailed evidence, not
a second task brief.

## Design preparation, 2026-10-28

Kris selected #38 implementation, focused tests, a PR into
`codex/phase3b-screen-designer` and CI audit. The implementation branch is
`codex/phase3b-l03-numeric-layout`, created from freshly fetched base
`4d2101f36b7491aa51ca513f3b3d819f9460bff8`. Development is on macOS ARM64.
L02 is accepted through PR #62. The architecture ownership boundaries from PR #65
remain unchanged. The unrelated untracked audit and protected recovery remain intact.

The existing flow-v1 and C5 approvals cover composition and dimensions. They do
not identify a numeric inspector for the new properties. Three unapproved
[Design Lab proposals](../../design/design-lab-numeric-layout/README.md) compare
paired sections, an axis worksheet and placement-first editing. No production
code has changed. The user's mock-first rule requires a design decision before
production implementation. The proposed TDD boundaries also await confirmation
under the installed TDD skill.

### Checks at the design checkpoint

- The Design Lab TypeScript check and production TypeScript check pass.
- Approval-record checks pass, including invalid promotion, capture identity and
  shared-source identity checks.
- The targeted browser matrix passes all 48 rendering cases across three layouts,
  four sample states, two themes and two sizes. It reports no browser errors or
  horizontal overflow. Captures are ignored under
  `.toolchains/design-lab/pages/numeric-layout/`. This runner does not include
  a numeric-layout interaction module; its result explicitly reports
  `interactions=false`.
- Direct browser checks confirm keyboard Apply changes sample width from 640 to
  720, keeps focus in the numeric field and enables Undo. Undo restores 640.
  A negative width refuses Apply and retains the input. Editing vertical position
  inside a vertical group refuses with the parent-specific explanation. Escape
  restores the saved value. These checks cover browser samples only.
  C's source-conflict sample also refuses Apply while retaining an edited width of
  800 and leaving Undo disabled.
- Final checkpoint repository validation passes for 972 files; the whitespace
  check passes. The final targeted matrix again passes all 48 cases.
- The combined Design Lab browser check failed after 488 rendering cases and 13
  interaction groups. It reached the existing flow-v1 approved-source guard, which
  correctly refused the current checkout because that reference pins `3c7ea31`.
  The same limitation is recorded in the [C5 approval evidence](simple-help-layout.md#c5-approval-and-handback-2026-10-26).
  No approval record or guard was weakened. The final report is
  `.toolchains/design-lab/report.json`; browser version is Chromium 156.0.8078.48.
  This combined check is a failure, not an overall pass. Source-pinned comparisons
  remain required for later production integration.
- The production build-isolation check ran separately after that stop. Its one
  JavaScript chunk contains no Design Lab module. It inspected the build in memory
  and did not write `dist`.

### SDK reference review

The local checksum-verified Ren'Py 8.5.3 documentation describes the mappings below.
Reading these references does not qualify editable support or geometry.

| Property | Reference meaning | Qualification still needed |
| --- | --- | --- |
| `xpos` / `ypos` | Integers use pixels; floats use a fraction of the parent. | Covered node/parent combinations and both aspects. |
| `xanchor` / `yanchor` | Position within the element; type distinguishes pixels and a fraction. | Anchored geometry and source type preservation. |
| `xalign` / `yalign` | The same relative value sets position and anchor. | Alias ownership and atomic source editing. |
| `xsize` / `ysize` | Sets both size limits; floats can be relative. | Preserve current integer editing; define any added editable types. |
| `xminimum` / `yminimum`, `xmaximum` / `ymaximum` | Pixel limits, subject to the displayable's sizing behavior. | Node rules, contradictory combinations and constrained geometry. |
| Side padding | Window/frame content insets. | Covered types and helper/source agreement. |
| `spacing` | Pixel spacing between box children. | Supported box types and parent constraints. |

The reference is the pinned SDK's `doc/style_properties.html`, especially position,
anchor, alignment, size limits, window padding and box spacing. The production
canvas currently accepts only a narrower property set; additional helper support
must preserve its data-only input boundary and `ScreenCanvasFrames` delivery owner.

### Remaining acceptance

All four #38 criteria remain pending. Required work includes design approval,
confirmed test boundaries, the qualified type/node matrix, transactional editing,
retained invalid/stale/conflicted drafts, production UI-to-core history/reopen
proof, and pinned-SDK anchored/constrained geometry at both qualified aspects.
The implementation still needs final Standards/Spec review, its commit, the authorized
PR and CI audit. No package, native app or SDK campaign has started. Historical
closed allowances remain closed.

CURRENT and HANDOVER remain above their word-count targets because they retain
prior acceptance and unique native recovery. This checkpoint adds only the selected
L03 state and leaves broader historical cleanup outside the feature assignment.
