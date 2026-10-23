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

### CI3 pending operation

Corrected product candidate `7e53b721e1c345a2388780e3ef00eb781fe09248` is pushed
and the remote branch SHA is verified. [CI3 run 39844974063](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39844974063),
attempt 1, tests that exact head/candidate on `codex/phase3b-screen-designer`.
Workflow `screens-source.yml` inputs are ordinal 3, `canvas_helper=true`,
`owned_blank=false`. It was last observed queued at 2026-10-22 20:00:04 UTC.
Ignored `ci-03` retains the reservation, discovery and pending/audit checklist.

Use installed ci-watch for same-chat continuation. Actual registration requires
its launcher acknowledgement; private paths remain outside committed evidence.
After its event, verify/acknowledge the thread, audit exact run/attempt/SHA and all
required jobs/artifacts, including repeated updates through the corrected Windows
reader, both-aspect reference/helper pixels and geometry, SDK/package identities,
controller/native receipts, privacy and source/process/disk cleanup.

Current use is 38/60 local batches, 3/5 CI dispatches; Mac packages 3/5, native 3/7
and SDK 24/24. Windows actual use through CI2 is zero packages, zero native launches
and one SDK process; CI3 reserves one package, one native launch and four SDK
processes. Neither skipped checks nor cancelled dispatches become passes. All
original fidelity/native/dragging gates and publication limits remain unchanged.

## CI3 terminal audit and submission diagnostics

The same-chat ci-watch event is verified and acknowledged. GitHub confirms
[run 39844974063](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39844974063),
attempt 1, exact head `7e53b721e1c345a2388780e3ef00eb781fe09248`, completed with
failure at 2026-10-22 20:09:48 UTC. The later `d3defea` only records the wait, so
this failure applies to the current product. Selector, portable checks and the
official SDK checksum pass. Portable Screens tests pass 14 cases with the selected
SDK case ignored. The existing Windows reader correction passes initial/repeated
reads, both aspects, drafts/Cancel, keyboard Undo, provisional held resize/Escape,
logical pixels/window resize, normal/hover appearances and literal text samples.

Five functional groups pass and 19 warm captures complete. The next
`screens.canvasRender` returns `SCENE_INVARIANT` in 26.47 ms. There is no helper
traceback; the helper log remains in software rendering. The failure comes from
core submission, whose filesystem operations currently discard the detailed
cause. Request creation, publication and copied-asset operations remain possible
sources. No exact OS failure or corrective retry is inferred from the generic
response. The UI retains the draft and disables current-frame use. This is an
unresolved product-path failure, not a warm-timing pass. Startup image load is
4,060.9 ms, diagnostic only. No complete p95 series is available.

Both accepted-source helper aspects retain the expected geometry. The frame is
640x360; wrapped text is 331x87, its vertical group 331x204, image 64x48 and button
143x45. Exact RGBA comparison against Mac native helper exports matches at both
aspects in `helper-cross-target-pixels.json`. This is helper transport evidence;
the deliberate Windows reference did not run and independent game-render fidelity
is still unqualified. The Mac glyph/hover-color differences remain unresolved.

Exact-controller rehearsal, Help regression, reference, package and native steps
were skipped. The driver exits zero after its asserted host shutdown/root removal.
Privacy and upload pass. Artifact 12454129451 contains 33 public-fixture files;
its retained ZIP, GitHub metadata and upload log match SHA-256
`99317497223b188d8e09ecb18743a7fef7dd681c89fe1c5fc9a0d7ee3142a3c3`.
Expiry is 2026-10-29 20:09:43 UTC. An independent local privacy scan passes all
33 files. Ignored `ci-03` retains terminal metadata, log, ZIP, extracted evidence
and compact audit. Windows actual use from this run is one SDK process, zero
packages and zero native launches. Through CI3, actual Windows SDK use is two.

### Diagnostic change and review

The next candidate adds fixed operation labels before the existing error mapping
and retains the native error kind/numeric OS code when application-local atomic
replacement fails. These logs omit paths, file names, source and asset content.
Request create/write/publish steps now have distinct diagnostic labels. The write
handle still closes before publication, and all error propagation and cleanup
rules remain unchanged. No product correction is claimed from this instrumentation.

The existing Windows public UI/core/helper scenario now takes 200 bounded warm
samples to reproduce the intermittent submission failure. Mac remains at 40.
Neither retry behavior, deadlines nor the diagnostic-only performance claim changes.
The purpose is to capture the failing operation and OS result before selecting
another fix. No additional private-method tests or Mac SDK processes were added.
Focused release Screens checks pass 14 cases, with the selected SDK case ignored;
Node syntax and whitespace checks pass. The earlier frontend suite is reused
because UI code is unchanged.

#### Standards

Independent read-only review reports zero hard violations or judgement-smell
findings. Diagnostics contain only fixed labels, fieldless error variants, kinds
and numbers. File ownership, error propagation and cleanup remain unchanged.
The 200-sample Windows check remains bounded by existing waits and job deadline.

#### Spec

Independent read-only review reports zero new findings. The change supplies
diagnosis, not a product fix or qualification pass. Data-only input, source
acceptance and cleanup rules remain intact. Matched both-target fidelity, native
timing/startup/focus and element-position dragging remain separate open gaps.

Local batches 39-41 cover CI3 audit/instrumentation, focused checks/review and
publication/CI4 wait preparation. CI dispatch 4 is selected within the existing
ceiling of five to obtain the missing causal evidence. Windows actual use before
it is zero packages, zero native launches and two SDK processes. Its maximum
reservation is one package, one native launch and four SDK processes. Mac remains
packages 3/5, native 3/7, SDK 24/24. No further Mac SDK launch, weaker gate or broader
renderer work is allocated.

### CI4 pending operation

Published diagnostic candidate `bea2019cb11de61be4ccd9abf8575cf1bce11308` matches
the verified remote branch. [CI4 run 39847274208](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39847274208),
attempt 1, tests that exact head/candidate on `codex/phase3b-screen-designer`.
Workflow `screens-source.yml` selects ordinal 4, `canvas_helper=true`,
`owned_blank=false`. Last observed queued at 2026-10-22 20:15:37 UTC. Ignored
`ci-04` owns reservation, discovery and the remaining audit list.

Follow installed ci-watch for same-chat continuation. Registration requires its
launcher acknowledgement. On its event, verify and acknowledge receipt, then
inspect exact run/attempt/SHA and first failing operation/native OS result before
choosing a correction. If 200 updates pass, retain the complete series and assess
the prior intermittent failure explicitly. Audit all required downstream results,
SDK/package identities, privacy, both-aspect helper/reference comparison, controller/
native receipts, accepted source, cleanup and actual operations. A green badge
alone does not resolve the prior cause or accept rendering.

