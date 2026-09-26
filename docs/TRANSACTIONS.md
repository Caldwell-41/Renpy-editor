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
proposed bytes. The interface accepts a mutation vector. Phase 1B introduced
replacement of existing files; Phase 1D added no-replace creation, and Phase 1E adds
proven-existing deletion for Scene lifecycle transactions. All kinds retain the same
journal, recovery preflight, path authority, and revision checks.

Unix identity is device plus inode. Windows identity is volume serial plus 64-bit file
index obtained from a handle. The root and each existing directory component are
opened as a retained handle chain. Target reads, transaction artifact creation,
journal replacement, and macOS exchange/rename are relative to those handles. Windows
retains every directory handle without `FILE_SHARE_DELETE`, preventing its rename or
deletion while pathname-only `ReplaceFileW` runs. Chains and identities are checked at
each externally interruptible boundary.

Recovery discovery uses the same anchored model. On macOS/Unix, Loomlight validates
that the current recovery pathname still names the retained recovery directory,
duplicates the validated directory descriptor, and enumerates transaction entries with
`fdopendir`/`readdir`; it revalidates the chain after enumeration. A rename/replacement
of the recovery pathname therefore produces recovery-required/identity failure rather
than an empty report. On Windows, recovery enumeration runs while the retained recovery
chain remains pinned against rename/delete and is validated before and after the
pathname enumeration.

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
symlinks nor journal-provided paths. Recovery-directory namespace substitution fails
closed instead of allowing unresolved transactions to disappear from Save/Flush.

## Platform primitives and durability

### macOS ARM64

- Roots, components, recovery directories, and targets use descriptor-relative
  `openat` plus `O_NOFOLLOW`; creation uses
  `openat(O_CREAT|O_EXCL|O_NOFOLLOW)`, while cleanup/rename uses `unlinkat` and
  `renameat`.
- Recovery discovery validates the pathname-to-anchor identity, duplicates the
  validated directory descriptor, enumerates entries through `fdopendir`/`readdir`,
  and validates the anchor chain again before accepting the report.
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
- Recovery directory enumeration remains pathname-based only while the already-open
  recovery chain is pinned against rename/delete; the chain is revalidated before and
  after enumeration.
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

Phase 1C project directory creation is deliberately not routed through this
replacement-only protocol. ADR 0005 defines a separate capability-specific sibling
stage and no-replace directory promotion. Once later authoring edits existing project
files, this Phase 1B transaction service remains their sole production write boundary.

Automatic persistence and explicit save/flush use the same service. `durable`,
`cleaned`, and pre-mutation `rejected` are non-blocking. `prepared` blocks until
anchored inspection proves safe abandon and explicit finalisation records `cleaned`.
Staged through committed, conflict, recovery-required, ambiguous, corrupt, and partial
states block. If recovery enumeration cannot prove that the pathname still names the
anchored recovery directory, scan returns recovery-required and Save/Flush remains
blocked rather than accepting an apparently empty replacement directory.

History retains exact before/after bytes and revisions. Undo/redo requires current
revisions to match the recorded boundary and returns `HISTORY_BOUNDARY` before
producing a stale proposal.

Recovery finalisation removes only partial alternating-slot temporaries and records
`cleaned`. For `prepared`, all mutation flags must be false and every evidence entry
must be proven absent; errors never count as absence. Accepted/displaced evidence is
retained in every other explicitly acknowledged recovery. Phase 1E exposes only
resolution choices that the report proves safe, requires explicit confirmation,
revalidates after completion, and resumes authoring only from a terminal non-blocking
state. Ambiguous records remain blocked. Advanced merge and evidence retention/pruning
remain later work.

Phase 1B adds no renderer operation or ambient filesystem/process/network authority.

## Phase 1E Scene lifecycle, recovery, and history

Scene create, move, and delete are semantic multi-file operations assembled in core.
They combine exact minimal Scene source changes with project/source-map companions.
Creation requires proven destination absence. Move is a create-new destination plus a
proven-existing old-source deletion. Deletion uses exact expected bytes and identity.
If an old `.rpy` path has a same-basename `.rpyc`, it is included only when ownership is
proven; unrelated compiled files are never broadly removed.

