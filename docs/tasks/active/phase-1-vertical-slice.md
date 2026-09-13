# Plan: Phase 1 complete authoring vertical slice

**Status:** Planned; implementation requires explicit user approval<br>
**Scope:** Production vertical slice after the scaffold gate; no Phase 2+ features

## Purpose

Turn the accepted Phase 0 architecture into a small but genuinely usable Loomlight
workflow without collapsing the whole initial product into one implementation task.
The first implementation task remains the bounded
[production scaffold](phase-1-scaffold.md). This plan governs the milestones that
follow once each prior gate passes.

## Product target

A user can create a new Loomlight project, select/install and pin the supported Ren'Py
SDK, configure resolution, save/persist it safely, close and reopen it, create
characters/assets/basic variables, visually author a small branching VN with Scene,
Source, and Branches, validate and run it with Ren'Py, create a local Git checkpoint,
and continue editing after restart.

The generated game remains conventional Ren'Py and runs when `.renpy-editor/` is
absent. It retains the normal Ren'Py starter GUI/runtime infrastructure needed for a
working main menu, save/load, preferences, and related standard screens without
requiring Phase 1's deferred visual UI Designer. General import/reconstruction of
arbitrary existing Ren'Py projects is not part of Phase 1.

## Fixed Phase 1 product decisions

- Supported platforms: Windows x86-64 and macOS Apple Silicon ARM64 only.
- Tauri 2 production shell; Phase 0 spike code remains disposable evidence.
- `.rpy` files are authoritative runnable truth; editor metadata never replaces them.
- Loomlight-created hierarchy is `Project → Chapter → Scene → Beat`.
- Each Loomlight-created Scene normally owns one `.rpy` file and one globally unique
  primary technical label. Chapters are organisational folders, not Ren'Py runtime
  semantics.
- `script.rpy` stays small and routes the normal entry point into authored scenes.
- The generated scaffold preserves conventional Ren'Py starter GUI/screens so a newly
  created game has standard menu/save/load/preferences behavior before Loomlight gains
  visual screen authoring.
- Project creation is staged and SDK-validated before finalisation.
- Project lifecycle explicitly includes create, automatic transactional persistence,
  explicit save/flush, close, Recent Projects, load/reopen, and continuation.
- `Initialize Git repository` is offered at project creation and enabled by default.
- Assets imported in Phase 1 are copied into the project; external absolute asset
  references are deferred.
- Functional major workspaces are Scene, Source, and Branches. Characters, Assets,
  Variables, Diagnostics/Runtime, Git, and project setup are supporting surfaces.
- Character visuals use extensible appearance attributes. Phase 1 exposes expression;
  outfit and pose are implicit defaults. The model must later admit outfits, poses,
  layered images, animation, and additional appearance dimensions without replacement.
- Placement, transition, and audio use extensible references/events. Phase 1 exposes
  Left/Centre/Right, a tiny transition set such as None/Dissolve/Fade, play/stop music,
  and play SFX.
- Phase 1 variables support `bool`, `int`, and `string` with simple assignment only.
- Scene Editor Preview reconstructs supported scene-local state through the selected
  beat and marks unsupported/runtime-dependent state as partial rather than guessing.
- Normal Run Game is included; correct arbitrary Run From Here is deferred with state
  simulation.
- Accepted visual/source edits share one transaction path. Natural typing bursts may be
  buffered briefly, but no long-lived visual document competes with source.
- Save state is visible (`Saved`, `Saving`, `Pending validation`, `Conflict`,
  `Recovery required`). `Ctrl/Cmd+S` explicitly flushes/confirms durability.
- Undo/redo spans the shared transaction stream but never overwrites a newer external
  revision.
- Unsupported/custom source remains exact, visible in sequence, and protected from
  unsafe visual relocation.
- Phase 1 does not include general existing-project import, UI Designer, Timeline,
  LLM assistance, GitHub remotes, advanced state simulation, arbitrary transform/ATL
  authoring, or signing/notarisation.

## Scene UX baseline

- Centre workspace uses a resizable vertical Editor Preview / Beats split, defaulting
  to approximately 52% / 48%, with aspect-ratio-preserving preview and protected Beats
  readability.
- Beats are the primary high-frequency authoring surface; selected rows expand inline.
- Normal `Enter` remains newline; `Ctrl/Cmd+Enter` creates the next Dialogue beat.
- Appearance/staging changes are explicit beats. Convenience controls may insert those
  beats but must not hide generated mutations inside dialogue.
- Clicking a visible preview Character distinguishes the contributing prior beat from a
  new change at the current point (`Edit Beat N` vs `Add change here`).
- Choice supports an arbitrary list of unconditional options even though the acceptance
  fixture uses two; the destination picker may create a new Scene and link it.
- Audio does not auto-audition while scrubbing beats; audition is explicit.
- Custom Code beats can navigate to Source but cannot be freely reordered across
  supported content unless safety is proven.
- Scene, Source, and Branches navigate bidirectionally over one semantic model.

## Implementation sequence

### 1A — Production scaffold

Follow [phase-1-scaffold.md](phase-1-scaffold.md) exactly. Create only the production
Tauri workspace, command/capability boundary, empty production ports, locked
build/test setup, and cross-platform packaged smoke. Do not implement authoring.

**Gate:** scaffold acceptance criteria are green on both supported platforms.

### 1B — Transaction, file coordination, and recovery foundation

Implement the production source/file transaction boundary before any visual authoring
is permitted to write project source. Close Phase 0 Gate E rather than assuming the
spike's check-then-replace behavior is production-safe.

