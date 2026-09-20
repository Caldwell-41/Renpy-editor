# Current checkpoint handover

**Prepared:** 2026-09-20.
**Repository:** `Caldwell-41/Renpy-editor`.
**Selected checkpoint:** [CI-SIMPLE only](../tasks/active/ci-simple-cleanup.md).
**State:** `awaiting_ci`; implementation complete, acceptance evidence pending.
**Baseline:** Remote `main` `5b16950900bb87d2c89de7abbae3295b4dc310c3`.
**Implementation branch:** `maintenance/ci-simple-cleanup`.
**Implementation candidate:** `7693d58193b4cccd76c423f377dbefe9158c06ee`.
**Pull request:** [#13](https://github.com/Caldwell-41/Renpy-editor/pull/13).

## Start here

Read AGENTS.md, [CURRENT](CURRENT.md), [WORKFLOW](../WORKFLOW.md) and the
CI-SIMPLE brief. Continue the published simple-cleanup branch; do not reset to main
or use its documentation-only head as a new production candidate. The dirty abandoned
checkout was preserved and the implementation used a separate worktree.

## Abandoned work

The user explicitly abandoned W0 and OPT-1A, including all later corrections and Windows/SQLite acceptance work. W1-W3 are not proceeding and OPT-2B is deferred. The [decision record](../tasks/active/ci-optimisation.md) overrides old branch-local instructions to resume CI acceptance, initialise a private client or investigate runtime control. Existing reports remain historical evidence; no completion or capability pass is claimed.

Do not start W0 recovery, fix the old journal, install a watcher, manipulate goals or import PR #12 as a prerequisite. Do not delete its branch or any private state. Updating docs does not stop a running external agent; no such stop is claimed here.

## Completed work

Candidate `7693d58` narrows quality pushes to `main`, adds one shared production
preflight before native allocation, uses stable ref concurrency without cancellation,
removes the native copies of shared checks and the Tauri-hook duplicate frontend
build, and makes full package upload an explicit successful manual-run option. Windows
x64, macOS ARM64, package construction, SDK, desktop, WebView/security, inventory,
lightweight evidence and caches remain in place. AGENTS/WORKFLOW now carry the bounded
context and compact-reporting rules. The one self-review added `scripts/validate.py`
to production paths because it became an executable preflight input.

## Validation and outstanding operation

- Local bundled Python: `scripts/validate.py` passed all 203 tracked files.
- A pinned temporary YAML 1.2 parser loaded both workflows; offline assertions passed
  for triggers, preflight dependency, both native targets, retained gates, stable
  concurrency and upload off/on behavior. `git diff --check` passed.
- Local npm and Rust were unavailable; no local frontend/Rust pass is claimed.
- Quality run [35495071833](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35495071833),
  attempt 1, tested the candidate and completed successfully. Its checkout and
  repository validation steps both passed.
- Production run [35495121351](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35495121351),
  attempt 1, tests the exact candidate with `upload_packages=false`. The recorded
  snapshot has a successful preflight (validator, locked install, frontend/protocol
  checks and Rust formatting); Windows x64 and macOS ARM64 are in progress. macOS core
  passed and its SDK download step was explicitly skipped because the cache restored.

Do not poll, watch, redispatch or run production for the documentation-only handover
head. After run 35495121351 completes, inspect actual job/step logs, test counts,
skips, Tauri build-hook behavior, package smoke/security results, lightweight evidence
and absence of the opt-in package artifacts. If it passes, update the ledger/CURRENT/
HANDOVER to `review_ready` and stop for independent review. If it fails, record the
failure and perform only a demonstrated CI-SIMPLE correction; a changed implementation
candidate requires its own justified matrix. Do not merge or delete branches.

Candidate and this awaiting-CI record are published on the branch. PR #12 remains
abandoned and untouched; no private state, application feature or automatic watcher
was introduced.
