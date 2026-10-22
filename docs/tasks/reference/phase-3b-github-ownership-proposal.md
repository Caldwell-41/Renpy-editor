# Phase 3B ownership change proposal

Unapplied ownership changes with user-confirmed migration design, 2026-10-22. The
[audit](phase-3b-github-migration-review.md) and
[issue bodies](phase-3b-github-issue-drafts.md) form the proposed publication payload.
Existing instructions remain in force. This file does not override them.

The user approved finalizing the review draft after the migration interview and
required B07 to include a grill-with-docs session. Publication, push, ownership
cutover and product implementation remain outside that approval.

The user approved the [to-tickets refinement](phase-3b-ticket-sizing-review.md):
27 work tickets beneath the 11 outcome groups, with the start edges and no further
changes. This manifest includes its six-file baseline, 39 issue URLs and selected-leaf
execution wording. Publication and ownership cutover remain unapproved.

`P3B_URL`, `B01_URL` through `B11_URL`, and `L01_URL` through `L27_URL`
stand for actual GitHub issue URLs
assigned at publication. Replace them before applying any text. The issue drafts
also need pinned repository URLs before publication; relative links from these
local review files cannot be pasted unchanged into GitHub Issues.

The remote branch was observed at `6fb39f7`, behind local commits `0a6f933` and
`cd18b2a`. The user selected naming those complete existing commits, the migration
drafts and the required tracker guide in the final publication review. This settles
the plan only. Publication remains unapproved. The broader existing maintenance
payload remains distinct from the proposed 3B ownership delta.

## Publication manifest

The proposed destination for the prerequisites and ownership commit is
origin/codex/phase3b-screen-designer, by ordinary fast-forward. Recheck remote state
before publication. Exclude unrelated local agent changes from new commits.

### Existing committed prerequisites

Commit `0a6f933b1aec6cf37f5478ef83b8dba6c32f5169` is the existing 59-path
documentation/validator maintenance payload. Its complete manifest is:

```text
M .github/workflows/production-scaffold.yml
M .github/workflows/quality.yml
M AGENTS.md
M README.md
M app/README.md
M docs/ARCHITECTURE.md
M docs/DATA_MODEL.md
M docs/INDEX.md
M docs/PRODUCT.md
M docs/PROMPTS_CONTEXT.md
M docs/REFERENCE_LIBRARY.md
M docs/ROADMAP.md
M docs/TESTING.md
M docs/UI.md
M docs/WORKFLOW.md
M docs/adr/0011-ai-settings-secrets-and-reference-storage.md
M docs/adr/0013-provider-request-and-transport-contract.md
M docs/adr/0014-typed-conditions-and-recursive-source-ownership.md
M docs/adr/0015-guarded-choices-and-stable-call-continuations.md
M docs/adr/0016-explicit-body-story-authoring.md
M docs/adr/0018-early-screen-source-proof.md
A docs/adr/0019-task-briefs-and-evidence-ownership.md
M docs/adr/README.md
M docs/design/character-workspace-2026-10-15/walkthrough-decisions.md
M docs/design/design-lab-screens/README.md
M docs/design/phase-2-llm/README.md
M docs/design/phase-2-llm/studio-refinement-2026-10-13/README.md
M docs/design/phase-3-story/README.md
M docs/status/CURRENT.md
M docs/status/HANDOVER.md
A docs/tasks/TEMPLATE.md
A docs/tasks/active/agent-documentation-ownership.md
M docs/tasks/active/ci-harness-reliability.md
M docs/tasks/active/phase-2-initial-llm-assistance.md
M docs/tasks/active/phase-3-initial-wysiwyg-release.md
M docs/tasks/active/walkthrough-redesign-implementation.md
M docs/tasks/archive/2026-10-06-phase-1g-acceptance-handover.md
M docs/tasks/archive/2026-10-09-phase-2-execution-history.md
M docs/tasks/archive/2026-10-16-testing-reference.md
A docs/tasks/evidence/agent-documentation-ownership.md
A docs/tasks/evidence/ci-harness-reliability.md
A docs/tasks/evidence/phase-2-execution.md
A docs/tasks/evidence/phase-3-history.md
A docs/tasks/evidence/walkthrough-redesign-implementation.md
A docs/tasks/reference/phase-2-3-delivery.md
A docs/tasks/reference/phase-2-requirements.md
A docs/tasks/reference/phase-3-shared-contracts.md
A docs/tasks/reference/phase-3a-story.md
A docs/tasks/reference/phase-3b-screens.md
A docs/tasks/reference/phase-3c-timeline.md
A docs/tasks/reference/phase-3d-state-run.md
A docs/tasks/reference/phase-3f-release.md
M docs/testing/AUTOMATED.md
M docs/testing/EVIDENCE.md
M docs/testing/INCIDENTS.md
M docs/testing/NATIVE.md
M docs/testing/SDK-RUNTIME.md
A scripts/test_validate.py
M scripts/validate.py
```

