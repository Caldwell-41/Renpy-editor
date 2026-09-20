# Task: Phase 1B corrective transaction and recovery remediation

**Status:** Complete 2026-09-14<br>
**Scope:** Corrective production transaction/recovery work only; Phase 1C remains unapproved

## Entry condition

Phase 1B was closed at `28be6669cb98d1d359112d5627ad24a4cf0e4f5c`, but a
subsequent review found three material Gate E gaps: pathname resolution remained after
parent validation, a crashed `prepared` journal had no safe path back to normal
operation, and terminal pre-mutation `rejected` journals blocked explicit flush.

The user explicitly approved this bounded remediation on 2026-09-14. Preserve all
Phase 1B guarantees and do not begin Phase 1C project lifecycle, SDK, parser, authoring,
Git, LLM, credential, updater, signing, or release work.

## Corrective design

1. Keep stage, accepted, and displaced-backup evidence inside the validated
   transaction recovery directory rather than beside the project target.
2. Open and retain validated root/component/parent directory handles for sensitive
   operations. Use descriptor-relative no-follow creation, inspection, rename, and
   exchange on Unix/macOS. On Windows, open each directory without delete sharing so
   rename/delete/reparse substitution is denied while pathname-only `ReplaceFileW`
   runs, and revalidate the object identity at the platform boundary.
3. Make the platform replacement consume an anchored target and recovery directory;
   never reconstruct artifact paths from an untrusted target pathname.
4. Define `prepared` as safely abandonable only when inspection proves that no stage,
   accepted, or backup evidence exists and no mutation flags crossed a persistence
   boundary. Finalisation then records `cleaned` and removes only partial journal
   slots.
5. Treat pre-mutation `rejected` as terminal and non-blocking for explicit flush.
   `conflict`, ambiguous states, and all states after accepted/staged persistence remain
   blocking until explicitly resolved.
6. Add deterministic hostile-boundary and real-process-termination tests on Windows
   x64 and macOS ARM64, retaining the exact CI evidence.

## Acceptance

- Transaction-owned artifact creation cannot be redirected outside the approved root
  by the identified parent substitutions.
- Final exchange is relative to a validated object on macOS and runs while the
  relevant Windows namespace components are pinned against rename/delete.
- Parent delete/recreate, symlink/reparse, target substitution, and out-of-root
  redirection tests retain all unrelated/external/accepted bytes as required.
- A real crash at `prepared` can be inspected, safely finalised, flushed, and followed
  by a successful transaction.
- Terminal pre-mutation rejection does not block flush or a later valid transaction;
  conflict and ambiguous recovery still block.
- Canonical state-machine, security, architecture, data-model, testing, status,
  handover, and ADR documentation match the implementation.
- Full repository validation and actual Windows x64/macOS ARM64 runtime evidence pass.

## Evidence

Implementation-tree local validation:

- `cd app && npm ci --ignore-scripts`; `npm run check` (5 passed); `npm run build`.
- `cargo fmt --check --all`.
- `cargo test -p loomlight-core --locked` (32 passed, 0 failed, 1 ignored worker;
  parent tests invoked real process termination at all seven persistent boundaries and
  a separate killed-process `Prepared` abandon/flush/later-commit flow).
- `cargo clippy -p loomlight-core --all-targets --locked -- -D warnings`.
- `cargo check -p loomlight-core --locked --target x86_64-pc-windows-gnu --all-targets`.
- `cargo check -p loomlight-core --locked --target aarch64-apple-darwin --all-targets`.
- `python3 scripts/validate.py` (175 files).
- `python3 -m unittest discover -s spikes/lossless-source/tests -v` (26 passed).
- `python3 -m unittest discover -s spikes/renpy-sdk/tests -v` (24 passed).
- `python3 spikes/lossless-source/benchmark.py` (620,000 bytes; 40,000 nodes;
  123.79 ms median over 7 final-validation samples).
- `git diff --check`.

Cross-compilation is recorded only as compilation evidence. Actual target execution is
recorded below.

### Successful target evidence

[Production run 34801268319](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34801268319)
at `302a2b2ab9b043b19e231b921493824ac9c8ad68` passed on both required targets:

- Windows x64 job 103844270268, Windows Server 2025: corrected independent core
  transaction/recovery suite 31 passed, 0 failed, 1 ignored child-process worker;
  desktop boundary, packaging, packaged WebView denial smoke, secret scan, and
  dependency/licence inventory also passed. Evidence artifact 10331303970 has SHA-256
  `6ae436a4befc0949f97b4299e0c4d79483d26026cb8ab23a8b7b9a701bf8e3c3`.
- macOS ARM64 job 103844270072, Darwin 25.6.0 ARM64: corrected independent core suite
  32 passed, 0 failed, 1 ignored worker; the same remaining production checks passed.
  Evidence artifact 10331433193 has SHA-256
  `8622d55bc4b5403a8b5843b3af1eafcee02213c470554457ea77c5b5d7a72347`.

