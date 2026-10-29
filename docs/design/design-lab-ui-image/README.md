# UI image proposals

The original three variants explore asset selection and displayed dimensions inside Screens for
[L06 #40](https://github.com/Caldwell-41/Renpy-editor/issues/40). All remain drafts. Kris selected A for [the A2 refinement](REFINEMENT.md); A2 is also a draft pending review.

- A, Inspector picker, keeps the canvas beside image fields and chooses assets in a dialog.
- B, Asset browser, keeps the project image list beside the canvas and puts fields below it.
- C, Guided image sheet, separates choosing, sizing and reviewing within the inspector.

Run `npm run design:dev -- --port 5176` from `app/`. Open
`http://127.0.0.1:5176/preview.html?screen=ui-image&variant=inspector&state=placed&theme=dark&viewport=wide`.
The bottom arrows switch variants through the URL. Named states cover adding, missing,
replaced and invalid references, plus a source conflict.

## Preserved behavior and simulation boundary

The comparison preserves the existing Screens shell, Choose/Design/Connect steps,
selection path, schematic canvas, Source and deliberate Test entry. Image edits use
the paired numeric convention. Existing composition, full numeric units/alignment,
size limits, nested editing, reorder and removal retain their approved scope; this
comparison does not redesign them. Their disclosure identifies that integration
requirement. The image picker filters to the UI image role and PNG/JPEG/WebP.

All catalog changes, source acceptance, history and reopen use browser memory.
Import offers a staged fictional file and an explicit picker cancellation. It opens
no OS picker and reads no real files. Asset thumbnails are code-native schematic
artwork illustrating fictional raster references. No asset is decoded through the
core, and the canvas proves no Ren'Py geometry. Test starts no SDK or game action.
Source text is generated sample text; it is not a lossless source patch.

Apply accepts one sample image change. No-op Apply adds no history. Cancel restores
accepted fields. Invalid, missing, changed and conflicted references retain input.
Choosing another element or opening Source retains image input. History and reopen
require pending edits to be resolved. Aspect preservation uses the selected asset's
original ratio and rounds the other displayed dimension to a whole pixel.

The implementation owner remains in the original chat. Approval must identify an
exact variant/revision before this screen is promoted or sent back for integration.

## Draft verification, 2026-10-29

The pinned Node 24.19.0/npm 11.9.0 toolchain and installed locked dependencies were
reused. TypeScript and approval-record validation pass. The focused review passes
72 combinations across three variants, six states, both lab themes and both lab
sizes. Its interaction check passes for no-op Apply, aspect linking/unlocking,
Apply/Cancel, Undo/Redo, Source and selection retention, file-picker and staged-import
cancellation, simulated import/placement, missing/replaced/invalid reference refusal,
source conflict, adding and simulated reopen. The final focused result is in
`.toolchains/design-lab/l06/review-05.log` and `report.json`. The build checked in
memory excludes all Design Lab modules and writes no production output.

The required combined `npm run design:check` failed at its initial navigation after
eight seconds. Its original log is retained as `combined-01.log` in the same ignored
directory. This is not a combined-gate pass. The screen-local review uses a 45-second
navigation timeout for the lab's recorded approval-loading delay. It changes no
shared runner, threshold or approval. Earlier focused attempts retain the initial
ten-second navigation timeout, a nullable-source type error, and ambiguous Source
and Import test locators. These were setup/check defects. Visual review also found
and corrected preview scaling and a collapsed worksheet body in B. Final checks
cover those corrections. No native, SDK, persistence or product acceptance is claimed.

The `captures/` directory retains the six dark wide/compact draft overviews. They
are review aids, not approved references. All three revision approvals remain null.
The new screen, its registry entry and this design directory are the only tracked
changes. A dependency symlink is local setup and must not be committed.