Commit `cd18b2a1e4c59ae23f17bb7e917065b8fea02c2a` is the existing seven-path
3B review/canvas-requirement payload:

```text
M docs/UI.md
M docs/status/CURRENT.md
M docs/status/HANDOVER.md
M docs/tasks/active/help-screen-production.md
M docs/tasks/active/phase-3-initial-wysiwyg-release.md
M docs/tasks/evidence/help-screen-production.md
M docs/tasks/reference/phase-3b-screens.md
```

Together these commits affect 61 unique paths. Publishing the recorded branch
publishes both complete commits; it cannot silently publish only their 3B portions.

### New non-owning baseline

Publish these six new files only after explicit publication approval:

```text
docs/agents/issue-tracker.md
docs/tasks/reference/phase-3b-github-issue-drafts.md
docs/tasks/reference/phase-3b-github-migration-review.md
docs/tasks/reference/phase-3b-github-ownership-proposal.md
docs/tasks/reference/phase-3b-ticket-sizing-review.md
docs/tasks/reference/phase-3b-vertical-ticket-drafts.md
```

The tracker guide is the currently reviewed file, unchanged at this step. It has
no dependency on the untracked domain or triage guides. Existing ownership remains
in force. Exclude docs/agents/domain.md, docs/agents/triage-labels.md and the current
uncommitted AGENTS.md Agent skills additions. At the later cutover, stage only the
approved 3B instruction changes, retaining unrelated local edits unstaged.

### Issue and ownership cutover payload

Publish P3B, its 11 outcome groups and all 27 work tickets, their primary-parent
relationships/work-ticket start dependencies, and the live parent coverage map from
the reviewed drafts. Resolve aliases and use pinned
published repository links. The later ownership commit contains only the 11 paths
specified below: AGENTS.md, docs/agents/issue-tracker.md, docs/WORKFLOW.md,
docs/adr/0020-phase-3b-github-task-ownership.md, docs/adr/README.md,
docs/tasks/reference/phase-3b-screens.md,
docs/tasks/active/phase-3-initial-wysiwyg-release.md,
docs/tasks/active/help-screen-production.md, docs/status/CURRENT.md,
docs/status/HANDOVER.md and docs/INDEX.md. Reconcile ADR numbering before application.

After issues/dependencies and the published ownership commit verify, record one
cutover receipt in the parent with all 39 issue URLs, their alias mapping, the
ownership commit and verified branch. That receipt makes the change effective.
Until then, the repository docs remain owners. Partial publication is a pending
migration, with no implementation or ownership authority inferred from it.

## Proposed authority split

| Information | Owner after approved cutover |
| --- | --- |
| Approved 3B product requirements, subset, exclusions and user decisions | Existing phase-3b-screens.md, canonical product/UI docs and immutable design approval/captures. Issues reference these decisions. A changed decision updates its product owner with user authorization. |
| Remaining 3B delivery scope, acceptance, dependencies and allowance | The selected L work ticket owns bounded execution and the one current allowance record for its problem. Its B group owns aggregate requirement acceptance. P3B owns coverage, cross-ticket decisions and final acceptance. No parallel local implementation briefs or duplicate allowance records. |
| Exact test runs, failed attempts, artifact/candidate identity and historical allowances | Existing repository evidence files. Add selected new 3B evidence there, or one outcome evidence file when a distinct retrieval boundary warrants it. Issues link concise results. |
| Project state and live recovery | CURRENT and HANDOVER remain owners. Their 3B entries link the selected issue, evidence and allowance, without maintaining a second backlog. |
| Lasting implemented behavior and architecture | Existing canonical docs and new ADRs when warranted. An issue closure does not substitute for updating an affected lasting contract. |
| Other phases and tasks | Existing ADR 0019 and WORKFLOW brief/reference/evidence rules, unchanged. |

This is a migration of remaining delivery ownership. It retains approved product
requirements in the repo and does not relocate raw evidence into GitHub comments.
The following text is the complete proposed ownership delta. Other file content
stays under its present owner.

## Agent instruction edits

### AGENTS.md

In Project and task entry, replace only the final clause
"the selected active task owns scope and acceptance." with:

