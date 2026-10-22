# Walkthrough redesign implementation

## Current disposition

The Unsloth Studio model-load configuration amendment is `review_ready` after
final automated qualification on 2026-10-16. Its mocked automated acceptance is
complete. No amendment repair or CI operation is pending. Broader walkthrough,
Phase2/3A native/live and human acceptance remain incomplete; the original
walkthrough remains paused at Step3.

The qualified amendment candidate is `7551a9c91cb5e4bba7617f8c10843584be3ef2a1`,
tree `8e4153feaefbfce71637a65be59852e55854ea39`, from
`codex/phase3a-story-logic`. Mac is the chosen development host; CI supplied
Windows x64/macOS ARM64 automated proof. [CURRENT](../../status/CURRENT.md)
owns the current branch and selected work. The old create-chat/delegation and
dispatch instructions are [historical](../evidence/walkthrough-redesign-implementation.md#outcome-and-execution-model).

## Selected amendment and compatibility

Later settings and connection changes belong to the
[Phase2 settings/connection contract](phase-2-initial-llm-assistance.md). It
supersedes this outcome's original response default of 8,192 with 16,384 and defaults
Thinking on without rewriting authored saved limits. Setup requires Name, Endpoint/private
HTTP, native API key, Connect, model choice, then Save. Draft Connect performs GET
authentication/discovery before Save; response-format testing remains separate.
Consult that brief when changing Settings defaults, connection setup or their proof.

The model-load configuration amendment supersedes the original strict configuration
requirement. Context32768, one parallel slot, manual GPU memory and fitting off are
suggested configurable defaults. A different effective configuration warns while
requests that fit verified actual capacity may proceed. Oversized requests,
authentication/load failures and unsafe or ambiguous writes still refuse.

Profile Save stays local. Explicit Read/Apply use the existing native credential
path and fixed per-model GET/PUT/read-back. Resolve the selected quant from actual
inventory/cache evidence; preserve existing options, bare fallbacks and other
quants. Report requested, saved and effective state, including unknown values and
auto-switch availability. Overrides do not change the currently loaded model.
Immediate recheck/read-back cannot promise server atomicity without CAS. Saved
fit off does not prove effective runtime fitting policy. Keep that warning visible.
The active-request owner refuses concurrent management without cancelling its request.

Preserve schema1 references, unknown extensions, legacy lore and explicit selection.
Associate characters/cards by stable ID. Reads leave empty writing/world records
virtual; explicit saves and create/link/restore actions use the existing transaction
layer. New form defaults apply on explicit save without overwriting legacy profiles.
Restoring a card creates a fresh current revision with its extensions and ordinary
support/approval checks. The single context control preserves legacy serialized fields;
world/tone enters writing context after user initiation with exact preview and omission.

## Requirements and source of truth

- [Consolidated decisions](../../design/character-workspace-2026-10-15/walkthrough-decisions.md)
  own approved layout and copy, subject to the later Phase2 settings/connection
  contract above; they also own character association, approved B, relationships,
  starting knowledge, omitted controls and surfaced card-history restore.
- [Lorebook refinements](../../design/lorebook-workspace-2026-10-15/README.md#agreed-refinements--2026-10-15)
  own World & starting situation, tone/style, shared writing context with visible
  per-request omission, distinct character voice and growing fields/fixed actions.
- `app/src/ui-refresh.css` and the approved application palettes own colours. Generated
  blue/purple treatments do not override the Paper/Teal and Charcoal/Copper themes.
- Read AGENTS, CURRENT, HANDOVER and relevant contracts/workflow/testing sections.
  Update canonical contracts as implemented behavior changes; images remain proposals
  about arrangement, not evidence that behavior works.

## Scoped deliverables

| Slice | Deliverable | Required evidence / dependencies |
| --- | --- | --- |
| A — Settings | Approved wording/placement, one context setting/default32768 and current response default16,384, conditional HTTP option, reload/retry behavior and confirmed Danger Zone removal. | Production form actions; exact defaults without overwriting existing profiles; failure/cancel/draft/selection preservation. No actual ordinary profile/key removal. |
| B — Studio loading | Supported Studio inventory/load/status adapter and generation readiness flow, requested versus actual context, already-loaded reuse and diagnosed failure/cancel behavior. | Official/installed-version interface evidence; production request path; controlled loaded/unloaded/insufficient-context/failure tests and bounded owner live checks. No implicit download/unload. |
| C — Character lifecycle | Game/card associations, empty writing section for game characters, Planning only/In game, explicit create/link actions and transactional source creation. | Production operations prove either starting point, no duplicates, stable IDs, source/custom preservation, Undo/Redo/reopen. Publish contracts before D consumes them. |
| D — Character workspace | Approved B layout, shared collapse controls, stable anchors, per-field helpers, compact relationships, starting-only knowledge and agreed control removals. | Production UI actions and rendered light/dark wide/compact states; multiple differing cards, collapse/switch/draft/focus preservation. Preserve exclusive ownership of shared code. |
| E — Global Lorebook and AI context | Two-field project-wide world/tone document, preserved legacy data, default shared writing context with preview/omission and separate character voice. | Save/Discard/Undo/reopen, exact included/omitted outbound payloads, budget admission, no duplicate/conflicting hidden tone source, no project content in connection tests. Use the agreed reference contracts. |
| F — Previous-card restore | Readable recent-version preview and explicit Restore this version through the transaction layer, as a new current revision. | Actual restore, stable identity, current-draft guard, Undo/Redo/reopen, existing bounded retention and unchanged approval/freshness refusals. Preserve shared reference contracts; no destructive history rewind. |
| G — Test/CI audit | Minimal affected-scope regression extensions and audited coherent-candidate workflow selection for Windows x64/macOS ARM64. | Written findings and fixes, positive and rejecting gate fixtures, exact candidate identity and artifact retention. Audit logic before dispatch; coordinator owns final workflow integration. |

Slice B follows the selected configurable-defaults amendment above; strict equality
to the suggested defaults is superseded. Actual verified capacity and safe ownership
remain required. Consult version-specific interface evidence before changing the
adapter; the historical installed-version baseline is not a current interface check.
This table retains the broader implementation requirements; it does not claim every
live, native or human acceptance condition is complete.

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
  app launches**. Any newly selected CI build checks require review under WORKFLOW.
- Browser fixtures do not establish packaged WebView physical input or screen-reader
  proof. Use the appropriate target-host evidence for changed behavior; report a named
  missing capability rather than substituting a weaker pass. No broad package/SDK matrix
  for unrelated inputs, hostile-filesystem experiments or deliberate crash campaigns.

## Acceptance results and remaining proof

| Acceptance area | Current result and evidence |
| --- | --- |
| Amendment's controlled UI/service/configuration and identity proof | [Final automated audit](../evidence/walkthrough-redesign-implementation.md#final-automated-qualification-audit--2026-10-16): run38736854507/attempt1/ordinal3 at `7551a9c`, both hosts pass69 DOM/protocol,68 Rust,28 browser and27 checker cases; complete source identity, retained artifacts and cleanup audited |
| Prior identity mismatch | [Earlier terminal audit](../evidence/walkthrough-redesign-implementation.md#terminal-ci-audit-and-evidence-correction--2026-10-15) preserves false source-match receipts, CRLF diagnosis and correction; the earlier green run did not satisfy identity acceptance |
| Original live checks | Setup and rewrite/world-include have live proof. Continue, Draft, Card/world-include, Lore, Edit and rewrite/world-omit remain unrun; [last live result](../evidence/walkthrough-redesign-implementation.md#latest-live-result-and-remaining-decision) owns the exact observations and proposal |
| Real server configuration, effective fitting, native physical input and whole-phase acceptance | Not established by mocked amendment proof. Broader acceptance remains pending under the owning phase tasks and [HANDOVER](../../status/HANDOVER.md#native-recovery-and-remaining-acceptance) |

The amendment selected controlled mocks; the six older live actions are outside
its completed acceptance. Read the [amendment selection](../evidence/walkthrough-redesign-implementation.md#user-selected-model-load-configuration-amendment--2026-10-15)
when checking that change of scope or its exact local verification usage. Artifact
availability is separate from the retained dated audit. Neither a historic green
badge nor this documentation change refreshes expired artifacts.

## Allowances and protected recovery

| Allowance | Recorded usage and boundary |
| --- | --- |
| Original live generations and reserved response tokens | live5/12; tokens10240/32768; failed/uncertain attempts and full reservations remain charged |
| Model management | Inventory observations3/4; model loads2/2; no additional model load is authorised |
| Shared additional reruns |10/10 used; per-slice failures/extensions remain in the [execution record](../evidence/walkthrough-redesign-implementation.md#execution-ledger--2026-10-15) |
| Amendment paired CI |3/3 used, including the rejected local dispatch command; no further paired run is authorised |
| Separate LLM reset |10 granted and unused; no operation is scheduled or inferred from unused capacity |
| Redesign local production/package builds and new native starts |0/0; no local production build or new native launch was selected |
| Older protected walkthrough | Paused Step3; builds2/2 and launches2/3; separate from redesign counters |

The original Mara walkthrough session, its unsaved draft and recovery/session files
remain protected. Preserve the loaded model and isolated native fixture. Do not
close, save, discard, reload or repurpose the user window, or bypass single instance.
[HANDOVER](../../status/HANDOVER.md#native-recovery-and-remaining-acceptance) owns
exact recovery and the separate native Thinking/Studio counters. The old reuse-only
driver patch remains unapplied and unrun; its existence grants no verification,
load or live-call allowance. Earlier closed budgets stay closed across chats/hosts.

## Completion and next action

The amendment needs no further automated work. Whole-phase acceptance remains the
user's decision. Resume broader acceptance only under its current selected contract,
with the protected state and cumulative allowances reconciled first. Keep new work's
scope, exact candidate, meaningful results and remaining proof in its brief; append
detailed attempts to the matching evidence record. No new dispatch, live generation,
package, native launch, merge or release is selected by this documentation cleanup.
