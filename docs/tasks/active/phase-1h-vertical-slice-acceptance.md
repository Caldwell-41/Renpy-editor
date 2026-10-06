# Phase 1H — Integrated vertical-slice acceptance

**Updated:** 2026-10-07; Phase 1G accepted/integrated; execution selected by user.
**Planning:** revised by explicit September 25 user direction; documentation publication authorised.
**Execution state:** `awaiting_ci` (Goal runtime pause not claimed).
**Entry:** Phase 1G closure/integration complete through PR #17 at `295a189`; accepted Phase 1F retained, fresh refs and
explicit user selection of 1H. Planning publication/merge does not authorise execution.
**Parent:** [Phase 1 plan](phase-1-vertical-slice.md).
**Prerequisite contracts:** [1G brief](../archive/2026-10-06-phase-1g-branches-runtime-git.md), integrated 1F,
[TESTING](../../TESTING.md), [TRANSACTIONS](../../TRANSACTIONS.md), [UI](../../UI.md),
[SECURITY](../../SECURITY.md) and [WORKFLOW](../../WORKFLOW.md).

## 1. Purpose and preparation

Verify the implemented workflow from new project through real play, diagnostics and
restart, on Windows x64 and macOS ARM64. This is acceptance, not permission to
hide missing features in the test milestone. Assign demonstrated missing behaviour to
its owning milestone and return with a bounded correction request. Preserve failed
evidence; never weaken an assertion to close the phase.

Inspect actual integration and current implementation branch/PR before creating a
matching acceptance branch. Record the exact final candidate, supported toolchain/SDK
versions, package hashes, host details and operation ownership. Use fresh checkouts and
isolated synthetic projects, never personal game assets or private paths in artifacts.
Preserve the Phase 2 planning prerequisite; no Phase 2 implementation starts here.

Create or extend one deterministic representative mini-game and an expected-outcome
manifest. Reuse [existing fixture intent](../../fixtures/REPRESENTATIVE_GAME.md) and
prior regressions where suitable, but demonstrate authoring through real production
services/UI. Handwriting a finished fixture alone does not prove the authoring workflow.
The manifest fixes expected source/metadata, route outcomes, values, media identities,
history effects and revision/trust observations. Record asset provenance/licences.

Normal Run Game begins at standard entry. A synthetic automation driver may exercise
choices and record outcomes, but must run the authored source and assert observable
dialogue/state/assets; launch success, screenshots alone, labels and entity counts do
not prove route correctness. Keep any test instrumentation isolated from shipped games.