```markdown
the selected task owns scope and acceptance. For remaining Phase 3B entry or
continuation, follow the effective owner and entry rules under
[3B issue ownership](docs/WORKFLOW.md#phase-3b-github-task-ownership).
```

In Read the relevant reference, replace the Task documentation bullet with:

```markdown
- Task documentation: follow [brief and evidence ownership](docs/WORKFLOW.md#task-briefs-and-supporting-files)
  when creating or updating briefs, requirements or validation records. For remaining
  3B delivery, apply the [GitHub ownership exception](docs/WORKFLOW.md#phase-3b-github-task-ownership).
```

Apply these to the current file without replacing the user's existing unslop,
writing-for-agents or Agent skills additions. No new always-loaded ticket list.

### docs/agents/issue-tracker.md

Replace the existing paragraph beginning "Existing task briefs, requirements,
evidence and status records keep their ownership" with:

```markdown
Existing records keep their ownership under docs/WORKFLOW.md, except for the
approved [remaining Phase 3B delivery migration](../WORKFLOW.md#phase-3b-github-task-ownership).
After the published cutover receipt, read P3B, the relevant B group and selected
L work ticket for 3B execution. The leaf owns bounded acceptance, start dependencies
and the current allowance; its B group owns aggregate acceptance.
Approved product decisions and detailed evidence remain in their repository owners.
Link those records from the issue. Creating, assigning or labelling an issue does
not authorize implementation, publication or renew an allowance.
```

Operations, sub-issue/dependency fallback, wayfinder and PR rules stay as written.
No triage-label or domain-instruction edit is needed. No skill file changes are needed.

## Workflow and decision edits

### docs/WORKFLOW.md

At the end of Task briefs and supporting files, before the explicit
start-of-each-checkpoint-chat anchor, add this subsection. Its scope overrides the active-brief ownership table only for
remaining 3B work. Other workflow rules continue to apply.

```markdown
### Phase 3B GitHub task ownership

After all issues/dependencies verify, the reviewed ownership commit is published
and the parent records its cutover receipt, [the 3B parent](P3B_URL) owns remaining Phase 3B
delivery coverage, dependencies and aggregate acceptance. Its 11 B groups own
aggregate requirement acceptance. The selected L work ticket owns bounded scope,
acceptance, current blocker, selected authorization and the current allowance. Read
P3B, the relevant group and selected leaf for 3B entry, review or continuation.
Follow [the tracker convention](agents/issue-tracker.md).
If tracker access is unavailable, preserve local work, report the access blocker
and resume when access returns. This migration adds no offline snapshot protocol
or parallel task record.

The [Screens contract](tasks/reference/phase-3b-screens.md) and pinned design
approval retain approved product requirements and decisions. Canonical docs/ADRs
own lasting behavior; repository task evidence owns detailed results, failed
attempts, exact candidate/artifact identity and historical allowance use. CURRENT
and HANDOVER retain project state and live recovery, linking the selected issue.
Keep the live requirement-ID-to-outcome/work-ticket and acceptance map in the parent,
with direct evidence links. The repository migration table is a dated baseline. Delivery
reassignment updates the parent; a product requirement change updates its repository
contract and the parent map. Do not create a
second 3B execution brief or copy a full backlog into status files.

Record a newly selected outcome and its finite allowance in its selected work ticket
before execution. Keep one allowance record for the problem; if the authorized
outcome spans leaves, link that record instead of duplicating or resetting counts.
Preserve cumulative use across continuations; failed/cancelled attempts stay charged.
Closed proof/design/Help selections stay closed. No issue state,
label or assignment grants execution, retry or publication authority. Keep the
existing not_started/in_progress/awaiting_ci/blocked/review_ready/accepted meanings;
GitHub open/closed alone does not represent these acceptance states. Close a child
only with its acceptance decision, or an explicit recorded scope disposition.

This exception applies only to remaining 3B delivery, under ADR 0020. The accepted
ADR 0019 split still governs every other task. The Help brief is retained as the
historical selected execution contract; its original results and limits remain
intact. New 3B issues do not renew its allowance or change other phases' entry gates.
```

In Authority and document ownership, append this sentence immediately after the
ownership table:

```markdown
Remaining Phase 3B delivery uses the [GitHub task ownership exception](#phase-3b-github-task-ownership);
the table continues to apply to other work and to 3B product contracts, evidence and status.
```

In Goal entry and continuation, append after the first paragraph:

```markdown
After the published cutover receipt, substitute P3B, its relevant B group and
the selected L work ticket for
the active execution brief, then read only the applicable product contracts and evidence.
```

### New docs/adr/0020-phase-3b-github-task-ownership.md

