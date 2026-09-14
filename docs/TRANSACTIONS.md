# Production transaction and recovery contract

**Applies from:** Phase 1B<br>
**Supported targets:** Windows x86-64 and macOS Apple Silicon ARM64

## Guarantee

All later Loomlight source-authoring writes must pass through the core transaction
service. A transaction contains one or more normalized project-relative mutations and
exact base revisions. Ren'Py source bytes remain authoritative; this layer does not
parse, normalize, or regenerate them.

The guarantee is deliberately narrower than filesystem compare-and-swap:

- a successful per-path replacement exposes the old complete file or the new complete
  file, not a mixed/truncated file;
- every proposed byte sequence is file-flushed and separately retained before the
  first namespace mutation;
- the displaced target is retained by the platform operation and compared with the
  exact base after replacement;
- a writer that wins the final check-to-replace interval is retained as the displaced
  backup and produces CONFLICT;
- a writer after replacement is detected before acceptance/flush, while the accepted
  Loomlight bytes remain in the transaction-owned accepted copy;
- a multi-path transaction is a journalled recoverable sequence, not an atomic
  all-files commit.

Loomlight never guesses which conflicting revision should win.

## Authority and revisions

Project registration is an internal trusted-core function for Phase 1B tests only. It
canonicalizes an already approved root, records its file identity, and returns an
opaque project ID. It is not exposed through renderer IPC. Phase 1C owns the real
picker and lifecycle.

Each request contains the opaque project ID; a normalized forward-slash relative
path; an extensible mutation kind; exact expected bytes; SHA-256 and platform file
identity for those bytes; and proposed bytes. The interface accepts a vector of
mutations rather than a single-path call. Phase 1B implements replacement of existing
files only; the mutation-kind boundary can add create/remove semantics for later
source lifecycle and obsolete derivative-file operations without replacing the
transaction-set interface.

Unix identity is device plus inode. Windows identity is volume serial plus 64-bit file
index obtained from a handle. The approved root, every existing path component,
immediate parent, target identity, exact bytes, and SHA-256 are checked. Symlinks are
denied; Windows paths also deny any reparse-point component. Absolute paths,
backslashes, traversal, non-normal components, duplicate paths, and unapproved project
IDs are rejected.

## Persistent state machine

Two checksummed alternating journal slots are kept under
.renpy-editor/recovery/transaction-id/. A slot is written and file-flushed before
rename; the containing directory is synced where the platform exposes a useful
ordinary-user operation. A partial newest slot falls back to the highest valid older
sequence. No valid slot produces RECOVERY_REQUIRED.

| State | Persistent facts | Termination result |
| --- | --- | --- |
| proposed | Memory only; no mutation boundary | Nothing accepted or written |
| prepared | Base revisions, paths, kinds, hashes, artifact names | Safe to abandon; no staged bytes |
| staged(n) | Proposed and accepted copies for mutation n are file-flushed | Base remains live; proposed bytes retained |
| commitIntent(n) | Immediate revalidation passed; exchange may or may not have run | Inspect target/stage/backup; never infer |
| exchanged(n) | Platform operation returned; displaced target should be retained | Compare target, accepted, stage, and backup |
| verified(n) | Installed proposal and displaced exact base verified | Earlier paths may be committed; later paths remain staged |
| committed | Every path verified | File/namespace flush still pending |
| durable | Required supported-platform flush calls returned successfully | Application-level accepted and flushed |
| conflict(n) | A competing or later revision was observed | Preserve all revisions; user resolution required |
| recoveryRequired | I/O/capability/ambiguous state | Preserve all artifacts; user resolution required |
| rejected(code) | No persistent staged mutation was accepted | No blind write occurred |
| cleaned | Recovery acknowledged; partial journal slots removed | Accepted/displaced evidence remains retained |

Recovery inspection classifies each mutation as prepared-without-stage,
staged-with-base-intact, exchange-complete-expected, exchange-complete-conflict,
external-revision-with-accepted-copy, durable, or ambiguous. It follows neither
symlinks nor journal paths outside the approved root.

## Platform primitives and durability

### macOS ARM64

- Existing-file commit uses same-directory renameatx_np with RENAME_SWAP. The old
  target is then renamed to the transaction backup.
