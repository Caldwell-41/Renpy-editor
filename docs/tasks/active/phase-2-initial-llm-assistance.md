# Phase 2 — Initial LLM assistance

**Scope owner:** Phase 2 requirements, acceptance and the shared delivery sequence;
[ROADMAP](../../ROADMAP.md) owns phase boundaries. Phase 1 and the bounded nested-source
foundation are accepted; Phase 2 remains incomplete. Studio settings and credentials
are implemented; the selected Windows remembered-credential qualification and cleanup are complete. [CURRENT](../../status/CURRENT.md) owns
project status; [HANDOVER](../../status/HANDOVER.md) owns continuation and recovery.

Read the current contract for Windows work, then only the relevant requirement
sections. Detailed planning/source/provider/native attempts through `015579a` are in
the [historical ledger](../archive/2026-10-09-phase-2-execution-history.md); old prompts
there are evidence, not live instructions. Future capabilities require their own
selection; preserve the approved provider, reference, prompt and Phase 2/3 scope.

Implementation agents follow the accepted [UI/UX guidelines](../../UI.md#accepted-uiux-guidelines-for-implementation-agents),
including plain interface language, optional technical help, completion/submission
validation and shared control ownership. These guide future implementation; they do
not claim the current application already satisfies every interaction.

## Current Windows qualification contract

**Selected outcome: complete.** Packaged Windows x64 remembered Studio credentials
are qualified for retained input after refusal, Retry/Cancel, exit/reopen, replacement,
explicit authenticated synthetic loopback discovery, confirmed-save/reload recovery,
and supported removal with other-profile/foreign ownership preserved. Scoped synthetic
cleanup is complete. Full 2A.1, real Studio/generation, generic/session/no-auth paths,
clean-OS/locked-store and general cross-build continuity remain outside this slice.

**Execution and authority:** one serial Local Windows owner on
`codex/provider-qualification`, continuing from published `ecc02c4`. The final user
amendment adopted the Astra audit: reuse valid run-14 phase-1 evidence, separate bounded
observation from application response timing, accept original screenshots, and permit
a strictly probe-only rebuild. It authorized at most **two additional builds and three
additional launches** above the ten combined attempts consumed. Completion used
**one build (7) and one launch (16)**: selected-task totals **5 builds / 7 launches,
12 combined**. The unused reserve was not exercised; this completed task grants no
new feature, installation, real endpoint/key, generation, CI, merge/release or host work.

**Evidence reuse:** run 14 remains the full phase-1 PASS on build 6. Build 7 is a
different binary, not an identical-package claim. The source comparison permits only
the controller/tests, Windows probe and the opt-in watchdog block in `main.rs`;
production credential, Settings, transport and persistence logic is unchanged.
`run-16-reuse.json` records both binary hashes and every changed input. Build 7 and
run 16 independently passed complete installed/generated/toolchain/environment gates.
No old manifest or failed result was backfilled. Final documentation changes do not
change the tested runtime or require another package.

**Timing and observation:** build 1200 s (+2 terminate/+2 reap); product waits 15 s,
native entry 120 s, GET 15 s plus 2 s cleanup. Phase-2 observation/acknowledgement and
post-exit receipt collection each have a separate 180 s bound, inside a 1800 s whole
walkthrough watchdog. Phase-1 timing is unchanged. Status is scrolled into view;
original JPEG/PNG/WebP evidence is accepted with exact hash/size checks. Native
screenshots/accessibility establish visible state; probe assertions supplement them.
An observation taking longer than a product deadline is not a product timing failure.

**Closure:** run 16 completed every outstanding native behavior and normal exit.
Run-14 alpha/gamma plus replacement beta are absent after supported removal. The two
run-12 leftovers were separately deleted only after exact recorded target, service,
origin/revision-bound comment, owner, type, persistence, flags and attribute checks.
No enumeration, secret-value inspection or uncertain-ownership recovery occurred.
Earlier three synthetic entries retain their established absence receipts. All eight
known created entries are accounted for; failure roots/receipts and foreign metadata
remain preserved. There is no pending app, build or listener and no required work
remaining for this selection. See the acceptance table below for exact proof/limits.

## Windows qualification evidence — 2026-10-09

The following preserves the earlier ten-attempt sequence and its failures. The
completion amendment and final acceptance are recorded below. One Local Windows
owner; no subagents or other-host access.

| Attempt | Result and authoritative evidence |
| --- | --- |
| Build 5, attempt 4 | PASS on `00370accde1d1d2c12c1b2896daa346d1c7b44bd`; 209.745836 s receipt, 209.836335 s terminal, exit 0/PID absent. EXE SHA256 `c9eed6d86483e6a46debe834061512053fa11296ecaff6281b95dad5a667ebb4`, 14,836,224 bytes. Installer SHA256 `1475f925d0bf8b466974966e1a67bde984bfe26f0fd94b253ea62423776c466d`, 3,691,169 bytes; not run. Complete source/installed/generated/toolchain/environment equality. |
| Run 8, attempt 5 | FAIL, 123.145129 s, exit 1/PID absent, alpha-entry timeout. Returned app window, but optional activation failed with foreground-process-ID error; recovery found no window after exit. No input/Save/fault/GET. Initial root unchanged. |
| Run 10, attempt 6 | FAIL, 123.141790 s, exit 1/PID absent, alpha-entry timeout. Direct capture worked; masked alpha at 52.54–53.61 s, refusal/retained input at 100.97–101.95 s, exact restore. No Retry/successful Save/GET. Initial helper referenced unavailable Node `process`; corrected. Sandboxed fault PID access refused before mutation; authorized external controller succeeded. No late input dispatched. |
| Run 12, attempt 7 | FAIL, 244.551526 s, exit 1/PID absent. Actual masked input, alpha unreadable refusal at 53.50–54.61 s; Retry without retyping confirmed at 82.35–83.33 s; gamma Save at 140.86–141.73 s; stale-origin refusal at 206.48–207.45 s; Cancel after exact restore at 236.13–236.92 s. One accepted alpha GET. Probe failed `Client discovery timing missing`; no complete/reopen proof. A later capture still showed Cancel and is not discovery observation. |
| Build 6, attempt 8 | PASS on `4698a88c11fc689f9ef4da76754324fc2deafcbe`; 258.111509 s receipt, 258.194984 s terminal, exit 0/PID absent. EXE SHA256 `67fd69d2e6bb231c290d67f1270d7c7651fa0cb7ecc8c77f569aa3cdcc796986`, 14,836,224 bytes. Installer SHA256 `81aec132aecb794a26f2adc93afc971d3b03ff211da35925058a8e63301fff45`, 3,688,667 bytes; not run. Complete input equality passed. |
| Run 14, attempt 9 | Full phase-1 PASS, 243.865653 s, exit 0/PID absent. Actual masked alpha; unreadable refusal 46.50–47.64 s; Retry without retyping 77.56–78.48 s; gamma Save 112.08–112.93 s; stale refusal 179.92–180.96 s; Cancel after exact restoration 203.92–204.68 s. Two authenticated alpha GETs and native result observations; request times 0.008900/0.006500 s, cleanup 0.095900/0.096700 s. Complete ordered native receipt, exact store/restoration checks and two remembered-entry presence reads passed. |
| Run 15, attempt 10 | FAIL, 18.078178 s, exit 1/PID absent, `Timeout: get-1-complete`. Correctly gated on full run-14 PASS and identical package/root. Probe checks proved reopen plus one accepted alpha GET (client request 0.012300 s, cleanup 0.095300 s). Initial native capture at 6.75–7.22 s produced a JPEG but null accessibility despite requested text; host text access failed. Refresh reported foreground-process-ID failure after hold expiry. No acknowledgement, beta input, replacement/removal or reload recovery. Internal results are partial evidence, not a native acceptance pass. |

Private original receipts, snapshots, JPEGs and audits remain under the existing
ignored `app/.toolchains/windows-studio-acceptance/` and `windows-studio-step3/`.
`goal-readiness-audit.json` verified 25 preserved earlier evidence hashes and exact
second-root fixture bytes. All 131 checked documentation fragment links resolved.
No old manifest was backfilled. Package-5 source remained fixed; later controller
changes used the existing recorded controller-only input exception.

Run 12's renderer/native observations and exact alpha/gamma/Cancel snapshots establish
those partial behaviors, not full phase 1. The controller stopped before presence
reads when the report failed. Two newly owned synthetic entries remain referenced in
its preserved root; no uncertain ownership is recovered or unrelated key accessed.
At the earlier boundary, task totals were 4 builds/6 launches (10 combined), 6 server lifetimes, 9 native
entry dialogues (8 typed sessions including old late run 6), 9 Save submissions
(4 confirmed, 5 refused), 2 Retry saves, 2 Cancels, 4 GETs, 4 new owned entries,
2 new presence reads. Cumulative Windows totals including earlier work: 6 builds/
11 launches, 6 GETs, 7 owned entries created, 7 presence reads. Earlier counters and
failures remain in history. Four known entries remained across the run-12/run-14 roots at that boundary; final cleanup is below.

Run-14 full proof is retained in `run-14.json` and `run-14-observed.json`; failed
run-15 capture/exit/probe evidence in `run-15.json`, `run-15-exit.json` and
`run-15-host-partial.json`. Both final PIDs were independently rechecked absent;
no test listener remained. Phase-1-complete, reopened and current store bytes share
SHA256 `a26f9b908fc4b3d9480b2768a847e31d5cacd401399ab62f99d6028167622130`.
At that boundary there was no pending app/server/build, changed threshold, extra launch or credential cleanup.
Final documentation validation passed for 412 repository files; whitespace passed.

Root cause of run 12: Tauri 2.11.5 `scripts/core.js` uses `Object.defineProperty` for
`invoke` without writable/configurable flags. The earlier monkey-patch silently did
nothing in the packaged WebView; the previous DOM mock was writable. The corrected
opt-in bridge emits operation/response timing at the real invocation boundary, with
no request payload or native key. Only native-entry response metadata is emitted;
other operations expose name/timing only. The probe uses that event for discovery
and reload/Retry observation. The DOM mock now uses the actual immutable descriptor.
Focused checks: controller 28 PASS, Settings/probe DOM 10 PASS, both TypeScript
compilations PASS. Previous targeted Rust 1 PASS (15 unrelated filtered) remains
valid for unchanged Rust; the initial sandbox OUT_DIR failure is retained.

### Final Windows acceptance and cleanup — 2026-10-09

| Required behavior | Result and evidence |
| --- | --- |
| Native Save/refusal/Retry/Cancel and first exit | PASS, reused full run 14 with unchanged production code; no repeated phase-1 scenarios. |
| Reopen without entry or automatic discovery | PASS, run-14 saved bytes equal reopened bytes; native configured A / not-checked status observed before discovery; both remembered references configured in the native-backed snapshot, no entry or GET before release. |
| Replace A with beta while preserving B/foreign metadata | PASS, one native masked beta entry and one confirmed Save. Whole-store comparison preserves B and foreign ownership exactly; pre-removal audit proves old A absent and beta/B present. |
| Explicit authenticated synthetic discovery | PASS, exactly two accepted GET `/v1/models` requests, alpha then beta, each with native model-available observation. Client request times 0.009200/0.007500 s; cleanup 0.096900/0.107400 s. No real provider or project content. |
| Confirmed Save despite Settings reload failure | PASS, actual saved-success/reload-required message captured. Native accessibility identifies every mutation/discovery field/action disabled and read-only Retry enabled. Confirmation observed 0.430 s after submission. |
| One read-only Retry | PASS, native configured A restored. Probe operation sequence proves one UI `ai.profiles` read, no additional entry/Save/discovery; before/after snapshots and persisted bytes identical. Supporting inspection reads are separately present. |
| Supported credential/profile removal | PASS, native A shows missing/disabled and Removed; B snapshot remains unchanged. Supported controls then remove A/B profiles and B credential; final native state is unconfigured. Old A, beta and B exact targets are absent. |
| Normal exit and stopped listener | PASS, exit 0 at 344.570925 s, approximately 0.268 s after final release; owned window/PID absent. Final external audit confirms no loopback listener. Receipt completion including observation was 360.997468 s. |
| Run-12 leftovers | PASS, two exact targets verified against recorded fixture and Windows ownership metadata, deleted and verified absent. Original failed root bytes unchanged; no credential values read. |

Build 7 (attempt 11) passed in 56.141596 s, terminal 56.209407 s, exit 0/PID absent.
EXE SHA256 `98fe719010dd029965401dd09ae7919dcf27b0f45f99aae8bf0b65c10d925fc6`,
14,853,632 bytes. Installer SHA256
`c6592b17191afbcb6f1f584d36e87370fc73944a6ba1566a08c115c47244f5df`,
3,690,870 bytes; installer not run. Run 16 (attempt 12) passed on that package and
the preserved run-14 root. Final store SHA256
`904ccb5e041ba1121fd653359b9f4f1e9a52ae79e45ee38853641acd2760e141`.

Original native screenshots and accessibility are retained in `run-16-*-native.json`
and JPEGs. The first capture took 114.843 s and succeeded within its separate hold;
later captures took fractions of a second. One stale accessibility index refused
before input; refreshed screenshot coordinates focused the field successfully.
The screen-transition captures are retained, not relabelled as final states. These
are observation-tool issues, not demonstrated credential product defects.

Authoritative private receipts under `app/.toolchains/windows-studio-acceptance/`:
`build-7.json`, `build-7-terminal.json`, `run-16-reuse.json`, `run-16.json`,
`run-16-observed.json`, `run-16-reload-observed.json`, `run-16-replacement-audit.json`,
`run-16-exit.json`, `run-12-scoped-cleanup.json`, and `completion-final-audit.json`.
The latter verifies original capture hashes and terminal state. Run-15 root markers
were copied intact to `run-15-root-markers/` before reuse. The exact cleanup script
is retained privately in `windows-studio-step3/cleanup-run12.py`. Earlier three-key
absence evidence remains in `windows-studio/phase-2.json` and
`windows-studio/local-completion-audit.json`; no passed cleanup was repeated.

Additional accounting: 1 build, 1 launch/listener lifetime, 1 native entry/typed
session, 1 confirmed Save, 1 read-only Retry, 2 GETs, 1 owned entry created; 3 entries
removed through the product (old A/beta/B), 2 exact leftover deletions. Selected-task
totals are 5 builds/7 launches/6 GETs; cumulative Windows totals including earlier
work are **7 builds/12 launches/8 GETs/8 created entries, all removed**.

Focused verification: controller 30 PASS, changed probe DOM 6 PASS, test TypeScript
compilation PASS, package build PASS. The initial controller check hit sandbox TEMP
access errors; the corrected existing workspace TEMP rerun passed. No new Rust or
broad suite was needed for unchanged credential logic. Review confirmed only opt-in
probe behavior changes, preserved product deadlines/ownership, accurate evidence
reuse and completed scoped cleanup. Final review removed a leftover controller comparison between screenshot duration
and request duration; each now has its own deadline. The added regression and
offline revalidation of run 16 passed (`post-review-check.json`); only controller/tests
and README changed after build 7, not packaged runtime. Documentation/link/privacy
and whitespace checks passed. No production defect was demonstrated or fixed.

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
the [qualification ledger](../archive/2026-10-09-phase-2-execution-history.md#25-provider-qualification-ledger--2026-10-07)
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

The selected [temporary Mac development plan](2026-10-08-macos-development-credential-storage.md)
supersedes Mac API-key storage only. Native entry/Rust-only secrets remain; Keychain
API-key operations, session escape and Apple Development signing are deferred. Source/
synthetic implementation is separate from the bounded packaged reuse/recovery result.
That sequence passed on its recorded inputs; subsequent review corrections have their
own evidence boundary in the [independent review](../archive/2026-10-09-phase-2-execution-history.md#mac-development-independent-local-review--2026-10-08).

| Content | Planned location and contract |
| --- | --- |
| Profiles and device-local project bindings | Versioned `ai-profiles.json` under the existing application-data root; validated safe replacement, separate from UI preferences. Defaults/capability evidence bind to model/configuration. |
| Remembered keys | Baseline macOS Keychain / Windows Credential Manager design; the selected temporary Mac development exception uses encrypted local files and an unencrypted local unlock key, retaining all native ownership as deferred. |
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

The initial planning checkpoint is [historical evidence](../archive/2026-10-09-phase-2-execution-history.md#13-planning-checkpoint-and-continuation).
Use the current contract above and HANDOVER for execution scope. The sections below
retain product requirements and future delivery choices, not independent grants of
execution authority. Keep new results compact and link detailed past attempts.

## 14. October milestone sequencing

Section 19 owns the single live scheduling/ownership map; section 20 maps bounded
results to existing requirement gates. This anchor preserves links. The duplicate
October delivery table was consolidated on 2026-10-07; Git history retains it. The
first useful rewrite still includes manual references, prompt/reset and size controls,
native credentials, exact reviewed send, strict review, one transaction and undo.
It does not replace five-action/two-provider acceptance. The [bounded source assignment](../archive/2026-10-09-phase-2-execution-history.md#21-first-bounded-source-foundation-assignment)
is accepted; provider qualification is the current selected slice.

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

Original concept-generation and review receipts are in the
[historical planning record](../archive/2026-10-09-phase-2-execution-history.md#ui-concept-planning-record).
The design index retains assets and visual limitations; current execution follows
the selected outcome above.

## 19. Selected shared foundations and two-lane delivery

The user selected this delivery approach after reviewing the rework risks: bring a
bounded part of 3A's source foundations forward, prove one complete Phase 2 rewrite,
then overlap Phase 2 completion with 3A. After Story logic, develop Screens and Timeline
in two lanes. Phase 1 acceptance through 1H remains the entry prerequisite. This is
the selected sequence, not blanket execution authority. Source foundation is accepted;
select each remaining outcome against the actual baseline and live continuation.

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

Reconcile actual accepted interfaces and ownership when selecting each remaining
outcome. Earlier planning-only checks and publication instructions are retained in
the [historical delivery record](../archive/2026-10-09-phase-2-execution-history.md#delivery-planning-record);
CURRENT/HANDOVER own execution state.

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
