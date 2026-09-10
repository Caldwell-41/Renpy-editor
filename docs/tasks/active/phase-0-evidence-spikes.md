# Task: Phase 0 evidence spikes

**Status:** Ready<br>
**Scope:** Research-only prototypes; no production architecture commitment

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

1. Create the neutral golden `.rpy` corpus and byte-for-byte baselines.
2. Compare lossless parse/edit candidates against the parser acceptance matrix.
3. Build functionally equivalent Tauri and Electron shells with a source editor,
   watched atomic file edit, narrow privileged command, and mocked SDK process.
4. Test Ren'Py 8.5.3 version, compile, lint `--error-code`, run, test, diagnostic
   parsing, and development warp through a versioned adapter on Windows and macOS.
5. Measure a 10,000-node synthetic branch graph with filtering and viewport culling.
6. Exercise official download, checksum, archive traversal, symlink, collision, and
   interrupted-install cases in a disposable directory.

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
