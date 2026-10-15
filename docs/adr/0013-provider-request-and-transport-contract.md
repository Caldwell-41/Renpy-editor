# ADR 0013: Provider request and transport contract

**Status:** Studio-scoped reference/design accepted for the first bounded 2A.1 slice on 2026-10-08. Generic deferred; full live/production qualification incomplete.
**Date:** 2026-10-07.

## Generation-time Studio readiness — 2026-10-15

The [approved redesign task](../tasks/active/walkthrough-redesign-implementation.md)
selects a capability/response-contract model-management adapter for Unsloth Studio.
The user explicitly rejected exact-version acceptance gates. Implementation is local;
owner setup and rewrite/include passed, while remaining action and final both-host
evidence are pending. It changes no provider/credential/signing
policy. Saving, Settings open and explicit inventory refresh never load a model.

Production native generation calls `execute_ready`. Authenticated management calls
and chat share the captured credential/destination, cancellation socket owner and one
absolute request deadline, with no proxy/redirect/retry. Fixed stages expose checking
model, loading model, sending, receiving and validating; requested versus successfully
observed actual context is read-only. An already-loaded matching model with sufficient
actual capacity for the prepared input estimate, margin and response reserve is reused
without a load or reload. A different requested context or load preference produces
a visible warning; it does not fail a request that fits. Unknown capacity, an actual
request that exceeds capacity, another resident/loading model or contradictory identity
still refuse before chat.

