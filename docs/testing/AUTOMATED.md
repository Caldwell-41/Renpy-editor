# Automated checks and harness contracts

[Testing entry point](../TESTING.md) owns navigation; [WORKFLOW](../WORKFLOW.md)
owns selection, budgets, host routing and waiting. Commands below are references,
not a run-all instruction. Run from `app/` unless stated otherwise.

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
Inventory fixtures must create their own controlled source and permission files;
they must also pass from a clean checkout without ignored Tauri-generated files,
installed dependencies or a prior build. Keep missing-permission refusal checks.
Every group's assertion output is printed and retained; failure or timeout remains
blocking while later independent groups run. `checks.json`, `result.json` and
`summary.md` distinguish successful checks from failures. Timeouts retain partial
stdout/stderr. No retry or deadline inflation is built in.

The shared Python result gate requires nonzero discovery, matching result counts,
unique rows, named required cases and only exact host exclusions. Four POSIX Mac
snapshot/permission cases are excluded on Windows; two PowerShell helper cases
are excluded on Mac. Retention permits only its named POSIX tar-symlink case on
Windows. Shared path/policy/process/receipt tests remain selected on both hosts.
Portable cleanup fixtures inject process absence and reject live/unknown state;
receipt fixtures use controlled clocks. These are logic tests, not native OS proof.

`Repository quality` → `harness_regressions=true` runs only these checks on
Windows x64 and macOS ARM64, with every other boolean selector false. This is an
optional focused verification route, not an extra mandatory dispatch per feature.
The current walkthrough-redesign path runs the same helper inside its existing
qualification job before expensive checks. The Thinking path already runs the same
underlying fixtures and host gates independently; do not add a duplicate run there.
Current results and consumed attempts belong in the selected task.

## Renderer and production-probe consumers

```bash
npm run typecheck
npm run build:tests
npm test
npm run build
npm run test:source-browser
```

The final browser command builds and runs several browser fixtures; select it only
for affected browser/probe paths. System Chrome or locked Playwright Chromium is
a renderer test surface, not native WebView or OS input evidence.

| Changed contract | Include these existing consumers |
| --- | --- |
| Settings flow, connection or credential-probe shape | `ai-settings.dom`, `identity-probe.dom`, `windows-studio-probe.dom`, protocol and affected Rust preparation/dispatch tests |
| Character/reference navigation or review structure | `reference-ui.dom`, `supporting-authoring.dom`, `save-command.dom`, `smoke-report.dom` and the actual selectable sequence |
| Scene/history/remount or selectable workflow | `selectable-native-sequence.dom`, `native-probe-driver`, relevant Scene/Save tests and real controller/transaction checks |
| Request defaults, Thinking or body/schema | Real Rust prepared-body assertions, synthetic HTTP admission fixtures, `studio-request.dom` and affected native-worker tests |
| Runtime/Source/UI probe | `native-runtime-driver.browser.mjs`, `ui-refresh.browser.mjs`, `ui-refresh-retention.browser.mjs`, Source Save browser regressions and affected packaged cases |

Names above abbreviate existing files in `app/tests`. This is a selection map,
not a dependency scanner. Inspect the changed consumer chain; a passing mock copied
from another mock cannot establish compatibility with the production producer.
Both Thinking and the current redesign selection require production-probe consumer
cases. Redesign discovers expected names from all its selected files; Thinking
requires its critical consumers plus complete successful renderer execution.
Missing, duplicate, failed, cancelled or unexpectedly skipped cases cannot pass.
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

For coherent routine broad-core qualification, use the existing exclusions:

```bash
cargo test -p loomlight-core --release --locked -- \
  --skip scene::tests::flow_observed_budget_fixture_500_scenes_2000_edges \
  --skip lifecycle::tests::official_sdk_phase_1c_target_gate \
  --skip renpy::reconciliation_tests::official_sdk_download_handoff_target_gate \
  --nocapture
```

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

The current redesign path reports harness, typecheck, test compilation/consumers,
renderer build/browser, Rust/core, context and desktop outcomes separately. A failed
core scope does not suppress the other scopes. Historical recipe branches retain
their scoped meaning; this does not qualify them on current application contracts.

See [INCIDENTS](INCIDENTS.md) before correcting a matching failure, and update the
owning task with the classification and smallest discriminating check.
