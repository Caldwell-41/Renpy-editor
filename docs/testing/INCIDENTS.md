# CI incident index

Search by symptom, host, test, control or script (for example `rg -n -i 'BOM|focus' docs/testing/INCIDENTS.md`).
Read only matching entries and their linked original evidence. This is a compact
lookup index, not an execution ledger or a task selection. Detailed attempts, hashes,
consumed attempts and uncertainty stay in the linked evidence: task records at the
`archive/docs-ledgers-2026-11` tag for earlier incidents, and issue or PR comments
for later ones. Links to CI may outlive artifacts; an expired archive is not freshly
auditable evidence.

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
- **Evidence:** [first diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-2-execution.md#ci-audit-and-repository-harness-review--2026-10-16),
  [both-host corrected CI3](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38853421609).

## H02 — POSIX fixture errors or nonexistent-PID behavior on Windows

- **Class/search:** harness; `os.getuid`, permission snapshots, `os.kill(pid,0)`, WinError87.
- **Cause/correction:** broadened discovery included Mac-only ownership tests and assumed
  Unix process absence. Route only named host cases; inject absence for portable logic.
- **Regression:** `test_macos_development_credentials`, cleanup live/unknown-state refusal,
  and exact named Python exclusions in `check-thinking-evidence.py`.
- **Related Linux case:** a portable Help cleanup fixture mocked SDK execution but
  leaked the real target lookup. Supply the mocked target explicitly; keep actual
  SDK host admission strict. [Diagnosis and correction](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/help-dialog-and-canvas.md#linux-offline-ci-fixture-correction-2026-11-04).
- **Evidence:** [CI2 diagnosis and correction](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-2-execution.md#ci2-terminal-diagnosis-and-proposed-correction--2026-10-16),
  [failed run](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38850950449).

## H03 — Mocked operation finishes in one clock tick

- **Class/search:** harness; `endedMonotonic`, `startedMonotonic`, equal timestamps.
- **Cause/correction:** immediate failed-build fixture asserted strict elapsed progress.
  Use a controlled advancing clock with exact expected receipt values.
- **Regression:** `test_failed_build_preserves_exclusive_terminal_and_cannot_redispatch`.
- **Evidence:** [CI2 diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-2-execution.md#ci2-terminal-diagnosis-and-proposed-correction--2026-10-16).

## H04 — Native path separators differ from fixture or preview keys

- **Class/search:** harness; Windows backslash, `/public/node`, `Exact selected patch differs`.
- **Cause/correction:** use native `Path` for executable arguments; use normal relative
  components joined with `/` for portable snapshot keys. Preserve exact bytes/containment.
- **Regression:** `test_npm_routes_through_pinned_node_cli_without_shell`, `snapshot_paths`.
- **Evidence:** [argument fixture](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-2-execution.md#selectable-ci2-windows-harness-failure-and-narrow-correction--2026-10-12),
  [snapshot diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-2-execution.md#selectable-ci4-terminal-audit-and-portable-snapshot-correction--2026-10-12).

## H05 — ZIP fixture name normalized before archive refusal

- **Class/search:** harness/external extractor; Windows `ZipInfo`, `orig_filename`, backslash.
- **Cause/correction:** reader and writer can normalize unsafe names. Reject raw versus
  normalized name differences before extraction; preserve archive-entry defenses.
- **Regression:** `test_studio_settings_evidence.py` archive normalization/refusal cases.
- **Evidence:** [CI2 archive diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-2-execution.md#ci2-terminal-audit-and-unlocked-owner-continuation--2026-10-13).

## H06 — Approved temporary root rejected before launch

- **Class/search:** harness configuration; Windows `RUNNER_TEMP`, `TMPDIR`, `TEMP`, `TMP`.
- **Cause/correction:** Python and inherited Rust child resolved different temporary
  parents. Align environment with the approved runner root, retaining containment.
- **Regression:** native root admission fixtures and actual target preparation.
- **Evidence:** [CI3 root diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-2-execution.md#ci3-terminal-audit-and-explicit-ci-allowance-extension--2026-10-13).

## H07 — Fixture preparation consumes the request deadline

- **Class/search:** harness; Windows worker server `TimedOut`, project construction, two seconds.
- **Cause/correction:** construct/drop the unrelated project before starting the stalled
  request timer. Preserve original cancellation, EOF and shutdown assertions.
- **Regression:** `ordinary_external_configuration_change_and_project_session_reject_results`.
- **Evidence:** [generated-card first failure](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-2-execution.md#generated-card-first-ci-failure-and-correction--2026-10-11).

## H08 — Native focus/readiness or dialog children unproven

- **Class/search:** harness/missing native evidence; Windows `Save profile`, Spinner,
  Model ID, CheckBox, masked Edit, UIA, foreground, child IDs100/1/2.
- **Cause/correction:** mocked helpers and outer dialog identity left actual controls
  untested. Observe owned child type/style/visibility, focus, physical action and
  dismissal/readback; cancel the owned modal before failure cleanup.
- **Regression:** `test_studio_setup_native.py` logic, explicit
  `studio_setup_native_dialog_checks.py`, Windows focus fixtures and actual native
  sequence. Mocks do not establish native proof; CI8's exact UIA provider cause remained unknown.
- **Evidence:** [whole-sequence reassessment](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-2-execution.md#ci7-terminal-audit-and-whole-sequence-reassessment--2026-10-13),
  [child-control gap](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-2-execution.md#ci8-terminal-review--native-child-control-observation-gap--2026-10-13),
  [historical CI9 completion](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38317425509).

## H09 — Remount toggles an already-selected Beat off

- **Class/search:** harness; `physical-accept` timeout, disabled Assist, Save/Undo/Redo remount.
- **Cause/correction:** production selection toggles; the probe clicked unconditionally.
  Select idempotently and observe the selected state before the next operation.
- **Regression:** `native-probe-driver.test.ts`, full `selectable-native-sequence.dom.test.ts`.
- **Evidence:** [selectable CI6 diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-2-execution.md#selectable-ci6-terminal-audit-and-idempotent-remount-correction--2026-10-12).

## H10 — Snapshot overlaps async history; cleanup hides owner failures

- **Class/search:** harness; `Fixture unavailable`, host checkout, `RUNTIME_BUSY`, watchdog.
- **Cause/correction:** snapshot through host ownership after mutation. Bound only
  pre-dispatch contention; do not retry inner I/O failures. Attempt cleanup owners
  independently, retain timeout output, and read only the exact attempted phase report.
- **Regression:** `snapshot_paths`, `probe_cleanup`, rejecting selectable/phase gates.
- **Evidence:** [CI5 ownership diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-2-execution.md#selectable-ci5-terminal-audit-and-probe-ownership-correction--2026-10-12),
  [remaining-sequence audit](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-2-execution.md#remaining-windows-suite-review-and-approved-ci7--2026-10-12).

## H11 — SDK driver advances dialogue while at a menu

- **Class/search:** harness; both hosts `RenpyTestTimeoutError`, bare `advance`, choice screen.
- **Cause/correction:** await/assert the choice screen before the route click; retain
  ordinary advance for no-option continuation and all expected route assertions.
- **Regression:** zero-SDK generated-driver preflight in `renpy/tests/phase3a.rs`.
- **Evidence:** [CI1 diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-3-history.md#resume-and-exact-ci1-failure-audit--2026-10-13),
  [failed run](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38346032499).

## H12 — SDK scaffold import uses an accepted-document BOM rule

- **Class/search:** harness; both hosts `transport BOM must match`, generated GUI import.
- **Cause/correction:** distinguish external import encoding from captured document
  editing; retain actual input bytes, accept one transport BOM and reject multiple BOMs.
- **Regression:** all three scaffold imports in the zero-SDK `phase3a_` preflight.
- **Evidence:** [CI3 diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-3-history.md#ci3-terminal-audit-and-scaffold-import-diagnosis--2026-10-14),
  [failed run](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38428839556).

## H13 — UI/request fixtures retain an old application contract

- **Class/search:** harness; Settings Save before Connect, `Refresh models`, Characters
  navigation, missing `After`, Thinking off, identity probe timer leak.
- **Cause/correction:** run real probes through current production DOM/controller and
  compare synthetic admission against actual prepared requests with explicit modes.
  Dispose cancelled timers; version/refuse incompatible frozen-product contracts.
- **Regression:** full renderer critical consumer names, synthetic Thinking on/off
  preparation/admission, legacy Windows contract2 refusal before build/launch.
- **Evidence:** [repository harness review](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-2-execution.md#ci-audit-and-repository-harness-review--2026-10-16),
  [repair record](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-2-execution.md#harness-repair-and-second-review--2026-10-16).

## H14 — Official checksum host times out before tests

- **Class/search:** environment/acquisition; both hosts curl28, zero packages/launches.
- **Correction:** use verified official SHA-keyed archive cache and provenance-bound
  published manifest; bounded official download on miss, corrupted cache refusal.
  Record bootstrap before acquisition and retain safe early failures.
- **Regression:** `selectable-evidence.py` acquisition/identity/early-failure gates.
- **Evidence:** [selectable acquisition diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-2-execution.md#selectable-ci1-failure-audit-and-acquisition-correction--2026-10-12).

## H15 — Verbose unittest warning interrupts a completed result row

- **Class/search:** harness parser; duplicate ZIP warning, result count differs from rows.
- **Cause/correction:** a warning can appear between the test header and final `ok`.
  Parse the completed result across warning lines, while requiring exact row/count
  agreement and rejecting missing/duplicate results and extra host exclusions.
- **Regression:** `test_check_thinking_evidence.py` warning/unterminated-result fixtures.
- **Evidence:** [maintenance verification](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/ci-harness-reliability.md#implementation-and-verification).

## H16 — Hyphenated test script is absent from unittest discovery

- **Class/search:** harness selection; retention suite, zero discovery, `NO TESTS RAN`.
- **Cause/correction:** discovery ignores a filename that is not a Python identifier.
  Invoke `test-q1-package-retention.py -v` directly and require its exact named results.
- **Regression:** `test_harness_checks.py` retention missing/duplicate/skip rejection;
  the shared runner's actual retention execution remains required on both hosts.
- **Evidence:** [maintenance verification](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/ci-harness-reliability.md#implementation-and-verification).

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
- **Evidence:** [CI1 audit and repair](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/ci-harness-reliability.md#ci1-terminal-audit-and-selected-repair--2026-10-16),
  [clean-checkout verification](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/ci-harness-reliability.md#clean-checkout-repair-verification--2026-10-16),
  [both-host CI2 completion](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/ci-harness-reliability.md#ci2-terminal-audit-and-deliverable2-completion--2026-10-16).

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
- **Evidence:** [native CI1 terminal audit and proposal](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/ci-harness-reliability.md#deliverable3-native-ci1-terminal-audit-and-proposed-repair--2026-10-16).
  [Approved repair and local results](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/ci-harness-reliability.md#deliverable3-scoped-repair-preparation-and-review--2026-10-16).
  [CI3 complete native audit](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/ci-harness-reliability.md#deliverable3-ci3-terminal-audit-and-completion--2026-10-17).

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
- **Evidence:** [final native CI2 audit](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/ci-harness-reliability.md#deliverable3-final-ci2-audit-and-missed-settings-interactions--2026-10-17).
  [H19 build/rejecting-gate review](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/ci-harness-reliability.md#deliverable3-h19-build-and-pre-dispatch-review--2026-10-17).
  [CI3 terminal audit and completion](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/ci-harness-reliability.md#deliverable3-ci3-terminal-audit-and-completion--2026-10-17).

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
- **Evidence:** [early 3B execution ledger](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-3-history.md#early-execution-ledger).

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
  [3B execution ledger](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-3-history.md#early-execution-ledger)
  retains both failures, actual visibility/name facts and final results.

## P01 — Redo refuses an app-owned clean deletion

- **Class/search:** product; Draft Scene Undo/Redo, cached unavailable Source buffer, DIRTY_SOURCE.
- **Correction:** evict only exact accepted clean buffers after successful app deletion;
  preserve external missing-source and dirty/conflict protections.
- **Regression:** production Draft history with refresh, Undo/Redo and process reopen.
- **Evidence:** [reproduced product diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-2-execution.md#draft-scene-ci-artifact-audit-and-redo-correction--2026-10-10).

## P02 — Windows partial-body cancellation does not close promptly

- **Class/search:** product; shutdownNotConnected10057, server TimedOut10060, missing EOF.
- **Correction:** share the actual TcpStream between cancellation and transport. The
  exact Winsock internal cause was not established; do not generalize clone behavior.
- **Regression:** header/body cancellation requires owned socket, shutdown, Cancelled,
  EOF and the original two-second bounds. Initial timing-only diagnosis was provisional.
- **Evidence:** [decisive handle/phase evidence](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-2-execution.md#generated-card-third-ci-audit-and-exact-handle-repair--2026-10-11).


## H22 — Scratch screen preview selects a menu context

- **Class/search:** product/helper and missing diagnostic evidence; scratch preview,
  geometry timeout, `_main_menu_screen`, `suppress_overlay`.
- **Cause/correction:** the initial job redirected a menu label. The pinned SDK's
  `_enter_menu` enables menu state and suppresses overlays. The correction redirects
  the ordinary `start` label and keeps skip-menu/skip-splash behavior inside the SDK
  runtime adapter. Qualification requires `main_menu == False`, geometry, retained
  process status and cleanup. The correction passes both-aspect Mac SDK service proof; native/Windows proof remains pending.
- **Evidence:** [Help outcome attempts](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/help-screen-production.md#local5-result-cancelled-local6-and-corrected-local7).

## H23. Help gate assumes an owned Windows Stop exits with zero

- **Class/search:** qualification assumption; `STATUS_CONTROL_C_EXIT`, `-1073741510`,
  `CTRL_BREAK_EVENT`, `Expected successful validation or owned Stop`.
- **Cause/correction:** the supervisor requests console-control cancellation and keeps
  its raw exit status. Three gates accepted only zero or a Unix signal result. Accept
  the exact Windows control exit only for cancelled owned Stop with complete cleanup,
  untruncated evidence and no runtime error. Keep raw codes and reject abnormal results.
- **Regression:** Rust/Python gates and the real native probe script through the
  bridge/core with a marked runtime test double cover positive and rejecting states.
- **Evidence:** [CI2 diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/help-screen-production.md#ci2-retained-audit-and-causal-diagnosis).

## H24. Desktop check precedes the frontend build in a clean checkout

- **Class/search:** workflow prerequisite; Tauri `generate_context!`, `frontendDist`,
  `../dist`, `this path doesn't exist`, both Windows and Mac.
- **Cause/correction:** the L01 workflow checked the desktop before running the
  existing frontend build. Local ignored output masked the dependency. Move the
  frontend build before the desktop check, preserving both checks and all selectors.
- **Verification:** reproduce the missing-output failure in a disposable clean
  export, then run the frontend build and the same desktop check in that export.
- **Evidence:** [L01 CI1 audit](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/owned-blank-screen.md#ci1-terminal-audit-and-workflow-correction).

## P03. Initial Screens catalog read stops on service contention

- **Class/search:** product integration; `RUNTIME_BUSY`, Screens, missing Choose,
  `Another request is in progress. Input retained.`
- **Cause/correction:** the new `screens.list` read bypassed the existing ordered
  observations and bounded read retry. Add catalog/inspection reads to the request
  lane and catalog reads to the read-only retry list. Never replay mutations.
- **Regression:** held-service request-lane cases and the production renderer/core
  controller with a refused initial catalog read reproduce the failure and pass
  after correction. Current-package native proof remains required.
- **Evidence:** [L01 native diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/owned-blank-screen.md#ci2-terminal-audit-and-native-correction).

## H25. Screen probe omits rich-editor and early-failure states

- **Class/search:** harness; textarea, CodeMirror, `Timeout: open`, missing owned
  metadata, missing result JSON, PowerShell `RUNNER_TEMP`.
- **Cause/correction:** rehearse the packaged rich editor, observe its existing
  selection after focus and retain the awaited control on failure. Failed ownership
  and metadata retention must still reach fixture cleanup and failed-result emission.
  PowerShell identity output uses `$env:RUNNER_TEMP`.
- **Regression:** exact busy/rich-editor browser controller and whole-runner synthetic
  success, early-failure and unreadable-metadata cases. These are not native passes.
- **Evidence:** [L01 CI2 corrections](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/owned-blank-screen.md#ci2-terminal-audit-and-native-correction).

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
- **Evidence:** [L17 CI4 root cause](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/canvas-rendering.md#ci4-terminal-audit-and-open-reader-replacement).

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
- **Evidence:** [L17 CI5 audit](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/canvas-rendering.md#ci5-terminal-audit-and-prepared-reference-correction).


## H27. Nested PowerShell and cmd quoting prevents compiler startup

- **Class/search:** harness; Visual Studio, `Program Files`, `not recognized`,
  `vcvars64.bat`, compiler invocation.
- **Cause/correction:** nested quoting around a batch setup and compiler command
  reached `cmd.exe` with doubled leading quotes. Initialize Visual Studio through
  its PowerShell script, then pass compiler arguments directly in PowerShell.
- **Verification:** CI7 fails before compiler/SDK execution. Portable checks and
  independent review pass for the correction; native compilation passes in CI8.
- **Evidence:** [L17 CI7 audit](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/canvas-rendering.md#ci7-terminal-audit-and-compiler-invocation-correction).


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
- **Evidence:** [L17 CI8 audit](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/canvas-rendering.md#ci8-terminal-audit-and-windows-renderer-correction).

## H29. A new workflow cannot be dispatched before GitHub registers it

- **Class/search:** workflow discovery; HTTP 404, workflow not found on default branch.
- **Cause/correction:** the comparison workflow existed only on the development
  branch. GitHub rejected its standalone dispatch before creating a run. Call it
  with `workflow_call` from the registered Screens workflow at the same commit.
  Keep an exclusive comparison selector, legacy-job exclusions and caller-only
  concurrency. Preserve exact candidate, attempt and cumulative-ordinal guards.
- **Verification:** actionlint and all 16 selector combinations pass; both review
  axes report no findings. The rejected attempt remains charged. Actual Windows
  execution remains pending under the owning evidence record.
- **Evidence:** [Matched comparison continuation](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/canvas-rendering.md#mac-matched-comparison-and-dispatch-correction).

## P05. Canvas image updates cancel a captured drag

- **Class/search:** product interaction; `showFrame`, `append(target)`,
  `lostpointercapture`, `Move cancelled`, jumping frame, unclear drag target.
- **Cause:** reattaching an existing selection target on helper-image delivery
  drops pointer capture and cancels movement. The outline also waits for helper
  images; child selection targets intercept clicks over parts of the frame.
- **Verification:** the real controller/Chrome diagnostic reproduces capture loss.
  The production correction leaves attached targets in place; the controller test
  and real-helper Chrome rehearsal pass. The test blocks HMR during held gestures.
  Immediate feedback and drag-target alternatives await design approval; native
  smoothness remains pending. The separate probe-clamping correction passes both
  parent bounds with exact source/geometry/Undo checks.
- **Evidence:** [Diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/canvas-rendering.md#probe-movement-bounds-and-drag-diagnosis)
  and [capture correction](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/canvas-rendering.md#capture-preservation-and-drag-alternatives-2026-10-24).


## H30. Native drag oracle rejects JSON alignment roundoff

- **Class/search:** harness; `Accepted source did not settle`, `0.9222222222222224`,
  `332.00000000000006`, `canvas-input`, physical drag.
- **Cause/correction:** the oracle demands one decimal spelling for a floating-point
  alignment. Arithmetic and the pinned JSON parser can change its last bit. Admit
  at most two machine epsilons in the two alignment literals while requiring all
  other source bytes unchanged. Compare helper geometry exactly with the admitted
  source values; retain the independent snapped-input calculation and exact Undo.
- **Regression:** the real-controller 280x152 movement reproduces the failure;
  a linked parser check isolates its last-bit change. The source comparator rejects
  a one-pixel difference, changed dimensions/comments/whitespace, integer alignment,
  expressions and extra lines. This change grants no image-pixel tolerance.
- **Evidence:** [Signed Mac qualification](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/canvas-rendering.md#signed-mac-handle-qualification-2026-10-24).

## H31. Unposted macOS events have no clock timestamp

- **Class/search:** recorder harness; CGEvent timestamp zero, Mach ticks,
  CoreMedia host clock, `clockValidated`.
- **Cause/correction:** a newly created keyboard event reports timestamp zero.
  Compare converted Mach time against CoreMedia's host clock in a measured bracket
  instead. Stamp each injected event explicitly and retain times before/after posting.
- **Verification:** the compiled preflight checks clock agreement without capture,
  posted input or permission requests. Offline receipts reject unvalidated clocks,
  wrong ordering, stale pixels and delayed/missing results. Live capture remains
  pending separate permission and qualification.
- **Evidence:** [Recorder selection and results](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/canvas-rendering.md#standalone-mac-recorder-selection-2026-10-24).

## H32. Mac recorder rejects an unlocked console

- **Observed:** first live capture-only plan refuses `Unlocked console required`
  despite the existing independent native check reporting console/unlocked true.
- **Cause/correction:** CGSession.h defines `kCGSessionOnConsoleKey` as the wire key
  `kCGSSessionOnConsoleKey`. The recorder used the macro name as a literal lookup.
  `c827ec7` corrects only that key and preserves all safety checks.
- **Verification:** with permissions available, the existing impossible-target CLI
  test reproduces the false refusal before correction; all twelve recorder checks
  and both independent review axes pass afterward. Preflight alone does not prove
  the live console/foreground/capture path.
- **Evidence:** [native 8 preparation and console correction](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/canvas-rendering.md#mac-timing-native-8-preparation-and-console-correction-2026-10-24).

## H33. Slow settled references do not identify fast provisional content

- **Observed:** Mac timing admission accepted 101 distinct settled references, but
  the 60 Hz workload displayed translated provisional content. Exact settled matches
  therefore did not count all visible responses. A helper replacement can also change
  the source raster during the gesture.
- **Cause/correction:** reference preparation selected each slow interval's last
  frame and transferred its hash to a different rendering route without checking
  equivalence. Future recorder plans declare the endpoint. Visible-content plans
  require exact invariant references across reachable content routes and source
  generations; unknown/differing variants refuse. Native provenance remains an
  independent admission requirement. Settled pixel equality cannot prove confirmation.
- **Verification:** retained replay changes from accepted to refused at the plan
  gate; timing arithmetic stays unchanged. Compiled/Python checks cover route transfer,
  generation rollover and omitted content inputs. Public DOM checks verify the actual
  move/text/resize routes without claiming native presentation.
- **Evidence:** [Mac reference-boundary correction](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/canvas-rendering.md#mac-measurement-reference-boundary-correction-2026-10-24).

## H34. Optional compiled-recorder tests break ordinary discovery

- **Observed:** ordinary `test_*.py` discovery selected nine recorder checks without
  their binary. Their skips violated the shared Python gate's exact host exclusions.
- **Correction:** keep offline tests in ordinary discovery and select compiled
  checks explicitly under a different module name. Missing explicit setup fails;
  the shared skip gate remains strict.
- **Verification:** actual discovery regression fails before the change and passes
  afterward; the general Mac runner passes all four groups without a recorder.
- **Evidence:** [Automatic code checks](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/active/automatic-code-checks.md#verification-and-review).
  [Test selection reduction](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/active/test-selection.md#local-validation)
  applies the same split to the Windows dialog fixture. Its known foreground
  failure remains a failed explicit native check, outside offline discovery.

## H35. Sleeping Mac display suspends a packaged WKWebView probe

- **Observed:** the native composition probe had a 247.935-second history gap
  although source had already changed. Browser and Windows checks did not reproduce it.
- **Cause:** the display was asleep before launch. WebKit dropped its assertions,
  and macOS suspended the exact WebContent child for 246.297 seconds. An attempted
  CUA inspection woke the display and resumed that child. The long pause is a host
  condition admitted by the runner, not evidence of a composition/request-lane defect.
- **Prevention:** the shared runtime runner now verifies an unlocked, awake desktop
  and holds owned IOKit display-sleep/system-idle assertions for each native child.
  It retains admission and individual release receipts. Child cleanup covers
  timeout, interruption and output-reader startup failure before power release.
  System-idle prevention alone did not keep the display awake.
- **Verification:** replay of original native/OS receipts matches process ownership,
  explicit suspension/resumption and the display-wake intervention. No fresh native
  session or product timing claim was needed. Keep UI-process events distinct from
  renderer events when auditing suspension. Portable boundary tests and actual Mac
  locked-host refusal/power-API checks cover the correction. The final signed
  composition candidate passes seven groups and cleanup in 9.425 seconds.
  A separate external display-awake assertion was active, so this is functional
  verification rather than an isolated sleep-prevention timing experiment.
- **Evidence:** [Mac pause diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/simple-help-layout.md#mac-pause-cause-established-2026-10-27),
  [runner correction](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/simple-help-layout.md#mac-native-runner-correction-selected-2026-10-27).

## H36. Empty composition text loses field focus

- **Cause:** local refusal rerendered the form and replaced its focused textarea;
  errors had no field association or completion validation.
- **Correction:** reuse the shared authoring field validator on blur/submission,
  preserve IME input and focus the same invalid control without rerendering.
- **Verification:** component regressions reject lost focus/missing association;
  the current renderer/core and signed native probe require a positive validation
  checkpoint with unchanged source and retained input.
- **Evidence:** [Final review corrections](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/simple-help-layout.md#final-implementation-review-and-corrections-2026-10-27).

## H37. Desktop-exit errors skip native fixture cleanup

- **Cause:** a Mac desktop guard exception escaped after child execution and bypassed
  the remaining helper/fixture audit, cleanup and final failed result.
- **Correction:** distinguish desktop errors and retain them in the failed result
  while independent cleanup owners finish. Prelaunch refusal still prevents launch.
- **Verification:** actual-runner fixtures complete source/metadata and fixture
  cleanup under post-child lock or assertion-release failure; neither becomes a pass.
- **Evidence:** [Final review corrections](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/simple-help-layout.md#final-implementation-review-and-corrections-2026-10-27).

## H38. No-op geometry saves lose owned hierarchy state

- **Class/search:** product; unchanged size/position, null root ID, missing protected
  rows, "Choose an owned container" after Apply.
- **Cause/correction:** no-op geometry returned a raw parser document while changed
  saves returned ownership annotations. Annotate the captured document on both
  no-op paths so the same source revision retains the same owned model.
- **Verification:** dispatch coverage for size, pixel-property and position no-ops,
  exact source and Undo/Redo; production controller/core check accepts root Add afterward.
- **Evidence:** [No-op geometry correction](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/simple-help-layout.md#local-no-op-geometry-ownership-correction-2026-10-27).


## H39. Pending numeric Apply loses focus and cleanup masks the assertion

- **Class/search:** product focus and harness cleanup; Mac Help controller,
  RUNTIME_BUSY, BODY focus, Driver cleanup exit null (SIGTERM).
- **Cause/correction:** disabling the focused Apply button during IPC lets the
  browser move focus to BODY. A fast response can hide this. Apply now uses
  aria-disabled while its existing busy/saving guard refuses duplicate submissions.
  The test releases its owned service hold and records the first error before
  teardown, so cleanup cannot replace the original assertion.
- **Regression:** hold the unchanged real-core busy reply across acknowledged
  rendering turns; verify retained control focus/input, no duplicate Enter write,
  unchanged source and normal driver exit. The packaged Help probe also checks
  focus after clicked Apply.
- **Evidence:** [PR #66 CI2 diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/numeric-layout.md#ci2-root-cause-and-affected-requalification).


## H40. Import hashing overflows the Windows main stack

- **Class/search:** product; `0xC00000FD`, `3221225725`, first image selection,
  controller cleanup exit, missing import Display name.
- **Cause/correction:** import hashing and streaming-copy helpers used 1 MiB stack
  arrays. Allocate those buffers directly on the heap; retain limits, hashes,
  source authority and ordinary recovery. Do not increase the product stack.
- **Regression:** public UI-image and Background selection/preview/import in a
  child with a 256 KiB stack; verify exact accepted bytes and hashes. Actual Windows
  main-thread/controller and package proof remains a separate target gate.
- **Evidence:** [L06 CI1 diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/ui-image.md#ci1-windows-import-stack-failure).

## H41. Normal-entry image capture differs under an unrecorded renderer

- **Class/search:** harness/evidence; Windows UI image, 149 differing WebP-edge
  pixels, dummy video, software fallback, private `render_to_texture` export.
- **Observed/correction:** exact geometry and successful normal-entry execution
  did not establish pixel fidelity. The old capture recorded no backend; a product
  decoder defect was not established. Select and admit native GL2/ANGLE2, use public
  Render capture, and preserve exact independent-reference equality.
- **Regression:** reject missing/fallback renderers, unstable repeated capture and
  whole-window capture of an empty Render. Both-host normal entry and helper pass
  both aspects with exact pixels after correction; original CI2 remains failed.
- **Evidence:** [L06 capture diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/ui-image.md#ci2-windows-capture-failure-and-reassessment),
  [CI3 audit](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/ui-image.md#ci3-success-audit-and-review-ready-outcome).


## H42. Image Apply admits edits that its completion clears

- **Class/search:** product; UI-image Apply, Use original, retained draft, embedded
  numeric layout, delayed media validation and commit.
- **Cause/correction:** original-size editing omitted the image-saving reservation,
  and embedded layout observed only core-write busy state. Apply the same saving
  state to every draft-producing control throughout validation and commit.
- **Regression:** hold media and core completion separately; verify reserved original
  size, readonly layout and alignment, then success/conflict retention and restored
  editing. The actual controller/core also checks a held Apply and unchanged Source.
- **Evidence:** [Pending image Apply ownership](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/ui-image.md#pending-image-apply-edit-ownership-2026-10-29).


## H43. Numeric controller assumes the toolbar survives element removal

- **Class/search:** browser fixture; numeric layout, deleted selected text,
  image selection, missing Refresh Source, timeout.
- **Cause/correction:** removing the selected Help text leaves the adjacent image
  selected. Its Design view hides the shared toolbar. The numeric journey assumed
  Refresh Source was still visible. Return to Choose before refreshing.
- **Verification:** the untouched PR #68 frontend reproduces the same timeout and
  hidden toolbar. The corrected journey passes against the integrated candidate
  without changing production UI or its deadline.
- **Evidence:** [Architecture refactor validation](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/ui-image.md#pr-68-architecture-refactors-2026-10-29).

## H44. Fixture construction uses the ordinary request deadline

- **Class/search:** harness; initial ready response, driver startup, Windows,
  `Driver reply deadline exceeded`, no browser artifact.
- **Cause/correction:** the JSON process client started the ordinary reply timer
  while the child constructed its disposable project. Separate the bounded
  construction wait from unchanged per-request timing. Retain fixed preparation
  phases and serialize null geometry when no browser exists.
- **Regression:** the controlled delayed-start process passes construction, then
  refuses a stalled ordinary reply and confirms child exit. Both actual font
  controller paths pass; Windows requalification remains pending.
- **Evidence:** [L05 CI1](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/project-fonts.md#ci1-failure-and-root-cause-correction).

## H45. Passive font reads bypass the shared request lane

- **Class/search:** product; packaged font Apply, `RUNTIME_BUSY`, a second specimen
  loading while the first selected font is already decoded.
- **Cause/correction:** font reads bypassed the application lane and could own the
  native service during Apply. Serialize passive font/image reads and Asset import
  with Screens writes; runtime Stop remains independent.
- **Regression:** exact production probe with a held font response rejects an
  overlapping Apply before the fix and passes afterward. The lane test covers
  every affected read against text Apply and import.
- **Shared Style follow-up:** a fitted capture's frame corner also has partial
  coverage and premultiplied RGB. Compare semantic color in that convention,
  retain opaque interior proof and exact source/literal/helper equality, and record
  raw/expected samples. Retained Windows/Mac replay passes; missing border, filled
  interior and even a one-unit literal RGB/alpha difference still fail.
- **Evidence:** [L05 CI2 audit](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/project-fonts.md#ci2-audit-and-corrections),
  [L07 correction](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/shared-look.md#root-cause-correction-and-bounded-ci2-2026-10-31).

## H46. Physical capture size mistaken for virtual resolution

- **Class/search:** harness; Windows SDK/helper font pixels, physical dimensions,
  virtual 1280 by 720, `drawPerVirtual`.
- **Cause/correction:** the engine may fit the requested physical window to the
  desktop. Require matching actual physical dimensions and drawing scale between
  reference and helper, while preserving exact virtual size and strict pixels.
- **Regression:** retained Windows and Mac captures pass; wrong physical size,
  scale, source, missing reference, blank and fallback-font evidence all fail.
- **Shared Style follow-up:** a fitted capture's frame corner also has partial
  coverage and premultiplied RGB. Compare semantic color in that convention,
  retain opaque interior proof and exact source/literal/helper equality, and record
  raw/expected samples. Retained Windows/Mac replay passes; missing border, filled
  interior and even a one-unit literal RGB/alpha difference still fail.
- **Evidence:** [L05 CI2 audit](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/project-fonts.md#ci2-audit-and-corrections),
  [L07 correction](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/shared-look.md#root-cause-correction-and-bounded-ci2-2026-10-31).

- **Controls follow-up:** raw source PNG bytes also differ from native render
  readback. Both targets produce source-minus-one RGBA for the six-state fixture.
  Windows fitted reference edges differ while helper crops are uniform. Preserve
  exact pixels and capture conditions; use independent whole-frame native
  references. Corrected Mac admission passes all twelve crops with zero residual;
  Windows pixels also match exactly, but reference scale1.5 differs from helper1.0.
  Production pins `RENPY_HIGHDPI=1.0`; the reference launcher omitted it. The
  corrected launcher and offline launch-boundary regression now pass. Windows
  start18 also passes exact native/helper admission with matching scale1.0;
  errors now print both actual capture conditions. See
  [the control diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/bars-and-image-buttons.md#continuation-and-passive-helper-diagnosis-2026-11-06).

## H47. Shared Apply hides text dimensions

- **Class/search:** product; text Width/Height, wrapping width, `sharedCommit`.
- **Cause/correction:** shared commit ownership also suppressed dimensions because
  the image inspector supplied its own. Separate dimension visibility from commit
  ownership so text keeps its controls and images avoid duplicates.
- **Regression:** the actual controller journey fails with zero text Width controls,
  then passes dimension Apply, exact Source and grouped Undo/Redo. The image
  controller still passes with one set of dimensions.
- **Evidence:** [L05 review corrections](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/project-fonts.md#independent-pr-review-corrections-2026-10-30).

## H48. Text inspector bypasses field-completion validation

- **Class/search:** product; Size/Color/Text blur, invalid correction, import names.
- **Cause/correction:** new inspector fields used submit-only validation and cleared
  errors on any input. Reuse `validateField` for completion and valid correction,
  retaining per-node errors separately from Source/font failures.
- **Regression:** red blur cases for Size and import names turn green. Actual
  controller checks cover Text/Color, still-invalid correction, IME, focus,
  unchanged Source and retained Source-conflict feedback.
- **Evidence:** [L05 review corrections](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/project-fonts.md#independent-pr-review-corrections-2026-10-30).


## H49. Font admission accepts an empty character-map container

- **Class/search:** product; malformed TTF/OTF, empty cmap, import succeeds before
  FontFace decoding rejects the font.
- **Cause/correction:** presence of a cmap table did not establish a parsed base
  character map. Require a supported parsed base subtable in the shared validator
  used by preview, import and presentation.
- **Regression:** public preview/import reject the licensed TTF fixture after its
  encoding-record count is set to zero; source, metadata and prior history stay
  intact. Valid TTF/OTF import/history/reopen still pass.
- **Evidence:** [L05 root-cause corrections](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/project-fonts.md#font-admission-and-stale-text-corrections-2026-10-30).

## H50. Retained text drafts compare with the old saved node

- **Class/search:** product; Source refresh, stale text, matching saved literal,
  Apply conflict after resolving input, old-value discard.
- **Cause/correction:** the draft matcher compared against the original node.
  Compare all text/typography fields with the current accepted node; keep the
  original revision until the full draft matches, then clear its errors.
- **Regression:** actual controller/core checks cover current-value resolution,
  subsequent edit/history, old-literal retention, divergent typography and full
  conflict resolution without writing Source.
- **Evidence:** [L05 root-cause corrections](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/project-fonts.md#font-admission-and-stale-text-corrections-2026-10-30).

## H51. Hierarchy Enter submits the text draft it opens

- **Class/search:** product; hierarchy Enter, retained text, new editor listener,
  incomplete text-property fixtures.
- **Cause/correction:** the row opened Design without consuming Enter. The newly
  mounted text editor received the same bubbling event and ran Apply. Stop
  propagation in the row's Enter handler after it accepts the navigation action.
- **Regression:** existing text/textbutton focus cases now use core-shaped typed
  documents. The actual controller/core journey first observed changed Source,
  then passed retained input, focus and unchanged Source after the correction.
- **Evidence:** [Text ownership maintenance](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/screen-text-ownership.md#hierarchy-enter-correction).


## H52. SDK border and helper conversion differ from the intended appearance

- **Class/search:** product/harness; filled border interior, Frame centre size,
  foreground dictionary, RevertableDict, unchanged button-state captures.
- **Cause/correction:** Frame reserves two centre pixels; fixed rectangles and a
  two-pixel transparent centre preserve borders. The trusted helper converts typed
  foreground records without testing against Ren'Py's store dictionary subclass.
  Qualification processes queued redraws before capturing changed states.
- **Regression:** normal and helper output matches independent literal screens;
  border/interior semantic checks and distinct-state checks reject the original
  wrong output. Runtime render errors exit with a bounded diagnostic.
- **Evidence:** [L07 diagnosis and qualification](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/shared-look.md#implementation-and-first-sdk-diagnosis).


## H53. Helper qualification omits implicit SDK validation starts

- **Class/search:** operation accounting; helper startup allowance, SDK --version,
  managed installation and discovery.
- **Cause/correction:** each fresh helper fixture starts three SDK validation
  commands before its helper. Count staged validation, post-promotion discovery
  and initial canvas discovery separately from the helper process. The L07 helper
  receipt now records the existing adapter spawn counter and checks this count.
- **Evidence:** [L07 corrected operation accounting](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/shared-look.md#corrected-operation-accounting).
  The old Mac receipt lacked this counter. Its reconstructed SDK overrun remains
  recorded; the added counter awaits actual Windows execution.


## H54. Controller closes preview before acknowledging queued delivery

- **Class/search:** harness; Style assignment, canvasRequests, zero-delay timer,
  exposed binding, correct fields but Starting canvas status.
- **Cause/correction:** awaiting a review-close click does not acknowledge a
  queued canvas request or real-core reply. Keep the review open until a preview
  matching path/screen/node/revision passes the actual core plan, then inspect its
  appearance. Preserve the existing deadline and record correlated request/plan
  diagnostics.
- **Regression:** the original real-controller assertion fails with correct queued
  payloads and no delivered request under controlled scheduling. The corrected
  journey passes under the same schedule without a sleep or retry in the test.
- **Evidence:** [L07 CI2 audit and correction](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/shared-look.md#ci2-terminal-audit-and-controller-acknowledgement-correction-2026-10-31).


## H55. Cross-run helper reuse pairs different authored source snapshots

- **Class/search:** harness; accepted.json mismatch, random project UUIDs, copied
  style names, asset IDs, visually identical but different source revisions.
- **Cause/correction:** unchanged authoring code does not create byte-identical
  projects. Export source once and give fresh normal/helper producers that same
  snapshot. Remove the cross-run reuse path; keep exact manifest/source/pixel
  checks and report both manifest hashes when provenance differs.
- **Regression:** full consumer accepts 32 same-source pairs and rejects another
  project's manifest despite identical pixels. Actual failed CI3 identity still
  refuses, while copied same-source retained captures pass all five rejecting cases.
- **Evidence:** [L07 CI3 audit and full correction](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/shared-look.md#ci3-terminal-audit-and-fresh-full-ci4-correction-2026-10-31).

## H56. A concurrency group cancels a waiting validation reporter

- **Class/search:** CI coordination; cancelled start reporter, higher-priority
  waiting request, concurrency group, dummy job skipped.
- **Cause/correction:** the default concurrency queue retains one pending job;
  another request replaces it even with `cancel-in-progress: false`. Overlapping
  automatic/manual runs lose a reporter and cancel the dependent dummy. Use
  `queue: max` on the shared status reporter while retaining serialized updates.
- **Verification:** the original GitHub check annotation identifies replacement
  by another waiting request. The cancelled trial is failed evidence. Live overlap
  verification and terminal audit belong to the issue and PR #73.
- **Evidence:** [CI reporter queue diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/active/ci-validation.md#passing-trial-exposed-reporter-queue-cancellation).

## H57. Nested layout journey uses the hierarchy before Source refresh completes

- **Class/search:** browser fixture; Windows nested layout, strict-grid removal,
  empty-cell policy, Refresh Source, missing refusal, open removal dialog.
- **Cause/correction:** a Source save followed by Refresh Source does not synchronously
  install the new document. The fixture selected the old child and opened removal
  while reload was pending. Wait for the refreshed grid's visible columns before
  proceeding after both Source replacements.
- **Verification:** a held catalog response reproduces the old open dialog and
  original assertion timeout. The corrected real controller/core journey passes
  with the held response and normally, preserving the existing deadline.
- **Evidence:** [Audit-fix CI1 diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-3b-audit-fixes.md#ci1-failure-and-controller-ordering-correction).

## H58. Resize feedback inherits the movement-eligibility guard

- **Class/search:** product; screen-root frame, provisional resize guide, fixed
  parent, missing alignment axis, held helper response.
- **Cause/correction:** a nested-frame coordinate fix required two explicit
  alignments before updating any provisional dimensions. That excluded ordinary
  screen-root children and other literal resize targets. Use screen/fixed parent
  bounds and canonical position/anchor values independently of movement eligibility;
  retain the helper fallback for ambiguous parents.
- **Regression:** held-response DOM cases check immediate and settled geometry,
  focus, revision-bound submission, refusal retention and cancellation. Existing
  nested-fixed and ambiguous-parent cases remain covered.
- **Evidence:** [Independent-review corrections](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/phase-3b-audit-fixes.md#independent-review-corrections).

## H59. LibreSSL derives a fixture serial path outside a dotted worktree

- **Class/search:** harness; TLS fixture, OpenSSL, LibreSSL, CAcreateserial,
  extensionless CA certificate, dotted parent directory, sandbox write refusal.
- **Cause/correction:** automatic serial-path derivation uses the last dot in the
  CA certificate's full path. An extensionless certificate below a dotted parent
  can place the serial file outside the fixture. Supply `-CAserial` with an explicit
  path inside the same owned temporary root before allowing broader execution.
- **Verification:** actual host certificate preparation under a dotted temporary
  path now creates the serial and certificate inside that root and cleans up all
  generated material. No listener, provider request or native application runs.
- **Evidence:** [TLS fixture isolation](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/components-and-help-panel.md#tls-fixture-isolation).

## H60. Normal-entry fixture calls Start outside a menu context

- **Class/search:** harness; Ren'Py testcase, Start(), JumpOutException, missing menu.
- **Cause/correction:** a minimal fixture without a main-menu interaction had already
  entered the story when the hook invoked Start, which jumps out of a menu context.
  Supply a fixture-only menu and require observed menu entry before Start. Preserve
  accepted bootstrap and Story bytes. Suite teardown must account for all unselected
  cases before exit; each selected positive result remains mandatory across the campaign.
- **Verification:** the first SDK failure and exact pinned implementation establish
  the cause. Cheap admission checks require the new entry signal; corrected SDK
  execution remains pending at this record.
- **Evidence:** [Entry diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/components-and-help-panel.md#first-help-sdk-campaign-and-entry-diagnosis).

## H61. Exact completion-line comparison rejects reporter whitespace

- **Class/search:** harness admission; Ren'Py rpytest Status PASSED, trailing space.
- **Cause/correction:** the pinned reporter emits a trailing space on its completion
  line; a byte-identical line-count check rejected an otherwise valid result.
  Remove trailing line whitespace before exact status/uniqueness checks. Preserve
  all case, duration, source-identity and observation requirements.
- **Verification:** the new cheap assertion fails before correction and passes
  afterward; the retained real Show log now admits without another SDK process.
  Its original failed campaign remains failed and the other cases remain unrun.
- **Evidence:** [Reporter admission](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/components-and-help-panel.md#second-help-sdk-campaign-and-reporter-admission).

## H62. Interrupted bounded command skips process cleanup

- **Class/search:** harness adapter; KeyboardInterrupt, orphan process, repeated
  killpg, EPERM, bounded output queue.
- **Cause/correction:** the post-launch read loop had no unwind cleanup. A real
  interruption left its process alive. Repeated group kills also signalled an
  already-terminated group. Cleanup now reaps the process and drains/closes the
  reader on unwind; stop requests are idempotent and incomplete pipe cleanup errors.
- **Verification:** the new real-process cancellation case first fails, then all
  thirteen adapter tests pass on macOS. A syscall trace separates repeated-kill
  EPERM from a denied initial termination. Windows target evidence remains pending.
- **Evidence:** [Cancellation correction](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/components-and-help-panel.md#component-harness-review-and-shared-cancellation).

## H63. Design Lab approval loading exceeds initial navigation deadline

- **Class/search:** browser harness; initial page.goto, 8000 ms, zero cases,
  approval source fingerprints, per-file Git subprocesses, shared Vite cache.
- **Cause/correction:** generating virtual approval metadata reads each approved
  source blob in a separate Git process. The real loader takes 19.7 seconds before
  the page can load. One bounded batch object read preserves the exact blob bytes
  and framing checks; the equivalent verification takes 0.35 seconds. The runner
  also puts its cache under its worktree-local output rather than shared dependencies.
- **Verification:** real Git/shared-source approval checks pass, including binary
  newline and Unicode inputs; the exact approved A2 fingerprint remains identical.
  The corrected current-source gate passes 1,216 rendering cases, 29 groups and
  nine actual approval/source guards. Its original zero-case timeout and later
  interaction failures remain failed, with their separate corrections retained.
- **Evidence:** [A2 integration](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/components-and-help-panel.md#a2-approval-integration-and-first-production-ui-wiring).


## H64: Image evidence dependency install rejected by managed macOS Python

- **Class/search:** CI environment; pip, externally-managed-environment, Homebrew,
  Pillow, harness regressions, macos-26.
- **Cause/correction:** the paired harness job installs Pillow directly into the
  runner's externally managed Python. macOS refuses before any harness group runs.
  Create a job-local virtual environment, install the pinned dependency there and
  export its interpreter to later steps. Keep system package protections intact.
- **Verification:** original CI1 has successful Windows groups but a failed Mac
  dependency step; retained partial Mac evidence has no result. Actionlint and local
  interpreter-isolation checks pass. Corrected paired run 41548765954 at `ee17b94`
  passes all four harness groups on both hosts; exact-head artifacts and declared
  checkout filters verify. Original failed Mac preflight remains failed.
- **Evidence:** [CI1 diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/components-and-help-panel.md#ci1-macos-dependency-failure-and-isolated-environment-correction).


## H65: Native form validation bypasses component-name errors

- **Class/search:** product/test; Enter, component name, pattern, requestSubmit, aria-invalid.
- **Cause/correction:** the shared naming form left native pattern validation enabled,
  so invalid submission stopped before the shared field validator. Disable native
  form validation there; keep the existing validator as the submission owner.
- **Regression:** use `requestSubmit()` in the existing naming test. Directly dispatching
  `submit` bypassed the browser gate. Assert associated error, retained input/focus
  and no write. The case fails before the fix and passes afterward.
- **Evidence:** [Naming correction](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/components-and-help-panel.md#component-name-submission-correction-2026-11-03).

## H66: Inline script loading loses sibling imports

- **Class/search:** CI caller; `runpy`, `ModuleNotFoundError`, `runtime_probe_cases`,
  failure-artifact sealing.
- **Cause/correction:** the utility normally runs with its script directory on
  Python's import path. An inline caller used `runpy` without that directory, so
  nested sibling imports failed. The caller now supplies the directory; the
  established utility stays unchanged.
- **Verification:** the import error reproduces locally. Corrected invocation
  retains both actual executables, verifies hashes, emits the source/manifest
  receipts and passes the artifact privacy scan.
- **Evidence:** [Offline CI correction](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/help-dialog-and-canvas.md#linux-offline-ci-fixture-correction-2026-11-04).

## P06. Canvas JSON decoding changes fractional geometry

- **Class/search:** product; fractional geometry, exact comparison, one ULP,
  `448.20000000000005`, `float_roundtrip`, Canvas status.
- **Cause/correction:** the pinned JSON decoder's default floating-point path changes
  this helper coordinate to `448.2000000000001`. Enable its lossless round-trip
  feature. Keep the renderer and exact pixel/geometry comparison unchanged.
- **Regression:** the production Canvas status path with the existing controlled
  child reproduces the changed coordinate before the fix and preserves its exact
  floating-point bits afterward. The child exits and its scratch is removed.
- **Evidence:** [Matched captures and geometry diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/help-dialog-and-canvas.md#mac-matrix-and-exact-geometry-diagnosis).

## H67. Nonblocking Dialog actions lose source protection

- **Class/search:** product; Dialog, Return, Finish, modal False, duplicate modality,
  protected source, button removal.
- **Cause/correction:** interaction qualification admitted Return by owned-screen
  kind without proving blocking state. The shared owner now proves a single exact
  root `modal True` before qualifying local Return and game-menu dismissal.
- **Regression:** public inspection/composition retains protected actions and
  refuses removal in missing, false, calculated and duplicate modality, while
  valid Dialog Finish and inert Null edits remain available.
- **Evidence:** [PR 79 corrections and parent review](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/help-dialog-and-canvas.md#pr-79-root-cause-corrections-and-parent-review-2026-11-04).

## H68. Stale sole-position insertion cannot be confirmed

- **Class/search:** product and insufficient test; stale insertion, Return-only
  Scene, single select option, synthetic change, retained location.
- **Cause/correction:** confirmation depended on changing an already-selected sole
  option. A test dispatched `change` without a possible user value transition.
  Destination selection now starts stale locations on an explicit placeholder.
- **Regression:** actual Story controls through core refuse before selection,
  accept the sole legal position after a real value change, preserve Cancel/Escape
  and source comments, and retain one-step Undo/Redo and accepted revision.
- **Evidence:** [PR 79 corrections and parent review](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/help-dialog-and-canvas.md#pr-79-root-cause-corrections-and-parent-review-2026-11-04).

## P07. Screen inspection repeats whole-source analysis per button

- **Class/search:** product; slow inspection, marked buttons, quadratic work,
  dismissal capability, source parsing.
- **Cause/correction:** each button reparsed the file and requalified every action.
  One screen qualification now owns reusable action ranges for inspection and
  dismissal. The former per-button parsing path is removed.
- **Regression:** optimized public-service diagnostics reproduce the overhead and
  verify its removal; a large-screen public test preserves per-button authority
  and exact source edits without a permanent timing threshold.
- **Evidence:** [PR 79 corrections and parent review](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/help-dialog-and-canvas.md#pr-79-root-cause-corrections-and-parent-review-2026-11-04).


## H69. SDK text selector cannot find a nonfocusable screen caption

- **Class/search:** harness; Ren'Py 8.5.3, TextSelector, testfocus, Say text,
  nonfocusable caption, interpolated screen text, TTS.
- **Cause/correction:** pinned SDK text selectors search focus/Say text during
  narration. A shown nonfocusable screen caption is outside that search. The
  existing driver now requires the screen and asserts its actual interpolated
  displayable text through the pinned SDK TTS path. Production is unchanged.
- **Verification:** the outside-sandbox run passed 19 assertions before the caption
  selector failed. The corrected fixture passes exact text, numeric/type/sample
  witnesses and deliberate wrong-outcome rejection. Both failed attempts and the
  corrected pass retain immutable receipts. No duplicate test was added.
- **Evidence:** [#94 coordinator runtime recovery](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/arithmetic-94.md#coordinator-runtime-recovery)
  and [corrected Mac pass](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/arithmetic-94.md#mac-invocation-3-corrected-fixture-passed).

## H70. Full SDK GUI initialization violates a minimal canvas fixture assumption

- **Class/search:** harness; `plan.available`, `gui.init`, standard-template initialization.
- **Cause/correction:** shared setup required full inert-canvas availability for both
  minimal and SDK-generated projects. Keep the strict minimal preflight; the SDK
  fixture permits only its known GUI limits and still requires inert samples.
- **Regression:** the public no-SDK GUI case reproduces the failure and passes with
  the accurate limit and sample. Production admission stays unchanged.
- **Evidence:** [#95 fixture recovery](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/arithmetic-95.md#coordinator-fixture-correction-no-sdk-retry-yet).

## H71. Fixture source insertion misses an imagebutton identity comment

- **Class/search:** harness; missing `arithmetic_image` ID, imagebutton UUID comment.
- **Cause/correction:** insertion expected a newline directly after `imagebutton:`;
  public composition writes its identity comment there. Match the known marker
  exactly once and preserve the comment.
- **Regression:** the existing public preflight fails without the ID and passes
  after correction. It asserts the final accepted source, with no product change.
- **Evidence:** [#95 insertion recovery](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/arithmetic-95.md#mac-invocation-2-and-image-selector-correction).

## H72. Pinned SDK ID selectors require a tuple screen name

- **Class/search:** harness; Ren'Py 8.5.3 `DisplayableSelector`, scene-list tuple,
  imagebutton click timeout despite successful public displayable lookup.
- **Cause/correction:** the selector directly compares screen names without the
  public API's normalization. Both image mouse/keyboard selectors now use tuples.
- **Verification:** an isolated pinned-method diagnostic distinguishes string and
  tuple lookup; the SDK pass proves both activations with unchanged assertions and timeout.
- **Evidence:** [#95 selector diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/arithmetic-95.md#mac-invocation-3-and-pinned-selector-name-correction)
  and [runtime pass](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/arithmetic-95.md#mac-invocation-4-passed).

## H73. Smoke probe calls the superseded variable-default editor

- **Class/search:** harness caller migration; `Edit default` timeout in
  `smoke-report.dom.test`, supporting authoring stops before Scene/Source.
- **Cause/correction:** #97 replaces the old edit button with the selected variable's
  inspector. Select the variable and wait for `Save Default`; keep all assertions
  and deadlines. The existing three scenarios pass after the matching red.
- **Evidence:** [exact-head CI and local replay](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/arithmetic-review.md#ci-caller-correction-before-review-fixes).
  Embedded probe changes still need a matching rebuild for any later native proof.

## H74. UI SDK driver does not reach the next narration

- **Class/search:** harness narration progression; bare `advance`, `ui_story.rpy:15`,
  missing `UI story complete` after five passing assertions.
- **Evidence/correction:** the return and destination text exist. Pinned SDK
  `Advance` can complete on an unidentified begin callback; `Until` requires its
  destination. Replace the seven transitions with destination-bound advances while
  preserving all source, assertions and deadlines. Live callback ordering remains
  provisional. The selected recovery reaches its narration destinations, then
  fails at first timer-dispatched division; full qualification remains failed (H75).
- **Evidence:** [coordinator audit and recovery selection](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/archive/2026-11-10-shared-arithmetic.md#2026-11-10-first-ui-sdk-result-audited-recovery-selected).

## H75. UI SDK timer dispatch needs an interaction refresh

- **Class/search:** fixture interaction/dispatch defect; driver line 102,
  `money == 2.25`, 13 passing assertions in the failed recovery.
- **Observed:** destination-bound narration reaches the screen and its initial TTS/
  inertness assertions. The first divide result is not observed. SDK test Python and
  `show_screen` do not restart interaction; Timer needs render/event delivery.
  Live callback delivery and post-dispatch money remain unobserved in that run.
- **Cause/correction:** replaying the actual SDK test/helper/API admission is red
  without a refresh request and green after adding it. The fixture now requests
  refresh and records request state. Mac invocation 3 confirms six requests with
  the screen unbuilt and refresh changing false to true, then all exact action
  results, Finish and wrong-outcome rejection pass. The earlier run did not observe
  callback delivery; its missing evidence remains a failure.
- **Evidence:** [Mac recovery result](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/arithmetic-review.md#recovery-integration-and-mac-invocation-2-2026-11-10).
  [Mac confirmation](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/arithmetic-review.md#mac-invocation-3-passed-2026-11-10)
  keeps the admission replay separate from runtime proof.

## H76. Arithmetic CI fixtures retain obsolete error contracts

- **Class/search:** harness caller mismatch; `action field error`, `actionIndex`,
  `This divides by zero`, blur timing, quality run `42670532527`.
- **Cause/correction:** the Screens dispatch adapter discarded typed error context
  needed for invalid-action focus. Preserve the complete public error in all four
  inherited dispatch adapters. Story's browser expected a new error while typing;
  complete the field with blur before asserting the reviewed diagnostic.
- **Regression:** both failing fixtures and three affected inherited dispatch
  consumers pass with focus, source/history and error assertions intact. No
  production or SDK input changed; no longer timeout or deleted assertion.
- **Evidence:** [CI consumer correction](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/arithmetic-review.md#automatic-ci-fixture-consumers-corrected-2026-11-10).

## H77. Variable-default fields bypass completion validation

- **Class/search:** frontend; decimal `1e`, missing blur error, invalid correction
  clears `aria-invalid`, whole-number default inspector.
- **Cause/correction:** custom default-field listeners only remembered on blur
  and cleared errors on every input. Use the shared `validateField` with the
  submission value reader; retain raw drafts and original source revisions.
- **Regression:** production UI checks decimal/integer blur, invalid corrections,
  IME, Cancel and no invalid writes. The actual-main/core journey retains
  default drafts through unrelated creation, history, refusals and reopen.
- **Evidence:** [TDD follow-up](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/arithmetic-review.md#variable-default-validation-follow-up-2026-11-10).

## H78. Arithmetic helper recognition accepts customized declarations

- **Class/search:** source admission; helper substring, appended method, quoted
  template, duplicate class with `(object)`.
- **Cause/correction:** substring and exact-header counts did not establish a
  complete unique declaration. Share lexical declaration qualification between
  inspection, write admission and canvas; count helper class names across headers.
- **Regression:** six customized-source cases and independent public-command
  checks require protection, write refusal and exact byte retention.
- **Evidence:** [Terra audit and corrections](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/arithmetic-review.md#audited-terra-findings-and-sol-corrections-2026-11-10).

## H79. Literal-to-formula no-ops create source and history changes

- **Class/search:** numeric representation; Story `1.0` displayed as `1`, same-value
  Screens formula inserts `Function` and helper.
- **Cause/correction:** raw payload/tree equality missed equivalent typed constants.
  Share assignment equivalence without reading runtime values, rounding i64 values
  or equating opposite signed zeros. Preserve imported action timing and source.
- **Regression:** actual Story/Screens controls preserve bytes and empty history;
  public-core checks retain large integers, comments and meaningful sign changes.
- **Evidence:** [Terra audit and corrections](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/arithmetic-review.md#audited-terra-findings-and-sol-corrections-2026-11-10).

## H80. Decimal JSON transport loses negative zero

- **Class/search:** numeric transport; `-0.0` input saves `0.0`, JSON stringification.
- **Cause/correction:** JavaScript serializes numeric negative zero as positive zero.
  Admit the exact `"-0.0"` string through the shared decimal owner and typed contract.
- **Regression:** defaults, literal assignments, formula results, conditions, inert
  samples, shared history and reopen retain the sign through public operations.
- **Evidence:** [Terra audit and corrections](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/arithmetic-review.md#audited-terra-findings-and-sol-corrections-2026-11-10).

## H81. Standalone SDK fixture omits the editor's default condition variable

- **Class/search:** harness; Choice nested condition, `NameError`, missing `flag`.
- **Cause/correction:** the production condition builder selected the first existing
  project variable. The standalone SDK game declared a different fixture variable.
  Select the declared variable through the real control before freezing the source.
- **Regression:** the [controller journey](../../app/tests/choice-body-core.dispatch.mjs)
  selects `choice_flag`. The retired [offline admission](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/app/scripts/qualify-choice-body.py)
  required its expected typed condition before reserving an SDK invocation.
- **Evidence:** [Choice #102](https://github.com/Caldwell-41/Renpy-editor/issues/102)
  owns the requirement. Producing-host logs retain the failed play, successful
  compile/lint children and cleanup separately from the corrected candidate.

## H82. Font browser fixture edits before the chosen file is ready

- **Class/search:** harness readiness; `project-font.browser.mjs:66`, display-name
  `aria-invalid`, `null !== 'true'`, asynchronous native-picker reply.
- **Cause/correction:** the fixture edits import names before file selection and
  preview finish. The late reply supplies a default name and replaces the form,
  so the next assertion observes a different validation state. Wait for the
  existing enabled Import and use control before both successful name-edit paths.
  Keep held-picker cancellation and all validation assertions unchanged.
- **Verification:** a controlled held-picker replay reproduces the exact failure;
  waiting for readiness before validation passes that replay and the full actual
  browser/controller/core journey. Production code and timeouts are unchanged.
- **Evidence:** [Choice CI correction](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/choice-98.md#ci-font-import-readiness-correction).

## H83. Saved-slot Load button covers Start in an SDK fixture

- **Class/search:** harness geometry; Choice lifecycle, new-process Load,
  `Could not locate the displayable`, Start, enabled FileLoad.
- **Cause/correction:** the fixture placed Start and Load directly in one screen
  at the same default position. With no save, Load was insensitive. After saving,
  enabled Load covered Start. Waiting for the screen did not change that geometry.
  Place the two controls in a `vbox`; keep the existing input and assertions.
- **Slot boundary:** pinned 8.5.3 `FileLoad(slot=True)` addresses the raw slot used
  by `renpy.save`. Its disk name appends `-LT1.save`. Page-prefixed UI names and a
  guessed `.save` filename caused separate earlier fixture failures.
- **Verification limit:** actual Save, process exit and new-process Load passed.
  The final allowed run retained 26 passing children and the failing initial Start
  in the rollback/New Game child. The `vbox` correction has no SDK qualification;
  rollback and New Game remain pending. No timeout was raised or failure waived.
- **Evidence:** [#106](https://github.com/Caldwell-41/Renpy-editor/issues/106), the
  producing-host handoff and the [archived driver](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/tests/fixtures/choice-101/driver.rpy).


## H84. Browser/native probes must follow the current UI owner

- **Symptoms:** Choice checks dereference a removed overlay; Character probes select
  hidden/ambiguous Edit controls or old catalogue forms; direct reads match reviewed
  source text before creation commits. Lazy images have no source at decode time.
- **Correction:** migrate consumers to the scrolling Choice summary and current
  References/Game setup route. Require explicit source review before creation,
  observe the new enabled entry, scope fields to the modal/active owner, and target
  the visible shell Source Save. Wait for the current visible lazy image's assigned
  source/load. Preserve the existing cache for manual appearance selection.
- **Verification:** the full required browser preflight passes with unchanged
  security/refusal/history checks. Chromium/fixture proof remains distinct from
  native packaging and human acceptance.
- **Evidence:** [Choice preview integration](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/choice-98.md#approved-a-v2-integration-and-final-ci-reservation).

## H85. Windows helper exit can precede empty job accounting

- **Symptoms:** canvas shutdown reports cleanup complete and exit 0, but
  `cooperative: false`; `wait_empty(Duration::ZERO)` sees `ActiveProcesses=1` after
  the leader signals exit and both acknowledgments exist.
- **Class/cause:** product process boundary. A reduced controlled-child experiment
  reproduced this transient in 64/64 observations twice. Every job settled without
  force. Attribution of the earlier broad-CI failure remains an inference because
  the original unit passed on the connected Windows host.
- **Correction:** pass the remaining three-second cooperative budget to the owned
  process-tree finish. Keep acknowledgments, empty-job, pipe cleanup and exit 0
  mandatory; keep bounded forced cleanup as the failure fallback.
- **Regression:** retain one immediate-leader-exit controlled-child case at the
  Windows `OwnedChild` boundary. Original lifecycle units retain their assertions.
  Controlled-child proof does not qualify native SDK rendering or human input.
- **Evidence:** [Choice CI correction](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/choice-98.md#windows-cooperative-shutdown-correction).

## H86. SDK-only authoring fixture hides stale continuation expectations

- **Symptoms:** Phase 1H fails its exact Radio booth source comparison after SDK
  installation because the authored Choice retains a root Return absent from the
  golden source. Branches browser navigation waits for a legacy edit button on an
  option-owned route.
- **Cause/correction:** the golden retained the old terminal-Choice representation,
  and the manifest check ran only inside an ignored SDK gate. Share its authoring
  sequence with an ordinary offline test, include the preserved Return in the golden,
  and run that test in automatic PR checks. Browser navigation now selects a real
  option-owned route and checks its current Scene and exact Source targets.
- **Verification:** both failures reproduce and pass after the harness corrections
  without executing an SDK. Exact source, assets, history, reopen, graph workload,
  rendering assertions and timing policy remain intact. SDK/package acceptance is
  still pending.
- **Evidence:** [Second Choice campaign audit](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/choice-98.md#second-campaign-terminal-audit-and-harness-correction).
- **Unexecuted consumer audit:** the packaged runtime edit/restore and optional
  Branches probes retained the same old button. Their mock omitted option-header
  ownership, so its prior pass concealed the mismatch. Carry real `guardPath` and
  exact header locations in the fixture and follow `Open Scene` in those probes.
  The corrected five-case runtime browser sequence passes; native execution stays
  pending. [Continuation preparation](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/choice-98.md#continuation-audit-of-unexecuted-package-paths)
  retains the reproduced failure and signing-prerequisite finding.

## H87. UI refresh validator expects another probe's report

- **Class/cause:** harness; the native UI-refresh producer completed eleven checks
  and cleanup, but the outer validator expected route-driver stages. Synthetic
  gate self-tests repeated that stale schema and did not consume the producer.
- **Correction:** require the actual ordered UI-refresh checks, complete/success
  fields and cleanup. Remove the superseded route expectation. Feed the shipped
  producer's browser report into the same Python validator during preflight.
- **Verification:** browser red/green and missing-check/failure controls pass.
  All six retained Mac reports revalidate without native launches; original failed
  wrapper results remain retained. This does not supply missing smoke acceptance.
- **Evidence:** [Third Choice campaign](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/choice-98.md#third-campaign-results-and-offline-harness-corrections).

## H88. Smoke report delivery collides with ordinary shell reads

- **Class/cause:** harness; the native smoke's final report received pre-dispatch
  RUNTIME_BUSY. Direct health/checkpoint/report calls bypass the renderer lane and
  can contend with ordinary reads, including after restoring the requester.
- **Correction:** use the existing bounded probe busy helper for these observations
  and terminal delivery. Preserve other errors, the deadline, all required report
  fields and the single final payload. The desktop handler must also leave a busy
  report pending; treating it as rejected schedules exit before delivery can retry.
  No application mutation is retried.
- **Verification:** unit red/green covers busy health reads, every checkpoint and
  report, plus failed-authoring/incomplete-trace rejection. The affected browser
  preflight passes. An exact Rust classification red/green check covers the native
  termination decision and preserves malformed-report rejection. Fresh packaged
  smoke remains unqualified.
- **Evidence:** [Third Choice campaign](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/choice-98.md#third-campaign-results-and-offline-harness-corrections).

## H89. TLS server accept precedes client socket ownership

- **Class/cause:** harness; the handshake cancellation test treated server accept
  as proof that the client had published its owned socket. Controlled Windows
  scheduling reproduced an absent observation while early shutdown, Cancelled
  and EOF succeeded. The original CI mode/value were not captured, so attribution
  remains provisional.
- **Correction:** emit handshake readiness after nonempty ClientHello arrives and
  check client ownership before cancelling. Keep successful shutdown, Cancelled,
  EOF and the original timing bound; expose safe mode/observation diagnostics.
  No production transport or committed scheduling hook changes.
- **Verification:** the exact corrected unit passes on Mac. Kris dropped the
  controlled Windows re-check at closeout; the next Windows package run executes
  the corrected test in its core suite. Earlier unforced passes do not erase the
  failed campaign.
- **Evidence:** [Windows TLS diagnosis](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/choice-98.md#windows-tls-readiness-diagnosis-and-correction).

## H90. Packaged smoke navigates before a dialog's save closes it

- **Class/cause:** harness; after Save Character the probe waited only for the
  request and one task, then clicked the sidebar. Natively the dialog's save also
  crosses real desktop IPC (the shell's direct preferences write), so the Edit dialog
  was still open and the modal-scoped click found no "Characters". Both targets
  failed at that step. An earlier shell-readiness theory was wrong and is removed.
- **Correction:** after each dialog submit that precedes navigation, wait up to
  10 s for the dialog to close. Failed clicks name the active dialog and visible
  controls; a rejected report prints its stage fields and failed observations.
- **Verification:** a local Mac diagnostic showed `scope=Edit Alice` with only the
  dialog's controls. The browser preflight now delays direct shell calls by 25 ms;
  it reproduced that failure before the fix and passes after it.
- **Evidence:** [Final Choice campaign](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/evidence/choice-98.md#closeout-review-and-final-campaign).

## H91. External-change test passes on macOS, fails intermittently on Linux

- **Class/search:** test fixture; inode reuse, ext4, `FileIdentity`, delete and
  recreate, `HISTORY_BOUNDARY`, `SOURCE_CONFLICT`, passes locally.
- **Cause:** core identifies a file revision by content hash plus device and inode.
  A test that deletes a file and recreates it with the same bytes gets the freed
  inode back on ext4 often enough to flake, so core sees no external change. APFS
  never reuses file IDs, so the same test always passes on macOS. The product is
  correct. `choice_missing_existing_helper_refuses_changed_source_commands_without_history_or_repair`
  expected `HISTORY_BOUNDARY` after such a recreation and got an accepted Undo.
- **Correction:** simulate an external replacement while the old file still holds its
  inode: write the replacement first and rename it over the original, or rename the
  original aside, write the new file, then delete the aside copy. Never delete, then
  recreate the same bytes.
- **Finding the rest:** temporarily force the `file` half of `FileIdentity` to a
  constant in `transaction/identity.rs` and run `npm run test:core`. Tests that build
  the replacement first fail too, so read each failure; only a test that deletes
  before recreating is exposed. On `0ea86c07` that was the one test above.
- **Reproduction:** rename the helper aside and back instead of deleting and
  recreating. The original test then fails at the same assertion on macOS.
- **Evidence:** [CI diagnosis](https://github.com/Caldwell-41/Renpy-editor/pull/151#issuecomment-6823176789),
  issue #159.

## H92. Story shows "Source projection unavailable" after an external edit

- **Class/search:** product; `sourceConflict`, no beats, external edit, unopened file,
  `source_refresh_project`, `verify_current_mappings`, reopen `SOURCE_CONFLICT`.
- **Cause:** core reconciled a scene's source map only through a Source buffer. A scene
  file that Source had not opened this session kept its old mapping revision, so Story
  showed it as unavailable with no beats. A file edited while the project was closed
  made `project.openRecent` refuse with `SOURCE_CONFLICT`. Tests hid both: the Story
  conflict case opened every file in Source before writing, and a scene test asserted
  the conflict.
- **Correction:** each Story, Source and Branches refresh and each project open
  reconciles every clean scene source from its buffer or from disk. A missing or
  invalid source, or a dirty Source buffer, still stays unavailable.
- **Regression:** `story_projects_external_edit_to_scene_source_never_opened`,
  `project_opens_after_scene_source_changed_while_closed`, and the Story case "Beat
  draft conflicts resolve with Discard draft or Override source" without Source opens.
- **Evidence:** issue #168.
