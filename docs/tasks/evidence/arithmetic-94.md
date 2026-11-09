# Decimal public services, #94

Scope: [#94](https://github.com/Caldwell-41/Renpy-editor/issues/94), under
[spec #87](https://github.com/Caldwell-41/Renpy-editor/issues/87). The prepared branch
`t3/decimal-arithmetic-authoring` began clean at integration tip
`bc51521c20095043518f85ae94122fab3b9f7296`; ancestry was verified before edits.
This work owns backend services and transport. Approved Story/A2 references,
production control choices, coordinator records and prior fixtures remain intact.

## Current SDK limits

On 2026-11-09 Kris explicitly increased both feature-wide SDK ceilings from six
to **20 started invocations per target**. The
[delivery policy/table](../active/shared-arithmetic.md#verification-and-operation-limits)
owns current limits. Six-start and 5/6 statements in the attempts below are
historical. This increase selects no SDK run or successor work.

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

After the result commit, fetched `origin/codex/spec-87-arithmetic` again and merged
both the current local integration branch and its fetched remote-tracking ref
normally into this implementation branch. Both tips remained
`bc51521c20095043518f85ae94122fab3b9f7296`; both merges reported `Already up to date.`
Core and runtime fixture trees still match the exact prelaunch candidate. Final
handoff is local-only with clean tracked state. The coordinator owns any further
SDK allocation, fresh merger review, publication and issue acceptance.


## Coordinator runtime recovery

The coordinator retained the failed sandboxed run above and allocated one
controlled run outside the sandbox from the unchanged six-start feature ceiling.
The existing MacPower query returned no session/display fields inside the sandbox
and an active, awake, unlocked on-console desktop outside it. The controlled
Mac invocation 2 used the unchanged retained core binary from `8c677ffe`, with the
existing native-desktop admission/power helper and fresh ignored evidence in the
coordinator checkout under `.toolchains/arithmetic-94/mac-02/`. The subsequent
TypeScript-only source-revision annotation is erased at runtime; core/fixtures
matched the compiled candidate.

This second #94 run started and failed, bringing feature totals to Mac **4
started / 0 reserved**, Windows **1 started / 0 reserved**. Compile/lint passed.
Display initialization succeeded and the testcase passed 19 assertions before
failing at `assert "Fraction 2.5" timeout 10`. The following sample-text witness
and deliberately wrong outcome were not reached. Raw outputs were untruncated,
with no process timeout. SDK cleanup and desktop assertion release passed.

This is a distinct harness defect. The exact pinned SDK's `TextSelector` delegates
to `testfocus.find_focus`, which searches the focus list; its default focus uses
the current Say text while in a TranslateSay node. The accepted screen source
contains the correct `text "Fraction [fraction!q]"`, but this nonfocusable caption
is not a target of that selector during the narration. The numeric assertions
before the caption passed; full qualification remains failed.

The fixture correction requires the accepted screen to be shown and then reads
that actual screen displayable's interpolated text through the same pinned SDK
TTS path. This preserves exact bound-caption verification instead of replacing
it with an unrelated string substitution or removing the assertion. Production
code and numeric/wrong-outcome assertions are unchanged. A new selected SDK run
requires a coordinator allocation and fresh source/binary identities. The original
failed receipts remain immutable.

The exact no-SDK decimal fixture preflight passed after the correction: one test,
7.50 seconds, no failures/skips; the existing Cargo-log validator accepted it.
This rebuilt the test binary with the changed embedded driver. The coordinator
reserved one verification invocation from the original ceiling: Mac **4 started /
1 reserved**, Windows **1 started / 0 reserved**. The new launch receipt will bind
the clean fixture-fix commit, rebuilt/retained binary and fresh `mac-03` evidence.
The unchanged numeric/type/rejecting assertions remain required.


## Mac invocation 3: corrected fixture passed

The allocated verification **started and passed** outside the sandbox using the
existing desktop-admission/power helper. Exact code/fixture candidate is
`d1c201f1987d4768acca1fd7ca9ca5dff2c5779f`. Production core is unchanged from
`8c677ffe`; only the failed screen-caption selector and evidence were corrected.
The rebuilt and retained ARM64 binary embeds the corrected driver. All 208
recorded inputs match the clean candidate and remained unchanged after execution.
The official archive pin is unchanged and was rehashed before launch.

| Case | Exit | Duration | Result |
| --- | ---: | ---: | --- |
| Compile | 0 | 465 ms | Passed |
| Lint | 0 | 251 ms | Passed |
| Normal entry | 0 | 1260 ms | Exact numeric/type/text/sample witnesses passed |
| Wrong outcome | 1 | 2046 ms | Expected money-minus-14 assertion rejected |

All four unique records passed, with no timeout/truncation. The normal run
verified every retained #93 integer witness plus decimal types/defaults, exact
true-division bits, float floor/remainder, integer-to-decimal storage, signed zero,
subnormal, exact mixed comparisons, actual shown screen text and scoped sample
substitution. It emitted both `ARITHMETIC_94_NUMERIC` and `ARITHMETIC_94_VALUES`.
The wrong run failed at `money == -14`, reported `FAILED`, and emitted no wrong
acceptance marker. The existing Cargo-log validator accepts the positive one-test
summary. Accepted source sets remained unchanged through all cases.

The terminal SDK result is `passed:true,cleanupComplete:true`. The temporary
SDK/project/profile/saves root is absent. Desktop admission stayed active, awake
and unlocked; both transient power assertions were released without error. The
coordinator independently audited all 208 input hashes, retained binary and
accepted-source hashes, case/witness outputs and both cleanup owners.

Fresh ignored evidence is in the coordinator integration checkout under
`.toolchains/arithmetic-94/mac-03/`: launch/started/result receipts, desktop receipt,
`audit.json`, `sdk.log`, retained `test-executable`, and `sdk/` with full case
outputs, actual public requests/responses, accepted source and composed screen.

Accepted source SHA-256:
`aba79ac39b77a89ea42f6f9a5252d237b0da442cbe1a96c37bac3485db5640cb`.
Retained/executed ARM64 test binary SHA-256:
`e924ee2788ceed5aed7ec52db9af1af12fc069306d9821d3535858851cab33d4`.

Feature use is **Mac 5/6 started, Windows 1/6 started, no reservations**. The
original sandbox failure and the later static-caption harness failure remain
failed with immutable raw receipts. The successful result does not rewrite them.
Combined Windows qualification of this corrected fixture is still required
before #95/#96 starts. No further SDK start is selected by this result.

The #94 public-services core now has passing Mac runtime proof. Existing 144
passing Rust public/unit cases and 31 renderer cases remain scoped to unchanged
production inputs; the corrected no-SDK preflight was repeated once, not counted
as a new distinct case. This successful SDK gate adds one distinct passing case.
Fresh integration verification and Windows proof remain coordinator-owned.


## Integration equivalence and fresh checks

Normal merge `854f6ad11fdf79d6fc57d5d6e3cfa55131df7d90` combines ordered parents
`c177d1cda54658bf0a71601e94d0495e4e1eb8e5` and
`b31929f6b09158aa9d90fedfedadcf83c82493a1` without conflicts. All tracked `app/`,
`tests/fixtures/`, `scripts/` and `.github/` inputs equal qualified corrected
candidate `d1c201f1987d4768acca1fd7ca9ca5dff2c5779f`. All 208 successful launch
receipt input hashes match after integration. The app tree is
`f6f061000a3646d4f17ebe329971c58aa9f72ee5`; the fixture tree is
`093bfc9e0ef730acd4cf299be701f9a4d37d361d`.

The merger rechecked the retained binary and accepted-source hashes against the
independent `mac-03/audit.json`. The existing audit proves all four unique case
records, exact witnesses, deliberate rejection and SDK/desktop cleanup. The
merger's before/after manifest preserves all 40 files across `mac-01` in the
read-only source worktree and `mac-02`/`mac-03` in integration. Failed statuses
remain failed. H69 links the selector cause and correction without a new test or
production patch.

The approved Design Lab tree `b32e5588f20b9e803ed32a4c2d4c0be8286e8bca`, design
records `479a99d146ca5e04c704fd771bb857cc581cd23d`, #92 fixture tree
`0a14efb0d9c28697204bc172381e9a0623b2ce2a` and #93 fixture tree
`644f88580e70af831892e82327b4298dd900a0d3` equal the pre-merge coordinator.
All three coordinator records were intact before the merger updated current state.

Reuse the scoped 144 Rust public/unit and 31 renderer passes. The corrected SDK
gate adds one distinct Rust pass, for 145 including SDK. The repeated no-SDK
preflight is the same case. No unchanged full suite was rerun. The original code
candidate `8c677ffe` predates the source-revision TypeScript annotation at
`f72a91c2`; the merger freshly ran `npm run typecheck` using pinned Node 24.19.0,
npm 11.9.0 and the repository TypeScript dependency. It passes with the annotation.
Fresh static checks pass seven draft request/response pairs, revision identity,
definition source fields, diagnostics, finite decimal samples/resolved text and
the integration/base quality-only branch plan. Repository validation and
integration/working-tree whitespace checks pass. Ignored merger outputs are in
`.toolchains/arithmetic-94/integration-merge/`.

Merge `854f6ad1` is the Windows-ready source candidate; subsequent checkpoint
changes are documentation only. Combined #93/#94 Windows SDK qualification is
still required before #95/#96. Current ceilings are 20 per target as stated above;
this merger used zero SDK/native-editor/package/browser/manual-CI starts and
allocated none. The coordinator resumes exclusive mutation ownership on completion.


## Windows combined invocation 1 result, 2026-11-09

The one allocated Windows invocation **started and passed** on SUNDOWN. Tested
checkpoint: `cae4dfc08425b14513a12af009ded11f6d436514`. The existing clean
`codex/spec-87-windows-92` qualification worktree fast-forwarded from
`c7e4e3459303736f85de8c55cd88f5895e020e19` after fetch and ancestry checks.
No checkout, branch or worktree was created. The registered Screens checkout stayed
clean on its original branch at `251fb47754a0ec1a43ece8763a0b4603b8e54dd8`.
All 29 prior #92 evidence files across both checkouts retain their original hashes.

Before execution, 875 tracked source/config/lock/fixture/tooling inputs matched
`git cat-file --filters` for the dispatched checkpoint. App, fixtures, scripts and
CI inputs also equal Mac-qualified `d1c201f1987d4768acca1fd7ca9ca5dff2c5779f`
and merge `854f6ad11fdf79d6fc57d5d6e3cfa55131df7d90`. The app/fixture trees
remain the identities recorded above. All 875 working input hashes stayed unchanged.

Native target: `x86_64-pc-windows-msvc`, Windows 11 build 26200. Rust 1.90.0
(`1159e78c4`), Cargo 1.90.0 (`840b83a10`), existing MSVC toolset 14.50.35717,
compiler 19.50.35726. The process-local development helper loaded existing tools;
the Cargo-log checker used existing Python 3.12.14. The executed SDK reports
Ren'Py 8.5.3.26051504 and its Windows Python 3.12.7. No installation/download ran.

Exact commands from `app/`, in this order:

```sh
cargo test -p loomlight-core --locked --offline --lib renpy::tests::source_foundation::arithmetic::decimal_fixture_preflight -- --exact --nocapture
cargo test -p loomlight-core --locked --offline --lib renpy::tests::source_foundation::arithmetic::decimal_draft_contract_is_revision_bound_and_does_not_commit -- --exact --nocapture
cargo test -p loomlight-core --locked --offline --lib --no-run --message-format=json
cargo test -p loomlight-core --locked --offline --lib renpy::tests::source_foundation::arithmetic::decimal_sdk_gate -- --ignored --exact --nocapture
```

Both no-SDK selectors passed exactly one test, with no failures/ignored cases,
in 16.94 s and 1.34 s respectively. Their command durations were 54.562 s and
1.875 s, including compilation/checking. Fresh build JSON/stderr and the copied
executed x64 test executable were retained before SDK launch. All three test logs
passed `python scripts/check-q1-prep-gates.py cargo-log <retained-log>`.

Immediately before SDK use, retained official archive SHA-256 matched
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`.
Both retained and repository checksum manifests matched
`4b0cad9ac05dc4ca55081bd3a36458c8ea658ed021f09a87276383652b6bd98b`.
The unchanged [published provenance](../../../spikes/renpy-sdk/published/README.md)
applies; no separate PGP claim is made. Archive-member, existing extracted and
actually installed `renpy.py`/Windows Python executable hashes agree.
Only the SDK command received `LOOMLIGHT_RUNTIME_SDK_ARCHIVE` and
`LOOMLIGHT_FOUNDATION_EVIDENCE_DIR`, pointing to the verified archive and fresh
ignored `.toolchains/arithmetic-94/windows-01/sdk/`. Child `TEMP`/`TMP` used a
fresh owned short scratch. Exact local paths/args/env names stay in ignored receipts.

Launch attempt: **2026-11-09T12:13:41.018950Z**; process creation receipt:
**12:13:41.027156Z**. Cargo exited 0 after 106.343 s; its positive named one-test
summary reports 105.90 s, zero failed/ignored cases.

| Unique SDK case | Exit | Duration | Result |
| --- | ---: | ---: | --- |
| Compile | 0 | 1435 ms | Passed |
| Lint | 0 | 927 ms | Passed |
| Normal entry | 0 | 2125 ms | All 22 assertions passed |
| Wrong outcome | 1 | 3002 ms | Required `money == -14` assertion rejected |

All four records occur exactly once, with no timeout or output truncation.
The SDK's raw inner summaries list each selected name twice, leaving one duplicate
not run in normal entry and skipped after wrong-outcome failure. The selector audit
retains those labels and summaries: the unique normal case executed all 22 assertions;
the unique wrong case passed its first two assertions and failed the required third.
No distinct required case or assertion is missing, and duplicates add no passes.

Normal entry proves #93 exact integer precision, precedence/grouping, nested edits,
negative floor/remainder and i64-minimum remainder, with actual integer types and
opaque-neighbor preservation. #94 proves actual float storage/defaults, exact
large-integer division bits, float floor/remainder, integer widening, mixed
arithmetic/comparisons, negative zero and the smallest subnormal. Following H69,
the driver requires the shown screen and checks its actual interpolated caption
through TTS. The inert public sample and SDK scoped substitution agree. Both exact
witnesses match:

```text
ARITHMETIC_94_NUMERIC quotient=0x1.5555555555556p+51 floor=9.0 remainder=0x1.0000000000000p-54 widened=float:-3.0 mixed=float:9007199254740992.0 zero=-0x0.0p+0 subnormal=0x0.0000000000001p-1022 default=float:2.5 comparisons=True text=Fraction_2.5 sample=Fraction_1e-07
ARITHMETIC_94_VALUES score=36028797018963992 money=-15 remainder=-2 minimum=0 opaque=kept
```

Wrong outcome reports `FAILED` at `AssertionError: assert eval (money == -14)`
and never emits `ARITHMETIC_94_WRONG_ACCEPTED`. This is the selected rejecting
assertion, not an unexpected product failure.

SHA-256 identities:

| Input/artifact | SHA-256 |
| --- | --- |
| Complete 875-input manifest | `fdd6ccd6d7b6dae74308e69c8eb8e2e1e0c8eda7bbc98377406d4298d11da27d` |
| Shared arithmetic test owner | `0f2cff6166c2a5f2de016e53edbe40985db0c1c152710a7e1c008c2fbcbce161` |
| #94 story fixture | `38042613b7ad124b2c16515c5d389ad9f1938525f8660a1e471e098560231379` |
| #94 driver fixture | `0b3addca6c659f11e3051c606e65722b33d6bc67ee1faee8bfef8a4200162563` |
| Executed/retained x64 binary | `335ba0017505dfffd1020653c5abd5ac04ad6c5f504b15f8ff43dc2fc9ab688e` |
| Accepted runtime source | `b0fd3840334a9e375b5e4947d7ae6b6659735488fabcd315a18020e758ff96d0` |
| Composed screen source | `b25437e63cae2a8415ea0be2ed83e5b28b5c690b08af980d20a95dc66d34796e` |

The gate checked unchanged accepted `.rpy` sets after every case. Terminal result
is `passed:true,cleanupComplete:true`. Independent audit confirms matching inputs,
binary, SDK identities, ten actual public edit request/response pairs, accepted
source and composed screen/default/sample plans. The owned SDK/project/profile/saves
root is absent; the empty outer scratch was removed. No owned process remains.

Preserve fresh ignored `.toolchains/arithmetic-94/windows-01/`: input/source/host
proof, build JSON/stderr and executable, both preflight logs/checker receipts,
launch/started/result receipts, SDK log/stderr/checker receipt, `sdk/` raw cases,
requests/responses, accepted source and screen records, independent `audit.json`,
selector/process audits and raw hash inventory. No source/fixture correction or
retry occurred. Repository documentation validation and whitespace checks pass.

Actual consumption is **1 selected Windows SDK start**, bringing Windows to
**2/20 started, zero reserved/uncertain for this assignment**. Mac stays **5/20**
with no reservation here. This supplies combined #93/#94 Windows qualification;
no selected acceptance evidence is missing. The coordinator retains integration,
ledger/status updates, final review, tickets and #95/#96 entry decisions.
