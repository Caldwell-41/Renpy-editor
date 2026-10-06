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

### Luna execution brief for Q1-PREP

**Handover amendment, 2026-09-28:** the user requested a suitably scoped handover for
a Luna-level agent. This authorizes this documentation amendment, not preparation
implementation or Q1-EXEC. Published audit baseline: `e5b457f79a0589837940bce3b2533bfb5ea722fc`;
fetch and preserve any newer work. Continue the existing branch/PR, not a new worktree
or historical candidate. The recommended model is **Luna, medium reasoning** for
this clear, bounded preparation; this is an engineering judgment, not a guarantee.
[Official model guidance](https://developers.openai.com/api/docs/guides/model-selection)
positions Luna for scoped tasks and coordinated updates from clear briefs. A Sol/Astra
review of the resulting test/workflow diff is recommended at the existing pre-execution
review boundary, especially for retained recovery assertions and failure-time artifacts.
Do not spawn reviewers or start another chat automatically.

**Read narrowly:** AGENTS, CURRENT/HANDOVER, WORKFLOW delivery rules, TESTING current
scope, this task's selector disposition and amended Q1 proposal. Then inspect only the
named test bodies, their direct helpers and the two workflow steps being changed.
Sections 12–34 of the Phase 1G ledger are evidence references, not a required reread or
new instructions. Do not repeat TEST-AUDIT-1 or reopen the native performance diagnosis.

**Expected edit boundary:** test modules in `app/src-core/src/lifecycle.rs` and
`app/src-core/src/transaction/tests.rs`; `.github/workflows/production-scaffold.yml`
and `.github/workflows/quality.yml`; relevant command guidance in TESTING; the owning
ledger and CURRENT/HANDOVER. If necessary, use a small focused helper under
`app/scripts/` for gate-result/evidence checks, reusing `record-runtime-inputs.py` and
`scan-artifacts.mjs` where applicable. No production Rust functions, transaction state
machine, renderer, native probe, dependencies, locks, other workflows or repository
rules changes. A `.rs` path alone does not make production edits permissible.

Perform these steps in order, reviewing each diff before the next:

1. **Preserve ordinary recovery first.** Add the named Prepared fault/state case using
   existing hooks/services. Map successful abandonment, unrelated bytes, Flush and a
   later write back to the old parent assertions. Compare streamed interruption with
   existing state fixtures; retain required persisted-byte checks. If a missing case
   needs production changes or an invented journal format, stop and describe the gap.
2. **Separate specialist execution.** Apply reasoned ignores to the four exact parents;
   extract only the two SDK crash calls and two timed namespace blocks into the two
   named ignored tests. Preserve moved assertions and ordinary SDK setup/trust/reuse.
   Do not delete tests, edit ignored workers, broadly exclude names, or classify the
   controlled runtime exit/`runtime-error` case as specialist.
3. **Align selectors and markers.** Apply the documented three broad-core skips in
   both workflows; select G1-U2 and each SDK gate exactly as specified. Remove only
   specialist marker requirements. Required ordinary test results must reject zero
   tests, ignored/skipped results and failures; printed test names alone are insufficient.
4. **Adjust trigger and retention.** Make only production manual-dispatch-only. Keep
   both target jobs, pins, functional gates and success-only installers. Collect/hash
   the exact produced tested executable on later failure with bounded retention;
   distinguish not built, built-but-missing and available. Preserve the browser final
   outcome gate; missing artifacts are not successful qualification.
5. **Check, review, publish and stop.** Use the cheap preparation checks below; record
   exact command/results and limits. Publish one coherent preparation checkpoint with
   `[skip ci]`; verify remote head/content, update the existing ledger/handover and stop
   before qualification. If incomplete, record the remaining item rather than claim
   review-ready implementation or automatically proceed to execution.

**Definition of done:** a compact before/after table maps each of the five steps to
changed paths and assertions. Source review proves ordinary gates cannot reach the
excluded helpers and preserves the ordinary regression list. Controlled text/result
fixtures prove rejection of zero/ignored/skipped/failed required cases, malformed or
missing case reports and failed cleanup. Workflow/shell checks cover both browser
outcomes, push versus manual trigger selection, and failure before/after binary creation.
Use installed parsers/tools only; unavailable syntax checks remain explicit limitations.
Run repository validation and `git diff --check`; inspect production/lockfile scope.
These checks neither compile the new Rust tests nor prove hosted workflow behavior.
Do not copy the prior audit's counts as new results or depend on its local-only script;
derive current source checks in this checkout. No Cargo command that compiles/lists/runs
tests, npm build, app/browser/SDK launch, tooling installation or CI is selected.

**Stop and hand back with evidence** if preserving an ordinary assertion requires
production changes, a broad harness rewrite, a policy/threshold decision, unavailable
privileges or conflicting newer work. Name the exact function/assertion, attempted
bounded approach and smallest unresolved question. Do not weaken coverage to finish.
Routine in-scope edits need no repeated permission. A model change does not reset any
problem budget or authorize additional execution. Q1-EXEC and final acceptance remain
separate selections under the existing workflow.

**Handover-only validation:** repository validator passed for 274 files; whitespace
and all 14 relative links/anchors in the three changed Markdown files passed. The
machine/model-labelled next prompt is 641 characters / 77 words. Self-review confirms
no implementation or acceptance expansion. Fresh refs matched the published audit;
publish this documentation amendment with `[skip ci]` and verify the remote content.

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


## R2-P1-Q1-PREP — test/workflow source alignment — 2026-09-28

**Authority/state:** the user selected Q1-PREP only on the existing
`feature/phase-1g-branches-runtime` branch, parent `31fd52ca067295f31afacbab04d1ae718ac60dc9`.
Preparation is `review_ready`; do not compile the new Rust tests, launch an app/browser/
SDK, build packages, dispatch CI, or start Q1-EXEC. Keep open PR #17 and all newer work.

### Five-step before/after record

| Ordered step | Before | Prepared source and preserved assertions |
| --- | --- | --- |
| 1. Ordinary recovery first | The successful Prepared-abandonment assertions lived only under a process-termination parent. | `transaction::tests::prepared_fault_state_can_be_safely_abandoned` uses `FaultPoint::Prepared`, drops/reopens the service, asserts `PreparedWithoutStage`, finalizes and flushes, preserves unrelated/original bytes, then commits a later write. The old subprocess case remains ignored. Streamed recovery, persisted-stage bytes, external writers, Recent pre/postcommit and existing recovery refusal tests remain selected. |
| 2. Separate specialist execution | Three transaction termination parents, Recent termination and two SDK specialist blocks were selected or embedded in the ordinary Phase 1C gate. | The four exact termination parents and `official_sdk_managed_install_crash_recovery_specialist` / `official_sdk_stage_namespace_specialist` are reasoned `#[ignore]` cases. Both crash calls and both anchored/inflight stage blocks, including their assertions/markers, live in the isolated SDK tests. The ordinary SDK gate retains clean install/reuse, provenance/trust ordering, static identity checks, and its authoring/Source/compile/run assertions. Helpers and specialist workers remain intact. |
| 3. Align selectors and markers | Production and quality broad core selected the flow fixture or SDK gates; bare-name checks could pass without executing a required test. | Both workflows skip only the exact flow fixture and two archive-backed SDK gates from broad core, then select the 3-sample G1-U2 fixture once. SDK gates use exact names; `--ignored` is limited to the two explicit-archive runtime gates. Cargo summaries plus named test outcomes reject missing/zero/ignored/filtered/failed required cases. Controlled report checks require each of the five package reports and complete cleanup. |
| 4. Trigger and retention | Production also ran on relevant main pushes, and executable identity was not retained on later failure. | Production is manual-dispatch-only. The two Windows/macOS jobs, independent browser outcome gate, SDK/core/desktop/package gates and success-only installers remain. Always-run scan/evidence steps identify run/attempt/SHA/tree, hash the executable, retain the Windows executable or full macOS app bundle for seven days, and distinguish not-built, built-but-missing, available, scan-withheld and partial output from failed packaging. |
| 5. Check, review, publish, stop | Prep had no implementation state. | A focused helper exercises controlled Cargo/report/browser/retention outcomes; a source audit checks exact exclusions and retained cases. Documentation, selector, whitespace and repository checks are listed below. Q1-EXEC remains a separate selection. |

Changed paths are limited to the named transaction/lifecycle test modules, the two
workflows, focused scripts under `app/scripts/`, TESTING and the owning status/ledger
files. No production Rust, transaction state machine, renderer, dependency/lockfile,
other workflow, repository rule or prior raw evidence changed.

### Check results and boundary

- `python scripts/validate.py`: passed for **276 repository files**.
- `git diff --check`: passed. Existing CRLF Rust files show Git's normal LF conversion
  warning in the working copy; there is no whitespace error.
- `check-q1-prep-gates.py self-test`: passed controlled zero-pass, missing-summary,
  ignored/filtered/failed Cargo-result, malformed/missing report, failed-cleanup,
  browser-outcome, and package-created/not-created state fixtures.
- `check-q1-prep-gates.py source-audit .`: passed for all four specialist parents,
  both extracted SDK cases, three matching exclusions in both workflows, manual-only
  production dispatch, browser gate, and five required package cases.
- The production workflow's scan/hash/retain path and both target selectors were
  reviewed against the amended Q1 proposal. No unfiltered core shortcut remains in
  either workflow's routine selector.
- Full YAML and Bash syntax parsers and standalone `rustfmt` are unavailable on this
  host. The workflow YAML/shell were source-reviewed; this limitation is explicit.
- No Cargo command, Rust compilation/test listing, npm build, app/browser/SDK launch,
  package build, hosted workflow, or CI dispatch ran. These compiled/hosted behaviors
  are unverified and belong to Q1-EXEC after review/selection.

Published the lightweight Q1-PREP checkpoint as
`e8dc1fac3c2f2c6844026a70ba34133a70427bb4` with `[skip ci]`, verified on origin
during the review below. Q1-EXEC needs a separate user selection,
fresh refs/rules/access review and one Windows x64/macOS ARM64 production dispatch. Open
questions for that step: confirm current Actions permissions and branch rules, and
inspect any review comments on the prepared selectors/artifact-retention logic. Existing
native/human acceptance and PR conflict/integration gaps remain as previously recorded.

## Q1-PREP review and corrections — 2026-09-28

**Authority/state:** the user selected review of Luna's Q1-PREP and fixes to verified
issues, including the potential macOS blocker. Reviewed published `e8dc1fa` against
`31fd52c`; this correction is its successor on the same branch/PR, `review_ready`
for Q1-EXEC selection. No qualification, conflict resolution or merge is executed.

### Findings and disposition

| Finding | Evidence / harm | Correction |
| --- | --- | --- |
| P1: macOS Python portability risk | New shared helper calls used bare `python` with no interpreter setup. Existing native Mac probes use `python3`, and the runner documents Python3; command lookup could stop ordinary gates and even failure retention. This is a source-level portability finding, not a reproduced hosted failure. | Both affected matrix jobs select `Q1_PYTHON` from runner OS (`python` Windows / `python3` macOS), log its version and use it for every new shared helper. Source audit and controlled negative fixtures reject the old calls. No interpreter installation or pin change. |
| P1: deterministic formatting preflight failure | Installed pinned Rust 1.90 rustfmt found three differences in the new lifecycle/transaction test code. Production's preflight runs workspace formatting before either target. | Format only those test-module changes; full workspace `cargo fmt --check --all` passes. No Rust behavior changed. |
| P2: macOS failure artifact loses executable permissions | A loose `Loomlight.app` copy is uploaded through artifact ZIP, which does not preserve Unix modes. Copying symlinks locally does not protect the uploaded bundle; recovery would not retain the original runnable layout. | Retain the already scanned bundle as `Loomlight.app.tar`, with links/modes/hidden entries; verify the contained executable hash and record the tar hash. Windows retains its exact executable. |
| P2: stale operational instructions | HANDOVER and the latest prep ledger still instructed publication of an already published commit; AGENTS/TESTING still described an unimplemented selector migration. | Record original publication, distinguish this successor correction, update live command guidance and replace the redundant review-only next prompt with bounded Q1-EXEC execution. |

Primary references: [macOS runner software](https://github.com/actions/runner-images/blob/main/images/macos/macos-26-arm64-Readme.md)
and [artifact permission limitation](https://github.com/actions/upload-artifact#permission-loss).
No exact hosted runner image is qualified by those documentation references.
The package manifest also now checks report case identity before labelling a case
passed, matching the existing required-case gate. It continues to mark absent reports
as missing and withhold package bytes after unsuccessful scans.

Review found no further source-level blocker in the retained Prepared recovery
sequence, SDK split or selected ordinary regressions. Compared the moved SDK bodies
and preserved crash/namespace assertions; checked ordinary byte/Flush/follow-up-write,
interrupted-save, external-writer, Recent and SDK hash/cancellation regressions against
the workflow selectors. Compilation/execution is still unverified, not inferred from
source inspection. Production logic, dependencies/locks, thresholds, prior failures and
earlier ledger evidence remain unchanged.

### Validation and fresh remote state

- Controlled gate fixtures and focused source audit pass, including rejection of bare
  Python helper calls or missing target selection.
- `test-q1-package-retention.py`: **7 passed, 1 skipped** locally. Runs the real CLI
  against synthetic files: Windows bytes/hash, macOS tar contents/hash/modes/hidden
  resource, pre-build failure, missing successful output, partial package output,
  failed scan and wrong case identity. POSIX symlink creation is the explicit Windows
  skip; the test is selected in existing Ubuntu preflight. No executable is launched.
- Pinned Rust 1.90 `cargo fmt --check --all`: passed; initial check demonstrated the
  three formatting failures before correction. No Rust compile/test/list command ran.
- Installed Bash `-n`: all **20** explicit Bash steps across both workflows passed,
  with Actions expressions replaced by placeholders. This is syntax-only evidence,
  not YAML/schema parsing or hosted execution. No standalone YAML parser was available.
- Repository structure/link/privacy validator and `git diff --check`: passed.
- Fresh fetch confirmed origin prep `e8dc1fa`, main `4d7ba03`, no unpublished local
  edits at entry. PR #17 is draft/open/conflicting with no comments or reviews.
  Repository permissions include push/admin, production workflow is active, and the
  feature-branch rules endpoint returned no rules. Recheck these at dispatch.

No CI, package build, app/browser/SDK launch, native measurement or specialist exercise
was run. Prior problem counters in the budget table remain unchanged; this is one
source correction of preparation, not a new attempt at the Windows overflow or Mac
timing hypotheses. No native tooling or dependencies were installed.

**Next:** select R2-P1-Q1-EXEC directly using the amended scope above and live HANDOVER.
One manual two-target production dispatch with packages, no retries; record a precise
manual-resume handover if pending. Evidence review remains part of that qualification.
The remaining 1G stages are coherent automated qualification, Windows native/final
human acceptance on both platforms, then final review/conflict resolution/integration
with affected gates. Integrated 1H is subsequent and separately selected. No blanket
acceptance or cross-SHA evidence waiver follows from these source fixes.

## R2-P1-Q1-EXEC — standard package qualification — 2026-09-28

**Authority/state:** user selected Q1-EXEC only; `blocked` by dispatch rejection. Candidate
`b5de446389145c3da2e3f7d653673591d43d37fa`, tree
`6e496ab05e59f90b6518fe65340028a91ca74ec4`, matches freshly fetched origin and
draft/open/conflicting PR #17. Main remains `4d7ba0333c48d60242a9a42d3e079fea499a5531`.
The starting worktree was clean. Repository push/admin and Actions workflow access
are available; production workflow `357322921` is active, feature-branch rules are
empty, and PR #17 has no comments/reviews. No production run on this candidate or
pending production run was returned by the pre-dispatch branch inventory.

Selected allowance: one production dispatch with `upload_packages=true`, Windows
`windows-2025` x64 and `macos-26` ARM64, one Tauri build and five existing Runtime
cases plus primary/secondary boundary smoke per target. No retry, local package
build, conflict resolution, merge or 1H. Source audit and controlled Q1 gate fixtures
pass locally. Rechecked Node 24.19.0, npm 11.9.0, Rust 1.90.0 and Ren'Py 8.5.3,
archive SHA-256 `eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`;
workflow and source pins agree.

### Dispatch rejection and evidence audit

One invocation of `gh workflow run production-scaffold.yml --repo
Caldwell-41/Renpy-editor --ref feature/phase-1g-branches-runtime -f
upload_packages=true` returned exit 1, HTTP 422 from workflow `357322921`'s
dispatches endpoint. GitHub reported:

```text
Invalid Argument - failed to parse workflow: (Line: 70, Col: 18):
Unrecognized named-value: 'runner'. Located at position 1 within expression:
runner.os == 'Windows' && 'python' || 'python3'
```

The post-rejection audit on 2026-09-28 at approximately 05:35 UTC found **zero
Actions runs for the exact candidate SHA**. The production branch inventory was
unchanged; its newest run remains historical failed `36293797731`, not this
operation. There is **no new run ID, attempt, job, pending operation or artifact**.
No executable/package was built by this request, so executable/archive rehashes and
case/cleanup evidence are unavailable, not passing. Neither target qualified.

**Classification:** confirmed workflow/harness configuration defect before runner
allocation; not a product/runtime failure. Production job-level `env.Q1_PYTHON`
uses `runner.os`, rejected by GitHub in that expression location. The identical
source expression is present in `quality.yml:61`; that workflow was not dispatched.
The preparation source audit and gate self-test both passed immediately before the
request, demonstrating that they do not detect this Actions context error. Prior
Bash/formatting checks likewise did not establish workflow semantic validity.

**Budget:** one dispatch request consumed, zero accepted workflow runs, zero new
Tauri builds and zero new application starts. No retry or correction was attempted.
Original R2-P1/H1 failures and all cumulative F1/N1 counters above stay unchanged;
this failure grants no replacement dispatch allowance.

**Next bounded action (requires separate selection):** correct interpreter selection
at a permitted job/matrix context in both workflows, update the focused source audit
to reject this invalid placement, and validate Actions expression-context semantics
without dispatching. Preserve both target interpreters and all existing gates. Publish
and review that correction before the user separately authorizes any new qualification
request. No conflict resolution, merge, 1H or product change is selected.

**Publication/checks:** documentation-only outcome in this checkpoint's commit on the
existing branch, using `[skip ci]`; resolve its exact published SHA from Git. Source
audit and gate rejection fixtures passed; repository validation passed for 277 files
and `git diff --check` passed. No hosted test result is claimed. The live HANDOVER
and Phase 1G ledger 38 route recovery; no manual resume of a nonexistent run is possible.

## Q1 workflow-context correction — 2026-09-28

**Authority/state:** after the rejected dispatch, the user requested diagnosis and
correction in this chat. This selects the bounded correction; `review_ready` after
local validation. It does not select another qualification dispatch. Starting head
`5e3ac871b7bab195223a66222e68777bebe03a35` matched freshly fetched origin and PR #17;
the worktree was clean. Main remains `4d7ba03`; PR #17 is draft/open/conflicting,
with no comments/reviews. The preceding rejected request remains recorded above.

**Diagnosis:** GitHub's [context availability reference](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#context-availability)
allows `matrix` in `jobs.<job_id>.env`, but excludes `runner`. Both workflows used
the latter to choose Python. The source audit required that exact invalid expression,
and its positive fixture repeated it; Bash syntax checks cannot detect this semantic
error. Independent actionlint 1.7.12 reproduced exactly two context errors on the
unchanged files, production line 70 and quality line 61, before the correction.

**Correction:** both job environments now choose from `matrix.runner ==
'windows-2025'`, preserving Windows `python` and macOS `python3`. All gates, target
labels, triggers, pins, budgets and runtime behavior are unchanged. The existing
focused checker requires one correctly scoped matrix selection, quoted helper calls
and no overriding Q1 assignment. Its fixtures reject the exact original expression,
the wrong platform mapping, step-level placement, duplicate assignment, missing job
environment and bare helper interpreter. TESTING documents the independent workflow
semantic check before dispatch, separate from the focused source audit.

**Validation:**

- Portable official actionlint **1.7.12**, Windows amd64 archive SHA-256
  `6e7241b51e6817ea6a047693d8e6fed13b31819c9a0dd6c5a726e1592d22f6e9`, verified against
  release asset metadata and published checksum; tooling stays outside the repository.
- `actionlint -shellcheck= -pyflakes= .github/workflows/production-scaffold.yml .github/workflows/quality.yml`:
  original files rejected with the two expected context errors; corrected files pass
  without diagnostics or ignored workflow rules. External shellcheck/pyflakes integrations
  are disabled; YAML and Actions expression checks are active.
- `python app/scripts/check-q1-prep-gates.py self-test`: pass, including one valid and
  six invalid Python-selection/helper fixtures, plus all existing result/retention checks.
- `python app/scripts/check-q1-prep-gates.py source-audit .`: pass. No Rust/native build,
  app/SDK launch or Actions dispatch was used as a validator. Hosted execution remains
  unverified; no package or native acceptance is inferred from linting.
- `python scripts/validate.py`: pass for 277 files; `git diff --check`: pass.

**Budget/next action:** one prior rejected request, zero accepted Q1 runs/builds/starts;
this correction adds zero dispatches and renews no allowance. Historical R2-P1/H1
failures and F1/N1 counters remain unchanged. The workflow parse defect is corrected
locally; coherent automated qualification remains missing. A separately selected new
Q1 execution may authorize one new request under the existing two-target/five-case
scope and no-retry rule. No conflict resolution, merge or 1H. Publish this correction
and live HANDOVER together with `[skip ci]`; resolve the exact successor SHA from Git.

## Q1 execution after workflow-context correction — 2026-09-28

**Authority/state:** the user explicitly selected one new production request after
the workflow-context correction, with `upload_packages=true`; `awaiting_ci`, manual resume.
Candidate `8546dcddd5ac95bfe849575fe618f6e990cdd5d4`, tree
`70ba924580bde3a66678e0ca91e1ae54fc241325`, matches local HEAD, freshly fetched
origin and PR #17. Starting worktree was clean. Main remains `4d7ba03`; PR #17 is
draft/open/conflicting, with no comments/reviews. Push/admin access is available,
feature-branch rules are empty, and production workflow `357322921` is active.
Pre-dispatch inventory returned zero Actions runs on this candidate and no pending
production run in the branch's latest five entries.

Independent actionlint 1.7.12 passes both corrected workflows; the focused source
audit passes. Rechecked runner labels `windows-2025` / `macos-26`, Node 24.19.0,
npm 11.9.0, Rust 1.90.0 and Ren'Py 8.5.3; the archive pin remains
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`.
The existing Q1 scope remains one Tauri build, five ordinary runtime cases and
primary/secondary boundary smoke per target; no local build, retry, separate matrix,
conflict resolution, merge or 1H. The prior HTTP 422 request remains consumed and
separate. This new explicit selection authorizes exactly one additional request.

### Accepted operation and initial evidence snapshot

`gh workflow run production-scaffold.yml --repo Caldwell-41/Renpy-editor --ref
feature/phase-1g-branches-runtime -f upload_packages=true` succeeded once and returned
[run 36383551820](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36383551820).
The run API independently confirmed:

| Field | Recorded value |
| --- | --- |
| Workflow | `357322921`, `.github/workflows/production-scaffold.yml` |
| Run / number / attempt | `36383551820` / `97` / `1` |
| Event / ref | `workflow_dispatch` / `feature/phase-1g-branches-runtime` |
| Candidate SHA | `8546dcddd5ac95bfe849575fe618f6e990cdd5d4` |
| Created / updated | `2026-09-28T05:49:08Z` / `2026-09-28T05:49:12Z` |
| Initial run status / conclusion | `in_progress` / null |
| Preflight job | `108804103380`, `ubuntu-latest`, started `2026-09-28T05:49:11Z` |
| Initial artifacts | Zero; package/executable/archive evidence not yet available |

The one initial jobs read found Preflight `in_progress`: repository validation,
bounded gate rejection/retention fixtures, source selector audit and Node/npm setup
steps completed successfully; locked JavaScript dependency installation was running.
Frontend/protocol, Source Save browser and Rust formatting steps were pending.
The Windows/macOS dependent jobs were not yet listed. No package builds or app starts
were observed at this snapshot; future totals must be audited from this same attempt.
No target qualification, executable hash, archive digest, case result or artifact
availability is claimed. Source SHA/tree is confirmed; all produced-input/binary
identity checks remain outstanding.

**Budget and stop:** this selection used one request, accepted as one workflow run,
attempt 1. Q1 cumulative requests are two: one prior HTTP 422 rejection plus this
accepted run; zero retries. Each target remains capped at one Tauri build and seven
top-level starts under the existing gates. Historical R2-P1/H1/F1/N1 counters remain
unchanged. No other workflow, local native test, merge or conflict resolution ran.

**Manual resume only:** stop active polling as selected. Resume the exact run and
attempt; never dispatch or rerun to resume. If still pending, record current identity
and stop again. Once terminal, inspect both targets and prerequisite/deferred outcomes,
download available evidence before its seven-day expiry, audit all five case reports
and boundary smoke, cleanup, SDK/core/browser/dependency/privacy evidence, source
inputs and archive digests, and independently rehash retained executables (including
the executable inside the macOS tar). Verify artifact availability even if the run
is green. Missing/skipped/failed gates are not passes. Preserve any failure without
retry/correction; publish the final audit and next bounded action separately from
native/human acceptance, conflict resolution, integration or 1H.

The documentation-only successor publishes this operation identity and the live
HANDOVER with `[skip ci]`; it is not the tested candidate and grants no cross-SHA
acceptance. Resolve publication SHA from Git. Qualification remains incomplete.
Documentation validation: `python scripts/validate.py` passed for 277 files and
`git diff --check` passed. Only the four status/ledger Markdown files changed.

## Q1 terminal evidence audit — 2026-09-28

**Authority/outcome:** user resumed the existing operation for evidence audit only;
no new execution. Automated Q1 qualification is **PASS**, `review_ready`, for candidate
`8546dcddd5ac95bfe849575fe618f6e990cdd5d4`, tree
`70ba924580bde3a66678e0ca91e1ae54fc241325`. This is not final native/human acceptance
or integration. Starting documentation head `142ecb0` matched freshly fetched origin
and PR #17; clean worktree, main `4d7ba03`, PR draft/open/conflicting with no reviews
or comments. No candidate source changed during the audit.

### Run and gate outcomes

[Run 36383551820](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36383551820),
attempt **1**, completed **success** at `2026-09-28T06:06:35Z` (created 05:49:08Z;
17m27s elapsed, not billed compute). Run SHA matches the candidate above.

| Job | ID | UTC start–finish | Outcome |
| --- | --- | --- | --- |
| Preflight, Ubuntu | `108804103380` | 05:49:11–05:49:54 | PASS |
| Windows x64, `windows-2025` | `108804257548` | 05:49:56–06:06:34 | PASS |
| macOS ARM64, `macos-26` | `108804257567` | 05:49:59–06:01:02 | PASS |

Preflight includes 64 frontend tests, zero failures/skips; eight retention fixtures
passed, including the previously Windows-skipped POSIX symlink fixture; gate rejection
fixtures, source audit, typecheck, Source Save browser regression and formatting passed.
Source Save red/green controls and selection regression ran on all three jobs.

| Required evidence | Windows x64 | macOS ARM64 |
| --- | --- | --- |
| Broad core | 169 passed, 0 failed, 36 ignored, 3 filtered | 174 passed, 0 failed, 39 ignored, 3 filtered |
| Isolated G1-U2 fixture | 1 test, three successful fixed samples | 1 test, three successful fixed samples |
| Lifecycle/authoring SDK gate; download handoff; runtime service; diagnostics SDK | Four separately selected exact tests passed; no ignored/skip marker | Four separately selected exact tests passed; no ignored/skip marker |
| Desktop boundary Rust test | 1 passed | 1 passed |
| Packaged compile / lint / route-a / route-b / runtime-error | 5/5 pass, each exit 0, one report, no timeout, cleanup complete | 5/5 pass, each exit 0, one report, no timeout, cleanup complete |
| Primary/secondary packaged boundary | PASS, primary ready and secondary rejected; all authoring/Source/denial assertions | PASS, same assertions |
| Runtime browser, Branches browser and final deferred gate | PASS, no page errors, cleanup complete | PASS, no page errors, cleanup complete |
| Artifact privacy scan / dependency inventory | PASS, six scanned files; 85 npm / 519 Cargo packages | PASS, six scanned files; 85 npm / 519 Cargo packages |
| Evidence and package uploads | Both available and downloaded | Both available and downloaded |

The broad-core ignored tests retain their specialist/worker/explicit-archive disposition;
the two ignored runtime SDK gates were then selected and passed separately. The three
filtered tests ran in their separate required layers. Empty doc-test summaries do not
stand in for selected tests. All six named Cargo-log checks were reapplied to downloaded
logs, including ordinary Prepared recovery, external-writer and heap-buffer regressions;
required SDK/authoring markers were verified. The only skipped workflow steps were the
official SDK downloads on **cache hit**, not SDK verification or tests. Pinned archive
verification remains exercised by the SDK service source and its successful target gates.

Route reports retain destination/source/revision survival through a new session, restored
authored routes, route-specific output, live Save and stale-revision notice, Stop/disk
reopen; route-b additionally records draft cancel/refused Save All. The audited candidate
probe asserts these before emitting its completion stages. Observed Running durations:
Windows route-a **9504.1 ms**, route-b **9500 ms**; Mac **9503 ms** / **9504 ms**.
Both compile/lint navigation cases and the controlled runtime-error/Stop case passed.

G1-U2 samples, milliseconds `(initial, refresh, accepted update)`:

- Windows: `(288.2709, 276.4482, 23.4201)`, `(303.8758, 275.488, 23.8083)`,
  `(304.479, 300.6363, 23.0315)`.
- macOS: `(32.523792, 31.01725, 13.495834)`, `(32.014417, 30.724917, 12.718917)`,
  `(35.200458, 33.786, 13.785375)`.

All meet their separate 2,000/2,000/250 ms limits. Branches browser uses the full
500-Scene/2,000-edge fixture, held-refresh pan, navigation/refresh and 640-width checks.
Chrome pan p95 / visible-first-rAF p95 / rendering-opportunity p95: Windows
**15.5 / 15.1 / 31.1 ms**, Mac **34.8 / 39.8 / 64.4 ms**; all diagnostic thresholds
passed. Runtime browser focus/overflow passed at widths 1100/640. These remain
Chromium/synthetic-input evidence, not native responsiveness or human acceptance.

### Independent identity and artifact audit

All four non-expired artifacts were downloaded and their raw ZIP SHA-256 values
independently matched the GitHub artifact API digests and upload log records:

| Artifact | ID | ZIP SHA-256 |
| --- | --- | --- |
| Q1 evidence Windows | `10953757230` | `bf5ed18e6c3ec3f29ae8a796aa00ad83463e4f995a35b86688cc671f60a56e89` |
| Production package Windows | `10953334429` | `ed98a5b98db42f34f5c0495f4bd906a4d4423653b835a00287bfdffe0f2c0b6e` |
| Q1 evidence macOS | `10954175758` | `7e85dd667ec88adc4d133007b17046a75e220bab6a56a5031c0e5ce1f6dac85f` |
| Production package macOS | `10954061304` | `dfd44960028203259bb4b715086c91d0ea245af296a7986cf38c01d62667659a` |

Remote artifacts expire **2026-10-05**, between **06:00:54Z and 06:06:11Z**. Local
audit copies include original ZIPs, manifests, reports and complete raw logs for all
three job IDs. The combined `gh run view --log` output truncated the Mac job; the
audit used direct job-log downloads to finish the missing sections. Raw logs/binaries
remain outside Git; this ledger preserves compact results, identity and availability.

Each target's `runtime-ui-inputs.json` contains **107 source inputs**. Every hash and
the complete path set was independently checked against Git archive bytes at the exact
candidate, respecting committed CRLF rules for PowerShell/batch files. Both manifests
agree on run, attempt, SHA/tree and executable identity. All five browser source hashes
and each generated browser fixture hash also match. Toolchains: Node 24.19.0,
Rust/Cargo 1.90.0; recorded architectures AMD64 and arm64, Python 3.12.10 and 3.14.7.
The hosted interpreter-selection correction is now exercised on both targets.

| Retained or distributed file | Independently computed SHA-256 |
| --- | --- |
| Windows retained `loomlight.exe` | `9ecf49f4cc60eb9c08696dac92343a8dada7131ad2091b2b340b63c1b3d87312` |
| macOS `Contents/MacOS/loomlight` inside retained tar | `7eada35e7b0f205f50cf03e217359c5156bc79a9aa1c8c11f2b6f4eb3c035fcf` |
| macOS `Loomlight.app.tar` | `cc51809450744daf646516da93fe98be3ddd5c7033448c75bfbd864c8aa1ccd4` |
| Windows `runtime-ui-inputs.json` | `33cbd4ab75f85a41a4543c85ae12c06562b444f47b359a3de231b0c03a962819` |
| macOS `runtime-ui-inputs.json` | `52209768b10b0bbaac3f62ff7d386916a5085d0d8db6c41a97720b58484a8f28` |
| `Loomlight_0.1.0_x64_en-US.msi` | `f809ea49a0ca64aa4b5279bc779aae3a00154cb6c4341274c57818d2e24435f8` |
| `Loomlight_0.1.0_x64-setup.exe` | `38cd0731923d8d919c187900edab46de37ac62f762500dd0aa2ded05118274be` |
| `Loomlight_0.1.0_aarch64.dmg` | `407bd8743618986970c0d93d96e8886ccf916f31cc38bc78c5da9b234d10e200` |

Retained executable hashes match both manifests; the Mac tar executable retains its
execute bits and also matches the application in the success-only package artifact.
Installers are available and hashed, not installed/launched during this audit. Source
and retained-output scan status is success, with no scan-withheld package evidence.

### Scope, budget and remaining acceptance

The existing attempt performed **two Tauri builds**, **ten packaged Runtime cases**
and **four primary/secondary boundary starts**: seven top-level Loomlight starts per
target, within the selected cap. Required SDK/game children belong to their existing
gates. This audit added zero runs/builds/app launches; Q1 totals remain two requests
(one prior HTTP 422 rejection and one accepted run), attempt 1, zero retries. No flow/
R1/H1 matrix, specialist exercise, conflict resolution, merge or 1H was selected.
Historical R2-P1/H1 failures, F1/N1 budgets and their original candidate limits remain.

Nonblocking logs retain an unused Rust-method warning on Windows and GitHub's Node 20
Action-runtime deprecation notice; neither caused missing gates or evidence. No source
correction or new hypothesis was needed. No external operation remains pending.

**Next:** separately select preparation of the remaining Windows packaged native
responsiveness/input evidence and one focused final user session per supported OS,
under TESTING's ownership/cadence. Verify native host/driver capabilities before promising
automation; synthetic input does not close that gap. Preserve MAC-N1's supporting limits.
Reuse these exact packages where applicable; no duplicate package matrix solely for
documentation. Final review/conflict resolution/integration and affected integrated-tree
gates remain separately selected; there is no cross-SHA acceptance waiver.

Publish this audit, CURRENT and the single HANDOVER on the existing branch with
`[skip ci]`; the documentation successor is not a new tested candidate.
Local publication checks: `python scripts/validate.py` passed for 277 files;
`git diff --check` passed. Only the four status/ledger Markdown files changed.
