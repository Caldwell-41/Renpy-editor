# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** **R2-P1-MAC-N1** independent packaged assessment `review_ready`.
R2-P1 remains blocked; final 1G remains unaccepted. No operation is pending.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/unmerged,
conflicting against main. No conflict resolution or merge authorized.
**Final probe/package candidate:** `22fbf65d1c9db712d574657c53638b413436dee8`.
**Initial probe candidate:** `9b0969416b7924dde1751ca5255bd977b7fba0d7`.
**Main:** `4d7ba0333c48d60242a9a42d3e079fea499a5531`.
Resolve the verified publication head from Git without a receipt-only commit.

## Completed assessment and limits

Read [ledger 32](../tasks/active/phase-1g-branches-runtime-git.md#32-r2-p1-mac-n1--independent-packaged-responsiveness-assessment)
and [TESTING](../TESTING.md#supported-runtime-responsiveness-and-diagnostic-boundaries).
The user approved adding three empty lifecycle-required scripts and continuing.
Real opening, complete graph, Source inventory and exact-byte fixture proof passed:
**506 sources / 105,627 bytes / 500 Scenes / 2,000 edges**. The original 503-file core
fixture remains separate. No project code or SDK ran.

On the physical M4 Mac, the final packaged WKWebView run retained 30 pan and 30 idle
samples. Pan first/second-rAF p95 **17/34 ms**, maximum **17/34 ms**, no sample >=100 ms;
all geometry/focus/full-workload assertions passed. These are callback proxies, not
physical presentation latency or complete G1-V2 acceptance. Separate UI samples:
open **1,368 ms**, initial Branches **302 ms**, Refresh feedback **83 ms**, accepted
Choice save feedback **467 ms**, return to Branches **220 ms**. Real flow refresh IPC
was 45 ms and post-edit observed-model IPC 15 ms; saved caption survived a new session,
disk refresh and Source reopen. They are not core-only timers. The separate three
original-fixture core samples passed: initial/refresh 27.7–30.8 ms, accepted model
updates 15.0–16.3 ms, under unchanged <2 s / <250 ms limits.

The 289.803-second native-input session confirmed zoom, pan, refresh, Scene/Source
navigation and resize after the user released the window. No sustained freeze was
observed. Initial actions overlapped user input and are inconclusive; brief jank is
not ruled out by snapshots. Fit at 500 Scenes produces a tiny overview and may clip
vertically at minimum zoom. Opening and save feedback have perceptible waits.
Screenshots are in chat tool evidence; local audit notes are hashed in the ledger.

Earlier launch 1 failed a premeasurement rAF deadline; launch 2 never reached Start
before the foreground gate timed out during native-driver attachment. Both failures
and the two earlier preflight failures remain preserved. The final successful launch
is not substituted for them. Both release builds succeeded; all 102 recorded input
hashes and the final package executable were audited. Frontend 60/60, focused fixture
1/1, selected release core 1/1 (three samples), final package checks and independent
sample/hash audits passed. Process audit found no Loomlight or known owned process
remaining. Native-driver attachment created two extra empty normal app instances
beyond the strict launch allowance: a disclosed procedure deviation, with no extra
timing samples or private project opened. Both were closed.
Disposable fixture profiles are retained for evidence.

Raw reports, exact inputs, all samples and replayable audits are under ignored
`.toolchains/reports/r2-p1-mac-n1/`; ledger 32 contains the 38-file manifest hash,
package identities, failed attempts, commands and limitations. Source support and
this assessment are published together on the existing branch with `[skip ci]`.
No renderer/CSS, WIN-F1, dependency or workflow change, CI dispatch, hostile/crash
test, gate waiver or merge occurred.

## Next action and approval boundary

**Review the native evidence and select the next bounded qualification or acceptance-
policy step.** This host's evidence does not explain the virtual-M1 Chrome failure,
qualify Windows, waive a gate or supply final human acceptance. No justified product
performance fix follows from this evidence alone. Further builds/launches, CI or a
Chrome-gate role change need a separately reviewed decision.

MAC-N1 planned allowances are exhausted: **2/2 release attempts, three automated
probes, one interactive session**, plus the two unplanned ordinary starts disclosed
above. No autonomous retry or next checkpoint. Preserve WIN-F1's
separate allowance and all failed evidence. Publish, verify the branch, and stop.

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
final human acceptance and integration remain open. The MAC-N1 native result informs the
next decision; it cannot silently replace a failed gate or complete final acceptance.
