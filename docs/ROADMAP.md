# Phased roadmap

Each phase is gated by measurable outcomes, not elapsed time. Later work may refine
implementation detail but must preserve this dependency order and approved scope.

## Phase 0 — Foundation and proof (current)

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

## Phase 1 — Complete authoring vertical slice

**Outcome:** create a project; pin SDK/resolution; add two characters/assets; author a
modular staged scene and two-way choice; inspect graph/source; preserve an external
edit and unsupported block; compile/lint/preview; navigate diagnostics; Git checkpoint.

**Exit criteria:** end-to-end Windows/macOS tests pass against the pinned SDK; golden
round-trips show no collateral source changes; crash recovery/external conflict tests
lose no accepted edits; created game opens and runs without editor metadata.

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
