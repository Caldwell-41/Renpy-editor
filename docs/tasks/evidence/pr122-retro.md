# PR 122 retrospective

PR #122 delivered shared arithmetic and merged as `fab85c16`, with tested tree
equivalence to `18260b15`. This retrospective covers implementation, review and
correction work on 2026-11-09 and 2026-11-10. The candidates below improve future
agent runs, in severity order. The strongest remaining gap is automatic execution
of the existing Rust arithmetic regressions.

Primary sources are the [implementation session](<t3-thread://v2/c95d26c7-af8c-4ab0-8c95-a45fdca2dfe6/2d64db8c-1e26-490f-be8a-676a829cb5f6>),
the [review and correction session](<t3-thread://v2/c95d26c7-af8c-4ab0-8c95-a45fdca2dfe6/5b8512a1-689a-4915-a54d-f0d7302d1516>),
the [archived delivery record](../archive/2026-11-10-shared-arithmetic.md),
the [review evidence](arithmetic-review.md) and
[PR #122](https://github.com/Caldwell-41/Renpy-editor/pull/122).
Check wiring and live documentation were inspected at closeout `67ee24a6`.

## High priority candidate for automatic Rust checks

The later review found four distinct defects after automatic CI had passed:
customized helpers remained editable, Story and Screens no-ops rewrote source,
and decimal transport lost negative zero. The
[correction record](arithmetic-review.md#audited-terra-findings-and-sol-corrections-2026-11-10)
retains their reproductions and focused regressions.

[Repository quality](../../../.github/workflows/quality.yml) already runs frontend
tests, every discovered browser/dispatch fixture, formatting and selected Rust Help
groups. Building all examples does not run Rust unit tests. Its Cargo test filters
do not select `scene::tests::arithmetic` or the Screens action regressions. Those
tests have local evidence, but their automatic CI coverage remains incomplete.

Wire the existing arithmetic and offline Screens action tests into the current
code-check job. Include the two existing UI-source preflights. Keep SDK-backed
tests explicitly excluded and reuse the shared Cargo result gate. These tests
already exist in [Story arithmetic](../../../app/src-core/src/scene/tests/arithmetic.rs),
[Screens actions](../../../app/src-core/src/screens/action_tests.rs) and
[runtime preflights](../../../app/src-core/src/screens/action_runtime_tests.rs).
Add no parallel test framework or broad SDK matrix.

Completion means CI reports positive named results for those groups and rejects
zero-test selections. This protects the corrected cases against recurrence;
running the earlier test set would not necessarily have found every original bug.

## Medium priority candidate for acceptance ownership

The delivery record excluded full Combined workspace implementation at entry,
while #96 still required Tracks/Reel and cross-view draft retention. Final review
raised this as P4 after the UI slices had been integrated. Kris then approved
the [explicit transfer to #110](arithmetic-review.md#approved-workspace-ownership-split-2026-11-10).
The resolution was correct, but it arrived late.

At substantive task entry, map each acceptance group to its implementation owner
and prerequisites before selecting the first slice. Resolve a criterion assigned
to an excluded or unselected owner at that point. Keep the map in the existing
task or issue, with one short retrieval instruction in
[workflow entry](../../WORKFLOW.md#goal-entry-and-continuation). Ownership requires
judgment; it does not belong in a syntax linter or another global AGENTS rule.

Completion means each criterion either belongs to the selected work, names a real
blocking prerequisite, or has an explicit approved transfer. Ticket closure then
uses that same map.

## Medium priority candidate for local toolchain selection

The first correction pass hit Python's missing `tomllib`, then passed the unchanged
test with Python 3.12. The later default-validation pass hit system Python 3.9.6
again. Its local Node/npm versions also differed from the package pins. These are
recorded under [correction verification](arithmetic-review.md#verification-and-retained-attempts)
and [default validation](arithmetic-review.md#variable-default-validation-follow-up-2026-11-10).

The Python requirement is already in [app setup](../../../app/README.md#local-checks)
and CI already checks it. The Windows probe DOM test accepts `HARNESS_PYTHON`, but
otherwise selects `python3` on this Mac. Repeating the requirement in AGENTS would
leave that execution path unchanged.

Add a small local check entry that verifies the package's Node/npm pins and the
selected Python before starting the suite. Use `HARNESS_PYTHON` consistently and
report the required selection when it is unsuitable. Reuse an installed compatible
interpreter; machine-wide runtime replacement is unnecessary.

Completion means an unsupported interpreter fails before test compilation with an
actionable message, and the supported selection runs the unchanged probe test.

## Low priority candidate for live documentation size

After closeout, CURRENT contains about 4,800 words and HANDOVER about 8,400.
[Status maintenance](../../WORKFLOW.md#status-document-maintenance) already asks
for roughly 200–400 and 600–1,200 words respectively, while preserving necessary
recovery facts. Both live files retain many historical outcome sections.

Apply the existing policy: keep accepted baseline, active work and recovery facts
in the live records, and replace completed narratives with pointers to their
existing owners. Preserve unique evidence and repair inbound anchors. The arithmetic
ledger's archive in PR #123 already makes part of this correction; do not archive it
again or add another length rule or validator.

Completion means task entry can read the current state and continuation without
loading the old outcome narratives. Any remaining excess should identify the
recovery facts that require it.

## Corrections already present

Automatic checks caught the obsolete default-editor smoke caller and later fixture
assumptions. Those callers were migrated, so they do not justify new duplicate
smoke tests. The controls now use the shared validation helper, and regression tests
cover the reported validation and draft failures. The SDK fixture now binds narration
destinations and requests interaction refresh; its failed attempts remain evidence.

There is an existing CI guardrail. This retro proposes wiring its missing Rust
coverage, rather than adding generic lint instructions. No new coding-standards
document or global AGENTS expansion is warranted by these findings.

The retrospective adds this report only. The environment changes above remain
candidates for selection.
