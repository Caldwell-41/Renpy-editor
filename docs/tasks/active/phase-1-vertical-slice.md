# Plan: Phase 1 complete authoring vertical slice

**Updated:** 2026-09-16<br>
**Status:** Phase 1A–1D integrated correction merged; one bounded Phase 1D UI operation/Flush follow-up is active. Phase 1E–1H are planned, unapproved and unstarted.<br>
**Scope:** Production vertical slice; no Phase 2+ implementation

## Purpose and authority

Turn the accepted Phase 0 architecture into a small but genuinely usable Loomlight workflow without collapsing the initial product into one implementation task. Read [CURRENT](../../status/CURRENT.md) for present gate state, the [integrated corrective record](../archive/2026-09-15-phase-1a-1d-integrated-corrective.md) and its [completed follow-up](../archive/2026-09-15-phase-1a-1d-correction-follow-up.md) for accepted 1A–1D evidence.

This amended plan authorises no application implementation. Each milestone requires explicit user approval and a bounded execution brief. Internal checkpoints are dependencies within that milestone, not permission to proceed past the approved boundary. Earlier closure evidence remains valid only for the code state and cases it actually tested.

## Product target and fixed decisions

A user can create a conventional Ren'Py project, select/install and pin the supported SDK, configure resolution, safely persist/close/reopen, create Characters/Appearances/Assets/basic Variables, visually author a small branching VN, use Scene/Source/Branches, validate/run, checkpoint locally in Git, and continue after restart.

- Targets are Windows x86-64 and macOS Apple Silicon ARM64. Tauri 2 is the production shell; Phase 0 spikes remain evidence, not production services.
- `.rpy` bytes are authoritative. Editor metadata stores stable identity, mappings and convenience state; it is not a second runnable document. The game runs without `.renpy-editor/`; arbitrary existing-project import and reconstruction after metadata deletion remain deferred.
- The hierarchy is Project → Chapter → Scene → Beat. Chapters are organisational; each Scene normally owns one source file and globally unique primary label. Runtime flow is explicit, never inferred from tree order or filesystem parse order. Cosmetic names, technical identifiers, paths and UUIDs are distinct.
- A staged, SDK-validated creation preserves normal Ren'Py starter menus, save/load, preferences, history/rollback infrastructure, and conventional `game/images/`, `game/audio/`, `game/gui/` paths. Optional local Git initialization is on by default.
- Imported assets are copied into the project with safe paths, truthful discovery and duplicate/missing checks. Appearances use stable IDs and extensible attributes; Phase 1 exposes expression with default outfit/pose and a static imported render source. Later rendering strategies extend rather than replace those references.
- Placement, transitions and audio are extensible references/events. Initial controls expose Left/Centre/Right, None/Dissolve/Fade, play/stop music and play SFX. Variables support bool/int/string and simple representable assignments, not arbitrary Python expressions.
- All accepted edits use one transaction/history path. Natural typing bursts may be buffered briefly; automatic persistence and Ctrl/Cmd+S flush share the same boundary. Saved/Saving/Pending validation/Conflict/Recovery required are meaningful states. Undo/redo never overwrites external revisions.
- Unsupported/custom code remains exact, visible and protected. The embedded preview reconstructs only supported scene-local state and marks unknown/runtime-dependent effects; the official SDK is the fidelity authority. Normal Run Game is included; correct Run From Here is deferred.
- Scene, Source and Branches are major workspaces; Characters, Assets, Variables, Diagnostics/Runtime, Git and setup are supporting surfaces. Use [Quiet Studio Dark](../../UI.md), semantic tokens and accessible interactions, not independent feature-specific visual languages.
- Scene file operations must handle obsolete `.rpyc` derivatives through the approved transaction contract when an old `.rpy` path is removed. Never leave executable ghost scripts after supported move/delete.
- Phase 1 excludes the UI Designer, Timeline, advanced state/reachability analysis, arbitrary transforms/ATL, LLM assistance, GitHub remotes, plugin infrastructure, arbitrary project import, and signing/notarisation.

## Scene UX baseline

The resizable vertical Preview/Beats allocation starts near 52/48, preserves the game aspect ratio and keeps Beats readable. Beats are the primary writing surface and selected rows expand inline. Enter inserts a newline; Ctrl/Cmd+Enter commits the natural edit burst and creates the next Dialogue beat. Speaker carry-forward is convenience, not hidden story state.

