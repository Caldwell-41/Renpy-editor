# Walkthrough redesign implementation

**State: blocked on bounded verification extensions; implementation local; approved for execution on 2026-10-15.** The user approved the
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

## Requirements and source of truth

- [Consolidated decisions](../../design/character-workspace-2026-10-15/walkthrough-decisions.md)
  own settings copy/defaults, character association, approved B, relationships,
  starting knowledge, omitted controls and surfaced card-history restore.
- [Lorebook refinements](../../design/lorebook-workspace-2026-10-15/README.md#agreed-refinements--2026-10-15)
  own World & starting situation, tone/style, shared writing context with visible
  per-request omission, distinct character voice and growing fields/fixed actions.
- `app/src/ui-refresh.css` and the approved application palettes own colours. Generated
  blue/purple treatments do not override the Paper/Teal and Charcoal/Copper themes.
- Read AGENTS, CURRENT, HANDOVER and relevant contracts/workflow/testing sections.
  Update canonical contracts as implemented behavior changes; images remain proposals
  about arrangement, not evidence that behavior works.

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

## Scoped deliverables

| Slice | Deliverable | Required evidence / dependencies |
| --- | --- | --- |
| A — Settings | Approved wording/placement, one context setting/default32768 and response default8192, conditional HTTP option, reload/retry behavior and confirmed Danger Zone removal. | Production form actions; exact defaults without overwriting existing profiles; failure/cancel/draft/selection preservation. No actual ordinary profile/key removal. |
| B — Studio loading | Supported Studio inventory/load/status adapter and generation readiness flow, requested versus actual context, already-loaded reuse and diagnosed failure/cancel behavior. | Official/installed-version interface evidence; production request path; controlled loaded/unloaded/insufficient-context/failure tests and bounded owner live checks. No implicit download/unload. |
| C — Character lifecycle | Game/card associations, empty writing section for game characters, Planning only/In game, explicit create/link actions and transactional source creation. | Production operations prove either starting point, no duplicates, stable IDs, source/custom preservation, Undo/Redo/reopen. Publish contracts before D consumes them. |
| D — Character workspace | Approved B layout, shared collapse controls, stable anchors, per-field helpers, compact relationships, starting-only knowledge and agreed control removals. | Production UI actions and rendered light/dark wide/compact states; multiple differing cards, collapse/switch/draft/focus preservation. No parallel edits to C's owned shared code. |
| E — Global Lorebook and AI context | Two-field project-wide world/tone document, preserved legacy data, default shared writing context with preview/omission and separate character voice. | Save/Discard/Undo/reopen, exact included/omitted outbound payloads, budget admission, no duplicate/conflicting hidden tone source, no project content in connection tests. Depend on agreed reference contracts; sequence shared-file writes. |
| F — Previous-card restore | Readable recent-version preview and explicit Restore this version through the transaction layer, as a new current revision. | Actual restore, stable identity, current-draft guard, Undo/Redo/reopen, existing bounded retention and unchanged approval/freshness refusals. Sequence shared reference edits with C/E; no destructive history rewind. |
| G — Test/CI audit | Minimal affected-scope regression extensions and audited coherent-candidate workflow selection for Windows x64/macOS ARM64. | Written findings and fixes, positive and rejecting gate fixtures, exact candidate identity and artifact retention. Audit logic before dispatch; coordinator owns final workflow integration. |

Each slice returns its patch/commits, a scope-to-acceptance checklist, exact checks and
results, unresolved issues and a concise self-review. No agent can approve its own
slice as the final review. The coordinator reviews the diff, traces behavior through
production code, checks negative paths and either accepts it or returns a bounded
correction. Do not fabricate an independent review by reusing the implementer's label.

## Thin testing contract

- Exercise production UI actions, typed IPC, service methods and real transaction
  boundaries. A driver may coordinate inputs and collect observations; it must not
  implement a second copy of selection, lifecycle, state, patch or validation logic.
- Wait on explicit readiness: rendered/enabled controls, completed requests, persisted
  state or the supported Studio ready signal. No arbitrary sleeps, generic timeout
  inflation, swallowed errors or success inferred from merely launching a process.
- Keep assertions behavioral and exact: included/excluded payloads, preserved bytes,
  stable IDs, dirty-state guards, refusal with zero writes, cleanup and actual results.
  Do not weaken assertions, suppress failing tests or add bypasses to obtain green CI.
- Use controlled synthetic fixtures for reproducible failures. Real local Studio checks
  complement them; CI receives no Studio credentials and performs no live generations.
- Run focused applicable checks locally. Test compilation and test-only production
  drivers are permitted; **no local production/package/installer builds or new native
  app launches**. Required CI build checks happen only after review approval below.
- Browser fixtures do not establish packaged WebView physical input or screen-reader
  proof. Use the appropriate target-host evidence for changed behavior; report a named
  missing capability rather than substituting a weaker pass. No broad package/SDK matrix
  for unrelated inputs, hostile-filesystem experiments or deliberate crash campaigns.

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