Both jobs used Node 24.19.0, npm 11.9.0, rustc 1.90.0, and Cargo 1.90.0. Quality run
34801268255 passed at the same commit. The manual-only packaged-application upload was
skipped by policy on both routine jobs and is not required or classified as passing.
The lightweight evidence uploads succeeded. Gate E was re-closed at this point; the
post-closure recovery-enumeration follow-up below supersedes this run for the current
Gate E evidence.

### Failed target attempt retained

[Production run 34800849992](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34800849992)
at `188510d672de9ce42d7b4ec864dc01d6a8c19895` is failed evidence. macOS ARM64 job
103843060005 passed the 32-test corrected core suite (plus one ignored worker invoked
by parent tests), desktop tests, packaging, packaged denial smoke, secret scan, and
dependency/licence inventory. Windows x64 job 103843059894 passed setup, frontend,
build, and formatting, then failed the core step: 18 passed, 13 failed, 1 ignored.

The Windows root cause was deterministic, not flaky: post-`ReplaceFileW` and final
durability checks reopened installed/backup files read-only before requesting the
Windows file-buffer flush, which requires writable handles. Successful exchanges were
therefore conservatively reported recovery-required. The Windows root-substitution
test also expected a rename that the new no-delete-sharing root handle correctly
denied. The implementation now opens explicit writable no-follow/reparse-safe handles
for flush and tests the denied Windows root rename as the security outcome. Later
Windows package/smoke/inventory steps were skipped and are not counted as passes.

Retained artifacts are 10331432380 (Windows failure log, SHA-256
`fe094769f6f8ec596dc60aeb9bd0c74fb9de5899bc549e6ceb757c3e17b8090b`) and
10331042824 (successful macOS evidence, SHA-256
`00068706749c61d541bb9fa287dc4167ce45f2877378d0e47f9a743eac15aed9`). Quality run
34800849989 passed. This attempt does not close Gate E.

## Post-closure recovery-enumeration follow-up

A later review found one remaining recovery-side TOCTOU: `JournalStore::scan()` opened
an anchored `.renpy-editor/recovery` directory but enumerated it with
`fs::read_dir(recovery.path())`. On macOS/Unix another same-user process can rename an
open directory and install an empty replacement at its old pathname. That could have
made an unresolved transaction invisible to recovery discovery and allowed `flush()`
to observe an apparently empty report.

The follow-up keeps the original transaction guarantees and changes only recovery
enumeration:

- macOS/Unix validates that the live pathname still resolves to the retained recovery
  directory identity, duplicates that validated directory descriptor, enumerates the
  descriptor with `fdopendir`/`readdir`, and revalidates the anchor chain afterward;
- any recovery-path rename/replacement before or during enumeration fails closed as an
  identity/recovery error rather than returning an empty report;
- Windows retains pathname enumeration because the already-open recovery chain omits
  delete sharing and therefore pins the namespace against rename/delete; it is still
  validated before and after enumeration;
- the Unix/macOS regression
  `anchored_recovery_enumeration_rejects_path_substitution` renames the anchored
  recovery directory, installs an empty replacement at the old pathname, and proves
  the replacement cannot be accepted as an empty recovery set.

Implementation commits are `ab445301a63795037553e6a0ec3870dbbc860915`,
`c0d881a480b0c64f1cd5d43dc22895f75edf889a`, and final formatted code
`dc2efdf845fd014c57e850f2c96683fd487da592`.

### Final target evidence after recovery-enumeration correction

[Production run 34804861387](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34804861387)
at `dc2efdf845fd014c57e850f2c96683fd487da592` passed both supported targets:

- Windows x64 job 103854628315, Windows Server 2025: 31 core tests passed, 0 failed,
  1 child-process worker ignored by the harness; desktop boundary, packaging, packaged
  WebView denial smoke, privacy scan, and dependency/licence inventory all passed.
  Evidence artifact 10332572412 has SHA-256
  `5195042e24796f21f814e1e1e9049785eaf7441aa48a1d4b6d99011d7e0738bc`.
- macOS ARM64 job 103854628300, macOS 26.6.2 / Darwin 25.6.0: 33 core tests passed,
  0 failed, 1 worker ignored; this includes the new anchored recovery-enumeration
  substitution regression. Desktop boundary, packaging, packaged WebView denial smoke,
  privacy scan, and dependency/licence inventory all passed. Evidence artifact
  10333101940 has SHA-256
  `a055f22550acd0f0c166ce288a09ed3537ba72cfe78e0f52b0f289f3332309a5`.

Both jobs used Node 24.19.0, npm 11.9.0, rustc 1.90.0, and Cargo 1.90.0. Quality run
34804861410 passed at the same commit. Routine full-package upload was intentionally
skipped; lightweight evidence uploads succeeded. This run is the current Gate E
closure evidence. Phase 1C remains unapproved and was not started.

Production run 34804735119 at `c0d881a480b0c64f1cd5d43dc22895f75edf889a`
is retained failed evidence. Both target jobs passed setup, frontend validation, and
frontend build, then failed `cargo fmt --check --all`. Rust core tests and all later
steps were skipped. The exact formatting diff was applied in `dc2efdf`; no functional
failure was retried or reclassified as passing.
