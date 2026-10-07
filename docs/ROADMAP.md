# Phased roadmap

**Planning clarification:** 2026-09-15; Phases 2–3 delivery planning updated 2026-10-02. Each phase is gated by measured outcomes, not elapsed time. This roadmap defines scope and dependencies; it does not authorise implementation. Each milestone needs a bounded brief and explicit approval. Read [CURRENT](status/CURRENT.md) for actual implementation and gate state.

## Phase 0 — Foundation and proof (complete)

**Scope:** governance, canonical docs, privacy/security baseline, UI/architecture checkpoint, representative fixtures, and high-risk spikes.

**Exit criteria:**

- Repository validator and read-only CI pass; privacy audit has no unresolved finding.
- Synthetic fixture/golden corpus exists with documented provenance and expected bytes.
- Electron and Tauri spikes run equivalent editor/file/process/security scenarios on Windows and macOS; results support an accepted stack ADR.
- Source candidates demonstrate exact no-op round-trip and safe custom-code fallback; results support an accepted source-model ADR.
- Ren'Py 8.5.3 adapter demonstrates version, compile, lint failure codes, test, run, diagnostic parsing, and investigated warp on both platforms.
- SDK installer rejects checksum, traversal, symlink, collision, partial download, and unsafe-overwrite cases.
- Preview and 10,000-node graph experiments define recorded fidelity/performance limits.
- Architecture, data, UI, security, test, fixture, and first-slice documents reflect evidence; no blocking question remains hidden.

Completed 2026-09-13. ADR 0001 selects the lossless source model, ADR 0002 selects the versioned SDK/install boundary, and ADR 0003 selects Tauri 2 after equivalent packaged Windows x64/macOS ARM64 evidence. Remaining manual assistive-tech and OS signing/reputation checks are recorded later-phase limitations, not inferred Phase 0 passes.

## Phase 1 — Complete authoring vertical slice

