# Phase 2 — Initial LLM assistance

**Planning date:** 2026-09-22; storage, references, testing and delivery refined 2026-10-07.
**State:** provider/AI implementation not started; section 21 source foundation independently reviewed and qualified on Windows x64/macOS ARM64 and integrated through PR19; this bounded outcome is closed. User removed cross-machine archive transfer as an acceptance requirement; section 23 preserves proof, failures and that decision.
**User direction:** retain Unsloth Studio and existing Phase 2/3 scope; record the reviewed storage/reference contracts, project-local prompts, localhost/LAN/HTTPS, proportionate tests and adaptive subagents. The section 22 refinement was documentation only; the subsequent section 21 selection and its evidence are recorded in section 23.
**Owner:** this brief owns Phase 2 scope, requirements, checkpoint gates and planning continuation, plus the selected cross-phase delivery sequence in section 19. [ROADMAP](../../ROADMAP.md) owns phase boundaries.
**Entry:** accepted Phase 1 through 1H, fresh inspection of actual refs/state, and explicit approval of one bounded Phase 2 checkpoint.
**Isolation:** preserve unrelated work, accepted Phase 1 evidence, release identities and the historical planning worktree. CURRENT/HANDOVER record the source-foundation continuation and publication boundary. Earlier branch/publication instructions in historical planning records are superseded by section 23 and live HANDOVER; they are not pending operations.

