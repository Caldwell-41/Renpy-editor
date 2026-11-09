# Decimal public services, #94

Scope: [#94](https://github.com/Caldwell-41/Renpy-editor/issues/94), under
[spec #87](https://github.com/Caldwell-41/Renpy-editor/issues/87). The prepared branch
`t3/decimal-arithmetic-authoring` began clean at integration tip
`bc51521c20095043518f85ae94122fab3b9f7296`; ancestry was verified before edits.
This work owns backend services and transport. Approved Story/A2 references,
production control choices, coordinator records and prior fixtures remain intact.

## Public contract for #95 and #96

Protocol version 1 uses `{protocolVersion,requestId,operation,payload}`. Successful
responses use `{protocolVersion,requestId,ok:true,value}`. Refusals use
`{protocolVersion,requestId,ok:false,error:{code,message}}`. In particular, the
success key is `value`, not the `result` spelling in the earlier #93 prose.
Every application payload carries the current `sessionId`.

`variable.create` accepts `{technicalName,variableType,defaultValue}`;
`variable.update` accepts `{id,expectedSourceRevision,defaultValue}`. `decimal` is
an explicit, fixed declared type. Decimal values/defaults/samples are finite binary64
JSON numbers. Numeric strings and booleans refuse as decimal values. Signed i64
integers retain canonical decimal-string transport, including both limits and
values beyond JavaScript's exact-number range. Existing bool/string contracts stay
unchanged. Creation and default edits use the existing source/history owner.

`scene.apply` retains its existing `SceneCommandRequest`:

```json
{
  "sessionId":"<session>",
  "expectedProjectRevision":"<project revision>",
  "expectedSourceMapRevision":"<map revision>",
  "expectedAuthoringRevision":"<authoring revision>",
  "command":{
    "type":"insertBeat",
    "sceneId":"<scene UUID>",
    "expectedSourceRevision":"<Scene source revision>",
    "beforeBeatId":null,
    "beat":{
      "type":"setVariable",
      "variableId":"<target UUID>",
      "value":{"operation":"assign","operand":"9007199254740993 / 3"}
    }
  }
}
```

The other existing Set variable commands are `updateBeat`, `insertBodyBeat` and
`updateBodyBeat`, with their usual owner/body/position assertions. Operations are
`assign`, `add`, `subtract`, `multiply`, `divide`, `floorDivide`, `remainder`.
The operand remains unevaluated source text. The one shared parser admits numeric
literals including decimal exponents, declared numeric references, signs,
parentheses and `+ - * / // %`, with Python precedence and left associativity.
Limits remain 4096 bytes, 128 nodes and depth 16. Functions, powers, attributes,
indexes and arbitrary Python remain excluded.

Ordinary division always infers decimal. Other operators infer decimal if either
operand is decimal; integer-only floor/remainder retain integer type. Integer
targets refuse decimal-result formulas even when their current value is whole.
A decimal target accepts integer results. Commands emit that assignment as
`(<formula>) + 0.0`, which stores an actual Ren'Py float and stays within the same
bounded grammar. Admission checks the emitted expression's bounds too. Recognized
source and semantic no-ops preserve original bytes. The engine never rounds a
fraction to satisfy an integer target.

`scene.validateAssignment` accepts the **same request** as `scene.apply`, limited
to those four Set variable commands with an object-valued formula. It calls the
same admission/build owner without accepting the proposal. It writes no source,
map or history. A successful transport response contains this typed value:

```json
{
  "targetVariableId":"<target UUID>",
  "value":{"operation":"assign","operand":"4 / 2"},
  "support":"supported",
  "assignment":{
    "inferredResultType":"decimal",
    "reads":[],"readVariables":[],"writes":["<target UUID>"],
    "diagnostics":[],"state":{"status":"known","value":2.0}
  },
  "projectRevision":"<project revision>",
  "sourceMapRevision":"<map revision>",
  "authoringRevision":"<authoring revision>",
  "sourceRevision":"<Scene source revision>",
  "variables":["<existing full Variable records, including ID, technicalName, variableType, defaultValue and source revision>"],
  "capabilities":{
    "operators":["+","-","*","/","//","%"],
    "operations":["assign","add","subtract","multiply","divide","floorDivide","remainder"],
    "maxBytes":4096,"maxNodes":128,"maxDepth":16,
    "integerTransport":"signedI64String","decimalTransport":"finiteFloat64",
    "functions":false
  }
}
```

Draft inspection folds constants only. A variable-dependent formula remains
`support:"supported"` with an `unobservedCurrentValue` state/diagnostic, independent
of declaration defaults or a guessed route. `scene.list` supplies the accepted
Story's conservative preceding-local state. A draft's inferred type describes the
submitted formula; accepted-source inspection also sees any emitted decimal
promotion. Both expose readable variable IDs/names/types, reads and target writes.

A formula refusal returns transport success with `support:"refused"` and a field
diagnostic. Target incompatibility names `variableId`; operand errors name
`value.operand`. Reasons include `invalidOperand`, `invalidSyntax`,
`missingVariable`, `incompatibleOperand`, `incompatibleTarget`, `zeroDivisor`,
`integerOverflow`, `nonFiniteResult`, `limitExceeded`, `unobservedCurrentValue` and
`unsupportedControlFlow`. Inferred type is null when parsing/type checking fails.
A constant zero divisor or overflow remains visible beside an unknown operand.
Source-protected decimal-to-integer assignments expose `incompatibleTarget`.

`scene.apply` retains existing error codes, including `ARITHMETIC_TARGET_TYPE`,
`INVALID_ARITHMETIC_OPERAND`, `INVALID_ARITHMETIC_SYNTAX`,
`MISSING_ARITHMETIC_VARIABLE`, `ARITHMETIC_OPERAND_TYPE`,
`ARITHMETIC_ZERO_DIVISOR`, `ARITHMETIC_OVERFLOW` and
`ARITHMETIC_LIMIT_EXCEEDED`. The overflow code covers integer range and non-finite
float results; inspection distinguishes the reasons. Revision, dirty dependency,
placement and ownership failures remain ordinary transport refusals such as
`SOURCE_CONFLICT` and `DIRTY_SOURCE`. A validation result never authorizes a later
commit against changed revisions.

`ConditionExpression` adds `{type:"decimal",value:<finite numeric source string>}`.
Numeric comparisons accept integer/decimal operands, including mixed equality and
ordering. Integer comparisons retain integer precision. Non-numeric strings and
bools remain distinct types; missing/invalid state remains unknown.

Existing `screens.canvasPlan` request/response owners accept decimal bindings and
`variableSamples:[{variableId,expectedSourceRevision,value:<finite number>}]`.
`nodes[].literal` contains resolved text, with Python float spelling. Defaults can
supply an inert canvas sample, never current Story state. Revision/dependency
checks remain in force. Plans, prediction and samples execute no button actions.
Bars retain integer-only eligibility, bounds and stepping. Decimal button actions
remain refused here; #95 owns their adapters. No LLM mutation permission changes.

## Fixtures and focused verification

- Public Story owner: `app/src-core/src/scene/tests/arithmetic.rs`.
- Existing shared command/preflight/SDK owner:
  `app/src-core/src/renpy/tests/source_foundation/arithmetic.rs`.
- Extended inert sample owner: `app/src-core/src/screens/nested_canvas_tests.rs`.
- Combined runtime inputs: `tests/fixtures/arithmetic-94/story.rpy`, `driver.rpy`.
- Exact representative request/responses: `tests/fixtures/arithmetic-94/contract.json`.
  Generated public IDs/revisions are examples, not reusable authorizations.

The combined fixture retains #93's actual public command edits, integer precision,
precedence/grouping, negative floor/remainder, i64 minimum remainder, nested edit
and opaque neighbor. It adds decimal creation/default update, public formula
assignments, numeric condition source and a public-composed screen. Independent
runtime witnesses assert values **and actual int/float types**, exact float hex
values for large integer division, float remainder, signed zero and the smallest
subnormal, mixed arithmetic/comparisons, displayed bound text and sampled text
substitution. Its wrong outcome still requires money `-14` instead of `-15` and
must fail at that assertion without its acceptance marker. The gate requires both
exact numeric/result witness lines, unchanged accepted `.rpy` sets and cleanup.

No-SDK selectors, run from `app/` with Rust/Cargo 1.90.0:

```sh
cargo test -p loomlight-core --locked --offline --lib \
  renpy::tests::source_foundation::arithmetic::decimal_fixture_preflight \
  -- --exact --nocapture
cargo test -p loomlight-core --locked --offline --lib \
  renpy::tests::source_foundation::arithmetic::decimal_draft_contract_is_revision_bound_and_does_not_commit \
  -- --exact --nocapture
```

These exercise source/history/reopen, draft diagnostics/refusal and inert samples
without SDK execution. Prior #92/#93 selectors and fixture inputs remain available.
The exact combined SDK selector is:

```sh
LOOMLIGHT_RUNTIME_SDK_ARCHIVE="$VERIFIED_RENPY_853_ARCHIVE" \
LOOMLIGHT_FOUNDATION_EVIDENCE_DIR="$FRESH_IGNORED_EVIDENCE_DIRECTORY" \
cargo test -p loomlight-core --locked --offline --lib \
  renpy::tests::source_foundation::arithmetic::decimal_sdk_gate \
  -- --ignored --exact --nocapture
```

The float algorithms follow the supported finite/i64 domain of primary
[CPython integer true division](https://github.com/python/cpython/blob/3.12/Objects/longobject.c)
and [float arithmetic/comparison](https://github.com/python/cpython/blob/3.12/Objects/floatobject.c).
Integer true division rounds the exact ratio with integer quotient/remainder;
mixed comparisons compare the i64 with the float's integral part and fraction.
Float floor/remainder use Python's remainder-sign and quotient correction rules.
The pinned 8.5.3 SDK source confirms `renpy.substitute` returns formatted text and
uses scope values for inert sample substitution. Runtime proof remains separate
from these source checks.

## Mac reservation and candidate

Exactly one Mac ARM64 invocation is reserved here from the unchanged feature-wide
six-start ceiling. Dispatch accounting was Mac 2 started / 1 reserved for #94;
Windows 1 started / 0 reserved. Before qualification this implementer has consumed
zero SDK starts. A failed or cancelled start consumes the reservation too.

Before launch, record the full clean candidate, exact command, every core/fixture
input hash, verified official 8.5.3 archive/manifest and executable hashes in the
fresh ignored `.toolchains/arithmetic-94/mac-01/launch-receipt.json`. The archive
must match `eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`.
Retain the executed test binary and raw case/source/request records. SDK environment
variables apply only to that invocation. Validate the positive Cargo summary with
`app/scripts/check-q1-prep-gates.py cargo-log`, audit all four case records and
terminal `passed:true,cleanupComplete:true`, and check no timeout/truncation or
accepted-source change. No second invocation is allocated.

Windows combined proof is not established. The coordinator must run this combined
selector/input on Windows before #95/#96 starts; #92's old fixture proves no formulas.
No Windows message/thread, editor package/native launch, manual CI, push, PR, issue
closure, integration-ref mutation or cleanup is selected here.

## Preparation results

TDD reds preceded decimal creation, formula admission, exact mixed comparisons,
Python sample spelling, the public draft request and protected target diagnostics.
Each passed after its slice. Additional public preservation checks cover CRLF,
comments, no-op history, source IDs, shared Undo/Redo, reopen and existing integer
source assigned to a decimal declaration. Imported integer expressions keep their
runtime meaning and exact integer inspection until a substantive command changes
them; opening/no-op does not promote their bytes.

Self-review traced the existing source/transaction owners, all numeric reads,
integer transport, default/current-state separation, read/write dependencies,
source-map compatibility, fixed types and integer bar restrictions. A type-only
renderer fallback displays a new declared type without adding production controls.
The previous literal-only refusal now correctly reports a target-type error for
an integer target with a decimal operand. The initial draft test accidentally
selected the fixture's pre-existing bool variable; selecting the decimal by name
corrected the harness. An initial renderer command named nonexistent compiled
filenames; the actual existing `.dom.test.js` owners were then selected. These
were harness corrections, not relaxed product admission. No SDK start occurred
during those corrections.

## Mac invocation 1: failed before runtime assertions

The one reserved invocation **started and failed**. Candidate:
`8c677ffea9552bc7746f1df27a59ae2bc185b861`, clean before launch. The exact selector
and command above ran on native ARM64 with Rust/Cargo 1.90.0. Ren'Py reported
8.5.3.26051504 and Python 3.12.8. The launch receipt retains all input hashes,
official archive/manifest hashes, matching archive-member/extracted executable
identities and a copy of the executed ARM64 test binary. Manifest provenance stays
in `spikes/renpy-sdk/published/README.md`; no new download or PGP claim is made.

| Case | Exit | Duration | Result |
| --- | ---: | ---: | --- |
| Compile | 0 | 478 ms | Passed |
| Lint | 0 | 255 ms | Passed |
| Normal entry | 1 | 545 ms | Failed at display initialization |
| Wrong outcome | none | none | Not reached |

The first failing boundary is `pygame.display.init()` during Ren'Py's initial GL
performance test, before the selected testcase or any numeric assertions:
`The video driver did not add any displays`. The raw output also records failed
macOS application notification/service connections. Classification is an
**environment limitation**, with sandbox/display access the leading explanation.
[Incident H20](../../testing/INCIDENTS.md#h20--screen-sdk-driver-assumes-an-unavailable-menu-or-style-attribute)
distinguishes this same display symptom from unrelated menu/style driver defects.
No unsandboxed comparison was run, so that explanation is not promoted to fresh
proof. No production workaround, alternative renderer or SDK retry was attempted.

The command returned Cargo exit 101 after 79.46 seconds. The existing Cargo-log
validator correctly **rejects** its failed summary. There is no positive SDK Cargo
result, normal-entry numeric/runtime-type/text/sample witness, or deliberate
wrong-outcome rejection. Compile/lint alone do not qualify runtime semantics.
#94 remains unqualified for dependent integration.

All three reached case outputs are untruncated and did not time out. The gate
checked unchanged accepted `.rpy` sets after each reached case. Terminal output is
`passed:false,cleanupComplete:true`. An independent receipt audit verified the
owned temporary SDK/project/profile/saves root is absent, no process references
that root, input hashes and the retained test executable are unchanged, and actual
installed SDK identities match the verified archive. The read-only process audit
needed scoped execution outside the sandbox because sandboxed `ps` was denied;
that audit started no SDK or application process.

Accepted runtime source SHA-256:
`74f6427a5b2a1d47586481eedb43590182330d2897db554e1eb60e122f32faaf`.
Executed/retained ARM64 test binary SHA-256:
`cfc09283b55b3b28aa71c561dc6f26f3675105e4aa60080bd2d6fe7d7464345c`.
Archive SHA-256 remains
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`;
manifest SHA-256 remains
`4b0cad9ac05dc4ca55081bd3a36458c8ea658ed021f09a87276383652b6bd98b`.

Preserve unique ignored evidence under `.toolchains/arithmetic-94/`:

- `mac-01/launch-receipt.json`, `launch-started.json`, `launch-result.json` and
  `audit.json` record the candidate, accounting, identities and failed gate audit.
- `mac-01/sdk.log`, `arithmetic-sdk-cases.json`, `arithmetic-sdk-context.json`,
  `arithmetic-requests.json`, `arithmetic-produced.rpy`, `decimal-screen.json`,
  `decimal-screen.rpy` and `test-executable` retain raw failure/source/runtime inputs.
- `mac-01/cargo-log-validation.txt` retains the rejecting checker output.
- The parent directory retains TDD reds, positive cheap logs, compiled-test identity,
  distinct selector inventory and the successful exact no-SDK preflight/contract.

Consumption is **1/1 implementer Mac start, 0 reserved/uncertain**. Feature totals
are now Mac **3 started / 0 reserved**, Windows **1 started / 0 reserved**. Against
the unchanged ceiling of six per target, three Mac and five Windows starts remain
unallocated. This handoff authorizes none of them. A coordinator allocation is
required for another Mac run. Combined Windows proof also remains required before
#95/#96 can start; no Windows contact or execution occurred here.

## Local verification and handoff

There are **144 distinct passing Rust cases**, plus **31 passing renderer cases**.
The failed SDK gate is a separate case and is not included among those passes.
Selected Rust owners are Story (51 distinct, including 19 arithmetic), Source (16),
conditions (3), variable authoring (33), nested canvas (7), actions (12), integer
controls (18) and shared arithmetic preflight/draft contract (4). Seven existing
Story specialists, one nested SDK specialist and unselected #92/#93 SDK gates stay
outside this selection. Every cheap Cargo log has a positive validator result.
Renderer owners are `scene-authoring.dom.test.js` and
`screen-interactions.dom.test.js`, with no skips. TypeScript, Rust formatting,
repository validation and whitespace checks pass. No editor package, browser or
native-editor check was launched.

Core and runtime fixture bytes remain the prelaunch candidate. A subsequent
TypeScript-only contract annotation makes each returned variable's definition
revision explicit to UI consumers; it changes no runtime bytes. Result documentation
records the failed attempt without replacing its raw receipts. No SDK repeat is
implied by these handoff edits.

Changed files relative to integration:

```text
app/src-core/src/authoring.rs
app/src-core/src/conditions.rs
app/src-core/src/conditions/arithmetic.rs
app/src-core/src/lib.rs
app/src-core/src/lifecycle.rs
app/src-core/src/renpy/tests/source_foundation/arithmetic.rs
app/src-core/src/scene.rs
app/src-core/src/scene/tests/arithmetic.rs
app/src-core/src/scene/variables.rs
app/src-core/src/screens/actions.rs
app/src-core/src/screens/nested_canvas_tests.rs
app/src/main.ts
app/src/scene-ui.ts
app/src/screen-contracts.ts
app/src/screen-interactions.ts
app/src/story-condition-editor.ts
docs/DATA_MODEL.md
docs/tasks/evidence/arithmetic-94.md
tests/fixtures/arithmetic-94/contract.json
tests/fixtures/arithmetic-94/driver.rpy
tests/fixtures/arithmetic-94/story.rpy
```
