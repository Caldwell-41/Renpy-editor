# Current outcome handover

## Phase 3A resumed — early SDK gate failed; bounded correction authorized

Phase 3A is **ACTIVE — INCOMPLETE**, explicitly resumed on 2026-10-13. Phase 2 stays
**PAUSED — INCOMPLETE** and requires its own separate resume. The user authorized
GPT-6.1 Sol High delegated implementation, validation and independent review, routine
slices and reviewed pushes to `codex/phase3a-story-logic`; no merge or release. The
orchestrator must not poll CI. Delegated monitoring of selected runs is authorized.

Root was clean at `1bdc532`, matching the remote branch. Its successor changes after
reviewed candidate `81ee770` are pause documentation only. Preserved detached worktrees
`phase3a-core` at `e97be13`, `phase3a-renderer` at `52c238c`, and `phase3a-validation`
at `3a3dabd` reconcile with integrated product work. Keep the Phase 2 branch and
unrelated planning worktree (two unpublished commits). Never reset these to old prompts.
Root owns canonical status/task documentation and integration; shared-interface writers
remain serial. The repository-local noreply identity is intact.

### Exact existing CI1 audit

Delegated validator audited [run 38346032499](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38346032499),
attempt 1, exact `81ee770dac70181832b0020984545621ee403d9d`, tree
`1046286ce44b6f4c46892ed86dbe4a24e6744e51`. It ended **failure** at
2026-10-13T04:27:07Z. Required Windows `115127555940` and Mac `115127555751` both
failed SDK execution; excluded jobs are not passes. No redispatch occurred.
Both targets passed 17 named core/preflight checks, seven renderer cases, typecheck,
test compilation and renderer build. ZIP CRCs/39 files/38 manifest hashes, all 179
candidate input blobs, architecture, operation counts and privacy scans were audited.
Ignored `.toolchains/phase3a-validation/ci1-audit/` retains full metadata, logs, exact
ZIPs/extracted artifacts and audit code/results. Artifacts expire 2026-10-20;
exact IDs/hashes/expiry and failure receipts belong in the
[resume ledger](../tasks/active/phase-3-initial-wysiwyg-release.md#resume-and-exact-ci1-failure-audit--2026-10-13).

Four cases per target (`conditions-low/high/boundary`, `nested-call-return`) timed out
at driver line 29's bare `advance` while the game was at its menu. Each passed all
13 preceding route/value/Call-depth/return assertions. The all-false continuation
passed; the wrong-result fixture rejected the intended assertion. Terminal SDK records
retain `passed=false`, six cases, 12 adapter spawns and all selected operation limits;
owned cleanup, metadata absence and accepted source preservation passed. A complete
SDK report is absent. The early gate therefore remains **failed**, with no 3A acceptance.

Independent Sol High review identified the pinned SDK driver mechanism: bare advance
waits for a new dialogue callback, which a choice screen does not produce. The minimal
repair awaits and asserts the choice screen before the existing route click and keeps
ordinary advance for no available options. No production fix or threshold relaxation
is selected. The validator prepared this repair plus shared zero-SDK driver preflight in
the preserved validation worktree; independent diff review is clear. The sole changed
file is `app/src-core/src/renpy/tests/phase3a.rs`, committed in the
validation worktree as `671036a` and integrated as `b5fa01a`. Approved local round 5
passed locked gate compilation and exact zero-SDK preflight (one pass). No local SDK
operation, native start or redispatch has run; corrected paired CI2 is next.

<a id="ready-to-paste-restart-prompt"></a>

### Continuation, budgets and remaining acceptance

Counts do not reset: first core slice 8/8, calls/flow 4/6 (**12/14 cumulative**),
renderer compatibility **4/4**, local validation **5/5**, paired CI **1/3**,
packages/owner native starts/live model calls **zero**. The earlier broad 318-pass/two-
failure run, obsolete-contract correction and unexplained descendant-cleanup failure
with exact serial passes remain in the task ledger. No previous failure is erased.

The user explicitly approved **one additional focused local validation round**
(cumulative 5/5; passed) for generated-driver zero-SDK preflight and changed Rust gate
compilation. The concrete correction is independently reviewed. Do not exceed this added
round; preserve any failure and escalate a further exhausted-budget decision. CI2 fits
the existing paired allowance after reviewed publication; retain six runtime cases,
12 spawns and exact candidate/artifact audit. No blind rerun or ordinal reset.

Only after corrected early SDK proof implement structural commands and then full
Story controls. Read-only core preparation agreed explicit `BodyRef` (root/branch),
`NodeRef` (Beat/whole condition), immediate-sibling `Position`, expected ownership and
revision envelopes. Preserve whole-subtree identities, safely qualified indentation,
canonical empty-body pass, delete versus selected-branch unwrap and transaction/history.
Close later Jump/Choice recursive-Call authoring while allowing pure Jump loops. The
remaining two core invocations can cover the first decisive structural checks;
four more were proposed for review corrections/full coverage and remain unallocated.
Renderer controls need their own finite slice selection; compatibility rounds are spent.

Remaining acceptance includes typed builder, nested insert/edit/move, Else If/Otherwise,
Call and guarded Choice editors, explicit parent destinations, collapse/draft protection,
manual illustrative preview and coherent Branches navigation. Prove the actual frontend-
to-core path, retained drafts and ordinary external-edit refusal, source/history/reopen,
save inside a callee and return after a safe surrounding edit on both targets. No package
or physical native UI proof is claimed by Chrome/DOM/native-service evidence. Phase 3A
must not be completed until its own acceptance is satisfied. 3B/3C remain unselected
and retain accepted Phase 2/3A entry requirements.

Development stays on macOS; affected Windows/macOS automated proof uses focused CI.
Escalate named capability gaps or exhausted budgets; continue routine authorized work
without checkpoint approval. Root documentation records the resumed state and passing local correction. Preserve
exact corrected CI2 candidate/run identity after delegated dispatch; docs-only successors
do not replace its tested inputs.

## Preserved Studio UI refinement — review_ready; guided feedback paused

The bounded refinement is delivered on `codex/provider-qualification`, source
462cf0897eb84d34390d68634f0b8cb2345d7a48/tree
d3dfeace9ad1493bb42395305ab0f6d210ce13c4. The user approved the imagegen direction
and two extra browser attempts, then requested **“Audit CI and continue”**. State
`review_ready`; no pending workflow, test, app or following session. Docs-only closeout
successors record the verified source and do not become new product inputs. macOSARM64
remains the implementation owner. No open PR was found; no merge/release occurred.

**Implemented:** grouped Settings Connection/Saved key/Response defaults, advanced and
maintenance disclosure, reachable Save and profile draft/busy guards. Field completion/
submission validation preserves input and focuses errors. Assist has captured target/
stage/header, scrolling body/reachable stage-specific actions, full-width Task, disclosed
additional limits, visible send decision context and complete exact body. Proposal prose
leads Source/metadata review. Proposed card/lore comparisons precede frozen fields and
retain exact revision approval, status and stale-support refusal. Selection highlights,
tab associations/arrows/Home/End and deliberate focus entry/return are explicit. Async
completion moves focus only inside Assist; unfinished polls preserve it. Core source/
transaction/history/native credential/storage/signing code is unchanged. Existing probe
selectors were updated for exact-change details and **Apply and save 1 change**; frozen
packages/evidence remain intact. [Canonical UI contract](../UI.md#studio-assistance-refinement--2026-10-13-scoped-portable-proof-passed)
and [approved concepts](../design/phase-2-llm/studio-refinement-2026-10-13/README.md) explain behavior.

**Exact CI1 audit:** [run38324391511](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38324391511),
attempt1/workflow_dispatch/exact462cf08, completed success2026-10-12T23:57:35Z.
Required Windows115059587083 and Mac115059587332 passed every selected step. Unrelated
jobs intentionally excluded, not required passes. Each target: typecheck/test compile/
production renderer build,32DOM passed0failed/cancelled/skipped,36renderer captures,
0runtime errors/page-wide overflow and every recorded Assist primary visible. Actual
controller/native service five-action/selectable/exact-send/approval/staleness/zero-write
refusal/valid partial subset/protected-custom source/Undo-Redo/project-process reopen/
zero reopenHTTP/owned cleanup pass. Both privacy scans passed41files.

ArtifactW11780670629 ZIPsha25634b64d18a8f30741ca5c0c9a57c8fe9c2a8ebeb61ba0f368b2675325938849f1;
M11779794670 ZIPsha2567cfe0647dfadfcf8c0993b7cd2eac7efe40337f0c2c8a0ea343a3f422f943b2d.
Exact ZIP/extracted contents/43-file manifests/candidate/tree/allPNG dimensions-CRCs-
decoded data/eight fixture-source hashes verified. Artifacts expire2026-10-19T23:56:53Z/
23:56:05Z. Ignored `.toolchains/phase2-ui-refinement/ci1-audit/` retains ZIPs, metadata,
logs, audit.py/audit.json. Owner viewed12representative actual images; the same requested
Sol6.1/high agent independently audited evidence and six representative images across
both hosts/themes/layouts/surfaces. **No supported remaining blocker**. Final nonmodal/
unfinished-poll focus regressions pass both hosts. Details in the [delivery ledger](../tasks/active/phase-2-initial-llm-assistance.md#ui-refinement-ci1-terminal-audit-and-delivery--2026-10-13).

**Evidence limits/counts:** Chrome renderer fixtures, programmatic DOM focus and native
service integration do not establish new packaged Tauri/WebView physical input,
screen-reader behavior or human acceptance. Fixture navigation is schematic; compact
reference approval is reached by scrolling the comparison. No new editor package/native
UI proof selected; unchanged core/credential/SDK guarantees reuse frozen qualification.
Counts remain pairedCI1/2,local3/3,browser5/5,images2/3,signed builds0/2,editor starts0/4.
Three earlier browser preparation failures, first DOM assertion failure and later test
compile failures retain their actual outcomes. Local rapid-resize image/metric limits
remain historical; settled exact CI inputs establish current renderer evidence. Unused
allowances are not reasons to execute or transfer automatically to another outcome.
No further refinement CI is needed; repository/diff validation covers docs closeout.

**Phase 2 resume:** the separate [guided-feedback prompt](../tasks/active/phase-2-initial-llm-assistance.md#prepared-guided-feedback-session--not-started)
is prepared with status `not_started` and paused by the latest user direction. Wait for
the user's explicit Phase 2 resume/selection; do not create/start
a chat/session, launch an app or request acceptance automatically. Default feedback can
use current public-fixture screenshots. The installed frozen929 app is older UI and must
not be presented as refined. A matching-build native feedback/test route needs its own
selected scope/allowance; unused refinement package/launch counts do not authorize it.
One plain-language question at a time; record preferences separately from defects and
explicit acceptance. Do not silently begin fixes or live sends. This next-session prompt
is preparation, not execution or proof of final human acceptance.

## Preserved Studio-only technical closeout — review_ready

Frozen product929af6f23f1fe79af2665a4cc71c276a64ffd80d/tree
9f034ca6cae69ef11e87d6a95a332152a9998eaa/269input digest
3c244dc28f7a4fd201ffd00b92d0df462aa2429c4d2139cf10adf6e91f97a1bd;
behavioral baseline5f593225fad2ebdb2970663d56ee83631b27ecef. External driver30b18f2
is distinct from packaged product. [Frozen CI9run38317425509](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38317425509)
passed exact manifests/nine Windows stages/native screenshots/normal exits/synthetic
POSTs/cancelled socket/zero save-reopenHTTP/source-profile preservation/owned cleanup.
Its artifacts expire2026-10-19; ignored closeout evidence retained. CI1 and signed owner
Mac all-five/live/reference/source/history/reopen/nativeSDK05 remain valid for unchanged
inputs. Exact hashes/receipts/historical CI2–8/send7 failures remain in the [technical
closeout](../tasks/active/phase-2-initial-llm-assistance.md#ci9-terminal-audit-and-scoped-technical-closeout--2026-10-13).
LiteralIPv6HTTPS unsupported; owner liveTLS unmeasured. Ordinary saved Studio profile/key
is untouched: never ask again while configured or read/export/erase it. No paid/live
sends, discovery/model installations, generic providers/Phase3, route context, AI ending/
connection, thinking/streaming expansion, signing/storage changes, merge or release.
