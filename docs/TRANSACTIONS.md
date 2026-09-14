# Production transaction and recovery contract

**Applies from:** Phase 1B<br>
**Supported targets:** Windows x86-64 and macOS Apple Silicon ARM64

## Guarantee

All later Loomlight source-authoring writes must pass through the core transaction
service. A transaction contains normalized project-relative mutations and exact base
revisions. Ren'Py source bytes remain authoritative; this layer does not parse,
normalize, or regenerate them.

The guarantee is deliberately narrower than filesystem compare-and-swap:

- a successful per-path replacement exposes the old complete file or new complete
  file, not mixed/truncated bytes;
- every proposal is file-flushed and separately retained before the first namespace
  mutation;
- every transaction-owned artifact is created under the transaction's validated
  `.renpy-editor/recovery/transaction-id/` directory, never beside an authoring target;
- the platform operation retains the displaced target, which is compared with the
  exact base after replacement;
- a final-window writer is retained as the displaced backup and produces `CONFLICT`;
- a writer after replacement is detected before acceptance/flush while the accepted
  Loomlight bytes remain retained; and
- a multi-path transaction is a journalled recoverable sequence, not an atomic
  all-files commit.

Loomlight never guesses which conflicting revision should win.

## Authority, anchored paths, and revisions

Project registration is a trusted-core test seam in Phase 1B and is not exposed to
renderer IPC. It canonicalizes an approved root, opens and retains its directory
handle, records its identity, and returns an opaque project ID. Phase 1C owns the real
picker and lifecycle.

Each request contains the project ID, normalized forward-slash relative path,
extensible mutation kind, exact expected bytes, SHA-256 plus platform identity, and
proposed bytes. The interface accepts a mutation vector. Phase 1B implements replacement
of existing files only.

Unix identity is device plus inode. Windows identity is volume serial plus 64-bit file
index obtained from a handle. The root and each existing directory component are
opened as a retained handle chain. Target reads, transaction artifact creation,
journal replacement, and macOS exchange/rename are relative to those handles. Windows
retains every directory handle without `FILE_SHARE_DELETE`, preventing its rename or
deletion while pathname-only `ReplaceFileW` runs. Chains and identities are checked at
each externally interruptible boundary.

Symlinks are denied; Windows also denies every reparse-point component. Absolute paths,
backslashes, traversal, non-normal components, duplicate paths, unsafe device names,
and unapproved project IDs are rejected.

## Persistent state machine

Two checksummed alternating slots live under
`.renpy-editor/recovery/transaction-id/`. Version 2 journals persist relative evidence
names, never absolute project paths. A slot is file-flushed before anchored rename and
the containing directory is synced where the platform exposes a useful ordinary-user
operation. A partial newest slot falls back to the highest valid older sequence; no
valid slot produces `RECOVERY_REQUIRED`.

| State | Definite facts and possible bytes | Live path changed? | Cleanup/resolution | Flush and restart |
| --- | --- | --- | --- | --- |
| `proposed` | Memory only; no journal or accepted bytes | No | Nothing to clean | Not discoverable |
| `prepared` | Journal records bases, hashes, and relative evidence names; no stage/accepted/backup may exist | No | Safe abandon only when all flags are false and anchored absence of every evidence name is proved | Blocks until explicitly finalised `cleaned`; restart exposes `prepared` |
| `staged(n)` | File-flushed stage and accepted copies exist for staged mutations; exact base is expected live | No for current mutation | Retain accepted bytes; explicit recovery required | Blocks; restart inspects all revisions |
| `commitIntent(n)` | Final validation passed; exchange may or may not have run | Unknown | Never infer or auto-discard | Blocks; restart classifies all evidence |
| `exchanged(n)` | Platform operation returned; displaced evidence should exist | Yes for `n` | Verify or require explicit resolution | Blocks until verified/resolved |
| `verified(n)` | Proposed bytes are live and exact base is displaced for `n`; earlier paths may also be installed | Yes through `n` | Retain evidence; resume/resolve explicitly after crash | Blocks until terminal |
| `committed` | Every path verified; final durability pass incomplete | Yes, all paths | Preserve evidence | Blocks until durability established |
| `durable` | Required supported-platform flush requests returned | Yes, all paths | Terminal; later pruning policy may remove evidence | Non-blocking after restart |
| `conflict(n)` | Competing/later bytes observed; accepted and displaced/external evidence retained where available | Maybe | User resolution/acknowledgement required; never automatic | Blocks after restart |
| `recoveryRequired` | I/O, capability, or inspection is ambiguous | Unknown | User resolution/acknowledgement required; never automatic | Blocks after restart |
| `rejected(code)` | Rejected before staged/accepted persistence; no live mutation attempted | No | Terminal; forensic journal may remain | Non-blocking after restart |
| `cleaned` | Safe abandon or explicit recovery acknowledgement journalled; only partial slot temporaries removed | As recorded previously | Terminal; accepted/displaced evidence retained | Non-blocking after restart |

Recovery classifies each mutation as prepared-without-stage, staged-with-base-intact,
exchange-complete-expected, exchange-complete-conflict,
external-revision-with-accepted-copy, durable, or ambiguous. It follows neither
symlinks nor journal-provided paths.

## Platform primitives and durability

### macOS ARM64

- Roots, components, recovery directories, and targets use descriptor-relative
  `openat` plus `O_NOFOLLOW`; creation uses
  `openat(O_CREAT|O_EXCL|O_NOFOLLOW)`, while cleanup/rename uses `unlinkat` and
  `renameat`.
