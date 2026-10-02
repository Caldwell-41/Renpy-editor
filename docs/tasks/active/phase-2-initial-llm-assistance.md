# Phase 2 — Initial LLM assistance

**Planning date:** 2026-09-22; delivery sequencing reviewed 2026-10-02.
**State:** detailed planning checkpoint; implementation not started or authorised.
**User direction:** review and plan Phase 2 without touching existing Phase 1 work; add Unsloth Studio as a first-class provider and incorporate the reviewed suggestions.
**Owner:** this brief owns Phase 2 scope, requirements, checkpoint gates and planning continuation. [ROADMAP](../../ROADMAP.md) owns phase boundaries.
**Entry:** accepted Phase 1 through 1H, fresh inspection of actual refs/state, and explicit approval of one bounded Phase 2 checkpoint.
**Isolation:** preserve Phase 1 code, tests, workflows and acceptance ledgers. The original September publication also left CURRENT/HANDOVER untouched. The October concurrent-planning branch adds only a short planning note there, preserving the active Phase 1 continuation; it does not claim or alter Phase 1 acceptance.

## In plain language

| Part | What you can do when it is complete |
| --- | --- |
| 2A — Connect and configure | Choose a provider/model, securely configure access, set context and maximum response tokens, test the connection and cancel a request. |
| 2B — Give the LLM the right references | Write/edit Character cards and a lorebook, choose which approved entries to include, edit system prompts or restore the baseline, and inspect the complete context before sending. |
| 2C — Generate, review and apply | Rewrite/continue/create Scenes, generate or update Character cards and lore entries, review changes, accept a valid subset and undo them. |

**At the end of Phase 2:** write with an LLM that receives your selected character
and world references, under prompts and size limits you control. Generated game
changes and reference material become durable only through your review. These are
capability summaries; section 14 orders a small complete rewrite across the underlying
checkpoints early, followed by the remaining actions and provider coverage.

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
| U3 | Native secret entry; OS credential storage; core injects Bearer authentication. Never read Studio's credential database, scrape its console or retain API keys in renderer/project/config/log data. |
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

Keep privileged effects in Rust/core and the trusted desktop host. Add narrow services for provider profiles, credential references, request execution, context assembly and proposal preparation. Keep the existing IPC envelope and deny-by-default WebView capability model. Renderer actions reference opaque configuration/request/proposal IDs; no generic HTTP, shell or filesystem capability.

Candidate module boundaries, to confirm against accepted Phase 1 before coding:

- core llm/provider, llm/request, llm/context, llm/proposal and lore modules;
- desktop native credential UI/OS-store adapter and background-request integration;
- renderer assistance/context/proposal-review modules and existing semantic theme tokens;
- versioned prompt resources and strict response schemas;
- deterministic provider fixtures plus a bounded live compatibility runner.

Keep existing HTTP infrastructure if it meets cancellation and streaming requirements. Add or change a dependency only after a documented gap/licence review; do not conduct a broad stack replacement.

A provider profile stores a UUID, provider kind, label, canonical endpoint, optional selected model, credential reference, transport choice, capability evidence and bounded generation settings. Profiles/secrets are machine-local; project metadata may reference a non-secret logical profile without copying machine addresses or credentials. Moving a project requires resolving an unavailable profile explicitly.

Credential entry, replace and delete use native controls. OS-store failure is actionable and cannot fall back to plaintext. Renderer sees only configured/missing/unavailable state. Key changes invalidate prepared sends. There is no read-secret IPC. Memory/swap/OS internals are not claimed perfectly secret.

Endpoint policy: permit HTTP on loopback; require verified TLS for ordinary non-loopback connections. Plain HTTP to a user-controlled private-network/VPN endpoint requires a distinct opt-in with clear transport disclosure, tested address classification and an ADR before implementation; never globally disable TLS verification. Show connection location and inference locality separately, including unknown. Do not infer confidentiality from a hostname. Reject credentials in URLs, unsupported schemes and unreviewed redirects; bind the credential to the exact reviewed origin. Explicitly govern proxies and DNS/address changes so credentials cannot be redirected silently. No endpoint is imported or activated from project/model text.

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
baseline version and whether the current prompt is customized; app updates never
silently overwrite saved customizations. Reset restores that version's bundled text
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

