# Walkthrough redesign implementation evidence

Historical record for the [task brief](../active/walkthrough-redesign-implementation.md).
Read a matching section to diagnose an earlier failure, reuse an exact result,
trace an amendment or reconcile allowance usage. The dated worker assignments,
proposed budgets, dispatch gates, holds and continuation prompts below describe
prior checkpoints. They do not reopen work or supersede the current brief.
The final automated audit qualifies the model-load configuration amendment only;
broader native/live/human acceptance remains incomplete.

**State: Unsloth Studio amendment review_ready after final automated qualification; broader walkthrough/phase acceptance remains incomplete.** The user approved the
complete proposed scope/budgets and explicitly requested starting the new chat. The
Sol6.1/xhigh coordinator owns implementation, Sol6.1/high delegation, review, tests,
publication of the reviewed candidate and gated CI under this contract. This supersedes
the earlier review-only/no-live-sends selection only within this new approved outcome.
Prior closed budgets do not roll over or reset. Whole-phase human acceptance remains pending.

**Initial usage:** live generations0/12, reserved response tokens0/32768, model-list
refreshes0/4, model-load attempts0/2, paired CI attempts0/3. Per-slice and integration
verification/correction cycles are unconsumed. Local app packages/native starts0/0.
The coordinator began on the clean local `codex/phase3a-story-logic` checkout at
3744a17. No implementation/live/CI operation preceded this selection.

## Execution contracts and ownership — 2026-10-15

The new implementation selection supersedes prior review-only/no-live restrictions
only for this outcome. The original Mara walkthrough session remains untouchable.
All workers share this checkout, edit only their assigned files, and return patches
without staging other work. The coordinator owns commits, shared wiring, docs, final
review and the common live/CI ledger. No worker has a live-call allowance.

| Worker / sequence | Exclusive ownership | Contract and acceptance |
| --- | --- | --- |
| A, then D | `app/src/ai-settings-ui.ts`, settings-specific tests first; `app/src/reference-ui.ts`, reference-specific DOM tests only after C contract review | A keeps legacy serialized profile fields readable; one visible context value maps both existing context settings only on explicit save. Defaults 32768/8192 apply only to new forms. Confirm named profile removal, preserve drafts/selection on failures/cancel. D consumes reviewed C/F contracts and preserves hidden stored fields, stable selection/drafts, proposed-reference review and shared panel controls. |
| B | New `app/src-core/src/studio_models.rs`, focused model tests; request-host integration files only after declaring precise ownership | Verify official/installed interface before implementing. Adapter must distinguish inventory, loaded context and readiness; load only after explicit user request, reuse sufficient loaded model, refuse conflicting/unknown capacity safely, no implicit download/unload. Controlled fixtures exercise real adapter/request path. Report unavailable live capability. |
| C, then F and E data | `app/src-core/src/references.rs`, `app/src-core/src/references/tests.rs`, narrowly needed `authoring.rs` changes | Publish concrete reference commands before UI consumers. Associate by stable ID only, never name. Game-first writing is empty without a read-time write; planning-first explicit link/create uses one transaction including source/metadata/reference changes. Card restore copies a retained snapshot to a new current revision, bounded retention, ordinary validation and approval safeguards. Add an optional project world/tone record without deleting/mutating legacy lore or unknown members. |
| Coordinator E/integration/G | `main.ts`, `prompt-ui.ts`, `rewrite-ui.ts`, `prompts.rs`, related tests, shared protocol/dispatch/lifecycle wiring, styles, workflows/scripts, docs | Integrate reviewed contracts sequentially. Project world/tone joins writing context by default only after operation initiation; explicit per-request omission affects exact preview/body and token admission. Connection tests stay synthetic. Existing saved per-action style is preserved but must not become a conflicting hidden tone source. Audit exact-current-candidate CI before dispatch. |

Shared IPC remains deny-by-default and typed. Extend the existing `references.apply`
command owner rather than introducing a second transaction layer. Proposed commands:
explicit character link/create, restore retained card revision, save project world/tone.
Worker C must confirm payloads, revision/precondition behavior and persistence shape
before D/E start. A read must never materialize empty cards or a global document.
Existing game-only characters may be represented as virtual empty writing sections
keyed by game ID until an explicit save/create action materializes their card.

Compatibility: keep schema 1 reference documents and unknown extensions. Use an
optional new project-context member with its own revision identity; absence means
empty notes. Preserve all old lore records and explicit selection through context
options. Do not reinterpret lore prose or merge by title. Restore must preserve
snapshot extensions while generating a fresh revision and validating current support;
an AI proposal must never become implicitly approved through restore or linking.

Every worker returns scope/acceptance mapping, changed paths, exact focused results,
cycle usage, limitations and self-review. Coordinator review is separate. Initial
verification plus at most two diagnosed correction cycles per slice/integration;
tests use production actions/IPC/services, deterministic synthetic inputs and explicit
readiness. No arbitrary waits, duplicate product logic, packages or native launches.

Current ledger: live0/12, reserved tokens0/32768, refresh0/4, loads0/2,
pairedCI0/3; local production builds0/0 and new native launches0/0. No pending CI.

## Outcome and execution model

Create one new local Loomlight chat using **Sol 6.1, xhigh** as coordinator. Its task
is to implement the discussed settings, unified Characters/card redesign, project-wide
Lorebook, transactional previous-version restore and selected Studio model-loading
workflow. Match the existing application themes and approved geometry. It owns delivery,
integration, review, testing, CI audit and final evidence review.

Delegate implementation/testing to **Sol 6.1, high** subagents. The coordinator reviews
every slice and the integrated candidate itself. Use at most three concurrent subagents,
within available capacity; queue the rest. Give each the written scope, owned files,
contracts, acceptance checks and common restrictions. Independently reviewable slices
are not assumed to be simultaneously editable: sequence shared-data work and consumers.
Do not refactor broadly merely to manufacture parallelism.

Use the latest local checkout on `codex/phase3a-story-logic`, including unpublished
design commits. Inspect live Git/artifacts/ownership; never reset to remote main or an
old candidate. Preserve unrelated work and the existing open app's unsaved Mara draft.
Do not close, save, discard, reload or repurpose that walkthrough session.

## Preparation before delegation

The coordinator reconciles this new implementation selection with the earlier review-
only/no-live-sends restrictions, records it in the live task/status records and inspects
current code. Define the smallest shared data/IPC/component contracts and an acceptance
matrix before dependent agents start. Declare dependencies and exclusive file ownership;
the coordinator owns shared wiring, integration and conflict resolution. Use isolated
worktrees only where useful, preserving the complete current local baseline; otherwise
do not permit simultaneous edits to shared files.

Record a compatibility strategy: add the global world/tone reference without deleting
or silently merging legacy lore entries; preserve existing references/unknown data,
source authority and recovery. Do not silently merge characters/cards by name or
reinterpret existing prose as new runtime state. An additional destructive migration
or unapproved behavior needs a concrete user decision, not an invented default.

Each slice returns its patch/commits, a scope-to-acceptance checklist, exact checks and
results, unresolved issues and a concise self-review. No agent can approve its own
slice as the final review. The coordinator reviews the diff, traces behavior through
production code, checks negative paths and either accepts it or returns a bounded
correction. Do not fabricate an independent review by reusing the implementer's label.

## CI audit and dispatch gates

Inspect the actual workflow, selectors and invoked scripts, not only YAML appearance.
Audit candidate checkout and branch gates, test discovery/zero-test failures, truthful
success/skip/cancel handling, shell exit propagation, prerequisites/conditions, test
counts/cases, pinned toolchains, credential isolation, cleanup and partial-failure
artifact retention. Add minimal rejecting fixtures for corrected gate logic.