**Status:** Phase 1A–1H and CI-SIMPLE accepted and integrated; **Phase 1 closed
2026-10-07**. [PR #18](https://github.com/Caldwell-41/Renpy-editor/pull/18) merged at
`82d45189d003239b622bc946c85b639a093f46a1` after one fresh independent review.
Production 37529174148/1 at exact `ba01a84` proves required Windows x64/macOS ARM64
H01–H12/sections 3–4 gates; main quality 37536967028/1 Pass and exact integrated-input
audit prove integration. The [closure ledger](tasks/archive/2026-10-07-phase-1h-vertical-slice-acceptance.md#independent-review-integration-and-phase-1-closure--2026-10-07)
retains identities, both earlier failed matrices, cumulative attempts and limits.
The bounded Phase 2 source foundation is independently reviewed and qualified on both
targets and integrated through [PR19](https://github.com/Caldwell-41/Renpy-editor/pull/19). Provider/AI and remaining Phase 3 implementation are
unstarted; CURRENT/HANDOVER own the next selection.

**Outcome:** a small but genuinely usable Loomlight-created Ren'Py project from creation through authoring, validation, run, close and reopen. The [Phase 1 vertical-slice plan](tasks/archive/2026-10-07-phase-1-vertical-slice.md) owns detailed milestone scope and gates.

Phase 1 includes conventional staged project creation; distinct title/folder identity, selected parent, compatible pinned SDK, configurable resolution and optional local Git initialization; modular source and editor-only metadata; safe persistence/reopen; Characters with extensible Appearances; copied Assets and bool/int/string Variables; the bounded visual beat set; Scene/Source/Branches workspaces; scene-local partial preview; lossless Custom Code; shared transactions, coherent history, minimum usable recovery; explicit SDK validation/normal run and supported script editing/saving during play; asset mutations require Stop. New Git status/diff/checkpoint work is optional later scope.

The bounded beat set remains background/scene, show/hide and appearance changes, Left/Centre/Right placement references, dialogue/narration, simple assignments, unconditional choices/jumps/return, music/SFX and a small transition set. Advanced conditions/calls, freeform transforms/ATL, UI Designer, Timeline, general import, Run From Here, LLM, new Git status/diff/checkpoints, GitHub remotes, plugins and release signing are not Phase 1 implementation.

The 2026-09-27 [scope reset](adr/0010-local-project-safety-and-observed-flow.md)
prioritizes data-loss prevention, ordinary external-edit handling and responsive
last-observed Branches. Accepted G1-OBS replaces the retired native observation proof.
Deliberate same-user filesystem
attacks are outside initial acceptance. Historical failures remain preserved,
and final 1G supported-target/user acceptance is recorded in the closeout ledger.

### Dependency checkpoints

| Milestone | Owns | Must be established before its gate |
| --- | --- | --- |
| 1A–1D corrective closure | Existing source/metadata/import/transaction/session/UI corrections | Production regressions and final Windows/macOS evidence on the corrected tree |
| 1E.1 | Minimum source/semantic foundation, multiple Chapters/Scenes, narrow file lifecycle and integrated history | Migration/reopen, reference safety, inverse operations and obsolete `.rpyc` handling before Scene writes |
| 1E.2 | Functional Scene/Story authoring and minimum recovery UX | Explicit beats and choices; safe inspection/resolution of supported recovery states, not evidence deletion |
| 1E.3 | Preview, session-scoped media presentation and Scene polish | Truthful partial state, safe thumbnails/audition, keyboard/accessibility and visual-conformance evidence |
| 1F | Full Source workspace, broader mapping and direct/external reconciliation | Lossless bytes, explicit invalid-buffer/stale-view policy, correct local conflict versus global recovery blocking |
| 1G.1, 1G.2a–b | Branches; runtime foundation and UI/diagnostics | Three checkpoints proving shared flow, executable trust/runtime ownership and editing during play |
| 1H | Integrated acceptance | Real authoring, both runtime routes, failure/recovery paths and continued editing on both targets |

These subdivisions do not add a new product scope or bypass milestone approval. The minimum source service is required by 1E; the general Source workspace remains 1F. Minimum usable recovery belongs before the 1E authoring gate; advanced recovery tooling stays later. Ordinary external file divergence can be isolated when safe, while incomplete/ambiguous multi-file recovery retains the central write block.

**Exit criteria:**

- Production Gate E and the integrated corrective gate pass before later authoring is declared safe.
- Fresh-checkout Windows x64/macOS ARM64 runs complete create → author → save → close → reopen → edit → validate → run, including multi-Scene lifecycle, both choice routes and repeated undo/redo.
- Generated projects remain ordinary editable Ren'Py and run without `.renpy-editor/`.
- Golden tests prove no-op fidelity and minimal supported changes, including Unicode/newlines and opaque/custom source.
- Crashes and external conflicts preserve accepted and competing data. Supported recovery can be resolved explicitly through the minimum UI and editing can continue; ambiguity is not concealed.
- Scene/Source/Branches remain projections of shared source/semantic transactions. Preview and diagnostics show unknown/stale state honestly.
- Behavioral, packaged-security, accessibility, visual-system, capacity/precision and safe media/discovery checks pass. Label presence, file existence or an SDK-skipped wrapper is not sufficient evidence.

## Optional milestone — Local Git checkpoints (deferred)

**Decision:** 2026-09-25. [Optional Git](tasks/active/optional-local-git.md) preserves the
former 1G.3a/1G.3b requirements as GIT.1 safety and GIT.2 UI. No date or automatic start;
the user may select it later. It is not required for 1G/1H, Phase 1 closure or Phase 2
entry, Phase 3 or initial-release acceptance. The user removed proposed 3E on
2026-10-02. Existing project-creation Git init remains. Later GitHub integration depends on
this foundation if selected; it must not assume Phase 1 delivered status/diff/checkpoints.

The remaining Phase 1 test cadence is agent-run development and early native process
proof, one final human session at 1G closure, and automated 1H acceptance with narrowly
reused human evidence; [TESTING](TESTING.md#phase-1g-testing-ownership-and-cadence) owns it.

## Phase 2 — Initial LLM assistance

**Outcome:** Unsloth Studio and configurable OpenAI-compatible adapters support user-initiated structured scene, Character and proposed-lore actions, with reviewable semantic/file changes. Persistent Character cards and a lorebook support manual and LLM-generated content for selected context; system prompts are editable/resettable to baseline, with explicit context and response limits. Unsloth Studio is a first-class provider with dedicated setup, capability qualification, diagnostics and live acceptance. No hardcoded model catalogue or automatic application.

The [detailed Phase 2 plan](tasks/active/phase-2-initial-llm-assistance.md) records the provider contracts, official Unsloth documentation, selected-context rules, proposal/partial-acceptance design, lore lifecycle and separately gated execution checkpoints. The bounded source foundation is qualified and integrated; provider/AI implementation remains unstarted. Phase 1 acceptance and explicit checkpoint approval remain entry requirements.

The selected delivery sequence brings forward bounded 3A source foundations alongside
provider feasibility, then targets a complete reviewed dialogue rewrite using manual
cards/lorebook and configurable prompts/limits. Remaining Phase 2 actions/provider
coverage and 3A Story logic can then overlap.
[Shared foundations and lane assignments](tasks/active/phase-2-initial-llm-assistance.md#19-selected-shared-foundations-and-two-lane-delivery)
own the detailed gates and GPT-6.1 Sol High owner with zero to two useful independent helpers.
Phase 2 still requires final integrated acceptance; these stages do not enlarge its
AI operation allowlist or authorize implementation.
[The deliverable queue](tasks/active/phase-2-initial-llm-assistance.md#20-bounded-deliverables-and-next-outcome-prompts)
maps those outcomes to the requirement checkpoints below; it retains Unsloth Studio, the generic-compatible provider path and five actions. Checkpoints use internal commits in the same outcome/chat
under WORKFLOW, not mandatory chat transfers.

Execute separately scoped internal briefs after Phase 1 acceptance and explicit approval:

| Checkpoint | Scope and gate |
| --- | --- |
| 2A — Provider and credential boundary | Core-owned provider configuration, explicit context/response limits, endpoint/locality disclosure, reviewed OS credential adapter, bounded requests/cancellation and redacted errors. Test no renderer/project/log credential leakage, no implicit sends, and safe endpoint/redirect handling. |
| 2B — Deterministic selected-context assembly | Manual Character cards/lorebook, editable system prompts with baseline reset, and explicit user-selected Scene/route/slice/reference context with source revisions, provenance, dependency disclosure and size estimate. Route-aware means a selected documented scope, not proof of reachable runtime state. Unknown conditions/custom effects remain marked unknown; stale summaries invalidate. |
| 2C — Structured proposals and acceptance | Scene, runnable Character, Character-card and lorebook draft/update actions produce validated proposals against exact revisions. Show semantic/file diffs, permit dependency-valid partial acceptance, reject stale proposals, and route all accepted changes through the existing transaction/history boundary. Lore remains proposed until approved. |

**Exit criteria:** every send reveals destination/locality/context/estimated size; remote sensitive-content warnings and explicit consent work; unsupported schemas/paths/identifiers and malicious output are refused; partial acceptance cannot omit required definitions or dependencies; stale/cancelled responses cannot mutate a replacement session. No source or lore becomes canonical without review. Credentials and these safety gates are Phase 2 prerequisites, not deferred Phase 3 release polish.

The 2026-10-07 refinement selects native references/basic Scene/route scope and knowledge
notes, project prompts, device-local profiles and OS/session-only keys. [ADR 0011](adr/0011-ai-settings-secrets-and-reference-storage.md)
owns persistence/privacy. External interoperability and a shared prompt library stay
deferred. Component tests reuse existing gates, early risk proofs and combined milestone
qualification rather than full package matrices at every increment.

State simulation/Run From Here remain Phase 3; broader reachability/state and narrative inference remain Phase 4. Phase 2 must not claim knowledge those later capabilities have not established.

## Phase 3 — Initial WYSIWYG release

**Implementation planning requested — 2026-10-02:** the user removed 3E and asked
for implementation plans for the remaining parts. The detailed brief now includes
source/code seams, staged implementation and proof fixtures based on Ren'Py docs and
relevant projects. Exact feature inventories remain proposed; no coding is selected.
Git/GitHub are deferred and absent from Phase 3/release acceptance.

**Outcome:** satisfy PRODUCT's initial-release scope through separately gated capabilities, not one large implementation goal. Preserve the accepted source/transaction/authority architecture and exclude arbitrary existing-project import.

The [detailed Phase 3 draft](tasks/active/phase-3-initial-wysiwyg-release.md) defines
first usable results, proposed subsets, dependencies, implementation steps, inspected
code seams, early risk proofs and completion gates. The user selected **Story logic first, then screen design** on 2026-10-02.
The selected shared-foundation sequence allows scoped 3A work before Phase 2
completion; after accepted Phase 2/3A, Screens and Timeline can use parallel lanes.
State/Run From Here consumes qualified story/effect semantics, and release qualification
follows all required capabilities. Phase 1 is accepted/integrated/closed; this plan
does not select Phase 2/3 implementation. Exact screen/Timeline subsets, Run From Here
entry points and release audience remain explicit design decisions.

| Checkpoint | Bounded capability and essential acceptance |
| --- | --- |
| 3A — Mature authoring and supported flow/state constructs | Explicitly own initial-release conditions/calls and their shared semantics, source mapping, diagnostics and history. Mature Scene/Source/Branches without creating a second graph or document truth. Unknown/custom constructs remain lossless. |
| 3B — Supported screen designer | Reviewed screen-language subset with canvas/hierarchy editing, minimal source patches and runtime comparisons. Unsupported screens remain source/custom code; no claim of full arbitrary-screen WYSIWYG. |
| 3C — Staging, native animation and VN Timeline | Character drag/resize with matching runtime placement; native pre-rendered playback and dialogue idle loops; reviewed timing/transform/audio subset with source mapping, undo and native tests. Only pinned-Ren'Py-supported media profiles; no GIF import/conversion, transcoding or video editing. |
| 3D — Supported state simulation and Run From Here | Depends on a validated state/provenance model and supported control-flow semantics. Distinguish reachable, saved-route and synthetic/manual starting state; refuse or clearly limit unknown prerequisites. A label jump/warp alone is not correct state reconstruction. |
| 3F — Distribution and release acceptance | The agreed initial-release capabilities pass integrated E2E, pinned-SDK comparisons, accessibility, performance, privacy/security, recovery and packaging. Verify the actual distribution audience/channel and install/launch behavior before publication. |

These are dependency-planning boundaries; each execution brief must name its exact subset, entry conditions, measurable acceptance and exclusions. Shared state semantics must precede 3D. General analysis completeness is not assumed: deeper Phase 4 analysis may refine this supported subset later without making 3D's claims retroactively true.

**Exit criteria:** every capability in PRODUCT's initial-release scope passes its gates and the integrated create/author/source/preview/run/LLM/recover/reopen workflow on both targets. Preserve visible partial/unknown handling. Signing/notarisation is not required for early genuinely private builds, but is required before broader distribution under the release policy below.

## Phase 4 — Narrative intelligence

Deliver separately approved capabilities in order: branch/reachability checking; variable/state analysis; Character consistency; approved lore extraction; broader code/UI/refactoring proposals.

Each brief defines the supported analysis domain, dependencies, source/revision/provenance citations, stale-result invalidation, false-positive fixtures and an explicit unknown outcome for custom/runtime-dependent code. An unknown path or state must not be reported as unreachable or inconsistent merely because it could not be analysed. Facts inferred from text remain distinct from user-approved canonical lore.

**Exit criteria:** each analysis has measurable synthetic positive/negative/unknown tests; users can trace findings to evidence; modifications remain reviewed proposals through the same transaction system. No silent canonical updates. Phase 3's bounded state support remains valid independently of broader analysis coverage.

## Phase 5 — Optional open-world capability

After explicit approval, add maps/POIs/travel, then day/time/schedules/availability, then route validation, run-from-location and reachable-slice LLM context on the established graph/state model. Give each step its own scope and gate. Reuse state provenance and unknown handling; do not infer arbitrary runtime state from location alone.

**Exit criteria:** ordinary linear/branching projects remain free of open-world requirements or implicit state assumptions; enabling/disabling the capability preserves source and identities; unsupported availability/state is explicit; execution and LLM context obey the existing trust/consent boundaries. This future phase does not authorise plugin infrastructure or open-world implementation now.

## Release discipline

Private distribution requires an actually private repository or another reviewed authenticated channel. Do not treat a published Release or pre-release in a public source repository as private. GitHub states that [anyone with repository read access can view releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases). Select and approve the audience/channel in 3F; this planning amendment changes neither repository visibility nor release state.

Early genuinely private packages may be unsigned after CI verification and clear limitation disclosure. Signing and macOS notarisation follow once distribution stabilises, before wider release. Release/update credentials remain protected from untrusted PRs. Each release maps to a tagged commit and records dependency/licence review, SBOM/provenance planning, package-content privacy scan, install/launch evidence and known limitations. Reproducibility claims must state what was actually reproduced.

**One-off 0.1.0 exception — 2026-10-07:** the user explicitly approved
[v0.1.0](https://github.com/Caldwell-41/Renpy-editor/releases/tag/v0.1.0) as an early
public prerelease with original unsigned/non-notarized Windows/macOS packages and
unqualified installer paths disclosed. [Publication evidence](tasks/archive/2026-10-07-release-0.1.0.md)
records the tagged source, original qualification, asset checksums, licences/provenance
and approval. This exception applies only to 0.1.0 and does not change later-release
signing/notarisation or install/launch requirements.

## Evidence and cost discipline

Use cheap targeted tests while developing and complete supported-target gates for the final changed code/test/workflow tree. Keep routine Phase 0 matrices manual-only, avoid duplicate expensive matrices for unchanged trees, and do not build packages for documentation-only commits. Preserve lightweight evidence routinely and full packages only when explicitly needed. Record failures and skips accurately; neither a planning amendment nor an old green run closes a new gate.