A prepared-send token binds the exact request body, profile/model/capability configuration, read-set revisions and disclosure. Send rechecks that token before dispatch. Relevant edits require rebuilding and reviewing; unrelated changes should not invalidate a provably unaffected request. Never rebuild silently after consent.

## 7. Structured proposals and source preparation

Use a versioned, closed proposal schema with typed semantic operations and proposal-local references. Core owns real UUID allocation and source/path derivation. Initial operation families are dialogue/narration replacement, supported beat insertion, one Scene creation, reviewed terminal/edge replacement, runnable Character creation/update within scope, and Character-card/lorebook entry proposals. Approval is an explicit user operation; model output cannot approve itself.

Responses cannot choose arbitrary paths, patch custom source, rename technical identifiers implicitly, execute code, import assets, invoke tools or write outside the allowed target set. Enforce existing string/metadata/integer/source bounds, including exact decimal representation for large integers.

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

## 10. Checkpoint sequence and gates

These are dependency checkpoints, not mandatory chat boundaries. Select one coherent
outcome with internal implementation/test/review checkpoints under [WORKFLOW](../../WORKFLOW.md);
resume that same outcome/chat after a wait. All implementation states remain `not_started`.
The original provider requirements and approval boundaries remain; planning does not
authorize provider connections or execution.

| Checkpoint | Deliverable | Acceptance and next boundary |
| --- | --- | --- |
| 2A.0 — Provider qualification and contracts | Bounded synthetic Studio/generic probes; version/capability matrix; request/credential/transport ADR; confirm limits and management-API findings. | Record actual success/failure/unknown per provider. Prove Studio schema mode and tools-disabled behavior or record a blocker. No project sends. Return for review before production integration. |
| 2A.1 — Settings and credentials | Two provider types, native credential entry, explicit context/response settings, connection/model tests and Unsloth-specific setup/readiness/error UX. | Native credential round-trip/delete/locked-store behavior, zero secret reflection, no requests on project open, origin binding and profile invalidation. |
| 2A.2 — Request service | Background transport, non-streaming and qualified SSE, cancellation/timeouts/resource bounds, settings mapping and usage results. | Delayed/out-of-order responses, cancellation races, dead server, bad auth, request limits and Save responsiveness. Test each adapter without project writes. |
| 2B.1 — Context and prompts | Manual Character-card/lorebook storage and editing, deterministic manifests, budgets, dependency disclosure, revisions/provenance and system-prompt editing/baseline reset. | Golden payloads; exact selected card/lore revisions; prompt edit/reset/undo/reopen; no whole-project leakage; bounded route cycles; no silent truncation; input/output budget accounting. |
| 2B.2 — Assistance and send review | Five action entry points, context/destination preview and request snapshot binding. | Exact reviewed payload sent once; relevant changes force renewed review; sensitive/locality disclosures; session and pending-draft safeguards. |
| 2C.1 — Proposal planner | Strict schemas, semantic/dependency checks and non-mutating batch-to-patch preparation. | Malicious/invalid output writes nothing; same-file batch edits, new IDs, terminal constraints, Unicode/custom preservation and exact previewed mutations. |
| 2C.2 — Proposal acceptance | Semantic/file review, dependency-valid subsets, stale rejection, one transaction/undo and explicit transient lifetime. | Core/renderer/native acceptance, duplicate-click/retry protection, concurrent drafts, external edits, interrupted-acceptance recovery using non-crashing fault/state fixtures, no partial success claims. |
| 2C.3 — Character and lore completion | LLM draft/update of Character cards and lorebook entries, separate runnable definitions, statuses, provenance and approvals on the manual foundation from 2B.1. | No implicit lore approval or source execution; migration/reopen, stale citations, missing entities, repeated undo/redo and metadata-free game behavior. |
| 2C.4 — Integrated acceptance | Real authoring workflow through every action/provider and supported client target. | Required matrix below passes; remaining limitations explicit; stop for independent review rather than automatically merging/starting Phase 3. |

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