Automatic loading validates the common published response contract, independently
researched in official source commits
[`1b588389`](https://github.com/unslothai/unsloth/tree/1b588389b488eb9f8a9cb8ad5ca3073c7661f073/studio/backend)
and [`133a8076`](https://github.com/unslothai/unsloth/tree/133a8076d10aa109f812f85a953636b3488926f6/studio/backend).
These source versions establish evidence, not an acceptance allowlist. `/version` and
the prebuilt installation marker are diagnostic information, not load prerequisites.
The owner diagnostic observed a compatible idle status and v0.1.907-beta; the old
902-only gate would refuse that current state. The task ledger owns qualification.

Required loaded/loading arrays, identity/context fields and authenticated inventory
must establish no observed resident or loading model before cache lookup. Explicit
hidden ownership refuses. If serving/serving_checkpoints are supplied, both must be
valid parallel arrays: empty for loading, one matching primary for reuse/final context.
The primary's context must never be attributed to an aggregate extra slot. Unknown
or malformed relevant contract fields refuse; unrelated extensions remain ignorable.
A completely available GGUF variant must resolve through
`/api/models/cached-model-path` to an absolute local `.gguf` file, not a repository or
directory. After another empty-status check, `/api/inference/load` receives that file,
the requested context, engine auto, alongside/force-alongside false and false
force-reload/force-cancel/trust-remote-code flags. Explicit saved model-load preferences
and recognized server overrides are projected as described below; legacy absent local
preferences preserve the earlier load path. Optional reported evictions must be an
empty array; this detects a report after
the operation and cannot undo it. The reviewed local-file backend
refuses an absent file rather than switching to its separate HF download branch.
No model download, Unsloth Studio process management or intentional resident replacement.
An absent ordinary llama-server binary raises a typed load failure with installation
instructions; these reviewed paths do not install it. A missing prebuilt marker alone
does not prove binary absence. The bare repository-ID cached-GGUF flow is supported;
automatic pinned-variant/model-targeted/multi-model loading remains unsupported.
The cache row's `task` is capability classification, not download activity: explicit
`text-generation` and legacy absent/null rows are eligible; media/unknown/malformed
tasks refuse. Separate `partial` evidence must be absent/null/false, never malformed.
The official [classifier](https://github.com/unslothai/unsloth/blob/133a8076d10aa109f812f85a953636b3488926f6/studio/backend/hub/services/models/catalog_classification.py#L282-L341)
and [cache row](https://github.com/unslothai/unsloth/blob/133a8076d10aa109f812f85a953636b3488926f6/studio/backend/routes/models.py#L5295-L5306)
own this distinction; fixture null alone was insufficient evidence.

An HTTP200 alone is insufficient: late-error envelopes/refused load results and a
fresh insufficient/unconfirmed status cannot advance to chat. Cancellation closes
only Loomlight's owned socket; server-side loading may continue. The vendor API has
no atomic expected-empty precondition: the immediate status recheck diagnoses observed
conflicts but cannot guarantee an idle other-client load will not race that observation.
Active-generation refusal is enforced by the vendor lifecycle gate before teardown.
Incompatible observed interfaces give a diagnosis before chat; compatible Unsloth Studio
updates do not require an application release merely to pass a version check.
Existing discovery IDs remain available; loaded/context metadata is
optional read-only evidence, not a second editable capacity setting.
Visible-slot observations are bounded by the single-user support model; managed foreign
slots or teardown remnants can be hidden by the server. No global empty-state guarantee
or atomic expected-empty promise is inferred from these observations.

### Configurable model-load preferences — 2026-10-15

AI Settings exposes parallel slots, GPU memory mode and automatic fitting, using the
existing single Context length. Suggested defaults are32768 tokens,1 slot,manual GPU
mode and fitting off. These remain editable preferences, not strict achieved-state
requirements. Optional `modelLoad` profile data is materialized only by an explicit
local Save; absent legacy records remain readable without a read-time write. No CPU
thread counts or fixed GPU-layer counts are introduced. Sampling and exact ordinary
chat-completion bodies retain their existing contract.

Separate `ai.readModelLoadSettings` and `ai.applyModelLoadSettings` accept only a saved
profile ID and profile-store token. They use its existing native credential and
captured approved destination through the bounded shared transport; no renderer URL,
credential, arbitrary method or raw provider response crosses IPC. Apply requires
saved preferences, verifies the real selected model/quantization, reads and reconciles
the current override, writes only the selected quant's entry via
`PUT /api/settings/openai-auto-switch/overrides`, then separately reads loader-resolved
state. It preserves recognized unrelated fields/custom flags and leaves bare fallbacks
and other quantizations intact. Unknown fields or unsafe flags refuse preservation
instead of silently dropping them. The server lacks revision/CAS; immediate recheck
and read-back detect observed changes without promising an atomic external-editor fence.

Management runs only on explicit Read/Apply. Local profile Save and ordinary chat
completions never write overrides. Apply persists future-load settings and never
reloads/unloads the current model. Loomlight refuses management during its active
generation without cancelling that generation, blocks new requests while managing,
and cancels its owned management socket on profile/project change or shutdown. Loss
of a write response is an uncertain outcome: read again before applying, with no
automatic retry. The global automatic-switching flag is read-only; unavailable owner
permission is unknown rather than disabled. A disabled/unknown flag produces an
explanation, and Loomlight never silently enables it.

Requested, saved and actually loaded values are shown separately. Omitted runtime
values remain unverified. Source-verified manual-load paths can strip `--fit` even
when the override stores it, so saved fit off never proves an effective strict fitting
policy. Both researched [manual flag handling](https://github.com/unslothai/unsloth/blob/133a8076d10aa109f812f85a953636b3488926f6/studio/backend/routes/inference.py#L18499-L18553)
and the [runtime fields](https://github.com/unslothai/unsloth/blob/133a8076d10aa109f812f85a953636b3488926f6/studio/backend/models/inference.py#L1799-L1956)
own that limitation. Warnings retain generation/proposal review when the prepared
request fits actual capacity; a genuine admission/load/authentication failure remains
an error. No specific Unsloth Studio version is an acceptance gate.

**Current closeout disposition, 2026-10-12:** Phase 2 is Studio-only. The selected
literal-HTTP/nonstreaming/off-only client slices are qualified; full-phase scope and
final integrated acceptance remain incomplete. The
[closeout map](../tasks/active/phase-2-initial-llm-assistance.md#studio-only-closeout-entry-audit-and-requirement-map--2026-10-12)
identifies missing configuration-bound capability readiness, editable sampling and
the unresolved full-phase TLS/hostname boundary. The LAN amendment's exclusions apply
to that slice, not automatically to the entire phase. Thinking-on/default failures,
unknown server-internal tools and all other exact evidence limits remain intact.
The user's subsequent decision selects local Temperature/Top-p implementation with
saved creative-writing defaults1.0/0.95 and finite bounds0–2/0–1. Both fields are visible
in exact reviewed action bodies; saved changes invalidate prepared sends through the
existing profile revision/token. Legacy absent fields remain omitted until explicit
profile Save, with effective defaults used for new reviewed sends. Installed-Studio
sampling acceptance and both-target native qualification remain pending. No capability,
TLS, thinking-mode or provider expansion is selected by this change.
The user's subsequent 2026-10-12 decision defers AI changes to existing Scene endings
and story connections beyond Phase 2. Continue preserves its ending; Draft creates
an unconnected Scene with Return. Terminal validity remains required. The wider
operation family is possible future separately selected work, not a closeout blocker.
**Prior authority:** the user accepted the corrected Studio disposition and selected the
first remembered-profile/settings/credential slice. Generation, project sends,
generic completion and screen implementation remain outside that selection.

## Remaining Studio closeout changes — 2026-10-12

The user subsequently defers selected-route context as well as AI ending/connection
changes and directs implementation of the remaining items 2–5. This supersedes the
earlier unselected readiness/TLS disposition above. The local implementation adds
explicit **Test setup**, configuration-bound saved readiness, verified HTTPS generation
and hostname resolution. It keeps one saved credential reused across sessions and the
existing approved Windows/Mac storage and package identities. Native/Windows/live and
final integrated acceptance remain pending; local fixture success is not Studio proof.

Test setup shows its complete tiny synthetic closed-JSON request, with strict schema,
tools disabled, thinking off, nonstreaming response and the saved sampling/output
settings. It sends only after an explicit click, through the existing single owned
worker, cancellation, timeout, credential-origin and publication guards. It records
success only for the exact closed `{"ok":true}` response. Evidence binds the profile,
normalized endpoint, exact model, credential reference/revision, settings and preflight
contract version. Settings/key changes and changed/unavailable discovery retire it;
opening Settings/project or preparing a send never probes automatically. Project
preparation requires readiness. Cancellation/configuration change cannot publish;
an already durably completed probe wins a late cancellation truthfully. This proves
only observed protocol compatibility, not server-internal tools, loaded context,
backend/version, writing quality or every action's correctness.

Generation validates every resolved address, captures a sorted bounded set in the
one-use review and shows the reviewed addresses. The worker re-resolves before send
and refuses a changed set. Native resolution occurs outside the project mutation
lock; globally at most one bounded OS resolver worker exists. DNS, connect, TLS,
reads, partial writes and final validation share one absolute request deadline.
Production uses the pinned WebPKI roots with certificate/hostname verification and
no insecure fallback, trust installation, proxy, redirect or retry. Only isolated
tests trust the public synthetic fixture CA. Plaintext remains literal loopback or
explicitly opted-in RFC1918/ULA. Literal IPv6 HTTPS is explicitly unsupported because
the pinned ureq3.1.4 adapter cannot validate its bracketed certificate name; HTTPS
DNS names resolving IPv6 and literal IPv4 HTTPS retain verification. This limit is
reported, not bypassed by disabling TLS or replacing dependencies.

Any live Test setup counts toward the existing ten-send ceiling, separately from
the five action counters. No live preflight or generation has occurred in this
closeout. Fresh native credential entry and the exact selected Studio configuration
are required before owner-machine live qualification; CI gets only public fixtures.

## Studio-only production LAN amendment — 2026-10-11

The user approved the required Studio LAN completion and explicitly deferred generic
qualification. Shared non-streaming production generation admits literal RFC1918/IPv6
ULA HTTP only with saved private-HTTP opt-in, alongside loopback. The same pure address
helper owns passive Assist preparation and native request admission. It preserves
credential-origin/configuration binding, exact SocketAddr connection, no DNS, ambient
proxy, redirect or retry, and bounded socket cancellation. Review discloses unencrypted
LAN transport; inference locality/internal server tools remain separately unknown.
HTTPS/hostname support and generic production modes remain outside this amendment.
Implementation and actual live/native evidence are recorded in the existing Phase2 task;
this amendment alone is not a successful live qualification or full Phase2 acceptance.

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
per-project maximum; terminal status is bounded to one memory-only result. Cancellation
and transport share the exact connected socket through `Arc<TcpStream>` for shutdown
during blocked header/body reads; the one literal
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
If Save temporarily owns the project service when the response completes, publication
waits off-thread within the captured response deadline. A busy service alone is not
stale configuration. Cancel, configuration/project changes and shutdown still invalidate
that waiting result. Each reported usage component remains bounded even when other
usage fields are absent; missing fields remain unknown.
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
