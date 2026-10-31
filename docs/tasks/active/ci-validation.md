# Complete PR CI validation

## Selected outcome

Kris authorized a new branch after PR #72 merged, implementation of complete PR
CI reporting and agent instructions, and cheap dummy CI verification.
`codex/ci-validation` targets `codex/phase3b-screen-designer`; parent closeout
`e18f293` is already an ancestor. [PR #73](https://github.com/Caldwell-41/Renpy-editor/pull/73)
owns current-head CI identities and final audit receipts. No merge is selected.
The unrelated audit and protected recovery remain intact.

## Acceptance and result ownership

- One required PR status covers automatic quality and explicit manual qualification.
  Ruleset `26271364` requires `Loomlight validation` on the integration parent only.
  GitHub confirms it is required and blocks the PR until selected CI passes.
- Missing, skipped, failed, cancelled or stale required job results cannot establish
  success. Eighteen focused coordinator tests pass locally and in automatic CI.
- Existing tests, logs, artifacts and costly-operation guards retain ownership.
  Workflow lint, repository/link/privacy validation, Q1 selector controls and ten
  retention cases pass. Automatic CI also passes all 288 frontend tests and Rust
  formatting. No SDK/helper/package/native operation is selected or started.
- Independent Standards review reported one finding; Spec reported two. Missing-job
  finalization and cross-PR identity gaps are corrected with focused tests. The
  reporting-only cancellation boundary is explicit in the technical runbook and
  remains subject to terminal audit.
- Live pending and intentional failure are verified at `aa12658`, including actual
  same-thread T3 failure delivery. The final passing trial and its T3 delivery must
  be checked in the PR's current-head audit before declaring this task complete.
  Final run receipts remain there to avoid a receipt-only commit/retest loop.

[The technical runbook](../../testing/CI-VALIDATION.md) owns plan selection,
reporting semantics, diagnosis and rollout. The implementation changes no T3 code.
Each new PR branch must update the explicit plan; `main` is not configured until
it receives these workflows. Existing Phase 3B acceptance and budgets are unaffected.

## First live experiment, 2026-10-31

Both attempt-1 runs use `aa126589347906589fe9302cf83f97facf246740`:

- [Automatic quality 41205090928](https://github.com/Caldwell-41/Renpy-editor/actions/runs/41205090928/attempts/1)
  is audited successful. Both normal jobs and their executed steps pass, including
  288 frontend tests, Rust formatting, repository validation, thirteen section-link
  cases, eighteen coordinator cases, Q1 controls and ten retention cases.
- At 13:21:38 UTC its finish reporter explicitly reports quality passed while
  Windows dummy qualification is still queued/running. The combined status stays
  pending. This is the previously missing completion distinction.
- [Intentional failure 41205142800](https://github.com/Caldwell-41/Renpy-editor/actions/runs/41205142800/attempts/1)
  fails only at `Expected dummy qualification failure`. Its reporting hooks pass;
  all ordinary and specialist jobs in that manual run are intentionally excluded.
  At 13:22:53 UTC the combined status becomes failure and the PR remains blocked.
- T3's registered PR watcher delivers the failed `Loomlight validation` update to
  this same thread. The agent resumes and audits the exact run, attempt, candidate,
  job outcomes and logs. This proves failure delivery, not yet success delivery.

Original run JSON and logs remain ignored under `.toolchains/ci-validation/`.
An early attempt to download an in-progress log archive returned HTTP 404; the
terminal logs were subsequently retrieved and audited. No run was retried for it.
