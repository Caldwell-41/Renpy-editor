# Phase 1G — Branches, runtime, diagnostics and local Git

**Prepared:** 2026-09-22.
**Planning state:** agreed product decisions; documentation publication authorised.
**Implementation state:** `not_started` for every checkpoint below.
**Authority:** The user approved the corrected plan, including existing-command graph
editing, continued authoring during play with targeted restrictions, session-scoped
executable trust, and preservation of unrelated staged Git changes. The user then
requested a separate planning PR and a review against the conversation. This is not
authority to implement, dispatch production gates, merge this PR or advance Phase 2.
**Planning branch:** `docs/phase-1g-1h-planning`, based on main
`60a800a83f50e73f4a2244bb194d55b7b19f3c72` (including Phase 2 planning).
**Entry:** Phase 1F accepted and integrated, actual main/refs checked, and explicit
selection of ONE checkpoint. Reuse an existing matching implementation branch/PR;
otherwise record the new implementation branch in the live handover at entry.

## Closeout preparation — 2026-09-22

Planning PR #15 is integrated in main `75a91c5f72cd0eac8586faf2be036ec5021a939d`.
The planning-branch/authority text above records historical publication, not an open
planning PR or permission to implement. No duplicate planning work is needed.
Phase 1F PR #14 is still draft/unmerged: [closeout review](phase-1f-save-correction.md#722-independent-closeout-review)
found Apply Both review-binding and two Scene/Preview defects. Its #87 application
remains unchanged; do not call those foundations accepted yet. All checkpoint states
below remain `not_started`. The next eligible checkpoint is 1G.1/G1 only after 1F
correction, acceptance and integration plus explicit selection. CURRENT/HANDOVER own
that continuation; no implementation branch is created by this preparation.

## 1. Ownership and existing foundations

Read [AGENTS](../../../AGENTS.md), [WORKFLOW](../../WORKFLOW.md), current status and
handover from the actual implementation branch, the [parent plan](phase-1-vertical-slice.md),
[UI](../../UI.md), [DATA_MODEL](../../DATA_MODEL.md), [TRANSACTIONS](../../TRANSACTIONS.md),
[SECURITY](../../SECURITY.md) and [SDK ADR 0002](../../adr/0002-versioned-renpy-sdk-adapter.md).
The integrated 1F Source brief and shell-Save ADR govern drafts and Save; do not copy
or replace their controller, transaction, recovery or session authority.

The planning review inspected PR #14 at `1d5704b738de25a1b95197cc0866f866ae52826d`;
publication observed its newer head `85e44e926399ae7ad8431c948e1751db04dcde35`.
Neither is an accepted 1F baseline or an instruction to reset. The branch owner retains
the active 1F handover and correction ledger. This planning PR deliberately does not
edit those files or CURRENT; the user approved that separation. No parallel live
HANDOVER is created. This brief owns the planning record until implementation entry.

| Area | Reuse | Work still required |
| --- | --- | --- |
| Flow | `scene.rs` Scene IDs, Choice/Jump/Return, guarded lifecycle and history | Shared unresolved/unknown-flow projection and Branches surface |
| Source | Integrated 1F draft, mapping, Save and session coordination | Revision-aware consumers, without another document truth |
| SDK | `renpy.rs` pinned SDK, safe arguments, bounded execution and creation validation | Explicit user execution, long-lived process ownership, usable diagnostics |
| Desktop | Narrow protocol and lifecycle authority | Nonblocking operation ownership and cancellation |
| Git | `lifecycle.rs` private-stage init only | Status, diff and exact reviewed checkpoints |
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
| 1G.3a | Local Git safety and checkpoint foundation | `not_started` | Reviewed 1G.2b and explicit selection |
| 1G.3b | Git status/diff/checkpoint UI | `not_started` | Proven 1G.3a and explicit selection |

These subdivide the parent's three capability gates; they do not create five separate
product milestones. Use one checkpoint per chat, retaining the implementation branch/PR
and its evidence across chats. All three capabilities must pass before 1G closes.