Reserve the next available ADR number at application time. Proposed complete text:

```markdown
# ADR 0020: Remaining Phase 3B delivery in GitHub Issues

- Date: date of explicit user approval
- Status: Proposed until explicit decision approval; ownership becomes effective only after the published cutover receipt
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

[Parent](P3B_URL), [WORKFLOW](../WORKFLOW.md#phase-3b-github-task-ownership),
[ADR 0019](0019-task-briefs-and-evidence-ownership.md),
[migration audit](../tasks/reference/phase-3b-github-migration-review.md).
```

After approval, record the actual decision date and its pending effective boundary.
The published cutover receipt establishes effectiveness. Use Accepted scoped workflow
status for the approved decision; that status alone does not activate the cutover.
Append this row to docs/adr/README.md:

```markdown
| [0020](0020-phase-3b-github-task-ownership.md) | Accepted scoped workflow | After the published cutover receipt, GitHub owns remaining 3B delivery; approved product requirements, detailed evidence and live recovery retain their repository owners. |
```

Preserve ADR 0019's accepted text and result;
the later ADR records the narrow supersession. If ADR 0020 is occupied, update
every proposed number/link consistently before application.

## Task and navigation edits

### docs/tasks/reference/phase-3b-screens.md

Insert after the title:

```markdown
After the published cutover receipt, [the 3B parent](P3B_URL) and its children own remaining
delivery scopes, acceptance tracking, dependencies and execution allowances.
This reference retains approved product requirements and design decisions.
Read P3B, the relevant B group and selected L work ticket with the applicable
sections here before implementation or
acceptance. The old step map below is traceability, not an independently selectable task.
```

Keep every approved requirement, exclusion, decision date and existing anchor.
Rename only the visible Implementation plan heading to Original implementation step
map, retaining its explicit implementation-plan-1 anchor. Keep the full step table
and add this mapping below it:

```markdown
| Original step | Remaining delivery tickets |
| --- | --- |
| 3B.1 | [Ownership](B01_URL), [source nodes/properties](B02_URL), [actions/effects](B04_URL) |
| 3B.2 | [Assets/reuse](B03_URL), [actions/effects](B04_URL), [editor workflow](B06_URL), [rendering decision](B07_URL), [canvas rendering](B08_URL) |
| 3B.2a | [Story screen connections](B05_URL) |
| 3B.3 | [Dialogue/choice](B09_URL), [menus/preferences/save/load](B10_URL) |
| 3B.4 | [Rendering proof](B07_URL), [canvas comparison](B08_URL), [integrated preview/acceptance](B11_URL) |
```

Do not remove the Help functional result or canvas requirement.

### docs/tasks/active/phase-3-initial-wysiwyg-release.md

In Current state and entry, after "This brief routes Phase 3 scope and acceptance",
insert:

```markdown
After the published cutover receipt, remaining 3B delivery ownership is
[the GitHub parent](P3B_URL) and its children
under [the scoped exception](../../WORKFLOW.md#phase-3b-github-task-ownership).
This brief continues to own cross-phase routing and other Phase 3 branches.
```

Replace only the 3B row's Read when selected cell with:

```markdown
After the published cutover receipt: [parent, outcome group and selected work ticket](P3B_URL), then [approved Screens requirements](../reference/phase-3b-screens.md). Until then, use the existing repository scope and acceptance owners.
```

Replace the first paragraph under Selected Help-screen production outcome with:

```markdown
After the published cutover receipt, the [Help brief](help-screen-production.md)
retains the historical 2026-10-22
execution selection, bounded functional approval and exhausted allowance. Its
evidence remains current for that recorded scope. Remaining editor visual work
belongs to [B06](B06_URL), canvas agreement to [B08](B08_URL), and integrated 3B
acceptance to [B11](B11_URL). Phase 2/3A human acceptance remains pending.
```

Leave other phase state, shared-file ownership, protected recovery and historical
evidence links intact.

### docs/tasks/active/help-screen-production.md

Insert after its title, leaving the original selection and results below intact:

```markdown
Historical execution contract after the published 3B cutover receipt. This selected
allowance is closed and its bounded functional result remains accepted. Read
[the final review](../evidence/help-screen-production.md#orchestrator-final-review-2026-10-22)
for its limits. [B06](B06_URL) owns remaining editor visual delivery,
[B08](B08_URL) owns canvas agreement and [B11](B11_URL) owns full 3B acceptance.
The preserved directions below apply only to their original execution selection.
```

Retain its path/anchors while visual acceptance is open. Do not claim full Help or
3B acceptance, archive unresolved work as complete, or rewrite its consumed limits.

