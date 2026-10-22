# Phase 3C Timeline and native-media requirements

Read for Timeline, character staging, animation or audio implementation/acceptance.
This is planned scope. Research and proposed profiles do not establish native target
qualification. Select an implementation outcome and finite allowance before execution.
The [phase brief](../active/phase-3-initial-wysiwyg-release.md) owns entry conditions;
[shared contracts](phase-3-shared-contracts.md) apply to source/runtime changes.

<a id="5-3c--vn-animationaudio-timeline"></a>

## 5. 3C — VN animation/audio Timeline

Selected early sequence: static character staging, PNG/ATL idle loops, native looping
video, prepared transparent video, and once-only end controls. Existing supported
transform/audio work uses those same Appearance/placement/source services. Timing is
tied explicitly to beat execution and relative event order. Authoring time, preview time and actual runtime time have
distinct meanings. Dialogue interactions can wait indefinitely; do not invent a fixed
duration for an entire interactive Scene.

The broader canonical track list is a design direction. Character drag/resize,
native pre-rendered playback and idle loops are now explicit completion requirements
below; remaining camera/effects/voice scope needs separate inventory. Full video
editing, import conversion, unrestricted ATL, arbitrary Python interpolation and
sample-accurate synchronization are excluded.

**Completion checks:** preview/play/scrub supported effects with disclosed limits;
change timing numerically and by keyboard; preserve source mappings and unsupported
ATL; undo/reopen; compare generated transforms and audio event order with the pinned
SDK. Define measurable duration/order tolerances from the supported behavior before
trusting the gate. Do not use an unexplained screenshot similarity threshold.

**Early risk proof:** one combined transform/audio sequence survives a source edit,
transaction and real runtime comparison before adding the full Timeline workspace.

<a id="selected-staging-native-media-and-idle-playback"></a>

### Selected staging, native media and idle playback

The user wants to drag/resize a character with matching game placement, play existing
pre-rendered animations and give a character an idle loop while dialogue waits. The
selected import boundary is **only formats natively supported by the pinned desktop
Ren'Py SDK; no conversion/transcoding in this release**. This makes those authoring
outcomes explicit 3C requirements; exact profiles must still be qualified before
implementation claims support.

- Select a visible character in Story Preview, drag it and resize with handles;
  expose position/anchor/scale numerically and by keyboard. Preserve aspect ratio by
  default. Static placement needs no keyframe or Timeline setup. Write ordinary
  Ren'Py transforms through the shared edit layer. Use project virtual coordinates,
  with viewport zoom separate from game scale; compare anchors, bounds and placement
  against actual SDK output. Apply the same staging to static and animated appearances.
- Import a qualified native video or an explicit ordered sequence of supported image
  assets with positive frame durations. Use it as an animated Character Appearance or
  background with Play once/Loop and a declared end state. The same media/appearance
  service supplies Story and Timeline; do not build a separate animation asset store.
- Assign an idle animation to an Appearance or reuse a supported looping transform.
  A nonblocking loop continues across dialogue waits until hidden or deliberately
  replaced. Advancing text must not re-show/restart the character on every Beat.
  Keep base placement/size separate from animation changes so dragging does not erase
  the idle. Unsupported overlapping property ownership is diagnosed rather than guessed.

**Initial format profile candidates:** WebM with VP8/VP9 video and, when audio is
present, qualified Opus/Vorbis; Ogg/OGV with Theora video and qualified Vorbis audio;
and timed PNG frame sequences emitted as supported ATL image animation. These are a
bounded subset of upstream formats, not a requirement to expose every Ren'Py decoder.
Publish the exact accepted container/video/audio combinations only after pinned-SDK
qualification on Windows x64 and macOS ARM64. File extensions alone are insufficient.
Broader native formats may be added only after that same bounded qualification.

Animated GIF import/playback is excluded; there is no GIF-to-frames/video conversion.
Likewise no automatic MP4/H.264/AAC conversion, frame extraction, mask generation,
re-encoding or video-editing pipeline. Reject unsupported input before writing project
assets and explain the supported export profiles. Reject unqualified single-file
animated-image formats rather than silently treating them as a still image. The existing
Phase 1 static-image/audio allowlist remains its own accepted subset.