Appearance and placement changes are explicit beats. Preview selection distinguishes the contributing earlier beat from a new change at the current point: Edit Beat N versus Add change here. Choice supports an arbitrary list of unconditional options and Create New Scene in its destination picker. Audio audition is explicit, never repeatedly triggered by beat selection. Provide keyboard Move Up/Down as well as drag affordances. Opaque boundaries block unsafe relocation. View in Source becomes fully navigable with 1F; until then, label the deferred action honestly rather than shipping a nonfunctional control as complete.

## Implementation sequence and gates

### 1A — Production scaffold

Historical implementation: [production scaffold](../archive/2026-09-14-phase-1-production-scaffold.md). Preserve the Tauri workspace, locked toolchains, typed command boundary, main-WebView capability/CSP restrictions, safe ports, semantic theme tokens, reduced-motion support and packaged denial tests. No new desktop architecture is required by the current review.

**Gate:** Windows/macOS packaging and authorised/unauthorised WebView probes pass without widening renderer privileges. Historical passes do not replace the integrated corrective gate.

### 1B — Transaction, file coordination, and recovery foundation

Historical implementation: [transaction brief](../archive/2026-09-14-phase-1-transaction-recovery.md), [corrective evidence](../archive/2026-09-14-phase-1b-corrective-transaction-recovery.md), and [transaction contract](../../TRANSACTIONS.md).

Retain exact base-byte/hash/platform-identity checks, handle-anchored paths, retained accepted/displaced evidence, no-replace creation and serialized commit/recovery/flush. Multi-file changes are recoverable sequences, not all-files atomic commits or portable compare-and-swap. The active follow-up owns the remaining resource-limit and correctness repairs; 1E owns new file-lifecycle semantics required by Scenes.

**Gate:** actual stale-write, substitution, non-cooperating-writer, process-termination, evidence-retention and follow-up-write regressions pass on both targets. Bounded resource use must not impose a lifetime limit on successful authoring.

### 1C — Project lifecycle and SDK foundation

Historical implementation: [project lifecycle](../archive/2026-09-14-phase-1c-project-lifecycle.md), [SDK/lifecycle correction](../archive/2026-09-14-phase-1c-corrective-lifecycle.md), [durability/race correction](../archive/2026-09-14-phase-1c-durability-race-remediation.md) and [single-instance correction](../archive/2026-09-14-phase-1c-single-instance.md).

Preserve Welcome/Recent Projects, title/folder/parent/path preview, discovered/installed/browsed compatible SDK selection, resolution, Review & Create, optional Git initialization, safe staging and no-replace finalisation. Preserve the exact-version SDK/provenance and child-process trust boundaries. A losing application process must never initialise independent lifecycle state.

Retain inspected candidate authority until activation, prepare before replacing the healthy current session, and distinguish session IDs from stable project IDs. Close/switch invalidates the old authority and import selections. Stale requests and UI completions cannot retarget another session.

**Gate:** create/validate/close/reopen and failed-switch behavior, SDK/Recent Projects crash consistency, stage/parent/promotion races, single-instance ownership and metadata-free runtime checks pass on both targets.

### 1D — Supporting authoring models: Characters, Appearances, Assets, Variables

Historical implementation: [supporting authoring task](../archive/2026-09-15-phase-1d-supporting-authoring.md). The integrated checkpoint merged through PR #7; the active [UI operation/Flush follow-up](2026-09-15-phase-1d-ui-operation-follow-up.md) must close before 1E approval.

Preserve Character technical variable/display name/dialogue colour/default appearance; extensible Appearance attributes and Asset references; copied backgrounds/character images/music/SFX; and typed Variable defaults. Source remains conventional Ren'Py with minimal verified edits and stable UUIDs. The [completed follow-up](../archive/2026-09-15-phase-1a-1d-correction-follow-up.md) records accepted lexical context, metadata reloadability, compatibility repair, exact discovery and session-safe supporting UI behavior.

**Gate:** accepted definitions reload and match runnable source; IDs and unknown metadata survive; physical availability/collisions and discovery agree with the pinned SDK; supporting authoring and truthful persistence/Flush work in the packaged app. All integrated follow-up blockers must close before 1E can be approved.

