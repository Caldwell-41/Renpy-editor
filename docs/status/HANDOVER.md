# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** **R2-P1-TEST-P2** Chrome timing acceptance policy `review_ready`.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/conflicting.
**Entry candidate:** `0f0ec69c30fe1ee9e64d68da872e4facd8c5f810`.
**Main:** `4d7ba0333c48d60242a9a42d3e079fea499a5531`.
The policy implementation and this record form one coherent `[skip ci]` checkpoint;
resolve its verified publication head from Git without a receipt-only commit.
No operation is pending. Final 1G remains unaccepted.

## Completed policy revision

Read [ledger 33](../tasks/active/phase-1g-branches-runtime-git.md#33-r2-p1-test-p2--chrome-timing-acceptance-role--2026-09-27)
and [TESTING](../TESTING.md#independent-browser-outcomes-in-the-production-workflow).
The user explicitly approved making Chrome Branches timings diagnostic after reviewing
native evidence. Timing overruns now retain failed budget status, original thresholds,
all samples and warning annotations, while functional/evidence failures still block.
Schema 3 separates the timing policy from the blocking process status. Both browser
outcomes must still succeed at the final workflow gate; missing/skipped/cancelled
checks do not pass. Core/service budgets retain their existing acceptance role.

The actual package runtime determines platform responsiveness: WKWebView on macOS,
WebView2 on Windows, with native observations and the existing measurement limits.
Chrome timing alone is no longer a prospective macOS acceptance blocker. No renderer
fix is justified solely by the unexplained virtual-M1 Chrome timing result.

Validation: typecheck and **64/64 frontend tests, zero skips**; browser syntax; **nine**
controlled completion/error/cleanup paths; YAML, **26** shell blocks, **25** final-gate
outcome combinations and **four** pipeline cases; repository validation **273 files**;
diff check and self-review passed. No new browser/app launch, package build, CI run,
dependency installation, renderer change, hostile/crash test or merge. Local replay
scripts/logs are retained under ignored `.toolchains/reports/r2-p1-test-p2/`.
These local checks do not claim hosted workflow or supported-package qualification.

## Retained evidence and remaining work

[MAC-N1 ledger 32](../tasks/active/phase-1g-branches-runtime-git.md#32-r2-p1-mac-n1--independent-packaged-responsiveness-assessment)
retains final probe/package `22fbf65d1c9db712d574657c53638b413436dee8` and all prior
failed attempts. Approved native superset: **506 sources / 105,627 bytes / 500 Scenes /
2,000 edges**. Physical M4 WKWebView first/second-rAF pan p95 **17/34 ms**, no >=100 ms
samples; independent native-input observation found no sustained freeze. This does
not prove physical input-to-display latency or all-Mac performance. Opening/save waits,
tiny Fit overview, mixed-input limits and two incidental extra normal starts are
recorded. All planned allowances are exhausted; no more launches/builds are authorized.
Core's original 503-file population remains separate. Final package and 102 input hashes
were audited. Raw evidence: ignored `.toolchains/reports/r2-p1-mac-n1/`.

Original R2-P1 [36293797731](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36293797731),
attempt 1, candidate `f1a0f148445f34f8af1a57d0f69e2d27eb543b11`, remains historical
FAIL: Windows SDK hashing stack overflow and macOS Chrome timing, with downstream gates
skipped. WIN-F1 ledger 27 retains the two heap-buffer fixes, six selected SDK checks and
five local Windows scenario passes; three of four F1 builds were used. Those fixes and
its remaining allowance are untouched. Original executable remains unavailable.

H1 [36310107481](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36310107481),
attempt 1, candidate `238aa9fde5bb15243912ae89abdc4bcf2c21af78`, remains historical FAIL.
Ledger 30 retains its verified artifact, every sample, long GPU waits and unknown
upstream cause. Raw audit: ignored `.toolchains/reports/r2-p1-mac-h1-audit/`. The old
result is not reclassified by this prospective policy. No H1 operation is pending.

R2-P1 remains incomplete because complete supported-target duration/reopen package
qualification is still missing. Final human acceptance and integration are also open.
PR conflicts have not been resolved. Native MAC-N1 performance evidence does not fill
skipped SDK/runtime gates or qualify Windows.

## Next action and approval boundary

**Review remaining R2-P1 package qualification coverage and propose the minimum bounded
supported-target run**, reusing applicable WIN-F1/MAC-N1 evidence under TESTING's policy.
That is the next planning step; execution scope must be selected before CI, new builds
or launches. No autonomous retry, matrix, renderer tuning, conflict resolution or merge
is authorized by TEST-P2. Publish, verify this checkpoint, then stop.