Excluded: conditions/calls authoring, arbitrary parser expansion, graph connection
dragging, mature minimap/search/large-story layout, reachability/state simulation,
Run From Here, arbitrary project import, destructive Git restore/reset/clean, remotes,
authentication, LLM work, plugins, signing/notarisation and CI wait/wake redesign.
No renderer filesystem/process capability or CSP relaxation is allowed.

## 3. Cross-cutting accepted behaviour

### Drafts, persistence and operation preparation

Source buffers, accepted disk content and derived views remain distinct. Before
Validate, Run or Git checkpoint preview, settle the captured current editor input
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

**G1 gate:** shared-service and rendered tests prove two routes, reconvergence, duplicate
options, self-loop/cycle, Jump/Return, destination creation/removal refusal, missing and
unknown flow, mixed understood/opaque choices, source minimality and history. Verify
Scene/Source/Branches navigation both directions, selection after deletion, draft retention,
external invalidation, session races, bounded layout and keyboard/focus/resize on both
packaged targets. A graph built from test-only edges does not satisfy this gate.

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
| Running game | Allow ordinary authoring; display launch revision and Started from an earlier revision after relevant edits |
| Runtime reload | Verify and control SDK automatic reload so editing does not silently execute a new revision under the old Run action |
| Move/delete/undo | Reject only operations conflicting with live source/compiled-file ownership, including relevant history inverses; show Stop action |
| Switch/close/exit | Offer Stop and continue / Cancel; finish child cleanup before invalidating session; then honour existing draft leave flow |
| Natural exit/crash | Capture exit state and bounded output; release ownership and revalidate generated artifacts |
| Stop/revoke | Stop the owned process tree, reap children, release resources; keep Stop responsive and token-bound |
| Output flood | Bounded memory/backpressure and visible truncation; no silent success or unbounded pipe readers |

Record a mutation-versus-execution compatibility table, including assets/definitions,
source saves, file lifecycle, history, recovery and Git checkpoints. Runtime-conflicting
operations may offer Stop and retry; do not impose a whole-session editor lock as an
unannounced scope reduction. If safe continued authoring or reload control cannot be
proven, stop with a specific design finding for user review.

Launch provenance is not a promise that every later runtime read uses those same bytes.
The live game can load an updated asset or other file after an editor/external change.
Explain that distinction when changes occur; do not present the runtime as an immutable
copy or proof of the newly edited revision. Route acceptance uses a controlled unchanged
fixture, while a separate live-read test verifies truthful status during authoring.

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
SDK mismatch, duplicate actions, long-running game, authoring/reload behaviour, move/delete
and inverse blocking, natural exit/crash, cancellation/Stop/output flood and lifecycle
races. Test actual process-tree cleanup on both targets, not only a fake process port.

## 6. 1G.2b — Runtime UI and navigable diagnostics

Wire Validate to pinned compile/lint and Run Game to standard game entry. A validation
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
runtime authoring/staleness, runtime errors, static/SDK separation, output bounds and
keyboard/focus/resize in actual Windows/macOS packages. DOM/browser tests supplement
native evidence and cannot replace it.

## 7. 1G.3a — Local Git checkpoint safety

Deliver core-owned local status, inert diff and checkpoint operations with opaque session
and review tokens. Preserve the existing `git init` option. A project without a repository
shows Git unavailable for that project; it remains authorable. Do not silently initialise,
install Git, change global identity/configuration or run authentication/network commands.
Report missing executable/identity actionably; an explicitly entered checkpoint identity
is validated and scoped locally. Record the supported Git version/capabilities.

### Review and file inclusion

Default candidates are conventional game source, copied game assets, project-owned GUI
resources and durable editor metadata (`project.json`, `authoring.json`, `source-map.json`
where present). Inspect actual schemas at entry: exclude transient fields/files, recovery
journals, credentials, machine paths, SDKs, logs, saves, caches, `.rpyc`, distributions
and build output. Ignored/private files do not become candidates just because already
tracked. Never use blind `git add .`. Display exclusions with reasons.

The user selects full files and reviews additions/modifications/deletions, text diffs
or binary hash/size summaries, identity and commit message. Detect source/metadata
dependencies; require review of needed companion changes or refuse an incoherent set,
never silently include them. Preview is bounded/cancellable. Checkpoint includes only
the exact reviewed bytes; drafts are excluded unless explicitly accepted first.