### 1E — Scene authoring

**Entry:** corrected 1A–1D supported-target closure plus explicit user approval. Execute the following internal checkpoints in order, with separate recorded evidence. Do not attempt one undifferentiated Scene/UI implementation.

#### 1E.1 — Source, hierarchy, file lifecycle and history prerequisites

Implement the minimum production source/range and semantic-operation foundation required to safely create, edit and reorder the approved beat subset. Original bytes, verified ranges, stable IDs, lexical context and opaque boundaries are authoritative. Reuse/extend the safe definition foundation; do not introduce a second exporter or disposable scene-document model. The full Source workspace and broader direct-edit reconciliation remain 1F, not prerequisites for implementing their UI early.

Extend the one-Chapter/one-Scene metadata/lifecycle assumptions to supported multiple Chapters and Scenes. Specify schema/capability changes, safe migration of existing Loomlight projects, validation, ordering, selection fallback and reopen. Preserve existing UUIDs and unknown fields; do not use this work as arbitrary-project import.

Design and test the narrow file-lifecycle transactions Scenes require before wiring destructive UI: source create/move/delete, companion metadata/reference changes, destination absence, retained evidence, inverse operations and removal of obsolete corresponding `.rpyc` files. Include directories only as needed for supported Chapter/Scene organisation. A display rename must not implicitly rename technical labels or source files. General project-wide technical renaming remains deferred.

Define incoming-reference policy before deletion: refuse or require an explicit supported resolution; never silently retarget choices/jumps or discard custom references. Unknown reference ownership means refusal where safety cannot be proven. Specify nonempty/entry-scene invariants and last-selection fallback. Story-tree reordering is organisational, not implicit execution flow.

Integrate history with committed source/metadata operations. Test edit → undo → redo using the revisions/identities actually returned after each commit, plus repeated undo/redo, create/move/delete inverses, failed inverse commits and external boundaries. A cursor-only history helper is not end-to-end evidence.

**Gate:** production-service tests prove multi-Scene migration/reopen, minimal patches, opaque-boundary refusal, reference-safe lifecycle, inverse/history behavior, crash recovery and no stale-bytecode execution. No Scene UI write path may bypass this foundation.

#### 1E.2 — Functional Scene authoring and minimum recovery UX

Implement the approved beat set: background/scene, show/hide Character, change appearance, placement reference, dialogue, narration, play/stop music, play SFX, transition reference, simple assignment, unconditional Choice, Jump, Return/End and protected Custom Code representation. Reference stable supporting entities, not filenames. Newly created Scenes are valid and normally end with a visible Return/End beat.

Implement Story-tree Chapter create/display-rename/reorder and Scene create/display-rename/reorder/move/delete under 1E.1's policies. Choice Create New Scene creates the destination and the same semantic edge later used by Branches. Define end/return/jump behavior explicitly; no fall-through based on file ordering.

Use short-lived typing buffers with explicit commit/cancel and navigation/close behavior. Preserve input on validation failure, group natural edits for undo, and ensure Ctrl/Cmd+S accurately handles pending accepted work without falsely claiming unsubmitted input was saved.

This checkpoint owns the minimum usable recovery workflow for the supported transaction states, before the Scene authoring gate: inspect a blocked project without executing it, explain affected files/evidence, offer only safe supported resolution choices with explicit user intent, retain accepted/displaced bytes, revalidate the chosen resolution, and resume editing only after a valid terminal outcome. Ambiguous cases remain blocked with non-destructive guidance. Merely acknowledging a journal or deleting recovery data is not content resolution. Advanced merge tooling and retention/pruning remain later work; generic Git restore is not a substitute.

Continuous editor diagnostics here are non-executing static checks. Do not run SDK compile/lint automatically while typing or opening a user-controlled project.

**Gate:** the representative mini-game can be authored with the approved subset, edits/history stay coherent across supporting surfaces, and controlled interrupted/conflicting transactions can be understood and safely resolved through the minimum UI. SDK behavior is checked on synthetic controlled fixtures, not by silently executing users' projects.

#### 1E.3 — Scene-local preview, media presentation and visual conformance

