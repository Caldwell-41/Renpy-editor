# Task: Phase 1D supporting authoring models and safe import foundation

**Status:** In progress 2026-09-15  
**Scope:** Characters, Appearances, Assets, Variables, and their narrow transaction/source prerequisites only

## Entry checkpoint

The user explicitly approved Phase 1D on 2026-09-15. The clean baseline was
`main` at `2cea1f237166cfc400633c47fdb51e4aeed3d5f7`, matching the final Phase 1C
single-instance re-closure. The maintained single-instance plugin remains registered
before desktop setup and `LifecycleService` construction. No intervening production
change invalidated the Phase 1C gate.

Baseline results before substantive modification:

- `python3 scripts/validate.py`: passed for 183 files.
- lossless-source/preview suite: 26 passed.
- SDK spike suite: 24 passed.
- lossless benchmark: 620,000 bytes / 40,000 nodes, 128.03 ms median.
- `npm ci --ignore-scripts`, `npm run check` (6 passed), `npm run build`: passed.
- Local Rust execution was unavailable because this workspace exposes only an old
  Cargo 1.75 binary, which cannot read the repository's version-4 lockfile. This is not
  recorded as target evidence; supported-target CI remains required.

## Bounded design

- Extend ADR 0004's journal with explicit expected-absence `createNew` mutations.
  A create and existing-file replacements can occupy one recoverable sequential
  transaction set. No overwrite or multi-file atomicity claim is added.
- Import native-selected media through a retained trusted file handle. Stream and hash
  with a 1 MiB buffer into transaction-owned stage/accepted evidence, enforce a
  deliberate 512 MiB maximum, then commit via `createNew` alongside metadata/source
  companions. The renderer receives only an opaque selection ID and display metadata.
- Bind the transaction authority to the currently open lifecycle project. Close or
  project switch unregisters the ephemeral authority and clears import capabilities.
  Project UUIDs remain separate, persisted identities. Unresolved journals block open
  or later authoring.
- Keep `characters.rpy` and `variables.rpy` authoritative. The Phase 1D mapper knows
  only Loomlight's canonical one-line `define <id> = Character(...)` and
  `default <id> = <typed literal>` statements. It appends or replaces exact byte ranges
  against an expected file revision and never rewrites unknown source.
- Store editor-only stable entities in schema-versioned
  `.renpy-editor/authoring.json`. Character, Appearance, Asset, and Variable IDs are
  UUIDs independent of display names, technical names, and file paths. Missing
  Phase 1D metadata in a valid Phase 1C project initializes transactionally on first
  accepted authoring operation; source is not rewritten merely for migration.
- Imported images use flat deterministic names under `game/images/`; audio uses flat
  deterministic names under `game/audio/`. This avoids pretending subdirectories are
  separate Ren'Py namespaces. Image discovery names are lowercase token sequences;
  audio discovery names are lowercase Python identifiers. Metadata tracks SHA-256 and
  reports content, path, and discovery-name collisions separately.

## Explicit exclusions

No Scene/Beat/Preview authoring, general Source workspace/parser, arbitrary project
import, execution of user project code, Git status/diff/checkpoint, Branches, LLM,
credentials, release, rename/delete, or Phase 1E work is permitted.

## Closure evidence

Pending implementation, local validation, and the cost-scoped Windows x64/macOS ARM64
production gate. Failed or superseded runs will remain recorded rather than being
reclassified.