Preliminary inspection found historical selectors that cannot be reused unchanged:
the assistance UI workflow is restricted to `codex/provider-qualification`, while the
frozen Studio Settings workflow deliberately tests product929af6f. These were scoped
historical proofs, not evidence for new source. Preserve their original meaning while
adding/updating the appropriate new-outcome selection. Never qualify changed code by
testing the frozen executable or simply deleting required guards. Hard-coded counts
must correspond to the actual selected cases, with explicit missing/skip/failure checks.

Only after every slice and the integrated candidate passes coordinator review, required
focused tests and a final CI-logic audit may the coordinator publish the reviewed
candidate and dispatch its required Windows x64/macOS ARM64 CI. Approval here means
technical approval by the coordinator; it is not a new per-slice user permission loop
or whole-phase human sign-off. No premature CI dispatches while slices are in progress.

Record exact SHA/tree, workflow inputs, run/attempt, selected jobs and remaining budget.
Follow the repository waiting policy: no polling loop, watcher or automation. On terminal
resume, inspect jobs, actual case results, matching artifacts, privacy/cleanup and
failed/skipped evidence. A green summary alone is insufficient. Fix in-scope defects
and rerun only affected gates when justified within the allowance.

## Proposed cumulative allowances

These are ceilings for the whole new outcome, including all agents, host changes,
failed attempts and retries. Do not spend remaining allowance just because it exists.

- Per slice: initial focused verification plus at most two diagnosed correction/
  verification cycles. Integrated candidate: the same three-cycle ceiling. After two
  unsuccessful corrections of one hypothesis, reassess its requirement/layer/evidence
  before continuing; a renamed hypothesis or chat does not reset consumption.
- CI: one required paired Windows/macOS attempt plus up to two diagnosed correction
  attempts, **three paired attempts maximum**. Rerun only affected required jobs where
  valid. Each failed/cancelled dispatch counts. Do not treat missing evidence as a pass.
- Local release/package/installer builds: **zero**. New local native editor launches:
  **zero**. The original walkthrough package remains untouched. Focused test compilation
  is explicitly allowed; final reviewed CI may perform required production build checks.
- No merge/release, signing/credential-policy change, new provider, service installation,
  model download, ordinary-profile removal or destructive legacy-data migration.

## Unsloth live generation budget

**Twelve live generation attempts total: eight planned checks and four reserved for
diagnosed corrections.** The coordinator alone authorises live attempts from the common
ledger; subagents use controlled fixtures by default and receive no separate allowance.
Unused attempts are not a target. Reserve coverage for setup compatibility, existing
generation actions, world/tone include/omit behavior and generation after actual model
readiness; combine compatible checks rather than duplicate sends.

- Count every dispatched generation, including connection tests, cancelled requests,
  failed requests, retries and requests whose server outcome is uncertain. Never retry
  an ambiguous request automatically. Charge one slot before dispatch and retain failure.
- Keep synthetic prompts and outputs small. Aggregate **32,768 reserved response tokens**
  maximum across attempts, charged by each requested response limit even on failure.
  Normally cap a check at2,048 output tokens; permit one up-to8,192-token response limit
  check if needed within the aggregate. This is test configuration, not a reduction of
  the agreed new-profile default. Respect the model's actual context/output capacity.
- Use only the user's existing approved Studio endpoint/model and the approved native
  credential path. Do not read/export credentials or include them in logs/artifacts/CI.
  If unavailable, ask for the missing setup through the normal safe UI rather than
  inventing another provider, extracting a key or weakening policy.
- Additional management ceiling: up to four explicit model-list refreshes and two
  model-load attempts on already-available models. Readiness observations use the
  supported status interface within existing bounded request/load deadlines. No scanning,
  downloads or unloading/reloading a pre-existing user-active model just to make a test
  possible. Report a real load-path evidence gap if an eligible live fixture is unavailable.
- Exercise the new production service through focused tests/drivers without building a
  local app package. An older running app cannot count as proof for changed code. If
  safe current-candidate access is unavailable, complete controlled checks and report
  the precise live evidence limitation. Do not bypass credential policy to consume budget.

Each live receipt records purpose, candidate, synthetic fixture, response limit,
request outcome and remaining request/token/management allowances, without secrets.

## Completion and handoff

Deliver reviewed integrated commits, per-slice acceptance/evidence, updated canonical
contracts, final both-host CI audit, actual budget usage and explicit limitations.
Maintain one current handover and leave final state review_ready when technical gates
are satisfied; final human phase acceptance remains the user's decision. If a limit,
capability or material requirement blocks completion, report the concrete missing
decision and continue unaffected authorised work. Do not mark missing proof complete.

User approval has been obtained. Create only the one requested coordinator chat with
its specified model/effort, current local project and this task as the implementation
contract. The coordinator creates subagents
as scoped workers; do not create a separate user chat for every slice.

## Execution ledger — 2026-10-15

Local coordinator started at3744a17 on the selected branch; unpublished design commits
and all other worktrees retained. Explicit Sol6.1/high workers: settings_workspace
(A then D/E/F UI), reference_core (C/F/E data then independent G testing), studio_loading
(B). Shared main/styles/preferences/context/workflow wiring and final review remain
coordinator-owned. No worker stages/commits another writer's files.

| Slice/facet | Evidence and actual usage |
| --- | --- |
| A | Typecheck/test compilation and13 focused Settings DOM cases passed. Initial expanded batch had4 harness selector failures; correction1 yielded12/13, correction2 yielded13/13. Two command-path mistakes included an unnecessary unchanged failed rerun; retained as failure, not product evidence. Coordinator code review accepted A. |
| C | Initial full filter17run15pass2fail; correction1 17run16pass1fail; correction2 19run16pass3fail. Substring filter also matched one existing preferences test (passed). New fixture assumptions removed the mapped Bec source, chose inventory index/count rather than created IDs, and closed with a dirty synthetic draft. Reviewed fixes preserve complete canonical source before appending custom bytes, select intended IDs and explicitly discard the fixture draft. **Allowance exhausted; no further C execution.** One extra focused round requested from user for exactly `reviewed_game_creation_is_atomic_preserves_source_and_refuses_changed_review`, `virtual_writing_save_uses_stable_ids_and_refuses_duplicate_or_changed_association`, `character_preview_refuses_dirty_source_and_changed_metadata_review_without_writes`, all under `references::tests::`. Summary/patch are in `/private/tmp/loomlight-reference-verification-ledger.txt` and `/private/tmp/loomlight-c-harness-correction.patch`; raw output remains worker transcript, not those summaries. |
| F/E data/context | F restore/support/identity and E data/history tests passed initial selected filter runs. Two focused `shared_project_context` production-dispatch tests passed: exact known-field inclusion/omission, UTF-8/CRLF, unknown/legacy exclusion, budget admission, stale pending-send refusal and unchanged source/disk bytes. Coordinator reviewed core contracts; C unresolved proof is not relabelled passed. |
| D/E/F UI | Initial reference+refinement19/19 passed; two preparation compile errors were fixed/disclosed. D corrections1 and2 each changed/reverified the affected planning lifecycle case, addressing source-only Discard and source input retention through writing Save/native game dirty guards. D2/2 used. E read-only global history correction1 plus D case2/2 passed in selected batch; E1/2 used. F coordinator review found source-only draft restore gap; F correction1 selected case1/1 passed, F1/2 used. Current combined suite20, unchanged passes reused. |
| B | Pinned official v0.1.902-beta source1b588389b488eb9f8a9cb8ad5ca3073c7661f073, exact public blobs under `/tmp/loomlight-studio-v0.1.902-beta-*`. Initial sandbox fixtures could not bind; narrow test-only escalation succeeded. Controlled6core+8host passed; cycle1 added load-cancel core1 and final host9 (all passed); cycle2 corrected post-load insufficiency wording and affected case1 passed. One destructive-looking formatting reconstruction was auto-review rejected before execution; exact hunks safely removed formatting noise instead. **B2/2 used.** Root prepared loaded-list consistency refusal/new assertion after review; one extra focused test requested from user, unrun. No owner/live proof yet. |
| G | Checker21 passed initial,22 passed cleanup correction1, and25 passed provenance/image correction2 (no failures/skips). Checker facet exhausted. Root/worker audit traced selectors, exits, matching Cargo listing/results, exact Node discovery, image hashes/dimensions, cleanup, retained renderer/test executables and source-input hashes. Static actionlint passed; shell exit propagation was reviewed manually (shellcheck unavailable). Browser initial failed EPERM before launch/captures; correction1 escalated loopback fixture captured1 actual state then failed a label selector; correction2 produced14 wide captures then stopped on compact footer-container geometry. Actual-button measurement correction and provenance/failure-image retention improvements are prepared, unrun. The user was asked for one extra full28 batch plus at most one diagnosed correction. Old14 are partial observations, not exact-candidate qualification. Failures retained in `/private/tmp/loomlight-redesign-browser-*`; cleanup/partial images are not complete proof. Historical gates remain intact; exact-current redesign workflow selector prepared, not dispatched. |
| Integration | Root source wiring/one context field/inclusion controls/read-only actual-context status implemented. One preparation test compilation ran before D's interface existed and failed on the known pending workspaceKey/callback types; later D typecheck/test compilations passed. Focused request/context integration batch20/20 passed. Integration correction1 moved successful-request actual-context disclosure after proposal status rendering; the extended named readiness case1/1 and test compilation passed. Integration corrections1/2 used. A later metadata-only seal fix records missing tracked inputs before candidate-match claims; it does not rerun product tests. No coherent integrated candidate is yet approved. |

