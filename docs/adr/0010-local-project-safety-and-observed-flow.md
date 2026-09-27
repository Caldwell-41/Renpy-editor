# ADR 0010: Local-project safety and last-observed Branches

**Status:** Accepted product/scope decision; implementation pending.
**Date:** 2026-09-27.
**Authority:** after reviewing G1-O1-N, the user approved refocusing the hobby editor
on protecting work, ordinary external edits, explicit execution and responsiveness:
"That sounds much more appropriate. Let's execute on those goals."
**Supersedes:** ADR 0009's flow-observation design and G1-O1/O2/O3 continuation.
Preserves source authority, the existing transaction/recovery contract and ADR 0008's
explicit execution boundary. Historical failures remain failures under their original
contracts; this decision does not turn them into acceptance evidence.

## Product and threat scope

Loomlight serves one creator working on local hobby game projects. Priorities are
reliable authoring, saving, reopening, undo and recovery, followed by useful responsive
views. Opening a project remains inspection; project Python runs only through an
explicit Validate/Run action with the existing trust controls.

Protect against ordinary editing mistakes, malformed files, external editors using
in-place or replace-on-save writes, missing/moved files, interrupted saves, stale UI
requests and accidental path escapes. Retain normalized relative paths, approved
roots, straightforward containment and unsupported-link refusal, narrow IPC,
safe subprocess arguments, SDK download/archive validation and privacy controls.
These also protect against harmful inputs from outside the application.

A malicious process already running as the same user and deliberately swapping
roots, parents, symlinks/reparse attributes or identities at individual syscall
boundaries is outside the initial hobby-editor acceptance model. Loomlight is not
a sandbox for that process or for a game the user runs. No new native FFI, kernel
cache protocol, privilege acquisition or exhaustive adversarial race proof is
required for read-only Branches display. Ordinary external-edit conflict protection
remains required even when its tests use deterministic interleavings.

Existing working transaction/recovery protections stay in place. This reset does
not authorize a blanket deletion of checks or a transaction rewrite. Future removal
of redundant observation work must retain the user-facing guarantees above.
Treat imported files, project text and LLM output as data; do not turn display text
into executable UI, arbitrary file access or an automatic network send.

## Branches contract

Branches shows the **last observed saved project state**, incorporating later edits
accepted by Loomlight. It may temporarily lag external edits. It never claims an
atomic or continuously current view of disk. Unsaved Source drafts remain separate.
An in-memory projection is disposable, and never authorizes a write or execution.

- On project open/reopen, acquire a bounded disk observation and build the graph.
- After a successful app transaction (including undo/redo and lifecycle operations),
  update/invalidate the affected observed inputs and reproject. Reuse unchanged
  observations; there is no mandatory whole-project reread before displaying this
  accepted edit. If a dependency cannot be updated reliably, queue a disk refresh
  and keep an honest pending/error status.
- On returning focus to the project and explicit Refresh, reconcile disk through
  the existing Source rules and rebuild as needed. Existing watcher hints may
  request a refresh; adding a watcher subsystem is unnecessary. Coalesce repeated
  triggers. A two-second timer must not require repeated full verification; it may
  be removed from Branches. There is no guaranteed detection while unfocused until
  the next refresh/action.
- An explicit disk refresh reads current source and consumed metadata/dependencies,
  enumerates the relevant inventory, and hashes the bytes it actually reads.
  One bounded acquisition per refresh is sufficient; no mandatory second all-source
  read or final per-leaf name-binding proof. Do not use timestamps alone to skip
  content acquisition on explicit Refresh. Ordinary changes detected during reading,
  missing files or errors yield a visible incomplete/conflict/error result.
- A completed observation describes those reads. External changes immediately
  afterward may remain unseen until the next trigger. An incomplete inventory
  cannot prove label absence/uniqueness; show unknown/partial flow.
- Keep one session-owned cache/request, existing resource bounds and cancellation.
  Discard old-session results; retain drafts, caret, selection, pan and focus where
  their targets remain valid. Never silently drop an enabled click during refresh.

