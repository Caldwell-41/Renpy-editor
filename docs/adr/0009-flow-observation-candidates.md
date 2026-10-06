# ADR 0009: Cached flow candidates with fresh content verification

**Status:** Superseded by [ADR 0010](0010-local-project-safety-and-observed-flow.md)
on 2026-09-27 following the user's hobby-editor scope reset.
The text below preserves the historical proposal, experiments and failures.
Its mandatory verification, native-proof and continuation requirements are retired;
do not treat them as current instructions. No historical failure is relabelled a pass.
**Date:** 2026-09-27.
**Scope:** Phase 1G.2b G1-V1 observation only. Complements ADRs 0001/0004/0008;
does not replace their source, transaction, recovery or runtime authority.

## Context and decision

The 503-source-file fixture currently reads/hashes every source twice per flow
request. Windows secure read/path/hash work dominates; increasing readers failed.
The measured stage includes opens, directory validation and I/O as well as SHA-256;
the evidence does **not** establish that the hash algorithm itself is expensive.
See [ledger 15–17](../tasks/active/phase-1g-branches-runtime-git.md#17-g1-v1-observation-redesign-review--2026-09-27).

Recommend a **core-private, session-scoped candidate index**, retaining bounded
source bytes and their observed revisions, with **one mandatory fresh secure
content-verification pass over every source before each successful refresh**.
Reacquire only missing/invalidated candidate bytes before projection. This removes
the duplicate *candidate acquisition* pass for unchanged files; it does not skip
their final content verification. No watcher, timestamp cache, change journal,
long-lived file-handle pool, persisted index or background verifier is needed.

This is conditional on a cheap Windows proof: halving the current work alone has
insufficient margin. Qualify a narrow reduction of duplicated per-file validation
syscalls without removing any path/revision checks. If that cannot meet the budget,
stop with G1-V1 blocked; do not quietly substitute eventually consistent caching.

## Observation contract

An index entry is a **candidate**, never a statement that the disk is still current.
Every request selects an immutable candidate generation, projects only those bytes,
then verifies the complete dependency vector using fresh secure opens and SHA-256.
Success requires matching source hashes **and identities**, inventories, metadata,
project registration/session and mutation generation. A clean dirty-bit set, a recent
verification time, or identical size/mtime does not qualify success.

This preserves the existing optimistic read-observation model, not an atomic
multi-file snapshot or continuous protection against external writers. Each file
is compared after projection. An external write after that file's last comparison
can race the response, just as today. The next refresh/navigation/command independently
rechecks; no grace period is added and no timestamp lease is issued. Writes during
the comparison that produce a mismatch, short/growing read or unsafe identity fail
closed. ABA changes that restore identical bytes between observations cannot be
exhaustively detected by either design; no stronger claim is made. A guarantee of
detecting *every historical write* would need a different, explicitly reviewed model.

## Ownership and data

Keep the index alongside flow projection in `AuthoringService`; keep secure reads
and mutation invalidation in `TransactionService`. The key contains the opaque
registered `ProjectId`, open-session generation and root identity; on-disk project
UUID/path alone is insufficient. One active project index and one request owner.

An entry contains normalized relative path, shared immutable bytes, full `Revision`
(hash and identity), and candidate validity. Index state contains sorted inventory,
dirty path set, inventory-dirty/all-dirty flags, generation and readiness. Store no
trust token, transaction proposal, expected-write bytes capability or OS handle.
Unchanged source can be reused to compute all labels and edges again: projection
cost is small, so a second parser/edge cache is unnecessary.

Capture the complete projection dependencies: `.rpy` inventory, project metadata,
source-map metadata, **authoring metadata including expected absence**, and any
further file read by their loaders. `scene::load` currently consumes `list()` but
flow's final metadata loop names only project and source-map revisions. Wiring must
expose and verify the actual authoring dependencies rather than cache this omission.
Keep Source reconciliation before candidate selection. Never cache a live draft as
accepted bytes or bypass 1F's reconciliation/retention rules.

## Request algorithm

1. Check cancellation/deadline, current registration/root, session and recovery
   readiness. Run existing Source refresh/reconciliation first. Capture the mutation
   generation after any reconciliation transaction; an in-progress mutation forbids
   fresh publication. Do not hold the index mutex across I/O or call back into it
   while holding the transaction lock.
2. Load metadata securely and capture its complete dependency revisions. Enumerate
   `game` securely with existing inventory/depth/entry bounds; compare sorted `.rpy`
   paths with the cached inventory. Removals evict; additions/renames invalidate
   affected entries. Label inventory is always global, including unmapped scripts.
3. For cold/missing/dirty entries use secure bounded snapshot/hash reads, checking
   identity/type and length before/after reading. Freeze the candidate vector.
   For a warm one-Scene transaction this reads one source, not all 503. A cache miss
   or unknown invalidation may require a full acquisition; it is never hidden in a
   successful fast-path measurement.
4. Project using this candidate's exact bytes and fresh metadata. Preserve the
   current stale mappings, duplicate/missing/dynamic labels, partial flow and
   over-limit semantics. Recompute all labels/nodes/edges initially.
5. **After projection**, securely reopen and hash every source in the candidate,
   comparing hash and identity with that candidate. Re-enumerate inventory; freshly
   verify all metadata dependencies and registration/root/session/generation.
   Checks cannot be moved before projection to improve the reported time.
6. Publish fresh only if every required comparison succeeds. Otherwise publish the
   existing stale/partial, non-editable result (or a typed failure), record dirty
   paths/unknown invalidation, and leave the index unverified. A verifier hash must
   not be attached to bytes acquired in a different read. Reacquire mismatched bytes
   on the next request, then verify again. No unbounded retry loop or early success.

Initial acquisition retains the existing two-read structure: full secure snapshot
followed by full post-projection verification. A stable externally modified file
can be reacquired next request, but remains stale until existing Source/mapping
reconciliation permits acceptance. An unknown external change is detected by the
current request's verifier even with every notification disabled. It cannot stay
fresh pending a later audit. Retaining an old graph for inspection never retains
editing eligibility after a failed check.

## Invalidation and adversarial cases

| Case | Required behavior |
| --- | --- |
| Same-length in-place write, restored timestamps, open editor handle or mapped write | Full post-projection content read detects a stable changed value independently of metadata. If a write races the read, use existing bounded-read/error checks and the optimistic limitation above; no mtime/identity-only success. |
| Same-byte replacement | Fresh leaf open supplies a different identity: invalidate even if hash is equal. No cached descriptor may keep verifying an unlinked old inode/file. |
| Add/remove/rename, case-only rename, new directory or unmapped `.rpy` | Full before/after inventory, safe path normalization and fresh per-file identity checks. Recompute global labels. Do not case-fold paths or infer rename pairs. Unknown inventory failure marks the whole observation stale. |
| Root/parent/leaf substitution | Preserve canonical registered root and every retained parent identity, no-follow/reparse rejection, current leaf regular-file check and final rechecks. Invalid registration or chain revokes all candidates. Cached bytes may be shown stale but cannot justify further unsafe reads. |
| Loomlight mutation | Invalidate centrally **before first possible live mutation**, not just after success. Advance generation and record touched paths/namespace changes. On completion invalidate again, including rejection after partial work, conflict, undo/redo, Source/Scene acceptance, recovery and runtime-policy installation. Unknown affected paths invalidate all. Pure drafts do not update candidates. |
| Accepted one-file edit | Preserve unaffected candidates. Reacquire the touched source and fresh metadata on the next request; verify all sources before publication. Do not clear all 503 entries merely because the source-map revision changed. |
| Late completion, cancellation, session switch, unregistration | Discard publication and candidate promotion. No stale callback can repopulate a new session's index. Drop the old index; reopen starts cold. |
| Missed/overflowed events | No watchers in this design. If hints are later added, disabled/lost/delayed hints must produce the same verification correctness; overflow/unknown root events invalidate all and force full inventory/acquisition. An empty event queue proves nothing. |
| Crash/restart or cache eviction | Discard the entire index. No hash/index persistence or watcher-cursor recovery. Fresh initial observation is mandatory. |

Mutation invalidation is bookkeeping, not a second transaction coordinator. Use one
small internal generation/dirty-path record under the existing serialized mutation
owner. The flow owner drains/copies it without lock inversion. On overflow collapse
to all-dirty rather than retaining unbounded events. Failure to record invalidation
must disable reuse; it must never reject or reinterpret a committed transaction.
Final full verification remains the backstop for missed hooks and external changes.

## Platform I/O and feasibility boundary

Retain the existing public transaction reader and all write paths. A new
observation-only compound reader may consolidate **duplicate checks within the
same per-file secure-open operation**, not cache their success across requests or
independent file opens. The proof must map every old safety check to its new owner.

Concrete opportunities in the current code are repeated root identity opens in
`validate_root` and `DirectoryAnchor::validate_chain`, then another traversal of
the root in `open_file`; and separate Windows handle queries for identity, length
and type before/after a read. Measure these separately. Consolidate equivalent
queries into one captured observation at the same boundary, retaining canonical
root resolution, complete parent checking, leaf no-follow and post-read checks.
Do not replace any check with a previously sampled metadata record. A helper that
simply skips `validate_chain` is not this proposal.

Windows keeps directory handles without `FILE_SHARE_DELETE` and rejects all reparse
points; leaves retain sharing compatible with external writers and replacement.
Directory pinning does **not** prove immutable contents or exclude all reparse/attribute
mutations. Preserve per-open reparse/type validation and adversarially exercise
in-place reparse changes. Do not amortize validation over 503 opens just because
rename/delete is pinned. Do not introduce deny-write locks, ACL changes, elevation,
antivirus exclusions, volume handles or filesystem-specific USN requirements.

macOS retains descriptor-relative `openat`/`O_NOFOLLOW` and chain revalidation:
an open directory can still be renamed/replaced in the namespace. Device/inode and
nanosecond times do not certify unchanged bytes. Both platforms freshly open leaves,
so external editors' replace-on-save works. macOS may keep its existing secure
reader if the Windows consolidation is platform-specific. Local APFS and the
existing normal local Windows filesystem baseline remain the supported gates;
network/removable/virtualized or missing-capability cases keep existing refusal
semantics, not an implicit promise of 250 ms everywhere.

The compound reader is a **feasibility candidate**, not an established optimization.
If its proof needs a weaker boundary or much broader native machinery, reject it.
Retain the old reader/fail closed; record the performance blocker for another review.

## Bounds, lifetime, deadlines and verification cadence

- Retain the existing 2,048 `.rpy` files / 32 MiB source input / 16 MiB per-file,
  500 Scenes / 2,000 edges and secure inventory limits (8,192 traversal entries;
  existing traversal also caps depth/files). Do not truncate to pass a gate.
- Bound the index's total **unique retained plus in-flight source bytes** to 32 MiB.
  Share immutable blobs; evict obsolete dirty candidates before replacement allocation.
  If simultaneous retention cannot fit, drop reuse and use the bounded cold path.
  Old UI graphs do not need source blobs. Preserve metadata limits, including the
  1 MiB authoring document limit; account metadata, paths and projection allocations
  separately. Keep at most one candidate vector and one bounded dirty set.
- No index-owned descriptors between requests. At most four scoped readers, each
  one current parent chain and one leaf; release the previous chain before another.
  Include traversal depth, transient validation descriptors and shared root in the
  measured peak. Exhaustion returns stale/error, never an unchecked path fallback.
- Preserve caller cancellation and the **original absolute deadline** on all workers;
  check per directory/file, at most 1 MiB per read/hash chunk, and before publication.
  Cached acquisition must use chunked cancellation too. No detached work, retries
  that reset deadlines or cache promotion after cancellation.
- Current `runtime_work::check()` is inactive without installed context; do not
  assume runtime dispatch makes ordinary Branches requests cancellable. Integration
  must bind a flow request to session cancellation and an explicit absolute work
  deadline (proposed 2 s, capped by any earlier caller deadline), with cancellation
  reaching the owner rather than only suppressing renderer display. Keep Stop/status
  on the independent control lane. An OS call itself is not forcibly interruptible.
- The **250 ms accepted-update gate remains an actual successful completion gate**.
  A timeout, stale response, cached immediate reply or background completion is not
  a performance pass. The 2 s work ceiling is failure containment, not a new budget.
- Full verification is required on **every refresh**, including existing visible
  periodic/focus/navigation refreshes. Initial/restart/unknown-invalidated acquisition
  is also full. No separate periodic audit is necessary for correctness, and no
  longer audit interval can substitute for per-request verification. Preserve the
  current UI refresh cadence and action-time rechecks; no always-current claim.

## Why this cannot authorize a write or execution

Keep index types private and distinct from write preconditions. `FlowLocation`
revisions remain observation identifiers. Navigation independently reopens Source;
Scene/Source commands still obtain and check current exact bytes, identity, mappings,
retention barriers and existing transaction proposals. The transaction service still
checks displaced bytes and preserves final-window writers under ADR 0004. Never
introduce an `index.is_current()` shortcut in commit, flush, history or recovery.
Runtime preparation, consent, SDK/project inventories and launch revalidation remain
independent full operations under ADR 0008. Even a perfectly verified graph provides
no execution grant and no authority over assets or compiled files.

## Alternatives assessed

| Alternative | Assessment |
| --- | --- |
| Metadata/identity cache plus watcher plus periodic hashing | Reject. No bounded proof of content equality at this refresh; periodic hashing leaves a false-fresh interval. Timestamps can be restored/suppressed. |
| USN-only unchanged token | Reject for this checkpoint. Repeated writes through an open handle can share a record; journal loss/reset, volume capability and permissions add cases. No equivalent portable macOS guarantee. |
| ReadDirectoryChangesW / FSEvents / kqueue as authority | Reject. Notification delivery and naming are not content equality or a transaction barrier. Watchers are optional future hints only. |
| Windows oplocks/leases or deny-write handles | Technically credible only with a complete kernel-enforced cache-break protocol, namespace proof, mapped-write coverage and fallback. Much broader lifecycle/descriptor/deadlock surface, Windows-specific and potentially interferes with external editors; defer. No oplock is assumed by this design. |
| Persistent leaf-handle cache | Reject now. Still needs pathname-to-object checks for replace-on-save, retains many handles, and does not detect in-place bytes without reading. |
| Background full hashes and immediate cached graph success | Reject. Changes the accepted-update measurement and stale semantics. Background preparation may never establish fresh publication by itself. |
| One newly read snapshot followed by identity/mtime checks | Reject. Same-length edits between projection and final check are missed; one old Windows snapshot pass also consumes nearly the budget. |
| Reader-count tuning / faster parser or graph cache | Reject as primary fix. Completed sweep failed Windows; parsing/projection is small. Keep the existing four-reader cap. |
| Immutable copy/snapshot, exclusive editor ownership, filesystem driver | Reject for current scope. Adds storage/platform/permission or external-editor constraints and cannot replace live-source write authority. |
| Mandatory verifier plus candidate index | G1-O1 rejected on S1 and Windows latency. G1-O1-R recommends a smaller native-boundary/cost experiment before a complete corrected candidate. |

## Expected work and acceptance

For the fixed 503-file / 500-Scene / 2,000-edge fixture, let `k` be sources requiring
candidate acquisition. Cold: 1,006 source reads/hashes. Warm: 503. One accepted
Choice-caption edit: **504** (`k=1`), plus metadata reads/checks and two inventories.
No amount of transaction knowledge skips the 503 final source checks. The 500 generated
Scene scripts are 211 bytes each (105,500 bytes total), plus the three support scripts;
record the actual total byte count in the proof. Performance is dominated by small-file
operations, not 32 MiB streaming. Test 32 MiB separately for resource bounds.

Windows first-profile accepted stages: 286.449 ms acquisition + 266.781 ms verification
out of 588.068 ms internal total (about 94%). Keeping the old verification alone would
still be roughly **302 ms**, so **index-only is not a proven fix**. The single-reader
experiment's 199.032 ms verifier plus about 68.6 ms other work also lacks margin.

The earlier hypothetical 175 ms verifier + 65 ms other-work allocation is **withdrawn
as a credible forecast** by G1-O1-R. The completed local comparison measured about
159–162 ms of other work and 299–302 ms verification, still without final leaf binding.
The [updated whole-request model](../tasks/active/phase-1g-g1-o1-r-review.md#whole-request-cost-model)
sets out a conditional 230 ms estimate with explicit binding cost and separate
metadata/inventory reductions; it is a requirement for a new proof, not a performance
result. No uniform local-to-hosted speed multiplier or CPU-specific cause is established.

The [ledger implementation checkpoints](../tasks/active/phase-1g-branches-runtime-git.md#implementation-checkpoints)
require safety proof and native feasibility before production integration, and an
enforced real-service gate before any further full production/package run.

## Primary platform references reviewed

These support API limits, not measured Loomlight performance or a portable cache proof.

- Microsoft [Change Journal Records](https://learn.microsoft.com/en-us/windows/win32/fileio/change-journal-records): repeated writes can coalesce; old records can be removed.
- Microsoft [ReadDirectoryChangesW](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-readdirectorychangesw): overflow can discard the buffer; enumeration is required.
- Apple [Using the File System Events API](https://developer.apple.com/library/archive/documentation/Darwin/Conceptual/FSEvents_ProgGuide/UsingtheFSEventsFramework/UsingtheFSEventsFramework.html): advisory history, dropped/coalesced events and root changes require scans.
- Microsoft [CreateFileW](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew): sharing lasts for handle lifetime; delete sharing controls rename/delete access.
- Microsoft [SetFileTime](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfiletime): file times are mutable, not content revision tokens.
- Microsoft [Opportunistic Locks](https://learn.microsoft.com/en-us/windows/win32/fileio/opportunistic-locks): a distinct cache-coordination mechanism, not a property of ordinary reads.


## G1-O1 feasibility disposition — 2026-09-27

The test-only prototype in `b3d696533290d91bc2ff7d4eb65562d2c68642e1` does not
qualify this decision for production. [Ledger 18](../tasks/active/phase-1g-branches-runtime-git.md#18-g1-o1-verified-candidate-feasibility-proof--2026-09-27)
records the exact native run, all samples, integrity-checked evidence and gaps.
Windows warm/accepted samples were 570–586 ms against <250 ms; macOS timing passed.
Mandatory content verification and the 250 ms requirement are unchanged.

Final adversarial review also demonstrated **G1-O1-S1**: a same-byte replacement
immediately after verifier leaf open leaves the old handle's identity/hash intact,
while the current pathname names a different object. Both reader and candidate-flow
counterexamples reproduce locally. A future compound reader must bind the final
leaf pathname back to the observed object, preserving all no-follow/chain checks.
This is not permission to claim atomic snapshots or eliminate the unavoidable race
after the final comparison. Do not promote the current test-only reader/index.
G1-O2 is blocked; separately review the safety boundary and Windows cost model first.

## G1-O1-R review disposition — 2026-09-27

The [completed review and next-checkpoint plan](../tasks/active/phase-1g-g1-o1-r-review.md)
preserve this contract and the unchanged timing gate. Local Windows accepted median
460.195 ms versus hosted 574.858 ms confirms environment sensitivity and continued
NO-GO. Historical run 36278262505 attempt 1 and negative reproductions remain evidence
of failure. No new benchmark, production implementation or corrected prototype was run.

Recommend separately selecting **G1-O1-N**, a test-only directory-relative Windows
open/final-binding experiment and complete-request cost assessment. Current Windows
`open_file_at` uses an absolute path despite its parent-handle argument. Native
relative opening is documented, but neither retained parent handles nor no-delete
sharing establish current namespace/reparse state. Keep fresh canonical root, chain,
content, identity and registration checks. Final leaf binding requires a new secure
name open compared with the object actually read; querying that old handle again is
insufficient. The review maps boundaries and required Windows/macOS positive regressions.

Code inspection found an analogous gap in shared production snapshot/observation
readers. Its caller audit/correction is a separate prerequisite to safety acceptance,
not authorization for a transaction rewrite. Dependency-complete loader observations,
central mutation invalidation, real flow cancellation/deadlines, Branches action/focus
feedback and resource/poisoned-index proofs also remain required before acceptance.

**Unadopted alternatives:** revision-based display with explicit external
synchronization is a product/ADR decision, not an optimization satisfying today's
gate. Kernel-coordinated caching needs a separate lifetime/break/fallback proof and
does not currently justify its complexity. No freshness contract, cadence, authority
boundary, fixture or timing target changes here. G1-O2 remains ineligible.

## G1-O1-N bounded native experiment disposition — 2026-09-27

The [pre-registered one-file experiment](../tasks/active/phase-1g-g1-o1-n-experiment.md)
is complete with **NO-GO** for missing safety qualification. Local native relative
opening/final binding passed ordinary/writer/mapping and eight restored-time
replacement assertions, then hostile leaf-symlink setup was denied (Win32 1314).
The ordered test failed; no retry, elevation/security change, timing batch or CI
dispatch occurred. Remaining hostile/cancellation/resource/graph proofs are missing.

The adapter remains an unqualified test artifact; production readers and the
historical counterexamples remain unchanged. This result neither demonstrates full
S1 correction nor rules out native relative I/O on a capable environment. No new
complete-request cost is available, and the 230 ms conditional model remains
unproved. Any next experiment needs separate selection and pre-registration after
reviewing missing capability/composition. All freshness, authority, cadence and
supported-target acceptance requirements above remain unchanged.
