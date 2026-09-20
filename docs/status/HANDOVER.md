# Current checkpoint handover

**Prepared:** 2026-09-20.
**Repository:** `Caldwell-41/Renpy-editor`.
**Selected checkpoint:** [CI-SIMPLE only](../tasks/active/ci-simple-cleanup.md).
**State:** Approved scope; implementation not started.
**Baseline:** Current remote `main`, including this documentation publication.
**Implementation branch:** `maintenance/ci-simple-cleanup`; create from current main only if no matching branch/PR exists.

## Start here

Read AGENTS.md, [CURRENT](CURRENT.md), [WORKFLOW](../WORKFLOW.md) and the CI-SIMPLE brief. Inspect actual refs and preserve unrelated work. The inspected main before this publication was `7d634eeaf53fe0244a2739f26914797ca16ef544`; that is historical context, not an instruction to reset or use stale main.

Use a new chat and the simple-cleanup branch. Do not reuse or merge `maintenance/ci-optimisation` / PR #12. If the old checkout has uncommitted work, preserve it and use a separate worktree/checkout rather than resetting it.

## Abandoned work

The user explicitly abandoned W0 and OPT-1A, including all later corrections and Windows/SQLite acceptance work. W1-W3 are not proceeding and OPT-2B is deferred. The [decision record](../tasks/active/ci-optimisation.md) overrides old branch-local instructions to resume CI acceptance, initialise a private client or investigate runtime control. Existing reports remain historical evidence; no completion or capability pass is claimed.

Do not start W0 recovery, fix the old journal, install a watcher, manipulate goals or import PR #12 as a prerequisite. Do not delete its branch or any private state. Updating docs does not stop a running external agent; no such stop is claimed here.

## Delivery and return point

Implement only the bounded workflow/documentation cleanup in the brief. Self-review once, run cheap checks first, and obtain the one scope-justified native production validation without duplicate dispatches. Inspect actual results and report skips/unavailable work honestly.

Publish a narrow branch/PR and update the CI-SIMPLE ledger, CURRENT and this handover. Stop at `review_ready` for independent review; do not merge or delete branches. If CI remains pending, record exact run/attempt/SHA and publish `awaiting_ci`, then stop model polling. An actual blocker is also a valid return point. Do not create more optimisation milestones to finish this checkpoint.

This handover publication is documentation only; no CI-SIMPLE implementation or new native acceptance is recorded.
