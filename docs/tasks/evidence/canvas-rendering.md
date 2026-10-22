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

## Authorized continuation, 2026-10-23

The user authorized push and Windows CI, reported the Mac unlocked and allocated
four additional Mac SDK launches. This raises only the cumulative Mac SDK ceiling
to 24. Earlier failures and closed allowances remain charged; no contingency is
recalculated. The original implementation and evidence commits are published.
Current product candidate is `63a1b037d11054246a019c2e5bb515217111a7c6`.

### Mac failures, corrections and qualification

- SDK process 21, `helper-isolation-31`, executes the selected release service
  regression including the backup-log assertion. Both aspects and project-close
  cleanup pass in 20.55 seconds. This supplies the assertion execution missing at
  the earlier closeout.
- Package 2/native attempt 2 uses SDK process 22. It fails after 22.375 seconds
  following `draft-cancel-focus-passed`. The qualification wrapper discarded the
  `RUNTIME_BUSY` error code, preventing the intended bounded retry of a source
  read after acceptance. The failed fixture retains its accepted width of 760;
  accepted-byte equality correctly reports false. Cleanup owners, zero scratch/
  helper jobs, no source bytecode/saves and profile removal pass. This is a
  controller defect, not evidence of a failed accepted write.
- `63a1b03` preserves the structured error code. `controller-32`, SDK process 23,
  runs the exact packaged controller over the real production UI and release core
  in Chrome. Injected busy reads before and after acceptance retry; exactly one
  size write occurs. All stages pass. Its outer receipt explicitly records
  `controllerTestOnly=true` and `nativeWebView=false`.
- That rehearsal used a local driver executable built before the backup fix.
  Its read-retry result remains applicable because the exercised request contract
  is unchanged. It does not qualify the current core artifact or backup isolation.
  One generated renderer backup is attributable by file birth time, rehearsal
  interval, namespace, trusted renderer marker and retained hash. Only that
  verified file/entry was removed. `driver-provenance.json` and
  `backup-cleanup.json` retain the attribution and limitation. Both signed package
  binaries contain the backup opt-out. The release driver was rebuilt and checked.
- Harness correction `38b5992` makes both browser entrypoints build the locked
  release driver before creating a fixture. The shared build helper fails on
  build errors, timeout or nonzero exit. A direct admission check passes without
  starting an SDK. Both independent review axes report zero new findings on the
  controller correction and this guard.

Signed Mac package 3 is built from `63a1b03`. Strict signature, the approved
certificate-backed requirement and installer contents pass. Executable SHA-256 is
`c0406be436987d56fbb5e228f5c6a4cb5b1aa8be7854e934c91c433c5aa418b1`;
installer SHA-256 is
`496b5e9db4c6c8e2ef9fd40455fe8bef3524ff972c9b7d3e7400627cf40d3528`.
The ignored `mac-package-03/identity-receipt.json` owns the exact identity.
Signing and credential policy are unchanged.

`mac-native-03`, native launch 3 and SDK process 24, passes in the actual packaged
WebView. Total runner time is 49.455 seconds including fixture preparation.
Ordered stages pass first frame, drafts/Cancel and field focus, source/history,
second aspect, logical pixels and project close. The complete UI receipt is at
28,123 ms; startup image load is 1,251 ms. Startup is diagnostic, with no accepted
limit or warm native input-to-visible claim. The receipt records
`nativeWebView=true`, `nativeKeyboard=false`, `nativeFocusObserved=false` and
`warmPresentationProof=false`. Synthetic DOM field focus does not establish OS
focus or physical-keyboard behavior.

The actual WebView exports 1280x720 and 1024x768 helper PNGs. Independent exact
RGBA comparison in `pixel-transport.json` matches the earlier release-browser
helper captures at both aspects. This qualifies pixel transport, not agreement
with the deliberate GL reference. Accepted source bytes match, no source bytecode
or saves exist, all credential/host/request cleanup owners pass, zero scratch/
helper jobs remain and the fixture profile is removed. Final process checks find
no owned app/helper/driver. Generated helper backup inventory is zero after the
single verified stale-driver cleanup. Original failures remain in their own
attempt directories.

### Checks and pending Windows run

`resume-32-checks` passes typecheck, focused Screens/request-lane tests and desktop
Cargo check. `resume-full-32` passes all 226 frontend tests with Python 3.12
explicitly selected. The production build and two rejecting receipt-schema tests
pass. Both modified browser entrypoints pass Node syntax checking. The shared
fresh-build admission passes in `driver-admission-34`. The existing full core
results and authorized loopback rerun remain applicable to unchanged code. The
new public-fixture continuation evidence passes its privacy scan for 22 files.
No native or SDK repeat is needed for this documentation update.

CI dispatch 1, [run 39840720074](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39840720074),
attempt 1 at `50fce710a9991574e3bc14e4dd8153d4ac0b7820`, is retained as cancelled.
It was superseded by the diagnosed controller correction during portable Rust
compilation. All SDK/reference/browser/package/native steps were skipped; privacy
and artifact upload passed. No Windows SDK, package or native operation occurred.
This is not passing qualification and its dispatch stays charged. `ci-01` retains
the terminal receipt, full log and partial artifacts.

CI dispatch 2, [run 39841877779](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39841877779),
attempt 1, tests exact candidate/head `63a1b037d11054246a019c2e5bb515217111a7c6`
on `codex/phase3b-screen-designer`. Workflow `screens-source.yml` inputs are
ordinal 2, `canvas_helper=true`, `owned_blank=false`. Last observed status was
queued at 2026-10-22 19:38:35 UTC. The ignored `ci-02/pending.json` retains the
identity, inputs and audit checklist. It reserves one Windows package, one native
launch and four SDK processes. Later commit `38b5992` only guards local test-driver
build admission; this CI already explicitly builds the fresh release driver.
Subsequent evidence/status edits do not change the tested product.

