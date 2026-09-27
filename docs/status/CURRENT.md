# Current status

**Updated:** 2026-09-27.
**Current checkpoint:** R2-P1-MAC-N1 independent packaged macOS assessment `blocked` at preflight (ledger 32): the exact 503-source core fixture cannot open through the real packaged lifecycle. Approval for a disclosed 506-source superset is pending; no N1 release build or package launch occurred. TEST-P1 remains `review_ready` (ledger 31). H1 remains FAIL; R2-P1 stays `blocked`. G1-OBS and WIN-F1 retain their evidence; final 1G remains unaccepted.
**R2-P1 candidate:** `f1a0f148445f34f8af1a57d0f69e2d27eb543b11`.
**R2-P1 run:** [36293797731](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36293797731), attempt 1, terminal FAIL: Windows packaged startup stack overflow; macOS Branches frame p95 109.9 ms >100 ms. See ledger 23.
**Branch:** feature/phase-1g-branches-runtime, draft/open
[PR #17](https://github.com/Caldwell-41/Renpy-editor/pull/17).
**G1-OBS implementation candidate:** 1fab71e0e3b1ce18ee3cc5b22ab5940269a2ff88.
**G1-OBS qualification candidate:** a6063080006769613733de20fcd82265bf96b632.
**G1-OBS native qualification:** corrected [36291545085](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36291545085), attempt 1, both target jobs passed and artifacts verified. Earlier 36289951468 passed under unpinned npm; its results and frame outlier are preserved in ledger 22.
Read [HANDOVER](HANDOVER.md), [ADR 0010](../adr/0010-local-project-safety-and-observed-flow.md)
and [ledger 22](../tasks/active/phase-1g-branches-runtime-git.md#22-g1-obs-observed-branches-implementation--2026-09-27).

Branches now uses session-owned observed source inputs with accepted-mutation
invalidation. Open/focus/Refresh acquires disk observations, Source reconciliation
retains drafts/conflicts, and status distinguishes last check, saved edits and failed
refresh. Graph navigation, writes and execution keep their independent authority.
The Branches timer/all-source verification pass is removed. Historical native/timed
namespace experiments remain preserved and explicitly specialist, with ordinary
path/link, external-writer, recovery, session and process/privacy regressions retained.

Corrected Windows/macOS G1-U2 passed all three fixed samples per target: accepted
updates 14.60–30.76 ms, disk observation/refresh 32.07–393.87 ms. Full browser pan p95
was 15.6 ms Windows / 94.2 ms macOS; macOS retained one 126 ms frame and the earlier
run's 1,058.6 ms outlier. Synchronous dispatch stayed below 1 ms during held refresh.
Each target passed 60 UI tests and ordinary core/write/recovery cases. Ledger 22
records SDK skips, historical exclusions, exact measurements and verified archives.
These are core/Chromium results; final packaged/native human acceptance remains open.

G1-OBS is complete at its selected boundary. The user accepted R2-P1: strengthen the
existing duration/graph-reopen package proof, run one production matrix and audit
results; see ledger 23. That matrix is terminal and its artifacts are audited. Both
archives and all 29 extracted files were verified; all 101 Windows input hashes match
the candidate. No executable artifact is available for independent rehash. Windows
SDK/service tests passed, but all five packaged cases exited with main-thread stack
overflow before reporting. macOS skipped downstream SDK/package gates after its
frame-budget failure. Supported-target qualification of the new duration/reopen
assertions remains incomplete; later local Windows evidence is recorded below.
No earlier operation is pending. Resumed R2-P1-WIN-D1 is `review_ready` (ledger 26): one
baseline and one symbol-enabled release build, four launches, and an offline dump
review locate the failure in `renpy::sha256_file`. Its 1 MiB stack buffer creates a
1,049,000-byte frame exceeding the Windows executable's 1,048,576-byte main-thread
reserve. Ordinary startup with an empty disposable profile survives a 15-second
window observation; the same baseline's compile probe reproduces exit 3221225725.
Normal SDK operations share the hashing code, so this is not a probe-only defect.
The original four-launch D1 cap is exhausted. Earlier prerequisite/setup records
remain in ledgers 24–25; prepared tools sufficed and no new tool was installed.
The user then approved R2-P1-WIN-F1 (ledger 27): both SDK hashing buffers are now
heap-allocated, with ordinary hashing/control regressions. Six selected SDK checks,
the fixed local release build and all five existing application scenarios passed,
with cleanup confirmed. Both routes passed graph/disk reopen and >8 s runtime
assertions locally. F1 is `review_ready`; three of four additional build runs were
used. The user excluded aggressive/hostile testing; the initial deliberate-crash
harness was removed and no
broad hostile/race suite was run. No redispatch, human acceptance, merge-conflict
resolution, optional Git or Phase 2 is authorized. macOS diagnosis is now recorded in
ledger 28: the probe times dispatch-to-rAF
rather than confirmed presentation and pans the graph offscreen after its second
input. Local tracing demonstrates browser/compositor waits without new input; exact
causation of the historical CI stalls remains unproven. Original 109.9 ms failure
and unchanged 100 ms budget remain. MAC-M1's approved probe correction is now implemented in candidate
`86466aea1d02ed2534ab404939a85b7a7f15ee54`; see ledger 29. It retains the original
30-sample <100 ms gate, adds 30 visibly bounded inputs and separate first/second-rAF
diagnostics, and records geometry, source identity, captures and optional trace.
Exactly two local Chrome 154 launches passed: original p95 16.8/17.3 ms, visible
second-rAF p95 33.6/33.6 ms. All full-workload/navigation/refresh/resize assertions
passed; all input samples and graphics waits remain retained. Trace/captures show
transformed rendering but do not prove physical presentation at the endpoint or
qualify historical Chrome 152 CI. Both sessions are closed. WIN-F1, renderer/CSS,
workflows and dependencies are unchanged; no tool installation or CI dispatch.
The user subsequently approved combining H1 scope review and one macOS/browser
hosted diagnostic. Reviewed workflow candidate `238aa9fde5bb15243912ae89abdc4bcf2c21af78`
is published. Its one diagnostic [36310107481](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36310107481),
attempt 1, is terminal FAIL: original p95 **123.6 ms**, visible second-rAF p95
**181.6 ms**, no-input control p95 **148.8 ms**. Functional assertions, geometry,
cleanup and artifact upload passed; archive, nine manifested files and all 90 samples
were verified. Trace shows long GPU command-scheduling waits and late frame delivery
with no new rendering work on Chrome 152 / virtual M1. Exact browser/host/instrumentation
causation remains unresolved; no justified repository fix was found. The user's resumed
fix-if-possible request produced a diagnosis, not speculative renderer/flag/budget changes.
No H1 operation is pending. H1 audit is review-ready; R2-P1 stays blocked. The user
subsequently selected the testing correction and independent native packaged
assessment in ledgers 31–32, superseding MAC-E1 as the next action. Chrome failures
remain blocking overall, but will no longer suppress the independent SDK/package steps
through their normal failure path. Native measurement and observed usability remain
separate evidence; no new CI run or gate waiver is authorized.
Historical worktree and raw evidence remain preserved.

## Preserved baseline and earlier closure

- Integrated application: Phase 0, corrected Phase 1A–1F and CI-SIMPLE. Phase 1F is
  accepted/merged through [PR #14](https://github.com/Caldwell-41/Renpy-editor/pull/14).
  Integrated closeout `973e3565d7cf41c6dca936df088ced10969821ac`; existing post-merge
  [35821582755](https://github.com/Caldwell-41/Renpy-editor/actions/runs/35821582755)
  passed both targets and is closed. The six original Save passes and native F4 A/B/C
  reports remain preserved in [1F ledger 7.28–7.30](../tasks/archive/2026-09-23-phase-1f-save-correction.md#728-corrected-packages-and-native-f4-evidence).
  DIST-MAC-01 remains a later distribution limitation.
- Phase 1G.1 candidate `fde8cdafd77fe807f2307fb607fc7546ca66ffec` and targeted Linux
  evidence remain preserved; final target acceptance is separate.
- R1-B1/B2 closure: `c12d953548992adc60b38682d0dcfda8cdeb9f94`, tree
  `3f8f6e769672572b008b2ffb4f283888afecfc31`, native run `36148942247`, attempt 1,
  both targets passed with complete logs/artifacts and all 60 input hashes verified.
  Earlier prerequisite `36126490939` and production `36136466567` evidence is distinct;
  see [ledger 13](../tasks/active/phase-1g-branches-runtime-git.md#13-1g2a-execution-ledger).
  Final-source regression remains part of 1G.2b.
- Main inspected for this review: `4d7ba0333c48d60242a9a42d3e079fea499a5531`.
  Its bounded workflow-dispatch addition is already represented on the feature branch.
  No integration was performed here. Phase 1G is not merged.
- [Optional Git](../tasks/active/optional-local-git.md) remains deferred, not a
  Phase 1/1H or Phase 2-entry requirement. Editing during play remains script-only;
  asset mutations require Stop. One final human 1G session follows agent verification.
