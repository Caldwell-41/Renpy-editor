# Choice #98 delivery

## Selection and ownership

Kris selected [#98](https://github.com/Caldwell-41/Renpy-editor/issues/98)
with the implement-spec workflow and instructed the agent to start building on
2026-11-10. The spec owns requirements; #101–#106 own bounded acceptance.
Delivery is `in_progress`. #101–#105 are integrated with public-authoring,
both-target SDK and automatic CI evidence. The Stage 1 runtime gate is complete on
`4339ccfc`. #106 and all four review corrections are published at `9d229ea4`.
Windows passed all 27 picked-state outcomes on that exact candidate. Mac passed
all 27 on documentation successor `ae057e3a`, including actual Save/exit/new-process
Load, ordinary rollback and New Game. Exact-head automatic CI passed on `ad4c2760`.
These bounded results do not establish combined acceptance.

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
Choice-owned narration/Character prompts through the same owners. #104 delivered
mixed Hide/Show disabled semantics through existing source, runtime and
generated-choice-screen owners. All implementer/test assignments are complete.
#105 and #106 Windows assignments passed. The coordinator owns integration/status;
all implementation/test assignments are complete. The separate preview-design chat returned Kris's approved A v2 correction. The
coordinator integrated it and completed the affected local verification. On 2026-11-11, Kris approved up to two
additional Mac #106 starts, extending its allowance to six within shared 17/20.
The coordinator completed the first additional invocation, with all 27 outcomes
passing. The second additional start remains unused.

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
Current consumption is Mac 16/20 and Windows 7/20. One place per target is
reserved for the single final package campaign. Mac #106 used five
of its six approved starts; the fifth passed all 27 picked outcomes. The unused
additional start is conditional on a diagnosed failure requiring correction.
#102 used 2/4 Mac starts and 1/4 Windows starts. #103 used 3/4 Mac starts, including two failed
selector attempts; its final run passed all 31 expected SDK children. #103 Windows
used 1/4 starts and passed all 31 children. #104 used 1/4 Mac starts and passed
exactly 12 selected children; that run selected no wrong-outcome child. #104 Windows
used 1/4 starts and passed its 12 selected children, also without a negative child.
#105 used 2/4 Mac starts. Its first remains a charged driver failure; its second
passed all ten selected children, including the intended negative.

#105 Windows used 1/4 starts and passed all ten selected outcomes. #106 Mac used
four original starts from 11/20; the fourth passed 26/27 outcomes and remains
a failed qualification. The approved fifth start subsequently passed all 27. On 2026-11-11, Kris explicitly approved up to two further
Mac starts for the corrected picked-state plan. The #106 allowance is now six
starts total, within shared Mac use of 17/20. The first additional start selected
and passed all 27 picked outcomes. The second requires a diagnosed failure and correction;
success does not authorize an automatic repeat. No package, native-editor, browser
or manual CI campaign is included in that approval.

Windows #106 used one of its four selected starts from 6/20 and passed all 27
outcomes with the corrected vbox driver after offline fixture, host/toolchain and
official pinned-SDK preflight. Its existing T3-prepared branch safely fast-forwarded
to `9d229ea4` after clean/idle and ancestry checks; the protected root stayed
unchanged. No Windows retry is needed. The coordinator owns shared counters.
Completed assignments retain consumed starts; handoffs grant no new allowance.

The final coherent-candidate CI package campaign is selected below, with one
workflow invocation and one target campaign per supported host. Native physical
input/human sessions remain separate and have not started. Routine compilation, focused tests, review and
automatic PR checks need no numerical allowance. Historical arithmetic and
protected native-session limits remain separate and unchanged.

## Next action

The approved A v2 correction is integrated and local verification passes.
[The current handoff](#approved-a-v2-integration-and-final-ci-reservation) owns
review fixes, truthful evidence scope and reservations. Publish the coherent
candidate, dispatch the selected `production-scaffold.yml` once with success-only
package upload, capture its exact head/run/attempt, then audit automatic Repository
quality and the required Preflight, Windows x64 and macOS ARM64 jobs. No automatic
retry is selected. Pending or failed qualification does not establish acceptance.

Windows's dedicated SDK branch remains clean at `9d229ea4`. No worker or test owner
is active. Preserve the protected registered root, Choice/design worktrees and
unique evidence. Shared SDK consumption remains Mac 16/20 and Windows 7/20, with
one place reserved per target. Native/human acceptance remains separate.
#98/#106 and PR #125 stay open/draft; full Story #110 and #31/#55 remain unselected.

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

## #103 Windows completion

The coordinator audited the completed Windows owner on exact published candidate
`4be00d25ca4ea0f86da4f46b8a3081cfddfa2cdd`. All 31 selected SDK children passed
in one Windows harness start. Producing-host `c103w-20261110-1/report.md`, its
verified 126-entry manifest and raw receipts retain the result; SDK cleanup is
complete. The existing dedicated worktree was used and the registered root stayed
unchanged. [The published receipt](https://github.com/Caldwell-41/Renpy-editor/issues/103#issuecomment-6763896058)
owns that target qualification.

Exact-head automatic Repository quality run `42788503420`, attempt 1, also passed,
including 395 frontend tests, the production controller journey, Rust formatting
and repository checks. [Its receipt](https://github.com/Caldwell-41/Renpy-editor/issues/103#issuecomment-6763650277)
is already published. #103 Windows used 1/4 starts, taking shared Windows usage
to 4/20 with zero reservations. No prior worker/test assignment remains active.
These results qualify #103's inputs, not #104 or combined/native/human acceptance.

## #104 integration and handoff

The fresh merger received sole integration ownership on `codex/choice-98` at
`4be00d25ca4ea0f86da4f46b8a3081cfddfa2cdd`. Worker branch
`t3/choice-option-unavailable-policy` ended at
`7b7a6d161efa86da16894974374cf5bd626bbdef`, descended directly from that entry.
Both checkouts had clean tracked inputs and only their disclosed dependency
symlinks untracked. Normal merge `527b1943838a91020a1424db15aaf47e2230007a`
completed without conflicts or implementation edits. Git required scoped access
to the managed worktree metadata after the sandbox refused the first merge before
mutation; the authorized merge then succeeded.

The complete merge tree exactly equals the worker tree,
`9582bff0d496e81d78ee679bd574df76e79bfef7`. Material trees are `app`
`67f904b0991876dd86f811cbb29ecc2ed97fefa7`, `tests`
`9338d30ae828f6aa047c071f8a632d570ee8813c` and `tests/fixtures`
`3b1ad82947154a68612ef54ef5cc0c456e48fce7`. This documentation successor changes
only CURRENT, HANDOVER and this record against the worker. Approved `app/design-lab`
and `docs/design` source is unchanged from entry. Worker checks apply to identical
implementation inputs; no broader suite or SDK run was repeated by the merger.

The worker added typed per-option Hide/Show disabled policy, with Hide as the
omitted default. Show disabled requires a typed condition. Schema 12 recognizes
the versioned native-menu form while recognizers through 11 stay frozen. The
existing recursive source/map owners retain Choice and option identities, unknown
metadata, exact sibling guard spelling and unsupported source. The minimal Screens
adapter preserves native items, captions, actions and inherited choice styles,
adding only per-item button sensitivity. Native filtering skips every unavailable
body and resumes the shared continuation when no option is selectable.

Accepted transactions create the collision-checked helper with source/map/history;
Undo removes a newly created helper and Redo restores it. Adapter/template bytes
are transaction read dependencies. Dirty helper Source drafts refuse and retain
input. Opening or no-op never installs or repairs source. An unchanged
Source-authored reference with a missing adapter explicitly refuses the no-op.
Custom/edited/missing adapters, duplicate names, foreign helper files and native
filter overrides retain protected Source fallback with a visible reason. Exact
refusal tests include the fixture's existing BOM. No second runtime interpreter
or separate writable path was added. #31/#55 keep their unselected styling/canvas
scope and unchanged prerequisites and acceptance.

Final worker verification passed 396 frontend tests with typecheck, 68 logic,
16 Source and five metadata tests, focused availability/refusal cases and the
actual production Story-to-core controller journey. The broader 121 Scene passes
with seven pre-existing ignored specialists preceded review fixes; later focused
logic/availability/controller checks cover the final changed owners. The ignored
cases establish no proof. Twelve Python fidelity tests, frontend build, workspace
Cargo check, formatting and repository validation also passed. Temporary
`choice104/handoff.md` and `verification-commands.txt` own commands and log names.
The controller's Happy DOM events establish no native WebView or rendered-design
acceptance.

Retained red/green evidence includes the initial unsupported payload and missing UI
control, fallback error-name fixture correction, missing-helper no-op bug, sibling
guard-token normalization and stale preview assertions. Controller attempts 1/2
failed because reopen clears Undo history and Source restoration invalidated local
option references; the corrected journey restores through Undo before reopen and
retains identity/source checks. Both scratch roots were cleaned. Missing-Pillow,
sandbox Vite config-write and missing frontendDist setup failures remain recorded;
the retained runtime, scoped build and ordered workspace check passed without an
installation or exemption. These controller/setup failures consumed no SDK start.

Mac SDK candidate `00d251186022defb5baa2694647c98ae4852bd8e` passed exactly
12 selected children in one start after offline admission, host/toolchain and
official 8.5.3 checksum preflight. `choice104/sdk-01/result.json` retains argv,
source/driver/archive hashes and `cleanupComplete: true`. Every child exited 0
without timeout or truncation. The four compile/lint/play groups cover mixed
availability, all unavailable, all disabled and all hidden. The mixed game proves
the hidden option absent, the disabled option rendered with positive bounds/TTS,
its actual click inert, enabled keyboard focus and selection, and both unavailable
bodies inert. All no-selectable cases reach Shared once, record no pick and end
safely. This selected run contains no wrong-outcome child. Its inherited success
print mentioned one in error; the final script reports only the selected children.

Final review fixes change source preservation, refusal and transaction dependencies.
`choice104/runtime-comparison.json` proves final `controller-05` emits the same four
qualified source shapes after normalizing only each fixture's actual generated
entry label in memory. Adapter/template bytes and runtime driver are identical;
no source file was rewritten for comparison. The SDK result remains bound to
`00d25118`; reuse covers those unchanged runtime shapes and driver, not a fresh
final-head SDK run.

The merger ran the exact existing public-core Help export once with
`LOOMLIGHT_BASE_HELP_INPUTS` and
`screens::canvas::tests::base_help_fidelity_exports_typed_assets_styles_and_exact_source_without_execution`
under `--exact --nocapture`. One test passed with zero failures/ignored, and the
shared `cargo-log` gate passed. Existing Python 3.12 with retained Pillow admitted
its actual schema-12 `accepted.json` and all eight cases. All seven offline base
Help admission tests passed, including legacy/current agreement and unknown-version
refusal; the shared `verify_unittest` gate confirmed seven passes and no skips.
Temporary `choice104/merge/base-help-*` retains these checks. The first
Cargo gate wrapper used the wrong relative script path; correcting it consumed
the same passing Rust log without rerunning the export.

Rust formatting, repository validation for 1,890 files and whitespace checks pass.
CURRENT and HANDOVER remain within their maintenance targets. Protected native
recovery records below the live Choice handover are unchanged.

Confirmed totals are Mac 9/20, Windows 4/20, zero reservations. #104 used 1/4 Mac
starts. No SDK/helper, native editor, browser, package or manual CI operation ran
during integration. Windows #104, rendered-reference comparison, native/human
evidence and combined #98 review remain pending. The coordinator resumes sole
integration ownership, publishes and links this local checkpoint on draft PR #125,
then dispatches Windows #104 under the limits above. No Stage 2 #105/#106
implementation starts until that Windows Stage 1 gate passes. No issue/PR mutation,
push, worktree cleanup, protected-session or signing/credential change occurred.

## #104 Windows completion and Stage 2 entry

The coordinator audited the completed producing thread and its raw post-validation,
ledger, final checkout/process checks and report-manifest verification. Exact
candidate `4339ccfc7c7a2a5c9b35f5fedcc9f321f65a12ce` passed the fresh nine-stage
production Story-to-core controller journey, offline preflight and all 12 selected
Windows SDK children. Four compile/lint/play groups cover mixed availability,
all unavailable, all disabled and all hidden. Every child exited zero without
timeout or output truncation; each positive play marker appeared exactly once.
No wrong-outcome child ran. Frozen authored bytes, adapter, driver and source
hashes matched the candidate. The retained `c104w-20261110-1` report, SDK receipt,
independent audit and verified 95-entry manifest own full commands, argv, durations
and material identities. Report SHA-256 is
`e9c2b0cca27e796a5cb581a534c45920177624b3cf0da17986d122bb225e8a77`;
SDK receipt SHA-256 is
`a661c07f8d608197b91d06b1e9dc8b74efdf90fc1a716f318b9ab3fe1d627567`.
[The published Windows receipt](https://github.com/Caldwell-41/Renpy-editor/issues/104#issuecomment-6764672541)
records that target qualification on `4339ccfc`.

The owner context was SUNDOWN/krisn. Node 24.19.0, explicit npm 11.9.0, Rust 1.90.0
with native MSVC x64, Python 3.12.14, local Default desktop and official 8.5.3 SDK
archive/checksum identity were verified before execution. The clean dedicated branch
fast-forwarded from `4be00d25` to the assigned candidate after clean/idle ownership
and ancestry checks. Its final status is clean; the registered root remains clean
at `251fb477`, and the unrelated arithmetic checkout was untouched. SDK/controller
scratch and owned temporary cache are gone; no owned runtime process remains.
No process termination action was issued.

Retained test-owned wrapper/observer failures do not establish product failures.
The first PowerShell Rust wrapper stopped on ordinary Cargo progress; corrected
output handling completed the build without a repository change. A provisional
process collection had null fields, and a later observer incorrectly required all
unrelated CUA runtime processes to remain alive. The corrected audit records three
unrelated process exits, zero termination actions and zero remaining owned processes.
The failed observers remain retained. No controller or SDK retry occurred for them.

[Automatic CI receipt](https://github.com/Caldwell-41/Renpy-editor/issues/104#issuecomment-6764485048)
records exact-head run `42794630725`, attempt 1, PR event, completed success.
Both required jobs passed, including all 396 frontend tests with no failures/skips,
production build, Rust formatting, Help admission, actual Choice/Story controller
journeys and repository validation. Four executed jobs succeeded; five unselected
specialist jobs skipped. No review or inline finding was present at that audit.
This is the draft quality selection, not final automated/native acceptance.

#104 Windows used 1/4 starts. Confirmed totals are Mac 9/20 and Windows 5/20,
zero reservations. #101–#104 now satisfy the selected Stage 1 public-controller
and both-target runtime gate. Fresh isolated #105 Repeat is next sole writer;
the coordinator retains live records and integration. Its Mac assignment is capped
at four starts from 9/20 after preflight. #106 follows #105's integration because
their source/runtime and Story controls overlap, although its ticket has no Repeat
dependency. Issues remain open for the one PR's final review/closure. Rendered
comparison, native/human evidence, final validation selection and combined #98
acceptance remain pending. This entry changes only coordinator records and reuses
`4339ccfc` evidence for unchanged implementation inputs.

## CI font-import readiness correction

Automatic run `42797086580`, attempt 1, failed on exact documentation successor
`192bc0f487c1a49bbb9d252fc78b39dd9bb0762e` in the existing browser-fixture step.
The only failing fixture was `project-font.browser.mjs:66`, where display-name
`aria-invalid` was null instead of true. The other 17 fixtures, including actual
Choice and Story controllers, passed. Repository validation also passed. This
failed attempt remains failed; it is not waived by the earlier green head.

The coordinator classified this as a fixture-readiness defect after tracing the
actual picker/controller/field-validator owners and H48's earlier validation
contract. An unchanged focused local replay passed, confirming the intermittent
symptom needed controlled ordering. A temporary replay using the fixture's existing
held-picker hook reproduced the exact failure: the empty display name first had
`aria-invalid=true`; the late file reply supplied its default name and remounted
the form with no error; the next whitespace edit correctly deferred new validation,
while the fixture still expected its earlier error. No production validator defect
or Choice regression was found.

Both successful import paths now wait for the existing enabled Import and use
control before editing names. This acknowledges completed file selection and font
preview without a sleep or longer timeout. Cancellation and deliberately held
picker paths, invalid/corrected-name assertions, IME, Source, draft, focus and
history checks are retained. Production components and all SDK inputs are unchanged.

The same controlled replay passes with readiness before validation. The complete
project-font browser/controller/core journey passes with the correction. Temporary
`choice98-font-race` retains the red, controlled green and full green scripts/logs;
the original local baseline log remains separately retained. Browser sessions used
scoped outside-sandbox execution as required on Mac, disposable projects and owned
browser cleanup. These checks establish no native WebView or human acceptance.
No SDK start or manual CI campaign was consumed. Last confirmed shared SDK totals
remain Mac 9/20 and Windows 5/20; the active #105 implementer owns any new Mac
reservations/counts. The coordinator owns only this fixture and its evidence;
#105 retains its isolated feature-code assignment and must merge the updated local
integration tip before return. The correction's new head needs automatic CI.

Published correction `be98deec9f683d7691ab4a01ccb9d63b1d7e0607` subsequently passed
automatic run `42798814547`, attempt 1. All 396 frontend tests and all 18 browser
dispatch fixtures passed, including the font, Choice and Story journeys. Build,
Rust formatting, Help admission and repository validation also passed.
[The receipt](https://github.com/Caldwell-41/Renpy-editor/issues/98#issuecomment-6765076757)
binds those results to that exact head. The failed `192bc0f4` attempt remains
failed. No remaining review finding was present at the coordinator's audit.

## #105 integration and handoff

The fresh merger received sole integration ownership at
`be98deec9f683d7691ab4a01ccb9d63b1d7e0607`. Worker branch
`t3/choice-repeat-option-outcomes` ended at
`5d07f9120051419a6b14261b6b41c71ccf1ac02b`. Its merge `61d47d46` already contained
the current integration tip and font-fixture correction. Both checkouts had clean
tracked inputs and only disclosed dependency symlinks untracked. Normal merge
`4c3497c550dc0cabec915a789537a5874b60ba7c` completed without conflicts or
implementation edits. The repository-local noreply identity was verified.

The complete merge tree equals the final worker tree,
`1c92fd027bb802a9d57e52c55243e101a36ce4c5`. Matching material trees are `app`
`36f1349b9011d29afd81535898966574de8d0cc0`, `tests`
`0f5f3f2b2095a5aabe485467f8141d3f78e4e5bb` and `tests/fixtures`
`2eef253b8d9a5d1eb57bf6311ac22f55f4dbf0a7`. Approved `app/design-lab` and
`docs/design` trees are unchanged from entry. This documentation successor changes
only CURRENT, HANDOVER and this record. Temporary `choice105/merge/integration-trees.json`
retains parents, ancestry, trees, status and the protected recovery-tail hash.

RepeatChoice is a source-derived ending Beat under the existing parser, writer,
body/transfer, completion and flow owners. Accepted explicit-body edits install a
collision-checked `_ll_choice_<32 lowercase hex digits>` label immediately before
the owning menu. The label, menu and prompt share one header mapping. The native
jump revisits that Choice's prompt and availability gate, including safe continuation
when nothing is selectable. It does not restart the Scene or add a Call frame.
Calls retain their existing `from` label and resume in the option before Repeat;
nested menus own separate targets. The stable label remains after changing the
ending and is reused later. Opening, migration and no-op do not install or repair it.

Existing bounded project Call-label inventory checks target ownership and collisions.
Unprovable ownership refuses authoring and retains protected Source fallback.
Arbitrary-label/general-loop editing and reserved jumps outside their own option
remain unsupported. Schema 13 preserves verified UUIDs, unknown fields and absorbed
mappings; recognizers through 12 stay version-gated. The final identical-caption
neighbor test proves target installation preserves both menus' Choice/option IDs.
Then replaces only the final transfer and preserves preceding Beats and trivia.
Existing revisions, drafts, history and reopen own every ending. Completion treats
Repeat as an ending; arithmetic inspection becomes unknown across it. Preview stays
inert and reports unknown live availability. No second outcome/history store or
Choice interpreter was added. Story Combined v1 controls remain approved; full
workspace/layout acceptance stays with #110.

Worker evidence is reused for identical material, with its original scope intact.
`choice105/handoff.md`, `material-comparison.json` and the named logs own commands
and candidate limits. The runtime-generating parser/writer/body/flow/variable owners,
UI, schema and adapter match implementation `30f20be7`. The only other production
change is the precise Source-fallback sentence in `scene.rs`. Final focused Repeat
tests cover that sentence and the later identity proof. The SDK driver correction
is separate from authored source. The merger independently checked the recorded
material hashes and SDK receipt identities; no suite or export was repeated merely
for the merge SHA.

Final focused Repeat passed three tests; Source passed 16 and metadata five, with
zero failures/ignored. The broader Scene run passed 124 tests before the final
identity test and wording change; seven named pre-existing ADR 0009 specialists
remain ignored and establish no proof. The production Story-to-public-core journey
passed all ten stages and 203 requests, then cleaned scratch. Frontend passed 396
tests with no skips, typecheck and build. Workspace Cargo check passed. Happy DOM
events establish no native WebView, timing or rendered-reference acceptance.

The worker already ran the actual public-core Help export test once, with one pass
and no failures/ignored. Its real schema-13 `accepted.json` and all eight cases
passed Python admission. Current Python consumer groups passed 7 base Help,
3 nested fidelity, 2 sample fidelity, 9 Help dialog, 6 ordered actions and 10 screen
controls cases, with no failures/skips. Shared Cargo/unittest gates admitted the
retained results. This includes current schema admission and preserves frozen older
recognizers. These unchanged inputs require no second Help export at integration.

Mac start 1 on `61d47d46` passed compile/lint and all 21 conversation assertions,
then failed at terminal Advance after reaching main_menu. Advance waited for a new
dialogue callback. Only three children ran; no later group or negative result is
claimed. That failure remains charged and retained in `sdk-01`. Replacing the three
terminal transitions with the existing K_RETURN fixture pattern changes only the
driver. Start 2 on exact final worker `5d07f912` passed all ten selected children.
Three compile/lint/play groups cover repeatConversation, repeatExhausted and
repeatNested. The intended repeat_wrong_outcome child exited nonzero at
`choice_visits == 2` and printed no acceptance marker. No child timed out or
truncated output. The actual controller-02 export was reused byte-for-byte, with no
hand-authored substitute. Source, adapter, driver, official SDK 8.5.3 checksum and
candidate identities remain in `sdk-02/result.json` and `material-comparison.json`.

The passing runtime proves prompt/availability re-evaluation, Call resumption,
unchanged stack depth, earlier Scene effects once, exhausted-choice continuation
and the nested target returning to its outer body before Shared. Both SDK starts
and controller roots cleaned up; no owned runtime process remains. The initial
process-list sandbox denial was resolved by scoped read-only inspection. Earlier
BOM assertion, nonexistent test helper and discarded unchanged-file dependency
failures remain in the worker evidence; they consumed no SDK starts. The tentative
general-history change was removed. The final path uses existing ownership.

The merger passed Rust formatting, repository validation for 1,890 files and
whitespace checks. CURRENT is 383 words and HANDOVER 1,113, within their maintenance
targets. The protected recovery tail is byte-identical to entry. Temporary
`choice105/merge/scoped-reuse.json` retains the hash and result-gate audit. Two
read-only audit wrappers first failed on a missing script import path and a TAP
parser applied to Node's spec-reporter log. The corrected wrapper admitted the
original Cargo/Python logs and checked the original frontend summary; it reran no
product test or export. Both wrapper failures remain recorded beside that audit.

Confirmed totals are Mac 11/20 and Windows 5/20, zero reservations. #105 used 2/4
Mac starts; Windows #105 has not run. After the coordinator publishes this local
checkpoint, Windows #105 is test-only on the existing clean/idle dedicated branch,
with safe fast-forward to the exact candidate and at most four starts from 5/20
after preflight. Fresh isolated Mac #106 may run alongside it with at most four
starts from 11/20 after preflight. Its dependencies are qualified Stage 1, not
Windows Repeat completion. #106 is the sole next shared-code writer; the coordinator
owns status and integration. #31/#55 styling/canvas remain unselected. Rendered
comparison, matching native/human evidence, final combined review and validation
selection remain pending. No issue closure is claimed. The merger performed no
push, tracker/PR mutation, SDK/browser/native/editor/package/manual-CI operation,
worktree cleanup or signing/security/credential change.


## #105 Windows completion and published CI

Windows qualified exact integration candidate
`0a81ae249a5a616fc34041a260f2ddb00edf9d52`. Its fresh production controller passed
all ten stages. One SDK start passed all ten selected Repeat outcomes, including
the intended negative. #105 Windows used 1/4 starts, taking shared Windows use to
6/20 with zero reservations. [The reduced receipt](https://github.com/Caldwell-41/Renpy-editor/issues/105#issuecomment-6765715314)
owns the public result; private host paths and artifact metadata remain with the
producing-host handoff.

Exact-head automatic CI run `42802216478`, attempt 1, passed for `0a81ae24`.
It covered 396 frontend tests, all 18 browser dispatch fixtures, build, formatting,
Help and repository validation. No review or inline finding remained at that audit.
[The CI receipt](https://github.com/Caldwell-41/Renpy-editor/issues/105#issuecomment-6765538838)
records its candidate scope. It does not qualify the later #106 integration.

## #104 receipt retention limit

A later audit found the retained duplicate controller receipt invalid JSON and
inconsistent with its original manifest hash. The other 94 of 95 manifest entries
match. The frozen SDK-authored reference still matches its original verified
checksum. The original producing thread retains its at-time successful
byte-equality, source, child and 95-entry audit. Preserve the corrupt copy, original
manifest and checksum-matching frozen reference. Do not overwrite or requalify them.
Cause and time remain unknown; timestamps do not establish either. Current
availability of that duplicate controller receipt is limited. [The public correction](https://github.com/Caldwell-41/Renpy-editor/issues/104#issuecomment-6765725629)
records this limit. A detailed publication containing private Windows artifact
metadata failed automatic approval review; the sanitized summary succeeded. Private
host paths and raw artifact metadata stay outside Git and GitHub.

## #106 integration and handoff

The fresh merger received sole integration ownership at
`0a81ae249a5a616fc34041a260f2ddb00edf9d52`. Worker branch
`t3/choice-picked-options` ended at
`e6ab0aaf0376ca6f2b69b0536077a652d08c91cb`, descended from that exact base.
Both tracked checkouts were clean with only their disclosed dependency symlinks
untracked. Normal merge `8fe1da8687594db110c7489d19f06f94d3e37ece` completed
without conflicts or implementation edits. The repository-local noreply identity
was verified. The complete merge tree equals the worker tree,
`d30274dbad252cad3f5c8bec5207f6b7e8ec27a9`.
Matching material trees are `app` `40a8a2d00fd8b686e2939dd52345e2828c9c9bce`,
`tests` `fd495ae57aa5aa68aea184ff408196d8967ae949` and `tests/fixtures`
`6d8e34ab14b094d0b623bec5eaef6bd96168a281`. Approved `app/design-lab` and
`docs/design` remain unchanged from entry. This documentation successor changes
only CURRENT, HANDOVER, this record, ARCHITECTURE and UI.

Picked options extend the existing parser/writer, source mapping, transactional
history, native menu guards/actions and generated choice adapter. Optional accepted
policy adoption embeds stable Choice/option UUIDs; new Story Choices start with
Show normally. The option header owns the first selection-record statement before
authored Beats. The adapter declares ordinary saved, rollback-aware Ren'Py state,
presents selectable marks and distinct disabled locks, and combines picked hiding
with availability and the no-selectable continuation gate. Rename/reorder retains
identities, new options get fresh UUIDs, and collisions or unsupported/dirty source
refuse without repair. Schema 14 preserves frozen older recognizers. [DATA_MODEL](../../DATA_MODEL.md#project-and-narrative-layer)
owns the lasting source contract; ARCHITECTURE and UI now describe this implemented
owner. Full Story #110 and #31/#55 styling/canvas remain separate.

The parent reviewed source-backed UUID/policy/record mapping, adapter behavior,
native guard combination, typed declarations and collision ownership, and the SDK
failure. No blocking implementation finding was identified. Draft integration is
permitted with the remaining gates explicit. It establishes neither #106 completion
nor #98 acceptance.

### Retained portable checks and scoped reuse

The merger checked all 12 recorded material hashes and admitted the retained result
gates. Fresh final production Story/main to ApplicationHost/core passed 12 stages
and 265 requests, then cleaned scratch. Frontend typecheck/tests passed 396 tests
without failures or skips. Final public-core picked tests passed three, declaration
collision one, migration through schema 13 one, Source 16 and metadata five.
Actual public-core Help export passed once; its schema-14 output and all eight
cases passed admission. All 37 Python consumer cases passed without skips. Frontend
build, workspace Cargo check, formatting and repository validation passed within
the worker's recorded scope. Existing build-size and desktop dead-code advisories
remain unchanged.

The broader Scene run passed 127 with seven pre-existing ignored specialists; logic
passed 73. These runs precede final minor coverage, UI and refusal changes. Final
focused owners cover those changes; broad results retain their earlier candidate
scope. Happy DOM/controller evidence establishes no browser-rendered comparison,
native WebView, timing or human acceptance. No broad suite or Help export reran
for a merge SHA. Temporary `choice106/merge/scoped-reuse.json` retains the independent
material and result-gate audit; the worker's `choice106/handoff.md`, `materials.json`
and named logs retain exact commands, candidates and earlier failures.

### Mac SDK result and exhausted limit

The last SDK candidate was
`49e44c129cd7f4ce7a7e9e775966fb4708b27078`. Final worker `e6ab0aaf` changes only
the fixture's Start/Load vbox layout and H83 incident documentation relative to
that candidate. Product/runtime files are identical. All 27 selected children ran;
26 passed, including compile/lint, Show/Mark/Hide, duplicate captions and separate
instances, immediate endings, Repeat/Call behavior, combined Hide/disabled
continuation, and the intended wrong-outcome rejection. The latter failed at its
intended assertion and printed no acceptance marker. Raw SDK-authored source and
adapter remain frozen. The final controller export differs in generated fixture
identities; each runtime role matches after in-memory identity normalization.
Raw artifacts were not rewritten or called byte-identical.

Actual save, process exit and new-process Load passed. Saved and loaded artifact
hashes match. The remaining `pickedMark-picked_rollback_new` child failed at
initial Start before game entry; it proves neither rollback past selection nor
New Game. The fixture placed enabled Load over Start after a save. Final source
uses a vbox, but this corrected driver is unqualified. Reuse covers unchanged
material and the exact earlier positive outcomes only. It grants no final-driver
or lifecycle pass.

Four starts consumed Mac 12/20 through 15/20. Start 1 failed on raw-slot Load
sensitivity; start 2 failed the save-filename observer; start 3 passed save/close/
new-process Load before the initial Start failure. Start 4 retained all outcomes
and the same unresolved lifecycle failure. The pinned-source diagnosis and vbox
correction are in H83. Every failed receipt remains charged and retained. All four
starts report complete cleanup; no child timed out or truncated output. The worker
observed no remaining owned SDK/game process. Nonselected runner cases are excluded,
not counted as passes. `choice106/start-ledger.md` and the four immutable receipts
own the original argv, durations, exits, artifact identities and cleanup.

#106 used all 4/4 Mac starts. Mac remains STOPPED pending Kris's approval, with
shared use 15/20. Shared capacity does not waive that limit. No new harness,
standalone child or successor assignment can route around it. The coordinator's
possible request for up to two additional Mac starts, within shared 17/20, is only
a proposal. Windows #106 remains pending and may proceed under its separate
four-start assignment from Windows 6/20 after publication and preflight. No source
fix is delegated to its test owner. All workers/test owners are complete and
reservations are zero.

### Integration checks and successor

The merger reused identical material within original candidate scopes and ran no
SDK, browser, native editor, package or manual CI campaign. No push, tracker/PR
mutation, worktree cleanup or security/signing/credential change occurred.
Rust formatting and whitespace checks passed. Repository validation passed for
1,890 files. CURRENT is 393 words and HANDOVER is 1,076, within their maintenance
targets. The protected HANDOVER recovery suffix remains byte-identical to entry.
The final temporary handoff retains the check and material audits.
The local dependency symlink and all worker evidence remain
retained. The coordinator resumes sole integration/status ownership for publication,
Windows dispatch and any explicit additional Mac approval request. #98/#106 remain
open and draft. Combined review/fixes, rendered/native/human evidence and final
validation selection remain pending.

## Two-axis review and correction assignment

The required code-review workflow compared accepted entry
`63221b44d72c1c100815e9e638cbec5133ffc1eb` with local integrated
`fe3196294d0e406c0d5470d05411ed6f9aa80acb`. Two fresh read-only agents reviewed
Standards and Spec independently. The captured diff spans 53 files and 39 commits.
They changed no repository source and ran no SDK, browser, native or package
operation. The Spec reviewer used narrow public ApplicationHost and production
renderer proofs for its findings, without a new build or broad suite.

Standards reported three P2 contract breaches: an unrelated accepted edit may
recreate a missing Choice helper; picked-header/record rebuilding can normalize
unrelated whitespace and mixed line endings; and one runtime-validity cache uses
the first dependent Scene's requirements for later Scenes. It also noted an
optional Primitive Obsession judgement about temporary parsed header offsets in
the option ID field. That heuristic is not a documented-standard breach; any
response must stay proportionate to the existing mapping owner.

Spec reported two P2 defects. Runtime fallback depends on Scene order when legacy
availability and picked menus require different adapter capabilities. Hide picked
can continue through exhaustion, but the renderer treats transfer-only options as
terminal and removes legal shared-continuation insertion positions. This cache
finding appears in both reports; the reports remain separate, with four distinct
contract/behavior defects requiring correction. No scope creep was identified.
Live #110/#117 ownership confirmed that full Combined Preview options assumptions
remain outside this selected feature implementation; #98's inert and honest
unknown-state preview requirements still apply.

One fresh isolated implementer will fix the four defects, with focused public
core/renderer red-green checks. It owns affected source/tests and necessary
canonical contract clarifications; the coordinator retains these live records and
integration. Keep one transaction/runtime owner and preserve source/header IDs,
old recognizers and custom fallback. Do not broaden the work into an optional
architecture rewrite. The optional typing suggestion needs an explicit bounded
disposition in the return.

Mac stays stopped at #106 4/4 and shared 15/20. The correction assignment authorizes
no SDK harness or standalone child on either host. Windows remains 6/20. Missing
rollback/New Game and final-driver proof is a separate known gate, not something
portable tests can waive. After correction and fresh-merger verification, publish
the candidate and dispatch Windows #106 under its selected four-start limit.
Additional Mac starts still require Kris's approval. Preserve all retained failures,
the #104 duplicate-receipt limitation and the protected recovery. #98/#106 and
PR #125 remain open/draft; rendered/native/human proof, final validation selection
and combined acceptance remain pending.

## Review corrections integration

The fresh merger received sole integration ownership at
`a7d3bf56a26fa5bf4f83113ff9bbc81caf818540`. Correction worker
`0606d70858d07154874cf59387bbb313c7a05e62` descends directly from that base.
Both tracked checkouts were clean; only their retained dependency symlinks were
untracked. The repository-local noreply identity was verified. Normal merge
`0b8b264f8025f5f626eade7748260ac1dad1d7f0` completed without conflicts or
implementation edits. Its complete tree equals the worker tree,
`815466fce82e51c1cf4d2fd9e29c45f8684a2e4c`. This successor changes only
CURRENT, HANDOVER and this record; all other files equal the worker.

The original Standards and Spec reports remain separate. Their overlapping cache
finding gives four distinct P2 defects, all corrected in this worker:

- Runtime fallback previously depended on Scene order. The existing owner now
  caches availability-only and picked requirements separately and protects each
  dependent Choice. The public save/list/apply test covers both Scene orders with
  missing, legacy and picked helpers. It reproduces the defect and passes afterward.
- Changed-source commands could recreate a missing helper. The existing owner now
  inspects accepted source dependencies before allowing first creation or first
  picked upgrade. The final expanded public test covers legacy/root/nested edits,
  insertion, destination creation, another Scene's adoption and downgraded helpers.
  Refusal preserves source/map/project bytes, history flags and missing helpers.
  The separate first-adoption/upgrade test retains shared Undo/Redo and stable IDs.
- Picked edits rebuilt unrelated newline and header bytes. Existing menu rows and
  selection records now retain their bytes; policy changes patch the mode token,
  and first adoption uses each row's newline. The mixed-LF/CRLF public test checks
  caption, prompt and policy edits, trivia, IDs, no-op, Undo/Redo and reopen.
- The renderer omitted legal Hide picked continuation positions. Its existing
  termination predicate now agrees with core. Actual Add Beat controls cover root
  and nested bodies, default final Return and explicit shared positions. The full
  production controller accepts all three positions and proves exact Undo.

The optional parsed-offset typing suggestion is deferred. A typed parsed option
would require wider public-payload/parser/mapping plumbing; it is not a confirmed
behavior defect. The parent accepted this bounded disposition. No architecture
expansion or second runtime/history owner was added. DATA_MODEL and ARCHITECTURE
retain the worker's technical clarifications. Approved lab/design source is unchanged.

### Focused proof and reuse limits

The merger admitted retained Cargo logs with the existing result gate. Final
production passed 78 logic tests, the final expanded missing-helper test, the
existing destination transaction test and ten availability tests, with zero failures
or ignored tests. The final renderer file passed twenty tests without skips;
typecheck passed. The production-main/controller/ApplicationHost journey passed
thirteen stages and 284 requests, exited zero and removed its fixture. Expected
red logs remain retained. No full frontend suite ran on this corrected tree;
the earlier 396-test CI belongs to published `0a81ae24` only.

The complete merge tree proves identical material. No passed test or Help export
was repeated for a merge SHA. The worker's temporary `choice98-review-fixes/handoff.md`,
`runtime-material-comparison.json`, `controller/result.json` and named logs own
commands and candidate scope. The merger's `merge/integration-trees.json` and
`merge/scoped-reuse.json` retain the independent tree/result audit. The private
handoff preserves BOM/setup and external-file history-boundary details without
copying raw logs here. Original review reports remain unchanged.

All 29 runtime string roles from the fresh controller match the prior frozen SDK
normal-input fixtures after generated-identity normalization; the picked adapter
bytes match exactly. The merger independently checked that comparison. SDK fixtures,
qualifier, final vbox driver, adapters and schema-14 admission bytes are unchanged.
Inspection, helper admission and mixed-source preservation changed authoring
behavior; the renderer exposes already legal positions. This source comparison
establishes no new runtime qualification. Prior runtime results retain their exact
candidate/outcome scope, including the failed 26/27 result and unqualified final
driver. Rollback/New Game remains unproved.

Rust formatting, whitespace and repository validation passed at integration.
The live status records meet their maintenance targets; the protected HANDOVER
suffix remains byte-identical. The merger used no SDK start, browser, native editor,
package, manual CI, push, tracker/PR mutation, cleanup or signing/security change.
Shared SDK use remains Mac 15/20, Windows 6/20, zero reservations. Mac stays stopped
at #106 4/4; handoffs grant no further start. The coordinator resumes sole ownership
for publication, automatic CI, Windows dispatch and a concrete Mac allowance request.
The [#104 receipt-retention limit](#104-receipt-retention-limit) remains unchanged.
#98/#106 and PR #125 remain open/draft; rendered/native/human proof and final
validation selection remain pending.

## Windows #106 completion and Mac approval wait

The coordinator audited the completed producing thread, raw outcome/observer
checks, lifecycle records, cleanup and final manifest readback. Exact published
candidate `9d229ea49da9b140d06fcba69ca568919c556d6c` passed the fresh production
controller's thirteen stages and 284 requests, offline preflight and all 27
selected Windows SDK outcomes with the final vbox driver. Every positive marker
appeared once; the deliberate negative exited one at `_choice106_state(1)` without
an acceptance marker. No child timed out or truncated output.

The independent audit verified accepted controller bytes against both frozen
authored copies, source/adapter/driver identities and each observed process exit.
The save process exited before Load began in a different process. The primary save
and its sync copy retained matching hashes before and after Load. Ordinary Page Up
rollback restored the prior selection state; MainMenu/Start produced a fresh game.
These are actual game lifecycle checks, not dictionary resets or same-process Load.

The first read-only observer assumed one save location and direct byte equality
across Windows log write translation. It was corrected to require the actual
primary/sync pair and reverse the known log translation in memory before checking
the captured output hash. A report reader also needed the actual BOM encoding.
Original data and failed wrappers remain retained privately. No SDK or controller
retry, source change or process termination occurred. The final private manifest
readback passed. Owned SDK/controller scratch and runtime processes are gone;
the assigned branch and registered root are clean at their required candidates.
The #104 duplicate-receipt limitation is unchanged.

[Automatic run 42813998029, attempt 1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/42813998029/attempts/1)
also completed successfully for the PR event and exact `9d229ea4` head. Both
required jobs passed, including 397 frontend tests with zero failures/skips, all
18 browser/dispatch fixtures, the actual Choice and Story controllers, build,
formatting, Help/public-core gates and repository validation. Four executed jobs
succeeded; five unselected specialist jobs skipped. The combined status was success,
with no submitted reviews or inline review findings at the audit. This qualifies
the draft's selected automatic checks, not final native/human acceptance.

Windows #106 used 1/4 selected starts, taking shared Windows use from 6/20 to
7/20. Mac remains 15/20, stopped at #106 4/4; reservations are zero. No further
Windows retry is required. The earlier request for up to two additional Mac starts,
keeping shared use at most 17/20, still awaits Kris's answer. An automated test
completion does not grant that approval. No fifth Mac start or standalone child
has run. The PR remains linked and unwatched after that approval handoff.

This update changes only coordinator records. Windows and CI evidence remain
bound to `9d229ea4` and identical implementation inputs; a documentation successor
does not become that tested candidate. Preserve worktrees and all failures.
#98/#106 and PR #125 remain open/draft. Affected Mac proof, rendered comparison,
native/human evidence and final validation selection remain pending.


## Approved Mac #106 qualification extension

On 2026-11-11, Kris answered "Yes approved" to the request for up to two
additional Mac SDK starts under the corrected qualification plan. This extends
#106 from four to six starts and caps shared Mac use for this extension at 17/20.
Entry use is Mac 15/20 and Windows 7/20, zero reservations. All earlier failures
remain charged and retained. The coordinator owns this operation.

The first additional invocation requires a fresh production-controller export and
offline official archive/fixture preflight, then all 27 picked outcomes including
actual Save/exit/new-process Load, ordinary rollback and MainMenu/Start. A second
start is conditional on a diagnosed failure requiring a correction. The approval
includes no package, native editor, browser or manual CI campaign.

Candidate `ad4c276039c54c288136ee35cef2450b7caa6794` changes only coordinator
records from Windows-qualified `9d229ea4`. Automatic Repository quality run
`42817680459` reports success on this exact head; detailed job audit is pending.
No new SDK start has run when this approval is recorded.

### First additional Mac invocation

Fresh production Story/main to ApplicationHost/core passed thirteen stages and
284 requests, with cleanup and no SDK execution. Offline preflight verified the
corrected driver, fresh accepted source, Mac ARM64 and official Ren'Py 8.5.3 archive
against its published checksum. Pinned Node 24.19.0, npm 11.9.0, Rust 1.90.0 and
complete Python 3.12 were verified.

The coordinator charges #106 start 5 of the approved 6 immediately before invoking
the picked-only qualifier on `ae057e3afc1f31beedbcf7b8c19c025fa7b39e6e`. Shared Mac use
is now 16/20, Windows remains 7/20. This selects exactly 27 outcomes and no native
editor/package/browser/manual CI operation. Its result is pending. The controller
was exported before the approval-record commit; only coordinator documents changed.

## Mac #106 final qualification

The first additional invocation passed on exact candidate
`ae057e3afc1f31beedbcf7b8c19c025fa7b39e6e`. Its only changes from Windows-qualified
`9d229ea4` are coordinator records. The fresh production-controller journey passed
thirteen stages and 284 requests. The driver, qualifier and SDK adapter match the
corrected integration inputs. Offline official archive/fixture preflight passed.

All 27 selected outcomes executed: sixteen compile/lint successes, ten positive
normal-play successes and the intended negative. Every positive marker appeared
once. The negative exited 1 at `_choice106_state(1)`, with the expected failed-test
status and no acceptance marker. No child timed out or truncated output. Unselected
SDK test-runner cases are excluded from these counts.

Actual Save closed its process before the next bounded invocation created a fresh
Load process. The primary and sync save artifacts matched each other and the hashes
checked immediately before Load. The loaded mark remained selectable. Ordinary
Page Up rollback and MainMenu/Start passed all twelve lifecycle assertions,
restoring the earlier state and starting a fresh current game. This uses the
unchanged adapter's new-process/wait boundary; no separate PID observer was added.

The coordinator independently checked every child name, argv, exit, duration,
marker, source/driver/authored hash, save/load hash, lifecycle assertion summary and
scratch removal. The receipt reports cleanup complete, with no native editor
launch. A 42-entry private evidence manifest passed readback. The producing-host
receipt, raw logs, frozen controller export, ledger and audit remain retained
outside Git. Earlier failed receipts and the #104 duplicate-receipt limit remain
unchanged.

Mac #106 used 5/6 total starts, including one of the two newly approved starts.
Shared use is Mac 16/20 and Windows 7/20, zero reservations. The second approved
start remains unused; success does not call for another run. No product source,
fixture, adapter or schema change was needed.

The coordinator also audited automatic run `42817680459`, attempt 1, on exact
`ad4c2760`: 397 frontend tests passed with zero failures/skips, all eighteen selected
browser/controller fixtures passed, production build and Rust formatting passed,
and repository validation passed 1,890 files. Four executed jobs succeeded and
five unselected specialist jobs were skipped. This qualifies the selected draft
automatic checks, not final native/human acceptance.

#98/#106 and PR #125 remain open/draft. Publish this result without replaying SDK
for coordinator-only changes. Audit successor CI; rendered comparison, native/human
evidence and final validation selection remain pending.

## Final coherent-candidate qualification selection

The coordinator audited exact-head Repository quality run `42897808214`, attempt 1,
on `f395f158cbb6df11eb733316cf6ccc4c498c1d10`. The tested PR merge was `d77140a`.
All four executed jobs succeeded; five unselected specialist jobs were skipped.
Logs confirm 397 frontend passes with zero failures/skips, all eighteen selected
browser/controller fixtures, production build, Rust formatting, offline Help/core
checks and repository validation over 1,890 files. The finish reporter published
`Loomlight validation: success` for that exact candidate. Earlier duplicate run
`42897755145` also completed successfully. There are no submitted reviews or inline
review threads in the audit snapshot. This does not establish unselected native or
human acceptance.

Under the selected #98 implementation and WORKFLOW's coherent-candidate milestone,
choose one final `production-scaffold.yml` invocation, including expected failures.
Its existing Preflight, Windows x64 and macOS ARM64 jobs are required in the branch
validation plan. Request success-only package upload for prepared human review.
Use the existing workflow unchanged; do not replay protected historical native
sessions, credentials or unrelated local profiles. CI packages do not establish
approved local Mac signing or human input.

One platform job is one coordinated final SDK/package campaign, with its existing
compile/lint/runtime/probe children retained individually. Reserve one shared SDK
place per target before dispatch. Entry use is Mac 16/20 and Windows 7/20; if both
target campaigns start, use becomes Mac 17/20 and Windows 8/20. The selected ceiling
is one invocation per target, with no automatic retry or replacement campaign.
An uncertain dispatch retains reservations until its actual execution is resolved.
A preflight failure consumes the CI invocation but consumes no target SDK start
if evidence confirms neither platform campaign executed. This does not spend or
renew the unused conditional #106 correction start. Any further Mac SDK operation
requires reassessment against the approved shared 17/20 bound.

Before dispatch, finish the covered Choice-control comparison using approved
Combined v1 source `6ecf6470` and an actual-core accepted workspace at the current
production source. Use dark 1100 by 720 at scale 1 for both references; check the
current controls at 720 by 850 too. Preserve the approved reference and record
workspace-layout/palette differences as #110 scope, without claiming full Combined
conformance. This browser check supplies rendered, synthetic-input evidence only.
Native physical-input/human evidence remains a separate open gate.

### Rendered finding and design handoff

The pinned reference's normal approval guard admitted exact Combined v1 source
`6ecf6470` and its recorded fingerprint. Current production `f395f158` rendered
an accepted real-core public workspace. Checks found all three Picked options
values, simultaneous narration prompt, three option controls and all four Then
endings, with zero mutation calls, runtime errors or horizontal overflow at dark
1100 by 720 and 720 by 850, scale 1. These are synthetic Chromium checks only.

Inspection of all three captures found a blocking preview readability defect.
The fitted game canvas is about 110 pixels high. The Choice prompt and unknown
picked-state/option text overlap the existing unknown-state notice and are clipped.
The presence/overflow checks do not establish readable presentation. The reference
used its original sample rather than identical content, so matching-content visual
conformance also remains incomplete. Full Combined workspace/palette differences
remain #110 scope; this new finding concerns the selected Choice preview.

The coordinator retained three private preparation/check failures: missing reference
captures, a copy placed one directory too high, and a nonexistent option selector.
After reassessment, offline approval loading verified exact paths/fingerprint; the
captured DOM identified the actual selector. The corrected check completed. All
owned browsers/servers closed. No product source, SDK, native app or package ran.
Private raw evidence, captures and an independently read-back manifest are retained.

Under Kris's standing authorization, the separate chat "Choice Spec - readable
Choice preview" is preparing several narrow corrections for his approval. It is
based on `f395f158`, owns only new draft/approval evidence and must return the
approved source/captures before coordinator implementation. Existing approved lab
source and production remain unchanged. The package campaign is selected but
**not reserved or dispatched** until this correction is settled. Shared SDK use
remains Mac 16/20 and Windows 7/20, zero reservations. #98 and PR #125 stay open/draft;
the then-pending preview correction and final qualification remained open. The
approved integration and current next action are recorded below.

## Approved A v2 integration and final CI reservation

Kris approved A v2 with "Sure approved" on 2026-11-11. The owning
[handoff](../../design/choice-preview-correction/HANDOFF.md) and typed approval
select `dock-v2` / `dock-refined`, reviewed source `7ba6eea4` and fingerprint
`9d62ff5224e47e8a505fe9467366b40fca66cf7a9c57a9b1bdfad59f18e99c54`.
Design delivery `95778e4a` was merged normally as `6f61babd`; it contained only new
prototype/design files. The coordinator independently verified the pinned working
fingerprint and all six capture hashes/dimensions. Existing Combined v1 source
and approval remain unchanged. Three exported HTML documents gained final newlines
for repository admission; prototype source and retained PNG bytes are unchanged.

Production `ffefe1fc` moves Choice text into one scrolling summary beside the
existing Game canvas. It reuses the existing preview projection and media owner.
Prompt, unknown picked state, configured policy and numbered duplicate options are
separate. Conditional rows say "Condition unknown" and retain false-policy hover/
accessibility text. Show normally has no picked-state row; absent prompts leave no
empty row. The superseded in-canvas Choice overlay and its consumers were removed.

The two-axis review found two Standards P2s (a stale Story controller consumer and
fixed text sizes bypassing Interface size) and one Spec P2 (the old long-caption
browser consumer). `075a6648` corrects them. Summary text now scales relative to
the user's interface size while preserving A v2 at the default setting; the
approved other-character notice stays 11px. A fresh follow-up Standards review
found none. Follow-up Spec found a premature Character-creation wait matching
review text; it now requires the new visible enabled character entry after mutation.
No review finding remains open. Original reports and dispositions are retained.

The required broad browser preflight exposed pre-existing superseded Character
catalogue assumptions. The fixture now supplies the current reference workspace
and explicit source-review creation, routes appearance checks through Game setup,
uses current three-field Variable rows/eight navigation destinations, and intercepts
`insertBodyBeat`. Obsolete catalogue-only assertions were retired; the current
Reference owner's fourteen DOM tests remain. Shipped probe lookups now distinguish
visible enabled controls, modal-owned fields and the visible shell Source Save;
readiness observes the current form before input. Character Edit has a specific
accessible name and new game-character technical fields reuse the existing input
helper. Game setup uses the bounded catalogue cache per Character so manual
appearance selection survives Save, default changes and view reopen. The native
UI probe follows Review source then explicit Create, with acknowledged completion.
No source-review requirement, refusal, lease or security gate was weakened.

Local evidence:

- 398 frontend tests passed, with zero failures/skips. The focused preview/Story
  renderer set passed 58; smoke-report and Reference tests passed eighteen together.
- The Choice public-main/controller journey passed thirteen stages and 284 requests.
  Full Story controller passed all ten cases, two normal/reaped process exits and
  cleanup. These exercised preview inputs; later gate fixes affect the Character/
  probe routes. Automatic CI will provide fresh exact-candidate controller proof.
- Eight matched A v2 samples at dark 1100 by 720 and 720 by 850, scale 2, passed.
  Content and 110px allocation match the pinned reference. All short options fit;
  long-text endpoints are keyboard reachable. No text overlap, horizontal overflow,
  source mutation or page error occurred. Small/default/large interface settings
  scale summary text. Background cover, transparent Character contain/right placement
  and the 16:9 Game canvas passed a separate real-media renderer fixture. Minor
  production frame-border differences remain; full Story #110 is not claimed.
- The complete `npm run test:source-browser` passed all five required scripts,
  including shipped probes, retained Source input, long Choice summary, current
  Character appearance/default/reopen and pending-Beat duplicate prevention. This
  is Chromium/fixture evidence, not packaged native or human acceptance.
- Frontend build and repository validation passed. Failed setup, stale-fixture and
  observation attempts remain in named private logs; no required failure is counted
  as a pass. A sandbox Vite cache write refusal was resolved with scoped execution.

Core, source schema, authored runtime templates, Choice SDK fixture/qualifier and
SDK adapter are unchanged from the both-target picked-state proof. This integration
used zero SDK starts, native editor/package launches or manual CI runs. Shared
consumption remains Mac 16/20 and Windows 7/20.

Reserve one place per target for the selected single coherent-candidate
`production-scaffold.yml` invocation, with success-only package upload. There are
now two reservations: Mac 16 consumed plus one reserved, Windows 7 plus one reserved.
If both target campaigns execute, totals become Mac 17/20 and Windows 8/20. The
one-invocation limit and no-automatic-retry selection remain binding. Do not use
the unused conditional #106 correction start for another purpose. Capture exact
head, run/attempt and job identities after dispatch; resolve ambiguity without
duplicate dispatch. Publish final CI receipts on the issue, avoiding receipt-only
commits. Retain the linked PR watcher for the combined selected status while waiting.

#98/#106 and PR #125 remain open/draft. Final Windows/macOS package qualification
and native/human acceptance remain pending. Local rendered conformance to approved
A v2 is established within the stated fixture/media limits; it does not complete
full Story #110 or grant release/merge acceptance.

## Final package CI failure and core correction

The selected `production-scaffold.yml` campaign ran on
`7abb9cafd72ef6205fb29108b1eb9d32216f5fd5`, run `42914123530`, attempt 1,
with success-only package upload. Preflight job `130172011383` passed. Windows
x64 job `130173996551` and macOS ARM64 job `130173996427` failed core tests.
Mac reported 681 passes, nine failures, 63 ignored and three filtered; Windows
reported 672 passes, ten failures, 60 ignored and three filtered. SDK setup,
runtime gates, package builds and packaged probes never ran. Later missing-report
failures are consequences of that early stop. The finish reporter correctly
published failure. No package artifact was produced.

Both platform jobs started, so both reserved campaign places are consumed even
though no SDK command ran. Shared consumption is **Mac 17/20, Windows 8/20, zero
reservations**. Final campaign use is **1/1**, exhausted. The initial commentary
that retained the pre-run totals was corrected after checking the selected unit.
No retry, replacement dispatch or use of the unused conditional #106 correction
start is authorized. A further package campaign requires Kris to change this
allowance and reassess the shared Mac bound.

The nine common failures have two causes:

- Stale fixtures assumed only dialogue could have a branch owner, treated every
  header as a condition, or created Choice flow through the retired destination
  representation. Tests now select dialogue explicitly when editing it, preserve
  all owned identities when checking root edits, admit synthetic schema 3 with
  its original unowned trivia, and construct option-body Jumps through the public
  body command. Exact bytes, history, reopen and refusal assertions remain.
- A product bug in Continue Scene scanned nested terminal payloads as if they
  terminated the root body. A newly represented option-body Jump therefore
  removed otherwise valid root anchors. The root-terminal scan now considers
  root statements only. Adjacent opaque/nested refusal, the required root terminal,
  bounded generated fields and AI exclusions are unchanged. The existing public
  preparation test catches the bug and now checks all four exclusion markers.

Focused local verification passed eight Source-foundation tests, thirty Phase 3A
tests and the exact public flow/reopen test. The one ignored SDK gate in each
filtered set was not executed or counted as a pass. Broad local core verification
is pending at this checkpoint.

The Windows-only tenth failure is still unresolved. The controlled timeout-helper
test reported complete cleanup and exit 0, but `cooperative: false`. No shutdown
threshold, acknowledgment requirement or assertion has been weakened. Diagnose on
the connected Windows host through the existing assigned checkout, with ordinary
controlled-child tests only. That diagnosis has no SDK/native/package authority.

An initial broad local core command accidentally included the two unignored SDK
installation gates excluded by CI. It was cancelled before either archive payload
was promoted to its validation destination. Both owned staging markers and partial
payload inventories prove neither reached SDK validation/execution; no owned
process remained. Private evidence retains the cancelled log and audit, and owned
temporary trees were removed. This incomplete run is not a pass and consumed no
SDK start. The corrected command unsets SDK settings and uses CI's three exclusions.

Native/human and final package acceptance remain pending; #98/#106 and PR #125
remain open/draft. Preserve earlier failures, approvals and protected recovery.
