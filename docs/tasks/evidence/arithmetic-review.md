# Arithmetic integration review

The code-review skill reviewed accepted Screens base
`251fb47754a0ec1a43ece8763a0b4603b8e54dd8` through integration
`09404bd16018c7f046bf6392143df6e235d481ba`. The three-dot diff contains 137
changed paths. Later coordinator documentation is outside the reviewed product.
Independent fresh agents reviewed Standards and Spec without reading each other's
reports. All findings below are P2. They are unresolved at this checkpoint.

## Standards

- **S1. IME confirmation replaces formula text.**
  `app/src/screen-arithmetic-editor.ts:86` accepts suggestion Enter during
  composition. The isolated production-control check changed `bo` to `bonus`
  with `isComposing=true`. Guard composition and its confirmation events before
  suggestion handling. [UI validation](../../UI.md#input-validation-timing-and-recovery)
  forbids rewriting text during composition.
- **S2. New formula errors appear before completion.**
  `story-arithmetic-editor.ts:125` and `screen-arithmetic-editor.ts:57` validate
  each input, including composition; Story also marks a newly empty field invalid.
  The same UI rules require a neutral untouched field and new text/number errors
  on blur or explicit commit. Preserve live valid guidance and correction of an
  already displayed error without announcing new format errors per character.
- **S3. Apply identifies the wrong invalid action.**
  `screen-interactions.ts:150` chooses the expanded row. With invalid action 1
  collapsed and valid action 2 expanded, refusal marks/focuses action 2. Carry the
  failing action identity from admission. UI submission rules require marking and
  focusing the first invalid field. This affects both button kinds.
- **S4. Unavailable validation marks valid input invalid.**
  `screen-arithmetic-editor.ts:70` sets `aria-invalid` for every exception.
  A transport-unavailable response marks valid `1` invalid. UI asynchronous-check
  rules require checking/unavailable to remain distinct from formula errors.
- **S5. Error explanations lack accessible associations.**
  `story-arithmetic-editor.ts:71` and `main.ts:967` create feedback without a
  field-associated ID. UI error rules require an accessible association, not only
  a live announcement. Connect unique feedback identities to the affected fields.

Five documented-standard findings; worst within this axis is S1. No separate
smell-only finding was reported. Tool-enforced matters were excluded.

## Spec

- **P1. Creating another variable discards a default draft.**
  `main.ts:995` redraws Variables after creation, detaching the existing draft.
  Actual main/core reproduced money's raw `1e` reverting to accepted `2.5`, with
  its dirty marker lost and no discard decision. [#87](https://github.com/Caldwell-41/Renpy-editor/issues/87)
  requires "Preserve drafts and ordinary external-edit recovery"; A2 requires
  retained invalid/default drafts. Retain the draft through unrelated creation.
- **P2. Arithmetic refusal focuses the wrong action.**
  `screen-interactions.ts:150` marks the expanded valid action while the invalid
  earlier action stays collapsed. [#97](https://github.com/Caldwell-41/Renpy-editor/issues/97)
  requires field diagnostics; A2 requires "Reveal/focus the invalid field".
  This overlaps S3 and needs one correction, without changing either axis's count.
- **P3. Completion corrupts an identifier edited at its middle.**
  `story-arithmetic-editor.ts:85` and `screen-arithmetic-editor.ts:45` replace
  only the prefix before the caret. Accepting `bonus` at `bon|us` yields
  `bonusus`. #87's variable suggestions and A2's "replacing a partial identifier
  or selection" require replacing the identifier or selected range correctly.
- **P4. Full #96 acceptance depends on unselected #110.**
  `scene-ui.ts:526` still requires settling a draft before navigation; Tracks/Reel
  and retained branch/view drafts do not exist in this increment.
  [#96](https://github.com/Caldwell-41/Renpy-editor/issues/96) requires
  "Tracks, Reel and Writing focus retain selection, branch context, keyboard
  operation and drafts." [#110](https://github.com/Caldwell-41/Renpy-editor/issues/110)
  owns the missing workspace. Keep that dependency or obtain Kris's explicit scope
  decision. This is incomplete behavior, not merely missing evidence.

Four Spec findings; worst within this axis is P1. No substantiated scope-creep
finding was reported. P4 requires a scope decision rather than an arithmetic fix.

## Evidence and correction assignment

Ignored `.toolchains/arithmetic-review-09404bd1/standards-details.md` and
`spec-details.md` retain isolated production-module reproductions, actual-main/core
draft-loss proof, pinned locations and rule/requirement citations. Both reviewers
left tracked files and refs unchanged and ran no browser or SDK. Earlier target
qualification retains its original scope; these reports establish no acceptance.

The coordinator selects one fresh implementer for S1-S5 and P1-P3, seven distinct
code defects. Its scope includes the existing UI/draft owners, narrow typed action
diagnostic context if needed, affected tests and canonical contracts. Use confirmed
TDD boundaries and preserve existing arithmetic/runtime/history owners. Retain raw
drafts, selection and focus; correct the actual invalid row without renderer
arithmetic or message-text parsing. SDK use stays Mac 9/20 and Windows 3/20,
zero reservations. The fix assignment allocates no SDK/native/package/manual-CI run.

The existing #97 visual mismatch also remains selected: bring numeric comparison
controls into A2's approved grouped arrangement and compare all affected controls
after the final palette changes at wide/compact sizes. Preserve the reference and
the separately owned full Story workspace. This known integration obligation is
not added to either independent review's finding count.

Kris has been asked whether workspace acceptance should move explicitly to #110
or continue to block full #87/#96 acceptance. The question remains pending; neither
elapsed time nor ongoing code fixes answer it. The coordinator owns that decision,
tickets, status, integration and PR. The implementer handles the independent fixes
without changing acceptance scope or implementing #110.

## CI caller correction before review fixes

One-time exact-head observation found automatic quality runs `42647963956` and
`42647882928` failed at reviewed `09404bd1`. The newest
[run](https://github.com/Caldwell-41/Renpy-editor/actions/runs/42647963956) passes
repository validation but reports 382 frontend passes and four failed results.
Those are the parent and three scenarios of `smoke-report.dom.test`: the shipped
probe waits for the removed `Edit default` button, preventing later Scene/Source
checks. This is a superseded caller of #97's new inspector, not a deadline failure.

The coordinator reproduced the same red with pinned Node against the merged app,
then changed only `app/src-tauri/src/smoke_probe.js` to select `score` and wait for
the actual `Save Default` inspector. The existing success, rejected-authoring and
incomplete-trace scenarios all pass unchanged, four reported results including
their parent. No assertion, timeout, security guard or report contract changed.
Ignored `ci/` under the review directory retains the exact job/log receipt and
local `smoke-red.log` / `smoke-green.log`. H73 indexes the cause and correction.

This source change affects the embedded probe; its DOM replay is not a matching
native-package result. No package/native/SDK was started. Later publication heads
still require their own selected automatic checks; no passing CI is inherited.
The fresh review-fix implementer must preserve this migrated caller while changing
the default editor. The independent review counts remain five Standards and four
Spec findings.

## Review corrections, 2026-11-10

The single correction implementer started on clean `t3/arithmetic-review-fixes`
with HEAD and merge-base exactly `61d70f96890276fa881f1082a2ff682496ec7911`.
A final fetch of `codex/spec-87-arithmetic` resolves to that same published base.
No other checkout, approved reference or earlier ignored receipt was changed.
The TDD seams remain the production controls and public core, including actual
main to Help driver to ApplicationHost, accepted source, shared history and reopen.
No additional agent, SDK, canvas helper, native editor/package or manual CI ran.

### Findings corrected

| Finding | Correction and observable proof |
| --- | --- |
| S1 | Both editors cancel pending inspection at composition start, retain raw input and selection during composition, and guard suggestion/editor confirmation for composition state, `isComposing` and legacy key code 229. Production Screens red replaced `bo` with `bonus`; green retains the exact text/selection with zero inspections. The Story consumer also proves no Ctrl+Enter write during composition or legacy confirmation. |
| S2 | New format errors wait for blur or explicit submission. Empty untouched fields stay neutral. Live valid type/current-state help remains available; an existing error can update or clear while corrected. Whole-form submission still uses the original core admission. Live typing feedback does not announce every character. The production-control red marked an untouched Story field invalid; blur/correction checks now pass in both editors. Existing journey callers now blur before expecting new format errors. |
| S3 / Spec P2 | Existing core action preparation adds the failing zero-based index to its existing arithmetic error, transported as optional `error.actionIndex`. Codes and guards remain unchanged. The existing requester preserves it; both Apply owners reveal/focus that row. Live inspection of another row reports that another action needs correction without invalidating its own formula. Actual-main red had no action identity; green checks both button kinds with invalid action 1 collapsed and valid action 2 expanded, exact no-write refusal and focus on action 1. Public core creation validation and Apply retain the same typed context. |
| S4 | Screens marks formula/target admission errors invalid. Transport unavailability and dirty/stale dependencies remain separate status feedback, retaining raw text and freshness guards. Production-control checks cover unavailable transport and dirty Source with valid input. |
| S5 | Story feedback and each Variables default error have unique IDs associated with their fields. Numeric target changes replace or remove the old association. The default-field red had no accessible description; the actual-main green resolves the error text through the field association. |
| Spec P1 | Variables retains default text, its original accepted value and exact source revision, error, selection and dirty state during an unrelated successful creation. The existing catalogue retains the selected entity; focus returns to its dirty default after creation closes. Red changed `1e` back to `2.5`. Green preserves both `1e` and valid `4.25`, allows unrelated creation, and proves the retained original revision still refuses a later Save after the declaration file changes. Cancel restores the last loaded accepted default. Drafts remain owned by the current Variables view and its existing navigation/session lifecycle. |
| Spec P3 | A small shared editing-range helper replaces the complete identifier around the caret or the explicit selection, preserving surrounding text and the caret. It parses no formulas. Both production editors reproduce `bonusus` before the correction and retain `bonus` afterward; selection replacement, Tab and input focus pass. |

The arithmetic parser, type checker, evaluator, generated helper, source adapters
and transaction/history implementation are unchanged. The named action-error
context plumbing is the only core behavior change. Existing literal controls,
comments, precision/type admission, independent drafts, action order/limits/context,
Finish-last, source/session guards and inert samples retain their existing owners.
The coordinator's migrated `score` / `Save Default` smoke caller is unchanged.

### Verification and retained attempts

Ignored receipts live under `.toolchains/arithmetic-review-fixes/` in the correction
worktree. Red and green logs preserve each correction, including the raw
production-control failures (`s1-red`, `p3-red`, `s2-story-red`, `s2-s4-red`),
actual-main failures (`s3-red`, `p1-s5-red`, `p1-red`, `p1-focus-red-2`) and matching
focused/journey results. An initial focus assertion compared DOM objects directly
and the process exited 137 while formatting the failure; its replacement compares
identity as a boolean and reproduces the missing focus without object expansion.
An initial Rust build caught an overbroad edit in the unrelated source-error match;
that edit was removed before the successful build. Neither is passing evidence.

- Focused production editor, Story authoring and protocol checks pass 35 tests.
  The existing envelope test also rejects malformed/out-of-range action indexes.
- Public core Screens action tests pass 17 tests; their one explicitly ignored SDK
  gate remains unrun. Controls pass 19 tests, including refusal context for
  creation validation and Apply, source/metadata/history and recovery cases.
- Actual-main Screens passes 13 stages and 505 protocol records. Actual-main Story
  passes nine stages and 126 records. Both drivers exit 0 and remove their owned
  scratch projects. The complete transcripts retain original revisions, accepted
  source, refused requests, Undo/Redo and reopen. Happy DOM supplies input events.
- The first complete frontend run reports 384/390 passes. Four failed results are
  the smoke parent and its three scenarios; the supporting-authoring test also
  fails because the new local redraw read persistence status before releasing the
  authoring lock. This is a correction regression, not a deadline problem. Status
  now refreshes after lock release. The unchanged affected tests pass. The sixth
  failure is an environment mismatch: system Python lacks `tomllib`. The pinned
  Python 3.12 invocation passes the unchanged Windows producer/validator test.
  All 13 focused failed-suite results then pass, and the complete corrected
  frontend run passes all 390 tests. Logs retain the failed run and both diagnoses.
- Pinned production typecheck and build pass. The standard Vite build first hit
  sandbox `EPERM` writing its config cache through the temporary dependency link.
  `npm run build -- --configLoader runner` loads the same config without that
  shared-cache write and passes. No dependency/config changes were made.
- Rust formatting, repository validation and whitespace checks pass. The temporary
  dependency link is removed before the clean committed handoff.

### Approved A2 comparison

The reference remains `screens-arithmetic/equation-v2`, runnable `ce626427`,
fingerprint `e9a4d3bd1952a92b68d184e68e87579c15001984d42f3a872815a124d3555f7b`,
served read-only from the existing `82d30d6e` sibling. Approved records, sources
and captures remain intact. Final dark comparisons cover textbutton, imagebutton,
variable defaults and numeric conditions at 1100×720 and 560×640, display scale 1,
with matching numeric content and selected/expanded state. Each control is scrolled
into view; full-context captures retain the different surrounding workspaces.
`browser-final/comparison.json` records geometry, field values, computed palette,
viewport/scale and 32 capture hashes. Both versions were visually inspected.
The managed browser exposed only display scale 2, so the required scale-1 captures
used one owned Chrome context after scoped unsandboxed launch approval. Managed
resizing logged a ResizeObserver delivery warning; final paired captures recorded
zero page errors. All owned comparison tabs/browser/server and its driver closed.

Numeric comparisons now group Variable, Comparison and Number in one row, placing
Number below the first two fields at compact width. Other condition kinds retain
their controls. Scoped semantic palette tokens apply the approved slate surfaces,
brass actions, readable fields and feedback. Popovers use the existing elevation
token. The default and equation inputs match the reference's 40-pixel rendered
height; the numeric comparison selects match its 34-pixel height. The final captures
follow the palette changes and supersede no earlier evidence.

Visual fidelity is close for the selected controls, with remaining context differences:
production retains its existing sidebar/panels, imagebutton tabs and Apply labels,
so available widths and compact overlay placement differ from the mock. Production
also retains truthful unknown-current-state guidance, real refusal text and disabled
Cancel when there is no change. Numeric condition help remains below the grouped
fields. These captures establish scoped control conformance, not the full Story
workspace or app-wide palette. No new layout/design decision or full #110 work
was selected.

### Runtime inputs and handoff limits

`candidate.json` freezes the app/script/fixture/CI input inventory and driver hash.
`runtime-inputs.json` records every successful UI mutation payload, refusal and
final accepted source snapshot from both core journeys. `emitted/` retains those
exact `.rpy` files. The input fingerprint is
`e06fea9537309f4f33b08afb6fd602f857f00fc078fb165f0105ca75cef445c4` across 873 files.

The emitted Screens inventory contains decimal creation/defaults, retained-draft
revision refusal, both ordered button lists and Finish, all seven numeric operation
keys with `(9.5 + 0.5) / 4`, a newly created decimal imagebutton, decimal text/sample
inputs and a numeric condition threshold `2.75`. The final source paths are
`game/definitions/variables.rpy`, `game/ui/arithmetic_dialog.rpy` and the fixture's
`game/chapters/chapter_01/scene_001.rpy`. The separate Story inventory includes
imported/comment-preserving whole/decimal formulas, all operations, literal
Boolean/Text no-ops and nested insertion through its existing captured body/position.
These are separate disposable projects, with exact IDs/revisions in the transcripts;
they are not a newly qualified combined runtime fixture.

Functionally, the mapped controls pass production-control/public-core checks,
accepted-source/history/reopen and the scoped visual comparison. New UI-emitted
payloads/source still need the coordinator's selected coherent runtime qualification.
No SDK/native/human/full-feature acceptance is claimed. Mac stays 9/20 and Windows
3/20, zero reservations. Spec P4 and the pending #96/#110 scope decision remain
with the coordinator; neither criteria nor ticket/status/PR state was changed here.

## Integration equivalence and fresh checks

The fresh merger confirmed clean `codex/spec-87-arithmetic` at
`636371b8262fbc660cc76da49a66d80271fc7356`, one coordinator-only checkpoint beyond
published `61d70f96890276fa881f1082a2ff682496ec7911`. The returned branch was clean
at `354b52211b42e85721d80b751b08832db10db38e`. Conflict-free normal `--no-ff`
merge `b52a6723bfb1c86895227813e35865d4c6d9dc2f` has those coordinator and returned
heads as its two parents, in that order. It changes the expected 20 paths and
requires no integration fix. The subsequent handoff commit changes documentation
only; it does not establish a new tested application candidate.

Complete merged trees equal `354b5221`:

| Tree | Git tree identity |
| --- | --- |
| `app` | `4b575f694874fee831a126fa80ed568167e36f38` |
| `tests/fixtures` | `58bde4d6170ff1d600cc9d662e00951303212816` |
| `scripts` | `56200065602421cdfad377180ef45a251f02b89f` |
| `.github` | `a79289dcdb51e68e0924f4883f799887706556f7` |

All 873 frozen files match both Git checkout representations and both working
trees. The fingerprint remains
`e06fea9537309f4f33b08afb6fd602f857f00fc078fb165f0105ca75cef445c4`.
Four unchanged PowerShell scripts match through their explicit `eol=crlf` filters.
The merged evidence tree equals the returned tree before this append. Coordinator
status/ledger, approved design/source/capture trees, dependencies, fixture discovery,
CI plan and the migrated smoke caller are preserved. Arithmetic parser/type/evaluator,
source adapters, runtime helper and transaction/history internals are unchanged by
the correction. Core changes remain limited to the named action-error context.

### Reused results and final follow-up scope

Reuse follows the returned `candidate.json`, `commands-and-results.json` and each
recorded material-input scope. The 390-pass `frontend-candidate.log` is retained
as the whole-suite result on its recorded source. The final Story target-association
cleanup has a separate `story-associations-final.log` with 11 passes. Reuse
unaffected earlier cases and that affected rerun together. The older whole-suite
run is not represented as an exact-final-source run, and the 11 are not added to
390 as distinct tests. Likewise, the 35 focused editor/authoring/protocol passes
retain their original scope with that final Story follow-up.

Reuse 17 public-core action passes and 19 control passes. The named ignored SDK
gate remains unrun and adds no pass. Reuse the actual-main/core Screens journey
with 13 stages/505 records and Story with nine stages/126 records. Both retain
exit 0 and complete cleanup. The retained Help binary still hashes to
`02a56bab3bbe9441918ba943eb50305ed2b7b300e67846e751dd225702e13421`.
All four emitted source hashes and 32 final comparison capture hashes match.
Reuse production build/typecheck/format and the final eight A2 comparisons on
their recorded inputs. The coordinator's eight-crop inspection remains the visual
audit; this merger opens no browser and claims no additional visual inspection.

### Fresh combined checks

- Pinned Node 24.19.0/npm 11.9.0 `npm run typecheck` and `npm run build:tests` pass.
- `node --test dist-tests/tests/protocol.test.js` passes all nine existing checks,
  including the optional typed action index and malformed/out-of-range rejection.
- The newly compiled merged response validator accepts all 631 retained journey
  envelopes, including 11 indexed errors. This audits recorded actual-core results;
  it does not rerun either journey.
- The existing contract/branch-plan audit, applied to the corrected receipt,
  verifies 31 successful no-write validations across `actions` and `addImageButton`,
  all seven operation keys, lossless i64/finite-decimal capabilities, original
  revision guards, typed error context, automatic fixture discovery and quality-only
  PR selection for the existing head/base. No CI dispatch is selected.
- Pinned Python 3.12 repository validation passes for 1,872 files. Merged and
  handoff whitespace checks pass. No fresh broad suite or costly campaign ran.

New receipts are isolated in ignored
`.toolchains/arithmetic-review-fixes/integration-merge/`: `equivalence.json`,
`fresh-frontend-checks.json`, `recorded-envelope-check.json`, `contract-check.json`,
logs, preservation manifests and publication receipts. The coordinator audit remains
byte-identical. All 182 worker raw evidence files outside the compiler cache remain
byte-identical, with the retained binary verified separately. All failures, logs,
sources, binaries, captures and prior evidence remain in their original locations.
Initial integration attempts hit sandbox DNS and Git-metadata write restrictions;
scoped host execution completed the same authorized reads/merge. These were not
test failures. No guard, assertion or deadline changed.

### Correction state and handoff

The original independent Standards 5 / Spec 4 reports at `09404bd1` remain intact.
S1-S5 and Spec P1-P3 are corrected, with S3/Spec P2 fixed once. No independent
re-review approval is claimed. A2 grouped numeric conditions and slate/brass scoped
controls now match closely; existing workspace widths/placement, unknown-state
wording and the other recorded host differences remain.

Spec P4 is unresolved. Kris's pending question about moving #96's Tracks/Reel/
cross-view-draft acceptance to unselected #110 has no answer. All issues and criteria
stay open. New UI-emitted payload/source still needs the coordinator's selected
coherent runtime proof; original #94/#95 both-target evidence keeps its original
scope. Full Story workspace, native and human acceptance remain open. SDK totals
stay Mac 9/20 and Windows 3/20, zero reservations. This merger starts zero SDK,
browser, canvas-helper, editor-native, package, manual-CI or watch operations.

Draft PR #122 keeps its Screens base and eventual full-spec closing references.
The publication receipt owns the final documentation-successor SHA, remote/local/
upstream agreement and the one-time exact-head automatic CI observation. No prior
green status transfers to the published head. Integration/status/PR ownership
returns to the coordinator after publication; successor qualification and the P4
decision belong to that coordinator.

## UI-emitted source qualification preparation, 2026-11-10

The separate test worktree starts clean on `t3/arithmetic-ui-runtime-proof` at
`cbb0ca27dc8353dbd359f6e2c33b9719b0f26f71`. Required integration ancestry is
confirmed. Production, dependencies, CI, status, tickets and PR remain unchanged.
The confirmed boundary is actual UI/public core, accepted source/history/reopen,
then focused pinned SDK. P4 and #96/#110 scope remain pending.

The portable [fixture](../../../tests/fixtures/arithmetic-ui/README.md) preserves
all four selected captured source hashes, original labels/helper identities and
the exact existing image bytes. Its manifest pins the original inventory
`1b8e980a52a292532c2cea8e7952210e2e81d57afb2b0fb28593415b49fdf1e4`.
Curated public setup and successful UI payloads retain original IDs/revisions.
Both scene files are relocated to distinct files, with no source edits. The README
records every prerequisite, relocation, operand change and independent literal
oracle. No app diagnostic supplies an expected runtime result.

The existing `screens::tests::actions::runtime` owner now accepts these snapshots,
checks Source history/reopen and inert typed canvas samples, and selects a new
ignored `ui_emitted_arithmetic_sdk_gate` through its existing SDK runner. Existing
#92–#95 fixtures/assertions remain intact; the Story source-foundation owner is
unchanged. A test-only receipt hook in the existing subprocess owner records all
SDK children, including fixture construction, without another runner or evaluator.
The exact raw buttons overlap. Qualification selects actual rendered actions and
uses a fixture timer for normal interaction/Finish delivery. It makes no new
mouse/keyboard/native-editor claim. Original #95 gesture proof retains its scope.

The first TDD check fails on missing portable inputs. SDK-free follow-ups preserve
all failed logs: mapped defaults reject Source save (`MAPPED_DEFINITION`), so public
variable authoring reproduces their exact bytes; an initial asset import lacks its
required directory (`SOURCE_CONFLICT`), corrected before source acceptance. The
standalone imported screen has no transplanted ownership metadata, so its key,
image appearances and helper init remain explicitly unavailable to the inert canvas.
The preflight records those bounded limits and requires correct literal text and
unchanged source. It does not grant canvas-rendering eligibility. These are fixture
arrangement issues, with no production correction or SDK start.

Pinned SDK-free checks pass both minimal and simulated SDK-GUI fixture cases.
The static preflight compiles 53 driver Python expressions/statements, checks unique
rendered-action selection with inert doubles, and verifies the worked Story oracle
using stock Python. This is not runtime proof. Official archive and both retained/
repository published manifests match their pins. Twelve installed SDK execution/
selector files match archive members; launcher permissions are present. Published
[provenance](../../../spikes/renpy-sdk/published/README.md) remains authoritative.

Fresh evidence is isolated under ignored `.toolchains/arithmetic-ui-runtime/`.
Before the selected launch, require a committed clean candidate, isolated pinned
Rust build and retained binary, full source/config/lock/fixture identities, command
array/environment and actual Mac desktop admission/power receipt. Usage before
launch remains Mac 9/20 started plus one reserved, Windows 3/20 plus none reserved.
No retry, Windows, editor-native/package, browser/helper, manual-CI or watch is selected.

Portable commands from repository root (pinned local toolchains and verified archive
paths are supplied by each host; use a fresh evidence directory and short contained
Windows `TEMP`/`TMP`):

```text
cargo test --manifest-path app/src-core/Cargo.toml --locked --offline screens::tests::actions -- --nocapture
cargo test --manifest-path app/src-core/Cargo.toml --locked --offline --no-run --message-format=json
<retained-test-executable> screens::tests::actions::runtime::ui_emitted_arithmetic_sdk_gate --ignored --exact --nocapture
```

The SDK command requires `LOOMLIGHT_RUNTIME_SDK_ARCHIVE`,
`LOOMLIGHT_ACTIONS_EVIDENCE_DIR` and `LOOMLIGHT_SDK_CHILD_EVIDENCE_DIR`.
On Mac, launch outside the sandbox under the existing `native_desktop` wrapper.
Each unique case is compile, lint with error status, normal entry or deliberate
wrong outcome. This command is reusable input for later coordinator-routed Windows
work, not authorization for a Windows invocation here.

### Mac invocation 1 failed at narration progression

The selected invocation ran candidate
`81494e373e770aae98bfa5d000dc0e5adb471fa7`, with retained native test executable
SHA-256 `3ec789d8a4e988cd67653322e623d5b55f640aa814cdf0896decfe93ae7fd79c`.
Pinned Rust 1.90 built offline/locked in this assignment's isolated target. The
retained final binary passed both exact SDK-free fixture preflights. The broader
public action group passed 19 tests, with the two named SDK gates explicitly ignored
and counted as zero passes. Formatting, repository validation (1,880 files) and
whitespace passed. All 1,880 frozen tracked inputs match the candidate's Git checkout
representation, including configured newline filters.

The archive remains
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`;
the published manifest remains
`4b0cad9ac05dc4ca55081bd3a36458c8ea658ed021f09a87276383652b6bd98b`.
The launch receipt retains the complete input inventory, toolchain/host identities,
command array, child environment subset and installed SDK file hashes. The executed
staged SDK identities match those independently checked against archive members.
No download or system installation occurred.

The sandbox desktop query returned unreadable values and launched nothing. A scoped
host query admitted the actual unlocked, awake desktop. The single deliberate SDK
invocation then ran outside the sandbox under `native_desktop`, holding and releasing
both power assertions. Total invocation duration was 86,658 ms; the Rust gate exited
101. Its case records were initialized before SDK staging and exported before each
assertion.

| Unique selected case | Exit | Duration | Result |
| --- | ---: | ---: | --- |
| Compile | 0 | 460 ms | Passed |
| Lint with `--error-code` | 0 | 269 ms | Passed |
| Normal entry | 1 | 11,565 ms | Failed at the next narration assertion |
| Wrong outcome | Unrun | Unrun | Required rejection remains missing |

Normal entry passes five assertions before failing its sixth. It proves main-menu
entry, inert prediction defaults, the exact Story intermediate trace and actual
numeric types, protected `max` execution, nested assignment and literal Boolean/Text.
The observed trace is `(trust, money)`:
`(5, 4.5), (5, 9.5), (6, 9.5), (6, 1.5), (5, 1.5), (6, 1.5), (27, 1.5)`.
Trust stays `int` and money stays `float`. The exact emitted witness is:

```text
ARITHMETIC_UI_STORY precision=6 protected=5 nested=27:int money=1.5:float flag=True title=retained_text
```

After bare `advance`, `assert "UI story complete" timeout 10` fails. The traceback
still locates execution at captured `ui_story.rpy` line 15, `"Arithmetic journey"`.
The child exits with an assertion failure, without subprocess timeout or truncation.
The SDK prints the same inner selector twice; one is failed and one not run. These
are one unique required case, not two executions or additional passes.

No condition/text/divide/ordered-image/Finish runtime witness was reached. The wrong
case remains `notRun`; absence of its wrong-accepted marker does not establish a
rejected wrong outcome. This invocation does not qualify the complete fixture.
Original #94/#95 both-target results keep their original source and gesture scope.

The existing subprocess owner records **10 physical SDK children**, each with a
matched start/completion, PID, argument array, cwd, duration, raw output and flags.
Seven construct the fixture: three version checks, GUI generation, GUI images,
template compile and template lint. Three run the selected compile/lint/normal cases.
All seven construction children exit zero. Physical children are separate from the
single charged feature invocation. No retry occurred. Usage is now **Mac 10/20
started, zero reserved; Windows 3/20 started, zero reserved**.

The raw audit verifies 77 exported project files, all four captured hashes and image
bytes, and all 11 accepted `.rpy` files. Source hash sets remain unchanged across
all three completed cases. Both power assertions are released, the owned temporary
root is absent and the host process audit finds no owned SDK/test process. The
retained binary, raw cases, complete child records, frozen inputs, source/assets,
context, timings, desktop receipt and audit remain in ignored
`.toolchains/arithmetic-ui-runtime/mac-01/`. Prior evidence/binaries are preserved.

### SDK-free correction and remaining proof

Classification is a fixture narration-progression defect, with the exact live event
ordering still provisional. H11/H60 and the pinned SDK's `Advance`/`Until` code were
checked before correction. An SDK-free extraction of the actual `Node`, `Advance`
and `Until` classes shows that bare `Advance` can finish on an unidentified `begin`
callback. `Until` continues until its destination condition becomes true. This
supports the leading late-current-line callback hypothesis; it does not claim an
observed native callback trace. The runtime failure itself remains the red evidence.
No product arithmetic defect was observed and no production correction was made.

The existing fixture preflight now refuses bare `advance` and was observed red
before changing the driver. The corrected driver uses seven explicit
`advance until <expected narration or screen> timeout 10` transitions. Source
snapshots, asset bytes, expected values, required assertions and timeouts are intact.
An initial shortened exact selector discovered zero tests and supplies no pass;
the corrected full selector produced the recorded red result. The affected public
action group then passes 19 tests again, with only the two named SDK gates ignored.
The corrected driver's static Python and destination checks pass. It has **not**
run in the SDK; no green runtime result transfers from the attempted driver.

Latest local `codex/spec-87-arithmetic` is already an ancestor, so the requested
normal merge reports `Already up to date`. The test branch retains the clean
published integration and attempted candidate histories. Final portable inputs,
correction and evidence are ready for a fresh merger. The coordinator must select
any further Mac invocation before the missing Screens/Finish/wrong-outcome proof
can run, then route Windows qualification. This assignment grants no retry or
Windows start and claims no full acceptance, native editor proof or P4 resolution.

The attempted driver SHA-256 is
`8cd35fe7de9450d47e269f42bb8b085a2c73abe0f1dfd26126654ea2f82c4d05`;
the corrected, SDK-unrun driver is
`dc52be7ec9edbe66e208c496dccca41552bc6d6a287f4b316987982c301270ac`.
The final SDK-free action result is 19 passed, zero failed, two named SDK gates
ignored; final formatting, repository validation (1,880 files) and whitespace pass.
No temporary dependency link was created. No source/evidence worktree, old target,
retained binary or historical receipt was removed. Publication remains unselected.

## Recovery integration and Mac invocation 2, 2026-11-10

The fresh merger confirmed clean `codex/spec-87-arithmetic` at
`b22572419bf39abb7fd9ec7ce6967505ca8492a9`, one unpublished coordinator checkpoint
beyond `cbb0ca27`. Conflict-free normal merge
`ec7e366b7bff4051b54b2f739fe1416b35fa5360` preserves that first parent and returned
`12ce2eeaca7a4ab69c3853bd5409cedc9e8540da` as its second parent. Complete app,
fixture, script and CI trees equal the return. Coordinator status/ledger/incident
records survive unchanged. The eleven returned paths change portable fixtures,
the existing SDK test owner, `cfg(test)` subprocess receipts and evidence only.
Production arithmetic/UI/history, approved design references, four immutable UI
snapshots and existing image bytes are intact.

All 1,880 tracked inputs match Git checkout bytes. Fresh pinned Rust 1.90 builds
locked/offline in isolated `target-mac-02`; retained executable SHA-256 is
`5b09843129f38690eeda1b6140f49972acc3b25a1579930f5b6bf5867abd749f`.
Both exact SDK-free UI preflights pass from this executable. The action group
passes 19 cases with the two named SDK gates ignored, adding no SDK passes.
Static admission checks 53 Python statements/expressions, seven destination-bound
transitions, snapshot/request/asset hashes and the independent literal oracle.
Rust formatting, repository validation (1,880 files), whitespace and the existing
contract/quality-only branch-plan audit pass. The contract audit rechecks 31
recorded validations and 11 indexed errors; it is not fresh runtime execution.

The merger published `ec7e366b` before SDK use and verified remote/local/upstream
identity and a clean checkout. This exact merge is both the pre-SDK tested head and
the recovery source. All source remained fixed during execution. The corrected
driver remains `dc52be7ec9edbe66e208c496dccca41552bc6d6a287f4b316987982c301270ac`.
The old attempted executable and worker `mac-01` evidence were not reused or modified.

The existing cached official archive and published manifest were verified again
immediately before use, at their unchanged `eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45` and
`4b0cad9ac05dc4ca55081bd3a36458c8ea658ed021f09a87276383652b6bd98b` pins. Twelve installed SDK execution/selector
files match archive members; the five staged execution identities match those
verified inputs. The launch receipt retains every source/config/lock/fixture hash,
complete toolchain/host identities, command array and required child environment.
Node 24.19.0/npm 11.9.0, Rust/Cargo 1.90 and Python 3.12 use the pinned project/runtime
paths. No download or system installation occurred.

The current `native_desktop` wrapper admitted the actual unlocked, awake Mac desktop
under scoped outside-sandbox execution. The one reserved invocation started and
consumed its slot. It ran the exact fully qualified
`screens::tests::actions::runtime::ui_emitted_arithmetic_sdk_gate --ignored --exact --nocapture`.
The native test exited **101** after **87,558 ms**; its named Cargo result is failed,
zero passed. Shared `cargo-log` validation rejects it. No retry or correction followed.

| Unique selected case | Exit | Duration | Result |
| --- | ---: | ---: | --- |
| Compile | 0 | 465 ms | Passed |
| Lint with `--error-code` | 0 | 270 ms | Passed |
| Normal entry | 1 | 11,672 ms | Failed at first divide assertion |
| Wrong outcome | Unrun | Unrun | Required rejection remains missing |

Normal entry passes **13 assertions**, then fails assertion 14 at driver line 102,
`money == 2.25 and type(money) is float`, with script context still at line 53,
`call screen arithmetic_dialog`. Destination-bound progression now reaches the
Story return, `Fraction accepted`, condition return and rendered screen. The exact
Story trace/types and `ARITHMETIC_UI_STORY` witness match invocation 1. Rendered TTS
contains `Balance: 4.5`; selection, prediction and interaction restart preserve
trust 5, reward 0, money 4.5 and zero continuations before activation.

The first divide result is not observed. Required `ARITHMETIC_UI_DIVIDE`,
`ARITHMETIC_UI_TEXT`, `ARITHMETIC_UI_IMAGE` and `ARITHMETIC_UI_VALUES` witnesses are
absent. Ordered/current text/image activation, post-activation types, Finish and
actual wrong-outcome rejection remain unproved. Wrong outcome is `notRun`; absence
of `ARITHMETIC_UI_WRONG_ACCEPTED` supplies no negative-case pass. Duplicate inner
selector listings represent one failed case and one not run, not extra executions.

Classification is missing runtime evidence with a provisional fixture timer
dispatch/interaction-refresh defect. Pinned SDK test Python execution and
`show_screen` do not themselves restart interaction; Timer requires render/event
delivery. The receipt does not observe the live timer callback or post-dispatch
money, so it does not establish the exact cause or a product arithmetic defect.
H75 indexes this boundary. A future selected diagnostic should distinguish actual
dispatch delivery and observed values before any correction or SDK allocation.
This merger is assigned neither. H74's narration destination is reached in this run;
that narrower correction does not turn the full gate green.

The independent terminal audit verifies all **10 physical SDK children**, each
with matched start/completion, PID, arguments, cwd, duration and output. Seven
construction children and compile/lint exit zero; normal exits one. Every completed
child has no process timeout or truncation. Physical children are separate from the
single charged invocation. Evidence/case initialization precedes SDK staging and
lives outside the owned temporary root.

All 77 exported project files, 11 accepted `.rpy` files, four captured hashes and
image bytes match. Source hash sets are unchanged in all three completed cases.
The actual desktop stays admitted, both power assertions release, the owned root
is absent and host audit finds no owned process among the eleven recorded test/SDK
PIDs. Raw outputs, accepted source/assets, launch/frozen-input manifests, retained
executable, desktop receipt, failure classification and independent/process audits
remain ignored under `.toolchains/arithmetic-ui-runtime/mac-02/`. Prior failed
worker `mac-01`, its target/binary, coordinator audit and every earlier receipt remain
preserved.

Usage is **Mac 11/20 started, zero reserved; Windows 3/20 started, zero reserved**.
The recovery fails full qualification. This is rendered-action fixture work, with
no new mouse/keyboard/native-editor proof. Original #95 physical-gesture evidence
keeps its unchanged-adapter scope. Independent Standards five/Spec four reports remain separate and preserved.
P4 and Kris's #96/#110 scope decision remain open. Windows qualification remains
pending coordinator routing; no Windows/editor-native/package/browser/canvas-helper/
manual-CI/watch operation ran. Integration/status/PR and qualification ownership
return to the coordinator after publication of this result.

## Interaction-refresh diagnosis and confirmation selection

Invocation 2 remains failed. The coordinator compared a missing interaction refresh,
a delivered timer selecting the wrong/stale action, and arithmetic failure after
delivery. The retained output cannot establish the latter two without delivery.

The pinned SDK's test `Python.execute` runs `scoped_exec` without refreshing.
`show_screen` registers a lazy displayable; its widgets need interaction processing.
The fixture's `_ui_activate` requested no refresh. An SDK-free replay executes the
actual pinned Python node, show/restart APIs and fixture helper with inert display
registration. It is red with a registered screen but `refreshRequested:false`, and
green after adding the missing request, with the selected action unchanged.
Ignored `recovery-03/display-admission-replay.py` and red/green logs retain source
identities. This proves the admission contract, not native timer/value delivery.
The existing SDK divide assertion remains the real regression seam.

The fixture-only correction adds `renpy.restart_interaction()` at the missing
call site. A permanent dispatch-request receipt records operation, actual current
values, screen-built state and refresh before/after. It does not execute or replace
the captured action. Four snapshots, image bytes, oracles, assertions and deadlines
remain unchanged; no production code changes. Subsequent value assertions must
still establish actual delivery. No synthetic timer/evaluator supplies a pass.

After reassessing the two incomplete UI attempts, select one Mac confirmation
following clean source/binary/official SDK/desktop readiness, using fresh `mac-03`.
Before start, actual use is Mac 11/20 plus one new reservation, Windows 3/20 with
none reserved. Require all positive witnesses and an actually rejected wrong
outcome, source preservation and cleanup. No further retry is selected. P4 and
full acceptance remain open.

## Mac invocation 3 passed, 2026-11-10

Clean published source `72eb9f13b1156b76deb4873f8a8d32a57785340b` includes only the
fixture refresh correction and its records since `44898be2`. Production, four
captured sources, image bytes, oracles, assertions and deadlines remain unchanged.
The retained fresh executable SHA-256 is
`5aade0c40f458aedadc2e6dadd03da6569d4b4014d778722a97f5bf84bc6b24c`;
driver SHA-256 is
`2f18f568077462104d45fc385638d13b1133cbe22a7373479dd7107429408d89`.
Both exact SDK-free fixture preflights pass. The public action group passes 19
cases with its two named SDK gates ignored. All 1,880 source/config/lock/fixture
hashes match Git and the working checkout before and after execution. The existing
Cargo-log validator accepts the named positive SDK result.

The verified cached official archive and published manifest retain their earlier
pins. Fourteen installed SDK execution/selector/API files match archive members;
the staged execution identities match those inputs. The actual unlocked, awake
desktop is admitted through `native_desktop` outside the sandbox. The selected
invocation starts once, exits zero after 80,589 ms and consumes the reservation.
The retained executable runs the exact fully qualified
`screens::tests::actions::runtime::ui_emitted_arithmetic_sdk_gate --ignored --exact --nocapture`.

| Unique selected case | Exit | Duration | Result |
| --- | ---: | ---: | --- |
| Compile | 0 | 477 ms | Passed |
| Lint with `--error-code` | 0 | 245 ms | Passed |
| Normal entry | 0 | 1,768 ms | All 28 assertions passed |
| Wrong outcome | 1 | 2,059 ms | Required rejection passed |

Normal entry emits all five exact witnesses:

```text
ARITHMETIC_UI_STORY precision=6 protected=5 nested=27:int money=1.5:float flag=True title=retained_text
ARITHMETIC_UI_DIVIDE 4.5/2=2.25/2=1.125:float continuation=0
ARITHMETIC_UI_TEXT first=2.0:float/12:int second=2.0:float/14:int current=True
ARITHMETIC_UI_IMAGE first=10/20 second=12/24:int bonus=3,2 ordered=True
ARITHMETIC_UI_VALUES inert=True text=True condition=True rendered_actions=True continuation=4
```

Six passive dispatch-request receipts show the timer screen still unbuilt and
refresh changing from false to true. Subsequent assertions establish the exact
divide, ordered/current textbutton and imagebutton results and four Finish
continuations. Wrong outcome actually reports `FAILED` at `trust == 26`, with
actual trust 27, and omits `ARITHMETIC_UI_WRONG_ACCEPTED`. Its two passing setup
assertions and one deliberate failure are not extra positive cases. Duplicate
inner selector listings omit no required case and add no passes.

The independent audit matches all 11 physical SDK children, including seven
construction children, with complete start/completion records. Every child has
no process timeout or output truncation. All 77 exported files, 11 accepted `.rpy`
files, four captured sources and image bytes match; all four cases preserve source.
Both power assertions release, the owned temporary root is absent and the host
process audit finds no owned process among the 12 recorded test/SDK PIDs.
Terminal evidence is `passed:true,cleanupComplete:true`.

Fresh ignored `.toolchains/arithmetic-ui-runtime/mac-03/` retains the executable,
launch/frozen inputs, readiness/official SDK identities, raw cases/children,
accepted source/assets, desktop receipt and independent/process audits. Both
earlier failed attempts, their binaries, targets and unique receipts stay intact.
Actual usage is **Mac 12/20, Windows 3/20, zero reservations** after this run.
Windows selection follows in the delivery record; it does not transfer a Mac pass.
This qualifies unchanged rendered actions dispatched by a fixture timer, with no
new physical gesture or native-editor proof. Original #95 evidence retains its
scope. P4, #96/#110 scope and full acceptance remain open.

## Automatic CI fixture consumers corrected, 2026-11-10

The exact-head [quality failure](https://github.com/Caldwell-41/Renpy-editor/actions/runs/42670532527/job/129345577963)
at `72eb9f13` reproduces two obsolete caller assumptions. The Screens controls
fixture throws only an error code, dropping the public core's `actionIndex` needed
to reveal/focus the invalid row. Its Apply waits for a field error that cannot be
associated without that context. Four inherited Screens dispatch adapters now
preserve the complete typed error object, matching production transport. Story's
browser fixture waits for a new formula error immediately after input; it now
blurs that field before waiting, matching reviewed validation timing.

Pinned Node 24.19.0 test compilation and all four affected dispatch fixtures pass
against a fresh locked/offline help-controller driver. The focused Story Chrome
fixture then passes with wide/compact control comparisons, operation-menu focus,
formula error/recovery, keyboard/draft/Cancel and accepted-source assertions intact.
It closes its owned browser/driver and removes its scratch project. No assertion,
deadline or fixture was removed. Repository validation passes all 1,880 files;
whitespace passes. The original CI log and fresh green logs/results are retained
under ignored `arithmetic-ci-callers/` and `arithmetic-ui-runtime/mac-03/`.

These five caller edits change no production, core, SDK driver, captured source or
asset input. Those trees/files still equal Mac-qualified `72eb9f13`; another Mac
SDK run is unnecessary. Exact successor-head automatic checks remain for audit.
H76 indexes the consumer failure. No new SDK/native-editor/package run occurred.


## Windows UI-source invocation 1 passed, 2026-11-10 AEST

The bounded Windows assignment tests exactly published integration
f3450c0644e3ed7fc8b144df6dff28012f787a2e. The existing assigned qualification
checkout on codex/spec-87-windows-92 was clean at
55f89ddfaab237d6786ff4242eb0b5b92f9dc666. Ownership, actual Git root/common
directory, both worktrees, branch and refs were checked before fetching only the
selected integration ref and fast-forwarding normally. No checkout was created or
switched. The registered project remains clean on codex/phase3b-screen-designer
at 251fb47754a0ec1a43ece8763a0b4603b8e54dd8, with every tracked file unchanged.

Production/core and all portable SDK fixtures equal Mac-qualified
72eb9f13b1156b76deb4873f8a8d32a57785340b. The successor changes documentation and
five frontend fixture callers. This result binds the tested integration SHA; the
evidence-only successor does not qualify another implementation. This assignment
edits only this evidence note. Product, tests, fixtures, status, ledger, issues,
PR and acceptance contracts remain unchanged.

### Preparation and exact selection

Fresh ignored .toolchains/arithmetic-ui-runtime/windows-01/ was absent before
creation. Before synchronization, all 222 files under the earlier #92/#94/#95
evidence directories were hashed, including their binaries and unique receipts.
Every earlier file still has the same size and SHA-256 after execution.

All 895 tracked app, test/fixture, script, CI, published SDK and root configuration
inputs match Git's checkout representation through git cat-file --filters.
This reconciles .gitattributes, Windows checkout endings and the preserved
mixed-newline fixture. Their actual working hashes remain unchanged across the
build, SDK execution and audit. input-manifest.json retains every path, size and
hash. The source receipt also pins app tree
e6b70a0cc7f8e757b7ba5fe783d9b4a37dc8c31c and fixtures tree
80a519cd1fc375dfb46ce4c2fea8631890e45383.

The existing machine helper supplies Rust 1.90.0 (1159e78c4 2025-09-14),
Cargo 1.90.0 (840b83a10 2025-07-30), LLVM 20.1.8 and native
x86_64-pc-windows-msvc. MSVC is 19.50.35726 for x64, from installed toolset
14.50.35717. The orchestration interpreter is Python 3.12.14; the SDK reports its
own Python 3.12.7 and Ren'Py 8.5.3.26051504 on Windows 11 build 26200.
No download, installation, GNU target, SDK patch or signing change occurred.

After loading the existing machine-local enter-dev.ps1, the exact Cargo commands
ran from app/, locked and offline, with fresh isolated CARGO_TARGET_DIR and
CARGO_BUILD_TARGET=x86_64-pc-windows-msvc:

~~~text
cargo test -p loomlight-core --locked --offline --lib screens::tests::actions::runtime::ui_emitted_arithmetic_fixture_preflight -- --exact --nocapture
cargo test -p loomlight-core --locked --offline --lib screens::tests::actions::runtime::ui_emitted_arithmetic_fixture_preflight_with_template_initialization -- --exact --nocapture
cargo test -p loomlight-core --locked --offline --lib --no-run --message-format=json
~~~

SDK execution variables and inherited SDL overrides were stripped for both
preflights. Only each fresh evidence destination was supplied. Each exact selector
passed one test with zero failures, ignores or skips. Test durations were 4.26 s
and 4.34 s; outer durations were 61.016 s, including the fresh 56.53 s compilation,
and 4.906 s. The no-run artifact receipt completed in 0.500 s. The existing
python scripts/check-q1-prep-gates.py cargo-log <log> accepted both logs and the
final SDK log. Cargo artifact JSON and the fresh retained AMD64 executable are
available independently of the result.

The existing official archive and both supplied/repository published manifests
match their established pins. Sixteen installed SDK launcher/runtime/test/API
files match archive members. The observed staged SDK matches the same sixteen
hashes; the test owner's SDK context independently agrees on its execution files.
The published provenance makes no separate PGP verification claim.

Actual desktop admission checked the input desktop name Default, interactive
64-bit session 1, foreground availability and 2560x1440 display before launch.
The same admission passed after exit. No display resolution or physical input
changed. Evidence stayed outside the owned SDK root. TEMP and TMP used the
fresh short contained scratch named auiW01.

The retained test-executable.exe ran this exact argument selection once, directly:

~~~text
screens::tests::actions::runtime::ui_emitted_arithmetic_sdk_gate --ignored --exact --nocapture
~~~

launch-receipt.json retains the absolute executable/cwd, complete argument array,
selected environment, identities and readiness facts.
LOOMLIGHT_RUNTIME_SDK_ARCHIVE points to the verified retained official archive;
LOOMLIGHT_ACTIONS_EVIDENCE_DIR points to this run's sdk/;
LOOMLIGHT_SDK_CHILD_EVIDENCE_DIR points to this run's children/.
sdk-child-environment.json records the environment inherited through the existing
renpy.rs allowlist. The unchanged driver sets dummy audio inside the fixture.
There was no Cargo SDK invocation after direct binary execution.

### Unique outcomes and witnesses

The executable started at 2026-11-09T18:26:53.979788Z and exited zero at
2026-11-09T18:28:27.214724Z, taking 93,235 ms including construction.
The retained per-case measurements are:

| Unique selected case | Exit | Duration | Result |
| --- | ---: | ---: | --- |
| Compile | 0 | 1,563 ms | Passed |
| Lint with --error-code | 0 | 1,078 ms | Passed |
| Normal entry | 0 | 2,814 ms | All 28 assertions passed |
| Wrong outcome | 1 | 3,166 ms | Required rejection passed |

Normal entry emits all five exact witnesses:

~~~text
ARITHMETIC_UI_STORY precision=6 protected=5 nested=27:int money=1.5:float flag=True title=retained_text
ARITHMETIC_UI_DIVIDE 4.5/2=2.25/2=1.125:float continuation=0
ARITHMETIC_UI_TEXT first=2.0:float/12:int second=2.0:float/14:int current=True
ARITHMETIC_UI_IMAGE first=10/20 second=12/24:int bonus=3,2 ordered=True
ARITHMETIC_UI_VALUES inert=True text=True condition=True rendered_actions=True continuation=4
~~~

The six passive requests are followed by independently asserted runtime values:

~~~text
ARITHMETIC_UI_DISPATCH_REQUEST divide 4.5 5 0 built False refresh False True
ARITHMETIC_UI_DISPATCH_REQUEST divide 2.25 5 0 built False refresh False True
ARITHMETIC_UI_DISPATCH_REQUEST remainder 9.5 6 0 built False refresh False True
ARITHMETIC_UI_DISPATCH_REQUEST remainder 2.0 7 12 built False refresh False True
ARITHMETIC_UI_DISPATCH_REQUEST add 2.0 7 14 built False refresh False True
ARITHMETIC_UI_DISPATCH_REQUEST add 2.0 10 20 built False refresh False True
~~~

Wrong outcome reaches the captured Story's Arithmetic journey narration and
fails assert eval (trust == 26) timeout 1. The unchanged declarations/Story and
the normal Story trace establish trust 27 there. The negative traceback identifies
that narration and assertion; it does not separately dump the numeric value.
The negative child exits 1, reports FAILED, and never emits
ARITHMETIC_UI_WRONG_ACCEPTED. It records two passing setup assertions and one
deliberate failure. These are not additional positive cases. Both distinct normal
and negative children ran; duplicate inner selector listings and their bookkeeping
add no passes and excuse no missing case.

### Identity, independent audit and cleanup

The independent audit matches all 11 physical SDK starts to their completions and
identical command/cwd records. Seven are construction children, all with exit zero.
The remaining four match the selected cases and their complete outputs exactly.
No child timed out or truncated output. The raw JSON retains Windows OsString
arguments as UTF-16 code units; the audit decodes them for readable command arrays.

All 77 exported files, 11 accepted .rpy sources, four captured sources, the exact
image and installed driver match their manifests/portable inputs. Every case
reports accepted source unchanged. The native executable, official archive,
installed/staged SDK and toolchain component identities also match.

| Retained input or evidence | SHA-256 |
| --- | --- |
| Complete 895-input manifest | af7fb41e383c15a9a6004ed9ca4ff5b536e9484fc16374fe1d1d332f2675872d |
| Native retained executable | f0ee88c8f22d6cf57dc31c2ff5ccec16cfe90bcfc10c19c01039a6afba801f27 |
| Cargo artifact JSON | c05d91e42cdac137ee8ff3645098d3f33caf4cf993e9c327f411f26947af1268 |
| Official archive | eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45 |
| Published checksum manifest | 4b0cad9ac05dc4ca55081bd3a36458c8ea658ed021f09a87276383652b6bd98b |
| SDK renpy.py | 4f8f07333f03a5e2e2e8494cfccd487bbb0d3acc7e020282e014de7da8a0955d |
| SDK Windows python.exe | 7c220ddbc41821a2c15199449fed09c0717e928f1d31abf0af7011c211d153a0 |
| Portable manifest | 4a183d2be289d4f969767c209ec625849b971c99e319bb4810ba90de6f7f2e3c |
| Portable requests | 53a4235566ef276eb1a41eed468605dc411c78b2566aa4c93c6205267c0cbff2 |
| Driver | 2f18f568077462104d45fc385638d13b1133cbe22a7373479dd7107429408d89 |
| Captured variables | 2aa460421e11d481aa3f8710806866bbd3ac05103fb2b81ed1e828667ef332d1 |
| Captured screen | 6155c9e458efe38bb5e030062ed077212e58391e90d471f246fd1cfff3da8821 |
| Captured condition | c1fa1fd8e606d45e6ca823191ba77f56a2e137729d4a75f1762720fecb79a22c |
| Captured Story | 20d67a3c545d3ce33538d4518603a6a5c32eb25b68958db23625f2bad641c59c |
| Image asset | f036263d027b9a8258f4a48ce1a609bf20f9f94dfb7ea0ca22b0c95011f14771 |
| Runtime test owner | 21208f6894f1de0aa87ddb2538c54f4a644a02f4b6abd3fe90b8672f17c93e6a |
| SDK subprocess owner | 3c47c27751080a4cb172bdc559530c3de5bf1d6a715ce4ff1b170e34be9cfd43 |
| Physical SDK child JSONL | 0daf82d109b848141798c0e103a747003c6ca5f13f0c92e86de6043a83e28468 |
| Exported-file manifest | 5eacb18b82c6d7083978f8280a20d72728991cf77f9eded1c7629b547836b361 |
| Accepted-source manifest | 7f933ee80189c6ccbf7ecb6ad6c834c11fb8290301b63aa91cb3281994be1dcc |
| Final independent audit | a6b546026696b921f6925d695bf0734c7be120363e26e1b7b92fee69fb952292 |
| Complete 161-file raw evidence hash manifest | 8266fdefa4f7f9f2b31bb3f7e743062500fd9d966e69f0eb436afdbaa1f0cce9 |

The raw run directory retains independent-audit.json, audit-summary.json,
input-manifest.json, raw-hashes.json, native-toolchain-identities.json,
sdk-readiness.json, executed-sdk-identities.json, launch/build/desktop receipts,
both preflight logs/exports, all SDK child/case outputs and the retained executable.
Its first offline audit misread serialized Windows arguments and dispatch labels,
and counted its own inspection command as an owned process. A second audit
corrected those and exposed a POSIX-only traceback-path check. The final offline
audit normalizes that Windows path. Both earlier reports and scripts remain under
audit-01/ and audit-02/. No qualification input changed and no test or SDK
process was replayed for these audit corrections.

All 12 recorded test/SDK PIDs are gone. A separate process inspection finds no
owned executable or command under this run's scratch. No process was killed.
The owned SDK temporary root is absent; the empty short scratch was removed
nonrecursively. Terminal evidence is passed:true,cleanupComplete:true.
The prior 222 evidence files and registered checkout remain unchanged.

Actual cumulative usage is **Mac 12/20, Windows 4/20, zero reservations**.
This assignment consumed exactly one Windows feature invocation; the 11 physical
SDK children are separately recorded, not extra feature starts. No retry or source
correction occurred. This is source/runtime proof of unchanged rendered Button
actions dispatched by a fixture Timer. It adds no physical input, native-editor,
package, canvas-helper, browser or human proof. No manual CI or watch ran.
P4, #96/#110 scope, wider acceptance, coordinator audit/integration and PR #122
remain outside this assignment. The raw executable/evidence remain local ignored
artifacts; only this appended note is committed and published on the qualification
branch.
