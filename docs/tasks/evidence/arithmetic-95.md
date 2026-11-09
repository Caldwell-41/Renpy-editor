# Click-time Screens arithmetic, #95

Scope is [#95](https://github.com/Caldwell-41/Renpy-editor/issues/95), under
[spec #87](https://github.com/Caldwell-41/Renpy-editor/issues/87). The T3-prepared
worktree is `t3-6e0d6daf`, branch `t3/screens-click-time-arithmetic`. Before edits,
HEAD and the integration base were exactly
`5ecfd6f742e07bffce1bbab806c4ebf56c116f6a`, with a clean worktree. The branch already
had its assigned unused name. No checkout, subagent, issue mutation, PR or push was
created. The ignored launch receipt records the actual absolute worktree location;
absolute machine paths stay out of Git.

## Contract for #97

The [#94 public contract](arithmetic-94.md#public-contract-for-95-and-96) remains the
shared numeric owner. Integers are signed i64 strings; decimals are finite JSON
numbers. Successful protocol responses use `value`. No declaration default becomes
an observed current operand.

`screens.compose` retains its revision-bound `actions` command. Each numeric action
uses `{type:"setVariable",variableId,value:{operation,operand}}`. All seven operations
and the grammar/limits from #94 apply. Literal bool/string/int/decimal assignments
remain supported, including imported literal SetVariable actions and semantic no-ops.
`expectedRevision`, `expectedAuthoringRevision` and `expectedTargetRevisions` remain
mandatory under their existing rules. Dirty or changed variable-definition files
refuse, including variables read only by the formula.

Optional `validateOnly:true` uses that same command/preparation. It accepts only
`actions`. The success response keeps `document` at the current accepted revision,
`changed:false`, `documents:[]`, and returns `actionValidation` as the proposed
inspection. The candidate revision inside that proposed document is not a write
precondition. A later commit uses the original current source/authoring/target
revisions and revalidates. Commits omit `actionValidation`. Invalid formulas use
existing field-specific transport codes/messages, including
`ARITHMETIC_TARGET_TYPE`, `INVALID_ARITHMETIC_OPERAND`,
`INVALID_ARITHMETIC_SYNTAX`, `MISSING_ARITHMETIC_VARIABLE`,
`ARITHMETIC_OPERAND_TYPE`, `ARITHMETIC_ZERO_DIVISOR`, `ARITHMETIC_OVERFLOW` and
`ARITHMETIC_LIMIT_EXCEEDED`. Stale/dirty refusals keep their existing codes.

Both accepted and proposed documents expose:

- `actionVariables`: existing full Variable records, including stable ID, readable
  technical name, fixed declared type, default and definition path/revision.
- `actionCapabilities`: shared operators, operations, limits, exact integer/decimal
  transports and `functions:false`.
- Button `actions`: original operation/operand data in displayed order.
  `actionAssignments` aligns with that list; formula entries carry the shared
  `inferredResultType`, `reads`, `readVariables`, `writes`, `diagnostics`, and
  known constant or unknown state. Other entries are null. Variable-dependent
  assignments report `unobservedCurrentValue` regardless of defaults.
- `actionProtectionReason`: a reason for source-protected actions, including the
  captured timing of expression-valued SetVariable and the unchanged-helper rule.
- Existing source revision and document authoring revision. Resolved target effects
  add `readVariables`, retain possible `assignedVariables`, and include operand
  definition revisions along with action/source/map/inventory dependencies.

The fixture preflight and SDK gate retain exact full protocol requests/responses
in `public-requests.json`, including validation and commit for both button kinds.
The committed `tests/fixtures/arithmetic-95/` owns normal Story and SDK driver input.
The ignored preflight and SDK directories retain complete inspections, accepted
source/assets and sample plans. Typed renderer compatibility lives only in
`screen-contracts.ts` and `screen-interactions.ts`; existing drafts retain formula
operation/operand through their current owner. New controls/layout remain #97.

## Source and runtime owner

`app/src-core/src/screens/actions.rs` extends existing action admission, parsing and
exact-range patches. It calls #94's existing `scene::integer_adjustment` admission
and shared typed arithmetic tree, not another evaluator. It generates a deferred
`Function` action and checked Python operators from that tree. The fixed
`arithmetic-runtime.rpy` template supplies type/range/finite checks and assignment;
no runtime or inspection parser evaluates project text. Each screen has one helper
name derived from its stable UUID. The helper is appended to that screen source in
the same transaction/history entry as the first arithmetic edit. Removing all
arithmetic leaves that inert declaration available for subsequent edits. Inspection
requires the exact generated call and unchanged helper template.

Pinned Ren'Py 8.5.3 primary source was inspected before choosing the adapter:
`renpy/common/00action_other.rpy` Function stores its callable/arguments at creation
and calls it in `__call__`, then restarts interaction and returns the callable's
result. The generated lambda defers every variable read; the helper returns None.
`renpy/display/behavior.py` runs action lists in order and keeps prediction and
selection separate. `renpy/test/testparser.py`, `testast.py` and `testkey.py` own the
selected click, screen/id and keysym selectors. Nonfocusable captions use the actual
screen's `_tts_all(False)` path, following H69. Their file hashes are in the local
launch receipt. No SDK was started to inspect those sources.

Imported expression-valued SetVariable remains protected because its arguments
were captured during screen evaluation. Opening and no-op edits preserve original
bytes/timing. Existing eight-action/context/Finish-last rules and shared transactions
remain the only action path. The canvas consumes only validated data and samples;
it recognizes the exact owned helper declaration without executing it.

## Red/green and focused verification

The user-approved seams are public authoring commands, committed source, shared
history, reopen, accepted-source SDK, and actual frontend-to-core journeys.

1. Public arithmetic composition failed with `INVALID_PAYLOAD`, then passed after
   extending the existing action owner. It verifies operation/operand inspection,
   unknown operands, reads, comment preservation, no-op bytes, one Undo/Redo and reopen.
2. Public effect inspection initially omitted formula reads, then passed after
   adding read IDs and operand dependencies. The same case rejects invalid formulas
   and preserves imported captured-timing source with an explicit protection reason.
3. Public composition draft validation initially refused its new request flag,
   then passed through the shared preparation without committing. Apply/Undo proves
   validation added no history entry. An initial fixture picked the pre-existing bool
   definition instead of trust; selecting by technical name corrected that test.

Retained logs are under ignored `.toolchains/arithmetic-95/`. SDK-free fixture
preflight initially used a stale authoring revision after asset import; refreshing
that public revision corrected the harness. It then caught a real canvas admission
gap for the generated helper. Exact owned-declaration recognition fixes that gap
without executing it. The real production controller journey initially omitted an
untouched action list, then reused an expired Recent ID. It now deliberately touches
the arithmetic draft and fetches the fresh Recent ID. The dedicated red logs and both failed controller results remain. Some early no-SDK
compile/preflight log filenames were reused; their observed failure excerpts remain
in the task transcript and the classifications above, rather than complete original
raw files. Prior #94 raw evidence is unchanged.
No SDK was started during these checks.

Focused public Rust, renderer, controller, typecheck and repository results and the
qualified candidate are recorded below after their final runs. Prior #94 shared
arithmetic qualification is reused on unchanged parser/type/evaluator inputs. Existing
literal action/context/control/reference tests remain selected; no package matrix,
browser, native editor or manual CI operation is allocated.

## SDK allocation and result

Exactly one Mac ARM64 SDK start is reserved for this assignment. Before it, feature
usage is Mac 5/20 started plus this reservation, Windows 2/20 started with none
reserved. A failed or cancelled start counts. No retry is authorized here. Windows
qualification remains coordinator-owned. The SDK selector is
`screens::tests::actions::runtime::click_time_arithmetic_sdk_gate`, with `--ignored
--exact --nocapture`. The no-SDK selector is the same module's
`click_time_arithmetic_fixture_preflight`.

The fresh ignored directory is `.toolchains/arithmetic-95/mac-01/`. A clean
integration-inclusive candidate, official archive checksum, complete tracked-input,
fixture/config/source and retained executable hashes, exact command/environment and
pinned compiler identities are required before launch. Execution must occur outside
the sandbox through the existing `macos_native_desktop.py` admission/power helper.
Existing sessions/processes and all prior arithmetic evidence remain untouched.

The attempt below failed before the selected runtime cases. Required proof remains
normal accepted-source ordered current
values (6/12, then 7/14), variable-dependent amounts and a changed operand, actual
text/image clicks and keyboard activation, integer/decimal witnesses, prediction/
evaluation/selection inertness, explicit invalid arithmetic, one Finish continuation,
deliberate wrong-outcome rejection, unchanged accepted source, complete records and
owned-resource cleanup. Compile/lint alone cannot qualify it.

## Prepared checks and file ownership

Before SDK launch, 53 distinct selected Rust cases pass: actions 16, controls 18,
effects 4 and references 15. The repeated no-SDK fixture is one of those 16, not an
extra case. The SDK test stays intentionally ignored during ordinary selection.
The existing positive Cargo-log checker accepts these logs. Twelve renderer DOM
cases and the actual production ScreensWorkspace-to-core journey pass. Pinned
Node 24.19.0/npm 11.9.0 typecheck/test compilation, Rust 1.90.0 formatting, static
nonexecuting Python/selector preflight, repository validation and whitespace pass.
The final helper-ownership refinement also passes its exact no-SDK fixture.

Implementation files are:

```text
app/src-core/src/renpy.rs
app/src-core/src/scene.rs
app/src-core/src/scene/variables.rs
app/src-core/src/screens.rs
app/src-core/src/screens/actions.rs
app/src-core/src/screens/arithmetic-runtime.rpy
app/src-core/src/screens/canvas.rs
app/src-core/src/screens/composition.rs
app/src-core/src/screens/ownership.rs
app/src-core/src/screens/references.rs
app/src-core/src/screens/action_tests.rs
app/src-core/src/screens/action_runtime_tests.rs
app/src/screen-contracts.ts
app/src/screen-interactions.ts
app/tests/screen-interactions-core.dispatch.mjs
docs/DATA_MODEL.md
docs/tasks/evidence/arithmetic-95.md
tests/fixtures/arithmetic-95/story.rpy
tests/fixtures/arithmetic-95/driver.rpy
```

The shared Rust adapter changes expose existing bounded SDK helpers within the
crate and existing arithmetic admission/draft inspection across core owners.
They add no SDK implementation, evaluator or transaction path. Protocol registries,
Help driver, Story production modules, status/ledger, prior fixture/approval/evidence
files and parent PR remain unchanged by this branch.

A representative validation request has this exact shape; angle-bracket values
stand for the IDs/revisions returned by the current public inspection:

```json
{
  "protocolVersion": 1,
  "requestId": "arithmetic-95",
  "operation": "screens.compose",
  "payload": {
    "sessionId": "<session ID>",
    "screenId": "<owned screen UUID>",
    "expectedRevision": "<current screen source SHA256>",
    "validateOnly": true,
    "command": {
      "type": "actions",
      "nodeId": "<button UUID>",
      "expectedAuthoringRevision": "<current document authoring revision>",
      "expectedTargetRevisions": [],
      "actions": [
        {"type":"setVariable","variableId":"<trust UUID>","value":{"operation":"add","operand":"1"}},
        {"type":"setVariable","variableId":"<reward UUID>","value":{"operation":"assign","operand":"2 * trust"}}
      ]
    }
  }
}
```

The response is `{protocolVersion:1,requestId:"arithmetic-95",ok:true,value:...}`.
`value` contains `document`, `selectedId`, `changed:false`, `styles`, `documents:[]`
and `actionValidation`. Inside its proposed button inspection, the first formula
has integer type, reads/writes trust, and unknown `unobservedCurrentValue`; the
second reads trust and writes reward with the same unknown reason. Setting
`validateOnly:false` commits through the ordinary owner. The full concrete request
and complete success response, including all variable IDs/revisions, capabilities,
source spans and diagnostics, are retained in `preflight-final/public-requests.json`. The failed `mac-01`
attempt did not reach its export; the failure section below records that gap. A target mismatch, for example, returns
`{protocolVersion:1,requestId:"arithmetic-95",ok:false,error:{code:"ARITHMETIC_TARGET_TYPE",message:"variableId: Choose a numeric target. Whole-number targets require an integer result."}}`.

## Mac invocation 1 failed before arithmetic cases

The clean candidate was `dc8eb3c4589559dc229cbcd28a0dc7fd3143c42a`. It normally
merges integration second parent `53cb37fab9c07f42b28afed4dbca68f1f1b54a80`,
which includes the requested published `e0a9fe3b` contract fix. The immutable launch
receipt identifies `e0a9fe3b` as the required ancestor; the audit records the actual
later merge parent. The integration branch still points at that merged second
parent when this result is recorded.

The outside-sandbox desktop admission passed. The retained gate executable started
at 2026-11-09 12:54:26 UTC and exited 101 after 78.364 seconds. SDK execution really
started: `LifecycleService::create_project` completed the SDK-backed
`generate_starter_anchored` generation, GUI-image and generated-project validation
path and printed generated/validated/promoted checkpoints. This is a consumed start,
not a preflight refusal. Feature usage is now **Mac 6/20 started, 0 reserved;
Windows 2/20 started, 0 reserved**. There was no retry or Windows operation.

The assertion failed at `author_arithmetic`'s `plan.available == true`. The real
SDK project correctly reported these existing inert-canvas limits:

```text
Unresolved project initialization or inherited styles in game/gui.rpy
Unresolved project initialization or inherited styles in game/options.rpy
Unresolved project initialization or inherited styles in game/screens.rpy
```

This is a harness defect. The shared authoring fixture required complete canvas
availability for both its minimal offline project and the full generated SDK
project. The cheap fixture does not contain that SDK GUI initialization, so it
passed without exposing the mismatch. The failed plan still contained the inert
sample literal `99` and all button nodes. No production arithmetic runtime defect
was observed, and no product guard was weakened to satisfy the harness.

The selected compile, lint, normal arithmetic and wrong-outcome cases were not
reached. They remain missing, including the required normal 6/12 and 7/14 witnesses.
The positive Cargo-log validator correctly rejects this failed one-test summary.
**No #95 code candidate is runtime-qualified on Mac or Windows. #97's qualified
backend dependency is not satisfied by this return.**

Raw `sdk.log`, launch/started/result receipts, desktop receipt, official checksum
manifest and the exact executable remain under `mac-01`. Executable SHA256 is
`e938c29cf590604afdcddc2d8db0e56c97607ae3bebe2c9a92b4998517ac0614`.
`qualification-audit.json` records actual consumption, all four unrun cases, the
rejecting checker and 864 unchanged launch-input hashes. The Rust terminal reports
`cleanupComplete:true`; both owned Mac power assertions were released and the
post-child desktop remained awake/unlocked. Existing processes/sessions and prior
receipts were untouched.

The assertion happened before the SDK attempt exported its accepted source/public
requests or initialized per-case records. Those exact SDK-attempt captures are
missing after owned temporary cleanup. They are not reconstructed from another run.
The complete earlier no-SDK `preflight-final/` accepted source/assets, full concrete
requests/responses and inspections remain retained, but do not substitute for SDK
runtime evidence. Thus the planned `mac-01/public-requests.json` mentioned in the
contract section was not produced by this failed attempt.

The assignment stops SDK work here as instructed. A coordinator-selected follow-up
can separate minimal-project canvas availability from full-template SDK execution,
retain source/requests and unrun-case records before assertions, then choose any
further qualification explicitly. This branch makes no post-failure implementation
or harness correction and starts no retry. The returned local successor changes
only this evidence note; all app/fixture inputs still equal `dc8eb3c4`. No push,
PR, issue closure, cleanup, parent-PR work or final acceptance was performed.


## Coordinator fixture correction, no SDK retry yet

The coordinator took mutation ownership of this completed worktree after the
implementation return. The original `mac-01` failure remains failed and immutable.
Its retained executable still has SHA-256
`e938c29cf590604afdcddc2d8db0e56c97607ae3bebe2c9a92b4998517ac0614`.
No production arithmetic, canvas admission or runtime adapter changed.

A cheap public regression reproduces the exact assertion without the SDK. It adds
valid newline-separated `init python: gui.init(1280, 720)` in the disposable
project's GUI file, then authors both buttons through the same public fixture.
`click_time_arithmetic_fixture_retains_samples_with_unresolved_gui` failed at the
original shared availability assertion in 6.29 seconds. Its retained
`gui-valid-init-red.log` shows only the expected GUI-initialization limit, while
sample text 99 and every button node are still present. This rules out a missing
generated-helper or action/source admission failure for this preparation symptom.

The correction moves the full availability assertion into the existing minimal
project preflight, where it remains required. The shared setup instead verifies
sample text 99, both button kinds, unchanged accepted source and reopened actions.
The new GUI regression requires the accurate GUI limit and retained inert text.
The full SDK gate permits only its three known standard-template initialization
limits, refusing an unexpected extra limit. Its arithmetic/type/click/keyboard/
inertness/continuation and deliberate wrong-outcome assertions are unchanged.

Public requests, inspection, sample plan and accepted files now export before the
shared fixture's sample/source/reopen assertions. Four explicit not-run SDK case
records now initialize before SDK installation or project generation. A later
preparation failure therefore retains its actual available evidence and unrun
cases; it cannot imply those cases passed.

The GUI regression passes in 6.37 seconds and the original minimal-project
preflight passes in 6.29 seconds, with no failures/skips. Existing Cargo-log
validation accepts both. Their fresh ignored `gui-preflight-green/` and
`minimal-preflight-green/` contain actual accepted source/public requests; their
plans retain sample 99 and respectively one expected GUI limit or no limit.
Rust formatting, repository validation and whitespace checks pass. Existing
implementation proof retains its original scoped candidate; only the test owner
and this note changed during recovery. All earlier raw logs remain available.

SDK use remains **Mac 6/20 started, Windows 2/20 started**, with no new launch or
retry during this correction. Runtime proof for #95 and entry to #97 remain
missing. The #96 merger still owns integration publication; after that handoff,
the coordinator can merge the latest integration into this corrected branch,
record a clean candidate and allocate a fresh bounded SDK attempt explicitly.