Pending user budget decisions are recorded in HANDOVER. Do not spend them implicitly.
Current common ledger remains live0/12, reserved tokens0/32768, refresh0/4, loads0/2,
pairedCI0/3, local production builds0/0 and new native starts0/0. No pending CI.
No ordinary profile/key/model operation, original walkthrough interaction, push,
merge, release or phase acceptance occurred. Technical verification, implementation
and final human acceptance remain separate.


### Coordinator review and local checkpoint

Local implementation checkpoint34cbb4421c418cfcd05a1a3e8e28ada60918f8df,
tree789e2f141b460b2ea9cc0d9be80ec1253247fdff, contains the45-file implementation,
tests, canonical contracts and explicit verification holds. The branch is unpublished;
this is not a reviewed CI candidate or phase acceptance. A documentation successor
records the checkpoint without changing its source inputs.

Coordinator independently reviewed A form/state/credential paths, C/F/E reference
commands and transaction composition, D cached drafts/hidden data/callback cleanup,
E exact assembly and request forwarding, B pinned public vendor source/transport/
readiness and G actual workflow/scripts. The supported remaining proof gaps are the
three capped C cases, B's prepared status-consistency assertion and full compact visual
matrix. Passing earlier code is not approval of these unverified inputs. No integrated
candidate has been technically approved for publication/CI yet.

A new test-only `redesign-owner-driver` debug example uses the production native secret
adapter internally after a literal dispatch handshake. It never opens a project in the
ordinary profile service, writes profiles/credentials or exports secret/reply data. One
preparation-only test passed14 fixed action/context combinations (no owner access,
credential read or HTTP). Two diagnosed driver fixture corrections/canonical-path and
eligible-target preparation failures were retained; final compilation/format passed.
Coordinator code review then used metadata-only inspect mode: the retained walkthrough
root has no saved profiles; the standard existing application root has exactly one
origin-bound Studio profile. Endpoint/model/settings were read through production
profile code, not secret files. No credential read or live request followed. Exact local
root/profile identity remains private/ignored, never committed. Live capability is
prepared, but dispatch depends on resolving the B verification hold; no budget spent.

Repository validation initially exposed a preexisting missing final newline in the
approved `knowledge-b-guided-prompts-v1.txt`. The file gained only that LF; manifest
`generationPromptSha256` retains original1e0b6850…943d7 and explicitly identifies the
actual generation bytes, while `promptSha256` identifies the formatted saved file.
No image, approval or old input hash was erased. Corrected validator passed601 files;
`git diff --check` and focused actionlint passed. No package/native build or launch.

Three explicit user budget questions remain pending: one C three-case round, one B
single-case round, and one browser28-case round with at most one diagnosed correction.
No answer is treated as approval. All unaffected work above is complete; resume here
with the decisions, retain existing counts and complete the held focused proof before
any gated publication/CI. Final human Phase2/3A acceptance remains pending.

### Approved verification continuation

On 2026-10-15 the user replied **Request Approved** to all three pending extension
questions. This authorises one extra C round for exactly the three named cases above,
one extra B round for the named status-consistency failure-path case, and one fresh
full28 browser matrix plus at most one diagnosed correction. It does not reset prior
usage or expand live/token/management/CI budgets. The coordinator resumed those checks;
live dispatch remains gated by the focused B result, and publication/CI by all required
slice/integration proof and final technical review. The original walkthrough remains
untouched. Historical pending/blocked entries above record the earlier checkpoint.

### Approved extension results and new reassessment

All three extensions approved by **Request Approved** were executed without resetting
earlier counts:

| Approved extension / further in-scope work | Actual result and retained evidence |
| --- | --- |
| C one exact3-case round | **3/3 passed**, zero ignored. Separate fully qualified `--exact` invocations; raw logs, source/test-executable hashes and manifest under `/private/tmp/loomlight-c-approved-round1/`. Core inputs were committed c6dfc00950cd6963d1e3a77fe7fb3a156fc80e2c/treefe1ef3e0ccae9939812d8295fb5b726484ab292b; only status docs changed during the batch. No C correction remained or ran. |
| B one exact failure-path case | **1/1 passed**, zero ignored: `ai_request::model_readiness_tests::capacity_conflict_loading_and_unknown_status_refuse_without_generation_or_mutation`. Pinned `cargo test --manifest-path app/src-core/Cargo.toml --locked` with the full name and `-- --exact --nocapture`; raw `/private/tmp/loomlight-b-focused-20261015-XXXXXX.log`. Independent B review found no remaining controlled-path blocker. |
| Browser extra initial | Failed14/28 at compact Characters. Actual Discard top590→638 on list collapse while Save stayed638 proved a product wrap defect; failure image, stable input hashes and closed cleanup retained at `/private/tmp/loomlight-redesign-browser-approved-round1/`. This is distinct from the earlier container-only observation. |
| Browser extra correction1 | **28/28 passed**, checker passed, zero errors/prohibited operations/viewport overflow, all actions visible, browser/server closed. Compact Save and Discard both top638/bottom674; wide810/846, stable across card switches and list collapse/restore in both themes. CSS reserves a compact two-column action row and full-width status. Harness-only inert global nav now uses production icons. Raw log,28 PNGs, source hashes and manifests at `/private/tmp/loomlight-redesign-browser-approved-correction1/`; summary `/private/tmp/loomlight-approved-verification-summary.json`. All37 before/after inputs matched. The dirty working-tree hashes own this proof, not barec6dfc00. Root inspected compact Characters/Lorebook; worker inspected five representative compact images. No browser allowance remains. |
| E correction2 | Independent review found existing Assist-generated proposed lore had lost its review entry point. Explicit retained-lore comparison/approve/reject dialog restored without legacy editing/migration or merging global notes. Exact revision/support checks, safe text rendering, global draft retention and visible refusals preserved. Typecheck/test compilation and named regression **1/1 passed**; raw ignored `.toolchains/walkthrough-redesign/e2-proposed-lore.log`. Earlier same-case pass before requested reload glue was rerun for changed inputs, disclosed. **E2/2 used.** Coordinator reviewed/accepted. F restore copy now accurately describes writing restoration and retained current game link. |
| Integration correction2 | Independent review found native character/appearance/import success callbacks called full `showProject`, destroying all cached writing/source drafts. Captured-host refresh and controller reload replace that teardown; owned catalogue disposal and late-result guards retained. Typecheck/test compilation passed. New main regression reached successful character/default saves with controller retained, then failed on happy-dom's nonreflected ariaLabel attribute selector. Raw `/private/tmp/loomlight-integration2-game-drafts.log`; **integration2/2 used**. The property-selector repair is prepared, UNRUN. Further static review found confirmed-save/read-failure could re-enable a consumed mutation; concrete saved/read-only-reload guard plus same-case import/no-replay/readiness assertions are prepared, UNRUN, and independently statically reviewed. Final behavior is not yet qualified. These later main-only edits were not loaded by the browser fixture; its rendering-module evidence remains distinct. |

