# Phase 1G — Branches, runtime and diagnostics

**Updated:** 2026-09-25. **Implementation:** 1G.1 `review_ready`; 1G.2a `awaiting_ci` (corrected production candidate; R1 blocked); 1G.2b `not_started`.
**Authority:** the user approved the planning corrections and minimal physical testing,
and removed new Git work from Phase 1. The user subsequently authorised review and merge; PR #16 is integrated.
The user subsequently selected 1G.1 only; its implementation and targeted review are recorded in section 12. Later checkpoints require separate selection.
**Historical planning branch:** `docs/phase-1g-scope-testing`, from main
`f6c269278aa1d8955876ca45bac98a92940e1c5e`. CURRENT/HANDOVER own continuation on the implementation branch.
**Entry:** accepted/integrated 1F, fresh refs/ownership and explicit selection of one
checkpoint. The current execution selection authorises 1G.2a only; see section 13.

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
| 1G.2a | Runtime/trust/revision/process foundation | `awaiting_ci` (corrected production candidate; R1 blocked) | Reviewed 1G.1 checkpoint and explicit selection |
| 1G.2b | Validate, Run/Stop and Diagnostics UI | `not_started` | Proven 1G.2a and explicit selection |

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
6. Invalidate from accepted transactions, undo/redo and reconciled external changes;
   label last-valid projections stale/partial. Do not render an unsaved draft as accepted.
   Bound graph building/layout, support cancellation on session switch and keep UI input
   responsive. Record concrete node/edge limits and latency budgets before measurement,
   with an honest over-limit state. Do not silently truncate or import spike scale claims.

**Initial production budget:** at most 500 mapped Scenes and 2,000 displayed flow edges;
bound the project label inventory separately before implementing it. Use an unchanged
representative fixture and record host/measurement method before measuring: accepted
projection update target 250 ms, input/pan response p95 100 ms, initial build/layout 2 s.
These are starting acceptance budgets to validate on both targets, not measured claims.
If infeasible, report a bounded finding and propose a budget change before acceptance;
never silently raise a limit. Over-limit input shows an explicit state with navigation
back to Source and no silent truncation. 10k/50k spike workloads are not 1G requirements.

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

**Outstanding production R1:** [run 36136466567](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36136466567),
**attempt 1**, exact corrected candidate above. At the single entry inspection,
Windows job `108075623934` and macOS job `108075624153` were in progress.
Expected artifacts: `runtime-foundation-windows-2025` and
`runtime-foundation-macos-26`, seven-day retention. Inspect actual step outcomes,
logs, ZIP hashes/CRC and outcome/input-hash reports; a green frontend alone is not R1.
No terminal production result is claimed here. The original feasibility run remains
PASS on both targets and was neither rerun nor replaced by this production workflow.

**Current checkpoint state:** `awaiting_ci` / R1 BLOCKED, not review-ready or accepted.
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
