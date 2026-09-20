# Simple CI and agent-usage cleanup

**Selected:** 2026-09-20, following the user's explicit abandonment of OPT-1A and W0.
**Checkpoint:** CI-SIMPLE.
**State:** `awaiting_ci`; implementation candidate published and the single required
production matrix is in progress.
**Baseline:** Freshly verified integrated `main`, not `maintenance/ci-optimisation`.
**Implementation branch:** `maintenance/ci-simple-cleanup`; check for existing matching work before creating it.
**Implementation candidate:** `7693d58193b4cccd76c423f377dbefe9158c06ee`.
**Pull request:** [#13](https://github.com/Caldwell-41/Renpy-editor/pull/13).
**Continuation:** [HANDOVER](../../status/HANDOVER.md).

## Objective and boundary

Reduce avoidable GitHub Actions runs, native runner allocation, repeated builds/uploads and agent context. Use ordinary workflow edits and short operating instructions. This is a reduced replacement for selected OPT-2A ideas, not execution of the old optimisation programme.

W0 and OPT-1A, including all corrective passes, are abandoned. W1-W3 are not proceeding; OPT-2B cross-commit evidence reuse is deferred. Read the [abandonment decision](ci-optimisation.md), not the old corrective ledger as an implementation prerequisite. Do not merge or cherry-pick PR #12 to start this task.

No custom CI controller, database/journal, client-profile bootstrap, runtime inventory, queue bridge, watcher/service, automatic goal control, evidence fingerprinting, subagents, self-hosted runners or application features. Do not repair abandoned SQLite/ACL tooling. Existing source-authoring transactions and application recovery are unrelated and must remain intact.

Expected changes: existing quality/production workflow YAML and concise AGENTS/WORKFLOW/task documentation. A small stateless check or test fixture is permitted only when needed to validate these edits; no general framework or new dependency stack.

## Implementation

### 1. Remove duplicate quality triggers

Configure the existing quality workflow for pull requests, pushes to `main`, and manual dispatch. Remove unrestricted feature-branch push triggers so one PR update does not also launch an identical push-quality run. A branch without a PR uses local checks or explicit manual dispatch.

Preserve existing required check names and inspect applicable rules before changing checks. Do not change repository protection or privileges. Do not add production packaging to every PR update. Preserve current documentation-only production exclusions, while retaining coverage for executable workflow/build inputs; no broad ignore-all-Markdown rule or new change-fingerprint system.

### 2. Put cheap checks before native production allocation

Add one small preflight job to the existing production workflow and make both native production jobs depend on its success. Use existing repository validation, frontend/type checking and Rust formatting with the repository's pinned toolchains. Run cheap local checks before pushing when tools are available.

Do not import PR #12's private-state or CI-operation tests. Do not add a full Linux Rust/SDK/desktop build. Avoid redundant copies of the same platform-independent check inside both native jobs once the shared gate is established; retain platform-dependent checks.

Keep Windows x64 and macOS ARM64 core, SDK, desktop, packaging, packaged WebView/denial/security and inventory gates. A skipped native job is not passed native acceptance. Keep dependencies and check outcomes explicit; no custom evidence aggregator. Use separate steps or checked exit codes for independent native commands so a later success cannot hide an earlier failure.

### 3. Use simple production concurrency

Group production execution by stable workflow and branch/ref, shared by push and manual dispatch; do not give each manual run its own group using the run ID. Initially use `cancel-in-progress: false` to preserve running production validation. Do not cancel other runs as part of implementation.

Document this as concurrency control, not deduplication or a guarantee that every pending run executes. Do not add a local operation registry or automatic retry logic. Inspect existing run IDs before manually dispatching another candidate.

### 4. Remove only a confirmed duplicate frontend build

Inspect the actual Tauri configuration and build path. Remove the standalone native `npm run build` only if the Tauri packaging hook already performs the required build before its consumers. Preserve the frontend check. If it is not redundant, keep it and record that finding; do not redesign the build.

### 5. Make large uploads opt-in and retain caches

Add a boolean manual `upload_packages` input, default false. Gate large package uploads on that explicit option and successful package creation; automatic runs do not upload large packages. Package construction and smoke/security validation stay mandatory. Retain bounded lightweight evidence and existing npm, Rust and pinned SDK caches. Do not upgrade SDKs/toolchains or rebuild cache strategy in this task.

### 6. Keep agent usage bounded

Update AGENTS/WORKFLOW briefly: read current status, the handover, this task and relevant code/diffs rather than every historic ledger; run cheap checks first; push coherent checkpoints; return compact test counts and relevant failure excerpts rather than full successful logs. Do not create receipt-only commits that chase their own SHA.

Use manual CI continuation. If an external run is pending, record its run ID, attempt and tested SHA, publish an `awaiting_ci` handover and stop active model polling. No automatic wake-up dependency, keep-alive messages or additional agent used as a watcher.

One implementation self-review and one independent acceptance review. Fix demonstrated correctness/security/acceptance blockers; record optional improvements for later rather than reopening architecture or widening this checkpoint.

## Validation and stopping rule

First inspect actual main/branch/PR state and relevant workflow/build configuration. Preserve unrelated work. Validate YAML and repository links/privacy/whitespace, run applicable cheap checks, and review a compact trigger/dependency table covering PR updates, main code changes, main docs-only changes and manual runs with uploads off/on.

Check that a failed preflight cannot allocate either native job, independent command failures propagate, both native gates remain mandatory, concurrency has stable identity, and uploads do not suppress package builds. Use small offline or tools-only tests for negative paths; do not intentionally fail repeated production matrices. Review actual suite outcomes, including explicit skips, rather than only a green job badge.

Because production execution changes, obtain one justified production matrix on a coherent implementation candidate, using existing GitHub tooling and normal manual dispatch. Verify both native targets, build-hook behaviour and small evidence output. Reuse an already-running validation of that exact candidate rather than dispatching a duplicate. Do not infer cross-commit acceptance. No further production matrix merely for a documentation receipt. Unavailable local tools must be reported and delegated, not marked passed.

Report which duplicate runs/builds/uploads were eliminated and distinguish expected savings from measurements; no token or runner-minute percentage without evidence. Commit/push the narrow change on the new branch and open/update its own PR. Update this ledger, CURRENT and the single HANDOVER. Do not merge either PR or delete branches. Stop at `review_ready`, or `awaiting_ci`/`blocked` with precise outstanding evidence; give a short completion report.

## Reference contracts

Consult current official references only as needed; this is not a new research checkpoint.

- [GitHub workflow syntax: triggers, needs, inputs and shell exit behaviour](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [GitHub workflow concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)
- [Tauri configuration and beforeBuildCommand](https://v2.tauri.app/reference/config/)

## Execution ledger

2026-09-20: Scope and stopping rules published only. No implementation, workflow changes, new native acceptance or savings measurement is claimed.

2026-09-20: CI-SIMPLE implementation candidate `7693d58193b4cccd76c423f377dbefe9158c06ee`
was created from freshly fetched main `5b16950900bb87d2c89de7abbae3295b4dc310c3`
after confirming there was no matching branch or PR. The dirty
`maintenance/ci-optimisation` checkout and PR #12 were left untouched; work used a
separate checkout on `maintenance/ci-simple-cleanup`.

The candidate preserves workflow/check names and both native targets. Repository
quality now runs for PRs, main pushes and manual dispatch, avoiding the duplicate
feature-push run for PR updates. Production now uses one shared Linux preflight before
native allocation, stable workflow/ref concurrency with `cancel-in-progress: false`,
and an `upload_packages` boolean defaulting false. Shared validator/frontend/Rust-format
checks run once instead of inside each native target. The standalone frontend build
was removed after confirming `app/src-tauri/tauri.conf.json` runs `npm run build` via
`beforeBuildCommand`; Tauri packaging, package smoke/security and both native gates
remain mandatory. Large packages upload only on a successful manual run with the
input enabled; lightweight evidence and npm/Rust/SDK caches remain.

| Scenario | Repository quality | Production | Full package upload |
| --- | --- | --- | --- |
| Pull-request update | Runs | Does not run | No |
| Main production-input change (`app/**`, workflow or validator) | Runs | Preflight, then both native targets | No |
| Main documentation-only change | Runs | Does not run | No |
| Manual production, uploads off/default | Separate quality dispatch only if requested | Preflight, then both native targets | No |
| Manual production, uploads on | Separate quality dispatch only if requested | Preflight, then both native targets | After all gates succeed |

Local validation used the bundled Python runtime: the repository validator passed 203
tracked files; a pinned temporary YAML 1.2 parser loaded both workflows and structural
assertions passed for the table above, native dependencies/gates, stable concurrency
and upload conditions; `git diff --check` passed. npm and Rust were not available
locally, so no local frontend or Rust outcome is claimed. The single implementation
self-review found and fixed one bounded issue: `scripts/validate.py` was added to the
production path filter because the preflight now executes it.

Quality run [35495071833](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35495071833),
attempt 1, passed on the exact candidate; its actual checkout and validator steps
completed successfully. Production run
[35495121351](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35495121351),
attempt 1, was dispatched once on the same SHA with `upload_packages=false`. At the
handover snapshot, preflight passed every step, both native jobs were in progress,
macOS core tests had passed, and the macOS SDK download was explicitly skipped after
a successful cache restore. No duplicate matrix was dispatched.

State is `awaiting_ci`. Resume manually after run 35495121351 completes and inspect
actual test counts, failures/skips, package/build-hook behavior, smoke/security and
artifact outcomes. Do not run a production matrix for the following documentation-only
receipt. A pass advances only to `review_ready` for independent review; do not merge
or delete branches. These are expected structural savings, not measured runner-minute
or token percentages.
