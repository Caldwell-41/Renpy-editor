# Phase 1G — Branches, runtime and diagnostics

**Updated:** 2026-09-27. **Current checkpoint:** R2-P1 packaged proof correction and
supported-target qualification, `blocked` after the failed matrix (ledger 23). G1-OBS remains
`review_ready` (ledger 22). Windows diagnosis R2-P1-WIN-D1 is `review_ready`
(ledger 26); the user approved R2-P1-WIN-F1's two-buffer correction and local testing
(ledger 27, `review_ready`), then narrowed testing to exclude aggressive/hostile work.
R2-P1-MAC-D1 diagnosis/review is `review_ready` (ledger 28). User-approved
R2-P1-MAC-M1 probe correction/local proof is `review_ready` (ledger 29); no new
qualification is claimed. Earlier prerequisite interruption/setup remain in ledgers
24–25. Final 1G acceptance remains open.
[ADR 0010](../../adr/0010-local-project-safety-and-observed-flow.md) supersedes the
G1-O observation program and old G1-V1 full-verification latency contract.
Sections 12–20 retain historical evidence and superseded next-step instructions.
**Authority:** the user approved the planning corrections and minimal physical testing,
and removed new Git work from Phase 1. The user subsequently authorised review and merge; PR #16 is integrated.
The user subsequently selected 1G.1 only; its implementation and targeted review are recorded in section 12. Later checkpoints require separate selection.
**Historical planning branch:** `docs/phase-1g-scope-testing`, from main
`f6c269278aa1d8955876ca45bac98a92940e1c5e`. CURRENT/HANDOVER own continuation on the implementation branch.
**Entry:** accepted/integrated 1F, fresh refs/ownership and explicit selection of one
checkpoint. The latest user instructions approve R2-P1-MAC-M1 only (section 29), following
ledger 28: bounded probe correction and two local checks. No CI dispatch, budget
relaxation, renderer changes, hostile/crash tests or unapproved tooling installation.
WIN-F1 is preserved; no conflict resolution or merge is authorized.

Phase 1F and its post-merge verification are closed; preserve prior Save/F4 acceptance.
Planning PR #15 is integrated. New Git work is preserved as the deferred
[optional Git milestone](optional-local-git.md), not a 1G/1H/Phase 1 or Phase 2 prerequisite.
The historical filename is retained for existing links; it does not retain Git scope.

## 1. Ownership and existing foundations

Read [AGENTS](../../../AGENTS.md), [WORKFLOW](../../WORKFLOW.md), current status and
handover from the actual implementation branch, the [parent plan](phase-1-vertical-slice.md),
[UI](../../UI.md), [DATA_MODEL](../../DATA_MODEL.md), [TRANSACTIONS](../../TRANSACTIONS.md),
[SECURITY](../../SECURITY.md) and [SDK ADR 0002](../../adr/0002-versioned-renpy-sdk-adapter.md).
The integrated 1F Source brief and shell-Save ADR govern drafts and Save; do not copy
or replace their controller, transaction, recovery or session authority.

| Area | Reuse | Work still required |
| --- | --- | --- |
| Flow | `scene.rs` Scene IDs, Choice/Jump/Return, guarded lifecycle and history | Shared unresolved/unknown-flow projection and Branches surface |
| Source | Integrated 1F draft, mapping, Save and session coordination | Revision-aware consumers, without another document truth |
| SDK | `renpy.rs` pinned SDK, safe arguments, bounded execution and creation validation | Explicit user execution, long-lived process ownership, usable diagnostics |
| Desktop | Narrow protocol and lifecycle authority | Nonblocking operation ownership and cancellation |
| Git | Existing optional private-stage init and regressions | New work deferred to optional Git; no Phase 1 deliverable |
| Tests | Existing core, DOM, packaged/security and SDK fixtures | New behavioural evidence and integrated 1H coverage |

The eight-second `smoke_run` and severity/message-only diagnostics are foundations,
not normal play or navigable diagnostic acceptance. The graph spike is synthetic
performance evidence, not a production renderer or layout acceptance.

## 2. Checkpoint sequence and exclusions

| Checkpoint | Deliverable | State | Dependency |
| --- | --- | --- | --- |
| 1G.1 | Shared flow projection and Branches | `review_ready` | Integrated 1F and explicit selection |
| 1G.2a | Runtime/trust/revision/process foundation | `review_ready` (R1 technical findings closed) | Reviewed 1G.1 checkpoint and explicit selection |
| 1G.2b | Validate, Run/Stop and Diagnostics UI; observed-state Branches completion | G1-OBS `review_ready`; R2/final 1G separate | ADR 0010 and existing R1 foundation |

These subdivide the parent's two capabilities into three checkpoint chats. Use one
checkpoint per chat, retaining the implementation branch/PR and evidence across chats.
G1/R1/R2 and final acceptance must pass before 1G closes; Git V1/V2 are excluded.

Excluded: conditions/calls authoring, arbitrary parser expansion, graph connection
dragging, mature minimap/search/large-story layout, reachability/state simulation,
Run From Here, arbitrary project import, new Git status/diff/checkpoint work, remotes,
authentication, LLM work, plugins, signing/notarisation and CI wait/wake redesign.
No renderer filesystem/process capability or CSP relaxation is allowed.

## 3. Cross-cutting accepted behaviour

### Drafts, persistence and operation preparation

Source buffers, accepted disk content and derived views remain distinct. Before
Validate or Run, settle the captured current editor input
through the existing controller/operation lease. Where drafts remain, offer explicit
Save All and continue / Use saved revision / Cancel, explaining that saved revision
excludes drafts. Do not silently save, discard or journal drafts. Cancel writes nothing.
Use the integrated Save All preflight and one recoverable multi-mutation transaction;
on refusal retain every draft and do not start the requested operation.

Flush accepted work and verify session, root identity and relevant revisions before
dispatch. Use saved revision never bypasses unresolved recovery, unsafe identity or
unreconciled external conflict. Do not pretend a project is Saved while drafts remain.
Static recognition of opaque syntax is not SDK validity; an explicitly trusted SDK
Validate may diagnose accepted syntax-unverified source without changing Save policy.

Capture operation ID, session ID, project/SDK identities, relevant source/metadata
manifest and view generation. Recheck before acting and discard stale UI completions.
Use hashes/identities, not timestamps alone. Async results must not retarget a new
project or overwrite newer persistence state. External edits can still race execution;
record launch-time evidence and staleness, never claim an immutable filesystem snapshot.

### One preparation path, including Scene input

Extend the existing Source controller/operation lease, not a second Save service.
Capture pending Source input and uncommitted Scene form input before choosing a revision.
For Source, reuse Save All preflight and its recoverable multi-mutation transaction.
For an uncommitted Scene form, offer its existing explicit Commit action before retrying
preparation, Use saved revision (retain the form), or Cancel. Do not silently auto-commit
Scene forms or promise one atomic transaction spanning unrelated UI buffers. A refused
commit/save retains input and starts no SDK process. Recheck all revisions after an
explicit commit; switching panels must not discard the captured form/draft.

Use the same preparation result for Validate and Run, with current input captured under
a short lease. Add literal renderer JSON through the real handler/service tests for all
new requests, including successful disk/reopen observations and stale/malformed refusal.

### Trust and process policy

Compile/lint/run can execute project Python. Opening, graphing, import, preview and
typing never invoke SDK validation automatically. Validate/Run requires an explicit
action and an inspectable session-scoped trust grant for the canonical project and
pinned, revalidated SDK. Allow revocation. Close/reopen, root/SDK identity replacement
or relevant unreviewed external executable changes invalidate the grant; a copied UUID
does not carry trust. Deliberately accepted editor edits retain session consent.

1G.2a must enumerate executable inputs, including source/Python and orphan compiled
inputs, and distinguish SDK-generated cache/save output from external executable
changes. Do not classify every `.rpyc` change as benign. Uncertain provenance requires
revalidation/renewed consent before the next execution. Trust is not sandboxing; app
Stop is lifecycle control, not a claim to contain malicious project code.

### Technical surfaces and diagnostics

Extend Quiet Studio Dark tokens and shared controls. Cover keyboard access, accessible
names, visible focus, focus restoration, reduced motion, resizing and no text/control
overflow. Runtime status, persistence status and diagnostic freshness are independent.
Display process text as inert bounded text; no active HTML or arbitrary file/URL opening.

## 4. 1G.1 — Shared flow projection and Branches

1. Define a core-owned read-only flow projection over accepted source and shared Scene
   semantics. Identify project entry, Scene primary labels, Choice options, Jumps and
   Return/End terminals. Terminal return is not an invented inter-Scene edge. Never
   infer flow from Chapter/tree/file order or evaluate Python.
2. Carry originating Scene/Beat identity, option identity or revision-qualified ordinal,
   exact source range and revision. Duplicate option text must not collapse edges.
   Preserve stable IDs when provable; clear ambiguous selection instead of guessing.
3. Represent resolved destination, statically named missing destination and unknown
   custom/dynamic flow separately. Preserve exact opaque bytes. A partially recognised
   Choice may expose proven routes with an explicit incomplete boundary, never silently
   disappear or imply all routes were found. Additional custom labels are not invented
   supported Scenes; show partial/unmapped flow and bounded Source navigation where safe.
   Mark a target missing only when the bounded project-wide label inventory proves its
   absence. Duplicate/ambiguous labels, unreadable files or incomplete recognition mean
   unresolved/unknown, not proven missing. Reuse the shared lexical/source boundary;
   do not add a regex graph parser or expand into a general language implementation.
4. Build Branches with basic deterministic layout, pan/zoom, fit-to-view, selected Scene
   and edge state, keyboard-accessible equivalent controls, and explicit origin/destination
   navigation. Keep dialogue rows out of the default graph. Preserve caret/drafts on
   navigation; stale/unmapped ranges never select the nearest Beat.
5. Offer existing-command editing: open the mapped Choice/Jump controls, change a proven
   destination and create a destination through existing semantic commands. Scene deletion
   still uses the existing incoming-reference/opaque-ownership refusal. No direct graph
   file writes or independent edge persistence. Layout is non-authoritative convenience
   state, isolated from source/history and validated if persisted.
6. Follow ADR 0010's last-observed saved-state contract: update affected inputs after
   accepted transactions/undo/redo, reconcile disk on open/focus/Refresh, and show
   check/pending/error status. Do not render unsaved drafts as accepted. Retain session
   cancellation, bounded work, focus/draft preservation and honest over-limit state.
   A whole-project freshness proof is no longer required before each display update.

**Selected production budgets:** the fixed 500-Scene / 2,000-edge / 503-source
fixture remains. G1-U2 measures accepted app-edit to updated observed model <250 ms,
initial and explicit disk refresh <2 s. G1-V2 retains rendered input/pan p95 <100 ms.
ADR 0010 defines exact timer boundaries, output assertions and three samples per target.
The old G1-V1 full-current-disk verification requirement is retired, not passed.
Over-limit input remains explicit with Source navigation; no silent truncation.

**Foundation-first:** current Scene parsing may stop at an unmapped menu destination.
Prove shared missing/unknown/partial-choice semantics before rendering; retain known
edges without implying completeness, and preserve opaque bytes/Scene edit safeguards.

**G1 gate:** shared-service and rendered tests prove two routes, reconvergence, duplicate
options, self-loop/cycle, Jump/Return, destination creation/removal refusal, missing and
unknown flow, mixed understood/opaque choices, source minimality and history. Verify
Scene/Source/Branches navigation both directions, selection after deletion, draft retention,
external invalidation, session races and bounded layout. The agent owns automated
keyboard/focus/resize and packaged-target checks; final human checks follow section 9.
A graph built from test-only edges does not satisfy this gate.

## 5. 1G.2a — Runtime and trust foundation

Implement a narrow typed service and command set for Validate, Run, Stop and operation
status/output; command names/schema are chosen in this checkpoint, not arbitrary argv.
Separate a short-lived validation process from a user-lived game process. Establish:
idle → preparing → validating OR starting → running → stopping → terminal result,
including cancellation and failure from each relevant intermediate state.

| Situation | Required behaviour |
| --- | --- |
| Duplicate Run/Validate | One owned SDK operation at a time; explicit busy result, no duplicate spawn |
| Preparation | Drain/flush/recheck under a short coordination lease; never hold lifecycle mutex through child lifetime |
| Validation | Temporarily block writes that invalidate the validation manifest; bounded timeout/cancellation; external change marks results stale |
| Running game | Allow supported script editing/saving; display launch revision and Started from an earlier revision after script edits |
| Asset mutation | Import/replace/move/rename/delete assets only after Stop; refuse mixed commands and history inverses that mutate assets while running |
| Runtime reload | Verify and control SDK automatic reload so editing does not silently execute a new revision under the old Run action |
| Move/delete/undo | Reject only operations conflicting with live source/compiled-file ownership, including relevant history inverses; show Stop action |
| Switch/close/exit | Offer Stop and continue / Cancel; finish child cleanup before invalidating session; then honour existing draft leave flow |
| Natural exit/crash | Capture exit state and bounded output; release ownership and revalidate generated artifacts |
| Stop/revoke | Stop the owned process tree, reap children, release resources; keep Stop responsive and token-bound |
| Output flood | Bounded memory/backpressure and visible truncation; no silent success or unbounded pipe readers |

Record a mutation-versus-execution compatibility table, including assets/definitions,
source saves, file lifecycle, history and recovery. Optional Git compatibility is
owned by that later milestone. Runtime-conflicting
operations may offer Stop and retry; do not impose a whole-session editor lock as an
unannounced scope reduction. If safe continued authoring or reload control cannot be
proven, stop with a specific design finding for user review.

**Script-only editing during play (user clarification, 2026-09-25):** use Ren'Py's
existing loaded-script/reload behaviour; do not implement live asset updates. Supported
Scene/Source edits and their required metadata writes may continue, including changing
script references to assets already present. Media import, replacement, move/rename,
deletion and any compound command/history inverse that changes asset files or inventory
require Stop first. Browsing/previewing existing assets remains available.

Enforce that boundary in the core mutation path, not only disabled UI controls. Drain
in-flight asset mutations before launch and recheck runtime ownership before mutation;
a queued import or undo must not race the start of play. Refusal leaves files/history
unchanged and offers Stop and retry. Retain existing source/compiled-file lifecycle
restrictions as well; script-only scope does not authorise unsafe Scene move/delete.

Launch provenance is not a filesystem snapshot. External tools or project Python can
still change files; ordinary external-change/trust safeguards and truthful status remain,
without promising isolation or supporting live asset refresh. Route acceptance uses
unchanged assets. Replace the earlier planned asset live-read case with an automated
asset-mutation refusal/no-write case and successful retry after Stop.

Cover environment/argument safety, root/SDK revalidation, spawn/cleanup races, bounded
reader shutdown even when descendants retain pipes, cancellation during preparation,
graceful stop then bounded termination, app shutdown and old-operation callbacks.
Coordinate watcher events for generated `.rpyc` without weakening external-write guards
or approved obsolete-bytecode transactions. Game duration has no validation timeout;
do not reuse the eight-second smoke criterion as play acceptance.

Before privileged wiring, record concrete payloads, output/timeout/resource bounds,
trust invalidation and compatibility tables. Update ADR 0002 or add a focused ADR for
material runtime decisions, explicitly distinguishing validation deadlines from play.

**R1 gate:** production-service tests plus supported-target child-process evidence prove
zero spawn on refusal/cancel, correct revision preparation, trust revocation/replacement,
SDK mismatch, duplicate actions, long-running game, script editing/reload behaviour,
asset-mutation refusal/retry, launch-versus-import race, move/delete and inverse blocking, natural exit/crash, cancellation/Stop/output flood and lifecycle
races. Test actual process-tree cleanup on both targets, not only a fake process port.

### Editing during play: bounded proof before UI completion

This is part of 1G.2a/R1, not an additional milestone or a hot-reload feature. Implement
and prove a narrow end-to-end slice using the pinned SDK before broad runtime wiring:

1. Prepare the deliberately chosen saved revision, grant session trust, launch normally
   and keep the game alive beyond the old eight-second smoke limit.
2. Release the lifecycle mutex after short preparation. A core-owned runtime supervisor
   retains operation/session/process identity independently; Stop/status can run while
   authoring requests continue. Do not keep a request holding the lifecycle lock for
   the game's lifetime. Reuse existing path/environment/SDK checks.
3. Edit and save dialogue while the game runs. The editor remains usable and status
   shows that play started from an earlier revision. Saving must not automatically
   restart/reload the game or claim that the new dialogue has executed.
4. Verify the pinned SDK mechanism for suppressing automatic script reload and define
   the policy for runtime reload shortcuts. Record observed behaviour; no hypothetical
   launch flag counts as proof. Stop then Run is the Phase 1 way to deliberately run
   the latest saved revision. No live state migration or Run From Here is required.
5. Attempt an asset mutation during play and assert refusal with no file/history change;
   then Stop and retry successfully. Include an asset-changing compound command/history
   inverse and the launch-versus-import race in automated coverage. Do not build or test
   successful live asset refresh. Existing-asset selection that edits only script
   references remains allowed under the ordinary script-edit contract.
6. Prove targeted refusals for move/delete and history inverses that conflict with
   runtime file ownership; offer Stop and retry. Supported script edits remain available.
   Publish the compatibility table before expanding beyond this slice.
7. Test natural exit, Stop, crash, app shutdown and project switch/cancel, including
   descendants retaining pipes. Cleanup has bounded deadlines and releases ownership;
   an old callback cannot change the next project or runtime operation.

Agent-run Windows/macOS process evidence is required at R1. No user physical testing
is requested here. Missing host access leaves R1 blocked; it is not substituted with
browser-only evidence or passed on to the user. A failure to control reload or allow
safe supported script edits is a specific design finding for review, not permission to freeze
the whole editor or quietly introduce project snapshots.

## 6. 1G.2b — Runtime UI and navigable diagnostics

Wire Validate to pinned compile/lint and Run Game to standard game entry.
Validate is an explicit bounded compile-then-lint operation; compile failure stops that
validation sequence, lint uses its documented failure exit policy, and warnings alone
remain warnings. Run performs preparation/trust checks then the pinned SDK's normal
launch (including compilation it normally performs); it does not silently launch an
extra lint/Validate cycle. Known prior diagnostics remain revision-qualified and do
not masquerade as a fresh validation pass. Launch/runtime failure is shown as failure.
Any later combined Validate-and-Run action needs its own explicit reviewed contract. A validation
failure has a distinct terminal result from timeout, cancellation, stale result or
unavailable SDK; warnings are not errors. Run and Validate remain deliberate actions;
document required preflight and do not introduce hidden background project execution.
The toolbar and bottom Diagnostics/Runtime panels expose running/stopping/finished/failed
states, Stop, bounded output and the tested/launch revision.

Use a structured diagnostic: origin (static/compile/lint/runtime), severity, bounded
message, safe project-relative location when proven, optional line/column, source revision,
operation/session identity and freshness. Parse known pinned-SDK formats and multiline
errors, preserving bounded fallback text when location/severity cannot be established.
Failure without parsed diagnostics remains failure; an empty list is not a pass.

Only navigate to a current validated project file. Recheck file identity and revision;
stale results show stale locations without selecting a different current Beat. Existing
Source scope covers approved `game/` `.rpy` files; do not narrow it to Scene files or
expand to arbitrary host paths. For other diagnostic files, offer read-only inspection
only through a separately bounded existing/approved core path, or show a non-navigable
diagnostic. No general file opening capability. Test Unicode, BOM/newlines and absent
columns, paths containing spaces, deleted files and unparseable diagnostics.

**R2 gate:** real SDK compile and lint failures navigate correctly; trusted normal play
runs both authored routes to asserted dialogue/state/assets; Stop works after a session
longer than the smoke limit. Verify saved-revision versus draft choices, refused Save All,
script editing/staleness and asset-mutation refusal, runtime errors, static/SDK separation, output bounds and
keyboard/focus/resize in actual Windows/macOS packages. DOM/browser tests supplement
native evidence and cannot replace it.

## 7. Deferred optional Git

Former 1G.3a/1G.3b and V1/V2 now belong to [optional Git](optional-local-git.md).
Existing project-creation Git init remains; new Git work is not required for Phase 1.

## 8. Capability closure

At the end of 1G.2b review G1/R1/R2 on the final candidate, including a small real-service
packaged workflow and the final human session defined in TESTING. Keep implementation,
automated proof and human acceptance separate. No checkpoint earlier in 1G requires
routine user physical testing. 1G remains unaccepted until the supported-target final
matrix and user review are complete. 1H remains separately selected integrated acceptance.

## 9. Verification and checkpoint handoff

Run relevant cheap checks first: `python3 scripts/validate.py`, `git diff --check`,
and, from `app/`, `npm run check`, `npm run build`, `cargo fmt --check --all` and
`cargo test -p loomlight-core --locked`. Use targeted regressions while developing;
retain the repository's SDK/source regression commands where affected. Desktop/package
commands and the existing supported-target workflow remain governed by
[TESTING](../../TESTING.md). Do not invent a parallel CI controller or widen privileges.

