# Complete PR CI validation

## Selected outcome

Kris authorized a new branch after PR #72 merged, implementation of complete PR
CI reporting and agent instructions, and cheap dummy CI verification. Work starts
at parent `58dfae4` on `codex/ci-validation`, targeting
`codex/phase3b-screen-designer`. The unrelated untracked audit is preserved.
No SDK, helper, package or native qualification is selected. There is no T3 code
change or authorization to merge this implementation.

## Acceptance and current result

- One required PR status accounts for automatic quality and explicitly selected
  manual qualification at the current candidate. Implemented; live proof pending.
- Missing, skipped, failed, cancelled and stale required results cannot establish
  success. Fourteen focused coordinator tests pass locally.
- Existing tests, logs, artifacts and costly-operation guards retain ownership.
  Workflow lint and the existing Q1 selector/source audit pass locally.
- Agent waiting rules distinguish T3 from Codex desktop and require an evidence
  audit after CI. Documentation prepared; final review pending.
- Cheap live dummy CI proves pending, intentional failure and success, with actual
  T3 delivery assessed separately. Pending publication and dispatch.

[The technical runbook](../../testing/CI-VALIDATION.md) owns plan selection,
reporting semantics, diagnosis and rollout. This brief owns delivery state and
will link live PR/run receipts after publication. Existing Phase 3B acceptance and
costly-operation limits are unaffected. Next: focused verification, review, publish
and test the combined required status.
