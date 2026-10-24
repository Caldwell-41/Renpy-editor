# Native, package and human evidence

[WORKFLOW host routing](../WORKFLOW.md#test-host-routing-and-ownership) is symmetric:
iterate on the chosen development host and use CI for the other supported target.
Windows x64 and macOS ARM64 remain distinct evidence hosts. Select only the cases
affected by the change; identify any required capability CI cannot establish.

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

## Standalone Mac canvas recorder

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
  "endpoint": "helper-content",
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
It rejects pixels already visible before the input and counts superseded/unmatched
inputs as misses. It writes a new `analysis.json` with separate per-series
nearest-rank p95, maximum and within-100-ms counts. Exit 0 means its arithmetic
target passed; it always retains `nativePresentationQualified: false` until an
external native/reference/coverage audit. Preserve earlier analyses rather than
overwriting them. Captured compositor timestamps do not establish panel scanout,
human input or perceived smoothness. This tool prepares the later qualification;
it has no permission-request or publication command.

Run focused offline and compiled-CLI checks with the build above. These checks
never capture a screen, post input or open Loomlight:

```bash
CANVAS_RECORDER_BINARY="$PWD/.toolchains/canvas-recorder/recorder" \
  python3 -m unittest discover -s app/scripts -p 'test_canvas_measurement*.py' -v
```
