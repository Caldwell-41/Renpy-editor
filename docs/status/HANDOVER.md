# Current checkpoint handover

**Prepared:** 2026-09-27. **Repository:** Caldwell-41/Renpy-editor.
**Checkpoint:** R2-P1-WIN-F1, `review_ready`; fix and local verification complete.
Completed Windows diagnosis R2-P1-WIN-D1 is also `review_ready`.
**Branch:** feature/phase-1g-branches-runtime.
**Draft PR:** [#17](https://github.com/Caldwell-41/Renpy-editor/pull/17), open/unmerged,
conflicting against main. Do not redispatch, resolve conflicts or merge.
**Authority:** the user approved the concrete two-buffer fix and testing after D1,
then requested no aggressive/hostile testing. The deliberate-crash child harness
was removed. Use ordinary checks and the existing application scenarios only.
The four additional build runs cover F1: three used, one unused.
**Entry source:** `cc93b90b3acc04acbe9f6f44cd05d928da794313`; original failed CI
candidate `f1a0f148445f34f8af1a57d0f69e2d27eb543b11`. Only `renpy.rs` changed in the
application. Resolve the final published commit from Git; no receipt-only commit.

## Fix and reviewed diagnosis

Read [ledger 26](../tasks/active/phase-1g-branches-runtime-git.md#26-r2-p1-win-d1-resumed-local-startup-diagnosis--2026-09-27)
for the four-launch diagnosis and [ledger 27](../tasks/active/phase-1g-branches-runtime-git.md#27-r2-p1-win-f1-sdk-hashing-stack-correction--2026-09-27)
for approval, the testing-scope correction, hashes and final verification.

`sha256_file`'s 1 MiB stack array produced a **1,049,000-byte frame**, exceeding the
Windows main thread's **1,048,576-byte reserve**. Matching private PDB symbols and
offline dump review locate the exception in `__chkstk` at that function's prologue,
called by probe SDK archive verification. The baseline ordinary empty-profile launch
survived a 15-second observation; its compile probe exited **3221225725**.

The approved fix directly heap-allocates the 1 MiB buffers in `sha256_file` and
`hash_regular_tree`. Hash chunking/framing, request controls and filesystem behavior
are unchanged. The default executable stack remains unchanged. Two new ordinary
unit tests cover multi-chunk/empty/missing inputs and cancellation/deadline behavior.
No new tool, dependency version, workflow, native automation or broader redesign.
The durable lesson is in [TESTING](../TESTING.md#sdk-hashing-regression).

## Verification and evidence

Six selected ordinary SDK tests passed; formatting and repository checks passed.
The final release and **all five existing real-service application cases passed**:
compile, lint, route-a, route-b and runtime-error. Every case exited 0 without timeout
and confirmed cleanup. Both routes passed graph-destination/disk reopen and observed
about 9.5 seconds running. Exact results and the retained Route B WebView shutdown
warning are recorded in ledger 27. Final OS inspection found no task-created
application/debugger/WebView/SDK process; no operation is outstanding.
No broad core, hostile/race or deliberate process-crash suite was run after the
user narrowed scope. Earlier intentional crash results remain local evidence, not
part of the final test harness. The reported interface text "This content cant be
shown" has no confirmed cause; no matching recent Defender detection was found.

Fixed executable SHA-256:
`76d6fd49f0ac1c6e90eb1560097254235f804fa55a83aa662995082aaba246cd`.
Tested `renpy.rs` SHA-256:
`e3e38e879e1b9551cebb2a86f4e1587442979c001bc38028417b1b049019e856`.
All 101 tracked input hashes, build config and app diff hash are retained locally.
These are local custom-protocol release results with a disposable identifier/profile,
not installer packaging, original-CI binary identity or native human acceptance.

Workspace `reports/r2-p1-win-d1` preserves D1 and F1 logs, identities, launch records,
baseline/diagnostic executable-PDB pairs, diagnostic dump and successful offline
review. Fixed output is in `.cache/target-r2-p1-win-d1/release`. Raw evidence, SDKs,
disposable data and machine paths stay outside Git. Prepared tools remain available
through workspace `enter-debug.ps1`; no installation is required for continuation.

## Remaining qualification and next bounded decision

Original [run 36293797731](https://github.com/Caldwell-41/Renpy-editor/actions/runs/36293797731),
attempt 1, remains terminal **FAIL**; see ledger 23. The macOS Branches frame p95
**109.9 ms** against <100 ms is still unexplained; downstream package gates were
skipped. R2-P1 and final G1/R1/R2/human acceptance remain incomplete.

The next selection should be a review and plan for the remaining macOS frame-budget
failure. That planning step grants no implementation, CI dispatch, package rerun,
budget relaxation, hostile testing,
human acceptance, conflict resolution or merge. Preserve the failed CI evidence
and the now-corrected Windows diagnosis rather than automatically rerunning CI.
