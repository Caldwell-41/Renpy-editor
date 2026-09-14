# Task: Phase 1B transaction and recovery foundation

**Status:** Planned; not approved for implementation<br>
**Scope:** Production transaction, file coordination, and recovery boundary only

## Entry condition

Phase 1A is complete. Do not implement this task until the user gives a new explicit
instruction approving Phase 1B. This brief is a handoff artifact, not approval.

Read the completed
[Phase 1A scaffold task](../archive/2026-09-14-phase-1-production-scaffold.md), the
[Phase 1 vertical-slice plan](phase-1-vertical-slice.md), ADR 0001, and the canonical
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
