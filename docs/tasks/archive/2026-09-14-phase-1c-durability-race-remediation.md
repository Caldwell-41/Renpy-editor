# Task: Phase 1C lifecycle durability and race remediation

**Status:** Complete 2026-09-14  
**Scope:** Corrective Phase 1C only; Phase 1D remains unapproved

## Findings

The prior Phase 1C gate did not cover three material boundaries:

1. The managed Ren'Py SDK directory and its external provenance record committed as
   separate filesystem objects. Termination could leave incomplete or contradictory
   states that blocked retry.
2. `recent-projects.json` was opened with truncation and rewritten in place, so a
   failed update could manufacture an empty or partial live store.
3. Project-stage validation preceded pathname-based Ren'Py/Git use and promotion. The
   tests rejected substitution before validation but did not exercise the final
   validation-to-use interval.

The fresh review also found two related issues while this task was open: project-open
metadata inspection followed pathnames after validation, and managed discovery
executed the SDK version probe before matching checksum-derived provenance. Both are
included in this correction. Anchored opening initially changed the established
arbitrary-project rejection from `InvalidMetadata` to `UnsafePath`; failed target
evidence exposed that regression and the final correction preserves both the public
error contract and fail-closed substitution behavior.

## Chosen design

### Managed SDK

- Ren'Py remains pinned to exactly 8.5.3 and the official archive SHA-256 remains
  mandatory. Redirect refusal and all traversal, link, collision, portable-name,
  member/depth/size, and decompression limits are unchanged.
- The verified SDK and `.loomlight-managed-sdk-provenance-v2` are one private staged
  unit. The extracted regular files and directories are recursively flushed; the
  provenance file is created, fully written, platform-flushed, and directory-flushed
  before one retained-parent no-replace promotion exposes the unit.
- Discovery first inspects directory identity and launcher/template fingerprints
  without executing the SDK. Embedded or compatible legacy checksum-derived
  provenance must match before `--version` is spawned; identity and fingerprints are
  rechecked after the exact-version probe.
- A valid existing managed SDK is returned and never replaced. The old external
  provenance layout is accepted only when it exactly matches the inspected SDK, then
  migrated inside. Missing, corrupt, truncated, or mismatched final states and exact
  UUID-shaped installer-owned stages/candidates/downloads are moved to unique
  quarantine names so retry can proceed. Recovery does not recursively delete those
  entries and ignores similarly named unrelated entries.

### Recent Projects

- The service retains the application-state directory identity. Readers open the live
  regular file no-follow through that anchor and never depend on a deliberately
  truncated destination.
- Writers serialize completely, create a UUID-named private sibling with create-new,
  write all bytes, apply the platform file flush, flush the directory where supported,
  atomically replace the live regular file, and verify the committed bytes.
- A pre-commit error or termination leaves the prior complete store. A post-replace
  restart observes the complete new store. Cleanup targets only that invocation's
  unpredictable temporary; stale or corrupt siblings from another process are ignored
  and retained.

### Project stage and open races

- Stage creation and overlay writes are descriptor-relative to retained parent/stage
  authority. Unix/macOS Ren'Py and Git children enter the retained stage descriptor;
  Windows retains no-delete-share directory handles through process creation.
- Barriers substitute the stage immediately after final validation/before spawn, while
  the child is running, and immediately before promotion. The child uses the approved
  object. Portable handle-based directory promotion is unavailable across both targets,
  so the documented guarantee is precise: a replacement may win the namespace rename,
  but post-promotion identity/marker checks move it to a unique rejected-final
  quarantine and fail. It never remains at the requested final path; neither approved
  nor replacement data is silently destroyed.
- Project opening now walks `.renpy-editor/project.json` and every required source file
  through retained no-follow directory chains. Missing metadata retains the public
  `InvalidMetadata` result; a substituted chain fails closed as `UnsafePath`.

## Platform semantics

- macOS file durability uses `F_FULLFSYNC` for staged files and `fsync` on directory
  descriptors. No-replace directory promotion uses `renameatx_np(RENAME_EXCL)`.
- Windows atomic Recent Projects replacement and directory promotion use
  `MoveFileExW` with `MOVEFILE_WRITE_THROUGH` (and `MOVEFILE_REPLACE_EXISTING` only for
  the application-local Recent Projects file). Ordinary-user directory fsync is not
  available; retained handles pin the relevant namespace against rename/delete.
- Unix development coverage uses descriptor-relative no-follow operations and
  `renameat2(RENAME_NOREPLACE)` where available. It is regression coverage, not
  supported-target evidence.

## Tests and validation

The core suite includes deterministic tests for absent/corrupt/truncated/mismatched
provenance; legacy migration; abandoned exact-owned SDK stages, candidates, and
downloads; valid-install no-replace; unrelated-name preservation; SDK root
symlink/reparse refusal; errors immediately before/after promotion; and real subprocess
termination at both SDK promotion boundaries followed by successful retry. The
official target test also proves that discovery does not spawn a managed SDK while its
provenance is absent.

Recent Projects tests cover ordinary replacement, partial-write and durable-stage
failures, post-replace failure, stale corrupt sibling retention, symlink/reparse
substitution, application-state root substitution, preservation of the previous store,
and real subprocess termination at partial, durable, and committed checkpoints followed
by restart.

Project tests cover substitution before validation, after validation/before child use,
while child execution is in flight, during parent-anchored stage creation, during
overlay writes, before promotion, and during anchored metadata opening. They assert
that replacement data never becomes the final project and neither data set is silently
deleted.

Final local results:

- `npm ci --ignore-scripts`, `npm run check`, and `npm run build`: passed; 6 frontend
  tests passed.
- `cargo fmt --check --all`: passed.
- `cargo test -p loomlight-core --locked`: passed; 68 passed, 0 failed, 3 intentional
  subprocess workers ignored.
- `cargo clippy -p loomlight-core --all-targets --locked -- -D warnings`: passed.
- `python3 scripts/validate.py`: passed for 182 repository files after final evidence
  reconciliation.
- Lossless-source suite: 26 passed. SDK spike suite: 24 passed. Benchmark median:
  186.22 ms for 620,000 bytes / 40,000 nodes.
- `git diff --check`: passed.
- Local Linux `loomlight-desktop` test and package attempts were made but could not
  compile `glib-sys`/`gobject-sys` because this host has no `pkg-config`/GLib desktop
  development environment. This is an unsupported-host limitation and is not target
  evidence.

## Commits

- `0a5c6a4dfd7fb2be3ea15e04c8499c6f39ac847c` — crash-consistent SDK/Recent
  persistence, stage race remediation, platform operations, tests, and target gate.
- `9e726892251e061219c2c0e2fd90d3b23c16ac5d` — anchor project-stage creation to the
  retained parent.
- `bc1ead467219dee9601b22226e00e7de32bfbe01` — reflect the Windows pinned
  application-state namespace in the deterministic regression.
- `363747c5adb4cbf452c88f18a8438da6c1039591` — anchor project-open metadata/source
  inspection.
- `84d6e8d5255b5e4a43389822cabb26aab2635ef5` — require matching managed provenance
  before SDK execution.
- `bdc7ad60a64bfa51fd9c5380b33fd7fda6d92131` — preserve arbitrary-project rejection
  semantics and add a regression.

## Production evidence

[Production run 34849801157](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34849801157)
at `bdc7ad60a64bfa51fd9c5380b33fd7fda6d92131` passed. Windows x64 job
`103994559964` and macOS ARM64 job `103994559633` both passed their platform core
suites, the official Ren'Py 8.5.3 lifecycle test and all three remediation markers,
desktop tests, packaging, packaged WebView/lifecycle smoke, secret scan, and
dependency/licence inventory. Evidence artifacts are `10350511403` (Windows, SHA-256
`30fd5e2a8479513eace75856aa9747a63cafe70be2cbf6124cc1be1e8566d675`) and
`10351240446` (macOS, SHA-256
`cf3e7dc9a913ca1b84ca5b8377e1af0422b880ed66d16e93e8d7fe684a17e9d5`). Quality run
`34849801200` passed at the same commit.

Failed and superseded evidence remains evidence:

- Run `34846082577` at `0a5c6a4` was cancelled by a corrective push. Its partial
  Windows/macOS evidence artifacts are retained and are not passes.
- Run `34846676950` at `9e72689` is cancelled/failed evidence. Windows job
  `103984406288` failed because the new application-state substitution test expected a
  Unix rename on Windows, whose retained handle correctly denied it; the test was
  corrected. The macOS job was superseded while packaging.
- Run `34847325887` at `bc1ead4` was cancelled/superseded and is not closure evidence.
- Run `34847858138` at `363747c` failed both target jobs (`103988332809` macOS,
  `103988333142` Windows) because anchored arbitrary-project rejection returned the
  safe but incompatible `UnsafePath` code. Diagnostic artifacts remain `10348632139`
  (macOS, SHA-256 `8d8d2444d2d0786162fc4f2f8eabeb45823297ff0ff27bc6e1c74713a53bb3fa`)
  and `10349007566` (Windows, SHA-256
  `2202a860ecec13d4afdd8c1ed5e0efa6f7ce29f2bdeaac0fe03cc2d886f44f89`).
- Run `34849022402` at `84d6e8d` retained that same error-contract failure in macOS
  job `103991956020` and Windows job `103991956555`; it is failed evidence, not a
  pass. Diagnostic artifacts are `10349745636` (macOS, SHA-256
  `8619fbc74cc5694110f60e6ee8513ef823e806724c5057dd676ddb9d32071c0c`) and
  `10349393254` (Windows, SHA-256
  `3fb32b2270fe6efe8c400ad30f127f40c79e39bf68607b26d618ac5fb9f7b8b5`).

## Fresh Phase 1C review and limitations

The closure review covers parent authority/identity; stage creation, child use,
cleanup, and promotion; SDK discovery/browse/install/provenance/recovery/extraction;
Ren'Py and Git environments; metadata creation/opening; Recent Projects; generated
Ren'Py structure and source; close/reopen and metadata-free operation; arbitrary
project rejection; renderer/IPC authority; asynchronous desktop dispatch; and target-
specific semantics. The review found the project-open and managed-discovery trust-
ordering gaps described above; both were fixed and target-evidenced. No other material
Phase 1C check/use or split-commit defect remains. Phase 1C is clean enough to re-close.

Known bounded limitations are intentional: support remains exactly Ren'Py 8.5.3;
Windows uses write-through namespace operations because it lacks an ordinary directory
fsync; rejected/ambiguous SDK and promotion objects are quarantined for later/manual
cleanup; stale Recent temporaries are ignored; final directory promotion has the
precise detect/quarantine guarantee above rather than an unportable handle-rename
claim; and a browsed SDK is still an explicit user-approved executable boundary.
Signing, notarisation, updater, release work, arbitrary project import, and all Phase
1D/later authoring remain out of scope.

Phase 1C is re-closed. Phase 1D was not started and remains separately approval-gated.
