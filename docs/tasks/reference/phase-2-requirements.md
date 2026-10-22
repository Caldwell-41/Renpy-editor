# Phase 2 requirements

Read the relevant section when implementing or assessing a Phase 2 capability. The [phase brief](../active/phase-2-initial-llm-assistance.md) owns current acceptance, selected allowance and concise evidence results. This reference owns the applicable 2A–2C/U1–U12 requirements; it does not authorize execution.

## Current amendments and precedence

Studio is the sole Phase 2 provider. Session-only credentials, selected-route context/repeated visits/bounded cycles, and AI Scene-ending/connection changes are excluded or deferred. Qualified inference is non-streaming; SSE needs separate selection and proof. Thinking defaults on, maximum response defaults to 16384, and saved authored values survive. Draft Connect authenticates/discovers before model selection or Save through native memory-only key ownership; Connect is GET-only and separate from explicit model-specific response-format testing.

The [walkthrough decision index](../../design/character-workspace-2026-10-15/walkthrough-decisions.md) owns approved connection sequence, single-context presentation, model-loading follow-up and Characters design; [Lorebook design](../../design/lorebook-workspace-2026-10-15/README.md) owns the later project-wide world/tone design. The [implementation task](../active/walkthrough-redesign-implementation.md) owns their selected delivery. These later decisions supersede older field/layout and inference-only suggestions below. Stored references and ordinary approval/freshness/history remain protected. Design approval and automated qualification remain distinct from native/human acceptance.

Canonical ADR/data/UI contracts own exact implemented behavior. Historical research, old operational status and superseded wording are in the [evidence ledger](../evidence/phase-2-execution.md).

<a id="in-plain-language"></a>

## In plain language

| Part | What you can do when it is complete |
| --- | --- |
| 2A — Connect and configure | Choose a provider/model, securely configure access, set context and maximum response tokens, test the connection and cancel a request. |
| 2B — Give the LLM the right references | Write/edit Character cards and a lorebook, choose which approved entries to include, edit system prompts or restore the baseline, and inspect the complete context before sending. |
| 2C — Generate, review and apply | Rewrite/continue/create Scenes, generate or update Character cards and lore entries, review changes, accept a valid subset and undo them. |

At Phase 2 acceptance, the author can write with selected character/world references, controlled prompts and size limits, then review generated changes before they become durable. The [shared delivery reference](phase-2-3-delivery.md) owns ordering and dependencies; each phase retains its own acceptance gates.

<a id="1-outcome-and-scope"></a>

## 1. Outcome and scope

An author can select narrative content, choose an assistance action, inspect the exact proposed context/destination, generate a structured proposal, review semantic and file changes, accept a dependency-valid subset, and undo normally. Runnable truth remains authoritative Ren'Py source. All writes use the existing core transaction, revision, history and recovery boundary.

The only Phase 2 provider is Unsloth Studio. Generic/OpenAI-compatible adapters, profiles, auth modes, wire compatibility and live qualification are deferred outside this phase. Studio remains a named capability with dedicated setup, diagnostics, fixtures and live acceptance.

| Action | Bounded initial behavior |
| --- | --- |
| Rewrite dialogue | Replace selected dialogue/narration. Preserve speaker, order and staging unless another supported change is explicitly included in the request scope. |
| Continue Scene | Insert supported beats at an explicit anchor. Retain the existing terminal beat; AI terminal/connection changes are deferred. Refuse insertions across ambiguous/custom boundaries. |
| Draft Scene | Propose one new Scene in a selected Chapter with its explicit Return ending. AI-created incoming connections are deferred. Preserve nonempty and explicit terminal invariants. |
| Draft/update Character | Propose a new or revised Character card; optionally propose supported runnable definition fields and existing Appearance references as separate visible operations. Allocate real IDs in core; validate identifiers and collisions. |
| Draft/update lorebook | Propose individually reviewable entries or revisions from selected material or instructions, with provenance and explicit applicability. |

Character cards and the lorebook are required Phase 2 reference features, not just
transient prompt text. Both support manual authoring and user-initiated LLM generation
or revision. Viewable/editable system prompts with Restore baseline and explicit
context/response size controls are required; sections 5, 6 and 9 own their contracts.

Use only the accepted Phase 1 beat subset. Phase 2 does not introduce arbitrary Python/code generation, conditions/calls, screens/ATL, image generation, arbitrary-project import, state simulation, Run From Here, narrative consistency analysis, embeddings/vector search, background summarisation, autonomous tools, model training, provider installation or GitHub remote workflows. Preserve adult-content support without application-level filtering.

<a id="2-evidence-for-the-unsloth-contract"></a>

## 2. Evidence for the Unsloth contract

