# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** R2-P1-MAC-H1 combined scope review and one hosted diagnostic,
`in_progress`; R2-P1 remains `blocked` after the original failed matrix.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/unmerged,
conflicting against main. No conflict resolution or merge authorized/performed.
**Entry head:** `61429a8db7e3a2b6e26473bb80c27bce296b2b03`.
**Application/probe candidate:** `86466aea1d02ed2534ab404939a85b7a7f15ee54`, unchanged.
Main: `4d7ba0333c48d60242a9a42d3e079fea499a5531`. Resolve the new workflow candidate
from the verified publication; dispatch receipt follows before waiting.

## Approved combined checkpoint

The user asked to combine the next scope-review prompt and item 1 (scoped workflow
implementation, one macOS hosted diagnostic and assessment) in the same go. This
supersedes the prior no-dispatch boundary only for this one diagnostic. Read
[ledger 30](../tasks/active/phase-1g-branches-runtime-git.md#30-r2-p1-mac-h1-combined-review-and-hosted-diagnostic--2026-09-27)
for the exact scope, review and gates; [ledger 29](../tasks/active/phase-1g-branches-runtime-git.md#29-r2-p1-mac-m1-probe-correction-and-local-proof--2026-09-27)
retains M1's implementation/local proof and [ledger 28](../tasks/active/phase-1g-branches-runtime-git.md#28-r2-p1-mac-d1-macos-frame-budget-diagnosisreview--2026-09-27)
retains the original diagnosis and decision rule.

`quality.yml` now has manual `phase1g_macos_browser_diagnostic=true`; both existing
profile/candidate inputs must be false. It selects only one macos-26 job with existing
pinned Node/npm/locked dependencies and installed runner Chrome. Artifact 10923840024
from run 36293797731 supplies the exact retained service fixture after metadata,
archive and fixture checksum validation. One unchanged M1 probe launch captures trace,
30 original inputs, 30 visible inputs and 30 no-input controls. Reports, trace,
captures, identity, cleanup audit and SHA-256 manifest upload even on failure.
No Windows, core suite, SDK/package build, browser install or hostile/crash test.

Offline workflow checks passed: 24 selector combinations, six shell blocks, two
Python blocks, retained-fixture verification and cleanup/manifest audit against M1
reports. Existing jobs are unchanged except selection exclusion. Repository validator
(270 files), whitespace and scope checks passed. No new local runtime tests were needed.
The exact candidate must be published/verified before the single manual dispatch.
No automatic retry; absent/ambiguous dispatch identity requires inspection, not rerun.

## Retained results and exclusions

M1's two fixed local Chrome 154 launches passed: original p95 16.8/17.3 ms, visible
second-rAF p95 33.6/33.6 ms. Callback/trace/capture semantics remain diagnostic, not
physical presentation or native WebView acceptance. Both local sessions are closed.
WIN-F1 remains unchanged, with six ordinary SDK checks and five local Windows service
scenarios preserved in [ledger 27](../tasks/active/phase-1g-branches-runtime-git.md#27-r2-p1-win-f1-sdk-hashing-stack-correction--2026-09-27).
Three of four WIN-F1 builds were used; the unused allowance does not authorize H1.

Original [run 36293797731](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36293797731),
attempt 1, candidate `f1a0f148445f34f8af1a57d0f69e2d27eb543b11`, remains FAIL:
Windows startup stack overflow and macOS p95 109.9 ms / max 860.3 ms. Skipped macOS
SDK/package gates, unavailable original executable, exact CI attribution and final
supported-target/package/human qualification remain open. No prior failure is waived.

## Dispatch and stop boundary

Next operation within approved H1: publish/verify this workflow candidate, dispatch
`quality.yml` exactly once on the recorded branch with only the macOS diagnostic flag,
record exact run/attempt/SHA and publish the pending-operation receipt. Assess if
already terminal; otherwise use a manual-resume handover under AGENTS/WORKFLOW. No
qualified same-thread automatic wake-up is configured; do not keep polling or claim one.

One diagnostic dispatch/launch only; no production matrix, retry, renderer correction,
budget relaxation, hostile/crash test, additional tool installation, conflict resolution
or merge. A failed/inconclusive result is preserved for a separately bounded decision.
Final qualification and human acceptance are later checkpoints. `[skip ci]` publication
avoids unrelated PR runs; it does not replace the explicitly authorized manual diagnostic.
