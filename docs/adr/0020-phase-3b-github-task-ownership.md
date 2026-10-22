# ADR 0020: Remaining Phase 3B delivery in GitHub Issues

- Date: 2026-10-22
- Status: Accepted scoped workflow; effective when the published parent cutover receipt is recorded
- Scope: Remaining Phase 3B delivery ownership only

## Context

ADR 0019 separates current briefs, approved requirements, detailed evidence and
live status. The user requested a reviewed docs-to-GitHub migration for the
remaining 3B work after narrow source/runtime and Help functional qualification.
Full visual authoring and acceptance remain pending. Earlier execution selections
and their limits must survive migration.

## Decision

Once explicitly approved and cut over, the 3B GitHub parent owns remaining delivery
coverage, dependencies and aggregate acceptance. Its 11 B groups own aggregate
requirement acceptance; selected L work tickets own bounded execution, delivery
acceptance and the one current allowance record for the authorized problem. This supersedes
ADR 0019's local execution-brief ownership only for remaining 3B work.

Approved product requirements and pinned design decisions stay in their repository
contracts. Detailed evidence, failures, candidate/artifact provenance and historical
allowances stay in repository evidence. CURRENT and HANDOVER retain project state
and live recovery, linking the selected issue. Canonical docs own lasting behavior.
Other phases retain ADR 0019 without migration. The parent holds the live requirement
coverage and acceptance map; the repository audit remains a dated migration baseline.
Ownership takes effect only after all issues/dependencies verify, the reviewed
ownership commit is published and a parent receipt names the issue URLs and commit.
If tracker access fails, preserve local work and resume when access returns; no
offline snapshot system or parallel task record is introduced.

Issue creation, readiness or closure does not authorize implementation or establish
acceptance. Preserve all existing execution limits and product/publication boundaries.
WORKFLOW's 3B subsection defines entry, completion and unavailable-tracker handling.

## Consequences and alternatives

GitHub supplies one dependency/backlog view and bounded execution tickets. Required
tracker access and cross-links add maintenance. Keeping approved requirements and
evidence in the repo preserves reviewable history and avoids moving private artifacts
or relying on expiring CI downloads. Copying complete local briefs into issues would
create competing owners; moving all historical evidence would lose context and exceed
the selected 3B scope.

## References

[Parent](https://github.com/Caldwell-41/Renpy-editor/issues/22), [WORKFLOW](../WORKFLOW.md#phase-3b-github-task-ownership),
[ADR 0019](0019-task-briefs-and-evidence-ownership.md),
[migration audit](../tasks/reference/phase-3b-github-migration-review.md).
