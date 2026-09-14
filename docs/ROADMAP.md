# Phased roadmap

Each phase is gated by measurable outcomes, not elapsed time. Later work may refine
implementation detail but must preserve this dependency order and approved scope.

## Phase 0 — Foundation and proof (complete)

**Scope:** governance, canonical docs, privacy/security baseline, UI/architecture
checkpoint, representative fixtures, and high-risk spikes.

**Exit criteria:**

- Repository validator and read-only CI pass; privacy audit has no unresolved finding.
- Synthetic fixture/golden corpus exists with documented provenance and expected bytes.
- Electron and Tauri spikes run equivalent editor/file/process/security scenarios on
  Windows and macOS; results support an accepted stack ADR.
- Source candidates demonstrate exact no-op round-trip and safe custom-code fallback;
  results support an accepted source-model ADR.
- Ren'Py 8.5.3 adapter demonstrates version, compile, lint failure codes, test, run,
  diagnostic parsing, and investigated warp on both platforms.
- SDK installer rejects checksum, traversal, symlink, collision, partial download, and
  unsafe-overwrite cases.
- Preview and 10,000-node graph experiments define recorded fidelity/performance limits.
- Architecture, data, UI, security, test, fixture, and first-slice documents reflect
  evidence; no blocking question remains hidden.

Completed 2026-09-13. ADR 0001 selects the lossless source model, ADR 0002 selects the
versioned SDK/install boundary, and ADR 0003 selects Tauri 2 after equivalent packaged
Windows x64/macOS ARM64 evidence. Remaining manual assistive-tech and OS signing/
reputation checks are recorded later-phase limitations, not inferred Phase 0 passes.

## Phase 1 — Complete authoring vertical slice

**Status:** Phase 1A scaffold, Phase 1B transaction/recovery foundation, and Phase 1C
project lifecycle/SDK foundation complete; Phase 1D and later await separate explicit
approval.

**Outcome:** deliver a small but genuinely usable Loomlight-created Ren'Py project from
creation through authoring, validation, run, local Git checkpoint, close, and reopen.
The bounded implementation sequence is defined in
[the Phase 1 vertical-slice plan](tasks/active/phase-1-vertical-slice.md). The completed
[production scaffold](tasks/archive/2026-09-14-phase-1-production-scaffold.md) is the
first implementation gate; the completed
[transaction/recovery milestone](tasks/archive/2026-09-14-phase-1-transaction-recovery.md)
closes the production file Gate E before authoring work.

Phase 1 includes:

- create a conventional project with separate display title/folder name, selected
  parent directory, pinned compatible Ren'Py SDK, configurable resolution, and optional
  local Git initialisation enabled by default;
- generate a runnable modular scaffold with a small `script.rpy`, chapter folders, one
  Loomlight Scene per `.rpy` file, globally unique technical labels, and editor metadata
  that is not required to run the game;
- save/persist, close, list as recent, and load/reopen Loomlight-created projects;
  arbitrary existing-project import or reconstruction after `.renpy-editor/` deletion
  remains deferred;
- create characters with extensible appearance references, copy project-owned assets,
  and define basic `bool`, `int`, and `string` variables;
- visually author Scene beats for backgrounds, character show/hide/appearance,
  left/centre/right placement presets, dialogue, narration, simple variable assignment,
  unconditional choices/jumps/return, basic music/SFX, and basic transitions;
- provide the functional Scene, Source, and Branches workspaces, with Characters,
  Assets, Variables, Diagnostics/Runtime, Git, and project setup as supporting surfaces;
- provide scene-local Editor Preview reconstruction with explicit partial/unknown state,
  while the pinned official Ren'Py SDK remains the fidelity authority;
- preserve unsupported/custom source visibly, synchronize supported direct source edits,
  and block unsafe visual movement across opaque regions;
- use one transactional persistence path for visual and source edits, automatic
  persistence of accepted transactions, explicit `Ctrl/Cmd+S` flush/durability,
  coherent undo/redo, recovery journaling, and external-change conflict protection;
- validate through the pinned SDK, navigate diagnostics, run the game from its normal
  entry point, and create a local Git checkpoint.

**Exit criteria:**

- the production file transaction/recovery design closes Gate E before authoring writes
  are accepted as production-safe;
- fresh-checkout Windows x64 and macOS ARM64 tests complete the full create → author →
  save → close → reopen → edit → validate → run → Git-checkpoint workflow against the
  pinned SDK;
- generated projects run with `.renpy-editor/` absent and remain ordinary editable
  Ren'Py source;
- golden round-trips and minimal patches show no collateral source changes, including
  supported direct source edits and preserved unsupported regions;
- crash recovery and external-conflict tests lose no accepted edits and never silently
  overwrite an external revision;
- Scene, Source, and Branches remain synchronized through the shared transaction/domain
  model; no authoring surface maintains a competing runnable truth;
- Phase 1 deliberately excludes general existing-project import, UI Designer, Timeline,
  advanced state simulation/run-from-here, LLM assistance, GitHub remote workflows,
  advanced animation/ATL authoring, and release signing/notarisation.

## Phase 2 — Initial LLM assistance

**Outcome:** Ollama and configurable OpenAI-compatible adapters support structured
scene, character, and proposed-lore actions using deterministic route-aware context.

**Exit criteria:** every request exposes locality/context/estimated size; private or
adult remote sends require clear warning; output is schema/path/source validated;
semantic/file diffs support accept/reject/partial acceptance; stale summaries detect
source changes; no project content is sent without user action.

## Phase 3 — Initial WYSIWYG release

**Outcome:** mature scene/source/branch workspaces, supported screen designer,
VN timeline, state simulation/run-from-here, asset/diagnostic/recovery workflows,
Git/GitHub integration, and private Windows/macOS releases.

**Exit criteria:** all capabilities in PRODUCT's initial-release scope pass critical
E2E, official SDK compile/lint, accessibility, privacy/security, recovery, packaging,
and performance gates. Unsupported code remains lossless and visibly partially visual.

## Phase 4 — Narrative intelligence

Deliver in order: branch/reachability checking; variable/state analysis; character
consistency; lore extraction with approval; broader code/UI/refactoring proposals.
Each capability cites source/provenance and never silently changes canonical content.

## Phase 5 — Optional open-world capability

Add world maps, POIs, travel, day/time, schedules, state-dependent availability,
route validation, run-from-location, and reachable-slice LLM context. Exit requires an
ordinary linear/branching project to remain free of open-world assumptions.

## Release discipline

Early packages are private GitHub Releases. Signing and macOS notarisation follow once
distribution stabilises, before wider release. Each release is reproducible from a
tagged commit and includes dependency/licence review, SBOM/provenance planning,
package-content privacy scan, install/launch smoke tests, and known limitations.