- Stage, accepted, installed, and displaced files require F_FULLFSYNC. If the mounted
  filesystem/device does not support it, the operation refuses or enters recovery; it
  does not silently downgrade to fsync.
- Parent and journal directories use fsync after namespace changes.
- The swap is one-path atomic namespace exchange. The subsequent backup rename and a
  multi-path set are recoverable sequences, not one atomic transaction.
- Apple documents that ordinary fsync can retain drive-cache/power-loss exposure and
  identifies F_FULLFSYNC for stricter ordering. Hardware can still fail or misreport
  persistence, so sudden-power-loss survival is a strongest-practical request rather
  than an absolute physical guarantee.

### Windows x64

- Existing-file commit uses ReplaceFileW with an explicit same-volume backup path.
  Microsoft documents that replacement and backup must be on the same volume and that
  the resulting target has the replacement file's identity.
- Stage, accepted, installed, displaced, and journal files use Rust sync_all, mapping
  to the platform file-buffer flush.
- REPLACEFILE_WRITE_THROUGH is documented as unsupported, so Loomlight does not claim
  that ReplaceFileW alone makes the directory entry power-loss durable.
- Windows exposes volume flushing only with administrative privilege. Loomlight does
  not request that excessive authority and therefore makes no ordinary-user
  directory-entry durability claim. The journal, accepted copy, and displaced backup
  provide bounded recovery if namespace persistence is uncertain.

### Filesystem assumptions

Target, stage, accepted, and backup are same-parent siblings, satisfying same-volume
requirements. Required identity, replacement/exchange, and flush calls must succeed.
Local APFS and normal local Windows filesystems are the intended gate baseline.
Network, removable, virtualized, nonstandard, or capability-limited filesystems may
refuse or return RECOVERY_REQUIRED; support is not inferred merely because a path can
be opened. No filesystem or hardware is claimed to survive every abrupt power loss.

Authoritative references:

- Microsoft [ReplaceFileW](https://learn.microsoft.com/windows/win32/api/winbase/nf-winbase-replacefilew)
- Microsoft [FlushFileBuffers](https://learn.microsoft.com/windows/win32/api/fileapi/nf-fileapi-flushfilebuffers)
- Microsoft [GetFileInformationByHandle](https://learn.microsoft.com/windows/win32/api/fileapi/nf-fileapi-getfileinformationbyhandle)
- Microsoft [CreateFileW](https://learn.microsoft.com/windows/win32/api/fileapi/nf-fileapi-createfilew)
- Apple [fsync and F_FULLFSYNC](https://developer.apple.com/library/archive/documentation/System/Conceptual/ManPages_iPhoneOS/man2/fsync.2.html)

The target macOS SDK headers compile-check renameatx_np and RENAME_SWAP on ARM64; they
are not assumed available on non-macOS systems.

## Save, history, cleanup, and renderer authority

Automatic persistence and explicit save/flush use the same service. Flush reports
flushed only when no nonterminal journal exists and platform flushes succeed. It
reports conflict or recoveryRequired for conflicting, pending, ambiguous, partial, or
failed work.

History entries retain exact before/after bytes and revisions for a multi-path
transaction. Undo requires every current revision to equal the recorded after
revision; redo requires every current revision to equal the recorded before revision.
Any external revision returns HISTORY_BOUNDARY before a proposal is produced.

Only exact transaction-owned names under a validated transaction ID may be cleaned.
Recovery finalization removes partial alternating-slot temporary files and marks the
journal cleaned; it retains accepted/displaced evidence and never deletes
suffix-matching or unrelated user files. Retention/pruning policy and recovery UI are
later milestones.

Phase 1B adds no renderer operation. The only desktop IPC remains the Phase 1A
versioned core_request allowlist, scoped to local WebView main. No Tauri filesystem,
shell, process, HTTP, opener, root-picker, or credential permission is added.

## Phase 1B gate evidence

[Production run 34797222616](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34797222616)
at `85690bd4ebde95f9ee707175e54336bfd83af0f8` passed this contract on Windows x64
job 103832559663 and macOS ARM64 job 103832559907 with locked Node 24.19.0, npm
11.9.0, and Rust/Cargo 1.90.0 toolchains. The complete fixture and crash-point list,
local commands, retained artifacts, and failed-run resolution are recorded in the
[archived Phase 1B task](tasks/archive/2026-09-14-phase-1-transaction-recovery.md).
