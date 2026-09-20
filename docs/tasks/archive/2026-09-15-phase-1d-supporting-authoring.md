# Task: Phase 1D supporting authoring models and safe import foundation

**Status:** Complete 2026-09-15  
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

## Implemented result

- `createNew` mutations use explicit expected-absence revisions, no-replace live
  creation, the existing alternating journal, retained accepted/stage evidence, and
  fail-closed recovery. Mixed creates and replacements share one recoverable mutation
  set without claiming filesystem-level multi-file atomicity.
- Native picker selections become short-lived opaque authorities backed by a retained
  source handle. The core revalidates identity, streams with a 1 MiB buffer, hashes and
  counts bytes into transaction-owned storage, and enforces the documented 512 MiB
  limit. A 17 MiB regression proves this is independent of the source-edit mutation
  cap.
- Lifecycle open/create registers an ephemeral trusted transaction authority distinct
  from the stable project UUID. Close and switch revoke it and clear import selections;
  unresolved recovery blocks authoring.
- Canonical Character and Variable definitions use exact-revision, minimal byte patches
  in `game/definitions/characters.rpy` and `variables.rpy`. Unknown text is preserved;
  stale, ambiguous, or unsupported definitions are refused.
- `.renpy-editor/authoring.json` schema version 1 stores stable Character, Appearance,
  Asset, and Variable UUIDs and source mappings while preserving unknown top-level
  metadata. Metadata loss does not alter ordinary runnable Ren'Py source.
- Characters, appearances, grouped assets, and bool/int/string variables have bounded
  accessible supporting surfaces. Technical identifier rename, deletion, Scenes,
  Beats, Preview, and the general Source workspace were not introduced.

Implementation commits on canonical `main` are `90f102a33c84ca466115592106e0b83af612888a`,
`1e1739b5df078748ad2ab10a5b401db89c77dfa5`, and the final hardening commit
`343e10f96e42ef1f1cb1d50f78936865436e4f2b`.

## Closure evidence

- Local: repository validation passed for 185 files; frontend check passed 7 tests and
  production build passed; lossless-source suite passed 26 tests; SDK spike suite
  passed 24 tests; the 620,000-byte/40,000-node benchmark completed in 111.06 ms;
  `cargo fmt --check --all` and `git diff --check` passed. Local Cargo 1.75 cannot read
  the repository version-4 lockfile, so locked Rust tests and packaging were evidenced
  on the supported targets rather than misreported as local passes.
- Final production run
  [34913182173](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34913182173)
  at `343e10f96e42ef1f1cb1d50f78936865436e4f2b` passed Windows x64 job
  `104204998417` and macOS ARM64 job `104204998226`. Windows passed 82 core tests
  with 3 ignored; macOS passed 85 with 3 ignored. Each passed the controlled official
  Ren'Py 8.5.3 Phase 1C/1D lifecycle test, desktop tests, package build, packaged
  WebView/single-instance security smoke, secret scan, and dependency/licence inventory.
- Windows evidence artifact `10375353123` has SHA-256
  `d9be4e70fb5ac6870faaa530731a550f588ad5cd962cebcda5cef64a40604475`;
  macOS artifact `10375651909` has SHA-256
  `bfa99946717782c5a97b33d331d817411714799ff255142288f2337d840cbb36`.
  Both retained logs contain `phase-1c-target-gate: passed` and
  `phase-1d-target-gate: passed`.
- Final quality run
  [34913182158](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34913182158)
  passed at the same implementation commit.
- Preliminary successful production runs `34912101973` and `34912789857` remain
  historical/superseded evidence; final closure relies on the hardened run above.

Phase 1D is complete. Phase 1E remains separately approval-gated and was not started.
