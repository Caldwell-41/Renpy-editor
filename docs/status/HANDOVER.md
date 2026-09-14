# Phase 1 planning handover

**Prepared:** 2026-09-14<br>
**Phase:** Phase 1B corrective remediation complete; Gate E re-closed; Phase 1C not approved<br>
**Repository:** `Caldwell-41/Renpy-editor` (confirmed public)<br>
**Branch:** `main`

## Read first

1. [`AGENTS.md`](../../AGENTS.md)
2. [Current status](CURRENT.md)
3. [Phase 1 vertical-slice plan](../tasks/active/phase-1-vertical-slice.md)
4. [Completed Phase 1 production scaffold](../tasks/archive/2026-09-14-phase-1-production-scaffold.md)
5. [Completed Phase 1B corrective remediation](../tasks/archive/2026-09-14-phase-1b-corrective-transaction-recovery.md)
6. [Original Phase 1B transaction/recovery record](../tasks/archive/2026-09-14-phase-1-transaction-recovery.md)
7. [UI](../UI.md), [data model](../DATA_MODEL.md), and [architecture](../ARCHITECTURE.md)
8. [ADR 0001](../adr/0001-lossless-source-model.md),
   [ADR 0002](../adr/0002-versioned-renpy-sdk-adapter.md), and
   [ADR 0003](../adr/0003-tauri-desktop-runtime.md)

The approved product brief remains authoritative. The user explicitly approved Phase
1B on 2026-09-14. Phase 1C and every later milestone still require a new explicit
instruction.

## Completed Phase 1B correction

- The original Phase 1B implementation and run 34797222616 remain historical evidence,
  but Gate E was reopened after review found parent/path substitution windows, no safe
  `Prepared` cleanup path, and blocking terminal `Rejected` journals.
- The completed correction relocates all stage/accepted/backup evidence under anchored
  transaction recovery, persists relative artifact names, retains validated directory-
  handle chains, uses descriptor-relative no-follow operations on macOS/Unix, and pins
  Windows directory handles against rename/delete during `ReplaceFileW`.
- `Prepared` can be explicitly finalised only after flags and anchored entry checks
  prove no accepted/staged boundary was crossed. Pre-mutation `Rejected` is terminal
  and non-blocking; conflict and ambiguous recovery remain blocking.
- A later review found that recovery discovery still enumerated the anchored recovery
  directory through its pathname on Unix/macOS. That final gap is now closed: recovery
  discovery validates pathname identity against the retained recovery anchor, enumerates
  a duplicated directory descriptor with `fdopendir`/`readdir`, and revalidates the
  anchor afterward. A replaced/empty recovery pathname therefore fails closed instead
  of hiding unresolved transactions from Save/Flush. Windows continues pathname
  enumeration only while the recovery namespace is pinned by no-delete-share handles.
- [Production run 34804861387](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34804861387)
  at `dc2efdf845fd014c57e850f2c96683fd487da592` passed Windows x64 job
  103854628315 (31 passed, 0 failed, 1 ignored worker) and macOS ARM64 job
  103854628300 (33 passed, 0 failed, 1 ignored worker), including the new macOS/Unix
  recovery-path substitution regression. Both jobs also passed desktop tests,
  packaging, packaged denial smoke, secret scanning, and dependency/licence inventory.
  Evidence artifacts are 10332572412 (Windows) and 10333101940 (macOS); quality run
  34804861410 passed.
- Production run 34804735119 at `c0d881a4` is retained failed evidence: both target
  jobs stopped at `cargo fmt --check --all`; core and later steps were skipped. The
  exact formatting diff was corrected in `dc2efdf`. No functional failure was retried
  away.
- Phase 1C remains unapproved and was not started.

## Original Phase 1B foundation and evidence

- app/src-core/src/transaction contains the production multi-path transaction,
  identity/path checks, platform replacement adapters, alternating journal/recovery
  model, explicit flush semantics, and revision-guarded history foundation.
- ADR 0004 and docs/TRANSACTIONS.md are the canonical design/durability contract.
- Local locked core tests and strict Clippy pass. The suite includes deterministic
  external-writer/path races and real child-process termination at all seven
  persistent boundaries.
- The renderer protocol, command allowlist, Tauri capability, CSP, navigation policy,
  and ambient-authority denials remain unchanged.
- The existing single production matrix retains the Phase 1B test log as well as
  packaged-boundary and dependency evidence, avoiding a duplicate expensive matrix.
- [Production run 34801268319](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34801268319)
  at `302a2b2a` remains historical evidence for the first corrective pass. The later
  recovery-enumeration correction and run 34804861387 supersede it for Gate E closure.
- [Production run 34797222616](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34797222616)
  at `85690bd4` remains the original Phase 1B target evidence before the corrective
  reviews.
- Run 34796513503 passed at the prior implementation commit, then contract review found
  its pre-commit macOS evidence files used ordinary `sync_all`. Commit `85690bd4`
  corrected them to use the required platform flush before the final target run.
