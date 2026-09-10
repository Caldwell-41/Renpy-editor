# ADR 0001: Exact source bytes with a conservative partial CST

**Status:** Accepted<br>
**Date:** 2026-09-10

## Context

Project Loomlight must visually edit Ren'Py while preserving comments, whitespace,
identifiers, embedded Python, unsupported syntax, and external edits. Ren'Py is not
ordinary Python, community grammars are incomplete, and the official SDK CLI/parser
is not a stable token-preserving persistence API.

Phase 0 evaluated current community tree-sitter candidates and implemented an isolated
byte-slice proof over the representative fixture corpus. Results are recorded in
[the spike report](../research/PARSER_SPIKE_RESULTS.md).

## Decision

The source service will use the original file bytes as authoritative source storage.
Its structural model is a conservative, recoverable partial CST whose nodes reference
exact byte ranges. Supported visual edits become verified minimal patches against an
expected content revision and expected source bytes.

Unsupported, ambiguous, and incomplete syntax remains opaque source at its original
location and marks the owning visual scope partially visual. No-op serialization
returns the original bytes. External parser/grammar adapters may contribute structure,
but they cannot become the persistence authority or require whole-file regeneration.
The selected official Ren'Py SDK remains the compile/lint authority.

This ADR selects the architectural source model, not the disposable Python tokenizer
or a final grammar implementation.

## Consequences

- Losslessness does not depend on every Ren'Py construct being understood.
- Parser coverage can expand incrementally without converting unknown text.
- Every edit needs source-range, expected-byte, revision, conflict, and SDK tests.
- The model must distinguish source offsets from decoded character/editor positions.
- Stable IDs and range remapping require explicit metadata and reconciliation logic.
- A community tree-sitter grammar can be adopted only after pinned coverage, recovery,
  performance, maintenance, and licence review; its tree remains advisory.
- Some visual operations will be refused around unsafe opaque boundaries instead of
  guessing or normalizing source.

## Alternatives rejected

- **Regex rewriting:** cannot safely model nested Ren'Py, strings, screens, ATL, or
  embedded Python and risks collateral changes.
- **Regenerate whole `.rpy` files from an editor model:** makes metadata a competing
  truth and destroys unsupported formatting/content.
- **Ren'Py private parser internals as persistence:** stability and trivia-preserving
  round trips are not guaranteed; use only behind a versioned investigative adapter.
- **Current community grammar as sole parser:** inspected candidates have material
  coverage gaps and no declared repository licence.

## Revisit conditions

Revisit only if an official or suitably licensed parser demonstrates complete required
coverage, recoverable editing, exact trivia/source preservation, and maintainable
cross-platform integration. Even then, migration must pass the golden corpus without
changing authoritative bytes.
