# Current status

**Updated:** 2026-10-07. **Branch:** acceptance/phase-1h-vertical-slice.
**Phase 1G: accepted, integrated, complete. Phase 1H: awaiting_ci.**

Phase 1G merged through [PR #17](https://github.com/Caldwell-41/Renpy-editor/pull/17)
at `295a189925ac5c9c8655569cb29dd10236d7201d`. Windows x64/macOS ARM64 production
37461862928/1, quality and native/human interaction were accepted; integrated package
inputs remained exact. Main remains `42ca6f9`. [Archived closeout](../tasks/archive/2026-10-06-ui-design-review.md#phase-1g-integration-and-closeout--2026-10-06)
retains unique failures and Mac timing/native-input/assistive-tech/unsigned limits.

Phase 1H draft [PR #18](https://github.com/Caldwell-41/Renpy-editor/pull/18) owns the
representative integrated fixture and acceptance to `review_ready`. Corrective
[37522794804/1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37522794804)
tested exact `9df1d25a61f3e7953ff06acb89155e9829e52fb5` and finished failure.
Both targets passed all 46 named ordinary regressions, separate SDK gates, three
integrated positive cases at 29/29 assertions each, rejecting control and three
enforced flow samples. Artifact/package/input hashes were verified. Mac passed all
required production gates; its Chrome timing remains diagnostic Fail. Windows passed
five packaged UI cases but failed the sixth, UI-refresh, at Source draft retention;
cleanup and privacy passed, boundary and dependency inventory were skipped.

Test-only correction started at `efd8a6bdfd3655b7c3b7a65d989b240eff03d8a5`; final
shared-deadline checkpoint waits for the renderer
acknowledgement before direct probe reads. Focused browser controls reproduce the old
collision, prove corrected exact-input retention/all 11 checks, and still reject a
refused write. Existing UI browser suite, syntax/Q1/retention checks Pass. Hosted cause
and changed-probe native qualification remain unresolved; no product assertion is
waived or prior SHA accepted automatically. [Terminal audit/correction](../tasks/active/phase-1h-vertical-slice-acceptance.md#terminal-corrective-matrix-and-source-probe-correction)
retains both failed matrices and cumulative attempts.

**Pending:** the single user-approved fixed-probe dispatch succeeded as
[37529174148/1](https://github.com/Caldwell-41/Renpy-editor/actions/runs/37529174148),
exact `ba01a84cd7f860be6e8717e98216bdf747875073`, with package retention. No result yet.
Previous and new allowances are consumed; no further matrix/retry or merge. **Next:**
manual same-chat terminal audit to `review_ready`; no model polling. [HANDOVER](HANDOVER.md)
owns exact continuation. Planning worktree `2c5a164` and two unpublished commits remain
untouched. Phase 1 closure, Phase 2 and optional Git are not selected.
