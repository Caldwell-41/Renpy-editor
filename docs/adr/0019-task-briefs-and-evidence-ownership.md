# ADR 0019: Task briefs and evidence ownership

- Date: 2026-10-22
- Status: Accepted documentation workflow
- Scope: Agent instructions, task briefs, supporting references and execution evidence

## Context

The Phase 2 task reached about 86,800 words and Phase 3 about 37,100 words.
Requirements, dated attempts, artifact audits and superseded continuation prompts
share the same files. An agent must search historical instructions to establish
current work. Shared decisions also appear in several briefs and status records.

WORKFLOW previously assigned both the implementation plan and execution ledger to
active task files. Compact CURRENT and HANDOVER records alone cannot prevent that
growth. The user selected a documentation ownership change after a repository
review using writing-for-agents.

## Decision

Separate current instructions from execution evidence. A task brief owns its current
outcome, scope, acceptance criteria, applicable constraints, unresolved work and
next action. Keep a concise acceptance summary with direct links to supporting proof.
Detailed attempts, validation receipts, artifact inventories and superseded directions
belong in a linked task evidence file. Their original outcomes and limits remain intact.

Disclose substantial requirements by independently selected branch when that helps
an agent retrieve only the relevant contract. Each requirement has one current owner.
Phase briefs route to those owners; canonical technical documents retain lasting
behavior. A link states when the agent needs its target. Historical evidence is
consulted for a matching diagnosis, result reuse, recovery detail or requested audit.

Keep CURRENT as the project overview and HANDOVER as the live continuation and
recovery record. Replace superseded live instructions instead of accumulating them.
Required validation and unresolved failures remain visible in the brief even when
the detailed proof moves elsewhere. Relocation does not change acceptance, authorize
execution or renew an allowance.

## Consequences and alternatives

Agents can read the selected contract without loading its entire execution history.
Separate files add navigation and link maintenance, so use one evidence file per
substantial outcome initially. Small tasks can keep a short result in their brief.
File counts and word counts are review signals rather than acceptance gates.

Keeping every receipt in the brief preserves proximity but obscures current scope.
Deleting history or relying only on expiring CI artifacts would lose failure and
qualification evidence. Creating one file per command or run would add navigation
without a useful task boundary. This decision preserves useful evidence behind
conditional pointers and keeps raw logs and private artifacts outside Git.

## References

[WORKFLOW](../WORKFLOW.md#task-briefs-and-supporting-files) owns maintenance rules.
[Evidence guidance](../testing/EVIDENCE.md) owns technical retention and diagnosis.
The [documentation task](../tasks/active/agent-documentation-ownership.md) owns the
migration scope, preservation review and verification results.
