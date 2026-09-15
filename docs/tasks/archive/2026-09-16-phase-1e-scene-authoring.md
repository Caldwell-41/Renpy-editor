# Phase 1E Scene authoring execution ledger

**Opened:** 2026-09-16  
**Status:** Completed — 1E.1, 1E.2, 1E.3, local, and supported-target gates passed; PR #9 awaits integration
**Branch:** `feature/phase-1e-scene-authoring`  
**Base:** `06850418b3f5e4e7a39c7b967483872ab78b68dc`

## Authority and boundary

The user explicitly approved Phase 1E only. Work proceeds through 1E.1, 1E.2, and
1E.3 in order. Phase 1F and later capabilities remain excluded. PRs #7 and #8 are
already merged and will not be replayed.

The accepted source, transaction, project/session, single-instance, SDK, renderer,
and retained-import guarantees remain mandatory. Ren'Py source bytes are runnable
truth; metadata records identity, mappings, ordering, and convenience state only.

## Verified entry state

- Fresh checkout of `origin/main` resolved to the expected
  `06850418b3f5e4e7a39c7b967483872ab78b68dc`.
- The accepted Phase 1D integration commit `3487f7c9049c8f3bbae56edc8e36eff58c364b19`
  is an ancestor. The two later commits are documentation-only.
- Worktree was clean before branch creation.
- Root `AGENTS.md`, CURRENT, HANDOVER, the active Phase 1 plan, architecture, data,
  transaction, UI, testing, security, and ADR 0001–0005 contracts were reviewed.

## Checkpoint 1E.1 — source, hierarchy, file lifecycle, history

**Status:** Closed locally

### Planned production boundary

- Evolve project/source-map metadata for ordered multiple Chapters and Scenes while
  accepting and transactionally migrating the valid Phase 1 schema.
- Preserve UUIDs and unknown JSON fields, validate unique labels/paths/ownership,
  keep at least one Chapter and Scene, and apply deterministic selection fallback.
- Add a narrow Scene source mapper that records exact byte ranges, lexical context,
  supported beats, and protected opaque regions without implementing the 1F Source UI.
- Add semantic Scene operations whose source and metadata mutations form one shared
  transaction and whose committed revisions feed end-to-end undo/redo.
- Add safe create/move/delete semantics, including destination absence and exact
  obsolete `.rpyc` ownership handling.
- Refuse destructive operations when supported or opaque incoming references cannot
  be resolved safely. Entry and last-Scene deletion remain refused.

### Gate evidence

- `cargo test -p loomlight-core --locked`: 125 passed, 0 failed, 4 intentionally
  ignored subprocess workers.
- `cargo clippy -p loomlight-core --all-targets --locked -- -D warnings`: passed.
- `cargo fmt --check --all`: passed.
- Focused Scene service: 6 passed, including transactional v1→v2 migration and
  reopen/stable Beat IDs, unknown-field retention, CRLF/Unicode minimal insertion,
  opaque-boundary refusal, known/unknown incoming-reference refusal, multi-Chapter/
  Scene lifecycle, `.rpyc` removal, repeated undo/redo, external history boundary and
  failed inverse cursor retention.
- Transaction additions: delete commit and retained backup, create/delete history with
  actual inverse identities, interrupted-delete recovery classification, safe explicit
  keep/accept recovery, and ambiguous-recovery refusal all passed.
- Focused review found no renderer write path (none is wired yet), no Phase 1F parser/
  workspace work, and no SDK execution on inspect or mutation.

History is intentionally session-local in Phase 1E: committed source/metadata is
durable, while the undo cursor starts empty after close/restart. This is surfaced
truthfully rather than reconstructing semantic intent from retained recovery journals.

## Checkpoint 1E.2 — functional Scene authoring and recovery UX

**Status:** Closed locally

### Planned production boundary

- Approved Beat subset, explicit flow edges, Story-tree authoring, buffered inline
  writing, truthful Flush state, and static non-executing diagnostics.
- Minimum inspection and safe-resolution workflow over retained transaction evidence;
  ambiguous states remain blocked.

### Gate evidence

