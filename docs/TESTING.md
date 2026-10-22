# Testing strategy

## Scope and ownership

Select changed behavior and required evidence under
[WORKFLOW routing](WORKFLOW.md#test-host-routing-and-ownership).
[CURRENT](status/CURRENT.md), [HANDOVER](status/HANDOVER.md) and the selected task
own current state, acceptance and remaining allowance. Commands are references,
not a requirement to run every suite. Documentation alone needs no package matrix.

Keep `.rpy` authoritative: preserve comments, formatting, opaque/custom syntax and
embedded Python. Routine coverage prioritizes save/reopen/Undo/Redo, retained drafts,
ordinary external edits, non-crashing interrupted-save recovery, malformed input,
path/link refusal, explicit execution and usable response times. Deliberate process
termination, timed hostile filesystem substitution and G1-O experiments remain
specialist historical tests under [ADR 0010](adr/0010-local-project-safety-and-observed-flow.md).
Keep their defenses and evidence; do not select them routinely or change security
settings to pass a test. Exact dispositions remain in the [selector record](tasks/archive/2026-10-06-testing-policy-alignment.md#selector-disposition).

## Development host and test cadence

When selecting a test host, scheduling qualification or resolving missing native
capability, follow [host routing](WORKFLOW.md#test-host-routing-and-ownership). For diagnosed corrections
and evidence reuse, follow the [cumulative budget](WORKFLOW.md#5-budget-the-problem-not-the-checkpoint-name)
and [executable-gate policy](WORKFLOW.md#6-make-policy-and-executable-gates-agree).
CI and external waits follow [ci-watch selection and manual fallback](WORKFLOW.md#waiting-without-model-polling).

## Focused runbooks

| Need | Current reference |
| --- | --- |
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
| Generated Ren'Py | Pinned official SDK compile/lint, named normal-entry runtime cases and standard-template smoke |
| Package/release | Required target package/install/launch, identity and contents/privacy |
| LLM adapter/action | Schema/bounds/refusals, consent/locality, real prepared body/transport, review/partial acceptance and no automatic network |

Use the narrowest real integration seam for changed asynchronous paths. Include
relevant cancellation, held-owner contention, stale completion and retained input.
Before trusting a gate, show it rejects wrong/missing results, zero tests and skipped
required cases. Keep synthetic DOM, browser, real service, SDK, native input and human
acceptance distinct. Do not fix production to satisfy an unvalidated fixture, raise
thresholds, blanket-skip cases or retry until green.

## Results and historical lookup

Before correcting a failure or changing its harness, follow
[WORKFLOW diagnosis](WORKFLOW.md#4-classify-failures-before-fixing) for classification,
incident lookup and index maintenance. [Evidence](testing/EVIDENCE.md) owns technical
result summaries, retained measurements, artifact identity and terminal audit.

Run-specific counts, attempt ordinals, SHAs, artifact receipts and old next-step
instructions belong in linked task evidence. Keep required validation and a concise
acceptance result in the brief under [document ownership](WORKFLOW.md#task-briefs-and-supporting-files).
The one-time [former testing reference](tasks/archive/2026-10-16-testing-reference.md)
preserves unique material moved here in the migration. Its selected outcomes and
allowances are historical. Current and frozen harness contracts must stay explicit;
this maintenance does not reopen native acceptance or exhausted attempts.

## Existing section links

Older links remain lookup entry points. The linked runbooks own current contracts;
the archived reference owns old measurements, exact receipts and phase chronology.

<a id="current-scope-proportionate-hobby-editor-acceptance"></a>
- [Current scope: proportionate hobby-editor acceptance](#scope-and-ownership)

<a id="thinking-and-harness-repair-qualification"></a>
- [Thinking and harness repair qualification](testing/AUTOMATED.md#inexpensive-harness-checks)

<a id="sdk-hashing-regression"></a>
- [SDK hashing regression](testing/AUTOMATED.md#core-and-desktop-checks)

<a id="current-production-scaffold-and-phase-0-regression-commands"></a>
- [Current production scaffold and Phase 0 regression commands](testing/AUTOMATED.md)

<a id="planned-layers"></a>
- [Planned layers](#minimum-gates-by-changed-behavior)

<a id="phase-1-milestone-gates"></a>
- [Phase 1 milestone gates](tasks/archive/2026-10-16-testing-reference.md#phase-1-milestone-gates)

<a id="representative-source-coverage"></a>
- [Representative source coverage](testing/SDK-RUNTIME.md#source-and-transaction-coverage)

<a id="phase-1e-scene-authoring-gate"></a>
- [Phase 1E Scene authoring gate](testing/SDK-RUNTIME.md#source-and-transaction-coverage)

<a id="phase-1f-accepted-regression-contract"></a>
- [Phase 1F accepted regression contract](testing/SDK-RUNTIME.md#source-and-transaction-coverage)

<a id="phase-1g-testing-ownership-and-cadence"></a>
- [Phase 1G testing ownership and cadence](testing/NATIVE.md#evidence-layers-and-ownership)

<a id="real-service-and-native-input-coverage"></a>
- [Real-service and native-input coverage](testing/NATIVE.md#evidence-layers-and-ownership)

<a id="supported-runtime-responsiveness-and-diagnostic-boundaries"></a>
- [Supported-runtime responsiveness and diagnostic boundaries](testing/NATIVE.md#performance-and-final-human-checks)

<a id="independent-browser-outcomes-in-the-production-workflow"></a>
- [Independent browser outcomes in the production workflow](testing/SDK-RUNTIME.md#observed-flow-and-performance)

<a id="final-human-session-and-narrow-evidence-reuse"></a>
- [Final human session and narrow evidence reuse](testing/NATIVE.md#performance-and-final-human-checks)

<a id="cost-and-harness-discipline"></a>
- [Cost and harness discipline](#development-host-and-test-cadence)

<a id="required-quality-gate-by-change-type"></a>
- [Required quality gate by change type](#minimum-gates-by-changed-behavior)

<a id="result-recording"></a>
- [Result recording](testing/EVIDENCE.md)

<a id="windows-native-preflight-and-prepared-host-sequence"></a>
- [Windows native preflight and prepared host sequence](testing/NATIVE.md#native-driver-requirements)

<a id="initial-performance-hypotheses"></a>
- [Initial performance hypotheses](tasks/archive/2026-10-16-testing-reference.md#initial-performance-hypotheses)

<a id="scene-json-boundary-regression"></a>
- [Scene JSON boundary regression](tasks/archive/2026-10-16-testing-reference.md#scene-json-boundary-regression)

<a id="retained-1g1-development-evidence"></a>
- [Retained 1G.1 development evidence](tasks/archive/2026-10-16-testing-reference.md#retained-1g1-development-evidence)

<a id="branches-timing-interpretation"></a>
- [Branches timing interpretation](tasks/archive/2026-10-16-testing-reference.md#branches-timing-interpretation)

<a id="1g2b-named-packaged-scenarios"></a>
- [1G.2b named packaged scenarios](testing/SDK-RUNTIME.md#packaged-runtime-cases)

<a id="observed-flow-qualification"></a>
- [Observed-flow qualification](testing/SDK-RUNTIME.md#observed-flow-and-performance)

<a id="ui-refresh-verification"></a>
- [UI refresh verification](testing/AUTOMATED.md#renderer-and-production-probe-consumers)

<a id="hands-on-ui-correction-regressions"></a>
- [Hands-on UI correction regressions](testing/AUTOMATED.md#renderer-and-production-probe-consumers)

<a id="phase-3a-conditions-and-recursive-source-ownership"></a>
- [Phase 3A conditions and recursive source ownership](testing/SDK-RUNTIME.md#source-and-transaction-coverage)

<a id="bounded-nested-dialogue-foundation"></a>
- [Bounded nested-dialogue foundation](testing/SDK-RUNTIME.md#source-and-transaction-coverage)

<a id="local-mac-signed-identity-qualification-historical-deferred"></a>
- [Local Mac signed-identity qualification (historical, deferred)](tasks/archive/2026-10-16-testing-reference.md#local-mac-signed-identity-qualification-historical-deferred)

<a id="temporary-mac-development-credential-checks"></a>
- [Temporary Mac development credential checks](tasks/archive/2026-10-16-testing-reference.md#temporary-mac-development-credential-checks)

<a id="studio-synthetic-non-streaming-request"></a>
- [Studio synthetic non-streaming request](testing/AUTOMATED.md#renderer-and-production-probe-consumers)

<a id="continue-scene-focused-qualification"></a>
- [Continue Scene focused qualification](testing/SDK-RUNTIME.md#source-and-transaction-coverage)

<a id="draft-scene-focused-qualification"></a>
- [Draft Scene focused qualification](testing/SDK-RUNTIME.md#source-and-transaction-coverage)

<a id="generated-character-card-focused-qualification"></a>
- [Generated Character card focused qualification](testing/AUTOMATED.md#renderer-and-production-probe-consumers)

<a id="generated-lorebook-entry-focused-qualification"></a>
- [Generated lorebook entry focused qualification](testing/AUTOMATED.md#renderer-and-production-probe-consumers)

<a id="studio-only-integrated-phase-2-qualification"></a>
- [Studio-only integrated Phase 2 qualification](testing/NATIVE.md)

<a id="selectable-proposal-editing-focused-qualification"></a>
- [Selectable proposal editing focused qualification](testing/NATIVE.md#native-driver-requirements)

<a id="studio-closeout-readiness-sampling-and-https"></a>
- [Studio closeout readiness, sampling and HTTPS](testing/AUTOMATED.md#renderer-and-production-probe-consumers)