Follow installed ci-watch for same-chat continuation. Registration status belongs
to the launcher receipt and chat acknowledgement, not an assumed active watch.
After its event, audit exact run/attempt/SHA, required steps, SDK/package identity,
artifact privacy, both-aspect helper/reference pixels and geometry, controller and
native receipts, accepted bytes, process/disk cleanup and actual Windows use.
Failed, cancelled or skipped checks remain unresolved.

Current cumulative use is 35/60 local work/check batches, 2/5 CI dispatches; Mac
packages 3/5, native launches 3/7 and SDK processes 24/24. Windows actual package,
native and SDK use was zero before CI2; its reservation above remains pending
audit. Batches 31-35 cover resume/service/native failure, controller correction,
package/native qualification, driver-provenance correction/review and publication/
wait preparation. All four additional Mac SDK processes are used. No further Mac
SDK launch is allocated. Historical allowances remain closed.

The three Spec gaps remain: matched both-target rendering, native responsiveness/
startup/focus qualification and element-position dragging. No tolerance has been
accepted for the Mac Retina glyph or flat hover-color differences. The functional
Mac pass closes neither those gates nor #36/B07/B08/phase acceptance. Return failed
proof to decision review before broader renderer work or weaker gates. No PR,
merge or release is selected. Unrelated parallel-policy edits and protected native
recovery remain separate. CURRENT/HANDOVER retain older unique recovery and
pending phase acceptance, so their overall sizes exceed their review targets.

## CI2 terminal audit and Windows reader correction

The ci-watch completion event resumed the original chat. Its thread/run/SHA match
and delivery receipt are verified. GitHub confirms run 39841877779, attempt 1,
exact head `63a1b037d11054246a019c2e5bb515217111a7c6`, completed with failure at
2026-10-22 19:48:24 UTC. Later `38b5992` and `b0dbd80` only add local driver-build
admission and records, so the result applies to the current product code.

The selector, pinned portable checks and official SDK checksum pass. Portable
Screens results are 14 passed and one selected SDK test ignored. The production
browser starts one helper and captures its initial 1280x720 frame. Startup
image-load time is 3,112 ms, diagnostic only. The next provisional width request
never returns a current frame. The helper traceback records `PermissionError`
opening its fixed `request.json` input while the Rust publisher replaces that
file. The UI reports unavailable and retains drafts. This is a Windows product
file-sharing defect. No new timeout or performance explanation is inferred.

The exact-controller rehearsal and Help regression in that step did not run.
Deliberate reference, package, native and package-identity steps were skipped.
Privacy scan and artifact upload pass. The browser driver exits zero after its
asserted host shutdown and root removal. There is no separate native cleanup
receipt because no native launch occurred. Windows actual use from CI2 is one
SDK process, zero packages and zero native launches; CI1 had zero of those.
Both dispatches remain charged and neither is passing qualification.

Artifact 12453951681 contains ten public-fixture evidence files. Its retained ZIP
SHA-256, GitHub metadata and upload log agree on
`eb6b0827bc263d4927cfff84f6478e832c8c2ada2a177a40d74e6f67ae296445`.
It expires at 2026-10-29 19:48:19 UTC. The ignored `ci-02` directory retains the
ZIP, extracted files, full log, metadata, terminal receipt and compact audit.
An independent local privacy scan passes for all ten extracted files.

### Correction and focused review

The helper now opens its fixed request input with Windows read/write/delete
sharing. The publisher's atomic replacement requests delete access; incompatible
reader sharing can fail in either order. This follows
[CreateFileW's sharing contract](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew).
Typed Win32 arguments preserve pointer-width handles. A failed open raises its
original Windows error. On success, ownership passes to the CRT descriptor and
then the Python file object; conversion failures close the current owner.
The normal context manager closes it after reading complete JSON. Frame IDs
continue to reject an older complete frame. The change adds no project path,
expression evaluation, script or action input, and no error swallowing or retry.
The non-Windows open path is unchanged, so the prior Mac functional evidence is
reused with that explicit limitation. No Mac SDK process was started.

The existing production browser failure is the red reproduction at the confirmed
UI/core/helper boundary. The next Windows run must supply the green result at
that same boundary, including repeated updates; no new private-method test was
added. Embedded Python blocks parse, frontend typecheck passes and focused
release core Screens checks pass 14 cases with the selected SDK case ignored.
The prior 226-test frontend result remains applicable to unchanged UI code.

#### Standards

The independent read-only review reports zero documented-standard breaches,
substantive bugs or baseline-smell findings. Handle types, sharing and ownership
cleanup are consistent. No test, app, SDK or CI operation was run by the reviewer.

#### Spec

The independent read-only review reports zero new findings or scope creep. The
data-only boundary and process reuse remain intact. Static review is not Windows
qualification. The three existing gaps remain matched both-target fidelity,
native timing/startup/focus and element-position dragging. This correction closes
none of those acceptance gates.

Use the remaining existing allowance for CI dispatch 3 of the corrected candidate,
with the same selected Windows job and maximum reservation of one package, one
native launch and four SDK processes. Prior Windows actual use is one SDK process.
Local batches 36-38 cover CI2 audit/correction, focused checks/review and the
publication/CI3 wait record. Mac use remains packages 3/5, native 3/7, SDK 24/24.
No further Mac SDK launch, broader rendering work or weaker gate is selected.