Required evidence includes stale revision/path/file identity changes, non-cooperating
external writer races, symlink/path substitution, crash points, recovery retention,
undo/redo boundaries, and platform durability semantics. Use stronger platform
replace/exchange/backup primitives where appropriate, but preserve competing external
data instead of making an unprovable compare-and-swap claim.

**Gate:** no accepted edit is silently lost or overwrites an external revision in the
specified race/recovery suite on Windows x64 and macOS ARM64.

### 1C — Project lifecycle and SDK foundation

Implement Welcome/Recent Projects and the New Project workflow:

1. title, editable folder name, parent directory, final path preview;
2. detected compatible SDK / verified install of supported SDK / browse existing SDK;
3. resolution preset or custom dimensions;
4. Review & Create with Git initialisation checked by default;
5. staged generation, metadata creation, optional Git init, SDK validation, finalise;
6. open `Chapter 1 → Scene 1`.

Generate the documented conventional project paths and metadata contract. Preserve the
normal Ren'Py starter GUI/runtime files needed for standard main-menu, save/load,
preferences, history/rollback behavior where provided by the supported SDK template;
Phase 1 does not visually author those screens. Support close/reopen from Recent
Projects and Open Loomlight Project. Metadata deletion must not break the game, but
Phase 1 does not reconstruct deleted metadata.

**Gate:** create → validate → close → reopen works on both targets; the generated game
runs with its standard Ren'Py menu/save/load infrastructure and also runs without
`.renpy-editor/`.

### 1D — Supporting authoring models: Characters, Assets, Variables

Implement bounded supporting surfaces and source definitions:

- Character: technical variable, display name, dialogue colour, default appearance;
- Appearance: stable ID, extensible attributes, Phase 1 expression + implicit default
  outfit/pose, static imported asset render source;
- Assets: copied project-owned backgrounds, character images, music/SFX and required
  basic project/UI asset references with missing/duplicate checks;
- Variables: `bool`, `int`, `string` definitions/defaults and simple assignment model.

Keep IDs separate from paths and display names. Do not make expression-only or raw-file
references architectural assumptions.

**Gate:** supporting definitions round-trip through ordinary Ren'Py source and reload
with stable editor identity.

### 1E — Scene authoring

Implement the first polished Scene workspace and the bounded visual Beat set:
background, show/hide Character, change appearance, placement reference, dialogue,
narration, play/stop music, play SFX, transition reference, simple variable assignment,
unconditional choice, jump, return/end, and Custom Code representation.

Implement the agreed Preview/Beats sizing, inline dialogue flow, beat insertion/reorder,
scene-local preview reconstruction, partial-preview indication, visual asset pickers,
choice destination/create-scene flow, and continuous lightweight diagnostics.

**Gate:** the representative Phase 1 mini-game can be authored without routine manual
Ren'Py scripting and produces clean conventional source.

### 1F — Source synchronisation and partial-visual handling

Implement the production Source workspace, conservative partial CST/range mapping,
minimal patches, supported direct source edits, bidirectional Scene/Source selection,
and exact unsupported/custom-code preservation. Reconcile external edits and block only
affected files/scenes when safe rather than freezing unrelated work.

**Gate:** golden no-op/minimal-patch tests, direct source→Scene updates, unsupported
region preservation, and external conflict cases pass without collateral byte changes.

### 1G — Branches, validation/run, diagnostics, and local Git

Implement the basic Scene/label/choice graph from the same semantic edges used by
Scene; do not create a parallel graph truth. Add authoritative SDK Validate and
normal-entry Run Game, diagnostics navigation, and local Git status/diff/checkpoint.

Advanced graph reachability/state analysis, minimap/search maturity, Run From Here,
and GitHub remotes remain later work.

**Gate:** choice/scene graph navigation, SDK diagnostics navigation, normal game run,
and local checkpoint work end-to-end on both targets.

### 1H — Vertical-slice acceptance

Exercise a real workflow from a fresh checkout on both supported platforms:

1. create a project and initialise Git;
2. confirm the untouched generated game launches with standard Ren'Py menu/save/load
   behavior;
3. create two Characters and appearances;
4. import a background, two character images, music, and SFX;
5. define at least one simple variable;
6. author several dialogue/staging/audio beats;
7. change an appearance/placement explicitly;
8. set the variable;
9. add a Choice and create/link two destination Scenes;
10. reorder a beat, undo, and redo;
11. edit supported dialogue directly in Source and observe Scene synchronisation;
12. introduce unsupported/external source and verify protected Custom Code behavior;
13. validate and navigate diagnostics;
14. run the game through the pinned SDK;
15. create a local Git checkpoint;
16. close Loomlight, reopen the project, and continue with appropriate editor state;
17. confirm the game still runs with `.renpy-editor/` removed from a copy.

**Phase 1 closes only when** Windows x64 and macOS ARM64 pass this workflow plus the
transaction/recovery, golden-source, privacy/security, and packaged application gates.

## Deferred implementation details

The milestone implementing each area should resolve and test details such as exact JSON
schemas, technical-ID generation/collision rules, duplicate asset naming policy,
precise recovery/conflict dialog copy, deletion/reference semantics, and exact locked
dependency versions. These are implementation details, not reasons to broaden Phase 1
product scope before work begins.

## Documentation discipline

Each milestone gets its own bounded active task before implementation, updates
canonical docs when behavior changes, records exact validation and target evidence,
and must pass its gate before the next milestone begins. Do not treat this whole plan as
a single open-ended coding task.
