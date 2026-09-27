# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** **R2-P1-Q0** remaining qualification scope review `review_ready`.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/conflicting.
**Reviewed candidate:** `699395de23e27a992d734a9cc920686c16bdc02d`.
**Main:** `4d7ba0333c48d60242a9a42d3e079fea499a5531`.
This docs-only record is published with `[skip ci]`; resolve verified publication
head from Git without a receipt-only commit. No operation is pending.

## Review and proposal

Read [ledger 34](../tasks/active/phase-1g-branches-runtime-git.md#34-r2-p1-q0--remaining-qualification-scope-review--2026-09-27)
for the coverage map and proposed **R2-P1-Q1** execution contract. The user requested
review/proposal only. No workflow/product implementation, CI, build or launch occurred.

Minimum recommended qualification remains both standard packaged targets and all five
existing runtime cases. WIN-F1's local Windows executable had isolation overrides and
no installer packaging; MAC-N1 assessed native macOS responsiveness without SDK/game
execution. Neither fills the coherent-candidate package gaps. Carry their evidence
forward without repeating those diagnostic experiments or inventing an automated
cross-SHA waiver. TEST-P2 keeps Chrome timing diagnostic and functional failures blocking.

The unchanged production workflow embeds deliberate crash/namespace tests, including
inside the ordinary lifecycle SDK gate, despite the later no-aggressive/hostile limit.
Proposed Q1 first separates those specialist exercises, preserves ordinary recovery
and authoring gates, audits exact selectors/markers, and implements a manual-only
expensive-production trigger plus failure-time tested-executable retention. Then one
matrix: one package-build invocation per target, five runtime cases plus the two-start
legacy boundary smoke per target; no automatic retry. Exact evidence and acceptance
conditions are in the ledger. These changes and execution are **not yet approved**.

## Preserved evidence and remaining work

- [WIN-F1 ledger 27](../tasks/active/phase-1g-branches-runtime-git.md#27-r2-p1-win-f1-sdk-hashing-stack-correction--2026-09-27): heap fix, six SDK checks and five local scenario passes. Three of four build allowances used; unused allowance is not a new authorization.
- [MAC-N1 ledger 32](../tasks/active/phase-1g-branches-runtime-git.md#32-r2-p1-mac-n1--independent-packaged-responsiveness-assessment): package `22fbf65d1c9db712d574657c53638b413436dee8`, M4 WKWebView first/second-rAF p95 17/34 ms; native observations and all measurement/procedure limits retained. All allowances exhausted. Raw evidence under ignored `.toolchains/reports/r2-p1-mac-n1/`.
- [TEST-P2 ledger 33](../tasks/active/phase-1g-branches-runtime-git.md#33-r2-p1-test-p2--chrome-timing-acceptance-role--2026-09-27): locally verified prospective policy, published `699395d`; no hosted qualification from that edit.
- Original R2-P1 run **36293797731**, attempt 1, candidate `f1a0f148445f34f8af1a57d0f69e2d27eb543b11`, remains FAIL with unavailable original executable and skipped downstream gates (ledger 23).
- H1 run **36310107481**, attempt 1, candidate `238aa9fde5bb15243912ae89abdc4bcf2c21af78`, remains FAIL with unknown upstream graphics cause (ledger 30). No pending operation.

R2-P1 remains incomplete. Windows native responsiveness/input evidence, final human
acceptance on both platforms, PR conflicts, integration and integrated 1H remain
separate. No renderer fix is justified by the old Chrome timing result alone.
Historical raw evidence remains preserved; no cleanup or new evidence reuse was performed.

## Validation and next approval boundary

Docs-only gates passed: `python3 scripts/validate.py` (**273 files**) and
`git diff --check`. Ref/PR/run inspection and self-review completed.
No application or test suite execution is claimed by this review.

**Next action:** select or amend ledger 34's bounded **R2-P1-Q1** proposal. Merely
continuing the branch or approving this review does not authorize its execution.
No CI, new builds/launches, test-selector/trigger changes, conflict resolution or merge
until that scope is explicitly selected. Do not dispatch the current unrestricted
workflow as a shortcut. If Q1 is selected, complete its prerequisite review before the
single dispatch and honor the manual-resume rule if the run outlasts the chat.
