# CI incident index

Search by symptom, host, test, control or script (for example `rg -n -i 'BOM|focus' docs/testing/INCIDENTS.md`).
Read only matching entries and their linked original task sections. This is a compact
lookup index, not another execution ledger or current task selection. Detailed attempts,
hashes, consumed attempts and uncertainty stay in linked task evidence. Links to CI may outlive artifacts;
an expired archive is not freshly auditable evidence.

Add an entry for a new cause, materially revised diagnosis or lasting regression lesson.
Group repeated attempts under that cause; do not append every rerun. Include symptom/host,
classification/uncertainty, correction, preventing regression and original evidence.
Never turn earlier failed, missing or skipped results into passes. These corrections
describe historical fixes; they do not claim fresh execution or reopen frozen runners.

## H01 — Windows Settings cancellation returns busy/null

- **Class/search:** harness; parallel `ACTIVE.try_lock`, `TEST_SERIAL`, `ai_settings`.
- **Cause/correction:** two Settings-dispatch fixtures omitted the shared ownership guard.
  Use the same fixture guard and preserve production locking/cancellation assertions.
- **Regression:** full desktop tests under the ordinary parallel runner on Windows.
- **Evidence:** [first diagnosis](../tasks/evidence/phase-2-execution.md#ci-audit-and-repository-harness-review--2026-10-16),
  [both-host corrected CI3](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38853421609).

## H02 — POSIX fixture errors or nonexistent-PID behavior on Windows

- **Class/search:** harness; `os.getuid`, permission snapshots, `os.kill(pid,0)`, WinError87.
- **Cause/correction:** broadened discovery included Mac-only ownership tests and assumed
  Unix process absence. Route only named host cases; inject absence for portable logic.
- **Regression:** `test_macos_development_credentials`, cleanup live/unknown-state refusal,
  and exact named Python exclusions in `check-thinking-evidence.py`.
- **Evidence:** [CI2 diagnosis and correction](../tasks/evidence/phase-2-execution.md#ci2-terminal-diagnosis-and-proposed-correction--2026-10-16),
  [failed run](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38850950449).

## H03 — Mocked operation finishes in one clock tick

- **Class/search:** harness; `endedMonotonic`, `startedMonotonic`, equal timestamps.
- **Cause/correction:** immediate failed-build fixture asserted strict elapsed progress.
  Use a controlled advancing clock with exact expected receipt values.
- **Regression:** `test_failed_build_preserves_exclusive_terminal_and_cannot_redispatch`.
- **Evidence:** [CI2 diagnosis](../tasks/evidence/phase-2-execution.md#ci2-terminal-diagnosis-and-proposed-correction--2026-10-16).

## H04 — Native path separators differ from fixture or preview keys

- **Class/search:** harness; Windows backslash, `/public/node`, `Exact selected patch differs`.
- **Cause/correction:** use native `Path` for executable arguments; use normal relative
  components joined with `/` for portable snapshot keys. Preserve exact bytes/containment.
- **Regression:** `test_npm_routes_through_pinned_node_cli_without_shell`, `snapshot_paths`.
- **Evidence:** [argument fixture](../tasks/evidence/phase-2-execution.md#selectable-ci2-windows-harness-failure-and-narrow-correction--2026-10-12),
  [snapshot diagnosis](../tasks/evidence/phase-2-execution.md#selectable-ci4-terminal-audit-and-portable-snapshot-correction--2026-10-12).

## H05 — ZIP fixture name normalized before archive refusal

- **Class/search:** harness/external extractor; Windows `ZipInfo`, `orig_filename`, backslash.
- **Cause/correction:** reader and writer can normalize unsafe names. Reject raw versus
  normalized name differences before extraction; preserve archive-entry defenses.
- **Regression:** `test_studio_settings_evidence.py` archive normalization/refusal cases.
- **Evidence:** [CI2 archive diagnosis](../tasks/evidence/phase-2-execution.md#ci2-terminal-audit-and-unlocked-owner-continuation--2026-10-13).

## H06 — Approved temporary root rejected before launch

- **Class/search:** harness configuration; Windows `RUNNER_TEMP`, `TMPDIR`, `TEMP`, `TMP`.
- **Cause/correction:** Python and inherited Rust child resolved different temporary
  parents. Align environment with the approved runner root, retaining containment.
- **Regression:** native root admission fixtures and actual target preparation.
- **Evidence:** [CI3 root diagnosis](../tasks/evidence/phase-2-execution.md#ci3-terminal-audit-and-explicit-ci-allowance-extension--2026-10-13).

## H07 — Fixture preparation consumes the request deadline

- **Class/search:** harness; Windows worker server `TimedOut`, project construction, two seconds.
- **Cause/correction:** construct/drop the unrelated project before starting the stalled
  request timer. Preserve original cancellation, EOF and shutdown assertions.
- **Regression:** `ordinary_external_configuration_change_and_project_session_reject_results`.
- **Evidence:** [generated-card first failure](../tasks/evidence/phase-2-execution.md#generated-card-first-ci-failure-and-correction--2026-10-11).

## H08 — Native focus/readiness or dialog children unproven

- **Class/search:** harness/missing native evidence; Windows `Save profile`, Spinner,
  Model ID, CheckBox, masked Edit, UIA, foreground, child IDs100/1/2.
- **Cause/correction:** mocked helpers and outer dialog identity left actual controls
  untested. Observe owned child type/style/visibility, focus, physical action and
  dismissal/readback; cancel the owned modal before failure cleanup.
- **Regression:** `test_studio_setup_native.py`, Windows focus fixtures and actual native
  sequence. Mocks do not establish native proof; CI8's exact UIA provider cause remained unknown.
- **Evidence:** [whole-sequence reassessment](../tasks/evidence/phase-2-execution.md#ci7-terminal-audit-and-whole-sequence-reassessment--2026-10-13),
  [child-control gap](../tasks/evidence/phase-2-execution.md#ci8-terminal-review--native-child-control-observation-gap--2026-10-13),
  [historical CI9 completion](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38317425509).

## H09 — Remount toggles an already-selected Beat off

- **Class/search:** harness; `physical-accept` timeout, disabled Assist, Save/Undo/Redo remount.
- **Cause/correction:** production selection toggles; the probe clicked unconditionally.
  Select idempotently and observe the selected state before the next operation.
- **Regression:** `native-probe-driver.test.ts`, full `selectable-native-sequence.dom.test.ts`.
- **Evidence:** [selectable CI6 diagnosis](../tasks/evidence/phase-2-execution.md#selectable-ci6-terminal-audit-and-idempotent-remount-correction--2026-10-12).

## H10 — Snapshot overlaps async history; cleanup hides owner failures

- **Class/search:** harness; `Fixture unavailable`, host checkout, `RUNTIME_BUSY`, watchdog.
- **Cause/correction:** snapshot through host ownership after mutation. Bound only
  pre-dispatch contention; do not retry inner I/O failures. Attempt cleanup owners
  independently, retain timeout output, and read only the exact attempted phase report.
- **Regression:** `snapshot_paths`, `probe_cleanup`, rejecting selectable/phase gates.
- **Evidence:** [CI5 ownership diagnosis](../tasks/evidence/phase-2-execution.md#selectable-ci5-terminal-audit-and-probe-ownership-correction--2026-10-12),
  [remaining-sequence audit](../tasks/evidence/phase-2-execution.md#remaining-windows-suite-review-and-approved-ci7--2026-10-12).

## H11 — SDK driver advances dialogue while at a menu

- **Class/search:** harness; both hosts `RenpyTestTimeoutError`, bare `advance`, choice screen.
- **Cause/correction:** await/assert the choice screen before the route click; retain
  ordinary advance for no-option continuation and all expected route assertions.
- **Regression:** zero-SDK generated-driver preflight in `renpy/tests/phase3a.rs`.
- **Evidence:** [CI1 diagnosis](../tasks/evidence/phase-3-history.md#resume-and-exact-ci1-failure-audit--2026-10-13),
  [failed run](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38346032499).

## H12 — SDK scaffold import uses an accepted-document BOM rule

- **Class/search:** harness; both hosts `transport BOM must match`, generated GUI import.
- **Cause/correction:** distinguish external import encoding from captured document
  editing; retain actual input bytes, accept one transport BOM and reject multiple BOMs.
- **Regression:** all three scaffold imports in the zero-SDK `phase3a_` preflight.
- **Evidence:** [CI3 diagnosis](../tasks/evidence/phase-3-history.md#ci3-terminal-audit-and-scaffold-import-diagnosis--2026-10-14),
  [failed run](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38428839556).

## H13 — UI/request fixtures retain an old application contract

- **Class/search:** harness; Settings Save before Connect, `Refresh models`, Characters
  navigation, missing `After`, Thinking off, identity probe timer leak.
- **Cause/correction:** run real probes through current production DOM/controller and
  compare synthetic admission against actual prepared requests with explicit modes.
  Dispose cancelled timers; version/refuse incompatible frozen-product contracts.
- **Regression:** full renderer critical consumer names, synthetic Thinking on/off
  preparation/admission, legacy Windows contract2 refusal before build/launch.
- **Evidence:** [repository harness review](../tasks/evidence/phase-2-execution.md#ci-audit-and-repository-harness-review--2026-10-16),
  [repair record](../tasks/evidence/phase-2-execution.md#harness-repair-and-second-review--2026-10-16).

## H14 — Official checksum host times out before tests

- **Class/search:** environment/acquisition; both hosts curl28, zero packages/launches.
- **Correction:** use verified official SHA-keyed archive cache and provenance-bound
  published manifest; bounded official download on miss, corrupted cache refusal.
  Record bootstrap before acquisition and retain safe early failures.
- **Regression:** `selectable-evidence.py` acquisition/identity/early-failure gates.
- **Evidence:** [selectable acquisition diagnosis](../tasks/evidence/phase-2-execution.md#selectable-ci1-failure-audit-and-acquisition-correction--2026-10-12).

## H15 — Verbose unittest warning interrupts a completed result row

- **Class/search:** harness parser; duplicate ZIP warning, result count differs from rows.
- **Cause/correction:** a warning can appear between the test header and final `ok`.
  Parse the completed result across warning lines, while requiring exact row/count
  agreement and rejecting missing/duplicate results and extra host exclusions.
- **Regression:** `test_check_thinking_evidence.py` warning/unterminated-result fixtures.
- **Evidence:** [maintenance verification](../tasks/evidence/ci-harness-reliability.md#implementation-and-verification).

## H16 — Hyphenated test script is absent from unittest discovery

- **Class/search:** harness selection; retention suite, zero discovery, `NO TESTS RAN`.
- **Cause/correction:** discovery ignores a filename that is not a Python identifier.
  Invoke `test-q1-package-retention.py -v` directly and require its exact named results.
- **Regression:** `test_harness_checks.py` retention missing/duplicate/skip rejection;
  the shared runner's actual retention execution remains required on both hosts.
- **Evidence:** [maintenance verification](../tasks/evidence/ci-harness-reliability.md#implementation-and-verification).

## H17 — Inventory unit fixtures depend on an earlier Tauri build

- **Class/search:** harness fixture; clean checkout, generated permissions,
  `core_request.toml` KeyError, complete input maps unexpectedly refuse on both hosts.
- **Cause/correction:** tests used the real checkout's ignored generated permissions;
  earlier local builds masked their absence. Create an explicit temporary inventory
  and exercise the real inventory/admission functions. Remove actual fixture files
  to test refusal; keep production permission and package gates unchanged.
- **Regression:** named `test_source_inventory_requires_generated_permissions_without_prior_builds`
  is required by the Python evidence gate. Run the shared harness from a clean export
  without generated permissions, dependencies or build output before affected CI.
- **Evidence:** [CI1 audit and repair](../tasks/evidence/ci-harness-reliability.md#ci1-terminal-audit-and-selected-repair--2026-10-16),
  [clean-checkout verification](../tasks/evidence/ci-harness-reliability.md#clean-checkout-repair-verification--2026-10-16),
  [both-host CI2 completion](../tasks/evidence/ci-harness-reliability.md#ci2-terminal-audit-and-deliverable2-completion--2026-10-16).

## H18 — Current native window exceeds the runner desktop; cleanup repeats the gate

- **Class/search:** harness geometry/cleanup and missing retained state;
  `Required owned layout does not fit observable desktop`,1044×759,1024×768.
- **Cause:** current mode imports a placement helper that preserves window size;
  it supplied no fitting viewport. Early native Cancel passed, but main-window
  observation refused. Failure close reused that gate and forced exit followed.
  Temporary fixture snapshots also remained outside the uploaded artifact directory.
- **Correction qualified:** fit and verify only the current
  test window against measured work-area/frame/DPI; separate owned ordinary close
  from observation geometry; retain allowlisted synthetic snapshots and partial
  outcomes. Strict visibility/ownership gates and frozen helpers remain intact.
- **Regression:** portable viewport/retention/original-error/owned-reference cases;
  actual current PowerShell functions on1024×768, scaling, refused placement and close
  after observation refusal run on Windows before packaging. CI2 proves geometry,
  state retention and phase1; phase2 reaches the distinct H19 recovery/close gap.
  CI3 completes both native phases with normal exit. No app defect is established by CI1.
- **Evidence:** [native CI1 terminal audit and proposal](../tasks/evidence/ci-harness-reliability.md#deliverable3-native-ci1-terminal-audit-and-proposed-repair--2026-10-16).
  [Approved repair and local results](../tasks/evidence/ci-harness-reliability.md#deliverable3-scoped-repair-preparation-and-review--2026-10-16).
  [CI3 complete native audit](../tasks/evidence/ci-harness-reliability.md#deliverable3-ci3-terminal-audit-and-completion--2026-10-17).

## H19 — Retry inside closed disclosure; Settings modal blocks app-close cleanup

- **Class/search:** harness visibility/cleanup gap; `Current confirmed-save read-only
  reload`, Retry loading profiles, Profile maintenance, closed details, Alt-F4.
- **Evidence/cause:** current phase1 passed; phase2 reached confirmed-save reload
  recovery, then the combined native status/Retry wait failed. Retry is inside a
  closed maintenance disclosure, while DOM checks inspect only `[hidden]` flags and
  can directly click hidden descendants. Driver never opens that disclosure. Failed
  wait diagnostics do not identify which UIA subcondition failed; this remains the
  leading source-supported diagnosis. No backend Save/reload defect established.
- **Second omission:** cleanup sends owned Alt-F4 without closing Settings first;
  the ordinary app close guard rejects its `aria-modal=true` overlay. Key-send receipt
  passed but process exit failed and forced termination followed.
- **Correction qualified:** current probe opens maintenance
  and checks effective visibility. Native observer retains separate status/control
  facts; cleanup closes Settings before app close and handles confirmed owner exit.
  A rendered production probe/controller/app-close test reproduces the old failure,
  passes the corrected flow and rejects collapsed/disabled Retry. Actual close guard
  rejects the open modal and permits close after dismissal. App protections/deadlines
  remain unchanged; browser/stubbed IPC evidence does not qualify Windows native input.
  CI3 separately completes both native phases, retained whole-store recovery/removal,
  seven authenticated GETs and normal exit. Its native recovery capture/control facts
  prove Retry visible/enabled; successful flow does not exercise failure cleanup.
  CI1 had stopped earlier at geometry, so CI2 reaching this later state required no
  product regression. Embedded probe changes still require a matching rebuilt package.
- **Evidence:** [final native CI2 audit](../tasks/evidence/ci-harness-reliability.md#deliverable3-final-ci2-audit-and-missed-settings-interactions--2026-10-17).
  [H19 build/rejecting-gate review](../tasks/evidence/ci-harness-reliability.md#deliverable3-h19-build-and-pre-dispatch-review--2026-10-17).
  [CI3 terminal audit and completion](../tasks/evidence/ci-harness-reliability.md#deliverable3-ci3-terminal-audit-and-completion--2026-10-17).

## H20 — Screen SDK driver assumes an unavailable menu or style attribute

- **Class/search:** harness; `screenproof.layout`, `main_menu`, `Style.xsize`,
  `video driver did not add any displays`.
- **Cause/correction:** the minimal fixture starts in Story; it has no generated
  menu journey. Use the SDK's `suite::case` selector, await the called screen, then
  measure `renpy.render(...).get_size()` and verify its continuation. An `xsize`
  source property is not a readable `Style.xsize` attribute in the pinned SDK.
  Distinguish the separate sandbox display failure from these driver defects.
- **Regression:** named core/evidence rejection cases and retained native assertions;
  corrected rendering passes the audited both-host CI1 proof. All failed local
  attempts remain in the owning ledger.
- **Evidence:** [early 3B execution ledger](../tasks/evidence/phase-3-history.md#early-execution-ledger).

## H21 — Generated arrow names and offscreen inspector text break browser checks

- **Class/search:** browser harness; `Next prototype layout`, `innerText`,
  `content-visibility: auto`, open disclosure, offscreen action rows.
- **Cause/correction:** CSS arrow text changed accessible button names; explicit
  labels correct the controls. The notebook's action data existed in an open but
  offscreen property group. Scroll the target into view and require effective
  visibility before rendered-text assertions. Apply the same rule to its protected
  notice; retain action/order expectations and product behavior.
- **Regression/evidence:** original failures reproduce in local10; all three
  focused journeys then pass. Local11 passes 508 cases and 20 groups. Per-layout
  progress and failure state prevent another missing-variant diagnosis.
  [3B execution ledger](../tasks/evidence/phase-3-history.md#early-execution-ledger)
  retains both failures, actual visibility/name facts and final results.

## P01 — Redo refuses an app-owned clean deletion

- **Class/search:** product; Draft Scene Undo/Redo, cached unavailable Source buffer, DIRTY_SOURCE.
- **Correction:** evict only exact accepted clean buffers after successful app deletion;
  preserve external missing-source and dirty/conflict protections.
- **Regression:** production Draft history with refresh, Undo/Redo and process reopen.
- **Evidence:** [reproduced product diagnosis](../tasks/evidence/phase-2-execution.md#draft-scene-ci-artifact-audit-and-redo-correction--2026-10-10).

## P02 — Windows partial-body cancellation does not close promptly

- **Class/search:** product; shutdownNotConnected10057, server TimedOut10060, missing EOF.
- **Correction:** share the actual TcpStream between cancellation and transport. The
  exact Winsock internal cause was not established; do not generalize clone behavior.
- **Regression:** header/body cancellation requires owned socket, shutdown, Cancelled,
  EOF and the original two-second bounds. Initial timing-only diagnosis was provisional.
- **Evidence:** [decisive handle/phase evidence](../tasks/evidence/phase-2-execution.md#generated-card-third-ci-audit-and-exact-handle-repair--2026-10-11).


## H22 — Scratch screen preview selects a menu context

- **Class/search:** product/helper and missing diagnostic evidence; scratch preview,
  geometry timeout, `_main_menu_screen`, `suppress_overlay`.
- **Cause/correction:** the initial job redirected a menu label. The pinned SDK's
  `_enter_menu` enables menu state and suppresses overlays. The correction redirects
  the ordinary `start` label and keeps skip-menu/skip-splash behavior inside the SDK
  runtime adapter. Qualification requires `main_menu == False`, geometry, retained
  process status and cleanup. The correction passes both-aspect Mac SDK service proof; native/Windows proof remains pending.
- **Evidence:** [Help outcome attempts](../tasks/evidence/help-screen-production.md#local5-result-cancelled-local6-and-corrected-local7).

## H23. Help gate assumes an owned Windows Stop exits with zero

- **Class/search:** qualification assumption; `STATUS_CONTROL_C_EXIT`, `-1073741510`,
  `CTRL_BREAK_EVENT`, `Expected successful validation or owned Stop`.
- **Cause/correction:** the supervisor requests console-control cancellation and keeps
  its raw exit status. Three gates accepted only zero or a Unix signal result. Accept
  the exact Windows control exit only for cancelled owned Stop with complete cleanup,
  untruncated evidence and no runtime error. Keep raw codes and reject abnormal results.
- **Regression:** Rust/Python gates and the real native probe script through the
  bridge/core with a marked runtime test double cover positive and rejecting states.
- **Evidence:** [CI2 diagnosis](../tasks/evidence/help-screen-production.md#ci2-retained-audit-and-causal-diagnosis).

## H24. Desktop check precedes the frontend build in a clean checkout

- **Class/search:** workflow prerequisite; Tauri `generate_context!`, `frontendDist`,
  `../dist`, `this path doesn't exist`, both Windows and Mac.
- **Cause/correction:** the L01 workflow checked the desktop before running the
  existing frontend build. Local ignored output masked the dependency. Move the
  frontend build before the desktop check, preserving both checks and all selectors.
- **Verification:** reproduce the missing-output failure in a disposable clean
  export, then run the frontend build and the same desktop check in that export.
- **Evidence:** [L01 CI1 audit](../tasks/evidence/owned-blank-screen.md#ci1-terminal-audit-and-workflow-correction).

## P03. Initial Screens catalog read stops on service contention

- **Class/search:** product integration; `RUNTIME_BUSY`, Screens, missing Choose,
  `Another request is in progress. Input retained.`
- **Cause/correction:** the new `screens.list` read bypassed the existing ordered
  observations and bounded read retry. Add catalog/inspection reads to the request
  lane and catalog reads to the read-only retry list. Never replay mutations.
- **Regression:** held-service request-lane cases and the production renderer/core
  controller with a refused initial catalog read reproduce the failure and pass
  after correction. Current-package native proof remains required.
- **Evidence:** [L01 native diagnosis](../tasks/evidence/owned-blank-screen.md#ci2-terminal-audit-and-native-correction).

## H25. Screen probe omits rich-editor and early-failure states

- **Class/search:** harness; textarea, CodeMirror, `Timeout: open`, missing owned
  metadata, missing result JSON, PowerShell `RUNNER_TEMP`.
- **Cause/correction:** rehearse the packaged rich editor, observe its existing
  selection after focus and retain the awaited control on failure. Failed ownership
  and metadata retention must still reach fixture cleanup and failed-result emission.
  PowerShell identity output uses `$env:RUNNER_TEMP`.
- **Regression:** exact busy/rich-editor browser controller and whole-runner synthetic
  success, early-failure and unreadable-metadata cases. These are not native passes.
- **Evidence:** [L01 CI2 corrections](../tasks/evidence/owned-blank-screen.md#ci2-terminal-audit-and-native-correction).

## P04. Windows canvas readers conflict with legacy file replacement

- **Class/search:** product helper; `PermissionError`, `request.json`, first frame
  succeeds, next draft becomes unavailable, Windows atomic rename.
- **Cause/correction:** the publisher uses `MoveFileExW` to replace the request.
  Python's ordinary file open omits Windows delete sharing, so its read can
  conflict with the publisher's rename handle. Delete sharing fixes that reader
  conflict; CI4 then isolates publication itself failing with OS error 5 while a
  target reader is open. The app-local request publisher and helper PNG/result
  publishers now use `FileRenameInfoEx` replacement with POSIX semantics, which
  preserves old readers and publishes the new file. Existing no-follow, source
  transactions and error/deadline rules remain. No retry hides the failure.
- **Verification:** CI2 reproduces the failure through the public UI/core/helper
  path. CI3 passes both aspects, five functional groups and 19 warm captures with
  that reader, then hits a later core submission refusal. CI4 reproduces the
  publisher failure after 31 warm captures and retains its exact operation/code.
  CI5 passes the corrected primitive, shared recent-file caller, 200 Windows
  updates and exact-controller rehearsal. Its later reference-size failure is H26.
- **Evidence:** [L17 CI4 root cause](../tasks/evidence/canvas-rendering.md#ci4-terminal-audit-and-open-reader-replacement).

## H26. Ren'Py reference capture shrinks to the runner desktop

- **Class/search:** harness/environment; `matched window scaling required`,
  922x519, 888x666, `max_window_size`, premature reference `passed: true`.
- **Cause/correction:** the requested 1280x720 and 1024x768 windows exceeded the
  runner's available window size. Provision 1920x1080 and verify fresh user32
  metrics before SDK work. Keep actual reference-window equality as a required
  gate. A missing or undersized display fails admission; never normalize it away.
- **Receipt correction:** the old JSON `passed` field covered runtime cleanup
  before later assertions. Compute the full sample/window/geometry/source result
  after explicit cleanup, then write the receipt before asserting it.
- **Verification:** CI5 retains the red reference case. The single user-approved
  CI6 supplement verifies 1024x768 to 1920x1080 desktop preparation, both matched
  reference windows, every reference criterion/cleanup result and Windows native
  functional proof. The workflow succeeds; pixel fidelity and native timing/focus
  remain unaccepted. Six dispatches are consumed; no further run is allocated.
- **Evidence:** [L17 CI5 audit](../tasks/evidence/canvas-rendering.md#ci5-terminal-audit-and-prepared-reference-correction).


## H27. Nested PowerShell and cmd quoting prevents compiler startup

- **Class/search:** harness; Visual Studio, `Program Files`, `not recognized`,
  `vcvars64.bat`, compiler invocation.
- **Cause/correction:** nested quoting around a batch setup and compiler command
  reached `cmd.exe` with doubled leading quotes. Initialize Visual Studio through
  its PowerShell script, then pass compiler arguments directly in PowerShell.
- **Verification:** CI7 fails before compiler/SDK execution. Portable checks and
  independent review pass for the correction; native compilation passes in CI8.
- **Evidence:** [L17 CI7 audit](../tasks/evidence/canvas-rendering.md#ci7-terminal-audit-and-compiler-invocation-correction).


## H28. Forced OpenGL disables the Windows ANGLE fallback

- **Class/search:** harness; `RENPY_RENDERER`, `gl2`, `angle2`, missing OpenGL
  functions, software fallback, private desktop, empty enumeration.
- **Cause/correction:** the pinned SDK limits an explicit renderer selection to that
  backend plus software. CI8 forces `gl2`, loses the prior Windows reference's
  working `angle2` fallback and times out. Select `angle2` explicitly and continue
  rejecting software frames. Capability on the private desktop still needs proof.
- **Observation correction:** CI8 also counts inventory failures before helper
  windows exist. Keep both desktop enumerations nonempty with observer windows,
  require each observer to be enumerated, and retain API-failure rejection. A
  window-owning observer thread must process messages and stop within a bound.
- **Verification:** portable checks pass; CI9 passes corrected ANGLE2 rendering, bounded desktop
  observation and cooperative shutdown in the capability probe.
- **Evidence:** [L17 CI8 audit](../tasks/evidence/canvas-rendering.md#ci8-terminal-audit-and-windows-renderer-correction).
