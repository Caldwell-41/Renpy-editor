# Phase 1 planning handover

**Prepared:** 2026-09-14<br>
**Phase:** Phase 0 complete; Phase 1 product/UX plan defined; implementation not yet approved<br>
**Repository:** `Caldwell-41/Renpy-editor` (confirmed private)<br>
**Branch:** `main`

## Read first

1. [`AGENTS.md`](../../AGENTS.md)
2. [Current status](CURRENT.md)
3. [Phase 1 vertical-slice plan](../tasks/active/phase-1-vertical-slice.md)
4. [Phase 1 production scaffold](../tasks/active/phase-1-scaffold.md)
5. [UI](../UI.md), [data model](../DATA_MODEL.md), and [architecture](../ARCHITECTURE.md)
6. [ADR 0001](../adr/0001-lossless-source-model.md),
   [ADR 0002](../adr/0002-versioned-renpy-sdk-adapter.md), and
   [ADR 0003](../adr/0003-tauri-desktop-runtime.md)

The approved product brief remains authoritative. Planning is substantially defined,
but **do not implement Phase 1 without explicit user approval**. When approval is
given, begin only with the bounded scaffold task; do not treat the vertical-slice plan
as permission for an open-ended implementation run.

## Accepted Phase 0 boundaries

- Windows x86-64 and macOS Apple Silicon ARM64 are the only supported targets.
- `.rpy` files are authoritative and losslessly preserved; unsupported/ambiguous source
  stays opaque and visible rather than being normalised away.
- Ren'Py 8.5.3 is the verified initial SDK compatibility baseline behind an exact-
  version adapter and checksum-first staged installer.
- Tauri 2 is the selected desktop runtime with an unprivileged UI and narrow Rust core;
  Electron remains the ADR-defined fallback.
- Projects, generated content, IPC payloads, archives, and later LLM output are
  untrusted. Opening source never executes project Python; runtime/SDK operations cross
  an explicit trust boundary.
- Phase 0 code under `spikes/` is disposable evidence and must not become the production
  application by copying it wholesale.

## Phase 1 product decisions now fixed

- New Loomlight project creation only; arbitrary existing-project import is deferred.
- Project wizard: title + editable folder name + parent location; compatible detected
  SDK / verified supported SDK install / browse existing SDK; resolution preset/custom;
  review screen with local Git initialisation enabled by default; staged creation and
  SDK validation before finalisation.
- Projects can be transactionally persisted, explicitly flushed/saved, closed, shown in
  Recent Projects, and loaded/reopened. The game still runs if `.renpy-editor/` is
  absent, but Phase 1 does not reconstruct deliberately deleted metadata.
- Project hierarchy is Project → Chapter → Scene → Beat. Chapters map naturally to
  organisational folders. Each Loomlight Scene normally has its own `.rpy` file and a
  stable globally unique technical label; display names are separate.
- Functional major workspaces are Scene, Source, and Branches. Supporting surfaces are
  Characters, Assets, Variables, Diagnostics/Runtime, Git, and project setup.
- Scene uses a resizable ~52/48 Editor Preview/Beats split; Beats are the primary
  authoring surface with compact/expanded inline rows. `Ctrl/Cmd+Enter` creates the next
  Dialogue beat while normal Enter remains newline.
- Editor Preview reconstructs supported scene-local state through the selected beat.
  Unsupported/Python/runtime-dependent state is visibly partial. Clicking a persistent
  preview Character distinguishes editing its contributing beat from adding a new
  change at the current point.
- Appearance/staging changes remain explicit beats. Characters use extensible appearance
  attributes; Phase 1 exposes expression while outfit/pose are implicit defaults.
  Future outfits, poses, layered images, animation, or extra appearance dimensions must
  extend this model rather than replace it.
- Assets are copied into the project. Phase 1 variables are `bool`, `int`, and `string`
  with simple assignment. Placement, transition, and audio are extensible references;
  the initial UI exposes Left/Centre/Right, a tiny transition set, music play/stop, and
  SFX.
- Choices are first-class beats and support an arbitrary list of unconditional options;
  destination selection may create a new Scene. Scene and Branches use the same edge
  model.
- Custom/unsupported source appears in place, navigates to Source, and is protected from
  unsafe movement. Supported direct source edits synchronize back to Scene.
- Automatic persistence and `Ctrl/Cmd+S` share one transaction/recovery path. Save
  status is explicit; undo/redo does not cross an external-revision safety boundary by
  overwriting newer work.
- Phase 1 provides Validate and normal Run Game. Run From Here is deferred until state
  simulation can supply correct prior state.

## Required implementation sequence

1. **1A production scaffold** — clean production Tauri workspace/boundary/CI only.
2. **1B transaction/recovery** — close production Gate E before visual authoring writes.
3. **1C project lifecycle/SDK** — New Project, generated scaffold, save/close/reopen.
4. **1D Characters/Assets/Variables** — extensible supporting authoring models.
5. **1E Scene authoring** — agreed bounded Beat set and Scene UX.
6. **1F Source synchronisation** — production partial CST/minimal patches/custom code.
7. **1G Branches/Validate/Run/Diagnostics/Git** — complete the functional slice.
8. **1H cross-platform acceptance** — fresh end-to-end Windows/macOS vertical slice.

Each milestone must receive its own bounded active task and pass its gate before the
next begins.

## Highest retained engineering risk

Production file writing is still blocked by parser/file Gate E. Phase 0 proved useful
race detection and recovery behavior but did not establish portable compare-and-swap
against a non-cooperating external writer in the final validation-to-replace interval,
and equivalent Windows directory-entry durability was not proven. Milestone 1B must
resolve this using reviewed platform transaction/recovery semantics and tests before
production authoring writes are trusted.

## Deferred beyond Phase 1

General Ren'Py project import/reconstruction, UI Designer, Timeline, advanced ATL/
transform authoring, advanced state simulation and Run From Here, LLM assistance,
GitHub remote workflows, mature graph/reachability analysis, release signing/
notarisation, and broader release/distribution work.

## Phase 0 evidence closure

Final corrective quality, SDK, and desktop evidence remains recorded in the archived
Phase 0 tasks and research documents. The Phase 0 corrective implementation passed the
source/mapping, SDK, packaged Tauri/Electron, security, UI, media, graph, credential,
and target platform gates used to select the current architecture.

## Publishing rules

Confirm remote `main` before every write, commit coherently, and update it only by
fast-forward. Do not change visibility, force-push, rewrite history, discard unrelated
work, or commit generated packages/SDKs/credentials/logs/private content.
