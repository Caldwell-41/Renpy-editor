# Task: Phase 1C lifecycle durability and race remediation

**Status:** In progress 2026-09-14  
**Scope:** Corrective Phase 1C only; Phase 1D remains unapproved

## Reopened findings

1. Make the managed Ren'Py SDK directory and checksum-derived provenance one staged,
   verified promotion unit, with bounded recovery for current-layout provenance,
   abandoned stages/candidates, and partial downloads.
2. Replace truncating Recent Projects persistence with private sibling staging,
   platform-correct file flush, atomic replacement, retained directory authority, and
   restart-safe cleanup.
3. Prove the project-stage races after final validation and during child execution.
   Privileged Unix/macOS child work must consume the retained stage descriptor;
   Windows must pin the namespace through process creation. Promotion must reject and
   preserve/quarantine any replacement rather than allowing it to become final.

## Required evidence before closure

- Deterministic returned-error and real subprocess-termination tests for SDK and
  Recent Projects persistent boundaries.
- Supported-target regressions for pre-use/in-flight child substitution, final
  promotion substitution, Windows reparse behavior, macOS durability, and managed SDK
  restart recovery using the official pinned archive.
- The complete documented local gate and Windows x64/macOS ARM64 production gate.
- A fresh review of all Phase 1C behavior and canonical documentation reconciled to
  the implementation, including failed/superseded evidence and remaining limits.

Do not archive this brief or re-close Phase 1C until those requirements pass. Do not
begin Phase 1D or any later milestone.
