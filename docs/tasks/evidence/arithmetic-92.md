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
- Story owner: 36 passed; 7 existing explicitly ignored specialist cases unrun.
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

### Mac invocation 1 reservation receipt

Exact implementation candidate:
`1ba9fe447c5322683e11026c98ae9c4b38996240`.
The only prelaunch working-tree change is this evidence receipt; code and fixtures
match that commit. The command is the reproduction command above, from `app/`,
with the verified official archive and fresh ignored output directory
`.toolchains/arithmetic-92/mac-01` in this worktree. Host is native macOS ARM64;
Rust/Cargo 1.90.0. The existing SDK adapter owns all child argument arrays,
timeouts and cleanup. Reservation remains **0 started, 1 reserved** until launch.
No Windows invocation or second Mac invocation is authorized to this implementer.

The reserved gate has started. Consumption is now **1 Mac invocation started,
0 reserved, no second slot**. The raw launch receipt records candidate, fixture
hashes, target and test-executable SHA-256. Windows remains unstarted here.

### Mac invocation 1 result

**Started and passed.** Consumption is **1/1 implementer Mac invocation,
0 reserved/uncertain**, charged to the feature-wide Mac total. No second run was
started. Windows consumption by this implementer is **0** and its proof is pending.

The selected gate passed one test in 74.05 seconds. Its individual results were:

| Case | Exit | Timed out | Output truncated | Duration | Result |
| --- | ---: | --- | --- | ---: | --- |
| Compile | 0 | false | false | 470 ms | Passed |
| Lint | 0 | false | false | 259 ms | Passed |
| Normal entry | 0 | false | false | 1269 ms | Passed with exact values |
| Wrong outcome | 1 | false | false | 2092 ms | Expected rejection |

Normal-entry output contained
`ARITHMETIC_92_VALUES score=9007199254740994 money=7 opaque=kept` and the engine's
`PASSED` status. The wrong-outcome run contained `FAILED`, without its wrong
acceptance marker. All four named records were present once. The terminal record
had `passed:true` and `cleanupComplete:true`; the existing Cargo log validator
accepted the positive one-test summary. The original project, temporary SDK,
profile, saves and token directory were removed by the owned temporary-directory
cleanup. The `.rpy` source set was identical before/after every SDK case.

Raw ignored evidence under `.toolchains/arithmetic-92/mac-01/`:

- `launch-receipt.json`, including candidate, input and executable hashes.
- `sdk.log`, containing raw gate stdout/stderr and the terminal cleanup result.
- `arithmetic-sdk-cases.json`, containing each full SDK output and duration.
- `arithmetic-requests.json`, containing the actual public requests/responses.
- `arithmetic-produced.rpy`, the accepted source used by the runtime oracle.
- `test-executable`, the retained ARM64 test binary.

Accepted source SHA-256:
`848f2c83cbd1b0759c2f5eba6c4c72a82b751407e2fcec066cfd1e491db93355`.
Test executable SHA-256:
`99241779f66763baa0ed4b63a4923687c961cf5677d20397d1f27746c857bcfc`.
Fixtures are reproducible from the same selector; freshly generated Scene IDs and
labels change project-specific bytes/hashes while the input and value oracle stay
fixed. No editor package/native-input proof or both-target acceptance is claimed.

Review checked that both root and explicit-body updates share the same assignment
patch owner, legacy kind refinement still checks exact ranges/hashes, variable
read/write inspection has one core owner, and renderer code only consumes typed
results. A range-indexed lookup keeps map refinement linear in Beat count. Existing
literal command consumers were updated only where the added Rust request field
required compilation or typed renderer transport required compatibility.

The committed `tests/fixtures/arithmetic-92/contract.json` is a complete successful
public request/response example from the qualified fixture's final Subtract command,
with only the outer session/request identifiers replaced by example identifiers.
Generated UUIDs, revisions and response fields are retained exactly. The numeric
oracle remains the independent driver fixture; this response example is contract
documentation. The source and driver inputs used for qualification are unchanged.