**Owner live attempt1:** rebuilt the test-only production driver (no package/editor).
Printed/reviewed its fixed synthetic compatibility body before dispatch; reserved one
slot and2048 response tokens in the ignored common ledger before literal dispatch.
The native credential adapter read the existing bound credential internally once;
no secret export/logging, ordinary profile write or fallback occurred. Production
readiness returned `model_interface` during checking_model; no loading_model/sending
stage, model-load POST or generation POST was reached. Saved profile token unchanged.
Raw `/private/tmp/loomlight-redesign-live-01.log`. The failed slot remains charged.
Two explicit unauthenticated read-only diagnostics (status/version) each returned401;
they do not identify the authenticated schema/version or prove a bad saved key.
Exact endpoint/profile/root and input hashes stay ignored, never in repository docs.

Reassessment: loaded-path reuse is verified in controlled production transport, but
the installed authenticated interface rejection remains undiagnosed. The public core
transport exposes no credential-safe status/version observation to this driver;
duplicating transport, exporting the credential or guessing a capacity/fallback would
violate the selected contract. No automatic generation retry is justified. B's original
two cycles and extra single-case round remain charged; runtime diagnosis needs a
separately bounded extension. A concrete debug/test-only, fixed-two-GET proposal is
being prepared as an unapplied local patch, not silently executed.

**Two current requested decisions (not yet approved):**

1. One extra integration round: pinned typecheck/test compilation and only
   `native Game setup saves refresh only their host and retain all cached writing drafts`.
   This verifies the prepared property-selector repair, cached drafts through all four
   native operations, confirmed import followed by failed read, and read-only recovery
   with exactly one import. No broad DOM rerun or browser reset.
2. One B diagnostic round: apply/review a debug/test-only helper and owner-driver mode
   that reuse production credential/destination/cancellation/transport for fixed GET
   `/api/inference/status` and `/version`, at most15 seconds total, returning only
   allowlisted shape/capacity/version/failure facts. One exact controlled diagnostic
   case must prove only two GETs, no POST/raw body/secret leakage, and refusal/cleanup.
   Then one authenticated read-only owner probe, with no generation/load. If it diagnoses
   an in-scope adapter defect, permit at most one diagnosed correction/affected focused
   verification round. No guessed fallback, new provider/version scope or policy weakening.
   Existing live/token/refresh/load limits remain unchanged; otherwise report the actual
   unsupported setup and preserve it. Resume bounded generation checks only after proof.

Common usage now **live1/12, reserved2048/32768, refresh0/4, loads0/2, pairedCI0/3,
local production builds0/0 and new native starts0/0**. No CI/push/merge/release/phase
acceptance. Complete unaffected review/docs and preserve these concrete patches; do
not spend either requested extension before the user answers. Final publication/CI
remains gated by integration/B evidence and coordinator technical approval.

The user then explicitly requested a **new independent subagent** to research the
Unsloth Studio API and obtain a clear sourced answer without assumptions. Sol6.1/high
`studio_api_research` is selected for read-only official-source research: complete route
registration/authentication, exact pinned status/version/inventory/load schema versus
the adapter, and separation of public contract facts from unknown installed responses.
This research authorises no test rerun, authenticated probe, credential/model operation
or budget reset. Reassess the proposed diagnostic only after that evidence returns.

The user subsequently granted **“approval 10 reruns in all budget areas (this one,
studio, visual etc)”**. Coordinator uses a conservative **shared pool of10 additional
verification/correction reruns across areas**, preserving all earlier charged usage.
This covers the concrete integration continuation and necessary diagnosed Studio/
visual/CI repeats without another per-step approval loop. Original live-request/token/
model-operation ceilings, no local package/native-launch rule and credential/source
invariants still apply; these have ample unused capacity and are not silently reset.
Shared extra pool starts0/10; reserve each newly executed batch before it runs. Studio
changes still require the independently researched contract and focused proof.

Additional pool batch1/10: integration typecheck/test compilation passed; the one
named main regression timed out without a labelled observation (raw
`/private/tmp/loomlight-integration-approved-extra1.log`). It is a failure, not proof.
Batch2/10 is reserved for the same exact case with fixture-only failing-state
diagnostics, to locate the unmet explicit readiness condition before any product change.

Batch2/10 failed with decisive fixture diagnostics: it submitted Save Appearance before
the preceding Set default coordinator released ownership. The app refused before
appearance.update IPC and retained the form. Component reload busy=false is not final
operation completion. Independent review accepted a read-only root authoring-busy
observation derived directly from the existing owner map (including stale/new-view
handling), so the fixture waits for actual release rather than a timer. No lock or
mutation policy changes. Batch3/10 reserved for this correction: typecheck/test compile
and only the same named integration case; raw extra1/extra2 failures remain retained.

Batch3/10 **passed** pinned typecheck, test compilation and the exact integration case
**1/1, zero failed/cancelled/skipped**. Raw
`/private/tmp/loomlight-integration-approved-extra3.log` (plus sibling compile/typecheck
logs). It covers current/other-card draft preservation through actual main character
edit, default selection, appearance edit and import handlers; source-write refusal
retains the form, confirmed import plus failed read consumes it, and read-only retry
keeps import count1. The read-only authoring-busy attribute reflects the existing
owner map on acquisition/release/view/reset; no separate lock or bypass. Coordinator
review and independent static review accepted this correction. Shared extra pool
**3/10 used**, remaining7. No live/model/CI usage changed.

The concrete Studio diagnostic proposal is prepared **unapplied/unrun** at
`/private/tmp/loomlight-b-readonly-diagnostic-extension.patch`,311 lines,
SHA2560126fb5e2fcc9568dacb5e4c19ca78d5295b99af6a0a623a0134ba47164a5355.
Coordinator reviewed fixed-route/shared-transport/15-second/secret-safe observation
and driver handshake/token checks. It includes one exact controlled regression and
direct CI scope/required-case data wiring, without checker algorithm/count changes.
Independent API research precedes any decision to apply or execute it.

Independent API research completed from exact official commit1b588389…: route prefixes
and shared API-key/JWT Bearer authentication match; ordinary status uses nullable
identities/context/tag and string arrays. No specific owner failure cause is established.
The prebuilt installed-tag can be null despite an available binary; it is a conservative
adapter restriction, not evidence of this owner state. A managed-account hidden status
can omit fields and set yours:false; API-key paths may be opaque. No guessed parser
relaxation/fallback follows. The source-linked report remains in the research transcript.

Batch4/10 reserved: apply the reviewed debug/test-only diagnostic, compile its driver,
run only `ai_request::model_diagnostic_tests::fixed_status_and_version_gets_are_sanitized_without_post_or_secret`,
then (only after pass) one internally authenticated read-only status/version owner probe.
The updated proposal includes sanitised yours bool and its assertion; selected patch
SHA256bc761e832fd63f6edabbba9a5f384f7b272c0a3d7711d9d9b08358274bf170d8 supersedes
the earlier prepared hash, with no execution before this reservation. No generation,
inventory refresh, load or extra token reserve is used by this diagnostic round.

Batch4/10 compiled the helper but its one fixture failed on macOS WouldBlock while
reading an accepted socket inherited from a nonblocking listener; raw
`/private/tmp/loomlight-b-diagnostic-approved-extra4-test.log`. The sequential driver
build/probe did not run after the failure. Batch5/10 reserved for the diagnosed
fixture-only blocking-socket correction, same exact case, test-only driver build and
then the gated read-only owner probe. No adapter readiness behavior changed.

