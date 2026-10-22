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
source interpolation refuse rendering. This includes ordinary GUI
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

The measured slow core requests came from the debug driver. In `browser-23`,
median render submission/status calls took 95.6/49.1 ms; helper rendering itself
had p95 19.7 ms and cleanup 6.9 ms. Using the production release build in
`browser-release-24` reduced those medians to 11.3/6.2 ms and input-to-image-load
p95 to 63.9 ms. Completed Chrome captures still had p95 150 ms, including up to
89 ms after image load. The browser qualification now builds and uses the release
driver. This resolves the measurement configuration error; it does not establish
native visible-frame timing.

## Independent review

The code-review skill reviewed committed candidate `fd781a6` against `7e1e7b3`
with separate Standards and Spec agents.

Standards found two breaches. Canvas requests did not join the shared service
lane, permitting polling to contend with saves; conflicting CI booleans skipped
all jobs. The correction routes Screens operations and its history acceptance
through the lane, retries only pre-dispatch read refusals, and stops detached
Screens polling. Remount validates a fresh frame. Held-owner and detached-workspace
regressions fail before the correction and pass after it. The workflow always
runs a cheap selector validator and rejects both booleans together. No baseline
smell findings were reported. Follow-up review confirms both fixes, with zero unresolved/new Standards findings. The helper-only backup prevention
fix also passed an independent Standards follow-up with no new finding.

Spec found three incomplete requirements: matched both-target rendering, native
responsiveness/startup/focus evidence, and element dragging. These remain explicit
acceptance gaps. No additional wrong implementation or scope creep was reported.

## Mac package and locked-session result

Signed Mac ARM64 package 1 was built from product candidate `8c21b7b`. It passes
strict signature, approved certificate-backed requirement and installer-content
verification. Its executable SHA-256 is
`0727e29b7b9281ec706fab5dfeb1600e9a9c68df15b9884aa80ac087258587c4`; installer SHA-256
is `05779f6325fe40ea2571e1788f8f90dac90ae9f0b3461a8b05a7c81d85f7629b`.

`mac-native-01` failed its native watchdog after 319.13 seconds. Computer Use
reported that the Mac was locked and automatic unlock failed. The probe reached
the helper but returned no completed UI-stage receipt. Do not infer a functional
or focus pass. The app exited 1; all cleanup owners report true. Disk checks pass
accepted-source equality, zero scratch/helper jobs, no source bytecode and no saves.
The fixture profile was removed. OS focus, physical input and presentation remain
blocked by the locked session.

Inspection of the live private helper log exposed a separate adapter fault.
Ren'Py's `script.make_backups()` backed up the generated renderer outside its
private profile. The helper now sets the pinned SDK's exact `RENPY_DISABLE_BACKUPS`
opt-out. Deliberate project runtime backups are unchanged. Nine generated helper
backup entries were verified by namespace, single renderer file, trusted source
marker and retained SHA-256, then removed; unrelated backups were preserved.
`backup-inventory-28.json` and `backup-cleanup-28.json` retain that accounting.

The final allowed Mac SDK process, `helper-isolation-28`, passes actual helper
rendering at both aspects and project-close cleanup on the fixed adapter. A new
backup-log regression assertion was placed in that selected SDK test after its
binary compiled, so that assertion is compiled by portable checks but is not
claimed as executed evidence. The final cleanup check finds no generated helper backups. The
native package above predates this environment fix; its failed launch is retained,
not reassigned to the corrected source.

Final frontend typecheck/build and all 226 tests pass in `frontend-final-26`.
A repeated missing harness-Python selection in `frontend-full-25` reproduced the
same Python 3.9 host failure; the final run explicitly selects Python 3.12.
`browser-release-25` passes all six groups after the contention fix. It reports
894.2 ms click-to-first-decoded-PNG startup, 63.5 ms warm image-load p95 and
149.7 ms completed-capture p95. These remain diagnostic measurements.
Windows CI is prepared but remains undispatched because this selection authorizes
a local commit and has no push authorization.


Package 2 is built from corrected product candidate
`b7caff3501138860edbdbd2a3e6923ecbff8b279`. It passes the same signature,
certificate requirement and installer-content gates. Its executable SHA-256 is
`b336c8115943a602b6afd75623f4a3a52ed74145e1424ac22e177fc9cc45637e`; installer SHA-256
is `3c1acb85068de50d75da00dcde9a938a6aafa9b25b6d82569636e3ba37867447`.
The executable hashes differ and both certificate requirements match. Package 2
was not launched. It supplies no native functional, credential-reuse or focus proof.

The retained public-fixture evidence passes the artifact privacy scan (74 files).
Final process checks find no owned app/helper/driver; the failed native profile and
verified generated helper backups are gone. No operation remains pending.

Final cumulative use is 30 local work/check batches, 0 CI dispatches; Mac packages
2, native launches 1 and SDK processes 20; Windows packages/native/SDK processes 0.
The user-directed 100% supplement adds one original allocation to the recorded
ceilings. They are 60 local batches, 5 CI dispatches and, per target, 5 packages,
7 native launches and 20 SDK processes. Existing contingency is not recalculated.
All failures and the pre-helper setup reservation remain charged. The Mac SDK
ceiling is reached. Further Mac SDK work needs an explicit supplement, and native
observation needs an unlocked session. Windows CI needs authorization to push the
committed candidate. Earlier closed allowances remain closed.

The mandatory outstanding gates include matching drawable-scale fidelity, native
input-to-visible timing on both targets, OS focus/window observation, startup
qualification, dragging beyond resizing and Windows native/SDK qualification. DOM
focus, image load, render timers and screenshot completion do not substitute for
native presentation or physical input. Startup has no accepted limit yet. Any
failure returns to decision review before broader renderer implementation or a
weaker requirement is accepted. Keep #36 open while these gates remain.
