# Agent documentation ownership evidence

Migration and review dated 2026-10-22. The [task brief](../active/agent-documentation-ownership.md)
owns current acceptance. Read this record to audit the split, inspect preservation
decisions or assess later documentation changes. This record grants no application,
SDK, CI, native, model or publication allowance.

## Source and migration boundaries

The migration started from clean local commit
`cf4540de1545de93f2bc534812d1176623e47d2c` on
`codex/phase3b-screen-designer`. The user selected work on that branch and up to
three non-conflicting workers. Phase 2, Phase 3 and the two supporting briefs had
separate owners; the parent integrated shared policy, status and inbound links.

| Original brief | Original lines / words | Current brief lines / words | Disclosed material |
| --- | --- | --- | --- |
| [Phase 2](../active/phase-2-initial-llm-assistance.md) | 9,508 / 86,769 | 82 / 616 | [Requirements](../reference/phase-2-requirements.md), [shared delivery](../reference/phase-2-3-delivery.md), [execution evidence](phase-2-execution.md) |
| [Phase 3](../active/phase-3-initial-wysiwyg-release.md) | 3,796 / 37,050 | 93 / 871 | [Shared contracts](../reference/phase-3-shared-contracts.md), branch-specific Story/Screens/Timeline/state/release references linked from the brief, [historical evidence](phase-3-history.md) |
| [CI reliability](../active/ci-harness-reliability.md) | 1,080 / 9,075 | 72 / 554 | [Accepted deliverables, failed attempts and terminal audits](ci-harness-reliability.md) |
| [Walkthrough redesign](../active/walkthrough-redesign-implementation.md) | 930 / 9,132 | 148 / 1,566 | [Historical selections, execution and model-load amendment audits](walkthrough-redesign-implementation.md) |

The walkthrough brief remains above the soft 1,000-word review target. Its live
deliverables, pending proof, distinct counters and protected-session boundaries
justify that length. Removing those facts or creating another mandatory reference
would weaken continuation. The other briefs disclose independently selected branches.

## Preservation and authority review

Workers partitioned the original source into current requirements and historical
evidence, with explicit destination maps. All 250 original Phase 2 heading fragments
and 60 Phase 3 fragments have stable destinations. Supporting-task mappings relocate
34 CI and 15 walkthrough headings; retained acceptance headings stay in their briefs.
The parent repaired 127 moved-section links across 31 Markdown files. Accepted ADRs
and older archived records received reference-only link repairs.

Independent comparison against the source commit found no missing exact full
candidate, binary or archive hash across any migrated task. Source-line comparisons
allow repaired link destinations, whitespace and historical blockquote prefixes.
Reviewed wording changes comprise equivalent titles, superseded routing/worker
instructions and current brief/evidence ownership. The Phase 2 and Phase 3 evidence
files preserve superseded substantive wording where current references changed it.
No unique failure, consumed attempt, acceptance condition or recovery fact was
removed. Historical status words and next prompts are explicitly historical.

Review caught the walkthrough's former 8,192-token default competing with the later
16,384 default. Its brief now identifies the later Phase 2 owner, preserves authored
saved limits and default-on Thinking, and uses draft GET Connect before model choice
and Save. The model-loading amendment takes precedence over older strict-default
wording. The current Phase 2 reference also points to approved Mac signing policy
and co-locates the later card/Lorebook design owners with the retained schema rules.

A separate read-only integration review found no lost acceptance gate, renewed
budget or new execution authority. It identified live closure instructions still
using the ambiguous phrase "task ledger". Those instructions now name the current
brief and linked evidence. Native/real Studio and Phase 2/3A human acceptance remain
pending; this migration does not requalify the application or expired artifacts.

The parent replaced repeated completed-audit detail in CURRENT/HANDOVER with owner
links. The entire original HANDOVER section "Native recovery and remaining
acceptance" remains byte-for-byte unchanged, including signed-package hashes,
protected-window handling, fixture identity, remaining sequence and counters.