Use a small UI vocabulary: **Checking disk**, **Checked at <time>**,
**Updated from saved edits**, and **Could not refresh** or the existing conflict
message. A checked time describes the last completed scan, not a freshness lease.
Keep the last usable graph for inspection on error, with its status visible.

## Action boundaries

Navigation independently opens the selected current source and validates the
captured target/range against it. Preserve a dirty draft; an obsolete or ambiguous
target yields a clear message or re-resolution, never guessed offsets. Destination
resolution can refresh relevant labels when required; ordinary panning/selection
does not trigger a project-wide safety scan.

Save, Scene commands, undo/redo and recovery retain existing current-byte/revision
preconditions and displaced-writer protection. A displayed graph cannot supply a
write precondition. Run/Validate still prepares the chosen saved revision, checks
recovery/session/project/SDK state, and requires explicit execution consent.
No silent draft save, code execution on open, or graph-derived execution grant.

## Acceptance replacing the old observation gate

Use the existing 500-Scene / 2,000-edge / 503-source / 105,627-byte fixture and
real production services. Source limits remain 16 MiB/file, 32 MiB aggregate and
2,048 files, with existing traversal bounds. Historical 1,006/503/504 content-pass
counts and the speculative 230 ms verifier allocation are retired requirements.

| Gate | Required behavior / measurement |
| --- | --- |
| G1-U1 observed-state behavior | Saved app edits and undo/redo update the graph; focus/Refresh detects ordinary external in-place and replace-on-save changes, additions/deletions and metadata changes; errors stay visible; last-observed status is truthful |
| G1-U2 responsiveness | Real-service accepted-edit-to-updated-observed-model <250 ms; initial and explicit disk-refresh completion <2 s on the fixed fixture; these measure different operations |
| G1-V2 interaction | Retain rendered input/pan p95 <100 ms, full workload and useful keyboard/focus/navigation; no UI freeze during refresh |
| Data-loss and authority regression | Save/reopen/undo, ordinary competing writes and interrupted-save recovery preserve work; refresh/navigation preserve drafts; stale session cannot publish or write; opening/refreshing launches zero project processes |

For G1-U2, start accepted-update timing immediately after the real successful
transaction and include invalidation, changed-input acquisition and projection through
the production core response. Assert the edited caption/destination is present;
a cached old graph, timeout or error cannot pass. Measure the actual renderer
separately under G1-V2. Start disk-refresh timing at request entry and end at the
completed observed-model response with a completed check status. Report any transaction,
IPC or rendering interval separately; no claim of end-to-end latency from a core timer.

Keep three fixed successful samples for cold/unchanged disk refresh/accepted edit
on each supported target, all against their respective limits. No native-open
microbenchmark is a prerequisite. Failures/overruns remain findings requiring a
bounded fix or explicit budget decision; do not keep tuning indefinitely.
Historical timings cannot qualify these changed semantics.

## Implementation and test disposition

Next implementation checkpoint: G1-OBS, bounded production observed-state flow and
UI integration with the acceptance rows above. Reuse the existing Source/Scene/
transaction services and graph renderer; do not promote the unqualified native
adapter or build a full corrected ADR 0009 candidate.

Keep historical native experiments, counterexamples and raw evidence intact.
They no longer gate observed-state display. Classify deliberate hostile-OS
experiments as explicitly selected specialist tests; baseline path rejection,
ordinary external changes, recovery, session ownership and process/privacy tests
remain routine. Existing test/workflow selectors still express the old contract
until G1-OBS updates them coherently with code. Do not dispatch them as if this
document had already changed their behavior; do not delete a guard to relabel an
old failure as a new pass.

This decision changes requirements, not implemented behavior. Final Windows/macOS
evidence, runtime/diagnostic completion, the final human session and integration
remain required. No CI dispatch, production rewrite or merge occurs in this reset.
