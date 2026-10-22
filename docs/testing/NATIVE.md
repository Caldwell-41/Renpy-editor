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