Implementation agents follow the accepted [UI/UX guidelines](../../UI.md#accepted-uiux-guidelines-for-implementation-agents),
including plain interface language, optional technical help, completion/submission
validation and shared control ownership. These guide future implementation; they do
not claim the current application already satisfies every interaction.

## In plain language

| Part | What you can do when it is complete |
| --- | --- |
| 2A — Connect and configure | Choose a provider/model, securely configure access, set context and maximum response tokens, test the connection and cancel a request. |
| 2B — Give the LLM the right references | Write/edit Character cards and a lorebook, choose which approved entries to include, edit system prompts or restore the baseline, and inspect the complete context before sending. |
| 2C — Generate, review and apply | Rewrite/continue/create Scenes, generate or update Character cards and lore entries, review changes, accept a valid subset and undo them. |

**At the end of Phase 2:** write with an LLM that receives your selected character
and world references, under prompts and size limits you control. Generated game
changes and reference material become durable only through your review. These are
capability summaries; sections 14 and 19 order shared foundations and a small complete
rewrite early, then overlap the remaining AI work with richer Story logic.

## 1. Outcome and scope

An author can select narrative content, choose an assistance action, inspect the exact proposed context/destination, generate a structured proposal, review semantic and file changes, accept a dependency-valid subset, and undo normally. Runnable truth remains authoritative Ren'Py source. All writes use the existing core transaction, revision, history and recovery boundary.

The required provider paths are **Unsloth Studio** and **configurable OpenAI-compatible**. Ollama support was removed by user direction on 2026-10-02; no dedicated adapter, preset, documentation or acceptance gate is planned for it. Unsloth is a named product capability with dedicated setup, settings, diagnostics, documentation, fixtures and live acceptance; its wire codec may share tested code with the generic adapter.

| Action | Bounded initial behavior |
| --- | --- |
| Rewrite dialogue | Replace selected dialogue/narration. Preserve speaker, order and staging unless another supported change is explicitly included in the request scope. |
| Continue Scene | Insert supported beats at an explicit anchor. Retain the terminal beat unless a reviewed operation replaces it. Refuse insertions across ambiguous/custom boundaries. |
| Draft Scene | Propose one new Scene in a selected Chapter. Any incoming connection is a separate visible operation. Preserve nonempty and explicit terminal invariants. |
| Draft/update Character | Propose a new or revised Character card; optionally propose supported runnable definition fields and existing Appearance references as separate visible operations. Allocate real IDs in core; validate identifiers and collisions. |
| Draft/update lorebook | Propose individually reviewable entries or revisions from selected material or instructions, with provenance and explicit applicability. |

Character cards and the lorebook are required Phase 2 reference features, not just
transient prompt text. Both support manual authoring and user-initiated LLM generation
or revision. Viewable/editable system prompts with Restore baseline and explicit
context/response size controls are required; sections 5, 6 and 9 own their contracts.

Use only the accepted Phase 1 beat subset. Phase 2 does not introduce arbitrary Python/code generation, conditions/calls, screens/ATL, image generation, arbitrary-project import, state simulation, Run From Here, narrative consistency analysis, embeddings/vector search, background summarisation, autonomous tools, model training, provider installation or GitHub remote workflows. Preserve adult-content support without application-level filtering.

## 2. Evidence for the Unsloth contract

Official documentation was reviewed on 2026-09-22. These are upstream statements, not evidence that an installed version was tested:

- [API overview](https://unsloth.ai/docs/basics/api): external clients authenticate with a Studio API key; models must be loaded; the actual endpoint/port is configurable. Studio's API monitor can display prompts, replies and usage. Older versions may lack the external API.
- [HTTP integration](https://unsloth.ai/docs/integrations/connect-curl-and-http-to-unsloth): loaded-model discovery uses GET /v1/models and exact returned IDs; generation uses POST /v1/chat/completions. JSON and SSE responses, enable_thinking, request-level sampling/output controls and server-side tool options are documented.
- [Python integration, JSON decoding](https://unsloth.ai/docs/integrations/connect-python-sdk-to-unsloth#json-decoding-response_format): response_format with a JSON schema is documented. Loomlight must still validate syntax, semantics, references and source ownership locally.
- [LAN access](https://unsloth.ai/docs/basics/lan): Studio can serve another device on the user's network.
- [API overview, remote access](https://unsloth.ai/docs/basics/api): Cloudflare quick-tunnel clients are instructed to use non-streaming requests.
- [Studio chat](https://unsloth.ai/docs/new/studio/chat): inference settings and connected external providers exist. A local connection address alone does not establish the eventual inference location.

The reviewed pages do not establish a stable external HTTP load/unload contract, guaranteed server-stop cancellation, exact tokenizer/context introspection, or minimum compatible Studio version. 2A.0 must record measured support; do not invent these APIs or infer them from the Studio browser UI.

One API-page reasoning example has contradictory prose/flag direction. Use the HTTP guide's explicit request field and measured behavior rather than copying that example.

## 3. Required Unsloth behavior

| ID | Requirement |
| --- | --- |
| U1 | Named Unsloth Studio provider, setup instructions and dedicated connection diagnostics. It is not presented as an untested generic preset. |
| U2 | Accept the actual Studio endpoint; normalise an origin or /v1 base exactly once, preserve explicitly configured proxy prefixes, and reject ambiguous completion-path input with useful guidance. Never assume one fixed port or scan ports. |
| U3 | Native secret entry; OS-backed remembered or explicit app-session-only keys; core injects Bearer authentication. Never read Studio's credential database, scrape its console or retain API keys in renderer/project/config/log data. |
| U4 | Explicit authenticated Refresh models; use returned IDs unchanged, keep friendly names separate, allow manual IDs when discovery is unavailable. Do not treat loaded models as a complete downloadable catalogue. |
| U5 | Distinguish untested, ready, no loaded model, selected model unavailable, authentication failure, unreachable, busy, interrupted and unsupported capability. Only show loading/OOM/version claims when actual evidence supports them. |
| U6 | JSON-schema output is the preferred tested mode. Validate a synthetic schema probe against the selected configuration; invalidate capability evidence after relevant changes. A capability test is evidence, not a proof of every future response. |
| U7 | Thinking mode supports provider default/on/off when qualified. Keep final response content separate from reasoning fields; never interpret reasoning or tool output as an applicable proposal. |
| U8 | Separate server context capacity, Loomlight input budget and response allowance. Do not send invented num_ctx/max_seq_length fields or claim an output limit resizes the loaded server context. |
| U9 | Support local and explicitly configured network connections, non-streaming baseline and a separately qualified SSE option. Tunnel mode selects non-streaming before send; no hidden retry with another transport. |
| U10 | Disable server-side tools in every qualified Studio request; expose no client tools, persistent tool sessions or autonomous tool loop. Test the disable behavior before project sends; reject unexpected tool events/results. |
| U11 | Dedicated errors and recovery guidance for revoked keys, missing model, server restart, unsupported fields, truncation and interrupted streams. Preserve the author's input and project. |
| U12 | Live synthetic acceptance for the supported Studio version/configuration, including structured proposals and disabled tools, plus packaged Loomlight client evidence on both supported operating systems. |

Model lifecycle baseline: users load/switch models in Studio; Loomlight refreshes availability and requires a selected model before sending. No silent model substitution. If discovery changes, invalidate the pending send review. Check returned model identity where the server provides it, with documented alias handling; do not claim identical-model proof where the protocol cannot provide it.

Investigate managed load/unload during 2A.0. If a documented stable public interface exists, propose an explicit follow-on contract covering ownership, shared users, cancellation and unloading. Until separately approved, do not launch Studio, download models, kill its processes or unload models used by other clients. First-class inference support does not depend on undocumented management APIs.

## 4. Shared provider and credential architecture

The concrete 2A.0 contract is [ADR 0013](../../adr/0013-provider-request-and-transport-contract.md).
The corrected Studio-scoped reference/design is accepted for the first bounded
remembered-profile 2A.1 slice. Generic/full-phase acceptance remains incomplete;
the [qualification ledger](#25-provider-qualification-ledger--2026-10-07)
distinguishes deterministic proof, partial production preparation and missing native evidence.

Keep privileged effects in Rust/core and the trusted desktop host. Add narrow services for provider profiles, credential references, request execution, context assembly and proposal preparation. Keep the existing IPC envelope and deny-by-default WebView capability model. Renderer actions reference opaque configuration/request/proposal IDs; no generic HTTP, shell or filesystem capability.

Candidate module boundaries, to confirm against accepted Phase 1 before coding:

- core llm/provider, llm/request, llm/context, llm/proposal and lore modules;
- desktop native credential UI/OS-store adapter and background-request integration;
- renderer assistance/context/proposal-review modules and existing semantic theme tokens;
- versioned prompt resources and strict response schemas;
- deterministic provider fixtures plus a bounded live compatibility runner.

Keep existing HTTP infrastructure if it meets cancellation and streaming requirements. Add or change a dependency only after a documented gap/licence review; do not conduct a broad stack replacement.

A provider profile stores a UUID, provider kind, label, canonical endpoint, optional selected model, authentication/storage mode, opaque credential reference, transport choice, capability evidence and bounded generation settings. Profiles and project-to-profile bindings are machine-local. Moving a project requires explicit profile selection and credential setup; project text never imports or activates an endpoint. [ADR 0011](../../adr/0011-ai-settings-secrets-and-reference-storage.md) records the accepted design, not implemented behavior.

Credential entry, replace and delete use native controls. Offer **Remember on this
computer** (OS store, default) and **Use for this app session** (backend memory only,
cleared on app exit or explicit removal; no automatic fallback from a remembered key).
A generic profile may choose **No authentication**; Studio requires its API key.
Authenticated v1 profiles use Bearer keys, not arbitrary headers or OAuth. OS-store
failure is actionable and cannot fall back to plaintext. Renderer sees only mode and
configured/missing/unavailable state; there is no read-secret IPC. Key changes
invalidate prepared sends. Never pass keys to Ren'Py, Git, subprocess environments,
request previews or diagnostics. Memory/swap/OS internals are not claimed perfectly secret.

### Storage ownership and credential lifecycle

| Content | Planned location and contract |
| --- | --- |
| Profiles and device-local project bindings | Versioned `ai-profiles.json` under the existing application-data root; validated safe replacement, separate from UI preferences. Defaults/capability evidence bind to model/configuration. |
| Remembered keys | macOS Keychain / Windows Credential Manager through the native adapter; stable application namespace and opaque profile/credential IDs. |
| Session-only keys | Trusted backend memory, cleared on app exit/removal; no project/config/history persistence. Closing a project is not app exit; disclose the lifetime before entry. |
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
retains a non-secret cleanup reference and reports incomplete removal. Apply the same
publish-before-retire rule to session-key/mode replacement: a failed profile save retains
the prior usable state. Never delete another profile's entry. Use deterministic failure fixtures, not a new transaction
framework or hostile/crash programme.

Local removal does not revoke a provider key; explain revocation separately. Project
copies/backups contain no credentials. Key export, cloud sync and portable vaults are
deferred. Specify native adapter persistence/access attributes to match machine-local
storage; keep application/entry identifiers stable across updates and test namespaces
separate. Qualify packaged reopen/update identity, retaining unsigned macOS prompt
limits without requiring a signing purchase. The credential spike had no entry UI;
it cannot qualify production entry/store/request/replace/delete behavior.


Endpoint policy: permit loopback HTTP and verified HTTPS. Private-network/VPN HTTP is selected with distinct per-profile opt-in and unencrypted-transport disclosure; ADR 0011 records the choice. Test ordinary address classification and credential/redirect mistakes, reject non-private plaintext destinations, and never globally disable TLS verification. Show connection location and inference locality separately, including unknown. Do not infer confidentiality from a hostname. Reject credentials in URLs, unsupported schemes and unreviewed redirects; bind the credential to the exact reviewed origin. Explicitly govern proxies and DNS/address changes so credentials cannot be redirected silently. No endpoint is imported or activated from project/model text.

Unsloth provider setup explains that Studio can inspect request content in its own monitor; Loomlight's log redaction does not control provider retention. A sensitive-content warning identifies remote/unknown inference or an intermediary service without content filtering.

## 5. Request execution and budgets

Network work must not hold the project mutation lock or block Save, editing or cancellation IPC. Capture an immutable input snapshot under a short read/validation boundary, release it, then send in a cancellable worker. Re-enter the existing mutation boundary only for final accepted changes.

One active generation per project is the initial limit; another request requires cancellation or completion. Bound outstanding connection tests globally as well. No hidden queues or model-wait polling.

Request states: prepared, sending, receiving, validating, review_ready, failed, cancelled, expired and consumed. Cancellation and late-result publication arbitrate against the same request/session generation. A cancelled or replaced session cannot become review_ready/applicable. Disconnection may not stop provider computation or billing; report cancellation of the client request truthfully.

Proposed initial resource limits, to be confirmed in 2A.0 with evidence: 10-second connect timeout, 180-second no-progress timeout, 600-second total generation timeout (editable per profile within a bounded 30-1800-second range), 2 MiB serialised outbound body, 2 MiB assembled final text, 8 MiB total response stream and 256 proposal operations. Do not silently truncate. These are application limits, not promises about model capacity. Non-streaming requests have no token progress, so their no-progress timeout uses the total response deadline. Bounded worker cancellation must release application resources promptly.

Require a configured effective context ceiling when reliable introspection is unavailable. Estimate the complete outbound prompt, task instructions, schema, selected context and message framing. Reserve requested output and a labelled estimation margin; reasoning may consume part of the model's generation/context allowance. Never equate max output with total context. Use provider-specific parameter mappings and reject unsupported combinations before sending.

### User-visible size controls

Settings expose **Context budget (tokens)** and **Maximum response (tokens)** for
each provider/model profile, with explicit per-request overrides shown before Send.
Show the known model/server capacity separately; if unknown, require a user-supplied
capacity labelled unverified. Context budget is the total request allowance, including
input and reserved output. Show an input breakdown for instructions/schema, selected
story, Character cards and lorebook, plus the output reserve and estimation margin.
Reject requests whose estimated total exceeds the configured budget or known capacity.
Do not silently drop entries, shrink output, clamp a value or reload a server model.

Map maximum response to the qualified provider's output-limit field. This is a ceiling,
not a promise of exact prose length; schema text and, where applicable, reasoning use
the allowance too. A requested word/beat count belongs in the visible task instruction
and remains a soft target. A truncated structured response cannot be applied. Saving
or overriding either setting invalidates a prepared send and updates its preview.
Reopen restores profile defaults; switching provider/model cannot silently reuse an
incompatible limit. If the server's loaded context must change, explain the required
external configuration rather than pretending Loomlight changed it.

Use server sampling defaults unless the author overrides supported settings. Preserve editable temperature/top-p/output allowance and qualified thinking controls; optional provider-specific fields require a typed allowlist. No arbitrary headers or unchecked extra JSON overrides of tools, endpoint, auth or context.

Show provider-reported tokens/finish reason/latency when available. Distinguish measured from estimated counts, and missing usage from zero. Optional monetary estimates require user-supplied prices and remain estimates. Do not include a model/price catalogue.

Start with non-streaming complete responses. SSE adds bounded incremental parsing, UTF-8/chunk/event limits, timeouts, progress and cancellation without exposing partial JSON as accepted edits. Every generation still requires an explicit send. No automatic retry, repair request, continuation, fallback provider or downgrade of response mode.

## 6. Deterministic context and prompt control

Prepare context from committed source plus validated editor metadata; unresolved target drafts/conflicts must be resolved before an applicable request. Unrelated drafts may remain but are excluded and disclosed.

The manifest records project/session identity, action/targets, allowed mutation scope, selected ordered beats/Scenes/route, all source and metadata revisions read, approved Character-card and lorebook revisions, referenced entity IDs, prompt/schema version, exclusions, uncertainty and size estimate. A route is a selected sequence with explicit repeated visits and a finite scope, not a claim of runtime reachability.

Defaults: selected narrative content, relevant runnable Character definitions, approved cards linked to selected Characters, explicitly selected approved lorebook entries, and the necessary variable/asset references. Show suggested card inclusion and allow the author to exclude it before Send; list every included entry and its revision. Lorebook scope/Character tags help selection but do not silently inject every matching entry. Dependency expansion is visible in the review; its inclusion grants no mutation authority. Variables are labelled as defaults or supported scene-local observations. Unknown conditions/custom effects are not invented as known state. No automatic asset binary, whole-project, hidden file, credential, Git history or external-file inclusion.

Protected source remains unchanged. Default to a visible custom-code marker; explicit inclusion of exact custom text requires a preview and still grants no right to execute or edit it. Treat all project prose, filenames, lore and model output as untrusted data. Prompt injection cannot add tools, expand files or change the configured destination.

Use stable ordering/deduplication and explicit budget refusal. Do not silently shorten dialogue or remove dependencies. Defer automatic summaries/embeddings; any later selected summary needs matching provenance revisions and stale invalidation.

Store editable task prompt resources in one versioned prompts directory; no duplicate hardcoded prompt text in handlers. Provide project-local author instructions/style notes separately from machine provider configuration. Schema, operation permissions and security checks remain core-owned. Preview the effective instructions and context; save template edits explicitly and include their digest in the manifest.

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

## 7. Structured proposals and source preparation

Use a versioned, closed proposal schema with typed semantic operations and proposal-local references. Core owns real UUID allocation and source/path derivation. Initial operation families are dialogue/narration replacement, supported beat insertion, one Scene creation, reviewed terminal/edge replacement, runnable Character creation/update within scope, and Character-card/lorebook entry proposals. Approval is an explicit user operation; model output cannot approve itself.

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

A documented explicit text-JSON compatibility mode may be available for generic endpoints after qualification; it still uses strict complete-document parsing and identical validation. First-class Unsloth acceptance must demonstrate its documented schema mode. No silent downgrade when a schema request fails.

Build a non-mutating proposal planner over the actual accepted Phase 1 services. Existing single-operation apply handlers must not be looped to simulate a batch. Prepare a transient candidate, apply supported semantic intents in dependency order, combine changes to the same file, check final invariants, and produce exact minimal source/metadata patches. This transient object exists only for review; it is not a competing runnable document.

The displayed file diff must derive from the exact core-prepared mutations later accepted. SDK validation is an explicit separate trust action because it can execute project code; ordinary proposal preview is static and non-executing.

## 8. Review, partial acceptance, history and lifetime

Provide semantic and file views, readable explanations, affected entities, dependencies and uncertainty. Reuse the accepted UI refresh and semantic theme tokens in both supported themes, accessible checkboxes/keyboard focus, responsive panels and clear empty/error/stale states. Untrusted output renders as passive text; no injected HTML or provider links automatically opened.

Selection units are whole semantic operations or inseparable operation groups, not arbitrary diff lines. Selecting dependent dialogue requires its Character definition or explicit remapping. Changing selection rebuilds dependencies and patches and shows a fresh diff. Never auto-select hidden changes.

Accept binds proposal ID, selected operations and preview digest; core rechecks the complete read/write set and target draft generation immediately before commit. A stale source/context/card/lore revision requires fresh preparation and review; no automatic rebase. Recovery blocking and optimistic concurrency remain the established Phase 1 policies.

Commit the accepted subset through one journalled semantic transaction and one coherent undo entry. It is a recoverable multi-file sequence, not a claim of universal atomicity. Commit failure retains evidence and cannot report success. Failed pre-commit validation writes no runnable source.

After any partial acceptance, consume the original proposal; unaccepted suggestions stay visible as a reference until dismissed. Applying more requires a new prepared review against the current project. Retrying acceptance with the same token must not duplicate mutations; recovery and actual revisions determine ambiguous outcomes.

Initial transient context snapshots and generated proposal reviews are memory-only. Navigation may retain them within the same project session; close/switch warns before discarding unaccepted work. Restart does not silently persist raw prompts/replies or resume requests. Explicitly saved author instructions, Character cards and lorebook entries are durable. Unsaved generated proposals remain transient; explicitly saved proposed entries persist with their proposed status, without becoming approved reference material. Existing transaction recovery covers acceptance interrupted by a crash. Persistent proposal archives are deferred.

## 9. Character cards and lorebook

### Character cards

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

### Lorebook

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

## 10. Checkpoint sequence and gates

These are dependency checkpoints, not mandatory chat boundaries. Select one coherent
outcome with internal implementation/test/review checkpoints under [WORKFLOW](../../WORKFLOW.md);
resume that same outcome/chat after a wait. Section 25 owns the selected first
Studio 2A.1 preparation/access state; remaining production checkpoints stay `not_started`.
The original provider requirements and approval boundaries remain; planning does not
authorize provider connections or execution.

| Checkpoint | Deliverable | Acceptance and next boundary |
| --- | --- | --- |
| 2A.0 — Provider qualification and contracts | Bounded synthetic Studio/generic probes; version/capability matrix; request/credential/transport ADR; confirm limits and management-API findings. | Record actual success/failure/unknown per provider. Prove Studio schema mode and tools-disabled behavior or record a blocker. No project sends. Return for review before production integration. |
| 2A.1 — Settings and credentials | Two provider types, native credential entry, explicit context/response settings, connection/model tests and Unsloth-specific setup/readiness/error UX. | Production native entry/store/request/replace/delete, session-only/no-auth, packaged reopen/identity, controlled unavailable-store failures, zero reflection, no requests on project open, origin binding and invalidation. Physical locked-store/signed-upgrade behavior is proved where accessible or retained as a limit; no enterprise-policy gate. |
| 2A.2 — Request service | Background transport, non-streaming and qualified SSE, cancellation/timeouts/resource bounds, settings mapping and usage results. | Delayed/out-of-order responses, cancellation races, dead server, bad auth, request limits and Save responsiveness. Test each adapter without project writes. |
| 2B.1 — Context and prompts | Manual Character-card/lorebook storage and editing, deterministic manifests, budgets, dependency disclosure, revisions/provenance and system-prompt editing/baseline reset. | Golden payloads; exact selected card/lore revisions; prompt edit/reset/undo/reopen; no whole-project leakage; bounded route cycles; no silent truncation; input/output budget accounting. |
| 2B.2 — Assistance and send review | Five action entry points, context/destination preview and request snapshot binding. | Exact reviewed payload sent once; relevant changes force renewed review; sensitive/locality disclosures; session and pending-draft safeguards. |
| 2C.1 — Proposal planner | Strict schemas, semantic/dependency checks, literal generated text/protected existing tokens and non-mutating batch-to-patch preparation. | Malicious/invalid output writes nothing; interpolation/tag and token-tampering checks, same-file batch edits, new IDs, terminal constraints, Unicode/custom preservation and exact previewed mutations. |
| 2C.2 — Proposal acceptance | Semantic/file review, dependency-valid subsets, stale rejection, one transaction/undo and explicit transient lifetime. | Core/renderer/native acceptance, duplicate-click/retry protection, concurrent drafts, external edits, interrupted-acceptance recovery using non-crashing fault/state fixtures, no partial success claims. |
| 2C.3 — Character and lore completion | LLM draft/update of Character cards and lorebook entries, separate runnable definitions, statuses, provenance and approvals on the manual foundation from 2B.1. | No implicit lore approval or source execution; migration/reopen, stale citations, missing entities, repeated undo/redo and metadata-free game behavior. |
| 2C.4 — Integrated acceptance | Real authoring workflow through every action/provider and supported client target. | Required matrix below passes; remaining limitations explicit; complete independent review; no automatic merge or new execution scope. Selected 3A overlap follows section 19. |

Dependency detail: 2B.1 supplies manual cards/lorebook and their approved-reference selection before the first rewrite. 2C.1 defines their proposal operations; 2C.3 completes LLM generation/update and lifecycle UX. Until each generated action is complete it is visibly unavailable; the five-action release claim is made only at 2C.4. Confirm schema ownership during 2A.0 to avoid circular prerequisites.

At each checkpoint, update its ledger and canonical behavior/ADRs, run cheap relevant gates, then the required supported-target evidence for the changed candidate. Do not implement all rows as one goal.

## 11. Verification matrix

| Layer | Required evidence |
| --- | --- |
| Provider fixtures | Auth redaction; endpoint/base-path normalization; redirects/proxies; unavailable/no-model/busy errors; parameter/capability mismatch; exact model IDs; structured and plain malformed results; tools-disabled fields; SSE splits/UTF-8/unknown events; missing usage and finish reasons. |
| Lifecycle/concurrency | Provider change, key rotation, model switch, project switch, cancel/complete race, old-session callback, competing Source draft, accepted source/card/lore change, prompt reset, size-setting change, stale send token and duplicate acceptance. Save remains responsive during a stalled request. |
| Context | Manual and LLM-generated cards/lorebook; exact approved inclusions/exclusions; stale reference rejection; prompt customization, baseline reset and reopen; context/output boundary refusal; deterministic order, selected route repeats, dependency accounting, excluded custom code/assets, unknown state, exact large integers, stale summaries/lore, over-budget rejection and no implicit sends. |
| Transactions | Multiple operations touching one file; new Character plus dialogue; partial dependency refusal; terminal beat validity; external edits; Unicode/BOM/newline preservation; undo/redo; failed commit; ordinary interrupted-save/recovery fixtures; metadata limits and reopen. |
| Security/privacy | Native credentials absent from renderer/project/logs/artifacts; prompt-injection fixtures cannot expand authority; unsafe names/paths/HTML refused; no ambient WebView HTTP/shell privilege; no tool execution; provider retention disclosure. |
| UX/native | Windows x64 and macOS ARM64 packaged action/context/diff/accept workflow; keyboard/focus; small window/overflow; readable status; cancel/error/retry; authoritative native credential interaction. Browser tests support but do not replace packaged evidence. |
| Live compatibility | Record exact client commit, provider/version or unknown, model ID/quantization where known, configured context/output, transport and actual results. Test Studio and one representative generic endpoint using synthetic content. Do not require identical prose. |
| Integrated product | Rewrite with selected cards/lorebook and a customized system prompt, restore baseline, vary context/response limits, continue/create Scene, draft/update Character cards and lorebook, approve references, inspect both diffs, accept subset, undo/redo, close/reopen, explicit SDK validate/run, and execute a copy without editor metadata. |

Both client platforms may connect to the same controlled inference host; GPU inference does not need to run on every CI worker. Deterministic CI uses a bounded fake server. Required live evidence is separately recorded, not replaced by mocks or an unavailable-provider skip. No paid/public-provider calls or GPU downloads occur in routine CI without explicit setup.

Use current repository commands from AGENTS/TESTING and add focused test commands in each implementing brief once actual paths exist. Preserve failed evidence and exact run/attempt/SHA. No full package matrix for this documentation-only plan; no duplicate unchanged acceptance runs or model polling during external waits.

### Component selection and proof cost

This selection supplements sections 10-11 and existing TESTING selectors; it does not
waive requirement IDs or implement new evidence reuse. Map focused cases to requirements
and record counts/skips, affected hosts and finite expensive allowance before execution.
Share source/transaction fixtures and test the narrowest actual controller/service seam.

| Component | Decisive focused proof | Native/live boundary |
| --- | --- | --- |
| Profiles/keys | Persistence, replacement/removal failure ordering, unavailable store, session exit/clear, no-auth, origin/redirect refusal and no reflection | Early packaged entry/store/request/reopen path on both targets; mocks do not prove physical locked stores or signed upgrades. |
| Requests | Final response, auth/protocol error, timeout/cancel, stale completion and responsive Save | Fake-server failures routinely; bounded synthetic Studio and one representative generic configuration live. |
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

## 12. Entry risks and decisions

| Issue | Disposition |
| --- | --- |
| Phase 1 prerequisite | Accepted/integrated/closed on 2026-10-07. Inspect live state and preserve other work; no implementation selected by this update. |
| Actual installed Studio compatibility | 2A.0 must qualify the configured version/model. Documentation alone is insufficient. |
| Tools disabled and inference locality | Mandatory Studio qualification and disclosure; no silent fallback if unsupported. |
| Managed load/unload | Public stable interface not established in reviewed docs; explicit follow-on investigation, no guessed private APIs. |
| Context/token introspection | Use explicit configured capacity and labelled estimation when unavailable; never claim exactness. |
| Multi-operation preparation | Extend existing safe primitives; ADR/test the preparation boundary before acceptance UI. |
| Non-loopback plaintext connections | Explicit opt-in proposal requiring an ADR; do not weaken the existing TLS baseline implicitly. |
| Provider/model creative quality | Measure separately from protocol correctness using synthetic rewrite/continuation/character/lore examples. No guarantee for arbitrary model names. |

Confidence is high in the bounded architecture. Live Studio capability qualification and safe multi-operation planning remain measured gates, not assumed passes.

## 13. Planning checkpoint and continuation

This document records the user's additional first-class Studio requirement and the recommended implementation defaults. It authorises no implementation, provider connection, native credential change, model load, paid request, production gate or Phase 1 modification.

Planning publication scope: this new brief, the Phase 2 roadmap entry, the provider requirement in PRODUCT, and an INDEX link only. CURRENT/HANDOVER retain the active Phase 1 continuation; this is a user-directed isolation exception to updating the live handover for this planning-only task, not a second handover file.

Planning validation: four-file scope review; repository text/privacy checks applied to the changed Markdown; relative links checked against the inspected remote path inventory; newline/whitespace checks passed. Verified that the roadmap outside Phase 2 is byte-identical. No application/native test or expensive workflow was run for this documentation-only change. These checks do not constitute full repository or implementation acceptance.

Next bounded action: review this plan, especially the qualified model-management boundary and network policy. After Phase 1 is accepted and the user selects 2A.0, inspect actual refs/ownership again, reconcile the brief with accepted Phase 1 interfaces, then record the real implementation branch/PR and active checkpoint in the existing CURRENT/HANDOVER. Do not create an implementation branch from this historical planning baseline merely because it is quoted here.

Implementation ledger fields per checkpoint: state, authorising instruction, branch/PR, candidate, decisions/changed paths, test commands/counts/skips, live-provider evidence, target run/attempt/SHA, blockers, published continuation and next approval boundary. Preserve one live repository handover when Phase 2 becomes active.

## 14. October milestone sequencing

Section 19 owns the single live scheduling/ownership map; section 20 maps bounded
results to existing requirement gates. This anchor preserves links. The duplicate
October delivery table was consolidated on 2026-10-07; Git history retains it. The
first useful rewrite still includes manual references, prompt/reset and size controls,
native credentials, exact reviewed send, strict review, one transaction and undo.
It does not replace five-action/two-provider acceptance. Section 21 defines the first
bounded source assignment; provider qualification can be selected independently.

## 15. Provider expansion recommendation — 2026-10-02

The user asked about more providers and scaffolding without live testing. Recommendation,
not approval of additional first-class providers: keep required Studio and one
representative OpenAI-compatible endpoint; implement a small shared provider contract
and deterministic fixture tests. Additional compatible endpoints may be user-configured
and labelled unverified until explicit synthetic configuration checks pass. Passing
one probe is configuration evidence, not full release qualification of that provider.

| Option | Relative incremental work after the baseline | Proposed treatment |
| --- | --- | --- |
| Compatible endpoint using existing request/response behavior | Small: configuration/help and capability fixture coverage; little or no transport code. | Use the generic profile, not a separate provider implementation. |
| Branded preset with parameter/routing differences | Small to medium: explicit field mapping, errors and unsupported-capability handling. | Optional later preset; live support remains unverified until checked. |
| Native API with a different protocol | Medium to large: authentication, message/schema mapping, streaming, errors, usage/cancellation and live acceptance. | Keep an extension seam; defer the concrete adapter until selected. |

These are engineering estimates, not measured effort or calendar promises. No production
LLM subsystem exists yet, so implementation effort depends on the 2A.0 result. Do not
generate placeholder production adapters or provider buttons with no tested behavior.
Scaffolding means a tested interface, capability model and fake-server contract fixtures;
it does not mean claiming a wholly untested provider is supported. Extra providers are
not new Phase 2 exit gates. The required baseline still needs its existing live evidence.

Official documentation inspected 2026-10-02; no inference request or account connection:

- [LM Studio](https://lmstudio.ai/docs/developer/openai-compat/structured-output)
  documents schema output through Chat Completions, with model capability limits.
- [OpenRouter](https://openrouter.ai/docs/guides/features/structured-outputs)
  documents schema-capable models and requiring supported parameters in routing.
  Any future preset must disclose intermediary/inference locality and routing/fallback
  behavior; it cannot silently change the approved destination or response contract.
- [Gemini compatibility](https://ai.google.dev/gemini-api/docs/openai) remains described
  as beta. Treat compatibility as something to qualify, not universal field support.
- [Claude compatibility](https://platform.claude.com/docs/en/cli-sdks-libraries/libraries/openai-sdk)
  explicitly ignores response_format and points to its native API for structured output.
  Do not label it schema-qualified through the generic adapter without actual evidence.
- [OpenAI API guidance](https://developers.openai.com/api/docs/guides/migrate-to-responses)
  keeps Chat Completions supported and recommends Responses for new OpenAI integrations;
  Responses uses a different result/schema shape. A dedicated Responses adapter is
  separate scope, not a base-URL preset or an automatic migration of all local providers.

## 16. Reference-and-control refinement record — 2026-10-02

User-selected requirements: persistent manual/LLM-generated Character cards and lorebook
for generation context; visible editable system prompts and baseline reset; explicit
context and response size controls; simple phase outcomes. These are now part of the
Phase 2 scope and gates. Provider expansion remains a documented recommendation.

Planning remains on `codex/phase-2-3-planning`; Phase 1 files/acceptance and implementation
remain untouched. Updated canonical PRODUCT, DATA_MODEL, UI and ROADMAP describe planned
behavior, not shipped support. Documentation-only validation and publication apply;
no provider test, application build, native launch or production dispatch is selected.

Refinement validation: repository structure/text/privacy/link checks passed across
315 files; whitespace and eight-document scope review passed. No application files
changed and no live inference or native gate was run.

## 17. Provider scope correction — 2026-10-02

User direction removes Ollama support. Required configuration and live acceptance
now cover Unsloth Studio and one representative generic-compatible endpoint. The
generic endpoint field does not imply tested or named Ollama support. No implementation
exists to remove. Phase 3 scope remains under discussion following the user's request
for a simpler explanation; its proposed capability list is not accepted scope.

## 18. Proposed LLM screen and interaction design

**2026-10-02 design proposal; not accepted or implemented.** The user requested the
same detailed UX planning and generated-screen treatment as the Phase 3 Story concept.
The [four screen concepts](../../design/phase-2-llm/README.md) extend the saved actual
synthetic-fixture Story UI. The host was locked, so no live capture or acceptance of
current Phase 1 changes is claimed. Written contracts in sections 5–9 take precedence
over generated details. Reuse the accepted paper/teal and charcoal/copper tokens,
shared buttons, inputs, spacing and shell; generation does not select a new theme.

### Surface map

| Surface | Purpose and entry | Main completion action |
| --- | --- | --- |
| Story → Assist | Select supported dialogue, a continuation anchor, or a Chapter for a new Scene; prepare a bounded request beside the selection. | Generate proposal after inspecting the send. |
| Proposal review | Compare semantic operations and exact Source/metadata changes against the captured saved revision. | Accept a dependency-valid selection once, then return to authoring. |
| Characters → Character card | Write reference text beside the existing Game character tab, or request a reviewed draft/update. | Save as proposed, or explicitly save and approve reviewed text. |
| Lorebook | Search/filter entries, inspect scope/citations and edit or request drafts/updates. | Save, separately approve/reconfirm, then choose inclusion in Assist. |
| Settings → AI | Machine-local provider profiles and project-local per-action prompt templates with labelled scope. | Save profile or Save prompt; each invalidates affected send preparation. |

Assistance is a contextual action surface, with Prepare and Review changes steps rather
than a permanent chat workspace. Keep the selected Scene/Beat visible on wide windows;
opening Assist, Settings, a reference or a proposal never sends content. A single primary
action completes the current step. Support the five section 1 actions as they become
implemented; unavailable actions explain their incomplete checkpoint instead of opening
a nonfunctional composer. Screens, Calls, conditions and other Phase 3 constructs remain
outside the Phase 2 proposal schema.

### First useful journey: prepare a rewrite

1. Select one or several supported Dialogue/narration Beats and choose Assist → Rewrite
   dialogue. Show Scene, selection and intended replacement; preserve speaker/order/staging
   by default. If the target has unsubmitted Scene or Source input, offer Return to editor,
   use its explicit existing commit/save flow, or Cancel. Do not implicitly submit input
   or run against a hidden older target. Disclose excluded unrelated drafts.
2. Enter the task in a labelled multiline field. Retain it during navigation within this
   project session, provider errors and cancellation. The task is separate from reusable
   system prompts; a word/Beat target is an instruction, not a promised output count.
3. Show suggested approved/current linked cards and explicitly chosen approved/current
   lore entries with checkboxes, type, revision and scope. Suggested card inclusion is
   visible and removable. Matching lore tags suggest selection but never auto-inject.
   Proposed, rejected, superseded and stale references cannot quietly become ordinary
   context; offer View reference / Review or reconfirm / Exclude as applicable.
4. Show provider, endpoint class, exact model ID, connection location and inference
   locality separately. Unknown inference locality stays Unknown, even on loopback.
   Provide Change profile and View/edit system prompt without discarding the task.
5. Show Context budget and Maximum response together, profile default versus request
   override, and known server capacity or explicitly configured unverified capacity.
   The breakdown includes instructions/schema, selected story, cards/lore, other
   required references, reserved output and estimation margin. Context budget is the
   **total** allowance. The illustrative image's 3,036 total is arithmetic, not a
   measured tokenizer result. Over-budget refusal names the excess and offers explicit
   removal/adjustment; never silently shorten text, drop dependencies or clamp limits.
6. View complete send exposes effective instructions, immutable ordered context,
   revisions, allowed mutation scope, destination, exclusions and estimated total.
   Inspect exact custom text only when explicitly included. Core-owned schema/security
   constraints are visible but cannot be weakened by editing author prompt text.
   Generate proposal dispatches that reviewed snapshot once. Changes to targets,
   relevant references, prompt, profile, credential, model or limits invalidate it
   and require renewed preview; do not silently refresh and send another payload.

Continue Scene uses an explicit insertion anchor and shows the existing terminal Beat.
Draft Scene names its Chapter and proposed title; an incoming connection is a separate
visible operation. Card/lore drafting selects the destination and supporting material;
Update shows the current revision. Scope controls remain action-specific, avoiding a
large generic prompt form whose defaults imply unrelated write authority.

### Receiving and proposal review

During sending/receiving/validation, keep task and context visible with a stable Cancel
request action and plain phase label. Non-streaming has no invented token progress.
Qualified streaming may show bounded inert progress; partial JSON never becomes an
applicable edit. Save and unrelated editing stay responsive. One active generation
per project means a second Generate visibly asks the author to finish/cancel the first.
Cancellation stops the client request; provider computation may continue. A late result
from cancellation, a replaced project session or an expired request cannot reopen review.

A valid result opens Review changes; no source or metadata changed merely by generation.
The [proposal concept](../../design/phase-2-llm/review-rewrite-light-v1.png) shows one
whole dialogue replacement. For larger proposals, the operation list includes target,
type, affected files/entities, dependency and uncertainty. Selection units are semantic
operations or inseparable groups; no arbitrary line checkboxes. A dependent operation
offers its visible required group or explicit remapping, never hidden auto-selection.
Changing selection rebuilds the dependency closure and shows a new exact preview.

Story view explains before/proposed content; Source view shows exact patches, including
multi-file changes and metadata. Show generated Character-card text separately from a
runnable Character definition and existing Appearance-reference operation. Lore/card
field groups follow the same review flow. Provider reasoning remains separate from final
proposal content and is never an applicable operation. All returned text renders inertly.

Accept N changes rechecks the complete captured read/write set and draft generation,
then commits one semantic transaction and one undo entry. Disable duplicate acceptance
while in flight. A changed target, reference, prompt or relevant metadata shows
“Project or context changed; prepare again” with review retained for comparison; no
automatic rebase. Failed validation writes nothing. Ambiguous persistence/recovery
uses the established project recovery state and cannot claim success or invite a blind
retry. On success, identify accepted operations and return to the affected authoring
surface, retaining focus/selection where valid. Undo uses normal history. The concept footer refers to undoing this new acceptance;
existing project history is not disabled while reviewing a proposal.

Partial acceptance consumes the original proposal. Remaining suggestions can remain
visible as a reference, labelled not applied; accepting more needs new preparation.
Discard proposal clears only the transient suggestion. Project close/switch warns
before discarding pending task/proposal work; restart does not archive raw requests or
resume generation. Explicitly saved proposed card/lore records are durable without
becoming approved. This distinction must remain visible at close/reopen.

### Character cards and Lorebook

Characters retains runnable Game character controls and adds the Character card tab.
Cards may be unlinked; linking does not create a runnable Character. The editor groups
description/appearance prose, personality/motivation/background, relationships, speaking
style/examples, explicit applicability and knowledge notes. Link shared facts to lore
IDs rather than duplicate canonical text. Card prose does not generate/import images.

Lorebook entry: choose Lorebook in navigation, search/filter and select an entry, then
Edit to change its labelled title/text/category/tags, scope, links and citations. New
lore entry opens that same form with empty fields; Save as proposed persists it, explicit
Approve makes its current revision eligible, and choosing it in Assist controls the
next send. Cancel retains the accepted record and discards only the author-confirmed
form change through the existing draft guard. A selected Character-card tab filters
cards; Lorebook filters lore, despite the concept's illustrative mixed list.

Lorebook uses the same reference editor controls with searchable title/category/tags,
text, linked entities, explicit Scene/route scope, knowledge annotations and citations.
Show approved/proposed/rejected/superseded status, current versus stale supporting
revisions, authored versus inferred provenance and unresolved links with text labels.
A missing entity retains the record/citation rather than deleting or broadening it.

An idle record is read-only until Edit; no pending edits disables both Save actions.
Pending edits are visibly separate from the prior approved revision and use explicit
Save/Cancel. View revisions is bounded saved reference revision/provenance inspection,
not a persistent archive of raw model requests or replies.

Keep three concepts separate: editor input, approval of a saved revision, and inclusion
in a particular request. Save as proposed persists an unapproved revision. Manual
authors may explicitly Save and approve. Generated content remains a proposal until
reviewed by the author; an explicit Save and approve action may combine persistence
and approval of the reviewed revision. Save as proposed remains available separately. Save after editing
approved text requires a newly approved revision before use. Approve/reconfirm displays
the exact revision and supporting citations; generated updates never approve themselves.
Reject and Supersede preserve the established undoable lifecycle rather than destroy
evidence. Approval changes no runnable game variables or definitions.

Draft with AI / Update with AI opens the same Prepare step with destination visible.
Generation remains transient until explicit semantic acceptance/Save as proposed;
the image's saved-as-Proposed helper describes that save, not generation alone.
After Save as proposed the editor displays Proposed and generation provenance,
then offers explicit review/approval. An explicitly approved acceptance displays
Approved for that exact reviewed revision; generation alone never approves it. No background updates, contradiction detection,
automatic keyword injection or whole-book sends. Assist's selection records included
revision IDs; a reference editor's scope is guidance, not a runtime knowledge claim.

### Settings, prompts and baseline restore

Provider profiles offer only Unsloth Studio and OpenAI-compatible. Show endpoint input
and normalized destination, authentication mode, OS-remembered/session-only credential
status, native Manage credential entry, exact loaded model discovery/manual ID, transport and qualified
settings. No renderer API-key text field or provider buttons implying extra verified
support. Distinguish Refresh models, synthetic connection/capability tests and a project
generation; tests do not send project content. Changed configurations are Untested until
their actual probes pass. Model loading stays an explicit action in Studio.

Use two real tabs, Provider profile and System prompts, with only the selected editor
shown; the generated simultaneous panes are an overview of both, not the tab behavior.
Keep machine-local profile defaults distinct from project-local prompt templates.
Per-action system-prompt editing shows effective scope, saved/installed baseline versions and customized
status; task instructions and project style notes have their own labels. Save prompt
is explicit. Restore baseline previews the installed app's bundled replacement against current text,
then applies only that prompt after confirmation. Cancel preserves custom text; applying
is undoable, with the previous text retained, and saving/reopening preserves the restored
revision. Restore does not reset references, credentials, other prompts or size limits.
It invalidates any send using the prior prompt. The image shows the editor before the
restore preview; the written interaction is authoritative.

### Failure, draft and compact-window behavior

| State | Visible recovery without losing author input |
| --- | --- |
| No configured profile/model; required key or selected OS store unavailable | Explain the specific missing item and open its settings/native action; no silent model substitution or plaintext fallback. |
| Provider unavailable/busy, timeout or interrupted response | Retain task/selected references and show actual known cause; Retry means a new explicit reviewed send, never an automatic request. |
| Malformed/truncated/unsupported/tool response | No applicable proposal; show bounded inert diagnostics and return to preparation. Do not auto-repair or downgrade modes. |
| Over budget or stale reference | Name the failing total/revision; explicit correction rebuilds preview and requires review. |
| Competing target draft, external edit or recovery blocking | Retain proposal/task, explain affected target, return to editor/recovery; safe unrelated editing remains available. |
| Empty references or new project | Manual New card/New lore entry and useful empty-state guidance; generation requires configured readiness. |

At insufficient width, collapse project/tree rails and use the central workspace for
Assist or review with Back to Story and the captured target always labelled. Replace
parallel before/after columns with stacked labelled panels; retain the same operation
selection, exact Source view and primary action. Reference and settings secondary
panels become ordered sections. No fixed multi-column min-width or horizontal scrolling
for form actions; Source diff scrolling remains explicit and localized. At short height,
scroll content while keeping the primary action and request status accessible without
covering the focused field. Never hide required context totals or approvals behind hover.

Provide logical keyboard traversal, labelled checkboxes/selectors, visible focus, a
keyboard operation-selection alternative, multiline text behavior consistent with
Source/Scene, and focus restoration on Back/error/Cancel. Announce request phases,
budget refusal and acceptance once; do not announce every streamed token. Color is
paired with labels; test both themes, text scaling and narrow windows. Generated
screens establish hierarchy, not exact contrast, geometry, font size or physical-input proof.

### Implementation proof and planning record

Before the UI completion gate, exercise the real boundaries: manually author card/lore,
explicitly approve and choose revisions, edit/restore/undo/reopen a prompt, inspect the
exact dispatched payload, refuse an excessive total, cancel and reject late callbacks,
review whole operation groups, reject stale acceptance, accept a valid subset once,
undo/redo, and close/reopen with saved references and discarded transient proposals.
Add narrow/keyboard/error checks to the existing section 11 matrix. Browser evidence
supports packaged target evidence; mockups do not satisfy these assertions.

Planning scope is docs and four generated concepts on `codex/phase-2-3-planning`,
continuing from `a18c09e`. Exact prompts, reference hashes, asset hashes and inspection
limits are stored in the [design index](../../design/phase-2-llm/README.md).
No application implementation, configured project-provider request, native build, SDK
execution or CI dispatch is part of this outcome. Image generation used the built-in
image tool. The parent reviewed the subagent deliverable and handles publication on
the same planning branch; no merge or new planning PR was selected in that historical record.

Parent review and verification — 2026-10-02: inspected all four concepts, reconciled
schematic controls against sections 5–9, and retained explicit author approval without
requiring separate save and approve clicks for an already reviewed reference. Repaired
the Phase 3 cross-link after expanding this section. Repository validation passed for
329 files; whitespace and documentation/image-only scope checks passed. No application
tests or CI are required for this planning change. Publish this coherent checkpoint on
the existing planning branch and verify its remote head; then user design review is next.

## 19. Selected shared foundations and two-lane delivery

The user selected this delivery approach after reviewing the rework risks: bring a
bounded part of 3A's source foundations forward, prove one complete Phase 2 rewrite,
then overlap Phase 2 completion with 3A. After Story logic, develop Screens and Timeline
in two lanes. Phase 1 acceptance through 1H remains the entry prerequisite. This is
planning authorization; implementation remains `not_started` and requires selection
of a bounded outcome against the then-current accepted baseline.

This section owns the cross-phase delivery sequence and team allocation. Section 10
keeps Phase 2 requirement/gate IDs; the [Phase 3 brief](phase-3-initial-wysiwyg-release.md)
keeps 3A–3D/3F requirements. The phases retain separate completion gates. Delivery
stages below neither add product scope nor count as accepted implementation outcomes.

### Build shared capabilities once, when first needed

The inspected application has flat Scene Beats, blanket terminal Choice handling and
a scene-local TypeScript preview reducer. Building an expanding AI planner around
those assumptions would create avoidable restructuring in 3A. Reduce that risk with
small proven capabilities, not a framework implementing every future syntax up front.

| Shared capability | First implementation boundary | Later consumers |
| --- | --- | --- |
| Source structure and stable locations | Bring forward the minimum 3A.1/3A.2 support needed for parent/block ownership, stable Beat/source locations, revisions and explicit insertion anchors. Prove one nested child edit and lossless reopen before expanding AI mutation families. | AI targets/context, nested Story editing, and typed screen/transform source locations. Screen/ATL grammar adapters arrive with those features, not in this first slice. |
| Semantic edit preparation | 2C.1 prepares supported typed operations into exact candidate patches; review and acceptance reuse the existing Phase 1 transaction/history/recovery path. Manual visual controls reuse the relevant preparation primitives. | Dialogue/Scene AI edits, nested Story controls, Screens and Timeline. Each domain retains its own validation. |
| Reference records | 2B.1 establishes shared IDs, revision/status/provenance and inclusion contracts for cards/lorebook, then their distinct manual forms. 2C.3 adds generated operations on those same records. | Both reference editors, selected context, proposal review and stale detection. No duplicated card-versus-lore lifecycle/storage system. |
| Core story semantics | 3A owns the supported condition/call/continuation interpretation and known/unknown results. Agree its contract early; implement it with actual 3A behavior. | Story/Branches, source-derived context facts and later 3D trace/state inspection. Do not implement separate evaluators in the AI panel and preview. Full route reconstruction stays in 3D. |
| Explicit scratch runtime job | Introduce the shared snapshot/preparation/process/cleanup service at the first 3B/3C runtime-preview consumer; extend its typed purpose and inputs for 3D. | Screen preview, Timeline comparison and Run From Here. Static AI proposal review remains non-executing and does not wait for this service. |

`.rpy` remains authoritative. Extend the existing source/metadata services and preserve
their migration/no-op guarantees; do not create a second saved document or replace
the transaction system. Integrate shared schema changes through one migration path
and preserve existing IDs/unknown fields. Do not preallocate speculative screen/ATL
schemas merely to force every feature into one version bump.

AI operations address stable authoring targets and semantic intent, not model-chosen
byte ranges, paths or executable patches. A compatible parent/block-aware model does
not authorize AI generation of conditions, calls, screens or ATL. The first rewrite
can target ordinary Phase 1 dialogue using the new location contract. Nested targets
or later constructs need explicit action-scope qualification; otherwise refuse or
mark them excluded. Preserve the existing Phase 2 proposal allowlist. Cards/lorebook
are author references and never become runtime state implicitly.

### Staged lane assignments and integration points

| Delivery stage | Implementation lane 1 | Implementation lane 2 | Dependency/proof before expansion |
| --- | --- | --- | --- |
| 1 — Foundation and provider feasibility | Minimum source structure/locations from 3A.1/3A.2; introduce only the relevant reusable edit-preparation seams. | 2A.0 provider qualification, followed by approved 2A.1/2A.2 credentials/request work. | One nested child edit through dispatch, undo and reopen preserves source/IDs; one qualified provider yields a valid bounded synthetic response. 2A.0's review boundary remains before provider production integration. |
| 2 — First useful AI workflow | Deterministic context and strict proposal planning/acceptance using stage 1 locations/preparation (necessary 2B/2C parts). | Shared manual card/lore records/forms, prompt/limit settings and Assist preparation/review UI against agreed interfaces. | One complete rewrite with selected manual references: exact reviewed send, valid proposal, acceptance, undo and reopen. No hidden draft acceptance or shortened context. Native credentials and affected target checks remain required. |
| 3 — Overlap milestone completion | Complete 3A conditions/calls, flow/history and Story/Branches controls against the shared model. | Remaining Phase 2 actions, generated cards/lorebook, second-provider coverage and 2C.4 preparation/qualification. | Reconcile every shared-model change with context/proposal targeting. Existing Phase 2 operations remain correct or visibly refuse unsupported boundaries; complete each milestone's own gates. 3A may be selected after the first safe rewrite without waiting for all 2C.4 work. |
| 4 — Visual authoring | 3B Screen source adapters, canvas/hierarchy/properties and runtime comparison. | 3C static staging → PNG/ATL idles → native video → supplied transparency → play-once controls, then remaining Timeline/audio inventory. Reuse shared assets/appearances and runtime comparison. | Accepted 3A and Phase 2; stable source/asset/history contracts. Integrate one shared runtime job before independent preview expansion. Each lane proves one real round trip before broadening its inventory. |
| 5 — State and integrated release | 3D trace/state inspection and isolated launch, using accepted 3A semantics and qualified 3C effects. | Remaining cross-workspace/UI and affected-target release qualification; fix bounded integrated findings. | Normal-run comparison for supported entry points, then 3F's integrated release gate. Unknown state/timing still refuses unsupported launch; release acceptance follows all required capabilities. |

Stage 1 brings forward source foundations only, not the full 3A UI or state engine.
Minimum block support must not delay the first rewrite until Screens/Timeline exist.
Stage 2 is one integrated authoring outcome across both lanes, not separate backend
and frontend completion claims. Stage 3 overlap is intentional; 2C.4 remains required
for declaring Phase 2 complete and for stage 4 entry. Story logic precedes Screens;
3B/3C can then overlap. Portions of 3D state inspection may be scoped earlier once
3A is accepted, but final launch qualification needs the supported 3C effects.

The assignments are defaults for bounded tasks, not fixed ownership of an entire
phase. Stage 2's record service and renderer work are sequenced inside lane 2; lane 1
consumes the agreed records contract. The owner may rebalance independent pieces
while preserving explicit ownership of shared files and the completion points above.

### Team operation

The owner coordinates shared UI controls and field-validation contracts using the
[accepted UI/UX guidelines](../../UI.md#accepted-uiux-guidelines-for-implementation-agents);
both lanes reuse the same patterns.

Use **one GPT-6.1 Sol owner at high reasoning effort and zero, one or two GPT-6.1 Sol
implementation agents at high reasoning effort** for useful independent assignments.
Two lanes are a maximum, not an occupancy target. Short fixes and shared contract/
migration work remain serial; the owner can implement them directly.

- The owner defines contracts and task/file boundaries, resolves shared-model decisions,
  reviews both lanes, integrates coherent changes and verifies the combined outcome.
  The owner coordinates shared-core ownership instead of becoming an unplanned third
  independent feature lane. Implementation agents build the assigned foundations too.
- Each implementation lane uses an isolated worktree with a bounded assignment and
  declared source files/interfaces. Assign one writer for each shared model, migration,
  dispatch/transaction seam and fixture; dependent lanes consume its reviewed checkpoint.
  Keep UI fixtures/types synchronized with actual core contracts.
- Integrate at each real operation/completion point above rather than accumulating
  two phase-sized branches. Review actual dispatch/source/persistence behavior early;
  rendered controls or mocked APIs alone cannot establish the combined outcome.
- The owner selects combined changed-scope checks and records evidence against the
  integrated candidate. Lanes run focused checks for their work; use shared fixtures
  without duplicating expensive native/package matrices for unchanged inputs.
  WORKFLOW/TESTING allowances, target requirements and manual waiting still apply.
- Owner review covers integration. Any independently required checkpoint review remains
  a separate pass. This team plan creates no new reviewer mandate or CI allowance and
  does not authorize merges, service installation, spending or provider requests.

Record the first paired assignment's useful output, waiting, integration rework and
duplicate checks in the existing ledger. Report timing/usage only when available;
never invent speedup/cost savings. Continue parallelism where output outweighs overhead.
Source versus provider feasibility and Screens versus Timeline are suitable candidates;
shared schema/transaction/runtime changes need a single writer. No recursive agent tree.

Technical prerequisites differ from scheduling defaults. Missing provider access need
not stop independent authorised portable work. Stage 4 defaults to accepted Phase 2/3A;
a narrower earlier 3B/3C slice requires explicit selection and accepted source/asset/
history/runtime prerequisites, not an automatic phase waiver. Final gates are unchanged.

No agents, implementation worktrees or execution were launched by this planning update.
At implementation entry reconcile the accepted Phase 1 APIs with these proposed seams,
select the first bounded source/provider tasks, and record their actual ownership and
branch/checkpoint in CURRENT/HANDOVER and the existing task ledgers. Do not implement
against this planning branch's inherited historical application tree.

**Historical delivery-plan verification/publication record (2026-10-02):** repository structure/text/privacy/local-link validation
passed for 329 files; whitespace and six-document scope review passed. Checked the
Phase 2/3 entry gates, first-rewrite dependency, provider-qualification review boundary,
separate milestone acceptance, operation allowlist and unchanged deferred Git scope.
No application/native/provider checks were run for these documentation changes.
That checkpoint selected publication to `origin/codex/phase-2-3-planning`; it is
historical, not a pending instruction for this update. Section 22/live HANDOVER own
current local-only continuation; the original worktree and unpublished commits remain
preserved. No new PR, merge, build/CI allowance or implementation is selected here.

## 20. Bounded deliverables and next-outcome prompts

The user selected deliverable-sized execution on 2026-10-03: an owner with bounded
subagent assignments completes one target, checks the actual result, fixes in-scope
findings, updates canonical docs/the task ledger/HANDOVER, and returns a prompt for
the next outcome. Do not one-shot Phase 2, Phase 3 or an entire lane. Section 19's
five stages are a scheduling/dependency map, not five phase-sized agent goals.

The targets below are planning selections for future briefs, not extra requirement
IDs or execution approval. Existing 2A–2C and 3A–3D/3F gates retain authority. Before
starting each target, fix its concrete allowed operations, affected test hosts,
finite expensive-run allowance and dependencies against the then-current baseline.
Split a target further when it cannot be proved as one coherent bounded result;
do not silently turn it into delivery of the remaining phase.

### Deliverable queue

| Target | Finished result and decisive proof | Requirement/dependency |
| --- | --- | --- |
| Shared source foundation | One nested child edit preserves surrounding source and stable locations through undo/reopen. Introduce minimum structure/preparation only. | Bounded 3A.1/3A.2; Phase 1/1H entry. Can overlap provider qualification. |
| Provider qualification | Synthetic Studio/generic results and concrete request/credential contracts; report failures/unknowns. | 2A.0; return for its existing review before production integration. No project sends. |
| Provider settings and credentials | Configure provider/model/credentials/limits and explicitly check readiness; native credential storage and failures follow the declared contract. | 2A.1 after 2A.0 review. |
| Request lifecycle | Complete/cancel a bounded synthetic request; failures, limits and late replies preserve responsiveness. | 2A.2 using accepted settings/credentials. Scope streaming to qualified behavior. |
| Manual reference library | Create/edit/approve manual cards and lore on shared records/forms, undo and reopen with exact statuses/revisions. | Necessary 2B.1. Can overlap provider settings work after contracts agree. |
| Prompts and context preparation | Edit/restore a prompt and save/reopen; select exact reference revisions and inspect a bounded payload without silent truncation. | Remaining necessary 2B.1 on the manual library; shared prompt/limit settings. |
| First safe dialogue rewrite | Prepare and inspect one exact send with selected references, review one response, apply once, undo and reopen; invalid/stale output changes nothing. | Bounded 2B.2/2C.1/2C.2 using the prior foundations. One integrated owner outcome across both lanes. |
| Continue Scene | Generate supported Beats at an explicit insertion anchor, review the group, apply/undo and retain terminal/custom boundaries. | Bounded remaining 2B.2/2C.1/2C.2 after first rewrite. |
| Draft Scene | Review/create one new Scene with core IDs and explicit terminal state; any incoming connection stays a separate visible operation. | Next bounded 2B.2/2C.1/2C.2 increment on the same proposal path. |
| Generated Character cards | Draft/update a card with explicit acceptance/approval, provenance and undo/reopen; any selected runnable definition/Appearance operation is separate and reviewed. | Character portion of 2C.3 on manual records/proposal infrastructure. |
| Generated lorebook entries | Draft/update reviewable entries with applicability, citations, approval/staleness and undo/reopen. | Lore portion of 2C.3; reuse the same reference lifecycle. |
| Phase 2 qualification | Complete all selected actions on Studio and one qualified generic endpoint, plus affected native targets and the integrated workflow. | 2C.4; no phase completion claim from the first rewrite alone. |
| Conditional Story logic | Author supported nested conditions/choice guards; Story, Source and Branches agree; native routes match the declared variables. | Necessary 3A.1–3A.4 after shared foundation/first rewrite. Can overlap remaining Phase 2. |
| Scene calls and Story completion | Call a Scene, return to the following Beat and preserve guarded continuation/return labels through edits and persistence; qualify 3A's combined behavior. | Remaining 3A.1–3A.4; build on conditional source/flow. |
| Screen round trip | One supported custom screen can be edited via synchronized canvas/tree/properties, undone and reopened; unsupported neighbors survive and native layout agrees. | Bounded 3B.1/3B.2/3B.4; accepted Phase 2 and 3A. Introduce shared scratch runtime job once. |
| Custom screen Story connection | Visually Show/Hide an owned panel or Call an owned screen and finish its interaction before returning to the following Beat; normal play, source, undo and reopen agree. | 3B.2a after Screen round trip, before Screen completion; typed parameterless subset and 3D effect summaries. |
| Dialogue and choice screens | Edit declared dialogue/choice layout/style slots without breaking speaking, choices or required bindings in the actual game. | Bounded 3B.3 on the proven screen services. |
| Menu screens and Screen completion | Complete the declared menu/preferences/save/load adapters and remaining supported inventory; qualify native interactions, Source reconciliation and persistence. | Remaining 3B.1–3B.4; split adapters further in the brief if required. |
| Static character staging | Drag/resize and numeric/keyboard edits give accurate native placement at game resolution/window sizes; one gesture is one undo and Escape writes nothing. | Bounded 3C.1/3C.2; independent of full Timeline UI. Can overlap Screen round trip after shared runtime/asset contracts agree. |
| PNG/ATL idles | Frame sequences and the supported transform idle continue through dialogue, change/stop correctly and survive undo/reopen. | First bounded 3C.1a/3C.3 media increment on shared placement. |
| Native looping video | One qualified opaque/silent clip starts on Show and stops on Hide using shared placement; then qualify the declared embedded-audio/mixer behavior. | Next 3C.1a/3C.3 increment; bounded media delivery and native profile proof. |
| Prepared transparent video | Supplied side-mask playback has correct transparency and logical geometry; qualify any selected separate-mask route before exposing it. | Next 3C.1a; no mask generation/conversion. |
| Play-once video | Declared disappear/hold-last/supplied-still end states and replacement/restore behavior work in native playback. | Next 3C.1a/3C.3; no frame-exact resume promise. |
| Transform Timeline | Add/move/edit supported keyframes and interpolation on the same source/placement/history model; native state/timing agrees. | Remaining transform parts of 3C.1/3C.2/3C.4. |
| Audio Timeline and 3C completion | Place declared music/SFX cues, waits/fades/queues and interaction boundaries; qualify combined staging/idles/video/transforms/audio. | Remaining 3C.3/3C.4. Full selected inventory still required. |
| State inspection | A chosen finite route shows known values, provenance and explicit unknowns, including unresolved screen interactions, without executing project code. | 3D.1/3D.2 after accepted 3A; accepted 3B screen-effect summaries for screen-dependent state and 3C descriptors for supported effects. |
| Run from Scene entry | An isolated scratch launch matches normal play at a supported Scene entry and preserves real project/saves; refuse unknown or stale state. | 3D.3 with qualified 3A/3C semantics, relevant 3B effect summaries and shared runtime service. |
| Run from supported Beat boundaries | Extend only to proven stable statement boundaries; qualifying normal/reconstructed runs agree and unsupported starts refuse. | 3D.4 after Scene-entry proof; active call-stack reconstruction remains excluded. |
| Integrated initial release | Complete one real authoring workflow across writing, Assist, Screens, Timeline and State; close the required combined acceptance evidence. | 3F after all required capabilities, not a new feature sweep. Git remains deferred. |

Within the two parallel lanes, choose only currently independent targets from this
queue. The owner can have a paired outcome where both lanes jointly deliver one user
action (especially the first rewrite); do not launch unrelated phase-sized assignments.
When one lane completes a target, integrate its proof and prepare its next prompt;
do not automatically broaden the other lane or repeat unchanged expensive checks.
Story logic precedes Screens. Screens and animation targets then overlap; State and
release consume their accepted semantics. The exact sequence follows dependencies,
not a requirement to serialize every row of this table.

### Completion loop and stop boundary

When both local platforms are required, follow [host handoff](../../WORKFLOW.md#test-host-routing-and-ownership):
finish available local work, publish/verify the same branch, then give the user a
pull-and-continue prompt for the other platform. No direct other-machine access;
one active writer, unchanged outcome/budget and both-target acceptance gates.

1. **Select one result.** Record the target, user-visible outcome, exclusions, branch/
   baseline, required dependencies, affected test hosts and finite execution allowance.
2. **Assign bounded work.** Use the selected GPT-6.1 Sol High owner and zero to two
   GPT-6.1 Sol High implementation agents on independent declared files/contracts.
   Use one writer for shared mutable code; sequence dependent work. A short serial
   target need not occupy both implementation agents. No recursive agent tree.
3. **Build the complete target.** Integrate at real operation boundaries. Continue
   through required source/dispatch/persistence/UI work within the selected result.
4. **Check and fix.** Run relevant cheap checks and required actual-path/native proof;
   self-review the integrated diff and real UI where changed. Correct in-scope findings
   and rerun affected checks. Preserve independent review where already required.
   Existing cumulative budgets and two-correction reassessment rules remain.
5. **Close the record.** Update canonical behavioral docs/ADRs as needed, the existing
   task ledger and live HANDOVER/CURRENT with exact refs, evidence, failures/skips,
   remaining limitations and any pending operation. Commit and publish only within
   actual authorization; disclose local-only/unpublished work.
6. **Return the result and next prompt.** Report what now works, compact check results,
   known limitations, review status and the next dependency-ready target. Supply a
   paste-ready prompt with its fresh continuation refs. Stop before that distinct
   outcome; the user selects it. A returned prompt is not permission to execute it.

Internal commits/checks/fixes do not force a new chat or approval request. Resume the
same target in the same chat after waits using the repository's existing workflow.
If the target is genuinely blocked or awaiting acceptance, provide a continuation/
review prompt for that target and retain its unresolved state; do not present a blocked
deliverable as complete or advance to dependent work. A new outcome may use a new chat,
but it is not required merely because a checkpoint was committed.

### Next-outcome prompt contract

Keep the prompt below 4,000 characters. Put durable rules in the repository and link
the selected task section; avoid copying entire phase plans, UI rules or AGENTS into
each message. Preserve these concrete fields:

```text
Deliver <one target>: <observable finished result>.
Repository: Caldwell-41/Renpy-editor
Continuation: <current branch/PR, published checkpoint or explicit local-only state>
Codex machine: <actual execution host>
Test hosts: <affected Windows x64/macOS ARM64 requirements and accessible prerequisites>
Host handoff: <completed local work, remaining other-platform work; pull same branch>
Reason: <why this result is next and which accepted dependencies it uses>
Read AGENTS.md, CURRENT, HANDOVER and <exact selected task section>.
Use one GPT-6.1 Sol High owner and zero to two GPT-6.1 Sol High implementation agents
only for useful independent assignments with declared file/contract ownership.
Scope: <included operations and explicit exclusions>.
Prove: <decisive user-action/source/persistence checks and required native evidence>.
Allowance: <finite builds/dispatches plus existing problem budget, not a fresh reset>.
Complete implementation, focused checks, review and in-scope fixes; update canonical
docs, task ledger and HANDOVER. Publish within the recorded authorization.
Return the result and a prompt for the next distinct deliverable; do not start it.
Resume this same target/chat after any workflow wait. <Specific review/publish limits>.
```

Guidance checked: [official GPT-6 prompting guidance](https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices)
recommends explicit delegation/autonomy and testing proportionate to changed scope.
Its behavior examples are based on Astra and must be evaluated for the selected Sol
team. [OpenAI's multi-agent guidance](https://developers.openai.com/api/docs/guides/deployment-checklist#use-multi-agent-for-parallel-work)
supports concrete independent assignments and serial ownership of dependent/shared
work. These inform the cadence; the deliverable queue and repository gates are
Loomlight decisions, not a mandated OpenAI milestone count or new orchestration system.

## 21. First bounded source-foundation assignment

**State:** independent corrected-input review complete with no remaining actionable in-scope defect after EOF append/identity correction. Final-input Windows x64/macOS ARM64 qualification complete; accepted and integrated as the bounded source-foundation checkpoint through [PR19](https://github.com/Caldwell-41/Renpy-editor/pull/19); integration closed. User explicitly removed cross-machine archive transfer as a blocker. Original proof/failures are preserved; full Phase 2/3A remains unfinished. [Section 23](#23-source-foundation-implementation-ledger--2026-10-07) owns attempts and continuation.
**Reason:** prove stable child ownership before AI planning grows around flat Scenes.
No provider access or credentials are needed.

Recognise one `if <declared bool variable>:` / `else:` group in a Loomlight-owned Scene,
with a dialogue child in each body. Add the parent/branch/child identities, revision-bound
locations and preparation needed to display/select/edit one existing child through
Story controller, core dispatch and transaction. A minimal nested outline suffices;
the synthetic source fixture supplies the group. Preserve opaque neighbors and old
non-nested behavior. Group creation/move/unwrap, full expressions, guarded choices,
calls, AI, Screens, Timeline and state simulation are outside this target.

Prove unchanged Phase 1 fixture reopening/no-op bytes/IDs, a minimal child patch,
comments/Unicode/newlines/custom-neighbor preservation, undo/redo/reopen, ordinary
external conflict and retained draft on stale/session ownership. Include a rejecting
child-owner assertion and a real renderer-to-service action. Keep mapping migration
focused and record its implementing ADR. Normal SDK play of the bool true/false fixture
checks preserved syntax, not complete 3A support. Both clients need affected native
action evidence; portable work can proceed while genuinely unavailable evidence is
recorded. Do not replace native proof with a mock or transfer it to the user.

At selection inspect fresh refs/worktrees, create/reuse a `codex/` implementation branch
from accepted main (not the historical fork), preserve local planning edits and fixed
release identities, and record ownership in the existing ledger/HANDOVER. Use helpers
only for a declared independent task. Cheap focused checks are routine; record finite
targeted native/build allowance before execution. No full package matrix, provider
request, paid action, release, merge or following deliverable is implied. Stop at
review-ready only when selected required gates pass; otherwise record the actual
blocker/remaining evidence and same-target continuation. Do not waive missing native proof.

## 22. Agreed planning refinement — 2026-10-07

The user reviewed Phase 2/3, selected prompt/reference/connection/agent defaults,
accepted the omission review and requested this document update, self-check and start
prompt. Full Phase 3 scope and animation order remain. Native references/basic scope,
project prompts, localhost/LAN/HTTPS, OS keys with explicit session-only mode and
adaptive zero-to-two helpers are selected. ADR 0011/canonical docs own durable design.
No implementation, provider connection, key change, native/build/CI, push or release
operation was selected here. Work is local-only on current main; the historical
planning worktree is untouched. Concurrent 0.1.0 publication completed independently;
preserve its fixed tag and archived ledger. The next selected implementation can use
section 21 without live-provider access.

**Verification:** documentation structure/text/privacy/local-link validator PASS (356
files); whitespace and 12-document scope review PASS. Self-review corrected historical
publication instructions, credential-mode wording and installed-baseline reset alignment.
App/test/workflow/dependency trees and archived evidence are unchanged; no app/native/
provider/CI execution was needed. Final checks repeated after those documentation fixes.
Local-only continuation is main `aba200f` plus this working diff, not a published SHA.

## 23. Source-foundation implementation ledger — 2026-10-07

**Selected:** section 21 only; one owner, no helper assignments. Local implementation
branch `codex/nested-source-foundation` starts at accepted main `aba200f`, carrying
all twelve uncommitted planning files. Fresh remote refs confirm main `aba200f` and
planning `267ec2a`; historical planning checkout `2c5a164` is untouched. No push,
merge, release, provider action or subsequent deliverable is authorized.

**Allowance/access:** focused local core/renderer checks; at most one targeted native
build/proof on each Windows x64/macOS ARM64 host, no automatic retry/full matrix.
Mac ARM64 local project toolchain, locked dependencies and pinned SDK archive exist.
No Windows shell/checkout access has been established; no SSH config is present.
Actions cannot consume unpublished working inputs, so no workflow dispatch is selected.
Existing packaged runtime runner can select individual optional cases; extend it with
one source-foundation case rather than running the production matrix. Expensive native
allowance remains unconsumed at entry. Missing target evidence is not acceptance.

**Implementation decision:** retain disjoint source ranges and the existing Beat IDs;
add explicit group/branch identity and child-owner locations to source-map v3. Project
schema stays v2. Migration reuses exact byte/hash IDs, preserves unknown fields and
never writes `.rpy`. A dedicated child-dialogue command requires the displayed owner
and source revision; root operations refuse children. Structural rows are read-only.
Only direct dialogue plus trivia inside a declared bool if/else is recognized; other
conditions/bodies remain opaque. No condition execution/state simulation is added.

**Preflight and self-review:** real dispatcher foundation 5 PASS, 1 explicitly ignored
SDK case; Scene selector 31 PASS/7 specialist ignored; Source 16 PASS; metadata 3 PASS.
Frontend `npm run check` 96 PASS, including execution of the shipped source-foundation
driver against a strict renderer fixture. Rust format, JS parse and whitespace checks
PASS. Validator PASS (360 files before final status updates).

The initial routine broad-core attempt produced 195 PASS, 1 FAIL, 42 ignored, 3 filtered.
Its stronger second-child-identical-to-first assertion caught swapped IDs: the prepared
child tuple still lacked its exact anchor. Corrected that tuple and reran the rejecting
foundation selector successfully, then the affected Scene/Source/metadata selectors.
The initial failure is retained locally; no broad green result is inferred. Unchanged
4,097-journal stress paths are not repeated. Initial compile/type/assertion feedback
was corrected during preflight. The native driver fixture twice lacked Close Project
after Story redraw: inspection showed it incorrectly placed the shell control inside
the tree. Corrected the fixture ownership; all shipped-driver steps now pass. This
was renderer-driver compatibility, not a native run or a native acceptance claim.

**Mac native attempt 1 selected:** project-local pinned tools; one `tauri build
--no-bundle --locked`, one existing runner `source-foundation` case, and the one exact
ignored pinned-SDK source-foundation gate (compile/lint, true/false and rejecting wrong
outcome). No installers/full matrix. Verify candidate input hashes before execution;
retain logs/reports under ignored `.toolchains/reports/source-foundation/`. Build/proof
allowance is consumed by this attempt regardless of result; no automatic retry. Windows
attempt count remains zero. No external CI operation is pending.

**Mac build attempt 1 result:** frontend production build PASS; native Cargo build
NOT STARTED. The invocation placed `--no-bundle` after Tauri's Cargo argument separator,
so Cargo rejected it (`unexpected argument '--no-bundle' found`) before compilation.
Correct invocation is `npm exec -- tauri build --no-bundle -- --locked`; it is recorded
for a newly selected allowance, not automatically executed. No native application
was built or launched and no WebView pass is claimed. The separately selected SDK
proof remains part of attempt 1; it is dispatched once, without a retry. Candidate
app/fixture input digest before proof is
`6954a274d8a344e814058ce006166074c7846e8ee08bfef37f0aba6fa784f719`.
Ignored local manifest/logs retain exact working input hashes and base/branch identity.

**SDK attempt 1 result/classification:** verified official 8.5.3 archive install and
SDK compile/lint completed with exit 0. Normal entry displayed the edited true-branch
dialogue; flag and real say-widget assertions passed (four SDK assertions passed).
The case still FAILS: after advancing to main menu, `opaque_neighbor` is no longer
in the game context and the post-return assertion raised `NameError`. Terminal
cleanup PASS. False and rejecting wrong-outcome cases were not reached; neither is
claimed. The exact failed log/case output is retained locally in `mac-sdk.log` and
`sdk-cases.json`. No retry occurred.

**Bounded correction:** add one synthetic continuation dialogue after the existing
Python neighbor and assert its value there, before Return; then require main menu.
This changes the proof fixture/oracle, not condition parsing or production state
semantics. Focused checks are repeated on that final fixture; native/SDK qualification
remains missing. `cargo check -p loomlight-desktop --locked` PASS on Mac; it is only
compilation evidence, not a native application action.

**Final local continuation:** final app/fixture digest `14b4f6c94fe3f36b46b8585e9e875557c642d3ca706240140e3b8326f640a515` (separate from
failed attempt inputs); branch `codex/nested-source-foundation` at base `aba200f` plus
uncommitted working changes. Source/Story TypeScript ranges now share the explicit
owner contract. The corrected SDK driver retains all three independent reports and
rejects the combined result if any case fails; it has not been run natively. Foundation
checks on the revised continuation fixture PASS (5, SDK wrapper ignored); frontend
96 PASS and final typecheck PASS. Historical planning worktree remains clean. No
external or runtime operation remains pending. Required WebView action on both OSes
and complete true/false/rejecting SDK evidence remain missing. Mac attempt 1 is
consumed; Windows attempt 0/access unestablished. Resume the same selected outcome
only with established Windows access and an explicitly renewed narrow Mac allowance.
No accepted source-foundation or Phase 2/3 completion claim, commit/push/merge/release
or automatic next deliverable.

**Final document/self-review check:** validator PASS (360 files), whitespace PASS;
CURRENT 366 words and HANDOVER 703 words, within workflow review targets. Reviewed
parser refusal, disjoint ranges, anchored identical-child ID reuse, same-revision owner
validation, migration conflict refusal, exact quoted-token patches, typed IPC and
retained form controls. No secrets/private content/absolute user paths or generated
logs are added to versioned files. No expensive operation or allowance is pending.

**Same-outcome continuation / Mac replacement attempt 2 selected:** the user explicitly
authorized one replacement targeted Mac build/WebView/SDK proof using the corrected
command and oracle. Codex machine macOS ARM64; required test hosts Windows x64/macOS
ARM64; reason remains nested-child ownership proof before AI planning. Preserve all
local changes and historical worktree; no full matrix, automatic retry, push, merge,
release or subsequent deliverable. Fresh remote main/planning refs remain `aba200f` /
`267ec2a`; implementation branch is unpublished. Historical `2c5a164` checkout is clean.
All tracked/untracked app/fixture hashes exactly match final digest `14b4f6c94fe3f36b46b8585e9e875557c642d3ca706240140e3b8326f640a515`.
Separate ignored `mac-attempt-2/inputs.json` preserves this candidate.

Replacement selection: one `npm exec -- tauri build --no-bundle -- --locked`, one
`run-runtime-ui-probes.py` invocation with only `source-foundation`, and exact ignored
`renpy::tests::source_foundation::source_foundation_bool_sdk_gate` (official verified
8.5.3 compile/lint, true/false/rejecting outcomes and cleanup). Project-local pinned
Node 24.19.0 / Rust 1.90.0; all evidence goes under the separate ignored attempt
directory. Dispatch consumes this replacement allowance regardless of outcome.
Windows has no usable connected project or local SSH configuration; access clarification
is pending and its unused allowance must not be dispatched before access is confirmed.

**Windows routing decision:** the user confirmed Windows will be a different Codex
run on a different machine. This Mac run has no established Windows execution route
and will not consume its allowance. The unpublished candidate must first be transferred
without losing local work; the Windows run must verify the exact app/fixture manifest,
its actual x64 desktop access and existing pinned tools before the one targeted proof.
No push, Actions dispatch, infrastructure install or second writer is selected here.

**Mac replacement build:** PASS, release ARM64 executable built in 24.98s using the
corrected argument order. Retained executable SHA-256
`d990ac7b5ee63ea4436ff27ef5588fa1ee7b49a916751966af1fad7b1bac14b7`;
separate execution manifest includes exact source digest, host/tool versions and layer.
The existing native runner was dispatched once against that retained executable with
only `source-foundation`. The launch was mistakenly made inside the restricted shell
sandbox: macOS desktop-service connection errors appeared, no probe report arrived,
and a one-second read-only stack sample showed the AppKit event loop waiting without
an observed proof action. Provisional classification is environment/startup limitation;
this does not prove the application's native path passes. No relaunch or production-code
correction was selected. The separate exact SDK gate
was dispatched once with desktop access, using the corrected continuation oracle.

**Mac replacement terminal audit:** SDK PASS: exactly 1 selected Rust test, 0 ignored,
241 filtered; 84.86s. Official checksum verification/install, compile and lint succeeded.
True and false each returned 0, emitted their expected route marker and passed all six
SDK assertions, including the continuation/custom-neighbor assertion before Return.
Wrong-outcome returned 1 with an actual failed required dialogue assertion and no success
marker; the wrapper correctly accepted this expected rejection. All three retained case
reports pass; terminal cleanup is true. Strict report/count/marker audit PASS. Original
failed SDK evidence remains unchanged; no cross-input qualification is claimed.

Native FAIL / missing evidence: after 162.789s the exact owned launch was stopped with
SIGTERM following desktop-service errors, an idle AppKit stack and absence of both the
disposable profile and any probe report. Runner returned 1, recorded child exit -15,
`timedOut: false`, `reports: []`, `passed: false`. This is a cancelled startup-blocked
proof, not a timeout or passed action/cleanup gate. No project fixture was created.
Read-only diagnostic evidence and all logs/executable/manifests remain separately under
ignored `mac-attempt-2/`; no historical evidence was overwritten. This run's shell
sandbox launch was an execution mistake; sandbox/startup limitation remains a provisional
classification, not a product diagnosis. Desktop-access execution of the retained binary
is the smallest remaining discriminating action and needs a new explicit native-only
allowance. No automatic relaunch, rebuild or source correction is authorized.

Cumulative source-foundation native problem budget: Mac build invocations 2 (first failed
before Cargo compilation, replacement PASS); native launches 1 (startup-blocked/cancelled);
exact SDK proofs 2 (first oracle FAIL, corrected replacement PASS). Windows builds/native/
SDK proofs 0, targeted allowance unused; user-selected separate Windows machine/run must
confirm access and exact candidate before spending it. No operation remains pending.
Qualification stays incomplete, not review-ready or accepted; AI planning/provider work
and subsequent deliverables remain outside scope. No commit, push, merge or release.

**Transfer/self-review checkpoint:** prepared ignored
`.toolchains/reports/source-foundation/windows-candidate-transfer.zip` with a full
tracked binary patch, untracked source/fixture/ADR bytes, exact app/fixture manifest
and preservation/Windows-byte-check instructions. No SDK, binary, logs, `.git` or
historical worktree is transferred. Archive CRC/patch/untracked bytes are verified;
`windows-transfer-receipt.json` retains its checksum. The same application digest
still matches every tracked/untracked input. No source/probe fix was made this run.
Documentation validator PASS (360 files), whitespace PASS; live status stays compact
and preserves the actual missing proof, exhausted Mac allowance and unused Windows
allowance. Final bundle is refreshed once after these status edits, without a
receipt-only commit. All local changes and the clean historical worktree remain;
no publication or pending process/operation is claimed.

**Mac native-only attempt 3 selected:** user explicitly answered “Yes you can” to
one native-only Mac probe with desktop access, using the retained executable without
rebuilding. The previous one-shot cap is extended only for this single launch;
no SDK rerun, full matrix, automatic retry, push, merge, release or following deliverable.
All app/fixture manifest hashes still match digest `14b4f6c94fe3f36b46b8585e9e875557c642d3ca706240140e3b8326f640a515`;
retained executable hash still matches `d990ac7b5ee63ea4436ff27ef5588fa1ee7b49a916751966af1fad7b1bac14b7`.
Run only existing optional `source-foundation` with desktop access; retain separate
`mac-native-attempt-3/` inputs/log/result. Dispatch consumes this native-only allowance.
Historical worktree and all local changes remain preserved. Windows remains the
user-selected separate machine/run with its unused allowance; no Windows access or
execution is claimed here.

**Mac native-only attempt 3 terminal audit:** PASS, runner exit 0, native exit 0,
no timeout, 4.22s, exactly one successful terminal report and cleanup true. All eleven
expected checks passed: shared group/distinct branch ownership, BOM/mixed-newline/
Unicode fixture, disabled structural controls, actual Story minimal quoted-token
commit preserving neighbors and every Beat ID, Undo/Redo exact bytes, real-core
wrong-owner `SCENE_INVARIANT`, retained exact Story and concurrent Source drafts,
and close/reopen exact IDs/source. Stage is complete. Layer is release WKWebView
with actual Story controller/IPC/service and synthetic DOM editor input; no physical
keyboard, human or installer claim. Strict count/check/report/cleanup audit PASS.
Retained executable and every app/fixture input remained unchanged. Desktop-access
execution succeeds where the earlier sandboxed startup never prepared its fixture;
no product/probe change, rebuild or SDK rerun was required. Failed evidence is retained.

Mac source-foundation proof is now complete on the coherent recorded working inputs:
replacement build PASS, corrected official-SDK true/false/rejecting gate PASS, native
Story action PASS. Overall qualification remains incomplete pending the user-selected
separate Windows x64 run; it is not review-ready/accepted. Cumulative Mac builds 2,
native launches 2 (sandboxed cancellation, explicitly authorized desktop-access PASS),
SDK proofs 2; no additional Mac allowance. Windows builds/native/SDK proofs 0 and its
one targeted allowance remains unused until access/candidate/tools are verified there.
All commands terminal; no push/merge/release or subsequent deliverable. Preserve local
changes and historical worktree; refresh live status and transfer bundle with this result.

**Post-proof self-review/transfer:** validator PASS (360 files), whitespace PASS.
CURRENT/HANDOVER retain the live Mac PASS / Windows pending distinction and the actual
unused Windows allowance. Updated ignored transfer bundle/receipt includes the exact
latest tracked patch and untracked bytes; CRC/byte checks PASS. App/fixture hashes and
historical worktree remain unchanged. No rebuild, SDK repeat, publication or pending
operation. Continue only the remaining targeted Windows proof after machine access
and byte-identical candidate verification.

**Remote publication selected — 2026-10-07:** the user explicitly requested pushing
the up-to-date repository so Windows can pull it. This supersedes the earlier no-push
boundary for one coherent source-foundation/planning checkpoint on
`codex/nested-source-foundation`; no merge, release, PR, provider work, subsequent
deliverable or extra native/SDK execution is selected. Fresh remote main/planning refs
remain `aba200f` / `267ec2a`; no corresponding source-foundation remote branch exists.
Account noreply Git identity is already repository-local. Historical planning worktree
remains clean and untouched. Preserve the planning refinements/ADR 0011 together with
the implementation/ADR 0012; publish no ignored logs, executable, SDK or credentials.

[Published input manifest](source-foundation-inputs.json) contains only relative
app/fixture paths, hashes, base/branch and the reproducible input digest. Git's default
LF normalization would alter the mixed-newline source fixture, so an exact-path
`.gitattributes` exception preserves its bytes and permits CR at EOL. This is a
publication/checkout correction; no app/fixture bytes or qualified inputs changed.
Verify both staged/committed blobs and a fresh checkout against every manifest hash.
Windows must pull this implementation branch and verify the same hashes; the ignored
transfer ZIP is now optional historical fallback, not the primary continuation.

Production packaging is dispatch-only and quality pushes are main-only; this branch
push does not select a full matrix. Run cheap validator/whitespace/index-byte checks,
commit this coherent checkpoint and push without force, then verify remote HEAD and
record the exact publication receipt locally. The commit carrying this record and the
input manifest identifies the candidate; do not create receipt-only commits chasing
its own SHA. Mac proof remains complete; Windows allowance remains one unused targeted
build/native/SDK proof after actual host/tool/archive access is confirmed there.

**Publication preflight:** validator PASS (361 files), whitespace PASS; staged privacy/
scope audit includes 30 intended files and excludes all ignored toolchains/evidence.
All 138 staged app/fixture blobs exactly match Mac-qualified per-file hashes, including
BOM and six CRLF endings in the source fixture. A fresh index checkout with
`core.autocrlf=true` also matches every hash. No qualified source byte, dependency or
workflow changed; no Mac proof is repeated. Commit-object hashes and remote branch
identity will be verified before handing Windows the exact published candidate.

**Windows attempt 1 selected — 2026-10-07:** user requested latest remote branch;
fetch verified `45c64c5e03e03f4c6bdfeaa08f13315d41eedc50`. Separate Windows checkout
preserves the old feature checkout/local HANDOVER and historical trees. Remote branch
and committed manifest supersede the unavailable historical transfer ZIP. All 138
working files and committed blobs match digest `14b4f6c94fe3f36b46b8585e9e875557c642d3ca706240140e3b8326f640a515`;
fixture retains BOM, six CRLF and eleven total LF bytes. Actual Windows desktop
window enumeration/capture succeeds; existing Node 24.19.0/npm 11.9.0/Rust 1.90.0,
MSVC 14.50.35717/SDK 10.0.26100.0 and official Ren'Py 8.5.3 archive are verified.
Existing matching dependencies are copied, not installed. Restricted-shell MSVC/write
preflight limitations were resolved through authorized desktop-user shell access;
no build or proof was consumed by preflight. One owner, no helpers.

Consume exactly one `npm exec -- tauri build --no-bundle -- --locked`, one existing
runtime runner selecting only `source-foundation` against its retained executable,
and one exact ignored SDK gate from TESTING. Dispatch markers prevent another attempt.
Evidence: ignored `.toolchains/reports/source-foundation/windows-attempt-1/`, including
all exact input bytes, committed/working hash audit, dependency audit, host/tools,
commands, logs/results and retained executable/PDB. No matrix, infrastructure install,
automatic retry, Mac rerun, push, merge, release, provider or following deliverable.
Qualification is incomplete until terminal audits pass; no acceptance is inferred.

**Windows attempt 1 terminal audit — 2026-10-07:** build PASS, 196.016s total
(native release target 187s); 14,273,536-byte x64 executable retained, SHA-256
`85156032081f1ebd5cb573404f8d9b2fbcd1b7fc2ba7c9c9b06f4a1162844ffd`.
Only existing `source-foundation` runner invoked: PASS, native exit 0, runner exit 0,
7.968s, no timeout, exactly one terminal report, all eleven exact checks and cleanup
true. Actual Story controller/IPC/core action changes only the dialogue token; BOM,
six CRLF, Unicode/comments/custom neighbors and every Beat ID survive. Undo/Redo and
close/reopen preserve exact source/IDs; wrong owner returns `SCENE_INVARIANT`;
refusal retains exact Story text and concurrent dirty Source draft. This is release
WebView2 with synthetic DOM input, not physical/human/installer acceptance. A Chromium
class-unregistration teardown diagnostic (error 1411) is retained; the report/exit and
independent owned-process cleanup audit still pass. No extra launch follows it.

Exact SDK gate FAIL, Cargo exit 101: 0 passed/1 failed/0 ignored/233 filtered;
84.78s test, 115.469s including 30.46s compilation. Panic is
`source_foundation.rs:30`, `install_supported_sdk_from_archive(...).unwrap()`:
`Err(InvalidSdk)`. This precedes LifecycleService/SDK registration, project creation,
compile/lint and every true/false/wrong-outcome case. None of those SDK cases is
claimed; there are zero case reports. Terminal report is `passed:false`,
`cleanupComplete:true`; the SDK scratch root was removed. Classification: Windows
managed SDK install/admission failure, not a demonstrated nested-dialogue/runtime
assertion failure. The returned error does not identify which installer/validation
substep failed; environment versus product cause remains unresolved. Official archive
checksum still matches pinned 8.5.3. No second install, version probe, SDK run or fix
was attempted. Further diagnosis/proof requires separately selected scope/allowance.

Strict audit retains PASS build/native/input identity and FAIL SDK/absent case outputs.
All 138 app/fixture hashes and the retained binary are unchanged after execution.
Native synthetic profile's 53 files were copied byte-identically before removing its
exact contained scratch directory; accepted source independently matches the original
fixture plus generated technical label and single quoted-text patch, SHA-256
`a9e7810dc0acdfcf9f336449ac862f431660a5aee0a7dd8ceeec7fb82a699e56`.
Both terminal cleanup reports and final zero-owned-app/SDK-process audit pass.
Retained exact input tree, executable/PDB, SDK test executable, checksums, dispatch
markers, complete logs, results, fixture and audit files live in ignored
`.toolchains/reports/source-foundation/windows-attempt-1/`.

A cheap post-proof fixture audit first assumed `scene_001` was the technical label;
that oracle failed while the actual source hash matched the native report. The
original script/error is retained; reading the generated label from retained project
metadata corrects the audit without another application/SDK attempt. Earlier
restricted-shell write/MSVC limitations and minimized desktop capture were preflight
only, resolved before dispatch; they do not add build/native/SDK attempts.

**Cumulative state/stop:** Windows builds 1 PASS, native launches 1 PASS, SDK proofs
1 FAIL; its one targeted allowance is exhausted. Mac remains builds 2/native launches
2/SDK proofs 2 with the previously recorded final PASS evidence; no Mac rerun.
Both native Story paths now pass on the same 138 inputs, but required Windows SDK
true/false/rejecting proof is missing. Overall source foundation remains incomplete,
not review-ready and not accepted. No expensive retry, infrastructure install, full
matrix, provider action, AI planning, push, merge, release or following deliverable.
All operations are terminal; one owner/no helpers. Documentation/evidence remain
local-only atop fetched candidate `45c64c5e03e03f4c6bdfeaa08f13315d41eedc50`.
Next is separately selected diagnosis of this exact Windows SDK failure; preserve
passing unchanged build/native proof and all failures. No renewed allowance is implied.


**Windows SDK-only attempt 2 selected — 2026-10-07:** user explicitly granted
another allowance to continue this same outcome. Select one replacement exact ignored
SDK gate only, with no automatic retry; reuse unchanged passing build/native evidence.
All 138 app/fixture hashes and retained binary still match; archive checksum verified.
Actual desktop enumeration remains available; existing pinned tools/caches are reused.
Read-only archive/path audit identifies a discriminating environment correction:
old candidate root 220 characters, Windows Python launcher 254, 1,427 SDK paths over
259 (maximum 290). The new contained scratch root gives candidate 133, launcher 167,
maximum member path 203, with zero over 259. Long-path admission failure is a hypothesis,
not a confirmed root cause. Set only process-scoped TEMP/TMP to the new shorter root;
no application/test/fixture byte or system setting is changed. No extra version launch
or preliminary SDK installation. Retain separate ignored
`.toolchains/reports/source-foundation/windows-sdk-attempt-2/` input/path audit,
dispatch/log/result/case evidence; preserve attempt 1 and its failed audit unchanged.
Dispatch consumes this single SDK-only allowance. No build/native repeat, Mac rerun,
full matrix, infrastructure install, helper, push, merge, release/provider/AI work or
following deliverable. Qualification remains incomplete pending terminal audit.


**Windows SDK-only attempt 2 terminal audit — 2026-10-07:** PASS, Cargo exit 0;
1 passed/0 failed/0 ignored/233 filtered, 108.25s test / 108.734s total. No source,
fixture, dependency or probe changes; Cargo reused the existing test executable
(0.37s preparation). Official 8.5.3 admission, project creation, compile/lint and all
three retained cases succeeded as required: true/false exit 0 with their exact route
markers and six passed assertions each; wrong-outcome exit 1, one actually failed
required dialogue assertion, FAILED status and no success route marker. Terminal
report exactly once, passed true and cleanup true. Strict count/marker/assertion/output
and unchanged-input/executable audit PASS. The SDK test removed its scratch tree;
zero owned app/SDK processes and an empty short root were confirmed before removing
the root. No further SDK launch or production build/native repeat was performed.

Changing only the process-scoped scratch path resolves the observed admission failure.
Classify attempt 1 as a deep-scratch Windows SDK admission limitation, with the exact
internal failing substep uninstrumented. The static length audit and passing same-input
short-path run support that classification; they do not establish broad long-path
support or a product-source correction. Attempt 1's SDK FAIL, raw logs/executables,
failed cheap fixture oracle and all historical Mac failures remain retained unchanged.
All 138 working app/fixture hashes retain digest
`14b4f6c94fe3f36b46b8585e9e875557c642d3ca706240140e3b8326f640a515`; original Windows
release executable and SDK test executable remain byte-identical. Attempt 2 evidence
and combined Windows proof binding live in ignored
`.toolchains/reports/source-foundation/windows-sdk-attempt-2/`. Attempt 1 supplies the
unchanged build/native results and retained exact inputs/53-file native fixture;
recorded Mac build/SDK/native proof is reused on identical qualified inputs.

**Review-ready stop:** all selected Windows x64/macOS ARM64 build/native/SDK proof
now passes. This bounded source-foundation outcome is review-ready, **not accepted**;
full 3A and AI/provider work remain unselected. Cumulative Windows builds/native/SDK
proofs are **1/1/2** (SDK initial FAIL, explicitly authorized replacement PASS); Mac
remains **2/2/2**. The new single SDK-only allowance is consumed. No process/CI/action
pending, no automatic retry, full matrix, infrastructure install, helpers, push, PR,
merge, release or following deliverable. Status/operational documentation and raw
evidence remain local-only atop published candidate `45c64c5e03e03f4c6bdfeaa08f13315d41eedc50`.
Next is a separately selected independent review/acceptance decision using the frozen
input manifest and both platforms' evidence, without repeating unchanged expensive
checks or starting AI planning. Documentation/whitespace/self-review checks follow.

**Independent review and bounded correction selected — 2026-10-07:** the user requested
research, fixes for both P1 ownership findings, and a check of the work. Same Windows
x64 checkout at `45c64c5`, preserving five existing local documentation edits and all
historical evidence. No helpers, provider/AI work, push, merge, release, following
deliverable or expensive native/SDK rerun is selected. Focused compilation/core and
renderer regressions plus cheap documentation/format checks are authorized.

Review found root move/reorder can cross a neighboring child, and root insertion can
split If from Otherwise through a header/trivia anchor. Cheap actual-renderer probes
emitted both commands; static core tracing found no rejecting guard. The first probe
had a selector-only error before action, then a corrected selector succeeded; original
outputs remain in the review conversation. Independent audit verified 138 working and
committed inputs against the original digest and all 253 indexed Windows evidence
files. Mac raw proof is unavailable on this machine; section 23 records the reused
proof and failures. Both P1 findings defer the acceptance recommendation.

Rejecting real-dispatch and renderer regressions are added before correcting core/UI.
Retain cheap-check outputs separately under ignored
`.toolchains/reports/source-foundation/review-corrections/`. Original qualified input
manifest and Windows/Mac evidence remain historical proof of the original candidate;
changed inputs must not inherit exact-input qualification or acceptance. Restricted
shell write access failed before any test ran; the existing desktop-user toolchain
is used for focused checks, with no installation or system setting change.

**Correction results/self-review — 2026-10-07:** repository research and official
[Ren'Py conditional](https://www.renpy.org/doc/html/conditional.html) and
[block syntax](https://www.renpy.org/doc/html/language_basics.html#indentation-and-blocks)
references confirmed the structural boundary. Before-fix core regression FAIL: real
dispatch returned success and wrote the unsafe root/child swap. Before-fix renderer
regression FAIL: root Move Up remained enabled. Both failure logs stay retained.

Core now rejects movement ranges containing children and root insertion inside the
span from the first header to the last child, including Otherwise/intervening trivia.
Story applies matching move/drop and Add change here guards. Safe root movement and
insertion before/after the group retain child IDs/owners. Dedicated child token editing,
transaction/history/revision protections and fixture bytes remain unchanged.

Final focused selector PASS: 6 passed/0 failed/1 explicitly ignored SDK/228 filtered,
6.38s; the ignored gate supplies no changed-input SDK proof. Five exact existing
flat-Scene round-trip, continuation, migration, minimal-patch/history and opaque/conflict
regressions PASS. Full renderer suite 97 PASS/0 fail/0 skipped (15.273s); after adding
trivia/safe-after-group assertions, final affected renderer tests 3 PASS/0 fail/0 skipped.
Final TypeScript source/test compilation, Rust format, validator (358 files) and
whitespace PASS. Self-review checked destination/range guards, both insertion endpoints,
source/map refusal bytes, stable IDs/owners and safe root behavior. No new blocking
finding was identified in this self-review; independent acceptance is still pending.

Current correction digest is
`a1966e1c6821a440ec42fe9efd3732ff17bec17e1fa4c3800974440bc80fd5ec`.
All four changed app/test inputs and the final patch/test executable/logs are separately
recorded under ignored `review-corrections/`; original committed input manifest is
unchanged. Initial cheap failure logs are retained; normal focused recompilation
replaced the mutable test target, so no archived before-fix regression executable is
claimed. Original retained native/SDK executables and all 253 indexed Windows evidence
files remain unchanged. Mac raw files remain on their original host.

Three focused Cargo compilations/executions (before-fix FAIL, initial/final PASS) are
cheap correction checks, not native builds or SDK proofs. Native/SDK cumulative counts
remain Windows 1/1/2 and Mac 2/2/2; no renewed expensive allowance or rerun. Changes are
local-only atop `45c64c5`, not accepted or qualified by the old input digest. All
commands are terminal; no provider/helper/push/merge/release or following deliverable.
Next is independent review of the corrected working inputs and an explicit decision
about any changed-input native qualification; no additional execution is inferred.

**Corrected-input independent review and bounded EOF correction — 2026-10-07:**
the user selected independent review with exactly one review subagent, implementation
ownership retained by main, bounded in-scope fixes and focused checks. Native build/
launch/SDK allowances were explicitly not renewed; provider/AI, installation,
publication/integration and the following deliverable remained excluded. Fresh local
Git confirmed branch `codex/nested-source-foundation`, HEAD and remote-tracking ref
`45c64c5e03e03f4c6bdfeaa08f13315d41eedc50`, with all eleven existing modified files
preserved. No fetch/reset/commit/push or desktop/SDK dispatch occurred. The one reviewer
read corrected inputs independently and performed subsequent re-review; main made
every implementation/test change. This selection supersedes earlier no-helper wording
only for that one independent reviewer.

Both previous P1 guards passed review: root move/reorder cannot cross nested children;
root insertion cannot split headers, bodies or intervening trivia. Existing core/UI
regressions and safe outside-group edits remain intact. Reviewer identified one further
**P1 EOF append defect**: a recognized group ending in a dialogue child without a final
newline accepts root append at the child's end and joins both statements on one physical
line. Initial regression failed at Source Save because the harness supplied a second
BOM; that setup failure is retained as `eof-before.log`. The corrected BOM-free Source
draft reproduced the actual defect through production `scene.apply` dispatch;
`eof-before-corrected-fixture.log` retains the exact byte mismatch. No terminal Beat
requirement prevented this supported EOF case.

First bounded correction inserted the required separator but changed the final child's
range hash and UUID; `core-after.log` retains that rejecting ID assertion (6 PASS/
1 FAIL/1 SDK ignored). Final correction also anchors that preceding Beat's updated
range/hash to its existing ID, preserving owners and extra mapping fields through the
existing reconciliation path. Existing source bytes remain an exact prefix; only
the necessary LF/CRLF separator and new root statement are inserted. Added real-core
regression exercises both LF/CRLF, retained single BOM/Unicode, child IDs/owners,
exact Undo bytes, Redo and reopen. No application grammar/scope expansion.

Final focused command `cargo test -p loomlight-core --locked --offline source_foundation`
PASS: **7 passed/0 failed/1 explicitly ignored SDK/228 filtered**, test 8.11s,
focused compilation 11.93s. Five affected flat-Scene checks re-executed against the
final test executable PASS, one intended test each/zero ignored, because the separator
change also affects root insertion. Their logs retain exact selectors. Unchanged
renderer suite 97 PASS/final affected 3 PASS and source/test typecheck from the prior
correction are reused; UI/test inputs have not changed in this selection.

A narrow retained headless evidence adapter compiled against the corrected cached core
library connects shipped Story `renderSceneAuthoring`/`settleSceneDraft`, protocol bridge
and actual `ApplicationHost::dispatch`; refusal responses are not mocked. Final run
PASS **10 assertions**, actual `DIRTY_SOURCE`, `SOURCE_CONFLICT` and
`STALE_PROJECT_SESSION`; it verifies exact Story text/unsubmitted state, exact concurrent
Source draft, unchanged source/map bytes on refusal, minimal child token edit, child
IDs/owners and Undo/Redo/reopen. Adapter exit 0, empty stderr, owned successful profile
removed. This is actual controller/core proof with a synthetic DOM and stdio transport,
not desktop/main-shell/WebView or SDK qualification.

Adapter failures stay distinct: Windows slash-normalization assertion before process
launch; omitted `.scene-workspace` class (no commit dispatched); two 45-second helper
reopen timeouts, with their logs and failed scratch profiles retained. Traced timeout
reached external refusal/retention successfully, then stopped at helper reopen; its
exact internal blocking substep was not proven. Final run refreshes Source before
helper close/reopen, consistent with production close's Source refresh requirement.
It does not qualify the raw unrefreshed helper sequence. Renewed native proof should
exercise normal shell close/reopen after ordinary external refusal.

Reviewer independently audited the final anchored correction and successful logs:
**no remaining actionable in-scope defect**. Original corrected-input findings,
before-fix byte/ID failures and adapter failures remain preserved. Four focused Cargo
test executions (invalid fixture, demonstrated defect, separator-only ID failure,
final PASS), two cheap core-library builds and two adapter compilations occurred;
five headless adapter invocations are recorded (no desktop/native launches).
No archived before-fix executable is claimed; final core test executable and final
adapter/source/compiled-controller identities are retained. Existing toolchains,
dependencies and caches were reused offline; initial restricted shell evidence-directory
write failed before compilation, then authorized focused operations used reviewed
local-user access within the worktree. No infrastructure was installed.

Final 138-input digest is
`bd0b1406e001b51572d9c464ae3078293febf0e4e03063af428d3f23aedcc690`, recorded in
ignored `.toolchains/reports/source-foundation/independent-review/inputs-final.json`.
Only `scene.rs` and `lifecycle/runtime_probe.rs` changed since prior corrected digest
`a1966e1c6821a440ec42fe9efd3732ff17bec17e1fa4c3800974440bc80fd5ec`; all four working
app/test changes relative to published `45c64c5` remain local/uncommitted/unpublished.
Exact final corrected files, full patch, adapter source/binary, final test binary,
logs/result, review report and audit are separately retained in `independent-review/`.
Audit confirms 232 indexed `windows-attempt-1` files, 21 `windows-sdk-attempt-2`
files (253 total), and all 17 indexed prior correction files byte-identical. Fixture
BOM/six CRLF unchanged. Original digest `14b4f6c94fe3f36b46b8585e9e875557c642d3ca706240140e3b8326f640a515`
and committed manifest remain historical original-candidate qualification; Mac raw
evidence remains on its original host. No corrected-input native/SDK proof is inferred.

Native/SDK cumulative counts remain **Windows 1/1/2; macOS 2/2/2**, all original
allowances consumed. All current operations terminal/no owned process or pending
CI/publication. Final Rust format, repository validator (358 files) and whitespace
PASS; results accompany the retained receipt. **Source review complete; qualification
incomplete; not accepted.** Next is
the explicitly selected minimum qualification in HANDOVER's ready-to-paste prompt:
prepare/cheaply validate bounded native/SDK probe additions, freeze exact final inputs,
then one build/one native launch/one SDK gate per target with finite time caps and
zero retries. That prompt is a proposal, not an allowance granted by this review.

**Corrected-input qualification selected — 2026-10-07:** the user selected the
minimum two-target qualification above. Fresh Windows Git confirms branch
`codex/nested-source-foundation`, HEAD `45c64c5e03e03f4c6bdfeaa08f13315d41eedc50`,
and eleven modified files, all preserved. Reviewed 138 working inputs match
`bd0b1406e001b51572d9c464ae3078293febf0e4e03063af428d3f23aedcc690` exactly.
Entry evidence index preserves 1,035 prior evidence files; original manifests remain
historical. New evidence is isolated in ignored
`.toolchains/reports/source-foundation/corrected-qualification/`.

Allowance recorded before expensive execution: **per target one release no-bundle
build (1,200 seconds), one source-foundation-only native launch (300 seconds), one
exact pinned-SDK gate (600 seconds), zero retries/duplicate or ambiguous dispatches**.
Prior cumulative Windows counts **1/1/2**, macOS **2/2/2**. Preparation and focused
checks consume no expensive allowance. Windows uses existing pinned tools/caches;
Mac session, original evidence and direct transfer are not currently accessible.
Agent-owned Mac access was requested; missing access leaves qualification incomplete.
No infrastructure installation, full matrix, provider/AI work, publication, merge,
release or subsequent deliverable is selected. Failures require reassessment.

**Final qualification inputs frozen:** 139 app/fixture inputs, digest
`be497aadca699904efa29f84a8c19485a86b39741bdfb9d15bc32e9e5099c939`,
in ignored `corrected-qualification/inputs-final.json` and byte-exact `exact-inputs/`.
The extra input is the extended native probe. Existing eleven checks are retained;
33 checks now cover real core move/reorder and Otherwise/two-trivia insertion refusal,
safe outside-group edits, child IDs/owners, EOF append through Story, Undo/Redo/reopen,
exact dirty Source/Story drafts and external refusal followed by normal shell reopening.
The external write belongs to the independent native runner, using a read-only
probe handshake and fixed disposable profile. SDK true/false/wrong-outcome routes
now execute continuation source produced by root append after an unterminated child,
retaining the original six route assertions and wrong-outcome rejection.

Cheap proof: 7 focused core PASS; 3 affected renderer PASS; 1 exact SDK-fixture
preflight PASS without SDK execution; 33 shipped-probe checks through real Story
controller/bridge/core PASS. Initial cheap extended-probe failure was a harness
assumption that history survives close/reopen; failure is retained. Undo/Redo now
precede reopen and EOF append uses actual Story Add Beat. Existing unchanged broader
checks are reused. A final rerun after the ID assertion passes 33 checks. Runner
syntax, probe syntax and whitespace PASS. Existing pinned Windows tools and official
archive SHA-256 `eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`
verified. Windows short process-scoped TEMP/TMP is workspace-contained `q3s`.
Transfer archive SHA-256
`acb1fe181f7d18c675ee6db628beadc7be2eb6b3784f65286889fa81d24512b2`
is staged locally; no Mac transfer or matching-host audit has occurred.

Windows build attempt 2 is selected for one dispatch on these frozen inputs,
`npm exec -- tauri build --no-bundle -- --locked`, 1,200-second hard cap. Native/SDK
follow only a passing prerequisite, each with its own one-dispatch marker and cap.
No retries, automatic renewal or changed-input reuse of original target proof.

**Windows corrected build attempt 2 PASS:** exit 0, 55.078 seconds, no timeout;
retained x64 executable 14,285,312 bytes, SHA-256
`f6d0d2be4535759549bf66d4fa5daeb7993fcb1a417b758db7ddccfb3dbd4be2`.
Executable/PDB, exact inputs, dispatch and full build log are retained separately.
Native attempt 2 selected on that exact executable with only `source-foundation`,
300-second hard cap, one dispatch/no retry. Windows cumulative after build **2/1/2**;
native dispatch consumes the one new launch allowance regardless of outcome.

**Windows corrected native attempt 2 PASS:** runner exit 0/native exit 0,
13.312 seconds, no timeout; exactly one terminal report, all 33 expected checks
(including original eleven), extension-complete and cleanup true. Runner-owned
external write and normal shell close/reopen pass; disposable profile is retained
before contained deletion. WebView2 teardown error 1411 is retained as a diagnostic.
Layer remains release native WebView/real controller/IPC/core with synthetic DOM
input; no physical/human/installer acceptance. Frozen input and executable hashes
remain unchanged. Windows cumulative **2/2/2**.

Windows exact pinned-SDK attempt 3 is selected: only
`renpy::tests::source_foundation::source_foundation_bool_sdk_gate --ignored --exact
--nocapture`, 600-second hard cap, one dispatch/no retry. Actual EOF-generated source,
true/false six assertions each and deliberate wrong-outcome rejection must pass.
Native report identity/count and exact short-root/profile cleanup are prerequisites.
Dispatch consumes the single new SDK allowance regardless of outcome; no Mac run,
full package matrix or other SDK selector is authorized.

**Windows corrected SDK attempt 3 PASS:** exit 0, 108.359 seconds total/107.83-second
test, no timeout, exactly 1 passed/0 failed/0 ignored/236 filtered. Compile/lint and
normal-entry true/false each exit 0 with six actual passed assertions and expected
route marker. Deliberate wrong-outcome exits 1/FAILED without its success marker.
Exactly one terminal PASS/cleanup true; archive, fixture, expected rejecting results,
EOF-before/produced bytes and owner arrays are retained. Produced source SHA-256
`d1c800f8d652d3aa5c9faedb53bf204db867f6a2fc174384babb675818bcd2f2`;
retained test executable SHA-256
`5ea11a61856b4950bc3359ff1eb3315c68f0e0a45d3580e5e0b9fbe05977a9fd`.
Strict terminal audit PASS on all 20 checks, including six actual assertions per
route, real wrong-outcome failure, all 139 frozen/retained input hashes, executable
identity, exact 33 native checks, native profile/source retention and SDK cleanup.
All 1,035 entry-indexed prior evidence files remain byte-identical. Initial cheap
probe failure/log/profile remain retained. No retry or duplicate dispatch occurred.

**Target result / access stop:** Windows x64 corrected-input build/native/SDK
qualification PASS on digest `be497aadca699904efa29f84a8c19485a86b39741bdfb9d15bc32e9e5099c939`.
macOS ARM64 **INCOMPLETE — unavailable agent-owned host/session, original raw evidence
and direct transfer**. The session exposes local Windows only; no usable existing
SSH connection was found. Access was requested while independent Windows work
continued, with no response/connection received. No Mac operation was dispatched,
no remote input-hash match was verified, and original Mac proof remains historical
on its original host. Staged transfer archives are preparation, not transfer evidence.
Both-target qualification remains incomplete and the corrected foundation is **not
accepted**. No source or probe edits occurred after input freeze.

Cumulative builds/native launches/SDK gates: **Windows 2/2/3; macOS 2/2/2**.
New Windows allowance fully consumed; new Mac allowance **one/one/one remains unused**,
with original 20/5/10-minute caps and zero retries. Next action is to establish actual
agent-owned Mac desktop access, inspect/preserve its checkout and original evidence,
transfer frozen inputs/evidence directly, prove all 139 hashes match, cheaply verify
existing pinned tools/cache/archive/profile prerequisites, then consume only the
remaining Mac allowances. Windows passing unchanged proof is reused. Missing access
does not authorize installation, a full matrix, provider/AI work, publication,
integration/release or the following deliverable. All Windows execution is terminal.

**Final retention/cleanup:** zero owned native/SDK/test processes; native profile and
new short-root cache retained before contained cleanup. Native/SDK scratch and short
root removed, cleanup audit PASS. Final Rust format, repository validator (359 files)
and whitespace PASS. All original local work remains preserved, HEAD/branch unchanged;
no commit, push or publication. Verified staged Windows evidence archive is 30,159,079
bytes, SHA-256 `1fdee686254e6596edf2c9487cdaaf71acfc383f918a91f9a55bcbda89f47120`,
with 1,221 individually verified evidence members, including exact inputs/binaries,
all new failures/results, profile, cleanup and status snapshots. `transfer-receipt.json`
records that actual transfer is false; this archive is ready for direct transfer only
after Mac access exists. Frozen input digest and target results remain as recorded above.

**Remote checkpoint selected — 2026-10-07:** the user requested “Ensure remote is
updated” after receiving the Mac continuation prompt. Fresh remote fetch confirms
`codex/nested-source-foundation` still at `45c64c5e03e03f4c6bdfeaa08f13315d41eedc50`.
The corrected implementation/probes, existing operational/status edits and a separate
[portable final input manifest and Windows receipt](source-foundation-qualified-inputs.json)
are checkpointed together as `fix: qualify corrected nested source foundation on Windows`
and pushed without force to the same branch. Verify all 139 staged/committed blobs
against the frozen manifest; qualified application inputs do not change. The original
committed manifest remains historical. Raw evidence, binaries/PDB, caches, logs and
SDKs remain ignored/local; exact bundles and hashes support direct Mac evidence
transfer. This remote update does not imply completed Mac transfer/qualification,
acceptance, merge or release. No expensive checks or allowances are renewed.


**Mac corrected-qualification continuation / direct-transfer access stop — 2026-10-07:**
The user selected only the remaining macOS ARM64 qualification, preserving Windows
proof and every earlier failure. Original Mac checkout is the current project root;
fresh Git confirms `codex/nested-source-foundation` at
`45c64c5e03e03f4c6bdfeaa08f13315d41eedc50`, initially clean. Historical planning
worktree remains `2c5a164597779331af9ff81bf0eb3bdabb41ddb7`, untouched. No reset,
application/probe edit, commit, push, merge or new deliverable occurred.

Read original AGENTS/CURRENT/HANDOVER and sections 21/23. Read-only inspection of the
connected Windows task discovered its later published checkpoint; one fetch verified
`origin/codex/nested-source-foundation` at
`a49e536163d5cea2e220894f97f780f4bd301668`. Mac HEAD/worktree were not advanced.
That checkpoint's newer portable `source-foundation-qualified-inputs.json` and all
139 Git blobs independently match final digest
`be497aadca699904efa29f84a8c19485a86b39741bdfb9d15bc32e9e5099c939`.
This is remote blob inspection, **not** direct archive transfer or a final Mac working
input audit. Original committed 138-input and reviewed 138-input manifests remain
historical and cannot substitute for the final qualification tree.

Windows published receipt records build PASS 55.078s, native PASS 13.312s/all 33
checks/one terminal report/cleanup true, exact SDK PASS 108.359s with six actual
assertions per passing true/false route and deliberate wrong-outcome exit 1/FAILED
without its marker. Release x64 SHA-256
`f6d0d2be4535759549bf66d4fa5daeb7993fcb1a417b758db7ddccfb3dbd4be2`,
SDK test binary `5ea11a61856b4950bc3359ff1eb3315c68f0e0a45d3580e5e0b9fbe05977a9fd`,
EOF-produced source `d1c800f8d652d3aa5c9faedb53bf204db867f6a2fc174384babb675818bcd2f2`.
Reuse unchanged Windows proof; raw Windows evidence is not yet available on Mac.

Ignored `mac-corrected-qualification/entry-state.json` records fresh refs/status;
`superseded-mac-bytes/` preserves all 138 earlier input bytes and original status/
ledger/manifests, with copy hashes checked. `entry-evidence-sha256.json` indexes all
23 original foundation evidence files, including failures and retained Mac executable.
The original executable hash remains
`d990ac7b5ee63ea4436ff27ef5588fa1ee7b49a916751966af1fad7b1bac14b7`.
No original evidence was overwritten. Existing native Mac desktop surfaces are
agent-accessible; pinned Node 24.19.0/npm 11.9.0/Rust 1.90.0, command-line build tools
and caches exist. Official archive SHA-256 reverified as
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`.
Fetched probe JS syntax and Python runner AST pass inspection. The real extended
probe and non-SDK EOF fixture preflight remain pending on transferred working inputs.

**Actual blocker:** no direct Windows file-transfer tool, mounted share or SSH
configuration is available here; local resolution of `SUNDOWN`/`SUNDOWN.local`
returned no address. Capability discovery found no suitable existing transfer
connector. Requested an existing direct route or explicit authorization to coordinate
with Windows task “Qualify Nested Source Foundation”; no route/authorization received
at this checkpoint. No task message or infrastructure installation was attempted.
Both required archives remain untransferred, their hashes and `evidence-sha256.json`
unverified locally. Expected archive hashes remain inputs
`acb1fe181f7d18c675ee6db628beadc7be2eb6b3784f65286889fa81d24512b2` and Windows evidence
`1fdee686254e6596edf2c9487cdaaf71acfc383f918a91f9a55bcbda89f47120`.

`allowance.json` records the new unused Mac one-build/one-native/one-SDK allowance,
1,200/300/600-second hard caps and zero retries. Exact build is
`npm exec -- tauri build --no-bundle -- --locked`; native runner selects ONLY
`source-foundation`; SDK is ONLY
`cargo test -p loomlight-core --locked renpy::tests::source_foundation::source_foundation_bool_sdk_gate -- --ignored --exact --nocapture`.
No expensive dispatch or one-dispatch marker exists. Cumulative counts stay
**Windows 2/2/3; Mac 2/2/2**. Mac corrected qualification and two-target qualification
remain incomplete/not accepted. Continue in this chat after transfer access exists:
verify/extract both archives into fresh staging, audit evidence members, reconcile
all 139 exact frozen inputs with backups, then cheap preflights and the three single
dispatches with exclusive markers and caps. Stop/reassess failure or ambiguity;
no automatic renewal. New status/evidence is local-only; no publication authorized.


**GitHub Actions alternative investigated — 2026-10-07:** user asked to coordinate
with Actions again. Read-only GitHub API checks confirm zero runs on the corrected
branch, zero existing self-hosted runners, and no matching foundation/corrected/transfer
artifact among all 21 repository artifacts. Existing production workflow selects
both targets and broad gates with CI tool/dependency setup; it was not dispatched.
A targeted hosted Mac-only workflow could produce the remaining Mac evidence while
reusing Windows proof, but changes the original-Mac/existing-tools requirements and
needs a published workflow/pinned CI setup. Asked for that explicit scope decision;
no workflow or expensive allowance has been dispatched. Actions does not automatically
access either existing Windows archive, which remains a separate transfer prerequisite
unless the user explicitly changes that requirement. Assessment is retained in ignored
`mac-corrected-qualification/actions-access-assessment.json`. Cumulative Windows/Mac
counts remain 2/2/3 and 2/2/2; all new Mac allowances remain unused.


**Hosted Mac-only Actions selection approved — 2026-10-07:** after the agent explained
that Actions changes the original Mac/existing-tools execution boundary and requires
pinned CI setup plus workflow publication, the user answered “Yes approved”. This
selects ONE Mac-only Actions run consuming the existing unused Mac build/native/SDK
allowance, with unchanged 1,200/300/600-second caps and zero retries. It does not
renew budgets, repeat Windows qualification, select a full matrix, authorize merge/
release or waive direct raw Windows evidence transfer/member verification.

All three earlier local status/ledger edits were copied byte-exactly with a binary
Git patch, then preserved in a named Git stash before fast-forwarding the original
Mac checkout from `45c64c5` to published corrected checkpoint
`a49e536163d5cea2e220894f97f780f4bd301668`. The preserved Mac continuation is
reconciled above alongside the complete newer Windows ledger. Original Mac evidence
index still matches all 23 files; historical planning worktree remains untouched.
All 139 actual Mac working inputs now match final digest
`be497aadca699904efa29f84a8c19485a86b39741bdfb9d15bc32e9e5099c939`.
No frozen app/test/probe input was modified; the new runner is outside those inputs.

The existing `quality.yml` workflow (GitHub workflow ID **354880113**) gains isolated
manual input `source_foundation_macos=true`. Other manual inputs must be false;
all existing matrix/diagnostic/validator jobs skip for this mode. Only one `macos-26`
ARM64 job runs. Reusing an existing workflow avoids changing main merely to register
a new dispatchable workflow. Pinned action revisions and existing cache/tool/SDK
setup conventions are retained; official archive checksum is rechecked. New
`scripts/qualify-source-foundation-macos.py` wraps existing focused preflights,
no-bundle build, native runner and exact SDK gate. It records exclusive dispatch
markers/commands/caps before each operation, refuses run/job attempt >1, verifies
frozen inputs before/after, kills owned processes at hard caps, retains exact inputs/
executable/test binary/native profile/EOF source/owners/full logs, strictly audits
33 native checks and six actual SDK assertions per route plus wrong-outcome rejection,
and indexes terminal evidence for upload even on failure. Finishing retains scratch
before contained cleanup. The 70-minute job ceiling includes setup/cheap compilation/
retention; expensive operation caps remain 20/5/10 minutes.

Local cheap preparation PASS: eight focused core tests including the exact non-SDK
EOF fixture (one SDK wrapper deliberately ignored), three affected renderer tests,
TypeScript/typecheck, Python AST, Actions lint, whitespace and frozen 139-input audit.
Audit rejects the original eleven-check native green result, zero-assertion SDK result
and a wrong-outcome result with its success marker; historical SDK output validates
the parser only, not these final target inputs. Unchanged wider proof is reused.
Initial local core preflight was run from repository root and failed before tests
(no Cargo.toml); corrected `app/` cwd passes, both logs retained. Initial workflow
lint caught runner context in job env; moved the paths into step env/GITHUB_ENV.
No expensive dispatch occurred during these cheap corrections.

Fresh remote refs are source branch `a49e536`, main `aba200f`; existing quality
workflow is active. Publish this coherent workflow/helper/status checkpoint on the
same source branch without force, verify its exact SHA and frozen blobs, then make
ONE dispatch of workflow 354880113 at that branch with only the Mac input true.
Capture its confirmed run/attempt/exact tested SHA and continuation before the
manual same-thread wait. No status polling or automatic retry. Current cumulative
counts remain Windows **2/2/3**, Mac **2/2/2** until per-operation dispatch evidence;
the unused Mac allowance is reserved for this one run and may not be spent locally
or by another executor. Frozen inputs and prior failures remain unchanged.

Raw Windows archive transfer is still unresolved, with expected input/evidence ZIP
hashes `acb1fe181f7d18c675ee6db628beadc7be2eb6b3784f65286889fa81d24512b2` /
`1fdee686254e6596edf2c9487cdaaf71acfc383f918a91f9a55bcbda89f47120`.
Hosted Actions cannot read files held only on Windows. Approval of the hosted Mac
proof does not claim those archives arrived or waive their member audit. Even a
passing Mac job requires evidence download/hash/count/cleanup audit; overall requested
qualification/acceptance remains incomplete while the raw Windows evidence gap remains.


**Mac-only Actions dispatch confirmed / manual same-thread wait — 2026-10-07:**
Published/verified workflow checkpoint
`878de2a8b30e1ce0e3adf36fdba2859056bb4b86` on `codex/nested-source-foundation`.
All 139 committed input blobs still match final digest
`be497aadca699904efa29f84a8c19485a86b39741bdfb9d15bc32e9e5099c939`.
Fresh pre-dispatch query confirmed zero runs at that SHA. Local exclusive
`actions-one-dispatch.json` was written before ONE REST dispatch request to existing
workflow 354880113, with `source_foundation_macos=true` and all three other inputs
false. GitHub's response confirmed run ID; no ambiguous or duplicate request/retry.

Confirmed [run 37580108751/1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37580108751),
workflow 354880113, exact tested SHA `878de2a8b30e1ce0e3adf36fdba2859056bb4b86`,
branch `codex/nested-source-foundation`. One required post-dispatch snapshot at
**2026-10-07 06:11:26 UTC** records **in_progress**, conclusion null, Mac job
**112657582469** in progress. Validate, historical macOS browser diagnostic and
Phase 1G matrix jobs are all skipped as intended; no Windows execution. No subsequent
model polling. Full API/dispatch/request/job/receipt evidence is retained locally in
ignored `mac-corrected-qualification/`.

One workflow dispatch is consumed. The existing one-build/one-native/one-SDK Mac
allowance is exclusively reserved to this run, with original hard caps 20/5/10
minutes and zero retries. Prior cumulative Windows **2/2/3**, Mac **2/2/2**;
per-operation dispatch markers/results from the artifact must determine exact updated
Mac counts. A workflow request is not a claim that all three commands have executed.
No local expensive execution or second executor is selected. Preserve any skipped,
failed/cancelled/partial result and do not renew the allowance automatically.

State is **awaiting_ci**, not completed/accepted. Stop model polling and resume this
same chat on the user's command. Then inspect this recorded run/attempt and relevant
ref/worktree changes once. If still pending, wait again without a loop. If terminal,
download `source-foundation-macos-37580108751-1` before its seven-day expiry, verify
its evidence index/all 139 exact input copies, SHA/run identities, ARM64 release/test
binaries, one terminal report/all 33 exact checks/extension-complete/external writer,
EOF-before/produced source/owner arrays, true/false six actual assertions each and
real rejecting wrong-outcome/cleanup/counts. Continue only remaining authorized audit;
resume is not permission for retry, another run, source correction, merge or release.
Raw Windows input/evidence ZIP transfer/member verification remains a separate
unresolved gap; do not declare requested two-target qualification or acceptance complete.
No autonomous Goal is active in this chat and no runtime-pause control is claimed.


**Mac-only Actions failure audit and explicitly authorized setup correction — 2026-10-07:**
The user resumed run 37580108751 and then explicitly instructed: “You can find and
fix the issues, then run another dispatch.” This authorizes ONE additional Mac-only
workflow dispatch after the concrete correction; no automatic renewal, full matrix,
Windows execution or app-input change. The original per-operation allowance remains
entirely unused and is reassigned exclusively to that additional run, caps
**1,200/300/600 seconds** for one release no-bundle build/native launch/exact SDK gate.

Audited [37580108751/1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37580108751),
workflow 354880113, Mac job 112657582469, exact tested SHA
`878de2a8b30e1ce0e3adf36fdba2859056bb4b86`; terminal **failure** at
2026-10-07 06:11:33 UTC. Checkout/frozen-input guard, Node/npm install, pinned Rust
selection and cached SDK retrieval passed. Cheap-preflight failed at the helper's
`rustc --version` assertion: that subprocess used repository-root cwd, outside
`app/rust-toolchain.toml`. Runner cache output confirms Rust 1.90.0 ARM64 was present;
Rust selection from `app/` succeeded. This is qualification setup failure, not an
application or source-foundation failure. Core preflight, release build, native launch
and SDK gate never dispatched. Existing validator/matrix/diagnostic jobs all skipped;
no Windows execution.

Downloaded artifact **11464785180**, `source-foundation-macos-37580108751-1`, 588 bytes,
SHA-256 `9a90b0c9ea231bb368aa31a42fb2c0875c69cd665b9ee51d4f29a7a4baca5d84` matches
GitHub digest. Staged extraction passed entry containment/link checks. Its only evidence
member `terminal.json` hashes to
`ac489e4ee8dc952b0669bce5cf91e08375a57f13b61e95b8700d8482428e379d`, exactly matching
`evidence-sha256.json`. Terminal records qualification false, new dispatches **0/0/0**,
cumulative Mac **2/2/2**, scratchRemoved true and twoTargetAcceptance false. Full logs
ZIP SHA-256 `04f574fa4450cecce7cfe53da1be87c015e691b9e0e1d010e85193ae905db263`;
full job/artifact API records, ZIPs, safely staged extracted logs and `audit.json` are
preserved locally under ignored
`mac-corrected-qualification/actions-audit-37580108751-1/`. No binary/native/SDK
acceptance evidence exists for this failed attempt. Windows cumulative remains **2/2/3**.
Workflow dispatches consumed **one**; the next approved request is the **second** total.

Correction is limited to `scripts/qualify-source-foundation-macos.py`: all pinned tool
inspection subprocesses now use `cwd=ROOT / "app"`, matching every existing bounded
build/test subprocess and the workflow's Rust selection step. Before assertions the
helper retains/prints exact Node/npm/Rust/Cargo/Rustup versions. Assertions still require
Node 24.19.0, npm 11.9.0, Rust/Cargo 1.90.0 and ARM64 Rustup. No version fallback or
weakened gate. Existing local pinned tools pass the corrected inspection; with
RUSTUP_TOOLCHAIN removed, the existing Rustup independently resolves the pinned app TOML
and reports 1.90.0 ARM64. Python syntax, frozen-input audit and all **23** original
Mac evidence hashes pass; all **139** app/test/probe hashes still match final digest
`be497aadca699904efa29f84a8c19485a86b39741bdfb9d15bc32e9e5099c939`.
Unchanged eight-test core/EOF, three-test renderer and rejecting audit proof is reused.
Repository validator PASS (364 files), Actions lint PASS and whitespace PASS.

Publish the coherent correction/failure record to the same branch, verify exact published
SHA and zero existing runs at that SHA, record exclusive second-dispatch marker/request/
allowance before one workflow 354880113 request with ONLY source_foundation_macos true.
Use a NEW run/attempt 1, preserving failed run 37580108751/1; do not rerun that attempt.
Capture confirmed identity and pause manually in this same chat. Audit its actual
operation markers/results after user resume. Remaining raw Windows ZIP transfer/member
verification is still unresolved and no two-target qualification/acceptance is claimed.


**Corrected Mac-only additional dispatch confirmed / manual wait — 2026-10-07:**
Published correction checkpoint **`1ac80686bb96acda20fb56ecdc518a68a91b1809`** verified
against fresh remote source ref. Every one of 139 committed input blobs matches final
digest `be497aadca699904efa29f84a8c19485a86b39741bdfb9d15bc32e9e5099c939`.
Fresh query found zero workflow 354880113 runs at this SHA. Before ONE request, exclusive
`actions-second-dispatch/one-request-marker.json` and `published-selection.json` record
user approval, exact input SHA/digest/commands, unused allowance/caps, cumulative counts,
workflow dispatch ordinal **2** and zero further retries. Request uses ONLY
source_foundation_macos true, all three other inputs false. Successful request returned
no body; ONE follow-up candidate query confirmed exactly one matching new run, without
repeating dispatch. Failed run 37580108751/1 and original Mac failures remain preserved.

Confirmed [run **37581016311/1**](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37581016311),
workflow **354880113**, branch `codex/nested-source-foundation`, exact tested SHA
`1ac80686bb96acda20fb56ecdc518a68a91b1809`, Mac job **112660446339**.
Run snapshot **2026-10-07 06:21:14 UTC**, job snapshot **06:21:24 UTC**: **in_progress**,
conclusion null. Existing matrix, repository validator and macOS browser diagnostic
jobs completed/skipped; Windows is not executed. Artifact expected
`source-foundation-macos-37581016311-1`, seven-day retention. Full request/stdout/stderr/
run/job/selection/marker/receipt evidence is locally retained under ignored
`mac-corrected-qualification/actions-second-dispatch/`.

Two workflow dispatches consumed; per-operation cumulative remains Windows **2/2/3**,
Mac **2/2/2** until actual new markers are audited. Existing unused Mac **one/one/one**
build/native/SDK allowance is exclusively assigned to this run, caps **20/5/10 minutes**.
No duplicate request, future automatic retry, local execution or second executor.
The commit carrying this continuation is a later status-only successor with unchanged
workflow/helper/app inputs. State **awaiting_ci**, qualification/acceptance incomplete.
Stop model polling; resume this same chat with “Resume and audit run 37581016311.”
Then inspect the recorded run/attempt once, download and strictly audit required evidence
if terminal, or wait again if pending. Preserve any failure, count actual dispatches
regardless of outcome, and reassess without another execution. Raw original Windows
archive transfer/member audit remains unresolved and is not waived. No autonomous Goal
or verified runtime-pause control is claimed.


**Corrected Mac ARM64 terminal evidence audit — 2026-10-07:**
User resumed only recorded [run **37581016311/1**](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37581016311).
Workflow **354880113**, Mac job **112660446339**, branch `codex/nested-source-foundation`,
exact tested SHA **`1ac80686bb96acda20fb56ecdc518a68a91b1809`** match the pre-dispatch
selection. Run terminal **success** at **2026-10-07 06:32:11 UTC**. Only Mac job ran;
all three historical validator/matrix/browser diagnostic jobs skipped. No Windows
execution, duplicate request or retry. Fresh local/remote source checkpoint `3ec9105`
was unchanged and clean on resume; historical planning worktree remains untouched.

Downloaded artifact **11464029580**, `source-foundation-macos-37581016311-1`,
**14,546,223 bytes**, SHA-256
`879dea0bd7df572b08f28ca09a240589075f9813ba95991f8263905a1982b830`, matching GitHub
metadata/digest, run/branch/tested SHA and unexpired retention (2026-10-14 06:31:12 UTC).
Archive entries passed relative containment, duplicate and unsupported-link checks
before staged extraction. All **905** indexed retained files match their SHA-256,
with no extra/missing files. Evidence-index hash
`207bb447ba9d469b5eef0539338708df1c51212e706539018317237228be24cc`.
Full workflow logs ZIP SHA-256
`b2e310c9d861d0f879bba4cdf55fc6a55300e5e0b50842be49d0a72178b5dd83`.
Raw API records, ZIPs, extracted artifact/logs and independent `audit.json` are retained
under ignored `mac-corrected-qualification/actions-audit-37581016311-1/`.
All **139** retained exact-input copies, current working files and exact tested commit
blobs independently match the portable final manifest and digest
**`be497aadca699904efa29f84a8c19485a86b39741bdfb9d15bc32e9e5099c939`**.
All **23** original Mac evidence files remain unchanged; earlier failures/superseded
bytes/named stash remain preserved. Frozen app/test/probe inputs were not modified.

Pinned Node **24.19.0**, npm **11.9.0**, Rust/Cargo **1.90.0**, Rustup ARM64 app-TOML
selection and host macOS **26.6.2 ARM64** are retained. Official SDK archive hash remains
`eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45`; prepare succeeded
only after exact archive verification. Cheap actual Mac core/EOF preflight **8 PASS,
1 deliberately ignored SDK wrapper**, 236 filtered out, 43.488s wrapper / 4.51s tests;
exact non-SDK EOF fixture executed and passed. Renderer **3 PASS**, typecheck, renderer
compilation and extended-probe syntax pass. Missing/ignored wrapper is not reused as
SDK evidence; the exact ignored SDK gate separately executed below.

Actual expensive dispatch markers were written before execution, each once, exact
commands matching recorded selection, retries 0; results show exit 0/no timeout:

| Mac operation | Exact selection | Duration / hard cap | Audited result |
| --- | --- | --- | --- |
| Release build | `npm exec -- tauri build --no-bundle -- --locked` from app | 295.604s / 1,200s | PASS; exact ARM64 executable retained |
| Native | Existing `run-runtime-ui-probes.py`, retained executable, ONLY `source-foundation` | 11.477s / 300s; runner 11.304s | PASS; all 33 exact checks, one terminal report |
| SDK | `cargo test -p loomlight-core --locked renpy::tests::source_foundation::source_foundation_bool_sdk_gate -- --ignored --exact --nocapture` from app | 194.514s / 600s; test 193.19s | PASS; 1 selected test, 0 ignored, 244 filtered out |

Retained release executable **13,960,704 bytes**, SHA-256
`ff70cec37e8de3357d2fd5aec5dd7466033dd29bc8c050e338532d962e37ddb8`;
actual SDK test executable SHA-256
`8170673ac4ad85f5463f3f25a8e2d64009b5992a3b86150c77657e999156bb5a`.
Both hashes and actual retained Mach-O ARM64 architecture independently verified.

Native raw log has exactly one external-ready checkpoint and one terminal packaged
source-foundation report. Ordered check list exactly equals all **33** final checks,
retaining the original eleven plus root move/drag and Otherwise/body-trivia insertion
refusals, safe edits outside group, stable child IDs/owners, EOF append/Undo/Redo/reopen,
exact retained Story/Source drafts, and normal shell close/reopen after external refusal.
`extendedChecksComplete=true`, stage complete, externalErrors empty, cleanupComplete
true. Runner-owned external write verified from retained final source: stripping exactly
`# ordinary external writer` and newline reproduces before hash
`9f883355125a6b76bbdae0d2c625c2cbfa97564a5d2ff7f7036c781987aa623d`; final hash is
`292848afe1e4f7501209df1e73261057fc524a765df4da9056e1691c94465722`.
One external-written marker is retained. Contained native profile was retained then
removed; no live scratch/profile remains in artifact; terminal scratchRemoved true.

SDK raw cases independently audited, not merely its green Rust wrapper. **true/false**
each exit **0**, Status PASSED, route marker present and **six actual assertions, six
passed, zero failed/xfailed/xpassed**. **wrong-outcome** exit **1**, Status FAILED and
real AssertionError, with **two assertions / one passed / one failed**, no
`SOURCE_FOUNDATION_ROUTE wrong-outcome` success marker. Frozen test code invokes the
real corrected EOF root-append action, writes its accepted result, then asserts unchanged
scene bytes after every SDK case; actual route assertions reach Foundation continuation
and verify the opaque Python neighbor. EOF-before is unterminated; produced bytes are
exactly before plus CRLF + indented continuation + CRLF. Two distinct children retain
identical before/after IDs, one group and distinct branches. Retained source/owner hashes:

- EOF before: `31f4fc121e308a5fb1735c126837bc9a957447afbd25b5d089c520af1e1b4347`
- EOF produced: `c0fa5ab8035c3c1a84924952e8e4ad03268208c2135b063c6400a1295c2b9a8c`
- EOF owners: `edc9bf7a465f632ca60b2e04776c6ff55d7b9945bfbdde350d164244772c68bd`

Mac generated fixture hash differs from the recorded Windows hash. Fresh projects
generate per-instance technical scene labels/identities, so produced-source hashes are
per-instance evidence. Mac bytes are retained/audited; a byte-for-byte comparison with
raw Windows source is unavailable until transfer. Frozen input hashes remain identical. SDK terminal reports exactly one
PASS/cleanup true; exact Rust test passes only after its contained temporary tree is
removed. Native and SDK cleanup plus outer scratch retention/removal all pass.

**Both target results/counts:** final-input Mac ARM64 gates **PASS, raw evidence audited**;
Windows x64 previously recorded **PASS**, reused unchanged (build55.078s, native33
13.312s, SDK108.359s; true/false six assertions each and wrong-outcome exit1/FAILED).
Windows release/test/EOF hashes remain respectively
`f6d0d2be4535759549bf66d4fa5daeb7993fcb1a417b758db7ddccfb3dbd4be2`,
`5ea11a61856b4950bc3359ff1eb3315c68f0e0a45d3580e5e0b9fbe05977a9fd`,
`d1c800f8d652d3aa5c9faedb53bf204db867f6a2fc174384babb675818bcd2f2`.
Count each new dispatch: Mac now **3 builds / 3 native launches / 3 SDK gates**;
Windows remains **2/2/3**. Both workflow dispatches consumed; first setup failure
37580108751/1 added **0/0/0**, second added **1/1/1**. Remaining Mac expensive allowance
**0/0/0**; no further dispatch/retry/installation or second executor is authorized.

**Remaining blocker:** original Windows corrected input/evidence ZIPs still have not
been directly transferred or member-verified on Mac. Expected archive hashes remain
`acb1fe181f7d18c675ee6db628beadc7be2eb6b3784f65286889fa81d24512b2` and
`1fdee686254e6596edf2c9487cdaaf71acfc383f918a91f9a55bcbda89f47120`.
The published 139-input receipt/committed blobs are not the missing raw transfer.
Hosted Mac approval did not waive that requirement. Therefore the requested overall
two-target qualification/acceptance is **INCOMPLETE**, despite passing Mac execution.
No pending CI operation remains. Next work is direct archive access/transfer/hash/member
audit without any new qualification execution; no merge/release/provider/following work.


**User removes optional cross-machine transfer / qualified checkpoint complete — 2026-10-07:**
After confirming Windows was already verified by its original agent, the user asked
whether transferring its raw archives had a practical benefit and explained that the
requirement came from an agent-generated prompt. The owner explained its archival/
independent-audit benefit and recommended removing it as an acceptance blocker. The
user explicitly agreed: “excellent, lets forgot about that then. Whats the next goal
and prompt?” This supersedes the earlier transfer prerequisite. It does not claim the
ZIPs were copied or their members independently re-audited on Mac. Original Windows
raw evidence remains preserved on Windows; that agent's verified result and portable
final-input receipt are reused unchanged. Optional archive consolidation can remain
housekeeping, with no new execution or evidence-transfer task selected.

**Result:** corrected bounded source-foundation two-target qualification **COMPLETE**;
accepted as the section 21 checkpoint, ready for integration. All139 final-input hashes
match digest `be497aadca699904efa29f84a8c19485a86b39741bdfb9d15bc32e9e5099c939`.
Windows PASS at `a49e536` and independently audited Mac PASS at run37581016311/1,
exact tested `1ac80686bb96acda20fb56ecdc518a68a91b1809`, retain all33 native checks,
actual six-assertion true/false SDK routes, rejecting wrong-outcome and cleanup evidence.
All original/superseded failures remain. Cumulative build/native/SDK Windows **2/2/3**,
Mac **3/3/3**; remaining expensive allowance **0/0/0**. No retry/build/native/SDK,
provider/AI, merge or release occurred in this documentation closure.

**Next proposed goal, not started:** review and integrate the qualified source branch
into main through a PR, preserving exact139 qualified app/test/probe hashes and reusing
recorded independent source review/target evidence. Fresh Git confirms source branch
`4de9939`, main `aba200f`, no existing source-branch PR. Inspect the final diff and
current policy, create/reuse PR, require normal lightweight quality checks, merge only
if review/checks pass, verify main's qualified input equivalence, close the bounded
ledger/status and return the **2A.0 provider qualification** prompt. This prompt only
selects the integration outcome when the user uses it; no merge is authorized by asking
for a next prompt. No fresh independent review mandate is introduced; review actual
remaining delta against the already recorded source review.

Current workflow audit: `production-scaffold.yml` is **manual-only**, despite older
TESTING wording describing production main-push execution. `quality.yml` executes
lightweight validator/Q1 rejection/retention/selector gates on PR/main; expensive
source-foundation/profile/diagnostic jobs require explicit manual inputs. Therefore
proposed integration can use normal PR/main checks with **zero** new release/native/SDK
or manual workflow dispatches. Recheck actual workflows/policy at integration entry;
never bypass required checks or silently start a duplicate matrix. This documentation
closure corrects the stale TESTING cadence sentence to match the executable workflow.
Canonical scope/ADR status are reconciled now; provider feasibility/credentials/request
implementation remains unstarted and is a distinct next goal after integration.

Closure verification: repository structure/text/privacy/link validator PASS (364 files),
whitespace PASS, documentation-only scope review PASS; all139 frozen inputs and original23
Mac evidence files remain unchanged. No application or qualification command rerun.


**Review/integration selected and completed — 2026-10-07:** user explicitly selected
review of the qualified final delta, PR creation/reuse, lightweight PR/main quality,
merge, exact 139-input main verification and closure. This supersedes earlier no-PR/
merge boundaries for this bounded integration only. One owner/no helper or provider
work. Fresh main `aba200f` and source head `809653b` were unchanged; local work,
historical planning checkout, stash and all original evidence remain preserved.

Final delta agrees with the recorded independent source review: child-owner/minimal
patch, root movement/insertion boundary guards and anchored EOF separator/identity
correction remain intact. Qualification additions strengthen native/SDK evidence;
post-`a49e536` changes are orchestration/documentation only, with all 139 qualified blobs
unchanged. No new actionable in-scope defect found. Lightweight local validator,
Q1 rejecting-gate controls, nine package-retention tests, selector/workflow audit and
whitespace pass. [PR19](https://github.com/Caldwell-41/Renpy-editor/pull/19) merged
passing reviewed head at `40786404175f3d3f35c6cafd0aa718149f34c647`; PR/main quality
37585772522/1 and 37585868535/1 pass. Whole merge tree equals PR head and every qualified
input hash/digest matches. Original 23 Mac files and 905 corrected artifact members
independently rehashed unchanged. Cumulative Windows 2/2/3, Mac 3/3/3 unchanged; zero
new expensive operations/manual dispatches. No release or provider request.

The [archived bounded integration closure](../archive/2026-10-07-source-foundation-integration.md)
owns exact integration/audit evidence. ADR 0012, ROADMAP, TESTING and live status now
record integration. This overall Phase2 plan and section 23's unique source/proof/failure
history remain active because Phase2 is unfinished. The portable qualification receipt
retains historical pre-Mac fields; they grant no current allowance. Next proposed
outcome is 2A.0 synthetic Studio/generic qualification/contracts, returning for its
existing review before production integration; it has not started.

## 24. Selected review corrections — 2026-10-07

The user requested the Phase 2/3 plan review remain read-only; the review's initial
record additions were fully removed and the working tree verified clean. The user
then explicitly selected findings 1 and 2 for correction. This outcome updates plans
and canonical architecture only: literal generated display text/protected existing
tokens before applicable AI rewrites, and conservative screen-effect uncertainty and
launch refusal in 3D. The user subsequently accepted the recommended visual connection
for finding 3: typed Show/Hide/Call screen Beats with a bounded finish/dismiss path.
Phase 3 section 4/3B.2a owns the parameterless owned-screen contract and normal-play
proof; UI and the deliverable queue are aligned. This is selected future scope, not
authorization to start screen implementation ahead of its prerequisites.

Phase 2 section 7 and 2C.1 own the text contract, harmless interpolation/tag fixtures,
token preservation/refusal and literal-display proof. Phase 3 sections 4/6 own screen
effect summaries, relevant read revisions, uncertainty/refusal, passive/conventional
eligibility and invalidation checks. Full screen-interaction recording/replay remains
deferred. Architecture and the component/deliverable maps are aligned. These refine
existing operation/state guarantees without changing manual source or implementing
provider, planner, screen or state services.

Baseline: local `5f448ca`, `codex/nested-source-foundation`; initial working tree clean.
Existing source qualification, historical planning worktree, recovery/evidence and
budgets remain unchanged. No build/native/SDK/provider/CI execution, commit, push or
merge is selected. The five-document correction is local-only; 2A.0 remains the next
proposed outcome with its existing selection and review boundary. Repository validation
passed for 365 files; whitespace and scope/contract self-review passed. The user requested
a next-work prompt; it selects bounded 2A.0 qualification when submitted, preserving
these local plan changes and the existing provider-access/review boundary.

## 25. Provider qualification ledger — 2026-10-07

### Selected outcome, baseline and ownership

The user submitted the bounded **2A.0 qualification/contracts** instruction, selecting
synthetic Studio and one representative generic endpoint, at most 40 live HTTP
requests/20 generation attempts/30 live minutes, no automatic retries, builds,
SDK execution, CI dispatch, push, merge, release, project sends or 2A.1/2A.2 work.
One owner; no helpers or other writers. No Codex Goal lifecycle was created.
State: `in_progress` after authenticated discovery and the user's continuation;
remaining native key entry/probes are pending. This repository state is not a runtime
Goal pause. Initial missing-access checkpoints remain recorded below.
That entry state is historical. The current Studio review disposition is in
[Studio qualification contract review](#studio-qualification-contract-review--2026-10-08);
no native entry/probe is pending, generic remains deferred and full acceptance is incomplete.

Fresh fetch/remote-ref and PR inspection found accepted main and source checkout at
`5f448ca683a905f4ea77d4580bbc89fda69f2b93`. PR19 is merged; no qualification
branch/PR existed. Open PRs 10/11 (dependency updates) and abandoned 12 are unrelated.
Created local `codex/provider-qualification` in the existing checkout with all five
accepted modified documents carried intact. No new worktree, reset, stash mutation,
branch deletion or remote write. Historical planning worktree at `2c5a164` and source
branch/recovery material remain preserved. The first sandbox fetch/PR reads failed
on `.git` write/network restrictions; approved elevated read/ref refresh succeeded.
These are setup failures, not provider failures or allowance consumption.

Accepted-input SHA-256 before additions:

| File | SHA-256 |
| --- | --- |
| ARCHITECTURE | `9ab6c11fe9a35feec994b5709f6f0fb6226ad16d6eba52c9dd813d34c5d8cbb7` |
| UI | `3d7783d5583dcbe9b3e56b6813d1c310e260f65910d6a696c51aa3735a969e7a` |
| HANDOVER | `9c6cefdc1fdd9b0c5b32858f01611c319f024b34211afa2b21afb14eebd69e75` |
| Phase 2 | `ba843c107157b0d91be36eee6b567f7ad5d2aa394466fb7c496d3fcadbcdc3e3` |
| Phase 3 | `6d9c263cb2a28299430e37217bf370ab25adfe1a7b16bc8ccb330a47066b9810` |

Full original five-file bytes and patch were additionally preserved in a temporary
local safety copy; no private/absolute host path enters committed documentation.
Section 24 owns accepted generated-text/screen plan corrections. HANDOVER will replace
superseded continuation wording while retaining its decisions/recovery references.

### Configuration and explicit access prerequisite

**User setup update:** approved local Studio `http://192.168.1.13:8888` and the
requested synthetic tests, with no Studio paid limit; requested generation deadline
120 s. The representative generic-compatible endpoint is **deferred by the user**,
not passed. Studio requires an API key; user asked how to supply it or suggested
temporary keyless access. Preserve the authenticated Studio contract: use a native
macOS hidden-input dialog, keep the key only in the isolated probe process memory,
and never write it to chat, logs, config, files or subprocess arguments/environment.
Disclosed that LAN HTTP transports key/content unencrypted. No production credential
store or keyless Studio acceptance is implemented. Version/loaded model/context and
server tool policy were requested; discovery may precede their generation confirmation.

| Configuration | Studio | Representative generic |
| --- | --- | --- |
| Address/origin/proxy/tunnel | approved `http://192.168.1.13:8888/v1`; direct LAN HTTP | deferred by user |
| Installed version/backend | unknown | unknown |
| Exact loaded model/quantization | user supplied `unsloth/gemma-4-12B-it-qat-GGUF`; loaded state/returned API ID/quantization pending discovery | user-deferred |
| Authentication and credential source | Bearer required; source unavailable | mode/source unknown |
| Effective loaded context/output mapping | unknown; `max_tokens` documentation candidate | unknown |
| Permitted synthetic usage/cost | synthetic plan approved; no paid limit | deferred; no calls authorized |

Asked for URLs without secrets, version/model/configuration, auth mode, credential
environment-variable name or host-local file path only, allowed probes and paid limit.
Never requested key values. No environment enumeration, credential database/console
scraping, port scan, provider launch/install, download or endpoint request occurred.
User must make an existing model/endpoint available; agents perform the actual
qualification after explicit setup rather than transferring tests to the user.

`spikes/provider-qualification/live_studio.py` is the manually commanded Studio-only
runner. It opens native hidden key entry, then waits for explicit probe commands.
It counts/reserves attempts before connect, has no redirect/proxy/retry, caps bytes/
total deadlines, discards error bodies and closes/joins its owned worker on cancel.
Receipt file is ignored local evidence; only fixed categories, allowlisted metadata
and reviewed synthetic results are retained. The runner will not generate until
loaded-model and tools-disabled confirmation is recorded. No key is entered/read yet
at this record update, and no HTTP has been sent. This is a probe, not 2A.2 production.

Current Studio-only selection is **14 HTTP/10 generation attempts** maximum; the
original two-provider input plan remains preserved, but generic probes are not selected.
The original 40/20/1800 hard allowance is unchanged. Native key entry was started in
PTY session **52580**; at the last observation it was awaiting input and produced no
credential-ready status. No probe command was sent. The hidden dialog times out after
300 s with no credential persistence. No secret value is available to the assistant.
After waiting for native entry, no credential-ready status or setup response was
received. The owner interrupted and closed session 52580 before the external wait;
no probe command, HTTP request or credential persistence occurred. Reopen the current
reviewed runner only when the user is ready for entry. No provider failure is inferred
from incomplete credential setup. Generic remains user-deferred, not live-qualified.

**Same-thread continuation:** user supplied model
`unsloth/gemma-4-12B-it-qat-GGUF`. Relevant remote main/source refs still equal
`5f448ca`; the qualification branch remains local at that baseline with all changes
intact, and worktree ownership is unchanged. Requested loaded-state/tool-policy and
optional version/context/quantization details. Reopen native session-key entry, then
send M01 discovery only when credential-ready status is observed. No generation
until the returned ID and loaded/tool-policy prerequisites are established. This
setup continuation grants no retries, generic calls or new allowance.

Native entry was reopened in session **42127**, still awaiting input at its first
observations; no credential-ready status or probe command. The supplied model's
[upstream card](https://huggingface.co/unsloth/gemma-4-12B-it-qat-GGUF) was read, not
downloaded. It documents thinking controls at the template/model layer, making
T01/T02 relevant candidates; this does not prove Studio's installed mapping or selected
quantization, loaded context, schema decoding or reasoning/final separation. Preserve
the `enable_thinking` Studio candidates and measure rather than injecting model-specific
control tokens into a reviewed payload or stripping reasoning heuristically.

Before the next external setup wait, queued exactly `M01` plus process exit in
session 42127. The command waits behind native key entry; after entry it can make
one approved discovery request (15 s total) and then exit/clear session-key ownership.
No generation is queued. Last receipt inspection: **0 recorded HTTP attempts /
0 generations**; reserve one possible HTTP slot for the queued M01 until session/
receipt evidence establishes completion or no-send exit. Do not requeue or open a
second runner on resume. Inspect session 42127 and ignored receipts first; a terminal
credential-entry timeout/cancellation with no receipt means no HTTP was attempted.
No credential-ready status or live result was observed before this record update.

### Planned probes and pre-send limits

[Probe plan](../../../spikes/provider-qualification/probe-plan.json) preserves exact
synthetic messages, schema resource, IDs, per-probe purposes and limits before any send.
[ADR 0013](../../adr/0013-provider-request-and-transport-contract.md) defines proposed
request/credential/transport behavior, distinct from measured provider capabilities.

Per provider: M01 configured discovery, A01 omitted auth, A02 synthetic invalid auth,
G01 literal structured rewrite, G02 protected-token structured rewrite, G03 disabled
tools, G04 eight-token truncation, E01 nonexistent synthetic model, E02 invalid
response-format type, S01 schema SSE, T01/T02 thinking off/on, C01 cancellation and
M02 post-cancel availability. All ten POST attempts count as generation, even errors.
Never use another installed/unloaded model for E01; model-management side effects
must not be induced. A01/A02 do not replace/remove the real credential.

Maximum planned: **28 HTTP / 20 generations** across two providers. Remaining twelve
HTTP slots are reserved for explicitly recorded necessary non-generation diagnostics,
not an automatic expansion; no generation reserve. Unsupported optional mappings,
no-auth A02 or tunnel SSE are recorded separately, not passes. No automatic retries,
format fallback, repaired generation or continuation. Discovery 15 s total; generation
**120 s total** (user increased from 60 s for local-model cold loading); connect 10 s
within total; SSE semantic idle 15 s after first generated content/reasoning, with
startup bounded by the total generation deadline; cancellation at 5 s; client cleanup
target 2 s. This does not authorize loading/switching models or extend the 30-minute
cumulative live-execution cap. Complete both providers' required baseline/error/limit/
cancel/cleanup probes before optional S01/T01/T02. All twenty generations at their
maximum deadlines would exceed the time cap: check actual remaining allowance before
each send and require its full deadline plus cleanup time to fit. Stop at the first
cap; pending probes remain incomplete. External setup waiting consumes no live time.

Before first send, record exact approved address/auth/model/configuration/context,
cost permission and capability-specific conditional selection. Initial plan requested
resident/server-wide tool confirmation; the later user-authorized inference continuation
and proportionate request-level gate reassessment are recorded below. Never fabricate
those unknown confirmations. Every Studio generation sets
`enable_tools=false`, `enabled_tools=[]`, no session/client tools. G03 uses harmless
prose; never request tool execution to challenge the server. Absence of returned tools
alone does not prove internal server suppression: record disabled configuration and
bounded provider-monitor evidence where available; otherwise mark that guarantee
unknown. No enabling tools, model loading/unloading or server restart for testing.

For each attempted send, persist a redacted receipt before/after the operation:
sequence/probe ID, synthetic input/body digest, configuration identity, attempt time,
HTTP/generation cumulative count, elapsed time, status/content type/byte counts,
finish/model/usage where available, validation/cleanup result and useful synthetic
response only after reviewing it for echoed credentials. Raw headers, key values,
server errors/exceptions and private paths never enter logs or repository artifacts.
Interrupted/ambiguous sends consume allowance and remain unknown; do not retry them.
Only the same outcome resumes after external waits; no polling or CI operation exists.

### Upstream investigation (not installed-version proof)

Official pages checked 2026-10-07: [API overview](https://unsloth.ai/docs/basics/api),
[HTTP guide](https://unsloth.ai/docs/integrations/connect-curl-and-http-to-unsloth),
[Python/schema guide](https://unsloth.ai/docs/integrations/connect-python-sdk-to-unsloth),
and [documentation index](https://unsloth.ai/docs/llms.txt). They document v1 discovery,
Chat Completions, schema responses, thinking/tool controls and tunnel non-streaming.
No stable public external HTTP load/unload contract was established in those pages.
The [official CLI source](https://github.com/unslothai/unsloth/blob/main/unsloth_cli/commands/studio.py)
contains internal lifecycle routing; that is not an adopted external management API.
[Upstream issue 10610](https://github.com/unslothai/unsloth/issues/10610) reports
residency/management differences and possible automatic loading; it is a caution,
not live Loomlight evidence. Do not equate the discovery catalogue with loaded-only
availability where version-specific metadata differs. Require user-confirmed loaded
model; leave load/unload user-managed. Investigate the selected generic provider's
public management docs once identified; no guessed routes or management calls.

[OpenAI Chat Completions reference](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)
was opened to check schema/output-limit wire fields. It does not select an OpenAI
endpoint, grant billing permission or qualify any compatible provider.

### Deterministic attempts and review

Isolated `spikes/provider-qualification` only; no `app/` edits/imports or native/Ren'Py
execution. First focused run: **27 tests, 26 pass/1 fail**, invalid bracket authority
`http://[bad]` was accepted by the reference normalizer on this Python runtime.
Classified as URL-validation defect; bounded correction requires bracketed authority
to parse as IPv6. No live attempt occurred. Corrected run: **27/27 pass**, no skips,
0.075 s. Self-review added dangling-port refusal and escaped unpaired-Unicode rejection,
and aligned the generation deadline/plan to the user's 120 s correction; final affected
run **27/27 pass**, no skips, 0.077 s. No second correction of the same failed hypothesis.

Host: macOS ARM64; system Python **3.9.6**, standard library only. Commands:
`python3 -m unittest discover -s spikes/provider-qualification/tests -v`,
`python3 scripts/validate.py`, `git diff --check`. Validation passed for **371 files**
with privacy/local-link checks and whitespace clean before final status edits; rerun
documentation validation after those edits. No native Loomlight/OS-key adapter, SDK,
GPU/provider launch or CI ran. Every-byte SSE splitting includes UTF-8 and CRLF, plus
malformed/unknown/tool/truncated frames. Cancellation/close fixtures are serial models,
not real concurrent worker/Save responsiveness or measured socket cleanup.

After Studio setup approval, six bounded live-runner fixtures were added: reservation/
single-attempt behavior, auth error body non-reflection, decoded credential-echo refusal,
loaded-model/tools confirmation, owned-worker cancellation and pre-connect time-cap
refusal. **33/33 pass**, no skips, 0.094 s, with network connections replaced by fake
connections. A semantic-progress callback now drives live SSE idle deadlines after
first generated content/reasoning; it does not extend the total deadline. No real
provider behavior is inferred. Repository validation passes **373 files**, whitespace
clean. An initial `py_compile` encountered the macOS Python cache outside writable
roots; subsequent checks explicitly use a temporary Python cache. This is a local
verification environment limitation, not a provider failure. No native app build ran.

Self-review checked selected corrections, request bounds, separate reasoning/final data,
model/tool/finish rejection, origin/address classes, proposal scope and no ambient
network path. ARCHITECTURE/UI/Phase 3 accepted input bytes were verified unchanged
before the new architecture cross-reference; Phase 2's accepted sections 7/24 are
retained. Credential lifecycle is a documented proposal, not an OS-store test claim.
Existing core `ureq` SDK download is synchronous with a 600 s timeout/no redirects;
cancellable generation reuse remains unproved for 2A.2, no dependency changed.

The proposed product resource bounds (including 2 s cleanup target) and credential
namespace/access attributes require 2A.0 review and later actual client evidence.
They are not claimed measured on this fixture. Public management research did not
establish a stable external Studio load/unload API; generic remains unselected.

### Live result matrix and remaining scope

| Capability | Studio | Generic |
| --- | --- | --- |
| Actual version/model/configuration | user-reported v0.1.902-beta; exact Gemma 12B ID; API loaded/UD-Q4_K_XL and context metadata 262144; full capacity/backend/sampling unmeasured | user-deferred; unqualified |
| Discovery/auth | PASS M01/M02/M03/M04; missing/invalid auth 401; M04 after actual cancel available | unknown; not attempted |
| Non-streaming structured response | PASS thinking-off/1024 G05 protected tokens and G06 harmless tools-disabled JSON; on/default truncation FAIL | unknown; not attempted |
| Tools disabled | explicit disable flags accepted, no returned tools, no client tools/session; global/internal suppression unknown | unknown; not attempted |
| SSE/thinking/output limits | off/1024 schema SSE PASS; default SSE truncated FAIL; on JSON 1024 unusable FAIL, on SSE unknown/not sent; 8-token cap/rejection PASS | unknown; not attempted |
| Errors/cancellation/client cleanup | invalid format 400; nonexistent-ID routing FAIL but identity guard PASS; actual JSON/SSE cancels and all 22 released workers PASS; server-stop unknown | unknown; not attempted |
| Public model-management contract | not established; user-managed baseline | unknown pending provider selection |

**Current consumed allowance: 22/40 HTTP, 16/20 generation attempts.** HTTP durations
sum 67.767 s; conservative cumulative closed-window charge **1457/1800 s**. Remaining
**18 HTTP/4 generations/343 s**, no pending operation. Three of five authorized extra
probes used; two remain contingent, no inferred added time. Studio scope/contracts
ready for review; full two-provider 2A.0 acceptance incomplete with generic deferred.
No production integration permission; 2A.1/2A.2/screens remain unstarted.

**Explicit dialog reopen:** user requested the API-key dialog. Session 42127
was no longer available; receipt inspection confirmed 0 HTTP/0 generations, so the
previous queued M01 did not send. Opened native entry in session **61665** and
queued only M01+exit under the existing approval. No generation queued. Check that
owned session/receipts on resume before any further runner or send. This is credential
setup continuation, not a retry of an HTTP attempt or a new allowance.

### Authenticated discovery and user continuation

User entered the key in native UI and instructed continuation of the initial outcome.
Session 61665 performed **M01: HTTP 200**, JSON, 607 bytes, 0.234 s, owned worker
released. Returned IDs include exact selected
`unsloth/gemma-4-12B-it-qat-GGUF` plus two other catalogue IDs; no other model is selected
or invoked. Receipt is in ignored local `studio-receipts.json`; M01 will not be repeated.
**Consumed: 1/40 HTTP, 0/20 generations, 0.234/1800 live seconds.** Its queued exit
released the memory-only key. One further native entry is required for the remaining
probe session; keep that session through the finite probes, then close it.

Reassessment of a self-imposed probe gate: no evidence establishes Studio's server-wide
tool policy or loaded/resident state. User explicitly selected this model and approved
synthetic generations, including cold-loading deadline accommodation; discovery confirms
its exact API ID. Do not falsely set `loaded_confirmed` or `tools_disabled_confirmed`.
Instead the runner binds generation to the user-selected/discovered exact ID and checks
every serialized body contains `enable_tools=false`, `enabled_tools=[]`, no tool
definitions/session. Harmless probes measure request-level disable behavior and reject
unexpected tool results; internal/server-wide suppression stays unknown without monitor
evidence. No separate model-management route or installed model substitution is allowed.
This removes an unsupported setup blocker without claiming resident/global-policy proof.
Production readiness remains bound to the measured configuration and review boundary.

Before remaining sends: A01/A02 omitted/invalid auth; G01–G04 schema/literal/token/tool/
output-limit cases; E01/E02 nonexistent-model/invalid-format errors; C01 client cancel
and M02 post-cancel discovery; optional S01/T01/T02 SSE/thinking. Same recorded inputs,
120 s generation and 15 s discovery deadlines; no retry, repair or format downgrade.
Version/backend/quantization/context and global tool-policy remain unknown. Generic
remains user-deferred. No native build/SDK/CI/push/merge/production integration.

Bounded gate-change checks: **34/34 pass**, no skips, 0.096 s; repository validation
373 files and whitespace pass. New native entry is owned by session **87160**.
Queued **A01, A02, G01** behind entry; no exit is queued yet so the same key can serve
the remaining tests without repeated entry. Last observed receipt state still M01
only: one HTTP, no generations, 0.234 s. On any external pause or completion, terminate
the owned credential session after accounting for queued/active operations; no silent
background retries or second runner. Key readiness and new live results not yet observed.

### Authentication, output-limit finding and settings reassessment

Session 87160 successfully received the key. A01 omitted auth and A02 synthetic
invalid auth both returned **401** (0.033 s / 0.023 s); error bodies were discarded,
owned workers released. G01 returned HTTP 200 but **failed usable-response validation**:
`finish_reason=length`, output allowance/completion usage 256, prompt usage 95,
total usage 351, separate reasoning field 1054 bytes, no returned tool fields,
exact returned model match. Response 1750 bytes, elapsed 8.790 s, worker released.
Default thinking and schema acceptance are not a valid proposal pass. No repair/retry
or source write followed. **Consumed: 4 HTTP / 1 generation / 9.080 live seconds.**

User reiterated leaving Studio/model available overnight. Do not unload, restart,
stop or switch it; only the owned probe client may be closed. No provider lifecycle
action was performed. No queued request remains after G01.

User explicitly requested one independent read-only API-settings helper. It researched
official guides/source/model cards with no endpoint calls, credentials or edits.
Public request controls distinguish `max_tokens` output allowance from loaded context;
`enable_thinking=false` is documented. Temperature/top-p are documented overrides;
other controls in current source require installed-version proof. No documented chat
field resizes loaded context. Model-card native capacity is not runtime capacity.
Current upstream `/v1/models` may advertise conditional loaded/context metadata,
but this discovery receipt retained IDs only. Internal/UI status routes are not an
adopted stable external API; none is probed. Installed version/context remain unknown.

Research recommends a **not-yet-tested** 1024-token/thinking-off candidate, with
sampling omitted. Existing authenticated process has fixed pre-recorded probes and
no runtime settings override; restarting requires native key entry while the user is
asleep. Do not export/recover its key or inject code. Move preplanned T01 ahead of
other generations as a distinct **256-token, thinking-off** small-envelope diagnostic,
same exact schema/model/tool-disable fields, 120 s deadline. This is a deliberate
setting comparison, not a repeat of G01 or a tested 1024-token claim. If usable, it
qualifies only this bounded response; default/on length failure stays recorded.

T01 completed HTTP 200/`stop`, exact model, **whole-document schema valid**, no
reasoning field and no returned tool fields. Usage input 97/output 91/total 188;
891 response bytes, 8.122 s, worker released. Its synthetic text retained the requested
literal `[name]` and `{b}lantern{/b}`. This is a non-streaming schema PASS with
thinking explicitly off and output cap 256, not Ren'Py encoding/display proof.
Consumed now **5 HTTP / 2 generations / 17.202 live seconds**.

Remaining baseline probes retain their already-recorded default-thinking/256 allocation:
G02 protected tokens, G03 harmless tools-disabled response, G04 intentional 8-token
limit, E01 nonexistent synthetic ID, E02 invalid format, C01 JSON client cancellation,
M02 availability. Their results qualify that precise configuration, including failures;
they cannot establish the successful thinking-off profile's protected-token behavior.
No settings/credentials are silently changed. Optional S01/T02 measure SSE and explicit
thinking-on separately after those terminal results; no repeated T01 or repaired G01.

G02/G03 both exhausted 256 tokens under default thinking; protected-token structured
success remains unproved. G03 accepted request disable fields and returned no tool
fields, but truncated output is not a proposal/tools-suppression pass. G04 intentionally
allocated 8 tokens and returned usage 8/`length`; rejecting it is the limit-handling
PASS, distinct from usable-generation failure. E02 invalid format returned HTTP 400.
**E01 did not reject the nonexistent ID:** HTTP 200, returned identity differed from
requested synthetic ID, and the client rejected `model_mismatch`. No substitute model
was selected by the client; provider routing guarantee FAIL for this probe. Returned
alias was not retained, so the actual fallback identity is unknown. Do not claim 404
behavior or downloaded/loaded a different model. C01 finished in 3.024 s before the
5 s cancellation trigger; cancellation is **inconclusive**, not PASS. M02 discovery
still returned the selected catalogue ID, HTTP 200; that is availability evidence,
not server cancellation or unchanged model-residency proof. All workers released.

After those baseline results, execute pre-recorded optional S01 (strict-schema SSE,
direct LAN, default thinking/256) and T02 (JSON thinking-on/256), each once, 120 s
total and S01 15 s semantic idle deadline. Do not infer streaming support from JSON
success, repair a truncated stream, or treat reasoning as final content.


### Initial live batch closure and bounded continuation

All initial Studio IDs attempted exactly once, in this order. Actual receipt categories
below distinguish expected rejecting tests from failed usable responses. No request
was automatically retried. The ignored local receipt contains allowlisted metrics and
T01 synthetic prose only; SHA-256 of the terminal 14-attempt file is
`a201791850b7ce43b775be231f25a970376366dfb24ff4792fd664edd2cad89b`.

| Sequence/probe | HTTP | Recorded outcome | Seconds | Request-body SHA-256 |
| --- | --- | --- | --- | --- |
| 1 M01 | 200 | discovery_parsed | 0.234 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| 2 A01 | 401 | http_error | 0.033 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| 3 A02 | 401 | http_error | 0.023 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| 4 G01 | 200 | finish_unusable | 8.79 | `1429ff15febd2fda1d0cd89b7d9590b32acc8370abb1dbc47634087b1e2a88e7` |
| 5 T01 | 200 | structured_valid | 8.122 | `f736e6b0e67e11c345405264d73023d3db3f81a77f36334a4339193c6899cb50` |
| 6 G02 | 200 | finish_unusable | 3.209 | `4dbbfaa7285b2b96f71d73e1cfcfede3f35cfe6836a5795d518cb9a3f1d10d83` |
| 7 G03 | 200 | finish_unusable | 2.887 | `9b2675e584677502c06f66357671d50f5cb10898d51b054888001592fb14ab01` |
| 8 G04 | 200 | finish_unusable | 0.463 | `d85b8c97273d931058ac1ce4c5073f8f737d6f7bf2c0013e0b858b45167d736e` |
| 9 E01 | 200 | model_mismatch | 4.016 | `bb87150ec790b3869000b30652710a5648bbb9af060f4722a31ccdef7ec0d3c4` |
| 10 E02 | 400 | http_error | 0.294 | `3425d59948eeffacd11533131f6a80dc41e5a169b6b4f426267b4a8a62b0c35b` |
| 11 C01 | 200 | finish_unusable | 3.024 | `88bbae2453c1d3415233f0873035f264ac6e67a7afffe8f8ee424f42a3c164e5` |
| 12 M02 | 200 | discovery_parsed | 1.715 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| 13 S01 | 200 | finish_unusable | 3.283 | `65bca2c9a470949ff6a56d293e140ac7804e423815ff3955e0fb343475895fc2` |
| 14 T02 | 200 | finish_unusable | 2.634 | `e91be9d243f76bfdc5368d6af30c9c98b6d77bea4cf7c6737e6be461f326f25a` |

T01 retained safe synthetic final prose: “The [name] sits by the water, where a
{b}lantern{/b} casts a steady beam.” It is fixture data, never applied to project/source.
S01 returned HTTP 200/event-stream and reached an unusable finish; it is partial SSE
transport evidence, not a successful schema stream. The runner did not retain partial
SSE byte/usage/reasoning counts, so those remain unknown. T02 explicit thinking-on
returned separate reasoning (951 bytes), usage 95 input/256 output/351 total, and
`length`; that profile has no usable-response pass. All 14 workers/resources released
with reported cleanup 0.000 s (rounded); no active cancellation/late-publication or
server-stop claim. No real timeout was exercised; 120 s is a configured deadline,
not measured cold-load latency capacity.

E01's fallback-like outcome is consistent with current official
[selection source](https://github.com/unslothai/unsloth/blob/main/studio/backend/routes/inference.py#L10173),
which permits some unknown labels to use resident routing. Installed mechanism and
actual returned alias are unknown. Retain exact response-identity rejection; discovery
membership cannot guarantee the requested model was used. The research helper did no
live requests and owns no implementation files.

**Time accounting:** first send 11:49:25 UTC; last completion no later than 12:11:37
UTC (rounded outward): 22 min 12 s, conservatively charged in full. HTTP durations
sum 38.727 s. External setup waiting need not consume live time, but this batch does
not reclaim it. Updated executable plan carries the 1332 s charge through sequence
14 and counts follow-up wall time between probes as well as attempted HTTP duration.
All continuation sends must still fit their full 120 s/15 s deadline plus 2 s cleanup
inside the remaining 468 s; stop on exhaustion. Session-only key waiting with no
probes after batch closure is not ongoing live execution.

**Pre-recorded follow-up, not sent:** M03 selected-row advertised loaded/quant/context
metadata (15 s); G05 protected-token JSON, G06 harmless tools-disabled JSON and S02
SSE use thinking off/output 1024 (120 s each, S02 semantic idle 15 s); C02 JSON uses
thinking on/output 1024, client cancellation at 1 s, cleanup target 2 s. C01 completed
before 5 s, so C02 changes the cancel boundary deliberately rather than retrying the
same attempt. These five candidates add at most five HTTP/four generation attempts;
none is an automatic retry, undocumented context resize or model-management call.
Version/native/runtime/advisory capacity distinctions remain explicit. Metadata is
conditional/source-version-dependent; omission remains unknown. Sampling stays omitted.

The updated runner reads fixed recorded candidates and rejects unrecorded command
settings; it cannot alter the already-running process. Session **87160** remains
idle with its original memory-only credential and no requests queued, at the user's
overnight availability instruction. Studio/model/server are untouched. Do not extract
or share that key, inject code, unload models or claim another agent has the key.
The updated runner requires native key entry on continuation: close only the old
owned client when replacing it, then launch the revised finite runner and enter in
native UI; do not send a secret in chat. No second live writer or background polling.
This secure-entry dependency is an actual remaining setup need, not a new permission
request or unavailable endpoint claim. Generic qualification remains user-deferred.

Final affected offline run after prospective runner/plan correction: **38/38 pass**,
no skips, 0.099 s. Added rejecting unrecorded-settings assertion, actual serialized
request tool flags, off-mode output/input selection, allowlisted metadata and conservative
elapsed-window gate. These remain deterministic proof only. Finish repository validation
and self-review before transfer; do not start 2A.1/2A.2 or screens.

### Final self-review and local review delivery

Final focused check **38/38 PASS**, no skips, 0.093 s after rejecting ignored stream
overrides/non-string probe IDs and checking the cumulative 19-HTTP/14-generation
Studio candidate selection. Repository validator **373 files PASS**, whitespace PASS.
UI/Phase 3 accepted bytes, Phase 2 sections 7/24 and ARCHITECTURE's accepted text
plus only the contract cross-reference were rechecked against entry safety copies.
HANDOVER's live continuation was replaced as required; unique source recovery facts
and accepted plan ownership remain linked. No app, dependency, workflow, SDK, native
or production settings/service/screen implementation changed.

Fresh completion remote main/source refs still equal `5f448ca`; no remote qualification
branch. Current checkout/worktree ownership and recovery stash unchanged; no attached
worktree/PR. Completion PR refresh could not connect to GitHub and was not retried;
entry fresh PR inspection remains the last observed PR state, not a claimed new refresh.
No push, commit, merge, release, CI dispatch, secret persistence or provider management.
All work remains local/uncommitted on `codex/provider-qualification`. Contract proposals
and partial live results are ready for review; **2A.0 remains incomplete** at the actual
secure-entry/live-evidence boundary. Do not represent mocks or unknowns as a pass.

Same-outcome continuation prompt (not a new goal or next-phase instruction):

> Resume Phase 2A.0 in this same chat on local `codex/provider-qualification` at
> `5f448ca` plus all uncommitted edits and five accepted planning corrections.
> Read HANDOVER and Phase 2 section 25; verify changed refs/ownership/receipts.
> Keep Studio/model at `http://192.168.1.13:8888` running. Replace only idle owned
> probe session 87160 with the revised finite runner using native hidden key entry;
> never ask for a key in chat or extract/share it. Execute remaining recorded
> M03/G05/G06/S02/C02 serially, exact selected Gemma 12B ID, synthetic only,
> output 1024 candidate, no sampling overrides/retries/management. Carry consumed
> 14 HTTP/10 generations/1332 conservatively charged seconds; remaining
> 26 HTTP/10 generations/468 seconds, full 120 s generation deadline plus cleanup
> must fit before each send. Generic stays user-deferred. Preserve success/failure/
> unknown, finish focused checks/self-review and update contracts/ledger/HANDOVER.
> Return review results; do not implement 2A.1/2A.2/screens, push, merge or release.
> Codex machine: repository host with explicit endpoint access. Test hosts: portable
> deterministic checks and actual approved endpoints. Reason: establish provider
> compatibility before production settings/request services.

### Same-outcome resume — 2026-10-08

User explicitly resumed M03/G05/G06/S02/C02 using native entry, preserving local work
and Studio/model availability. Fresh main/source refs and local qualification HEAD
remain `5f448ca`; checkout/planning worktree ownership unchanged. PR read could not
connect to GitHub; no retry or inferred new PR state. Receipt still exactly the
recorded 14 terminal attempts/digest, all workers released. No other live attempts
or local edits were observed. Closed **only** idle owned client 87160 (normal exit),
not Studio/model. Launch revised native-entry client, queue M03 only initially;
inspect its metadata before remaining serial recorded probes. Same allowance carries:
14 HTTP/10 generations/1332 conservatively charged seconds, 468 seconds remaining.
No key extraction, retries, generic calls, later phases or publication.

Native launch detail: first sandboxed client exited with the fixed unavailable/
cancelled category before any send. The authorized native-UI launch is owned session
**74466**; M03 alone is queued behind key entry. Last observed process output has
not reported key readiness or M03 completion; counts remain 14/10 and no generation
is queued. Native entry has a 300 s timeout; if it expires before entry, no queued
HTTP is sent. Check actual session/receipts on continuation rather than duplicating it.

### Credential-reuse correction requested by user — 2026-10-08

User rejected repeated key entry. The owner acknowledges tying credentials to fixed
probe-process lifetime caused avoidable re-entry and corrects qualification setup;
this does not select production 2A.1/settings implementation. Client 74466 terminated
unavailable/cancelled before any send; counts remain 14/10. No memory-only key can
be recovered; no extraction or provider credential-database access was attempted.

Revised native hidden entry explicitly offers **Remember for qualification**.
Only that native click stores a non-sync macOS Keychain generic password in separate
service `app.loomlight.desktop.ai.test`, opaque UUIDs and qualification account component.
Origin-bound ignored reference contains no secret. Later probe processes retrieve
only this owned entry into backend memory; no read-secret CLI/renderer IPC/export,
argv/environment inheritance or plaintext fallback. Missing/unavailable remembered
key refuses rather than automatically reopening entry. Publish reference after
store/read verification; failed publish cleans only the staged owned entry. Retain
remembered key for user-requested reuse; no removal/revocation or Studio/model change.
Production packaged identity/replacement/storage UX remains unimplemented/unqualified.

Deterministic checks **42/42 PASS**, no skips, 0.101 s: reuse without second entry,
missing-key/no-auto-entry, foreign-origin refusal and failed-save cleanup assertions.
Actual native Security/CoreFoundation APIs, no build or HTTP: disposable synthetic
entry round-trip PASS, read in second Python process PASS, delete/absence PASS.
Only booleans printed; random sentinel never logged/files/argv/environment; synthetic
entry removed. [Apple Keychain API](https://developer.apple.com/documentation/security/adding-a-password-to-the-keychain)
and non-sync attributes reviewed. This proves this host's qualification seam only;
locked-store/signed-app/Windows and production entry remain separate gates.

Correction validation: repository text/privacy/link checks **375 files PASS**,
whitespace PASS; nonsecret qualification reference is ignored. No real remembered
key or new HTTP has yet been observed. Owned client **43647** awaits explicit
Remember entry with M03 alone queued; no generation queued. After Remember succeeds,
restart/revised probe processes reuse the owned Keychain reference without API-key
entry. Studio/model untouched, same 14/10 counts and 468 live seconds remain.


User reported missing dialog and explicitly authorized reopening plus continuation.
Session 43647 had closed unavailable/cancelled; no reference saved, receipt digest/count
unchanged (14/10). Reopened native Remember in owned session **44134**, M03 alone
queued; no generation. User additionally authorized **up to five contingency probes
if needed** beyond the recorded five. No extra probe selected/sent yet; retain original
40 HTTP/20 generation/1800 s caps and 468 s remaining, no assumed added time.
Native entry is setup, not an HTTP retry. After successful Remember, do not ask for
API-key entry again on routine runner replacement; use the owned Keychain reference.

Native Remember succeeded in session 44134: keychain-ready status only; owned
nonsecret reference saved, no key output. M03 sequence 15 HTTP 200, 587 bytes,
1.639 s, worker released. Selected ID advertises `loaded=false`, quant `UD-Q4_K_XL`;
no context/native/advisory lengths present. This is discovery/configuration evidence,
not confirmed runtime residency or context. Under the existing explicitly selected
model/cold-loading authorization and prior gate reassessment, proceed only with that
exact ID via ordinary inference, no management/server lifecycle/model substitution.
G05/G06/S02/C02 retain pre-recorded settings/deadlines; every returned identity must
match and every request disables tools. Failures/aliases remain rejected, no retries.


### Recorded follow-up results and four contingency probes

M03/G05/G06/S02/C02 terminal; G05 protected-token JSON PASS (88 output/89 input),
G06 tools-disabled JSON PASS (78 output/83 input), both HTTP 200/stop/exact model,
no reasoning/tool fields. S02 schema SSE PASS, HTTP 200/event-stream, 26814 bytes,
stop/DONE, exact model, validated literal fixture prose. SSE usage/reasoning metrics
were not retained and remain unknown; JSON metrics do not qualify SSE reasoning.
C02 client cancel PASS at 1.004 s, worker released/cleanup 0.001 s, no proposal;
no HTTP status before abort and no server-stop claim. G05 8.623 s, G06 1.609 s,
S02 2.031 s. Owned client 44134 exited normally after these terminal results;
remembered credential retained, Studio/model untouched.

Consumed **19 HTTP/14 generation attempts**, HTTP durations total 53.633 s.
Follow-up window first floor 16:44:54 UTC, last C02 start floor 16:45:56 + 1.004 s
with less than one second unknown timestamp fraction: conservatively round last
bound upward to 16:45:59, charge **65 s**. Cumulative charge **1397/1800 s**,
remaining **21 HTTP/6 generation attempts/403 s**. Setup waiting after this closed
batch does not count. Executable checkpoint advances through sequence 19; later
between-probe wall time still counts and full timeout+cleanup must fit before send.

User's five contingency probes: select **four**, before sends, all same approved
origin/model/schema/tool-disable flags/sampling omitted. M04 post-actual-cancel
/models discovery/allowlisted selected metadata (15 s); T03 thinking-on JSON at
output 1024 (120 s); S03 thinking-on SSE/output 1024 only if T03 usable (120 s total,
15 s semantic idle); C03 thinking-off SSE/long synthetic input/output 1024, cancel
at 1 s, 2 s cleanup (120 s total cap). These are distinct setting/transport probes,
not automatic retries. At most four HTTP/three generations; one contingency remains
unselected. No generic calls, model management, SDK/build/CI or production integration.
Saved Keychain reference will be reused for the new client; no new API-key entry.

User reports selected model's Studio UI context opened as **262144** and Studio
version **v0.1.902-beta**. Record as user-reported UI configuration, not discovered
API runtime capacity or a full-context stress pass. For remaining tiny fixtures,
preflight complete serialized body byte count as a conservative token estimate plus
max(128, ceil(10% estimate)) plus output 1024 <= local **4096** total budget <=
reported 262144 ceiling. This sends no context resize field and does not clamp/drop
input or change the server. Backend/kernel/native effective capacity remains unmeasured.
New partial-SSE cancellation fixture proves no partial proposal, reader/worker cleanup
and retained safe byte count. **43/43 offline checks PASS**, no skips, 0.113 s.

Client 1632 reused real remembered credential without dialog/API-key re-entry.
M04 post-C02 discovery HTTP 200, 628 bytes, 2.282 s, worker released. Selected row
now advertises loaded=true and context_length/native_context_length/max_context_length
all **262144**, quant **UD-Q4_K_XL**, matching user's context report. This is actual
API metadata, not stress proof of maximum effective capacity; maximum/native/runtime
meanings remain distinct. No management call occurred.

T03 thinking-on/1024 JSON **FAIL usable completion**: HTTP 200/exact model,
finish length, 3829 reasoning bytes, usage 95 input/1024 output/1119 total,
4671 response bytes, 10.846 s; no returned tools, worker released. Do not increase
tokens again/repair or treat thinking as final prose. S03 prerequisite (usable T03)
failed, so **S03 not attempted/unknown**, not pass/unsupported. Send C03 as recorded
for active off-mode SSE cancellation, then close only owned client; remembered key
and Studio/model remain available. No further allowance is required for this scope.


### Final Studio review delivery — 2026-10-08

C03 active partial-SSE cancel **PASS**: HTTP 200/event-stream, 2393 bytes consumed,
client cancelled at 1.006 s, cleanup 0.000 s rounded, worker released, no proposal.
This does not prove server computation stopped. Client 1632 exited normally;
all 22 attempts terminal/workers released, no pending operation or hidden queue.
Remembered Keychain entry retained for reuse, no further API-key entry requested.
Studio/model remain running; generic stays user-deferred. No further allowance needed.

| Sequence/probe | HTTP | Recorded outcome | Seconds | Request-body SHA-256 |
| --- | --- | --- | --- | --- |
| 15 M03 | 200 | discovery_parsed | 1.639 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| 16 G05 | 200 | structured_valid | 8.623 | `3af830f7f7172fc546070dff04430ba447d73e0b84a9a324eae90b9b63b3389e` |
| 17 G06 | 200 | structured_valid | 1.609 | `aa96f37cd072855f4614350d793daa0db59f31f63224d8a5d972ba45cb4bd4e7` |
| 18 S02 | 200 | structured_valid | 2.031 | `61c5c5b6df6d3f3a6505c29d9ebba689dc16eed69b410b43bcc5dd74cb046cd4` |
| 19 C02 | not observed before cancel | client_cancelled | 1.004 | `0afd20c1fc13bd73bfdff18706815708f87d5c28c367fbfc0503ab48115ec1fd` |
| 20 M04 | 200 | discovery_parsed | 2.282 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| 21 T03 | 200 | finish_unusable | 10.846 | `74738b4dea3e3213b096a95854e1445cdca40edc603dff0588d862e9554f07a5` |
| 22 C03 | 200 | client_cancelled | 1.006 | `3fa1d5ef4eb381ed57c6d5135334f4a50f73182e82fce355eeff82ded62057c5` |

Safe G05 result: “Greetings __LL_TOKEN_0__, the __LL_TOKEN_1__ lantern is waiting.”
G06: “A cerulean lantern emits a soft radiance.” S02 preserves literal fixture tags/
interpolation in a validated envelope. These are wire-fixture data only, never source
changes. No partial C03 reply or provider reasoning text retained. Final ignored
receipt SHA-256 `44027a6cfb0a74d9be7f629c77ec7f5131a1145a34cc3446f9c0dc27fe669f92`.

Final allowance: **22 HTTP/16 generations**, HTTP elapsed **67.767 s**. Contingency
window floor first 16:49:22 UTC, last start floor 16:50:18 + 1.006 s and less than
one-second timestamp fraction: outward bound 16:50:21, charge **59 s**. Self-review
corrected initial window's outward bound by **one second** (original 1332 charge
becomes 1333; no past attempt/duration altered). Cumulative **1333+65+59=1457 s**,
remaining **18 HTTP/4 generations/343 s**. Executable plan advances checkpoint through
sequence 22 at 1457 s. Three contingency probes used (M04/T03/C03); S03 conditional
not attempted after T03 failure, fifth never selected: two contingent unused, not
an automatic authorization to spend them or expand original caps. No budget reset.

ADR 0013 is the final concrete contract proposal for review: qualified off/1024
JSON/SSE, strict identity/schema/tool/literal-token boundary, context/output separation,
bounded transport/cancellation and native credential ownership. Credential setup
correction stays isolated; no production 2A.1/2A.2 or full Ren'Py emission/UX proof.
Full-context stress, effective backend/sampling, internal tool suppression, server-stop,
TLS/tunnel/proxy and generic evidence remain explicit limits. Thinking-on 1024 is a
failure at that allowance, not a claim every possible thinking allocation is broken.
No automatic retries/increases/downgrades or invented API/model management.

Same-outcome review continuation (supersedes the previous key-entry prompt):

> Review Studio Phase 2A.0 results/contracts from HANDOVER and Phase 2 section 25 in
> this same chat on local `codex/provider-qualification`, `5f448ca` plus all uncommitted
> work/five accepted plan corrections. Keep Studio/model and the remembered native
> qualification Keychain entry available; no routine key re-entry or secret export.
> Recorded Studio probes are terminal. Generic remains deferred and full 2A.0
> acceptance incomplete; obtain explicit disposition before closure or next phases.
> Carry 22 HTTP/16 generations/1457 conservatively charged seconds; remaining
> 18 HTTP/4 generations/343 s, generation deadline 120 s, no automatic retries.
> If more provider qualification is selected, establish exact setup/usage and record
> finite probes before sending; request additional allowance only if actually needed.
> Update canonical contracts/ledger/HANDOVER with review decisions. Keep work local;
> no 2A.1/2A.2/screens, push, merge or release. Machine: repository host with explicit
> endpoint access. Test hosts: portable checks and actual approved endpoints.
> Reason: establish compatibility before production settings/request services.


Final affected verification **43/43 PASS**, no skips, 0.121 s; repository validation
**375 files PASS**, whitespace PASS. Accepted UI/Phase 3 bytes and Phase 2 sections
7/24 rechecked unchanged; architecture accepted text retained with the contract link.
Self-review bounded native invalid-UTF8 credential data to a fixed safe category,
updated latest result/status/README references and cumulative time checkpoint.
No further provider call after C03; all owned clients exited, remembered key retained.
Final remote-ref recheck failed DNS resolution; no retry/new ref assertion. Earlier
resume refs at `5f448ca` remain last observed remote state; local HEAD/worktrees
unchanged. PR refresh unavailable as already recorded. Requested contract panel open
was queued by the app; opening is not acceptance. Work stays uncommitted/local,
no app/dependency/workflow changes, native build/SDK/CI or publication.

### Studio qualification contract review — 2026-10-08

**Selection and disposition:** the user selected an audit of the unpublished Studio
candidate and request/settings, credential, structured/protected-token, tool, transport,
cancellation and classification contracts. One owner, no helpers or second writer;
the shared contract review was useful serial work. Review delivery is complete with
**three P2 findings; corrections requested before candidate reuse/integration**.
The ADR 0013 design remains a proposal, not user-accepted production authority.
Measured Studio passes survive this review; none of the newly reproduced failures
was observed in the live receipts. Generic remains explicitly user-deferred, not
failed/passed/unsupported. Full two-provider 2A.0 acceptance remains incomplete.
No production implementation, provider requests, native builds, SDK, CI, management,
push, merge or release was selected or performed. No autonomous Goal was created.

**Fresh state:** HEAD/local `codex/provider-qualification` remains
`5f448ca683a905f4ea77d4580bbc89fda69f2b93`, qualification and five accepted planning
corrections uncommitted. Read-only remote heads confirm main/source at the same SHA,
no remote qualification branch; connector open-PR inspection confirms unrelated
10/11 and abandoned 12 only. Shell DNS failures were resolved by an elevated read-only
`git ls-remote --heads origin`; no fetch/reset/ref write. Worktree ownership remains
this checkout and historical planning worktree at `2c5a164`; stash
`23c69ff7cc3262981b8a23b32c55a23bb2ab0c27` unchanged; no task attachments.
Sandbox process inventory was unavailable (`ps` refused), not a provider failure.
Terminal receipts and the previous recorded client exits establish the continuation;
this review launched no live client or pending operation and claims no fresh server
liveness/credential-store read. Original code/plan/schema/tests were hashed before
the audit; reviewed eight-input manifest is ignored
`.toolchains/reports/provider-qualification/review-inputs.json`, SHA-256
`f48b0db4ee40993b2c64618751eb6be56003d0ab3d25d993cde7454d2038ecaa`.

**Evidence audit:** actual `studio-receipts.json` still hashes to
`44027a6cfb0a74d9be7f629c77ec7f5131a1145a34cc3446f9c0dc27fe669f92`.
All **22/22 request-body digests** reproduce from current exact synthetic inputs,
model/settings mappings and serialization (including E02's deliberate format mutation).
Sequence/probe uniqueness, HTTP/generation counts, terminal/released status, 67.767 s
HTTP sum and executable 1457 s checkpoint agree. Four retained proposals
T01/G05/G06/S02 revalidate against the closed schema; G05 keeps both tokens exactly
once/in order. Actual raw replies/SSE were deliberately not retained: their original
protocol completion cannot be independently replayed now. The actual parser/request
paths and receipt classifications were audited; fixtures are not fresh live evidence.
Native disposable Keychain round-trip/second-process/delete remains the recorded
historical host result, not a new review execution; no separate raw native receipt
exists in the inspected qualification directory. Remembered reuse is consistent with
the current origin-bound, separate-service code and recorded replacement-client results.
No remembered key/reference contents were retrieved, exported, removed or changed.

| Contract | Review result and boundary |
| --- | --- |
| Request/settings | Exact selected ID; one `max_tokens` field, explicit off/on override or omitted default; schema resource shared; output and context budgets distinct. Off/1024 JSON and literal SSE remain measured passes. Backend/default sampling and full capacity unknown. No settings/production UI exists. |
| Credentials/secrecy | Native entry status/reference boundary, non-sync test namespace, origin/UUID checks and reuse without automatic re-entry agree with the selected seam. Diagnostics do not intentionally retain headers/keys/error bodies. R2 exposes missing failed-cleanup recovery. Production identity/replacement/removal/session/Windows proof remains later work. |
| Structured/protected text | Exact identity/finish/schema/one target and token order/count checks reject recorded truncation/substitution. Tokens are fixed fixture placeholders: revision binding and literal Ren'Py emission are future 2C.1 gates. R1/R3 expose uncovered response-boundary failures. |
| Tools | All rebuilt Studio generation bodies set `enable_tools=false`, `enabled_tools=[]`, omit tools/session. Request-field acceptance/no returned tools is measured; server/internal suppression remains unknown. Harmless probes cannot establish the stronger guarantee. |
| SSE/thinking | Off/1024 S02 passes recorded strict SSE/whole-document validation; thinking-on S03 was not sent after T03's failed prerequisite. SSE usage/reasoning metrics unknown. Thinking output-cap truncation is a failed usable completion at that setting, not unsupported thinking. |
| Cancellation/cleanup | C01 completed early/inconclusive; separate actual C02 JSON/C03 partial-SSE cancels released workers and published no proposal. M04 proves post-C02 discovery. No server-stop, production async adapter, Save responsiveness, deadline/cold-load capacity or TLS/tunnel/proxy claim. |
| Classifications | Preserve expected G04 truncation rejection, E01 server routing failure plus client identity-guard pass, and E02 HTTP 400 without inferring an unavailable provider error code. Terminal/released alone is not a success classification; R1 requires repair. |

**Actionable findings (all candidate/harness defects, not deployed product defects):**

1. **R1 / P2 — classify malformed `choices` before collecting metrics.**
   [live_studio.py](../../../spikes/provider-qualification/live_studio.py) lines
   235–236 assumes a list before `validate_response`. HTTP-200 JSON with the correct
   model and `choices=null`, `7` or `{"0":{}}` raises uncaught worker TypeError/KeyError.
   Lines 258–259 do not classify those exceptions; lines 290–295 still save/print a
   terminal/released receipt **without `outcome`**. No proposal was published in the
   reproductions, but failure reporting is incomplete and normal threading emits a
   traceback outside the safe diagnostic boundary. Validate the envelope shape before
   indexing/metrics, require a fixed failure outcome for every worker exit and add
   rejecting actual-runner fixtures. Preserve useful allowlisted truncation metrics;
   do not solve this by exposing exception text or treating terminal as pass.
2. **R2 / P2 — retain the staged credential reference when cleanup fails.**
   [macos_credential.py](../../../spikes/provider-qualification/macos_credential.py)
   lines 158–164 deletes the pending reference before trying staged-key cleanup. A
   reference-publish OSError followed by store-delete refusal leaves the owned Keychain
   item, no saved/pending reference, and only the cleanup error. The next process cannot
   identify/reuse or explicitly retire that item and can prompt/create another entry.
   ADR 0011/0013 requires explicit failed-cleanup state with a nonsecret owned reference;
   no cross-store atomicity is promised. Retain a bounded recovery reference/phase
   through publish and cleanup failures; preserve the primary failure and disable sends
   from incomplete state. Add fake-store/filesystem failure-ordering assertions, including
   unrelated-entry preservation and subsequent bounded cleanup. Do not touch the real key.
3. **R3 / P2 — reject exponent overflow across the whole JSON envelope.**
   [contract.py](../../../spikes/provider-qualification/contract.py) lines 129–141
   rejects explicit NaN/Infinity via `parse_constant` but never checks parsed floats.
   `1e999` becomes Python infinity; a normal valid response with
   `usage.completion_tokens=1e999` is accepted as a proposal. This contradicts the strict
   nonfinite policy and the existing test's claimed coverage. Reject nonfinite decoded
   floats (or use bounded numeric parsing) at any nesting level, including ignored
   metadata/SSE envelopes; add positive/negative exponent-overflow rejection fixtures.
   Preserve valid finite JSON and the exact schema boundary; no parser downgrade.

**Focused verification and retained failures:**
`python3 -m unittest discover -s spikes/provider-qualification/tests -v`:
**43/43 PASS**, zero skips, 0.114 s. Additional offline synthetic reproductions used
the existing fake HTTP connection/store with temporary receipt/reference files:
**five failed contract checks** (R1's three shapes, R2 cleanup ordering, R3 overflow),
command exit 1 retained deliberately. These are uncovered failures, not waived by the
existing green suite. Ignored `review-reproductions.json` preserves expected/actual
results, SHA-256 `f2b37ed988cb48c95b92fb27bc065f8ae5b6a4306e59f086afc617d983465958`.
No socket/native-store/provider request was used. Review changes are documentation
only (ledger, live status, ADR status/clarification and spike README); all reviewed
code/plan/schema/test bytes and accepted planning corrections remain intact.

**User clarification on thinking limits:** user suggested `max_new_tokens` may explain
the cut-short reply. Reproduced T02/T03 bodies contain `max_tokens=256`/`1024`, not a
`max_new_tokens` wire field. T03 exact-model HTTP 200 reports `finish_reason=length`,
1024 completion tokens and 3829 reasoning bytes. This supports output-cap exhaustion,
not a protocol failure or proof of unsupported thinking. Current official
[request schema](https://github.com/unslothai/unsloth/blob/main/studio/backend/models/inference.py)
and [route source](https://github.com/unslothai/unsloth/blob/main/studio/backend/routes/inference.py)
checked 2026-10-08 resolve the Chat Completions output field into backend generation
limits (`max_new_tokens` on the native generation path). They are current-source
corroboration, not installed v0.1.902-beta proof. A larger cap's usability remains
unknown; the earlier phrase “adequate output candidate” described a hypothesis, not
demonstrated sufficiency. No new field, token increase or retest was selected.

**Allowance/pending/publication:** unchanged **22 HTTP/16 generations consumed;
18 HTTP/4 generations/343 s remain**, 1457/1800 s cumulative charge, 120 s generation
deadline. Review consumed zero live allowance. No pending operation/external wait,
commit/push/PR/merge/release or production change. The review is delivered; the next
dependency-ready outcome is bounded offline R1–R3 correction, not 2A.1/2A.2 or generic
qualification. User acceptance/next-phase scope remains an explicit subsequent decision.

**Next proposed prompt, not started:**

```text
Deliver the Phase 2A.0 Studio review corrections: fix R1–R3 in the isolated qualification
spike and demonstrate safe malformed-response classification, retained owned credential
cleanup recovery and whole-document nonfinite rejection.
Repository: Caldwell-41/Renpy-editor
Continuation: local codex/provider-qualification at 5f448ca plus all uncommitted work
and five accepted planning corrections; preserve every edit and original live receipt.
Codex machine: current repository host with the unpublished candidate/redacted evidence.
Test hosts: focused portable synthetic checks; no OS-specific build or native key access.
Reason: correct the reviewed contract reference before production integration.
Read AGENTS.md, CURRENT, HANDOVER, Phase 2 section 25's Studio qualification contract
review, and ADR 0011/0013. Follow WORKFLOW/TESTING selectively.
Use one GPT-6.1 Sol High owner; helpers only for useful independent assignments.
Scope: R1–R3 code/fixtures and necessary documentation; preserve measured Studio results,
thinking output-cap interpretation, accepted planning corrections and generic deferral.
Prove each rejecting boundary and run the focused qualification suite/document checks.
No provider calls, real credential read/write/delete, native builds, SDK, CI, management,
production implementation, push, merge or release. Carry the existing allowance unchanged:
22 HTTP/16 generations consumed; 18 HTTP/4 generations/343 seconds remain.
Update the existing ledger/HANDOVER and return the corrected candidate's disposition
and next dependency-ready prompt without starting that outcome. Keep all work local.
Resume this same correction outcome/chat after any external wait.
```

**Review completion verification:** repository validator **375 files PASS**;
`git diff --check` PASS. Reviewed eight code/plan/schema/test hashes and the original
live receipt hash still match. Changes since review entry are confined to the five
review documents named above; ARCHITECTURE/UI/Phase 3 and original Phase 2 sections
remain preserved. Production/dependency/workflow/script trees are unchanged. HANDOVER
is 973 words; CURRENT is near its 400-word target with retained closure/recovery links.
No test rerun was needed after documentation-only updates; the 43 passes and five
new failing checks retain their distinct dispositions. No external wait occurred.

### Studio review corrections and owner review — 2026-10-08

**Selection:** the user instructed the same owner to continue, fix R1–R3, review the
corrected work and return the next prompt under the documented workflow. This selects
the preceding bounded offline correction prompt; no production/provider/publication
scope is added. One owner, no helpers or second writer. State `in_progress` at entry;
all prior edits, failure evidence, planning corrections and remembered credential retained.
Fresh HEAD/worktrees and read-only remote heads remain as recorded (`5f448ca` local
candidate/main/source; planning worktree `2c5a164`), no remote qualification branch.
Open-PR connector refresh confirms unrelated 10/11 and abandoned 12 only.
Allowance unchanged: 22 HTTP/16 generations consumed; 18 HTTP/4 generations/343 s
remain. No live runner, native key access or external wait selected.

**Implementation and disposition:** R1–R3 are corrected in the isolated spike;
state **`review_ready`**, owner review complete with no remaining actionable in-scope
finding. Recommend accepting the Studio-scoped reference/design for a separately
selected first 2A.1 slice. This is not full two-provider acceptance, production
integration permission or a new live pass. Generic remains user-deferred. The original
review findings, five failed checks and 43-test historical result remain above.

- **R1:** validate the `choices` list/cardinality/object before metric access. Start
  every worker with a safe failure outcome; classify unexpected exceptions without
  traceback/exception-text reflection. Close response and connection independently;
  cleanup failure is explicit and removes any proposal. New actual-runner fixtures
  cover the three original malformed shapes plus empty/scalar-item/multiple lists,
  unexpected worker and cleanup exceptions, and retained length/usage/reasoning metrics.
- **R2:** save the version-1 origin/service/owned-UUID reference in `.pending` before
  native store addition. Publish by rename only after store/read verification. Keep
  the reference until deletion and record removal both succeed on setup failure.
  `CredentialSetupFailure` preserves the fixed primary category and nonsecret
  cleanup-pending flag. Startup refuses entry/use before native access when pending.
  `cleanup_pending` is one explicit attempt, never startup/automatic retry: validate
  reference ownership, refuse conflicting published state, delete only that entry,
  then remove the record. Tests prove pre-write ordering, failed publish/deletion,
  unavailable/read-failed stores, unrelated-entry preservation, no re-entry/read/send
  while pending, repeated bounded cleanup and refusal of foreign/malformed/conflicting
  references. Existing published version-1 references/reuse stay compatible; no real
  credential/reference was read, moved, exported, deleted or changed.
- **R3:** inspect all decoded JSON floats and reject nonfinite values, including
  exponent overflow in ignored metadata and terminal SSE usage. Positive/negative
  overflow now refuses; finite exponents and literal string `1e999` remain valid.
  Strict duplicate/depth/Unicode/schema/protected-token boundaries are retained.

**Focused evidence:** final command
`python3 -m unittest discover -s spikes/provider-qualification/tests -v`:
**61/61 PASS**, zero skips, 0.135 s (original 43 plus 18 meaningful regressions).
First corrected 57-check pass was followed by two store-failure cases and stronger
retained-record assertions (59 PASS). Final owner review added fixed classification
for unexpected native-store construction/read errors plus two rejecting cases (61 PASS).
No failed correction attempt or automatic retry occurred.
All transport/native store interactions in these tests are fake/temp-only.

To prove the rejecting gates, reconstructed the three original source files from
the correction delta and **matched their original review-input hashes exactly**;
plan/schema also remain original. Ran three focused boundaries against those original
files with socket/native-store construction forbidden: original exit 1, five assertion
failures/three errors including malformed-receipt subcases. The same boundaries against
the corrected candidate pass **3/3**, exit 0. This checks original behavior, not an
invented mutation, and creates no new provider/native evidence. Ignored receipt
`correction-gate-results.json` SHA-256
`c262cedc04975c65dad7f389ea9bd6ed65bcc857de51acc7576f2fc68104143a`
preserves both dispositions; verified original code is under ignored
`correction-gate-baseline/`. Earlier `review-reproductions.json` remains untouched.

Corrected eight-input manifest `correction-inputs.json` SHA-256
`f3f0d2da59d671d2122b24671d6ab262e7dd32422904e4165f15d5602ac9cd9e`
identifies final code/plan/schema/tests. The intermediate 59-check manifest is retained
as `correction-inputs-59.json`. Final guarded boundary checks still pass 3/3; ignored
`correction-final-verification.json` SHA-256
`54794a8dfd965cffa4d74127c2b4a5d8cd5f1d04772ec6f16572fe42c1cf7641`
binds final inputs, the 61-check result and original rejection evidence. Original live receipt SHA-256 remains
`44027a6cfb0a74d9be7f629c77ec7f5131a1145a34cc3446f9c0dc27fe669f92`:
**22/22 request hashes reproduce, four retained proposals revalidate**, including G05
tokens. No body settings, schema/plan, live counts or time checkpoint changed.
New native recovery ordering is proven offline only; packaged native identity/recovery,
Windows and production services remain unqualified. Raw live HTTP/SSE replay, internal
tools suppression, server-stop, full capacity and larger thinking-cap usability remain
unknown. Thinking `max_tokens` interpretation and every recorded live failure survive.

**Owner review:** inspected the exact correction delta against hash-verified original
files, failure ordering and actual worker/store seams. Confirmed published-reference
compatibility, owned cleanup/refusal, fixed diagnostics, no proposal on failure/cancel,
finite-number acceptance and unchanged requests. New tests exercise rejecting behavior
and original-candidate gates; no specialist attack/crash programme. No second reviewer
or native/live requalification is claimed. Code changes are limited to three spike
modules and their three test files; README/ADR/status/ledger record the behavior and
disposition. Accepted planning corrections and app/dependency/workflow/script trees
are preserved. No production code or extra dependency was added.

**Pending/budget/publication:** none; no external wait or autonomous Goal. Everything
remains uncommitted/local at the same branch/HEAD. Zero provider calls, real credential
access, native builds, SDK, CI, management, push/PR/merge/release. Existing allowance
unchanged: **22 HTTP/16 generations consumed; 18 HTTP/4 generations/343 s remain**,
1457/1800 s conservative charge, 120 s generation deadline. Historical source-native
counts remain Windows 2/2/3, Mac 3/3/3; those allowances are not reopened.

**Next proposed outcome, not started:** the first production 2A.1 Studio remembered-key
profile slice. Split the broad settings/credentials target at this ordinary user action
to prove native entry/store/request/replacement/removal on both affected targets before
expanding session-only/generic controls. Section 20 permits this bounded split; full
2A.1 and generic/full-phase gates remain unchanged. Submitting the prompt below explicitly
selects Studio-scoped contract acceptance and that production slice; it does not count
generic as qualified or accept the full phase. Its new native/discovery allowance is a
**proposal only**, activated by user selection, not spending permission in this correction.
Windows native access is unverified on this host; verify agent-owned target capability
at entry and retain a genuine missing-host blocker rather than transfer testing to the user.

```text
Deliver the first Phase 2A.1 Studio settings/credential slice: create a remembered-key
profile, save/reopen it, explicitly check discovery readiness, replace/remove its owned
credential safely, and prove the native path on Windows x64 and macOS ARM64.
Repository: Caldwell-41/Renpy-editor
Continuation: local codex/provider-qualification at 5f448ca plus all uncommitted work
and five accepted planning corrections. Preserve the original live/failure receipts,
remembered qualification key and historical worktree/recovery.
Codex machine: current repository host with the corrected candidate; no reset/transfer
required. Verify agent-owned Windows native access before promising target proof.
Test hosts: focused portable checks plus narrow packaged Windows x64/macOS ARM64 native
credential proof; no SDK or installer/release matrix.
Reason: reviewed Studio contracts are ready for the first native production path.
Submitting this prompt accepts the Studio-scoped ADR 0013/reference disposition for
this bounded slice. Generic stays deferred; full 2A.0/2A.1/Phase 2 acceptance is incomplete.
Read AGENTS.md, CURRENT, HANDOVER, Phase 2 sections 4–5/10/20/25 and ADR 0011/0013.
Use one GPT-6.1 Sol High owner; bounded helpers only for useful independent assignments.
Scope: versioned device profiles, Studio endpoint/model/context/output controls, private
HTTP opt-in/origin binding, native Remember entry/store, opaque status IPC, explicit
GET /models readiness and staged replacement/removal with retained failure cleanup.
Keep project-open offline; no project prose, generations, 2A.2 generation service,
session-only/generic completion, screens, model management or new credential export.
Use isolated test profiles/owned entries; do not copy/delete the qualification credential.
Prove the smallest native production path early on both targets, then complete the
slice with focused ordering/secrecy/reopen/invalidation/no-network-default checks.
Proposed allowance: at most 2 package builds and 2 targeted native qualification runs
per OS, recording actual launches; no CI, SDK, full matrix or automatic retries.
At most 4 explicitly recorded Studio GET discovery requests across both hosts, 15 s
each plus 2 s cleanup, no generations. Carry 22 HTTP/16 generations consumed and
18 HTTP/4 generations/343 s remaining; charge sends/time without resetting that budget.
Complete implementation, focused verification, owner review and bounded fixes; update
canonical docs/the existing ledger/HANDOVER. Keep all work local; no push, merge or release.
Return disposition and the next dependency-ready prompt without starting it. Resume
this same slice/chat after any external wait; missing target/access evidence is not a pass.
```

**Final correction closure checks:** repository validator **375 files PASS** and
`git diff --check` PASS. Final eight-input hashes match the manifest; original live
receipt, review manifest and failed reproduction hashes remain unchanged. Six spike
code/test files changed; plan/schema and six other entry documents are byte-preserved.
Original Phase 2 content before this review/correction is recoverable byte-for-byte
by removing only the review's documented state insertion and appended sections.
App/dependency/workflow/script trees remain unchanged. Final HANDOVER is 987 words;
CURRENT is 462 words, retaining exact source-closure/recovery links and provider limits
beside its live disposition rather than dropping those still-relevant facts.
Next prompt is 2725 characters and has machine, evidence hosts, reason, proposed finite
allowance and explicit selection boundaries. No further testing is selected after
these documentation-only updates. Correction/owner review is delivered; no pending
operation, next outcome or runtime pause was started.


### First Studio settings/credential slice — 2026-10-08

**Selected outcome and disposition:** the user accepted the corrected Studio-scoped
ADR 0013/reference and selected remembered-profile create/save/reopen, explicit
GET discovery readiness and safe owned-credential replacement/removal. Generic stays
deferred; full 2A.0/2A.1/Phase 2 acceptance remains incomplete. State **blocked** at
native-access prerequisite, with bounded portable preparation complete. This is not a
completed production slice or a runtime Goal pause. No generation/project prose,
2A.2 service, session-only/generic completion, screens, model management, CI, SDK,
full matrix, push/merge/release is selected. Keep work local.

**Entry/ownership:** current Mac ARM64 repository host; same local
`codex/provider-qualification` at `5f448ca683a905f4ea77d4580bbc89fda69f2b93`, all
uncommitted work/five accepted planning corrections retained. `git worktree list`
confirmed the historical planning worktree at `2c5a164`; stash
`23c69ff7cc3262981b8a23b32c55a23bb2ab0c27` remains. Read-only `git ls-remote --heads
origin` confirmed main/source at HEAD, no remote qualification branch. Initial
sandbox DNS failure was a capability restriction; elevated read succeeded. No fetch,
reset, checkout, commit, push, branch/worktree removal or second writer. One owner,
no helper assigned. Required test hosts remain packaged Windows x64/macOS ARM64.
Reason: first native production credential path after reviewed contracts.

**Windows prerequisite:** app task inventory confirms connected SUNDOWN and existing
Windows tasks, but this caller exposes local command execution only. No SSH config/
route is configured on the Mac. Reading an existing remote task confirms historical
Windows commands, not present executable/file-transfer access for this owner. Requested
permission to use an existing Windows task for qualification only, or an existing direct
route; no answer/route received at this checkpoint. No task message, remote dispatch,
helper, infrastructure setup or file transfer occurred. Missing evidence is not a pass.
Native entry/store/discovery/replacement/removal and package work wait for verified
agent-owned execution and candidate transfer; do not transfer qualification to the user.

**Portable preparation:** added `app/src-core/src/ai_profiles.rs` and bounded
`LifecycleService` read/write methods. Strict schema v1 Studio records contain model,
canonical endpoint, private-HTTP opt-in, unverified context ceiling, total budget,
maximum response, opaque credential/origin/revision and retained cleanup references;
no key field. Reads/saves do not access native storage, DNS or network. Endpoint
validation refuses userinfo/query/fragment, ambiguous paths, public/link-local plaintext
IP destinations and malformed ports; opt-in hostname destinations still require future
connect-time validated-address/DNS proof. Active/cleanup IDs cannot alias. Origin
changes and disable state refuse credential use. File writes reuse existing anchored
flush/replace/verification and compare the full prior record, refusing stale and ordinary
external edits even when their revision is unchanged. Invalid/newer/unknown/oversized
existing data remains untouched. Changed profile revisions must advance; reusing an
entry ID to change its origin is refused. No renderer/IPC/native adapter exposed yet.

**Focused checks and bounded correction:** pinned Rust 1.90.0 on ARM64;
`cargo test --manifest-path app/Cargo.toml -p loomlight-core --locked ai_profiles::tests
-- --nocapture` final **5 PASS, 0 FAIL, 0 ignored**, 245 unrelated tests filtered;
execution 0.06 s. Tests exercise actual core save/reopen, changed limits, stale/full-record
external refusal, retention of malformed/newer/unknown/oversized records, origin
invalidation and cleanup uniqueness. Initial preparation run 3/3 and intermediate 5/5
passed; owner extended the rejecting endpoint fixture and reproduced out-of-range port
`99999` silently becoming default port. One bounded correction parses the explicit
port suffix strictly; final fixture also refuses nonnumeric ports. Preserve failure
`port-before.log` (one intended test FAIL, cargo exit 101), not a historical pass.
This is a portable product-validation defect, not a native/environment failure.

**Owner review/remaining seam:** inspected added module and lifecycle delta; no native
calls, new dependency, operation allowlist, renderer privilege or networking added.
Prepared store/reference types are not a complete credential service. A native owner
must persist staged cleanup references before OS addition, publish before retirement,
disable before removal and retain failed cleanup. Post-rename flush/verification can
return error after publication: reread/reconcile before deleting a staged/newly active
entry; never infer old-reference retention from an error alone. That combined-path
failure ordering, unavailable store, secrecy/status IPC, native input, discovery,
readiness revisions and packaged identity/reopen still need implementation/proof.
No slice-level review-ready or acceptance claim.

**Evidence:** ignored `.toolchains/reports/studio-settings/` retains initial/final logs,
rejecting port log and `preparation-receipt.json` SHA-256
`b5d672b360482363727d9e4cb3fbe575460c0871f353c7328d7b3e4ab4548710`.
Final code inputs:

| File | SHA-256 |
| --- | --- |
| `ai_profiles.rs` | `1eaf3e455e6beaf02459f4b27a013ca78658f19bf320d549b5de63ae82775bf4` |
| `lib.rs` | `2f15f406e4a82d0a0045c4e8ac0a864dcf4be377480c1dba8a3df18ce0691293` |
| `lifecycle.rs` | `b1563358f73498c50fa915f59895e775dcd2106464c33c5834c5e7590052adbd` |

Original `studio-receipts.json` rehash remains
`44027a6cfb0a74d9be7f629c77ec7f5131a1145a34cc3446f9c0dc27fe669f92`;
qualification credential/reference and earlier receipts/recovery remain untouched.

**Cumulative allowance:** first-slice actual package builds/native qualification runs
**Windows 0/0; Mac 0/0**, each has 2 builds/2 targeted runs remaining. **0/4 Studio
GETs**, all four remain (15 s each plus 2 s cleanup); reserve/record actual launches
and sends, no automatic retries. Provider cumulative **22 HTTP/16 generations consumed;
18 HTTP/4 generations/343 s remain**, 1457/1800 s conservative charge unchanged.
Generations remain excluded. Historical source-native counts **Windows 2/2/3;
Mac 3/3/3** are separate and not reopened. No pending executable, key dialog, HTTP,
CI or helper; only Windows access question pending. No autonomous Goal created.

**Resume/next action:** establish the existing agent-owned Windows execution/input-
transfer route (or receive task-specific qualification-helper authorization), then
prove the smallest native production path on both affected targets before broader
implementation. Resume this same slice/chat; retain preparation/current candidate and
all allowances, no restart/reset. Client Pause is available if the client requires a
pause control; writing this blocked record does not pause a runtime. The next distinct
outcome is not dependency-ready, so do not start or select 2A.2 yet.

**Final checkpoint checks:** `cargo fmt --check --all --manifest-path app/Cargo.toml`
PASS; repository validator **376 files PASS**; `git diff --check` PASS. Final code
hashes reproduce the receipt. UI and Phase 3 documents still match their five-correction
entry hashes exactly. CURRENT/HANDOVER are 487/663 words; CURRENT's modest excess over
the review target preserves the source closure and acceptance limits. No package,
native, provider, SDK, CI, task/helper dispatch or publication occurred. Windows route
question remains unanswered; resume the same slice after access is established.

### Local completion and serial host handoff — 2026-10-08

The user approved the brief Phase 2/3 host-handoff rule and publication of the existing
branch, then selected a **Mac-agent continuation prompt**: finish authorised Mac work
before moving to Windows. This supersedes the first-slice direct-Windows-access
prerequisite and local-only publication limit above. Preserve the original attempt,
checks, failure and budgets; direct other-machine access is never needed or requested.

The next owner continues the same Studio 2A.1 slice on macOS ARM64: complete available
implementation, focused Mac proof, review and bounded fixes, then commit/push/verify
`codex/provider-qualification` and give the user a Windows x64 pull-and-continue prompt.
Windows work and both-target acceptance remain pending; no 2A.2 or new outcome is selected.
One active writer and all cumulative allowances survive transfer. Credentials and raw
ignored evidence stay on their existing host; never copy a key into Git.

This update changes workflow/continuation only. A misread clarification briefly started
new implementation; those edits were removed and agents stopped. Pre-existing profile
preparation and qualification work remain unchanged. Its focused core checks were
rerun: **5 PASS, 0 FAIL, 0 ignored**; qualification fixtures **61 PASS**. No native/package/provider/SDK/manual-CI operation occurred;
no expensive allowance was consumed. Documentation/privacy/link validation and whitespace
checks apply to publication; HANDOVER identifies the published preparation checkpoint.

### Mac implementation and native proof — 2026-10-08

**Selection/entry:** continued the same Studio 2A.1 remembered-profile slice from
published `877e5d55fad50865bded4e4edc417f45c7ea4859`; fetch/fast-forward confirmed
up to date and clean. Historical worktrees, stash, qualification key and evidence
retained. No helper, Windows-access request, generation or next feature. User
approved a new imagegen Settings mockup in this thread; existing Settings shell,
shared palettes and written rules take precedence over generated shell details.

**Implementation in progress:** transactional remembered-key staging/switch/removal,
retained cleanup and post-rename reconciliation; Mac native secure entry and
non-synchronized Keychain adapter; narrow redacted settings IPC; explicit bounded
GET discovery without ambient proxy/redirects; revision-bound transient availability;
shared-theme Settings controls. Windows adapter/secure entry remains an explicit
next-host seam, unavailable rather than a plaintext fallback.

**Focused checkpoint:** 12 core checks PASS (5 retained records, 6 new lifecycle
failures/action boundaries, 1 strict discovery parser). Desktop check/typecheck PASS.
Initial frontend run exposed the historical exact operation allowlist fixture;
updated its exact list and retained rejection of arbitrary host/secret/generation
operations. Initial browser launch could not bind loopback inside the sandbox;
rerun uses approved local preview execution, not a product correction.

**Reserved next operation:** Mac package build 1 of 2, then targeted native run 1
of 2 with disposable device records and synthetic secure native input. Run 1
preserves its remembered test entry for process-reopen run 2; host-owned cleanup
is required afterward. No discovery or provider request in run 1. Run 2 is planned
to privately reuse the existing same-host qualification key without re-entry,
change/removal/export of its original entry, and send at most one explicit Studio
GET through the production adapter. Record actual sends before/after launch; no
automatic retry. Windows allowance remains 2 builds/2 runs; four combined GETs
remain before any actual discovery dispatch. Final results/inputs follow here.

**Build attempt 1:** frontend production build completed, but the package command
`npm exec -- tauri build -- --locked --bundles app` passed `--bundles` to Cargo
and exited 1 before Rust compilation/package creation. Classification: invocation
error, not product/runtime failure. Retained `mac-build-1.log`. Conservatively
charged as build 1 of 2; one Mac build remains. Correct command for build 2:
`npm exec -- tauri build --bundles app -- --locked`. No native run/GET occurred.
Additional self-review added a rejecting reconciliation-unavailable fixture and
32-level discovery nesting bound: final focused core 13 PASS. Frontend 97 PASS;
focused browser PASS with wide/compact light/dark screenshots visually reviewed.

**Mac build 2 / native run 1:** corrected app-only package build PASS (release
compile 22.68 s); both Mac build attempts now consumed, no build remains. Packaged
executable SHA-256 `c5619a9a0049b930d5363cbe9eab5080ec23e9f21bd8487e7977b2015b503b6a`,
97 source/config input hashes and aggregate digest recorded locally (final audit
will verify count/digest). Native secure text-field actions were driven through
macOS accessibility with disposable synthetic values; no real key was typed or
returned through WebView IPC. Native run 1 retains its owned test entry/records
for the second process-reopen run. No discovery GET yet.

**Reserved next operation:** native Mac run 2 of 2, same package and disposable
root. Reserve one Studio GET (15 s + 2 s cleanup, conservative 17 s charge) through
the explicit Refresh models action, with private same-host reuse of the existing
qualification key; preserve/recheck the original. No automatic retry. After this
reservation: at most 3 combined GETs and provider 17 HTTP/4 generations/326 s
remain if the reserved send occurs. Windows retains 2 builds/2 targeted native
runs; Mac native allowance will be exhausted by the launch.

**Native run 1 final:** 9 checks PASS, process exit 0, 36.725 s, owned runtime
cleanup confirmed. Actual native secure field entry/replacement/cancel, status IPC,
changed limits, Settings reopen and renderer-key injection refusal passed. The
remembered entry was retained deliberately for process-reopen proof.

**Native run 2 failure:** the second process displayed the retained configured
credential and response default 768, then the fixture's first read of the original
qualification entry raised macOS Keychain authorization. Computer Use refuses
SecurityAgent; the agent requested only user handling of that native OS login/access
step, not provider-key re-entry or routine test execution. The user reported Allow,
but the 300-second native watchdog had already recorded FAIL/timeout and runtime
cleanup; the Python launcher also retained its `TimeoutExpired` failure. No pass or
automatic retry. Disposable records remain at the original synthetic endpoint/model,
revision 4 with one owned remembered entry and no cleanup reference; therefore the
fixture never reached import/save or discovery. **0 GETs sent**, all four remain;
provider budget unchanged at 22 HTTP/16 generations consumed, 18 HTTP/4 generations/
343 s remaining. The GET reservation is unsent, not a charge. Original Studio receipt
hash remains `44027a6cfb0a74d9be7f629c77ec7f5131a1145a34cc3446f9c0dc27fe669f92`.

Both Mac builds/native launches are consumed (build 1 invocation FAIL, build 2 PASS;
native 1 PASS, native 2 OS-auth timeout FAIL). Windows still has 2 builds/2 native
runs. Requested a genuine budget decision: one extra Mac targeted run of the unchanged
package, or publish partial Mac evidence with the unresolved gate explicitly retained.
No extra launch is authorised by the OS Allow response alone. No code changed since
the package; all 97 input hashes match aggregate
`ad4250456ab2a6f0ccc8177e10d284e10f8fe6395300977f1ece5a97f08d9f1e`.
Retain disposable records/owned entry until that decision and perform owned cleanup
without modifying the original qualification entry. No runtime Goal was created.

**Explicit allowance extension:** after the recorded OS-auth timeout the user
authorised **one extra Mac targeted native run** of the unchanged package. This
grants run 3 only, no build/generation/GET-cap increase or automatic retry. Reserve
run 3 and one still-unsent Studio GET within the original four combined GET cap.
Windows allowance and provider cumulative budget remain unchanged until a send.

**Extra run 3 final / reassessment:** unchanged package, explicit user extension,
process exit 1 after 300.79 s. Native watchdog recorded FAIL/timeout with runtime
cleanup. The original qualification-entry read again waited for OS access; the
fixture remained at its synthetic endpoint/model and never imported or sent a GET.
Two OS-auth waits have now failed; stop this hypothesis/run loop, with no automatic
renewal. The user-facing OS question is superseded by the terminal result. No native
proof process or HTTP request remains pending. Same-machine authentication/access
and any further Mac proof allowance need a separate explicit decision; Windows
cannot close these Mac gates. This is a capability/budget limit, not a provider
failure, no-network pass or completed both-target acceptance.

**Owned recovery:** retained pre-cleanup disposable records locally, then operational
fixture recovery disabled the profile and moved its owned reference to cleanup before
attempting native deletion. The attempt returned an exception and did not confirm
removal; retain one disabled profile/one cleanup reference. Exact exception category
was not retained, so do not infer whether deletion or subsequent publication failed.
The reference supports an idempotent explicit cleanup later. This ignored-fixture
recovery used a bounded same-host script, not application IPC, and is **not** product
removal/cleanup acceptance evidence. It never addressed/read/changed/deleted the
original qualification entry. Existing key/reference, raw evidence, source worktree
and stash remain; do not transfer secrets or claim recovered entries were deleted.

**Review and final verification:** owner reviewed core ordering/error reconciliation,
strict endpoint/discovery boundaries, native namespace/access flags, secret-free typed
IPC, transient readiness and UI action guards. No generation service, renderer host
privilege, project code execution, SDK or manual CI was added/run. Core **13 PASS,
0 FAIL/ignored** (245 unrelated filtered), frontend **97 PASS, 0 FAIL/skipped**,
desktop **1 PASS**, focused browser PASS with visually inspected light/dark wide/compact
screenshots. Artifact pattern scan **3 files PASS**; no key field or raw response is
saved/published. Repository validator and formatting/whitespace checks pass. Retained
initial allowlist/invocation/sandbox/auth failures are not replaced by later passes.
Signed upgrade, locked-login-store and installer behavior remain unqualified.

**Candidate/evidence:** implementation checkpoint
`19957189cd984596d7c75e81a11a707ef8f7b370`; all **97** packaged source/config hashes
still match aggregate `ad4250456ab2a6f0ccc8177e10d284e10f8fe6395300977f1ece5a97f08d9f1e`.
The same executable hash is
`c5619a9a0049b930d5363cbe9eab5080ec23e9f21bd8487e7977b2015b503b6a`.
Ignored `.toolchains/reports/studio-settings/` retains core/frontend/desktop/build/
browser/native logs, launch/exit records, screenshots, full input manifest,
pre-cleanup records and owned-recovery receipt. `mac-handoff-receipt.json` SHA-256
`45f902d016debd9316e8852181fc2ea75f1181f7ed80ec51b319e0c8745a597b`.
Evidence is host-local, not a branch-transfer artifact or a pass on another OS.

**Final cumulative allowance / handoff:** slice Mac builds **2 launched** (one
invocation FAIL, one package PASS); Mac native **3 launched** (one 9-check PASS,
two OS-auth timeout FAILs; run 3 was explicitly authorised). **Zero Mac builds/runs
remain.** Windows **0 builds/0 runs**, still **2 builds/2 targeted runs** available.
Discovery **0/4 sent**, all **4 combined GETs remain**, 15 s + 2 s cleanup per GET;
no automatic retry. Provider cumulative remains **22 HTTP/16 generations consumed;
18 HTTP/4 generations/343 s remaining**, 1457/1800 s conservative charge unchanged.
Generation stays excluded. Historical source counts Windows 2/2/3, Mac 3/3/3 unchanged.

Bounded Mac implementation and available proof are ready for same-branch transfer,
with missing Mac discovery/native removal/cleanup qualification explicitly retained.
Next Windows agent pulls the published successor, completes the Windows native
adapter/secure entry and focused proof under its unchanged allowance, reviews/fixes
in scope and records the remaining Mac gate. It must not request direct Mac access,
renew Mac/GET/provider budgets, claim full acceptance, start 2A.2, merge or release.
Canonical architecture/data/UI/testing docs and the approved mockup/prompt are updated.
CURRENT/HANDOVER replace the superseded preparation continuation; publication is
user-authorised and must be verified at the remote tip. No receipt-only SHA chase.
