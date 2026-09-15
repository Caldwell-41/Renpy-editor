# /goal — Close the remaining Phase 1A–1D corrections on the existing branch

Repository: https://github.com/Caldwell-41/Renpy-editor

Required existing branch: `corrective/phase-1a-1d-integrated`

**Status:** Completed — N1 and R1–R7 passed locally and on Windows x64/macOS ARM64. Implementation/test closure is recorded below; PR #7 integration is tracked separately. Phase 1E is not authorised.

## Objective and authority

Complete the bounded corrective follow-up to the existing Phase 1A–1D implementation. Do not restart those phases or rebuild working foundations.

When this prompt is explicitly submitted as the task, you are authorised to inspect and modify the repository, implement the corrections below, add production regressions, update documentation, make coherent commits, run validation, and push to the confirmed existing remote on `corrective/phase-1a-1d-integrated` only. Do not merge into or push to `main`, create a replacement branch, force-push, rewrite history, delete branches, change repository visibility, or publish a release.

The reviewed baseline was `157b6d110c5d66c1ea7c1df3e713b8bc38bbb2e3`, containing implementation commit `c08414293899f8930bd2eb5e8a78a5b6c10433e7`. These are reference points, not instructions to reset the branch. Start from its latest confirmed head, including subsequent documentation amendments and any legitimate newer work.

**Stop after the corrected Phase 1A–1D gate. Phase 1E and every later milestone remain unapproved.** The amended milestone plan is context, not permission to implement it.

## Preserved SDK correction N1 — do not reapply old branches

Branch reconciliation is complete. Application commit `02fc772d93fbe6b0709691bad15a4307a0193c93` selectively restores the missing SDK download handoff on this same corrective branch. Its core regressions and exact-source Windows/macOS official-archive handoff/reuse tests passed in run `34935598838`. The old source branch is preserved under tag `archive/phase-1c-network-install-fix-2026-09-15`; six already-integrated branches were retired. This was a separately approved maintenance action, not permission for this goal to delete more branches or merge main.

Preserve N1: managed SDK preparation/debris recovery occurs once before network download; the active operation's `.partial` must remain available for checksum/extraction. Public archive installation still performs its own one-time preparation. Preserve newer provenance-before-execution, quarantine, platform-flush and install-checkpoint behavior. Do not copy the archived branch's older SDK/lifecycle files over the current implementation or recreate duplicate stage helpers.

Keep the three synthetic handoff regressions and `renpy::reconciliation_tests::official_sdk_download_handoff_target_gate`. Include the latter in the final existing production matrix with the verified `LOOMLIGHT_PHASE1C_SDK_ARCHIVE` and require `phase-1c-network-handoff-gate: passed`; a wrapper skip does not count. The test injects archive bytes at the transport seam and exercises real checksum, extraction, provenance and reuse; do not call that a live HTTP transport test. Record N1 separately from open R1–R7 in the ledger. The targeted N1 run is not full Phase 1A–1D acceptance.

See [branch reconciliation evidence](../../audits/2026-09-15-branch-reconciliation.md). Start from the latest existing corrective head including this carry-forward, not an old pre-reconciliation SHA.

## 1. Establish the baseline and preserve working changes

Read `AGENTS.md`, applicable nested instructions, `docs/status/CURRENT.md`, the existing integrated corrective task, and the relevant PRODUCT, ARCHITECTURE, DATA_MODEL, UI, SECURITY, TRANSACTIONS and TESTING contracts and ADRs. Inspect the current worktree, branch, remote, history, and target CI evidence before editing. Preserve unrelated or uncommitted work. If the remote advanced, inspect and incorporate that work without overwriting it.

Keep the existing issue ledger and add follow-up IDs R1–R7 below. For each, record the actual reproduction, severity, affected paths, fix, regression and evidence. Distinguish demonstrated production behavior, isolated helper evidence, inspection findings, and disproved assumptions. Reproduce suspected defects against the current code; do not manufacture a change when a regression demonstrates that it is already fixed.

Preserve the Tauri main-WebView capability/CSP boundary, early single-instance enforcement, trusted native pickers, retained filesystem identities, candidate-before-swap activation, session-scoped IPC/imports, pinned Ren'Py 8.5.3 SDK/provenance design, incremental media copying, recovery serialization, expected-absence creation, and retained accepted/displaced evidence.