Current cumulative use is 41/60 local batches, 4/5 CI dispatches; Mac packages 3/5,
native 3/7, SDK 24/24. Windows actual use through CI3 is zero packages/native
launches and two SDK processes; CI4 reserves one package, one native launch and
four SDK processes. Only one more CI dispatch remains. No further Mac SDK process
is allocated. All existing rendering/native/dragging gates and publication limits
remain unchanged. CURRENT/HANDOVER retain protected recovery and earlier pending
acceptance, which keep their overall size above the review targets.

## CI4 terminal audit and open-reader replacement

The same-chat ci-watch event matches its owner and is acknowledged. GitHub confirms
[run 39847274208](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39847274208),
attempt 1, exact head `bea2019cb11de61be4ccd9abf8575cf1bce11308`, completed with
failure at 2026-10-22 20:25:43 UTC. Later `7170733` only records its wait, so the
result applies to the current product. Portable checks and official SDK checksum
pass. Five functional groups and 31 warm captures pass before submission fails.
The diagnostic log now identifies the first failed operation:

```text
application-local file replacement failed: kind=PermissionDenied, os=Some(5)
canvas helper publish request failed: RecoveryRequired
```

This excludes request creation and asset copying as the observed failure site.
The legacy `MoveFileExW` publisher cannot reliably replace the request while the
helper is reading the previous file. Delete sharing corrected the earlier reader
open conflict but did not give the publisher open-target replacement semantics.
The helper stays alive; no traceback reports a render failure. The core maps the
publication failure to the retained generic invariant response. No complete warm
series or timing pass is available. Startup image load is 2,913.5 ms, diagnostic only.

The driver exits zero after asserted host shutdown/root removal. Exact-controller,
Help regression, reference, package and native checks did not run. Privacy/upload
pass; artifact 12456785980 has 45 public-fixture files. Retained ZIP, upload log
and GitHub metadata match SHA-256
`d77fa907eb6dd1b1e6a22f05706f6497c6400df9f6c686e7cd605b29aad4f9e4`.
Expiry is 2026-10-29 20:25:36 UTC. Local privacy scan passes all 45 files. An initial
incorrect archive-ID lookup returned 404; the metadata-derived ID and final ZIP
are verified. Ignored `ci-04` retains the exact terminal receipt, full log, metadata,
ZIP, extracted files and audit. This run uses one SDK process, zero packages and
zero native launches. Actual Windows use through CI4 is three SDK processes.

### Root correction and pattern check

