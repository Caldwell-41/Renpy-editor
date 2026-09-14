# Task: Phase 1C project lifecycle and SDK foundation

**Status:** In progress 2026-09-14  
**Scope:** Project lifecycle and Ren'Py SDK foundation only; Phase 1D remains unapproved

## Entry condition

Phase 0, Phase 1A, and the corrected Phase 1B transaction/recovery gate are complete.
The user explicitly approved this bounded Phase 1C goal on 2026-09-14. Gate E and the
replacement-only `SourceTransactionPort` remain unchanged.

## Outcome sought

Implement Welcome/Recent Projects, staged New Project creation, Open Loomlight
Project, and a production exact-version Ren'Py 8.5.3 SDK boundary. A generated
project must preserve the standard Ren'Py GUI/runtime infrastructure, add the initial
Loomlight Chapter 1 / Scene 1 identities, validate before no-replace promotion, and
reopen without executing project code.

## Bounded implementation

1. Add a capability-specific project lifecycle service that owns approved paths,
   opaque IDs, staging, no-replace finalisation, metadata, and Recent Projects.
2. Add bounded 8.5.3 SDK discovery, explicit browse validation, verified install, and
   allowlisted process execution with bounded output/time and tree cancellation.
3. Generate the base project with Ren'Py 8.5.3's documented launcher
   `generate_gui ... --start` command, then apply a deterministic Loomlight overlay
   and validate the staged result with the same adapter.
4. Add only the typed protocol operations and lifecycle UI needed for Phase 1C.
5. Prove the complete create/validate/close/reopen and metadata-independent game
   lifecycle on Windows x64 and macOS ARM64.

## Non-goals

No arbitrary Ren'Py import, authoring models or surfaces, parser/source
synchronisation, Scene editor/Preview/Beats, general runtime diagnostics, Git beyond
optional `git init`, LLM, credentials, updater, signing, notarisation, or release work.

## Completion evidence

Record exact local commands, target workflow/run/job and artifact IDs, failed or
superseded attempts, implementation commit, SDK/checksum, limitations, and explicit
confirmation that Phase 1D was not started. Archive this record only after both target
gates pass.