### Index, concurrency and crash contract

Preserve unrelated staged index entries and worktree bytes on success and failure.
Do not globally refuse checkpoint merely because unrelated files are staged. Detect
partially staged selected paths: show staged versus working content and refuse ambiguous
same-path intent until the user resolves/reviews it; do not silently consume that staging.
Phase 1 does not add a general staging editor or hunk selection.

Bind preview to canonical repository/project identity, HEAD/ref, selected file bytes,
relevant metadata and captured index state. Recheck at commit; stale HEAD/index/selected
content requires a fresh review. Safe unrelated changes may remain untouched, but must
not be included. Handle an unborn HEAD/first commit, no-op selection, additions, deletions,
binary files, unusual filenames and concurrent external Git processes. Unsupported merge,
rebase, unmerged index, detached/worktree/submodule/redirected configurations must be
identified; support only proven cases, otherwise refuse with no modification.

Before UI work, choose and prove the index strategy (for example an isolated temporary
index plus guarded ref/index reconciliation). An example is not an approved algorithm.
Document selected-path post-commit index semantics and recovery across object creation,
HEAD publication and index reconciliation; these are not magically atomic together.
Never overwrite an external index/HEAD to repair a partial result. Reopening must detect
a published commit after a lost response and avoid duplicate checkpoints. Preserve
ambiguous state with instructions; Git recovery is separate from editor journals.

### No project-controlled command execution

Use argument arrays, bounded subprocess/output, safe path handling and an allowlisted
environment. Prove hooks, clean/smudge/process filters, external diff/text conversion,
fsmonitor, signing helpers, pagers, config includes/redirects and attributes cannot run
unexpected commands or redirect writes. Do not assume a local status/diff is inert.
Unsupported transformations are refused, not silently bypassed with different bytes.
No remote fetch/push, credential lookup or project-controlled executable invocation.
Record the security/index decision in a focused ADR and tests before checkpoint writes.

**V1 gate:** actual Git repositories on both targets prove exact commit-tree content,
first commit, text/binary/deletion behaviour, identity handling, unrelated staged/worktree
preservation, partially staged selected-path refusal, stale review rejection, hostile
configuration non-execution, symlink/path substitution, external index/HEAD races and
interruption at each publication boundary. A successful exit code alone is insufficient.
If the contract cannot be proven, report `blocked` here; do not substitute blanket
staged-index refusal or a UI that claims the safety foundation is complete.

## 8. 1G.3b — Git UI and capability closure

Add the supporting Git surface: unavailable/clean/changed states, separate staged and
working changes, selection, inert bounded diff, binary summary, exclusions/dependency
messages, identity/message entry and explicit checkpoint confirmation. Use the V1 review
token; stale/busy/failure outcomes preserve user selection/message and require refresh
where appropriate. Show resulting commit identity and exact included file list only after
the verified result. Keep Git state independent of persistence/recovery indicators.

**V2 gate:** real service plus UI and packaged tests demonstrate the reviewed set equals
the actual commit, unrelated staging survives, stale confirmation is refused, missing
Git/identity/no-repo are usable, drafts are truthful, cancellation/session replacement
cannot commit to another project, and success-after-lost-response is recognised. Include
keyboard/focus/resize and hostile output rendering. Then review G1/R1/R2/V1/V2 evidence
on the final candidate; 1G remains unaccepted until its supported-target gate and user
review are complete. [1H](phase-1h-vertical-slice-acceptance.md) needs separate selection.

## 9. Verification and checkpoint handoff

Run relevant cheap checks first: `python3 scripts/validate.py`, `git diff --check`,
and, from `app/`, `npm run check`, `npm run build`, `cargo fmt --check --all` and
`cargo test -p loomlight-core --locked`. Use targeted regressions while developing;
retain the repository's SDK/source regression commands where affected. Desktop/package
commands and the existing supported-target workflow remain governed by
[TESTING](../../TESTING.md). Do not invent a parallel CI controller or widen privileges.

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