- Existing-file commit uses `renameatx_np(RENAME_SWAP)` between the anchored recovery
  directory's stage entry and anchored target parent. The displaced target lands at
  the stage entry and is renamed to the backup inside recovery.
- Stage, accepted, installed, displaced, and journal files require `F_FULLFSYNC`.
  Parent/recovery directories use `fsync` after namespace changes. Unsupported calls
  refuse or enter recovery; they never silently downgrade.
- The swap is one-path atomic. The later backup rename and a multi-path set are
  recoverable sequences, not one atomic transaction.
- macOS does not offer an ordinary API that prevents another same-user process from
  renaming an already-open directory. Loomlight revalidates every retained identity at
  the platform boundary and operates on the validated descriptors, so deterministic
  substitution before that boundary fails closed and pathname replacement cannot
  retarget the syscall. The kernel operation remains scoped to the validated directory
  objects rather than a claim of atomic namespace ancestry compare-and-swap.

### Windows x64

- Root/path/recovery directories use `CreateFileW` semantics with
  `FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAG_OPEN_REPARSE_POINT`, sharing reads/writes but
  omitting `FILE_SHARE_DELETE`. Retained chain handles prevent those directory objects
  from being renamed/deleted/replaced during the sensitive operation.
- Existing-file commit uses pathname-only `ReplaceFileW` while target-parent and
  recovery chains are pinned, with an explicit same-volume backup inside recovery.
  Microsoft documents that the resulting target takes the replacement identity.
- `FILE_FLAG_OPEN_REPARSE_POINT` and handle metadata deny target/directory reparse
  points. A competing regular target replacement is retained by `ReplaceFileW` and
  classified after the operation.
- Stage, accepted, installed, displaced, and journal files use file-buffer flushes.
  `REPLACEFILE_WRITE_THROUGH` is unsupported. Loomlight does not claim ordinary-user
  directory-entry power-loss durability; journal/accepted/backup evidence bounds
  recovery instead.

### Filesystem assumptions and limits

Target and recovery evidence remain inside the approved root and on one project
volume. Stage, accepted, and backup are siblings in one recovery directory. Required
identity, no-follow, replace/exchange, and flush behavior must succeed. Local APFS and
normal local Windows filesystems are the gate baseline. Network, removable,
virtualized, nonstandard, mounted sub-volume, or capability-limited layouts may refuse
or return recovery-required. No filesystem/hardware is claimed to survive every power
failure.

Authoritative references:

- Microsoft [ReplaceFileW](https://learn.microsoft.com/windows/win32/api/winbase/nf-winbase-replacefilew)
- Microsoft [CreateFileW](https://learn.microsoft.com/windows/win32/api/fileapi/nf-fileapi-createfilew)
- Microsoft [FlushFileBuffers](https://learn.microsoft.com/windows/win32/api/fileapi/nf-fileapi-flushfilebuffers)
- Apple [open/openat](https://developer.apple.com/library/archive/documentation/System/Conceptual/ManPages_iPhoneOS/man2/open.2.html)
- Apple [rename/renameat](https://developer.apple.com/library/archive/documentation/System/Conceptual/ManPages_iPhoneOS/man2/rename.2.html)
- Apple [fsync and F_FULLFSYNC](https://developer.apple.com/library/archive/documentation/System/Conceptual/ManPages_iPhoneOS/man2/fsync.2.html)

## Save, history, cleanup, and renderer authority

Automatic persistence and explicit save/flush use the same service. `durable`,
`cleaned`, and pre-mutation `rejected` are non-blocking. `prepared` blocks until
anchored inspection proves safe abandon and explicit finalisation records `cleaned`.
Staged through committed, conflict, recovery-required, ambiguous, corrupt, and partial
states block.

History retains exact before/after bytes and revisions. Undo/redo requires current
revisions to match the recorded boundary and returns `HISTORY_BOUNDARY` before
producing a stale proposal.

Recovery finalisation removes only partial alternating-slot temporaries and records
`cleaned`. For `prepared`, all mutation flags must be false and every evidence entry
must be proven absent; errors never count as absence. Accepted/displaced evidence is
retained in every other explicitly acknowledged recovery. Retention/pruning and
user-facing resolution remain later work.

Phase 1B adds no renderer operation or ambient filesystem/process/network authority.

## Phase 1B corrective gate evidence

[Production run 34801268319](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34801268319)
at `302a2b2ab9b043b19e231b921493824ac9c8ad68` passed actual Windows x64 job
103844270268 (31 passed, 0 failed, 1 ignored child-process worker) and macOS ARM64 job
103844270072 (32 passed, 0 failed, 1 ignored worker). Both jobs also passed desktop
tests, production packaging, packaged WebView denial smoke, artifact secret scanning,
and dependency/licence inventory. Evidence artifacts are 10331303970 (Windows,
SHA-256 `6ae436a4befc0949f97b4299e0c4d79483d26026cb8ab23a8b7b9a701bf8e3c3`)
and 10331433193 (macOS, SHA-256
`8622d55bc4b5403a8b5843b3af1eafcee02213c470554457ea77c5b5d7a72347`). Quality
run 34801268255 passed. This actual target evidence re-closes Gate E; Phase 1C remains
separately approval-gated.

The original Phase 1B run 34797222616 remains historical evidence. Corrective run
34800849992 is retained failed evidence: macOS passed, while Windows exposed a
writable-handle requirement in post-replacement flushing and a test that incorrectly
expected a pinned root rename to succeed. Both were corrected before the successful
run; no skipped step is counted as passing. See the archived corrective task for exact
failed job and artifact identifiers.