Read the [dated upstream research](../evidence/phase-2-execution.md#baseline-upstream-research) when checking the origin of the contract. It does not establish installed-version support. Canonical request/transport behavior belongs to [ADR 0013](../../adr/0013-provider-request-and-transport-contract.md); measured compatibility belongs to the selected evidence record.

<a id="3-required-unsloth-behavior"></a>

## 3. Required Unsloth behavior

| ID | Requirement |
| --- | --- |
| U1 | Named Unsloth Studio provider, setup instructions and dedicated connection diagnostics. It is not presented as an untested generic preset. |
| U2 | Accept the actual Studio endpoint; normalise an origin or /v1 base exactly once, preserve explicitly configured proxy prefixes, and reject ambiguous completion-path input with useful guidance. Never assume one fixed port or scan ports. |
| U3 | Native secret entry; a saved key is reused across application sessions through the approved remembered-storage policy. No session-only mode. Core injects Bearer authentication. Never read Studio's credential database, scrape its console or retain API keys in renderer/project/config/log data. |
| U4 | Draft Connect authenticates and discovers models through GET before selecting a model or saving the completed profile. Saved-profile Refresh models remains explicit. Use returned IDs unchanged, keep friendly names separate and permit manual IDs when discovery is unavailable. Loaded models are not a complete downloadable catalogue. |
| U5 | Distinguish untested, ready, no loaded model, selected model unavailable, authentication failure, unreachable, busy, interrupted and unsupported capability. Only show loading/OOM/version claims when actual evidence supports them. |
| U6 | JSON-schema output is the preferred tested mode. Validate a synthetic schema probe against the selected configuration; invalidate capability evidence after relevant changes. A capability test is evidence, not a proof of every future response. |
| U7 | Thinking is an explicit on/off setting, effectively on when missing. Preserve authored saved values. Keep reasoning separate from final content and applicable proposals. |
| U8 | Use one editable Context length, default 32768, for total request budget and requested model-load context. Maximum response length defaults to 16384 within that total. Show detected server capacity separately and verify applied capacity; an output limit does not resize loaded context. Preserve existing saved authored limits. |
| U9 | Support local and explicitly configured network connections, non-streaming baseline and a separately qualified SSE option. Tunnel mode selects non-streaming before send; no hidden retry with another transport. |
| U10 | Disable server-side tools in every qualified Studio request; expose no client tools, persistent tool sessions or autonomous tool loop. Test the disable behavior before project sends; reject unexpected tool events/results. |
| U11 | Dedicated errors and recovery guidance for revoked keys, missing model, server restart, unsupported fields, truncation and interrupted streams. Preserve the author's input and project. |
| U12 | Live synthetic acceptance for the supported Studio version/configuration, including structured proposals and disabled tools, plus packaged Loomlight client evidence on both supported operating systems. |

Existing inference requires the explicitly selected model and invalidates pending send review when discovery changes. No silent model substitution. Check returned model identity where supplied and document aliases or missing identity evidence. The approved model-load follow-up in the [walkthrough decision index](../../design/character-workspace-2026-10-15/walkthrough-decisions.md) adds user-initiated readiness/loading with actual context verification; its owning implementation task selects and proves that new behavior.

Model-loading work must verify the supported public interface and installed version before use. Preserve shared-model ownership, cancellation and truthful readiness. Loading/downloading, launching Studio, killing processes or unloading another client's model needs its own selected scope; the approved loading requirement does not permit implicit downloads or shared-model disruption.

<a id="4-shared-provider-and-credential-architecture"></a>

## 4. Shared provider and credential architecture

[ADR 0013](../../adr/0013-provider-request-and-transport-contract.md) owns request/transport behavior. [ADR 0011](../../adr/0011-ai-settings-secrets-and-reference-storage.md) owns configuration, credentials and reference storage decisions. The [Mac development storage task](../active/2026-10-08-macos-development-credential-storage.md) owns its approved temporary exception and qualification limits.

Keep privileged effects in Rust/core and the trusted desktop host. Add narrow services for provider profiles, credential references, request execution, context assembly and proposal preparation. Keep the existing IPC envelope and deny-by-default WebView capability model. Renderer actions reference opaque configuration/request/proposal IDs; no generic HTTP, shell or filesystem capability.

Use the existing source, request, credential, context, proposal and reference services. Confirm their actual interfaces before changing them.

Keep existing HTTP infrastructure if it meets cancellation and streaming requirements. Add or change a dependency only after a documented gap/licence review; do not conduct a broad stack replacement.

A provider profile stores a UUID, provider kind, label, canonical endpoint, optional selected model, authentication/storage mode, opaque credential reference, transport choice, capability evidence and bounded generation settings. Profiles and project-to-profile bindings are machine-local. Moving a project requires explicit profile selection and credential setup; project text never imports or activates an endpoint. ADR 0011 records the accepted storage design; current qualification is summarized in the phase brief.

Credential entry, replace and delete use native controls. Use **Remember on this
computer** under the approved storage policy and reuse the saved key across sessions.
The user's 2026-10-12 correction removes **Use for this app session** from the product
requirement; no session-only implementation or automatic fallback is selected.
Qualification uses the ordinary saved Studio profile through native/core access;
do not create a disposable credential store for each live session or delete the
user's saved key as test cleanup. Owned synthetic project/test roots and explicitly
temporary fixture credentials remain disposable. Only an app-reported missing or
unreadable saved credential requires fresh native entry; never read/export the key
through tools or chat.
Studio requires its API key. Generic authentication modes are outside Phase 2.
Authenticated v1 profiles use Bearer keys, not arbitrary headers or OAuth. OS-store
failure is actionable and cannot fall back to plaintext. Renderer sees only mode and
configured/missing/unavailable state; there is no read-secret IPC. Key changes
invalidate prepared sends. Never pass keys to Ren'Py, Git, subprocess environments,
request previews or diagnostics. Memory/swap/OS internals are not claimed perfectly secret.

<a id="storage-ownership-and-credential-lifecycle"></a>

### Storage ownership and credential lifecycle

The approved [temporary Mac development plan](../active/2026-10-08-macos-development-credential-storage.md) supersedes Mac API-key storage only. Native entry and Rust-only secrets remain required. Its current identity/signing/storage limits remain binding; this reference grants no credential-policy change.

| Content | Planned location and contract |
| --- | --- |
| Profiles and device-local project bindings | Versioned `ai-profiles.json` under the existing application-data root; validated safe replacement, separate from UI preferences. Defaults/capability evidence bind to model/configuration. |
| Remembered keys | Baseline macOS Keychain / Windows Credential Manager design; the selected temporary Mac development exception uses encrypted local files and an unencrypted local unlock key, retaining all native ownership as deferred. |
| Session-only keys | Excluded by the user's 2026-10-12 saved-key-only decision; earlier session-mode designs are historical. |
| Bundled prompts | One versioned packaged prompts resource directory; no duplicate handler literals. |
| Project prompts/style notes | Versioned `.renpy-editor/ai.json`, full override text plus baseline version/digest; existing metadata transaction/history/recovery. |
| Cards/lore | Versioned `.renpy-editor/references.json`, shared record service with separate collections; section 9 owns the format. |
| Prepared requests/replies | Memory-only; section 8 governs explicitly saved proposed references. |

OS entries and profile files cannot share one filesystem transaction. Prepare a
replacement key under a fresh opaque credential ID, then safely switch the validated
profile reference. A failed profile write preserves the previous working reference
and attempts cleanup of the new entry. Delete obsolete entries only after the switch.
Report cleanup failures and retain their references for bounded retry. For removal,
make the profile unusable for sends before deleting its owned OS entry; a failure
retains a non-secret cleanup reference and reports incomplete removal. A failed profile replacement retains the prior usable state. Never delete another profile's entry. Use deterministic failure fixtures, not a new transaction
framework or hostile/crash programme.

Local removal does not revoke a provider key; explain revocation separately. Project
copies/backups contain no credentials. Key export, cloud sync and portable vaults are
deferred. Match native persistence/access attributes to machine-local storage; keep
application/entry identifiers stable across updates and test namespaces separate.
Qualify packaged reopen/update identity under the approved [Mac package identity and
signing contract](../../../app/README.md#macos-local-package-identity). Its signing
identity, names, credential namespaces and approval boundaries remain mandatory.
Earlier unsigned-development evidence does not waive that contract.


Endpoint policy: permit loopback HTTP and verified HTTPS. Private-network/VPN HTTP is selected with distinct per-profile opt-in and unencrypted-transport disclosure; ADR 0011 records the choice. Test ordinary address classification and credential/redirect mistakes, reject non-private plaintext destinations, and never globally disable TLS verification. Show connection location and inference locality separately, including unknown. Do not infer confidentiality from a hostname. Reject credentials in URLs, unsupported schemes and unreviewed redirects; bind the credential to the exact reviewed origin. Explicitly govern proxies and DNS/address changes so credentials cannot be redirected silently. No endpoint is imported or activated from project/model text.

Unsloth provider setup explains that Studio can inspect request content in its own monitor; Loomlight's log redaction does not control provider retention. A sensitive-content warning identifies remote/unknown inference or an intermediary service without content filtering.

<a id="5-request-execution-and-budgets"></a>

## 5. Request execution and budgets

Network work must not hold the project mutation lock or block Save, editing or cancellation IPC. Capture an immutable input snapshot under a short read/validation boundary, release it, then send in a cancellable worker. Re-enter the existing mutation boundary only for final accepted changes.

One active generation per project is the initial limit; another request requires cancellation or completion. Bound outstanding connection tests globally as well. No hidden queues or model-wait polling.

Request states: prepared, sending, receiving, validating, review_ready, failed, cancelled, expired and consumed. Cancellation and late-result publication arbitrate against the same request/session generation. A cancelled or replaced session cannot become review_ready/applicable. Disconnection may not stop provider computation or billing; report cancellation of the client request truthfully.

[ADR 0013](../../adr/0013-provider-request-and-transport-contract.md) and the canonical request implementation own qualified deadlines and resource bounds. Check that contract before changing limits. Bound connect/no-progress/total time, outbound body, final text, total response and operation count. Refuse excess instead of truncating. Non-streaming has no token progress; use its total response deadline and release cancelled worker resources promptly.

Require a configured effective context ceiling when reliable introspection is unavailable. Estimate the complete outbound prompt, task instructions, schema, selected context and message framing. Reserve requested output and a labelled estimation margin; reasoning may consume part of the model's generation/context allowance. Never equate max output with total context. Use provider-specific parameter mappings and reject unsupported combinations before sending.

<a id="user-visible-size-controls"></a>

### User-visible size controls

Settings expose one Context length, default 32768, and separate Maximum response length, default 16384. Preserve explicitly saved authored values. Context length includes input, schema/instructions, selected references, reserved output and estimation margin. Show actual detected server capacity separately; requested load context is not proof of applied size. Refuse excess without dropping entries, clamping authored values or silently reloading. The [walkthrough decision index](../../design/character-workspace-2026-10-15/walkthrough-decisions.md) owns approved presentation and model-loading follow-up requirements.

Map maximum response to the qualified provider's output-limit field. This is a ceiling,
not a promise of exact prose length; schema text and, where applicable, reasoning use
the allowance too. A requested word/beat count belongs in the visible task instruction
and remains a soft target. A truncated structured response cannot be applied. Saving
or overriding either setting invalidates a prepared send and updates its preview.
Reopen restores profile defaults; switching provider/model cannot silently reuse an
incompatible limit. If loaded context must change, report actual readiness and use only the selected, qualified loading path. Until that follow-up is implemented and proved, explain the required external configuration.

Use saved Temperature and Top-p, with effective missing-field defaults 1.0 and 0.95 and finite ranges 0–2 and 0–1. Explicit Save preserves credential ownership and invalidates prepared sends. Preserve editable output allowance and qualified thinking controls; optional provider-specific fields require a typed allowlist. No arbitrary headers or unchecked extra JSON overrides of tools, endpoint, auth or context.

Show provider-reported tokens/finish reason/latency when available. Distinguish measured from estimated counts, and missing usage from zero. Optional monetary estimates require user-supplied prices and remain estimates. Do not include a model/price catalogue.

Start with non-streaming complete responses. SSE adds bounded incremental parsing, UTF-8/chunk/event limits, timeouts, progress and cancellation without exposing partial JSON as accepted edits. Every generation still requires an explicit send. No automatic retry, repair request, continuation, fallback provider or downgrade of response mode.

<a id="6-deterministic-context-and-prompt-control"></a>

## 6. Deterministic context and prompt control

Prepare context from committed source plus validated editor metadata; unresolved target drafts/conflicts must be resolved before an applicable request. Unrelated drafts may remain but are excluded and disclosed.

The manifest records project/session identity, action/targets, allowed mutation scope,
selected ordered beats/Scenes, all source and metadata revisions read, approved
Character-card and lorebook revisions, referenced entity IDs, prompt/schema version,
exclusions, uncertainty and size estimate. The user's 2026-10-12 direction defers
selected-route context, repeated visits and bounded route cycles beyond Phase 2.
Stored reference applicability may still use a finite route; that does not assemble
route context or claim runtime reachability.

Defaults: selected narrative content, relevant runnable Character definitions, approved cards linked to selected Characters, explicitly selected approved lorebook entries, and the necessary variable/asset references. Show suggested card inclusion and allow the author to exclude it before Send; list every included entry and its revision. Lorebook scope/Character tags help selection but do not silently inject every matching entry. Dependency expansion is visible in the review; its inclusion grants no mutation authority. Variables are labelled as defaults or supported scene-local observations. Unknown conditions/custom effects are not invented as known state. No automatic asset binary, whole-project, hidden file, credential, Git history or external-file inclusion.

Protected source remains unchanged. Default to a visible custom-code marker; explicit inclusion of exact custom text requires a preview and still grants no right to execute or edit it. Treat all project prose, filenames, lore and model output as untrusted data. Prompt injection cannot add tools, expand files or change the configured destination.

Use stable ordering/deduplication and explicit budget refusal. Do not silently shorten dialogue or remove dependencies. Defer automatic summaries/embeddings; any later selected summary needs matching provenance revisions and stale invalidation.

Store editable task prompt resources in one versioned prompts directory; no duplicate hardcoded prompt text in handlers. Provide project-local author instructions/style notes separately from machine provider configuration. Schema, operation permissions and security checks remain core-owned. Preview the effective instructions and context; save template edits explicitly and include their digest in the manifest.

<a id="system-prompt-editor-and-baseline"></a>

### System prompt editor and baseline

Expose the actual system/authoring instructions for each assistance action in Settings.
Users can inspect and edit them, save project-local overrides, and choose **Restore
baseline** for the selected prompt or explicitly for all prompts. Show the bundled
baseline version and whether the current prompt is customized. Uncustomized prompts
use the installed app's baseline; a changed version/digest appears on the next send
review. Updates never overwrite custom text. Show its saved baseline version and allow
comparison with the installed baseline. Restore baseline removes the override and
restores the installed app's bundled text
through the ordinary undoable metadata change path, leaving cards, lore, credentials
and generation settings intact. Changing or resetting a prompt invalidates prepared
sends and requires a fresh preview. Baseline prompts remain maintained in one versioned
resource location, with overrides stored separately.

Preview the complete effective instructions and context, including any adapter mapping
to system/developer roles. Character cards and lore are reference data, not hidden
system prompts. Core-owned schema, path, operation and transaction validation is
visible as the response contract but is not disabled by editing prompt prose. Prompt
editing does not introduce application-level content filtering. Protect unsaved prompt
edits across navigation; persisted overrides and reset/undo survive normal reopen.

Custom prompts belong to each Ren'Py game project, not this chat or a personal shared
library. An override replaces that action's authoring prose; project style notes remain
separately visible. V1 uses literal text and core-owned context assembly: no executable
templates, recursive macros or card-supplied system-prompt overrides. Save/reset use
project metadata history; editing prose cannot disable the response/operation contract.

A prepared-send token binds the exact request body, profile/model/capability configuration, read-set revisions and disclosure. Send rechecks that token before dispatch. Relevant edits require rebuilding and reviewing; unrelated changes should not invalidate a provably unaffected request. Never rebuild silently after consent.

<a id="7-structured-proposals-and-source-preparation"></a>

## 7. Structured proposals and source preparation

Use a versioned, closed proposal schema with typed semantic operations and proposal-local references. Core owns real UUID allocation and source/path derivation. Initial operation families are dialogue/narration replacement, supported beat insertion, one Scene creation with Return, runnable Character creation/update within scope, and Character-card/lorebook entry proposals. AI replacement of existing terminal Beats or story connections is deferred by the user's 2026-10-12 decision. Approval is an explicit user operation; model output cannot approve itself.

Responses cannot choose arbitrary paths, patch custom source, rename technical identifiers implicitly, execute code, import assets, invoke tools or write outside the allowed target set. Enforce existing string/metadata/integer/source bounds, including exact decimal representation for large integers.

**Generated text boundary (selected 2026-10-07):** generated dialogue, narration,
choice captions and other displayed source strings are literal prose by default.
Core must encode them for both the source string and Ren'Py's display-text syntax;
escaping quotes/backslashes alone does not neutralize interpolation or text tags.
Model-supplied bracket/brace syntax must not become active Python interpolation,
hyperlinks, control-flow tags or asset references. This is operation validation,
not content filtering. Cards/lore remain ordinary metadata text; do not apply runnable
text escaping to their stored prose.

For rewrites, preserve existing reviewed placeholders and formatting through opaque,
revision-bound tokens owned by core. The model may rewrite literal segments but may
not supply, alter, reorder, duplicate or remove protected tokens. Show preserved tokens
in the review and restore their exact original source representation. Refuse a target
when its literal/token boundaries cannot be established safely; do not silently strip
markup or escape the entire existing line. New active markup/expression generation is
outside this initial contract. Manual Source editing remains unchanged. Final emitted
source and the preview digest must reflect this validation before acceptance.

Before the first applicable rewrite, add focused planner/emission tests for expression
and function-call interpolation, action-bearing tags, ordinary literal brackets/braces,
existing placeholders/formatting, token tampering and unsupported-target refusal.
Use harmless synthetic strings and a bounded pinned-SDK assertion that accepted literal
text displays literally; no hostile payload execution is needed. Rejected proposals
write nothing, and valid accepted changes retain ordinary undo/reopen behavior.

Validation order:

1. Require successful protocol completion, a single final result and a usable finish reason. Truncation, refusal, empty response or interrupted stream is non-applicable.
2. Parse one complete JSON document with depth/size/count limits, duplicate-key rejection and no arbitrary regex extraction or heuristic repair.
3. Validate schema version, exact fields, action allowlist, target scope, values and proposal-local references.
4. Resolve dependencies; reject cycles/missing definitions, ambiguous references and unsafe custom-boundary crossings.
5. Revalidate all context and target revisions, lifecycle identity and current draft/recovery state.
6. Compile the selected semantic operations into one previewed final mutation set using the existing source/transaction primitives.

The former text-JSON compatibility mode was for generic endpoints and is deferred
outside Phase 2. Studio acceptance uses its documented schema mode, with the same
strict local validation. No silent downgrade when a schema request fails.

Build a non-mutating proposal planner over the actual accepted Phase 1 services. Existing single-operation apply handlers must not be looped to simulate a batch. Prepare a transient candidate, apply supported semantic intents in dependency order, combine changes to the same file, check final invariants, and produce exact minimal source/metadata patches. This transient object exists only for review; it is not a competing runnable document.

The displayed file diff must derive from the exact core-prepared mutations later accepted. SDK validation is an explicit separate trust action because it can execute project code; ordinary proposal preview is static and non-executing.

<a id="8-review-partial-acceptance-history-and-lifetime"></a>

## 8. Review, partial acceptance, history and lifetime

Provide semantic and file views, readable explanations, affected entities, dependencies and uncertainty. Reuse the accepted UI refresh and semantic theme tokens in both supported themes, accessible checkboxes/keyboard focus, responsive panels and clear empty/error/stale states. Untrusted output renders as passive text; no injected HTML or provider links automatically opened.

Selection units are whole semantic operations or inseparable operation groups, not arbitrary diff lines. Selecting dependent dialogue requires its Character definition or explicit remapping. Changing selection rebuilds dependencies and patches and shows a fresh diff. Never auto-select hidden changes.

Accept binds proposal ID, selected operations and preview digest; core rechecks the complete read/write set and target draft generation immediately before commit. A stale source/context/card/lore revision requires fresh preparation and review; no automatic rebase. Recovery blocking and optimistic concurrency remain the established Phase 1 policies.

Commit the accepted subset through one journalled semantic transaction and one coherent undo entry. It is a recoverable multi-file sequence, not a claim of universal atomicity. Commit failure retains evidence and cannot report success. Failed pre-commit validation writes no runnable source.

After any partial acceptance, consume the original proposal; unaccepted suggestions stay visible as a reference until dismissed. Applying more requires a new prepared review against the current project. Retrying acceptance with the same token must not duplicate mutations; recovery and actual revisions determine ambiguous outcomes.

Initial transient context snapshots and generated proposal reviews are memory-only. Navigation may retain them within the same project session; close/switch warns before discarding unaccepted work. Restart does not silently persist raw prompts/replies or resume requests. Explicitly saved author instructions, Character cards and lorebook entries are durable. Unsaved generated proposals remain transient; explicitly saved proposed entries persist with their proposed status, without becoming approved reference material. Existing transaction recovery covers acceptance interrupted by a crash. Persistent proposal archives are deferred.

<a id="9-character-cards-and-lorebook"></a>

## 9. Character cards and lorebook

Manual cards/lore use directly editable forms and ordinary Save/Discard; generated material retains explicit review/approval. The [walkthrough decision index](../../design/character-workspace-2026-10-15/walkthrough-decisions.md) and [Lorebook design](../../design/lorebook-workspace-2026-10-15/README.md) own the later approved interface requirements. They supersede earlier visible field/layout suggestions here while preserving stored data, approval, freshness, bounded revisions and transactional history. The [implementation task](../active/walkthrough-redesign-implementation.md) owns execution and acceptance for those changes; design approval does not qualify implementation.

<a id="character-cards"></a>

### Character cards

For the current simplified card UI and starting-only knowledge, use the
[approved walkthrough decisions](../../design/character-workspace-2026-10-15/walkthrough-decisions.md#starting-knowledge-and-the-simpler-card).
The baseline schema below describes retained reference data. It does not select
scene-dependent learning or restore omitted card controls.

A Character card is persistent editor-only reference material, distinct from Ren'Py's
runnable Character definition. It has a stable ID, optional linked Character ID,
name/aliases, description/appearance notes, personality, motivations, background,
relationships, speaking style and example dialogue. Optional explicit Scene/route
applicability and knowledge notes control what the author intends to include; they
are not computed runtime knowledge. Field bounds and exact schema are defined before
implementation. Card appearance prose never imports/generates an image or changes an
Appearance asset implicitly.

Create/edit cards by hand, or request a draft/update from instructions and selected
story/reference material. Cards can exist before a runnable Character is created.
Review generated changes per card/field group; accepting a card does not implicitly
create or modify source. A linked runnable definition change is a separate visible
proposal operation with dependency checks. Keep one card record; reference shared
facts by lore-entry ID rather than duplicating independent canonical copies.

Use the same proposed/approved/rejected/superseded status and provenance rules as
lorebook entries. Only approved, current, included cards become ordinary generation
references. Manual save can explicitly approve the author's own entry; LLM generation
cannot approve itself. Changing accepted reference text requires a new approved
revision before it is used. Retain unresolved links when Characters are removed.
Source-derived facts become stale when their supporting revisions change; explicitly
authored intent remains distinct from a claim extracted from source.

The required baseline is native Loomlight cards, without external card-format import,
PNG-embedded cards or third-party lorebook compatibility. Those are separately
selectable interoperability work, not assumed by the word card.

<a id="lorebook"></a>

### Lorebook

The later [project-wide World & starting situation and tone design](../../design/lorebook-workspace-2026-10-15/README.md#agreed-refinements--2026-10-15)
owns the current Lorebook UI. The collection contract below preserves existing
entries, links and explicit AI selection; it does not replace that approved layout.

The lorebook is a browsable/editable collection of entries for world rules, locations,
factions, history, relationships and other selected story facts. Entries have titles,
text, categories/tags, links and explicit scope. Support manual creation, LLM drafting
of one or several bounded entries, and proposed updates from selected material.
Search/filter/select entries for generation; expose inclusions and exclusions in
context review. Automatic keyword injection, recursive retrieval, embeddings and
whole-book sends are outside the initial baseline.

Introduce a versioned editor-only lore document through the shared metadata transaction boundary. Records include stable ID, text, subject/category, explicit Scene/route applicability, optional Character knowledge annotations, source citations/revisions, inferred-versus-user-authored provenance, status, supersession relationship and review/change metadata.

Statuses are proposed, approved, rejected and superseded. Display contradictory alternatives without silently selecting a winner. Automated contradiction detection and runtime knowledge inference remain later phases.

Saving a proposed fact is distinct from approving it. Only explicit approval enables default context inclusion. An approved fact with changed supporting revisions becomes stale and requires reconfirmation before default inclusion. If supporting Scene/Character entities are deleted or missing, retain the fact and unresolved citation; do not cascade-delete or silently broaden its scope.

Provide list/edit/filter/approve/reject/supersede controls for cards and lorebook entries with undo and reopen tests. Preserve unknown metadata fields, validate migrations and bound accepted data so it remains reloadable. Lore never changes runnable variables automatically and the game must remain runnable without this metadata.

<a id="native-format-scope-and-revision-rules"></a>

### Native format, scope and revision rules

Use JSON with `schemaVersion`, `cards` and `loreEntries`; one service owns their IDs,
revisions, approval, citations, migrations and undo. Shared records have a stable ID
and revisions with revision ID, title, tags, status, provenance/citations, scope,
optional supersession link and preserved extension data. Cards contain the descriptive
fields above, optional runnable Character ID and linked lore IDs. Lore contains text,
category, subject/entity links and knowledge notes. Relationships may link entity IDs
with explanatory prose; missing links stay visible and do not cascade-delete content.

V1 scope is project-wide, selected Scene IDs, or an explicit finite selected route
retaining repeated visits. Scope aids author selection; it does not infer reachability
or inject references silently. Use written knowledge/spoiler notes. Structured
before/after variants, game-day/time validity, keyword/recursive injection and runtime
knowledge inference are deferred. Only the reviewed approved revision is sent.
An approved revision remains available while a replacement is proposed/reviewed,
unless its own citations become stale. Rejection preserves the approved text; approval
explicitly supersedes it. Existing history supports undo. Manual Save may explicitly
approve the author's own text without an additional approval ritual.

Before the 2B.1 editor, record concrete schema/fixtures for required/optional fields,
IDs/links/scope, revision selection, string/record/file bounds, migrations and unknown
fields. Derive bounds from existing metadata/reload and selected-context limits. Keep
useful approved/proposed state in the document; history owns undo rather than an
unbounded reply archive. A missing document means an empty library; malformed existing
or unsupported newer data is retained with a diagnostic, never replaced as empty.
Project AI/reference metadata is editor-only and excluded from game distributions.

Research reviewed 2026-10-07: [Character Card V2](https://github.com/malfoyslastname/character-card-spec-v2),
[V3](https://github.com/kwaroran/character-card-spec-v3/blob/main/SPEC_V3.md) and
[SillyTavern World Info](https://docs.sillytavern.app/usage/core-concepts/worldinfo/)
offer useful descriptive fields. Their roleplay prompt overrides and keyword/recursive
inclusion do not fit exact reviewed authoring context. Retain native storage and defer
external JSON/PNG import/export.

<a id="10-checkpoint-sequence-and-gates"></a>

## 10. Checkpoint sequence and gates

These are dependency checkpoints, not mandatory chat boundaries. Select one coherent
outcome with internal implementation/test/review checkpoints under [WORKFLOW](../../WORKFLOW.md);
resume that same outcome/chat after a wait. The [phase brief](../active/phase-2-initial-llm-assistance.md) owns current qualification summaries; historical preparation records are not current execution state. The table below retains the applicable Studio
requirements baseline; completed Studio/selectable slices do not establish every
operation/evidence cell. The original generic-provider requirements are superseded
by the Studio-only scope rule in section 1. Planning does not authorize provider connections
or execution.

| Checkpoint | Deliverable | Acceptance and next boundary |
| --- | --- | --- |
| 2A.0 — Studio qualification and contracts | Bounded synthetic Studio probes; version/capability matrix; request/credential/transport contract; confirm limits and management-API findings. | Record actual Studio success/failure/unknown. Prove Studio schema mode and tools-disabled behavior or record a blocker. No project sends. Return for review before production integration. |
| 2A.1 — Studio settings and credentials | One Studio provider, native credential entry, explicit context/response settings, connection/model tests and dedicated setup/readiness/error UX. | Production native entry/store/request/replace/delete, saved-key reuse across sessions, packaged reopen/identity, controlled unavailable-store failures, zero reflection, no requests on project open, origin binding and invalidation. Session-only mode is excluded by the 2026-10-12 user decision. Physical locked-store/signed-upgrade behavior is proved where accessible or retained as a limit; no enterprise-policy gate. |
| 2A.2 — Studio request service | Background Studio transport, qualified non-streaming behavior, cancellation/timeouts/resource bounds, settings mapping and usage results. | Delayed/out-of-order responses, cancellation races, dead server, bad auth, request limits and Save responsiveness. Test the Studio adapter without project writes. SSE remains outside the active outcome unless already selected and qualified. |
| 2B.1 — Context and prompts | Manual Character-card/lorebook storage and editing, deterministic manifests, budgets, dependency disclosure, revisions/provenance and system-prompt editing/baseline reset. | Golden payloads; exact selected card/lore revisions; prompt edit/reset/undo/reopen; no whole-project leakage; no silent truncation; input/output budget accounting. Selected-route context/repeated visits/bounded cycles are user-deferred beyond Phase 2. |
| 2B.2 — Assistance and send review | Five action entry points, context/destination preview and request snapshot binding. | Exact reviewed payload sent once; relevant changes force renewed review; sensitive/locality disclosures; session and pending-draft safeguards. |
| 2C.1 — Proposal planner | Strict schemas, semantic/dependency checks, literal generated text/protected existing tokens and non-mutating batch-to-patch preparation. | Malicious/invalid output writes nothing; interpolation/tag and token-tampering checks, same-file batch edits, new IDs, terminal constraints, Unicode/custom preservation and exact previewed mutations. |
| 2C.2 — Proposal acceptance | Semantic/file review, dependency-valid subsets, stale rejection, one transaction/undo and explicit transient lifetime. | Core/renderer/native acceptance, duplicate-click/retry protection, concurrent drafts, external edits, interrupted-acceptance recovery using non-crashing fault/state fixtures, no partial success claims. |
| 2C.3 — Character and lore completion | LLM draft/update of Character cards and lorebook entries, separate runnable definitions, statuses, provenance and approvals on the manual foundation from 2B.1. | No implicit lore approval or source execution; migration/reopen, stale citations, missing entities, repeated undo/redo and metadata-free game behavior. |
| 2C.4 — Integrated Studio acceptance | Real authoring workflow through all five actions on Studio and both supported client targets. | Applicable Studio matrix below passes; remaining limitations explicit; complete independent review and final human acceptance; no automatic merge or new execution scope. Selected 3A overlap follows the [shared delivery reference](phase-2-3-delivery.md). |

Dependency detail: 2B.1 supplies manual cards/lorebook and their approved-reference selection before the first rewrite. 2C.1 defines their proposal operations; 2C.3 completes LLM generation/update and lifecycle UX. Until each generated action is complete it is visibly unavailable; the five-action release claim is made only at 2C.4. Confirm schema ownership during 2A.0 to avoid circular prerequisites.

At each checkpoint, update the brief's acceptance result, linked task evidence and canonical behavior/ADRs. Run cheap relevant gates, then the required supported-target evidence for the changed candidate. Select one outcome rather than implementing all rows as one goal.

<a id="11-verification-matrix"></a>

## 11. Verification matrix

| Layer | Required evidence |
| --- | --- |
| Studio fixtures | Auth redaction; endpoint/base-path normalization; redirect/proxy refusal; unavailable/no-model/busy errors; capability mismatch; exact model IDs; malformed schema responses; tools-disabled fields; qualified transport framing and usage/finish-reason handling. Generic compatibility parsing and provider-specific adapters are outside Phase 2. |
| Lifecycle/concurrency | Studio profile/model change, key rotation, project switch, cancel/complete race, old-session callback, competing Source draft, accepted source/card/lore change, prompt reset, size-setting change, stale send token and duplicate acceptance. Save remains responsive during a stalled request. |
| Context | Manual and LLM-generated cards/lorebook; exact approved inclusions/exclusions; stale reference rejection; prompt customization, baseline reset and reopen; context/output boundary refusal; deterministic order, dependency accounting, excluded custom code/assets, unknown state, exact large integers, stale summaries/lore, over-budget rejection and no implicit sends. Selected-route context/repeats/cycles are user-deferred; stored reference route applicability remains supported. |
| Transactions | Multiple operations touching one file; new Character plus dialogue; partial dependency refusal; terminal beat validity; external edits; Unicode/BOM/newline preservation; undo/redo; failed commit; ordinary interrupted-save/recovery fixtures; metadata limits and reopen. |
| Security/privacy | Native credentials absent from renderer/project/logs/artifacts; prompt-injection fixtures cannot expand authority; unsafe names/paths/HTML refused; no ambient WebView HTTP/shell privilege; no tool execution; provider retention disclosure. |
| UX/native | Windows x64 and macOS ARM64 packaged action/context/diff/accept workflow; keyboard/focus; small window/overflow; readable status; cancel/error/retry; authoritative native credential interaction. Browser tests support but do not replace packaged evidence. |
| Live Studio compatibility | Record exact client commit, Studio version or unknown, selected model ID/quantization where known, configured context/output, transport and actual results. Use synthetic content on the selected Studio configuration. Generic endpoint testing is outside Phase 2. |
| Integrated product | Rewrite with selected cards/lorebook and a customized system prompt, restore baseline, vary context/response limits, continue/create Scene, draft/update Character cards and lorebook, approve references, inspect both diffs, accept subset, undo/redo, close/reopen, explicit SDK validate/run, and execute a copy without editor metadata. |

Both client platforms may connect to the same controlled inference host; GPU inference does not need to run on every CI worker. Deterministic CI uses a bounded fake server. Required live evidence is separately recorded, not replaced by mocks or an unavailable-provider skip. No paid/public-provider calls or GPU downloads occur in routine CI without explicit setup.

Use current repository commands from AGENTS/TESTING and add focused test commands in each implementing brief once actual paths exist. Preserve failed evidence and exact run/attempt/SHA. No full package matrix for this documentation-only plan; no duplicate unchanged acceptance runs or model polling during external waits.

<a id="component-selection-and-proof-cost"></a>

### Component selection and proof cost

This selection supplements sections 10-11 and existing TESTING selectors; it does not
waive requirement IDs or implement new evidence reuse. Map focused cases to requirements
and record counts/skips, affected hosts and finite expensive allowance before execution.
Share source/transaction fixtures and test the narrowest actual controller/service seam.

| Component | Decisive focused proof | Native/live boundary |
| --- | --- | --- |
| Profiles/keys | Persistence, replacement/removal failure ordering, unavailable store, remembered-key reuse/cleanup, origin/redirect refusal and no reflection | Early packaged entry/store/request/reopen path on both targets; mocks do not prove physical locked stores or signed upgrades. |
| Requests | Final response, auth/protocol error, timeout/cancel, stale completion and responsive Save | Fake-server failures routinely; bounded synthetic Studio configuration live. |
| Prompts/context | Exact payload, edit/reset/undo/reopen/update, selected approved revisions, exclusions and budget refusal | Controller/dispatch integration and milestone native send review; no exhaustive models/providers. |
| References | Manual/generated review, rejected replacement retains approved text, stale/missing links, malformed/newer schema refusal and migration | Shared deterministic fixtures and representative native forms. |
| Proposals | Literal text/protected-token emission, rewrite/same-file batch, valid subset, invalid/stale output writes nothing, external conflict, one undo and ordinary interrupted acceptance | First complete user action early, including harmless pinned-SDK literal-display proof, then integrated milestone. |
| 3A Story | Conditional routes, all-false continuation, call/return, nested edits and source preservation | Targeted pinned-SDK normal-play assertions on affected supported hosts. |
| 3B Screens | Nested round trip, opaque neighbor, representative dialogue/choice/menu behavior and cancel/undo | Early Ren'Py layout/interaction comparison. |
| 3C Timeline/media | Placement, idle continuity, qualified profile/mask/end state, transform/audio order and save/load/rollback | Early actual media/runtime risk proof; combined final 3C checks, not a full matrix per increment. |
| 3D State/launch | Normal-play equivalence, unresolved screen-effect refusal, passive/conventional-screen eligibility, screen-revision invalidation, save isolation and scratch cleanup | Qualified normal versus reconstructed launch at supported boundaries; no interaction recorder required. |
| Milestones | Representative game, close/reopen, metadata-free play and package privacy | Coherent-candidate affected-platform qualification; both targets at 3F. |

Keep rejecting assertions and ordinary external-edit/data-loss coverage. Use controlled
fault/state fixtures; no renewed hostile/crash, enterprise-policy or exhaustive-model
programme. Repeat native/live checks for relevant changed inputs, not documentation.
Missing access stays missing evidence. Explicit connection/capability checks disclose
potential provider billing; this plan grants no paid calls, installation or downloads.
Non-streaming is the first workflow; SSE remains separately qualified. Exclude keys,
raw replies, prompts and reference prose from routine diagnostics; future explicit
support exports preview/redact their contents. Do not transfer routine checks to users.