New Git status/diff/checkpoint acceptance is removed from H01/H08/H10/H11 and preserved
in [optional Git](optional-local-git.md). Existing init regression remains automated.
The implementing agent owns H01-H12 and the relevant ordinary conflict, failure and
recovery cases; the user does not reproduce them manually.
[ADR 0010](../../adr/0010-local-project-safety-and-observed-flow.md) removes deliberate
same-user hostile filesystem races from initial acceptance and defines last-observed
Branches. Existing historical tests/evidence remain; no specialist privilege setup
is required for phase closure. Human interaction rows alone follow
[TESTING ownership/reuse](../../TESTING.md#phase-1g-testing-ownership-and-cadence).

## 2. Required matrix — twelve IDs retained with Git scope revised

| ID | Scenario | Required observable evidence |
| --- | --- | --- |
| H01 | Create with pinned SDK and existing optional Git init | Successful staged creation with/without optional init (regression only); normal menu, save/load, preferences and history/rollback remain functional; failure does not expose a half-created project |
| H02 | Supporting authoring | Two Characters and Appearances, copied backgrounds/character images/music/SFX, bool/int/string definitions including an exact integer beyond JavaScript safe-integer precision; source, reload and runtime preserve intended values |
| H03 | Multiple Chapters/Scenes and Beats | Dialogue/narration, background/staging, appearance, Left/Centre/Right, supported transitions, music play/stop, SFX and assignments produce intended source and runtime state/assets |
| H04 | Unconditional Choice and two destinations | Both routes execute from normal entry to distinct expected outcomes; Choice/Jump/Return and common Scene/Source/Branches semantic edges agree; tree order does not change flow |
| H05 | Reorder/edit/history | Repeated undo/redo returns expected source, metadata, all projections and committed revisions; failed inverses/external boundaries do not overwrite newer bytes |
| H06 | Compiled Scene lifecycle | Compile, then safely move/delete a disposable Scene; incoming/unknown-reference policy, inverse operations and close/reopen hold; no orphan `.rpyc` or duplicate-label execution |
| H07 | Source and partial/external content | Supported edits synchronise Scene/Branches; opaque/incomplete/unmapped content stays exact; drafts, stale/partial state, safe Apply Both and refused overlap remain truthful; selection never guesses |
| H08 | Diagnostics and play | Real compile/lint failures navigate safely; explicit trust and normal Run/Stop work; supported script editing/saving retains input and shows truthful launch-revision status; asset mutations require Stop |
| H09 | Restart and metadata independence | Close/reopen and continue editing with valid selection and durable accepted content; a copy runs without `.renpy-editor/`; editor reconstruction without metadata remains out of scope |
| H10 | Interrupted mixed transactions and recovery | Retain accepted and competing external bytes; inspect blocked state without executing project; explicitly resolve safe cases and continue; ambiguity remains blocked without deleting evidence |
| H11 | Session and completion races | Failed switch preserves current project; old-session requests, delayed/reordered success/error, cancelled import and rapid navigation cause no wrong-session write, obsolete selection or false Saved state |
| H12 | Bounds, discovery and sustained use | Metadata/resource limits and precision, discovery/case collisions and long terminal history preserve reloadability; successful authoring continues beyond the former journal-count boundary |

For each row record scenario/test name, exact expected/actual observations, command,
candidate, target, outcome and evidence location. A skip or unavailable target remains
open. Prior human evidence may cover unchanged interactions under the narrow policy in
TESTING; automated integrated workflow evidence must still cover the final candidate.
No general cross-SHA automated gate waiver is introduced.

## 3. Additional integration cases from the planning review

| Area | Required cases | Parent mapping |
| --- | --- | --- |
| Graph | Missing versus unknown targets with proven absence, incomplete/ambiguous label inventory, partial Choice, duplicate option text, self-loop, reconvergence, source navigation both directions, stale selection after deletion, declared size limit | H04, H07, H11, H12 |
| Draft preparation | Source Save All, explicit existing Scene Commit, use saved revision with form/draft retained, Cancel, refusal starts zero processes, dirty Source remains Pending validation | H07, H08, H11 |
| Trust | Untrusted open/preview/import/typing has zero SDK launch; reject stale grant after root/SDK or relevant executable change; revocation and copied-UUID rejection | H08, H11 |
| Runtime | Play beyond smoke timeout, script editing/saving and launch-revision status, asset mutation/inverse refusal with no writes and retry after Stop, launch-versus-import race, no silent autoreload, targeted move/delete/inverse block, Stop-and-switch/Cancel, controlled game failure and descendants retaining pipes | H06, H08, H11 |
| Diagnostics | Multiline SDK failures, Unicode/spaces/BOM/newlines, absent location, deleted/out-of-scope file, stale revision, inert output, bounds/truncation and empty parsed list after failure | H07, H08, H11 |

Use non-crashing fault/state fixtures through real recovery services for H10, retaining
accepted/displaced bytes, blocked ambiguity, safe resolution and follow-up writes.
Deliberate application/transaction crash and timed namespace experiments are specialist
history under WORKFLOW, not routine H01-H12 gates. Controlled runtime nonzero exit,
ordinary Ren'Py errors and Stop/descendant cleanup remain required; see the
[selector disposition](../archive/2026-10-06-testing-policy-alignment.md#selector-disposition).
UI stubs alone cannot prove disk recovery, process cleanup or native keyboard delivery.

## 4. Cross-cutting release-of-phase gates

- Golden-source no-op/minimal patches, exact Unicode/BOM/newlines, custom code and
  metadata unknown-field preservation remain intact.
- Transaction/recovery and single-instance boundaries, safe media presentation,
  ordinary path/unsupported-link refusal, narrow IPC and packaged unauthorised-WebView
  probes pass with no new privilege/CSP exceptions.
- Review real rendered Scene/Source/Branches and supporting Runtime/Diagnostics
  surfaces on both platforms against Quiet Studio Dark. Check keyboard-only operation,
  native Ctrl/Cmd shortcuts, accessible names, focus restoration, reduced motion,
  display scaling and narrow-window resize; no overlap/overflow or unreadable controls.
  Automate semantics/focus/resize/reduced-motion assertions and review rendered output
  as the agent. Reuse applicable end-of-1G native human evidence under TESTING; request
  only a specific changed or previously uncovered interaction if needed. Record manual
  assistive-technology limitations without claiming a screen-reader pass or adding an
  unplanned exhaustive human accessibility matrix.
- Bounded graph/diff/output work remains responsive; synthetic graph-spike numbers
  do not establish production scale. Test declared limits and refusal behaviour.
- Privacy/secret scan and dependency/licence inventory finish successfully after
  packaged tests; a smoke checkpoint without terminal reporting is not acceptance.
  Keep logs synthetic/redacted and record evidence retention before artifacts expire.

Signing/notarisation, broad release distribution, mature graph scaling and Phase 2+
remain outside this acceptance. Report those limitations without misclassifying a
missing Phase 1 capability as deferred release work.

## 5. Execution, evidence and stop conditions

Start with the repository validator and cheap targeted tests. Follow current
[TESTING](../../TESTING.md) commands and the existing supported-target workflow.
Do not dispatch a packaging matrix for planning changes. During actual acceptance,
use one complete final matrix per changed candidate; do not rerun unchanged expensive
gates or use model polling. Capture run ID, attempt, SHA and remaining jobs before an
awaiting-CI/manual-resume handoff. Failed/skipped/cancelled are distinct from passed.
The production and quality flow-selector migration is complete; retain the exclusions
and ordinary coverage recorded in TEST-AUDIT-1. A future integrated-tree assessment selects
affected/required gates; it does not automatically repeat an equivalent matrix on merge
or claim unimplemented cross-SHA evidence reuse.

Partition scenarios so each reports its stage, monotonic timing, actual failure and
cleanup outcome; preserve a reliable final report even when an earlier assertion fails.
No one giant opaque smoke or timeout increase to mask a reporting defect. Fast DOM/
browser tests are useful but never replace the two native packaged targets.

Before closure produce an evidence matrix for H01–H12 and sections 3–4, including exact
commands/counts, manual checks, failures and limits. If any required behaviour fails,
1H is `blocked` with its owning correction identified. Fixing a harness cannot turn a
missing product behaviour into success. A changed candidate needs applicable renewed
evidence, with no invented cross-SHA equivalence claim.

Update this ledger and the one live HANDOVER/CURRENT at execution handoff; retain the
actual implementation/acceptance branch, PR and exact outstanding operation. Stop at
`review_ready` for independent user review. Phase 1 acceptance, merge and transition to
Phase 2 are separate decisions. On authorised integration, verify main, consolidate
canonical lessons and archive completed plans while preserving unique failed evidence.

## 6. Historical September 22 planning publication record

This historical record is superseded for Git scope and test ownership by the September
25 decision. CURRENT/HANDOVER own the active documentation branch and actual status.

This brief and the [1G planning record](../archive/2026-10-06-phase-1g-branches-runtime-git.md#10-planning-coverage-and-review-record)
form one documentation checkpoint on `docs/phase-1g-1h-planning`. All acceptance rows
are planned and unexecuted. Active 1F CURRENT/HANDOVER and correction evidence remain
owned by PR #14; no replacement handover or application change is introduced here.
The next permitted action for this PR is documentation review. Starting 1G.1 requires
integrated/accepted 1F and a user-selected goal; starting 1H requires integrated 1G.

## 7. Execution ledger — 2026-10-07

**Selected outcome:** the user authorised H01–H12 and applicable sections 3–4 to
`review_ready`, including fixtures/harnesses, focused checks, bounded corrections,
publication and supported-target qualification. No merge, Phase 1 closure, Phase 2,
optional Git development or signing/notarisation. Codex is native macOS ARM64;
Windows x64 evidence will use the existing supported-target production workflow.

**Ownership:** clean main fast-forwarded from `b594712` to fresh
`42ca6f9934fd98ddf2dbd80aa80c75a61e0cd0ae`; no matching branch/PR or pending run existed.
Created `acceptance/phase-1h-vertical-slice`. The separate planning worktree remains
`2c5a164`, ahead two unpublished commits, and was not modified/published. Other open
PRs and refs are untouched. Draft PR #18 and the one confirmed final matrix are below.

### Representative game and selected gates

`tests/fixtures/phase-1h/expected.json` fixes exact Scene source templates (only
technical labels normalize to logical names), route dialogue, Boolean/string/int64
outcomes and original PNG/PCM WAV hashes. The test-only lifecycle builder uses staged
creation without Git, real Character/Variable/import IPC, production Scene commands,
transactional Source saving, repeated history, real media presentation and reopening.
Default `trust = 9007199254740993` and assigned int64 extrema remain decimal strings
on the editor wire and exact integers in source/runtime. Two routes reconverge; tree
ordering does not change entry/edges. Asset provenance/licence is in the fixture README.
Testcases are injected only into disposable games; shipped runtime/UI behavior is
unchanged. They use standard Start/Choice/dialogue, not route jumps or replaced screens.

The existing `production-scaffold.yml` gains one exact ignored SDK gate and retained
case outputs. Its routine core selectors, enforced observed-flow fixture, two archive
lifecycle gates, runtime service/diagnostic gates, six packaged UI cases, denial and
single-instance probes, browsers, privacy and dependency inventory remain required.
No specialist termination/namespace experiments are selected. Exact candidate/source
input recording includes the acceptance fixture inputs. Q1 guards continue to reject
missing/zero/ignored/failed required Cargo results and incomplete packaged cleanup.

| ID | Concrete expected observations and selected proof | Current evidence |
| --- | --- | --- |
| H01 | New authored game uses pinned verified SDK/no Git; prior `official_sdk_phase_1c_target_gate` proves existing optional init; new SDK driver checks normal menus, save/load/history/rollback and creation-failure ordinary regression remains selected | Local staged no-Git creation Pass; normal menus/save/load/history/rollback Pass; final both-target evidence open |
| H02 | Two Characters/Appearances, 3 original backgrounds, 2 character images, music/SFX; copied hashes and preview match; exact large default and int64 assignments reload/run | Local authoring/import/hash/golden/reopen Pass; actual route values/media Pass on local Mac; final both targets open |
| H03 | Fixed golden source for dialogue/narration/background/show/appearance/placements/transitions/audio/assignments; SDK asserts state/showing/bounds/playing and stop/hide | Local golden-source Pass; local Mac runtime assertions Pass; final both targets open |
| H04 | Standard entry chooses two distinct manifested outcomes, two resolved Choice edges/two reconvergent Jumps/Return, editorial Chapter move leaves flow unchanged | Local production flow/source Pass; local Mac routes/reconvergence/Return Pass; final both targets open |
| H05 | Three undo/redo cycles recover exact bytes; projections/revisions/IDs survive reopen; external/inverse rejecting regressions remain selected | Local fixture history/reopen Pass; both-target broad history regressions open |
| H06 | Real compile produces disposable `.rpyc`; move removes old source/cache, Undo restores exact bytes/cache; delete/inverse/reopen and incoming-reference refusal | Local real compile/lifecycle Pass; final candidate both targets open |
| H07 | Source/Scene mapping, exact opaque neighbours, BOM/CRLF/Unicode, retained drafts, explicit Apply Both/nonoverlap and overlap refusal, truthful partial/stale/navigation | Local custom Source/reopen Pass; existing Source/core/browser/package regressions selected, target evidence open |
| H08 | Explicit trust and real compile/lint, diagnostics safe navigation, normal Run/Stop, saved edit/launch staleness, no autoreload and asset no-write refusal/retry | Local real compile/lint Pass; existing runtime service/diagnostic and packaged cases selected, target evidence open |
| H09 | Durable accepted source/projections/valid selection after close/reopen; copied game executes same route without `.renpy-editor` | Local reopen Pass; metadata-free riverside SDK case Pass on local Mac; final both targets open |
| H10 | Non-crashing mixed recovery retains accepted/external/displaced bytes, blocked inspection, safe explicit resolutions/follow-up and ambiguity refusal | Existing named routine transaction/recovery gates selected; final target evidence open |
| H11 | Failed switch preserves project; old-session/delayed/cancelled completion, draft/import/runtime contention and rapid navigation cannot write wrong session or claim false Saved | Existing real dispatch/service and frontend/native gates selected; copied-UUID consent and zero-process untrusted inspection Pass on local Mac; target evidence open |
| H12 | Document/resource/precision/discovery limits refuse without loss; actual Character/Chapter authoring succeeds after 4,097 terminal records and reopens | New exact native Mac long-history test Pass (1/1, no skip, 77.70s); target suite/resource gates open |

Section 3 mapping: graph inventory/partial/missing/unknown/duplicate/self-loop/limits use
`scene::tests::flow_*`, Source navigation and the fixed reconvergent fixture; preparation
uses real runtime SDK and frontend preparation handlers; trust uses stale SDK/input,
revocation/session tests plus the new untrusted/copy cases; runtime uses real process
Stop/descendants, saved editing, no-reload, move/delete/import/history refusal tests;
diagnostics use the SDK Unicode/BOM/CRLF cases and bounded diagnostic parser/navigation
regressions. Final evidence must confirm these actual named tests/cases, not just totals.

Section 4 remains open until final target results: source/metadata preservation and
recovery/path/IPC gates; package WebView denial/single-instance; both native/rendered
surfaces; production declared limits and three enforced flow samples; terminal privacy
and licence/dependency inventory and retained artifacts. Mac Chrome timing remains an
explicit diagnostic under TESTING, not a fabricated pass. Signing/notarisation and
manual assistive-technology limits remain. Required cases are never waived by prior
1G green statuses.

**Human reuse assessment:** changes are test-only Rust modules/helpers, synthetic
assets/manifests, workflow/evidence recording and docs. No Scene/Source/Branches UI,
Save/native-input dispatch, runtime product behavior, CSS, IPC authority, dependency or
packaging change. Final diff verification confirms these boundaries. The mapped 1G native human cases
remain reusable under TESTING: navigation/input/focus, native shortcuts, resize/scaling,
Run/Stop/save-staleness/reopen, diagnostic navigation, picker/import/progress and
cancellation. Original packages keep their own identities; automated gates execute
this acceptance candidate. No repeated broad user session is requested.

### Local development failures and cumulative problem record

**H-FIXTURE-1:** first execution of the new fixture/oracle; classification currently
harness/environment, no demonstrated product defect. Preserve every failed attempt;
corrections do not turn those attempts into passes.

| Attempt | Observation / classification | Smallest correction or next discriminant |
| --- | --- | --- |
| 1 | SDK creation failed writing normal-profile `upgraded.txt`; sandbox/profile isolation omission | Supported portable `Ren'Py Data` above disposable SDK; subsequent creation passed |
| 2 | Source Save refused edits in mapped Variable definition file (`MAPPED_DEFINITION`); harness violated existing contract | Keep definitions in authoring workspace; custom Source content goes in unmapped transforms file |
| 3 | All authoring/reopen/compile/lint passed; route processes had no display under sandbox | Same isolated fixture with native display access; no headless substitute or product change |
| 4 | Real compiled move/delete reached incoming-target refusal, but harness expected wrong error enum | Expect exact existing `ReferenceBlocked`; subsequent lifecycle passed |
| 5 | First dialogue asserted while transition was still executing; both SDK cases failed and debug screen stayed open until unchanged 60s deadline | Await visible conditions explicitly and add failure teardown; preserve both timeout reports |
| 6 | Added teardown hook placed outside an SDK testsuite; real compile rejected it | Wrap driver in a named SDK testsuite; use its exact qualified case selector |
| 7 | Copied project changed folder basename while retaining metadata folder name; open correctly refused `InvalidMetadata` | Copy under another parent with the same basename; no relaxed metadata validation |
| 8 | Copied Run preparation lacked reviewed runtime helper and correctly refused `RUNTIME_POLICY_REQUIRED` | Use Validate preparation for shared execution-consent rejection; existing Run policy gates remain selected |
| 9 | Seven initial dialogue/state/image/audio assertions passed; in-game menu action was incorrectly named Preferences | Use actual pinned SDK quick-menu label Prefs; wrong-outcome control rejected as intended |
| 10 | Menu/save/load/history and route state/media passed; single dialogue click did not reach reconvergence | Investigate Screenshot interaction restart and dialogue completion; retain exact station/rollback assertions |
| 11 | Direct capture did not fix the same advance failure; screenshot-restart hypothesis disproved | Reassess using SDK Advance control, which handles completion over render frames; no third repetition of single-dismiss hypothesis |
| 12 | Advance reached station; immediate stop/hide assertion raced queued effects | Explicit 10s condition waits for assertions, unchanged 60s process deadline; capture actual dialogue/state/media and fresh rendered frame |
| 13 | All four independent cases and cleanup passed; 28/28 assertions per positive case, intentional wrong integer rejected | Complete local native development proof; final Windows/macOS candidate qualification remains open |

Attempt 13: native macOS 26.6.2 ARM64, SDK 8.5.3.26051504/Python 3.12.8,
1/1 Cargo test Pass/no skip, 67.66s. Independent rooftop/riverside/metadata-free
cases exit 0 at 8,252/8,240/8,208 ms; wrong-outcome exits 1 at 2,646 ms on exact
`trust == 1`, with no timeout. All temporary editor/game/save/token/SDK state removed.
Observed entry: dialogue matches, trust `9007199254740993`, false/unset, Alex bounds
`[608,656,64,64]`, exact music/SFX paths. Rooftop observes expected dialogue,
true/`9223372036854775807`/rooftop and `[1216,656,64,64]`; riverside (both copies)
false/`-9223372036854775808`/riverside and `[0,656,64,64]`. Actual background/character
showing flags true. Rendered screenshots show expected dialogue and tiny original
swatches; surrounding checkerboard reflects the deliberate 64px fixture size.
Evidence: ignored `integrated-authoring-local.log`, `cases-attempt-13/` JSON/logs/PNGs;
manifest SHA-256 `d879020258615d45af4456420d9cac1e6b05d56f40417a8d9cfce2adb910c638`.
Self-review found screenshots from earlier cases being exported under later case names;
export now retains only each positive case's own route capture, none for rejecting
control. Attempt 13's original exports are retained unchanged; final workflow will
verify corrected attribution. No runtime/assertion changes after this local pass.

13 local integrated SDK gate invocations; measured bounded adapter spawns total 84
across attempts 6–13 (8/8/8/12/12/12/12/12). Earlier uninstrumented launches and
runtime-service child compile/lint processes are not included or fabricated. Final
production matrix allowance is now consumed by run 37515083319/1; no retry authorised.
Failures/logs are ignored under `.toolchains/reports/phase-1h/`; no private paths/logs,
SDKs or build output enter Git. All correction hypotheses are recorded rather than
silently restarting a budget. One production dispatch/no retry; zero local desktop builds or editor
launches. Pending CI target builds/starts are not yet counted as completed; SDK test-process/adapter counts are reported where instrumented,
and earlier absent counters are not invented. The 1G historical counters remain intact.

Cheap checks so far: validator 352 files; Q1 rejection/selector audit Pass; retention
9/9; frontend 91/91/no skips; Rust compilation/formatting; whitespace; actionlint 1.7.12
workflow validation Pass. New asset-manifest test 1/1, long-history test 1/1 and SDK-result rejection guard 1/1 Pass.
Focused SDK invocations use:
`cargo test -p loomlight-core --release --locked renpy::tests::phase1h::phase1h_integrated_authoring_sdk_gate -- --ignored --exact --nocapture`
with official archive, disposable profiles/portable token root and native display access.
These are development observations, not yet final coherent-candidate package proof.

### Published candidate and manual same-thread wait

Draft [PR #18](https://github.com/Caldwell-41/Renpy-editor/pull/18), branch
`acceptance/phase-1h-vertical-slice`, candidate
**`3d484ef1b0164e15b21c869f7494410daa3fed9d`**, published/remote identity verified.
Exactly one `production-scaffold.yml` dispatch accepted at 2026-10-06 18:55:50 UTC:
[**37515083319/1**](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37515083319),
`workflow_dispatch`, exact candidate above, `upload_packages=true`. Last observed
2026-10-06 18:56 UTC: `in_progress`; Preflight job **112445822829** running frontend
validation, repository/Q1/selector steps already passed. Windows x64 and macOS ARM64
jobs await successful Preflight; no target result claimed. Case/log/input/failure and
requested package artifacts retain the existing seven-day retention; audit/download
terminal evidence before expiry. Dispatch acceptance is confirmed, never repeat it.
Ordinary PR quality [37515065625/1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37515065625)
on the same SHA: actual repository/Q1 rejection/selector steps Pass; unselected flow
profile and browser diagnostic jobs skipped. No separate quality matrix dispatched.

This docs-only wait publication changes no tested app/workflow/fixture inputs. The
production run tests `3d484ef` and does not retroactively execute its documentation
follow-up SHA. No second package matrix is justified for this wait record.

Remaining: on user resume in the SAME Goal/chat, inspect this exact run/attempt once.
If still pending, wait again without a loop or duplicate dispatch. If terminal, audit
actual named required core/SDK/diagnostic tests, four integrated case reports and three
correctly attributed captures per host, six packaged UI case reports/cleanup, compiled
lifecycle, observed-flow samples/bounds, browsers, denial/single-instance, privacy,
licences/inventory, exact manifests/package hashes and H01–H12/sections 3–4. Fill final
expected/actual/target/identity matrix and self-review before `review_ready`; failures,
skips and missing artifacts stay open. No new retry, feature scope or merge on resume.

Model polling stops here. Goal remains active until a supported user pause action;
repository `awaiting_ci` is not a verified runtime pause. Official app documentation
places Pause/Resume in the Goal progress row above the composer; direct installed-app
UI inspection was unavailable, so no UI action or changed lifecycle state is claimed.
Use that client control and later resume this chat with: `The workflow is complete;
audit run 37515083319/1 and continue the existing goal.`