[Testing ownership and cadence](../../TESTING.md#phase-1g-testing-ownership-and-cadence)
is authoritative for this revision: agent-run development/native evidence, one focused
human session at the end of 1G, and no automatic duplicate physical pass in 1H.

Name new scenarios and expected outcomes before implementation. Bound and independently
report them with stage timings and reliable failure reports, including cleanup failures.
Do not append every scenario to one opaque smoke. No duplicate expensive run of unchanged
validated inputs and no package matrix for this documentation-only planning PR.

At each implementation handoff update this ledger and the single live HANDOVER/CURRENT:
selected authority, state, branch/PR, exact candidate, changed contract, commands/counts,
skips/unavailable evidence, run/attempt/SHA, failures and next bounded action. No repeated
model polling; publish a precise awaiting-CI/manual-resume handoff when necessary.
Update canonical UI/data/architecture/security/testing docs with implemented behaviour.
Merge/archive only after the relevant review and integration authorisation.

## 10. Planning coverage and review record

The September 22 record below preserves original decisions. Git entries are superseded
by the September 25 scope decision and now belong exclusively to optional Git. The
old live-asset-read requirement is superseded by script-only editing and asset-mutation
refusal in section 5. Old
section numbers and V1/V2 references describe that historical plan, not current gates.

| Agreed claim or review correction | Owning requirement / gate |
| --- | --- |
| Shared graph truth, missing versus unknown flow, partial choices | Section 4 / G1 |
| Existing-command graph edits, no connection dragging | Section 4 / G1 |
| Save All / saved revision / Cancel without another Save path | Section 3 / R1, R2, V2 |
| Session trust, explicit invalidation, no implicit SDK execution | Sections 3 and 5 / R1 |
| Continued authoring during play, targeted lifecycle restrictions | Section 5 / R1, R2 |
| Long-lived game, responsive Stop, bounded output and process cleanup | Section 5 / R1 |
| Structured, stale-aware and safely navigable diagnostics | Section 6 / R2 |
| Preserve unrelated staging; resolve selected-path ambiguity | Section 7 / V1 |
| Exact reviewed commit and success after interruption | Sections 7 and 8 / V1, V2 |
| Hostile Git configuration, identity, no repo and first commit | Sections 7 and 8 / V1, V2 |
| Native evidence, accessibility, bounded graph work | Sections 4–9 and 1H |
| All twelve original acceptance cases | 1H matrix H01–H12 |
| Preserve active 1F, Phase 2 and execution approval boundaries | Sections 1–2; planning PR scope |

Planning self-review explicitly supersedes the earlier suggestions of navigation-only
Branches, a whole-session editor lock and refusal for any staged Git content. Technical
mechanisms remain proof obligations in their owning checkpoints, not claims of tested
implementation. Repository validation and remote-diff review belong to this planning
publication; application/native acceptance has not been run by it.

### Post-publication review

The review of [planning PR #15](https://github.com/Caldwell-41/Renpy-editor/pull/15)
against the agreed conversation and parent contract found two precision gaps in the
initial planning candidate `7a71eb94e916a91b9ae6914a85934ad099f3d895`:

- A statically named target is not proven missing merely because no mapped Scene owns
  it. Section 4 now requires proven absence and treats incomplete/ambiguous inventories
  as unknown, with H07/H11 regression coverage.
- Continued editing means the game can read changed files after launch. Section 5 now
  distinguishes launch provenance from immutable runtime input; H08 tests live-read
  status separately from deterministic route acceptance.

All previously agreed decisions map to the table above; H01–H12 retain the parent's
complete acceptance matrix. Remote review confirmed five Markdown paths only, with
CURRENT/HANDOVER, active 1F files, code/workflows and Phase 2 content preserved.
The local repository validator passed for 208 files and staged whitespace checks passed.
Git safety and runtime coordination remain unimplemented proof gates, not unresolved
planning omissions. This review makes no native acceptance or merge claim.

## 11. September 25 planning amendment

**Authority:** user requested optional later Git, accepted the review fixes/testing and
authorised documentation updates and then review/integration. **State:** documentation
accepted/integrated through PR #16; every
application checkpoint stays `not_started`.

Reviewed main `f6c269278aa1d8955876ca45bac98a92940e1c5e`, remote branches/open PRs,
AGENTS/WORKFLOW/status, 1G/1H/parent plans, canonical docs and relevant implementation.
No matching active planning or implementation PR existed; the older planning branch is
already integrated. A fresh isolated checkout owns this documentation checkpoint.

Changes: GIT.1/GIT.2 are deferred; 1G retains three checkpoints; shared flow/operation
preparation and diagnostics contracts are clarified; R1 front-loads editing-during-play
proof; TESTING assigns automated/native/human ownership, real-service package coverage,
final manual acceptance and bounded 1H reuse. Phase 2 implementation and accepted 1F
results are unchanged. Historical Git/security requirements survive in optional Git.

Validation/publication results are recorded in the single live HANDOVER; no application,
SDK, package or physical test is claimed by a documentation check. Planning review is
closed; implementation requires separate checkpoint selection.

### Script-only play clarification

The user confirmed supported script editing/saving during play and excluded asset
updates. Section 5 now requires Stop before asset mutations, with core refusal and
race/history coverage; the former live-asset-read acceptance case is removed. Existing
asset references can still be edited in scripts. No custom hot reload, runtime snapshot
or new manual test session is introduced. This amends documentation PR #16 from
`b9226360165fe2a8c22244f5e5812fe0a713bd5f`; implementation remains unstarted.

### Final review and integration

The September 25 user requested review against this conversation and merge if clear.
Reviewed head `f8e8e9b7407c0201997aa8dd0e3ecdabc1cde801`: no blocking discrepancy
in scope, script-only editing during play, Git deferral, automated/native test ownership,
final human testing or 1H evidence reuse. The initial graph budgets remain hypotheses
to measure, and runtime feasibility is a proof gate rather than an implementation claim.

Repository validation (224 files), whitespace and local anchor checks passed. GitHub
quality run `36101165196` passed for the reviewed head. PR #16 merged at
`5266e55f2a93f2e2df5564c87c6738fd0ef3e2d8`; its tree exactly matches the reviewed
candidate. CURRENT/HANDOVER now continue from main to separately selected 1G.1.
No production dispatch, application changes, branch deletion or implementation occurred.
The active 1G/1H/optional Git briefs remain active because their implementation is unstarted.

## 12. 1G.1 execution ledger

### Entry and test contract — 2026-09-25

Authority: user selected Phase 1G.1 only, including implementation, targeted automated
checks, bounded review fixes and checkpoint publication. No merge, runtime, optional
Git, Phase 2, full package matrix or user physical testing is selected.

Baseline: freshly verified main `924619def6f624f336032c3ebc8499ccfcc662f0`.
No matching implementation branch/PR existed in the remote inventory. This isolated
checkout owns `feature/phase-1g-branches-runtime`; no other local worktree or changes
were present. Cross-host worktrees cannot be inspected from here; no conflicting
published ownership was found. Historical branches and abandoned PR #12 are preserved.

Before implementation, use these named scenarios and budgets. Implementing agent owns
all development evidence on Linux x86-64; Windows/macOS WebView/native measurements
remain explicitly deferred to final 1G. Exact candidate and results follow below.

| Scenario | Expected observation | Command/layer |
| --- | --- | --- |
| G1-flow | Production shared projection: routes/reconvergence, duplicate options, cycles, Jump/Return, missing/unknown/partial choices; unchanged source bytes | `cargo test -p loomlight-core --locked flow` / real service + unit |
| G1-edit | Existing Scene operations change/create destinations, reject referenced deletion, undo/redo and reopen with literal renderer JSON | focused core IPC tests |
| G1-navigation | Source/Scene/Branches retain drafts/caret, refuse stale mapping, ignore old-session completions | `npm run check` / rendered DOM |
| G1-bounds | Explicit over-limit state, bounded deterministic layout and keyboard pan/zoom/fit; external refresh invalidates selection | focused core + DOM/browser |
| 1F-regression | Existing Save, Apply Both and literal Scene wire cases stay passing | core suite, `npm run check`, `npm run test:source-browser` |

Declared limits before measurement: 500 mapped Scenes / 2,000 edges; label inventory
at most 2,048 source files, 32 MiB aggregate UTF-8 source and 16 MiB per file, within
the existing transaction inventory traversal bound. Incomplete inventory never proves
absence. Initial projection/layout target 2 s; accepted update target 250 ms;
input/pan p95 target 100 ms. Measurements will name fixture/host/layer; Linux results
cannot certify either supported target. Graph layout is session-only convenience.

### Implemented checkpoint and bounded review

**State:** `review_ready`, implementation and targeted development checks complete;
not merged, not user-accepted and not final cross-platform G1/1G acceptance.
**Branch/PR:** `feature/phase-1g-branches-runtime`, [draft PR #17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**Application candidate:** `fde8cdafd77fe807f2307fb607fc7546ca66ffec`.
**Verified application tree:** `7828cc1fd1739e741b5cb40f272b2ff81c86efa7`.
The local tested implementation commit was `01c9f1a`; connector publication produced
an exactly equal tree with the remote ownership commit as parent. This closeout adds
only test-evidence refinement and documentation; production code remains that candidate.

Implemented the core `scene::flow` projection and narrow `flow.list` session-checked
IPC; shared lexical boundaries/canonical choice recognition; proven entry from accepted
`start`; revision/range/Beat identity; resolved/missing/unmapped/dynamic/terminal states;
partial choices retaining proven later routes; bounded inventory and graph limits.
Branches provides directed deterministic layout, Scene/route selection, pointer and
keyboard pan, zoom/fit, Source/origin/destination navigation and existing Scene editing.
No independent edge persistence, new Save owner, source exporter or renderer privilege
was introduced. Layout is view-local. Source drafts/carets and uncommitted Scene form
guards remain authoritative. Old-session completions are disposed; observations and
navigation recheck current flow. Unchanged refresh retains focus; ambiguity clears selection.

Self-review findings fixed within 1G.1:

- Mixed menus previously stopped exposing routes at unmapped destinations. The shared
  read-only projection now retains later proven routes and labels the incomplete boundary.
- Duplicate captions need range/revision-qualified option identities, not text keys.
- Incomplete, malformed, tabbed/multiline or duplicate-label inventories cannot prove
  absence/uniqueness. Lexical scanning excludes labels inside multiline strings.
- Project entry cannot be inferred from metadata after runnable `start` changes.
- Accepted byte offsets cannot select a range in retained dirty/stale Source text.
- Inventory/reads need finite entry/byte limits, including empty directories and oversized
  source. Added bounded variants retaining existing transaction caller behavior. The
  graph also caps enumeration at 8,192 entries (existing depth/file limits still apply).
- Async navigation must not update status after disposal. Periodic unchanged observations
  must not destroy focus. Failed inventory/refresh retains a labelled stale last view.
- Rendered edges need visible direction and routes that do not visually imply traversal
  through intervening alphabetical nodes. Arrowed arcs and selected-route styling added.
- Timing a warm reread alone is not accepted-edit refresh evidence. The retained budget
  test now commits a Choice caption through the actual Scene command before timing refresh.

No unresolved blocking finding remains in the targeted implementation self-review.
Conservative unknown-flow handling and basic grid layout are deliberate Phase 1 limits,
not claims of complete Ren'Py analysis or mature layout. Original 1F/F4/native acceptance
is preserved; its automated regressions were rerun without reopening physical tests.

### Executed evidence and provenance

Owner: implementing agent. Host: Linux 6.18.44 x86-64, Ubuntu 24.04, AMD EPYC 9V74
(9 exposed CPUs). Node 24.19.0 / npm 11.9.0; Rust 1.90.0 + rustfmt; locked dependencies.
Commands run from `app/` unless marked repository root. No SDK archive was supplied.

| Evidence | Actual result |
| --- | --- |
| `npm ci --ignore-scripts` | PASS; locked install, no manifest/lockfile changes |
| `npm run check` | PASS; typecheck and 46 frontend/DOM tests, zero failures/skips |
| `CARGO_INCREMENTAL=0 cargo test -p loomlight-core --locked` | PASS; Cargo reports 161 passed / 4 ignored / zero failures. Two of the 161 are official-SDK environment-gated wrappers which returned without running their SDK cases; thus 159 substantive ordinary tests, not 161 SDK-capable passes. Four ignored workers are subprocess helpers, not extra passes |
| `cargo test --release -p loomlight-core --locked flow -- --nocapture` (incremental disabled) | PASS; 8 targeted flow/service/literal-IPC cases, zero failures/ignores; 157 unrelated cases filtered |
| Refined `cargo test --release -p loomlight-core --locked flow_budget_fixture -- --nocapture` | PASS; one changed timing test, 164 filtered. Real accepted Scene edit confirmed before refresh measurement |
| `npm run test:source-browser` | PASS; production build, expected legacy red demonstration, faithful Source Save green, settled-selection Apply Both green |
| `node tests/branches.browser.mjs` | PASS; actual service-produced 500/2,000 graph, distinct routes, origin editing navigation, synthetic keyboard pan/zoom/fit, 640px no horizontal page overflow, zero browser errors |
| Rendered output inspection | PASS in Linux Chromium at 1280x800 plus automated 640px resize; quiet tokens, visible focus/selection, directed routes and responsive controls. Small subview used only for visual inspection after full-scale checks |
| `cargo fmt --check --all`, root `python3 scripts/validate.py`, `git diff --check` | PASS; repository validator checks 228 files including links/privacy/secrets |
| GitHub repository quality | PASS for application candidate: [36123522202](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36123522202), run 395. A follow-up docs/test-head run is separate, not inferred passed |

The browser was Chromium 138.0.7204.0 from an isolated `@sparticuz/chromium` 138.0.2
installation, driven by the locked Playwright. The normal Playwright browser download
failed with an invalid/truncated archive; the explicit executable override was used
and recorded rather than claiming the expected bundled browser. No runtime dependency
or lock was changed. This is real browser rendering with synthetic keyboard events,
not packaged IPC, supported-target WebViews or native OS input.

The unchanged full-size workload is generated by `flow_budget_fixture_500_scenes_2000_edges`:
500 canonical Scene files, four unconditional options each, self-loops/cycles and a
canonical `start` trampoline. Browser input is that real-service JSON via temporary
`LOOMLIGHT_FLOW_EVIDENCE`, not hand-authored test-only edges. For the accepted-update
measurement, one Choice caption changes through the production Scene transaction while
Scene/edge count and topology remain unchanged. Performance observations (not statistically
representative platform certification):

| Measurement | Observed | Declared budget |
| --- | --- | --- |
| Core initial, optimized | 113.55 ms | 2 s initial build/layout |
| Core warm unchanged refresh, optimized | 110.76 ms | reported separately |
| Core refresh after accepted Scene edit, optimized | 113.30 ms | 250 ms |
| Chromium initial layout through two animation frames | 54.70 ms | 2 s initial build/layout |
| Chromium synthetic pan through next frame, p95 of 30 samples | 17.50 ms | 100 ms |

Initial debug observations were 276.15 ms initial / 256.57 ms unchanged refresh; these
are retained, not relabelled optimized passes. Production-profile measurement resolved
the local budget concern without changing a limit. An intermediate debug compile failed
with undefined hidden linker symbols; a nonincremental build passed the full suite.
Later the isolated compiler itself returned SIGBUS on `rustc -vV`; reinstalling its
pinned rustc component restored it, and the refined accepted-update test then passed.
These are retained execution failures, not successful tests or a proven application defect.
The DOM harness initially needed explicit aria-label attributes and the protocol allowlist
expectation updated; both now pass. A shell test fixture initially changed text it had
already replaced; its pending-input setup was corrected and the retained test passed.

### Deferred evidence, publication and next action

DEFERRED to final 1G: actual Windows x64/macOS ARM64 packaged WebView graph edit → disk
→ reopen, target rendering/focus/keyboard/resize and the stated graph performance
measurements. The two SDK gates are SKIPPED here, not target evidence. Full package
matrix, new runtime process proof and user physical testing were NOT RUN at 1G.1.
No final G1/1G native acceptance or supported-target latency pass is claimed from Linux.

Publication uses the GitHub connector because this checkout has authenticated reads
but no Git push credentials. Published application tree was compared exactly with the
locally tested tree; commit author and committer use the account's noreply identity.
Local evidence commits remain preserved. No force push, reset, merge, branch deletion,
workflow change, package dispatch, optional Git or Phase 2 work occurred. Main stays
at the inspected baseline; PR #17 is retained across the 1G checkpoints.

Next eligible checkpoint after user selection: **1G.2a only**, the runtime/trust/revision/
process foundation, following section 5 and TESTING. First verify agent-accessible
Windows/macOS hosts for R1: missing host access is a blocked automated gate, not a
request for user physical testing. Do not begin 1G.2b, optional Git or Phase 2.

### Independent continuation review — 2026-09-25

Authority: user requested a blocker review of 1G.1 and a next-checkpoint goal if clear.
Reviewed PR #17 head `f925a3cde28fc3105b861b159ef75d7e1df513a9` against main
`924619def6f624f336032c3ebc8499ccfcc662f0`, the accepted scope and testing cadence.
Inspected all changed production code, retained test changes, evidence and continuation
contracts in an isolated clean checkout. No other local worktree or published review
thread/change request was present; cross-host ownership is not independently visible.

No blocking finding was identified for progression to separately selected 1G.2a.
The projection retains bounded, conservative missing/unknown semantics; graph navigation
checks revisions and preserves existing Scene/Source write authority. The refined
accepted-edit timing case now measures after an actual Scene transaction. Existing
native evidence deferrals are allowed by the checkpoint contract, not newly waived gates.

Independent checks: locked npm install, `npm run check` (typecheck plus 46 tests,
zero failures/skips), repository validator (228 files) and whitespace passed on Linux
with Node 24.19.0/npm 11.9.0. Current-head GitHub Repository quality
[36124066077](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36124066077),
attempt 1, succeeded on that exact head. Rust was unavailable in this review environment;
core, SDK, browser performance and native results above were inspected, not independently
rerun. No new process/native capability is certified by this review.

This review publishes documentation only and does not merge, mark final G1/1G acceptance,
dispatch CI, or start runtime work. Continue the same branch/PR for 1G.2a after user
selection. Establish agent-run Windows/macOS R1 access first; retain a blocked automated
gate if unavailable, with no request for user physical testing. Preserve 1F/1G.1 safeguards,
scripts-only authoring during play, Stop before asset mutation and deliberate Stop/Run
for the latest revision. Stop before 1G.2b, optional Git or Phase 2.

## 13. 1G.2a execution ledger

### Entry and early R1 feasibility — 2026-09-25

Authority: the user selected 1G.2a only: runtime/trust foundation, agent-run target
evidence, bounded review fixes and publication. No merge, 1G.2b, optional Git, Phase 2
or user physical testing. Entry head `3c42f7e51b51f2cec930a72d3c3ef702ad516482`;
main `924619def6f624f336032c3ebc8499ccfcc662f0`; draft PR #17 remains open.
Fresh remote refs, open PRs and local worktrees were inspected. Older local checkouts,
including uncommitted review documentation, are preserved. This execution owns an
isolated checkout of the published head; no conflicting published runtime work exists.
Cross-host ownership cannot be inspected.

State: `in_progress`, beginning with the section 5 bounded SDK proof before privileged
wiring. The current host is Linux x86-64; no Windows/macOS remote execution capability
is exposed. Existing production CI is a full package matrix, not a targeted R1 gate;
the available connector has read/rerun operations but no workflow dispatch operation.
Shell Git reads work; shell Git write authentication is not established. No automated
target pass is inferred from previous 1F runs or from Linux. R1 target access is BLOCKED
until an agent can run the retained narrow proof on Windows x64 and macOS ARM64.
A later entry below records the branch-triggered targeted workflow fallback; the
initial capability inventory is not a permanent assertion that GitHub cannot run it.

The official pinned SDK archive has been downloaded and its SHA-256 matches the
repository pin. Extraction uses the existing checksum-first containment-checked SDK
installer. It and synthetic execution evidence stay outside Git.

Before broad wiring, investigate the actual pinned reload path and publish observations.
The existing `smoke_run` is explicitly insufficient: eight-second timeout and blocking
pipe-reader joins are not long-lived supervisor/cleanup evidence.

| Scenario | Expected observation | Owner/layer and planned evidence |
| --- | --- | --- |
| R1-reload-proof | Game outlives 8 s; disk script edit does not silently execute; SDK reload shortcut policy is demonstrable; Stop/Run loads saved revision | Implementing agent, actual pinned SDK, synthetic fixture; Linux feasibility first, Windows/macOS required separately |
| R1-service | Short preparation lease, session trust/revision checks, asset refusal/no-write/retry, history and launch/import race | Production service plus literal JSON; must follow the SDK proof, never replaced by a standalone Python probe |
| R1-cleanup | Natural exit, Stop, crash, retained descendant pipes, bounded cleanup | Actual child processes on both targets; unavailable until host path exists |

This entry is an ownership/proof contract, not an implementation or acceptance claim.

### Foundation contracts before privileged wiring

These are implementation constraints/proposals for this selected checkpoint, not
implemented APIs. No renderer capability has been added. The first SDK probe must
succeed before adopting a production reload policy; its developer-off variant is a
candidate, not a silent change to users' game configuration.

| Mutation/operation | Preparing or validating | Running | Stopping/recovery |
| --- | --- | --- | --- |
| Source draft typing, existing-media browsing, graph navigation | Retain input; reads available | Allowed | Retain input; no SDK spawn |
| Accepted replacement of existing script dialogue/definitions plus required metadata | Short preparation lease; validation refuses invalidating writes | Allowed through existing transaction owner; mark earlier launch revision | Wait for bounded cleanup before conflicting writes |
| Existing-asset selection that changes only script references | Same script rule | Allowed | Same script rule |
| Asset import/replacement/rename/move/delete; inventory-changing metadata; mixed command | Drain before launch and recheck under core serialization | Refuse before journal/file/history changes; Stop/retry | Refuse until cleanup finishes |
| Source/compiled-file creation, deletion, move or rename | Recheck ownership and revisions | Refuse conflicts with loaded file/bytecode ownership | Stop/retry |
| Undo/redo | Classify the actual inverse mutation set, not command name | Script-only replacement allowed; asset/file-lifecycle inverse refused | No inverse committed before conflict clears |
| Recovery resolution, project switch/close, trust revoke | Cancel preparation/validation, finish cleanup | Stop/continue or Cancel, then existing draft flow | Never unregister root/session before cleanup; unresolved recovery blocks next spawn |

Core integration points: `TransactionService::commit_with_injector` and
`commit_streaming_import_with_injector` hold the existing serialization guard;
`ensure_directory` can create directories before an import and needs the same barrier.
History routes through the ordinary transaction owner. A UI-disabled import button
or a check solely in `LifecycleService::authoring_import_asset` would not cover all
paths. Runtime reservation must share this serialization boundary so a queued import
cannot pass a check and then race launch. Do not hold the lifecycle mutex through play.

Proposed narrow envelope operations (existing version/request ID/session conventions;
unknown keys rejected): `runtime.prepare {sessionId, kind, revisionChoice}`,
`runtime.grantTrust {sessionId, preparationId}`, `runtime.start {sessionId,
preparationId, trustId}`, `runtime.stop {sessionId, operationId}`,
`runtime.status {sessionId, operationId, afterSequence}`, and
`runtime.revokeTrust {sessionId, trustId}`. Kind is `validate|run`; revision choice is
`saveAll|saved|cancel`. Preparation IDs are core-issued, single-use and revision-bound;
no roots, arbitrary argv, executable paths or renderer-supplied manifests are accepted.
Renderer preparation must first settle Source under the existing lease and present
pending Scene Commit/saved/Cancel as specified in section 3; the core validates accepted
bytes and cannot silently save renderer buffers. Concrete schema remains to be implemented
and proven with literal JSON, including malformed/stale/refusal cases.

Candidate supervisor limits to validate: one operation per session; 180 s total
compile/lint deadline, no play deadline; 2 MiB retained combined output with visible
truncation and monotonically sequenced 32 KiB status pages; 1 s graceful stop, 5 s forced
cleanup, 1 s reader shutdown. Long-lived bounded readers must continue draining or
explicitly cancel with a failure, never unboundedly join after natural parent exit.
Windows needs owned job/process-tree lifetime evidence; reusing `taskkill` alone after
parent exit is not an established descendant-ownership design. Unix process groups
likewise do not imply malicious-process containment.

Trust inventory must include `.rpy`, `.rpym`, Python/native modules, orphan `.rpyc`/
`.rpymc`, executable caches/archives and relevant loader/environment inputs, not only
mapped Scenes. Retain root/session/SDK identities and content digests. Unknown file
provenance or incomplete inventory refuses execution pending renewed inspection/consent.
Accepted editor transactions can advance consent; external executable changes cannot.
Compile/cache output is not benign merely because its suffix is `.rpyc`; capture before/
after manifests and retain uncertainty when SDK output cannot be distinguished from
an external writer. Save/persistent data may also be executable when loaded; do not
blindly exempt it. A conservative renewed-consent result is preferable to falsely
attributing every cache/save change to the owned process. No trust grant is a sandbox.
SDK revalidation must account for its loaded interpreter/modules and `environment.txt`,
not rely solely on the existing launcher's small fingerprint when claiming full identity.

### Retained SDK feasibility probe and targeted host path

Added `spikes/renpy-sdk/runtime_reload_probe.py`, reusing the existing safe archive
installer and closed SDK argument builder. The probe verifies the exact archive digest
and version, creates synthetic temporary projects, and invokes the actual pinned SDK.
It never changes a real user's project. Report fields explicitly distinguish actual
SDK callbacks from native keyboard, production-service and descendant-cleanup evidence.
The probe is a prerequisite experiment, not the runtime implementation or R1 pass.

Declared probe bounds: 30 s per startup/observation, 10 s demonstrated play before
each disk edit, 3 s post-edit observation, 512 KiB retained process output, bounded
cleanup and a structured terminal report on failure. The short probe observation
window is not the production game lifetime limit. Two variants use Ren'Py's existing
`config.autoreload = False`, with developer mode enabled and disabled. They test
loaded-script retention after a disk edit, the engine's actual `_reload_game` callback,
and a fresh process loading the new dialogue. The developer-on case also quits naturally.
The developer-off case is a possible policy only: it also removes development features,
and a production adapter must explicitly establish/revalidate it without silently
changing project configuration or treating trusted Python as sandboxed.

Initial local failures are retained as failures:

- The downloaded archive matched the pin; the first extracted Linux runtime library
  was truncated (19,922,944 bytes versus archive member 39,827,720), causing SIGBUS.
  Restoring it from the checksum-verified archive in the same execution restored
  `Ren'Py 8.5.3.26051504`. This is an environment failure, not a runtime pass.
- SDL offscreen was unavailable. The process stayed alive on an error path; that
  observation was rejected. Linux feasibility uses explicit dummy video/software
  rendering and is never reported as supported-target rendering.
- Probe development fixed an incorrect imported helper name and an invalid synthetic
  `gl_test_image = None`. The probe now rejects errors/tracebacks even while alive.
- SIGTERM reached Ren'Py's quit-confirmation path in the minimal fixture and produced
  an absent-confirmation-screen error. Harness teardown now uses forced termination;
  it does not certify production graceful Stop. R1 must account for a game-controlled
  confirmation and bounded escalation.

Pinned source review: `renpy/common/00keymap.rpy` makes `config.autoreload = False`
perform a single reload; it does not disable Shift+R. The default `_reload_game` and
`_developer` callbacks check `config.developer`. The developer menu also exposes a
direct reload action. Clearing only a reload key binding would therefore be incomplete.
No supported reload-disable CLI flag was found in the pinned argument parser.

The narrowly scoped `.github/workflows/runtime-foundation-proof.yml` is intended to
establish agent-run Windows x64/macOS ARM64 access. It triggers only on this branch's
probe/workflow changes (or deliberate manual dispatch), reuses the pinned SDK cache,
has two ten-minute jobs, and uploads only bounded JSON with three-day retention.
No npm install, Rust build, packaged application or full package matrix is included.
It grants only `contents: read`, pins existing reviewed action SHAs, and does not alter
production CI or its integration trigger. Publishing the workflow may queue native
feasibility jobs; publication/queue/running/success must be recorded distinctly.

Local commands (no machine-specific paths needed):

```bash
python3 spikes/renpy-sdk/runtime_reload_probe.py --archive "$SDK_ARCHIVE" --headless --report "$PROBE_REPORT"
python3 -m unittest discover -s spikes/renpy-sdk/tests -q
python3 -m py_compile spikes/renpy-sdk/runtime_reload_probe.py
python3 scripts/validate.py
git diff --check
```

On the two supported targets omit `--headless`; use `python` on Windows if needed.
The required existing SDK fixture tests passed: 24 tests, zero failures/skips. The
repository validator passed for 230 files; Python syntax and whitespace checks passed.
Final local probe and publication results follow in the closeout below. Production
core/renderer tests are not rerun because no production application file changed.

### Remaining 1G.2a work and gate boundary

R1 is INCOMPLETE. No new production commands, trust grants, preparation controller,
runtime supervisor, mutation barriers, history enforcement or lifecycle wiring have
been implemented. Asset refusal/retry, launch/import race, stale/session/malformed
literal IPC, SDK replacement/revocation, validation cancellation/output flood, process
descendant cleanup, app shutdown and project switch/cancel still need production
implementation and both-target evidence. The SDK-only probe cannot close those gates.
All 1F/1G.1 production code and safeguards are unchanged.

Continue **this same 1G.2a checkpoint**, not 1G.2b. First inspect the exact targeted
workflow result and artifacts (or resolve publication/access failure). Once the
prerequisite is sound, implement the narrow production slice using section 5 and the
contracts above, record a focused runtime ADR when its mechanism is evidenced, and
complete the actual R1 service/target gates. Do not duplicate an outstanding run.
No user physical testing, merge, optional Git or Phase 2 is requested.

### Local feasibility result and publication candidate

Linux SDK-only result: PASS, two variants, exact `Ren'Py 8.5.3.26051504`.
Developer-on/off remained healthy for 10.004/10.046 s before editing; both kept the
old loaded revision after the disk edit and loaded new dialogue on a fresh Run.
Developer-on's real reload callback reinitialised from new bytes despite autoreload
being false; developer-off's callback returned without reload. Natural quit returned
zero; forced harness teardown reaped each child and closed its output reader in
approximately 0.003 s. No descendants were created, so this is NOT process-tree R1
evidence. Linux used dummy SDL/software rendering, not native visual/input evidence.

The tested probe hash was
`6d4886954653eeb14127611213279f8d6987ad4a8c8c44aa769fb4917423506a`.
The publication then adds report provenance and handles Windows taskkill invocation
failure while still reaping the parent; those are reviewed bounded changes. They do
not create a Windows pass, and exact published-head target execution is required.
No production application files or dependencies changed.

### Published early-proof handover — awaiting CI

**State at original publication (superseded by the inspected PASS results below):** `awaiting_ci` for the prerequisite SDK probe; 1G.2a/R1 is not complete or
review-ready. Production foundation implementation remains outstanding as listed above.
**Published candidate:** `c72b4f675605cdf09cf01b4558a5c1bf69f2f852`.
**Verified candidate tree:** `8038b28ef428ad6548fb8eb53b77ecc83d0279e5`, exactly equal
to local probe/workflow/contracts candidate `799a949`. Earlier entry publication was
`e5ed02e7f4c1d6c12dcf6ac35df80ff7c712cef3`. Connector Git objects use the account's
noreply identity, with fast-forward ref updates and no rewritten remote history.

Publishing the branch-triggered workflow successfully established a hosted execution
path; it supersedes the initial unavailable-direct-host inventory. No manual dispatch,
rerun or production package run occurred. Targeted run
[36126490939](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36126490939),
**attempt 1**, started on the exact published candidate. At the single initial
job inspection, both checkout and pinned SDK cache restoration had succeeded and
both actual SDK fixture steps were `in_progress`:

- macOS ARM64 job `108043687197` on `macos-26`.
- Windows x64 job `108043687466` on `windows-2025`.

No terminal result or artifact is inferred. Artifacts, when available, are named
`runtime-sdk-feasibility-macos-26` and `runtime-sdk-feasibility-windows-2025`; each must
contain the exact candidate/probe digest, expected platform/architecture, both cases
and all required observations. These results would establish only SDK feasibility,
not the missing production service or full R1 evidence. Missing/failed target proof
remains blocked and is not transferred to user physical testing.

Current-candidate repository quality
[36126493914](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36126493914),
attempt 1, completed successfully. A later documentation handover quality run is
separate; do not manufacture its result. The documentation-only follow-up does not
trigger another SDK run. This checkpoint updates PR #17 metadata to reflect the
incomplete runtime foundation and retains the draft/open state.

`AGENTS.md`/`WORKFLOW.md` require a published manual-resume handover rather than
repeated model polling when a qualified same-thread event continuation is unavailable.
No such continuation is configured here. This is that required stop, not checkpoint
acceptance. Do not redispatch while the above operation is outstanding. Resume by
reading its existing jobs/logs/artifacts, resolve bounded probe findings if any, then
continue only the remaining 1G.2a production slice and R1 gates. The branch/PR remain
unchanged; main is not merged.

### Resumed production foundation — 2026-09-25

User selected continuation of 1G.2a, preserving the same branch/PR and excluding
physical testing, merge and later checkpoints. Fresh refs match published head
`8ab3063d283423dcda1135630315645c1320b959`; the owned checkout is clean at entry.
The existing run `36126490939`, attempt 1, completed successfully; no duplicate was
started. Both logs and artifact reports were inspected. ZIP CRCs and SHA-256 match
GitHub: macOS `a1a7d390bf15d98beb6a812072bc7d8bbecbead39c02da48c0d740b399ab11d3`;
Windows `99f9e8496a3d6aba3d27a2b8b1dfaeef2a42607d63b403bd2862ce5a50ce5d5c`.
Both name candidate `c72b4f675605cdf09cf01b4558a5c1bf69f2f852`, pinned SDK version
`8.5.3.26051504` and probe digest
`f4ac6ab8710ede77053dd816bfde53ea2d76644e2a407ad59c3fbf5bf12c79dd`.
Windows AMD64 developer-on/off play intervals were 10.000/10.016 s; Darwin arm64
10.055/10.060 s. Both cases passed on each target. This closes the SDK feasibility
prerequisite only: production service, native keyboard and descendant cleanup remain
explicitly NOT RUN in those reports.

Implementation begins with the serialized transaction reservation/barrier: prepare
drains in-flight transactions, validation blocks invalidating writes, play permits
script edits and required metadata while refusing asset/file-lifecycle conflicts,
and Stop retains the barrier until cleanup. Test the actual transaction/import/history
paths, not only a policy predicate. No broad runtime UI is selected.

### Production foundation candidate and bounded review — 2026-09-25

Implemented the selected 1G.2a slice on the existing branch/PR after inspecting the
successful, unchanged prerequisite run. No duplicate of run `36126490939` was created.
Fresh refs and PR #17 remained at `8ab3063d283423dcda1135630315645c1320b959`; main remained
`924619def6f624f336032c3ebc8499ccfcc662f0`. Older checkouts/local evidence were preserved.

**Production changes:** `LifecycleService` now owns explicit preparation, inspectable
session trust, token-bound cancellation/start/Stop/status/revoke and independent process
supervision. Requests reject unknown keys and stale session/preparation/operation IDs.
Prepare binds the selected approved `sdkId`, kind and `saveAll|saved|cancel` choice;
Save All calls the existing Source owner. `runtime.cancelPreparation` is token-bound:
a stale cancel/grant cannot release a newer preparation. Renderer coordination extends
the existing Source input lease, retains pending Scene forms, and directs explicit
Scene Commit before retry; it never auto-commits forms. Broad Run/Diagnostics controls
remain excluded as 1G.2b.

Trust inventories use identities and SHA-256 across project executable/data inputs and
the full SDK, including `environment.txt`, interpreter/modules, archives, orphan compiled
files, caches and saves. Accepted transactions advance consent only from recorded bases.
Unknown generated-output provenance conservatively requires renewed consent. Close/reopen,
root replacement, SDK mismatch and external executable changes cannot inherit a grant.
The policy, limits and decisions are in [ADR 0008](../../adr/0008-controlled-runtime.md).

`runtime.installPolicy {sessionId}` explicitly creates the reviewed policy script through
the transaction layer, refusing a different existing script. Controlled Run uses standard
entry, disables developer/console/default reload paths, and directs default saves into
inventoried `game/saves` with the actual pinned SDK `--savedir` option. Script writes stay
reserved until the policy's display-start readiness callback. Startup/validation are
bounded at 180 s; established play has no duration timeout. Trust is not sandboxing;
project Python can deliberately override policies/access external resources.

The transaction reservation shares the commit/import serialization lock: it drains
in-flight asset work, refuses new imports before reading/staging, and checks every
compound mutation/history inverse before journal changes. Script replacement/new scripts,
required metadata and chapter directories remain available during established play.
Assets/inventory, loaded script/compiled lifecycle conflicts and the policy script require
Stop. Refusal leaves files/history unchanged; retry succeeds after cleanup.

The worker retains process ownership independently of the lifecycle request mutex. Unix
uses a process group with an unreaped leader to prevent PID reuse; Windows assigns a
kill-on-close job before resuming the suspended initial thread. Natural exit/crash also
clean descendants and pipes. Output retains at most 2 MiB, paged in 32 KiB byte windows,
with visible truncation. Readiness detection continues after retention truncates.
Stop allows 1 s graceful response, 5 s forced cleanup and 1 s pipe shutdown; failure keeps
the reservation blocked. Desktop exit explicitly calls runtime shutdown. Core close/switch
refuse active preparation/cleanup, then retain the existing draft leave flow. Status carries
launch digest, accepted-edit earlier-revision state and conservative terminal manifest
staleness; generated output is not silently attributed to the SDK.

**Bounded findings fixed:** startup writes before script loading; case-insensitive loaded
path ownership/policy matching; Unix save paths relative to the anchored working directory; readiness hidden by output truncation; overly broad new
chapter-directory refusal; stale grant cancelling newer preparation; consent advancement
for streaming transactions; reader shutdown after natural exit with retained descendant
pipes. Invalid identity/recovery checks remain fail-closed. No newer remote work was replaced.

| Local gate | Result and evidence scope |
| --- | --- |
| `cargo test -p loomlight-core --locked` | 173 passed, 0 failed, 6 ignored (four existing subprocess workers, new runtime subprocess worker, explicitly invoked SDK gate). Preserves existing hostile race/recovery and 1F/1G.1 tests. Old SDK wrappers without their archive environment are not target evidence. |
| Targeted `runtime_` tests | 13 passed, 2 explicitly ignored entry points: subprocess worker and separately invoked official SDK gate. Real child tests cover 9+ s play, responsive Stop, shutdown, natural exit/crash, descendant-held pipes, flood/truncation and a shortened validation deadline through the production worker. |
| Explicit official SDK service gate, release | PASS on Linux x64, verified official 8.5.3 archive. Final run 46.57 s, 1 passed, 0 ignored. Real literal handler/service requests prove saved/Save All/cancel, SDK mismatch, external project/SDK changes before spawn, stale grant isolation, long play, script Save/earlier revision, no automatic/default-callback reload, asset Undo refusal/no-write/retry, Stop/Run latest, stale Stop, revoke/reopen and compile/lint. Main menu is skipped only in test environment; production argv remains standard entry. |
| `npm run check` | 48 passed; no skips. Includes real Source controller lease tests for pending Source/Scene, saved choice, explicit Commit routing, Save All success/failure and input retention. |
| `npm run build` | PASS. |
| `npm run test:source-browser` | PASS using available local Chromium through the existing executable override. Legacy regression reproduces dirty-after-Save; faithful model stays clean (one Save, zero Flush), and selection/Apply Both regression passes. Initial default browser launch failed because its binary was absent; Playwright's bundled installer then failed on truncated ZIPs. Neither failed attempt is a pass; existing Chromium completed the actual tests. |
| Windows job implementation cross-typecheck | Exact `platform/windows.rs` typechecked for `x86_64-pc-windows-msvc` against locked windows-sys. This is compile evidence only, not native execution. |
| Repository validation/format/whitespace | PASS; repository validator inspected 240 files, including the staged candidate. |

**Target gate:** the separate `runtime-foundation-r1.yml` workflow runs production core/native child tests,
explicit official-SDK service gate, frontend/Source regression and desktop boundary tests
on Windows x64 and macOS ARM64. It reuses the official archive cache, retains outcome/input
hash reports and bounded logs for seven days, and leaves the original feasibility workflow unchanged. It does not build/upload packages or rerun
the unchanged synthetic probe. Native keyboard and packaged runtime UI are not claimed.
Full R1 remains BLOCKED pending inspection of this candidate's target evidence. Missing,
failed or skipped steps must remain blocked. No merge, 1G.2b, optional Git, Phase 2 or user
physical testing is authorised by this publication.


The user's in-flight continuation update was reconciled against local commit `f340ec3`
and fresh remote head `8ab3063`, without restarting or discarding work. The initial
publication tree matched the local tree exactly but no branch ref had advanced. Native
production R1 uses a **new workflow file**, `runtime-foundation-r1.yml`; the completed
feasibility workflow remains byte-for-byte unchanged and is not dispatched again.


### Native candidate publication and fixture correction

Published production candidate `5513213904aadf8921e0b1e3f14edbe350a42fcd`, exact tree
`ce556e32db68ad4a02d3cc7dbd43ccba0cba1a83`, on PR #17. Repository quality run
`36135946972`, attempt 1, passed. Separate native R1 run `36135942863`, attempt 1,
started Windows job `108073910373` and macOS job `108073910786`; no terminal result was
claimed at inspection. The feasibility workflow was unchanged and did not run again.

Final target-path review then identified a fixture-only defect before treating any
native result as evidence: direct process tests supplied an uncanonicalized temporary
root to the strict transaction registration API. Windows extended path prefixes and
macOS temporary-directory aliases require canonicalization, just as existing transaction
fixtures already do. Corrected both fixture entry points, and made the short real-process
validation deadline 2 s to allow native worker startup. Application code is unchanged.
The original production run is **superseded**, not passed or silently erased; preserve its
actual outcome/logs. The corrected candidate needs its own exact native test evidence.


The correction passed repository/whitespace checks. Its local Rust rerun could not start:
the previously available portable Rust/Cargo dependency directory disappeared from the
host after the in-flight continuation. No result is claimed for that attempted rerun.
Earlier completed production/SDK/core results remain recorded on their actual inputs;
the fixture-only correction is gated by the new native workflow's format/build/tests.

### Published correction and native evidence handover

The superseded native run `36135942863`, attempt 1, **FAILED on both targets**. Full job
logs were inspected. Windows: 8 passed, 4 failed, 2 ignored; macOS: 9 passed, 4 failed,
2 ignored. All four failures stopped at strict root registration with `UnsafePath`,
confirming the fixture defect above, before native process cleanup could be exercised.
Frontend and preserved Source browser gates passed on both targets. Desktop and real-SDK
service gates were **skipped**, not passed. No other failure was observed in those logs.

The corrected candidate is **`ad2627c4a0347261098f12883419672ecffc6e29`**, exact tree
**`381829ad05445ef6d0f385b84a1d9eec02e7bff0`**, published on the same branch/PR with
non-forced updates. Repository quality [36136473094](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36136473094),
attempt 1, passed on that candidate. Application code is identical to `5513213`;
only native fixtures and their ledger changed. Local evidence commits `f340ec3`,
`f443ff6` and `6ae7d34` are preserved under local evidence branches; no work was reset.

**Historical outstanding production R1 (superseded by the review below):** [run 36136466567](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36136466567),
**attempt 1**, exact corrected candidate above. At the single entry inspection,
Windows job `108075623934` and macOS job `108075624153` were in progress.
Expected artifacts: `runtime-foundation-windows-2025` and
`runtime-foundation-macos-26`, seven-day retention. Inspect actual step outcomes,
logs, ZIP hashes/CRC and outcome/input-hash reports; a green frontend alone is not R1.
No terminal production result is claimed here. The original feasibility run remains
PASS on both targets and was neither rerun nor replaced by this production workflow.

**State at that publication (superseded below):** `awaiting_ci` / R1 BLOCKED, not review-ready or accepted.
Repository validation passed for 241 files and whitespace passed after the fixture
correction. Its attempted local Rust rerun was unavailable as recorded above; native
format/build/tests remain the correction's gate. The earlier completed application
and SDK results are not promoted into a native pass.

`AGENTS.md` and `WORKFLOW.md` require a published manual-resume handover instead of
model polling when no qualified event continuation exists; none is configured on this
host. Stop active polling. Resume only this exact run's evidence review and bounded
1G.2a fixes. Do not duplicate dispatch, request user physical testing, merge, or begin
1G.2b, optional Git or Phase 2. If further local Rust work is needed, first establish a
currently available portable toolchain rather than assuming the vanished dependency
location remains usable. Publication is verified by exact tree equality; this final
documentation update does not trigger another production runtime run.


### Native evidence assessment and remaining R1 blockers — 2026-09-25

**Current state: `blocked`, not review-ready or accepted.** The user selected resume
and close 1G.2a only, explicitly allowing a stop at a specific remaining blocker.
This review closes the outstanding-run inspection, not R1. Production is unchanged;
no replacement/duplicate run, merge, 1G.2b, optional Git, Phase 2 or physical testing.

Fresh Git fetch/ls-remote and PR metadata agreed on head
`e2d5c886dfe4b981971dba214da5ecb8318500db`, main
`924619def6f624f336032c3ebc8499ccfcc662f0`, open draft PR #17. Its diff after
`ad2627c4a0347261098f12883419672ecffc6e29` is documentation only. The clean continuation
checkout and existing local evidence branches were retained. An older worktree has
unpublished 1G.1 review documentation already represented in the published ledger;
it was inspected and left untouched. No local competing executor was observed;
cross-host ownership is not independently observable. Other open PRs are unchanged.

#### Verified existing run and artifact provenance

Production [36136466567](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36136466567),
**attempt 1**, ran candidate **`ad2627c4a0347261098f12883419672ecffc6e29`**, tree
**`381829ad05445ef6d0f385b84a1d9eec02e7bff0`**. Both complete job logs and all six
files in each artifact were inspected. Checkout log, artifact metadata and report
candidate/run/attempt agree. ZIP byte size, SHA-256 and CRC pass. Every one of the
26 core Rust input hashes in each report matches `git show` at the candidate (Windows
path separators normalized for lookup). That report covers core Rust files only;
frontend/desktop/workflow provenance comes from the exact logged checkout, not an
invented all-input hash manifest.

| Target | Job / artifact | Results |
| --- | --- | --- |
| Windows x64, Windows Server 2025 build 26100 / AMD64 | `108075623934` / `10864982957`, `runtime-foundation-windows-2025` | Core 12 passed, 0 failed, 2 ignored; explicit SDK 1 passed, 0 ignored (99.40 s); frontend 48 passed; Source browser PASS; desktop 1 passed; format PASS |
| macOS ARM64, macOS 26.6.2 / arm64 | `108075624153` / `10864657289`, `runtime-foundation-macos-26` | Core 13 passed, 0 failed, 2 ignored; explicit SDK 1 passed, 0 ignored (95.04 s); frontend 48 passed; Source browser PASS; desktop 1 passed; format PASS |

Windows ZIP: 11,106 bytes, SHA-256
`4ed51f10e5e4a62e361918bd40192c2a01d33e89865f2ed8e175b8957368a168`.
macOS ZIP: 10,514 bytes, SHA-256
`bc525c165cd6769531e59807b685c65bbb6189bc298dbf30f063a52dfb2b84c3`.
Both expire 2026-10-02. The two ignored entries are the explicitly invoked SDK gate
and re-executed child fixture, not passing tests in the filtered core count. macOS
has one extra Unix-only manifest/link/root-replacement test. The skipped download
step is a verified SDK cache hit, not a skipped SDK gate. Native keyboard and
packaged runtime UI remain explicitly unexercised and belong to later 1G acceptance.

Prerequisite `36126490939` remains PASS on its own candidate, with the previously
verified artifacts/hashes preserved above. Superseded `36135942863` remains FAILED
with skipped desktop/SDK gates; the corrected successful run does not erase it.

#### R1 requirement assessment

PASS here means the named bounded case is evidenced, not acceptance of the whole gate.

| Requirement | Assessment at this candidate |
| --- | --- |
| Literal production IPC, malformed/stale refusals, zero spawn | PASS for retained handler/service cases; cancellation **during** preparation is missing (R1-B1) |
| Saved / Save All / Cancel, Source and Scene input retention | PASS for tested preparation choices and renderer lease cases; uncommitted Scene routes to explicit Commit, never auto-commits |
| Session trust, SDK mismatch/external edits, orphan bytecode, revoke/reopen | PASS for retained service/manifest cases; conservative renewed consent for unknown generated output; Windows root replacement is not the Unix-only test |
| Long play, script saving, launch/earlier revision, no default reload, Stop then Run latest | PASS through real pinned SDK/service on both targets; no live assets or immutable snapshot claim |
| Asset/compound/file-lifecycle barriers, refusal/no-write and retry | PASS at transaction/service boundary for tested cases; real user history-stack and move/Stop/retry combinations need completion under R1-B2 |
| Launch versus import / queued writer race | PASS for serialized in-flight asset transaction drain, late refusal and streaming-import refusal/retry; no live asset refresh tested |
| Independent worker, responsive Stop/status | PARTIAL: direct worker Stop is timed, but production IPC shares the blocking lifecycle mutex (R1-B1) |
| Output flood, truncation, validation deadline, natural exit/crash | PASS for actual native child fixtures; 2 MiB retention and 32 KiB byte pages; timed validation is not a play deadline |
| Preparation/start/validation cancellation and lifecycle races | PARTIAL: completed-preparation cancellation, stale tokens and worker timeout covered; in-progress preparation/control contention and boundary cancellation cases missing |
| Actual descendant cleanup across Stop/exit/crash/project switch/shutdown | PARTIAL: native worker fixtures retain descendant pipes and assert heartbeat stops; project switch and service shutdown are not exercised with those descendants (R1-B2) |
| Preservation of 1F and 1G.1 | No application changes in this review; native frontend/Source regressions passed; prior core/G1 evidence retained, final packaged/native 1G acceptance still deferred |

#### R1-B1 — request ownership prevents in-progress cancellation and responsive control

This is a source-confirmed implementation gap, not a failed CI assertion or a measured
latency claim. `core_request` in `app/src-tauri/src/main.rs` holds `DesktopState.0`
through the complete handler and blocking native file dialogs. Every `runtime.stop`,
`runtime.status` and `runtime.cancelPreparation` request needs that same lock.
`LifecycleService::runtime_prepare` synchronously inventories the project and full SDK
before assigning/returning a preparation ID. `runtime_grant_trust` and `runtime_start`
repeat full manifest scans under the same request lock. Inventory byte/entry limits
are not cancellation or wall-clock bounds. The renderer also retains its Source input
lease across the awaited prepare request. Therefore a preparation cannot be cancelled
while the scan is running; a still-open asset picker during play can defer Stop/status
until the dialog returns. The `<100 ms` worker Stop assertion does not cover this path.

The worker also performs its terminal manifest scan before setting `cleaned`, releasing
the gate and returning; `RuntimeProcess::drop` joins it synchronously. The documented
process/pipe deadlines consequently do not bound the complete shutdown path when that
scan stalls. No measured large-project shutdown pass is claimed.

**Required correction within 1G.2a:** return a session-bound operation/preparation
handle before long work; put cancellable/bounded inventory and rechecks outside the
shared lifecycle lock and long renderer lease; retain short, serialized final identity/
revision/reservation checks and zero spawn on cancellation. Make token-checked control
reachable independently of dialogs/long authoring work, with stale-session revalidation
when those tasks finish. Bound or cancel terminal freshness work separately from child
cleanup. Add deterministic slow-work/held-dialog-equivalent barriers that prove Cancel,
Stop and status responsiveness through production dispatch, including stale completion
and retained drafts. Do not weaken manifests, consent or mutation serialization.

This requires a coordinated request/supervisor ownership correction, not a safe
receipt-only or single-guard closeout fix. Stop at this specific architectural blocker;
do not mark R1 passed or start 1G.2b while it remains.

#### R1-B2 — service lifecycle and history evidence is incomplete

`runtime_long_play_responsive_stop_and_shutdown` calls `drop(RuntimeProcess)` and checks
its descendant heartbeat. It does not invoke `LifecycleService::runtime_shutdown`, a
real service drop, or a project switch. The SDK gate tests busy close/open and later
close/reopen, but its game has no descendant fixture. The sole desktop test is
`only_successful_smoke_reports_enter_the_accepted_path`: it compiles the shutdown hook
but does not exercise it. Thus all these green tests together are still short of the
explicit service-lifecycle cases in section 5.

Transaction tests construct proposals labelled Undo/Redo; they prove the low-level
barrier but do not prove real history stacks remain unchanged after a refused inverse
and retry once after Stop. Loaded script/bytecode deletion refusal is covered, but a
real move/delete plus history and successful Stop/retry combination is not established.

**Required evidence:** add actual child/descendant service tests for switch Cancel,
Stop then switch, `runtime_shutdown` and service drop; retain old-session/callback
isolation and drafts. Exercise starting/validation cancellation and cleanup failures
without releasing the reservation. Use explicit process-liveness observations as well
as heartbeat/pipe closure, including descendants that close inherited output. Unix
cleanup currently checks leader exit and pipe EOF rather than independently waiting
for group emptiness; inspect/fix any early-release finding exposed by those probes.
Exercise actual authoring history Undo/Redo and file lifecycle no-write/refusal/retry.
These are missing cases, not a claim that an orphan or history corruption was observed.

#### Continuation and publication boundary

No application/workflow change or new native dispatch is part of this review. Bounded
documentation corrections update live status, handover, parent-plan state and ADR
limitations; the full evidence and failure history remain in this ledger. Documentation checks PASS: `python3 scripts/validate.py` (241 files) and
`git diff --check`. Publish on the same branch/PR and verify remote contents. No
application test rerun or build/package matrix for documentation.

Next action: **resolve R1-B1/B2 within 1G.2a only**, starting from this preserved candidate.
Read the ownership code before choosing the smallest cohesive correction; use targeted
regressions first, then one replacement native R1 run for the changed candidate. Inspect
that run's exact artifacts rather than rerunning `36136466567` or the prerequisite.
Follow the existing manual-resume CI policy if it is still running; no model polling.
The local Rust toolchain is currently absent, but the official distribution endpoint is
reachable; restore a portable toolchain if doing implementation. Existing compiled test
binaries are historical artifacts, not a way to validate new source.


### R1-B1/B2 correction and replacement-candidate assessment — 2026-09-25

The user selected only R1-B1/B2 from `15f6d1b`, including correction, targeted regression,
replacement native R1 evidence, and publication. No physical testing, merge, 1G.2b,
optional Git or Phase 2. Fresh clone/remote refs and PR metadata agreed on
`15f6d1b07916a9e29ffdc820b871063acfaf5d44` and main
`924619def6f624f336032c3ebc8499ccfcc662f0`; PR #17 remains open/draft. An isolated
macOS checkout preserves prior worktrees and evidence branches. Visible prior Renpy tasks
were idle; cross-host writers cannot be independently ruled out. Fresh refs are rechecked
before publication. Other open PRs (#10/#11/#12) remain untouched.

**R1-B1 correction:** `ApplicationHost` checks the lifecycle service out under a short
publication lock and runs long work outside it. Preparation/grant/start return a
session-bound cancellable request receipt first; source/SDK inventories and rechecks
retain all prior identity, content, consent, transaction-drain and final capability
checks. Directory/hash checkpoints enforce cancellation and a cooperative 180 s budget;
1 MiB hash chunks are the maximum interval between hash checks. Kernel I/O calls are
not forcibly interruptible. The process supervisor inherits the request cancellation
capability; an atomic spawn commitment makes pre-boundary cancellation zero-spawn and
post-boundary cancellation Stop/cleanup. Stop/status/revoke have independent controls.
Dialogs own no service checkout and reject stale-session results. Source releases its
input/coordinator lease on receipt, retaining drafts while inventory continues.

Terminal cleanup no longer hashes the filesystem. Freshness is conservatively stale
until the next complete preparation/recheck; no unknown generated file is attributed to
the SDK. Unix independently waits for group disappearance after reaping, including
closed-output descendants. Cleanup failure retains its process owner/reservation across
repeated shutdown. The concrete IPC/ownership contract is in ADR 0008.

**R1-B2 evidence added:** literal production-host tests hold actual inventory boundaries
in prepare, grant and start, assert responsive status/cancel and zero spawn attempts,
then verify retained drafts, duplicate refusal and stale-receipt isolation. Service tests
exercise switch Cancel, Stop then switch, shutdown and Drop, starting and validating
cancellation, and failure to confirm cleanup. Every lifecycle case uses real child and
descendant processes with both inherited and closed outputs, plus explicit PID liveness
and stopped-heartbeat checks. Cleanup-failure injection happens after real tree cleanup;
it proves fail-closed ownership, not an observed OS termination failure. Held service work
proves Stop/status do not wait for authoring ownership. The desktop's actual dialog
completion helper rejects a replacement session without invoking its mutation callback.

Real Scene history tests exercise move/delete, Undo/Redo, unchanged files/workspace/history
on refusal, and one successful retry after actual child Stop. Undo-delete creating an
unloaded path is allowed during play by design; its all-write refusal is tested during
validation. Asset/compound entries are seeded through the production history owner and
then traversed through real Scene Undo/Redo, rather than proposals merely labelled Undo.
Imports do not gain a new UI history feature. Existing transaction race/barrier cases and
Source/Scene/Save regressions remain. The real SDK gate additionally exercises the exact
new desktop host prepare/grant/start/status/revoke/shutdown path.

**Final local candidate validation:**

| Gate | Result |
| --- | --- |
| `cargo test -p loomlight-core --release --locked` | 178 passed, 0 failed, 6 ignored; includes existing transaction/crash/history/1F/1G.1 safeguards |
| Release `runtime_` filter | 18 passed, 0 failed, 2 ignored (subprocess fixture and separately invoked official SDK gate), 9.32 s |
| Explicit release `runtime_official_sdk_service_gate --exact --ignored` | 1 passed, 0 failed, 0 ignored, 117.37 s; official archive checksum verified by installer; includes actual new host dispatch and revoke/shutdown |
| `npm run check` | 49 passed, 0 skipped; includes released Source lease and retained drafts during cancellable inventory |
| `npm run test:source-browser` | PASS; legacy dirty-after-Save reproduction stays red, faithful Source Save stays clean; selection/Apply Both passes |
| `npm run build` | PASS |
| `cargo test -p loomlight-desktop --locked` | 1 passed; compilation of real wiring plus existing smoke-report test. Actual lifecycle/control cases execute in the core suite, not in this desktop test |
| Format / repository validator / whitespace | PASS; validator inspected 244 files |

Initial frontend allowlist regression failed because its expected list omitted the two
new typed operations; corrected without widening the deny-by-default boundary. Initial
desktop compilation failed because frontend `dist` had not been built; build and final
desktop test passed. An earlier full debug suite passed 177/6 ignored before the final
dialog case, and an earlier SDK run passed 1/0 ignored in 132.15 s. Final-source results
above supersede those local intermediate passes. No failed attempt is native evidence.

The local host is macOS ARM64, Rust 1.90.0 restored portably inside the task workspace.
Local Node 26.8.1/npm 11.19.0 differ from the repository pin; the native workflow keeps
its locked Node 24.19.0/npm 11.9.0 gate. Local Source browser evidence uses installed
Chrome through the existing executable override. No packages or real user projects.

**Replacement evidence policy:** one push-triggered `runtime-foundation-r1.yml` run for
this changed candidate, no manual duplicate. Its report now hashes core, frontend, tests,
desktop, workflow and dependency/toolchain manifests in addition to exact checkout/run/
attempt identity. The prerequisite `36126490939` and production success `36136466567`
remain PASS on their original inputs; failed/superseded `36135942863` stays FAILED with
its skipped gates preserved. No rerun of any existing run. R1 stays incomplete until the
replacement target outcomes, logs and artifacts are inspected. If outstanding, publish
its exact identity and use the mandated manual-resume handover, with no model polling.


### Published candidate and completed-receipt cancellation correction — 2026-09-26

Published `fd4ffca38373790f730818bbf9e6c8a388dac92f`, tree
`523c5f7665a9d90d4522b7a355d5ca12c62d5d07`, after all local results above passed.
Remote PR #17 was verified at that head, still OPEN/draft. Repository quality
`36144604896` passed. Push-triggered native R1 `36144599144` was observed in progress;
no terminal outcome/artifact pass was claimed. No manual dispatch or rerun occurred.

Final review then found a bounded completed-receipt race: after preparation finished,
a different authoring request could check out the service before its receipt was
cancelled. That cancellation set the flag but returned Busy without arranging deferred
cleanup. The corrected control path now accepts cancellation immediately, signals any
owned process, clears published trust and defers preparation teardown to the returning
session-bound owner. Its receipt reports cancellation while the reservation stays owned
until that work returns. The regression holds the real service after completed preparation
and proves responsive cancellation, cancelled receipt, and released preparation after
the owner returns, for the prepare/grant/start test sequences.

This changes two core files and requires a new candidate/run, not an unchanged retry.
`36144599144` is superseded as acceptance evidence; preserve its eventual actual outcome.
The existing historical successful runs remain untouched. The previous candidate's
full core/SDK/frontend/desktop evidence above is kept on its actual inputs. The receipt
correction passed the targeted release runtime suite: 18 passed, 0 failed, 2 ignored,
9.32 s. Repository validation (244 files), format and whitespace passed. Replacement
native gates validate the final source; the prior full/SDK passes are not relabelled as
exact-source passes for this correction.


### Final correction publication and native manual-resume handover — 2026-09-26

**State: `awaiting_ci`; R1 incomplete, not review-ready/accepted.** Final correction
candidate is `07f23b61d46511848d2b09db57ba1d5a696cabe0`, tree
`614931107db78f61c5b864a099ca2737ab546bd8`. Published with a non-forced update on the
same branch/draft PR #17 after fresh ancestry checks. Remote commit/tree was verified.
Its targeted release runtime gate passed 18/0 failed/2 ignored (9.32 s), format and
whitespace passed, repository validation passed (244 files). Repository quality
[36144979086](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36144979086)
passed on this exact candidate. Earlier full core/SDK/frontend/desktop results remain
explicitly attributed to `fd4ffca`; final-source native gates are outstanding.

**Outstanding final R1:** [36144974132](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36144974132),
**attempt 1**, exact candidate above. At the identity inspection it was **pending**,
behind the branch concurrency owner; no target job/artifact pass is claimed. Expected
artifacts are `runtime-foundation-windows-2025` and `runtime-foundation-macos-26`, with
seven-day retention. Verify complete steps/logs, actual passed/ignored counts, ZIP
SHA-256/CRC/size and every reported input hash against the exact candidate. Input
coverage now includes frontend/test/desktop/workflow/dependency manifests as well as
core Rust; do not compare using only the old 26-core-file inventory.

**Outstanding superseded run:** [36144599144](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36144599144),
**attempt 1**, `fd4ffca38373790f730818bbf9e6c8a388dac92f`, still **in_progress** at its
identity inspection. Preserve its eventual actual result, including any failed/skipped
gates. It is superseded because of the completed-receipt race, not relabelled failed
or passed and not rerun. Both runs were automatic pushes of different application
inputs; neither historical successful run nor the feasibility workflow was duplicated.

The final publication changes documentation and PR assessment only, and will not trigger
another runtime run. Verify remote documentation after publication. AGENTS/WORKFLOW
require ending active polling and manual resume because no qualified same-thread event
continuation exists on this host. Next bounded action: inspect these exact runs, assess
final-candidate R1-B1/B2 evidence, address only actual bounded findings, then publish the
assessment and updated handover. Do not dispatch a duplicate run, merge, request physical
testing, or advance to 1G.2b, optional Git or Phase 2.


### Replacement native evidence and R1-B1/B2 closeout — 2026-09-26

**Assessment: R1-B1 and R1-B2 resolved; 1G.2a `review_ready`, not user-accepted or
merged.** The user resumed after quality run `36145345911` completed. Fresh refs
confirmed clean published handover `90629baf4c343d3521fa7f7ed136f57f22f11d8d`,
unchanged main `924619def6f624f336032c3ebc8499ccfcc662f0`, and open draft PR #17.
No newer branch work was overwritten. This assessment changes documentation only;
all application/workflow inputs remain those of the final candidate below.

#### Final candidate and verified native evidence

[Run 36144974132](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36144974132),
**attempt 1, SUCCESS**, tested **`07f23b61d46511848d2b09db57ba1d5a696cabe0`**, tree
**`614931107db78f61c5b864a099ca2737ab546bd8`**. Both complete job logs and each artifact's
six files were inspected. Logged checkout, report candidate/run/attempt and GitHub
metadata agree. Each ZIP's byte size and SHA-256 match GitHub metadata; CRC and safe
member checks pass. **All 60 recorded input hashes on each target match the candidate**,
including core, frontend/tests, desktop, workflow and dependency/toolchain manifests
(Windows separators normalized for lookup). Both reports say `targetPassed: true`;
all required steps and explicit SDK gates succeeded.

| Target | Job / artifact | Actual result |
| --- | --- | --- |
| Windows x64, Server 2025 build 26100 / AMD64 | `108104157804` / `10868999163`, `runtime-foundation-windows-2025` | Runtime-filter core 17 passed, 0 failed, 2 ignored (11.02 s); explicit SDK 1 passed, 0 ignored (79.93 s); frontend 49 passed, 0 skipped; Source browser/build PASS; desktop 1 passed; format PASS |
| macOS ARM64, macOS 26.6.2 / arm64 | `108104157482` / `10868604900`, `runtime-foundation-macos-26` | Runtime-filter core 18 passed, 0 failed, 2 ignored (9.76 s); explicit SDK 1 passed, 0 ignored (118.24 s); frontend 49 passed, 0 skipped; Source browser/build PASS; desktop 1 passed; format PASS |

Windows ZIP: **8,780 bytes**, SHA-256
`afb30ebbb2fce4695af4487514936923ddd85e6d465f4da1c79c8f0e9ca13bdb`,
expires `2026-10-02T14:10:02Z`.
macOS ZIP: **8,211 bytes**, SHA-256
`058690b8982fc8126c3bce8ca33c92c34829251fd3be1d08ed0ed713f4bf50b0`,
expires `2026-10-02T14:09:39Z`.

The two ignored core entries are the separately invoked official-SDK gate and the
re-executed child fixture; neither is added to the passing count. macOS includes the
extra Unix-only manifest/link/root-replacement test. The only skipped SDK download is
a cache hit; archive verification and the real SDK/service test actually ran. Source
browser logs retain the expected failing legacy reproduction and passing faithful Save,
plus selection/Apply Both. The desktop count is its smoke-report test and compilation
of production wiring; actual service/control/lifecycle behavior is tested in core.
Windows emits an unused `runtime_handle` warning; runner action deprecation notices
also remain. Neither is a failed gate. No package matrix was run for documentation.

#### Requirement-to-evidence assessment

These findings combine the final native logs with inspection of the production paths
and assertions; a green job alone is not the basis for closure.

| Finding / required behavior | Final evidence and assessment |
| --- | --- |
| R1-B1: receipt before long prepare/grant/start work; cancellable inventory; zero spawn | `runtime_dispatch_cancels_inventory_prepare_grant_start_and_isolates_old_completion` holds each actual inventory boundary through `ApplicationHost`, receives a token, measures status/cancel under 250 ms, asserts zero spawn attempts, duplicate refusal and retained source draft/files. PASS on both targets. |
| R1-B1: completed-receipt race, stale completion and session isolation | The same test holds a competing service checkout after completion, accepts cancellation promptly, exposes a cancelled receipt and verifies deferred teardown after the owner returns. Old receipts cannot cancel the next preparation. `runtime_dialog_completion_cannot_mutate_replacement_session` proves the actual dialog completion helper rejects stale session identity before its callback. PASS on both targets. |
| R1-B1: Stop/status independent of authoring/dialog ownership; Source lease release | `runtime_service_switch_cancel_stop_shutdown_drop_and_closed_pipe_descendants` holds service ownership while production dispatch status/Stop finish under 250 ms. Native dialogs hold no service checkout. Frontend preparation tests prove lease/coordinator release after the receipt and draft retention. PASS on both targets. |
| R1-B1: bounded/cancelled preparation and terminal freshness ownership | Cooperative 180 s request budget checks every directory entry and at most 1 MiB per hash chunk; cancellation reaches launcher revalidation and atomic spawn commitment. Cleanup performs no terminal scan and reports conservatively stale until next full preparation. Native cancellation, output, deadline and real SDK tests pass. Kernel I/O itself is not forcibly interruptible. |
| R1-B2: real switch Cancel, Stop then switch, service shutdown/Drop, startup/validation cancellation | The service lifecycle test invokes actual service/host methods with child and grandchild fixtures in both inherited-output and closed-output modes. It checks refusal preserves the old session, then Stop/cleanup and successful switch; stale operation/session controls are refused. PID liveness and stopped heartbeat corroborate cleanup. PASS on both targets. |
| R1-B2: descendant ownership independent of EOF; fail-closed cleanup | Unix independently waits for group disappearance; Windows waits for job emptiness. Existing natural-exit/crash, long-play, flood and deadline tests plus the service cases pass. Injected failed cleanup confirmation retains the process owner/reservation across repeated shutdown and refuses replacement/mutation; the injection follows actual tree cleanup, not an observed OS termination failure. |
| R1-B2: actual history, asset/compound and file-lifecycle refusal/no-write/Stop/retry | `runtime_real_history_asset_compound_refusal_preserves_stack_then_stop_retry` uses the production history owner and real Scene Undo/Redo. `runtime_scene_move_delete_and_real_inverse_refusal_stop_retry` exercises move/delete and inverses, unchanged workspace/content on refusal, and successful retry after real child Stop. PASS on both targets. Undo-delete of an unloaded path remains permitted during play by design; its all-write refusal is exercised during validation. |
| Retained R1 foundation and 1F/1G.1 regressions | Literal protocol/refusal, trust/manifests, transaction drain/import races, bounded output and actual official-SDK service/host tests pass. Frontend 49 and preserved Source browser gates pass. Broader local core 178/6 ignored remains correctly attributed to `fd4ffca`; it is not relabelled a full native suite at `07f23b6`. |

No missing R1-B1/B2 evidence remains in this bounded assessment. Native keyboard,
packaged runtime UI and final human acceptance remain later 1G gates. The runtime
controls trusted project code; this is not containment of malicious escaping processes.
No physical testing is requested, and review-ready does not select 1G.2b or permit merge.

#### Preserved runs and publication boundary

Superseded [36144599144](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36144599144),
attempt 1, **SUCCESS** on `fd4ffca38373790f730818bbf9e6c8a388dac92f` (tree
`523c5f7665a9d90d4522b7a355d5ca12c62d5d07`). Complete logs/step outcomes were inspected:
Windows job `108102483886`, runtime 17 passed/2 ignored (10.63 s), explicit SDK
1 passed/0 ignored (76.47 s); macOS job `108102484116`, runtime 18 passed/2 ignored
(9.72 s), explicit SDK 1 passed/0 ignored (108.28 s). Both passed frontend 49,
Source browser/build, desktop 1 and format. Its artifacts were not independently
revalidated in this closeout; final acceptance evidence uses the verified replacement
above. This successful run remains superseded by the completed-receipt race correction,
not relabelled failed or silently substituted for final-source evidence.

Historical production `36136466567` and prerequisite `36126490939` retain their verified
PASS results and original provenance; failed `36135942863` retains its failures and
skipped gates. None was duplicated. Final-source quality `36144979086` and docs-handover
quality [36145345911](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36145345911)
(attempt 1, `90629ba`) passed. There are no outstanding native R1 operations.

This closeout updates CURRENT, HANDOVER, parent-plan state, ADR evidence status and PR
assessment only. `python3 scripts/validate.py` passed for 244 repository files and
`git diff --check` passed; no new application/native dispatch is needed. Publish non-forced to the same
branch, verify remote head/tree and exact handover/PR contents, and retain draft/open
status. Follow AGENTS/WORKFLOW for any still-running automatic documentation quality
check; do not model-poll. The next bounded action is independent review of 1G.2a only,
with acceptance a separate decision. No merge, 1G.2b, optional Git or Phase 2.


### Independent 1G.2a review — 2026-09-26

**Decision: R1 is not closed; R1-B1 reopened, R1-B2 closure supported. 1G.2a
`blocked`, not accepted.** The user selected review of Phase 1G.2a only in
`Caldwell-41/Renpy-editor`, branch `feature/phase-1g-branches-runtime`, with AGENTS
and HANDOVER at `b1e15b8`, explicitly excluding physical testing, merge and 1G.2b.
This review changes documentation only; it does not implement the finding.

Fresh fetched branch and PR #17 metadata agreed on
`b1e15b8d39976196addf3398d2c3f27c8e388b57`, open/draft, base
`924619def6f624f336032c3ebc8499ccfcc662f0`. The reviewed application remains
`07f23b61d46511848d2b09db57ba1d5a696cabe0`, tree
`614931107db78f61c5b864a099ca2737ab546bd8`; subsequent commits change only docs.
The existing local Phase 1F checkout was preserved; review used an isolated checkout.

#### R1-B1 remaining finding — P2: cancel a completed ticket through its receipt

At the reviewed candidate, `app/src/runtime-preparation.ts:57-60` receives a
completed preparation from `awaitRuntimeRequest`, then checks for cancellation.
If AbortSignal fires while the status response is in flight, that helper returns
the successful result before checking the signal (`:70-76`). The outer helper
then sends `runtime.cancelPreparation`, although it still has the request receipt.

The Source lease and authoring coordinator have already been released. An ordinary
Source inventory or draft-retention request can therefore hold the service at this
point. `ApplicationHost::dispatch` routes `cancelPreparation` through
`with_service` (`dispatch.rs:310-311`); checkout failure returns `RUNTIME_BUSY`
before calling the lifecycle cancellation method. There is no deferred cleanup,
retry or returned preparation handle from the rejected helper. The preparation and
execution reservation remain, so later preparation, writes and project close/switch
can remain blocked even after the competing request returns. No process need spawn.

The final core fix in `07f23b6` already supports this exact contention through
`runtime.cancelRequest` (`dispatch.rs:160-185`), including deferred cleanup when the
service owner returns. The frontend completion branch bypasses that fix. Keep the
receipt for cancellation after completion and exercise this race through the real
helper plus the held-service control path. Preserve draft retention and session/token
isolation; do not broaden the runtime UI scope.

**Deterministic local observation:** compiled the unchanged candidate with
`npm run check`, then invoked the actual exported `prepareRuntimeInput` with its
injected request port. The port returned a completed successful status while aborting
the signal and modeled a competing service checkout by rejecting `cancelPreparation`
with `RUNTIME_BUSY`; its `cancelRequest` route was available. The helper rejected with
`RUNTIME_BUSY` and never called `cancelRequest`. Observed sequence:

```text
source.list -> runtime.prepare -> runtime.requestStatus -> runtime.cancelPreparation
```

The injected-port probe demonstrates actual renderer control flow; it is not claimed
as a new native IPC/process test. Reservation retention follows from the inspected
production checkout/refusal path. The existing native completed-receipt test calls
`cancelRequest` directly and passes; the existing frontend cancellation test returns
`pending: true` before cancellation and does not exercise a completed first response.
Those successful tests therefore do not close this remaining case.

#### Evidence accepted and limits

Independently inspected both complete job logs and downloaded both six-file artifacts
for `36144974132`, attempt 1. Logged checkout, report candidate/run/attempt and GitHub
artifact metadata agree on `07f23b6`. All **60 input hashes per target** match the
reviewed tree. ZIP sizes, SHA-256 and CRC independently match the preceding closeout:
Windows 8,780 bytes / `afb30ebbb2fce4695af4487514936923ddd85e6d465f4da1c79c8f0e9ca13bdb`;
macOS 8,211 bytes / `058690b8982fc8126c3bce8ca33c92c34829251fd3be1d08ed0ed713f4bf50b0`.
Both target reports and required job steps passed. Cached SDK download was skipped;
archive verification and the explicit SDK test ran successfully.

| Gate | Windows x64 | macOS ARM64 |
| --- | --- | --- |
| Runtime-filter core | 17 passed, 2 ignored | 18 passed, 2 ignored |
| Explicit official SDK/service | 1 passed, 0 ignored | 1 passed, 0 ignored |
| Frontend | 49 passed, 0 skipped | 49 passed, 0 skipped |
| Source browser/build; format | PASS | PASS |
| Desktop compile/smoke-report test | 1 passed | 1 passed |

R1-B2 closure is supported by the inspected production lifecycle/process code and
assertions for actual service switch refusal/Stop/retry, service shutdown/Drop,
starting/validation cancellation, descendants with inherited and closed output,
PID liveness, and real Scene history/file-lifecycle refusal/no-write/Stop/retry.
Failed-cleanup confirmation remains an injection after real tree cleanup; it proves
reservation retention, not an observed OS termination failure. No further blocking
finding was identified in this bounded review.

Local `npm run check` passed typecheck and **49 tests, 0 failed/skipped** on Node
26.8.1/npm 11.19.0; these differ from the pinned native toolchain and do not replace
its evidence. Local Rust was unavailable and was not installed or rerun. No SDK,
package, native keyboard or physical test was repeated. The runtime helper probe above
is additional review evidence, not part of the 49-test count. Repository documentation
validation passed for 243 files in this isolated checkout; `git diff --check` passed.

Preserve all historical successful, failed and superseded runs with their actual
provenance. No native operation is outstanding and no run was dispatched/retried.
Publish this documentation review non-forced on the existing branch; keep PR #17
draft/open. Next bounded action, if separately selected: correct only this R1-B1
renderer cancellation case, add completion/abort/held-owner regression coverage and
validate the changed candidate under existing R1 policy. Do not merge, request physical
testing, or begin 1G.2b, optional Git or Phase 2. Review is not user acceptance.


### Renderer completed-receipt correction — 2026-09-26

**Authority:** the user selected correction of the remaining R1-B1 finding and recheck,
with a next-phase prompt only if no blockers remain. Work stays within 1G.2a; no merge,
physical testing or 1G.2b execution. Entry head `e9d029a53a6b7a6d06098cad15172572ceffbe62`
was fetched and matched open draft PR #17 on `feature/phase-1g-branches-runtime`.
The existing isolated checkout is reused; earlier work remains preserved.

**Correction:** `prepareRuntimeInput` retains the captured request receipt when an abort
or stale view races a successful completion and calls `runtime.cancelRequest`. This
uses the existing independently available control path and its deferred teardown when
an authoring request owns the service. No Rust, protocol, trust, process or workflow
change is required; the original preparation-ID fallback remains for non-ticket
responses. Neither cancellation path saves, grants trust or starts execution.

**Regression:** `runtime completion cancellation keeps its receipt while authoring owns
the service` exercises the actual helper and Source controller across Run/Validate and
AbortSignal/stale-view cases. A deferred first status response completes successfully
while the injected port represents a competing service checkout. It refuses
`cancelPreparation` with `RUNTIME_BUSY` but accepts the captured receipt's cancellation.
Assertions cover the exact receipt, no Save/start request, released Source lease and
coordinator, undefined result and retained Source/Scene input. This regression failed
on unchanged implementation with `RUNTIME_BUSY`, then passed with the correction.
It complements, rather than replaces, the existing real `ApplicationHost` held-service
regression that proves prompt receipt acceptance, stale-token isolation and reservation
release when the owner returns. Both run in the existing native R1 workflow.

**Local validation:** typecheck and 50 frontend tests passed, 0 failed/skipped; production
build passed. Node 26.8.1/npm 11.19.0 differ from the pinned native toolchain, so these
results do not replace supported-target evidence. Rust/process sources are unchanged;
local Rust remains unavailable. Initial targeted red test is retained as intentional
regression evidence, not a failure of the corrected candidate. Repository validation
passed for 243 files and whitespace checks passed before publication.

**State:** implementation corrected; final-source native evidence required before R1
closure. Publish this candidate once to trigger the existing R1 workflow, with no manual
duplicate or historical rerun. Record its exact SHA/run/attempt and inspect both full
job logs, artifacts, ZIP integrity and all reported input hashes. Historical native
`36144974132` remains PASS on `07f23b6`, not evidence for changed frontend inputs.
Follow AGENTS/WORKFLOW if a manual-resume handover is needed. Only after final recheck
finds no blocker may the next-chat prompt select 1G.2b; do not begin that phase here.


#### Corrected candidate publication and native recheck

Candidate **`c12d953548992adc60b38682d0dcfda8cdeb9f94`**, tree
**`3f8f6e769672572b008b2ffb4f283888afecfc31`**, was published non-forced on the same
branch. Local Source browser checks also passed: the expected legacy failing
reproduction and faithful Save passed their assertions, followed by selection/Apply
Both. They used installed Chrome via the existing executable override; no physical
interaction or package run. Exact-candidate repository quality
[36148947574](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36148947574),
attempt 1, passed.

**Outstanding:** [native R1 36148942247](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36148942247),
**attempt 1**, exact candidate above, was `in_progress` at identity inspection. This is
the single automatic push-triggered run for changed frontend inputs. No historical
run was retried, no manual duplicate was dispatched, and no target pass is inferred
from the local checks. Expected artifacts: `runtime-foundation-windows-2025` and
`runtime-foundation-macos-26`; verify complete logs, required steps, ZIP size/hash/CRC
and every one of the recorded input hashes against this candidate. Final bounded
inspection found Windows job `108117024512` in core and macOS job `108117024959` in
desktop, both still running, with no artifacts yet. Frontend steps had succeeded on
both targets; that is not a full target pass. End active polling and resume manually.

Recheck found no further source blocker in the bounded change: cancellation uses the
same captured receipt as status, outside the released lease/coordinator; the production
control path validates session and receipt before either immediate or deferred teardown.
Its existing native regression proves old receipt refusal and owner-return reservation
release. The new frontend regression covers four completed-response combinations in one
reported test. Neither suite is claimed as a single renderer-to-native end-to-end test.
R1 closure and the requested 1G.2b prompt remain conditional on final native evidence.

This follow-up updates only the live handover/status and canonical contract; it does
not dispatch another runtime job. If the existing run is still outstanding, AGENTS and
WORKFLOW require a published manual-resume handover and ending active polling; no
qualified same-thread external-event continuation is configured here. Next bounded
action: inspect this exact run, assess R1 closure and, only if no blocker remains, give
the user the prompt for 1G.2b. Do not implement 1G.2b, merge or request physical testing.


### Final-source R1 recheck and closure — 2026-09-26

**Decision: R1 technical gate PASS; R1-B1 and R1-B2 closed. 1G.2a is
`review_ready`, not user-accepted or merged.** The user selected only the final
1G.2a recheck from AGENTS/HANDOVER at `6be09a1`, including run `36148942247`,
attempt 1, both targets' complete logs and artifacts, closure if no blocker remains,
and a next-chat prompt for 1G.2b. No physical testing, merge or 1G.2b implementation
was authorised or performed.

#### Identity and integrity

Fresh remote refs and open draft PR #17 agreed on entry head
`6be09a1f629a73b8eaba9f0e8960e02efcec52a3`, branch
`feature/phase-1g-branches-runtime`, base/main
`924619def6f624f336032c3ebc8499ccfcc662f0`. The existing isolated checkout was
clean and reused; unrelated work was preserved. Application candidate remains
**`c12d953548992adc60b38682d0dcfda8cdeb9f94`**, tree
**`3f8f6e769672572b008b2ffb4f283888afecfc31`**. The entry handover and this closure
change documentation only after that candidate.

[Native R1 36148942247](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36148942247),
**attempt 1**, completed successfully. Run metadata, attempt-specific job metadata,
both logged checkouts, artifact metadata and reports all identify the exact candidate.
Windows job [108117024512](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36148942247/job/108117024512)
and macOS job [108117024959](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36148942247/job/108117024959)
passed every required gate and uploaded evidence. The only skipped step was SDK
download after a cache hit; archive verification and the explicit SDK/service test ran.

Both complete job logs and all six files in each ZIP were inspected:
`runtime-foundation-report.json`, `runtime-core.log`, `runtime-desktop.log`,
`runtime-frontend.log`, `runtime-sdk-service.log`, and `runtime-source-browser.log`.
All five artifact log bodies agree with their full job logs. Both reports have
`targetPassed: true` and CORE/SDK/DESKTOP/FRONTEND outcomes `success`.

| Artifact | ID | ZIP bytes | Verified SHA-256 |
| --- | --- | --- | --- |
| `runtime-foundation-windows-2025` | `10870961403` | 8,818 | `7c21464cea63cd7fe18c2ee4bc2ab46ac7b38869fd26f9a052088c8116f73cf0` |
| `runtime-foundation-macos-26` | `10870129746` | 8,265 | `de885762b461acb6d57448847f80da8a1e340bc21b910052cda44312651e50d8` |

Downloaded sizes and SHA-256 match GitHub metadata and upload logs; both ZIP CRC
checks pass. All **60 input hashes per target** match candidate Git blob bytes,
including the changed helper and regression. Report paths were normalised only for
Windows separators. The reported path sets exactly match the workflow's expected
input set, with no missing or extra inputs. No logs, ZIPs or SDKs are committed.

#### Actual gate results and limits

| Gate | Windows x64 | macOS ARM64 |
| --- | --- | --- |
| Runtime-filter core, release/locked | 17 passed, 0 failed, 2 ignored; 158 filtered; 13.67 s | 18 passed, 0 failed, 2 ignored; 164 filtered; 9.71 s |
| Explicit official SDK/service, exact/ignored | 1 passed, 0 failed/ignored; 176 filtered; 109.16 s | 1 passed, 0 failed/ignored; 183 filtered; 122.45 s |
| Frontend typecheck/tests | 50 passed, 0 failed/cancelled/skipped/todo | 50 passed, 0 failed/cancelled/skipped/todo |
| Source Save/selection browser and production build | PASS | PASS |
| Rust formatting; desktop compile/smoke-report unit test | PASS; 1 passed, 0 failed/ignored | PASS; 1 passed, 0 failed/ignored |

The two ignored runtime-filter entries are the separately executed official-SDK gate
and child-process fixture, not two additional passes or missing required tests. The
Source browser's legacy red reproduction is an intentional passing assertion; faithful
Save and selection/Apply Both pass. These are targeted native suites, not a claim that
all filtered-out core tests ran. The desktop unit test validates smoke-report handling;
it is not a packaged UI smoke run.

Hosts report Windows Server 2025 `10.0.26100` AMD64 and macOS `26.6.2` (`25G83`)
arm64. Logs show Node `24.19.0`, successful installation of pinned npm `11.9.0`, and
Rust `1.98.1` on the native target triples. Nonblocking warnings are the Windows
unused `runtime_handle` method and Actions/Node deprecations. No job error annotation
or required-gate failure was found.

The corrected actual-helper/Source-controller regression passes on both targets for
Run/Validate crossed with abort/stale-view completion. Bounded source recheck confirms
it cancels using the captured receipt outside the released Source lease/coordinator,
retains input, and performs no Save/start. The native
`runtime_dispatch_cancels_inventory_prepare_grant_start_and_isolates_old_completion`
test also passes on both targets: cancellation while a competing owner holds the
service is accepted in under 250 ms, old receipts are refused, and owner return releases
the reservation. This closes the reopened R1-B1 finding. The injected frontend port
and real ApplicationHost test remain complementary evidence, not one renderer-to-native
end-to-end test.

R1-B2 lifecycle/descendant/history cases pass again on this exact candidate. The
[prior requirement assessment](#requirement-to-evidence-assessment) and its limits
remain applicable: failed cleanup confirmation is injected after real process-tree
cleanup, kernel I/O is cooperatively bounded, and native keyboard/packaged runtime UI
were not exercised. No new source blocker was found in this bounded recheck.
Exact-candidate [repository quality 36148947574](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36148947574),
attempt 1, was independently confirmed successful.

#### Publication and next checkpoint

This documentation-only closure updates CURRENT, HANDOVER, the parent plan and ADR
evidence status. Local `python3 scripts/validate.py` passed for 243 repository files;
`git diff --check` passed. Application/native/package tests are not rerun for unchanged inputs. Preserve
all historical failed, superseded and successful evidence under its actual candidate;
`36144974132` remains evidence for `07f23b6`, not the changed frontend. No run was
dispatched or retried, and no native operation remains outstanding.

Publish non-forced on the existing branch, verify remote head/tree/content, and keep
PR #17 draft/open with its evidence summary current. The next eligible checkpoint is
**1G.2b — Runtime UI and navigable diagnostics**, section 6, only when the user selects
the provided next-chat prompt. It remains `not_started`. Printing that prompt grants
no execution or acceptance by itself. Final G1/R1/R2 review, packaged target evidence
and human acceptance remain under sections 8–9 and TESTING. No merge, physical testing,
optional Git, Phase 2 or 1G.2b implementation is part of this closure.


## 14. 1G.2b execution ledger

### Entry and agent-owned verification contract — 2026-09-26

Authority: the user explicitly selected only Runtime UI and navigable diagnostics,
including required agent-run verification and checkpoint publication. Stop before
physical testing, acceptance or merge; optional Git and Phase 2 remain excluded.
Entry branch/head and open draft PR #17 were freshly verified at
`78f051e382b048f1e8ee73f5add7a8072608e474`; main remains `924619d`.
The clean existing implementation checkout is reused. R1 evidence is preserved.

Named scenarios (implementing agent owns each; results must identify actual layer):

| Scenario | Expected observation | Gate/layer |
| --- | --- | --- |
| R2-controls | Explicit revision choice, refused Save All/Cancel zero-spawn, inspectable trust/revoke, independent Stop and status, retained Scene/Source input | frontend DOM and literal IPC |
| R2-diagnostics | Known compile/lint/runtime multiline output, bounded fallback, severity/origin and operation identity; safe current source navigation; Unicode/BOM/CRLF, spaces, absent columns, deleted/replaced files | core and renderer |
| R2-lifecycle | Running/earlier-revision/terminal/cancel/failure, close Stop-and-continue, stale session isolation, bounded inert output | frontend + existing native R1 |
| R2-package | Real visible controls → IPC/service → accepted disk/reopen, SDK compile/lint failures, both authored routes, Run beyond eight seconds and Stop, resize/focus | supported Windows x64/macOS ARM64 packages |
| G1-final | Real graph destination edit/reopen, current mapping and declared layout budgets | final supported-target gate |
| Regression | Existing Source Save, runtime cleanup/reload/assets/history, full core, source/SDK spikes | existing commands/workflows |

Local host: macOS ARM64; Node/npm installed, Rust initially unavailable. Local DOM
evidence does not substitute for the two packaged target gates. New diagnostics are
bounded to 256 records, 4 KiB message each, approved game `.rpy` locations, and the
existing 2 MiB output retention. No arbitrary path/argv IPC. The later native-close wiring adds only a main-window,
payload-free guarded exit permission; no filesystem or process-launch capability.
Final packaging uses the existing production workflow, once for a coherent candidate;
no merge is selected and no automatic post-merge run is implied. Waiting follows
AGENTS/WORKFLOW: publish manual-resume state if a required external run remains pending.

### Implementation and local evidence

RuntimeWorkspace retains operation/session ownership across authoring views. Deliberate
Validate/Run capture Source input through the existing controller and short coordinator;
Save All refusal and Cancel retain drafts. Trust text shows the verified SDK, project,
revision and bounded inventory. The controlled-play helper is a separate explicit saved
transaction. Stop/revoke/close use core-owned process cleanup. Diagnostic IPC accepts
operation and diagnostic IDs, never a renderer-supplied host path. Navigation rechecks
manifest identity, hash, session, current draft/conflict state and UTF-8 line range.
Unproven locations remain inert. Diagnostic retrieval uses the independent control lane,
so output polling does not take the authoring service. Fixed read requests retry only an
explicit pre-dispatch RUNTIME_BUSY, bounded to one second and the captured view; writes,
trust and process starts are never automatically replayed.

Real package checks exposed CRLF normalization: textarea LF offsets could select the
wrong position or manufacture a Source draft. The Source adapter now translates offsets
and retains unchanged newline bytes, with a Unicode/mixed-newline regression. Parser
messages stop appending at 4 KiB (rather than repeatedly truncating long continuations);
UTF-8 output pages do not split scalar values. Modal choices serialize, default to Cancel,
trap focus and restore it when the owning control remains connected.

| Local agent check | Actual result and limits |
| --- | --- |
| Frontend typecheck/tests | 58 passed, 0 failed/cancelled/skipped; includes six Runtime UI scenarios, newline and request-ordering regressions |
| Full core release/locked | 179 passed, 0 failed, 7 ignored; two existing official-SDK wrappers returned without SDK, so 177 substantive ordinary passes. Five child fixtures and two explicit runtime SDK gates are ignored entry points, not extra passes |
| Targeted runtime core after parser/control changes | 19 passed, 0 failed, 3 ignored, 164 filtered; 9.29 s. Includes held-authoring-owner diagnostics/Stop and malformed/stale refusal |
| Explicit real SDK diagnostic gate | 1 passed, 0 failed/ignored; real compile and lint errors navigate to Unicode/BOM/CRLF source; replaced/deleted/stale locations refused; 263.23 s debug including fresh SDK setup |
| Desktop boundary unit test | 1 passed; report handling only, not a packaged workflow |
| Source production browser/build | Legacy red assertion, faithful Save and selection/Apply Both passed; rerun after newline fix |
| Source/SDK spikes | 26 and 24 passed with supported bundled Python and canonical temporary directory; source benchmark 620,000 bytes / 40,000 nodes, median 56.48 ms, seven samples |
| Rendered Runtime UI | Chrome, injected requester; 1100/640 widths, focus trap, no overflow/page errors; final screenshot QA generated |
| Branches budget | Actual service fixture 500 Scenes / 2,000 edges; Chrome 154.0.8037.57, initial layout 31.9 ms, pan p95 34.9 ms, 640px resize passed; supplemental browser evidence |
| Repository | Structure/link/privacy validation passed for 254 files before final publication docs; whitespace and Rust formatting passed |

Local host is macOS ARM64, Rust 1.90.0 from the checked-in toolchain, Node 26.8.1 /
npm 11.19.0. This is not the pinned CI Node/npm environment. Initial Python 3.9 spike
execution and noncanonical temporary paths failed; rerunning with the available bundled
Python and canonical temporary root passed without weakening the tests. Initial local
full packaging failed in `bundle_dmg.sh`; the real `.app` bundle subsequently built and
ran. Full installer packaging remains a supported-target CI gate, not a local pass.
No downloaded SDK, generated logs, screenshots, private project or host paths are in Git.

### Preserved local packaged failures and corrections

All cases create disposable projects and use the pinned verified Ren'Py 8.5.3 SDK.
They are independent processes with reliable exit/report/cleanup checks and bounded
watchdogs. Stage timings and every failure are retained in agent temporary output;
the final workflow publishes durable exact-candidate logs and JSON. Synthetic WebView
input is reported honestly and does not assert OS-native key delivery.

- Initial attempt: compile assertion ran before terminal state; lint/route reads collided
  with active service work; runtime-error waiting did not recognize an exception while
  Ren'Py's error window stayed alive. These were failures, not successful route evidence.
- Corrected attempt: lint and runtime-error passed; compile exposed newline comparison;
  both routes reached asserted dialogue/state/asset output but failed before Source Save.
  All owned cleanup was confirmed. Error reporting now exits nonzero, checks actual
  shutdown, and includes stage/state/output on failure.
- Next package attempt: compile passed (26.968 s), lint passed (25.174 s), runtime-error
  passed (26.399 s). Both routes again reached their oracle but timed out at Source Save
  (217.859 / 219.456 s); they remain failed. Diagnostics were moved to the control lane;
  remaining read contention and test-driver readiness were corrected and rechecked below.

No R2 closure is inferred from these partial successes. Final candidate testing must
include all five cases on both supported targets, full core/SDK gates, packaged boundary,
input/executable hashes and final G1/R1/R2 review. OS-native keyboard delivery remains explicitly unverified and belongs to the later
focused human session under TESTING; synthetic events exercise packaged handlers only.

The read-retry-only package recheck also failed: route-a at Source Save (218.752 s),
route-b at draft-choice preparation (212.581 s), with cleanup confirmed. A bounded
Source request lane now serializes retention/observation and project status/flush without
blocking runtime control. Its regression holds a read, proves Stop remains immediate,
then releases the read failure and observes exactly one Source write. An initial broader
lane broke the existing simultaneous-picker regression; it was narrowed to the actual
Source/persistence boundary and all 58 frontend tests pass. The final Source browser
legacy/faithful Save and selection/Apply Both checks pass again. Package-driver readiness
now waits for editable controls rather than clicking during a Source barrier, and failure
reports include stage, runtime/persistence status, bounded output and the existing Save trace.

After the bounded request-ordering correction, local route-a PASS: 32.805 s including
fresh SDK fixture setup; the authored route oracle, Source Save during play, earlier
launch revision, >8 s lifetime, Stop/cleanup and accepted bytes after reopen all passed.
This is real packaged macOS WebView/IPC/service/SDK evidence, not Windows evidence.
Final Rust formatting and desktop report unit test pass (1 passed, 0 failed/ignored).
Repository validation now covers 256 files. Final 640px screenshot was visually inspected:
controls wrap, content remains readable, and the diagnostics panel scrolls independently.

The strengthened route-b case initially failed at draft preparation (214.440 s), then
its narrowed 15 s UI bound exposed the actual pre-dispatch busy error (38.231 s including
setup). SDK discovery had raced Source retention before preparation acquired its lease.
Discovery and short runtime submissions now share the Source request lane; runtime
status/Stop/revoke/receipt controls remain independent. The driver does not alter the
production requester. All 58 frontend tests still pass after the native-close wiring.
Native window close/quit now enters the same runtime and Source leave flow; a no-payload
main-window command permits exit only after the core project is closed and cleanup is
confirmed. Package routes explicitly test rejection while open and Cancel through the
native-close renderer entry point. This is not OS-native input delivery evidence.

With SDK/submission ordering fixed, both route cases passed graph edits, their real game
oracles and live Source Save. Route-b additionally passed Cancel, refused invalid mapped
Save All and deliberate saved-revision launch. The added native-close assertion then
failed (32.465 / 32.282 s): the new command had not yet been granted a Tauri capability.
That is retained as a failed package attempt. The corrected build declares only
`allow-application-close` for the local main WebView, updates the exact capability test,
and still rejects an open project before any exit. No general window/filesystem/shell
permission was added; frontend remains 58 passed, no failures/skips.

### Local package correction closeout

Final affected-case macOS recheck PASS: route-a **33.318 s**, route-b **32.441 s**,
exit 0, no timeout and `cleanupComplete: true` for both. Each proved authored graph
destination edit/restore, selected dialogue/state/asset oracle, Source Save while running,
earlier launch revision, >8 s play, rejection of native exit with an open core project,
Cancel through the native-close renderer entry point, Stop and saved bytes after reopen.
The 640px route-b case additionally passed retained draft/Cancel, refused invalid mapped
Save All and deliberate saved-revision play. Local compile/lint/runtime-error passes above
remain development evidence; final CI reruns all five cases on the coherent inputs.
Frontend final: **58 passed, 0 failed/cancelled/skipped**. No local test process remains.
The final production matrix and G1/R1/R2 assessment remain required before review_ready.

### Published candidate and awaiting-CI handoff

Application commit **`931684dd59ce319bd98f0028df98a3023ced7740`**, tree
**`b6432353974e8a7f8818a8e8f91fadca1b29ccb9`**, was published non-forced on the existing
branch. Remote head and draft/open PR #17 matched before dispatch. Exactly one final
[production run 36194188820](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36194188820),
**attempt 1**, was dispatched on that candidate with package upload requested. Created
`2026-09-25T21:56:19Z`; initial inspection reports **in_progress**, no conclusion.
This subsequent handover update is documentation-only and does not need a package run.

State remains **in_progress / awaiting CI, manual resume**, not review_ready or accepted.
No supported-target pass is inferred from dispatch. AGENTS/WORKFLOW require stopping
active polling until a new bounded task resumes; no automatic continuation is qualified
on this host and none is claimed. No duplicate run, retry, physical testing, acceptance,
merge, optional Git or Phase 2 was performed. Final input report covers **93 tracked
application/workflow files** per target; verify every hash, candidate/tree, toolchain,
executable and all actual scenario reports, job logs and artifact digests/CRC as specified
in HANDOVER. Preserve earlier R1/G1 evidence on its own candidates and separately assess
G1/R1/R2 on this final candidate. Failure/skipped/unavailable evidence is not a pass.

Next bounded action: inspect that run/attempt and complete its artifact/source assessment;
resolve only evidenced 1G.2b findings if necessary, publish the final checkpoint record,
and stop again before physical testing, acceptance or merge. No next checkpoint begins.

### Resumed exact-run assessment and bounded correction — 2026-09-26

The user selected outstanding 1G.2b agent verification only, starting at `13311e4`.
Fresh refs and draft/open PR #17 still match that entry; main remains `924619d`.
No newer or pending production verification exists. No physical testing, acceptance,
merge, optional Git or Phase 2 is authorised.

Run `36194188820`, attempt 1, is completed **FAIL**, on candidate `931684d`, tree
`b6432353974e8a7f8818a8e8f91fadca1b29ccb9`. Both full job logs and retained evidence
were inspected. Both targets fail the same capability assertion before packaging.
R2-C1: the Rust configuration test assumes single-line JSON and the old one-command
build registration, although 1G.2b added the guarded close command and the frontend
configuration test already reflects it. Correct only that test: parse capability JSON,
require the exact local main-WebView/two-permission allowlist, reject remote/window
scope, and check both existing command registrations. No production permission change.

G1-V1: the real-service fixture reports budget overruns while returning success; it
currently asserts graph correctness but not elapsed limits. Preserve the original
measurements below. A bounded verification correction will run the same unchanged
500-Scene/2,000-edge fixture separately in release mode, without concurrent core tests,
and enforce the existing 2 s initial / 250 ms accepted-update limits. This is a new
measurement, not grounds to erase the failed observations or raise a limit. Ordinary
full-suite timings remain supplemental. The implementing agent owns this check on
Windows x64/macOS ARM64; retain `runtime-flow-budget.log` independently and use its
real-service graph JSON in the existing rendered checks. Any isolated overrun leaves
G1 open and requires a bounded performance finding, not a green-status inference.

Local correction checks: exact Rust capability test, isolated release budget fixture,
Rust formatting, existing frontend protocol suite, repository structure/link/privacy
validation and whitespace. Only after these pass may one justified replacement of the
failed production run be dispatched on the published corrected candidate. Preserve
manual-resume identity and stop active polling if it remains pending.

#### Failed run identity, artifact integrity and missing inputs

[Production run 36194188820](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36194188820)
was manually dispatched once at `2026-09-25T21:56:19Z` and completed at
`2026-09-25T22:02:16Z`, attempt **1**, on full candidate
`931684dd59ce319bd98f0028df98a3023ced7740`. Checkout lines in all three complete
job logs agree with the run and artifact metadata. Preflight job `108266135203`
passed. Target jobs `108266324216` (Windows x64) and `108266324332` (macOS ARM64)
failed with exit 101. No later pending production run was found on resumption.

Both evidence ZIPs were downloaded and independently checked against GitHub's exact
size and SHA-256; every ZIP entry passed CRC and path checks:

| Target / artifact | Bytes | Verified ZIP SHA-256 |
| --- | ---: | --- |
| Windows x64 / `10889700592` | 118782 | `b4c62ea58c48bb698b3074205de304a8a1e013e6f8957af308b43eaff625a19a` |
| macOS ARM64 / `10889595467` | 118746 | `9d68970498d0c6354a2468776afab92f9a1d57d1049b56bd0527557f9a98ed45` |

Each ZIP contains only `phase-1b-transactions.log` and `runtime-flow.json`. The latter
contains 500 real-service nodes and 2,000 edges, with partial/stale/over-limit all false.
No requested package artifact, executable, `runtime-ui-inputs.json`, five runtime UI
JSON/log pairs, explicit SDK logs, renderer reports or legacy boundary report exists.
Their owning steps were **SKIPPED after core failure**. The candidate has 93 tracked
application/workflow inputs, but **0/93 per-target input hashes can be verified**:
there is no input manifest to compare with Git blob bytes. Executable hash verification
is likewise unavailable. A verified checkout or ZIP digest does not replace those
missing attestations. Do not manufacture hashes from the local checkout and label
them target evidence.

| Existing run gate | Observed result |
| --- | --- |
| Preflight | PASS: structure/link/privacy, frontend typecheck and 58 tests, Source browser/build and Rust formatting |
| Windows full release core | FAIL: 171 passed / 1 failed / 7 ignored, 144.97 s; the two official-SDK wrappers returned without SDK, leaving 169 substantive ordinary passes |
| macOS full release core | FAIL: 178 passed / 1 failed / 7 ignored, 39.47 s; the same two wrapper skips leave 176 substantive ordinary passes |
| Ignored entry points | Five subprocess workers plus two explicit runtime SDK gates; not seven extra passes |
| Source production browser on each target | PASS: faithful Save and selection/Apply Both; legacy red assertion remains the expected regression control |
| Explicit SDK lifecycle/download, R1 and R2 | SKIPPED; no final-candidate official-SDK gate executed |
| Renderer focus/resize/Branches browser budgets | SKIPPED |
| Desktop/package and five real-service UI cases | SKIPPED |
| Legacy packaged boundary, package scan/inventory/upload | SKIPPED |

CI used Node 24.19.0, npm 11.9.0 and Rust 1.90.0 on `windows-2025` x64 and
`macos-26` ARM64. G1 and runtime ordinary behavioral regressions passed within the
failed core suites, including flow boundaries/history/navigation and runtime receipt,
cancel, service switch/Stop/shutdown/descendant tests. These retain their actual layer;
they do not substitute for the skipped explicit SDK or packaged cases.

#### G1/R1/R2 assessment and remaining blocker

| Capability | Assessment on `931684d` |
| --- | --- |
| G1 | **FAIL / incomplete**: shared-service behavior passed, but the recorded budget overruns below fail the declared performance targets. Rendered and packaged final-source evidence is absent. Earlier 1G.1 evidence remains on its recorded candidate. |
| R1 | **Final-source regression incomplete**: ordinary process/service regressions passed; explicit pinned-SDK regression was skipped. Preserve R1-B1/B2 closure on `c12d953`, run `36148942247` attempt 1; do not transfer it to this candidate. |
| R2 | **BLOCKED**: the core capability assertion failed and all five packaged real-service cases were skipped. Local development cases in this ledger remain supplemental; no final R2 pass is claimed. |

| Real-service workload / release measurement | Initial | Warm unchanged | Accepted update | Assessment |
| --- | ---: | ---: | ---: | --- |
| Failed run, Windows full-suite measurement | 2673.049 ms | 2844.572 ms | 2843.304 ms | Initial > 2 s and update > 250 ms |
| Failed run, macOS full-suite measurement | 765.481 ms | 928.671 ms | 722.015 ms | Update > 250 ms |
| Resumed local macOS isolated core test | 870.770 ms | 873.297 ms | 864.470 ms | Update > 250 ms; enforced gate exits 101 |

Local reproduction uses the same real-service 500-Scene/2,000-edge topology, accepted
Choice-caption transaction and pinned Rust 1.90.0 release build. No other core test ran
concurrently. It rules out treating full-suite contention as an adequate explanation;
it does not establish a particular production bottleneck. The initial below-2-second
local result does not close Windows initial latency or rendered layout. No performance
limit or workload was relaxed. The added workflow step retains its own log and requires
a success marker; full-suite logs now also retain stderr so assertion failures survive
artifact upload.

**R2-C1 is corrected locally:** exact configuration test 1 passed / 0 failed / 0 ignored,
185 filtered; capability JSON is tested semantically with exact permissions, local-only
scope and both registered commands. The corrected test changes no production capability.
Frontend typecheck and **58 tests passed**, with no failures/cancellations/skips; Rust
formatting, repository structure/link/privacy validation and whitespace passed. Local
Node 26.8.1/npm 11.19.0 are development tooling, not CI's pinned Node/npm. An initial
short-name invocation with `--exact` selected zero tests; it is not counted as evidence.

**G1-V1 remains open.** Its now-enforced local budget test is **0 passed / 1 failed**,
185 filtered, 4.06 s; failure is the accepted-update assertion. Correcting the stale
configuration check cannot resolve this performance finding. The safe next scope is
profiling and a bounded correction of projection refresh while preserving current
source identity, external invalidation and bounded path/read checks. A broader cache
or consistency redesign or budget change requires an explicit decision; none is made
in this verification continuation.

Checkpoint state is **blocked**, not review_ready or accepted. No replacement matrix
was dispatched because a required local prerequisite is already red. There is no
pending verification to duplicate and no watcher or local verification process remains.
Publish these test/workflow corrections and this assessment on the existing branch,
then update the live handover with the resulting correction candidate. Next action:
resolve only G1-V1 under unchanged limits, then run one justified coherent replacement
production matrix and inspect both targets' complete evidence before final assessment.
Physical testing, acceptance, merge, optional Git and Phase 2 remain outside authority.


### G1-V1 profiling and bounded correction — 2026-09-26

The user selected only continued 1G.2b agent verification from `5b0b443`: profile
and resolve G1-V1 under unchanged budgets/safety, publish after local gates, then
launch exactly one justified replacement production run with packages. Fresh refs
confirm the entry, main `924619d`, draft/open PR #17 and no pending verification.
Physical testing, acceptance, merge, optional Git and Phase 2 remain excluded.

Named checks recorded before implementation: unchanged isolated release
500-Scene/2,000-edge fixture (initial <2 s, accepted update <250 ms); fresh external
source/identity and inventory invalidation; retained Source drafts and Scene/history
regressions; safe bounded read/path regressions. Profile phases before selecting a
bounded correction; no persistent cache or consistency redesign is authorised.


#### Profile and bounded implementation

Temporary phase timers around the actual release `flow_workspace` call located the
cost before editing: initial **844.705 ms**, warm **841.246 ms**, accepted-update
**839.349 ms** (enforced FAIL, 0 passed/1 failed). On that accepted update, cumulative
load/inventory completed at 11.426 ms, file acquisition at 553.561 ms, projection at
564.191 ms and final rechecks at 838.845 ms. File acquisition and rechecks consume
about 817 ms; projection itself about 11 ms. This is repeated safe path traversal and
file I/O, not evidence for a parser cache or a relaxed consistency contract.

The bounded correction introduces a core-private `ObservationReader` used only for
one flow observation. It retains at most one most-recent parent directory chain,
revalidates project registration, canonical root and the full parent chain on every
open, and still rejects leaf links/reparse points. It caches no bytes or revisions.
The initial snapshot checks metadata size before reading, bounds reads by observed
length and the remaining inventory limit, then verifies length/identity afterwards;
this removes the redundant first content-hashing read. Every observed source is
still reopened and rehashed for final identity/revision comparison, with unchanged
final metadata and file-inventory checks. Handles expire at the end of the call.
No transaction, Source acceptance, draft, trust, permission, CSP or execution behavior
changes; commands retain their independent current-state checks.

Only one retained directory chain bounds descriptors even for many distinct source
parents. There is no cross-request cache, no timestamp shortcut, no new source truth,
and no wider cache/consistency redesign. Limits remain 500 Scenes/2,000 edges, 2,048
source files/32 MiB total/16 MiB per file, <2 s initial and <250 ms accepted update.
The fixture topology, accepted Choice-caption edit and gate assertions are unchanged.

With the temporary timers, the corrected isolated release call measured initial
**180.142 ms**, warm **175.657 ms**, accepted update **178.537 ms** (1 pass, marker
present). The timers were removed before final gates. Local host: macOS 26.6.2 build
25G83, ARM64, Rust/Cargo 1.90.0; Node 26.8.1/npm 11.19.0 are supplemental development
tooling, distinct from CI's pinned Node 24.19.0/npm 11.9.0.

Review added an explicit registration check on each read so unregistration cannot
leave an observation with continuing authority. New low-level tests exercise fresh
same-length content, same-byte/different-identity replacement, deletion, oversize
rejection, cancellation and unregistration. Unix tests replace retained parent/root
identities and substitute leaf/parent symlinks; Windows has an explicit retained-parent
namespace-pinning test. The Source navigation test now projects accepted content
while a draft exists and proves disk bytes, draft text and caret remain unchanged.
Existing flow/history/inventory and hostile transaction regressions remain required.

#### Supplemental Phase 0 limitation

The unchanged Python SDK spike suite reports **23 passed / 1 error**, not a pass:
`test_process_output_is_bounded` receives `EPERM` on a repeated process-group kill.
A temporary diagnostic wrapper which rethrows every error recorded first SIGKILL
success, then errno 1 for the same group. This is consistent with a cleanup race;
it is not proof that the first signal lacked permission. It reproduces using bundled
Python 3.12.14 and system Python 3.9 with canonical temporary paths and host execution.
No helper processes remain. Initial noncanonical temporary-path assertions were
resolved by using a canonical temporary root; no test assertion was weakened.

The spike sources are byte-identical to entry `5b0b443`. This supplemental issue is
outside the selected G1-V1 read-observation correction; no Python process change is
made or pass claimed. Applicable production core/process, isolated budget, frontend,
source and repository gates remain mandatory before dispatch; the replacement matrix
retains all explicit SDK and native process gates. This is not an SDK/package waiver.


#### Final local gates and replacement-run justification

All production-scope local prerequisites pass after removal of profiling and the
registration review correction. Commands run from `app/` with pinned Rust 1.90.0;
`--release` matches the existing production core gate.

| Gate | Final observed result |
| --- | --- |
| `cargo test --release -p loomlight-core --locked -- --nocapture` | PASS: 182 passed, 0 failed, 7 ignored, 126.44 s; two no-archive wrappers printed skip markers, leaving 180 substantive ordinary passes. Five ignored subprocess entry points and two ignored explicit SDK gates are not passes. |
| `LOOMLIGHT_ENFORCE_FLOW_BUDGETS=1 cargo test --release -p loomlight-core --locked scene::tests::flow_budget_fixture_500_scenes_2000_edges -- --exact --nocapture` | PASS: 1 passed, 188 filtered, 2.04 s; initial **180.470 ms**, warm **181.755 ms**, accepted update **181.026 ms**; required marker present. No other local core test ran concurrently. |
| Real-service flow JSON | 500 nodes/2,000 edges; partial/stale/over-limit false; feeds the browser unchanged. |
| `npm run check` | PASS: typecheck and 58 tests, zero failures/cancellations/skips. |
| `npm run test:source-browser` (includes build) | PASS: legacy red control, faithful clean-after-Save and selection/Apply Both. Local loopback browser execution required host access. |
| `node tests/branches.browser.mjs` with that flow JSON | PASS: Chrome 154.0.8037.57, initial layout 62.3 ms, pan/frame p95 33.1 ms, 640px resize, zero page errors. Supplemental synthetic-input browser layer. |
| `node tests/runtime-ui.browser.mjs` | PASS: 1100/640px, focus pass, no overflow/page errors; injected requester, not packaged IPC. |
| Lossless Source Python regression / benchmark | PASS: 26 tests; Python 3.12.14, 620,000 bytes/40,000 nodes, seven-sample parse median 107.78 ms. |
| Rust formatting, repository structure/link/privacy and whitespace | PASS; validator reported 258 repository files. |
| Unchanged Python SDK spike | 23 passed / 1 repeated-signal cleanup error; retained separately above, not counted as a pass or final SDK evidence. |

Self-review checked the full implementation diff, source/metadata final rechecks,
registration revocation, bounded directory ownership and unchanged workloads/gates.
No application capability or runtime privilege changed. G1-V1 is corrected **locally**;
Windows/macOS supported-target latency and final G1/R1/R2 evidence remain open.
A single replacement production run is justified by this material read-path correction
plus the prior `6c7efad` capability-test/budget-gate correction. It must use package
upload, after publication and a fresh no-pending-run check. No R1-only run, retry,
workflow change or main integration is authorised here. If pending, record exact
run/attempt/SHA and stop under the repository manual-resume policy.


#### Published correction and exact replacement-run assessment

Correction candidate **`f37635e0d2acce61022f9bf4e21c923499fcf786`**, tree
**`5590e513e8163a9b0db7267ac67a85e61a700f39`**, is committed and published on the
existing branch; `ls-remote` and draft/open PR #17 agree. Fresh pre-dispatch inspection
found no pending production or R1-only run. Exactly one manual production dispatch
requested `upload_packages=true`; no workflow trigger was changed and no retry or
second verification was launched.

[Replacement run 36209430831](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36209430831),
**attempt 1**, was created at **2026-09-26T01:44:25Z** for that exact candidate and
branch. The dispatch returned its run URL. The immediately following list endpoint
had not indexed it yet; the exact-run endpoint verified the SHA/attempt, so no retry
was warranted. At the bounded inspection the run was **queued**, conclusion null;
Preflight job **`108312714429`** was queued. No target jobs or complete logs existed,
and the artifact endpoint reported **0 artifacts**.

| Capability on `f37635e` | Available evidence and assessment |
| --- | --- |
| G1 | G1-V1 corrected locally: isolated service budget, behavioral/safety regressions and supplemental rendered budgets pass. Supported Windows/macOS isolated/rendered and real packaged graph/edit/reopen proof **pending**. No final G1 pass. |
| R1 | Local ordinary production-core/process regressions pass with explicit SDK skips identified. Final-source supported-target SDK/process regression **pending**; earlier R1 closure stays on `c12d953` and its verified run. |
| R2 | Frontend/Source and supplemental browser evidence passes locally. Both targets' five real-service packaged cases, diagnostic/SDK evidence and legacy package smoke **pending**. No final R2 pass. |

There are **94** tracked candidate application/workflow inputs (the added reader
module increases the previous 93). With no target artifact, **0/94 input hashes per
target**, no ZIP digest/size/CRC and no package/executable digest can yet be verified.
Local Git bytes and run identity are not substituted for target attestations.
The previous failed run `36194188820` and its exact failed/superseded evidence remain
unchanged. The supplemental Phase 0 Python cleanup error remains recorded above.

State: **awaiting_ci, manual resume**. No watcher/automatic continuation is configured
or claimed, no local verification remains running, and no repeated model polling is
performed. This follow-up publishes only status/assessment/ledger/handover; it does
not request another package matrix. Next bounded action is to inspect this existing
run when complete, verify both full logs and all available artifact/input/executable,
SDK, G1 and five-case R2 evidence, then publish an honest G1/R1/R2 assessment. If still
pending, retain this identity and stop. Stop before physical testing, acceptance,
merge, optional Git or Phase 2. A failed target gate requires a bounded finding;
this pending handover does not authorise a duplicate/retry or a wider redesign.


### Failed replacement review and bounded G1 continuation — 2026-09-26

The user reported the failed replacement and authorised review/fix plus another
handover. Entry `9fc2450`, draft/open PR #17 and main `924619d` are unchanged; fresh
inspection found no pending verification. Remain within 1G.2b agent verification,
unchanged workloads/budgets/safety and no physical testing, acceptance, merge,
optional Git or Phase 2. Work is in progress.

Run `36209430831`, attempt 1, on `f37635e` completed FAIL. Both core suites and
Preflight passed. Windows isolated accepted update 489.453 ms fails 250 ms;
macOS isolated update 154.944 ms passes, but rendered pan/frame p95 120 ms fails
100 ms. Explicit SDK and package steps were skipped on both targets. Review both
full logs/artifacts before correcting these two material G1 findings. Named checks:
bounded source-read concurrency with unchanged per-open safety and aggregate bytes,
retained cancellation/deadline, identity/inventory/draft regressions, and full-scale
rendered pan/zoom/selection/focus/resize without truncation or a timing waiver.


#### Verified failed-run evidence

The full 1,746-line run log (including both complete target jobs), step metadata and
both uploaded ZIPs were inspected. All checkout SHAs agree with `f37635e`, candidate
tree `5590e513e8163a9b0db7267ac67a85e61a700f39`. Preflight `108312714429` passed;
Windows job `108312932935` and macOS job `108312932845` failed. Both artifacts match
GitHub's exact size and SHA-256 and pass every ZIP entry CRC/path/symlink check:

| Target / artifact | Bytes | Verified ZIP SHA-256 |
| --- | ---: | --- |
| Windows / `10895435524` | 120088 | `869cc071362a8b176de74983f4865887c7a07fe36d8d87b61784236dedcbfc36` |
| macOS / `10895295762` | 223013 | `c1eeb26084a9e3ce3abae1c462eb7ecb1b396b84210eb54c0218912d48fe73ec` |

Both contain complete core and isolated budget logs plus the actual 500-node/2,000-edge
flow JSON (partial/stale/over-limit false). macOS additionally contains the runtime
browser success log, 1100/640px screenshots and Branches assertion log. Windows stopped
before those rendered checks. No package, executable, `runtime-ui-inputs.json`, explicit
SDK output, five real-service packaged UI cases or legacy package smoke was generated.
The input-manifest gate therefore remains **0/94 verified hashes per target**, with no
executable attestation. ZIP integrity and checkout identity do not replace those gates.

| Gate on failed `f37635e` | Windows x64 | macOS ARM64 |
| --- | --- | --- |
| Full release core | 174 passed / 0 failed / 7 ignored, 119.55 s | 182 passed / 0 failed / 7 ignored, 50.79 s |
| Substantive ordinary core results after two no-archive wrapper skips | 172 passed | 180 passed |
| Isolated initial projection | 489.794 ms (<2 s) | 126.715 ms (<2 s) |
| Isolated warm refresh (supplemental) | 487.613 ms | 198.364 ms |
| Isolated accepted update | **489.453 ms, FAIL** (>250 ms), 0 passed/1 failed | **154.944 ms, PASS**, 1 passed |
| Runtime rendered focus/resize | SKIPPED | PASS at 1100/640px; injected requester and synthetic events |
| Branches pan/frame p95 | SKIPPED | **120 ms, FAIL** (>100 ms) |
| SDK, desktop/package, five real-service cases, legacy smoke | SKIPPED | SKIPPED |

Seven ignored entries remain five subprocess workers and two explicit SDK gates, not
additional passes. Source production-browser regression/build passed on both targets;
Preflight frontend typecheck/58 tests and repository/format checks passed. R2-C1's
semantic capability assertion now passes on both targets. The macOS Branches script
reached the p95 assertion after its layout bound, route-navigation, subview resize and
page-error checks, but did not print its successful timing JSON; exact initial layout
and individual frame samples are unavailable for that run. Do not invent them.

**Assessment on the failed candidate:** G1 FAIL/incomplete (Windows G1-V1 plus rendered
G1-V2); R1 final-source regression incomplete (explicit SDK skipped); R2 BLOCKED (no
final packages or five-case proof). Preserve prior R1 closure on its actual `c12d953`
inputs and both earlier production failures. Repository quality `36209417219` passed
on `f37635e` and `36209513943` passed on `9fc2450`; neither is a production pass.

#### Bounded corrections and review

G1-V1 follow-up: run large source acquisition and final rechecks through at most four
scoped I/O workers; small inventories remain serial. Each worker uses the same fully
validated reader, at most one retained parent chain, and fresh source bytes/hashes.
Ordered results preserve deterministic assembly. A single atomic byte allowance is
reserved before allocation/read and shared by every worker; successful bytes remain
charged, failed reads release their reservations. No fourfold memory allowance or
content cache is introduced. All workers join before returning, and each inherits
the exact original cancellation token and deadline (no fresh 180 s budget).

Root/registration/parent/leaf checks, file identity/length/growth checks, final
source/metadata/inventory validation and independent write preconditions remain.
Revision hashing now allocates only the observed file length plus one growth-detection
byte, capped at the unchanged 1 MiB chunk/cancellation interval. Empty and growing files
remain checked. This avoids repeatedly clearing 1 MiB for tiny source files and adds
no metadata-only shortcut. Limits and the real accepted-edit fixture are unchanged.

G1-V2: the existing graph changes only its transform while panning but repeatedly
paints its SVG/node subtree. A compositor hint on the bounded graph canvas retains
all 500 nodes/2,000 edges and the existing DOM, layout, keyboard, selection and source
navigation. No culling, graph truncation, timing waiver or test sampling change.
The browser gate now prints all 30 samples and budget status before assertions so a
future failure retains measurements; the same <2 s and <100 ms assertions still fail.

Temporary local diagnostic tracing at 4x CPU slowdown (Chrome 154.0.8037.57, macOS
26.6.2 ARM64, same real-service fixture) recorded **176 Paint events before / 7 after**;
pan/frame p95 **41.6 ms / 12.8 ms**, initial layout **316.9 ms / 296.6 ms**. This is
mechanism evidence, not reproduction of the runner's exact 120 ms or native acceptance.
Tracing/CPU slowdown helpers were removed; final gates use the ordinary unchanged
measurement conditions. Initial local parallel fixture: accepted update 92.895 ms;
with bounded small-file hashing: 90.626 ms. Final-candidate gates follow separately.

Added regressions prove ordered 256-file results, an aggregate allowance shared across
workers, changed-source detection in final rechecks, cancellation, the unchanged file
count limit and exact deadline inheritance/restoration. Existing hostile reader and
flow/Source/history tests remain. Empty, small, >1 MiB and growing-file hashes are
checked against exact expected digests/counts. Review found no privilege/CSP, source
truth or transaction change. The unmodified Phase 0 Python repeated-signal cleanup
finding remains recorded in the preceding assessment; it is not silently closed.


#### Final local verification and publication decision

| Final local gate | Observed result |
| --- | --- |
| Full production release core (`cargo test --release -p loomlight-core --locked -- --nocapture`) | **184 passed / 0 failed / 7 ignored**, 124.61 s. Two official-SDK wrappers printed no-archive skips, leaving 182 substantive ordinary passes. Explicit SDK gates remain native target work. |
| Isolated unchanged release budget fixture with enforcement and fresh flow JSON | **1 passed**, 190 filtered, 1.79 s; initial **92.112 ms**, warm **88.167 ms**, accepted update **91.395 ms**; required success marker present. No concurrent core test. |
| Frontend typecheck and protocol/DOM suite (`npm run check`) | **58 passed**, zero failed/cancelled/skipped. |
| Frontend build and Source production-browser regressions | PASS; faithful clean-after-Save, preserved legacy red control, selection/Apply Both. |
| Full-size Branches browser against the new service fixture | PASS; Chrome 154.0.8037.57, initial **67.8 ms**, p95 **17.7 ms**; all 30 samples retained, including one **145.9 ms** maximum. The unchanged p95 rule, not a maximum rule, passes. 500 nodes/2,000 edges, source/edit navigation and subview 640px resize checks pass, no page errors. |
| Runtime browser | PASS; 1100/640px, focus pass, no overflow/page errors; injected requester/synthetic input. |
| Rust formatting, structure/link/privacy validator, whitespace | PASS; validator reports 258 repository files. |

Final conditions: macOS 26.6.2 build 25G83 ARM64, Rust/Cargo 1.90.0, development Node
26.8.1/npm 11.19.0. The final browser measurement uses no CPU throttling or trace.
The readable five-Scene screenshot was visually inspected only after full-scale
assertions; it is not represented as a full-size or packaged screenshot. No local
verification process remains. Unchanged Phase 0 evidence/its previously diagnosed
Python helper error is retained without rerunning an unrelated failing spike to
manufacture a pass.

Self-review covered the complete diff, scoped-worker lifetime/failure cleanup,
registration and path revalidation, one aggregate byte allowance, unchanged final
source/metadata/inventory checks, exact cancellation/deadline inheritance, small-file
hash edge cases and the unchanged browser workload/assertions. New platform authority,
cache/consistency redesign, budgets, dependencies and workflow triggers are excluded.
G1-V1/V2 are corrected locally, **pending target proof**, not finally closed.

Publish the coherent correction on the existing branch, then check pending runs and
dispatch one justified replacement production run with package upload. This responds
to the user's explicit failed-run review/fix request and materially changes both
failed paths; do not rerun the unchanged failed SHA. Preserve manual-resume identity
if pending, publish assessment/ledger/handover, and stop before physical testing,
acceptance, merge, optional Git or Phase 2.


#### Published follow-up and exact manual-resume handover

Correction **`ec6a76adbf78bc09baf7daba067d70eedbc38699`**, tree
**`d0e749915cc69006821dc2d52506afe666c6a8b4`**, is published; remote branch and draft/open
PR #17 were checked and match. A fresh run inventory found no pending production or
R1-only verification. Exactly one replacement was manually dispatched with package
upload; no unchanged-SHA rerun, workflow change, R1-only run or duplicate was launched.

[Run 36210484651](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36210484651),
**attempt 1**, was created **2026-09-26T02:03:45Z**, exact candidate `ec6a76a` above,
branch `feature/phase-1g-branches-runtime`. Dispatch returned the URL and the exact-run
endpoint confirmed its SHA/attempt. At bounded inspection: **in_progress**, conclusion
null; Preflight **`108315757962` in_progress**; no target jobs or complete logs yet;
artifact endpoint **0 artifacts**. The candidate still has **94** application/workflow
inputs, with **0/94 per-target hashes verified** and no executable/package hashes yet.

**G1:** both local corrections and unchanged service/rendered gates pass; Windows/macOS
budget and packaged graph evidence remain pending. **R1:** final-source local ordinary
regressions pass; explicit supported-target SDK/process proof pending. **R2:** local
frontend/browser passes; all five final packaged real-service cases and legacy smoke
pending. No final capability, physical or acceptance pass is claimed. Preserve the
complete failed `f37635e` assessment and older evidence on their actual inputs.

State **awaiting_ci / manual resume**. This documentation-only follow-up publishes the
assessment, ledger and live handover; no package matrix is requested for it. No local
verification remains pending, no watcher/automatic wake-up is configured and no repeated
model polling is performed. Next action: inspect this existing run when complete and
verify both full logs plus ZIP integrity, all 94 input hashes, candidate/tree/target/
executable, explicit SDK markers, isolated/rendered budgets, five runtime UI JSON/log
pairs and legacy smoke independently. If still pending, preserve this identity and
stop. Publish assessment/ledger/handover; stop before physical testing, acceptance,
merge, optional Git or Phase 2. Do not duplicate pending verification.


### 15. Completed replacement assessment and Windows G1-V1 profiling checkpoint — 2026-09-26

User-authorised continuation after adversarial review of head `0d105d3`: preserve the
existing Phase 1G.2b branch/PR, assess completed replacement evidence, implement the
next bounded diagnostic step, update the repository handover, and stop before a wider
architectural correction, physical testing, acceptance, merge, optional Git or Phase 2.

Replacement production run
[36210484651](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36210484651),
attempt 1, exact application candidate
`ec6a76adbf78bc09baf7daba067d70eedbc38699`, completed **FAIL**. Preflight passed.
macOS ARM64 job `108315855809` passed all production steps: isolated real-service
projection accepted update **66.483 ms <250 ms**, rendered graph p95 **58 ms <100 ms**,
official SDK/runtime diagnostics, desktop/package, all five real-service packaged UI
cases, legacy packaged smoke, scans/inventory and uploads passed. This closes neither
G1 nor final R2 because supported-target completion is conjunctive.

Windows x64 job `108315855860` passed the full release core suite (**176 passed,
0 failed, 7 ignored**) but failed the isolated projection gate. Its isolated fixture
reported initial **646.337 ms**, warm **639.328 ms**, accepted update **616.686 ms**,
then failed the unchanged 250 ms assertion. Downstream rendered/SDK/package/runtime
steps were skipped by job failure. The lightweight Windows evidence artifact was
uploaded, but there is no Windows executable/package or final 94-input manifest from
this run. Preserve the earlier accepted R1 evidence under its own candidates; do not
substitute the macOS package for missing Windows final-source evidence.

Assessment: the compositor-backed G1-V2 correction is supported by the macOS target
result and remains the retained implementation. G1-V1 is **not corrected cross-platform**.
The four-reader observation change preserves bounded/security semantics but does not
reduce enough work on Windows; the same candidate is ~66 ms accepted update on macOS
and ~617 ms on Windows. The flow path still performs source refresh/load, inventory,
secure snapshot read/hash, parsing/projection, a second secure revision/hash pass,
inventory recheck and metadata revision rechecks. The next correction must be driven
by measured stage cost rather than another thread-count guess or budget relaxation.

#### Profiling implementation and gates

Published diagnostic commits:
- `77f2c452d5279dda687b4d773e8f402b1fb0a0df` — env-gated
  `LOOMLIGHT_PROFILE_FLOW=1` stage timings in the real `flow_workspace` path.
- `94481e0e83442e63db3ac43810d29326bfeb523b` — manual-only
  `.github/workflows/flow-profile.yml`, Windows x64 + macOS ARM64, isolated release
  fixture only, 15-minute ceiling, retained profile log; no SDK/package/browser matrix.

The profiler records: source refresh, metadata load, inventory, secure snapshot
read/hash, label inventory, node projection, edge projection, freshness read/hash,
inventory recheck, metadata recheck, finalize and total. Instrumentation is inactive
unless the explicit environment variable is set; it adds no cache, authority,
persistent worker, filesystem mutation, budget change or production behavior.

**Next bounded action:** manually dispatch **Phase 1G flow profile** once on this branch.
Do not rerun production `36210484651` and do not dispatch another package matrix.
When the two profile jobs complete, inspect exact logs/artifacts and compare stage
timings. If Windows `snapshot_read_hash` and/or `freshness_read_hash` dominate,
design the smallest correctness-preserving reduction in duplicate observation work;
if another stage dominates, correct that measured stage instead. Preserve full
root/parent/leaf identity safety, stale fail-closed behavior, cancellation/deadline,
32 MiB/2,048-file limits and the unchanged 250 ms accepted-update budget. Any cache or
consistency-model redesign requires explicit review before implementation.


### 16. Windows secure-observation concurrency result and G1-V1 design blocker — 2026-09-26

Manual [Repository quality run 36218397984](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36218397984),
attempt 1, exact head `7e4234a041b446d01ad5244002f1ce945d58046d`, completed PASS for both
profiling jobs; normal repository validation was intentionally skipped. This was a
diagnostic run only and does not satisfy production G1/R1/R2.

Windows x64 accepted-update results by requested secure-observation reader count:
**1 = 508.416 ms; 2 = 536.401 ms; 4 = 749.559 ms; 8 = 784.488 ms; 16 = 501.102 ms**.
Initial/warm results follow the same broad range. macOS ARM64:
**1 = 105.763 ms; 2 = 92.560 ms; 4 = 67.187 ms; 8 = 58.416 ms; 16 = 68.651 ms**.
On Windows, increasing concurrency is non-monotonic and commonly worse. Even the best
observed accepted update remains about twice the unchanged 250 ms budget.

The stage profiles continue to locate nearly all Windows time in the two secure
per-file observation/hash passes. At the 1-reader accepted update, snapshot/hash was
**240.157 ms** and freshness/hash **199.032 ms**; parsing/projection remained small.
At 16 readers, snapshot/hash **227.808 ms** and freshness/hash **214.601 ms**. Therefore
worker-count tuning cannot close G1-V1. The current consistency model performs roughly
503 secure opens/hashes twice per refresh and is itself the Windows budget blocker.

Self-review rejected replacing the second hash with identity/length alone: same-file
in-place writes may retain file identity and length, so this would silently weaken
stale detection. It also cannot solve the budget because one complete Windows secure
snapshot pass is already approximately the whole 250 ms allowance.

Temporary reader-count overrides were removed after evidence capture by
`66af29abbea467cd55aae3e1569e4fdcf2fbc799`; the concurrency sweep was removed from
the feature workflow by `225781a634bb771387995582eabb951920600e5e`. Normal production
remains at the original bounded four-reader policy. Stage instrumentation remains
env-gated for future diagnosis.

**Design blocker / next plan:** do not dispatch another production matrix and do not
relax the budget. G1-V1 now requires a correctness-preserving observation redesign
that reduces the number of full secure content hashes on an ordinary refresh while
still detecting external in-place edits, replacements, inventory changes and
root/parent/leaf substitution. Before implementation, specify and adversarially review
the consistency contract. Preferred direction to investigate is a project-scoped
source observation index owned by the core (not renderer) with secure initial hashes,
cheap OS metadata/change signals for unchanged files, mandatory re-hash on any signal
or ambiguity, explicit invalidation after Loomlight transactions, and periodic/full
verification boundaries. It must fail closed when signals are unavailable or
inconsistent and must not become write authority. Alternatives such as a platform
directory watcher may be used only as invalidation hints, never sole correctness
authority. The design must include Windows/macOS semantics and hostile race tests.

State: **blocked on G1-V1 observation-design checkpoint**. G1-V2 compositor work is
retained; R1 prior closure is preserved under its own candidate; final R2 and 1G
acceptance remain incomplete. Stop before implementing the consistency redesign
without a reviewed plan.

### 17. G1-V1 observation redesign review — 2026-09-27

**Authority:** user selected an adversarial design review and publication of
documentation only. No implementation, physical testing, merge, optional Git,
Phase 2 or production/package dispatch is authorised in this checkpoint.
**Outcome:** design review `review_ready`; G1-V1 remains `blocked` on native
feasibility. The next separately selected implementation checkpoint is **G1-O1**.

#### Entry, ownership and evidence

Fresh branch head was `f1e24d5f3a22ccbaa4a0978ab03fdcae508daf43`, matching the supplied
handover. PR #17 is open/draft with no review comments. A new isolated checkout was
clean, with one local worktree and no unpublished work; no newer implementation
was present. Cross-host unpublished work/ownership is not independently observable.
Main is `4d7ba0333c48d60242a9a42d3e079fea499a5531`; its unique commit adds the bounded
quality-workflow dispatch, already present in the feature branch's workflow. No
merge/reset/rebase is needed for this review. Recheck the remote before pushing.

Read AGENTS, WORKFLOW, CURRENT, HANDOVER, sections 15–16 and relevant 1G/transaction
contracts, ADRs 0001/0004/0008, flow, observation/platform/identity/path readers,
metadata loaders, Source refresh, mutation boundary, request cancellation and fixture.
There are no nested AGENTS files in this checkout. Repository changes are docs only.

Re-fetched jobs/artifact metadata for all three completed runs and read both target
production logs and all four profiling logs. This pass did not redownload/recheck
archive CRCs or claim new executable/input-hash verification. Preserve earlier
provenance and missing evidence exactly as recorded in sections 15–16.

| Run / attempt / exact input | Evidence used | Interpretation |
| --- | --- | --- |
| [36210484651](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36210484651), 1, `ec6a76adbf78bc09baf7daba067d70eedbc38699` | Windows isolated update 616.6855 ms; macOS 66.483333 ms. Windows downstream package gates skipped; macOS production job passed. | Production FAIL; unchanged 250 ms gate; no final G1/R2 closure. |
| [36213357271](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36213357271), 1, `8303d4e057b2b137c770d65f7ab660bfbc5b1285` | Windows internal accepted total 588.068 ms: snapshot 286.449 + verifier 266.781 ms (~94.1%). Whole-call update 588.5857 ms; macOS 63.221125 ms. | Diagnostic localization, not a production pass. Secure open/path/read/hash costs are grouped; no evidence that SHA-256 arithmetic is the culprit. |
| [36218397984](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36218397984), 1, `7e4234a041b446d01ad5244002f1ce945d58046d` | Windows readers 1/2/4/8/16: 508.416 / 536.401 / 749.559 / 784.488 / 501.102 ms; macOS 105.763 / 92.560 / 67.187 / 58.416 / 68.651 ms. | Concurrency cannot close Windows G1-V1; both diagnostic jobs succeeding does not mean latency passed. |

The profile workflow currently sets `LOOMLIGHT_PROFILE_FLOW=1` but does **not** set
`LOOMLIGHT_ENFORCE_FLOW_BUDGETS=1`. A green diagnostic run must never be treated as
the prerequisite performance pass. G1-O1/G1-O2 must distinguish feasibility timings
from the enforced production-path marker. The old reader override/sweep stays retired.

#### Reviewed architecture and adversarial disposition

[ADR 0009](../../adr/0009-flow-observation-candidates.md) is the canonical reviewed
proposal, including the full threat/consistency matrix, ownership, platform limits,
resource bounds, references, alternatives and performance calculation.

Recommend a core-owned **candidate** index: securely acquire/hash once when cold,
reacquire dirty/new source entries, project cached bytes, then freshly open/hash **all**
source files and recheck inventories/metadata before returning fresh. Cached candidates
never certify current disk state. Keep transaction/runtime write/trust authority
independent. No watcher or persistent handle/index is required.

This deliberately rejects the unproved portion of section 16's preferred direction:
metadata/change signals plus periodic hashing cannot prove current content without
a false-fresh window. Stable same-length edits with restored timestamps are detected
by the mandatory verifier even with notifications absent. Full verification is per
request, not an eventual audit. Microsoft documents repeated-write USN coalescing and
notification overflow; Apple's events are advisory. Primary references are in the ADR.

| Finding | Disposition |
| --- | --- |
| Metadata/watchers silently substitute for content verification | Unsafe; rejected. No identity/mtime-only or watcher-only cache hit. |
| One full old Windows pass is still too slow | Partially satisfied by index only. Require separate secure-reader syscall reduction and native proof before integration. No timing promise based solely on fewer hashes. |
| Broad oplock/USN/retained-handle subsystem | Credible research alternatives but unnecessary complexity before the smaller proof; not selected. No external-editor locks or new privileges. |
| Invalidating all candidates after each successful transaction | Safe but defeats the goal. Record touched paths before/after mutation; preserve unaffected candidates. Unknown failures/recovery invalidate all. |
| Invalidation only after successful Source Save | Incomplete. Cover all central mutations, partial failures, recovery, Scene, undo/redo and runtime-policy installation; verifier catches missing hooks. |
| Metadata dependency coverage | `load()` consumes authoring state, while flow's final loop checks only project/source-map files. Capture authoring presence/revision and all actual projection dependencies. Treat unenumerated dependencies as a wiring blocker. |
| Cancellation already solved by existing calls to `runtime_work::check()` | Unproved for ordinary flow dispatch: no context means no check. Bind the actual Branches request/session and absolute deadline; verify disposal reaches core work. |
| Cached observations reused for Source Save, trust or runtime launch | Prohibited. Existing exact bytes/identity, displaced-backup checks, retention and full runtime preparation remain independent. |
| Atomic snapshot / no race whatsoever | Not supplied by the current read model either. Document per-file optimistic verification and final-window limits; never describe the cache as a lease. |
| CURRENT still requests completed dispatches | Corrected in this docs checkpoint; historical ledgers retain the actual past instructions/results. PR description is historical and live continuation remains HANDOVER. |

Expected normal source hashes: cold 1,006; warm 503; accepted one-Scene edit 504,
plus unchanged metadata/dependency work and inventories. About half of secure full-file
passes disappear without skipping final verification. ADR 0009 quantifies the remaining
Windows requirement: target <=175 ms verifier + <=65 ms other work, <=240 ms total
engineering allocation against the unchanged **<250 ms** actual success gate.
This requires ~34% improvement in the four-reader verifier; unmeasured and conditional.
macOS already demonstrates adequate margin. The ordinary fixed fixture is ~105.5 KB
of generated Scene scripts plus support files, not a 32 MiB throughput benchmark.

#### Implementation checkpoints

Each row is a separate user-selected checkpoint; this review implements none of them.

| Checkpoint | Bounded implementation and exit gate |
| --- | --- |
| **G1-O1 — verified-candidate feasibility proof (next)** | Implement a core-private candidate-index prototype and post-projection full verifier, reachable only through a test harness initially. Reuse real secure readers and the same fixture/Scene transaction to test cold/warm/one-source invalidation. Add operation counters/timings for root/chain validation, leaf open, handle metadata, bytes/hash and inventory. Qualify only a narrow observation-reader consolidation of duplicate syscalls at the same safety boundaries; do not change public transaction reads/writes or production `flow_workspace`. Test generation/dirty events directly; this does not establish production hook coverage. Prove equivalence with the old reader and native hostile cases below. Run one cheap Windows/macOS profile of this proof. Exit `review_ready` only if correctness passes, cold <2 s and all recorded successful warm/accepted samples <250 ms with plausible margin. If unsafe, above budget or blocked by native APIs, publish findings and stop; no production wiring. |
| **G1-O2 — production ownership and flow integration** | Only after reviewed G1-O1 feasibility, wire central before/after mutation invalidation, dependency-complete metadata, request/session cancellation and bounded index lifetime into real flow. Reuse existing Source/Scene/transaction authority; no new scheduler or write capability. Preserve one-file granularity. Run focused flow/Source/history/transaction/runtime-control regressions, then cheap native **production-path** isolated fixture with budgets enforced and terminal marker required. Failure/stale/timeout cannot pass. Stop after evidence/handover; no package matrix in this checkpoint. |
| **G1-O3 — supported-target readiness review** | Review O2 candidate and exact input hashes, adversarial coverage and both native performance logs. Run only missing relevant regressions and rendered G1-V2 checks. If every prerequisite passes, publish a concrete justification and exact candidate for one separately selected full production/package run. Otherwise remain blocked; do not dispatch speculatively. |

G1-O1 must not claim to close G1 because it is a prototype path. Keep the existing
production fixture as the later authority; reuse its setup/accepted Choice-caption
operation without changing counts, topology, timing boundaries or old assertions.
No hidden prewarm between the accepted mutation and the measured refresh; include
invalidation/acquisition/verification costs and separately report mutation-hook overhead.
No successful stale graph, delayed refresh or UI-only measurement can satisfy latency.

#### Adversarial tests and cheap native gates

Use deterministic barriers at acquisition, projection, each verification boundary and
publication rather than probabilistic sleeps. Add focused tests for new invariants;
reuse existing hostile transaction/Source tests. Required cases:

1. Cold index and unchanged refresh; one-Scene accepted update proves **504** source
   hashes (503 final) rather than a full reacquisition. All 500 nodes/2,000 edges and
   changed caption remain correct. Empty cache/eviction/unknown invalidation is honest.
2. External same-length write after candidate creation and during projection, restored
   mtime, repeated writes through one unclosed handle, mapped write where supported,
   write in an unrelated/unmapped `.rpy`, zero notifications. No fresh old projection.
3. Same-byte/different-identity replace-on-save; remove/recreate, rename, case-only
   rename, add a duplicate label or whole subtree, remove an observed source. Compare
   inventories and identities; never follow an old persistent leaf descriptor.
4. Root/parent/leaf symlink or Windows reparse substitution at each secure-open
   boundary, including same-identity in-place reparse changes; Unix retained-directory
   rename and Windows pinned-directory refusal. Existing-hostile tests must remain
   meaningful for the new reader. Missing platform support is a recorded gap, not PASS.
5. Mutation before/after invalidation, partial commit/conflict/recovery, Source/Scene,
   undo/redo, create/delete and runtime policy. Generation changes during projection
   or just before publication refuse freshness; no lock inversion. Production hooks
   are O2 gates; explicit harness invalidation in O1 is not equivalent evidence.
6. Project/source-map/**authoring** metadata changed or replaced, authoring absent then
   created, unchanged source bytes but changed mapping/dependency; preserve dirty
   Source text/caret and review identity/retention barriers. Do not autoaccept drafts.
7. Cancellation and original deadline through each worker, mid-read/hash, final checks,
   project switch/reopen with same disk UUID, drop/unregistration and late completion.
   No candidate promotion after cancellation. Actual flow context wiring is an O2 gate.
8. Exact file/byte/Scene/edge/inventory/depth limits, one beyond, large source growth,
   unreadable/special files, descriptor/allocation failure, dirty-set overflow and
   repeated reopen. Assert source-blob/descriptor peaks and eventual release.
9. Poison/expire the index then invoke real Scene/Source/history/flush/runtime prepare:
   independent current-state checks still refuse stale writes, preserve competing
   bytes and require existing execution consent. Preserve final-window race evidence.

For O1, add a named isolated feasibility test and run focused safety tests first.
On each target run three sequential fresh-process samples of the fixed cold/warm/edit
sequence in one job (no reader sweep, no reruns of failures to select a winner).
Record every sample and slowest, exact commit, toolchain/OS/filesystem, total source
bytes, counts/counters, memory/handle peaks and per-stage/whole-call times. A 15-minute
job ceiling on the existing Windows x64/macOS ARM64 runners is sufficient scope;
no Node/browser/SDK/package dependencies. Use the existing quality workflow's manual
`phase1g_flow_profile` route, with a bounded proof selector when implemented, rather
than adding another workflow. Keep logs on failure and require the proof marker.

For O2, use the actual isolated release gate in `app/`:

```bash
LOOMLIGHT_PROFILE_FLOW=1 LOOMLIGHT_ENFORCE_FLOW_BUDGETS=1 cargo test -p loomlight-core --release --locked scene::tests::flow_budget_fixture_500_scenes_2000_edges -- --exact --nocapture
```

Require `phase-1g-flow-budget-gate: passed` and successful process exit on both targets.
Preserve all three sequential measurements; do not replace the actual <250 ms limit
with an average. These repetitions assess obvious variability, not a statistical p95
claim. Include the warm success gate in the proof as a design sanity check; the
unchanged accepted-update and initial production assertions remain authoritative.
Do not dispatch any workflow in this documentation review. Future dispatches require
exact candidate/no-pending-run inspection and the existing manual-resume handover if
automatic continuation is unavailable. Never duplicate an ambiguous/pending operation.

#### Remaining risks, validation and handoff

Windows syscall consolidation may not provide the necessary margin, especially with
antivirus/filesystem variance; no faster reader has been implemented or benchmarked.
Its per-boundary path proof is the first go/no-go condition. Exact transitive loader
dependencies, production mutation-hook coverage and Branches cancellation ownership
are O2 obligations, not assumed solved. Existing optimistic final-window limitations
remain; neither this review nor a cache establishes atomic filesystem snapshots.

Documentation gates: `python3 scripts/validate.py` **PASS (258 files)**,
`git diff --cached --check` **PASS**; local links, five-file docs-only scope and
manual adversarial review passed. No application tests or physical tests are warranted for
this docs-only change; no target performance pass is newly claimed. Publication
contains this ledger, ADR/index, corrected CURRENT and the single HANDOVER. Verify
remote fast-forward/head/content before reporting the actual documentation SHA; do
not create a follow-up commit to record the commit's own hash. No outstanding
dispatched work. Stop and offer only G1-O1 as the next checkpoint.


### 18. G1-O1 verified-candidate feasibility proof — 2026-09-27

**Authority:** the user explicitly selected G1-O1 implementation, adversarial proof,
and one cheap Windows/macOS profiling pair, followed by publication and stop.
**Outcome:** investigation complete, **NO-GO**; G1-O1/G1-V1 remain `blocked`.
Production flow/write wiring, package matrices, acceptance
and G1-O2 remain excluded. The <250 ms update / <2 s cold limits are unchanged.

Fresh fetched branch and draft/open PR #17 match entry
`1c87e2c952e67c6e39b02cf6ba6990881f9a347d`. The existing implementation worktree was
clean and fast-forwarded; no reset or rebase. Visible related tasks were idle; no
other active repository writer was found. Unpublished cross-host work remains
independently unobservable. Main is `4d7ba0333c48d60242a9a42d3e079fea499a5531`;
its profiling route already exists on this branch. Read AGENTS, WORKFLOW, CURRENT,
HANDOVER, ledger 17 and ADR 0009; no nested AGENTS.


#### Prototype and safety map

All new executable paths are `cfg(test)`: `scene/flow/candidate.rs`,
`transaction/candidate.rs`, `transaction/platform/candidate.rs`, their harnesses,
and an absolute-deadline test context. Production `flow_workspace`, public readers,
write paths, runtime inventories and IPC are unchanged. The fixed fixture is copied
unchanged from the production gate; projection uses the existing label/edge/mapping
helpers. A small-fixture exact JSON comparison checks parity with production.

The harness retains one owned byte vector per candidate, no leaf handles. Explicit
before/after dirty events remove the one touched source; unknown events clear all.
One owner key contains registered ProjectId, session number and root identity. A
request takes the candidates out of the index, projects them, then freshly reads all
sources. Any verification/generation/registration failure prevents promotion and
removes edge editability. No retries, watchers or background results. The request
installs a two-second absolute ceiling capped by any earlier inherited deadline.

| Existing boundary | Prototype owner / proof |
| --- | --- |
| Approved registration, canonical root and root identity | Registration lookup on every read and final publication; fresh canonical root and pathname identity in the complete compound chain, before open, after open and after read. Initial/changed-parent resolution still uses the original reader's root/path checks. |
| Every parent identity, directory type and reparse/symlink refusal | `candidate_validate` freshly checks path metadata, opens each directory with original platform flags, and compares one native handle sample with each retained identity. It never treats directory pinning as content immutability. |
| Leaf path/type/no-follow/sharing | Original `open_file_at` flags and path metadata checks retained. Fresh leaf sample rejects directories/special/reparse objects. A second chain check before bytes prevents a substituted parent from authorizing an outside read. |
| Before/after identity and length, bounded full bytes and hash | One native sample per leaf boundary combines identity/type/length; every read/hash checks cancellation at <=1 MiB, checks growth/short read, and samples again after bytes. Final chain/registration validation also retained. |
| Same-byte replacement and external writes | Fresh leaf handles; hash AND identity comparison after projection. Restored mtime/open-handle writes, unmapped source, rename/add/remove, macOS mapped write and same-byte replacement covered. No timestamp shortcut. |
| Metadata / authority | Captures project, map, authoring presence/revision and assets-source presence plus empty media inventories. O1 deliberately refuses nonempty authoring content/media: complete transitive dependency support is O2. Real stale Scene command test refuses a competing writer after index invalidation. |
| Resource bounds | Four scoped readers, 2,048 files, 16 MiB/file, shared 32 MiB acquisition allowance. Near the source byte ceiling, release blobs after projection before verifier scratch and leave the next request cold. Source-batch scratch/readers counted; descriptor upper bound includes full chains, leaf and validation handle, without claiming an OS-wide measured peak. |

This consolidation combines native handle queries at a boundary and eliminates the
redundant standalone root check when the retained parent already supplies that same
root check. It conservatively adds post-open/post-read chain checks. Whether that
net syscall balance can satisfy Windows is deliberately left to measurement.
Operation durations are summed worker costs (overlapping), not additive wall time.
Counters cover candidate acquisition/verifier source passes; the unchanged metadata
loaders also read support sources, separately charged to metadata stages.

#### Local gates before native dispatch

macOS ARM64 26.6.2 (25G83), pinned Rust 1.90.0, release/locked:

- Focused proof suite: **12 passed**, no failed/ignored (8.05 s), including original
  reader hostile cases repeated against the new reader, deterministic read boundaries,
  growth/shortening, chunk cancellation and inherited expired deadline.
- Full core regression before the final resource-counter-only/Windows-test additions:
  **196 passed / 7 ignored**, no failed (137.67 s); crash/recovery, Source/Scene/history
  and runtime controls remain intact. Ignored official SDK gates are not passes.
- Isolated enforced local fixture: cold **78.826 ms**, warm **53.248 ms**, accepted
  **57.001 ms** including **0.003 ms** explicit invalidation overhead. Counts
  **1,006 / 503 / 504**; 503 files, **105,627 source bytes**, 500 nodes, 2,000 edges,
  changed Route A caption. These preliminary timings precede the final resource
  instrumentation and are not the supported-target three-sample qualification.
- Formatter, diff whitespace, repository link/privacy validation pass (264 files).
  No frontend/package changes or SDK/browser work are needed for this test-only path.

Native route: existing `quality.yml`, `phase1g_flow_profile=true` and new bounded
`phase1g_candidate_proof=true`; one Windows-2025/macOS-26 pair, 15 minutes each.
Safety precedes three fresh-process fixed samples; every sample keeps its result,
including failures, and requires `phase-1g-candidate-proof: passed`. The unchanged
<250 ms warm/accepted and <2 s cold rules are enforced. No reader-count sweep or
package workflow. Exact dispatch receipt/outcome will be recorded below.

#### Limits requiring explicit disposition

This is not production hook coverage or final G1 acceptance. The prototype refuses
nonempty authoring/media dependencies instead of generalizing their loader contract.
Mutation/partial failure/recovery/session events are harness-driven; real Source,
undo/redo/runtime invalidation wiring remains O2. The original authority/regression
suite is preserved, not replaced by a poisoned-cache shortcut.

Coverage remains narrower than ledger 17's entire qualification matrix: source-batch
memory and a descriptor bound are instrumented, not allocator-failure injection or a
whole-process peak including loader allocations; 32 MiB exact / one-byte-under allowance
is proven at the compound batch reader, not yet at every loader/projection allocation.
OS-level descriptor exhaustion, every special-file kind, exact traversal-depth/entry
and every scene/edge boundary on the copied prototype, and live Source caret/retention
with a poisoned index are not all newly exercised. These are explicit proof gaps,
not silent passes. Native Windows in-place reparse and mapped-write cases are included
but cannot be claimed until their actual runner logs pass. A native timing pass alone
would not close these gaps or authorize G1-O2.


#### Native result and verified evidence — NO-GO

Exactly one [run 36278262505](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36278262505),
**attempt 1**, tested **`b3d696533290d91bc2ff7d4eb65562d2c68642e1`**.
The run completed **FAILURE**: macOS job **108505073353** succeeded; Windows job
**108505073512** failed the unchanged timing gate. No retry, reader sweep or package
matrix was dispatched. Repository-quality job in this manual route was intentionally
skipped; the separate ordinary PR quality run is not performance evidence.

Both targets used Rust **1.90.0** (`1159e78c4747b02ef996e55082b704c09b970588`),
release/locked. macOS ARM64 **26.6.2 / APFS**; Windows x64 **Server 2025 Datacenter
10.0.26100**. Windows filesystem type is **not established by the captured output**:
PowerShell formatted the volume objects under the preceding OS table and omitted
their fields. Do not assume a recorded NTFS confirmation or rerun solely to repair it.

| Target / sample | Cold ms (<2,000) | Warm ms (<250) | Accepted edit ms (<250) | Verdict |
| --- | ---: | ---: | ---: | --- |
| Windows 1 | 1,136.219 | 570.423 | 563.983 | FAIL |
| Windows 2 | 1,048.433 | 584.464 | 574.858 | FAIL |
| Windows 3 | 1,088.252 | 581.168 | 586.393 | FAIL |
| macOS 1 | 104.270 | 74.369 | 98.776 | timing PASS |
| macOS 2 | 88.218 | 62.342 | 63.796 | timing PASS |
| macOS 3 | 97.321 | 67.714 | 66.989 | timing PASS |

Slowest cold/warm/accepted: Windows **1,136.219 / 584.464 / 586.393 ms**;
macOS **104.270 / 74.369 / 98.776 ms**. All samples are retained, not averaged.
Windows aborts at the warm assertion after recording the accepted timing too; all
three accepted timings independently exceed 250 ms. macOS emitted all three actual
terminal markers; Windows emitted none. Each graph was successful/nonstale with
500 nodes, 2,000 edges and Route A, so failure is not substituted by stale/timeout.

Native safety suite before samples: Windows **10 passed / 0 failed / 0 ignored**
(9.28 s), including mapped writes and same-identity parent reparse conversion at
all five reader hooks; macOS **11 passed / 0 failed / 0 ignored** (2.51 s).
Those tests did not include the later leaf-path counterexamples below.

Every sequence measured **1,006 / 503 / 504** source hashes; cold/warm/accepted
hashed bytes **211,254 / 105,627 / 105,838**. Peak source-batch bytes including
scratch: Windows **106,051**, macOS **106,263**; maximum readers **4**, live readers
and scratch **0** at each completed request. The recorded descriptor **upper bound
25** covers source chains/leaves/transient validators; it is not an OS-wide peak.
Loader/project/projection allocation and traversal descriptors remain separate gaps.

Windows accepted verifier wall time **481.803 / 491.848 / 503.131 ms** dominates;
metadata/load **19.565 / 19.468 / 19.616**, pre-inventory **16.882 / 17.264 / 16.972**,
dirty acquisition **2.785 / 2.753 / 2.964**, edge projection **10.875 / 11.127 / 11.093**,
post-inventory **17.242 / 17.562 / 17.292**, metadata recheck **6.954 / 6.916 / 7.213**.
The accepted compound reader makes **504 leaf opens**, **1,512 canonical-root checks**,
**6,036 chain-component checks**, and **7,044 handle samples**, plus original
parent-acquisition work. In sample 3 these overlapping worker totals are respectively
35.778 / 465.349 / 1,177.205 / 158.117 ms; bytes/hash is 10.373 ms. This conservative
consolidation did not eliminate enough native work; added chain-boundary checks cost
more than the removed duplicate root/leaf metadata queries. The <=240 ms engineering
allocation is also plainly missed. No claim that SHA arithmetic is the bottleneck.

Read complete logs from both jobs and downloaded both evidence ZIPs. Verified exact
API size, SHA-256 and every ZIP CRC; each contains `runtime-flow-profile.log`:

| Target / artifact ID | ZIP bytes | SHA-256 |
| --- | ---: | --- |
| Windows `10918230888` | 7,199 | `a8ec20931ec07d5025da4bea828cc20b58c7f8f73553a053d6d950ab483d9f13` |
| macOS `10917925783` | 8,127 | `b9727e0a968f1bea3fa1e4cd5df283c5257bcf886f81be0ab12507702dac1b9e` |

The complete input is the exact committed candidate above (including Cargo.lock,
pinned toolchain, reader, fixture and workflow); no package/input-manifest or executable
hash verification is claimed. Archives have seven-day retention. Logs/archives remain
outside Git; the durable sample/counter/failure evidence is this ledger.

#### Adversarial counterexample discovered during final review

**G1-O1-S1 — leaf pathname identity is not rebound after the content read.**
A deterministic barrier immediately after leaf open replaces that pathname with
identical bytes on a new file identity. The verifier hashes/samples its already-open
old object, so both hash and handle identity still equal the cached candidate. Parent
chain/inventory/metadata checks do not bind that leaf name back to the opened object.

Two additional **local macOS** counterexample tests reproduce this at the reader and
whole candidate projection boundaries:

- `transaction::tests::g1_o1_counterexample_same_byte_replacement_after_leaf_open`:
  returned revision equals the old candidate while an independent current snapshot
  has the same hash and a different identity.
- `scene::tests::candidate_proof::g1_o1_counterexample_projection_accepts_replaced_leaf_identity`:
  selects the inventory's actual first verifier file, replaces it at the leaf-open
  hook, and observes an incorrectly nonstale graph. Do not assume directory traversal
  order; targeting an arbitrary Scene instead correctly became stale and was not a
  reproducer. The deterministic test now binds to the actual first open.

Exact focused run: **2 counterexamples reproduced**, no ignored tests. Their passing
assertions document the rejected behavior and explicitly print **NO-GO**, not safety
acceptance. They are a follow-up to native candidate `b3d6965`; the native results do
not include them. No reader behavior changed after native dispatch.

This is earlier than the allowed final-window race *after* a file's final comparison:
the replacement occurs immediately after opening, before the verifier reads/hashes
content. It does not call for an atomic multi-file snapshot. A future reader needs an
explicit final pathname-to-object identity boundary (and its race tests), without
weakening no-follow/root/chain/content checks or adding a metadata lease. The existing
production reader is untouched; no claim is made that this test-only proof repairs
all pre-existing observation races. The prototype is **not safe to promote**.

#### Final disposition and next bounded action

G1-O1 investigation is complete with **NO-GO**. Its capability gate remains `blocked`
on **both G1-O1-S1 and Windows timing**, plus the explicitly listed proof gaps.
Do not select G1-O2, reduce checks, relax 250 ms, introduce watcher-only freshness,
retry profiles to select a winner, or dispatch packages. Preserve prior G1/R1/R2
state and historical failures. PR #17 stays draft/open and unmerged.

Next separately selected checkpoint: **G1-O1-R — review the failed feasibility proof**.
Review a final leaf pathname binding and a credible Windows secure-open cost model
against these exact counters; decide whether a bounded corrected prototype can
qualify the same contract or needs another design. No implementation/CI is approved
by printing that next-chat selector. No operation from the native pair remains pending.
Final publication includes the two counterexamples, ADR disposition, ledger, CURRENT
and the single HANDOVER; verify the remote head rather than chasing a self-SHA.


Final guard: the proof selector now refuses a `g1-o1-safety-counterexample:` marker
before further profiling, so successful execution of a negative reproducer cannot
produce a green qualification run. This workflow-only follow-up was not dispatched;
it does not change or supersede the recorded native candidate/timings. Final
`cargo fmt --check --all`, workflow shell syntax, `python3 scripts/validate.py`
(**264 files**) and staged whitespace checks pass. The final code delta after the
profile candidate is only the two negative reproducers and this no-go workflow guard;
no reader/projection implementation was changed or profiled again.

### 19. G1-O1-R Windows feasibility review — 2026-09-27

**State:** `review_ready`; investigation complete, capability **NO-GO**.
The user selected investigation, bounded diagnostics if decision-relevant, and
publication of findings/next-step planning only. No production implementation,
changed freshness contract, G1-O2, timing-limit change or CI dispatch is authorized.

The canonical [G1-O1-R review and next implementation plan](phase-1g-g1-o1-r-review.md)
contains the sanitized nine-sample comparison, complete sequential stage model,
native operation interpretation, A/B/C comparison, checked Microsoft API guarantees,
S1 safety map, inspected UI/production findings and all remaining integration proofs.

#### Entry, ownership and evidence preservation

Entry feature and freshly verified remote head:
`94128d3d5104f2716d5996d9f4a0492c923054b6`. Main advertised by Git is still
`4d7ba0333c48d60242a9a42d3e079fea499a5531`. The PR API's base SHA field differs;
fresh fetch plus `ls-remote` establish the branch refs used here. No reset, rebase,
merge or history rewrite. PR #17 is draft/open. Other open PRs are unrelated
dependency updates and the retained abandoned CI work; none was modified.

The existing feature checkout was clean at entry. The detached historical checkout
is clean at `b3d696533290d91bc2ff7d4eb65562d2c68642e1`. The prior local comparison
chat is idle and no active benchmark/build process was found; no other visible
repository writer was identified. Unpublished cross-host work cannot be independently
observed. AGENTS, WORKFLOW, CURRENT, HANDOVER, ledger 18, ADR 0009 and relevant code
were read; no nested AGENTS exist in this checkout.

Reused the portable environment and dot-sourced `enter-local.ps1` in fresh shells.
Its default compiler lookup failed under the sandbox; `-SkipVerify` permitted
read-only inspection. Git network access required the ordinary host account after
the sandbox TLS credential failure. No elevated build/test, bootstrap, package,
dependency, power, affinity or security change was made. Documentation validation
uses an already-installed Python. This does not reopen the completed setup task.

Located and inspected local comparison/full-breakdown reports, all CSV tables,
raw sample/prerequisite/native job/artifact logs and state/provenance records.
All three local sample log hashes match their state records. Source-pass/count and
stage arithmetic were cross-checked against those existing records. No new trace,
probe or timing sample was necessary; no benchmark command was executed. Completion
state/raw evidence remains local, untouched and uncommitted.

#### Findings and next recommendation

- Local accepted **460.195 / 464.211 / 456.588 ms**, median **460.195**, versus
  hosted **574.858**: about 20% lower elapsed time, still all failures. Source fixture
  stays 503 files / 105,627 bytes / 500 nodes / 2,000 edges; 1,006/503/504 passes.
  No CPU-specific explanation or uniform speed multiplier follows.
- Local verification **299–302 ms** and other accepted work **158–162 ms** invalidate
  the prior 175+65 allocation. The review's conditional 230 ms complete-request
  model includes final leaf binding and requires independent metadata/inventory
  gains. It is not measured feasibility and is not substituted for CI acceptance.
- G1-O1-S1 remains confirmed. Shared production readers have an analogous missing
  final pathname binding by code inspection; transaction/runtime consequences are
  not newly reproduced. Plan a separate scoped correction, not a transaction rewrite.
- Confirmed Branches silent-click/focus gaps and production metadata dependency
  omission are distinguished from unverified integration/race requirements. Full
  Source/history/runtime authority, cancellation, resource and hook proofs remain.
- **Recommended next checkpoint: G1-O1-N only**, native observation-boundary safety
  and cost feasibility, with early stops and no full corrected prototype or production
  wiring. Option B needs explicit product/ADR approval; option C is deferred.
  No later checkpoint is authorized merely by this recommendation.

#### Validation and publication

Reviewed documentation-only changes. `python scripts/validate.py` passed for
**263 repository files** using the existing Python 3.13; `git diff --check` and
changed-path scope review passed. The publication uses repository-local noreply
identity and the existing branch/PR. Resolve the actual
published head from Git/PR; do not create a receipt-only self-SHA commit. Production,
test code, workflow guard and historical checkout remain unchanged. No native or
package CI dispatch; ordinary PR documentation checks may run on publication.

### 20. G1-O1-N native observation-boundary experiment — 2026-09-27

**Authority:** user selected G1-O1-N only: bounded safety/cost experiment,
historical preservation and findings/handover publication; no production or CI dispatch.
**State:** review_ready investigation complete; capability **NO-GO**.
Entry 79f2f84792f46a39140e81b33c5a569fc2e3a56f; branch
feature/phase-1g-branches-runtime, draft/open PR #17. Fresh fetch/advertised refs
matched this feature head and main 4d7ba0333c48d60242a9a42d3e079fea499a5531.
Feature checkout was clean; prior repository chats idle, no active repository
build/benchmark writer found. Historical detached checkout remained clean.

The [pre-registration and findings](phase-1g-g1-o1-n-experiment.md) own exact
input/diff/binary/log hashes, ordered cases, native flags, safety map, cost
disposition and later proof gaps. The source is test-only (cfg(test)/Windows);
the existing candidate/negative controls and production paths are unchanged.
One ignored-by-default manual safety selector was built release/locked/offline
using the existing local Windows tools; explicit native invocation ran once.

Partial assertions passed: ordinary bytes/current identity, invalid/missing/type
refusal, existing writer/mapping with fresh mapped content, eight same/different
restored-time replacements after open/mid-read/after bytes/before binding.
The first hostile leaf-symlink setup failed **Win32 1314**, a required privilege
not held. Terminal exit **101**, **0 test functions passed / 1 failed / 0 ignored /
196 filtered**. Remaining native cases were not executed. Missing-capability stop
was honored: no retry, flag switch, security/privilege change or timing batch.

This is a capability gap, not proof of unsafe link acceptance or rejection of all
relative-I/O designs. There is no new verifier/whole-request latency or descriptor
peak evidence. Conservatively retained 162.344 ms other work leaves 67.656 ms at
the 230 ms engineering ceiling. Zero instrumented/uninstrumented/metadata sequences;
missing safety makes a cost rescue experiment ineligible. No full corrected
candidate, G1-O2, production-reader fix, changed contract/cadence/target, package
matrix, physical acceptance, merge, optional Git or Phase 2.

Next decision: separately selected read-only follow-up review of qualification
capability and retained composition before authorizing any new experiment.
Historical run 36278262505 attempt 1, local samples/state/logs and all preceding
ledgers remain under their real inputs. No operation is pending.

#### Publication gates and preservation audit

Compilation succeeded without repair. Formatting check passed with
cargo fmt --manifest-path app/Cargo.toml --all -- --check. The repository structural/
link/privacy validator passed for **266 files**; whitespace review caught one
documentation trailing blank line, which was removed before the final check.
No broader native suite was run after the stop condition.

All **52** pre-existing historical report/state/log files matched their pre-run
SHA-256 inventory. All **five** diagnostic source files matched the executed
input records. The historical worktree remained clean at the original candidate,
and terminal state plus process inspection found no native/build work pending.
Changed-path review covers only the five test-only source files and six documentation
files; production and quality workflow are unchanged. Existing negative-reproducer
bodies are byte-for-byte preserved in the diff; their execution was not repeated.
Raw logs/state and machine paths remain outside Git.

Use the existing repository-local noreply identity to publish this coherent
diagnostic/findings checkpoint on the existing branch/PR, then verify advertised
remote head and draft/open state. Resolve publication SHA from Git/PR, not a
receipt-only follow-up commit. Ordinary PR validation may run on publication; no
workflow_dispatch or package matrix was requested.

### 21. G1-RESET hobby-editor scope and acceptance — 2026-09-27

**Authority:** after the explanation of G1-O1-N's denied symlink test, the user
requested a proportionate local hobby-editor focus and approved executing the proposed
product/scope reset. This explicitly supersedes prior requirements for a continuously
fresh graph and the G1-O native-proof continuation.
**State:** product decision accepted; scope-reset checkpoint complete; implementation
pending **G1-OBS**. Final 1G acceptance remains incomplete.
Entry/code head 4f05e57fba66493afaa436b9ba0332210dcecf58, existing feature branch,
draft/open PR #17. Fresh Git refs matched entry and main
4d7ba0333c48d60242a9a42d3e079fea499a5531; no ownership conflict or active work found.

[ADR 0010](../../adr/0010-local-project-safety-and-observed-flow.md) owns the accepted
contract. Protect work against ordinary mistakes/external saves/interruption, preserve
Source authority and explicit execution, and make Branches a responsive last-observed
saved-state view. Retain basic path/link/IPC/privacy/download protections and existing
transaction/recovery mechanisms. Deliberate same-user namespace/reparse attack races
are outside initial hobby-editor acceptance.

#### Requirement disposition

| Prior requirement | Current disposition |
| --- | --- |
| Every display refresh hashes all sources after projection and rebinds every leaf | Retired for display; explicit disk refresh acquires current bounded content once |
| Native boundary proof, hostile symlink privilege and G1-O1/O2/O3 sequence | Retired continuation; preserve historical code/tests/results without resuming |
| G1-V1 <250 ms fully verified current-disk result; 230 ms verifier allocation; fixed source pass counts | Superseded by G1-U1/U2 observed-state behavior and distinct accepted-update/disk-refresh measurements |
| Source authority, ordinary conflicts, save/history/recovery, draft retention | Retained; graph/cache cannot authorize mutations |
| SDK/project execution consent, process control, bounded output and privacy | Retained; opening/refreshing runs no project code |
| Missing/unknown/partial labels, bounded full graph, session cancellation, focus/navigation | Retained and prioritized for normal authoring |
| Windows/macOS behavior, useful rendered UI and final user acceptance | Retained; no old failure relabelled or new pass inferred |

AGENTS, product/security, architecture/data/UI, testing, parent/1G/1H plans,
roadmap/index and live status now route to this decision. ADR 0009 and old review/
experiment documents have explicit historical/superseded notices. Their findings
and ledger 13–20 evidence remain intact. No production/test/workflow code changed.

#### Next implementation checkpoint — G1-OBS

1. In app/src-core/src/scene/flow.rs and its AuthoringService ownership, implement a
   bounded session-owned observed-input model, dependency/inventory status and
   accepted-mutation invalidation. Reuse the existing projector/source reconciliation;
   do not transplant the unqualified test-only native adapter. Capture source and
   consumed metadata/authoring/media dependencies at acquisition; uncertain app
   invalidation requests disk refresh rather than claiming an updated model.
2. Route observed-model requests versus explicit disk refresh through the existing
   typed flow.list service/IPC in app/src-core/src/lib.rs and lifecycle session owner,
   updating app/src/bridge.ts result/request types as needed. Keep one bounded owner,
   coalesce triggers and discard cancelled/old-session publication.
3. In app/src/branches-ui.ts and its main/controller callbacks, update after accepted
   edits, refresh on open/focus/button, remove mandatory periodic full scans, and show
   the ADR's simple statuses. Fix silent enabled clicks while loading and lost focus.
   Independently validate navigation targets; preserve drafts and explicit conflicts.
4. Update real-service fixtures in app/src-core/src/scene.rs, lifecycle IPC tests,
   and Branches DOM/rendered tests for G1-U1/U2/V2. Change the selected production
   workflow gate coherently with implementation; retain old diagnostic tests/evidence,
   classify specialist OS attacks separately and do not silently skip baseline
   containment, ordinary external-write/recovery or execution/privacy checks.
5. Run relevant local checks first; then the concrete supported-target qualification
   authorized for that checkpoint. Record three fixed successful cold/explicit-refresh/
   accepted-edit samples per target against ADR 0010's distinct limits, actual changed
   graph contents and rendered interaction evidence. No package matrix merely to
   explore timings. Publish findings/handover and stop before final package/integration.

The normal workflow acceptance examples are: create/open a project; edit a choice and
see its routes update; edit/replace/delete a source in another editor and Refresh;
preserve a dirty draft through navigation/conflict; save/undo/reopen without lost work;
recover an interrupted save; open/refresh without Python execution; Validate/Run only
by explicit action and Stop reliably. Keep the existing fixed graph/resource fixture.
There is no new native microbenchmark, kernel caching, watcher framework, transaction
rewrite, alternative renderer, SDK/runtime redesign or Phase 2 work in G1-OBS.

#### Scope-reset validation and publication

Repository structural/link/privacy validation passes for 267 files; whitespace and
documentation-only changed-path review qualify this publication. No Rust/UI/native
suite or performance experiment is appropriate to a documentation-only reset.
No CI dispatch, package run, setup, security change, merge or history rewrite occurred.
The existing historical checkout and local evidence remain preserved. Publish to the
existing branch/PR with repository-local noreply identity and verify remote head;
resolve publication SHA from Git/PR without a receipt-only commit.


### 22. G1-OBS observed Branches implementation — 2026-09-27

**Authority:** the user selected G1-OBS through the active goal/next-chat instruction.
**State:** `review_ready`; implementation, local and supported-target automated
qualification complete. Final evidence is below; earlier pending entries are historical.
This is not final 1G acceptance, packaging or integration.
**Entry:** clean `76ebadb2dd59506c7bc57c066e421fbfac17fd2a`, matching freshly fetched
feature branch and open draft [PR #17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
Main remains `4d7ba0333c48d60242a9a42d3e079fea499a5531`. Resolve publication head from
Git/PR; a later evidence amendment will name the implementation candidate.

#### Implementation and requirement evidence

| Requirement | Implementation / regression |
| --- | --- |
| Session-owned last observation | `AuthoringService.observed_flow` owns bounded source bytes/revisions, model and pending paths. All authoring/Source/history commits invalidate through `commit_observed`; streaming imports and explicit recovery discard uncertain cache state. Unregister clears it. No transaction precondition/recovery protocol changes. |
| Accepted edits and history | `flow_observed` reacquires changed sources and consumed metadata/media state, reuses unchanged source observations and reprojects. Real Scene create/delete/undo/redo and Source Save tests assert changed output; unsaved drafts do not appear. |
| Ordinary disk changes | Explicit refresh enumerates source inventory and hashes bounded current reads, including unchanged timestamps. It uses existing Source reconciliation for changed mapped files, retaining dirty conflicts. In-place/replacement edits, additions/deletions, metadata, authoring/media dependencies, missing files and malformed metadata have production-service coverage. |
| Observation provenance | Literal `flow.list` accepts only `sessionId` and optional boolean `refresh`; default returns observed inputs, true requests disk. `checked`/`savedEdits`/`incomplete`, last completed `checkedAt` and `fromCache` are separate from graph partiality. Hashes include consumed authoring/media state. |
| Responsive UI and target authority | Open shows observed data then checks disk for cached/saved-edit results. Focus/button triggers coalesce into one follow-up; no Branches timer. Enabled navigation uses existing captured revision/range checks without an all-project scan. Focused nodes/details/selectors, selection, pan and zoom survive valid redraws. Errors/incomplete scans retain the last usable graph with visible status. |
| Source/privacy/execution | Source draft/caret tests include external conflict during refresh; literal IPC rejects stale sessions/malformed refresh. Cancelled work cannot publish, closed authority cannot reuse cache, and observation cancellation tokens record zero process spawns. Existing Source/Scene write preconditions, runtime grant and process ownership remain independent. |
| Bounded inputs and historical disposition | Same 500 Scenes / 2,000 edges / 503 sources / 105,627 bytes. Existing source/traversal limits retained; no native adapter promoted. Historical G1-O tests and 17 timed transaction/lifecycle namespace substitutions are explicitly specialist/ignored. Baseline link/path refusal, ordinary writer races and real termination/recovery remain routine. |

The old fully verified display assertion is replaced together with production behavior,
not removed alone. The selected benchmark asserts the changed caption, all fixture
counts and successful observation provenance. Timing starts immediately after the
real transaction succeeds, before changed-path invalidation, includes history and
production observed projection, and ends on its core response. Transaction duration,
IPC and renderer timing are not included in that number. Disk timing starts before
request entry. There is no end-to-end latency claim.

#### Local Windows x64 evidence

Existing MSVC 14.50.35717 / SDK 10.0.26100.0 / Rust 1.90.0 release environment reused;
Node 24.19.0 and npm 11.9.0, locked frontend dependencies installed with scripts disabled.
No privilege, symlink capability, security, power or persistent toolchain setting changed.
Synthetic fixtures only; local raw logs/JSON/screenshot stay outside Git.

| Check | Result |
| --- | --- |
| Focused `cargo test -p loomlight-core --release --locked flow -- --skip flow_observed_budget --nocapture` | 11 passed before the additional dependency fixture; no failures. Source Save, draft/caret/conflict, history/reopen, lifecycle literal IPC and observed behavior included. |
| Additional `flow_observed_authoring` dependency fixture | 1 passed after correcting invalid fixture metadata; covers Character acceptance, import fallback, media removal, authoring metadata change and missing mapped source. |
| Broader core suite, release/locked | 171 reported passes, 26 ignored, 4 filtered; two official-SDK wrappers explicitly skipped because no archive was supplied (not SDK passes). Four filters were the separately timed fixture and three unsupported local symlink-capability tests. This run preceded the final lifecycle specialist classification; those previously passing tests are now explicitly historical. |
| Local baseline capability exclusions | `no_replace_promotion_refuses_empty_directory_and_symlink_destinations`, `recent_reparse_substitution_fails_closed_without_touching_target`, `managed_sdk_directory_reparse_fails_closed_without_touching_target`. Required in native CI; no silent capability skip added to code. |
| `npm run check` | 60 passed, zero failures/skips; includes queued refresh, cached-open refresh, enabled navigation during pending refresh, focus/pan retention, errors and old-session disposal. |
| `npm run test:source-browser` | Build passed; historical false re-dirty reproduced, corrected accepted-text Save remained clean, selection/Apply Both regression passed. |
| Chromium 153.0.8010.53 Branches | Full service-produced 500/2,000 workload: initial layout 82.4 ms; 30-sample pan/frame p95 3.6 ms while refresh deliberately pending; route editing, 640px resize and zero page errors passed. Synthetic DOM/browser evidence, not packaged IPC or native keyboard. Rendered screenshot reviewed. |
| Repository validation / whitespace | Validator passed for 268 repository files before final ledger amendment; rerun at publication. |

Three fixed local G1-U2 samples (milliseconds):

| Sample | Initial disk observation (<2,000) | Explicit disk refresh (<2,000) | Accepted observed update (<250) |
| --- | ---: | ---: | ---: |
| 1 | 242.9685 | 253.9133 | 41.2492 |
| 2 | 245.3859 | 246.0471 | 43.9419 |
| 3 | 250.3105 | 243.5073 | 44.7632 |

All three passed and asserted `Route A` in the changed 2,000-edge graph. Local files:
`logs/g1-obs-budget.log`, `logs/g1-obs-core.log`, `logs/g1-obs-flow.log`,
`logs/g1-obs-ui.log`, `logs/g1-obs-source-browser.log`,
`logs/g1-obs-branches-browser.log`, `reports/g1-obs-flow.json` and
`reports/g1-obs-branches.png` under the agent workspace (not repository artifacts).
An added authoring/media test initially changed a Character display name without its
matching authoritative declaration; metadata validation correctly refused it. The
fixture correction uses a valid preserved extension field for the external metadata
change. This was test-fixture diagnosis, not a relaxed metadata guard.

#### Supported-target qualification and stopping boundary

Changed inputs justify exactly one bounded `quality.yml` dispatch on the published
feature candidate: `phase1g_flow_profile=true`, `phase1g_candidate_proof=false`.
It runs ordinary core/UI tests, three fixed G1-U2 samples and rendered G1-V2 evidence
on Windows x64 and macOS ARM64. It includes the baseline capability cases excluded
locally. The production package workflow selects the same new benchmark/marker, but
no package matrix, official SDK download, native experiment, merge or next checkpoint
is selected here. Historical candidate proof remains separately selected with its
counterexample refusal intact; the G1-O1-N one-shot test is explicitly excluded.

Record exact run/attempt/candidate in HANDOVER after dispatch. Follow the repository's
manual-resume waiting rule if it is not terminal; do not claim qualification from
queue acceptance. Once results are collected, publish findings and this handover,
then stop at G1-OBS. Final 1G/R2 packaged WebView/runtime/diagnostic completion, final
human interaction acceptance and integration need separate checkpoint selection.


#### Publication and exact pending native operation

Published implementation candidate `1fab71e0e3b1ce18ee3cc5b22ab5940269a2ff88`;
remote feature and PR head equality verified, PR draft/open. Final local UI rerun
(`npm run check`) passed all 60 after adding successful-retry notice clearing.
The additional `flow_observed_authoring` test passed. Formatting, whitespace and
repository structural/link/privacy validation passed for 268 files at publication.

Dispatched exactly one bounded native qualification:
[36289951468](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36289951468),
attempt 1, exact candidate above, `phase1g_flow_profile=true`,
`phase1g_candidate_proof=false`. Jobs Windows **108538000239** and macOS ARM64
**108538000117** were verified in progress after checkout/restoring cache at
2026-09-27 02:56 UTC. The native result is pending, not passing. The separate PR
validator is independent; the dispatch intentionally skips its validator job.

Handover is `awaiting_ci`/manual resume with this exact operation, per AGENTS/WORKFLOW.
Do not dispatch a duplicate, resume the native experiment, package, merge, or advance
into R2. There is no task-created local process still running. G1-OBS cannot be
marked achieved until target artifacts and outcomes have been inspected and final
findings/handover published. Historical failures and raw evidence remain preserved.


#### First native artifact audit and bounded qualification correction

Run 36289951468 attempt 1 completed successfully on both jobs. Downloaded archives
were verified against GitHub SHA-256 digests, and all six extracted files per target
matched their archive bytes. Both JSON models contain 500 nodes / 2,000 edges with
completed check status and no stale/partial/over-limit flags. All three core budget
samples passed, ordinary core and 60 UI tests passed, and baseline path/link cases
excluded locally passed on their respective targets. Full results remain preserved.

The audit found the new bounded workflow omitted the existing production workflow's
explicit npm pin. Both jobs actually used Node 24.19.0, **npm 11.17.0**, Rust 1.90.0;
`npm ci` emitted EBADENGINE against the declared npm 11.9.0. These remain successful
runs under their actual toolchain, not pinned-toolchain qualification. Fix the workflow
to install npm 11.9.0 explicitly; no application/dependency version changes.

The macOS browser passed p95 at 59.8 ms but retained a single **1,058.6 ms** frame
sample. Windows initial layout was 1,689.2 ms, pan p95 16.1 ms. The frame timer includes
browser/runner scheduling; the existing log cannot attribute the outlier. Do not
claim every frame was below 100 ms or erase this evidence. The corrected browser
probe retains sample order and records synchronous dispatch separately, asserting
that enabled input is not blocked on the held refresh promise. Original p95/initial
assertions and full workload remain unchanged.

These concrete workflow/probe changes justify one bounded correction run of the same
Windows/macOS core-and-browser qualification. No package, SDK download, native
experiment, broad new performance program or automatic rerun of an unchanged candidate.
G1-OBS remains open until corrected target evidence and the final handover are verified.


First-run release core samples, in milliseconds (all original observations retained):

| Target / sample | Initial disk | Explicit refresh | Accepted update |
| --- | ---: | ---: | ---: |
| Windows 1 | 313.2204 | 280.8772 | 25.0612 |
| Windows 2 | 281.8536 | 303.8981 | 23.5526 |
| Windows 3 | 307.0926 | 295.3030 | 22.8658 |
| macOS 1 | 33.538833 | 33.412500 | 14.407333 |
| macOS 2 | 32.204166 | 37.270833 | 13.382833 |
| macOS 3 | 31.329375 | 32.480333 | 13.737500 |

Windows core reported 171 passed / 30 ignored / 1 filtered; macOS reported
176 / 33 / 1. Two official-SDK wrappers per target emitted skip markers within those
pass counts, so actual executed regular cases are 169 and 174 respectively. The
filtered budget fixture passed separately with three fixed samples. Each UI suite
passed all 60. Candidate-proof and dispatch-validator jobs/steps were intentionally
skipped. Windows Chromium 153.0.8010.53 initial/p95/max frame were
1,689.2 / 16.1 / 16.5 ms; macOS Chromium 152.0.7977.83 were
111.5 / 59.8 / 1,058.6 ms. Both held-refresh navigation/resize checks passed with no
page errors. Both screenshots were visually inspected.

Verified artifact archives for run 36289951468 attempt 1:

| Target | Artifact ID | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| Windows | 10921744612 | 175503 | `34ffe40e80045dcfe4ce46a777198f9720cb388df1f0cfe6aad2ab313c9953ae` |
| macOS | 10921644313 | 198024 | `4427646e43d534ac2bf89afedc4e8acb0c93bc51469d39778875e5216a5c0638` |

The bounded correction passed local JavaScript syntax, repository validation (268
files), whitespace checks and the unchanged full browser workload. Chromium
153.0.8010.53 recorded initial 64.9 ms, frame p95 3.7 ms, maximum synchronous input
0.2 ms, visible document, resize pass and no page errors. Core/application code and
locked dependencies are unchanged by this correction.


#### Corrected qualification dispatch and manual-resume handover

Published bounded correction `a6063080006769613733de20fcd82265bf96b632`; local,
remote branch and draft/open PR #17 head equality verified. Repository validator
passed for 268 files and whitespace checks passed. Exactly one corrected dispatch:
[36291545085](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36291545085),
attempt 1, this exact SHA, `phase1g_flow_profile=true`,
`phase1g_candidate_proof=false`. Initial identity check at 2026-09-27 03:29 UTC found
Windows **108542473937** and macOS **108542473845** in progress restoring caches.
The dispatch validator was intentionally skipped. No target success is claimed yet.

State is `awaiting_ci` / manual resume per AGENTS/WORKFLOW. Inspect this exact
operation and its artifacts next; no duplicate dispatch, model polling loop or
hypothetical automatic wake-up. No task-created local writer/watch process remains.
After evidence review, publish final G1-OBS findings/handover and stop. Packaging,
SDK/runtime/diagnostic final 1G work, native human acceptance and merge remain separate.


#### Corrected target results and G1-OBS completion audit

Run [36291545085](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36291545085),
**attempt 1**, completed **successfully** on exact corrected candidate
`a6063080006769613733de20fcd82265bf96b632`. Windows job **108542473937** and macOS
ARM64 job **108542473845** passed all selected steps. Full logs confirm Node
**24.19.0**, npm **11.9.0**, Rust **1.90.0**, release/locked core and locked npm install.
The candidate-proof step and dispatch-validator job were intentionally skipped.
No application, dependency or qualification input changed after this candidate;
subsequent commits only record status and evidence.

| Regression gate | Windows x64 | macOS ARM64 |
| --- | --- | --- |
| Regular core, reported | 171 passed / 30 ignored / 1 filtered | 176 passed / 33 ignored / 1 filtered |
| Actually executed regular cases | 169; two SDK wrappers emitted explicit skip markers | 174; two SDK wrappers emitted explicit skip markers |
| UI checks | 60 passed, zero failed/skipped | 60 passed, zero failed/skipped |
| Isolated G1-U2 fixture | Passed; three fixed samples | Passed; three fixed samples |
| Baseline path/link, ordinary writer/recovery | Passed; locally unavailable baseline capabilities exercised here | Passed |

The one filtered core case is the separately executed budget fixture. Ignored cases
retain specialist/history and subprocess-worker classifications; they are not passes.
Official-SDK wrappers are not SDK acceptance. Logs explicitly confirm real process
termination/recovery, competing writes, mapped-source reconciliation, Source Save and
stale-range/draft/caret behavior; existing runtime consent/ownership cases also passed.

Fixed real-service measurements in milliseconds, each against its own limit:

| Target / sample | Initial disk (<2,000) | Explicit refresh (<2,000) | Accepted update (<250) |
| --- | ---: | ---: | ---: |
| Windows 1 | 381.5482 | 393.8655 | 30.7608 |
| Windows 2 | 388.7512 | 393.2107 | 30.0870 |
| Windows 3 | 371.0597 | 392.6911 | 30.0521 |
| macOS 1 | 33.696750 | 33.880042 | 20.142959 |
| macOS 2 | 41.859750 | 56.836084 | 14.596792 |
| macOS 3 | 33.882167 | 32.072000 | 14.606541 |

The test was inspected at the candidate: real `build_command` / `commit_history`,
acceptance timestamp before invalidation, production `flow_observed`, changed
`Route A`, 2,000 edges and `savedEdits` are asserted. Disk results assert completed
`checked` provenance; original inventory is 503 files / 105,627 bytes. Core response
timers do not measure transaction duration, IPC or rendering.

| Browser evidence | Windows | macOS |
| --- | ---: | ---: |
| Chromium version | 153.0.8010.53 | 152.0.7977.83 |
| Full 500-node / 2,000-edge initial layout, ms | 722.2 | 112.2 |
| 30-frame pan p95, ms (<100) | 15.6 | 94.2 |
| Maximum frame, ms | 16.5 | 126.0 |
| Maximum synchronous input dispatch, ms | 0.1 | 0.7 |
| Held-refresh navigation / 640px resize / page errors | Pass / pass / none | Pass / pass / none |

Both documents were visible. Pan, selection and enabled route editing completed
while refresh was deliberately unresolved. Ordered frame and dispatch samples are
retained in full. macOS p95 passed with limited margin and one 126 ms frame; the first
run's 1,058.6 ms frame also remains a finding. No claim that all frames are below
100 ms, that scheduling caused an outlier, or that these are native WebView/keyboard
measurements. The probe verifies that input does not wait on the refresh promise;
final packaged/human interaction remains separately required. No further rerun or
performance tuning was used to hide variation.

Both screenshots were visually reviewed: readable graph, controls, selected Scene,
route and checked-time status. They intentionally show a five-node subview after the
full-workload assertions; they are not screenshots of all 500 nodes.

Verified corrected-run artifact archives:

| Target | Artifact ID | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| Windows | 10923095066 | 175641 | `2b4a9bc0d7f05b111ce744edba9124326142c367dc0b337df50f26e02a8ed5a9` |
| macOS | 10922173317 | 197800 | `2fdb7ff468abaabb89fbb83028ecfbb974a4bd90a080851de8ba75d107a44156` |

API metadata binds both archives to the candidate/run. Downloaded SHA-256 matched
GitHub digests; all six files per target matched archive bytes. Both JSON graphs
contain 500 nodes, 2,000 edges, `checked`/non-cache observations and false
partial/stale/over-limit flags. Full run log, JSON metadata, archives, six extracted
files per target and verification manifest remain under workspace
`reports/g1-obs-ci-36291545085` outside Git. Earlier evidence remains preserved.

Completion audit against the five selected implementation steps in section 21:

| Required deliverable | Evidence and disposition |
| --- | --- |
| 1. Bounded session cache/dependencies and accepted invalidation | Production service/cache ownership and `commit_observed` reviewed; observed lifecycle, history and dependency tests pass on both targets. Complete. |
| 2. Typed observed/disk IPC, session cancellation | Literal IPC tests reject malformed/stale requests; cancelled/session cache tests pass; no new display authority. Complete. |
| 3. Open/focus/button refresh, status, useful navigation | DOM regressions cover coalescing, cached open, focus/pan, incomplete/error retention and disposal; rendered held-refresh navigation passes; Source draft/caret/range regressions pass. Complete. |
| 4. Real fixtures, routine protection and coherent workflow selectors | Benchmark/renderer assertions inspected; production selectors and specialist dispositions updated; ordinary path, competing-write and interrupted-save cases passed. Complete. |
| 5. Local then supported-target evidence, findings and handover | Local checks and exact target results above, artifact hashes/screenshots reviewed; final CURRENT/HANDOVER published on the existing branch/PR. Complete upon publication verification. |

**Outcome:** G1-OBS implementation and automated qualification are complete and
`review_ready`. User acceptance of the overall product is not inferred. This Phase 1G
ledger remains active because R2/final packaging/runtime/diagnostic completion,
native-keyboard/human acceptance and integration remain open. ADR 0010 and canonical
architecture/data/UI/testing documents retain the behavior and durable lessons.
Next selection is a bounded review/planning pass for remaining 1G.2b; no next
implementation, package run, SDK download or merge is authorized by this handover.
No CI or task-created local writer/watch process remains outstanding.


### 23. R2-P1 packaged proof correction and qualification — 2026-09-27

**Authority:** after a read-only review, the user accepted the tightened proposal:
correct only the packaged proof, run one existing supported-target production matrix,
audit/publish the results and stop. Application defects require a new bounded decision
before production changes. No performance tuning, CI redesign, merge-conflict work,
new native automation, human testing or merge is selected.
**State:** `blocked`; completed-run assessment below, no operation pending. Entry `d180f0bb4840fa57e9144a94b3d9987a408a2ebb`, clean and
matching the fetched feature branch and draft/open PR #17. Main is `4d7ba03`;
GitHub reports a PR conflict, left for later integration. No production run was active at entry.
G1-OBS qualification and the earlier failed production runs remain preserved.

#### Selected scenarios and gate plan

Implementing agent owns these corrections in the existing `runtime_ui_probe.js`.
Both route cases use real packaged WebView controls, IPC/services and the pinned SDK,
with synthetic DOM input; they do not claim native keyboard or human acceptance.

| Scenario | Required observation | Command / evidence |
| --- | --- | --- |
| R2-P1-duration | Start measurement after selected route output and Running state are observed; remain running for at least 9.5 seconds thereafter, record measured duration, then Stop/cleanup | Existing `run-runtime-ui-probes.py` route-a/route-b; each case JSON/log |
| R2-P1-graph-reopen | Assert exactly two expected choice edges, persist the changed destination, close/reopen into a new session, verify exact accepted source text/revision and refreshed graph before restoring the authored routes | Same two packaged cases and their stage records |
| R2-P1-qualification | One coherent candidate, Windows x64/macOS ARM64: retained G1 budgets, explicit SDK/R1/diagnostic gates, all five packaged cases, legacy boundary/regression gates | Existing `production-scaffold.yml`; exact run/attempt/SHA, input/executable hashes, logs and per-case cleanup |

The core SDK test already waits nine seconds after game activity. This correction
closes a packaged-probe evidence gap; it does not diagnose a runtime product defect.
Cheap gates first: probe JavaScript syntax, repository validation, whitespace, existing
frontend checks/build. No Rust production code changes are selected; full core/SDK/
desktop tests and package checks run through the existing production workflow.
Optional package uploads preserve the tested binaries; missing uploads are an artifact
availability issue, not an extra product acceptance gate. No workflow changes.
One dispatch only after local gates/review and publication. If it fails, preserve and
report the finding; no automatic replacement matrix or production fix is authorized.
If still running at handoff, record the exact operation and use manual resume under
AGENTS/WORKFLOW. This checkpoint does not close final human acceptance or integration.


#### Implemented proof and local checks

Changes are confined to the existing packaged JavaScript probe and its testing/status
records. Both route cases assert two resolved choice edges, read the accepted source,
verify both changed jump destinations, close/reopen to a different session, and compare
exact source text plus byte revision and refreshed graph before restoring the routes.
The mutable captured session is updated only after proving the reopened entry Scene.
The play timer begins after the selected route oracle and Running state; it records
`runningObservedMs >= 9500` before Stop. Preparation/trust no longer counts as play.
The existing cleanup, runtime-error, draft-refusal and post-Stop Source checks remain.

| Local check | Result and scope |
| --- | --- |
| `node --check app/src-tauri/src/runtime_ui_probe.js` | Passed; syntax only, not packaged execution |
| `python scripts/validate.py` | Passed, 268 repository files |
| `git diff --check` | Passed |
| Existing frontend typecheck / test build / Node tests | 60 passed, zero failed/cancelled/skipped |
| Existing production frontend TypeScript / Vite build | Passed; 21 modules |

Local environment: Windows x64, Node 24.19.0; existing installed dependencies were
used without installation. `npm` was unavailable on PATH, so its unchanged scripts
were executed directly from `app/`: `node node_modules/typescript/bin/tsc -p
tsconfig.json --noEmit`, `node node_modules/typescript/bin/tsc -p tsconfig.tests.json`,
`node --test --test-concurrency=1 dist-tests/tests/*.test.js`, then
`node node_modules/typescript/bin/tsc -p tsconfig.json` and
`node node_modules/vite/bin/vite.js build`. The first validator invocation could not
find Python inside the read-only sandbox; it passed through the approved host command.
No local Rust/core/SDK/package pass is claimed for these probe changes. The new route
assertions require the selected production matrix. No production Rust/TypeScript,
dependency, workflow, permission or product contract changed.

Self-review checked the literal request fields against current Flow/Source serialization,
new-session ownership, fixture jump text and Running status, as well as exact changed-path
scope. No application defect was identified locally. Next: publish this candidate and
dispatch the existing production workflow once with optional package retention enabled.


#### Published candidate and exact qualification handoff

Published candidate `f1a0f148445f34f8af1a57d0f69e2d27eb543b11`; local branch,
remote ref and draft/open PR #17 head equality verified before dispatch. The immediate
post-push PR API response briefly retained the old head; a subsequent read confirmed
the candidate. No force push or integration occurred.

Dispatched exactly once: [36293797731](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36293797731),
**attempt 1**, `production-scaffold.yml`, exact candidate above, `upload_packages=true`.
Direct run lookup confirmed `in_progress`. Preflight job **108548761361** was running
Rust formatting after repository validation, pinned Node/npm setup, frontend checks
and Source browser regression passed (observed 2026-09-27 around 04:16 UTC).
Windows/macOS target jobs were not yet present in that response. Initial workflow-list
indexing lagged the returned dispatch URL; the exact returned run was read directly,
not redispatched. There is no final target, SDK, package or new-probe pass yet.

This is `awaiting_ci` / manual resume under AGENTS/WORKFLOW. No qualified automatic
same-thread continuation is available and no watcher/local writer is left running.
Next, inspect this exact run/attempt/SHA, retrieve all target logs/artifacts and verify
input/executable/archive hashes, all five case outcomes and cleanup. Require each route's
`branches-destination-reopen-passed` and `long-run-duration-passed` with measured
`runningObservedMs >= 9500`; retain every failed/skipped/unavailable gate honestly.
Audit the existing full G1/R1/R2 matrix at its actual layers. Preserve G1-OBS's browser
outliers and all historical failures. No duplicate dispatch, automatic retry, new
production fix, human testing, merge-conflict resolution or merge is selected. Report
any application finding and seek a bounded decision before changing production code.
Publish the final evidence assessment and CURRENT/HANDOVER, then stop at R2-P1.


#### Completed-run assessment and artifact audit — 2026-09-27

**Authority:** user selected assessment of run 36293797731 attempt 1, artifact
verification and publication only; explicitly no redispatch, production-code change
or merge. Entry `9a4b62de88c4f355d2e834e30fc0f496ce29e84b` was clean and matched
fetched remote/PR head. PR #17 remains draft/open and conflicting; main unchanged.
Only documentation changed in this assessment. No tests, SDK execution, package
launch or workflow dispatch was performed; repository validation is recorded below.

**Terminal result: FAIL**, exact candidate
`f1a0f148445f34f8af1a57d0f69e2d27eb543b11`, tree
`0ceb10f9530a1e28ce436e88f9fdcf50186c3f3a`, attempt 1.
Preflight **108548761361** passed; macOS ARM64 **108548848384** failed at rendered
Branches budgets; Windows x64 **108548848419** failed at packaged Runtime UI scenarios.
The last target job completed 2026-09-27 04:32:03 UTC; the run is terminal, no longer awaiting CI.
Later branch commits contain status/evidence only; application/workflow input equality
with the tested candidate was checked. Full logs confirm Node 24.19.0, npm 11.9.0,
Rust/Cargo 1.90.0 on both targets. Windows manifest reports Python 3.12.10.

Artifact API identity binds both archives to this candidate and run. Archive byte
lengths/SHA-256 matched GitHub; ZIP CRC checks and all 29 extracted-file byte comparisons
passed (7 macOS, 22 Windows). Windows `runtime-ui-inputs.json` includes exactly the
101 tracked app/production-workflow inputs at the candidate; every hash was compared
to its Git blob, with matching candidate/tree/run/attempt. No input mismatch exists.

| Target / artifact ID | Archive bytes | Verified SHA-256 |
| --- | ---: | --- |
| macOS / 10923840024 | 224142 | `82580f0178840ebc413767622ef7bdd7076de05f2bdcc95dfe756f826940961b` |
| Windows / 10923338259 | 179610 | `09bcb566b6fba400cc8f82969504ed865ea9ab94182ba50b70209ddeee248568` |

Windows recorded executable SHA-256
`3b8bb4cb41df99ff0bb6d9998ff1126ccedc71e0ddf68d23825c3692d494d6aa`.
It cannot be independently rehashed: conditional package upload was skipped after
failure, and neither archive contains an executable. Windows MSI/NSIS build passed;
that does not establish usable packaged behavior. macOS never reached package build
or the input/executable manifest. Missing package artifacts are an availability limit;
the substantive failed gates independently prevent acceptance.

Raw run/API records, original archives, verified extracted files, hash manifest and
computed assessment are preserved outside Git under workspace
`reports/r2-p1-ci-36293797731`. Four Runtime UI screenshots (1100/640 widths, both
OSes) were visually inspected: readable wrapped controls and diagnostics. They are
injected-requester Chromium screenshots, not images of successful packaged scenarios.

| Gate / actual layer | Windows x64 | macOS ARM64 |
| --- | --- | --- |
| Preflight frontend / repository / formatting | Shared preflight PASS: 60 tests, no failures/skips, Source browser regression and formatting | Same preflight |
| Full core release/locked | 172 reported passes, 30 ignored; two no-SDK wrapper skips within pass count, so 170 executed cases | 177 reported passes, 33 ignored; two wrapper skips, so 175 executed cases |
| Isolated G1-U2 | PASS, all three fixed samples | PASS, all three fixed samples |
| Runtime browser focus/resize | PASS, 1100/640, no overflow/page errors | PASS, same coverage |
| Branches browser G1-V2 | PASS: p95 15.6 ms | FAIL: p95 109.9 ms exceeds 100 ms |
| Explicit lifecycle/SDK handoff | PASS: actual official-SDK wrapper gates run after archive restore | SKIPPED after G1-V2 failure |
| Explicit R1 service / real compile-lint diagnostics | PASS: one service test and one diagnostics test; both compile/lint markers present | SKIPPED |
| Desktop Rust / package build | PASS: one boundary test, MSI/NSIS build | SKIPPED |
| Five real-service packaged cases | FAIL: all five exit with stack overflow; no report/cleanup proof | SKIPPED |
| Legacy packaged boundary, secret scan, dependency inventory | SKIPPED after packaged failure | SKIPPED |
| Optional package upload | SKIPPED, binary unavailable | SKIPPED, package not built |

The full core includes the budget fixture once without enforced sample repetition;
three enforced samples run separately. Ignored specialist/worker/explicit-SDK tests
are not passes. Windows's two regular-suite SDK skip markers are superseded only by
its separate explicit successful SDK executions; macOS has no such final-candidate
execution. Earlier R1 closure remains tied to its original candidate.

All fixed G1-U2 samples (milliseconds):

| Target / sample | Initial (<2,000) | Explicit refresh (<2,000) | Accepted update (<250) |
| --- | ---: | ---: | ---: |
| Windows 1 | 394.2694 | 409.3750 | 29.8679 |
| Windows 2 | 386.5103 | 376.7609 | 29.7351 |
| Windows 3 | 377.2339 | 384.5417 | 29.1834 |
| macOS 1 | 40.592750 | 42.867375 | 15.673708 |
| macOS 2 | 40.393292 | 35.308125 | 16.685291 |
| macOS 3 | 44.646083 | 38.046917 | 22.130584 |

Both JSON graphs have 500 nodes/2,000 edges, completed `checked`/non-cache status
and false partial/stale/over-limit flags. Browser p95 was recalculated from each
ordered 30-frame sample set. Windows Chromium 153.0.8010.53 initial/p95/max frame:
158.0 / 15.6 / 15.6 ms; maximum synchronous dispatch 0.2 ms. macOS Chromium
152.0.7977.83: 91.9 / 109.9 / 860.3 ms; maximum synchronous dispatch 0.3 ms.
Both documents were visible; held-refresh navigation, 640px resize and no-page-error
assertions completed before the budget assertion. All ordered samples remain retained.

**Finding R2-P1-WIN: packaged startup stack overflow.** Every Windows case log contains
`thread 'main' has overflowed its stack`. Each process exited with code **3221225725**,
no timeout and an empty report list. Elapsed seconds: compile **0.047**, lint **0.015**,
route-a **0.032**, route-b **0.015**, runtime-error **0.031**. No stage or cleanup report
was emitted; cleanup cannot be certified. Neither `branches-destination-reopen-passed`
nor `long-run-duration-passed` was reached in reported evidence. The five attempts
were independent cases within the one matrix, not retries. The evidence does not
locate the overflowing call or establish whether normal non-probe launch is affected;
no SDK, probe, Tauri or application root cause is claimed.

**Finding R2-P1-MAC: rendered budget failure.** The 109.9 ms p95 is a real failure of
the selected <100 ms gate; the 860.3 ms maximum is preserved. Short synchronous input
dispatch does not negate a frame-latency failure. The current evidence cannot attribute
it to renderer work, browser or runner scheduling. Earlier G1-OBS passing measurements
and its 126 ms/1,058.6 ms outliers remain unchanged; none substitutes for this failed
final-candidate run. No threshold relaxation, rerun or performance correction occurred.

**Disposition:** R2-P1 is `blocked`, not review-ready or accepted. Proof corrections
are implemented but their packaged assertions are unqualified. Final G1 is blocked
by macOS G1-V2 and missing final packaged interaction; final-source R1 is incomplete
on macOS; R2 is failed/unqualified on Windows and skipped on macOS. Human acceptance
and integration remain separate. The run is terminal; no CI or local writer/watch
process remains outstanding. Assessment/publication can complete without claiming
that the capability checkpoint passed.

**Proposed next selection, not authorization:** one bounded Windows packaged-startup
investigation to identify the overflow location and determine probe versus ordinary
launch impact, then propose the smallest evidenced correction. Keep the macOS budget
failure recorded for a separately selected diagnosis/decision. No new matrix, production
fix, native experiment, privilege change, human test or merge is authorized here.


Publication checks for this assessment: repository structural/link/privacy validation
passed for 268 files; whitespace passed. Changed paths are limited to this ledger,
CURRENT and the existing HANDOVER. Application and workflow inputs remain identical
to the tested candidate. Commit/push publication is verified against the remote ref;
no receipt-only commit is required to record its own SHA.

### 24. R2-P1-WIN-D1 local startup diagnosis — 2026-09-27

**Authority:** following a review-only plan, the user said "go ahead" to a bounded
local Windows investigation. Limit: 90 minutes active work, one baseline build,
one diagnostic build and four application launches. Compare ordinary/probe startup,
locate the overflow and propose the smallest supported correction; no production fix,
CI dispatch, macOS diagnosis, native automation, conflict resolution or merge.
The accepted plan explicitly stops if necessary tools are unavailable.

**Entry:** clean `feature/phase-1g-branches-runtime` at
`5773eb920e1dad3c9a3b1bca6b904240e897f040`. Fetch and PR inspection confirmed the
same published head, with PR #17 still draft/open/conflicting. Compared with tested
candidate `f1a0f148445f34f8af1a57d0f69e2d27eb543b11`, only the three existing
status/ledger documents differ. No historical checkout or branch reset was needed.
Application/workflow inputs remain unchanged during this checkpoint.

**Environment result:** the existing workspace environment script initially failed
to expose MSVC in the sandbox. Repeating environment discovery with approved
outside-sandbox access confirmed Rust/Cargo 1.90.0 (x86_64-pc-windows-msvc), MSVC
14.50.35717 and Windows SDK 10.0.26100.0. Compiler, linker and dumpbin are available.
CDB, WinDbg and LLDB were absent from the prepared PATH; standard Windows SDK/LLVM
debugger locations and the WinDbg Store-package glob returned no installed debugger.
The Windows SDK directory has no Debuggers subdirectory. Visual Studio remote
debugger components exist, but no usable local crash-debugging frontend was found;
no service was started or alternative automation implemented. No pinned Ren'Py SDK
archive or Loomlight executable/PDB was found in the workspace cache/download/temp
inventory. The original CI executable remains unavailable as recorded in ledger 23.
These are scoped discovery results, not an exhaustive search of private user storage.

Raw environment/tool paths, Rust version, archive inventory and zero-launch counters
are retained outside Git at workspace `reports/r2-p1-win-d1/environment.json`.
No Loomlight process was present at discovery. No task-created writer/watch process
or CI operation remains outstanding.

**Static review, not diagnosis:** native `main` constructs the Tauri builder, with
the single-instance plugin before setup. Setup selects either ordinary
`LifecycleService::new` or `prepare_runtime_ui_probe`, constructs `ApplicationHost`,
then creates the main WebView. Probe JavaScript evaluation is scheduled after a
two-second sleep, while prior CI exits occurred in 15–47 ms. This prioritizes native
startup in a future trace; it does not establish the failing function, exclude a
shared startup failure, or prove that ordinary launch works. Recursion, large native
stack frames and dependency initialization remain untested hypotheses.

**Disposition: blocked at the agreed unavailable-tools stop condition.** Zero
baseline builds, zero diagnostic builds and zero application launches; no SDK
execution, tool installation, dependency change or production modification. No native
stack, normal/probe comparison or correction was obtained. R2-P1 remains blocked;
all previous failures and unqualified gates stand. The macOS budget finding is separate.

**Next bounded selection:** provide/authorize a usable Windows crash debugger and
the official checksum-verified pinned Ren'Py archive, or select an already equipped
Windows host. Then resume the same candidate comparison with disposable app data,
no pre-existing instance, captured exception/stack and recorded cleanup. Any rebuild
must be labelled diagnostic evidence, not the missing original CI binary. Retain
the one-baseline/one-diagnostic/four-launch caps and stop with a correction proposal;
installation, CI fallback, fixes and qualification require their own explicit scope.

Publication gates for the documentation-only checkpoint: repository structural/link/
privacy validation and whitespace check. The diagnosis chat was interrupted before
publication; its notes are preserved and validated with the prerequisite setup in
ledger 25.

### 25. R2-P1-WIN-TOOLS local debugger and SDK prerequisites — 2026-09-27

**Authority and boundary:** the user requested the local repository be updated with
"debuggedr tools and sdk". This selects prerequisite setup only and supersedes the
prior no-installation boundary for these tools. Prepare an official Windows crash
debugger and the pinned checksum-verified Ren'Py SDK; verify usability and document
how the next diagnosis can find them. No production change, application build/launch,
CI dispatch, expanded investigation or merge belongs to this setup checkpoint.

**Entry:** `5773eb920e1dad3c9a3b1bca6b904240e897f040`, matching fetched branch/PR
head; PR #17 remains draft/open/conflicting. The interrupted diagnosis chat was idle;
its uncommitted ledger 24 and status notes are preserved and carried forward.
The original failed CI binary is still unavailable. Tool setup does not replace
R2-P1 qualification or locate the overflow. Setup state: `review_ready`.


**Prepared tools:** used Microsoft's official Windows SDK 10.0.26100.9169
[download entry](https://learn.microsoft.com/en-us/windows/apps/windows-sdk/downloads)
and [debugger component guidance](https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/debugger-download-tools).
The installer source is `https://go.microsoft.com/fwlink/?linkid=2376216`.
Downloaded only `OptionId.WindowsDesktopDebuggers` via installer `/layout`, then
administratively extracted `X64 Debuggers And Tools-x64_en-us.msi` using `msiexec /a`
with `/qn /norestart` and a workspace target. Both operations exited 0. No full SDK
upgrade, system-wide debugger registration, persistent PATH change or reboot.
Installer, selected MSI, CDB, WinDbg, dbgeng and dbghelp Authenticode signatures were
valid Microsoft signatures. CDB reports **10.0.26100.9169**, AMD64. WinDbg is present
and signed; interactive GUI operation was not tested.

All paths below are relative to the local workspace root, the parent of `repo`:

- Debugger: `.tools/windows-debuggers-26100.9169/Windows Kits/10/Debuggers/x64/cdb.exe`
  (WinDbg and its engine are adjacent).
- Pinned archive: `.downloads/renpy-8.5.3-sdk.tar.bz2`, **153,611,590 bytes**.
- Extracted SDK: `.tools/renpy/renpy-8.5.3-sdk`.
- Environment: `enter-debug.ps1`; dot-source `. ./enter-debug.ps1` in a fresh
  workspace-root PowerShell. It reuses `enter-local.ps1` for Rust/MSVC, exposes CDB/
  WinDbg and both `LOOMLIGHT_RUNTIME_SDK_ARCHIVE` / `LOOMLIGHT_PHASE1C_SDK_ARCHIVE`,
  and sets `RENPY_SDK_DIR`. Build output is `.cache/target-r2-p1-win-d1`, isolated from
  the historical comparison. Symbols use `.cache/symbols` and Microsoft's symbol
  server. During diagnosis, add the rebuilt executable's matching PDB directory.
  No build or application launch is embedded in the environment script.
- Evidence: `reports/r2-p1-win-tools/verification.json`, installer/extraction logs,
  initial/corrected CDB smoke logs and `renpy-version.txt`; downloads, extracted
  binaries, local script and machine-specific paths stay outside Git.

**SDK verification:** downloaded the exact archive from the repository's official
URL. SHA-256 **eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45**
matches both `app/src-core/src/renpy.rs` and the
[published checksums](https://www.renpy.org/dl/8.5.3/checksums.txt).
The archive contains 3,529 entries, no links, and the Windows x64 launcher. Python
`tarfile` with its `data` filter extracted it beneath `.tools`; the SDK
Windows interpreter invoked with `renpy.py --version` exited 0 and reported
**Ren'Py 8.5.3.26051504**. No project/game was executed.

**Self-review and verification:** CDB launched a disposable `cmd.exe`, stopped at
its initial breakpoint, emitted the smoke marker and native stack, and quit with
exit 0. The first smoke exposed a missing local symbol-cache directory; created it
and repeated that check successfully, preserving both logs. The smoke used exported
symbols and does not establish application PDB resolution or the crash's location.
A PowerShell package-inspection variable collision was corrected before extraction;
it caused no installation change. The environment script passed PowerShell parsing
and fresh-shell execution, resolving CDB, WinDbg, Rust/Cargo 1.90.0, MSVC tools and
the verified archive. Existing MSVC 14.50.35717 and SDK 10.0.26100.0 are retained.
No task-created tool/download/SDK/Loomlight process remained after verification.

**Disposition:** prerequisites are ready for the user's next selection. No Loomlight
build/launch, production change, CI dispatch or merge occurred; diagnosis counters
remain 0/1 baseline, 0/1 diagnostic and 0/4 launches. The interrupted ledger 24 notes
are preserved in this publication. R2-P1 is still blocked, the original CI binary
is unavailable, and macOS frame failure remains separate. Resume only the same
bounded Windows comparison, account for earlier active investigation time and stop
with an evidenced correction proposal. Setup does not approve a production fix.

Publication checks: repository structural/link/privacy validation passed for 268
files; whitespace passed. The reviewed Git diff contains only CURRENT, HANDOVER and
this ledger, including the preserved interrupted diagnosis record. Application and
workflow trees are unchanged from the tested candidate. Tool binaries and local
setup evidence remain outside the repository. No production matrix was dispatched.

### 26. R2-P1-WIN-D1 resumed local startup diagnosis — 2026-09-27

**Authority/state:** the user selected resumption using prepared tools, within the
existing limits; diagnosis `review_ready`, correction unapproved. No production fix, redispatch or merge. Additional
tools require demonstrated necessity and explicit installation approval first.
After diagnosis, the user allowed four additional build runs if needed. All four
remain unused; no further build was necessary. The four-launch cap and production
fix approval boundary remain unchanged.
Entry is clean `cc93b90b3acc04acbe9f6f44cd05d928da794313`, matching fetched remote
and draft/open/conflicting PR #17. Application/workflow inputs match `f1a0f14`.
The interrupted investigation turn lasted 537,904 ms; charge a conservative nine
minutes against the original 90-minute active budget (81 minutes remain at resume).
Build/launch counters enter at 0/1 baseline, 0/1 diagnostic and 0/4 launches.
The original CI executable is unavailable; local rebuilds are diagnostic evidence.

**Environment/build identity:** Windows 11 build 26200, Rust/Cargo 1.90.0 x64 MSVC,
MSVC 14.50.35717, Windows SDK 10.0.26100.0, Node 24.19.0, CDB 10.0.26100.9169;
the prepared Ren'Py 8.5.3 archive was rehashed by `enter-debug.ps1`. No additional
tool was installed or requested. The first shell command used a wrong setup-script
relative path and never started Cargo. The first offline Cargo invocation stopped
at missing `adler2` before compilation. `cargo fetch --locked --target
x86_64-pc-windows-msvc` populated the existing workspace dependency cache; lockfiles
and dependency versions stayed unchanged. These failures remain in the local record.
One baseline compilation then passed in 2m46s, and one diagnostic compilation with
`CARGO_PROFILE_RELEASE_DEBUG=2` passed in 2m51s. Both used:

```text
cargo build --release --locked --offline -p loomlight-desktop --features tauri/custom-protocol
```

The existing TypeScript and Vite executables built the frontend directly through
Node (npm was absent from this shell). Installers were not built. Production source
was unchanged; a build-time `TAURI_CONFIG` override selected the unique disposable
identifier `app.loomlight.r2p1wind1`. Its Roaming data directory started absent and
was created empty. Self-review found that the attempted absolute `dataDirectory`
override is ignored by Tauri's config path handling; WebView instead used the new
identifier's separate Local `EBWebView` profile, verified on disk. The ordinary
product identifier/data was not used. Preserve this configuration difference when
interpreting the local results. Temporary probe roots are under each launch's
disposable TEMP directory. No pre-existing Loomlight instance was present at launch.

All **101** tracked app/workflow inputs match the tested Git candidate after accounting
for **13 CRLF/LF-only working-tree differences**; raw hashes and those exact paths
are retained. The initial raw-hash mismatch report is preserved beside the corrected
assessment. This is source equivalence with stated local differences, not exact
CI-binary identity. Both executables have PE stack reserve `0x100000` (1,048,576 bytes)
and commit `0x1000` (4,096 bytes); stack settings were never increased.

| Local build | Executable SHA-256 | PDB SHA-256 |
| --- | --- | --- |
| Baseline, 13,668,864 bytes | `0c1b976dcc115b92d31d05f090c299c63c661cb941a6fe098c3a96a8c76dd7a5` | `e3f814ffd9ced05214e0a3130be9b49b6340650fa3644a3abd33338d81e32deb` |
| Diagnostic, 13,716,480 bytes | `6d5b595d9d0e4588cf41b63de8242cc9c539c057654f509424a221725f6eaf56` | `0c4db0c5e716e6a3d73f2f5089265b5c6bc0c7b832358f9d3f480e8ba6eb867c` |

**Four launches, no more remaining:**

| Launch | Observation | Exit/cleanup and limit |
| --- | --- | --- |
| 1: baseline ordinary, smoke/probe variables cleared | Survived 15 seconds; nonzero main-window handle, title Loomlight, OS `Responding=true`; empty console | Observation ended deliberately; task-owned process tree terminated successfully (16.168 s including observation/cleanup). Forced exit 1 is not a startup failure or graceful-close pass. No native UI interaction or human acceptance. |
| 2: same baseline, `compile` under CDB | First- and second-chance `0xc00000fd`; `__chkstk`, SDK archive verification, `rax=0x1001a8` | Initial dump command failed because backslashes were interpreted inside CDB's quoted event command. Missing second-chance continuation left it stopped; bounded 90 s controller terminated its tree successfully (91.019 s including cleanup). Stack remains valid; no dump or natural exit-code claim for this launch. |
| 3: saved same baseline, `compile` without debugger | `thread 'main' has overflowed its stack`; no scenario report | Natural exit **3221225725**, 0.695 s. Recovers the undebugged exit evidence missing in launch 2; local elapsed time is not comparable with CI timing. |
| 4: symbol-enabled diagnostic, `compile` under corrected CDB capture | Same exception and stack-frame request; exact private function and source resolved; dump successfully written | Terminal controller code 3221225725, 1.188 s; no timeout. Probe still fails; no scenario or SDK execution pass. |

**Located cause:** the full-symbol stack is `__chkstk` →
`loomlight_core::renpy::sha256_file+0x16` → `install_verified_archive` →
`install_supported_sdk_from_archive` → `LifecycleService::prepare_runtime_ui_probe`
→ the Tauri setup closure. The function at `app/src-core/src/renpy.rs:1351` contains
`let mut buffer = [0_u8; 1024 * 1024]` at line 1354. Its machine-code prologue loads
`eax=0x1001a8` (**1,049,000 bytes**) and calls `__chkstk` before subtracting the frame
from RSP. That frame alone exceeds the executable's whole main-thread stack reserve,
before caller usage. The captured fault is its guard-page probe, not recursive calls.
Archive verification invokes it at line 1083, before archive extraction or WebView
probe injection. This explains the locally reproduced early compile-probe failure
and is consistent with CI's five failures; no original-CI dump exists to prove all
five exact native stacks independently.

Ordinary startup with an empty isolated profile reaches a responsive window. This
does not prove all normal SDK operations safe: the same hashing function serves
archive installation and launcher fingerprints. `hash_regular_tree` also has a 1 MiB
stack buffer at line 1481, reached through template fingerprinting. That sibling
hazard is source evidence, not a second observed crash; its separate optimized symbol
did not resolve in the initial offline review. Do not report it as a captured frame.

**Self-review/corrections:** retained the setup/dependency failures, raw-hash mismatch
assessment, first CDB transcript/dump failure, forced-cleanup outcome and initial
offline review. Corrected CDB capture uses forward-slash dump paths and explicit
second-chance continuation. Reopened the successful dump without launching the app:
private matching PDB symbols loaded, exception/short stack/prologue rechecked, exit 0.
The initial nearest public symbol incorrectly made `sha256_file` look like a distant
offset in `install_verified_archive`; full symbols resolve that ambiguity. The
successful ordinary observation establishes OS window responsiveness, not rendered
content correctness or graceful lifecycle cleanup. The ignored WebView path override
is documented above; actual disposable profile isolation was checked explicitly.
Debugger commands follow Microsoft's [CDB options](https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/cdb-command-line-options)
and [exception control](https://learn.microsoft.com/en-us/windows-hardware/drivers/debuggercmds/sx--sxd--sxe--sxi--sxn--sxr--sx---set-exceptions-).

**Proposed R2-P1-WIN-F1 correction — approval required, not implemented:**

1. In `renpy.rs`, replace the two 1 MiB stack arrays in `sha256_file` and
   `hash_regular_tree` with directly heap-allocated byte buffers, for example
   `vec![0_u8; 1024 * 1024]`. Keep chunk size, digest framing/order, deadline/cancellation
   checks, file/path checks and errors unchanged. Avoid constructing a large array
   on the stack before boxing it. Do not increase the executable/thread stack limit
   or change Tauri threading to mask this allocation.
2. Add focused child-process regression coverage that invokes file and tree hashing
   on an explicitly small stack, so stack-overflow abort is reported as a failed
   child instead of killing the parent test runner. Verify expected hashes across
   multiple chunks and retained cancellation/error behavior; show the test fails
   before the correction and passes afterward. Reuse existing fixtures/helpers.
3. Run formatting, repository checks, relevant SDK/hash/archive tests and the retained
   ordinary core suite; then one local Windows release build with the default stack
   reserve and all five existing packaged Runtime UI cases using disposable data.
   Record each result/cleanup honestly and stop at any newly exposed blocker instead
   of broadening the fix. This proposal grants no CI dispatch, macOS diagnosis,
   performance-budget change, human acceptance, conflict resolution or merge.

The proposed follow-up is a separate checkpoint. R2-P1 remains **blocked** until
correction and supported-target qualification; macOS p95 109.9 ms remains open.
No duration/graph-reopen, final G1/R1/R2 or human acceptance gate is newly qualified.

**Preserved evidence/publication:** workspace `reports/r2-p1-win-d1` contains build
logs, identity/hash/config records, launch controller and four-launch ledger,
console/CDB logs, baseline executable/PDB, diagnostic dump and offline review.
The matching diagnostic executable/PDB remains under the prepared target directory.
Machine paths, downloaded dependencies, binaries, raw logs and dump stay outside Git.
Disposable profile/probe directories remain preserved. Final counters are **one
baseline compilation, one diagnostic compilation, 4/4 launches**, plus **0/4** of
the later additional build allowance. No further launch is authorized under D1.
Cleanup inspection at 06:23:50 UTC found zero remaining Loomlight, CDB/WinDbg,
disposable-profile WebView or workspace Ren'Py processes. No build/CI operation is
pending. Charge a conservative **25 minutes** for this resumed investigation through
that cleanup (including local build/capture waits), plus **nine minutes** for the
interrupted turn: **34/90 minutes**, before documentation review/publication.

### 27. R2-P1-WIN-F1 SDK hashing stack correction — 2026-09-27

**Authority/state:** after receiving the concrete D1 finding/proposal, the user said
"I approval, apply the fix and test". This explicitly selects the follow-up in the
same chat; now `review_ready`. The additional four-build allowance is available for F1.
Approve only the two heap buffers, focused regression and existing local Windows
gates proposed in ledger 26. F1's five existing packaged cases are separate from the
completed four-launch D1 investigation. No redispatch, macOS diagnosis, budget
relaxation, native automation, conflict resolution or merge.

**Testing-scope correction:** the user subsequently reported an interface message
"This content cant be shown" and requested no aggressive/hostile testing. Testing
was stopped while checking: the two pre-fix small-stack child tests had already
finished (both reproduced stack overflow); no test process remained, and a scoped
recent Defender-event query returned no matching detections. The interface message's
cause is unknown; it must not be called a confirmed security detection. Remove the
deliberate-crash child harness from the final patch. Use ordinary multi-chunk/empty/
missing-input hash checks, retained cancellation/deadline checks, focused non-hostile
SDK regressions and the approved application scenarios. Do not run the broad core
suite's historical race/process-crash experiments. One additional build run was
used for the pre-fix experiment; three remain before further compilation.

**Implemented:** only the two production array initializers in `renpy.rs` changed
to `vec![0_u8; 1024 * 1024]`. Hash chunk size, framing/order, cancellation/deadline
checks and filesystem behavior remain intact. Two ordinary unit tests cover
multi-chunk/empty/missing inputs, known expected hashes and request controls. The
initial small-stack subprocess tests are absent from the final source. The durable
lesson and ordinary regression entry points are in `docs/TESTING.md`.

**Local validation so far:** the second additional build compiled the final tests
in 35.58 s; six individually selected tests each passed (one test per invocation,
203 filtered). No broad core run or hostile/race/process-crash suite was selected.
Passed selectors in `renpy::tests`:

- `sdk_hashes_match_multichunk_empty_and_missing_inputs`
- `sdk_file_hash_retains_cancellation_and_deadline`
- `checksum_failure_and_existing_destination_never_overwrite`
- `invalid_extracted_payload_is_cleaned_without_promotion`
- `exact_version_parser_rejects_incompatible_sdk`
- `child_environment_allowlist_excludes_injection_variables`

The third additional build produced the fixed release executable in 38.78 s, using
the same locked/offline custom-protocol command as D1 and default release settings
(no debug/profile or stack override). PE stack reserve/commit remain 1,048,576/4,096
bytes. Executable **13,669,376 bytes**, SHA-256
`76d6fd49f0ac1c6e90eb1560097254235f804fa55a83aa662995082aaba246cd`;
PDB SHA-256 `cdb73f3e34cbc0b4e50d15b579a94b504ac54257df06a8722c445050646ecdd6`.
Build-time configuration uses unique identifier `app.loomlight.r2p1winf1` and a
valid relative WebView data directory. These isolation overrides and lack of
installer packaging limit the result to a local release executable, not CI identity
or final supported-target qualification. All 101 input hashes and the app diff hash
are retained in `f1-identity.json`; only `renpy.rs` differs substantively from the
original candidate. Diagnostic executable/PDB were preserved under local report
subdirectory `diagnostic` before F1 replaced the target-directory output.

**Existing application cases — all passed locally:** each invocation used
`app/scripts/run-runtime-ui-probes.py` with exactly one case; the controller would
stop before the next case on failure. Every result has exit 0, no timeout, one
passing report, stage `complete`, and `cleanupComplete=true`.

| Case | Whole invocation | Additional retained evidence |
| --- | --- | --- |
| compile | 54.704 s | Real compile diagnostics and source navigation passed |
| lint | 53.782 s | Real lint diagnostics and source navigation passed |
| route-a | 64.891 s | Graph destination edit/close/reopen, live script Save, Stop and saved-disk reopen passed; observed running interval **9,510.5 ms** |
| route-b | 65.359 s | Same graph/runtime/reopen proof plus draft Cancel/Save All refusal; observed running interval **9,501.7 ms** |
| runtime-error | 52.140 s | Real runtime failure display passed |

The two observed running intervals exceed the retained >8 s assertion. Both reports
contain `branches-destination-reopen-passed` and `disk-reopen-passed`. These now have
local Windows real-service/SDK evidence, with synthetic DOM input; no native keyboard
or human acceptance claim. No new native automation was introduced. Route B's log
also contains a WebView shutdown warning, `Failed to unregister class
Chrome_WidgetWin_0`, error 1411. Preserve it: the report/exit succeeded and the final
OS process check found no retained process; its internal cause was not investigated.

**Final review and gates:** the assessment re-read all five JSON results and six
unit logs, checked report counts/terminal states/cleanup, verified both duration and
reopen assertions, and confirmed the tested source still matches its recorded digest:
`e3e38e879e1b9551cebb2a86f4e1587442979c001bc38028417b1b049019e856`.
The app diff SHA-256 is
`472a7ede6dbce8ddc9ec7e605da75e3118dd82189d282f0b693735c01d79f6b1`.
All **56 retained evidence files** were hashed in local `integrity.json`; extracted
SDK trees and disposable browser profile contents are not part of that inventory.
At **06:47:03 UTC**, the OS check found no remaining Loomlight, debugger,
disposable-profile WebView or workspace SDK process. No build or CI operation is
pending. **Three of four additional build runs used; one unused.** F1 executed the
five approved application cases. D1's four launches and earlier failures remain
separate, preserved evidence.

`cargo fmt --check --all`, `python scripts/validate.py` (270 files), and
`git diff --check` passed. The final application diff is the two buffer initializers
plus two ordinary tests. Only TESTING, CURRENT, HANDOVER and this ledger accompany
it. No deliberate-crash harness, hostile/race tests, stack-size override, downloaded
tool, raw log, dump or machine-specific path is committed. Existing tests outside
the six selected SDK checks were **not run**; installer packaging, CI, macOS,
full G1 budgets, legacy boundary/secret-scan/dependency gates and human acceptance
were not rerun or claimed passed.

**Disposition/next selection:** R2-P1-WIN-F1 is `review_ready` locally. R2-P1 remains
`blocked` because this is not a replacement supported-target qualification and the
macOS 109.9 ms frame-budget failure remains open. Publish the reviewed source and
checkpoint docs on the existing branch/PR; do not redispatch or merge. The next
bounded selection is **review and plan only** for the remaining macOS frame-budget
failure, using existing evidence, with no execution or budget change implied.


### 28. R2-P1-MAC-D1 macOS frame-budget diagnosis/review — 2026-09-27

**Authority/disposition:** user selected diagnosis/review and the smallest correction
and proof plan only. D1 is `review_ready`; R2-P1 remains `blocked`. No application,
test, workflow or dependency implementation occurred. No budget relaxation, CI
dispatch, package build, SDK execution, merge/conflict resolution, hostile/crash test,
new tool download or installation occurred. This review does not accept G1/R1/R2.

#### Entry, ownership and exact evidence

Fresh fetch, worktree/history, open PR and task inventory found clean published
`4470e3af6f3603f8936eaf442e6d849bb366114b` on
`feature/phase-1g-branches-runtime`; draft PR #17 remains open/conflicting.
Main remains `4d7ba0333c48d60242a9a42d3e079fea499a5531`. Only this local task was
active; related Windows/setup tasks were idle. No work was discarded or integrated.
WIN-F1 and its local evidence (ledger 27) remain intact. The only application delta
from failed candidate `f1a0f148445f34f8af1a57d0f69e2d27eb543b11` is WIN-F1's
`renpy.rs` change. Branches UI/CSS/probe and package lock are also identical between
corrected passing `a6063080006769613733de20fcd82265bf96b632` and failed `f1a0f14`.

GitHub freshly confirms run **36293797731**, attempt **1**, candidate `f1a0f14`,
terminal **failure**; macOS job **108548848384**. Artifact **10923840024** was
redownloaded, verified at **224142 bytes**, SHA-256
`82580f0178840ebc413767622ef7bdd7076de05f2bdcc95dfe756f826940961b`, and ZIP CRC/path
checks passed. All five JSON/log members were retained along with the entire archive
(seven members including two screenshots), API metadata and full macOS job log.
The service fixture is exactly the failed run's 500-node/2,000-edge JSON; no synthetic
replacement or fresh core build was needed. Ledger 23 retains the complete matrix audit.

Both this failure and corrected passing run **36291545085**, macOS job
**108542473845**, used image `macos-26-arm64` **20260907.0351.1** and Chrome
**152.0.7977.83**. The failed host reports macOS **26.6.2 / 25G83**; toolchain
Node **24.19.0**, npm **11.9.0**, Rust **1.90.0**. Equal image/version does not prove
equal hardware load, graphics state or scheduling. Neither archived run has a trace,
per-sample rendering/presentation markers or GPU/CPU-load telemetry.

#### Findings and causal limits

1. **The failure is real under the existing metric.** Recalculation of nearest-rank
   p95 (sorted sample 29 of 30) gives **109.9 ms**. Four samples exceed 100 ms:
   **#2 860.3, #5 109.9, #21 100.8, #22 102.0 ms**. This is not a percentile bug
   or a single removable outlier. Dispatch maximum **0.3 ms** and initial layout
   **91.9 ms** remain separate measurements. Prior p95 **94.2 ms**, maximum
   **126 ms**, and the still-earlier **1,058.6 ms** outlier retain their original status.
2. **Confirmed harness coverage/endpoint defects.** `app/tests/branches.browser.mjs`
   starts timing inside `page.evaluate`, synchronously dispatches ArrowRight, and
   ends in the next requestAnimationFrame continuation. It measures dispatch-to-rAF
   wait, not confirmed presentation. The host/CDP round trip is outside this timer,
   but determines when each next sample starts relative to rendering. A slow interval
   may include pending prior rendering/browser work; a short interval may finish
   before the current transform paints. The [HTML rendering algorithm](https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering)
   places animation callbacks before style/layout and later rendering work. Local
   tracing independently confirms this ordering below. A second rAF would be a
   broader rendering-opportunity proxy, not a guarantee of displayed pixels.
3. **Confirmed workload visibility gap.** `fit()` floors zoom at **0.05** for the
   100-row graph. At the probe's 1280×800 viewport, measured SVG bounds are
   **66.5×553 px**, left **21**, right **87.5**; viewport left **20**, width **1240**.
   Each ArrowRight translates left **40 CSS px**. After the second input the graph's
   horizontal extent is outside the clipped viewport; the end transform is
   `translate(-1200px, 0px) scale(0.05)`, SVG right **-1112.5**. Layout/path generation
   also bounds graph content within that horizontal extent. All 500 nodes and 2,000
   paths remain in the DOM, but samples 2–30 do not sustain visible graph panning.
   This weakens passing evidence; it does **not** invalidate or excuse a failed gate.
4. **No demonstrated application hot path for these stalls.** The key handler changes
   pan coordinates and one canvas transform; it does not reproject, rebuild nodes,
   read source or wait for the held refresh. The existing `will-change: transform`
   is present. Fast dispatch rules out a long synchronous handler for the measured
   events, but does not rule out deferred paint/raster/GPU cost from this graph.
   WIN-F1's Rust hashing correction cannot affect this injected-fixture browser path.
5. **Browser/compositor contribution demonstrated locally; exact CI attribution is
   unresolved.** An unchanged local baseline does not reproduce the failed p95.
   A traced no-input interval after Fit contains a 104 ms sample overlapping renderer
   compositor teardown/GPU waits, rather than an application key handler. This proves
   the timer can capture browser/graphics lifecycle work even without a new pan.
   It does not prove the historical 860.3/109.9 ms intervals have that cause, nor
   distinguish a Chrome-version issue, hosted scheduling/load or graph-triggered
   deferred graphics work on that runner. No claim of a purely environmental flake.

**Classification:** measurement/coverage defects are proven; browser/compositor and
host-dependent behavior is a supported contributor hypothesis for the CI failure.
An implementation/rendering contribution remains possible but is not located.
The missing historical trace prevents a defensible exact implementation-versus-host
split. The smallest justified next correction is to the measurement/evidence path,
not speculative renderer optimization. CI remains failed until new approved proof.

#### Bounded local diagnosis using existing tools

Exactly **two** disposable headless Chrome launches, both exited 0 with browser/server
cleanup in `finally`: (1) unchanged repository probe; (2) an ignored diagnostic copy
with CDP tracing/metrics and two controls. No source edits, builds, CPU throttling,
Chrome flags/graphics changes or extra tool installations. Host: native ARM64,
macOS **26.6.2 / 25G83**, **Apple M4**, installed Chrome **154.0.8037.57**, local
Node **24.19.0** and locked Playwright **1.63.0**. Trace reports ANGLE Metal Apple M4,
GPU compositing/rasterization enabled. This differs from CI Chrome 152 and is
supplemental mechanism evidence, never target acceptance or a replacement run.

| Local observation | Result |
| --- | --- |
| Unchanged full probe, original 30-sample metric | PASS; initial 46.8 ms; p95 15.9 ms; max 16.0 ms; dispatch max 0.2 ms; held-refresh navigation/resize/page-error assertions pass |
| Diagnostic copy, original 30-sample sequence | p95 15.9 ms; zero layouts, 4.3 ms total style recalculation and 0.828 ms total script metric delta over the measurement bracket |
| Original-sequence trace | Two Paint events, one RasterTask; first FireAnimationFrame at +10.764 ms precedes UpdateLayoutTree +10.952 ms and Paint +11.644 ms |
| No-input control after Fit, 30 samples | p95 16.9 ms, maximum 104.0 ms at #4; no key dispatch |
| Alternating left/right control after Fit, 30 samples | p95 17.0 ms, max 17.1 ms, dispatch max 0.2 ms; trace has no Paint or RasterTask within its bracket |

Controls execute in one page-side loop, unlike the original's per-sample CDP calls;
they are diagnostic, not equivalent acceptance populations. Fit restores the graph
before each control and can leave rendering pending; the no-input control is not a
pure idle-host benchmark. Its long sample overlaps **94.97 ms ProxyMain::Stop** on
the measured page's renderer main thread, **94.01 ms WaitForGetOffset** on its
compositor, and **88.32 ms IOSurfaceImageBacking::WaitForCommandsToBeScheduled** on
the GPU thread. These overlapping nested events must not be summed. No native
WKWebView or physical input claim follows from this Chromium trace.

Raw archive/logs, fixture, diagnostic script, full trace, metrics/GPU/geometry and
SHA-256 manifest remain outside Git in `.toolchains/reports/r2-p1-mac-d1`. The diagnostic copy
imports the unchanged real renderer/CSS, keeps the original assertions and adds
instrumentation/control sections only. It is not a production test correction.

#### Proposed R2-P1-MAC-M1 correction and proof — separate approval required

1. **Limit implementation to the browser probe and its diagnostic evidence plumbing.**
   Retain full service-produced 500/2,000 counts, held-refresh behavior, navigation,
   resize and page-error assertions. Keep the original 30 samples and <100 ms gate
   visible for comparison; no trimming, percentile change, averaging across reruns,
   scheduler subtraction or dispatch-only substitute. Add a fixed 30-input bounded
   back-and-forth path, assert transform changes and visible graph intersection on
   every sample, with stable representative geometry checked outside timing. Retain
   initial <2 s and core <250 ms/<2 s budgets. Do not change production CSS/renderer.
2. **Make the endpoint and attribution explicit.** Name existing values dispatch-to-rAF.
   Preserve ordered start/dispatch/rAF/end timestamps and browser/fixture/source
   identity. Add trace user marks and bounded rendering/GPU trace output, including
   on failure; record visibility/focus, browser version, runner image, GPU mode and
   trace overhead. A rendering-opportunity/presentation-correlated diagnostic must
   demonstrate the transformed graph's frame, with the same <100 ms objective.
   Do not silently replace the current gate with a different endpoint. Review its
   semantics before treating it as rendered-input acceptance. Keep browser/native
   WebView claims separate. No arbitrary warm-up delay to discard startup stalls.
3. **First local proof, fixed rather than retry-until-green.** One untraced full probe
   and one traced diagnostic launch using the already installed tooling and retained
   service fixture. Verify positive graph intersections, original and visible-path
   distributions, paint/callback ordering and cleanup. Add only focused probe
   assertions needed for the corrected contract; no broad core/crash/hostile suite.
   If it fails, retain evidence and stop for a bounded finding; do not tune endlessly.
4. **Hosted proof remains an explicit later execution decision.** Local Chrome 154
   cannot explain/qualify historical Chrome 152. After probe review, propose exactly
   one macOS diagnostic run with the same workload/launch conditions and captured
   graphics/timing evidence, retaining all old results and no automatic retry. Reuse
   `quality.yml`'s bounded browser qualification path where practical; its current
   matrix runs both OSes and ordinary suites, so any macOS/browser-only selection
   needs an explicit scoped workflow change. Do not dispatch the full production
   package matrix just to diagnose this browser gate. Do not run its crash cases
   under this user's testing exclusion. No dispatch is authorized by this plan.
5. **Decision rule:** correlate >100 ms samples with trace brackets. Sustained graph
   paint/raster/layout work calls for one measured renderer fix; long main/GPU waits
   shared with no-input controls call for a documented browser/runner correction;
   mixed evidence calls for both. No reproduction is inconclusive, not retroactive
   acceptance; preserve the run and stop without another attempt. Do not install
   Chrome 152 or new profilers without explicit tool approval if existing evidence
   tools prove insufficient. Final supported-target package/human gates stay open.

#### Review, validation and stopping boundary

The review checked exact source equality, original samples/percentile, held-refresh
control flow, graph geometry, trace ordering and diagnostic limits. Only this ledger,
CURRENT, the existing HANDOVER and a small TESTING measurement lesson change.
Initial repository validation found missing final newlines in four ignored raw JSON
artifacts because the validator scans `.cache`. No evidence bytes were altered: the
whole diagnostic directory was moved under the existing excluded `.toolchains/reports`
location. The retained diagnostic copy's relative imports describe its original
`.cache` location; replay requires placing a copy at that original depth or resolving
its imports to `app/`. The archived source/trace hashes remain unchanged. Fixture
SHA-256: `8f9e8deba12cf6bc2c1453b81515307308119113463f5c01e80de72982d30196`;
trace SHA-256: `a3f3ac88c2ca8bbf47f0b93f11d25827f527111f316e8ac8b644db7f610cb02f`.
`python3 scripts/validate.py` passed for **270 files** after relocation;
`git diff --check` passed. Changed-path review confirms exactly four documentation
files and no untracked publication inputs. The traced renderer/GPU PIDs are absent
on final OS inspection; both browser commands exited 0. No package matrix is needed
for this documentation checkpoint. Publication resolves
the new documentation head from Git without a receipt-only commit.

D1 ends with a reviewable diagnosis and the above smallest justified correction/proof
plan. Missing exact CI stall attribution and all failed/skipped qualification remain
explicit. No operation is awaiting completion; further implementation, diagnostics
on CI and final acceptance require their own approved scope.

### 29. R2-P1-MAC-M1 probe correction and local proof — 2026-09-27

**Authority/disposition:** user explicitly approved R2-P1-MAC-M1, bounded to ledger
28's probe correction and fixed local proof, and requested review, blocker correction
and publication. M1 is `review_ready`; R2-P1 remains `blocked`. WIN-F1 is preserved.
No CI dispatch, budget relaxation, production renderer/CSS change, hostile/crash test,
installation, package/core build, merge or conflict resolution occurred.

#### Entry and reviewed candidate

Clean local/remote `97d520b01e574335f309e125965c192c544d77c7`, existing branch
`feature/phase-1g-branches-runtime`, draft/open/conflicting PR #17. Fresh fetch
confirmed main `4d7ba0333c48d60242a9a42d3e079fea499a5531`. Related tasks were idle;
no concurrent checkpoint writer was found. Original failed CI evidence and ledger
27's WIN-F1 remain unchanged. Application/test candidate:
**`86466aea1d02ed2534ab404939a85b7a7f15ee54`**. Its only application-tree delta from
entry is `app/tests/branches.browser.mjs`; TESTING documents the measurement contract.
The accompanying checkpoint documentation does not alter those tested inputs.

Reports identify the pre-commit Git base plus exact tested source hashes; the probe
SHA-256 is `77a79fbaa0a8546de51473f0fa0f2fb5671903294ad025aad3da2fb73707b8fe`.
A post-run audit confirmed both launches used identical fixture/probe/renderer/CSS/lock
bytes and that candidate source still matches all reported hashes. No test was rerun
just to change the Git-head label. The retained service fixture hash remains
`8f9e8deba12cf6bc2c1453b81515307308119113463f5c01e80de72982d30196`.

#### Bounded implementation and review

- Retains the original 30 ArrowRight inputs, ordered raw samples, nearest-rank p95
  and <100 ms gate. Existing `panFrame*` fields remain aliases, explicitly named
  dispatch-to-first-rAF continuation. The historical offscreen path is comparison
  evidence, not a claim of sustained visible panning.
- Adds 30 alternating ArrowLeft/ArrowRight inputs at fitted x=40/0 during held
  refresh. Every input must change the transform, retain all 500 nodes/2,000 paths,
  maintain visibility/focus and positive clipped graph/first-node intersection.
  Outside timing, three representative IDs, positions and dimensions and the viewport
  must match baseline plus the expected 40-pixel translation; no renderer changes.
- Separately records first-rAF and second-rAF rendering-opportunity diagnostics with
  the same <100 ms p95 objective. Neither is guaranteed presentation. Original <2 s
  initial and core <250 ms/<2 s budgets are unchanged; core was not rerun.
- Optional evidence directory stores reports and two clipped frame captures after
  visible samples 0/1. Optional trace adds rendering/GPU/User Timing/screenshot events
  and one fixed 30-sample no-input control after Fit. Ordered timer boundaries,
  browser/host/GPU mode, focus/visibility, source identity and trace/capture wall costs
  are retained. The original population is not pooled with either added population.
- A 60-second page deadline bounds collection. On assertion failure, `finally`
  independently attempts trace saving and browser/server cleanup and writes partial
  samples/errors. Review corrected deadline teardown to close the page first, keeping
  the browser available to save the trace. Abrupt browser/process loss can still lose
  trace evidence; no failure-injection/crash launch was performed or claimed tested.
- Existing held-refresh navigation, release/completion, small visual subview, 640px
  resize and zero-page-error assertions remain. No warm-up delay, sample removal,
  scheduler subtraction, browser flag/graphics override, percentile change or retry.

#### Exactly two fixed local launches

Existing Node **24.19.0**, locked Playwright **1.63.0**, installed Chrome
**154.0.8037.57**; ARM64 macOS **26.6.2 / 25G83**, Apple M4. GPU report identifies
ANGLE Metal Apple M4 with GPU compositing/rasterization enabled. Runner image fields
are null on this local host. No download or additional tooling was needed.

From `app/`, each invocation ran `node tests/branches.browser.mjs`, using the existing
pinned Node on PATH and `LOOMLIGHT_FLOW_EVIDENCE` pointing to D1's retained
`runtime-flow.json`. `LOOMLIGHT_BRANCHES_EVIDENCE_DIR` selected distinct ignored
`untraced`/`traced` directories; `LOOMLIGHT_BRANCHES_TRACE` was `0` then `1`. The
controller would stop on a failed invocation, with no retry. Both exited **0**.

| Measurement | Untraced full probe | Traced diagnostic |
| --- | --- | --- |
| Whole invocation | 4.023 s | 4.704 s |
| Initial layout (<2 s) | 42.8 ms | 142.9 ms |
| Original 30 dispatch-to-rAF p95 / max | 16.8 / 17.5 ms | 17.3 / 23.3 ms |
| Visible 30 dispatch-to-rAF p95 / max | 16.9 / 75.6 ms | 16.9 / 76.5 ms |
| Visible second-rAF diagnostic p95 / max | 33.6 / 80.6 ms | 33.6 / 79.7 ms |
| Maximum original / visible synchronous dispatch | 0.3 / 0.2 ms | 0.2 / 0.2 ms |
| No-input second-rAF p95 / max | Not selected | 32.1 / 32.4 ms |
| Full-workload, geometry, focus, held refresh, navigation, resize, page errors | PASS | PASS |

All **120 input intervals** and **30 no-input intervals** are preserved. All 60
visible inputs retained graph intersection **25,403 CSS px²** and first-node
intersection **30 CSS px²**. The last representative node remains vertically below
the clipped viewport, as expected at the production fit floor; its stable geometry
is checked, not falsely called visible. The original sequence ended with zero graph
intersection in both launches. Full horizontal extent remains visible in the added
path; this does not claim every one of the 500 nodes fits vertically.

The two frame captures were visually inspected for each launch. They show graph
content at x=40 then x=0 within the viewport; corresponding captures have identical
SHA-256s across the two launches. Capture wall times were **223.9/190.3 ms** untraced
and **214.7/189.5 ms** traced, outside input timers. Captures and geometry reads can
perturb later browser work and are not latency endpoints; no time was subtracted.
No-input uses the same per-sample CDP/two-rAF/geometry structure but no explicit
captures; Fit can leave work pending. These controls are not identical populations.

#### Trace interpretation, overhead and causal limits

Trace saved successfully: **8,981,690 bytes**, **42,696 events**, **450 user marks**
and **49 trace screenshots**. The 360 backdated start/dispatch/rAF/end marks agree
with report clock deltas within 0.01 ms (this checks correlation, not clock accuracy).
Trace SHA-256:
`6df14ba91c59dcb6d47f6f9b4356c19857eb52a2c198f50f0d2200eb98be0611`.

Original sample #1 ends at +23.3 ms; its first Paint starts at +24.206 ms, again
showing that this timer can end before paint. In visible sample #1, first rAF ends
at +5.0 ms, Paint starts +5.239 ms, GPU DrawAndSwap +10.793 ms, and the second rAF
ends +21.5 ms; additional paint follows at +21.630 ms. This plus separate captures
demonstrates transformed graph rendering, not guaranteed physical presentation at
the second callback. No native WKWebView/input or human acceptance claim follows.

The longest visible interval is sample #4: **80.6 ms** untraced / **79.7 ms** traced.
The traced interval overlaps **74.801 ms** GPU
`IOSurfaceImageBacking::WaitForCommandsToBeScheduled`, with first callback at
+76.432 ms. Nested wait/swap events overlap and must not be summed. Both cases are
below the unchanged objective and follow the explicit screenshot pair. This is
browser/graphics contribution evidence, potentially affected by instrumentation;
it does not attribute the historical CI intervals or exclude graph-triggered work.

Trace setup/teardown costs were **34.0/263.4 ms**, outside input timers. Traced initial
layout was 100.1 ms longer and original p95 0.5 ms longer; visible p95 was unchanged.
One pair cannot isolate trace overhead from startup/scheduling variation, so no
correction factor or pooled acceptance is applied. No >100 ms input sample reproduced;
historical Chrome 152 CI causation remains unresolved, not retroactively accepted.

#### Gates, preservation, publication and next boundary

`node --check app/tests/branches.browser.mjs`, `python3 scripts/validate.py`
(**270 files**) and `git diff --check` passed. Review checked gate/endpoint semantics,
all 150 intervals, nearest-rank calculation, per-input geometry, capture identity,
trace correlation, source hashes, failure cleanup structure and diff scope. Both
reports have no page errors, passed navigation/resize, and browser/server closed.
Independent OS/socket checks found all **14 recorded browser process IDs absent**
and both server ports closed. **Two launches used; none pending; no retry.**

Ignored evidence lives in `.toolchains/reports/r2-p1-mac-m1` (12 files hashed by
`manifest.json`, including both reports/logs/launch receipts, four PNGs, trace and
audit). D1 raw evidence remains untouched. No raw log, trace, SDK, capture, absolute
host path or personal data is committed. WIN-F1 `renpy.rs`, Branches renderer/CSS,
lockfiles and workflows compare unchanged against the reviewed Windows candidate.
No broad DOM/core/hostile/crash suite, SDK/package build or native human check ran.
The original failed run **36293797731**, attempt **1**, candidate `f1a0f14`, and its
macOS **109.9 ms** p95 remain failed; skipped macOS SDK/package gates remain missing.

Publish candidate plus this ledger, CURRENT and the existing HANDOVER on the same
branch/PR. Publication commits use `[skip ci]` to avoid triggering PR CI under the
user's no-dispatch boundary; skipped CI is not passing qualification. Resolve the
actual documentation head after push without a receipt-only commit.

**Next bounded goal — R2-P1-MAC-H1 scope review only:** review this local evidence and
prepare the concrete one-run macOS/browser-only diagnostic proposal from ledger 28,
including exact workflow selector/change, workload, trace artifacts and stopping rule.
The existing quality profile is a two-target ordinary-suite matrix and cannot simply
be described as macOS-only. Workflow implementation and a single hosted dispatch need
explicit approval; no production matrix, automatic retry, tool installation, budget
relaxation, renderer work, crash tests, conflict resolution or merge is authorized.
Final supported-target/package/native-human acceptance remains open. M1 stops here.
