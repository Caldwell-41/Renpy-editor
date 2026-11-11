# Testing strategy

## Scope

Select tests from the changed behavior and the evidence the issue requires.
Commands are references, not a requirement to run every suite. Documentation
alone needs no package matrix.

Keep `.rpy` authoritative: preserve comments, formatting, opaque/custom syntax and
embedded Python. Routine coverage prioritizes save/reopen/Undo/Redo, retained drafts,
ordinary external edits, non-crashing interrupted-save recovery, malformed input,
path/link refusal, explicit execution and usable response times. Deliberate process
termination, timed hostile filesystem substitution and G1-O experiments remain
specialist historical tests under [ADR 0010](adr/0010-local-project-safety-and-observed-flow.md).
Keep their defenses and evidence; select them only in a separately approved
specialist task, and keep security settings unchanged to pass a test. Exact
dispositions remain in the [selector record](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/archive/2026-10-06-testing-policy-alignment.md#selector-disposition).

## Focused runbooks

| Need | Current reference |
| --- | --- |
| Complete PR status, selected manual qualification and coordinator diagnosis | [Complete PR validation](testing/CI-VALIDATION.md) |
| Local commands, Python host exclusions, renderer/probe consumers and workflow gates | [Automated checks](testing/AUTOMATED.md) |
| Source/transaction expectations, pinned SDK, packaged scenarios and performance boundaries | [SDK and runtime](testing/SDK-RUNTIME.md) |
| Native input, package identity, credentials and human evidence reuse | [Native evidence](testing/NATIVE.md) |
| Result summaries, source identity, artifact retention and audit | [Evidence](testing/EVIDENCE.md) |
| A matching past symptom, diagnosis or prevention lesson | [Searchable incident index](testing/INCIDENTS.md) |
| Exact build/signing commands and approved identity | [App README](../app/README.md#local-checks) |

## Minimum gates by changed behavior

| Change | Relevant minimum |
| --- | --- |
| Documentation/governance | Repository validator, links/privacy and whitespace |
| Source model/serializer | Unit/golden, targeted property/fuzz and relevant fixture SDK validation |
| Files/SDK/process | Unit, ordinary path/archive/conflict/recovery and affected platform integration |
| Scene/file lifecycle | References, transactions/history/recovery, `.rpyc` cleanup and SDK compile/lint/run |
| UI workflow | Component/controller, keyboard/accessibility, affected desktop path and visual conformance |
| Design Lab prototype or tooling | [Focused lab verification](../app/design-lab/README.md#focused-verification) |
| Generated Ren'Py | Pinned official SDK compile/lint, named normal-entry runtime cases and standard-template smoke |
| Package/release | Required target package/install/launch, identity and contents/privacy |
| LLM adapter/action | Schema/bounds/refusals, consent/locality, real prepared body/transport, review/partial acceptance and no automatic network |

Use the narrowest real integration seam for changed asynchronous paths, across the
actual frontend controller or helper and the production dispatch or service. Include
relevant cancellation, held-owner contention, stale completion and retained input.
Two isolated unit tests do not prove the combined path. Keep unit tests; do not
copy every case into an expensive end-to-end suite.

Prefer the relevant existing DOM or unit test file, and create one only when none
fits. Write a browser fixture only for behavior a DOM test cannot reach, such as
real layout, pointer input or a controller-to-core journey. Every new test is found
by an existing selector. Every PR runs `npm test`, `test:fixtures`,
`test:source-browser`, `npm run test:core` and the `test_*.py` suites that
`quality.yml` names. Full `test_*.py` discovery runs in the harness-regressions
dispatch, and `loomlight-desktop` tests run in the Phase 1 production gates. A
fixture that `test:fixtures` cannot run declares `// fixture: skip <reason>` under
the [fixture runner](testing/AUTOMATED.md#renderer-and-production-probe-consumers).
A reason that starts `run by` names a selector that runs on every PR; the runner
rejects any other. A fixture that only a dispatched workflow runs says `manual:`. Skip tests that only prove deleted
code stays deleted, and smoke tests that repeat existing coverage.

Gate results with the shared checks: `verify_unittest` for Python and `cargo-log`
for Rust reject failures, zero tests and skips outside named host exclusions. Use
`--exact` with Cargo filters and skips. Do not add per-gate test-name lists, or a new
gate script with its own tests, for each qualification. Keep synthetic DOM, browser,
real service, SDK, native input and human acceptance distinct. Use controlled data
or assertion failures rather than new deliberate process crashes. Keep minimal
regressions for real product defects when reorganising tests. Do not fix production
to satisfy an unvalidated fixture, raise thresholds, blanket-skip cases or retry
until green.

## Test host routing

Keep one coordinating session on the user's preferred development machine. Within
an authorized task, agents may inspect, synchronize, build, test and diagnose through
already-linked T3 environments. Prefer a connected Windows x64 host for Windows work
during Mac development, and a connected macOS ARM64 host for Mac work during Windows
development. Use GitHub Actions when a connected host is unavailable or lacks a
capability. Connected-host results do not replace required CI jobs.

Select targets from the changed shared/native code, dependencies and packaging.
Portable changes need not trigger both native hosts. During iteration, run affected
local checks and the production-probe consumers of changed contracts. Qualify a
coherent candidate at the selected milestone, then repeat only affected or
unresolved checks after corrections. Run timed journeys, latency probes and native
input apart from broad builds on the same host, because contention invalidates
timing. Reuse an unchanged qualified slice within its scope; every new PR head
still needs the checks its validation plan selects.

On a connected host:

1. Discover the environment, Git root, tools, branch, local changes and worktree
   ownership. Preserve unrelated changes, stashes, ignored files and recovery data.
   Synchronize with a safe fast-forward or a separate checkout.
2. Use existing repository commands with pinned dependencies. When the host needs
   its own agent session, delegate one bounded assignment with its checkout,
   candidate and permitted operations. A test-only assignment leaves source unchanged.
3. Return the exact tested commit, host and toolchain details, commands, case
   results, package hashes when produced and cleanup, under [evidence rules](testing/EVIDENCE.md).

Native input, signing, fixture isolation and human acceptance follow
[native evidence](testing/NATIVE.md). Ask the user to act only for a named
requirement that needs unavailable access, physical interaction or human
observation. A missing capability leaves that case pending without blocking
unrelated portable work.

## Keep policy and gates aligned

A gate-policy change is complete when docs, commands and selectors, embedded test
calls, required markers, workflow conditions and artifact behavior agree. Keep
routine regressions and specialist experiments independently selectable. Audit
behavior, not test names: excluding every test named `race` or `crash` hides
ordinary recovery coverage. Where independent checks can continue after a
nondependent failure, collect their evidence and keep the failure blocking. Retain
exact tested executables on failure, with run, attempt, SHA, hashes, logs and case
results. Use existing scripts and workflows rather than a new CI controller.

## Waiting for CI

Before publishing a PR that needs a qualification, select it in
`.github/validation-plan.json` under [complete PR validation](testing/CI-VALIDATION.md).
A PR that leaves the plan unedited requires Repository quality only.
CI is complete when `Loomlight validation` passes for the current head and the
selected runs, jobs and retained evidence have been audited.

1. Record the workflow, run ID, attempt, head SHA and branch in a PR comment before
   waiting. A dispatch without a confirmed run is unconfirmed; resolve it before
   dispatching again.
2. In T3, register the PR watcher after publishing and end the turn. In Codex
   desktop, use the installed `ci-watch` skill for the exact run. If neither route
   is confirmed to work, end the turn and resume when the user returns. Do not poll.
3. On resume, read the recorded run and its terminal status. A watcher event is a
   cue to inspect CI, not proof of success. If it is still pending, wait again. If
   it is terminal, audit the required jobs, artifacts and identity. Missing,
   expired, failed, cancelled or skipped evidence stays unresolved.

Resuming does not authorize a retry, new dispatch, extra build or merge.

## Results

[Evidence](testing/EVIDENCE.md) owns result summaries, retained measurements,
artifact identity and terminal audit. Run-specific counts, attempt ordinals, SHAs
and artifact receipts belong in issue and PR comments. The
[former testing reference](https://github.com/Caldwell-41/Renpy-editor/blob/archive/docs-ledgers-2026-11/docs/tasks/archive/2026-10-16-testing-reference.md)
keeps old measurements and phase chronology.
