# L17 canvas rendering proof

[L17 #36](https://github.com/Caldwell-41/Renpy-editor/issues/36) owns selection,
allowance and remaining acceptance. [ADR 0021](../../adr/0021-separate-renpy-canvas-helper.md)
owns the accepted design and gates. This record supports one bounded Help proof.
It does not qualify the full Screens subset or close B07/B08.

## Implemented connection

The production Screens UI requests a revision-bound data plan through the core.
The pinned 8.5.3 adapter starts one private Ren'Py project, supplies only the trusted
renderer plus JSON and copied assets, and reuses its process. The current adapter
uses GL2 on Mac and ANGLE2 on Windows, with native hidden-window controls and a
private Windows desktop. Earlier software-renderer experiments remain in the dated
evidence below. The runtime process-tree owner handles
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

## Guarded GPU-helper retest and publication, 2026-10-23

The user approved six more local batches and two Mac SDK launches, publication of
four reviewed commits and updates to #36/#29/#22. Hidden operation and keyboard
focus retention remain required. Ceilings become 82 local batches and 34 Mac SDK
processes, with no reset or new contingency. CI remains 6/6; other limits do not
change. This is the bounded Mac helper capability test, not production promotion.

### Approved publication

Ordinary push publishes `6ad37ce`, `d34676f`, `ef2a2bd` and `0bc6954`. The exact
remote branch SHA is verified as `0bc69547ccc14ab9f8e74843fe0cc0bb4edc4d5e`.
The three approved issue payloads match their fresh remote baselines before write;
all three are published and read back exactly, with their issues remaining open.
#36 also records this approved retry allowance. This resolves the preceding public
publication blocker. No PR, merge or release is selected. The new retest evidence
and status changes are committed locally; the approval named the preceding four
commits. Raw machine-local evidence remains ignored.

### SDK33 refusal diagnosis and guarded exit

The instrumented installer refuses at `activation-policy-check`. The effective
activation policy is already the required prohibited value (2), with zero windows,
key windows, activation/key events or application activation. The old installer
rejects the setter's false return rather than checking that effective state.

The corrected bootstrap exits directly with code 72. No requested frame completes.
External observation records 162 samples over 1.204 seconds, zero visible helper
windows, zero changed-foreground samples, zero activation events and no inventory
failure. The maximum sample gap is 23.932 ms. This qualifies the observed safe
refusal path for this SDK run; it is not GPU rendering success. Cleanup removes
the private game after helper and observer exit.

### Native condition correction and preflight

The native installer now reads the effective activation policy. It attempts the
setter only when necessary, then requires the effective policy to be prohibited.
It does not accept accessory/regular policy or weaken signing/OS permissions.
Two windowless native subprocess checks use a synthetic `SDLWindow` subclass and
no SDK code or window allocation. With the required policy already present, the
old native binary refuses and the corrected binary installs successfully.

The initial sandboxed native checks cannot access the required WindowServer state
and report activation policy -1; those are not passes. Their outputs are retained.
The same checks with authorized native access pass the expected old-refusal/new-
installation conditions. The original SDK33 native/renderer inputs and corrected
SDK34 inputs are separately preserved in ignored evidence.

### SDK34 bounded capability result

SDK34 passes the four-frame rendering and observed hidden/focus checks. It uses the
same private JSON helper request loop and production `_canvas_build`, with the
process-local Mac native ordering guard and GL2 export in the prototype copy.
The SDK logs identify GL2 on Apple M4. All frames use drawable/game ratio 2.0 and
physical dimensions equal to the requested game dimensions. No source or action
from a user project enters the helper.

| Aspect/state | Exact RGBA differences from the retained GL2 source-screen reference | PNG SHA-256 |
| --- | ---: | --- |
| 1280x720 normal | 0 | `b01e22e0b0e0d4862fe81e517cd9e865207463119fa9851089a75bbea1c7849d` |
| 1280x720 hover | 0 | `4eab0ec81268f5aaa248ab333d34db7ef727692db380608a117352ac7849e3cb` |
| 1024x768 normal | 0 | `1c4fd529f9af308a5ccd1f37d964773fb2d25cd106c60412c104688be97ab4a8` |
| 1024x768 hover | 0 | `5030d478b37bd86c556d1cb050efaa6671a894029b3763edb67b055335d1a426` |

These compare SDK34's helper PNGs with the original screen's GL2 virtual captures
from run 28. Every PNG file hash also matches. Assets, source-derived plan, styles,
font, state, dimensions and Retina sampling match; no outside image scaling or
pixel tolerance is used. This extends the earlier same-process comparison to the
private helper's actual request loop and separately retained source-screen images.

The external observer records 703 samples over 6.838 seconds with no visible
helper window, no changed-foreground sample, no activation event and no inventory
failure. Its maximum sample gap is 28.275 ms. At every completed frame the helper
reports one native window, one blocked ordering request, zero visible/key windows,
zero key/activation events, inactive application state and prohibited policy 2.
The native guard is installed before the attempted window ordering. The result
supports hidden operation and no observed keyboard-focus takeover in this bounded
Mac experiment. It is not continuous OS input observation or physical-keyboard proof.

### Cleanup, limits and continuation

SDK33 exits 72 through the safe refusal path. SDK34 does not exit on the owner's
SIGTERM within five seconds; the owner escalates to SIGKILL, and exit is -9.
The capability receipt's pass therefore does not qualify graceful shutdown.
Both process groups/observers are stopped, private game/bytecode/save directories
are removed, and a fresh process inventory finds neither helper PID nor observer.
The forced stop and failed SDK33 remain charged and visible. No backup, signing
policy, system permission or unrelated project changes are introduced.

Production helper/renderer code remains unchanged. The process-local native method
replacement is a prototype, with private-SDL-class and Mac-only dependencies. This
is not a qualified shipping adapter, packaged Loomlight focus result, Windows proof,
native input-to-visible timing, smooth drag/resize, startup acceptance or complete
shutdown qualification. Those acceptance gates remain with #36/B07/B08. Keep all
three open. No tolerance, weaker requirement or broad subset acceptance is selected.

Batches 77-82 cover publication/preparation, guarded SDK33 diagnosis, native
correction/SDK34, pixel/cleanup verification and evidence, independent review with
in-scope corrections, then final validation/commit/tracker reconciliation. Cumulative
use is 82/82 local batches, 34/34 Mac SDK processes and 6/6 CI. Mac package/native
editor use remains 3/5 and 3/7; Windows package/native/SDK use remains 1/5, 1/7 and
10/20. No operation/watch remains pending and no new contingency applies.
Next work needs a selected production-integration/qualification scope and allocation;
retain this bounded capability result and the prior failed attempts.

Independent code-review compares `0bc6954...1201372`. Standards reports no documented
violations or baseline smell findings. Spec reports no defects in the scoped result
and independently verifies all four PNGs against the source-screen captures. Both
reviews retain the observation limits, forced-stop and production/Windows/native
acceptance gaps. No reviewer runs an additional SDK or native test.

Repository validation passes for 872 files and whitespace checks pass. The ignored
retest evidence secret scan passes for 90 files before final tracker payloads are
prepared. Product code is unchanged; the preceding 227-test/typecheck result retains
its existing scope and is not new GPU qualification. Only the live L17 status
sections and this evidence owner change; unrelated policy hunks remain unstaged.
The new retest commits remain local. The user-authorized four preceding commits
are published; #36/#29/#22 receive the final retest result and unchanged open gates.


## GPU production integration and shutdown, 2026-10-23

The user selected production integration and graceful shutdown through the implement
workflow, approving the handoff supplement. #36 records the selection and verified
read-back. Ceilings are now local 106, Mac SDK 46, CI 9 and Windows SDK 24. Existing
package/native ceilings remain five/seven per target. Entry use was local 82,
Mac SDK 34, CI 6, Windows SDK 10; Mac package/native three/three, Windows one/one.
Historical use stays charged and no new contingency applies. The handoff's pending
approval is resolved. The published branch at entry is `aded9c8`.

### Early Windows capability preparation

The missing Windows hidden GPU path is tested before broad integration. The selected
probe uses documented private-desktop creation and process startup placement, never
switches desktops and makes no ACL, signing or permission-policy change. Its native
owner starts a focus sentinel on the disposable CI input desktop, attaches the
suspended SDK process to a kill-on-close job, then resumes. The helper independently
checks its desktop identity against the owner and input desktop. The owner samples
foreground/focus and helper visibility on the input desktop, recording inventory
failures and maximum sample gaps. Private-desktop windows are not claimed absent.

One SDK launch requests GL2 frames at 1280x720/1024x768 and normal/hover, checks PNG
header dimensions and geometry, then requests stop. Acceptance requires a parsed
stop acknowledgment, exit 0 and an empty job without forced cleanup. The second
launch selects bootstrap refusal after desktop verification and requires its exact
reason and exit 72. Both require complete native cleanup and fixture removal.
The generated renderer uses the production data-only builder/request loop with
checked GL2 export and cooperative-stop substitutions. It reads synthetic values
and the pinned SDK font, not user scripts. The official checksum and existing
archive checks remain mandatory. The inspected archive contains zero link entries.

This is a disposable capability check, not a production-path pass. It does not prove
matched source fidelity, physical keyboard input, continuous observation, packaged
Loomlight lifecycle, native timing or smooth manipulation. Production is unchanged.
After capability passes, the shipping adapter still needs production integration
and affected both-target qualification. Full #36/B07/B08/3B acceptance stays open.

### Review and local checks

Candidate `2ca7a7f` adds the probe and ordinal-7-only workflow. Independent Standards
and Spec reviews both identify one P2 admission defect: unrelated desktop/API
bootstrap failures produce the same refusal receipt as the selected refusal.
Correction `e51eb97` records the failure stage and checks the exact parsed reason,
normal desktop identity and stop acknowledgment. Negative admission checks reject
missing/wrong refusal reasons, missing acknowledgments/desktop identity and zero
frames. Both follow-up reviews close the P2 and report zero new findings.

Portable generation and negative admission checks pass. Every generated Ren'Py
Python block parses with the host Python interpreter; this is not SDK compilation.
TypeScript typecheck, workflow YAML parsing and whitespace checks pass. Repository
validation passes for 877 files before this status update. No SDK, package or native
editor ran locally. The full product suite remains due at the integrated candidate.
Unrelated policy edits and protected recovery remain intact.

Routing correction `848d50f` moves the unchanged capability job into the registered
Screens workflow (`screens-source.yml`, workflow ID 391374211). The explicit
`canvas_gpu_capability` selector excludes old Help/L01/canvas jobs, and conflicting
selectors fail validation without running a workload. All eight selector combinations
pass the portable truth-table check. Both reviewers found no new routing defects.

#### Standards

The refusal-admission P2 is closed. No remaining documented-standard or baseline
smell findings in the scoped candidate. Review was read-only and performed no SDK,
native or CI execution.

#### Spec

The refusal-admission P2 is closed. No remaining checkpoint implementation defect.
Windows execution and later production/whole-ticket acceptance remain pending.
Review was read-only and performed no SDK, native or CI execution.

### Allowance and next operation

Batches 83-87 cover fresh state/tracker/contracts, Windows mechanism investigation,
probe implementation/checkpoint, independent review/correction, then publication and
CI preparation. Current use is local 87/106, Mac SDK 34/46 and CI 7/9. Windows SDK
use is 10/24, with two further launches reserved for CI7. Package/native use is
unchanged. CI7 selects no package/native-editor launch.

CURRENT and HANDOVER still exceed their soft word targets because they retain
unrelated policy work, earlier pending acceptance and protected recovery. This
update replaces only their live L17 sections; no protected recovery text changes.

### CI7 pending operation

The reviewed probe/routing commits are `2ca7a7f`, `e51eb97` and `848d50f`.
Documentation checkpoint `3f04698e129a1fcb2ecdb00c5940113ff579b0d2` is published and
verified by remote read-back. [CI7 run 39905179001](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39905179001),
attempt 1, tests that exact SHA on `codex/phase3b-screen-designer` through registered
workflow `391374211` (`screens-source.yml`). Inputs are ordinal `7`,
`canvas_gpu_capability=true`, `canvas_helper=false`, `owned_blank=false`.

At 2026-10-23 05:20:16 UTC (15:20:16 AEST), the run is in progress. The selection
job passed; the Windows capability job is running. The three old qualification
jobs are deliberately excluded, not accepted by this run. No result is inferred.

On terminal completion, verify run/attempt/SHA and required steps, download the
privacy-scanned artifacts and audit the native owner, all four frames, exact
refusal/stop receipts, helper exits, job/desktop/fixture cleanup and SDK count.
Retain failures and classify them before correction. Artifact retention is seven
days from upload; an actual artifact ID and expiry are not yet available. This
capability cannot accept the full production or rendering requirement.

The selected wait route is ci-watch in this same chat. Registration is attempted
after this publication receipt. Its ignored `ci7-watch-registration.json` under
`.toolchains/canvas-proof/gpu-integration-2026-10-23/` records the actual startup
acknowledgment; only `watcher_running: true` establishes an active watch. If it
cannot register, leave the run identity intact and use manual same-chat resume.
The watcher event is a cue for audit, not proof of success. Later documentation
commits do not replace CI7's tested SHA.

### CI7 terminal audit and compiler invocation correction

CI7 run `39905179001`, attempt 1 at
`3f04698e129a1fcb2ecdb00c5940113ff579b0d2`, completed with failure. The watcher
matched this chat and its event receipt is acknowledged. Branch changes since the
tested SHA were documentation only, so the failure applies to this capability probe.

The native-owner compile step failed before the compiler ran. PowerShell passed
the nested `cmd.exe` command with doubled leading quotes, and the shell rejected
the Visual Studio path at `Program Files`. This is a harness argument-quoting defect,
not a compiler or GPU failure. The failed command/log isolates the mechanism;
there is no evidence supporting a renderer or SDK correction. Desktop setup, SDK
verification/execution and both probe cases were skipped. CI7 consumes one dispatch
but zero SDK/package/native-editor launches. Its two SDK reservations are released
because the exact step inventory proves they did not run; historical launches remain
Windows 10 and Mac 34.

Artifact `12480940420` contains only `candidate.txt`, matching the tested SHA. Its
retained ZIP SHA-256 is
`76d4d6dc4c6f3b67ab97b95f007f1ad747aa4a78ce73897ac5a32b0b7f745de1`, equal to GitHub
metadata. It expires at 2026-10-30 05:20:28 UTC. The privacy scan/upload passed.
The original ZIP, extracted file, run/step metadata and failed log remain ignored.
No rendering, startup, focus or shutdown pass is claimed.

Correction `3d7bac8` uses Microsoft's documented `Launch-VsDevShell.ps1` with
`-Arch amd64 -HostArch amd64 -SkipAutomaticLocation`, then invokes `cl.exe` with
separate PowerShell arguments. No extra shell parses the compiler command. The
workflow admits only ordinal 8 and a fresh scratch path; all candidate/branch/
attempt/selection guards remain. Portable generation/admission checks, YAML parsing
and whitespace pass. This host has no Windows compiler; native verification remains
with CI8. Both independent review axes report no findings in the correction.
The incident index records the quoting mechanism as H27.

Batches 88-89 cover terminal audit/correction/review, then scoped publication and
CI8 preparation. Use before CI8 is local 89/106, CI 7/9, Mac SDK 34/46 and Windows
SDK 10/24. Existing package/native use is unchanged. CI8 selects the same two-SDK
capability probe and no package or native editor. After dispatch, one CI slot remains
for integrated qualification; no extra allowance or contingency is created.

### CI8 pending operation

[CI8 run 39905615261](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39905615261),
attempt 1, tests published candidate `1cc4e8e3661b45b010d350a8c0120cbc830af2eb`
on `codex/phase3b-screen-designer`. Workflow ID is `391374211`; inputs are
ordinal `8`, `canvas_gpu_capability=true`, `canvas_helper=false`,
`owned_blank=false`. Remote candidate read-back matches. At 2026-10-23
05:24:58 UTC (15:24:58 AEST), GitHub reports the run in progress.

Use at dispatch is local 89/106, CI 8/9, Mac SDK 34/46 and Windows SDK 10/24,
with two Windows SDK launches reserved for CI8. No package/native-editor operation
is selected. Audit the same rendering/stop/refusal/native cleanup criteria described
for CI7, plus the corrected compiler invocation. Missing or skipped proof remains
unaccepted. Preserve the CI7 failure and do not reset counts.

ci-watch registration follows this receipt. Its ignored `ci8-watch-registration.json`
in the existing integration evidence directory records the actual acknowledgment;
require `watcher_running: true`. Otherwise use manual same-chat resume. On a matching
event, acknowledge delivery and audit the exact run/attempt/SHA and retained artifacts
before continuing. Later documentation commits do not change this candidate.

### CI8 terminal audit and Windows renderer correction

CI8 run `39905615261`, attempt 1 at
`1cc4e8e3661b45b010d350a8c0120cbc830af2eb`, completed with failure. The watcher
matches this chat and its receipt is acknowledged. The later commit only records
the wait, so the result applies to the current probe. Native compilation now passes,
closing H27. Desktop provisioning, official SDK verification, privacy scan and
artifact upload also pass. Both selected SDK processes ran; Windows use is now
12/24. No package or native editor ran. CI use remains 8/9.

The render/stop case verifies private-desktop placement but produces zero frames.
Its log reports unavailable OpenGL functions, then software-renderer initialization.
It times out and requires forced termination, exiting 73. The job empties, desktop
closes and fixture is removed. Across 5,045 samples it records no foreground/focus
change or helper visibility on the input desktop, but 154 inventory failures.
This is a failed capability and shutdown gate, not a hidden-startup pass.

The refusal case records the exact selected refusal and exit 72 without forced
cleanup. Its job, desktop and fixture close. All 72 samples report an inventory
failure, with no helper window on the private desktop. The case fails its observation
gate despite the correct refusal. Maximum sample gaps are 32 ms and 16 ms respectively.
No physical keyboard, matched fidelity or production lifecycle proof is established.

Artifact `12480737184` contains 18 files and expires at 2026-10-30 05:26:41 UTC.
Its ZIP digest is
`aa388fd6e6f80ca3de9f056211dcf901207d1fd9ac07ac66cc5367872be837c3`, matching GitHub.
Every extracted member, probe hash, native executable identity and candidate matches
the retained archive. Original logs, receipts, binaries, ZIP and metadata remain
ignored alongside the CI7 failure; no historical evidence is overwritten.

The ranked diagnosis is (1) the forced OpenGL renderer disabled the working Windows
fallback, (2) private-desktop rendering itself is unavailable, and (3) enumeration
fails while the private desktop is empty. The pinned SDK's `get_draw_constructors`
selects only the forced backend plus software; the earlier Windows reference used
`angle2` on Microsoft Basic Render Driver. The corrected probe requires `angle2`
for both environment selection and frame admission. Software remains rejected.
This tests the same model renderer family used by the Windows reference, without
claiming a matched-image comparison or physical GPU acceleration.

A hidden STATIC observer window on a dedicated private-desktop thread keeps its
enumeration nonempty. Each sample must actually observe both desktop sentinels;
API failures remain fatal. This avoids treating a zero return as success based on
an assumed empty-desktop error convention. The observer processes window messages
while awaiting its stop event, joins within five seconds, and must exit normally.
The mandatory `observerStopped` receipt rejects missing/false cleanup evidence.
The SDK's private-window count still excludes the observer PID. No desktop is
switched or permission/ACL policy changed.

Both independent reviewers identified the initial observer's non-message-pumping
wait as P2. The corrected message-aware loop addresses it; both follow-up reviews report no
remaining findings. Repository validation passes for 876 files. Portable generation,
negative admission checks, workflow YAML and whitespace checks pass. Windows native
compilation and execution of this correction remain for CI9. The full product suite
remains due at the integrated candidate; this checkpoint changes no production code.

Batches 90-92 cover audit/diagnosis, correction/checks, independent review and records.
Use is local 92/106, Mac SDK 34/46, Windows SDK 12/24 and CI 8/9. Package/native use
remains Mac three/three and Windows one/one. CI9 selects only the corrected two-SDK
capability probe. It consumes the last approved dispatch; production integration and
qualification remain unfinished even if it passes. After its audit, continue work
that fits the existing authority and report any concrete missing allowance or host
capability before further execution. No extra contingency is created.

### CI9 pending operation

[CI9 run 39906453139](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39906453139),
attempt 1, tests published candidate `96dabf226523d1445eb8f729360b2ab1812aab76`.
Remote read-back matches. The registered Screens workflow selects ordinal 9 and
only `canvas_gpu_capability=true`. GitHub accepted the dispatch at 2026-10-23
05:33:52 UTC (15:33:52 AEST). No terminal result is inferred.

Use is local 93/106, CI 9/9, Mac SDK 34/46 and Windows SDK 12/24, with two Windows
SDK launches reserved. Package/native counts are unchanged. The CI allowance is
exhausted; no rerun, attempt 2 or additional dispatch is authorized. Audit this run
before deciding further work or any required allowance/capability request.

Same-chat ci-watch registration follows this receipt. The ignored
`ci9-watch-registration.json` records its acknowledgment; only `watcher_running: true`
establishes monitoring. On delivery, match the thread and acknowledge, verify the
exact run/attempt/SHA, inspect required steps and audit artifacts, frames, stop/refusal
receipts, normal exits, observer/job/desktop/fixture cleanup and actual launch counts.
Artifact retention is seven days; the ID and expiry will be available after upload.
Later documentation commits do not change the tested candidate. If monitoring does
not register, retain the run identity and use manual same-chat resume.

### CI9 terminal audit and integration reassessment

[CI9 run 39906453139](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39906453139),
attempt 1 at `96dabf226523d1445eb8f729360b2ab1812aab76`, completed successfully.
The watcher matches this chat and delivery is acknowledged. The later `eb12a19`
changes documentation only, so this result applies to the current probe. All selected
compile, display, checksum, SDK, privacy and upload steps pass. The three unselected
qualification jobs are skipped and establish no additional acceptance.

The normal case emits four ANGLE2 frames, covering 1280x720 and 1024x768 with both
normal and hover request metadata. Independent audit verifies each frame ID, state,
PNG dimensions and centered 640x360 frame geometry. The SDK log identifies ANGLE
on Microsoft Basic Render Driver. This establishes use of Ren'Py's model renderer;
it does not establish physical GPU acceleration. Normal and hover PNGs have identical
bytes at each aspect, so distinct hover appearance is not proved. No matched-source
fidelity or tolerance is accepted by this capability fixture.

The helper verifies private-desktop placement, acknowledges stop, exits 0 and leaves
an empty job without force. The observer exits normally, desktop closes and fixture
is removed. Across 321 samples, maximum gap 31 ms, the owner records zero foreground
or focus changes, input-desktop helper visibility or inventory failures. Three helper
windows exist on the private desktop, which is never switched into view.

The refusal case emits no frame, records the exact selected refusal and exits 72
without force. Job, observer, desktop and fixture cleanup pass. Its 98 samples,
maximum gap 16 ms, likewise record zero focus/foreground/visibility/inventory failures.
These are bounded observations, not continuous or physical-keyboard proof.

Artifact `12480209227` contains 27 public-fixture files and expires at 2026-10-30
05:35:12 UTC. The retained ZIP digest is
`ca9a3250e94466e5c5ba3f09752ed87c6be9b2ca7e107fd12cfa26a439b32bc2`, matching GitHub.
Probe hashes, executable identity, exact candidate and local privacy scan pass.
The archive, extracted evidence, full log and terminal metadata remain ignored.
Independent Spec audit finds no material gap against this bounded capability claim.
The observer/renderer corrections remain independently reviewed with no open findings.

Both SDK launches are charged. Use after audit, reassessment and publication is local
96/106, Mac SDK 34/46, Windows SDK 14/24 and CI 9/9. Package/native use remains Mac
three/three and Windows one/one, against five/seven per target. No helper, observer,
CI run or watcher remains pending. Production files remain unchanged; cooperative
shutdown passes only in the Windows probe. The Mac prototype still has its earlier
forced-shutdown limitation. Whole-ticket, B07 and phase acceptance remain open.

#### Remaining implementation and proposed supplement

The approved three-dispatch supplement was consumed by one compiler-invocation
failure, one renderer/observation failure and the passing capability correction.
It did not reach the planned integrated qualification. The absolute CI ceiling is
now reached; no additional dispatch, rerun or new contingency is authorized.

The remaining implementation has concrete existing entry points:

- Promote the Mac process-local bootstrap guard into the approved build/package
  route, retaining fail-closed startup and existing signing identity/policy.
- Integrate Windows private-desktop lifetime and startup placement with owned process
  and job cleanup. Keep the native observation windows in qualification code.
- Select platform GPU backends, export frames at the required aspect and reject an
  unexpected software renderer in the production session's admission check.
- Add a helper-specific cooperative stop/acknowledgment and bounded normal-exit path
  before forced cleanup. Preserve general runtime descendant-cleanup behavior and
  require separate evidence that normal close/change/quit/restart did not need force.
- Exercise the existing service/lifecycle seams, startup refusal, source/draft
  preservation and affected package/native paths on both targets. Run the full
  portable suite once for the integrated candidate, then independent review and fixes.

Proposed, not approved: eight additional local batches, cumulative ceiling 114,
and two additional CI dispatches, cumulative ceiling 11. At current use this leaves
18 local batches and two dispatches. Basis: five batches for native/build/platform
integration, three for cooperative lifecycle handling, three for focused service/SDK
checks, two for package/native qualification, three for review and corrections, and
two for final audit/status. CI covers one integrated Windows qualification and one
bounded correction. No contingency is added to this supplement.

Existing remaining allowance is 12 Mac SDK launches, ten Windows SDK launches,
Mac two package/four native launches and Windows four package/six native launches.
The proposal does not increase those ceilings, change signing policy or reduce any
fidelity, hidden/focus, lifecycle or acceptance gate. It selects the same production
outcome and does not promise whole-#36 closure. Record the user's decision before
resuming beyond the reached ceiling; retain current totals if approval is deferred.

## Production GPU integration and lifecycle qualification, 2026-10-23

The user approved eight additional local batches and two CI dispatches after CI9.
Cumulative ceilings are now local 114 and CI 11. Mac SDK 46, Windows SDK 24,
package five per target and native seven per target remain unchanged. Historical
failures stay charged. The approval was recorded in #36 and verified by read-back
before implementation resumed at local batch 97.

### Implementation and review

The production helper now selects GL2 on Mac and ANGLE2 on Windows. It exports
through Ren'Py's model renderer and rejects software fallback. The early Mac
bootstrap applies the qualified SDLWindow ordering/activation guards through the
system Objective-C runtime. Windows embeds a small native owner, built with the
static C runtime, that creates the private desktop and launches the SDK inside
core's existing kill-on-close job. No additional SDK interpreter or distributed
runtime dependency is introduced. Both paths retain data-only requests, copied
assets, pinned SDK validation and the existing private directory ownership.

Project close, project change and application shutdown request a stop, then wait
up to three seconds for acknowledgment and natural exit. Normal completion requires
exit 0, drained pipes and an empty owned process tree; Windows also requires the
private desktop closure receipt. Existing bounded forced cleanup remains the
failure fallback. The host records cleanup, cooperative status and actual exit
separately. An early native refusal exits before Ren'Py's graphical error handler.

Independent Standards and Spec reviews found two qualification/build defects:
the standalone Windows owner initially inherited the compiler's dynamic runtime
linkage, and the Mac observer lacked a positive window-inventory control. The
owner now links its C runtime statically. Every Mac sample must include the known
visible editor window. Both review axes confirm these corrections with no remaining
findings. The Windows observer explicitly records that it does not observe native
activation events. Sampled foreground/window checks do not become physical keyboard
or native input-delivery evidence.

### Local service checks and original failures

SDK35 supplied the red test against the previous software backend. SDK36 passed
production GL2 rendering at 1280x720 and 1024x768 with source preservation and
cooperative project-close exit 0. SDK37–40 exercised close, reopen/project change
and application shutdown successfully, but the selected refusal case failed. Its
test-only profile selector used a path alias while core compared a canonical path,
so the fourth helper rendered normally instead of refusing. All four launches remain
charged. The selector now canonicalizes the test profile; the production environment
continues to scrub this test-only switch.

Portable checks cover platform-specific backend and shutdown receipt admission,
external observer refusal cases, ordinary Screens service tests, desktop compilation,
typechecking, workflow expressions and whitespace. The signed/native and Windows
production results must be recorded below before claiming this integration qualified.
No complete #36, matched fidelity, physical keyboard, native presentation timing or
smooth manipulation acceptance is implied.

SDK41–44 pass the corrected service sequence. Three normal shutdown reports have
`cleanupComplete=true`, `cooperative=true` and `exitCode=0`. The exact selected
startup refusal reports exit 72, complete cleanup and no cooperative-stop claim.
All generated helper directories are removed. This is lifecycle service evidence;
it does not replace external native observation of startup or failure.

The ordinary full renderer suite ran 227 tests. One validator failed because the
system Python 3.9 lacks `tomllib`; all other 226 passed. That exact producer/validator
case passes with the required Python 3.12.14. The initial broad core and desktop
runs were blocked by the command sandbox's local socket policy; their original
failures remain retained. The desktop rerun with controlled loopback access passes
all 38 tests. Core rerun results remain pending. No product change was made for
these environment failures. Three canvas evidence admission tests and the updated
Mac observer's strict compiler check pass.

SDK45 passes the exact production controller rehearsal in Chrome: two GL2 aspects,
provisional draft/Cancel, unchanged source until Apply, Undo/Redo, logical pixel
sizing and project close. Both injected pre-dispatch busy reads recover with exactly
one accepted source write. This is explicitly browser/controller evidence.

Signed Mac package4 passes strict certificate-backed signature and installer-content
verification with the unchanged approved pin. Executable SHA256 is
`2688310cf684496c414261c832325f2e0b412d916fbea670ca007bd57650fe16`; installer SHA256
is `57f884633c1037ec13e6d0ec757f3eeb038baad4c5b4350cb095bde385f85c52`.
The console is locked, so no native launch has been attempted. The user has been
asked to unlock it; SDK46 remains available for that check. Do not infer a native
pass from the service or Chrome results.

Local108 prepares scoped publication and Windows integration qualification. CI10
will select only canvas_helper, ordinal10, reserving four service SDK launches and
one packaged-helper launch, plus one Windows package/native attempt. CI use before
dispatch is9/11, actual WindowsSDK14/24; MacSDK45/46, Mac package/native4/3 and
Windows1/1. Local use is108/114. Broad core verification remains running at this
checkpoint. No unrun result or remaining acceptance criterion is marked passed.

### Signed Mac native result and CI10 handover

The final staged whitespace check removed one trailing blank line from the embedded
bootstrap. Package 5 was rebuilt from published production candidate
`7ad845c73447003e1278e180f10e800fb05ebc2b` so the native check uses the exact committed
source. This consumes the last Mac package build. Its strict signature and installer
contents pass with the unchanged approved identity. Rehashed executable SHA256 is
`213fc163d8a197b4e40febd72f3079747566f51fb89ece1b15dd4dd801077bdb`; installer SHA256
is `c3e8e298c0bf8a3f366c448d983262394d2173fc528b66be4170621772b61939`.

After the user unlocked the Mac, preflight confirmed an unlocked console and no
unrelated Loomlight process. Native 4/SDK 46 passes the real WKWebView controller
sequence with two GL2 frames, draft cancellation/focused field retention, source
Apply/Undo/Redo, logical sizing and project close. The helper acknowledges stop,
exits 0 without force and completes cleanup. App exit is 0, no timeout, all host/
request/credential cleanup owners pass, accepted disk bytes match, no source
bytecode/saves or helper/scratch jobs remain, and the owned fixture is removed.
A post-run process inventory finds no owned app, SDK helper or observer remaining.

The independent Mac observer reports 273 samples, 163 with the helper PID known,
maximum gap 27.60005 ms, and zero visible-helper samples, foreground changes,
activation events away from the editor or inventory failures. Every inventory
sample requires the known visible editor. The observer stops normally. This is
bounded OS observation of normal startup/render/close, not continuous observation,
physical keyboard delivery or native observation of every refusal/change/quit case.
Startup image-load measurement is 1,237 ms; warm presentation remains explicitly unproved.

The corrected broad core run passes 407 tests, with 47 named existing ignored gates
and the three documented broad-suite exclusions. Doc tests contain no cases.
The original sandbox run retains 376 passes and 31 socket/poisoned-fixture failures;
it remains failed. Desktop 38 passes, renderer 226 plus the corrected Python-validator
case pass, and repository validation covers 881 files. No specialist ignored case
or extra SDK operation was selected by these suites.

[CI10 run 39910668596](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39910668596),
attempt 1, tests exact candidate `7ad845c73447003e1278e180f10e800fb05ebc2b`.
Selection validation passes; only the Windows production canvas job is selected.
The run is pending audit. Reserve five Windows SDK launches, one package and one
native attempt. After local 109, actual use is local 109/114, CI 10/11, Mac SDK 46/46,
Windows SDK 14/24, Mac package/native 5/4 and Windows 1/1 against ceilings 5/7 per target.
The Mac SDK and package ceilings are exhausted. No automatic retry is authorized.
CI11 and five unreserved Windows SDK launches remain for an in-scope correction.
Whole-ticket, matched-fidelity, physical-keyboard and native presentation gates stay
open. Register ci-watch after publication and audit the exact terminal attempt.


### CI10 terminal audit and production integration result

Run [39910668596](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39910668596),
attempt 1 at `7ad845c73447003e1278e180f10e800fb05ebc2b`, completed successfully.
The same-chat watcher receipt is recorded. The exact GitHub run/attempt/SHA match;
HEAD differs from the tested candidate only in evidence/status documentation.
Selection validation and every required Windows production job step pass. The
unselected historical Help, owned-screen and capability jobs are skipped as intended.
No required failure or skipped step is counted as a pass.

Artifact `12483375952`, `canvas-helper-Windows-39910668596-1`, contains 17 files and
expires on 2026-10-30 at 06:29:51 UTC. The downloaded ZIP SHA256 matches both GitHub
metadata and the upload log:
`7dafb5a81d13bfda9ccfafaaea6bd802e3ff1e356faa513235a5e13499e172b7`.
Candidate and Windows x64 package identity match the tested SHA. The retained
runner receipt records executable SHA256
`7ac9036445e53a0e16cf5f473254a7ccd0059040ba9f6072fa175f1ae6a23612`.
The executable itself is not uploaded, so that hash is a fresh-build runner receipt,
not a locally rehashed binary. The privacy scan passes all 17 files. Exact archive,
job log, metadata and per-file hashes remain in the ignored integration directory.

The four Windows service SDK launches pass two ANGLE2 aspects, three cooperative
normal exits and the selected startup refusal. Close, reopen/project change and
application shutdown each report complete cleanup, cooperative stop and exit 0.
Refusal reports the exact selected reason, exit 72 and complete cleanup, without
claiming a cooperative stop. All generated helper fixtures are removed.

The fifth SDK launch runs through the packaged WebView. It passes draft cancellation,
focused-field retention, exact source Apply/Undo/Redo, both aspects, logical sizing
and project close. Helper shutdown is cooperative with exit 0; app exit is 0 without
timeout. Host/request/credential cleanup owners pass. Accepted disk bytes match the
public fixture, with no source bytecode/saves or remaining scratch/helper jobs.
The downloaded PNGs exactly match the frame data in the native report. Trusted local
admission code revalidates the retained service/native receipts and source bytes.

Windows external observation reports 1,163 samples, 587 with the helper identified,
a maximum gap of 16 ms, and zero visible-helper samples, foreground changes or
inventory failures. The observer stops normally. Activation events are explicitly
unobserved. The renderer is ANGLE2 on Microsoft Basic Render Driver, which does not
establish physical GPU acceleration. Startup image-load time is 3,378.8 ms; this is
not an accepted startup limit or warm-presentation result. Portable Windows checks
pass the three evidence-gate tests, 13 renderer tests, 16 ordinary Screens tests,
the selected recent-store regression, typecheck, builds and desktop check. The
ignored service test is then selected separately and passes all four SDK cases.

The production integration and graceful shutdown code is implemented with
both-target service and packaged normal-path evidence. The selected outcome remains
unfinished because native hidden/focus observation during refusal, project change,
application quit and restart is missing. The remaining acceptance also includes physical keyboard
delivery, continuous observation, matched fidelity, native presentation timing and
smooth manipulation. Service checks cover the lifecycle cases but do not substitute
for those native observations. No tolerance or requirement was weakened, and #36,
B07 and whole-phase acceptance remain open.

Five Windows SDK launches, one package and one native attempt are charged, leaving
no reservation pending. Final use after terminal review and publication is local
112/114, CI 10/11, Mac SDK 46/46, Windows SDK 19/24, Mac package/native 5/4 and
Windows package/native 2/2 against ceilings 5/7 per target. Historical failures remain
charged. No new SDK, package, native editor or CI operation ran during this audit.
Mac SDK/package ceilings are exhausted. Finishing the remaining native acceptance
on Mac needs an explicit SDK supplement; full #36 proof needs its own concrete
remaining-work selection and allowance. No PR, merge or release is selected.


### Remaining native lifecycle proposal, not approved

Independent terminal Spec review confirms the selected handoff includes hidden/focus
checks during startup refusal, project change, application quit and restart. These
are not optional whole-ticket extensions. CI10 supplies functional lifecycle results
but does not close that native acceptance gap. The implementation has no identified
code defect requiring another production correction; the missing work is explicit
native observation of those paths.

Prepare one focused native lifecycle sequence using the existing public fixture,
production helper/service and external observer. In the first editor launch, observe
selected startup refusal, restart the helper, change projects, render again and quit
through the application's shutdown path. In a second editor launch, reopen the owned
fixture, render and close. Retain separate normal/refusal, foreground/visibility,
application exit and process/desktop/fixture cleanup receipts. Four SDK launches per
target cover refusal, helper restart, project change and app restart. Two native editor
launches per target fit the existing native ceilings. A new Mac package is needed to
include the focused native probe; signing identity and production behavior stay fixed.
Run the same selected sequence in CI11 using the existing Windows headroom. This
proposal does not add matched-image, warm-timing or physical-keyboard campaigns.

| Unit | Requested addition | Proposed cumulative ceiling |
| --- | ---: | ---: |
| Local work/check batches | 6 | 120 |
| Mac SDK launches | 4 | 50 |
| Mac package builds | 1 | 6 |

All other ceilings stay unchanged. At final use 112, the two existing local batches
plus six requested batches cover probe/observer preparation, focused checks, review,
Mac package/native qualification, Windows dispatch/audit and publication/correction.
CI11 and four of the five remaining Windows SDK launches cover the counterpart.
The proposal creates no automatic contingency and all failures remain charged.
No further SDK/package/native/CI execution is started while approval is pending.

Status records remain above their soft word targets to preserve unrelated live
acceptance and protected native recovery. Only the L17 prefix was replaced; the
unrelated policy edits remain unstaged. No execution or watcher remains pending.

### Native lifecycle supplement approved and prepared

2026-10-23: The user approved the preceding proposal. Ceilings are now local 120,
Mac SDK 50 and Mac packages 6. All other ceilings remain unchanged: CI 11, Windows
SDK 24, Windows packages 5 and native launches 7 per target. The approval is saved
and read back exactly in #36. Starting use was local 112, CI 10, Mac SDK 46,
Windows SDK 19, Mac package/native 5/4 and Windows package/native 2/2.

The focused qualification runs refusal, helper restart/project change, quit and app
restart with four SDK attempts across two editor launches. Each has its own bounded
external observer. The quit cases keep the helper live, load the project through the
actual Recent Projects control, and invoke the existing application-close flow.
The probe observes its shutdown report, owner cleanup and actual application Exit
event. It does not replace the close guard or shutdown implementation. A synthetic
WebView field supplies the DOM focus control; this is not physical keyboard proof.
Windows uses the same selected sequence in CI11 without replaying CI10's SDK cases.

Receipt admission requires all four ordered cases, the selected refusal reason and
exit 72, three ready GL2/ANGLE2 frames with cooperative exit 0, both actual editor
exits, unchanged fixture source/assets, removed helper directories, and four accepted
OS observations. Launch counts are retained independently of successful receipts.
Failure cleanup verifies the exact fixture SDK executable and process group on Mac;
forced cleanup remains a failed qualification. Windows retains its production job
ownership. Fixtures, logs, packages and receipts remain outside tracked source.

Standards and Spec reviews found and corrected premature project-close substitution
for quit, Windows marker newline/canonical-path handling, separate Mac helper-group
cleanup and failure accounting. Both axes report no remaining findings. Portable
checks pass: core 407, desktop 38, renderer 227, four Python admission cases, types,
JavaScript syntax, Rust desktop check and workflow validation. The existing 47 ignored
core cases and three documented exclusions remain separate. Two initial desktop
runs failed because the command sandbox denied local test-server sockets; the same
38 cases pass with the required loopback access. The original failures are retained.
Python bytecode-cache permission failure was corrected by using an owned cache path.

Preparation and review use local batches 113–116. No additional SDK, package,
native or CI run is claimed by these checks. Mac package 6 is next, followed by the
approved native sequence once the desktop is unlocked. Native results and CI11 still
require audit. Matched fidelity, physical keyboard, native presentation timing and
smooth manipulation remain separate open #36 gates.

### Signed Mac package 6 and CI11 dispatch

2026-10-23: Reviewed candidate `580d5a46e47d0f140c1f033f8e7e4fe658fea5cc`
is published. Mac package 6 passes strict signature, designated requirement,
approved certificate and installer-content verification. The certificate remains
`358372708164C7273A551D746449357C12A3A806`. Executable SHA256 is
`6534b87074d37e313d17d5d1f722b625fdb22ac05b7ebf4d8704db405bc7b62c`;
installer SHA256 is
`f6c02a03be561378797fba47ec285c04d644356d44d36b918dcd49e00f179ef9`.
The ignored `package06` directory retains the exact bundle, installer, build log
and identity receipt. The final desktop hooks pass all 38 desktop tests. Repository
validation passes 886 files. Only unrelated policy edits remain outside the commit.

The Mac desktop is locked. An unlock request is pending; no Mac SDK or native editor
launch has started for this supplement. Continue with the exact package after the
user makes the desktop available. Verify unlocked console state and absence of a
conflicting Loomlight process before reserving/running the four-SDK/two-editor sequence.

The independent Windows counterpart proceeds within the existing allowance.
[CI11 run 39918738346](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39918738346),
attempt 1, reports the exact candidate above. It selects ordinal 11, one Windows
package, two native editor launches and four SDK attempts; CI10's SDK cases are not
replayed. Same-chat ci-watch registration follows. Terminal status, exact artifacts,
launch counts and all lifecycle/observer/cleanup receipts still require audit.

Cumulative use is local 117/120, CI 11/11, Mac SDK 46/50 and actual Windows SDK 19/24.
Mac package/native use is 6/4 against 6/7, Windows 2/2 against 5/7. CI11 reserves four
Windows SDK attempts, one package and two native launches. No further CI dispatch or
Mac package build is authorized. Three local batches remain for the Mac sequence,
terminal audit and final publication/correction. All failures remain charged.

### CI11 terminal audit; Mac native sequence awaits unlock

2026-10-23: Same-chat watcher delivery `fd2377386820bad459fd9ae8` is acknowledged.
[Run 39918738346](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39918738346),
attempt 1, succeeds at `580d5a46e47d0f140c1f033f8e7e4fe658fea5cc`.
The current branch differs only in status/evidence documentation, so this result still
applies. All steps in the selected Windows job and selection check succeed. Other
unselected jobs are skipped, not treated as passes.

Artifact `12485948843` contains nine files and expires 2026-10-30 at 07:44:43 UTC.
The downloaded ZIP SHA256 matches GitHub metadata and the upload log:
`d8790b138c09c8df5259de182dc785516525ac3e70237f306bc620f5992dabcb`.
The retained candidate and package receipt match the run. Windows x64 executable
SHA256 is `5587e263158599bb40746d156438138abcb8cf1c0ca2d46f969fba52b857eeea`.
The ignored integration directory retains the exact archive, terminal/artifact
metadata, job log, extracted receipts and `ci11-audit.json`.

| Native stage | Renderer/result | Shutdown | Samples with helper identified / all samples | Largest sample gap |
| --- | --- | --- | ---: | ---: |
| Refusal | Exact selected startup refusal | Exit 72; cleanup complete | 24 / 399 | 32 ms |
| Helper restart and project change | Ready ANGLE2 frame | Cooperative exit 0; cleanup complete | 138 / 388 | 16 ms |
| Application quit | Ready ANGLE2 frame | Cooperative exit 0; cleanup complete | 119 / 406 | 16 ms |
| Application restart | Ready ANGLE2 frame | Cooperative exit 0; cleanup complete | 120 / 393 | 46 ms |

All four external observers record zero visible helper samples, foreground changes
or inventory failures and stop normally. Four distinct helper PIDs corroborate the
four recorded SDK attempts. Two distinct editor PIDs exit with code 0 and actual
application Exit receipts. Source/assets remain unchanged; helpers, helper directories
and the owned fixture are removed. No fallback cleanup or qualification error is
reported. The two WebView teardown messages about unregistering `Chrome_WidgetWin_0`
(error 1412) are retained; both processes exit normally and all cleanup gates pass.
No product correction is inferred from those messages.

The same admission functions used by the runner pass again against the downloaded
receipts, with ordered stage/phase/launch cross-checks. The selected Windows portable
checks also pass, including four admission tests, the renderer suite selected by the
workflow, 16 screen core tests and the atomic recent-store test. The older SDK test
remains ignored and did not consume extra launches.

Independent terminal review finds no remaining concrete Windows acceptance gap.
The quit cases leave the helper live for the existing application-close callback and
ordinary project/runtime cleanup. Initiation is scripted. These are bounded native
window/foreground observations and DOM focus checks; Windows activation events,
physical keyboard delivery, continuous focus, physical GPU acceleration, matched
fidelity and presentation timing are not established. The Windows supplement passes
within those limits. The selected both-target outcome and #36 remain open.

The Mac desktop remains locked, with no competing Loomlight process observed. Its
approved package 6 is already verified; all four supplemental Mac SDK launches and
two editor launches remain unused. The pending unlock request is a capability need,
not a new approval request. After unlock, run the existing package's selected sequence
once and audit it. No new package build or CI dispatch is available.

Cumulative use after charging CI11 is local 118/120, CI 11/11, Mac SDK 46/50,
Windows SDK 23/24, Mac package/native 6/4 against 6/7, and Windows 3/4 against 5/7.
All CI11 reservations are charged. No run, watcher or process remains pending.
Two local batches remain for the Mac sequence and final audit/publication. Preserve
unrelated policy edits and the historical native recovery record.

### Both-target production integration and shutdown closeout

2026-10-23: After the user unlocked the Mac, the selected four-SDK/two-editor native
sequence passed once against the verified signed package 6. Production integration
candidate is `7ad845c73447003e1278e180f10e800fb05ebc2b`; final lifecycle qualification
candidate is `580d5a46e47d0f140c1f033f8e7e4fe658fea5cc`. Both targets tested the latter
candidate. Subsequent commits change documentation only. Package identity remains
as recorded above; the executable hash was checked again before and after execution.

| Mac native stage | Renderer/result | Shutdown | Samples with helper identified / all samples | Largest sample gap |
| --- | --- | --- | ---: | ---: |
| Refusal | Exact selected startup refusal | Exit 72; cleanup complete | 15 / 125 | 17.08 ms |
| Helper restart and project change | Ready GL2 frame | Cooperative exit 0; cleanup complete | 52 / 118 | 15.05 ms |
| Application quit | Ready GL2 frame | Cooperative exit 0; cleanup complete | 43 / 111 | 16.95 ms |
| Application restart | Ready GL2 frame | Cooperative exit 0; cleanup complete | 46 / 109 | 15.51 ms |

Mac SDK launches 47–50 and native editor launches 5–6 are charged. Four distinct
helper PIDs and two editor PIDs agree with the independent launch receipts. Both
editors exit 0 with actual application Exit events. All four observers stop normally;
463 samples record zero visible helper samples, foreground changes, activation
changes or inventory failures. The same structural admission and phase/launch checks
pass against the retained receipts. A separate process check confirms all six owned
processes are gone. Source/assets remain unchanged; helper directories and the owned
fixture are removed. There are no qualification errors or fallback cleanups.

The ignored `mac-native-lifecycle-05-06` directory retains both phase logs/receipts,
launch counts and all observations. `mac-lifecycle-audit.json` records the exact
package, process check and audit. The earlier CI11 snapshot correctly says the Mac
had not run at that checkpoint; this closeout and the Mac audit supersede that live
state without rewriting the historical evidence.

Independent Standards and Spec terminal reviews find no remaining concrete finding
for the selected production integration and graceful-shutdown scope. Combined with
CI10's audited production rendering, source/history, service lifecycle and packaged
project-close checks, CI11 and this Mac sequence complete the selected both-target
outcome. The production helper uses GL2 on Mac and ANGLE2 on Windows, suppresses its
native window/activation through the reviewed adapters, and stops cooperatively with
bounded process cleanup. Startup refusal, helper restart, project change, application
quit and app restart now have the selected native observations on both targets.

This closes the selected integration work, not all of #36. The native actions use
scripted UI initiation and a synthetic DOM focus control. Sampled windows/foreground
observations do not prove continuous focus; Windows activation events and physical
keyboard delivery remain unproved. Physical GPU acceleration, matched rendering
fidelity, native input-to-presentation timing, smooth manipulation and whole-ticket
acceptance remain separate. No tolerance, source-safety rule or signing policy changed.
No PR, merge or release is selected.

Final cumulative use is local 120/120, CI 11/11, Mac SDK 50/50 and Windows SDK 23/24.
Mac package/native use is 6/6 against ceilings 6/7; Windows is 3/4 against 5/7.
All reservations are charged. No process, fixture, run, watcher or requested capability
remains pending. The selected allowance is closed; unused discrete Windows/native
headroom does not authorize another execution after the local ceiling is exhausted.
Further #36 work needs a new selected outcome and an explicit finite allowance.
Unrelated policy edits and all historical recovery evidence remain preserved.


## Matched rendering comparison preparation, 2026-10-23

The user selected #36 through implement, starting with the matched Ren'Py rendering
comparison. Entry was `66c0790`. The prepared candidate is `340fcf2`, following
comparison implementation `27c83f6`. These commits are local. No push, CI dispatch,
PR, merge or release has occurred in this selection.

The new `canvas-matched-capture.mjs` uses the existing release controller and production
Screens dispatch for four accepted-source frames, one helper process, both internal
aspects and normal/hover samples. It records the source/font/image hashes and plans,
preserves those inputs, and requires driver exit zero and removal of its fixture.
The reference remains the explicit trusted frozen-preview SDK test. Its instrumentation
now hashes the same inputs and clears cached surfaces after changing sample appearance,
following the retained producer diagnosis. Helper diagnostics expose actual physical
window dimensions and drawable sampling ratio; rendering behavior is unchanged.

`compare-canvas-rendering.py` requires both capture results and cleanup, exactly four
unique samples, identical accepted inputs and source revision, renderer, physical
window size, drawable ratio and widget sizes. It checks centered frame placement,
compares decoded RGBA without resizing or tolerance, and requires distinct normal/hover
pixels. It retains counts, maximum channel difference, bounds, pixel digests,
difference images and full-scale side-by-side images. An admission failure or any
pixel difference exits unsuccessfully and retains the result. A difference requires
cause/scope analysis before any acceptance decision.

The dedicated `canvas-rendering.yml` prepares a 1920x1080 Windows desktop and reserves
one helper plus one reference SDK process. It has no package or native editor step.
The guarded first dispatch is cumulative ordinal 12 on the existing branch, against
an exact supplied candidate. It retains both compiler streams, produced binaries,
toolchain/hash identity, logs and images behind the privacy gate, including on failure.
The existing lifecycle workflow and its closed ordinal remain unchanged.

### Results and original failures

- Mac helper attempt 1 returned unavailable with no frame. Computer Use independently
  reported a locked desktop and failed automatic unlock. The helper log ends before
  display initialization; this does not isolate a renderer defect or distinguish every
  possible sandbox restriction. The controller exited zero and removed the fixture.
  The process attempt remains charged. The user was asked to unlock the Mac; no later
  SDK process has run. Resume native work outside the command sandbox after unlock.
- A read-only diagnostic compared retained signed-Mac `native04` normal-state frames
  against `reference-21`. Both 1280x720 and 1024x768 have zero differing RGBA pixels,
  maximum channel difference zero, and the same accepted-source hash
  `08201efc692198063ed9d66a814da99683643cfbdccd45189fd8736e3aed422b`.
  These old captures do not supply the new matched input manifests, hover samples or
  Windows evidence. They support proceeding, but do not pass the new comparison gate.
- Typechecking passes. The full renderer run reports 226 passes and one Python 3.9
  `tomllib` environment failure. The affected eight-test file passes with bundled
  Python. The ordinary broad core run reports 376 passes, 31 loopback permission
  failures, 47 ignored opt-in/specialist cases and three documented exclusions.
  All 38 tests in the affected `ai_request::` scope pass outside the sandbox,
  including the 31 failures. No product correction was needed for either environment.
- Synthetic comparator admission passes for equal pixels and rejects a wrong font,
  missing criteria, a duplicate state, wrong drawable ratio and one alpha-only pixel.
  These are six offline validator checks, not SDK or visual qualification.
- Node/Python syntax, actionlint and repository validation pass. An initial Python
  compile attempted the system cache outside the sandbox; the explicit temporary
  cache rerun passes. These failed environment attempts remain charged.

### Review and continuation

The implement skill's independent Standards and Spec reviews covered
`66c0790...27c83f6`. Standards identified missing binary retention; `340fcf2` corrects
it and follow-up review has no remaining blocking finding. Spec reports no new code
finding and retains the unexecuted both-target comparison and difference analysis.
Whole #36, physical keyboard, native presentation timing, smooth manipulation and
full supported-subset acceptance remain pending. No tolerance or weaker gate is adopted.

Ignored evidence is under `.toolchains/canvas-proof/matched-rendering-2026-10-23/`.
The new selection's original limits are 24 work/check batches, two CI dispatches and
six SDK launches per target; absolute ceilings are 36, three and nine. Basis and
selection are recorded in #36. Current use is 13 batches, zero CI, one Mac SDK and
zero Windows SDK. Historical integration use remains closed at local120/120, CI11/11,
MacSDK50/50 and WindowsSDK23/24. Overall historical plus new use is local133,
CI11, MacSDK51 and WindowsSDK23. No contingency has been used.

Remaining work is a fresh Mac four-sample comparison, authorized publication and
Windows dispatch/audit, then analysis and in-scope corrections for any differences.
The Mac unlock request remains pending. Publication is not selected by implement's
commit instruction; ask for the prepared branch push needed by CI. No process,
fixture, test run or CI watcher remains active at this checkpoint. Preserve unrelated
policy edits. This is prepared tooling with partial retained evidence, not completion.

### Mac matched comparison and dispatch correction

The user reported the Mac unlocked and directed continuation. This authorizes the
prepared branch publication and Windows qualification requested at the prior pause.
The three reviewed commits were pushed, with remote `ae48ef9011522261cd3b17999fee85b73bd370b8`
verified before execution continued.

Mac helper attempt2 and deliberate reference attempt1 pass at that candidate. All
four 1280x720/1024x768 normal/hover pairs have zero differing RGBA pixels and maximum
channel delta zero. The three source/font/image hashes agree, as do source revisions,
GL2 renderer, physical window dimensions, drawable/game ratio2 and widget sizes.
Frame placement is centered. Normal and hover images differ from one another on both
sides. The full-scale side-by-side capture was also inspected. No pixel tolerance,
resizing or color correction was applied. The reference test reports one pass;
all its runtime/source/context/geometry criteria and cleanup owners are true.
The helper driver exits zero and removes its fixture. This completes the bounded
Mac source-derived composition comparison, without native input/presentation or
full-subset acceptance.

Ignored `helper-02`, `reference-01` and `comparison-01` retain the manifests, original
PNGs, drawable references, geometry, exact differences and cleanup. Both executed
binaries are retained locally with hashes in `mac-binary-identity.json`. Driver hash
is `00c842bf9b7a7caf5f29519e11d2ce0a0a4249a5e42315cfa7998694d13c032b`;
core test binary hash is `6ebcb0cd620e9b7391eaa899f8257d473928263f992134c20d3f8855e1a8c067`.
The artifact privacy scan passes. Earlier type/core/renderer results are reused;
the continuation changes only CI routing and evidence.

Dispatch attempt12 was rejected with HTTP404 because `canvas-rendering.yml` was not
registered on the default branch. The request created no run, runner or SDK process;
its failed discovery file is retained. The attempt remains charged. The correction
adds `canvas_comparison` to the registered Screens workflow and calls the comparison
with `workflow_call`. Every older job excludes that selector; the comparison requires
selection validation. Only the caller holds the concurrency group. The relative
workflow reference uses the caller's commit under
[GitHub's documented reuse rules](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows).
Exact branch/candidate/attempt guards remain; the next dispatch ordinal is13.
Actionlint, whitespace and all16 selector combinations pass. Independent Standards
and Spec follow-up reviews report no findings. Windows execution and terminal
artifact audit remain pending. The rejected dispatch supplies no Windows evidence.


### CI13 pending matched Windows comparison

The corrected routing/evidence candidate `d1d3d991262cb088615908ac7dfc07a5f95c65d6`
was committed and pushed, and the remote SHA was verified. No renderer or capture
logic changed from the passing Mac candidate. [CI13 run39948440369](https://github.com/Caldwell-41/Renpy-editor/actions/runs/39948440369),
attempt1, confirms that exact SHA. Dispatch inputs select only `canvas_comparison`,
ordinal13, on `codex/phase3b-screen-designer`. Initial discovery reports queued at
2026-10-23 11:46:24 UTC. The run calls the reusable comparison from the same commit.
It reserves one production helper and one deliberate reference process, with no
package or native editor. Terminal result, binary/artifact identity, exact four-pair
pixel/geometry comparison and cleanup still require audit.

Current comparison use is local18/24, dispatch2/2, MacSDK3/6 and WindowsSDK0/6, with
two Windows attempts reserved. Absolute ceilings remain36,3,9. No contingency has
been used. Closed historical consumption stays unchanged; combined actual use is
local138, CI13 dispatch attempts, MacSDK53 and WindowsSDK23 before CI13 SDK execution.
Both local SDK attempts in this continuation are complete and cleaned. Retained
Mac evidence passes the 47-file privacy scan, including exact executed binaries.
No local process/fixture remains. CI13 is the sole pending execution.

Same-thread ci-watch registration follows the committed handover. Its ignored
registration receipt must confirm `watcher_running: true` before monitoring is
claimed. The watcher event must be acknowledged and matched to this run/attempt/SHA
before terminal audit. Keep #36 open; Mac image fidelity does not establish Windows,
physical keyboard, native presentation timing, smooth manipulation or full-subset
acceptance. Unrelated policy edits remain unstaged.

### Both-target matched rendering closeout

The selected matched-rendering comparison is complete. The watcher event was matched
to this thread, run 39948440369, attempt 1 and exact candidate
`d1d3d991262cb088615908ac7dfc07a5f95c65d6`, then acknowledged. CI13 completed successfully
at 2026-10-23 11:54:36 UTC. Only selector validation and the comparison job executed;
closed Help/L01/capability/lifecycle jobs were intentionally skipped.

The downloaded artifact 12500005536 contains 37 files. Its ZIP SHA256
`b40df28bf45a93a867420410f5b87b5294bfe1e68a62feda451160bbb67963b4` matches GitHub
metadata. It expires 2026-10-30 11:53:46 UTC; the exact archive and extracted copy
are retained locally. Safe extraction checks and the privacy scan pass. The artifact
candidate and binary manifest agree with the run. Both retained executables have
verified hashes and Windows x64 PE headers: core test
`64882ede8ff3fdec11e0fb9cc412f32a2dbe54b76eb2a5af5b2dd0d60d9e616f`, controller
`a696a5cb6728feed50ffec25e95d0564c3ba338be95c11dff3785abfff4594de`.
Pinned SDK checksum verification, types, 16 focused Screens tests and the one selected
reference SDK test pass. The sole ignored Screens test is the separately qualified,
opt-in four-launch lifecycle case; it is not missing comparison coverage.

| Target | Backend / drawable scale | 1280x720 normal / hover RGBA differences | 1024x768 normal / hover RGBA differences |
| --- | --- | --- | --- |
| Mac ARM64 | GL2 / 2 | 0 / 0 | 0 / 0 |
| Windows x64 | ANGLE2 / 1 | 0 / 0 | 0 / 0 |

All eight samples have maximum channel difference zero. The local Windows
recomparison exactly equals the retained CI report. The two hosts use identical
accepted source, font and image hashes. On each host, helper and reference agree
on source revision, control state, widget sizes, centered frame placement, physical
window dimensions and drawable sampling. Both reference cleanup records require
source preservation, no source bytecode/saves, scratch removal and project closure;
both helper controllers exit zero and remove their fixtures. Normal and hover differ
as expected. Matching pixels are per-target; Mac and Windows rasterization need not
be identical to one another. No tolerance, scaling normalization or source-color
adjustment was used.

The proof qualifies the source-derived fixed/frame/vbox/Text/image/textbutton graph
and literal properties in the retained plan. The frame is 640x360 with centered
alignment and 24-pixel padding; vbox spacing is 12. The project font at size 24 wraps
the literal text into a 331x87 rendered widget, within its 360-pixel width constraint.
The image is 64x48 and the padded button 143x45. Their composition and exact pixels
agree at both internal aspects. The earlier mapping table identifies engine classes
and source-byte geometry; no project action or expression enters helper rendering.

| Extension | Required continuation of this qualified baseline |
| --- | --- |
| L18 #46 | Extend the base composition and property cases; retain actual assets/fonts, text wrapping and both-target/two-aspect matched captures. This one fixture does not exhaust the supported property combinations. |
| L19 #50 | Qualify window/hbox/grid/viewport, clipping/layering, reusable components and shared invalidation with their own matched cases. None is accepted by this fixture. |
| L20 #54 | Qualify variable samples and remaining control states/actions. This comparison covers literal text and normal/hover textbutton appearance only; actions remain inert during editing. |

Independent terminal Standards and Spec audits find no remaining gap in this selected
comparison. Both reviewers inspected the retained identity/results and cleanup;
Spec confirms the Mac and Windows product/capture/comparator code is identical.
The intervening commit changes only workflow routing and documentation. Existing
native integration, zoom and editor-window resizing results are reused with their
original candidate/scope. This comparison is exported game-image/geometry proof,
not new physical keyboard, native presentation, smooth-gesture, full-subset or whole
#36 acceptance. No unresolved edge tolerance requires a user decision.

Final selected use is local 22/24, CI 2/2, Mac SDK 3/6 and Windows SDK 2/6. The failed locked
Mac attempt and rejected dispatch are included; no contingency was used. Absolute
ceilings remained 36,3,9. This completed comparison allowance is closed. Historical
integration use remains closed and unchanged; combined use is local 142, CI 13 dispatch
attempts, Mac SDK 53 and Windows SDK 25. No new package or native editor was launched.
No process, fixture, run or watcher remains pending. #36/B07/B08 remain open for
broader acceptance. Unrelated policy edits are preserved. No PR, merge or release
is selected.

### Native input and feedback preparation

The user selected physical keyboard, native presentation timing and smooth
manipulation for #36. Original allowance is local 24, CI 3 and, per target,
packages 3, editor launches 6 and SDK launches 12. The respective contingency
ceilings are 36, 4, 4, 9 and 18. This covers native measurement preparation,
focused corrections, both-target qualification and review. Earlier comparison and
integration allowances remain closed. Mac remains the development host; Windows
CI is used only where it supplies the required capability.

Candidate `10658bf7b75ae27a2779c01ac301245be1db979f` adds an opt-in `canvas-input`
qualification case and its exact controller rehearsal. Production editing behavior
is unchanged. The probe prepares the existing public Help composition, displays
plain stage instructions and waits for trusted input. Its eight steps cover width
drafting, Escape, Enter, keyboard activation of Undo, one-pixel keyboard resize and
movement, pointer movement and pointer resizing. Accepted results must match exact
source changes, fresh revisions and expected engine geometry. Undo restores the
original bytes. The packaged runner retains cleanup/source results and refuses
forced helper cleanup as success.

Six Mac controller/SDK rehearsals remain charged and retained. Attempt 1 exposed
an asynchronous Undo readback race. Attempt 2 used the wrong SourceDocument revision
field; the corrected check uses `baseRevision` and waits for matching fresh pixels.
Attempt 3 passed the initial functional sequence. Review required exact geometry,
minimal source changes, independent cleanup and truthful input classification.
Attempt 4 exposed the probe's incorrect integer placement expectation: the pinned
Ren'Py `displayable.place` retains x=319.5 for a centered 641-pixel frame. Correcting
that expectation made attempt 5 pass. Attempt 6 also moves the mouse after release;
the gesture oracle now considers only events between matching down/up events.
It passes all eight stages, and all three owner cleanup results pass. These are
Chrome/controller results, not packaged-native or presentation evidence.

Types and desktop compilation pass. The full renderer suite passes all 227 tests
with the required Python runtime; desktop tests pass all 38. Functional receipt
admission accepts the complete rehearsal and rejects untrusted events, forced
cleanup and invented native/presentation/smoothness claims. Repository validation
and whitespace pass. Standards and Spec reviews have no remaining preparation
finding after the corrections. No new production rendering behavior was changed.

Native preflight confirms an unlocked Mac console and no Loomlight process. The
shell measurement process lacks screen-capture, event-posting and Accessibility
permissions. Native CUA can inspect UI, but its delayed snapshots cannot establish
100 ms presentation. The user asked whether a physical pass would require less work.
A guided manual session can supply keyboard and subjective smoothness evidence;
precise warm p95 <=100 ms still requires independently timestamped inputs and
captured visible frames. No recorder or permission change has been approved or made.

The functional report keeps `inputKind=trusted-events`, `nativeInputQualified=false`,
`warmPresentationProof=false` and `perceivedSmoothnessProof=false`. An actual signed
package session needs its own identity, external native/human observations and
cleanup audit. A Mac pass supplies no Windows evidence. No native acceptance or
whole-ticket closure is claimed at preparation.

Signed Mac package 1 at `10658bf` passes the existing certificate-bound strict
signature and installer-content gates. Executable SHA256 is
`191637379e5feee9b49d809babaf2003249303884ee4f9ed7092fe1031ba7324`; installer SHA256
is `7fe451fb361871d7bb929d1b561ffca925817b0e1e6c8c105e5844ca21ce14f4`.
Both were rehashed. The ignored `Start native check.command` launcher verifies
identity/desktop/single-process preconditions and reserves one native/SDK attempt
only when the user runs it. Its syntax and root mapping pass inspection. It has
not been run. The eight-step banner is rehearsal-qualified; signed-native behavior
still needs the physical session and result audit. Preserve actual user observations
of focus, visible updates, stalls and gesture behavior as separate human evidence.

Preparation use is local 15/24, CI 0/3; Mac packages 1/3, native launches 0/6,
SDK launches 6/12; Windows use is zero. No contingency is used. This allowance
remains open for the selected outcome. No operation or watcher is pending.
Implementation is committed locally at `10658bf`; published baseline remains
`ccebf3e`. No separate recorder, permission change, Windows pass or timing acceptance
is claimed. Unrelated policy edits and protected recovery remain intact.

### Manual native attempts and transfer

The user ran manual-01, then requested a restart after closing the window. Attempt 1
ended at its first stage with editor exit 0, no terminal proof and unchanged source.
Its disk checks found no helper/scratch directories, bytecode or saves; fallback
cleanup was empty. It remains incomplete and charged.

Manual-02 used the same verified signed package and fresh fixture. The first four
stages pass: physical typing to width 760, Escape cancellation, Enter acceptance of
752, and keyboard activation of Undo. CUA observed the exact package's focused Width
field and step 3 banner; the user's subsequent input supplied the test actions.
At resize-arrow-right, the probe received the trusted key event and saved only
`xsize 640` to `xsize 641`. It then failed on `source.open: RUNTIME_BUSY` before its
accepted-frame check, so resize remains unqualified. Movement and drag/resize stages
were not reached. No subjective smoothness or numerical presentation pass is recorded.

Diagnosis is a harness defect. `canvas_input_probe.js` creates an Error containing
the code in its message but discards the structured `error.code` property.
`native_editor_probe.js` retries only `error.code === RUNTIME_BUSY`, so the existing
read-only retry cannot run. The next correction should preserve that code and
exercise a pre-dispatch busy source read in the existing controller rehearsal.
Do not replay a write or relax the busy deadline. No correction was made in this
session because the user requested result audit followed by handoff.

Attempt 2 exits 1 with no runner timeout. Credentials, host and request cleanup owners
all pass; disk has no helper/scratch directories, bytecode or saves. Fallback cleanup
is empty. The saved source differs only by the one-pixel resize. A process inventory
finds no Loomlight or Ren'Py process. Both original attempts and logs remain under
ignored `native-feedback-2026-10-23/manual-01` and `manual-02`.

Transfer use is local 19/24, CI 0/3; Mac packages 1/3, native launches 2/6 and SDK
launches 8/12; Windows use is zero. No contingency was used and the same allowance
remains open. No process/run/watcher remains pending. The user asked for a new-agent
handoff; this selects no additional run or capture permission. `10658bf` and `5abd92d`
remain local, with remote baseline `ccebf3e`. Preserve unrelated policy work.


### Busy-read correction and native continuation

Continuation from `ed33d4d` fixes the diagnosed harness defect in local commit
`ea09e2f`. The RPC wrapper now preserves the backend code on its Error, allowing
the existing bounded read-only retry to recognize `RUNTIME_BUSY`. Write dispatch,
retry deadlines, production rendering and qualification flags are unchanged.

The existing production-controller rehearsal injects one busy refusal before
dispatching the probe's source read at keyboard resize. Rehearsal 07 reproduces
the exact manual-02 failure after the first four stages pass. Rehearsal 08 with
the correction retries that read and passes all eight stages, including exact
accepted source, geometry and restoration. Both attempts pass all three cleanup
owners. Original failures and results remain in ignored native-feedback evidence.
These Chrome/controller results do not establish native input or presentation.

Typechecking and all 227 frontend tests pass. The first desktop run passes 24 and
fails 14 because the sandbox denies loopback binding; the original log is retained.
The same suite outside the sandbox passes all 38 tests. Repository validation
passes for 892 files and whitespace checks pass. Independent Standards and Spec
reviews of `ed33d4d...ea09e2f` find no correction defect. Only the two probe/test
files are in that commit; unrelated policy edits remain unstaged.

Signed Mac package 2 matches `ea09e2f`. Strict signature verification preserves
the approved certificate-bound identity, and the mounted installer contains the
verified app. Rehashed executable SHA256 is
`bd4c5eaa44393bc4c49b003b6b79bd9b4ecbec9574572f7f3345b39ad3744f5a`; installer SHA256
is `09fda6d00f7a47aac8aa4a33e20423bcba825b9c96fdc6877535495d46971273`.

The fresh ignored manual-03 launcher verifies package 2, requires an unlocked
console and no existing Loomlight process, and charges one native/SDK attempt
before launching. After the user confirmed availability, preflight passed and
the exact package opened with Width focused at 640. The user supplied all editing
input. CUA only inspected the window; its initial name-based inspection timed out,
and exact-package inspection observed step 1. Later inspection reported app exit.

Manual-03 passes the six keyboard stages, including the previously failing resize
and subsequent one-pixel movement with exact accepted-source/geometry checks.
The busy-error correction is therefore verified in the signed native package.
The run then fails at `drag-frame` with `Accepted source did not settle`, exit 1
after 107.252 seconds and no runner timeout. Resize dragging is not reached.

The user reports that the top-left drag target was unclear, dragging initially
seemed not to work, then the panel jumped and moved. They found the interaction
unintuitive. This is adverse usability/smoothness evidence, not a successful drag
check and not attributed to user error. The probe stayed at the drag stage while
several gestures occurred. Final retained source changes only `xalign 0.5` to
`xalign 0.725` and `yalign 0.5` to `yalign 0.7`; restoration was not reached.

Read-only diagnosis also finds a distinct harness mismatch. Production
`bindMovement` clamps alignment to 0..1; `gestureResult` predicts unbounded
movement. The first recorded down/up displacement, divided by the logged scale
262/640, would exceed both available movement ranges. This supports a boundary
expectation mismatch, but the report omits individual pointermove coordinates,
which supply the accepted draft. It cannot establish the exact first-gesture
expectation or explain the reported jump. Do not change production movement or
relax acceptance based on this report. A focused boundary rehearsal and separate
investigation of the native drag feedback are the next discriminating checks.
No second correction or native retry was made in this continuation.

All credential, host and request cleanup owners pass; fallback cleanup is empty.
Disk checks find no helper/scratch directories, bytecode or saves. Independent
process inventory finds no editor or Ren'Py process. All three manual attempts and
the original red/green rehearsals remain retained. No fixture, CI run or watcher
is pending. Numerical presentation and Windows proof remain unavailable.

Final continuation use is local 26/24, CI 0/3; Mac packages 2/3, native 3/6,
SDK 11/12; Windows zero. Entry into existing local contingency was reported before
batch 25. Absolute ceilings remain 36, 4, 4, 9, 18. No new allowance is created.
Only local batches have used contingency; future SDK use above 12 must report its
own entry before consumption. No recorder or capture permission change is selected.
Code is local only, published baseline remains `ccebf3e`, and #36 stays open.
CURRENT/HANDOVER retain historical acceptance and unrelated policy/recovery sections,
so their word counts remain above the soft targets; this continuation replaces only
the active #36 sections and stages no unrelated policy hunks.

### Probe movement bounds and drag diagnosis

The user selected correction of the probe's movement clamping and a separate drag
usability diagnosis on 2026-10-23. Local commit `19ea87b` changes only the input
probe and its controller rehearsal. Production movement/rendering are unchanged.
The existing native-feedback allowance continues; historical allowances stay closed.

The probe now clamps its snapped expected frame origin to x=0..640 and y=0..360,
matching the bounded 1280x720 Help fixture and its 640x360 frame. It retains the
pointer-down, last-move and pointer-up inputs, scale and expected geometry in the
failure report. This addresses the missing inputs in manual-03 without treating
that earlier native gesture as reconstructed.

All receipts below remain under ignored
`.toolchains/canvas-proof/native-feedback-2026-10-23/`.

| Attempt | Result and scope |
| --- | --- |
| Rehearsal 09 | Normal image delivery cancels the held boundary drag before oracle readback. The driver times out awaiting resize; the screenshot shows `Move cancelled. No source was written.` This is a separate interaction defect. |
| Rehearsal 10 | Hold helper image responses until pointer release to isolate clamping. The original oracle fails at `drag-frame` with `Accepted source did not settle`, after all six keyboard stages pass. |
| Rehearsal 11 | Corrected oracle passes all eight stages. A displacement of 608/328 game pixels clamps the origin to 640/360. Exact source, fresh geometry and Undo restoration pass. |
| Rehearsal 12 | Corrected oracle passes all eight stages. A displacement of -920/-500 clamps the origin to 0/0. Exact source, fresh geometry and Undo restoration pass. |
| Diagnosis 01 | The first diagnostic assertion expected the shifted frame to remain visible; cancellation had already restored it. Failed attempt retained. |
| Diagnosis 02 | Normal reattachment cancels; the browser-only intervention preserves capture. A diagnostic assertion incorrectly treats the previous cancellation message as a new cancellation. Its partial trace proves capture survives two image updates. Failed attempt retained. |
| Diagnosis 03 | Corrected event-based assertions pass both cases, retaining the hit map and full bounded traces. Normal reattachment loses capture; skipping existing-node reattachment preserves it until explicit Escape. |

The red/green command is `node tests/canvas-input-probe.browser.mjs` from `app`,
with the checkout toolchain, a fresh `LOOMLIGHT_CANVAS_EVIDENCE` directory and
`LOOMLIGHT_CANVAS_MOVE_BOUNDARY=max` or `min`. Upper-bound runs initially used the
same max path as the temporary default; the committed test restores ordinary
interior dragging and normal image delivery as the default. Only explicit boundary
mode holds image replies. Literal endpoint assertions independently check each
bound. These isolated tests do not qualify normal drag feedback or native input.

The retained `diagnose-drag.mjs` drives the same production UI/controller/helper.
It pauses the guided probe at the drag stage and compares normal DOM reattachment
with a browser-only suppression of reattaching existing selection targets. It
holds one image response for 100 ms to separate pointer input from image delivery.
That artificial delay is not a performance measurement. No diagnostic patch enters
production files. The first two versions and their failures remain retained.

The third diagnosis establishes these causes at the controller/browser layer:

- Movement updates only the draft coordinates immediately. The outline waits for
  `showFrame` to receive a helper image. With image delivery held, the pointer moves
  32/16 CSS pixels while the frame stays at 424/372. Delivery moves it to 456/388.
- `showFrame` calls `canvas.append(target)` for an already attached frame target.
  The browser drops its pointer capture, invoking `cancelMove`. The frame jumps
  back to 424/372 before the mouse is released. Suppressing that reattachment
  preserves capture through the next move and image update to 464/396. Escape
  then cancels deliberately. Final source alignment remains 0.5/0.5.
- Hit testing finds the frame inset draggable, visible text owned by a text target,
  and even the blank center owned by the vertical-group target. The latter two have
  no movement handler. All three use the same pointer cursor, with no distinct
  visible drag affordance. This supports the user's report of an unclear target.

These results explain reproducible reluctance and jumps in the production path.
They do not identify every event in manual-03 or qualify WKWebView presentation.
A production correction should preserve capture across image updates. Immediate
movement feedback and a clear frame drag target need Design Lab alternatives and
user approval under the standing visual-design instructions. No such design or
production change is selected by this diagnosis-only continuation.

Typechecking, all 13 focused Screens tests, 227 frontend tests, 38 desktop tests
and three canvas evidence-admission tests pass. The first full frontend run is
retained as 226/227: the inherited Python lacks `tomllib`. The supported Python
rerun passes all 227 without a code change. Both independent Standards and Spec
reviews of `fe9df78...19ea87b` report zero findings. JavaScript syntax and whitespace
checks pass. Every rehearsal/diagnostic passes all three cleanup owners, including
failed attempts; process inspection finds no remaining editor/helper/driver.

Final continuation use is local 33/24 (ceiling 36), CI 0/3 (ceiling 4); Mac
packages 2/3, native launches 3/6 and SDK launches 18/12 (ceiling 18); Windows zero.
Local contingency was already active; SDK contingency was announced before attempt
13. SDK allowance is exhausted. Three local batches remain within the original
ceiling. No new package, native launch or CI dispatch ran in this continuation.
No process, fixture or watcher remains pending. Code and detailed evidence are
local only; publication remains `ccebf3e`. #36 stays open for production drag fixes,
native drag/resize acceptance, numerical presentation and Windows proof. Further
SDK execution requires an explicit supplement. Unrelated policy edits and protected
recovery remain untouched. CURRENT/HANDOVER still exceed their soft size targets
because they retain separate pending acceptance and protected recovery records.

Automatic approval review initially rejected publication of the prepared #36 body
without explicit payload/destination permission. The user then explicitly approved
publishing that prepared update to GitHub #36. A fresh read found no intervening
issue edits; publication succeeded and readback matches the prepared body exactly.
The issue remains open. Ignored `issue36-published-clamp-closeout.json` retains the
receipt. This completes deferred publication in batch 33; counts are unchanged.
Repository code/evidence remain local, and unrelated edits are preserved.

### Capture preservation and drag alternatives, 2026-10-24

The user selected continuation from the drag diagnosis with the implement skill
and explicitly approved an SDK allowance of any size. #36 records the published,
exact-readback-verified supplement: 12 additional SDK launches per target plus 6
contingency, raising the cumulative SDK ceiling from 18 to 36 per target. The local
supplement is 12 batches plus 6 contingency, raising its ceiling from 36 to 54.
This adds a finite allowance to the same problem; original use remains charged.
CI, package and editor-launch limits are unchanged. Basis is the capture correction,
reviewed interaction alternatives and bounded verification/correction capacity.

Candidate `5df62d3` preserves an attached selection target in `showFrame` rather
than appending it again. Geometry and image updates continue normally. This avoids
the demonstrated browser capture loss without changing drag-target selection or
movement-feedback design. Production interaction changes beyond this correction
still require the Design Lab decision.

The existing `screen-position.browser.mjs` controller test now holds a frame drag
across image delivery and further movement. It asserts retained pointer capture,
no held-gesture source write, Escape restoration, one accepted position write,
exact Source, Undo/Redo and keyboard movement. It uses the existing fixed image and
real controller/transactions, not SDK rendering evidence. A configurable ignored
output directory keeps each attempt. The test blocks HMR so source changes in the
development checkout cannot reload its document during a gesture.

Retained receipts are under `.toolchains/canvas-proof/native-feedback-2026-10-23/`:

| Attempt | Result |
| --- | --- |
| `capture-red` | Original code fails the capture assertion. The first assertion also attached its pointer-ID listener to an initial target later replaced during initial rendering, so this first failure alone is insufficient proof. |
| `capture-green`, `capture-inspect` | First corrected-code check still fails the flawed observation; the diagnostic trace records actual capture true and the element-local pointer ID absent. Types and all 13 Screens tests pass separately. |
| `capture-red-verified` | Document-level pointer-ID observation rejects the original production code with the same capture assertion. |
| `capture-green-verified`, `capture-inspect-2` | Failed checks while source edits and Vite HMR remained possible; retained as failures. The second trace records capture false without establishing another production cause. |
| `capture-inspect-3`, `capture-final` | HMR isolated. Corrected production code passes the entire controller test, including held capture and exact source/history checks. Temporary tracing is removed from the final test. |
| `capture-sdk-19` | One charged real SDK/controller rehearsal with normal image delivery passes all eight input stages, source/geometry readback and restoration. All three cleanup owners pass. This is Chrome/controller evidence, not native presentation or subjective smoothness acceptance. |

The new [canvas-drag Design Lab comparison](../../design/design-lab-canvas-drag/README.md)
contains three unapproved choices: labelled move handle, draggable border, and whole
selected-frame dragging with double-click child selection. Each shows an immediate
draft guide and delayed fictional content. All operations remain in memory. The
notes disclose fixed-corner sample resizing, approximate child hit testing and the
absence of real helper timing. The approved flow-v1 source and approval records are
unchanged.

The first focused lab run failed compact overflow. Setting the canvas grid column's
minimum width to zero fixes it; the second run passes 24 variant/state/theme/size
cases and the interaction checks. Wide/compact dark captures were visually inspected.
Types and all 227 frontend tests pass with the supported Python runtime. No Rust or
native-probe code changed, so the previous scoped desktop evidence is retained; no
new desktop-suite or package result is claimed.

Independent review of `5551ea2...5df62d3` found no Spec issue and one minor Standards
issue: experimental editor chrome used independent colours. The correction uses
production editor tokens while retaining separate fictional game colours. Both
reviewers cleared the production capture correction.

The full `design:check` passes approval-history validation but fails when opening the
existing approved flow-v1 preview from the changed checkout. Its pinned source is
`3c7ea31`; the refusal is intentional protection, not a new approval or a full-suite
pass. Retained `drag-lab-full-report.json` and `drag-lab-full.log` own that failure.
The scoped draft matrix remains separate. The final production graph exclusion
check runs the existing in-memory Vite-build assertion independently because the
full runner stopped before reaching it; it does not write `dist`.

The palette recheck exposed an initial preview drag failure before the outline
moved. Initial Fit sizing previously waited for ResizeObserver. The sample now
sets its initial scale synchronously and retains the observer for later resizing.
The failed `drag-lab-palette.log` remains evidence; later scoped checks determine
the corrected sample's result. This changes only the draft, not production geometry.

Final draft candidate is `e9b5fc1`; production capture code remains the tested
`5df62d3` implementation. The final scoped lab run passes all 24 cases and interactions,
TypeScript and the independent production-build exclusion assertion. The revised
wide dark preview was inspected. Standards and Spec reviewers rechecked the
corrections with zero remaining findings. The full lab check remains incomplete at
the existing approved-source refusal; no gate or approval record was weakened.

Final use for this continuation is local 42/54, CI 0/4; Mac packages 2/4,
native editor launches 3/9, SDK launches 19/36; Windows use is zero. Denominators
are absolute ceilings. Supplement contingency begins above local batch 48 or SDK launch 30 per
target, not by resetting historical use. Batches 34-42 cover entry/allowance,
controller red/green and diagnostic corrections, SDK19, draft creation/checks,
review/fixes and final records. No package, native editor or CI operation ran.
Process inspection finds no remaining helper/controller/editor process. The owned
Design Lab server remains on port 5174 so the user can review the choices. No watcher
or external run is pending. Code and evidence remain local; no push was selected.
Unrelated policy edits are preserved. #36 remains open, awaiting the user's design
choice before production feedback/target integration and later native qualification.


### Move-handle prototype refinement, 2026-10-24

The user selected the move-handle direction, agreed to Experience First refinements
and requested an updated prototype before integration. Draft `handle-v2` adds a
four-direction icon using the shared icon factory/stroke style, a 30-CSS-pixel handle
at Fit/50%/100% zoom, edge clamping and immediate provisional panel translation.
Child hit targets follow the visible panel. Release keeps focus and position while
simulated confirmation arrives; Escape and one-entry gesture Undo remain intact.
Resize layout still uses the separate delayed sample behavior. No production code
or rendering helper changed. The earlier draft remains recoverable at `e9b5fc1`.

Types, approval-record validation and all 24 scoped lab matrix cases/interactions
pass. Checks cover panel/outline agreement during a held drag, stable placement after
confirmation, retained focus, constant handle dimensions at each zoom and reachable
top-left bounds. Wide and compact dark captures were visually inspected. The existing
full-lab approved-source limitation remains; no full-suite or native pass is claimed.
The already-running server on port 5174 serves the update; a redundant start refused
the occupied port without affecting it. Logs are `handle-refinement-*.log` in the
existing ignored native-feedback evidence directory.

Batches 43-45 cover prototype edits, focused checks and review records. Cumulative
use is local 45/54, CI 0/4; Mac packages 2/4, native launches 3/9, SDK 19/36; Windows
zero. These are absolute ceilings. No SDK/package/native/CI operation ran. The next
action is user review of the refined prototype, before formal promotion/integration.


### Move-handle approval and integration handoff, 2026-10-24

The user explicitly approved the refined prototype and requested a handoff for
another agent to integrate it and continue #36. The approval record in
`docs/design/design-lab-canvas-drag/approval.json` pins `handle-v2` at source
`6e7bb1aa053de327737cfbb1a8ec5f87f67ca361`, its verified fingerprint and four hashed
wide/compact dark captures for ready/delayed states. The record owns agreed
behavior and sample limitations. The prior flow-v1 approval is unchanged.
Approval-history/hash/source validation passes. The full lab's existing flow-v1
source mismatch remains as recorded above; unchanged source inputs do not justify
repeating that known failure. The selected approved preview is checked separately.

The prepared prototype result note was explicitly approved for publication by the
user, published to #36, and its body read back exactly at
https://github.com/Caldwell-41/Renpy-editor/issues/36#issuecomment-6374816031.
That comment predates this design approval; no later issue publication was selected.
The live repository handover and approval record carry the newer decision.

Batches 46-47 cover source/capture approval, scoped checks and the temporary handoff.
Cumulative use is local 47/54, CI 0/4; Mac packages 2/4, native launches 3/9,
SDK 19/36; Windows zero. Counts use absolute ceilings and retain all earlier use.
One nominal local batch and six contingency batches remain. No SDK, package,
native launch, production edit, push or CI operation was performed for this handoff.
The preview server remains available on port 5174. Unrelated policy edits remain
unstaged and protected recovery is unchanged. Integration is the next selected work.


### Approved move-handle integration, 2026-10-24

The user selected integration from the approved handoff. Baseline is `187251b`;
implementation candidate is `14ef7d3`, with the final icon-spacing and controller-test
correction at `8527998`. All work remains on `codex/phase3b-screen-designer` locally.
The `handle-v2` approval and the separate flow-v1 layout authority remain unchanged.

| Approved action | Production operation and evidence |
| --- | --- |
| Move icon and labelled handle | Selected aligned frame exposes one 30 CSS-pixel control. Fit/100%, wide/compact and canvas-bound checks cover its sizing and reachability. |
| Immediate panel and child feedback | The last complete Ren'Py image follows provisional alignment for the isolated Help subtree; descendant hit targets follow the same delta. Delayed controller delivery checks this before any helper response or source write. |
| Settled release and focus | Existing handle stays attached through acceptance and matching image delivery. Controller checks retained focus and one accepted `screens.setPosition` write. |
| Child selection and keyboard | Canvas clicks select children. Arrow/Shift movement uses existing game-pixel alignment; Escape/Cancel retains unchanged Source. |
| Shared history and resize | Controller checks exact Source and Undo/Redo. SDK 21 passes the real helper's anchor-aware resize and movement stages; no artificial delay or fixed-corner sample resizing enters production. |

The composite image can translate only when the selected subtree owns all painted
content and its measured bounds were inside the game image. Sibling content or
clipped bounds use explicitly labelled provisional guides while Ren'Py renders the
panel. This conservative limit avoids translating unrelated content or inventing
missing pixels. The existing helper remains the rendering authority. Its failures
clear provisional geometry and preserve unfinished drafts. The architecture owner
records this behavior; full-subset rendering remains outside this slice.

Visual comparison uses a separate reference checkout at `6e7bb1a`, with the current
approval JSON and retained captures copied into it. `design:source` reproduces the
approved fingerprint `6a92dede7c75b6ad4788cc42d44fef911114ec5730cb18eea6db6accab06a75c`.
The ready dark reference runs at 1100x720 and 560x640. Actual-helper captures at those
viewport sizes confirm the icon, label, amber control and constant 30-pixel height.
Comparison caught a 12-pixel icon-margin difference; production now retains the
reference spacing. Production uses the existing editor layout, focus outline and
actual public Help content. The reference has fictional HTML content, so this is
control fidelity evidence, not a pixel-equality claim for the whole editor or panel.
The earlier full-lab flow-v1 source-lock failure remains incomplete; its lock was
not changed or rerun. The pinned `handle-v2` reference remains reproducible.

Verification and attempts:

- TDD used the already agreed Screens UI/controller boundary. The initial red
  check found the absent handle. An exact floating-point CSS string assertion was
  corrected to compare the independently expected 64x40 displacement numerically.
  A sibling-content check then caught overwritten provisional-status text; the
  implementation preserves that status. All 14 focused Screens tests pass.
- The real controller with a fixture image passes delayed delivery, continued
  capture, immediate frame/child movement, release focus, cancellation, one write,
  exact Source and Undo/Redo. The additional child/no-op/bounds run retains its
  first premature child-selection assertion. Waiting for the Text heading and removal
  of the move handle corrects that observation; child selection, no-op and both bounds
  then pass without a product logic change.
- Typechecking and the full frontend suite pass, 228/228 with the supported Python.
  No full core/package matrix was selected for this renderer/probe-only change.
- Reserved SDK 20 stopped during build before fixture creation because the shell
  inherited the global Rust environment. Rustup auto-installed 1.90.0 and Cargo
  populated its global cache. The build was stopped; the reservation stays charged.
  SDK 21 uses the existing repository environment and passes all eight exact
  controller/native-probe input stages with real helper rendering. Its drag ends
  at (360,204), size 640x360; resize ends at (296,164), size 688x392. Source restoration
  and all three cleanup owners pass. This is Chrome/controller evidence, not native
  WebView, physical-input, numerical presentation or human smoothness evidence.
- Independent read-only Standards and Spec reviews of `187251b...14ef7d3` each
  report zero actionable findings. Both follow-up reviews of the spacing, controller checks and records also report
  no material findings. The Standards follow-up requested prose spacing corrections;
  those are included.

Ignored receipts, captures and original failures remain under
`.toolchains/canvas-proof/native-feedback-2026-10-23/` in `handle-position-controller`,
`handle-position-bounds`, `handle-position-bounds-02`, `handle-reference` and
`handle-sdk-21`, plus `handle-frontend-tests.log`. The reference checkout is
`.toolchains/canvas-handle-reference`. Preserve prior native receipts and never
replay a one-use native launcher.

Batches 48-54 cover entry, implementation, verification, real-helper rehearsal,
independent reviews, scoped corrections and final validation/commits. The production
build and repository validation pass; Vite retains its existing large-chunk warning. Contingency entry was announced before
batch 49; no allowance resets. The local ceiling is reached.
Final use is local 54/54, CI 0/4; Mac packages 2/4, native 3/9, SDK 21/36; Windows zero.
The integration does not close #36. Native manipulation, independent warm p95 <=100 ms
presentation, Windows and whole-ticket acceptance remain pending. No recorder or
permission change, package/native launch, push, PR, merge or release was performed.

No helper, controller, editor or watcher remains pending. The temporary reference
server on 5175 is stopped; the earlier preview on 5174 remains. CURRENT/HANDOVER
exceed their soft size targets because they retain separate pending phase acceptance
and protected native recovery. This update replaces only their active L17 sections.
Further local implementation or native qualification needs an explicit supplement;
unused SDK/native/package counts do not renew the local-batch ceiling. Repository
publication remains `ccebf3e`. No issue update was published in this session.


### Handle qualification continuation allowance, 2026-10-24

After integration through `8527998` and its record commit `d3f0a78`, the user
instructed the agent to decide an allowance and proceed. The new supplement is
16 local work batches plus 8 contingency, added to the previous ceiling of 54.
The nominal cumulative bound is 70 and the absolute ceiling is 78. Basis is native
capability inspection, a matching signed Mac build, qualification, focused
corrections, independent review and evidence. Announce contingency before batch 71.
Existing absolute ceilings remain CI 4 and, per target, packages 4, editor launches
9 and SDK launches 36. No historical attempt is removed or renumbered.
Entry use is local 55, CI 0; Mac packages 2, native 3, SDK 21; Windows zero.
The existing signing identity, protected recovery and publication boundaries remain.


### Signed Mac handle qualification, 2026-10-24

Package 3 builds the integrated candidate at `d3f0a78`; its last product change is
`8527998`. The build used `enter-macos.sh` and the existing approved signing identity.
Strict signature and installer-content verification pass. The executable SHA-256 is
`59f864030e13d4bb1d8a4a79f1f1b9c73490e268f861e32e7180103ff8f9fe77`; the DMG SHA-256 is
`fc267ef1ce73b5567988b270db4d2c386d6e473396463783b40dc8640adbd9af`.
Package 3 and native attempts 4-5 use unchanged product and probe code.

The existing native-control tool could inspect the unlocked Mac app and deliver
keyboard input without new permissions. Native attempts 4 and 5, SDK attempts 22
and 23, each pass the six keyboard stages: draft width, Escape, Enter acceptance,
keyboard Undo, arrow resize and arrow movement. The controller retains focus and
checks exact source and helper geometry at those stages. The OS-delivered automated
input does not establish physical-human input or perceived smoothness.

Both runs fail at `drag-frame` with `Drag path missing`. Attempt 4 sends a 20x12
CSS-pixel displacement in 71 ms; attempt 5 tests a 100x60 displacement but completes
in 28 ms. Neither supplies the required three trusted movement events at that stage.
The larger-displacement retry therefore does not resolve the input-driver limitation.
The source records movement in each disposable fixture, but neither drag is admitted;
resize dragging is not reached. Classify this as missing gesture evidence with a
native-driver limitation, not an established product defect. The test threshold and
production code remain unchanged.

Both failed attempts exit with code 1, retain their original receipts and accepted
source, and report all three cleanup owners complete. No fallback kill, scratch job,
canvas job, source bytecode or source saves remain. Their disposable source is not
restored to the original because the probe exits at the failed drag assertion.
Evidence remains under `native-cua-04` and `native-cua-05` alongside `package-03` in
`.toolchains/canvas-proof/native-feedback-2026-10-23/`.

The one-use `start-manual-check-06.py` verifies the same executable hash, strict
signature, unchanged runner, unlocked console and absence of an existing editor.
The user confirmed availability for the physical-input run. It reserves native
attempt 6, SDK 24 and local batch 60 before starting the disposable fixture. Its
on-screen sequence requests steady physical drag/resize input. No recorder or
permission change is included; numerical presentation remains a separate gate.


Manual 6 passes the six physical keyboard stages, then fails exact source admission
on its first drag. The retained gesture moves about 282.74x152.43 game pixels,
which snaps to (600,332). Expected `yalign` is `0.9222222222222223`; the saved literal
is `0.9222222222222224`. The user makes further gestures while the stage waits, but
the final source still records the first drag. The probe never reaches resize.
All cleanup owners pass, with no fallback or leftover jobs/saves/bytecode. Original
receipts, gesture and accepted source remain in `manual-06`.

SDK 25 reproduces the source mismatch with a controlled 280x152 drag. A standalone
check linked to the existing serde_json library parses the expected decimal into
the observed final-bit value, isolating a probe-oracle defect. The correction allows
at most two machine epsilons in only the two alignment literals. Every other source
byte remains exact; unit cases reject a one-game-pixel alignment error and changes
to dimensions, comments, whitespace, literal type or line count. SDK 26 then exposes
the same bit in helper geometry, (600,332.00000000000006). The probe now requires exact
geometry agreement with the admitted saved-source alignment, while retaining the
independent snapped-input calculation. Source restoration remains byte-exact. This
numeric check is not a pixel-comparison tolerance or a relaxation of rendering fidelity.
No product logic, dependencies or signing policy changes are needed.


SDK 27 fails before its oracle because a new local `document` binding shadows the
browser document; the corrected name is `savedDocument`. SDK 28 then passes all
eight stages, including the (600,332) snapped move, 688x392 resize, exact saved-source
geometry, byte-exact restoration and all three cleanup owners. Every failed receipt
is retained. The allowance charges SDK attempts 25-28. Typechecking, all five native
probe-helper tests and the full frontend suite pass, 229/229. Independent Standards
and Spec reviews of `d3f0a78...68f95c3` report zero actionable findings. The Spec
review clarifies that the numeric bound is the absolute value `2 * Number.EPSILON`,
not one ULP at every possible alignment. The committed correction affects probes
and tests only. The approved handle's product code remains at `8527998`.


Package 4 contains the probe correction `68f95c3` and passes strict signature and
installer-content verification with the existing identity. Executable SHA-256 is
`7cac273f852f71520238e9a3b9ae8d76548b48913716b92513216c7d12cfabef`; DMG SHA-256 is
`837af62bb2c95b26d1ed0e7056258b0f456fde95b013de7f5d39cd3d256091ce`. Both hashes are
rechecked before preparing manual 7. Its one-use launcher is ready but unlaunched;
it will charge native 7, SDK 29 and one local batch only on physical-user readiness.
The earlier native input records do not qualify the corrected packaged probe.
Current use is local 64/70, absolute ceiling 78; CI 0/4; Mac packages 4/4, native 6/9,
SDK 28/36; Windows zero. No operation remains pending. Numerical presentation and
Windows continuous-input observation still lack a selected capable capture route.
No recorder/permission change or remote publication was performed.


The final scoped evidence review reports no Standards finding. Its one Spec wording
correction narrows the unchanged-code statement to package 3/native attempts 4-5;
the later probe correction remains explicit. Repository validation passes for 905
files and whitespace checks pass. No Loomlight or Ren'Py process remains. CURRENT and
HANDOVER retain separate outstanding phase acceptance and protected recovery despite
their soft size limits. Manual 7 remains ready for the user's availability; no new
launch is charged while waiting. All work and records in this continuation remain local.


### Manual 7 physical-input pass, 2026-10-24

The user reports that manual 6's first move-handle drag followed smoothly and confirms
availability for the corrected retry. Manual 7 uses signed package 4 at `68f95c3`,
with unchanged product code at `8527998`. Its one-use launcher rechecks the executable
hash, strict signature, runner hash, unlocked console and absence of another editor.
It charges native attempt 7, SDK 29 and local batch 65 before launch. The agent sends
no UI input during this run; the user performs the eight guided physical-input stages.

All eight stages pass: draft width 760 without source writes, Escape restoration,
Enter acceptance at width 752, keyboard Undo, one-pixel arrow resize and movement,
move-handle dragging and anchor-aware resizing. The move records 122 pointer moves
and snaps to (592,324), size 640x360. The resize records 47 pointer moves and accepts
816x512 at (232,104). Source admission preserves every other byte and checks the
bounded alignment roundoff described above. Helper geometry agrees exactly with
the admitted source. Each gesture is undone; final source matches the original bytes.

The renderer admission check passes. The editor exits with code 0 after 121.482
seconds, including user preparation time. The helper reports cooperative shutdown
with code 0. Credentials, host and request cleanup owners all pass. No fallback kill,
remaining scratch/canvas jobs, source bytecode or source saves are recorded. A terminal
process check finds no Loomlight or Ren'Py process. Receipts, restored source and the
separate native-route audit remain in `manual-07` under the existing ignored evidence
root. The executable hash still matches package 4's recorded identity.

The raw renderer report correctly retains `nativeInputQualified: false`,
`warmPresentationProof: false` and `perceivedSmoothnessProof: false`. The independent
`external-audit.json` records the signed native app, explicit user readiness and
physical-input route, which establish this bounded Mac functional pass. They do not
measure presentation latency or replace the user's visual judgement. The manual 6
smoothness report applies to movement only; feedback for the retry's movement and
resizing is requested separately. Windows manipulation and numerical presentation
remain pending, as does whole-ticket acceptance. No recorder or permissions changed.

Batch 66 covers the terminal audit, user observation, evidence and recovery update,
focused validation and local commit. Cumulative use is local 66/70 with absolute
ceiling 78; CI 0/4; Mac packages 4/4, native 7/9, SDK 29/36; Windows zero. Contingency
remains unused in this supplement. No operation or watcher remains pending. The
manual 7 launcher is consumed and must not be replayed. No remote publication occurs.

Repository validation passes for 905 files, and scoped whitespace checks pass. No
product or test code changed during this physical-input retry, so the earlier 229-test
result remains applicable without repeating the frontend suite. Unrelated policy
edits and protected recovery remain outside this commit.


### Continuation handoff allowance, 2026-10-24

After the manual 7 pass at `cf18e8d`, the user requested a new-agent handoff and
explicitly added 10 to the allowance. This adds 10 local work batches: nominal
cumulative bound 80, absolute ceiling 88, with the existing 8 contingency batches
unchanged. Announce contingency before batch 81. No new contingency is calculated.
The handoff and recovery update consume batch 67, leaving 13 nominal batches and
8 contingency batches. Expensive-operation ceilings remain unchanged: CI 4 and,
per target, packages 4, native launches 9 and SDK launches 36. Current use is CI 0;
Mac packages 4, native 7, SDK 29; Windows zero. No further Mac package is allocated.

This transfer retains the selected #36 scope, physical Mac functional pass, original
failures and publication/permission boundaries. Manual 7's visual smoothness question
has no answer yet; the earlier manual 6 move was reported smooth. No new runtime
operation or external publication occurs. The temporary handoff points to these
canonical records; it does not replace them or renew historical closed allowances.

### Presentation capability and proposed run, 2026-10-24

Continuation starts at `31e9e18` on the existing branch. Live #36, B07 and P3B were
read through `gh`; no tracker content was changed. Manual 7's external audit and
disk receipt remain intact. Package 4's executable rehash matches
`7cac273f852f71520238e9a3b9ae8d76548b48913716b92513216c7d12cfabef`.
Product code remains `8527998`, with probe correction `68f95c3`. Neither completed
matched rendering nor Mac functional input needs another run for this continuation.

Read-only macOS permission preflight reports screen capture, event posting and
Accessibility all unavailable to the shell measurement process. The sandboxed
console query exits 2. The same query outside the sandbox confirms an unlocked
console and exits 0; all three permission results remain false. No permission was
requested, screen captured or input sent. No Loomlight process is running. Exact
preflights remain under ignored `continuation-2026-10-24` beside the usage ledger.
This is an environment capability limit and missing evidence, not a product failure.

The Windows `screens-source.yml` selectors still cover helper lifecycle, GPU
capability and matched rendering. The helper selector is pinned to historical
ordinal 11. It has no continuous input/presentation recorder. Existing Windows
native scripts have SendInput and isolated screenshots, which do not establish the
required frame sequence. No historical selector was dispatched or repurposed.
This establishes a missing prepared route, not that hosted Windows capture is
impossible. Default routing remains focused Windows CI; another computer is only
a fallback if that capability check fails and the user authorizes a named handoff.

The following is a proposed measurement procedure, not implemented or qualified
instrumentation. It requires a recorder permission decision on Mac. Windows CI
requires a separately reviewed adapter and explicit publication authorization.

1. Use package 4 unchanged on Mac and one matching-source Windows x64 package.
   Open only the disposable public Help composition with an isolated profile and
   pinned SDK. Record executable/fixture hashes, OS, WebView, display dimensions,
   scaling, refresh and focus. Preserve protected recovery. Use normal app mode
   for repeated measurements; consumed eight-stage launchers cannot supply them.
2. Prepare a separate Mac recorder using window-filtered ScreenCaptureKit and
   timestamped native input. Limit retained capture to the owned test window,
   with no audio, other windows or network upload. Request only the permissions
   required by the chosen recorder/driver identity after user approval. Verify
   capture, native input and clock conversion before reserving an editor launch.
   Apple's installed SDK describes `SCStreamFrameInfoDisplayTime` as WindowServer
   display time in mach absolute units; validate conversion to event timestamps.
   The [API reference](https://developer.apple.com/documentation/screencapturekit/scstreamframeinfo/displaytime)
   identifies that frame metadata. Capture callback arrival alone is insufficient.
3. Prepare a focused Windows selector with a pre-build capability check for an
   interactive input desktop, usable capture, monotonic timestamps and focus.
   Use OS SendInput and Windows.Graphics.Capture. Microsoft documents frame
   [SystemRelativeTime](https://learn.microsoft.com/en-us/uwp/api/windows.graphics.capture.direct3d11captureframe.systemrelativetime)
   as compositor QPC time, and [SendInput](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendinput)
   as injected input. Validate time-unit conversion and captured content before
   building. Failure leaves the named case pending without a package launch.
4. Record startup separately, through the first correct helper image. After that
   image, preselect three warm series per target: 100 single-character Canvas text
   sample replacements, 100 move updates and 100 resize updates. Text samples
   remain sample data. Send text replacements at fixed 200 ms intervals; send
   gesture updates at 60 Hz with steady paths inside the canvas. Retain every
   input, capture timestamp, dropped frame and unmatched result. Report each
   series separately; do not average away a failing interaction.
5. Match each input to the first captured correct screen-canvas result using the
   known glyph or expected geometry and recorded zoom. Report provisional guides
   separately from helper-rendered content. A moving guide alone cannot pass the
   content endpoint. Keep slow samples; an input superseded without an observed
   result is unmatched, not a zero-latency success. Bound observation at one second
   after the final input. Report nearest-rank p95, maximum, within-100-ms count,
   unmatched inputs and capture uncertainty. A pass requires at least 95% of each
   complete series within 100 ms, with usable capture coverage and clock mapping.
   Recorder tests must reject missing frames, wrong content, clock mismatch and
   injected delays over 100 ms before native measurements are admitted.
6. Retain source/history and independent cleanup audits. Windows also runs its
   missing eight functional stages through the fresh native driver. Automated
   input establishes OS delivery only. Ask for a separate smoothness observation
   on Windows; manual 7's move/resize observation is still unanswered on Mac.
   Neither compositor measurement establishes physical panel scanout or replaces
   subjective acceptance. Full supported-subset and phase acceptance stay separate.

Proposed initial reservations after preparation and permission checks are one Mac
native/SDK launch, then one Windows CI dispatch with one package, two native
launches and two SDK launches. This leaves one Mac native retry. Reserve attempts
immediately before execution; this plan itself reserves none. Keep the existing
ceilings and reassess any failed measurement before a retry. Recorder/adapter
preparation, qualification, review and closeout must fit the remaining allowance.

Batches 68-69 cover entry, capability checks, package/evidence readback and this
plan. Batch 70 covers scoped documentation validation, independent review and
local commit. Cumulative use is local 70/80, absolute ceiling 88; CI 0/4;
Mac packages 4/4, native 7/9, SDK 29/36; Windows zero. Ten nominal local batches
and eight contingency batches remain. No app, SDK, package, CI, permission change
or remote publication occurred in these batches. No runtime operation or watcher
is pending. Missing capability approval prevents presentation execution; the
prepared plan does not close #36. The long status files retain unrelated policy
work, outstanding acceptance and protected recovery; this continuation does not
reorganize them.

Independent read-only Standards and Spec reviews of `31e9e18...c32d1e9` each
report zero actionable findings. Standards checks cumulative accounting, evidence
separation and host/status ownership. Spec checks the full input-to-visible endpoint,
unchanged threshold and permission boundaries; whole-ticket proof remains pending.
Repository validation passes for 905 files and scoped whitespace checks pass. No
executable code changed, so the accepted 229-test result is reused within its
existing scope. Unrelated policy changes remain unstaged. The recorder permission
request is pending; no permission-dependent work has started.

### Standalone Mac recorder selection, 2026-10-24

The user selected building the standalone Mac measurement recorder and allowed
150% of the remaining allowance. Use the narrower basis of ten remaining nominal
local batches: at most 15 batches for this piece, starting after cumulative batch
70 and ending by 85. This uses the existing contingency; it adds none and preserves
the overall ceiling of 88. Announce contingency before cumulative batch 81.
Existing package/native/SDK/CI limits are unchanged. The selected result is a
compiled external recorder and native-input driver, focused validation, review,
run instructions and local commits. Permission changes, capture of the test app,
actual timing qualification and Windows implementation remain separate. The agreed
test boundary covers timestamp conversion, input/frame matching and rejection of
missing, incorrect or delayed results. Entry inspection consumes batch 71.

The recorder now compiles as a standalone ARM64 executable using Swift 6.3.2 in
Swift 5 language mode. Source is `app/scripts/canvas-measure-macos.swift`; offline
receipt analysis is `app/scripts/canvas_measurement.py`. Build, plan and run
instructions live in [Native evidence](../../testing/NATIVE.md#standalone-mac-canvas-recorder).
The compiled tool and private receipts remain under ignored
`recorder-2026-10-24` in the existing native-feedback evidence root. No Tauri app,
package, SDK, signing identity or credential namespace changed.

The initial coherent candidate's executable SHA-256 is
`afc95409af23051d5fe92f5d0b080e903c8718e7e3390049aaf4052edc5ea5de`;
its Swift source SHA-256 is
`c6a34735d7de4b2537758c3c86867db2fed0477c5ea8321d9f5c8778d87b4fdb`.
The ignored `build-receipt.json` pins both and the read-only preflight result.

The first compilation exposed a CoreFoundation downcast and a non-exhaustive Swift
getter; both are corrected. The initial clock oracle also failed outside the
sandbox: an unposted CGEvent's timestamp was zero. Corrected preflight compares
Mach-tick conversion against CoreMedia's host clock. The retained terminal bracket
is 2033585148683083 through 2033585148692708 ns, with host clock
2033585148691916 ns and Mach ratio 125/3. The compiled preflight validates that
conversion, reports all three permissions unavailable, exits 3, and records no
capture, posted input or permission request. Original failed preflights remain.
Incident H31 records the clock-oracle correction.

The recorder validates typed input plans without a target, and requires permissions,
an unlocked console, an exact foreground executable/window, enabled visible controls
and matching key focus or pointer hit target before input. It retains every posted
action, cropped raw pixels and independent display/arrival timestamps, and releases
its held mouse button on failure or interruption. Capture/reference mapping,
positive Accessibility hit testing, live capture cadence and actual input delivery
remain unqualified until the separately authorized native run. The tool always
retains false native-presentation qualification flags; arithmetic alone grants no
acceptance. It has no permission-request or upload command.

Ten focused offline/compiled-CLI tests pass with the supported Python runtime.
They cover display-time arithmetic, stale pixels, slow/wrong/missing/superseded
results, invalid clocks and incomplete receipts, changed retained pixels, plan
validation, real host-clock preflight and refusal before capture. The latter uses
an impossible target PID and verifies that no output directory is created. Initial
TDD failures for the missing analyzer and stale-pixel false positive are retained
in the session record. Typechecking and all 229 frontend tests pass with zero
skips. Repository validation passes for 909 files; scoped whitespace checks pass.
Independent review remains pending at this candidate checkpoint.

Cumulative use is local 78/80, absolute ceiling 88; eight batches of the recorder's
15-batch maximum have been used. CI remains 0/4; Mac packages 4/4, editor launches
7/9 and SDK launches 29/36; Windows zero. Recorder compilation and read-only CLI
checks are not editor or SDK launches. No runtime operation or watcher remains
pending. Actual permission setup, native measurement, Windows and whole-ticket
acceptance remain separate. All work remains local; unrelated policy edits and
protected recovery are preserved.

Independent review of `4b9040d...2a8c72f` found three P2 issues. Standards found
that operation, stream-stop and drain errors could overwrite one another. Spec
found that action IDs alone did not bind receipts to actual input parameters and
schedules, and that Escape/ownership checks did not cover waits between actions.
These original findings remain recorded; no live capture was used to investigate.

The correction retains independent named operation/cleanup failures and preserves
the primary error. Input receipts now read actual native event type, key/modifier
or pointer fields and event timestamp, alongside scheduled/before/after times.
The analyzer compares these against every planned action, the recorded start and
window bounds. A six-case red reproduction admitted changed kinds, keys, modifiers,
schedules, stamps and hidden cleanup failures before the correction. All now reject;
a separate gesture case checks exact global coordinates. Escape and application
activation monitors latch stop requests, with run-loop servicing and ownership
checks throughout every wait and final observation. The observer only checks the
Escape key code. Live observer delivery and interruption cleanup remain unqualified.

The corrected recorder compiles without warnings and passes twelve focused
offline/compiled-CLI tests. The unchanged frontend retains its passing 229-test
and typecheck result. Read-only preflight still validates the host clock and
refuses capture/input permissions without requesting them. Corrected executable
SHA-256 is `67bb46e88af09839eba68f5d9c8fbac98df6c2e9b4684e44a5d5c3f83533a695`;
Swift source SHA-256 is
`18d21af30e7044caf17aed103e550b6afe5dcf322a22444cb1276786c02a4863`.
`reviewed-build-receipt.json` pins these; earlier candidate receipts are retained.
Independent follow-up review is pending.

Contingency was announced before batch 81. Current use is local 81/80, global
ceiling 88 and recorder maximum 85. Eleven of the recorder's fifteen permitted
batches have been used. Package/native/SDK/CI counts are unchanged. No app launch,
capture, input posting, permission setup or publication occurred.

Both independent follow-up reviews close all three findings at `dba3a83` and report
zero remaining actionable Standards or Spec findings. The selected recorder piece
is complete for building, compilation, offline validation, permission refusal and
review. The permission-dependent capture/input/monitor/cleanup path remains unproved;
this completion does not accept #36 or authorize recording. The final executable
and source hashes above remain current. The existing signed app's hash and protected
native recovery text are unchanged. Unrelated policy edits remain unstaged.

Batch 82 covers final review readback, evidence/status reconciliation and the scoped
local closeout. Final recorder use is 12 of its 15 permitted local batches. Cumulative
use is local 82/80 with global ceiling 88; six existing contingency batches remain
for the selected outcome. CI 0/4, Mac packages 4/4, native 7/9 and SDK 29/36 remain
unchanged; Windows zero. No process, SDK run or watcher remains pending. Repository
validation and scoped whitespace checks pass. Publication remains `ccebf3e`; recorder
work is local only. The recorder piece adds no allowance for later qualification.

### Mac timing qualification handoff, 2026-10-24

The user requested a temporary handoff and a prompt for the Mac timing qualification.
Batch 83 covers readback, the transfer document and recovery/allowance reconciliation.
Current use is local 83/80, ceiling 88, leaving five existing contingency batches.
Recorder construction remains complete at 12 of its 15 permitted batches; unused
recorder capacity is not added to qualification. All expensive-operation counts stay
unchanged. The next session must recheck recorder permissions and obtain explicit
approval before permission setup. It must prepare the real private fixture/target/
crop/action/reference plan, qualify the recorder's positive path and audit actual
timing within the remaining allowance. No package rebuild remains allocated.
Preserve completed Mac functional and both-target rendering evidence, original
failures, unrelated policy work and protected recovery. No execution, recorder
permission, remote publication or additional allowance is granted by this transfer.

### Mac timing permission gate, 2026-10-24

Continuation starts at `88f4bc0` on the existing branch. The implement skill and
live #36, B07 and P3B were read; no tracker content changed. Batch 84 covers entry,
artifact verification, permission preflight, capture-route preparation and this
pause record. Current local use is 84/80, absolute ceiling 88, leaving four existing
contingency batches for live preparation, measurement, audit, review and closeout.
CI remains 0/4; Mac packages 4/4, native 7/9 and SDK 29/36; Windows zero. No runtime
attempt was reserved and no package rebuild is allocated.

The existing recorder and source match the final reviewed receipt exactly. Its
read-only unsandboxed preflight passes the CoreMedia/Mach clock bracket and exits 3
because Screen Recording, event posting and Accessibility access remain false.
It requests no permissions, captures nothing and posts no input. Explicit approval
was requested for that exact binary and those permissions; no answer has arrived.
This is a permission/capability blocker, not a product timing failure.

Package 4 retains executable SHA-256
`7cac273f852f71520238e9a3b9ae8d76548b48913716b92513216c7d12cfabef`.
Strict signature verification outside the sandbox passes; the sandboxed trust check
returned `CSSMERR_TP_NOT_TRUSTED`, with no signing change. The console is unlocked.
Ignored `timing-mac-01-preparation/preparation.json` pins current artifact and public
fixture hashes and the exact clock/permission observation. Its `capture-plan.md`
records the proposed ordinary UI route, series, crop/reference requirements,
startup endpoint, audit and cleanup. A first preparation write used an incorrect
fixture path and failed before creating a manifest; the corrected write is retained.

Source inspection identifies an existing fresh isolated profile route through
`studio-settings` with the development phase selector. It shows the ordinary UI
without injected JavaScript or a watchdog. Before use, verify the same route in
package 4's source and prepare only a new public Help fixture with the pinned SDK.
This selects no credential setup or LLM operation. No guided launcher is replayed.
The actual PID/window, coordinates, crop, startup initiation receipt and independently
checked reference hashes are still absent. There is no runnable qualification
manifest, positive recorder-path result or timing sample. Obtain the pending
permission approval, complete setup and capability checks, then reserve attempts
immediately before launch within the unchanged limits. Do not weaken the endpoint
or consume the four remaining batches on repeated permission polling.

No app/helper/controller or watcher was started. Completed Mac physical-input and
both-target matched-rendering evidence, unrelated policy edits and protected native
recovery remain intact. Manual 7's perceived smoothness report is still missing.
Windows and whole-ticket acceptance remain pending. This record is local only;
no push, issue update, PR, merge or release occurred.

### Approved recorder setup awaits OS authentication, 2026-10-24

The user explicitly approved the named recorder's Screen Recording, Accessibility
and event-posting permissions in this thread. Batch 85 covers setup and capability
preparation. System Settings reached Screen & System Audio Recording; Add opened
an OS authentication sheet requiring Touch ID or the Mac login password before the
file picker. The user was asked to authenticate locally without sharing a password.
The approved recorder has not yet been added, and no grant has been verified. This
is a required OS authentication step, not another approval request.

Package 4's source at `68f95c3` confirms that the selected isolated development
profile route shows the ordinary UI without injected probe JavaScript. No editor,
helper, capture or input was started. After local authentication, add only the
reviewed executable, complete the approved Accessibility/event-posting setup and
recheck its preflight. Do not grant access to another caller identity without a
specific decision. The actual fixture/target/crop/action/reference qualification
manifest remains incomplete; no timing result or acceptance is claimed.

Current use is local 85/80, ceiling 88, leaving three existing contingency batches
for remaining preparation, execution, audit/review and closeout. Mac packages 4/4,
native 7/9, SDK 29/36 and CI 0/4 are unchanged; Windows zero. No runtime reservation
was made. Ignored `timing-mac-01-preparation/preparation.json` records setup state.
Completed evidence, unrelated policy edits and protected recovery remain intact.

### Manual 7 late smoothness confirmation, 2026-10-24

The user asked the original chat to forward their late manual 7 response for
reconciliation. For the completed signed Mac package 4 retry, the question was:
"In this completed retry, did both moving and resizing look smooth, without
sticking, jumps, or lost focus?" The user answered "Both looked smooth".
`manual-07/user-observation.json` retains the question, exact answer and bounded
scope. This supplies the missing Mac perceived-smoothness observation for both
movement and resizing. No repeat manual run is needed for that observation.

Keep the raw renderer report and completed external functional audit unchanged.
The later user observation supplements them; it does not establish numerical
input-to-visible presentation latency, physical display scanout, Windows results,
full supported-subset or whole-ticket acceptance. Earlier failure evidence remains.
Recorder setup approval is already recorded, while OS authentication and verified
permissions remain outstanding at the last observed setup state.

Batch 86 covers this evidence/status reconciliation, documentation verification
and local commit. Current use is local 86/80, absolute ceiling 88, leaving two
existing contingency batches. Mac packages 4/4, native 7/9, SDK 29/36, CI 0/4 and
Windows zero are unchanged. No app/helper launch, capture, input or permission
change occurred. Unrelated policy work and protected recovery remain intact.

### Recorder grants and launch-identity blocker, 2026-10-24

After the user authenticated in System Settings, the exact reviewed recorder was
selected by its full path in both Screen & System Audio Recording and Accessibility.
Refreshing each panel confirms a `canvas-measure-macos` entry enabled in each. The
initial panel read immediately after Add was stale; refreshed inventories establish
the grants. Existing ChatGPT entries remain off and all unrelated entries remain
unchanged. The recorder binary still hashes to the reviewed
`67bb46e88af09839eba68f5d9c8fbac98df6c2e9b4684e44a5d5c3f83533a695`.

Both post-setup shell preflights exit 3 with Screen Recording, Accessibility and
event-posting capabilities false; their host-clock checks pass. No capture, input
or permission request occurs. The final observation is retained in ignored
`timing-mac-01-preparation/post-setup-preflight.json`. One bounded temporary direct
macOS job runs the same binary's read-only preflight as a launch-route check. It
produces no output within ten seconds, so supplies no capability proof. Submission
and removal succeed; its receipt and empty output/error files are preserved under
`timing-mac-01-preparation/direct-preflight`. No temporary job remains registered.

The shell's executable ancestry is Python, CodexCLI and ChatGPT.app. ChatGPT's
permission entries remain disabled. Parent-app permission attribution is a possible
cause of the mismatch, not a proved explanation. Approval was requested for a
bounded retry with Screen Recording and Accessibility enabled for ChatGPT.app,
with the broader screen/control access explained. That changes the permission
recipient beyond the recorder-only approval and has not been performed. Continue
only after that decision, or select a different reviewed launch identity. Do not
change signing, wrap/rebuild the recorder or grant another app access implicitly.

Batch 87 covers setup, bounded capability/launch-route checks and this blocker
record. Current use is local 87/80, ceiling 88, leaving one existing contingency
batch. Mac packages 4/4, native 7/9, SDK 29/36, CI 0/4 and Windows zero remain
unchanged. No app/helper attempt was reserved. The live fixture/target/crop/reference
manifest, positive capture/input path and numerical timing remain unproved. Manual
7's functional and perceived-smoothness results and both-target matched rendering
remain intact. No code changed, publication occurred or unrelated work was staged.

### Parent capture available; Accessibility authentication pending, 2026-10-24

The user reports granting ChatGPT permissions, completing the requested parent-app
permission decision. The unchanged reviewed recorder's preflight now reports
Screen Recording true, with Accessibility and event posting false. Its host-clock
check passes; it exits 3 without capture, input or a permission request. The raw
values and clock bracket are retained in ignored
`timing-mac-01-preparation/parent-grant-partial-preflight.json`.

System Settings shows ChatGPT Accessibility off while the recorder's entry is on.
Clicking ChatGPT's switch under the existing approval opens another macOS Touch ID/
password sheet. The user was asked to authenticate locally; the sheet remains open
at the last observation. No grant to a different recipient was made. Screen capture
is now available, but the recorder still cannot perform the required native input
and Accessibility checks. No app/helper attempt was reserved and no measurement
manifest, positive capture path or timing sample exists.

Final batch 88 is in progress at cumulative local 88/80, absolute ceiling 88. It
covers this capability attempt and its terminal record; no additional work batch is
authorized. After local authentication, finish the pending capability check and
record its outcome within the final batch. New preparation, correction or execution
batches require an explicit allowance decision. Mac packages 4/4, native 7/9,
SDK 29/36, CI 0/4 and Windows zero are unchanged. Completed functional, rendering
and Mac perceived-smoothness evidence, unrelated edits and protected recovery remain
intact. No executable code changed or remote publication occurred.

### Final Mac recorder capability check, 2026-10-24

After the user authenticated ChatGPT Accessibility and selected finishing the final
capability check within batch 88, the exact reviewed recorder exits 0. Screen
Recording, Accessibility and event posting all report true. The independent
CoreMedia host clock is 2054774041125250 ns, inside the converted Mach bracket
2054774041116125 through 2054774041125833 ns; Mach ratio is 125/3. Recorder and
source hashes still match the reviewed build receipt. The complete result is
retained in ignored `timing-mac-01-preparation/final-capability-preflight.json`.

This passes permission availability and clock preflight through the current shell
launch route. It requests no permissions, captures no window and posts no input.
It does not qualify positive capture, Accessibility hit testing, native input or
monitor delivery, interruption cleanup, frame coverage or numerical presentation.
No real fixture/target/crop/action/reference manifest or startup measurement exists.
No editor/helper attempt was reserved or launched. Completed manual 7 functional
and perceived-smoothness results and both-target matched rendering remain intact.

Batch 88 is complete; final cumulative local use is 88/80, absolute ceiling 88.
The local allowance is exhausted. Mac packages 4/4, native 7/9, SDK 29/36, CI 0/4
and Windows zero are unchanged. Remaining discrete attempt headroom does not renew
the exhausted local allowance. Further preparation, measurement, audit or correction
work needs an explicit allowance supplement before execution. Numerical Mac timing,
Windows and whole-ticket acceptance remain pending. No process, job or watcher is
pending. Unrelated policy edits and protected recovery remain unchanged. No code
changed or remote publication occurred; closeout is local only.