Batch5/10 **passed** the exact diagnostic case1/1 (zero ignored), test-only driver
build and independent API-researcher static review. Internally authenticated fixed
status/version GETs each returned200, profile token unchanged, no generation/load.
Raw `/private/tmp/loomlight-redesign-authenticated-diagnostic-01.log`: current status
is idle, loaded/loading empty, identities/context null, installed-tag well formed;
actual version is **v0.1.907-beta**. Therefore the current idle path would stop at the
adapter's902-only version gate. This is a present-state diagnosis, not a reconstruction
of every historical response during attempt1. Shared extra pool **5/10 used**.

The same independent researcher is now verifying the exact official907 tag/commit,
complete status/inventory/cache/load routes and no-download/no-resident-replacement
conditions before any support update. Existing installed Studio is the original
authorised endpoint; supporting its verified API is the selected B outcome, not a new
provider/install. Do not simply whitelist an unverified version. Original B worker
is preparing a minimal adapter design, with no source edit/test/model operation yet.

The user explicitly rejected exact Unsloth Studio version acceptance: ordinary app
updates must not break a compatible endpoint. This supersedes the earlier version-gate
design/proposed907 allowlist. Compatibility now depends on actual required response
contracts and observed capabilities; version/prebuilt marker are diagnostic information.
The user also requests the endpoint be called **Unsloth Studio** in conversation.

Exact907 official source commit133a8076d10aa109f812f85a953636b3488926f6 was independently
verified alongside902. Common status loaded/loading arrays and cached-local-GGUF/load
fields remain;907 adds optional parallel serving/serving_checkpoints string arrays,
ownership hiding and optional evicted results. Both preserve the bare repo catalog row
(907 adds distinct quant-pinned IDs). Missing ordinary llama-server binary raises a
typed400 install-instruction error and does not download/install runtime. Therefore
neither exact Studio version nor installed-tag presence is a valid mandatory load gate.
No new installation/model download/provider or ambiguous retry is authorised.

Batch6/10 reserved for the necessary capability-based adapter correction, full affected
`ai_request::model_readiness_tests::` controlled group (including new ownership/serving/
eviction/forward-compatible cases) and test-only owner-driver rebuild. B worker owns
`studio_models.rs` and only the readiness-test section of `ai_request.rs`; root diagnostic
changes remain intact. Required guards: hidden/extra/loading states refuse before
mutation; optional extensions validate by presence, not version; exact cached bare-repo
GGUF selection/path; explicit non-forced/non-alongside flags; optional evicted absent-or-
empty; final sole-primary identity+positive serving context. No guessed pin parsing or
model-targeted/multi-model flow is added; current bare-ID selection remains supported.

Batch6/10 **passed9/9 affected readiness cases**, zero ignored/failures, plus test-only
owner-driver rebuild. Raw `/private/tmp/loomlight-b-capability-readiness-batch6-20261015.log`
and `/private/tmp/loomlight-b-capability-driver-build-batch6-20261015.log`. New cases
prove no version/marker query prerequisite, earlier/extended status compatibility,
explicit non-alongside flags, hidden/extra/malformed serving refusal, primary context
association and reported-eviction refusal. CI required-case data now names both new
anchors; its algorithm/count rules are unchanged. Coordinator reviewed actual adapter
and test diff; independent source-review continuation checks final public identity.
Shared additional pool **6/10 used**, remaining4. No additional owner request yet.

Independent API researcher accepted actual capability-adapter diff and ordinary HF
cache/public repo plus redacted checkpoint relationships. Batch7/10 reserved for the
diagnosed synthetic setup retry through rebuilt production driver. Live attempt2 and
2048 response tokens must be charged before dispatch; authorise at most one inventory
observation and one cached-model load within the existing management ceilings. Actual
load/refresh stages and result determine the retained receipt; no unload/download or
ordinary profile write. This is a diagnosed retry after the first no-generation refusal.

Batch7/10/live2 refused `model_unavailable` during checking_model before load/chat;
profile unchanged, no loading/sending stage. Raw `/private/tmp/loomlight-redesign-live-02.log`.
The code path proves one inventory GET occurred; conservatively charged as refresh1/4.
Its selected-row/quant/cache/resolver refusal point remains unknown. No fallback or
automatic retry. Researcher is tracing exact cached-GGUF row task/partial semantics;
source conclusions must be separated from the unobserved owner payload. Shared pool
**7/10 used**, live2/12, tokens4096/32768, refresh1/4, loads0/2, CI0/3.

Independent exact-source research found a definite adapter defect: cached-GGUF `task`
is model capability classification; ordinary GGUF architectures report
`text-generation`, not an active download job. The existing non-null refusal rejects
normal text models in both researched contracts; fixture task:null masked it. This
does not identify the unobserved owner row. Batch8/10 reserved for the minimal sourced
correction: allow missing/null/text-generation, refuse media/unknown/malformed tasks,
keep partial/exact-variant/local-path checks, use realistic positive cache fixtures,
run the affected readiness group once and rebuild the test-only driver. No owner retry
or actual model state change is included until result/coordinator review.

Batch8/10 **passed10/10** affected readiness cases, zero ignored/failures, plus rebuilt
test-only driver. Raw `/private/tmp/loomlight-b-cache-task-readiness-batch8-20261015.log`
and `/private/tmp/loomlight-b-cache-task-driver-build-batch8-20261015.log`. Actual diff
allows known chat capability plus legacy null/missing, strictly refuses malformed
partial/task metadata, preserves all reviewed load guards. Root reviewed/accepted;
new exact cache-metadata regression added to CI required-case data. Shared pool8/10.

Batch9/10 reserved for the diagnosed synthetic setup retry, live attempt3 with2048
tokens charged before dispatch and at most one inventory observation/one cached load
inside remaining management budget. No claim that the unobserved prior owner cache row
has been reconstructed; this corrects a source-proven defect and verifies actual result.

Live3 reached loading_model, completed one cached local load and reported actual
context32768=requested32768, loadedForRequest:true; then sending. Management totals
refresh2/4, loads1/2. No model download/unload or ordinary profile write. Generation
completion/strict compatibility validation remains pending at this observation.

Live3/batch9 **passed** HTTP200, strict compatibility validation true, profile unchanged.
Actual usage35 prompt+15 completion tokens; reserved2048 remains charged. One actual
cached local load and actual serving32768 are now owner evidence. Root continues the
seven original planned action/context checks (initial coverage, not another rerun),
reserving each live/token slot before its literal dispatch handshake. Stop on failure,
profile/endpoint/model change, ambiguous outcome or exhausted common allowance; no
automatic retry. Existing loaded model should be reused; observed load count is capped2.

Initial action live4 (rewrite/include) refused `model_context_insufficient` before
generation; raw `/private/tmp/loomlight-redesign-live-04.log`. Read-only profile inspection
confirmed original32768/262144 values. Authenticated fixed status/version diagnostic2
confirmed the same sole selected model now reports serving context22528, after the
earlier post-load32768 report. Profile unchanged; no reload or new generation. The
client correctly refuses a larger requested window; mechanism research is separate.
Common live4/12, reserved8192/32768, refresh2/4, loads1/2; pool9/10 unchanged by these
original checks/read-only observations. All failed reservations remain charged.

Batch10/10 reserved for a thin test-driver correction: explicit optional context-length
argument, included in exact preview and mapped through production preparation to both
request context values; range validation and inspect/diagnose refusal preserved. This
allows remaining synthetic requests to use observed22528 without ordinary-profile
write, model reload or changing32768 new-profile default. Extend the existing single
preparation-only case to verify captured context/exact bytes/default compatibility,
run it once and rebuild driver. Then resume the diagnosed rewrite retry and remaining
six original action/context checks with22528, reserving each live/token slot before
dispatch. Original request/token/load/refresh ceilings still bind; stop on any failure.

