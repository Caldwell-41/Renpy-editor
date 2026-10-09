# ADR 0013: Provider request and transport contract

**Status:** Studio-scoped reference/design accepted for the first bounded 2A.1 slice on 2026-10-08. Generic deferred; full live/production qualification incomplete.
**Date:** 2026-10-07.
**Prior authority:** the user accepted the corrected Studio disposition and selected the
first remembered-profile/settings/credential slice. Generation, project sends,
generic completion and screen implementation remain outside that selection.

## Context

[ADR 0011](0011-ai-settings-secrets-and-reference-storage.md) owns credential and
storage policy. Phase 2 needs concrete wire and lifecycle boundaries before settings
or request services are built. Compatibility attaches to an actual endpoint/model
configuration, not the label “OpenAI-compatible”. The isolated
[qualification spike](../../spikes/provider-qualification/README.md) is a contract
reference and deterministic test seam, not an application service.

## Studio-scoped decision and remaining proposed contracts

### Profiles, destinations and evidence

The core-owned profile contains `profile_id`, monotonic `revision`, kind
`unsloth_studio|openai_compatible`, label, canonical v1 base, selected exact model ID,
authentication `bearer|none`, credential mode/reference/revision, transport
`json|sse`, explicit tunnel/private-HTTP/proxy policy, effective context ceiling,
context budget, output allowance, sampling/thinking settings and capability evidence.
No secret or arbitrary extra headers/JSON are profile fields. Studio requires Bearer.
Unknown fields/newer profile versions refuse use without destroying existing data.

Normalize an origin to `/v1`; preserve a reviewed proxy prefix and append `/v1`
once. A terminal `/v1` is already canonical. Reject completion/model endpoint input,
repeated `/v1`, query/fragment, userinfo, malformed authority, backslash, percent-encoded
path ambiguity and dot segments. Build `/models` and `/chat/completions` below that
base; never use URL joining that discards a prefix. Scheme, lowercase host and
effective port define the credential origin. Path/policy changes also invalidate sends.

HTTPS verifies certificate and hostname. HTTP permits loopback or explicitly opted-in
RFC1918/IPv6 ULA destinations. Refuse wildcard, multicast, link-local, reserved and
public HTTP addresses; do not treat every library `is_private` address as LAN.
Resolve hostnames before dispatch and validate all answers, including IPv4-mapped
IPv6. Recheck ordinary DNS/address changes at connect time; changed address class or
approved destination set requires renewed review. The adapter must connect to the
validated address while preserving HTTPS hostname verification/SNI. This is ordinary
misrouting prevention, not a same-user hostile resolver race guarantee.

Disable redirects, automatic retries and ambient proxy discovery. An explicitly
configured proxy is separately reviewed as an intermediary; no proxy authentication
or arbitrary CONNECT policy in the initial adapter. Direct-only is the first qualified
path. A failed TLS check has no insecure fallback. Tunnel profiles select JSON before
send. Connection location, inference locality and provider retention are separate
disclosures; a loopback address does not prove local inference.

Evidence identifies profile/credential/config revisions, endpoint, installed version
or explicit unknown, model/quantization/backend where known, loaded context ceiling
or unverified user value, output-field mapping, response mode, transport, tool policy,
thinking/sampling support, probe input digest, client revision, timestamp and result.
Each capability is `pass|fail|unknown|unsupported`, with evidence and limitation.
Version/model/key/endpoint/proxy/transport/context changes invalidate prepared sends
and relevant evidence. Model refresh changing availability invalidates pending review.
No model alias substitution; only an explicitly measured alias mapping is permitted.

### Request and response ownership

Core prepares immutable `request_id`, project/session generation, action/allowed
targets, source/reference/prompt read revisions, profile/credential revision,
capability digest, schema version/digest, exact body bytes/digest, transport, limits
and locality disclosures. Renderer receives a redacted preview and an opaque send
token. Explicit Send consumes that token once after revalidation; opening a project
or receiving model text never initiates HTTP. Capture under a short read boundary;
release project locks before network I/O. One active generation per project; at most
two explicit diagnostic workers globally. No hidden queues, polls or repair calls.

