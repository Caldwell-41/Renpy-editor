# Task: Phase 1B corrective transaction and recovery remediation

**Status:** In progress 2026-09-14  
**Scope:** Corrective production transaction/recovery work only; Phase 1C remains unapproved

## Entry condition

Phase 1B was closed at `28be6669cb98d1d359112d5627ad24a4cf0e4f5c`, but a
subsequent review found three material Gate E gaps: pathname resolution remained after
parent validation, a crashed `prepared` journal had no safe path back to normal
operation, and terminal pre-mutation `rejected` journals blocked explicit flush.

The user explicitly approved this bounded remediation on 2026-09-14. Preserve all
Phase 1B guarantees and do not begin Phase 1C project lifecycle, SDK, parser, authoring,
Git, LLM, credential, updater, signing, or release work.

## Corrective design

1. Keep stage, accepted, and displaced-backup evidence inside the validated
   transaction recovery directory rather than beside the project target.
2. Open and retain validated root/component/parent directory handles for sensitive
   operations. Use descriptor-relative no-follow creation, inspection, rename, and
   exchange on Unix/macOS. On Windows, open each directory without delete sharing so
   rename/delete/reparse substitution is denied while pathname-only `ReplaceFileW`
   runs, and revalidate the object identity at the platform boundary.
3. Make the platform replacement consume an anchored target and recovery directory;
   never reconstruct artifact paths from an untrusted target pathname.
4. Define `prepared` as safely abandonable only when inspection proves that no stage,
   accepted, or backup evidence exists and no mutation flags crossed a persistence
   boundary. Finalisation then records `cleaned` and removes only partial journal
   slots.
5. Treat pre-mutation `rejected` as terminal and non-blocking for explicit flush.
   `conflict`, ambiguous states, and all states after accepted/staged persistence remain
   blocking until explicitly resolved.
6. Add deterministic hostile-boundary and real-process-termination tests on Windows
   x64 and macOS ARM64, retaining the exact CI evidence.

## Acceptance

- Transaction-owned artifact creation cannot be redirected outside the approved root
  by the identified parent substitutions.
- Final exchange is relative to a validated object on macOS and runs while the
  relevant Windows namespace components are pinned against rename/delete.
- Parent delete/recreate, symlink/reparse, target substitution, and out-of-root
  redirection tests retain all unrelated/external/accepted bytes as required.
- A real crash at `prepared` can be inspected, safely finalised, flushed, and followed
  by a successful transaction.
- Terminal pre-mutation rejection does not block flush or a later valid transaction;
  conflict and ambiguous recovery still block.
- Canonical state-machine, security, architecture, data-model, testing, status,
  handover, and ADR documentation match the implementation.
- Full repository validation and actual Windows x64/macOS ARM64 runtime evidence pass.

## Evidence

Implementation-tree local validation:

- `cd app && npm ci --ignore-scripts`; `npm run check` (5 passed); `npm run build`.
- `cargo fmt --check --all`.
- `cargo test -p loomlight-core --locked` (32 passed, 0 failed, 1 ignored worker;
  parent tests invoked real process termination at all seven persistent boundaries and
  a separate killed-process `Prepared` abandon/flush/later-commit flow).
- `cargo clippy -p loomlight-core --all-targets --locked -- -D warnings`.
- `cargo check -p loomlight-core --locked --target x86_64-pc-windows-gnu --all-targets`.
- `cargo check -p loomlight-core --locked --target aarch64-apple-darwin --all-targets`.
- `python3 scripts/validate.py` (175 files).
- `python3 -m unittest discover -s spikes/lossless-source/tests -v` (26 passed).
- `python3 -m unittest discover -s spikes/renpy-sdk/tests -v` (24 passed).
- `python3 spikes/lossless-source/benchmark.py` (620,000 bytes; 40,000 nodes;
  133.07 ms median over 7 samples).
- `git diff --check`.

Cross-compilation is recorded only as compilation evidence. Exact Windows/macOS
runtime workflow/job/artifact results, including any failed or superseded attempts,
remain pending before this task can be archived and Gate E re-closed.
