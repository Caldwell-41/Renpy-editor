# ADR 0023: GitHub Issues own delivery

- Status: Accepted
- Date: 2026-11-10
- Supersedes: ADR 0019 (task briefs and evidence ownership) and ADR 0020 (Phase 3B
  in GitHub Issues)

The repository kept project state in CURRENT and HANDOVER, scope in task briefs and
results in evidence ledgers. By November 2026 those files held about 7 MB of text.
Agents had to search old instructions to find current work, and every handoff
rewrote status documents. Phase 3B had already moved to GitHub Issues under ADR 0020
and worked well.

All work now follows that model. Issues own scope, acceptance criteria, decisions and
results. PRs own work in progress and its evidence. The code owns behavior. The
repository keeps only lasting material: canonical behavior docs, ADRs that pass the
hard-to-reverse, surprising and real-trade-off test, the glossary, testing runbooks,
the incident index and design approval records. The status, task, audit, research
and dependency folders are deleted. Their final contents remain at the
`archive/docs-ledgers-2026-11` tag, so existing links keep working.

Copying the ledgers into issues was rejected. Most of the content is finished
receipts, and it would bury the open work. Closing an issue means accepted;
outstanding human or native acceptance gets its own issue.