Use `GET /models` for explicit discovery and `POST /chat/completions` for generation.
IDs remain unchanged; friendly labels are separate. A manual ID is explicitly
unverified until tested. Do not assume discovery lists installed/downloadable models
or that submitting an unloaded ID is free of model-management side effects. For this
synthetic qualification, invoke only the user's explicitly selected exact ID returned
by discovery and a clearly nonexistent synthetic ID. User-approved cold loading is
ordinary inference behavior; it is not permission for a management API or another model.
Record resident state as unknown if unavailable rather than fabricate confirmation.

Outbound messages contain the reviewed system/task/context snapshot. A schema request
uses `response_format.type=json_schema` and a named, closed `json_schema` with
`strict=true`. `json_object` or text JSON is a distinct explicit generic capability;
no silent downgrade. The tiny spike schema exercises the future proposal envelope;
2C.1 owns the full action schema, semantic planner and transaction proof. Keep that
schema resource separate from provider adapters. No tools/function definitions or
client tool loop. Studio bodies always set `enable_tools=false` and
`enabled_tools=[]`, omit `session_id`, and reject returned tool calls/results.
Generic bodies omit Studio extensions; only qualify `tool_choice=none` if required
and accepted by the chosen server. Never add tools to make a server accept a request.
Record acceptance of disable fields and absence of returned tool activity separately
from internal/server-wide suppression. Without provider monitor/configuration evidence,
that stronger guarantee remains unknown and cannot be implied by a benign response.

Output mapping is profile capability data: Studio's documented candidate is
`max_tokens`; generic may require `max_tokens` or `max_completion_tokens`. Send one
qualified field, never both. Thinking `default` omits the override; Studio candidate
on/off maps to `enable_thinking=true|false`. Generic thinking requires its own
documented, measured mapping, otherwise it stays unavailable. Sampling fields are a
typed, qualified allowlist. No invented server-context resize parameters.

The measured Studio candidate uses explicit thinking **off**, `max_tokens=1024`,
sampling omitted, direct private-LAN HTTP. Closed-schema JSON with protected tokens
and harmless tool-disabled prose, plus literal-fixture SSE, passed. Normal completion,
model identity, no tools and whole-document validation remain mandatory. Thinking
on exhausted both 256 and 1024 output tokens without a usable final answer; default
at 256 also failed. Keep on/default evidence distinct; never silently change modes.
Thinking-on SSE remains unqualified because the successful-JSON prerequisite failed.
Output allowance includes reasoning where applicable; it is not final-answer length.
The recorded thinking failures are output-cap truncations, not evidence that thinking
is unsupported. T03 explicitly sent `max_tokens=1024` and reported 1024 completion
tokens with `finish_reason=length`; no `max_new_tokens` wire field was sent. Current
upstream resolves the Chat Completions output field into the backend generation cap,
but the installed backend mapping and a larger thinking allowance remain unqualified.

Configuration: exact `unsloth/gemma-4-12B-it-qat-GGUF`; API-advertised quant
`UD-Q4_K_XL`, loaded=true after ordinary inference, runtime/native/advisory context
metadata each 262144. User reports Studio v0.1.902-beta and UI context 262144.
Installed backend/kernel and effective sampling values remain unknown. Metadata is
not a maximum-workload capacity pass. Tiny fixture preflight uses local total budget
4096, conservative full-body byte token estimate plus visible margin plus output
1024 <= budget <= advertised ceiling. No per-request context resize is sent.

Actual JSON and partial-SSE client cancellation released owned workers within the
2 s cleanup target, with no proposal published; post-JSON-cancel discovery succeeded.
These qualify this isolated Python client's transport ownership, not server-stop,
production async adapter, Save responsiveness or deadline/cold-capacity guarantees.
The existing ledger preserves prior failures, incomplete evidence and generic deferral.