- `cargo test -p loomlight-core --locked`: 129 passed, 0 failed, 4 intentionally
  ignored subprocess workers.
- `npm run check`: 11 TypeScript/DOM/protocol tests passed; `npm run build` passed.
- `cargo clippy -p loomlight-core --all-targets --locked -- -D warnings`,
  `cargo fmt --check --all`, and `git diff --check`: passed.
- `representative_branching_project_is_authored_and_reopened_through_services`
  created Characters, an Appearance, background/music/SFX assets and bool/int/string
  Variables through supporting-authoring services; authored every approved Beat,
  multiple unconditional Choice destinations, atomic Create New Scene, Jump and
  terminal Return; retained Custom Code bytes; moved/reordered; undid/redid; and
  reopened with stable IDs and selection.
- The Scene renderer exposes multi-Chapter/Scene create, display rename, reorder,
  cross-Chapter move, guarded delete and select/open controls. All reorder operations
  have labelled keyboard-operable Move Up/Down buttons.
- Selected Beats expand inline. Dialogue Enter remains a newline; Ctrl/Cmd+Enter is
  one semantic transaction that commits the burst and inserts the next Dialogue with
  speaker carry-forward. Commit/cancel, navigation blocking, truthful Flush wording,
  validation-input retention and focus restoration are covered by DOM tests.
- Recovery UI lists affected paths and retained accepted/displaced evidence, requires
  explicit confirmation, offers only the transaction service's proven keep/accept
  choices, revalidates after completion, and leaves ambiguous recovery blocked.
- Focused review found no Scene write outside `scene.apply` and the shared transaction/
  history path, no runtime execution or dynamic diagnostics, no CSP/capability widening,
  no silent reference retargeting, and no Phase 1F+ surface.
- A local `cargo test -p loomlight-desktop --locked` attempt could not start because
  this Linux container lacks `pkg-config`/GTK system libraries. It is recorded as an
  environment-limited failed attempt, not target evidence; supported Windows/macOS
  desktop evidence remains reserved for the final production gate.

## Checkpoint 1E.3 — preview, media and visual conformance

**Status:** Closed locally

### Planned production boundary

- Scene-local reconstruction through the selected Beat with provenance and explicit
  partial/unknown state.
- Core-mediated, read-only, session-scoped raster/audio delivery with bounded formats,
  bytes and image dimensions, stale-session/path/substitution denial, cancellation,
  invalidation and disposal.
- Quiet Studio Dark, responsive 52/48 Preview/Beats layout, keyboard reorder,
  labelled/focusable controls, focus restoration, and reduced-motion evidence.

### Gate evidence

- `cargo test -p loomlight-core --locked`: 134 passed, 0 failed, 4 intentionally
  ignored subprocess workers. The suite includes passive format/magic/dimension
  validation, 16 MiB refusal, traversal metadata refusal, stale-session rejection,
  exact hash/count conflict, and Unix symlink substitution refusal.
- `npm run check`: 15 TypeScript/protocol/behavioral DOM tests passed;
  `npm run build` passed. Preview tests cover scene-local reconstruction through the
  selected Beat, contributing Beat IDs, explicit `Edit Beat N`/`Add change here`,
  Custom Code invalidation, image/thumbnails, explicit-only audio, cache coalescing,
  logical cancellation, and disposal.
- `cargo clippy -p loomlight-core --all-targets --locked -- -D warnings`,
  `cargo fmt --check --all`, and `git diff --check`: passed.
- The renderer requests only `{assetId, purpose}`. Core resolves the current-session
  Asset, requires available validated metadata, uses the retained transaction path,
  rechecks exact count/hash, caps presentation at 16 MiB and raster dimensions at
  8192×8192, and allows only passive PNG/JPEG or OGG/WAV/FLAC/MP3 bytes. Renderer
  object URLs are content keyed, stale generations are ignored, replaced/disposed URLs
  are revoked, and audio is created only after a labelled user action.
