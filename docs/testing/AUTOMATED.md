# Automated checks and harness contracts

[Testing entry point](../TESTING.md) owns navigation, selection, host routing and
waiting; [AGENTS](../../AGENTS.md#operation-limits) owns operation limits. Commands below are references,
not a run-all instruction. Run from `app/` unless stated otherwise.

## Automatic PR and main checks

`Repository quality` always runs repository validation and its gate tests. Its
named frontend/Rust job selects code checks unless `scripts/pr_scope.py` proves
the tested PR merge changes only root Markdown, Markdown under `docs/`, or the
branch validation plan. Renames include both paths; missing/mismatched parents,
unavailable comparisons, unknown paths and empty diffs select code checks. Main
pushes always select them. The job summary records the selection; the job itself
is never skipped. Required manual qualifications remain selected by the plan.

Code checks run `npm run check`, the production frontend build, Rust formatting,
the offline Help admission tests, the broad core suite (`npm run test:core`), the
Dialog controller/core journey, `test:fixtures`, `test:source-browser` and the
Branches browser workload on the real-service flow fixture. They run on
`ubuntu-latest` with pinned tooling, build no native application or package and
start no SDK. Windows and Mac coverage comes from the manual workflows. Help remains selected for all code changes because it exercises shared
controllers and core services. Failure diagnostics keep their existing ownership.

## Inexpensive harness checks

Use Python 3.11 or later and the repository's Node version. On Windows use the
available `python`; on macOS select a suitable `python3`. Record actual versions.

```bash
python3 scripts/run-harness-checks.py --output <fresh-ignored-output-directory>
```

The output directory must be new. Four independent groups run: Python `test_*.py`
fixtures, Q1 rejecting self-tests, Q1 source audit and package-retention fixtures.
They do not build or launch Loomlight, install an SDK or contact a provider. A few
fixtures invoke Node or the host's PowerShell against public controlled inputs.
Ordinary discovery does not open the Win32 credential dialog. For changes to
`studio-setup-windows.ps1`, its `rewrite-windows-native.ps1` helpers, or
`studio_setup_native_dialog_checks.py`, add `--native-dialog` on an interactive
Windows desktop. This selects a fifth group with real focus/clicks. It fails on
other hosts, missing desktop capability, zero cases, skips or failed assertions.
The hosted harness dispatch and the current connection workflow also select the
dialog on Windows. Local default runs stay offline.
Inventory fixtures must create their own controlled source and permission files;
they must also pass from a clean checkout without ignored Tauri-generated files,
installed dependencies or a prior build. Keep missing-permission refusal checks.
Every group's assertion output is printed and retained; failure or timeout remains
blocking while later independent groups run. `checks.json`, `result.json` and
`summary.md` distinguish successful checks from failures. Timeouts retain partial
stdout/stderr. No retry or deadline inflation is built in.

The shared Python result check (`verify_unittest` in `check-thinking-evidence.py`)
requires nonzero discovery, matching result counts, unique rows, no failures and
only the named host exclusions. Four POSIX Mac snapshot/permission cases are
excluded on Windows; one PowerShell driver case is excluded on Mac. Retention permits only its named POSIX tar-symlink case on
Windows. Shared path/policy/process/receipt tests remain selected on both hosts.
Portable cleanup fixtures inject process absence and reject live/unknown state;
receipt fixtures use controlled clocks. These are logic tests, not native OS proof.

Offline canvas measurement tests belong to ordinary discovery. The compiled Mac
recorder checks use a separate explicit selection in
[the native runbook](NATIVE.md#standalone-mac-canvas-recorder); they require a binary
and fail if it is missing.

The three nested-fidelity observer checks also run in ordinary discovery. The two
export-admission checks require the public-core accepted export and run explicitly
after that exporter, without building or starting anything themselves:

```bash
LOOMLIGHT_NESTED_FIDELITY_INPUTS=<prepared-export-directory> \
  python3 -m unittest discover -s scripts -p nested_fidelity_export_checks.py -v
```

An absent or invalid export fails this explicit selection; it is not an optional
skip in the inexpensive harness. Run both selections for nested qualification.

L20 follows the same split. `test_sample_fidelity.py` runs ordinary offline
observer and matrix-refusal checks; `test_fidelity_comparison.py` covers the
exact pixel/geometry comparison shared with L19. After running the public-core
`sample_fidelity_exports_all_states_and_typed_boundaries_without_execution`
exporter with `LOOMLIGHT_SAMPLE_FIDELITY_INPUTS` set to a fresh ignored directory,
run `sample_fidelity_export_checks.py` with that same environment variable.
Missing, stale or altered exports fail the explicit admission selection. The
ignored `sample_fidelity_hidden_helper_captures_exported_cases` producer and
`qualify-sample-fidelity.py reference` require the selected ticket's SDK reservation.

`Repository quality` → `harness_regressions=true` runs the four ordinary groups on
both targets and the explicit dialog group on Windows, with every other boolean
selector false. The Windows job requires its hosted interactive desktop. This is an
optional focused verification route, not an extra mandatory dispatch per feature.
The Thinking path already runs the same underlying fixtures and host gates
independently; do not add a duplicate run there.
Current results and consumed attempts belong on the issue.

## Renderer and production-probe consumers

```bash
npm run check
# For an affected compiled test instead of the full frontend suite:
npm run build:tests && node --test dist-tests/tests/<name>.test.js
# For affected browser/probe paths; this command builds its own inputs:
npm run test:source-browser
# Every browser and dispatch fixture that no other workflow owns:
cargo build -p loomlight-core --locked --examples && npm run test:fixtures
```

`npm test` compiles its own tests; do not run `build:tests` immediately before it.
`test:source-browser` builds and runs several browser fixtures; select it only
for affected browser/probe paths. `test:fixtures` runs every `tests/*.browser.mjs`
and `tests/*.dispatch.mjs` file in the PR frontend job, so a new fixture runs by
default. A fixture opts out only with `// fixture: skip <reason>` in its first five
lines, when it needs the SDK or another workflow already runs it. Delete a
fixture that no longer matches the product; do not leave it unrun. System Chrome or locked Playwright Chromium is
a renderer test surface, not native WebView or OS input evidence.

| Changed contract | Include these existing consumers |
| --- | --- |
| Settings flow, connection or credential-probe shape | `ai-settings.dom`, `identity-probe.dom`, `windows-studio-probe.dom`, protocol and affected Rust preparation/dispatch tests |
| Character/reference navigation or review structure | `reference-ui.dom`, `supporting-authoring.dom`, `save-command.dom`, `smoke-report.dom` and the actual selectable sequence |
| Scene/history/remount or selectable workflow | `selectable-native-sequence.dom`, `native-probe-driver`, `project-history.dispatch.mjs`, relevant Scene/Save tests and real controller/transaction checks |
| Story arithmetic controls | `story-arithmetic.dom`, `story-arithmetic-core.dispatch.mjs` and `story-arithmetic.browser.mjs`; the fixture runner discovers both scripts automatically. CI fetches their pinned approved Story reference before comparison. |
| Request defaults, Thinking or body/schema | Real Rust prepared-body assertions, synthetic HTTP admission fixtures, `studio-request.dom` and affected native-worker tests |
| Runtime/Source/UI probe | `native-runtime-driver.browser.mjs`, `ui-refresh.browser.mjs`, `ui-refresh-retention.browser.mjs`, Source Save browser regressions and affected packaged cases |

Names above abbreviate existing files in `app/tests`. This is a selection map,
not a dependency scanner. Inspect the changed consumer chain; a passing mock copied
from another mock cannot establish compatibility with the production producer.
Thinking requires production-probe consumer cases: its critical consumers plus
complete successful renderer execution.
Missing, duplicate, failed, cancelled or unexpectedly skipped cases cannot pass.
The Mac identity and Windows current-connection DOM consumers also submit their
actual production-probe reports to the Python admission validators. This checks
producer/consumer agreement, including early native Cancel, current Save confirmation
and read-only reload assertions; fabricated positive reports alone cannot do that.
Nested probe subtests count toward the execution summary in addition to their
required named parent; missing results and nested failures still refuse.
Never update an aggregate count alone to accommodate a missing safety assertion.

Run the real probe through production renderer/controller controls before native
qualification. Cover the remaining sequence, including already-selected remount,
delayed completion, Undo/Redo, refused writes, cancellation, reopen and cleanup.
Dispose timers when an evaluation is cancelled. A legacy frozen-product fixture
must declare its compatible contract and refuse incompatible current probes before
building or launching; migrate it only in a separately selected native task.

## Core and desktop checks

```bash
cargo test -p loomlight-core --locked --lib <affected-scope> -- --nocapture
cargo test -p loomlight-desktop --locked --bin loomlight <affected-scope> -- --nocapture
```

For the broad core suite, run the same command as PR CI and the Phase 1 production
gates. From `app/`:

```bash
npm run test:core              # PR CI profile
npm run test:core -- --release # production-gate profile
```

[`scripts/test-core.mjs`](../../app/scripts/test-core.mjs) owns the exact skips,
including a Linux-only skip for Windows/macOS process behavior.
Options after `--` go to Cargo. Gate the output with `cargo-log`. The transport
tests need loopback sockets, so a sandbox that blocks them reports false failures.
Unset the SDK archive variables first, as CI has none.

Run the observed-flow fixture separately when selected, with enforced budgets.
SDK-backed tests require the verified archive and exact selector described in the
[SDK runbook](SDK-RUNTIME.md). Specialist persistence termination and timed namespace
substitution tests remain explicitly ignored; do not select them for routine work.
Preserve ordinary external edits, non-crashing recovery, malformed input, path/link
refusal, session/privacy, descendant cleanup and real product-defect regressions.

List the intended Cargo scope and compare every listed name with its actual result.
Require positive named results, zero unapproved ignored/failed/measured cases and a
valid summary. Keep the SDK heap-buffer and receipt-cancellation regressions: a
passing test-harness thread alone cannot establish release main-thread stack safety.
Changes to process-global fixtures must use their shared fixture ownership guard;
prove them under ordinary parallel test execution on the affected host.

## Workflow checks

From the repository root, use the existing actionlint installation:

```bash
actionlint -shellcheck= -pyflakes= .github/workflows/*.yml
python3 scripts/validate.py
git diff --check
```

Disabling external shellcheck/pyflakes does not disable Actions expression rules.
Use matrix-selected interpreter variables where job-level runner context is not
available. Preserve argument arrays and direct pinned Node/npm CLI invocation on
Windows. Keep command failure visible through `pipefail` and retained stderr.
Independent checks may continue only after their actual prerequisites succeed;
their original failure still blocks qualification. Summaries must show unrun or
skipped prerequisites separately. Do not convert failures to successful conclusions.

The Thinking path reports harness, typecheck, test compilation/consumers,
renderer build/browser, Rust/core, context and desktop outcomes separately. A failed
core scope does not suppress the other scopes. Historical recipe branches retain
their scoped meaning; this does not qualify them on current application contracts.

See [INCIDENTS](INCIDENTS.md) before correcting a matching failure. Record its
classification and smallest discriminating check on the issue.
