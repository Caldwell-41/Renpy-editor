# Testing delivery policy and active-instruction alignment

**Updated:** 2026-09-28.
**Scope:** Adopt the approved retrospective operating rules; then, only if selected,
audit the current Phase 1G branch for outdated active testing instructions.
**Branch/PR:** feature/phase-1g-branches-runtime / draft PR #17.
**Rules:** [WORKFLOW](../../WORKFLOW.md#proportionate-delivery-rules).
**Continuation:** [HANDOVER](../../status/HANDOVER.md); one live handover only.
This is a bounded policy-migration task, not a new test framework or CI programme.

## TEST-POLICY-1 — rules implementation

**Authority:** the user approved implementing the seven rules, adding machine guidance
to generated goals, updating the repository and reviewing the commit against this
conversation. **State:** `review_ready`; workflow/test migration remains outstanding.
No new runtime qualification, builds, installs, CI, merge or specialist tests selected.

Incoming branch `ba403d38853c5625089216c59c6e175eac741ed6`, main
`4d7ba0333c48d60242a9a42d3e079fea499a5531`, existing open/conflicting draft PR #17
were inspected through GitHub. No newer published implementation or matching competing
rules task was found. Other branches/abandoned PR #12 are preserved. This environment
cannot inspect another machine's unpublished work. Recheck the branch before publishing
and use a non-forced descendant update; never replace a newer remote head.

### Conversation coverage

| Approved decision | Implementation |
| --- | --- |
| Match guarantees to the action; preserve data-loss protections | WORKFLOW rule 1, ADR 0010 retained |
| Prove risky real paths early on affected platforms | Rule 2; targeted agent-owned tests, not a matrix for every edit |
| Test actual user actions and prove gates reject failure | Rule 3; focused real integration, no wholesale unit-to-E2E duplication |
| Classify product/harness/environment/evidence/requirement failures | Rule 4; uncertainty and distinguishing experiments required |
| Budget each problem across chats and renamed checkpoints | Rule 5; two failed corrections of the same hypothesis trigger reassessment, never an automatic retry allowance |
| Align docs and executable gates; retain failed executables/evidence | Rule 6; migration gaps remain explicit and block conflicting commands |
| Evidence-based new blockers and clear status | Rule 7; ordinary data-loss/privacy defects can still block without a numbered requirement |
| Keep Codex where convenient; select test hosts separately | Host-routing section; Actions when sufficient, actual native app when needed |
| Tell the user when a particular machine is needed | Every copyable goal includes Codex machine, test execution and reason; required versus recommended is explicit; material access gaps disclosed |
| Minimal user physical testing, portable tooling and disposable data | Agent-owned routine verification, focused final human session, project-local tooling where feasible, isolated test projects/profiles |
| Short prompts and simple repository-first process | Maximum 4,000 characters; existing ledger/workflow, no new orchestration/approval framework |
| Preserve previous corrections and truthful historical results | Heap/cancellation regressions retained; no cross-SHA waiver, historical FAIL/skip remains unchanged |

Changed paths: AGENTS.md, docs/WORKFLOW.md, docs/status/CURRENT.md,
docs/status/HANDOVER.md and this task. The older detailed CURRENT summary is consolidated
into its existing Phase 1G evidence ledger references, with the original available in
Git history. No historical ledger content or test source is rewritten. INDEX already
routes WORKFLOW, CURRENT/HANDOVER and active tasks; no second canonical policy is created.

### Validation and review record

GitHub file/ref/PR reads succeeded. A local clone attempt failed because this execution
host could not resolve github.com; publication uses the available GitHub connector.
The review workspace is a changed-document snapshot, not a complete repository checkout.
Baseline AGENTS and WORKFLOW bytes were reconstructed and checked against their exact
Git blob hashes before editing. Local checks cover changed-document UTF-8/final newlines,
whitespace, balanced fences, new internal anchors/link targets, prompt length, policy
coverage and changed-path scope. All five documents and 26 relative link/anchor checks
passed; the goal template is 494 characters / 65 words. The local whitespace checker
initially treated `git diff --no-index`'s ordinary difference exit as a failure; it was
corrected to check diagnostics, then passed with a failing trailing-space text control.
These focused checks do not constitute the full repository validator.
No product/toolchain/SDK test, build or native launch occurred. Existing Q0 validator
results belong to Q0, not this edit. Publish with `[skip ci]`; a skipped workflow is
not passing qualification. Verify the published commit content/parent/ref and inspect
its diff before reporting completion; correct actual omissions rather than creating
receipt-only commits. The final chat reports that post-publication assessment.

## TEST-AUDIT-1 — selected documentation and selector audit

**Authority/state:** the user selected TEST-AUDIT-1 only on 2026-09-28;
`review_ready` after document/selector checks. Documentation corrections and a concrete qualification proposal are
authorized; test/workflow implementation and qualification execution are not.
Fresh feature refs were fast-forwarded from `4470e3a` to
`109417800873a464dd7da5f9d9571c00a9f9c447`, preserving all 14 newer commits.
The local checkout was clean; the historical G1-O1 worktree remains untouched.

**Codex machine:** Any with repository access; no specific OS required.
**Test execution:** Source/documentation/selector inspection and cheap document checks
only; no native application test or CI dispatch. A checkout is useful but GitHub reads
can support the review. Record unavailable full-checkout validation honestly.

Review the current feature head, AGENTS/WORKFLOW/TESTING, CURRENT/HANDOVER, the active
1G/1H/parent-plan instructions, ledger 34 and the actual workflow/embedded SDK selectors.
Use focused searches; do not reread every historical ledger or modify all old branches.
Classify each active instruction as keep, update, retire from routine selection,
specialist-only or historical evidence, with its user-facing requirement and test layer.
Record discrepancies in a short table with path/section, reason and proposed correction.

Priority checks: broad core/SDK commands containing excluded deliberate crash/namespace
exercises; obsolete full-current-disk graph proof; superseded Chrome timing blockers;
old diagnostic rerun requests and exhausted budgets; push-triggered expensive matrices;
missing failure-time executables; unimplemented evidence reuse; native/human ownership;
short machine-aware next prompts. Keep ordinary recovery/external-writer, heap-buffer,
cancellation/Stop, Source Save/draft and functional regressions, plus legitimate final
package/native gaps. Runtime-error scenario coverage is not automatically the same as
a deliberate application-crash experiment; inspect behavior before classification.

Correct clearly obsolete live documentation within that selected review scope. Mark
superseded directions and append the disposition to the owning active ledger; preserve
old runs, failures, candidates and evidence bytes. Do not rewrite historical failures
as successes or assume every old test should be removed. Do not impose retrospective
new integration tests on every completed feature without a demonstrated coverage gap.

Deliver one amended, bounded qualification preparation/execution proposal with exact
routine/specialist selectors, host choice, retained regressions, prerequisites, budgets
and publication/evidence requirements. Separate approved requirements from proposed
workflow/test changes. Q1's default remains both standard packaged targets and its five
existing runtime cases; changes need an explicit evidence-based decision, not a silent
waiver. Carry useful local evidence forward without repeating unrelated experiments.

**Stop boundary:** review/documentation only. No product/test/workflow implementation,
new tooling, package build, app launch, CI, hostile/crash execution, conflict resolution
or merge. Selection of TEST-AUDIT-1 does not select Q1. Update this ledger and the single
HANDOVER with results and one machine-labelled next goal; execution remains separate.

### Audit findings and live-document disposition

Reviewed on the complete Windows checkout at `109417800873a464dd7da5f9d9571c00a9f9c447`.
Fresh remote main remains `4d7ba0333c48d60242a9a42d3e079fea499a5531`;
PR #17 is draft/open/conflicting. PRs #10/#11 and abandoned #12 remain untouched.
Remote main's branch API reports no required status checks; active ruleset `23226859`
contains deletion/non-fast-forward restrictions, no required-check rule. Recheck at
execution/integration; this observation never authorizes a bypass. No newer feature
run appeared in the recent-run inspection: H1 and R2-P1 remain terminal FAIL.
Another machine's unpublished edits cannot be inspected here.

| Active location / request | Disposition and requirement / layer | Correction or proposal |
| --- | --- | --- |
| AGENTS command list; TESTING scaffold; 1G section 9 | Update: broad core includes excluded persistence-crash experiments | References now warn against unaligned broad execution; exact migration below remains proposed |
| TESTING 1B/1C milestone text; parent 1B/1C and 1H section 3 | Update: reliable save/restart is required, deliberate termination/timed namespace execution is specialist-only | Use real-service non-crashing fault/state recovery fixtures; preserve historical results and protections |
| 1G section 4, parent 1G, 1H graph rows, ADR 0010 | Keep: last-observed graph, independent navigation/write authority, G1-U1/U2 and native G1-V2 | Full-current-disk/second-pass proof stays retired; G1-O review/experiment files already carry historical banners |
| TESTING Branches timing interpretation and H1 diagnostic directions | Update/retire from routine selection: Chrome thresholds are diagnostic under TEST-P2 | Correct stale blocking language; old H1 controls/reruns are historical, budgets consumed; native Windows evidence remains open |
| `production-scaffold.yml` broad core and SDK lifecycle gate | Update proposed: required ordinary regression without embedded specialist work | Four termination parents plus embedded SDK blocks need separation; marker success must prove actual execution |
| `quality.yml` ordinary flow-profile selector | Update proposed: same core policy applies even without packaging/SDK | Align with production exclusions; do not dispatch this as an alternative while it contains the same gap |
| Production broad core plus isolated G1-U2 | Update proposed: one enforced three-sample set per target | Skip the fixture in broad core; currently it runs there and again in the isolated step |
| `quality.yml` candidate proof / H1 selector; `flow-profile.yml`; `runtime-foundation-r1.yml` | Specialist-only or historical/explicit diagnostic selection; no routine repeat | Preserve retained tooling/counterexamples; select none for Q1. R1 controlled exit/Stop tests remain ordinary, not a new native experiment |
| Production main push trigger and success-only bundle upload | Update proposed: cost control and reproducible failure evidence | Manual-dispatch-only production; retain exact produced executable on failure separately from installers |
| TESTING/1G/1H reuse and human ownership | Keep: no cross-SHA automated waiver; final native/human gaps remain | Agent owns routine verification; one prepared final human session per OS, narrow unchanged-human-evidence reuse only |
| Ledgers 23–34 and archived records | Historical evidence | Preserve exact candidates, FAIL/skip/missing artifacts and limits; append section 35 rather than rewrite ledger 34 |

### Selector disposition

This is a **source audit**, not a compiled test listing or test pass. Proposed names
below do not yet exist where marked new. Do not use an exclusion list as permission
to run today's embedded SDK gate. The future migration must prove actual per-target
selected/ignored/filtered counts, not infer them from source or test-name greps.

**Specialist-only parents to exclude from routine core and preserve intact:**

- `transaction::tests::process_termination_at_each_persistent_boundary_is_recoverable`
- `transaction::tests::streaming_process_termination_at_each_persistent_boundary_is_recoverable`
- `transaction::tests::prepared_process_termination_can_be_safely_abandoned`
- `lifecycle::tests::recent_crash_checkpoints_restart_from_a_complete_store`

Each deliberately exits a persistence worker mid-operation (codes 85/86/87). Propose
explicit reasoned `#[ignore]` on these four parents; keep their already-ignored workers
`transaction::tests::{crash_worker,streaming_crash_worker}` and
`lifecycle::tests::recent_write_crash_worker`. Specialist replay is one full parent
name with `cargo test -p loomlight-core --release --locked <full-name> -- --ignored
--exact --nocapture`, only in a separately selected specialist task. Never select
`--ignored` without one reviewed exact test; workers are not independent acceptance.

Keep the 17 existing ignored ADR 0010 timed namespace cases in `transaction/tests.rs`
and `lifecycle.rs`, ignored `g1_o1` cases in `transaction/tests.rs` and
`scene/tests/candidate_proof.rs`, and one-shot native case in
`transaction/tests/native_boundary.rs` excluded. No privilege setup, deletion or
reenabling is proposed. Static before-call path/link/identity refusal remains routine,
including `anchored_recovery_enumeration_rejects_path_substitution`, the non-`g1_o1`
`observation_reader_*` cases and baseline Recent/SDK symlink/reparse refusals: these
represent invalid retained state between calls, not a hook timed at a privileged syscall.
Ordinary `delete_and_recreate_race_is_preserved`, final-window external writers and
launch-versus-import ownership interleavings also remain; no substring `race` ban.

**Embedded SDK split, proposed test-only change in `lifecycle.rs`:**

| Existing block | Proposed selection and retained behavior |
| --- | --- |
| `official_sdk_phase_1c_target_gate` calls `crash_managed_sdk_install` before/after promotion | Move both calls/recovery assertions to new ignored `lifecycle::tests::official_sdk_managed_install_crash_recovery_specialist`; keep `renpy::tests::managed_install_crash_worker` ignored |
| Same gate's `anchored-child-test` and `inflight-child-test` stage replacements | Move intact to new ignored `lifecycle::tests::official_sdk_stage_namespace_specialist` |
| Ordinary remainder of `official_sdk_phase_1c_target_gate` | Keep existing exact name; fresh verified SDK install/reuse, provenance/trust-before-spawn, static identity refusal, Git environment isolation, real create/author/Source Save/reopen/metadata-free compile/run remain |
| `renpy::reconciliation_tests::official_sdk_download_handoff_target_gate` | Keep exact ordinary selection: download handoff, quarantined stale state, verified reuse; no deliberate crash or timed namespace block found |
| `lifecycle::runtime_tests::runtime_official_sdk_service_gate` and `runtime_diagnostics_sdk_gate` | Keep each full exact name with `--ignored --exact --nocapture`; ignored here means explicitly supplied SDK required, not specialist behavior |

`phase-1c-remediation-sdk-recovery: passed` and `phase-1c-remediation-stage-races:
passed` move with their specialist blocks and must no longer be demanded or emitted
by the ordinary gate. Retain trust-order, Phase 1C target, all Phase 1D/1E/1F target
markers and network/runtime/diagnostic markers for assertions actually executed.
Remove routine requirements for the Recent crash and transaction termination test
names. Retain baseline link/refusal and final-window writer checks. Marker checks
must require completed successful cases, reject zero matches/zero tests and SDK skip
markers; current bare-name greps can match ignored names and are not sufficient.

**Non-crashing coverage that must survive the split:**

- Existing `transaction::tests::every_persistent_transition_has_bounded_recovery`,
  `interrupted_delete_is_recoverable_and_never_loses_the_displaced_source`,
  `interrupted_mixed_create_and_replace_blocks_follow_up`,
  `failed_stream_after_persisted_stage_is_recovery_required_not_rejected`,
  `explicit_recovery_resolves_only_proven_keep_or_accept_states`,
  `prepared_abandon_refuses_any_persisted_proposal_evidence`, terminal rejection,
  corrupt-record refusal and subsequent writes retain data-loss protection.
- Existing `lifecycle::tests::recent_precommit_failures_preserve_last_committed_store`,
  `recent_postcommit_failure_restarts_at_new_committed_store` and stale-temporary tests
  cover ordinary Recent recovery. Existing `renpy::tests` incomplete/corrupt provenance,
  orphan-final, abandoned-stage and partial-download fixtures retain SDK recovery.
- Gap to fill in preparation: excluding the Prepared termination parent removes its
  successful abandonment/Flush/unrelated-byte/follow-up-write assertion sequence.
  Add new `transaction::tests::prepared_fault_state_can_be_safely_abandoned` using
  existing `FaultPoint::Prepared`/`RecoveryRequired` injection and a reopened service.
  Retain that assertion sequence without killing a worker. Check whether streamed
  interruption needs another bounded state fixture to retain persisted-byte assertions;
  do not claim non-crashing fixtures reproduce OS crash durability.
- Keep WIN-F1's `renpy::tests::sdk_hashes_match_multichunk_empty_and_missing_inputs`
  and `sdk_file_hash_retains_cancellation_and_deadline`; existing dispatch/renderer
  receipt-cancellation, Stop/session ownership, Source Save/draft/caret, ordinary
  external changes and functional Branches/Runtime tests stay selected.

**Names do not determine behavior:** `renpy::runtime::tests::
runtime_natural_exit_and_crash_cleanup_descendant_pipes` uses controlled child
`exit(0)`/`exit(17)` through the real runtime process owner, asserting exited/failed
state and descendant heartbeat cleanup. Keep it ordinary: it does not crash Loomlight
or interrupt persistence. Its ignored `runtime_process_worker` remains helper-only.
The packaged `runtime-error` source raises `RuntimeError("R2_RUNTIME_ERROR_ORACLE")`;
the UI asserts failure output/state, Stop and cleanup. Keep it among the five cases.
Production Stop/timeout teardown is required cleanup, not permission to inject a crash.

**Proposed routine commands after migration, not executable approval now:**

- Broad release/locked core with no `--ignored`, explicitly skipping only
  `scene::tests::flow_observed_budget_fixture_500_scenes_2000_edges`,
  `lifecycle::tests::official_sdk_phase_1c_target_gate`, and
  `renpy::reconciliation_tests::official_sdk_download_handoff_target_gate` via one
  `--skip <full-name>` each. The four parents above will be explicitly ignored;
  the two SDK wrappers run separately with verified archives, not counted as passes
  from no-archive returns. Use this selection consistently in production and quality.
- Exactly `scene::tests::flow_observed_budget_fixture_500_scenes_2000_edges` with
  `--exact --nocapture`, `LOOMLIGHT_ENFORCE_FLOW_BUDGETS=1` and retained flow JSON,
  once per target: three fixed samples with original <250 ms/<2 s thresholds.
- Each of the four full SDK names in the table runs separately, exactly once per
  target at its existing layer, with the required archive environment. Only the two
  runtime SDK gates need `--ignored`; successful assertion markers plus actual test
  results are mandatory. The Phase 1C ordinary name is unusable until its split lands.
- Keep `npm run check`, Source/Runtime/Branches browser functional checks, desktop
  release tests and package boundary regressions. Chrome timing remains diagnostic;
  core budgets, malformed evidence, cleanup and functional failures remain blocking.

### Amended R2-P1-Q1 proposal — not selected

This replaces ledger 34's proposed next action, while retaining its coverage rationale.
It is one qualification plan with a **preparation stop before separately selected
execution**. Both standard packaged targets and all five existing cases remain required.

**Q1-PREP (recommended next selection):** implement only the test/selector/marker split
above in existing files; align production and quality flow selectors, and TESTING's
command references. No production service/renderer changes or new framework. Add the
bounded non-crashing Prepared regression and any demonstrated missing ordinary-state
assertion before excluding its specialist counterpart. Substantial redesign or a product
defect requires a new decision. No blanket retrospective E2E additions.

Change production to manual dispatch only; preserve repository quality and all actual
required checks. Do not change protection/rulesets or introduce an evidence controller.
Retain the produced Windows executable and macOS `.app` executable/bundle needed to
identify the tested app on failure, separately from success-only installers. A bounded
`always()` collection/upload conditional on output existence must retain hashes, logs,
source identity, run/attempt/SHA/tree and incomplete-case state even when later gates
fail. Report no binary produced versus produced-but-upload-missing distinctly. Keep
artifact retention bounded and scan retained outputs for private data/secrets.

Cheap preparation checks: repository links/privacy/whitespace; workflow syntax and
shell checks where available; source selector/embedded-call/marker audit; controlled
result fixtures rejecting zero intended tests, missing/ignored/skip/failed required
cases, malformed reports and cleanup failure. Check trigger events (docs/main push
does not package, manual dispatch selects both targets), browser outcome combinations
and failure-before/after-build retention paths. These are selector/gate checks, not
native qualification. No Rust/native build, app/browser/SDK launch, installation or CI
is needed for this preparation-only selection; record compiled tests as unexecuted.
Publish/review the preparation candidate and stop. A failed cheap check is corrected
within the bounded preparation; it does not grant a package run.

**Q1-EXEC (separate explicit selection after preparation review):** Codex on any host
with repository and Actions coordination access; tests on existing `windows-2025`
Windows x64 and `macos-26` ARM64 runners. No physical Mac or local Windows development
session required for this automated matrix; neither host supplies final human/native
input acceptance. Recheck access, refs, rules, toolchain/SDK pins and exact candidate.
One `production-scaffold.yml` dispatch, `upload_packages=true`; normal hosted pinned
dependencies/SDK installation and Rust test compilation are included. One Tauri package
build per target, two total; no local package build or separate flow/R1/H1 matrix.

Each package runs `compile`, `lint`, `route-a`, `route-b`, `runtime-error` once (ten
cases total), plus the existing primary/secondary boundary smoke (two app starts per
target): at most seven top-level Loomlight starts per target. Existing SDK/game children
belong to these named gates, not new diagnostic launches. Retain graph destination/
source/revision after a new session, route output plus Running for the declared 9.5 s
window and measured `runningObservedMs` (existing >8 s assertion remains), live Save,
stale revision, route-b draft refusal, Stop/disk reopen and cleanup. Keep privacy and
dependency inventory. No `branches-performance` or `branches-interactive` selection.

Check prerequisite failures honestly; independent browser outcomes may be deferred but
must still fail the final gate when functional/evidence results fail. No retry after
failure, timeout, cancellation or ambiguous dispatch. If pending, publish exact
run/attempt/SHA and manual-resume handover; no active model polling. Audit logs, case
reports, all recorded source inputs and archive digests, independently rehash the exact
retained executable and verify artifact availability before claiming qualification.
Missing/skipped gates remain missing/skipped. This supports review-ready qualification,
not user acceptance, conflict resolution, merge, integrated 1H or a cross-SHA waiver.

### Cumulative problem budget and preserved evidence

These are carried-forward observations, not new allowances. TEST-AUDIT-1 used zero
builds, application/browser/SDK launches or CI dispatches; no elapsed/cost saving is claimed.

| Problem / hypothesis and classification | Consumed evidence / correction history | Next discriminating action |
| --- | --- | --- |
| Windows startup overflow — product defect, stack frame exceeded main-thread reserve | D1 two builds/four launches; F1 three of four additional builds and five application cases passed after heap-buffer fix (26–27); initial deliberate-crash harness removed | Standard packaged qualification only if Q1-EXEC selected; do not use F1's unused build allowance |
| macOS Chrome frame overrun — harness coverage defect then unresolved browser/environment timing; no established native renderer defect | D1 two local browser launches; M1 two fixed local launches; H1 one hosted dispatch/launch FAIL, exhausted (28–30). N1 two releases, three automated launches, one interactive session plus two disclosed accidental starts (32); native proxy/user observations support TEST-P2 | No more same-hypothesis Chrome correction/retry or native Mac experiment; retain limits and separately address Windows native evidence later |
| Coherent R2-P1 package evidence — missing qualification after failed original matrix | Original `36293797731` attempt 1 FAIL at `f1a0f14`; Windows overflow, Mac downstream skips, original executable unavailable. Local F1/N1 are supporting, not replacement standard package evidence | Q1-PREP first; then one separately selected two-target matrix with exact failed-executable retention |
| Testing-policy mismatch — confirmed selector/requirement mismatch | Ledger 34 review plus this audit; no migration execution yet | Split specialist calls/markers and preserve non-crashing assertions, prove selectors reject ordinary failures before Q1-EXEC |

The two-unsuccessful-corrections reassessment rule applies across renamed checkpoints
and hosts; it is not a retry allowance. The detailed ledgers retain individual timings
and earlier failures. No diagnostic budget transfers to Q1. Windows native responsiveness/
input, the final focused user session on both OSes, PR conflicts/integration and final
integrated 1H remain open; optional Git and Phase 2 remain excluded.

### Audit validation and publication

Windows x64 complete-checkout validation used the already bundled Python 3.12.14;
no installation or application toolchain setup. `python scripts/validate.py` passed
for **274 repository files**; `git diff --check` passed. A local read-only static
audit checked all **eight changed Markdown files**, **97 relative links/anchors**,
UTF-8/final newlines, whitespace/fences and the **574-character / 67-word** next goal.
It verified all four still-unignored termination parents, two embedded SDK crash calls,
two namespace blocks, 17 already-ignored timed namespace cases, 17 ignored historical
cases and the one-shot native case. These are source counts across platform cfgs,
not compiled/selected per-target test counts or executed passes.

The static audit also confirmed current broad/isolated fixture duplication, embedded
markers, push/success-only artifact conditions and controlled runtime-error behavior.
Review compared the amended proposal against all seven delivery rules and ledger 34:
scope/hosts, rejecting assertions, ordinary regression retention, exact evidence,
cumulative budgets, no retries and separate acceptance remain explicit. No product
finding or new performance claim follows from this audit.

Local replay: workspace `test-audit-1/audit.py` and `audit.json`, outside Git. The
canonical UTF-8 Git content of Phase 1G ledger sections 12–34 is unchanged, SHA-256
`d8b7889c2229ec24fb4602f470921be92cd764db5e5372a209d7c268359fde78`.
Only Markdown is changed; application, test source, workflows, locks, ADRs, WORKFLOW,
archived records and raw evidence are unchanged. No Cargo/npm suite, build, app/browser/
SDK launch, package qualification, hosted workflow or specialist exercise ran.
Publish this checkpoint with `[skip ci]`, verify non-forced remote head/content and review
the published diff. Resolve its publication SHA from Git without a receipt-only commit.
