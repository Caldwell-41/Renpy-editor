# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** R2-P1-TEST-P1 testing correction `review_ready`; next is the
user-requested separate-agent **R2-P1-MAC-N1** local packaged assessment.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/unmerged,
conflicting against main. No conflict resolution or merge authorized.
**Entry head:** `2085f35f899820e1c05d02dfb9a314d8bb0b9661`.
**Application/probe candidate:** `86466aea1d02ed2534ab404939a85b7a7f15ee54`, unchanged
by TEST-P1. Main: `4d7ba0333c48d60242a9a42d3e079fea499a5531`.
Resolve the verified publication head from Git; do not make a receipt-only commit.

## Approved continuation

Read [ledger 31](../tasks/active/phase-1g-branches-runtime-git.md#31-r2-p1-test-p1--testing-correction--2026-09-27),
then [MAC-N1 brief, ledger 32](../tasks/active/phase-1g-branches-runtime-git.md#32-r2-p1-mac-n1--independent-packaged-responsiveness-assessment)
and [TESTING](../TESTING.md#supported-runtime-responsiveness-and-diagnostic-boundaries).
The user approved the reviewed testing updates, then explicitly requested another
agent to assess whether packaged Loomlight actually feels and measures slow on its
supported platform. MAC-E1's hosted Chrome pair is no longer the selected next action.

TEST-P1 keeps both browser gates and their thresholds. Runtime and Branches steps
record separate outcomes; a mandatory final gate fails unless both succeeded, after
allowing independent SDK/package checks to proceed. Other prerequisite failures still
retain normal dependent-step behavior. Triggers and success-only package upload remain
unchanged. Local YAML/shell validation passed: 26 shell blocks, 25 outcome combinations
and four controlled pipeline cases, plus unchanged-step/trigger checks. Repository
validation passed 270 files and whitespace/self-review passed. Raw local validation
and hashes are recorded in ledger 31. This workflow amendment has not been exercised
in hosted CI. No package was built and no performance pass is claimed here.

MAC-N1 owns the smallest full-workload packaged probe extension and its independent
assessment on the available macOS ARM64 host. Existing runtime probes have a small
three-node fixture, not an equivalent 500-node native performance check. Use real
WKWebView/IPC/services and disposable synthetic data, preserve the full workload and
budgets, predeclare endpoints and retain all samples. rAF endpoints are proxies, not
proof of physical presentation. Agent-observed usability, native input and final human
acceptance must remain distinguishable. Do not claim Windows evidence from this Mac.

**MAC-N1 allowance:** at most two local release build attempts, three automated
packaged launches and one agent-operated interactive session up to 15 minutes; see
ledger 32 for the precise measurement/stop contract. Use existing tools and ask before
installing more. No renderer/product fixes, CI dispatch, hostile/crash testing, budget
relaxation, Chrome-gate waiver, conflict resolution or merge. Do not spend WIN-F1's
unused build allowance. Publish the result and live handover, then stop.

## Retained failures and missing acceptance

R2-P1 remains **blocked** and final 1G unaccepted. Original run
[36293797731](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36293797731),
attempt 1, candidate `f1a0f148445f34f8af1a57d0f69e2d27eb543b11`, remains FAIL:
Windows SDK-hashing stack overflow; macOS Chrome p95 109.9 ms / max 860.3 ms, with
later SDK/package gates skipped. Original executable is unavailable. WIN-F1 ledger 27
retains the two-buffer correction, six selected SDK checks and five local Windows
scenario passes. Source is unchanged here; three of four F1 builds were used.

[H1 ledger 30](../tasks/active/phase-1g-branches-runtime-git.md#30-r2-p1-mac-h1-combined-review-and-hosted-diagnostic--2026-09-27)
retains terminal failed run **36310107481**, attempt **1**, exact candidate
**238aa9fde5bb15243912ae89abdc4bcf2c21af78**, job **108594276410**. Artifact
**10928671828**, **1,366,696 bytes**, SHA-256
`478dfc0afb23593c7a086f970fb5849a53ad30eb53a5dcba046e80e232fedafd` and all nine
manifested payload hashes passed audit. Chrome 152 / virtual M1 original p95 was
123.6 ms, visible second-rAF 181.6 ms, no-input second-rAF 148.8 ms. Long GPU waits
and late frames explain observed intervals, but the precise upstream cause is unknown;
no justified renderer fix was found. Functional assertions and cleanup passed.

The single H1 dispatch/launch allowance is exhausted; no operation is pending.
Raw audit and replayable analysis remain under ignored
`.toolchains/reports/r2-p1-mac-h1-audit`, with 17 hashed files. Local M1 Chrome154/M4
passes remain in ledger 29 and cannot waive H1. Preserve those and earlier raw evidence.
Skipped package/SDK gates, exact historical attribution, supported-target qualification,
final human acceptance and integration remain open. A native result will inform the
next decision; it cannot silently replace a failed gate or complete final acceptance.
