# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** R2-P1-MAC-M1 probe correction/local proof, `review_ready`;
R2-P1 remains `blocked`. User acceptance and hosted qualification remain separate.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/unmerged,
conflicting against main. No conflict resolution or merge authorized/performed.
**Reviewed/tested candidate:** `86466aea1d02ed2534ab404939a85b7a7f15ee54`.
The checkpoint documentation accompanies it; resolve the published head from Git.
Main remains `4d7ba0333c48d60242a9a42d3e079fea499a5531`.

## Implemented and proved locally

Read [ledger 29](../tasks/active/phase-1g-branches-runtime-git.md#29-r2-p1-mac-m1-probe-correction-and-local-proof--2026-09-27)
for authorization, exact inputs, distributions, trace interpretation and limitations;
[ledger 28](../tasks/active/phase-1g-branches-runtime-git.md#28-r2-p1-mac-d1-macos-frame-budget-diagnosisreview--2026-09-27)
retains the diagnosis and original correction/proof plan.

The browser probe retains the original 30 dispatch-to-rAF samples and <100 ms p95
gate; adds 30 inputs alternating fitted x=40/0 with per-input visibility/geometry
checks; records first-rAF and separate second-rAF rendering-opportunity diagnostics.
Optional reports/captures/trace retain timing boundaries, browser/GPU/source identity,
no-input controls and failure/cleanup evidence. Production renderer/CSS is unchanged.
The second rAF and separate captures do not guarantee physical presentation at the
endpoint. [TESTING](../TESTING.md#branches-timing-interpretation) owns these semantics.

Exactly one untraced full probe and one traced diagnostic ran using existing Node
24.19.0, Playwright 1.63.0 and Chrome 154.0.8037.57 on ARM64 macOS 26.6.2 / Apple M4.
Both passed: original p95 **16.8/17.3 ms**, visible first-rAF **16.9/16.9 ms**, visible
second-rAF **33.6/33.6 ms**. Initial layout **42.8/142.9 ms**; visible maxima
**80.6/79.7 ms** remain recorded. All 120 input and 30 no-input intervals are retained;
full 500/2,000 workload, held-refresh navigation, release, 640px resize and page-error
assertions passed. Traced no-input p95 **32.1 ms**. No retry or installed tooling.

Trace confirms callbacks can precede paint; the longest visible interval overlaps
a 74.801 ms GPU wait. Captures show both transformed graph states. Instrumentation
can affect later browser work; overhead/causal limits are in ledger 29. Local Chrome
154 cannot qualify historical Chrome 152 or native WKWebView/human input.
Ignored raw evidence: `.toolchains/reports/r2-p1-mac-m1`, 12 hashed files plus manifest.
D1 evidence remains in `.toolchains/reports/r2-p1-mac-d1` unchanged. Syntax, repository
validation (270 files), whitespace and changed-path review passed. Source hashes
match both reports. All 14 recorded browser PIDs are absent and both server ports
closed. No browser, server, build or CI dispatch is pending from M1.

## Preserved Windows and qualification limits

WIN-D1 and WIN-F1 remain `review_ready`; see [ledger 26](../tasks/active/phase-1g-branches-runtime-git.md#26-r2-p1-win-d1-resumed-local-startup-diagnosis--2026-09-27)
and [ledger 27](../tasks/active/phase-1g-branches-runtime-git.md#27-r2-p1-win-f1-sdk-hashing-stack-correction--2026-09-27).
The two heap buffers, six ordinary SDK checks and all five local real-service
application scenarios remain preserved. Three of four WIN-F1 build runs were used;
the remaining allowance does not authorize macOS work. Windows raw evidence remains
in that host's `reports/r2-p1-win-d1`, fixed output `.cache/target-r2-p1-win-d1/release`.

Original [run 36293797731](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36293797731),
attempt 1, candidate `f1a0f148445f34f8af1a57d0f69e2d27eb543b11`, remains **FAIL**.
macOS job **108548848384**, artifact **10923840024**, p95 **109.9 ms**, max **860.3 ms**;
exact historical attribution remains unresolved. Original Windows startup failure,
unavailable original executable, skipped macOS SDK/package gates and final
supported-target/native-human acceptance remain explicit. No hostile/crash tests.

## Next bounded goal and publication

**R2-P1-MAC-H1 scope review only:** review M1 and prepare the concrete proposal for
exactly one macOS/browser-only hosted diagnostic, with workflow scope, unchanged
workload/budgets, trace evidence and stop rule. The existing quality profile runs
both targets and ordinary suites. Its scoped workflow correction and hosted dispatch
require explicit approval; no execution follows from this handover or next-chat prompt.

No CI dispatch, production matrix, automatic retry, budget relaxation, renderer work,
hostile/crash tests, merge/conflict resolution or human acceptance is authorized.
Ask before downloading/installing new tooling if existing tools cannot answer a
specific blocker. No tool is presently missing for the local proof.

Publish the reviewed candidate and checkpoint docs to the existing branch/PR, using
`[skip ci]` under the no-dispatch boundary. CI skips are not passes. The final response
reports the remotely verified head; no receipt-only commit is needed. No raw evidence
or unrelated work is included in publication.