## 2. R1 — Recognise safe definitions, not just physical lines

Replace the physical-line-only safety assumption with the minimum lexical/context model needed by the existing Character, Variable and asset-declaration operations. A supported statement must be proven complete, executable, in the correct top-level context, uniquely mapped, and bound to exact source bytes and revision. Text inside comments, multiline strings, Python blocks or other opaque contexts is not a supported definition merely because it matches a canonical line.

Use context-aware source ranges for replacement, append preflight and declaration verification. Apply safe append checks to every relevant creation path, including Variables. Do not count quote characters across comments as a substitute for lexical analysis. Reject ambiguous or incomplete contexts without modifying source or metadata. Preserve harmless comments, formatting, line endings, Unicode and opaque text; do not normalise entire files.

Verify every existing mapping before refreshing its revision. Do not refresh unaffected entities into apparently current metadata unless their mappings were verified. Collision checking must cover the supported definition namespaces and statically recognisable alternate spacing, including `default score=10`; fail closed where the narrow recogniser cannot prove safety. This is not permission for the general Source workspace or full Ren'Py parser.

Required regressions through the actual authoring service include: the original `1 → externally 10 → create another variable → edit to 5` sequence; a canonical-looking definition inside a multiline string; commented-out and duplicate definitions; comments containing apostrophes/quotes; continuations and unfinished brackets/strings; safe and refused appends; CRLF, Unicode and a final line without a newline. Assert exact unrelated bytes and no mutation on refusal.

## 3. R2 — Every accepted metadata write must be reloadable

Validate the complete proposed authoring model and its actual serialized size before staging any source/metadata transaction. Use compatible limits for raw values, escaped literals, complete statements and the full metadata document. Do not accept a 10,000-byte string and then reject its longer generated statement on the next read. Reject over-limit proposals before any live mutation rather than truncating data or merely moving the failure to reopen.

Validate known fields and relationships: unique entity IDs and symbol names; Character/Variable source coherence; valid appearance attributes/render mode and correct Character/Asset relationships; asset kind, supported location/extension, discovery grammar and namespace consistency; hash/count and source-map validity. Preserve unknown fields without allowing them to author arbitrary source.

Distinguish documented initialization of a provably never-authored legacy Phase 1C project from missing metadata in an already-authored Phase 1D project. Missing `authoring.json` must not silently become an empty model that is saved over lost identities. When provenance is insufficient, fail closed and preserve source; do not implement arbitrary project reconstruction.

Keep exact signed-64-bit decimal-string transport at every renderer boundary, including legacy integer records and mutation responses. Legacy numeric storage may be converted losslessly in the trusted core; do not expose precision-losing JSON numbers as the renderer contract.

Test input/escaped-statement/document sizes at, below and above each limit, accepted-record reload, unknown-field retention, invalid known fields/relationships, missing metadata before/after authoring, exact integer boundaries and failed writes leaving both files unchanged. Include real serializer/reader and IPC round trips, not only helper tests.

## 4. R3 — Make compatibility repair a validated transaction

Route normal import declarations and legacy name repair through one safe declaration builder/preflight. Validate identifiers and image-name tokens before interpolation; reject newlines, control characters and syntax-bearing discovery names. Metadata is untrusted, not a licence to generate executable text from unchecked names.

Before repair, verify the complete affected asset/declaration set: physical existence, content/count, safe paths, namespace collisions and existing explicit declarations. An existing `image bg cafe` pointing elsewhere must not be followed by a conflicting declaration. Ambiguous, missing, changed, unsafe or colliding cases must refuse safely. Do not infer success from a matching physical line inside opaque text.

Preserve existing asset files, stable IDs and valid explicit source. Repair only proved compatibility defects in the existing supported layout, with source and metadata in one recoverable transaction. Make the operation idempotent, including a case where the source declaration already exists but an editor marker needs updating. Do not add general asset rename/delete or a broad repair framework.

Test conflicting declarations, compact/alternate spacing, unsafe discovery metadata, missing/changed assets, partial mixed-transaction interruption, repeat repair, metadata-marker-only changes, unchanged unrelated source, and close/reopen identity preservation.

## 5. R4 — Match the actual pinned SDK's discovery rules