The user explicitly invoked principle-fix-root-causes. The correction changes the
publishing operation itself. Windows application-local file replacement now uses
`SetFileInformationByHandle` with `FileRenameInfoEx` and replacement/POSIX flags.
[Microsoft's contract](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/ns-ntifs-_file_rename_information)
specifies that old readers keep their valid file while new opens see the replacement.
The code adds no retry, swallowed error or wider timeout. Existing diagnostics
continue to report actual failures.

The same legacy replacement pattern existed in the helper's PNG and result
publishers. Both now use that Windows operation too. The request reader retains
compatible read/write/delete sharing. Rust keeps the source handle through the
synchronous rename, checks a regular non-reparse source and preserves parent
validation. Python closes its publisher handle in `finally`. Both implementations
use pointer-aligned buffers with the declared Win32 header and byte-counted UTF-16
tail. The flags do not override read-only attributes or ACLs. Non-Windows publishers
still use their existing rename operations. Source transaction/backup replacement
is a different operation and remains unchanged.

The shared Rust primitive also publishes recent/preferences data. Its staged-file
flush and commit verification remain; the existing recent-file atomic replacement
case now runs before SDK work in the selected Windows workflow. Local focused
release Screens checks pass 14 cases with the selected SDK test ignored, and the
recent-file case passes. Embedded Python blocks and workflow YAML parse. These
are local checks, not execution of the new Windows API. No Mac SDK process ran;
unchanged Mac paths reuse their prior functional evidence. The existing public
UI/core/helper failure supplies red evidence; CI5 must establish the corrected
Windows path, including all 200 updates and the selected downstream qualification.

#### Standards

Independent read-only review reports zero hard breaches, substantive correctness
findings or judgement-smell findings. It confirms ABI layout/alignment, UTF-16
length/capacity, live buffers/handles, no-follow checks and unchanged transaction
replacement. The shared recent/preferences caller retains flushing and verification.
No execution pass is inferred from review.

#### Spec

Independent read-only review reports zero new findings or scope creep. Request,
PNG and result publishers receive the same correction. Data-only input, paths,
cleanup and non-Windows behavior remain intact; no ACL/read-only override or weaker
requirement is added. Windows execution remains the implementation risk. The three
existing gaps remain matched both-target fidelity, native timing/startup/focus and
element-position dragging. This correction accepts none of them.

Local batches 42-44 cover CI4 causal audit/correction, focused verification/review
and publication/CI5 wait preparation, including failed reads and intermediate
validation. CI dispatch 5 is selected as the last dispatch within the existing
ceiling. Before it, Windows actual use is zero packages/native launches and three
SDK processes. Its maximum reservation is one package, one native launch and four
SDK processes. Mac remains packages 3/5, native 3/7, SDK 24/24. No extra Mac SDK,
CI dispatch beyond five, broader renderer work or weaker gate is allocated.

### CI5 pending operation

Root correction `3906578eee885978b30c469b74aae83ac5942971` is pushed and its exact
remote branch SHA is verified. [CI5 run 39850133053](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39850133053),
attempt 1, tests that head/candidate on `codex/phase3b-screen-designer`. Workflow
`screens-source.yml` selects ordinal 5, `canvas_helper=true`, `owned_blank=false`.
Last observed queued at 2026-10-22 20:35:12 UTC. Ignored `ci-05` retains reservation,
discovery and the pending audit list. Later records do not change the product.

Follow installed ci-watch for same-chat continuation; actual registration requires
its launcher acknowledgement. On its event, verify and acknowledge delivery, then
audit exact run/attempt/SHA and every required step. Check the shared recent-file
case, all 200 Windows updates through corrected request/PNG/result publishers,
any OS failure diagnostics, official SDK/package identities, privacy, both-aspect
helper/reference pixels and geometry, exact-controller/native receipts, source
preservation, process/disk cleanup and actual Windows operations. No status badge
alone establishes rendering, timing, focus or whole-ticket acceptance.

Cumulative use is 44/60 local batches, 5/5 CI dispatches; Mac packages 3/5, native
3/7, SDK 24/24. Windows actual use through CI4 is zero packages/native launches and
three SDK processes. CI5 reserves one package, one native launch and four SDK
processes. The CI dispatch ceiling is reached; no sixth dispatch or further Mac
SDK process is allocated. Audit and in-scope local work retain their remaining
allowance. All fidelity/native/dragging gates and historical closed allowances
remain. CURRENT/HANDOVER retain older protected recovery and pending acceptance,
which keep overall word counts above their review targets.

## CI5 terminal audit and prepared reference correction

The same-chat ci-watch event matches its owner and is acknowledged. GitHub confirms
[run 39850133053](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39850133053),
attempt 1, exact head `3906578eee885978b30c469b74aae83ac5942971`, completed with
failure at 2026-10-22 20:43:41 UTC. Later `76666e9` only records its wait, so this
result applies to the current product. The Windows open-reader replacement fix
passes the shared recent-file case, all six browser groups and 200 warm updates.
The browser reports zero page errors and its driver exits zero after asserted
host shutdown/root removal. The exact-controller rehearsal passes initial and
accepted busy reads, exactly one accepted size write, all stages and project close.
Its outer receipt says `controllerTestOnly: true`, `nativeWebView: false`; the
generic nested script's WebView flag does not establish native execution. The
existing Help regression also passes. Portable checks and official SDK checksum pass.

Browser startup image load is 1,790.7 ms, capture p95 is 169.2 ms across 200 samples
and image-decode p95 is 83.8 ms. These are diagnostic measurements. They do not
prove the required native input-to-visible timing, startup, focus or keyboard behavior.
The controller's startup image measurement is likewise diagnostic.

### Reference failure and artifact audit

The later deliberate reference test fails its physical-window equality assertion.
Both normal and hover captures request 1280x720 but receive 922x519; the 1024x768
pair receives 888x666. Ren'Py reports these clamped values as `max_window_size`,
with `angle2` on Microsoft Basic Render Driver. All five logical widget dimensions
match: panel 640x360, group 331x204, text 331x87, image 64x48 and button 143x45.
The runner cannot provide the requested matched windows at its current desktop size.
These downscaled images cannot qualify fidelity or establish a pixel tolerance.

The raw reference receipt's `passed: true` covered only runtime cleanup before the
later window assertion. The Rust test exits 101, and the whole reference gate
fails. Source bytes are unchanged; runtime `cleanupComplete` is true, diagnostics
are empty and output is untruncated. Owned Stop records cancelled exit -1073741510.
The assertion skipped the final explicit runtime-shutdown/project-close assertions;
RAII unwinds, but no explicit complete project-close receipt is claimed for this case.
Package, native WebView and package-identity steps are skipped, so Windows still
has no package/native proof. No skipped check counts as a pass.

Privacy and artifact upload pass. Artifact 12457377566 contains 249 public-fixture
files, all passing the independent local scan. Retained ZIP, upload log and GitHub
metadata agree on SHA-256
`be5161bfc499797f8ec6cbfface1f767f6073cbaab5cc3e6036f080a3bf02735`.
Expiry is 2026-10-29 20:43:36 UTC. Ignored `ci-05` retains terminal identity, full
log, metadata, ZIP, extracted browser/controller/Help/reference files and audit.
The three SDK processes are browser helper, controller helper and deliberate
reference. Package/native use is zero. Actual Windows totals are six SDK processes
and zero packages/native launches.

### Prepared correction and verification

The correction provisions a 1920x1080 runner desktop when needed, then checks fresh
user32 metrics for at least 1600x1000 before any SDK work. This follows the existing
Windows qualification scripts' display preparation. Missing capability or an
undersized result fails admission and retains `display.json`. The reference's
actual physical-window equality remains mandatory; the test never normalizes away
the failed condition. Windows execution of this preparation remains unverified.

The reference test now computes all four distinct samples, window/context/geometry
criteria, source preservation and cleanup before writing its final `passed` field.
It adds the known group/text geometry to the existing checks. Explicit runtime
shutdown and project close occur before the final assertion. The receipt retains
each criterion and cleanup result even when matched windows fail. CI5's raw
artifact remains unchanged. This correction changes qualification code only.

Local release compilation of the selected reference test with `--no-run` passes.
Workflow YAML parses and the whitespace check passes. PowerShell is unavailable
locally, so its display script has static review only. No SDK/native process or
package runs in this continuation; the earlier 226 frontend results remain valid
for unchanged UI code. Documentation validation accompanies publication.

#### Standards

Independent read-only review reports zero hard breaches, substantive findings or
judgement-smell findings. Fresh display metrics, fail-fast admission and receipt
writing in `finally` preserve the qualification boundary. The full reference
receipt includes explicit cleanup before its final assertion. The workflow's
dispatch selector still permits only ordinals 1-5.

#### Spec

Independent read-only review reports zero new findings or scope creep. Provisioning
the runner does not waive the actual-window gate. The three retained gaps are
matched both-target fidelity, native timing/startup/focus and element-position
dragging. Mac Retina glyph and flat hover-color differences have no accepted
tolerance. Keep #36/B07/B08 and phase acceptance open. ADR 0021 requires decision
review before broader renderer work or weaker proof requirements.

Local batches 45-48 cover terminal audit, correction/compile, independent review
and evidence/status/publication preparation, including failed reads and intermediate
checks. Current cumulative use is 48/60 local batches and 5/5 CI dispatches; Mac
packages 3/5, native 3/7, SDK 24/24; Windows packages 0/5, native 0/7, SDK 6/20.
No operation or watcher remains pending. No further Mac SDK process is allocated.

The correction is prepared for review, but a sixth dispatch requires user approval
under the existing ceiling. The proposal raises only the CI ceiling from five to
six, with no new contingency. Its maximum Windows reservation would be one package,
one native launch and four SDK processes within existing target ceilings. The
selector change to admit ordinal 6 is prepared outside tracked files and remains
unapplied. If approved, record that authority, update the selector, commit/push and
dispatch a new attempt 1 at the exact candidate SHA, then use same-chat ci-watch
and audit every required result. Never reuse ordinal 5. No PR, merge or release is
selected. Unrelated policy edits and protected recovery remain preserved.

## Approved sixth dispatch

2026-10-23: the user approves exactly one additional Windows CI run. Only the
cumulative CI ceiling increases from five to six; no new contingency or Mac SDK
process is allocated. The user also directs that a failed run must be audited,
then handed off using the handoff skill. After that audit, stop without further
fixes, execution or retries. Save the handoff in the OS temporary directory and
link existing owners rather than duplicating their contents.

The workflow admits ordinal 6 while retaining exact candidate SHA, selected branch,
attempt 1, mutually exclusive outcome selectors and every proof requirement.
Focused shell checks accept 6 and reject 7/invalid; workflow YAML parses. Both
independent read-only review axes report zero new findings. This changes no product
code or rendering gate. The display/reference correction remains unverified on Windows.

Local batch 49 covers authorization/selector preparation and review. Current use
before dispatch is 49/60 local batches, 5/6 CI; Mac packages 3/5, native 3/7,
SDK 24/24; Windows packages 0/5, native 0/7, SDK 6/20. The single new dispatch
reserves at most one Windows package, one native launch and four SDK processes.
All prior failed/cancelled use stays charged. No seventh dispatch is allocated.

## CI6 pending operation

Candidate `571dfa98b448048d5504bc110d903673959da88c` is pushed and its exact remote branch SHA is verified.
[Windows CI6](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39854099159), attempt 1 at exact head/candidate
`571dfa98b448048d5504bc110d903673959da88c`, is the sole pending operation. Workflow `screens-source.yml`
selects ordinal 6, `canvas_helper=true`, `owned_blank=false`, on
`codex/phase3b-screen-designer`. Last observed `in_progress` at 2026-10-22 21:03:45 UTC.
The user approved exactly one additional run. The CI ceiling is now six with no
new contingency; no seventh dispatch is allocated. If this run fails, audit it,
then stop without further fixes, execution or retries and write the requested
handoff in the OS temporary directory using the handoff skill.

Local batch 50 covers dispatch, identity verification, live records and wait
preparation. Current use is 50/60 local batches, 6/6 CI; Mac packages 3/5, native
3/7, SDK 24/24. Windows actual use through CI5 is packages 0/5, native 0/7, SDK 6/20.
CI6 reserves at most one package, one native launch and four SDK processes.
Ignored `ci-06` retains dispatch/discovery, exact inputs, identity and reservation.
Later evidence-only commits do not change the tested candidate.

Register installed ci-watch for same-chat continuation and yield after its launcher
acknowledgement. On its event, acknowledge delivery and audit exact run/attempt/SHA,
display dimensions, shared recent-file case, all 200 updates, controller/Help,
matched two-aspect normal/hover reference and geometry, actual native/package
identity, official SDK checksum, privacy, source preservation, cleanup and actual
operations. A green status is not acceptance. On failure, complete the audit and
requested temporary handoff, then stop without fixes or retries. Existing Spec
gaps, protected recovery and unrelated policy edits remain.

## CI6 terminal audit and remaining proof handoff

The same-chat ci-watch event matches its owner and is acknowledged. GitHub confirms
[run 39854099159](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39854099159/attempts/1),
attempt 1, exact head `571dfa98b448048d5504bc110d903673959da88c`, completed with
success. The selected Windows job completes at 2026-10-22 21:23:51 UTC. The later
`05bff30` changes only evidence/status, so the result applies to the current product.
All selected required steps pass; closed Help/L01 jobs remain deliberately skipped.
This is a successful workflow and a partial representative proof. It does not
accept #36, B07/B08 or whole 3B.

### Functional, reference and native results

The display receipt verifies 1024x768 before preparation and 1920x1080 after it.
Both requested reference windows now match exactly at 1280x720 and 1024x768, with
normal/hover samples and drawable scale 1.0. All five logical widget dimensions
match. The final reference receipt passes every sample/window/context/geometry/source
criterion and explicit scratch-removal/runtime-shutdown/project-close result.
Source bytes are unchanged, diagnostics are empty and runtime cleanup completes
after owned Stop. Exit -1073741510 is the recorded cancelled runtime result.

The shared recent-file replacement case and Screens portable checks pass. The
browser passes six groups, all 200 updates, source/history/drafts/samples and driver
shutdown with exit zero and no page errors. Exact-controller rehearsal passes
initial/accepted busy reads and exactly one accepted size write; it is explicitly
controller-only. Help regression and official pinned 8.5.3 SDK checksum pass.

The workflow builds one Windows x64 NSIS package and launches one native WebView
probe. Its functional report passes both aspects, drafts/Cancel, source history,
logical pixels and project close. Exit is zero, timeout is false and external
errors are empty. Credentials/host/requests cleanup owners all pass. Independent
disk checks find exact accepted fixture bytes, zero scratch/helper jobs, no source
bytecode and no saves; the probe removes its owned profile. Local receipt admission
also passes. The accepted-source SHA-256 is
`08201efc692198063ed9d66a814da99683643cfbdccd45189fd8736e3aed422b`.

The package-identity receipt binds Windows x64 to the exact candidate and executable
SHA-256 `87a8a4d59b9632473315788e49316cd85731175121eb42b53a579e4fffd6f830`.
The success artifact retains that identity and native receipts, not the executable
or installer bytes. No independent installer hash or installer execution is claimed.
Actual Windows native helper PNGs exactly equal browser helper PNGs and the prior
Mac native helper PNGs in RGBA at both aspects. Delivery preserves those pixels.

### Matched rendering and responsiveness remain unaccepted

Windows now provides an actual matched physical-window comparison. The software
helper still differs from deliberate ANGLE2 rendering on Microsoft Basic Render
Driver. Comparison uses the same accepted source/assets/font, state and game size,
without editor guides or resizing either image.

| Aspect/state | Different RGBA pixels | Total pixels | Maximum channel difference |
| --- | ---: | ---: | ---: |
| 1280x720 normal | 5,856 | 921,600 | 64 |
| 1280x720 hover | 11,268 | 921,600 | 64 |
| 1024x768 normal | 7,819 | 786,432 | 64 |
| 1024x768 hover | 13,227 | 786,432 | 64 |

Differences occupy the shared content bounds and include alpha/color values. The flat
hover region still differs by one blue value, helper 40 versus reference 39.
Inspection shows different glyph rasterization despite matching widget dimensions.
These results exclude the prior window downscale and PNG transport as those causes.
They do not isolate the exact software/ANGLE2 compositing cause. No pixel threshold,
glyph/color waiver or platform tolerance is accepted. Prior Mac Retina differences
remain retained; this Windows result does not resolve them.

The 200 browser samples have capture p95 196.9 ms and image-decode p95 114.2 ms;
startup image load is 3,289.4 ms. Native startup image load is 2,840.3 ms. These
measurements remain diagnostic. The native receipt explicitly reports
`nativeWebView: true`, `nativeFocusObserved: false`, `nativeKeyboard: false` and
`warmPresentationProof: false`. Synthetic DOM focus stages do not establish OS
focus or physical input, and neither image decode nor helper rendering proves
native input-to-visible p95 within 100 ms. Startup acceptance remains undecided.
Element-position dragging remains missing; resizing is the proved gesture.

### Independent audit review

#### Standards

Independent read-only review reports zero substantive audit findings. It verifies
the exact run/candidate, ZIP digest/CRCs and extracted bytes, 257-file count,
reference criteria/cleanup, native accepted-source/frame revisions and package
identity. The recorded Windows totals match the selected operations. No app, SDK,
build, CI or external write runs during that review.

#### Spec

Independent read-only review reports zero new findings and retains three incomplete
requirements. Matched Windows captures now exist, but helper agreement with the
actual reference remains unaccepted, including a flat color difference outside
the edge-tolerance question. Native presentation/startup/focus qualification and
element-position dragging remain incomplete. Exact helper pixels across hosts
prove consistent helper output; they do not establish reference fidelity.

### Artifact and allowance closeout

Artifact 12459229010 retains 257 public-fixture files. The independent local scan
passes all files. GitHub metadata, upload log and retained ZIP agree on SHA-256
`5b0ec89b2c97f43510e2fa0f36bf8659a8393c8a260455d077d4c3c282bd57cf`.
Expiry is 2026-10-29 21:22:59 UTC. Ignored `ci-06` retains full log, terminal
identity, metadata/ZIP/files, complete audit and exact pixel-comparison results.
No downloaded program is executed during the audit.

Actual CI6 use is one Windows package, one native launch and four SDK processes
(browser helper, controller helper, deliberate reference and native helper).
Cumulative Windows use is packages 1/5, native 1/7 and SDK 10/20. Mac remains
packages 3/5, native 3/7, SDK 24/24. CI use is 6/6. Local batches 51-53 cover
terminal/artifact/pixel audit, independent review and evidence/status/issue
publication with the temporary handoff. Final local use is 53/60. All prior
failed/cancelled operations remain charged; no allowance or contingency resets.

The workflow succeeds, but the audited acceptance gaps remain matched fidelity,
native timing/startup/focus and element-position dragging. Stop with partial proof
and the requested handoff rather than continuing fixes or retries. The handoff skill
saves its document in the OS temporary directory with links and suggested skills;
private temporary paths stay outside committed records. No operation/watch is
pending, no seventh dispatch or further Mac SDK process is allocated, and no product
change follows this audit. Keep #36/B07/B08 and phase acceptance open. ADR 0021
requires decision review before broader renderer work or weaker gates. Preserve
unrelated policy edits and protected recovery. No PR, merge or release is selected.

## Continued implementation and resource closeout, 2026-10-23

The user explicitly resumed #36 in a new chat, superseding the preceding stop
direction for in-scope work. The issue's new-chat continuation records batch 54
and six remaining local batches. No seventh CI dispatch or Mac SDK process was
authorized. The checkout still held `332b4aa` and unrelated policy edits; these
were preserved. Product `7729ccf05d4c4f0af664d74488a5524b7bde509c` implements bounded
movement, with review correction `a91be99771be51faa1531100304cceb2f70942b0`.

### Criterion results and mappings

| Criterion | Result and proof boundary |
| --- | --- |
| Source/revision, inert editing and history | Focused production request tests pass minimal edits, comments/BOM/CRLF, no-op, invalid/stale/dirty refusal, Undo/Redo and reopen. Existing helper execution isolation remains unchanged. |
| Representative element dragging | Implemented for an existing sized frame with fractional literal alignments inside a fixed parent. DOM and real UI/core source-controller proof pass. Actual helper/native dragging and smoothness remain unqualified. |
| Native focus, keyboard, warm presentation and startup | Missing measurement implementation/evidence. The native probe still reports its capabilities false. No native run was available within the exhausted Mac SDK and CI limits. |
| Both-target/two-aspect fidelity | Existing matched captures retain observed glyph/color differences. No renderer code changed and no tolerance is accepted. |
| L18-L20 extension mapping | Existing renderer mappings remain in ADR 0021 and this record. The new provisional alignment and transaction mapping below is documented but has no new SDK/native qualification. Full coordinate/property coverage remains with later tickets. |

Inspection exposes `position` only for the bounded frame when both `xalign` and
`yalign` are unambiguous floating-point literals in [0,1]. Integer source coordinates,
automatic parents and competing placement properties, including `xycenter`, refuse
movement. Frame and parent bounds come from the latest helper geometry. An axis must
have positive available travel. Each delta converts logical editor pixels to game
pixels using the captured zoom, then to alignment by dividing by parent size minus
element size. Pointer deltas snap to eight game pixels; keyboard deltas use one,
or eight with Shift. Alignment stays in [0,1]. Moving the frame moves its children.

Provisional `positions` carry node start and the two alignments through
`screens.canvasPlan`/`screens.canvasRender`; they do not write source. Release sends
`screens.setPosition` with the captured source revision. Core patches only changed
literal spans, in descending byte order, and commits one shared transaction/history
entry. Endpoint source literals remain `0.0`/`1.0`, preserving fractional semantics.
Cancel/Escape end capture before removing the draft; Apply ends capture before
acceptance. The Screen picker cannot change the originating view during a gesture
or write. Invalid/stale/conflicted drafts remain retained. Other placement forms,
general numeric position editing and full manipulation are not claimed by this slice.
No new layout design was introduced; the existing approved flow-v1 movement rules
own the interaction. Full editor visual conformance remains pending.

### Focused verification and failures

Core TDD first rejected the new request as `OPERATION_NOT_ALLOWED`. A second red
case exposed token corruption when yalign preceded xalign; descending span ordering
corrected it. UI TDD first failed because no provisional position reached the request.
The subsequent focused movement test passes preview/no-write, Escape, Cancel followed
by more pointer events, picker interruption, one acceptance and conflicted-draft retention.

Corrected product `a91be99` passes 16 Screens core cases; its selected SDK test remains
ignored. Typechecking and 29 focused UI/protocol/lane cases pass. The preceding full
frontend suite passes all 227 cases with Python 3.12 selected for receipt validators.
The final frontend build passes, retaining its existing bundle-size warning.
The ordinary release core suite built from `7729ccf` passes 407 cases, with 47
explicitly ignored and the three documented broad gates filtered out. It does not
execute the selected SDK or specialist cases. The subsequent `a91be99` correction
has the focused core/UI checks above and a rebuilt real controller; the earlier
broad result is not presented as a full-suite run of the later source.

`screen-position.browser.mjs` uses the existing public Help driver with the
representative source. Real production UI, dispatch, canvas-plan validation and
transactions prove held preview/no write, Escape, minimal accepted alignment tokens,
one history entry, Undo/Redo, Source reconciliation and keyboard movement. The test
driver exits zero and asserts owned-root removal. Its fixed test image supplies
pointer targets only; it neither launches nor qualifies the helper, native WebView,
rendering, focus or timing. The corrected-candidate repeat passes with no page errors.

The first browser attempt was denied loopback access by the sandbox. The authorized
loopback rerun reached a test race: the existing fresh-image flag preceded completion
of Undo. The test now waits for the expected source revision as well as freshness.
An invalid CRC in the test image was also corrected. The first broad frontend run
found the stale operation allowlist expectation and the host's Python 3.9 `tomllib`
absence; parity and the supported Python selection correct them. No product or native
pass is inferred from those failed attempts. Raw controller receipts, build/test logs
and retained-timing analysis are under ignored `continuation-55-60`.

### Independent review and corrections

Both read-only axes reviewed `332b4aa...7729ccf` against the repository standards and
the complete #36/ADR 0021 criteria, then reviewed `7729ccf...a91be99` independently.
No agent edited files or launched app/SDK/CI operations.

#### Standards

Three findings in the first commit were corrected: source serialization stripped
the fractional type at alignment endpoints; the Screen picker could redirect an
active gesture; and the competing-placement check missed `xycenter`. Focused red
tests demonstrated endpoint and picker failures before correction. Final follow-up
reports zero documented-standard violations and zero worthwhile code smells.

#### Spec

Two actionable findings were corrected: fractional endpoint serialization and Cancel
leaving a held move active. The latter reproduced a write after Cancel and further
pointer movement; the rejecting test now passes. Apply also ends capture before
acceptance. Final follow-up reports zero new defects or scope creep. It retains three
acceptance gaps: real helper/native movement, native feedback/focus qualification and
rendering agreement. The fixture-image controller test cannot satisfy those gates.

### Producer diagnosis and next decision

The adapter explicitly selects SDL dummy video and `RENPY_RENDERER=sw`. The matched
Windows reference uses ANGLE2. Pinned 8.5.3 source confirms that the software helper
draws a Render into its own alpha surface, while reference export uses the active
draw backend's screenshot path. This identifies different producers; it does not
isolate the exact glyph/alpha or flat-color compositing cause. The unchanged retained
captures still prevent accepting agreement. The smallest discriminating experiment
is a matched composition through software and GPU producers before choosing a fix.
It requires new execution authority. No tolerance or renderer replacement was chosen.

Analysis of the retained CI6 browser data finds 197/200 input-to-decode samples above
100 ms. Decode p95 is 114.2 ms; helper render p95 is 64.8 ms and previous per-frame
cleanup p95 is 28.8 ms. The helper calls `renpy.free_memory()` every frame; pinned
source shows that this clears render, texture, surface and font caches and collects
garbage. This is a concrete candidate cost to measure, not a measured native cause
or authority to delete cleanup without checking memory/render behavior. Capture
overhead alone cannot explain the over-100-ms decode measurements. These remain
browser diagnostics, not native input-to-visible proof.

Native evidence needs host observation of OS focus/input and visible results outside
the WebView. Changing false flags or rerunning the functional-only probe cannot prove
it. Its measurement implementation and both-target execution remain blocked by the
current resource limits. ADR 0021 requires decision review before broader renderer
implementation or weaker gates. Keep #36/B07/B08 open.

### Cumulative allowance

Batch 55 covered preparation/diagnosis; 56 core request/plan TDD; 57 UI TDD; 58
controller integration and broad verification; 59 independent review, corrections and
focused checks; 60 records, validation and publication. Final local use is 60/60.
CI stays 6/6; Mac packages 3/5, native 3/7, SDK 24/24; Windows packages 1/5, native
1/7, SDK 10/20. No new package, native app, SDK process or CI dispatch ran. Failed
portable attempts stay charged. No new contingency or allowance reset applies.
Further work needs the user's allowance/decision review. No PR, merge or release
is selected; unrelated policy edits and protected recovery remain intact.
CURRENT and HANDOVER remain above their soft word-count targets because this scoped
closeout preserves the existing phase acceptance and protected recovery records.

Publication is pending. Automatic approval review rejected the combined commit/push
and then the standalone public push. Between attempts, fresh connected GitHub checks
confirmed authenticated user Caldwell-41 owns the public Caldwell-41/Renpy-editor
repository, has push/admin permission, and its clone URL exactly matches origin.
Fresh #36 continuation still explicitly carried forward commit/push authorization.
The second rejection nevertheless requires explicit approval of this exact payload's
public exposure. No alternative tool or indirect publication was attempted. Product
`7729ccf`/`a91be99` and closeout `feab802` remain local. The temporary publication
review lists the commits and prepared #36/#29/#22 updates. Those GitHub records remain
unchanged at the transferred allowance state until approval. This is a publication
blocker in final batch 60, not a renewed implementation allowance.

## Matched producer diagnosis, 2026-10-23

The user approved 16 additional local batches and 8 Mac SDK launches for a matched
software/GPU comparison and an evidence-based correction proposal. Cumulative
ceilings are 76 local batches and 32 Mac SDK launches. CI remains 6/6; package,
native-app and Windows ceilings are unchanged. No new contingency applies.
The experiment starts from published `6b74c61`; product code is unchanged.
The prior publication blocker was resolved by the user's exact-payload approval
and verified push through that commit, as recorded in #36.

### Method and original failures

Ignored `.toolchains/canvas-proof/producer-diagnosis-2026-10-23/` retains the
experiment scripts, reservations, PNGs, JSON, process logs and cleanup receipt.
A fresh release build of the existing `canvas-controller-driver` supplies the
production `screens.canvasPlan` for the public Help fixture. The official archive
passes its existing checksum, `eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`.
Accepted fixture SHA-256 is
`08201efc692198063ed9d66a814da99683643cfbdccd45189fd8736e3aed422b`.
The driver exits zero and removes its verified-SDK fixture without launching Ren'Py.
Two preparation attempts failed on request shape: a missing open project and an
extra `screenName` field in `screens.inspect`. One premature software setup failed
before copying the font or spawning a process. All are charged to local batch 62.

Each SDK experiment loads only the public fixture and Loomlight's trusted renderer
in a disposable project. The unchanged production `_canvas_build` builds the core
plan; the original screen definition builds the reference. Both run in the same
backend and process with identical assets, styles and control state. Software
captures use `render_to_texture(render, True)`; GL2 captures use
`render_to_file(render, resize=True/False)`. This isolates graph construction from
backend/export differences. It does not exercise a production GPU helper or its
transport, lifecycle, hidden startup or focus behavior.

Runs 25/26 exposed stale reference hover renders because the experiment changed
style and captured again before clearing cached surfaces. Their hover comparisons
are invalid. Software `screenshot()` also ignores its Render argument; the first
experiment's software window/opaque captures are excluded. Runs 27 onward call
`renpy.free_memory()` after changing the reference style and retain alpha-surface
captures only for software. These are rendering diagnostics, with no timing claim.

### Decisive results

| Run | Backend/control | Same-backend helper versus source screen |
| --- | --- | --- |
| 27 | Software, drawable/game ratio 1 | Zero different RGBA pixels in all four aspect/state captures |
| 28 | GL2, ordinary Retina ratio 2 | Zero different RGBA pixels in all four virtual captures and all four drawable captures |
| 29 | GL2 ratio 2, text sampling forced to game resolution for diagnosis | Zero different RGBA pixels in all virtual/drawable captures |
| 30 | Software repeat plus solid-color controls | Calibration evidence; no product change |
| 31 | GL2, high-DPI window disabled, measured ratio 1 | Zero different RGBA pixels in all virtual/drawable captures |

Every run finishes with exit code zero and a complete four-sample receipt. Both
aspects are 1280x720 and 1024x768, with matching physical window dimensions. The
frame remains 640x360, group 331x204, text 331x87, image 64x48 and button 143x45.
Text wrapping and those widget dimensions agree. Exact cross-backend RGBA counts
below compare the helper graphs; each source-screen graph equals its helper graph
in that backend. No image resizing outside Ren'Py or tolerance is applied.

| Aspect/state | Software versus GL2 Retina (28) | Software versus GL2 ratio 1 (31) |
| --- | ---: | ---: |
| 1280x720 normal | 8,780 | 5,715 |
| 1280x720 hover | 14,013 | 11,110 |
| 1024x768 normal | 9,706 | 7,603 |
| 1024x768 hover | 14,893 | 12,996 |

The Retina counts exactly reproduce the retained Mac comparison from reference-21
and browser-21. Maximum channel differences are 213 at Retina scale and 64 at
ratio 1. Forcing only GL2 text sampling to game resolution still differs by
11,880 normal and 16,785 hover pixels at either aspect, with maximum difference 94.
That diagnostic control does not establish a fidelity correction.

Pinned `renpy/text/text.py` sets text oversampling to the backend's
`draw_per_virt`; this explains the different glyph sampling at Retina scale.
Run 31 uses [SDL's high-DPI window hint](https://wiki.libsdl.org/SDL2/SDL_HINT_VIDEO_HIGHDPI_DISABLED)
only as an experimental control and verifies the resulting ratio. Residual
scale-1 differences show that Retina scaling is not the sole cause.

Solid controls isolate an engine rendering/export difference without text or
Loomlight's widget graph. At size 8, software exports `#6b4d28` as RGBA
`[107,77,40,255]`; GL2 exports `[106,76,39,254]`. At sizes 16 and 128, both export
`[106,76,39,254]`. The other three fixture colors also lose one unit per channel
and alpha in these scaled/export paths. Pinned `imagelike.Solid.render` uses an
unscaled texture below size 10 and a transformed 10-pixel texture above it;
`swdraw.solid_texture` fills the source surface with the input color. In the actual
hover composition, software blue is 40 and GL2 blue is 39 at an interior point,
with the other channels equal. This narrows the flat-color discrepancy to backend
scaling/compositing/export. It does not isolate the exact arithmetic instruction.

### Correction proposal and acceptance boundary

Keep the existing source-derived graph and qualify a GPU-backed helper using the
same renderer and drawable sampling as deliberate Ren'Py preview. The same-backend
zero-difference result supports this proposal for the bounded public composition.
Do not compensate source colors, disable Retina text in the product or introduce
a pixel tolerance to accept the current software output.

The first proposed capability gate is hidden GPU startup without OS focus theft.
Only after that passes should the private helper adapter/export path change, with
explicit drawable-scale handling and the existing data-only, draft/revision and
process-cleanup rules. This is a proposal for ADR 0021 decision review, not an
accepted renderer change. A failed hidden-startup gate requires reconsidering the
approach. A passing pixel experiment alone cannot justify relaxing it.

The experiment does not qualify Windows, a production GPU process, native timing,
physical input, focus retention, startup acceptance or smooth helper dragging.
It does not reopen the full supported subset. Keep #36/B07/B08 open. One additional
Mac SDK launch remains; CI has no remaining dispatch. A full correction and target
qualification cannot be promised within that single process.

### Allowance, verification and cleanup

Batches 61-67 cover preparation/allowance, fixture setup and failed preparation,
first producer runs, corrected captures, text-sampling control, scale/color controls,
and analysis/cleanup/evidence. Batch 68 is independent Standards/Spec review;
batch 69 covers corrections, final validation, selective commit and tracker closeout.
Final use is 69/76 local batches, 31/32 Mac SDK launches and 6/6 CI.
Mac package/native use remains 3/5 and 3/7; Windows package/native/SDK use remains
1/5, 1/7 and 10/20. Remaining allocation is seven local batches and one Mac SDK
launch, with no reset or new contingency. No editor package or native editor
launch occurred; the four GL2 diagnostic processes did create test windows.

Every SDK process exits; the owned process-group cleanup runs. A fresh process
inventory finds no experiment/controller process. All diagnostic game directories,
including their generated bytecode and saves, are removed after recording file
hashes. PNGs, JSON and logs remain as ignored evidence. The accepted repository
fixture is unchanged. No user game content or project actions entered the helper.
Repository policy edits and protected recovery remain intact.

Validation passes for 872 repository files, and whitespace checks pass. The full
frontend check passes typechecking and all 227 tests with zero failures/skips.
No Rust product code changed; no further core suite, package or CI run is claimed.
The ignored-artifact secret scan passes for 179 files; raw evidence remains local
and contains machine paths, so it is not selected for publication. CURRENT and
HANDOVER remain above soft word targets (1,103 and 2,292 words) to retain prior
phase acceptance and protected recovery. This change replaces only their live L17
sections; unrelated policy hunks remain unstaged.

Independent code-review compares `6b74c61` with diagnostic commit `6ad37ce`.

#### Standards

No documented violations or baseline smell findings. The reviewer checked budget,
status/evidence ownership, provenance, invalid-capture exclusions and cleanup.

#### Spec

No defects in the selected diagnostic scope. Raw comparisons and all seven receipts
support the counts and limitations. Full-ticket Windows fidelity, native timing,
focus/startup and real helper manipulation remain pending. The GPU correction
remains a proposal subject to ADR 0021 decision review.

The diagnostic commit and this final validation/review receipt remain local. No new
push is claimed. #36 records the supplement and final result; B07/P3B receive the
compact status reconciliation. Existing publication through `6b74c61` is unchanged.

## Hidden GPU-helper capability test, 2026-10-23

The user selected the next GPU-helper test and required it to stay hidden and
retain keyboard focus in the existing application. The experiment continues from
local `d34676f` within the existing allowance, with seven local batches and one
Mac SDK process remaining at entry. This selects a capability test, not a renderer
acceptance, tolerance or weaker gate. Production code is unchanged.

### Preparation and proposed mechanism

Ignored `.toolchains/canvas-proof/hidden-gpu-2026-10-23/` retains exact native and
renderer sources, binaries, upstream source, reservations, process output, observer
receipts and the later unqualified guard correction. The pinned 8.5.3
`renpy/pygame/display.pyx` creates a hidden SDL window, then unconditionally calls
`SDL_ShowWindow`. The `gl2_modify_window_flags` hook alone cannot keep it hidden.
[SDL's Mac background hint](https://wiki.libsdl.org/SDL2/SDL_HINT_MAC_BACKGROUND_APP)
prevents forced application activation; it does not suppress window display.

The disposable native adapter attempted to replace ordering/key-window methods
on the helper process's `SDLWindow` class before display creation and require
prohibited application activation. It made no change to SDK files, system settings,
signing policy or another process. A cloned production helper renderer loaded the
adapter in early initialization, refused software fallback and used GPU export.
It retained the production JSON request loop and source-derived public Help plan.
The test intended four aspect/state frames and external observation over the whole
SDK lifetime. No project source or action entered this private helper.

An independent AppKit/CoreGraphics observer started before the SDK process. It
recorded foreground application changes and visible windows owned by the helper,
without capturing screen pixels or window titles. Native compilation and its
zero-SDK observer preflight passed. An initial Python bytecode preflight could not
write the system cache under the sandbox; an in-memory syntax check passed instead.
No permission or machine setting was changed to make that check pass.

### Actual SDK result and failure

SDK process 32 fails. The native installation function returned refusal before
any requested helper frame completed. Its original return value did not identify
which precondition failed: main thread, native class, existing window, activation
policy or method installation. The exact cause remains unknown. No GPU image or
pixel agreement is established by this run.

The prototype raised `RuntimeError` on refusal. Ren'Py's graphical exception handler
then opened an error window. This violates the user's hidden-window requirement.
The agent's failure path caused that violation; a successful normal-start design
would not excuse it. The controller retained the full trace and expired its
15-second frame deadline, then stopped the owned process group. Driver exit is 1.

| Criterion | Observed result |
| --- | --- |
| Hidden throughout startup and rendering | Failed; 1,508 of 1,683 external samples report a visible helper-owned window |
| Existing application's foreground ownership | No change observed; zero activation events and zero changed-foreground samples |
| Keyboard focus | No foreground takeover observed; no physical-keyboard or complete key-window proof is claimed |
| Four GPU frames through the helper | Failed; zero frames completed |
| External observation | 15.246 seconds, no inventory failure, maximum sample gap 33.468 ms |
| Cleanup | Helper and observer exited; diagnostic game, bytecode and saves removed |

The visible window was error UI. This is neither a hidden-startup pass nor a
rendering pass. The external observer supplies sampled visibility and application
activation evidence; it is not continuous physical-keyboard observation.

### Unqualified correction and offline checks

The exact failed native source/binary and renderer are preserved under `failed-*`
names. A corrected prototype catches native loading/installation failure, writes
a refusal receipt and directly exits with code 72. It bypasses Ren'Py's graphical
exception handler, including when writing the receipt fails. Later native-window
violations use the same direct-exit path. Native installation-stage instrumentation
was added and compiled; it does not establish the cause of the original refusal.

Two plain-Python subprocess checks execute the actual corrected bootstrap with a
simulated native refusal or missing library. Both exit 72, write the expected
refusal receipt and produce no traceback. These checks launch no SDK and prove
only that bootstrap failure path under the simulated inputs. The corrected native
adapter and renderer have not run in Ren'Py. They supply no repaired hidden-startup,
GPU, focus or production proof. Production helper behavior remains unchanged.

### Allowance, review and publication

Batches 70-76 cover preparation and source inspection, native prototype, harness
preflight, the single SDK test, diagnosis/offline guard correction, independent
review and final corrections/validation/commit. Cumulative use reaches 76/76 local
batches and 32/32 Mac SDK processes. CI remains 6/6; Mac packages/native editor
remain 3/5 and 3/7; Windows packages/native/SDK remain 1/5, 1/7 and 10/20.
No contingency resets or further run is authorized. No owned operation/watch remains.
A new native/SDK test needs an explicit supplement. Keep #36/B07/B08 open.

Automatic approval review rejected the attempted #36 selection update. It cited
public issue publication without authorization to an unverified destination. The
upstream read bundled in that rejected call did not execute; a separate read-only
upstream-source request later succeeded. No alternate publication route was used.
The selection, failed result and status reconciliation remain local. Public records
still end with the previous completed diagnosis and GPU proposal. No new push,
issue write, PR, merge or release is claimed. Unrelated policy edits and protected
recovery remain intact.

Independent code-review checked `d34676f...ef2a2bd` on both axes. Standards reports
no documented violations or baseline smell findings. Spec reports no defects in
the failed-test record, confirms that the selected hidden capability failed and
retains all GPU/native/target acceptance gaps. Neither review accepts the unrun fix.

Final repository validation passes for 872 files; whitespace checks pass. The
ignored-artifact secret scan passes for 34 files, and a separate process inventory
confirms the helper PID and observer are absent. No product TypeScript/Rust source
changed, so the preceding 227-test/typecheck result is retained without claiming a
new product qualification. CURRENT/HANDOVER remain above soft word targets at
1,101/2,330 words to preserve preceding phase acceptance and protected recovery.
Only the live L17 sections changed; unrelated policy hunks remain unstaged.

The next proposed supplement is six local batches and two Mac SDK launches, raising
cumulative ceilings to 82 and 34 if the user approves. It would diagnose the native
installation refusal and retest the guarded hidden startup/GPU frames. It supplies
no promise of full L17 acceptance and adds no CI/package/native-editor allowance or
contingency. This proposal is not an allocation. Exact #36/#29/#22 status payloads
are prepared locally for publication approval; none was sent after the rejection.
The local commits and raw evidence remain separate from published history.
