# Walkthrough redesign implementation — proposed handoff

**State: not_started; awaiting user approval.** No implementation, subagent dispatch,
new chat, CI run or live generation is authorised by drafting this plan. Approval of
this plan selects the outcome and finite allowances below; prior closed budgets do
not roll over or reset. The original Phase 2 / 3A walkthrough remains incomplete.

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

Before creating the new chat, obtain approval of this proposed plan. Then create only
the one requested coordinator chat with its specified model/effort, current local
project and this task as the implementation contract. The coordinator creates subagents
as scoped workers; do not create a separate user chat for every slice.