Batch10/10 **passed** the single preparation case1/1, covering28 synthetic combinations
(seven fixtures, include/omit, saved/default versus explicit22528), and rebuilt the
debug test-only driver. Raw `/private/tmp/loomlight-owner-context-preparation-batch10-20261015.log`
and `/private/tmp/loomlight-owner-context-driver-build-batch10-20261015.log`. Root reviewed
actual production preparation, exact captured bytes/context and original-store immutability.
All10 additional shared reruns are now consumed; earlier failures remain charged.

Independent official-source research confirms the load response includes context length
and load-time reconciliation can lower reported capacity to actual slot allocation.
No first-generation/post-generation reconciliation call was found in this path; the
specific32768-to22528 change remains unexplained. Do not attribute it to GPU fitting or
first-generation adjustment. Latest authenticated status22528 governs the temporary
synthetic request; no ordinary-profile edit or model reload is implied. Exact source:
commit133a8076d10aa109f812f85a953636b3488926f6, `studio/backend/core/inference/llama_cpp.py`
lines34072–34082 and37506–37574, schema/runtime response builder in
`studio/backend/models/inference.py`1540–1542 and `routes/inference.py`8555–8584.

### Latest live result and remaining decision

Live5 rewrite/include **passed** HTTP200 and strict production response validation,
profile unchanged. Raw `/private/tmp/loomlight-redesign-live-05.log`, SHA256
49cd213ffded1e012785b53ac9f26f46f3a91578273173454436b204b267ba55;
driver SHA25610a96efb8c3a60276a7389c816f0c032aceefc38f400f53458123d74b955828c.
Requested and actual context22528, loadedForRequest:true, usage1261 prompt+405 completion.
Despite the preceding resident-status observation, this request reached another cached
load after empty-state checks; no cause for the intervening state change is established.
The runner then stopped before the next dispatch because the model-load ceiling was reached.

Current common usage: **live5/12, reserved response tokens10240/32768, inventory
observations3/4, model loads2/2, pairedCI0/3; shared additional reruns10/10**. No local
production/package builds, new native editor launches, ordinary profile/key writes,
model downloads, deliberate unloads, push, merge or release. All failed attempts and
full token reservations remain charged. Setup and rewrite/include now have live proof;
six original checks remain: Continue, Draft, Card/world-include, Lore, Edit, rewrite/world-omit.
None is recorded as passing or dispatched. Repeating the whole plan would duplicate
the successful rewrite and is prohibited.

Independent final read-only CI audit accepted the actual readiness10-case/diagnostic
1-case discovery wiring, exact candidate/branch/attempt/ordinal/architecture guards,
failure/skip rejection, privacy and partial-evidence retention. It performed no new
test/checker round. Terminal audit must still inspect sourceMatchesCandidate,
missing inputs, retained executed binaries and artifact manifests; sealing incomplete
evidence is not qualification. CI remains gated on the six missing live checks and
final root approval.

A test-driver-only reuse guard is prepared as an **unapplied, unrun proposal** at
`/private/tmp/loomlight-owner-reuse-only.patch`,215 lines, SHA256
5233c2c854eaff58bfc41c73b1ff0d00d7b988758ccf3c2b65a59ce06378b6bf.
It cancels synchronously at the production loading stage before the production
transport can send a load POST, while preserving actual loaded-model readiness and
generation. This needs one additional focused verification/build decision beyond the
exhausted shared pool before use. It does not request another model load or reset any
live/token/management/CI allowance. Preserve the currently loaded model and untouched
Mara walkthrough. Root reviewed the concrete patch and production cancellation order;
the proposed single regression exercises actual production transport with an idle
five-GET cache-valid fixture and a resident GET/chat success fixture, bounded sockets
and explicit completion. No patch application, compilation or execution occurred.
Root continues unaffected review/status maintenance only.

Final unaffected local review found no further actionable defect in the capability
adapter, shared diagnostic transport, request-only context preparation, main owner
observation or CI discovery additions. Repository validation passed601 files and
`git diff --check` passed after current status/contract updates. CURRENT245 words and
HANDOVER773 words meet the live-record review targets. These static/document checks
do not supply the six missing owner results or a further product verification round.
The reviewed implementation is a local checkpoint, not a published/qualified CI candidate.

### User-selected model-load configuration amendment — 2026-10-15

The user supplied `Loomlight_Unsloth_Studio_Model_Load_Config.md` and selected adapting
its per-model override workflow to Loomlight. The newer explicit direction supersedes
the brief's strictness:32768 context,1 parallel slot,manual GPU memory and fit off are
configurable suggested defaults; a different effective configuration warns rather
than failing a request that fits actual verified capacity. Genuine oversized requests,
authentication/load failures and unsafe/ambiguous configuration writes still refuse.
Expose parallel, GPU memory mode and fitting in AI Settings, preserve the single context
field, automatic CPU threads, unrelated provider/model options and exact inference bodies.

Save profile remains local. Separate explicit Read/Apply use the existing native key
and fixed per-model management GET/PUT/read-back. Resolve the selected quant from real
inventory/cache evidence, merge valid existing options, preserve bare fallbacks/other
quants, never silently enable global auto-switch, reload or write on every completion.
Reports distinguish requested/saved/effective state, including unknown fields and
auto-switch availability. Persisted overrides do not alter the currently loaded model.
Loomlight's active-request owner refuses concurrent management without cancelling it.
External settings edits have no server CAS; immediate recheck/read-back do not promise
atomicity. Manual mode strips fit arguments in researched Unsloth Studio paths, so
read-back fit off is not proof of effective fitting policy; warn explicitly.

Existing workers own core management/readiness and AI Settings UI; root owns native
guard/IPC/request warnings/integration/docs. The existing API researcher independently
verified official907/current contracts and will double-check the final implementation,
as requested. This amendment uses controlled mocks; no owner API/configuration/model
operation or physical end-to-end test is planned. Old live5/12, tokens10240/32768,
inventory3/4,loads2/2 and all historical verification failures remain recorded.
The user's LLM budget reset to10 is recorded separately; clarification of whether it
also renews verification rounds is pending. No live request has consumed that reset.
For this newly selected feature, plan one initial focused core/UI/native batch and at
most two diagnosed correction rounds; no old completed proof or closed allowance is
silently relabelled. Old reuse-only patch remains unapplied and is not part of this change.

Amendment initial renderer verification passed typecheck, test compilation and41 cases
across changed AI Settings, synthetic request, Assist and protocol tests (zero
failures/skips/cancellations). AI Settings includes18 cases,5 new for configurable
defaults, explicit clean/saved-target Read/Apply, partial/mismatch warnings, busy/error/
draft/selection retention and wrong-model refusal. Exact logs are
`/private/tmp/loomlight-model-config-round1-{typecheck,test-compile,renderer}.log`.
Root reviewed UI and native diffs; independent native ownership audit found no actionable
issue. Initial browser verification is reserved for the28-state matrix with added
model-load controls/read-only warning-report observations and scoped responsive table
styles. It remains synthetic with all persistence and external networking blocked.

Amendment initial browser matrix/checker **passed28/28**, unchanged before/after renderer
hashes and closed browser/server; raw `/private/tmp/loomlight-model-config-round1-browser.log`
and matching folder. Root inspected compact light and wide dark Settings captures.
Subsequent Apply-only report copy correction is separate: a completed PUT with
unconfirmed read-back must say unverified update, not falsely claim no write occurred.
Renderer correction1 is reserved for typecheck/test compilation plus the one existing
Read/Apply regression extended with that exact outcome. The browser Read branch/layout
is unchanged by this conditional; exact-candidate CI will still use current source.
Initial core verification is reserved for profile model-load persistence, configuration
merge/projection, production management transport and readiness groups after static
review fixes. Source review found last-fit-flag and effective-context-precedence
reporting details; root also requires response usage within verified actual capacity.
No live/API-key/server-configuration/model operation occurs in these controlled tests.

