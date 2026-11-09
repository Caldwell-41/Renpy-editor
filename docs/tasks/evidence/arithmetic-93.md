# Story whole-number formulas, #93

Scope: [#93](https://github.com/Caldwell-41/Renpy-editor/issues/93), under
[spec #87](https://github.com/Caldwell-41/Renpy-editor/issues/87). The prepared
branch `t3/story-whole-number-formulas` began clean at integration tip
`7e1c3133ebd6fe1fbd7bb9aa27b587562df4442c`; ancestry was verified before edits.
No subagents, production controls, Design Lab files or coordinator records changed.
This note supersedes #92's literal-only arithmetic limits, not its retained evidence.

## Public contract for #94, #95 and #96

The existing `scene.apply` envelope remains protocol version 1, with `requestId`
and a payload containing `sessionId`, `expectedProjectRevision`,
`expectedSourceMapRevision`, `expectedAuthoringRevision` and `command`. The command
is an existing `insertBeat`, `updateBeat`, `insertBodyBeat` or `updateBodyBeat` with
its Scene/source revision, target/body/position assertions and this Beat:

```json
{"type":"setVariable","variableId":"<target UUID>","value":{"operation":"assign","operand":"score + (bonus + 2) * 4"}}
```

`operation` is `assign`, `add`, `subtract`, `multiply`, `floorDivide` or `remainder`.
`assign` replaces the target value; the other operations combine its current value
with the whole operand expression. `operand` is a string, never a JavaScript
number or an evaluated/captured value. Integer literals, declared integer variables,
`+`/`-` signs, parentheses and `+ - * // %` are supported with Python precedence and
left associativity. The existing limits apply: 4096 source bytes, 128 expression
nodes and depth 16. Integers must fit signed i64, including intermediate values.
Ordinary `/`, decimal operands, calls, powers, attributes and indexes are excluded.
There is one bounded arithmetic parser/type checker/evaluator in core. It uses the
existing typed expression leaves and variable definitions. No Python/renderer
arithmetic evaluator or additional transaction owner was added.

Literal `value` remains a bool or string, with integer literals transported as
canonical signed decimal strings. Existing Add/Subtract objects remain valid.
Source self Add/Subtract with a single literal retains the #92 payload shape.
General explicit arithmetic reports `operation:"assign"`; compound source reports
its operation. Signed/grouped literal formulas can normalize to canonical literals
inside the object without rewriting source. Formula signs permit `+2` and `-0`;
the previous operand-only canonical-spelling restriction no longer applies.

Success returns the existing SceneWorkspace inside `{protocolVersion, requestId,
ok:true, result}`. Its revisions and `authoring.variables` remain authoritative.
Each supported assignment reports:

```json
{
  "inferredResultType":"int",
  "reads":["<score UUID>","<bonus UUID>"],
  "readVariables":[
    {"variableId":"<score UUID>","technicalName":"score","variableType":"int"},
    {"variableId":"<bonus UUID>","technicalName":"bonus","variableType":"int"}
  ],
  "writes":["<score UUID>"],
  "diagnostics":[],
  "state":{"status":"known","value":"36028797018963992"}
}
```

Read IDs are deduplicated in expression traversal order. Compound operations read
the target first. Explicit assignment reads the target only when the formula does.
`inferredResultType` is `int` for supported formulas, the declared type for literal
bool/string assignments, or null for a protected formula whose type cannot be
established. `state` is either `{status:"known",value:<bool or string>}` or
`{status:"unknown",reason:<reason>}`. Unknown inspection adds
`diagnostics:[{field:"value.operand",reason:<same reason>}]`.

Reasons are `unobservedCurrentValue`, `unsupportedControlFlow`, `integerOverflow`,
`invalidOperand`, `invalidSyntax`, `missingVariable`, `incompatibleOperand`,
`zeroDivisor` or `limitExceeded`. Protected invalid source retains Custom Code and
reports the diagnostic, nullable inferred type and any resolved target write.
Supported formulas report all variable reads and target writes even when state is
unknown. Defaults and multiplication by zero never invent a current value.
Nested bodies remain conservative without route simulation. A subsequent supported
root literal assignment can establish known state again. Determinable arithmetic
errors remain visible even beside an unobserved operand.

Refusal keeps `{protocolVersion,requestId,ok:false,error:{code,message}}` and writes
neither source nor history. Core messages name `value.operand` for formula errors:

| Condition | Code / inspection reason |
| --- | --- |
| Malformed object/unknown operation | `INVALID_ARITHMETIC_OPERAND` / `invalidOperand` |
| Unsupported or incomplete grammar | `INVALID_ARITHMETIC_SYNTAX` / `invalidSyntax` |
| Missing declared operand | `MISSING_ARITHMETIC_VARIABLE` / `missingVariable` |
| Bool/string operand | `ARITHMETIC_OPERAND_TYPE` / `incompatibleOperand` |
| Determinable zero divisor | `ARITHMETIC_ZERO_DIVISOR` / `zeroDivisor` |
| Out-of-range literal/calculation | `ARITHMETIC_OVERFLOW` / `integerOverflow` |
| Expression bounds | `ARITHMETIC_LIMIT_EXCEEDED` / `limitExceeded` |
| Missing/incompatible target | Existing `MISSING_ARITHMETIC_TARGET` / `ARITHMETIC_TARGET_TYPE` |
| Stale revisions / dirty dependency | Existing `SOURCE_CONFLICT` / `DIRTY_SOURCE` |

Admission rejects errors determinable without current Story state. Calculations
that need current values remain admissible and report known/unknown state during
inspection. Ren'Py itself has arbitrary-precision integers; this i64 bound describes
the editor contract. No silent rounding or JavaScript numeric conversion occurs.

## Fixtures, preservation and reproduction

- Public command owner: `app/src-core/src/scene/tests/arithmetic.rs`.
- Shared preflight/SDK owner:
  `app/src-core/src/renpy/tests/source_foundation/arithmetic.rs`.
- Inputs: `tests/fixtures/arithmetic-93/story.rpy` and `driver.rpy`.
- Complete representative public request/result: `tests/fixtures/arithmetic-93/contract.json`.

The gate creates integer variables with default 99, imports the source through
Source commands, updates the compound multiplier to `bonus + 1`, replaces the
explicit self-subtraction with `score + (bonus + 2) * 4`, and updates the nested
money formula to `money * (bonus + 2)`. It checks accepted bytes, shared Undo/Redo,
reopen, diagnostics and dirty-source refusal before SDK execution. The independent
literal oracle expects score `36028797018963992`, money `-15`, remainder `-2`,
minimum-modulo-minus-one `0` and opaque neighbor `kept`. The deliberate wrong
outcome expects money `-14` and must fail without its acceptance marker.

Public tests also cover exact i64 limits and large values, precedence/grouping,
negative floor/remainder with either divisor sign, variable metadata/read IDs,
missing/incompatible operands, overflow beside unknown state, no default seeding,
protected Python forms, bool/string compatibility, CRLF/comments/opaque neighbors,
minimal edits, semantic no-op/history, legacy maps/IDs, nested ownership and stale
source/authoring plus dirty declaration dependencies. Source-map schema 8 remains
unchanged. #92's earlier source-map migration cases remain selected.

Run from `app/` with pinned Rust/Cargo 1.90.0:

```sh
cargo test -p loomlight-core --locked --offline --lib \
  renpy::tests::source_foundation::arithmetic::formula_fixture_preflight \
  -- --exact --nocapture
```

This preflight starts no SDK. The selected SDK command, and only that command,
receives these environment variables:

```sh
LOOMLIGHT_RUNTIME_SDK_ARCHIVE="$VERIFIED_RENPY_853_ARCHIVE" \
LOOMLIGHT_FOUNDATION_EVIDENCE_DIR="$FRESH_IGNORED_EVIDENCE_DIRECTORY" \
cargo test -p loomlight-core --locked --offline --lib \
  renpy::tests::source_foundation::arithmetic::formula_sdk_gate \
  -- --ignored --exact --nocapture
```

The shared gate retains the #92 selector/inputs separately. Never run a broad
ignored selector. Require the positive Cargo summary through the existing
`app/scripts/check-q1-prep-gates.py cargo-log`, all four unique case records,
compile/lint/normal-entry success, exact value witness, deliberate wrong-outcome
rejection, no timeout/truncation, unchanged `.rpy` set and the terminal
`passed:true,cleanupComplete:true`. Windows needs the same selector/inputs and its
short contained TEMP/TMP policy. New formula Windows proof is not established.

## Mac qualification reservation

This implementer has exactly one reserved Mac ARM64 invocation from the existing
six-start feature cap. At dispatch the totals were Mac 1 started / 1 reserved for
#93 and Windows 1 started / 0 reserved. Before launch this ticket has consumed
zero starts. A started invocation consumes the reservation even on failure or
cancellation. No second invocation is authorized here.

The existing official Ren'Py 8.5.3 archive was rehashed against the project pin and
retained published manifest before launch. Archive SHA-256:
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`.
Both local and repository manifest SHA-256:
`4b0cad9ac05dc4ca55081bd3a36458c8ea658ed021f09a87276383652b6bd98b`.
[Manifest provenance](../../../spikes/renpy-sdk/published/README.md) records official
acquisition; no separate PGP verification is claimed. The installer verifies the
archive again. No download or SDK substitution is needed.

The implementation commit containing this reservation is the code candidate.
Before starting, the ignored launch receipt must record its full SHA, exact command,
fixture/preflight source hashes, verified archive and executable identities, host,
target and fresh evidence directory. Raw evidence stays under ignored
`.toolchains/arithmetic-93/`. No Windows work, native editor/package run, manual CI,
release, push, PR or issue closure is selected.

## Cheap verification before qualification

Selected Rust checks pass 75 distinct cases: Story 45 (including 13 arithmetic
cases), Source 16, typed conditions 3, condition/source compatibility 3, explicit
bodies 5, literal transport 1, #92 preflight 1 and #93 preflight 1. The seven
existing ignored Story specialist cases remain outside selection. The two
selected renderer owners pass 36 tests with no skips. Production TypeScript,
Rust formatting, repository validation and whitespace checks pass. Existing Cargo
log validation accepts the positive summaries. No SDK environment variables were
set on routine checks.

TDD recorded failing public behaviors before implementing formula admission,
negative floor/remainder, detailed diagnostics, semantic no-op comparison,
literal-to-formula preservation and explicit-operand grouping. Expected results
are independent literals and the SDK driver, not another parser. One compatibility
fixture initially created bool/string declarations after migrating its map, so its
map no longer described the intended starting recognition. Creating declarations
before initial migration fixed that test setup; production admission was preserved.
The existing nested/map/history behavior also passed with the new formula samples.

Review checked one arithmetic owner, exact i64 transport, conservative state,
reference/read metadata, declaration/source admission, both source forms' token
ranges, typed renderer consumption and removal of literal-only expectations that
#93 replaces. No implementation dependency was delegated.

## Mac invocation 1 result

**Started and passed.** The exact code candidate is
`ca51e4c7e02c5dc54ef8c47b9c245907a1456c6b`. The selected command above ran from
`app/` on native macOS ARM64 with Rust/Cargo 1.90.0. Prelaunch receipts recorded
that clean commit, every core/transport/fixture input hash, the independently
verified archive, the test executable and fresh ignored
`.toolchains/arithmetic-93/mac-01/`. The retained binary is Mach-O arm64.

Consumption is **1/1 implementer Mac invocation, 0 reserved/uncertain**. The
feature total is now Mac **2 started / 0 reserved here**; Windows remains
**1 started by prior work / 0 started here**. No second Mac invocation ran.

The gate passed one test in 74.08 seconds:

| Case | Exit | Duration | Result |
| --- | ---: | ---: | --- |
| Compile | 0 | 441 ms | Passed |
| Lint | 0 | 245 ms | Passed |
| Normal entry | 0 | 1229 ms | Passed with exact values |
| Wrong outcome | 1 | 2101 ms | Expected assertion rejected |

All four case records were present exactly once, with no timeout or truncated
output. Normal entry reported `PASSED` and
`ARITHMETIC_93_VALUES score=36028797018963992 money=-15 remainder=-2 minimum=0 opaque=kept`.
The wrong run reported `FAILED` at `AssertionError: assert eval (money == -14)`
and never printed `ARITHMETIC_93_WRONG_ACCEPTED`. The shared gate now requires
that exact wrong assertion, as well as its failed status, for each fixture.

The existing Cargo-log checker accepted the positive one-test summary. The
terminal record had `passed:true,cleanupComplete:true`. The gate checked unchanged
accepted `.rpy` sources after every case. A separate receipt audit verified the
owned SDK/project/profile/saves temporary root was absent and all captured source
and executable hashes remained unchanged. No editor application/package was built
or launched.

Accepted runtime source SHA-256:
`9a00554463d78fd57f5537e61471d50ef2a4a165ebf451dc3cb3ae5f4ed9aeae`.
Retained/executed ARM64 test binary SHA-256:
`b568895463682017996f360354d9a58224edf75f77b7a9c952f4176ac52748f5`.
Generated project/Scene IDs can change accepted-source hashes between fixtures;
the committed source inputs and independent expected values remain fixed.

Preserve the ignored worktree evidence:

- `mac-01/launch-receipt.json`, `launch-started.json`, `launch-result.json` and
  `audit.json` record identities, accounting, result checks and cleanup.
- `mac-01/sdk.log`, `arithmetic-sdk-cases.json`, `arithmetic-requests.json`,
  `arithmetic-produced.rpy` and `test-executable` retain raw outputs, actual public
  commands/results, accepted bytes and the executed binary.
- The parent evidence directory retains cheap logs, TDD reds, build JSON/stderr,
  selector inventory and `preflight/` command-produced source/results.

There are **76 distinct passing Rust cases including the SDK gate**, plus
**36 passing renderer cases**. Seven pre-existing ignored Story specialist cases
remain unrun. Formatting, TypeScript, repository validation and whitespace checks
pass. No selected required check remains failed, cancelled or skipped.

## Integration handoff and remaining limits

After qualification, fetched current `origin/codex/spec-87-arithmetic` and ran a
normal `git merge --no-edit codex/spec-87-arithmetic`. Both integration refs still
pointed to `7e1c3133ebd6fe1fbd7bb9aa27b587562df4442c`, already an ancestor, so Git
reported `Already up to date.` No reset, discarded work or history rewrite occurred.
Subsequent edits are this result note only; core and runtime fixtures remain the
qualified candidate's bytes. The complete representative contract JSON comes from
the passing no-SDK preflight, with only outer request/session identifiers replaced
by examples; its request/result shapes and generated revisions are retained.

Changed files relative to integration:

```text
app/src-core/src/conditions/arithmetic.rs
app/src-core/src/lib.rs
app/src-core/src/renpy/tests/source_foundation/arithmetic.rs
app/src-core/src/scene.rs
app/src-core/src/scene/tests/arithmetic.rs
app/src-core/src/scene/variables.rs
app/src/scene-ui.ts
docs/DATA_MODEL.md
docs/tasks/evidence/arithmetic-93.md
tests/fixtures/arithmetic-93/contract.json
tests/fixtures/arithmetic-93/driver.rpy
tests/fixtures/arithmetic-93/story.rpy
```

New formula Windows SDK proof is **not established**. #92's old Windows fixture
does not qualify these formulas. The coordinator owns Windows selection/routing,
remaining feature accounting, fresh integration review/merge, publication and issue
acceptance. No Windows thread was contacted. No push, PR, issue closure, integration
branch mutation or branch/worktree cleanup occurred. Preserve this worktree's raw
Mac evidence for coordinator audit and reuse the exact #93 selector/inputs above
for any later allocated Windows run.
