# Task: Phase 1A–1D integrated corrective checkpoint

**Status:** Implementation complete; supported-target evidence pending  
**Baseline:** `main` at `0e5e8b697782ed29d61d01dbb1240b9d16561c27`  
**Branch:** `corrective/phase-1a-1d-integrated`

Canonical implementation commit: `c08414293899f8930bd2eb5e8a78a5b6c10433e7`
(the local object created before API publication is `bc72413`).

## Scope and stop rule

This is a bounded correction of the existing Phase 1A–1D foundation. It preserves
the shell authority boundary, authoritative ordinary Ren'Py source, stable entity IDs,
the pinned Ren'Py 8.5.3 adapter, and journalled sequential transaction contract. Scene,
Beat, Preview, Source workspace, Branches, Git UI, and all Phase 1E/later work remain
excluded. The checkpoint is not closed until the final code state passes the supported
Windows x64 and macOS ARM64 production gate.

## Baseline evidence

The baseline worktree was clean; `origin` was the requested existing GitHub remote and
the Phase 1D commit `343e10f96e42ef1f1cb1d50f78936865436e4f2b` was in `main` history.
Before edits: repository validation passed 185 files; lossless-source tests passed 26;
SDK-spike tests passed 24; the 620,000-byte benchmark median was 106.66 ms; frontend
check/build passed; and the core suite passed after installing the repository-pinned
Rust 1.90 toolchain. The Linux host lacks the GTK/WebKit development packages required
to compile/package the desktop crate, so that limitation is not target evidence.

## Issue ledger

| ID | Boundary / consequence | Baseline status | Correction and regression evidence | Final status |
| --- | --- | --- | --- | --- |
| B1 | Ordinary writes could bypass unresolved recovery | Reproduced by code inspection; prior test omitted the follow-up commit | Recovery scan/commit/flush/finalise share one serialization boundary; follow-up writes reject | Fixed locally |
| B2 | Verification/recovery buffered complete media | Reproduced | Incremental 1 MiB hashing/copy; bounded snapshots, metadata, and journals | Fixed locally |
| B3 | Routine readiness rehashed terminal import history | Reproduced | Terminal records skip payload inspection; instrumented test reads zero terminal bytes | Fixed locally |
| B4 | Streaming lacked production crash hooks; partial stage could be called rejected | Concrete gap | Persistent hooks and subprocess termination cover media/companion boundaries; partial stage blocks | Fixed locally; target cases pending |
| C1 | Failed candidate activation revoked healthy current project | Reproduced | Candidate preparation precedes swap; regression preserves old writable session | Fixed locally |
| C2 | Inspection anchor was dropped before registration | Reproduced | Inspected candidate carries retained root anchor; substitution fails closed | Fixed locally |
| C3 | Requests implicitly targeted current project and UI accepted stale completions | Reproduced | Per-activation session, exact IPC checks, import binding, UI generations | Fixed locally; packaged evidence pending |
| D1 | `score = 1` mapping could patch `score = 10` into `50` | Reproduced with requested sequence | Whole physical-statement matching and verification before revision refresh | Fixed locally |
| D2 | Incoherent metadata could panic or drive source output | Concrete gap | Semantic known-field validation; unknown fields retained; empty statements fail safely | Fixed locally |
| D3 | Underscored images and FLAC discovery were recorded incorrectly | Reproduced | Space-separated image basenames; explicit FLAC declaration; legacy explicit repair | Fixed locally; SDK gate pending |
| D4 | Stored available status ignored physical assets | Reproduced | Bounded no-follow inventory derives status and blocks physical collisions | Fixed locally |
| D5 | Selection check/path open left a substitution interval | Reproduced | Retained parent authority and descriptor-relative no-follow open; retained file supplies bytes | Fixed locally; target reparse evidence pending |
| U1 | Bool/int creation coerced or rounded values | Reproduced | Explicit bool controls, labelled inline editors, and canonical exact signed-64 decimal-string IPC | Fixed locally |
| U2 | Rendering claimed Saved and no session flush existed | Reproduced | Read-only session status, explicit flush/Ctrl/Cmd+S, visible error states and stale-result guards | Core/frontend fixed; packaged DOM evidence pending |
| A1 | Privilege/single-instance regression | Not reproduced | Existing guards retained; new operations require exact current session and expose no paths | Retained locally; packaged evidence pending |

## Local evidence on final implementation tree

- `python3 scripts/validate.py`: 186 files passed.
- lossless-source suite: 26 passed; SDK spike suite: 24 passed.
- `npm run check`: 7 passed; `npm run build`: passed.
- `cargo test -p loomlight-core --release --locked`: 96 passed, 4 ignored
  (subprocess workers and the official-SDK environment gate).
- `cargo clippy -p loomlight-core --all-targets --locked -- -D warnings`: passed.
- Full workspace/desktop Clippy, desktop tests, and packaging are unavailable on this
  Linux host because `pkg-config`/GLib/GTK/WebKit development packages are absent.
- Supported-target run IDs, job IDs, and evidence checksums remain pending and must be
  recorded here before archival or closure.

## Compatibility and user action

New imports use truthful Ren'Py discovery. Existing Phase 1D image files and UUIDs are
never renamed or regenerated. If an older project reports `compatibilityRequired`, the
user must invoke **Repair Ren'Py asset names** once; Loomlight then adds narrow verified
explicit declarations and metadata markers in one recoverable transaction. Missing,
changed, unsafe, or colliding assets are reported and not silently repaired.

## Remaining acceptance work

Commit and push the coherent implementation, run the single final production matrix
on Windows x64/macOS ARM64, preserve its logs/checksums, and update this brief plus
CURRENT/HANDOVER. Do not archive this brief or approve Phase 1E until that gate passes.