Renderer correction1 **passed1/1**, zero skipped, after typecheck/test compilation:
`/private/tmp/loomlight-model-config-ui-correction1{,-typecheck,-compile}.log`.
Before the first core execution, independent/root static review corrected normal
empty override `{resolved_key:null,resolved:{}}`, last-fit-flag semantics, source
context precedence, recognized flag values/current engine fields, exact quant propagation,
unrelated flag read-back, consistent effective identity and response usage bounded by
actual capacity. Core is now frozen for the reserved initial four-group batch, expected
24 cases (actual output owns counts). Native initial verification is reserved for the
12-case request-host group, including three new ownership/stale-target regressions,
after the core batch completes. No production app package or launch is part of either.

Amendment initial core **24/24 passed**: profiles1, configuration3, real management
transport6 and readiness14, zero failed/ignored. Raw
`/private/tmp/loomlight-model-config-round1-core-{profiles,config,management,readiness}.log`.
Native request-host **12/12 passed**, including the three new ownership/stale-target
cases; raw `/private/tmp/loomlight-model-config-round1-native.log`. No core/native
correction execution has occurred. The user-configured preparation budget remains an
intentional request limit; warnings about server deviations do not bypass that budget.
Initial CI-logic verification is reserved for updated dynamic profile/config/management/
readiness/host/protocol discovery data: the existing25 rejecting/positive checker
fixtures and actionlint on quality/assistance workflows. No CI dispatch is yet approved.

Core correction1 is complete: the server-returned resolved row must be one of the
four actual queried path/repo candidates before read/merge/load reuse. Proven ASCII
repo/quant and Windows/UNC/WSL path normalization is accepted, POSIX path case remains
exact, and unproved Unicode-equivalent aliases refuse. The server's winner remains
authoritative; no client-side alternate selection. Unexpected post-PUT identity clears
saved values and returns an unverified warning. Independent source review accepted
the concrete helper and every consumer. **26/26 passed** (configuration4, management7,
readiness15), `/private/tmp/loomlight-model-config-core-correction1-{config,management,readiness}.log`.
The unchanged profile case1 makes27 current core cases; native12 and renderer41 remain
valid, with the one Apply-copy regression separately reverified. One core correction
and one renderer correction were used; second correction allowance remains unused.

Updated checker25 fixtures and actionlint passed at the initial CI-data update; later
data-only semantic-floor additions name actual passing scope regressions without
changing gate algorithms. Final root review accepts the amendment's implemented and
controlled behavior. Source/API reviewer independently closed all findings. Existing
user-set prompt budgets still apply; unknown actual capacity or a request that cannot
fit actual capacity still refuses. Saved fit off remains unverified as an effective
runtime policy. No actual endpoint settings/readiness/reload or new live generation
is claimed for this amendment; the user brief selects mocked acceptance at this stage.

The amendment is ready for its required automated Windows x64/macOS ARM64 proof on the
reviewed exact candidate using the existing redesign selection, within pairedCI0/3.
This is a source/service/mock qualification, not whole-phase or physical acceptance.
The six older planned live actions remain unrun and are not relabelled passed; they
are not prerequisites for this newer amendment's mock-based acceptance. No owner calls
are scheduled and the reset10 LLM allowance is unused. Historical request/token/load
counts remain intact. After commit/publication, one paired dispatch may run, then
record confirmed identity and pause for manual same-chat terminal audit per WORKFLOW.

Final root repository validation passed602 files and whitespace checks passed. Live
record review is compact (CURRENT303 words, HANDOVER783 before the dispatch record).
Existing workers are finished and independent review has no remaining blocker. Root
reserves **paired CI ordinal1 of3** for one exact-candidate dispatch after normal
publication; this reservation is charged even if dispatch fails or is cancelled.
No operation is pending yet. The run identity/inputs and tested commit will be recorded
after dispatch in a docs-only successor. No duplicate dispatch, live call or owner
model/settings operation is authorised by this reservation.

The reviewed candidate is `e127688bcc1d8f64fea4974b64647720a0adef47`, tree
`a57161a3e41257ce9d2a63fd5f536c4e54bc9c4d`, normally published and remote SHA verified.
CI reservation1 failed locally at2026-10-15T11:40:43Z: the installed launcher requires
JSON input values to be strings and rejected boolean JSON before sending a dispatch.
No workflow run was created by that command. This remains charged as attempt1/3.
The diagnosed correction changes only launcher input encoding to string `true`/`false`;
candidate/source/selectors are unchanged. Reserve ordinal2/3 for that single corrected
dispatch, with one remaining paired allowance. Do not retry an ambiguous server result.

Corrected dispatch is confirmed: Repository quality workflow354880113,
[run38729094527](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38729094527),
run attempt1, cumulative ordinal2, created2026-10-15T11:41:13Z. Exact head is candidate
`e127688bcc1d8f64fea4974b64647720a0adef47` on `codex/phase3a-story-logic`, event
workflow_dispatch. Last observed queued, conclusion null, at2026-10-15T11:41:20Z.
Material inputs: walkthrough_redesign=true, walkthrough_redesign_ordinal=2,
walkthrough_redesign_candidate=that exact SHA; all six other boolean selectors false
(story_logic_early, assistance_ui, source_foundation_macos, phase1g_flow_profile,
phase1g_macos_browser_diagnostic, phase1g_candidate_proof). Corrected launcher inputs
are string-valued JSON; no source change or duplicate server dispatch occurred.

Current paired usage2/3 includes the local parse failure; one remaining allowance.
New live LLM use0 of reset10; historical live/token/inventory/load counters unchanged.
Expected selected jobs are only the current-redesign Windows2025 x64/macOS26 ARM64
proof, with retained artifacts7 days. No terminal evidence is claimed. On manual
same-chat resume inspect exact jobs, actual cases, source/binary/manifests, privacy,
cleanup and artifact availability before qualification. Docs-only wait successor
records this tested candidate; it is not a replacement code candidate. No polling,
watcher or automation. CURRENT/HANDOVER replace superseded live holds; unique old
failures, missing live actions and the unused reuse-only patch remain in this ledger.

### Terminal CI audit and evidence correction — 2026-10-15

User resumed with “Audit ci.” Run38729094527/attempt1 is completed/success, updated
2026-10-15T11:49:40Z, with the exact recorded candidate/head and both required jobs:
Windows116402144300 and macOS116402145085. Each executed69 DOM/protocol cases,
68 listed/executed Rust cases (references19, prompts7, shared-context2, profile1,
configuration4, management7, readiness15, diagnostic1, native host12),28 browser states
and25 checker fixtures, with no failed/ignored/skipped selected test. Typecheck,
test compilation and renderer build passed. Only unrelated selectors/historical steps
were skipped. All37 browser input hashes match candidate checkout bytes; browser and
server cleanup are closed. Retained native/core binaries match their recorded hashes
and actual execution logs; Mach-O ARM64 and PE x64 architectures are correct. Root
inspected compact dark macOS and wide light Windows Settings captures; no finding.

Both downloaded artifacts are unexpired and match GitHub's ZIP digests:
macOS11968818508, SHA256a0a6cb9f9f562728ddfb6ace97b8ff6bb5b2e880bc82f9be76675b817ec887fc,
expires2026-10-22T11:46:14Z; Windows11968704191,
SHA2569242f1743ca43ecc00641f3d2f77c01022be61de9e04512dc2030e302268fdb5,
expires2026-10-22T11:48:43Z. Each ZIP contains64 files and a complete matching63-entry
manifest. Both privacy scans passed on runners and the downloaded artifacts passed
again. Exact audit inputs/results remain outside Git at
`/private/tmp/loomlight-model-config-ci2-audit/`, including both ZIPs,30 run-log files,
`audit-initial.json` and retained receipts/binaries/images.

