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

Optional `validateOnly:true` uses that same command/preparation. At #95 qualification
it accepted only `actions`. The [#97 extension](arithmetic-97.md#new-imagebutton-validation-extension)
also validates complete `addImageButton` drafts through the same preparation and
pre-commit return. New proposed node IDs are temporary feedback identities. This
extension does not change the actions-only scope of the original #95 evidence. The success response keeps `document` at the current accepted
revision,
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


## Mac invocation 2 and image-selector correction

The reserved correction ran at clean integration-inclusive candidate
`8879088a56596780d66e94fcc19774db781e3b84`, with 869 input hashes and retained
executable SHA-256 `99bef3f59d9048b47991b2a291f42fd59592a3c5390468e4089a64c689f73dfb`.
It started at 2026-11-09 13:18:32 UTC and failed after 77.553 seconds. Compile
passed in 478 ms and lint in 263 ms. Normal entry passed five assertions, then
failed looking up `arithmetic_image`; no arithmetic click witness or wrong-outcome
proof was reached. The normal record is failed and the fourth case remains notRun.
SDK/project cleanup and desktop/power cleanup passed. Feature use is Mac 7/20 and
Windows 2/20. No further start occurred during diagnosis.

Unlike invocation 1, fresh `mac-02/` retains actual requests, inspection, sampled
plan, accepted source/assets, SDK context, all four case statuses and raw outputs.
The coordinator verified all 869 receipt inputs against the frozen Git candidate,
the retained binary, three unchanged-source case records, no timeout/truncation
and absent temporary root. `coordinator-audit.json` records the failed result.
The original failure and its receipts remain immutable.

This is a second, distinct harness defect. The fixture attempted to add an SDK ID
by replacing `imagebutton:` followed immediately by a newline. Public composition
actually writes an element identity comment on that line, so replacement changed
nothing. Both earlier no-SDK accepted source and this SDK attempt lack the ID.
The action editor did not remove it; the fixture never inserted it.

The existing public no-SDK preflight now asserts that its final accepted screen
retains the SDK ID. It failed in 6.10 seconds before the fix. The fixture insertion
now matches the exact known imagebutton/UUID marker, requires exactly one match,
and preserves that identity comment. The same preflight passes in 6.51 seconds;
`image-selector-green/` retains the real source and requests. Production is
unchanged. No arithmetic, inertness, keyboard, type or rejecting assertion was
removed or relaxed. A fresh clean candidate/receipt and explicit allocation remain
required before another SDK start. #95 runtime proof and #97 entry remain pending.


## Mac invocation 3 and pinned selector-name correction

Verification at clean candidate `30072c2c98a48d27786bb53bfd893a80dc0416b3`
started 2026-11-09 13:27:37 UTC. Its retained executable SHA-256 is
`0e36ff88518ab784eb1b19d5ba9a210017cb52be0ead155b79b3d31fb879d804`.
Compile passed in 469 ms and lint in 238 ms. Normal entry verified FIRST 6/12,
SECOND 7/14, a changed operand and keyboard textbutton activation, with 11 passing
assertions. It then timed out at the imagebutton click; the image click, remaining
witnesses, Finish and wrong-outcome case remain unproved. Terminal cleanup passed.
The failed raw records remain immutable in `mac-03/`. Feature consumption is
Mac 8/20 and Windows 2/20, with no further start during diagnosis.

The imagebutton exists: the earlier normal `renpy.get_displayable` action checks
passed. Primary SDK source distinguishes its ID selector implementation from that
normal API. `DisplayableSelector.get_displayable` directly compares evaluated
`screen` to the scene-list entry name, which `show_screen` stores as a tuple.
Unlike normal `get_screen`, that selector does not normalize a string. A synthetic
metadata diagnostic executing only this pinned method reproduces a missing widget
for the string and finds the same widget for the tuple. This is diagnostic proof,
not SDK execution or product-runtime acceptance. Its result is retained in
`selector-comparison-diagnostic.json`.

The SDK driver's two imagebutton selectors now use the tuple screen name for
physical click and keyboard input. Public API lookups remain unchanged. The
fixture keeps every arithmetic, type, prediction/selection inertness, invalid
calculation, Finish and rejecting assertion. The five-second timeout is unchanged.
The remaining driver API calls were checked against pinned primary source;
`driver-static-preflight-current.json` retains the corrected selector diagnostic
and driver identity. No production code or SDK implementation is changed.
A clean candidate, rebuilt executable and fresh coordinator allocation are still
required for another actual verification run. #97 remains blocked.


## Mac invocation 4 passed

The allocated verification **started and passed** at clean candidate
`ecf2e2f7d9df8130e9102579c9ac9db6baec56b2`, including published integration
`323a0685`. Launch was 2026-11-09 13:35:52 UTC. Gate duration was 80.190 seconds;
the positive named Cargo summary reports one passed case in 79.44 seconds, with
zero failures/skips. The existing Cargo-log validator accepts that summary.
The pinned archive/manifest, exact command and retained executable identities
are bound in fresh ignored `mac-04/launch-receipt.json`.

| Case | Exit | Duration | Result |
| --- | ---: | ---: | --- |
| Compile | 0 | 457 ms | Passed |
| Lint | 0 | 263 ms | Passed |
| Normal | 0 | 1593 ms | All 22 assertions passed |
| Wrong outcome | 1 | 2064 ms | Expected reward-equals-10 assertion rejected |

All four unique records completed, with no timeout or output truncation and
unchanged accepted `.rpy` sets. Normal entry emitted all four exact witness lines:
FIRST 6/12, SECOND 7/14, CURRENT trust 10/reward 20/points 19/fraction 0.25 with
floor -3/remainder 2/exact large integer and float widening, and VALUES with inert
prediction/evaluation/selection, mouse/keyboard activation on both button kinds
and one Finish continuation. The invalid-calculation assertion passed without
silently accepting overflow. Wrong outcome reported FAILED at reward 10 and
emitted no ARITHMETIC_95_WRONG_ACCEPTED marker. Duplicate inner selector listings
add no passes; no distinct required assertion is missing.

SDK/project cleanup passed. The existing desktop helper admitted an active,
awake, unlocked session throughout and released both owned power assertions.
The coordinator independently verified all 869 input hashes against the clean
candidate and working files, retained binary, four actual public validation/commit
request-response pairs, exact witnesses, accepted source and absent temporary root.
`mac-04/coordinator-audit.json` retains that independent audit. No process remains.

Retained executable SHA-256:
`1b774c1e2b8bba471c488e056aa26dead6456a38eb67a61cc75a62578c6b8ca1`.
Actual accepted screen source SHA-256:
`cdaaa4644fe11c5d3ec4b8a1349a9d17cccbc25c13f18663f18c657833132f69`.
Preserve all four attempt directories, prior failed statuses and diagnostics.
The successful run changes none of those earlier outcomes.

Public/core behavior is unchanged from the implementation; only fixture assumptions
were corrected during recovery. Reuse the original scoped 53 Rust and 12 renderer
passes plus actual Screens controller/core journey. The new GUI regression adds
one distinct Rust case and this successful SDK gate adds one, for 55 distinct
passing Rust cases including SDK. Repeated fixture runs add no extra cases.
Combined production typechecking after the Story merge also passed.

Feature consumption is **Mac 9/20 started, Windows 2/20 started, no reservations**.
#95 now has successful Mac runtime proof. Fresh integration verification and
Windows qualification remain coordinator-owned before #97 starts. No Windows,
editor-native/package or manual-CI operation ran during recovery. This return
remains local-only pending the fresh merger; no issue closure or final acceptance
is claimed.

## Integration equivalence and Windows-ready candidate

Conflict-free normal `--no-ff` merge
`0382ae3c999e9e197af1fd289a3b45ffc4d1bec5` has ordered parents coordinator
`ecc55df80f9ced0adc8b7028acd5e6dc50fa5edf` and returned implementation
`899f0e5798afa8637bf4a23284cc22185b27a1fc`. Both histories survive. The
coordinator's CURRENT, HANDOVER and delivery ledger survived unchanged before
this update. Approved Lab/design references, captures, #92/#93/#94 fixtures and
the #96 evidence note also survived unchanged. The returned successor adds only
the Mac success note to qualified `ecf2e2f7d9df8130e9102579c9ac9db6baec56b2`.

The complete merged inputs equal that qualified candidate:

| Input | Git tree |
| --- | --- |
| `app/` | `4c93cea67513b039cabd0f3fa09d064dc6b62c6c` |
| `tests/fixtures/` | `58bde4d6170ff1d600cc9d662e00951303212816` |
| `scripts/` | `56200065602421cdfad377180ef45a251f02b89f` |
| `.github/` | `a79289dcdb51e68e0924f4883f799887706556f7` |

The merger independently verified all 869 launch-receipt hashes against Git's
filtered checkout bytes at both candidates and the integration/source working
files. The retained executable still matches the binary hash above and remains
executable. The four unique actual case records retain their expected exits,
durations, all normal witnesses/22 assertions and deliberate reward-10 rejection
without the wrong-acceptance marker. Accepted source matches its recorded hashes;
the injected SDK driver matches the committed fixture. SDK/project and desktop
cleanup passed, and the owned temporary root is absent. All three prior failed
launches remain failed. The original four attempt directories, no-SDK red/green
and selector diagnostic remain untouched in the preserved source worktree.

The recorded contract audit checks all four concrete public request/response pairs,
both button kinds, validateOnly's unchanged accepted revision/no documents,
commit's original preconditions, ordered actions/assignment inspections and shared
numeric capabilities. The existing `ci_validation.load_plan` accepts the current
head/base and quality-only selection. Fresh production typechecking passes with
Node 24.19.0/npm 11.9.0. Repository validation passes for 1,866 tracked files;
whitespace passes against the Screens base. Raw merger receipts are ignored under
`.toolchains/arithmetic-95/integration-merge/{equivalence,contract-check,checks}.json`.
The audit's initial export-path assumption was corrected locally: the SDK driver
is injected after the accepted-source export, so its recorded hash is checked
against the identical committed driver. No product or fixture input changed.

Reuse the original 53 scoped Rust cases and 12 renderer cases, actual Screens
controller/core journey, added GUI regression and passing SDK gate. That is 55
distinct Rust passes including SDK, with no added count for repeated preflights.
The complete combined app already includes Story integration and the shadow-token
correction. Its nine protocol tests passed locally; #96's earlier comparison
retains its original candidate and partial visual limits. No new input or unresolved
consumer issue justifies repeating unchanged full suites or the SDK/browser campaign.

This merge is the Windows-ready integration candidate. Later checkpoint changes
are documentation only. The coordinator can route bounded Windows qualification
against the published head after confirming these app/runtime identities. Windows
must supply its own compile/lint, normal and rejecting runtime records, actual
input/binary/source hashes and cleanup; Mac proof does not qualify Windows.
#95 remains open with Mac qualified and Windows pending, and #97 remains blocked.
#96 stays a functional increment with separate full layout/palette, Tracks/Reel,
branch/view drafts and native/physical-input/human acceptance.

The draft PR keeps its Screens base and eventual full-spec closing references.
Final-head automatic checks require an exact-head coordinator audit; earlier green
checks are not inherited. This merger starts zero SDK/browser/editor-native/package/
manual-CI operations and registers no watch. SDK totals remain Mac 9/20 and Windows
2/20, with zero reservations. After ordinary push and remote-head/upstream/clean-state
verification, exclusive integration/PR mutation ownership returns to the coordinator.
No successor implementation, final review, issue closure, ready-for-review promotion,
PR merge, automerge, release or worktree cleanup is selected.


## Windows invocation 1 passed, 2026-11-10 AEST

The single allocated Windows x64 qualification **started and passed** on SUNDOWN.
Tested SHA: `a2c7ab9734cfe35433a3276d39f12c4ebdf955e7`. The clean existing
`codex/spec-87-windows-92` worktree fast-forwarded from ancestor `918fa3cc`
with `merge --ff-only` after fetch, root, ownership and process checks.
The registered Screens checkout remains clean on its original branch at
`251fb47754a0ec1a43ece8763a0b4603b8e54dd8`. No checkout or branch was created.

All 883 tracked source/config/lock/fixture/tooling inputs matched Git's filtered
checkout representation before execution and retained their hashes afterward.
The app and fixture trees are the Windows-ready identities above; app, fixtures,
scripts and CI inputs equal both Mac-qualified `ecf2e2f7` and merge `0382ae3c`.
No source, configuration, fixture, assertion or timeout changed.

Host: Windows 11 build 26200, native `x86_64-pc-windows-msvc`. Existing Rust
1.90.0 (`1159e78c4`), Cargo 1.90.0 (`840b83a10`), MSVC toolset 14.50.35717 /
compiler 19.50.35726 and Python 3.12.14 were loaded through the process-local
host development helper. No installation or download ran. The executed SDK reports
Ren'Py 8.5.3.26051504 and Windows Python 3.12.7.

Exact commands from `app/`, in order:

```sh
cargo test -p loomlight-core --locked --offline --lib screens::tests::actions::runtime::click_time_arithmetic_fixture_preflight -- --exact --nocapture
cargo test -p loomlight-core --locked --offline --lib screens::tests::actions::runtime::click_time_arithmetic_fixture_retains_samples_with_unresolved_gui -- --exact --nocapture
cargo test -p loomlight-core --locked --offline --lib --no-run --message-format=json
cargo test -p loomlight-core --locked --offline --lib screens::tests::actions::runtime::click_time_arithmetic_sdk_gate -- --ignored --exact --nocapture
```

Both no-SDK selectors passed exactly one test, without failures or ignored cases,
in 18.67 s and 18.53 s. Command durations were 42.203 s and 19.141 s, including
compilation/checking. All three named positive Cargo summaries passed
`python scripts/check-q1-prep-gates.py cargo-log <retained-log>`.
Fresh build JSON/stderr and the executed AMD64 test executable were retained
before launch. The launch receipt binds the clean candidate, complete input
manifest, toolchains, binary, archive, command, argument array and selected environment.

Immediately before use, the retained official SDK archive matched
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`.
The retained and repository published manifests matched
`4b0cad9ac05dc4ca55081bd3a36458c8ea658ed021f09a87276383652b6bd98b`.
The existing [official provenance](../../../spikes/renpy-sdk/published/README.md)
applies, with no separate PGP claim. Archive members, existing extracted files and
actual installed execution files agree for `renpy.py`, `renpy.sh` and Windows
`python.exe`. The executed Python binary SHA-256 is
`7c220ddbc41821a2c15199449fed09c0717e928f1d31abf0af7011c211d153a0`.
Only the SDK child received `LOOMLIGHT_RUNTIME_SDK_ARCHIVE` and
`LOOMLIGHT_ACTIONS_EVIDENCE_DIR`; retained evidence is outside its fresh short
`TEMP`/`TMP` scratch. Exact local paths remain in ignored receipts.

Launch attempt: **2026-11-09T14:05:20.014871Z**; process creation:
**14:05:20.022335Z**. Cargo exited 0 after 107.968 s. Its named one-test
summary reports 107.46 s, zero failures/ignored cases.

| Unique case | Exit | Duration | Result |
| --- | ---: | ---: | --- |
| Compile | 0 | 1421 ms | Passed |
| Lint | 0 | 894 ms | Passed |
| Normal entry | 0 | 2519 ms | All 22 assertions passed |
| Wrong outcome | 1 | 2901 ms | Required reward-10 assertion rejected |

All four records completed exactly once, without timeout or output truncation.
The SDK lists each inner selector twice. Normal entry has one duplicate not run;
wrong outcome has one duplicate skipped after the required failure. Raw summaries
are preserved. They add no passes and omit no distinct required case.
Normal entry emitted every exact witness:

```text
ARITHMETIC_95_FIRST 6/12 points=2 fraction=4.0
ARITHMETIC_95_SECOND 7/14 points=4 fraction=2.0
ARITHMETIC_95_CURRENT trust=10 reward=20 points=19 fraction=0.25 floor=-3 remainder=2 precise=9007199254740993 widened=float:2.0
ARITHMETIC_95_VALUES inert=True click=True keyboard=True textbutton=True imagebutton=True continuation=1
```

This covers current operands, changed amounts, ordered repeated text/image mouse
and keyboard activation, actual numeric types/precision, overflow refusal,
prediction/evaluation/selection inertness and one Finish continuation. Wrong outcome
reports `FAILED` at `AssertionError: assert eval (reward == 10)` and omits
`ARITHMETIC_95_WRONG_ACCEPTED`.

| Input/artifact | SHA-256 |
| --- | --- |
| Complete 883-input manifest | `0e3219a3c54df0f5129953e149897046cbc861bed80036671140831f80fd8b9f` |
| Executed/retained x64 binary | `f1e7bb933f331643d6c9a7c6c6d74209c84a457aa3d0ae2f6feb3f9d586cb8d8` |
| Accepted composed screen | `991404a3df2b8acced3d950ee5eb7bd04c18d3d3ded19a713bdec1f76f7d98e3` |
| Story fixture | `351a1779b184a0bd8d7068977c63a895e865bb4d7511f9baf4b04163d38806b5` |
| Driver fixture | `f2663cd161fc98d5fc690285430f2d0706cbfd9efaa0b6464c6d4cdf8d675a4a` |
| Runtime test owner | `1411cacc7aa2c8f3afd09973b3f409b0a2bdd85ea73c4f5e95d8092fbb85d2d5` |

Independent audit passed input/binary/SDK identity, all four actual public
validation/commit request-response pairs, both button kinds, inert samples,
accepted source/assets and injected-driver hashes. Every case retains unchanged
accepted `.rpy` sets. Terminal `arithmetic-95-terminal` reports
`passed:true,cleanupComplete:true`. The owned SDK/project/profile/saves root and
empty outer scratch are removed. No owned process remains; prior processes remain.
All 71 prior #92/#94 evidence files across both checkouts retain their paths,
sizes and hashes, including retained binaries. Unrelated refs and the registered
checkout's complete tracked-file inventory remain unchanged.

Preserve ignored `.toolchains/arithmetic-95/windows-01/`: before/after inventories,
input/source/host/build proof, retained executable, both preflight exports/logs,
launch/started/result receipts, installed/executed SDK identities, complete
`sdk/` source/request/sample/case outputs, checker receipts, independent `audit.json`,
source/selector/process audits and raw hash inventory. Repository documentation
validation and whitespace checks pass. This branch changes only this Windows note.

Consumption is **1/1 selected Windows SDK start**, Windows **3/20 started**, with
this reservation consumed and no uncertainty. Mac remains **9/20**. There was no
retry, editor/package/native/browser or manual-CI operation. The coordinator owns
integration, status/ledger, tickets, parent PR and the #97 entry decision.

## Coordinator Windows audit and integration

Normal merge `7bc452a54d2a364b81ee139f37e250e7560f7e36` preserves integration
`a2c7ab97` and evidence `55f89ddf`. The evidence commit changes only this note.
The coordinator reviewed raw normal/wrong-output records and the independent
audit, including all 22 assertions, four exact witnesses, public request pairs,
binary/SDK identities, unchanged inputs and cleanup. Local fixture/test-owner
hashes match the Windows receipt. App, fixtures, scripts and CI inputs remain
identical to Mac-qualified `ecf2e2f7`. No SDK was repeated during integration.
Both-target #95 qualification is complete; #97 may start. Final integration
review, production UI and native/human acceptance remain separate.