## 12. Entry risks and decisions

| Issue | Disposition |
| --- | --- |
| Phase 1 is not accepted | Blocks implementation entry, not this plan. Preserve its existing workstream. |
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

The user selected planning Phases 2 and 3 while Phase 1G continues. This is a docs-only
successor to the original four-file publication scope in section 13. Branch:
`codex/phase-2-3-planning`, based on `de2fdad`; no existing provider requirement is
removed and Phase 1 through 1H remains the implementation prerequisite.

**First usable result:** explicitly select dialogue, inspect its destination/context,
generate a rewrite using a manually authored card and selected lore entry, inspect
exact changes, accept and undo it. Include prompt editing/reset and size controls.
Prove that complete
path early with one qualified provider before expanding to all five actions. This
orders work; it does not reduce the final two-provider or five-action commitment.

| Outcome | Existing checkpoints covered | Reviewable result |
| --- | --- | --- |
| Provider feasibility | 2A.0 | Measured compatibility of available Studio/generic configurations; credential/request ADR and concrete production plan. |
| First safe rewrite | Necessary parts of 2A.1–2A.2, 2B.1–2B.2 and 2C.1–2C.2 | One complete rewrite using selected manual cards/lorebook, editable/resettable prompts and size controls, with native credentials, revision checks, strict proposal review, one transaction and undo. |
| Scene and provider completion | Remaining provider coverage plus continue/draft Scene and dependency-valid acceptance | Real authored scenes and selected subsets; no hidden source changes or silent provider fallback. |
| Character and lore | 2C.3 plus related context/actions | LLM-generated/updated Character cards and lorebook, separate runnable Character proposals, explicit approval, provenance, invalidation and reopen. |
| Milestone acceptance | 2C.4 | Five actions, two provider paths and both client targets with honest live evidence and known limitations. |

The first rewrite outcome needs a bounded execution brief after 2A.0; it is not
permission to implement all transport modes or proposal families at once. Non-streaming
is the first path. Optional SSE follows only after separate qualification. Required
selected-context, credential, revision and acceptance checks cannot be postponed as
polish to accelerate that demo. Cross-reference checkpoint IDs in the execution ledger
so early shared work is not reimplemented or retested without changed inputs.

The main uncertainties are actual provider capabilities and multi-operation source
preparation. Prove a small batch touching the same file before expanding proposal UI;
retain operation grouping, stale rejection and one undo entry. Phase 0's
[credential spike](../../research/CREDENTIAL_STORE_SPIKE_RESULTS.md) is supporting
evidence only: production native secret entry, unavailable/locked-store handling and
packaged identity behavior need their own affected-target checks. Do not repeat the
stack comparison or claim the old no-renderer probe qualifies new settings UI.

Recheck official provider documentation and installed versions at 2A.0; section 2
records September research, not a newly verified compatibility claim. No provider
was contacted in this October planning task. Availability of suitable inference hosts
and models is unresolved. Missing live access is a recorded gate, not an implicit
permission to install models, spend money or substitute mocks for required evidence.

Apply ADR 0010 and current TESTING selection: retain ordinary external edits and
interrupted acceptance with non-crashing fixtures, avoid retired specialist experiments,
prove real user-action boundaries and gate rejection, and keep cumulative problem
budgets. Agent-owned checks cover development; physical user review is limited to
genuinely human interaction/visual acceptance. No native builds are needed for planning.

Phase 2 is complete only at its existing integrated gate. Then
[Phase 3](phase-3-initial-wysiwyg-release.md) begins with richer Story logic followed
by Screens, as selected by the user. New Phase 3 constructs do not silently expand
Phase 2's permitted proposal operations or imply state/reachability knowledge.

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
