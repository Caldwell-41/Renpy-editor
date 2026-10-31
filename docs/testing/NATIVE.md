# Native, package and human evidence

For connected-machine checks, CI selection and capability handoffs, follow
[WORKFLOW host routing](../WORKFLOW.md#test-host-routing-and-ownership).

## Evidence layers and ownership

Mock DOM, real Chromium, real controller/service, packaged WebView, OS-native input
and human acceptance establish different things. Synthetic `KeyboardEvent` or DOM
clicks cannot establish Ctrl+S/Cmd+S delivery. An agent-owned native driver can prove
OS delivery only when the actual packaged target/control and visible result are
observed. Do not describe injected input as human input. Prepare any remaining
subjective human session once; do not move routine test work to the user.

Use disposable public projects and isolated profiles. Never close, discard or reload
an unrelated user draft to make a test run. Preserve single instance, native-owned
credentials, signing/Keychain identities and normal trust policy. Mac packaging uses
the exact [approved identity](../../app/README.md#macos-local-package-identity).
CI lacking that identity does not qualify a signed local package.

Before a selected native attempt, verify the required desktop is actually unlocked,
the intended app/profile is available and the chosen package matches its source.
Run actual controls through the current renderer fixture first. Within the same
bounded native qualification, observe risky primitive controls/focus early, then
complete the unchanged required sequence. A mock or an outer dialog handle cannot
establish actual native children or later steps. All launches/reservations consume
the owning task's allowance; an early failure is not a free attempt.

On Mac, `run-runtime-ui-probes.py` checks the console session and main display
before each app launch. A locked, sleeping or unreadable desktop fails before an
editor session starts. The runner holds IOKit display-sleep and system-idle
assertions while the child runs, reaps a failed/interrupted child before releasing
them, and checks desktop state again at exit. Each case retains
`runtime-ui-<case>-desktop.json` with admission, monotonic state samples, assertion
IDs and individual release results. The runner requires an already unlocked,
awake desktop. A desktop failure after child execution remains a failed result
while helper/fixture auditing, cleanup and final result recording continue.
Its Windows route uses no Mac APIs.

## Native driver requirements

Verify exact executable/PID, window ownership and foreground, unique typed enabled
controls, viewport and actual focus before physical input. Observe the resulting
state and readback; wait on acknowledged readiness with enabled controls rather than
fixed sleeps or old labels. Native credential dialogs require verified ownership,
unique children and password-style metadata; never read password text. Cancel only
the verified owned modal before attempting main-window failure cleanup.

Use idempotent fixture selection: check whether the Beat/panel is already selected
before clicking a production toggle. Snapshot through the application's ownership
boundary after asynchronous history mutation. Normalize portable snapshot keys from
path components, retaining containment/link checks and exact bytes.

Retain fixed stage/awaited-control names, safe control type/count/focus facts and raw
OS errors where permitted. Never include project text or credential values in timeout
diagnostics. A physical click receipt alone does not establish the intended action.
Preserve each owner cleanup result independently; request, credential, host/process,
listener and fixture-root cleanup must not short-circuit one another. A forced exit
or missing ownership proof remains incomplete even if a close-input receipt passes.
Use the exact attempted phase report, never an older successful report found by glob.

The current draft-connection probe contract is version 2. The historical Windows
credential runner refuses it before building/launching; its frozen store/reload-fault
qualification is not current native connection proof. The frozen Studio Settings
external verification route and its old ordinals remain historical. A current native
migration needs its own selected task.
The [selected deliverable3 continuation](../tasks/evidence/ci-harness-reliability.md#deliverable3-selected-implementation--2026-10-16)
adds explicit `windows-studio-credentials.py current` build/run selection and the
`Repository quality` → `studio_connection_native` route. This current mode uses a
fresh namespace, exact candidate/ordinal, two processes and seven loopback GETs
(alpha/gamma/alpha/alpha, then alpha/beta/beta). The ordinary legacy entry and frozen
929 workflow remain unchanged. The current Windows sequence and both-host portable/
rendered gates are qualified by the [CI3 terminal audit](../tasks/evidence/ci-harness-reliability.md#deliverable3-ci3-terminal-audit-and-completion--2026-10-17).
This is exact-candidate evidence; the selector is not permission to replay old attempts.
The current driver alone fits its owned main window inside the measured monitor
work area, including frame/DPI and the product's minimum client size. Frozen layout
helpers still reject clipping. Failure close verifies owned PID/HWND/foreground
independently of screenshot geometry. Forced termination remains failure. Selected
synthetic store/step/timing/observation JSON is retained under visible phase-state
artifact paths, with hashes and explicit not-reached records; no whole-root upload.
The complete flow also checks exact saved native references for initial presence
and final removal without inspecting credential blobs or foreign cleanup identities.
The current probe opens Profile maintenance through its summary action and checks
effective visibility, including closed disclosure ancestors. Its native observer
records status and typed Retry availability separately, focuses/verifies the visible
Retry control and checks disabled mutation controls. Failure close dismisses owned
Settings through its ordinary close action before Alt-F4; a key-send receipt still
requires actual process exit. A rendered Chromium regression exercises the production
probe/controller/app close guard and rejects collapsed/disabled Retry. This remains
preparation evidence alongside the required Windows native sequence.

The Mac identity probe's existing four phases retain their 2/2/4/0 GET schedule,
including draft Connect. Its report validator requires contract2, the exact case,
ordered complete named assertions and one report per phase, alongside existing
PID/path/signature/exit/request checks. Validator tests do not claim fresh Mac native
acceptance. Native request fixtures bind explicit Thinking modes and
actual prepared bodies. Real owner-provider sends, output budgets and model operations
remain separately initiated/selected; never use owner credentials in controlled CI.
Native Settings must prove retained input, refused Save/retry, cancellation/stale origin,
durable save/reopen, replacement/removal and confirmed-save cleanup truth when affected.

## Package and result identity

Record source/input identity, architecture, toolchains, executable/bundle hashes,
attempt reservation, actual PID/exit and case/cleanup receipts. Recovered packages
must match their audited inputs. Check the actual npm/Tauri wrapper route before a
build; a direct CLI version alone is insufficient. Do not use an already running
old package as proof of changed code.

Package gates preserve normal project create/author/save/reopen/validate/run,
WebView/capability/privacy restrictions, real-service scenarios and single instance.
The secondary process must exit without lifecycle initialization; the existing
explicit primary readiness/callback evidence is stronger than an arbitrary delay.
Packaging/signing/install/reputation observations stay distinct from application
behavior and from platform/human acceptance.

## Performance and final human checks

Use WKWebView on macOS ARM64 or WebView2 on Windows x64 with the production frontend
and real IPC/service. Record hardware/virtualisation, OS/runtime, display/scale/refresh,
foreground/focus, candidate/package/fixture, toolchains and instrumentation; mark
unknowns honestly. Core, browser and native timers measure distinct endpoints.
An rAF proxy does not establish physical presentation or perceived latency.

For the existing optional packaged Branches fixture, retain 500 Scenes/2,000 edges,
506 sources / 105,627 bytes, distinct from core's 503-source population. Its verified
Start input is bounded at 60 seconds, then the existing five-second settling period
precedes measurement. Complete capture/accessibility work before that interval ends.
Do not qualify a smaller or altered workload as equivalent.

The accepted final-human policy is a prepared focused session per supported platform,
roughly 15–20 minutes as an estimate. Cover changed native shortcuts/focus, pending
input, Scene/Source/Branches navigation, authored routes/Stop/rerun, diagnostic
navigation, resize/scaling and close/reopen/usability. Automated tests own exhaustive
route, asset-refusal, no-write/history, cancellation and retry assertions. English UI
and standard-keyboard review do not claim non-English IME or screen-reader proof.

Reuse mapped human cases on an identical candidate. For changed inputs, assess each
reused interaction against code/test/workflow/dependency deltas and repeat only missing
or affected cases. This narrow human-evidence rule is not a cross-SHA automated package
waiver. Record exact candidate, hashes, OS, cases, results and limitations. Historical
acceptance stays historical; do not automatically reopen the whole session.

## L17 current-release timing waiver

For #36's bounded Help proof, the user [waived numerical timing as a release gate
on both targets](../tasks/evidence/canvas-rendering.md#windows-functional-and-smoothness-selection-2026-10-24).
The 95/100-within-100-ms target remains unverified; no timing pass is claimed.
Mac functional performance and observed smoothness are accepted. Windows physical
input and the user's move/resize smoothness judgement remain required. Use the
existing `canvas-input` functional case and external native/human audit, preserving
source/history and cleanup checks. Missing numerical proof is not a blocker or
reminder and does not authorize a recorder or timing campaign. Reopen numerical
qualification only under the recorded condition. This exception is scoped to #36
for this release, not other features' performance contracts.

## Standalone Mac canvas recorder

The #36 Mac timing effort is [closed by user acceptance for this release](../tasks/evidence/canvas-rendering.md#mac-timing-qualification-closed-by-user-acceptance-2026-10-24).
Its numerical target remains unverified and is waived as an acceptance gate.
The procedure below is retained reference, not scheduled work or a release blocker.
Use it only after reopening under the recorded condition; missing numerical proof
alone does not trigger testing, allowance requests or reminders.

`app/scripts/canvas-measure-macos.swift` is an external qualification tool for
macOS 14 or later. It does not change the signed app. Build it from the repository
root into ignored storage:

```bash
mkdir -p .toolchains/canvas-recorder
xcrun swiftc -swift-version 5 -parse-as-library -O \
  -module-cache-path /tmp/loomlight-recorder-module-cache \
  app/scripts/canvas-measure-macos.swift \
  -o .toolchains/canvas-recorder/recorder
.toolchains/canvas-recorder/recorder preflight
```

Preflight requests no permissions, captures no window and posts no input. It compares
converted Mach ticks with CoreMedia's host clock and reports capture, event-posting
and Accessibility access. Exit 3 means a required capability is unavailable. A
newly created CGEvent has no usable timestamp until set; it is not a clock oracle.
Permission setup remains a separate user decision. Keep the exact compiled binary
and its hash for that decision; rebuilding can change the permission identity.

Prepare an ignored JSON plan. This abbreviated text example needs real identity,
crop and reference values before validation:

```json
{
  "protocolVersion": 1,
  "pid": 2147483647,
  "windowID": 1,
  "executableSHA256": "<64 lowercase hex digits>",
  "endpoint": "settled-reference",
  "crop": { "x": 0, "y": 0, "width": 100, "height": 100 },
  "actions": [
    { "atMs": 0, "kind": "key", "keyCode": 0, "modifiers": ["command"],
      "focus": { "role": "AXTextArea", "label": "Canvas text sample" } },
    { "atMs": 200, "kind": "key", "keyCode": 0,
      "focus": { "role": "AXTextArea", "label": "Canvas text sample" },
      "sample": { "id": "text-001", "series": "text", "sha256": "<expected raw crop SHA256>" } }
  ]
}
```

Use `validate PLAN.json` to check the plan without permissions or a running target.
This checks structure and the declared reference contract, not native provenance,
actual rendering routes or capture coverage. Both `validate` and `record` reject
the former ambiguous `helper-content` endpoint. Historical receipts remain
readable by the offline analyzer.
The plan selects an existing public-fixture process by PID, window ID and executable
hash; the recorder never launches or closes the app. Actions are strictly ordered
millisecond offsets, bounded at 110 seconds. `key` sends a key press/release using
the active keyboard layout. `down`, `move` and `up` use logical coordinates relative
to the target window's top-left. Every key and pointer-down action needs the exact
expected Accessibility role and label. The recorder checks enabled controls and
their viewport bounds, current key focus or pointer hit target, the unlocked console,
foreground ownership and unchanged window bounds before input. Gesture samples
require a held left button and use series `move` or `resize`; text samples use
series `text`. Complete every down/up pair. Escape, SIGINT, SIGTERM, stream errors
or lost ownership stop the sequence and release any button held by this tool.
An [AppKit event monitor](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/EventOverview/MonitoringEvents/MonitoringEvents.html)
latches Escape, and an application-activation observer latches foreground loss.
The CLI services the run loop and rechecks ownership throughout scheduled waits
and final observation. It retains no keyboard text from the Escape monitor. Live
monitor delivery and interruption cleanup still need the native qualification.

The crop uses physical pixels of the shadow-free captured window. Keep it inside
helper-rendered content, clear of selection guides and other changing controls.
Expected hashes identify the complete crop as tightly packed, top-down,
premultiplied RGBA8 bytes in sRGB. Prepare references separately for the exact
resolution, zoom, scale and expected input state. Audit their content and mappings;
a hash alone does not prove that a reference is correct. To prepare references,
use endpoint `reference` with no sample IDs. An empty action list captures without
posting input; optional setup actions can establish the known reference state.
Keep those receipts separate and audit the selected raw crops before using their
hashes. The analyzer refuses reference sessions as timing measurements. A guide series
uses endpoint `editing-guide`, which cannot pass the content endpoint. The selected
#36 plan still requires 100 text, 100 move and 100 resize samples per target.

### Content endpoint and reference admission

Declare the event being measured before constructing references:

- `settled-reference` measures a transition to pixels matching an independently
  settled reference. This is a bounded diagnostic. It does not prove the first
  content response or a helper confirmation, even if its arithmetic passes.
- `visible-content` uses an invariant content crop. Every reachable route that
  paints the input's updated content must produce the same exact expected native
  hash. The recorder checks the reference declarations before capture or input;
  an independent audit must establish their provenance and route coverage.
- `settled-confirmation` is refused. Matching pixels can also come from a
  provisional image. Confirmation needs compositor-bound generation evidence
  that this recorder does not collect.

The actual renderer has different routes. Text and resize retain dimmed old
content until a new helper image loads; changed guides are not content responses.
An isolated move translates the installed helper image immediately at full
opacity. A helper delivery can replace that image during the gesture. A clipped
or nonisolated move changes only guides while the old content remains stale.
Audit the fixture against `showMovement`, `renderCanvas`, `showFrame` and the
stale/provisional opacity rules. Never infer the route from cadence alone.

For `visible-content`, use one series per plan. Each sample includes a `reference`
object with `settled` equal to its independently captured settled native hash.
For move, declare `moveRendering` as `isolated-panel` or `guides-only`, matching
the actual workload. Isolated moves also require `reference.translated`: a map
from `baseline` and every earlier sample ID to the independently established
native crop for moving that source image to this input's target position. The
current helper's zero-offset image is covered by `settled`. For example, the
second move needs both earlier sources:

```json
{
  "id": "move-002", "series": "move", "sha256": "<expected native crop hash>",
  "reference": {
    "settled": "<settled native crop hash>",
    "translated": {
      "baseline": "<native crop after translating the baseline image>",
      "move-001": "<native crop after translating the first helper image>"
    }
  }
}
```

All those hashes must equal the sample's expected hash. Missing sources or differing
variants refuse the plan. Text, resize and guides-only moves must not supply
translated content references. These declarations do not replace evidence: retain
the exact plan/build, crop/scale, source request/result/PNG identities, native raw
pixels and route observations that justify every entry. Copying the expected hash
into the map establishes nothing. Visible-content plans reject unsampled keys and
held-pointer moves because they can introduce unreferenced helper states. Other
possible source generations invalidate this bounded construction and require a
new admission design. Include guide exclusion, stale opacity, helper replacement
and input attribution in the independent audit. Reject unknown route coverage.

If the crop is not invariant, choose and independently validate a real content
crop that is, or add presentation-bound state/generation evidence under a separate
capability allocation. Do not loosen matching, derive expected hashes from the
timed result, or add a post-hoc list of accepted variants. The retained Mac move
crop is not invariant and remains inadmissible for overall feedback timing.
Renderer logs or helper-file watchers alone cannot prove compositor presentation.
A future signal must associate input state, desired generation, installed helper
frame, provisional transform and opacity with captured content; a marker alone
cannot count as the content response.

### Recording and interpretation

After explicit permission approval and the owning task's native/SDK reservations,
use the existing signed package and disposable isolated fixture:

```bash
.toolchains/canvas-recorder/recorder record PLAN.json NEW_IGNORED_OUTPUT
python3 app/scripts/canvas_measurement.py NEW_IGNORED_OUTPUT
```

Use Python 3.11 or later. Output must be new. Receipts retain every posted action,
frame display/arrival timestamps and deduplicated raw pixel files, with a one-GiB
pixel limit and 20,000 complete-frame limit. Capture requests 60 Hz for this window
only, excludes cursor/audio and observes one second after the final action. Session
metadata retains clock calibration, input scheduling, observed frame statuses,
callback gaps, window scale, display mode and WebKit version. Unknown refresh rates
remain null. These facts need audit for coverage and scheduling; requested 60 Hz
does not establish delivered capture cadence. Startup measurement remains separate.

The analyzer verifies retained pixel hashes, exact action receipts and clock order.
Action receipts include actual native type, key code/modifier flags or global
pointer coordinates, stamped input time and scheduled time relative to the recorded
start. The analyzer compares these with the saved plan and window bounds. Operation,
stream-stop, pointer-release and log-close errors remain separate in session cleanup
receipts; one failure cannot overwrite another.
Analysis version 2 follows new content transitions without ending a response window
at the next input or unsampled action. It retains observations beyond 100 ms as
delayed results. Pixels already visible before an input cannot prove its response.
If multiple unresolved inputs expect identical pixels, a matching transition is
ambiguous and cannot be credited to a later revisit. Ambiguous, already-visible and
unobserved inputs remain in the denominator as misses; skipped/coalesced states are
not automatically accepted. Generation ordering still requires an external audit.
It writes a new `analysis.json` with separate per-series
nearest-rank p95, maximum and within-100-ms counts. Exit 0 means its arithmetic
target passed; it always retains `nativePresentationQualified: false` until an
external native/reference/coverage audit. Reports also retain `declaredEndpoint`,
`measurementScope` and `contentTimingQualified: false`; structural validation
and arithmetic do not establish the endpoint's provenance. Preserve earlier analyses rather than
overwriting them, including analyses from the earlier next-action matching policy.
That earlier policy does not establish the agreed 100 ms result. Captured compositor
timestamps do not establish panel scanout,
human input or perceived smoothness. This tool prepares the later qualification;
it has no permission-request or publication command.

Offline checks also run in ordinary Python discovery. Run only those checks from
the repository root with:

```bash
python3 -m unittest discover -s app/scripts -p 'test_canvas_measurement.py' -v
```

After building the recorder above, select its compiled-CLI checks explicitly.
A missing binary fails the check instead of skipping it. These checks never
capture a screen, post input or open Loomlight:

```bash
CANVAS_RECORDER_BINARY="$PWD/.toolchains/canvas-recorder/recorder" \
  python3 -m unittest discover -s app/scripts -p 'canvas_measurement_native_checks.py' -v
```
