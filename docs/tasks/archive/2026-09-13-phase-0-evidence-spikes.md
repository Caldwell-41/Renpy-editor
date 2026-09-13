# Task: Phase 0 evidence spikes

**Status:** Complete 2026-09-13<br>
**Scope:** Completed research prototypes and accepted Phase 0 architecture decisions

## Outcome sought

Produce reproducible evidence for the desktop stack, lossless source model,
official SDK adapter, source mapping, preview boundary, graph scale, and secure SDK
installation. Convert accepted conclusions into ADRs and archive disposable code.

## Dependencies

- [Stack and integration plan](../../research/STACK_AND_SPIKES.md)
- [Parser plan](../../research/PARSER_ROUND_TRIP.md)
- [Fixture proposal](../../fixtures/REPRESENTATIVE_GAME.md)
- [Threat model](../../SECURITY.md)

## Bounded work packages

1. **Complete:** Create the neutral golden `.rpy` corpus and byte-for-byte baselines.
2. **Complete:** Compare lossless parse/edit candidates against the parser acceptance
   matrix and record the source-model direction in ADR 0001.
3. **Complete:** Build functionally
   equivalent Tauri and Electron shells with a shared source editor/contract, watched
   atomic file edit, narrow privileged command, and mocked SDK process. Windows x64
   and macOS ARM64 pass shared lifecycle tests and packaging. Packaged probes cover
   denial, filesystem, watch, symlink, stale-write, complex-path, and redaction behavior
   equivalently in green run 34700476448. Earlier corrective failures remain documented.
   Shared UI/WebView behavior also passes equivalent packaged wide/narrow probes in
   run 34701370897. Packaged native credential storage and plaintext-leak checks pass
   both targets in run 34722411465. Deterministic packaged graph scale passes in run
   34722954424. Preview/source mapping is classified and runtime-checked on Linux in
   run 34723797776. Target SDK integration passes in run 34731460283. Equivalent
   comparative measurements pass in run 34733246868 and support ADR 0003.
4. **Complete:** Test Ren'Py 8.5.3 version, compile,
   lint `--error-code`, run, test, diagnostic parsing, development warp, and a PC
   build through a versioned adapter.
5. **Complete automated packaged checkpoint:** Measure deterministic 1,000-, 10,000-,
   and 50,000-node synthetic branch graphs with filtering, viewport culling,
   interaction latency, stable
   relayout, and Monaco non-blocking behavior. The 10,000-node case is the usability
   target. All four candidate/engine combinations pass in run 34722954424.
6. **Complete automated target checkpoint:** Exercise
   official download, checksum, archive traversal, symlink, collision, limits, and
   interrupted-install cases in a disposable directory.
7. **Complete bounded checkpoint:** Classify preview/source-mapping behavior as
   faithful, approximate,
   or runtime-only using deterministic synthetic constructs and exact source ranges.
   Do not execute project Python during static mapping or treat preview output as
   authoritative source. Nineteen static/source tests and the trusted Linux runtime
   pass in run 34723797776 is supplemented by the target SDK pass in run 34731460283.

## CI efficiency checkpoint

The evidence workflows remain automatic on `main` only when their own workflow,
spike implementation, or relevant fixture changes, with manual dispatch retained.
Those existing path filters are already appropriately narrow for the remainder of
Phase 0. Superseded push runs are now cancelled within the same workflow and branch;
manual evidence runs have unique concurrency groups and independent branches and
workflows cannot cancel one another.

The desktop matrix caches Cargo registry/archive data, git dependencies, and compiled
dependency outputs for `spikes/desktop-shells/src-tauri`. Cache identity includes the
matrix runner, Rust release/host, Cargo manifests and lockfiles, root toolchain/Cargo
configuration, and compiler-related environment. Windows x64 and macOS ARM64 therefore
do not share incompatible outputs. Workspace source outputs, incremental artifacts,
pre-existing Cargo binaries, secrets, and repository content are not retained. Rust
tests now use `--release --locked`, allowing the following release package build to
reuse dependency compilation while preserving both the test and packaged-app checks.

The SDK workflow caches only the official immutable 8.5.3 archive, keyed by runner OS,
archive/version name, and pinned SHA-256. Official checksum metadata is still fetched
on every run. Both the pinned checksum step and the adapter's official-metadata check
run after cache restoration, so a hit is never trusted before verification; misses
still download from `renpy.org`, and no SDK is committed.

Measured desktop evidence:

| Run | Windows x64 | macOS ARM64 | Notes |
| --- | ---: | ---: | --- |
| [Pre-change baseline 34677919432](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34677919432) | 15:23 | 2:34 | Windows `cargo test` 4:36; Tauri package 9:24 |
| [Cold cache 34691004337](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34691004337) | 13:20 | 2:38 | Windows release test 6:30; package 3:04; initial cache save 1:32 |
| [Warm cache 34691607349](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34691607349) | 5:42 | 1:57 | Full cache hits; Windows release test 0:45 and package 2:49 |

The SDK cold and warm runs both remained about 1:10 because the prior official SDK
download was already roughly two seconds; caching removes the repeated transfer but
does not materially accelerate the minute-long integration probe. Cache storage and
restore are best-effort optimisations, so a miss must remain a supported path.

The evidence workflows remain reproducible regression records until reviewed Phase 1
validation replaces them. Documentation-only closure does not trigger them. The
non-selected Electron candidate stays clearly disposable and is not a second
production implementation.

## Acceptance criteria

- Each result records commands, platform, dependency versions, fixtures, timings,
  failures, and artifacts sufficient for repetition.
- Stack prototypes expose equivalent typed operations and deny unlisted access.
- Parser results distinguish exact round-trip, supported minimal edit, and opaque
  preservation; no unsupported region is silently changed.
- SDK results use only official artifacts and never run a project as part of parse.
- An accepted desktop-stack ADR and source-model ADR cite measured evidence.
- Disposable code is under `spikes/` and clearly labelled or deleted.

## Expected touched areas

`spikes/`, `tests/fixtures/`, `docs/research/`, `docs/adr/`, `docs/TESTING.md`, and
`docs/status/CURRENT.md`.

## Validation and handoff

Run the repository validator plus spike-specific test commands. Report platform
coverage explicitly; do not infer macOS behavior from a Windows-only run or the
reverse.

## Completion

All acceptance criteria are satisfied. ADR 0001 records the source model, ADR 0002
records the SDK/install boundary, and ADR 0003 selects Tauri 2 from equivalent
Windows x64/macOS ARM64 evidence. Final comparison run 34733246868 passed every
candidate launch and preceding packaged gate. Canonical architecture, security,
testing, roadmap, status, and handover documents were reconciled. Phase 1 remains
unimplemented and separately approval-gated.
