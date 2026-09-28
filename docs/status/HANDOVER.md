# Current checkpoint handover

**Prepared:** 2026-09-28. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** TEST-AUDIT-1 `review_ready`; documentation/selector audit only.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/conflicting.
**Audited baseline:** `109417800873a464dd7da5f9d9571c00a9f9c447`.
**Main inspected:** `4d7ba0333c48d60242a9a42d3e079fea499a5531`.
Resolve the documentation publication commit from Git; no receipt-only self-SHA commit.

**Authority:** the user selected TEST-AUDIT-1 only: audit live requests/ledger 34,
correct documentation, propose required changes, review/publish and stop.
No test/workflow/product implementation or qualification execution was selected.
The checkout was fast-forwarded through all 14 newer remote commits; the historical
G1-O1 worktree, raw reports and other branches/PRs remain untouched.

## Findings and concrete proposal

Read [the policy/alignment audit](../tasks/active/testing-policy-alignment.md#test-audit-1--selected-documentation-and-selector-audit)
for classifications, exact selectors, retained regressions and cumulative budgets.
[Phase 1G ledger 35](../tasks/active/phase-1g-branches-runtime-git.md#35-test-audit-1--testing-policy-alignment--2026-09-28)
appends the disposition; ledger 34 and earlier evidence are unchanged.

Four persistence-termination parents still run in broad core; the SDK lifecycle gate
embeds two crash-recovery calls and two timed namespace blocks. Production and quality
flow selectors need alignment. Production also selects G1-U2 twice, packages relevant
main pushes, and retains installers only on success. Documentation is corrected;
executable gaps remain. Controlled runtime failure, Stop, ordinary external writers,
Source/drafts, heap-buffer/cancellation and non-crashing recovery stay required.

The [amended Q1 plan](../tasks/active/testing-policy-alignment.md#amended-r2-p1-q1-proposal--not-selected)
stops after preparation before separately selected execution. Q1-PREP separates tests
and markers, preserves successful Prepared abandonment with a non-crashing fixture,
aligns both workflows, makes production manual-only and retains produced binaries on
failure. Q1-EXEC would run one standard Windows/macOS matrix: two package builds, five
runtime cases plus primary/secondary smoke per target, no retries. Neither is selected
by this handover. No diagnostic allowance is renewed or transferred.

## Capability and preserved evidence

| Capability | Implemented | Automated proof | Native/human acceptance |
| --- | --- | --- | --- |
| Branches / G1-OBS | Yes, observed saved-state contract | Selected qualification retained at its candidate | Mac supporting assessment retained; Windows/native and final acceptance open |
| Runtime foundation / R1 | Yes, prior fixes retained | Prior closure retained; final-source regression required | Final package/native acceptance open |
| Runtime UI / R2-P1 | Yes, including Windows heap fix | Coherent standard two-target package qualification incomplete | Final focused user session on both platforms open |

WIN-F1 ledger 27 and MAC-N1 ledger 32 carry forward with their identity/fixture limits,
not as a cross-SHA waiver or reason to repeat diagnostics. TEST-P2 ledger 33 keeps Chrome
timing diagnostic and functional/evidence failures blocking. R2-P1 `36293797731` and H1
`36310107481`, both attempt 1, remain FAIL on their original candidates with missing
evidence. PR conflicts, integration and separately selected integrated 1H remain open.
Optional Git and Phase 2 remain excluded. No operation was started or remains pending
for this audit; another host's unpublished work remains unavailable to inspect.

## Validation, publication and next boundary

TEST-AUDIT-1 was published and remote/PR head verified at
`e5b457f79a0589837940bce3b2533bfb5ea722fc`: eight Markdown files, 274-file repository
validation and 97 relative link/anchor checks passed. Those counts belong to that audit.
No Cargo/npm suite, native build, browser/app/SDK launch or CI is claimed.

The user subsequently requested a Luna-scoped handover. Read the
[Luna execution brief](../tasks/active/testing-policy-alignment.md#luna-execution-brief-for-q1-prep)
for its fixed read/edit boundary, five ordered steps, acceptance checks and stop rules.
**Recommended:** Luna with medium reasoning. Recovery redesign, policy decisions and
qualification are outside that brief; recommend Sol/Astra review of the prepared diff
at the existing pre-execution boundary. No agent has been started or model switched.
This handover amendment does not select preparation implementation. Publish/review this
documentation amendment with `[skip ci]`; resolve its head from Git, not a receipt commit.

**Next proposed selection:** R2-P1-Q1-PREP only. **Codex machine:** any repository-capable
host; no specific OS. **Test execution:** cheap documentation/selector/gate checks only,
no native builds, app/browser/SDK launches or CI; compiled tests remain unexecuted.
**Reason:** source alignment precedes native qualification. Windows x64/macOS ARM64
Actions execution and normal hosted dependencies belong to later Q1-EXEC; reverify
Actions access and repository rules then. No physical test host is promised.

```text
/goal — R2-P1-Q1-PREP only
Repository: Caldwell-41/Renpy-editor
Branch: feature/phase-1g-branches-runtime
Model: Luna, medium reasoning.
Codex machine: Any with repository access; no specific OS required.
Test execution: Cheap documentation/selector/gate checks only; no native builds, app launches or CI.
Reason: Align test/workflow source before qualification.
Read AGENTS.md and docs/status/HANDOVER.md, then the linked Luna execution brief. Implement only its bounded preparation, preserve newer work and required regressions, verify and publish the ledger/handover. Hand back unresolved scope or recovery questions; stop before Q1-EXEC.
```
