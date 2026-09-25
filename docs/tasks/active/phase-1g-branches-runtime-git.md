# Phase 1G — Branches, runtime and diagnostics

**Updated:** 2026-09-25. **Implementation:** all three checkpoints `not_started`.
**Authority:** the user approved the planning corrections and minimal physical testing,
and removed new Git work from Phase 1. This authorises documentation publication only.
**Planning branch:** `docs/phase-1g-scope-testing`, from main
`f6c269278aa1d8955876ca45bac98a92940e1c5e`. CURRENT/HANDOVER own publication state.
**Entry:** accepted/integrated 1F, fresh refs/ownership and explicit selection of one
checkpoint. No application work or production dispatch is authorised by this update.

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
| 1G.1 | Shared flow projection and Branches | `not_started` | Integrated 1F and explicit selection |
| 1G.2a | Runtime/trust/revision/process foundation | `not_started` | Reviewed 1G.1 checkpoint and explicit selection |
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
authorised documentation updates. **State:** documentation `review_ready`; every
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
SDK, package or physical test is claimed by a documentation check. Next action is review
of this documentation PR; implementation requires separate checkpoint selection.

### Script-only play clarification

The user confirmed supported script editing/saving during play and excluded asset
updates. Section 5 now requires Stop before asset mutations, with core refusal and
race/history coverage; the former live-asset-read acceptance case is removed. Existing
asset references can still be edited in scripts. No custom hot reload, runtime snapshot
or new manual test session is introduced. This amends documentation PR #16 from
`b9226360165fe2a8c22244f5e5812fe0a713bd5f`; implementation remains unstarted.