### docs/status/CURRENT.md and docs/status/HANDOVER.md

In each, immediately after the paragraph recording the new canvas requirement and
unchanged allowance, insert:

```markdown
Remaining 3B delivery is mapped in [the GitHub parent](P3B_URL). Existing docs remain
owners until the verified ownership commit is published and the parent records its
cutover receipt. No child is selected for execution. After that receipt, the next
action is selection of a bounded work ticket with its entry gate and finite allowance.
Approved product requirements and detailed evidence retain their repository owners.
```

Retain the functional/visual distinction, exact candidates, counts, publication
limits and all non-3B recovery text. At later selection replace this paragraph with
the actual child and allowance/evidence links rather than append a second live plan.

### docs/INDEX.md

After the paragraph explaining brief/reference/evidence ownership, insert:

```markdown
After the published cutover receipt, remaining 3B delivery uses
[the GitHub parent](P3B_URL), relevant B group and selected L work ticket under
[the scoped ownership rule](WORKFLOW.md#phase-3b-github-task-ownership).
Approved Screens requirements and detailed evidence remain in the repo.
```

Add this table row:

```markdown
| Remaining 3B delivery and acceptance after the published cutover receipt | [GitHub parent](P3B_URL), [approved Screens requirements](tasks/reference/phase-3b-screens.md), [ownership decision](adr/0020-phase-3b-github-task-ownership.md) |
```

Replace the existing Help row with:

```markdown
| Bounded Help functional approval, historical execution and visual limits | [Help outcome](tasks/active/help-screen-production.md), [evidence](tasks/evidence/help-screen-production.md) |
```

## Files retained without an ownership edit

Keep docs/tasks/evidence/phase-3-history.md and help-screen-production.md unchanged,
including unsuccessful attempts, original instructions, consumed allowances and
unique recovery/provenance. Keep approval.json, all 13 flow-v1 captures, comparison
notes and Design Lab source pinned. Keep existing shared Phase 2/3 contracts,
PRODUCT, ROADMAP, UI, DATA_MODEL, ARCHITECTURE, TESTING and technical runbooks under
their current owners. The migration does not change their behavior or acceptance
requirements. Later product work updates lasting contracts when behavior changes.

The review package remains a dated non-owning migration baseline after cutover.
The parent holds the live mapping, acceptance and cutover receipt; no additional
receipt-only documentation commit is needed. Future task status belongs to issues.

## Proposed application and verification sequence

1. Obtain explicit approval for the concrete issue payload and ownership delta.
   Record whether approval includes only issue publication, the local cutover, or
   also a named commit/push destination. Preserve the separate no-implementation boundary.
2. Recheck branch/HEAD, local edits, tracker overlap, ADR numbering and unchanged
   product/evidence sources. Reconcile relevant changes with this audited baseline.
3. With explicit approval of the publication manifest, publish the two existing
   local documentation commits and the six-file non-owning baseline to
   origin/codex/phase3b-screen-designer by ordinary fast-forward. Include only the
   reviewed tracker guide from docs/agents; exclude the unrelated domain/triage
   files and existing uncommitted AGENTS additions. This changes no 3B ownership.
   Verify that every required product/evidence/review link resolves at its pinned
   commit. Without this approved prerequisite, retain the draft locally.
4. Publish P3B, its 11 groups and 27 work tickets from the exact reviewed body
   files with gh --body-file. Set native start dependencies only between work tickets.
   Resolve all aliases, use pinned repository links, establish parent/dependency
   relations and read back every body/relationship. Keep a publication receipt.
   On partial failure retain actual issue IDs and resume the missing operations;
   do not duplicate issues or apply local ownership cutover prematurely.
5. After all issues and mappings verify, apply only the approved documentation and
   instruction text above. Complete cross-link/fragment repairs, record the ADR
   approval, and keep the existing evidence and design files intact.
6. Run repository documentation/privacy/link validation and whitespace review.
   Check all coverage IDs, issue mappings and edges, and compare retained decisions,
   evidence, counts and protected recovery against the baseline. No app, SDK,
   native/package build or CI run is required for this migration.
7. Commit and publish the reviewed ownership delta only if expressly authorized.
   Read back its remote identity and all issue/dependency mappings, then publish the
   parent cutover receipt with the 39 issue URLs, primary-parent mappings and verified work-ticket start edges and ownership commit. Existing docs
   remain authoritative until that receipt. Report the URLs, paths, checks and any
   partial state. Select no product child.

The boundary is explicit because the user requested review before issue publication
or ownership change. This draft finishes the preparation required for that review.
