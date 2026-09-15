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

### Corrective amendment — handle-anchored namespace operations

The initial implementation revalidated parent identity but still created sibling
artifacts and invoked platform replacement through later pathname resolution. That
left a material substitution interval, so its original Gate E closure is superseded.

Transaction stage, accepted, and displaced-backup entries now live inside the
transaction's recovery directory and journal version 2 persists only their relative
names. The core opens and retains the approved root plus every traversed directory
component. macOS/Unix creation, inspection, journal rename/cleanup, and exchange are
descriptor-relative and no-follow. macOS swaps the recovery stage entry with the
target entry using `renameatx_np(RENAME_SWAP)` across the two anchored directory
descriptors, then renames the displaced entry inside recovery.

Windows retains each directory handle without `FILE_SHARE_DELETE`, so a process cannot
rename/delete/replace the validated directory chain while the pathname-only
`ReplaceFileW` call runs. Handles use open-reparse-point semantics and the chain is
revalidated at the platform boundary. A final-window regular-file writer remains
supported and preserved as the backup rather than being excluded by a file lock.

The amendment also defines a proved-empty `prepared` transaction as explicitly safe
to abandon and makes pre-mutation `rejected` terminal/non-blocking. Accepted/staged,
conflict, corrupt, and ambiguous states remain blocking. Exact state and residual
platform limits are canonical in [TRANSACTIONS.md](../TRANSACTIONS.md).

### Phase 1D amendment — expected-absence creation and streamed imports

The journal now admits `createNew` mutations with explicit expected-absence semantics.
Trusted core logic resolves the normalized project-relative destination, retains its
parent authority, and durably records proposed bytes plus SHA-256 in recovery before a
platform no-replace rename exposes the file. An existing or racing destination is
never replaced. Mixed create and replace mutations remain a recoverable sequential
set, not multi-file atomicity.

Native-selected media streams from a retained trusted file handle through a 1 MiB
buffer into stage and accepted evidence. Byte count and SHA-256 are verified before
live mutation. Its deliberate 512 MiB limit is separate from the 16 MiB in-memory
source-edit limit.

## Consequences

- Accepted Loomlight bytes and displaced external bytes survive detected races.
- Journals explain termination before, during, and after every persistent boundary.
- A transaction set can coordinate multiple paths but is a recoverable sequence, not
  a multi-file atomic commit.
- Explicit save/flush and revision-guarded undo/redo use the same boundary.
- Successful transactions retain before/after evidence; pruning and recovery UX are
  later work.
- Transaction evidence no longer appears beside an authoring target or stores absolute
  project paths in its journal.
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
root/parent/recovery-directory/target symlink or reparse substitution, partial journal
slots, safe `prepared` abandonment, terminal rejection, cleanup, explicit flush,
history boundaries, two-path commits, and actual child-process termination at every
persistent transition. Target-platform corrective evidence is recorded in the Phase
1B remediation task when the gate re-closes.

See [the transaction contract](../TRANSACTIONS.md).
