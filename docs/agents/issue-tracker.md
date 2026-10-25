# Issue tracker

Engineering-skill tickets and issue specs live in GitHub Issues for
Caldwell-41/Renpy-editor. Use the `gh` CLI from this repository.

Existing records keep their ownership under docs/WORKFLOW.md, except for the
approved [remaining Phase 3B delivery migration](../WORKFLOW.md#phase-3b-github-task-ownership).
After the published cutover receipt, read P3B, the relevant B group and selected
L work ticket for 3B execution. The leaf owns bounded acceptance, start dependencies
and applicable operation limits; its B group owns aggregate acceptance.
Approved product decisions and detailed evidence remain in their repository owners.
Link those records from the issue. Creating, assigning or labelling an issue does
not authorize implementation, publication or additional attempts.

For remaining 3B entry, apply [the standing scheduling exception](../tasks/reference/phase-2-3-delivery.md#standing-phase-3b-scheduling-exception)
and preserve actual ticket blockers and pending acceptance. Once the user selects
a work ticket, apply [WORKFLOW's operation-limit policy](../WORKFLOW.md#5-operation-limits-and-reassessment).
The selected ticket owns any applicable limits; routine work needs no numerical
allowance. Canvas remains deferred until
explicitly selected; exhausted historical allowances remain closed.

## Operations

- Create: `gh issue create --title "..." --body-file <file>`.
- Read: `gh issue view <number> --json number,title,body,labels,comments`.
- List: `gh issue list --state open --json number,title,labels,assignees`.
- Comment: `gh issue comment <number> --body-file <file>`.
- Label: `gh issue edit <number> --add-label "<label>"`.
- Remove a label: `gh issue edit <number> --remove-label "<label>"`.
- Close: `gh issue close <number>`.

For multiline bodies, write the exact text to a temporary file and use
`--body-file`.

When a skill says "publish to the issue tracker", create a GitHub issue.
When it says "fetch the relevant ticket", read the GitHub issue.

## Related tickets

Use GitHub sub-issues for parent-child relationships and native issue
dependencies for blockers. If unavailable, use `Part of #<parent>` and
`Blocked by: #<number>` in issue bodies, with a child task list in the parent.

For wayfinder, use one map issue labelled `wayfinder:map` and child issues
labelled `wayfinder:<type>`. Select unassigned open children with no open
blockers in map order. Claim by assigning yourself; resolve by recording
the answer, closing the child and linking the result from the map.

## Pull requests

PRs as a request surface: no.