- The Preview/Beats workspace starts at 52/48, preserves the configured aspect ratio,
  collapses responsively, exposes selected/hover/focus/disabled/error/conflict/recovery
  states through Quiet Studio Dark semantic tokens, keeps labelled keyboard reorder,
  and disables motion under `prefers-reduced-motion`.
- The packaged target probe now behaviorally requires Scene Preview/Beats, provenance,
  partial state, accessible reorder, Dialogue Ctrl/Cmd+Enter, Choice Create New Scene,
  no automatic audio, explicit audition, safe recovery plus revalidation, refused
  ambiguous recovery, and conflict presentation. The official SDK target fixture uses
  production Scene/media services and requires explicit 1E passed markers before the
  workflow can continue.
- Focused review found no path/URL parameter exposed by media IPC, no renderer
  filesystem/process/network authority, no capability or CSP change, no transaction
  bypass, no automatic Ren'Py/Python execution, and no Source/Branches/Phase 1F+
  implementation.

## Final supported-target closure

**Status:** Closed on the final application candidate

The final changed application tree received one complete production run on
Windows x86-64 and macOS Apple Silicon ARM64. Failed, cancelled, and skipped evidence
remains explicit. This brief was archived only after all gates passed.

The first final candidate run, GitHub Actions `35016250068`, failed independently on
the two targets and is retained as failed evidence:

- Windows x64 reached the core suite, where five delete/history/Scene lifecycle tests
  returned recovery-required after the namespace delete had succeeded. The retained
  displaced backup was reopened read-only for the final durability flush;
  `FlushFileBuffers` requires a write-capable handle on Windows. The correction adds a
  narrowly scoped recovery-artifact flush handle and exercises explicit Flush after a
  committed delete.
- macOS ARM64 passed the complete core suite, then the SDK target fixture failed lint
  because it authored Jump, Choice, and the default Return sequentially. Choice, Jump,
  and Return are now enforced as mutually exclusive final Beats: adding a new terminal
  replaces the existing terminal range, and terminal removal/conversion/reorder is
  refused. The representative core and official SDK fixtures now put Choice on the
  entry Scene, Jump on a destination Scene, and retain Return on other destinations.

After correction, local `cargo test -p loomlight-core --locked` passed 134 tests with
four intentional subprocess-worker ignores; strict core Clippy, Rust formatting,
`npm run check` (15/15), `npm run build`, and `git diff --check` passed. An attempted
workspace-wide Clippy run remains an environment-limited failure because this Linux
host lacks `pkg-config`/GTK; the repository-prescribed strict core Clippy command
passed and is the applicable local evidence.

Replacement run `35021344119` against remote correction commit
`1ba459188adb725f97978ad9fd898b26bcb8cecc` cleared both original failures on both
targets: core, the official-SDK Phase 1E Scene fixture, desktop boundary tests, and
production packaging all passed on Windows x64 and macOS ARM64. Both jobs then failed
the packaged WebView smoke at `choice-create-scene`. This was an independent probe
synchronisation defect, not a shared production-service failure: the probe counted
`scene.apply` when the request began and immediately tried to select Choice while the
dirty pre-commit Dialogue DOM was still mounted, so the production draft guard
correctly refused navigation. The final probe waits for both the apply count and the
truthful `Saved`/no-unsubmitted-draft committed render before continuing. Its
synthetic workspace now also contains one final terminal Choice rather than the
invalid Choice-then-Return sequence, and a later Scene failure no longer erases a
completed supporting-authoring result. The focused regression raises the frontend
suite to 16 tests. The corrected local candidate validated 200 repository files,
passed 26 lossless-source and 24 SDK-boundary tests, recorded a 111.66 ms source
benchmark median, passed all 16 frontend tests and the production build, passed 134
core tests with four intentional worker ignores, and passed strict core Clippy, Rust
formatting, smoke-probe syntax, and `git diff --check`. A further complete
supported-target run was then performed.

Final production run `35023049519` passed at exact remote application candidate
`a32a790499900d3f3231b3e212a77fab70564e01`, tree
`1bf03d20d350af819c6bb7cdc4c9c35f3f0b3cbb`:

