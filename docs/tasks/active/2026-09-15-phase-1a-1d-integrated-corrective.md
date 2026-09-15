# Task: Phase 1A–1D integrated corrective checkpoint

**Status:** Open — initial correction implemented; follow-up defects and supported-target acceptance outstanding.<br>
**Baseline:** `main` at `0e5e8b697782ed29d61d01dbb1240b9d16561c27`<br>
**Branch:** `corrective/phase-1a-1d-integrated`

Canonical initial implementation commit: `c08414293899f8930bd2eb5e8a78a5b6c10433e7` (the local object created before API publication is `bc72413`). Reviewed branch head was `157b6d110c5d66c1ea7c1df3e713b8bc38bbb2e3`; subsequent documentation amendments do not change application behavior or close this gate.

## Scope and stop rule

This is a bounded correction of the existing Phase 1A–1D foundation. Preserve the shell authority boundary, authoritative ordinary Ren'Py source, stable entity IDs, the pinned Ren'Py 8.5.3 adapter, and journalled sequential transaction contract. Scene, Beat, Preview, Source workspace, Branches, Git UI, and all Phase 1E/later implementation remain excluded.

The [follow-up execution brief](2026-09-15-phase-1a-1d-correction-follow-up.md) is the next bounded task on this same branch. Its preparation is not execution. Correct and verify the remaining defects before claiming closure; do not restart working foundations or merge into main without separate approval.

## Baseline evidence

The initial implementation reported a clean baseline worktree, the requested existing origin and Phase 1D commit `343e10f96e42ef1f1cb1d50f78936865436e4f2b` in main history. Before those edits: repository validation passed 185 files; lossless-source tests passed 26; SDK-spike tests passed 24; the 620,000-byte benchmark median was 106.66 ms; frontend check/build passed; and the core suite passed after installing repository-pinned Rust 1.90. That Linux host lacked GTK/WebKit development packages for desktop compilation/packaging; this is not target evidence.

## Initial correction ledger — implementation evidence, not final closure

| ID | Original boundary | Initial change/evidence | Present qualification |
| --- | --- | --- | --- |
| B1 | Ordinary writes could bypass unresolved recovery | Serialized recovery/commit/flush/finalise; actual follow-up write rejects | Preserve and rerun both ordinary/streaming regressions |
| B2 | Verification/recovery buffered complete media | Incremental 1 MiB hashing/copy; bounded snapshots/journals | Contextual work limits still need R6 |
| B3 | Readiness rehashed terminal import history | Terminal payload inspection skipped; instrumented zero-payload-read check | Preserve; terminal record count must not become a lifetime cap |
| B4 | Streaming lacked crash hooks and partial staging could look rejected | Persistent hooks/subprocess coverage; actual persisted evidence blocks | Final Windows/macOS cases still required |
| C1 | Failed activation revoked healthy current project | Prepare candidate before swap; old writable session regression | Preserve and verify target behavior |
| C2 | Inspection authority was dropped before registration | Retained inspected root anchor; substitution refusal | Preserve and verify target behavior |
| C3 | Requests implicitly targeted current project; stale UI completions | Per-activation session, IPC checks, import binding, partial UI guards | Core improvement present; all UI completion paths need R5 |
| D1 | Numeric-prefix replacement could turn 10 into 50 | Complete physical-line match; original sequence regression | Physical lines are not executable logical statements: R1 |
| D2 | Incoherent metadata could panic or drive source output | Empty-statement and selected semantic checks | Writer/reader limits, missing metadata and relationships need R2/R3 |
| D3 | Underscored image filenames disagreed with recorded names | Space-separated new names and explicit legacy declarations | Genuine image issue; repair/normalization need R3/R4. FLAC premise corrected below |
| D4 | Stored available status ignored physical files | Physical status and untracked-file inventory | Normalization/collision/status consistency need R4 |
| D5 | Selection check and ordinary open could observe different files | Retained parent and no-follow open; retained bytes handle | Preserve; acquisition-window/reparse target regressions required |
| U1 | Boolean coercion and integer rounding | Explicit controls and signed-64 decimal-string transport | Verify all IPC responses and legacy records under R2/R5 |
| U2 | Unconditional Saved and no session Flush | Status/Flush/keyboard actions, inline editors | Complete stale callbacks, conflict/buffer feedback and real DOM tests: R5 |
| A1 | Possible shell/single-instance regression | No regression identified in inspected guards | Packaged denial/single-instance evidence still required |

