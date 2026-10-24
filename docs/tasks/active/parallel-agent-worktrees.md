# Parallel agent worktree policy

## Outcome and authorization

On 2026-10-22 the user requested parallel agents in separate worktrees and removal
of the repository-wide single-writer restriction during CI. This documentation-only
outcome starts at `7e1e7b3` on `codex/phase3b-screen-designer`, with Mac ARM64 as the
development host. State: `accepted` for the documentation policy change.

[WORKFLOW](../../WORKFLOW.md#parallel-agents-and-worktrees) owns the resulting policy.
Align the agent entry point, Phase 2/3 delivery references and the live
[P3B parent](https://github.com/Caldwell-41/Renpy-editor/issues/22). Preserve existing
task selections, model/team limits, dependencies, evidence and consumed allowances.
No product, build, SDK, CI, native or watcher operation is selected. Repository edits
stay local; only the matching GitHub parent policy wording is selected for publication.

## Acceptance and results

- Separate worktrees/branches permit parallel implementation, with one coordinator
  and one writer per worktree/branch. Shared contracts, mutable resources, integration
  and retirement have explicit owners. Result: complete in WORKFLOW; agent entry and
  Phase 2/3 references point to that owner. Branch creation permits assigned worktrees.
- CI results retain run/attempt/SHA/input identity. The watching chat yields under
  ci-watch while other assigned worktrees may continue. Result: complete; scoped
  review against the installed ci-watch skill preserves registration/yield/audit rules.
- Current entry points, delivery references and P3B agree. Historical selections and
  protected native recovery remain intact. Result: complete; P3B read-back matches the
  scoped replacement, with all other body text and title/state/labels/assignees and
  parent/sub-issue/dependency summaries unchanged. Existing CURRENT/HANDOVER sections,
  including the entire native recovery section, are byte-for-byte unchanged.
- Repository structure/privacy/links, scoped preservation review and whitespace checks
  pass. Result: `python3 scripts/validate.py` passes for 856 repository files and
  `git diff --check` passes. No application or watcher qualification is inferred.

## Allowance and next action

Original limits are 3 local preparation/edit/validation/review passes and 2 GitHub
body updates. Contingency adds 1 of each; absolute ceilings are 4 and 3. The basis is
seven Markdown files and one live parent policy correction, with room for an in-scope
correction and final read-back. Failed or uncertain attempts remain charged. All
product/runtime/CI limits are zero for this outcome; historical allowances stay closed.

Final cumulative use is local passes 3/3, including preparation, failed local
search/gh reads, review corrections and final checks; GitHub updates 1/2. No
contingency was used. The gh CLI could not reach GitHub; the connected GitHub tool
completed the scoped parent update and verified read-back. All runtime counts stay zero.

On 2026-10-24 the user authorized committing and pushing the seven repository
documentation files on the current branch. This publication continuation is bounded
to one preparation/validation/publication pass, with no new runtime allowance.
It supersedes the original local-only publication scope above. P3B's policy wording
is already published; no further tracker update is selected. Completion requires
the documentation validator, whitespace check and verified remote commit.

No required policy implementation remains pending. CURRENT/HANDOVER remain above
their soft length targets to preserve qualified results, consumed allowances and
protected recovery; this narrow update retains those sections in full. A later
implementation needs its own selection under the existing rules.
