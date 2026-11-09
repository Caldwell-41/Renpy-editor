# Integer Story arithmetic, #92

## Scope and identity

Implements [#92](https://github.com/Caldwell-41/Renpy-editor/issues/92), the first
backend slice of [#87](https://github.com/Caldwell-41/Renpy-editor/issues/87).
Branch `t3/arithmetic-backend-slice` started clean at
`276f6c05b59ddcad8cf951f34297ff18273357cf`, the integration tip at entry, based on
accepted Screens `251fb477`. No subagents, production layout/copy, Design Lab,
shared execution ledger or coordinator status files were changed.

The [canonical variable contract](../../DATA_MODEL.md#variables-and-state) owns
behavior. This note owns exact examples, fixture inputs and ticket evidence.
Formula operands, decimals, Screens arithmetic and production arithmetic controls
remain with later tickets. Existing literal and signed i64 transport stay intact.

## Public contract

Existing operations are `scene.list` and `scene.apply`. The latter still returns
the full SceneWorkspace. No new operation or renderer evaluator is introduced.
`value` is the existing literal union extended by the strictly admitted
`IntegerAdjustment` object. Its `operation` is `add` or `subtract`; `operand` is a
canonical signed i64 decimal string. JSON numeric operands, decimals, formulas,
leading plus/zeros, negative zero, unknown fields and other operations refuse.
Source may spell a signed literal with `+`; inspection normalizes its operand
without rewriting accepted bytes.

The following request is an exact shape. `P`, `M`, `A`, `S` denote the revisions
returned by the preceding `scene.list`; IDs denote selections from that response.
Replace those symbols, rather than generating IDs or revisions in the renderer.
The ordinary protocol/session envelope is shown too.

```json
{
  "protocolVersion": 1,
  "requestId": "arithmetic-add",
  "operation": "scene.apply",
  "payload": {
    "sessionId": "session",
    "expectedProjectRevision": "P",
    "expectedSourceMapRevision": "M",
    "expectedAuthoringRevision": "A",
    "command": {
      "type": "insertBodyBeat",
      "sceneId": "scene",
      "expectedSourceRevision": "S",
      "body": {"type": "root"},
      "position": {"type": "before", "anchor": {"type": "beat", "beatId": "return"}},
      "beat": {
        "type": "setVariable",
        "variableId": "score",
        "value": {"operation": "add", "operand": "2"}
      }
    }
  }
}
```

Updating the same beat uses the same envelope and revisions, with this command:

```json
{
  "type": "updateBodyBeat",
  "sceneId": "scene",
  "expectedSourceRevision": "S",
  "beatId": "assignment",
  "expectedBody": {"type": "root"},
  "beat": {
    "type": "setVariable",
    "variableId": "score",
    "value": {"operation": "subtract", "operand": "3"}
  }
}
```

The legacy `insertBeat`/`updateBeat` commands accept the same payload and preserve
their qualified root boundaries. Explicit branch bodies use the existing group
and branch IDs. Undo/Redo retain their existing shared command envelopes and do
not need an authoring revision. Literal assignments also retain their existing
requests, for example `{"type":"setVariable","variableId":"score","value":"5"}`,
bool `true` and string `"ready"`.

`scene.list` and successful `scene.apply` responses add `authoringRevision` at the
workspace root. It is SHA-256 of the serialized verified AuthoringMetadata,
including refreshed declaration source revisions. It is opaque to consumers.
All existing workspace fields remain. `authoring.variables` supplies choices in
this existing shape (examples below omit each variable's extensible extra fields):

```json
[
  {"id":"score","technicalName":"score","variableType":"int","defaultValue":"99","source":{"path":"game/definitions/variables.rpy","statement":"default score = 99","sourceRevision":"V"}},
  {"id":"flag","technicalName":"flag","variableType":"bool","defaultValue":false,"source":{"path":"game/definitions/variables.rpy","statement":"default flag = False","sourceRevision":"V"}},
  {"id":"name","technicalName":"name","variableType":"string","defaultValue":"ready","source":{"path":"game/definitions/variables.rpy","statement":"default name = \"ready\"","sourceRevision":"V"}}
]
```

All three types support literal Set; only `int` supports Add/Subtract in this
slice. Each recognized Set variable SceneBeat adds `assignment`. For an Add 2
following a local literal Set 5, these are the exact payload and inspection fields:

```json
{
  "payload": {"type":"setVariable","variableId":"score","value":{"operation":"add","operand":"2"}},
  "assignment": {
    "inferredResultType":"int",
    "reads":["score"],
    "writes":["score"],
    "state":{"status":"known","value":"7"}
  }
}
```

Literal Set has empty `reads` and one `writes` entry. Known values retain the
bool/string/lossless-integer transport. A declaration default of 99 with no
preceding supported Set produces
`{"status":"unknown","reason":"unobservedCurrentValue"}`. Custom Code, calls,
Screens effects, conditions, menus and transfers conservatively invalidate local
knowledge with `unsupportedControlFlow`. Nested assignments remain unknown without
route inference. A known calculation outside i64 yields `integerOverflow`.
`invalidOperand` is the evaluator's defensive invalid-input reason; admitted
arithmetic cannot produce it. A following supported root literal Set can establish
knowledge again. Drafts, defaults and runtime execution do not seed this inspection.

Refusals use the existing response shape, for example:

```json
{"protocolVersion":1,"requestId":"arithmetic-refusal","ok":false,"error":{"code":"INVALID_ARITHMETIC_OPERAND","message":"value.operand: Enter a canonical signed 64-bit whole number and choose Add or Subtract."}}
```

| Case | Error code | Field/reason |
| --- | --- | --- |
| Missing target | `MISSING_ARITHMETIC_TARGET` | `variableId: Choose an existing variable.` |
| Bool/string target | `ARITHMETIC_TARGET_TYPE` | `variableId: Add and Subtract require a whole-number variable.` |
| Invalid operand/object/operation | `INVALID_ARITHMETIC_OPERAND` | `value.operand`, message above |
| Absent/stale authoring revision or stale source/map/project revision | `SOURCE_CONFLICT` | Existing revision refusal |
| Pending Scene or declaration Source draft | `DIRTY_SOURCE` | Save or discard the draft first |
| Wrong body or protected neighbor | Existing `SCENE_INVARIANT` / `OPAQUE_BOUNDARY` | Existing ownership admission |

Refusals change neither accepted source nor shared history. Integer overflow in
already accepted source is an inspection diagnostic, not a claim that Ren'Py's
arbitrary-precision integer runtime stops at i64.

## Source compatibility and fixtures

The source map remains schema 8. Exact range, byte hash and order checks still
apply. The sole kind refinement allows old `customCode` mappings for recognized
integer arithmetic. IDs and unknown metadata survive. Opening a current map does
not rewrite it; an edit can refine its kind through the existing recoverable
transaction. Older schema migration also retains IDs without source rewrites.

Public command tests cover compound/explicit Add/Subtract, positive/negative
operands, semantic no-op bytes/history, CRLF/comments/opaque Python, stable IDs,
old maps and schema-7 migration, refusal, Undo/Redo, reopen, exact values beyond
JavaScript's safe integer range, overflow and unobserved state.

- Public core owner: `app/src-core/src/scene/tests/arithmetic.rs`.
- Fixture/gate owner:
  `app/src-core/src/renpy/tests/source_foundation/arithmetic.rs`.
- Representative imported source: `tests/fixtures/arithmetic-92/story.rpy`.
- Runtime oracle and deliberately wrong outcome:
  `tests/fixtures/arithmetic-92/driver.rpy`.
- Zero-SDK fixture preflight selector:
  `renpy::tests::source_foundation::arithmetic::arithmetic_fixture_preflight`.

The gate creates score/money with default 99. It imports the representative source,
updates the explicit Subtract operand from 1 to 2, inserts Add 1 before it, and
inserts money Subtract 3 after literal Set 10. The accepted runtime values are
score `9007199254740994`, money `7`, opaque neighbor `"kept"`. The gate exercises
Undo/Redo and reopen before SDK execution, retains actual requests/responses and
accepted bytes, and checks that the SDK does not alter the `.rpy` source set.
The wrong-outcome case expects money 8 and must fail without its acceptance marker.

## Verification and Mac reservation

TDD used the confirmed public-command/source/history/reopen/refusal seams.
Observed reds preceded the Add slice, source/no-op slice, state-inspection slice
and focused-diagnostic slice. No private parser tests or new framework were added.
One initial test used the wrong existing command spelling; it was corrected to
`insertBodyBeat` before the feature red. The SDK preflight initially selected an
opaque Python anchor and correctly refused. Selecting the existing editable anchor
fixed the fixture. These cheap failures started no SDK process.

Cheap results before SDK qualification:

- Integer public-command tests: 5 passed, none skipped.
- Story owner: 36 passed; 7 existing explicitly ignored specialist/SDK cases unrun.
- Source owner: 16 passed; typed condition owner: 3 passed.
- SDK fixture preflight: 1 passed, zero SDK execution.
- Selected renderer Story/structure tests: 43 passed, none skipped.
- Production TypeScript check and repository validator passed.
- Cargo logs validated with existing `check-q1-prep-gates.py cargo-log`.

One Mac ARM64 fixture invocation is reserved under the parent's six-start cap.
Before launch, SDK usage is **not started, 0 consumed, 1 reserved** for this ticket.
There is no second Mac slot. The batch includes pinned install/version validation,
starter generation, compile, lint, normal-entry value assertions and a deliberate
wrong-outcome rejection, all within the one selected ignored gate invocation.
It creates no editor package and launches no editor application.

Pinned official archive: Ren'Py 8.5.3, SHA-256
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`.
The retained official checksum manifest/provenance and local archive were read;
archive bytes matched the pin before launch. The production installer verifies
that same checksum again. No SDK download or substitution was needed.

Exact candidate is the Git commit titled `Support integer Story Add and Subtract (#92)`
containing this reservation. Record its full SHA in the launch receipt before the
command starts. Inputs are that candidate's two fixture files and gate above.

Reproduce from `app/` with the host's existing pinned Rust toolchain active:

```sh
LOOMLIGHT_RUNTIME_SDK_ARCHIVE="$VERIFIED_RENPY_853_ARCHIVE" \
LOOMLIGHT_FOUNDATION_EVIDENCE_DIR="$ARITHMETIC_EVIDENCE_DIR" \
cargo test -p loomlight-core --locked --offline --lib \
  renpy::tests::source_foundation::arithmetic::arithmetic_sdk_gate \
  -- --ignored --exact --nocapture
```

The evidence directory must be a fresh ignored directory. Retain stdout/stderr
and validate its positive Cargo summary with the existing `cargo-log` checker.
Require compile/lint/normal-entry success, the expected wrong-outcome rejection,
untruncated outputs, the value witness and `arithmetic-sdk-terminal` with true
`passed` and `cleanupComplete`. Windows uses the same selector/inputs, a verified
archive on that host, and short contained `TEMP`/`TMP` paths. Windows execution is
coordinator-owned and has not started here. Mac success alone does not establish
both-target acceptance.

Local raw evidence is ignored under `.toolchains/arithmetic-92/`, including cheap
logs, `preflight/arithmetic-produced.rpy` and `preflight/arithmetic-requests.json`.
No private paths or raw outputs are committed. Candidate/result receipts follow
below after the reserved invocation completes.