Centralise a version-pinned discovery contract for supported images/audio and use it in import preflight, metadata checks, physical collision detection, status and repair. Match the actual SDK's relevant basename, extension, case, whitespace and image oversampling rules. Directories and different extensions must not create fictitious independent namespaces. Respect image versus audio namespaces and explicit declarations. Conservatively refuse unsupported custom discovery behavior rather than executing project code to infer names.

Keep the corrected space-separated image basenames for new imports and safe explicit declarations for genuine older underscore/name mismatches. Test cross-extension, case-variant, subdirectory and `@`-suffix collisions against pinned-SDK behavior, including files outside metadata. Verify that advertised names resolve to the intended files, not simply that some name exists.

**Correct the previous review's FLAC error:** Ren'Py tag `8.5.3.26051504`, `renpy/common/00audio.rpy`, includes `.flac` in automatic audio discovery. Confirm the repository's exact pinned SDK build, remove the false claim that FLAC inherently requires an explicit declaration, and do not classify a valid automatically discovered FLAC as incompatible. Preserve working explicit declarations unless a separate proved defect requires a safe correction. Keep FLAC format support; do not narrow it based on the earlier mistaken finding.

Verify the retained import-source acquisition boundary on Windows and macOS, including substitution between selection inspection and handle acquisition, relevant ancestors, symlinks/reparse points, same-path replacement and same-file content changes. Use the approved retained handle for bytes and keep imports bound to their originating session. Do not regress the corrected no-follow design or add renderer path/byte authority.

## 6. R5 — Complete session-safe UI and persistence feedback

Apply current-session and view/operation-generation checks to all relevant asynchronous success, failure, cancellation, close/open and mutation completions. An old callback must not restore its project view, replace current project state, overwrite a newer status, or pull the user back to an obsolete surface. Cover A → B, A → close → reopen A, two concurrent requests, navigation during save/import, and out-of-order errors as well as successes. Preserve the core stale-session checks.

Report persistence from authoritative state without hiding source conflicts behind a later Saved status. Distinguish unsubmitted form input from accepted work; Ctrl/Cmd+S must not imply unsubmitted input was saved. Keep explicit boolean controls and exact integer validation. Display mutation errors and re-enable controls correctly; do not silently discard input on a failed operation.

Add actual DOM/component behavioral tests with controllable delayed/reordered bridge responses, and packaged supporting-authoring smoke on both targets. Tests that only search source code for labels, `inlineEditor`, or operation names are insufficient. Exercise Character create/edit, Appearance/default, import cancellation/repair, Variable create/edit and exact values, status, Flush and keyboard interaction.

## 7. R6 — Bound resource use without a lifetime edit cap

Remove the behavior that treats more than 4,096 retained terminal journals as unresolved recovery. A project must remain writable after normal successful history growth. Use bounded-memory, complete inspection or an equivalently safe indexed/paginated design; do not ignore older or later unresolved/corrupt journals, raise a constant as the sole fix, delete evidence merely to pass, or permit writes after an incomplete scan. Keep scan/commit/finalise/flush serialization and filesystem identity protection.

Add contextual byte/work limits to revision reads so oversized or growing files terminate with a controlled result. Keep end-to-end media processing bounded-memory. Ordinary readiness checks must not rehash terminal media; unresolved recovery still requires honest evidence inspection. Retention/pruning and a general recovery UI remain outside this follow-up.

Test 4,097 or more terminal records followed by a real accepted write; an unresolved or corrupt record beyond the former boundary; enumeration errors/substitution; large media with measured buffer/read behavior; oversized and deterministically growing inputs; interruption before/after each media/companion mutation; and actual follow-up ordinary/streaming writes rejected while recovery remains unresolved. Do not substitute a small-file copy-success test for resource evidence.

## 8. R7 — Documentation, validation and supported-target closure

Update the existing integrated task and this follow-up with a truthful ledger. Earlier local tests remain historical evidence for their exact tree, not final proof. Correct the FLAC finding explicitly. Reconcile CURRENT, HANDOVER, AGENTS, index and affected canonical contracts; do not mark future milestone prerequisites as implemented or reopen unrelated SDK/shell design decisions.

Use the repository-pinned toolchains and run relevant cheap checks first: repository validator, whitespace checks, retained Phase 0 source/SDK regressions, frontend check/build and new behavioral tests, Rust formatting, core tests and Clippy. Record exact commands, counts, failures and skipped cases.