Transparent movie sprites use an author-supplied Ren'Py-compatible mask representation;
the first qualified route is a prepared side-by-side mask, with an optional separate
mask route only if synchronization is proved. Do not infer that a video's alpha channel
is playable. Logical sprite dimensions/resize handles exclude the mask portion. Authors
can instead supply transparent PNG frames. Optional poster/end images are supplied
assets, not frames extracted by Loomlight. Multiple simultaneous movies need a qualified
frame-rate/capacity policy; reject incompatible combinations rather than claim fidelity.

Extend the shared asset/source contracts with verified media kind, container/codecs,
logical dimensions, frame-rate/timing information where available, stable asset IDs,
mask/frame dependencies and explicit playback settings. These describe source-backed
render definitions and imported bytes, not a second runnable truth. Preserve original
accepted bytes. Asset lifecycle, source reconciliation, undo and migration/reopen apply
to the whole dependency group. Validate contents and declared profiles without running
project scripts. Missing or unsupported media retains a diagnostic and cannot become a
successful imported/previewed asset merely because its filename has an allowed suffix.

Use the shared runtime preview for authoritative decoding/comparison. A browser unable
to play a qualified Ren'Py profile shows a supplied poster/partial status and an explicit
Preview in Ren'Py action; it never rejects or transcodes a valid game asset solely to
match WebView support. Selecting/importing media does not automatically start playback
or execute Ren'Py. Preview play/stop is explicit and releases its media on close/switch.
Idle loops need not have exact elapsed time reconstructable in 3D: normal playback is
separate from Run From Here, which retains unknown-timing refusal or clearly labelled
synthetic restart rules.

**3C completion proof:** drag/resize both a still and animated Appearance; compare
logical placement/scale with the compiled/running game at project resolution and a
second window size. Play a supplied native clip once and loop it; demonstrate a masked
sprite and transparent frame sequence over a background. Keep an idle running through
at least two dialogue waits, then change/hide it and verify playback stops. Exercise
click/skip/rollback/save-load, source edits, undo/reopen, rejected GIF/unsupported codec,
missing dependencies and mixed frame rates on both affected native targets. Define
timing/geometry tolerances from the early proof; no arbitrary exact video-seek promise.

