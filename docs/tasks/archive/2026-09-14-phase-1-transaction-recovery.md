# Task: Phase 1B transaction and recovery foundation

**Status:** Complete 2026-09-14<br>
**Scope:** Production transaction, file coordination, and recovery boundary only

> **Superseded Gate E closure:** A later review found parent/path substitution and
> terminal-state gaps. The original implementation/evidence remains historical, but
> Gate E was subsequently re-closed by the
> [completed corrective remediation](2026-09-14-phase-1b-corrective-transaction-recovery.md).

## Entry condition

Phase 1A is complete. The user explicitly approved this bounded Phase 1B goal on
2026-09-14. Do not proceed into Phase 1C.

Read the completed
[Phase 1A scaffold task](2026-09-14-phase-1-production-scaffold.md), the
[Phase 1 vertical-slice plan](../active/phase-1-vertical-slice.md), ADR 0001, and the canonical
architecture, data-model, security, and testing documents before editing.

## Outcome sought

Close the unresolved production file-transaction/recovery Gate E before any visual or
source authoring workflow may write project files. Establish one narrow transaction
layer that can later serve Scene, Source, and Branches without creating competing
truths or silently overwriting external changes.

## Bounded implementation

1. Specify the transaction state machine, revision/file-identity model, journal and
   recovery records, durability contract, and redacted diagnostics.
2. Implement narrow core interfaces and platform adapters for the minimum file
   coordination primitives proved necessary on Windows x64 and macOS ARM64.
3. Preserve accepted Loomlight edits and competing external bytes when atomic
   compare-and-swap cannot be proved; surface an explicit conflict or recovery state.
4. Cover path containment, symlink/reparse substitution, stale revisions, external
   writer races, crash points, partial recovery, backup retention, and cleanup.
5. Define undo/redo and explicit-save boundaries so neither can overwrite a newer
   external revision.
6. Keep all project source writes behind this layer. Do not expose general filesystem
   authority to the renderer.
7. Add path-scoped, commit-pinned Windows x64 and macOS ARM64 evidence for equivalent
   transaction/recovery behavior with locked dependencies.

## Required design questions

- Which platform primitive supplies the strongest practical replace/exchange/backup
  semantics on each target, and what cannot truthfully be claimed as atomic?
- How are file identity and expected bytes/revision revalidated immediately before
  commit without losing a non-cooperating external writer's data?
- Which file and directory flushes are required for the documented durability level,
  and where do Windows and macOS guarantees differ?
- What journal states are recoverable after termination at every mutation boundary?
- How are stale temporary, journal, backup, and obsolete derivative files identified
  without deleting unrelated user data?

## Acceptance criteria

- Deterministic race tests prove no accepted edit is silently lost and no newer
  external revision is silently overwritten.
- Crash-point tests cover every persistent state transition and produce a bounded,
  explainable recovery result.
- Canonical path, containment, file-identity, symlink/reparse, and substitution tests
  pass on both supported targets.
- Save/flush durability and recovery limitations are documented per platform rather
  than inferred from one operating system.
- Undo/redo stops at external-revision safety boundaries.
- Renderer capabilities remain unchanged except for any separately reviewed,
  transaction-specific command envelope additions; no ambient filesystem/process/
  network authority is introduced.
- No New Project workflow, generated Ren'Py project, parser/patching, Scene/Source/
  Branches authoring, SDK execution, Git, credentials, providers, or release feature is
  implemented.

## Non-goals

- No Phase 1C project lifecycle or SDK work.
- No visual/source authoring or parser implementation.
- No project import, asset management, Git/GitHub, LLM, updater, signing, or release
  work.
- No claim that Phase 0 spike transaction code is production-ready; retain it only as
  evidence and reimplement reviewed concepts behind production interfaces.

## Completion handoff

When explicitly approved and complete, record exact platform primitives, commands,
toolchains, fixtures, crash/race results, CI run/job IDs, retained artifacts, failed or
cancelled evidence, and limitations. Update canonical architecture/data/security/test
documents, current status, and handover; archive this brief. Do not begin Phase 1C
without another explicit instruction.

## Completed implementation

- Production code is isolated in app/src-core/src/transaction and does not copy the
  Phase 0 spike.
- ADR 0004 and docs/TRANSACTIONS.md define the retained-displacement protocol,
  multi-mutation state machine, recovery inspection, and platform durability limits.
- The renderer operation/capability allowlist is unchanged.
- `TransactionService` owns opaque project registration, normalized relative paths,
  exact base bytes/SHA-256/file identity, staged and accepted copies, alternating
  checksummed journals, retained displaced bytes, recovery inspection, explicit
  flush, and revision-guarded multi-path history.
