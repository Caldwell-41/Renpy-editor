# CI-SIMPLE: accepted implementation and integration

**Closed implementation:** 2026-09-20, after bounded independent review and explicit user merge approval.
**State:** Accepted and merged; remote branch retirement remains a separate recorded housekeeping item.
**PR:** [#13](https://github.com/Caldwell-41/Renpy-editor/pull/13).
**Merge:** `998b5f4684c5c287920bfda67d12e818e3bd0371`.
**Reviewed head:** `1af10328620d2115f22673baf3f1c1050c0e220c`.
**Tested implementation:** `eeef503a40af05c3435297e1384f743a58ee1a3e`.
**Continuation:** [HANDOVER](../../status/HANDOVER.md).

## Disposition and preserved scope

The user approved integration after the independent review found no significant implementation or native-validation blocker. GitHub confirmed the merge. Its tree `8cbcbbbd4aeeb3643ab4ddf046b91c92257eca54` exactly matches the reviewed PR head, which is also a merge parent. No conflict resolution or additional application change was introduced.

The complete [bounded brief and implementation/failure ledger](https://github.com/Caldwell-41/Renpy-editor/blob/1af10328620d2115f22673baf3f1c1050c0e220c/docs/tasks/active/ci-simple-cleanup.md) is retained at its immutable pre-closeout revision. This consolidated acceptance record supersedes its old `awaiting_ci` state; it does not discard the original requirements, decisions or failed evidence.

Delivered changes are limited to the two existing workflows and operating/status documentation:

- Quality runs for pull requests, main pushes and manual dispatch, without the duplicate feature-push quality run.
- One shared production preflight runs repository validation, frontend/type checks and Rust formatting before either native target is allocated.
- Production concurrency uses a stable workflow/ref group with running work preserved. This is not dispatch deduplication.
- Windows x64/macOS ARM64 core, SDK, desktop, packaging, packaged smoke/security and inventory gates remain; npm/Rust/pinned SDK caches remain.
- Full package uploads are an explicit manual option, default false. Package construction stays mandatory; lightweight evidence remains.
- Agent guidance requires focused context, cheap checks first, coherent pushes and compact test/failure reporting.

W0 and OPT-1A, including every corrective pass, remain [abandoned](../active/ci-optimisation.md). PR #12 is not merged or imported. There is no new CI controller, SQLite/client bootstrap, watcher, automatic goal control, evidence fingerprinting or application feature.

## Accepted pre-merge evidence

[Production run 35496193908](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35496193908), attempt 1, completed successfully at the exact tested implementation above. Independent review inspected the actual preflight and both native job logs, not only the provider badges.

| Gate | Job | Observed result |
| --- | --- | --- |
| Preflight | `106039471254` | Repository validator: 203 files; frontend typecheck and 16 tests passed, no failures/skips; Rust formatting passed. |
| Windows x64 | `106039534254` | Core harness: 128 passed, 0 failed, 4 ignored worker entry points; both dedicated SDK gates, desktop compilation, MSI/NSIS packaging, packaged smoke/security and inventory passed. |
| macOS ARM64 | `106039534217` | Core harness: 134 passed, 0 failed, 4 ignored worker entry points; both dedicated SDK gates, desktop compilation, app/DMG packaging, packaged smoke/security and inventory passed. |

The four ignored core entries on each platform are subprocess workers exercised by their passing parent recovery tests. SDK wrappers print a skip during the generic invocation, then both dedicated archive-backed steps genuinely execute successfully. The desktop Rust harness contains zero unit tests: its pass is compilation/harness evidence; the separate packaged WebView smoke supplies executed desktop behaviour evidence.

Both packaged smoke reports affirm lifecycle, supporting authoring, Scene authoring, single-instance and WebView denial results on their expected target architectures. Artifact privacy scanning passed for six files on each target, and each inventory recorded 83 npm and 519 Cargo entries.

The run's artifact list contains exactly two lightweight evidence artifacts: macOS `10600850701` (11,699 bytes) and Windows `10600836394` (11,690 bytes). No large package artifact was uploaded with `upload_packages=false`; build/package/smoke gates still executed. The uploads-on condition was reviewed, not claimed as a second live run.

PR quality run `35496107906`, attempt 1, passed on the candidate's PR merge-test checkout `7d6b127e8f9f7aa0e1399507aeb889767f99755c`, not a direct candidate checkout. The subsequent reviewed documentation head passed PR quality run `35496307801`, attempt 1. Only three status/task documents differ between the tested implementation and that reviewed head; no new production acceptance at the documentation head is claimed.

The implementation reported local repository/YAML/trigger/dependency/consumer-order and whitespace checks. The independent reviewer did not rerun those local assertions. Local npm/Rust availability was not claimed; the actual production preflight/native runs supply the executed evidence.

## Retained failure and lasting lesson

[Production run 35495121351](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35495121351), attempt 1, failed on initial implementation `7693d58193b4cccd76c423f377dbefe9158c06ee`. Removing the standalone frontend build left `app/dist` missing before desktop compilation. Earlier preflight/core/SDK gates passed; later package/smoke/security gates were skipped, not accepted.

Corrective candidate `eeef503a` restored `npm run build` before desktop tests. Tauri's later `beforeBuildCommand` does not satisfy an earlier consumer. Retain that ordering; another build-system redesign is not a CI-SIMPLE completion requirement. This candidate received one replacement matrix, not repeated validation of unchanged inputs.

## Post-merge verification and housekeeping

The normal main push produced quality run `35497664235`, attempt 1, which completed successfully, and production run `35497664212`, attempt 1, at exact merge `998b5f46`. The production run was still in progress at this documentation snapshot. Inspect its final exact results through the run/PR before application work; do not dispatch a duplicate or describe pending evidence as passed. Final closeout receipts may be recorded on PR #13 without another documentation-only native matrix or self-referential SHA commit.

The user authorised deletion of only `maintenance/ci-simple-cleanup`. Its head was proven integrated, but the connected GitHub actions expose no branch-ref deletion operation, and no usable authenticated GitHub CLI is available in this session. A subsequent branch lookup confirmed it still exists. Therefore branch deletion is NOT claimed. Finish it with ordinary Git/GitHub tooling only after rechecking that its current tip is merged and no active work depends on it; do not delete local uncommitted work, other branches or PR #12.

No runner-minute/token percentage is established. The structural reductions are duplicate quality triggers, repeated shared checks and unnecessary large uploads. The standalone frontend build was not eliminated. CI optimisation implementation is complete; do not create another optimisation milestone to retire this branch.