Final code verification repeated the affected mapping consumers after review:
Story **37 passed** (including the five new #92 cases), Source **16 passed**,
conditions **3 passed**, literal transport **1 passed**, fixture preflight **1 passed**
and the Mac SDK gate **1 passed**. These are 59 distinct passing Rust cases.
Seven existing ignored Story specialist cases remain deliberately unselected.
The selected renderer suite passed 43 cases. Rust formatting, TypeScript,
repository validation and whitespace checks passed. No required selected check
was failed, cancelled or skipped at handoff.


## Integration handoff

Merged current integration tip `6c2272ecf7340b5e64c145059eb1f29534eb49f2` into this
branch with merge commit `ae4c885bc486c1ec772f0c9f115f7fa35256c27b`. That merge
carries the coordinator's CURRENT/HANDOVER/shared-ledger changes unchanged; this
implementer did not author edits to those files. Implementation and SDK fixture
source remain identical to the qualified implementation candidate. Publication,
issue closure and the merge into integration belong to the coordinator/fresh merger.

Changed files relative to that integration tip:

```text
app/src-core/src/authoring.rs
app/src-core/src/conditions.rs
app/src-core/src/conditions/arithmetic.rs
app/src-core/src/lib.rs
app/src-core/src/lifecycle.rs
app/src-core/src/lifecycle/acceptance.rs
app/src-core/src/renpy/tests/phase1h.rs
app/src-core/src/renpy/tests/source_foundation.rs
app/src-core/src/renpy/tests/source_foundation/arithmetic.rs
app/src-core/src/scene.rs
app/src-core/src/scene/structure.rs
app/src-core/src/scene/tests/arithmetic.rs
app/src-core/src/scene/variables.rs
app/src-core/src/screens/component_tests.rs
app/src-core/src/screens/panel_tests.rs
app/src-core/src/source.rs
app/src/main.ts
app/src/scene-ui.ts
docs/DATA_MODEL.md
docs/tasks/evidence/arithmetic-92.md
tests/fixtures/arithmetic-92/contract.json
tests/fixtures/arithmetic-92/driver.rpy
tests/fixtures/arithmetic-92/story.rpy
```

## Windows preflight, no SDK execution

The read-only SUNDOWN delegate completed preflight against requested published
candidate `d797eb04026a5d81072d0aaa6f5f1a5b8966c33d`. The registered checkout
is clean on `codex/phase3b-screen-designer` at
`251fb47754a0ec1a43ece8763a0b4603b8e54dd8`, with one registered worktree.
It does not contain the requested tested state. The delegate preserved checkout,
refs, tracked files, other processes and prior evidence; it did not run the gate.

Reported host capabilities are Rust/Cargo 1.90.0, x64 MSVC compiler/linker
14.50.35717, Node 24.22.1 and npm 11.9.0. The existing Ren'Py 8.5.3 archive
matches its local checksum manifest, and extracted Windows x64 executables are
present. None ran. No fixture/preflight test, compile, lint or runtime qualification
was executed. These inventory results establish readiness of tools, not #92 proof.

The remote ignored `.toolchains/arithmetic-92/windows-preflight-01/` directory
retains `preflight.json` and raw inventories. The coordinator read the completed
delegate's result; no cross-host artifact transfer or independent rehash is claimed.
SDK consumption remains **0 Windows started, 1 reserved** under the shared ledger.

T3 rejected isolated remote delegation before agent creation because linked
environments do not support `delegate_task` worktree isolation. The alternative
requires a new top-level chat with a prepared worktree. Kris's current new-chat
permission covers prototypes, so the coordinator has requested authorization for
a Windows qualification chat. No such chat has been created. #92 remains pending
Windows proof, and no target evidence or acceptance is inferred from this preflight.

## Windows invocation 1 result, 2026-11-09

**Started and passed.** Kris explicitly selected the new Windows qualification
chat and its host-prepared worktree. That approval supersedes the pending setup
authorization in the preceding checkpoint. This qualification used only the one
reserved Windows invocation. Windows feature consumption is now **1 started,
0 reserved, ceiling 6**. No second invocation ran.

Tested integration SHA: `c7b8157ee90aaf416030de0692abede7e4981c30`.
Qualification branch: `codex/spec-87-windows-92`. The worktree started clean at
that exact dispatched commit. Before launch, both committed trees and working
inputs matched the dispatched source:

- App tree: `56443af74404b1171f8d9d0524f90dbad91e23ba`.
- Fixture tree: `8f07e3d432d82c4235f7ae3a72601d2e0cf15edf`.
- `story.rpy` SHA-256:
  `d8d05c806b6d5ad9f661ef7e5707d6ce4535de8d4ecf719d3d19ec310f941eeb`.
- `driver.rpy` SHA-256:
  `e83f3a719fdd470f63d0eed740c8dffcead2be425f67b60e0b8bee0c28b5b399`.
- Complete working app/fixture hash manifest SHA-256:
  `025ccb0edcc4d17d0c1ef2fe0adf1ab44d263fc90b0e919d334dbf8f9916561f`.

The target was native Windows x64, `x86_64-pc-windows-msvc`, using Rust/Cargo
1.90.0 and MSVC 14.50.35717. The process-local development helper loaded existing
tools. The existing official Ren'Py 8.5.3 archive was rehashed before launch and
matched the project pin
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`.
The retained local and repository checksum manifests both matched
`4b0cad9ac05dc4ca55081bd3a36458c8ea658ed021f09a87276383652b6bd98b`.
[Retained manifest provenance](../../../spikes/renpy-sdk/published/README.md)
records its official acquisition; no separate PGP verification is claimed.
The gate's existing installer verified the archive again. No download was needed.

The exact no-SDK preflight ran first from `app/`:

```sh
cargo test -p loomlight-core --locked --offline --lib \
  renpy::tests::source_foundation::arithmetic::arithmetic_fixture_preflight \
  -- --exact --nocapture
```

It passed one test in 5.11 seconds, with zero failures or ignored cases. Its
existing assertions exercised public edits, accepted bytes, shared Undo/Redo,
reopen, invalid-operand refusal and dirty-source refusal. It started no SDK.
The existing `cargo-log` checker accepted its positive summary.

The launch receipt recorded the full tested SHA, input hashes, verified archive,
target, exact SDK command and test executable before launch. The SDK command was
the reproduction command in [Verification and Mac reservation](#verification-and-mac-reservation),
with `LOOMLIGHT_RUNTIME_SDK_ARCHIVE` pointing to
the verified archive and `LOOMLIGHT_FOUNDATION_EVIDENCE_DIR` to fresh ignored
`.toolchains/arithmetic-92/windows-01/sdk/`. Child `TEMP` and `TMP` used one fresh,
short directory under the host temporary root. No global settings changed.

The SDK gate passed one test in 93.81 seconds, with Cargo exit 0 and zero failures
or ignored cases. The existing `cargo-log` checker accepted that summary.

| Case | Exit | Timed out | Output truncated | Duration | Result |
| --- | ---: | --- | --- | ---: | --- |
| Compile | 0 | false | false | 1496 ms | Passed |
| Lint | 0 | false | false | 988 ms | Passed |
| Normal entry | 0 | false | false | 2249 ms | Passed with exact values |
| Wrong outcome | 1 | false | false | 3045 ms | Expected rejection |

All four named case records were present exactly once. Normal entry reported
`ARITHMETIC_92_VALUES score=9007199254740994 money=7 opaque=kept` and `PASSED`.
The wrong case failed at its deliberate `money == 8` assertion, reported `FAILED`
and never emitted `ARITHMETIC_92_WRONG_ACCEPTED`. This confirms the required
deliberate wrong-outcome rejection. Normal compile/lint/runtime outputs contained
no unexpected diagnostic error.

The gate asserted byte-identical accepted `.rpy` source sets after every SDK case.
Its terminal record was `arithmetic-sdk-terminal` with `passed:true` and
`cleanupComplete:true`. The owned temporary SDK/project/profile/saves root no
longer existed after completion. The executable and every tracked app/fixture
input hash remained unchanged. The original registered Screens checkout remained
clean at `251fb47754a0ec1a43ece8763a0b4603b8e54dd8`; its unique preflight evidence
hashes also remained unchanged. No production code, tests, fixtures or gates changed.

Raw evidence remains in this qualification worktree under ignored
`.toolchains/arithmetic-92/windows-01/`. Preserve this worktree:

- `launch-receipt.json`, `launch-started.json`, `launch-result.json`, `host.json`,
  `input-manifest.json` and `input-blobs.txt` retain launch and input identities.
- `test-executable.exe` retains the x64 test executable; `build.jsonl` and
  `build.stderr` retain compilation evidence.
- `preflight.log`, `preflight.stderr` and `preflight/` retain the no-SDK result,
  accepted source and actual public requests/responses.
- `sdk.log`, `sdk.stderr`, both Cargo validation receipts and `audit.json` retain
  the gate, terminal cleanup and result audit.
- `sdk/arithmetic-sdk-cases.json`, `sdk/arithmetic-requests.json` and
  `sdk/arithmetic-produced.rpy` retain complete outputs, all three actual public
  edit requests/responses and accepted source.

Accepted runtime source SHA-256:
`e0e7243140fc20365150144b5fcb91457ecb03c59d2cbcda58222c1512fb128f`.
Retained and executed x64 test executable SHA-256:
`73a9f4f887456e692f173eb455f77f698aed4f034e969138f8eac13d0db22526`.
The accepted source has generated project-specific IDs; its input fixtures and
independent value oracle are unchanged. This result supplies the selected Windows
SDK qualification. Ticket acceptance and integration remain with the coordinator.
No editor package, native editor launch, manual CI matrix, release or PR-status audit ran.
