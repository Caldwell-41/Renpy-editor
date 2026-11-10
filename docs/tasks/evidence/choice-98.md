# Choice #98 delivery

## Selection and ownership

Kris selected [#98](https://github.com/Caldwell-41/Renpy-editor/issues/98)
with the implement-spec workflow and instructed the agent to start building on
2026-11-10. The spec owns requirements; #101–#106 own bounded acceptance.
Delivery is `in_progress`. #101 is integrated with public-controller, both-target
SDK and automatic CI evidence. Its implementation dependency is satisfied on the
integration branch; final review, native/human evidence and issue closure remain
part of the combined delivery. #102 is integrated with both-target SDK and
automatic CI evidence. #103 prompts are integrated with Mac SDK evidence;
Windows qualification is pending. #104 is the next local implementation.

Integration branch `codex/choice-98` starts at accepted integration
`63221b44d72c1c100815e9e638cbec5133ffc1eb` from
`codex/phase3b-screen-designer`. The coordinator owns this branch, live status,
sequencing and combined evidence. Each implementer owns one ticket's production
code, affected tests and canonical technical contracts in a managed isolated
worktree. A merger receives integration ownership explicitly. Workers leave
CURRENT, HANDOVER and this file to the coordinator.

The completed first assignment #101 established the Choice/option model, mapping,
body operations and production controls. #102 delivered recursive source/body/Call
contracts, their production Story controls and affected tests. #103 added
Choice-owned narration/Character prompts through the same owners. #104 becomes
the next sole writer of mixed Hide/Show disabled semantics through existing source,
runtime and generated-choice-screen owners. The coordinator assigns Windows #103
after publication. #104 depends on qualified #101, so the two assignments may run
concurrently on separate hosts.
#105/#106 still wait for all Stage 1 requirements.

## Dependencies and approved design

GitHub native blockers were checked at entry:

- #101 depends on closed design handoff #99 and is ready.
- #102, #103 and #104 depend on #101.
- #105 and #106 each depend on #102, #103 and #104, independently of each other.

Use Story Combined v1, `story-revamp` / `combined`, revision `combined-v1`,
pinned in [the approval record](../../design/story-revamp/approval.json).
[Choice controls](../../design/story-revamp/README.md#post-delivery-revision)
guide this feature in the current editor. The full workspace and palette remain
with #110. Material uncovered design decisions require a preview and Kris's
approval before production edits. Kris authorized separate design chats named
`Choice Spec - {description}` for that iteration and approval handoff.

## Verification and operation limits

Use the spec's selected public app-controller/core-command boundaries for source,
history, reopen, exact patches and draft/conflict refusal. Apply TDD one behavior
at a time. Inspect affected consumers before changing shared models. Lab evidence
establishes design only.

Development is on macOS ARM64. Affected runtime behavior requires macOS ARM64 and
Windows x64 qualification under host routing. SUNDOWN has now qualified #101 in
the approved managed worktree; its producing-host report owns toolchain details.

SDK qualification for the entire #98 outcome is capped at 20 harness invocations
per host, including failed or cancelled starts. One invocation may launch compile,
lint and named normal-play children; retain each child's result without charging
them again as harness starts. This allows focused coverage across six tickets and
bounded corrections. #101 had a four-start allowance per host after offline
preflight and pinned-SDK verification; it used three Mac and two Windows starts.
Current usage is Mac 8/20, Windows 3/20, zero reservations. #102 used 2/4 Mac
starts and 1/4 Windows starts. #103 used 3/4 Mac starts, including two failed
selector attempts; its final run passed all 31 expected SDK children.

For the next coordinator assignments, #104 may use at most four Mac harness starts
from confirmed Mac 8/20. A fresh #103 Windows test assignment may use at most four
starts from confirmed Windows 3/20. Both require offline fixture, host/toolchain
and pinned-SDK preflight. Windows may reuse the existing T3-prepared
`codex/choice-101-windows` worktree only after clean/idle ownership checks and safe
fast-forward synchronization. Do not create a new checkout or change the protected
registered root. Separate hosts/interfaces permit #103 Windows testing alongside
local #104 implementation. The coordinator owns dispatch and shared counters.

Native editor/package and manual CI campaigns need recorded selection and limits
before starting; none has started. Routine compilation, focused tests, review and
automatic PR checks need no numerical allowance. Historical arithmetic and
protected native-session limits remain separate and unchanged.

## Next action

Entry records passed `python3 scripts/validate.py` for 1,883 repository files and
`git diff --check`. At entry, CURRENT was 317 words and HANDOVER was 901 words;
both were within their maintenance targets. No product tests or runtime operations
ran at entry.

The fresh merger integrated #101 in normal merge
`c9055fb673214365271f6ec557c92c00ce7b5f8b`. The coordinator resumes sole ownership
of `codex/choice-98` and live status on the merger's return. Draft PR #125 is open.
Automatic CI and Windows qualification passed for corrected candidate `3a672e96`.
The fresh #103 merger integrated `5fc50284` in `8e8d2f5c`; the detailed
[return below](#103-integration-and-handoff) owns this checkpoint. #102 Windows and
automatic CI passed on `2ed83dbc`. The coordinator resumes integration ownership,
publishes this checkpoint on PR #125, then assigns Windows #103 and local #104.
#31/#55 remain open, unselected styling/template tasks. #98/#104 own the per-option
and runtime feature; #104 must trace and reuse the minimal semantic owners without
taking over their style/canvas work or changing their prerequisites or acceptance.
They are not an additional blocker for the selected #104 assignment.
Retain the #101–#103 worktrees and unique evidence. Tickets stay open for combined
PR review and closure.

The initial draft PR checkpoint selects automatic Repository quality only in
`.github/validation-plan.json`, targeting `codex/phase3b-screen-designer`.
Connected-host Windows SDK qualification is a separate requirement,
and the whole spec's final automated/native qualification selection still needs
completion before review readiness. A green draft checkpoint cannot establish
#98 acceptance. SUNDOWN has a registered Loomlight project; its test assignment
must verify actual OS, toolchains, ownership and candidate before execution.

## #101 implementation return

The worker delivered ordered option bodies, stable mapped Choice/option identities,
legacy source-map refinement to schema 9, shared continuation, explicit body
commands/history, flow inspection and production Story controls. Approved lab
source and coordinator records were untouched. Nested bodies/Calls, prompts,
locked options, Repeat and picked-state behavior remain later tickets.

Worker checks passed 107 Scene, 16 Source and five metadata tests, targeted
identity/migration tests, the production UI-to-core journey, browser route fixture,
frontend typecheck/build, formatting and repository validation. The Scene group
retained seven explicitly ignored specialist cases. The frontend suite reported
391 passes and one environment failure: its existing Windows Studio validator
could not import `tomllib` with the selected Python. No skip or installation was
added. The targeted resolution below preserves that original full-suite result.

Mac SDK use is three harness starts. Start 1 reached shared continuation but its
driver timed out at game end; start 2 exposed an invalid post-game store assertion.
Both are retained harness failures. Start 3 passed all 14 named children, covering
compile/lint, Yes/No convergence once, Jump, callerless Return, caller resumption
and a deliberately wrong outcome rejected at the expected assertion. Every run
reported owned scratch cleanup complete. SDK 8.5.3 archive SHA-256 was verified as
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`.
The SDK-qualified source candidate was `a64b4bb1`; subsequent fixes affected editor
targeting, inspection labels and the negative oracle without changing generated
game source. The latest UI-to-core journey used the reviewed final Rust/UI code.

Detailed commands, red/green logs, authored receipts and per-child SDK results
remain in the worker's temporary `choice101-handoff.md`, `choice101-controller-07`
and `choice101-sdk-01` through `choice101-sdk-03` artifacts. Preserve them for the
target handoff and final audit. Windows x64 qualification, matching native/human
evidence and combined review remain pending. #101 is implemented, not accepted or
closed. No code was pushed and no PR was opened by the worker.

## #101 integration result

The fresh merger inspected the clean integration checkout at
`d91d9bea043048a45b192cc8baf171ed68179368` and worker
`070365fac417edba137c57841708574cd6ddbeb2`. Their common base was `15e90f2c`.
The integration-only changes were the three coordinator status/evidence files.
Normal merge `c9055fb673214365271f6ec557c92c00ce7b5f8b` completed without conflicts
or implementation edits. Source/body/mapping, completion/flow, Story controls,
caller migrations and fixture changes showed no material integration defect.
This bounded inspection does not establish feature acceptance or visual fidelity.

The merged `app` tree is exactly the worker's
`c78205212d927e3bf86e1680ebaee3a88ccfe30f`; the `tests` tree is exactly
`3c1c6cd689ede5c361c1cd9101f2e7fa5f013cb3`. The only worker-to-integration
differences are CURRENT, HANDOVER and this record. Approved lab/design source is
unchanged. Worker checks therefore apply to the same implementation inputs;
this documentation successor adds no new product-test candidate.

Integration checks passed `python3 scripts/validate.py` for 1,887 repository files
and `git diff --check`. No combined implementation change required another product
test campaign. The coordinator found an existing complete Python 3.12.16 with
`tomllib`. With the existing locked Node toolchain, the merger ran
`HARNESS_PYTHON=<existing-python-3.12> node --test dist-tests/tests/windows-studio-probe.dom.test.js`
in the retained worker's `app` directory using its existing compiled tests. All
eight tests passed, with zero failures or skips. `choice101-merge-windows-studio.log`
retains the result. This resolves the known interpreter failure at that file's
boundary; the original full-suite run remains 391 passes and one failure and was
not repeated. No install, source edit or test exemption was needed.

Read-only comparison of SDK 3's frozen authored receipt with final
`choice101-controller-07` found only fresh fixture entry/target UUID labels.
Replacing those exact labels made every runtime source value equal. The current
driver hash equals SDK 3's recorded driver hash. Its retained wrong-outcome child
also satisfies the strengthened validator's exact failing-assertion check.
`choice101-merge-checks.json` retains this comparison. SDK proof remains bound to
`a64b4bb1` and its frozen fixture; it is reused only for those unchanged runtime
semantics. No SDK, browser, native, package or CI operation ran in this merge pass.
Usage stays Mac 3/20, Windows 0/20, zero reservations. Windows qualification,
matching native/human evidence, draft publication, remaining tickets and combined
review remain coordinator-owned. Worker artifacts remain retained.

## Draft publication and Windows assignment

[Draft PR #125](https://github.com/Caldwell-41/Renpy-editor/pull/125) targets
`codex/phase3b-screen-designer` from `codex/choice-98`. Initial published candidate
is `d2504a76fc1fc10e009853bde3c2747c3460cef8`, containing the #101 merge and
automatic draft-check selection. Automatic approval review initially rejected
publication for unclear authority and an unverified remote. Read-only checks
verified the exact selected public repository and ADMIN permission, alongside the
invoked implement-spec workflow's draft-PR instruction. The reviewed retry and
draft creation succeeded; no alternative publication route was used.

A fresh test-only Windows assignment was requested in an isolated managed worktree.
T3 refused linked-delegate worktree isolation before creating a task. A narrower
read-only assignment used the registered checkout for host/toolchain preflight.
Its intended qualification scope was the existing production Choice
controller journey and pinned SDK compile/lint/normal-play checks for #101, plus
producing-host evidence. It may use at most four Windows harness starts from the
shared 20, after offline preflight. No source edit, package/native editor, manual
CI, push, issue closure or protected-session change is assigned. Return exact
tested SHA, commands, individual results, counts and cleanup. Coordinator owns
live records and correction assignments. Usage before dispatch is Mac 3/20,
Windows 0/20, zero reservations.

## Windows preflight and CI consumer correction

The read-only SUNDOWN task found a clean registered checkout on
`codex/phase3b-screen-designer` at `251fb47754a0ec1a43ece8763a0b4603b8e54dd8`.
Published candidate `ed1c5bdc` was absent, both material tree hashes differed and
the Choice tools were absent. It changed no files or refs and started no build,
fixture or SDK. The Windows SDK result remains missing, not failed or passed.
Host/toolchain findings were Windows x64 25H2 build 26200.9711, Rust/Cargo 1.90.0,
native MSVC 19.50.35726, npm 11.9.0 and Python 3.12.14. The exposed Node was
24.22.1; the required existing Node 24.19.0 still needs locating. The official SDK
archive freshly matched the recorded pin. The unrelated arithmetic worktree's Git
ownership refusal was preserved. Producing-host `choice-98-readiness-20261110T170700`
retains `report.md` and raw inventories. Usage remains Mac 3/20, Windows 0/20.

Kris explicitly approved a new Windows test chat after the linked-delegate
isolation limitation. T3's thread workspace strategy can prepare that isolated
checkout from the corrected published PR head. The assignment retains the same
four-start Windows ceiling and no source-edit/native-editor/package authority.

Automatic Repository quality run `42772268436`, head `ed1c5bdc`, failed in two
stale consumers: the Help export asserted schema 8 while the source map was 9,
and Story controller cases expected the old `Return / End` label. This is a
harness-contract migration failure. Both were reproduced locally before edits.
The caller search also found schema-8 assumptions in current screen qualification
exporters/admission code and an old Return inspection label.

The correction reports the actual/current schema in exporters, admits known
versions 8/9 with receipt/map agreement, retains exact hashes/source/identity and
matrix checks, and migrates the Story expectations and remaining inspection label
to caller/main-menu wording. A focused admission test first rejected version 9;
it now admits coherent 8/9 receipts and rejects a version mismatch or unknown 10.
Historical schema-7-specific workflows and old evidence remain unchanged.

Focused results passed the exact base Help, nested and sample public-core export
tests and their actual schema-9 Python admission checks. Shared `cargo-log`
accepted all three positive named Rust results. Seven base Help, nine Help dialog,
six ordered-action and ten screen-control offline admission tests passed. The
existing full Story controller journey passed all ten cases with two normal
driver exits and complete fixture cleanup. Formatting, repository validation
(1,887 files) and whitespace checks passed. Existing Python 3.12 and retained
Pillow dependencies were used without installation. An initial missing-Pillow
import and mistyped zero-test sample selector are retained setup failures, not
passes; the corrected sample selector executed its named test successfully.

Temporary `choice98-schema-*`, `choice98-admission-*`, `choice98-story-*`, nested/
sample exports and admission logs retain the red/green results. These corrections
change evidence consumers and an inspection label, not generated Choice source;
no SDK/native/package/manual-CI operation was repeated. The corrected publication
needs new automatic CI. Windows runtime, native/human, later tickets and combined
review remain pending.

## Windows qualification and #102 entry

The coordinator read the completed Windows thread and its producing command
receipts. The assigned managed worktree, `codex/choice-101-windows`, stayed clean
at `3a672e96364082482526ee380be4b749a845c0d4`. The public Story/main-to-core
journey passed with a normal observed driver exit and complete fixture cleanup.
Pinned Node 24.19.0 was found in the retained runtime cache. An npm wrapper first
used 24.22.1; the owner repeated restoration and compilation with the existing
11.9.0 CLI explicitly under pinned Node before qualifying the controller.

SDK invocation 2 passed all 14 named children: eight compile/lint children, five
positive normal-entry routes and one expected wrong-outcome rejection. The five
positive markers occurred exactly once, and the negative case exited 1 at the
expected boolean assertion without emitting its wrong-accepted marker. No child
timed out or truncated output. The SDK archive matched the recorded pin; producing
Windows Python, launcher and version-file hashes matched archive members, including
AMD64 PE identity. The SDK runtime driver SHA-256 was
`fc954c76b67db6d4cb5041f903d18cb6cd220f5cbc3ada0d7621aa62d77e6ff6`, matching
the Mac driver. The frozen authored receipt SHA-256 was
`6bec6f6818dea0f586ffda603ffdca86b81adcfa1e1ed2e40ec11b41ea240181`.

Windows usage is conservatively 2/20, assignment 2/4, zero reservations. Invocation
1 failed in the owner's optional evidence observer before launching an SDK child;
it remains charged. Invocation 2 used the unmodified repository script directly
and completed in 56.622 seconds. The owner retained exact fixture sources and
their hashes separately. Final receipts show no remaining SDK/controller scratch
or owned test process; existing processes and other checkouts were untouched.
Producing-host `c101w-20261110-1/report.md`, ledger, post-validation, authored
receipt, 14 child logs, source/hash inventory and cleanup records are retained.
The linked-session callback was denied by T3; Kris supplied the completed thread
to this coordinator. No result was silently lost or re-executed.

The coordinator previously audited automatic run `42775106323`, attempt 1, on
the same head. Both selected jobs and combined status passed, including the Choice
public-controller journey. [The receipt](https://github.com/Caldwell-41/Renpy-editor/issues/98#issuecomment-6761738652)
owns that CI result. No SDK repetition is needed for these unchanged #101 inputs.

#101's implemented prerequisite is now qualified through public authoring and
normal SDK play on both targets, allowing #102 to start on this integration branch.
Keep #101 open for the single integration PR's final review/closure. This does not
claim native/human or full #98 acceptance. #102 owns Calls, conditions and nested
Choices in option bodies under its live ticket. Reuse the existing recursive body,
Call and qualification owners; prompts, locked options, Repeat and picked state
remain #103–#106. The coordinator keeps live records and shared counters; #102
returns a committed, focused-tested candidate for a fresh merger.

## #102 integration and handoff

The fresh merger received sole integration ownership at `7dd772155f04defedcb0c68e8e414f6747323d1d`.
Worker branch `t3/choice-recursive-authoring` ended at
`7d86cda57c3e6e6c1c1cc5b44c958a33833e0954`, descended directly from that checkpoint.
Normal merge `b100034c212c79233f6797ac33a7d2aaaff7cfd2` completed without conflicts
or implementation edits. The local dependency symlink remains untracked.

The worker delivered recursive Choice/condition option bodies, option Calls,
structural completion and exact flow continuations, subtree moves/removal and
production Story controls. Source-map schema 10 keeps the schema-9 recognizer
frozen and refines verified physical records while preserving source, identities
and unknown fields. Current qualification consumers admit coherent schema-10
receipts without relaxing source/hash, identity or matrix checks. The merger's
bounded ownership, completion, caller and schema inspection found no material
integration defect. Rendered approved-design comparison remains missing.

The merged trees exactly equal the worker's: `app`
`1d4c3cdc6984470854e531535c44ae2b8def4d6c`, `tests`
`3f74a05af438c448908f0e403273bf98bd3610a0`, and `tests/fixtures`
`9b504508da62b6d5d29cd7f0d9f63bee65ad2184`. Approved `app/design-lab` and
`docs/design` source is unchanged from integration entry. Worker checks apply only
to these identical implementation inputs. This status successor changes no product code.

The worker reports 61 affected core passes, 53 Scene passes with seven named
historical ADR 0009 specialists ignored, 393 frontend passes and 12 Python passes.
Typecheck, build, formatting, repository validation and the actual production
main/Story-to-core authoring journey pass. Happy DOM evidence does not establish
native or visual acceptance. Temporary `choice102/handoff.md`, `logic-final-2.log`,
`scene-tests.log`, `frontend-all.log`, `fidelity-python-2.log`, `controller-qualified-2`
and the worker's retained worktree own commands and detailed evidence.

Mac SDK invocation 1 remains charged. Its first 16 children passed; child 17's
standalone recursive game failed because the public condition builder selected
`flag`, while the game declared only `choice_flag`. The worker explicitly selected
the declared variable through the production control and tightened offline admission
to require that guard. No product assertion was relaxed. `sdk-01` retains the
failure; incident H81 records its cause. Invocation 2 at final worker SHA passed
all 22 compile/lint/play children, including the required wrong-outcome rejection,
and completed owned scratch cleanup. `sdk-02/result.json`, its child logs and the
frozen authored source retain exact commands and hashes. The SDK archive pin is
the same published 8.5.3 SHA-256 recorded for #101. The old bad authored receipt
now fails offline admission before any SDK start.

The merger ran the existing exact public-core base Help export offline once:
`LOOMLIGHT_BASE_HELP_INPUTS=<fresh-output> cargo test --manifest-path app/Cargo.toml -p loomlight-core --locked --offline --lib screens::canvas::tests::base_help_fidelity_exports_typed_assets_styles_and_exact_source_without_execution -- --exact --nocapture`.
It passed one test, zero failures/ignored, and the shared `cargo-log` gate passed.
Existing Python 3.12 and retained Pillow then ran
`base_help_fidelity.validate_accepted` on its `accepted.json`; schema 10 and all
eight cases passed. Temporary `choice102/merge/base-help-export.log`,
`base-help-export/accepted.json` and `base-help-admission.log` retain this focused
CI-consumer check. No SDK/helper, browser, native, package or manual-CI operation
ran in this merge pass. Repository validation passed for 1,887 files; whitespace
checks passed. CURRENT is 386 words and HANDOVER is 1,190, within their review targets.

Cumulative SDK use is Mac 5/20, Windows 2/20, zero reservations. #102 used 2/4
Mac starts. #102 Windows qualification, rendered design comparison, matching
native/human evidence and combined review remain pending. The coordinator resumes
integration ownership and publication on draft PR #125. #103 prompt implementation
is next sole writer of shared parser/writer/UI, then #104; #102 Windows may run
concurrently on the other host after publication. Stage 2 still waits for every
Stage 1 requirement. All issues stay open for the single integration PR closeout;
this checkpoint does not claim full #98 acceptance.

## #102 Windows completion

The coordinator audited the completed Windows owner's producing thread and
`c102w-20261110-1` receipts. Exact candidate
`2ed83dbc1bc877cdc0fc3cf7303531ba1c0ec688` passed fresh public authoring and all
22 expected SDK outcomes: 12 compile/lint children, nine positive markers exactly
once each, and one expected wrong-outcome rejection. The owner safely fast-forwarded
the existing clean/idle managed qualification branch and preserved the registered
root. Its report and raw receipts remain on the producing host.
[The owning receipt](https://github.com/Caldwell-41/Renpy-editor/issues/102#issuecomment-6763016408)
records completion. The coordinator also audited passing exact-head automatic CI
at `2ed83dbc`; [its receipt](https://github.com/Caldwell-41/Renpy-editor/issues/102#issuecomment-6762859324)
retains that result. This qualifies #102's unchanged inputs, not the later #103 head.

#102 Windows used 1/4 selected starts. Cumulative Windows use is 3/20, with zero
reservations. Earlier #101/#102 counts above are historical checkpoints. No running
Windows assignment remains to poll or resume.

## #103 integration and handoff

The fresh merger received sole integration ownership at
`2ed83dbc1bc877cdc0fc3cf7303531ba1c0ec688`. Worker branch
`t3/choice-prompt-authoring` ended at `5fc50284ecdc1377901b0aad969182403b3a0a50`,
descended directly from that checkpoint. Normal merge
`8e8d2f5c02bff6b0673b62820cf3f5b48879c44e` completed without conflicts or
implementation edits. The dependency symlink remains untracked.

The worker delivered Choice-owned optional narration/Character prompts, exact
prompt token edits/removal, production controls and an inert illustrative preview.
Source-map schema 11 keeps historical recognizers frozen; verified refinement
preserves IDs, unknown fields and absorbed rows. The merger checked menu/prompt
header ownership, disjoint option/body mappings, exact removal, existing Character
UUID resolution, schema consumers and preservation of add-option/body-edit callers.
The bounded review found no material integration defect or duplicate owner.

Merged trees exactly equal the worker's: `app`
`2b3a9548b1e48ab47d2792937aba6bbf3f8ced1f`, `tests`
`35e4943e279d1d17f49de62ad7531a945bd9f17d`, and `tests/fixtures`
`fa59a5f5af812bade559af3c0dea282657ea3d57`. Approved `app/design-lab` and
`docs/design` source is unchanged from integration entry. Worker checks apply only
to these identical implementation inputs; this status successor changes no product code.

The worker reports 395 frontend passes with typecheck, focused public-core
source/migration/refusal/history/reopen passes, 53 Scene passes with seven named
historical ADR 0009 specialists ignored, workspace Cargo check, production build,
12 Python fidelity passes and the actual production-controller journey. Temporary
`choice103/handoff.md`, `prompt-core.log`, `logic-all.log`, `scene-tests.log`,
`frontend-all.log`, `workspace-check.log`, `build-qualified.log`, `fidelity-all.log`
and `controller-03/result.json` retain commands and results. Its handoff also retains
the earlier DOM accessibility, sandbox build and external-write driver failures
with their corrections and owned-scratch cleanup. No native or visual acceptance
follows from the synthetic DOM/controller results.

Mac SDK starts 1 and 2 failed at child 25 on the narration prompt's TextSelector
focus assumption. Start 1 had no rendering wait; start 2 failed after the bounded
10-second wait, disproving that timing-only diagnosis. All 24 preceding children
passed in each attempt. Both failed starts remain charged, immutable and cleaned
in `sdk-01` and `sdk-02`. H69's pinned displayable witness resolved the selector
limitation: noninteracting menu say text has no dialogue-advance focus. The final
fixture checks simultaneous active say/choice screens, exact speaker/text, the
actual text widget's TTS text and positive rendered bounds, plus enabled option
focus before selection. No production or authored runtime source changed after
the first implementation commit.

Start 3 on final worker `5fc50284` passed all 31 expected compile/lint/normal-entry
children, including narration, Character and nested Character prompts, existing
continuations/Calls/Jump/Return, and the expected wrong-outcome rejection. No child
timed out or truncated output. `sdk-03/result.json` and child logs retain argv,
statuses, source/driver/archive hashes and `cleanupComplete: true`. The official
8.5.3 archive pin remains the published hash already recorded above.

The merger ran the existing exact public-core base Help export once, using
`screens::canvas::tests::base_help_fidelity_exports_typed_assets_styles_and_exact_source_without_execution`
with `--exact --nocapture`. It passed one test with zero failures/ignored; the
shared `cargo-log` gate passed. Existing Python 3.12 and retained Pillow ran
`base_help_fidelity.validate_accepted` on the exported `accepted.json`; schema 11
and all eight cases passed. Temporary `choice103/merge/base-help-export.log`,
`base-help-export/accepted.json`, `base-help-cargo-gate.log` and
`base-help-admission.log` retain this check. No SDK/helper, browser, native, package
or manual-CI operation ran during integration.

Repository validation passed for 1,888 files and whitespace checks passed. CURRENT
and HANDOVER remain within their review targets. Temporary `choice103/merge/validate.log`
retains the repository check.

Confirmed totals are Mac 8/20 and Windows 3/20, zero reservations. #103 used 3/4
Mac starts. Windows #103, rendered-reference comparison, native/human evidence and
combined review remain pending. The coordinator resumes integration ownership and
publication on draft PR #125, then assigns Windows #103 and local #104 under the
limits above. #104 starts from qualified #101 and owns mixed Hide/Show disabled
semantics through existing source/runtime/generated-choice-screen owners. #31/#55
retain their open, unselected styling/template scope and unchanged prerequisites
and acceptance. Stage 2 still waits for every Stage 1 requirement. All issues stay
open for the single draft PR closeout; this checkpoint claims no full #98 acceptance.