Then run the existing production workflow on the authorised corrective branch for the final application code/test/workflow tree: Windows x64 and macOS ARM64 core/host tests, official pinned-SDK authoring/discovery/lifecycle checks, package build, packaged WebView/single-instance/supporting-authoring probes, secret scans and dependency/licence evidence. Add narrowly scoped test wiring where necessary; do not weaken or remove existing gates.

Preserve CI cost controls: no production matrix for documentation-only commits; no routine Phase 0 matrices; no duplicate expensive run for an unchanged tested tree. One complete successful final target matrix is required, not a restriction against rerunning after a real code fix. A wrapper reporting passed after an SDK skip is not SDK evidence. Record run/job IDs, tested SHA, artifact IDs/checksums and retained redacted evidence. If target execution is unavailable, push coherent work and report the gate blocked; do not claim closure.

Commit and push only the intended changes on the existing branch, verify the remote result, and report what is and is not on `main`. Do not merge. Archive task briefs only after all required corrections and supported-target gates pass, updating links coherently. Documentation-only closure commits may cite the verified code tree when its equivalence is explicitly established.

## Scope exclusions and final report

Do not implement Scene/Beat authoring, multi-Scene migration, preview/media presentation, the general Source workspace/parser, Branches, runtime/Git UI, generic move/delete, new history features, plugins, credentials/LLM, arbitrary project import, release/signing/updater work, or later-phase recovery UX. The lexical/declaration helpers needed to make the existing 1D operations safe are allowed; the amended 1E prerequisites are not part of this correction.

Return a concise issue-by-issue result, changed paths/commits, exact tests and platform evidence, compatibility behavior/user actions, unresolved blockers and branch state. End at corrected 1A–1D closure or a clearly documented blocked checkpoint. Do not proceed automatically to Phase 1E.

## Implementation checkpoint — 2026-09-15

Remote implementation commit `8c19225` (tree-equivalent to the pre-publication local
object `0da5138`) closes the reproduced R1–R6 defects and adds the final workflow
assertions. Follow-up test-wiring fixes culminated in validated application candidate
`c912fcadf8160d32ec35c7a0135b12812ad65c56`, tree
`17ae6e4f16600d86f39bf354b7649a470dcf51f2`.

| ID | Result in `8c19225` and the final test-wiring descendants | Regression/evidence |
| --- | --- | --- |
| N1 | Preserved unchanged from `02fc772`; the three synthetic handoff cases and official-archive target gate remain wired | Local core suite passed; local wrapper had no official archive and is not counted as live HTTP or target evidence |
| R1 | Added a conservative top-level lexical statement recognizer, verified every mapped definition before revision refresh, and applied append/collision checks to Character and Variable creation | `external_numeric_prefix_change_cannot_be_refreshed_or_rewritten`, `lexical_context_guards_real_authoring_operations`, duplicate/opaque, CRLF/Unicode/final-line tests pass |
| R2 | Full proposed-model and actual serialized-size validation; compatible 10,000-byte/64 KiB/1 MiB limits; pristine-only metadata initialization; canonical decimal-string int64 storage and IPC target assertions | Escaped-string/reload, metadata-loss, relationship/document-limit, unknown-field and stable-ID tests pass; target lifecycle now asserts create/update IPC at both int64 limits |
| R3 | Imports and repair share one declaration parser/builder; repair verifies physical bytes and collisions, commits source/metadata together, and persists marker-only changes idempotently | Collision/idempotency/changed-media/reopen tests pass; mixed transaction crash-boundary suite remains the transaction authority |
| R4 | Centralized pinned image/audio discovery normalization, including case, extension, basename, subdirectory, whitespace and image `@` suffix behavior; FLAC remains automatic | Pinned-normalization, untracked collision, FLAC, retained-handle path/parent/symlink/same-file race tests pass locally and in both target jobs |
| R5 | Added view/operation/session guards to async UI flows, truthful unsubmitted/accepted persistence feedback, input/focus restoration, a controllable real-DOM test, and packaged supporting-authoring smoke | Frontend suite 8/8 passes; the behavioral case covers reordered opens/errors, navigation during mutation, close/reopen, Character/Appearance/Variable operations, cancellation/repair, exact values and Flush |
| R6 | Removed the retained-journal count cap from readiness, replaced it with complete constant-working-memory enumeration, retained full explicit reports, and bounded revision reads against oversized/growing inputs | 4,097 durable records followed by a real write, a later corrupt record blocking commit/flush, anchored enumeration, bounded media and growing-read tests pass |
| R7 | Complete — canonical contracts and workflow marker requirements updated; actual diff re-reviewed; exact candidate passed repository quality and the full supported-target production matrix | Run `34982164071`: macOS ARM64 job `104424934281`, Windows x64 job `104424934679`; retained artifacts and checksums below. Integration status remains separate. |

