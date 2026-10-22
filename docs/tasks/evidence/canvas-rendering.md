# L17 canvas rendering proof

[L17 #36](https://github.com/Caldwell-41/Renpy-editor/issues/36) owns selection,
allowance and remaining acceptance. [ADR 0021](../../adr/0021-separate-renpy-canvas-helper.md)
owns the accepted design and gates. This record supports one bounded Help proof.
It does not qualify the full Screens subset or close B07/B08.

## Implemented connection

The production Screens UI requests a revision-bound data plan through the core.
The pinned 8.5.3 adapter starts one private Ren'Py project, supplies only the trusted
renderer plus JSON and copied assets, and reuses its process. SDL dummy video/audio
and software rendering avoid a game window. The runtime process-tree owner handles
Stop and cleanup independently of deliberate project execution. Project close/change
and application shutdown join the helper before removing its directory.

| Source/data | Actual helper mapping |
| --- | --- |
| screen, fixed | Ren'Py fixed-layout MultiBox |
| frame | Ren'Py Window with built-in frame style |
| vbox | Ren'Py vertical MultiBox with built-in vbox style |
| literal text | Ren'Py Text with substitution disabled |
| literal image | Copied image inside Ren'Py Transform |
| textbutton | Ren'Py textbutton with explicit idle/hover sample |
| literal sizes, positions, anchors, spacing, padding, colors, font | Validated properties passed to the corresponding engine widget |
| provisional width/height | Request data replacing size properties, bound to the inspected source revision |
| text sample | Literal canvas-only content; never accepted source or runtime state |
| selection geometry | Rendered widget sizes and actual child offsets, mapped to source byte starts |

Fit scales the exported composition and its geometry together. At 100%, a game
pixel occupies one logical editor pixel. Resolution samples change internal game
size; ordinary editor window resize does not. Accepted edits continue through
`screens.setSize` and shared history. No second screen document exists.

The bounded property list is explicit in `screens/canvas.rs`. Unknown properties,
blocks, custom initialization/styles, archives/orphan bytecode, text tags and
unsampled source interpolation refuse rendering. This includes ordinary GUI
initialization that the proof cannot resolve yet. Element lists, fields, Source and
deliberate Test in Ren'Py remain available. Source/asset inventory and hashes invalidate
frames. Old frames lose selection/resize geometry immediately; asynchronous old
completions cannot replace the current request. Helper failure retains drafts.
No project expression, action or script enters the helper.

## Evidence and diagnosis, 2026-10-22

All raw evidence is local under ignored `.toolchains/canvas-proof/`. It contains only
the public fixture and test output. The canonical composition is
[canvas-help.rpy](../../../tests/fixtures/phase-3b-screens/canvas-help.rpy).
Both helper and deliberate-reference preparation use the same fixture builder,
SDK font and public image. Reference instrumentation enters only the frozen,
explicitly prepared preview scratch, never the source project or helper.

- `browser-17` passes six real UI/core/helper functional groups, including both
  aspects, normal/hover and live text samples, numeric/keyboard/held-pointer resize,
  Cancel/Escape, accepted Undo, source preservation and driver cleanup. Its 40
  input-to-completed-Chrome-capture samples have p95 248.8 ms. Capture overhead is
  included; this is not native WebView presentation proof.
- `reference-18` exposed an instrumentation error. `get_displayable` without
  `base=True` selected inner text/image widgets. `reference-19` corrects that and
  passes actual outer-widget dimensions, but its second window was 960 by 720.
- `reference-21` passes both requested window/internal sizes and outer-widget
  geometry. The frame is 640 by 360, image 64 by 48, button 143 by 45, text 331 by 87
  and vertical group 331 by 204 on both aspects. Source remains unchanged; Stop
  cleans its process and scratch. Normal/hover captures come from deliberate GL2
  rendering, with drawable scale 2.0 and retained full drawable-resolution PNGs.
- `browser-20` timed out during verified-SDK fixture installation, before creating
  a helper. The partial public fixture was identified and removed. No helper process
  remained. A 180-second setup deadline replaces the insufficient 90-second limit.
- `browser-21` passes the same functional groups. Diagnostic p95 input-to-image-load
  is 219.2 ms; p95 input-to-completed-capture is 302.5 ms. This run overlapped other
  checks. Both values remain evidence; no timing pass is inferred.

`matched-pixels-22.json` compares exact RGBA pixels from `browser-21` with
`reference-21` resized by Ren'Py to game dimensions. Differences are 8,780/14,013
pixels for 1280 by 720 normal/hover and 9,706/14,893 for 1024 by 768. Maximum channel
difference is 213. The text uses drawable-resolution rendering in GL2 at scale 2.0;
the software helper draws at scale 1.0. Wrapped text dimensions agree, but glyph
rasterization differs. Hover background also differs by one blue-channel value in
its flat region. This is not an accepted edge tolerance. No threshold, color or
text waiver has been applied. Removing the unintended second-window downscale
removed its broad frame-edge differences.

## Verification and remaining gates

The frontend typecheck and all 224 tests pass with Python 3.12 selected for native
receipt validators. Initial failures retained stale protocol expectations for the
three new operations and a Python 3.9 `tomllib` error. The production frontend build
passes. The full core suite passed 374 cases and hit 31 sandbox loopback permission
failures; the unchanged loopback cases pass in the separately authorized rerun
(38 cases, including additional cases in the same module). Forty-seven specialist
or explicitly selected SDK cases remained ignored; three documented broad gates
were excluded. Focused canvas core/UI and rejecting native receipt checks pass.
The existing Help browser regression passes 11 groups without SDK execution.

Native package results, independent review and final candidate identity will be
recorded before closeout. Windows CI is prepared but remains undispatched because
this selection authorizes a local commit and has no push authorization.

The mandatory outstanding gates include matching drawable-scale fidelity, native
input-to-visible timing on both targets, OS focus/window observation, startup
measurement, dragging beyond resizing and Windows native/SDK qualification. DOM
focus, image load, render timers and screenshot completion do not substitute for
native presentation or physical input. Startup has no accepted limit yet. Any
failure returns to decision review before broader renderer implementation or a
weaker requirement is accepted. Keep #36 open while these gates remain.