Delete durability verifies the retained displaced backup through a handle opened with
flush authority. This matters on Windows, where `FlushFileBuffers` on the ordinary
read-only evidence handle is not a valid durability check; a successful namespace
move must not be misreported as recovery-required merely because the wrong handle mode
was used for the final flush.

Entry/last Scene constraints, incoming Choice/Jump references, and opaque ownership
are checked before producing a destructive proposal. Chapter order remains metadata
organisation and does not rewrite runtime flow. A display rename changes metadata only.

Every completed semantic commit returns the actual revisions and identities for all
affected paths. Session-local history stores those boundaries and exact before/after
bytes. Undo and redo submit inverse semantic transactions through this same service;
the cursor advances only after a successful commit. External changes, a failed inverse,
or recovery-required state stop at `HISTORY_BOUNDARY`/the corresponding blocked state
without overwriting live bytes. Close/reopen deliberately clears the history cursor.

The recovery renderer is an inspection/resolution client, not a journal editor. It can
show affected paths and accepted/displaced evidence and invoke only the typed safe
resolution returned by core. It cannot delete the journal, select arbitrary files,
infer the newest revision, or restore Git state.

## Phase 1F Source acceptance and reconciliation

Source editor text is a bounded, session-local draft over an exact accepted base; it
is not a transaction until explicit Save. Preflight checks UTF-8/size, bounded syntax,
live base revision, mapping companions, and recovery before building a proposal. A
refusal leaves both disk and the draft unchanged. A successful acceptance records the
source origin and actual returned revisions in the same session-local history used by
Scene operations. Save All performs this preflight for every dirty buffer before
submitting one mutation vector; the vector remains a recoverable sequential commit,
not all-files atomicity.

A clean verified external revision replaces the buffer base and reconciles its
source-map projection transactionally when required. A dirty external revision keeps
base, draft, and external bytes and blocks stale writes. Core computes conservative
single exact base-relative patches; only non-overlap exposes a combined preview and
confirmed Apply Both proposal against the verified external revision. Confirmation uses
`SourceApplyBothRequest`: path, accepted base hash, draft version, reviewed external
hash, and exact displayed combined text. Core refreshes disk and checks every binding
before creating a proposal; it never substitutes a newer draft or external combination.
The renderer invalidates changed reviews immediately, checks again after retention,
and requires Refresh/review before another confirmation. Refusal preserves the draft
and external bytes. The proposal still carries the external file identity, exact bytes
and revision through the existing transaction/recovery boundary. A final-window writer
is retained as recovery evidence and never silently accepted. Same-position insertions
have no provable ordering and are refused. Overlap, missing/renamed files, invalid encoding, ambiguous mapping, or recovery state produces
no proposal. Dirty-file guards also stop same-file Scene/supporting/file-lifecycle and
history writes. Unresolved transaction recovery retains its project-wide block.

## Phase 1D create-new and import extension

`replaceExisting` retains its exact base-byte, hash, and file-identity contract.
`createNew` records expected absence. The trusted core chooses the normalized
project-relative destination, resolves and retains the parent chain, stages accepted
bytes under `.renpy-editor/recovery/<transaction-id>/`, records commit intent, and
promotes with the no-replace platform primitive. A destination that exists initially
or wins before promotion is never overwritten.

Small source/metadata creates retain the 16 MiB per-mutation memory bound. Media uses
a separate streaming entry point: a retained native-picker source handle is hashed and
copied with a 1 MiB buffer, stage is copied to independent accepted evidence, and
count/hash are verified. The defensive maximum is 512 MiB. Oversize input is rejected
before live mutation. Media creation and its authoring metadata companion share one
journal and recover as a sequential mixed set.

Lifecycle opening registers the current project and checks recovery first. Close or
switch unregisters that ephemeral authority and clears import capabilities. Durable,
rejected, and cleaned journals do not block; staged, commit-intent, exchanged,
conflict, corrupt, or ambiguous journals block later authoring as `Recovery required`.

## Phase 1B corrective gate evidence

The latest recovery-enumeration correction is evidenced by
[production run 34804861387](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34804861387)
at `dc2efdf845fd014c57e850f2c96683fd487da592`:

- Windows x64 job 103854628315 on Windows Server 2025 passed the independent core
  suite with 31 passed, 0 failed, and 1 ignored child-process worker, then passed the
  desktop boundary, packaging, packaged WebView denial smoke, artifact secret scan,
  and dependency/licence inventory. Evidence artifact 10332572412 has SHA-256
  `5195042e24796f21f814e1e1e9049785eaf7441aa48a1d4b6d99011d7e0738bc`.
- macOS ARM64 job 103854628300 on macOS 26.6.2 / Darwin 25.6.0 passed the independent
  core suite with 33 passed, 0 failed, and 1 ignored worker. This includes
  `anchored_recovery_enumeration_rejects_path_substitution`, which replaces the live
  recovery pathname with an empty directory and proves identity failure rather than an
  empty recovery result. Desktop boundary, packaging, packaged WebView denial smoke,
  artifact secret scan, and dependency/licence inventory also passed. Evidence artifact
  10333101940 has SHA-256
  `a055f22550acd0f0c166ce288a09ed3537ba72cfe78e0f52b0f289f3332309a5`.

Both jobs used Node 24.19.0, npm 11.9.0, rustc 1.90.0, and Cargo 1.90.0. Quality run
34804861410 passed at the same commit. Full package upload was intentionally skipped on
this routine push; the lightweight transaction/smoke/dependency evidence uploads
succeeded. This run supersedes the earlier corrective closure evidence for Gate E.
Phase 1C remains separately approval-gated.

Production run 34804735119 at `c0d881a480b0c64f1cd5d43dc22895f75edf889a`
is retained failed evidence: both target jobs passed setup, frontend validation, and
frontend build but stopped at `cargo fmt --check --all`; Rust core tests and all later
steps were skipped. The exact rustfmt diff was applied in `dc2efdf`; this was a
formatting defect, not a retried functional failure.

Production run 34801268319 remains historical evidence for the preceding parent/path,
`Prepared`, and terminal-`Rejected` correction. The original Phase 1B run 34797222616
and corrective run 34800849992 also remain historical/failed evidence as documented in
the archived corrective task; no skipped step is reclassified as passing.

## Integrated corrective contract

All public write entry points, including ordinary commits and streaming imports,
perform blocking-recovery preflight while holding the same transaction serialization
lock used by flush and recovery finalisation. Status scanning is read-only and never
acknowledges recovery. Terminal durable/rejected/cleaned journals are checksum/schema
validated without reopening and hashing historical media; unresolved journals still
receive detailed bounded inspection and fail closed.

Revision verification and recovery hashing read incrementally with a 1 MiB buffer.
Small mutation snapshots remain capped at 16 MiB, journals at 1 MiB, and recovery
mutation count per journal at 4096. There is no 4096-journal lifetime cap: write
readiness completely enumerates retained history with constant working memory, validates
each terminal journal's schema/checksum without rehashing historical media, and still
finds later corrupt or unresolved entries. An explicit recovery report remains
output-proportional so it can describe every retained record. The 512 MiB media and
revision-read maximum is enforced incrementally, including growing-input detection.

Native selections retain an anchored parent directory and open the regular file
descriptor-relative with no-follow/reparse-safe semantics before deriving size,
identity, or hash. The retained selected handle supplies every imported byte; parent,
pathname identity, count, and hash are revalidated, so ancestor substitution,
same-path replacement, or same-file mutation cannot redirect or silently change the
copy.

## Runtime compatibility reservation

Phase 1G.2a reserves execution under the same serial lock as transaction commit and
streaming import. Launch therefore drains prior imports; later imports are refused
before reading or staging. Preparation/validation/cleanup block invalidating mutations.
During established play, script replacement/new scripts and required metadata are
allowed; new chapter directories are allowed. Assets/inventory, mixed mutations, and
loaded script/compiled move/delete or history inverses require Stop. Checks occur before
journal/history changes, cover Undo/Redo and preserve all prior revision/recovery guards.
The exact runtime policy script is protected while executing. Accepted transactions can
advance session consent only from its recorded base identities and hashes.

Runtime cleanup failure retains its reservation. A project cannot be unregistered
while an execution reservation remains active. See [ADR 0008](adr/0008-controlled-runtime.md)
and the [1G ledger](tasks/active/phase-1g-branches-runtime-git.md#13-1g2a-execution-ledger)
for resource bounds, implementation status and native evidence.