Implement the agreed Preview/Beats split, inline writing, explicit staging, visual asset pickers and scene-local reconstruction through the selected beat. Record provenance for displayed state. Unknown Python/custom effects invalidate relevant certainty; retaining an earlier value must not present it as proven current state. Do not infer branch-global state or repeatedly audition audio while navigating.

Provide a core-mediated, read-only, session-scoped media presentation boundary for thumbnails, supported preview assets and explicit audition. Specify byte/dimension/format bounds, caching/invalidation, cancellation and disposal on session change. Deny traversal, stale sessions, remote/active content and unapproved paths. Do not grant generic filesystem access or relax CSP to make previews work.

Review actual rendered surfaces against Quiet Studio Dark: typography, spacing, hierarchy, preview surround, compact/expanded beats, inspector, hover/focus/selection, empty/error/conflict states and responsive collapse. Preserve aspect ratio without sacrificing Beats readability. Test keyboard navigation, labelled controls, focus restoration, accessible reorder and reduced motion. No dashboard cards, gradients/glass or accent overuse.

**Gate:** actual Preview/Beats interactions, intentional audition, media-denial cases, fidelity/partial-state fixtures, accessibility and visual-conformance evidence pass on both supported targets. Full 1E closure requires all three internal gates; 1F still needs separate approval.

### 1F — Source synchronisation and partial-visual handling

**Entry:** 1E closure and explicit approval. Extend the existing source foundation; do not replace it.

Implement the Source centre workspace, conservative partial CST/range mapping, minimal patches, supported direct edits, bidirectional Scene/Source selection and exact Custom Code preservation. Track source byte offsets separately from decoded editor positions; cover Unicode, BOM/newlines and selection remapping. The Scene and Branches semantic projection must never become a competing authoritative document.

The execution brief must define editing states before UI work: unsubmitted/incomplete buffer, deliberately accepted source, invalid syntax, supported versus unsupported syntax, stale last-valid visual projection, ordinary external conflict, and unresolved transaction recovery. Invalid-but-deliberately-saved source requires an explicit policy and must not make the visual view claim current validity. Specify save, undo, navigation, close and restart behavior without silently discarding buffers.

Ordinary external divergence may be isolated to an affected file/Scene where safe. Unresolved mixed-file transactions, uncertain project identity or ambiguous recovery retain the wider write block required by TRANSACTIONS. Do not weaken central recovery blocking to make unrelated scenes editable. Debounce watcher events, compare hashes, invalidate stale mappings, distinguish own writes, and fail safely on ambiguous revisions.

**Gate:** golden no-op/minimal-patch cases, actual Source → Scene and Scene → Source updates, opaque/invalid regions, selection mapping, undo grouping, external edit races and restart behavior pass without collateral changes. Demonstrate both safe file-local isolation and mandatory project-level blocking for unresolved recovery.

### 1G — Branches, validation/run, diagnostics, and local Git

**Entry:** 1F closure and explicit approval. Use three internal gates, not one broad implementation claim.

#### 1G.1 — Branches

Render the basic Scene/label/choice graph from the same semantic edges as Scene. Navigate to source Choice/Jump and destination Scene. Define terminal/return behavior and visible dangling destinations; graph operations use the shared transaction model. Do not add a parallel graph truth, conditional authoring, advanced reachability/state analysis, mature minimap/search or Run From Here.

**Gate:** two routes, jumps/returns, destination creation/removal policy, dangling references and bidirectional navigation stay coherent across Scene, Source and Branches on both targets.

#### 1G.2 — Explicit SDK validation, normal Run Game and diagnostics

Use the pinned adapter for authoritative validation and normal-entry runtime. Compile/lint/test/run may execute project-controlled code: require explicit trust and action, distinguish this from static editor diagnostics, and never invoke the SDK automatically on untrusted open, preview, import or typing. Specify trust scope/invalidation rather than treating a project UUID as permanent executable trust.

Flush the intended accepted revision before execution; refuse unresolved recovery and report pending buffers honestly. Define child-process lifecycle, stop/cancellation, bounded output, stale diagnostics, project switching while running, and coordination with file lifecycle/compiled artifacts. A game session is user-controlled and must not inherit a short one-shot validation timeout as its entire allowed lifetime.

**Gate:** actual SDK compile/lint failure and diagnostic navigation, correct source revision, explicit trust refusal, normal run/stop, output bounds and lifecycle/session races pass. Process launch alone does not prove the authored route ran.