## Verification result

This subsection records the initial documentation-only migration. The validator
follow-up below has its own code and regression results.

Local repository structural, relative-link and privacy validation passes. A separate
Markdown section-link audit reports no unresolved fragments. It also checked every
explicit Phase 2/3 relocation destination. Two baseline section-link defects were
resolved during integration: ROADMAP's obsolete Phase 2 pause pointer now reaches
the current brief, and a historical restart pointer reaches live HANDOVER.

Whitespace, changed-path scope and new Markdown file checks pass. All changed/new
repository files are Markdown. The parent and worker preservation reviews account
for all four original briefs and retain exact candidate identities. Raw comparison
scripts and diagnostic reports stay outside Git. No application build, native launch,
SDK run, model request or CI dispatch was performed for this documentation outcome.

Work remains local and uncommitted on the original branch. Publication was not selected.

## Selected follow-up and review

The user selected all five subsequent suggestions on 2026-10-22, with the existing
agents available. Work remained on the same branch and preserved the earlier
uncommitted split. This follow-up includes repository-validator code and existing
preflight-step changes; it grants no application/native/SDK/model operation.

The shared Phase 3 reference now routes implementation facts to canonical
architecture, data, UI and ADR owners. It no longer describes the old flat-Beat,
schema-v2 inspection as current implementation. Story distinguishes its historical
image from its qualified technical subset. Original inspection and proposal blocks
remain in [historical evidence](phase-3-history.md#historical-phase-3-inspection-and-proposal-wording).
The app README describes the workspace and links CURRENT for phase state.

The [ADR index](../../adr/README.md) now covers all 19 records in one table.
Decision maturity remains distinct from delivery/native qualification; superseded
and proposed scope is explicit. No accepted ADR body changed in this follow-up.
The optional [task template](../TEMPLATE.md) uses the existing brief/evidence rules,
with scope, authorization, acceptance/results and continuation fields. WORKFLOW
and INDEX link it for substantial tasks; small tasks retain a short-record option.

Policy consolidation removed 366 words across AGENTS, TESTING and EVIDENCE.
The root project-invariant block, technical minimum-gate table and associated
coverage paragraph, technical retention requirements and old section anchors remain
unchanged. Conditional links route host/cadence, diagnosis, budget and wait policy
to their existing WORKFLOW owners. The owner mapping was reviewed before closure.

## Permanent link-gate results

The existing repository validator now checks local Markdown heading fragments,
same-document links, explicit named anchors and inline/reference destinations.
It handles the repository's heading forms, repeated names, Unicode, URL encoding
and Markdown escapes. Fenced/indented examples, inline code and HTML comments are
excluded from link targets. Existing structural, privacy and secret checks remain.

The first nine fixtures demonstrated seven expected failures with the old checker,
including acceptance of a removed section and incorrect handling of illustrative
links. After implementation, an independent review identified nested-list links
being hidden as code, escaped filenames retaining backslashes and inline-code
heading text being stripped. Focused corrections and regressions cover all three.
A further fixture preserves real links after literal comment markers inside code.

All 13 standard-library regression tests pass, including the validator's actual
nonzero exit for a removed section and success after restoring it. Full repository
validation passes with permanent fragment checking. The same suite is wired into
the existing Repository quality validation and production-scaffold preflight jobs;
their triggers, selectors and package/native steps are unchanged. Local actionlint
passes for both changed workflows. No remote CI result is claimed or required for
this local maintenance closeout, and no workflow was dispatched.

The final read-only review confirms the three findings are resolved and reports no
material blocker. Whitespace, scope and preserved native recovery checks pass.
Product and native/human acceptance remain with their original owners. The initial
migration and this follow-up remain local. On 2026-10-22 the user selected separate
local commits for this maintenance and the Phase 3B review/canvas requirement records.
The pre-commit check passes all 13 validator regressions, repository validation across
837 files and whitespace checks. No push, native run or CI dispatch was selected.