- Run 34796369255 remains failed evidence. Its pushed `Cargo.lock` was truncated by the
  repository-write transport, so both jobs correctly failed the core step. Commit
  `ecc369a7` restored the validated lockfile before the successful matrix.
- The original task is archived and its first Gate E closure is superseded by the
  completed corrective evidence. No Phase 1C project lifecycle, SDK, parser, authoring,
  or renderer filesystem authority was implemented.

## Completed Phase 1A implementation

- Production workspace: `app/`, separate from `spikes/`.
- Runtime boundary: one custom AppManifest command, `core_request`, granted by one
  local capability to WebView `main` only and guarded again by the caller label in
  Rust.
- Protocol: exact version 1 request/result envelopes; only health/version and synthetic
  denial/smoke operations; fixed redacted errors.
- Empty future ports: source transactions, project filesystem, Ren'Py, Git,
  credentials, and network providers. None has methods or an implementation.
- UI foundation: semantic dark and provisional light tokens, system/Source typography,
  restrained radius/elevation, visible focus, and reduced-motion behavior. The shell
  is boundary evidence, not an authoring screen.
- Local locked install/typecheck/unit/build, repository validation, privacy checks,
  dependency audit, Phase 0 regressions, and independent Rust core tests pass.
- `c4f2bd188bf33290204446b3aaf9d33c8fd15acb` corrected the Windows WebView2
  secret-probe false positive without weakening empty-storage/Node/Loomlight-global,
  sentinel-text, or exact-sentinel artifact checks.
- [Production run 34792368716](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34792368716)
  at `0a6a6c5d1ee30fc0626d4edeca0f23db611490bb` passed Windows x64 job
  103818859749 and macOS ARM64 job 103818859932. Both used Node 24.19.0, npm 11.9.0,
  Rust/Cargo 1.90.0 and passed frontend/Rust tests, packaging, injected packaged
  boundary smoke, artifact secret scan, and dependency/licence inventory.
- Windows produced `loomlight.exe`, MSI, and NSIS packages; macOS produced
  `Loomlight.app` and an ARM64 DMG. Routine retention kept lightweight evidence
  artifacts 10328234722 and 10328548641 for seven days; full package upload was
  intentionally skipped. Quality run 34792368711 passed at the same commit.
- Earlier command/probe failures, the renderer false positive, runner-setup failures,
  and artifact quota reports remain recorded in the archived task as evidence. They
  were not treated as passes.
- Phase 1A is archived and complete.

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
- Generated projects preserve the supported Ren'Py template's standard GUI/runtime
  files and conventional physical locations: visual assets under `game/images/`, audio
  under `game/audio/`, and GUI resources under `game/gui/`. Loomlight's Assets surface
  is an editor abstraction, not a `game/assets/` directory.
- Projects can be transactionally persisted, explicitly flushed/saved, closed, shown in
  Recent Projects, and loaded/reopened. The game still runs if `.renpy-editor/` is
  absent, but Phase 1 does not reconstruct deliberately deleted metadata.
- Project hierarchy is Project → Chapter → Scene → Beat. Chapters map naturally to
  organisational folders. Each Loomlight Scene normally has its own `.rpy` file and a
  stable globally unique technical label; display names are separate.
- Ren'Py-generated `.rpyc` files are derivative. Supported Scene/source file
  move/rename/delete operations must remove the obsolete `.rpyc` at the old path so an
  orphan compiled script cannot continue executing.
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
- Quiet Studio Dark is the Phase 1 visual direction. Phase 1A establishes semantic
  theme tokens/primitives; Phase 1E performs the first full Scene visual-polish pass;
  later technical surfaces extend the same design system.

## Required implementation sequence

1. **1A production scaffold** — clean production Tauri workspace/boundary/CI and visual-token foundation only.
2. **1B transaction/recovery** — close production Gate E before visual authoring writes.
3. **1C project lifecycle/SDK** — New Project, conventional generated scaffold, save/close/reopen.
4. **1D Characters/Assets/Variables** — extensible supporting authoring models.
5. **1E Scene authoring** — agreed bounded Beat set, Scene UX, Story tree and safe Scene-file lifecycle.
6. **1F Source synchronisation** — production partial CST/minimal patches/custom code.
7. **1G Branches/Validate/Run/Diagnostics/Git** — complete the functional slice.
8. **1H cross-platform acceptance** — fresh end-to-end Windows/macOS vertical slice.

Each milestone must receive its own bounded active task and pass its gate before the
next begins.

## Highest retained engineering risk

Gate E is closed with journalled recoverable semantics, not a portable compare-and-swap
claim. Multi-path transactions are recoverable sequences, Windows ordinary-user
directory-entry power-loss durability is not claimed, and macOS requires
`F_FULLFSYNC`. Recovery discovery also deliberately fails closed if namespace identity
cannot be proved. Future lifecycle and authoring work must use this boundary.

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