- Existing-file replacement uses `ReplaceFileW` with an explicit same-volume backup
  on Windows and same-directory `renameatx_np(RENAME_SWAP)` followed by a retained
  backup rename on macOS. File data and journals are flushed; macOS requires
  `F_FULLFSYNC` for transaction data and syncs affected directories. Windows makes no
  ordinary-user directory-entry durability claim because volume flushing requires
  excessive authority and `REPLACEFILE_WRITE_THROUGH` is unsupported.
- The locked core suite passes 24 tests with one ignored subprocess worker on both
  targets. The parent invokes the worker seven times and verifies actual termination
  recovery at prepared, staged, commit-intent, exchanged, verified, committed, and
  durable boundaries. Deterministic hooks cover external writers before and after the
  platform operation, stale bytes/revisions, same-byte identity replacement,
  delete/recreate, root/parent and symlink/reparse substitution, partial journals and
  temporaries, retained backups, cleanup isolation, explicit flush, undo/redo external
  boundaries, and a two-path recovery fixture.

## Validation and retained evidence

Local validation on the implementation tree:

- `npm ci --ignore-scripts`; `npm run check` (5 tests); `npm run build`.
- `cargo fmt --check --all`.
- `cargo test -p loomlight-core --release --locked` (24 passed, 0 failed, 1 ignored
  worker; the parent ran all seven worker crash points).
- `cargo clippy -p loomlight-core --all-targets --locked -- -D warnings`.
- `cargo check -p loomlight-core --locked --target x86_64-pc-windows-gnu --all-targets`.
- `cargo check -p loomlight-core --locked --target aarch64-apple-darwin --all-targets`.
- `python3 scripts/validate.py` (174 files before this archive update), both Phase 0
  unittest suites (26 source/mapping and 24 SDK tests), the source benchmark (620,000
  bytes, 40,000 nodes, 244.18 ms median), dependency/licence inventory (76 npm and 437
  Cargo entries, all licensed), and `git diff --check`.
- The Linux desktop-crate attempt stopped before compilation because the local host
  lacked the system `glib-2.0`/`pkg-config` development environment. This is an
  environment limitation, not target evidence; the supported Windows/macOS desktop
  jobs below passed.

[Production run 34797222616](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34797222616)
at `85690bd4ebde95f9ee707175e54336bfd83af0f8` passed Windows x64 job
103832559663 and macOS ARM64 job 103832559907. Both used Node 24.19.0, npm
11.9.0, and Rust/Cargo 1.90.0 and passed locked install, frontend tests/build, Rust
formatting, the transaction suite, desktop boundary tests, packaging, packaged WebView
denial smoke, artifact secret scan, and dependency/licence inventory. Lightweight
evidence artifacts 10330271852 (Windows, SHA-256
`015baa5bc525f7db10bbd9ef468ae1efe71335a1916faafda5e7011d830f7237`) and
10329987775 (macOS, SHA-256
`4a9904a48d796ac79d72eaa44aa7ea6a177452cf5c3bdfa790b3c7f2280829c4`) are retained
for seven days; full package upload was intentionally skipped on the routine push.
Quality run 34797222651 passed at the same commit.

The preceding successful run 34796513503 at `ecc369a7` was superseded after contract
reconciliation found that pre-commit stage/accepted copies and journal temporaries used
ordinary `sync_all` on macOS. Commit `85690bd4` routes those evidence files through the
platform flush and the final matrix directly exercises `F_FULLFSYNC`. This was fixed
before closure rather than weakening the written durability contract.

Run 34796369255 at `cc1ea6b8` remains failed evidence: both jobs failed in the core
step because the repository-write transport had truncated `Cargo.lock` while creating
that commit. The lockfile was restored byte-for-byte in `ecc369a7`; its Git tree
matched the locally validated implementation tree before the successful matrix ran.
Failed job IDs 103830151171 (Windows) and 103830151093 (macOS), plus their small
failure artifacts 10329654227 and 10329294908, are retained. No flaky retry was used.

## Closure and limitations

Gate E is closed for this bounded production foundation. It does not claim a portable
filesystem compare-and-swap or atomic multi-file transaction: every multi-path commit
is a journalled recoverable sequence. Hardware, network, removable, virtualized, or
capability-limited filesystems may refuse or return recovery-required. Retention
pruning and user-facing recovery resolution remain later work. Only replacement of
existing files is implemented now, behind an extensible mutation-set interface; file
creation/deletion and `.rpyc` lifecycle operations remain scoped to later approved
milestones. Phase 1C was not started.