Local results for the implementation tree and unchanged production code carried into
`c912fcadf8160d32ec35c7a0135b12812ad65c56`:

- `python3 scripts/validate.py`: 193 repository files passed.
- `git diff --check`: passed.
- lossless-source suite: 26 passed; SDK spike suite: 24 passed.
- `npm ci --ignore-scripts`: passed; `npm run check`: 8 passed; `npm run build`: passed.
- `cargo fmt --check --all`: passed.
- `cargo test -p loomlight-core --release --locked`: 115 passed, 0 failed,
  4 ignored subprocess-worker entry points.
- `cargo clippy -p loomlight-core --all-targets --locked -- -D warnings`: passed.

No local official SDK archive was supplied, so the local SDK wrappers are not recorded
as official-archive acceptance. No Phase 1E code is present.

## Supported-target closure — 2026-09-15

Production run `34982164071` passed for exact application candidate
`c912fcadf8160d32ec35c7a0135b12812ad65c56` (tree
`17ae6e4f16600d86f39bf354b7649a470dcf51f2`) with pinned Node 24.19.0,
npm 11.9.0 and Rust/Cargo 1.90.0:

- macOS ARM64 job `104424934281`: frontend 8/8; core 115 passed, 4 ignored
  subprocess worker entry points; official lifecycle/authoring 1/1; official N1 handoff
  1/1; desktop compile/test, application/DMG package, WebView/single-instance/supporting-
  authoring smoke, privacy scan and dependency/licence inventory all passed.
- Windows x64 job `104424934679`: frontend 8/8; core 110 passed, 4 ignored
  subprocess worker entry points (the difference is platform-conditional coverage);
  official lifecycle/authoring 1/1; official N1 handoff 1/1; desktop compile/test,
  application package, WebView/single-instance/supporting-authoring smoke, privacy scan
  and dependency/licence inventory all passed.
- Both official archive gates emitted `phase-1c-target-gate`, remediation, Phase 1D,
  exact-IPC, import-authority and corrective passed markers. Both N1 gates emitted
  `phase-1c-network-handoff-gate: passed`. The cache-hit download step was correctly
  skipped; the archive-backed tests themselves ran and passed. They inject retained
  archive bytes at the transport seam and are not live HTTP tests.
- Artifact `10402296713` (`phase-1-production-evidence-macos-26`) has digest
  `sha256:b9ef1b79c8831a72ce47a6b9f5699b9f4612498af921731438d2d2abe8d28d68`.
  Artifact `10402980439` (`phase-1-production-evidence-windows-2025`) has digest
  `sha256:30616afeab8b14a99b9fa2ca6309a8da3b844f5299fd0afa7bd3ac901aa23a38`.
  Each retained six redacted files; each privacy scan passed six files and each
  inventory recorded 83 npm plus 519 Cargo entries.
- Repository-quality runs `34982164144` (push) and `34982167950` (PR) passed the exact
  candidate. The later documentation-only closure preserves the validated application,
  test and workflow subtrees and therefore does not duplicate the production matrix.

Failing-to-passing evidence is retained rather than hidden: run `34976399471` exposed a
non-canonical synthetic fixture path; `34976951700` exposed test-order recovery state;
`34977509501` exposed duplicate race-fixture bytes; `34978398757` exposed a packaged
smoke sequencing failure; and `34980730159` proved the Tauri internals bridge is
intentionally non-writable. The final probe uses a host-enabled, otherwise refusing,
in-renderer requester seam that grants no host I/O authority and records a finite stage.

An additional local `cargo test -p loomlight-desktop --locked` attempt could not compile
on the Linux host because pkg-config/GLib/GTK development packages were unavailable;
it is not target evidence. Both supported desktop jobs compiled and passed. No in-scope
correctness or security blocker remained in the complete diff review. Missing/lost or
ambiguous metadata, unsupported source syntax, unsafe/colliding asset repair and changed
import authority continue to refuse non-destructively by design. Phase 1E is absent.