Upstream basis: [movie formats and sprites](https://www.renpy.org/doc/html/movie.html),
[supported image formats](https://www.renpy.org/doc/html/displayables.html#images),
[ATL](https://www.renpy.org/doc/html/transforms.html) and
[transform properties](https://www.renpy.org/doc/html/transform_properties.html).
Online documentation reports 8.5.4. Tagged 8.5.3 source/doc inspection below confirms
relevant APIs; measured codec, mask and target qualification is still required.

<a id="agreed-implementation-order-and-source-bindings"></a>

### Agreed implementation order and source bindings

The user accepted the researched sequence below and requested it be recorded. This
orders the selected 3C capabilities within the existing two-lane delivery plan; it
starts no implementation. Keep static/frame/video appearances on one selection,
placement, source-patch and history path. No new animation runtime or converter.

| Order | Concrete implementation and author controls | Proof before expansion |
| --- | --- | --- |
| 1 — Static staging | Add Story selection/drag/resize plus numeric/keyboard position, anchor and scale. Emit source-backed placement transforms. Map viewport coordinates to the game's virtual coordinates; preserve intended pixel versus relative value types. | One still Appearance matches real SDK placement at project resolution and a second window size; a gesture is one undo, Escape writes nothing and reopen agrees. No Timeline/keyframes required. |
| 2 — PNG/ATL idles | Add an ordered frame list with positive durations or an explicit FPS default and per-frame durations. Emit an ATL image block with frame references/pauses and optional repeat. Add the supported looping-transform binding separately from outer placement. | A supplied transparent PNG sequence and supported transform idle continue across dialogue waits, stop/change correctly and survive source edits, undo/reopen. Consistent frame dimensions/subject placement are recommended; show mismatches rather than silently crop/rescale assets. |
| 3 — Native looping video | Add an animated Appearance/background backed by a typed Movie definition using the qualified native profile and native playback defaults. Expose Loop and explicit preview controls. First prove an opaque, silent clip; then qualify the declared embedded-audio profile and mixer behavior. | One accepted clip starts on Show and stops on Hide; moving/resizing it uses the same placement controls. Existing dialogue advances do not emit another Show. Video playback remains responsive and does not interfere with ordinary music/SFX. |
| 4 — Prepared transparent video | Add supplied side-mask binding and calculate logical width from the visible half. A separate supplied-mask route remains optional after its synchronization proof. No alpha extraction or mask generation. | A prepared masked clip displays correct transparency, anchor and dimensions over a background in native SDK output. Check simultaneous supported movie frame rates and supplied dependency validation. |
| 5 — Play-once/end state | Add explicit once-only Movie settings and an end-state choice: disappear, hold last frame, or supplied still. Define incompatible settings and fallback/first-frame behavior before exposing controls. | Each end state matches native playback, including hide/replacement, reload and ordinary save/load/rollback checks. Distinguish first-frame loading from missing/end fallback. No frame-exact seeking/resume promise. |
| 6 — Integrated qualification | Combine staging, frame/video idles, once-only playback and existing Timeline/audio authoring through actual source/transaction dispatch on both supported targets. | 3C.4's full source, lifecycle, timing, geometry and persistence gate passes on the integrated candidate before declaring 3C complete. |

Map these slices to existing IDs: static controls/source preparation use 3C.1/3C.2;
frames and videos incrementally complete 3C.1a; loop/end/audio lifecycle completes
3C.3; native comparison and combined qualification complete 3C.4. This does not require
building the entire Timeline canvas before simple staging/idle results. The broader
keyframe/audio inventory proceeds after these early source/media proofs, reusing them.

**Source implementation:** keep animation content and placement distinct. PNG frames
become a supported ATL image definition; videos become a typed, literal-only Movie
definition; Show Character/Background references that definition and its placement.
Changing position must not replace the frame/video binding or reset an idle. A normal
idle needs no dialogue callback: show once and leave it visible through consecutive
say interactions. Only deliberate hide/appearance changes replace it. Speak-only or
text-reveal-triggered animation is a separately selectable later behavior.

**Actual Loomlight seams:** inspected authoring metadata currently validates
`render_mode = staticImportedAsset` with one `asset_id`; Story Preview uses image
elements. Extend those into typed static/frame/movie render bindings with an explicit
migration retaining existing IDs. `media.present` currently copies complete base64
bytes, capped at 16 MiB, for thumbnail/imagePreview/audioAudition. A video-capable
bounded delivery path is required; merely allowing new suffixes or increasing the
image cap is insufficient. Design session/revision-bound asset handles and large-file
delivery at the early proof, retaining narrow core-mediated access and cleanup. Do
not expose arbitrary project paths or grant blanket webview file access. Reconcile
these inspected seams against the accepted baseline at implementation entry.

**Preview and lifecycle:** offer fast embedded playback only where the host WebView
and supported compositor can represent that profile; otherwise show a supplied poster
and partial status with explicit pinned-SDK playback. Ren'Py output remains the geometry,
transparency and timing authority. This first release does not depend on embedding a
native Ren'Py window. Use native movie channel allocation/defaults initially, with
explicit qualification for embedded audio and multiple simultaneous movies. Save/load,
rollback, skip and Run From Here can change decoder timing: establish supported restart
or resume behavior rather than promising exact elapsed-frame reconstruction.

**Research evidence:** the official
[8.5.3 movie documentation](https://raw.githubusercontent.com/renpy/renpy/8.5.3.26051504/sphinx/source/movie.rst)
and [Movie implementation](https://raw.githubusercontent.com/renpy/renpy/8.5.3.26051504/renpy/display/video.py)
were inspected at tag `8.5.3.26051504`. This supports using native loop, mask, supplied
start/fallback image and last-frame mechanisms, not a custom playback engine. Confirm
the installed SDK build at implementation entry; source inspection does not qualify
codec files or restored playback on the targets. Native defaults avoid copying a
newer-version custom callback into the pinned adapter.

Creator references: [FunFiction's visual editor](https://funfictionart.itch.io/renpy-wysiwyg-editor)
and [its repository](https://github.com/FunFiction/renpy-wysiwyg-drag-drop-editor)
inform direct staging/source edits; [ActionEditor3](https://github.com/kyouryuukunn/renpy-ActionEditor3)
informs keyframe/loop controls but documents movie-preview limitations. These are UX
and bounded-edit precedents, not Loomlight native playback evidence or dependencies.
No community code was downloaded, copied or executed during this research.

<a id="implementation-plan-2"></a>

### Implementation plan

**Recommended release inventory:** 2D position/anchor, scale, rotation and opacity
tracks on existing assets; fixed/linear/ease interpolation; reusable named transforms;
explicit pauses and beat-anchored music/sound play, stop, fade and queue operations;
static drag/resize, qualified native movie/frame-sequence appearances and nonblocking
idle loops. Follow the agreed incremental sequence above, then complete the remaining
transform/keyframe/audio inventory using the same services and fixtures.
Camera/3D/shader effects, unrestricted ATL functions, movie editing and voice alignment
are separately proposed later additions, not hidden release dependencies.

| Step | Concrete implementation | Proof before proceeding |
| --- | --- | --- |
| 3C.1 — ATL/timing source service | Add proposed core `timeline` service: owned transform declaration inventory and supported keyframe/event projection. Bind tracks to stable Scene/Beat/asset IDs and source revisions. Convert absolute keyframe times to explicit durations; validate finite values and conflicting writes to one property. | Generate one named transform and reference it from an existing Show Beat; parse it back, preserve unrelated ATL and verify the final visual state in Ren'Py. |
| 3C.1a — Native animation assets/appearances | Extend shared asset/appearance bindings for qualified native video and timed image sequences, typed Movie/ATL definitions, supplied masks and explicit loop/end behavior. Validate container and codecs; copy accepted bytes unchanged. No conversion or mask generation. | One imported animated Appearance and idle survive transaction, source edit and reopen; native format/mask/frame tests pass and rejected input writes no project asset. |
| 3C.2 — Timeline controls | Add proposed `timeline-ui.ts` with property tracks, keyframe insert/move/delete, duration/easing inspector, play/scrub/loop and Story stage drag/resize handles with aspect lock and numeric/keyboard alternatives. Static placement requires no keyframes. Group edits by gesture, retain draft timing until commit, reuse the asset/media service and shared history. | Numeric and drag edits produce the same source changes, one undo, cancel with no write, source navigation and reload with identical timing. |
| 3C.3 — Audio and interaction boundaries | Model timed segments between player interactions. Emit reviewed play/stop/queue/fade commands and explicit pauses at cue offsets; show every inserted wait. Use simultaneous transforms or qualified ATL parallel blocks for independent property tracks. Keep dialogue/menu waits as boundaries with unknown duration; nonblocking Appearance/transform idle loops continue until hide/replacement. | Idle continuity across dialogue and stop/change behavior; two concurrent animations and delayed SFX preserve ordering; a click/skip/rollback is tested separately from uninterrupted playback. No implicit scheduler or invented fixed dialogue length. |
| 3C.4 — SDK comparison and completion | Run the scratch preview and then a normal-game fixture. Compare start/mid/end properties, endpoint state and audio cue order; declare tolerances after a bounded feasibility sample. Reconcile supported Source changes and protect opaque ATL. | Both targets' actual media/runtime paths; repeated replay stops audio cleanly, source/external conflicts retain input, rename/delete references and undo/reopen agree. |

Named transforms are ordinary source, proposed under `game/transforms/`; IDs map to
declarations rather than a separate saved animation truth. Ren'Py interpolation is
authoritative. TypeScript scrubbing evaluates only the supported projection and labels
unsupported state; it never executes ATL Python. Sequential blocks execute by duration;
parallel tracks must have explicit ownership and final-state rules. No sample-accurate
audio seek promise; scrub audition may restart a clip from its beginning with disclosure.
An animation continuing over dialogue is tied to interaction time and cannot be
reconstructed later as an exact elapsed offset without additional evidence.

Ren'Py basis: [ATL](https://www.renpy.org/doc/html/transforms.html),
[transform properties](https://www.renpy.org/doc/html/transform_properties.html) and
[audio statements](https://www.renpy.org/doc/html/audio.html).