#### 1G.3 — Local Git checkpoint

Implement only local status, diff and user-confirmed checkpoint. Specify which files are included, how an existing staged index is preserved, how external edits between preview and commit are handled, and how identity/missing Git are reported. Do not use blind `git add .` or silently include unrelated staged/private files. Project-controlled hooks, filters, external diff and configuration require an explicit non-execution/trust policy; a local Git operation is not automatically inert.

Keep subprocess/path/session safeguards and distinguish a Git checkpoint from journalled editor recovery. Reset, checkout/restore, destructive clean, remotes, authentication and force-push remain outside 1G.

**Gate:** actual status/diff/checkpoint match the user-reviewed file set, leave unrelated index/worktree changes intact, reject stale changes, and demonstrate hostile configuration handling on both targets. Extend Quiet Studio Dark consistently across technical surfaces.

### 1H — Vertical-slice acceptance

**Entry:** 1G closure and explicit approval. This is acceptance of implemented capabilities, not a place to hide missing feature work.

Run the following with synthetic, repository-safe content from fresh checkouts on Windows x64 and macOS ARM64:

1. Create a project with local Git and verify standard Ren'Py menu/save/load behavior.
2. Create two Characters and Appearances; import backgrounds, character images, music and SFX; define bool/int/string values including an exact large integer.
3. Author multiple Chapters/Scenes, dialogue, staging, appearance/placement, audio and assignments; assert the intended source and runtime values/assets, not only entity counts.
4. Create an unconditional Choice and two destinations. Run both routes and verify their outcomes and common semantic edges.
5. Reorder and edit beats, undo and redo repeatedly; verify source, metadata, views and committed revisions agree.
6. After compilation, move/delete a disposable Scene safely. Verify incoming-reference policy, inverse behavior, close/reopen and no orphan `.rpyc`/duplicate-label execution.
7. Edit supported Source and observe Scene/Branches synchronization; introduce unsupported/incomplete/external content and prove lossless protection, truthful stale/partial states and controlled reconciliation.
8. Validate, navigate real diagnostics, perform explicit normal run/stop, and create a Git checkpoint containing exactly the reviewed changes.
9. Close/reopen and continue with valid workspace selection. Run a copy without `.renpy-editor/`.
10. Interrupt mixed transactions and preserve competing external writes. Use the minimum recovery workflow to inspect, explicitly resolve safe cases and continue; prove ambiguity remains blocked without deleting evidence.
11. Exercise failed project switches, old-session requests, delayed/reordered successes/errors, cancelled import and rapid navigation. Prove no wrong-session effects, obsolete navigation or false Saved state.
12. Exercise metadata limits, precision, discovery/case collisions and long terminal history. Confirm accepted data remains reloadable and the project remains writable beyond the former journal-count boundary.

**Phase 1 closes only when** the real workflow plus transaction/recovery, golden-source, privacy/security, packaged WebView/single-instance/media, accessibility and visual-system gates pass on both supported targets. Record exact tested commits, commands, outcomes, run/job IDs, evidence and remaining limitations. Source-label checks and skipped SDK wrappers are not behavioral acceptance.

## Ownership and scope discipline

The current 1A–1D follow-up repairs existing operations only. 1E.1 owns new multi-Scene/schema/source/file-lifecycle/history prerequisites; 1E.2 owns minimum recovery UX; 1E.3 owns media presentation/preview. 1F owns the full Source workspace and broader external reconciliation. 1G owns Branches, explicit SDK runtime/diagnostics and local Git. 1H verifies them. Advanced recovery and full analysis remain Phase 3/4 work.

Resolve detailed schemas, limits, references, deletion policy, dependencies and test fixtures in the owning bounded brief before implementation. Preserve the approved source/security architecture and document material changes with ADRs where needed. Do not implement an earlier milestone with an unsafe shortcut merely because a later milestone will add a larger subsystem.

Update canonical docs as behavior changes. Preserve historical evidence, archive completed briefs only after their actual gates pass, and keep CURRENT/HANDOVER/AGENTS/index consistent. Use cheap targeted checks during development, one complete final supported-target matrix per changed candidate, and no expensive package matrix solely for documentation amendments. No later milestone begins without explicit approval.