### Corrected FLAC assumption

The earlier review incorrectly treated FLAC automatic discovery as absent. The pinned-version reference [Ren'Py 8.5.3.26051504 audio scanner](https://github.com/renpy/renpy/blob/8.5.3.26051504/renpy/common/00audio.rpy) explicitly includes `.flac`. Confirm against the repository's exact SDK build; remove the false compatibility requirement without dropping supported FLAC imports or destructively removing working explicit declarations. The initial FLAC test only proves an explicit declaration was emitted, not that one was necessary.

## Follow-up ledger

All items below remain open until production regressions establish the corrected behavior. Review/isolated-helper evidence is not a substitute for those regressions.

| ID | Required correction and acceptance |
| --- | --- |
| R1 | Context-aware executable definition ranges, safe append on every path, no matches inside multiline strings/comments, compact-symbol collision handling, verified revision refresh and exact-byte refusal tests |
| R2 | Every accepted model/serialized document reloads; compatible escaped-string/statement/document bounds; known-field/relationship and exact integer IPC validation; missing authored metadata never silently resets identities |
| R3 | Normal declarations and compatibility repair share safe preflight; reject conflicting/unsafe/missing/changed cases; preserve IDs/source/files; idempotent marker-only repair; mixed-transaction interruption evidence |
| R4 | Match the pinned SDK's image/audio normalization and true namespace behavior across case/extensions/subdirectories/oversampling; correct FLAC assumption; verify retained import acquisition on supported targets |
| R5 | All asynchronous success/error/cancel/open/close/mutation completions are session/view-safe; truthful persistence/buffer feedback; real supporting-surface DOM and packaged tests |
| R6 | More than 4,096 terminal records do not block legitimate writes; complete bounded-memory scans still find later unresolved/corrupt records; oversized/growing reads terminate safely; no evidence deletion workaround |
| R7 | Reconciled docs and original+follow-up regressions; exact final Windows x64/macOS ARM64 production evidence; branch pushed/verified, no implicit main merge or 1E approval |

## Recorded local evidence for the initial implementation tree

- `python3 scripts/validate.py`: 186 files passed.
- Lossless-source suite: 26 passed; SDK spike suite: 24 passed.
- `npm run check`: 7 passed; `npm run build`: passed.
- `cargo test -p loomlight-core --release --locked`: 96 passed, 4 ignored subprocess workers. The official-SDK test returned its explicit no-archive skip marker; it is not target evidence despite the wrapper being reported passed.
- `cargo clippy -p loomlight-core --all-targets --locked -- -D warnings`: passed.
- Full workspace/desktop Clippy, tests and packaging were unavailable on that Linux host because pkg-config/GLib/GTK/WebKit development packages were absent.

These are retained implementation reports, not new executions by the documentation amendment or proof of R1–R7 completion. Final run/job IDs and evidence checksums must be added before archival.

## Compatibility and remaining acceptance

New image names and existing legacy files/UUIDs must remain stable. Compatibility repair must be explicit, narrow, verified and non-destructive. Missing, changed, unsafe or colliding assets are not silently repaired. Follow-up behavior must be documented accurately; the earlier blanket claim that all such checks already occurred during repair is not a closure guarantee.

Execute the follow-up on the existing branch when explicitly invoked, record failing-to-passing production regressions, run the complete final supported-target matrix, and update this task, the follow-up and CURRENT/HANDOVER. Preserve historical failures/skips and link exact tested trees. Do not archive the corrective tasks, label the checkpoint closed, merge into main or begin Phase 1E merely because the planning documents have been amended.