Success requires HTTP/protocol completion, one choice/index, allowed returned model
identity, `finish_reason=stop`, no refusal/tools, and bounded nonempty final content.
Missing/unknown finish reason, `length`, interrupted stream or refusal cannot become
a proposal. Parse one entire JSON document: no Markdown stripping, regex extraction,
duplicate keys, NaN/Infinity, heuristic repair or code execution. Validate schema,
operation bounds, references/dependencies and all revisions before preparing edits.
Usage is optional; missing is unknown, not zero. Reasoning is separate bounded data,
never a source of proposal text. A response cannot enlarge the target/action allowlist.

Generated display prose is literal for both source and Ren'Py display syntax.
Existing reviewed interpolation/formatting is protected by core-owned opaque tokens
bound to target revision. Refuse altered, reordered, duplicated, removed or invented
tokens and unsupported target boundaries. The qualification fixture verifies the
wire boundary only; it does not emit `.rpy` or claim SDK literal-display evidence.
Cards/lore remain metadata prose. [Phase 2 section 7](../tasks/active/phase-2-initial-llm-assistance.md#7-structured-proposals-and-source-preparation)
owns the generated-text boundary and first-rewrite gates.

### Transport, states and resource limits

Initial product limits proposed for review: connect 10 s, SSE no-progress 180 s,
generation total 600 s (profile override 30–1800 s), outbound body/final text 2 MiB
each, response bytes including reasoning 8 MiB, SSE line/event 256 KiB, JSON depth
32, maximum 256 operations. Non-streaming uses the total deadline for no-progress.
Every byte/event is bounded before assembly; limits reject, never silently truncate.
These are application bounds, not live-confirmed model capacities or latency promises.
Live qualification uses the stricter deadlines in the probe plan.

Require an effective context ceiling if introspection is unreliable; label user values
unverified. Estimate all messages/framing/schema plus reserved output and a visible
margin of max(128 tokens, 10% estimated input rounded up). A tokenizer-specific
improvement can replace estimation only with evidence. Enforce estimated input +
margin + output <= configured total budget <= known/effective ceiling. Reasoning may
consume output/context allowance. Never drop context, clamp limits or reload models.

States are `prepared -> sending -> receiving -> validating -> review_ready -> consumed`.
`failed`, `cancelled`, `expired` are terminal alternatives before consumption.
Cancellation competes with final publication under the same request/session guard;
cancelled/replaced sessions never publish late review. Abort socket/reader/task, remove
request registry entries and release buffers within a 2 s client cleanup target.
Project close cancels its work; app exit clears session credentials. Do not claim
server computation/billing stopped unless separately documented and observed. Spike
fixtures prove ownership ordering; actual JSON/SSE client cleanup is recorded separately.
Production adapter cancellation remains a 2A.2 gate.

SSE is optional and separately qualified: require `text/event-stream`, incremental
strict UTF-8 decoding, CR/LF/CRLF and split-boundary handling, comments/heartbeats,
multiline data, bounded events, one index/model, final finish reason and `[DONE]`.
Accept only qualified reasoning/content fields. Reject tool/error/unknown named events,
conflicting terminal chunks, nonempty data after completion and EOF without completion.
Partial JSON stays transient, never reviewable. Heartbeats do not extend semantic
no-progress; a hard total deadline applies even to endless valid progress.

### Credential and error contracts

Native entry returns `configured|missing|unavailable`, mode and opaque reference only.
Remembered namespaces proposed for 2A.1 derive from the current bundle identifier:
service `app.loomlight.desktop.ai`, entry `provider/<profile UUID>/<credential UUID>`,
distinct test service `app.loomlight.desktop.ai.test`. macOS uses a non-synchronizable
generic password in the user's login Keychain with native application access control;
do not assume iOS-only accessibility flags qualify macOS behavior. Windows generic
credential uses local-machine persistence. Qualify package identity/reopen/update
behavior on both targets before claiming production storage. No automatic plaintext
or session fallback. Do not retrieve Studio's credential database.

Replacement prepares a fresh key/reference, safely publishes the profile, then retires
only the old owned entry. Failed publish retains the old usable state and cleans up
the staged key. Cleanup failure retains a nonsecret reference for explicit bounded
retry. Removal disables sends first, then deletes; no other profile's entry is touched.
Session/no-auth changes use the same publish-before-retire order. Key changes invalidate
prepared sends/evidence. Local removal is not provider revocation. Native errors expose
categories, not key values. The spike implements only a user-requested macOS qualification
credential seam: explicit native Remember, separate test-service Keychain entry and
origin-bound nonsecret reference. Disposable round-trip/read in a second process/delete
passed on this host. This is not a production packaged adapter or 2A.1 implementation;
production identity, native replacement/removal and Windows behavior remain gates.
The corrected seam saves the owned nonsecret `.pending` reference before adding the
key and publishes it only after store verification. Failed cleanup retains that record
and the primary fixed failure category; startup refuses entry/use while it remains.
One explicitly selected cleanup attempt validates ownership before deleting that entry
and removes the record only on success. No automatic cleanup, key export or real-key
removal was performed during the portable correction; native recovery execution is unqualified.

The selected Windows adapter retains shared fixed legacy/current services, with
targets `<service>/provider/<profile UUID>/<credential UUID>` and an ownership digest
bound to origin/revision/reference. New Windows entries use the legacy service;
namespace changes are not implicit. Credential Manager's 2560-byte blob bound causes
an explicit native save refusal above that limit, retaining input. App-owned masked
entry, Retry/Cancel, transactional switching, unsupported Mac-file retention and
fixed-loopback discovery use production desktop services. The Windows ledger owns
bounded packaged proof; this does not qualify real Studio, generation, generic,
every future build or clean-OS reinstall behavior.

HTTP diagnostics retain status, safe category, elapsed time, byte/token counts and
opaque request ID only. Never surface raw server error bodies, headers, URLs with
secrets, prompts/replies/reasoning or exception representations. Classify 401/403 as
auth, 429 as busy/rate limited, 3xx as refused redirect, 5xx as provider failure;
model/field errors require a validated bounded provider-specific code, not status alone.
Refuse unexpected tools, malformed JSON/SSE, over-limit output, truncation and stale
completion with distinct categories. Preserve author's draft on every failure.
Client cancel and server-stop evidence are separate. No automatic Retry-After handling.

## Selected synthetic production subset — 2026-10-09

The user selected completion/cancellation of a bounded authenticated synthetic Studio
JSON request on Mac using the accepted remembered profile/credential slice. The
implementation supports literal-loopback HTTP only, with no hostname resolution,
proxy, TLS fallback, redirects, connection pooling or automatic retry. Other saved
destinations explicitly refuse before sending; the broader destination/TLS contract
above remains unqualified. Preserve the approved Mac encrypted-file development
storage, its same-login limitation, deferred native ownership and signing identity.

The fixed synthetic text diagnostic intentionally sends no project content, schema,
proposal or tool loop. It captures exact profile/credential/configuration and project
session plus body/limits in core/native memory. A dedicated worker releases the
application service before I/O. One global active worker is stricter than the proposed
per-project maximum; terminal status is bounded to one memory-only result. A cloned
owned socket supports shutdown during blocked header/body reads; the one literal
loopback connect attempt has a 1-second bound (also bounding cancellation before a
socket exists). Response deadline is 30–1800 seconds, default 600. The existing
2/2/8 MiB body/text/response and depth-32 bounds are enforced, with 32 KiB headers.
The request panel shows the byte-based input estimate, margin and response reserve;
user capacity is unverified. Reported usage that exceeds response/context bounds
also refuses. Missing usage remains unknown.

Synthetic states are `sending -> receiving -> validating -> completed`, with failed,
cancelled and expired alternatives. `completed` supplies literal diagnostic text,
never an applicable proposal or `review_ready` edit. Cancellation, configuration/
project changes and shutdown arbitrate final publication through one native guard.
Worker completion drops the agent/socket/body/credential before publication; bounded
terminal text/status may remain in memory until replacement/cancel/shutdown. Native
Save responsiveness and client resource cleanup require actual packaged target proof.
This selection excludes SSE, general providers/auth modes and live Studio compatibility;
it does not close full 2A.2 or Phase 2. Windows requires focused affected-request proof,
without repeating unchanged remembered-credential qualification.

## Qualification and alternatives

The [Studio contract review](../tasks/archive/2026-10-09-phase-2-execution-history.md#studio-qualification-contract-review--2026-10-08)
verified all 22 input digests and retained live results, but found uncovered candidate
defects in malformed-response classification, failed credential cleanup recovery and
nonfinite-number parsing. The [correction and owner review](../tasks/archive/2026-10-09-phase-2-execution-history.md#studio-review-corrections-and-owner-review--2026-10-08)
closes R1–R3 with 61 portable passes and original-candidate rejection checks. The
corrected Studio reference was accepted for the bounded first 2A.1 slice. Full
generic/live/production qualification is not inferred. The
[slice continuation](../tasks/archive/2026-10-09-phase-2-execution-history.md#first-studio-settingscredential-slice--2026-10-08)
owns partial implementation and the native-access prerequisite.

The [existing ledger](../tasks/archive/2026-10-09-phase-2-execution-history.md#25-provider-qualification-ledger--2026-10-07)
owns actual configuration, planned probes, counts and results. Missing endpoint access
is incomplete evidence. Deterministic checks cannot qualify Studio, generic, TLS,
server tool suppression, server cancellation or production native credentials.
User-managed model loading/switching stays the baseline; management APIs require a
documented public contract and separately selected follow-on. No new dependency,
provider installation, download, native build, SDK run or CI is selected here.

Current core uses pinned `ureq` 3.1.4 for a synchronous SDK-download path with
redirects refused and a global timeout. That path is not a proved cancellable generation
worker. 2A.2 must demonstrate aborting a stalled read, cleanup and validated-address/TLS
binding at the chosen adapter seam before retaining it or proposing a dependency change.
Transitive `reqwest` in the lockfile is not an existing core request service. No transport
dependency was added or replaced during this spike.

Upstream wire references checked 2026-10-07: [Unsloth HTTP guide](https://unsloth.ai/docs/integrations/connect-curl-and-http-to-unsloth)
documents discovery, output/thinking fields and server tool controls; [Unsloth Python guide](https://unsloth.ai/docs/integrations/connect-python-sdk-to-unsloth)
documents schema responses; [Unsloth API overview](https://unsloth.ai/docs/basics/api)
documents monitor visibility and tunnel limits. [OpenAI Chat Completions reference](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)
defines schema mode and output-limit fields; it is no proof of a compatible server.
All numeric client bounds, lifecycle/credential details and validation policy above
are Loomlight design proposals, distinct from upstream claims.

Settings research additionally checked the [official request schema](https://github.com/unslothai/unsloth/blob/main/studio/backend/models/inference.py)
and [discovery implementation](https://github.com/unslothai/unsloth/blob/main/studio/backend/routes/inference.py).
Current-source optional context/loaded metadata and extra sampling fields are
version-dependent candidates, not installed-version or stable external API proof.
No internal status or management route is adopted. The selected
[model card](https://huggingface.co/unsloth/gemma-4-12B-it-qat-GGUF) describes native
capacity/sampling; those are not measured loaded settings. Preserve strict whole-JSON
validation despite the public Python guide's example stripping Markdown fences.
