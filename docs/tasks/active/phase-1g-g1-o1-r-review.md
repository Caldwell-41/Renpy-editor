# G1-O1-R: Windows feasibility review and next checkpoint

> Historical evidence: the user superseded this continuation and its display
> acceptance requirements with [ADR 0010](../../adr/0010-local-project-safety-and-observed-flow.md).
> Preserve the recorded results; do not resume the native experiment or old G1-O plan.

**Date:** 2026-09-27. **State:** `review_ready` investigation; capability **NO-GO**.
**Entry:** `94128d3d5104f2716d5996d9f4a0492c923054b6`, branch
`feature/phase-1g-branches-runtime`, draft/open [PR #17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
This is the detailed plan linked from [ledger 19](phase-1g-branches-runtime-git.md#19-g1-o1-r-windows-feasibility-review--2026-09-27).
It does not approve implementation or change [ADR 0009](../../adr/0009-flow-observation-candidates.md).

## Recommendation and decision boundary

Select **G1-O1-N: bounded native observation-boundary feasibility**, described below,
before another complete candidate implementation. Establish whether directory-relative
Windows opening can replace repeated absolute-path work while closing G1-O1-S1.
Require a cost projection for the *complete* refresh, including metadata, both
inventories and final leaf binding. Confidence that this will achieve Windows
<250 ms is **low**; confidence that it tests the remaining plausible same-contract
I/O opportunity is **medium**. Stop if the safety map or complete budget fails.

This is a decision to test option A cheaply, not to adopt it as a demonstrated fix.
Option B is a credible product alternative if A fails, but requires explicit approval
of changed freshness/display behavior and an ADR amendment. Option C's kernel cache
coordination is disproportionate to the evidence currently available. No renderer
rewrite is indicated. Retain the four-reader cap, <250 ms successful warm/accepted
refresh and <2 s cold gate, fixture, refresh cadence and supported-target CI duties.

The user authorized investigation, bounded decision-relevant diagnostics and this
documentation publication only. No new timing run, trace, native probe, dependency
installation, production change or CI dispatch was needed or performed in G1-O1-R.
The uncertainty now requires a new reader boundary experiment, not another run of
the failed historical implementation. No product behavior is changed here.

## Evidence and sanitized comparison

The completed workspace `comparison.md`, `full-breakdown.md`, all four timing/stage/
operation/statistics CSVs, raw sample/job/artifact logs and completion/provenance
records were located and inspected. Sample log SHA-256 values match their state
records. Raw logs, machine paths/identifiers, tool configuration and completion
state remain local and outside Git. The completion record still identifies samples
1–3 as complete with safety acceptance false. The detached measured checkout remains
at `b3d696533290d91bc2ff7d4eb65562d2c68642e1`; its tree and code were not changed.

The historical comparison is [run 36278262505](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36278262505),
**attempt 1**, Windows job `108505073512`, macOS job `108505073353`. All failures,
artifact digests and the later negative reproductions remain in
[ledger 18](phase-1g-branches-runtime-git.md#18-g1-o1-verified-candidate-feasibility-proof--2026-09-27).

| Environment / sample | Cold ms | Warm ms | Accepted edit ms | Outcome |
| --- | ---: | ---: | ---: | --- |
| Local Windows 1 | 778.418 | 460.615 | 460.195 | FAIL |
| Local Windows 2 | 783.765 | 467.220 | 464.211 | FAIL |
| Local Windows 3 | 781.506 | 474.267 | 456.588 | FAIL |
| GitHub Windows 1 | 1,136.219 | 570.423 | 563.983 | FAIL |
| GitHub Windows 2 | 1,048.433 | 584.464 | 574.858 | FAIL |
| GitHub Windows 3 | 1,088.252 | 581.168 | 586.393 | FAIL |
| GitHub macOS 1 | 104.270 | 74.369 | 98.776 | timing PASS only |
| GitHub macOS 2 | 88.218 | 62.342 | 63.796 | timing PASS only |
| GitHub macOS 3 | 97.321 | 67.714 | 66.989 | timing PASS only |

Local accepted median **460.195 ms**, GitHub Windows median **574.858 ms**:
114.663 ms / **19.95%** lower elapsed time. Every local warm and accepted value
still fails. All local samples exited 101 at the warm assertion, after printing
accepted timings; none emitted a qualification success marker. The historical local
prerequisite suite had 10 passing tests and did not contain the later counterexamples.
No new safety pass is claimed. These three-sample summaries are not p95 estimates.

Local sample log digests (SHA-256), for matching the retained private evidence:

| Sample | SHA-256 |
| --- | --- |
| 1 | `35428692f401c87031d794098df8529581d8072183678ad65d9e1c190dac329d` |
| 2 | `80804a9921726dd115c76cd8e0b8ce40b72336db7492910b914f0325783aa00e` |
| 3 | `a1cd25117ec396d498fbac3043ff83ec66aa1153c45e2f4fa8b2b3e60afeb6ef` |

Local Windows 11 x64 used NTFS; GitHub used Windows Server 2025 x64, whose volume
type was not established by its malformed table output. Both used pinned Rust
1.90.0 release/locked, but native tool selection, OS, storage, namespace depth,
host scheduling and other environment factors were not held constant. macOS native
evidence is ARM64/APFS. This comparison establishes environment sensitivity, not a
CPU cause, CPU saturation, disk waiting or antivirus overhead. Elapsed native calls
do not identify those causes. No security, power or affinity settings were changed.

Every sequence preserves **503 sources, 105,627 source bytes, 500 nodes and 2,000
edges**, successful nonstale/nonpartial fixture graphs and the Route A edit.

| Phase | Candidate acquisition / verification | Source hash passes | Hashed bytes |
| --- | ---: | ---: | ---: |
| Cold | 503 / 503 | 1,006 | 211,254 |
| Warm | 0 / 503 | 503 | 105,627 |
| Accepted edit | 1 / 503 | 504 | 105,838 |

These are source-batch counts; metadata loaders also read support sources. A future
final pathname binding adds opens/queries, not another source content/hash pass.
Do not conceal those additional operations or reduce the source fixture to fund them.

## Whole-request cost model

Let `T = S + M + I1 + A + P + V + I2 + R + F + E`, with sequential wall stages:
Source reconciliation, metadata loading, first inventory, candidate acquisition,
projection, post-projection source verification, second inventory, metadata recheck,
finalization, and wrapper/invalidation/instrumentation residual. `V` must include
the proposed final pathname binding. There is no additive worker-time term.

| Accepted stage, ms | Local 1 | Local 2 | Local 3 | GitHub Windows 1 / 2 / 3 |
| --- | ---: | ---: | ---: | --- |
| S: Source refresh | 6.964 | 7.177 | 7.134 | 2.814 / 2.762 / 2.804 |
| M: metadata load | 44.124 | 44.360 | 43.218 | 19.565 / 19.468 / 19.616 |
| I1: inventory | 33.378 | 35.918 | 35.205 | 16.882 / 17.264 / 16.972 |
| A: dirty acquisition | 5.774 | 6.082 | 5.456 | 2.785 / 2.753 / 2.964 |
| P: labels + nodes + edges | 8.980 | 9.256 | 9.155 | 12.561 / 12.854 / 13.020 |
| V: source verification, missing final leaf binding | 301.335 | 301.867 | 298.872 | 481.803 / 491.848 / 503.131 |
| I2: inventory recheck | 35.219 | 34.493 | 33.620 | 17.242 / 17.562 / 17.292 |
| R: metadata recheck | 16.556 | 17.130 | 16.115 | 6.954 / 6.916 / 7.213 |
| F: final checks / publication preparation | 7.413 | 7.517 | 7.393 | 2.849 / 2.875 / 2.792 |
| E: residual to outer accepted timer | 0.450 | 0.410 | 0.421 | 0.529 / 0.556 / 0.590 |
| **All work except V** | **158.860** | **162.344** | **157.716** | **82.180 / 83.010 / 83.262** |

Rounding individual cells can differ from a sum of raw values. The observation
`whole_ms` interval is slightly narrower than the outer `g1-o1-times` timer. The
outer timer includes explicit invalidation overhead (local 0.004–0.005 ms) but not
the Scene transaction itself. Do not present this core fixture as edit-to-painted-UI
latency or include a future IPC/rendering delay for free.

The cost follows the actual code:

- `transaction/platform/candidate.rs::candidate_validate` canonicalizes the root,
  then does absolute pathname metadata, a fresh directory open and a handle sample
  for every component. `candidate_open` runs it before and after the leaf open;
  `transaction/candidate.rs::Reader::read` runs it again after bytes. Retaining a
  parent avoids repeated acquisition, but does not eliminate those path traversals.
- Windows `platform.rs::open_file_at` ignores its parent-handle argument and opens
  the joined absolute path. macOS/Unix actually uses `openat`. The leaf has its own
  pathname metadata check, open and before/after handle samples. Hashing includes
  bounded read work; it is not a pure SHA arithmetic measurement.
- Candidate `metadata()` and `scene::load -> authoring::list` perform separate secure
  snapshots; project/map and support inputs can be read repeatedly. `list` reads
  characters/variables, optional assets declarations, media inventories and asset
  files, even though the O1 fixture is empty of authored assets. Legacy expected
  absence causes additional prerequisite reads. M includes this work, not just JSON.
- Both source inventories call `inventory_files_bounded -> inventory_directory`:
  root/chain validation, `read_dir`, per-entry `symlink_metadata`, recursive directory
  acquisition, and exit chain validation. Both are required; the second is not a
  cached first listing. The native source counters exclude these stages.
- P recomputes global labels and maps all edges; it is small. F includes graph
  revision construction and the final `candidate_session` root/recovery check.
  Mandatory metadata, registration, session, generation and cancellation checks
  remain part of successful publication.

| Accepted source operation | Count | Local sample 1 worker ms | GitHub Windows sample 1 worker ms |
| --- | ---: | ---: | ---: |
| Parent acquisition | 7 | 22.811 | 37.265 |
| Canonical-root check | 1,512 | 140.298 | 472.863 |
| Chain component | 6,036 | 839.935 | 1,102.160 |
| Leaf open | 504 | 50.600 | 35.301 |
| Handle metadata sample | 7,044 | 45.314 | 151.962 |
| Bytes/read/hash | 504 | 9.988 | 12.091 |

These totals overlap across four workers. Handle samples are nested inside chain
component timings, and parent acquisition has its own internal operations. They
must neither be added to wall stages nor divided by four as a predicted speedup.
They identify repeated work, not CPU or storage utilization. Local leaf opens and
metadata/inventories are slower despite faster overall verification: there is no
uniform local-machine multiplier for a new implementation.

The previous **175 ms verifier + 65 ms other work** allocation is withdrawn as a
credible forecast. With unchanged local other work, a corrected verifier would need
to take <91.140 ms in sample 1, or <87.656 ms using the largest observed other-work
value, just to reach 250 ms. For a 230 ms engineering goal these become 71.140 and
67.656 ms, including the new leaf check. This is not demonstrated by current code.

One **conditional complete-request estimate**, used to decide whether to proceed,
is 230 ms on *each* supported target, with the following unproved ceilings:

| Work | Conditional ms | Required evidence/assumption |
| --- | ---: | --- |
| Source reconciliation | 8 | Fixed accepted fixture, no hidden reconciliation transaction |
| Metadata load + final verification | 40 | Observe exact consumed dependencies once per boundary; eliminate duplicate acquisition, not final verification |
| Both inventories | 36 | Safe per-boundary native observations avoid redundant path work; still two complete traversals |
| One dirty acquisition | 8 | Includes final leaf binding on this read too |
| Projection | 14 | Retain current projection helpers and counts |
| Complete 503-source verifier | 110 | Includes **25 ms reserved for final leaf opens/identity/chain binding**, 85 ms for all remaining secure read/hash work |
| Final ownership/root/recovery checks | 9 | No skipped publication checks |
| Outer bookkeeping/invalidation | 5 | Same timer boundary; no instrumentation subtraction |
| **Total / margin to 250 ms** | **230 / 20** | Hypothesis, not a gate pass or confidence interval |

The proposed verifier ceiling requires about 64% improvement over local sample 1
and 78% over the GitHub Windows median verifier; local other work must also fall
from 159–162 to 120 ms. The 25 ms binding allowance is *not measured* and must be
replaced by data. If V is 140 and other work stays 140, T is 280 ms: no-go.
If other work stays at 162.344 even V=110 yields 272.344 ms: no-go. The narrow next
checkpoint must expose that failure instead of declaring a fast leaf open a win.

Historical macOS complete accepted cost was 63.796–98.776 ms, but it also lacks S1.
Budget the same binding and dependency corrections there; its spare time is a reason
to preserve its existing I/O approach, not a waiver of new native safety/timing
evidence. No local Windows extrapolation qualifies GitHub Windows or macOS.

## Options compared

### A. Same contract, corrected candidates and native observation I/O

Keep an immutable candidate generation, full fresh post-projection content hashes,
fresh leaf identities, both inventories, complete dependency observations and all
final ownership checks. An observation-only Windows adapter can open a **single
validated child name relative to a directory handle**, eliminating repeated parsing
of the entire absolute prefix. At each current boundary, replace separate pathname
metadata + reopen + sample with a securely reached fresh handle and combined sample
where equivalence is demonstrated. Rewalk child names from a freshly bound root;
do not merely sample retained handles and assume their names are still current.

The adapter must use existing validated single-component names and native-opened
directory handles; explicitly test the directory/leaf option combinations and
requested access masks. Parent-handle possession is not child authorization: retain
normal access checks, no backup-privilege bypass or elevation, no create/truncate
disposition, and RAII closure of every native handle. Reject alternate streams,
device/reserved names, traversal components and unsupported identity semantics
through the existing path policy. Bindings and error handling are part of the proof.

Retain canonical registered-root resolution, current parent identity/type/reparse
checks before open, after open before bytes, and at final binding. A native open
is not permission to move all those checks to request start. Test a chain obtained
relative to a freshly validated root, sampled against retained identities, while
also checking retained directories' current attributes. A retained directory may
acquire a reparse point in place without changing identity. If the proof still
requires expensive absolute revalidation, charge it and reject the budget if needed.

Metadata and inventory improvements must follow the same check-to-owner map. A
request-local dependency collector may share the exact bytes used by loaders and
projection, avoiding duplicate initial reads. It cannot reuse a pre-read revision
as proof of later loader bytes or skip the post-projection verification. Merely
switching the source leaf syscall leaves about 159–162 ms of local work untouched.
Handle-based enumeration may be investigated later only with equivalent hostile
entry/type/namespace checks; a directory listing's cached attributes are not a leaf
content or current-identity proof.

**Estimated complete cost:** the conditional 230 ms model above; current measured
cost is 457–464 ms local and 564–586 ms hosted Windows *before* S1 correction.
No justified narrower prediction exists. **Correctness confidence: medium** in the
design, **performance confidence: low**, based on documented native relative opening,
actual absolute-path duplication and the large reduction still required. Remaining
races are the optimistic per-file final window and undetectable between-observation
ABA, not an atomic multi-file snapshot. Complexity is medium/high: narrow native
FFI, error mapping, lifetimes, cancellation and cross-platform race tests, plus
observation dependency work. User-visible freshness remains unchanged.

On unsupported capabilities or sharing/open/query failure, return typed stale/error
or use a separately safety-corrected conservative reader. Today's unsafe reader
cannot be a successful fallback. A safe slower fallback is truthful but does not
pass the performance gate. Windows likely needs different I/O beneath the shared
contract; macOS already has relative opening and can keep that platform adapter.
The smallest next experiment is G1-O1-N, not a renderer rewrite or another reader sweep.

### B. Revision display with explicit external synchronization

An alternative UI would display **accepted revision R** immediately after a Loomlight
transaction and explicitly say **disk validation pending**, **checking external
changes**, **validated at last check**, or **conflict/stale**. A displayed revision
would not claim current-disk freshness. External edits could temporarily leave old
labels, routes, names, entry mapping or media status visible. No silently fresh badge
and no stale graph counted as a <250 ms current-contract result.

Keep current visible periodic/focus triggers unless separately approved. Watchers
could request early reconciliation but never certify equality. Each synchronization
does a bounded secure complete dependency/inventory scan, including expected absence
and S1 binding; dropped events/overflow/error force a scan and retain pending/stale
status. A manual synchronize command is explicit. Continuous changes may prevent
validation indefinitely; the UI must expose that state. Source reconciliation keeps
drafts/caret/conflicts and asks for conflict resolution through the existing flow.

Before navigation, bind the captured project/session and target source bytes,
identity/range, mapping and any label-resolution dependencies afresh; if the target
depends on global uniqueness, verify the global source inventory/labels or require
completed synchronization. Re-resolve or visibly refuse a changed target. Before
writes, independently obtain exact current source/metadata preconditions, retention
barriers, recovery and transaction/history checks. Before execution, retain the full
ADR 0008 project/SDK inventories, policy, trust/consent and launch revalidation,
including executable/assets/compiled dependencies; the graph supplies no grant.

**Estimated costs (conditional, different operations):** publishing a known accepted
revision might take 20–60 ms (roughly 9–14 ms measured projection plus unmeasured
revision delivery/state work), but production IPC/rendering and reconciliation are
not proven. A complete disk synchronization still has the current 457–586 ms Windows
scale **plus final binding and dependency corrections**, or option A's cost if that
work succeeds. Navigation/write/run validation can still wait. This does not explain
how the current successful-fresh-refresh gate fits under 250 ms; it changes the
product contract and must receive explicit approval before implementation.

**Confidence:** medium that separating these states improves perceived response,
low in the numerical display estimate; no user study or new implementation was run.
Complexity is high across core revision ownership, IPC, UI statuses and action-time
dependency validation, but need not change the graph renderer. Fallback is a visibly
stale/inspection-only revision and explicit sync failure. The smallest next step,
if selected instead, is a product/ADR state-transition review with a small UI model
and action-authority tests, not a timing gate renamed to mean cached display.

### C. Kernel-coordinated cache validity

Windows oplocks offer a real coordination mechanism; ordinary retained handles,
timestamps, USN records and notifications do not. To substitute a lease for full
verification would itself amend ADR 0009's mandatory read contract. Keeping the
mandatory hashes while adding leases has no demonstrated benefit for this workload.

A credible lease design must cover data and namespace/parent lifetimes, successful
initial grant with fresh bytes, break notification/acknowledgment ordering, existing
writers and writable mappings, cancellation, overflow/failure, process shutdown,
session replacement and descriptor exhaustion. Break handling must not depend on
the thread waiting for a writer blocked on that break. External replace-on-save,
editors retaining handles, and mapped writes must work without deadlock or silent
sharing failures. Every uncertain grant/break invalidates; reacquire safely or fall
back to full secure reads. No lease survives restart or project switch.

**Estimated cost:** no defensible measured lease-hit complete-request estimate. A
scenario retaining today's local other work has a **158–162 ms floor**, plus lease
state checks, namespace/leaf binding and changed acquisition; it fits only if those
unmeasured additions stay below roughly 68–72 ms for a 230 ms total. Lease misses
retain the corrected full-scan 457–586 ms Windows scale plus S1/dependency overhead.
There is no evidence of high hit rates with the required external-editor behavior,
nor a qualified macOS equivalent. Confidence is **low**, complexity **high**, and
performance/fallback predictability worse than A for a small-file local application.
Defer it. The smallest justified future experiment would first prove one-file
grant/break/mapped-write/editor compatibility and bounded shutdown, after explicit
contract review; a 503-handle cache is not the starting point.

Snapshot copies, exclusive editor ownership, filesystem drivers and watcher-only
caches add unsupported constraints or weaken the contract. None is a better
evidence-backed next step. Background preparation may populate candidates, but a
successful fresh result still owes the full required validation cost.

## Microsoft API guarantees checked for this review

Primary documentation was read on 2026-09-27. These are API guarantees/limits, not
proof that the proposed composition is secure or fast. Community Q&A was not used
as authority for undocumented combinations.

| API / source | Verified guarantee and consequence |
| --- | --- |
| [NtCreateFile](https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntcreatefile) | Documented user-mode API in ntdll. `RootDirectory` permits relative names; `FILE_OPEN` opens existing objects only. `FILE_OPEN_REPARSE_POINT` opens the reparse object instead of normally processing it: the returned object still requires rejection if reparse. `FILE_NON_DIRECTORY_FILE` is not sufficient to establish a regular data file. Synchronous options require `SYNCHRONIZE`. Requested access and sharing must remain compatible. |
| [OBJECT_ATTRIBUTES](https://learn.microsoft.com/en-us/windows/win32/api/ntdef/ns-ntdef-_object_attributes) | `OBJ_DONT_REPARSE` refuses reparses encountered during name parsing. It does not certify earlier namespace components represented only by a retained handle. The NtCreateFile page lists a narrower Attributes description; qualify the intended user-mode flag combination on both Windows environments and fail closed if unsupported. Do not rely on the flag alone. |
| [CreateFileW](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew) | Sharing restrictions last for handle lifetime; denying delete sharing constrains delete/rename access. Attribute access is not controlled by that sharing mask. Retaining a no-delete-share parent does not establish immutable reparse attributes/content. Keep leaf read/write/delete sharing compatible with external editors. |
| [GetFileInformationByHandle](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfileinformationbyhandle) | Volume serial plus file index compares opened objects; it does not bind a pathname. Documentation notes filesystem-dependent support and that ReFS requires the extended 128-bit identifier. Keep the qualified filesystem scope explicit; do not assume the current 64-bit identity universally suffices. |
| [Reparse points](https://learn.microsoft.com/en-us/windows/win32/fileio/reparse-points) | Reparse data can be set on files/directories and interpreted during open. Validate current type/attributes; pinned identity is not a reparse-state token. |
| [FSCTL_REQUEST_OPLOCK](https://learn.microsoft.com/en-us/windows/win32/api/winioctl/ni-winioctl-fsctl_request_oplock), [Breaking oplocks](https://learn.microsoft.com/en-us/windows-hardware/drivers/ifs/breaking-oplocks) | Oplocks have asynchronous lifetime and break rules. Some levels do not wait for acknowledgment; others pend the interfering operation. A universal callback-before-write assumption is invalid. Directory support has its own constraints. This requires a protocol, not a Boolean clean cache bit. |

## S1 correction design and production-reader scope

**Confirmed defect, test candidate:** after leaf open, replacement can leave the
current name pointing to another object while the old handle supplies equal bytes
and the old identity. A second query of that same handle cannot detect it.
Historical reader/whole-graph negative tests reproduce this on macOS, not Windows;
Windows positive correction evidence remains required. They are retained unchanged
in this checkpoint. Green execution of a negative reproducer is failure evidence.

Proposed compound read boundaries, for both acquisition and final verification:

1. Look up current registration/session/recovery state; validate relative components,
   canonical registered root and freshly reached parent chain. Reject links/reparse,
   special objects, changed identity or unsafe path. Preserve access/sharing policy.
2. Open the leaf no-follow, sample identity/type/length, then revalidate the chain
   before reading. Read/hash all bounded content with the original deadline and
   cancellation token. Check short/growing reads and post-read handle identity/type/
   length. Hash belongs only to these actual bytes and this observed object.
3. After the read, **freshly resolve the current namespace** from the registered
   root through verified parents, then open the same leaf name again with no-follow
   semantics. Sample that *new* handle; require a regular non-reparse file and
   matching volume/file identity (and compatible length) to the read handle. A
   pathname metadata observation followed only by the old handle query is not this
   check. Reject missing/replaced/reparsed leaves and parent/root changes.
4. Keep both leaf handles until the comparison finishes; bracket the binding with
   current chain/root checks and recheck registration/owner. Release everything on
   success/error/cancel. The latest secure pathname comparison is the per-file
   observation boundary. No promise is made about changes after it.

On Windows the fresh name open can be relative to the newly verified terminal
parent. On macOS use descriptor-relative no-follow opening while freshly checking
the chain's namespace binding, because a retained directory can be renamed. Neither
platform gets an atomic check of all ancestors, content and all files. Preserve the
optimistic final-window/ABA limits in ADR 0009; do not claim every historical write
is detectable or prevent all races by holding an old descriptor.

| Old boundary | Proposed owner; never removed for timing |
| --- | --- |
| Registration, canonical root, recovery | Request/read entry and final publication; root binding within every compound boundary |
| Parent identity/type/no-follow | Freshly reached chain samples before open, before bytes and at final binding; retained-handle attributes alone insufficient |
| Leaf no-follow/type/sharing | Initial and final name opens, checked handles; no arbitrary absolute or device names |
| Content + identity + length/limits | Initial/read/post-read observations and complete post-projection hash/identity comparison |
| Missing leaf-name binding | New final secure name open compared with the object actually read |
| Whole graph | Every file's corrected verifier plus both inventories, actual metadata dependencies, current session/generation/root and publication cancellation |

Expected additional binding counts are one fresh leaf open per source pass:
**1,006 / 503 / 504** additional name opens for cold/warm/edit, before counting any
fresh parent operations. At least two simultaneous leaf handles per worker must be
charged; the old descriptor upper bound 25 cannot be copied to the new design.

Positive regressions must assert rejection/stale and no candidate promotion or
editable edges, not that the old revision was returned. At reader and whole-graph
levels on Windows and macOS, replace identical and different bytes after open,
mid-read (multi-chunk input), after bytes and immediately before final binding;
include same-byte restored-time replacement, parent/root rename/replacement,
same-identity parent reparse conversion and leaf symlink/reparse conversion.
Target actual verifier order, including first and later workers; synchronize with
barriers, not sleeps. Verify outside sentinel content is not read through an unsafe
chain and no writes occur. Independently confirm the current name's new identity.
Use stable fixtures to prove unchanged reads still succeed. A replacement injected
*after* the last comparison documents the allowed race and is not required to fail.

The negative historical reader/tests must remain available as explicitly labeled
historical controls or durable ledger evidence when a later corrected harness is
introduced. Its qualification selector must require **positive** assertions and
continue rejecting any emitted `g1-o1-safety-counterexample:` marker. Do not delete
the guard to obtain a pass from the current candidate.

**Confirmed by code inspection, broader scope:** `transaction/observation.rs`
snapshot and revision readers open once and only query that object after content.
`TransactionService::snapshot_bounded` and `inspect_file_bounded` in
`transaction/mod.rs` likewise have no final secure name-to-object comparison;
`read_revision_file_bounded` has no pathname argument. This is an analogous
observation gap. The current code therefore does not establish that the returned
identity still names the leaf at the final read boundary. A production exploit or
transaction overwrite was **not reproduced** in this review. Transaction commit,
displaced-byte checks, journal recovery and runtime launch checks have separate
boundaries; this finding does not establish that those protections are bypassed.
Schedule a separate scoped production-reader correction/caller audit before safety
acceptance, retaining ADR 0004 semantics. Do not transplant a name requirement into
handle-only displaced-file verification or expand this into a transaction rewrite.

## Branches interaction findings and targeted plan

Inspected `app/src/branches-ui.ts`, its `main.ts` callbacks, DOM/browser tests and
core `flow.list` dispatch. The following distinctions matter:

| Finding | Classification / current behavior |
| --- | --- |
| `navigate()` returns when `loading`; details buttons are not disabled for loading | **Confirmed UI defect:** enabled clicks during the visible 2 s/focus refresh can disappear without status |
| `draw()` replaces cards/details; refresh restores focus only for Scene/route selects | **Confirmed retention gap:** focused card/detail button is removed on changed results; selected IDs and pan/zoom are otherwise retained when valid |
| Selection changes during awaited navigation | **Risk requiring a targeted test:** the closure captures old node/edge; refresh checks graph revision, but there is no captured selection-generation cancellation |
| Refresh error | Existing code marks last model stale and disables primary Scene/origin actions; destination buttons can remain enabled but `navigate` silently returns on stale. Feedback must be consistent |
| Disposal / late completion | Existing disposed/sequence guards suppress old UI results and clear timer/focus handler; this is useful and covered by a DOM test, but does not cancel core work |
| Unchanged graph | Existing revision/stale/notice/limit comparison avoids redraw; retain it and ensure the revision covers all new semantic dependencies |

Prefer one **bounded pending navigation intent** during refresh: capture session,
view/request identity, graph revision, Scene ID, route ID/ordinal, source revision
and selection generation; show “Checking flow before opening…” in a status region.
Coalesce repeats of that same intent; a different intent supersedes it with visible
cancellation feedback. When the request finishes, re-resolve the captured target
against the verified model and require matching session/revision/selection. Then
perform existing Source/Scene navigation validation once. Cancel visibly on changed
selection/revision, missing target, error, timeout, disposal or session replacement
(on disposal, use session-owned status only if still visible; never write into the
new project). No unbounded queue, stale navigation, duplicate execution, or replay
of a write/Run/Save action. A simpler approved UI may disable action controls with
an explicit “refreshing” explanation; silently ignoring enabled clicks is unacceptable.

Preserve focus by semantic control identity (card Scene ID or detail action + route),
restoring only if focus still belongs to this view and the user has not moved it.
When the target disappears, move to the surviving selector/viewport and announce why.
Keep pan/zoom independent and avoid fitting again on ordinary refresh. Generic Open
Source may remain an inspection escape hatch; project-start locations and destination
actions must still have action-time target checks. The existing callbacks pass
expected revisions, so do not label the toolbar bypass an established stale-write bug.

Extend `app/tests/branches.dom.test.ts` with deferred loads/fake cadence for: click
during periodic and focus refresh; repeated and superseded intents; selection changes
while pending; changed/stale/error results; card/detail focus retention and removed
target fallback; dispose/project switch with late success/error; exact one callback;
unchanged DOM identity; pan/zoom while loading. Extend the existing browser test for
real focus and compositor responsiveness on changed/unchanged results. These tests
are specified, **not run or implemented here**. No renderer replacement is required.

## Production dependencies, invalidation, cancellation and authority

### Dependency completeness

`scene::load` consumes project metadata, source-map metadata and `authoring::list`.
The latter loads `.renpy-editor/authoring.json`, verifies
`game/definitions/characters.rpy` and `variables.rpy`, optionally reads `assets.rpy`,
enumerates `game/images` / `game/audio`, and hashes referenced assets via `inspect_file`.
Legacy absence additionally depends on project identity, pristine support sources,
missing declarations and empty media inventories. These actual consumed inputs
must be captured as typed **present(revision)** / **absent(secure parent/name)** /
**inventory** dependencies, not inferred from a fixed list after loading.

The production final loop names only project/map revisions: **confirmed dependency
coverage omission by inspection**. Its graph digest also omits authoring/media
dependencies. Consequent stale behavior needs deterministic regression evidence;
no new dynamic reproduction was run. Prototype `metadata()` captures more but
refuses nonempty authoring/media and reads separately from `load`; it is not a
dependency-complete production loader. Capture observations from the actual reads
that supplied projection bytes, deduplicate identical reads only at the same
boundary, and verify their full values after projection. Include present-to-absent,
absent-to-present, same-byte identity replacement and changed media namespace.

Nonempty characters, appearances, variables, declarations, automatic discovery
collisions, missing/changed/unsafe media and legacy absence need representative
fixtures. Large asset hashing is outside the 105,627-byte source fixture: record
its own limits, cancellation and cost, rather than claiming 230 ms for all asset
projects. If flow can avoid a dependency, first prove output equivalence with a
dedicated observation loader; do not stop checking an input still used by `list`.
Revision tokens and unchanged-result redraw logic must cover the complete semantic
dependency vector, including identity/presence and session ownership as appropriate.

### Central invalidation

The candidate index and explicit harness dirty events are test-only; absent
production hooks are **unverified integration requirements**, not a deployed cache
bug. Keep one index owner per opaque registration + root identity + open session.
In `transaction/mod.rs`'s serialized mutation owner record affected paths/namespace
and advance generation **before the first possible mutation**, then again on every
terminal outcome, including partial failure/panic recovery. An RAII scope can
guarantee the closing invalidation; inability to record it disables reuse.

Map actual paths through Scene operations, Source acceptance/reconciliation,
undo/redo (`transaction/history.rs`), recovery/journal actions, file/directory
create/remove/rename, supporting authoring/media operations and runtime-policy
installation. Capture the flow generation after Source reconciliation, since that
can itself transact. Pure drafts never enter accepted candidates. Keep one-file
granularity for the proven caption edit even when its source-map companion changes;
unknown effects/overflow/root change invalidate all. Hold no index mutex across
I/O or opposite transaction locks. Test each real hook and partial failure; harness
events alone prove neither coverage nor lock ordering.

### Request ownership and cancellation

`main.ts` calls `flow.list` with only a session; `lib.rs` checks it and calls the
lifecycle flow method. `dispatch.rs` installs `runtime_work::scoped` for runtime
preparation/grant/start, not ordinary flow requests. `runtime_work::inherited`
preserves an installed absolute deadline, but `check()` is inactive without context.
**Confirmed integration gap:** Branches disposal only suppresses its callback.

Add a typed flow request owner/token in `dispatch.rs` / `lib.rs` / lifecycle and
the renderer load/cancel contract. Capture the absolute deadline at request entry,
cap it by any earlier caller deadline, and carry it through queued work, metadata,
inventories, every <=1 MiB read/hash chunk, workers and final publication. Never reset
it on a worker or retry; the proposed 2 s containment ceiling does not replace
250 ms successful latency. At most one active flow request/session, bounded pending
navigation, no detached background task or post-cancel candidate promotion. Cancel
on view disposal/project switch/unregister/shutdown; recheck owner immediately
before index commit and result publication. Slow synchronous OS calls cannot be
promised instantly interruptible; check on return and release resources.

Keep the existing independent Runtime Stop/status lane. `ApplicationHost::with_service`
checks out the service without holding its state lock across I/O, so do not claim
that flow currently holds that control lock throughout a refresh. Add barrier tests
showing Stop/status responds during stalled flow I/O, expired deadlines are unchanged
in workers, and late completion cannot repopulate a replacement session.

### Resource and authority proof obligations

The local source-batch peak was 106,051–106,475 bytes, scratch 424–848, four readers,
zero live readers after requests; descriptor upper bound 25 was analytic. This is
not a complete allocator or OS descriptor measurement. Account for unique retained
plus in-flight candidate blobs, dirty replacement overlap, verifier buffers, metadata
snapshots (including `snapshot_bounded`'s byte clone), loader JSON, maps/labels/edges,
path inventories, IPC serialization and old/new renderer models. Share immutable
bytes or evict before allocating replacements. No cache-owned handles between
requests. Charge full parent depth, root, new binding handles, metadata/traversal
handles and transient validation in a real peak/leak measurement.

Test allocation/open/query/read/thread failures and OS descriptor exhaustion through
portable injection first; errors must release resources and return stale/error,
never use an unchecked fallback. Cover exact and one-over limits for 16 MiB/file,
32 MiB combined source allowance, 2,048 sources, 500 Scenes, 2,000 edges, 1 MiB
authoring document, 8,192 traversal entries and actual depth/file traversal guards
(currently depth 16 / 4,096 files). Exercise under-limit and exact allocation too,
including concurrent dirty replacement and cancellation at peak. Media/metadata
limits and any whole-process envelope need an explicit separate acceptance bound;
the 32 MiB source contract is not that envelope.

Poison the index's bytes, identities, revision, inventory, generation and owner and
prove Source dirty draft text/caret/selection/conflict retention survives refresh,
failed navigation and session changes. Existing Source/Scene transaction preconditions,
undo/redo history validation, displaced-writer preservation and recovery barriers
must still reject competing changes. Runtime trust, SDK/project inventory, consent,
policy and launch revalidation must reject poisoned/stale graphs. The existing
poisoned-index Scene-write test is useful but does not cover those Source/history/
runtime cases. Private candidate types must never become write or execution tokens.

## Next checkpoint: G1-O1-N only

This plan is a recommendation requiring the user to select the checkpoint. It does
not authorize G1-O2 or a different contract.

**Scope/files:** a test-only native read/binding primitive under
`app/src-core/src/transaction/platform/candidate.rs` (or an isolated child module),
its compound harness in `transaction/candidate.rs`, and targeted reader tests in
`transaction/tests.rs`. Keep the historical reader available as negative control.
Use `scene/tests/candidate_proof.rs` only for narrowly scoped dependency/cost probes
and positive boundary assertions if feasible without building the complete corrected
candidate. Do not wire production, rewrite loaders/transactions, implement B/C,
replace the renderer, or change `.github/workflows/quality.yml` merely to bypass its
counterexample guard. Documentation/ADR/ledger/handover publication is included.

**Pre-register the experiment before running:** exact input commit, new diagnostic
diff/hash, fixture generator/paths expressed portably, question, fixed four-reader
setting, safety cases, counters, timer boundaries, exits and sample count. Question:
can secure relative opening plus fresh final binding remove enough repeated path
work to make the full request budget plausible? Use the existing portable local
Windows tools/caches and fresh-shell entry script. No historical comparison rerun.

1. Prove the one-file native boundary first: ordinary file, existing writer/mapping,
   same-byte replacement after open and during reading, hostile leaf and retained
   parent reparse/namespace changes, missing capability/error/cancellation. Verify
   actual user-mode flags/access/error mapping; run as ordinary user. Preserve
   external-editor sharing. A denied capability is a recorded gap/no-go, not a reason
   to elevate or alter security settings.
2. Only after positive safety assertions, use one fixed 503-source verifier batch
   with identical source bytes/path layout and four readers. Bound diagnostics to
   one instrumented sequence and three fresh-process **uninstrumented** sequences
   of the new primitive; retain all results/failures, no warmup/tuning/retries. Charge
   parent acquisition, canonical-root checks, both leaf opens, handle queries,
   complete reads/hashes, final chain checks and teardown. Do not add worker sums
   to wall time or subtract instrumentation estimates from acceptance timing.
3. Fill the whole-request equation using measured new components and the existing
   other-work costs. If it does not fit, permit at most one pre-registered isolated
   metadata/inventory experiment aimed at a specific duplicate observation, using
   the existing loaders/fixture and the same bounded sampling. If reducing that
   work requires a production refactor or broad new architecture, stop and publish
   the scope/cost result instead of building a full corrected prototype.

**Go to a later corrected-candidate checkpoint only if:** every required boundary
has a documented owner and positive regression, final leaf binding is included in
counts/peaks/timers, the measured components plus conservatively retained unmodified
stages support <=230 ms locally, and a concrete complete budget is plausible on
hosted Windows without multiplying by the local speedup. Treat >230 to <250 ms as
insufficient engineering margin, and >=250 ms or missing safety as no-go. A modeled
go only authorizes a recommendation for the next proof; it is not G1-V1 acceptance.

**Stop conditions:** any unresolved namespace/reparse/identity failure; reliance on
timestamps/watchers/old handles as freshness; removal of a safety boundary; expected
whole request misses margin; unbounded resource/descriptor lifetime; incompatible
external editors; missing capability; or need to broaden into production. Preserve
every unsuccessful input/result and publish one next decision. Do not retry a
failing configuration or silently switch to B.

**Evidence after this next checkpoint, separately selected:** a fully corrected
test candidate must retain 1,006/503/504 content passes and all workload counts,
provide the positive S1 reader and whole-graph matrix on **Windows and macOS**, then
pass all three complete uninstrumented warm/accepted samples <250 ms and cold <2 s
with margin on both supported targets. Local Windows is early feasibility only.
The existing native CI acceptance requirement remains; an exact-candidate targeted
native pair becomes justified once local safety, complete-cost evidence and required
macOS checks warrant it and dispatch is separately authorized. Preserve original
failed run 36278262505 attempt 1; never reuse its timing as corrected safety evidence.

**Later acceptance obligations:** independently review/correct shared production
reader boundaries; finish real dependency/invalidation/cancellation wiring and
poisoned-index/resource proofs; implement/test the Branches feedback/focus behavior;
then enforce complete real-service successful latency on supported targets before
another production/package matrix. These are required before G1 acceptance, not
waived by a narrow I/O proof. Physical testing, merge, optional Git and Phase 2 remain
separate. Changing freshness/display semantics, refresh cadence or timing targets
requires an explicit user decision; none is adopted here.