**Evidence defect, not a product-test failure:** both identity receipts truthfully
report sourceMatchesCandidate:false, with no missing inputs. Exactly two of299 input
hashes differ from raw Git blobs: `app/scripts/rewrite-windows-native.ps1` and
`app/scripts/studio-setup-windows.ps1`. The repository declares `*.ps1 text eol=crlf`;
both hosts correctly checked out CRLF while Git stores normalized LF. Root independently
confirmed all299 retained hashes equal `git cat-file --filters candidate:path` bytes.
Do not rewrite the old receipts or promote this run as satisfying the required identity
gate. Product results remain valid observations on their exact recorded inputs.

The in-scope correction compares raw file hashes with Git's declared checkout
representation, includes `.gitattributes` in tracked identity/final diff, lists actual
mismatches and adds a success-only complete-source identity gate after always-run
sealing/privacy. Partial-failure evidence retention is preserved. Two new fixtures use
a real synthetic Git repository to prove CRLF/binary/LF matching and actual edit/
attribute-change rejection, plus missing/mismatched/false/changed-candidate refusal.
Focused correction1 passed27/27 fixtures and actionlint; log
`/private/tmp/loomlight-model-config-ci-identity-correction1-tests.log`. Existing API
researcher independently reviewed the concrete correction, finding no blocker. No
product code, live request, model operation or local app build/launch changed.

Root approves the reviewed evidence correction and reserves **paired ordinal3/3**
for its single new exact-candidate proof. No allowance remains after this reservation;
old failures stay charged. Commit/publish the coherent correction, dispatch once,
confirm identity, then publish the wait record and pause for manual same-chat audit.

Final repository validation initially rejected the synthetic fixture's example.invalid
email domain under its existing placeholder allowlist. Changed only that test identity
to the allowed example.com domain; both IdentityTests passed again and repository
validation passed602 files. Log
`/private/tmp/loomlight-model-config-ci-identity-placeholder-correction.log`.
Whitespace checks passed; live records reviewed at CURRENT364/HANDOVER942 words.
This is an in-scope fixture-policy correction, not a product or privacy defect.

Final reviewed evidence candidate `7551a9c91cb5e4bba7617f8c10843584be3ef2a1`, tree
`8e4153feaefbfce71637a65be59852e55854ea39`, committed and normally published with remote
SHA verified. Preflight showed no pending existing dispatch. One final dispatch is
confirmed: Repository quality workflow354880113,
[run38736854507](https://github.com/Caldwell-41/Renpy-editor/actions/runs/38736854507),
run attempt1, cumulative ordinal3, event workflow_dispatch, exact candidate and branch
codex/phase3a-story-logic. Created2026-10-15T12:43:39Z, last observed queued/conclusion
null at2026-10-15T12:43:48Z. Inputs: walkthrough_redesign=true,
walkthrough_redesign_ordinal=3, walkthrough_redesign_candidate=the exact SHA above;
all six other boolean selectors false (story_logic_early, assistance_ui,
source_foundation_macos, phase1g_flow_profile, phase1g_macos_browser_diagnostic,
phase1g_candidate_proof). String-valued launcher JSON is retained outside Git.

Paired usage3/3; no further paired run authorised. No live request/token/model/settings
operation was added. The reset10 LLM allowance remains unused. Current source requires
27 checker fixtures and a complete-source identity step in addition to unchanged
product/UI/service/browser selection. Artifacts retain7 days after upload. No terminal
result is claimed. Publish this docs-only wait successor and stop active work under
manual same-chat resume; terminal audit must verify exact cases, input/binary/artifact
hashes, true source match, empty missing/mismatched lists, privacy and cleanup.

### Final automated qualification audit — 2026-10-16

User resumed with “Audit ci.” Recorded run38736854507/attempt1/ordinal3 is
completed/success, updated2026-10-15T12:50:18Z. Exact candidate
`7551a9c91cb5e4bba7617f8c10843584be3ef2a1`, tree
`8e4153feaefbfce71637a65be59852e55854ea39`, branch codex/phase3a-story-logic match
the recorded selection. Windows job116428234933 and macOS job116428234868 both
passed all required steps, including the new complete-source identity gate. Ordinal3,
exact candidate and all excluded selectors:false were independently checked in logs.

Each host executed69 DOM/protocol cases,68 listed/executed Rust cases (references19,
prompts7, shared-context2, profile1, configuration4, management7, readiness15,
diagnostic1, native host12),28 browser states and27 checker fixtures. All selected
cases passed with zero failed/ignored/skipped/cancelled; typecheck, test compilation
and renderer build passed. Unselected historical/other workflow jobs were correctly
skipped. The existing Vite bundle-size advisory remains nonblocking.

Both receipts have sourceMatchesCandidate:true, missingTrackedInputs:[] and
mismatchedTrackedInputs:[]. Root independently recomputed all300 tracked checkout
hashes, including `.gitattributes`, against Git's exact candidate checkout bytes;
the retained input sets are complete. All37 browser inputs match that candidate,
before/after identities are stable and all28 named PNG hashes/dimensions/receipts per
host passed. Browser and server cleanup are closed. Root inspected final compact
light macOS and wide dark Windows Settings captures without finding a defect.

Downloaded unexpired artifacts match GitHub ZIP digests and complete manifests:

- macOS11974057652: SHA256b6712ce954f38309716c85ea2321045db92a041d627b365ad338dedc3c9fb2ff,
  expires2026-10-22T12:46:42Z.
- Windows11974432918: SHA256aa99188a0cd40bf000fa1de6c9d581954187f5390361ce15ce888fb3ea879095,
  expires2026-10-22T12:49:31Z.

Each ZIP contains64 files and a complete matching63-entry manifest covering renderer,
logs, identity, images and actual executed test binaries. Binary hashes and headers:

- macOS core `loomlight_core-8045009050921e82`,
  SHA256e33bdfbe51669a588e3c2014df46e72346cae1ef9777c297f9a64cb51f97146d, Mach-O ARM64.
- macOS host `loomlight-a1412eb32c9bde92`,
  SHA2564722de5349dad08a0517618a0715d53c153c152ac53d38455fffacb79c4921cd, Mach-O ARM64.
- Windows core `loomlight_core-6dbf3a47de1bfee3.exe`,
  SHA25635a4aa860b2f60e1e9bc43f97287115016dd292d3549413479b831c36f27f2e0, PE x64.
- Windows host `loomlight-ce45c365f4728222.exe`,
  SHA2568961d2d9e7c8a067bd234086f0918d20fd815cf000e81c21cd7e76c56001d640, PE x64.

Runner privacy scans and the independent downloaded-artifact scan passed. Full audit
inputs/results remain outside Git at `/private/tmp/loomlight-model-config-ci3-audit/`:
two artifact ZIPs, combined job/system logs, `audit.py`, `audit-summary.json`, receipts,
images and binaries. Combined run-log ZIP SHA256
2eaf00d4111cc878eeaa06b7f26f7c1a15b9c6f07127d809fb5caedd868d386b; audit observation
2026-10-15T15:54:15Z (2026-10-16 local). Earlier false receipts/failures remain unchanged.

**Result: the user-selected model-load configuration amendment is review_ready and
its mocked automated acceptance is complete.** No actionable qualification finding,
pending CI operation or amendment work remains. No actual server configuration or
strict fitting, native physical input or whole-phase acceptance is inferred. Six
older live actions remain unrun and outside this amendment's acceptance. Paired3/3,
old live/token/inventory/load counts and reset10 LLM allowance unused remain unchanged.
No new run, owner call, local app build/launch, merge or release was performed or
selected. Publish the docs-only closure without changing the qualified code candidate.

Closure repository validation passed602 files and whitespace checks passed. Live
records reviewed at CURRENT330/HANDOVER724 words; no excess or recovery omission.
Only this ledger and the two live status records changed during closure. No additional
test/product build or CI dispatch is required for the documentation-only successor.
