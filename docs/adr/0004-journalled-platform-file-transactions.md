# ADR 0004: Journalled platform file transactions

**Status:** Accepted<br>
**Date:** 2026-09-14

## Context

Phase 0's check-then-rename spike detected many races but could not exclude a
non-cooperating writer in the final validation-to-replace interval or prove equivalent
Windows directory-entry durability. Production authoring must not silently overwrite
that writer, and later operations need coordinated multi-path recovery.

No supported platform supplies a portable atomic compare-and-swap over arbitrary file
bytes, identity, and pathname. Multi-file filesystem atomicity is also unavailable.

## Decision

Use one core-owned, multi-mutation transaction-set service with exact base bytes,
SHA-256, platform file identity, normalized relative paths, alternating checksummed
journals, separately retained proposed bytes, and post-operation inspection.

For existing-file replacement:

- macOS uses same-directory renameatx_np with RENAME_SWAP, leaving the displaced
  target available before it is moved to its backup name;
- Windows uses ReplaceFileW with the required same-volume backup argument.

The displaced revision is compared with the expected base after the platform
operation. A final-window external writer is therefore preserved and becomes an
explicit conflict. Each path commits sequentially; the journal makes the set
recoverable but it is never described as multi-file atomic.

macOS file durability requires successful F_FULLFSYNC and directory fsync. Windows
file handles are flushed, but ordinary-user directory-entry durability is not claimed;
recovery artifacts compensate for the uncertainty. Unsupported primitives or
filesystems fail closed.

The renderer receives no new authority in Phase 1B. Trusted project registration
remains an internal/test seam until Phase 1C.

## Consequences

- Accepted Loomlight bytes and displaced external bytes survive detected races.
- Journals explain termination before, during, and after every persistent boundary.
- A transaction set can coordinate multiple paths but is a recoverable sequence, not
  a multi-file atomic commit.
- Explicit save/flush and revision-guarded undo/redo use the same boundary.
- Successful transactions retain before/after evidence; pruning and recovery UX are
  later work.
- Filesystems lacking required identity/exchange/flush behavior may be refused.

## Alternatives rejected

- **Portable check then rename:** leaves the final race window able to destroy newer
  external bytes.
- **Advisory lock only:** non-cooperating editors need not honor it.
- **Overwrite then detect:** detects loss after destroying the only competing copy.
- **Transactional NTFS:** not portable to macOS and not an appropriate cross-platform
  product contract.
- **Calling the multi-path sequence atomic:** inaccurate and would conceal partial
  commit recovery states.

## Evidence

The production core suite injects external writes before and after exchange, stale
hashes, exact-byte mismatches, same-content identity replacement, deletion/recreation,
root/parent/symlink or reparse substitution, partial journal slots, cleanup, explicit
flush, history boundaries, two-path commits, and actual child-process termination at
every persistent transition. Target-platform CI evidence is recorded in the archived
Phase 1B task when the gate closes.

See [the transaction contract](../TRANSACTIONS.md).