- Windows x64 job `104563305510` passed 16 frontend tests, 128 platform-applicable
  core tests with four intentional worker ignores, the official-SDK Phase 1C through
  1E fixture, managed-SDK handoff, desktop Rust tests, production packaging, packaged
  WebView/single-instance/Scene authoring, privacy scan, and dependency inventory.
- macOS ARM64 job `104563305803` passed 16 frontend tests, 134 core tests with four
  intentional worker ignores, the same official-SDK, handoff, desktop, production
  package, packaged WebView/Scene, privacy, and inventory gates.
- Both packaged reports recorded `sceneAuthoringStage: complete`,
  `sceneAuthoringUiPassed: true`, `supportingAuthoringStage: complete`, and
  `supportingAuthoringUiPassed: true`. The cache-miss SDK download step alone was
  skipped because each runner restored the pinned official archive; the SDK fixtures
  themselves ran and passed.

Retained artifacts:

| Target | Evidence artifact | Digest | Package artifact | Digest |
| --- | --- | --- | --- | --- |
| Windows x64 | `10418698228` | `sha256:b9f5e0fc21243b23c9ea95a286e1797e6b35812abfc5fe13f88e49ff54180776` | `10418733085` | `sha256:bd285931f14d223f88755eaca96906f503a24ca14918b87e2973dce427b93689` |
| macOS ARM64 | `10418098157` | `sha256:d3bd30dd93db8b87c6f2ae9bb3cf7421e134b26b62a0c10e94918aa605163ebc` | `10418093172` | `sha256:a126abf27920382c42b2f76951c09dd1419c0adc8e1f96197f9d7740bb1c0407` |

Automatic repository-quality runs `35022880859` (push) and `35022884889` (PR)
also passed on the same commit. Run `35016121069` was an accidental main-branch
dispatch cancelled before completion and is not evidence. Runs `35016250068` and
`35021344119` remain failed evidence with their distinct root causes and corrections
recorded above; none is reclassified as a pass.

## Decisions and retained limitations

- Story-tree order is organisational and never generates implicit runtime flow.
- Display rename does not rename labels, paths, or stable IDs.
- New Scenes end in an explicit `return` beat. Adding Choice or Jump replaces that
  terminal; supported authoring keeps exactly one final terminal Beat.
- Scene deletion is refused for the entry Scene, last Scene, known incoming Choice or
  Jump edges, or opaque source that prevents a complete incoming-reference proof.
- Conditional choices, arbitrary expressions, Source workspace, Branches workspace,
  SDK execution, Git, plugins, and broader import remain deferred.

## Validation record

- 1E.1 local gate closed before any Scene renderer write path was added; checkpoint
  commit `a2b6002` (`feat: establish Phase 1E scene foundation`).
- 1E.2 local gate closed only after the functional service fixture, recovery UI,
  renderer DOM suite, core suite, build, formatting and strict core Clippy passed.
- 1E.3 local gate closed only after preview provenance/unknown-state behavior, bounded
  media denials and disposal, responsive/accessibility/token tests, production build,
  full core suite, formatting, strict core Clippy, and the focused privilege/scope
  review passed.
- The Linux desktop test attempt failed before project compilation at the host GTK
  dependency check (`pkg-config` unavailable); it is neither skipped silently nor
  counted as production evidence.

The complete local candidate gate validated 200 repository files, passed 26 lossless-
source tests and 24 SDK-boundary tests, recorded a 107.00 ms median for 620,000 bytes /
40,000 source nodes, installed 32 locked frontend packages, passed all 15 frontend
tests and the production frontend build, passed 134 core tests with four intentional
subprocess-worker ignores, strict core Clippy, Rust formatting, smoke-probe syntax, and
`git diff --check`. The first diff check reported trailing whitespace in this ledger;
that documentation-only defect was removed and the validator/diff check were rerun
successfully.

On the same Linux host, `cargo test -p loomlight-desktop --locked` and
`npm exec -- tauri build -- --locked` both stopped in GTK/GObject dependency discovery
because `pkg-config` and the required system development libraries are unavailable.
The latter completed its frontend production build first. These are environment-limited
failed attempts, not skipped or accepted desktop evidence.
